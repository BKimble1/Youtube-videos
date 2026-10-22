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
import {BodyWorld} from '../art/lung';
import {cellAt, nearest, R, SP, boundary} from '../art/tissue';
import {AIBack, DigitalTumor, CTSlice, BiopsyCore, SeqStrip, GrowthCurve} from '../art/ai';
import {Protein, POCKET} from '../art/protein';
import {C0P, toTissue, fromTissue} from './A';
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
const HOLD = tC.predict + 0.6; // B's evolution camera comes to rest here
const PB = path([
  {...fromTissue(EVOLVE_CAM(HOLD)), t: HOLD},
  {t: tC.next + 0.2, x: SITE.tumor[0], y: SITE.tumor[1], z: 60, rot: 0.8},
  {t: tC.ai + 0.2, x: 90, y: -380, z: 4.2, rot: 0.3},
  {t: tC.ai + 1.9, x: 10, y: -120, z: 0.6, rot: 0},
  {t: tC.imagine + 0.3, x: 40, y: -160, z: 0.64, rot: 0},
  {t: tC.scans - 0.1, x: 360, y: -330, z: 0.55, rot: 0},
  {t: tC.using, x: 330, y: -360, z: 0.56, rot: 0},
  {t: tC.copy - 0.35, x: SITE.tumor[0] + 20, y: SITE.tumor[1], z: 2.6, rot: -1},
  {t: tC.copy + 0.25, x: SITE.tumor[0], y: SITE.tumor[1], z: 9, rot: -2},
]);
const tissueCamC = (t: number): Cam => (t < HOLD ? EVOLVE_CAM(t) : toTissue(PB(t)));
const DT_S = 500 / 28; // digital-tumour units per body unit
const DT_H0 = tC.copy - 0.15, DT_H1 = tC.copy + 0.25;
const BEST: Pt = [2250, -1360 + 6 * 340];
const BEST_HEX: Pt = [BEST[0] + 0.3 * 150 * 0.4, BEST[1] - 0.18 * 150 * 0.4];
const DTC = path([
  {...handoff(PB(DT_H1), SITE.tumor, [0, 0], DT_S), t: DT_H1},
  {t: tC.battle - 0.6, x: 0, y: -20, z: 0.85, rot: -1},
  {t: tC.inside - 0.1, x: 80, y: 160, z: 0.52, rot: 0},
  {t: tC.test + 0.9, x: 1250, y: 30, z: 0.33, rot: 0},
  {t: tC.search - 0.3, x: 1400, y: 30, z: 0.31, rot: 0},
  {t: tC.search + 0.6, x: BEST[0], y: BEST[1], z: 0.6, rot: 0},
  {t: tC.choosing + 0.1, x: BEST_HEX[0], y: BEST_HEX[1], z: 2.6, rot: 0},
]);
const dtCam = (t: number): Cam => (t < DT_H1 ? handoff(PB(t), SITE.tumor, [0, 0], DT_S) : DTC(t));
const PR_S = 6; // protein units per DT unit at the weak point
const PR_H: [number, number] = [tC.choosing - 0.35, tC.choosing + 0.15];
const PRC = path([
  {...handoff(DTC(PR_H[1]), BEST_HEX, POCKET, PR_S), t: PR_H[1]},
  {t: tC.instead, x: POCKET[0] - 80, y: POCKET[1] + 60, z: 0.62, rot: 0},
]);
const prCam = (t: number): Cam => (t < PR_H[1] ? handoff(DTC(t), BEST_HEX, POCKET, PR_S) : PRC(t));
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

// ------------------------------------------------------------------------------------------------ body → twin, data streams
const twinK = (t: number) => lift(t, tC.ai - 0.2, tC.ai + 1.6);
const flyTo = (from: Pt, to: Pt, u: number): Pt => {
  const e = smooth(u);
  return [lerp(from[0], to[0], e), lerp(from[1], to[1], e) - Math.sin(e * Math.PI) * 120];
};
const Streams: React.FC<{t: number}> = ({t}) => {
  const site = SITE.tumor;
  // CT slice stack
  const ctOn = lift(t, tC.scans - 0.3, tC.scans + 0.2), ctFly = lift(t, tC.scans + 0.55, tC.samples + 0.35);
  const bOn = lift(t, tC.samples - 0.25, tC.samples + 0.2), bDig = lift(t, tC.samples + 0.35, tC.genetic - 0.1), bFly = lift(t, tC.genetic - 0.1, tC.genetic + 0.6);
  const sOn = lift(t, tC.genetic - 0.2, tC.genetic + 0.1), sRev = lift(t, tC.genetic, tC.using - 0.2), sFly = lift(t, tC.using - 0.2, tC.using + 0.45);
  const arrive = (a: number) => Math.exp(-((t - a) ** 2) / 0.03);
  const ctP = flyTo([900, -640], site, ctFly), bP = flyTo([960, -300], site, bFly), sP = flyTo([560, 120], site, sFly);
  return (
    <g>
      {ctOn > 0.01 && ctFly < 0.99 && [0, 1, 2, 3, 4].map((k) => (
        <CTSlice key={k} x={ctP[0] + (1 - ctFly) * k * 30} y={ctP[1] - (1 - ctFly) * k * 70} s={lerp(1.0, 0.08, ctFly)} k={k} t={t} op={ctOn * (1 - lift(ctFly, 0.8, 1))} skew={-14 * (1 - ctFly)} />
      ))}
      {bOn > 0.01 && bFly < 0.99 && <BiopsyCore x={bP[0]} y={bP[1]} s={lerp(1.15, 0.06, bFly)} digit={bDig} t={t} op={bOn * (1 - lift(bFly, 0.8, 1))} />}
      {sOn > 0.01 && sFly < 0.99 && <SeqStrip x={sP[0] - lerp(560, 10, sFly)} y={sP[1]} s={lerp(1.35, 0.05, sFly)} t={t} reveal={sRev} op={sOn * (1 - lift(sFly, 0.8, 1))} />}
      {[tC.samples + 0.35, tC.genetic + 0.6, tC.using + 0.45].map((a, k) => <circle key={k} cx={site[0]} cy={site[1]} r={30 + 60 * (t - a > 0 ? Math.min(1, (t - a) * 2) : 0)} fill="none" stroke={P.aiGold} strokeWidth={4} opacity={arrive(a + 0.15) * 0.9} />)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ simulation tree
type Node = {x: number; y: number; lvl: number; parent: number; drug: string; outcome: number};
const DRUGS = [P.payload, P.tcell, P.aiGold, '#B58CFF', '#E8F1FF'];
const NODES: Node[] = (() => {
  const out: Node[] = [{x: 0, y: 0, lvl: 0, parent: -1, drug: P.ai, outcome: 0}];
  [-700, 0, 700].forEach((y, k) => out.push({x: 1150, y, lvl: 1, parent: 0, drug: DRUGS[k], outcome: 0}));
  for (let k = 0; k < 9; k++) {
    const y = -1360 + k * 340;
    const parent = 1 + Math.floor(k / 3);
    const best = k === 6;
    out.push({x: 2250, y, lvl: 2, parent, drug: DRUGS[(k + 1) % 5], outcome: best ? -1 : [0.6, -0.4, 0.9, 0.3, -0.2, 0.8, 0, 0.5, -0.5][k]});
  }
  return out;
})();
const SimTree: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const spawn1 = lift(t, tC.inside + 0.2, tC.test - 0.1), spawn2 = lift(t, tC.test - 0.2, tC.test + 0.7);
  const treat = lift(t, tC.test + 0.2, tC.predict2 + 0.2), resp = lift(t, tC.predict2, tC.predict2 + 1.3), curves = lift(t, tC.predict2 + 0.1, tC.search - 0.1);
  const pick = lift(t, tC.search - 0.1, tC.search + 0.4);
  const dimOthers = lift(t, tC.search + 0.1, tC.search + 0.8);
  return (
    <g>
      {NODES.slice(1).map((n, k) => {
        const p = NODES[n.parent];
        const sp = n.lvl === 1 ? spawn1 : spawn2;
        if (sp <= 0.01) return null;
        const x = lerp(p.x, n.x, smooth(sp)), y = lerp(p.y, n.y, smooth(sp));
        const best = n.lvl === 2 && n.outcome === -1;
        const op = sp * (best ? 1 : 1 - 0.75 * dimOthers);
        const shrink = n.lvl === 2 && n.outcome < 0 ? -n.outcome * resp : 0;
        const regrow = n.lvl === 2 && n.outcome > 0 ? n.outcome * resp : 0;
        const tint = n.lvl === 2 && regrow > 0.3 ? mixHex(P.ai, P.tumorGlow, regrow * 0.8) : undefined;
        return (
          <g key={k} opacity={op}>
            <path d={`M ${p.x + 220} ${p.y} C ${(p.x + n.x) / 2} ${p.y} ${(p.x + n.x) / 2} ${y} ${x - 200} ${y}`} fill="none" stroke={P.aiDim} strokeWidth={6} />
            <path d={`M ${p.x + 220} ${p.y} C ${(p.x + n.x) / 2} ${p.y} ${(p.x + n.x) / 2} ${y} ${x - 200} ${y}`} fill="none" stroke={P.ai} strokeWidth={4} strokeDasharray="20 60" strokeDashoffset={-t * 300} opacity={0.8} />
            {/* the treatment being tested arrives as a stream of its own colour */}
            {n.lvl === 2 && treat > 0.01 && Array.from({length: 6}, (_, m) => {
              const u = ((t * 0.9 + m / 6) % 1);
              return <circle key={m} cx={x - 420 + u * 260} cy={y + (m - 2.5) * 22 * (1 - u)} r={18} fill={n.drug} opacity={treat * (1 - u) * (1 - resp * 0.7)} />;
            })}
            <DigitalTumor x={x} y={y} R={n.lvl === 1 ? 190 : 150} seed={k + 2} t={t} lod={cam.z} shrink={shrink} regrow={regrow} tint={tint} vessels={0.6} highlight={best ? pick : 0} />
            {n.lvl === 2 && curves > 0.01 && <GrowthCurve x={x + 200} y={y - 80} w={230} h={150} outcome={n.outcome} draw={curves} color={best ? P.aiGold : n.outcome > 0 ? P.tumorGlow : P.ai} />}
            {best && pick > 0.01 && <circle cx={x} cy={y} r={240} fill="none" stroke={P.aiGold} strokeWidth={8} opacity={pick} />}
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
    t1: tC.next + 0.55,
    draw: (t) => {
      const cam = tissueCamC(t);
      return (
        <g>
          <EvolveB t={Math.min(t, tC.predict + 0.4)} cam={cam} />
          <ScanOverlay t={t} cam={cam} />
        </g>
      );
    },
  },
  {
    id: 'C-body',
    t0: tC.next - 0.05,
    t1: DT_H1 + 0.05,
    fade: 0.6,
    draw: (t) => {
      const cam = PB(t);
      const d = twinK(t);
      return (
        <BodyWorld
          t={t}
          cam={cam}
          back={<AIBack cam={cam} t={t} op={d} />}
          body={{glow: 0.9 * (1 - d), digital: d, slices: lift(t, tC.ai, tC.imagine), tumorSize: 1, scanY: d > 0.01 && d < 0.99 ? lerp(-900, 900, d) : undefined}}
          lungTumor={0.6 * (1 - d)}
          massR={RtB(t)}
          massC={C0P}
          front={<Streams t={t} />}
        />
      );
    },
  },
  {
    id: 'C-twin',
    t0: DT_H0,
    t1: PR_H[1] + 0.05,
    fade: DT_H1 - DT_H0,
    draw: (t) => {
      const cam = dtCam(t);
      const build = 0.3 + 0.7 * lift(t, DT_H0, tC.battle - 0.6);
      const arena = lift(t, tC.battle - 0.6, tC.battle + 0.6);
      return (
        <g>
          <AIBack cam={cam} t={t} />
          <g transform={camTransform(cam)}>
            {arena > 0.01 && (
              <g opacity={arena}>
                {[1.3, 1.9, 2.6, 3.4].map((f, k) => <ellipse key={k} cx={0} cy={470} rx={500 * f} ry={500 * f * 0.22} fill="none" stroke={P.ai} strokeWidth={4} opacity={0.35 - k * 0.06} />)}
                {Array.from({length: 10}, (_, k) => {
                  const a = (k / 10) * Math.PI * 2 + t * 0.15;
                  return <circle key={k} cx={Math.cos(a) * 1100} cy={470 + Math.sin(a) * 240} r={26} fill={k % 2 ? P.tcell : P.payload} opacity={0.75} />;
                })}
              </g>
            )}
            <DigitalTumor x={0} y={0} R={500} seed={1} t={t} build={build} lod={cam.z} op={1 - lift(t, tC.inside + 0.2, tC.test) * 0} />
            <SimTree t={t} cam={cam} />
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
          <AIBack cam={cam} t={t} />
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
