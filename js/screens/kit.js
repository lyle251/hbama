/* Home desktop and My Semester Kit.txt */
(function (T) {
  const myCourses = () => (T.state.synced ? (T.state.myCourses || T.REGISTERED) : []);
  const matsOf = (code) => {
    const c = T.course(code);
    return [...(c ? c.mats.map((m) => ({ ...m })) : []), ...((T.state.extraMats || {})[code] || [])];
  };
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
        title: `Desktop.sys · ${T.esc(sch.logoText)}`, tone: 'focus',
        body: `<div class="hero"><div class="stack"><h2>Hi ${T.esc(first)}.</h2><p>${T.state.synced ? 'Your kit is ready.' : 'Start by syncing your classes. Trunk does the shopping list for you.'}</p>${connect}
          <div class="grid2"><div class="panel"><b class="px" style="font-size:20px">On ${sch.short} right now</b><div class="num">${s.listings.filter((l) => l.school === s.school && l.status === 'AVAILABLE').length} available · ${s.listings.filter((l) => l.school === s.school && l.status === 'ON_HOLD').length} on hold</div></div>
          <div class="panel"><b class="px" style="font-size:20px">Your listings</b><div class="num">${mine} active · <a href="#/sell">post another</a></div></div></div></div>
          <div aria-hidden="true">${T.ellie({ pose: 'wave', size: 170 })}</div></div>`,
        status: `<span>${T.esc(sch.name)}</span><span>${s.verified ? 'Verified Student ✓' : 'Unverified'}</span>`,
      });
    },
  };
  T.acts.connectBama = async () => {
    const ov = T.dialog({ title: 'myBama_Sync.exe', body: `<b class="px" style="font-size:21px">Connecting to the registrar…</b><div id="sync-bar">${T.seg(0, 16)}</div><span class="hint">Estimated time left… 51 years</span>`, buttons: [] });
    let n = 0; const id = setInterval(() => { n = Math.min(15, n + 1); const b = T.$('#sync-bar'); if (b) b.innerHTML = T.seg(n, 16); }, 55);
    try {
      T.state.myCourses = await T.adapters.registrar.fetchCourses();
      T.state.synced = true; T.save();
    } catch (e) { clearInterval(id); ov.close(); return T.dialog({ title: 'System Failure', kind: 'error', body: `<b class="px" style="font-size:21px">${T.esc(e.message)}</b>` }); }
    clearInterval(id); ov.close();
    T.toast(`Found ${T.state.myCourses.length} classes and ${T.state.myCourses.reduce((a, c) => a + matsOf(c).length, 0)} required items.`);
    T.go('kit');
  };

  T.screens.kit = {
    render() {
      const s = T.state;
      if (!s.synced) {
        return T.win({ title: 'My Semester Kit.txt', body: `<div class="stack" style="align-items:center;text-align:center;padding:16px 0">${T.ellie({ pose: 'sleep', size: 150 })}<h2>Nothing in your kit yet</h2><p>Connect myBama or paste a syllabus and Ellie wakes up.</p><div class="row"><button class="btn btn--primary" data-act="connectBama">Connect myBama</button><button class="btn" data-act="addSyllabus">Add a syllabus</button></div></div>` });
      }
      let newTotal = 0, trunkTotal = 0, haveCount = 0, items = 0;
      const sections = myCourses().map((code) => {
        const c = T.course(code), mats = matsOf(code);
        const rows = mats.map((m) => {
          const have = !!s.have[m.key], ex = exact(m, code), low = ex.length ? Math.min(...ex.map((r) => r.l.price)) : null;
          items++; if (have) haveCount++;
          if (!have) { newTotal += m.newPrice; trunkTotal += low !== null ? low : m.newPrice; }
          const recs = T.recs(m, code).slice(0, 3);
          return `<div class="kit-item ${have ? 'have' : ''}">
            <input type="checkbox" id="h-${m.key}" data-act="kitHave" data-key="${m.key}" ${have ? 'checked' : ''} aria-label="Already have ${T.esc(m.name)}">
            <div style="min-width:0"><label for="h-${m.key}" class="nm"><b>${T.esc(m.name)}</b></label>
              <div class="row" style="gap:4px;margin:2px 0"><span class="chip chip--soft">${T.MAT_TYPES[m.type]}</span><span class="chip">${m.src === 'registrar' ? 'from registrar' : 'from syllabus'}</span>${m.edition ? `<span class="chip">${T.esc(m.edition)} ed.</span>` : ''}${m.isbn ? `<span class="chip num">ISBN ${m.isbn}</span>` : ''}</div>
              <div>${ex.length ? `<b>${ex.length} seller${ex.length > 1 ? 's' : ''} on campus, lowest $${low}</b> <span class="muted">· new $${m.newPrice}</span>` : `<span class="muted">No sellers yet · new $${m.newPrice}</span>`}</div>
              ${!have && recs.length ? `<details><summary class="px" style="cursor:pointer;font-size:18px">Best matches</summary>${recs.map((r) => `<div><a href="#/listing/${r.l.id}">${T.esc(r.l.title)}</a> <span class="muted">$${r.l.price} · ${r.d} min walk · ${['exact match', 'same course', 'related'][r.rank]}</span></div>`).join('')}</details>` : ''}</div>
            <div class="stack sm">${have ? '' : `<button class="btn btn--sm" data-act="kitWanted" data-key="${m.key}" data-code="${code}">Post a Wanted request</button>`}</div></div>`;
        }).join('');
        return `<details class="kit-course" open><summary><span>${code} · ${T.esc(c ? c.name : 'Uploaded syllabus')}</span><span class="chip chip--soft">${mats.length} items</span></summary>${rows}
          <div class="row between" style="padding:8px 12px;border-top:2px dashed var(--ink-soft)"><span class="hint">Need help with ${code}? ${/^(ECE|CS)\b/.test(code) ? '<a href="#/hub/Engineering"><b>Engineering tutoring</b></a>' : '<a href="#/hub/Tutoring"><b>Tutoring</b></a>'}</span><button class="btn btn--sm" data-act="reverseSell" data-code="${code}">Done with ${code}? Sell it</button></div></details>`;
      }).join('');
      const save = Math.max(0, newTotal - trunkTotal);
      return T.win({
        title: 'My Semester Kit.txt', menu: '<a href="#/kit">File</a><button class="m" data-act="addSyllabus">Add syllabus…</button><button class="m" data-act="connectBama">Re-sync myBama</button><a href="#/market">Market</a>',
        body: `<div class="grid2" style="margin-bottom:16px"><div class="panel stack sm"><b class="px" style="font-size:22px">Cost comparison</b>
            <div class="meter-row"><span>New</span>${T.seg(10, 10)}<span class="num">$${newTotal}</span></div>
            <div class="meter-row"><span>On Trunk</span>${T.seg(Math.max(1, Math.round((trunkTotal / Math.max(1, newTotal)) * 10)), 10, true)}<span class="num">$${trunkTotal}</span></div>
            <b class="px" style="font-size:24px;color:var(--red-700)">You save $${save}</b></div>
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
      T.dialog({ title: 'System Information', body: `<b class="px" style="font-size:21px">Sell your ${code} materials to the ${c ? c.next : 100} students taking it next term?</b><span>We pre-fill a listing for your textbook. You set the price.</span>`,
        buttons: [{ label: 'Pre-fill listing', cls: 'btn--primary', run: () => { const m = matsOf(code)[0]; T.sellDraft = { cat: 'CLASS', course: code, mat: m.key, title: m.name + (m.edition ? ', ' + m.edition + ' ed.' : ''), isbn: m.isbn || '', price: Math.round(m.newPrice * 0.45) }; T.go('sell'); } }, { label: 'Not now' }] });
    },
    addSyllabus: () => {
      T.dialog({ title: 'Syllabus.parse', body: `<b class="px" style="font-size:21px">Add a syllabus</b><span class="hint">Paste the text. PDF upload goes through the same parser on the server.</span>
        <label class="field"><span class="px">Syllabus text</span><textarea class="input" id="syl" placeholder="ECE 380 Signals and Systems&#10;Required text: Signals and Systems Primer, ISBN 978-0-00-000380-3&#10;Calculator: scientific"></textarea></label>`,
        buttons: [{ label: 'Extract items', cls: 'btn--primary', run: (ov) => {
          const text = T.$('#syl', ov).value; if (!text.trim()) return false;
          T.adapters.ai.parseSyllabus(text).then((r) => {
            const st = T.state; st.extraMats = st.extraMats || {};
            if (!T.course(r.course)) { st.extraMats[r.course] = r.items; } else { st.myCourses = st.myCourses || T.REGISTERED.slice(); }
            if (!(st.myCourses || []).includes(r.course)) (st.myCourses = st.myCourses || []).push(r.course);
            st.synced = true; T.save(); T.toast(`Found ${r.items.length} items for ${r.course} (from syllabus).`); T.render();
          });
        } }, { label: 'Cancel' }] });
    },
  });
})(window.Trunk);
