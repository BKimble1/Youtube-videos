import {crewC, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {GC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/ground';
const T0 = parseFloat(process.argv[2] ?? '36'), T1 = parseFloat(process.argv[3] ?? '59.95');
const prev: any = {}; const rows: Record<string, string[]> = {};
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const c = crewC(T);
  for (const r of ROLES_C) for (const side of ['L', 'R']) {
    const b = c[r].body; const f = side === 'L' ? b.footL : b.footR; const key = r + side;
    const up = f.y - GC(f.x, f.z);
    const p = prev[key];
    if (p) {
      const sp = Math.hypot(f.x - p.x, f.z - p.z) * 30;
      // sliding: on the ground (both frames) and moving horizontally
      if (up < 0.02 && p.up < 0.02 && sp > 0.25) (rows[r] ??= []).push(T.toFixed(2) + side + ':' + sp.toFixed(2));
      // sinking: below the ground
      if (up < -0.03) (rows[r] ??= []).push(T.toFixed(2) + side + ':SINK' + up.toFixed(2));
    }
    prev[key] = {x: f.x, z: f.z, up};
  }
}
for (const r of ROLES_C) console.log(r, (rows[r] ?? []).length, (rows[r] ?? []).slice(0, 36).join(' '));
