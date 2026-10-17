/* Seed data and persisted state. All titles, ISBNs and contacts are fictional placeholders. */
window.Trunk = window.Trunk || {};
(function (T) {
  T.CATS = {
    CLASS: 'Class Materials', DORM: 'Dorm Essentials', LAB: 'Lab Supplies', TICKET: 'Tickets',
    TUTOR: 'Tutoring', RIDE: 'Rides', VEHICLE: 'Used Vehicles', OTHER: 'Other',
  };
  T.MAT_TYPES = { textbook: 'Textbooks', lab: 'Lab manuals', calc: 'Calculators', safety: 'Safety gear', access: 'Access codes', other: 'Other' };
  T.CONDS = ['New', 'Like new', 'Good', 'Fair'];

  T.SCHOOLS = [
    { slug: 'ua', name: 'University of Alabama', short: 'UA', city: 'Tuscaloosa', st: 'AL', lat: 33.21, lng: -87.54, domains: ['crimson.ua.edu', 'ua.edu'], primary: '#B81E33', accessory: 'Crimson cap', logoText: 'TRUNK · TUSCALOOSA', vouchMin: 3, live: true },
    { slug: 'auburn', name: 'Auburn University', short: 'AU', city: 'Auburn', st: 'AL', lat: 32.6, lng: -85.49, domains: ['auburn.edu'], primary: '#C0392B', accessory: 'Bandana', logoText: 'TRUNK · AUBURN', vouchMin: 3, live: true },
    { slug: 'gt', name: 'Georgia Tech', short: 'GT', city: 'Atlanta', st: 'GA', lat: 33.78, lng: -84.4, domains: ['gatech.edu'], primary: '#A8182B', accessory: 'Goggles', logoText: 'TRUNK · ATLANTA', vouchMin: 3, live: true },
  ];
  T.school = (slug) => T.SCHOOLS.find((s) => s.slug === slug) || T.SCHOOLS[0];
  T.MILES = { ua: { auburn: 138, gt: 205 }, auburn: { ua: 138, gt: 108 }, gt: { ua: 205, auburn: 108 } };


  /* Campus map (fictional layout), 640x400 box. */
  T.BUILDINGS = [
    { id: 'lib', name: 'Main Library', x: 250, y: 140, w: 120, h: 70 },
    { id: 'stu', name: 'Student Center', x: 90, y: 120, w: 110, h: 80 },
    { id: 'rec', name: 'Rec Center', x: 470, y: 250, w: 110, h: 80 },
    { id: 'eng', name: 'Engineering Hall', x: 440, y: 70, w: 120, h: 70 },
    { id: 'sci', name: 'Science Hall', x: 260, y: 270, w: 110, h: 70 },
    { id: 'hum', name: 'Humanities Hall', x: 90, y: 260, w: 110, h: 70 },
    { id: 'res', name: 'Residence Commons', x: 40, y: 20, w: 150, h: 55 },
    { id: 'pkg', name: 'Parking Deck A', x: 480, y: 350, w: 120, h: 36 },
  ];
  T.SPOTS = [
    { id: 'quad', name: 'Quad Fountain', x: 220, y: 235, safe: true },
    { id: 'libsteps', name: 'Library Steps', x: 310, y: 222, safe: true },
    { id: 'stuLobby', name: 'Student Center Lobby', x: 145, y: 212, safe: true },
    { id: 'recDoor', name: 'Rec Center Entrance', x: 525, y: 240, safe: true },
    { id: 'engCourt', name: 'Engineering Courtyard', x: 500, y: 158, safe: true },
    { id: 'deckKiosk', name: 'Parking Deck A Kiosk', x: 540, y: 340, safe: false },
  ];
  T.spot = (id) => T.SPOTS.find((s) => s.id === id) || T.SPOTS[0];
  T.HOME = { x: 145, y: 212 }; // the user's usual area, for walking time
  T.walkMin = (spotId) => { const s = T.spot(spotId); return Math.max(1, Math.round(Math.hypot(s.x - T.HOME.x, s.y - T.HOME.y) / 28)); };

  T.COURSES = [
    { code: 'CS 100', name: 'Intro to Computing', dept: 'Computer Science', next: 140, mats: [
      { key: 'cs100-text', type: 'textbook', name: 'Intro to Computing: Concepts and Practice', edition: '5th', isbn: '978-0-00-000100-1', src: 'syllabus', newPrice: 118 },
      { key: 'cs100-code', type: 'access', name: 'Online practice platform access code', src: 'syllabus', newPrice: 45 } ] },
    { code: 'ECE 380', name: 'Signals and Systems', dept: 'Electrical Engineering', next: 96, mats: [
      { key: 'ece380-text', type: 'textbook', name: 'Signals and Systems Primer', edition: '3rd', isbn: '978-0-00-000380-3', src: 'syllabus', newPrice: 165 },
      { key: 'ece380-calc', type: 'calc', name: 'Approved scientific calculator', src: 'registrar', newPrice: 24 },
      { key: 'ece380-lab', type: 'lab', name: 'ECE 380 lab manual', edition: 'Fall', src: 'syllabus', newPrice: 32 } ] },
    { code: 'CH 101', name: 'General Chemistry', dept: 'Chemistry', next: 410, mats: [
      { key: 'ch101-text', type: 'textbook', name: 'General Chemistry: Atoms to Reactions', edition: '2nd', isbn: '978-0-00-000101-8', src: 'syllabus', newPrice: 140 },
      { key: 'ch101-goggles', type: 'safety', name: 'Splash safety goggles', src: 'registrar', newPrice: 9 },
      { key: 'ch101-coat', type: 'safety', name: 'Lab coat', src: 'registrar', newPrice: 22 },
      { key: 'ch101-lab', type: 'lab', name: 'Bound lab notebook', src: 'syllabus', newPrice: 12 } ] },
    { code: 'EN 102', name: 'Composition and Argument', dept: 'English', next: 520, mats: [
      { key: 'en102-text', type: 'textbook', name: "The Writer's Handbook", edition: '9th', isbn: '978-0-00-000102-5', src: 'syllabus', newPrice: 48 },
      { key: 'en102-reader', type: 'textbook', name: 'Argument and Culture: A Reader', edition: '2nd', isbn: '978-0-00-001102-2', src: 'syllabus', newPrice: 38 } ] },
    { code: 'MATH 125', name: 'Calculus I', dept: 'Mathematics', next: 380, mats: [
      { key: 'math125-text', type: 'textbook', name: 'Calculus: Early Concepts', edition: '8th', isbn: '978-0-00-000125-4', src: 'syllabus', newPrice: 155 },
      { key: 'math125-calc', type: 'calc', name: 'Graphing calculator', src: 'registrar', newPrice: 95 } ] },
    { code: 'PY 101', name: 'Intro to Psychology', dept: 'Psychology', next: 460, mats: [
      { key: 'py101-text', type: 'textbook', name: 'Psychology in Context', edition: '4th', isbn: '978-0-00-000201-5', src: 'syllabus', newPrice: 120 },
      { key: 'py101-access', type: 'access', name: 'Online study access code', src: 'syllabus', newPrice: 60 } ] },
    { code: 'BSC 114', name: 'Principles of Biology', dept: 'Biology', next: 330, mats: [
      { key: 'bsc114-text', type: 'textbook', name: 'Biology: Living Systems', edition: '3rd', isbn: '978-0-00-000114-8', src: 'syllabus', newPrice: 150 },
      { key: 'bsc114-lab', type: 'lab', name: 'Biology lab manual', src: 'syllabus', newPrice: 30 } ] },
    { code: 'ST 260', name: 'Statistics for Decisions', dept: 'Statistics', next: 270, mats: [
      { key: 'st260-text', type: 'textbook', name: 'Statistics for Decisions', edition: '6th', isbn: '978-0-00-000260-9', src: 'syllabus', newPrice: 110 },
      { key: 'st260-calc', type: 'calc', name: 'Approved scientific calculator', src: 'registrar', newPrice: 24 } ] },
  ];
  T.course = (code) => T.COURSES.find((c) => c.code === code);
  T.allMats = () => T.COURSES.flatMap((c) => c.mats.map((m) => ({ ...m, course: c.code })));
  T.REGISTERED = ['CS 100', 'ECE 380', 'CH 101', 'EN 102', 'MATH 125'];

  T.USERS = {
    me: { id: 'me', name: 'Jordan Lee', sales: 1, rating: 4.7, ratings: 3, credits: 40, months: 2, noShows: 0, verified: true },
    tom: { id: 'tom', name: 'Tom Baker', sales: 8, rating: 4.9, ratings: 8, credits: 160, months: 14, noShows: 0, verified: true },
    minh: { id: 'minh', name: 'Minh Tran', sales: 0, rating: 0, ratings: 0, credits: 0, months: 0, noShows: 0, verified: true },
    priya: { id: 'priya', name: 'Priya Nair', sales: 5, rating: 4.8, ratings: 5, credits: 90, months: 9, noShows: 0, verified: true },
    devon: { id: 'devon', name: 'Devon Harris', sales: 3, rating: 4.4, ratings: 3, credits: 50, months: 5, noShows: 1, verified: true },
    keisha: { id: 'keisha', name: 'Keisha Brown', sales: 12, rating: 4.9, ratings: 12, credits: 220, months: 20, noShows: 0, verified: true },
    jamal: { id: 'jamal', name: 'Jamal Okafor', sales: 2, rating: 4.5, ratings: 2, credits: 30, months: 3, noShows: 0, verified: false },
    auburn1: { id: 'auburn1', name: 'Riley Chen', sales: 4, rating: 4.7, ratings: 4, credits: 70, months: 8, noShows: 0, verified: true, school: 'auburn' },
    gt1: { id: 'gt1', name: 'Sasha Ivanov', sales: 6, rating: 4.8, ratings: 6, credits: 110, months: 11, noShows: 0, verified: true, school: 'gt' },
  };

  /* L(id, cat, title, price, cond, seller, spot, extras) */
  const L = (id, cat, title, price, cond, seller, spot, x = {}) => ({
    id, cat, title, price, cond, seller, spot, status: 'AVAILABLE', school: 'ua', cross: false, desc: '', posted: 0, ...x,
  });
  T.LISTINGS = [
    L('L01', 'CLASS', 'Intro to Computing: Concepts and Practice, 5th ed.', 62, 'Good', 'priya', 'libsteps', { course: 'CS 100', mat: 'cs100-text', isbn: '978-0-00-000100-1', desc: 'Light highlighting in chapters 1 to 4. Includes the practice problem insert.', cross: true }),
    L('L02', 'CLASS', 'Signals and Systems Primer, 3rd ed.', 85, 'Good', 'tom', 'engCourt', { course: 'ECE 380', mat: 'ece380-text', isbn: '978-0-00-000380-3', desc: 'Clean copy, no missing pages. Solutions pamphlet included.', cross: true }),
    L('L03', 'CLASS', 'Signals and Systems Primer, 3rd ed. (cheaper, worn)', 70, 'Fair', 'jamal', 'quad', { course: 'ECE 380', mat: 'ece380-text', isbn: '978-0-00-000380-3', desc: 'Cover is bent but every page is there.' }),
    L('L04', 'CLASS', 'ECE 380 lab manual, Fall edition', 14, 'Good', 'tom', 'engCourt', { course: 'ECE 380', mat: 'ece380-lab', desc: 'Only the first lab is filled in.' }),
    L('L05', 'CLASS', 'Scientific calculator (on the ECE 380 approved list)', 12, 'Good', 'keisha', 'stuLobby', { course: 'ECE 380', mat: 'ece380-calc', desc: 'Fresh batteries.' }),
    L('L06', 'CLASS', 'Scientific calculator, works for ECE 380 and ST 260', 14, 'Like new', 'devon', 'libsteps', { course: 'ECE 380', mat: 'ece380-calc', desc: 'Used one semester. Case included.', status: 'NEGOTIATING' }),
    L('L07', 'CLASS', 'General Chemistry: Atoms to Reactions, 2nd ed.', 78, 'Good', 'keisha', 'recDoor', { course: 'CH 101', mat: 'ch101-text', isbn: '978-0-00-000101-8', desc: 'Access code not included.', cross: true }),
    L('L08', 'LAB', 'Splash safety goggles, clear', 5, 'Like new', 'keisha', 'recDoor', { course: 'CH 101', mat: 'ch101-goggles' }),
    L('L09', 'LAB', 'Lab coat, size M', 11, 'Good', 'priya', 'libsteps', { course: 'CH 101', mat: 'ch101-coat', desc: 'Washed twice. Fits 5\'8" to 5\'11".' }),
    L('L10', 'CLASS', 'Bound lab notebook, 100 pages (unused)', 6, 'New', 'priya', 'libsteps', { course: 'CH 101', mat: 'ch101-lab' }),
    L('L11', 'CLASS', "The Writer's Handbook, 9th ed.", 24, 'Good', 'tom', 'stuLobby', { course: 'EN 102', mat: 'en102-text', isbn: '978-0-00-000102-5' }),
    L('L12', 'CLASS', 'Argument and Culture: A Reader, 2nd ed.', 18, 'Fair', 'jamal', 'quad', { course: 'EN 102', mat: 'en102-reader', isbn: '978-0-00-001102-2' }),
    L('L13', 'CLASS', 'Calculus: Early Concepts, 8th ed.', 90, 'Like new', 'keisha', 'recDoor', { course: 'MATH 125', mat: 'math125-text', isbn: '978-0-00-000125-4', cross: true, status: 'ON_HOLD', desc: 'Never highlighted.' }),
    L('L14', 'CLASS', 'Graphing calculator with cable', 58, 'Good', 'tom', 'engCourt', { course: 'MATH 125', mat: 'math125-calc' }),
    L('L15', 'CLASS', 'Psychology in Context, 4th ed.', 55, 'Good', 'priya', 'libsteps', { course: 'PY 101', mat: 'py101-text', isbn: '978-0-00-000201-5' }),
    L('L16', 'CLASS', 'Biology: Living Systems, 3rd ed.', 82, 'Good', 'keisha', 'recDoor', { course: 'BSC 114', mat: 'bsc114-text', isbn: '978-0-00-000114-8' }),
    L('L17', 'CLASS', 'Statistics for Decisions, 6th ed.', 48, 'Good', 'devon', 'quad', { course: 'ST 260', mat: 'st260-text', isbn: '978-0-00-000260-9' }),
    L('L18', 'DORM', 'Mini fridge, 3.2 cu ft', 60, 'Good', 'tom', 'deckKiosk', { desc: 'Cold and quiet. Fits under a lofted bed.' }),
    L('L19', 'DORM', 'Twin XL mattress topper, 3 in', 20, 'Like new', 'priya', 'stuLobby'),
    L('L20', 'DORM', 'Desk lamp with USB port', 8, 'Good', 'devon', 'quad'),
    L('L21', 'DORM', 'Over-the-door mirror', 6, 'Fair', 'jamal', 'quad', { status: 'SOLD' }),
    L('L22', 'DORM', 'Microwave, 700 W', 25, 'Good', 'keisha', 'recDoor', { status: 'ON_HOLD' }),
    L('L23', 'LAB', 'Soldering iron kit with stand', 18, 'Good', 'tom', 'engCourt', { desc: 'Good for the ECE 380 lab and side projects.' }),
    L('L24', 'TICKET', 'Home game tickets, section 112, 2 seats', 70, 'New', 'keisha', 'stuLobby', { event: 'Home opener', date: 'Sat 6:30 PM', seat: 'Sec 112, Row 20' }),
    L('L25', 'TICKET', 'Spring concert floor pass', 35, 'New', 'devon', 'recDoor', { event: 'Spring concert', date: 'Fri 8:00 PM', seat: 'Floor' }),
    L('L26', 'TUTOR', 'ECE 380 tutoring, 1 hour sessions', 20, 'New', 'tom', 'libsteps', { course: 'ECE 380', subject: 'Signals and Systems', rate: '$20/hr', avail: 'Weeknights after 6' }),
    L('L27', 'TUTOR', 'CH 101 and BSC 114 study sessions', 18, 'New', 'priya', 'libsteps', { course: 'CH 101', subject: 'Chemistry, Biology', rate: '$18/hr', avail: 'Sun to Wed afternoons' }),
    L('L28', 'RIDE', 'Ride to Atlanta airport, Friday 2 PM', 25, 'New', 'devon', 'deckKiosk', { from: 'Tuscaloosa', to: 'ATL airport', date: 'Fri 2:00 PM', seats: 3 }),
    L('L29', 'VEHICLE', '2011 hatchback, 118k miles', 3900, 'Good', 'keisha', 'deckKiosk', { make: 'Hatchback', year: 2011, miles: 118000, desc: 'New tires, clean title. Test drive in a public lot.' }),
    L('L30', 'OTHER', 'Bike with lock, 21 speed', 75, 'Good', 'tom', 'recDoor'),
    /* Other campuses, visible through Browse other campuses. */
    L('A01', 'CLASS', 'Signals and Systems Primer, 3rd ed.', 75, 'Good', 'auburn1', 'quad', { school: 'auburn', cross: true, course: 'ECE 380', mat: 'ece380-text', isbn: '978-0-00-000380-3' }),
    L('A02', 'DORM', 'Compact air purifier', 30, 'Like new', 'auburn1', 'quad', { school: 'auburn', cross: true }),
    L('G01', 'CLASS', 'Intro to Computing: Concepts and Practice, 5th ed.', 55, 'Good', 'gt1', 'quad', { school: 'gt', cross: true, course: 'CS 100', mat: 'cs100-text', isbn: '978-0-00-000100-1' }),
    L('G02', 'LAB', 'Oscilloscope probes, pair', 22, 'Good', 'gt1', 'quad', { school: 'gt', cross: true }),
    L('G03', 'CLASS', 'Graphing calculator', 50, 'Good', 'gt1', 'quad', { school: 'gt', cross: true, course: 'MATH 125', mat: 'math125-calc' }),
  ];

  /* Campus Hub. Contact details are not invented: TODO_VERIFY marks what an admin must confirm. */
  T.RESOURCES = [
    { id: 'r1', cat: 'Tutoring', name: 'Center for Academic Success', desc: 'Drop-in and appointment tutoring across intro courses.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [9, 17], tags: ['tutoring', 'ece', 'math', 'chem'] },
    { id: 'r2', cat: 'Tutoring', name: 'Supplemental Instruction (SI)', desc: 'Peer-led group review sessions for difficult courses.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [16, 21], tags: ['tutoring', 'group'] },
    { id: 'r3', cat: 'Tutoring', name: 'Peer coaching', desc: 'Study skills and time management with a trained peer.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [10, 16], tags: ['tutoring', 'habits'] },
    { id: 'r4', cat: 'Writing & Speaking', name: 'Writing Center', desc: 'Feedback on drafts at any stage, in person or online.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [9, 20], tags: ['writing', 'en102'] },
    { id: 'r5', cat: 'Writing & Speaking', name: 'Speaking Studio', desc: 'Practice presentations and get recorded feedback.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [11, 17], tags: ['speaking'] },
    { id: 'r6', cat: 'Engineering', name: 'Engineering tutoring and lab help', desc: 'Tutors for circuits, signals, programming and statics.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [12, 21], tags: ['tutoring', 'ece', 'cs'] },
    { id: 'r7', cat: 'Health & Wellness', name: 'Counseling and mental health', desc: 'Confidential counseling and crisis support.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [8, 17], tags: ['wellness', 'stress'] },
    { id: 'r8', cat: 'Health & Wellness', name: 'Student health clinic', desc: 'Primary care, vaccines and pharmacy.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [8, 17], tags: ['wellness'] },
    { id: 'r9', cat: 'Career', name: 'Career center', desc: 'Resume reviews, mock interviews and employer events.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [9, 17], tags: ['career'] },
    { id: 'r10', cat: 'Food & Basic Needs', name: 'Campus food pantry', desc: 'Free groceries and hygiene items for students.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [10, 15], tags: ['food', 'basic'] },
    { id: 'r11', cat: 'Tech & Library', name: 'Library research help', desc: 'Research consultations and course reserve textbooks.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [8, 22], tags: ['library', 'textbooks'] },
    { id: 'r12', cat: 'Tech & Library', name: 'IT help desk', desc: 'Wi-Fi, accounts, software and loaner laptops.', url: 'TODO_VERIFY', phone: 'TODO_VERIFY', hours: [8, 18], tags: ['tech'] },
  ];
  T.RES_CATS = [['Tutoring', '#EFCDD1'], ['Writing & Speaking', '#EFCDD1'], ['Engineering', '#EFCDD1'], ['Health & Wellness', '#EFCDD1'], ['Career', '#EFCDD1'], ['Food & Basic Needs', '#EFCDD1'], ['Tech & Library', '#EFCDD1']];

  T.SYNONYMS = { calc: 'calculator', calculator: 'calculator', goggles: 'safety glasses', 'safety glasses': 'goggles', text: 'textbook', book: 'textbook', fridge: 'refrigerator', refrigerator: 'fridge', coat: 'lab coat', lamp: 'light' };

  /* ---------- state ---------- */
  const KEY = 'trunk-os-v1';
  T.freshState = function () {
    return {
      signedIn: false, email: '', name: 'Jordan Lee', verified: false, school: 'ua', uid: 'me', theme: '',
      listings: JSON.parse(JSON.stringify(T.LISTINGS)),
      users: JSON.parse(JSON.stringify(T.USERS)),
      synced: false, have: {}, wanted: [], favorites: {}, shareWindow: 0, friends: ['Maya (roommate)', 'Dad'],
      ledger: [{ uid: 'me', delta: 40, why: 'Welcome bonus and first sale', at: 'Sep 2' }],
      reviews: [
        { to: 'me', from: 'priya', stars: 5, tags: ['on time', 'friendly'], text: 'Easy handoff at the library, book was exactly as described.' },
        { to: 'me', from: 'tom', stars: 4, tags: ['as described'], text: 'Smooth. Showed up a few minutes late.' },
        { to: 'tom', from: 'keisha', stars: 5, tags: ['on time', 'as described'], text: 'Best seller on campus. Textbook looked brand new.' },
        { to: 'tom', from: 'devon', stars: 5, tags: ['friendly'], text: 'Helped me figure out which lab manual I needed.' },
      ],
      vouches: [],
      chats: {
        L06: { lid: 'L06', with: 'devon', status: 'NEGOTIATING', meetup: null, confirm: { me: false, them: false }, msgs: [
          { from: 'me', text: 'Is this available?', t: '9:02' }, { from: 'devon', text: 'Yes! Still have it.', t: '9:05' }, { from: 'me', text: 'Can you do $12?', t: '9:06' }, { from: 'devon', text: 'Could do $13 if we meet at the library steps.', t: '9:10' } ] },
        L02: { lid: 'L02', with: 'tom', status: 'NEGOTIATING', meetup: null, confirm: { me: false, them: false }, msgs: [
          { from: 'me', text: 'Does it come with the solutions pamphlet?', t: 'Yesterday' }, { from: 'tom', text: 'It does. Want to meet at the engineering courtyard?', t: 'Yesterday' } ] },
      },
      sos: false, nextId: 100,
    };
  };
  T.state = null;
  T.load = function () {
    try { const raw = localStorage.getItem(KEY); if (raw) { T.state = JSON.parse(raw); T.mergeTenants(); return; } } catch (e) { /* storage unavailable */ }
    T.state = T.freshState();
  };
  /* Tenants created from the admin page persist in state and join the registry at boot. */
  T.mergeTenants = function () {
    (T.state.extraSchools || []).forEach((x) => { if (!T.SCHOOLS.some((s) => s.slug === x.slug)) T.SCHOOLS.push(x); });
  };
  /* Subdomain routing: ua.trunk.app -> 'ua'. Path routing (#/market) covers local use. */
  T.tenantFromHost = function (host) {
    const m = /^([a-z0-9-]+)\.trunk\.app$/i.exec(host || '');
    return m && T.SCHOOLS.some((s) => s.slug === m[1].toLowerCase()) ? m[1].toLowerCase() : null;
  };
  T.save = function () { try { localStorage.setItem(KEY, JSON.stringify(T.state)); } catch (e) { /* ignore */ } };
  T.reset = function () { T.state = T.freshState(); T.save(); };

  T.user = (id) => T.state.users[id] || { id, name: id, sales: 0, rating: 0, ratings: 0, credits: 0, months: 0, noShows: 0, verified: false };
  T.me = () => T.user(T.state.uid);
  T.listing = (id) => T.state.listings.find((l) => l.id === id);
  T.initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
})(window.Trunk);
