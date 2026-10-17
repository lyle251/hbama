/* Schematic campus map: only the five pickup places. Positions are approximate and not to scale. */
(function (T) {
  const txt = (extra) => `style="font:400 14px Jersey 15,monospace;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:3px;${extra || ''}"`;
  /** opts: {counts, pick, sel, pins:[{x,y,label,variant}], path:[[x,y]]} */
  T.campusSVG = function (opts = {}) {
    const ground = `<g style="fill:none;stroke:var(--ink-soft);stroke-width:1.5;opacity:.45;stroke-dasharray:8 6"><path d="M110 110 L200 190 L330 150 L350 300"/><path d="M330 150 L530 200"/><path d="M200 190 L350 300"/></g>
      <ellipse cx="270" cy="230" rx="60" ry="26" style="fill:var(--blush);opacity:.7;stroke:var(--ink-soft);stroke-width:1.5"/>`;
    const path = opts.path ? `<polyline points="${opts.path.map((p) => p.join(',')).join(' ')}" style="fill:none;stroke:var(--brand-700);stroke-width:4;stroke-dasharray:2 8;stroke-linecap:round"/>` : '';
    const spots = T.SPOTS.map((s) => {
      const n = opts.counts ? opts.counts[s.id] || 0 : null, sel = opts.sel === s.id;
      const inner = `<g class="pin-body"><rect x="${s.x - 14}" y="${s.y - 14}" width="28" height="28" style="fill:${sel ? 'var(--brand-700)' : 'var(--brand-500)'};stroke:var(--edge);stroke-width:2.5"/>
        <text x="${s.x}" y="${s.y + 6}" text-anchor="middle" style="font:400 17px Jersey 15,monospace;fill:#fff">${n !== null ? n : '✓'}</text></g>
        <text x="${s.x}" y="${s.y + 34}" text-anchor="middle" ${txt()}>${T.esc(s.name)}</text>`;
      return opts.pick
        ? `<g class="pin" role="button" tabindex="0" data-act="pickSpot" data-spot="${s.id}" aria-label="${T.esc(s.name)}, ${T.esc(s.addr)}">${inner}</g>`
        : `<g>${inner}</g>`;
    }).join('');
    const pins = (opts.pins || []).map((p) => `<g class="pin-live" transform="translate(${p.x - 16} ${p.y - 40})" data-pin="${p.id || ''}">${T.ellieHead(32, p.variant || 'ellie').replace('<svg ', '<svg x="0" y="0" ')}<text x="16" y="54" text-anchor="middle" ${txt()}>${T.esc(p.label || '')}</text></g>`).join('');
    const note = `<text x="14" y="386" ${txt('font-size:12px;fill:var(--ink-soft)')}>Schematic, not to scale · N ↑</text>`;
    return `<svg viewBox="0 0 640 400" role="img" aria-label="Schematic map of the five pickup places" id="campus-svg"><rect width="640" height="400" style="fill:var(--brand-100)"/>${ground}${path}${spots}${pins}${note}</svg>`;
  };
})(window.Trunk);
