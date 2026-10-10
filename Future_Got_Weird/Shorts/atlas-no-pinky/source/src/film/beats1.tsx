import React from 'react';
import {EV} from '../cues';
import {C, F, H, W, RH, SURF, Plate, Headline, Burst, Shadow, E, kf, tw, lerp, clamp01, capW} from './common';
import {Hand, HandPose, ikDigit, defOf, toLocal, toWorld, digitPts, V, Place, LAYOUTS, tipWorld} from '../hand/Hand';
import {sp, SNAP, SOFT, FIRM, ring, impact, strike, drift} from '../lib/motion';
import {TapeBand, Card, Dial, Mug, Knob} from './props';

/* ------------------------------------------------------------------ front-view robot poses */

/** c = curl toward viewer per digit [thumb, index, middle, ring] (0..1); spread = splay; thumbSwing 0 folded .. 1 open. */
export const frontPose = (c: [number, number, number, number], spread = 0.2, thumbSwing = 1): HandPose => {
  const fl = (v: number, k: number[]) => k.map((a) => a * v) as [number, number, number];
  return {
    thumb: {ang: [lerp(-72, -150, thumbSwing), lerp(-68, -146, thumbSwing), lerp(-64, -140, thumbSwing)], flex: fl(c[0], [26, 30, 26])},
    index: {ang: [-96 - spread * 14, -94 - spread * 14, -92 - spread * 14], flex: fl(c[1], [48, 44, 34])},
    middle: {ang: [-90, -90, -90], flex: fl(c[2], [48, 44, 34])},
    ring: {ang: [-84 + spread * 14, -86 + spread * 14, -88 + spread * 14], flex: fl(c[3], [48, 44, 34])},
  };
};
export const OPEN_POSE = frontPose([0, 0, 0, 0], 0.2, 1);

export const poseB01 = (g: number): HandPose => {
  const o = kf(g, [[0, 0.5, E.linear], [8, 1.07, E.out], [15, 1.0, E.inOut]]);
  const c = Math.max(0, 1 - o);
  const sw = kf(g, [[0, 0.35, E.linear], [8, 1.0, E.out]]);
  return frontPose([c, c, c, c], 0.2 + Math.max(0, o - 1) * 2.2, sw);
};

const GAP = {x: RH.x + 140 * RH.s, y: RH.y - 106 * RH.s};

/* ------------------------------------------------------------------ B01 */

export const B01World: React.FC<{g: number}> = ({g}) => {
  const pose = poseB01(g);
  const ghost = tw(g, 12, 10) * 0.95;
  const pop = sp(g, EV['B01.gap.marker'], SNAP);
  const pls = ring(g, EV['B01.gap.pulse'], 0.7, 0.16);
  const hit = EV['B01.hand.splay_contact'];
  return (
    <g>
      <Hand x={RH.x} y={RH.y} scale={RH.s} pose={pose} forearm={{stand: SURF}} ghostPinky={ghost} pulse={clamp01(1 - (g - hit) / 5) * (g >= hit ? 1 : 0)} />
      {pop > 0.01 && (
        <g transform={`translate(${GAP.x} ${GAP.y}) scale(${pop * (1 + 0.07 * pls)})`}>
          <circle r={92} fill="none" stroke={C.coral} strokeWidth={10} strokeDasharray="22 16" strokeLinecap="round" />
        </g>
      )}
      <Burst x={RH.x - 232 * RH.s * 0.62 + 0} y={RH.y - 60} t={(g - hit) / 9} r0={40} r1={86} n={6} color={C.ink} w={6} rot={20} />
    </g>
  );
};

export const B01Hud: React.FC<{g: number}> = ({g}) => {
  const swap = EV['B01.label.purpose'];
  const a = sp(g + 4, 0, SNAP);
  const out = tw(g, swap - 4, 4, E.in);
  const inn = sp(g, swap, SNAP);
  return (
    <g>
      {g < swap && <Headline y={330} text="NO PINKY?" size={132} sx={a} sy={a * (1 - out)} />}
      {g >= swap && <Plate x={500} y={330} text="ON PURPOSE." size={96} fill={C.coral} sx={1} sy={Math.max(0.001, inn)} />}
    </g>
  );
};

/* ------------------------------------------------------------------ B02: taped human hand (illustrative) */

export const HH: Place = {x: 560, y: 850, scale: 1.25};
const tapeT = (g: number) => tw(g, EV['B02.tape.contact'], 8);

const wig = (g: number, a: number) => (g < a || g > a + 14 ? 0 : Math.sin(((g - a) / 14) * Math.PI));
const humanFront = (g: number): HandPose => {
  const t = tapeT(g);
  const w = drift(g, 3, 70);
  const fl = (a: number): [number, number, number] => [26 * wig(g, a), 22 * wig(g, a), 14 * wig(g, a)];
  return {
    thumb: {ang: [-150 + w * 2, -146, -140], flex: [10 * wig(g, 112), 8 * wig(g, 112), 0]},
    index: {ang: [-98 + w, -96, -94], flex: fl(118)},
    middle: {ang: [-92, -92, -92], flex: fl(124)},
    ring: {ang: [lerp(-82, -80, t), lerp(-82, -80, t), lerp(-84, -82, t)], flex: fl(130)},
    pinky: {ang: [lerp(-66, -80, t), lerp(-66, -80, t), lerp(-66, -80, t)], flex: fl(136)},
  };
};

/** Tape band across ring + pinky, in hand-local coords (works for both views). */
export const bandOf = (view: 'front' | 'side', pose: HandPose) => {
  const lay = LAYOUTS[`human-${view}`];
  const P = (n: 'ring' | 'pinky') => {
    const pts = digitPts(lay.digits[n]!, pose[n] ?? lay.rest[n]);
    return {x: lerp(pts[0].x, pts[1].x, 0.62), y: lerp(pts[0].y, pts[1].y, 0.62)};
  };
  const a = P('ring'), b = P('pinky');
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (view === 'side') {
    const rp = digitPts(lay.digits.ring!, pose.ring ?? lay.rest.ring);
    const th = (Math.atan2(rp[1].y - rp[0].y, rp[1].x - rp[0].x) * 180) / Math.PI;
    return {cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, len: d + 56, rot: th + 90};
  }
  return {cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, len: d + 50, rot: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI};
};

/** side-view human grip IK: four fingertips hooked on a vertical bar at (hx, hy); open 0..1 releases it */
export const humanGrip = (pl: Place, hx: number, hy: number, open: number): HandPose => {
  const L = (x: number, y: number) => toLocal(x, y, pl.x, pl.y, pl.scale);
  const d = (n: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky') => defOf('human', 'side', n)!;
  const names = ['index', 'middle', 'ring', 'pinky'] as const;
  const pose: HandPose = {};
  names.forEach((n, i) => {
    pose[n] = ikDigit(d(n), L(hx - open * 62, hy + (i - 1.5) * 25 - open * (14 + i * 3)), lerp(96, 28, open), -1);
  });
  pose.thumb = ikDigit(d('thumb'), L(hx - 6 - open * 40, hy - 64 - open * 10), -32, 1);
  return pose;
};

const MUG0 = {x: 450, y: SURF - 54};
const KNOB0 = {x: 700, y: SURF - 28};
const GRIP_DX = -267; // palm centre relative to the bar it grips (side-view hand, scale 1.15)
export const b02 = (g: number) => {
  const lift = E.inOut(tw(g, 184, 14)) - E.in(tw(g, 198, 9));
  const mugY = MUG0.y - 118 * lift;
  const mugBarX = MUG0.x - 106;
  const knobBarX = KNOB0.x - 24;
  const inX = lerp(mugBarX + GRIP_DX - 420, mugBarX + GRIP_DX, E.out(tw(g, 169, 11)));
  const toKnob = E.inOut(tw(g, 211, 9));
  const back = E.inOut(tw(g, 226, 14));
  const px = g < 211 ? inX : lerp(mugBarX + GRIP_DX, knobBarX + GRIP_DX, toKnob) - 80 * back;
  const py = lerp(mugY - 12, KNOB0.y - 40, g < 211 ? 0 : toKnob);
  const grabMug = 1 - kf(g, [[169, 1, E.linear], [EV['B02.cup.grasp'] + 2, 0, E.out], [EV['B02.cup.contact'] + 2, 0, E.linear], [EV['B02.cup.contact'] + 8, 1, E.out]]);
  const grabKnob = 1 - kf(g, [[211, 1, E.linear], [221, 0, E.out], [226, 0, E.linear], [231, 1, E.out]]);
  const turn = g >= 218 ? 62 * E.out(tw(g, 218, 6)) : 0;
  return {mugY, px, py, grabMug, grabKnob, turn, mugBarX, knobBarX};
};

export const B02World: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['B02.tape.contact'];
  const exit = 1500 * E.in(tw(g, 243, 8));
  const sideIn = g >= 170;
  const frontOut = E.in(tw(g, 163, 8));
  const a = b02(g);
  const hp: Place = {x: a.px, y: a.py, scale: 1.15};
  const openAmt = g < 211 ? a.grabMug : a.grabKnob;
  const hx = g < 211 ? a.mugBarX : a.knobBarX + 8 * Math.sin((a.turn * Math.PI) / 180);
  const hy = g < 211 ? a.mugY - 3 : KNOB0.y - 28;
  const pose = humanGrip(hp, hx, hy, clamp01(openAmt));
  const side = bandOf('side', pose);
  const wrapT = clamp01((g - t0) / 8);
  // tape strip pulled in from the right, then torn
  const fb = bandOf('front', humanFront(g));
  const bw = toWorld({x: fb.cx, y: fb.cy}, HH.x, HH.y, HH.scale);
  const stripT = tw(g, t0 - 8, 8, E.out);
  const tear = tw(g, t0 + 2, 9, E.in);
  const hand2 = humanFront(g);
  void H;
  return (
    <g transform={`translate(${exit} 0)`}>
      {/* day dial on the wall */}
      <Dial x={820} y={500} angle={30 * E.back(tw(g, EV['B02.day.dial'], 7))} kick={7 * ring(g, EV['B02.day.dial'], 1.1, 0.25)} />
      {/* front-view human hand (tape experiment), then it drops behind the bench as the side-view hand takes over */}
      {frontOut < 1 && (
        <g transform={`translate(0 ${frontOut * 460}) translate(0 ${SURF}) scale(1 ${0.25 + 0.75 * sp(g, 100, SOFT)}) translate(0 ${-SURF})`}>
          <Hand kind="human" x={HH.x} y={HH.y} scale={HH.scale} pose={hand2} forearm={{stand: SURF}}
            front={wrapT > 0.3 ? <TapeBand cx={fb.cx} cy={fb.cy} len={fb.len} h={50} rot={fb.rot} /> : null} />
          {stripT > 0 && tear < 1 && (
            <g>
              <path
                d={`M ${bw.x} ${bw.y} Q ${lerp(W + 40, bw.x + 160, stripT)} ${bw.y + 90 * (1 - stripT)} ${lerp(W + 140, bw.x + 330 - tear * 80, stripT)} ${bw.y - 80 + tear * 120}`}
                fill="none" stroke={C.ink} strokeWidth={54} strokeLinecap="round" opacity={1 - tear}
              />
              <path
                d={`M ${bw.x} ${bw.y} Q ${lerp(W + 40, bw.x + 160, stripT)} ${bw.y + 90 * (1 - stripT)} ${lerp(W + 140, bw.x + 330 - tear * 80, stripT)} ${bw.y - 80 + tear * 120}`}
                fill="none" stroke={C.blue} strokeWidth={44} strokeLinecap="round" opacity={1 - tear}
              />
            </g>
          )}
          <Burst x={bw.x} y={bw.y} t={(g - t0) / 10} r0={40} r1={90} n={7} color={C.ink} w={5} />
        </g>
      )}
      {sideIn && (
        <g>
          <Shadow x={MUG0.x} rx={96} />
          <Mug x={MUG0.x} y={a.mugY} />
          <Knob x={KNOB0.x} y={KNOB0.y} turn={a.turn} />
          <Shadow x={KNOB0.x} y={KNOB0.y + 58} rx={90} />
          <Hand kind="human" view="side" x={hp.x} y={hp.y} scale={hp.scale} pose={pose} forearm={{to: {x: -160, y: hp.y + 70}}}
            front={<TapeBand cx={side.cx} cy={side.cy} len={side.len} h={46} rot={side.rot} />} />
        </g>
      )}
    </g>
  );
};

export const B02Hud: React.FC<{g: number}> = ({g}) => {
  const t = EV['B02.label.day'];
  const a = sp(g, t, SNAP);
  const out = tw(g, 241, 5, E.in);
  return <g>{g >= t && <Headline y={330} text="ONE DAY" size={132} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}</g>;
};

/* ------------------------------------------------------------------ B03: verdict */

export const b03 = (g: number) => {
  const hit = EV['B03.verdict.stamp'];
  const cardX = lerp(30, 430, E.out(tw(g, 243, 13)));
  const up = E.inOut(tw(g, 284, 14));
  const fall = E.in(tw(g, 301, 8));
  const s = strike(g, hit, 8, 3, 3, 9);
  const arrive = E.inOut(tw(g, 246, 16));
  const away = E.inOut(tw(g, 291, 9));
  const hx = lerp(lerp(300, 430, arrive), 330, away);
  const hy = lerp(lerp(960, 872, arrive), 900, away) + (g >= 262 && g < 291 ? (981 - 872) * s : 0);
  const yb = 1140 + fall * 420;
  const topY = yb - 270 * (0.34 + 0.66 * up);
  return {cardX, up, yb, topY, hx, hy, hit, s, fall, hasStamp: g >= 244 && g < 298};
};

export const B03World: React.FC<{g: number}> = ({g}) => {
  const b = b03(g);
  const rise = sp(g, 245, SOFT);
  const sy = 0.14 + 0.86 * rise;
  const imprint = g >= b.hit;
  const squash = 1 - 0.1 * clamp01(1 - (g - b.hit) / 6) * (imprint ? 1 : 0);
  const printK = sp(g, b.hit, SNAP);
  return (
    <g>
      <g transform={`translate(0 ${SURF}) scale(1 ${sy}) translate(0 ${-SURF})`}>
        <Hand x={RH.x} y={RH.y} scale={RH.s} pose={OPEN_POSE} forearm={{stand: SURF}} />
      </g>
      <g opacity={1 - b.fall}>
        <Card x={b.cardX} yb={b.yb} up={b.up} squash={squash}>
          {imprint && (
            <g transform={`translate(0 135) scale(${1 + 0.18 * (1 - printK)})`}>
              <rect x={-190} y={-58} width={380} height={116} rx={16} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE4} />
              <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={84} fill={C.ink}>
                SKIP IT
              </text>
            </g>
          )}
        </Card>
      </g>
      <Burst x={b.cardX} y={1080} t={(g - b.hit) / 10} r0={150} r1={230} n={9} color={C.ink} w={5} />
    </g>
  );
};
const OUTLINE4 = 5;
