/* Buying lifecycle state machine. Pure functions, no DOM, so the server can reuse them.
   AVAILABLE -> NEGOTIATING -> ON_HOLD -> SOLD, with CANCELLED and no-show branches back to AVAILABLE. */
window.Trunk = window.Trunk || {};
(function (T) {
  const TABLE = {
    AVAILABLE: { message: 'NEGOTIATING' },
    NEGOTIATING: { meetup_both_accepted: 'ON_HOLD', cancel: 'AVAILABLE' },
    ON_HOLD: { both_confirmed: 'SOLD', cancel: 'AVAILABLE', no_show: 'AVAILABLE', change_requested: 'NEGOTIATING' },
    SOLD: {},
  };
  T.TX = {
    next(status, event) {
      const to = (TABLE[status] || {})[event];
      if (!to) throw new Error(`Illegal transition: ${status} + ${event}`);
      return to;
    },
    can(status, event) { return !!(TABLE[status] || {})[event]; },
    /** Apply a meetup acceptance by one party ('me' or 'them'). Returns the new status. */
    accept(chat, party) {
      if (!chat.meetup) throw new Error('No meetup proposed');
      chat.meetup.acc[party] = true;
      if (chat.meetup.acc.me && chat.meetup.acc.them && chat.status === 'NEGOTIATING') chat.status = T.TX.next(chat.status, 'meetup_both_accepted');
      return chat.status;
    },
    /** Confirm a successful handoff. Only allowed while ON_HOLD. SOLD once both confirm. */
    confirm(chat, party) {
      if (chat.status !== 'ON_HOLD') throw new Error('Nothing to confirm');
      chat.confirm[party] = true;
      if (chat.confirm.me && chat.confirm.them) chat.status = T.TX.next(chat.status, 'both_confirmed');
      return chat.status;
    },
    cancel(chat) {
      chat.status = T.TX.next(chat.status, 'cancel');
      chat.meetup = null; chat.confirm = { me: false, them: false };
      return chat.status;
    },
    noShow(chat) {
      chat.status = T.TX.next(chat.status, 'no_show');
      chat.meetup = null; chat.confirm = { me: false, them: false };
      return chat.status;
    },
  };


  /* Vouch outcomes after a review of `uid` (the vouchee). Stake is returned with a bonus after 5 good sales,
     and partly forfeited on a 1-2 star review within the first 5 transactions. */
  T.applyVouchOutcome = function (uid, stars) {
    const st = T.state, out = [];
    st.vouches.filter((v) => v.to === uid && v.status === 'ACTIVE').forEach((v) => {
      v.tx = (v.tx || 0) + 1;
      const voucher = T.user(v.from);
      if (stars <= 2) {
        const lost = Math.ceil(v.stake / 2);
        v.status = 'FORFEITED'; voucher.credits += v.stake - lost;
        st.ledger.push({ uid: v.from, delta: v.stake - lost, why: `Vouch for ${T.user(uid).name} went badly: ${lost} of ${v.stake} staked credits lost`, at: 'now' });
        out.push(`${voucher.name} lost ${lost} staked credits.`);
      } else {
        v.good = (v.good || 0) + (stars >= 4 ? 1 : 0);
        if (v.good >= 5) {
          v.status = 'REPAID'; const bonus = 10;
          voucher.credits += v.stake + bonus;
          st.ledger.push({ uid: v.from, delta: v.stake + bonus, why: `Vouch for ${T.user(uid).name} paid off: stake back plus ${bonus}`, at: 'now' });
          out.push(`${voucher.name} got the stake back plus ${bonus}.`);
        }
      }
    });
    return out;
  };

  /* Trust Score 0-100 with a transparent breakdown. */
  T.trust = function (uid) {
    const u = T.user(uid), st = T.state;
    const vouches = st.vouches.filter((v) => v.to === uid && v.status !== 'FORFEITED');
    const voucherWeight = vouches.reduce((a, v) => a + (T.trustBase(v.from) / 100), 0);
    const parts = [
      ['Verified student', u.verified ? 20 : 0, 20],
      ['Rating', u.ratings ? Math.round((u.rating / 5) * 25 * Math.min(1, u.ratings / 5)) : 0, 25],
      ['Completed sales', Math.round(Math.min(u.sales, 10) / 10 * 20), 20],
      ['Credits', Math.round(Math.min(u.credits, 200) / 200 * 10), 10],
      ['Vouches', Math.round(Math.min(voucherWeight, 1) * 10), 10],
      ['Account age', Math.round(Math.min(u.months, 12) / 12 * 10), 10],
      ['No-shows', -Math.min(15, u.noShows * 5), 0],
    ];
    const total = Math.max(0, Math.min(100, parts.reduce((a, p) => a + p[1], 0)));
    return { total, parts };
  };
  /* Same formula without vouches, used to weight a voucher (avoids recursion). */
  T.trustBase = function (uid) {
    const u = T.user(uid);
    const t = (u.verified ? 20 : 0) + (u.ratings ? Math.round((u.rating / 5) * 25 * Math.min(1, u.ratings / 5)) : 0)
      + Math.round(Math.min(u.sales, 10) / 10 * 20) + Math.round(Math.min(u.credits, 200) / 200 * 10)
      + Math.round(Math.min(u.months, 12) / 12 * 10) - Math.min(15, u.noShows * 5);
    return Math.max(0, Math.min(100, t));
  };
})(window.Trunk);
