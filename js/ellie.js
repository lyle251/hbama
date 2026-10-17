/* Ellie and friends: original inline-SVG elephants. Poses: wave, laptop, sign, watch, trophy, sleep, phones. */
window.Trunk = window.Trunk || {};
(function (T) {
  const INK = '#262626';
  const VARIANTS = {
    ellie: { body: '#DADDE1', ear: '#B9BEC6', acc: '#4C7A2E', accKind: 'cap' },
    rosie: { body: '#E5D2A5', ear: '#CDB57F', acc: '#3A6FB0', accKind: 'bandana' },
    bigred: { body: '#7C9BD0', ear: '#5B7FBE', acc: '#FFFFFF', accKind: 'party' },
    peanut: { body: '#F1F1F1', ear: '#CFCFCF', acc: '#E0A526', accKind: 'bow' },
  };
  const S = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

  function accessory(kind, c) {
    if (kind === 'cap') return `<path d="M43 36 Q60 5 77 36 Z" fill="${c}" ${S}/><path d="M74 35 Q86 34 89 39 Q81 41 73 39 Z" fill="${c}" ${S}/><circle cx="60" cy="20" r="2.5" fill="#fff" ${S}/>`;
    if (kind === 'bandana') return `<path d="M38 64 Q60 78 82 64 L76 72 L60 90 L44 72 Z" fill="${c}" ${S}/><circle cx="55" cy="72" r="1.8" fill="${INK}"/><circle cx="65" cy="72" r="1.8" fill="${INK}"/>`;
    if (kind === 'party') return `<path d="M50 32 L60 10 L70 32 Z" fill="${c}" ${S}/><circle cx="60" cy="10" r="3" fill="#E0A526" ${S}/><path d="M54 25 L66 25" stroke="#4C7A2E" stroke-width="2.5"/>`;
    if (kind === 'bow') return `<path d="M60 26 L48 18 L48 34 Z M60 26 L72 18 L72 34 Z" fill="${c}" ${S}/><circle cx="60" cy="26" r="3.5" fill="${c}" ${S}/>`;
    return '';
  }

  function props(pose) {
    switch (pose) {
      case 'laptop':
        return `<g><path d="M26 92 H94 L88 108 H32 Z" fill="#4C7A2E" ${S}/><rect x="34" y="70" width="52" height="24" rx="3" fill="#DCE8CF" ${S}/><path d="M60 77 q-5 4 0 9 q5 -5 0 -9z" fill="#4C7A2E" stroke="${INK}" stroke-width="1.5"/></g>`;
      case 'sign':
        return `<g><rect x="92" y="54" width="5" height="52" fill="#E8B4A6" ${S}/><rect x="74" y="34" width="42" height="26" rx="4" fill="#fff" ${S}/><path d="M80 44 H110 M80 52 H102" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`;
      case 'watch':
        return `<g><circle cx="74" cy="92" r="9" fill="#fff" ${S}/><path d="M74 92 V86 M74 92 L79 94" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M68 98 L64 104 M80 98 L84 104" stroke="${INK}" stroke-width="2"/></g>`;
      case 'trophy':
        return `<g><path d="M44 12 H76 V30 Q76 42 60 42 Q44 42 44 30 Z" fill="#D9A441" ${S}/><path d="M44 16 H36 Q36 28 46 28 M76 16 H84 Q84 28 74 28" fill="none" ${S}/><rect x="54" y="42" width="12" height="8" fill="#D9A441" ${S}/><rect x="46" y="50" width="28" height="7" rx="2" fill="#35591E" ${S}/></g>`;
      case 'phones':
        return `<g><path d="M30 52 Q30 18 60 18 Q90 18 90 52" fill="none" stroke="${INK}" stroke-width="3.5"/><rect x="24" y="46" width="12" height="18" rx="5" fill="#4C7A2E" ${S}/><rect x="84" y="46" width="12" height="18" rx="5" fill="#4C7A2E" ${S}/></g>`;
      case 'sleep':
        return `<g class="zzz"><text x="86" y="26" font-family="Nunito, sans-serif" font-size="22" fill="${INK}">z</text><text x="96" y="14" font-family="Nunito, sans-serif" font-size="16" fill="${INK}">z</text></g>`;
      default: return '';
    }
  }

  /** Ellie as inline SVG. opts: {variant, pose, size, label} */
  T.ellie = function (opts = {}) {
    const v = VARIANTS[opts.variant || 'ellie'];
    const pose = opts.pose || 'wave';
    const size = opts.size || 120;
    const closed = pose === 'sleep';
    const eyes = closed
      ? `<path d="M45 49 q5 5 10 0 M65 49 q5 5 10 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
      : `<ellipse class="eye" cx="50" cy="48" rx="2.7" ry="3.6" fill="${INK}"/><ellipse class="eye" cx="70" cy="48" rx="2.7" ry="3.6" fill="${INK}"/>`;
    const wave = pose === 'wave'
      ? `<path d="M80 58 Q104 52 100 34" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M80 58 Q104 52 100 34" fill="none" stroke="${v.body}" stroke-width="10" stroke-linecap="round"/>`
      : '';
    const trunk = pose === 'wave'
      ? ''
      : `<path d="M60 56 Q58 80 72 84 Q80 85 78 77" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M60 56 Q58 80 72 84 Q80 85 78 77" fill="none" stroke="${v.body}" stroke-width="10" stroke-linecap="round"/>`;
    const toes = (x) => `<path d="M${x - 5} 105 q1 -3 3 0 M${x} 105 q1 -3 3 0 M${x + 5} 105 q1 -3 3 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
    const aria = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
    return `<svg class="ellie" viewBox="0 0 120 120" width="${size}" height="${size}" ${aria}>
      <path d="M92 84 q12 -2 10 8 q-2 -6 -10 -2" fill="none" ${S}/>
      <rect x="34" y="84" width="20" height="24" rx="9" fill="${v.body}" ${S}/><rect x="66" y="84" width="20" height="24" rx="9" fill="${v.body}" ${S}/>
      ${toes(44)}${toes(76)}
      <ellipse cx="60" cy="80" rx="34" ry="26" fill="${v.body}" ${S}/>
      <g class="ear-l"><circle cx="25" cy="52" r="18" fill="${v.body}" ${S}/><circle cx="27" cy="53" r="10" fill="${v.ear}"/></g>
      <g class="ear-r"><circle cx="95" cy="52" r="18" fill="${v.body}" ${S}/><circle cx="93" cy="53" r="10" fill="${v.ear}"/></g>
      <circle cx="60" cy="50" r="27" fill="${v.body}" ${S}/>
      ${v.accKind === 'bandana' ? '' : ''}
      ${eyes}
      <circle cx="41" cy="58" r="5" fill="#E8B4A6" opacity=".9"/><circle cx="79" cy="58" r="5" fill="#E8B4A6" opacity=".9"/>
      ${wave}${trunk}
      <path d="M52 62 q-3 6 -1 9 M68 62 q3 6 1 9" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      ${accessory(v.accKind, v.acc)}
      ${props(pose)}
    </svg>`;
  };

  /** Small elephant head (map pins, dialog icons, logo). */
  T.ellieHead = function (size = 28, variant = 'ellie') {
    const v = VARIANTS[variant];
    return `<svg viewBox="0 0 64 60" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="10" cy="26" r="12" fill="${v.body}" ${S}/><circle cx="11" cy="27" r="6" fill="${v.ear}"/>
      <circle cx="54" cy="26" r="12" fill="${v.body}" ${S}/><circle cx="53" cy="27" r="6" fill="${v.ear}"/>
      <circle cx="32" cy="28" r="18" fill="${v.body}" ${S}/>
      <ellipse cx="25" cy="25" rx="2" ry="2.8" fill="${INK}"/><ellipse cx="39" cy="25" rx="2" ry="2.8" fill="${INK}"/>
      <circle cx="19" cy="33" r="3.4" fill="#E8B4A6"/><circle cx="45" cy="33" r="3.4" fill="#E8B4A6"/>
      <path d="M32 32 Q31 48 40 50" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M32 32 Q31 48 40 50" fill="none" stroke="${v.body}" stroke-width="5.5" stroke-linecap="round"/>
    </svg>`;
  };

  T.parade = function () {
    const vs = ['ellie', 'rosie', 'bigred', 'peanut', 'ellie', 'rosie', 'bigred', 'peanut', 'ellie', 'rosie'];
    return `<div class="parade" aria-hidden="true">${vs.map((v) => T.ellie({ variant: v, pose: 'none', size: 44 })).join('')}</div>`;
  };
})(window.Trunk);
