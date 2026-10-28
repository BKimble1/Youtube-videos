// The module station (a separate demonstration, after a deliberate cut): the robot walks on its stick across the
// recovery mat; the stick module X stops working (its light goes out and it no longer extends, so the push stalls);
// the robot lowers, X's connector lets go and X is left lying where it fell; the robot steps sideways to a separate,
// working module R (teal band) lying ready, R telescopes its end into V1 and connects, and the robot rears up onto R
// and walks on. Beside the path, in a shallow parts tray, lies a broken robot: a collapsed triangle with a cracked
// housing and a snapped connector, its lights dark, and one intact module (I) still attached, its standby light on.
import {add, clamp, easeIn, mix, ss, ss5, sub, V3, v3, len} from '../lib/v3';
import {box, Item, line, poly, Proj} from '../lib/r3';
import {COL, contactCue, GY, Link, linkItems, shadowItems} from '../rig/truss';
import {lensAdd, regular, tetra} from '../rig/body';
import {bodyTravel, strokes, tipTravel} from '../rig/gait';
import {E, T} from '../lib/time';
import {ENV, lightPool} from './benchArt';
import {tLinks} from './ramp';
import {INK} from '../dc/ink';

export const C0 = T('and if');
const TILT = (27 * Math.PI) / 180;
export const EV = {
  die: T('stops working') + 0.18,
  lower0: T('it can') - 0.02,
  lower1: T('drop') + 0.12,
  release: T('drop') + 0.16,
  side0: T('drop') + 0.24,
  side1: T('and attach') + 0.12,
  reach0: T('and attach') + 0.12,
  contact: T('replacement') + 0.2,
  rear0: E('replacement') - 0.25,
  rear1: E('replacement') + 0.3,
  walk0: E('replacement') + 0.55,
};

const BX0 = 0.3;
const SHIFT = 0.115;

export const runoutState = (t: number) => {
  // walking before the failure: one push and its recovery
  const S0 = strokes(C0 + 0.04, 1, 0.47, 0.1);
  // after the replacement: three slower pushes, the last one ending well before the end
  const S1 = strokes(EV.walk0 + 0.25, 3, 0.62, 0.07);
  let bx = BX0 - bodyTravel(S0, t) - bodyTravel(S1, t);
  // stalled push after the failure: the links work, the body only shivers
  const stall = ss(EV.die + 0.1, EV.die + 0.25, t) * (1 - ss(EV.lower0 - 0.15, EV.lower0, t));
  bx += Math.sin((t - EV.die) * 26) * 0.003 * stall;
  const tilt = TILT * (1 - ss5(EV.lower0, EV.lower1, t)) + TILT * ss5(EV.rear0, EV.rear1, t);
  const bz = SHIFT * ss5(EV.side0, EV.side1, t);
  const wob = Math.sin(t * 9) * 0.006 + Math.sin(t * 17) * 0.014 * stall;
  const tet = tetra(lensAdd(regular(), {l03: wob, l23: -wob, l13: wob * 0.5}), {x: bx, z: bz, yaw: 0, tilt});

  // ---- X: walking stick until it fails; dead length fixed; dropped
  const xTip0 = BX0 + 0.2547 + 0.3;
  let xTip = v3(xTip0 - tipTravel(S0, t), GY, 0);
  const deadLen = 0.3 / Math.cos(Math.atan2(0.1298, 0.3)) ; // its length when it stopped (after the recovery)
  const released = t >= EV.release;
  let xa: V3;
  if (!released) {
    xa = tet.V1;
    if (t > EV.die) {
      // dead: fixed length; the tip is dragged along the mat as the body lowers
      const d = sub(xTip, xa);
      const h = xa.y - GY;
      const horiz = Math.sqrt(Math.max(0, deadLen * deadLen - h * h));
      xTip = v3(xa.x + horiz, GY, xa.z);
      void d;
    }
  } else {
    // the connector lets go: X's end eases back 1 cm and stays
    const v1r = tetra(regular(), {x: BX0 - 0.1, z: 0, yaw: 0, tilt: 0}).V1;
    const back = 0.012 * ss5(EV.release, EV.release + 0.12, t);
    xa = add(v1r, v3(back, 0, 0));
    xTip = v3(v1r.x + deadLen + back, GY, 0);
  }
  const xLed = 1 - ss(EV.die - 0.06, EV.die + 0.1, t);
  const X: Link = {id: 'X', a: xa, b: xTip, band: COL.bandX, led: xLed};

  // ---- R: the replacement, lying ready (active), reaches into V1 and connects; then the new walking stick
  const v1s = tetra(regular(), {x: BX0 - 0.1, z: SHIFT, yaw: 0, tilt: 0}).V1; // V1 after the side step
  const rTip0 = v1s.x + 0.075 + 0.3;
  let gap: number;
  if (t < EV.reach0) gap = 0.075;
  else if (t < EV.contact - 0.16) gap = mix(0.075, 0.024, ss5(EV.reach0, EV.contact - 0.16, t));
  else gap = mix(0.024, 0, easeIn(EV.contact - 0.16, EV.contact, t, 2.6));
  const joined = t >= EV.contact;
  // after rearing up the tip recovers (slides in), then the pushes
  const rec = ss5(EV.rear1 + 0.02, EV.walk0 + 0.2, t);
  const rTipX = rTip0 - 0.1 * rec - tipTravel(S1, t);
  const ra = joined ? tet.V1 : add(v1s, v3(gap, 0, 0));
  const R: Link = {id: 'R', a: ra, b: v3(rTipX, GY, SHIFT), band: COL.bandR, led: 1};

  const links = [...tLinks(tet, 'T', COL.bandT), X, R];
  return {t, tet, X, R, links, joined, cueR: clamp((t - EV.contact) / 0.32), cueRel: clamp((t - EV.release) / 0.3)};
};

// ---- the broken robot in the parts tray (static; only I's standby light pulses)
const TRAY = {x0: -0.82, x1: -0.16, z0: 0.34, z1: 0.84, rim: 0.014};
const BA = v3(-0.64, GY, 0.66), BB = v3(-0.34, GY, 0.56), BC = v3(-0.56, GY, 0.79);
export const I_END = v3(-0.27, GY, 0.39);
export const brokenLinks = (t: number): Link[] => {
  const blink = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 2.4)), 6);
  return [
    {id: 'B0', a: BA, b: BB, band: COL.bandB, led: 0, crack: true},
    {id: 'B1', a: BB, b: add(BC, v3(0.02, 0, -0.03)), band: COL.bandB, led: 0, noCapB: true},
    {id: 'B2', a: BC, b: BA, band: COL.bandB, led: 0},
    // the intact module, still joined at BB, its free end toward the robot's path
    {id: 'I', a: BB, b: I_END, band: COL.bandB, led: blink},
  ];
};
void len;

const trayArt = (P: Proj): (Item | null)[] => {
  const out: (Item | null)[] = [];
  out.push(poly(P, [v3(TRAY.x0, 0.0008, TRAY.z0), v3(TRAY.x1, 0.0008, TRAY.z0), v3(TRAY.x1, 0.0008, TRAY.z1), v3(TRAY.x0, 0.0008, TRAY.z1)], '#C9D6DC', {layer: 1, sw: 2.5, depthBias: 20}));
  const w = 0.012;
  out.push(...box(P, v3((TRAY.x0 + TRAY.x1) / 2, TRAY.rim / 2, TRAY.z0), v3((TRAY.x1 - TRAY.x0) / 2, TRAY.rim / 2, w / 2), {top: '#E5ECEF', side: '#AFC0C8', front: '#B9C8CF'}, {layer: 3}));
  out.push(...box(P, v3((TRAY.x0 + TRAY.x1) / 2, TRAY.rim / 2, TRAY.z1), v3((TRAY.x1 - TRAY.x0) / 2, TRAY.rim / 2, w / 2), {top: '#E5ECEF', side: '#AFC0C8', front: '#B9C8CF'}, {layer: 3}));
  out.push(...box(P, v3(TRAY.x0, TRAY.rim / 2, (TRAY.z0 + TRAY.z1) / 2), v3(w / 2, TRAY.rim / 2, (TRAY.z1 - TRAY.z0) / 2), {top: '#E5ECEF', side: '#AFC0C8', front: '#B9C8CF'}, {layer: 3}));
  out.push(...box(P, v3(TRAY.x1, TRAY.rim / 2, (TRAY.z0 + TRAY.z1) / 2), v3(w / 2, TRAY.rim / 2, (TRAY.z1 - TRAY.z0) / 2), {top: '#E5ECEF', side: '#AFC0C8', front: '#B9C8CF'}, {layer: 3}));
  return out;
};

export const runoutArt = (P: Proj): (Item | null)[] => {
  const out: (Item | null)[] = [];
  const WZ = -1.1;
  out.push(poly(P, [v3(-4, 0, WZ), v3(4, 0, WZ), v3(4, 2.6, WZ), v3(-4, 2.6, WZ)], ENV.wall, {layer: 0, stroke: null, depthBias: 100}));
  out.push(poly(P, [v3(-4, -1, WZ + 0.001), v3(4, -1, WZ + 0.001), v3(4, 0.0, WZ + 0.001), v3(-4, 0.0, WZ + 0.001)], ENV.panel, {layer: 0, stroke: null, depthBias: 99}));
  // a rack of spare links on the wall: three short shelves, each with links lying on it
  for (const [y, x0] of [[0.5, -0.9], [0.78, -0.75]] as [number, number][]) {
    out.push(...box(P, v3(x0 + 0.55, y, WZ + 0.07), v3(0.6, 0.01, 0.07), {top: ENV.shelf, side: ENV.woodFront, front: ENV.woodFront}, {layer: 0}));
  }
  out.push(poly(P, [v3(-3, 0, WZ), v3(3, 0, WZ), v3(3, 0, 1.4), v3(-3, 0, 1.4)], ENV.wood, {layer: 1, stroke: null, depthBias: 70}));
  out.push(poly(P, [v3(-1.6, 0.0002, -0.7), v3(1.6, 0.0002, -0.7), v3(1.6, 0.0002, 1.1), v3(-1.6, 0.0002, 1.1)], ENV.mat, {layer: 1, sw: 2.4, depthBias: 60}));
  for (let x = -1.6; x <= 1.6 + 1e-6; x += 0.05) {
    const bold = Math.abs(Math.round(x / 0.25) * 0.25 - x) < 1e-6;
    out.push(line(P, [v3(x, 0.0004, -0.7), v3(x, 0.0004, 1.1)], bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {layer: 1, depthBias: 50}));
  }
  for (let z = -0.7; z <= 1.1 + 1e-6; z += 0.05) {
    const bold = Math.abs(Math.round(z / 0.25) * 0.25 - z) < 1e-6;
    out.push(line(P, [v3(-1.6, 0.0004, z), v3(1.6, 0.0004, z)], bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {layer: 1, depthBias: 50}));
  }
  out.push(...trayArt(P));
  return out;
};

/** spare links resting on the wall rack (static props, dark lights) */
const rackLinks = (): Link[] => {
  const WZ = -1.1 + 0.07;
  const L: Link[] = [];
  const ys = [0.5 + 0.01 + 0.02, 0.78 + 0.01 + 0.02];
  ys.forEach((y, r) => {
    for (let k = 0; k < 3; k++) {
      const x0 = (r ? -0.7 : -0.85) + k * 0.36;
      L.push({id: `K${r}${k}`, a: v3(x0, y, WZ), b: v3(x0 + 0.29, y, WZ), band: k === 1 ? COL.bandR : COL.bandT, led: 0});
    }
  });
  return L;
};

const poolI = (P: Proj, t: number) => {
  const a = ss(T('could') - 0.3, T('could') + 0.6, t);
  if (a <= 0) return null;
  return lightPool(P, v3(-0.3, 0.001, 0.47), 0.2, 0.42 * a);
};

export const runoutItems = (P: Proj, t: number): (Item | null)[] => {
  const s = runoutState(t);
  const B = brokenLinks(t);
  return [
    ...runoutArt(P),
    ...shadowItems(P, [...s.links, ...B]),
    ...rackLinks().flatMap((l) => linkItems(P, l, {layer: 0})),
    ...B.flatMap((l) => linkItems(P, l)),
    ...s.links.flatMap((l) => linkItems(P, l)),
    contactCue(P, s.tet.V1, s.cueR),
    // the ending: a warm pool of task light settles on the intact module (lighting, not a callout)
    poolI(P, t),
  ];
};
void INK;
