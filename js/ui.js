/* UI core: window chrome, dialogs, toast, router, desktop shell. */
window.Trunk = window.Trunk || {};
(function (T) {
  T.screens = {};
  T.acts = {};
  T.$ = (s, r = document) => r.querySelector(s);
  T.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  T.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.money = (n) => (n === 0 ? 'Free' : '$' + n);
  T.stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  T.avatar = (uid, cls = '') => {
    const u = T.user(uid);
    return `<span class="avatar ${cls}" title="${T.esc(u.name)}">${u.photo ? `<img src="${u.photo}" alt="" style="width:100%;height:100%;object-fit:cover">` : T.esc(T.initials(u.name))}</span>`;
  };
  T.seg = (n, total = 10, warn = false) =>
    `<div class="seg ${warn === 'ok' ? 'ok' : warn ? 'warn' : ''}" role="img" aria-label="${n} of ${total}">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  T.chip = (status) => ({
    AVAILABLE: '<span class="chip">○ AVAILABLE</span>',
    NEGOTIATING: '<span class="chip chip--soft">… NEGOTIATING</span>',
    ON_HOLD: '<span class="chip chip--hold">⏸ ON HOLD</span>',
    SOLD: '<span class="chip chip--neg">✓ SOLD</span>',
  }[status] || '');
  T.verifiedChip = '<span class="chip chip--ver">VERIFIED ✓</span>';

  /** Window chrome. tone 'focus' uses the darker title bar. */
  T.win = function ({ title, tone = '', menu = '', body, status = '', flush = false, dots = false, extra = '' }) {
    const ctl = dots
      ? '<div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>'
      : '<div class="window__ctl"><button type="button" data-act="minimize" aria-label="Minimize to desktop">_</button><button type="button" data-act="maximize" aria-label="Maximize">□</button><button type="button" data-act="close" aria-label="Close window">×</button></div>';
    return `<section class="window ${tone === 'focus' ? 'focus' : ''} ${extra}" aria-label="${T.esc(title)}">
      <header class="window__titlebar"><span class="window__title">${title}</span>${ctl}</header>
      ${menu ? `<div class="menubar">${menu}</div>` : ''}
      <div class="window__body ${flush ? 'flush' : ''}">${body}</div>
      ${status ? `<footer class="statusbar">${status}</footer>` : ''}
    </section>`;
  };

  /* ---------- toast, dialog, confetti ---------- */
  T.toast = function (msg) {
    T.$$('.toast').forEach((n) => n.remove());
    const n = document.createElement('div');
    n.className = 'toast'; n.setAttribute('role', 'status'); n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3200);
  };
  /** opts: {title, kind:'info'|'error', body (html), buttons:[{label, cls, run}]}. Esc closes. */
  T.dialog = function ({ title = 'Done', kind = 'info', body = '', buttons }) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    const icon = kind === 'error' ? '<div class="dlg-err" aria-hidden="true">×</div>' : `<div class="ico">${T.ellieHead(56)}</div>`;
    ov.innerHTML = `<div class="window dialog" role="dialog" aria-modal="true" aria-label="${T.esc(title)}">
      <header class="window__titlebar ${kind === 'error' ? 'is-focus' : ''}"><span class="window__title">${T.esc(title)}</span><div class="dots" aria-hidden="true"><i></i><i></i><i></i></div></header>
      <div class="window__body"><div class="dlg">${icon}<div class="stack" style="flex:1;min-width:0">${body}</div></div>
      <div class="row end" style="margin-top:16px" data-btns></div></div></div>`;
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const bar = T.$('[data-btns]', ov);
    (buttons || [{ label: 'OK', cls: 'btn--ok' }]).forEach((b) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'btn ' + (b.cls || ''); el.textContent = b.label;
      el.addEventListener('click', () => { if (b.run && b.run(ov) === false) return; close(); });
      bar.appendChild(el);
    });
    document.body.appendChild(ov);
    const first = T.$('input,select,textarea', ov) || T.$('.btn--primary,.btn', bar); if (first) first.focus();
    ov.close = close;
    return ov;
  };
  T.confetti = function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div');
    box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const bits = ['♥', '✦', '♥'];
    for (let i = 0; i < 36; i++) {
      const b = document.createElement('i');
      b.textContent = bits[i % bits.length];
      b.style.left = Math.random() * 100 + '%'; b.style.animationDelay = Math.random() * 0.6 + 's';
      b.style.color = i % 2 ? '#fff' : '#3B1F22';
      box.appendChild(b);
    }
    document.body.appendChild(box);
        setTimeout(() => box.remove(), 3400);
  };

  /* ---------- router ---------- */
  const PUBLIC = ['landing', 'login', 'verify', 'demo', 'track', 'admin'];
  T.parse = function () {
    const parts = (location.hash.replace(/^#\/?/, '') || 'landing').split('/');
    return { name: parts[0] || 'landing', args: parts.slice(1).map(decodeURIComponent) };
  };
  T.go = (path) => { if (location.hash === '#/' + path) T.render(); else location.hash = '#/' + path; };

  T.render = function () {
    let { name, args } = T.parse();
    const st = T.state;
    if (!T.screens[name]) name = 'desktop';
    if (!st.signedIn && !PUBLIC.includes(name)) { name = 'landing'; args = []; }
    if (st.signedIn && !st.chosen && !PUBLIC.includes(name) && name !== 'campus' && name !== 'admin') { name = 'campus'; args = []; }
    const scr = T.screens[name];
    const app = T.$('#app');
    const stage = T.$('#stage');
    app.classList.toggle('bare', !!scr.bare);
    stage.innerHTML = scr.render(args) || '';
    T.$$('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === name || (a.dataset.nav === 'market' && name === 'listing');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    T.$('#tray-credits').textContent = T.me().credits + ' credits';
    T.$('#school-chip').textContent = T.school(T.state.school).short + ' · ' + T.school(T.state.school).city;
    T.$('#acct').textContent = T.initials(T.me().name);
    document.title = 'Trunk';
    if (scr.mount) scr.mount(stage, args);
    window.scrollTo(0, 0);
    closeStart();
  };

  /* ---------- shell ---------- */
  const NAV = [['market', 'Market'], ['kit', 'Semester Kit'], ['sell', 'Sell'], ['chats', 'Messages'], ['hub', 'Campus Hub'], ['explore', 'Other campuses']];
  const TABS = [['market', 'Market', 'market'], ['kit', 'Kit', 'kit'], ['sell', 'Sell', 'sell'], ['chats', 'Chats', 'chats'], ['hub', 'Hub', 'hub'], ['profile', 'Profile', 'profile']];

  function closeStart() { const m = T.$('.startmenu'); if (m) m.remove(); const b = T.$('#acct'); if (b) b.setAttribute('aria-expanded', 'false'); }
  function toggleStart() {
    if (T.$('.startmenu')) return closeStart();
    const m = document.createElement('div');
    m.className = 'startmenu'; m.setAttribute('role', 'menu');
    m.innerHTML = [['desktop', 'Home'], ['profile', 'My profile'], ['sold', 'My sales'], ['live', 'Meetup Live'], ['campus', 'Choose campus'], ['demo', 'Demo controls'], ['admin', 'Add a school']]
      .map(([r, l]) => `<a href="#/${r}" role="menuitem">${l}</a>`).join('')
      + '<hr><button type="button" data-act="theme">Dark mode</button><button type="button" data-act="logout">Log out</button>';
    document.body.appendChild(m);
    const b = T.$('#acct'); if (b) b.setAttribute('aria-expanded', 'true');
  }

  T.boot = function () {
    T.load();
    document.documentElement.dataset.theme = T.state.theme || '';
    if (!T.state.theme) delete document.documentElement.dataset.theme;
    T.$('#app').innerHTML = `
      <header class="topbar">
        <a class="brand" href="#/desktop" aria-label="Trunk home">${T.ellieHead(34)}<span>Trunk</span></a>
        <nav class="topnav" aria-label="Main">${NAV.map(([r, l]) => `<a href="#/${r}" data-nav="${r}">${l}</a>`).join('')}</nav>
        <div class="topright"><span class="chip chip--soft hide-sm only-in" id="school-chip"></span><span class="chip chip--ver only-in" id="tray-credits" title="Your credits">0 credits</span>
          <button type="button" class="iconbtn" data-act="theme" aria-label="Toggle dark mode">☾</button>
          <button type="button" class="iconbtn only-in" id="acct" data-act="start" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">${T.initials(T.state.name || 'T')}</button></div>
      </header>
      <main id="stage" class="stage"></main>
      <nav class="tabbar" aria-label="Main">${TABS.map(([r, l, i]) => `<a href="#/${r}" data-nav="${r}">${T.icon(i)}<span>${l}</span></a>`).join('')}</nav>`;

    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) { if (!e.target.closest('.startmenu')) closeStart(); return; }
      const fn = T.acts[a.dataset.act];
      if (fn) fn(a, e);
    });
    window.addEventListener('hashchange', T.render);
    T.render();
  };

  Object.assign(T.acts, {
    start: () => toggleStart(),
    close: () => T.go('desktop'),
    minimize: () => T.go('desktop'),
    maximize: () => T.toast('Windows are already full size on Trunk OS.'),
    go: (el) => T.go(el.dataset.to),
    theme: () => {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next; T.state.theme = next; T.save();
      closeStart();
    },
    logout: () => { T.state.signedIn = false; T.state.chosen = false; T.save(); closeStart(); T.go('landing'); },
  });
})(window.Trunk);
