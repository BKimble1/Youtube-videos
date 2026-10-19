import {_debug} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/set';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
const {S} = _debug.getStatic();
const rows: any[] = [];
for (const s of S as any[]) {
  const it = s.item; const k: string = it.key ?? '';
  if (!/^(rch_|sch_|cch_|sch2_|pile_.*_c\d+|rslab_|cplate_|sfacade_|pile_.*_s\d+)/.test(k)) continue;
  const m = it.mesh; const sc = typeof it.xf?.scale === 'number' ? it.xf.scale : 1;
  const bottom = m.verts.filter((v: any) => v.y < 0.02 * Math.max(1, sc) + 1e-6 || /^(rslab|cplate|sfacade|pile_.*_s)/.test(k));
  const pts = (/^(rslab|cplate|sfacade|pile_.*_s)/.test(k) ? m.verts : bottom).map((v: any) => (it.xf ? xfPoint(v, it.xf) : v));
  if (!pts.length) continue;
  // lowest quarter of the vertices by height = the contact edge
  const gaps = pts.map((p: any) => p.y - groundH(p.x, p.z)).sort((a: number, b: number) => a - b);
  const q = gaps.slice(0, Math.max(3, Math.floor(gaps.length / 3)));
  rows.push({k, worstContactGap: Math.max(...q), min: gaps[0], r: m.radius * sc});
}
const by: Record<string, any[]> = {};
rows.forEach((r) => { const p = r.k.replace(/\d+/g, '#'); (by[p] ??= []).push(r); });
for (const [p, a] of Object.entries(by)) {
  const w = a.map((r) => r.worstContactGap).sort((x, y) => y - x);
  console.log(p.padEnd(18), 'n', a.length, 'contact-edge gap: worst', w[0].toFixed(2), 'p90', w[Math.floor(w.length * 0.1)].toFixed(2), 'median', w[Math.floor(w.length / 2)].toFixed(2), ' #>0.4:', w.filter((x) => x > 0.4).length, '#>0.8:', w.filter((x) => x > 0.8).length);
}
rows.sort((a, b) => b.worstContactGap - a.worstContactGap).slice(0, 12).forEach((r) => console.log(r.k, r.worstContactGap.toFixed(2), 'min', r.min.toFixed(2), 'r', r.r.toFixed(2)));
