// V4 caption placement check (from V2's): for every frame, the screen points that must stay clear of captions (hands, the
// wrist shooter's outlet, the jet head, the web pad on the jacket, the nozzle outlet, the fibre tip, the blade and
// its attachment, the cocoon in the hand; in V4 also the trigger hand, the device's port and the nozzle channels), and for each caption the candidate heights that keep its text block
// clear of them for its whole display. Prints the chosen table and writes a JSON report.
// build: source/node_modules/.bin/esbuild tools/v4/cap_check4.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/cc4.cjs && node /tmp/cc4.cjs qa/v4/caption_check.json [table]
import * as fs from 'fs';
import TL from '../../source/src/data/timeline.json';
import {manJoints} from '../../source/src/v4/dc/Man';
import {attachAt, heroAt, heroOutlet, runnerAt, scr, streetCam, D_MID, D_NEAR, SA} from '../../source/src/v4/Street4';
import {deviceGeo, deviceView, DV, portPoint, strandLen} from '../../source/src/v4/Device4';
import {labPoints} from '../../source/src/v4/Lab4';
import {CAP_Y_V4} from '../../source/src/v4/captions4';

type Pt = {x: number; y: number; r: number; what: string};
const pts = (f: number): Pt[] => {
  if (f < SA.end) {
    const cam = streetCam(f);
    const out: Pt[] = [];
    const h = heroAt(f);
    const j = manJoints(h.pose);
    const w = scr(cam, D_NEAR, j.R.W);
    out.push({...w, r: 120 * cam.z, what: 'wrist'});
    out.push({...scr(cam, D_NEAR, heroOutlet(f).outlet), r: 50, what: 'outlet'});
    if (f >= SA.fire - 2) {
      const a = scr(cam, D_MID, attachAt(f));
      out.push({...a, r: f >= SA.hit ? 150 * Math.min(4, cam.z / 2.5) : 60, what: 'web'});
    }
    return out;
  }
  if (f < DV.end) {
    const v = deviceView(f);
    const {j} = deviceGeo(f);
    return [
      {...scr(v.cam, D_NEAR, j.R.W), r: Math.min(130 * v.zn, 640), what: 'hand'},
      {...scr(v.cam, D_NEAR, portPoint(v.win)), r: Math.max(80, 0.4 * v.win.b * v.zn), what: 'port'},
      ...(f >= DV.cut0 ? [{...scr(v.cam, D_NEAR, v.cg.outlet), r: Math.max(80, 0.3 * v.cg.rBarrel * v.zn), what: 'outlet'}, {...scr(v.cam, D_NEAR, v.cg.join), r: Math.max(80, v.cg.rBarrel * v.zn), what: 'barrel'}] : []),
    ];
  }
  return labPoints(f);
};
const caps = TL.captions as {text: string; show: number; hide: number}[];
const lines = (t: string) => (t.length > 21 ? 2 : 1);
const CAND = [1480, 1400, 1320, 380, 470, 560, 1240, 1160, 640, 720, 1080];
const res: unknown[] = [];
const table: [string, number][] = [];
caps.forEach((c, i) => {
  const f0 = Math.round((i === 0 ? 0 : c.show) * 30);
  const f1 = Math.round(c.hide * 30);
  const half = lines(c.text) === 2 ? 92 : 52;
  const hits = (y: number) => {
    const bad: string[] = [];
    for (let f = f0; f < f1; f++) {
      for (const p of pts(f)) {
        const dx = Math.max(0, Math.abs(p.x - 516) - 420);
        const dy = Math.max(0, Math.abs(p.y - y) - half);
        if (Math.hypot(dx, dy) < p.r * 0.5 + 10 && p.x > -60 && p.x < 1140 && p.y > -100 && p.y < 2020) bad.push(`${f}:${p.what}`);
      }
    }
    return bad;
  };
  const cur = CAP_Y_V4[i][1];
  const curBad = hits(cur);
  let pick = cur;
  if (curBad.length) pick = CAND.find((y) => hits(y).length === 0) ?? cur;
  res.push({i, text: c.text, current: cur, currentHits: curBad.slice(0, 6), pick, pickHits: hits(pick).slice(0, 6)});
  table.push([CAP_Y_V4[i][0], pick]);
  if (curBad.length && hits(pick).length) console.log("   per candidate:", CAND.concat([800, 880, 960]).map((y) => `${y}:${hits(y).length}:${hits(y)[0] ?? ""}`).join(" "));
  console.log(i, c.text.padEnd(34), cur, curBad.length ? `HITS ${curBad.length} ${curBad.slice(0, 3).join(' ')}` : 'ok', '->', pick, hits(pick).length ? 'STILL HITS' : '');
});
fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
if (process.argv[3]) console.log(JSON.stringify(table));
void runnerAt; void strandLen;
