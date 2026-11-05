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
/** Stocco's room: local origin = his head's floor position; floor height ROOM_H */
const ROOM = {x: 95, y: 15};
const ROOM_H = 11.5;
const SKY = {x0: ROOM.x - 4.2, x1: ROOM.x + 4.2, y0: ROOM.y - 1.0, y1: ROOM.y + 4.4};
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

// ---------------------------------------------------------------- interior (room-local metres, heights above the floor)
const R3 = (x: number, y: number, h: number): V3 => ({x: ROOM.x + x, y: ROOM.y + y, h: ROOM_H + h});
const WALL_Y = -1.05;
const JACK = R3(-1.75, WALL_Y, 0.35);
const NET_IN: V3[] = [JACK, R3(-1.75, WALL_Y + 0.04, 0.03), R3(-1.7, -0.5, 0.02), R3(-1.5, 0.15, 0.02), R3(-1.2, 0.3, 0.05), R3(-1.12, 0.3, 0.55)];
const MACH = {x0: -1.18, x1: -0.66, y0: 0.06, y1: 0.48, h: 0.95};
const POLE = {x: -0.72, y: 0.1};
const ARM: V3[] = [R3(POLE.x, POLE.y, 0.95), R3(POLE.x, POLE.y, 1.78), R3(-0.46, -0.14, 1.74), R3(-0.17, -0.05, 1.56)];
const COIL = R3(-0.055, -0.01, 1.43);
const COIL_CABLE: V3[] = [R3(-0.15, -0.035, 1.57), R3(-0.45, -0.115, 1.76), R3(-0.7, 0.115, 1.8), R3(-0.7, 0.115, 1.0), R3(-0.8, 0.2, 0.96)];
export const HAND_AREA = R3(-0.05, -0.005, 1.33);
const PATHWAY: V3[] = [
  HAND_AREA, R3(-0.045, 0.05, 1.3), R3(-0.02, 0.095, 1.24), R3(0, 0.11, 1.2), R3(0.04, 0.115, 1.17), R3(0.12, 0.09, 1.14), R3(0.21, 0.07, 1.12),
  R3(0.25, 0.03, 0.96), R3(0.27, 0.0, 0.86), R3(0.24, -0.14, 0.82), R3(0.2, -0.28, 0.8), R3(0.178, -0.36, 0.8),
];
// arms: shoulder -> elbow -> wrist -> knuckles
const ARM_R: V3[] = [R3(0.21, 0.06, 1.1), R3(0.27, 0.0, 0.84), R3(0.2, -0.28, 0.8), R3(0.175, -0.38, 0.79)];
const ARM_L: V3[] = [R3(-0.21, 0.06, 1.1), R3(-0.28, 0.0, 0.84), R3(-0.27, -0.28, 0.79), R3(-0.26, -0.38, 0.78)];

// ---------------------------------------------------------------- timing
const tm = () => {
  const c = ct();
  return {
    cut: c.internet + 0.1, // match-cut from Rao's wall plate
    arriveB: c.fire - 0.02, // the command reaches Stocco's building on "Fire."
    inside: c.across - 0.05, // the camera is through the skylight
    dock: c.command2 + 0.2, // the command docks in the TMS machine
    charge: c.command2 + 0.35,
    pulse: c.pulse,
    path0: c.pulse + 0.12,
    path1: c.ecu - 0.03,
  };
};
export const campusStart = () => tm().cut;

const pkCampus = (t: number) => {
  const m = tm();
  const u = easeInOut(clamp((t - m.cut) / (m.arriveB - m.cut)));
  return {p: bzq(NET, u), u};
};
/** the command inside Stocco's room: in through the wall jack, along the floor cable to the machine (slow motion) */
const pkInside = (t: number) => {
  const m = tm();
  const t0 = m.inside - 0.1;
  const u = clamp((t - t0) / (m.dock - t0));
  const k = u < 0.2 ? 0.3 * easeOut(u / 0.2) : 0.3 + 0.7 * easeInOut((u - 0.2) / 0.8);
  return {p: polyAt(NET_IN, k), u};
};
const polyAt = (pts: V3[], u: number): V3 => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].h - pts[i - 1].h));
  const s = clamp(u) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) {
    if (s <= L[i]) {
      const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
      return {x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k), h: lerp(pts[i - 1].h, pts[i].h, k)};
    }
  }
  return pts[pts.length - 1];
};

export const campusCam = (t: number): PCam => {
  const m = tm();
  const c = ct();
  const W = (x: number, y: number, alt: number, zoom: number): PCam => ({x: ROOM.x + x, y: ROOM.y + y, alt: ROOM_H + alt, zoom});
  const ARR = W(-0.25, -0.12, 2.9, 1.45);
  const COILC = W(-0.07, -0.02, 2.9, 4.3);
  const BRAIN = W(-0.04, 0.0, 2.9, 5.0);
  const HANDW = W(0.03, -0.09, 2.9, 2.15);
  const CMD = W(-0.5, 0.12, 2.9, 2.2);
  const ARMF = W(0.2, -0.45, 2.9, 3.9);
  if (t < m.inside && t > m.inside - 0.7) {
    // the dive through the skylight: distance to the room's floor shrinks at a constant log rate
    const A: PCam = {x: ARR.x - 0.3, y: ARR.y + 0.6, alt: 27, zoom: 1.05};
    const u = easeInOut(clamp((t - (m.inside - 0.7)) / 0.7));
    const d = Math.exp(lerp(Math.log(A.alt - ROOM_H), Math.log(ARR.alt - ROOM_H), u));
    return {x: lerp(A.x, ARR.x, u), y: lerp(A.y, ARR.y, u), alt: ROOM_H + d, zoom: Math.exp(lerp(Math.log(A.zoom), Math.log(ARR.zoom), u))};
  }
  if (t < m.inside) {
    const p0 = NET[0];
    return pcamPath(t, [
      [m.cut, {x: p0.x, y: p0.y, alt: 30, zoom: 1}],
      [m.cut + 0.75, {x: -18, y: 14, alt: 118, zoom: 1}, easeInOut],
      [m.arriveB - 0.05, {x: 58, y: 13, alt: 92, zoom: 1}, easeInOut],
      [m.arriveB + 0.45, {x: 88, y: 15, alt: 58, zoom: 1}],
      [m.inside - 0.7, {x: ARR.x - 0.3, y: ARR.y + 0.6, alt: 27, zoom: 1.05}],
      [m.inside, ARR, (u) => easeInOut(u)],
    ]);
  }
  return pcamPath(t, [
    [m.inside, ARR],
    [c.magnetic - 0.05, {...ARR, x: ARR.x - 0.08, zoom: 1.6}],
    [c.coil + 0.35, COILC],
    [c.brain - 0.2, {...COILC, zoom: 4.4}],
    [c.brain + 0.6, BRAIN],
    [c.rightHand - 0.55, {...BRAIN, zoom: 4.8}],
    [c.rightHandE, HANDW],
    [c.command2 - 0.05, {...HANDW, x: HANDW.x - 0.05}],
    [m.dock - 0.05, CMD],
    [m.pulse, {...CMD, x: CMD.x + 0.12, zoom: 2.5}],
    [m.path0 + 0.2, {...BRAIN, zoom: 3.6}],
    [m.path1, ARMF, easeIn],
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

// ---------------------------------------------------------------- Stocco's room from straight above
const Capsule3: React.FC<{c: PCam; a: V3; b: V3; r: number; color: string; inkW?: number}> = ({c, a, b, r, color, inkW = 4}) => {
  const A = pp(c, a), B = pp(c, b);
  const ra = r * A.s, rb = r * B.s;
  const d = `M${fmt(A.x)},${fmt(A.y)} L${fmt(B.x)},${fmt(B.y)}`;
  return (
    <g strokeLinecap="round">
      <path d={d} stroke={INK} strokeWidth={(ra + rb) + inkW * 2} />
      <path d={d} stroke={color} strokeWidth={ra + rb} />
      <path d={d} stroke={lit(color, 0.3)} strokeWidth={(ra + rb) * 0.35} opacity={0.5} transform={`translate(${fmt(-ra * 0.3)} ${fmt(-ra * 0.3)})`} />
    </g>
  );
};

/** a top-view hand: the back of a relaxed hand, fingers together and curled over the keys (pointing north) */
const TopHand: React.FC<{c: PCam; at: V3; ang: number; skin: string; mirror?: boolean}> = ({c, at, ang, skin, mirror = false}) => {
  const q = pp(c, at);
  const s = q.s;
  const w = 3.4 / s;
  const fingers = [-0.026, -0.009, 0.008, 0.024];
  const len = [0.05, 0.056, 0.052, 0.042];
  return (
    <g transform={`translate(${fmt(q.x)} ${fmt(q.y)}) rotate(${fmt(ang)}) scale(${fmt(mirror ? -s : s)} ${fmt(s)})`}>
      {fingers.map((fx, i) => (
        <g key={i}>
          <line x1={fx} y1={-0.03} x2={fx + (i - 1.5) * 0.002} y2={-0.03 - len[i]} stroke={INK} strokeWidth={0.0175 + w * 2} strokeLinecap="round" />
          <line x1={fx} y1={-0.03} x2={fx + (i - 1.5) * 0.002} y2={-0.03 - len[i]} stroke={shade(skin, 0.06)} strokeWidth={0.0175} strokeLinecap="round" />
          <ellipse cx={fx + (i - 1.5) * 0.002} cy={-0.03 - len[i] + 0.008} rx={0.0055} ry={0.007} fill={lit(skin, 0.45)} />
        </g>
      ))}
      {/* thumb along the inner (west for a right hand) side, tucked under */}
      <line x1={-0.036} y1={0.03} x2={-0.05} y2={-0.03} stroke={INK} strokeWidth={0.02 + w * 2} strokeLinecap="round" />
      <line x1={-0.036} y1={0.03} x2={-0.05} y2={-0.03} stroke={skin} strokeWidth={0.02} strokeLinecap="round" />
      <path d="M-0.038,-0.035 Q-0.04,0.04 -0.026,0.06 L0.026,0.06 Q0.04,0.04 0.036,-0.035 Q0,-0.045 -0.038,-0.035 Z" fill={skin} stroke={INK} strokeWidth={w} />
      <path d="M-0.02,-0.03 Q0,-0.036 0.02,-0.03" fill="none" stroke={shade(skin, 0.3)} strokeWidth={0.003} opacity={0.6} />
    </g>
  );
};

const TopRoom: React.FC<{c: PCam; t: number; f: number}> = ({c, t, f}) => {
  const m = tm();
  const cc = ct();
  const sF = pScale(c, ROOM_H);
  const P = (x: number, y: number, h: number) => pPt(c, ROOM.x + x, ROOM.y + y, ROOM_H + h);
  const layer = (h: number) => pLayer(c, ROOM_H + h);
  const sk = K.stoccoSkin;
  const dock = clamp((t - m.dock) / 0.2);
  const charge = clamp((t - m.charge) / (m.pulse - m.charge - 0.05));
  const pulseK = t >= m.pulse ? Math.max(0, 1 - (t - m.pulse) / 0.55) : 0;
  const reveal = smooth(clamp((t - (cc.brain - 0.35)) / 0.7));
  const handArea = clamp((t - (cc.helps - 0.1)) / 0.4);
  const fired = t >= m.pulse;
  // walls of the room (inner faces, leaning out under perspective)
  const RX0 = -4.3, RX1 = 4.3, RY0 = WALL_Y, RY1 = 4.5, WH = 2.25;
  const wall = (ax: number, ay: number, bx: number, by: number, tone: string, k: number) => (
    <path key={k} d={polyD([P(ax, ay, 0), P(bx, by, 0), P(bx, by, WH), P(ax, ay, WH)])} fill={tone} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  );
  // the stimulation pathway (left motor cortex -> crosses at the neck -> right arm -> hand)
  const pathK = clamp((t - m.path0) / (m.path1 - m.path0));
  const pathPts = Array.from({length: 61}, (_, i) => polyAt(PATHWAY, (i / 60) * easeIn(pathK) ** 0.85)).map((q) => pp(c, q));
  const head = pp(c, polyAt(PATHWAY, easeIn(pathK) ** 0.85));
  const cableK = clamp((t - (m.charge + 0.05)) / (m.pulse - m.charge - 0.1));
  const coilQ = pp(c, COIL);
  const pk = pkInside(t);
  const pkP = pp(c, pk.p);
  const headC = P(0, -0.01, 1.28);
  return (
    <g>
      {/* floor */}
      <g transform={layer(0)}>
        <rect x={ROOM.x + RX0} y={ROOM.y + RY0} width={RX1 - RX0} height={RY1 - RY0} fill="#E6DCCB" />
        {Array.from({length: 10}, (_, i) => <line key={`a${i}`} x1={ROOM.x + RX0 + i * 0.6} y1={ROOM.y + RY0} x2={ROOM.x + RX0 + i * 0.6} y2={ROOM.y + RY1} stroke="#CDBFA8" strokeWidth={2 / sF} />)}
        {Array.from({length: 7}, (_, i) => <line key={`b${i}`} x1={ROOM.x + RX0} y1={ROOM.y + RY0 + i * 0.6} x2={ROOM.x + RX1} y2={ROOM.y + RY0 + i * 0.6} stroke="#CDBFA8" strokeWidth={2 / sF} />)}
        <ellipse cx={ROOM.x - 0.02} cy={ROOM.y + 0.2} rx={0.5} ry={0.42} fill={INK} opacity={0.12} />
        <ellipse cx={ROOM.x - 0.9} cy={ROOM.y + 0.32} rx={0.4} ry={0.3} fill={INK} opacity={0.12} />
      </g>
      {wall(RX0, RY0, RX1, RY0, K.stoccoWall, 0)}
      {wall(RX1, RY0, RX1, RY1, shade(K.stoccoWall, 0.12), 1)}
      {wall(RX1, RY1, RX0, RY1, shade(K.stoccoWall, 0.06), 2)}
      {wall(RX0, RY1, RX0, RY0, lit(K.stoccoWall, 0.1), 3)}
      {/* the wall jack (the campus network comes in here) */}
      {(() => {
        const a = P(-1.85, WALL_Y, 0.28), b = P(-1.65, WALL_Y, 0.42);
        return <rect x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.max(6, Math.abs(b.y - a.y))} fill="#F4F6F8" stroke={INK} strokeWidth={3} />;
      })()}
      {/* network cable along the floor to the machine */}
      <path d={lineD(NET_IN.map((q) => pp(c, q)))} fill="none" stroke={INK} strokeWidth={0.03 * sF + 6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={lineD(NET_IN.map((q) => pp(c, q)))} fill="none" stroke="#5D6B76" strokeWidth={0.03 * sF} strokeLinecap="round" strokeLinejoin="round" />
      {/* the desk against the north wall, keyboard */}
      {(() => {
        const d = [P(-1.2, WALL_Y, 0.75), P(1.5, WALL_Y, 0.75), P(1.5, -0.3, 0.75), P(-1.2, -0.3, 0.75)];
        const face = [P(-1.2, -0.3, 0.75), P(1.5, -0.3, 0.75), P(1.5, -0.3, 0.68), P(-1.2, -0.3, 0.68)];
        return (
          <g>
            <path d={polyD(face)} fill={K.deskDeep} stroke={INK} strokeWidth={3} />
            <path d={polyD(d)} fill="#D9A773" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          </g>
        );
      })()}
      <g transform={layer(0.77)}>
        {(() => {
          const s = pScale(c, ROOM_H + 0.77);
          const x0 = ROOM.x - 0.06, y0 = ROOM.y - 0.52;
          return (
            <g>
              <rect x={x0} y={y0} width={0.5} height={0.19} rx={0.012} fill="#C9D1D8" stroke={INK} strokeWidth={3 / s} />
              {Array.from({length: 4}, (_, r) => Array.from({length: 12}, (_, i) => (
                <rect key={`${r}-${i}`} x={x0 + 0.015 + i * 0.0395} y={y0 + 0.014 + r * 0.032} width={0.033} height={0.026} rx={0.004} fill={K.plastic} stroke={INK} strokeWidth={1.4 / s} />
              )))}
              <rect x={x0 + 0.13} y={y0 + 0.145} width={0.22} height={0.03} rx={0.005} fill={mix(K.plastic, K.saffron, 0)} stroke={INK} strokeWidth={1.6 / s} />
            </g>
          );
        })()}
      </g>
      {/* the TMS machine on its cart */}
      {(() => {
        const b = MACH;
        const deck = [P(b.x0 - 0.05, b.y0 - 0.03, 0.18), P(b.x1 + 0.05, b.y0 - 0.03, 0.18), P(b.x1 + 0.05, b.y1 + 0.05, 0.18), P(b.x0 - 0.05, b.y1 + 0.05, 0.18)];
        const base = [P(b.x0, b.y0, 0.18), P(b.x1, b.y0, 0.18), P(b.x1, b.y1, 0.18), P(b.x0, b.y1, 0.18)];
        const top = [P(b.x0, b.y0, b.h), P(b.x1, b.y0, b.h), P(b.x1, b.y1, b.h), P(b.x0, b.y1, b.h)];
        const tones = ['#E7EBEE', '#B5BEC6', '#A9B3BC', '#DDE2E6'];
        const s = pScale(c, ROOM_H + b.h);
        const cx = ROOM.x + (b.x0 + b.x1) / 2, cy = ROOM.y + (b.y0 + b.y1) / 2;
        return (
          <g>
            <path d={polyD(deck)} fill="#7E8B96" stroke={INK} strokeWidth={3} />
            {[0, 1, 2, 3].map((i) => {
              const j = (i + 1) % 4;
              return <path key={i} d={polyD([base[i], base[j], top[j], top[i]])} fill={tones[i]} stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
            })}
            <path d={polyD(top)} fill="#D9DEE2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <g transform={layer(b.h)}>
              <rect x={cx - 0.19} y={cy - 0.15} width={0.3} height={0.15} rx={0.015} fill={K.screenDark} stroke={INK} strokeWidth={3 / s} />
              <text x={cx - 0.04} y={cy - 0.055} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={0.07} fill={dock > 0 ? K.saffron : '#7FA6B8'} opacity={dock > 0 ? (fired ? 1 - clamp((t - m.pulse) / 0.4) * 0.6 : 0.75 + 0.25 * Math.sin(t * 14)) : 0.8}>
                {dock > 0 ? 'FIRE' : 'READY'}
              </text>
              {/* capacitor charge bar */}
              <rect x={cx - 0.19} y={cy + 0.03} width={0.3} height={0.04} rx={0.01} fill="#46525C" stroke={INK} strokeWidth={2 / s} />
              <rect x={cx - 0.19} y={cy + 0.03} width={0.3 * (fired ? 1 - clamp((t - m.pulse) / 0.3) : charge)} height={0.04} rx={0.01} fill={K.saffron} />
              <circle cx={cx + 0.17} cy={cy - 0.08} r={0.03} fill={mix('#6E7C86', K.saffron, Math.max(pulseK, dock * (fired ? 0 : 1)))} stroke={INK} strokeWidth={2.5 / s} />
              <circle cx={cx + 0.17} cy={cy + 0.05} r={0.025} fill="#B5BEC6" stroke={INK} strokeWidth={2 / s} />
            </g>
          </g>
        );
      })()}
      {/* the command crawling in along the floor cable (slow motion) */}
      {t < m.dock + 0.15 && <Packet x={pkP.x} y={pkP.y} s={0.8} k={clamp((t - (m.inside - 0.1)) / 0.2) * (1 - clamp((t - m.dock) / 0.15))} />}
      {/* the chair back (behind him) and his back */}
      {(() => {
        const q = [P(-0.25, 0.26, 0.95), P(0.25, 0.26, 0.95), P(0.23, 0.36, 0.95), P(-0.23, 0.36, 0.95)];
        const bk = P(0, 0.15, 1.02);
        const s = pScale(c, ROOM_H + 1.02);
        return (
          <g>
            <path d={polyD(q)} fill="#46525C" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <ellipse cx={bk.x} cy={bk.y} rx={0.2 * s} ry={0.13 * s} fill={shade(K.stoccoSleeve, 0.12)} stroke={INK} strokeWidth={4} />
          </g>
        );
      })()}
      {/* arms (sleeves to the elbow, then skin), hands */}
      {[ARM_L, ARM_R].map((A, i) => (
        <g key={i}>
          <Capsule3 c={c} a={A[1]} b={A[2]} r={0.042} color={sk} />
          <Capsule3 c={c} a={A[0]} b={A[1]} r={0.055} color={K.stoccoSleeve} />
        </g>
      ))}
      <TopHand c={c} at={R3(-0.262, -0.37, 0.78)} ang={3} skin={sk} mirror />
      <TopHand c={c} at={R3(0.178, -0.37, 0.8)} ang={-5} skin={sk} />
      {/* shoulders and back */}
      {(() => {
        const L = P(-0.22, 0.07, 1.12), Rr = P(0.22, 0.07, 1.12);
        const s = pScale(c, ROOM_H + 1.12);
        return (
          <g strokeLinecap="round">
            <path d={`M${fmt(L.x)},${fmt(L.y)} L${fmt(Rr.x)},${fmt(Rr.y)}`} stroke={INK} strokeWidth={0.2 * s + 8} />
            <path d={`M${fmt(L.x)},${fmt(L.y)} L${fmt(Rr.x)},${fmt(Rr.y)}`} stroke={K.stoccoSleeve} strokeWidth={0.2 * s} />
            <path d={`M${fmt(L.x)},${fmt(L.y - 0.03 * s)} L${fmt(Rr.x)},${fmt(Rr.y - 0.03 * s)}`} stroke={lit(K.stoccoSleeve, 0.25)} strokeWidth={0.07 * s} opacity={0.6} />
          </g>
        );
      })()}
      {/* head from above: hair at the nape, ears + earbuds, nose tip, swim cap; brain x-ray under the coil */}
      {(() => {
        const s = pScale(c, ROOM_H + 1.28);
        const hc = headC;
        const rx = 0.095 * s, ry = 0.112 * s;
        const ear = (sd: number) => {
          const e = P(sd * 0.094, 0.012, 1.18);
          const se = pScale(c, ROOM_H + 1.18);
          return (
            <g key={sd}>
              <ellipse cx={e.x} cy={e.y} rx={0.016 * se} ry={0.03 * se} fill={shade(sk, 0.08)} stroke={INK} strokeWidth={3} />
              <circle cx={e.x + sd * 0.006 * se} cy={e.y} r={0.012 * se} fill="#F4F6F8" stroke={INK} strokeWidth={2.5} />
            </g>
          );
        };
        const nose = P(0, -0.112, 1.2);
        return (
          <g>
            {ear(-1)}
            {ear(1)}
            <ellipse cx={nose.x} cy={nose.y} rx={0.018 * s} ry={0.016 * s} fill={sk} stroke={INK} strokeWidth={3} />
            <ellipse cx={hc.x} cy={hc.y + 0.02 * s} rx={rx * 0.98} ry={ry * 0.96} fill={STOCCO.hairColor} stroke={INK} strokeWidth={4} />
            <defs>
              <radialGradient id="vc-tcap" cx="0.36" cy="0.32" r="0.8">
                <stop offset="0" stopColor={lit(K.swimCap, 0.3)} />
                <stop offset="1" stopColor={shade(K.swimCap, 0.18)} />
              </radialGradient>
              <clipPath id={`vc-thead${f}`}><ellipse cx={hc.x} cy={hc.y} rx={rx * 0.94} ry={ry * 0.94} /></clipPath>
            </defs>
            <ellipse cx={hc.x} cy={hc.y} rx={rx} ry={ry} fill="url(#vc-tcap)" stroke={INK} strokeWidth={4} />
            <path d={`M${fmt(hc.x - rx * 0.5)},${fmt(hc.y - ry * 0.55)} Q${fmt(hc.x - rx * 0.1)},${fmt(hc.y - ry * 0.8)} ${fmt(hc.x + rx * 0.3)},${fmt(hc.y - ry * 0.7)}`} fill="none" stroke="#FFFFFF" strokeWidth={0.012 * s} strokeLinecap="round" opacity={0.35} />
            {reveal > 0.01 && <TopBrain f={f} c={c} s={s} hc={hc} rx={rx} ry={ry} k={reveal} handArea={handArea} pulse={pulseK} />}
          </g>
        );
      })()}
      {/* the pathway: left motor cortex -> crosses at the neck -> right arm -> hand */}
      {pathK > 0 && pathK < 1.01 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={lineD(pathPts)} stroke={K.saffron} strokeWidth={30} opacity={0.3} />
          <path d={lineD(pathPts)} stroke={INK} strokeWidth={15} />
          <path d={lineD(pathPts)} stroke={K.saffron} strokeWidth={10} />
          <circle cx={head.x} cy={head.y} r={30} fill={K.saffron} opacity={0.4} />
          <circle cx={head.x} cy={head.y} r={15} fill={K.saffron} stroke={INK} strokeWidth={3} />
        </g>
      )}
      {/* coil cable (current runs up it before the click), the coil, the articulated holder */}
      {(() => {
        const pts = COIL_CABLE.map((q) => pp(c, q));
        return (
          <g>
            <path d={lineD(pts)} fill="none" stroke={INK} strokeWidth={0.012 * pts[1].s + 6} strokeLinecap="round" strokeLinejoin="round" />
            <path d={lineD(pts)} fill="none" stroke="#2D363D" strokeWidth={0.012 * pts[1].s} strokeLinecap="round" strokeLinejoin="round" />

          </g>
        );
      })()}
      <Capsule3 c={c} a={ARM[0]} b={ARM[1]} r={0.022} color="#9AA7B1" />
      <Capsule3 c={c} a={ARM[1]} b={ARM[2]} r={0.022} color="#9AA7B1" />
      <Capsule3 c={c} a={ARM[2]} b={ARM[3]} r={0.02} color="#9AA7B1" />
      {(() => {
        const j = pp(c, ARM[2]);
        const j1 = pp(c, ARM[1]);
        return (
          <g>
            <circle cx={j.x} cy={j.y} r={0.03 * j.s} fill="#7E8B96" stroke={INK} strokeWidth={4} />
            <circle cx={j1.x} cy={j1.y} r={0.034 * j1.s} fill="#7E8B96" stroke={INK} strokeWidth={4} />
          </g>
        );
      })()}
      {(() => {
        const dx = ARM[3].x - COIL.x, dy = ARM[3].y - COIL.y, l = Math.hypot(dx, dy) || 1;
        return <Capsule3 c={c} a={ARM[3]} b={{x: COIL.x + (dx / l) * 0.072, y: COIL.y + (dy / l) * 0.072, h: COIL.h + 0.01}} r={0.016} color="#46525C" />;
      })()}
      {(() => {
        const s = coilQ.s;
        const R = 0.072 * s;
        const field = pulseK;
        return (
          <g>
            {field > 0 && [0, 1, 2].map((i) => (
              <circle key={i} cx={coilQ.x} cy={coilQ.y} r={R * (1.2 + 0.9 * (1 - field) + i * 0.35)} fill="none" stroke={K.saffron} strokeWidth={10 - i * 2.5} opacity={field * (1 - i * 0.25)} />
            ))}
            <g opacity={1 - 0.35 * reveal}>
              <circle cx={coilQ.x} cy={coilQ.y} r={R * 0.74} fill="none" stroke={INK} strokeWidth={R * 0.52 + 10} />
              <circle cx={coilQ.x} cy={coilQ.y} r={R * 0.74} fill="none" stroke={mix('#5D6B76', K.saffron, field * 0.8)} strokeWidth={R * 0.52} />
              <circle cx={coilQ.x} cy={coilQ.y} r={R * 0.84} fill="none" stroke="#FFFFFF" strokeWidth={R * 0.08} opacity={0.25} />
            </g>
          </g>
        );
      })()}
      {/* the current running up the coil cable (drawn on top of the holder) */}
      {cableK > 0 && cableK < 1 && (() => {
        const q = pp(c, polyAt([...COIL_CABLE].reverse(), easeIn(cableK)));
        return (
          <g>
            <circle cx={q.x} cy={q.y} r={40} fill={K.saffron} opacity={0.35} />
            <circle cx={q.x} cy={q.y} r={17} fill={K.saffron} stroke={INK} strokeWidth={3} />
          </g>
        );
      })()}
      {/* labels */}
      <Tag x={coilQ.x - 330} y={coilQ.y - 170} text="magnetic coil" size={44} k={clamp((t - (cc.coil - 0.05)) / 0.3) * (1 - clamp((t - (cc.brain - 0.15)) / 0.3))} />
      {(() => {
        const ha = pp(c, HAND_AREA);
        const k = clamp((t - (cc.helps + 0.05)) / 0.3) * (1 - clamp((t - (m.dock - 0.2)) / 0.3));
        return (
          <g>
            {k > 0.01 && <path d={`M${fmt(ha.x - 300)},${fmt(ha.y - 150)} Q${fmt(ha.x - 120)},${fmt(ha.y - 140)} ${fmt(ha.x - 22)},${fmt(ha.y - 18)}`} fill="none" stroke={INK} strokeWidth={5} opacity={k} />}
            <Tag x={ha.x - 360} y={ha.y - 170} text="left motor cortex" size={42} k={k} />
          </g>
        );
      })()}
      {(() => {
        const k = clamp((t - (cc.brain + 0.2)) / 0.3) * (1 - clamp((t - (m.dock - 0.2)) / 0.3));
        const l = P(-0.2, 0.02, 1.28), r = P(0.2, 0.02, 1.28);
        return (
          <g>
            <Tag x={l.x} y={l.y} text="L" size={36} k={k} />
            <Tag x={r.x} y={r.y} text="R" size={36} k={k} />
          </g>
        );
      })()}
    </g>
  );
};

/** the brain seen from above inside the head outline: left hemisphere frame-left, the motor strip, the hand area */
const TopBrain: React.FC<{f: number; c: PCam; s: number; hc: V; rx: number; ry: number; k: number; handArea: number; pulse: number}> = ({f, c, s, hc, rx, ry, k, handArea, pulse}) => {
  const ha = pp(c, HAND_AREA);
  // x-ray iris from the coil centre outward
  const coil = pp(c, COIL);
  const iris = Math.max(rx, ry) * 2.3 * easeOut(k);
  const gyr = (sd: number) =>
    Array.from({length: 6}, (_, i) => {
      const y = hc.y - ry * 0.7 + i * ry * 0.28;
      const x0 = hc.x + sd * rx * 0.1, x1 = hc.x + sd * rx * 0.82;
      return <path key={i} d={`M${fmt(x0)},${fmt(y)} Q${fmt((x0 + x1) / 2)},${fmt(y - ry * 0.12)} ${fmt(x1)},${fmt(y + ry * 0.05)}`} fill="none" stroke="#C98580" strokeWidth={0.006 * s} strokeLinecap="round" opacity={0.7} />;
    });
  // the motor strip: a band from near the vertex sweeping laterally and slightly forward on each side
  const strip = (sd: number) => `M${fmt(hc.x + sd * rx * 0.06)},${fmt(hc.y + ry * 0.02)} Q${fmt(hc.x + sd * rx * 0.5)},${fmt(hc.y - ry * 0.02)} ${fmt(hc.x + sd * rx * 0.86)},${fmt(hc.y - ry * 0.22)}`;
  return (
    <g>
      <defs>
        <clipPath id={`vc-tiris${f}`}><circle cx={coil.x} cy={coil.y} r={iris} /></clipPath>
        <radialGradient id="vc-tbrain" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#F9CFC6" />
          <stop offset="1" stopColor="#E59A92" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#vc-thead${f})`}>
        <g clipPath={`url(#vc-tiris${f})`}>
          <ellipse cx={hc.x} cy={hc.y} rx={rx} ry={ry} fill="url(#vc-tbrain)" />
          {gyr(-1)}
          {gyr(1)}
          <path d={strip(-1)} fill="none" stroke="#F07C66" strokeWidth={0.024 * s} strokeLinecap="round" opacity={0.9} />
          <path d={strip(1)} fill="none" stroke="#F07C66" strokeWidth={0.024 * s} strokeLinecap="round" opacity={0.9} />
          <path d={`M${fmt(hc.x)},${fmt(hc.y - ry)} L${fmt(hc.x)},${fmt(hc.y + ry)}`} stroke={INK} strokeWidth={0.006 * s} />
          <circle cx={ha.x} cy={ha.y} r={(0.024 + 0.03 * pulse) * s} fill={K.saffron} opacity={0.3 * handArea + 0.5 * pulse} />
          <circle cx={ha.x} cy={ha.y} r={0.014 * s} fill={mix('#F07C66', K.saffron, handArea)} stroke={INK} strokeWidth={handArea > 0.1 ? 3 : 0} />
        </g>
      </g>
      <ellipse cx={hc.x} cy={hc.y} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={4} opacity={k} />
    </g>
  );
};

// ---------------------------------------------------------------- the shot
export const CampusShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const m = tm();
  const c = campusCam(t);
  const pk = pkCampus(t);
  const aboveRoof = c.alt > BB.h + 0.05;
  const pkp = pPt(c, pk.p.x, pk.p.y, 0.6);
  const arriveK = clamp((t - m.arriveB) / 0.35);
  const sun = '#FFFFFF';
  // skylight polygon on Stocco's roof: the room is seen through it
  const sky = [pPt(c, SKY.x0, SKY.y0, BB.h), pPt(c, SKY.x1, SKY.y0, BB.h), pPt(c, SKY.x1, SKY.y1, BB.h), pPt(c, SKY.x0, SKY.y1, BB.h)];
  const walkers = [0, 1, 2, 3].map((i) => {
    const u = ((t * (0.012 + i * 0.004) + i * 0.27) % 1);
    const q = bzq([{x: -67, y: 6}, {x: -30, y: 34}, {x: 20, y: -12}, {x: 70, y: 18}], i % 2 ? 1 - u : u);
    return <Walker key={i} c={c} x={q.x + (i % 2 ? 1 : -1)} y={q.y} ang={i % 2 ? 200 : 20} col={[K.coral, K.teal, K.saffron, K.purple][i]} t={t + i} />;
  });
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.grass} />
      {aboveRoof && (
        <g>
          <CampusGround c={c} t={t} pk={pk} />
          {walkers}
          {OTHERS.map((b, i) => <Box key={i} id={`vc-o${i}`} c={c} b={b} wall={i % 2 ? '#C9A27A' : K.stone} roof={i % 2 ? '#8A96A0' : '#9C8F84'} floors={3} />)}
          <Box id="vc-ba" c={c} b={BA} wall={K.brick} roof="#6F7E88" floors={4} roofKids={<g><rect x={-100} y={-8} width={6} height={4} fill="#9AA7B1" /><rect x={-86} y={4} width={5} height={5} fill="#9AA7B1" /></g>} />
          <Box id="vc-bb" c={c} b={BB} wall="#B8775E" roof="#7E8A92" floors={4} roofKids={<g>{Array.from({length: 90}, (_, i) => <circle key={i} cx={BB.x0 + 2 + ((i * 37) % 47)} cy={BB.y0 + 2 + ((i * 53) % 31)} r={0.35} fill="#6B7780" opacity={0.6} />)}<path d={`M${BB.x0 + 3},${BB.y0 + 17} L${BB.x1 - 3},${BB.y0 + 17}`} stroke="#6B7780" strokeWidth={0.25} strokeDasharray="1 1" /></g>} />
          {/* the room through the skylight */}
          <defs><clipPath id={`vc-sky${f}`}><path d={polyD(sky)} /></clipPath></defs>
          <g clipPath={`url(#vc-sky${f})`}>
            <rect x={0} y={0} width={1920} height={1080} fill="#E6DCCB" />
            <TopRoom c={c} t={t} f={f} />
            <path d={polyD(sky)} fill="#CFE8F5" opacity={0.25} />
            <path d={`M${fmt(sky[0].x)},${fmt(sky[0].y)} L${fmt(lerp(sky[0].x, sky[1].x, 0.4))},${fmt(sky[0].y)} L${fmt(sky[3].x)},${fmt(lerp(sky[0].y, sky[3].y, 0.6))} Z`} fill={sun} opacity={0.18} />
          </g>
          <path d={polyD(sky)} fill="none" stroke={INK} strokeWidth={5} />
          {ROOF_UNITS.map((u, i) => <Box key={i} id={`vc-ru${i}`} c={c} b={u} h0={BB.h} wall="#C9D1D8" roof="#E9EDF0" floors={0} roofKids={<circle cx={(u.x0 + u.x1) / 2} cy={(u.y0 + u.y1) / 2} r={Math.min(u.x1 - u.x0, u.y1 - u.y0) * 0.3} fill="#9AA7B1" stroke={INK} strokeWidth={0.12} />} />)}
          <Box id="vc-tw" c={c} b={TOWER} wall="#D8CBB4" roof="#8A96A0" floors={8} roofKids={<rect x={-6} y={-46} width={8} height={6} fill="#9AA7B1" />} />
          {TREES.map(([x, y, r, h], i) => <TreeTop key={i} c={c} x={x} y={y} r={r} h={h} />)}
          {/* the command on the network line */}
          {t < m.arriveB + 0.4 && <Packet x={pkp.x} y={pkp.y} s={1.0 * (1 - 0.7 * arriveK)} k={1 - arriveK} />}
          {arriveK > 0 && arriveK < 1 && (
            <circle cx={pPt(c, 69.5, 12, 1).x} cy={pPt(c, 69.5, 12, 1).y} r={30 + 120 * arriveK} fill="none" stroke={K.saffron} strokeWidth={10 * (1 - arriveK)} />
          )}
          <Tag x={pPt(c, -5, 26, 0).x} y={pPt(c, -5, 26, 0).y + 90} text="internet" size={40} k={clamp((t - (ct().internet - 0.25)) / 0.25) * (1 - clamp((t - (ct().fire - 0.4)) / 0.3))} />
          {CLOUDS.map(([x, y, h, r], i) => <Cloud key={i} c={c} x={x + t * 1.2} y={y} h={h} r={r} />)}
        </g>
      )}
      {!aboveRoof && <TopRoom c={c} t={t} f={f} />}
    </g>
  );
};
