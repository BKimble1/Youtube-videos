// SEQUENCE D, V4 (97.7 – 166.6 s): one physical world from the designed molecule to the first immune kills.
// The modelled weak protein becomes the real target (designed candidates approach its pocket in a crowded molecular
// environment; two stop at the rim, one turns, seats and the pocket closes on it). The camera pulls back while copies
// of it are packed into a lipid nanoparticle that drifts with the blood. ONE carrier is followed: through a leaky
// stretch of vessel wall, past an unmarked healthy cell (it touches, nothing binds), onto the markers of one cancer
// cell, into it, open, and its payload blocks the same protein inside. Then, in the same place:
//   that cell dies by ordered apoptosis in close-up and a macrophage swallows the remains; the camera pulls back across
//   the treated stretch (healthy cells intact, treated cells dying and being cleared); a sparsely marked survivor
//   changes its marker, new carriers no longer bind, and it founds a resistant colony by real divisions;
//   the camera tilts up into the vessel above the colony: white cells roll along the wall, one stops, flattens and
//   squeezes through the wall (diapedesis); pulling back, the immune army crosses along the vessel and crawls to the
//   colony; there one colony cell withdraws its fingerprints (disguise), one switches a T cell off with checkpoint
//   shields (suppress), and others drift toward the healthy look (hard to recognise) — the camera pushes into that last
//   cell's membrane (fingerprints, sequence E).
//   After the receptor close-up the camera pulls back out of the same contact: a trained T cell docked on that cell
//   recognises, locks on and destroys it, crawls to the next, and more trained cells attack the colony.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {AIBack} from '../art/ai';
import {Protein, POCKET, Molecule, MOL_FIT, MOL_BAD1, MOL_BAD2, Mol} from '../art/protein';
import {RBC} from '../art/blood';
import {Cell2, ApoptoticCell, TCell2, HEALTHY, TUMOR, lookMix, Look} from '../art/tissue';
import {Fibres, ShieldLigands} from '../art/stroma';
import {TCR, Granules, Synapse, fingerPath} from '../art/immune';
import {Bokeh, Phagocyte, buildLineage, liveCells, LineageCell, LiveCell, relaxLeaves} from '../art/depth';

export const tD = {
  but: T('But identifying the weakness'), ai: T('AI can help scientists'), design: T('design molecules'), target: T('that target the proteins'), depend: T('depend on'), surviveE: TE('depend on to survive.'),
  imagine: T('Imagine microscopic drug carriers'), travel: T('traveling through the bloodstream'), recog: T('recognizing markers'), deliver: T('delivering their deadly payload'), directly: T('directly to the tumor.'),
  like: T('Like guided missiles'), scale: T('operating at a scale'), see: TE('anything you can see.'), goal: T('The goal?'), destroy: T('Destroy the cancer'), sparing: T('sparing as much healthy tissue'), possible: T('as possible.'),
  problem: T("But there's still a problem."), some: T('Some cancer cells can survive'), mutate: T('mutate,'), resistant: T('become resistant.'), weapon: T('So AI needs another weapon.'), army: T('Your body already has an army'),
  killing: T('killing cancer.'), immune: T("It's called your immune system."), systemE: TE("It's called your immune system."), problem2: T('The problem is that cancer'), disguise: T('disguise itself,'),
  suppress: T('suppress immune defenses,'), difficult: T('or become difficult'), recogE: TE('to recognize.'), tumors: T('But tumors can carry'),
  recognize: T('They recognize a cancer cell.'), lock: T('Lock onto it.'), destroy2: T('And destroy it.'), next1: T('Then they move to the next.'), next2: T('And the next.'), sudden: T('Suddenly, the tumor'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));

// ================================================================================================ protein + design
const MS = 0.8; // molecule scale at the pocket
const OUT: Pt = (() => { const l = Math.hypot(POCKET[0], POCKET[1]); return [POCKET[0] / l, POCKET[1] / l]; })(); // pocket opening direction
const PERP: Pt = [-OUT[1], OUT[0]];
const molCentroid = (m: Mol): Pt => [m.atoms.reduce((s, a) => s + a[0], 0) / m.atoms.length, m.atoms.reduce((s, a) => s + a[1], 0) / m.atoms.length];
const along2 = (d: number, side = 0): Pt => [POCKET[0] + OUT[0] * d + PERP[0] * side, POCKET[1] + OUT[1] * d + PERP[1] * side];
/** where a candidate's centroid is, and how it is turned: it tumbles in on a curved path (thermal motion that dies down
 *  as it nears the pocket), then either stops at the rim and backs off (does not fit) or turns into register and
 *  seats (fits). */
const candidate = (t: number, m: Mol, b0: number, fit: boolean, side: number) => {
  const build = lift(t, b0, b0 + 0.6);
  const approach = lift(t, b0 + 0.55, b0 + 1.2);
  const seat = fit ? lift(t, b0 + 1.25, b0 + 1.75) : 0;
  const recoil = fit ? 0 : lift(t, b0 + 1.3, b0 + 1.7);
  const fade = fit ? 0 : lift(t, b0 + 1.6, b0 + 1.9);
  const home = along2(760, side), rim = along2(fit ? 250 : 300, side * 0.15), back = along2(470, side * 0.6);
  const curve = Math.sin(approach * Math.PI) * 90 * (side >= 0 ? 1 : -1);
  const therm = (1 - approach) * (1 - seat);
  let c: Pt = [lerp(home[0], rim[0], approach) + PERP[0] * curve + 22 * therm * noise(t * 2.6, b0), lerp(home[1], rim[1], approach) + PERP[1] * curve + 22 * therm * noise(t * 2.6, b0 + 5)];
  if (fit) c = [lerp(c[0], POCKET[0], seat), lerp(c[1], POCKET[1], seat)];
  else c = [lerp(c[0], back[0], recoil), lerp(c[1], back[1], recoil)];
  const contact = fit ? 0 : Math.exp(-((t - b0 - 1.22) ** 2) / 0.01);
  const rot = (fit ? lerp(-55, 0, smooth(approach * 0.6 + seat * 0.4)) : lerp(35, 20, approach) + 8 * contact * Math.sin(t * 40)) + 26 * therm * noise(t * 1.9, b0 + 9);
  const cc = molCentroid(m);
  return {x: c[0] - cc[0] * MS, y: c[1] - cc[1] * MS, rot, built: build, op: 1 - fade, on: t > b0 - 0.05 && fade < 0.99, seat, contact};
};
const PRD = path([
  {t: tD.but, x: POCKET[0] - 80, y: POCKET[1] + 60, z: 0.6, rot: 0},
  {t: tD.ai, x: POCKET[0] + 120, y: POCKET[1] - 60, z: 0.55, rot: -3},
  {t: tD.target + 1.2, x: POCKET[0] + 30, y: POCKET[1] - 20, z: 0.82, rot: -1},
  {t: tD.imagine - 0.3, x: POCKET[0], y: POCKET[1], z: 0.92, rot: 0},
]);
/** The crowded inside of the cell around the target: other proteins at two depths and drifting small solutes, so the
 *  docking happens in an environment rather than on an empty backdrop. */
const MolEnv: React.FC<{t: number; cam: Cam; op: number}> = ({t, cam, op}) => (
  <g opacity={op}>
    <g transform={camTransform(cam, 0.45)}>
      {Array.from({length: 7}, (_, k) => {
        const x = -2600 + k * 900 + 120 * Math.sin(k * 2.1), y = (k % 2 ? -900 : 950) + 160 * Math.sin(k * 1.3) + 30 * Math.sin(t * 0.4 + k);
        return (
          <g key={k} transform={`translate(${x} ${y}) scale(${0.55 + 0.2 * rand(k)})`}>
            {Array.from({length: 9}, (_, m) => <circle key={m} cx={Math.cos(m * 0.7 + k) * 160 * rand(k * 9 + m)} cy={Math.sin(m * 0.7 + k) * 140 * rand(k * 7 + m)} r={90 + 40 * rand(m + k)} fill="#3A1A4A" />)}
          </g>
        );
      })}
    </g>
    <g transform={camTransform(cam, 0.75)}>
      {Array.from({length: 26}, (_, k) => {
        const x = -2200 + ((k * 337 + t * (30 + 25 * rand(k))) % 4400), y = -1300 + rand(k * 5) * 2600 + 40 * Math.sin(t * 0.8 + k);
        return <circle key={k} cx={x} cy={y} r={14 + 10 * rand(k * 3)} fill={k % 4 ? '#6A3A7A' : '#7A5A3A'} opacity={0.5} />;
      })}
    </g>
  </g>
);
const ProteinD: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const dig = 1 - lift(t, tD.but + 0.8, tD.but + 2.6);
  const ghost = lift(t, tD.but + 0.8, tD.but + 1.6) * (1 - lift(t, tD.but + 2.4, tD.ai));
  const fitS = candidate(t, MOL_FIT, tD.target - 0.1, true, 0);
  const close = lift(t, tD.target + 1.5, tD.depend + 0.3);
  const blocked = lift(t, tD.depend, tD.surviveE + 0.2);
  const cands: [Mol, number, boolean, number][] = [[MOL_BAD1, tD.ai + 0.1, false, -260], [MOL_BAD2, tD.design + 0.1, false, 260], [MOL_FIT, tD.target - 0.1, true, 0]];
  const mols = cands.map(([m, b0, fit, side], k) => {
    const s = candidate(t, m, b0, fit, side);
    if (!s.on) return null;
    return <Molecule key={k} mol={m} x={s.x} y={s.y} rot={s.rot} s={MS} built={s.built} digital={0.55 * (1 - s.seat)} bad={0} op={s.op} />;
  });
  return (
    <g>
      <rect width={W} height={H} fill={mixHex('#22102E', P.aiBg, dig)} />
      <AIBack cam={cam} t={t} op={dig * 0.6} />
      <rect width={W} height={H} fill="url(#glowMag)" opacity={0.12 * (1 - dig)} />
      <MolEnv t={t} cam={cam} op={1 - dig} />
      <g transform={camTransform(cam)}>
        <circle cx={-80} cy={60} r={900} fill="url(#glowMag)" opacity={(1 - blocked) * (0.12 + 0.08 * Math.sin(t * 5)) * (1 - dig)} />
        <Protein t={t} digital={dig} pocketGlow={0.45 * (1 - fitS.seat) * lift(t, tD.but, tD.but + 0.6)} breathe={1 - 0.8 * blocked} layer="back" close={close} />
        {mols}
        <Protein t={t} digital={dig} breathe={1 - 0.8 * blocked} layer="front" close={close} />
        {ghost > 0.01 && <g opacity={ghost * 0.6}><Protein t={t} digital={1} breathe={0} op={0.35} /></g>}
      </g>
      <Bokeh cam={cam} t={t} fill="url(#bokehDeep)" op={1 - dig} n={7} size={300} />
    </g>
  );
};

// ================================================================================================ the carrier (nano units: carrier r = 300)
const CR = 300;
const lipidSlots = (() => {
  const out: {a: number; r: number; inner: boolean; k: number}[] = [];
  for (let k = 0; k < 44; k++) out.push({a: (k / 44) * Math.PI * 2, r: CR, inner: false, k});
  for (let k = 0; k < 34; k++) out.push({a: (k / 34) * Math.PI * 2 + 0.05, r: CR - 92, inner: true, k: k + 44});
  return out;
})();
const CORE = Array.from({length: 7}, (_, k) => {
  const a = (k / 7) * Math.PI * 2 + 0.3;
  const d = k === 0 ? 0 : 110;
  return {x: Math.cos(a) * d - 30, y: Math.sin(a) * d - 15, rot: k * 51};
});
const PS = 0.2;
export const CarrierBody: React.FC<{t: number; asm: number; lig: number; open?: number; payload?: boolean}> = ({t, asm, lig, open = 0, payload = true}) => (
  <g>
    {payload && CORE.map((c, k) => <Molecule key={k} mol={MOL_FIT} x={c.x} y={c.y} rot={c.rot} s={PS} op={1} />)}
    {lipidSlots.map((l) => {
      const st = rand(l.k * 7 + 1) * 0.45;
      const u = smooth(clamp01((asm - st) / 0.55));
      const fa = l.a + (rand(l.k) - 0.5) * 2, fr = 900 + 500 * rand(l.k * 3);
      const lower = Math.max(0, Math.sin(l.a));
      const a = lerp(fa, l.a, u) + open * (l.a < Math.PI / 2 ? -0.35 : 0.35) * lower;
      const r = lerp(fr, l.r, u) + open * 120 * lower;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      const tail = l.inner ? 1 : -1;
      return (
        <g key={l.k} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI})`} opacity={Math.min(1, u * 3 + 0.2) * (1 - 0.5 * open * lower)}>
          <line x1={0} y1={-4} x2={tail * 40} y2={-6} stroke="#F4E2C8" strokeWidth={5} strokeLinecap="round" />
          <line x1={0} y1={4} x2={tail * 40} y2={6} stroke="#F4E2C8" strokeWidth={5} strokeLinecap="round" />
          <circle r={17} fill={P.carrierShell} />
          <circle r={17} fill="url(#vol)" />
        </g>
      );
    })}
    {lig > 0.01 && Array.from({length: 9}, (_, k) => {
      const a = (k / 9) * Math.PI * 2 + 0.2;
      const L = 120 * smooth(lig * 1.5 - k * 0.05) * (1 - 0.6 * open);
      return (
        <g key={'g' + k} transform={`rotate(${(a * 180) / Math.PI}) translate(${CR + 16} 0)`}>
          <line x1={0} y1={0} x2={L} y2={0} stroke={P.ligand} strokeWidth={14} strokeLinecap="round" />
          <line x1={L} y1={0} x2={L * 1.35} y2={-L * 0.3} stroke={P.ligand} strokeWidth={14} strokeLinecap="round" />
          <line x1={L} y1={0} x2={L * 1.35} y2={L * 0.3} stroke={P.ligand} strokeWidth={14} strokeLinecap="round" />
        </g>
      );
    })}
  </g>
);
const M0C: Pt = (() => { const c = molCentroid(MOL_FIT); return [CORE[0].x + c[0] * PS, CORE[0].y + c[1] * PS]; })();
const CB_H: [number, number] = [tD.imagine - 0.3, tD.imagine + 0.15];
const NAC = path([
  {t: CB_H[0], x: M0C[0], y: M0C[1], z: (PRD(CB_H[0]).z * MS) / PS, rot: 0},
  {t: tD.imagine + 0.9, x: M0C[0] * 0.4, y: M0C[1] * 0.4, z: 1.45, rot: 4},
  {t: tD.travel - 0.2, x: 30, y: 10, z: 0.95, rot: 8},
]);
/** The carrier assembles in plasma: red cells stream past at two depths (the flow it is carried by), the nearest ones
 *  out of focus. */
const CarrierBuild: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const asm = lift(t, tD.imagine + 0.05, tD.imagine + 1.1);
  const lig = lift(t, tD.imagine + 0.9, tD.imagine + 1.5);
  const flowK = lift(t, tD.imagine + 0.3, tD.imagine + 1.4);
  const sh = (t - tD.imagine) * 900 * flowK;
  return (
    <g>
      <rect width={W} height={H} fill={P.blood} />
      <rect width={W} height={H} fill="url(#bloodDepth)" opacity={0.6} />
      <g transform={camTransform(cam, 0.45)}>
        {Array.from({length: 10}, (_, k) => {
          const x = ((-2600 + k * 560 + sh * 0.6) % 5600 + 5600) % 5600 - 2800;
          return <RBC key={k} x={x} y={(k % 2 ? -720 : 700) + 140 * Math.sin(k * 1.7)} r={330} tilt={clamp01(0.4 + 0.3 * Math.sin(t * 0.7 + k))} rot={k * 30 + t * 8} dark={0.6} />;
        })}
      </g>
      <g transform={camTransform(cam)}>
        <CarrierBody t={t} asm={asm} lig={lig} />
      </g>
      <g transform={camTransform(cam, 1.9)} opacity={0.5 * flowK}>
        {Array.from({length: 4}, (_, k) => {
          const x = ((-2000 + k * 1300 + sh * 1.4) % 5200 + 5200) % 5200 - 2600;
          return <RBC key={k} x={x} y={k % 2 ? -560 : 600} r={420} tilt={0.5} rot={k * 40} dark={0.25} />;
        })}
      </g>
    </g>
  );
};

// ================================================================================================ the vessel + tissue world (vessel units)
const LUM: [number, number] = [-1000, -80];           // lumen y range
const LEAK: [number, number] = [1650, 4700];          // leaky wall section (over the tumour)
const CELL_R = 92, CSP = 200;
const tumorAt = (x: number, y: number) => x > 1900 + 160 * Math.sin(y * 0.01) && x < 5300 + 120 * Math.sin(y * 0.013);
type TC = {i: number; j: number; x: number; y: number; seed: number; tumor: boolean};
const tissueCells: TC[] = (() => {
  const out: TC[] = [];
  for (let j = 0; j < 9; j++)
    for (let i = -14; i < 50; i++) {
      const x = i * CSP + (j % 2 ? CSP / 2 : 0) + (rand(i * 31 + j * 7) - 0.5) * 30, y = 120 + j * CSP * 0.866 + (rand(i * 17 + j * 3) - 0.5) * 24;
      out.push({i, j, x, y, seed: i * 13 + j * 71 + 3, tumor: tumorAt(x, y)});
    }
  return out;
})();
const cellNear = (x: number, j: number, tumor: boolean) => tissueCells.filter((c) => c.j === j && c.tumor === tumor).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
const HCELL = cellNear(1950, 0, false);
const STAR = cellNear(2250, 0, true);
const RES = cellNear(2420, 1, true);
const RES2 = cellNear(3300, 2, true), RES3 = cellNear(2700, 3, true);
const RESL = [RES, RES2, RES3];
const STAR_PT: Pt = [STAR.x - 30, STAR.y - CELL_R - 22];
const H_PT: Pt = [HCELL.x + 10, HCELL.y - CELL_R - 22];
const BIND = tissueCells.filter((c) => c.tumor && c.j <= 1 && c !== STAR && !RESL.includes(c)).map((c, k) => ({cell: c, ang: -Math.PI / 2 + (rand(k * 3) - 0.5) * 1.6, t0: tD.recog - 0.4 + rand(k * 5) * 1.6, gx: c.x + (rand(k) - 0.5) * 200}));
// apoptosis: the bound cell first, in close-up; then the other treated cells, nearest first; survivors never
const STAR_DIE: [number, number] = [tD.like + 0.6, tD.like + 3.5];
const dieAt = (c: {x: number; seed: number}) => tD.goal - 1.6 + 0.8 * rand(c.seed * 3) + (Math.abs(c.x - STAR.x) / 2600) * 3.4;
const DIE_DUR = 2.4;

// ------------------------------------------------------------------------------------------------ clean-up: macrophages swallow the remains; the rest is cleared over the next seconds
const deadCell = (x: number, j: number) => tissueCells.filter((c) => c.j === j && c.tumor && !RESL.includes(c) && c !== STAR).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
const MACS = [
  {target: STAR, from: [STAR.x - 560, STAR.y + 520] as Pt, arrive: STAR_DIE[1] + 0.1, eat: STAR_DIE[1] + 0.9},
  {target: deadCell(2560, 3), from: [2150, 1300] as Pt, arrive: tD.sparing - 0.5, eat: tD.sparing + 0.3},
  {target: deadCell(2980, 2), from: [3350, 1250] as Pt, arrive: tD.sparing + 0.4, eat: tD.sparing + 1.2},
].map((m) => ({...m, ang: Math.atan2(m.target.y - m.from[1], m.target.x - m.from[0])}));
const MAC_R = 112;
const macPos = (m: (typeof MACS)[0], t: number): Pt => {
  const end: Pt = [m.target.x - Math.cos(m.ang) * (MAC_R + 30), m.target.y - Math.sin(m.ang) * (MAC_R + 30)];
  const k = lift(t, m.arrive - 1.1, m.arrive);
  const after = Math.max(0, t - (m.eat + 1.2));
  const swallow = lift(t, m.eat, m.eat + 1.0) * 0.55;
  return [lerp(m.from[0], end[0], k) + Math.cos(m.ang) * (MAC_R * swallow + 40 * after), lerp(m.from[1], end[1], k) + Math.sin(m.ang) * (MAC_R * swallow + 40 * after)];
};
const eatenBy = new Map(MACS.map((m) => [m.target, m] as const));
/** when a dead cell's remains are gone (swallowed in view, or cleared off-screen over the following seconds) */
const clearAt = (c: TC) => (eatenBy.has(c) ? eatenBy.get(c)!.eat + 0.4 : (c === STAR ? STAR_DIE[1] : dieAt(c) + DIE_DUR) + 1.6 + 3.2 * rand(c.seed * 11));

// ------------------------------------------------------------------------------------------------ the resistant colony (real divisions from the survivors)
const RESIST_D: Look = lookMix(TUMOR, {...TUMOR, fill: '#B8603E', light: '#E8986E'}, 0.45);
const L1 = buildLineage({x: RES.x, y: RES.y, r: CELL_R, seed: RES.seed, axis: 18}, [tD.resistant + 0.1, tD.resistant + 2.0, tD.resistant + 4.3], -99, 1.02, 'a');
const L2 = buildLineage({x: RES2.x, y: RES2.y, r: CELL_R, seed: RES2.seed, axis: 70}, [tD.resistant + 0.7, tD.resistant + 3.0], -99, 1.02, 'b');
const L3 = buildLineage({x: RES3.x, y: RES3.y, r: CELL_R, seed: RES3.seed, axis: 150}, [tD.resistant + 1.0, tD.resistant + 3.4], -99, 1.02, 'c');
const LINEAGES = [L1, L2, L3];
relaxLeaves(LINEAGES, CELL_R * 1.8);
const colonyAt = (t: number): LiveCell[] => LINEAGES.flatMap((l) => liveCells(l, t));
const SETTLED = colonyAt(tD.problem2);
const pick = (f: (c: LiveCell) => number) => SETTLED.slice().sort((a, b) => f(a) - f(b))[0];
// the three evasion beats run left to right along the colony, so the camera never reverses
const near = (x: number, y: number, not: LiveCell[] = []) => pick((c) => (not.includes(c) ? 1e9 : Math.hypot(c.x - x, c.y - y)));
const R1 = pick((c) => c.x + 2 * c.y);                               // upper left: hides its fingerprints
const R2 = near(2560, 180, [R1]);                                     // upper middle: switches a T cell off
const R3 = near(3460, 380, [R1, R2]);                                 // right: blends in (and is zoomed into)
const R4 = near(3530, 560, [R1, R2, R3]);
const R5 = near(3330, 580, [R1, R2, R3, R4]);
const R6 = near(3277, 398, [R1, R2, R3, R4, R5]);
const roleOf = new Map<string, number>([[R1.node.id, 1], [R2.node.id, 2], [R3.node.id, 3], [R4.node.id, 4], [R5.node.id, 5], [R6.node.id, 6]]);
const posOf = (c: LiveCell): Pt => [c.x, c.y];

// ------------------------------------------------------------------------------------------------ the immune army: rolling, crossing the wall, crawling to the colony
const GAPS = [1920, 2480, 3040, 3600, 4160];
const IMM_R = 46;
const ROLL_Y = LUM[1] - IMM_R - 4;
type Imm = {k: number; gap: number; stop: number; v0: number; target: Pt; speed: number; nk?: boolean};
const crawlStop = (to: Pt, from: Pt, gapR: number): Pt => { const a = Math.atan2(from[1] - to[1], from[0] - to[0]); return [to[0] + Math.cos(a) * gapR, to[1] + Math.sin(a) * gapR]; };
const TL: Imm = {k: 0, gap: 2480, stop: tD.army + 1.3, v0: 260, target: crawlStop(posOf(R1), [2480, 20], CELL_R + IMM_R + 6), speed: 150};
const TB: Imm = {k: 1, gap: 3040, stop: tD.army + 2.4, v0: 240, target: crawlStop(posOf(R2), [3040, 20], CELL_R + IMM_R - 4), speed: 170};
const TC_: Imm = {k: 2, gap: 3600, stop: tD.problem2 + 0.6, v0: 230, target: [R4.x + 300, R4.y + 380], speed: 160};
// the rest of the army crosses along the vessel and gathers round the lower side of the colony, away from the beats
const BEAT = [R1, R2, R3, R4, R5, R6];
const LOWER = SETTLED.filter((c) => !BEAT.includes(c) && c.y > 300 && Math.hypot(c.x - R3.x, c.y - R3.y) > 420 && Math.hypot(c.x - R4.x, c.y - R4.y) > 380);
const ARMY: Imm[] = [TL, TB, TC_, ...Array.from({length: 8}, (_, k) => {
  const gap = [1920, 3040, 4160, 1920, 3040, 4160, 3040, 1920][k];
  const tg = LOWER[(k * 3 + 1) % LOWER.length];
  const from: Pt = [gap, 20];
  return {k: k + 3, gap, stop: tD.army + 2.6 + 0.38 * k + 0.3 * rand(k * 7), v0: 220 + 60 * rand(k), target: crawlStop([tg.x, tg.y + 120], from, CELL_R + IMM_R + 60 + 60 * rand(k * 3)), speed: 120 + 50 * rand(k * 5), nk: k % 4 === 2};
})];
const CROSS = 1.6;
/** where an immune cell is: rolling along the lower wall (decelerating to its gap), squeezing through it (m = share of
 *  the cell already below the wall), then crawling to its target. */
const immAt = (c: Imm, t: number) => {
  const T0 = 1.8;
  const dist = (tt: number) => (tt >= c.stop ? 0 : tt > c.stop - T0 ? (c.v0 * (c.stop - tt) ** 2) / (2 * T0) : (c.v0 * T0) / 2 + c.v0 * (c.stop - T0 - tt));
  // carried in the flow, a white cell drifts to the wall (margination), then rolls along it and stops
  const yFree = c === TL ? ROLL_Y : lerp(LUM[0] + 260, ROLL_Y - 90, rand(c.k * 17));
  if (t < c.stop + 0.35) return {phase: 0, x: c.gap - dist(t), y: lerp(yFree, ROLL_Y, lift(t, c.stop - 2.6, c.stop - 1.2)), m: 0, flat: lift(t, c.stop - 0.2, c.stop + 0.35) * 0.3};
  if (t < c.stop + 0.35 + CROSS) return {phase: 1, x: c.gap, y: ROLL_Y, m: smooth((t - c.stop - 0.35) / CROSS), flat: 0.3};
  const u = t - (c.stop + 0.35 + CROSS);
  const start: Pt = [c.gap, LUM[1] + 46 + IMM_R];
  const d = Math.hypot(c.target[0] - start[0], c.target[1] - start[1]);
  const go = Math.min(d, c.speed * u * smooth(Math.min(1, u / 0.6)));
  const k = d > 0 ? go / d : 1;
  return {phase: 2, x: lerp(start[0], c.target[0], k) + 10 * noise(t * 0.7, c.k) * (1 - k), y: lerp(start[1], c.target[1], k), m: 1, flat: 0, dir: Math.atan2(c.target[1] - start[1], c.target[0] - start[0]), arrived: k};
};

// ------------------------------------------------------------------------------------------------ the trained T cells (after the receptor close-up)
const TK_R = IMM_R;
const contactOn = (cell: Pt, from: Pt, press = 0.2): Pt => { const a = Math.atan2(from[1] - cell[1], from[0] - cell[0]); const d = CELL_R + TK_R * (1 - press) - 4; return [cell[0] + Math.cos(a) * d, cell[1] + Math.sin(a) * d]; };
const KK = {
  a: {cell: R3, rec: tD.recognize, lock: tD.lock, kill: tD.destroy2 + 0.15},
  b: {cell: R4, rec: tD.next1 + 1.0, lock: tD.next1 + 1.15, kill: tD.next1 + 1.35},
  c: {cell: R5, rec: tD.next2 + 0.05, lock: tD.next2 + 0.2, kill: tD.next2 + 0.4},
  d: {cell: R6, rec: tD.next2 + 0.35, lock: tD.next2 + 0.5, kill: tD.next2 + 0.7},
};
const KILL_DIE = 1.9;
const TK_FROM: Pt = [R3.x + 260, R3.y - 260];
const TK_A = contactOn(posOf(R3), TK_FROM);
const TK_B = contactOn(posOf(R4), [R4.x + 300, R4.y + 20]);
/** the lead trained T cell: docked on R3 when we arrive, then detaches and crawls round to R4 */
const tkPos = (t: number): {p: Pt; dir: number; flat: number; on: Pt} => {
  if (t < tD.next1 + 0.05) return {p: TK_A, dir: Math.atan2(R3.y - TK_A[1], R3.x - TK_A[0]), flat: 0.2 * (1 - lift(t, KK.a.kill + 0.5, tD.next1)), on: posOf(R3)};
  const k = lift(t, tD.next1 + 0.05, KK.b.rec);
  // the cell retracts from the dead target, then accelerates toward the next and decelerates into contact
  const mid: Pt = [Math.max(TK_A[0], TK_B[0]) + 90, lerp(TK_A[1], TK_B[1], 0.5)];
  const q = k < 0.5 ? [lerp(TK_A[0], mid[0], smooth(k * 2)), lerp(TK_A[1], mid[1], smooth(k * 2))] : [lerp(mid[0], TK_B[0], smooth((k - 0.5) * 2)), lerp(mid[1], TK_B[1], smooth((k - 0.5) * 2))];
  return {p: q as Pt, dir: Math.atan2(R4.y - q[1], R4.x - q[0]), flat: 0.2 * lift(t, KK.b.rec - 0.1, KK.b.lock), on: posOf(R4)};
};
const TK2_FROM: Pt = [R5.x - 380, R5.y + 300], TK3_FROM: Pt = [R6.x - 400, R6.y - 120];
const TK2 = contactOn(posOf(R5), TK2_FROM), TK3 = contactOn(posOf(R6), TK3_FROM);
const tk2Pos = (t: number): Pt => { const k = lift(t, KK.c.rec - 1.1, KK.c.rec); return [lerp(TK2_FROM[0], TK2[0], k), lerp(TK2_FROM[1], TK2[1], k)]; };
const tk3Pos = (t: number): Pt => { const k = lift(t, KK.d.rec - 1.1, KK.d.rec); return [lerp(TK3_FROM[0], TK3[0], k), lerp(TK3_FROM[1], TK3[1], k)]; };
const killState = (id: string, t: number) => {
  const r = roleOf.get(id);
  const kk = r === 3 ? KK.a : r === 4 ? KK.b : r === 5 ? KK.c : r === 6 ? KK.d : null;
  if (kk) return clamp01((t - kk.kill - 0.2) / KILL_DIE);
  // the rest of the colony falls as more trained cells arrive, after the camera starts to pull out
  return clamp01((t - (tD.sudden + 0.3 + 1.2 * rand(id.length * 7 + id.charCodeAt(id.length - 1)))) / KILL_DIE);
};

// ------------------------------------------------------------------------------------------------ the followed carrier
const FLOW = 700;
const SPK0: Pt = [700, -560];
const T_RIDE = tD.travel - 0.2;
const spkX = (t: number) => SPK0[0] + FLOW * (t - T_RIDE);
const T_EXIT = T_RIDE + (1920 - SPK0[0]) / FLOW;
const tc = {exit: T_EXIT, through: T_EXIT + 0.38, touch: T_EXIT + 0.85, bind: T_EXIT + 1.45};
const cpos = (t: number): Pt => {
  if (t < tc.exit) {
    const y = lerp(SPK0[1], LUM[1] - 70, lift(t, T_RIDE + 0.6, tc.exit));
    return [spkX(t), y + 18 * noise(t * 2, 4)];
  }
  const gapIn: Pt = [spkX(tc.exit), LUM[1] - 70];
  const gapOut: Pt = [gapIn[0] + 40, LUM[1] + 80];
  if (t < tc.through) { const k = lift(t, tc.exit, tc.through); return [lerp(gapIn[0], gapOut[0], k), lerp(gapIn[1], gapOut[1], k)]; }
  if (t < tc.touch) { const k = lift(t, tc.through, tc.touch); return [lerp(gapOut[0], H_PT[0], k) + 14 * noise(t * 3, 7), lerp(gapOut[1], H_PT[1], k)]; }
  const k = lift(t, tc.touch + 0.1, tc.bind);
  return [lerp(H_PT[0], STAR_PT[0], k) + 12 * noise(t * 3, 9) * (1 - k), lerp(H_PT[1], STAR_PT[1], k) - 40 * Math.sin(k * Math.PI)];
};
const VH: [number, number] = [tD.travel - 0.35, tD.travel + 0.05];
const NANO_S = 300 / 9;
const fromNano = (cn: Cam, t: number) => handoff(cn, [0, 0], cpos(t), 1 / NANO_S);
const N2H: [number, number] = [tD.deliver - 0.55, tD.deliver - 0.25];
const DV_OFF = path([
  {...(() => { const c = fromNano(NAC(VH[1]), VH[1]); const p = cpos(VH[1]); return {...c, x: c.x - p[0], y: c.y - p[1]}; })(), t: VH[1]},
  {t: tD.travel + 0.9, x: 300, y: 80, z: 0.55, rot: 2},
  {t: tc.exit, x: 120, y: 200, z: 0.85, rot: 0},
  {t: tc.touch, x: 120, y: 160, z: 1.25, rot: 0},
  {t: tc.bind, x: 60, y: 70, z: 1.6, rot: 0},
  {t: N2H[1], x: 0, y: 0, z: 9, rot: 0},
]);
const DV = (t: number): Cam => { const o = DV_OFF(t); const p = cpos(Math.min(t, tc.bind)); return {...o, x: o.x + p[0], y: o.y + p[1]}; };

// ------------------------------------------------------------------------------------------------ inside that cell (nano units; membrane at y = 0)
const N2_ANCH: Pt = [0, -470];
const toNano2 = (cv: Cam) => handoff(cv, STAR_PT, N2_ANCH, NANO_S);
const TARGETS: Pt[] = [[-1150, 1150], [330, 1020], [-430, 1250], [1150, 1300]];
const TS_ = 0.32;
const N2 = path([
  {...toNano2(DV(N2H[1])), t: N2H[1]},
  {t: tD.deliver + 0.6, x: 0, y: -120, z: 0.6, rot: 0},
  {t: tD.deliver + 1.15, x: 120, y: 420, z: 0.62, rot: 0},
  {t: tD.directly + 0.05, x: 330 + POCKET[0] * TS_, y: 1020 + POCKET[1] * TS_, z: 1.15, rot: 0},
  {t: tD.like + 0.15, x: 200, y: 900, z: 0.7, rot: 0},
]);
const N2_OUT: [number, number] = [tD.like + 0.05, tD.like + 0.45];
const fromNano2 = (cn: Cam) => handoff(cn, N2_ANCH, STAR_PT, 1 / NANO_S);

// ------------------------------------------------------------------------------------------------ the world camera after the delivery
const COLONY_C: Pt = [SETTLED.reduce((s, c) => s + c.x, 0) / SETTLED.length, SETTLED.reduce((s, c) => s + c.y, 0) / SETTLED.length];
/** the point on R3's membrane the camera pushes into for the fingerprints (sequence E) */
export const SURF_ANGLE = -Math.PI * 0.62;
export const SURF_PT: Pt = [R3.x + Math.cos(SURF_ANGLE) * CELL_R, R3.y + Math.sin(SURF_ANGLE) * CELL_R];
const tlAt = (t: number) => immAt(TL, t);
export const DV2 = path([
  {...fromNano2(N2(N2_OUT[0])), t: N2_OUT[0]},
  {t: tD.like + 0.85, x: STAR.x + 10, y: STAR.y - 10, z: 2.3, rot: 0},
  {t: STAR_DIE[1], x: STAR.x + 25, y: STAR.y + 10, z: 2.5, rot: 0},
  {t: tD.destroy + 0.3, x: 2060, y: 560, z: 0.86, rot: -2},
  {t: tD.possible + 0.2, x: 2640, y: 600, z: 0.84, rot: -1},
  {t: tD.some - 0.3, x: RES.x, y: RES.y + 20, z: 1.5, rot: 0},
  {t: tD.resistant + 0.1, x: RES.x + 15, y: RES.y + 20, z: 1.62, rot: 0},
  {t: tD.weapon + 0.9, x: COLONY_C[0] - 120, y: COLONY_C[1] - 60, z: 1.0, rot: 0},
  {t: tD.army - 0.15, x: 2330, y: -300, z: 1.35, rot: 0},
  {t: tD.army + 0.7, x: tlAt(tD.army + 0.7).x + 60, y: -260, z: 2.2, rot: 0},
  {t: TL.stop + 0.2, x: TL.gap, y: -190, z: 2.55, rot: 0},
  {t: TL.stop + 0.35 + CROSS * 0.7, x: TL.gap, y: -90, z: 2.6, rot: 0},
  {t: tD.immune + 0.35, x: TL.gap + 30, y: 60, z: 2.1, rot: 0},
  {t: tD.systemE + 0.2, x: 2750, y: 280, z: 0.92, rot: 0},
  {t: tD.disguise - 0.3, x: R1.x + 40, y: R1.y - 30, z: 2.1, rot: 0},
  {t: tD.disguise + 0.65, x: R1.x + 70, y: R1.y - 25, z: 2.15, rot: 0},
  {t: tD.suppress + 0.15, x: R2.x + 10, y: R2.y - 40, z: 2.1, rot: 0},
  {t: tD.suppress + 0.95, x: R2.x + 30, y: R2.y - 40, z: 2.15, rot: 0},
  {t: tD.difficult + 0.65, x: (R3.x + R4.x) / 2 - 80, y: (R3.y + R4.y) / 2, z: 1.65, rot: 0},
  {t: tD.recogE + 0.2, x: SURF_PT[0], y: SURF_PT[1] + 30, z: 2.5, rot: 0},
  {t: tD.tumors + 0.45, x: SURF_PT[0], y: SURF_PT[1], z: 16, rot: 0},
]);
/** kills: the camera arrives (from the receptor close-up) at the contact between the trained T cell and R3 */
/** direction from R3 to the docked T cell, and the contact point on R3's membrane */
export const KILL_ANG = Math.atan2(TK_A[1] - R3.y, TK_A[0] - R3.x);
export const KILL_PT: Pt = [R3.x + Math.cos(KILL_ANG) * (CELL_R - 4), R3.y + Math.sin(KILL_ANG) * (CELL_R - 4)];
export const R3_LOOK_CAMO = 0.62;
export const KILL_IN: [number, number] = [tD.recognize - 0.35, tD.recognize + 0.05];
const KCAM = path([
  {t: KILL_IN[0], x: KILL_PT[0], y: KILL_PT[1], z: 4.2, rot: 0},
  {t: tD.recognize + 0.8, x: KILL_PT[0] - 20, y: KILL_PT[1], z: 2.1, rot: 0},
  {t: tD.next1, x: KILL_PT[0] + 20, y: KILL_PT[1] - 10, z: 1.95, rot: 0},
  {t: KK.b.rec + 0.2, x: (TK_B[0] + R4.x) / 2, y: (TK_B[1] + R4.y) / 2, z: 1.6, rot: 0},
  {t: tD.next2 + 0.5, x: 3400, y: 500, z: 1.1, rot: 0},
  {t: tD.sudden + 0.2, x: COLONY_C[0] + 40, y: COLONY_C[1], z: 0.85, rot: 0},
  {t: tD.sudden + 1.25, x: COLONY_C[0] + 300, y: 0, z: 0.2, rot: 0},
]);
export const KCAM_EXPORT = KCAM;
export const KILL_OUT = tD.sudden + 0.55; // the tumour-scale shot dissolves in from here

// ------------------------------------------------------------------------------------------------ markers and fingerprints
const Markers: React.FC<{c: {x: number; y: number; seed: number}; n: number; k: number; alt: number; t: number; z?: number}> = ({c, n, k, alt, t, z = 1}) => (
  <g opacity={k}>
    {Array.from({length: n}, (_, m) => {
      const a = (m / n) * Math.PI * 2 + c.seed;
      const x = c.x + Math.cos(a) * CELL_R * 0.98, y = c.y + Math.sin(a) * CELL_R * 0.98;
      const sz = (9 + 0.6 * Math.sin(t * 3 + m)) * Math.min(1, 3 / z);
      return <rect key={m} x={x - sz} y={y - sz} width={sz * 2} height={sz * 2} rx={lerp(sz, 2.5, alt)} fill={mixHex(P.marker, P.markerAlt, alt)} transform={`rotate(${(a * 180) / Math.PI + 45 * alt} ${x} ${y})`} />;
    })}
  </g>
);
/** neoantigen fingerprints displayed on a colony cell (k = how far they stand out of the membrane) */
const Flags: React.FC<{x: number; y: number; seed: number; k: number; lit?: number}> = ({x, y, seed, k, lit = 0}) => (k <= 0.01 ? null : (
  <g>
    {Array.from({length: 6}, (_, m) => {
      const a = (m / 6) * Math.PI * 2 + seed;
      const px = x + Math.cos(a) * CELL_R * 0.96, py = y + Math.sin(a) * CELL_R * 0.96;
      return (
        <g key={m} transform={`translate(${px} ${py}) rotate(${(a * 180) / Math.PI + 90}) scale(${0.38 * k})`}>
          {lit > 0.01 && <circle cy={-40} r={110} fill="url(#glowGold)" opacity={lit * 0.6} />}
          <path d={fingerPath(m % 3)} fill={P.neoantigen} stroke="#B89A20" strokeWidth={5} />
        </g>
      );
    })}
  </g>
));
/** A carrier at vessel scale: the full particle when close, a glinting speck when far. */
const Speck: React.FC<{x: number; y: number; t: number; z: number; seed: number; gold?: boolean}> = ({x, y, t, z, seed, gold}) =>
  9 * z > 16 ? (
    <g transform={`translate(${x} ${y}) rotate(${t * 20 * (rand(seed) - 0.5)}) scale(${9 / 300})`}><CarrierBody t={t} asm={1} lig={1} /></g>
  ) : (
    <g>
      <circle cx={x} cy={y} r={24} fill={gold ? 'url(#glowGold)' : 'url(#glowAi)'} opacity={gold ? 0.7 : 0.45} />
      <circle cx={x} cy={y} r={9} fill={P.carrier} stroke={P.ligand} strokeWidth={3} />
    </g>
  );

/** An immune cell part-way through the vessel wall: the share m is already below the wall, joined through the gap. */
const Crossing: React.FC<{x: number; m: number; t: number; seed: number; lod: number; color?: string; light?: string}> = ({x, m, t, seed, lod, color, light}) => {
  const rU = IMM_R * Math.sqrt(Math.max(0.02, 1 - m)) * 1.05, rL = IMM_R * Math.sqrt(Math.max(0.02, m)) * 1.05;
  const yU = LUM[1] - rU * 0.75, yL = LUM[1] + 46 + rL * 0.8;
  const c = color ?? P.tcell;
  return (
    <g>
      {m < 0.97 && <TCell2 x={x} y={yU} r={rU} t={t} seed={seed} dir={Math.PI / 2} lod={lod} flat={{a: Math.PI / 2, d: 0.28}} color={color} light={light} spikes={0.6} />}
      <rect x={x - 17} y={LUM[1] - 6} width={34} height={58} rx={16} fill={mixHex(c, '#0A4A44', 0.25)} />
      <rect x={x - 11} y={LUM[1] - 2} width={22} height={50} rx={11} fill={c} />
      {m > 0.03 && <TCell2 x={x} y={yL} r={rL} t={t} seed={seed + 1} dir={Math.PI / 2} lod={lod} color={color} light={light} spikes={0.6 * m} />}
    </g>
  );
};

const VesselD: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = CELL_R * cam.z;
  const hw = W / 2 / cam.z + 300;
  const x0 = cam.x - hw, x1 = cam.x + hw;
  const hh = H / 2 / cam.z + 300;
  const flowT = t * FLOW;
  const rbcs: React.ReactNode[] = [], farRbc: React.ReactNode[] = [];
  const S = 260;
  for (let i = Math.floor((x0 - flowT) / S); i <= Math.ceil((x1 - flowT) / S); i++)
    for (let k = 0; k < 2; k++) {
      const sd = ((i % 911) + 911) % 911 * 5 + k * 77;
      const x = i * S + flowT * 0.9 + rand(sd) * S, y = lerp(LUM[0] + 70, LUM[1] - 70, rand(sd + 1));
      rbcs.push(<RBC key={`${i}-${k}`} x={x} y={y} r={40} tilt={clamp01(0.5 + 0.5 * Math.sin(t + sd))} rot={rand(sd + 2) * 180 + t * 20} dark={0.1} />);
      const xf = i * S + flowT * 0.62 + rand(sd + 9) * S, yf = lerp(LUM[0] + 60, LUM[1] - 60, rand(sd + 5));
      farRbc.push(<RBC key={`f${i}-${k}`} x={xf} y={yf} r={30} tilt={0.4} rot={rand(sd + 3) * 180} dark={0.55} />);
    }
  const specks: React.ReactNode[] = [];
  const SS = 110;
  if (t < tD.see)
    for (let i = Math.floor((x0 - flowT) / SS); i <= Math.ceil((x1 - flowT) / SS); i++) {
      const sd = ((i % 733) + 733) % 733 * 3 + 9;
      const x = i * SS + flowT + rand(sd) * SS, y = lerp(LUM[0] + 40, LUM[1] - 150, rand(sd + 1)) + 30 * noise(t + sd, 2);
      specks.push(<Speck key={i} x={x} y={y} t={t} z={cam.z} seed={sd} />);
    }
  // back wall of the vessel seen through the plasma (elongated endothelial cells), darker = further away
  const backWall: React.ReactNode[] = [];
  if (cam.z > 0.7 && cam.y - hh < LUM[1])
    for (let i = Math.floor(x0 / 420) - 1; i <= Math.ceil(x1 / 420) + 1; i++)
      for (let j = 0; j < 4; j++) {
        const sd = ((i % 97) + 97) % 97 * 7 + j;
        const x = i * 420 + (j % 2 ? 210 : 0), y = LUM[0] + 130 + j * 240 + 30 * rand(sd);
        backWall.push(<g key={`bw${i},${j}`} opacity={0.5 * smooth((cam.z - 0.7) / 0.6)}><ellipse cx={x} cy={y} rx={200} ry={70} fill="#8E2236" /><ellipse cx={x + 40 * rand(sd + 1)} cy={y} rx={46} ry={20} fill="#6A1428" /></g>);
      }
  const wall: React.ReactNode[] = [];
  for (let i = Math.floor(x0 / 280) - 1; i <= Math.ceil(x1 / 280) + 1; i++) {
    const x = i * 280;
    const leaky = x > LEAK[0] && x < LEAK[1] && i % 2 === 0;
    const w = leaky ? 200 : 276;
    wall.push(<rect key={'b' + i} x={x} y={LUM[1]} width={w} height={46} rx={20} fill={P.vesselWall} />);
    wall.push(<rect key={'bh' + i} x={x + 10} y={LUM[1] + 4} width={w - 20} height={10} rx={5} fill={P.vesselWallLight} opacity={0.5} />);
    wall.push(<ellipse key={'n' + i} cx={x + w / 2} cy={LUM[1] + 23} rx={50} ry={14} fill="#8E2A3A" />);
    wall.push(<rect key={'t' + i} x={x} y={LUM[0] - 46} width={276} height={46} rx={20} fill={P.vesselWall} />);
  }
  const altK = lift(t, tD.mutate - 0.25, tD.mutate + 0.45);
  const fp = cpos(t);
  const followed = t < N2H[1] + 0.1;
  const touchK = Math.exp(-((t - tc.touch) ** 2) / 0.01);
  const bindK = lift(t, tc.bind - 0.15, tc.bind + 0.1);
  const clearK = lift(t, tD.problem, tD.weapon);
  const colony = t > tD.resistant - 1 ? colonyAt(t) : [];
  const showImm = t > tD.weapon - 0.5;
  const camo = lift(t, tD.difficult, tD.difficult + 0.8);
  const shield = lift(t, tD.suppress - 0.1, tD.suppress + 0.4);
  const tbDim = lift(t, tD.suppress + 0.35, tD.suppress + 1.0);
  const r1Hide = lift(t, tD.disguise, tD.disguise + 0.55);
  const tlAway = lift(t, tD.disguise + 0.5, tD.suppress + 0.6);
  const killing = t > KILL_IN[0];
  return (
    <g>
      <rect width={W} height={H} fill={P.tissueBgDeep} />
      <g transform={camTransform(cam)}>
        <rect x={x0} y={LUM[0]} width={x1 - x0} height={LUM[1] - LUM[0]} fill={P.blood} />
        <rect x={x0} y={LUM[0] - 3000} width={x1 - x0} height={3000} fill="#3A0612" />
        <rect x={x0} y={LUM[1]} width={x1 - x0} height={3000} fill={P.tissueBg} />
        {backWall}
        {cam.z > 0.7 && farRbc}
        {rbcs}
        {specks}
        {/* white cells rolling along the lower wall, crossing it, and crawling into the tissue */}
        {showImm && ARMY.map((c) => {
          const s = immAt(c, t);
          if (s.phase === 0 && (s.x < x0 - 200 || s.x > x1 + 200)) return null;
          const col = c.nk ? '#3FB8C8' : undefined;
          if (s.phase === 0) return <TCell2 key={'im' + c.k} x={s.x} y={s.y} r={IMM_R} t={t} seed={c.k + 3} dir={0} lod={IMM_R * cam.z} flat={{a: Math.PI / 2, d: s.flat}} color={col} lead={0.5} />;
          if (s.phase === 1) return <Crossing key={'im' + c.k} x={s.x} m={s.m} t={t} seed={c.k + 3} lod={IMM_R * cam.z} color={col} />;
          return null;
        })}
        {wall}
        {/* stroma left behind as the debris is cleared */}
        {clearK > 0.01 && <Fibres x0={1950} y0={160} x1={5200} y1={1500} t={t} op={0.55 * clearK} seed={7} />}
        {tissueCells.filter((c) => c.x > x0 - 200 && c.x < x1 + 200).map((c) => {
          if (!c.tumor) return <Cell2 key={c.i + ',' + c.j} x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={HEALTHY} flat={c === HCELL ? {a: Math.atan2(H_PT[1] - c.y, H_PT[0] - c.x), d: 0.07 * touchK} : undefined} />;
          if (RESL.includes(c)) return null;
          const die = c === STAR ? clamp01((t - STAR_DIE[0]) / (STAR_DIE[1] - STAR_DIE[0])) : clamp01((t - dieAt(c)) / DIE_DUR);
          const treated = c === STAR ? lift(t, tD.deliver + 0.6, tD.like) : lift(t, tD.deliver + 0.3 + rand(c.seed) * 0.6, tD.deliver + 1.3 + rand(c.seed) * 0.6);
          const ca = clearAt(c);
          if (t > ca + 1.0) return null;
          const eat = eatenBy.get(c);
          const mp = eat ? macPos(eat, t) : null;
          const sw = eat ? lift(t, eat.eat, eat.eat + 1.0) : 0;
          const cx = mp ? lerp(c.x, mp[0], sw * 0.8) : c.x, cy = mp ? lerp(c.y, mp[1], sw * 0.8) : c.y;
          const fade = eat ? 1 - sw : 1 - lift(t, ca, ca + 1.0);
          const nuc = 1.15 + 0.35 * rand(c.seed * 5);
          return (
            <g key={c.i + ',' + c.j} opacity={fade}>
              {die <= 0 ? <Cell2 x={cx} y={cy} r={CELL_R} seed={c.seed} t={t} lod={lod} look={TUMOR} irr={0.07} nucScale={nuc} round={0.15} flat={c === STAR ? {a: Math.atan2(STAR_PT[1] - c.y, STAR_PT[0] - c.x), d: 0.08 * bindK} : undefined} /> : <ApoptoticCell x={cx} y={cy} r={CELL_R * (1 - 0.35 * sw)} seed={c.seed} t={t} die={die} lod={lod} />}
              {die <= 0.25 && <Markers c={c} n={9} k={1 - die * 4} alt={0} t={t} z={cam.z} />}
              {treated > 0.01 && die < 0.35 && Array.from({length: 5}, (_, m) => <circle key={m} cx={c.x + Math.cos(m * 1.3 + c.seed) * CELL_R * 0.45} cy={c.y + Math.sin(m * 1.3 + c.seed) * CELL_R * 0.45} r={6} fill="#3A4656" stroke={P.aiHot} strokeWidth={1.5} opacity={treated * (1 - die * 3)} />)}
            </g>
          );
        })}
        {/* the survivors and the colony they found */}
        {t <= tD.resistant - 1 && RESL.map((c, ri) => (
          <g key={'res' + ri}>
            <Cell2 x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={lookMix(TUMOR, RESIST_D, altK)} irr={0.05} nucScale={1.25} round={0.2} />
            <Markers c={c} n={altK > 0.5 ? 7 : 3} k={1} alt={altK} t={t} z={cam.z} />
          </g>
        ))}
        {colony.map((c) => {
          const role = roleOf.get(c.node.id) ?? 0;
          const die = killing || t > KILL_IN[0] ? killState(c.node.id, t) : 0;
          const look = role === 3 || role === 4 ? lookMix(RESIST_D, HEALTHY, 0.62 * camo) : RESIST_D;
          const cell = {x: c.x, y: c.y, seed: c.node.seed};
          const tbS = immAt(TB, t);
          const pressFrom: Pt | null = role === 3 && t > KILL_IN[0] - 0.5 ? (t < tD.next1 + 0.05 ? tkPos(t).p : null) : role === 4 && t > KK.b.rec - 0.2 ? tkPos(t).p : role === 2 && t > tD.suppress - 0.4 ? [tbS.x, tbS.y] : null;
          const flat = pressFrom ? {a: Math.atan2(pressFrom[1] - c.y, pressFrom[0] - c.x), d: 0.08} : undefined;
          return (
            <g key={c.node.id}>
              {die <= 0 ? <LineageCell c={c} t={t} lod={lod} look={look} flat={flat} /> : <ApoptoticCell x={c.x} y={c.y} r={c.r} seed={c.node.seed} t={t} die={die} lod={lod} look={look} />}
              {c.dividing === 0 && die <= 0.2 && <Markers c={cell} n={7} k={(1 - die * 5) * (role === 3 || role === 4 ? 1 - 0.8 * camo : 1)} alt={altK} t={t} z={cam.z} />}
              {role === 1 && t < tD.suppress + 1 && <Flags x={c.x} y={c.y} seed={c.node.seed} k={lift(t, tD.problem2, tD.problem2 + 0.5) * (1 - r1Hide)} />}
              {role === 2 && <ShieldLigands x={c.x} y={c.y} r={CELL_R * 0.95} a0={Math.atan2(TB.target[1] - c.y, TB.target[0] - c.x) - 0.9} a1={Math.atan2(TB.target[1] - c.y, TB.target[0] - c.x) + 0.9} k={shield} n={7} size={30} />}
            </g>
          );
        })}
        {/* macrophages clearing the remains */}
        {MACS.map((m, k) => {
          if (t < m.arrive - 1.2 || t > m.eat + 4) return null;
          const p = macPos(m, t);
          const cup = lift(t, m.arrive - 0.3, m.arrive + 0.3) * (1 - lift(t, m.eat + 0.6, m.eat + 1.1));
          return <Phagocyte key={'mac' + k} x={p[0]} y={p[1]} r={MAC_R} t={t} seed={k + 5} to={m.ang} cup={cup} eaten={lift(t, m.eat, m.eat + 1.0)} op={lift(t, m.arrive - 1.2, m.arrive - 0.8)} dir={m.ang} />;
        })}
        {/* crawling immune cells (below the wall) */}
        {showImm && !killing && ARMY.map((c) => {
          const s = immAt(c, t);
          if (s.phase !== 2) return null;
          const isTB = c === TB, isTL = c === TL;
          let x = s.x, y = s.y, dir = s.dir ?? 0;
          if (isTL && tlAway > 0) { x -= tlAway * 170; y += tlAway * 90; dir = lerp(dir, Math.PI * 0.85, tlAway); }
          const probe = isTL ? lift(t, tD.problem2 + 0.4, tD.disguise) * (1 - r1Hide) : 0;
          const press = isTB ? 0.22 * lift(t, tD.suppress - 0.4, tD.suppress) : isTL ? 0.1 * probe : 0;
          return <TCell2 key={'tc' + c.k} x={x} y={y} r={IMM_R} t={t} seed={c.k + 3} dir={dir} lod={IMM_R * cam.z} color={c.nk ? '#3FB8C8' : undefined} dim={isTB ? tbDim : 0} spikes={isTB ? 1 - 0.7 * tbDim : 1} flat={press > 0 ? {a: dir, d: press} : undefined} lead={isTB ? 1 - tbDim : 1} />;
        })}
        {/* the trained T cells: recognise (receptor seated on fingerprint), lock (synapse), destroy (granules) */}
        {killing && (() => {
          const out: React.ReactNode[] = [];
          const tk = tkPos(t);
          const pairs: [Pt, Pt, {rec: number; lock: number; kill: number}, number][] = [
            [tk.p, tk.on, t < tD.next1 + 0.05 ? KK.a : KK.b, tk.flat],
            [tk2Pos(t), posOf(R5), KK.c, 0.2 * lift(t, KK.c.rec - 0.1, KK.c.lock)],
            [tk3Pos(t), posOf(R6), KK.d, 0.2 * lift(t, KK.d.rec - 0.1, KK.d.lock)],
          ];
          pairs.forEach(([p, tgt, kk, flat], n) => {
            if (n > 0 && t < kk.rec - 1.15) return;
            const ang = Math.atan2(tgt[1] - p[1], tgt[0] - p[0]);
            const rec = lift(t, kk.rec - 0.15, kk.rec + 0.25) * (1 - lift(t, kk.kill + 0.6, kk.kill + 1.0));
            const lock = lift(t, kk.lock, kk.lock + 0.3) * (1 - lift(t, kk.kill + 0.7, kk.kill + 1.0));
            out.push(<Synapse key={'sy' + n} a={p} b={tgt} k={lock} rA={IMM_R} />);
            if (rec > 0.01) [-1, 0, 1].forEach((m) => {
              const cxp = p[0] + Math.cos(ang) * (IMM_R * 0.86) - Math.sin(ang) * m * 15, cyp = p[1] + Math.sin(ang) * (IMM_R * 0.86) + Math.cos(ang) * m * 15;
              out.push(
                <g key={`pr${n}${m}`} transform={`translate(${cxp} ${cyp}) rotate(${(ang * 180) / Math.PI})`} opacity={rec}>
                  <g transform={`translate(-2 0) rotate(90) scale(0.065)`}><TCR x={0} y={0} t={t} learn={1} kind={m + 1} gold={0.3 * rec} /></g>
                  <path d={fingerPath(m + 1)} transform="translate(9 0) rotate(-90) scale(0.11)" fill={P.neoantigen} />
                </g>,
              );
            });
            out.push(<Granules key={'gr' + n} a={p} b={tgt} t={t} t0={kk.kill} n={8} r={6} />);
            out.push(<TCell2 key={'tk' + n} x={p[0]} y={p[1]} r={TK_R} t={t} seed={60 + n} dir={ang} lod={TK_R * cam.z} act={0.35 + 0.4 * lock} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} flat={flat > 0.01 ? {a: ang, d: flat} : undefined} />);
          });
          return out;
        })()}
        {/* the rest of the army, now carrying trained receptors, closes on the colony as the camera pulls out */}
        {killing && ARMY.filter((c) => c !== TB).map((c) => {
          const s = immAt(c, t);
          const go = lift(t, tD.next2, tD.sudden + 1.0);
          const tg: Pt = [lerp(s.x, COLONY_C[0], 0.25 * go), lerp(s.y, COLONY_C[1], 0.25 * go)];
          return <TCell2 key={'ta' + c.k} x={tg[0]} y={tg[1]} r={IMM_R} t={t} seed={c.k + 3} dir={Math.atan2(COLONY_C[1] - s.y, COLONY_C[0] - s.x)} lod={IMM_R * cam.z} act={0.25} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} color={c.nk ? '#3FB8C8' : undefined} />;
        })}
        {/* the switched-off T cell stays where the shields stopped it */}
        {killing && (() => { const s = immAt(TB, t); return <TCell2 x={s.x} y={s.y} r={IMM_R} t={t} seed={TB.k + 3} dir={s.dir ?? 0} lod={IMM_R * cam.z} dim={1} spikes={0.3} lead={0} />; })()}
        {/* the healthy cell is touched but nothing binds; the cancer cell's markers are bound */}
        {touchK > 0.05 && <circle cx={H_PT[0]} cy={H_PT[1] + 14} r={34} fill="none" stroke={P.carrierShell} strokeWidth={3} opacity={touchK * 0.8} />}
        {bindK > 0.01 && t < N2H[1] + 0.2 && <circle cx={STAR_PT[0]} cy={STAR_PT[1] + 12} r={30} fill="url(#glowGold)" opacity={0.6 * bindK} />}
        {BIND.map((b, k) => {
          const u = (t - b.t0) / 1.4;
          if (u < 0 || t > tD.deliver + 1.0) return null;
          const sx = b.gx - 600 + Math.min(u, 0.4) / 0.4 * 600, sy = lerp(-400, LUM[1] - 30, smooth(Math.min(u, 0.4) / 0.4));
          const tgt: Pt = [b.cell.x + Math.cos(b.ang) * (CELL_R + 10), b.cell.y + Math.sin(b.ang) * (CELL_R + 10)];
          const v = smooth((u - 0.4) / 0.6);
          const x = u < 0.4 ? sx : lerp(b.gx, tgt[0], v), y = u < 0.4 ? sy : lerp(LUM[1] + 10, tgt[1], v);
          const inside = lift(t, tD.deliver - 0.1, tD.deliver + 0.6);
          return <g key={'bd' + k} opacity={1 - inside}><Speck x={x} y={y} t={t} z={cam.z} seed={k + 5} /></g>;
        })}
        {followed && <circle cx={fp[0]} cy={fp[1]} r={Math.max(30, 46 / cam.z)} fill="url(#glowGold)" opacity={0.55} />}
        {followed && <Speck x={fp[0]} y={fp[1]} t={t} z={cam.z} seed={1} gold />}
        {/* after the change, new carriers reach the survivor and drift off: nothing to bind */}
        {t > tD.mutate + 0.3 && t < tD.army && [0, 1, 2].map((k) => {
          const u = clamp01((t - tD.mutate - 0.3 - k * 0.35) / 1.3);
          if (u <= 0) return null;
          const a = -Math.PI / 2 + (k - 1) * 0.6;
          const near: Pt = [RES.x + Math.cos(a) * (CELL_R + 16), RES.y + Math.sin(a) * (CELL_R + 16)];
          const far: Pt = [RES.x + Math.cos(a) * 460, RES.y + Math.sin(a) * 460];
          const p = u < 0.5 ? [lerp(far[0], near[0], smooth(u * 2)), lerp(far[1], near[1], smooth(u * 2))] : [lerp(near[0], far[0] + 160, smooth((u - 0.5) * 2)), lerp(near[1], far[1] - 80, smooth((u - 0.5) * 2))];
          return <g key={'bo' + k} opacity={1 - smooth((u - 0.75) / 0.25)}><Speck x={p[0]} y={p[1]} t={t} z={cam.z} seed={k + 40} /></g>;
        })}
      </g>
      <Bokeh cam={cam} t={t} fill={cam.y < LUM[1] && cam.z > 1.2 ? 'url(#bokehBlood)' : 'url(#bokehWarm)'} op={0.8} n={8} size={240} />
    </g>
  );
};

// ================================================================================================ inside the cell: uptake, release, block
const molAt = (target: Pt, s: number): Pt => { const c = molCentroid(MOL_FIT); return [target[0] - c[0] * s, target[1] - c[1] * s]; };
const Nano2: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const pit = lift(t, tD.deliver - 0.25, tD.deliver + 0.35);
  const pinch = lift(t, tD.deliver + 0.3, tD.deliver + 0.7);
  const open = lift(t, tD.deliver + 0.85, tD.deliver + 1.35);
  const cy = lerp(-470, 380, smooth(pit * 0.6 + pinch * 0.4));
  const dip = (x: number) => (1 - pinch) * pit * 760 * Math.exp(-((x / (420 - 120 * pit)) ** 2));
  const heads: React.ReactNode[] = [];
  for (let x = -5000; x <= 5000; x += 34) {
    const y = dip(x);
    heads.push(<circle key={'o' + x} cx={x} cy={y - 22} r={14} fill={P.tissueLight} />, <circle key={'i' + x} cx={x} cy={y + 22} r={14} fill={P.tissue} />);
  }
  const recXs = [-2300, -1800, -1300, -900, -560, -200, 200, 560, 900, 1300, 1800, 2300];
  return (
    <g>
      <rect width={W} height={H} fill="#4A0A18" />
      <g transform={camTransform(cam, 0.6)}>
        {Array.from({length: 9}, (_, k) => <circle key={k} cx={-2400 + k * 620} cy={2300 + 300 * Math.sin(k * 1.9)} r={260} fill="#E59A8E" opacity={0.35} />)}
      </g>
      <g transform={camTransform(cam)}>
        <rect x={-9000} y={0} width={18000} height={6000} fill={P.cyto} opacity={0.92} />
        <rect x={-9000} y={0} width={18000} height={6000} fill="url(#glowMag)" opacity={0.12} />
        {Array.from({length: 14}, (_, k) => <circle key={k} cx={-1700 + k * 260} cy={1650 + 140 * Math.sin(k * 1.7)} r={60} fill={P.er} opacity={0.35} />)}
        {TARGETS.map((p, k) => {
          const dockAt = tD.directly - 0.35 + [0.3, 0, 0.55, 0.8][k];
          const docked = lift(t, dockAt, dockAt + 0.3);
          return (
            <g key={'tp' + k} transform={`translate(${p[0]} ${p[1]}) scale(${TS_})`}>
              <circle r={900} fill="url(#glowMag)" opacity={(1 - docked) * (0.25 + 0.15 * Math.sin(t * 5 + k))} />
              <Protein t={t + k} breathe={1 - docked} layer="back" close={docked} />
            </g>
          );
        })}
        {heads}
        {pinch > 0.01 && (
          <g opacity={pinch}>
            {Array.from({length: 40}, (_, k) => {
              const a = (k / 40) * Math.PI * 2;
              return <circle key={k} cx={Math.cos(a) * (CR + 60) * (1 + 0.25 * open * Math.max(0, Math.sin(a)))} cy={cy + Math.sin(a) * (CR + 60) * (1 + 0.25 * open * Math.max(0, Math.sin(a)))} r={14} fill={P.tissueLight} opacity={1 - 0.6 * open * Math.max(0, Math.sin(a))} />;
            })}
          </g>
        )}
        {recXs.map((x, k) => {
          const y = dip(x);
          const pulled = Math.abs(x) < 400 ? pit : 0;
          return (
            <g key={k} transform={`translate(${x} ${y - 30}) rotate(${-x * 0.02 * pulled})`} opacity={1 - pinch * (Math.abs(x) < 400 ? 1 : 0)}>
              <line x1={0} y1={0} x2={0} y2={-140} stroke={P.marker} strokeWidth={26} strokeLinecap="round" />
              <line x1={0} y1={-140} x2={-60} y2={-210} stroke={P.marker} strokeWidth={26} strokeLinecap="round" />
              <line x1={0} y1={-140} x2={60} y2={-210} stroke={P.marker} strokeWidth={26} strokeLinecap="round" />
            </g>
          );
        })}
        <g transform={`translate(0 ${cy})`}>
          <CarrierBody t={t} asm={1} lig={1} open={open} payload={false} />
        </g>
        {CORE.map((c, k) => {
          const start: Pt = [c.x, cy + c.y];
          if (k < TARGETS.length) {
            const dockAt = tD.directly - 0.35 + [0.3, 0, 0.55, 0.8][k];
            const u = lift(t, tD.deliver + 1.1, dockAt);
            const tg = [TARGETS[k][0] + POCKET[0] * TS_, TARGETS[k][1] + POCKET[1] * TS_] as Pt;
            const wob = 50 * (1 - u) * u * 4;
            const cx = lerp(start[0], tg[0], u) + wob * noise(t * 2.2, k), cyy = lerp(start[1], tg[1], u) + wob * noise(t * 2.2, k + 7);
            const p = molAt([cx, cyy], 0.16);
            return <Molecule key={'p' + k} mol={MOL_FIT} x={p[0]} y={p[1]} rot={lerp(c.rot, 0, u)} s={0.16} op={1} />;
          }
          const u = lift(t, tD.deliver + 1.1, tD.like);
          const p = molAt([start[0] + (k - 5) * 500 * u + 60 * noise(t, k), start[1] + 380 * u + 60 * noise(t, k + 3)], 0.16);
          return <Molecule key={'p' + k} mol={MOL_FIT} x={p[0]} y={p[1]} rot={c.rot + t * 15} s={0.16} op={1} />;
        })}
        {TARGETS.map((p, k) => (
          <g key={'tf' + k} transform={`translate(${p[0]} ${p[1]}) scale(${TS_})`}>
            <Protein t={t + k} breathe={1 - lift(t, tD.directly - 0.35 + [0.3, 0, 0.55, 0.8][k], tD.directly - 0.05 + [0.3, 0, 0.55, 0.8][k])} layer="front" close={lift(t, tD.directly - 0.35 + [0.3, 0, 0.55, 0.8][k], tD.directly - 0.05 + [0.3, 0, 0.55, 0.8][k])} />
          </g>
        ))}
      </g>
      <Bokeh cam={cam} t={t} fill="url(#bokehWarm)" op={0.7} n={6} size={320} />
    </g>
  );
};

export const SURF_OUT: [number, number] = [tD.tumors + 0.05, tD.tumors + 0.45]; // fingerprint surface dissolves in
export const shotsD4: Shot[] = [
  {id: 'D-protein', t0: tD.but, t1: CB_H[1] + 0.05, draw: (t) => <ProteinD t={t} cam={PRD(t)} />},
  {id: 'D-carrier', t0: CB_H[0], t1: VH[1] + 0.05, fade: CB_H[1] - CB_H[0], draw: (t) => <CarrierBuild t={t} cam={NAC(t)} />},
  {id: 'D-vessel', t0: VH[0], t1: N2H[1] + 0.05, fade: VH[1] - VH[0], draw: (t) => <VesselD t={t} cam={t < VH[1] ? fromNano(NAC(t), t) : DV(t)} />},
  {id: 'D-nano', t0: N2H[0], t1: N2_OUT[1] + 0.05, fade: N2H[1] - N2H[0], draw: (t) => <Nano2 t={t} cam={t < N2H[1] ? toNano2(DV(t)) : N2(t)} />},
  {id: 'D-world', t0: N2_OUT[0], t1: SURF_OUT[1] + 0.05, fade: N2_OUT[1] - N2_OUT[0], draw: (t) => <VesselD t={t} cam={DV2(t)} />},
  {id: 'D-kills', t0: KILL_IN[0], t1: KILL_OUT + 0.75, fade: KILL_IN[1] - KILL_IN[0], draw: (t) => <VesselD t={t} cam={KCAM(t)} />},
];
export const D_CELL_R = CELL_R;
export const _d4 = {TE, Phagocyte, posOf};
export const _dbg = () => ({R1: [R1.x, R1.y], R2: [R2.x, R2.y], R3: [R3.x, R3.y], R4: [R4.x, R4.y], R5: [R5.x, R5.y], COLONY_C, n: SETTLED.length, all: SETTLED.map((c) => [Math.round(c.x), Math.round(c.y)]), TK_A, TK_B});
