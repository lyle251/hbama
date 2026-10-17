/* Sell.paint: listing editor. Class Materials requires a course (validated before posting). */
(function (T) {
  const FIELDS = {
    TICKET: [['event', 'Event'], ['date', 'Date'], ['seat', 'Seat']],
    TUTOR: [['subject', 'Subject'], ['rate', 'Hourly rate'], ['avail', 'Availability']],
    RIDE: [['from', 'From'], ['to', 'To'], ['date', 'Date'], ['seats', 'Seats']],
    VEHICLE: [['make', 'Make and model'], ['year', 'Year'], ['miles', 'Mileage']],
  };
  const validate = (d) => {
    const err = {};
    if (!d.title.trim()) err.title = 'Add a title.';
    if (d.price === '' || isNaN(Number(d.price)) || Number(d.price) < 0) err.price = 'Enter a price, or 0 for free.';
    if (!d.cat) err.cat = 'Choose a category.';
    if (d.cat === 'CLASS' && !T.course(T.normCourse(d.course) || '')) err.course = 'Class Materials need a course from your school catalog, like ECE 380.';
    (FIELDS[d.cat] || []).forEach(([k, l]) => { if (!String(d[k] || '').trim()) err[k] = `Add ${l.toLowerCase()}.`; });
    return err;
  };
  const read = (root) => {
    const d = {};
    T.$$('[data-f]', root).forEach((el) => { if (el.type === 'radio' && !el.checked) return; d[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; });
    d.spots = T.$$('[data-spot-pick]:checked', root).map((x) => x.value);
    return d;
  };

  T.screens.sell = {
    render() {
      const dr = T.sellDraft || {}, cat = dr.cat || 'CLASS';
      const catRow = Object.entries(T.CATS).map(([k, v]) => `<label class="chip ${cat === k ? 'chip--ver' : ''}" style="cursor:pointer;padding:5px 10px"><input type="radio" name="cat" value="${k}" data-f="cat" ${cat === k ? 'checked' : ''} style="width:14px;height:14px;margin-right:4px"> ${v}</label>`).join('');
      const extra = (FIELDS[cat] || []).map(([k, l]) => `<label class="field"><span class="px">${l}</span><input class="input" data-f="${k}" id="s-${k}" value="${T.esc(dr[k] || '')}"><span class="hint err" id="e-${k}"></span></label>`).join('');
      return T.win({
        title: 'Sell an item', tone: 'focus',
                body: `<form id="sell-form" class="stack" novalidate>
          <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
            <div class="stack"><div class="panel"><b class="px" style="font-size:20px">Photos (up to 5)</b>
              <div id="ph" class="row" style="margin:8px 0"><div class="file__thumb" style="width:110px;aspect-ratio:1">${T.glyph(cat)}</div></div>
              <input class="input" id="s-photos" type="file" accept="image/*" multiple aria-label="Add photos"><span class="hint" id="ph-note">Stored in your browser for the demo. The storage adapter is S3-ready.</span></div>
              <div class="panel" id="hint-box"><b class="px" style="font-size:20px">Price helper</b><div id="price-hint" class="hint">Pick a course and title to see what similar items sold for.</div></div></div>
            <div class="stack">
              <div><span class="px" style="font-size:19px">Category</span><div class="row" style="margin-top:4px" role="radiogroup" aria-label="Category">${catRow}</div><span class="hint err" id="e-cat"></span></div>
              <label class="field"><span class="px">Title</span><input class="input" id="s-title" data-f="title" value="${T.esc(dr.title || '')}"><span class="hint err" id="e-title"></span></label>
              ${cat === 'CLASS' ? `<label class="field"><span class="px">Course (required)</span><input class="input" id="s-course" data-f="course" list="course-list" placeholder="ECE 380" value="${T.esc(dr.course || '')}"><datalist id="course-list">${T.COURSES.map((c) => `<option value="${c.code}">${c.name}</option>`).join('')}</datalist><span class="hint err" id="e-course"></span></label>
              <label class="field"><span class="px">ISBN and edition (optional)</span><input class="input" data-f="isbn" value="${T.esc(dr.isbn || '')}" placeholder="978-0-00-000380-3"></label>` : ''}
              ${extra}
              <div class="grid2" style="grid-template-columns:1fr 1fr"><label class="field"><span class="px">Price ($, 0 = free)</span><input class="input" id="s-price" data-f="price" type="number" min="0" value="${dr.price ?? ''}"><span class="hint err" id="e-price"></span></label>
                <label class="field"><span class="px">Condition</span><select class="input" data-f="cond">${T.CONDS.map((c) => `<option ${c === 'Good' ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
              <label class="check"><input type="checkbox" data-f="trade"> Open to trades</label>
              <label class="field"><span class="px">Description</span><textarea class="input" data-f="desc"></textarea></label>
              <fieldset class="panel" style="margin:0"><legend class="px">Preferred meetup spots</legend>${T.SPOTS.map((s) => `<label class="check"><input type="checkbox" data-spot-pick value="${s.id}" ${s.id === 'gorgas' ? 'checked' : ''}> ${s.name} <span class="hint">${s.addr}</span></label>`).join('')}</fieldset>
              <label class="check"><input type="checkbox" data-f="cross"> Let students at other campuses see this (ship or meet halfway)</label>
              <div class="row end"><a class="btn" href="#/market">Cancel</a><button class="btn btn--primary" type="submit">Post listing</button></div></div></div></form>`,
        status: '<span>New listing</span><span>Posting to ' + T.esc(T.school(T.state.school).name) + '</span>',
      });
    },
    mount(el) {
      const form = T.$('#sell-form', el);
      const upd = () => {
        const d = read(form), code = T.normCourse(d.course || '');
        const fake = { id: 'x', cat: d.cat, mat: (T.sellDraft || {}).mat, price: 0 };
        if (code) { const m = T.allMats().find((x) => x.course === code && (d.title || '').toLowerCase().includes(x.name.toLowerCase().slice(0, 8))); if (m) fake.mat = m.key; }
        T.$('#price-hint', el).textContent = T.priceHint(fake);
      };
      form.addEventListener('input', upd); upd();
      form.addEventListener('change', (e) => {
        if (e.target.dataset.f === 'cat') { T.sellDraft = { ...read(form), cat: e.target.value }; T.render(); }
      });
      T.$('#s-photos', el).addEventListener('change', async (e) => {
        const files = Array.from(e.target.files).slice(0, 5), box = T.$('#ph', el);
        box.innerHTML = '';
        const shrink = (f) => new Promise((res) => { const im = new Image(); im.onload = () => { const k = Math.min(1, 360 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = () => res(null); im.src = URL.createObjectURL(f); });
        if (files[0]) T.sellPhoto = await shrink(files[0]);
        for (const f of files) { const url = await T.adapters.storage.put(f); const d = document.createElement('div'); d.className = 'file__thumb'; d.style.cssText = 'width:80px;aspect-ratio:1'; d.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover">`; box.appendChild(d); }
        T.$('#ph-note', el).textContent = `${files.length} photo${files.length === 1 ? '' : 's'} attached.` + (e.target.files.length > 5 ? ' Only the first 5 are kept.' : '');
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = read(form), err = validate(d);
        T.$$('.err', el).forEach((n) => { n.textContent = ''; n.style.color = ''; });
        const keys = Object.keys(err);
        keys.forEach((k) => { const n = T.$('#e-' + k, el); if (n) { n.textContent = err[k]; n.style.color = 'var(--brand-700)'; n.style.fontWeight = '700'; } });
        if (keys.length) { const f = T.$('#' + (keys[0] === 'cat' ? 'e-cat' : 's-' + keys[0]), el); if (f && f.focus) f.focus(); return T.dialog({ title: 'Please check this', kind: 'error', body: `<b class="px" style="font-size:21px">Almost there.</b><span>${T.esc(err[keys[0]])}</span>` }); }
        const code = T.normCourse(d.course || '');
        const l = { id: 'N' + T.state.nextId++, cat: d.cat, title: d.title.trim(), price: Number(d.price), cond: d.cond, seller: T.state.uid, spot: d.spots[0] || 'gorgas', status: 'AVAILABLE', school: T.state.school, cross: !!d.cross, desc: d.desc, trade: !!d.trade, posted: Date.now(), isbn: d.isbn || '' };
        if (d.cat === 'CLASS') { l.course = code; const m = (T.sellDraft && T.sellDraft.mat) || (T.allMats().find((x) => x.course === code && d.title.toLowerCase().includes(x.name.toLowerCase().slice(0, 8))) || {}).key; if (m) l.mat = m; }
        (FIELDS[d.cat] || []).forEach(([k]) => { l[k] = k === 'year' || k === 'miles' || k === 'seats' ? Number(d[k]) || d[k] : d[k]; });
        if (T.sellPhoto) { l.photo = T.sellPhoto; T.sellPhoto = null; }
        T.state.listings.unshift(l); T.save(); T.sellDraft = null;
        const cn = l.course ? (T.course(l.course) || { next: 100 }).next : 0;
        T.dialog({ title: 'Done', body: `<b class="px" style="font-size:21px">Listing posted!${l.course ? ' ' + Math.max(3, Math.round(cn / 40)) + ' classmates need this.' : ''}</b><span>${T.esc(l.title)} is live on ${T.school(l.school).short}.</span>`, buttons: [{ label: 'View listing', cls: 'btn--primary', run: () => T.go('listing/' + l.id) }, { label: 'Post another', run: () => T.go('sell') }] });
      });
    },
  };
})(window.Trunk);
