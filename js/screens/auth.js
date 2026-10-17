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
          <label class="field"><span class="px">School email (.edu)</span><input class="input" id="f-email" type="email" autocomplete="email" value="jordan@crimson.ua.edu" inputmode="email"><span class="hint" id="detect">Try crimson.ua.edu, auburn.edu or gatech.edu. Your school is detected from your email.</span></label>
          <div class="row end"><button class="btn btn--primary" type="submit">Send my code</button></div>
        </form>`,
        status: '<span>Campus-verified with .edu</span><span>DEMO_MODE=true</span>',
      })}</div>`;
    },
    mount(el) {
      const detect = () => { const sch = schoolForEmail(T.$('#f-email', el).value.trim()), h = T.$('#detect', el); h.innerHTML = sch ? `School detected: <b>${T.esc(sch.name)}</b> (${T.esc(sch.city)}, ${sch.st})` : 'Your school is detected from your email.'; };
      T.$('#f-email', el).addEventListener('input', detect); detect();
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
        s.chosen = true; T.save();
        T.dialog({ title: 'Welcome', body: `<b class="px" style="font-size:21px">Verified student</b><span>We matched <b>@${T.esc(domainOf(a.email))}</b> to <b>${T.esc(T.school(a.school).name)}</b>. You are in.</span>`, buttons: [{ label: 'Enter the market', cls: 'btn--primary', run: () => { T.go('desktop'); } }] });
      }
    },
  };

})(window.Trunk);
