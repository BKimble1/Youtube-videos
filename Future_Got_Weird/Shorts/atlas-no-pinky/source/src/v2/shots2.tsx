import React from 'react';
import {C, F, E, tw, kf, lerp, clamp01, Burst, Headline, OUTLINE, W} from '../film/common';
import {Hand, HandPose, ikDigit, defOf, toLocal, toWorld, tipWorld, V, Place} from '../hand/Hand';
import {sp, SNAP, SOFT, drift} from '../lib/motion';
import {V2} from '../cues_v2';
import {BgInk, BgDesk, BgPeg} from './stage';
import {frontPose} from '../film/beats1';
import {pinchPose} from '../film/beats2';
import {Washer, Die, Tool, TOOL} from '../film/props';

/* ------------------------------------------------------------------ B04: mechanism macro */

export const RH4 = {x: 560, y: 1050, s: 1.7};
const PL4: Place = {x: RH4.x, y: RH4.y, scale: RH4.s};

export const pose4 = (g: number): HandPose => {
  const t0 = V2['b04.thumb'], sp0 = V2['b04.splay'];
  const sw = kf(g, [[t0, 1, E.inOut], [t0 + 12, 0.12, E.inOut], [t0 + 24, 1, E.inOut]]);
  const cT = kf(g, [[t0, 0, E.inOut], [t0 + 12, 0.6, E.inOut], [t0 + 24, 0, E.inOut]]);
  const spread = kf(g, [[sp0, 0.2, E.inOut], [sp0 + 10, 1.05, E.inOut], [sp0 + 22, -0.1, E.inOut], [sp0 + 30, 0.2, E.inOut]]);
  const curl = (a: number) => kf(g, [[a, 0, E.inOut], [a + 10, 0.95, E.inOut], [a + 22, 0, E.inOut]]);
  return frontPose([cT, curl(V2['b04.curl1']), curl(V2['b04.curl2']), curl(V2['b04.curl3'])], spread, sw);
};

const cam4 = (g: number) => {
  const t0 = V2['b04.thumb'], s0 = V2['b04.splay'], c0 = V2['b04.curl1'];
  const k1 = E.inOut(tw(g, t0 - 8, 12)) * (1 - E.inOut(tw(g, s0 - 10, 12)));
  const k2 = E.inOut(tw(g, s0 - 10, 12)) * (1 - E.inOut(tw(g, c0 - 10, 12)));
  const k3 = E.inOut(tw(g, c0 - 10, 12));
  const ST = [{z: 1.35, cx: 400, cy: 870}, {z: 1.3, cx: 600, cy: 790}, {z: 1.15, cx: 560, cy: 830}];
  const w = [k1, k2, k3];
  const w0 = Math.max(0, 1 - (k1 + k2 + k3));
  const tot = w0 + k1 + k2 + k3;
  const z = (w0 + w.reduce((a, v, i) => a + v * ST[i].z, 0)) / tot;
  const cx = (540 * w0 + w.reduce((a, v, i) => a + v * ST[i].cx, 0)) / tot;
  const cy = (960 * w0 + w.reduce((a, v, i) => a + v * ST[i].cy, 0)) / tot;
  return {z, cx, cy};
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
  const rise = sp(g, 310, SOFT);
  const hl: Record<string, number> = {};
  (['thumb', 'index', 'middle', 'ring'] as const).forEach((n, i) => {
    const t = V2[`b04.badge${i + 1}` as 'b04.badge1'];
    hl[n] = kf(g, [[t, 0, E.out], [t + 4, 1, E.out], [t + 14, 0.2, E.inOut], [V2['b04.count'] + 6, 0, E.in]]);
  });
  const c = cam4(g);
  const t0 = V2['b04.thumb'], s0 = V2['b04.splay'];
  const badges = (['thumb', 'index', 'middle', 'ring'] as const).map((n, i) => {
    const t = V2[`b04.badge${i + 1}` as 'b04.badge1'];
    const p = tipWorld('robot', 'front', n, pose, PL4);
    return {n, i, t, x: p.x, y: p.y - 74};
  });
  return (
    <g>
      <BgInk cx={560} cy={900} />
      <g transform={`translate(540 960) scale(${c.z}) translate(${-c.cx} ${-c.cy})`}>
        <g transform={`translate(0 ${(1 - rise) * 520})`}>
          <Hand x={RH4.x} y={RH4.y} scale={RH4.s} pose={pose} forearm={{stand: 2300}} highlight={hl} />
        </g>
        {trail(g, 'thumb', t0, t0 + 26, C.saffron)}
        {/* splay arrows */}
        {g >= s0 && g < s0 + 30 && (
          <g stroke={C.saffron} strokeWidth={10} strokeLinecap="round" fill="none" opacity={Math.sin(((g - s0) / 30) * Math.PI)}>
            <path d="M 390 560 L 340 600 M 340 560 v 40 h 40" transform="translate(30 -20)" />
            <path d="M 810 560 L 860 600 M 830 560 h 40 v 40" transform="translate(-60 -20)" />
          </g>
        )}
        {trail(g, 'index', V2['b04.curl1'], V2['b04.curl1'] + 24, C.saffron)}
        {trail(g, 'middle', V2['b04.curl2'], V2['b04.curl2'] + 24, C.coral)}
        {trail(g, 'ring', V2['b04.curl3'], V2['b04.curl3'] + 24, C.tealLight)}
        {badges.map((b) => {
          const k = sp(g, b.t, SNAP);
          const out = tw(g, V2['b04.count'] - 4, 6, E.in);
          if (k < 0.02 || out >= 1) return null;
          return (
            <g key={b.n} transform={`translate(${b.x} ${b.y}) scale(${k * (1 - out)})`}>
              <circle r={40} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
              <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={52} fill={C.ink}>{b.i + 1}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
};

export const B04Hud: React.FC<{g: number}> = ({g}) => {
  const tD = V2['b04.badge1'] - 2;
  const t13 = V2['b04.count'];
  const a = sp(g, tD, SNAP);
  const out = tw(g, t13 - 3, 4, E.in);
  const b = sp(g, t13, SNAP);
  const num = Math.min(13, Math.max(1, Math.floor((g - t13) / 1.1) + 1));
  return (
    <g>
      {g >= tD && g < t13 + 2 && <Headline x={540} y={290} text="4 DIGITS" size={124} color={C.saffron} stroke={C.ink} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}
      {g >= t13 && (
        <g>
          <g transform={`translate(250 292) scale(${b})`}>
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={230} fill={C.saffron} stroke={C.ink} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">{num}</text>
          </g>
          <Headline x={420} y={250} text="WAYS" size={80} anchor="start" color={C.cream} stroke={C.ink} sx={b} sy={b} />
          <Headline x={420} y={330} text="TO MOVE" size={80} anchor="start" color={C.cream} stroke={C.ink} sx={b} sy={b} />
          <g transform={`translate(420 410) scale(${b})`}>
            <rect x={0} y={-30} width={190} height={60} rx={14} fill={C.ink} stroke={C.saffron} strokeWidth={4} />
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

/** (a) overhead pinch of a flat washer on the lab mat, hand reaching down from the top */
export const WA = {x: 640, y: 960, r: 70};
export const shotA = (g: number) => {
  const contact = V2['b05.pinch'];
  const approach = E.out(tw(g, 489, 30));
  const gap = kf(g, [[489, 100, E.linear], [contact - 8, 80, E.inOut], [contact, 0, E.in]]);
  const lift = E.inOut(tw(g, contact + 2, 9));
  const pad = 22 * S5 * 0.92;
  const sc = 1 + 0.2 * lift;
  const P: Place = {x: WA.x + 12, y: lerp(WA.y - 290 - 380, WA.y - 290, approach) - 20 * lift, scale: S5, rot: 90};
  const target = {thumb: {x: WA.x - (WA.r * sc + pad + gap), y: WA.y}, index: {x: WA.x + (WA.r * sc + pad + gap), y: WA.y}};
  return {P, pose: pinchPose(P, target.thumb, target.index), lift, sc};
};

export const ShotA: React.FC<{g: number}> = ({g}) => {
  const {P, pose, lift, sc} = shotA(g);
  const contact = V2['b05.pinch'];
  return (
    <g>
      <BgDesk />
      <ellipse cx={WA.x + 26 * lift} cy={WA.y + 30 + 36 * lift} rx={WA.r + 26} ry={WA.r + 14} fill={C.shadow} opacity={0.9 - 0.3 * lift} />
      <g transform={`translate(${WA.x} ${WA.y}) scale(${sc}) translate(${-WA.x} ${-WA.y})`}>
        <Washer x={WA.x} y={WA.y} r={WA.r} />
      </g>
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} pose={pose} forearm={{to: {x: P.x, y: -300}}} armW={64} />
      <Burst x={WA.x} y={WA.y} t={(g - contact) / 9} r0={WA.r + 50} r1={WA.r + 110} n={8} color={C.coral} w={7} />
    </g>
  );
};

/** (b) diagonal in-hand rotation of a bright cube on a dark ground */
export const DB = {x: 470, y: 760, s: 140};
export const shotB = (g: number) => {
  const t0 = V2['b05.turn'];
  const theta = 90 * E.inOut(tw(g, t0, 17));
  const approach = E.out(tw(g, V2['b05.cut_b'] - 6, 14));
  const rotH = 62, flip = true;
  const P: Place = {x: lerp(1250, 790, approach) + 0, y: lerp(1500, 1140, approach), scale: 2.0, rot: rotH, flip};
  // pad axis: perpendicular to the pointing direction of the hand
  const dir = {x: -Math.cos((rotH * Math.PI) / 180), y: -Math.sin((rotH * Math.PI) / 180)};
  const axis = {x: -dir.y, y: dir.x};
  const rel = ((theta - (Math.atan2(axis.y, axis.x) * 180) / Math.PI + 360) * Math.PI) / 180;
  const hExt = (DB.s / 2) * (Math.abs(Math.cos(rel)) + Math.abs(Math.sin(rel)));
  const pad = 22 * 2.0 * 0.92;
  const slide = 0.22 * DB.s * Math.sin(2 * rel) * 0.7;
  const A = {x: DB.x + axis.x * (hExt + pad) + dir.x * slide, y: DB.y + axis.y * (hExt + pad) + dir.y * slide};
  const B = {x: DB.x - axis.x * (hExt + pad) - dir.x * slide, y: DB.y - axis.y * (hExt + pad) - dir.y * slide};
  const L = (v: V) => toLocal(v.x, v.y, P.x, P.y, P.scale, P.rot, P.flip);
  const idxFirst = L(A).y < L(B).y;
  const pose = pinchPose(P, idxFirst ? B : A, idxFirst ? A : B);
  return {P, pose, theta};
};

export const ShotB: React.FC<{g: number}> = ({g}) => {
  const {P, pose, theta} = shotB(g);
  const t0 = V2['b05.turn'];
  const arc = clamp01((g - t0) / 5) * (1 - clamp01((g - t0 - 17) / 6));
  return (
    <g>
      <BgInk cx={480} cy={760} />
      <ellipse cx={DB.x + 22} cy={DB.y + 130} rx={110} ry={26} fill="#000000" opacity={0.28} />
      <Die x={DB.x} y={DB.y} s={DB.s} rot={theta} />
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} flip={P.flip} pose={pose} forearm={{to: {x: P.x + 700, y: P.y + 760}}} armW={60} />
      {arc > 0 && (
        <g transform={`translate(${DB.x} ${DB.y})`} opacity={arc} fill="none" stroke={C.saffron} strokeWidth={9} strokeLinecap="round">
          <path d="M -130 -60 A 140 140 0 0 1 40 -134" />
          <path d="M 20 -156 L 48 -132 L 16 -116" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/** (c) workstation: drill drives a screw into a block (cause -> effect -> result) */
export const TOOLP = {x: 400, y: 900, s: 1.7};
const BLOCK = {x: 868, y: 712};
export const shotC = (g: number) => {
  const press = kf(g, [[V2['b05.press'], 0, E.inOut], [V2['b05.contact'], 1, E.in], [V2['b05.drive_end'] + 4, 1, E.linear]]);
  const enter = E.out(tw(g, V2['b05.cut_c'] - 4, 10));
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
  const hit = V2['b05.contact'];
  const drive = E.inOut(tw(g, V2['b05.drive'], V2['b05.drive_end'] - V2['b05.drive']));
  const screwRot = 720 * drive;
  const sink = 26 * drive;
  const done = g >= V2['b05.drive_end'];
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
    </g>
  );
};

export const B05Hud: React.FC<{g: number}> = ({g}) => {
  const items = [
    {t: V2['b05.pinch'] - 2, text: 'PINCH.'},
    {t: V2['b05.turn'] + 2, text: 'TURN.'},
    {t: V2['b05.press'] - 2, text: 'PRESS.'},
  ];
  const endT = V2['b05.drive_end'] + 6;
  return (
    <g>
      {items.map((it, i) => {
        const next = items[i + 1]?.t ?? endT;
        if (g < it.t || g >= next + 3) return null;
        const k = sp(g, it.t, SNAP);
        const out = tw(g, next - 2, 4, E.in);
        const onInk = i === 1;
        return <Headline key={i} x={110} anchor="start" y={300} text={it.text} size={132} color={onInk ? C.saffron : C.ink} stroke={onInk ? C.ink : undefined} sx={k * (1 - out) + 0.001} sy={k * (1 - out) + 0.001} />;
      })}
    </g>
  );
};
void W; void toWorld;
