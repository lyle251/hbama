/* /demo: switch seeded users and jump to each step of the judging demo. Also the tenant admin page. */
(function (T) {
  function quickIn() {
    const s = T.state;
    if (!s.signedIn) { Object.assign(s, { signedIn: true, chosen: true, verified: true, home: 'ua', school: 'ua', email: 'jordan@crimson.ua.edu' }); T.save(); }
    if (!s.chosen) { s.chosen = true; T.save(); }
  }
  /* Make sure the L06 conversation has an accepted meetup so later steps work. */
  function ensureHold() {
    const c = T.state.chats.L06; if (!c) return;
    if (c.status === 'SOLD') return;
    if (!c.meetup) c.meetup = { spotId: 'student', name: 'Student Center', addr: T.spot('student').addr, x: 200, y: 190, safe: true, when: Date.now() + 36e5, acc: { me: true, them: true }, ff: false };
    c.meetup.acc = { me: true, them: true }; c.status = 'ON_HOLD'; T.listing('L06').status = 'ON_HOLD'; T.save();
  }
  const STEPS = [
    ['Sign up with a .edu email', () => { T.mode = 'signup'; T.go('login'); }],
    ['School detected from the email', () => { T.mode = 'signup'; T.go('login'); }],
    ['Sync classes from myBama', () => { quickIn(); T.go('desktop'); setTimeout(() => T.acts.connectBama(), 60); }],
    ['Open the Semester Kit', () => { quickIn(); T.state.synced = true; T.save(); T.go('kit'); }],
    ['Search "CS 100"', () => { quickIn(); T.mk.q = 'CS 100'; T.mk.cross = false; T.go('market'); }],
    ['Message a seller', () => { quickIn(); T.go('chats/L06'); }],
    ['Set a meetup (ON HOLD)', () => { quickIn(); const c = T.state.chats.L06; if (c.status !== 'NEGOTIATING') { c.status = 'NEGOTIATING'; c.meetup = null; T.listing('L06').status = 'NEGOTIATING'; T.save(); } T.go('chats/L06'); setTimeout(() => T.acts.proposeMeetup({ dataset: { id: 'L06' } }), 120); }],
    ['Live location (simulated walk)', () => { quickIn(); ensureHold(); T.go('live/L06'); }],
    ['Both confirm: SOLD, credits added', () => { quickIn(); ensureHold(); T.state.chats.L06.meetup.ff = true; T.save(); T.go('chats/L06'); }],
    ['Review the seller', () => { quickIn(); T.go('profile/devon/reviews'); }],
    ['Tom vouches for Minh', () => { quickIn(); T.state.uid = 'tom'; T.save(); T.go('profile/minh'); }],
    ['Browse other campuses', () => { quickIn(); T.state.uid = 'me'; T.mk.cross = true; T.mk.q = ''; T.save(); T.go('explore'); }],
    ['Campus Hub', () => { quickIn(); T.go('hub'); }],
  ];
  T.screens.demo = {
    bare: true,
    render() {
      const s = T.state, users = ['me', 'tom', 'minh', 'priya', 'devon', 'keisha'];
      return `<div style="max-width:880px;margin:30px auto 0">${T.win({
        title: 'Demo controls', tone: 'focus',
        body: `<div class="stack"><div class="row between"><div><h2>Judging demo</h2><p class="hint">Mock adapters are on (DEMO_MODE=true). Nothing leaves your browser.</p></div>${T.ellie({ pose: 'phones', size: 110 })}</div>
          <div class="panel stack sm"><b class="px" style="font-size:21px">Act as</b><div class="row">${users.map((u) => `<button class="btn btn--sm ${s.uid === u ? 'btn--primary' : ''}" data-act="demoUser" data-u="${u}">${T.esc(T.user(u).name)}</button>`).join('')}</div><span class="hint">Tom has 8 sales at ⭐4.9. Minh is new with 0 credits. Switch to Tom, open Minh's profile and vouch.</span></div>
          <div class="panel stack sm"><b class="px" style="font-size:21px">Jump to a step</b><ol style="margin:0;padding:0;list-style:none;display:grid;gap:6px">${STEPS.map(([l], i) => `<li class="row between"><span>${i + 1}. ${l}</span><button class="btn btn--sm" data-act="demoStep" data-i="${i}">Go</button></li>`).join('')}</ol></div>
          <div class="row"><label class="check"><input type="checkbox" id="adm" ${s.admin ? 'checked' : ''}> Admin mode (Campus Hub verification, school setup)</label><a class="btn btn--sm" href="#/admin/schools/new">Add a school</a><button class="btn btn--sm" data-act="demoReset">Reset demo data</button><a class="btn btn--sm" href="#/landing">Landing</a></div></div>`,
        status: `<span>Acting as ${T.esc(T.me().name)}</span><span>${T.SCHOOLS.length} tenants</span>` })}</div>`;
    },
    mount(el) { T.$('#adm', el).addEventListener('change', (e) => { T.state.admin = e.target.checked; T.save(); }); },
  };
  Object.assign(T.acts, {
    demoUser: (el) => { quickIn(); T.state.uid = el.dataset.u; T.save(); T.toast('Now acting as ' + T.me().name); T.render(); },
    demoStep: (el) => STEPS[Number(el.dataset.i)][1](),
    demoReset: () => { T.reset(); T.toast('Demo data reset.'); T.go('demo'); T.render(); },
  });

  /* ---------- /admin/schools/new: a tenant from a short config ---------- */
  T.screens.admin = {
    render() {
      const f = (id, label, val, type = 'text') => `<label class="field"><span class="px">${label}</span><input class="input" id="${id}" type="${type}" value="${T.esc(val)}"></label>`;
      return T.win({ title: 'Add a school', tone: 'focus',
        body: `<form id="school-form" class="stack" novalidate><h2>Add a school</h2><p class="hint">A new tenant needs a name, an email domain, a location and a color. It gets its own market, safe spots and Campus Hub.</p>
          <div class="grid2">${f('ns-name', 'School name', 'Samford University')}${f('ns-slug', 'Slug (URL)', 'samford')}${f('ns-domain', 'Email domain', 'samford.edu')}${f('ns-city', 'City', 'Birmingham')}${f('ns-st', 'State', 'AL')}${f('ns-lat', 'Latitude', '33.464', 'number')}${f('ns-lng', 'Longitude', '-86.79', 'number')}${f('ns-color', 'Primary color', '#B81E33', 'color')}</div>
          <div class="row end"><a class="btn" href="#/demo">Cancel</a><button class="btn btn--primary" type="submit">Create tenant</button></div>
          <details><summary class="px">Equivalent CLI</summary><code class="num" style="display:block;overflow-x:auto;white-space:pre">npx tsx scripts/add-school.ts --name "Samford University" --slug samford --domain samford.edu --lat 33.464 --lng -86.79 --color "#B81E33"</code></details></form>`,
        status: '<span>Tenants today: ' + T.SCHOOLS.length + '</span><span>Under a minute</span>' });
    },
    mount(el) {
      T.$('#school-form', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (id) => T.$('#' + id, el).value.trim(), slug = v('ns-slug').toLowerCase().replace(/[^a-z0-9-]/g, '');
        const lat = Number(v('ns-lat')), lng = Number(v('ns-lng')), domain = v('ns-domain').toLowerCase();
        const bad = !v('ns-name') || !slug || !/^[a-z0-9.-]+\.edu$/.test(domain) || isNaN(lat) || isNaN(lng) || lat < 24 || lat > 50 || lng < -125 || lng > -66;
        if (bad) return T.dialog({ title: 'Please check this', kind: 'error', body: '<b class="px" style="font-size:21px">Check the form.</b><span>Needs a name, a slug, a .edu domain and a US latitude and longitude.</span>' });
        if (T.SCHOOLS.some((s) => s.slug === slug)) return T.dialog({ title: 'Please check this', kind: 'error', body: '<b class="px" style="font-size:21px">That slug is taken.</b>' });
        const t = { slug, name: v('ns-name'), short: slug.slice(0, 3).toUpperCase(), city: v('ns-city'), st: v('ns-st'), lat, lng, domains: [domain], primary: v('ns-color'), accessory: 'Cap', logoText: 'TRUNK · ' + v('ns-city').toUpperCase(), vouchMin: 3, live: true };
        (T.state.extraSchools = T.state.extraSchools || []).push(t); T.SCHOOLS.push(t); T.save();
        T.dialog({ title: 'Done', body: `<b class="px" style="font-size:21px">${T.esc(t.name)} is live.</b><span>Students with <b>@${T.esc(domain)}</b> can sign up now. Their market is ready.</span>`, buttons: [{ label: 'Done', cls: 'btn--primary' }] });
      });
    },
  };
})(window.Trunk);
