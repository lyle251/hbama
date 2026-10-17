/* Landing: a block-world hero, an item hotbar of categories, and three reasons to join. */
(function (T) {
  T.screens.landing = {
    bare: true,
    render() {
      const feat = [
        ['Your semester, crafted', 'Sign in and Trunk reads your classes, lists every textbook, lab manual and calculator you need, and shows the lowest price on campus.', 'kit'],
        ['Verified students only', 'Your .edu email tells us your school. A student check and a Trust Score show who is reliable.', 'shield'],
        ['Meet up safely', 'When you go pick something up, a live map shows you and the seller to each other, only for that meetup.', 'pin'],
      ];
      const hot = Object.entries(T.CATS).map(([k, v]) => `<a href="#/login" data-mode="signup" aria-label="${v}">${T.glyph(k)}<span>${v.split(' ')[0]}</span></a>`).join('');
      return `<section class="landing-hero"><div class="window"><div class="window__body"><div class="stack" style="gap:18px">
            <span class="chip chip--ver" style="align-self:flex-start;white-space:normal">Campus marketplace · University of Alabama first</span>
            <h1 class="big-title">Never forget what you need. Never waste what you don't.</h1>
            <p class="lead">Buy, sell and trade textbooks, dorm gear, lab supplies, tickets, tutoring and rides with verified students at your school and beyond.</p>
            <div class="row"><a class="btn btn--primary" href="#/login" data-mode="signup">Get started</a><a class="btn" href="#/login" data-mode="login">Log in</a><a class="btn btn--sm" href="#/demo">Demo controls</a></div>
          </div></div></div>
          <div class="landing-art" aria-hidden="true">${T.ellie({ pose: 'laptop', size: 230 })}<div class="blocks"><i></i><i></i><i></i></div></div></section>
        <nav class="hotbar" aria-label="Browse by category">${hot}</nav>
        <section class="grid3">${feat.map(([h, p, i]) => `<article class="window"><div class="window__body stack sm"><div class="feat-ico">${T.icon(i)}</div><h3>${h}</h3><p>${p}</p></div></article>`).join('')}</section>`;
    },
    mount(el) { T.$$('a[data-mode]', el).forEach((a) => a.addEventListener('click', () => { T.mode = a.dataset.mode; })); },
  };
})(window.Trunk);
