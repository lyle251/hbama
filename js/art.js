/* Example product illustrations, drawn in code (not photos). One per item type so every listing has a picture.
   Real photos override these: a seller's upload, or a file at img/products/<listing id>.jpg. */
window.Trunk = window.Trunk || {};
(function (T) {
  const K = '#262626';
  const o = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const COURSE = { 'CS 100': '#3A7D44', 'ECE 380': '#3A5FA0', 'CH 101': '#C07A2C', 'EN 102': '#7A4FA0', 'MATH 125': '#2F8A8A', 'PY 101': '#8A5A35', 'BSC 114': '#6B8E23', 'ST 260': '#5B6B7B' };
  const wrap = (inner) => `<svg class="art" viewBox="0 0 200 150" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  const lines = (title, max = 11) => {
    const out = []; let cur = '';
    title.replace(/[,.()]/g, '').split(/\s+/).forEach((w) => { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) out.push(cur);
    return out.slice(0, 3);
  };
  const shade = (hex, k) => '#' + hex.slice(1).match(/../g).map((h) => Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * k))).toString(16).padStart(2, '0')).join('');

  const ART = {
    book: (l) => { const c = COURSE[l.course] || '#6B6B6B', t = lines(l.title.replace(/,?\s*\d+(st|nd|rd|th) ed\.?.*/i, ''));
      return `<rect x="58" y="12" width="88" height="124" fill="${shade(c, .7)}" ${o}/><rect x="66" y="12" width="80" height="124" fill="${c}" ${o}/><rect x="146" y="16" width="7" height="116" fill="#F1F1F1" ${o}/>
        ${t.map((x, i) => `<text x="106" y="${40 + i * 17}" text-anchor="middle" font-family="Jersey 15, monospace" font-size="15" fill="#fff">${T.esc(x)}</text>`).join('')}
        <rect x="66" y="100" width="80" height="22" fill="${shade(c, 1.25)}" ${o}/><text x="106" y="116" text-anchor="middle" font-family="Jersey 15, monospace" font-size="14" fill="#fff">${T.esc(l.course || 'TEXTBOOK')}</text>`; },
    manual: (l) => { const c = COURSE[l.course] || '#6B6B6B';
      return `<rect x="62" y="14" width="80" height="120" fill="${c}" ${o}/><rect x="72" y="30" width="60" height="50" fill="#F1F1F1" ${o}/><path d="M80 44 H124 M80 54 H124 M80 64 H110" ${o}/>${[24, 44, 64, 84, 104].map((y) => `<circle cx="62" cy="${y}" r="5" fill="#C6C6C6" ${o}/>`).join('')}<text x="102" y="112" text-anchor="middle" font-family="Jersey 15, monospace" font-size="15" fill="#fff">LAB</text>`; },
    breadboard: () => `<rect x="24" y="30" width="152" height="92" rx="5" fill="#F1F1F1" ${o}/><path d="M34 76 H166" stroke="#BDBDBD" stroke-width="6"/>${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map((i) => `<circle cx="${40 + i * 9}" cy="52" r="2" fill="${K}"/><circle cx="${40 + i * 9}" cy="62" r="2" fill="${K}"/><circle cx="${40 + i * 9}" cy="92" r="2" fill="${K}"/><circle cx="${40 + i * 9}" cy="102" r="2" fill="${K}"/>`).join('')}<path d="M49 52 Q70 20 94 52" fill="none" stroke="#C07A2C" stroke-width="4"/><path d="M112 92 Q130 120 148 102" fill="none" stroke="#3A5FA0" stroke-width="4"/><rect x="84" y="56" width="34" height="14" fill="#2E2E2E" ${o.replace('3','2')}/><circle cx="150" cy="52" r="6" fill="#E0A526" ${o.replace('3','2')}/>`,
    notebook: () => `<rect x="56" y="14" width="92" height="122" fill="#2F2F2F" ${o}/><rect x="64" y="14" width="6" height="122" fill="#555" /><rect x="84" y="34" width="52" height="34" fill="#E4E4E4" ${o}/><path d="M92 46 H128 M92 56 H120" ${o}/>`,
    card: () => `<rect x="36" y="32" width="128" height="84" rx="6" fill="#3A7D44" ${o}/><rect x="52" y="48" width="96" height="26" fill="#BDBDBD" ${o}/><path d="M60 61 H140" stroke="#888" stroke-width="3"/><text x="100" y="102" text-anchor="middle" font-family="Jersey 15, monospace" font-size="16" fill="#fff">ACCESS CODE</text>`,
    calc: () => `<rect x="62" y="10" width="76" height="130" rx="6" fill="#3B3B3B" ${o}/><rect x="70" y="18" width="60" height="26" fill="#BFD8A0" ${o}/>${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${71 + c * 15}" y="${54 + r * 20}" width="12" height="14" fill="${c === 3 ? '#C07A2C' : '#9A9A9A'}" ${o.replace('3', '2')}/>`).join('')).join('')}`,
    graphing: () => `<rect x="56" y="8" width="88" height="136" rx="8" fill="#2E3E5C" ${o}/><rect x="64" y="16" width="72" height="50" fill="#BFD8A0" ${o}/><path d="M70 56 Q85 20 100 40 T130 30" fill="none" stroke="#2E3E5C" stroke-width="3"/>${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${64 + c * 14.5}" y="${76 + r * 15}" width="11" height="10" fill="${r === 0 ? '#C07A2C' : '#9A9A9A'}" ${o.replace('3', '2')}/>`).join('')).join('')}`,
    goggles: () => `<path d="M20 76 Q100 50 180 76" fill="none" stroke="#3A3A3A" stroke-width="10" stroke-linecap="round"/><rect x="38" y="52" width="52" height="46" rx="14" fill="#CFE8F5" ${o}/><rect x="110" y="52" width="52" height="46" rx="14" fill="#CFE8F5" ${o}/><path d="M90 74 H110" ${o}/><path d="M48 62 L60 60 M120 62 L132 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    coat: () => `<path d="M62 26 L84 14 L100 30 L116 14 L138 26 L160 56 L140 66 L136 136 H64 L60 66 L40 56 Z" fill="#F4F4F4" ${o}/><path d="M100 30 V136" ${o}/><path d="M84 14 L100 44 L116 14" fill="#DADADA" ${o}/><rect x="70" y="92" width="22" height="20" fill="#E6E6E6" ${o}/><rect x="108" y="92" width="22" height="20" fill="#E6E6E6" ${o}/><circle cx="96" cy="64" r="2.5" fill="${K}"/><circle cx="96" cy="80" r="2.5" fill="${K}"/>`,
    fridge: () => `<rect x="56" y="8" width="88" height="134" rx="5" fill="#CFCFCF" ${o}/><path d="M56 48 H144" ${o}/><rect x="124" y="18" width="5" height="24" fill="#6B6B6B" ${o}/><rect x="124" y="58" width="5" height="40" fill="#6B6B6B" ${o}/><circle cx="76" cy="26" r="4" fill="#3A5FA0"/>`,
    topper: () => `<path d="M30 70 L100 46 L172 70 L172 90 L100 114 L30 90 Z" fill="#CFE0F0" ${o}/><path d="M30 70 L100 94 L172 70" fill="none" ${o}/><path d="M100 94 V114" ${o}/>${[60, 90, 120, 148].map((x) => `<circle cx="${x}" cy="${78 - Math.abs(x - 100) * 0.08}" r="3" fill="#8AA6C0"/>`).join('')}`,
    lamp: () => `<ellipse cx="100" cy="130" rx="38" ry="9" fill="#555" ${o}/><path d="M100 130 L76 70 L130 30" fill="none" stroke="#3A3A3A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M116 24 L156 50 L138 66 L112 40 Z" fill="#E0A526" ${o}/><path d="M132 62 L150 96" stroke="#FFE08A" stroke-width="6" stroke-linecap="round" opacity=".7"/><rect x="92" y="118" width="16" height="10" fill="#6B6B6B" ${o}/>`,
    mirror: () => `<rect x="64" y="8" width="72" height="134" rx="6" fill="#8A5A35" ${o}/><rect x="72" y="16" width="56" height="118" fill="#CFE8F5" ${o}/><path d="M80 40 L110 20 M80 70 L120 36" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    micro: () => `<rect x="24" y="36" width="152" height="86" rx="5" fill="#BEBEBE" ${o}/><rect x="36" y="46" width="96" height="66" fill="#2E2E2E" ${o}/><rect x="40" y="50" width="88" height="58" fill="#4A5A68" /><rect x="142" y="48" width="26" height="20" fill="#3A7D44" ${o}/>${[78, 92, 106].map((y) => `<circle cx="155" cy="${y}" r="5" fill="#6B6B6B" ${o.replace('3', '2')}/>`).join('')}`,
    solder: () => `<path d="M30 120 L110 54" stroke="#3A3A3A" stroke-width="14" stroke-linecap="round"/><path d="M104 60 L146 26" stroke="#B0B0B0" stroke-width="7" stroke-linecap="round"/><path d="M146 26 L158 16" stroke="#E0A526" stroke-width="5" stroke-linecap="round"/><path d="M132 112 q10 -14 20 0 t20 0 t-20 12 t-20 0" fill="none" ${o}/><rect x="124" y="118" width="50" height="14" fill="#6B6B6B" ${o}/>`,
    ticket: () => `<path d="M24 36 H176 V62 A12 12 0 0 0 176 86 V112 H24 V86 A12 12 0 0 0 24 62 Z" fill="#E0A526" ${o}/><path d="M128 36 V112" stroke="${K}" stroke-width="3" stroke-dasharray="6 6"/><text x="76" y="68" text-anchor="middle" font-family="Jersey 15, monospace" font-size="22" fill="${K}">ADMIT</text><text x="76" y="94" text-anchor="middle" font-family="Jersey 15, monospace" font-size="22" fill="${K}">TWO</text><path d="M152 60 l5 10 11 1 -8 8 2 11 -10 -6 -10 6 2 -11 -8 -8 11 -1 z" fill="${K}"/>`,
    pass: () => `<path d="M90 8 V40 M110 8 V40" stroke="#3A5FA0" stroke-width="6"/><rect x="52" y="40" width="96" height="98" rx="8" fill="#7A4FA0" ${o}/><rect x="64" y="52" width="72" height="40" fill="#E4E4E4" ${o}/><text x="100" y="80" text-anchor="middle" font-family="Jersey 15, monospace" font-size="22" fill="${K}">FLOOR</text><text x="100" y="118" text-anchor="middle" font-family="Jersey 15, monospace" font-size="18" fill="#fff">CONCERT</text>`,
    car: () => `<path d="M16 100 L26 74 Q32 62 46 62 H108 Q122 62 132 76 L150 94 Q176 96 184 108 V118 H16 Z" fill="#3A5FA0" ${o}/><path d="M52 68 H106 Q116 68 124 80 L134 94 H46 Z" fill="#CFE8F5" ${o}/><path d="M86 68 V94" ${o}/><circle cx="50" cy="118" r="17" fill="#3A3A3A" ${o}/><circle cx="50" cy="118" r="7" fill="#C6C6C6"/><circle cx="148" cy="118" r="17" fill="#3A3A3A" ${o}/><circle cx="148" cy="118" r="7" fill="#C6C6C6"/><rect x="170" y="100" width="10" height="8" fill="#E0A526" ${o.replace('3', '2')}/>`,
    bike: () => `<circle cx="52" cy="102" r="30" fill="none" stroke="${K}" stroke-width="5"/><circle cx="150" cy="102" r="30" fill="none" stroke="${K}" stroke-width="5"/><path d="M52 102 L84 58 H132 L150 102 M84 58 L104 102 H52 M104 102 L132 58 M78 44 H96 M126 52 L122 36 H138" fill="none" stroke="#3A7D44" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="104" cy="102" r="6" fill="#C6C6C6" ${o}/>`,
    purifier: () => `<rect x="66" y="10" width="68" height="130" rx="22" fill="#E4E4E4" ${o}/>${[34, 48, 62, 76, 90].map((y) => `<path d="M80 ${y} H120" ${o}/>`).join('')}<circle cx="100" cy="120" r="7" fill="#3A7D44" ${o}/>`,
    probes: () => `<path d="M30 40 Q80 30 100 70 T140 120" fill="none" stroke="#3A3A3A" stroke-width="6" stroke-linecap="round"/><path d="M30 100 Q80 120 110 80 T170 40" fill="none" stroke="#C07A2C" stroke-width="6" stroke-linecap="round"/><path d="M140 120 L152 138 M170 40 L184 28" stroke="#B0B0B0" stroke-width="7" stroke-linecap="round"/><rect x="18" y="30" width="22" height="20" fill="#6B6B6B" ${o}/><rect x="18" y="92" width="22" height="20" fill="#6B6B6B" ${o}/>`,
    box: () => `<path d="M40 50 L100 22 L160 50 V108 L100 136 L40 108 Z" fill="#C9A06A" ${o}/><path d="M40 50 L100 78 L160 50 M100 78 V136" fill="none" ${o}/>`,
  };

  /** Which illustration fits a listing. Tutoring and rides have no product, so they get none. */
  T.artKind = function (l) {
    if (l.cat === 'TUTOR' || l.cat === 'RIDE') return null;
    const m = l.mat || '', t = l.title.toLowerCase();
    if (/-text$/.test(m) || /-reader$/.test(m)) return 'book';
    if (m === 'ece380-lab') return 'breadboard';
    if (/-lab$/.test(m)) return m === 'ch101-lab' ? 'notebook' : 'manual';
    if (m === 'math125-calc') return 'graphing';
    if (/-calc$/.test(m) || /calculator/.test(t)) return /graphing/.test(t) ? 'graphing' : 'calc';
    if (/goggles/.test(m) || /goggles/.test(t)) return 'goggles';
    if (/coat/.test(m) || /lab coat/.test(t)) return 'coat';
    if (/-code$|-access$/.test(m)) return 'card';
    if (/fridge/.test(t)) return 'fridge';
    if (/topper|mattress/.test(t)) return 'topper';
    if (/lamp/.test(t)) return 'lamp';
    if (/mirror/.test(t)) return 'mirror';
    if (/microwave/.test(t)) return 'micro';
    if (/solder/.test(t)) return 'solder';
    if (/concert|pass/.test(t)) return 'pass';
    if (l.cat === 'TICKET') return 'ticket';
    if (l.cat === 'VEHICLE') return 'car';
    if (/bike/.test(t)) return 'bike';
    if (/purifier/.test(t)) return 'purifier';
    if (/probe/.test(t)) return 'probes';
    return 'box';
  };
  /** Thumbnail artwork: the illustration, or the plain category icon when there is none. */
  T.thumbArt = function (l) { const k = T.artKind(l); return k ? wrap(ART[k](l)) : T.glyph(l.cat); };
})(window.Trunk);
