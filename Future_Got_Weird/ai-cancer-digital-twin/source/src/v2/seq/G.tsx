// SEQUENCE G (199.3 – 231.1 s): the person and their twin; five different tumours with five different weak points;
// one universal key fits none, matched keys fit each; the loop (study → predict → design → activate → watch); each
// tumour gives way to healthy tissue; then the opening shot again — the same body, the same glow, the same dive —
// and this time the single cell is found and removed before it can become a tumour; pull back to the same body,
// with no glow.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01} from '../../kit/core';
import {Shot} from '../director';
import {T, TE, DURATION2} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {Body, SITE} from '../art/body';
import {BodyWorld, TISSUE_SCALE} from '../art/lung';
import {cellAt, TissueField, TissueBack, Cell2, TCell2, ApoptoticCell, R, HEALTHY, TUMOR, CLONES, lookMix, Motes} from '../art/tissue';
import {AIBack, DigitalTumor, dtOutline, GrowthCurve} from '../art/ai';
import {Protein, Molecule, MOL_FIT, POCKET} from '../art/protein';
import {Dendritic, Granules, Synapse} from '../art/immune';
import {Fragment} from './F';
import {OPEN, toTissue, fromTissue, C0P} from './A';

const tG = {
  breakthrough: T("And that's the breakthrough"), notOne: T("Cancer isn't one disease"), every: T('Every tumor can be different.'), so: T('So imagine a system'), universal: T('one universal drug.'),
  studies: T('It studies each cancer,'), predicts: T('predicts its behavior,'), designs: T('designs a targeted attack,'), activates: T('activates the immune system,'), watches: T('and watches for anything'),
  answer: T('A different answer for every cancer.'), remember: T('And remember that single cell'), finding: T('Imagine finding it...'), before: T('before it ever has the chance'), tumorE: TE('to become a tumor.'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = cellAt(0, 0);

// ------------------------------------------------------------------------------------------------ G1 person + twin
const PersonTwin: React.FC<{t: number}> = ({t}) => {
  const cam: Cam = {x: 0, y: -80, z: lerp(0.5, 0.46, lift(t, tG.breakthrough, tG.notOne)), rot: 0};
  const split = lift(t, tG.breakthrough - 0.1, tG.breakthrough + 1.2);
  return (
    <g>
      <AIBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <g transform={`translate(${-420 * split} 0)`}><Body t={t} glow={0.7} /></g>
        <g transform={`translate(${420 * split} 0)`} opacity={0.4 + 0.6 * split}><Body t={t} digital={1} slices={1} tumorSize={1} /></g>
        {split > 0.3 && Array.from({length: 7}, (_, k) => {
          const y = -620 + k * 90;
          return <line key={k} x1={-420 * split + 200} x2={420 * split - 200} y1={y} y2={y} stroke={k % 2 ? P.ai : P.aiGold} strokeWidth={5} strokeDasharray="18 30" strokeDashoffset={(k % 2 ? 1 : -1) * t * 160} opacity={0.5 * split} />;
        })}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ G2/G3/G5 gallery of different tumours
const GAL = [
  {x: -2100, col: TUMOR.fill, shape: 0, seed: 1},
  {x: -1050, col: CLONES[1].fill, shape: 1, seed: 2},
  {x: 0, col: CLONES[2].fill, shape: 2, seed: 3},
  {x: 1050, col: '#C2783A', shape: 3, seed: 4},
  {x: 2100, col: CLONES[3].fill, shape: 4, seed: 5},
];
const shapeD = (k: number, r: number) => {
  switch (k) {
    case 0: return `M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`;
    case 1: return `M ${-r} ${-r} L ${r} ${-r} L ${r} ${r} L ${-r} ${r} Z`;
    case 2: return `M 0 ${-r * 1.2} L ${r * 1.1} ${r * 0.8} L ${-r * 1.1} ${r * 0.8} Z`;
    case 3: return `M 0 ${-r * 1.2} L ${r * 1.2} 0 L 0 ${r * 1.2} L ${-r * 1.2} 0 Z`;
    default: return Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * 0.55 : r * 1.25; return `${i ? 'L' : 'M'} ${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`; }).join(' ') + ' Z';
  }
};
const keyPath = (shape: number) => `M -150 -34 L 30 -34 L 30 -60 L 60 -60 L 60 60 L 30 60 L 30 34 L -150 34 Z`;
const Gallery: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const tries = lift(t, tG.so - 0.1, tG.universal + 0.2) * 5;
  const matched = lift(t, tG.universal - 0.2, tG.universal + 0.5);
  const heal = lift(t, tG.answer + 0.2, tG.remember - 0.1);
  const intro = (k: number) => lift(t, tG.notOne - 0.1 + k * 0.18, tG.notOne + 0.4 + k * 0.18);
  return (
    <g>
      <rect width={W} height={H} fill="url(#tissueDepth)" />
      <g transform={camTransform(cam, 0.6)}>{Array.from({length: 12}, (_, k) => <circle key={k} cx={-3000 + k * 560} cy={(k % 2 ? -500 : 520)} r={260} fill="url(#glowRed)" opacity={0.2} />)}</g>
      <g transform={camTransform(cam)}>
        <rect x={-4000} y={-2000} width={8000} height={4000} fill="url(#tissuePat)" opacity={0.55} />
        {GAL.map((g, k) => {
          const s = intro(k) * (1 - 0.75 * heal);
          const col = mixHex(g.col, HEALTHY.fill, heal);
          const d = dtOutline(320, g.seed, 1);
          return (
            <g key={k} transform={`translate(${g.x} 0)`}>
              <g transform={`scale(${s})`} opacity={Math.min(1, s * 3)}>
                <circle r={520} fill="url(#glowMag)" opacity={0.25 * (1 - heal)} />
                <path d={d} fill="url(#tumorPat)" />
                <path d={d} fill={col} opacity={0.55} />
                <path d={d} fill="url(#vol)" />
                {Array.from({length: 9}, (_, m) => {
                  const a = (m / 9) * Math.PI * 2;
                  const rr = 320 * (1 + 0.12 * Math.sin(3 * a + g.seed) + 0.07 * Math.sin(5 * a + g.seed * 2.1) + 0.04 * Math.sin(9 * a + g.seed * 0.7));
                  return <path key={m} d={shapeD(g.shape, 24)} transform={`translate(${Math.cos(a) * rr} ${Math.sin(a) * rr}) rotate(${(a * 180) / Math.PI})`} fill={mixHex(P.marker, HEALTHY.light, heal)} stroke="#FFF" strokeWidth={4} />;
                })}
              </g>
              {/* the universal key tries this lock and does not fit */}
              {tries > k && tries < k + 1.6 && (() => {
                const u = clamp01(tries - k);
                const dip = Math.sin(Math.min(1, u * 1.4) * Math.PI);
                return (
                  <g transform={`translate(${-60} ${-560 + dip * 150}) rotate(90)`} opacity={1 - smooth((u - 0.9) / 0.7)}>
                    <path d={keyPath(9)} fill="#9AA2AA" stroke="#DDE2E6" strokeWidth={6} />
                    <circle cx={60} cy={0} r={36} fill="#5A6066" />
                  </g>
                );
              })()}
              {/* a key made for this tumour */}
              {matched > 0.01 && (
                <g transform={`translate(0 ${lerp(-720, -420, smooth(clamp01(matched * 1.4 - k * 0.08)))}) rotate(90)`} opacity={Math.min(1, matched * 3) * (1 - heal * 0.8)}>
                  <circle r={150} fill="url(#glowGold)" opacity={0.8} />
                  <path d={keyPath(g.shape)} fill={P.aiGold} stroke="#FFF2C8" strokeWidth={6} />
                  <path d={shapeD(g.shape, 34)} transform="translate(80 0)" fill="#8A6A10" />
                </g>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
};
const CAM_GAL = path([
  {t: tG.notOne, x: -1500, y: -60, z: 0.62, rot: 0},
  {t: tG.every + 0.9, x: 700, y: -60, z: 0.55, rot: 0},
  {t: tG.universal + 0.6, x: 0, y: -160, z: 0.36, rot: 0},
]);
const CAM_GAL2 = path([
  {t: tG.answer - 0.1, x: 0, y: -140, z: 0.36, rot: 0},
  {t: tG.remember, x: 0, y: -100, z: 0.4, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ G4 the loop
const NODES = [tG.studies, tG.predicts, tG.designs, tG.activates, tG.watches];
const Loop: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const RR = 880, WR = 330;
  const act = (k: number) => lift(t, NODES[k] - 0.15, NODES[k] + 0.25) * (k < 4 ? 1 - 0.55 * lift(t, NODES[k + 1] - 0.1, NODES[k + 1] + 0.3) : 1);
  const travel = clamp01((t - NODES[0]) / (NODES[4] + 1.2 - NODES[0])) * 5;
  const ang = (k: number) => -Math.PI / 2 + (k / 5) * Math.PI * 2;
  const pa = -Math.PI / 2 + (travel / 5) * Math.PI * 2;
  const win = (k: number, child: React.ReactNode) => {
    const a = ang(k);
    const x = Math.cos(a) * RR, y = Math.sin(a) * RR;
    const s = 1 + 0.12 * act(k);
    return (
      <g key={k} transform={`translate(${x} ${y}) scale(${s})`} opacity={lift(t, tG.studies - 0.6 + k * 0.08, tG.studies - 0.1 + k * 0.08)}>
        <defs><clipPath id={`gwin${k}`}><circle r={WR} /></clipPath></defs>
        <circle r={WR + 30} fill="url(#glowAi)" opacity={0.3 + 0.5 * act(k)} />
        <g clipPath={`url(#gwin${k})`}>{child}</g>
        <circle r={WR} fill="none" stroke={act(k) > 0.4 ? P.aiGold : P.ai} strokeWidth={10} />
      </g>
    );
  };
  return (
    <g>
      <AIBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <circle r={RR} fill="none" stroke={P.aiDim} strokeWidth={10} />
        <circle r={RR} fill="none" stroke={P.ai} strokeWidth={10} strokeDasharray={`${travel / 5 * 2 * Math.PI * RR} 99999`} transform="rotate(-90)" opacity={0.8} />
        <circle cx={Math.cos(pa) * RR} cy={Math.sin(pa) * RR} r={40} fill="url(#glowGold)" />
        <g transform="scale(0.28) translate(0 -60)"><Body t={t} digital={1} slices={1} tumorSize={1} /></g>
        {win(0, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill={P.aiBg} /><DigitalTumor R={220} seed={2} t={t} lod={1} /><rect x={-WR + ((t * 300) % (WR * 2))} y={-WR} width={10} height={WR * 2} fill={P.aiHot} opacity={0.8} /></g>)}
        {win(1, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill={P.aiBg} /><GrowthCurve x={-230} y={-150} w={460} h={300} outcome={0.6} draw={0.3 + 0.7 * lift(t, NODES[1] - 0.3, NODES[1] + 1)} color={P.ai} /></g>)}
        {win(2, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill="#22102E" /><g transform={`scale(0.45) translate(${-POCKET[0] * 0.4} ${-POCKET[1] * 0.4})`}><Protein t={t} /><Molecule mol={MOL_FIT} x={lerp(POCKET[0] + 600, POCKET[0] - 75 * 0.8, lift(t, NODES[2], NODES[2] + 0.8))} y={lerp(POCKET[1] - 500, POCKET[1] - 35 * 0.8, lift(t, NODES[2], NODES[2] + 0.8))} s={0.8} glow={lift(t, NODES[2] + 0.7, NODES[2] + 1)} /></g></g>)}
        {win(3, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill="#0E2436" /><Dendritic x={-90} y={40} r={110} t={t} present={1} /><TCell2 x={140} y={-80} r={95} t={t} act={act(3)} dir={Math.PI} /></g>)}
        {win(4, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill={P.blood} />{Array.from({length: 6}, (_, k) => <Fragment key={k} x={-300 + ((k * 140 + t * 220) % 700)} y={-200 + k * 80} s={0.9} rot={k * 30} tumor={k === 3} t={t} glow={k === 3 ? act(4) : 0} />)}</g>)}
      </g>
    </g>
  );
};
const CAM_LOOP = path([
  {t: tG.studies - 0.5, x: 0, y: 0, z: 0.42, rot: -8},
  {t: tG.watches + 1.4, x: 0, y: 0, z: 0.47, rot: 8},
]);

// ------------------------------------------------------------------------------------------------ G6–G8 the opening, again
const T_RE = tG.remember;
const SPEED = 1.22;
const reOpen = (t: number): Cam => OPEN((t - T_RE) * SPEED);
const LAND = T_RE + 4.45 / SPEED;
const HANDG: [number, number] = [T_RE + 3.12 / SPEED, T_RE + 3.55 / SPEED];
const killT = {arrive: tG.before - 0.1, lock: tG.before + 0.35, kill: tG.before + 0.65};
const TCELL_FROM: Pt = [C0.x + 520, C0.y - 260];
const tcPos = (t: number): Pt => {
  const k = lift(t, tG.finding + 0.1, killT.arrive);
  const end: Pt = [C0.x + R + 50, C0.y - 12];
  const away = lift(t, tG.tumorE - 0.3, tG.tumorE + 0.8);
  return [lerp(TCELL_FROM[0], end[0], k) + away * 120, lerp(TCELL_FROM[1], end[1], k) - away * 160];
};
const PULL0 = tG.tumorE - 0.05;
const PULLG = path([
  {...fromTissue(toTissue(reOpen(LAND))), t: PULL0},
  {t: PULL0 + 0.9, x: SITE.tumor[0], y: SITE.tumor[1], z: 160, rot: -4},
  {t: PULL0 + 1.8, x: 100, y: -380, z: 4, rot: -1.5},
  {t: DURATION2 - 1.1, x: 4, y: -52, z: 0.56, rot: 0},
]);
const TissueG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const die = clamp01((t - killT.kill - 0.2) / 1.6);
  const pulse = (0.75 + 0.25 * Math.sin(t * 3.2)) * 0.8 * (1 - lift(t, killT.kill, killT.kill + 0.8));
  const tp = tcPos(t);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={(i, j) => (i === 0 && j === 0 ? {hide: true} : null)} />
        {die <= 0 ? <Cell2 x={C0.x} y={C0.y} seed={C0.seed} t={t} lod={lod} look={lookMix(HEALTHY, TUMOR, 0.2)} pulse={pulse} /> : <ApoptoticCell x={C0.x} y={C0.y} seed={C0.seed} t={t} die={die} lod={lod} look={lookMix(HEALTHY, TUMOR, 0.3)} />}
        <Synapse a={tp} b={[C0.x, C0.y]} k={lift(t, killT.lock, killT.lock + 0.25) * (1 - lift(t, killT.kill + 0.6, killT.kill + 0.9))} rA={52} />
        <Granules a={tp} b={[C0.x, C0.y]} t={t} t0={killT.kill} />
        {t > tG.finding - 0.3 && <TCell2 x={tp[0]} y={tp[1]} r={52} t={t} dir={Math.atan2(C0.y - tp[1], C0.x - tp[0])} lod={lod} act={0.6} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} op={lift(t, tG.finding - 0.3, tG.finding + 0.2)} />}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};
const tissueCamG = (t: number): Cam => {
  if (t < LAND) return toTissue(reOpen(t));
  if (t < PULL0) return toTissue(reOpen(LAND));
  return toTissue(PULLG(t));
};
const bodyCamG = (t: number): Cam => (t < PULL0 ? reOpen(t) : PULLG(t));

export const shotsG: Shot[] = [
  {id: 'G-twin', t0: tG.breakthrough, t1: tG.notOne, draw: (t) => <PersonTwin t={t} />},
  {id: 'G-gallery', t0: tG.notOne, t1: tG.studies - 0.6, draw: (t) => <Gallery t={t} cam={CAM_GAL(t)} />},
  {id: 'G-loop', t0: tG.studies - 0.6, t1: tG.answer - 0.1, fade: 0.5, draw: (t) => <Loop t={t} cam={CAM_LOOP(t)} />},
  {id: 'G-heal', t0: tG.answer - 0.1, t1: T_RE, fade: 0.4, draw: (t) => <Gallery t={t} cam={CAM_GAL2(t)} />},
  {
    id: 'G-body',
    t0: T_RE,
    t1: HANDG[1],
    draw: (t) => <BodyWorld t={t} cam={bodyCamG(t)} body={{glow: 1}} lungTumor={0.9} />,
  },
  {id: 'G-tissue', t0: HANDG[0], t1: PULL0 + 1.15, fade: HANDG[1] - HANDG[0], draw: (t) => <TissueG t={t} cam={tissueCamG(t)} />},
  {
    id: 'G-end',
    t0: PULL0 + 0.75,
    t1: DURATION2 + 1,
    fade: 0.4,
    draw: (t) => (
      <g>
        <BodyWorld t={t} cam={bodyCamG(t)} body={{glow: 0, healthy: 1}} />
        <rect width={W} height={H} fill="#000" opacity={lift(t, DURATION2 - 0.45, DURATION2 - 0.05)} />
      </g>
    ),
  },
];
export const _g = {handoff, TISSUE_SCALE, C0P, rand};
