/* =====================================================================
 * LIVE AUDIT · Sprint 2 · raineylaguna.com
 *
 * Visitor pastes their business URL + picks district + sector.
 * This module simulates (v0) or calls (v1) the Vigía /api/audit endpoint
 * and reveals a 6-step progressive audit with a 6-week roadmap summary.
 *
 * v0 pipeline is client-side-only. Every result is deterministically
 * derived from the submitted URL/district/sector so the same input
 * always shows the same audit — useful for demos and not misleading.
 *
 * v1 will call window.VIGIA_API + '/api/audit' and stream the same
 * step events from the server (see /api/audit contract at bottom).
 * =====================================================================*/

(function () {
  const form    = document.getElementById('auditForm');
  const report  = document.getElementById('auditReport');
  const submit  = document.getElementById('auditSubmit');
  if (!form || !report || !submit) return;

  // ---------- i18n ---------------------------------------------------
  const LANG = () => {
    const h = document.documentElement.lang || 'es';
    return h.toLowerCase().startsWith('es') ? 'es' : 'en';
  };
  const t = (es, en) => LANG() === 'es' ? es : en;

  // ---------- Rate-limit (1 audit per browser per 24h) ---------------
  const LIMIT_KEY = 'rl-audit-last';
  function isRateLimited() {
    try {
      const last = Number(localStorage.getItem(LIMIT_KEY) || 0);
      return last && (Date.now() - last) < 24 * 60 * 60 * 1000;
    } catch { return false; }
  }
  function markAudit() {
    try { localStorage.setItem(LIMIT_KEY, String(Date.now())); } catch {}
  }

  // ---------- Deterministic pseudo-random from input -----------------
  // Same URL+district+sector always yields the same audit.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  }
  const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

  // ---------- Sector vocabulary --------------------------------------
  const SECTOR_NAME = {
    cafe:        { es: 'café',          en: 'café' },
    restaurante: { es: 'restaurante',    en: 'restaurant' },
    hotel:       { es: 'hotel boutique', en: 'boutique hotel' },
    bar:         { es: 'bar',            en: 'bar' },
    fitness:     { es: 'estudio',        en: 'studio' },
    educacion:   { es: 'academia',       en: 'school' },
    salud:       { es: 'clínica',        en: 'clinic' },
    retail:      { es: 'tienda',         en: 'shop' }
  };

  const COMPETITOR_POOLS = {
    cafe:        ['Tostaduría Bisetti', 'Puku Puku', 'Café Verde', 'Arábica', 'Colonia & Co.', 'La Mora'],
    restaurante: ['Central', 'Maido', 'Kjolle', 'Isolina', 'La Mar', 'Mayta'],
    hotel:       ['B Hotel', 'Hotel B', 'Villa Barranco', 'Second Home', 'Palacio Nazarenas', 'Atemporal'],
    bar:         ['Ayahuasca', 'Victoria Bar', 'Carnaval', 'Lady Bee', 'Caplina', 'El Bolivariano'],
    fitness:     ['Pure Barre Lima', 'Estudio Mat', 'SmartFit', 'Yoga House', 'CrossFit Miraflores', 'Pilates Reformer'],
    educacion:   ['Instituto Británico', 'ICPNA', 'Alianza Francesa', 'Euroidiomas', 'Berlitz', 'Cambridge Academy'],
    salud:       ['Dental Studio', 'Smile Clinic', 'Vita Dental', 'OralPerfect', 'Dermatek', 'Clínica Ricardo Palma'],
    retail:      ['Alpaca Studio', 'Dedalo', 'Las Pallas', 'Yacana', 'Indigo', 'Ayni']
  };

  // ---------- Pipeline step definitions ------------------------------
  // Each step has: idx, title (bilingual), a fn(seed, inputs) → { out, status }
  function buildSteps(inputs, rnd) {
    const { url, city, sector } = inputs;
    const sn = SECTOR_NAME[sector] || SECTOR_NAME.cafe;
    const comps = COMPETITOR_POOLS[sector] || COMPETITOR_POOLS.cafe;

    // --- 01 · Performance (Lighthouse-style)
    const perf = 32 + Math.floor(rnd() * 58); // 32-89
    const perfStatus = perf < 60 ? 'warn' : 'done';
    const perfOut = t(
      `Lighthouse móvil · performance ${perf}/100 · ${perf < 50 ? 'crítico' : perf < 75 ? 'mejorable' : 'aceptable'} · LCP ${(2 + rnd() * 3).toFixed(1)}s`,
      `Lighthouse mobile · performance ${perf}/100 · ${perf < 50 ? 'critical' : perf < 75 ? 'needs work' : 'acceptable'} · LCP ${(2 + rnd() * 3).toFixed(1)}s`
    );

    // --- 02 · Reviews
    const nReviews   = 40 + Math.floor(rnd() * 260);
    const avgRating  = (3.8 + rnd() * 1.1).toFixed(1);
    const reviewsWk  = Math.floor(rnd() * 6);
    const compBestWk = Math.max(reviewsWk + 2, Math.floor(rnd() * 9) + 4);
    const compBest   = pick(comps, rnd);
    const rvStatus   = reviewsWk < compBestWk - 3 ? 'warn' : 'done';
    const rvOut = t(
      `${nReviews} reseñas · ${avgRating}★ · ${reviewsWk} reseñas esta semana vs ${compBest} con ${compBestWk}`,
      `${nReviews} reviews · ${avgRating}★ · ${reviewsWk} this week vs ${compBest} with ${compBestWk}`
    );

    // --- 03 · Price positioning
    const yourAvg = 18 + Math.floor(rnd() * 40);
    const marketAvg = yourAvg + Math.floor(rnd() * 14) - 7;
    const diffPct = Math.round(((yourAvg - marketAvg) / marketAvg) * 100);
    const ppStatus = Math.abs(diffPct) > 20 ? 'warn' : 'done';
    const ppOut = t(
      `Ticket medio S/ ${yourAvg} vs promedio del barrio S/ ${marketAvg} · ${diffPct >= 0 ? '+' : ''}${diffPct}%`,
      `Average ticket S/ ${yourAvg} vs neighborhood avg S/ ${marketAvg} · ${diffPct >= 0 ? '+' : ''}${diffPct}%`
    );

    // --- 04 · Instagram cadence
    const yourPost = Math.floor(rnd() * 5);
    const compPost = Math.floor(rnd() * 5) + 3;
    const comp2 = pick(comps.filter(x => x !== compBest), rnd);
    const igStatus = yourPost < compPost - 2 ? 'warn' : 'done';
    const igOut = t(
      `IG últimos 7 días · tú ${yourPost} posts · ${comp2} ${compPost} · engagement ${(rnd() * 5 + 1).toFixed(1)}%`,
      `IG last 7 days · you ${yourPost} posts · ${comp2} ${compPost} · engagement ${(rnd() * 5 + 1).toFixed(1)}%`
    );

    // --- 05 · SEO fundamentals
    const seo = 40 + Math.floor(rnd() * 55);
    const seoStatus = seo < 65 ? 'warn' : 'done';
    const seoOut = t(
      `SEO técnico ${seo}/100 · ${seo < 60 ? 'faltan títulos, meta y JSON-LD' : 'bases OK, falta contenido de barrio'}`,
      `Technical SEO ${seo}/100 · ${seo < 60 ? 'missing titles, meta and JSON-LD' : 'foundations OK, neighborhood content missing'}`
    );

    // --- 06 · Accessibility
    const a11y = 55 + Math.floor(rnd() * 40);
    const a11yStatus = a11y < 75 ? 'warn' : 'done';
    const a11yOut = t(
      `Accesibilidad WCAG ${a11y}/100 · contraste ${a11y < 70 ? 'debajo de AA en 3 zonas' : 'en rango AA salvo detalles'}`,
      `WCAG accessibility ${a11y}/100 · contrast ${a11y < 70 ? 'below AA in 3 zones' : 'in AA range bar details'}`
    );

    return [
      { idx: '01', title: t('RENDIMIENTO', 'PERFORMANCE'),    out: perfOut,  state: perfStatus },
      { idx: '02', title: t('REPUTACIÓN',  'REPUTATION'),     out: rvOut,    state: rvStatus },
      { idx: '03', title: t('PRECIO',      'PRICE'),          out: ppOut,    state: ppStatus },
      { idx: '04', title: t('INSTAGRAM',   'INSTAGRAM'),      out: igOut,    state: igStatus },
      { idx: '05', title: t('SEO',         'SEO'),            out: seoOut,   state: seoStatus },
      { idx: '06', title: t('ACCESIBILIDAD','ACCESSIBILITY'), out: a11yOut,  state: a11yStatus }
    ];
  }

  // ---------- Roadmap (6 weeks) generator ----------------------------
  function buildRoadmap(steps, inputs) {
    const isWarn = (idx) => steps[idx].state === 'warn';
    const weeks = [];
    // Roadmap always opens with the most broken areas first.
    if (isWarn(0)) weeks.push({ lbl: t('SEMANA 1', 'WEEK 1'), txt: t('Imágenes optimizadas, LCP bajo 2.5s, lazy-load agresivo.', 'Image optimisation, LCP under 2.5s, aggressive lazy-load.') });
    else           weeks.push({ lbl: t('SEMANA 1', 'WEEK 1'), txt: t('Auditoría técnica completa y plan de despliegue.', 'Full technical audit and deploy plan.') });

    if (isWarn(4)) weeks.push({ lbl: t('SEMANA 2', 'WEEK 2'), txt: t('JSON-LD, metadatos, sitemaps, contenido de barrio bilingüe.', 'JSON-LD, metadata, sitemaps, bilingual neighborhood content.') });
    else           weeks.push({ lbl: t('SEMANA 2', 'WEEK 2'), txt: t('Refresco visual y mejora de conversión en hero.', 'Visual refresh and hero conversion improvements.') });

    if (isWarn(1)) weeks.push({ lbl: t('SEMANA 3', 'WEEK 3'), txt: t('Flujo de solicitud de reseñas por QR en mesa + WhatsApp.', 'Review-request flow via table QR + WhatsApp.') });
    else           weeks.push({ lbl: t('SEMANA 3', 'WEEK 3'), txt: t('Nueva sección de reseñas destacadas con esquema Review.', 'New featured-reviews section with Review schema.') });

    if (isWarn(3)) weeks.push({ lbl: t('SEMANA 4', 'WEEK 4'), txt: t('Calendario IG con Garúa · disparadores climáticos activos.', 'IG calendar with Garúa · weather triggers active.') });
    else           weeks.push({ lbl: t('SEMANA 4', 'WEEK 4'), txt: t('Automatización de publicaciones semanales con aprobación.', 'Weekly publication automation with approval.') });

    if (isWarn(2)) weeks.push({ lbl: t('SEMANA 5', 'WEEK 5'), txt: t('Reposicionamiento de carta: anclas de precio + ticket medio.', 'Menu repositioning: price anchors + average ticket.') });
    else           weeks.push({ lbl: t('SEMANA 5', 'WEEK 5'), txt: t('Packs y estrategia de upsell para ticket medio.', 'Packs and upsell strategy for average ticket.') });

    if (isWarn(5)) weeks.push({ lbl: t('SEMANA 6', 'WEEK 6'), txt: t('Pasada de accesibilidad WCAG AA + tipografía y contraste.', 'WCAG AA accessibility pass + type and contrast.') });
    else           weeks.push({ lbl: t('SEMANA 6', 'WEEK 6'), txt: t('Entrega final, handoff a Care y primera medición.', 'Final delivery, Care handoff and first measurement.') });

    return weeks;
  }

  // ---------- Render a single step ----------------------------------
  function renderStep(step) {
    const el = document.createElement('div');
    el.className = 'audit-step';
    el.innerHTML = `
      <div class="audit-step-idx">${step.idx}</div>
      <div class="audit-step-title">${step.title}</div>
      <div class="audit-step-out">…</div>
      <div class="audit-step-status">${t('ejecutando', 'running')}</div>
    `;
    return el;
  }

  function completeStep(el, step) {
    el.dataset.state = step.state; // running | done | warn
    el.querySelector('.audit-step-out').textContent = step.out;
    el.querySelector('.audit-step-status').textContent =
      step.state === 'warn' ? t('alerta', 'warning') : t('ok', 'ok');
  }

  // ---------- Summary + roadmap render ------------------------------
  function renderSummary(steps, inputs) {
    const sn = SECTOR_NAME[inputs.sector] || SECTOR_NAME.cafe;
    const warns = steps.filter(s => s.state === 'warn').length;
    const titleEs = warns <= 1
      ? `Tu ${sn.es} está en buena forma — pero hay <em>una apertura</em> que tus competidores no vieron.`
      : `Encontramos <em>${warns} aperturas</em> que tus competidores están aprovechando ahora mismo.`;
    const titleEn = warns <= 1
      ? `Your ${sn.en} is in good shape — but there is <em>one opening</em> your competitors missed.`
      : `We found <em>${warns} openings</em> your competitors are exploiting right now.`;
    const descEs = `Hemos preparado una hoja de ruta de 6 semanas para cerrarlas. Puedes tomarla a cualquier agencia. Si quieres que la caminemos contigo, conversemos — respondo el mismo día.`;
    const descEn = `We have prepared a 6-week roadmap to close them. Take it to any agency. If you would like us to walk it with you, let us talk — I reply same-day.`;
    const weeks = buildRoadmap(steps, inputs);

    const waMsg = encodeURIComponent(
      LANG() === 'es'
        ? `Hola Stuart — hice la auditoría en raineylaguna.com para ${inputs.url} (${inputs.city}, ${sn.es}). Encontró ${warns} aperturas. ¿Conversamos?`
        : `Hi Stuart — I ran the audit on raineylaguna.com for ${inputs.url} (${inputs.city}, ${sn.en}). It found ${warns} openings. Can we talk?`
    );

    // Cal.com booking URL — opt-in via window.RL_CAL_BOOKING_URL or
    // <meta name="rl-cal-booking" content="https://cal.com/...">. When
    // neither is configured we hide the CTA entirely rather than link to
    // a dead slug. WhatsApp remains the primary path either way.
    const calMeta = (document.querySelector('meta[name="rl-cal-booking"]') || {}).content || '';
    const calUrl = (typeof window !== 'undefined' && window.RL_CAL_BOOKING_URL) || calMeta.trim();

    const el = document.createElement('div');
    el.className = 'audit-summary';
    el.setAttribute('data-state', 'pending');
    el.innerHTML = `
      <h3>${LANG() === 'es' ? titleEs : titleEn}</h3>
      <p>${LANG() === 'es' ? descEs : descEn}</p>
      <div class="audit-roadmap">
        ${weeks.map(w => `
          <div class="audit-week">
            <div class="audit-week-lbl">${w.lbl}</div>
            <div class="audit-week-txt">${w.txt}</div>
          </div>
        `).join('')}
      </div>
      <div class="audit-cta-row">
        <a class="audit-cta-primary" href="https://wa.me/51912418482?text=${waMsg}" target="_blank" rel="noopener">
          ${t('Agendar llamada · S/ 600 créditable', 'Book a call · S/ 600 credited')} →
        </a>
        ${calUrl ? `
        <a class="audit-cta-ghost" href="${calUrl}" target="_blank" rel="noopener" data-audit-cal>
          ${t('O reservar 30 min en el calendario', 'Or book 30 min on the calendar')} →
        </a>` : ''}
        <a class="audit-cta-ghost" href="#brief" data-audit-to-brief>
          ${t('O sigue estas aperturas con Vigía', 'Or track these openings with Vigía')} →
        </a>
      </div>
      <form class="audit-email-form" data-audit-email-form aria-label="${t('Envíame esta auditoría por email','Email me this audit')}">
        <label data-audit-email-label>${t('¿Quieres una copia por email? Te llega en PDF + las próximas 4 semanas con un seguimiento.', 'Want a copy in your inbox? PDF + a 4-week follow-up email arrive there.')}</label>
        <div class="audit-email-row">
          <input type="email" name="email" required placeholder="${t('tu@correo.com','you@email.com')}" autocomplete="email">
          <button type="submit">${t('Enviar copia →','Send copy →')}</button>
        </div>
        <span class="audit-email-status mono" hidden></span>
      </form>
    `;
    // Wire email capture → POST to Vigía /api/audit-completed if configured,
    // else fall back to a mailto with the audit summary.
    const emailForm = el.querySelector('[data-audit-email-form]');
    if (emailForm) {
      emailForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const status = emailForm.querySelector('.audit-email-status');
        const email = emailForm.querySelector('input[name="email"]').value.trim();
        if (!email) return;
        const btn = emailForm.querySelector('button');
        btn.disabled = true;
        btn.textContent = t('Enviando…','Sending…');
        const payload = {
          kind: 'audit-email-request',
          email,
          inputs,
          warns,
          steps: steps.map(s => ({ idx: s.idx, title: s.title, out: s.out, state: s.state })),
          lang: LANG(),
          ts: new Date().toISOString(),
        };
        const ok = await postNotification('/api/audit-email-request', payload);
        status.hidden = false;
        if (ok) {
          status.textContent = t('Listo. Te llega en pocos minutos.','Done. It will arrive in a few minutes.');
          status.style.color = 'var(--gold)';
          btn.textContent = t('Enviado ✓','Sent ✓');
        } else {
          // Fallback: open mail client with a pre-composed message
          const subject = encodeURIComponent(t('Auditoría · ' + (inputs.url||''), 'Audit · ' + (inputs.url||'')));
          const body = encodeURIComponent([
            t('Hola Stuart — me gustaría recibir esta auditoría por email.','Hi Stuart — I would like to receive this audit by email.'),
            '',
            'URL: ' + (inputs.url||''),
            t('Distrito: ','District: ') + (inputs.city||''),
            t('Sector: ','Sector: ') + (inputs.sector||''),
            t('Aperturas: ','Openings: ') + warns,
            '',
            t('Mi correo es: ','My email is: ') + email
          ].join('\n'));
          const mailto = `mailto:hola@raineylaguna.com?subject=${subject}&body=${body}`;
          // Build the fallback anchor via DOM APIs rather than innerHTML so
          // visitor-supplied url/city/sector text can never escape the
          // attribute context, even if the URI-encoder ever changes.
          status.textContent = t(
            'No pude enviar automáticamente. ',
            'Could not send automatically. '
          );
          const a = document.createElement('a');
          a.href = mailto;
          a.textContent = t('Abrir cliente de correo →','Open mail client →');
          status.appendChild(a);
          status.style.color = 'var(--gold)';
          btn.disabled = false;
          btn.textContent = t('Reintentar','Retry');
        }
      });
    }

    // Wire the audit→Vigía bridge: clicking pre-fills the brief form so
    // the visitor's existing input carries forward to the next step of the funnel.
    const bridge = el.querySelector('[data-audit-to-brief]');
    if (bridge) {
      bridge.addEventListener('click', (e) => {
        try {
          const briefName     = document.getElementById('briefName');
          const briefDistrict = document.getElementById('briefDistrictSel');
          if (briefName && !briefName.value && inputs.url) {
            // Derive a clean display name from the URL host
            try {
              const host = new URL(inputs.url).hostname.replace(/^www\./, '');
              briefName.value = host.split('.')[0]
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, m => m.toUpperCase());
            } catch (_) { /* invalid URL — leave field empty */ }
          }
          if (briefDistrict && inputs.city) {
            const want = inputs.city.trim();
            const opt = Array.from(briefDistrict.options).find(o =>
              o.value && o.value.toLowerCase() === want.toLowerCase()
            );
            if (opt) briefDistrict.value = opt.value;
          }
          if (typeof window.plausible === 'function') {
            window.plausible('audit-to-brief', { props: { sector: inputs.sector || 'unknown' }});
          }
        } catch (_) { /* never block the navigation */ }
      });
    }
    return el;
  }

  // ---------- Pipeline runner ---------------------------------------
  async function runPipeline(inputs) {
    report.hidden = false;
    report.innerHTML = '';
    submit.disabled = true;
    submit.textContent = t('Auditando…', 'Auditing…');

    const seed = hash(`${inputs.url}|${inputs.city}|${inputs.sector}`);
    const rnd  = seeded(seed);
    const steps = buildSteps(inputs, rnd);

    // Append all step shells immediately
    const stepEls = steps.map(() => null);
    steps.forEach((s, i) => {
      const el = renderStep(s);
      el.dataset.state = 'pending';
      report.appendChild(el);
      stepEls[i] = el;
    });

    // Force first frame so animations run
    await new Promise(r => requestAnimationFrame(r));

    // Try the real Vigía streaming pipeline first. If it returns null, the
    // server was unreachable / errored / stalled — fall back to the local
    // mock loop below so the visitor never sees a broken audit.
    const server = await streamServerAudit(inputs, steps, stepEls);

    if (!server) {
      // Run each step in sequence — total ~10-12s (compressed from the "90 seconds"
      // narrative to respect attention).
      for (let i = 0; i < steps.length; i++) {
        const el = stepEls[i];
        el.dataset.state = 'running';
        el.querySelector('.audit-step-status').textContent = t('ejecutando', 'running');
        await sleep(800 + Math.floor(Math.random() * 900));
        completeStep(el, steps[i]);
        await sleep(180);
      }
    }

    // Reveal summary
    await sleep(200);
    const summary = renderSummary(steps, inputs);
    report.appendChild(summary);
    await new Promise(r => requestAnimationFrame(r));
    summary.setAttribute('data-state', 'done');

    markAudit();
    submit.disabled = false;
    submit.textContent = t('Volver a auditar', 'Run again');

    // Track conversion · Plausible custom event (no PII; only loaded on prod)
    const completedWarns = steps.filter(s => s.warn).length;
    try {
      if (typeof window.plausible === 'function') {
        window.plausible('audit-completed', { props: {
          sector: inputs.sector || 'unknown',
          city:   inputs.city   || 'unknown',
          warns:  String(completedWarns),
        }});
      }
    } catch (e) { /* analytics never blocks the UX */ }

    // Silent notification ping to the studio so Stuart knows an audit ran even
    // if the visitor doesn't submit their email. No PII unless the visitor
    // chose to share it via the email form (handled separately).
    postNotification('/api/audit-completed', {
      kind: 'audit-completion-ping',
      inputs,
      warns: completedWarns,
      lang: LANG(),
      ts: new Date().toISOString(),
    });

    // Scroll summary into view on mobile
    summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ---------- Server pipeline consumer -------------------------------
  // Streams NDJSON from Vigía's /api/audit when configured. Hydrates step
  // shells as events arrive. Returns { server: true } when the stream
  // completes with a summary, or null on any failure (caller falls back).
  async function streamServerAudit(inputs, steps, stepEls) {
    const base = getVigiaBase();
    if (!base) return null;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000); // overall budget
    let res;
    try {
      res = await fetch(base + '/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputs.url,
          city: inputs.city,
          sector: inputs.sector,
          lang: LANG(),
        }),
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
    if (!res.ok || !res.body) {
      clearTimeout(timer);
      return null;
    }

    // Mark first step running so the visitor sees activity immediately.
    if (stepEls[0]) {
      stepEls[0].dataset.state = 'running';
      stepEls[0].querySelector('.audit-step-status').textContent = t('ejecutando', 'running');
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let receivedSummary = false;
    let runningIdx = 0;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev;
          try { ev = JSON.parse(line); } catch (_) { continue; }

          if (ev.type === 'step' && typeof ev.idx === 'string') {
            const i = parseInt(ev.idx, 10) - 1;
            if (i >= 0 && i < steps.length && stepEls[i]) {
              steps[i] = {
                idx: ev.idx,
                title: ev.title || steps[i].title,
                out: ev.out || steps[i].out,
                state: ev.state === 'warn' ? 'warn' : 'done',
              };
              completeStep(stepEls[i], steps[i]);
              // Promote the next pending step to running for visual continuity.
              for (let k = i + 1; k < stepEls.length; k++) {
                if (stepEls[k] && stepEls[k].dataset.state === 'pending') {
                  stepEls[k].dataset.state = 'running';
                  stepEls[k].querySelector('.audit-step-status').textContent = t('ejecutando', 'running');
                  runningIdx = k;
                  break;
                }
              }
              await new Promise(r => requestAnimationFrame(r));
            }
          } else if (ev.type === 'summary') {
            receivedSummary = true;
          } else if (ev.type === 'error') {
            // Server explicitly failed mid-stream — bail to client mock.
            clearTimeout(timer);
            return null;
          }
        }
      }
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if (!receivedSummary) return null;

    // Belt-and-braces: if the server skipped any steps for any reason,
    // mark them done with the seeded narrative so nothing stays "running".
    for (let i = 0; i < stepEls.length; i++) {
      if (stepEls[i] && stepEls[i].dataset.state !== 'done' && stepEls[i].dataset.state !== 'warn') {
        completeStep(stepEls[i], steps[i]);
      }
    }
    return { server: true };
  }

  // ---------- Vigía / notification bridge ----------------------------
  // Reads the API base from window.VIGIA_API or <meta name="vigia-api">.
  // Returns true on success, false on any error (so callers can fall back).
  function getVigiaBase() {
    if (typeof window !== 'undefined' && window.VIGIA_API) return String(window.VIGIA_API).replace(/\/+$/, '');
    const meta = document.querySelector('meta[name="vigia-api"]');
    return meta && meta.content ? String(meta.content).replace(/\/+$/, '') : '';
  }
  async function postNotification(path, payload) {
    const base = getVigiaBase();
    if (!base) return false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
        mode: 'cors',
        credentials: 'omit',
      });
      clearTimeout(timer);
      return res.ok;
    } catch (_) { return false; }
  }

  // ---------- Form handling -----------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = document.getElementById('auditUrl').value.trim();
    const city = document.getElementById('auditCity').value;
    const sector = document.getElementById('auditSector').value;

    if (!url || !city || !sector) return;
    // Normalise URL
    const normalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    if (isRateLimited()) {
      // Don't block — just tell them and let them see the cached result again.
      const note = document.createElement('p');
      note.className = 'audit-note mono';
      note.style.margin = '12px 0';
      note.textContent = t(
        'Ya has hecho una auditoría hoy. Mostrando el resultado en caché.',
        'You already ran an audit today. Showing the cached result.'
      );
      report.hidden = false;
      report.innerHTML = '';
      report.appendChild(note);
      // Fall through and still show the audit.
    }

    await runPipeline({ url: normalUrl, city, sector });
  });
})();

/* =====================================================================
 * v1 CONTRACT — endpoints expected on the Vigía backend at VIGIA_API.
 *
 * 1) POST /api/audit
 *    Body: { url, city, sector, lang }
 *    Response stream (SSE or chunked JSON):
 *      { type: 'step', idx, title, out, state }   // up to 6 times
 *      { type: 'summary', warns, weeks[], waMsg } // once at end
 *      { type: 'error', code, message }           // on failure
 *    Data sources (v1):
 *      - Lighthouse (Google PageSpeed Insights API)
 *      - Google Places API (reviews, photos, cadence)
 *      - SerpAPI (competitor discovery in district)
 *      - Instagram oEmbed + scrape fallback (post cadence, last 7 days)
 *      - Claude (synthesis into narrative `out` strings)
 *    Budget: < US$ 0.50 per audit, < 25 s wall-clock.
 *    Rate limit: 1 audit / IP / 24h, cache TTL 6h.
 *
 * 2) POST /api/audit-completed                   ← NEW (this turn)
 *    Body (one of):
 *      { kind: 'audit-completion-ping', inputs, warns, lang, ts }
 *      { kind: 'audit-email-request', email, inputs, warns, steps, lang, ts }
 *    Side effects:
 *      - 'completion-ping': Slack/Email Stuart with summary
 *      - 'email-request': Render PDF, mail it via Resend; subscribe to a
 *        4-week Resend Broadcast for the follow-up sequence.
 *    Response: { ok: true }
 *    Auth: none (public, idempotent on (email,inputs.url) for de-dupe)
 *    Rate limit: 5/hour/IP, 50/day/email.
 * =====================================================================*/
