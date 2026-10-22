// SEQUENCE D (97.7 – 133.1 s): the modelled weak protein becomes the real target; designed candidates approach its
// pocket — two stop at the rim, one turns, seats under the rim and the pocket closes on it, and the protein's
// activity stops. The camera pulls back from that molecule while copies of it are packed into a lipid nanoparticle.
// ONE carrier is then followed: it drifts with the blood, leaves through a leaky stretch of vessel wall, touches an
// unmarked healthy cell without binding, binds the markers of one cancer cell (next to a sparsely marked neighbour),
// is taken in, opens, and its payload molecules block the same protein inside that cell; that cell then dies by
// apoptosis, step by step, before the camera pulls out to the tissue. The sparsely marked neighbour survives, its
// marker changes shape, new carriers no longer bind, and it divides.
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
import {Cell2, ApoptoticCell, DividingCell, HEALTHY, TUMOR, lookMix} from '../art/tissue';

const tD = {
  but: T('But identifying the weakness'), ai: T('AI can help scientists'), design: T('design molecules'), target: T('that target the proteins'), depend: T('depend on'), surviveE: TE('depend on to survive.'),
  imagine: T('Imagine microscopic drug carriers'), travel: T('traveling through the bloodstream'), recog: T('recognizing markers'), deliver: T('delivering their deadly payload'), directly: T('directly to the tumor.'),
  like: T('Like guided missiles'), scale: T('operating at a scale'), see: TE('anything you can see.'), goal: T('The goal?'), destroy: T('Destroy the cancer'), sparing: T('sparing as much healthy tissue'),
  problem: T("But there's still a problem."), some: T('Some cancer cells can survive'), mutate: T('mutate,'), resistant: T('become resistant.'), weapon: T('So AI needs another weapon.'), army: T('Your body already has an army'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));

// ================================================================================================ protein + design
const MS = 0.8; // molecule scale at the pocket
const OUT: Pt = (() => { const l = Math.hypot(POCKET[0], POCKET[1]); return [POCKET[0] / l, POCKET[1] / l]; })(); // pocket opening direction
const PERP: Pt = [-OUT[1], OUT[0]];
const molCentroid = (m: Mol): Pt => [m.atoms.reduce((s, a) => s + a[0], 0) / m.atoms.length, m.atoms.reduce((s, a) => s + a[1], 0) / m.atoms.length];
const along2 = (d: number, side = 0): Pt => [POCKET[0] + OUT[0] * d + PERP[0] * side, POCKET[1] + OUT[1] * d + PERP[1] * side];
/** where a candidate's centroid is, and how it is turned: build at home, approach along the pocket axis, then either
 *  stop at the rim and back off (does not fit) or turn into register and seat (fits). */
const candidate = (t: number, m: Mol, b0: number, fit: boolean, side: number) => {
  const build = lift(t, b0, b0 + 0.6);
  const approach = lift(t, b0 + 0.55, b0 + 1.2);
  const seat = fit ? lift(t, b0 + 1.25, b0 + 1.75) : 0;
  const recoil = fit ? 0 : lift(t, b0 + 1.3, b0 + 1.7);
  const fade = fit ? 0 : lift(t, b0 + 1.6, b0 + 1.9);
  const home = along2(760, side), rim = along2(fit ? 250 : 300, side * 0.15), back = along2(470, side * 0.6);
  let c: Pt = [lerp(home[0], rim[0], approach), lerp(home[1], rim[1], approach)];
  if (fit) c = [lerp(c[0], POCKET[0], seat), lerp(c[1], POCKET[1], seat)];
  else c = [lerp(c[0], back[0], recoil), lerp(c[1], back[1], recoil)];
  const contact = fit ? 0 : Math.exp(-((t - b0 - 1.22) ** 2) / 0.01);
  const rot = fit ? lerp(-55, 0, smooth(approach * 0.6 + seat * 0.4)) : lerp(35, 20, approach) + 8 * contact * Math.sin(t * 40);
  const cc = molCentroid(m);
  return {x: c[0] - cc[0] * MS, y: c[1] - cc[1] * MS, rot, built: build, op: 1 - fade, on: t > b0 - 0.05 && fade < 0.99, seat, contact};
};
const PRD = path([
  {t: tD.but, x: POCKET[0] - 80, y: POCKET[1] + 60, z: 0.6, rot: 0},
  {t: tD.ai, x: POCKET[0] + 120, y: POCKET[1] - 60, z: 0.55, rot: -3},
  {t: tD.target + 1.2, x: POCKET[0] + 30, y: POCKET[1] - 20, z: 0.82, rot: -1},
  {t: tD.imagine - 0.3, x: POCKET[0], y: POCKET[1], z: 0.92, rot: 0},
]);
const ProteinD: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const dig = 1 - lift(t, tD.but + 0.8, tD.but + 2.6);
  // the model's outline lingers briefly over the real protein, so the hand-over from prediction to target is explicit
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
      <g transform={camTransform(cam)}>
        {/* the protein's activity — what the cancer cell depends on — pulses until the pocket is occupied */}
        <circle cx={-80} cy={60} r={900} fill="url(#glowMag)" opacity={(1 - blocked) * (0.12 + 0.08 * Math.sin(t * 5)) * (1 - dig)} />
        <Protein t={t} digital={dig} pocketGlow={0.45 * (1 - fitS.seat) * lift(t, tD.but, tD.but + 0.6)} breathe={1 - 0.8 * blocked} layer="back" close={close} />
        {mols}
        <Protein t={t} digital={dig} breathe={1 - 0.8 * blocked} layer="front" close={close} />
        {ghost > 0.01 && <g opacity={ghost * 0.6}><Protein t={t} digital={1} breathe={0} op={0.35} /></g>}
      </g>
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
/** payload molecule k in the carrier core (k = 0 is the molecule the camera pulled back from) */
const CORE = Array.from({length: 7}, (_, k) => {
  const a = (k / 7) * Math.PI * 2 + 0.3;
  const d = k === 0 ? 0 : 110;
  return {x: Math.cos(a) * d - 30, y: Math.sin(a) * d - 15, rot: k * 51};
});
const PS = 0.2; // payload molecule scale inside the carrier
/** The lipid-nanoparticle carrier: payload core, bilayer shell (assembling with asm), targeting ligands. open (0..1)
 *  parts the shell on its lower side once it is inside the cell; payload=false leaves the core to the caller. */
const CarrierBody: React.FC<{t: number; asm: number; lig: number; open?: number; payload?: boolean}> = ({t, asm, lig, open = 0, payload = true}) => (
  <g>
    {payload && CORE.map((c, k) => <Molecule key={k} mol={MOL_FIT} x={c.x} y={c.y} rot={c.rot} s={PS} op={1} />)}
    {lipidSlots.map((l) => {
      const st = rand(l.k * 7 + 1) * 0.45;
      const u = smooth(clamp01((asm - st) / 0.55));
      const fa = l.a + (rand(l.k) - 0.5) * 2, fr = 900 + 500 * rand(l.k * 3);
      // when it opens, the lower arc of the shell parts and spreads
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
// the pull-back starts with core molecule 0 exactly where the docked molecule was on screen, at the same size
const M0C: Pt = (() => { const c = molCentroid(MOL_FIT); return [CORE[0].x + c[0] * PS, CORE[0].y + c[1] * PS]; })();
const CB_H: [number, number] = [tD.imagine - 0.3, tD.imagine + 0.15];
const NAC = path([
  {t: CB_H[0], x: M0C[0], y: M0C[1], z: (PRD(CB_H[0]).z * MS) / PS, rot: 0},
  {t: tD.imagine + 0.9, x: M0C[0] * 0.4, y: M0C[1] * 0.4, z: 1.45, rot: 4},
  {t: tD.travel - 0.2, x: 30, y: 10, z: 0.95, rot: 8},
]);
const CarrierBuild: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const asm = lift(t, tD.imagine + 0.05, tD.imagine + 1.1);
  const lig = lift(t, tD.imagine + 0.9, tD.imagine + 1.5);
  return (
    <g>
      <rect width={W} height={H} fill={P.blood} />
      <g transform={camTransform(cam, 0.5)}>
        {Array.from({length: 7}, (_, k) => <RBC key={k} x={-1400 + k * 520 + t * 40} y={(k % 2 ? -500 : 520) + 80 * Math.sin(k)} r={300} tilt={0.3 + 0.1 * k} rot={k * 30} dark={0.55} />)}
      </g>
      <g transform={camTransform(cam)}>
        <CarrierBody t={t} asm={asm} lig={lig} />
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
const HCELL = cellNear(1950, 0, false);     // the unmarked healthy cell the carrier touches first
const STAR = cellNear(2250, 0, true);       // the cancer cell it binds and kills
const RES = cellNear(2420, 1, true);        // the sparsely marked neighbour that survives
const RES2 = cellNear(3300, 2, true), RES3 = cellNear(2700, 3, true);
const RESL = [RES, RES2, RES3];
const STAR_PT: Pt = [STAR.x - 30, STAR.y - CELL_R - 22];
const H_PT: Pt = [HCELL.x + 10, HCELL.y - CELL_R - 22];
// other carriers that bind other marked cells (no binding to unmarked or sparsely marked cells)
const BIND = tissueCells.filter((c) => c.tumor && c.j <= 1 && c !== STAR && !RESL.includes(c)).map((c, k) => ({cell: c, ang: -Math.PI / 2 + (rand(k * 3) - 0.5) * 1.6, t0: tD.recog - 0.4 + rand(k * 5) * 1.6, gx: c.x + (rand(k) - 0.5) * 200}));
// apoptosis timing: STAR first (in close-up), then the other treated cells; survivors never
const STAR_DIE: [number, number] = [tD.like + 0.5, tD.destroy - 0.3];
const dieAt = (c: {x: number; seed: number}) => tD.goal - 1.6 + 0.8 * rand(c.seed * 3) + (Math.abs(c.x - STAR.x) / 2600) * 3.4;

// ------------------------------------------------------------------------------------------------ the followed carrier
const FLOW = 700;
const SPK0: Pt = [700, -560];
const T_RIDE = tD.travel - 0.2;
const spkX = (t: number) => SPK0[0] + FLOW * (t - T_RIDE);
const T_EXIT = T_RIDE + (1920 - SPK0[0]) / FLOW; // reaches the gap at x ≈ 1920
const tc = {exit: T_EXIT, through: T_EXIT + 0.38, touch: T_EXIT + 0.85, bind: T_EXIT + 1.45};
/** position of the ONE followed carrier: carried by the flow while it diffuses toward the wall, slips through a gap,
 *  brushes the healthy cell (no binding), drifts on and binds the cancer cell's markers. */
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
const NANO_S = 300 / 9; // nano units per vessel unit (a speck r = 9 ↔ carrier r = 300)
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
const TS_ = 0.32; // target protein scale in the cytoplasm
const N2 = path([
  {...toNano2(DV(N2H[1])), t: N2H[1]},
  {t: tD.deliver + 0.6, x: 0, y: -120, z: 0.6, rot: 0},
  {t: tD.deliver + 1.15, x: 120, y: 420, z: 0.62, rot: 0},
  {t: tD.directly + 0.05, x: 330 + POCKET[0] * TS_, y: 1020 + POCKET[1] * TS_, z: 1.15, rot: 0},
  {t: tD.like + 0.15, x: 200, y: 900, z: 0.7, rot: 0},
]);
const N2_OUT: [number, number] = [tD.like + 0.05, tD.like + 0.45];
const fromNano2 = (cn: Cam) => handoff(cn, N2_ANCH, STAR_PT, 1 / NANO_S);
const DV2 = path([
  {...fromNano2(N2(N2_OUT[0])), t: N2_OUT[0]},
  {t: tD.like + 1.3, x: STAR.x + 10, y: STAR.y - 10, z: 2.3, rot: 0},
  {t: tD.destroy - 0.4, x: STAR.x + 30, y: STAR.y, z: 2.1, rot: 0},
  {t: tD.sparing + 0.6, x: 2350, y: 420, z: 0.42, rot: 0},
  {t: tD.problem + 0.1, x: 2450, y: 420, z: 0.45, rot: 0},
  {t: tD.some + 0.6, x: RES.x, y: RES.y, z: 1.15, rot: 0},
  {t: tD.resistant + 0.4, x: RES.x + 30, y: RES.y + 15, z: 1.1, rot: 0},
  {t: tD.army + 0.2, x: RES.x + 260, y: RES.y + 260, z: 0.52, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ markers: same molecule, same shape and colour wherever it is seen
/** Surface markers. Cancer cells carry many round pink markers; the survivor carries only a few. After the change
 *  the survivor's marker is a different shape (square, orange) — the carriers' ligands no longer fit it. */
const Markers: React.FC<{c: {x: number; y: number; seed: number}; n: number; k: number; alt: number; t: number}> = ({c, n, k, alt, t}) => (
  <g opacity={k}>
    {Array.from({length: n}, (_, m) => {
      const a = (m / n) * Math.PI * 2 + c.seed;
      const x = c.x + Math.cos(a) * CELL_R * 0.98, y = c.y + Math.sin(a) * CELL_R * 0.98;
      const sz = 9 + 0.6 * Math.sin(t * 3 + m);
      return <rect key={m} x={x - sz} y={y - sz} width={sz * 2} height={sz * 2} rx={lerp(sz, 2.5, alt)} fill={mixHex(P.marker, P.markerAlt, alt)} transform={`rotate(${(a * 180) / Math.PI + 45 * alt} ${x} ${y})`} />;
    })}
  </g>
);
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

const VesselD: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = CELL_R * cam.z;
  const hw = W / 2 / cam.z + 300;
  const x0 = cam.x - hw, x1 = cam.x + hw;
  const flowT = t * FLOW;
  const rbcs: React.ReactNode[] = [];
  const S = 260;
  for (let i = Math.floor((x0 - flowT) / S); i <= Math.ceil((x1 - flowT) / S); i++)
    for (let k = 0; k < 2; k++) {
      const sd = ((i % 911) + 911) % 911 * 5 + k * 77;
      const x = i * S + flowT * 0.9 + rand(sd) * S, y = lerp(LUM[0] + 70, LUM[1] - 70, rand(sd + 1));
      rbcs.push(<RBC key={`${i}-${k}`} x={x} y={y} r={40} tilt={clamp01(0.5 + 0.5 * Math.sin(t + sd))} rot={rand(sd + 2) * 180 + t * 20} dark={0.1} />);
    }
  const specks: React.ReactNode[] = [];
  const SS = 110;
  if (t < tD.see)
    for (let i = Math.floor((x0 - flowT) / SS); i <= Math.ceil((x1 - flowT) / SS); i++) {
      const sd = ((i % 733) + 733) % 733 * 3 + 9;
      const x = i * SS + flowT + rand(sd) * SS, y = lerp(LUM[0] + 40, LUM[1] - 150, rand(sd + 1)) + 30 * noise(t + sd, 2);
      specks.push(<Speck key={i} x={x} y={y} t={t} z={cam.z} seed={sd} />);
    }
  const wall: React.ReactNode[] = [];
  for (let i = Math.floor(x0 / 280) - 1; i <= Math.ceil(x1 / 280) + 1; i++) {
    const x = i * 280;
    const leaky = x > LEAK[0] && x < LEAK[1] && i % 2 === 0;
    const w = leaky ? 200 : 276;
    wall.push(<rect key={'b' + i} x={x} y={LUM[1]} width={w} height={46} rx={20} fill={P.vesselWall} />);
    wall.push(<ellipse key={'n' + i} cx={x + w / 2} cy={LUM[1] + 23} rx={50} ry={14} fill="#8E2A3A" />);
    wall.push(<rect key={'t' + i} x={x} y={LUM[0] - 46} width={276} height={46} rx={20} fill={P.vesselWall} />);
  }
  const altK = lift(t, tD.mutate - 0.25, tD.mutate + 0.45);
  const fp = cpos(t);
  const followed = t < N2H[1] + 0.1;
  const touchK = Math.exp(-((t - tc.touch) ** 2) / 0.01);
  const bindK = lift(t, tc.bind - 0.15, tc.bind + 0.1);
  return (
    <g>
      <rect width={W} height={H} fill={P.tissueBgDeep} />
      <g transform={camTransform(cam)}>
        <rect x={x0} y={LUM[0]} width={x1 - x0} height={LUM[1] - LUM[0]} fill={P.blood} />
        <rect x={x0} y={LUM[0] - 3000} width={x1 - x0} height={3000} fill="#3A0612" />
        <rect x={x0} y={LUM[1]} width={x1 - x0} height={3000} fill={P.tissueBg} />
        {rbcs}
        {specks}
        {wall}
        {tissueCells.filter((c) => c.x > x0 - 200 && c.x < x1 + 200).map((c) => {
          if (!c.tumor) return <Cell2 key={c.i + ',' + c.j} x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={HEALTHY} />;
          const ri = RESL.indexOf(c);
          if (ri >= 0) {
            const resDiv = clamp01((t - (tD.resistant + 0.1 + ri * 0.4)) / 1.3);
            const look = lookMix(TUMOR, {...TUMOR, fill: '#B8603E', light: '#E8986E'}, altK * 0.45);
            return (
              <g key={'res' + ri}>
                {resDiv <= 0 ? <Cell2 x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={look} /> : <DividingCell x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} p={resDiv} axis={20 + ri * 50} lod={lod} look={look} sepF={0.72} dR={0.84} />}
                {resDiv <= 0.05 && <Markers c={c} n={altK > 0.5 ? 7 : 3} k={1} alt={altK} t={t} />}
              </g>
            );
          }
          const die = c === STAR ? clamp01((t - STAR_DIE[0]) / (STAR_DIE[1] - STAR_DIE[0])) : clamp01((t - dieAt(c)) / 2.4);
          const treated = c === STAR ? lift(t, tD.deliver + 0.6, tD.like) : lift(t, tD.deliver + 0.3 + rand(c.seed) * 0.6, tD.deliver + 1.3 + rand(c.seed) * 0.6);
          return (
            <g key={c.i + ',' + c.j}>
              {die <= 0 ? <Cell2 x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={TUMOR} /> : <ApoptoticCell x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} die={die} lod={lod} />}
              {die <= 0.25 && <Markers c={c} n={9} k={1 - die * 4} alt={0} t={t} />}
              {/* payload inside the treated cell: the same molecule, at cell scale shown as small dark-ringed dots */}
              {treated > 0.01 && die < 0.35 && Array.from({length: 5}, (_, m) => <circle key={m} cx={c.x + Math.cos(m * 1.3 + c.seed) * CELL_R * 0.45} cy={c.y + Math.sin(m * 1.3 + c.seed) * CELL_R * 0.45} r={6} fill="#3A4656" stroke={P.aiHot} strokeWidth={1.5} opacity={treated * (1 - die * 3)} />)}
            </g>
          );
        })}
        {/* the healthy cell is touched but nothing binds; the cancer cell's markers are bound */}
        {touchK > 0.05 && <circle cx={H_PT[0]} cy={H_PT[1] + 14} r={34} fill="none" stroke={P.carrierShell} strokeWidth={3} opacity={touchK * 0.8} />}
        {bindK > 0.01 && t < N2H[1] + 0.2 && <circle cx={STAR_PT[0]} cy={STAR_PT[1] + 12} r={30} fill="url(#glowGold)" opacity={0.6 * bindK} />}
        {/* other carriers reach other marked cells through the gaps */}
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
      <g transform={camTransform(cam)}>
        <rect x={-9000} y={0} width={18000} height={6000} fill={P.cyto} />
        <rect x={-9000} y={0} width={18000} height={6000} fill="url(#glowMag)" opacity={0.12} />
        {Array.from({length: 14}, (_, k) => <circle key={k} cx={-1700 + k * 260} cy={1650 + 140 * Math.sin(k * 1.7)} r={60} fill={P.er} opacity={0.35} />)}
        {/* the same target protein, many copies in this cell, each working until a payload molecule fills its pocket */}
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
        {/* the payload molecules leave the opened carrier and diffuse to the target proteins */}
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
    </g>
  );
};

export const shotsD: Shot[] = [
  {id: 'D-protein', t0: tD.but, t1: CB_H[1] + 0.05, draw: (t) => <ProteinD t={t} cam={PRD(t)} />},
  {id: 'D-carrier', t0: CB_H[0], t1: VH[1] + 0.05, fade: CB_H[1] - CB_H[0], draw: (t) => <CarrierBuild t={t} cam={NAC(t)} />},
  {id: 'D-vessel', t0: VH[0], t1: N2H[1] + 0.05, fade: VH[1] - VH[0], draw: (t) => <VesselD t={t} cam={t < VH[1] ? fromNano(NAC(t), t) : DV(t)} />},
  {id: 'D-nano', t0: N2H[0], t1: N2_OUT[1] + 0.05, fade: N2H[1] - N2H[0], draw: (t) => <Nano2 t={t} cam={t < N2H[1] ? toNano2(DV(t)) : N2(t)} />},
  {id: 'D-vessel2', t0: N2_OUT[0], t1: tD.army + 0.25, fade: N2_OUT[1] - N2_OUT[0], draw: (t) => <VesselD t={t} cam={DV2(t)} />},
];
export const tDdone = tD.army;
export const RES_CELL = RES;
export const _d = {TE};
