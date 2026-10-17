/* Meetup_Live.exe: opt-in live location window, simulated walk, share link, SOS, check-in.
   Positions live only in memory and are dropped when the meetup ends (see README, privacy). */
(function (T) {
  let timer = null, walk = null;
  const ME_START = { x: 560, y: 360 }, THEM_START = { x: 70, y: 40 };
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function pins(w) {
    const dest = w.dest;
    return [{ id: 'me', ...lerp(ME_START, dest, w.t), label: 'You', variant: 'ellie' }, { id: 'them', ...lerp(THEM_START, dest, Math.min(1, w.t * 1.05)), label: w.name, variant: 'rosie' }];
  }
  function eta(w) { return Math.max(0, Math.round((1 - w.t) * w.mins)); }

  T.screens.live = {
    render([lid]) {
      const s = T.state, ids = Object.keys(s.chats).filter((id) => s.chats[id].meetup);
      lid = lid || ids[0];
      const c = lid && s.chats[lid], l = c && T.listing(lid);
      if (!c || !c.meetup) {
        return T.win({ title: 'Meetup_Live.exe', tone: 'focus', body: `<div class="stack" style="align-items:center;text-align:center;padding:20px 0">${T.ellie({ pose: 'watch', size: 150 })}<h2>No meetup to watch</h2><p>Set a meetup in Messenger. When both of you accept, it shows up here.</p><a class="btn btn--primary" href="#/chats">Open Messenger</a></div>` });
      }
      const m = c.meetup, name = T.user(c.with).name.split(' ')[0], win = s.shareWindow;
      walk = walk && walk.lid === lid ? walk : { lid, t: 0, mins: 12, running: false, dest: { x: m.x, y: m.y }, name, arrived: { me: false, them: false } };
      const consent = win
        ? `<div class="chip chip--ver">Sharing starts ${win} min before · you can stop any time</div>`
        : `<div class="panel stack sm"><b class="px" style="font-size:20px">Share live location? (off by default)</b><span class="hint">Pick when sharing starts. Only you, ${T.esc(name)} and friends you invite can see it. It is deleted when the meetup ends.</span>
            <div class="row">${[60, 30, 15].map((n) => `<button class="btn btn--sm" data-act="shareWin" data-n="${n}">${n} min before</button>`).join('')}</div></div>`;
      return T.win({
        title: 'Meetup_Live.exe', tone: 'focus',
        body: `<div class="stack"><div class="row between"><div><b class="px" style="font-size:22px">${T.esc(l.title.slice(0, 40))}</b><div class="hint">${T.esc(m.name)} · ${new Date(m.when).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })} ${m.safe ? '· <b>safe, public spot</b>' : '· public pin'}</div></div>${T.ellie({ pose: 'watch', size: 80 })}</div>
          ${consent}
          <div class="mapbox" id="live-map">${T.campusSVG({ pins: win ? pins(walk) : [], safeOnly: false, path: win ? [[ME_START.x, ME_START.y], [m.x, m.y]] : null })}</div>
          <div><div class="px" style="font-size:20px" id="live-eta">Estimated time left… ${win ? eta(walk) + ' min' : '—'}</div><div id="live-bar">${T.seg(Math.round(walk.t * 10), 10, true)}</div></div>
          <div class="row"><button class="btn btn--sm" data-act="simWalk" ${win ? '' : 'disabled'}>▶ Simulate walk</button><button class="btn btn--primary" data-act="arrived" ${win ? '' : 'disabled'}>I've arrived</button><button class="btn" data-act="shareFriends">Share with friends</button><button class="btn btn--sos" data-act="sos">SOS</button>${win ? '<button class="btn btn--sm" data-act="stopShare">Stop sharing</button>' : ''}<button class="btn btn--sm" data-act="checkin">Demo: 15 min after meetup</button></div>
          <div class="hint" id="live-note">${walk.arrived.me ? '✓ You arrived.' : ''}${walk.arrived.them ? ' ✓ ' + T.esc(name) + ' arrived.' : ''}</div></div>`,
        status: `<span>${win ? 'Live location ON' : 'Live location OFF'}</span><span>Deleted when the meetup ends</span>`,
      });
    },
    mount() { stop(); },
  };

  function redraw() {
    const m = T.$('#live-map'); if (!m || !walk) return;
    const c = T.state.chats[walk.lid];
    m.innerHTML = T.campusSVG({ pins: pins(walk), path: [[ME_START.x, ME_START.y], [c.meetup.x, c.meetup.y]] });
    T.$('#live-eta').textContent = 'Estimated time left… ' + eta(walk) + ' min';
    T.$('#live-bar').innerHTML = T.seg(Math.round(walk.t * 10), 10, true);
  }
  function check(w) {
    const c = T.state.chats[w.lid];
    if (w.t >= 1 && !w.arrived.them) { w.arrived.them = true; T.$('#live-note').textContent = `✓ ${w.name} arrived. Say hi.`; T.toast(`${w.name} arrived at ${c.meetup.name}.`); }
  }
  Object.assign(T.acts, {
    shareWin: (el) => { T.state.shareWindow = Number(el.dataset.n); T.save(); T.toast(`Location sharing starts ${el.dataset.n} min before the meetup.`); T.render(); },
    stopShare: () => { T.state.shareWindow = 0; walk = null; stop(); T.save(); T.toast('Sharing stopped. Positions deleted.'); T.render(); },
    simWalk: () => {
      if (!walk || timer) return; walk.t = 0; redraw();
      timer = setInterval(() => { walk.t = Math.min(1, walk.t + 0.05); if (!T.$('#live-map')) return stop(); redraw(); check(walk); if (walk.t >= 1) stop(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 40 : 250);
    },
    arrived: () => { if (!walk) return; walk.arrived.me = true; walk.t = Math.max(walk.t, 0.98); redraw(); T.$('#live-note').textContent = '✓ You arrived. Waiting for ' + walk.name + '.'; T.toast('You are marked as arrived.'); setTimeout(() => { if (walk) { walk.t = 1; redraw(); check(walk); } }, 900); },
    shareFriends: () => {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
      const url = location.href.split('#')[0] + '#/track/' + token;
      T.state.track = { token, lid: walk ? walk.lid : null, at: Date.now() }; T.save();
      T.dialog({ title: 'Share_Link.exe', body: `<b class="px" style="font-size:21px">Share with close friends</b><span>Read-only link. It shows where you are going and your live position, and expires when the meetup ends.</span>
        <input class="input" id="share-url" readonly value="${T.esc(url)}" aria-label="Share link"><div class="hint">Close friends: ${T.state.friends.map(T.esc).join(', ')}</div>`,
        buttons: [{ label: 'Copy link', cls: 'btn--primary', run: () => { const i = T.$('#share-url'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => T.toast('Link copied.'), () => T.toast('Press Ctrl+C to copy the selected link.')); return false; } }, { label: 'Done' }] });
    },
    checkin: () => {
      let answered = false;
      const ov = T.dialog({ title: 'Check_In.exe', body: '<b class="px" style="font-size:21px">Are you okay?</b><span>Your meetup ended 15 minutes ago. If you do not answer, we tell your close friends.</span><div class="hint" id="ci-count">Alerting friends in 10 seconds…</div>',
        buttons: [{ label: "I'm okay", cls: 'btn--primary', run: () => { answered = true; T.toast('Glad you are safe. Location data deleted.'); } }] });
      let n = 10; const id = setInterval(() => { n--; const el = T.$('#ci-count'); if (answered || !el) { clearInterval(id); if (!answered && !el) T.toast('Friends alerted: no answer to the check-in.'); return; } if (n <= 0) { clearInterval(id); ov.close(); T.toast('No answer. Friends alerted: ' + T.state.friends.join(', ')); } else el.textContent = `Alerting friends in ${n} seconds…`; }, 1000);
    },
    sos: () => T.dialog({ title: 'SOS.exe', kind: 'error', body: `<b class="px" style="font-size:21px">Need help right now?</b><span>In the demo this only alerts your close friends. In a real emergency call campus police or 911.</span><div class="stack sm"><div class="panel">Emergency: <b class="num">911</b></div><div class="panel">Campus safety: <b>TODO_VERIFY</b></div></div>`,
      buttons: [{ label: 'Alert my close friends', cls: 'btn--sos', run: () => { T.state.sos = true; T.save(); T.toast('Friends alerted with your live location: ' + T.state.friends.join(', ')); } }, { label: 'I am okay' }] }),
  });

  /* Read-only friend view: /track/<token>. */
  T.screens.track = {
    bare: true,
    render([token]) {
      const t = T.state.track, ok = t && t.token === token && t.lid && T.state.chats[t.lid];
      if (!ok) return `<div style="max-width:560px;margin:40px auto">${T.win({ title: 'Track.exe', kind: 'error', body: `<div class="stack" style="align-items:center;text-align:center">${T.ellie({ pose: 'sleep', size: 120 })}<b class="px" style="font-size:22px">This link expired.</b><p>Tracking links end when the meetup ends.</p></div>` })}</div>`;
      const c = T.state.chats[t.lid], m = c.meetup;
      return `<div style="max-width:720px;margin:40px auto">${T.win({ title: 'Track.exe · read-only', tone: 'focus', body: `<div class="stack"><b class="px" style="font-size:22px">${T.esc(T.state.name)} is meeting ${T.esc(T.user(c.with).name)}</b><div class="hint">${m ? T.esc(m.name) : 'Meetup'} · read-only view</div><div class="mapbox">${T.campusSVG({ pins: m ? [{ x: m.x, y: m.y, label: 'Meetup', variant: 'bigred' }] : [] })}</div></div>` })}</div>`;
    },
  };
})(window.Trunk);
