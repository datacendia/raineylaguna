/* Rainey Laguna · geo adaptation (country-level)
   ---------------------------------------------------------------------------
   Peru visitors see the Lima-specific site (the default — no change).
   Everyone else gets the `geo-global` class on <html>, which:
     - hides the Lima-only services  ([data-geo-lima] -> Garua, Espejo)
     - reveals the worldwide note     (.geo-note)

   Detection is client-side with a graceful fallback to Peru, so the core
   audience and any failed/blocked/disabled lookup keep the current site
   verbatim. Result is cached per session to avoid a request on every page.

   Production note: replace the ipapi.co lookup with a Netlify Edge Function
   reading context.geo.country.code — no third-party request, no rate limit,
   privacy-friendly — and toggle the same `geo-global` class at the edge.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var KEY = 'rl-geo-cc';
  var root = document.documentElement;

  // Rules the geo-global class switches on. Injected so the markup needs no
  // companion stylesheet edit and degrades safely when this script doesn't run.
  var st = document.createElement('style');
  st.textContent =
    'html.geo-global [data-geo-lima]{display:none!important}' +
    'html.geo-global .geo-note{display:block!important}';
  (document.head || root).appendChild(st);

  function apply(cc) {
    var isPeru = !cc || cc === 'PE';
    root.classList.toggle('geo-global', !isPeru);
  }

  // Cached for this session?
  var cached = null;
  try { cached = sessionStorage.getItem(KEY); } catch (e) {}
  if (cached) { apply(cached); return; }

  // Assume Peru first (zero flash for the core audience), then refine.
  apply('PE');
  if (!('fetch' in window)) return;

  var ctrl = ('AbortController' in window) ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) { try { ctrl.abort(); } catch (e) {} } }, 2500);

  fetch('https://ipapi.co/country/', ctrl ? { signal: ctrl.signal } : undefined)
    .then(function (r) { return r.ok ? r.text() : 'PE'; })
    .then(function (cc) {
      clearTimeout(timer);
      cc = (cc || 'PE').trim().slice(0, 2).toUpperCase();
      if (!/^[A-Z]{2}$/.test(cc)) cc = 'PE';
      try { sessionStorage.setItem(KEY, cc); } catch (e) {}
      apply(cc);
    })
    .catch(function () { clearTimeout(timer); /* keep the Peru default */ });
})();
