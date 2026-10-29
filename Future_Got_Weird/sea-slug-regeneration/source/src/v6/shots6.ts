// V6: the film as a pure function of the frame. A new structure around one deterministic event model:
//   the separated pair (head + abandoned body) as a function of tau = frames since the neck parted.
// The film OPENS on the result (tau = TAU0: the head already gliding away from its headless body) and ENDS on the same
// animal, regrown, separating again: the neck narrows, draws out and parts at BRK_E, and from then on the ending uses
// the very same model, so its last frame is the hook's frame -1 and the replay continues the same motion.
// Same rig (V6 design style), sets and narration as V4; events sit on the words (F('word', n)).
import {F, FRAMES, clamp, ease, lerp, outCubic, seg} from '../lib';
import {Path} from '../geo';
import {Orbit, V3, lerpOrbit, orbitCam} from '../kit/three';
import {Piece, geo, heartAOf} from '../v2/slug/body';
import {HOOK_FRAGS, PH2, PHS, S0, State2, beatAt} from '../v2/shots2';
import {Frag} from '../v2/sets/Lab2';

const smooth3 = (u: number) => u * u * (3 - 2 * u);
const E = (f: number, a: number, b: number) => ease(f, a, b, smooth3);
const V6: Piece['style'] = 'v6';

// ---------------------------------------------------------------- beats (frames at 30 fps), from the words
export const B6 = {
  body: F('and', 1) + 2, touch: F('body') + 1, angle2: F('body') + 12, move: F('moving'), toNeck: F('too') + 2,
  anat: F('you') + 4, rew1: F('you') + 14, win0: F('see') + 2, weak: F('weak') - 2, pull: F('just') + 2, part: F('breaks') + 1,
  heart: F('heart', 1), tissue: F('behind', 2) + 6, micro: F('scientists') - 6, bugs: F('escaping') - 4, out0: F('old') - 6, chase: F('body', 2) - 4,
  feed: F('but'), contact: F('head', 4) + 6, moveOn: F('algae') + 6, back: F('and', 2) - 2,
  week0: F('and', 2) + 2, win2: F('a', 3) - 18, newHeart: F('new'), beat: F('beating'), beat2: F('beating') + 16,
  grow0: F('then') + 6, m14: F('entire') - 4, m21: F('body', 3) - 2, grow1: F('back') - 4,
  end0: F('and', 3), later: F('actually') - 2, did: F('actually'), pull2: F('actually') + 10, twice: F('twice'),
  end: FRAMES,
};
export const CUTS6 = [B6.feed, B6.end0];
export const BEAT_PER6 = B6.beat2 - B6.beat;

// ---------------------------------------------------------------- the separation model
export const GBRK = 22; // the neck parts when the head has pulled 22 units ahead
export const BRK_E = B6.twice + 10; // the second separation completes 0.33 s after "TWICE" begins
export const TAU0 = FRAMES - BRK_E; // frame 0 is TAU0 frames after a separation (the ending's)
/** neck pinch for a given pull (0 open .. 1 parted) */
export const pinch6 = (gap: number) => clamp(gap <= 6 ? (0.45 * gap) / 6 : 0.45 + (0.55 * (gap - 6)) / (GBRK - 6));
const vHead = (tau: number) => 0.62 * ease(tau, 0, 8) * (1 + 0.3 * Math.sin((2 * Math.PI * tau) / 18));
const TR: number[] = [0];
for (let k = 1; k <= TAU0 + B6.feed + 4; k++) TR.push(TR[TR.length - 1] + vHead(k));
const travel = (tau: number) => TR[clamp(Math.round(tau), 0, TR.length - 1)];
/** the separated head tau frames after the break (time t in seconds, for the rhinophores and margins) */
const sepHead = (tau: number, t: number, tip?: number): Piece => {
  const go = ease(tau, 0, 6), cr = (2 * Math.PI * tau) / 18;
  return {
    id: 'head', path: PH2, tip: tip ?? S0 + GBRK + travel(tau), a0: 0, a1: 22, gap: GBRK * (1 - ease(tau, 0, 9, outCubic)), pinch: 1, seal: ease(tau, 0, 7, outCubic), t, style: V6,
    crawl: cr, crawlAmp: 1.3 * go, surge: 0.035 * go * Math.cos(cr), sway: 1.5,
  };
};
type BodyMods = Partial<Pick<Piece, 'flinch' | 'bend' | 'twitch' | 'ripple' | 'win' | 'heart' | 'beat'>>;
const sepBody = (tau: number, t: number, m: BodyMods = {}): Piece => {
  const gB = GBRK * (1 - ease(tau, 0, 8, outCubic));
  // it recoils as the thread parts (it was holding against the pull), then lies still
  const fl = 0.3 * Math.sin(Math.PI * seg(tau, 0, 14)) ** 2;
  return {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: ease(tau, 0, 7, outCubic), t: t * 0.6, style: V6, flinch: fl, bend: fl * 2, ...m};
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
// no stones (they read as distracting grey balls): two patches of algae turf on the dish floor are the surface features
// the head passes, at 0.2-0.6 s (beside it) and 1.6-2.3 s (it glides along their edge)
const tuft = (c: V3, seed: number, n = 7, r = 6): Frag[] =>
  Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2 + seed;
    return {c: [c[0] + Math.cos(a) * r * (0.4 + 0.6 * ((k * 37) % 10) / 10), c[1] + Math.sin(a) * r * 0.8, 0] as V3, ang: a + 0.6, len: 8 + (k % 3) * 2, seed: seed * 10 + k};
  });
const TURF1: V3 = onPath(hs(12) + 6, 12, 0), TURF2: V3 = onPath(hs(62) + 4, -11, 0);
export const FRAGS6: Frag[] = [...tuft(TURF1, 3), ...tuft(TURF2, 5, 9, 7), ...HOOK_FRAGS.slice(2)];
const PROPS: NonNullable<State2['props']> = [];

// ---------------------------------------------------------------- 0-4.3 s: the result, first
// Frame 0: a close, slightly elevated macro; the detached head big in the foreground (about a third of the frame
// width) gliding away from its much larger headless body behind it. 0.2-0.6 s it passes the first algae patch (the
// camera holds steady). 0.6-1.0 s down to a low side view. 1.0-1.6 s pull back: the tiny head and the huge body in one
// frame. 1.6-2.3 s close again as it glides along the second patch. 2.3-3.0 s the view turns toward the body (the head
// still in frame). 3.0-4.3 s the body becomes the subject.
/** the hook's camera for a head/body pair, by hook frame (negative frames give the first view) */
const hookOrbit = (f: number, head: Piece, body: Piece): Orbit => {
  const hc = geo(head).at(9, 0, 3.6), bc = geo(body).at(52, 0, 4);
  const hAz = headAz(PH2, head.tip - 9), lAz = lineAz(bc, hc);
  const ahead = (k: number): V3 => {
    const q = geo(head).at(9 - k, 0, 3.6);
    return q;
  };
  const k0 = rel(mid3(hc, bc, 0.3), lAz, -40, 28, 132, 3150, 1060);
  const k1 = rel(ahead(5), hAz, -84, 10, 92, 3150, 1060);
  const k2 = rel(mid3(hc, bc, 0.55), lAz, -16, 42, 280, 3150, 880);
  const k3 = rel(hc, hAz, -122, 16, 88, 3150, 1080);
  const k4 = rel(mid3(hc, bc, 0.45), lAz, -34, 26, 235, 3150, 1040);
  const k5 = rel(bc, lAz, -52, 32, 165, 3300, 1020);
  let o = lerpOrbit(k0, k1, E(f, 18, 30));
  o = lerpOrbit(o, k2, E(f, 30, 46));
  o = lerpOrbit(o, k3, E(f, 46, 62));
  o = lerpOrbit(o, k4, E(f, 68, 88));
  o = lerpOrbit(o, k5, E(f, 92, 124));
  return o;
};
const hookState = (f: number): State2 => {
  const pieces = [labBody(f), labHead(f)];
  const [body, head] = pieces;
  const orbit = hookOrbit(f, head, body);
  // it lifts and turns its front a little as it meets the second algae patch
  const sense = 0.35 * Math.sin(Math.PI * seg(f, 50, 72));
  head.rear = sense;
  const blur = {head: 6 * E(f, 96, B6.body + 6), body: 2 * E(f, 16, 26) * (1 - E(f, 30, 40))};
  return {
    shot: 'H', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS6, blur, props: PROPS, dim: 0,
    trail: {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.5, w: 0.45},
    labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, 30, 38), icon: 'ff'}],
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
const closeOn = () => rel(geo(labBody(B6.touch)).at(52, 0, 4), headAz(PH2, S0 - 40), -60, 40, 150, 3400, 1040);
const probeAt = (f: number): State2['probe'] => {
  if (f < B6.body || f > B6.touch + 40) return undefined;
  const contact = geo(labBody(f)).tube(60, Math.PI / 2 - 0.55 * (NEAR_SIDE || 1));
  const inn = ease(f, B6.body, B6.touch, outCubic), away = ease(f, B6.touch + 6, B6.touch + 30);
  const back = 70 * (1 - inn) + 60 * away;
  const press = clamp(seg(f, B6.touch - 2, B6.touch + 1)) * (1 - seg(f, B6.touch + 3, B6.touch + 7));
  const k = back + 0.5 - press * 1.4;
  return {tip: [contact[0] + PDIR[0] * k, contact[1] + PDIR[1] * k, contact[2] + PDIR[2] * k], dir: PDIR, press, op: clamp(seg(f, B6.body, B6.body + 4)) * (1 - seg(f, B6.touch + 26, B6.touch + 36))};
};
const bodyState = (f: number): State2 => {
  const tw = f < B6.touch ? 0 : outCubic(seg(f, B6.touch, B6.touch + 4)) * (1 - 0.8 * ease(f, B6.touch + 8, B6.touch + 30));
  const heave = Math.sin(Math.PI * seg(f, B6.move - 6, B6.move + 18)) ** 2;
  const ra = lerp(60, 28, ease(f, B6.touch + 4, B6.toNeck, (u) => u));
  const ramp = ease(f, B6.touch + 2, B6.touch + 10) * (1 - ease(f, B6.toNeck - 4, B6.anat));
  const fl = 0.35 * tw + 0.5 * heave;
  if (!NEAR_SIDE) NEAR_SIDE = nearSideOf(closeOn(), labBody(B6.touch));
  const pieces = [labBody(f, {flinch: fl, bend: 1.5 * fl - 1.6 * heave, twitch: {side: NEAR_SIDE, a: 60, amp: clamp(tw + 0.6 * heave)}, ripple: {a: ra, amp: (0.8 + 0.6 * heave) * ramp}}), labHead(f)];
  const body = pieces[0];
  const hAz = headAz(PH2, S0 - 40);
  const from = hookState(B6.body - 1).orbit;
  const above = rel(geo(body).at(46, 0, 4), hAz, -150, 64, 170, 3400, 980);
  const neck = rel(geo(body).at(25, 0, 4.5), hAz, -110, 40, 110, 3500, 1000);
  let orbit = lerpOrbit(from, closeOn(), E(f, B6.body - 2, B6.touch - 2));
  orbit = lerpOrbit(orbit, above, E(f, B6.angle2, B6.move + 2));
  orbit = lerpOrbit(orbit, neck, E(f, B6.toNeck - 6, B6.anat + 6));
  const head = pieces[1];
  return {
    shot: 'B', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS6, blur: {head: 8}, probe: probeAt(f), props: PROPS, dim: darkIn(f),
    trail: {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.5, w: 0.45}, labels: [],
  };
};

// ---------------------------------------------------------------- 7.3-12.5 s: how it happened (Environment B, dark)
// The lab darkens to the deep-teal anatomy grade. REWIND: the head runs back along its trail and rejoins. The skin over
// the neck and front body clears: gland, gut, buccal mass and ganglia, and behind the neck the heart pumping in its
// sac; a pale band marks the weak spot. TIME-LAPSE: the head pulls, the band draws out, the neck parts on "breaks"; the
// head glides away up the frame while the heart beats on in the body in the foreground.
const ST_: number[] = [0];
for (let f = B6.part + 1; f <= B6.feed + 2; f++) ST_.push(ST_[ST_.length - 1] + 0.42 * (1 + 0.3 * Math.sin((2 * Math.PI * (f - B6.part)) / 18)));
const secHead = (f: number) => S0 + GBRK + ST_[clamp(Math.round(f - B6.part), 0, ST_.length - 1)];
const beatOld = (f: number) => beatAt(f, 120, 22) * (1 + 0.5 * Math.exp(-Math.pow((f - B6.heart - 4) / 6, 2)));
const winOf = (open: number): Piece['win'] => ({a: 24, r: 17, open});
const DARK = 0.86;
const darkIn = (f: number) => DARK * E(f, B6.toNeck, B6.anat + 8);
const anatomyPieces = (f: number): Piece[] => {
  const t = f / 30;
  const open = E(f, B6.win0 - 2, B6.win0 + 12);
  const weak = E(f, B6.weak, B6.weak + 6) * (1 - E(f, B6.part - 2, B6.part + 5));
  if (f < B6.rew1) {
    const k = E(f, B6.anat, B6.rew1);
    const tip = lerp(labHead(B6.anat).tip, S0 + GBRK, k);
    return [labBody(B6.anat), {...labHead(f, tip), gap: GBRK * k, seal: 1 - k, crawl: -((2 * Math.PI * f) / 18) * 2, crawlAmp: 0.6 * (1 - k)}];
  }
  if (f < B6.part) {
    const reform = ease(f, B6.rew1, B6.rew1 + 4);
    const gap = GBRK * (1 - reform) + GBRK * E(f, B6.pull, B6.part);
    return [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinch6(gap), t, heart: 1, beat: beatOld(f), win: winOf(open), weak, style: V6}];
  }
  const gH = GBRK * (1 - ease(f, B6.part, B6.part + 9, outCubic)), gB = GBRK * (1 - ease(f, B6.part, B6.part + 8, outCubic));
  const sl = ease(f, B6.part, B6.part + 7, outCubic), cr = (2 * Math.PI * (f - B6.part)) / 18;
  return [
    {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, heart: 1, beat: beatOld(f), win: winOf(open), style: V6},
    {id: 'head', path: PH2, tip: secHead(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: sl, t, crawl: cr, crawlAmp: 1.2 * ease(f, B6.part, B6.part + 6), win: winOf(open), style: V6},
  ];
};
const anatomyState = (f: number): State2 => {
  const pieces = anatomyPieces(f);
  const from = bodyState(B6.anat - 1).orbit;
  const hAz = headAz(PH2, S0 - 20);
  const neck = onPath(S0 - 22, 0, 5);
  const win: Orbit = rel(neck, hAz, -146, 36, 100, 3200, 900);
  let orbit = lerpOrbit(from, rel(onPath(S0 - 24, 0, 5), hAz, -128, 36, 126, 3300, 960), E(f, B6.anat, B6.rew1));
  orbit = lerpOrbit(orbit, win, E(f, B6.rew1 - 4, B6.win0 + 12));
  const wk = E(f, B6.weak - 4, B6.weak + 10) * (1 - E(f, B6.pull, B6.pull + 20));
  orbit = {...orbit, d: orbit.d * (1 - 0.22 * wk)};
  if (f >= B6.part) {
    const hd = geo(pieces[1]).at(10, 0, 4);
    const k = E(f, B6.part, B6.tissue) * 0.2;
    orbit = {...orbit, target: [lerp(orbit.target[0], hd[0], k), lerp(orbit.target[1], hd[1], k), 5], cy: lerp(orbit.cy ?? 960, 990, k / 0.2)};
  }
  if (f > B6.tissue) {
    const tc = geo(pieces[0]).at(36, 0.3, 5);
    orbit = lerpOrbit(orbit, rel(tc, hAz, -140, 40, 96, 3200 * 5, 960), ease(f, B6.tissue, B6.micro + 14, (u) => u * u * u));
  }
  const rew = seg(f, B6.anat, B6.anat + 2) * (1 - seg(f, B6.rew1, B6.rew1 + 6));
  const tl = seg(f, B6.pull - 2, B6.pull + 4) * (1 - seg(f, B6.part + 10, B6.part + 16));
  return {
    shot: 'A', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS6, dim: darkIn(f), micro: f > B6.micro - 10 ? microAt(f) : undefined, microV5: true,
    labels: [{text: 'REWIND', op: rew, icon: 'rw'}, {text: 'TIME-LAPSE', op: tl, icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 12.5-16.3 s: the parasite hypothesis
const microAt = (f: number): State2['micro'] => {
  const op = ease(f, B6.micro - 10, B6.micro + 2) * (1 - ease(f, B6.out0 + 4, B6.out0 + 16));
  if (op <= 0) return undefined;
  const zIn = 0.75 + 0.6 * ease(f, B6.micro - 10, B6.out0, (u) => u);
  const zOut = ease(f, B6.out0, B6.out0 + 16);
  return {
    op, reveal: ease(f, B6.micro - 10, B6.micro + 4), para: ease(f, B6.bugs - 6, B6.bugs + 6), zoom: zIn * lerp(1, 0.45, zOut),
    swim: Math.max(0, (f - B6.bugs) / 30), bar: ease(f, B6.bugs, B6.bugs + 8) * (1 - zOut), pan: 240 * ease(f, B6.micro, B6.out0, (u) => u),
  };
};
const paraState = (f: number): State2 => {
  const a = anatomyState(Math.min(f, B6.micro + 14));
  const pieces = anatomyPieces(f).map((p) => ({...p, win: winOf(1 - E(f, B6.out0 + 6, B6.chase + 4))}));
  const head = pieces[1];
  const hc = geo(head).at(9, 0, 3.5);
  const out = E(f, B6.out0, B6.chase);
  const bt = geo(pieces[0]).at(31, 0, 5);
  const wide = rel([(bt[0] + hc[0]) / 2, (bt[1] + hc[1]) / 2, 4], headAz(PH2, S0 - 20), -150, 50, 270, 3200, 980);
  const chase = rel([hc[0], hc[1], 3.5], headAz(PH2, head.tip - 9), -100, 22, 104, 3150, 1040);
  let orbit = lerpOrbit(a.orbit, wide, out);
  orbit = lerpOrbit(orbit, chase, E(f, B6.chase - 6, B6.feed));
  const hyp = ease(f, B6.bugs + 4, B6.bugs + 12) * (1 - ease(f, B6.out0 + 2, B6.out0 + 10));
  return {shot: 'P', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS6, dim: lerp(DARK, 0.55, out), micro: microAt(f), microV5: true, labels: [{text: 'HYPOTHESIS', op: hyp, icon: 'none'}]};
};

// ---------------------------------------------------------------- 16.3-19.0 s: feeding (Environment C, the seabed)
export const TIP_SEA = 124.4;
const PHS_AZ = headAz(PHS, 120);
const crawlAt = (f: number) => (2 * Math.PI * f) / 18;
const pumpAt = (f: number) => (f > B6.contact + 2 && f < B6.moveOn ? 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - B6.contact - 2)) / 11) : 0);
const seaHead = (f: number): Piece => {
  const t = f / 30;
  const arrive = ease(f, B6.feed, B6.contact, outCubic);
  const on = ease(f, B6.moveOn, B6.back + 10);
  const pm = pumpAt(f);
  const go = Math.max(1 - ease(f, B6.contact - 6, B6.contact + 2), on);
  return {
    id: 'head', path: PHS, tip: lerp(TIP_SEA - 8, TIP_SEA, arrive) + 0.5 * pm + 5 * on, a0: 0, a1: 22, gap: 0, pinch: 1, seal: 1, t, style: V6,
    crawl: crawlAt(f), crawlAmp: 1.2 * go, surge: 0.025 * pm, rear: 0.5 * ease(f, B6.contact - 8, B6.contact + 2) * (1 - on),
    green: 0.85 * ease(f, B6.contact + 4, B6.back), pump: pm, win: {a: 5, r: 7, open: ease(f, B6.contact, B6.contact + 6) * (1 - ease(f, B6.moveOn - 4, B6.moveOn + 4))},
  };
};
// growth: the bud from ~18 s; the time-lapse runs the days; then three clear milestones (DAY 7 / 14 / 21), the growth
// slowing into each and speeding between them
export const growAt6 = (f: number) => {
  if (f < B6.grow0) return 0.016 + 0.164 * ease(f, B6.back, B6.newHeart, (u) => u * (2 - u));
  if (f < B6.m14) return lerp(0.18, 0.56, E(f, B6.grow0, B6.m14));
  return lerp(0.56, 1, E(f, B6.m14, B6.m21));
};
export const dayAt6 = (f: number) => {
  if (f < B6.week0) return 0;
  if (f < B6.grow0) return 1 + 6 * ease(f, B6.week0, B6.newHeart);
  if (f < B6.m14) return 7 + 7 * E(f, B6.grow0, B6.m14);
  return 14 + 7 * E(f, B6.m14, B6.m21);
};
const WALK0 = B6.m21 + 4;
const walked = (f: number) => (f <= WALK0 ? 0 : 0.6 * (f - WALK0) - 0.6 * 8 * (1 - Math.exp(-(f - WALK0) / 8)));
const regen6 = (f: number, o: Partial<Piece> = {}): Piece => ({
  id: 'regen', path: PHS, tip: TIP_SEA + 5 * ease(f, B6.moveOn, B6.back + 10) + walked(f), a0: 0, a1: 100, gap: 0, pinch: 1, seal: 1, t: f / 30,
  grow: growAt6(f), green: 0.85 * (1 - E(f, B6.m21 - 10, B6.grow1)), style: V6, ...o,
});
const feedState = (f: number): State2 => {
  const lab = paraState(B6.feed - 1);
  const head = seaHead(f);
  const snout = geo(head).at(1, 0, 4);
  const lhc = geo(lab.pieces[1]).at(9, 0, 3.5), sh = geo(head).at(9, 0, 3.5);
  const m: Orbit = {...lab.orbit, target: [lab.orbit.target[0] - lhc[0] + sh[0], lab.orbit.target[1] - lhc[1] + sh[1], lab.orbit.target[2]], az: lab.orbit.az - headAz(PH2, lab.pieces[1].tip - 9) + PHS_AZ};
  const contact = rel([snout[0] + 0.5, snout[1] + 2, 4.5], PHS_AZ, -84, 14, 54, 3300, 1040);
  const rear = rel(geo(head).at(20, 0, 4), PHS_AZ, -118, 30, 90, 3300, 1020);
  let orbit = lerpOrbit(m, contact, E(f, B6.feed + 2, B6.contact + 4));
  orbit = lerpOrbit(orbit, rear, E(f, B6.moveOn, B6.week0 + 12));
  const pieces = f < B6.back ? [head] : [regen6(f, {rear: head.rear, green: head.green, crawl: head.crawl, crawlAmp: (head.crawlAmp ?? 0) * (1 - ease(f, B6.week0 - 2, B6.week0 + 8))})];
  const drain = ease(f, B6.contact + 2, B6.moveOn + 4, (u) => u * (2 - u));
  const lapse = ease(f, B6.week0 - 2, B6.week0 + 3);
  return {
    shot: 'F', env: 'sea', seaVivid: true, orbit, pieces, feed: {u: 0.02, drain, down: true, flow: ease(f, B6.contact + 2, B6.contact + 7) * (1 - ease(f, B6.moveOn - 4, B6.moveOn + 2))}, lapse,
    night: lapse * 0.2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B6.week0, B6.newHeart))),
    labels: [{text: `TIME-LAPSE · DAY ${Math.max(1, Math.round(dayAt6(f)))}`, op: ease(f, B6.week0, B6.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 19.0-21.5 s: a new heart
export const beat6 = (f: number) => {
  const one = (f0: number) => (f < f0 ? 0 : 1.6 * Math.pow(Math.sin(Math.PI * clamp((f - f0) / 9)), 2));
  return Math.max(one(B6.beat), one(B6.beat2)) + (f > B6.beat2 + 10 ? 0.5 * beatAt(f, B6.beat2 + 10, BEAT_PER6) : 0);
};
const openH = (f: number) => E(f, B6.win2, B6.win2 + 10) * (1 - E(f, B6.beat2 + 9, B6.grow0 + 8));
const heartState = (f: number): State2 => {
  const from = feedState(B6.week0 + 12).orbit;
  const open = openH(f);
  const hv = ease(f, B6.win2 + 2, B6.newHeart + 8);
  const p = regen6(f, {heart: hv, beat: beat6(f), win: {a: 0, r: 34, open}});
  p.win!.a = heartAOf(p);
  const hc = geo(p).at(p.win!.a, 0, 5);
  const close: Orbit = rel(hc, PHS_AZ, -100, 34, 46, 3300 * 1.3, 920);
  const closer: Orbit = rel(hc, PHS_AZ, -84, 40, 38, 3300 * 1.3, 940);
  let orbit = lerpOrbit(from, close, E(f, B6.week0 + 8, B6.newHeart));
  orbit = lerpOrbit(orbit, closer, E(f, B6.newHeart, B6.beat2));
  const lapse = ease(f, B6.week0 - 2, B6.week0 + 3);
  return {
    shot: 'N', env: 'sea', seaVivid: true, orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true}, lapse, frondFade: 0.6 * open,
    // the surroundings drop away a little while the heart forms and beats (local contrast on the heart)
    night: Math.max(lapse * 0.2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B6.week0, B6.newHeart))), 0.22 * open),
    labels: [{text: `TIME-LAPSE · DAY ${Math.round(dayAt6(f))}`, op: ease(f, B6.week0, B6.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 21.5-25.0 s: the body grows back
const growState = (f: number): State2 => {
  const settle = 1 - E(f, B6.grow1 - 6, B6.end0 - 2);
  const winOpen = Math.max(openH(f), 0.65 * E(f, B6.grow0, B6.grow0 + 8) * (1 - E(f, B6.m14 - 6, B6.m14 + 10)));
  const walking = ease(f, WALK0, WALK0 + 8);
  const p = regen6(f, {crawl: (2 * Math.PI * f) / (walking > 0.5 ? 18 : 9), crawlAmp: lerp(0.5 * settle, 1.3, walking), surge: 0.03 * walking * Math.cos((2 * Math.PI * f) / 18), sway: 1.4, bend: 0.25 * Math.sin(f / 9) * settle, heart: 1, beat: beat6(f), win: {a: 50, r: 34, open: winOpen}});
  p.win!.a = lerp(heartAOf(p), 50, E(f, B6.grow0, B6.grow0 + 20));
  const from = heartState(B6.grow0 - 1).orbit;
  const mid = (a: number) => geo(p).at(a, 0, 4);
  const v7 = rel(mid(20), PHS_AZ, -112, 18, 100, 3300, 1000);
  const v14 = rel(mid(36), PHS_AZ, -150, 52, 190, 3300, 980);
  const v21 = rel(mid(40), PHS_AZ, -36, 26, 240, 3300, 960);
  let orbit = lerpOrbit(from, v7, E(f, B6.grow0 - 4, B6.grow0 + 14));
  orbit = lerpOrbit(orbit, v14, E(f, B6.m14 - 16, B6.m14 + 6));
  orbit = lerpOrbit(orbit, v21, E(f, B6.m21 - 16, B6.m21 + 8));
  const run = 1 - ease(f, B6.grow1 - 6, B6.grow1 + 2);
  return {
    shot: 'G', env: 'sea', seaVivid: true, orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true, gone: E(f, B6.grow0, B6.m14)}, lapse: run, frondFade: 0.6 * openH(f),
    night: Math.max(run * 0.18 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B6.grow0, B6.grow1))), 0.22 * openH(f)),
    labels: [{text: `TIME-LAPSE · DAY ${Math.round(dayAt6(f))}`, op: 1 - ease(f, B6.grow1 + 2, B6.grow1 + 8), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 25.0 s - end: the same animal does it again
// A: matched cut on the regrown slug to the bright lab dish; it glides, whole. B ("actually did it"): LATER; it grips
// with its foot, the head pulls forward and the neck narrows. C ("TWICE"): the neck draws out to a thread and the gap
// opens. D (0.33 s after "TWICE"): the thread parts, both ends round over, and the head glides off on its own, the
// body left behind. E: from here the ending IS the separation model at tau = f - BRK_E and the hook camera, so the last
// frame flows into frame 0 (tau = TAU0): the opening's detached head, already moving.
const gapEnd = (f: number) => (f < B6.pull2 ? 0 : GBRK * Math.pow(clamp((f - B6.pull2) / (BRK_E - B6.pull2)), 1.4));
const BODY_IN = S0 - 26;
const loopPieces = (f: number): Piece[] => {
  const tl = (f - B6.end) / 30;
  if (f >= BRK_E) return [sepBody(f - BRK_E, tl), sepHead(f - BRK_E, tl)];
  const gap = gapEnd(f);
  const glide = ease(f, B6.end0, B6.pull2, (u) => u * (2 - u));
  const bodyTip = lerp(BODY_IN, S0, glide);
  const draw = 0.45 * ease(f, B6.did - 2, B6.did + 12);
  return [{
    id: 'whole', path: PH2, tip: bodyTip + gap, a0: 0, a1: 100, gap, pinch: Math.max(draw, pinch6(gap)), t: tl, style: V6,
    crawl: (2 * Math.PI * (f - B6.end)) / 18, crawlAmp: lerp(1.2, 0.5, ease(f, B6.pull2 - 14, B6.pull2 + 6)),
  }];
};
const loopState = (f: number): State2 => {
  const tl = (f - B6.end) / 30;
  const pieces = loopPieces(f);
  // A: the regrowth's last camera re-expressed relative to the animal (matched cut)
  const sea = growState(B6.end0 - 1);
  const lab0 = pieces[0].id === 'whole' ? pieces[0] : loopPieces(BRK_E - 1)[0];
  const sp = geo(sea.pieces[0]).at(40, 0, 4), lp = geo(lab0).at(40, 0, 4);
  const m: Orbit = {...sea.orbit, target: [sea.orbit.target[0] - sp[0] + lp[0], sea.orbit.target[1] - sp[1] + lp[1], sea.orbit.target[2]], az: sea.orbit.az - PHS_AZ + headAz(PH2, lab0.tip - 40)};
  // B-C: close side view on the neck as it narrows and draws out
  // (aimed between the head and the neck, so the whole head stays in frame as it pulls away)
  const nk = geo(lab0).at(13, 0, 4.5);
  const neck = rel(nk, headAz(PH2, lab0.tip - 13), -80, 20, 160, 3300, 1020);
  // D-E: into the hook camera for the separated pair (exact from BRK_E + 12)
  const hook = hookOrbit(f - B6.end, pieces.length > 1 ? pieces[1] : sepHead(0, tl, lab0.tip), pieces.length > 1 ? pieces[0] : sepBody(0, tl));
  let orbit = lerpOrbit(m, neck, E(f, B6.later, B6.pull2 + 6));
  orbit = lerpOrbit(orbit, hook, E(f, BRK_E - 10, BRK_E + 12));
  return {
    shot: 'T', env: 'lab', labTeal: true, orbit, pieces, frags: FRAGS6, props: PROPS, dim: 0, loopT: tl,
    trail: f >= BRK_E ? {path: PH2, from: S0 - 20 + GBRK, to: pieces[1].tip - 21, op: 0.5 * ease(f, BRK_E, BRK_E + 14), w: 0.45} : undefined,
    labels: [
      {text: 'WEEKS LATER', op: seg(f, B6.later, B6.later + 4) * (1 - seg(f, B6.twice - 8, B6.twice - 2)), icon: 'ff'},
      {text: 'TIME-LAPSE', op: ease(f, B6.twice - 4, B6.twice + 4), icon: 'ff'},
    ],
  };
};

export const stateAt6 = (f: number): State2 => {
  if (f < B6.body) return hookState(f);
  if (f < B6.anat) return bodyState(f);
  if (f < B6.micro + 14) return anatomyState(f);
  if (f < B6.feed) return paraState(f);
  if (f < B6.week0 + 12) return feedState(f);
  if (f < B6.grow0) return heartState(f);
  if (f < B6.end0) return growState(f);
  return loopState(f);
};

/** the picture's event frames for the sound (tools/export_cues_v6.ts -> audio/cues_v6.json), V2 layout + V6 */
export const CUES6 = () => {
  const days: number[] = [];
  let last = 0;
  for (let f = B6.week0; f < B6.end0; f++) {
    const d = Math.round(dayAt6(f));
    if (d !== last && last > 0) days.push(f);
    last = d;
  }
  return {
    frames: FRAMES,
    S: {hook: 0, body: B6.body, weak: B6.anat, para: B6.micro, feed: B6.feed, heart: B6.week0, grow: B6.grow0, twice: B6.end0, end: FRAMES},
    // the separation of the loop happens at BRK_E; the mixer places 'brk' modulo the film, so it is given relative to
    // frame 0 (negative) and the stretch runs from pull2 up to it
    brk: BRK_E - FRAMES, touch: B6.touch, move: B6.move, ripple: B6.touch + 4, rew0: B6.anat, rew1: B6.rew1, join: B6.win0, weak: B6.weak,
    brk2start: B6.pull, brk2: B6.part, in0: B6.tissue, in1: B6.micro + 14, para: B6.bugs, out0: B6.out0, out1: B6.chase,
    arrive: B6.contact, suck: B6.contact + 2, pumpPer: 11, moveOn: B6.moveOn, week0: B6.week0, newHeart: B6.newHeart, beat: B6.beat, beatPer: BEAT_PER6,
    did: B6.did, twice: B6.twice, loopGap0: B6.pull2, brkE: BRK_E, days,
  };
};
