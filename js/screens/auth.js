/* Sign up / log in, email code, student ID check (mock SheerID), and campus selection. */
(function (T) {
  const DEMO_ID = '10203040';
  T.auth = { step: 'code', code: '', mode: 'signup' };

  const domainOf = (email) => (email.split('@')[1] || '').toLowerCase();
  const schoolForEmail = (email) => T.SCHOOLS.find((s) => s.domains.includes(domainOf(email)));

  T.screens.login = {
    bare: true,
    render() {
      const mode = T.mode || 'signup';
      return `<div style="max-width:560px;margin:40px auto 0">${T.win({
        title: 'Sign in', tone: 'focus',
        body: `<form id="login-form" class="stack" novalidate>
          <div class="row between"><h2>${mode === 'signup' ? 'Create your profile' : 'Welcome back'}</h2>${T.ellie({ pose: 'wave', size: 84 })}</div>
          <div class="row" role="tablist" aria-label="Sign up or log in">
            <button type="button" class="btn btn--sm ${mode === 'signup' ? 'btn--primary' : ''}" data-act="authMode" data-mode="signup" role="tab" aria-selected="${mode === 'signup'}">Sign up</button>
            <button type="button" class="btn btn--sm ${mode === 'login' ? 'btn--primary' : ''}" data-act="authMode" data-mode="login" role="tab" aria-selected="${mode === 'login'}">Log in</button>
          </div>
          ${mode === 'signup' ? '<label class="field"><span class="px">Full name</span><input class="input" id="f-name" autocomplete="name" value="Jordan Lee"></label>' : ''}
          <label class="field"><span class="px">School email (.edu)</span><input class="input" id="f-email" type="email" autocomplete="email" value="jordan@crimson.ua.edu" inputmode="email"><span class="hint">Try crimson.ua.edu, auburn.edu or gatech.edu. Any other domain shows the request-a-school flow.</span></label>
          <div class="row end"><button class="btn btn--primary" type="submit">Send my code</button></div>
        </form>`,
        status: '<span>Campus-verified with .edu</span><span>DEMO_MODE=true</span>',
      })}</div>`;
    },
    mount(el) {
      T.$('#login-form', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const email = T.$('#f-email', el).value.trim();
        const name = T.$('#f-name', el) ? T.$('#f-name', el).value.trim() : T.state.name;
        const sch = schoolForEmail(email);
        if (!/^\S+@\S+\.edu$/i.test(email)) {
          return T.dialog({ title: 'Please check this', kind: 'error', body: '<b class="px" style="font-size:21px">That is not a .edu address.</b><span>Trunk is for verified students. Use your school email.</span>' });
        }
        if (!sch) {
          return T.dialog({
            title: 'That did not work', kind: 'error',
            body: `<b class="px" style="font-size:21px">Your school isn't on Trunk yet.</b><span>We can open <b>${T.esc(domainOf(email))}</b> in under a minute once enough students ask.</span>`,
            buttons: [{ label: 'Request my school', cls: 'btn--primary', run: () => { (T.state.requests = T.state.requests || []).push({ domain: domainOf(email), email }); T.save(); T.toast('Request saved. We will email you when your campus opens.'); } }, { label: 'Close' }],
          });
        }
        T.auth = { step: 'code', code: String(Math.floor(100000 + Math.random() * 900000)), mode: T.mode || 'signup', email, name: name || T.state.name, school: sch.slug };
        console.info('[Trunk demo] one-time code for ' + email + ': ' + T.auth.code);
        T.go('verify');
        setTimeout(() => T.toast('Dev toast: your code is ' + T.auth.code), 200);
      });
    },
  };
  T.acts.authMode = (el) => { T.mode = el.dataset.mode; T.render(); };

  T.screens.verify = {
    bare: true,
    render() {
      const a = T.auth;
      if (!a.email) return `<div style="max-width:520px;margin:40px auto">${T.win({ title: 'Verify your email', body: '<p>Start by signing in first.</p><a class="btn btn--primary" href="#/login">Go to login</a>' })}</div>`;
      const body = a.step === 'code'
        ? `<form id="code-form" class="stack" novalidate>
            <h2>Check your inbox</h2>
            <p>We sent a 6-digit code to <b>${T.esc(a.email)}</b>.</p>
            <label class="field"><span class="px">One-time code</span><input class="input px" id="f-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" style="font-size:28px;letter-spacing:.3em;text-align:center"></label>
            <div class="hint">Demo mode: the code is printed to the server console and shown in the dev toast. Code: <b class="num">${a.code}</b></div>
            <div class="row end"><a class="btn" href="#/login">Back</a><button class="btn btn--primary" type="submit">Verify</button></div></form>`
        : `<form id="id-form" class="stack" novalidate>
            <div class="row between"><h2>Verify you're a student</h2>${T.icon('shield').replace('<svg', '<svg width="52" height="52"')}</div>
            <p class="hint">Mock SheerID check. IDs matching the seeded pattern (8 digits starting with 1) are approved. Try <b>${DEMO_ID}</b>.</p>
            <label class="field"><span class="px">Student ID number</span><input class="input" id="f-id" inputmode="numeric" value="${DEMO_ID}"></label>
            <label class="field"><span class="px">Student ID photo</span><input class="input" id="f-photo" type="file" accept="image/*"><span class="hint" id="photo-note">Optional in the demo. The file never leaves your browser.</span></label>
            <div class="row end"><button class="btn btn--primary" type="submit">Submit for approval</button></div></form>`;
      return `<div style="max-width:560px;margin:40px auto 0">${T.win({ title: a.step === 'code' ? 'Verify your email' : 'Student verification', tone: 'focus', body, status: `<span>Step ${a.step === 'code' ? 1 : 2} of 2</span><span>${a.step === 'code' ? T.seg(5, 10).replace(/<div class="seg/, '<div style="width:140px" class="seg') : T.seg(10, 10).replace(/<div class="seg/, '<div style="width:140px" class="seg')}</span>` })}</div>`;
    },
    mount(el) {
      const a = T.auth;
      const code = T.$('#code-form', el);
      if (code) code.addEventListener('submit', (e) => {
        e.preventDefault();
        if (T.$('#f-code', el).value.trim() !== a.code) {
          return T.dialog({ title: 'Please check this', kind: 'error', body: '<b class="px" style="font-size:21px">That code does not match.</b><span>Check the six digits and try again.</span>' });
        }
        const known = T.state.signedIn && T.state.email === a.email && T.state.verified;
        if (a.mode === 'login' || known) return finish(true);
        a.step = 'id'; T.render();
      });
      const idf = T.$('#id-form', el);
      if (idf) {
        T.$('#f-photo', el).addEventListener('change', (e) => { const f = e.target.files[0]; if (f) T.$('#photo-note', el).textContent = 'Attached: ' + f.name; });
        idf.addEventListener('submit', (e) => {
          e.preventDefault();
          const ok = /^1\d{7}$/.test(T.$('#f-id', el).value.trim());
          if (!ok) return T.dialog({ title: 'That did not work', kind: 'error', body: '<b class="px" style="font-size:21px">ID not approved.</b><span>The mock check accepts 8 digits starting with 1.</span>' });
          finish(true);
        });
      }
      function finish(verified) {
        const s = T.state;
        s.signedIn = true; s.email = a.email; s.name = a.name; s.verified = verified; s.home = a.school; s.school = a.school; s.uid = 'me';
        s.users.me.name = a.name; s.users.me.verified = verified;
        T.save();
        T.dialog({ title: 'Done', body: '<b class="px" style="font-size:21px">Verified Student ✓</b><span>Your profile is ready. Next, pick your campus.</span>', buttons: [{ label: 'Choose my campus', cls: 'btn--primary', run: () => { T.go('campus'); } }] });
      }
    },
  };

  /* ---------- Choose your campus ---------- */
  function counts(slug) {
    const c = {};
    T.state.listings.filter((l) => l.school === slug && l.status !== 'SOLD').forEach((l) => { c[l.spot] = (c[l.spot] || 0) + 1; });
    return c;
  }
  function usMap() {
    const pins = T.SCHOOLS.map((s) => {
      const [x, y] = T.project(s.lng, s.lat);
      return `<g class="pin" role="button" tabindex="0" data-act="pickSchool" data-slug="${s.slug}" aria-label="${T.esc(s.name)}, ${s.city}">
        <g class="pin-body" transform="translate(${x - 18} ${y - 44})">${T.ellieHead(36)}</g>
        <text x="${x}" y="${y + 10}" text-anchor="middle" style="font:800 16px Nunito,sans-serif;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:5px">${s.short}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 960 560" role="img" aria-label="Map of the United States with Trunk campuses"><rect width="960" height="560" style="fill:var(--red-100)"/>
      <g id="mapg" class="zoomable"><path d="${T.usPath}" style="fill:var(--surface);stroke:var(--ink-soft);stroke-width:2;stroke-linejoin:round"/>${pins}</g></svg>`;
  }
  T.screens.campus = {
    render() {
      const s = T.state;
      const opts = T.SCHOOLS.map((x) => `<option value="${x.slug}" ${x.slug === s.school ? 'selected' : ''}>${x.name} (${x.city}, ${x.st})</option>`).join('');
      return T.win({
        title: 'Choose your campus', tone: 'focus',
        menu: `<span class="px">Campus</span><label class="grow pathfield"><span class="sr">Search campuses</span><select class="input" id="school-sel" style="font-family:var(--font-pixel);font-size:19px">${'<option value="">Choose a school</option>' + opts}</select></label>`,
        body: `<div id="campus-body" class="stack"><div class="hint">Click an elephant pin to zoom in. Trunk is live at 3 schools.</div><div class="mapbox" id="mapbox">${usMap()}</div><div id="zoombar" hidden>${T.seg(0, 20)}</div></div>`,
        status: '<span>3 campuses online</span><span>Request yours: Start → Add a school</span>',
      });
    },
    mount(el) {
      const sel = T.$('#school-sel', el);
      sel.addEventListener('change', () => { if (sel.value) pick(sel.value); });
      T.$$('.pin', el).forEach((p) => p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.dispatchEvent(new Event('click', { bubbles: true })); } }));
    },
  };
  function pick(slug) {
    const sch = T.school(slug), g = T.$('#mapg');
    const [px, py] = T.project(sch.lng, sch.lat), k = 7;
    T.state.school = slug; T.save();
    const bar = T.$('#zoombar'); bar.hidden = false;
    g.style.transform = `translate(${480 - k * px}px, ${280 - k * py}px) scale(${k})`;
    let n = 0;
    const id = setInterval(() => { n++; bar.innerHTML = T.seg(n, 20); if (n >= 20) { clearInterval(id); showCampus(slug); } }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 5 : 45);
  }
  T.acts.pickSchool = (el) => pick(el.dataset.slug);
  function showCampus(slug) {
    const sch = T.school(slug), c = counts(slug), total = Object.values(c).reduce((a, b) => a + b, 0);
    const home = T.state.home === slug;
    T.$('#campus-body').innerHTML = `<div class="row between"><h2>${T.esc(sch.name)}</h2><span class="chip chip--soft">${sch.city}, ${sch.st}</span></div>
      <div class="mapbox">${T.campusSVG({ counts: c })}</div>
      <div class="row between"><span class="hint">Numbered pins show active listings near each meetup spot. Red check pins are lit, public, safe exchange spots.</span>
      <span class="row"><button class="btn" type="button" data-act="backToUS">Back to US map</button><button class="btn btn--primary" type="button" data-act="enterCampus" data-slug="${slug}">Enter ${sch.short} Market</button></span></div>
      ${home ? '' : '<div class="chip chip--neg" style="align-self:flex-start">Visiting: you can browse and buy across campuses</div>'}`;
    T.$('.statusbar span').textContent = `${total} active listings`;
  }
  T.acts.backToUS = () => T.render();
  T.acts.enterCampus = (el) => { T.state.school = el.dataset.slug; T.state.chosen = true; T.save(); T.go('desktop'); };
})(window.Trunk);
