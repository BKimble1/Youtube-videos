// SEQUENCE C (63.9 – 97.7 s): a scan reads the tumour cells and sketches what they might do next; pull back to the
// patient, who becomes a digital twin; scans, a biopsy and sequencing data feed it; dive into the reconstructed tumour
// on its simulation floor; it branches into treatment simulations with uncertain predicted responses; the analysis
// searches one branch down to a weak protein; then five different patients, one generic drug, and a plan built for
// this one person.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {Body, SITE} from '../art/body';
import {cellAt, nearest, R, SP, boundary} from '../art/tissue';
import {AIBack, DigitalTumor, SeqStrip} from '../art/ai';
import {Protein, POCKET} from '../art/protein';
import {C0P} from './A';
import {EvolveB, EVOLVE_CAM, RtB} from './B';

const tC = {
  predict: T('But what if we could predict'), next: T('do next?'), ai: T('This is where artificial intelligence'), imagine: T("Imagine taking a patient's"),
  scans: T('medical scans,'), samples: T('tumor samples,'), genetic: T('genetic information,'), using: T('and using AI'), copy: T('detailed digital copy'),
  battle: T('virtual battlefield.'), inside: T('Inside that simulation,'), test: T('test treatment strategies,'), predict2: T('predict how the tumor'),
  search: T('search for its weaknesses'), choosing: T('before choosing how to attack'), instead: T('Instead of treating every cancer'),
  designed: T('the treatment could be designed'), exact: T('the exact tumor growing'), person: TE('inside that person.'), but: T('But identifying the weakness'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = {x: C0P[0], y: C0P[1]};

// ------------------------------------------------------------------------------------------------ cameras
// The tumour's own silhouette carries the whole section: the scan reads it, the measured contour is traced on it, and
// the model is built in that same outline, at the same place and size on screen (anchor C0 ↔ model origin).
const HOLD = tC.predict + 0.6; // B's evolution camera comes to rest here
const TZ = 0.15;
const TS = path([
  {...EVOLVE_CAM(HOLD), t: HOLD},
  {t: tC.next + 0.1, x: C0.x, y: C0.y, z: TZ, rot: 0},
  {t: tC.ai + 1.6, x: C0.x, y: C0.y, z: TZ * 0.985, rot: 0},
]);
const tissueCamC = (t: number): Cam => (t < HOLD ? EVOLVE_CAM(t) : TS(t));
const RT_C = 2800;
const DT_K = 500 / RT_C; // model units per tissue unit
const DT_H: [number, number] = [tC.ai - 0.1, tC.ai + 1.1];
const toModel = (ct: Cam) => handoff(ct, C0P, [0, 0], DT_K);
// three candidate treatments (copies of the model); the third hits the gold-marked region
const CAND: {x: number; y: number; drug: string}[] = [
  {x: 1500, y: -760, drug: P.payload},
  {x: 1500, y: 0, drug: P.tcell},
  {x: 1500, y: 760, drug: P.aiGold},
];
const CR = 300;
const C_SHRINK = 0.55;
const GOLD_C: Pt = (() => {
  const Rr = CR * (1 - 0.6 * smooth(C_SHRINK));
  return [CAND[2].x + Rr * 0.3, CAND[2].y - Rr * 0.18];
})();
const DTC = path([
  {...toModel(TS(DT_H[1])), t: DT_H[1]},
  {t: tC.using, x: 0, y: 0, z: TZ / DT_K * 0.97, rot: 0},
  {t: tC.battle - 0.4, x: 60, y: 40, z: 0.6, rot: 0},
  {t: tC.inside + 0.2, x: 300, y: 30, z: 0.46, rot: 0},
  {t: tC.test + 0.6, x: 1380, y: 0, z: 0.5, rot: 0},
  {t: tC.search - 0.2, x: 1460, y: 30, z: 0.5, rot: 0},
  {t: tC.search + 0.7, x: CAND[2].x, y: CAND[2].y - 40, z: 0.85, rot: 0},
  {t: tC.choosing + 0.1, x: GOLD_C[0], y: GOLD_C[1], z: 3.2, rot: 0},
]);
const dtCam = (t: number): Cam => (t < DT_H[1] ? toModel(TS(t)) : DTC(t));
const PR_S = 5; // protein units per model unit at the weak point
const PR_H: [number, number] = [tC.choosing - 0.35, tC.choosing + 0.15];
const PRC = path([
  {...handoff(DTC(PR_H[1]), GOLD_C, POCKET, PR_S), t: PR_H[1]},
  {t: tC.instead, x: POCKET[0] - 80, y: POCKET[1] + 60, z: 0.62, rot: 0},
]);
const prCam = (t: number): Cam => (t < PR_H[1] ? handoff(DTC(t), GOLD_C, POCKET, PR_S) : PRC(t));
const ROW = path([
  {t: tC.instead, x: 0, y: -60, z: 0.36, rot: 0},
  {t: tC.designed - 0.2, x: 0, y: -60, z: 0.38, rot: 0},
  {t: tC.exact, x: 0, y: -260, z: 0.78, rot: 0},
  {t: tC.but, x: 20, y: -300, z: 0.86, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ the predictive scan over the tumour cells
const ScanOverlay: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const k = lift(t, tC.predict, tC.predict + 0.4);
  if (k <= 0) return null;
  const sx = lerp(-200, W + 200, lift(t, tC.predict, tC.next - 0.2)); // screen-space scan line
  const hw = Math.hypot(W, H) / 2 / cam.z + SP;
  const i0 = Math.floor((cam.x - hw) / SP), i1 = Math.ceil((cam.x + hw) / SP), j0 = Math.floor((cam.y - hw) / (SP * 0.866)), j1 = Math.ceil((cam.y + hw) / (SP * 0.866));
  const rings: React.ReactNode[] = [];
  const Rt = RtB(t);
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const c = cellAt(i, j);
      const dx = c.x - C0.x, dy = c.y - C0.y;
      if (Math.hypot(dx, dy) / boundary(Math.atan2(dy, dx)) > Rt) continue;
      const scr = W / 2 + (c.x - cam.x) * cam.z;
      if (scr > sx) continue;
      const h = rand(((i * 131) ^ (j * 977)) & 0xffff);
      rings.push(<circle key={`${i},${j}`} cx={c.x} cy={c.y} r={R * 0.98} fill="none" stroke={P.ai} strokeWidth={3 / Math.max(0.3, cam.z)} opacity={0.75} />);
      // a few predictions: a dashed ghost where a daughter would appear, or a fading cross where a cell would die
      if (h < 0.07) {
        const g = lift(t, tC.predict + 1.0 + h * 10, tC.predict + 1.6 + h * 10);
        const a = h * 90;
        rings.push(
          <g key={`g${i},${j}`} opacity={g}>
            <circle cx={c.x + Math.cos(a) * SP} cy={c.y + Math.sin(a) * SP} r={R * 0.9} fill={P.ai} fillOpacity={0.12} stroke={P.aiHot} strokeWidth={3 / Math.max(0.3, cam.z)} strokeDasharray={`${12 / cam.z} ${8 / cam.z}`} />
            <line x1={c.x} y1={c.y} x2={c.x + Math.cos(a) * SP * 0.7} y2={c.y + Math.sin(a) * SP * 0.7} stroke={P.aiHot} strokeWidth={3 / Math.max(0.3, cam.z)} />
          </g>,
        );
      }
    }
  return (
    <g opacity={k}>
      <g transform={camTransform(cam)}>{rings}</g>
      <rect x={sx - 160} y={0} width={160} height={H} fill="url(#glowAi)" opacity={0.35} />
      <rect x={sx - 3} y={0} width={6} height={H} fill={P.aiHot} opacity={0.85} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the measured contour and the predicted next front (tissue coords)
const frontShape = (a: number) => boundary(a) + 0.2 * Math.exp(-(((a - 0.5 + Math.PI * 3) % (Math.PI * 2) - Math.PI) ** 2) / 0.12);
const shapePath = (Rt: number, f: (a: number) => number, cx: number, cy: number) =>
  'M ' + Array.from({length: 96}, (_, k) => { const a = (k / 96) * Math.PI * 2; return `${(cx + Math.cos(a) * Rt * f(a)).toFixed(1)} ${(cy + Math.sin(a) * Rt * f(a)).toFixed(1)}`; }).join(' L ') + ' Z';
const ContourOverlay: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const trace = lift(t, tC.next - 0.6, tC.ai + 0.2);
  const fr = lift(t, tC.predict + 1.3, tC.next) * (1 - lift(t, tC.ai, tC.ai + 0.6));
  const sw = 3 / cam.z;
  return (
    <g transform={camTransform(cam)}>
      {fr > 0.01 && <path d={shapePath(RT_C, frontShape, C0.x, C0.y)} fill="none" stroke={P.aiHot} strokeWidth={sw * 2.2} strokeDasharray={`${22 / cam.z} ${14 / cam.z}`} opacity={fr} />}
      {trace > 0.01 && <path d={shapePath(RT_C, boundary, C0.x, C0.y)} fill="none" stroke={P.ai} strokeWidth={sw * 1.6} pathLength={1} strokeDasharray={`${trace} 1`} />}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the model and what each input changes
const Model: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const sweep = lift(t, tC.scans - 0.3, tC.samples - 0.1);
  const build = 0.34 + 0.4 * sweep + 0.26 * lift(t, tC.using, tC.copy + 0.6);
  const needle = Math.min(lift(t, tC.samples - 0.15, tC.samples + 0.3), 1 - lift(t, tC.genetic - 0.1, tC.genetic + 0.3));
  const regions = lift(t, tC.samples + 0.25, tC.genetic);
  const reads = lift(t, tC.genetic - 0.1, tC.genetic + 0.6);
  const gold = lift(t, tC.genetic + 0.5, tC.using + 0.2);
  const vess = lift(t, tC.using + 0.3, tC.copy + 1.0);
  const arena = lift(t, tC.battle - 0.7, tC.battle + 0.4) * (1 - lift(t, tC.test - 0.4, tC.test + 0.4));
  const fadeMain = 1 - 0.45 * lift(t, tC.test, tC.test + 0.8);
  const sy = -560 + 1120 * sweep;
  const goldPt: Pt = [500 * 0.3, -500 * 0.18];
  return (
    <g>
      {arena > 0.01 && (
        <g opacity={arena * 0.8}>
          {/* the battlefield: the model's surroundings — vessels, immune cells, drug — kept quiet */}
          {Array.from({length: 9}, (_, k) => {
            const a = (k / 9) * Math.PI * 2 + 0.3;
            return <circle key={k} cx={Math.cos(a) * 820} cy={Math.sin(a) * 700} r={22} fill={k % 3 === 0 ? P.payload : P.tcell} opacity={0.7} />;
          })}
          <path d="M -1100 -620 Q -500 -560 -260 -330 M 1100 520 Q 600 560 320 330" fill="none" stroke={P.aiGold} strokeWidth={10} opacity={0.5} />
        </g>
      )}
      <g opacity={fadeMain}>
        <DigitalTumor x={0} y={0} R={500} seed={1} t={t} build={build} lod={cam.z} sy={1} shape={boundary} regions={regions} highlight={gold} vessels={vess} />
      </g>
      {/* scans: a slice plane sweeps through the model and adds its layers */}
      {sweep > 0.01 && sweep < 0.99 && (
        <g>
          <rect x={-720} y={sy - 4} width={1440} height={8} fill={P.aiHot} opacity={0.8} />
          <rect x={-720} y={sy - 90} width={1440} height={90} fill="url(#glowAi)" opacity={0.25} />
        </g>
      )}
      {/* tumour sample: a biopsy core enters one region; the regions resolve into subclones */}
      {needle > 0.01 && (
        <g opacity={needle} transform={`translate(${-120 + 360 * (1 - needle)} ${120 - 360 * (1 - needle)}) rotate(-45)`}>
          <rect x={-18} y={-20} width={36} height={520} rx={18} fill={P.aiBgLift} stroke={P.aiHot} strokeWidth={4} transform="rotate(180)" />
        </g>
      )}
      {/* genetic information: a read slides into the region it describes, which is marked gold */}
      {reads > 0.01 && reads < 0.999 && (
        <g transform={`translate(${lerp(1100, goldPt[0], smooth(reads))} ${lerp(-520, goldPt[1], smooth(reads))}) scale(${lerp(0.7, 0.15, smooth(reads))})`} opacity={1 - lift(reads, 0.8, 1)}>
          <SeqStrip x={-500} y={0} s={1} t={t} reveal={1} n={22} />
        </g>
      )}
    </g>
  );
};

const Candidates: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const spawn = lift(t, tC.inside + 0.3, tC.test + 0.1);
  const treat = lift(t, tC.test + 0.1, tC.predict2);
  const resp = lift(t, tC.predict2 - 0.2, tC.predict2 + 1.4);
  const regrow = lift(t, tC.predict2 + 1.2, tC.search + 0.4);
  const pick = lift(t, tC.search - 0.1, tC.search + 0.4);
  const ghosts = lift(t, tC.test, tC.test + 1.0) * (1 - lift(t, tC.search, tC.search + 0.5));
  return (
    <g>
      {/* more possibilities exist, kept in the background */}
      {ghosts > 0.01 && Array.from({length: 8}, (_, k) => {
        const gx = 2500 + (k % 2) * 380, gy = -1260 + k * 360;
        return <DigitalTumor key={'g' + k} x={gx} y={gy} R={130} seed={k + 9} t={t} lod={cam.z * 0.5} vessels={0} op={0.22 * ghosts} sy={1} shape={boundary} />;
      })}
      {CAND.map((c, k) => {
        const p = smooth(spawn);
        const x = lerp(0, c.x, p), y = lerp(0, c.y, p);
        const shrink = k === 0 ? 0.65 * resp * (1 - 0.7 * regrow) : k === 1 ? 0.08 * resp : C_SHRINK * resp;
        const dim = k === 2 ? 1 : 1 - 0.55 * pick;
        return (
          <g key={k} opacity={spawn * dim}>
            <path d={`M 360 0 C 900 0 900 ${y} ${x - CR * 1.15} ${y}`} fill="none" stroke={P.aiDim} strokeWidth={5} opacity={p} />
            {/* the treatment arrives as particles of its own colour; the targeted one homes on the gold region */}
            {treat > 0.01 && Array.from({length: 10}, (_, m) => {
              const u = (t * 0.7 + m / 10) % 1;
              const tx = k === 2 ? x + CR * 0.3 * (1 - 0.6 * resp) : x, ty = k === 2 ? y - CR * 0.18 : y;
              return <circle key={m} cx={lerp(x - 560, tx, u)} cy={lerp(y + (m - 4.5) * 40, ty, u)} r={16} fill={c.drug} opacity={treat * (1 - u) * (1 - 0.6 * resp)} />;
            })}
            <DigitalTumor x={x} y={y} R={CR} seed={1} t={t} lod={cam.z} sy={1} shape={boundary} shrink={shrink} regrow={k === 0 ? 0.25 * regrow : 0} spare={k === 0 ? 1 : 0} highlight={k === 2 ? 1 - 0.3 * resp : 0} vessels={0.5} />
            {k === 2 && pick > 0.01 && <circle cx={x} cy={y} r={CR * 1.05} fill="none" stroke={P.aiGold} strokeWidth={8} opacity={pick} />}
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ five patients
const PATIENTS: {x: number; site: Pt; col: string}[] = [
  {x: -1700, site: [-30, -150], col: '#9A7CFF'},
  {x: -850, site: [40, 60], col: '#36F0C8'},
  {x: 0, site: SITE.tumor, col: P.aiGold},
  {x: 850, site: [-90, -470], col: '#FF8AD0'},
  {x: 1700, site: [20, -720], col: '#7CC4FF'},
];
const PatientRow: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const wave = lift(t, tC.instead + 0.5, tC.designed - 0.1);
  const waveX = lerp(-2600, 2600, wave);
  const focus = lift(t, tC.designed - 0.1, tC.designed + 0.6);
  const real = lift(t, tC.exact + 0.4, tC.person - 0.2);
  const keyB = lift(t, tC.designed + 0.3, tC.exact + 0.2);
  return (
    <g>
      <AIBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        {PATIENTS.map((p, k) => {
          const ours = k === 2;
          const hitByWave = waveX > p.x;
          const responds = k === 1 && hitByWave ? lift(waveX - p.x, 0, 600) : 0;
          return (
            <g key={k} transform={`translate(${p.x} 0)`} opacity={ours ? 1 : 1 - 0.8 * focus}>
              {ours && real > 0.01 && <g opacity={real}><Body t={t} glow={0.6} /></g>}
              <g opacity={ours ? 1 - 0.55 * real : 1}>
                <Body t={t + k} digital={1} slices={0.6} />
              </g>
              <circle cx={p.site[0]} cy={p.site[1]} r={150 * (1 - 0.5 * responds)} fill={`url(#glowGold)`} opacity={0.8} />
              <circle cx={p.site[0]} cy={p.site[1]} r={42 * (1 - 0.5 * responds)} fill={p.col} />
              {/* each tumour's own weak point: a differently shaped notch */}
              <path d={`M ${p.site[0] - 22} ${p.site[1] - 8} l ${14 + k * 4} ${-16 - k * 3} l ${12} ${26 + k * 2} Z`} fill={P.aiBg} />
            </g>
          );
        })}
        {/* one generic drug for everyone: a grey wave that changes little */}
        {wave > 0.01 && wave < 0.999 && (
          <g opacity={Math.min(1, wave * 6) * (1 - lift(wave, 0.85, 1))}>
            {Array.from({length: 40}, (_, m) => <circle key={m} cx={waveX - rand(m) * 500} cy={-900 + rand(m * 3) * 1800} r={14} fill="#A8B0B8" opacity={0.7} />)}
          </g>
        )}
        {/* a key built for this tumour */}
        {keyB > 0.01 && (
          <g transform={`translate(${SITE.tumor[0] + lerp(260, 30, smooth(keyB))} ${SITE.tumor[1] - lerp(200, 10, smooth(keyB))}) scale(0.6)`} opacity={Math.min(1, keyB * 3) * (1 - 0.6 * real)}>
            <circle r={180} fill="url(#glowGold)" />
            <path d="M -60 -30 L 40 -30 L 40 -60 L 90 0 L 40 60 L 40 30 L -60 30 Z" fill={P.aiGold} stroke="#FFF2C8" strokeWidth={6} />
          </g>
        )}
      </g>
    </g>
  );
};

export const shotsC: Shot[] = [
  {
    id: 'C-scan',
    t0: tC.predict,
    t1: DT_H[1] + 0.05,
    draw: (t) => {
      const cam = tissueCamC(t);
      return (
        <g>
          <EvolveB t={Math.min(t, tC.predict + 0.4)} cam={cam} />
          <ScanOverlay t={t} cam={cam} />
          <ContourOverlay t={t} cam={cam} />
        </g>
      );
    },
  },
  {
    id: 'C-model',
    t0: DT_H[0],
    t1: PR_H[1] + 0.05,
    fade: DT_H[1] - DT_H[0],
    draw: (t) => {
      const cam = dtCam(t);
      return (
        <g>
          <AIBack cam={cam} t={t} op={0.6} />
          <g transform={camTransform(cam)}>
            <Model t={t} cam={cam} />
            <Candidates t={t} cam={cam} />
          </g>
        </g>
      );
    },
  },
  {
    id: 'C-weak',
    t0: PR_H[0],
    t1: tC.instead,
    fade: PR_H[1] - PR_H[0],
    draw: (t) => {
      const cam = prCam(t);
      return (
        <g>
          <AIBack cam={cam} t={t} op={0.6} />
          <g transform={camTransform(cam)}>
            <Protein t={t} digital={1} scanA={t * 2.2} pocketGlow={lift(t, tC.choosing, tC.choosing + 0.5)} />
          </g>
        </g>
      );
    },
  },
  {id: 'C-row', t0: tC.instead, t1: tC.but, draw: (t) => <PatientRow t={t} cam={ROW(t)} />},
];
export const tCdone = tC.but;
export const _c = {nearest, clamp01, H, W};
