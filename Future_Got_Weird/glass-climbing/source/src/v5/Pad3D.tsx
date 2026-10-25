// Glass Climbing V5: the climbing pad as ONE 3D assembly, drawn from any angle in the Crew's flat vector finish (flat
// faces with one key-light shade each, ink edges), so every close-up shows the same device:
//   - a rigid rectangular frame: a front plate carrying the tiles and a rim around a rear bay, closed by a rear cover
//     (which can be taken off: the cutaway);
//   - 24 adhesive tiles (4 x 6, 25 mm) on the front, the glass side;
//   - behind each tile, a tendon through the front plate to its own spring; the springs hang from one rail per row;
//     the rails hang from a central spine (the load spreader);
//   - the handle: two posts from the spine out through the cover to a grip bar;
//   - a clevis at the foot of the spine with the D-ring where the foot strap is tied on.
// Load path: the hand on the bar and the strap both pull the spine down; the spine pulls the rails; each rail stretches
// its row's springs; each spring pulls its tile along the glass (shear), so every tile carries a share. The tiles stay
// where they touch; the spine and rails travel (a few mm, drawn exaggerated).
// Pad-local axes (mm): u out of the glass toward the hand (the glass face is u = 0), v down, w across.
// Simplification (SOURCE_NOTES): the Stanford pad's tendons and springs sit inside its plate; here the bay is opened up
// so they can be seen, and the stretches are drawn larger than they are.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {fmt, lerp, P, V} from '../dc/math';
import {Hand, HandPose} from '../dc/Hand';
import {handUV} from '../world/rig';
import {HERO} from '../world/pose';

export const P3D = {TILE: 25, GAP: 3.4, RIM: 7, COLS: 4, ROWS: 6, T_TILE: 3, U_PLATE: 6, U_BACK: 24, POST: 72, BAR_R: 13.5, BAR_H: 62};
export const PW = P3D.COLS * P3D.TILE + (P3D.COLS - 1) * P3D.GAP + 2 * P3D.RIM;
export const PH = P3D.ROWS * P3D.TILE + (P3D.ROWS - 1) * P3D.GAP + 2 * P3D.RIM;
export const BAR_U = P3D.U_BACK + P3D.POST;
/** tile centre (v, w) for column c, row r */
export const tileVW = (c: number, r: number) => ({v: -PH / 2 + P3D.RIM + r * (P3D.TILE + P3D.GAP) + P3D.TILE / 2, w: -PW / 2 + P3D.RIM + c * (P3D.TILE + P3D.GAP) + P3D.TILE / 2});

export type Pad3DState = {
  yaw: number; // deg: 0 side-on (glass on the left), +90 from behind (the handle side), -90 through the glass
  pitch: number; // deg: looking down (+)
  load: number; // 0..1: the spine's travel (springs stretch together)
  /** per-tile contact 0..1 (dark where the tile touches) */
  contact: number[];
  /** per-tile spring stretch multiplier (1 = its even share); brick: the few touching tiles take it all */
  share?: number[];
  cover: number; // rear cover: 1 on, 0 off (cutaway)
  gap: number; // stand-off from the surface (mm)
  tilt: number; // deg: peel about the top edge of the face (+: bottom comes away)
  slide: number; // whole pad down (mm)
  surface: 'glass' | 'brick' | 'none';
  hand?: HandPose | null;
  /** the bay's oblique projection (screen = (u + kx w, v + ky w)) instead of a rotated view; yaw/pitch ignored */
  obl?: {kx: number; ky: number};
  /** false: leave the grip bar out (the hand-hold pass draws it between the fingers) */
  bar?: boolean;
  /** the tiles' ridges (rows of wedges) on their faces, seen close through the glass: opacity 0..1 */
  ridges?: number;
  /** extra drop of the spine (mm) beyond the springs (the brick failure: the pad tears away) */
  strap?: number; // strap length drawn (mm), 0 = none
};
export const allTiles = (x: number) => Array.from({length: P3D.COLS * P3D.ROWS}).map(() => x);

type P3 = {u: number; v: number; w: number};
const L_KEY = (() => {
  const l = {x: -0.55, y: -0.65, z: 0.52};
  const n = Math.hypot(l.x, l.y, l.z);
  return {x: l.x / n, y: l.y / n, z: l.z / n};
})();

/** the view: pad-local -> screen (x, y) and depth (toward the camera +) */
export const viewOf = (st: Pad3DState) => {
  const ps = (st.yaw * Math.PI) / 180, th = (st.pitch * Math.PI) / 180;
  const cp = Math.cos(ps), sp = Math.sin(ps), ct = Math.cos(th), sth = Math.sin(th);
  const ta = (st.tilt * Math.PI) / 180;
  // the pad's own rigid motion: peel about the face's top edge, stand-off, slide
  const rig = (p: P3): P3 => {
    const v0 = -PH / 2;
    const du = p.u, dv = p.v - v0;
    return {u: st.gap + du * Math.cos(ta) + dv * Math.sin(ta), v: st.slide + v0 - du * Math.sin(ta) + dv * Math.cos(ta), w: p.w};
  };
  const ob = st.obl;
  // oblique: the line of sight is (-kx, -ky, 1) in (u, v, w); depth is measured along it
  const on = ob ? Math.hypot(ob.kx, ob.ky, 1) : 1;
  const cam = (p: P3) => {
    if (ob) return {x: p.u + ob.kx * p.w, y: p.v + ob.ky * p.w, d: (-ob.kx * p.u - ob.ky * p.v + p.w) / on};
    const X = p.u * cp - p.w * sp;
    const D = p.u * sp + p.w * cp;
    return {x: X, y: p.v * ct + D * sth, d: D * ct - p.v * sth};
  };
  const world = (p: P3) => cam(rig(p)); // a pad part
  const fixed = (p: P3) => cam(p); // the surface (not moved with the pad)
  // a direction (for face normals), rigid-rotated with the pad
  const dir = (n: P3, moving = true) => {
    const a = moving ? {u: n.u * Math.cos(ta) + n.v * Math.sin(ta), v: -n.u * Math.sin(ta) + n.v * Math.cos(ta), w: n.w} : n;
    if (ob) return {x: a.u * 0.85 - a.w * 0.5, y: a.v, z: (-ob.kx * a.u - ob.ky * a.v + a.w) / on};
    const X = a.u * cp - a.w * sp;
    const D = a.u * sp + a.w * cp;
    return {x: X, y: a.v * ct + D * sth, z: D * ct - a.v * sth};
  };
  return {world, fixed, dir};
};

type Item = {d: number; g: number; node: React.ReactNode};
/** structural layers, from the glass outward (drawn in this order seen from behind, reversed seen through the glass) */
const G = {tiles: 0, plate: 1, rimFar: 2, inner: 3, rimNear: 4, cover: 5, handle: 6};

/** Lambert-ish flat shade for a face of base colour c with camera-space normal n */
const faceColor = (c: string, n: {x: number; y: number; z: number}) => {
  const k = n.x * L_KEY.x + n.y * L_KEY.y + n.z * L_KEY.z;
  return k >= 0 ? lit(c, 0.28 * k) : shade(c, -0.32 * k);
};

export const Pad3D: React.FC<{id: string; st: Pad3DState; z: number; k?: number}> = ({id, st, z, k = 1}) => {
  const vw = viewOf(st);
  const ink = (1.5 / Math.max(1e-6, z)) * 1.4 * k;
  const items: Item[] = [];
  let key = 0;
  let grp = 0;
  const travel = 2 + 12 * st.load;
  const poly = (pts: P3[], normal: P3, color: string, opts: {moving?: boolean; stroke?: number; opacity?: number; cull?: boolean} = {}) => {
    const moving = opts.moving ?? true;
    const n = vw.dir(normal, moving);
    if ((opts.cull ?? true) && n.z <= 1e-4) return;
    const sp = pts.map((p) => (moving ? vw.world(p) : vw.fixed(p)));
    const d = sp.reduce((s, p) => s + p.d, 0) / sp.length;
    items.push({
      d,
      g: grp,
      node: <path key={key++} d={`M${sp.map((p) => P(p)).join(' L')} Z`} fill={faceColor(color, n)} stroke={INK} strokeWidth={fmt(ink * (opts.stroke ?? 1))} strokeLinejoin="round" opacity={opts.opacity ?? 1} />,
    });
  };
  const box = (u0: number, u1: number, v0: number, v1: number, w0: number, w1: number, color: string, opts: {stroke?: number; opacity?: number; skip?: string[]} = {}) => {
    const f: [string, P3[], P3][] = [
      ['u0', [{u: u0, v: v0, w: w0}, {u: u0, v: v1, w: w0}, {u: u0, v: v1, w: w1}, {u: u0, v: v0, w: w1}], {u: -1, v: 0, w: 0}],
      ['u1', [{u: u1, v: v0, w: w0}, {u: u1, v: v0, w: w1}, {u: u1, v: v1, w: w1}, {u: u1, v: v1, w: w0}], {u: 1, v: 0, w: 0}],
      ['v0', [{u: u0, v: v0, w: w0}, {u: u0, v: v0, w: w1}, {u: u1, v: v0, w: w1}, {u: u1, v: v0, w: w0}], {u: 0, v: -1, w: 0}],
      ['v1', [{u: u0, v: v1, w: w0}, {u: u1, v: v1, w: w0}, {u: u1, v: v1, w: w1}, {u: u0, v: v1, w: w1}], {u: 0, v: 1, w: 0}],
      ['w0', [{u: u0, v: v0, w: w0}, {u: u1, v: v0, w: w0}, {u: u1, v: v1, w: w0}, {u: u0, v: v1, w: w0}], {u: 0, v: 0, w: -1}],
      ['w1', [{u: u0, v: v0, w: w1}, {u: u0, v: v1, w: w1}, {u: u1, v: v1, w: w1}, {u: u1, v: v0, w: w1}], {u: 0, v: 0, w: 1}],
    ];
    for (const [nm, pts, n] of f) if (!opts.skip?.includes(nm)) poly(pts, n, color, opts);
  };
  /** a round rod between two pad-local points, as a 2D capsule at its mean depth */
  const rod = (a: P3, b: P3, r: number, color: string, extra = 0) => {
    const A = vw.world(a), B = vw.world(b);
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * r, ny = (dx / L) * r;
    const path = `M${fmt(A.x + nx)},${fmt(A.y + ny)} L${fmt(B.x + nx)},${fmt(B.y + ny)} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(B.x - nx)},${fmt(B.y - ny)} L${fmt(A.x - nx)},${fmt(A.y - ny)} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(A.x + nx)},${fmt(A.y + ny)} Z`;
    items.push({
      d: (A.d + B.d) / 2 + extra,
      g: grp,
      node: (
        <g key={key++}>
          <path d={path} fill={color} stroke={INK} strokeWidth={fmt(ink)} />
          <path d={`M${fmt(A.x + nx * 0.45)},${fmt(A.y + ny * 0.45)} L${fmt(B.x + nx * 0.45)},${fmt(B.y + ny * 0.45)}`} stroke={lit(color, 0.55)} strokeWidth={fmt(r * 0.35)} strokeLinecap="round" opacity={0.6} />
        </g>
      ),
    });
    return {A, B};
  };

  const {TILE, GAP, RIM, COLS, ROWS, T_TILE, U_PLATE, U_BACK} = P3D;
  // ---- the tiles (front, on the surface)
  grp = G.tiles;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t = tileVW(c, r), i = r * COLS + c;
      const ct = st.contact[i] ?? 0;
      const col = mix('#D4E7EA', '#355862', 0.85 * ct);
      box(0, T_TILE, t.v - TILE / 2, t.v + TILE / 2, t.w - TILE / 2, t.w + TILE / 2, col, {stroke: 0.7});
      if ((st.ridges ?? 0) > 0.01 && vw.dir({u: -1, v: 0, w: 0}).z > 0) {
        // rows of wedges across the tile: a lit ridge and its shadow every RIDGE mm (drawn coarse: a schematic)
        const RIDGE = 2.2;
        for (let k = 0; k * RIDGE < TILE - 0.5; k++) {
          const v = t.v - TILE / 2 + (k + 0.5) * RIDGE;
          const a0 = vw.world({u: -0.05, v, w: t.w - TILE / 2 + 0.6}), a1 = vw.world({u: -0.05, v, w: t.w + TILE / 2 - 0.6});
          const b0 = vw.world({u: -0.05, v: v + RIDGE * 0.42, w: t.w - TILE / 2 + 0.6}), b1 = vw.world({u: -0.05, v: v + RIDGE * 0.42, w: t.w + TILE / 2 - 0.6});
          items.push({d: a0.d + 0.01, g: grp, node: (
            <g key={key++} opacity={st.ridges}>
              <path d={`M${P(a0)} L${P(a1)} L${P(b1)} L${P(b0)} Z`} fill="#1E3036" opacity={0.7} />
              <path d={`M${P(a0)} L${P(a1)}`} stroke="#F4FFFF" strokeWidth={fmt(ink * 1.4)} opacity={0.9} />
            </g>
          )});
        }
      }
    }
  // ---- the frame: front plate, rim (each rim wall is near or far: does its outer face look toward the camera?)
  grp = G.plate;
  box(T_TILE, U_PLATE, -PH / 2, PH / 2, -PW / 2, PW / 2, '#4F5D68');
  const RW = 6;
  const near = (n: P3) => vw.dir(n).z > 0;
  grp = near({u: 0, v: -1, w: 0}) ? G.rimNear : G.rimFar;
  box(U_PLATE, U_BACK, -PH / 2, -PH / 2 + RW, -PW / 2, PW / 2, '#8E9CA6');
  grp = near({u: 0, v: 1, w: 0}) ? G.rimNear : G.rimFar;
  box(U_PLATE, U_BACK, PH / 2 - RW, PH / 2, -PW / 2, PW / 2, '#8E9CA6');
  grp = near({u: 0, v: 0, w: -1}) ? G.rimNear : G.rimFar;
  box(U_PLATE, U_BACK, -PH / 2 + RW, PH / 2 - RW, -PW / 2, -PW / 2 + RW, '#8E9CA6');
  grp = near({u: 0, v: 0, w: 1}) ? G.rimNear : G.rimFar;
  box(U_PLATE, U_BACK, -PH / 2 + RW, PH / 2 - RW, PW / 2 - RW, PW / 2, '#8E9CA6');
  grp = near({u: 0, v: -1, w: 0}) ? G.rimNear : G.rimFar;
  // the orange edge stripe on the rim's top face (the crew's accent colour, as on the bay drawings)
  poly([{u: U_BACK - 6, v: -PH / 2 - 0.2, w: -PW / 2 + 8}, {u: U_BACK - 6, v: -PH / 2 - 0.2, w: PW / 2 - 8}, {u: U_BACK - 2, v: -PH / 2 - 0.2, w: PW / 2 - 8}, {u: U_BACK - 2, v: -PH / 2 - 0.2, w: -PW / 2 + 8}], {u: 0, v: -1, w: 0}, '#D8663B', {stroke: 0.3});
  grp = G.inner;
  // ---- inside the bay: rails, tendons, springs (springs hang from the rails; each pulls its tile's tendon)
  const REST = 13;
  for (let r = 0; r < ROWS; r++) {
    const t0 = tileVW(0, r);
    const railV = t0.v + TILE / 2 + GAP / 2 + 1 + travel;
    box(11, 15, railV + 1, railV + 3.6, -PW / 2 + RW + 1, PW / 2 - RW - 1, '#6A767E', {stroke: 0.6});
    for (let c = 0; c < COLS; c++) {
      const t = tileVW(c, r), i = r * COLS + c;
      const share = st.share ? st.share[i] : 1;
      const stretch = Math.max(0, travel - 2) * share;
      const top = railV - REST - stretch;
      const tab = t.v - 7;
      // tendon (tile tab -> spring top) through the front plate
      const A = vw.world({u: U_PLATE, v: tab, w: t.w}), B = vw.world({u: 13, v: top, w: t.w});
      items.push({d: (A.d + B.d) / 2 - 0.5, g: grp, node: <path key={key++} d={`M${P(A)} L${P(B)}`} stroke="#22282C" strokeWidth={fmt(1.6)} strokeLinecap="round" />});
      // the coil
      const n = 6, pts: V[] = [];
      let dsum = 0;
      for (let j = 0; j <= n * 2; j++) {
        const s = j / (n * 2);
        const q = vw.world({u: 13 + (j % 2 ? 3.8 : -3.8) * (j === 0 || j === n * 2 ? 0 : 1), v: lerp(top, railV, s), w: t.w});
        pts.push(q);
        dsum += q.d;
      }
      const dd = `M${pts.map((p) => P(p)).join(' L')}`;
      items.push({
        d: dsum / pts.length,
        g: grp,
        node: (
          <g key={key++}>
            <path d={dd} stroke="#20262A" strokeWidth={fmt(2.6)} fill="none" strokeLinejoin="round" />
            <path d={dd} stroke={share > 1.6 ? '#F2B9A0' : '#D3DBE0'} strokeWidth={fmt(1.2)} fill="none" strokeLinejoin="round" />
          </g>
        ),
      });
    }
  }
  // the spine (the load spreader the rails hang from) and its clevis
  box(14, 19, -PH / 2 + RW + 4 + travel, PH / 2 - RW - 2 + travel, -5, 5, '#59656D', {stroke: 0.8});
  box(13, 20, PH / 2 - RW - 2 + travel, PH / 2 + 8 + travel, -6, 6, '#7A8790', {stroke: 0.8});
  // ---- the rear cover (on, translucent, or off)
  grp = G.cover;
  if (st.cover > 0.01) {
    const op = st.cover;
    poly([{u: U_BACK, v: -PH / 2 + RW, w: -PW / 2 + RW}, {u: U_BACK, v: -PH / 2 + RW, w: PW / 2 - RW}, {u: U_BACK, v: PH / 2 - RW, w: PW / 2 - RW}, {u: U_BACK, v: PH / 2 - RW, w: -PW / 2 + RW}], {u: 1, v: 0, w: 0}, mix('#4F5D68', '#8C9BA6', 0.25), {opacity: op});
    // its 24 anchor caps (one over each tile's spring)
    const nb = vw.dir({u: 1, v: 0, w: 0});
    if (nb.z > 0)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const t = tileVW(c, r);
          const q = vw.world({u: U_BACK + 0.3, v: t.v, w: t.w});
          items.push({d: q.d + 0.2, g: grp, node: <ellipse key={key++} cx={fmt(q.x)} cy={fmt(q.y)} rx={fmt(3.2 * Math.max(0.15, Math.abs(nb.z)))} ry={fmt(3.2)} fill="#38434B" opacity={op} />});
        }
  }
  // ---- the handle: posts from the spine to the bar
  grp = G.handle;
  const posts = [-46, 46].map((v) => rod({u: 17, v: v + travel, w: 0}, {u: BAR_U, v: v + travel, w: 0}, 4.6, '#AEBBC5'));
  void posts;
  const barA = {u: BAR_U, v: -P3D.BAR_H + travel, w: 0}, barB = {u: BAR_U, v: P3D.BAR_H + travel, w: 0};
  const BA = vw.world(barA), BB = vw.world(barB);
  const barNode = (
    <g>
      {(() => {
        const r = P3D.BAR_R, dx = BB.x - BA.x, dy = BB.y - BA.y, L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * r, ny = (dx / L) * r;
        return (
          <>
            <path d={`M${fmt(BA.x + nx)},${fmt(BA.y + ny)} L${fmt(BB.x + nx)},${fmt(BB.y + ny)} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(BB.x - nx)},${fmt(BB.y - ny)} L${fmt(BA.x - nx)},${fmt(BA.y - ny)} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(BA.x + nx)},${fmt(BA.y + ny)} Z`} fill="#2C3338" stroke={INK} strokeWidth={fmt(ink)} />
            {[-0.35, -0.15, 0.05, 0.25].map((t, i) => {
              const c = {x: BA.x + dx * (0.5 + t), y: BA.y + dy * (0.5 + t)};
              return <path key={i} d={`M${fmt(c.x + nx * 0.8)},${fmt(c.y + ny * 0.8)} L${fmt(c.x - nx * 0.8)},${fmt(c.y - ny * 0.8)}`} stroke="#4A555D" strokeWidth={fmt(1.6)} />;
            })}
            <path d={`M${fmt(BA.x + nx * 0.5)},${fmt(BA.y + ny * 0.5)} L${fmt(BB.x + nx * 0.5)},${fmt(BB.y + ny * 0.5)}`} stroke="#6E7B84" strokeWidth={fmt(r * 0.3)} strokeLinecap="round" opacity={0.7} />
          </>
        );
      })()}
    </g>
  );
  if (st.hand) {
    // his hand closed round the bar (the grip point on the bar's middle), the forearm coming from his side
    const dx = BB.x - BA.x, dy = BB.y - BA.y;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 106;
    const HL = 112;
    const gu = handUV(st.hand, 'grip');
    const g: V = {x: (BA.x + BB.x) / 2, y: (BA.y + BB.y) / 2 + 6};
    const a = (ang * Math.PI) / 180, hd = {x: Math.cos(a), y: Math.sin(a)}, pp = {x: -hd.y, y: hd.x};
    const wrist = {x: g.x - hd.x * gu.u * HL - pp.x * gu.v * HL, y: g.y - hd.y * gu.u * HL - pp.y * gu.v * HL};
    const elbow = vw.world({u: BAR_U + 260, v: 180 + travel, w: 140});
    items.push({
      d: (BA.d + BB.d) / 2,
      g: grp,
      node: (
        <g key={key++}>
          <path d={`M${P(wrist)} L${P(elbow)}`} stroke={INK} strokeWidth={fmt(46 + 2 * ink)} strokeLinecap="round" />
          <path d={`M${P(wrist)} L${P(elbow)}`} stroke={HERO.skin} strokeWidth={fmt(46)} strokeLinecap="round" />
          <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={HL} thumbSide={1} view="back" pose={st.hand} color={HERO.skin} ink={2.4} bare hold={{front: [0, 1, 2, 3], obj: barNode}} />
        </g>
      ),
    });
  } else if (st.bar !== false) items.push({d: (BA.d + BB.d) / 2, g: grp, node: <g key={key++}>{barNode}</g>});
  // ---- the D-ring and the strap
  const ring = vw.world({u: 16.5, v: PH / 2 + 14 + travel, w: 0});
  items.push({d: ring.d + 0.5, g: grp, node: <ellipse key={key++} cx={fmt(ring.x)} cy={fmt(ring.y)} rx={fmt(6)} ry={fmt(8)} fill="none" stroke={INK} strokeWidth={fmt(4.4)} />});
  if ((st.strap ?? 0) > 0) {
    const end = vw.world({u: 30, v: PH / 2 + 14 + travel + (st.strap ?? 0), w: 8});
    items.push({
      d: ring.d - 0.5,
      g: grp,
      node: (
        <g key={key++}>
          <path d={`M${P(ring)} L${P(end)}`} stroke={INK} strokeWidth={fmt(17 + 2 * ink)} strokeLinecap="round" />
          <path d={`M${P(ring)} L${P(end)}`} stroke="#D8663B" strokeWidth={fmt(17)} />
          <path d={`M${P(ring)} L${P(end)}`} stroke="#F09A70" strokeWidth={fmt(3.5)} opacity={0.7} transform="translate(-4 0)" />
        </g>
      ),
    });
  }
  // seen from behind (the handle side) the layers stack from the glass outward; seen through the glass, the reverse
  const back = vw.dir({u: 1, v: 0, w: 0}).z >= 0;
  items.sort((a, b) => (a.g !== b.g ? (back ? a.g - b.g : b.g - a.g) : a.d - b.d));

  // ---- the surface (fixed): glass slab or brick, behind the pad seen from the handle side, in front seen through it
  const S = 2600;
  const fromBack = vw.dir({u: 1, v: 0, w: 0}, false).z > 0;
  const plane = (u: number) => [vw.fixed({u, v: -S, w: -S}), vw.fixed({u, v: -S, w: S}), vw.fixed({u, v: S, w: S}), vw.fixed({u, v: S, w: -S})];
  const face0 = plane(0);
  // the pane's thickness, cut at the pad's centre plane: what an edge-on view of the glass shows
  const slice = [vw.fixed({u: -14, v: -S, w: 0}), vw.fixed({u: 0, v: -S, w: 0}), vw.fixed({u: 0, v: S, w: 0}), vw.fixed({u: -14, v: S, w: 0})];
  const sideK = Math.max(0, 1 - Math.abs(vw.dir({u: 1, v: 0, w: 0}, false).z) / 0.35); // how edge-on the pane is
  const surfaceNode = (front: boolean) => {
    if (st.surface === 'none') return null;
    if (st.surface === 'glass') {
      return (
        <g opacity={front ? 0.3 : 0.5}>
          <path d={`M${face0.map((p) => P(p)).join(' L')} Z`} fill={front ? '#BFE6EA' : '#8FC0CB'} />
          {/* reflections across the pane: soft diagonal sheens (they belong to the pane) */}
          {[-900, -300, 500].map((w0, i) => {
            const a = vw.fixed({u: 0, v: -S, w: w0}), b = vw.fixed({u: 0, v: -S, w: w0 + 160}), c = vw.fixed({u: 0, v: S, w: w0 + 160 - 1400}), d = vw.fixed({u: 0, v: S, w: w0 - 1400});
            return <path key={i} d={`M${P(a)} L${P(b)} L${P(c)} L${P(d)} Z`} fill="#FFFFFF" opacity={front ? 0.25 : 0.14} />;
          })}
        </g>
      );
    }
    // brick: a rough red face with pits and crumbs
    const blots = Array.from({length: 140}).map((_, i) => {
      const v = -1300 + ((i * 337) % 2600), w = -1300 + ((i * 971) % 2600);
      const q = vw.fixed({u: 0, v, w});
      return <ellipse key={i} cx={fmt(q.x)} cy={fmt(q.y)} rx={fmt(4 + (i % 5) * 3)} ry={fmt(3 + (i % 4) * 2.5)} fill={i % 3 ? '#7F3B28' : '#C77A5C'} opacity={0.6} />;
    });
    return (
      <g opacity={front ? 0.5 : 1}>
        <path d={`M${face0.map((p) => P(p)).join(' L')} Z`} fill="#A4573E" />
        {blots}
      </g>
    );
  };
  return (
    <g>
      {st.surface === 'glass' && sideK > 0.01 && (
        <g opacity={sideK}>
          <path d={`M${slice.map((p) => P(p)).join(' L')} Z`} fill="#8FD0D3" stroke={INK} strokeWidth={fmt(ink)} />
          <path d={`M${P(slice[1])} L${P(slice[2])}`} stroke="#E8FCFC" strokeWidth={fmt(ink * 1.6)} />
        </g>
      )}
      {fromBack && surfaceNode(false)}
      {items.map((it) => it.node)}
      {!fromBack && surfaceNode(true)}
    </g>
  );
};
