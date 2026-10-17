/* Integration adapters. DEMO_MODE=true selects the Mock implementations; each Real stub lists what to wire up. */
window.Trunk = window.Trunk || {};
(function (T) {
  T.DEMO_MODE = true;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const registrar = {
    mock: { async fetchCourses() { await wait(900); return T.REGISTERED.slice(); } },
    real: { async fetchCourses() {
      // TODO: authenticate with the school's Banner / myBama SSO (OAuth/SAML), read the student's registered sections.
      throw new Error('Registrar integration not configured');
    } },
  };

  /* Syllabus parsing. Real: call the Claude API (model claude-sonnet-5-5) server-side with the syllabus text and ask for JSON. */
  const ai = {
    mock: {
      async parseSyllabus(text) {
        await wait(700);
        const found = T.COURSES.filter((c) => new RegExp(c.code.replace(' ', '\\s?'), 'i').test(text));
        if (found.length) return { course: found[0].code, items: found[0].mats.map((m) => ({ ...m, src: 'syllabus' })) };
        const items = [];
        text.split(/\n+/).forEach((line, i) => {
          const isbn = /ISBN[:\s#-]*([0-9][0-9-]{9,16})/i.exec(line);
          if (isbn || /required (text|book)/i.test(line) || /calculator|goggles|lab coat|access code/i.test(line)) {
            const type = /calculator/i.test(line) ? 'calc' : /goggles|coat/i.test(line) ? 'safety' : /access/i.test(line) ? 'access' : 'textbook';
            items.push({ key: 'x' + i + Date.now(), type, name: line.replace(/^[\s•*-]+/, '').slice(0, 80), isbn: isbn ? isbn[1] : '', src: 'syllabus', newPrice: type === 'calc' ? 25 : type === 'safety' ? 12 : 90 });
          }
        });
        return { course: (/\b([A-Z]{2,4})\s?(\d{3})\b/.exec(text) || [])[0] || 'Uploaded course', items };
      },
    },
    real: { async parseSyllabus() {
      // TODO: POST to /api/ai/syllabus; server calls Anthropic with ANTHROPIC_API_KEY, validates the JSON with Zod.
      throw new Error('ANTHROPIC_API_KEY missing, using mock parser');
    } },
  };

  const verification = {
    mock: { async verify(id) { await wait(400); return /^1\d{7}$/.test(id); } },
    real: { async verify() { /* TODO: SheerID verification request with the student's ID and document upload. */ throw new Error('Not configured'); } },
  };
  const realtime = {
    mock: { subscribe() { /* in-page timers stand in for a socket */ return () => {}; } },
    real: { subscribe() { /* TODO: Server-Sent Events, Pusher or Supabase Realtime channel per conversation. */ throw new Error('Not configured'); } },
  };
  const storage = {
    mock: { async put(file) { return URL.createObjectURL(file); } },
    real: { async put() { /* TODO: presigned S3 PUT, return the object URL. */ throw new Error('Not configured'); } },
  };
  const pick = (a) => (T.DEMO_MODE ? a.mock : a.real);
  T.adapters = { registrar: pick(registrar), ai: pick(ai), verification: pick(verification), realtime: pick(realtime), storage: pick(storage) };
})(window.Trunk);
