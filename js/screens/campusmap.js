/* Campus map renderer shared by campus pick, meetup proposal and Meetup Live. Layout is fictional. */
(function (T) {
  const f = (v) => `style="fill:var(${v});stroke:var(--ink-soft);stroke-width:1.5"`;
  /** opts: {counts, pick, sel, pins:[{x,y,label,variant}], path:[[x,y]], showHome, safeOnly} */
  T.campusSVG = function (opts = {}) {
    const bld = T.BUILDINGS.map((b) => `<g><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" ${f('--surface')}/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="12" rx="4" ${f('--brand-300')}/>
      <text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 8}" text-anchor="middle" style="font:400 13px Jersey 15,monospace;fill:var(--ink)">${T.esc(b.name)}</text></g>`).join('');
    const roads = `<g style="fill:none;stroke:var(--ink-soft);stroke-width:1.5;opacity:.55;stroke-dasharray:8 6"><path d="M20 232 H620"/><path d="M215 10 V390"/><path d="M420 10 V390"/></g>`;
    const quad = `<ellipse cx="230" cy="240" rx="52" ry="26" style="fill:var(--blush);stroke:var(--ink-soft);stroke-width:1.5;opacity:.7"/>`;
    const path = opts.path ? `<polyline points="${opts.path.map((p) => p.join(',')).join(' ')}" style="fill:none;stroke:var(--brand-700);stroke-width:4;stroke-dasharray:2 8;stroke-linecap:round"/>` : '';
    const spots = T.SPOTS.filter((s) => !opts.safeOnly || s.safe).map((s) => {
      const n = opts.counts ? opts.counts[s.id] || 0 : null;
      const sel = opts.sel === s.id;
      const inner = `<g class="pin-body"><circle cx="${s.x}" cy="${s.y}" r="${sel ? 15 : 12}" style="fill:${sel ? 'var(--brand-700)' : s.safe ? 'var(--brand-500)' : 'var(--warn)'};stroke:var(--ink-soft);stroke-width:1.5"/>
        <text x="${s.x}" y="${s.y + 5}" text-anchor="middle" style="font:400 15px Jersey 15,monospace;fill:${s.safe ? '#fff' : '#3B1F22'}">${n !== null ? n : s.safe ? '✓' : '!'}</text></g>
        <text x="${s.x}" y="${s.y + 28}" text-anchor="middle" style="font:400 13px Jersey 15,monospace;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:3px">${T.esc(s.name)}</text>`;
      return opts.pick
        ? `<g class="pin" role="button" tabindex="0" data-act="pickSpot" data-spot="${s.id}" aria-label="${T.esc(s.name)}${s.safe ? ', safe meetup spot' : ''}${n !== null ? ', ' + n + ' listings' : ''}">${inner}</g>`
        : `<g>${inner}</g>`;
    }).join('');
    const pins = (opts.pins || []).map((p) => `<g class="pin-live" transform="translate(${p.x - 16} ${p.y - 40})" data-pin="${p.id || ''}">${T.ellieHead(32, p.variant || 'ellie').replace('<svg ', '<svg x="0" y="0" ')}<text x="16" y="52" text-anchor="middle" style="font:400 13px Jersey 15,monospace;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:3px">${T.esc(p.label || '')}</text></g>`).join('');
    const compass = `<text x="612" y="26" text-anchor="end" style="font:400 14px Jersey 15,monospace;fill:var(--ink-soft)">N ↑</text>`;
    return `<svg viewBox="0 0 640 400" role="img" aria-label="Campus map" id="campus-svg"><rect width="640" height="400" style="fill:var(--brand-100)"/>${roads}${quad}${bld}${path}${spots}${pins}${compass}</svg>`;
  };
})(window.Trunk);
