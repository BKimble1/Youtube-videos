// V4 rig probe over every frame where the climber is on screen. Constraints: each hand on its bar, each leg within
// reach, each strap within its length, a planted foot and a seated (loaded) pad never sliding. Clipping, in screen
// space with the drawn widths: a strap crossing the other strap; a strap running into its own leg (thigh, shin) above
// its loop; a strap in front of / behind the other leg; a toe through the glass; a knee into a pad; the legs crossing;
// the near hand above the chin; the far hand behind the head; a sole level with window trim behind it (the base
// channel, a spandrel band). And the loop: every number in the state at FRAMES against frame 0.
// usage: node probe4.cjs [from to] [--list]
import {climbAt, LEN, loopApex} from '../../source/src/v4/climb4';
import {handError, H_BAR, handUV} from '../../source/src/world/rig';
import {gripOf, PAD, prPad} from '../../source/src/world/geo';
import {DIM, manJoints} from '../../source/src/dc/Man';
import {FRAMES} from '../../source/src/v4/set4';
import {BRICK_TOP} from '../../source/src/v3/set3';
import {FLOORS} from '../../source/src/v3/Scenery3';

type P = {x: number; y: number};
const sub = (a: P, b: P) => ({x: a.x - b.x, y: a.y - b.y});
const dot = (a: P, b: P) => a.x * b.x + a.y * b.y;
const len = (a: P) => Math.hypot(a.x, a.y);
const segPt = (p: P, a: P, b: P) => {
  const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab))));
  return len(sub(p, {x: a.x + ab.x * t, y: a.y + ab.y * t}));
};
const cross = (a: P, b: P, c: P, d: P) => {
  const r = (p: P, q: P, s: P) => (q.x - p.x) * (s.y - p.y) - (q.y - p.y) * (s.x - p.x);
  return r(a, b, c) * r(a, b, d) < 0 && r(c, d, a) * r(c, d, b) < 0;
};
const segSeg = (a: P, b: P, c: P, d: P) => (cross(a, b, c, d) ? 0 : Math.min(segPt(a, c, d), segPt(b, c, d), segPt(c, a, b), segPt(d, a, b)));
const lerp = (a: P, b: P, t: number) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

const OFF: [number, number][] = [[176, 498], [535, 680], [904, 945], [1017, 1106]]; // micro, springs, boundary, press/split close-ups
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const LIST = process.argv.includes('--list');
const [from, to] = args.map(Number);
const uv = handUV(H_BAR, 'grip');
const STRAP_W = 2.4 * 6.2 / 2 + 2; // half width + ink
const worst: Record<string, [number, number]> = {};
const up = (k: string, v: number, f: number, lower = false) => {
  if (!(k in worst)) worst[k] = [lower ? 1e9 : -1e9, 0];
  if (lower ? v < worst[k][0] : v > worst[k][0]) worst[k] = [+v.toFixed(2), f];
};
const bad: Record<string, number[]> = {hand: [], leg: [], strapLen: [], strapX: [], strapOwnLeg: [], nearStrapOverFarLeg: [], farStrapBehindNearLeg: [], toeGlass: [], kneePad: [], legX: [], face: [], farHid: [], trim: [], footSlide: [], padSlide: []};
let prev = climbAt((from || 0) - 1);
for (let f = from || 0; f <= (to ?? FRAMES); f++) {
  const s = climbAt(f);
  if (OFF.some(([a, b]) => f >= a && f < b)) {
    prev = s;
    continue;
  }
  const j = manJoints(s.pose);
  const gL = prPad(gripOf(s.padL)), gR = prPad(gripOf(s.padR));
  const he = Math.max(handError(s.pose, 'L', gL, 182, uv.u, uv.v), handError(s.pose, 'R', gR, 176, uv.u, uv.v));
  up('hand', he, f);
  if (he > 6) bad.hand.push(f);
  const lg = Math.max(s.err.legL, s.err.legR);
  up('leg', lg, f);
  if (lg > 0.98) bad.leg.push(f);
  // straps: ring -> apex (the loop's top), drawn as a band of half width STRAP_W
  const apex = (ft: typeof s.footL) => loopApex(ft.bar);
  const strap = {L: [s.ringL, apex(s.footL)] as [P, P], R: [s.ringR, apex(s.footR)] as [P, P]};
  for (const side of ['L', 'R'] as const) {
    const ft = side === 'L' ? s.footL : s.footR, ring = side === 'L' ? s.ringL : s.ringR;
    const sl = len(sub(ft.bar, ring)) / LEN[side];
    up('strapLen', sl, f);
    if (sl > 1.002) bad.strapLen.push(f);
  }
  const sx = segSeg(strap.L[0], strap.L[1], strap.R[0], strap.R[1]);
  up('strapGap', sx, f, true);
  if (sx < 2 * STRAP_W) bad.strapX.push(f);
  // a strap against its own leg: only the part above its loop (the loop itself goes round the shoe by design)
  const legCaps = (L: typeof j.lLeg) => [[L.hp, L.K, 38], [L.K, L.A, 31]] as [P, P, number][];
  const capDist = (a: P, b: P, caps: [P, P, number][]) => Math.min(...caps.map(([c, d, r]) => segSeg(a, b, c, d) - r));
  const upper = (sg: [P, P]) => [sg[0], lerp(sg[1], sg[0], 30 / Math.max(30, len(sub(sg[1], sg[0]))))] as [P, P];
  const own = Math.min(capDist(...upper(strap.L), legCaps(j.lLeg)), capDist(...upper(strap.R), legCaps(j.rLeg))) - STRAP_W;
  up('strapOwnLeg', own, f, true);
  if (own < 4) bad.strapOwnLeg.push(f);
  const nf = capDist(...strap.L, [...legCaps(j.rLeg), [j.rLeg.A, j.rLeg.toe, 26]]) - STRAP_W;
  up('nearStrapFarLeg', nf, f, true);
  if (nf < 0) bad.nearStrapOverFarLeg.push(f);
  const fn = capDist(...strap.R, [...legCaps(j.lLeg), [j.lLeg.A, j.lLeg.toe, 26]]) - STRAP_W;
  up('farStrapNearLeg', fn, f, true);
  if (fn < 0) bad.farStrapBehindNearLeg.push(f);
  // toes against the glass (x = 0) and knees against the pads (their plates and handles: x up to the bar + 20)
  for (const L of [j.lLeg, j.rLeg]) {
    const tip = {x: L.A.x + L.footDir.x * 100, y: L.A.y + L.footDir.y * 100};
    up('toeX', tip.x, f, true);
    if (tip.x < 0) bad.toeGlass.push(f);
  }
  for (const [pad, g] of [[s.padL, gL], [s.padR, gR]] as const) {
    const top = pad.y - PAD.h / 2 - 10, bot = pad.y + PAD.h / 2 + 10;
    for (const L of [j.lLeg, j.rLeg]) {
      if (L.K.y > top && L.K.y < bot) {
        const c = L.K.x - 34 - (g.x + 20);
        up('kneePad', c, f, true);
        if (c < 0) bad.kneePad.push(f);
      }
    }
  }
  const nl = j.lLeg, fl = j.rLeg;
  if (cross(nl.K, nl.A, fl.K, fl.A) || cross(nl.K, nl.A, fl.hp, fl.K) || cross(nl.hp, nl.K, fl.K, fl.A)) bad.legX.push(f);
  // the near hand stays below the chin; the far hand stays clear of the head and hair
  const dy = j.L.W.y - j.head.y;
  up('nearHandBelowHead', dy, f, true);
  if (dy < 105 && j.L.W.x > j.head.x - 160) bad.face.push(f);
  const fc = Math.hypot(gR.x - j.head.x, gR.y - j.head.y) - DIM.headR * j.s;
  up('farClear', fc, f, true);
  if (fc < 40) bad.farHid.push(f);
  // soles level with trim behind them (the trim line's screen height at the foot: y - KY/KX x)
  const trims: [number, number][] = [[BRICK_TOP - 64, BRICK_TOP], ...FLOORS.map((y) => [y - 95, y + 95] as [number, number])];
  for (const L of [nl, fl]) {
    const sole = L.A.y + 27;
    for (const [a, b] of trims) {
      const sh = -(0.04 / -0.24) * L.A.x;
      if (sole > a + sh - 14 && sole < b + sh + 30) bad.trim.push(f);
    }
  }
  // a planted foot and a loaded, seated pad must not move
  for (const side of ['L', 'R'] as const) {
    const ft = side === 'L' ? s.footL : s.footR, pf = side === 'L' ? prev.footL : prev.footR;
    if (ft.planted > 0.95 && pf.planted > 0.95) {
      const d = len(sub(ft.ankle, pf.ankle));
      up('footSlide', d, f);
      if (d > 0.5) bad.footSlide.push(f);
    }
    const pd = side === 'L' ? s.padL : s.padR, pp = side === 'L' ? prev.padL : prev.padR;
    if (pd.gap < 0.01 && pp.gap < 0.01 && pd.load > 0.3) {
      const d = Math.abs(pd.y - pp.y);
      up('padSlide', d, f);
      if (d > 0.5 && !(f > 1100)) bad.padSlide.push(f);
    }
  }
  up('ankleJump', Math.max(len(sub(s.footL.ankle, prev.footL.ankle)), len(sub(s.footR.ankle, prev.footR.ankle))), f);
  const pj = manJoints(prev.pose);
  up('kneeJump', Math.max(len(sub(j.lLeg.K, pj.lLeg.K)), len(sub(j.rLeg.K, pj.rLeg.K))), f);
  up('wristJump', Math.max(len(sub(j.L.W, pj.L.W)), len(sub(j.R.W, pj.R.W))), f);
  up('hipJump', len(sub(j.H, pj.H)), f);
  prev = s;
}
const runs = (a: number[]) => {
  const out: string[] = [];
  let s0 = -1, p = -9;
  for (const f of a) {
    if (f !== p + 1) {
      if (s0 >= 0) out.push(s0 === p ? `${s0}` : `${s0}-${p}`);
      s0 = f;
    }
    p = f;
  }
  if (s0 >= 0) out.push(s0 === p ? `${s0}` : `${s0}-${p}`);
  return out.join(' ');
};
for (const k of Object.keys(bad)) console.log(`${k}: ${runs(bad[k]) || 'none'}`);
const a = climbAt(0), b = climbAt(FRAMES);
const flat = (o: any, pre = '', out: Record<string, number> = {}) => {
  for (const [k, v] of Object.entries(o ?? {})) {
    if (typeof v === 'number') out[pre + k] = v;
    else if (v && typeof v === 'object') flat(v, pre + k + '.', out);
  }
  return out;
};
const fa = flat(a), fb = flat(b);
const diffs = Object.keys(fa).filter((k) => k !== 'f').map((k) => [k, +Math.abs(fa[k] - (fb[k] ?? NaN)).toFixed(4)] as [string, number]).filter(([, x]) => !(x < 0.01)).sort((p, q) => q[1] - p[1]);
console.log('loop', diffs.length ? JSON.stringify(diffs.slice(0, 12)) : `all ${Object.keys(fa).length} values equal`);
console.log('worst', JSON.stringify(worst));
if (LIST) for (let f = from || 0; f <= (to ?? FRAMES); f += 4) {
  const s = climbAt(f), j = manJoints(s.pose);
  console.log(f, 'H', j.H.x.toFixed(0), j.H.y.toFixed(0), 'aL', s.footL.ankle.x.toFixed(0), s.footL.ankle.y.toFixed(0), 'aR', s.footR.ankle.x.toFixed(0), s.footR.ankle.y.toFixed(0), 'kL', j.lLeg.K.x.toFixed(0), 'kR', j.rLeg.K.x.toFixed(0), 'pads', s.padL.y.toFixed(0), s.padR.y.toFixed(0), 'w', s.footL.planted.toFixed(2), s.footR.planted.toFixed(2));
}
