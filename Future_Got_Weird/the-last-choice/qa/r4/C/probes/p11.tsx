import {crewC, endOf, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {M} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/timing';
const flat = (o: any, p = '', out: Record<string, number> = {}) => {
  if (o === null || o === undefined) return out;
  if (typeof o === 'number') { out[p] = o; return out; }
  if (typeof o === 'object' && !Array.isArray(o)) for (const k of Object.keys(o)) { if (typeof o[k] === 'function') continue; if (k === 'holdR' || k === 'holdL' || k === 'extra') continue; flat(o[k], p + '.' + k, out); }
  return out;
};
const T = M.CHARGE;
const c = crewC(T - 1e-4);
for (const r of ROLES_C) {
  const a = c[r].spec, b = endOf(r);
  const fa = flat({pos: a.pos, heading: a.heading, pose: a.pose, world: a.world}), fb = flat({pos: b.pos, heading: b.heading, pose: b.pose, world: b.world});
  let worst = 0, wk = '';
  const keys = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  const diffs: string[] = [];
  for (const k of keys) { const d = Math.abs((fa[k] ?? NaN) - (fb[k] ?? NaN)); if (isNaN(d)) { diffs.push(k + ' missing ' + (k in fa ? 'D1' : 'C')); continue; } if (d > worst) { worst = d; wk = k; } if (d > 1e-3) diffs.push(k + ' ' + d.toFixed(3)); }
  console.log(r, 'pos diff', Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y, a.pos.z - b.pos.z).toFixed(4), 'worst', worst.toFixed(4), wk, diffs.slice(0, 6).join(' | '));
}
