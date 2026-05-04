import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');

// 1. JSON-LD blocks
const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let i = 0, fail = 0;
for (const m of html.matchAll(ldRe)) {
  i++;
  try { JSON.parse(m[1]); console.log(`jsonld block ${i}: OK`); }
  catch (e) { fail++; console.log(`jsonld block ${i}: FAIL — ${e.message}`); }
}

// 2. Inline JS blocks — parse-check only (no exec; DOM APIs not available)
const jsRe = /<script(?![^>]*type="application\/ld\+json")(?:[^>]*)>([\s\S]*?)<\/script>/g;
let j = 0;
for (const m of html.matchAll(jsRe)) {
  j++;
  try {
    new vm.Script(m[1], { filename: `inline-script-${j}.js` });
    console.log(`js block ${j}: OK (${m[1].length} chars)`);
  } catch (e) {
    fail++;
    console.log(`js block ${j}: FAIL — ${e.message}`);
  }
}

process.exit(fail ? 1 : 0);
