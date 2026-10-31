// One frame. The camera says which world we are in; each world is drawn as depth layers through a pinhole dolly
// (scale F/(d+delta): a push-in moves near things more than far ones) softened by distance from the focus plane.
// A nested world (the muscle inside a cutaway, the bull's shoulder, the dish sample) is drawn inside its window in the
// host's subject layer, and replaces the host only once that window covers the whole frame.
import React from 'react';
import {resetIds} from './core/ids';
import {P, pt} from './core/geo';
import {clamp, lerp, ss} from './lib';
import {Arm, Bench, Body, Dumbbell} from './art/person';
import {GymFloor, GymWall} from './art/gym';
import {MicroWorld} from './art/micro';
import {Bull, Dust, Fence, Grass, PastureSky} from './art/bull';
import {BenchTop, Dish, LabBack, LabState, SAMPLE, SAMPLE_RX, SAMPLE_RY, Scientist} from './art/lab';
import {Cam} from './art/micro';
import {ARM_NEST, BULL_NEST, BULL_SHIFT, EV, K_ARM, K_ARMX, K_BULLM, K_LAB, T, WCam, armAt, bullAt, camAt, dumbbellAt, hookWindow, inHook, microAt, microVariant, personAt, sciAt, toMicro, yawAt} from './story';
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
  // the depth layers live in the human muscle's coordinates, so they run on unbroken through the tissue crossing
  const cd = microVariant(t) === 'bull' ? {...c, y: c.y + BULL_SHIFT} : c;
  const g = (k: number, cc: Cam = c) => `translate(540 960) scale(${(1080 / cc.w) * k}) translate(${-cc.x} ${-cc.y})`;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#2A0A17'}} />
      <div style={{position: 'absolute', inset: 0, filter: 'blur(5px)', opacity: depthOp}}>
        <svg width={1080} height={1920}><g transform={g(kF, cd)}><FarFibres cam={{...cd, w: cd.w / kF}} t={t} /></g></svg>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={g(1)}>
          <MicroWorld s={ms} cam={c} bg={depthOp < 0.99} />
        </g>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: 'blur(14px)', opacity: 0.75 * depthOp}}>
        <svg width={1080} height={1920}><g transform={g(kN, cd)}><NearFibres cam={{...cd, w: cd.w / kN}} t={t} /></g></svg>
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
        {th < 0.55 ? <Bundle3D b={b} cam={c} /> : (
          <g>
            <rect x={c.x - c.w} y={c.y - c.w * 1.8} width={c.w * 2} height={c.w * 3.6} fill="#2A0A17" />
            <CrossSection b={b} cam={c} surround={ss(th, 0.55, 1)} />
          </g>
        )}
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

const nestedCross = (t: number, host: Cam, origin: P, k: number) => {
  const ms = microAt(t);
  return (
    <g transform={`translate(${origin.x} ${origin.y}) scale(${k})`}>
      <CrossSection cam={toMicro(host, origin, k)} b={{theta: 1, g: ms.g, gN: ms.gN, t}} />
    </g>
  );
};
const labState = (t: number): LabState => {
  const s = sciAt(t);
  return {t, press: s.press, drop: 0, dropY: 0, ripple: s.ripple, look: 0, dim: 0, glow: s.glow * (1 - ss(t, EV.labIn0, EV.labIn0 + 0.22))};
};

const ArmWorld: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const p = personAt(t);
  const a = p.arm;
  const hook = inHook(t);
  const Wc = hookWindow();
  const db = dumbbellAt(t, a);
  // the bench and the weight stay in the world at the end (the camera leaves them below frame before the loop)
  const props = !hook || t > EV.slump0;
  const dim = ss(t, T.weird - 0.15, T.weird + 0.2) * (1 - ss(t, T.bigger2 + 0.4, T.bigger2 + 1.2)) * 0.6;
  const inCut = a.cut ? (hook ? nestedMicro(t, c, Wc, K_ARM) : nestedCross(t, c, ARM_NEST, K_ARMX)) : undefined;
  return (
    <>
      <Layer c={c} delta={420} min={t > EV.raise0 - 0.05 ? lerp(6, 14, ss(t, EV.raise0, EV.raise1)) : hook ? 14 : 6}>
        <GymWall dim={dim} />
      </Layer>
      <Layer c={c} delta={0} max={30}>
        <GymFloor />
        {props && <Bench x0={-82} x1={4} top={-34} />}
        <Body p={p} />
        {props && (
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
        {b.cut && (() => {
          const O = pt(BULL_NEST.x + b.x, BULL_NEST.y);
          const id = `bcut${Math.round(t * 30)}`;
          return (
            <g>
              <defs>
                <clipPath id={id}>
                  <circle cx={O.x} cy={O.y} r={b.cut.r} />
                </clipPath>
              </defs>
              <circle cx={O.x} cy={O.y} r={b.cut.r + 0.9} fill="#E9C9C4" opacity={0.95} />
              <g clipPath={`url(#${id})`}>{nestedMicro(t, c, O, K_BULLM)}</g>
              <circle cx={O.x} cy={O.y} r={b.cut.r + 0.3} fill="none" stroke="rgba(255,210,220,0.9)" strokeWidth={0.7} />
            </g>
          );
        })()}
        <Dust p={pt(64 + b.x, 0)} a={(t - EV.shift) / 0.6} />
      </Layer>
      {an > 0.01 && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(6,20,40,0.15) 30%, rgba(4,12,28,0.75) 100%)', opacity: an}} />}
    </>
  );
};
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
        <Dish s={s} inSample={nestedMicro(t, c, SAMPLE, K_LAB)} />
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
  if (wc.world === 'micro') body = <MicroOnly t={t} c={c} />;
  else if (wc.world === 'cross') body = <CrossOnly t={t} c={c} />;
  else if (wc.world === 'arm') {
    const a = armAt(t);
    const Wc = hookWindow();
    if (inHook(t) && a.cut && covers(c, Wc, a.cut.r)) body = <MicroOnly t={t} c={toMicro(c, Wc, K_ARM)} />;
    else if (!inHook(t) && a.cut && covers(c, ARM_NEST, a.cut.r)) body = <CrossOnly t={t} c={toMicro(c, ARM_NEST, K_ARMX)} />;
    else body = <ArmWorld t={t} c={c} />;
  } else if (wc.world === 'bull') {
    const b = bullAt(t);
    const O = pt(BULL_NEST.x + b.x, BULL_NEST.y);
    if (b.cut && covers(c, O, b.cut.r)) body = <MicroOnly t={t} c={toMicro(c, O, K_BULLM)} />;
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
