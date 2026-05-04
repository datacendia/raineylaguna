import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('en/index.html', 'utf8');

// Spot-check the critical English head-meta patches
const checks = [
  { label: '<html lang="en-US">',       re: /<html\s+lang="en-US">/ },
  { label: 'English <title>',           re: /<title>Rainey Laguna — Web studio in Lima · Competitive intelligence with Vigía<\/title>/ },
  { label: 'canonical → /en/',          re: /<link\s+rel="canonical"\s+href="https:\/\/raineylaguna\.com\/en\/">/ },
  { label: 'hreflang en → /en/',        re: /hreflang="en"\s+href="https:\/\/raineylaguna\.com\/en\/">/ },
  { label: 'hreflang es-PE → /',        re: /hreflang="es-PE"\s+href="https:\/\/raineylaguna\.com\/">/ },
  { label: 'hreflang x-default → /',    re: /hreflang="x-default"\s+href="https:\/\/raineylaguna\.com\/">/ },
  { label: 'og:locale = en_US',         re: /og:locale"\s+content="en_US"/ },
  { label: 'og:locale:alternate = es_PE', re: /og:locale:alternate"\s+content="es_PE"/ },
  { label: 'og:url → /en/',             re: /og:url"\s+content="https:\/\/raineylaguna\.com\/en\/"/ },
  { label: 'English meta description',  re: /name="description"\s+content="Web and intelligence studio in Lima/ },
  { label: 'no leftover Spanish title', re: /Estudio web en Lima/, invert: true },
];

let fail = 0;
for (const c of checks) {
  const hit = c.re.test(html);
  const ok = c.invert ? !hit : hit;
  if (ok) console.log(`  OK   ${c.label}`);
  else { console.log(`  FAIL ${c.label}`); fail++; }
}

// JSON-LD parse
const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let i = 0;
for (const m of html.matchAll(ldRe)) {
  i++;
  try { JSON.parse(m[1]); console.log(`  OK   jsonld block ${i}`); }
  catch (e) { console.log(`  FAIL jsonld block ${i}: ${e.message}`); fail++; }
}

// Inline JS parse
const jsRe = /<script(?![^>]*type="application\/ld\+json")(?:[^>]*)>([\s\S]*?)<\/script>/g;
let j = 0;
for (const m of html.matchAll(jsRe)) {
  j++;
  try { new vm.Script(m[1], { filename: `inline-${j}.js` }); console.log(`  OK   js block ${j} (${m[1].length} chars)`); }
  catch (e) { console.log(`  FAIL js block ${j}: ${e.message}`); fail++; }
}

process.exit(fail ? 1 : 0);
