// One street-world scene with the same rig, dog, leash, band and camera; every shot that shows him uses it.
// Optional layers: the diagram backdrop that isolates the forearm (section views), the x-ray of the chest and
// upper arm, and extras drawn in the world after him (the drone, light, rings).
// V4: the leash is drawn here and only here, from the dog's collar to its released handle on the grass, between the
// dog and the man; it is never tied to his hands and has no visibility gates (the section backdrop covers it).
import React from 'react';
import {ArmFrame, armPt, armR, DeviceView} from '../art/Device';
import {collarRing, Dog, DogPose} from '../art/Dog';
import {Expr} from '../art/Head';
import {HandPose} from '../art/Hand';
import {Leash} from '../art/Leash';
import {Man, manJoints, ManPose} from '../art/Man';
import {FrontTufts, Street} from '../art/Street';
import {Cam} from '../lib/camera';
import {clamp, V} from '../lib/math';
import {SoftShadow} from '../lib/shade';
import {Contacts, GROUND} from './StreetShots';

const f2 = (n: number) => n.toFixed(2);

export const Backdrop: React.FC<{id: string; c: V; a: number}> = ({id, c, a}) =>
  a > 0.01 ? (
    <g opacity={a}>
      <defs>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={260}>
          <stop offset="0" stopColor="#2A4C63" />
          <stop offset="0.6" stopColor="#173041" />
          <stop offset="1" stopColor="#0C1A24" />
        </radialGradient>
      </defs>
      <rect x={c.x - 6000} y={c.y - 6000} width={12000} height={12000} fill={`url(#${id}-g)`} />
    </g>
  ) : null;

/** V4 (Option A): while the band rolls to the underside the roll reads as a camera orbit round the forearm, so the
 *  hand never stays in its back view beside the turning case. The same backdrop is laid over everything beyond the
 *  wrist line and beside the forearm (the thumb lies along it), drawn after the hand and before the band; the
 *  forearm itself stays, fading out just past the case. It is not faded in as a whole: `t` sweeps it in from past the
 *  fingertips back to the wrist line (a soft-edged disc round the wrist that shrinks to nothing), so every frame shows
 *  a crisp partial hand dissolving into the backdrop, never a half-transparent ghost. The shots run it once the
 *  backdrop is complete and before the case starts to turn. */
const HandVeil: React.FC<{id: string; A: ArmFrame; c: V; a: number; t: number}> = ({id, A, c, a, t}) => {
  const R = A.rW;
  const P = (u: number, v: number) => armPt(A, u, v);
  const p = (q: V) => `${f2(q.x)},${f2(q.y)}`;
  const uK0 = A.L - 5 * R; // the veil starts here (soft), well clear of the case's elbow end
  const uK1 = A.L - 4 * R;
  const uW0 = A.L - 0.7 * R; // the forearm is whole up to here (the case ends at L - 0.75R)
  const uW1 = A.L - 0.15 * R; // and gone past the wrist line
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
  const w0 = P(uW0, 0);
  const w1 = P(uW1, 0);
  // the sweep: the clear disc (radius rIn, a hard edge so each frame shows a crisp partial hand) shrinks from past the
  // fingertips to nothing, quickest at the end. It is centred under the case, so from about three quarters of the way
  // what is left of it (under 0.8R) lies behind the case: no isolated round patch of skin survives a whole frame. The
  // thumb's contour over the forearm dissolves with it (Wrist3D, DeviceView.handVeil)
  const soft = 0.12 * R;
  const ctr = P(A.L - 1.5 * R, 0);
  const rIn = (9 * R + soft) * Math.pow(1 - clamp(t), 2.2) - soft;
  const rOut = rIn + soft;
  const sweeping = clamp(t) < 1 && rOut > 0.5;
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
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={f2(big.x)} y={f2(big.y)} width={12000} height={12000}>
          <path d={half} fill={`url(#${id}-k)`} />
          <path d={fore} fill={`url(#${id}-w)`} />
        </mask>
        {sweeping && (
          <radialGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" cx={f2(ctr.x)} cy={f2(ctr.y)} r={f2(rOut)}>
            {rIn >= 0 ? <stop offset="0" stopColor="#000" /> : <stop offset="0" stopColor="#FFF" stopOpacity={clamp(-rIn / soft)} />}
            {rIn >= 0 && <stop offset={(rIn / rOut).toFixed(4)} stopColor="#000" />}
            <stop offset="1" stopColor="#FFF" />
          </radialGradient>
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
            {backdropC && <Backdrop id={`${id}-bd`} c={backdropC} a={backdrop} />}
          </g>
        }
      />
      {extra}
    </Street>
  );
};
