// "Now imagine reaching into thin air and feeling the controls of your car." A conceptual application, drawn as one:
// a parked car (P on the display, a garage wall outside, nothing moving), the guesser in the driver's seat seen
// through the open driver's door, an ultrasonic array set into the centre console, and floating controls drawn as
// light-UI graphics tagged CONCEPT. The display graphics and the haptics are separate things: the controls are a
// projected picture; the touch on the fingertip comes from the console array's focused ultrasound (thin cyan arcs).
// The scene is a flat figure plane with a 2D camera (centre, zoom) and a parallax layer for the outside.
import React from 'react';
import {Man, ManPose, manJoints, GUESSER} from '../dc/Man';
import {HAND_RELAXED} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {PAL, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {ProfileArm, H_POINT, HPose, handGeo} from './hand';
import {BASE, EXN} from './cast';
import {T} from './timing';
import {keyS, ss, lerp, clamp} from '../lib';
import {CYAN, CYAN_HI, Focus, Pulse} from './fx';
import {V} from '../dc/math';
import {Conceptag} from './tags';

export const carActive = (t: number) => t >= T.now - 0.03 && t < T.without - 0.05;

const HAND_L = 96;
const SEAT: ManPose = {
  ...BASE, x: 330, y: 0, torso: -6, chest: 6, neck: 8, turn: 0.55, pelvis: 0,
  lHip: 86, lKnee: 82, lAnk: 6, rHip: 82, rKnee: 78, rAnk: 6, lFs: 1, lFsh: 1, rFs: 0.96, rFsh: 0.96,
  lW: 1, lWx: 286, lWy: 20, lElb: 1, lWr: 10, rElb: -1,
};
// the floating controls: a dial and a slider, above the console array, in front of his belly
export const DIAL = {x: -10, y: -96, r: 46};
const SLIDER = {x0: 70, x1: 190, y: -170};
const ARRAY = {x: 0, y: 26, w: 120};

type Cam2 = {x: number; y: number; z: number};
const camT = (c: Cam2, depth = 1) => {
  const z = 1 + (c.z - 1) / depth;
  return `translate(540 960) scale(${z.toFixed(4)}) translate(${(-c.x / depth - (540 - 540 / depth) * 0).toFixed(2)} ${(-c.y / depth).toFixed(2)})`;
};

/** the finger's path: arrives from the right (the match cut), touches the dial's rim and turns it */
const padAt = (t: number): {pad: V; pose: HPose; touch: number; ang: number} => {
  const a0 = -40, a1 = 70; // dial angles (deg, 0 = right, + clockwise on screen)
  const turn = keyS(t, [[T.controls - 0.05, 0], [T.car + 0.15, 1]]);
  const da = lerp(a0, a1, turn);
  const onDial = {x: DIAL.x + DIAL.r * Math.cos((da * Math.PI) / 180), y: DIAL.y + DIAL.r * Math.sin((da * Math.PI) / 180)};
  const start = {x: DIAL.x + 170, y: DIAL.y - 60};
  const hover = {x: onDial.x + 10, y: onDial.y - 18};
  const reach = ss(t, T.feeling - 0.2, T.controls);
  // the first 0.25 s carries the lab hand's leftward speed across the cut, then it eases to a hover
  const dt = t - (T.now - 0.03);
  const v0 = 105;
  const lin = Math.min(dt, 0.25);
  const mid = {x: start.x - v0 * 0.25, y: start.y};
  const e = 1 - Math.pow(1 - clamp((dt - 0.25) / 1.3), 3);
  let pad = dt < 0.25 ? {x: start.x - v0 * lin, y: start.y} : {x: lerp(mid.x, hover.x, e), y: lerp(mid.y, hover.y, e)};
  pad = {x: lerp(pad.x, onDial.x, reach), y: lerp(pad.y, onDial.y, reach)};
  // after the turn, the push toward the floating button (into the interface)
  const push = ss(t, T.or, T.pressing + 0.6);
  pad = {x: pad.x - 14 * push, y: pad.y + 4 * push};
  return {pad, pose: H_POINT, touch: reach, ang: 150};
};

export const carPadScreen = (t: number) => {
  const c = carCam(t);
  const {pad} = padAt(t);
  return {x: 540 + (pad.x - c.x) * c.z, y: 960 + (pad.y - c.y) * c.z, k: c.z};
};

// the camera: enters matched to the lab hand (set by Film), pulls back to reveal the car, then pushes through the
// interface into the fingertip
let ENTRY: {sx: number; sy: number; k: number} = {sx: 540, sy: 960, k: 5};
/** Film sets this from the lab camera at the cut, so the car opens with the hand where the lab left it */
export const setCarEntry = (e: {sx: number; sy: number; k: number}) => {
  ENTRY = e;
};
export const carCam = (t: number): Cam2 => {
  const t0 = T.now - 0.03;
  const p0 = padAtRaw(t0).pad;
  const pe = padAtRaw(T.without - 0.05).pad;
  // entry: the pad at the lab's screen point and scale; the camera then tracks the moving hand for 0.25 s
  const z0 = ENTRY.k;
  const ex = p0.x - (ENTRY.sx - 540) / z0, ey = p0.y - (ENTRY.sy - 960) / z0;
  const trackX = ex - 105 * Math.min(Math.max(0, t - t0), 0.25);
  const x = t < t0 + 0.25 ? trackX : keyS(t, [[t0 + 0.25, ex - 26], [T.reaching + 0.5, 120], [T.feeling, 110], [T.or, 90], [T.without - 0.05, pe.x - 2]]);
  const y = t < t0 + 0.25 ? ey : keyS(t, [[t0 + 0.25, ey], [T.reaching + 0.5, -160], [T.feeling, -150], [T.or, -140], [T.without - 0.05, pe.y - 4]]);
  const z = t < t0 + 0.25 ? z0 : keyS(t, [[t0 + 0.25, z0], [T.reaching + 0.5, 1.3], [T.feeling, 1.45], [T.or, 1.6], [T.without - 0.05, 9.5]]);
  return {x, y, z};
};
const padAtRaw = (t: number) => padAt(t);

export const CarView: React.FC<{t: number}> = ({t}) => {
  const c = carCam(t);
  const {pad, pose, touch, ang} = padAt(t);
  const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, pose);
  const W = {x: pad.x - g0.pad.x, y: pad.y - g0.pad.y};
  const man: ManPose = {...SEAT, rW: 1, rWx: W.x, rWy: W.y};
  const inkK = 6.2 / 7 / c.z;
  const ink = 7 * inkK * 0.72;
  const ui = ss(t, T.reaching + 0.2, T.feeling - 0.1);
  const ticks = [T.controls + 0.02, T.controls + 0.3, T.controls + 0.58, T.car + 0.05];
  const lastTick = ticks.filter((x) => t >= x).pop();
  const pulseAge = lastTick !== undefined ? t - lastTick : 99;
  const level = clamp(ticks.filter((x) => t >= x).length / ticks.length);
  const expr = mixExpr(EXN.wonder, EXN.delight, ss(t, T.controls, T.car));
  const farArm = (j: ReturnType<typeof manJoints>) => (
    <ProfileArm id="car-ra" f={{W, dir, L: HAND_L}} pose={pose} skin={shade(PAL.skin, 0.05)} ink={ink} limb={{S: j.R.S, E: j.R.E, rS: 29, rE: 23.5}} />
  );
  return (
    <g>
      {/* outside: a garage wall, static (the car is parked) */}
      <g transform={camT(c, 2.6)}>
        <rect x={-2400} y={-2400} width={4800} height={4800} fill="#3D5462" />
        <rect x={-2400} y={-420} width={4800} height={36} fill="#E2C14A" opacity={0.8} />
        {[-900, -100, 700, 1500].map((x, i) => (
          <rect key={i} x={x} y={-1400} width={140} height={2800} fill="#33495A" />
        ))}
        <rect x={-2400} y={260} width={4800} height={2000} fill="#2E4250" />
      </g>
      <g transform={camT(c)}>
        {/* far door panel and armrest */}
        <path d="M-520,-150 L900,-150 L900,420 L-520,420 Z" fill="#26313C" stroke={INK} strokeWidth={ink} />
        <path d="M80,-60 L620,-60 Q650,-60 650,-30 L650,-10 L80,-10 Z" fill="#33414E" stroke={INK} strokeWidth={ink * 0.8} />
        {/* roof, windshield and pillars */}
        <path d="M-900,-760 L1100,-760 L1100,-560 L60,-560 L-300,-200 L-900,-200 Z" fill="#1C252E" stroke={INK} strokeWidth={ink} />
        <path d="M60,-560 L-300,-200 L-270,-196 L90,-552 Z" fill="#3A4856" opacity={0.6} />
        <rect x={600} y={-560} width={48} height={420} fill="#1C252E" stroke={INK} strokeWidth={ink} />
        {/* seat: backrest, headrest, cushion */}
        <path d="M370,-330 Q400,-350 450,-330 L500,40 Q470,70 420,60 Z" fill="#2E3742" stroke={INK} strokeWidth={ink} />
        <rect x={378} y={-450} width={88} height={96} rx={34} fill="#2E3742" stroke={INK} strokeWidth={ink} />
        <path d="M120,10 Q300,-14 470,20 L470,80 Q300,70 130,74 Z" fill="#2A323C" stroke={INK} strokeWidth={ink} />
        {/* centre console with the ultrasonic array set into its top */}
        <path d="M-200,26 L280,26 L300,120 L-220,120 Z" fill="#303B47" stroke={INK} strokeWidth={ink} />
        <path d="M-200,26 L280,26 L272,8 L-192,8 Z" fill="#4A5866" stroke={INK} strokeWidth={ink} />
        <g>
          <path d={`M${ARRAY.x - ARRAY.w / 2},${ARRAY.y - 14} L${ARRAY.x + ARRAY.w / 2},${ARRAY.y - 14} L${ARRAY.x + ARRAY.w / 2 + 6},${ARRAY.y - 2} L${ARRAY.x - ARRAY.w / 2 - 6},${ARRAY.y - 2} Z`} fill="#16262E" stroke={INK} strokeWidth={ink * 0.7} />
          {Array.from({length: 3}).map((_, r) =>
            Array.from({length: 16}).map((__, i) => {
              const fx = (i - 7.5) / 16;
              const x = ARRAY.x + fx * (ARRAY.w - 10 + r * 4);
              const y = ARRAY.y - 11 + r * 3.6;
              const on = touch > 0.5 ? 0.35 + 0.65 * Math.max(0, Math.cos(2 * Math.PI * (t * 4.5 - Math.abs(fx) * 1.2))) : 0;
              return <ellipse key={`${r}-${i}`} cx={x} cy={y} rx={2.6} ry={1.1} fill={on > 0.05 ? CYAN : '#93A2AE'} opacity={on > 0.05 ? 0.5 + 0.5 * on : 1} />;
            }),
          )}
        </g>
        {/* dashboard and its wide display: parked */}
        <path d="M-900,-200 L-300,-200 Q-150,-196 -120,-120 L-110,-40 Q-140,-10 -220,0 L-900,0 Z" fill="#202A34" stroke={INK} strokeWidth={ink} />
        <path d="M-640,-196 L-250,-196 Q-190,-194 -176,-160 L-640,-160 Z" fill="#0E1820" stroke={INK} strokeWidth={ink * 0.8} />
        <text x={-560} y={-170} fontFamily="Nunito Variable, sans-serif" fontWeight={900} fontSize={24} fill="#7FE0A8">P</text>
        <text x={-520} y={-171} fontFamily="Nunito Variable, sans-serif" fontWeight={700} fontSize={14} fill="#7C93A6">PARKED</text>
        <rect x={-330} y={-186} width={52} height={14} rx={3} fill="none" stroke="#7C93A6" strokeWidth={2} />
        <rect x={-327} y={-183} width={34} height={8} rx={2} fill="#7FE0A8" />
        {/* steering column and wheel, seen edge-on, still */}
        <path d="M-150,-120 L-70,-170" stroke="#151D25" strokeWidth={22} strokeLinecap="round" />
        <ellipse cx={-60} cy={-196} rx={20} ry={96} transform="rotate(-24 -60 -196)" fill="none" stroke="#141B22" strokeWidth={20} />
        <ellipse cx={-60} cy={-196} rx={20} ry={96} transform="rotate(-24 -60 -196)" fill="none" stroke="#2C3742" strokeWidth={9} />
        {/* the guesser, seated; his right hand reaches over the console */}
        <Man id="car-man" pose={man} expr={expr} lHand={HAND_RELAXED} rHand={HAND_RELAXED} outfit={GUESSER} inkK={inkK} farArm={farArm} nearLegFront />
        {/* the focused ultrasound from the console array to the fingertip (haptics, cyan) */}
        {touch > 0.3 && (
          <g opacity={ss(touch, 0.3, 0.9)}>
            {[0, 1, 2, 3].map((k) => {
              const u = ((t * 1.8 + k / 4) % 1);
              const y0 = ARRAY.y - 12, y1 = pad.y + 2;
              const yy = lerp(y0, y1, u);
              const r = lerp(ARRAY.w / 2, 3, u);
              return <path key={k} d={`M${pad.x - r},${yy + r * 0.25} Q${pad.x},${yy - r * 0.18} ${pad.x + r},${yy + r * 0.25}`} fill="none" stroke={CYAN_HI} strokeWidth={2.4 / c.z * 1.4} opacity={0.55 * (1 - u * 0.4)} />;
            })}
            <Focus c={{x: pad.x, y: pad.y + 1}} r={Math.max(4, 22 / c.z)} a={0.75} id="car-fc" squash={0.6} />
            <Pulse c={{x: pad.x, y: pad.y + 1}} age={pulseAge} size={Math.max(12, 70 / c.z)} w={3 / c.z} dur={0.4} />
          </g>
        )}
        {/* floating controls: a light picture (concept) */}
        <g opacity={ui}>
          <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r + 10} fill="#BFE9FF" opacity={0.08} />
          <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r} fill="none" stroke="#E7F2FF" strokeWidth={3} opacity={0.85} />
          <path d={arcD(DIAL.x, DIAL.y, DIAL.r - 9, -220, -220 + 260 * (0.25 + 0.55 * level))} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
          {Array.from({length: 13}).map((_, i) => {
            const a = ((-220 + i * (260 / 12)) * Math.PI) / 180;
            return <line key={i} x1={DIAL.x + (DIAL.r + 5) * Math.cos(a)} y1={DIAL.y + (DIAL.r + 5) * Math.sin(a)} x2={DIAL.x + (DIAL.r + 11) * Math.cos(a)} y2={DIAL.y + (DIAL.r + 11) * Math.sin(a)} stroke="#E7F2FF" strokeWidth={2} opacity={0.7} />;
          })}
          <path d={`M${DIAL.x - 8},${DIAL.y - 8} L${DIAL.x - 2},${DIAL.y - 8} L${DIAL.x + 6},${DIAL.y - 15} L${DIAL.x + 6},${DIAL.y + 15} L${DIAL.x - 2},${DIAL.y + 8} L${DIAL.x - 8},${DIAL.y + 8} Z`} fill="#E7F2FF" opacity={0.9} />
          <line x1={SLIDER.x0} y1={SLIDER.y} x2={SLIDER.x1} y2={SLIDER.y} stroke="#E7F2FF" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
          <circle cx={lerp(SLIDER.x0, SLIDER.x1, 0.62)} cy={SLIDER.y} r={9} fill="none" stroke="#FFFFFF" strokeWidth={3} />
          <text x={SLIDER.x1 + 10} y={SLIDER.y + 6} fontFamily="Nunito Variable, sans-serif" fontWeight={800} fontSize={16} fill="#E7F2FF" opacity={0.8}>21°</text>
          <Conceptag x={DIAL.x + 64} y={DIAL.y + 60} label="CONCEPT" s={1.25 / Math.max(1, c.z / 1.45)} />
        </g>
      </g>
      {/* the near door sill frames the bottom of the cutaway */}
      <g transform={camT(c, 0.85)}>
        <path d="M-1200,250 L1400,250 L1400,1400 L-1200,1400 Z" fill="#2B4C7E" stroke={INK} strokeWidth={ink} />
        <path d="M-1200,262 L1400,262" stroke="#5C82B8" strokeWidth={6} />
      </g>
    </g>
  );
};

const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => ({x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180)});
  const s0 = p(a0), s1 = p(a1);
  return `M${s0.x.toFixed(2)},${s0.y.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${s1.x.toFixed(2)},${s1.y.toFixed(2)}`;
};
