// Sequence C, part 2 (~63.7 -> 74.8 s): the one command crosses campus and drives the TMS coil.
// A true perspective camera looks straight down (c_cam PCam): rooftops, a tall foreground tower, tree canopies and
// low clouds all parallax against the lawn. The FIRE command runs along the campus network line from Rao's
// building (frame left) to Stocco's (frame right), arriving on "Fire."; in the silence the camera dives through
// Stocco's skylight into his room, seen from straight above (he faces the top of frame, so his LEFT is frame-left):
// the TMS machine on its cart, the coil on its articulated arm over his LEFT motor cortex, his RIGHT hand on the
// keyboard. The command crawls in (slow motion) along the cable, docks in the machine, the current runs up the coil
// cable, the coil clicks; the scalp turns to x-ray (the brain's motor strip, hand area on the left hemisphere) and
// the stimulation pathway runs from the left motor cortex, crosses the midline at the neck, and runs down the
// RIGHT arm to the hand (cut with it into the hand ECU, c_end).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp, smooth} from '../dc/math';
import {INK, K, Packet, Tag, FONT_HEAD} from '../art/kit';
import {STOCCO} from '../art/people';
import {PCam, pcamPath, pLayer, pPt, pScale} from './c_cam';
import {ct} from './c_time';

type V3 = {x: number; y: number; h: number};
type V = {x: number; y: number};

// ---------------------------------------------------------------- campus layout (metres; x east, y south)
const BA = {x0: -113, x1: -67, y0: -15, y1: 15, h: 16};
const BB = {x0: 70, x1: 120, y0: -2, y1: 32, h: 15};
const TOWER = {x0: -14, x1: 12, y0: -52, y1: -30, h: 40};
const OTHERS = [
  {x0: -60, x1: -30, y0: 52, y1: 76, h: 12},
  {x0: 30, x1: 58, y0: -78, y1: -56, h: 14},
  {x0: 150, x1: 182, y0: -40, y1: -12, h: 13},
  {x0: -170, x1: -138, y0: 30, y1: 58, h: 11},
];
/** rooftop reference on Stocco's building */
const ROOM = {x: 95, y: 15};
/** rooftop units on Stocco's building (they sweep past during the dive) */
const ROOF_UNITS = [
  {x0: ROOM.x - 9, x1: ROOM.x - 6, y0: ROOM.y - 4, y1: ROOM.y - 1.5, h: 16.6},
  {x0: ROOM.x + 6, x1: ROOM.x + 9.5, y0: ROOM.y + 1, y1: ROOM.y + 3, h: 16.2},
  {x0: ROOM.x - 2, x1: ROOM.x + 1, y0: ROOM.y + 7, y1: ROOM.y + 9, h: 16.4},
  {x0: ROOM.x + 12, x1: ROOM.x + 16, y0: ROOM.y - 8, y1: ROOM.y - 5, h: 17},
];
const NET: V[] = [{x: -66, y: 3}, {x: -20, y: 46}, {x: 34, y: -18}, {x: 69.5, y: 12}];
const TREES: [number, number, number, number][] = [
  [-40, -24, 5, 8], [-28, 30, 4.4, 7], [8, 30, 5.2, 9], [40, 34, 4.2, 7], [52, -22, 4.8, 8], [-55, 30, 3.8, 6.5], [20, -6, 3.6, 6],
  [-90, 34, 4.6, 8], [-128, -24, 4.2, 7], [130, -14, 4.6, 8], [138, 44, 5, 8], [96, 50, 4.4, 7], [-8, 70, 5, 8], [60, 70, 4.4, 7],
  [-70, -40, 4.8, 8], [100, -30, 4.2, 7],
];
const CLOUDS: [number, number, number, number][] = [
  [-30, 10, 92, 8], [40, -40, 96, 9], [10, 46, 100, 8], [-80, -30, 104, 10], [130, 40, 98, 8], [150, -20, 102, 9],
];

const bzq = (p: V[], u: number): V => {
  const a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
  return {x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y};
};

// ---------------------------------------------------------------- timing
const tm = () => {
  const c = ct();
  return {
    cut: c.internet + 0.1, // match cut from Rao's wall jack
    arriveB: c.fire - 0.02, // the command reaches Stocco's building on "Fire."
    enter: c.fire + 0.32, // it goes into the building's network entry
    end: c.sRoom, // match cut: it comes out of the wall jack in Stocco's room
  };
};
export const campusStart = () => tm().cut;
export const campusEnd = () => tm().end;
const ENTRY = {x: 69.9, y: 12};

const pkCampus = (t: number) => {
  const m = tm();
  const u = easeInOut(clamp((t - m.cut) / (m.arriveB - m.cut)));
  return {p: bzq(NET, u), u};
};
export const campusCam = (t: number): PCam => {
  const m = tm();
  const p0 = NET[0];
  return pcamPath(t, [
    [m.cut, {x: p0.x, y: p0.y, alt: 30, zoom: 1}],
    [m.cut + 0.75, {x: -18, y: 14, alt: 118, zoom: 1}, easeInOut],
    [m.arriveB - 0.1, {x: 56, y: 13, alt: 96, zoom: 1}, easeInOut],
    [m.end, {x: ENTRY.x, y: ENTRY.y, alt: 21, zoom: 1}, (u) => easeIn(u) * 0.6 + u * 0.4],
  ]);
};

// ---------------------------------------------------------------- drawing helpers (screen space)
const pp = (c: PCam, q: V3) => pPt(c, q.x, q.y, q.h);
const polyD = (pts: V[]) => `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`;
const lineD = (pts: V[]) => `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;

/** an extruded box: sides (lit by the upper-left key light) and a roof; roof children drawn in world metres */
const Box: React.FC<{c: PCam; b: {x0: number; x1: number; y0: number; y1: number; h: number}; h0?: number; wall: string; roof: string; floors?: number; roofKids?: React.ReactNode; id: string}> = ({c, b, h0 = 0, wall, roof, floors = 3, roofKids, id}) => {
  if (c.alt - b.h < 0.3) return null;
  const P = (x: number, y: number, h: number) => pPt(c, x, y, h);
  const base = [P(b.x0, b.y0, h0), P(b.x1, b.y0, h0), P(b.x1, b.y1, h0), P(b.x0, b.y1, h0)];
  const top = [P(b.x0, b.y0, b.h), P(b.x1, b.y0, b.h), P(b.x1, b.y1, b.h), P(b.x0, b.y1, b.h)];
  // side order: north, east, south, west; shading from the north-west key light
  const tones = [lit(wall, 0.12), shade(wall, 0.22), shade(wall, 0.3), lit(wall, 0.05)];
  const sides = [0, 1, 2, 3].map((i) => {
    const j = (i + 1) % 4;
    const quad = [base[i], base[j], top[j], top[i]];
    const bands: React.ReactNode[] = [];
    for (let fl = 0; fl < floors; fl++) {
      const hA = h0 + ((b.h - h0) * (fl + 0.35)) / floors, hB = h0 + ((b.h - h0) * (fl + 0.7)) / floors;
      const lerpP = (k: number, hh: number) => {
        const ax = i === 0 ? b.x0 : i === 1 ? b.x1 : i === 2 ? b.x1 : b.x0;
        const ay = i === 0 ? b.y0 : i === 1 ? b.y0 : i === 2 ? b.y1 : b.y1;
        const bx = i === 0 ? b.x1 : i === 1 ? b.x1 : i === 2 ? b.x0 : b.x0;
        const by = i === 0 ? b.y0 : i === 1 ? b.y1 : i === 2 ? b.y1 : b.y0;
        return P(lerp(ax, bx, k), lerp(ay, by, k), hh);
      };
      bands.push(<path key={fl} d={polyD([lerpP(0.06, hA), lerpP(0.94, hA), lerpP(0.94, hB), lerpP(0.06, hB)])} fill="#BFD9E8" opacity={0.75} />);
    }
    return (
      <g key={i}>
        <path d={polyD(quad)} fill={tones[i]} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {bands}
      </g>
    );
  });
  return (
    <g>
      {sides}
      <path d={polyD(top)} fill={roof} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <g transform={pLayer(c, b.h)}>
        <rect x={b.x0 + 1.2} y={b.y0 + 1.2} width={b.x1 - b.x0 - 2.4} height={b.y1 - b.y0 - 2.4} fill="none" stroke={shade(roof, 0.25)} strokeWidth={0.5} />
        {roofKids}
      </g>
    </g>
  );
};

const TreeTop: React.FC<{c: PCam; x: number; y: number; r: number; h: number}> = ({c, x, y, r, h}) => {
  if (c.alt - h < 1) return null;
  const q = pPt(c, x, y, h);
  const R = r * q.s;
  return (
    <g>
      <circle cx={q.x} cy={q.y} r={R} fill={K.grassDeep} stroke={INK} strokeWidth={3} />
      <circle cx={q.x - R * 0.28} cy={q.y - R * 0.3} r={R * 0.52} fill={lit(K.grass, 0.1)} opacity={0.75} />
    </g>
  );
};

const Cloud: React.FC<{c: PCam; x: number; y: number; h: number; r: number}> = ({c, x, y, h, r}) => {
  const d = c.alt - h;
  if (d < 6) return null;
  const q = pPt(c, x, y, h);
  const R = r * q.s;
  const o = 0.35 * clamp((d - 10) / 20);
  return (
    <g opacity={o}>
      <ellipse cx={q.x} cy={q.y} rx={R} ry={R * 0.6} fill="#FFFFFF" />
      <ellipse cx={q.x - R * 0.6} cy={q.y + R * 0.15} rx={R * 0.6} ry={R * 0.42} fill="#FFFFFF" />
      <ellipse cx={q.x + R * 0.65} cy={q.y + R * 0.1} rx={R * 0.62} ry={R * 0.4} fill="#FFFFFF" />
    </g>
  );
};

/** a top-view walker on the lawn (head + shoulders) */
const Walker: React.FC<{c: PCam; x: number; y: number; ang: number; col: string; t: number}> = ({c, x, y, ang, col, t}) => {
  const q = pPt(c, x, y, 1.7);
  const s = q.s;
  return (
    <g transform={`translate(${fmt(q.x)} ${fmt(q.y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
      <ellipse cx={0} cy={0} rx={0.28} ry={0.16} fill={col} stroke={INK} strokeWidth={0.06} />
      <circle cx={0.02} cy={Math.sin(t * 9) * 0.02} r={0.12} fill="#5A3A22" stroke={INK} strokeWidth={0.05} />
    </g>
  );
};

// ---------------------------------------------------------------- the campus (ground + buildings), above the roofs
const CampusGround: React.FC<{c: PCam; t: number; pk: {u: number}}> = ({c, t, pk}) => {
  const s0 = pScale(c, 0);
  const ink = 3 / s0;
  // the network line lights up behind the command
  const N = 60;
  const pts = Array.from({length: N + 1}, (_, i) => bzq(NET, i / N));
  const lit0 = pts.slice(0, Math.max(1, Math.round(pk.u * N)) + 1);
  return (
    <g transform={pLayer(c, 0)}>
      <rect x={-400} y={-300} width={800} height={600} fill={K.grass} />
      {/* mown stripes */}
      {Array.from({length: 20}, (_, i) => <rect key={i} x={-400 + i * 40} y={-300} width={20} height={600} fill={lit(K.grass, 0.08)} opacity={0.5} />)}
      {/* building shadows (key light upper-left) */}
      {[BA, BB, TOWER, ...OTHERS].map((b, i) => (
        <rect key={i} x={b.x0 + b.h * 0.22} y={b.y0 + b.h * 0.22} width={b.x1 - b.x0} height={b.y1 - b.y0} fill={INK} opacity={0.16} />
      ))}
      {TREES.map(([x, y, r], i) => <circle key={i} cx={x + 2} cy={y + 2.2} r={r} fill={INK} opacity={0.13} />)}
      {/* paths */}
      {[
        `M-67,6 C-30,34 20,-12 70,18`,
        `M-2,-300 L-2,300`,
        `M-400,40 C-200,36 -120,34 -113,10`,
        `M120,20 C200,20 260,0 400,4`,
      ].map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke={INK} strokeWidth={4.8} />
          <path d={d} stroke={K.path} strokeWidth={4} />
        </g>
      ))}
      <circle cx={-2} cy={10} r={11} fill={K.stone} stroke={INK} strokeWidth={ink} />
      <circle cx={-2} cy={10} r={4.5} fill="#7FC3E0" stroke={INK} strokeWidth={ink} />
      <circle cx={-2} cy={10} r={1.4 + 0.4 * Math.sin(t * 5)} fill="#FFFFFF" opacity={0.7} />
      {/* the campus network line (buried conduit), lit behind the command */}
      <path d={lineD(pts)} fill="none" stroke="#5D6B76" strokeWidth={0.9} strokeDasharray="2.4 1.6" />
      {pk.u > 0 && <path d={lineD(lit0)} fill="none" stroke={K.saffron} strokeWidth={2.2} opacity={0.85} strokeLinecap="round" />}
      {pk.u > 0 && <path d={lineD(lit0)} fill="none" stroke={K.saffron} strokeWidth={6} opacity={0.25} strokeLinecap="round" />}
      {/* the network box on Rao's building and the entry on Stocco's */}
      <rect x={-67.5} y={1} width={2.6} height={4} rx={0.4} fill="#D9DEE2" stroke={INK} strokeWidth={ink} />
      <rect x={68.6} y={10} width={2.6} height={4} rx={0.4} fill="#D9DEE2" stroke={INK} strokeWidth={ink} />
    </g>
  );
};

// ---------------------------------------------------------------- the shot
export const CampusShot: React.FC<{t: number; f: number}> = ({t}) => {
  const m = tm();
  const c = campusCam(t);
  const pk = pkCampus(t);
  const pkp = pPt(c, pk.p.x, pk.p.y, 0.6);
  // the command arrives at the entry box and slips inside; the box lights
  const inK = easeIn(clamp((t - m.arriveB) / (m.enter - m.arriveB)));
  const boxLit = clamp((t - (m.arriveB + 0.05)) / 0.25);
  const ent = pPt(c, ENTRY.x - 0.2, ENTRY.y, 1.2);
  const walkers = [0, 1, 2, 3].map((i) => {
    const u = ((t * (0.012 + i * 0.004) + i * 0.27) % 1);
    const q = bzq([{x: -67, y: 6}, {x: -30, y: 34}, {x: 20, y: -12}, {x: 70, y: 18}], i % 2 ? 1 - u : u);
    return <Walker key={i} c={c} x={q.x + (i % 2 ? 1 : -1)} y={q.y} ang={i % 2 ? 200 : 20} col={[K.coral, K.teal, K.saffron, K.purple][i]} t={t + i} />;
  });
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.grass} />
      <CampusGround c={c} t={t} pk={pk} />
      {walkers}
      {/* the network entry box on Stocco's building lights as the command goes in */}
      {boxLit > 0 && (() => {
        const a = pPt(c, 68.6, 10, 0.05), b = pPt(c, 71.2, 14, 0.05);
        return <rect x={a.x} y={a.y} width={b.x - a.x} height={b.y - a.y} rx={0.4 * a.s} fill={K.saffron} opacity={0.85 * boxLit} stroke={INK} strokeWidth={3} />;
      })()}
      {t < m.enter && <Packet x={lerp(pkp.x, ent.x, inK)} y={lerp(pkp.y, ent.y, inK)} s={0.85 * (1 - 0.85 * inK)} k={1} />}
      {OTHERS.map((b, i) => <Box key={i} id={`vc-o${i}`} c={c} b={b} wall={i % 2 ? '#C9A27A' : K.stone} roof={i % 2 ? '#8A96A0' : '#9C8F84'} floors={3} />)}
      <Box id="vc-ba" c={c} b={BA} wall={K.brick} roof="#6F7E88" floors={4} roofKids={<g><rect x={-100} y={-8} width={6} height={4} fill="#9AA7B1" /><rect x={-86} y={4} width={5} height={5} fill="#9AA7B1" /></g>} />
      <Box id="vc-bb" c={c} b={BB} wall="#B8775E" roof="#7E8A92" floors={4} roofKids={<g>{Array.from({length: 90}, (_, i) => <circle key={i} cx={BB.x0 + 2 + ((i * 37) % 47)} cy={BB.y0 + 2 + ((i * 53) % 31)} r={0.35} fill="#6B7780" opacity={0.6} />)}<path d={`M${BB.x0 + 3},${BB.y0 + 17} L${BB.x1 - 3},${BB.y0 + 17}`} stroke="#6B7780" strokeWidth={0.25} strokeDasharray="1 1" /></g>} />
      {ROOF_UNITS.map((u, i) => <Box key={i} id={`vc-ru${i}`} c={c} b={u} h0={BB.h} wall="#C9D1D8" roof="#E9EDF0" floors={0} roofKids={<circle cx={(u.x0 + u.x1) / 2} cy={(u.y0 + u.y1) / 2} r={Math.min(u.x1 - u.x0, u.y1 - u.y0) * 0.3} fill="#9AA7B1" stroke={INK} strokeWidth={0.12} />} />)}
      <Box id="vc-tw" c={c} b={TOWER} wall="#D8CBB4" roof="#8A96A0" floors={8} roofKids={<rect x={-6} y={-46} width={8} height={6} fill="#9AA7B1" />} />
      {TREES.map(([x, y, r, h], i) => <TreeTop key={i} c={c} x={x} y={y} r={r} h={h} />)}
      <Tag x={pPt(c, -5, 26, 0).x} y={pPt(c, -5, 26, 0).y + 90} text="internet" size={40} k={clamp((t - (ct().internet - 0.25)) / 0.25) * (1 - clamp((t - (ct().fire - 0.4)) / 0.3))} />
      {CLOUDS.map(([x, y, h, r], i) => <Cloud key={i} c={c} x={x + t * 1.2} y={y} h={h} r={r} />)}
    </g>
  );
};
