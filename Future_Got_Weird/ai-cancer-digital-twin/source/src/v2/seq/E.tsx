// SEQUENCE E (133.1 – 171.1 s): the immune army leaves the capillaries; the tumour hides (flags withdrawn),
// suppresses (checkpoint shields switch a T cell off) and blends in; on its surface, unique fingerprints; AI reads
// them; two separate routes — a vaccine taken up by a dendritic cell that shows the fingerprint to T cells, and
// engineered T cells given a new receptor and multiplied; a receptor learns the shape; recognise → lock → destroy →
// next → next; the swarm erodes the tumour.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {cellAt, nearest, TissueField, TissueBack, Cell2, TCell2, ApoptoticCell, R, TUMOR, HEALTHY, lookMix, Motes, boundary} from '../art/tissue';
import {Capillary, ShieldLigands, along} from '../art/stroma';
import {Dendritic, Macrophage, MHC, TCR, Granules, Synapse, fingerPath} from '../art/immune';
import {Carrier} from '../art/protein';
import {AIBack} from '../art/ai';
import {C0P, tumorMod, TumorMassShade} from './A';
import {CAPS, SPROUTS} from './B';

const tE = {
  army: T('Your body already has an army'), immune: T("It's called your immune system."), problem: T('The problem is that cancer'), disguise: T('disguise itself,'),
  suppress: T('suppress immune defenses,'), difficult: T('become difficult'), recogE: TE('to recognize.'), tumors: T('But tumors can carry'), finger: T('unique molecular fingerprints.'),
  ai: T('AI can help identify'), identify: T('identify those fingerprints'), guide: T('and guide personalized'), vaccines: T('cancer vaccines'), special: T('specialized immune-cell treatments.'),
  imagine: T('Imagine your own T cells'), hunt: T('exactly what to hunt.'), recognize: T('They recognize a cancer cell.'), lock: T('Lock onto it.'), destroy: T('And destroy it.'),
  next1: T('Then they move to the next.'), next2: T('And the next.'), sudden: T('Suddenly, the tumor'), fighting: T("It's fighting the body's own defenses."), but: T('But destroying the visible tumor'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = {x: C0P[0], y: C0P[1]};
export const RT_E0 = 2800;
export const RtE = (t: number) => RT_E0 - 450 * lift(t, tE.sudden - 0.3, tE.but + 0.4);
const rimCell = (deg: number, inset = 90) => {
  const a = (deg * Math.PI) / 180;
  const r = RT_E0 * boundary(a) - inset;
  const n = nearest(C0.x + Math.cos(a) * r, C0.y + Math.sin(a) * r);
  return {...n, ...cellAt(n.i, n.j)};
};

// ------------------------------------------------------------------------------------------------ the army
const ARMY = Array.from({length: 64}, (_, k) => {
  const cap = CAPS[3];
  const s = along(cap, 0.43 + 0.14 * rand(k * 3)).p;
  return {s, type: k % 9 === 4 ? 2 : k % 7 === 3 ? 3 : k % 3 === 1 ? 1 : 0, speed: 140 + 90 * rand(k * 5), t0: tE.army - 1.2 + rand(k * 7) * 2.6, seed: k + 1};
});
const armyPos = (a: (typeof ARMY)[0], t: number): Pt => {
  const u = Math.max(0, t - a.t0);
  const tx = C0.x - 3150 + 250 * rand(a.seed * 7), ty = C0.y + (a.s[1] - C0.y) * 0.55;
  const dx = tx - a.s[0], dy = ty - a.s[1], d = Math.hypot(dx, dy);
  const go = Math.min(d - 200 * rand(a.seed), u * a.speed);
  return [a.s[0] + (dx / d) * go + 40 * noise(t * 0.5, a.seed), a.s[1] + (dy / d) * go + 40 * noise(t * 0.5, a.seed + 9)];
};

// ------------------------------------------------------------------------------------------------ evasion at the left edge
const Q1 = rimCell(182), Q2 = rimCell(196), Q3 = rimCell(170);
const tcA = (t: number): Pt => {
  // probes Q1 while its flags withdraw, then slides past it
  const arrive = lift(t, tE.problem - 0.3, tE.disguise);
  const slide = lift(t, tE.disguise + 0.5, tE.suppress + 0.4);
  return [lerp(Q1.x - 520, Q1.x - R - 52, arrive) - slide * 60, Q1.y + lerp(-60, 0, arrive) - slide * 360];
};
const tcB = (t: number): Pt => {
  const k = lift(t, tE.disguise + 0.2, tE.suppress + 0.1);
  return [lerp(Q2.x - 600, Q2.x - R - 50, k), lerp(Q2.y - 200, Q2.y - 10, k)];
};
const tcC = (t: number): Pt => {
  const k = lift(t, tE.suppress + 0.6, tE.difficult + 0.4);
  const away = lift(t, tE.difficult + 0.8, tE.recogE + 0.5);
  return [lerp(Q3.x - 600, Q3.x - R - 60, k) - away * 300, lerp(Q3.y + 260, Q3.y + 20, k) + away * 200];
};

// ------------------------------------------------------------------------------------------------ kills at the right edge
const K1 = rimCell(8, 70), K2 = rimCell(-4, 90), K3 = rimCell(20, 120);
const KILLS = [
  {c: K1, rec: tE.recognize, lock: tE.lock, kill: tE.destroy},
  {c: K2, rec: tE.next1 + 0.55, lock: tE.next1 + 0.75, kill: tE.next1 + 0.95},
  {c: K3, rec: tE.next2 + 0.35, lock: tE.next2 + 0.5, kill: tE.next2 + 0.7},
];
const KT = R + 50; // contact distance
const killerPos = (t: number): Pt => {
  const approach = (c: {x: number; y: number}, from: Pt, u: number): Pt => {
    const ang = Math.atan2(c.y - from[1], c.x - from[0]);
    const end: Pt = [c.x - Math.cos(ang) * KT, c.y - Math.sin(ang) * KT];
    return [lerp(from[0], end[0], smooth(u)), lerp(from[1], end[1], smooth(u))];
  };
  const start: Pt = [K1.x + 520, K1.y - 260];
  if (t < KILLS[1].rec - 0.6) return approach(K1, start, lift(t, tE.recognize - 0.9, tE.recognize + 0.1));
  const p1 = approach(K1, start, 1);
  if (t < KILLS[2].rec - 0.45) return approach(K2, p1, lift(t, tE.next1, KILLS[1].rec + 0.05));
  const p2 = approach(K2, p1, 1);
  return approach(K3, p2, lift(t, tE.next2 - 0.15, KILLS[2].rec + 0.05));
};
const SWARM = Array.from({length: 42}, (_, k) => ({deg: (k / 42) * 360 + rand(k) * 6, seed: k + 50, t0: tE.sudden - 0.4 + rand(k * 3) * 1.6}));

// ------------------------------------------------------------------------------------------------ cameras
const CAM_T = path([
  {t: tE.army - 0.25, x: C0.x - 3450, y: C0.y + 250, z: 0.8, rot: -1},
  {t: tE.immune, x: C0.x - 3350, y: C0.y + 60, z: 0.72, rot: 0},
  {t: tE.problem - 0.3, x: C0.x - 3000, y: C0.y, z: 0.42, rot: 0},
  {t: tE.disguise - 0.2, x: Q1.x - 160, y: Q1.y - 40, z: 1.25, rot: 1},
  {t: tE.suppress + 0.3, x: (Q1.x + Q2.x) / 2 - 150, y: (Q1.y + Q2.y) / 2, z: 1.0, rot: 1},
  {t: tE.difficult + 0.3, x: Q3.x - 220, y: Q3.y - 60, z: 0.95, rot: 0},
  {t: tE.tumors - 0.15, x: Q1.x - R, y: Q1.y, z: 2.6, rot: 0},
  {t: tE.tumors + 0.45, x: Q1.x - R, y: Q1.y, z: 14, rot: 0},
]);
const SURF_S = 1 / 14 * 0.32; // tissue z 14 ↔ surface z 0.32  (surface units per tissue unit = 14 / 0.32)
const SURF_SCALE = 14 / 0.32;
const SH: [number, number] = [tE.tumors + 0.1, tE.tumors + 0.45];
const SURF_ANCH: Pt = [0, -120];
const toSurf = (ct: Cam) => handoff(ct, [Q1.x - R, Q1.y], SURF_ANCH, SURF_SCALE);
const CAM_S = path([
  {...toSurf(CAM_T(SH[1])), t: SH[1]},
  {t: tE.finger + 0.4, x: -100, y: -180, z: 1.05, rot: 0},
  {t: tE.ai + 0.3, x: 0, y: -170, z: 0.82, rot: 0},
  {t: tE.guide, x: 250, y: -170, z: 0.86, rot: 0},
]);
const CAM_V = path([
  {t: tE.guide, x: -900, y: -60, z: 1.25, rot: 0},
  {t: tE.vaccines + 0.45, x: -720, y: -60, z: 1.1, rot: 0},
  {t: tE.special - 0.2, x: 1150, y: -60, z: 1.05, rot: 0},
  {t: tE.imagine, x: 1100, y: 20, z: 0.95, rot: 0},
]);
const CAM_R = path([
  {t: tE.imagine, x: 0, y: 30, z: 1.2, rot: 0},
  {t: tE.recognize - 0.2, x: 0, y: 50, z: 1.4, rot: 0},
]);
const CAM_K = path([
  {t: tE.recognize - 0.2, x: K1.x + 160, y: K1.y - 130, z: 1.7, rot: 0},
  {t: tE.destroy + 0.4, x: K1.x + 60, y: K1.y - 30, z: 2.3, rot: 1},
  {t: tE.next1 + 0.8, x: K2.x + 60, y: K2.y - 30, z: 1.9, rot: 0.5},
  {t: tE.next2 + 0.6, x: K3.x + 40, y: K3.y - 40, z: 1.7, rot: 0},
  {t: tE.sudden + 1.2, x: C0.x + 1900, y: C0.y - 300, z: 0.42, rot: -1},
  {t: tE.but + 0.4, x: C0.x + 600, y: C0.y, z: 0.17, rot: -2},
]);

// ------------------------------------------------------------------------------------------------ draw: tissue (army + evasion)
const SurfaceFlags: React.FC<{c: {x: number; y: number; seed: number}; k: number; col?: string; t: number}> = ({c, k, col = P.neoantigen, t}) => (k <= 0.01 ? null : (
  <g>
    {Array.from({length: 7}, (_, m) => {
      const a = (m / 7) * Math.PI * 2 + c.seed;
      const x = c.x + Math.cos(a) * R * 0.98, y = c.y + Math.sin(a) * R * 0.98;
      return <path key={m} d={fingerPath(m % 3)} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90}) scale(${0.22 * k})`} fill={col} opacity={0.95} />;
    })}
  </g>
));
const TissueE: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const blend = lift(t, tE.difficult - 0.1, tE.difficult + 0.6) * (1 - lift(t, tE.tumors - 0.2, tE.tumors + 0.2));
  const mod = tumorMod(t, RT_E0, 0.6, (i, j, x, y) => {
    // camouflage: edge cells drift toward the healthy look
    const dx = x - C0.x, dy = y - C0.y;
    const d = Math.hypot(dx, dy) / boundary(Math.atan2(dy, dx));
    if (blend > 0 && d < RT_E0 && d > RT_E0 - 600) return {look: lookMix(TUMOR, HEALTHY, blend * 0.75), nucScale: lerp(1.25, 1, blend)};
    return null;
  });
  const flagsQ1 = (1 - lift(t, tE.disguise, tE.disguise + 0.5)) * lift(t, tE.problem - 0.5, tE.problem);
  const shield = lift(t, tE.suppress - 0.2, tE.suppress + 0.4);
  const dimB = lift(t, tE.suppress + 0.3, tE.difficult);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={mod} />
        <TumorMassShade Rt={RT_E0} op={1 - lift(cam.z, 0.35, 0.7)} />
        {CAPS.map((c, k) => <Capillary key={k} pts={c} t={t} w={95} lod={cam.z} />)}
        {SPROUTS.map((c, k) => <Capillary key={'s' + k} pts={c} t={t} w={78} lod={cam.z} />)}
        {/* the army streams out of the capillary toward the tumour */}
        {ARMY.map((a, k) => {
          if (t < a.t0) return null;
          const p = armyPos(a, t);
          const out = lift(t, a.t0, a.t0 + 0.6);
          const dir = Math.atan2(C0.y - p[1], C0.x - p[0]);
          if (a.type === 2) return <Macrophage key={k} x={p[0]} y={p[1]} r={95} t={t} seed={a.seed} op={out} />;
          if (a.type === 3) return <Dendritic key={k} x={p[0]} y={p[1]} r={70} t={t} seed={a.seed} op={out} />;
          return <TCell2 key={k} x={p[0]} y={p[1]} r={a.type === 1 ? 48 : 52} t={t} seed={a.seed} dir={dir} lod={lod} op={out} color={a.type === 1 ? '#3FB8C8' : undefined} act={a.type === 1 ? 0.25 : 0} />;
        })}
        {/* evasion */}
        <SurfaceFlags c={Q1} k={flagsQ1} t={t} col={P.immuneGold} />
        <ShieldLigands x={Q2.x} y={Q2.y} r={R * 0.95} a0={Math.PI - 1.2} a1={Math.PI + 1.2} k={shield} n={8} size={16} />
        {shield > 0.01 && <circle cx={Q2.x - R} cy={Q2.y} r={260} fill="url(#glowMag)" opacity={0.35 * shield} />}
        {t > tE.problem - 0.6 && t < tE.tumors + 0.5 && (
          <>
            <TCell2 x={tcA(t)[0]} y={tcA(t)[1]} r={52} t={t} dir={0} lod={lod} seed={11} />
            {t > tE.disguise && <TCell2 x={tcB(t)[0]} y={tcB(t)[1]} r={52} t={t} dir={0} lod={lod} seed={12} dim={dimB} spikes={1 - 0.6 * dimB} />}
            {t > tE.suppress + 0.5 && <TCell2 x={tcC(t)[0]} y={tcC(t)[1]} r={52} t={t} dir={lift(t, tE.difficult + 0.8, tE.recogE) > 0.1 ? Math.PI : 0} lod={lod} seed={13} />}
          </>
        )}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ draw: surface fingerprints
const MHCS = Array.from({length: 13}, (_, k) => ({x: -1800 + k * 300, neo: k === 3 || k === 6 || k === 10, kind: k % 3}));
const Surface: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const glow = lift(t, tE.finger - 0.6, tE.finger + 0.2);
  const scanX = lerp(-2100, 2100, lift(t, tE.identify - 0.2, tE.guide - 0.1));
  return (
    <g>
      <rect width={W} height={H} fill="#3A0A2A" />
      <g transform={camTransform(cam, 0.6)}>{Array.from({length: 8}, (_, k) => <circle key={k} cx={-2000 + k * 600} cy={-900 + 200 * Math.sin(k)} r={180} fill="url(#glowTeal)" opacity={0.15} />)}</g>
      <g transform={camTransform(cam)}>
        <rect x={-4000} y={0} width={8000} height={4000} fill={TUMOR.fill} />
        <rect x={-4000} y={0} width={8000} height={4000} fill="url(#glowMag)" opacity={0.2} />
        {Array.from({length: 120}, (_, k) => <circle key={k} cx={-2400 + k * 40} cy={-16} r={16} fill={TUMOR.light} />)}
        {Array.from({length: 120}, (_, k) => <circle key={'b' + k} cx={-2380 + k * 40} cy={18} r={16} fill={TUMOR.fill} stroke={TUMOR.deep} strokeWidth={3} />)}
        {MHCS.map((m, k) => {
          const passed = scanX > m.x;
          return <MHC key={k} x={m.x} y={-30} t={t} neo={m.neo} kind={m.kind} scan={passed && !m.neo ? 0.5 * (1 - lift(scanX - m.x, 200, 600)) : 0} flag={m.neo && passed ? 1 : m.neo ? glow * 0.35 : 0} />;
        })}
        {t > tE.identify - 0.3 && t < tE.guide + 0.2 && (
          <g>
            <rect x={scanX - 200} y={-500} width={200} height={600} fill="url(#glowAi)" opacity={0.4} />
            <rect x={scanX - 4} y={-500} width={8} height={600} fill={P.aiHot} />
          </g>
        )}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ draw: two routes (vaccine / engineered cells)
const Routes: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const uptake = lift(t, tE.guide, tE.vaccines + 0.3);
  const present = lift(t, tE.vaccines, tE.vaccines + 0.8);
  const activ = lift(t, tE.vaccines + 0.5, tE.vaccines + 1.1);
  const eng = lift(t, tE.special + 0.15, tE.special + 0.75);
  const mult = lift(t, tE.special + 0.3, tE.imagine + 0.2);
  const copies = [[0, 0], [-210, -170], [210, -150], [-240, 170], [230, 190], [0, -330], [0, 340]] as Pt[];
  return (
    <g>
      <rect width={W} height={H} fill="#0E2436" />
      <g transform={camTransform(cam, 0.55)}>
        {Array.from({length: 16}, (_, k) => <path key={k} d={`M ${-3000 + k * 380} -1200 Q ${-2800 + k * 380} 0 ${-3000 + k * 380} 1200`} fill="none" stroke="#1E4A62" strokeWidth={14} opacity={0.6} />)}
      </g>
      <rect width={W} height={H} fill="url(#glowTeal)" opacity={0.08} />
      <g transform={camTransform(cam)}>
        {/* route 1: vaccine particles carry the fingerprint to a dendritic cell, which shows it to a T cell */}
        {Array.from({length: 7}, (_, k) => {
          const a = (k / 7) * Math.PI * 2;
          const d = lerp(560, 120, smooth(clamp01(uptake * 1.3 - k * 0.04)));
          return <Carrier key={k} x={-900 + Math.cos(a) * d} y={Math.sin(a) * d} r={34} t={t} seed={k} op={1 - lift(uptake, 0.75, 1)} lod={0.4} />;
        })}
        <Dendritic x={-900} y={0} r={150} t={t} present={present} />
        <TCell2 x={-500 + 30 * Math.sin(t)} y={-230} r={62} t={t} dir={Math.PI * 0.8} act={activ} seed={21} />
        {activ > 0.01 && <line x1={-560} y1={-200} x2={-700} y2={-120} stroke={P.immuneGold} strokeWidth={8} opacity={activ} strokeLinecap="round" />}
        {/* route 2: a patient's T cell is given a new receptor (gold) and multiplied */}
        {copies.map((c, k) => {
          const show = k === 0 ? 1 : lift(mult * 6, k - 1, k);
          if (show <= 0.01) return null;
          return (
            <g key={'e' + k} transform={`translate(${1100 + c[0] * show} ${c[1] * show})`} opacity={show}>
              <TCell2 x={0} y={0} r={62} t={t + k} seed={30 + k} light={mixHex(P.tcellLight, P.immuneGold, eng)} act={0.3 * eng} spikes={1 - 0.5 * eng} />
              {/* the new receptor: gold Y-shaped receptors studding the surface */}
              {Array.from({length: 9}, (_, m) => {
                const a = (m / 9) * Math.PI * 2 + k;
                const g = smooth(eng * 1.4 - m * 0.04);
                return (
                  <g key={m} transform={`rotate(${(a * 180) / Math.PI}) translate(66 0)`} opacity={g}>
                    <line x1={0} y1={0} x2={22 * g} y2={0} stroke={P.immuneGold} strokeWidth={7} strokeLinecap="round" />
                    <line x1={22 * g} y1={0} x2={34 * g} y2={-10 * g} stroke={P.immuneGold} strokeWidth={7} strokeLinecap="round" />
                    <line x1={22 * g} y1={0} x2={34 * g} y2={10 * g} stroke={P.immuneGold} strokeWidth={7} strokeLinecap="round" />
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* a gene-delivery particle carries the receptor's instructions into the cell */}
        {(() => {
          const u = lift(t, tE.special - 0.45, tE.special + 0.3);
          if (u <= 0 || u >= 1) return null;
          const x = lerp(1560, 1130, u), y = lerp(-380, -30, u);
          return (
            <g transform={`translate(${x} ${y}) rotate(${t * 40})`} opacity={1 - smooth((u - 0.8) / 0.2)}>
              <path d="M 0 -52 L 45 -26 L 45 26 L 0 52 L -45 26 L -45 -26 Z" fill="#3FB8C8" stroke={P.immuneGold} strokeWidth={6} />
              <path d="M -22 -8 Q 0 14 22 -8" fill="none" stroke={P.immuneGold} strokeWidth={5} />
            </g>
          );
        })()}
        {eng > 0.01 && eng < 0.99 && <circle cx={1100} cy={0} r={150 + 200 * eng} fill="none" stroke={P.immuneGold} strokeWidth={6} opacity={1 - eng} />}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ draw: a receptor learns the fingerprint
const Learn: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const learn = lift(t, tE.imagine + 0.7, tE.hunt - 0.1);
  const meet = lift(t, tE.hunt - 0.3, tE.hunt + 0.3);
  const gold = lift(t, tE.hunt + 0.1, tE.hunt + 0.6);
  return (
    <g>
      <rect width={W} height={H} fill="#1A1030" />
      <g transform={camTransform(cam)}>
        {/* T cell membrane above, tumour membrane below */}
        <rect x={-3000} y={-3000} width={6000} height={2560} fill={P.tcellDeep} />
        <rect x={-3000} y={-440} width={6000} height={20} fill={P.tcellLight} />
        <rect x={-3000} y={430} width={6000} height={3000} fill={TUMOR.fill} />
        <rect x={-3000} y={420} width={6000} height={20} fill={TUMOR.light} />
        {[-700, 700].map((x, k) => <TCR key={k} x={x} y={-260} t={t} learn={0.2} rot={180} s={0.9} />)}
        {[-1050, 1050].map((x, k) => <MHC key={k} x={x} y={430} t={t} />)}
        <MHC x={0} y={430} t={t} neo kind={0} flag={gold * 0.6} />
        <TCR x={0} y={lerp(-300, -110, meet)} t={t} learn={learn} kind={0} rot={180} gold={gold} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ draw: the kills and the swarm
const Kills: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const Rt = RtE(t);
  const killed = new Set(KILLS.map((k) => `${k.c.i},${k.c.j}`));
  const mod = tumorMod(t, RT_E0, 0.6, (i, j, x, y) => {
    if (killed.has(`${i},${j}`)) return {hide: true};
    const dx = x - C0.x, dy = y - C0.y;
    const d = Math.hypot(dx, dy) / boundary(Math.atan2(dy, dx));
    if (d < RT_E0 && d > Rt - 120) {
      const k = clamp01((d - Rt + 120) / 240);
      return {look: lookMix(TUMOR, {...TUMOR, fill: '#8A6A86'}, k), bleb: k, shrink: k * 0.6, op: 1 - 0.65 * k, s: 1 - 0.2 * k};
    }
    return null;
  });
  const kp = killerPos(t);
  const swarmOn = lift(t, tE.sudden - 0.5, tE.sudden + 0.6);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={mod} />
        {CAPS.map((c, k) => <Capillary key={k} pts={c} t={t} w={95} lod={cam.z} />)}
        {SPROUTS.map((c, k) => <Capillary key={'s' + k} pts={c} t={t} w={78} lod={cam.z} />)}
        {KILLS.map((k, n) => {
          const die = clamp01((t - k.kill - 0.25) / 1.5);
          const tgt: Pt = [k.c.x, k.c.y];
          const rec = lift(t, k.rec, k.rec + 0.35) * (1 - lift(t, k.kill + 0.6, k.kill + 1.0));
          return (
            <g key={n}>
              {die <= 0 ? <Cell2 x={k.c.x} y={k.c.y} seed={k.c.seed} t={t} lod={lod} look={TUMOR} nucScale={1.25} /> : <ApoptoticCell x={k.c.x} y={k.c.y} seed={k.c.seed} t={t} die={die} lod={lod} />}
              <SurfaceFlags c={k.c} k={rec} t={t} />
              <Synapse a={kp} b={tgt} k={lift(t, k.lock, k.lock + 0.3) * (1 - lift(t, k.kill + 0.7, k.kill + 1.0))} rA={52} />
              <Granules a={kp} b={tgt} t={t} t0={k.kill} />
            </g>
          );
        })}
        <TCell2 x={kp[0]} y={kp[1]} r={52} t={t} dir={Math.atan2(K1.y - kp[1], K1.x - kp[0])} lod={lod} act={0.6} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} />
        {swarmOn > 0.01 && SWARM.map((s, k) => {
          const a = (s.deg * Math.PI) / 180;
          const r = Rt * boundary(a) + 70 + 30 * Math.sin(t * 2 + k);
          const o = lift(t, s.t0, s.t0 + 0.5) * swarmOn;
          return <TCell2 key={k} x={C0.x + Math.cos(a) * r} y={C0.y + Math.sin(a) * r} r={52} t={t} seed={s.seed} dir={a + Math.PI} lod={lod} act={0.5 + 0.3 * Math.sin(t * 3 + k)} op={o} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} />;
        })}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};

export const shotsE: Shot[] = [
  {id: 'E-tissue', t0: tE.army - 0.25, t1: SH[1] + 0.05, draw: (t) => <TissueE t={t} cam={CAM_T(t)} />},
  {id: 'E-surface', t0: SH[0], t1: tE.guide, fade: SH[1] - SH[0], draw: (t) => <Surface t={t} cam={t < SH[1] ? toSurf(CAM_T(t)) : CAM_S(t)} />},
  {id: 'E-routes', t0: tE.guide, t1: tE.imagine, draw: (t) => <Routes t={t} cam={CAM_V(t)} />},
  {id: 'E-learn', t0: tE.imagine, t1: tE.recognize - 0.2, draw: (t) => <Learn t={t} cam={CAM_R(t)} />},
  {id: 'E-kills', t0: tE.recognize - 0.2, t1: tE.but + 1.3, draw: (t) => <Kills t={t} cam={CAM_K(t)} />},
];
export const KILL_CAM = CAM_K;
export const tEdone = tE.but;
export const _e = {SURF_S, AIBack, H, W, rand};
