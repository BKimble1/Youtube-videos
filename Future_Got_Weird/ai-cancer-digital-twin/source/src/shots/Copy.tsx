// 3 · BUILD A USEFUL COPY ("First, build the copy" → "Next, give the attack an address").
//  A  slices fly in and stack; on "digital twins" the stack becomes the model's rings; "mathematical models" adds the
//     density field and growth arrows; "medical scans" sweeps a scan through it; "updated as new information arrives"
//     drops a new slice in, reshapes one region and leaves an uncertain (dashed) boundary.
//  B  the model splits into three imagined runs: one shrinks, one barely changes, one shrinks then returns.
//  C  the camera dives into the returning lump, follows a dividing cell, and lands on the model searching options.
//  D  in the clinic the model boundary is laid over a later measurement (they differ); a candidate plan still has
//     to pass lab, animal and human testing gates (dashed: not yet passed).
//  E  "What usually works?" — a crowd of tumours under one average plan → "What might work for this tumour?" — one.
import React from 'react';
import {T, TE, clamp01, lerp, seg, smooth, easeOut, easeIn, easeInOut, pulse, noise, rand, blob, closedPath, P, backOut} from '../kit/core';
import {Cam, camPath, smoothCam, camTransform, kick} from '../kit/cam';
import {Frame, Vignette, Flash} from '../kit/fx';
import {IDLE, Pose, mixPose, reach} from '../components/Character';
import {ClinicRoom, DISPLAY} from '../sets/clinic';
import {Grid, MriSlice, Twin3D, TwinShape, twinSilhouette} from '../art/digital';
import {CLINICIAN, Mouse, Person} from '../art/lab';
import {C, M} from '../theme';

export const tFirst = T('First, build'), tTwins = T('digital twins'), tMath = T('mathematical models'), tScans = T('medical scans');
export const tUpd = T('and updated'), tGoal = T('The goal is'), tTreat = T('possible treatments'), tChoose = T('before choosing');
export const tOne = T('One simulated'), tAnother = T('Another barely'), tThird = T('A third'), tReturns = T('then returns');
export const tSearch = T('The model is searching'), tNot = T('It is not a perfect'), tSim = T('and a simulated success'), tReal = T('real-world testing');
export const tBut = T('But it changes'), tUsual = T('What usually works'), tThis = T('What might work');
export const COPY_END = T('Next, give') - 0.04;
export const CUT_C = tSearch - 0.3, CUT_D = tNot - 0.12, CUT_E = tBut - 0.1;

const TW: TwinShape = {R: 200, seed: 4, rough: 0.18};
const rotA = (t: number) => 0.4 + (t - tFirst) * 0.3;
const NSL = 8; // scan slices in the stack
const sliceY = (i: number) => lerp(150, -150, i / (NSL - 1));

// ------------------------------------------------------------------------------------------------ A + B: model space
const camAB = camPath([
  [tFirst - 0.2, {x: 0, y: 0, z: 1.25}],
  [tTwins, {x: -40, y: -10, z: 1.05}],
  [tMath + 0.4, {x: 0, y: 0, z: 1.35}],
  [tScans - 0.3, {x: -120, y: 0, z: 1.2}],
  [tUpd + 0.3, {x: 60, y: -30, z: 1.45}],
  [tGoal - 0.1, {x: 140, y: -40, z: 1.8}],
  [tTreat + 0.2, {x: 0, y: 20, z: 0.72}],
  [tOne - 0.2, {x: 0, y: 20, z: 0.76}],
  [tOne + 0.3, {x: -560, y: 20, z: 1.25}],
  [tAnother - 0.15, {x: -520, y: 20, z: 1.3}],
  [tAnother + 0.35, {x: 0, y: 20, z: 1.25}],
  [tThird - 0.15, {x: 30, y: 20, z: 1.3}],
  [tThird + 0.35, {x: 560, y: 20, z: 1.3}],
  [tReturns, {x: 570, y: 10, z: 1.45}],
  [CUT_C, {x: 620, y: -90, z: 6.5}, easeIn],
]);
const RUN_X = [-560, 0, 560];
const runScale = (i: number, t: number) => {
  if (i === 0) return lerp(1, 0.42, easeInOut(seg(t, tOne + 0.3, tOne + 1.6)));
  if (i === 1) return 1 - 0.06 * easeInOut(seg(t, tAnother + 0.3, tAnother + 1.2)) + 0.015 * Math.sin(t * 5) * seg(t, tAnother, tAnother + 1.5);
  return lerp(1, 0.5, easeInOut(seg(t, tThird + 0.2, tThird + 1.1))) + 0.62 * easeInOut(seg(t, tReturns - 0.2, tReturns + 0.9));
};
const DOSE = [M.wireHot, '#7FB2FF', '#C79BFF'];

const ModelSpace: React.FC<{t: number}> = ({t}) => {
  const cam = kick(smoothCam(camAB, t, 0.2), t, tReturns + 0.3, 6, 0.3);
  const lw = Math.max(1.2, 3 / cam.z);
  // slices fly in from both sides and stack (perspective = skew + squash)
  const flat = smooth(seg(t, tTwins - 0.2, tTwins + 1.0));
  const build = smooth(seg(t, tTwins, tMath + 0.2));
  const split = easeInOut(seg(t, tGoal + 0.1, tTreat + 0.6));
  const field = smooth(seg(t, tMath, tMath + 0.8));
  const sweep = seg(t, tScans - 0.6, tScans + 0.9);
  const upd = smooth(seg(t, tUpd + 0.5, tUpd + 1.2));
  const uncertain = smooth(seg(t, tUpd + 1.0, tUpd + 1.8)) * (1 - split);
  const shape: TwinShape = {...TW, lumpAt: [1.2, 0.35], lump: 0.55 * upd};
  return (
    <g transform={camTransform(cam)}>
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.22} lw={lw * 0.5} />
      {/* the slice stack */}
      {Array.from({length: NSL}, (_, i) => {
        const a = tFirst - 0.25 + i * 0.12;
        const u = easeOut(seg(t, a, a + 0.75));
        if (u <= 0 || flat >= 1) return null;
        const from = i % 2 ? 1 : -1;
        const x = lerp(from * 1300, 0, u), y = lerp(sliceY(i) - 300, sliceY(i), u);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${lerp(from * 25, 0, u)})`} opacity={(1 - flat) * smooth(u * 3)}>
            <g transform={`skewX(-28) scale(1 ${lerp(0.9, 0.34, u)})`}>
              <MriSlice w={420} h={320} level={i / (NSL - 1)} seed={7} lesion={Math.sin((i / (NSL - 1)) * Math.PI)} edge={M.wire} />
            </g>
          </g>
        );
      })}
      {/* where a measured region of the model is uncertain */}
      {[0, 1, 2].map((i) => {
        const runK = i === 1 ? 1 : split;
        if (runK < 0.01 && i !== 1) return null;
        const x = lerp(0, RUN_X[i], split);
        const sc = (i === 1 ? 1 : 1) * runScale(i, t) * lerp(1, 0.78, split);
        const rot = rotA(t) + i * 0.7;
        const lump = i === 2 ? 0.9 * easeInOut(seg(t, tReturns - 0.2, tReturns + 0.9)) : 0;
        const sh: TwinShape = i === 1 ? shape : {...TW, seed: TW.seed, lumpAt: [rot * 0 + 1.2, 0.35], lump: Math.max(0.55 * upd, lump)};
        const dose = split * smooth(seg(t, tTreat - 0.1 + i * 0.25, tTreat + 0.4 + i * 0.25));
        return (
          <g key={i} transform={`translate(${x} 0) scale(${sc})`} opacity={i === 1 ? 1 : runK}>
            <Twin3D shape={sh} rotY={rot} lw={lw / sc} build={build} voxels={field} t={t} heat={(px, py) => clamp01(0.5 + 0.004 * px - 0.002 * py + (upd * 0.5 * Math.exp(-((px - 120) ** 2 + (py + 60) ** 2) / 9000)))} hot={i === 2 ? pulse(t, tReturns + 0.4, 0.4) : 0} />
            {/* growth arrows from the hot side of the model (mathematical model of growth) */}
            {field > 0.01 && i === 1 && split < 0.5 && [0, 1, 2, 3, 4].map((k) => {
              const a = -0.9 + k * 0.45;
              const r0 = 210, r1 = 250 + 14 * Math.sin(t * 3 + k);
              return <path key={k} d={`M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1}`} stroke={M.wireHot} strokeWidth={lw * 1.4} strokeLinecap="round" opacity={field * (1 - split * 2) * 0.9} markerEnd="" />;
            })}
            {/* treatment doses: pulses of a colour per imagined run */}
            {dose > 0.01 && [0, 1, 2].map((k) => {
              const ph = ((t - tTreat - i * 0.25) * 0.9 + k / 3) % 1;
              return <circle key={k} r={lerp(330, 150, ph)} fill="none" stroke={DOSE[i]} strokeWidth={lw * 2 / sc} opacity={dose * Math.sin(ph * Math.PI) * 0.7} />;
            })}
          </g>
        );
      })}
      {uncertain > 0.01 && (
        <g opacity={uncertain}>
          <path d={closedPath(twinSilhouette(shape, rotA(t)).map(([x, y]) => [x * 1.13, y * 1.13] as P).filter(([x]) => x > 20))} fill="none" stroke={M.wireWarn} strokeWidth={lw * 1.6} strokeDasharray={`${lw * 5} ${lw * 4}`} strokeDashoffset={t * 20} />
          <path d={closedPath(twinSilhouette(shape, rotA(t)).map(([x, y]) => [x * 1.13, y * 1.13] as P).filter(([x]) => x > 20))} fill={M.wireWarn} opacity={0.06} />
        </g>
      )}
      {/* scan sweep: a slice of light passes through the model and leaves a slice beside it */}
      {sweep > 0 && sweep < 1 && (
        <g opacity={Math.sin(sweep * Math.PI)}>
          <rect x={-320} y={lerp(-260, 260, sweep) - 4} width={640} height={8} fill={M.wire} />
          <rect x={-320} y={lerp(-260, 260, sweep) - 40} width={640} height={36} fill={M.wire} opacity={0.12} />
        </g>
      )}
      {(() => {
        const k = smooth(seg(t, tScans - 0.2, tScans + 0.4)) * (1 - smooth(seg(t, tUpd + 0.2, tUpd + 0.8)));
        return k > 0.01 ? <g transform={`translate(-560 0) scale(${0.8 * k})`} opacity={k}><MriSlice w={300} h={230} level={0.5} seed={7} /></g> : null;
      })()}
      {/* the new measurement arriving */}
      {(() => {
        const u = seg(t, tUpd - 0.1, tUpd + 0.6);
        if (u <= 0 || u >= 1) return null;
        return (
          <g transform={`translate(${lerp(900, 130, easeIn(u))} ${lerp(-420, -70, easeIn(u))}) scale(${lerp(0.7, 0.2, u)})`} opacity={1 - smooth((u - 0.85) * 6)}>
            <MriSlice w={300} h={230} level={0.62} seed={9} edge={M.wireHot} lesionShift={20} />
          </g>
        );
      })()}
      {pulse(t, tUpd + 0.62, 0.12) > 0.02 && <circle cx={130} cy={-70} r={40 + 120 * seg(t, tUpd + 0.55, tUpd + 0.95)} fill="none" stroke={M.wireHot} strokeWidth={lw * 2} opacity={pulse(t, tUpd + 0.62, 0.14)} />}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ C: dive + search
const WireCell: React.FC<{x: number; y: number; r: number; d: number; lw: number; t: number}> = ({x, y, r, d, lw, t}) => {
  const k = smooth(d);
  const pts = (cx: number, s: number) => blob(cx, 0, r * s, 3 + cx, t, 0.06, 14, 1 + 0.25 * (1 - k), 1);
  return (
    <g transform={`translate(${x} ${y})`}>
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={pts(sd * k * r * 0.7, lerp(1, 0.82, k))} fill={M.screenLift} fillOpacity={0.6} stroke={M.wire} strokeWidth={lw} />
          <circle cx={sd * k * r * 0.72} cy={0} r={r * 0.3 * lerp(1, 0.8, k)} fill="none" stroke={M.wireHot} strokeWidth={lw} strokeDasharray={`${lw * 3} ${lw * 2}`} />
        </g>
      ))}
    </g>
  );
};
const camC = camPath([
  [CUT_C, {x: 0, y: 0, z: 2.2}],
  [CUT_C + 0.8, {x: 120, y: 0, z: 1.7}],
  [tSearch + 0.9, {x: 420, y: 0, z: 1.05}],
  [CUT_D, {x: 640, y: 0, z: 0.82}],
]);
const DiveSearch: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camC, t, 0.2);
  const lw = 2.6 / cam.z;
  const div = seg(t, CUT_C, CUT_C + 1.1);
  const d1 = easeInOut(seg(t, CUT_C + 1.0, tSearch + 0.9));
  // the camera follows the right daughter; it becomes one tile of a grid of candidate plans
  const grid = smooth(seg(t, tSearch + 0.5, tSearch + 1.2));
  const pick = Math.floor(clamp01(seg(t, tSearch + 1.0, CUT_D)) * 9);
  return (
    <g transform={camTransform(cam)}>
      <Grid x0={-2000} y0={-1400} x1={3000} y1={1400} step={60} op={0.22} lw={lw * 0.5} />
      {/* the lump's crowd of model cells */}
      {Array.from({length: 18}, (_, i) => {
        const a = rand(i * 3) * Math.PI * 2, rr = 160 + rand(i * 5) * 340;
        return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr * 0.7} r={40 + rand(i) * 18} fill="none" stroke={M.wireDim} strokeWidth={lw} opacity={1 - grid} />;
      })}
      <g opacity={1 - grid * 0.9}><WireCell x={0} y={0} r={80} d={div} lw={lw} t={t} /></g>
      <g transform={`translate(${lerp(56, 640, d1)} ${lerp(0, 0, d1)})`}>
        {/* tiles: the same model run under different candidate options */}
        {Array.from({length: 9}, (_, i) => {
          const gx = ((i % 3) - 1) * 300, gy = (Math.floor(i / 3) - 1) * 300;
          const k = i === 4 ? 1 : grid;
          const resp = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + 1));
          const sel = pick === i ? 1 : 0;
          return (
            <g key={i} transform={`translate(${gx * grid} ${gy * grid})`} opacity={k}>
              <rect x={-130} y={-130} width={260} height={260} rx={24} fill={M.screenLift} stroke={sel ? M.wireHot : M.wireDim} strokeWidth={lw * (sel ? 2.4 : 1.2)} opacity={grid} />
              <g transform={`scale(${0.5 * lerp(1, resp, smooth(seg(t, tSearch + 1.0 + i * 0.08, tSearch + 1.6 + i * 0.08)))})`}>
                <Twin3D shape={{...TW, seed: 4 + i}} rotY={t * 0.5 + i} lw={lw * 2} nLat={7} nLon={10} />
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ D: clinic compare
const camD = camPath([
  [CUT_D, {x: DISPLAY.x + 40, y: DISPLAY.y - 10, z: 1.7}],
  [tSim - 0.3, {x: 960, y: 520, z: 1.12}],
  [tReal + 0.4, {x: DISPLAY.x + 60, y: DISPLAY.y, z: 1.45}],
  [CUT_E, {x: DISPLAY.x + 60, y: DISPLAY.y, z: 1.5}],
]);
const Flask: React.FC = () => (
  <g>
    <path d="M -14 -40 L -14 -10 L -36 30 Q -40 40 -28 40 L 28 40 Q 40 40 36 30 L 14 -10 L 14 -40 Z" fill={M.screenLift} stroke={M.wire} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -26 22 L 26 22 L 34 36 L -34 36 Z" fill={M.wire} opacity={0.5} />
  </g>
);
const People: React.FC = () => (
  <g fill="none" stroke={M.wire} strokeWidth={4}>
    {[-26, 0, 26].map((x, i) => (
      <g key={i} transform={`translate(${x} ${i === 1 ? -6 : 4})`}>
        <circle cx={0} cy={-22} r={10} />
        <path d="M -16 22 Q -16 -6 0 -6 Q 16 -6 16 22" />
      </g>
    ))}
  </g>
);
const CompareScreen: React.FC<{t: number; z: number}> = ({t, z}) => {
  const lw = Math.max(1, 2.6 / z);
  const ov = smooth(seg(t, CUT_D - 0.3, CUT_D + 0.25));
  const mis = smooth(seg(t, T('copy of you') - 0.1, T('copy of you') + 0.5));
  const gates = smooth(seg(t, tSim - 0.1, tSim + 0.5));
  const travel = easeInOut(seg(t, tSim + 0.4, tReal + 0.6));
  const model: TwinShape = {...TW, R: 150, seed: 6};
  const sil = twinSilhouette(model, 0.8);
  // the later measurement agrees on most of the outline but bulges where the model did not predict
  const meas = sil.map(([x, y]) => {
    const a = Math.atan2(y, x);
    const k = 1 + 0.22 * Math.exp(-((a - 2.3) ** 2) / 0.12) - 0.08 * Math.exp(-((a + 0.6) ** 2) / 0.2);
    return [x * k, y * k] as P;
  });
  const shiftX = lerp(0, -300, gates);
  return (
    <g>
      <rect x={-600} y={-400} width={1200} height={800} fill={M.screen} />
      <Grid x0={-600} y0={-400} x1={600} y1={400} step={40} op={0.25} lw={lw * 0.5} />
      <g transform={`translate(${shiftX} 0) scale(${lerp(1, 0.7, gates)})`}>
        {/* the later measurement: a scan-textured region (what the follow-up scan showed) */}
        <path d={closedPath(meas)} fill="#6E6E78" opacity={0.85 * ov} />
        {Array.from({length: 9}, (_, i) => <path key={i} d={blob((rand(i * 7) - 0.5) * 220, (rand(i * 9) - 0.5) * 200, 18 + rand(i) * 16, i, 0, 0.3, 7)} fill="#A9A9B4" opacity={0.6 * ov} />)}
        <path d={closedPath(meas)} fill="none" stroke={M.wireWarn} strokeWidth={lw * 1.8} opacity={ov} />
        <g opacity={ov}><Twin3D shape={model} rotY={0.8} lw={lw} fill={0.05} nLat={7} nLon={10} /></g>
        {/* the mismatch */}
        {mis > 0.01 && <circle cx={Math.cos(2.3) * 190} cy={Math.sin(2.3) * 190} r={70 + 6 * Math.sin(t * 6)} fill="none" stroke={C.saffron} strokeWidth={lw * 2} strokeDasharray={`${lw * 5} ${lw * 3}`} opacity={mis} />}
      </g>
      {/* testing gates: a candidate plan travels toward lab, animal and human testing (dashed = not yet passed) */}
      {gates > 0.01 && (
        <g opacity={gates}>
          <path d="M -80 0 L 520 0" stroke={M.wireDim} strokeWidth={lw * 2} strokeDasharray={`${lw * 4} ${lw * 4}`} />
          {[[120, Flask], [290, null], [450, People]].map(([x, G], i) => (
            <g key={i} transform={`translate(${x as number} 0)`}>
              <rect x={-62} y={-62} width={124} height={124} rx={20} fill={M.screen} stroke={M.wire} strokeWidth={lw * 1.4} strokeDasharray={`${lw * 5} ${lw * 3}`} />
              {i === 1 ? <g transform="translate(6 28) scale(0.48)"><Mouse t={t} tumor={0} /></g> : React.createElement(G as React.FC)}
            </g>
          ))}
          <g transform={`translate(${lerp(-80, 40, travel)} 0)`}>
            <rect x={-34} y={-24} width={68} height={48} rx={10} fill={M.wireHot} stroke={C.ink} strokeWidth={3} />
            <g transform="scale(0.22)"><Twin3D shape={{...TW}} rotY={t} lw={8} nLat={6} nLon={8} color={C.ink} dim={C.ink} fill={0} /></g>
          </g>
        </g>
      )}
    </g>
  );
};
const ClinicCompare: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camD, t, 0.2);
  const ch = {x: 1470, y: 1150, scale: 1.5};
  const point = smooth(seg(t, T('copy of you') - 0.2, T('copy of you') + 0.3)) * (1 - smooth(seg(t, tSim + 0.4, tSim + 0.9)));
  const base: Pose = {...IDLE, lookX: -0.85, lookY: -0.2, tilt: -5, mouth: 'flat', brows: -0.2};
  const pose = mixPose(base, {...base, armL: reach(ch, -1, 1050, 520), brows: 0.2, mouth: 'hmm'}, point);
  return (
    <g transform={camTransform(cam)}>
      <ClinicRoom t={t} glow={1} lightbox={1}>
        <CompareScreen t={t} z={cam.z} />
      </ClinicRoom>
      <Person look={CLINICIAN} pose={pose} t={t} seed={4} x={ch.x} y={ch.y} scale={ch.scale} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ E: usual vs this one
const camE = camPath([
  [CUT_E, {x: 0, y: 0, z: 1.1}],
  [tUsual + 0.4, {x: 0, y: -20, z: 0.85}],
  [tThis - 0.2, {x: 0, y: -20, z: 0.88}],
  [COPY_END, {x: 0, y: 40, z: 2.0}, easeIn],
]);
const UsualThis: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camE, t, 0.2);
  const lw = 2.6 / cam.z;
  const avg = smooth(seg(t, tUsual - 0.2, tUsual + 0.5));
  const one = smooth(seg(t, tThis - 0.1, tThis + 0.7));
  return (
    <g transform={camTransform(cam)}>
      <Grid x0={-2000} y0={-1400} x1={2000} y1={1400} step={60} op={0.2} lw={lw * 0.5} />
      {Array.from({length: 35}, (_, i) => {
        const gx = ((i % 7) - 3) * 200, gy = (Math.floor(i / 7) - 2) * 190;
        const me = i === 17;
        const k = smooth(seg(t, CUT_E - 0.15 + rand(i) * 0.35, CUT_E + 0.1 + rand(i) * 0.35));
        const fade = me ? 0 : one;
        return (
          <g key={i} transform={`translate(${lerp(gx, 0, me ? one : 0)} ${lerp(gy + 20, 40, me ? one : 0)}) scale(${0.32 * k * (me ? lerp(1, 2.4, one) : 1)})`} opacity={1 - fade}>
            <Twin3D shape={{R: 200, seed: 20 + i, rough: 0.25}} rotY={t * 0.4 + i} lw={lw / 0.32} color={me && one > 0.1 ? M.wire : '#7FA3B5'} dim={M.wireDim} nLat={6} nLon={9} fill={me ? 0.14 : 0.06} />
          </g>
        );
      })}
      {/* the average plan: one beam over everyone */}
      {avg > 0.01 && (
        <g opacity={avg * (1 - one)}>
          <path d="M -760 -470 L 760 -470 L 700 440 L -700 440 Z" fill={M.wireHot} opacity={0.07} />
          <rect x={-760} y={-470} width={1520} height={14} rx={7} fill={M.wireHot} />
        </g>
      )}
      {/* this tumour: a focused beam */}
      {one > 0.01 && (
        <g opacity={one}>
          <path d={`M -60 -520 L 60 -520 L 220 40 L -220 40 Z`} fill={M.wireHot} opacity={0.09} />
          <circle cx={0} cy={40} r={260} fill="none" stroke={M.wireHot} strokeWidth={lw * 1.6} strokeDasharray={`${lw * 6} ${lw * 4}`} strokeDashoffset={-t * 30} />
        </g>
      )}
    </g>
  );
};

export const Copy: React.FC<{t: number}> = ({t}) => {
  const part = t < CUT_C ? 'A' : t < CUT_D ? 'C' : t < CUT_E ? 'D' : 'E';
  return (
    <Frame bg={part === 'D' ? C.paper : M.screen}>
      {part === 'A' && <ModelSpace t={t} />}
      {part === 'C' && <DiveSearch t={t} />}
      {part === 'D' && <ClinicCompare t={t} />}
      {part === 'E' && <UsualThis t={t} />}
      <Flash op={0.35 * Math.max(pulse(t, CUT_C, 0.05), pulse(t, CUT_E, 0.05))} color={M.wire} />
      <Vignette op={part === 'D' ? 0.35 : 0.7} />
    </Frame>
  );
};
export const _c = {TE, noise, backOut, tChoose};
