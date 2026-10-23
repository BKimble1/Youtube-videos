// The one optics room, drawn through whatever camera the shot uses. Warm neutral walls, a far wall with the doorway
// (the bystander's destination; its jamb is a landmark in every wide view), a laser-area sign beside it, a light floor
// with seams, and the dark teal optics bench whose front-right corner is the second landmark. On the bench: the
// transmitter (a compact laser head with a scanning mirror behind its exit tube, on a post) and the playback unit
// with its waveform screen and TX light, which keeps blinking whenever the message is being sent.
import React from 'react';
import {lit, mix, shade} from './lib/color';
import {INK} from './lib/ink';
import {clamp} from './lib/math';
import {a3, Basis, c3, circle3, d3, fmt, m3, n3, polyD, proj, projPoly, quad, s3, V2, V3, v3} from './p3';
import {BENCH, BEAM_Y, DOOR, LEFT_X, RIGHT_X, ROOM_H, WALL_Z} from './world';

export const C = {
  wall: '#E7DCCB', wallSide: '#DCCDB8', wallLeft: '#E2D5C2', floor: '#CBBDAA', floorDeep: '#B9A994', seam: '#B3A38E',
  skirt: '#BFAE97', trim: '#8C7660', doorIn: '#A99C8B', doorFloor: '#B5A795',
  bench: '#1F4C55', benchTop: '#24606A', benchSide: '#173B43', leg: '#3A4048', legDeep: '#262A30',
  metal: '#B8BEC6', metalDeep: '#7C848F', housing: '#2E3640', housingTop: '#3C4652', unit: '#D9D6CE', unitDeep: '#A9A59B',
  amber: '#F2A93B', teal: '#2EC4B6', screen: '#12302F', coral: '#F07C5A',
};

type Face = {pts: V3[]; fill: string; stroke?: string; sw?: number; op?: number};
const faceD = (b: Basis, f: V3[]) => polyD(projPoly(b, f));
const facing = (b: Basis, pts: V3[]) => {
  const n = n3(c3(s3(pts[1], pts[0]), s3(pts[2], pts[0])));
  const c = pts.reduce((s, p) => a3(s, m3(p, 1 / pts.length)), v3(0, 0, 0));
  return d3(n, s3(b.pos, c)) > 0;
};
/** axis-aligned box: visible faces only (convex), with flat key-light shading */
export const boxFaces = (b: Basis, lo: V3, hi: V3, top: string, side: string, front: string): Face[] => {
  const [x0, y0, z0] = [lo.x, lo.y, lo.z], [x1, y1, z1] = [hi.x, hi.y, hi.z];
  const P = (x: number, y: number, z: number) => v3(x, y, z);
  const fs: Face[] = [
    {pts: [P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0)], fill: top}, // top (normal +y)
    {pts: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], fill: shade(side, 0.4)}, // bottom
    {pts: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], fill: front}, // +z
    {pts: [P(x1, y0, z0), P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0)], fill: shade(front, 0.2)}, // -z
    {pts: [P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1)], fill: side}, // +x
    {pts: [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], fill: shade(side, 0.15)}, // -x
  ];
  return fs.filter((f) => facing(b, f.pts));
};
const Faces: React.FC<{b: Basis; fs: Face[]; ink?: number}> = ({b, fs, ink = 1.2}) => (
  <>
    {fs.map((f, i) => {
      const d = faceD(b, f.pts);
      return d ? <path key={i} d={d} fill={f.fill} stroke={f.stroke ?? INK} strokeWidth={f.sw ?? ink} strokeLinejoin="round" opacity={f.op ?? 1} /> : null;
    })}
  </>
);
const cyl = (b: Basis, a: V3, c: V3, r: number, n = 20) => {
  // a cylinder's silhouette: hull of its two projected end circles
  const ax = n3(s3(c, a));
  const u = n3(Math.abs(ax.y) < 0.9 ? c3(ax, v3(0, 1, 0)) : c3(ax, v3(1, 0, 0)));
  const v = c3(ax, u);
  const pts = [...circle3(a, u, v, r, n), ...circle3(c, u, v, r, n)].map((p) => proj(b, p));
  // beside or behind the camera the projection is meaningless (it would fill the frame): draw nothing
  if (pts.some((p) => p.d < 0.05)) return {d: '', endA: '', endC: ''};
  const H = hull2(pts);
  return {d: polyD(H), endA: polyD(circle3(a, u, v, r, n).map((p) => proj(b, p))), endC: polyD(circle3(c, u, v, r, n).map((p) => proj(b, p)))};
};
const hull2 = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, c) => a.x - c.x || a.y - c.y);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, c: V2) => (a.x - o.x) * (c.y - o.y) - (a.y - o.y) * (c.x - o.x);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

// ---------------------------------------------------------------- walls, floor, doorway
export const Shell: React.FC<{b: Basis; id: string}> = ({b, id}) => {
  const Z1 = 7;
  const floor = quad(v3(LEFT_X, 0, WALL_Z), v3(RIGHT_X - LEFT_X, 0, 0), v3(0, 0, Z1 - WALL_Z));
  const seams: React.ReactNode[] = [];
  for (let x = Math.ceil(LEFT_X / 0.6) * 0.6; x < RIGHT_X; x += 0.6) {
    const p = projPoly(b, [v3(x - 0.004, 0.001, WALL_Z), v3(x + 0.004, 0.001, WALL_Z), v3(x + 0.004, 0.001, Z1), v3(x - 0.004, 0.001, Z1)]);
    seams.push(<path key={`sx${x.toFixed(2)}`} d={polyD(p)} fill={C.seam} opacity={0.5} />);
  }
  for (let z = WALL_Z + 0.6; z < Z1; z += 0.6) {
    const p = projPoly(b, [v3(LEFT_X, 0.001, z - 0.004), v3(RIGHT_X, 0.001, z - 0.004), v3(RIGHT_X, 0.001, z + 0.004), v3(LEFT_X, 0.001, z + 0.004)]);
    seams.push(<path key={`sz${z.toFixed(2)}`} d={polyD(p)} fill={C.seam} opacity={0.5} />);
  }
  // far wall around the doorway
  const wz = WALL_Z;
  const farParts = [
    quad(v3(LEFT_X, 0, wz), v3(DOOR.x0 - LEFT_X, 0, 0), v3(0, ROOM_H, 0)),
    quad(v3(DOOR.x1, 0, wz), v3(RIGHT_X - DOOR.x1, 0, 0), v3(0, ROOM_H, 0)),
    quad(v3(DOOR.x0, DOOR.h, wz), v3(DOOR.x1 - DOOR.x0, 0, 0), v3(0, ROOM_H - DOOR.h, 0)),
  ];
  const right = quad(v3(RIGHT_X, 0, Z1), v3(0, 0, wz - Z1), v3(0, ROOM_H, 0));
  const left = quad(v3(LEFT_X, 0, wz), v3(0, 0, Z1 - wz), v3(0, ROOM_H, 0));
  // doorway: the reveal (wall thickness), a dim corridor beyond, and the jamb trim
  const T = 0.14;
  const corr = [
    {pts: quad(v3(DOOR.x0, 0, wz - 1.6), v3(DOOR.x1 - DOOR.x0, 0, 0), v3(0, DOOR.h, 0)), fill: mix(C.doorIn, '#8E8274', 0.5)},
    {pts: quad(v3(DOOR.x0, 0, wz), v3(DOOR.x1 - DOOR.x0, 0, 0), v3(0, 0, -1.6)), fill: C.doorFloor},
    {pts: quad(v3(DOOR.x0, 0, wz), v3(0, 0, -1.6), v3(0, DOOR.h, 0)), fill: C.doorIn},
    {pts: quad(v3(DOOR.x1, 0, wz), v3(0, 0, -1.6), v3(0, DOOR.h, 0)), fill: shade(C.doorIn, 0.12)},
  ];
  const jamb = [
    quad(v3(DOOR.x0 - 0.07, 0, wz + 0.005), v3(0.07, 0, 0), v3(0, DOOR.h + 0.07, 0)),
    quad(v3(DOOR.x1, 0, wz + 0.005), v3(0.07, 0, 0), v3(0, DOOR.h + 0.07, 0)),
    quad(v3(DOOR.x0 - 0.07, DOOR.h, wz + 0.005), v3(DOOR.x1 - DOOR.x0 + 0.14, 0, 0), v3(0, 0.07, 0)),
  ];
  const reveal = [quad(v3(DOOR.x0, 0, wz), v3(0, 0, -T), v3(0, DOOR.h, 0)), quad(v3(DOOR.x1, 0, wz), v3(0, 0, -T), v3(0, DOOR.h, 0))];
  const skirt = (o: V3, u: V3) => quad(o, u, v3(0, 0.1, 0));
  // laser-area sign beside the door (a yellow triangle on a dark plate)
  const sc = v3(0.95, 1.75, wz + 0.006);
  const sp = projPoly(b, quad(a3(sc, v3(-0.13, -0.17, 0)), v3(0.26, 0, 0), v3(0, 0.34, 0)));
  const tri = projPoly(b, [a3(sc, v3(0, 0.12, 0)), a3(sc, v3(0.1, -0.06, 0)), a3(sc, v3(-0.1, -0.06, 0))]);
  const star = proj(b, a3(sc, v3(0, 0.0, 0)));
  // a whiteboard on the left of the far wall (above the bench's far end) with a faint sketch
  const wb = quad(v3(-1.35, 1.05, wz + 0.006), v3(1.15, 0, 0), v3(0, 0.75, 0));
  // soft ambient shading: darker toward the floor corners
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(C.wall, 0.25)} />
          <stop offset="1" stopColor={C.wall} />
        </linearGradient>
      </defs>
      <path d={faceD(b, floor)} fill={C.floor} />
      {seams}
      <path d={faceD(b, left)} fill={C.wallLeft} />
      <path d={faceD(b, right)} fill={C.wallSide} />
      {corr.map((f, i) => <path key={`co${i}`} d={faceD(b, f.pts)} fill={f.fill} />)}
      {reveal.map((r, i) => <path key={`rv${i}`} d={faceD(b, r)} fill={shade(C.wall, 0.12)} />)}
      {farParts.map((f, i) => <path key={`fw${i}`} d={faceD(b, f)} fill={C.wall} />)}
      <path d={faceD(b, skirt(v3(LEFT_X, 0, wz + 0.004), v3(DOOR.x0 - LEFT_X, 0, 0)))} fill={C.skirt} />
      <path d={faceD(b, skirt(v3(DOOR.x1, 0, wz + 0.004), v3(RIGHT_X - DOOR.x1, 0, 0)))} fill={C.skirt} />
      <path d={faceD(b, quad(v3(RIGHT_X - 0.004, 0, wz), v3(0, 0, Z1 - wz), v3(0, 0.1, 0)))} fill={shade(C.skirt, 0.08)} />
      {jamb.map((j, i) => <path key={`jb${i}`} d={faceD(b, j)} fill={C.trim} stroke={INK} strokeWidth={0.8} />)}
      <path d={faceD(b, wb)} fill="#F7F4EE" stroke={C.metalDeep} strokeWidth={1.2} />
      {(() => {
        // a faint sketch of a wave on the whiteboard
        const pts: V3[] = [];
        for (let i = 0; i <= 30; i++) pts.push(v3(-1.25 + (0.95 * i) / 30, 1.45 + 0.08 * Math.sin(i * 0.9) * Math.exp(-i / 22), wz + 0.008));
        const pp = pts.map((p) => proj(b, p));
        if (pp.some((p) => p.d < 0.05)) return null;
        return <path d={pp.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('')} fill="none" stroke="#7FA9C9" strokeWidth={Math.max(1, 0.008 * proj(b, pts[0]).k)} opacity={0.7} />;
      })()}
      <path d={polyD(sp)} fill="#2B2F36" />
      <path d={polyD(tri)} fill="#F4C430" stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
      {star.d > 0.05 && <circle cx={fmt(star.x)} cy={fmt(star.y)} r={Math.max(0.8, 0.012 * star.k)} fill={INK} />}
    </g>
  );
};

// ---------------------------------------------------------------- the bench and the transmitter
export type DevState = {section: number; mirror: number; tx: number; t: number};

/** the scanning mirror's pivot (world): the beam leaves the laser module along +z, turns 90 degrees here toward +x */
export const MIRROR = v3(-0.105, BEAM_Y, 0);
export const HOUSING = {x0: -0.2, x1: -0.04, y0: BEAM_Y - 0.075, y1: BEAM_Y + 0.075, z0: -0.2, z1: 0.07};

export const Bench: React.FC<{b: Basis; id: string; dev: DevState}> = ({b, id, dev}) => {
  const B = BENCH;
  const fs: {d: number; node: React.ReactNode}[] = [];
  const dep = (p: V3) => proj(b, p).d;
  const push = (p: V3, node: React.ReactNode) => fs.push({d: dep(p), node});
  // legs (four), a lower shelf
  const legs = [[B.x0 + 0.08, B.z0 + 0.08], [B.x1 - 0.08, B.z0 + 0.08], [B.x0 + 0.08, B.z1 - 0.08], [B.x1 - 0.08, B.z1 - 0.08]];
  legs.forEach(([x, z], i) => push(v3(x, 0.45, z), <Faces key={`leg${i}`} b={b} fs={boxFaces(b, v3(x - 0.035, 0, z - 0.035), v3(x + 0.035, B.y - 0.08, z + 0.035), C.leg, C.legDeep, C.leg)} />));
  push(v3((B.x0 + B.x1) / 2, 0.25, (B.z0 + B.z1) / 2), <Faces key="shelf" b={b} fs={boxFaces(b, v3(B.x0 + 0.05, 0.22, B.z0 + 0.05), v3(B.x1 - 0.05, 0.25, B.z1 - 0.05), C.legDeep, C.legDeep, C.leg)} />);
  // top slab
  const top = (
    <g key="top">
      <Faces b={b} fs={boxFaces(b, v3(B.x0, B.y - 0.08, B.z0), v3(B.x1, B.y, B.z1), C.benchTop, C.benchSide, C.bench)} />
      {(() => {
        // tapped-hole grid on the breadboard top
        const out: React.ReactNode[] = [];
        for (let x = B.x0 + 0.05; x < B.x1 - 0.02; x += 0.05) {
          for (let z = B.z0 + 0.05; z < B.z1 - 0.02; z += 0.05) {
            const p = proj(b, v3(x, B.y + 0.0005, z));
            if (p.d < 0.05) continue;
            const r = 0.0045 * p.k;
            if (r < 0.35) continue;
            out.push(<ellipse key={`${x.toFixed(2)}${z.toFixed(2)}`} cx={fmt(p.x)} cy={fmt(p.y)} rx={fmt(r)} ry={fmt(r * 0.55)} fill="#123238" opacity={0.75} />);
          }
        }
        return out;
      })()}
    </g>
  );
  push(v3((B.x0 + B.x1) / 2, B.y - 0.04, (B.z0 + B.z1) / 2 + 0.3), top);
  // the playback unit (left on the bench): a box with a waveform screen and the TX light
  const U = {x0: -0.92, x1: -0.5, y0: B.y, y1: B.y + 0.2, z0: -0.2, z1: 0.12};
  const unit = (
    <g key="unit">
      <Faces b={b} fs={boxFaces(b, v3(U.x0, U.y0, U.z0), v3(U.x1, U.y1, U.z1), lit(C.unit, 0.1), C.unitDeep, C.unit)} />
      {(() => {
        const zf = U.z1 + 0.002;
        const scr = projPoly(b, quad(v3(U.x0 + 0.03, U.y0 + 0.05, zf), v3(0.24, 0, 0), v3(0, 0.12, 0)));
        const wave: V2[] = [];
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const amp = dev.tx * 0.035 * (0.5 + 0.5 * Math.sin(u * 7 + dev.t * 6)) * Math.sin(u * 37 + dev.t * 23);
          wave.push(proj(b, v3(U.x0 + 0.04 + 0.22 * u, U.y0 + 0.11 + amp, zf + 0.001)));
        }
        const led = proj(b, v3(U.x0 + 0.33, U.y0 + 0.14, zf));
        const on = dev.tx * (0.55 + 0.45 * (Math.sin(dev.t * 9) > -0.3 ? 1 : 0));
        const knob = proj(b, v3(U.x0 + 0.33, U.y0 + 0.07, zf));
        return (
          <g>
            <path d={polyD(scr)} fill={C.screen} stroke={INK} strokeWidth={0.8} />
            <path d={wave.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('')} fill="none" stroke={C.teal} strokeWidth={Math.max(0.8, 0.005 * led.k)} />
            <circle cx={fmt(led.x)} cy={fmt(led.y)} r={fmt(Math.max(1, 0.012 * led.k))} fill={mix('#5A2A20', C.coral, on)} stroke={INK} strokeWidth={0.6} />
            {on > 0.5 && <circle cx={fmt(led.x)} cy={fmt(led.y)} r={fmt(Math.max(2, 0.03 * led.k))} fill={C.coral} opacity={0.25 * on} />}
            <circle cx={fmt(knob.x)} cy={fmt(knob.y)} r={fmt(Math.max(1, 0.018 * knob.k))} fill={C.metalDeep} stroke={INK} strokeWidth={0.6} />
          </g>
        );
      })()}
    </g>
  );
  if (dep(v3((U.x0 + U.x1) / 2, U.y1, U.z1)) > 0.12) push(v3((U.x0 + U.x1) / 2, U.y1, U.z1 + 0.05), unit);
  // cable from the unit to the laser head
  const cab: ReturnType<typeof proj>[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const p = v3(-0.5 + 0.36 * u, B.y + 0.01 + 0.02 * Math.sin(Math.PI * u), -0.12 + 0.02 * Math.sin(u * 5));
    cab.push(proj(b, p));
  }
  if (cab.every((p) => p.d > 0.05)) push(v3(-0.32, B.y, -0.12), <path key="cab" d={cab.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('')} fill="none" stroke="#1A1D22" strokeWidth={Math.max(1, 0.012 * proj(b, v3(-0.3, B.y, -0.1)).k)} strokeLinecap="round" />);
  // the transmitter: base plate, post, laser head housing (cut away by `section`), exit tube
  const Hs = HOUSING;
  const dev3 = (
    <g key="dev">
      <Faces b={b} fs={boxFaces(b, v3(-0.25, B.y, -0.22), v3(0.01, B.y + 0.02, 0.1), C.metal, C.metalDeep, C.metal)} />
      {(() => {
        const c = cyl(b, v3(-0.12, B.y + 0.02, -0.06), v3(-0.12, Hs.y0, -0.06), 0.025);
        return <path d={c.d} fill={C.metal} stroke={INK} strokeWidth={1} />;
      })()}
      <Transmitter b={b} id={`${id}-tx`} dev={dev} />
    </g>
  );
  if (dep(v3(-0.1, BEAM_Y, 0)) > 0.12) push(v3(-0.09, Hs.y0, 0.1), dev3);
  fs.sort((a, c) => c.d - a.d);
  return <g>{fs.map((f) => f.node)}</g>;
};

/** The laser head. section 0: closed housing; 1: its top and near side are cut away to show the laser module, the
 *  internal beam and the scanning mirror (drawn larger than life relative to the box would be in a real unit). */
export const Transmitter: React.FC<{b: Basis; id: string; dev: DevState}> = ({b, dev}) => {
  const Hs = HOUSING;
  const sec = clamp(dev.section);
  const lo = v3(Hs.x0, Hs.y0, Hs.z0), hi = v3(Hs.x1, Hs.y1, Hs.z1);
  const all = boxFaces(b, lo, hi, C.housingTop, C.housing, shade(C.housing, -0.1));
  // when cut: draw the inside (floor and far walls) first, then the remaining faces faded
  const inside = boxFaces(b, lo, hi, C.housingTop, C.housing, C.housing).length; void inside;
  const inner = [
    {pts: quad(v3(Hs.x0, Hs.y0 + 0.002, Hs.z0), v3(Hs.x1 - Hs.x0, 0, 0), v3(0, 0, Hs.z1 - Hs.z0)), fill: '#20262E'},
    {pts: quad(v3(Hs.x0, Hs.y0, Hs.z0 + 0.002), v3(Hs.x1 - Hs.x0, 0, 0), v3(0, Hs.y1 - Hs.y0, 0)), fill: '#29313B'},
    {pts: quad(v3(Hs.x0 + 0.002, Hs.y0, Hs.z0), v3(0, 0, Hs.z1 - Hs.z0), v3(0, Hs.y1 - Hs.y0, 0)), fill: '#252C35'},
  ];
  // laser module: a cylinder along +z ending before the mirror
  const mod = cyl(b, v3(MIRROR.x, BEAM_Y, Hs.z0 + 0.02), v3(MIRROR.x, BEAM_Y, MIRROR.z - 0.05), 0.022);
  // mirror: a small plate at 45 degrees about the vertical, tilting by dev.mirror about the horizontal x-ish axis
  const ang = Math.PI / 4;
  const nrm0 = n3(v3(Math.cos(ang), 0, -Math.sin(ang))); // facing between -z(incoming) and +x(outgoing)
  const tilt = dev.mirror;
  const up = v3(0, Math.cos(tilt), 0);
  const across = n3(c3(up, nrm0));
  const mh = 0.026, mw = 0.03;
  const tiltV = n3(a3(m3(v3(0, 1, 0), Math.cos(tilt)), m3(nrm0, Math.sin(tilt))));
  const mpts = [a3(a3(MIRROR, m3(across, mw)), m3(tiltV, mh)), a3(a3(MIRROR, m3(across, -mw)), m3(tiltV, mh)), a3(a3(MIRROR, m3(across, -mw)), m3(tiltV, -mh)), a3(a3(MIRROR, m3(across, mw)), m3(tiltV, -mh))];
  const mp = projPoly(b, mpts);
  // galvo motor body under the mirror
  const galvo = cyl(b, v3(MIRROR.x, Hs.y0 + 0.004, MIRROR.z), v3(MIRROR.x, BEAM_Y - mh - 0.004, MIRROR.z), 0.012);
  // internal beam (illustrative): module -> mirror -> exit
  const k = proj(b, MIRROR).k;
  const exit = cyl(b, v3(Hs.x1, BEAM_Y, 0), v3(0, BEAM_Y, 0), 0.02);
  const lens = proj(b, v3(0, BEAM_Y, 0));
  const ib1 = [proj(b, v3(MIRROR.x, BEAM_Y, MIRROR.z - 0.05)), proj(b, MIRROR)];
  const outDir = outgoing(dev.mirror);
  const ib2 = [proj(b, MIRROR), proj(b, a3(MIRROR, m3(outDir, 0.105)))];
  const cutOp = 1 - sec;
  return (
    <g>
      {sec > 0.01 && (
        <g opacity={sec}>
          {inner.map((f, i) => (facing(b, f.pts) || true) && <path key={i} d={faceD(b, f.pts)} fill={f.fill} />)}
          <path d={mod.d} fill="#5B6573" stroke={INK} strokeWidth={1} />
          <path d={mod.endA} fill="#48515D" />
          <path d={galvo.d} fill="#1A1E24" stroke={INK} strokeWidth={0.8} />
          <path d={polyD(mp)} fill="#DDEBF2" stroke={INK} strokeWidth={1.2} />
          <path d={polyD(mp)} fill="url(#mirrorSheen)" opacity={0.6} />
          <path d={`M${fmt(ib1[0].x)},${fmt(ib1[0].y)} L${fmt(ib1[1].x)},${fmt(ib1[1].y)}`} stroke={C.amber} strokeWidth={Math.max(1.2, 0.004 * k)} strokeDasharray={`${fmt(0.012 * k)} ${fmt(0.008 * k)}`} />
          <path d={`M${fmt(ib2[0].x)},${fmt(ib2[0].y)} L${fmt(ib2[1].x)},${fmt(ib2[1].y)}`} stroke={C.amber} strokeWidth={Math.max(1.2, 0.004 * k)} strokeDasharray={`${fmt(0.012 * k)} ${fmt(0.008 * k)}`} />
          <defs>
            <linearGradient id="mirrorSheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0} />
              <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.9} />
              <stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
        </g>
      )}
      {/* the housing: faces that would hide the inside fade with the section; the rest stays */}
      {all.map((f, i) => {
        const n = n3(c3(s3(f.pts[1], f.pts[0]), s3(f.pts[2], f.pts[0])));
        const cutFace = n.y > 0.5 || n.z > 0.5; // top and near side are the cut faces
        const op = cutFace ? cutOp : 1;
        const d = faceD(b, f.pts);
        return d && op > 0.01 ? <path key={`h${i}`} d={d} fill={f.fill} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" opacity={op} /> : null;
      })}
      {sec > 0.01 && (
        // the section's cut edges
        <path d={faceD(b, quad(v3(Hs.x0, Hs.y1, Hs.z1), v3(Hs.x1 - Hs.x0, 0, 0), v3(0, 0, Hs.z0 - Hs.z1)))} fill="none" stroke={C.amber} strokeOpacity={0.0} />
      )}
      <path d={exit.d} fill={C.metalDeep} stroke={INK} strokeWidth={1} />
      <path d={exit.endC} fill="#1B2A33" stroke={INK} strokeWidth={0.8} />
      <circle cx={fmt(lens.x)} cy={fmt(lens.y)} r={fmt(Math.max(0.6, 0.008 * lens.k))} fill="#6FA5B8" opacity={0.7} />
      {(() => {
        // a small status light on the housing's near face (on while transmitting)
        const p = proj(b, v3(Hs.x0 + 0.03, Hs.y1 - 0.02, Hs.z1 + 0.001));
        return <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(Math.max(0.8, 0.006 * p.k))} fill={dev.tx > 0.5 ? '#7CF0C8' : '#2C4A44'} />;
      })()}
    </g>
  );
};

/** outgoing beam direction for a mirror tilt (rad): rotating the mirror by a tilts the reflected beam by 2a (up/down) */
export const outgoing = (tilt: number): V3 => n3(v3(Math.cos(2 * tilt), Math.sin(2 * tilt), 0));
