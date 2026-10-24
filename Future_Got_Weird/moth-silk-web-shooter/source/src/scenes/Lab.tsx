// The lab shots (5.3-8.75 s and 16.55 s to the end): the bench, the extrusion apparatus, the mounted test fiber,
// the sand dish with the half-buried blade, the collection tray and the cocoons, drawn as flat ink-outlined shapes in
// one true-scale perspective space (labWorld.ts holds every state). She is the Crew card behind the bench; her arms
// are drawn in true perspective so her hands meet the props exactly.
import React from 'react';
import {BODY_P, INK, PERSON_LAB, CREW_C} from '../rig/cast';
import {ArmPersp, Crew4} from '../rig/Crew';
import {add3, basis, B, Cam, cardOf, cardToWorld, dot3, len3, mul3, norm3, pathOf, proj, projPoly, sub3, U, V3, v3} from '../rig/geo';
import {Air, depthOf, haze, inkAt, lerpCam, lookAt, Planes, Poly, ringPts} from '../rig/draw';
import {clamp, f1, mixHex, settle, ss, ss5} from '../lib';
import {
  A0, bladeAt, BLADE_OUT, BLADE_SLOT, COCOON_DISH, COCOON_SPOT, cocoonAt, DISH, fiberAt, FLIGHT, FRAME, frameP, grainsAt, HER_G, HER_H, herLab,
  LB, LT, N_END, N_FIRE, PUMP, STAND, SYR, SYR_R, SYR_X0, SYR_X1, SYR_Y, TRAY, WAND, wandAt,
} from './labWorld';

const AIR: Air = {col: '#E4ECEE', near: 2.6, far: 14};
const C = {
  wall: '#E3ECEE', wallLo: '#CBDADF', stripe: CREW_C.teal, floor: '#AEBDC2', top: '#2E3D45', topEdge: '#455862', cab: '#5C93A2', cabD: '#4A7C8A',
  shelf: '#9AA9AE', glass: '#CFEAF0', sand: '#D8B988', sandD: '#BE9C6C', steel: '#C9D3D8', steelD: '#8D9BA3', steelL: '#EEF3F5',
  pump: '#EDE8DA', pumpD: '#D3CCBA', panel: '#2F6F78', paper: '#F7F0DE', cocoon: '#F3E8CB', cocoonD: '#DCCBA3', silk: '#FFFBF0', silkLiq: '#F2D48A', acetone: '#9EE6DD',
};

// ------------------------------------------------------------------ small drawing helpers
const wpx = (b: B, p: V3, w: number, min = 0) => Math.max(min, (b.c.f * w) / Math.max(0.01, depthOf(b, p)));
type S2 = {x: number; y: number};
const ribbon = (pts: S2[], w: number[]) => {
  if (pts.length < 2) return '';
  const L: S2[] = [], R: S2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(c.y - a.y), ny = c.x - a.x;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    L.push({x: pts[i].x + (nx * w[i]) / 2, y: pts[i].y + (ny * w[i]) / 2});
    R.push({x: pts[i].x - (nx * w[i]) / 2, y: pts[i].y - (ny * w[i]) / 2});
  }
  return `M${[...L, ...R.reverse()].map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`;
};
/** a round tube through world points (radius r, metres), ink-outlined, with optional inner core and highlight */
const Tube: React.FC<{b: B; pts: V3[]; r: number; fill: string; core?: string; coreK?: number; hi?: boolean; min?: number; caps?: boolean; op?: number}> = ({b, pts, r, fill, core, coreK = 0.45, hi = true, min = 1.5, caps = true, op = 1}) => {
  const vis = pts.filter((p) => depthOf(b, p) > 0.012);
  if (vis.length < 2) return null;
  const S = vis.map((p) => proj(b, p));
  const w = vis.map((p) => wpx(b, p, 2 * r, min));
  const ol = Math.min(4, Math.max(1.2, inkAt(b, depthOf(b, vis[0])) * 0.8));
  const e0 = S[0], e1 = S[S.length - 1];
  return (
    <g opacity={op}>
      <path d={ribbon(S, w.map((x) => x + 2 * ol))} fill={INK} />
      {caps && <circle cx={e0.x} cy={e0.y} r={w[0] / 2 + ol} fill={INK} />}
      {caps && <circle cx={e1.x} cy={e1.y} r={w[w.length - 1] / 2 + ol} fill={INK} />}
      <path d={ribbon(S, w)} fill={fill} />
      {caps && <circle cx={e0.x} cy={e0.y} r={w[0] / 2} fill={fill} />}
      {caps && <circle cx={e1.x} cy={e1.y} r={w[w.length - 1] / 2} fill={fill} />}
      {core && <path d={ribbon(S, w.map((x) => x * coreK))} fill={core} />}
      {hi && <path d={ribbon(S.map((p, i) => ({x: p.x - w[i] * 0.18, y: p.y - w[i] * 0.18})), w.map((x) => x * 0.16))} fill="#FFFFFF" opacity={0.7} />}
    </g>
  );
};
const bez = (p0: V3, p1: V3, p2: V3, p3: V3, n = 24): V3[] => Array.from({length: n + 1}, (_, i) => {
  const u = i / n, a = (1 - u) ** 3, bb = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
  return v3(p0.x * a + p1.x * bb + p2.x * c + p3.x * d, p0.y * a + p1.y * bb + p2.y * c + p3.y * d, p0.z * a + p1.z * bb + p2.z * c + p3.z * d);
});
const polyNode = (b: B, pts: V3[], fill: string, k: string, o: {stroke?: string | false; op?: number; sw?: number} = {}) => {
  const P = projPoly(b, pts, 0.012);
  if (P.length < 3) return null;
  const d = depthOf(b, pts.reduce((s, p) => add3(s, mul3(p, 1 / pts.length)), v3(0, 0, 0)));
  return <path key={k} d={pathOf(P)} fill={mixHex(fill, AIR.col, haze(AIR, d))} opacity={o.op ?? 1} stroke={o.stroke === false ? 'none' : (o.stroke ?? INK)} strokeWidth={inkAt(b, d, o.sw ?? 1)} strokeLinejoin="round" />;
};
/** a box: the faces that look at the camera, darker sides */
const Box: React.FC<{b: B; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; col: string; side?: string; top?: string; k: string}> = ({b, x0, x1, y0, y1, z0, z1, col, side, top, k}) => {
  const c = b.c.pos, n: React.ReactNode[] = [];
  const sd = side ?? mixHex(col, '#000000', 0.15), tp = top ?? mixHex(col, '#FFFFFF', 0.12);
  if (c.x < x0) n.push(polyNode(b, [v3(x0, y0, z0), v3(x0, y0, z1), v3(x0, y1, z1), v3(x0, y1, z0)], sd, `${k}l`));
  if (c.x > x1) n.push(polyNode(b, [v3(x1, y0, z0), v3(x1, y0, z1), v3(x1, y1, z1), v3(x1, y1, z0)], sd, `${k}r`));
  if (c.z > z1) n.push(polyNode(b, [v3(x0, y0, z1), v3(x1, y0, z1), v3(x1, y1, z1), v3(x0, y1, z1)], col, `${k}f`));
  if (c.z < z0) n.push(polyNode(b, [v3(x0, y0, z0), v3(x1, y0, z0), v3(x1, y1, z0), v3(x0, y1, z0)], col, `${k}b`));
  if (c.y > y1) n.push(polyNode(b, [v3(x0, y1, z0), v3(x1, y1, z0), v3(x1, y1, z1), v3(x0, y1, z1)], tp, `${k}t`));
  return <g>{n}</g>;
};
/** a horizontal disc / ring outline */
const disc = (b: B, c: V3, r: number, fill: string, k: string, o: {stroke?: string | false; op?: number; sw?: number} = {}) => polyNode(b, ringPts(c, r, 48), fill, k, o);

// ------------------------------------------------------------------ the room and bench
const roomPolys = (): Poly[] => {
  const P: Poly[] = [];
  const Y0 = -0.92, Y1 = 2.0, ZB = -1.4, XL = -1.7, XR = 1.7;
  P.push({key: 'floor', pts: [v3(XL, Y0, ZB), v3(XR, Y0, ZB), v3(XR, Y0, 3), v3(XL, Y0, 3)], fill: C.floor, stroke: false, layer: 0});
  P.push({key: 'back', pts: [v3(XL, Y0, ZB), v3(XR, Y0, ZB), v3(XR, Y1, ZB), v3(XL, Y1, ZB)], fill: C.wall, layer: 0.5});
  P.push({key: 'right', pts: [v3(XR, Y0, ZB), v3(XR, Y0, 3), v3(XR, Y1, 3), v3(XR, Y1, ZB)], fill: '#D6E2E5', layer: 0.5, n: v3(-1, 0, 0)});
  P.push({key: 'left', pts: [v3(XL, Y0, ZB), v3(XL, Y0, 3), v3(XL, Y1, 3), v3(XL, Y1, ZB)], fill: '#D6E2E5', layer: 0.5, n: v3(1, 0, 0)});
  P.push({key: 'blo', pts: [v3(XL, Y0, ZB + 0.004), v3(XR, Y0, ZB + 0.004), v3(XR, -0.05, ZB + 0.004), v3(XL, -0.05, ZB + 0.004)], fill: C.wallLo, stroke: false, layer: 1});
  P.push({key: 'bst', pts: [v3(XL, 0.3, ZB + 0.006), v3(XR, 0.3, ZB + 0.006), v3(XR, 0.36, ZB + 0.006), v3(XL, 0.36, ZB + 0.006)], fill: C.stripe, stroke: false, layer: 1});
  // shelves with glassware
  for (const [y, x0, x1] of [[0.62, -1.3, 0.2], [1.02, -1.3, 0.2], [0.82, 0.55, 1.5]] as [number, number, number][]) {
    P.push({key: `sh${y}${x0}`, pts: [v3(x0, y, ZB + 0.01), v3(x1, y, ZB + 0.01), v3(x1, y - 0.03, ZB + 0.01), v3(x0, y - 0.03, ZB + 0.01)], fill: C.shelf, layer: 1.5});
    for (let i = 0; i < 6; i++) {
      const x = x0 + 0.12 + i * ((x1 - x0 - 0.24) / 5), h = 0.1 + 0.06 * ((i * 7) % 3), w = 0.035 + 0.01 * (i % 2);
      const col = ['#9EE6DD', '#F2D48A', '#CFEAF0', '#EF8A72', '#CFEAF0', '#7FC7C0'][i];
      P.push({key: `bt${y}${i}`, pts: [v3(x - w, y, ZB + 0.03), v3(x + w, y, ZB + 0.03), v3(x + w, y + h, ZB + 0.03), v3(x + w * 0.4, y + h + 0.03, ZB + 0.03), v3(x - w * 0.4, y + h + 0.03, ZB + 0.03), v3(x - w, y + h, ZB + 0.03)], fill: col, layer: 2, op: 0.95});
    }
  }
  // window on the right wall, daylight
  P.push({key: 'win', pts: [v3(XR - 0.005, 0.15, -1.2), v3(XR - 0.005, 0.15, -0.1), v3(XR - 0.005, 1.4, -0.1), v3(XR - 0.005, 1.4, -1.2)], fill: '#EAF4F2', layer: 1, n: v3(-1, 0, 0)});
  P.push({key: 'win2', pts: [v3(XR - 0.008, 0.2, -1.15), v3(XR - 0.008, 0.2, -0.15), v3(XR - 0.008, 1.35, -0.15), v3(XR - 0.008, 1.35, -1.15)], fill: '#BFE3EE', layer: 1.2, n: v3(-1, 0, 0)});
  return P;
};
const BENCH = {x0: -0.85, x1: 0.85, z0: -0.38, z1: 0.36};
const Bench: React.FC<{b: B}> = ({b}) => (
  <g>
    <Box b={b} k="cab" x0={BENCH.x0 + 0.02} x1={BENCH.x1 - 0.02} y0={-0.92} y1={-0.035} z0={BENCH.z0} z1={BENCH.z1 - 0.03} col={C.cab} side={C.cabD} />
    {[-0.62, -0.2, 0.22, 0.64].map((x, i) => (
      <g key={i}>
        {polyNode(b, [v3(x - 0.19, -0.84, BENCH.z1 - 0.028), v3(x + 0.19, -0.84, BENCH.z1 - 0.028), v3(x + 0.19, -0.1, BENCH.z1 - 0.028), v3(x - 0.19, -0.1, BENCH.z1 - 0.028)], C.cabD, `cd${i}`, {sw: 0.6})}
        {polyNode(b, [v3(x - 0.06, -0.16, BENCH.z1 - 0.026), v3(x + 0.06, -0.16, BENCH.z1 - 0.026), v3(x + 0.06, -0.14, BENCH.z1 - 0.026), v3(x - 0.06, -0.14, BENCH.z1 - 0.026)], C.steel, `ch${i}`, {sw: 0.6})}
      </g>
    ))}
    <Box b={b} k="top" x0={BENCH.x0} x1={BENCH.x1} y0={-0.035} y1={0} z0={BENCH.z0} z1={BENCH.z1} col={C.topEdge} top={C.top} />
  </g>
);

// ------------------------------------------------------------------ apparatus
const Pump: React.FC<{b: B}> = ({b}) => {
  const {x0, x1, z0, z1, h} = PUMP;
  return (
    <g>
      <Box b={b} k="pump" x0={x0} x1={x1} y0={0} y1={h} z0={z0} z1={z1} col={C.pump} side={C.pumpD} />
      {polyNode(b, [v3(x0 + 0.02, 0.012, z1 + 0.001), v3(x0 + 0.12, 0.012, z1 + 0.001), v3(x0 + 0.12, 0.06, z1 + 0.001), v3(x0 + 0.02, 0.06, z1 + 0.001)], C.panel, 'pp', {sw: 0.7})}
      {polyNode(b, [v3(x0 + 0.03, 0.035, z1 + 0.002), v3(x0 + 0.09, 0.035, z1 + 0.002), v3(x0 + 0.09, 0.052, z1 + 0.002), v3(x0 + 0.03, 0.052, z1 + 0.002)], '#BDF2EC', 'pd', {sw: 0.5})}
      {[0, 1, 2].map((i) => polyNode(b, [v3(x0 + 0.14 + i * 0.022, 0.02, z1 + 0.001), v3(x0 + 0.155 + i * 0.022, 0.02, z1 + 0.001), v3(x0 + 0.155 + i * 0.022, 0.034, z1 + 0.001), v3(x0 + 0.14 + i * 0.022, 0.034, z1 + 0.001)], i === 0 ? CREW_C.saffron : '#D9D3C2', `pb${i}`, {sw: 0.5}))}
      {/* pusher block and the two syringes lying on top */}
      <Box b={b} k="push" x0={SYR_X0 - 0.03} x1={SYR_X0 - 0.012} y0={h} y1={h + 0.03} z0={z0 + 0.02} z1={z1 - 0.02} col="#7D8E96" />
      {SYR.map((s, i) => (
        <g key={i}>
          <Tube b={b} pts={[v3(SYR_X0 - 0.03, SYR_Y, s.z), v3(SYR_X0, SYR_Y, s.z)]} r={0.003} fill="#E8EDEF" min={1} />
          <Tube b={b} pts={[v3(SYR_X0, SYR_Y, s.z), v3(SYR_X1, SYR_Y, s.z)]} r={SYR_R} fill="#F4FAFB" core={s.col} coreK={0.72} min={2} />
          <Tube b={b} pts={[v3(SYR_X1, SYR_Y, s.z), v3(SYR_X1 + 0.014, SYR_Y, s.z)]} r={0.003} fill="#E8EDEF" min={1} />
        </g>
      ))}
    </g>
  );
};
const wandRear = (t: number) => {
  const w = wandAt(t);
  return sub3(w.N, mul3(w.a, WAND.len));
};
const Tubes: React.FC<{b: B; t: number}> = ({b, t}) => {
  const w = wandAt(t);
  const R = wandRear(t);
  return (
    <g>
      {SYR.map((s, i) => {
        const p0 = v3(SYR_X1 + 0.014, SYR_Y, s.z), p3 = add3(R, v3(0, 0.002 * (i ? 1 : -1), 0.002 * (i ? 1 : -1)));
        const p1 = add3(p0, v3(0.08, -0.02, 0.02));
        const p2 = add3(p3, add3(mul3(w.a, -0.08), v3(0, -0.04, -0.03)));
        return <Tube key={i} b={b} pts={bez(p0, p1, p2, p3, 30)} r={0.0022} fill="#EAF2F4" core={s.col} coreK={0.5} min={1.6} caps={false} />;
      })}
    </g>
  );
};
const Wand: React.FC<{b: B; t: number}> = ({b, t}) => {
  const w = wandAt(t);
  const R = wandRear(t), F = sub3(w.N, mul3(w.a, WAND.needle));
  const band0 = sub3(F, mul3(w.a, 0.022)), band1 = sub3(F, mul3(w.a, 0.012));
  return (
    <g>
      <Tube b={b} pts={[R, F]} r={WAND.r} fill="#F3F5F6" min={3} />
      <Tube b={b} pts={[band0, band1]} r={WAND.r * 1.06} fill={CREW_C.teal} min={3} hi={false} caps={false} />
      <Tube b={b} pts={[sub3(F, mul3(w.a, 0.004)), add3(F, mul3(w.a, 0.004))]} r={WAND.r * 0.55} fill={C.steelD} min={2} />
      {/* the coaxial needle: the outer sleeve (acetone) and the inner needle (silk) just proud of it */}
      <Tube b={b} pts={[F, w.N]} r={0.0014} fill={C.steel} min={1.6} />
    </g>
  );
};
const StandNode: React.FC<{b: B}> = ({b}) => (
  <Box b={b} k="stand" x0={STAND.x - 0.03} x1={STAND.x + 0.005} y0={0} y1={0.02} z0={STAND.z - 0.012} z1={STAND.z + 0.012} col="#3C4C55" />
);

// ------------------------------------------------------------------ the mounted test fiber (paper frame on a clamp)
const FrameMount: React.FC<{b: B}> = ({b}) => {
  const {hw, hh, m, c} = FRAME;
  const outer = [frameP(-hw - m, -hh - m), frameP(hw + m, -hh - m), frameP(hw + m, hh + m), frameP(-hw - m, hh + m)];
  const inner = [frameP(-hw, -hh), frameP(-hw, hh), frameP(hw, hh), frameP(hw, -hh)];
  const Po = projPoly(b, outer, 0.012), Pi = projPoly(b, inner, 0.012);
  const d = depthOf(b, c);
  if (Po.length < 3) return null;
  const fa = frameP(-hw, -hh, 0.0006), fb = frameP(hw, hh, 0.0006);
  const base = frameP(0, -hh - m);
  return (
    <g>
      <Box b={b} k="clampb" x0={c.x - 0.02} x1={c.x + 0.02} y0={0} y1={0.012} z0={c.z - 0.015} z1={c.z + 0.015} col="#3C4C55" />
      <Box b={b} k="clampp" x0={c.x - 0.004} x1={c.x + 0.004} y0={0.012} y1={base.y + 0.004} z0={c.z - 0.004} z1={c.z + 0.004} col={C.steelD} />
      <path d={`${pathOf(Po)} ${pathOf(Pi)}`} fillRule="evenodd" fill={C.paper} stroke={INK} strokeWidth={inkAt(b, d)} strokeLinejoin="round" />
      <Fiber b={b} pts={[fa, fb]} />
      {[fa, fb].map((p, i) => {
        const q = proj(b, p);
        return <ellipse key={i} cx={q.x} cy={q.y} rx={wpx(b, p, 0.0035, 5)} ry={wpx(b, p, 0.0028, 4)} fill="#F6EFB8" stroke={INK} strokeWidth={Math.min(3, inkAt(b, d) * 0.7)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ fiber
const FIBER_W = 0.0004; // drawn width (the real fibers are finer; this keeps a single strand visible)
const Fiber: React.FC<{b: B; pts: V3[]; head?: V3; headK?: number}> = ({b, pts, head, headK = 0}) => {
  const vis = pts.filter((p) => depthOf(b, p) > 0.01);
  if (vis.length < 2) return null;
  const S = vis.map((p) => proj(b, p));
  const w = vis.map((p) => wpx(b, p, FIBER_W, 2.4));
  return (
    <g>
      <path d={ribbon(S, w.map((x) => x + 3))} fill={INK} />
      <path d={ribbon(S, w)} fill={C.silk} />
      {head && headK > 0 && (() => {
        const q = proj(b, head), r = wpx(b, head, 0.0011 * headK, 3);
        return <g><circle cx={q.x} cy={q.y} r={r + 1.6} fill={INK} /><circle cx={q.x} cy={q.y} r={r} fill={C.silkLiq} /><circle cx={q.x - r * 0.3} cy={q.y - r * 0.3} r={r * 0.3} fill="#FFF" opacity={0.8} /></g>;
      })()}
    </g>
  );
};

// ------------------------------------------------------------------ blade, dish, tray, cocoons
const bladeWorld = (t: number) => {
  const bl = bladeAt(t);
  const ux = bl.b.x - bl.a.x, uy = bl.b.y - bl.a.y, l = Math.hypot(ux, uy) || 1;
  const U2 = {x: ux / l, y: uy / l}, V2 = {x: -U2.y, y: U2.x};
  const to = ([u, v]: [number, number]) => v3(bl.a.x + U2.x * u + V2.x * v, bl.a.y + U2.y * u + V2.y * v, 0);
  return {bl, out: BLADE_OUT.map(to), slot: BLADE_SLOT.map(to), U2, V2, to};
};
/** clip a world polygon (in the z = 0 plane) to y >= ys (Sutherland-Hodgman) */
const clipY = (pts: V3[], ys: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], c = pts[(i + 1) % pts.length];
    const ia = a.y >= ys, ic = c.y >= ys;
    if (ia) out.push(a);
    if (ia !== ic) {
      const k = (ys - a.y) / (c.y - a.y);
      out.push(v3(a.x + (c.x - a.x) * k, ys, a.z + (c.z - a.z) * k));
    }
  }
  return out;
};
const inDishX = (x: number) => x > DISH.x - DISH.r && x < DISH.x + DISH.r;
const Blade: React.FC<{b: B; t: number}> = ({b, t}) => {
  const {out, slot, to} = bladeWorld(t);
  const buried = inDishX((out[0].x + out[5].x) / 2);
  const poly = buried ? clipY(out, DISH.sand) : out;
  if (poly.length < 3) return null;
  const d = depthOf(b, poly[0]);
  const edge = BLADE_OUT.slice(5, 11).map(to);
  const edgeIn = BLADE_OUT.slice(5, 11).map(([u, v]) => to([u - 0.0006, v * 0.62]));
  const edgeBand = buried ? clipY([...edge, ...edgeIn.reverse()], DISH.sand) : [...edge, ...edgeIn.reverse()];
  const slotC = buried ? clipY(slot, DISH.sand) : slot;
  const P = projPoly(b, poly, 0.01);
  return (
    <g>
      <path d={pathOf(P)} fill={C.steel} stroke={INK} strokeWidth={inkAt(b, d, 1.1)} strokeLinejoin="round" />
      {edgeBand.length > 2 && <path d={pathOf(projPoly(b, edgeBand, 0.01))} fill={C.steelL} />}
      {slotC.length > 2 && <path d={pathOf(projPoly(b, slotC, 0.01))} fill="#55646C" stroke={INK} strokeWidth={inkAt(b, d, 0.7)} />}
      {(() => {
        // one long highlight along the back of the blade
        const hl = [to([0.004, 0.0018]), to([0.03, 0.0022])].filter((p) => !buried || p.y > DISH.sand);
        if (hl.length < 2) return null;
        const a = proj(b, hl[0]), c = proj(b, hl[1]);
        return <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#FFFFFF" strokeWidth={wpx(b, hl[0], 0.0007, 1.5)} strokeLinecap="round" opacity={0.85} />;
      })()}
    </g>
  );
};
const Dish: React.FC<{b: B; t: number; children?: React.ReactNode}> = ({b, t, children}) => {
  const c0 = v3(DISH.x, 0, DISH.z), cs = v3(DISH.x, DISH.sand, DISH.z), cw = v3(DISH.x, DISH.wall, DISH.z);
  const ring = (y: number) => ringPts(v3(DISH.x, y, DISH.z), DISH.r, 56);
  const bot = projPoly(b, ring(0), 0.01), top = projPoly(b, ring(DISH.wall), 0.01), sand = projPoly(b, ring(DISH.sand), 0.01);
  if (top.length < 3) return null;
  const d = depthOf(b, cs);
  // the outline of the glass wall seen from here: the hull of the bottom and top rings
  const hull = convexHull([...bot, ...top]);
  // sand grains texture: fixed specks on the surface
  const specks = Array.from({length: 46}).map((_, i) => {
    const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 46) * DISH.r * 0.94;
    const p = v3(DISH.x + Math.cos(a) * r, DISH.sand + 0.0002, DISH.z + Math.sin(a) * r);
    const q = proj(b, p);
    return <circle key={i} cx={q.x} cy={q.y} r={wpx(b, p, 0.0006, 0.8)} fill={i % 3 ? C.sandD : '#E8CFA3'} />;
  });
  // the dent where the blade goes in (only while it is buried)
  const bl = bladeAt(t);
  const entry = inDishX(bl.a.x) && bl.b.y < DISH.sand ? (() => {
    const k = (DISH.sand - bl.a.y) / (bl.b.y - bl.a.y);
    if (k < 0 || k > 1) return null;
    const p = v3(bl.a.x + (bl.b.x - bl.a.x) * k, DISH.sand, 0);
    return disc(b, p, 0.006, C.sandD, 'dent', {stroke: false, op: 0.8});
  })() : null;
  void c0; void cw;
  return (
    <g>
      <path d={pathOf(hull)} fill={C.glass} opacity={0.35} />
      <path d={pathOf(sand)} fill={C.sand} stroke={mixHex(C.sandD, INK, 0.3)} strokeWidth={inkAt(b, d, 0.6)} />
      {specks}
      {entry}
      {children}
      {/* the near half of the glass wall over everything inside, and the rim */}
      <path d={pathOf(hull)} fill={C.glass} opacity={0.18} stroke={INK} strokeWidth={inkAt(b, d, 0.9)} strokeLinejoin="round" />
      <path d={pathOf(top)} fill="none" stroke="#FFFFFF" strokeWidth={inkAt(b, d, 1.2)} opacity={0.7} />
    </g>
  );
};
const convexHull = (pts: S2[]): S2[] => {
  const p = [...pts].sort((a, c) => a.x - c.x || a.y - c.y);
  const cr = (o: S2, a: S2, c: S2) => (a.x - o.x) * (c.y - o.y) - (a.y - o.y) * (c.x - o.x);
  const lo: S2[] = [], up: S2[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const Tray: React.FC<{b: B; children?: React.ReactNode}> = ({b, children}) => {
  const {x0, x1, z0, z1, h, floor} = TRAY;
  const cam = b.c.pos;
  const inner = (k: string) => polyNode(b, [v3(x0 + 0.004, floor, z0 + 0.004), v3(x1 - 0.004, floor, z0 + 0.004), v3(x1 - 0.004, floor, z1 - 0.004), v3(x0 + 0.004, floor, z1 - 0.004)], '#AAB8BF', k, {sw: 0.6});
  const wall = (pts: V3[], k: string, col = C.steel) => polyNode(b, pts, col, k, {sw: 0.8});
  const back = wall([v3(x0, 0, z0), v3(x1, 0, z0), v3(x1, h, z0), v3(x0, h, z0)], 'tb', '#B9C5CB');
  const left = cam.x > x0 ? wall([v3(x0, 0, z0), v3(x0, 0, z1), v3(x0, h, z1), v3(x0, h, z0)], 'tl', '#B9C5CB') : null;
  const right = cam.x < x1 ? wall([v3(x1, 0, z0), v3(x1, 0, z1), v3(x1, h, z1), v3(x1, h, z0)], 'tr', '#B9C5CB') : null;
  const front = wall([v3(x0, 0, z1), v3(x1, 0, z1), v3(x1, h, z1), v3(x0, h, z1)], 'tf');
  const lipF = wall([v3(x0, h, z1), v3(x1, h, z1), v3(x1 + 0.004, h, z1 + 0.006), v3(x0 - 0.004, h, z1 + 0.006)], 'tlf', C.steelL);
  return <g>{back}{left}{right}{inner('ti')}{children}{front}{lipF}</g>;
};
const Cocoon: React.FC<{b: B; p: V3; ang?: number; k: string}> = ({b, p, ang = 0.4, k}) => {
  // silhouette: the hull of three near-plane-clipped rings round the cocoon (robust right up to the lens)
  const ax = v3(Math.cos(ang), 0, Math.sin(ang)), side = v3(-Math.sin(ang), 0, Math.cos(ang));
  const L = 0.017, R = 0.0095;
  const ring = (dy: number, sc: number) => Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return add3(add3(add3(p, v3(0, dy, 0)), mul3(ax, Math.cos(a) * L * sc)), mul3(side, Math.sin(a) * R * sc));
  });
  const S = [...projPoly(b, ring(0, 1), 0.012), ...projPoly(b, ring(R * 0.75, 0.66), 0.012), ...projPoly(b, ring(-R * 0.75, 0.66), 0.012)];
  if (S.length < 3) return null;
  const hull = convexHull(S);
  const d = Math.max(0.012, depthOf(b, p));
  const ol = inkAt(b, d);
  const id = `${k}${Math.round(p.x * 1e4)}`;
  // the silk wraps: arcs over the top from one side to the other, along the cocoon
  const wraps = [-0.75, -0.4, -0.05, 0.3, 0.65].map((u, i) => {
    const pts = Array.from({length: 13}, (_, j) => {
      const a = (j / 12) * Math.PI;
      return add3(add3(p, mul3(ax, u * L)), add3(mul3(side, Math.cos(a) * R * Math.sqrt(1 - u * u)), v3(0, Math.sin(a) * R * Math.sqrt(1 - u * u), 0)));
    });
    const P = projPoly(b, pts, 0.012);
    return P.length > 1 ? <path key={i} d={pathOf(P, false)} fill="none" stroke={INK} strokeWidth={ol * 0.35} opacity={0.35} /> : null;
  });
  const hiP = projPoly(b, [add3(add3(p, v3(0, R * 0.8, 0)), mul3(ax, -L * 0.45))], 0.012)[0];
  const sh = projPoly(b, ring(-R + 0.0005, 0.95).map((q) => v3(q.x, 0.0005, q.z)), 0.012);
  return (
    <g key={k}>
      {sh.length > 2 && <path d={pathOf(sh)} fill="#000" opacity={0.18} />}
      <defs><clipPath id={`cc${id}`}><path d={pathOf(hull)} /></clipPath></defs>
      <path d={pathOf(hull)} fill={C.cocoon} />
      <g clipPath={`url(#cc${id})`}>
        {(() => {
          const lo = projPoly(b, ring(-R * 0.35, 0.85), 0.012);
          return lo.length > 2 ? <path d={pathOf(convexHull(lo))} fill={C.cocoonD} opacity={0.4} /> : null;
        })()}
        {wraps}
        {hiP && <ellipse cx={hiP.x} cy={hiP.y} rx={wpx(b, p, 0.005)} ry={wpx(b, p, 0.0018)} fill="#FFFFFF" opacity={0.6} />}
      </g>
      <path d={pathOf(hull)} fill="none" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
    </g>
  );
};
export const cocoonScreen = (b: B, p: V3) => {
  const c = proj(b, p);
  return {x: c.x, y: c.y, r: wpx(b, p, 0.0095)};
};

// ------------------------------------------------------------------ cameras
const K = (pos: V3, tgt: V3, f: number) => lookAt(pos, tgt, f);
/** the one wide shot in the second half (cut in and out on caption boundaries: "eighty" ... "The beginnings") */
export const MEDIUM = {t0: 25.86, t1: 27.87};
/** she is drawn in the opening lab shots and in that wide shot; the tabletop close-ups of the experiment show the nozzle
 *  entering from the edge of frame (held from off screen), so nothing about her switches on or off within a shot */
export const herDrawn = (t: number) => t < LT.macro || (t >= MEDIUM.t0 && t < MEDIUM.t1);
/** the opening lab frame: square on to the mounted test fiber, its upper glue dot where the street anchor was */
export const MATCH = {x: 668, y: 742};
const camFrameCU = (): Cam => {
  const dist = 0.085, f = 1000;
  const q = frameP(FRAME.hw - ((MATCH.x - 540) * dist) / f, FRAME.hh + ((MATCH.y - 960) * dist) / f);
  return K(add3(q, sub3(frameP(0, 0, dist), FRAME.c)), q, f);
};
const camAt = (t: number): Cam => {
  if (t < LT.macro) {
    const c0 = camFrameCU();
    const c1 = K(v3(0.16, 0.3, 0.62), v3(0.12, 0.05, -0.16), 900);
    const c2 = K(v3(-0.04, 0.42, 0.78), v3(-0.08, 0.1, -0.2), 880);
    const cs = COCOON_SPOT;
    const c3 = K(add3(cs, v3(-0.004, 0.062, 0.014)), add3(cs, v3(0.002, 0.0, -0.002)), 1000);
    if (t < 6.45) return lerpCam(c0, c1, ss5(t, LT.start + 0.15, 6.45));
    if (t < 7.45) return lerpCam(c1, c2, ss5(t, 6.45, 7.45));
    return lerpCam(c2, c3, ss5(t, 7.9, LT.macro));
  }
  // the fiber's flight: travelling with its head, behind and above the nozzle side
  const fb = fiberAt(Math.min(t, LT.contact)) ?? {head: v3(N_FIRE.x, N_FIRE.y, 0)};
  const H = fb.head;
  const N0 = wandAt(t).N;
  const flyU = ss(t, LT.back, LT.contact - 0.3);
  const near = 0.42 + 0.58 * ss(t, LT.back, LT.back + 0.9); // starts close on the nozzle (the macro hands over here), then travels back and along
  const fly = K(add3(add3(N0, mul3(sub3(H, N0), 0.82 * flyU)), mul3(v3(-0.05 + 0.012 * flyU, 0.045 - 0.012 * flyU, 0.055 - 0.012 * flyU), near)), add3(add3(N0, mul3(sub3(H, N0), 0.82 * flyU)), mul3(v3(0.06, -0.004, -0.02), near)), 1000);
  // the retrieval is seen from the front-left: the action plays centre-right and her arm comes in from the side
  const land = K(v3(-0.035, 0.08, 0.17), v3(0.11, 0.024, -0.01), 1000);
  const bl = bladeAt(t);
  const bc = v3((bl.a.x + bl.b.x) / 2, (bl.a.y + bl.b.y) / 2, 0);
  const pull = K(v3(-0.03, 0.13, 0.27), v3(0.1, 0.07, -0.02), 1000);
  const carry = K(add3(bc, v3(0.02, -0.005, 0.26)), add3(bc, v3(0.01, -0.03, 0)), 1100);
  const A = v3(bl.a.x, bl.a.y, 0);
  const cuA = K(add3(A, v3(-0.05, 0.012, 0.062)), add3(A, v3(0.004, -0.012, 0)), 1000);
  const w = wandAt(t);
  const mid = v3((w.N.x + A.x) / 2, (w.N.y + A.y) / 2 - 0.012, 0);
  const scale = K(add3(A, v3(-0.04, 0.06, 0.13)), add3(A, v3(0, 0.07, 0)), 1000); // up the strand toward the nozzle
  void mid;
  const lowerC = K(v3(0.2, 0.09, 0.22), v3(0.215, 0.025, 0), 1000);
  const back = K(v3(0.03, 0.09, 0.2), v3(0.15, 0.03, 0), 1000);
  const fin = finalCam();
  // the moves overlap, so the camera never parks: each one begins as the last is settling
  const land2 = K(v3(-0.02, 0.075, 0.15), v3(0.112, 0.024, -0.01), 1000); // a slow push while the slack settles
  if (t < FLIGHT.t1) return fly;
  if (t < 19.9) return lerpCam(fly, land, ss5(t, LT.contact + 0.05, 19.9));
  if (t < 20.62) return lerpCam(land, land2, ss(t, 19.6, 20.9));
  if (t < 21.2) return lerpCam(lerpCam(land, land2, ss(t, 19.6, 20.9)), pull, ss5(t, 20.62, 21.2));
  const lift = K(v3(0.08, 0.12, 0.38), v3(0.1, 0.06, -0.02), 1000);
  if (t < 21.3) return pull;
  if (t < 22.3) return lerpCam(pull, lift, ss5(t, 21.3, 22.3));
  if (t < 23.7) return lerpCam(lift, carry, ss5(t, 22.3, 23.3));
  if (t < 24.55) return lerpCam(carry, cuA, ss5(t, 23.7, 24.6));
  // close on the strand and blade, starting up the strand ...
  if (t < MEDIUM.t0) return lerpCam(lerpCam(carry, cuA, ss5(t, 23.7, 24.6)), scale, 0.55 * ss(t, 24.55, MEDIUM.t0 + 0.3));
  // ... cut wide on "eighty": her, steadying the nozzle, the hair-thin strand and the blade below it (scale) ...
  if (t < MEDIUM.t1) return lerpCam(K(v3(0.36, 0.21, 0.66), v3(0.17, 0.17, -0.18), 1000), K(v3(0.33, 0.2, 0.58), v3(0.18, 0.165, -0.16), 1000), ss(t, MEDIUM.t0, MEDIUM.t1 + 0.4));
  // ... cut back in for the lowering into the tray
  if (t < 28.85) return lerpCam(K(v3(0.22, 0.12, 0.25), v3(0.22, 0.06, 0), 1000), lowerC, ss5(t, MEDIUM.t1, 28.95));
  if (t < 29.9) return lerpCam(lowerC, back, ss5(t, 28.85, 30.05));
  return lerpCam(lerpCam(lowerC, back, ss5(t, 28.85, 30.05)), fin, ss5(t, 29.9, LT.end + 0.25));
};
/** the last frame: behind and above the set-down nozzle, the fiber rising to the right across the dish to the blade
 *  in the tray, the cocoon beside the nozzle. The nozzle sits where her wrist device sits in frame 0 and points the same
 *  way, so the loop lands on the same diagonal. */
export const LOOP = {x: 616, y: 1040, az: -55, el: 45, d: 0.18}; // frame 0: the wrist device's screen position (Street.tsx)
let finCache: Cam | null = null;
export const finalCam = (): Cam => {
  if (finCache) return finCache;
  const N = v3(N_END.x, N_END.y, 0);
  const bl = bladeAt(LT.end);
  const A = v3(bl.a.x, bl.a.y, 0);
  const R = Math.PI / 180, {az, el, d} = LOOP;
  const pos = add3(N, v3(d * Math.cos(el * R) * Math.sin(az * R), d * Math.sin(el * R), d * Math.cos(el * R) * Math.cos(az * R)));
  const c = K(pos, add3(N, mul3(sub3(A, N), 0.45)), 1000);
  // a lens shift puts the nozzle exactly where the device is at frame 0
  const p = proj(basis(c), N);
  finCache = {...c, cx: c.cx + (LOOP.x - p.x), cy: c.cy + (LOOP.y - p.y)};
  return finCache;
};
export const labCam = camAt;

// ------------------------------------------------------------------ render
export const LabScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const b = basis(cam);
  // her card is anchored at her chest's true projection (scale from the chest's depth), so it agrees with the
  // true-perspective arms and stays where she really is even far off the lens axis; it is skipped only when it lies
  // wholly outside the frame (no pops) or the lens is right on top of her
  const her0 = herLab(t);
  const chestL = add3(her0.j.P, mul3(her0.j.u, BODY_P.spine * 0.45));
  const pc = proj(b, cardToWorld(HER_G, HER_H, chestL));
  const cd0 = cardOf(b, HER_G, HER_H);
  const kC = b.c.f / Math.max(0.8, pc.z) / U; // never drawn larger than at 0.8 m
  const ph = (cd0.phi * Math.PI) / 180;
  const cd = {x: pc.x - kC * (chestL.x * Math.cos(ph) + chestL.z * Math.sin(ph)), y: pc.y + kC * chestL.y, k: kC, phi: cd0.phi, depth: pc.z};
  const headS = {x: cd.x + kC * (her0.j.Hc.x * Math.cos(ph) + her0.j.Hc.z * Math.sin(ph)), y: cd.y - kC * her0.j.Hc.y};
  const reach = (BODY_P.R + 40) * kC, bodyR = (BODY_P.torsoW + 40) * kC;
  const inFrame = (headS.x + reach > 0 && headS.x - reach < 1080 && headS.y + reach > 0 && headS.y - reach < 1920) ||
    (pc.x + bodyR > 0 && pc.x - bodyR < 1080 && pc.y - bodyR < 1920 && pc.y + 3 * bodyR > 0);
  const showHer = herDrawn(t) && pc.z > 0.12 && inFrame;
  const her = her0;
  const w = wandAt(t);
  const fb = fiberAt(t);
  const bl = bladeAt(t);
  const bladeMid = (bl.a.x + bl.b.x) / 2;
  const inDish = inDishX(bladeMid) && Math.min(bl.a.y, bl.b.y) < DISH.wall + 0.004;
  const inTray = bladeMid > TRAY.x0 && bladeMid < TRAY.x1 && Math.min(bl.a.y, bl.b.y) < TRAY.h + 0.003;
  const showBlade = t >= LT.back || t < LT.macro;
  const bladeNode = showBlade ? <Blade b={b} t={t} /> : null;
  // her arms in true perspective
  // true screen positions, but the drawn size is capped as if never nearer than NEAR_K m: a limb right by the lens
  // stays a limb leaving the frame instead of a wall of sleeve
  const NEAR_K = 0.25;
  const kAt = (p: V3) => ({...proj(b, p), k: b.c.f / Math.max(NEAR_K, depthOf(b, p)) / U});
  // her arms in true perspective, cut where they pass a plane 25 cm in front of the lens: the part nearer than that
  // is not drawn (it would fill the frame), and the cut moves continuously, so an arm never pops in or out
  const NEAR = 0.25;
  const arm = (a: ReturnType<typeof herLab>['armR'], side: number) => {
    const dS = depthOf(b, a.S), dE = depthOf(b, a.E), dW = depthOf(b, a.W);
    if (dS < NEAR) return null;
    const cut = (p: V3, q: V3, dp: number, dq: number) => add3(p, mul3(sub3(q, p), (dp - NEAR) / (dp - dq)));
    const props = {look: PERSON_LAB, b: BODY_P, shape: a.shape, splay: a.splay, thumb: side > 0 ? -1 : 1};
    if (dE < NEAR) {
      const c = kAt(cut(a.S, a.E, dS, dE));
      return <ArmPersp {...props} S={kAt(a.S)} E={c} W={c} noHand one />;
    }
    if (dW < NEAR) return <ArmPersp {...props} S={kAt(a.S)} E={kAt(a.E)} W={kAt(cut(a.E, a.W, dE, dW))} noHand />;
    return <ArmPersp {...props} S={kAt(a.S)} E={kAt(a.E)} W={kAt(a.W)} />;
  };
  const coc = cocoonAt(t, her.armR.W);
  const cocoonHeld = coc.held;
  // items on the bench, far to near
  type It = {d: number; n: React.ReactNode};
  const items: It[] = [];
  const add = (p: V3, n: React.ReactNode) => items.push({d: depthOf(b, p), n});
  add(v3((PUMP.x0 + PUMP.x1) / 2, 0.04, (PUMP.z0 + PUMP.z1) / 2), <Pump key="pump" b={b} />);
  add(v3(STAND.x, 0.01, STAND.z), <StandNode key="stand" b={b} />);
  add(FRAME.c, <FrameMount key="frame" b={b} />);
  add(v3(COCOON_DISH.x, 0.005, COCOON_DISH.z), (
    <g key="cdish">
      {disc(b, v3(COCOON_DISH.x, 0.004, COCOON_DISH.z), COCOON_DISH.r, C.glass, 'cdd', {op: 0.55, sw: 0.7})}
      <Cocoon b={b} k="c1" p={v3(COCOON_DISH.x - 0.014, 0.011, COCOON_DISH.z - 0.012)} ang={1.2} />
      <Cocoon b={b} k="c2" p={v3(COCOON_DISH.x + 0.012, 0.011, COCOON_DISH.z - 0.016)} ang={-0.3} />
    </g>
  ));
  add(v3(DISH.x, 0.01, DISH.z), <Dish key="dish" b={b} t={t}>{inDish && bladeNode}</Dish>);
  add(v3((TRAY.x0 + TRAY.x1) / 2, 0.008, 0), <Tray key="tray" b={b}>{inTray && bladeNode}</Tray>);
  if (!cocoonHeld) add(coc.p, <Cocoon key="cp" b={b} k="cp" p={coc.p} ang={t < LT.grasp[1] ? 0.5 : 0.25} />);
  if (showBlade && !inDish && !inTray) add(v3(bladeMid, (bl.a.y + bl.b.y) / 2, 0.001), <g key="bl">{bladeNode}</g>);
  items.sort((a, c) => c.d - a.d);
  // grains of sand
  const grains = t >= LT.back ? grainsAt(t).map((g, i) => {
    const q = proj(b, g.p);
    return q.z > 0.01 ? <circle key={i} cx={q.x} cy={q.y} r={wpx(b, g.p, g.r * 2, 1.2)} fill={C.sandD} stroke={INK} strokeWidth={0.8} /> : null;
  }) : null;
  // the fiber: forming, landing (a small squash at contact), then stuck to the blade
  let fiber: React.ReactNode = null;
  if (fb && t >= LT.back) {
    const blob = fb.landed ? (() => {
      const q = proj(b, fb.head), r = wpx(b, fb.head, 0.0016, 3.5);
      const sq = 1 + 0.45 * settle(t, LT.contact, 5, 9);
      return <ellipse cx={q.x} cy={q.y} rx={r * sq} ry={r / sq} fill={C.silk} stroke={INK} strokeWidth={1.6} />;
    })() : null;
    fiber = <g><Fiber b={b} pts={fb.pts} head={fb.landed ? undefined : fb.head} headK={fb.landed ? 0 : 1.2 - 0.5 * ss(t, LT.back, LT.contact)} />{blob}</g>;
  }
  const hz = proj(b, add3(cam.pos, v3(Math.sin((cam.yaw * Math.PI) / 180) * 200, 0, Math.cos((cam.yaw * Math.PI) / 180) * 200)));
  void hz; void len3; void dot3; void norm3; void clamp; void LB; void A0;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={`labv${Math.round(t * 1000)}`} cx="0.5" cy="0.45" r="0.8"><stop offset="0.62" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#0B1A21" stopOpacity={0.28} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={C.wall} />
      <Planes b={b} air={AIR} polys={roomPolys()} />
      {showHer && <g><Crew4 id={`lab${Math.round(t * 1000)}`} look={PERSON_LAB} b={BODY_P} pose={her.pose} cd={cd} t={t} hideArmL hideArmR shadow={false} /></g>}
      <Bench b={b} />
      <Tubes b={b} t={t} />
      {items.map((i) => i.n)}
      {cocoonHeld && <Cocoon b={b} k="ch" p={coc.p} ang={0.5} />}
      <Wand b={b} t={t} />
      {herDrawn(t) && arm(her.armL, 1)}
      {herDrawn(t) && arm(her.armR, -1)}
      {fiber}
      {grains}
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#labv${Math.round(t * 1000)})`} />
    </svg>
  );
};
