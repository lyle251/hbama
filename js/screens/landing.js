/* Landing: overlapping, slightly tilted windows on the desktop. */
(function (T) {
  T.screens.landing = {
    bare: true,
    render() {
      const welcome = T.win({
        title: 'Welcome.exe', tone: 'focus',
        body: `<div class="hero">
          <div class="stack" style="gap:16px">
            <span class="px muted" style="font-size:20px">C:\\TRUNK\\WELCOME&gt; campus marketplace</span>
            <h1 class="big-title">Never forget what you need. Never waste what you don't.</h1>
            <p style="max-width:46ch">Buy, sell and trade textbooks, dorm gear, lab supplies, tickets, tutoring and rides with verified students at your school. Trunk reads your class list and tells you what to buy before the semester starts.</p>
            <div class="row"><a class="btn btn--primary" href="#/login" data-mode="signup">Get started</a><a class="btn" href="#/login" data-mode="login">Log in</a><a class="btn btn--sm" href="#/demo">Demo controls</a></div>
          </div>
          <div aria-hidden="true">${T.ellie({ pose: 'laptop', size: 200 })}</div>
        </div>
        ${T.parade()}`,
        status: '<span>1 elephant online</span><span>3 campuses · 40+ listings</span>',
      });
      const loading = T.win({
        title: 'Loading_Campus.exe', dots: true, extra: 'tilt-r',
        body: `<div class="stack"><div class="px" style="font-size:20px">Estimated time left… <span id="eta">51 years</span></div><div id="load-bar">${T.seg(0, 16)}</div><div class="hint">Fetching textbooks, safe meetup spots and your classmates.</div></div>`,
      });
      const readme = T.win({
        title: 'README.txt', extra: 'tilt-l',
        body: `<ul style="margin:0;padding-left:18px;display:grid;gap:8px">
          <li><b>One profile</b> buys and sells at the same time.</li>
          <li><b>.edu verified</b> students only, with a Trust Score you can read.</li>
          <li><b>Every school gets its own market,</b> and you can browse other campuses.</li>
          <li><b>Safe meetups</b> with opt-in live location, shared only with people you pick.</li>
        </ul>`,
      });
      const sys = T.win({
        title: 'System Information', dots: true, extra: 'tilt-r',
        body: `<div class="dlg"><div class="ico">${T.ellieHead(52)}</div><div class="stack sm"><b class="px" style="font-size:21px">Listing posted! 3 classmates need this.</b><span class="hint">Ellie is already telling them.</span></div></div>`,
      });
      return `<div class="logo-mark" aria-label="Trunk">TRUNK</div>
        <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:28px;align-items:start;max-width:1180px;margin:30px auto 0">
          <div>${welcome}</div>
          <div class="stack" style="gap:26px">${loading}${readme}${sys}</div>
        </div>
        <style>@media (max-width:900px){#stage > div[style*="grid-template-columns"]{grid-template-columns:minmax(0,1fr)!important;margin-top:4px!important}}</style>`;
    },
    mount(el) {
      T.$$('a[data-mode]', el).forEach((a) => a.addEventListener('click', () => { T.mode = a.dataset.mode; }));
      let n = 0;
      const bar = T.$('#load-bar', el), eta = T.$('#eta', el);
      const etas = ['51 years', '12 days', '3 hours', '15 min', '2 min', 'about a minute'];
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { bar.innerHTML = T.seg(11, 16); eta.textContent = 'about a minute'; return; }
      const id = setInterval(() => {
        if (!document.body.contains(bar)) return clearInterval(id);
        n = (n + 1) % 17;
        bar.innerHTML = T.seg(n, 16);
        eta.textContent = etas[Math.min(etas.length - 1, Math.floor(n / 3))];
      }, 420);
    },
  };
})(window.Trunk);
