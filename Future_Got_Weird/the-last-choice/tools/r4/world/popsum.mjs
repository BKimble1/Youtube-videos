import fs from 'node:fs';
const ev = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const layer = process.argv[3] ?? 'set';
const rows = ev.filter((e) => e.layer === layer && (layer === 'set' || e.what !== 'bias'));
const by = new Map();
rows.forEach((e) => { const a = by.get(e.key) ?? []; a.push(e); by.set(e.key, a); });
const out = [...by].map(([k, a]) => ({k, n: a.length, seq: a.map((e) => `${e.what}@${e.f}`).join(' ')}));
out.sort((a, b) => Number(a.seq.match(/@(\d+)/)[1]) - Number(b.seq.match(/@(\d+)/)[1]));
out.forEach((r) => console.log(r.k.padEnd(18), r.seq.slice(0, 140)));
