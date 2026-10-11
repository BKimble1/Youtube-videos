import React from 'react';
import {C, F, E, tw, kf, lerp, clamp01, Burst, Headline, OUTLINE} from '../film/common';
import {Hand, HandPose, ikDigit, defOf, toLocal, toWorld, tipWorld, rad, V, Place} from '../hand/Hand';
import {sp, SNAP, drift} from '../lib/motion';
import {V3} from '../cues_v3';
import {BgPaper, BgDesk, BgPeg} from './stage';
import {frontPose} from '../film/beats1';
import {Washer, Die, Tool, TOOL} from '../film/props';
import {solveTip, squareCorners, OUTLINE_PX} from './contacts';

/* ------------------------------------------------------------------ B04: mechanism (light cool-paper stage) */

/** palm centre + scale chosen so the whole hand (tips to cuff) sits between the headline lane and the attribution lane */
export const RH4 = {x: 556, y: 892, s: 1.7};
const PL4: Place = {x: RH4.x, y: RH4.y, scale: RH4.s};

export const pose4 = (g: number): HandPose => {
  const t0 = V3['b04.thumb'], sp0 = V3['b04.splay'];
  const sw = kf(g, [[t0, 1, E.inOut], [t0 + 12, 0.12, E.inOut], [t0 + 24, 1, E.inOut]]);
  const cT = kf(g, [[t0, 0, E.inOut], [t0 + 12, 0.6, E.inOut], [t0 + 24, 0, E.inOut]]);
  const spread = kf(g, [[sp0, 0.2, E.inOut], [sp0 + 10, 1.05, E.inOut], [sp0 + 22, -0.1, E.inOut], [sp0 + 30, 0.2, E.inOut]]);
  const curl = (a: number) => kf(g, [[a, 0, E.inOut], [a + 10, 0.95, E.inOut], [a + 22, 0, E.inOut]]);
  return frontPose([cT, curl(V3['b04.curl1']), curl(V3['b04.curl2']), curl(V3['b04.curl3'])], spread, sw);
};

const trail = (g: number, name: 'thumb' | 'index' | 'middle' | 'ring', from: number, to: number, color: string) => {
  const g0 = Math.max(from, g - 16);
  const pts: V[] = [];
  for (let k = g0; k <= Math.min(g, to); k += 1) pts.push(tipWorld('robot', 'front', name, pose4(k), PL4));
  if (pts.length < 2) return null;
  return <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 16" opacity={0.95} />;
};

export const B04World: React.FC<{g: number}> = ({g}) => {
  const pose = pose4(g);
  const rise = sp(g, 304, SNAP);
  const hl: Record<string, number> = {};
  (['thumb', 'index', 'middle', 'ring'] as const).forEach((n, i) => {
    const t = V3[`b04.badge${i + 1}` as 'b04.badge1'];
    hl[n] = kf(g, [[t, 0, E.out], [t + 4, 1, E.out], [t + 14, 0.2, E.inOut], [V3['b04.count'] + 6, 0, E.in]]);
  });
  const t0 = V3['b04.thumb'], s0 = V3['b04.splay'];
  const badges = (['thumb', 'index', 'middle', 'ring'] as const).map((n, i) => {
    const t = V3[`b04.badge${i + 1}` as 'b04.badge1'];
    const p = tipWorld('robot', 'front', n, pose, PL4);
    return {n, i, t, x: p.x, y: p.y - 74};
  });
  // splay chevrons sit beside the outer fingertips (hand-local, so they follow the hand)
  const chev = (sx: 1 | -1) => toWorld({x: sx * 168, y: -158}, RH4.x, RH4.y, RH4.s);
  return (
    <g>
      <BgPaper cx={RH4.x} cy={RH4.y - 40} />
      <g transform={`translate(0 ${(1 - rise) * 560})`}>
        <Hand x={RH4.x} y={RH4.y} scale={RH4.s} pose={pose} forearm={{stand: 2300}} highlight={hl} />
      </g>
      {trail(g, 'thumb', t0, t0 + 26, C.blueDeep)}
      {g >= s0 && g < s0 + 30 && (
        <g stroke={C.coralDeep} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={Math.sin(((g - s0) / 30) * Math.PI)}>
          {([-1, 1] as const).map((sx) => {
            const c = chev(sx);
            return <path key={sx} d={`M ${c.x - sx * 36} ${c.y + 8} L ${c.x + sx * 30} ${c.y - 6} M ${c.x + sx * 6} ${c.y - 36} L ${c.x + sx * 34} ${c.y - 6} L ${c.x + sx * 4} ${c.y + 20}`} />;
          })}
        </g>
      )}
      {trail(g, 'index', V3['b04.curl1'], V3['b04.curl1'] + 24, C.blueDeep)}
      {trail(g, 'middle', V3['b04.curl2'], V3['b04.curl2'] + 24, C.coralDeep)}
      {trail(g, 'ring', V3['b04.curl3'], V3['b04.curl3'] + 24, C.tealDeep)}
      {badges.map((b) => {
        const k = sp(g, b.t, SNAP);
        const out = tw(g, V3['b04.count'] - 4, 6, E.in);
        if (k < 0.02 || out >= 1) return null;
        return (
          <g key={b.n} transform={`translate(${b.x} ${b.y}) scale(${k * (1 - out)})`}>
            <circle r={40} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={52} fill={C.ink}>{b.i + 1}</text>
          </g>
        );
      })}
    </g>
  );
};

export const B04Hud: React.FC<{g: number}> = ({g}) => {
  const tD = V3['b04.badge1'] - 2;
  const t13 = V3['b04.count'];
  const a = sp(g, tD, SNAP);
  const out = tw(g, t13 - 3, 4, E.in);
  const b = sp(g, t13, SNAP);
  const num = Math.min(13, Math.max(1, Math.floor((g - t13) / 1.1) + 1));
  return (
    <g>
      {g >= tD && g < t13 + 2 && <Headline x={540} y={304} text="4 DIGITS" size={124} color={C.ink} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}
      {g >= t13 && (
        <g>
          <g transform={`translate(250 324) scale(${b})`}>
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={230} fill={C.saffron} stroke={C.ink} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">{num}</text>
          </g>
          <Headline x={420} y={282} text="WAYS" size={80} anchor="start" color={C.ink} sx={b} sy={b} />
          <Headline x={420} y={360} text="TO MOVE" size={80} anchor="start" color={C.ink} sx={b} sy={b} />
          <g transform={`translate(420 428) scale(${b})`}>
            <rect x={0} y={-30} width={190} height={60} rx={14} fill={C.ink} stroke={C.ink} strokeWidth={4} />
            <text x={95} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.mono} fontWeight={500} fontSize={42} fill={C.saffron}>13 DOF</text>
          </g>
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
  return <Headline x={120} anchor="start" y={304} text={text} size={120} color={C.ink} sx={k + 0.001} sy={k + 0.001} />;
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
  const contact = V3['b05.pinch'];
  const approach = E.out(tw(g, 489, 26));
  const gap = kf(g, [[489, 100, E.linear], [contact - 8, 80, E.inOut], [contact, 0, E.in]]);
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
  const contact = V3['b05.pinch'];
  return (
    <g>
      <BgDesk />
      <ellipse cx={WA.x + 26 * lift} cy={WA.y + 30 + 36 * lift} rx={WA.r + 26} ry={WA.r + 14} fill={C.shadow} opacity={0.9 - 0.3 * lift} />
      <g transform={`translate(${WA.x} ${WA.y}) scale(${sc}) translate(${-WA.x} ${-WA.y})`}>
        <Washer x={WA.x} y={WA.y} r={WA.r} />
      </g>
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} pose={pose} forearm={{to: {x: P.x, y: -300}}} armW={64} />
      <Burst x={WA.x} y={WA.y} t={(g - contact) / 9} r0={WA.r + 50} r1={WA.r + 110} n={8} color={C.coral} w={7} />
      <ShotTitle g={g} from={490} text="PINCH." />
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
  const cut = V3['b05.cut_b'];
  const tTurn = V3['b05.turn'];
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
  const t0 = V3['b05.turn'];
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
      <ShotTitle g={g} from={V3['b05.cut_b'] + 2} text="TURN." />
    </g>
  );
};

/** (c) workstation: drill drives a screw into a block (cause -> effect -> result) */
export const TOOLP = {x: 400, y: 900, s: 1.7};
const BLOCK = {x: 868, y: 712};
export const shotC = (g: number) => {
  const press = kf(g, [[V3['b05.press'], 0, E.inOut], [V3['b05.contact'], 1, E.in], [V3['b05.drive_end'] + 4, 1, E.linear]]);
  const enter = E.out(tw(g, V3['b05.cut_c'] - 4, 10));
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
  const hit = V3['b05.contact'];
  const drive = E.inOut(tw(g, V3['b05.drive'], V3['b05.drive_end'] - V3['b05.drive']));
  const screwRot = 720 * drive;
  const sink = 26 * drive;
  const done = g >= V3['b05.drive_end'];
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
        <Tool press={press} />
      </Hand>
      {press > 0.5 && !done && (
        <g stroke={C.saffron} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.9}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${bitTip.x + 10} ${bitTip.y - 26 + i * 26} q 16 ${-8 + ((g * 3 + i * 5) % 10)} 0 0`} />
          ))}
        </g>
      )}
      <Burst x={P.x + (TOOL.trigX + 14) * P.scale} y={P.y + (TOOL.trigY + 8) * P.scale} t={(g - hit) / 10} r0={50} r1={104} n={8} color={C.coral} w={7} />
      <ShotTitle g={g} from={V3['b05.cut_c'] + 2} text="PRESS." />
    </g>
  );
};
void toWorld;
