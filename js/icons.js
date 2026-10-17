/* Desktop icons, 48x48, 2.5px ink outline. Drop shadow comes from CSS. */
window.Trunk = window.Trunk || {};
(function (T) {
  const I = '#262626';
  const s = `stroke="${I}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const wrap = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;
  const trunkPeek = `<g transform="translate(26 2)"><circle cx="8" cy="8" r="7" fill="#fff" ${s}/><circle cx="4" cy="6" r="1.4" fill="${I}"/><circle cx="12" cy="6" r="1.4" fill="${I}"/><path d="M8 9 q0 5 4 4" fill="none" ${s}/></g>`;
  const ICONS = {
    market: wrap(`${trunkPeek}<path d="M4 16 h14 l4 4 h22 v22 H4 Z" fill="#C9A06A" ${s}/><path d="M4 24 h40" stroke="${I}" stroke-width="2"/>`),
    kit: wrap(`<rect x="8" y="5" width="32" height="38" rx="3" fill="#fff" ${s}/><path d="M14 14 h20 M14 21 h20 M14 28 h12" stroke="${I}" stroke-width="2" stroke-linecap="round"/><path d="M30 31 l4 4 l8 -9" fill="none" stroke="#3F8F5B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
    sell: wrap(`<path d="M8 40 L36 12 l6 6 L14 46 H8 Z" fill="#E4E4E4" ${s}/><path d="M32 16 l6 6" ${s}/><circle cx="11" cy="14" r="6" fill="#4C7A2E" ${s}/><circle cx="24" cy="9" r="4" fill="#fff" ${s}/>`),
    chats: wrap(`<rect x="4" y="8" width="30" height="22" rx="5" fill="#fff" ${s}/><path d="M10 30 v8 l8 -8" fill="#fff" ${s}/><rect x="16" y="18" width="28" height="20" rx="5" fill="#C9A06A" ${s}/><path d="M38 38 v6 l-7 -6" fill="#C9A06A" ${s}/>`),
    hub: wrap(`<path d="M3 20 Q3 12 12 12 Q16 5 24 7 Q34 5 37 13 Q46 14 45 23 Z" fill="#fff" ${s}/><rect x="6" y="22" width="36" height="22" rx="3" fill="#C9A06A" ${s}/><path d="M16 29 h16 M16 36 h10" stroke="${I}" stroke-width="2" stroke-linecap="round"/>`),
    globe: wrap(`<circle cx="24" cy="25" r="18" fill="#E4E4E4" ${s}/><path d="M6 25 h36 M24 7 q-12 18 0 36 M24 7 q12 18 0 36" fill="none" ${s}/><path d="M14 16 q6 2 6 8 M30 30 q6 -2 8 2" fill="none" stroke="#4C7A2E" stroke-width="3" stroke-linecap="round"/>`),
    bin: wrap(`<path d="M10 14 h28 l-3 30 H13 Z" fill="#fff" ${s}/><rect x="7" y="9" width="34" height="6" rx="2" fill="#C9A06A" ${s}/><path d="M19 9 v-4 h10 v4 M18 22 v14 M24 22 v14 M30 22 v14" fill="none" ${s}/>`),
    profile: wrap(`<rect x="4" y="5" width="40" height="28" rx="4" fill="#E4E4E4" ${s}/><circle cx="12" cy="7" r="6" fill="#fff" ${s} transform="translate(-2 -2)"/><circle cx="36" cy="7" r="6" fill="#fff" ${s} transform="translate(2 -2)"/><circle cx="17" cy="20" r="2" fill="${I}"/><circle cx="31" cy="20" r="2" fill="${I}"/><path d="M24 22 q-1 6 4 6" fill="none" ${s}/><rect x="16" y="35" width="16" height="5" fill="#C9A06A" ${s}/><rect x="10" y="40" width="28" height="5" rx="2" fill="#fff" ${s}/>`),
    pin: wrap(`<path d="M24 45 C10 30 8 24 8 19 a16 16 0 0 1 32 0 c0 5 -2 11 -16 26 Z" fill="#4C7A2E" ${s}/><circle cx="24" cy="19" r="6" fill="#fff" ${s}/>`),
    gear: wrap(`<circle cx="24" cy="24" r="8" fill="#fff" ${s}/><path d="M24 4 v6 M24 38 v6 M4 24 h6 M38 24 h6 M10 10 l4 4 M34 34 l4 4 M38 10 l-4 4 M14 34 l-4 4" ${s}/>`),
    floppy: wrap(`<path d="M6 6 h30 l6 6 v30 H6 Z" fill="#4C7A2E" ${s}/><rect x="13" y="6" width="18" height="12" fill="#fff" ${s}/><rect x="12" y="26" width="24" height="16" rx="2" fill="#E4E4E4" ${s}/>`),
    check: wrap(`<circle cx="24" cy="24" r="19" fill="#fff" ${s}/><path d="M14 25 l7 7 l14 -16" fill="none" stroke="#3F8F5B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
    shield: wrap(`<path d="M24 4 L41 10 V24 C41 34 33 41 24 45 C15 41 7 34 7 24 V10 Z" fill="#fff" ${s}/><path d="M16 24 l6 6 l11 -12" fill="none" stroke="#3F8F5B" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  };
  T.emerald = (n = 16) => `<svg viewBox="0 0 16 16" width="${n}" height="${n}" aria-hidden="true"><path d="M8 1 L14 6 L12 14 H4 L2 6 Z" fill="#2FCB7A" stroke="#0E5E34" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 3 L11 6 H5 Z" fill="#8FF0BA"/></svg>`;
  T.icon = (name) => ICONS[name] || ICONS.market;

  /** Folder with an elephant peeking out, tinted for a category. */
  T.folder = function (accent = '#C9A06A') {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <g transform="translate(18 2)"><circle cx="14" cy="14" r="11" fill="#fff" stroke="${I}" stroke-width="2"/><circle cx="3" cy="14" r="6" fill="#fff" stroke="${I}" stroke-width="2"/><circle cx="25" cy="14" r="6" fill="#fff" stroke="${I}" stroke-width="2"/><circle cx="10" cy="12" r="1.8" fill="${I}"/><circle cx="18" cy="12" r="1.8" fill="${I}"/><path d="M14 16 q0 7 5 6" fill="none" stroke="${I}" stroke-width="2" stroke-linecap="round"/></g>
      <path d="M4 22 h20 l5 5 h31 v32 H4 Z" fill="${accent}" stroke="${I}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M4 32 h56" stroke="${I}" stroke-width="2"/></svg>`;
  };

  /** Category glyphs used inside listing thumbnails. */
  const G = {
    CLASS: `<rect x="8" y="6" width="32" height="36" rx="3" fill="#fff" ${s}/><path d="M8 14 h32" ${s}/><path d="M16 22 h16 M16 29 h12" ${s}/>`,
    DORM: `<path d="M6 40 V20 L24 8 l18 12 v20 Z" fill="#fff" ${s}/><rect x="18" y="26" width="12" height="14" fill="#C9A06A" ${s}/>`,
    LAB: `<path d="M18 6 h12 M20 6 v14 L9 40 q-1 4 3 4 h24 q4 0 3 -4 L28 20 V6" fill="#fff" ${s}/><path d="M14 33 h20" stroke="#4C7A2E" stroke-width="5"/>`,
    TICKET: `<path d="M4 14 h40 v7 a3 3 0 0 0 0 6 v7 H4 v-7 a3 3 0 0 0 0 -6 Z" fill="#C9A06A" ${s}/><path d="M32 14 v20" stroke="${I}" stroke-width="2" stroke-dasharray="3 3"/>`,
    TUTOR: `<path d="M24 8 L4 18 l20 10 l20 -10 Z" fill="#fff" ${s}/><path d="M12 24 v10 q12 8 24 0 V24" fill="#C9A06A" ${s}/>`,
    RIDE: `<path d="M5 30 l4 -12 q1 -3 4 -3 h22 q3 0 4 3 l4 12 v8 H5 Z" fill="#fff" ${s}/><circle cx="15" cy="38" r="5" fill="#4C7A2E" ${s}/><circle cx="35" cy="38" r="5" fill="#4C7A2E" ${s}/>`,
    VEHICLE: `<path d="M4 30 l5 -10 q1 -3 4 -3 h22 q3 0 4 3 l5 10 v6 H4 Z" fill="#4C7A2E" ${s}/><path d="M12 20 h24" ${s}/><circle cx="14" cy="38" r="5" fill="#fff" ${s}/><circle cx="36" cy="38" r="5" fill="#fff" ${s}/>`,
    OTHER: `<path d="M6 16 L24 6 l18 10 v20 L24 46 L6 36 Z" fill="#fff" ${s}/><path d="M6 16 l18 10 l18 -10 M24 26 v20" fill="none" ${s}/>`,
  };
  T.glyph = (cat) => wrap(G[cat] || G.OTHER);
})(window.Trunk);
