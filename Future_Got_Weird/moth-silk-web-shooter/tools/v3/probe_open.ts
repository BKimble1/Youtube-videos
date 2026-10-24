// V3 probe: the wrist shooter's outlet on screen in the first frames (the loop's target for the lab's last frame).
import {heroOutlet, scr, streetCam, D_NEAR, zOf} from '../../source/src/v3/Street3';
for (const f of [0, 1, 2, 4, 8]) {
  const g = heroOutlet(f), c = streetCam(f), o = scr(c, D_NEAR, g.outlet);
  console.log(f, 'O', o.x.toFixed(1), o.y.toFixed(1), 'dir', g.dir.x.toFixed(4), g.dir.y.toFixed(4), 'ang', (Math.atan2(g.dir.y, g.dir.x) * 180 / Math.PI).toFixed(1), 'zNear', zOf(c, D_NEAR).toFixed(3));
}
