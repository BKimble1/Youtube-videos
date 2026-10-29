// V5: the film as a pure function of the frame. A new structure around one deterministic event model:
//   the separated pair (head + abandoned body) as a function of tau = frames since the neck parted.
// The film OPENS on the result (tau = TAU0: the head already gliding away from its headless body) and ENDS on the same
// animal, regrown, separating again: the neck narrows, draws out and parts at BRK_E, and from then on the ending uses
// the very same model, so its last frame is the hook's frame -1 and the replay continues the same motion.
// Same rig (V5 design style), sets and narration as V4; events sit on the words (F('word', n)).
import {F, FRAMES, clamp, ease, lerp, outCubic, seg} from '../lib';
import {Path} from '../geo';
import {Orbit, V3, lerpOrbit, orbitCam} from '../kit/three';
import {Piece, geo, heartAOf} from '../v2/slug/body';
import {HOOK_FRAGS, PH2, PHS, S0, State2, beatAt} from '../v2/shots2';
import {Frag} from '../v2/sets/Lab2';

const smooth3 = (u: number) => u * u * (3 - 2 * u);
const E = (f: number, a: number, b: number) => ease(f, a, b, smooth3);
const V5: Piece['style'] = 'v5';

// ---------------------------------------------------------------- beats (frames at 30 fps), from the words
export const B5 = {
  side: 15, rock: 27, wide: 42, close: 60, out: 81, reveal: 100,
  body: F('and', 1) + 2, touch: F('body') + 1, angle2: F('body') + 12, move: F('moving'), toNeck: F('too') + 2,
  anat: F('you') + 4, rew1: F('you') + 14, win0: F('see') + 2, weak: F('weak') - 2, pull: F('just') + 2, part: F('breaks') + 1,
  heart: F('heart', 1), tissue: F('behind', 2) + 6, micro: F('scientists') - 6, bugs: F('escaping') - 4, out0: F('old') - 6, chase: F('body', 2) - 4,
  feed: F('but'), contact: F('head', 4) + 6, moveOn: F('algae') + 6, back: F('and', 2) - 2,
  week0: F('and', 2) + 2, win2: F('a', 3) - 18, newHeart: F('new'), beat: F('beating'), beat2: F('beating') + 16,
  grow0: F('then') + 6, m14: F('entire') - 4, m21: F('body', 3) - 2, grow1: F('back') - 4,
  end0: F('and', 3), later: F('actually') - 2, did: F('actually'), pull2: F('actually') + 10, twice: F('twice'),
  end: FRAMES,
};
export const CUTS5 = [B5.feed, B5.end0];
export const BEAT_PER5 = B5.beat2 - B5.beat;

// ---------------------------------------------------------------- the separation model
export const GBRK = 22; // the neck parts when the head has pulled 22 units ahead
export const BRK_E = B5.twice + 10; // the second separation completes 0.33 s after "TWICE" begins
export const TAU0 = FRAMES - BRK_E; // frame 0 is TAU0 frames after a separation (the ending's)
/** neck pinch for a given pull (0 open .. 1 parted) */
export const pinch5 = (gap: number) => clamp(gap <= 6 ? (0.45 * gap) / 6 : 0.45 + (0.55 * (gap - 6)) / (GBRK - 6));
const vHead = (tau: number) => 0.62 * ease(tau, 0, 8) * (1 + 0.3 * Math.sin((2 * Math.PI * tau) / 18));
const TR: number[] = [0];
for (let k = 1; k <= TAU0 + B5.feed + 4; k++) TR.push(TR[TR.length - 1] + vHead(k));
const travel = (tau: number) => TR[clamp(Math.round(tau), 0, TR.length - 1)];
/** the separated head tau frames after the break (time t in seconds, for the rhinophores and margins) */
const sepHead = (tau: number, t: number, tip?: number): Piece => {
  const go = ease(tau, 0, 6), cr = (2 * Math.PI * tau) / 18;
  return {
    id: 'head', path: PH2, tip: tip ?? S0 + GBRK + travel(tau), a0: 0, a1: 22, gap: GBRK * (1 - ease(tau, 0, 9, outCubic)), pinch: 1, seal: ease(tau, 0, 7, outCubic), t, style: V5,
    crawl: cr, crawlAmp: 1.3 * go, surge: 0.035 * go * Math.cos(cr), sway: 1.5,
  };
};
type BodyMods = Partial<Pick<Piece, 'flinch' | 'bend' | 'twitch' | 'ripple' | 'win' | 'heart' | 'beat'>>;
const sepBody = (tau: number, t: number, m: BodyMods = {}): Piece => {
  const gB = GBRK * (1 - ease(tau, 0, 8, outCubic));
  // it recoils as the thread parts (it was holding against the pull), then lies still
  const fl = 0.3 * Math.sin(Math.PI * seg(tau, 0, 14)) ** 2;
  return {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: ease(tau, 0, 7, outCubic), t: t * 0.6, style: V5, flinch: fl, bend: fl * 2, ...m};
};
const tauOf = (f: number) => f + TAU0;
const labHead = (f: number, tip?: number) => sepHead(tauOf(f), f / 30, tip);
const labBody = (f: number, m: BodyMods = {}) => sepBody(tauOf(f), f / 30, m);

const headAz = (path: Path, s: number) => {
  const p = path.at(s);
  return (Math.atan2(p.tx, -p.ty) * 180) / Math.PI;
};
const lineAz = (from: V3, to: V3) => (Math.atan2(to[0] - from[0], -(to[1] - from[1])) * 180) / Math.PI;
const rel = (target: V3, hAz: number, dAz: number, el: number, d: number, f: number, cy = 960): Orbit => ({target, az: hAz + dAz, el, d, f, cy});
const onPath = (s: number, v: number, z = 0): V3 => {
  const p = PH2.at(s);
  return [p.x - p.ty * v, p.y + p.tx * v, z];
};
const mid3 = (a: V3, b: V3, k = 0.5): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ---------------------------------------------------------------- set dressing (bright lab, Environment A)
const hs = (f: number) => S0 + GBRK + travel(tauOf(f)) - 9; // arc of the head's middle at hook frame f
const ROCK: V3 = onPath(hs(34) + 2, -13, 2.6);
const PEBBLE: V3 = onPath(hs(70) + 4, 8.5, 1.8);
export const FRAGS5: Frag[] = [
  // a tuft of algae on and around the rock the head passes at 1.0-1.4 s
  {c: [ROCK[0] + 2, ROCK[1] - 3, 0], ang: 0.4, len: 11, seed: 21},
  {c: [ROCK[0] - 3, ROCK[1] + 2, 0], ang: 2.2, len: 10, seed: 22},
  {c: [ROCK[0] + 4, ROCK[1] + 3, 0], ang: -1.0, len: 9, seed: 23},
  {c: onPath(hs(8) + 10, 15), ang: 0.9, len: 12, seed: 24},
  ...HOOK_FRAGS.slice(2),
];
const PROPS = [
  {c: ROCK, r: [5.6, 4.4, 3.4] as [number, number, number], yaw: 20, col: '#8F8778'},
  {c: PEBBLE, r: [3.0, 2.4, 1.9] as [number, number, number], yaw: -10, col: '#A39A88'},
];

// ---------------------------------------------------------------- 0-4.3 s: the result, first
// Frame 0: a low, close macro; the detached head gliding in the foreground, its big headless body behind, the gap
// between them plain. Then (each view motivated by the head's own movement): a close side view as it passes the lens
// (0.5 s), behind it past the algae-covered rock (0.9 s), a wide lab macro with both pieces and their size difference
// (1.4 s), a close low track as it steers round a pebble (2.0 s), and the head leaving the foreground while the body
// behind becomes the subject (2.7-4.3 s).
/** the hook's camera for a head/body pair, by hook frame (negative frames give the first view) */
const hookOrbit = (f: number, head: Piece, body: Piece): Orbit => {
  const hc = geo(head).at(9, 0, 3.6), bc = geo(body).at(52, 0, 4);
  const hAz = headAz(PH2, head.tip - 9), lAz = lineAz(bc, hc);
  // low, in front of the head and a little to its side: the head big in the foreground, the long headless body
  // lying behind it up the frame, the gap between them plain
  const k0 = rel(mid3(hc, bc, 0.4), lAz, -22, 22, 150, 3150, 1020);
  const k1 = rel(hc, hAz, -86, 9, 92, 3150, 1040);
  const k2 = rel(hc, hAz, -134, 15, 98, 3150, 1080);
  // the wide view looks down the line from the head to the body: the small head at the bottom, the long body above it
  const k3 = rel(mid3(hc, bc, 0.55), lAz, -12, 46, 290, 3150, 790);
  const k4 = rel(hc, hAz, -38, 10, 84, 3150, 1060);
  const k5 = rel(bc, lAz, -18, 14, 200, 3300, 1000);
  let o = lerpOrbit(k0, k1, E(f, B5.side - 8, B5.side + 6));
  o = lerpOrbit(o, k2, E(f, B5.rock - 6, B5.rock + 8));
  o = lerpOrbit(o, k3, E(f, B5.wide - 6, B5.wide + 10));
  o = lerpOrbit(o, k4, E(f, B5.close - 6, B5.close + 10));
  o = lerpOrbit(o, k5, E(f, B5.out, B5.reveal + 10));
  return o;
};
const hookState = (f: number): State2 => {
  const pieces = [labBody(f), labHead(f)];
  const [body, head] = pieces;
  const orbit = hookOrbit(f, head, body);
  // the head brushes the rock and steers round the pebble (it lifts and turns its front a little)
  const sense = 0.35 * Math.sin(Math.PI * seg(f, B5.close, B5.close + 22));
  head.rear = sense;
  const blur = {head: 8 * E(f, B5.reveal, B5.body + 6), body: 2 * E(f, B5.side - 4, B5.side + 4) * (1 - E(f, B5.wide - 6, B5.wide + 6))};
  return {
    shot: 'H', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS5, blur, props: PROPS, dim: 0,
    trail: {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.5, w: 0.45},
    labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, B5.rock, B5.rock + 8), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 4.4-7.3 s: the headless body reacts
const PDIR: V3 = norm([0.55, -0.3, 0.78]);
function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
const nearSideOf = (o: Orbit, p: Piece) => {
  const eye = orbitCam(o).eye, G = geo(p);
  const c = G.at(58, 0, 3), l = G.at(58, 1, 3);
  return (l[0] - c[0]) * (eye[0] - c[0]) + (l[1] - c[1]) * (eye[1] - c[1]) > 0 ? 1 : -1;
};
let NEAR_SIDE = 0;
const closeOn = () => rel(geo(labBody(B5.touch)).at(52, 0, 4), headAz(PH2, S0 - 40), -60, 40, 150, 3400, 1040);
const probeAt = (f: number): State2['probe'] => {
  if (f < B5.body || f > B5.touch + 40) return undefined;
  const contact = geo(labBody(f)).tube(60, Math.PI / 2 - 0.55 * (NEAR_SIDE || 1));
  const inn = ease(f, B5.body, B5.touch, outCubic), away = ease(f, B5.touch + 6, B5.touch + 30);
  const back = 70 * (1 - inn) + 60 * away;
  const press = clamp(seg(f, B5.touch - 2, B5.touch + 1)) * (1 - seg(f, B5.touch + 3, B5.touch + 7));
  const k = back + 0.5 - press * 1.4;
  return {tip: [contact[0] + PDIR[0] * k, contact[1] + PDIR[1] * k, contact[2] + PDIR[2] * k], dir: PDIR, press, op: clamp(seg(f, B5.body, B5.body + 4)) * (1 - seg(f, B5.touch + 26, B5.touch + 36))};
};
const bodyState = (f: number): State2 => {
  const tw = f < B5.touch ? 0 : outCubic(seg(f, B5.touch, B5.touch + 4)) * (1 - 0.8 * ease(f, B5.touch + 8, B5.touch + 30));
  const heave = Math.sin(Math.PI * seg(f, B5.move - 6, B5.move + 18)) ** 2;
  const ra = lerp(60, 28, ease(f, B5.touch + 4, B5.toNeck, (u) => u));
  const ramp = ease(f, B5.touch + 2, B5.touch + 10) * (1 - ease(f, B5.toNeck - 4, B5.anat));
  const fl = 0.35 * tw + 0.5 * heave;
  if (!NEAR_SIDE) NEAR_SIDE = nearSideOf(closeOn(), labBody(B5.touch));
  const pieces = [labBody(f, {flinch: fl, bend: 1.5 * fl - 1.6 * heave, twitch: {side: NEAR_SIDE, a: 60, amp: clamp(tw + 0.6 * heave)}, ripple: {a: ra, amp: (0.8 + 0.6 * heave) * ramp}}), labHead(f)];
  const body = pieces[0];
  const hAz = headAz(PH2, S0 - 40);
  const from = hookState(B5.body - 1).orbit;
  const above = rel(geo(body).at(46, 0, 4), hAz, -150, 64, 170, 3400, 980);
  const neck = rel(geo(body).at(25, 0, 4.5), hAz, -110, 40, 110, 3500, 1000);
  let orbit = lerpOrbit(from, closeOn(), E(f, B5.body - 2, B5.touch - 2));
  orbit = lerpOrbit(orbit, above, E(f, B5.angle2, B5.move + 2));
  orbit = lerpOrbit(orbit, neck, E(f, B5.toNeck - 6, B5.anat + 6));
  const head = pieces[1];
  return {
    shot: 'B', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS5, blur: {head: 8}, probe: probeAt(f), props: PROPS, dim: 0.85 * E(f, B5.toNeck, B5.anat + 8),
    trail: {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.5, w: 0.45}, labels: [],
  };
};

// ---------------------------------------------------------------- 7.3-12.5 s: how it happened (Environment B, dark)
// The lab darkens to the deep-teal anatomy grade. REWIND: the head runs back along its trail and rejoins. The skin over
// the neck and front body clears: gland, gut, buccal mass and ganglia, and behind the neck the heart pumping in its
// sac; a pale band marks the weak spot. TIME-LAPSE: the head pulls, the band draws out, the neck parts on "breaks"; the
// head glides away up the frame while the heart beats on in the body in the foreground.
const ST_: number[] = [0];
for (let f = B5.part + 1; f <= B5.feed + 2; f++) ST_.push(ST_[ST_.length - 1] + 0.42 * (1 + 0.3 * Math.sin((2 * Math.PI * (f - B5.part)) / 18)));
const secHead = (f: number) => S0 + GBRK + ST_[clamp(Math.round(f - B5.part), 0, ST_.length - 1)];
const beatOld = (f: number) => beatAt(f, 120, 22) * (1 + 0.5 * Math.exp(-Math.pow((f - B5.heart - 4) / 6, 2)));
const winOf = (open: number): Piece['win'] => ({a: 24, r: 17, open});
const DARK = 0.86;
const anatomyPieces = (f: number): Piece[] => {
  const t = f / 30;
  const open = E(f, B5.win0 - 2, B5.win0 + 12);
  const weak = E(f, B5.weak, B5.weak + 6) * (1 - E(f, B5.part - 2, B5.part + 5));
  if (f < B5.rew1) {
    const k = E(f, B5.anat, B5.rew1);
    const tip = lerp(labHead(B5.anat).tip, S0 + GBRK, k);
    return [labBody(B5.anat), {...labHead(f, tip), gap: GBRK * k, seal: 1 - k, crawl: -((2 * Math.PI * f) / 18) * 2, crawlAmp: 0.6 * (1 - k)}];
  }
  if (f < B5.part) {
    const reform = ease(f, B5.rew1, B5.rew1 + 4);
    const gap = GBRK * (1 - reform) + GBRK * E(f, B5.pull, B5.part);
    return [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinch5(gap), t, heart: 1, beat: beatOld(f), win: winOf(open), weak, style: V5}];
  }
  const gH = GBRK * (1 - ease(f, B5.part, B5.part + 9, outCubic)), gB = GBRK * (1 - ease(f, B5.part, B5.part + 8, outCubic));
  const sl = ease(f, B5.part, B5.part + 7, outCubic), cr = (2 * Math.PI * (f - B5.part)) / 18;
  return [
    {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, heart: 1, beat: beatOld(f), win: winOf(open), style: V5},
    {id: 'head', path: PH2, tip: secHead(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: sl, t, crawl: cr, crawlAmp: 1.2 * ease(f, B5.part, B5.part + 6), win: winOf(open), style: V5},
  ];
};
const anatomyState = (f: number): State2 => {
  const pieces = anatomyPieces(f);
  const from = bodyState(B5.anat - 1).orbit;
  const hAz = headAz(PH2, S0 - 20);
  const neck = onPath(S0 - 22, 0, 5);
  const win: Orbit = rel(neck, hAz, -146, 36, 100, 3200, 900);
  let orbit = lerpOrbit(from, rel(onPath(S0 - 24, 0, 5), hAz, -128, 36, 126, 3300, 960), E(f, B5.anat, B5.rew1));
  orbit = lerpOrbit(orbit, win, E(f, B5.rew1 - 4, B5.win0 + 12));
  const wk = E(f, B5.weak - 4, B5.weak + 10) * (1 - E(f, B5.pull, B5.pull + 20));
  orbit = {...orbit, d: orbit.d * (1 - 0.22 * wk)};
  if (f >= B5.part) {
    const hd = geo(pieces[1]).at(10, 0, 4);
    const k = E(f, B5.part, B5.tissue) * 0.2;
    orbit = {...orbit, target: [lerp(orbit.target[0], hd[0], k), lerp(orbit.target[1], hd[1], k), 5], cy: lerp(orbit.cy ?? 960, 990, k / 0.2)};
  }
  if (f > B5.tissue) {
    const tc = geo(pieces[0]).at(36, 0.3, 5);
    orbit = lerpOrbit(orbit, rel(tc, hAz, -140, 40, 96, 3200 * 5, 960), ease(f, B5.tissue, B5.micro + 14, (u) => u * u * u));
  }
  const rew = seg(f, B5.anat, B5.anat + 2) * (1 - seg(f, B5.rew1, B5.rew1 + 6));
  const tl = seg(f, B5.pull - 2, B5.pull + 4) * (1 - seg(f, B5.part + 10, B5.part + 16));
  return {
    shot: 'A', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS5, dim: DARK, micro: f > B5.micro - 10 ? microAt(f) : undefined, microV5: true,
    labels: [{text: 'REWIND', op: rew, icon: 'rw'}, {text: 'TIME-LAPSE', op: tl, icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 12.5-16.3 s: the parasite hypothesis
const microAt = (f: number): State2['micro'] => {
  const op = ease(f, B5.micro - 10, B5.micro + 2) * (1 - ease(f, B5.out0 + 4, B5.out0 + 16));
  if (op <= 0) return undefined;
  const zIn = 0.75 + 0.6 * ease(f, B5.micro - 10, B5.out0, (u) => u);
  const zOut = ease(f, B5.out0, B5.out0 + 16);
  return {
    op, reveal: ease(f, B5.micro - 10, B5.micro + 4), para: ease(f, B5.bugs - 6, B5.bugs + 6), zoom: zIn * lerp(1, 0.45, zOut),
    swim: Math.max(0, (f - B5.bugs) / 30), bar: ease(f, B5.bugs, B5.bugs + 8) * (1 - zOut), pan: 240 * ease(f, B5.micro, B5.out0, (u) => u),
  };
};
const paraState = (f: number): State2 => {
  const a = anatomyState(Math.min(f, B5.micro + 14));
  const pieces = anatomyPieces(f).map((p) => ({...p, win: winOf(1 - E(f, B5.out0 + 6, B5.chase + 4))}));
  const head = pieces[1];
  const hc = geo(head).at(9, 0, 3.5);
  const out = E(f, B5.out0, B5.chase);
  const bt = geo(pieces[0]).at(31, 0, 5);
  const wide = rel([(bt[0] + hc[0]) / 2, (bt[1] + hc[1]) / 2, 4], headAz(PH2, S0 - 20), -150, 50, 270, 3200, 980);
  const chase = rel([hc[0], hc[1], 3.5], headAz(PH2, head.tip - 9), -100, 22, 104, 3150, 1040);
  let orbit = lerpOrbit(a.orbit, wide, out);
  orbit = lerpOrbit(orbit, chase, E(f, B5.chase - 6, B5.feed));
  const hyp = ease(f, B5.bugs + 4, B5.bugs + 12) * (1 - ease(f, B5.out0 + 2, B5.out0 + 10));
  return {shot: 'P', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS5, dim: lerp(DARK, 0.55, out), micro: microAt(f), microV5: true, labels: [{text: 'HYPOTHESIS', op: hyp, icon: 'none'}]};
};

// ---------------------------------------------------------------- 16.3-19.0 s: feeding (Environment C, the seabed)
export const TIP_SEA = 124.4;
const PHS_AZ = headAz(PHS, 120);
const crawlAt = (f: number) => (2 * Math.PI * f) / 18;
const pumpAt = (f: number) => (f > B5.contact + 2 && f < B5.moveOn ? 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - B5.contact - 2)) / 11) : 0);
const seaHead = (f: number): Piece => {
  const t = f / 30;
  const arrive = ease(f, B5.feed, B5.contact, outCubic);
  const on = ease(f, B5.moveOn, B5.back + 10);
  const pm = pumpAt(f);
  const go = Math.max(1 - ease(f, B5.contact - 6, B5.contact + 2), on);
  return {
    id: 'head', path: PHS, tip: lerp(TIP_SEA - 8, TIP_SEA, arrive) + 0.5 * pm + 5 * on, a0: 0, a1: 22, gap: 0, pinch: 1, seal: 1, t, style: V5,
    crawl: crawlAt(f), crawlAmp: 1.2 * go, surge: 0.025 * pm, rear: 0.5 * ease(f, B5.contact - 8, B5.contact + 2) * (1 - on),
    green: 0.85 * ease(f, B5.contact + 4, B5.back), pump: pm, win: {a: 5, r: 7, open: ease(f, B5.contact, B5.contact + 6) * (1 - ease(f, B5.moveOn - 4, B5.moveOn + 4))},
  };
};
// growth: the bud from ~18 s; the time-lapse runs the days; then three clear milestones (DAY 7 / 14 / 21), the growth
// slowing into each and speeding between them
export const growAt5 = (f: number) => {
  if (f < B5.grow0) return 0.016 + 0.164 * ease(f, B5.back, B5.newHeart, (u) => u * (2 - u));
  if (f < B5.m14) return lerp(0.18, 0.56, E(f, B5.grow0, B5.m14));
  return lerp(0.56, 1, E(f, B5.m14, B5.m21));
};
export const dayAt5 = (f: number) => {
  if (f < B5.week0) return 0;
  if (f < B5.grow0) return 1 + 6 * ease(f, B5.week0, B5.newHeart);
  if (f < B5.m14) return 7 + 7 * E(f, B5.grow0, B5.m14);
  return 14 + 7 * E(f, B5.m14, B5.m21);
};
const WALK0 = B5.m21 + 4;
const walked = (f: number) => (f <= WALK0 ? 0 : 0.6 * (f - WALK0) - 0.6 * 8 * (1 - Math.exp(-(f - WALK0) / 8)));
const regen5 = (f: number, o: Partial<Piece> = {}): Piece => ({
  id: 'regen', path: PHS, tip: TIP_SEA + 5 * ease(f, B5.moveOn, B5.back + 10) + walked(f), a0: 0, a1: 100, gap: 0, pinch: 1, seal: 1, t: f / 30,
  grow: growAt5(f), green: 0.85 * (1 - E(f, B5.m21 - 10, B5.grow1)), style: V5, ...o,
});
const feedState = (f: number): State2 => {
  const lab = paraState(B5.feed - 1);
  const head = seaHead(f);
  const snout = geo(head).at(1, 0, 4);
  const lhc = geo(lab.pieces[1]).at(9, 0, 3.5), sh = geo(head).at(9, 0, 3.5);
  const m: Orbit = {...lab.orbit, target: [lab.orbit.target[0] - lhc[0] + sh[0], lab.orbit.target[1] - lhc[1] + sh[1], lab.orbit.target[2]], az: lab.orbit.az - headAz(PH2, lab.pieces[1].tip - 9) + PHS_AZ};
  const contact = rel([snout[0] + 0.5, snout[1] + 2, 4.5], PHS_AZ, -84, 14, 54, 3300, 1040);
  const rear = rel(geo(head).at(20, 0, 4), PHS_AZ, -118, 30, 90, 3300, 1020);
  let orbit = lerpOrbit(m, contact, E(f, B5.feed + 2, B5.contact + 4));
  orbit = lerpOrbit(orbit, rear, E(f, B5.moveOn, B5.week0 + 12));
  const pieces = f < B5.back ? [head] : [regen5(f, {rear: head.rear, green: head.green, crawl: head.crawl, crawlAmp: (head.crawlAmp ?? 0) * (1 - ease(f, B5.week0 - 2, B5.week0 + 8))})];
  const drain = ease(f, B5.contact + 2, B5.moveOn + 4, (u) => u * (2 - u));
  const lapse = ease(f, B5.week0 - 2, B5.week0 + 3);
  return {
    shot: 'F', env: 'sea', seaVivid: true, orbit, pieces, feed: {u: 0.02, drain, down: true, flow: ease(f, B5.contact + 2, B5.contact + 7) * (1 - ease(f, B5.moveOn - 4, B5.moveOn + 2))}, lapse,
    night: lapse * 0.2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B5.week0, B5.newHeart))),
    labels: [{text: `TIME-LAPSE · DAY ${Math.max(1, Math.round(dayAt5(f)))}`, op: ease(f, B5.week0, B5.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 19.0-21.5 s: a new heart
export const beat5 = (f: number) => {
  const one = (f0: number) => (f < f0 ? 0 : 1.6 * Math.pow(Math.sin(Math.PI * clamp((f - f0) / 9)), 2));
  return Math.max(one(B5.beat), one(B5.beat2)) + (f > B5.beat2 + 10 ? 0.5 * beatAt(f, B5.beat2 + 10, BEAT_PER5) : 0);
};
const heartState = (f: number): State2 => {
  const from = feedState(B5.week0 + 12).orbit;
  const open = E(f, B5.win2, B5.win2 + 10) * (1 - E(f, B5.beat2 + 9, B5.grow0 + 8));
  const hv = ease(f, B5.win2 + 2, B5.newHeart + 8);
  const p = regen5(f, {heart: hv, beat: beat5(f), win: {a: 0, r: 34, open}});
  p.win!.a = heartAOf(p);
  const hc = geo(p).at(p.win!.a, 0, 5);
  const close: Orbit = rel(hc, PHS_AZ, -100, 34, 46, 3300 * 1.3, 920);
  const closer: Orbit = rel(hc, PHS_AZ, -84, 40, 38, 3300 * 1.3, 940);
  let orbit = lerpOrbit(from, close, E(f, B5.week0 + 8, B5.newHeart));
  orbit = lerpOrbit(orbit, closer, E(f, B5.newHeart, B5.beat2));
  const lapse = ease(f, B5.week0 - 2, B5.week0 + 3);
  return {
    shot: 'N', env: 'sea', seaVivid: true, orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true}, lapse, frondFade: 0.6 * open,
    // the surroundings drop away a little while the heart forms and beats (local contrast on the heart)
    night: Math.max(lapse * 0.2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B5.week0, B5.newHeart))), 0.22 * open),
    labels: [{text: `TIME-LAPSE · DAY ${Math.round(dayAt5(f))}`, op: ease(f, B5.week0, B5.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 21.5-25.0 s: the body grows back
const growState = (f: number): State2 => {
  const settle = 1 - E(f, B5.grow1 - 6, B5.end0 - 2);
  const winOpen = 0.65 * E(f, B5.grow0, B5.grow0 + 8) * (1 - E(f, B5.m14 - 6, B5.m14 + 10));
  const walking = ease(f, WALK0, WALK0 + 8);
  const p = regen5(f, {crawl: (2 * Math.PI * f) / (walking > 0.5 ? 18 : 9), crawlAmp: lerp(0.5 * settle, 1.3, walking), surge: 0.03 * walking * Math.cos((2 * Math.PI * f) / 18), sway: 1.4, bend: 0.25 * Math.sin(f / 9) * settle, heart: 1, beat: 0.6 * beatAt(f, B5.beat2 + 10, BEAT_PER5), win: {a: 50, r: 34, open: winOpen}});
  const from = heartState(B5.grow0 - 1).orbit;
  const mid = (a: number) => geo(p).at(a, 0, 4);
  const v7 = rel(mid(20), PHS_AZ, -112, 18, 100, 3300, 1000);
  const v14 = rel(mid(36), PHS_AZ, -150, 52, 190, 3300, 980);
  const v21 = rel(mid(40), PHS_AZ, -36, 26, 240, 3300, 960);
  let orbit = lerpOrbit(from, v7, E(f, B5.grow0 - 4, B5.grow0 + 14));
  orbit = lerpOrbit(orbit, v14, E(f, B5.m14 - 16, B5.m14 + 6));
  orbit = lerpOrbit(orbit, v21, E(f, B5.m21 - 16, B5.m21 + 8));
  const run = 1 - ease(f, B5.grow1 - 6, B5.grow1 + 2);
  return {
    shot: 'G', env: 'sea', seaVivid: true, orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true, gone: E(f, B5.grow0, B5.m14)}, lapse: run, frondFade: 0.6 * (1 - E(f, B5.grow0, B5.grow0 + 10)),
    night: run * 0.18 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B5.grow0, B5.grow1))),
    labels: [{text: `TIME-LAPSE · DAY ${Math.round(dayAt5(f))}`, op: 1 - ease(f, B5.grow1 + 2, B5.grow1 + 8), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 25.0 s - end: the same animal does it again
// A: matched cut on the regrown slug to the bright lab dish; it glides, whole. B ("actually did it"): LATER; it grips
// with its foot, the head pulls forward and the neck narrows. C ("TWICE"): the neck draws out to a thread and the gap
// opens. D (0.33 s after "TWICE"): the thread parts, both ends round over, and the head glides off on its own, the
// body left behind. E: from here the ending IS the separation model at tau = f - BRK_E and the hook camera, so the last
// frame flows into frame 0 (tau = TAU0): the opening's detached head, already moving.
const gapEnd = (f: number) => (f < B5.pull2 ? 0 : GBRK * Math.pow(clamp((f - B5.pull2) / (BRK_E - B5.pull2)), 1.4));
const BODY_IN = S0 - 26;
const loopPieces = (f: number): Piece[] => {
  const tl = (f - B5.end) / 30;
  if (f >= BRK_E) return [sepBody(f - BRK_E, tl), sepHead(f - BRK_E, tl)];
  const gap = gapEnd(f);
  const glide = ease(f, B5.end0, B5.pull2, (u) => u * (2 - u));
  const bodyTip = lerp(BODY_IN, S0, glide);
  const draw = 0.45 * ease(f, B5.did - 2, B5.did + 12);
  return [{
    id: 'whole', path: PH2, tip: bodyTip + gap, a0: 0, a1: 100, gap, pinch: Math.max(draw, pinch5(gap)), t: tl, style: V5,
    crawl: (2 * Math.PI * (f - B5.end)) / 18, crawlAmp: lerp(1.2, 0.5, ease(f, B5.pull2 - 14, B5.pull2 + 6)),
  }];
};
const loopState = (f: number): State2 => {
  const tl = (f - B5.end) / 30;
  const pieces = loopPieces(f);
  // A: the regrowth's last camera re-expressed relative to the animal (matched cut)
  const sea = growState(B5.end0 - 1);
  const lab0 = pieces[0].id === 'whole' ? pieces[0] : loopPieces(BRK_E - 1)[0];
  const sp = geo(sea.pieces[0]).at(40, 0, 4), lp = geo(lab0).at(40, 0, 4);
  const m: Orbit = {...sea.orbit, target: [sea.orbit.target[0] - sp[0] + lp[0], sea.orbit.target[1] - sp[1] + lp[1], sea.orbit.target[2]], az: sea.orbit.az - PHS_AZ + headAz(PH2, lab0.tip - 40)};
  // B-C: close side view on the neck as it narrows and draws out
  // (aimed between the head and the neck, so the whole head stays in frame as it pulls away)
  const nk = geo(lab0).at(13, 0, 4.5);
  const neck = rel(nk, headAz(PH2, lab0.tip - 13), -80, 20, 160, 3300, 1020);
  // D-E: into the hook camera for the separated pair (exact from BRK_E + 12)
  const hook = hookOrbit(f - B5.end, pieces.length > 1 ? pieces[1] : sepHead(0, tl, lab0.tip), pieces.length > 1 ? pieces[0] : sepBody(0, tl));
  let orbit = lerpOrbit(m, neck, E(f, B5.later, B5.pull2 + 6));
  orbit = lerpOrbit(orbit, hook, E(f, BRK_E - 10, BRK_E + 12));
  return {
    shot: 'T', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS5, props: PROPS, dim: 0, loopT: tl,
    trail: f >= BRK_E ? {path: PH2, from: S0 - 20 + GBRK, to: pieces[1].tip - 21, op: 0.5 * ease(f, BRK_E, BRK_E + 14), w: 0.45} : undefined,
    labels: [
      {text: 'WEEKS LATER', op: seg(f, B5.later, B5.later + 4) * (1 - seg(f, B5.twice - 8, B5.twice - 2)), icon: 'ff'},
      {text: 'TIME-LAPSE', op: ease(f, B5.twice - 4, B5.twice + 4), icon: 'ff'},
    ],
  };
};

export const stateAt5 = (f: number): State2 => {
  if (f < B5.body) return hookState(f);
  if (f < B5.anat) return bodyState(f);
  if (f < B5.micro + 14) return anatomyState(f);
  if (f < B5.feed) return paraState(f);
  if (f < B5.week0 + 12) return feedState(f);
  if (f < B5.grow0) return heartState(f);
  if (f < B5.end0) return growState(f);
  return loopState(f);
};

/** the picture's event frames for the sound (tools/export_cues_v5.ts -> audio/cues_v5.json), V2 layout + V5 */
export const CUES5 = () => {
  const days: number[] = [];
  let last = 0;
  for (let f = B5.week0; f < B5.end0; f++) {
    const d = Math.round(dayAt5(f));
    if (d !== last && last > 0) days.push(f);
    last = d;
  }
  return {
    frames: FRAMES,
    S: {hook: 0, body: B5.body, weak: B5.anat, para: B5.micro, feed: B5.feed, heart: B5.week0, grow: B5.grow0, twice: B5.end0, end: FRAMES},
    // the separation of the loop happens at BRK_E; the mixer places 'brk' modulo the film, so it is given relative to
    // frame 0 (negative) and the stretch runs from pull2 up to it
    brk: BRK_E - FRAMES, touch: B5.touch, move: B5.move, ripple: B5.touch + 4, rew0: B5.anat, rew1: B5.rew1, join: B5.win0, weak: B5.weak,
    brk2start: B5.pull, brk2: B5.part, in0: B5.tissue, in1: B5.micro + 14, para: B5.bugs, out0: B5.out0, out1: B5.chase,
    arrive: B5.contact, suck: B5.contact + 2, pumpPer: 11, moveOn: B5.moveOn, week0: B5.week0, newHeart: B5.newHeart, beat: B5.beat, beatPer: BEAT_PER5,
    did: B5.did, twice: B5.twice, loopGap0: B5.pull2, brkE: BRK_E, days,
  };
};
