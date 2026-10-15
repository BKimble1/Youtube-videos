// V4 caption-collision check (caption style and timing are locked; the shots are framed around the caption lane).
// For every captioned frame it takes the caption's fade alpha and its on-screen text boxes (lib/captions.ts windows,
// shots/Overlay.tsx geometry: Fredoka 700 at 70 px, lane centre (495, 1450), 82 px lines, the same two-line wrap, the
// 9 px stroke), and the screen shapes of what captions must never sit on:
//   - glass: the band's glass (digits) while its face is turned to the camera (Wrist3D's case frame, art/Device.tsx)
//   - eyeN / eyeF: both eyes (art/Head.tsx eye ellipses) while the head is not under the section backdrop
//   - heart: the heart's silhouette while the chest window shows it (art/Heart4.tsx heartOutline, art/Cutaway.tsx)
//   - hero: the hero sensor (bead and ring) from its merge into the flow until the arm section is half closed
//   - port: the port / contact point while the case is turned to its underside (sensor shot and treatment)
//   - slug: the treatment slug in the section shots (reservoir -> channel -> lumen, up to the 987 match cut)
//   - link: the drone's data-link ring round the glass while it is drawn (its alpha > ALPHA)
// in the shot each frame actually draws (Film.tsx shotNode; Aftermath3 in loop time; the trunk wipe shows the arrival
// only behind the trunk's trailing edge). A collision is any shape within MARGIN px of a caption line box while the
// caption's alpha exceeds ALPHA. Advisory only (reported, never a failure): his shoes in the opening (white text on the
// white shoes) and the device case body in the treatment section (not its port, slug or digits).
// Writes ../qa/v4/CAPTION_CHECK.json. Usage: npx tsx scripts/check_captions4.ts
//   [--dump f0-f1]  also print every subject's screen gap (px) for those frames
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chunkWindows} from '../src/lib/captions';
import {B, FPS, TOTAL} from '../src/lib/timeline3';
import {B4} from '../src/lib/beats4';
import {revealAt} from '../src/lib/reveal4';
import {add, clamp, inv, lerp, mul, rot, smooth, sub, V} from '../src/lib/math';
import {Cam} from '../src/lib/camera';
import {armFrame, armPt, armR, DEV_GEO} from '../src/art/Device';
import {manJoints, ManPose} from '../src/art/Man';
import {chestToWorld, CHEST4} from '../src/art/Cutaway';
import {heartOutline} from '../src/art/Heart4';
import {TREAT_SLUG} from '../src/art/Interior';
import {heroWorld, journeyCam3, journeyDevice, LOCAL_PER_WORLD, manAt as jMan, PORT_W} from '../src/shots/Journey3';
import {arriveDrone3, camAt, dataLink, loopF, manAt as aMan, slugWorld, treatState} from '../src/shots/Aftermath3';
import {WIPE} from '../src/shots/Dispatch';

const here = path.dirname(fileURLToPath(import.meta.url));
const MARGIN = 24;
const ALPHA = 0.2;

// ---------------------------------------------------------------- the caption boxes (shots/Overlay.tsx)
const CAP = {size: 70, line: 82, maxW: 780, cx: 495, cy: 1450};
/** Fredoka Variable at weight 700, 70 px: per-character advances measured in Chromium (canvas measureText). Summing
 *  them ignores kerning, which only overstates a line's width (by at most 16 px in these captions), so the boxes are
 *  slightly conservative. Ascent of the caps 49 px, descent 16 px; the stroke adds 4.5 px all round. */
const ADV: Record<string, number> = {' ': 16.45, ',': 15.61, '-': 28.21, '.': 15.4, ':': 15.47, '?': 33.32, A: 49.77, B: 42.63, E: 42.21, G: 50.33, H: 45.5, I: 16.73, T: 44.8, U: 47.25, W: 66.29, a: 38.99, b: 38.78, c: 35.21, d: 38.78, e: 37.45, f: 29.33, g: 38.22, h: 39.41, i: 17.57, j: 16.38, k: 35.84, l: 21.77, m: 55.37, n: 39.62, o: 39.06, p: 37.87, r: 30.24, s: 31.99, t: 30.03, u: 39.76, v: 40.39, w: 51.59, x: 37.66, y: 40.32};
const measure = (t: string) => t.split('').reduce((a, ch) => a + (ADV[ch] ?? CAP.size * 0.56), 0);
const wrap = (words: string[]): string[][] => {
  if (measure(words.join(' ')) <= CAP.maxW || words.length < 2) return [words];
  let best: string[][] = [words];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const w = Math.max(measure(words.slice(0, i).join(' ')), measure(words.slice(i).join(' ')));
    if (w < bestW) {
      bestW = w;
      best = [words.slice(0, i), words.slice(i)];
    }
  }
  return best;
};
type Box = {x0: number; y0: number; x1: number; y1: number};
const WINDOWS = chunkWindows();
const captionAt = (f: number): {text: string; a: number; boxes: Box[]} | null => {
  const t = f / FPS;
  const c = WINDOWS.find((w) => t >= w.start && t < w.end);
  if (!c) return null;
  const a = Math.min(clamp((t - c.start) / 0.08), clamp((c.end - t) / 0.08));
  const lines = wrap(c.words);
  const top = CAP.cy - (lines.length * CAP.line) / 2;
  const boxes = lines.map((l, i) => {
    const w = measure(l.join(' '));
    const base = top + CAP.line * (i + 0.5) + CAP.size * 0.36;
    return {x0: CAP.cx - w / 2 - 4.5, x1: CAP.cx + w / 2 + 4.5, y0: base - 49 - 4.5, y1: base + 16 + 4.5};
  });
  return {text: c.text, a, boxes};
};

// ---------------------------------------------------------------- geometry
const screenOf = (c: Cam, p: V): V => add({x: 540, y: 960}, mul(rot(sub(p, c), c.roll ?? 0), c.z));
const circle = (c: V, r: number, n = 20): V[] => Array.from({length: n}, (_, i) => ({x: c.x + r * Math.cos((2 * Math.PI * i) / n), y: c.y + r * Math.sin((2 * Math.PI * i) / n)}));
const hull = (pts: V[]): V[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const hi: V[] = [];
  for (const q of [...p].reverse()) {
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const segDist = (p: V, a: V, b: V) => {
  const d = sub(b, a);
  const t = clamp(((p.x - a.x) * d.x + (p.y - a.y) * d.y) / (d.x * d.x + d.y * d.y || 1));
  return Math.hypot(p.x - a.x - d.x * t, p.y - a.y - d.y * t);
};
/** signed gap (px) between a convex polygon and a box: > 0 apart, < 0 overlapping (the penetration depth) */
const gap = (poly: V[], b: Box): number => {
  const R: V[] = [
    {x: b.x0, y: b.y0},
    {x: b.x1, y: b.y0},
    {x: b.x1, y: b.y1},
    {x: b.x0, y: b.y1},
  ];
  // separating axes: the box's two and the polygon's edge normals
  let pen = Infinity;
  const axes: V[] = [{x: 1, y: 0}, {x: 0, y: 1}];
  for (let i = 0; i < poly.length; i++) {
    const e = sub(poly[(i + 1) % poly.length], poly[i]);
    const l = Math.hypot(e.x, e.y);
    if (l > 1e-9) axes.push({x: -e.y / l, y: e.x / l});
  }
  for (const ax of axes) {
    const pa = poly.map((p) => p.x * ax.x + p.y * ax.y);
    const pb = R.map((p) => p.x * ax.x + p.y * ax.y);
    const o = Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb));
    if (o <= 0) {
      // separated: the true distance between the two outlines
      let d = Infinity;
      for (let i = 0; i < poly.length; i++) for (let k = 0; k < 4; k++) d = Math.min(d, segDist(poly[i], R[k], R[(k + 1) % 4]), segDist(R[k], poly[i], poly[(i + 1) % poly.length]));
      return d;
    }
    pen = Math.min(pen, o);
  }
  return -pen;
};
const onScreen = (poly: V[]) => poly.some((p) => p.x > -40 && p.x < 1120 && p.y > -40 && p.y < 1960);

/** the glass face (Wrist3D fr1 plane, the screen rectangle inset 0.95), world; null when it faces away */
const glassWorld = (man: ManPose, roll: number, yaw = 14): V[] | null => {
  const j = manJoints(man);
  const s = man.s;
  const A = armFrame(j.L.E, j.L.W, 23.5 * s, 17 * s);
  const R = 17 * s;
  const G = DEV_GEO;
  const ub = A.L - G.bandFromWrist * R;
  const rr = (roll * Math.PI) / 180;
  const sb = Math.sin(rr);
  const cb = Math.cos(rr);
  if (cb <= 0.04) return null;
  const syC = Math.sin((lerp(yaw, G.yawProfile, smooth(Math.abs(sb))) * Math.PI) / 180);
  const kTaper = (A.rW - A.rE) / A.L;
  const rBack = armR(A, ub) - G.sink * R;
  const ayC: V = {x: -A.n.x * cb + A.u.x * sb * syC, y: -A.n.y * cb + A.u.y * sb * syC};
  const h = G.caseT * R;
  const casePt = (a: number, b: number): V => {
    const r = rBack + kTaper * a + h;
    const p = armPt(A, ub + a, r * sb, r * cb, syC);
    return {x: p.x + ayC.x * b, y: p.y + ayC.y * b};
  };
  const hl = 0.475 * G.caseL * R;
  const hw = 0.475 * G.caseW * R;
  return [casePt(-hl, -hw), casePt(hl, -hw), casePt(hl, hw), casePt(-hl, hw)];
};
/** advisory: the whole case body (all corners from the back face to the glass), world, in any roll */
const caseWorld = (man: ManPose, roll: number, yaw = 14): V[] => {
  const j = manJoints(man);
  const s = man.s;
  const A = armFrame(j.L.E, j.L.W, 23.5 * s, 17 * s);
  const R = 17 * s;
  const G = DEV_GEO;
  const ub = A.L - G.bandFromWrist * R;
  const rr = (roll * Math.PI) / 180;
  const sb = Math.sin(rr);
  const cb = Math.cos(rr);
  const syC = Math.sin((lerp(yaw, G.yawProfile, smooth(Math.abs(sb))) * Math.PI) / 180);
  const kTaper = (A.rW - A.rE) / A.L;
  const rBack = armR(A, ub) - G.sink * R;
  const ayC: V = {x: -A.n.x * cb + A.u.x * sb * syC, y: -A.n.y * cb + A.u.y * sb * syC};
  const pts: V[] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const h of [0, G.caseT * R]) {
    const r = rBack + kTaper * a * (G.caseL / 2) * R + h;
    const p = armPt(A, ub + (a * G.caseL * R) / 2, r * sb, r * cb, syC);
    pts.push({x: p.x + (ayC.x * b * G.caseW * R) / 2, y: p.y + (ayC.y * b * G.caseW * R) / 2});
  }
  return pts;
};
/** advisory: both shoes (ankle -> toe capsules, art/Man leg geometry), world */
const shoesWorld = (man: ManPose): [string, V[]][] => {
  const j = manJoints(man);
  const r = 30 * man.s;
  const shoe = (A: V, T: V): V[] => [...circle(A, r, 10), ...circle(T, r * 0.8, 10)];
  return [
    ['shoeL', shoe(j.lLeg.A, j.lLeg.toe)],
    ['shoeR', shoe(j.rLeg.A, j.rLeg.toe)],
  ];
};
/** both eyes (art/Head.tsx: eye ellipses at y -10, rx 21 * width, ry 23, in head units of R/100), world */
const eyesWorld = (man: ManPose): [string, V[]][] => {
  const j = manJoints(man);
  const R = 96 * man.s;
  const k = R / 100;
  const roll = -(j.tc + man.neck);
  const t = man.turn;
  const xf = -30 * t;
  const eye = (ex: number, wf: number): V[] => circle({x: 0, y: 0}, 1, 16).map((p) => add(j.head, rot({x: (ex + p.x * 21 * wf) * k, y: (-10 + p.y * 23) * k}, roll)));
  return [
    ['eyeN', eye(xf + 37 * (1 - 0.08 * t), 1)],
    ['eyeF', eye(xf - 37 * (1 - 0.3 * t), 1 - 0.32 * t)],
  ];
};
/** the heart's silhouette in the chest window, world */
const heartWorld = (man: ManPose, st: ReturnType<typeof revealAt>['heart']): V[] => {
  const j = manJoints(man);
  const HL = {x: CHEST4.heart[1], y: -CHEST4.heart[0]};
  return heartOutline(st).map((p) => chestToWorld(j.C, j.tc, man.s, add(HL, mul(p, CHEST4.heartK))));
};

// ---------------------------------------------------------------- per-shot subjects
type Subject = {name: string; poly: V[]; advisory?: boolean};
const HERO_R = 22 * 1.6; // bead and its ring (local units)
const PORT_R = 0.12 * 1000; // the port opening (bore 0.19R) with its nose and shutter (local units: 1000 = the wrist radius)
/** the slug's reach round its middle (local units): half its length and half its width (it bunches at the 987 match) */
const slugR = (d?: {len?: number; w?: number}) => (TREAT_SLUG.len * (d?.len ?? 1)) / 2 + (TREAT_SLUG.w * (d?.w ?? 1)) / 2;

const subjectsAt = (f: number): {shot: string; cam: Cam; items: Subject[]} | null => {
  const items: Subject[] = [];
  let cam: Cam;
  let shot: string;
  let man: ManPose;
  let roll: number;
  let backdrop: number;
  let rv: ReturnType<typeof revealAt>;
  if (f >= B.cut && f < B.map0) {
    shot = 'Journey3';
    cam = journeyCam3(f);
    man = jMan(f);
    ({roll, backdrop} = journeyDevice(f));
    rv = revealAt(f);
    if (f >= B.heroRing - 12 && rv.armOpen > 0.5) items.push({name: 'hero', poly: circle(heroWorld(f), HERO_R / LOCAL_PER_WORLD)});
    if (Math.abs(roll) > 30 && rv.armOpen > 0.01) items.push({name: 'port', poly: circle(PORT_W, PORT_R / LOCAL_PER_WORLD)});
    if (f < B.settle) shoesWorld(man).forEach(([name, poly]) => items.push({name, poly, advisory: true}));
  } else if (f < B.cut || f >= WIPE.in0) {
    const g = loopF(f);
    shot = f < WIPE.out1 && f >= WIPE.in0 ? 'TrunkWipe/Aftermath3' : 'Aftermath3';
    man = aMan(g);
    const j = manJoints(man);
    const bandW = add(j.L.W, mul(j.L.foreDir, -1.75 * 17 * man.s));
    cam = camAt(g, bandW, j.head);
    const tr = treatState(g);
    roll = tr.roll;
    backdrop = g < B4.chestCut ? clamp(inv(B4.tBack0, B4.tBack1, g)) : 0;
    rv = revealAt(g);
    const secOn = tr.on && g < B4.chestCut;
    if (secOn && Math.abs(roll) > 30) items.push({name: 'port', poly: circle(PORT_W, PORT_R / LOCAL_PER_WORLD)});
    if (secOn && g >= B4.tSlug0) items.push({name: 'slug', poly: circle(slugWorld(g), slugR(tr.dose) / LOCAL_PER_WORLD)});
    if (secOn && Math.abs(roll) > 30) items.push({name: 'case', poly: caseWorld(man, roll), advisory: true});
    // the drone's data link ends on a cyan ring round the glass: part of the band while it is drawn
    const link = dataLink(g, man, arriveDrone3(g));
    if (link.a > ALPHA) items.push({name: 'link', poly: circle(link.c, link.r + 1.5 / cam.z, 24)});
  } else return null; // the map, the hospital and the flyover show none of these subjects
  const gw = glassWorld(man, roll);
  if (gw) items.push({name: 'glass', poly: gw});
  if (backdrop < 0.5) eyesWorld(man).forEach(([name, poly]) => items.push({name, poly}));
  const fadeA = smooth(clamp((rv.chestOpen - 0.08) / 0.3));
  if (fadeA > 0.2) items.push({name: 'heart', poly: heartWorld(man, rv.heart)});
  // to screen; the trunk wipe shows the arrival only behind (right of) the trunk's trailing edge
  let out = items.map((it) => ({name: it.name, advisory: it.advisory, poly: hull(it.poly.map((p) => screenOf(cam, p)))})).filter((it) => onScreen(it.poly));
  if (f >= WIPE.in0 && f < WIPE.out1) {
    const t = inv(WIPE.in0, WIPE.out1, f);
    const x = lerp(1240, -760 - 320, t);
    // trailing edge: quadratic (x+760,-200) (x+640,1100) (x+1020,2200); x at screen height y
    const edgeX = (y: number) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        const m = (lo + hi) / 2;
        const yy = (1 - m) ** 2 * -200 + 2 * (1 - m) * m * 1100 + m * m * 2200;
        if (yy < y) lo = m;
        else hi = m;
      }
      const m = (lo + hi) / 2;
      return (1 - m) ** 2 * (x + 760) + 2 * (1 - m) * m * (x + 640) + m * m * (x + 1020);
    };
    out = out.filter((it) => it.poly.some((p) => p.x > edgeX(p.y)));
  }
  return {shot, cam, items: out};
};

// ---------------------------------------------------------------- run
const args = process.argv.slice(2);
const dumpArg = args.indexOf('--dump') >= 0 ? args[args.indexOf('--dump') + 1] : null;
const [d0, d1] = dumpArg ? dumpArg.split('-').map(Number) : [-1, -2];
type Hit = {f: number; shot: string; caption: string; alpha: number; item: string; gapPx: number};
const hits: Hit[] = [];
const near: Hit[] = [];
const advisory: Hit[] = [];
let captioned = 0;
for (let f = 0; f < TOTAL; f++) {
  const cp = captionAt(f);
  if (!cp || cp.a <= 0) continue;
  captioned++;
  const s = subjectsAt(f);
  if (!s) continue;
  for (const it of s.items) {
    const g = Math.min(...cp.boxes.map((b) => gap(it.poly, b)));
    const h = {f, shot: s.shot, caption: cp.text, alpha: +cp.a.toFixed(3), item: it.name, gapPx: +g.toFixed(1)};
    if (f >= d0 && f <= d1) console.log(`${f} ${s.shot} "${cp.text}" a=${cp.a.toFixed(2)} ${it.name} gap=${g.toFixed(0)}`);
    if (g < MARGIN) (it.advisory ? (cp.a > ALPHA ? advisory : []) : cp.a > ALPHA ? hits : near).push(h);
  }
}
// group consecutive frames per item into spans
type Span = {f0: number; f1: number; item: string; caption: string; minGap: number; maxAlpha: number};
const toSpans = (hs: Hit[]): Span[] => {
  const spans: Span[] = [];
  for (const h of hs) {
    const last = spans.find((s) => s.item === h.item && s.f1 === h.f - 1);
    if (last) {
      last.f1 = h.f;
      last.minGap = Math.min(last.minGap, h.gapPx);
      last.maxAlpha = Math.max(last.maxAlpha, h.alpha);
      if (!last.caption.includes(h.caption)) last.caption += ` / ${h.caption}`;
    } else spans.push({f0: h.f, f1: h.f, item: h.item, caption: h.caption, minGap: h.gapPx, maxAlpha: h.alpha});
  }
  return spans.sort((a, b) => a.f0 - b.f0);
};
const spans = toSpans(hits);
const advisorySpans = toSpans(advisory);
const pass = hits.length === 0;
const report = {
  check: 'V4 caption collisions (camera keys only; caption text, timing and style locked)',
  margin_px: MARGIN,
  alpha_threshold: ALPHA,
  subjects: ['glass (face visible)', 'eyeN', 'eyeF', 'heart (window open)', 'hero (merge to section close)', 'port (case turned under)', 'slug (treatment section)', 'link (data-link ring round the glass)'],
  captioned_frames: captioned,
  pass,
  collisions: hits.length,
  spans,
  below_alpha: near,
  hits,
  advisory_note: 'not protected subjects, never a failure: the shoes (legibility of white text on the white shoes) and the case body in the treatment section',
  advisory_spans: advisorySpans,
};
const out = path.resolve(here, '../../qa/v4/CAPTION_CHECK.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(report, null, 1));
for (const s of spans) console.log(`  ${s.f0}-${s.f1} ${s.item} under "${s.caption}" (min gap ${s.minGap} px, alpha <= ${s.maxAlpha})`);
for (const s of advisorySpans) console.log(`  advisory ${s.f0}-${s.f1} ${s.item} under "${s.caption}" (min gap ${s.minGap} px)`);
console.log(`${pass ? 'PASS' : 'FAIL'}: ${hits.length} colliding subject-frames above alpha ${ALPHA} (margin ${MARGIN} px), ${near.length} below it; ${captioned} captioned frames -> ${path.relative(process.cwd(), out)}`);
if (!pass) process.exitCode = 1;
