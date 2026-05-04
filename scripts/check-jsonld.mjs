import fs from 'node:fs';
const html = fs.readFileSync('index.html', 'utf8');
const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let i = 0, fail = 0;
for (const m of html.matchAll(re)) {
  i++;
  try { JSON.parse(m[1]); console.log(`block ${i}: OK`); }
  catch (e) { fail++; console.log(`block ${i}: FAIL — ${e.message}`); }
}
process.exit(fail ? 1 : 0);
