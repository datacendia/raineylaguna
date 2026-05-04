/* Rainey Laguna · WCAG 2.1 contrast audit across all 9 moods.
   Computes contrast ratios for every critical text/background pair and
   flags anything below AA thresholds.

   WCAG thresholds:
     AA normal text   4.5 : 1
     AA large text    3.0 : 1   (>= 18pt, or >= 14pt bold)
     AAA normal       7.0 : 1
     AAA large        4.5 : 1
*/

// Palette extracted from the MOODS array in index.html.
// heroInk / heroGold sit on heroInkBg (the middle stop of the sky gradient in the hero).
// ink / gold / muted sit on paper (the rest of the page below the hero).
const MOODS = [
  { name: 'deep night',     heroInk: '#f5f1e8', heroGold: '#e5c57a', heroInkBg: '#0a1428', paper: '#EDE5D2', ink: '#0A0F18', gold: '#E5C57A' },
  { name: 'pre-dawn',       heroInk: '#f5f1e8', heroGold: '#fff2c8', heroInkBg: '#3a2848', paper: '#F4ECDA', ink: '#1F1818', gold: '#D4A468' },
  { name: 'dawn',           heroInk: '#2a1a18', heroGold: '#1a0604', heroInkBg: '#e89048', paper: '#FAF3E6', ink: '#2C1F18', gold: '#C9A961' },
  { name: 'morning',        heroInk: '#1f2e36', heroGold: '#0c2638', heroInkBg: '#aac4d4', paper: '#F5F1E8', ink: '#1F2E36', gold: '#C9A961' },
  { name: 'noon',           heroInk: '#0f1a22', heroGold: '#0a1a26', heroInkBg: '#7aa0b8', paper: '#F5F1E8', ink: '#0F1A22', gold: '#C9A961' },
  { name: 'afternoon',      heroInk: '#1f1812', heroGold: '#7a3a08', heroInkBg: '#c8a070', paper: '#F7EFDE', ink: '#1F1812', gold: '#D4A042' },
  { name: 'sunset',         heroInk: '#fff5ea', heroGold: '#fff2c8', heroInkBg: '#c4404a', paper: '#F2E8D4', ink: '#1F1420', gold: '#E59048' },
  { name: 'dusk',           heroInk: '#f5f1e8', heroGold: '#ffce7a', heroInkBg: '#2a1c50', paper: '#EDE3CE', ink: '#181420', gold: '#E59048' },
  { name: 'night (8–12pm)', heroInk: '#f5f1e8', heroGold: '#e5c57a', heroInkBg: '#121830', paper: '#EDE5D2', ink: '#0A0F18', gold: '#E5C57A' },
];

function hexToRgb(h) {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
}
// WCAG 2.1 relative luminance
function luminance([r,g,b]) {
  const ch = [r,g,b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4);
  });
  return 0.2126*ch[0] + 0.7152*ch[1] + 0.0722*ch[2];
}
function ratio(a, b) {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  const [lo, hi] = la < lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function grade(r, isLarge) {
  const aa  = isLarge ? 3.0 : 4.5;
  const aaa = isLarge ? 4.5 : 7.0;
  if (r >= aaa) return 'AAA';
  if (r >= aa)  return 'AA';
  return 'FAIL';
}

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

const PAIRS = [
  { label: 'hero H1 (large)',              fg: 'heroInk',  bg: 'heroInkBg', large: true  },
  { label: 'hero lede (normal)',           fg: 'heroInk',  bg: 'heroInkBg', large: false },
  { label: 'hero gold em (large)',         fg: 'heroGold', bg: 'heroInkBg', large: true  },
  { label: 'body ink on paper',            fg: 'ink',      bg: 'paper',     large: false },
  { label: 'gold-ink accent on paper',     fg: 'goldInk',  bg: 'paper',     large: false },
  { label: 'decorative gold on paper',     fg: 'gold',     bg: 'paper',     large: true,  decorative: true },
];
// Inject --gold-ink into every mood for testing (constant across moods since paper bg varies only slightly).
for (const m of MOODS) m.goldInk = '#7a5618';

console.log('\nWCAG 2.1 contrast audit across all moods\n' + '='.repeat(78));
let fails = 0, total = 0;

for (const m of MOODS) {
  console.log('\n· ' + m.name);
  for (const p of PAIRS) {
    const r = ratio(m[p.fg], m[p.bg]);
    const g = grade(r, p.large);
    const line = `    ${pad(p.label, 30)}  ${m[p.fg]}  on  ${m[p.bg]}   ${r.toFixed(2).padStart(5)} : 1   ${g}`;
    total++;
    if (g === 'FAIL') {
      if (p.decorative) { console.log('  ⚠ ' + line + '  (decorative · exempt)'); }
      else              { fails++; console.log('  ✗ ' + line); }
    } else              console.log('    ' + line);
  }
}

console.log('\n' + '='.repeat(78));
console.log(`Summary: ${total - fails} / ${total} pairs pass WCAG AA.`);
if (fails) console.log(`⚠  ${fails} pair(s) below AA threshold. Fix or exempt with aria-label/decorative role.`);
else       console.log('✓  All critical text pairs pass AA.');

process.exit(fails ? 1 : 0);
