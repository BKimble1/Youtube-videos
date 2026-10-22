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
import {cellAt, TissueField, TissueBack, Cell2, TCell2, ApoptoticCell, R, HEALTHY, TUMOR, CLONES, lookMix, Motes, boundary} from '../art/tissue';
import {AIBack, DigitalTumor, dtOutline, GrowthCurve} from '../art/ai';
import {Protein, Molecule, MOL_FIT, POCKET} from '../art/protein';
import {Dendritic, Granules, Synapse, fingerPath} from '../art/immune';
import {Fragment} from './F';
import {OPEN, OPEN_END, toTissue, fromTissue, C0P} from './A';

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
  {t: tG.notOne, x: 0, y: -60, z: 0.62, rot: 0},
  {t: tG.universal + 0.6, x: 0, y: -160, z: 0.36, rot: 0},
]);
const CAM_GAL2 = path([
  {t: tG.answer - 0.1, x: 0, y: -140, z: 0.36, rot: 0},
  {t: tG.remember, x: 0, y: -100, z: 0.4, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ G4 the workflow as a guided route
// Five stages laid along one route. The camera travels the route and settles on each stage as it is named; the
// active stage is enlarged and shows its actual process; the others stay quiet. At the end the route is seen whole.
const NODES = [tG.studies, tG.predicts, tG.designs, tG.activates, tG.watches];
const STAGE: Pt[] = [[0, 0], [1100, -170], [2200, 50], [3300, -150], [4400, 40]];
const WR = 330;
const CAM_LOOP = path([
  {t: tG.studies - 0.6, x: STAGE[0][0] - 250, y: STAGE[0][1], z: 0.62, rot: 0},
  {t: tG.studies + 0.3, x: STAGE[0][0], y: STAGE[0][1], z: 0.95, rot: 0},
  {t: tG.predicts - 0.45, x: STAGE[0][0] + 60, y: STAGE[0][1], z: 0.95, rot: 0},
  {t: tG.predicts + 0.35, x: STAGE[1][0], y: STAGE[1][1], z: 0.95, rot: 0},
  {t: tG.designs - 0.45, x: STAGE[1][0] + 50, y: STAGE[1][1], z: 0.95, rot: 0},
  {t: tG.designs + 0.35, x: STAGE[2][0], y: STAGE[2][1], z: 0.95, rot: 0},
  {t: tG.activates - 0.45, x: STAGE[2][0] + 50, y: STAGE[2][1], z: 0.95, rot: 0},
  {t: tG.activates + 0.35, x: STAGE[3][0], y: STAGE[3][1], z: 0.95, rot: 0},
  {t: tG.watches - 0.5, x: STAGE[3][0] + 50, y: STAGE[3][1], z: 0.95, rot: 0},
  {t: tG.watches + 0.35, x: STAGE[4][0], y: STAGE[4][1], z: 0.95, rot: 0},
  {t: tG.answer + 0.3, x: 2200, y: -40, z: 0.34, rot: 0},
]);
const routeD = 'M ' + STAGE.map((p) => p.join(' ')).join(' L ');
const Loop: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const act = (k: number) => lift(t, NODES[k] - 0.35, NODES[k] + 0.1) * (k < 4 ? 1 - lift(t, NODES[k + 1] - 0.4, NODES[k + 1]) : 1) + (k === 4 ? 0 : 0);
  const reach = clamp01((t - NODES[0]) / (NODES[4] + 0.4 - NODES[0]));
  const wide = lift(t, tG.watches + 1.0, tG.answer);
  const local = (k: number) => clamp01((t - NODES[k] + 0.3) / 1.6);
  const win = (k: number, child: React.ReactNode) => {
    const a = Math.max(act(k), wide);
    return (
      <g key={k} transform={`translate(${STAGE[k][0]} ${STAGE[k][1]}) scale(${0.85 + 0.15 * act(k)})`} opacity={0.35 + 0.65 * a}>
        <defs><clipPath id={`gwin${k}`}><circle r={WR} /></clipPath></defs>
        <g clipPath={`url(#gwin${k})`}>{child}</g>
        <circle r={WR} fill="none" stroke={act(k) > 0.5 ? P.aiGold : P.aiDim} strokeWidth={10} />
      </g>
    );
  };
  const u1 = local(1), u2 = local(2), u3 = local(3);
  const mc = (() => { const m = MOL_FIT.atoms; return [m.reduce((s, q) => s + q[0], 0) / m.length, m.reduce((s, q) => s + q[1], 0) / m.length]; })();
  const seat = smooth(u2);
  const molX = lerp(POCKET[0] + 520, POCKET[0], seat) - mc[0] * 0.8, molY = lerp(POCKET[1] - 480, POCKET[1], seat) - mc[1] * 0.8;
  return (
    <g>
      <AIBack cam={cam} t={t} op={0.5} />
      <g transform={camTransform(cam)}>
        <path d={routeD} fill="none" stroke={P.aiDim} strokeWidth={14} strokeLinecap="round" />
        <path d={routeD} fill="none" stroke={P.ai} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${reach} 1`} opacity={0.8} />
        {win(0, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill={P.aiBg} /><DigitalTumor R={230} seed={2} t={t} lod={1} sy={1} shape={boundary} regions={local(0)} /><rect x={-WR + local(0) * WR * 2} y={-WR} width={8} height={WR * 2} fill={P.aiHot} opacity={0.7 * (1 - local(0))} /></g>)}
        {win(1, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill={P.aiBg} />{[-1, 0, 1].map((m) => <DigitalTumor key={m} x={m * 175} y={0} R={78} seed={2} t={t} lod={1} sy={1} shape={boundary} shrink={m === 1 ? 0.6 * u1 : m === -1 ? 0.5 * u1 * (1 - 0.6 * smooth((u1 - 0.5) * 2)) : 0.05 * u1} spare={m === -1 ? 1 : 0} highlight={m === 1 ? 1 : 0} vessels={0} />)}</g>)}
        {win(2, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill="#22102E" /><g transform={`scale(0.42) translate(${-POCKET[0]} ${-POCKET[1]})`}><Protein t={t} layer="back" close={smooth((u2 - 0.6) / 0.4)} /><Molecule mol={MOL_FIT} x={molX} y={molY} s={0.8} rot={lerp(-50, 0, seat)} /><Protein t={t} layer="front" close={smooth((u2 - 0.6) / 0.4)} /></g></g>)}
        {win(3, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill="#0E2436" /><Dendritic x={-110} y={40} r={110} t={t} present={1} /><TCell2 x={lerp(260, 150, smooth(u3))} y={-70} r={95} t={t} act={smooth((u3 - 0.5) * 2)} dir={Math.PI} /></g>)}
        {win(4, <g><rect x={-WR} y={-WR} width={WR * 2} height={WR * 2} fill={P.blood} />{Array.from({length: 6}, (_, k) => { const x = -300 + ((k * 140 + t * 160) % 700); return <g key={k}><Fragment x={x} y={-200 + k * 80} s={0.9} rot={k * 30} tumor={k === 3} t={t} glow={0} />{k === 3 && <circle cx={x} cy={-200 + k * 80} r={95} fill="none" stroke={P.ai} strokeWidth={5} opacity={act(4)} />}</g>; })}</g>)}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ G6–G8 the same cell, found in time; one retreat
// No return trip through the body: the narration asks us to remember the single cell, so we are shown that cell in
// the composition where the opening landed; it is found and removed at cell scale; only then does the camera make one
// continuous retreat — cell → tissue → lung → body — ending on the opening body framing, without the glow.
const T_RE = tG.remember;
const E_OPEN = toTissue(OPEN(OPEN_END));
const killT = {arrive: tG.before + 0.05, rec: tG.before - 0.25, lock: tG.before + 0.3, kill: tG.before + 0.6};
const RET0 = tG.tumorE - 0.45;
const TG = path([
  {...E_OPEN, t: T_RE},
  {t: tG.finding, x: C0.x + 30, y: C0.y - 10, z: 2.0, rot: -4.5},
  {t: RET0, x: C0.x + 20, y: C0.y - 8, z: 2.35, rot: -3.5},
]);
const TCELL_FROM: Pt = [C0.x + 620, C0.y - 300];
const tcEnd: Pt = [C0.x + R + 52, C0.y - 14];
const tcPos = (t: number): Pt => {
  const k = lift(t, tG.finding - 0.2, killT.arrive);
  return [lerp(TCELL_FROM[0], tcEnd[0], k), lerp(TCELL_FROM[1], tcEnd[1], k)];
};
const RET = path([
  {...fromTissue(TG(RET0)), t: RET0},
  {t: RET0 + 0.9, x: SITE.tumor[0], y: SITE.tumor[1], z: 140, rot: -3},
  {t: RET0 + 1.8, x: 100, y: -380, z: 4, rot: -1},
  {t: DURATION2 - 0.75, x: 4, y: -52, z: 0.56, rot: 0},
]);
const tissueCamG = (t: number): Cam => (t < RET0 ? TG(t) : toTissue(RET(t)));
const TissueG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const die = clamp01((t - killT.kill - 0.15) / 2.0);
  const pulse = (0.75 + 0.25 * Math.sin(t * 3.2)) * 0.75 * (1 - lift(t, killT.kill, killT.kill + 0.8));
  const tp = tcPos(t);
  const rec = lift(t, killT.rec, killT.rec + 0.3) * (1 - lift(t, killT.kill + 0.5, killT.kill + 0.9));
  const ang = Math.atan2(C0.y - tp[1], C0.x - tp[0]);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={(i, j) => (i === 0 && j === 0 ? {hide: true} : null)} />
        {die <= 0 ? <Cell2 x={C0.x} y={C0.y} seed={C0.seed} t={t} lod={lod} look={lookMix(HEALTHY, TUMOR, 0.2)} pulse={pulse} /> : <ApoptoticCell x={C0.x} y={C0.y} seed={C0.seed} t={t} die={die} lod={lod} look={lookMix(HEALTHY, TUMOR, 0.3)} />}
        {/* its fingerprints are recognised by the receptor pair seen earlier, contact first, then the synapse */}
        {rec > 0.01 && [-1, 0, 1].map((m) => {
          const cxp = tp[0] + Math.cos(ang) * 53 - Math.sin(ang) * m * 16, cyp = tp[1] + Math.sin(ang) * 53 + Math.cos(ang) * m * 16;
          return (
            <g key={m} transform={`translate(${cxp} ${cyp}) rotate(${(ang * 180) / Math.PI})`} opacity={rec}>
              <path d={fingerPath(m + 1)} transform="translate(6 0) rotate(-90) scale(0.12)" fill={P.neoantigen} />
            </g>
          );
        })}
        <Synapse a={tp} b={[C0.x, C0.y]} k={lift(t, killT.lock, killT.lock + 0.25) * (1 - lift(t, killT.kill + 0.6, killT.kill + 0.9))} rA={52} />
        <Granules a={tp} b={[C0.x, C0.y]} t={t} t0={killT.kill} />
        {t > tG.finding - 0.3 && <TCell2 x={tp[0]} y={tp[1]} r={52} t={t} dir={ang} lod={lod} act={0.5} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} op={lift(t, tG.finding - 0.3, tG.finding + 0.1)} />}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};

export const shotsG: Shot[] = [
  {id: 'G-twin', t0: tG.breakthrough, t1: tG.notOne, draw: (t) => <PersonTwin t={t} />},
  {id: 'G-gallery', t0: tG.notOne, t1: tG.studies - 0.05, draw: (t) => <Gallery t={t} cam={CAM_GAL(t)} />},
  {id: 'G-loop', t0: tG.studies - 0.6, t1: tG.answer + 0.35, fade: 0.5, draw: (t) => <Loop t={t} cam={CAM_LOOP(t)} />},
  {id: 'G-heal', t0: tG.answer - 0.1, t1: T_RE, fade: 0.4, draw: (t) => <Gallery t={t} cam={CAM_GAL2(t)} />},
  {id: 'G-tissue', t0: T_RE, t1: RET0 + 1.25, draw: (t) => <TissueG t={t} cam={tissueCamG(t)} />},
  {id: 'G-end', t0: RET0 + 0.8, t1: DURATION2 + 1, fade: 0.4, draw: (t) => <BodyWorld t={t} cam={RET(t)} body={{glow: 0, chest: 1, lesion: 0, healthy: 1}} />},
];
export const _g = {handoff, TISSUE_SCALE, C0P, rand};
