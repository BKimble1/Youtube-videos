// Viaduct — the elevated highway heading east from x 7200 (deck top y = −1600, slab to −1510, girders to −1350), with
// guardrails, piers, the maintenance stair up pier 1, an outboard steel catwalk (floor y = −1250) with steam pipes, and
// an access ladder from the catwalk to the deck near the broken edge. BrokenSpan: the jagged edges at 10500 / 12500 and
// the waterfront road far below. Landing: the far deck section 12500 … 13500 with the automated barrier arm and the
// stairs down to the waterfront (13500, −1600) → (14500, 0).
//
// Layering for figures: Viaduct (back), figures, then ViaductFront (south guardrail; catwalk outer railing) and
// LandingFront (its guardrail and stair rail). Guardrail gaps can be opened for staging.
import React from 'react';
import {CITY} from '../theme';
import {rnd, noise, f2, range, polyPath, INK, K, jagged, SmokeColumn, blobD} from './cityKit';

export const DECK = -1600, SLAB = -1510, GIRDER = -1350, CATWALK = -1250;
export const NEAR_EDGE = 10500, FAR_EDGE = 12500, LANDING_END = 13500, STAIR_END = 14500;
export const PIERS = [7400, 8900, 10150];
export const LADDER_X = 10330;

// --- maintenance stair on pier 1: flight 1 (6600,0)→(7000,−625), landing to 7100, flight 2 (7100,−625)→(7450,−1250)
const F1 = {x0: 6600, x1: 7000, y0: 0, y1: -625}, F2 = {x0: 7100, x1: 7450, y0: -625, y1: CATWALK};
const STEPS1 = 12, STEPS2 = 12;
/** Top-surface points of every step of the pier stair in climbing order (ground → catwalk). */
export const pierStairSteps = () => {
  const out: {x: number; y: number}[] = [];
  for (let i = 1; i <= STEPS1; i++) out.push({x: F1.x0 + ((i - 0.5) * (F1.x1 - F1.x0)) / STEPS1, y: F1.y0 + (i * (F1.y1 - F1.y0)) / STEPS1});
  out.push({x: 7050, y: -625});
  for (let i = 1; i <= STEPS2; i++) out.push({x: F2.x0 + ((i - 0.5) * (F2.x1 - F2.x0)) / STEPS2, y: F2.y0 + (i * (F2.y1 - F2.y0)) / STEPS2});
  return out;
};
/** Ladder from the catwalk (y −1250) to the deck top (y −1600) at LADDER_X: rung points bottom → top. */
export const ladderRungs = () => range(8).map((i) => ({x: LADDER_X, y: CATWALK - 20 - i * 45}));

// --- landing stairs (13500, −1600) → (14500, 0)
const LS = 32;
export const LANDING_STAIR_N = LS;
export const landingStep = (i: number) => ({x: LANDING_END + ((i + 0.5) * (STAIR_END - LANDING_END)) / LS, y: DECK + ((i + 1) * -DECK) / LS});
/** Barrier arm on the landing: pivot and tip for angle a (0 = raised vertical, 90 = lowered pointing west). */
export const BARRIER_PIVOT = {x: 12700, y: DECK - 330};
export const barrierTip = (a: number) => {
  const r = (a * Math.PI) / 180;
  return {x: BARRIER_PIVOT.x - Math.sin(r) * 560, y: BARRIER_PIVOT.y - Math.cos(r) * 560};
};

const Pier: React.FC<{x: number; ink: number; seed: number}> = ({x, ink, seed}) => (
  <g>
    <rect x={x - 150} y={GIRDER + 110} width={300} height={-GIRDER - 110} fill={K.concrete} stroke={INK} strokeWidth={ink} />
    <rect x={x - 150} y={GIRDER + 110} width={70} height={-GIRDER - 110} fill={K.concreteDark} opacity={0.35} />
    <path d={polyPath([{x: x - 260, y: GIRDER}, {x: x + 260, y: GIRDER}, {x: x + 200, y: GIRDER + 120}, {x: x - 200, y: GIRDER + 120}])} fill={K.concreteLight} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
    <path d={`M ${f2(x - 60)} ${f2(-400)} l 40 -160 l -30 -120`} fill="none" stroke={K.concreteDark} strokeWidth={ink * 0.7} />
    {rnd(seed) > 0.5 && <path d={blobD(60, seed, 7, 0.5, 1.2, 0.8)} transform={`translate(${f2(x + 40)} ${f2(-900)})`} fill={K.soot} opacity={0.45} />}
  </g>
);

export type ViaductProps = {x0?: number; x1?: number; t: number; ink?: number; seed?: number; ventX?: number; vent?: number; stair?: boolean; catwalk?: boolean};

/** Deck, girders, piers, pier stair, catwalk floor + inner railing, pipes, ladder. (x1 = the broken near edge.) */
export const Viaduct: React.FC<ViaductProps> = ({x0 = 7200, x1 = NEAR_EDGE, t, ink = 6, seed = 3, ventX = 9300, vent = 1, stair = true, catwalk = true}) => {
  const els: React.ReactElement[] = [];
  // girders under the slab, with stiffeners
  els.push(<rect key="gird" x={x0} y={SLAB} width={x1 - x0} height={GIRDER - SLAB} fill={K.steel} stroke={INK} strokeWidth={ink} />);
  range(Math.floor((x1 - x0) / 300)).forEach((i) => els.push(<line key={`st${i}`} x1={x0 + 150 + i * 300} y1={SLAB} x2={x0 + 150 + i * 300} y2={GIRDER} stroke={K.steelDark} strokeWidth={ink * 0.8} />));
  els.push(<rect key="flange" x={x0} y={GIRDER - 24} width={x1 - x0} height={24} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.8} />);
  // slab with fascia
  els.push(<rect key="slab" x={x0} y={DECK} width={x1 - x0} height={SLAB - DECK} fill={K.concreteLight} stroke={INK} strokeWidth={ink} />);
  els.push(<rect key="fasc" x={x0} y={DECK + 52} width={x1 - x0} height={14} fill={K.concreteDark} opacity={0.55} />);
  // rust and soot streaks (a few)
  range(5).forEach((i) => {
    const k = seed * 13 + i;
    const sx = x0 + 200 + rnd(k) * (x1 - x0 - 400);
    els.push(<path key={`ru${i}`} d={`M ${f2(sx)} ${f2(SLAB)} q ${f2(20)} ${f2(80)} ${f2(-6)} ${f2(150)}`} stroke={K.rust} strokeWidth={ink * 1.6} fill="none" opacity={0.5} />);
  });
  // far (north) guardrail on the deck top: a darker silhouette behind
  els.push(<rect key="ngr" x={x0} y={DECK - 120} width={x1 - x0} height={120} fill={K.concreteDark} stroke={INK} strokeWidth={ink * 0.7} />);
  // piers
  PIERS.filter((px) => px > x0 && px < x1).forEach((px, i) => els.push(<Pier key={`p${i}`} x={px} ink={ink} seed={seed + i} />));
  // steam pipes along the girder face
  const pipe = (y: number, r: number, key: string, broken: boolean) => {
    const gap = broken ? [ventX - 70, ventX + 50] : null;
    const segs = gap ? [[x0 + 40, gap[0]], [gap[1], x1 - 30]] : [[x0 + 40, x1 - 30]];
    return (
      <g key={key}>
        {segs.map(([a, b], j) => (
          <g key={j}>
            <rect x={a} y={y - r} width={b - a} height={r * 2} fill="#8C8B86" stroke={INK} strokeWidth={ink * 0.8} />
            <rect x={a} y={y - r} width={b - a} height={r * 0.5} fill="#A7A59E" opacity={0.6} />
            {range(Math.floor((b - a) / 600)).map((k) => <rect key={k} x={a + 300 + k * 600} y={y - r - 10} width={34} height={r * 2 + 20} rx={6} fill="#6E6D69" stroke={INK} strokeWidth={ink * 0.6} />)}
          </g>
        ))}
        {gap && <path d={polyPath(jagged({x: gap[0], y: y - r}, {x: gap[0], y: y + r}, seed + 9, 18, 5).concat([{x: gap[0] - 4, y: y + r}]))} fill="#5E5D59" stroke={INK} strokeWidth={ink * 0.6} />}
      </g>
    );
  };
  els.push(pipe(GIRDER + 50, 46, 'pipe1', vent > 0));
  els.push(pipe(GIRDER + 135, 30, 'pipe2', false));
  // pipe hangers
  range(Math.floor((x1 - x0) / 600)).forEach((i) => els.push(<line key={`ph${i}`} x1={x0 + 260 + i * 600} y1={GIRDER} x2={x0 + 260 + i * 600} y2={GIRDER + 150} stroke={K.steelDark} strokeWidth={ink * 1.2} />));
  // catwalk: brackets, grating floor, inner (back) railing
  if (catwalk) {
    const cx0 = Math.max(x0, F2.x1), cx1 = x1 - 120;
    range(Math.floor((cx1 - cx0) / 500) + 1).forEach((i) => {
      const bx = cx0 + i * 500;
      els.push(<path key={`br${i}`} d={`M ${f2(bx)} ${f2(GIRDER)} L ${f2(bx)} ${f2(CATWALK + 30)} L ${f2(bx + 90)} ${f2(CATWALK + 30)}`} fill="none" stroke={K.steelDark} strokeWidth={ink * 2} />);
    });
    els.push(<rect key="cwf" x={cx0} y={CATWALK} width={cx1 - cx0} height={30} fill={K.steelDark} stroke={INK} strokeWidth={ink} />);
    range(Math.floor((cx1 - cx0) / 80)).forEach((i) => els.push(<line key={`gr${i}`} x1={cx0 + i * 80} y1={CATWALK + 4} x2={cx0 + i * 80 + 40} y2={CATWALK + 26} stroke="#2A3036" strokeWidth={ink * 0.5} />));
    // ladder to the deck
    els.push(<g key="lad">
      <line x1={LADDER_X - 50} y1={CATWALK} x2={LADDER_X - 50} y2={DECK - 60} stroke={K.steelDark} strokeWidth={ink * 2} />
      <line x1={LADDER_X + 50} y1={CATWALK} x2={LADDER_X + 50} y2={DECK - 60} stroke={K.steelDark} strokeWidth={ink * 2} />
      {ladderRungs().map((r, i) => <line key={i} x1={LADDER_X - 50} y1={r.y} x2={LADDER_X + 50} y2={r.y} stroke={K.steelDark} strokeWidth={ink * 1.4} />)}
    </g>);
  }
  // the vent: steam jet from the broken pipe
  const steam = vent > 0 ? (
    <g>
      <SmokeColumn x={ventX - 20} y={GIRDER + 60} h={700} w={420} t={t} seed={seed + 77} color="#E6E2DA" op={0.55 * vent} drift={-0.6} n={10} />
      <SmokeColumn x={ventX + 40} y={GIRDER + 60} h={500} w={300} t={t * 1.3} seed={seed + 91} color="#F2EFE8" op={0.5 * vent} drift={0.5} n={8} />
    </g>
  ) : null;
  // pier stair (behind figures; its outer rail is in ViaductFront)
  const stairEl = stair ? (
    <g>
      {[F1, F2].map((f, j) => {
        const n = j ? STEPS2 : STEPS1;
        const pts = [{x: f.x0, y: f.y0}];
        for (let i = 1; i <= n; i++) { const x = f.x0 + (i * (f.x1 - f.x0)) / n; pts.push({x: x - (f.x1 - f.x0) / n, y: f.y0 + (i * (f.y1 - f.y0)) / n}, {x, y: f.y0 + (i * (f.y1 - f.y0)) / n}); }
        return <g key={j}>
          <line x1={f.x0} y1={f.y0 + 40} x2={f.x1} y2={f.y1 + 40} stroke={K.steelDark} strokeWidth={ink * 4} />
          <polyline points={pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke={K.steel} strokeWidth={ink * 2.4} strokeLinejoin="miter" />
        </g>;
      })}
      <rect x={7000} y={-625} width={100} height={26} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.7} />
      <line x1={7050} y1={-600} x2={7050} y2={0} stroke={K.steelDark} strokeWidth={ink * 2.4} />
      <line x1={7380} y1={CATWALK + 30} x2={7380} y2={0} stroke={K.steelDark} strokeWidth={ink * 2.4} />
    </g>
  ) : null;
  return <g>{els}{stairEl}{steam}{void noise}</g>;
};

/** Front layer: the south guardrail on the deck (with gaps) and the catwalk's outer railing and the pier-stair rail. */
export const ViaductFront: React.FC<{x0?: number; x1?: number; ink?: number; gaps?: [number, number][]; catwalk?: boolean; stair?: boolean; deckRail?: boolean}> = ({x0 = 7200, x1 = NEAR_EDGE, ink = 6, gaps = [], catwalk = true, stair = true, deckRail = true}) => {
  const segs: [number, number][] = [];
  let a = x0;
  [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { if (g0 > a) segs.push([a, g0]); a = Math.max(a, g1); });
  if (a < x1) segs.push([a, x1 - 40]);
  const cx0 = Math.max(x0, F2.x1), cx1 = x1 - 120;
  return (
    <g>
      {deckRail && segs.map(([s0, s1], i) => (
        <g key={i}>
          <path d={polyPath([{x: s0, y: DECK}, {x: s0, y: DECK - 80}, {x: s0 + 30, y: DECK - 120}, {x: s1 - 30, y: DECK - 120}, {x: s1, y: DECK - 80}, {x: s1, y: DECK}])} fill={K.concreteLight} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
          <rect x={s0} y={DECK - 200} width={s1 - s0} height={20} fill={K.steel} stroke={INK} strokeWidth={ink * 0.7} />
          {range(Math.max(1, Math.floor((s1 - s0) / 400))).map((k) => <rect key={k} x={s0 + 60 + k * 400} y={DECK - 200} width={16} height={80} fill={K.steelDark} />)}
        </g>
      ))}
      {catwalk && (
        <g>
          <rect x={cx0} y={CATWALK - 260} width={cx1 - cx0} height={18} fill={K.steel} stroke={INK} strokeWidth={ink * 0.7} />
          <rect x={cx0} y={CATWALK - 130} width={cx1 - cx0} height={12} fill={K.steel} stroke={INK} strokeWidth={ink * 0.5} />
          {range(Math.floor((cx1 - cx0) / 500) + 1).map((k) => <rect key={k} x={cx0 + k * 500 - 8} y={CATWALK - 260} width={16} height={260} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.4} />)}
          <rect x={cx0} y={CATWALK + 20} width={cx1 - cx0} height={40} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.8} />
        </g>
      )}
      {stair && [F1, F2].map((f, j) => (
        <g key={`sr${j}`}>
          <line x1={f.x0} y1={f.y0 - 240} x2={f.x1} y2={f.y1 - 240} stroke={K.steel} strokeWidth={ink * 2} strokeLinecap="round" />
          <line x1={f.x0} y1={f.y0 - 240} x2={f.x0} y2={f.y0} stroke={K.steelDark} strokeWidth={ink * 1.6} />
          <line x1={f.x1} y1={f.y1 - 240} x2={f.x1} y2={f.y1} stroke={K.steelDark} strokeWidth={ink * 1.6} />
        </g>
      ))}
    </g>
  );
};

/** Jagged deck ends with rebar and hanging concrete, the waterfront road far below the gap. */
export const BrokenSpan: React.FC<{t: number; ink?: number; seed?: number; road?: boolean}> = ({t, ink = 6, seed = 5, road = true}) => {
  const edge = (x: number, side: 1 | -1, k: number) => {
    // side = +1: the near section ends here (material to the left); −1: the far section starts here
    const pts = jagged({x, y: DECK}, {x: x - side * 60, y: GIRDER}, k, 50, 6);
    const body = side === 1
      ? [{x: x - 400, y: DECK}, ...pts, {x: x - 400, y: GIRDER}]
      : [{x: x + 400, y: DECK}, ...pts, {x: x + 400, y: GIRDER}];
    const rebar = range(6).map((i) => {
      const y = DECK + 30 + i * 40;
      const L = 80 + rnd(k + i) * 140;
      const bend = (rnd(k + i + 9) - 0.3) * 80;
      return <path key={i} d={`M ${f2(x - side * 10)} ${f2(y)} q ${f2(side * L * 0.6)} ${f2(bend * 0.2)} ${f2(side * L)} ${f2(bend)}`} stroke={K.rebar} strokeWidth={ink * 1.1} fill="none" strokeLinecap="round" />;
    });
    const hang = (
      <g>
        <line x1={x + side * 40} y1={GIRDER - 40} x2={x + side * 70} y2={GIRDER + 160} stroke={K.rebar} strokeWidth={ink} />
        <path d={polyPath([{x: x + side * 20, y: GIRDER + 150}, {x: x + side * 130, y: GIRDER + 170}, {x: x + side * 110, y: GIRDER + 260}, {x: x + side * 10, y: GIRDER + 240}])} fill={K.concrete} stroke={INK} strokeWidth={ink} strokeLinejoin="round" transform={`rotate(${f2(noise(t * 0.8, k) * 3)} ${f2(x + side * 70)} ${f2(GIRDER + 160)})`} />
      </g>
    );
    return <g key={k}><path d={polyPath(body)} fill={K.concreteLight} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />{rebar}{hang}</g>;
  };
  return (
    <g>
      {road && (
        <g>
          <rect x={NEAR_EDGE - 600} y={0} width={FAR_EDGE - NEAR_EDGE + 1200} height={380} fill={K.road} />
          {range(5).map((i) => <rect key={i} x={NEAR_EDGE - 400 + i * 600} y={170} width={300} height={16} rx={6} fill={K.lane} opacity={0.5} />)}
          <rect x={NEAR_EDGE - 600} y={-60} width={FAR_EDGE - NEAR_EDGE + 1200} height={60} fill="#5A5254" />
          {range(9).map((i) => <line key={`fn${i}`} x1={NEAR_EDGE - 500 + i * 400} y1={-60} x2={NEAR_EDGE - 500 + i * 400} y2={-300} stroke={K.steelDark} strokeWidth={ink} />)}
          <line x1={NEAR_EDGE - 520} y1={-290} x2={FAR_EDGE + 560} y2={-290} stroke={K.steelDark} strokeWidth={ink} />
          {/* fallen deck slab on the road */}
          <path d={polyPath(jagged({x: NEAR_EDGE + 300, y: 0}, {x: NEAR_EDGE + 1100, y: -180}, seed, 40, 6).concat([{x: NEAR_EDGE + 1150, y: 0}]))} fill={K.concrete} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
        </g>
      )}
      {edge(NEAR_EDGE, 1, seed * 7)}
      {edge(FAR_EDGE, -1, seed * 7 + 40)}
    </g>
  );
};

/** The far deck section (landing) with its pier and stair down to the waterfront; barrier arm angle 0 (up) … 90. */
export const Landing: React.FC<{t: number; ink?: number; barrier?: number; seed?: number}> = ({t, ink = 6, barrier = 0, seed = 8}) => {
  const tip = barrierTip(barrier);
  const blink = Math.floor(t * 2) % 2 === 0 && barrier > 1 && barrier < 89;
  return (
    <g>
      <rect x={FAR_EDGE} y={SLAB} width={LANDING_END - FAR_EDGE} height={GIRDER - SLAB} fill={K.steel} stroke={INK} strokeWidth={ink} />
      <rect x={FAR_EDGE} y={DECK} width={LANDING_END - FAR_EDGE} height={SLAB - DECK} fill={K.concreteLight} stroke={INK} strokeWidth={ink} />
      <rect x={FAR_EDGE} y={DECK - 120} width={LANDING_END - FAR_EDGE} height={120} fill={K.concreteDark} stroke={INK} strokeWidth={ink * 0.7} />
      <Pier x={13050} ink={ink} seed={seed} />
      {/* stair down to the waterfront */}
      <path d={polyPath([{x: LANDING_END, y: DECK}, ...range(LS).flatMap((i) => [{x: LANDING_END + (i * (STAIR_END - LANDING_END)) / LS, y: DECK + (i * -DECK) / LS}, {x: LANDING_END + (i * (STAIR_END - LANDING_END)) / LS, y: DECK + ((i + 1) * -DECK) / LS}]), {x: STAIR_END, y: 0}, {x: LANDING_END, y: 0}])} fill={K.steel} stroke={INK} strokeWidth={ink} strokeLinejoin="round" opacity={0.95} />
      <path d={polyPath([{x: LANDING_END, y: DECK + 60}, {x: STAIR_END - 60, y: 0}, {x: LANDING_END, y: 0}])} fill={K.steelDark} opacity={0.6} />
      {/* barrier: post with the system's light strip, boom */}
      <rect x={BARRIER_PIVOT.x - 40} y={BARRIER_PIVOT.y - 30} width={80} height={DECK - BARRIER_PIVOT.y + 30} fill={K.sysShade} stroke={INK} strokeWidth={ink} />
      <rect x={BARRIER_PIVOT.x - 10} y={BARRIER_PIVOT.y + 20} width={20} height={200} fill={blink ? K.sysLock : K.sysSensor} />
      <line x1={BARRIER_PIVOT.x} y1={BARRIER_PIVOT.y} x2={tip.x} y2={tip.y} stroke={INK} strokeWidth={34 + ink * 2} strokeLinecap="round" />
      <line x1={BARRIER_PIVOT.x} y1={BARRIER_PIVOT.y} x2={tip.x} y2={tip.y} stroke={K.sysPanel} strokeWidth={34} strokeLinecap="round" />
      {range(4).map((i) => {
        const u = 0.2 + i * 0.2;
        return <line key={i} x1={BARRIER_PIVOT.x + (tip.x - BARRIER_PIVOT.x) * u} y1={BARRIER_PIVOT.y + (tip.y - BARRIER_PIVOT.y) * u} x2={BARRIER_PIVOT.x + (tip.x - BARRIER_PIVOT.x) * (u + 0.08)} y2={BARRIER_PIVOT.y + (tip.y - BARRIER_PIVOT.y) * (u + 0.08)} stroke={K.sysLock} strokeWidth={30} />;
      })}
      <circle cx={BARRIER_PIVOT.x} cy={BARRIER_PIVOT.y} r={30} fill={K.sysSlate} stroke={INK} strokeWidth={ink} />
      {void CITY}
    </g>
  );
};

/** Landing front: south guardrail (open at the west edge where the basket docks) and the stair handrail. */
export const LandingFront: React.FC<{ink?: number; openTo?: number}> = ({ink = 6, openTo = 12950}) => (
  <g>
    <path d={polyPath([{x: openTo, y: DECK}, {x: openTo, y: DECK - 80}, {x: openTo + 30, y: DECK - 120}, {x: LANDING_END - 30, y: DECK - 120}, {x: LANDING_END, y: DECK - 80}, {x: LANDING_END, y: DECK}])} fill={K.concreteLight} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
    <line x1={LANDING_END} y1={DECK - 250} x2={STAIR_END} y2={-250} stroke={K.steel} strokeWidth={ink * 2.2} strokeLinecap="round" />
    {range(5).map((i) => { const u = i / 4; return <line key={i} x1={LANDING_END + u * 1000} y1={DECK + u * 1600 - 250} x2={LANDING_END + u * 1000} y2={DECK + u * 1600} stroke={K.steelDark} strokeWidth={ink * 1.4} />; })}
  </g>
);
