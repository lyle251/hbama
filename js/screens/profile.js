/* Ellie's Profile.cfg: one profile for buying and selling, trust, reviews, vouching. */
(function (T) {
  const TABS = [['general', 'General'], ['selling', 'Selling'], ['buying', 'Buying'], ['reviews', 'Reviews'], ['vouches', 'Vouches']];
  const own = (uid) => uid === T.state.uid;
  const myActiveVouches = (uid) => T.state.vouches.filter((v) => v.from === uid && v.status === 'ACTIVE').length;
  const canVouch = (uid) => {
    const u = T.user(uid), min = T.school(T.state.school).vouchMin;
    if (u.sales < min) return `You need ${min} successful sales to vouch. You have ${u.sales}.`;
    if (myActiveVouches(uid) >= 3) return 'You already have 3 active vouches.';
    return '';
  };

  function general(uid) {
    const u = T.user(uid), t = T.trust(uid), s = T.state;
    const v = s.vouches.filter((x) => x.to === uid && x.status !== 'FORFEITED').length;
    const sch = T.school(u.school || s.school);
    const ledger = s.ledger.filter((x) => x.uid === uid).slice(-6).reverse();
    return `<div class="row" style="align-items:flex-start;gap:24px"><div class="mon"><span class="ear l"></span><span class="ear r"></span>${T.avatar(uid)}</div>
      <div class="stack" style="flex:1;min-width:220px"><h2>${T.esc(u.name)}</h2>
        <div class="row"><span class="chip chip--soft">${T.esc(sch.name)}</span>${u.verified ? T.verifiedChip : '<span class="chip">unverified</span>'}${T.vouchBadge(uid)}</div>
        <div class="row" style="gap:20px"><span class="px" style="font-size:22px">${u.ratings ? '★ ' + u.rating.toFixed(1) : 'No ratings yet'} <span class="muted">(${u.ratings})</span></span><span class="px" style="font-size:22px">🥜 ${u.credits} credits</span><span class="px" style="font-size:22px">${v} vouch${v === 1 ? '' : 'es'}</span></div>
        ${own(uid) ? '<div class="row"><button class="btn btn--sm" data-act="editProfile">Edit profile</button></div>' : `<div class="row"><a class="btn btn--sm" href="#/market">See listings</a>${vouchButton(uid)}</div>`}</div></div>
      <div class="grid2" style="margin-top:18px"><div class="panel stack sm"><h3 class="px">Trust Score ${t.total}/100</h3>${T.seg(Math.round(t.total / 10), 10)}${T.trustMeter(uid)}</div>
        <div class="panel stack sm"><h3 class="px">Storage: Credits / Rating / Vouches</h3>
          <div class="meter-row"><span>Credits</span>${T.seg(Math.min(10, Math.round(u.credits / 20)), 10)}<span class="num">${u.credits}</span></div>
          <div class="meter-row"><span>Rating</span>${T.seg(Math.round(u.rating * 2), 10)}<span class="num">${u.rating.toFixed(1)}</span></div>
          <div class="meter-row"><span>Vouches</span>${T.seg(Math.min(10, v * 3), 10)}<span class="num">${v}</span></div></div></div>
      <h3 class="px" style="margin:16px 0 6px">Badges</h3><div class="badge-row">${u.verified ? `<div class="badge-ico">${T.icon('shield')}Verified student</div>` : ''}${u.sales >= 3 ? `<div class="badge-ico">${T.icon('check')}${u.sales} sales</div>` : ''}${u.sales >= 8 ? `<div class="badge-ico">${T.icon('floppy')}Top seller</div>` : ''}${v ? `<div class="badge-ico">${T.icon('profile')}Vouched</div>` : ''}${u.noShows === 0 && u.sales > 0 ? `<div class="badge-ico">${T.icon('pin')}Always shows up</div>` : ''}</div>
      ${own(uid) || true ? `<h3 class="px" style="margin:16px 0 6px">Credit ledger</h3>${ledger.length ? `<div style="overflow-x:auto"><table class="table"><tr><th>Change</th><th>Why</th><th>When</th></tr>${ledger.map((x) => `<tr><td class="num"><b>${x.delta > 0 ? '+' : ''}${x.delta}</b></td><td>${T.esc(x.why)}</td><td>${T.esc(x.at)}</td></tr>`).join('')}</table></div>` : '<p class="muted">No credit changes yet.</p>'}` : ''}`;
  }
  function vouchButton(uid) {
    const me = T.state.uid; if (own(uid)) return '';
    if (T.state.vouches.some((v) => v.from === me && v.to === uid && v.status === 'ACTIVE')) return '<span class="chip chip--ver">You vouched ✓</span>';
    return `<button class="btn btn--sm btn--primary" data-act="vouch" data-to="${uid}">Vouch for ${T.esc(T.user(uid).name.split(' ')[0])}</button>`;
  }
  function selling(uid) {
    const mine = T.state.listings.filter((l) => l.seller === uid);
    const g = (st, h) => { const a = mine.filter((l) => (st === 'AVAILABLE' ? l.status === 'AVAILABLE' || l.status === 'NEGOTIATING' : l.status === st)); return a.length ? `<h3 class="px" style="font-size:22px;margin:12px 0 8px">${h} (${a.length})</h3><div class="filegrid">${a.map(T.fileCard).join('')}</div>` : ''; };
    return (g('AVAILABLE', 'Active') + g('ON_HOLD', 'On hold') + g('SOLD', 'Sold · Recycle Bin')) || `<div class="stack" style="align-items:center;padding:16px">${T.ellie({ pose: 'sign', size: 120 })}<p>Nothing listed yet.</p><a class="btn btn--primary" href="#/sell">Sell an item</a></div>`;
  }
  function buying(uid) {
    const cs = Object.values(T.state.chats).filter(() => uid === 'me');
    const row = (c) => { const l = T.listing(c.lid); return `<div class="panel row between" style="margin-bottom:8px"><span>${T.avatar(c.with)} <a href="#/chats/${c.lid}"><b>${T.esc(l.title)}</b></a> <span class="muted">${T.money(l.price)}</span></span>${T.chip(c.status)}</div>`; };
    const prog = cs.filter((c) => c.status !== 'SOLD'), done = cs.filter((c) => c.status === 'SOLD');
    return `<h3 class="px" style="font-size:22px;margin-bottom:8px">In progress (${prog.length})</h3>${prog.map(row).join('') || '<p class="muted">None right now.</p>'}<h3 class="px" style="font-size:22px;margin:14px 0 8px">Bought (${done.length})</h3>${done.map(row).join('') || '<p class="muted">Nothing bought yet.</p>'}`;
  }
  function reviews(uid) {
    const rs = T.state.reviews.filter((r) => r.to === uid);
    return rs.length ? rs.slice().reverse().map((r) => `<div class="panel" style="margin-bottom:10px"><div class="row between"><span>${T.avatar(r.from)} <b>${T.esc(T.user(r.from).name)}</b></span><span class="px" style="font-size:20px">${T.stars(r.stars)}</span></div><p>${T.esc(r.text)}</p><div class="row" style="gap:4px">${r.tags.map((t) => `<span class="chip chip--soft">${T.esc(t)}</span>`).join('')}</div></div>`).join('') : '<p class="muted">No reviews yet. Reviews appear after a sale is confirmed.</p>';
  }
  function vouches(uid) {
    const V = T.state.vouches, recv = V.filter((v) => v.to === uid), given = V.filter((v) => v.from === uid);
    const row = (v, other) => `<tr><td>${T.esc(T.user(other).name)}</td><td class="num">${v.stake}</td><td><span class="chip ${v.status === 'ACTIVE' ? 'chip--ver' : v.status === 'REPAID' ? 'chip--soft' : 'chip--hold'}">${v.status}</span></td><td class="num">${v.good || 0}/5 good</td></tr>`;
    return `<div class="panel stack sm"><h3 class="px">How vouching works</h3><p>A trusted seller stakes credits on a friend. If the friend completes 5 good sales, the stake comes back with a bonus. A 1 to 2 star review or confirmed report in their first 5 sales costs the voucher half the stake.</p></div>
      <h3 class="px" style="font-size:22px;margin:14px 0 6px">Received (${recv.length})</h3>${recv.length ? `<div style="overflow-x:auto"><table class="table"><tr><th>From</th><th>Stake</th><th>Status</th><th>Progress</th></tr>${recv.map((v) => row(v, v.from)).join('')}</table></div>` : '<p class="muted">Nobody has vouched yet.</p>'}
      <h3 class="px" style="font-size:22px;margin:14px 0 6px">Given (${given.length}/3 active max)</h3>${given.length ? `<div style="overflow-x:auto"><table class="table"><tr><th>For</th><th>Stake</th><th>Status</th><th>Progress</th></tr>${given.map((v) => row(v, v.to)).join('')}</table></div>` : '<p class="muted">None yet.</p>'}
      ${own(uid) ? `<div class="row" style="margin-top:12px"><button class="btn btn--primary" data-act="vouchPick">Vouch for a friend</button></div>` : ''}`;
  }

  T.screens.profile = {
    render([uid, tab]) {
      uid = uid || T.state.uid; tab = TABS.some((t) => t[0] === tab) ? tab : 'general';
      const u = T.user(uid), body = { general, selling, buying, reviews, vouches }[tab](uid);
      return T.win({ title: `${T.esc(u.name.split(' ')[0])}'s Profile.cfg`, tone: 'focus', flush: true,
        body: `<div class="tabs" role="tablist">${TABS.map(([k, l]) => `<a class="tab" role="tab" href="#/profile/${uid}/${k}" aria-selected="${k === tab}" style="text-decoration:none;color:inherit">${l}</a>`).join('')}</div><div style="padding:18px">${body}</div>`,
        status: `<span>Trust ${T.trust(uid).total}/100</span><span>${own(uid) ? 'Your profile' : 'Public view'}${T.state.uid !== 'me' ? ' · acting as ' + T.esc(T.me().name) : ''}</span>` });
    },
  };
  T.screens.sold = { render() { return T.screens.profile.render([T.state.uid, 'selling']); } };

  Object.assign(T.acts, {
    editProfile: () => {
      const u = T.me();
      T.dialog({ title: 'Edit_Profile.exe', body: `<b class="px" style="font-size:21px">Edit profile</b>
        <label class="field"><span class="px">Full name</span><input class="input" id="ep-name" value="${T.esc(u.name)}"></label>
        <label class="field"><span class="px">Profile picture</span><input class="input" id="ep-photo" type="file" accept="image/*"><span class="hint">Cropped to a square and framed with elephant ears.</span></label>
        <label class="field"><span class="px">Close friends (comma separated)</span><input class="input" id="ep-friends" value="${T.esc(T.state.friends.join(', '))}"></label>`,
        buttons: [{ label: 'Save', cls: 'btn--primary', run: (ov) => {
          const name = T.$('#ep-name', ov).value.trim(); if (!name) return false;
          u.name = name; if (T.state.uid === 'me') T.state.name = name;
          T.state.friends = T.$('#ep-friends', ov).value.split(',').map((x) => x.trim()).filter(Boolean);
          const f = T.$('#ep-photo', ov).files[0];
          const done = () => { T.save(); T.toast('Profile saved.'); T.render(); };
          if (!f) return done();
          const img = new Image(); img.onload = () => {
            const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), m = Math.min(img.width, img.height);
            x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, 128, 128); u.photo = c.toDataURL('image/jpeg', 0.8); done();
          }; img.src = URL.createObjectURL(f);
        } }, { label: 'Cancel' }] });
    },
    vouch: (el) => {
      const to = el.dataset.to, me = T.me(), why = canVouch(T.state.uid), target = T.user(to);
      if (why) return T.dialog({ title: 'NULL PEANUT ERROR', kind: 'error', body: `<b class="px" style="font-size:21px">You can't vouch yet.</b><span>${T.esc(why)}</span>` });
      const max = Math.min(40, me.credits);
      T.dialog({ title: 'Vouch.exe', body: `<b class="px" style="font-size:21px">Vouch for ${T.esc(target.name)}</b><span>You stake credits on them. They get a <b>Vouched by ${T.esc(me.name.split(' ')[0])} ⭐${me.rating.toFixed(1)}</b> badge and a trust boost.</span>
        <label class="field"><span class="px">Credits to stake (you have ${me.credits})</span><input class="input" id="v-stake" type="number" min="5" max="${max}" value="${Math.min(20, max)}"></label>
        <span class="hint">Get it all back plus a bonus after 5 good sales. Lose half if they get a 1 to 2 star review or a confirmed report in their first 5.</span>`,
        buttons: [{ label: 'Stake and vouch', cls: 'btn--primary', run: (ov) => {
          const stake = Math.floor(Number(T.$('#v-stake', ov).value));
          if (!(stake >= 5 && stake <= max)) { T.toast(`Stake between 5 and ${max} credits.`); return false; }
          me.credits -= stake;
          T.state.vouches.push({ from: T.state.uid, to, stake, status: 'ACTIVE', good: 0, tx: 0 });
          T.state.ledger.push({ uid: T.state.uid, delta: -stake, why: `Staked on vouch for ${target.name}`, at: 'now' });
          T.save(); T.toast(`${target.name.split(' ')[0]} is now vouched. ${stake} credits staked.`); T.render();
        } }, { label: 'Cancel' }] });
    },
    vouchPick: () => {
      const why = canVouch(T.state.uid);
      if (why) return T.dialog({ title: 'NULL PEANUT ERROR', kind: 'error', body: `<b class="px" style="font-size:21px">You can't vouch yet.</b><span>${T.esc(why)}</span>` });
      const cands = Object.values(T.state.users).filter((u) => u.id !== T.state.uid && !u.school && u.ratings < 3 && !T.state.vouches.some((v) => v.from === T.state.uid && v.to === u.id && v.status === 'ACTIVE'));
      T.dialog({ title: 'Vouch.exe', body: `<b class="px" style="font-size:21px">Who are you vouching for?</b><label class="field"><span class="px">Friend</span><select class="input" id="vp">${cands.map((u) => `<option value="${u.id}">${T.esc(u.name)} · ${u.sales} sales</option>`).join('')}</select></label>`,
        buttons: [{ label: 'Next', cls: 'btn--primary', run: (ov) => { const id = T.$('#vp', ov).value; setTimeout(() => T.acts.vouch({ dataset: { to: id } }), 0); } }, { label: 'Cancel' }] });
    },
  });
})(window.Trunk);
