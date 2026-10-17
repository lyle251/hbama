/* Integration adapters. DEMO_MODE=true selects the Mock implementations; each Real stub lists what to wire up. */
window.Trunk = window.Trunk || {};
(function (T) {
  T.DEMO_MODE = true;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const registrar = {
    mock: { async fetchCourses() { await wait(900); return T.REGISTERED.slice(); } },
    real: { async fetchCourses() {
      // TODO: authenticate with the school's Banner / myBama SSO (OAuth/SAML), read the student's registered sections.
      throw new Error('Registrar integration not configured');
    } },
  };

  /* Syllabus parsing. Real: call the Claude API (model claude-sonnet-5-5) server-side with the syllabus text and ask for JSON. */
  const ai = {
    mock: {
      async parseSyllabus(text) {
        await wait(700);
        const found = T.COURSES.filter((c) => new RegExp(c.code.replace(' ', '\\s?'), 'i').test(text));
        if (found.length) return { course: found[0].code, items: found[0].mats.map((m) => ({ ...m, src: 'syllabus' })) };
        const items = [];
        text.split(/\n+/).forEach((line, i) => {
          const isbn = /ISBN[:\s#-]*([0-9][0-9-]{9,16})/i.exec(line);
          if (isbn || /required (text|book)/i.test(line) || /calculator|goggles|lab coat|access code/i.test(line)) {
            const type = /calculator/i.test(line) ? 'calc' : /goggles|coat/i.test(line) ? 'safety' : /access/i.test(line) ? 'access' : 'textbook';
            items.push({ key: 'x' + i + Date.now(), type, name: line.replace(/^[\s•*-]+/, '').slice(0, 80), isbn: isbn ? isbn[1] : '', src: 'syllabus', newPrice: type === 'calc' ? 25 : type === 'safety' ? 12 : 90 });
          }
        });
        return { course: (/\b([A-Z]{2,4})\s?(\d{3})\b/.exec(text) || [])[0] || 'Uploaded course', items };
      },
    },
    real: { async parseSyllabus() {
      // TODO: POST to /api/ai/syllabus; server calls Anthropic with ANTHROPIC_API_KEY, validates the JSON with Zod.
      throw new Error('ANTHROPIC_API_KEY missing, using mock parser');
    } },
  };

  /* Shopping assistant. Real: Gemma through the Google AI API, called from the SERVER so the key never reaches the browser.
     Contract: ask(text) resolves to {text, cards:[{kind:'material'|'listing'|'resource', ...}], chips:[string]}. */
  const assistant = {
    mock: {
      async ask(q) {
        await wait(650);
        const saved = T.mk; T.mk = { q: '', cats: [], courses: [], max: '', cond: '', spot: '', ver: false, cross: false };
        try { return answer(String(q)); } finally { T.mk = saved; }
      },
    },
    real: { async ask() {
      // TODO: POST /api/assistant { text }. Server: model "gemma-3-27b-it" via
      //   https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent  (x-goog-api-key: GEMMA_API_KEY)
      // Give the model tool results as context: course materials, active listings (seller, price, spot), Campus Hub resources.
      // Ask for JSON in the contract shape, validate it with Zod, and never invent links or prices that are not in the context.
      throw new Error('GEMMA_API_KEY missing, using the mock assistant');
    } },
  };
  const walk = (l) => T.walkMin(l.spot);
  function sellersFor(m, code) {
    return T.state.listings.filter((l) => l.school === T.state.school && (l.status === 'AVAILABLE' || l.status === 'NEGOTIATING') && (l.mat === m.key || (m.isbn && l.isbn === m.isbn)))
      .sort((a, b) => a.price - b.price).map((l) => ({ id: l.id, title: l.title, price: l.price, seller: T.user(l.seller).name, rating: T.user(l.seller).rating, walk: walk(l), spot: T.spot(l.spot).name, safe: T.spot(l.spot).safe }));
  }
  function answer(q) {
    const codes = [];
    q.replace(/\b([a-z]{2,4})[\s-]?(\d{3})\b/gi, (m, a, b) => { const c = `${a.toUpperCase()} ${b}`; if (T.course(c) && !codes.includes(c)) codes.push(c); return m; });
    const lc = q.toLowerCase();
    if (codes.length) {
      const cards = []; let total = 0, saveTo = 0, lines = [];
      codes.forEach((code) => {
        const c = T.course(code);
        c.mats.forEach((m) => {
          const sellers = sellersFor(m, code); total += m.newPrice; saveTo += sellers.length ? sellers[0].price : m.newPrice;
          cards.push({ kind: 'material', course: code, name: m.name, type: T.MAT_TYPES[m.type], edition: m.edition || '', isbn: m.isbn || '', newPrice: m.newPrice, src: m.src, sellers });
        });
        lines.push(`${code} (${c.name}) needs ${c.mats.length} things`);
      });
      const hub = lc.match(/tutor|help|study/) ? [{ kind: 'resource', name: 'Engineering tutoring and lab help', cat: 'Engineering' }] : [];
      return { text: `${lines.join('. ')}. Buying new costs about $${total}. Buying from students on campus can cost about $${saveTo}, so you could save about $${Math.max(0, total - saveTo)}. Here is each item with the sellers on your campus.`, cards: [...cards, ...hub], chips: ['Who sells the cheapest calculator?', 'Where can I get tutoring?'] };
    }
    if (/tutor|study|help|stuck|struggl/.test(lc)) {
      const res = T.RESOURCES.filter((r) => r.cat === 'Tutoring' || r.cat === 'Engineering').slice(0, 3).map((r) => ({ kind: 'resource', name: r.name, cat: r.cat, desc: r.desc }));
      const tut = T.state.listings.filter((l) => l.cat === 'TUTOR' && l.school === T.state.school && l.status !== 'SOLD').map((l) => ({ kind: 'listing', id: l.id, title: l.title, price: l.price, seller: T.user(l.seller).name, walk: walk(l), spot: T.spot(l.spot).name }));
      return { text: 'Here are the official tutoring resources, plus students on Trunk who tutor.', cards: [...res, ...tut], chips: ['What do I need for ECE 380?'] };
    }
    const r = T.search(q);
    if (r.mode !== 'none' && r.sections[0] && r.sections[0].items.length) {
      const items = r.sections[0].items.slice(0, 4).map((l) => ({ kind: 'listing', id: l.id, title: l.title, price: l.price, seller: T.user(l.seller).name, walk: walk(l), spot: T.spot(l.spot).name }));
      return { text: `I found ${r.sections[0].items.length} match${r.sections[0].items.length === 1 ? '' : 'es'}. Cheapest and closest are first.`, cards: items.sort((a, b) => a.price - b.price), chips: ['What do I need for CS 100?'] };
    }
    return { text: 'I can list what a class needs and who sells it. Try a course code like ECE 380, or an item like a calculator or lab coat.', cards: [], chips: ['What do I need for ECE 380?', 'Find a calculator', 'Where can I get tutoring?'] };
  }

  /* Retail benchmarks for the Price check panel. Mock: derived from each material's list price (demo estimates, not live).
     Real: UA Supply Store catalog lookup by ISBN, and the Amazon Product Advertising API (needs an Associates account and keys). */
  const priceRef = {
    mock: { lookup(l) {
      const m = l.mat && T.allMats().find((x) => x.key === l.mat);
      return m ? { supply: m.newPrice, amazon: Math.round(m.newPrice * 0.86), estimate: true } : null;
    } },
    real: { lookup() { /* TODO: server route that queries both sources by ISBN/UPC and caches for a day. */ return null; } },
  };
  /* Product images, tried in order: the seller's upload, a file at img/products/<listing id>.jpg, the free Open Library cover for the ISBN (no key). If none loads, the drawn illustration (js/art.js) shows.
     TODO: Amazon Product Advertising API images for non-book items once Associates keys exist. Scraping Google or Amazon pages is not used. */
  const images = { urls(l) {
    const out = [];
    if (l.photo) out.push(l.photo);
    out.push(`img/products/${l.id}.jpg`); // drop real photos here, named by listing id
    const isbn = (l.isbn || '').replace(/[^0-9Xx]/g, '');
    if (isbn.length >= 10) out.push(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`);
    return out;
  } };

  const verification = {
    mock: { async verify(id) { await wait(400); return /^1\d{7}$/.test(id); } },
    real: { async verify() { /* TODO: SheerID verification request with the student's ID and document upload. */ throw new Error('Not configured'); } },
  };
  const realtime = {
    mock: { subscribe() { /* in-page timers stand in for a socket */ return () => {}; } },
    real: { subscribe() { /* TODO: Server-Sent Events, Pusher or Supabase Realtime channel per conversation. */ throw new Error('Not configured'); } },
  };
  const storage = {
    mock: { async put(file) { return URL.createObjectURL(file); } },
    real: { async put() { /* TODO: presigned S3 PUT, return the object URL. */ throw new Error('Not configured'); } },
  };
  const pick = (a) => (T.DEMO_MODE ? a.mock : a.real);
  T.adapters = { registrar: pick(registrar), ai: pick(ai), verification: pick(verification), realtime: pick(realtime), assistant: pick(assistant), priceRef: pick(priceRef), images, storage: pick(storage) };
})(window.Trunk);
