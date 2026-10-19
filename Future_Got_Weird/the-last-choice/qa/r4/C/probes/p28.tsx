import {SEGS_C, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
const T0 = parseFloat(process.argv[2] ?? '52.9'), T1 = parseFloat(process.argv[3] ?? '60');
for (const r of Object.keys(SEGS_C)) {
  const seg = SEGS_C[r][SEGS_C[r].length - 1] as any;
  if (seg.kind !== 'stand') continue;
  const land: string[] = [];
  for (const [side, k] of [['L', seg.feet.L], ['R', seg.feet.R]] as any) for (let i = 1; i < k.length; i++) { const a = k[i - 1], b = k[i]; if (Math.hypot(b[1] - a[1], b[2] - a[2]) > 1e-4 && b[0] >= T0 && b[0] <= T1) land.push(b[0].toFixed(2) + side); }
  land.sort();
  console.log(r, land.join(' '));
}
