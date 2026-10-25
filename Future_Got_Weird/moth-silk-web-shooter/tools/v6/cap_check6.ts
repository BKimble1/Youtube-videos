// V6 caption placement check (from V4's): for every frame, the screen points that must stay clear of captions (the
// wrist and the wrist shooter's outlet, the web on the jacket; in the lab the hands, the nozzle outlet, the fibre's
// end, the blade, the cocoon), and for each caption the candidate heights that keep its text block clear of them for
// its whole display. The material close-up (Macro6) is texture across the frame and has no points. The street plays
// at film frames 0-MC.start and again from LT6.toDevice (street frame f - 952). Prints the chosen table and writes
// a JSON report.
// build: source/node_modules/.bin/esbuild tools/v6/cap_check5.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/cc6.cjs && node /tmp/cc6.cjs qa/v6/caption_check.json [table]
import * as fs from 'fs';
import TL from '../../source/src/data/timeline.json';
import {manJoints} from '../../source/src/v6/dc/Man';
import {attachAt, heroAt, heroOutlet, scr, streetCam, D_MID, D_NEAR, SA} from '../../source/src/v6/Street6';
import {MC} from '../../source/src/v6/Macro6';
import {LT6} from '../../source/src/v6/labWorld6';
import {labPoints} from '../../source/src/v6/Lab6';
import {CAP_Y_V6} from '../../source/src/v6/captions6';

type Pt = {x: number; y: number; r: number; what: string};
const streetPts = (f: number): Pt[] => {
  const cam = streetCam(f);
  const out: Pt[] = [];
  const h = heroAt(f);
  const j = manJoints(h.pose);
  out.push({...scr(cam, D_NEAR, j.R.W), r: Math.min(120 * cam.z, 640), what: 'wrist'});
  out.push({...scr(cam, D_NEAR, heroOutlet(f).outlet), r: 50, what: 'outlet'});
  if (f >= SA.fire - 2) {
    const a = scr(cam, D_MID, attachAt(f));
    out.push({...a, r: f >= SA.hit ? 150 * Math.min(4, cam.z / 2.5) : 60, what: 'web'});
  }
  return out;
};
const pts = (f: number): Pt[] => {
  if (f < MC.start) return streetPts(f);
  if (f < MC.end) return [];
  if (f < LT6.toDevice) return labPoints(f);
  return streetPts(f - 952);
};
const caps = TL.captions as {text: string; show: number; hide: number}[];
const lines = (t: string) => (t.length > 21 ? 2 : 1);
const CAND = [1480, 1400, 1320, 380, 470, 560, 1240, 1160, 640, 720, 1080, 800, 880, 960, 1000, 1040, 1120, 1200, 300, 420, 520, 600, 680];
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
  const cur = CAP_Y_V6[i][1];
  const curBad = hits(cur);
  let pick = cur;
  if (curBad.length) pick = CAND.find((y) => hits(y).length === 0) ?? cur;
  res.push({i, text: c.text, current: cur, currentHits: curBad.slice(0, 6), pick, pickHits: hits(pick).slice(0, 6)});
  table.push([CAP_Y_V6[i][0], pick]);
  if (curBad.length && hits(pick).length) console.log('   per candidate:', CAND.concat([800, 880, 960]).map((y) => `${y}:${hits(y).length}:${hits(y)[0] ?? ''}`).join(' '));
  console.log(i, c.text.padEnd(34), cur, curBad.length ? `HITS ${curBad.length} ${curBad.slice(0, 3).join(' ')}` : 'ok', '->', pick, hits(pick).length ? 'STILL HITS' : '');
});
fs.mkdirSync(require('path').dirname(process.argv[2]), {recursive: true});
fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
if (process.argv[3]) console.log(JSON.stringify(table));
