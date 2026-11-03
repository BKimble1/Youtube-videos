// One frame: the shot for time t, drawn through its camera, then the captions in screen space.
import React from 'react';
import {resetIds} from './core/ids';
import {Cam, D0, Layer, camScale} from './camera';
import {Pitch, ForeGrass, Bench} from './art/pitch';
import {Ball} from './art/ball';
import {Wyatt, WPose, joints, cleatLow} from './art/wyatt';
import {SoftShadow} from './dc/shade';
import {fmt} from './dc/math';
import {Captions} from './Captions';
import {pitchState, pitchCam, shotAt, BALL, illusState, illusCam, benchState, benchCam, bedState, bedCam, BENCH_X, ILL_END, ILL_DISS} from './story';
import {RoomBack, BedUnder} from './art/bed';
import {C} from './art/pal';
import {IllusShot} from './art/illus';

const Shadows: React.FC<{p: WPose; id: string; extra?: {x: number; y: number; r: number}[]}> = ({p, id, extra = []}) => {
  const j = joints(p);
  const feet = [
    {x: j.PA.x - 4, y: cleatLow(j.PA, j.nFoot)},
    {x: j.FA.x - 4, y: cleatLow(j.FA, j.fFoot)},
  ];
  return (
    <g>
      {[...feet.map((f) => ({x: f.x, h: Math.max(0, -f.y), r: 13})), ...extra.map((b) => ({x: b.x, h: Math.max(0, -b.y - b.r), r: b.r}))].map((f, i) => {
        const a = Math.max(0, 0.34 * (1 - f.h / 45));
        return a > 0.01 ? <SoftShadow key={i} id={`${id}-sh${i}`} c={{x: f.x, y: 0.4}} rx={f.r * (1 + f.h / 60)} ry={2.2} alpha={a} color="#1E3A22" /> : null;
      })}
    </g>
  );
};

export const PitchShot: React.FC<{t: number; c: Cam; bench?: boolean; k: string}> = ({t, c, bench, k}) => {
  const {pose, ball} = pitchState(t);
  const px = 1 / camScale(c);
  return (
    <>
      <Pitch c={c} id={`${k}pt`} />
      {bench && <Bench c={c} x={30} iw={7 * px * camScale(c) * 0.1} />}
      <Layer c={c} D={D0}>
        <Shadows p={pose} id={`${k}ws`} extra={[ball]} />
        <Wyatt p={pose} o={{id: `${k}w`, px, cut: 1}} />
        {ball.smear > 0 && [0, 1, 2].map((k) => (
          <line key={k} x1={fmt(ball.x + ball.r * 0.9)} y1={fmt(ball.y - 5 + k * 5)} x2={fmt(ball.x + ball.r * 0.9 + 22 * ball.smear)} y2={fmt(ball.y - 5 + k * 5 + 2)} stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
        ))}
        <Ball id={`${k}ball`} x={ball.x} y={ball.y} r={BALL.r} spin={ball.spin} iw={7 * px} />
      </Layer>
      <ForeGrass c={c} />
    </>
  );
};

const BenchShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = benchCam(t);
  const {pose} = benchState(t);
  const px = 1 / camScale(c);
  return (
    <>
      <Pitch c={c} id={`${k}pt`} />
      <Bench c={c} x={BENCH_X} iw={2.2} />
      <Layer c={c} D={D0}>
        <Shadows p={pose} id={`${k}ws`} />
        <Wyatt p={pose} o={{id: `${k}w`, px, cut: 1}} />
      </Layer>
      <ForeGrass c={c} />
    </>
  );
};
const BedShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = bedCam(t);
  const s = bedState(t);
  const px = 1 / camScale(c);
  return (
    <>
      <RoomBack c={c} H={s.H} k={k} />
      <Layer c={c} D={D0}>
        <BedUnder H={s.H} A={s.A} iw={7 * px} k={k} />
        <Wyatt p={s.pose} o={{id: `${k}w`, px, cut: 0, prosthesis: false, hideFarLeg: true, shirt: C.gown, shortsColor: C.gown, bareFoot: {fa: s.fa, toeCurl: s.toeCurl}}} />
      </Layer>
    </>
  );
};

export const Scene: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  const shot = shotAt(t);
  let body: React.ReactNode = null;
  if (shot === 'pitch1' || shot === 'pitch6') body = <PitchShot t={t} c={pitchCam(t)} k={fkey} />;
  else if (shot === 'illus') body = <IllusShot c={illusCam(t)} s={illusState(t)} k={fkey} />;
  else if (shot === 'bench') {
    const d = t - ILL_END;
    body = (
      <>
        <BenchShot t={t} k={fkey} />
        {d < ILL_DISS && (
          <div style={{position: 'absolute', inset: 0, opacity: 1 - d / ILL_DISS}}>
            <IllusShot c={illusCam(ILL_END)} s={illusState(ILL_END)} k={`${fkey}i`} />
          </div>
        )}
      </>
    );
  } else body = <BedShot t={t} k={fkey} />;
  return (
    <>
      {body}
      {captions && <Captions t={t} />}
    </>
  );
};
