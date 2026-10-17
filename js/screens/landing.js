/* Landing: a calm hero, three reasons to join, and the sign-in entry points. */
(function (T) {
  T.screens.landing = {
    bare: true,
    render() {
      const feat = [
        ['Your semester, planned', 'Connect your classes and Trunk lists every textbook, lab manual and calculator you need, with the lowest price on campus.', 'kit'],
        ['Verified students only', 'Every seller has a .edu email and a student check. Trust Scores and vouches show who is reliable.', 'shield'],
        ['Safer meetups', 'Pick a public spot on campus. Share live location only when you choose, and only with people you trust.', 'pin'],
      ];
      return `<section class="landing-hero">
          <div class="stack" style="gap:18px">
            <span class="chip chip--ver" style="align-self:flex-start">Campus marketplace · starting at the University of Alabama</span>
            <h1 class="big-title">Never forget what you need. Never waste what you don't.</h1>
            <p class="lead">Buy, sell and trade textbooks, dorm gear, lab supplies, tickets, tutoring and rides with verified students at your school and beyond.</p>
            <div class="row"><a class="btn btn--primary" href="#/login" data-mode="signup">Get started</a><a class="btn" href="#/login" data-mode="login">Log in</a><a class="btn btn--sm" href="#/demo">Demo controls</a></div>
          </div>
          <div class="landing-art" aria-hidden="true">${T.ellie({ pose: 'laptop', size: 230 })}</div>
        </section>
        <section class="grid3">${feat.map(([h, p, i]) => `<article class="panel stack sm"><div class="feat-ico">${T.icon(i)}</div><h3>${h}</h3><p class="muted">${p}</p></article>`).join('')}</section>
        <p class="hint" style="margin-top:22px;text-align:center">One profile to buy and sell · Every school gets its own market · Browse other campuses</p>`;
    },
    mount(el) {
      T.$$('a[data-mode]', el).forEach((a) => a.addEventListener('click', () => { T.mode = a.dataset.mode; }));
    },
  };
})(window.Trunk);
