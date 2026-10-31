// One frame. The camera says which world we are in; each world is drawn as depth layers through a pinhole dolly
// (scale F/(d+delta): a push-in moves near things more than far ones) softened by distance from the focus plane.
// A nested world (the muscle inside a cutaway, the bull's shoulder, the dish sample) is drawn inside its window in the
// host's subject layer, and replaces the host only once that window covers the whole frame.
import React from 'react';
import {resetIds} from './core/ids';
import {P, pt} from './core/geo';
import {clamp, ss} from './lib';
import {Arm, Bench, Body, Dumbbell} from './art/person';
import {GymFloor, GymWall} from './art/gym';
import {CollagenSheet, MicroWorld} from './art/micro';
import {Bull, Dust, Fence, Grass, PastureSky} from './art/bull';
import {BenchTop, Dish, LabBack, Researcher, SAMPLE, SAMPLE_RX, SAMPLE_RY} from './art/lab';
import {Cam} from './art/micro';
import {COW_NEST, EV, K_ARM, K_COW, K_LAB, T, WCam, armAt, bullAt, camAt, dumbbellAt, hookWindow, inHook, labAt, microAt, personAt, toMicro, yawAt} from './story';
import {Bundle3D, CrossSection, FarFibres, NearFibres} from './art/micro3d';
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
/** does a circle (world centre p, radius r) cover the whole frame for camera c? */
const covers = (c: Cam, p: P, r: number, ry = r) => {
  const hw = c.w / 2, hh = (c.w * 16) / 9 / 2;
  return [[-1, -1], [1, -1], [-1, 1], [1, 1]].every(([sx, sy]) => {
    const dx = c.x + sx * hw - p.x, dy = c.y + sy * hh - p.y;
    return (dx / r) ** 2 + (dy / ry) ** 2 < 0.97;
  });
};

const MicroOnly: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const ms = microAt(t);
  // depth: a far layer of fibres seen through the gaps, and soft near fibres passing the lens (fade in after a dive)
  const depthOp = t < EV.dive1 + 0.35 ? ss(t, EV.dive1, EV.dive1 + 0.35) : t > EV.labIn1 - 0.05 && t < EV.labIn1 + 0.3 ? ss(t, EV.labIn1, EV.labIn1 + 0.3) : 1;
  const kF = 0.6, kN = 1.7;
  const g = (k: number) => `translate(540 960) scale(${(1080 / c.w) * k}) translate(${-c.x} ${-c.y})`;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#2A0A17'}} />
      <div style={{position: 'absolute', inset: 0, filter: 'blur(5px)', opacity: depthOp}}>
        <svg width={1080} height={1920}><g transform={g(kF)}><FarFibres cam={{...c, w: c.w / kF}} t={t} /></g></svg>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={g(1)}>
          <MicroWorld s={ms} cam={c} bg={depthOp < 0.99} />
        </g>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: 'blur(14px)', opacity: 0.75 * depthOp}}>
        <svg width={1080} height={1920}><g transform={g(kN)}><NearFibres cam={{...c, w: c.w / kN}} t={t} /></g></svg>
      </div>
    </>
  );
};
const CrossOnly: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const ms = microAt(t);
  const th = yawAt(t);
  const b = {theta: th, g: ms.g, gN: ms.gN, t};
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(540 960) scale(${1080 / c.w}) translate(${-c.x} ${-c.y})`}>
        {th < 0.999 ? <Bundle3D b={b} cam={c} /> : <CrossSection b={b} cam={c} />}
      </g>
    </svg>
  );
};
const nestedMicro = (t: number, host: Cam, origin: P, k: number) => {
  const mc = toMicro(host, origin, k);
  return (
    <g transform={`translate(${origin.x} ${origin.y}) scale(${k})`}>
      <MicroWorld s={microAt(t)} cam={mc} />
    </g>
  );
};

const ArmWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const p = personAt(t);
  const a = p.arm;
  const hook = inHook(t);
  const Wc = hookWindow();
  const db = dumbbellAt(t, a);
  const dim = ss(t, T.weird - 0.15, T.weird + 0.2) * (1 - ss(t, T.bigger2 + 0.4, T.bigger2 + 1.2)) * 0.6;
  const inCut = hook && a.cut ? nestedMicro(t, c, Wc, K_ARM) : undefined;
  return (
    <>
      <Layer c={c} delta={420} min={hook ? 14 : 6}>
        <GymWall dim={dim} />
      </Layer>
      <Layer c={c} delta={0} max={30}>
        <GymFloor />
        {!hook && <Bench x0={-82} x1={4} top={-34} />}
        <Body p={p} />
        {!hook && (
          <g>
            <ellipse cx={db.x} cy={0.6} rx={22 - 0.8 * Math.max(0, -db.y - 18)} ry={2.2} fill="#000" opacity={0.55 - 0.08 * Math.max(0, -db.y - 18)} />
            <Dumbbell h={db} />
          </g>
        )}
        <Arm a={a} inCut={inCut} />
      </Layer>
      {dim > 0 && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(40,70,120,0) 30%, rgba(4,10,30,0.7) 100%)', opacity: dim}} />}
    </>
  );
};
const BullWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const b = {...bullAt(t), view: clamp((4 - c.x) / 54)};
  const an = b.anat ?? 0;
  return (
    <>
      <Layer c={c} delta={2600} min={3}>
        <PastureSky />
      </Layer>
      <Layer c={c} delta={160} min={1.5}>
        <g transform="translate(0 -30)"><Fence /></g>
      </Layer>
      <Layer c={c} delta={0} max={20}>
        <Grass />
        <Bull b={b} />
        {b.cut && (
          <g>
            <defs>
              <clipPath id={`bcut${Math.round(t * 30)}`}>
                <circle cx={COW_NEST.x + b.x} cy={COW_NEST.y} r={b.cut.r} />
              </clipPath>
            </defs>
            <circle cx={COW_NEST.x + b.x} cy={COW_NEST.y} r={b.cut.r + 0.9} fill="#F3ECEE" opacity={0.9} />
            <g clipPath={`url(#bcut${Math.round(t * 30)})`}>
              <g transform={`translate(${COW_NEST.x + b.x} ${COW_NEST.y}) scale(${K_COW})`}>
                <CrossSection cam={toMicro(c, pt(COW_NEST.x + b.x, COW_NEST.y), K_COW)} b={{theta: 1, g: microAt(t).g, gN: microAt(t).gN, t}} />
              </g>
            </g>
            <circle cx={COW_NEST.x + b.x} cy={COW_NEST.y} r={b.cut.r + 0.3} fill="none" stroke="rgba(255,210,220,0.9)" strokeWidth={0.7} />
          </g>
        )}
        <Dust p={pt(64 + b.x, 0)} a={(t - EV.plant) / 0.6} />
      </Layer>
      {an > 0.01 && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(6,20,40,0.15) 30%, rgba(4,12,28,0.75) 100%)', opacity: an}} />}
    </>
  );
};
const LabWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const s = labAt(t);
  return (
    <>
      <Layer c={c} delta={140} min={4}>
        <LabBack s={s} />
      </Layer>
      <Layer c={c} delta={0} max={24}>
        <Researcher s={s} />
        <BenchTop />
        <Dish s={s} inSample={nestedMicro(t, c, SAMPLE, K_LAB)} />
      </Layer>
    </>
  );
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const wc: WCam = camAt(t);
  const c: Cam = {x: wc.x, y: wc.y, w: wc.w};
  let body: React.ReactNode;
  if (wc.world === 'micro') body = <MicroOnly t={t} c={c} />;
  else if (wc.world === 'cross') body = <CrossOnly t={t} c={c} />;
  else if (wc.world === 'arm') {
    const a = armAt(t);
    const Wc = hookWindow();
    if (inHook(t) && a.cut && covers(c, Wc, a.cut.r)) body = <MicroOnly t={t} c={toMicro(c, Wc, K_ARM)} />;
    else body = <ArmWorld t={t} c={c} />;
  } else if (wc.world === 'bull') {
    const b = bullAt(t);
    const O = pt(COW_NEST.x + b.x, COW_NEST.y);
    if (b.cut && covers(c, O, b.cut.r)) body = <CrossOnly t={Math.max(t, EV.yaw1)} c={toMicro(c, O, K_COW)} />;
    else body = <BullWorld t={t} c={c} />;
  } else {
    if (covers(c, SAMPLE, SAMPLE_RX, SAMPLE_RY)) body = <MicroOnly t={t} c={toMicro(c, SAMPLE, K_LAB)} />;
    else body = <LabWorld t={t} c={c} />;
  }
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.06) saturate(1.08)'}}>
      {body}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(4,4,10,0.5) 100%)'}} />
      {captions && <Captions t={t} />}
    </div>
  );
};
