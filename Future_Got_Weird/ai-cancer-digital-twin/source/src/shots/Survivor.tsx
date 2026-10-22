// 6 · THE SURVIVOR ("Then one cell threatens the entire plan" → "A digital twin that learns").
//  A  aftermath: treated tumour cells come apart (softened); three tightening push-ins find one intact cell that is
//     subtly different. B "It survives." — stillness, then it starts to divide.
//  C  a fresh, wider look at an untreated tumour: patches of different cell groups.
//  D  a treatment front sweeps through: sensitive cells die, the resistant patch remains and multiplies.
//  E  the big mass shrinks while a resistant pocket at its edge grows.
//  F  single tumour cells read out as expression barcodes → predicted response (sensitive/resistant); a clinician
//     reviews the predictions.
//  G  the model with the poorly predicted resistant region, possible escape routes, an updated plan and a new
//     measurement arriving.
// This is a generic picture of resistance by selection — no cell "decides" anything, and nothing here is claimed
// about resistance in the DNA-switch study.
import React from 'react';
import {T, TE, clamp01, lerp, seg, smooth, easeOut, easeIn, easeInOut, pulse, noise, rand, drift, blob, mixHex, P, closedPath} from '../kit/core';
import {Cam, camPath, smoothCam, camTransform, kick} from '../kit/cam';
import {Frame, Vignette, Flash, blurId} from '../kit/fx';
import {Cell, CellLook, LOOK, tissueGrid} from '../art/cells';
import {Grid, MriSlice, Twin3D, TwinShape, twinSilhouette} from '../art/digital';
import {CLINICIAN, Person} from '../art/lab';
import {ClinicRoom, DISPLAY} from '../sets/clinic';
import {IDLE, Pose, mixPose, reach} from '../components/Character';
import {C, M} from '../theme';

export const tThen = T('Then one cell'), tSurv = T('It survives'), tGroups = T('Tumors contain'), tTreat = T('A treatment can destroy'), tRemain = T('remain and multiply');
export const tSo = T('So the plan'), tSmaller = T('gets smaller'), tRes = T('Researchers have built'), tFrom = T('from individual'), tLonger = T('The longer-term');
export const tEscape = T('escape routes'), tUpd = T('and update treatment'), tNew = T('new measurements arrive');
export const SURVIVOR_END = T('A digital twin that') - 0.04;
export const CUT_C = tGroups - 0.1, CUT_F = tRes - 0.1, CUT_F2 = tFrom + 0.9, CUT_G = tLonger - 0.1;

const SUBTLE: CellLook = {fill: mixHex(M.tumor, M.resist, 0.42), deep: mixHex(M.tumorDeep, M.resistDeep, 0.42), nuc: mixHex('#6E2A47', '#3D3A86', 0.5), nucDeep: '#3A2050'};
const CLONE_B: CellLook = {fill: '#DE7A63', deep: '#B5563F', nuc: '#7A3A2A', nucDeep: '#55261A'};

// ================================================================================================ A + B
const AFTER = tissueGrid(-1500, -1000, 1500, 1000, 120, 21);
const HERO = AFTER.reduce((a, c) => (Math.hypot(c.x - 60, c.y + 20) < Math.hypot(a.x - 60, a.y + 20) ? c : a));
const camAB = (t: number): Cam => {
  // three tightening push-ins (hard cuts between them), then a held close-up
  if (t < tThen + 0.75) return camPath([[tThen - 0.1, {x: -300, y: 150, z: 0.8, rot: -4}], [tThen + 0.75, {x: -120, y: 80, z: 1.0, rot: -2}]])(t);
  if (t < TE('entire plan') - 0.1) return camPath([[tThen + 0.75, {x: HERO.x + 340, y: HERO.y - 180, z: 1.35, rot: 5}], [TE('entire plan') - 0.1, {x: HERO.x + 200, y: HERO.y - 100, z: 1.7, rot: 3}]])(t);
  return camPath([[TE('entire plan') - 0.1, {x: HERO.x + 40, y: HERO.y, z: 2.6}], [tSurv + 0.4, {x: HERO.x, y: HERO.y, z: 3.1}], [CUT_C, {x: HERO.x, y: HERO.y, z: 3.3}]])(t);
};
const Aftermath: React.FC<{t: number}> = ({t}) => {
  const cam = camAB(t);
  const stillness = smooth(seg(t, tSurv - 0.2, tSurv + 0.3));
  const div = easeInOut(seg(t, tSurv + 0.9, CUT_C + 0.2));
  return (
    <g>
      <g filter={blurId(4)}>
        <g transform={camTransform(cam)}>
          <rect x={-3000} y={-2000} width={6000} height={4000} fill="#5A2C3C" />
          {AFTER.filter((c) => c !== HERO).map((c, i) => <Cell key={i} x={c.x + drift(t, i, 4) * 6} y={c.y} r={c.r} seed={c.seed} t={t * (1 - 0.7 * stillness)} look={LOOK.tumor} die={0.62 + 0.38 * rand(i * 3)} detail={0} />)}
        </g>
      </g>
      <g transform={camTransform(cam)}>
        <circle cx={HERO.x} cy={HERO.y} r={HERO.r * 1.9} fill="#FFFFFF" opacity={0.05 + 0.06 * pulse(t, tSurv + 0.2, 0.4)} />
        <Cell x={HERO.x} y={HERO.y} r={HERO.r * 1.08 * (1 + 0.02 * Math.sin(t * 2.4))} seed={HERO.seed} t={t} look={SUBTLE} divide={div} detail={1} lw={3.5} />
      </g>
    </g>
  );
};

// ================================================================================================ C + D + E
const TUM = tissueGrid(-900, -700, 900, 700, 62, 33).filter((c) => Math.hypot(c.x, c.y * 1.25) < 760 + 80 * noise(Math.atan2(c.y, c.x) * 2, 4));
const clone = (c: {x: number; y: number}) => {
  const a = Math.atan2(c.y, c.x);
  if (Math.hypot(c.x - 420, c.y - 300) < 230) return 2; // the resistant patch at one edge
  return a + noise(c.x * 0.004, 7) * 0.8 > 0.3 ? 1 : 0;
};
const camCDE = camPath([
  [CUT_C, {x: 0, y: 0, z: 0.82, rot: 6}],
  [tTreat - 0.1, {x: 60, y: 30, z: 0.88, rot: 3}],
  [tRemain - 0.3, {x: 260, y: 160, z: 1.05}],
  [tRemain + 0.8, {x: 360, y: 260, z: 1.55}],
  [tSo + 0.3, {x: 120, y: 80, z: 0.62}],
  [CUT_F, {x: 120, y: 80, z: 0.6}],
]);
const Groups: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camCDE, t, 0.25);
  const front = lerp(-1300, 1300, easeInOut(seg(t, tTreat + 0.1, tRemain + 0.2)));
  const bulk = smooth(seg(t, tSo, tSmaller + 0.4));
  const groups = smooth(seg(t, CUT_C + 0.2, tGroups + 1.4));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#5A2C3C" />
      {/* healthy surroundings */}
      {tissueGrid(-1700, -1200, 1700, 1200, 62, 34).filter((c) => !TUM.some((u) => Math.hypot(u.x - c.x, u.y - c.y) < 70)).map((c, i) => <Cell key={'h' + i} x={c.x} y={c.y} r={c.r} seed={c.seed} t={t} look={LOOK.healthy} detail={0} lw={2} />)}
      {TUM.map((c, i) => {
        const k = clone(c);
        const look = k === 2 ? SUBTLE : k === 1 ? CLONE_B : LOOK.tumor;
        const hitAt = (c.x + 1300) / 2600;
        const hit = seg(front, c.x - 40, c.x + 200);
        const die = k === 2 ? 0 : easeInOut(hit) * (0.9 + 0.1 * rand(i));
        const lookG = groups < 1 && k !== 0 ? {...look, fill: mixHex(LOOK.tumor.fill, look.fill, groups)} : look;
        // resistant cells multiply: each gains a daughter after the front passes
        const mult = k === 2 ? easeInOut(seg(t, tRemain + rand(i) * 0.6, tRemain + 0.9 + rand(i) * 0.6)) : 0;
        if (die >= 0.999 && bulk > 0.5) return null;
        return (
          <g key={i} opacity={die > 0.95 ? 1 - bulk : 1}>
            <Cell x={c.x} y={c.y} r={c.r * (k === 2 ? 1 + 0.25 * bulk : 1)} seed={c.seed} t={t} look={lookG} die={die} divide={mult > 0 && mult < 1 ? mult : 0} detail={0.4} lw={2.2} />
            {mult >= 1 && <Cell x={c.x + c.r * 0.9} y={c.y + c.r * 0.5} r={c.r * 0.85} seed={c.seed + 3} t={t} look={SUBTLE} detail={0.3} lw={2.2} />}
            {hitAt < 0 && <g />}
          </g>
        );
      })}
      {/* the treatment front */}
      {t > tTreat && t < tRemain + 0.5 && <rect x={front - 60} y={-1200} width={120} height={2400} fill={M.payload} opacity={0.22} />}
      {/* the big mass, outlined: it shrinks while the pocket at its edge grows */}
      {bulk > 0.01 && (
        <g opacity={bulk}>
          <ellipse cx={-80} cy={-40} rx={lerp(820, 470, bulk)} ry={lerp(650, 360, bulk)} fill="none" stroke="#FFE9A8" strokeWidth={8} strokeDasharray="30 18" />
          <circle cx={430} cy={320} r={lerp(220, 330, bulk)} fill="none" stroke={M.resist} strokeWidth={10} />
        </g>
      )}
    </g>
  );
};

// ================================================================================================ F: single-cell predictions
const Predict: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_F, {x: -300, y: 0, z: 1.2}], [tFrom, {x: 0, y: 0, z: 0.95}], [CUT_F2, {x: 80, y: 0, z: 1.0}]]), t, 0.2);
  const flow = (t - CUT_F) * 0.6;
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} />
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.2} />
      {/* model panel */}
      <rect x={-130} y={-260} width={260} height={520} rx={30} fill={M.screenLift} stroke={M.wire} strokeWidth={5} />
      {Array.from({length: 24}, (_, i) => <circle key={i} cx={-80 + (i % 4) * 54} cy={-210 + Math.floor(i / 4) * 84} r={10} fill={M.wire} opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 3 + i))} />)}
      {Array.from({length: 7}, (_, i) => {
        const u = ((flow + i / 7) % 1);
        const x = lerp(-1200, 1200, u);
        const res = i === 2 || i === 5;
        const look = res ? SUBTLE : i % 2 ? CLONE_B : LOOK.tumor;
        const past = x > -130;
        return (
          <g key={i}>
            {!past && <Cell x={x} y={0} r={70} seed={i + 50} t={t} look={look} detail={0.4} lw={2.5} />}
            {/* expression barcode carried above the cell */}
            <g transform={`translate(${x} -150)`} opacity={smooth((x + 600) / 200)}>
              {Array.from({length: 12}, (_, k) => <rect key={k} x={-60 + k * 10} y={-24} width={7} height={48} rx={2} fill={[M.wire, M.wireHot, M.wireWarn, M.target][Math.floor(rand(i * 31 + k + (res ? 7 : 0)) * 4)]} opacity={0.4 + 0.6 * rand(i * 17 + k)} />)}
            </g>
            {/* predicted response after the model */}
            {past && <circle cx={x} cy={0} r={34} fill={res ? M.resist : M.wireHot} stroke={C.ink} strokeWidth={4} opacity={smooth((x + 130) / 120)} />}
          </g>
        );
      })}
    </g>
  );
};
const ReviewClinic: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_F2, {x: 1050, y: 560, z: 1.08}], [CUT_G, {x: 980, y: 520, z: 1.2}]]), t, 0.2);
  const ch = {x: 1470, y: 1150, scale: 1.5};
  const pose: Pose = mixPose({...IDLE, lookX: -0.85, lookY: -0.2, mouth: 'flat', brows: -0.1}, {...IDLE, lookX: -0.85, lookY: -0.2, armL: reach(ch, -1, 1120, 470), mouth: 'hmm', brows: 0.2}, smooth(seg(t, CUT_F2 + 0.3, CUT_F2 + 0.8)));
  return (
    <g transform={camTransform(cam)}>
      <ClinicRoom t={t} glow={1}>
        <rect x={-600} y={-400} width={1200} height={800} fill={M.screen} />
        <Grid x0={-600} y0={-400} x1={600} y1={400} step={40} op={0.25} />
        {/* the predicted response map: many cells, a few resistant */}
        {Array.from({length: 60}, (_, i) => {
          const gx = ((i % 10) - 4.5) * 80, gy = (Math.floor(i / 10) - 2.5) * 80;
          const res = Math.hypot(gx - 220, gy - 120) < 140;
          return <circle key={i} cx={gx} cy={gy} r={22} fill={res ? M.resist : M.wireHot} opacity={0.85} stroke={C.ink} strokeWidth={2} />;
        })}
        <circle cx={220} cy={120} r={170} fill="none" stroke={M.wireWarn} strokeWidth={5} strokeDasharray="16 10" strokeDashoffset={t * 30} />
      </ClinicRoom>
      <Person look={CLINICIAN} pose={pose} t={t} seed={4} x={ch.x} y={ch.y} scale={ch.scale} />
    </g>
  );
};

// ================================================================================================ G: escape routes + update
const camG = camPath([
  [CUT_G, {x: 0, y: 0, z: 1.15}],
  [tEscape, {x: 120, y: -20, z: 1.35}],
  [tUpd, {x: 60, y: 0, z: 1.05}],
  [SURVIVOR_END, {x: 0, y: 0, z: 0.95}],
]);
const Routes: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camG, t, 0.2);
  const shape: TwinShape = {R: 220, seed: 9, lumpAt: [0.6, 0.2], lump: 0.6};
  const region = smooth(seg(t, CUT_G + 0.1, CUT_G + 0.8));
  const routes = smooth(seg(t, tEscape - 0.3, tEscape + 0.5));
  const upd = smooth(seg(t, tUpd, tUpd + 0.6));
  const meas = seg(t, tNew - 0.2, tNew + 0.6);
  const ESC: [number, number][] = [[620, -260], [700, 40], [560, 330]];
  const plan = [M.wireHot, M.target];
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} />
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.2} />
      <g transform="translate(-120 0)">
        <Twin3D shape={shape} rotY={0.9 + (t - CUT_G) * 0.08} lw={2.4} voxels={0.7} t={t} warnLump={region} heat={(x) => (x > 120 ? 0.9 : 0.4)} />
      </g>
      {/* escape routes: possible ways the resistant region could go */}
      {ESC.map(([x, y], i) => {
        const k = smooth(seg(routes, i * 0.2, i * 0.2 + 0.6));
        const sx = 160, sy = -40;
        return (
          <g key={i} opacity={k * (1 - 0.5 * upd)}>
            <path d={`M ${sx} ${sy} Q ${(sx + x) / 2 + 40} ${(sy + y) / 2 - 80} ${lerp(sx, x, k)} ${lerp(sy, y, k)}`} fill="none" stroke={M.wireWarn} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round" />
            <circle cx={lerp(sx, x, k)} cy={lerp(sy, y, k)} r={14} fill={M.wireWarn} />
          </g>
        );
      })}
      {/* the plan: a beam on the model that re-aims to cover the resistant region when updated */}
      <g opacity={smooth(seg(t, CUT_G + 0.4, CUT_G + 1.0))}>
        <path d={`M -780 -460 L -680 -460 L ${lerp(-260, 80, upd)} ${lerp(-60, -40, upd)} L ${lerp(-380, -40, upd)} ${lerp(40, 60, upd)} Z`} fill={upd > 0.5 ? plan[1] : plan[0]} opacity={0.22} />
        <circle cx={lerp(-300, 30, upd)} cy={lerp(0, 10, upd)} r={lerp(150, 230, upd)} fill="none" stroke={upd > 0.5 ? plan[1] : plan[0]} strokeWidth={6} strokeDasharray="20 12" strokeDashoffset={t * 30} />
      </g>
      {/* a new measurement arriving */}
      {meas > 0 && meas < 1 && <g transform={`translate(${lerp(1000, 40, easeIn(meas))} ${lerp(-500, -20, easeIn(meas))}) scale(${lerp(0.8, 0.25, meas)})`} opacity={1 - smooth((meas - 0.85) * 6)}><MriSlice w={300} h={230} level={0.5} seed={13} edge={M.wireHot} /></g>}
      {pulse(t, tNew + 0.62, 0.15) > 0.02 && <circle cx={-120} cy={0} r={260 + 200 * seg(t, tNew + 0.5, tNew + 1.1)} fill="none" stroke={M.wireHot} strokeWidth={5} opacity={pulse(t, tNew + 0.62, 0.18)} />}
    </g>
  );
};

export const Survivor: React.FC<{t: number}> = ({t}) => {
  const part = t < CUT_C ? 'AB' : t < CUT_F ? 'CDE' : t < CUT_F2 ? 'F' : t < CUT_G ? 'F2' : 'G';
  const bg = part === 'F2' ? C.paper : M.void;
  return (
    <Frame bg={bg}>
      {part === 'AB' && <Aftermath t={t} />}
      {part === 'CDE' && <Groups t={t} />}
      {part === 'F' && <Predict t={t} />}
      {part === 'F2' && <ReviewClinic t={t} />}
      {part === 'G' && <Routes t={t} />}
      <Flash op={0.3 * Math.max(pulse(t, tThen + 0.75, 0.03), pulse(t, TE('entire plan') - 0.1, 0.03))} color="#FFFFFF" />
      <Vignette op={part === 'AB' ? 0.95 : bg === C.paper ? 0.3 : 0.75} />
    </Frame>
  );
};
export const _v = {clamp01, easeOut, kick, closedPath, twinSilhouette, blob, DISPLAY};
