/* Market: smart search, category tree, filters, cross-campus browsing. */
(function (T) {
  T.mk = { q: '', cats: [], courses: [], max: '', cond: '', spot: '', ver: false, cross: false };
  const COURSE_RE = /^\s*([a-z]{2,4})[\s-]?(\d{3})\s*$/i;
  const normCourse = (q) => { const m = COURSE_RE.exec(q); return m ? `${m[1].toUpperCase()} ${m[2]}` : null; };

  const tokens = (q) => {
    const out = new Set();
    q.toLowerCase().split(/[^a-z0-9.\-]+/).filter(Boolean).forEach((w) => { out.add(w); if (T.SYNONYMS[w]) T.SYNONYMS[w].split(' ').forEach((x) => out.add(x)); });
    return [...out];
  };
  const hay = (l) => `${l.title} ${l.desc} ${l.course || ''} ${l.isbn || ''} ${T.CATS[l.cat]} ${l.event || ''} ${l.subject || ''}`.toLowerCase();
  const score = (l, q, toks) => {
    const h = hay(l); let s = 0;
    if (l.isbn && q.replace(/-/g, '') === l.isbn.replace(/-/g, '')) s += 30;
    if (h.includes(q.toLowerCase())) s += 10;
    toks.forEach((t) => { if (h.includes(t)) s += 3; });
    return s;
  };

  function pool() {
    const s = T.state;
    return s.listings.filter((l) => (T.mk.cross ? l.cross : l.school === s.school) && l.status !== 'SOLD');
  }
  function filtered(list) {
    const m = T.mk;
    return list.filter((l) =>
      (!m.cats.length || m.cats.includes(l.cat)) &&
      (!m.courses.length || m.courses.includes(l.course)) &&
      (!m.max || l.price <= Number(m.max)) && (!m.cond || l.cond === m.cond) && (!m.spot || l.spot === m.spot) &&
      (!m.ver || T.user(l.seller).verified));
  }
  /** Returns {mode, title, sections:[{h, items}], wanted, suggest}. */
  T.search = function (q) {
    const list = filtered(pool());
    const code = q && normCourse(q);
    if (code) {
      const c = T.course(code);
      if (!c) { const near = T.COURSES.find((x) => x.code.split(' ')[0] === code.split(' ')[0]); return { mode: 'none', sections: [], suggest: near ? near.code : null }; }
      const items = list.filter((l) => l.course === code);
      const groups = {};
      items.forEach((l) => {
        const mat = l.mat && T.allMats().find((m) => m.key === l.mat);
        const g = l.cat === 'TUTOR' ? 'Tutoring' : mat ? T.MAT_TYPES[mat.type] : T.CATS[l.cat];
        (groups[g] = groups[g] || []).push(l);
      });
      return { mode: 'course', course: c, sections: Object.entries(groups).map(([h, items]) => ({ h, items })), wanted: T.state.wanted.filter((w) => w.course === code) };
    }
    if (!q || !q.trim()) return { mode: 'all', sections: [{ h: '', items: list }] };
    const toks = tokens(q);
    const scored = list.map((l) => ({ l, s: score(l, q, toks) })).sort((a, b) => b.s - a.s);
    const exact = scored.filter((x) => x.s >= 3).map((x) => x.l);
    if (!exact.length) { const near = T.COURSES.find((c) => c.code.toLowerCase().replace(' ', '').startsWith(q.toLowerCase().replace(/\s/g, '').slice(0, 3))); return { mode: 'none', sections: [], suggest: near ? near.code : null }; }
    const top = exact[0];
    const related = list.filter((l) => !exact.includes(l) && ((top.course && l.course === top.course) || l.cat === top.cat)).slice(0, 8);
    return { mode: 'item', sections: [{ h: 'Exact matches', items: exact }, ...(related.length ? [{ h: 'Related items', items: related }] : [])] };
  };

  T.distance = (l) => {
    if (l.school === T.state.school) return `${T.walkMin(l.spot)} min walk`;
    const mi = (T.MILES[T.state.school] || {})[l.school];
    return `${mi || '?'} mi · ${T.school(l.school).short}`;
  };

  T.fileCard = function (l) {
    const u = T.user(l.seller);
    const crossBadge = l.school !== T.state.school ? `<span class="chip chip--neg">${T.school(l.school).short}</span>` : '';
    return `<a class="file" href="#/listing/${l.id}" style="text-decoration:none" aria-label="${T.esc(l.title)}, ${T.money(l.price)}">
      <div class="file__thumb">${T.glyph(l.cat)}<span class="file__fold"></span><span class="file__tag">${T.money(l.price)}</span>${l.status === 'SOLD' ? '<span class="stamp">SOLD</span>' : ''}</div>
      <div class="file__name">${T.esc(l.title)}</div>
      <div class="row" style="gap:4px">${T.chip(l.status)}${l.course ? `<span class="chip chip--soft">${T.esc(l.course)}</span>` : ''}${crossBadge}${T.verifiedChipSmall(l.seller)}</div>
      <div class="file__meta"><span class="row" style="gap:5px;flex-wrap:nowrap">${T.avatar(l.seller)}${u.ratings ? '★' + u.rating.toFixed(1) : 'New'}</span><span>${T.distance(l)}</span></div>
    </a>`;
  };
  T.verifiedChipSmall = (uid) => (T.user(uid).verified ? '' : '<span class="chip">unverified</span>');

  function resultsHTML() {
    const r = T.search(T.mk.q);
    let html = '';
    if (r.mode === 'none') {
      html = `<div class="stack" style="align-items:center;text-align:center;padding:20px 0">${T.ellie({ pose: 'sign', size: 150, label: 'Ellie holding a sign' })}
        <b class="px" style="font-size:24px">Please check this</b><p>No results for '${T.esc(T.mk.q)}'.${r.suggest ? ` Try <a href="#" data-act="mkTry" data-q="${r.suggest}"><b>${r.suggest}</b></a>?` : ' Try a course code like CS 100.'}</p>
        <button class="btn btn--primary" data-act="mkWanted">Post a Wanted request</button></div>`;
    } else {
      if (r.mode === 'course') html += `<div class="panel row between" style="margin-bottom:14px"><div><b class="px" style="font-size:22px">${r.course.code} · ${T.esc(r.course.name)}</b><div class="hint">Everything sellers tagged with this course, ${r.course.next} students take it next term.</div></div><a class="btn btn--sm" href="#/hub/${encodeURIComponent('Tutoring')}">Need help with ${r.course.code}? → Tutoring</a></div>`;
      r.sections.forEach((s) => {
        if (!s.items.length) return;
        html += `${s.h ? `<h3 class="px" style="font-size:22px;margin:14px 0 8px">${s.h} <span class="muted">(${s.items.length})</span></h3>` : ''}<div class="filegrid">${s.items.map(T.fileCard).join('')}</div>`;
      });
      if (r.mode === 'course' && !r.sections.length) html += '<p class="muted">No sellers tagged this course yet. Post a Wanted request and classmates will see it.</p>';
      if (r.wanted && r.wanted.length) html += `<h3 class="px" style="font-size:22px;margin:18px 0 8px">Wanted for ${r.course.code}</h3>${r.wanted.map((w) => `<div class="panel row between" style="margin-bottom:8px"><span>${T.avatar(w.uid)} <b>${T.esc(w.title)}</b> <span class="muted">up to $${w.max}</span></span><a class="btn btn--sm" href="#/sell">I have this</a></div>`).join('')}`;
      if (r.mode === 'course') html += `<div class="row end" style="margin-top:14px"><button class="btn btn--sm" data-act="mkWanted">Post a Wanted request</button></div>`;
    }
    return html;
  }
  T.mkUpdate = function () {
    const box = T.$('#mk-results'); if (!box) return;
    box.innerHTML = resultsHTML();
    const n = pool().length, hold = pool().filter((l) => l.status === 'ON_HOLD').length;
    const st = T.$('#mk-status'); if (st) st.innerHTML = `<span>${filtered(pool()).length} listings</span><span>${hold} on hold${T.mk.cross ? ' · all campuses' : ''}</span>`;
  };
  function suggestions(q) {
    if (!q.trim()) return [];
    const ql = q.toLowerCase(), out = [];
    T.COURSES.filter((c) => c.code.toLowerCase().replace(' ', '').includes(ql.replace(/[\s-]/g, ''))).slice(0, 3).forEach((c) => out.push({ k: 'Course', t: c.code + ' · ' + c.name, q: c.code }));
    T.state.listings.filter((l) => l.title.toLowerCase().includes(ql)).slice(0, 4).forEach((l) => out.push({ k: 'Item', t: l.title, q: l.title }));
    Object.values(T.state.users).filter((u) => u.name.toLowerCase().includes(ql)).slice(0, 2).forEach((u) => out.push({ k: 'Seller', t: u.name, q: u.name }));
    return out;
  }

  function sidebar() {
    const m = T.mk, s = T.state;
    const base = s.listings.filter((l) => (m.cross ? l.cross : l.school === s.school) && l.status !== 'SOLD');
    const cnt = (c) => base.filter((l) => l.cat === c).length;
    const cats = Object.entries(T.CATS).map(([k, v]) => {
      const kids = k === 'CLASS' ? `<ul>${T.COURSES.map((c) => `<li><label class="check"><input type="checkbox" data-mk="course" value="${c.code}" ${m.courses.includes(c.code) ? 'checked' : ''}> ${c.code}</label></li>`).join('')}</ul>` : '';
      return `<li><label class="check"><span class="box" style="width:auto">${k === 'CLASS' ? '[–]' : '[+]'}</span><input type="checkbox" data-mk="cat" value="${k}" ${m.cats.includes(k) ? 'checked' : ''}> ${v} <span class="cnt muted">${cnt(k)}</span></label>${kids}</li>`;
    }).join('');
    return `<details id="mk-filters" open><summary class="px" style="font-size:20px;cursor:pointer">Filters</summary><ul class="tree" aria-label="Categories">${cats}</ul><hr style="border:0;border-top:1px solid var(--line);margin:12px 0">
      <div class="stack sm">
        <label class="field"><span class="px">Max price</span><input class="input" id="mk-max" type="number" min="0" placeholder="$ any" value="${m.max}"></label>
        <label class="field"><span class="px">Condition</span><select class="input" id="mk-cond"><option value="">Any</option>${T.CONDS.map((c) => `<option ${m.cond === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="field"><span class="px">Campus spot</span><select class="input" id="mk-spot"><option value="">Anywhere</option>${T.SPOTS.map((x) => `<option value="${x.id}" ${m.spot === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" id="mk-ver" ${m.ver ? 'checked' : ''}> Verified sellers only</label>
        <label class="check"><input type="checkbox" id="mk-cross" ${m.cross ? 'checked' : ''}> Browse other campuses</label>
      </div></details>`;
  }

  T.screens.market = {
    render() {
      return T.win({
        title: T.mk.cross ? 'Other campuses' : 'Market', flush: true,
        menu: `<span class="grow pathfield" style="position:relative"><label class="sr" for="mk-q">Search</label><input class="input" id="mk-q" type="search" autocomplete="off" placeholder="Search course or item… (try CS 100, calc, goggles)" value="${T.esc(T.mk.q)}" ><div id="mk-sug" class="panel" hidden style="position:absolute;left:0;right:0;top:100%;z-index:20;padding:4px;margin-top:4px"></div></span><a href="#/sell" class="btn btn--sm btn--primary">+ Sell</a>`,
        body: `<div class="market"><aside id="mk-side">${sidebar()}</aside><section><div id="mk-results"></div></section></div>`,
        status: '<span id="mk-status"></span>',
      }).replace('<footer class="statusbar"><span id="mk-status"></span></footer>', '<footer class="statusbar" id="mk-status"></footer>');
    },
    mount(el) {
      T.mkUpdate();
      if (innerWidth <= 760 && !T.mk.openFilters) T.$('#mk-filters', el).open = false;
      T.$('#mk-filters', el).addEventListener('toggle', (e) => { if (innerWidth <= 760) T.mk.openFilters = e.target.open; });
      const q = T.$('#mk-q', el), sug = T.$('#mk-sug', el);
      q.addEventListener('input', () => {
        T.mk.q = q.value; T.mkUpdate();
        const s = suggestions(q.value);
        sug.hidden = !s.length;
        sug.innerHTML = s.map((x) => `<button type="button" class="btn btn--sm" style="width:100%;justify-content:flex-start;margin:2px 0;box-shadow:none" data-act="mkTry" data-q="${T.esc(x.q)}"><span class="chip chip--soft">${x.k}</span> ${T.esc(x.t)}</button>`).join('');
      });
      q.addEventListener('blur', () => setTimeout(() => { sug.hidden = true; }, 200));
      const side = T.$('#mk-side', el);
      side.addEventListener('change', (e) => {
        const t = e.target, m = T.mk;
        if (t.dataset.mk === 'cat' || t.dataset.mk === 'course') {
          const arr = t.dataset.mk === 'cat' ? m.cats : m.courses;
          const i = arr.indexOf(t.value); if (t.checked && i < 0) arr.push(t.value); if (!t.checked && i >= 0) arr.splice(i, 1);
        } else if (t.id === 'mk-max') m.max = t.value; else if (t.id === 'mk-cond') m.cond = t.value; else if (t.id === 'mk-spot') m.spot = t.value;
        else if (t.id === 'mk-ver') m.ver = t.checked; else if (t.id === 'mk-cross') { m.cross = t.checked; T.render(); return; }
        T.mkUpdate();
      });
    },
  };
  T.screens.explore = { render() { T.mk.cross = true; return T.screens.market.render(); }, mount(el) { T.screens.market.mount(el); } };

  Object.assign(T.acts, {
    mkTry: (el, e) => { e.preventDefault(); T.mk.q = el.dataset.q; if (T.parse().name !== 'market') T.go('market'); else { T.$('#mk-q').value = T.mk.q; T.$('#mk-sug').hidden = true; T.mkUpdate(); } },
    mkWanted: () => T.wantedDialog(T.mk.q),
  });

  T.wantedDialog = function (prefill = '', course = '') {
    const code = normCourse(prefill) || course;
    T.dialog({
      title: 'Wanted request', body: `<b class="px" style="font-size:21px">Post a Wanted request</b>
        <label class="field"><span class="px">What do you need?</span><input class="input" id="w-title" value="${T.esc(code ? code + ' textbook' : prefill)}"></label>
        <label class="field"><span class="px">Course (optional)</span><input class="input" id="w-course" value="${T.esc(code || '')}" placeholder="ECE 380"></label>
        <label class="field"><span class="px">Max price</span><input class="input" id="w-max" type="number" value="40"></label>`,
      buttons: [{ label: 'Post', cls: 'btn--primary', run: (ov) => {
        const title = T.$('#w-title', ov).value.trim(); if (!title) return false;
        T.state.wanted.push({ id: 'W' + T.state.nextId++, uid: T.state.uid, title, course: normCourse(T.$('#w-course', ov).value) || '', max: Number(T.$('#w-max', ov).value) || 0 });
        T.save(); T.toast('Wanted request posted. Sellers on campus can see it.'); setTimeout(() => T.render(), 50);
      } }, { label: 'Cancel' }],
    });
  };
  T.normCourse = normCourse;
})(window.Trunk);
