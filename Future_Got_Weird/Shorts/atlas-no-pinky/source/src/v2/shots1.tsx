import React from 'react';
import {C, F, E, tw, kf, lerp, clamp01, Burst, Headline, Plate, OUTLINE, H, W} from '../film/common';
import {Hand, HandPose, DigitPose, ikDigit, defOf, toLocal, toWorld, digitPts, LAYOUTS, V, Place} from '../hand/Hand';
import {sp, SNAP, SOFT, ring, drift, strike} from '../lib/motion';
import {V2} from '../cues_v2';
import {BgDesk} from './stage';
import {GuideArm} from './util';
import {Dial} from '../film/props';
import {bandOf} from '../film/beats1';
import {TapeBand} from '../film/props';

/* ------------------------------------------------------------------ B02: overhead experiment (reconstruction) */

const hd = (n: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky') => defOf('human', 'front', n)!;
const wig = (g: number, a: number) => (g < a || g > a + 14 ? 0 : Math.sin(((g - a) / 14) * Math.PI));

const T0 = V2['exp.wrap'];
const ROT0 = 162; // rotation of the hand toward the objects
const SC = 1.6; // hand scale in B02: whole hand + task stays above the label lane
const MUG = {x: 800, y: 700, r: 96};
const KNOB = {x: 700, y: 950, r: 62};

/** hand placement over the whole shot: rises, taped at the bottom centre, then turns toward the objects and follows them */
export const exp2 = (g: number) => {
  const rise = sp(g, 98, SOFT);
  const turn = E.inOut(tw(g, ROT0, 16));
  const toKnob = E.inOut(tw(g, 205, 9));
  const mugP = {x: 364, y: 804};
  const knobP = {x: 404, y: 974};
  const pos = toKnob;
  const x = lerp(540, lerp(mugP.x, knobP.x, pos), turn);
  const y = lerp(900 + (1 - rise) * 330, lerp(mugP.y, knobP.y, pos), turn);
  const rot = 90 * turn;
  const lift = E.inOut(tw(g, 182, 12)) - E.in(tw(g, 195, 10));
  const grabMug = 1 - kf(g, [[ROT0 + 10, 1, E.linear], [V2['exp.mug.grasp'] + 3, 0, E.out], [204, 0, E.linear], [210, 1, E.out]]);
  const grabKnob = 1 - kf(g, [[205, 1, E.linear], [213, 0, E.out], [225, 0, E.linear], [231, 1, E.out]]);
  const turnK = 70 * E.out(tw(g, V2['exp.knob.turn'], 8));
  return {x, y, rot, turn, lift, grabMug, grabKnob, turnK, rise};
};

const humanPose = (g: number, t: number): HandPose => {
  const k = tw(g, T0, 8);
  const w = drift(g, 3, 70);
  const fl = (a: number): [number, number, number] => [26 * wig(g, a), 22 * wig(g, a), 14 * wig(g, a)];
  void t;
  return {
    thumb: {ang: [-150 + w * 2, -146, -140], flex: [10 * wig(g, V2['exp.wiggle']), 8 * wig(g, V2['exp.wiggle']), 0]},
    index: {ang: [-98 + w, -96, -94], flex: fl(V2['exp.wiggle'] + 6)},
    middle: {ang: [-92, -92, -92], flex: fl(V2['exp.wiggle'] + 12)},
    ring: {ang: [lerp(-82, -80, k), lerp(-82, -80, k), lerp(-84, -82, k)], flex: fl(V2['exp.wiggle'] + 18)},
    pinky: {ang: [lerp(-66, -80, k), lerp(-66, -80, k), lerp(-66, -80, k)], flex: fl(V2['exp.wiggle'] + 24)},
  };
};

const blendDigit = (a: DigitPose, b: DigitPose, k: number): DigitPose => ({
  ang: a.ang.map((v, i) => lerp(v, b.ang[i], k)) as [number, number, number],
  flex: [0, 1, 2].map((i) => lerp(a.flex?.[i] ?? 0, b.flex?.[i] ?? 0, k)) as [number, number, number],
});
const FOLD: DigitPose = {ang: [-80, -80, -78], flex: [58, 42, 30]};

const humanTasks = (pl: Place, a: ReturnType<typeof exp2>, g: number, mugBar: V, knob: V): HandPose => {
  const L = (v: V) => toLocal(v.x, v.y, pl.x, pl.y, pl.scale, pl.rot ?? 0);
  const base = humanPose(g, 0);
  if (g < ROT0) return base;
  const mugPose = (): HandPose => {
    const o = a.grabMug;
    const idx = ikDigit(hd('index'), L({x: mugBar.x - 70 * o, y: mugBar.y - 40 - 18 * o}), -78, 1);
    const mid = ikDigit(hd('middle'), L({x: mugBar.x - 70 * o, y: mugBar.y - 10 - 8 * o}), -78, 1);
    const rp = (d: ReturnType<typeof hd>, dy: number) => ikDigit(d, L({x: mugBar.x - 20 - 80 * o, y: mugBar.y + dy + 14 * o}), -84, 1);
    return {...base, index: idx, middle: mid, ring: rp(hd('ring'), 24), pinky: rp(hd('pinky'), 52), thumb: ikDigit(hd('thumb'), L({x: mugBar.x - 20 - 60 * o, y: mugBar.y - 96 - 12 * o}), -70, -1)};
  };
  const knobPose = (): HandPose => {
    const o = a.grabKnob;
    const pad = 17 * pl.scale * 0.92;
    const th = ikDigit(hd('thumb'), L({x: knob.x - 12 * o, y: knob.y - KNOB.r - pad - 30 * o}), -70, -1);
    const ix = ikDigit(hd('index'), L({x: knob.x - 12 * o, y: knob.y + KNOB.r + pad + 30 * o}), -110, 1);
    return {...base, thumb: th, index: ix, middle: FOLD, ring: FOLD, pinky: FOLD};
  };
  const k = E.inOut(tw(g, 205, 10));
  if (g < 205) return mugPose();
  if (g >= 215) return knobPose();
  const m = mugPose();
  const n = knobPose();
  const out: HandPose = {...m};
  (['thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach((d) => { out[d] = blendDigit(m[d] as DigitPose, n[d] as DigitPose, k); });
  return out;
};

export const B02World: React.FC<{g: number}> = ({g}) => {
  const a = exp2(g);
  const pl: Place = {x: a.x, y: a.y, scale: SC, rot: a.rot};
  const mugBar = {x: MUG.x - MUG.r - 40, y: MUG.y};
  const lift = a.lift;
  const pose = humanTasks(pl, a, g, mugBar, KNOB);
  const band = bandOf('front', pose);
  const bandW = toWorld({x: band.cx, y: band.cy}, a.x, a.y, SC, a.rot);
  const wrapT = clamp01((g - T0) / 6);
  // the guide's sleeved arm sweeps the tape across ring + pinky from the right edge, then retracts
  const sweepIn = E.out(tw(g, T0 - 18, 14));
  const sweep = E.inOut(tw(g, T0 - 4, 5));
  const retract = E.inOut(tw(g, T0 + 6, 12));
  const showArm = g >= T0 - 18 && g < T0 + 20 && a.turn < 0.01;
  const mitt = {x: lerp(lerp(1240, 1000, sweepIn), bandW.x + 20, sweep) + 220 * retract, y: lerp(lerp(600, 640, sweepIn), bandW.y, sweep) - 40 * retract};
  const tear = tw(g, T0 + 1, 10, E.in);
  const zoomK = 1 + 0.4 * (E.inOut(tw(g, V2['exp.push'], 12)) - E.inOut(tw(g, 176, 18)));
  const cx = lerp(540, bandW.x, zoomK - 1 > 0 ? (zoomK - 1) / 0.4 : 0);
  const cy = lerp(960, bandW.y, zoomK - 1 > 0 ? (zoomK - 1) / 0.4 : 0);
  const mugScale = 1 + 0.16 * lift;
  const mugOff = {x: 26 * lift, y: 34 * lift};
  const knobAng = a.turnK;
  const dayK = E.inOut(tw(g, T0, 78));
  const hold = kf(g, [[0, 0, E.linear], [V2['exp.day.done'], 1, E.out]]);
  void hold;
  return (
    <g>
      <BgDesk />
      <g transform={`translate(0 70) translate(540 960) scale(${zoomK}) translate(${-cx} ${-cy})`}>
        {/* day dial: one revolution while the hand lives with the tape */}
        {/* objects (top-down): mug with handle, ridged knob */}
        <g>
          <ellipse cx={MUG.x + 18 + mugOff.x} cy={MUG.y + 22 + mugOff.y} rx={MUG.r + 22} ry={MUG.r + 18} fill={C.shadow} opacity={1 - 0.3 * lift} />
          <g transform={`translate(${MUG.x} ${MUG.y}) scale(${mugScale}) translate(${-MUG.x} ${-MUG.y})`}>
            <path d={`M ${MUG.x - MUG.r + 6} ${MUG.y - 52} C ${MUG.x - MUG.r - 70} ${MUG.y - 56}, ${MUG.x - MUG.r - 70} ${MUG.y + 56}, ${MUG.x - MUG.r + 6} ${MUG.y + 52}`} fill="none" stroke={C.ink} strokeWidth={40} strokeLinecap="round" />
            <path d={`M ${MUG.x - MUG.r + 6} ${MUG.y - 52} C ${MUG.x - MUG.r - 70} ${MUG.y - 56}, ${MUG.x - MUG.r - 70} ${MUG.y + 56}, ${MUG.x - MUG.r + 6} ${MUG.y + 52}`} fill="none" stroke={C.blue} strokeWidth={28} strokeLinecap="round" />
            <circle cx={MUG.x} cy={MUG.y} r={MUG.r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE + 1} />
            <circle cx={MUG.x} cy={MUG.y} r={MUG.r - 16} fill="#6B4A2E" stroke={C.ink} strokeWidth={4} />
            <circle cx={MUG.x - 30} cy={MUG.y - 30} r={16} fill="#FFFFFF" opacity={0.3} />
          </g>
        </g>
        <g>
          <ellipse cx={KNOB.x + 14} cy={KNOB.y + 18} rx={KNOB.r + 20} ry={KNOB.r + 14} fill={C.shadow} />
          <g transform={`translate(${KNOB.x} ${KNOB.y}) rotate(${knobAng})`}>
            <circle r={KNOB.r} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE + 1} />
            {Array.from({length: 14}).map((_, i) => (
              <line key={i} x1={0} y1={-KNOB.r + 8} x2={0} y2={-KNOB.r + 24} stroke={C.coralDeep} strokeWidth={6} strokeLinecap="round" transform={`rotate(${(i * 360) / 14})`} />
            ))}
            <circle r={KNOB.r * 0.42} fill={C.coralDeep} stroke={C.ink} strokeWidth={4} />
            <line x1={0} y1={-6} x2={0} y2={-KNOB.r * 0.75} stroke={C.cream} strokeWidth={9} strokeLinecap="round" />
          </g>
        </g>
        <g transform={`translate(${MUG.x} ${MUG.y}) scale(${g >= ROT0 + 10 && g < 209 ? mugScale : 1}) translate(${-MUG.x} ${-MUG.y})`}>
          <Hand kind="human" nails x={a.x} y={a.y} scale={SC} rot={a.rot} pose={pose}
            forearm={a.turn < 0.5 ? {stand: 2300} : {to: {x: -420, y: a.y + 60}}}
            front={wrapT > 0.3 ? <TapeBand cx={band.cx} cy={band.cy} len={band.len} h={54} rot={band.rot} /> : null} />
        </g>
        {/* guide's sleeve + mitt bringing the tape */}
        {showArm && (
          <g>
            <path d={`M ${mitt.x} ${mitt.y} Q ${lerp(mitt.x, bandW.x, 0.4) + 160} ${mitt.y - 40} ${W + 200} ${mitt.y - 80 + tear * 160}`} fill="none" stroke={C.ink} strokeWidth={64} strokeLinecap="round" opacity={1 - tear} />
            <path d={`M ${mitt.x} ${mitt.y} Q ${lerp(mitt.x, bandW.x, 0.4) + 160} ${mitt.y - 40} ${W + 200} ${mitt.y - 80 + tear * 160}`} fill="none" stroke={C.blue} strokeWidth={52} strokeLinecap="round" opacity={1 - tear} />
            <GuideArm from={{x: mitt.x + 520, y: mitt.y + 170}} to={mitt} />
          </g>
        )}
        <Burst x={bandW.x} y={bandW.y} t={(g - T0) / 10} r0={60} r1={130} n={8} color={C.ink} w={6} />
      </g>
      <Dial x={850} y={470} r={86} angle={360 * dayK} kick={7 * ring(g, V2['exp.day.done'], 1.1, 0.25)} />
    </g>
  );
};

export const B02Hud: React.FC<{g: number}> = ({g}) => {
  const t = V2['label.day'];
  const a = sp(g, t, SNAP);
  const out = tw(g, 241, 5, E.in);
  return <g>{g >= t && <Headline x={440} y={280} text="ONE DAY" size={130} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}</g>;
};

/* ------------------------------------------------------------------ B03: decision slip */

export const SLIP = {x: 540, y: 830, w: 760, h: 1000};
export const STAMP_AT = {x: 330, y: 1010};

export const slip3 = (g: number) => {
  const inK = E.out(tw(g, V2['slip.in'], 12));
  const hit = V2['stamp.hit'];
  const s = strike(g, hit, 9, 3, 3, 10);
  const arm = {x: lerp(-180, STAMP_AT.x + 0, E.out(tw(g, V2['stamp.hover'] - 14, 14))), y: lerp(1150, 960, E.out(tw(g, V2['stamp.hover'] - 14, 14)))};
  const press = s > 0 ? s : s * 0.4;
  const hy = lerp(arm.y, STAMP_AT.y + 20, clamp01(press > 0 ? press : 0)) + (press < 0 ? press * -40 : 0) * 0;
  const leave = E.in(tw(g, hit + 14, 8));
  const squash = 1 - 0.035 * clamp01(1 - (g - hit) / 7) * (g >= hit ? 1 : 0);
  return {inK, hit, s, arm: {x: arm.x - leave * 260, y: hy - leave * 120}, leave, squash, slipY: SLIP.y + (1 - inK) * 1100};
};

export const B03World: React.FC<{g: number}> = ({g}) => {
  const b = slip3(g);
  const marked = g >= b.hit;
  const pk = sp(g, b.hit, SNAP);
  const sc = 1 + (0.06) * (1 - pk) * (marked ? 1 : 0);
  return (
    <g>
      <BgDesk />
      <g transform={`translate(${SLIP.x} ${b.slipY}) rotate(-1.5) scale(${b.squash} ${b.squash}) translate(${-SLIP.x} ${-SLIP.y})`}>
        <rect x={SLIP.x - SLIP.w / 2 + 10} y={SLIP.y - SLIP.h / 2 + 14} width={SLIP.w} height={SLIP.h} rx={30} fill={C.ink} opacity={0.2} />
        <rect x={SLIP.x - SLIP.w / 2} y={SLIP.y - SLIP.h / 2} width={SLIP.w} height={SLIP.h} rx={30} fill={C.white} stroke={C.ink} strokeWidth={OUTLINE + 1} />
        <text x={SLIP.x - SLIP.w / 2 + 50} y={SLIP.y - SLIP.h / 2 + 84} fontFamily={F.mono} fontWeight={500} fontSize={44} fill={C.inkSoft} letterSpacing={4}>THE VERDICT</text>
        <line x1={SLIP.x - SLIP.w / 2 + 50} y1={SLIP.y - SLIP.h / 2 + 118} x2={SLIP.x + SLIP.w / 2 - 50} y2={SLIP.y - SLIP.h / 2 + 118} stroke={C.ink} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" />
        {/* two options: keep it / skip it */}
        {[{label: 'KEEP IT', y: SLIP.y - 150, chosen: false}, {label: 'SKIP IT', y: SLIP.y + 130, chosen: true}].map((o) => (
          <g key={o.label}>
            <rect x={SLIP.x - SLIP.w / 2 + 60} y={o.y - 90} width={180} height={180} rx={26} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE + 1} />
            <text x={SLIP.x - SLIP.w / 2 + 290} y={o.y} dy="0.36em" fontFamily={F.display} fontWeight={700} fontSize={118} fill={o.chosen && marked ? C.ink : C.inkMuted} opacity={o.chosen && marked ? 1 : 0.8}>{o.label}</text>
            {o.chosen && marked && <rect x={SLIP.x - SLIP.w / 2 + 290} y={o.y + 68} width={380} height={14} rx={7} fill={C.saffron} />}
          </g>
        ))}
        {marked && (
          <g transform={`translate(${STAMP_AT.x} ${STAMP_AT.y}) scale(${sc})`}>
            <circle r={104} fill="none" stroke={C.coral} strokeWidth={12} />
            <circle r={78} fill={C.coral} opacity={0.18} />
            <path d="M -50 -50 L 50 50 M 50 -50 L -50 50" stroke={C.coral} strokeWidth={26} strokeLinecap="round" />
          </g>
        )}
      </g>
      {/* stamp on the guide's mitt: a round rubber stamp seen from above */}
      {g >= V2['stamp.hover'] - 14 && b.leave < 1 && (
        <g>
          <GuideArm from={{x: b.arm.x - 640, y: b.arm.y + 200}} to={b.arm}>
            <g transform={`translate(${b.arm.x + 10} ${b.arm.y}) scale(${1 + 0.08 * b.s})`}>
              <circle r={96} fill={C.shadow} cx={12} cy={14} />
              <circle r={92} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE + 1} />
              <circle r={60} fill={C.wood} stroke={C.ink} strokeWidth={5} />
              <circle r={22} fill={C.woodLight} stroke={C.ink} strokeWidth={4} />
            </g>
          </GuideArm>
        </g>
      )}
      <Burst x={STAMP_AT.x} y={STAMP_AT.y} t={(g - b.hit) / 10} r0={120} r1={190} n={9} color={C.ink} w={6} />
    </g>
  );
};
void digitPts; void LAYOUTS; void Plate; void H;
