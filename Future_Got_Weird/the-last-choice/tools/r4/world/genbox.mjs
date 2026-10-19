import fs from 'node:fs';
const shots = JSON.parse(fs.readFileSync('cams.json', 'utf8'));
// shots that had LOD switches (from lodev) except A1 and F1/E2
const want = new Set(process.argv.slice(2));
const rows = [];
for (const s of shots) {
  if (!want.has(s.id)) continue;
  let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  for (const c of s.cams) { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); z0 = Math.min(z0, c.z); z1 = Math.max(z1, c.z); }
  const m = 4;
  const r = (v) => Math.round(v * 10) / 10; const rt = (v) => Math.round(v * 10000) / 10000;
  rows.push(`  ['${s.id}', ${rt(s.start)}, ${rt(s.end)}, ${r(x0 - m)}, ${r(y0 - m)}, ${r(z0 - m)}, ${r(x1 + m)}, ${r(y1 + m)}, ${r(z1 + m)}],`);
}
console.log(rows.join('\n'));
