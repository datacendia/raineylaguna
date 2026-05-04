/* Rainey Laguna · Plausible analytics loader
   Injected only on the production hostname — preview deploys and
   local development never send events to Plausible. */
(function () {
  if (location.hostname === 'raineylaguna.com' || location.hostname === 'www.raineylaguna.com') {
    var s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', 'raineylaguna.com');
    s.src = 'https://plausible.io/js/script.outbound-links.js';
    document.head.appendChild(s);
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  }
})();
