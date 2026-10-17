/* Listing detail, price helper, chat entry. */
(function (T) {
  T.priceHint = function (l) {
    const sims = T.state.listings.filter((x) => x.id !== l.id && ((l.mat && x.mat === l.mat) || (!l.mat && x.cat === l.cat)) && x.price > 0).map((x) => x.price);
    if (sims.length >= 2) return `Similar items sold for $${Math.min(...sims)}–$${Math.max(...sims)}.`;
    const mat = l.mat && T.allMats().find((m) => m.key === l.mat);
    if (mat) return `Similar items sold for $${Math.round(mat.newPrice * 0.3)}–$${Math.round(mat.newPrice * 0.55)} (new price is $${mat.newPrice}).`;
    return 'Not enough similar sales yet. Price it near what you would pay.';
  };
  T.vouchBadge = function (uid) {
    const v = T.state.vouches.find((x) => x.to === uid && x.status !== 'FORFEITED');
    if (!v) return '';
    const f = T.user(v.from);
    return `<span class="chip chip--ver" title="${T.esc(f.name)} staked ${v.stake} credits on this seller">Vouched by ${T.esc(f.name.split(' ')[0])} ⭐${f.rating.toFixed(1)}</span>`;
  };
  T.trustMeter = function (uid) {
    const t = T.trust(uid);
    return `<details><summary class="px" style="cursor:pointer;font-size:19px">Trust Score ${t.total}/100 · How is this calculated?</summary>
      <div class="stack sm" style="margin-top:8px">${T.seg(Math.round(t.total / 10), 10)}${t.parts.map((p) => `<div class="meter-row"><span>${p[0]}</span><span></span><span class="num">${p[1] > 0 ? '+' : ''}${p[1]}${p[2] ? '/' + p[2] : ''}</span></div>`).join('')}
      <span class="hint">Weighted from verification, ratings, completed sales, credits, vouches (weighted by the voucher's own score), account age and no-shows.</span></div></details>`;
  };

  T.openChat = function (lid) {
    const st = T.state, l = T.listing(lid);
    if (!st.chats[lid]) st.chats[lid] = { lid, with: l.seller, status: l.status, meetup: null, confirm: { me: false, them: false }, msgs: [] };
    T.save(); T.go('chats/' + lid);
  };

  T.screens.listing = {
    render([id]) {
      const l = T.listing(id);
      if (!l) return T.win({ title: 'Not found', body: '<p>That listing is gone. <a href="#/market">Back to Market</a></p>' });
      const u = T.user(l.seller), mine = l.seller === T.state.uid, away = l.school !== T.state.school;
      const extra = [
        l.event && `<dt>Event</dt><dd>${T.esc(l.event)} · ${T.esc(l.date)} · ${T.esc(l.seat)}</dd>`,
        l.rate && `<dt>Tutoring</dt><dd>${T.esc(l.subject)} · ${T.esc(l.rate)} · ${T.esc(l.avail)}</dd>`,
        l.from && `<dt>Ride</dt><dd>${T.esc(l.from)} → ${T.esc(l.to)} · ${T.esc(l.date)} · ${l.seats} seats</dd>`,
        l.make && `<dt>Vehicle</dt><dd>${l.year} ${T.esc(l.make)} · ${l.miles.toLocaleString()} mi</dd>`,
        l.isbn && `<dt>ISBN</dt><dd class="num">${l.isbn}</dd>`, l.course && `<dt>Course</dt><dd><a href="#" data-act="mkTry" data-q="${l.course}">${l.course}</a></dd>`,
      ].filter(Boolean).join('');
      const fav = T.state.favorites[l.id];
      const body = `<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
        <div class="stack"><div class="file__thumb" style="aspect-ratio:4/3;box-shadow:var(--shadow-btn)">${T.glyph(l.cat)}<span class="file__fold"></span>${l.status === 'SOLD' ? '<span class="stamp slam">SOLD</span>' : ''}</div>
          <div class="panel"><b class="px" style="font-size:20px">Price helper</b><div>${T.esc(T.priceHint(l))}</div></div></div>
        <div class="stack">
          <div class="row between"><h1 style="font-size:30px">${T.esc(l.title)}</h1></div>
          <div class="row"><b class="px" style="font-size:34px;color:var(--brand-700)">${T.money(l.price)}</b>${T.chip(l.status)}<span class="chip chip--soft">${l.cond}</span>${l.cross ? '<span class="chip">Ships or meets halfway</span>' : ''}</div>
          <p>${T.esc(l.desc || 'No description.')}</p>
          <dl class="kv"><dt>Category</dt><dd>${T.CATS[l.cat]}</dd>${extra}<dt>Meetup</dt><dd>${T.spot(l.spot).name} ${T.spot(l.spot).safe ? '<span class="chip chip--ver">SAFE SPOT</span>' : ''}</dd><dt>Distance</dt><dd>${T.distance(l)}</dd></dl>
          ${l.course ? `<div class="panel" style="padding:8px 10px">Need help with ${l.course}? <a href="#/hub/Tutoring"><b>Campus Hub → Tutoring</b></a></div>` : ''}
          <div class="panel"><div class="row">${T.avatar(l.seller)}<a href="#/profile/${u.id}"><b>${T.esc(u.name)}</b></a>${u.verified ? T.verifiedChip : ''}<span class="muted">${u.ratings ? '★' + u.rating.toFixed(1) + ' (' + u.ratings + ')' : 'New seller'}</span></div>
            <div class="row" style="margin:6px 0">${T.vouchBadge(u.id)}</div>${T.trustMeter(u.id)}</div>
          ${away ? `<label class="field"><span class="px">Exchange method</span><select class="input" id="l-ex"><option>Ship to me</option><option>Meet halfway</option></select></label>` : ''}
          <div class="row">${mine ? `<a class="btn" href="#/chats">See messages</a>` : l.status === 'SOLD' ? '' : `<button class="btn btn--primary" data-act="msgSeller" data-id="${l.id}">Message seller</button>`}
            <button class="btn" data-act="fav" data-id="${l.id}" aria-pressed="${!!fav}">${fav ? '♥ Saved' : '♡ Save'}</button><a class="btn" href="#/market">Back</a></div>
        </div></div>`;
      return T.win({ title: 'Listing details', body, tone: 'focus', status: `<span>${T.CATS[l.cat]}</span><span>${T.school(l.school).name}</span>` });
    },
  };
  Object.assign(T.acts, {
    msgSeller: (el) => T.openChat(el.dataset.id),
    fav: (el) => { const s = T.state; s.favorites[el.dataset.id] = !s.favorites[el.dataset.id]; T.save(); T.render(); },
  });
})(window.Trunk);
