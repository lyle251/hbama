/* Messenger: per-listing chat, meetup proposal card, ON HOLD -> SOLD, credits, reviews. */
(function (T) {
  const fmt = (ms) => new Date(ms).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const chatOf = (lid) => T.state.chats[lid];
  const here = () => (T.parse().name === 'chats' ? T.parse().args[0] : null);
  const sync = (c) => { const l = T.listing(c.lid); if (l) l.status = c.status; T.save(); };
  const sys = (c, text) => c.msgs.push({ from: 'sys', text, t: now() });
  const later = (ms, fn) => setTimeout(() => { fn(); if (T.parse().name === 'chats') T.render(); }, ms);
  const due = (c) => c.meetup && (c.meetup.ff || Date.now() >= c.meetup.when);

  function reply(c, text) {
    const t = text.toLowerCase();
    const r = /available/.test(t) ? 'Yes, still available!' : /\$|do .*\d/.test(t) ? 'I can come down a little if we meet today.' : /where|meet/.test(t) ? 'Gorgas Library or the Student Center work for me.' : 'Sounds good!';
    later(1100, () => { c.msgs.push({ from: c.with, text: r, t: now() }); T.save(); });
  }
  function send(lid, text, img) {
    const c = chatOf(lid); if (!c || (!text.trim() && !img)) return;
    c.msgs.push({ from: 'me', text: text.trim(), img, t: now() });
    if (c.status === 'AVAILABLE') { c.status = T.TX.next(c.status, 'message'); sync(c); sys(c, 'Status: NEGOTIATING'); }
    T.save(); T.render(); reply(c, text);
  }

  T.screens.chats = {
    render([lid]) {
      const s = T.state, ids = Object.keys(s.chats);
      if (!lid && ids.length) lid = ids[0];
      const c = lid && chatOf(lid), l = c && T.listing(c.lid);
      const contacts = ids.map((id) => { const k = s.chats[id], li = T.listing(id); return `<a class="contact" href="#/chats/${id}" aria-current="${id === lid}" style="text-decoration:none;color:inherit">${T.avatar(k.with)}<span class="who"><b>${T.esc(T.user(k.with).name)}</b><small>${T.esc(li ? li.title.slice(0, 26) : id)}</small></span><span class="dot" title="online"></span></a>`; }).join('');
      let pane;
      if (!c || !l) {
        pane = `<div class="stack" style="align-items:center;justify-content:center;text-align:center;padding:30px;flex:1">${T.ellie({ pose: 'sleep', size: 150 })}<h2>No messages yet</h2><p>Open a listing and tap Message seller.</p><a class="btn btn--primary" href="#/market">Browse the Market</a></div>`;
      } else {
        const log = c.msgs.map((m) => m.from === 'sys' ? `<div class="sys">— ${T.esc(m.text)} —</div>` : `<div class="bubble ${m.from === 'me' ? 'me' : ''}">${m.img ? `<img src="${m.img}" alt="Attached photo" style="max-width:180px;border:2px solid var(--ink);border-radius:6px;display:block">` : ''}${T.esc(m.text)}<small>${T.esc(m.t)}</small></div>`).join('') || '<div class="sys">Say hi. Ask if it is still available.</div>';
        pane = `<div class="chatpane"><div class="row between" style="padding:10px 14px;border-bottom:var(--outline-thin)"><div class="row">${T.avatar(c.with)}<div><b>${T.esc(T.user(c.with).name)}</b><div><a href="#/listing/${l.id}" class="hint">${T.esc(l.title)} · ${T.money(l.price)}</a></div></div></div>${T.chip(c.status)}</div>
          <div class="chatlog" id="chatlog" tabindex="0" aria-label="Messages" aria-live="polite">${log}${meetupCard(c, l)}</div>
          <form class="composer" id="composer"><div class="quick"><button type="button" class="btn btn--sm" data-act="quick" data-t="Is this available?">Is this available?</button><button type="button" class="btn btn--sm" data-act="quick" data-t="Can you do $">Can you do $__?</button><button type="button" class="btn btn--sm" data-act="quick" data-t="Where can we meet?">Where can we meet?</button></div>
          <div class="row" style="flex-wrap:nowrap"><label class="btn btn--sm" style="cursor:pointer" title="Send an image">📎<input type="file" id="c-img" accept="image/*" class="sr"></label><input class="input" id="c-text" placeholder="Type a message…" autocomplete="off" aria-label="Message"><button class="btn btn--primary" type="submit">Send</button></div></form></div>`;
      }
      return T.win({ title: 'Messages', tone: 'focus', flush: true, body: `<div class="messenger"><div class="contacts" role="navigation" aria-label="Conversations">${contacts || '<div style="padding:12px" class="hint">No conversations</div>'}</div>${pane}</div>`, status: `<span>${ids.length} conversations</span><span>${c ? c.status.replace('_', ' ') : ''}</span>` });
    },
    mount(el, [lid]) {
      const log = T.$('#chatlog', el); if (log) log.scrollTop = log.scrollHeight;
      const f = T.$('#composer', el); if (!f) return;
      const id = lid || Object.keys(T.state.chats)[0];
      f.addEventListener('submit', (e) => { e.preventDefault(); const i = T.$('#c-text', f); send(id, i.value); });
      T.$('#c-img', f).addEventListener('change', async (e) => { const file = e.target.files[0]; if (file) send(id, '', await T.adapters.storage.put(file)); });
    },
  };

  function meetupCard(c, l) {
    const m = c.meetup, name = T.user(c.with).name.split(' ')[0];
    let inner;
    if (!m) {
      inner = c.status === 'SOLD' ? '' : `<p class="hint">Pick a time and a safe spot on campus. The listing goes ON HOLD once you both accept.</p><div class="row"><button class="btn btn--primary btn--sm" data-act="proposeMeetup" data-id="${c.lid}">Propose meetup</button><button class="btn btn--sm" data-act="theyPropose" data-id="${c.lid}">Demo: ${T.esc(name)} proposes</button></div>`;
      if (c.status === 'AVAILABLE') inner = '';
    } else {
      const sp = m.name;
      inner = `<dl class="kv"><dt>Where</dt><dd><b>${T.esc(sp)}</b><br><span class="hint">${T.esc(m.addr || T.spot(m.spotId).addr)}</span> <a href="${T.mapsUrl(T.spot(m.spotId))}" target="_blank" rel="noopener">Open in Maps</a></dd><dt>When</dt><dd class="num"><b>${fmt(m.when)}</b></dd><dt>Accepted</dt><dd>${m.acc.me ? '✓ You' : '… You'} · ${m.acc.them ? '✓ ' + T.esc(name) : '… ' + T.esc(name)}</dd></dl>`;
      if (c.status === 'NEGOTIATING') inner += `<div class="row">${!m.acc.me ? `<button class="btn btn--primary btn--sm" data-act="acceptMeetup" data-id="${c.lid}">Accept</button>` : ''}<button class="btn btn--sm" data-act="proposeMeetup" data-id="${c.lid}">Suggest a change</button></div>`;
      if (c.status === 'ON_HOLD') {
        inner += T.seg(due(c) ? 10 : 6, 10, true) + `<div class="hint">${due(c) ? 'Meetup time reached.' : 'Time until the meetup.'}</div><div class="row">
          <a class="btn btn--sm btn--primary" href="#/live/${c.lid}">Go get it (pickup map)</a>
          ${due(c) ? `<button class="btn btn--sm btn--ok" data-act="confirmSale" data-id="${c.lid}" ${c.confirm.me ? 'disabled' : ''}>${c.confirm.me ? '✓ Waiting for ' + T.esc(name) : 'Confirm successful purchase'}</button>` : `<button class="btn btn--sm" data-act="fastForward" data-id="${c.lid}">Demo: jump to meetup time</button>`}
          <button class="btn btn--sm" data-act="cancelMeetup" data-id="${c.lid}">Cancel</button>${due(c) ? `<button class="btn btn--sm" data-act="noShow" data-id="${c.lid}">No-show</button>` : ''}</div>
          ${c.confirm.me && !c.confirm.them ? '<div class="hint">If only one of you confirms within 24 hours, you can <b>report a problem</b>.</div>' : ''}`;
      }
      if (c.status === 'SOLD') inner += '<b class="px" style="font-size:22px;color:var(--brand-700)">SOLD ✓ +10 credits each</b>';
    }
    if (!inner) return '';
    return `<div class="minwin" style="max-width:420px;align-self:center;width:100%"><header><span>Meetup</span>${T.chip(c.status)}</header><div class="stack sm">${inner}</div></div>`;
  }

  /* ---------- meetup proposal: choose one of the five pickup places ---------- */
  T.pick = { spot: 'gorgas' };
  function pickHTML() {
    const sp = T.spot(T.pick.spot);
    return `<div class="mapbox" id="pick-map">${T.campusSVG({ pick: true, sel: T.pick.spot })}</div>
      <div class="stack sm" role="radiogroup" aria-label="Pickup place">${T.SPOTS.map((x) => `<label class="check panel" style="padding:8px 10px"><input type="radio" name="spot" value="${x.id}" ${x.id === T.pick.spot ? 'checked' : ''} data-act="pickSpotRadio"><span><b>${x.name}</b><br><span class="hint">${x.addr}${x.verify ? ' (confirm before going)' : ''}</span></span></label>`).join('')}</div>`;
  }
  function setSpot(id) { T.pick.spot = id; const box = T.$('#pick-box'); if (box) box.innerHTML = pickHTML(); }
  T.acts.pickSpot = (el) => setSpot(el.dataset.spot);
  T.acts.pickSpotRadio = (el) => setSpot(el.value);

  function proposeDialog(lid, asThem) {
    const c = chatOf(lid);
    const d = new Date(Date.now() + 3600e3); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    T.pick = { spot: 'gorgas' };
    T.dialog({ title: asThem ? 'Meetup' : 'Propose a meetup', body: `<b class="px" style="font-size:21px">${asThem ? T.esc(T.user(c.with).name.split(' ')[0]) + ' proposes' : 'Propose'} a meetup</b>
      <label class="field"><span class="px">Date and time</span><input class="input" type="datetime-local" id="mt-when" value="${iso}"></label>
      <div class="hint">Meetups happen at one of five public campus places. Pick one.</div><div class="stack" id="pick-box">${pickHTML()}</div>`,
      buttons: [{ label: asThem ? 'Receive' : 'Send proposal', cls: 'btn--primary', run: (o) => {
        const when = new Date(T.$('#mt-when', o).value).getTime();
        if (!when || when < Date.now() - 6e4) { T.toast('Pick a time in the future.'); return false; }
        const sp = { ...T.spot(T.pick.spot) };
        c.meetup = { spotId: sp.id, name: sp.name, addr: sp.addr, x: sp.x, y: sp.y, safe: true, when, acc: { me: !asThem, them: !!asThem }, ff: false };
        sys(c, asThem ? `${T.user(c.with).name.split(' ')[0]} proposed ${sp.name}, ${fmt(when)}` : `You proposed ${sp.name}, ${fmt(when)}`);
        if (c.status === 'AVAILABLE') { c.status = T.TX.next(c.status, 'message'); sync(c); }
        if (c.status === 'ON_HOLD') { c.status = T.TX.next(c.status, 'change_requested'); c.confirm = { me: false, them: false }; sync(c); }
        T.save(); T.render();
        if (!asThem) later(1300, () => { T.TX.accept(c, 'them'); sys(c, `${T.user(c.with).name.split(' ')[0]} accepted. Listing is ON HOLD.`); sync(c); pickupPrompt(c); });
      } }, { label: 'Cancel' }] });
  }

  /* The map only appears for pickup: once both accept, offer the live map showing buyer and seller to each other. */
  function pickupPrompt(c) {
    T.dialog({ title: 'On hold', body: `<b class="px" style="font-size:21px">Meetup confirmed.</b><span>${T.esc(c.meetup.name)}, ${fmt(c.meetup.when)}. When you head out, open the pickup map. You and ${T.esc(T.user(c.with).name.split(' ')[0])} will see each other's position, only until the meetup ends.</span>`,
      buttons: [{ label: 'Open pickup map', cls: 'btn--primary', run: () => { T.go('live/' + c.lid); } }, { label: 'Later' }] });
  }
  function complete(c) {
    const l = T.listing(c.lid), st = T.state, other = T.user(c.with);
    sync(c);
    st.users.me.credits += 10; other.credits += 10; other.sales += 1;
    st.ledger.push({ uid: 'me', delta: 10, why: `Bought ${l.title.slice(0, 30)}`, at: 'now' }, { uid: c.with, delta: 10, why: `Sold ${l.title.slice(0, 30)}`, at: 'now' });
    sys(c, 'SOLD. +10 credits each.'); T.save(); T.render(); T.confetti();
    const stamp = T.$('.stamp'); if (stamp) stamp.classList.add('slam');
    setTimeout(() => reviewDialog(c), 900);
  }
  function reviewDialog(c) {
    const name = T.user(c.with).name.split(' ')[0];
    let stars = 5;
    const tags = ['on time', 'as described', 'friendly', 'late', 'not as described'];
    T.dialog({ title: 'Rate this exchange', body: `<b class="px" style="font-size:21px">How was ${T.esc(name)}?</b>
      <div class="row" role="radiogroup" aria-label="Stars">${[1, 2, 3, 4, 5].map((n) => `<label class="chip" style="cursor:pointer;font-size:18px"><input type="radio" name="st" value="${n}" ${n === 5 ? 'checked' : ''} style="width:14px;height:14px"> ${n}★</label>`).join('')}</div>
      <div class="row">${tags.map((t) => `<label class="check chip"><input type="checkbox" data-tag="${t}" style="width:14px;height:14px"> ${t}</label>`).join('')}</div>
      <label class="field"><span class="px">Public comment (shows on ${T.esc(name)}'s profile)</span><textarea class="input" id="rv-text" placeholder="Quick handoff, as described."></textarea></label>`,
      buttons: [{ label: 'Post review', cls: 'btn--primary', run: (o) => {
        stars = Number((T.$('input[name=st]:checked', o) || {}).value || 5);
        const u = T.user(c.with);
        T.state.reviews.push({ to: c.with, from: 'me', stars, tags: T.$$('[data-tag]:checked', o).map((x) => x.dataset.tag), text: T.$('#rv-text', o).value.trim() || '(no comment)' });
        u.rating = (u.rating * u.ratings + stars) / (u.ratings + 1); u.ratings += 1;
        const notes = T.applyVouchOutcome(c.with, stars);
        T.save(); T.toast('Review posted.' + (notes.length ? ' ' + notes.join(' ') : '')); T.render();
      } }, { label: 'Skip' }] });
  }

  Object.assign(T.acts, {
    quick: (el) => { const i = T.$('#c-text'); i.value = el.dataset.t; i.focus(); i.setSelectionRange(i.value.length, i.value.length); },
    proposeMeetup: (el) => proposeDialog(el.dataset.id, false),
    theyPropose: (el) => proposeDialog(el.dataset.id, true),
    acceptMeetup: (el) => { const c = chatOf(el.dataset.id); T.TX.accept(c, 'me'); if (c.status === 'ON_HOLD') { sys(c, 'Both accepted. Listing is ON HOLD.'); } sync(c); T.render(); if (c.status === 'ON_HOLD') pickupPrompt(c); },
    fastForward: (el) => { chatOf(el.dataset.id).meetup.ff = true; T.save(); T.render(); },
    confirmSale: (el) => {
      const c = chatOf(el.dataset.id); T.TX.confirm(c, 'me'); T.save(); T.render();
      later(1200, () => { if (T.TX.confirm(c, 'them') === 'SOLD') complete(c); });
    },
    cancelMeetup: (el) => { const c = chatOf(el.dataset.id); T.TX.cancel(c); sys(c, 'Meetup cancelled. Listing is AVAILABLE again.'); sync(c); T.toast('Meetup cancelled.'); T.render(); },
    noShow: (el) => { const c = chatOf(el.dataset.id); T.user(c.with).noShows += 1; T.TX.noShow(c); sys(c, 'No-show reported. Listing is AVAILABLE again.'); sync(c); T.toast('No-show recorded on their Trust Score.'); T.render(); },
  });
})(window.Trunk);
