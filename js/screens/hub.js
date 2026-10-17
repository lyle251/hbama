/* Campus Hub: per-tenant resource directory. Contact details stay TODO_VERIFY until an admin confirms them. */
(function (T) {
  T.hub = { q: '', cat: '', fav: false };
  const openNow = (r) => { const d = new Date(), day = d.getDay(), h = d.getHours() + d.getMinutes() / 60; return day >= 1 && day <= 5 && h >= r.hours[0] && h < r.hours[1]; };
  const verified = (r) => (T.state.verifiedRes || {})[r.id];

  function list() {
    const h = T.hub, q = h.q.toLowerCase();
    return T.RESOURCES.filter((r) => (!h.cat || r.cat === h.cat) && (!h.fav || T.state.favRes?.[r.id]) && (!q || `${r.name} ${r.desc} ${r.cat} ${r.tags.join(' ')}`.toLowerCase().includes(q)));
  }
  function cards() {
    const rs = list();
    if (!rs.length) return `<div class="stack" style="align-items:center;padding:18px;text-align:center">${T.ellie({ pose: 'sign', size: 120 })}<b class="px" style="font-size:22px">Please check this</b><p>No resources match. Clear the filters.</p></div>`;
    return rs.map((r) => `<article class="panel stack sm" style="margin-bottom:10px"><div class="row between"><h3 class="px" style="font-size:22px">${T.esc(r.name)}</h3><button class="btn btn--sm" data-act="favRes" data-id="${r.id}" aria-pressed="${!!(T.state.favRes || {})[r.id]}" aria-label="Favorite ${T.esc(r.name)}">${(T.state.favRes || {})[r.id] ? '♥' : '♡'}</button></div>
      <div class="row" style="gap:4px"><span class="chip chip--soft">${T.esc(r.cat)}</span>${openNow(r) ? '<span class="chip chip--ver">OPEN NOW</span>' : '<span class="chip">closed</span>'}${verified(r) ? '<span class="chip chip--ver">VERIFIED ✓</span>' : '<span class="chip chip--hold">⚠ needs verification</span>'}</div>
      <p>${T.esc(r.desc)}</p>
      <dl class="kv"><dt>Website</dt><dd>${verified(r) ? T.esc(r.url) : 'TODO_VERIFY'}</dd><dt>Phone</dt><dd>${verified(r) ? T.esc(r.phone) : 'TODO_VERIFY'}</dd><dt>Hours</dt><dd class="num">Mon to Fri, ${r.hours[0]}:00 to ${r.hours[1]}:00 <span class="muted">(unconfirmed)</span></dd></dl>
      ${T.state.admin ? `<div class="row"><button class="btn btn--sm" data-act="verifyRes" data-id="${r.id}">Admin: ${verified(r) ? 'unmark verified' : 'mark verified'}</button></div>` : ''}</article>`).join('');
  }
  function marketLink() {
    if (T.hub.cat !== 'Tutoring' && T.hub.cat !== 'Engineering') return '';
    const t = T.state.listings.filter((l) => l.cat === 'TUTOR' && l.school === T.state.school && l.status !== 'SOLD');
    return t.length ? `<div class="panel" style="margin-bottom:12px"><b class="px" style="font-size:20px">Student tutors on Trunk</b><div class="filegrid" style="margin-top:8px">${t.map(T.fileCard).join('')}</div></div>` : '';
  }
  T.hubUpdate = () => { const b = T.$('#hub-list'); if (b) { b.innerHTML = marketLink() + cards(); const c = T.$('#hub-count'); if (c) c.textContent = `${list().length} resources`; } };

  T.screens.hub = {
    render([cat]) {
      if (cat) T.hub.cat = decodeURIComponent(cat) === 'all' ? '' : decodeURIComponent(cat);
      const folders = T.RES_CATS.map(([n, col]) => `<button class="folder" data-act="hubCat" data-cat="${T.esc(n)}" aria-pressed="${T.hub.cat === n}" style="${T.hub.cat === n ? 'background:var(--red-100)' : ''}">${T.folder(col)}<span>${T.esc(n)}</span></button>`).join('');
      return T.win({
        title: 'Campus Hub', tone: 'focus', flush: true,
        menu: `<span class="px">Search</span><span class="grow"><label class="sr" for="hub-q">Search resources</label><input class="input" id="hub-q" type="search" placeholder="tutoring, writing, food…" value="${T.esc(T.hub.q)}" ></span><label class="check"><input type="checkbox" id="hub-fav" ${T.hub.fav ? 'checked' : ''}> Favorites</label><button class="btn btn--sm btn--primary" data-act="hubQuiz">Which resource do I need?</button>`,
        body: `<div style="padding:16px"><div class="hint" style="margin-bottom:8px">${T.esc(T.school(T.state.school).name)} · all official resources in one place. ${T.hub.cat ? '<a href="#/hub/all">Show all folders</a>' : ''}</div>
          <div class="row" style="gap:4px;align-items:flex-start;justify-content:flex-start">${folders}</div><div id="hub-list" style="margin-top:12px"></div></div>`,
        status: `<span id="hub-count"></span><span>Contact info is TODO_VERIFY until an admin confirms it</span>`,
      });
    },
    mount(el) {
      T.hubUpdate();
      T.$('#hub-q', el).addEventListener('input', (e) => { T.hub.q = e.target.value; T.hubUpdate(); });
      T.$('#hub-fav', el).addEventListener('change', (e) => { T.hub.fav = e.target.checked; T.hubUpdate(); });
    },
  };
  Object.assign(T.acts, {
    hubCat: (el) => { T.hub.cat = T.hub.cat === el.dataset.cat ? '' : el.dataset.cat; T.render(); },
    favRes: (el) => { const s = T.state; s.favRes = s.favRes || {}; s.favRes[el.dataset.id] = !s.favRes[el.dataset.id]; T.save(); T.hubUpdate(); },
    verifyRes: (el) => { const s = T.state; s.verifiedRes = s.verifiedRes || {}; s.verifiedRes[el.dataset.id] = !s.verifiedRes[el.dataset.id]; T.save(); T.hubUpdate(); },
    hubQuiz: () => {
      const Q = [['What do you need help with?', [['class', 'A class is hard'], ['write', 'A paper or presentation'], ['stress', 'Stress or feeling low'], ['career', 'Internships or a job'], ['basic', 'Food or basic needs']]],
        ['What kind of class?', [['eng', 'Engineering, CS or math'], ['other', 'Something else']]], ['How do you like to study?', [['group', 'In a group'], ['one', 'One on one']]]];
      const ans = []; let i = 0;
      const show = () => {
        const [q, opts] = Q[i];
        const ov = T.dialog({ title: `Quiz · ${i + 1} of 3`, body: `<b class="px" style="font-size:21px">${q}</b><div class="stack sm" role="radiogroup">${opts.map(([v, l], k) => `<label class="check"><input type="radio" name="qz" value="${v}" ${k === 0 ? 'checked' : ''}> ${l}</label>`).join('')}</div>`,
          buttons: [{ label: i < 2 ? 'Next' : 'Show my match', cls: 'btn--primary', run: (o) => { ans.push(T.$('input[name=qz]:checked', o).value); i++; if (i < 3) setTimeout(show, 0); else setTimeout(result, 0); } }, { label: 'Cancel' }] });
        return ov;
      };
      const result = () => {
        const [a, b, c] = ans;
        const id = a === 'write' ? 'r4' : a === 'stress' ? 'r7' : a === 'career' ? 'r9' : a === 'basic' ? 'r10' : b === 'eng' ? 'r6' : c === 'group' ? 'r2' : 'r1';
        const r = T.RESOURCES.find((x) => x.id === id);
        T.dialog({ title: 'Done', body: `<b class="px" style="font-size:21px">Try: ${T.esc(r.name)}</b><span>${T.esc(r.desc)}</span>${a === 'class' ? '<span class="hint">Student tutors on Trunk can fill the gaps between sessions.</span>' : ''}`,
          buttons: [{ label: 'Open it', cls: 'btn--primary', run: () => { T.hub.cat = r.cat; T.hub.q = ''; T.go('hub'); T.render(); } }, { label: 'Close' }] });
      };
      show();
    },
  });
})(window.Trunk);
