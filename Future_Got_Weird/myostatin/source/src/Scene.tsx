// One frame (V6). The camera says which world we are in; worlds are drawn as depth layers through a pinhole dolly
// (a push-in moves near things more than far ones), softened by distance from the focus plane. The muscle world is
// nested inside the biceps' tissue reveal and inside the dish sample, and replaces its host once it fills the frame.
import React from 'react';
import {resetIds} from './core/ids';
import {P, pt} from './core/geo';
import {ss} from './lib';
import {Arm, Bench, Body, Dumbbell} from './art/person';
import {GymFloor, GymWall} from './art/gym';
import {FibreWorld} from './art/fibre';
import {Cow, Field, FieldFence, FieldGrass} from './art/cow';
import {BenchTop, Dish, LabBack, LabState, SAMPLE, SAMPLE_RX, SAMPLE_RY, Scientist} from './art/lab';
import {ARM_ROLL, Cam, EV, K_ARM, K_LAB, REVEAL_C, WCam, armAt, camAt, cowAt, dumbbellAt, fibreAt, inHook, insideUpper, personAt, sciAt, toMicro} from './story';
import {Captions} from './Captions';

const F = 3600;
const Layer: React.FC<{c: Cam; delta: number; focus?: number; min?: number; max?: number; children: React.ReactNode}> = ({c, delta, focus = 0, min = 0, max = 40, children}) => {
  const s0 = 1080 / c.w;
  const d = F / s0;
  const s = F / (d + delta);
  const coc = 0.3 * F * Math.abs(1 / (d + focus) - 1 / (d + delta));
  const b = Math.max(min, Math.min(max, coc));
  return (
    <div style={{position: 'absolute', inset: 0, filter: b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(540 960) scale(${s}) translate(${-c.x} ${-c.y})`}>{children}</g>
      </svg>
    </div>
  );
};
const corners = (c: Cam) => {
  const hw = c.w / 2, hh = (c.w * 16) / 9 / 2;
  return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => pt(c.x + sx * hw, c.y + sy * hh));
};
/** does a circle (world centre p, radius r) cover the whole frame for camera c? */
const covers = (c: Cam, p: P, r: number, ry = r) => corners(c).every((q) => ((q.x - p.x) / r) ** 2 + ((q.y - p.y) / ry) ** 2 < 0.97);

/** the muscle world, full frame (roll: the camera's roll, so it continues the arm's orientation after the reveal) */
const FibreOnly: React.FC<{t: number; c: Cam; roll?: number}> = ({t, c, roll = 0}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <rect x={0} y={0} width={1080} height={1920} fill="#2A0B1C" />
    <g transform={`translate(540 960) rotate(${(roll * 180) / Math.PI}) scale(${1080 / c.w}) translate(${-c.x} ${-c.y})`}>
      <FibreWorld s={fibreAt(t)} cam={c} margin={roll !== 0 ? 1.25 : 1} />
    </g>
  </svg>
);
const nestedFibre = (t: number, host: Cam, origin: P, k: number, a = 0) => (
  <g transform={`translate(${origin.x} ${origin.y}) rotate(${(a * 180) / Math.PI}) scale(${k})`}>
    <FibreWorld s={fibreAt(t)} cam={toMicro(host, origin, k, a)} margin={1.4} />
  </g>
);
const labState = (t: number): LabState => {
  const s = sciAt(t);
  return {t, press: s.press, drop: 0, dropY: 0, ripple: s.ripple, look: 0, dim: 0, glow: s.glow * (1 - ss(t, EV.labIn0, EV.labIn0 + 0.22))};
};

const ArmWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const p = personAt(t);
  const a = p.arm;
  const db = dumbbellAt(t, a);
  const inReveal = a.reveal ? nestedFibre(t, c, REVEAL_C, K_ARM, ARM_ROLL) : undefined;
  return (
    <>
      <Layer c={c} delta={420} min={8}>
        <GymWall dim={0} />
      </Layer>
      <Layer c={c} delta={0} max={30}>
        <GymFloor />
        <Bench x0={-82} x1={4} top={-34} />
        <Body p={p} />
        <g>
          <ellipse cx={db.x} cy={0.6} rx={22 - 0.8 * Math.max(0, -db.y - 18)} ry={2.2} fill="#000" opacity={0.55 - 0.08 * Math.max(0, -db.y - 18)} />
          <Dumbbell h={db} />
        </g>
        <Arm a={a} inReveal={inReveal} />
      </Layer>
    </>
  );
};
const CowWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => (
  <>
    <Layer c={c} delta={420} min={2}>
      <Field />
    </Layer>
    <Layer c={c} delta={140} min={1}>
      <g transform="translate(0 -40)"><FieldFence /></g>
    </Layer>
    <Layer c={c} delta={0} max={16}>
      <rect x={-1200} y={-6} width={2400} height={600} fill="#6FA34B" />
      <FieldGrass />
      <Cow c={cowAt(t)} />
    </Layer>
  </>
);
const LabWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const sc = sciAt(t);
  const s = labState(t);
  return (
    <>
      <Layer c={c} delta={140} min={4}>
        <LabBack s={s} />
      </Layer>
      <Layer c={c} delta={0} max={24}>
        <Scientist s={sc} layer="back" />
        <BenchTop />
        <Dish s={s} inSample={nestedFibre(t, c, SAMPLE, K_LAB)} />
        <Scientist s={sc} layer="front" />
      </Layer>
    </>
  );
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const wc: WCam = camAt(t);
  const c: Cam = {x: wc.x, y: wc.y, w: wc.w};
  let body: React.ReactNode;
  if (wc.world === 'fibre') body = <FibreOnly t={t} c={c} roll={wc.roll ?? 0} />;
  else if (wc.world === 'match') {
    body = (
      <>
        <FibreOnly t={t} c={c} />
        <div style={{position: 'absolute', inset: 0, opacity: wc.mix ?? 0}}>
          <CowWorld t={t} c={wc.cam2!} />
        </div>
      </>
    );
  } else if (wc.world === 'arm') {
    const a = armAt(t);
    if (inHook(t) && a.reveal && covers(c, a.reveal.c, a.reveal.r * 0.6) && corners(c).every((q) => insideUpper(a, q))) {
      body = <FibreOnly t={t} c={toMicro(c, REVEAL_C, K_ARM, ARM_ROLL)} roll={ARM_ROLL} />;
    } else body = <ArmWorld t={t} c={c} />;
  } else if (wc.world === 'cow') body = <CowWorld t={t} c={c} />;
  else {
    if (covers(c, SAMPLE, SAMPLE_RX, SAMPLE_RY)) body = <FibreOnly t={t} c={toMicro(c, SAMPLE, K_LAB)} />;
    else body = <LabWorld t={t} c={c} />;
  }
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.05) saturate(1.06)'}}>
      {body}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 55%, rgba(4,4,10,0.42) 100%)'}} />
      {captions && <Captions t={t} />}
    </div>
  );
};
