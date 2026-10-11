import React from 'react';
import {C, E, tw, kf, lerp, clamp01, Burst, OUTLINE} from '../film/common';
import {Hed} from './type';
import {HED_FONT} from './fonts4';
import {Hand, HandPose, ikDigit, defOf, toLocal, toWorld, tipWorld, rad, V, Place} from '../hand/Hand';
import {sp, SNAP, drift} from '../lib/motion';
import {V4, fm} from './cues';
import {BgPaper, BgDesk, BgPeg} from './stage';
import {frontPose} from '../film/beats1';
import {Washer, Die, TOOL} from '../film/props';
import {mix} from '../hand/Hand';
import {solveTip, squareCorners, OUTLINE_PX} from './contacts';

/**
 * V4 pistol-grip tool: identical to the shared `Tool` except that the trigger lever swings BACK (toward the handle) when pressed, in the same direction the
 * fingertip travels. The shared V1-V3 `Tool` swings the lever forward, so the pressed lever left the fingertip (found by the V4 trigger audit).
 */
const Tool4: React.FC<{press: number}> = ({press}) => (
  <g>
    <rect x={-86} y={-156} width={236} height={90} rx={24} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={150} y={-142} width={52} height={62} rx={10} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={202} y={-120} width={44} height={18} rx={6} fill={C.inkMuted} stroke={C.ink} strokeWidth={4} />
    <rect x={-70} y={-146} width={90} height={14} rx={7} fill="#FFFFFF" opacity={0.35} />
    <circle cx={110} cy={-142} r={9} fill={press > 0.5 ? C.saffron : mix(C.coral, C.ink, 0.35)} stroke={C.ink} strokeWidth={3} />
    <rect x={TOOL.handleX0} y={TOOL.handleY0} width={TOOL.handleX1 - TOOL.handleX0} height={TOOL.handleY1 - TOOL.handleY0} rx={18} fill={C.inkSoft} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={TOOL.handleX0 + 8} y={TOOL.handleY0 + 14} width={9} height={TOOL.handleY1 - TOOL.handleY0 - 40} rx={4} fill="#FFFFFF" opacity={0.18} />
    <g transform={`rotate(${14 * press} ${TOOL.trigX - 4} ${TOOL.trigY - 20})`}>
      <path d={`M ${TOOL.trigX - 6} ${TOOL.trigY - 20} L ${TOOL.trigX + 20} ${TOOL.trigY - 8} L ${TOOL.trigX + 18} ${TOOL.trigY + 34} L ${TOOL.trigX - 6} ${TOOL.trigY + 30} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  </g>
);

/* ------------------------------------------------------------------ B04: mechanism (light cool-paper stage)
 * whole hand (four digits) -> a loupe opens on the thumb base joint while the 13 total lands -> the loupe closes and the fingers move one by one */

/** palm centre + scale: tips-to-cuff sit between the headline lane (<= 470) and the caption lane (>= 1280) */
export const RH4 = {x: 590, y: 952, s: 1.78};
const PL4: Place = {x: RH4.x, y: RH4.y, scale: RH4.s};
const THUMB_BASE = {x: -96, y: 46}; // hand-local thumb base joint (robot front view)

/** loupe: a lens centred on screen LP showing the same hand at LS x, framed on the thumb base joint */
export const LOUPE = {x: 700, y: 985, r: 240, scale: 4.3};
const loupeK = (g: number) => E.out(tw(g, V4['b04.push'], 8)) * (1 - E.in(tw(g, V4['b04.pull'], 7)));

export const pose4 = (g: number): HandPose => {
  const t0 = V4['b04.thumb'], t1 = V4['b04.thumb2'], op = V4['b04.open'];
  const sweep = (t: number) => kf(g, [[t, 1, E.inOut], [t + 12, 0.12, E.inOut], [t + 24, 1, E.inOut]]);
  const cTk = (t: number) => kf(g, [[t, 0, E.inOut], [t + 12, 0.6, E.inOut], [t + 24, 0, E.inOut]]);
  const sw = Math.min(sweep(t0), sweep(t1));
  const cT = Math.max(cTk(t0), cTk(t1));
  const spread = kf(g, [[op, 0.2, E.inOut], [op + 10, 1.05, E.inOut], [op + 22, 0.2, E.inOut]]);
  const curl = (a: number) => kf(g, [[a, 0, E.inOut], [a + 10, 0.95, E.inOut], [a + 22, 0, E.inOut]]);
  return frontPose([cT, curl(V4['b04.curl1']), curl(V4['b04.curl2']), curl(V4['b04.curl3'])], spread, sw);
};

const trail = (g: number, name: 'thumb' | 'index' | 'middle' | 'ring', from: number, to: number, color: string) => {
  const g0 = Math.max(from, g - 16);
  const pts: V[] = [];
  for (let k = g0; k <= Math.min(g, to); k += 1) pts.push(tipWorld('robot', 'front', name, pose4(k), PL4));
  if (pts.length < 2) return null;
  return <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 17" opacity={0.95} />;
};

export const B04World: React.FC<{g: number}> = ({g}) => {
  const pose = pose4(g);
  const rise = sp(g, fm(304), SNAP);
  const hl: Record<string, number> = {};
  (['thumb', 'index', 'middle', 'ring'] as const).forEach((n, i) => {
    const t = V4[`b04.badge${i + 1}` as 'b04.badge1'];
    hl[n] = kf(g, [[t, 0, E.out], [t + 4, 1, E.out], [t + 14, 0.2, E.inOut], [V4['b04.push'], 0, E.in]]);
  });
  const lk = loupeK(g);
  const t0 = V4['b04.thumb'], t1 = V4['b04.thumb2'];
  const badges = (['thumb', 'index', 'middle', 'ring'] as const).map((n, i) => {
    const t = V4[`b04.badge${i + 1}` as 'b04.badge1'];
    const p = tipWorld('robot', 'front', n, pose, PL4);
    return {n, i, t, x: p.x, y: p.y - 78};
  });
  const tb = toWorld(THUMB_BASE, RH4.x, RH4.y, RH4.s);
  // loupe hand placement: thumb base joint appears just left of the lens centre
  const LP: Place = {x: LOUPE.x - 60 + 96 * LOUPE.scale, y: LOUPE.y - 46 * LOUPE.scale, scale: LOUPE.scale};
  const arcR = 128;
  return (
    <g>
      <BgPaper cx={RH4.x} cy={RH4.y - 40} />
      <g transform={`translate(0 ${(1 - rise) * 600})`}>
        <Hand x={RH4.x} y={RH4.y} scale={RH4.s} pose={pose} forearm={{stand: 1262}} highlight={hl} />
      </g>
      {trail(g, 'thumb', t0, t0 + 26, C.blueDeep)}
      {trail(g, 'thumb', t1, t1 + 26, C.blueDeep)}
      {trail(g, 'index', V4['b04.curl1'], V4['b04.curl1'] + 24, C.blueDeep)}
      {trail(g, 'middle', V4['b04.curl2'], V4['b04.curl2'] + 24, C.coralDeep)}
      {trail(g, 'ring', V4['b04.curl3'], V4['b04.curl3'] + 24, C.tealDeep)}
      {badges.map((b) => {
        const k = sp(g, b.t, SNAP);
        const out = tw(g, V4['b04.push'] - 4, 6, E.in);
        if (k < 0.02 || out >= 1) return null;
        return (
          <g key={b.n} transform={`translate(${b.x} ${b.y}) scale(${k * (1 - out)})`}>
            <circle r={42} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={64} fill={C.ink}>{b.i + 1}</text>
          </g>
        );
      })}
      {lk > 0.01 && (
        <g>
          {/* tether from the joint on the hand to the lens */}
          <line x1={tb.x} y1={tb.y} x2={LOUPE.x - 40} y2={LOUPE.y} stroke={C.blueDeep} strokeWidth={6} strokeDasharray="3 14" strokeLinecap="round" opacity={lk} />
          <circle cx={tb.x} cy={tb.y} r={56 * lk} fill="none" stroke={C.coralDeep} strokeWidth={7} strokeDasharray="14 10" />
          <g transform={`translate(${LOUPE.x} ${LOUPE.y}) scale(${lk}) translate(${-LOUPE.x} ${-LOUPE.y})`}>
            <circle cx={LOUPE.x + 14} cy={LOUPE.y + 20} r={LOUPE.r + 6} fill={C.shadow} />
            <clipPath id="loupeClip"><circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r} /></clipPath>
            <circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r} fill="#F6FAFC" />
            <g clipPath="url(#loupeClip)">
              <Hand x={LP.x} y={LP.y} scale={LP.scale} pose={pose} />
              {/* the joint being shown: ring + the arc it sweeps */}
              <g transform={`translate(${LOUPE.x - 60} ${LOUPE.y})`} fill="none" strokeLinecap="round">
                <circle r={46} stroke={C.coralDeep} strokeWidth={9} strokeDasharray="16 12" />
                <path d={`M ${-arcR * Math.cos(0.5)} ${-arcR * Math.sin(0.5)} A ${arcR} ${arcR} 0 0 1 ${-arcR * Math.cos(-0.35)} ${-arcR * Math.sin(-0.35)}`} stroke={C.blueDeep} strokeWidth={11} opacity={0.9} />
              </g>
            </g>
            <circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r} fill="none" stroke={C.ink} strokeWidth={10} />
            <circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r - 12} fill="none" stroke={C.cream} strokeWidth={4} opacity={0.8} />
          </g>
        </g>
      )}
    </g>
  );
};

export const B04Hud: React.FC<{g: number}> = ({g}) => {
  const tD = V4['b04.badge1'] - 2;
  const t13 = V4['b04.count'];
  const a = sp(g, tD, SNAP);
  const out = tw(g, t13 - 3, 4, E.in);
  const b = sp(g, t13, SNAP);
  const num = 13; // lands whole on the word: the number is the claim, a count-up would only delay it
  // lead-in so the headline lane is never empty while the hand arrives: NEW HAND (on "Atlas's new hand") -> 4 DIGITS (on "four digits")
  const tL = V4['iris.b04'] + 6;
  const aL = sp(g, tL, SNAP), outL = tw(g, tD - 4, 4, E.in);
  return (
    <g>
      {g >= tL && g < tD && <Hed x={120} anchor="start" y={318} text="NEW HAND" size={170} sx={aL * (1 - outL) + 0.001} sy={aL * (1 - outL) + 0.001} />}
      {g >= tD && g < t13 + 2 && <Hed x={120} anchor="start" y={318} text="4 DIGITS" size={170} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}
      {g >= t13 && (
        <g>
          <Hed x={112} anchor="start" y={334} text={String(num)} size={300} shadow={C.coral} sx={b} sy={b} ls={0} />
          <Hed x={354} anchor="start" y={290} text="WAYS" size={120} shadow={C.coral} sx={b} sy={b} />
          <Hed x={354} anchor="start" y={392} text="TO MOVE" size={120} shadow={C.coral} sx={b} sy={b} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ B05: pinch (overhead) / turn (diagonal) / press (workstation) */

const sd = (n: 'thumb' | 'index' | 'middle' | 'ring') => defOf('robot', 'side', n)!;
const S5 = 2.0;

/** Each capability headline belongs to its own shot: it is drawn inside the shot's group, so it enters and leaves with that shot. */
const ShotTitle: React.FC<{g: number; from: number; text: string}> = ({g, from, text}) => {
  const k = sp(g, from, SNAP);
  return <Hed x={120} anchor="start" y={318} text={text} size={170} sx={k + 0.001} sy={k + 0.001} />;
};

/** pad-to-object offsets: the digit centre-line stops this far from the object edge so the visible pad (w/2 + outline) just touches it */
export const padOf = (name: 'thumb' | 'index', scale: number) => ((name === 'thumb' ? 24 : 22) * scale) * 0.94;

/** Two-finger pinch for the side-view rig: thumb + index tips on the given targets; middle/ring tuck behind the index. */
export const pinch2 = (pl: Place, thumbT: V, indexT: V, tuck = 14): HandPose => {
  const L = (v: V) => toLocal(v.x, v.y, pl.x, pl.y, pl.scale, pl.rot ?? 0, pl.flip ?? false);
  const idx = ikDigit(sd('index'), L(indexT), 0, -1);
  const th = ikDigit(sd('thumb'), L(thumbT), 0, 1);
  const tk = (extra: number): [number, number, number] => [idx.ang[0] + 4, idx.ang[1] + 6, idx.ang[2] + tuck + extra];
  return {index: idx, thumb: th, middle: {ang: tk(0)}, ring: {ang: tk(6)}};
};

/** (a) overhead pinch of a flat washer on the lab mat, hand reaching down from the top */
export const WA = {x: 700, y: 960, r: 70};
export const shotA = (g: number) => {
  const contact = V4['b05.pinch'];
  const approach = E.out(tw(g, fm(489), 26));
  const gap = kf(g, [[fm(489), 100, E.linear], [contact - 8, 80, E.inOut], [contact, 0, E.in]]);
  const lift = E.inOut(tw(g, contact + 2, 9));
  const sc = 1 + 0.2 * lift;
  const P: Place = {x: WA.x + 12, y: lerp(WA.y - 290 - 380, WA.y - 290, approach) - 20 * lift, scale: S5, rot: 90};
  const target = {
    thumb: {x: WA.x - (WA.r * sc + padOf('thumb', S5) + gap), y: WA.y},
    index: {x: WA.x + (WA.r * sc + padOf('index', S5) + gap), y: WA.y},
  };
  return {P, pose: pinch2(P, target.thumb, target.index), lift, sc};
};

export const ShotA: React.FC<{g: number}> = ({g}) => {
  const {P, pose, lift, sc} = shotA(g);
  const contact = V4['b05.pinch'];
  return (
    <g>
      <BgDesk />
      <ellipse cx={WA.x + 26 * lift} cy={WA.y + 30 + 36 * lift} rx={WA.r + 26} ry={WA.r + 14} fill={C.shadow} opacity={0.9 - 0.3 * lift} />
      <g transform={`translate(${WA.x} ${WA.y}) scale(${sc}) translate(${-WA.x} ${-WA.y})`}>
        <Washer x={WA.x} y={WA.y} r={WA.r} />
      </g>
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} pose={pose} forearm={{to: {x: P.x, y: -300}}} armW={64} />
      <Burst x={WA.x} y={WA.y} t={(g - contact) / 9} r0={WA.r + 50} r1={WA.r + 110} n={8} color={C.coral} w={7} />
      <ShotTitle g={g} from={fm(490)} text="PINCH." />
    </g>
  );
};

/**
 * (b) in-hand rotation of a bright cube. The palm is placed on the line through the cube centre at REACH px, a distance both
 * pads can actually reach, so the pinch is closed on the cube edges BEFORE the cube turns and stays closed through the turn.
 */
export const DB = {x: 450, y: 705, s: 140};
export const ROT_B = 40; // hand points up-left, coming in from the lower right
export const REACH_B = 318;
const U_B = {x: Math.cos(rad(ROT_B)), y: Math.sin(rad(ROT_B))}; // from the cube toward the palm
export const shotB = (g: number) => {
  const cut = V4['b05.cut_b'];
  const tTurn = V4['b05.turn'];
  const come = E.out(tw(g, cut - 8, 14)); // hand glides in (already visible when the shot slides on)
  const close = E.inOut(tw(g, cut + 1, 6)); // pads close on the cube edges (they are already within ~24 px when the shot slides on)
  const gap = 24 * (1 - close);
  const theta = 90 * E.inOut(tw(g, tTurn, 13)); // turning starts only after the grip is closed
  const D = REACH_B + 280 * (1 - come);
  const flip = true;
  const P: Place = {x: DB.x + U_B.x * D, y: DB.y + U_B.y * D, scale: 2.0, rot: ROT_B, flip};
  // pinch axis: perpendicular to the hand's pointing direction (-U). Each tip is SOLVED onto the cube: it sits where its pad capsule
  // just touches the rotated square (not at a guessed offset), so contact holds through the whole turn.
  const dir = {x: -U_B.x, y: -U_B.y};
  const axis = {x: -dir.y, y: dir.x};
  const poly = squareCorners({x: DB.x, y: DB.y}, DB.s, theta);
  const rel = ((theta - (Math.atan2(axis.y, axis.x) * 180) / Math.PI + 360) * Math.PI) / 180;
  const slide = 0.22 * DB.s * Math.sin(2 * rel) * 0.7;
  const pr = (n: 'thumb' | 'index') => (sd(n).w / 2) * P.scale + OUTLINE_PX / 2;
  const sl = (n: 'thumb' | 'index') => sd(n).len[2] * P.scale;
  const c = {x: DB.x, y: DB.y};
  const A = solveTip(poly, c, axis, dir, 1, slide, sl('index'), pr('index'));
  const B = solveTip(poly, c, axis, dir, -1, -slide, sl('thumb'), pr('thumb'));
  A.x += axis.x * gap; A.y += axis.y * gap; B.x -= axis.x * gap; B.y -= axis.y * gap;
  const L = (v: V) => toLocal(v.x, v.y, P.x, P.y, P.scale, P.rot, P.flip);
  const idxFirst = L(A).y < L(B).y;
  const pose = pinch2(P, idxFirst ? B : A, idxFirst ? A : B);
  return {P, pose, theta, gap, held: g >= cut + 8, A, B, idxFirst};
};

export const ShotB: React.FC<{g: number}> = ({g}) => {
  const {P, pose, theta} = shotB(g);
  const t0 = V4['b05.turn'];
  const arc = clamp01((g - t0) / 5) * (1 - clamp01((g - t0 - 14) / 6));
  return (
    <g>
      <BgPaper cx={DB.x} cy={DB.y} />
      <ellipse cx={DB.x + 26} cy={DB.y + 118} rx={100} ry={20} fill={C.shadow} />
      <Die x={DB.x} y={DB.y} s={DB.s} rot={theta} />
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} flip={P.flip} pose={pose} forearm={{to: {x: P.x + 700, y: P.y + 560}}} armW={60} />
      {arc > 0 && (
        <g transform={`translate(${DB.x} ${DB.y})`} opacity={arc} fill="none" stroke={C.blueDeep} strokeWidth={10} strokeLinecap="round">
          <path d="M -140 -50 A 150 150 0 0 1 20 -148" />
          <path d="M 0 -172 L 30 -148 L -2 -128" strokeLinejoin="round" />
        </g>
      )}
      <ShotTitle g={g} from={V4['b05.cut_b'] + 2} text="TURN." />
    </g>
  );
};

/** (c) workstation: drill drives a screw into a block (cause -> effect -> result) */
export const TOOLP = {x: 400, y: 900, s: 1.7};
const BLOCK = {x: 868, y: 712};
export const shotC = (g: number) => {
  const press = kf(g, [[V4['b05.press'], 0, E.inOut], [V4['b05.contact'], 1, E.in], [V4['b05.drive_end'] + 4, 1, E.linear]]);
  const enter = E.out(tw(g, V4['b05.cut_c'] - 4, 10));
  const bob = 4 * drift(g, 4, 60);
  const P: Place = {x: lerp(-260, TOOLP.x, enter), y: TOOLP.y + bob, scale: TOOLP.s};
  const L = (x: number, y: number) => toLocal(P.x + x * P.scale, P.y + y * P.scale, P.x, P.y, P.scale);
  const trig = {x: TOOL.trigX + 10 - 9 * press, y: TOOL.trigY + 8 + 3 * press};
  const pose: HandPose = {
    index: ikDigit(sd('index'), L(trig.x, trig.y), 74, -1),
    middle: ikDigit(sd('middle'), L(TOOL.handleX1 + 6, 0), 118, -1),
    ring: ikDigit(sd('ring'), L(TOOL.handleX1 + 6, 36), 124, -1),
    thumb: ikDigit(sd('thumb'), L(TOOL.handleX0 + 44, TOOL.handleY0 - 4), -52, 1),
  };
  return {P, pose, press};
};

export const ShotC: React.FC<{g: number}> = ({g}) => {
  const {P, pose, press} = shotC(g);
  const hit = V4['b05.contact'];
  const drive = E.inOut(tw(g, V4['b05.drive'], V4['b05.drive_end'] - V4['b05.drive']));
  const screwRot = 720 * drive;
  const sink = 26 * drive;
  const done = g >= V4['b05.drive_end'];
  const bitTip = {x: P.x + 246 * P.scale, y: P.y - 111 * P.scale};
  return (
    <g>
      <BgPeg tableY={1130} />
      {/* stand + workpiece block */}
      <rect x={BLOCK.x - 40} y={BLOCK.y + 70} width={80} height={1130 - BLOCK.y - 70} fill={C.inkSoft} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={BLOCK.x - 90} y={BLOCK.y - 90} width={140} height={190} rx={16} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE + 1} />
      <g transform={`translate(${BLOCK.x - 90 - 18 + sink} ${BLOCK.y}) rotate(${screwRot})`}>
        <circle r={36} fill={C.blueLight} stroke={C.ink} strokeWidth={5} />
        <path d="M -22 0 H 22 M 0 -22 V 22" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      </g>
      {done && (
        <g transform={`translate(${BLOCK.x - 20} ${BLOCK.y - 140})`}>
          <circle r={34} fill={C.teal} stroke={C.ink} strokeWidth={5} />
          <path d="M -15 2 L -4 14 L 17 -12" stroke={C.cream} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} pose={pose} forearm={{to: {x: -400, y: P.y + 520}}} armW={64}>
        <Tool4 press={press} />
      </Hand>
      {press > 0.5 && !done && (
        <g stroke={C.saffron} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.9}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${bitTip.x + 10} ${bitTip.y - 26 + i * 26} q 16 ${-8 + ((g * 3 + i * 5) % 10)} 0 0`} />
          ))}
        </g>
      )}
      <Burst x={P.x + (TOOL.trigX + 14) * P.scale} y={P.y + (TOOL.trigY + 8) * P.scale} t={(g - hit) / 10} r0={50} r1={104} n={8} color={C.coral} w={7} />
      <ShotTitle g={g} from={V4['b05.cut_c'] + 2} text="PRESS." />
    </g>
  );
};
void toWorld;
