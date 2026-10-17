/* Syllabus reading: PDF/text to plain text (pdf.js, runs in the browser), then a rule-based parser for the
   "Simple Syllabus" layout UA uses. The Claude adapter (js/adapters.js) can replace the parser with no UI change. */
window.Trunk = window.Trunk || {};
(function (T) {
  /* ---------- file to text ---------- */
  function loadPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/pdf.min.js'; s.onload = () => res(window.pdfjsLib); s.onerror = () => rej(new Error('The PDF reader could not load.'));
      document.head.appendChild(s);
    });
  }
  async function pdfToText(file) {
    const lib = await loadPdfjs();
    const emb = document.getElementById('pdf-worker-src');
    lib.GlobalWorkerOptions.workerSrc = emb ? URL.createObjectURL(new Blob([emb.textContent], { type: 'text/javascript' })) : 'js/vendor/pdf.worker.min.js';
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const out = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const tc = await (await doc.getPage(p)).getTextContent();
      let line = '', lastY = null, lastEnd = null, lastH = 10;
      for (const it of tc.items) {
        if (!it.str && !it.hasEOL) continue;
        const y = it.transform[5], x = it.transform[4], h = it.height || lastH;
        if (lastY !== null && Math.abs(y - lastY) > h * 0.5) {
          out.push(line); line = '';
          if (Math.abs(y - lastY) > h * 1.9) out.push('');
          lastEnd = null;
        }
        if (lastEnd !== null && x - lastEnd > h * 0.2 && !/\s$/.test(line) && !/^\s/.test(it.str)) line += ' ';
        line += it.str; lastY = y; lastEnd = x + (it.width || 0); lastH = h;
      }
      out.push(line, '');
    }
    return out.join('\n');
  }
  /** Any uploaded file to text. PDFs go through pdf.js, everything else is read as text. */
  T.fileToText = async function (file) {
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return pdfToText(file);
    return file.text();
  };

  /* ---------- parser ---------- */
  const HEADINGS = ['Contact Information', 'Course Description', 'Prerequisite(s)', 'Other Course Materials', 'Required Texts', 'Recommended Texts', 'Student Learning Outcomes', 'Outline of Topics', 'Exams and Assignments', 'Grading Policy', 'Policy on Missed Exams and Coursework', 'Attendance Policy', 'Generative AI Tools', 'Required Software', 'Notification of Changes', 'Statement on Academic Misconduct', 'Statement On Disability Accommodations', 'Severe Weather Protocol', 'Pregnant Student Accommodations', 'Religious Observances', 'UAct Statement'];
  const SMALL = new Set(['of', 'with', 'and', 'to', 'for', 'the', 'in', 'on', 'a', 'an', 'via', 'or']);
  const KEEP = new Set(['VHDL', 'FPGA', 'ASIC', 'CMOS', 'NMOS', 'ECE', 'CAD', 'LED', 'IC', 'USB', 'PDF', 'CS', 'IEEE']);
  const titleCase = (t) => t.toLowerCase().split(/(\s+|\/|\()/).map((w, i) => {
    const up = w.toUpperCase();
    if (KEEP.has(up) || /\d/.test(w)) return up;
    if (i > 0 && SMALL.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');

  function cleanTitle(raw) {
    let t = raw.replace(/\s+/g, ' ').trim();
    const parts = t.split(' / '); t = parts[parts.length - 1];
    const m = /^(.*?)\s*E-?BOOK\s*\((.+?)\/(.+)\)$/i.exec(t);
    if (m) return { name: `${titleCase(m[3].trim())} (${titleCase(m[2].trim())}), eBook`, digital: true };
    return { name: titleCase(t), digital: /e-?book|access code|online/i.test(raw) };
  }
  const typeOf = (name) => /calculator/i.test(name) ? 'calc' : /goggles|lab coat/i.test(name) ? 'safety' : /access (code|granted)|online code/i.test(name) ? 'access' : /kit|lab|manual|breadboard|notebook/i.test(name) ? 'lab' : 'textbook';

  /** Returns {code, section, name, term, credits, instructor, items, notes, sections}. */
  T.parseSyllabus = function (raw) {
    const all = raw.replace(/\r/g, '').split('\n').map((l) => l.trim());
    const lines = all.filter((l) => !/simplesyllabus\.com|Simple Syllabus$|^\d+\/\d+$/.test(l));
    const out = { code: '', section: '', name: '', term: '', credits: '', instructor: '', items: [], notes: [], sections: [] };

    // header: "ECE 380-001-Digital Logic"
    for (const l of lines.slice(0, 40)) {
      const m = /^([A-Z]{2,4})\s?(\d{3})(?:\s*-\s*(\d{2,3}))?\s*[-–]\s*(.+)$/.exec(l);
      if (m) { out.code = `${m[1]} ${m[2]}`; out.section = m[3] || ''; out.name = m[4].trim(); break; }
    }
    if (!out.code) { const m = /\b([A-Z]{2,4})\s?(\d{3})\b/.exec(raw); if (m) out.code = `${m[1]} ${m[2]}`; }
    const term = /\b(Fall|Spring|Summer|Winter)\s+(20\d{2})\b/.exec(raw); if (term) out.term = `${term[1]} ${term[2]}`;
    const cr = /Credit Hours:\s*(\d+)/i.exec(raw); if (cr) out.credits = cr[1];
    out.instructor = (lines.slice(0, 40).find((l) => /^(Dr\.|Prof(essor)?\.?|Mr\.|Ms\.|Mrs\.)\s+\S+/.test(l)) || '').trim();

    // sections by known headings, or Title Case lines after a blank line
    const isHeading = (i) => {
      const l = lines[i];
      if (HEADINGS.some((h) => h.toLowerCase() === l.toLowerCase())) return true;
      return false;
    };
    const idx = [];
    lines.forEach((_, i) => { if (isHeading(i)) idx.push(i); });
    const sec = {};
    idx.forEach((start, k) => { sec[lines[start].toLowerCase()] = lines.slice(start + 1, idx[k + 1] !== undefined ? idx[k + 1] : lines.length).filter((l) => l !== ''); });
    out.sections = idx.map((i) => lines[i]);

    // Required / Recommended Texts: TITLE, Subtitle:, ISBN:, Required or Recommended:
    const texts = [...(sec['required texts'] || []), ...(sec['recommended texts'] || [])];
    let cur = null, last = 'title';
    const flush = (req) => {
      if (!cur || !cur.title) { cur = null; return; }
      const c = cleanTitle(cur.title);
      out.items.push({ name: c.name, type: typeOf(c.name), isbn: (cur.isbn || '').replace(/\s/g, ''), digital: c.digital, optional: /recommended/i.test(req || ''), src: 'syllabus', rawTitle: cur.title });
      cur = null; last = 'title';
    };
    for (const l of texts) {
      let m;
      if ((m = /^Required or Recommended:\s*(.*)$/i.exec(l))) { flush(m[1]); continue; }
      if ((m = /^ISBN:\s*(.*)$/i.exec(l))) { cur = cur || { title: '' }; cur.isbn = m[1]; last = 'isbn'; continue; }
      if (/^Subtitle:/i.test(l)) { last = 'subtitle'; continue; }
      if (/^(Author|Edition|Publisher|Price):/i.test(l)) { last = 'meta'; continue; }
      if (last === 'subtitle' || last === 'meta') continue; // wrapped subtitle text
      cur = cur || { title: '' };
      cur.title = (cur.title + ' ' + l).trim(); last = 'title';
    }
    flush('required');

    // Other Course Materials: attach the store to a kit, or add an item that was only mentioned here
    const other = (sec['other course materials'] || []).join(' ');
    if (other) {
      const store = (/from the ([A-Z][A-Za-z ]+?)(?: before| prior|\.|,)/.exec(other) || [])[1];
      const kit = out.items.find((i) => /kit/i.test(i.name));
      if (kit && /kit/i.test(other)) { if (store) kit.store = store; kit.note = 'Students must bring the kit and components to labs.'; }
      else if (/kit|calculator|goggles|lab coat|manual/i.test(other)) {
        const m = /(?:procure|purchase|buy|obtain)\s+(?:the\s+)?(?:designated\s+)?(.+?)\s+from\s+the/i.exec(other);
        if (m) out.items.push({ name: titleCase(m[1]), type: typeOf(m[1]), isbn: '', store, src: 'syllabus', optional: false });
      }
    }
    // stand-alone ISBN lines when no Required Texts section was found
    if (!out.items.length) {
      lines.forEach((l, i) => {
        const m = /ISBN[:\s#-]*([0-9][0-9 -]{9,16}[0-9X])/i.exec(l);
        if (m) out.items.push({ name: titleCase((lines[i - 1] || l.replace(m[0], '')).slice(0, 90)), type: 'textbook', isbn: m[1].replace(/\s/g, ''), src: 'syllabus', optional: false });
      });
    }

    // notes that affect what to buy or bring
    const sw = (sec['required software'] || []).join(' ');
    if (/Windows/i.test(sw)) out.notes.push('Course software runs on Windows or Linux. Mac users need to install Windows.');
    if (/closed-toe shoes and long pants/i.test(raw.replace(/\s+/g, ' '))) out.notes.push('Lab dress code: closed-toe shoes and long pants.');
    return out;
  };
})(window.Trunk);
