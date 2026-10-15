// One street-world scene with the same rig, dog, leash, band and camera; every shot that shows him uses it.
// Optional layers: the diagram backdrop that isolates the forearm (section views), the x-ray of the chest and
// upper arm, and extras drawn in the world after him (the drone, light, rings).
// V4: the leash is drawn here and only here, from the dog's collar to its released handle on the grass, between the
// dog and the man; it is never tied to his hands and has no visibility gates (the section backdrop covers it).
import React from 'react';
import {ArmFrame, armPt, armR, DEV_GEO, DeviceView, HAND_VEIL, handVeilDir, handVeilEdge} from '../art/Device';
import {collarRing, Dog, DogPose} from '../art/Dog';
import {Expr} from '../art/Head';
import {HandPose} from '../art/Hand';
import {Leash} from '../art/Leash';
import {Man, manJoints, ManPose} from '../art/Man';
import {FrontTufts, Street} from '../art/Street';
import {Cam, toScreen} from '../lib/camera';
import {add, clamp, mul, smooth, V} from '../lib/math';
import {SoftShadow} from '../lib/shade';
import {Contacts, GROUND} from './StreetShots';

const f2 = (n: number) => n.toFixed(2);

/** V4 polish: with `vig` the backdrop arrives as a vignette closing in from the frame's edges toward the band (and
 *  leaves by opening out from it), so every pixel is either the scene in its own light, darkening toward the edges, or
 *  the backdrop: never the body seen through a uniformly half-faded backdrop. `vig`: the centre, the inner radius of
 *  the soft edge (negative: the centre itself is partly covered) and the edge's width, world units (Scene sets them in
 *  screen terms). Without it the backdrop fades as a whole. */
export const Backdrop: React.FC<{id: string; c: V; a: number; vig?: {c: V; r: number; w: number}}> = ({id, c, a, vig}) => {
  if (a <= 0.01) return null;
  const iris = vig && a < 0.999 && vig.r + vig.w > 0 ? vig : undefined;
  const r1 = iris ? iris.r + iris.w : 1;
  const rs = iris ? Math.max(0, iris.r) : 0;
  return (
    <g opacity={vig ? 1 : a}>
      <defs>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={260}>
          <stop offset="0" stopColor="#2A4C63" />
          <stop offset="0.6" stopColor="#173041" />
          <stop offset="1" stopColor="#0C1A24" />
        </radialGradient>
        {iris && (
          <radialGradient id={`${id}-vg`} gradientUnits="userSpaceOnUse" cx={f2(iris.c.x)} cy={f2(iris.c.y)} r={f2(r1)}>
            {SS.map((o, i) => {
              const d = rs + (r1 - rs) * o;
              return <stop key={i} offset={(d / r1).toFixed(4)} stopColor="#FFF" stopOpacity={smooth(clamp((d - iris.r) / iris.w)).toFixed(4)} />;
            })}
          </radialGradient>
        )}
        {iris && (
          <mask id={`${id}-vm`} maskUnits="userSpaceOnUse" x={f2(c.x - 6000)} y={f2(c.y - 6000)} width={12000} height={12000}>
            <rect x={f2(c.x - 6000)} y={f2(c.y - 6000)} width={12000} height={12000} fill={`url(#${id}-vg)`} />
          </mask>
        )}
      </defs>
      <rect x={c.x - 6000} y={c.y - 6000} width={12000} height={12000} fill={`url(#${id}-g)`} mask={iris ? `url(#${id}-vm)` : undefined} />
    </g>
  );
};
/** gradient stop positions for a smoothstep ramp (the gradients interpolate linearly between them) */
const SS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const ssStops = SS.map((o, i) => <stop key={i} offset={o} stopColor="#FFF" stopOpacity={smooth(o).toFixed(4)} />);
/** the same ramp as opaque greys (a mask path that must replace what is under it, drawn once: no seam at its edge) */
const ssGrey = SS.map((o, i) => {
  const g = Math.round(255 * smooth(o)).toString(16).padStart(2, '0');
  return <stop key={i} offset={o} stopColor={`#${g}${g}${g}`} />;
});
/** the forearm's falloff past the case (wrist radii from the wrist centre, along the arm tilted toward the hand side) */
const FORE = {tilt: 20, s0: -1.4, s1: -0.1};
/** the backdrop vignette's soft edge (screen px) */
const VIG_W = 520;
/** the vignette's inner radius (screen px, about the band at bx, by) at which a fraction `a` of the frame is covered,
 *  so the dark closes in at a steady rate of frame area (a 9 x 16 grid, bisection: a pure function of its inputs) */
const vigRadius = (bx: number, by: number, a: number) => {
  const cover = (r: number) => {
    let sum = 0;
    for (let i = 0; i < 9; i++) for (let k = 0; k < 16; k++) sum += smooth(clamp((Math.hypot(60 + 120 * i - bx, 60 + 120 * k - by) - r) / VIG_W));
    return sum / 144;
  };
  let lo = -VIG_W;
  let hi = Math.max(...[[0, 0], [1080, 0], [0, 1920], [1080, 1920]].map(([x, y]) => Math.hypot(x - bx, y - by)));
  for (let n = 0; n < 22; n++) {
    const m = (lo + hi) / 2;
    if (cover(m) > a) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

/** V4 (Option A): while the band rolls to the underside the roll reads as a camera orbit round the forearm, so the
 *  hand never stays in its back view beside the turning case. The same backdrop is laid over everything beyond the
 *  wrist line and beside the forearm (the thumb lies along it), drawn after the hand and before the band. V4 polish:
 *  `t` sweeps it in as one straight soft edge (art/Device HAND_VEIL: 1.5R wide, across the forearm from beyond the
 *  fingertips back over the wrist, tilted toward the heel of the hand), so the hand recedes into the dark like light
 *  falling off: the fingers first, then the palm, the thumb with the wrist last, and what is left of it is always
 *  joined to the forearm (no circle or arc, no isolated patch of skin). The forearm itself stays, going into shadow past the
 *  case (FORE) instead of ending in a cut. The shots run it while the case starts to roll, at full backdrop. */
const HandVeil: React.FC<{id: string; A: ArmFrame; c: V; a: number; t: number}> = ({id, A, c, a, t}) => {
  const R = A.rW;
  const P = (u: number, v: number) => armPt(A, u, v);
  const p = (q: V) => `${f2(q.x)},${f2(q.y)}`;
  const uK0 = A.L - 5 * R; // the veil starts here (soft), well clear of the case's elbow end
  const uK1 = A.L - 4 * R;
  const far = 40 * R;
  const half = `M${p(P(uK0, far))} L${p(P(A.L + far, far))} L${p(P(A.L + far, -far))} L${p(P(uK0, -far))} Z`;
  const fore = (() => {
    const pts: V[] = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const u = (uK0 - R) + ((A.L + R - (uK0 - R)) * i) / n;
      pts.push(P(u, armR(A, Math.min(u, A.L)) + 0.4));
    }
    for (let i = n; i >= 0; i--) {
      const u = (uK0 - R) + ((A.L + R - (uK0 - R)) * i) / n;
      pts.push(P(u, -armR(A, Math.min(u, A.L)) - 0.4));
    }
    return `M${pts.map(p).join(' L')} Z`;
  })();
  const g0 = P(uK0, 0);
  const g1 = P(uK1, 0);
  // the forearm past the case goes into shadow: a smoothstep falloff about 1.3R long on an axis tilted toward the hand
  // side (darker where the hand was, so its isolines are neither level nor a cut), complete just past the wrist line
  const k = (FORE.tilt * Math.PI) / 180;
  const dF = {x: A.u.x * Math.cos(k) - A.n.x * Math.sin(k), y: A.u.y * Math.cos(k) - A.n.y * Math.sin(k)};
  const w0 = add(A.W, mul(dF, FORE.s0 * R));
  const w1 = add(A.W, mul(dF, FORE.s1 * R));
  // the sweep: a straight soft edge HAND_VEIL.w wide; nothing is covered short of it, all of the veil beyond it. The
  // thumb's contour over the forearm dissolves with it (Wrist3D, DeviceView.handVeil)
  const sweeping = clamp(t) < 1;
  const dS = handVeilDir(A);
  const e = handVeilEdge(t);
  const q0 = add(A.W, mul(dS, (e - HAND_VEIL.w) * R));
  const q1 = add(A.W, mul(dS, e * R));
  const big = {x: c.x - 6000, y: c.y - 6000};
  const rect = <rect x={f2(big.x)} y={f2(big.y)} width={12000} height={12000} fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />;
  return (
    <g opacity={a}>
      <defs>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={260}>
          <stop offset="0" stopColor="#2A4C63" />
          <stop offset="0.6" stopColor="#173041" />
          <stop offset="1" stopColor="#0C1A24" />
        </radialGradient>
        <linearGradient id={`${id}-k`} gradientUnits="userSpaceOnUse" x1={f2(g0.x)} y1={f2(g0.y)} x2={f2(g1.x)} y2={f2(g1.y)}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={f2(w0.x)} y1={f2(w0.y)} x2={f2(w1.x)} y2={f2(w1.y)}>
          {ssGrey}
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={f2(big.x)} y={f2(big.y)} width={12000} height={12000}>
          <path d={half} fill={`url(#${id}-k)`} />
          <path d={fore} fill={`url(#${id}-w)`} />
        </mask>
        {sweeping && (
          <linearGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" x1={f2(q0.x)} y1={f2(q0.y)} x2={f2(q1.x)} y2={f2(q1.y)}>
            {ssStops}
          </linearGradient>
        )}
        {sweeping && (
          <mask id={`${id}-s`} maskUnits="userSpaceOnUse" x={f2(big.x)} y={f2(big.y)} width={12000} height={12000}>
            <rect x={f2(big.x)} y={f2(big.y)} width={12000} height={12000} fill={`url(#${id}-sg)`} />
          </mask>
        )}
      </defs>
      {sweeping ? <g mask={`url(#${id}-s)`}>{rect}</g> : rect}
    </g>
  );
};

export type SceneProps = {
  id: string;
  /** frame (loop time in Aftermath3), for the leash's secondary sway */
  f: number;
  cam: Cam;
  man: ManPose;
  expr: Expr;
  blink?: number;
  lHand: HandPose;
  rHand: HandPose;
  dog: DogPose;
  hairSway?: number;
  dev: DeviceView;
  backdrop?: number;
  backdropC?: V;
  afterRightArm?: React.ReactNode;
  beforeLeftForearm?: React.ReactNode;
  /** explicit opt-out only (default true); no shot gates it */
  leash?: boolean;
  /** drawn in the world after him (drone, rings, light) */
  extra?: React.ReactNode;
  /** drawn in the world before him (ground light, shadows of things above) */
  under?: React.ReactNode;
  nearLegFront?: boolean;
  overAll?: React.ReactNode;
  /** V4: drawn over the tee, under the near thigh, the far forearm and hand and the near arm (the chest window) */
  overTorso?: React.ReactNode;
  /** hide the street foreground tufts */
  noTufts?: boolean;
  /** V4: 0..1, how far the hand beyond the wrist line has been swept into the section backdrop (Option A): it runs from
   *  past the fingertips back to the wrist line, after the backdrop is complete and before the band starts to roll */
  handVeil?: number;
};

export const Scene: React.FC<SceneProps> = ({id, f, cam, man, expr, blink = 0, lHand, rHand, dog, hairSway = 0, dev, backdrop = 0, backdropC, afterRightArm, beforeLeftForearm, leash = true, extra, under, nearLegFront, overAll, overTorso, noTufts, handVeil = 0}) => {
  const j = manJoints(man);
  const device: DeviceView = handVeil > 0.001 && backdrop > 0.01 && backdropC ? {...dev, handVeil, afterHand: (A: ArmFrame) => <HandVeil id={`${id}-hv`} A={A} c={backdropC} a={backdrop} t={handVeil} />} : dev;
  // the left forearm's own contact shadow on the grass when it rests there
  const fa = j.L;
  const onGround = clamp(1 - (GROUND + 30 - Math.max(fa.E.y, fa.W.y)) / 60);
  const mid = {x: (fa.E.x + fa.W.x) / 2, y: (fa.E.y + fa.W.y) / 2};
  const ang = (Math.atan2(fa.W.y - fa.E.y, fa.W.x - fa.E.x) * 180) / Math.PI;
  const flen = Math.hypot(fa.W.x - fa.E.x, fa.W.y - fa.E.y);
  // V4: the planted palm's own contact shadow follows the wrist's height above the plant (GROUND - 14), so the hand
  // reads as pressing the grass (V3 keyed it to GROUND + 30, which left it at alpha 0.08 while planted)
  const handOn = clamp(1 - (GROUND - 14 - fa.W.y) / 40);
  // V4 polish: the section backdrop closes in as a vignette from the frame's edges toward the band (and opens out from
  // the band as it leaves), in screen terms: a soft edge VIG_W px wide, its radius set so that the covered fraction of
  // the frame follows `backdrop` (eased in and out: the dark grows at a near-steady rate, without a step at either end)
  const bandC = add(fa.W, mul(fa.foreDir, -DEV_GEO.bandFromWrist * 17 * man.s));
  const bs = toScreen(cam, bandC);
  const vigA = 0.5 * (clamp(backdrop) + smooth(clamp(backdrop)));
  const vig = backdrop > 0.01 && backdrop < 0.999 ? {c: bandC, r: vigRadius(bs.x, bs.y, vigA) / cam.z, w: VIG_W / cam.z} : {c: bandC, r: -VIG_W / cam.z, w: VIG_W / cam.z};
  return (
    <Street id={`${id}-st`} cam={cam} fg={!noTufts && backdrop < 0.05 && cam.z < 3 ? <FrontTufts id={`${id}-fg`} xs={[[60, 2050, 1.6], [980, 2080, 1.8], [820, 2120, 1.4]]} /> : null}>
      <Contacts id={`${id}-ct`} j={j} ground={GROUND} />
      {onGround > 0.01 && <SoftShadow id={`${id}-fas`} c={{x: mid.x + 4, y: mid.y + 22 * man.s}} rx={flen * 0.62} ry={13 * man.s} rotate={ang} alpha={0.34 * onGround} />}
      {handOn > 0.01 && <SoftShadow id={`${id}-hds`} c={{x: fa.W.x + Math.cos((fa.handAng * Math.PI) / 180) * 50 * man.s, y: fa.W.y + 24 * man.s}} rx={52 * man.s} ry={12 * man.s} rotate={fa.handAng} alpha={0.3 * handOn} />}
      {under}
      <Dog id={`${id}-dog`} pose={dog} />
      {leash && <Leash id={`${id}-ls`} dog={dog} f={f} />}
      <Man
        id={`${id}-man`}
        pose={man}
        expr={expr}
        blink={blink}
        lHand={lHand}
        rHand={rHand}
        hairSway={hairSway}
        device={device}
        nearLegFront={nearLegFront}
        inkK={1 / Math.max(1, Math.sqrt(cam.z / 1.4))}
        afterRightArm={afterRightArm}
        overAll={overAll}
        overTorso={overTorso}
        beforeLeftForearm={
          <g>
            {beforeLeftForearm}
            {backdropC && <Backdrop id={`${id}-bd`} c={backdropC} a={backdrop} vig={vig} />}
          </g>
        }
      />
      {extra}
    </Street>
  );
};
