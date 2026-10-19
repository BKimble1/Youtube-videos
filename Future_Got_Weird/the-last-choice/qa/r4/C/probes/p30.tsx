import {directorC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {dirB} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/director';
import {M} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/timing';
const flat = (o: any, p = '', out: Record<string, number> = {}) => { if (o == null) return out; if (typeof o === 'number') { out[p] = o; return out; } if (typeof o === 'object' && !Array.isArray(o)) for (const k of Object.keys(o)) { if (typeof o[k] === 'function' || k === 'holdR' || k === 'holdL' || k === 'extra') continue; flat(o[k], p + '.' + k, out); } return out; };
const T = M.BASS_OUT;
const c = directorC(T).spec, b = dirB(T - 1e-4);
const fa = flat({pos: c.pos, heading: c.heading, pose: c.pose, world: c.world}), fb = flat({pos: b.pos, heading: b.heading, pose: b.pose, world: b.world});
let worst = 0, wk = ''; const diffs: string[] = [];
for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) { const d = Math.abs((fa[k] ?? NaN) - (fb[k] ?? NaN)); if (isNaN(d)) { diffs.push(k + ' missing'); continue; } if (d > worst) { worst = d; wk = k; } if (d > 1e-3) diffs.push(k + ' ' + d.toFixed(3)); }
console.log('B end vs C1 start (T=', T, '): pos diff', Math.hypot(c.pos.x - b.pos.x, c.pos.y - b.pos.y, c.pos.z - b.pos.z).toFixed(4), 'worst numeric diff', worst.toFixed(4), wk, diffs.slice(0, 8).join(' | '));
