// SEQUENCE D (97.7 – 133.1 s): the weak protein turns from model to molecule; AI-guided design tries candidates until
// one fits the pocket; copies are packed into lipid-nanoparticle carriers; carriers drift with the blood (tiny specks
// next to red cells), slip out where the tumour's vessel wall is leaky, stick only to cells that carry the marker, are
// taken in, release the payload; tumour cells die by apoptosis while unmarked healthy cells are spared; one cell
// changes its marker, carriers no longer stick, and it divides.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {AIBack} from '../art/ai';
import {Protein, POCKET, Molecule, MOL_FIT, MOL_BAD1, MOL_BAD2, Carrier} from '../art/protein';
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
const PRD = path([
  {t: tD.but, x: POCKET[0] - 80, y: POCKET[1] + 60, z: 0.6, rot: 0},
  {t: tD.ai, x: 140, y: -110, z: 0.52, rot: -4},
  {t: tD.target + 0.9, x: POCKET[0] + 60, y: POCKET[1] - 40, z: 0.78, rot: -2},
  {t: tD.imagine, x: POCKET[0] + 20, y: POCKET[1], z: 0.92, rot: -1},
]);
const MS = 0.8; // molecule scale in the pocket
const molCentroid = (m: typeof MOL_FIT): Pt => [m.atoms.reduce((s, a) => s + a[0], 0) / m.atoms.length, m.atoms.reduce((s, a) => s + a[1], 0) / m.atoms.length];
const tryMol = (t: number, m: typeof MOL_FIT, b0: number, fit: boolean) => {
  const build = lift(t, b0, b0 + 0.65);
  const go = lift(t, b0 + 0.6, b0 + 1.05);
  const recoil = fit ? 0 : lift(t, b0 + 1.05, b0 + 1.45);
  const fade = fit ? 0 : lift(t, b0 + 1.35, b0 + 1.6);
  const c = molCentroid(m);
  const home: Pt = [POCKET[0] + 560, POCKET[1] - 520];
  const dock: Pt = [POCKET[0] - c[0] * MS + (fit ? 0 : 60), POCKET[1] - c[1] * MS + (fit ? 0 : -60)];
  const k = go * (1 - recoil * 0.85);
  return {x: lerp(home[0], dock[0], k), y: lerp(home[1], dock[1], k), rot: lerp(fit ? -40 : 30, 0, go), built: build, bad: fit ? 0 : Math.exp(-((t - b0 - 1.1) ** 2) / 0.02), op: 1 - fade, glow: fit ? lift(t, b0 + 1.0, b0 + 1.4) : 0, on: t > b0 - 0.05 && fade < 0.99};
};
const ProteinD: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const dig = 1 - lift(t, tD.but + 0.8, tD.but + 2.6);
  const blocked = lift(t, tD.depend, tD.surviveE + 0.3);
  const cands: [typeof MOL_FIT, number, boolean][] = [[MOL_BAD1, tD.ai + 0.1, false], [MOL_BAD2, tD.design + 0.15, false], [MOL_FIT, tD.target - 0.05, true]];
  return (
    <g>
      <rect width={W} height={H} fill={mixHex('#22102E', P.aiBg, dig)} />
      <AIBack cam={cam} t={t} op={dig} />
      <rect width={W} height={H} fill="url(#glowMag)" opacity={0.12 * (1 - dig)} />
      <g transform={camTransform(cam)}>
        {/* the protein's activity (what the cancer cell depends on) pulses until the drug blocks the pocket */}
        <circle cx={-80} cy={60} r={900} fill="url(#glowMag)" opacity={(1 - blocked) * (0.12 + 0.08 * Math.sin(t * 5)) * (1 - dig)} />
        <Protein t={t} digital={dig} pocketGlow={0.7 * (1 - blocked) * lift(t, tD.but, tD.but + 0.6)} breathe={1 - 0.8 * blocked} />
        {cands.map(([m, b0, fit], k) => {
          const s = tryMol(t, m, b0, fit);
          if (!s.on) return null;
          return <Molecule key={k} mol={m} x={s.x} y={s.y} rot={s.rot} s={MS} built={s.built} digital={0.7 * (1 - s.glow)} bad={s.bad} glow={s.glow * (1 - 0.5 * blocked)} op={s.op} />;
        })}
      </g>
    </g>
  );
};

// ================================================================================================ carrier assembly (nano units: carrier r = 300)
const CR = 300;
const lipidSlots = (() => {
  const out: {a: number; r: number; inner: boolean; k: number}[] = [];
  for (let k = 0; k < 44; k++) out.push({a: (k / 44) * Math.PI * 2, r: CR, inner: false, k});
  for (let k = 0; k < 34; k++) out.push({a: (k / 34) * Math.PI * 2 + 0.05, r: CR - 92, inner: true, k: k + 44});
  return out;
})();
const NAC = path([
  {t: tD.imagine, x: 0, y: 0, z: 1.25, rot: 0},
  {t: tD.travel - 0.2, x: 30, y: 10, z: 0.95, rot: 8},
]);
const CarrierBuild: React.FC<{t: number; cam: Cam; bg?: boolean}> = ({t, cam, bg = true}) => {
  const asm = lift(t, tD.imagine + 0.05, tD.imagine + 1.1);
  const lig = lift(t, tD.imagine + 0.9, tD.imagine + 1.5);
  return (
    <g>
      {bg && (
        <>
          <rect width={W} height={H} fill={P.blood} />
          <g transform={camTransform(cam, 0.5)}>
            {Array.from({length: 7}, (_, k) => <RBC key={k} x={-1400 + k * 520 + t * 40} y={(k % 2 ? -500 : 520) + 80 * Math.sin(k)} r={300} tilt={0.3 + 0.1 * k} rot={k * 30} dark={0.55} />)}
          </g>
          <rect width={W} height={H} fill="url(#glowGold)" opacity={0.08} />
        </>
      )}
      <g transform={camTransform(cam)}>
        <CarrierBody t={t} asm={asm} lig={lig} />
      </g>
    </g>
  );
};
/** The lipid-nanoparticle carrier in nano units (r = 300): payload core, bilayer shell assembling, ligands. */
const CarrierBody: React.FC<{t: number; asm: number; lig: number}> = ({t, asm, lig}) => (
  <g>
        {/* payload: copies of the designed molecule packed in the core */}
    {Array.from({length: 7}, (_, k) => {
      const a = (k / 7) * Math.PI * 2 + 0.3;
      const d = k === 0 ? 0 : 110;
      return <Molecule key={k} mol={MOL_FIT} x={Math.cos(a) * d - 30} y={Math.sin(a) * d - 15} rot={k * 51} s={0.2} op={1} />;
    })}
    {/* lipids snap into a bilayer shell */}
    {lipidSlots.map((l) => {
      const st = rand(l.k * 7 + 1) * 0.45;
      const u = smooth(clamp01((asm - st) / 0.55));
      const fa = l.a + (rand(l.k) - 0.5) * 2, fr = 900 + 500 * rand(l.k * 3);
      const a = lerp(fa, l.a, u), r = lerp(fr, l.r, u);
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      const tail = l.inner ? 1 : -1;
      return (
        <g key={l.k} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI})`} opacity={Math.min(1, u * 3 + 0.2)}>
          <line x1={0} y1={-4} x2={tail * 40} y2={-6} stroke="#F4E2C8" strokeWidth={5} strokeLinecap="round" />
          <line x1={0} y1={4} x2={tail * 40} y2={6} stroke="#F4E2C8" strokeWidth={5} strokeLinecap="round" />
          <circle r={17} fill={P.carrierShell} />
          <circle r={17} fill="url(#vol)" />
        </g>
      );
    })}
    {/* targeting ligands on the outside */}
    {lig > 0.01 && Array.from({length: 9}, (_, k) => {
      const a = (k / 9) * Math.PI * 2 + 0.2;
      const L = 120 * smooth(lig * 1.5 - k * 0.05);
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

// ================================================================================================ the vessel + tumour world (vessel units)
const LUM: [number, number] = [-1000, -80];           // lumen y range
const LEAK: [number, number] = [2100, 4700];          // leaky wall section
const CELL_R = 92, CSP = 200;
const tumorAt = (x: number, y: number) => x > 1900 + 160 * Math.sin(y * 0.01) && x < 5300 + 120 * Math.sin(y * 0.013);
const tissueCells = (() => {
  const out: {i: number; j: number; x: number; y: number; seed: number; tumor: boolean}[] = [];
  for (let j = 0; j < 9; j++)
    for (let i = -14; i < 50; i++) {
      const x = i * CSP + (j % 2 ? CSP / 2 : 0) + (rand(i * 31 + j * 7) - 0.5) * 30, y = 120 + j * CSP * 0.866 + (rand(i * 17 + j * 3) - 0.5) * 24;
      out.push({i, j, x, y, seed: i * 13 + j * 71 + 3, tumor: tumorAt(x, y)});
    }
  return out;
})();
// binding events: carriers that leave through gaps and stick to marked (tumour) cells in the top rows
const BIND = (() => {
  const top = tissueCells.filter((c) => c.tumor && c.j <= 1);
  return top.map((c, k) => {
    const a = -Math.PI / 2 + (rand(k * 3) - 0.5) * 1.6;
    return {cell: c, ang: a, t0: tD.recog - 0.6 + rand(k * 5) * 1.6, gx: c.x + (rand(k) - 0.5) * 200};
  });
})();
const STAR = tissueCells.find((c) => c.tumor && c.j === 0 && c.x > 2950 && c.x < 3250)!;
const STAR_PT: Pt = [STAR.x, STAR.y - CELL_R - 8];
const RES = tissueCells.find((c) => c.tumor && c.j === 1 && c.x > 3500 && c.x < 3800)!;
const RES2 = tissueCells.find((c) => c.tumor && c.j === 2 && c.x > 3850 && c.x < 4100)!;
const RES3 = tissueCells.find((c) => c.tumor && c.j === 3 && c.x > 3300 && c.x < 3550)!;
const RESL = [RES, RES2, RES3];
// apoptosis timing per tumour cell (sparing healthy cells); RES survives
const dieAt = (c: {x: number; seed: number}) => tD.destroy - 2.6 + 0.8 * rand(c.seed * 3) + (Math.abs(c.x - 3100) / 2600) * 3.6;

const VW = path([
  {t: tD.travel - 0.2, x: -600, y: -560, z: 26 / 300 * 0.95 * 300 / 26, rot: 8},
]);
const SPK0: Pt = [-600, -560];
const FLOW = 700;
const spkX = (t: number) => SPK0[0] + FLOW * (t - (tD.travel - 0.2));
const VH: [number, number] = [tD.travel - 0.35, tD.travel + 0.05];
const NANO_S = 300 / 9; // nano units per vessel unit (a speck r = 9 ↔ carrier r = 300)
const fromNano = (cn: Cam, t: number) => handoff(cn, [0, 0], [spkX(t), SPK0[1]], 1 / NANO_S);
// first the camera rides with the followed carrier, then hands over smoothly to a free path
const DV_FREE = path([
  {t: tD.travel + 1.0, x: spkX(tD.travel + 1.0) + 250, y: -500, z: 0.5, rot: 2},
  {t: tD.recog + 0.5, x: 2700, y: -260, z: 0.4, rot: 0},
  {t: tD.recog + 1.4, x: STAR_PT[0] - 60, y: STAR_PT[1] + 40, z: 0.85, rot: 0},
  {t: tD.deliver - 0.25, x: STAR_PT[0], y: STAR_PT[1], z: 9, rot: 0},
]);
const DV_RIDE = path([
  {...fromNano(NAC(VH[1]), VH[1]), x: fromNano(NAC(VH[1]), VH[1]).x - spkX(VH[1]), t: VH[1]},
  {t: tD.travel + 1.0, x: 250, y: -500, z: 0.5, rot: 2},
]);
const DV = (t: number): Cam => {
  const r = DV_RIDE(t);
  const ride = {...r, x: r.x + spkX(t)};
  if (t <= tD.travel + 1.0) return ride;
  const f = DV_FREE(t);
  const w = smooth((t - (tD.travel + 1.0)) / 0.8);
  return {x: lerp(ride.x, f.x, w), y: lerp(ride.y, f.y, w), z: Math.exp(lerp(Math.log(ride.z), Math.log(f.z), w)), rot: lerp(ride.rot ?? 0, f.rot ?? 0, w)};
};
const N2H: [number, number] = [tD.deliver - 0.55, tD.deliver - 0.25];
// nano world 2: tumour-cell membrane at y = 0, the docked carrier centred at (0, -470)
const N2_ANCH: Pt = [0, -470];
const toNano2 = (cv: Cam) => handoff(cv, STAR_PT, N2_ANCH, NANO_S);
const N2 = path([
  {...toNano2(DV(N2H[1])), t: N2H[1]},
  {t: tD.deliver + 0.5, x: 0, y: -150, z: 0.62, rot: 0},
  {t: tD.directly - 0.2, x: 0, y: 120, z: 0.55, rot: 0},
]);
const N2_OUT: [number, number] = [tD.directly - 0.2, tD.directly + 0.2];
const fromNano2 = (cn: Cam) => handoff(cn, N2_ANCH, STAR_PT, 1 / NANO_S);
const DV2 = path([
  {...fromNano2(N2(N2_OUT[0])), t: N2_OUT[0]},
  {t: tD.like - 0.1, x: STAR.x, y: STAR.y - 60, z: 1.0, rot: 0},
  {t: tD.see, x: 3000, y: 300, z: 0.14, rot: -2},
  {t: tD.destroy - 0.2, x: 2050, y: 420, z: 0.42, rot: 0},
  {t: tD.problem + 0.2, x: 2600, y: 420, z: 0.48, rot: 0},
  {t: tD.some + 0.6, x: RES.x, y: RES.y, z: 1.05, rot: 0},
  {t: tD.resistant + 0.6, x: RES.x + 40, y: RES.y + 20, z: 1.0, rot: 0},
  {t: tD.army + 0.2, x: RES.x + 120, y: RES.y + 120, z: 0.5, rot: 0},
]);

/** A carrier seen at vessel scale: the full particle when close, a glinting speck when far. */
const Speck: React.FC<{x: number; y: number; t: number; z: number; seed: number; gold?: boolean}> = ({x, y, t, z, seed, gold}) =>
  9 * z > 16 ? (
    <g transform={`translate(${x} ${y}) rotate(${t * 20 * (rand(seed) - 0.5)}) scale(${9 / 300})`}><CarrierBody t={t} asm={1} lig={1} /></g>
  ) : (
    <g>
      <circle cx={x} cy={y} r={26} fill={gold ? 'url(#glowGold)' : 'url(#glowAi)'} opacity={gold ? 0.7 : 0.5} />
      <circle cx={x} cy={y} r={9} fill={P.carrier} stroke={P.ligand} strokeWidth={3} />
    </g>
  );
const Markers: React.FC<{c: {x: number; y: number; seed: number}; k: number; alt: number; t: number}> = ({c, k, alt, t}) => (
  <g opacity={k}>
    {Array.from({length: 9}, (_, m) => {
      const a = (m / 9) * Math.PI * 2 + c.seed;
      const x = c.x + Math.cos(a) * CELL_R * 0.98, y = c.y + Math.sin(a) * CELL_R * 0.98;
      const col = mixHex(P.marker, P.markerAlt, alt);
      return alt > 0.5 ? (
        <rect key={m} x={x - 8} y={y - 8} width={16} height={16} rx={3} fill={col} transform={`rotate(${(a * 180) / Math.PI + 45} ${x} ${y})`} />
      ) : (
        <circle key={m} cx={x} cy={y} r={9 + Math.sin(t * 3 + m)} fill={col} />
      );
    })}
  </g>
);

const VesselD: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = CELL_R * cam.z;
  const hw = W / 2 / cam.z + 300;
  const x0 = cam.x - hw, x1 = cam.x + hw;
  const flowT = t * FLOW;
  // lumen RBCs
  const rbcs: React.ReactNode[] = [];
  const S = 260;
  for (let i = Math.floor((x0 - flowT) / S); i <= Math.ceil((x1 - flowT) / S); i++)
    for (let k = 0; k < 2; k++) {
      const sd = ((i % 911) + 911) % 911 * 5 + k * 77;
      const x = i * S + flowT * 0.9 + rand(sd) * S, y = lerp(LUM[0] + 70, LUM[1] - 70, rand(sd + 1));
      rbcs.push(<RBC key={`${i}-${k}`} x={x} y={y} r={40} tilt={clamp01(0.5 + 0.5 * Math.sin(t + sd))} rot={rand(sd + 2) * 180 + t * 20} dark={0.1} />);
    }
  // free carriers (specks) drifting with the flow
  const specks: React.ReactNode[] = [];
  const SS = 90;
  if (t < tD.see + 2)
    for (let i = Math.floor((x0 - flowT) / SS); i <= Math.ceil((x1 - flowT) / SS); i++) {
      const sd = ((i % 733) + 733) % 733 * 3 + 9;
      const x = i * SS + flowT + rand(sd) * SS, y = lerp(LUM[0] + 40, LUM[1] - 40, rand(sd + 1)) + 30 * noise(t + sd, 2);
      specks.push(<Speck key={i} x={x} y={y} t={t} z={cam.z} seed={sd} />);
    }
  // the followed speck (handoff anchor)
  const followed = t < tD.recog + 0.4 ? <Speck x={spkX(t)} y={SPK0[1]} t={t} z={cam.z} seed={1} gold /> : null;
  // endothelial lining with gaps in the leaky section
  const wall: React.ReactNode[] = [];
  for (let i = Math.floor(x0 / 280) - 1; i <= Math.ceil(x1 / 280) + 1; i++) {
    const x = i * 280;
    const leaky = x > LEAK[0] && x < LEAK[1] && i % 2 === 0;
    const w = leaky ? 200 : 276;
    wall.push(<rect key={'b' + i} x={x} y={LUM[1]} width={w} height={46} rx={20} fill={P.vesselWall} />);
    wall.push(<ellipse key={'n' + i} cx={x + w / 2} cy={LUM[1] + 23} rx={50} ry={14} fill="#8E2A3A" />);
    wall.push(<rect key={'t' + i} x={x} y={LUM[0] - 46} width={276} height={46} rx={20} fill={P.vesselWall} />);
  }
  const payloadK = (c: {seed: number}) => lift(t, tD.deliver + 0.2 + rand(c.seed) * 0.6, tD.deliver + 0.9 + rand(c.seed) * 0.6);
  const altK = lift(t, tD.mutate - 0.2, tD.mutate + 0.4);
  return (
    <g>
      <rect width={W} height={H} fill={P.tissueBgDeep} />
      <g transform={camTransform(cam)}>
        <rect x={x0} y={LUM[0]} width={x1 - x0} height={LUM[1] - LUM[0]} fill={P.blood} />
        <rect x={x0} y={LUM[0] - 3000} width={x1 - x0} height={3000} fill="#3A0612" />
        <rect x={x0} y={LUM[1]} width={x1 - x0} height={3000} fill={P.tissueBg} />
        {rbcs}
        {specks}
        {followed}
        {wall}
        {/* tissue: healthy cells (no marker) and tumour cells (marked) */}
        {tissueCells.filter((c) => c.x > x0 - 200 && c.x < x1 + 200).map((c) => {
          if (!c.tumor) return <Cell2 key={c.i + ',' + c.j} x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={HEALTHY} />;
          const ri = RESL.indexOf(c);
          if (ri >= 0) {
            const resDiv = clamp01((t - (tD.resistant - 0.2 + ri * 0.45)) / 1.3);
            return (
              <g key={'res' + ri}>
                {resDiv <= 0 ? <Cell2 x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={lookMix(TUMOR, {...TUMOR, fill: '#B85A3A'}, altK * 0.5)} pulse={0.3 * altK} /> : <DividingCell x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} p={resDiv} axis={20} lod={lod} look={lookMix(TUMOR, {...TUMOR, fill: '#B85A3A'}, 0.5)} sepF={0.72} dR={0.84} />}
                {resDiv <= 0.05 && <Markers c={c} k={1} alt={altK} t={t} />}
              </g>
            );
          }
          const die = clamp01((t - dieAt(c)) / 1.6);
          const pk = payloadK(c);
          return (
            <g key={c.i + ',' + c.j}>
              {die <= 0 ? <Cell2 x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} lod={lod} look={lookMix(TUMOR, {...TUMOR, nuc: '#7A3A1A'}, pk * 0.5)} /> : <ApoptoticCell x={c.x} y={c.y} r={CELL_R} seed={c.seed} t={t} die={die} lod={lod} />}
              {die <= 0.2 && <Markers c={c} k={1 - die * 5} alt={0} t={t} />}
              {pk > 0.01 && die < 0.5 && Array.from({length: 5}, (_, m) => <circle key={m} cx={c.x + Math.cos(m * 1.3 + c.seed) * CELL_R * 0.5 * pk} cy={c.y + Math.sin(m * 1.3 + c.seed) * CELL_R * 0.5 * pk} r={7} fill={P.payload} opacity={pk * (1 - die * 2)} />)}
            </g>
          );
        })}
        {/* carriers that leave through the gaps and stick to marked cells */}
        {BIND.map((b, k) => {
          const u = (t - b.t0) / 1.4;
          if (u < 0 || t > tD.deliver + 1.2) return null;
          const sx = b.gx - 600 + Math.min(u, 0.4) / 0.4 * 600, sy = lerp(-500, LUM[1] - 30, smooth(Math.min(u, 0.4) / 0.4));
          const tgt: Pt = [b.cell.x + Math.cos(b.ang) * (CELL_R + 10), b.cell.y + Math.sin(b.ang) * (CELL_R + 10)];
          const v = smooth((u - 0.4) / 0.6);
          const x = u < 0.4 ? sx : lerp(b.gx, tgt[0], v), y = u < 0.4 ? sy : lerp(LUM[1] + 10, tgt[1], v);
          const inside = lift(t, tD.deliver - 0.1, tD.deliver + 0.6);
          return <g key={'bd' + k} opacity={1 - inside}><Speck x={x} y={y} t={t} z={cam.z} seed={k + 5} gold /></g>;
        })}
        {/* after the change, new carriers reach the resistant cell and bounce off */}
        {t > tD.mutate + 0.3 && t < tD.weapon + 0.5 && [0, 1, 2].map((k) => {
          const u = clamp01((t - tD.mutate - 0.3 - k * 0.35) / 1.1);
          if (u <= 0) return null;
          const a = -Math.PI / 2 + (k - 1) * 0.6;
          const near: Pt = [RES.x + Math.cos(a) * (CELL_R + 14), RES.y + Math.sin(a) * (CELL_R + 14)];
          const far: Pt = [RES.x + Math.cos(a) * 460, RES.y + Math.sin(a) * 460];
          const p = u < 0.5 ? [lerp(far[0], near[0], smooth(u * 2)), lerp(far[1], near[1], smooth(u * 2))] : [lerp(near[0], far[0] + 200, smooth((u - 0.5) * 2)), lerp(near[1], far[1] - 100, smooth((u - 0.5) * 2))];
          return <g key={'bo' + k} opacity={1 - smooth((u - 0.7) / 0.3)}><circle cx={p[0]} cy={p[1]} r={9} fill={P.carrier} stroke={P.ligand} strokeWidth={3} />{u > 0.45 && u < 0.62 && <circle cx={near[0]} cy={near[1]} r={22} fill="none" stroke={P.markerAlt} strokeWidth={4} />}</g>;
        })}
      </g>
    </g>
  );
};

// ================================================================================================ nano world 2: binding, uptake, release
const Nano2: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const pit = lift(t, tD.deliver - 0.25, tD.deliver + 0.35);
  const pinch = lift(t, tD.deliver + 0.3, tD.deliver + 0.7);
  const open = lift(t, tD.deliver + 0.75, tD.directly - 0.1);
  const cy = lerp(-470, 380, smooth(pit * 0.6 + pinch * 0.4));
  const dip = (x: number) => (1 - pinch) * pit * 760 * Math.exp(-((x / (420 - 120 * pit)) ** 2));
  const heads: React.ReactNode[] = [];
  for (let x = -1800; x <= 1800; x += 34) {
    const y = dip(x);
    heads.push(<circle key={'o' + x} cx={x} cy={y - 22} r={14} fill={P.tissueLight} />, <circle key={'i' + x} cx={x} cy={y + 22} r={14} fill={P.tissue} />);
  }
  const recXs = [-900, -560, -200, 200, 560, 900];
  return (
    <g>
      <rect width={W} height={H} fill="#4A0A18" />
      <g transform={camTransform(cam)}>
        <rect x={-3000} y={0} width={6000} height={3000} fill={P.cyto} />
        <rect x={-3000} y={0} width={6000} height={3000} fill="url(#glowMag)" opacity={0.15} />
        {Array.from({length: 14}, (_, k) => <circle key={k} cx={-1600 + k * 260} cy={900 + 140 * Math.sin(k * 1.7)} r={60} fill={P.er} opacity={0.4} />)}
        {heads}
        {pinch > 0.01 && (
          <g opacity={pinch}>
            {Array.from({length: 40}, (_, k) => {
              const a = (k / 40) * Math.PI * 2;
              return <circle key={k} cx={Math.cos(a) * (CR + 60)} cy={cy + Math.sin(a) * (CR + 60)} r={14} fill={P.tissueLight} />;
            })}
          </g>
        )}
        {/* marker receptors (pink Y proteins) */}
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
        <Carrier x={0} y={cy} r={CR} t={t} bound={1} open={open} lod={1} />
        {open > 0.01 && Array.from({length: 18}, (_, k) => {
          const a = (k / 18) * Math.PI * 2;
          const d = 80 + open * 900 * (0.5 + 0.5 * rand(k));
          return <Molecule key={k} mol={MOL_FIT} x={Math.cos(a) * d} y={cy + Math.sin(a) * d * 0.7 + open * 200} rot={k * 40 + t * 20} s={0.16} op={open} />;
        })}
      </g>
    </g>
  );
};

export const shotsD: Shot[] = [
  {id: 'D-protein', t0: tD.but, t1: tD.imagine, draw: (t) => <ProteinD t={t} cam={PRD(t)} />},
  {id: 'D-carrier', t0: tD.imagine, t1: VH[1] + 0.05, draw: (t) => <CarrierBuild t={t} cam={NAC(t)} />},
  {id: 'D-vessel', t0: VH[0], t1: N2H[1] + 0.05, fade: VH[1] - VH[0], draw: (t) => <VesselD t={t} cam={t < VH[1] ? fromNano(NAC(t), t) : DV(t)} />},
  {id: 'D-nano', t0: N2H[0], t1: N2_OUT[1] + 0.05, fade: N2H[1] - N2H[0], draw: (t) => <Nano2 t={t} cam={t < N2H[1] ? toNano2(DV(t)) : N2(t)} />},
  {id: 'D-vessel2', t0: N2_OUT[0], t1: tD.army + 0.25, fade: N2_OUT[1] - N2_OUT[0], draw: (t) => <VesselD t={t} cam={DV2(t)} />},
];
export const tDdone = tD.army;
export const RES_CELL = RES;
export const _d = {VW, TE};
