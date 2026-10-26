// V4: the summit station, drawn in every V4 site view through v3/features3.ts SiteExtras (View3 draws it after the
// sky and summit, and again after the tower; it answers in one of the two layers, by depth against the tower), so the
// building appears consistently wherever a camera can see it.
//   A low two-storey observation building in the established style (flat fills, gradient-free shading from the storm
//   key, ink contours): a flat roof behind a parapet with a railing, a small roof hut and an instrument mast, a row of
//   small warm-lit windows (pale sodium, never the prepared air's orange) on each storey, and a door with a lamp.
//   Real proportions (storey 3.5 m, windows 1.5 m, door 1.1 x 2.3 m) give a human scale beside the 124 m tower.
//   It stands on the gentle rock slope between the laser terrace and the tower's platform (x -37.5..-30 m, 8 m from the
//   telescope, 30 m from the tower's axis), its long facade facing the terrace; the beam passes 20-40 m above its roof
//   and the bolt starts at the rod tip 140 m up, so it is never in the beam's path or the strike path. Its walls are
//   seated on the rock facets beneath them (Station4_ground): where the slope rises toward the tower, the lower storey
//   is set into it. A concrete pad (PAD4, drawn in the back layer) covers the terrace's flat ledge round the telescope, so
//   the telescope (Open4_laser PlacedLaser4, physically sized) visibly stands on a terrace you could walk on.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {Cam3, len3, projector, Proj, sub3, v3, V3} from '../v2/p3';
import {SiteExtra} from '../v3/features3';
import {lightAt, LOW_BOLT} from '../v3/Scene3_light';
import {groundY} from './Station4_ground';

const INK = '#0B151C';
/** the building (metres, site model): footprint, floor, storeys. It stands on the gentle rock slope between the laser
 *  terrace and the tower's platform, its long facade (west, x = x0) facing the telescope 8 m away; its back is set into
 *  the slope that rises toward the tower (the rock covers its lower storey there) */
export const ST4 = {x0: -37.5, x1: -30, z0: -6, z1: 7, floor: -18.4, storey: 3.5, n: 2, parapet: 0.9, rail: 1.05};
const ROOF = ST4.floor + ST4.storey * ST4.n; // the roof slab
const TOP = ROOF + ST4.parapet; // the parapet's top
export const STATION_C = v3((ST4.x0 + ST4.x1) / 2, (ST4.floor + TOP) / 2, (ST4.z0 + ST4.z1) / 2);
/** the roof hut (stair housing) and the instrument mast */
const HUT = {x0: -33.4, x1: -30.8, z0: 2.4, z1: 5.6, h: 2.6};
const MAST = {x: -31.0, z: -5.0, h: 5.2};

type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z` : '');
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');

/** a wall: from corner a to corner b (bottom, on the floor level) with its outward normal */
type Wall = {key: string; a: V3; b: V3; n: V3; L: number; base: number[]; win: {u: number; k: number; door?: boolean}[]};
const NB = 10; // samples of the rock along each wall's foot
const F = ST4.floor;
const SILL = 1.05;
const gAt = (x: number, z: number) => {
  const g = groundY(x, z);
  return Number.isFinite(g) ? g : F;
};
const mkWall = (key: string, a: V3, b: V3, n: V3, win: Wall['win']): Wall => {
  const L = len3(sub3(b, a));
  // the wall's foot follows the rock (where the slope rises above the floor, the wall shows only above it)
  const base = Array.from({length: NB + 1}, (_, i) => {
    const u = i / NB;
    return Math.min(gAt(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u), ROOF - 0.2);
  });
  // openings that would lie below the rock are left out (the lower storey is set into the slope at the back)
  const keep = win.filter((w) => {
    const k = w.u / L;
    const g = gAt(a.x + (b.x - a.x) * k, a.z + (b.z - a.z) * k);
    return w.door ? g < F + 0.3 : g < F + ST4.storey * w.k + SILL - 0.3;
  });
  return {key, a, b, n, L, base, win: keep};
};
const SW = v3(ST4.x0, F, ST4.z0), NW = v3(ST4.x0, F, ST4.z1), NE = v3(ST4.x1, F, ST4.z1), SE = v3(ST4.x1, F, ST4.z0);
const row = (us: number[], k: number) => us.map((u) => ({u, k}));
/** windows: u (m along the wall from a), storey k; the west facade has the door */
const WALLS: Wall[] = [
  // the west facade, facing the laser terrace (u runs from its north end toward the main views' side)
  mkWall('west', NW, SW, v3(-1, 0, 0), [...row([1.7, 4.1, 9.0, 11.3], 0), {u: 6.6, k: 0, door: true}, ...row([1.7, 4.1, 6.6, 9.0, 11.3], 1)]),
  // the south end, facing the main views (z < 0)
  mkWall('south', SW, SE, v3(0, 0, -1), [...row([1.8, 4.1], 0), ...row([1.8, 4.1, 6.3], 1)]),
  // the back (toward the tower, set into the slope) and the north end
  mkWall('east', SE, NE, v3(1, 0, 0), [...row([1.7, 4.1, 6.6, 9.0, 11.3], 1)]),
  mkWall('north', NE, NW, v3(0, 0, 1), [...row([1.8, 4.1, 6.3], 1)]),
];
const W_W = 1.5, W_H = 1.25, W_SILL = SILL; // window width, height, sill above the storey's floor
const D_W = 1.1, D_H = 2.3;
/** the storm key light's horizontal direction (as the tower's), so the station is shaded like everything else */
const KEY = {x: -0.75, z: -0.66};
const WARM = ['#FFE2A0', '#FFD585', '#F8C86E', '#FFDC92'];

const along = (w: Wall, u: number, y: number): V3 => {
  const k = u / w.L;
  return v3(w.a.x + (w.b.x - w.a.x) * k, y, w.a.z + (w.b.z - w.a.z) * k);
};
/** a rectangle on a wall (u0..u1 along it, y0..y1 up), lifted off the face by e metres */
const rectOn = (w: Wall, u0: number, u1: number, y0: number, y1: number, e = 0.02) => {
  const off = (p: V3) => v3(p.x + w.n.x * e, p.y, p.z + w.n.z * e);
  return [off(along(w, u0, y0)), off(along(w, u1, y0)), off(along(w, u1, y1)), off(along(w, u0, y1))];
};

/** the laser terrace's concrete pad round the telescope (on V3's flat ledge at -19.2 m): a lighter slab with joints */
export const PAD4 = {x0: -50.5, x1: -39.6, z0: -10, z1: 6, y: -19.15};
/** a world polygon clipped to the part in front of the camera (depth > zn), projected */
const clipNear = (cam: Cam3, pts: V3[], zn = 0.6): Proj[] => {
  const P = projector(cam);
  const pp = pts.map(P);
  const out: Proj[] = [];
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const a = pp[i], b = pp[j];
    if (a.z >= zn) out.push(a);
    if ((a.z - zn) * (b.z - zn) < 0) {
      const u = (zn - a.z) / (b.z - a.z);
      out.push(P(v3(pts[i].x + (pts[j].x - pts[i].x) * u, pts[i].y + (pts[j].y - pts[i].y) * u, pts[i].z + (pts[j].z - pts[i].z) * u)));
    }
  }
  return out;
};
const Pad4: React.FC<{cam: Cam3; flash: number; id: string}> = ({cam, flash, id}) => {
  if (cam.pos.y <= PAD4.y + 0.05) return null;
  const P = projector(cam);
  const c = clipNear(cam, [v3(PAD4.x0, PAD4.y, PAD4.z0), v3(PAD4.x1, PAD4.y, PAD4.z0), v3(PAD4.x1, PAD4.y, PAD4.z1), v3(PAD4.x0, PAD4.y, PAD4.z1)]);
  if (c.length < 3) return null;
  const xs = c.map((q) => q.x), ys = c.map((q) => q.y);
  if (Math.max(...xs) < -40 || Math.min(...xs) > 1120 || Math.max(...ys) < -40 || Math.min(...ys) > 1960) return null;
  const zc = P(v3((PAD4.x0 + PAD4.x1) / 2, PAD4.y, (PAD4.z0 + PAD4.z1) / 2)).z;
  const iw = clamp((cam.f * 0.05) / Math.max(zc, 1), 0.6, 2.6);
  const kB = clamp(flash * lightAt(v3(-45, -19, 0), LOW_BOLT, 72) * 1.4);
  const joints: string[] = [];
  const seg = (a: V3, b: V3) => {
    const q = clipNear(cam, [a, b]);
    if (q.length >= 2) joints.push(`M${fmt(q[0].x)},${fmt(q[0].y)} L${fmt(q[1].x)},${fmt(q[1].y)}`);
  };
  for (let x = PAD4.x0 + 3; x < PAD4.x1 - 0.5; x += 3) seg(v3(x, PAD4.y + 0.01, PAD4.z0), v3(x, PAD4.y + 0.01, PAD4.z1));
  for (let z = PAD4.z0 + 4; z < PAD4.z1 - 0.5; z += 4) seg(v3(PAD4.x0, PAD4.y + 0.01, z), v3(PAD4.x1, PAD4.y + 0.01, z));
  return (
    <g key={`${id}-pad`}>
      <path d={poly(c)} fill={mix('#4E5960', '#B4BCE4', kB * 0.6)} stroke={INK} strokeOpacity={0.7} strokeWidth={fmt(iw)} strokeLinejoin="round" />
      <path d={joints.join(' ')} stroke={INK} strokeOpacity={0.2} strokeWidth={fmt(iw * 0.6)} fill="none" />
    </g>
  );
};

export const Station4: SiteExtra = (props) => (
  <g>
    {props.layer === 'back' && <Pad4 cam={props.cam} flash={props.flash} id={props.id} />}
    <Building {...props} />
  </g>
);
const Building: SiteExtra = ({cam, flash, t, layer, id}) => {
  // which layer: in front of the tower when the camera is nearer the station than the tower's foot
  const dS = len3(sub3(STATION_C, cam.pos)), dT = len3(sub3(v3(0, 4, 0), cam.pos));
  if ((layer === 'front') !== dS < dT) return null;
  const P = projector(cam);
  // off screen (or behind the camera): nothing
  const box = [v3(ST4.x0, F - 2, ST4.z0), v3(ST4.x1, F - 2, ST4.z0), v3(ST4.x1, TOP + 6, ST4.z1), v3(ST4.x0, TOP + 6, ST4.z1), v3(ST4.x1, F - 2, ST4.z1), v3(ST4.x0, TOP + 6, ST4.z0)].map(P);
  if (box.every((q) => !q.ok)) return null;
  const okBox = box.filter((q) => q.ok);
  if (okBox.length === box.length) {
    const xs = okBox.map((q) => q.x), ys = okBox.map((q) => q.y);
    if (Math.max(...xs) < -40 || Math.min(...xs) > 1120 || Math.max(...ys) < -40 || Math.min(...ys) > 1960) return null;
  }
  const zc = P(STATION_C).z;
  if (zc < 2) return null;
  const iw = clamp((cam.f * 0.07) / zc, 0.7, 3.4);
  // the discharge's light (the station is far from it: a faint lift at most)
  const kB = clamp(flash * lightAt(STATION_C, LOW_BOLT, 72) * 1.4);
  const lit = (c: string, k = 1) => mix(c, '#E2E7FF', clamp(kB * k));
  const faceCol = (n: V3) => {
    const key = clamp(n.x * KEY.x + n.z * KEY.z);
    return lit(mix('#3E4A52', '#8F9BA3', 0.22 + 0.78 * key));
  };
  const vis = (w: Wall) => {
    const m = along(w, w.L / 2, F + 3);
    return (cam.pos.x - m.x) * w.n.x + (cam.pos.z - m.z) * w.n.z > 0;
  };
  const els: React.ReactNode[] = [];
  const glow: React.ReactNode[] = [];
  const camAbove = cam.pos.y > TOP + 0.05;
  // the roof hut: behind the parapet when seen from below the roof, so it is drawn first then
  const hutEls = () => {
    const out: React.ReactNode[] = [];
    const y0 = ROOF, y1 = ROOF + HUT.h;
    const fs: {k: string; q: V3[]; n: V3}[] = [
      {k: 'hf', q: [v3(HUT.x0, y0, HUT.z0), v3(HUT.x1, y0, HUT.z0), v3(HUT.x1, y1, HUT.z0), v3(HUT.x0, y1, HUT.z0)], n: v3(0, 0, -1)},
      {k: 'he', q: [v3(HUT.x1, y0, HUT.z0), v3(HUT.x1, y0, HUT.z1), v3(HUT.x1, y1, HUT.z1), v3(HUT.x1, y1, HUT.z0)], n: v3(1, 0, 0)},
      {k: 'hw', q: [v3(HUT.x0, y0, HUT.z1), v3(HUT.x0, y0, HUT.z0), v3(HUT.x0, y1, HUT.z0), v3(HUT.x0, y1, HUT.z1)], n: v3(-1, 0, 0)},
      {k: 'hb', q: [v3(HUT.x1, y0, HUT.z1), v3(HUT.x0, y0, HUT.z1), v3(HUT.x0, y1, HUT.z1), v3(HUT.x1, y1, HUT.z1)], n: v3(0, 0, 1)},
    ];
    for (const fc of fs) {
      const m = fc.q[0];
      if ((cam.pos.x - m.x) * fc.n.x + (cam.pos.z - m.z) * fc.n.z <= 0) continue;
      const pp = fc.q.map(P);
      if (pp.some((q) => !q.ok)) continue;
      out.push(<path key={`${id}-${fc.k}`} d={poly(pp)} fill={faceCol(fc.n)} stroke={INK} strokeWidth={fmt(iw * 0.8)} strokeLinejoin="round" />);
    }
    if (cam.pos.y > y1) {
      const pp = [v3(HUT.x0, y1, HUT.z0), v3(HUT.x1, y1, HUT.z0), v3(HUT.x1, y1, HUT.z1), v3(HUT.x0, y1, HUT.z1)].map(P);
      if (pp.every((q) => q.ok)) out.push(<path key={`${id}-ht`} d={poly(pp)} fill={lit('#7D8990')} stroke={INK} strokeWidth={fmt(iw * 0.8)} strokeLinejoin="round" />);
    }
    // its door (on the front, facing -z), unlit
    if (cam.pos.z < HUT.z0) {
      const dq = [v3(HUT.x0 + 0.9, y0, HUT.z0 - 0.02), v3(HUT.x0 + 1.9, y0, HUT.z0 - 0.02), v3(HUT.x0 + 1.9, y0 + 2.1, HUT.z0 - 0.02), v3(HUT.x0 + 0.9, y0 + 2.1, HUT.z0 - 0.02)].map(P);
      if (dq.every((q) => q.ok)) out.push(<path key={`${id}-hd`} d={poly(dq)} fill="#26323A" stroke={INK} strokeWidth={fmt(iw * 0.6)} />);
    }
    return out;
  };
  if (!camAbove) els.push(...hutEls());
  // the walls turned to the camera (a convex box: no overlaps among them)
  for (const w of WALLS) {
    if (!vis(w)) continue;
    const foot = w.base.map((y, i) => P(along(w, (w.L * i) / NB, y)));
    const top = [P(along(w, w.L, TOP)), P(along(w, 0, TOP))];
    if (foot.some((q) => !q.ok) || top.some((q) => !q.ok)) continue;
    const col = faceCol(w.n);
    els.push(<path key={`${id}-${w.key}`} d={poly([...foot, ...top])} fill={col} stroke={INK} strokeWidth={fmt(iw)} strokeLinejoin="round" />);
    // the plinth (a darker band at the foot), the storey line and the parapet's coping
    const plinth = [...foot, ...w.base.map((y, i) => P(along(w, (w.L * i) / NB, Math.max(y, F) + 0.45))).reverse()];
    els.push(<path key={`${id}-${w.key}-pl`} d={poly(plinth)} fill={mix(col, '#1A242B', 0.45)} />);
    const sl = [P(along(w, 0, F + ST4.storey)), P(along(w, w.L, F + ST4.storey))];
    els.push(<path key={`${id}-${w.key}-sl`} d={line(sl)} stroke={INK} strokeOpacity={0.45} strokeWidth={fmt(iw * 0.6)} fill="none" />);
    const cp = [P(along(w, 0, ROOF)), P(along(w, w.L, ROOF)), P(along(w, w.L, TOP)), P(along(w, 0, TOP))];
    els.push(<path key={`${id}-${w.key}-cp`} d={poly(cp)} fill={mix(col, '#DDE3E6', 0.25)} stroke={INK} strokeWidth={fmt(iw * 0.6)} strokeLinejoin="round" />);
    // windows (and the door)
    w.win.forEach((wn, i) => {
      const y0 = F + ST4.storey * wn.k;
      const hk = hash(i * 13 + w.key.length * 7, 1201);
      if (wn.door) {
        const q = rectOn(w, wn.u - D_W / 2, wn.u + D_W / 2, F, F + D_H).map(P);
        if (q.some((p) => !p.ok)) return;
        els.push(<path key={`${id}-${w.key}-d`} d={poly(q)} fill="#2B363E" stroke={INK} strokeWidth={fmt(iw * 0.8)} strokeLinejoin="round" />);
        // a lit glass panel in the door, a canopy and a lamp over it
        const g = rectOn(w, wn.u - 0.28, wn.u + 0.28, F + 1.2, F + 2.0, 0.03).map(P);
        els.push(<path key={`${id}-${w.key}-dg`} d={poly(g)} fill="#F6CC78" />);
        const cn = [P(along(w, wn.u - 0.95, F + 2.55)), P(along(w, wn.u + 0.95, F + 2.55))];
        const cn2 = cn.map((p, j) => P(v3(along(w, wn.u + (j ? 0.95 : -0.95), F + 2.55).x + w.n.x * 0.8, F + 2.55, along(w, wn.u + (j ? 0.95 : -0.95), F + 2.55).z + w.n.z * 0.8)));
        els.push(<path key={`${id}-${w.key}-cn`} d={poly([cn[0], cn[1], cn2[1], cn2[0]])} fill="#3A464E" stroke={INK} strokeWidth={fmt(iw * 0.7)} strokeLinejoin="round" />);
        const lamp = P(v3(along(w, wn.u, F + 2.4).x + w.n.x * 0.25, F + 2.4, along(w, wn.u, F + 2.4).z + w.n.z * 0.25));
        if (lamp.ok) {
          const r = clamp((cam.f * 0.12) / lamp.z, 1.2, 10);
          els.push(<circle key={`${id}-${w.key}-lp`} cx={fmt(lamp.x)} cy={fmt(lamp.y)} r={fmt(r)} fill="#FFE7AE" />);
          glow.push(<circle key={`${id}-${w.key}-lg`} cx={fmt(lamp.x)} cy={fmt(lamp.y)} r={fmt(r * 7)} fill={`url(#${id}-lg)`} />);
        }
        return;
      }
      const q = rectOn(w, wn.u - W_W / 2, wn.u + W_W / 2, y0 + W_SILL, y0 + W_SILL + W_H).map(P);
      if (q.some((p) => !p.ok)) return;
      const on = hk > 0.16; // most rooms are lit; a few are dark
      const warm = WARM[Math.floor(hash(i * 5 + w.key.length, 1203) * WARM.length)];
      els.push(<path key={`${id}-${w.key}-w${i}`} d={poly(q)} fill={on ? warm : '#24313A'} stroke={INK} strokeWidth={fmt(iw * 0.8)} strokeLinejoin="round" />);
      if (on) {
        // a blind or the room's back wall: the upper third a little deeper
        const bl = rectOn(w, wn.u - W_W / 2, wn.u + W_W / 2, y0 + W_SILL + W_H * (0.62 + 0.2 * hash(i, 1205)), y0 + W_SILL + W_H, 0.03).map(P);
        els.push(<path key={`${id}-${w.key}-b${i}`} d={poly(bl)} fill={mix(warm, '#C98E3E', 0.45)} />);
        glow.push(<path key={`${id}-${w.key}-g${i}`} d={poly(rectOn(w, wn.u - W_W * 0.85, wn.u + W_W * 0.85, y0 + W_SILL - 0.45, y0 + W_SILL + W_H + 0.45, 0.05).map(P))} fill="#FFD27A" opacity={0.13} />);
      } else {
        const rf = rectOn(w, wn.u - W_W / 2, wn.u - W_W * 0.1, y0 + W_SILL + W_H * 0.45, y0 + W_SILL + W_H, 0.03).map(P);
        els.push(<path key={`${id}-${w.key}-r${i}`} d={poly(rf)} fill="#5A6E80" opacity={0.35} />);
      }
      // the mullion and the sill
      const m0 = P(along(w, wn.u, y0 + W_SILL)), m1 = P(along(w, wn.u, y0 + W_SILL + W_H));
      els.push(<path key={`${id}-${w.key}-m${i}`} d={line([m0, m1])} stroke={INK} strokeWidth={fmt(iw * 0.7)} fill="none" />);
      const s = rectOn(w, wn.u - W_W / 2 - 0.12, wn.u + W_W / 2 + 0.12, y0 + W_SILL - 0.12, y0 + W_SILL, 0.06).map(P);
      els.push(<path key={`${id}-${w.key}-s${i}`} d={poly(s)} fill={mix(col, '#E6ECEF', 0.4)} stroke={INK} strokeWidth={fmt(iw * 0.5)} />);
    });
  }
  // the roof, seen from above: the parapet's top round a darker slab
  if (camAbove) {
    const outer = [v3(ST4.x0, TOP, ST4.z0), v3(ST4.x1, TOP, ST4.z0), v3(ST4.x1, TOP, ST4.z1), v3(ST4.x0, TOP, ST4.z1)].map(P);
    const e = 0.3;
    const inner = [v3(ST4.x0 + e, TOP, ST4.z0 + e), v3(ST4.x1 - e, TOP, ST4.z0 + e), v3(ST4.x1 - e, TOP, ST4.z1 - e), v3(ST4.x0 + e, TOP, ST4.z1 - e)].map(P);
    if (outer.every((q) => q.ok) && inner.every((q) => q.ok)) {
      els.push(<path key={`${id}-ro`} d={poly(outer)} fill={lit('#9AA5AC')} stroke={INK} strokeWidth={fmt(iw)} strokeLinejoin="round" />);
      els.push(<path key={`${id}-ri`} d={poly(inner)} fill={lit('#3E4A52')} stroke={INK} strokeOpacity={0.5} strokeWidth={fmt(iw * 0.5)} strokeLinejoin="round" />);
    }
    els.push(...hutEls());
  }
  // the railing on the parapet: posts every ~1.6 m and a top rail (see-through, thin)
  const rails: string[] = [];
  const posts: string[] = [];
  const rc = [v3(ST4.x0 + 0.15, TOP, ST4.z0 + 0.15), v3(ST4.x1 - 0.15, TOP, ST4.z0 + 0.15), v3(ST4.x1 - 0.15, TOP, ST4.z1 - 0.15), v3(ST4.x0 + 0.15, TOP, ST4.z1 - 0.15)];
  for (let s = 0; s < 4; s++) {
    const a = rc[s], b = rc[(s + 1) % 4];
    const L = len3(sub3(b, a));
    const n = Math.max(2, Math.round(L / 1.6));
    const top: Proj[] = [], mid: Proj[] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = v3(a.x + (b.x - a.x) * u, TOP, a.z + (b.z - a.z) * u);
      const p0 = P(p), p1 = P(v3(p.x, TOP + ST4.rail, p.z)), pm = P(v3(p.x, TOP + ST4.rail * 0.5, p.z));
      if (!p0.ok || !p1.ok) continue;
      if (i < n) posts.push(`M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`);
      top.push(p1);
      mid.push(pm);
    }
    if (top.length > 1) rails.push(line(top));
    if (mid.length > 1) rails.push(line(mid));
  }
  // the instrument mast on the roof's tower-side corner: a thin pole, a cross-arm with a cup anemometer and a vane
  const m0 = P(v3(MAST.x, ROOF, MAST.z)), m1 = P(v3(MAST.x, ROOF + MAST.h, MAST.z));
  const arm = [P(v3(MAST.x - 0.9, ROOF + MAST.h - 0.5, MAST.z)), P(v3(MAST.x + 0.9, ROOF + MAST.h - 0.5, MAST.z))];
  const spin = (2 * Math.PI * 48 * t) / 33.5; // ~9 rad/s, a whole number of turns per loop (seamless at 33.5 -> 0)
  const cups = [0, 1, 2].map((k) => P(v3(MAST.x + 0.9 + 0.35 * Math.cos(spin + k * 2.09), ROOF + MAST.h - 0.25, MAST.z + 0.35 * Math.sin(spin + k * 2.09))));
  const mastOk = m0.ok && m1.ok && arm.every((q) => q.ok);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-lg`}>
          <stop offset="0" stopColor="#FFE2A0" stopOpacity={0.5} />
          <stop offset="0.4" stopColor="#FFD27A" stopOpacity={0.14} />
          <stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
      <g style={{mixBlendMode: 'screen'}}>{glow}</g>
      <path d={posts.join(' ')} stroke={INK} strokeWidth={fmt(iw * 0.55)} fill="none" strokeLinecap="round" />
      <path d={rails.join(' ')} stroke={INK} strokeWidth={fmt(iw * 0.6)} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {mastOk && (
        <g stroke={INK} fill="none" strokeLinecap="round">
          <path d={line([m0, m1])} strokeWidth={fmt(iw * 0.9)} />
          <path d={line(arm)} strokeWidth={fmt(iw * 0.6)} />
          {cups.every((q) => q.ok) && cups.map((c, k) => <circle key={k} cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(clamp((cam.f * 0.09) / Math.max(c.z, 1), 0.6, 6))} fill="#8E9AA2" strokeWidth={fmt(iw * 0.4)} />)}
          <path d={line([arm[0], P(v3(MAST.x - 1.3, ROOF + MAST.h - 0.35, MAST.z + 0.2))])} strokeWidth={fmt(iw * 0.6)} />
        </g>
      )}
    </g>
  );
};
