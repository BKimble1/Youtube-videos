// V2 probe: prints positions from the shot functions (no rendering), for staging.
import {runnerAt, attachAt, streetCam, heroOutlet, scr, D_MID, D_NEAR} from '../../source/src/v2/Street2';
const fs = process.argv.slice(2).map(Number);
for (const f of fs.length ? fs : [-20, 0, 5, 10, 13, 16, 19, 22, 30, 38, 45, 55]) {
  const r = runnerAt(f), a = attachAt(f), c = streetCam(f), o = heroOutlet(f).outlet;
  const as = scr(c, D_MID, a), os = scr(c, D_NEAR, o);
  console.log(f, 'hip', r.x.toFixed(0), r.y.toFixed(0), 'att', a.x.toFixed(0), a.y.toFixed(0), 'cam', c.x.toFixed(0), c.y.toFixed(0), c.z.toFixed(2), 'attS', as.x.toFixed(0), as.y.toFixed(0), 'outS', os.x.toFixed(0), os.y.toFixed(0));
}
