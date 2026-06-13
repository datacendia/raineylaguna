/* Rainey Laguna · page wrapper
   Usage: node scripts/wrap-page.mjs <slug>
   Reads:  scripts/bodies/<slug>.html  (HEAD comment block + body content)
   Writes: <slug>/index.html

   Each body file must start with a JSON head block:
     <!--HEAD
     { "titleEs": "...", "titleEn": "...", "descEs": "...", "descEn": "...",
       "slug": "...", "ogType": "website", "extraJsonLd": "...optional inline..." }
     HEAD-->
   followed by the <main>...</main> markup.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const SITE       = 'https://raineylaguna.com';

const slugArg = process.argv[2];
if (!slugArg) { console.error('Usage: node scripts/wrap-page.mjs <slug>'); process.exit(1); }

const slugs = slugArg === 'all'
  ? fs.readdirSync(path.join(ROOT, 'scripts', 'bodies')).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''))
  : [slugArg];

const header = fs.readFileSync(path.join(ROOT, 'scripts', 'partials', 'header.html'), 'utf8');
const footer = fs.readFileSync(path.join(ROOT, 'scripts', 'partials', 'footer.html'), 'utf8');

function esc(s) {
  return String(s ?? '').replace(/&(?!(amp|quot|lt|gt|#);)/g, '&amp;')
    .replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

for (const slug of slugs) {
  const bodyPath = path.join(ROOT, 'scripts', 'bodies', `${slug}.html`);
  const raw = fs.readFileSync(bodyPath, 'utf8');
  const m = raw.match(/<!--HEAD([\s\S]*?)HEAD-->/);
  if (!m) { console.error(`No HEAD block in ${slug}`); continue; }
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m.index + m[0].length).trim();

  const canonical = meta.canonical || `${SITE}/${meta.slug || slug}/`;
  const ogType = meta.ogType || 'website';
  const extraJsonLd = meta.extraJsonLd || '';

  const html = `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5">
<title data-title-es="${esc(meta.titleEs)}" data-title-en="${esc(meta.titleEn)}">${esc(meta.titleEs)}</title>
<meta name="description" content="${esc(meta.descEs)}" data-desc-es="${esc(meta.descEs)}" data-desc-en="${esc(meta.descEn)}">
<meta name="theme-color" content="#F5F1E8">
<meta name="author" content="Stuart John Andrew Rainey">
<meta name="robots" content="${meta.robots || 'index,follow'}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="es-PE" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="es_PE">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:title" content="${esc(meta.ogTitle || meta.titleEs)}">
<meta property="og:description" content="${esc(meta.descEs)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Rainey Laguna">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:secure_url" content="${SITE}/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Rainey Laguna — estudio web en Lima, sobre fondo de cielo en transición">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.ogTitle || meta.titleEs)}">
<meta name="twitter:description" content="${esc(meta.descEs)}">
<meta name="twitter:image" content="${SITE}/og-image.png">
<meta name="twitter:image:alt" content="Rainey Laguna — estudio web en Lima">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/assets/page.css">

<!-- Analytics · Plausible (only on production hostname). -->
<script src="/assets/analytics.js" defer></script>
<script src="/assets/geo.js" defer></script>
${extraJsonLd}
</head>
<body>
${header}

${body}

${footer}`;

  const outDir = path.join(ROOT, meta.slug || slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log('  +', `${meta.slug || slug}/index.html  (${html.length} bytes)`);
}
