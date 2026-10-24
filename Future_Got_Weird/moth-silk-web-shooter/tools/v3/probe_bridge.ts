// V3 probe: the bridge's cartridge window on screen (port, axis, half-width), for matching the lab's syringe to it.
import {deviceView, portPoint, Z_FILL} from '../../source/src/v3/Device3';
import {scr, D_NEAR} from '../../source/src/v3/Street3';
const fs = process.argv.slice(2).map(Number);
for (const f of fs) {
  const v = deviceView(f);
  const p = scr(v.cam, D_NEAR, portPoint(v.win));
  const c = scr(v.cam, D_NEAR, v.win.c);
  const sc = v.zn; // screen px per lead-layer world px
  console.log(f, 'zn', v.zn.toFixed(2), 'Zfill', Z_FILL, 'port', p.x.toFixed(1), p.y.toFixed(1), 'winC', c.x.toFixed(0), c.y.toFixed(0), 'u', v.win.u.x.toFixed(4), v.win.u.y.toFixed(4), 'b_scr', (v.win.b * sc).toFixed(0), 'a_scr', (v.win.a * sc).toFixed(0), 'r_scr', (v.win.r * sc).toFixed(0));
}
