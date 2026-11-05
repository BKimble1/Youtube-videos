// The lab: one room in the same 3D world as the cast, so every camera move has true parallax. Planes are clipped at
// the camera's near plane before projection. Flat vector finish: a deep slate room, a long window band, a pegboard
// and shelves, warm pendant lamps; props (workbench, paper cup, the operator's table) are simple shaded boxes in the
// crew's ink.
import React from 'react';
import {Deco, Inked, InkPath} from '../dc/ink';
import {lit, mix, shade} from '../dc/color';
import {fmt, P} from '../dc/math';
import {Capsule, SoftShadow} from '../dc/shade';
import {a3, d3, Item, k3, n3, Proj, s3, V3, v3} from './m3';

const NEAR = 6;
/** Project a planar polygon, clipped at the near plane. Returns screen points (may be empty). */
export const projPoly = (Pj: Proj, pts: V3[]) => {
  const cam = pts.map((q) => {
    const d = s3(q, Pj.eye);
    return {q, z: d3(d, Pj.fwd)};
  });
  const out: V3[] = [];
  for (let i = 0; i < cam.length; i++) {
    const A = cam[i], B = cam[(i + 1) % cam.length];
    const ain = A.z >= NEAR, bin = B.z >= NEAR;
    if (ain) out.push(A.q);
    if (ain !== bin) {
      const t = (NEAR - A.z) / (B.z - A.z);
      out.push(a3(A.q, k3(s3(B.q, A.q), t)));
    }
  }
  return out.map((q) => Pj.p(q));
};
const polyD = (pts: {x: number; y: number}[]) => (pts.length < 3 ? '' : `M${pts.map(P).join(' L')} Z`);

export const ENV = {
  wall: '#24414F',
  wallLow: '#1E3743',
  floor: '#2D4A55',
  floorFar: '#264350',
  trim: '#173040',
  window: '#9FD6E6',
  windowDeep: '#5FA9C2',
  board: '#C99F6B',
  shelf: '#3B5B68',
  lamp: '#FFD27A',
  bench: '#E7E1D3',
  benchSide: '#B9AF9C',
  table: '#D8CDB8',
};

type Rect = {key: string; pts: V3[]; fill: string; opacity?: number; ink?: boolean};

/** Room planes and wall dressing (always behind the cast: drawn first, unsorted). */
export const Room: React.FC<{Pj: Proj}> = ({Pj}) => {
  const W = 420, D0 = -300, D1 = 420, H = 330;
  const rects: Rect[] = [];
  // floor
  rects.push({key: 'floor', pts: [v3(-W, 0, D0), v3(W, 0, D0), v3(W, 0, D1), v3(-W, 0, D1)], fill: ENV.floor});
  // back wall and its lower panel
  rects.push({key: 'back', pts: [v3(-W, 0, D0), v3(W, 0, D0), v3(W, H, D0), v3(-W, H, D0)], fill: ENV.wall});
  rects.push({key: 'backLow', pts: [v3(-W, 0, D0 + 0.5), v3(W, 0, D0 + 0.5), v3(W, 92, D0 + 0.5), v3(-W, 92, D0 + 0.5)], fill: ENV.wallLow});
  // side walls
  rects.push({key: 'left', pts: [v3(-W, 0, D0), v3(-W, 0, D1), v3(-W, H, D1), v3(-W, H, D0)], fill: shade(ENV.wall, 0.12)});
  rects.push({key: 'right', pts: [v3(W, 0, D1), v3(W, 0, D0), v3(W, H, D0), v3(W, H, D1)], fill: lit(ENV.wall, 0.05)});
  rects.push({key: 'leftLow', pts: [v3(-W + 0.5, 0, D0), v3(-W + 0.5, 0, D1), v3(-W + 0.5, 92, D1), v3(-W + 0.5, 92, D0)], fill: shade(ENV.wallLow, 0.1)});
  rects.push({key: 'rightLow', pts: [v3(W - 0.5, 0, D1), v3(W - 0.5, 0, D0), v3(W - 0.5, 92, D0), v3(W - 0.5, 92, D1)], fill: ENV.wallLow});
  rects.push({key: 'front', pts: [v3(W, 0, D1), v3(-W, 0, D1), v3(-W, H, D1), v3(W, H, D1)], fill: shade(ENV.wall, 0.06)});
  rects.push({key: 'frontLow', pts: [v3(W, 0, D1 - 0.5), v3(-W, 0, D1 - 0.5), v3(-W, 92, D1 - 0.5), v3(W, 92, D1 - 0.5)], fill: ENV.wallLow});
  // long window band on the back wall
  rects.push({key: 'win', pts: [v3(-260, 150, D0 + 1), v3(120, 150, D0 + 1), v3(120, 250, D0 + 1), v3(-260, 250, D0 + 1)], fill: ENV.windowDeep, ink: true});
  // pegboard on the right wall
  rects.push({key: 'peg', pts: [v3(W - 1, 110, -180), v3(W - 1, 110, -40), v3(W - 1, 210, -40), v3(W - 1, 210, -180)], fill: ENV.board, ink: true});
  // shelves on the left wall
  rects.push({key: 'shelfA', pts: [v3(-W + 1, 168, -200), v3(-W + 1, 168, -20), v3(-W + 1, 174, -20), v3(-W + 1, 174, -200)], fill: ENV.shelf, ink: true});
  rects.push({key: 'shelfB', pts: [v3(-W + 1, 128, -200), v3(-W + 1, 128, -20), v3(-W + 1, 134, -20), v3(-W + 1, 134, -200)], fill: ENV.shelf, ink: true});
  const kRef = Pj.k(300);
  return (
    <g>
      {rects.map((r) => {
        const d = polyD(projPoly(Pj, r.pts));
        if (!d) return null;
        return r.ink ? (
          <Inked key={r.key} w={0.5 * kRef}>
            <InkPath d={d} fill={r.fill} />
          </Inked>
        ) : (
          <path key={r.key} d={d} fill={r.fill} opacity={r.opacity} />
        );
      })}
      {/* window: sky gradient, mullions, a distant skyline */}
      {(() => {
        const q = projPoly(Pj, [v3(-258, 152, D0 + 1.5), v3(118, 152, D0 + 1.5), v3(118, 248, D0 + 1.5), v3(-258, 248, D0 + 1.5)]);
        if (q.length < 3) return null;
        const top = Pj.p(v3(0, 248, D0)), bot = Pj.p(v3(0, 152, D0));
        const sky = polyD(projPoly(Pj, [v3(-258, 152, D0 + 1.6), v3(118, 152, D0 + 1.6), v3(118, 248, D0 + 1.6), v3(-258, 248, D0 + 1.6)]));
        const city = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const x0 = -258 + i * 31.3, hgt = 14 + ((i * 37) % 23);
          return polyD(projPoly(Pj, [v3(x0, 152, D0 + 1.7), v3(x0 + 26, 152, D0 + 1.7), v3(x0 + 26, 152 + hgt, D0 + 1.7), v3(x0, 152 + hgt, D0 + 1.7)]));
        });
        return (
          <g>
            <defs>
              <linearGradient id="skyg" gradientUnits="userSpaceOnUse" x1={fmt(top.x)} y1={fmt(top.y)} x2={fmt(bot.x)} y2={fmt(bot.y)}>
                <stop offset="0" stopColor="#7FC4DA" />
                <stop offset="1" stopColor="#CDEBF1" />
              </linearGradient>
            </defs>
            <path d={sky} fill="url(#skyg)" />
            {city.map((d, i) => (
              <path key={i} d={d} fill="#8DB9C8" opacity={0.75} />
            ))}
            {[-164, -70, 24].map((x) => {
              const d = polyD(projPoly(Pj, [v3(x - 2, 152, D0 + 1.8), v3(x + 2, 152, D0 + 1.8), v3(x + 2, 248, D0 + 1.8), v3(x - 2, 248, D0 + 1.8)]));
              return <path key={x} d={d} fill={ENV.trim} />;
            })}
          </g>
        );
      })()}
      {/* pegboard holes and a few hanging tools */}
      {(() => {
        const els: React.ReactNode[] = [];
        for (let i = 0; i < 7; i++)
          for (let j = 0; j < 5; j++) {
            const p = Pj.p(v3(W - 1.5, 120 + j * 20, -170 + i * 20));
            if (p.z < NEAR) continue;
            els.push(<circle key={`${i}-${j}`} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(0.9 * Pj.k(p.z))} fill={shade(ENV.board, 0.5)} />);
          }
        return <g>{els}</g>;
      })()}
      {/* pendant lamps */}
      {[-150, 40, 220].map((x) => {
        const top = Pj.p(v3(x, H, -120));
        const sh = Pj.p(v3(x, 262, -120));
        if (sh.z < NEAR) return null;
        const k = Pj.k(sh.z);
        return (
          <g key={x}>
            <line x1={fmt(top.x)} y1={fmt(top.y)} x2={fmt(sh.x)} y2={fmt(sh.y)} stroke={ENV.trim} strokeWidth={fmt(0.5 * k)} />
            <path d={`M${fmt(sh.x - 9 * k)},${fmt(sh.y + 6 * k)} Q${fmt(sh.x)},${fmt(sh.y - 6 * k)} ${fmt(sh.x + 9 * k)},${fmt(sh.y + 6 * k)} Z`} fill="#2B3C46" />
            <ellipse cx={fmt(sh.x)} cy={fmt(sh.y + 6 * k)} rx={fmt(8 * k)} ry={fmt(1.8 * k)} fill={ENV.lamp} />
          </g>
        );
      })}
      {/* floor seams for perspective */}
      {[-200, -100, 0, 100, 200].map((z) => {
        const d = projPoly(Pj, [v3(-W, 0.1, z - 0.6), v3(W, 0.1, z - 0.6), v3(W, 0.1, z + 0.6), v3(-W, 0.1, z + 0.6)]);
        return <path key={z} d={polyD(d)} fill={shade(ENV.floor, 0.2)} opacity={0.5} />;
      })}
      {/* a soft warm pool of light on the floor behind the cast */}
      {(() => {
        const c = Pj.p(v3(0, 0, -40));
        if (c.z < NEAR) return null;
        const k = Pj.k(c.z);
        return <SoftShadow id="pool" c={{x: c.x, y: c.y}} rx={210 * k} ry={60 * k} alpha={0.16} color="#FFE2A6" core={0.1} />;
      })()}
    </g>
  );
};

/** A box (bench, table, stand) as depth-sorted item; faces shaded by orientation. */
export const boxItem = (Pj: Proj, key: string, c: V3, half: V3, col: {top: string; side: string; front: string}, ink = 0.55, zBias = 0): Item => {
  const C = (sx: number, sy: number, sz: number) => v3(c.x + sx * half.x, c.y + sy * half.y, c.z + sz * half.z);
  const faces = [
    {n: v3(0, 1, 0), pts: [C(-1, 1, -1), C(1, 1, -1), C(1, 1, 1), C(-1, 1, 1)], col: col.top},
    {n: v3(0, 0, 1), pts: [C(-1, -1, 1), C(1, -1, 1), C(1, 1, 1), C(-1, 1, 1)], col: col.front},
    {n: v3(1, 0, 0), pts: [C(1, -1, 1), C(1, -1, -1), C(1, 1, -1), C(1, 1, 1)], col: col.side},
    {n: v3(-1, 0, 0), pts: [C(-1, -1, -1), C(-1, -1, 1), C(-1, 1, 1), C(-1, 1, -1)], col: shade(col.side, 0.12)},
    {n: v3(0, 0, -1), pts: [C(1, -1, -1), C(-1, -1, -1), C(-1, 1, -1), C(1, 1, -1)], col: shade(col.front, 0.15)},
  ];
  const vis = faces.filter((f) => d3(f.n, s3(Pj.eye, f.pts[0])) > 0);
  const zc = Pj.p(c).z;
  const k = Pj.k(Math.max(NEAR, zc));
  return {
    z: zc + zBias,
    key,
    el: (
      <Inked w={ink * k}>
        {vis.map((f, i) => {
          const d = polyD(projPoly(Pj, f.pts));
          return d ? <InkPath key={i} d={d} fill={f.col} /> : null;
        })}
      </Inked>
    ),
  };
};

/** The paper cup: a tapered cylinder with a teal sleeve. `c` = centre of its base. Optional `tilt` axis/angle not
 *  needed: the cup stays upright in the grip. */
export const cupItem = (Pj: Proj, key: string, c: V3, zBias = 0): Item => {
  const h = 11, r0 = 3.0, r1 = 4.1;
  const B = Pj.p(c), T = Pj.p(a3(c, v3(0, h, 0)));
  const k = Pj.k(B.z);
  const view = n3(s3(c, Pj.eye));
  const tiltRy = Math.abs(view.y) * 1.0;
  const rB = r0 * k, rT = r1 * Pj.k(T.z);
  const ryB = rB * tiltRy, ryT = rT * tiltRy;
  const body = `M${fmt(B.x - rB)},${fmt(B.y)} L${fmt(T.x - rT)},${fmt(T.y)} A${fmt(rT)} ${fmt(ryT)} 0 0 0 ${fmt(T.x + rT)},${fmt(T.y)} L${fmt(B.x + rB)},${fmt(B.y)} A${fmt(rB)} ${fmt(Math.max(0.1, ryB))} 0 0 1 ${fmt(B.x - rB)},${fmt(B.y)} Z`;
  const m0 = Pj.p(a3(c, v3(0, 3.2, 0))), m1 = Pj.p(a3(c, v3(0, 7.4, 0)));
  const rm0 = (r0 + (r1 - r0) * 0.29) * k * 1.02, rm1 = (r0 + (r1 - r0) * 0.67) * k * 1.02;
  const sleeve = `M${fmt(m0.x - rm0)},${fmt(m0.y)} L${fmt(m1.x - rm1)},${fmt(m1.y)} A${fmt(rm1)} ${fmt(rm1 * tiltRy)} 0 0 0 ${fmt(m1.x + rm1)},${fmt(m1.y)} L${fmt(m0.x + rm0)},${fmt(m0.y)} A${fmt(rm0)} ${fmt(Math.max(0.1, rm0 * tiltRy))} 0 0 1 ${fmt(m0.x - rm0)},${fmt(m0.y)} Z`;
  return {
    z: B.z + zBias,
    key,
    el: (
      <g>
        <Inked w={0.45 * k}>
          <InkPath d={body} fill="#FBFAF6" />
        </Inked>
        <Deco>
          <path d={sleeve} fill="#1CA7A0" />
          <path d={`M${fmt(B.x + rB * 0.5)},${fmt(B.y)} L${fmt(T.x + rT * 0.5)},${fmt(T.y)}`} stroke="#000" strokeOpacity={0.08} strokeWidth={fmt(rB * 0.8)} />
          <path d={`M${fmt(B.x - rB * 0.55)},${fmt(B.y)} L${fmt(T.x - rT * 0.55)},${fmt(T.y)}`} stroke="#FFF" strokeOpacity={0.7} strokeWidth={fmt(rB * 0.25)} strokeLinecap="round" />
          {view.y < 0 && <ellipse cx={fmt(T.x)} cy={fmt(T.y)} rx={fmt(rT * 0.86)} ry={fmt(ryT * 0.86)} fill="#6B4A36" />}
          <ellipse cx={fmt(T.x)} cy={fmt(T.y)} rx={fmt(rT)} ry={fmt(Math.max(0.1, ryT))} fill="none" stroke="#E9E4D8" strokeWidth={fmt(0.7 * k)} />
        </Deco>
      </g>
    ),
  };
};

export const lineItem = (Pj: Proj, key: string, a: V3, b: V3, r: number, color: string, zBias = 0): Item => {
  const A = Pj.p(a), B = Pj.p(b);
  const k = Pj.k((A.z + B.z) / 2);
  return {z: (A.z + B.z) / 2 + zBias, key, el: <Inked w={0.45 * k}><Capsule id={key} a={A} b={B} ra={r * Pj.k(A.z)} rb={r * Pj.k(B.z)} color={color} spec={0.3} /></Inked>};
};

export {mix};
