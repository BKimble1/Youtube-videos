// The first prototype (version 1), visibly a different machine from the electric board: a dark anodised aluminium
// plank on cross rails carrying FIVE small turbojet engines mounted vertically through the deck (2-1-2), intakes up and
// nozzles down, an orange fuel tank strapped to the deck with fuel lines to every engine, and the wiring loom to the
// engine controller. Shown on a steel test stand in the workshop. Board-local frame as the electric board (x, y up, z).
import React from 'react';
import {INK} from '../dc/ink';
import {circ3, f2, hull, inkW, LinFill, bbox, polyD, proj, shade, smoothD, thin, curveD, lit, mix} from '../eng/draw';
import {d3, Frame, Lens, m3, s3, toW, V3, v3, a3} from '../eng/v3';

export const JET = {
  engines: [[-0.2, 0.46], [0.2, 0.46], [0, 0], [-0.2, -0.46], [0.2, -0.46]] as [number, number][],
  r: 0.075,
  top: 0.1,
  bot: -0.36,
  deck: {x: 0.34, z: 0.72, t: 0.045},
  tank: {x: 0.0, z0: -0.13, z1: -0.33, r: 0.062},
};
export const JCOL = {
  deck: '#3E4650',
  rail: '#2A3038',
  casing: '#B9C2CA',
  casingDeep: '#7E8892',
  nozzle: '#5B5048',
  intake: '#20262D',
  blade: '#8E99A4',
  tank: '#E2552B',
  fuel: '#F08A2E',
  wire: '#1C1F24',
  wireRed: '#C0392B',
  ecu: '#2C3B47',
  scorch: '#1E1712',
  stand: '#5C6670',
};

export type JetState = {
  /** compressor phase (turns) and speed (turns/s) */
  phase: number;
  rps: number;
  /** 0..1 burn damage: scorch on the wiring, the fuel lines and the deck */
  burn: number;
  /** V2: per-engine lift above its mount (m): an engine being lowered into place during the assembly */
  lift?: number[];
  /** V2: 0..1 heat soak: nozzles glow, nearby fuel lines and wiring heat toward orange */
  heat?: number;
  /** V7: 0..1 the casings themselves overheating (the lower casings toward dull red, the upper ones warming) */
  casingHeat?: number;
};

const eng = (B: Frame, i: number, y: number) => toW(B, v3(JET.engines[i][0], y, JET.engines[i][1]));

export const jetIntake = (B: Frame, i: number, lift = 0) => eng(B, i, JET.top + lift);
export const jetNozzle = (B: Frame, i: number, lift = 0) => eng(B, i, JET.bot + lift);
/** V2: the fuel-line fitting at engine i (where the leak ignites) and points along its line back to the tank */
export const jetFuelLine = (B: Frame, i: number): V3[] => {
  const [ex, ez] = JET.engines[i];
  const T = JET.tank;
  return [v3(T.x + Math.sign(ex || 0.001) * 0.03, T.r * 1.6, (T.z0 + T.z1) / 2), v3(ex * 0.6, 0.05, ez * 0.5 + (T.z0 + T.z1) / 4), v3(ex, JET.top - 0.02, ez + (ez > 0 ? -JET.r : ez < 0 ? JET.r : -JET.r))].map((q) => toW(B, q));
};

export const JetBoard: React.FC<{id: string; L: Lens; B: Frame; st: JetState; stand?: boolean; overlay?: React.ReactNode}> = ({id, L, B, st, stand = true, overlay}) => {
  const kc = L.p(B.o).k;
  const w = inkW(kc, 0.004);
  const above = d3(s3(L.pos, B.o), B.y) > 0;
  const lifts = st.lift ?? [];
  const heat = st.heat ?? 0;
  const ch = st.casingHeat ?? 0;
  const eng = (Bf: Frame, i: number, y: number) => toW(Bf, v3(JET.engines[i][0], y + (lifts[i] ?? 0), JET.engines[i][1]));
  const D = JET.deck;
  const deckPts = (y: number) => [v3(-D.x, y, -D.z), v3(D.x, y, -D.z), v3(D.x, y, D.z), v3(-D.x, y, D.z)].map((q) => toW(B, q));
  const deckTop = deckPts(0), deckBot = deckPts(-D.t);
  const deckSide = thin(hull(proj(L, [...deckTop, ...deckBot])), 1);
  const face = proj(L, above ? deckTop : deckBot);
  // engine casing: hull of the top and bottom rims, cylinder shading across it
  const casing = (i: number, y0: number, y1: number, r0: number, r1: number, color: string, key: string) => {
    const a = circ3(eng(B, i, y0), B.x, B.z, r0, 20), b = circ3(eng(B, i, y1), B.x, B.z, r1, 20);
    const pts = thin(hull(proj(L, [...a, ...b])), 0.8);
    const bb = bbox(pts);
    // shade across the screen-space width (perpendicular to the projected axis)
    const pa = L.p(eng(B, i, y0)), pb = L.p(eng(B, i, y1));
    const ax = {x: pb.x - pa.x, y: pb.y - pa.y};
    const al = Math.hypot(ax.x, ax.y) || 1;
    const n = {x: -ax.y / al, y: ax.x / al};
    const r = r0 * pa.k;
    return (
      <g key={key}>
        <defs>
          <linearGradient id={`${id}-${key}`} gradientUnits="userSpaceOnUse" x1={f2(bb.cx - n.x * r)} y1={f2(bb.cy - n.y * r)} x2={f2(bb.cx + n.x * r)} y2={f2(bb.cy + n.y * r)}>
            <stop offset="0" stopColor={lit(color, 0.35)} />
            <stop offset="0.3" stopColor={lit(color, 0.15)} />
            <stop offset="0.65" stopColor={color} />
            <stop offset="1" stopColor={shade(color, 0.45)} />
          </linearGradient>
        </defs>
        <path d={smoothD(pts, 0.06)} fill={`url(#${id}-${key})`} stroke={INK} strokeWidth={f2(w * 2)} strokeLinejoin="round" paintOrder="stroke" />
      </g>
    );
  };
  const intakeFace = (i: number) => {
    const c = eng(B, i, JET.top);
    if (d3(s3(L.pos, c), B.y) <= 0) return null;
    const rim = proj(L, circ3(c, B.x, B.z, JET.r, 28));
    const inner = proj(L, circ3(a3(c, m3(B.y, -0.01)), B.x, B.z, JET.r * 0.84, 28));
    const blur = Math.min(1, st.rps / 25);
    const blades: React.ReactNode[] = [];
    const nb = 9;
    for (let b = 0; b < nb; b++) {
      const a0 = st.phase * Math.PI * 2 + (b * Math.PI * 2) / nb + i;
      const P = (r: number, a: number) => toW(B, v3(JET.engines[i][0] + Math.cos(a) * r, JET.top - 0.012, JET.engines[i][1] + Math.sin(a) * r));
      const q = proj(L, [P(0.02, a0 - 0.1), P(0.062, a0 - 0.32), P(0.062, a0 + 0.02), P(0.02, a0 + 0.14)]);
      blades.push(<path key={b} d={polyD(q)} fill={JCOL.blade} opacity={1 - blur * 0.75} stroke={INK} strokeWidth={f2(w * 0.5)} strokeOpacity={1 - blur} />);
    }
    const spinner = proj(L, circ3(a3(c, m3(B.y, 0.005)), B.x, B.z, 0.022, 16));
    const disc = proj(L, circ3(a3(c, m3(B.y, -0.012)), B.x, B.z, 0.064, 24));
    return (
      <g key={`in${i}`}>
        <path d={polyD(rim)} fill={lit(JCOL.casing, 0.2)} stroke={INK} strokeWidth={f2(w * 1.6)} />
        <path d={polyD(inner)} fill={JCOL.intake} />
        {blur > 0.05 && <path d={polyD(disc)} fill="#9AA6B2" opacity={0.35 * blur} />}
        {blades}
        <path d={polyD(spinner)} fill={mix(JCOL.casing, '#E8EDF1', 0.5)} stroke={INK} strokeWidth={f2(w)} />
      </g>
    );
  };
  // fuel tank (cylinder lying along z) and lines
  const T = JET.tank;
  const tankA = circ3(toW(B, v3(T.x, T.r + 0.002, T.z0)), B.x, B.y, T.r, 18), tankB = circ3(toW(B, v3(T.x, T.r + 0.002, T.z1)), B.x, B.y, T.r, 18);
  const tankPts = thin(hull(proj(L, [...tankA, ...tankB])), 0.8);
  const burn = st.burn;
  const fuelCol = mix(mix(JCOL.fuel, '#FFB25A', heat * 0.6), JCOL.scorch, burn * 0.85);
  const line = (i: number) => {
    if ((lifts[i] ?? 0) > 0.005) return null;
    const [ex, ez] = JET.engines[i];
    const pts = [v3(T.x + Math.sign(ex || 0.001) * 0.03, T.r * 1.6, (T.z0 + T.z1) / 2), v3(ex * 0.6, 0.05, ez * 0.5 + (T.z0 + T.z1) / 4), v3(ex, JET.top - 0.02, ez + (ez > 0 ? -JET.r : ez < 0 ? JET.r : -JET.r))].map((q) => toW(B, q));
    return <path key={`fl${i}`} d={curveD(proj(L, pts))} stroke={fuelCol} strokeWidth={f2(Math.max(1, 0.012 * kc))} fill="none" strokeLinecap="round" />;
  };
  const wires = JET.engines.map(([ex, ez], i) => {
    const pts = [v3(0.24, 0.03, -0.62), v3(ex * 0.8 + 0.08, 0.025, ez * 0.7 - 0.08), v3(ex + 0.06, JET.top - 0.05, ez)].map((q) => toW(B, q));
    if ((lifts[i] ?? 0) > 0.005) return null;
    const col = mix(i % 2 ? mix(JCOL.wireRed, JCOL.scorch, burn * 0.9) : JCOL.wire, '#E8572A', heat * 0.55 * (1 - burn));
    return <path key={`w${i}`} d={curveD(proj(L, pts))} stroke={col} strokeWidth={f2(Math.max(0.8, 0.008 * kc))} fill="none" strokeLinecap="round" />;
  });
  const ecu = (() => {
    const c: V3[] = [];
    for (const x of [0.17, 0.31]) for (const y of [0, 0.06]) for (const z of [-0.69, -0.55]) c.push(toW(B, v3(x, y, z)));
    return <path d={smoothD(hull(proj(L, c)), 0.05)} fill={JCOL.ecu} stroke={INK} strokeWidth={f2(w * 2)} paintOrder="stroke" />;
  })();
  // scorch on the deck (burn damage)
  const scorch = burn > 0.02 ? (
    <g opacity={Math.min(1, burn)}>
      {[[0.0, 0.25, 0.22], [-0.15, -0.1, 0.16], [0.18, 0.3, 0.14], [0.05, -0.42, 0.18]].map(([x, z, r], k) => (
        <path key={k} d={polyD(proj(L, circ3(toW(B, v3(x, 0.002, z)), B.x, B.z, r * (0.6 + 0.4 * burn), 16)))} fill={JCOL.scorch} opacity={0.55} />
      ))}
    </g>
  ) : null;
  // test stand: four legs and two cradle bars to the floor (y of the floor = B.o.y - standH)
  const standEl = stand ? (() => {
    const legs = [[-0.3, -0.62], [0.3, -0.62], [-0.3, 0.62], [0.3, 0.62]].map(([x, z], k) => {
      const top = toW(B, v3(x, -JET.deck.t, z));
      const bot = v3(top.x, 0, top.z);
      if (d3(s3(top, L.pos), L.f) < 0.1 || d3(s3(bot, L.pos), L.f) < 0.1) return null;
      const a = L.p(top), b = L.p(bot);
      return <path key={k} d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke={JCOL.stand} strokeWidth={f2(Math.max(1.5, 0.035 * a.k))} strokeLinecap="round" />;
    });
    return <g>{legs}</g>;
  })() : null;
  const order = JET.engines.map((_, i) => i).sort((a, b) => d3(s3(eng(B, b, 0), L.pos), L.f) - d3(s3(eng(B, a, 0), L.pos), L.f));
  const lower = order.map((i) => (
    <g key={`lo${i}`}>
      {casing(i, -JET.deck.t, JET.bot + 0.07, JET.r, JET.r * 0.95, mix(JCOL.casing, '#C9431F', ch * 0.85), `cl${i}`)}
      {casing(i, JET.bot + 0.07, JET.bot, JET.r * 0.8, JET.r * 0.62, mix(JCOL.nozzle, '#E4502A', heat * 0.8), `nz${i}`)}
    </g>
  ));
  const upper = order.map((i) => (
    <g key={`up${i}`}>
      {casing(i, 0, JET.top, JET.r, JET.r * 1.02, mix(JCOL.casing, '#C98A62', ch * 0.4), `cu${i}`)}
      {intakeFace(i)}
    </g>
  ));
  const deckEl = (
    <g>
      <path d={smoothD(deckSide, 0.02)} fill={JCOL.rail} stroke={INK} strokeWidth={f2(w * 2)} strokeLinejoin="round" paintOrder="stroke" />
      <defs>
        <LinFill id={`${id}-dk`} b={bbox(face)} color={JCOL.deck} k={1.2} />
      </defs>
      <path d={polyD(face)} fill={`url(#${id}-dk)`} stroke={INK} strokeWidth={f2(w * 1.4)} />
      {above && [-0.36, 0, 0.36].map((z, k) => {
        const q = proj(L, [toW(B, v3(-D.x, 0.002, z)), toW(B, v3(D.x, 0.002, z))]);
        return <path key={k} d={`M${f2(q[0].x)},${f2(q[0].y)} L${f2(q[1].x)},${f2(q[1].y)}`} stroke={shade(JCOL.deck, 0.3)} strokeWidth={f2(Math.max(1, 0.018 * kc))} />;
      })}
      {above && scorch}
    </g>
  );
  const topStuff = (
    <g>
      <path d={smoothD(tankPts, 0.08)} fill={mix(JCOL.tank, JCOL.scorch, burn * 0.5)} stroke={INK} strokeWidth={f2(w * 2)} paintOrder="stroke" />
      {ecu}
      {wires}
      {JET.engines.map((_, i) => line(i))}
      {upper}
    </g>
  );
  return above ? (
    <g>
      {standEl}
      {lower}
      {deckEl}
      {/* V5: things lying on the deck surface (a fuel puddle) go here, under the engines and lines */}
      {overlay}
      {topStuff}
    </g>
  ) : (
    <g>
      {topStuff}
      {deckEl}
      {standEl}
      {lower}
    </g>
  );
};
