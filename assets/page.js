/* Rainey Laguna · shared subpage JS
   Language detection, footer year, and a tiny i18n swap for elements
   that carry data-es / data-en attributes. */

(function () {
  'use strict';

  // -------- Language --------
  const STORAGE_KEY = 'rl-lang';
  function detectLang() {
    const params = new URLSearchParams(location.search);
    if (params.has('lang')) return params.get('lang') === 'en' ? 'en' : 'es';
    if (location.pathname.startsWith('/en/') || location.pathname === '/en') return 'en';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch (_) { /* SSR / privacy mode */ }
    const html = document.documentElement.getAttribute('lang') || 'es';
    return html.startsWith('en') ? 'en' : 'es';
  }

  function applyLang(lang) {
    const html = document.documentElement;
    html.setAttribute('lang', lang === 'en' ? 'en' : 'es-PE');
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}

    document.querySelectorAll('[data-es], [data-en]').forEach((el) => {
      const v = el.getAttribute(lang === 'en' ? 'data-en' : 'data-es');
      if (v != null) {
        // Preserve inline HTML where authors used it
        if (el.dataset.html === 'true') el.innerHTML = v;
        else el.textContent = v;
      }
    });

    // Toggle button states
    document.querySelectorAll('[data-set-lang]').forEach((btn) => {
      const target = btn.getAttribute('data-set-lang');
      btn.setAttribute('aria-pressed', target === lang ? 'true' : 'false');
    });

    // Update <title> and <meta name="description"> if data-title-* / data-desc-* present
    const t = document.querySelector('title');
    if (t) {
      const k = lang === 'en' ? 'data-title-en' : 'data-title-es';
      const v = t.getAttribute(k);
      if (v) t.textContent = v;
    }
    const md = document.querySelector('meta[name="description"]');
    if (md) {
      const k = lang === 'en' ? 'data-desc-en' : 'data-desc-es';
      const v = md.getAttribute(k);
      if (v) md.setAttribute('content', v);
    }
  }

  function initLangToggle() {
    document.querySelectorAll('[data-set-lang]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        applyLang(btn.getAttribute('data-set-lang'));
      });
    });
  }

  // -------- Footer year --------
  function setYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  // -------- Boot --------
  function boot() {
    applyLang(detectLang());
    initLangToggle();
    setYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
