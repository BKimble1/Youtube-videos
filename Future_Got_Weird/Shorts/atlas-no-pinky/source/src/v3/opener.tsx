import React from 'react';
import {C, E, Plate, Headline, Burst, clamp01, kf, lerp, tw} from '../film/common';
import {Hand, HandPose, DigitPose, ikDigit, defOf, toLocal, toWorld, digitPts, GHOST_PINKY, Place} from '../hand/Hand';
import {sp, SNAP} from '../lib/motion';
import {frontPose} from '../film/beats1';
import {V3} from '../cues_v3';
import {BgMacro} from './stage';

/**
 * V3 opener: the existing FRONT-view four-digit rig (palm to the viewer, arm entering from below) pinches a bright gear
 * between thumb and index; middle and ring stand clear, so thumb + three fingers read at once. The gear is set on its post,
 * the pinch opens, the dashed fifth-finger slot appears beside the ring finger.
 * `t` is frames since the film start; t < 0 is the loop pre-roll shown under the closing tear (same function, same picture).
 */
const hd = (n: 'thumb' | 'index' | 'middle' | 'ring') => defOf('robot', 'front', n)!;

export const OP: {P: Place; drop: number} = {P: {x: 540, y: 905, scale: 1.9}, drop: 120};

const openPose = (spread: number): HandPose => frontPose([0, 0, 0, 0], spread, 1);

const blend = (a: DigitPose, b: DigitPose, k: number): DigitPose => ({
  ang: a.ang.map((v, i) => lerp(v, b.ang[i], k)) as [number, number, number],
  flex: [0, 1, 2].map((i) => lerp(a.flex?.[i] ?? 0, b.flex?.[i] ?? 0, k)) as [number, number, number],
});

export type PinchSpec = {gx: number; gy: number; r: number; phiI: number; phiT: number};
/** gear centre (hand-local), radius (world px) and the angles (deg, screen) at which index and thumb pads meet the gear rim */
export const PINCH: PinchSpec = {gx: -178, gy: -20, r: 62, phiI: -72, phiT: 152};

export const openerState = (t: number, spec: PinchSpec = PINCH) => {
  const P = OP.P;
  const L = (v: {x: number; y: number}) => toLocal(v.x, v.y, P.x, P.y, P.scale);
  const G = {x: P.x + spec.gx * P.scale, y: P.y + spec.gy * P.scale};
  const spin = 120 * E.inOut(clamp01((t + 22) / 36)); // gear turns in the pinch while it is held
  const drop = E.in(tw(t, 13, 7)); // gear falls onto its post after the pinch opens
  const bounce = clamp01((t - 20) / 4) * clamp01(1 - (t - 20) / 8) * 6;
  const release = E.inOut(tw(t, 11, 7)); // pads leave the gear
  const open = E.inOut(tw(t, 17, 18)); // pinch -> open hand
  const rim = (phi: number, pad: number, extra: number) => ({x: G.x + (spec.r + pad + extra) * Math.cos((phi * Math.PI) / 180), y: G.y + (spec.r + pad + extra) * Math.sin((phi * Math.PI) / 180)});
  const padT = 25 * P.scale * 0.92, padI = 23 * P.scale * 0.92;
  const ci = rim(spec.phiI, padI, 26 * release);
  const ct = rim(spec.phiT, padT, 26 * release);
  const toward = (c: {x: number; y: number}) => (Math.atan2(G.y - c.y, G.x - c.x) * 180) / Math.PI;
  const index = ikDigit(hd('index'), L(ci), toward(ci), -1);
  const thumb = ikDigit(hd('thumb'), L(ct), toward(ct), 1);
  const hold: HandPose = {
    index,
    thumb,
    middle: {ang: [-92, -91, -90]},
    ring: {ang: [-84, -85, -86]},
  };
  // once open, a slow splay keeps the hand alive (and the fifth-finger slot in view) until the tape wipe
  const OPEN = openPose(0.55 + 0.22 * Math.sin(Math.max(0, t - 30) / 13));
  const pose: HandPose = {
    thumb: blend(hold.thumb!, OPEN.thumb!, open),
    index: blend(hold.index!, OPEN.index!, open),
    middle: blend(hold.middle!, OPEN.middle!, open),
    ring: blend(hold.ring!, OPEN.ring!, open),
  };
  // loop pre-roll: the whole hand drifts the last few pixels into place before frame 0
  const drift = t < 0 ? E.out(clamp01((t + 22) / 22)) : 1;
  const Pm: Place = {x: P.x + 22 * (1 - drift), y: P.y + 16 * (1 - drift), scale: P.scale};
  return {P: Pm, pose, G, gy: G.y + OP.drop * drop - bounce, spin, open, release, drop, r: spec.r};
};

export const Gear: React.FC<{x: number; y: number; r: number; rot: number}> = ({x, y, r, rot}) => {
  const teeth = 10;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({length: teeth}).map((_, i) => (
        <rect key={i} x={-r * 0.16} y={-r * 1.12} width={r * 0.32} height={r * 0.3} rx={r * 0.05} fill={i === 0 ? C.coral : C.saffron} stroke={C.ink} strokeWidth={5} transform={`rotate(${(i * 360) / teeth})`} />
      ))}
      <circle r={r} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
      <circle r={r * 0.78} fill="none" stroke={C.saffronDeep} strokeWidth={4} />
      <circle r={r * 0.3} fill={C.ink} />
      <path d={`M ${-r * 0.62} ${-r * 0.18} A ${r * 0.66} ${r * 0.66} 0 0 1 ${-r * 0.18} ${-r * 0.62}`} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.8} />
    </g>
  );
};

export const OpenerWorld: React.FC<{t: number; spec?: PinchSpec}> = ({t, spec}) => {
  const s = openerState(t, spec);
  const ghost = tw(t, V3['open.reveal'], 12);
  const pop = sp(t, V3['gap.pop'], SNAP);
  const postY = s.G.y + OP.drop + s.r;
  const gp = digitPts(GHOST_PINKY, {ang: [-60, -56, -54]});
  const gc = toWorld({x: (gp[1].x + gp[3].x) / 2, y: (gp[1].y + gp[3].y) / 2}, s.P.x, s.P.y, s.P.scale);
  return (
    <g>
      <BgMacro cx={540} cy={860} />
      {/* post the gear is set on */}
      <g>
        <ellipse cx={s.G.x} cy={postY + 70} rx={150} ry={24} fill={C.shadow} />
        <rect x={s.G.x - 26} y={postY - 6} width={52} height={64} rx={8} fill={C.inkSoft} stroke={C.ink} strokeWidth={6} />
        <rect x={s.G.x - 100} y={postY + 50} width={200} height={38} rx={14} fill={C.blueDeep} stroke={C.ink} strokeWidth={6} />
      </g>
      <Gear x={s.G.x} y={s.gy} r={s.r} rot={s.spin} />
      <Hand x={s.P.x} y={s.P.y} scale={s.P.scale} pose={s.pose} ghostPinky={ghost * 0.95} forearm={{stand: 2300}} />
      {pop > 0.01 && (
        <g transform={`translate(${gc.x} ${gc.y}) scale(${pop})`}>
          <circle r={104} fill="none" stroke={C.coral} strokeWidth={10} strokeDasharray="22 16" strokeLinecap="round" />
        </g>
      )}
      <Burst x={s.G.x} y={postY - 40} t={(t - 19) / 9} r0={80} r1={150} n={8} color={C.ink} w={6} />
    </g>
  );
};

export const OpenerHud: React.FC<{t: number}> = ({t}) => {
  const swap = V3['label.purpose'];
  const a = 1; // present at full size from frame 0 (and throughout the loop pre-roll), never popping in
  const out = tw(t, swap - 4, 4, E.in);
  const inn = sp(t, swap, SNAP);
  return (
    <g>
      {t < swap && <Headline x={540} y={312} text="NO PINKY?" size={132} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}
      {t >= swap && <Plate x={540} y={312} text="ON PURPOSE." size={94} fill={C.coral} sy={Math.max(0.001, inn)} />}
    </g>
  );
};
void kf;
