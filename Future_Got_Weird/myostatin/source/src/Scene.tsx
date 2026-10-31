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
import {EV, K_ARM, K_LAB, T, WCam, armAt, bullAt, camAt, dumbbellAt, hookWindow, inHook, labAt, microAt, personAt, toMicro} from './story';
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
  const sheetU = t > EV.wipe1 - 0.05 && t < EV.wipe1End + 0.05 ? (t - EV.wipe1) / (EV.wipe1End - EV.wipe1) : t > EV.wipe2 - 0.05 && t < EV.wipe2End + 0.05 ? (t - EV.wipe2) / (EV.wipe2End - EV.wipe2) : undefined;
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={`translate(540 960) scale(${1080 / c.w}) translate(${-c.x} ${-c.y})`}>
          <MicroWorld s={ms} cam={c} />
        </g>
      </svg>
      {sheetU !== undefined && (
        <div style={{position: 'absolute', inset: 0, filter: 'blur(6px)'}}>
          <svg width={1080} height={1920}>
            <CollagenSheet y={1.45 - 2.9 * clamp(sheetU)} />
          </svg>
        </div>
      )}
    </>
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
  const dim = ss(t, T.weird - 0.15, T.weird + 0.2) * (1 - ss(t, T.bigger2 + 0.4, T.bigger2 + 1.2)) * 0.6 + 0.55 * a.xray * (hook ? 1 : 0);
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
  else if (wc.world === 'arm') {
    const a = armAt(t);
    const Wc = hookWindow();
    if (inHook(t) && a.cut && covers(c, Wc, a.cut.r)) body = <MicroOnly t={t} c={toMicro(c, Wc, K_ARM)} />;
    else body = <ArmWorld t={t} c={c} />;
  } else if (wc.world === 'bull') {
    body = <BullWorld t={t} c={c} />;
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
