/* Ask Ellie: shopping assistant panel. Runs on a mock now; the real model is Gemma behind T.adapters.assistant. */
(function (T) {
  T.assist = T.assist || { open: false, busy: false, msgs: [] };
  const A = T.assist;
  const GREETING = { from: 'ellie', text: 'Hi, I am Ellie. Ask me what a class needs and where to get it. For example: what do I need for ECE 380?', cards: [], chips: ['What do I need for ECE 380?', 'Find a calculator', 'Where can I get tutoring?'] };
  if (!A.msgs.length) A.msgs.push(GREETING);

  function card(c) {
    if (c.kind === 'material') {
      const sellers = c.sellers.length
        ? c.sellers.slice(0, 3).map((s) => `<div class="row between" style="gap:6px"><span><a href="#/listing/${s.id}" data-act="assistClose"><b>$${s.price}</b> ${T.esc(s.seller)}</a> <span class="hint">★${s.rating ? s.rating.toFixed(1) : 'new'} · pickup at ${T.esc(s.spot)}</span></span><button class="btn btn--sm" data-act="assistMsg" data-id="${s.id}">Message</button></div>`).join('')
        : `<div class="hint">No sellers on campus yet.</div><button class="btn btn--sm" data-act="assistWanted" data-name="${T.esc(c.name)}" data-course="${c.course}">Post a Wanted request</button>`;
      return `<div class="acard"><div class="row between"><b>${T.esc(c.name)}</b><span class="chip chip--soft">${c.course}</span></div>
        <div class="row" style="gap:4px"><span class="chip chip--soft">${T.esc(c.type)}</span>${c.edition ? `<span class="chip chip--soft">${T.esc(c.edition)} ed.</span>` : ''}${c.isbn ? `<span class="chip chip--soft num">ISBN ${c.isbn}</span>` : ''}<span class="chip">${c.src === 'registrar' ? 'from registrar' : 'from syllabus'}</span></div>
        <div class="hint">${c.newPrice ? 'Buy new: about $' + c.newPrice + '.' : 'New price not in the syllabus.'} Bookstore link: TODO_VERIFY</div>${sellers}</div>`;
    }
    if (c.kind === 'listing') return `<div class="acard"><div class="row between"><a href="#/listing/${c.id}" data-act="assistClose"><b>${T.esc(c.title)}</b></a><b>$${c.price}</b></div><div class="hint">${T.esc(c.seller)} · pickup at ${T.esc(c.spot)}</div><div class="row"><button class="btn btn--sm" data-act="assistMsg" data-id="${c.id}">Message seller</button></div></div>`;
    if (c.kind === 'resource') return `<div class="acard"><b>${T.esc(c.name)}</b>${c.desc ? `<div class="hint">${T.esc(c.desc)}</div>` : ''}<a class="btn btn--sm" href="#/hub/${encodeURIComponent(c.cat)}" data-act="assistClose" style="align-self:flex-start">Open in Campus Hub</a></div>`;
    return '';
  }
  function msgHTML(m) {
    if (m.from === 'me') return `<div class="amsg me">${T.esc(m.text)}</div>`;
    const chips = m.chips && m.chips.length ? `<div class="row" style="margin-top:8px;gap:6px">${m.chips.map((c) => `<button class="btn btn--sm" data-act="assistAsk" data-q="${T.esc(c)}">${T.esc(c)}</button>`).join('')}</div>` : '';
    return `<div class="amsg"><div>${T.esc(m.text)}</div>${m.cards && m.cards.length ? `<div class="cards">${m.cards.map(card).join('')}</div>` : ''}${chips}</div>`;
  }
  function paint() {
    const log = T.$('#assist-log'); if (!log) return;
    log.innerHTML = A.msgs.map(msgHTML).join('') + (A.busy ? '<div class="amsg"><span class="hint">Ellie is looking…</span></div>' : '');
    log.scrollTop = log.scrollHeight;
  }
  function open() {
    A.open = true; if (T.$('#assist')) return;
    const el = document.createElement('div');
    el.id = 'assist'; el.className = 'assist';
    el.innerHTML = `<section class="window" aria-label="Ellie assistant"><header class="window__titlebar"><span class="window__title">Ask Ellie</span><button type="button" class="btn btn--sm" data-act="assistClose">Close</button></header>
      <div class="window__body"><div class="hint" style="padding:0 16px 8px"><span class="mockbadge">DEMO MODE</span> Gemma is not connected yet. Answers come from Trunk's own data.</div>
      <div class="assist-log" id="assist-log" aria-live="polite"></div>
      <form class="assist-form" id="assist-form"><div class="row" style="flex-wrap:nowrap"><label class="sr" for="assist-q">Ask Ellie</label><input class="input" id="assist-q" placeholder="What do I need for ECE 380?" autocomplete="off"><button class="btn btn--primary" type="submit">Ask</button></div></form></div></section>`;
    document.body.appendChild(el);
    T.$('#assist-form').addEventListener('submit', (e) => { e.preventDefault(); const i = T.$('#assist-q'); ask(i.value); i.value = ''; });
    paint(); T.$('#assist-q').focus();
    const fab = T.$('.fab'); if (fab) fab.hidden = true;
  }
  function close() { A.open = false; const el = T.$('#assist'); if (el) el.remove(); const fab = T.$('.fab'); if (fab) fab.hidden = false; }
  async function ask(q) {
    q = (q || '').trim(); if (!q || A.busy) return;
    A.msgs.push({ from: 'me', text: q }); A.busy = true; paint();
    let r;
    try { r = await T.adapters.assistant.ask(q); } catch (e) { r = { text: 'The assistant is not available right now. Try the Market search instead.', cards: [], chips: [] }; }
    A.busy = false; A.msgs.push({ from: 'ellie', ...r }); paint();
  }
  Object.assign(T.acts, {
    assist: () => (A.open ? close() : open()),
    assistClose: () => close(),
    assistAsk: (el) => ask(el.dataset.q),
    assistMsg: (el) => { const id = el.dataset.id; close(); T.openChat(id); },
    assistWanted: (el) => { close(); T.wantedDialog(el.dataset.name, el.dataset.course); },
  });
  T.assistant = { open, close, ask };
})(window.Trunk);
