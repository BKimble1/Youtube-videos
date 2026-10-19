import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const wl = /^(rfloor_|rslab_|rch_|sch|cch_|cplate_|sfacade_|pile_|rbeam_|bSup|bCh|bSlab|bRebLump|cWall|d\d_cover|d\d_h\dslab|a1cover|rcol_|deathSlab|b\d+g|b\d+fg|d\d_breaker|d\dblast|veh_|wreck_|craterCar|taxi|bus|gcol|girder|waterMain|van)/;
const by = new Map();
for (const r of d.recs) { if (!wl.test(r.key)) continue; const a = by.get(r.key); if (!a || r.minGap > a.minGap) by.set(r.key, r); }
const rows = [...by.values()].sort((a, b) => b.minGap - a.minGap);
const lim = Number(process.argv[3] ?? 0.0);
rows.filter((r) => r.minGap > lim).forEach((r) => console.log(r.key.padEnd(18), 'minGap', r.minGap.toFixed(2).padStart(6), 'r', r.r.toFixed(2).padStart(5), 'c', [r.cx, r.cy, r.cz].map((x) => x.toFixed(1)).join(','), r.dyn ? 'dyn' : '   ', r.shot));
console.log('count', rows.length);
