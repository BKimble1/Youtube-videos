// V3: the film as a pure function of the frame, rebuilt for pace. Same rig, sets and narration as V2 (word times from
// F('word', n)); each physical event starts as soon as the previous one has read, often just ahead of its line.
// World units ~0.2 mm (the slug is 100 long). Cameras are kit orbits; most are given relative to the animal's heading
// (rel 0 = in front of it, looking back at it; -90 = from its left), so the two matched cuts (lab -> sea on the head,
// sea -> lab on the regrown animal) keep the subject exactly where it was on screen.
import {F, FRAMES, clamp, ease, lerp, outCubic, seg} from '../lib';
import {Path} from '../geo';
import {Orbit, V3, lerpOrbit, orbitCam, unproj} from '../kit/three';
import {A_CUT, Piece, geo, heartAOf} from '../v2/slug/body';
import {HOOK_FRAGS, PH2, PHS, S0, State2, beatAt} from '../v2/shots2';

const smooth3 = (u: number) => u * u * (3 - 2 * u);
const E = (f: number, a: number, b: number) => ease(f, a, b, smooth3);

// ---------------------------------------------------------------- beats (frames at 30 fps)
export const B3 = {
  brk: 13, // the neck parts at 0.43 s
  low: 25, lat: 37, fore: 51, rack: 67, probe: 82, touch: 97,
  ripple: 104, move: F('moving'), neck: 196,
  rew0: 204, rew1: 217, win0: 219, weak: F('weak') - 6, pull: 266, part: F('breaks') - 2,
  heart: F('heart', 1), tissue: 352, micro: 372, bugs: F('parasites') - 18, out0: F('old') - 6, follow: 470,
  feed: F('but'), contact: F('but') + 15, back: F('eating') + 24, week0: F('and', 2) + 2, win2: F('a', 3) - 14,
  newHeart: F('new'), beat: F('beating'), close: F('then') - 4,
  grow0: F('then') + 2, grow1: F('back') + 2, twice0: F('and', 3), did: F('actually'), pull2: F('did') + 2, twice: F('twice'),
  end: FRAMES,
};
export const BEAT_PER3 = 16;
/** the new heart's beat: a broad squeeze (about 7 frames) every period, so each contraction reads (0..1.6 like beatAt) */
export const beat3 = (f: number, f0: number, per = BEAT_PER3) => {
  if (f < f0) return 0;
  const u = ((f - f0) % per) / per;
  return 1.6 * Math.pow(Math.sin(Math.PI * clamp(u / 0.46)), 2);
};
export const CUTS3 = [B3.feed, B3.twice0];

// ---------------------------------------------------------------- the neck: one stretch law for the hook and the loop
// gap (units the head has pulled away) -> pinch (0 open .. 1 parted). Frame 0 is already well stretched (gap 11); the
// neck parts at gap 15. The last shot ends on gap 11 again, arriving at the hook's rate (0.32 units a frame).
export const G0 = 11, GBRK = 15, GRATE = (GBRK - G0) / 13;
export const pinch3 = (gap: number) => clamp(gap <= 6 ? (0.45 * gap) / 6 : 0.45 + (0.55 * (gap - 6)) / (GBRK - 6));
const gapHook = (f: number) => G0 + GRATE * f;

/** heading azimuth of a path at arc s (camera az 0 looks back at an animal travelling that way) */
const headAz = (path: Path, s: number) => {
  const p = path.at(s);
  return (Math.atan2(p.tx, -p.ty) * 180) / Math.PI;
};
const rel = (target: V3, hAz: number, dAz: number, el: number, d: number, f: number, cy = 960): Orbit => ({target, az: hAz + dAz, el, d, f, cy});

// ---------------------------------------------------------------- the lab: head and body after the break
const vHead = (f: number) => 0.34 * (1 + 0.25 * Math.sin((2 * Math.PI * (f - B3.brk)) / 26));
const TR: number[] = [0];
for (let f = B3.brk + 1; f <= B3.feed + 2; f++) TR.push(TR[TR.length - 1] + vHead(f));
const travel = (f: number) => TR[clamp(Math.round(f - B3.brk), 0, TR.length - 1)];
const crawlAt = (f: number) => (2 * Math.PI * (f - B3.brk)) / 26;

type BodyMods = {flinch?: number; bend?: number; twitch?: Piece['twitch']; ripple?: Piece['ripple']; win?: Piece['win']; heart?: number; beat?: number};
const labHead = (f: number, tip?: number): Piece => {
  const t = f / 30;
  const gH = GBRK * (1 - ease(f, B3.brk, B3.brk + 10, outCubic));
  const go = ease(f, B3.brk, B3.brk + 6);
  return {id: 'head', path: PH2, tip: tip ?? S0 + GBRK + travel(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: ease(f, B3.brk, B3.brk + 7, outCubic), t, crawl: crawlAt(f), crawlAmp: go, surge: 0.02 * go * Math.cos(crawlAt(f))};
};
const labBody = (f: number, m: BodyMods = {}): Piece => {
  const gB = GBRK * (1 - ease(f, B3.brk, B3.brk + 8, outCubic));
  return {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: ease(f, B3.brk, B3.brk + 7, outCubic), t: (f / 30) * 0.6, ...m};
};
const onPath = (s: number, v: number, z = 0): V3 => {
  const p = PH2.at(s);
  return [p.x - p.ty * v, p.y + p.tx * v, z];
};

// ---------------------------------------------------------------- 0-3.2 s: the opening
// Frame 0: a tight 3/4 macro on the neck, the head already pulling and the neck drawn thin. It parts at 0.43 s and the
// head glides straight on. The camera drops low and tracks it past a fragment of algae (1.0 s), comes round to a close
// lateral macro (1.3-1.7 s), lets the head pass a shell shard right by the lens (1.7-2.2 s), then turns with the
// shard's motion onto the abandoned body (focus racks to it, it contracts once), and a probe comes down at it.
const AZ0 = headAz(PH2, S0);
export const ORB3_0: Orbit = rel(onPath(S0 - 18 + G0, 0, 4.5), AZ0, -34, 34, 150, 3150, 1000);
const PEBBLE: V3 = onPath(S0 + GBRK + 20, 13, 0);
/** a world point on the floor (height z) under screen (x, y) as seen by orbit o */
const onFloor = (o: Orbit, x: number, y: number, z: number): V3 => {
  const c = orbitCam(o);
  const a = unproj(c, x, y, 10), b = unproj(c, x, y, 200);
  const k = (z - a[2]) / (b[2] - a[2]);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, z];
};
// the shell shard the head passes at 2.0 s: placed where the 2.0 s camera sees it low in the frame, close to the lens
let SHELL_: V3 | undefined;
const shellAt = (): V3 => {
  if (!SHELL_) {
    SHELL_ = [0, 0, 0];
    SHELL_ = onFloor(hookState(60).orbit, 820, 1740, 1.0);
  }
  return SHELL_;
};
const hookState = (f: number): State2 => {
  const t = f / 30;
  let pieces: Piece[];
  if (f < B3.brk) {
    const gap = gapHook(f);
    pieces = [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinch3(gap), t}];
  } else {
    // the body recoils as the neck parts, and contracts once as the focus reaches it (2.3-2.7 s)
    const fl = 0.22 * Math.sin(Math.PI * seg(f, B3.brk, B3.brk + 16)) ** 2 + 0.3 * Math.sin(Math.PI * seg(f, 70, 88)) ** 2;
    pieces = [labBody(f, {flinch: fl, bend: fl * 2}), labHead(f)];
  }
  const head = pieces[pieces.length - 1];
  const hs = head.tip - 9; // arc of the head's middle
  const hc = geo(head).at(9, 0, 3.5);
  const bc = geo(pieces[0]).at(f < B3.brk ? 55 : 52, 0, 4);
  const hAz = headAz(PH2, hs);
  // the line from the abandoned body to the head: from in front along it, the body sits right behind the head
  const lAz = (Math.atan2(hc[0] - bc[0], -(hc[1] - bc[1])) * 180) / Math.PI;
  // the head shots, chained
  const k0 = ORB3_0;
  const k1 = rel([hc[0], hc[1], 3.5], hAz, -46, 18, 122, 3150, 1040);
  // low, front-left of the head: the head large in front, the abandoned body behind it up the frame
  const k2 = rel([hc[0], hc[1], 3.4], lAz, -24, 11, 104, 3150, 1180);
  const k3 = rel([hc[0], hc[1], 3.4], lAz, -32, 12, 100, 3150, 1160);
  // ... then up over the head (it slides out under the frame) onto the body, high enough to read its leaf shape
  const k4 = rel([bc[0], bc[1], 4], lAz, -44, 36, 175, 3300, 1000);
  const k5 = rel([bc[0], bc[1], 5], lAz, -64, 48, 155, 3400, 1040);
  let orbit = lerpOrbit(k0, k1, E(f, 16, B3.lat));
  orbit = lerpOrbit(orbit, k2, E(f, B3.low + 6, B3.fore));
  orbit = lerpOrbit(orbit, k3, E(f, B3.fore - 4, B3.rack));
  orbit = lerpOrbit(orbit, k4, E(f, B3.rack - 6, B3.probe + 2));
  orbit = lerpOrbit(orbit, k5, E(f, B3.probe - 2, B3.touch + 8));
  const trail = f > B3.brk ? {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.5 * ease(f, B3.brk, B3.brk + 20)} : undefined;
  // the rack: the head goes soft as the body sharpens
  const blur = {head: 7 * E(f, B3.rack - 4, B3.probe + 4)};
  const probe = probeAt(f);
  return {
    shot: 'H', env: 'lab', orbit, pieces, trail, frags: HOOK_FRAGS, blur, probe,
    props: [
      ...(f > 40 && f < 96 ? [{c: shellAt(), r: [3.6, 2.4, 1.1] as [number, number, number], yaw: 30, col: '#B7A991', blur: 4}] : []),
      {c: [PEBBLE[0], PEBBLE[1], 1.6], r: [3.4, 2.8, 2.0], yaw: -10, col: '#B9AE98'},
    ],
    labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, 40, 50), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- the probe (one continuous move: down, touch, away)
const PDIR: V3 = norm([0.55, -0.3, 0.78]);
function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
const probeAt = (f: number): State2['probe'] => {
  if (f < B3.probe - 8 || f > B3.touch + 60) return undefined;
  const body = labBody(f);
  const contact = geo(body).tube(60, Math.PI / 2 - 0.55);
  const inn = ease(f, B3.probe - 8, B3.touch, outCubic), away = ease(f, B3.touch + 8, B3.touch + 40);
  const back = 70 * (1 - inn) + 55 * away;
  const press = clamp(seg(f, B3.touch - 2, B3.touch + 1)) * (1 - seg(f, B3.touch + 3, B3.touch + 8));
  const tip: V3 = [contact[0] + PDIR[0] * (back + 0.5 - press * 1.3), contact[1] + PDIR[1] * (back + 0.5 - press * 1.3), contact[2] + PDIR[2] * (back + 0.5 - press * 1.3)];
  return {tip, dir: PDIR, press, op: clamp(seg(f, B3.probe - 8, B3.probe - 2)) * (1 - seg(f, B3.touch + 34, B3.touch + 44))};
};

// ---------------------------------------------------------------- 3.2-6.8 s: the body reacts
// Touch at 3.23 s: the parapodium under the probe curls hard and the body flinches. The contraction does not stop there:
// it runs forward along the body as a ring of squeezing muscle, the camera following it, and on "MOVING" the whole
// body heaves as it reaches the front. It never crawls. The ripple arrives at the sealed neck end, where we go inside.
const bodyState = (f: number): State2 => {
  const tw = f < B3.touch ? 0 : outCubic(seg(f, B3.touch, B3.touch + 5)) * (1 - 0.85 * ease(f, B3.touch + 8, B3.touch + 34));
  const ra = lerp(64, 26, ease(f, B3.ripple, B3.neck, (u) => u));
  const ramp = ease(f, B3.ripple - 2, B3.ripple + 10) * (1 - ease(f, B3.neck - 2, B3.rew0 + 4));
  const heave = Math.sin(Math.PI * seg(f, B3.move - 6, B3.move + 16)) ** 2;
  // the rear half writhes from side to side as the ripple passes; on "BODY?" both parapodia clench
  const writhe = Math.sin((2 * Math.PI * (f - B3.ripple)) / 34) * ease(f, B3.ripple, B3.ripple + 10) * (1 - ease(f, B3.move + 8, B3.neck));
  const clench = Math.sin(Math.PI * seg(f, F('body') - 6, F('body') + 14)) ** 2;
  const fl = 0.3 * tw + 0.45 * heave + 0.55 * clench;
  const pieces = [labBody(f, {flinch: fl, bend: 1.6 * fl - 1.2 * heave + 1.4 * writhe, twitch: {side: 1, a: 60, amp: clamp(tw + 0.5 * heave)}, ripple: {a: ra, amp: (0.9 + 0.5 * heave) * ramp}}), labHead(f)];
  const end = hookState(Math.min(f, B3.touch + 8)).orbit;
  const body = pieces[0];
  const rp = geo(body).at(ra, 0, 5);
  const hAz = headAz(PH2, S0 - 40);
  // follow the ripple forward along the body, coming round to the front-side; finish close on the neck end
  // round the body with the ripple: from high behind it to low at its front-left
  const follow = rel(rp, hAz, lerp(-160, -95, E(f, B3.ripple, B3.move)), lerp(56, 40, E(f, B3.ripple, B3.move)), lerp(180, 150, E(f, B3.ripple, B3.move)), 3400, 1000);
  const neckEnd = geo(body).at(25, 0, 4.5);
  const close = rel(neckEnd, hAz, -70, 34, 120, 3500, 1000);
  let orbit = lerpOrbit(end, follow, E(f, B3.touch + 8, B3.ripple + 30));
  orbit = lerpOrbit(orbit, close, E(f, B3.move - 10, B3.neck + 6));
  const head = pieces[1];
  return {shot: 'B', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, blur: {head: 7}, probe: probeAt(f), props: hookState(B3.touch).props, trail: {path: PH2, from: S0 - 20 + GBRK, to: head.tip - 21, op: 0.5}, labels: []};
};

// ---------------------------------------------------------------- 6.8-12.7 s: the neck and the heart
// From the neck end: a quick REWIND brings the head back along its trail until it rejoins. The skin over the neck and
// the front of the body clears into a tissue window: gland, gut, the buccal mass and ganglia in the head, and behind
// the neck the heart pumping in its sac. A pale band marks the weak spot. Then (just ahead of "breaks apart") the head
// pulls, the band draws thin and parts; the heart beats on in the body while the head glides away with nothing behind
// its neck. Once that has read, the view sinks into the body's tissue beside the heart.
const PH_HEART = 24;
const secHead = (f: number): number => S0 + GBRK + secTravel(f);
const ST_: number[] = [0];
for (let f = B3.part + 1; f <= B3.feed + 2; f++) ST_.push(ST_[ST_.length - 1] + 0.36 * (1 + 0.25 * Math.sin((2 * Math.PI * (f - B3.part)) / 26)));
const secTravel = (f: number) => ST_[clamp(Math.round(f - B3.part), 0, ST_.length - 1)];
const beatOld = (f: number) => beatAt(f, 150, 24) * (1 + 0.4 * Math.exp(-Math.pow((f - B3.heart - 4) / 6, 2)));
const winOf = (f: number, open: number): Piece['win'] => ({a: PH_HEART, r: 17, open});
const anatomyPieces = (f: number): Piece[] => {
  const t = f / 30;
  const open = E(f, B3.win0 - 2, B3.win0 + 14);
  const weak = E(f, B3.weak, B3.weak + 8) * (1 - E(f, B3.part - 2, B3.part + 6));
  if (f < B3.rew1) {
    // the rewind: the head runs back along its trail (fast, easing in) and the stump re-opens to meet it
    const k = E(f, B3.rew0, B3.rew1);
    const from = labHead(B3.rew0).tip;
    const tip = lerp(from, S0 + GBRK, k);
    const gH = GBRK * k;
    return [labBody(B3.rew0, {}), {...labHead(f, tip), gap: gH, seal: 1 - k, crawl: -crawlAt(f) * 2, crawlAmp: 0.6 * (1 - k)}];
  }
  if (f < B3.part) {
    // whole again; the neck re-forms, then the pull begins
    const reform = ease(f, B3.rew1, B3.rew1 + 4);
    const gap = GBRK * (1 - reform) + GBRK * E(f, B3.pull, B3.part);
    return [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinch3(gap), t, heart: 1, beat: beatOld(f), win: winOf(f, open), weak}];
  }
  const gH = GBRK * (1 - ease(f, B3.part, B3.part + 10, outCubic)), gB = GBRK * (1 - ease(f, B3.part, B3.part + 8, outCubic));
  const sl = ease(f, B3.part, B3.part + 7, outCubic), cr = (2 * Math.PI * (f - B3.part)) / 26;
  return [
    {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, heart: 1, beat: beatOld(f), win: winOf(f, open)},
    {id: 'head', path: PH2, tip: secHead(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: sl, t, crawl: cr, crawlAmp: ease(f, B3.part, B3.part + 6), win: winOf(f, open)},
  ];
};
const anatomyState = (f: number): State2 => {
  const pieces = anatomyPieces(f);
  const from = bodyState(B3.rew0 - 1).orbit;
  const hAz = headAz(PH2, S0 - 20);
  // the window: close, from the front-left flank, slightly above (the neck groove and the heart both in view)
  // the window, from behind-left and above: the heart near the lens, the head ahead of it up the frame, so when the
  // neck parts the head visibly pulls away up the frame while the heart stays put in the foreground
  const neck = onPath(S0 - 22, 0, 5);
  const win: Orbit = rel(neck, hAz, -146, 36, 104, 3200, 900);
  let orbit = lerpOrbit(from, rel(onPath(S0 - 24, 0, 5), hAz, -120, 34, 130, 3300, 1040), E(f, B3.rew0, B3.rew1));
  orbit = lerpOrbit(orbit, win, E(f, B3.rew1 - 4, B3.win0 + 14));
  if (f >= B3.part) {
    // tilt up after the leaving head a little (the heart stays low in frame)
    const hd = geo(pieces[1]).at(10, 0, 4);
    const k = E(f, B3.part, B3.tissue) * 0.16;
    orbit = {...orbit, target: [lerp(orbit.target[0], hd[0], k), lerp(orbit.target[1], hd[1], k), 5], cy: lerp(orbit.cy ?? 960, 980, k / 0.16)};
  }
  // then down into the tissue beside the heart
  if (f > B3.tissue) {
    const tc = geo(pieces[0]).at(36, 0.3, 5);
    const deep: Orbit = rel(tc, hAz, -140, 40, 96, 3200 * 5, 960);
    orbit = lerpOrbit(orbit, deep, ease(f, B3.tissue, B3.micro + 14, (u) => u * u * u));
  }
  const rew = seg(f, B3.rew0, B3.rew0 + 2) * (1 - seg(f, B3.rew1, B3.rew1 + 6));
  const micro = f > B3.micro - 10 ? microAt(f) : undefined;
  return {shot: 'A', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, dim: 0.1 * E(f, B3.win0, B3.win0 + 12), micro, labels: [{text: 'REWIND', op: rew, icon: 'rw'}]};
};

// ---------------------------------------------------------------- 12.7-16.3 s: the parasites
// Inside the tissue beside the heart: gland cells packed with green chloroplasts, and two copepod-like parasites
// working their way between them (drawn ghosted, with a HYPOTHESIS tag and a 0.1 mm scale). Then the view rises back
// out through the same tissue, the body re-forms around it, and the camera turns to follow the head gliding away.
const microAt = (f: number): State2['micro'] => {
  const op = ease(f, B3.micro - 10, B3.micro + 2) * (1 - ease(f, B3.out0 + 4, B3.out0 + 16));
  if (op <= 0) return undefined;
  const zIn = 0.75 + 0.55 * ease(f, B3.micro - 10, B3.out0, (u) => u);
  const zOut = ease(f, B3.out0, B3.out0 + 16);
  return {
    op, reveal: ease(f, B3.micro - 10, B3.micro + 4), para: ease(f, B3.bugs - 6, B3.bugs + 6),
    zoom: zIn * lerp(1, 0.45, zOut), swim: Math.max(0, (f - B3.bugs) / 30), bar: ease(f, B3.bugs, B3.bugs + 8) * (1 - zOut),
  };
};
const paraState = (f: number): State2 => {
  const a = anatomyState(Math.min(f, B3.micro + 14));
  const pieces = anatomyPieces(f).map((p) => ({...p, win: winOf(f, 1 - E(f, B3.out0 + 6, B3.follow + 4))}));
  const head = pieces[1];
  const hs = head.tip - 9;
  const hc = geo(head).at(9, 0, 3.5);
  // out: the deep view pulls back (the tissue shrinks back into the body), then turns after the head
  const out = E(f, B3.out0, B3.follow);
  // back out, high and wide enough to hold both the body (heart low) and the head far up the frame, then after it
  const bt = geo(pieces[0]).at(31, 0, 5);
  const body = rel([(bt[0] + hc[0]) / 2, (bt[1] + hc[1]) / 2, 4], headAz(PH2, S0 - 20), -150, 50, 270, 3200, 980);
  const chase = rel([hc[0], hc[1], 3.5], headAz(PH2, hs), -150, 20, 112, 3150, 1040);
  let orbit = lerpOrbit(a.orbit, body, out);
  orbit = lerpOrbit(orbit, chase, E(f, B3.follow - 6, B3.feed));
  const hyp = ease(f, B3.bugs + 4, B3.bugs + 12) * (1 - ease(f, B3.out0 + 2, B3.out0 + 10));
  return {shot: 'P', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, dim: 0.1 * (1 - out), micro: microAt(f), labels: [{text: 'HYPOTHESIS', op: hyp, icon: 'none'}]};
};

// ---------------------------------------------------------------- 16.3-19.0 s: feeding, on the seabed
// Matched cut on the gliding head (same place on screen, same direction, same camera relative to it). It reaches a
// Bryopsis stalk, rears and presses its snout to it, and pumps; the frond's green contents stream down the stalk into
// the snout while the frond clears from its tips, and the head greens. The camera then slides back along the head to
// where new tissue is starting to bud.
export const TIP_SEA = 124.4;
const PHS_AZ = headAz(PHS, 120);
const seaHead = (f: number): Piece => {
  const t = f / 30;
  const arrive = ease(f, B3.feed, B3.contact, outCubic);
  const pump = f > B3.contact + 2 ? Math.sin((2 * Math.PI * (f - B3.contact - 2)) / 11) : 0;
  const go = 1 - ease(f, B3.contact - 6, B3.contact + 2);
  return {
    id: 'head', path: PHS, tip: lerp(TIP_SEA - 6.5, TIP_SEA, arrive) + 0.45 * pump * ease(f, B3.contact, B3.contact + 6), a0: 0, a1: 22, gap: 0, pinch: 1, seal: 1, t,
    crawl: crawlAt(f), crawlAmp: go, surge: 0.022 * pump * ease(f, B3.contact, B3.contact + 6),
    rear: 0.45 * ease(f, B3.contact - 8, B3.contact + 2), green: 0.85 * ease(f, B3.contact + 4, B3.week0 + 10),
  };
};
// growth: the bud from ~18 s; the time-lapse runs the days; scene 7 runs it to the full body
export const growAt3 = (f: number) => {
  if (f < B3.grow0) return 0.016 + 0.164 * ease(f, B3.back, B3.newHeart, (u) => u * (2 - u));
  return lerp(0.18, 1, E(f, B3.grow0, B3.grow1));
};
export const dayAt3 = (f: number) => (f < B3.week0 ? 0 : f < B3.grow0 ? 1 + 6 * ease(f, B3.week0, B3.newHeart) : 7 + 14 * E(f, B3.grow0, B3.grow1));
const regen3 = (f: number, o: Partial<Piece> = {}): Piece => {
  const t = f / 30;
  return {id: 'regen', path: PHS, tip: TIP_SEA, a0: 0, a1: 100, gap: 0, pinch: 1, seal: 1, t, grow: growAt3(f), green: 0.85 * (1 - E(f, B3.grow0 + 30, B3.grow1)), ...o};
};
const feedState = (f: number): State2 => {
  const lab = paraState(B3.feed - 1);
  const head = seaHead(f);
  const snout = geo(head).at(1, 0, 4);
  // the matched cut: the lab chase camera, re-expressed relative to the head
  const labHeadP = lab.pieces[1];
  const lhc = geo(labHeadP).at(9, 0, 3.5);
  const sh = geo(head).at(9, 0, 3.5);
  const m: Orbit = {...lab.orbit, target: [lab.orbit.target[0] - lhc[0] + sh[0], lab.orbit.target[1] - lhc[1] + sh[1], lab.orbit.target[2]], az: lab.orbit.az - headAz(PH2, labHeadP.tip - 9) + PHS_AZ};
  const contact = rel([snout[0] + 0.5, snout[1] + 2, 5.5], PHS_AZ, -66, 22, 62, 3300, 1060);
  const rear = rel(geo(head).at(18, 0, 4), PHS_AZ, -112, 26, 92, 3300, 1050);
  let orbit = lerpOrbit(m, contact, E(f, B3.feed + 2, B3.contact + 6));
  orbit = lerpOrbit(orbit, rear, E(f, B3.back, B3.week0 + 14));
  const pieces = f < B3.back ? [head] : [regen3(f, {rear: head.rear, green: head.green, surge: head.surge})];
  const drain = ease(f, B3.contact + 2, B3.back + 4, (u) => u * (2 - u));
  return {shot: 'F', env: 'sea', orbit, pieces, feed: {u: 0.02, drain, down: true, flow: ease(f, B3.contact + 2, B3.contact + 8) * (1 - ease(f, B3.week0 - 4, B3.week0 + 4))}, labels: []};
};

// ---------------------------------------------------------------- 19.0-21.5 s: the new heart
// TIME-LAPSE: days run (slow light dips, fast-swaying algae); behind the head the bud of new tissue swells. The skin
// over it clears: a loose cluster of cells draws together into a small sac and heart ("a NEW HEART"), which then
// squeezes twice, hard and plainly, on "BEATING" (the heartbeat sound uses the same frames). Then on.
const heartState = (f: number): State2 => {
  const from = feedState(B3.week0 + 14).orbit;
  const open = E(f, B3.win2, B3.win2 + 12) * (1 - E(f, B3.close, B3.close + 10));
  const hv = ease(f, B3.win2 + 2, B3.newHeart + 10);
  const p = regen3(f, {heart: hv, beat: beat3(f, B3.beat) * (f < B3.beat + 2 * BEAT_PER3 + 4 ? 1 : 0.6), win: {a: 0, r: 34, open}});
  p.win!.a = heartAOf(p);
  const hc = geo(p).at(p.win!.a, 0, 5);
  const close: Orbit = rel(hc, PHS_AZ, -100, 34, 56, 3300 * 1.3, 940);
  const orbit = lerpOrbit(from, close, E(f, B3.week0 + 10, B3.newHeart));
  const lapse = ease(f, B3.week0 - 2, B3.week0 + 3);
  const day = Math.round(dayAt3(f));
  return {
    shot: 'N', env: 'sea', orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true}, lapse, frondFade: 0.6 * open,
    night: lapse * 0.24 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B3.week0, B3.newHeart))),
    labels: [{text: `TIME-LAPSE · DAY ${day}`, op: ease(f, B3.week0, B3.week0 + 4), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 21.5-25.0 s: the body grows back
// One continuous time-lapse from a low, travelling side view (algae passing in front and behind): the bud lengthens
// into a body, the parapodia rise as narrow pale ridges, widen and fold up over the back, the green and the spots come
// back. The animal stays alive throughout (pedal waves, the rhinophores moving). Same head the whole time.
const growState = (f: number): State2 => {
  const settle = 1 - E(f, B3.grow1 - 4, B3.twice0 - 2);
  const p = regen3(f, {crawl: (2 * Math.PI * f) / 9, crawlAmp: 0.5 * E(f, B3.grow0, B3.grow0 + 10) * settle, sway: 1 + 0.6 * settle, bend: 0.25 * Math.sin(f / 9) * settle});
  const from = heartState(B3.grow0 - 1).orbit;
  // the camera travels back alongside as the body grows toward it, then rises a little to show the full animal
  const mid = geo(p).at(lerp(16, 46, E(f, B3.grow0, B3.grow1)), 0, 4);
  const side = rel(mid, PHS_AZ, lerp(-118, -40, E(f, B3.grow0, B3.grow1 + 6)), lerp(16, 30, E(f, B3.grow0, B3.grow1)), lerp(105, 245, E(f, B3.grow0, B3.grow1)), 3300, lerp(1000, 940, E(f, B3.grow0, B3.grow1)));
  const orbit = lerpOrbit(from, side, E(f, B3.grow0 - 2, B3.grow0 + 22));
  const run = 1 - ease(f, B3.grow1 - 6, B3.grow1 + 2);
  const day = Math.round(dayAt3(f));
  return {
    shot: 'G', env: 'sea', orbit, pieces: [p], feed: {u: 0.02, drain: 1, down: true}, lapse: run, frondFade: 0.6 * (1 - E(f, B3.grow0, B3.grow0 + 10)),
    night: run * 0.22 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, B3.grow0, B3.grow1))),
    labels: [{text: `TIME-LAPSE · DAY ${day}`, op: 1 - ease(f, B3.grow1 + 2, B3.grow1 + 8), icon: 'ff'}],
  };
};

// ---------------------------------------------------------------- 25.0 s - end: it does it again
// Matched cut on the regrown animal (same pose and screen place) back to the dish. It glides to where the film began
// while the camera closes on the neck. On "actually did it" the neck draws in; just after, the head starts to pull; on
// "TWICE" the stretch is unmistakable and accelerating. The last frame runs straight into frame 0 (same camera, same
// gap and pinch, the stretch carrying on at the hook's rate).
const gapEnd = (f: number) => (f < B3.pull2 ? 0 : G0 * Math.pow(clamp((f - B3.pull2) / (B3.end - B3.pull2)), 1.6));
const loopState = (f: number): State2 => {
  const tl = (f - B3.end) / 30;
  const gap = gapEnd(f);
  const glide = ease(f, B3.twice0, B3.pull2, (u) => u * (2 - u));
  const bodyTip = lerp(S0 - 24, S0, glide);
  const draw = 0.42 * ease(f, B3.did - 2, B3.did + 14);
  const crawl = (2 * Math.PI * (f - B3.end)) / 26;
  const pieces: Piece[] = [{
    id: 'whole', path: PH2, tip: bodyTip + gap, a0: 0, a1: 100, gap, pinch: Math.max(draw, pinch3(gap)), t: tl,
    crawl, crawlAmp: 1 - ease(f, B3.pull2 - 14, B3.pull2 + 6),
  }];
  // the matched cut: the regrowth's last camera, re-expressed relative to the animal
  const sea = growState(B3.twice0 - 1);
  const sp = geo(sea.pieces[0]).at(46, 0, 4), lp = geo(pieces[0]).at(46, 0, 4);
  const m: Orbit = {...sea.orbit, target: [sea.orbit.target[0] - sp[0] + lp[0], sea.orbit.target[1] - sp[1] + lp[1], sea.orbit.target[2]], az: sea.orbit.az - PHS_AZ + headAz(PH2, bodyTip - 46)};
  const orbit = lerpOrbit(m, ORB3_0, E(f, B3.twice0 + 4, B3.end));
  return {shot: 'T', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, props: hookState(0).props, labels: [{text: 'TIME-LAPSE', op: ease(f, B3.end - 9, B3.end - 1), icon: 'ff'}], loopT: tl};
};

export const stateAt3 = (f: number): State2 => {
  if (f < B3.touch) return hookState(f);
  if (f < B3.rew0) return bodyState(f);
  if (f < B3.micro + 14) return anatomyState(f);
  if (f < B3.feed) return paraState(f);
  if (f < B3.week0 + 14) return feedState(f);
  if (f < B3.grow0) return heartState(f);
  if (f < B3.twice0) return growState(f);
  return loopState(f);
};
void A_CUT;

/** the picture's event frames for the sound (tools/export_cues_v3.ts -> audio/cues_v3.json), in the V2 cue layout
 *  (tools/make_audio.py reads both) plus the V3 events */
export const CUES3 = () => {
  const days: number[] = [];
  let last = 0;
  for (let f = B3.week0; f < B3.twice0; f++) {
    const d = Math.round(dayAt3(f));
    if (d !== last && last > 0) days.push(f);
    last = d;
  }
  return {
    frames: FRAMES,
    S: {hook: 0, body: B3.touch, weak: B3.rew0, para: B3.micro, feed: B3.feed, heart: B3.week0, grow: B3.grow0, twice: B3.twice0, end: FRAMES},
    brk: B3.brk, touch: B3.touch, move: B3.move, ripple: B3.ripple, rew0: B3.rew0, rew1: B3.rew1, join: B3.win0, weak: B3.weak,
    brk2start: B3.pull, brk2: B3.part, in0: B3.tissue, in1: B3.micro + 14, para: B3.bugs, out0: B3.out0, out1: B3.follow,
    arrive: B3.contact, suck: B3.contact + 2, pumpPer: 11, week0: B3.week0, newHeart: B3.newHeart, beat: B3.beat, beatPer: BEAT_PER3,
    did: B3.did, twice: B3.twice, loopGap0: B3.pull2, days,
  };
};
