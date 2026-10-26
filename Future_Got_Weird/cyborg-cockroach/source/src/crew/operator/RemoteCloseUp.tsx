// The remote close-up: the operator's gloved LEFT hand holding the research remote, his thumb on the red fire button,
// for the press / release (match-on-action) beat. Seen from his side, looking down at the face of the remote: the palm
// is under it (palm toward the camera), the fingers wrap round its back and their tips curl up over the far (top) edge,
// the thumb comes over the near edge and lies on the face with its pad on the button. The hand and the coat sleeve are
// the rig's own parts (dc/Hand, the long-sleeve forearm as dc/Man draws it), at close-up scale; the thumb is drawn a
// second time over the remote through a mask of its own silhouette, so it is the only digit in front of the remote.
// The thumb's angle and bend are solved so its tip lands on the cap (and follows it down and up); the cap is pushed by
// the thumb and springs back up as the thumb lifts away.
import React from 'react';
import {Deco, Inked, InkLine} from '../../lib/ink';
import {capsulePath, Capsule, SoftShadow} from '../../lib/shade';
import {add, clamp, fmt, lerp, mul, P, perp, rad, rot, V} from '../../lib/math';
import {Hand, HandPose} from './dc/Hand';
import {Limb} from './dc/limb';
import {COAT, GLOVE, H_REMOTE_CU} from './cast';
import {capTopAt, LedArg, Remote, REMOTE, remoteFacePath, remotePt, RemoteView} from './Remote';

// layout at scale 1, in px relative to the anchor (the remote's face centre)
/** px per mm of the remote at scale 1 (the remote is 560 px long) */
export const CU_K = 8;
/** the hand's length (wrist to middle fingertip) in remote millimetres: the remote is 0.85 of the hand */
const HAND_MM = 82;
const TILT = 35;
const REMOTE_ROT = -8;
/** the hand: wrist point and axis angle in the local frame (palm toward the camera, fingers up-right) */
const WRIST0: V = {x: 150, y: 295};
const HAND_ANG = -84;
/** the forearm's direction from the wrist (toward the elbow, out of frame lower right) */
const FORE_ANG = 110;
/** contour weights as the rig draws a figure (Man: OUT = 7 s, IN = 0.72 OUT, hands 0.9 IN; Lab inkK 0.9) */
const INK_K = 0.9;

const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** the thumb chain exactly as dc/Hand builds it (base, two joints, tip) */
export const thumbChain = (wrist: V, ang: number, L: number, ts: 1 | -1, pose: HandPose) => {
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const n = perp(dir);
  const W = (u: number, vv: number): V => add(wrist, add(mul(dir, u * L), mul(n, vv * L * ts)));
  const tBase = W(0.1, 0.19);
  const tDir = rot(dir, pose.thumb * ts);
  const t1 = add(tBase, mul(tDir, 0.2 * L));
  const tDir2 = rot(tDir, -pose.thumbCurl * 38 * ts);
  const t2 = add(t1, mul(tDir2, 0.15 * L * (1 - pose.thumbCurl * 0.35)));
  const tDir3 = rot(tDir2, -pose.thumbCurl * 30 * ts);
  const t3 = add(t2, mul(tDir3, 0.12 * L * (1 - pose.thumbCurl * 0.45)));
  return {tBase, t1, t2, t3, tipDir: tDir3, radii: [0.1 * L, 0.078 * L, 0.076 * L, 0.07 * L, 0.07 * L, 0.064 * L]};
};

/** the thumb angle and bend that put its tip (the end of the chain's centre line) on `target`: the chain is rigid for
 *  a given bend and turns about its base with the angle, so the bend is found from the distance (bisection) and the
 *  angle from the direction. Pure and deterministic. */
export const aimThumb = (wrist: V, ang: number, L: number, ts: 1 | -1, base: HandPose, target: V): HandPose => {
  const at = (c: number, th: number) => thumbChain(wrist, ang, L, ts, {...base, thumb: th, thumbCurl: c});
  const tb = at(0, 0).tBase;
  const want = Math.hypot(target.x - tb.x, target.y - tb.y);
  const reach = (c: number) => {
    const q = at(c, 0);
    return Math.hypot(q.t3.x - tb.x, q.t3.y - tb.y);
  };
  let lo = 0.05;
  let hi = 1;
  let c = 0.05;
  if (want >= reach(lo)) c = lo;
  else if (want <= reach(hi)) c = hi;
  else {
    for (let i = 0; i < 30; i++) {
      const m = (lo + hi) / 2;
      if (reach(m) > want) lo = m;
      else hi = m;
    }
    c = (lo + hi) / 2;
  }
  const q = at(c, 0);
  const a0 = Math.atan2(q.t3.y - tb.y, q.t3.x - tb.x);
  const a1 = Math.atan2(target.y - tb.y, target.x - tb.x);
  let d = ((a1 - a0) * 180) / Math.PI;
  d = ((((d + 180) % 360) + 360) % 360) - 180;
  // rot() turns by +deg clockwise on screen; the pose angle is multiplied by ts
  return {...base, thumbCurl: c, thumb: d * ts};
};

export type RemoteCloseUpProps = {
  /** unique id prefix for the SVG defs */
  id?: string;
  /** 0 = thumb resting lightly on the raised button, 1 = fully pressed (cap down in its guard) */
  press?: number;
  /** 0 = thumb on the button, 1 = thumb lifted up and away from it (the cap springs back up as it leaves) */
  lift?: number;
  /** status LED: 'armed' (green), 'fired' (amber), or 0..1 between them */
  led?: LedArg;
  /** screen position of the remote's face centre (px) */
  x?: number;
  y?: number;
  /** 1 = remote 560 px long, hand ~656 px (wrist to fingertip) */
  scale?: number;
  /** in-plane rotation of the whole close-up (deg, + = clockwise); the key light stays fixed */
  rotation?: number;
};

/** where things are on screen for given props (for effects keyed to the button or the thumb) */
export const remoteCloseUpGeometry = (p: RemoteCloseUpProps) => {
  const x = p.x ?? 540;
  const y = p.y ?? 860;
  const sc = p.scale ?? 1;
  const ro = p.rotation ?? 0;
  const press = clamp(p.press ?? 0);
  const lift = clamp(p.lift ?? 0);
  const place = (q: V): V => add({x, y}, rot(mul(q, sc), ro));
  const k = CU_K * sc;
  const view: RemoteView = {c: {x, y}, k, rot: REMOTE_ROT + ro, tilt: TILT};
  const L = HAND_MM * k;
  const s = L / 96;
  const wrist = place(WRIST0);
  const ang = HAND_ANG + ro;
  // the thumb pad's height above the face: on the cap (pushed down by the press), rising as it lifts away
  const B = REMOTE.btn;
  const rest = capTopAt(0);
  const zPressed = capTopAt(press);
  const up = ss(0, 1, lift);
  const TRAVEL_UP = 22; // mm the pad rises toward the camera at lift 1
  const zThumb = zPressed + TRAVEL_UP * up;
  // the cap follows the thumb up and stops at its rest height, with a small spring overshoot as it is let go
  const leave = (rest - zPressed) / TRAVEL_UP;
  const bounce = press > 0.05 && lift > leave ? 0.6 * press * Math.exp(-(lift - leave) * 12) * Math.sin((lift - leave) * 28) : 0;
  const capTop = Math.min(rest, zThumb) + (zThumb >= rest ? bounce : 0);
  const capPress = clamp((rest - capTop) / (rest - B.pressed), -0.25, 1);
  // pad contact: a little toward the thumb's root from the cap centre; lifting, the thumb draws back toward its root
  // (down-left on the face) as it rises, so it bends and shortens and the cap is left clear
  const padM = {x: B.x - 3.0 - 13 * up, y: B.y + 2.4 + 7 * up};
  const target = remotePt(view, padM.x, padM.y, zThumb);
  const fingers: HandPose = {...H_REMOTE_CU, curl: H_REMOTE_CU.curl.map((c) => c + 0.05 * press * (1 - up)) as HandPose['curl']};
  const pose = aimThumb(wrist, ang, L, -1, fingers, target);
  const chain = thumbChain(wrist, ang, L, -1, pose);
  // what lies under the pad (the cap, the guard ring or the face) and the gap to it; the pad's shadow falls on it,
  // down and to the right of the pad (key light upper left), drifting further out and softening as the gap grows
  const rB = Math.hypot(padM.x - B.x, padM.y - B.y);
  const under = rB < B.cap ? capTop : rB < B.ring ? B.ringH : 0;
  const h = Math.max(0, zThumb - under);
  const shadowAt = remotePt(view, padM.x + 1.2 + 0.3 * h, padM.y + 1.5 + 0.22 * h, under);
  return {view, L, s, wrist, ang, pose, chain, target, capPress, capTop, zThumb, h, shadowAt, button: remotePt(view, B.x, B.y, capTop), k, sc};
};

export const RemoteCloseUp: React.FC<RemoteCloseUpProps> = (props) => {
  const id = props.id ?? 'rcu';
  const g = remoteCloseUpGeometry(props);
  const {s, L, wrist, ang, pose, chain} = g;
  const OUT = 7 * s * INK_K;
  const IN = OUT * 0.72;
  const iw = IN * 0.9;
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  // the forearm comes toward the camera from the lower left (wider toward the elbow); the glove's cuff covers the
  // wrist and runs a little way up the coat sleeve, so the palm's heel and the thumb's root read as glove, not sleeve
  const fdir = {x: Math.cos(rad(FORE_ANG + (props.rotation ?? 0))), y: Math.sin(rad(FORE_ANG + (props.rotation ?? 0)))};
  const wristBase = add(wrist, mul(dir, -0.02 * L));
  const cuffEnd = add(wristBase, mul(fdir, 0.3 * L));
  const elbow = add(wristBase, mul(fdir, 2.2 * L));
  const nf = perp(fdir);
  const cuffR = 0.215 * L;
  const arm = (k: string) => (
    <Inked w={OUT}>
      <Inked w={IN}>
        {/* coat sleeve (its end is inside the glove cuff) */}
        <Capsule id={`${id}-${k}fa`} a={elbow} b={add(cuffEnd, mul(fdir, -0.1 * L))} ra={0.36 * L} rb={0.19 * L} color={COAT} spec={0.22} />
        {/* glove cuff over the sleeve: a flat, slightly rolled end; it runs on under the palm's heel (where the rig fades
            the palm in), so only glove shows there */}
        <Limb id={`${id}-${k}gc`} A={cuffEnd} B={wristBase} C={add(wristBase, mul(dir, 0.07 * L))} rA={cuffR} rB={0.195 * L} rC={0.19 * L} capA="flat" color={GLOVE} spec={0.1} />
        <Hand id={`${id}-${k}h`} wrist={wrist} ang={ang} L={L} thumbSide={-1} view="palm" pose={pose} color={GLOVE} ink={iw} bare sheen={0.2} />
      </Inked>
      <Deco>
        {/* the cuff's rolled edge */}
        <path d={`M${P(add(add(cuffEnd, mul(fdir, -0.035 * L)), mul(nf, cuffR * 0.85)))} Q${P(add(cuffEnd, mul(fdir, 0.06 * L)))} ${P(add(add(cuffEnd, mul(fdir, -0.035 * L)), mul(nf, -cuffR * 0.85)))}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={fmt(0.014 * L)} strokeLinecap="round" />
        <InkLine d={`M${P(add(add(cuffEnd, mul(fdir, -0.05 * L)), mul(nf, cuffR * 0.97)))} Q${P(add(cuffEnd, mul(fdir, 0.035 * L)))} ${P(add(add(cuffEnd, mul(fdir, -0.05 * L)), mul(nf, -cuffR * 0.97)))}`} w={iw * 0.55} opacity={0.7} />
      </Deco>
    </Inked>
  );
  // the thumb's own silhouette (with its own contour) as a mask: the arm drawn again through it lies over the remote
  const thumbCaps: [V, V, number, number][] = [
    [chain.tBase, chain.t1, chain.radii[0], chain.radii[1]],
    [chain.t1, chain.t2, chain.radii[2], chain.radii[3]],
    [chain.t2, chain.t3, chain.radii[4], chain.radii[5]],
  ];
  const edge = iw * 0.36 * 2 + 1;
  const sh = clamp(g.h / 24);
  const shR = chain.radii[5] * (1.25 + 0.9 * sh);
  return (
    <g>
      {arm('a')}
      <Remote id={`${id}-rm`} view={g.view} press={g.capPress} led={props.led} ink={iw} />
      <defs>
        <clipPath id={`${id}-bc`}>
          <path d={remoteFacePath(g.view)} />
        </clipPath>
        <mask id={`${id}-tm`}>
          {thumbCaps.map(([a, b, ra, rb], i) => (
            <path key={i} d={capsulePath(a, b, ra, rb)} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={fmt(edge)} strokeLinejoin="round" />
          ))}
        </mask>
      </defs>
      {/* the thumb's soft shadow on the face and the cap: tight while it presses, wider and fainter as it lifts */}
      <g clipPath={`url(#${id}-bc)`}>
        <SoftShadow id={`${id}-ts`} c={g.shadowAt} rx={shR * 1.25} ry={shR * 0.9} alpha={lerp(0.42, 0.2, sh)} color="#1B2A3A" rotate={ang + 90} core={0.3} />
      </g>
      <g mask={`url(#${id}-tm)`}>{arm('b')}</g>
    </g>
  );
};
