import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const f2 = (n) => n.toFixed(2);
// group by key across shots (same physical piece in several shots)
const byKey = new Map();
for (const r of d.recs) {
  if (r.r > 8) continue;
  const k = r.key;
  const a = byKey.get(k) ?? [];
  a.push(r); byKey.set(k, a);
}
const rows = [];
for (const [k, a] of byKey) {
  const worst = a.reduce((m, r) => (r.minGap > m.minGap ? r : m), a[0]);
  rows.push({key: k, shots: [...new Set(a.map((r) => r.shot))].slice(0, 6).join(','), nshots: new Set(a.map((r) => r.shot)).size, minGap: worst.minGap, maxSink: Math.max(...a.map((r) => r.maxSink)), r: worst.r, at: [worst.cx, worst.cy, worst.cz].map(f2).join(','), dyn: worst.dyn});
}
const minGap = Number(process.argv[3] ?? 0.1);
console.log('--- FLOATING (lowest vertex above terrain by >', minGap, 'm) ---');
rows.filter((r) => r.minGap > minGap && r.r > 0.25).sort((x, y) => y.minGap - x.minGap).slice(0, 80).forEach((r) => console.log(`${r.key.padEnd(22)} gap ${f2(r.minGap).padStart(6)} r ${f2(r.r)} at ${r.at} dyn=${r.dyn} shots(${r.nshots}) ${r.shots}`));
