/* Home desktop and My Semester Kit */
(function (T) {
  const myCourses = () => (T.state.synced ? (T.state.myCourses || T.REGISTERED) : []);
  /** Materials for a course: from an uploaded syllabus when there is one, otherwise the seeded catalog. */
  const matsOf = T.matsOf = (code) => {
    const syl = (T.state.syllabi || {})[code];
    if (syl) return syl.items.map((m) => ({ ...m }));
    const c = T.course(code);
    return c ? c.mats.map((m) => ({ ...m })) : [];
  };
  T.courseName = (code) => { const syl = (T.state.syllabi || {})[code], c = T.course(code); return (syl && syl.name) || (c && c.name) || 'Uploaded syllabus'; };
  const priced = (m) => typeof m.newPrice === 'number' && m.newPrice > 0;
  const active = () => T.state.listings.filter((l) => l.school === T.state.school && (l.status === 'AVAILABLE' || l.status === 'NEGOTIATING'));
  /** Rank: exact ISBN/edition, then same course, then related type, then distance to the usual campus area. */
  T.recs = function (m, code) {
    const out = [];
    active().forEach((l) => {
      let rank = null;
      if (l.mat === m.key || (m.isbn && l.isbn === m.isbn)) rank = 0;
      else if (l.course === code && l.cat !== 'TUTOR') rank = 1;
      else if (l.mat && T.allMats().find((x) => x.key === l.mat && x.type === m.type)) rank = 2;
      if (rank !== null) out.push({ l, rank, d: T.walkMin(l.spot) });
    });
    return out.sort((a, b) => a.rank - b.rank || a.d - b.d || a.l.price - b.l.price);
  };
  const exact = (m, code) => T.recs(m, code).filter((r) => r.rank === 0);

  T.screens.desktop = {
    render() {
      const s = T.state, first = s.name.split(' ')[0];
      const sch = T.school(s.school);
      const connect = s.synced
        ? `<div class="panel stack sm"><b class="px" style="font-size:21px">myBama connected ✓</b><span>${myCourses().join(' · ')}</span><a class="btn btn--primary" href="#/kit">Open My Semester Kit</a></div>`
        : `<div class="panel stack"><b class="px" style="font-size:21px">Connect myBama</b><span>Pull your registered classes, then see every textbook, lab manual and calculator you need, and who on campus is selling it.</span><button class="btn btn--primary" data-act="connectBama">Connect myBama</button><span class="hint">Mock registrar in demo mode. No password is sent anywhere.</span></div>`;
      const mine = s.listings.filter((l) => l.seller === s.uid && l.status !== 'SOLD').length;
      return T.win({
        title: "Home", tone: 'focus',
        body: `<div class="hero"><div class="stack"><h2>Hi ${T.esc(first)}.</h2><p>${T.state.synced ? 'Your kit is ready.' : 'Start by syncing your classes. Trunk does the shopping list for you.'}</p>${connect}
          <div class="grid2"><div class="panel"><b class="px" style="font-size:17px">On ${sch.short} right now</b><div class="num">${s.listings.filter((l) => l.school === s.school && l.status === 'AVAILABLE').length} available · ${s.listings.filter((l) => l.school === s.school && l.status === 'ON_HOLD').length} on hold</div></div>
          <div class="panel"><b class="px" style="font-size:20px">Your listings</b><div class="num">${mine} active · <a href="#/sell">post another</a></div></div></div></div>
          <div aria-hidden="true">${T.ellie({ pose: 'wave', size: 170 })}</div></div>`,
        status: `<span>${T.esc(sch.name)}</span><span>${s.verified ? 'Verified student' : 'Unverified'}</span>`,
      });
    },
  };
  T.acts.connectBama = async () => {
    const ov = T.dialog({ title: 'Connecting to myBama', body: `<b class="px" style="font-size:21px">Connecting to the registrar…</b><div id="sync-bar">${T.seg(0, 16)}</div>`, buttons: [] });
    let n = 0; const id = setInterval(() => { n = Math.min(15, n + 1); const b = T.$('#sync-bar'); if (b) b.innerHTML = T.seg(n, 16); }, 55);
    try {
      T.state.myCourses = await T.adapters.registrar.fetchCourses();
      T.state.synced = true; T.save();
    } catch (e) { clearInterval(id); ov.close(); return T.dialog({ title: 'That did not work', kind: 'error', body: `<b class="px" style="font-size:21px">${T.esc(e.message)}</b>` }); }
    clearInterval(id); ov.close();
    T.toast(`Found ${T.state.myCourses.length} classes and ${T.state.myCourses.reduce((a, c) => a + matsOf(c).length, 0)} required items.`);
    T.go('kit');
  };


  /* Map syllabus items to catalog materials (same ISBN, or the same words) so sellers and prices line up. */
  const toks = (t) => t.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  function mapItems(code, items) {
    const seed = (T.course(code) || { mats: [] }).mats;
    return items.map((it, i) => {
      const hit = seed.find((m) => (it.isbn && m.isbn === it.isbn) || (toks(m.name).filter((w) => toks(it.name).includes(w)).length >= 2));
      return { ...it, key: hit ? hit.key : `u-${code.replace(' ', '')}-${i}`, newPrice: hit ? hit.newPrice : undefined, edition: hit ? hit.edition : undefined, matched: !!hit, src: 'uploaded' };
    });
  }
  function previewSyllabus(r, fileName) {
    const code = r.code, items = mapItems(code || 'UPLOAD', r.items);
    if (!code || !items.length) {
      return T.dialog({ title: 'Add a syllabus', kind: 'error', body: `<b class="px" style="font-size:21px">I could not find required materials.</b><span>${code ? '' : 'No course code was found. '}Try pasting the "Required Texts" or "Other Course Materials" section.</span>`, buttons: [{ label: 'Try again', cls: 'btn--primary', run: () => { setTimeout(() => T.acts.addSyllabus(), 0); } }, { label: 'Close' }] });
    }
    const rows = items.map((it, i) => {
      const ex = it.matched ? T.recs(it, code).filter((x) => x.rank === 0) : [], low = ex.length ? Math.min(...ex.map((x) => x.l.price)) : null;
      return `<label class="check panel" style="align-items:flex-start;padding:8px 10px"><input type="checkbox" data-i="${i}" checked><span><b>${T.esc(it.name)}</b><br>
        <span class="hint">${T.MAT_TYPES[it.type]}${it.isbn ? ' · ISBN ' + it.isbn : ''}${it.digital ? ' · eBook' : ''}${it.optional ? ' · recommended' : ''}${it.store ? ' · buy at ' + T.esc(it.store) : ''}</span><br>
        <span class="hint">${ex.length ? `${ex.length} seller${ex.length > 1 ? 's' : ''} on campus, lowest $${low}` : 'No sellers on campus yet'}</span></span></label>`;
    }).join('');
    T.dialog({ title: 'Add a syllabus', body: `<b class="px" style="font-size:21px">${T.esc(code)} · ${T.esc(r.name || 'Course')}</b>
      <span class="hint">${T.esc([r.term, r.section && 'Section ' + r.section, r.instructor, r.credits && r.credits + ' credits'].filter(Boolean).join(' · '))}<br>Read from ${T.esc(fileName)}</span>
      <div class="stack sm"><b>Found ${items.length} item${items.length > 1 ? 's' : ''}</b>${rows}</div>
      ${r.notes.length ? `<div class="stack sm"><b>Also noted</b>${r.notes.map((n) => `<span class="hint">• ${T.esc(n)}</span>`).join('')}</div>` : ''}`,
      buttons: [{ label: 'Add to my Semester Kit', cls: 'btn--primary', run: (o) => {
        const keep = T.$$('input[data-i]:checked', o).map((x) => items[Number(x.dataset.i)]);
        if (!keep.length) { T.toast('Tick at least one item.'); return false; }
        const st = T.state; st.syllabi = st.syllabi || {};
        st.syllabi[code] = { code, name: r.name, term: r.term, section: r.section, instructor: r.instructor, credits: r.credits, notes: r.notes, fileName, items: keep };
        st.myCourses = st.myCourses || (st.synced ? T.REGISTERED.slice() : []); if (!st.myCourses.includes(code)) st.myCourses.push(code);
        st.synced = true; T.save(); T.toast(`Added ${keep.length} item${keep.length > 1 ? 's' : ''} for ${code}.`); T.go('kit'); T.render();
      } }, { label: 'Cancel' }] });
  }

  T.screens.kit = {
    render() {
      const s = T.state;
      if (!s.synced) {
        return T.win({ title: 'My Semester Kit', body: `<div class="stack" style="align-items:center;text-align:center;padding:16px 0">${T.ellie({ pose: 'sleep', size: 150 })}<h2>Nothing in your kit yet</h2><p>Connect myBama or paste a syllabus and Ellie wakes up.</p><div class="row"><button class="btn btn--primary" data-act="connectBama">Connect myBama</button><button class="btn" data-act="addSyllabus">Add a syllabus</button></div></div>` });
      }
      let newTotal = 0, trunkTotal = 0, haveCount = 0, items = 0;
      const sections = myCourses().map((code) => {
        const syl = (s.syllabi || {})[code], mats = matsOf(code);
        const rows = mats.map((m) => {
          const have = !!s.have[m.key], ex = exact(m, code), low = ex.length ? Math.min(...ex.map((r) => r.l.price)) : null;
          items++; if (have) haveCount++;
          if (!have && priced(m)) { newTotal += m.newPrice; trunkTotal += low !== null ? low : m.newPrice; }
          const recs = T.recs(m, code).slice(0, 3);
          return `<div class="kit-item ${have ? 'have' : ''}">
            <input type="checkbox" id="h-${m.key}" data-act="kitHave" data-key="${m.key}" ${have ? 'checked' : ''} aria-label="Already have ${T.esc(m.name)}">
            <div style="min-width:0"><label for="h-${m.key}" class="nm"><b>${T.esc(m.name)}</b></label>
              <div class="row" style="gap:4px;margin:2px 0"><span class="chip chip--soft">${T.MAT_TYPES[m.type]}</span><span class="chip">${m.src === 'registrar' ? 'from registrar' : syl ? 'from your syllabus' : 'from syllabus'}</span>${m.digital ? '<span class="chip chip--hold">eBook</span>' : ''}${m.optional ? '<span class="chip chip--soft">Recommended</span>' : ''}${m.edition ? `<span class="chip">${T.esc(m.edition)} ed.</span>` : ''}${m.isbn ? `<span class="chip num">ISBN ${m.isbn}</span>` : ''}</div>
              <div>${ex.length ? `<b>${ex.length} seller${ex.length > 1 ? 's' : ''} on campus, lowest $${low}</b> <span class="muted">${priced(m) ? '· new $' + m.newPrice : ''}</span>` : `<span class="muted">No sellers yet${priced(m) ? ' · new $' + m.newPrice : ' · price not in the syllabus'}</span>`}</div>
              ${m.store ? `<div class="hint">Syllabus says to buy at the ${T.esc(m.store)}.</div>` : ''}${m.digital ? '<div class="hint">The syllabus lists the eBook. Print copies of the same book can still help.</div>' : ''}
              ${!have && recs.length ? `<details><summary class="px" style="cursor:pointer;font-size:18px">Best matches</summary>${recs.map((r) => `<div><a href="#/listing/${r.l.id}">${T.esc(r.l.title)}</a> <span class="muted">$${r.l.price} · pickup at ${T.spot(r.l.spot).name} · ${['exact match', 'same course', 'related'][r.rank]}</span></div>`).join('')}</details>` : ''}</div>
            <div class="stack sm">${have ? '' : `<button class="btn btn--sm" data-act="kitWanted" data-key="${m.key}" data-code="${code}">Post a Wanted request</button>`}</div></div>`;
        }).join('');
        return `<details class="kit-course" open><summary><span>${code} · ${T.esc(T.courseName(code))}</span><span class="chip chip--soft">${mats.length} items</span></summary>${rows}
          ${syl ? `<div style="padding:10px 16px;border-top:2px solid var(--panel-lo)"><div class="hint"><b>From ${T.esc(syl.fileName || 'your syllabus')}</b>: ${T.esc([syl.term, syl.instructor, syl.credits && syl.credits + ' credits'].filter(Boolean).join(' · '))}</div>${syl.notes.map((n) => `<div class="hint">• ${T.esc(n)}</div>`).join('')}</div>` : ''}
          <div class="row between" style="padding:8px 12px;border-top:1px solid var(--line)"><span class="hint">Need help with ${code}? ${/^(ECE|CS)\b/.test(code) ? '<a href="#/hub/Engineering"><b>Engineering tutoring</b></a>' : '<a href="#/hub/Tutoring"><b>Tutoring</b></a>'}</span><button class="btn btn--sm" data-act="reverseSell" data-code="${code}">Done with ${code}? Sell it</button></div></details>`;
      }).join('');
      const save = Math.max(0, newTotal - trunkTotal);
      return T.win({
        title: 'My Semester Kit', menu: '<button class="btn btn--sm" data-act="addSyllabus">Add a syllabus</button><button class="btn btn--sm" data-act="connectBama">Re-sync myBama</button><a class="btn btn--sm" href="#/market">Go to Market</a>',
        body: `<div class="grid2" style="margin-bottom:16px"><div class="panel stack sm"><b class="px" style="font-size:22px">Cost comparison</b>
            <div class="meter-row"><span>New</span>${T.seg(10, 10)}<span class="num">$${newTotal}</span></div>
            <div class="meter-row"><span>On Trunk</span>${T.seg(Math.max(1, Math.round((trunkTotal / Math.max(1, newTotal)) * 10)), 10, 'ok')}<span class="num">$${trunkTotal}</span></div>
            <b class="px" style="font-size:24px;color:var(--brand-700)">You save $${save}</b></div>
          <div class="panel row">${T.ellie({ pose: 'wave', size: 90 })}<div><b class="px" style="font-size:20px">${haveCount} of ${items} already owned</b><div class="hint">Tick "Already have it" and the total updates.</div></div></div></div>${sections}`,
        status: `<span>${myCourses().length} courses · ${items} items</span><span>Prices from ${T.school(s.school).short} sellers</span>`,
      });
    },
  };
  Object.assign(T.acts, {
    kitHave: (el) => { T.state.have[el.dataset.key] = el.checked; T.save(); const y = scrollY; T.render(); scrollTo(0, y); },
    kitWanted: (el) => { const m = matsOf(el.dataset.code).find((x) => x.key === el.dataset.key); T.wantedDialog(m ? m.name : '', el.dataset.code); },
    reverseSell: (el) => {
      const code = el.dataset.code, c = T.course(code);
      T.dialog({ title: 'Done', body: `<b class="px" style="font-size:21px">Sell your ${code} materials to the ${c ? c.next : 100} students taking it next term?</b><span>We pre-fill a listing for your textbook. You set the price.</span>`,
        buttons: [{ label: 'Pre-fill listing', cls: 'btn--primary', run: () => { const m = matsOf(code)[0]; T.sellDraft = { cat: 'CLASS', course: code, mat: m.key, title: m.name + (m.edition ? ', ' + m.edition + ' ed.' : ''), isbn: m.isbn || '', price: Math.round((m.newPrice || 40) * 0.45) }; T.go('sell'); } }, { label: 'Not now' }] });
    },
    addSyllabus: () => {
      const ov = T.dialog({ title: 'Add a syllabus', body: `<b class="px" style="font-size:21px">Add a syllabus</b>
        <span class="hint">Upload the PDF. It is read in your browser and nothing is sent anywhere. You can also paste the text.</span>
        <label class="field"><span class="px">Syllabus file (PDF or text)</span><input class="input" id="syl-file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain"></label>
        <label class="field"><span class="px">Or paste the text</span><textarea class="input" id="syl" placeholder="Paste the Required Texts and Other Course Materials sections"></textarea></label>
        <div class="hint" id="syl-status" role="status"></div>`,
        buttons: [{ label: 'Read syllabus', cls: 'btn--primary', run: (o) => {
          const file = T.$('#syl-file', o).files[0], pasted = T.$('#syl', o).value, st = T.$('#syl-status', o);
          if (!file && !pasted.trim()) { st.textContent = 'Choose a file or paste some text first.'; return false; }
          st.textContent = file ? `Reading ${file.name}…` : 'Reading…';
          (async () => {
            try {
              const text = file ? await T.fileToText(file) : pasted;
              if (!text.trim()) throw new Error('No readable text found. If this is a scanned PDF, paste the text instead.');
              const parsed = await T.adapters.ai.parseSyllabus(text);
              o.close(); previewSyllabus(parsed, file ? file.name : 'pasted text');
            } catch (e) { st.textContent = e.message || 'Could not read that file.'; }
          })();
          return false;
        } }, { label: 'Cancel' }] });
      return ov;
    },
  });
})(window.Trunk);
