/* Rainey Laguna · English homepage mirror
   Usage: node scripts/build-en.mjs
   Reads:  index.html  (Spanish, canonical)
   Writes: en/index.html  (English mirror — same markup, English head meta)

   The body content is bilingual at source (every visible node carries
   data-es and data-en attributes). The runtime JS auto-detects /en/ in the
   URL pathname and renders English. This script only patches the <head>
   meta and the <html lang> attribute so search engines and social cards see
   English strings for the /en/ URL.

   Safe to run idempotently. No side-effects outside en/index.html.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');

// --- English copy for /en/ head -----------------------------------------
const EN = {
  htmlLang:    'en-US',
  title:       'Rainey Laguna — Web studio in Lima · Competitive intelligence with Vigía',
  description: 'Web and intelligence studio in Lima for independent local businesses — hospitality, fitness, education, wellness and boutique retail. Considered bilingual websites, solid brand systems, and weekly competitive intelligence by WhatsApp with Vigía. From Glasgow, in Lima — from S/ 1,500.',
  ogDescription:    'Considered websites for independent local businesses in Lima — hospitality, fitness, education, wellness, boutique retail. Weekly competitive intelligence by WhatsApp with Vigía.',
  twitterTitle:     'Rainey Laguna — Web studio in Lima · Vigía',
  twitterDescription: 'Considered websites for independent local businesses in Lima. Weekly competitive intelligence by WhatsApp with Vigía.',
  imageAlt:    'Rainey Laguna — web studio in Lima, on a sky-in-transition background',
  keywords:    'web design Lima, web studio Lima, restaurant websites Lima, gym websites Lima, school websites Lima, clinic websites Lima, competitive intelligence, Vigía, raineylaguna, Stuart Rainey, independent local businesses, websites San Isidro, Miraflores, San Borja, Surco, Barranco',
  locale:      'en_US',
  localeAlt:   'es_PE',
};

// --- Source --------------------------------------------------------------
const srcPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(srcPath, 'utf8');

// --- Patches -------------------------------------------------------------
// 1. <html lang="es-PE">  →  <html lang="en-US">
html = html.replace(/<html\s+lang="es-PE">/i, `<html lang="${EN.htmlLang}">`);

// 2. <title>…</title>
html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${EN.title}</title>`);

// 3. meta description + keywords
html = html.replace(
  /<meta\s+name="description"\s+content="[^"]*">/i,
  `<meta name="description" content="${EN.description}">`
);
html = html.replace(
  /<meta\s+name="keywords"\s+content="[^"]*">/i,
  `<meta name="keywords" content="${EN.keywords}">`
);

// 4. canonical  →  /en/
html = html.replace(
  /<link\s+rel="canonical"\s+href="https:\/\/raineylaguna\.com\/">/i,
  `<link rel="canonical" href="https://raineylaguna.com/en/">`
);

// 5. hreflang alternates — swap so x-default and es-PE point to /, en points to /en/
// Remove existing hreflang links; rewrite a clean set.
html = html.replace(
  /(\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*">)+/i,
  `
<link rel="alternate" hreflang="es-PE" href="https://raineylaguna.com/">
<link rel="alternate" hreflang="es" href="https://raineylaguna.com/">
<link rel="alternate" hreflang="en" href="https://raineylaguna.com/en/">
<link rel="alternate" hreflang="x-default" href="https://raineylaguna.com/">`
);

// 6. Open Graph locale + description + url + title
html = html.replace(
  /<meta\s+property="og:locale"\s+content="es_PE">/i,
  `<meta property="og:locale" content="${EN.locale}">`
);
html = html.replace(
  /<meta\s+property="og:locale:alternate"\s+content="en_US">/i,
  `<meta property="og:locale:alternate" content="${EN.localeAlt}">`
);
html = html.replace(
  /<meta\s+property="og:title"\s+content="[^"]*">/i,
  `<meta property="og:title" content="${EN.title}">`
);
html = html.replace(
  /<meta\s+property="og:description"\s+content="[^"]*">/i,
  `<meta property="og:description" content="${EN.ogDescription}">`
);
html = html.replace(
  /<meta\s+property="og:url"\s+content="https:\/\/raineylaguna\.com\/">/i,
  `<meta property="og:url" content="https://raineylaguna.com/en/">`
);
html = html.replace(
  /<meta\s+property="og:image:alt"\s+content="[^"]*">/i,
  `<meta property="og:image:alt" content="${EN.imageAlt}">`
);

// 7a. JSON-LD WebSite description (inline, inside <script type="application/ld+json">)
html = html.replace(
  /"description":\s*"Estudio web en Lima · Inteligencia competitiva con Vigía"/,
  `"description": "Web studio in Lima · Competitive intelligence with Vigía"`
);

// 7. Twitter card
html = html.replace(
  /<meta\s+name="twitter:title"\s+content="[^"]*">/i,
  `<meta name="twitter:title" content="${EN.twitterTitle}">`
);
html = html.replace(
  /<meta\s+name="twitter:description"\s+content="[^"]*">/i,
  `<meta name="twitter:description" content="${EN.twitterDescription}">`
);
html = html.replace(
  /<meta\s+name="twitter:image:alt"\s+content="[^"]*">/i,
  `<meta name="twitter:image:alt" content="Rainey Laguna — web studio in Lima">`
);

// --- Write ---------------------------------------------------------------
const outDir = path.join(ROOT, 'en');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`  + en/index.html  (${html.length} bytes)`);
