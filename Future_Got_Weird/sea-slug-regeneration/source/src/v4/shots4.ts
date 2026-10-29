// V4: the film as a pure function of the frame, rebuilt around visible physical events. Same rig (V4 design style),
// sets and narration as V3; every event is placed on the words that describe it (F('word', n)).
// World units ~0.2 mm (the slug is 100 long). Cameras are kit orbits, mostly relative to a heading (rel 0 = in front
// of the animal looking back at it, -90 = from its left side). The two matched cuts (lab -> sea on the head at 16.3 s,
// sea -> lab on the regrown animal at 25.0 s) keep the subject where it was on screen.
import {F, FRAMES, clamp, ease, lerp, outCubic, seg} from '../lib';
import {Path} from '../geo';
import {Orbit, V3, lerpOrbit, orbitCam, unproj} from '../kit/three';
import {Piece, geo, heartAOf} from '../v2/slug/body';
import {HOOK_FRAGS, PH2, PHS, S0, State2, beatAt} from '../v2/shots2';
import {Frag} from '../v2/sets/Lab2';

const smooth3 = (u: number) => u * u * (3 - 2 * u);
const E = (f: number, a: number, b: number) => ease(f, a, b, smooth3);
const V4: Piece['style'] = 'v4';

// ---------------------------------------------------------------- beats (frames at 30 fps), from the words
export const B4 = {
  brk: 9, // the neck thread parts at 0.30 s (frame 0 is already drawn out to a thread: the loop continues into it)
  free: 15, low: 24, lat: 39, along: 60, front: 81, out: 102,
  body: F('and', 1) + 2, touch: F('body') + 1, angle2: F('body') + 12, move: F('moving'), toNeck: F('too') + 2,
  anat: F('you') + 4, rew1: F('you') + 14, win0: F('see') + 2, weak: F('weak') - 2, pull: F('just') + 2, part: F('breaks') + 1,
  heart: F('heart', 1), tissue: F('behind', 2) + 6, micro: F('scientists') - 6, bugs: F('escaping') - 4, out0: F('old') - 6, chase: F('body', 2) - 4,
  feed: F('but'), contact: F('head', 4) + 6, eat0: F('eating'), moveOn: F('algae') + 6, back: F('and', 2) - 2,
  week0: F('and', 2) + 2, win2: F('a', 3) - 18, newHeart: F('new'), beat: F('beating'), beat2: F('beating') + 16,
  grow0: F('then') + 6, m14: F('entire') - 4, m21: F('body', 3) - 2, grow1: F('back') - 4, walk: F('back'),
  end0: F('and', 3), did: F('actually'), pull2: F('did') - 3, twice: F('twice'),
  end: FRAMES,
};
export const CUTS4 = [B4.feed, B4.end0];
export const BEAT_PER4 = B4.beat2 - B4.beat;

// ---------------------------------------------------------------- the neck: one stretch law for the hook and the loop
// gap (how far the head has pulled ahead) -> pinch (0 open .. 1 parted). Frame 0: gap 18, the neck already a thread
// with a clear space between head and body; it parts at gap 22. The ending arrives at gap 18 at the hook's rate.
export const G0 = 18, GBRK = 22, GRATE = (GBRK - G0) / B4.brk;
export const pinch4 = (gap: number) => clamp(gap <= 6 ? (0.45 * gap) / 6 : gap <= G0 ? 0.45 + (0.48 * (gap - 6)) / (G0 - 6) : 0.93 + (0.07 * (gap - G0)) / (GBRK - G0));
const gapHook = (f: number) => G0 + GRATE * f;

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
const onFloor = (o: Orbit, x: number, y: number, z: number): V3 => {
  const c = orbitCam(o);
  const a = unproj(c, x, y, 10), b = unproj(c, x, y, 200);
  const k = (z - a[2]) / (b[2] - a[2]);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, z];
};

// ---------------------------------------------------------------- the lab: head and body after the break
// The head glides at a time-lapse pace (about half a unit a frame, a third of its own length a second) with strong
// pedal waves, a surge in its length, rhinophores working and a slime trail; the body stays where it was.
const vHead = (f: number) => (f < B4.body ? 0.78 : lerp(0.78, 0.42, ease(f, B4.body, B4.body + 30))) * ease(f, B4.brk, B4.free) * (1 + 0.3 * Math.sin((2 * Math.PI * (f - B4.brk)) / 18));
const TR: number[] = [0];
for (let f = B4.brk + 1; f <= B4.feed + 2; f++) TR.push(TR[TR.length - 1] + vHead(f));
const travel = (f: number) => TR[clamp(Math.round(f - B4.brk), 0, TR.length - 1)];
const crawlAt = (f: number) => (2 * Math.PI * (f - B4.brk)) / 18;
const headTip = (f: number) => S0 + GBRK + travel(f);

type BodyMods = Partial<Pick<Piece, 'flinch' | 'bend' | 'twitch' | 'ripple' | 'win' | 'heart' | 'beat'>>;
const labHead = (f: number, tip?: number): Piece => {
  const t = f / 30;
  const gH = GBRK * (1 - ease(f, B4.brk, B4.brk + 9, outCubic));
  const go = ease(f, B4.brk, B4.free);
  return {
    id: 'head', path: PH2, tip: tip ?? headTip(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: ease(f, B4.brk, B4.brk + 7, outCubic), t, style: V4,
    crawl: crawlAt(f), crawlAmp: 1.3 * go, surge: 0.035 * go * Math.cos(crawlAt(f)), sway: 1.5,
  };
};
const labBody = (f: number, m: BodyMods = {}): Piece => {
  const gB = GBRK * (1 - ease(f, B4.brk, B4.brk + 8, outCubic));
  return {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: ease(f, B4.brk, B4.brk + 7, outCubic), t: (f / 30) * 0.6, style: V4, ...m};
};

// reference objects the head passes (placed from its own route): a Bryopsis fragment (1.0 s), a pebble (1.6 s), a shell
// shard in the foreground and a fragment behind (2.3 s)
const hs = (f: number) => headTip(f) - 9;
export const FRAGS4: Frag[] = [
  {c: onPath(hs(32) + 6, 9), ang: 0.7, len: 12, seed: 11},
  {c: onPath(hs(72) + 4, 14), ang: 2.2, len: 13, seed: 12},
  ...HOOK_FRAGS.slice(2),
];
const PEBBLE4: V3 = onPath(hs(50) + 3, -10.5, 2.0);

// ---------------------------------------------------------------- 0-4.4 s: the opening (the head's story only)
const AZ0 = headAz(PH2, S0);
export const ORB4_0: Orbit = rel(onPath(S0 - 20 + G0 * 0.5, 0, 4.5), AZ0, -30, 38, 168, 3150, 980);
let SHELL4: V3 | undefined;
const shell4 = () => {
  if (!SHELL4) {
    SHELL4 = [0, 0, 0];
    SHELL4 = onFloor(hookState(70).orbit, 330, 1640, 1.0);
  }
  return SHELL4;
};
const hookState = (f: number): State2 => {
  const t = f / 30;
  let pieces: Piece[];
  if (f < B4.brk) {
    const gap = gapHook(f);
    pieces = [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinch4(gap), t, style: V4, crawl: crawlAt(f), crawlAmp: 0.5}];
  } else {
    // the body recoils as the thread parts (it was resisting the pull) and then lies still
    const fl = 0.3 * Math.sin(Math.PI * seg(f, B4.brk, B4.brk + 14)) ** 2;
    pieces = [labBody(f, {flinch: fl, bend: fl * 2}), labHead(f)];
  }
  const head = pieces[pieces.length - 1];
  const hc = geo(head).at(9, 0, 3.5);
  const bc = geo(pieces[0]).at(f < B4.brk ? 40 : 52, 0, 4);
  const hAz = headAz(PH2, hs(f));
  const lAz = lineAz(bc, hc);
  // the chain of views (each one shows the head somewhere new relative to the dish floor)
  const k0 = ORB4_0;
  // the head pulling free with the body still in frame behind it
  const k1 = rel([lerp(hc[0], bc[0], 0.3), lerp(hc[1], bc[1], 0.3), 3.6], lAz, -36, 30, 150, 3150, 1060);
  // then one continuous move round the gliding head, each view new: low behind it (it runs away from us past the first
  // fragment), its left side (it crosses the frame past the pebble), alongside and low (the shard slides through the
  // foreground, a fragment behind), and its front quarter (it comes at the lens)
  const k2 = rel([hc[0], hc[1], 3.4], hAz, -158, 12, 96, 3150, 1180);
  const k3 = rel([hc[0], hc[1], 3.4], hAz, -100, 44, 118, 3150, 980);
  const k4 = rel([hc[0], hc[1], 3.0], hAz, -70, 5, 66, 3150, 1000);
  const k5 = rel([hc[0], hc[1], 3.6], lAz, -24, 18, 80, 3150, 1060);
  // it passes the lens; the camera holds and racks to the abandoned body behind
  const k6 = rel([bc[0], bc[1], 4], lAz, -24, 15, 150, 3300, 980);
  let orbit = lerpOrbit(k0, k1, E(f, 6, B4.free + 4));
  orbit = lerpOrbit(orbit, k2, E(f, B4.free, B4.lat - 2));
  orbit = lerpOrbit(orbit, k3, E(f, B4.lat - 8, B4.along - 2));
  orbit = lerpOrbit(orbit, k4, E(f, B4.along - 6, B4.front - 4));
  orbit = lerpOrbit(orbit, k5, E(f, B4.front - 8, B4.out));
  if (f > B4.out - 4) orbit = {...lerpOrbit(orbit, k6, E(f, B4.out + 6, B4.body)), target: lerpOrbit(orbit, k6, E(f, B4.out + 2, B4.body - 2)).target};
  const trail = f > B4.brk ? {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.55 * ease(f, B4.brk, B4.brk + 16), w: 0.45} : undefined;
  const blur = {head: 8 * E(f, B4.out + 10, B4.body + 4), body: 5 * (1 - E(f, B4.out, B4.out + 18)) * ease(f, B4.low, B4.lat)};
  return {
    shot: 'H', env: 'lab', orbit, pieces, trail, frags: FRAGS4, blur, dim: DIM,
    props: [
      {c: PEBBLE4, r: [3.0, 2.5, 2.0], yaw: 10, col: '#9C9585'},
      ...(f > B4.along - 10 && f < B4.front + 6 ? [{c: shell4(), r: [2.6, 1.7, 0.9] as [number, number, number], yaw: 30, col: '#B8AD99', blur: 2}] : []),
    ],
    labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, B4.lat, B4.lat + 8), icon: 'ff'}],
  };
};
const DIM = 0.6; // the darker dish grade: the green animal reads hard against a deep teal floor

// ---------------------------------------------------------------- 4.4-7.4 s: the headless body
// Close on the body; a gloved hand brings a slender probe straight in and touches on "BODY": the parapodium under it
// curls hard at once and the body flinches. A second angle (from above) shows the response travelling: the body
// contracts and bends on "MOVING". Then we move in on its sealed neck end.
const PDIR: V3 = norm([0.55, -0.3, 0.78]);
function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
const probeAt = (f: number): State2['probe'] => {
  if (f < B4.body || f > B4.touch + 40) return undefined;
  const contact = geo(labBody(f)).tube(60, Math.PI / 2 - 0.55 * (NEAR_SIDE || 1));
  const inn = ease(f, B4.body, B4.touch, outCubic), away = ease(f, B4.touch + 6, B4.touch + 30);
  const back = 70 * (1 - inn) + 60 * away;
  const press = clamp(seg(f, B4.touch - 2, B4.touch + 1)) * (1 - seg(f, B4.touch + 3, B4.touch + 7));
  const k = back + 0.5 - press * 1.4;
  return {tip: [contact[0] + PDIR[0] * k, contact[1] + PDIR[1] * k, contact[2] + PDIR[2] * k], dir: PDIR, press, op: clamp(seg(f, B4.body, B4.body + 4)) * (1 - seg(f, B4.touch + 26, B4.touch + 36))};
};
/** which parapodium (side +1 / -1) faces the camera of orbit o */
const nearSideOf = (o: Orbit, p: Piece) => {
  const eye = orbitCam(o).eye, G = geo(p);
  const c = G.at(58, 0, 3), l = G.at(58, 1, 3);
  return (l[0] - c[0]) * (eye[0] - c[0]) + (l[1] - c[1]) * (eye[1] - c[1]) > 0 ? 1 : -1;
};
let NEAR_SIDE = 0;
const bodyState = (f: number): State2 => {
  const tw = f < B4.touch ? 0 : outCubic(seg(f, B4.touch, B4.touch + 4)) * (1 - 0.8 * ease(f, B4.touch + 8, B4.touch + 30));
  const heave = Math.sin(Math.PI * seg(f, B4.move - 6, B4.move + 18)) ** 2;
  const ra = lerp(60, 28, ease(f, B4.touch + 4, B4.toNeck, (u) => u));
  const ramp = ease(f, B4.touch + 2, B4.touch + 10) * (1 - ease(f, B4.toNeck - 4, B4.anat));
  const fl = 0.35 * tw + 0.5 * heave;
  if (!NEAR_SIDE) NEAR_SIDE = nearSideOf(rel(geo(labBody(B4.touch)).at(52, 0, 4), headAz(PH2, S0 - 40), -60, 40, 150, 3400, 1040), labBody(B4.touch));
  const pieces = [labBody(f, {flinch: fl, bend: 1.5 * fl - 1.6 * heave, twitch: {side: NEAR_SIDE, a: 60, amp: clamp(tw + 0.6 * heave)}, ripple: {a: ra, amp: (0.8 + 0.6 * heave) * ramp}}), labHead(f)];
  const body = pieces[0];
  const bc = geo(body).at(52, 0, 4);
  const hAz = headAz(PH2, S0 - 40);
  const from = hookState(B4.body - 1).orbit;
  const close = rel(bc, hAz, -60, 40, 150, 3400, 1040); // close on the body: the probe comes in from the upper right
  const above = rel(geo(body).at(46, 0, 4), hAz, -150, 64, 170, 3400, 980); // second angle: from above and behind
  const neck = rel(geo(body).at(25, 0, 4.5), hAz, -110, 40, 110, 3500, 1000);
  let orbit = lerpOrbit(from, close, E(f, B4.body - 2, B4.touch - 2));
  orbit = lerpOrbit(orbit, above, E(f, B4.angle2, B4.move + 2));
  orbit = lerpOrbit(orbit, neck, E(f, B4.toNeck - 6, B4.anat + 6));
  const head = pieces[1];
  return {
    shot: 'B', env: 'lab', orbit, pieces, frags: FRAGS4, blur: {head: 8}, probe: probeAt(f), dim: lerp(DIM, 0.78, E(f, B4.toNeck, B4.anat + 8)),
    trail: {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.55, w: 0.45}, props: [{c: PEBBLE4, r: [3.0, 2.5, 2.0], yaw: 10, col: '#9C9585'}], labels: [],
  };
};

// ---------------------------------------------------------------- 7.4-12.5 s: the neck and the heart
// In the darker macro grade: REWIND (the head runs back along its trail and rejoins), the skin over the neck and front
// body clears into a tissue window (gland, gut, buccal mass and ganglia, the heart pumping in its sac behind the neck),
// a pale band shows the weak spot; then the head pulls (the band draws out), the neck parts on "breaks", and the head
// glides away up the frame while the heart beats on in the body in the foreground.
const ST_: number[] = [0];
for (let f = B4.part + 1; f <= B4.feed + 2; f++) ST_.push(ST_[ST_.length - 1] + 0.42 * (1 + 0.3 * Math.sin((2 * Math.PI * (f - B4.part)) / 18)));
const secHead = (f: number) => S0 + GBRK + ST_[clamp(Math.round(f - B4.part), 0, ST_.length - 1)];
const beatOld = (f: number) => beatAt(f, 120, 22) * (1 + 0.5 * Math.exp(-Math.pow((f - B4.heart - 4) / 6, 2)));
const winOf = (open: number): Piece['win'] => ({a: 24, r: 17, open});
const anatomyPieces = (f: number): Piece[] => {
  const t = f / 30;
  const open = E(f, B4.win0 - 2, B4.win0 + 12);
  const weak = E(f, B4.weak, B4.weak + 6) * (1 - E(f, B4.part - 2, B4.part + 5));
  if (f < B4.rew1) {
    const k = E(f, B4.anat, B4.rew1);
    const tip = lerp(labHead(B4.anat).tip, S0 + GBRK, k);
    return [labBody(B4.anat), {...labHead(f, tip), gap: GBRK * k, seal: 1 - k, crawl: -crawlAt(f) * 2, crawlAmp: 0.6 * (1 - k)}];
  }
  if (f < B4.part) {
    const reform = ease(f, B4.rew1, B4.rew1 + 4);
    const gap = GBRK * (1 - reform) + GBRK * E(f, B4.pull, B4.part);
    return [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinch4(gap), t, heart: 1, beat: beatOld(f), win: winOf(open), weak, style: V4}];
  }
  const gH = GBRK * (1 - ease(f, B4.part, B4.part + 9, outCubic)), gB = GBRK * (1 - ease(f, B4.part, B4.part + 8, outCubic));
  const sl = ease(f, B4.part, B4.part + 7, outCubic), cr = (2 * Math.PI * (f - B4.part)) / 18;
  return [
    {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, heart: 1, beat: beatOld(f), win: winOf(open), style: V4},
    {id: 'head', path: PH2, tip: secHead(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: sl, t, crawl: cr, crawlAmp: 1.2 * ease(f, B4.part, B4.part + 6), win: winOf(open), style: V4},
  ];
};
const anatomyState = (f: number): State2 => {
  const pieces = anatomyPieces(f);
  const from = bodyState(B4.anat - 1).orbit;
  const hAz = headAz(PH2, S0 - 20);
  const neck = onPath(S0 - 22, 0, 5);
  // the window from behind-left and above: the heart near the lens, the head ahead up the frame
  const win: Orbit = rel(neck, hAz, -146, 36, 100, 3200, 900);
  let orbit = lerpOrbit(from, rel(onPath(S0 - 24, 0, 5), hAz, -128, 36, 126, 3300, 960), E(f, B4.anat, B4.rew1));
  orbit = lerpOrbit(orbit, win, E(f, B4.rew1 - 4, B4.win0 + 12));
  // close in on the weak spot, then back out for the break
  const wk = E(f, B4.weak - 4, B4.weak + 10) * (1 - E(f, B4.pull, B4.pull + 20));
  orbit = {...orbit, d: orbit.d * (1 - 0.22 * wk)};
  if (f >= B4.part) {
    // follow the leaving head a little (the heart stays low in the frame)
    const hd = geo(pieces[1]).at(10, 0, 4);
    const k = E(f, B4.part, B4.tissue) * 0.2;
    orbit = {...orbit, target: [lerp(orbit.target[0], hd[0], k), lerp(orbit.target[1], hd[1], k), 5], cy: lerp(orbit.cy ?? 960, 990, k / 0.2)};
  }
  if (f > B4.tissue) {
    const tc = geo(pieces[0]).at(36, 0.3, 5);
    orbit = lerpOrbit(orbit, rel(tc, hAz, -140, 40, 96, 3200 * 5, 960), ease(f, B4.tissue, B4.micro + 14, (u) => u * u * u));
  }
  const rew = seg(f, B4.anat, B4.anat + 2) * (1 - seg(f, B4.rew1, B4.rew1 + 6));
  return {shot: 'A', env: 'lab', orbit, pieces, frags: FRAGS4, dim: 0.78, micro: f > B4.micro - 10 ? microAt(f) : undefined, microV4: true, labels: [{text: 'REWIND', op: rew, icon: 'rw'}]};
};

// ---------------------------------------------------------------- 12.5-16.3 s: the parasites
const microAt = (f: number): State2['micro'] => {
  const op = ease(f, B4.micro - 10, B4.micro + 2) * (1 - ease(f, B4.out0 + 4, B4.out0 + 16));
  if (op <= 0) return undefined;
  const zIn = 0.75 + 0.6 * ease(f, B4.micro - 10, B4.out0, (u) => u);
  const zOut = ease(f, B4.out0, B4.out0 + 16);
  return {
    op, reveal: ease(f, B4.micro - 10, B4.micro + 4), para: ease(f, B4.bugs - 6, B4.bugs + 6), zoom: zIn * lerp(1, 0.45, zOut),
    swim: Math.max(0, (f - B4.bugs) / 30), bar: ease(f, B4.bugs, B4.bugs + 8) * (1 - zOut), pan: 240 * ease(f, B4.micro, B4.out0, (u) => u),
  };
};
const paraState = (f: number): State2 => {
  const a = anatomyState(Math.min(f, B4.micro + 14));
  const pieces = anatomyPieces(f).map((p) => ({...p, win: winOf(1 - E(f, B4.out0 + 6, B4.chase + 4))}));
  const head = pieces[1];
  const hc = geo(head).at(9, 0, 3.5);
  const out = E(f, B4.out0, B4.chase);
  const bt = geo(pieces[0]).at(31, 0, 5);
  const wide = rel([(bt[0] + hc[0]) / 2, (bt[1] + hc[1]) / 2, 4], headAz(PH2, S0 - 20), -150, 50, 270, 3200, 980);
  // from the head's left side (from behind it the camera would fly low over the abandoned body)
  const chase = rel([hc[0], hc[1], 3.5], headAz(PH2, head.tip - 9), -100, 22, 104, 3150, 1040);
  let orbit = lerpOrbit(a.orbit, wide, out);
  orbit = lerpOrbit(orbit, chase, E(f, B4.chase - 6, B4.feed));
  const hyp = ease(f, B4.bugs + 4, B4.bugs + 12) * (1 - ease(f, B4.out0 + 2, B4.out0 + 10));
  return {shot: 'P', env: 'lab', orbit, pieces, frags: FRAGS4, dim: lerp(0.78, DIM, out), micro: microAt(f), microV4: true, labels: [{text: 'HYPOTHESIS', op: hyp, icon: 'none'}]};
};

// ---------------------------------------------------------------- 16.3-19.0 s: feeding on the seabed
// Matched cut on the gliding head. It reaches a Bryopsis stalk low down (clear of the rhinophores), rears and sets its
// snout on it; through the clear skin of its snout the buccal mass pumps in time with green cytoplasm streaming down
// the stalk into it, the frond clearing from its tips and the head greening. Then it moves on, and the camera slides
// back along it to where new tissue is starting.
export const TIP_SEA = 124.4;
const PHS_AZ = headAz(PHS, 120);
const pumpAt = (f: number) => (f > B4.contact + 2 && f < B4.moveOn ? 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - B4.contact - 2)) / 11) : 0);
const seaHead = (f: number): Piece => {
  const t = f / 30;
  const arrive = ease(f, B4.feed, B4.contact, outCubic);
  const on = ease(f, B4.moveOn, B4.back + 10);
  const pm = pumpAt(f);
  const go = Math.max(1 - ease(f, B4.contact - 6, B4.contact + 2), on);
  return {
    id: 'head', path: PHS, tip: lerp(TIP_SEA - 8, TIP_SEA, arrive) + 0.5 * pm + 5 * on, a0: 0, a1: 22, gap: 0, pinch: 1, seal: 1, t, style: V4,
    crawl: crawlAt(f), crawlAmp: 1.2 * go, surge: 0.025 * pm, rear: 0.5 * ease(f, B4.contact - 8, B4.contact + 2) * (1 - on),
    green: 0.85 * ease(f, B4.contact + 4, B4.back), pump: pm, win: {a: 5, r: 7, open: ease(f, B4.contact, B4.contact + 6) * (1 - ease(f, B4.moveOn - 4, B4.moveOn + 4))},
  };
};
// the finished animal crawls off (from just after DAY 21 to the cut back to the lab)
const WALK0 = B4.m21 + 6;
const walked = (f: number) => (f <= WALK0 ? 0 : 0.55 * (f - WALK0) - 0.55 * 8 * (1 - Math.exp(-(f - WALK0) / 8)));
export const growAt4 = (f: number) => {
  if (f < B4.grow0) return 0.016 + 0.164 * ease(f, B4.back, B4.newHeart, (u) => u * (2 - u));
  // the weeks: three clearly different stages with the growth carrying on between them
  return lerp(0.18, 1, ease(f, B4.grow0, B4.grow1, (u) => u * u * (3 - 2 * u)));
};
export const dayAt4 = (f: number) => (f < B4.week0 ? 0 : f < B4.grow0 ? 1 + 6 * ease(f, B4.week0, B4.newHeart) : 7 + 14 * ease(f, B4.grow0, B4.grow1, (u) => u * u * (3 - 2 * u)));
const regen4 = (f: number, o: Partial<Piece> = {}): Piece => ({
  id: 'regen', path: PHS, tip: TIP_SEA + 5 * ease(f, B4.moveOn, B4.back + 10) + walked(f), a0: 0, a1: 100, gap: 0, pinch: 1, seal: 1, t: f / 30,
  grow: growAt4(f), green: 0.85 * (1 - E(f, B4.m21, B4.grow1)), style: V4, ...o,
});
const feedState = (f: number): State2 => {
  const lab = paraState(B4.feed - 1);
  const head = seaHead(f);
  const snout = geo(head).at(1, 0, 4);
  const lhc = geo(lab.pieces[1]).at(9, 0, 3.5), sh = geo(head).at(9, 0, 3.5);
  const m: Orbit = {...lab.orbit, target: [lab.orbit.target[0] - lhc[0] + sh[0], lab.orbit.target[1] - lhc[1] + sh[1], lab.orbit.target[2]], az: lab.orbit.az - headAz(PH2, lab.pieces[1].tip - 9) + PHS_AZ};
  // close, low and from the side, so the snout on the stalk is in profile (the rhinophores stand clear above)
  const contact = rel([snout[0] + 0.5, snout[1] + 2, 4.5], PHS_AZ, -84, 14, 54, 3300, 1040);
  const rear = rel(geo(head).at(20, 0, 4), PHS_AZ, -118, 30, 90, 3300, 1020);
  let orbit = lerpOrbit(m, contact, E(f, B4.feed + 2, B4.contact + 4));
  orbit = lerpOrbit(orbit, rear, E(f, B4.moveOn, B4.week0 + 12));
  // (the crawl settles before the hand-over to the time-lapse, which holds the animal still)
  const pieces = f < B4.back ? [head] : [regen4(f, {rear: head.rear, green: head.green, crawl: head.crawl, crawlAmp: (head.crawlAmp ?? 0) * (1 - ease(f, B4.week0 - 2, B4.week0 + 8))})];
  const drain = ease(f, B4.contact + 2, B4.moveOn + 4, (u) => u * (2 - u));
  const lapse = ease(f, B4.week0 - 2, B4.week0 + 3);
  return {
    shot: 'F', env: 'sea', orbit, pieces, feed: {u: 0.02, drain, down: true, flow: ease(f, B4.contact + 2, B4.contact + 7) * (1 - ease(f, B4.moveOn - 4, B4.moveOn + 2))}, lapse,
    night: lapse * 0.22 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B4.week0, B4.newHeart))),
    labels: [{text: `TIME-LAPSE · DAY ${Math.max(1, Math.round(dayAt4(f)))}`, op: ease(f, B4.week0, B4.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 19.0-21.5 s: a new heart
// TIME-LAPSE DAY 1 -> 7: the bud of new tissue swells behind the head; the skin over it clears; a loose cluster of
// cells draws together into a sac and heart ("NEW HEART"), which then squeezes twice, hard ("BEATING", and 0.5 s
// later), with a heartbeat sound on each; straight after the second we move on.
export const beat4 = (f: number) => {
  const one = (f0: number) => (f < f0 ? 0 : 1.6 * Math.pow(Math.sin(Math.PI * clamp((f - f0) / 9)), 2));
  return Math.max(one(B4.beat), one(B4.beat2)) + (f > B4.beat2 + 10 ? 0.5 * beatAt(f, B4.beat2 + 10, BEAT_PER4) : 0);
};
const heartState = (f: number): State2 => {
  const from = feedState(B4.week0 + 12).orbit;
  const open = E(f, B4.win2, B4.win2 + 10) * (1 - E(f, B4.beat2 + 9, B4.grow0 + 8));
  const hv = ease(f, B4.win2 + 2, B4.newHeart + 8);
  const p = regen4(f, {heart: hv, beat: beat4(f), win: {a: 0, r: 34, open}});
  p.win!.a = heartAOf(p);
  const hc = geo(p).at(p.win!.a, 0, 5);
  const close: Orbit = rel(hc, PHS_AZ, -100, 34, 46, 3300 * 1.3, 920);
  const closer: Orbit = rel(hc, PHS_AZ, -84, 40, 38, 3300 * 1.3, 940);
  let orbit = lerpOrbit(from, close, E(f, B4.week0 + 8, B4.newHeart));
  orbit = lerpOrbit(orbit, closer, E(f, B4.newHeart, B4.beat2));
  const lapse = ease(f, B4.week0 - 2, B4.week0 + 3);
  return {
    shot: 'N', env: 'sea', orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true}, lapse, frondFade: 0.6 * open,
    night: lapse * 0.22 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B4.week0, B4.newHeart))),
    labels: [{text: `TIME-LAPSE · DAY ${Math.round(dayAt4(f))}`, op: ease(f, B4.week0, B4.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 21.5-25.0 s: the body grows back
// One continuous time-lapse in three views, one per milestone, the camera moving between them as the body grows:
// DAY 7-12 low beside the bud (tissue swelling, the organ region showing through the clear new skin); DAY 14 from
// above at the side (a long pale body, parapodia rising as ridges); DAY 21 from the front quarter (parapodia folded up
// over the back, green and spots back). The finished animal then crawls on.
const growState = (f: number): State2 => {
  const settle = 1 - E(f, B4.grow1 - 6, B4.end0 - 2);
  const winOpen = 0.65 * E(f, B4.grow0, B4.grow0 + 8) * (1 - E(f, B4.m14 - 6, B4.m14 + 10));
  const walking = ease(f, WALK0, WALK0 + 8);
  const p = regen4(f, {crawl: (2 * Math.PI * f) / (walking > 0.5 ? 18 : 9), crawlAmp: lerp(0.5 * settle, 1.3, walking), surge: 0.03 * walking * Math.cos((2 * Math.PI * f) / 18), sway: 1.4, bend: 0.25 * Math.sin(f / 9) * settle, win: {a: 50, r: 34, open: winOpen}});
  const from = heartState(B4.grow0 - 1).orbit;
  const mid = (a: number) => geo(p).at(a, 0, 4);
  const v7 = rel(mid(20), PHS_AZ, -112, 18, 100, 3300, 1000);
  const v14 = rel(mid(36), PHS_AZ, -150, 52, 190, 3300, 980);
  const v21 = rel(mid(40), PHS_AZ, -36, 26, 240, 3300, 960);
  let orbit = lerpOrbit(from, v7, E(f, B4.grow0 - 4, B4.grow0 + 14));
  orbit = lerpOrbit(orbit, v14, E(f, B4.m14 - 16, B4.m14 + 6));
  orbit = lerpOrbit(orbit, v21, E(f, B4.m21 - 16, B4.m21 + 8));
  const run = 1 - ease(f, B4.grow1 - 6, B4.grow1 + 2);
  return {
    shot: 'G', env: 'sea', orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true, gone: E(f, B4.grow0, B4.m14)}, lapse: run, frondFade: 0.6 * (1 - E(f, B4.grow0, B4.grow0 + 10)),
    night: run * 0.2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B4.grow0, B4.grow1))),
    labels: [{text: `TIME-LAPSE · DAY ${Math.round(dayAt4(f))}`, op: 1 - ease(f, B4.grow1 + 2, B4.grow1 + 8), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 25.0 s - end: it does it again
// Matched cut on the regrown animal back to the dark dish, where the film began. State A: the whole regrown slug
// gliding. State B ("actually did it"): it grips with its foot and the head pulls forward, the neck narrowing.
// State C ("TWICE"): the neck draws out and the gap between head and body opens fast. State D (last 0.5 s): head and
// body clearly apart on a thinning thread, the head gliding on. The last frame is frame 0's state; the thread parts at
// 0.3 s into the replay.
const gapEnd = (f: number) => (f < B4.pull2 ? 0 : G0 * Math.pow(clamp((f - B4.pull2) / (B4.end - B4.pull2)), 1.5));
const loopState = (f: number): State2 => {
  const tl = (f - B4.end) / 30;
  const gap = gapEnd(f);
  const glide = ease(f, B4.end0, B4.pull2, (u) => u * (2 - u));
  const bodyTip = lerp(S0 - 26, S0, glide);
  const draw = 0.45 * ease(f, B4.did - 2, B4.did + 12);
  const pieces: Piece[] = [{
    id: 'whole', path: PH2, tip: bodyTip + gap, a0: 0, a1: 100, gap, pinch: Math.max(draw, pinch4(gap)), t: tl, style: V4,
    crawl: (2 * Math.PI * (f - B4.end)) / 18 + crawlAt(0), crawlAmp: lerp(1.2, 0.5, ease(f, B4.pull2 - 14, B4.pull2 + 6)),
  }];
  const sea = growState(B4.end0 - 1);
  const sp = geo(sea.pieces[0]).at(40, 0, 4), lp = geo(pieces[0]).at(40, 0, 4);
  const m: Orbit = {...sea.orbit, target: [sea.orbit.target[0] - sp[0] + lp[0], sea.orbit.target[1] - sp[1] + lp[1], sea.orbit.target[2]], az: sea.orbit.az - PHS_AZ + headAz(PH2, bodyTip - 40)};
  const orbit = lerpOrbit(m, ORB4_0, E(f, B4.end0 + 4, B4.end));
  return {shot: 'T', env: 'lab', orbit, pieces, frags: FRAGS4, dim: DIM, props: [{c: PEBBLE4, r: [3.0, 2.5, 2.0], yaw: 10, col: '#9C9585'}], labels: [{text: 'TIME-LAPSE', op: ease(f, B4.twice, B4.twice + 8), icon: 'ff'}], loopT: tl};
};

export const stateAt4 = (f: number): State2 => {
  if (f < B4.body) return hookState(f);
  if (f < B4.anat) return bodyState(f);
  if (f < B4.micro + 14) return anatomyState(f);
  if (f < B4.feed) return paraState(f);
  if (f < B4.week0 + 12) return feedState(f);
  if (f < B4.grow0) return heartState(f);
  if (f < B4.end0) return growState(f);
  return loopState(f);
};

/** the picture's event frames for the sound (tools/export_cues_v4.ts -> audio/cues_v4.json), V2 cue layout + V4 */
export const CUES4 = () => {
  const days: number[] = [];
  let last = 0;
  for (let f = B4.week0; f < B4.end0; f++) {
    const d = Math.round(dayAt4(f));
    if (d !== last && last > 0) days.push(f);
    last = d;
  }
  return {
    frames: FRAMES,
    S: {hook: 0, body: B4.body, weak: B4.anat, para: B4.micro, feed: B4.feed, heart: B4.week0, grow: B4.grow0, twice: B4.end0, end: FRAMES},
    brk: B4.brk, touch: B4.touch, move: B4.move, ripple: B4.touch + 4, rew0: B4.anat, rew1: B4.rew1, join: B4.win0, weak: B4.weak,
    brk2start: B4.pull, brk2: B4.part, in0: B4.tissue, in1: B4.micro + 14, para: B4.bugs, out0: B4.out0, out1: B4.chase,
    arrive: B4.contact, suck: B4.contact + 2, pumpPer: 11, moveOn: B4.moveOn, week0: B4.week0, newHeart: B4.newHeart, beat: B4.beat, beatPer: BEAT_PER4,
    did: B4.did, twice: B4.twice, loopGap0: B4.pull2, pull2: B4.pull2, days,
  };
};
