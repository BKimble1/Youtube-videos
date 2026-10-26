// V3 beat G: the house with its lightning protection (V2's illustration, scenes/Rod.tsx: gable front, slate roof,
// chimney, four windows, door, the copper down-conductor on stand-off clips from the earth clamp up the wall corner and
// the roof edge to the mast bracket, and the air terminal: a plain pointed metal rod). Here it stands in the 3D storm
// world (Rod3_cam.ts HOUSE), each point projected through the camera, with V3 line weights: ink grows a little with
// the push and stops at the weight of H's tower rod, and the rod tip is drawn the way Tower3D draws the tower's rod
// (a long taper to a fine point), so the match cut to H reads as the same kind of tip.
// The light on the metal is reflected sky: a flash lights the whole run of metal at once (earth clamp, conductor, rod,
// tip) and its sheen fades evenly along the full length; nothing travels along the metal, so it never reads as current.
// The rod is shown as what it is (a grounded metal terminal); nothing marks or denies a protected zone.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {Cam3, projector} from '../v2/p3';
import {facadeScale, hw, hx, hy, ROD_BASE, ROD_TOP, ROUTE_M} from './Rod3_cam';

const INK = '#0B151C';
type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;
const line = (pts: Pt[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`;

/** the rod's half-width at its base (m): at the end of the push its taper matches H's tower rod on screen */
export const ROD_HW = 0.052;

export type HouseLight = {
  flash: number; // the strike's light on the scene (0..1)
  glare: number; // the flash itself on the metal (brief: a soft bloom along the whole conductor and rod)
  catch: number; // the sheen the metal holds from it, even along its whole length (earth clamp to tip), fading
  tip: number; // the glint on the metal tip
};

export const House: React.FC<{cam: Cam3; light: HouseLight; id: string}> = ({cam, light, id}) => {
  const P = projector(cam);
  const Q = (x: number, y: number, z = 0): Pt => {
    const p = P(hw(x, y, z));
    return {x: p.x, y: p.y};
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, z = 0) => poly([Q(x0, y0, z), Q(x1, y0, z), Q(x1, y1, z), Q(x0, y1, z)]);
  const sc = facadeScale(cam);
  const ink = clamp(sc * 0.0134, 2.2, 3.6);
  const fl = clamp(light.flash);
  // ---------------------------------------------------------------- ground (wet garden), path, puddles, fence
  const zc = cam.pos.z - hw(0, 0).z; // camera's local z (negative: in front of the facade)
  // (everything on the ground starts a few metres ahead of the camera, so no point is projected from behind it)
  const gz0 = zc + 3;
  const ground = poly([Q(-60, 0, gz0), Q(60, 0, gz0), Q(60, 0, 70), Q(-60, 0, 70)]);
  // stepping stones from the door
  const stones = [-0.7, -1.6, -2.5, -3.4].filter((z) => z - 0.3 > gz0).map((z, i) =>
    poly(Array.from({length: 12}, (_, j) => {
      const a = (j / 12) * 6.2832;
      return Q(2.55 + 0.12 * (hash(i, 41) - 0.5) + 0.36 * Math.cos(a), 0.01, z + 0.24 * Math.sin(a));
    })),
  );
  const puddles = [
    {x: 5.6, z: -3.5, r: 0.9},
    {x: 7.4, z: -1.6, r: 0.7},
    {x: -5.8, z: -4.6, r: 1.1},
  ].filter((p) => p.z - p.r > gz0).map((p, i) =>
    poly(
      Array.from({length: 20}, (_, j) => {
        const a = (j / 20) * 6.2832;
        return Q(p.x + p.r * Math.cos(a), 0.01, p.z + p.r * 0.55 * Math.sin(a) + 0.08 * hash(i, j));
      }),
    ),
  );
  const fenceZ = -1.4;
  const posts = Array.from({length: 18}, (_, i) => hx(-900 + i * 70));
  // ---------------------------------------------------------------- the facade
  const W0 = hx(240), W1 = hx(862), WT = hy(1240);
  const wallTop = mix('#646A72', '#B8C0E4', fl * 0.45), wallBot = mix('#3C434B', '#7A84AC', fl * 0.35);
  const winD = [[320, 1340], [560, 1340], [320, 1540], [560, 1540]].map(([x, y]) => ({x0: hx(x), x1: hx(x + 120), y0: hy(y + 130), y1: hy(y)}));
  const roof = poly([Q(hx(200), hy(1250)), Q(0, hy(1010)), Q(hx(902), hy(1250))]);
  const slates = Array.from({length: 9}, (_, i) => {
    const y = hy(1010 + (i + 1) * 26.7), hw2 = ((i + 1) * 39) / 78;
    return line([Q(-hw2, y), Q(hw2, y)]);
  }).join(' ');
  // the chimney rises from the left roof slope, a little behind the gable (the gable's roof edge hides its foot)
  const chZ = 2.6;
  const chimney = rect(-3.36, 6.9, -2.66, 9.3, chZ);
  const chCap = rect(-3.46, 9.26, -2.56, 9.44, chZ - 0.05);
  // ---------------------------------------------------------------- the lightning protection
  const cond = ROUTE_M.slice(0, -1).map((p) => Q(p.x, p.y, -0.06));
  const condD = line(cond);
  const cw = clamp(sc * 0.066, 5.5, 11); // the copper strip's width on screen
  const ct = clamp(light.catch), gr = clamp(light.glare), lit = Math.max(ct, gr);
  const cop = mix('#B8703C', '#F4C79C', Math.max(ct * 0.7, gr * 0.85)), copL = mix('#E59A62', '#FFF4E4', lit);
  const clips = [1700, 1560, 1420, 1290].map((y) => ({c: Q(ROUTE_M[0].x, hy(y), -0.08)}));
  const rakeA = ROUTE_M[2], rakeB = ROUTE_M[3];
  const rakeClips = [0.25, 0.5, 0.75].map((k) => Q(rakeA.x + (rakeB.x - rakeA.x) * k, rakeA.y + (rakeB.y - rakeA.y) * k, -0.08));
  const clipW = clamp(sc * 0.2, 9, 26), clipH = clamp(sc * 0.1, 5, 13);
  const rakeAng = (Math.atan2(Q(rakeB.x, rakeB.y).y - Q(rakeA.x, rakeA.y).y, Q(rakeB.x, rakeB.y).x - Q(rakeA.x, rakeA.y).x) * 180) / Math.PI;
  const clamp0 = Q(ROUTE_M[0].x, 0.32, -0.1);
  const clampW = clamp(sc * 0.42, 14, 60), clampH = clamp(sc * 0.34, 11, 48);
  // the mast bracket at the apex and the rod (Tower3D's construction: a long taper with a fine point)
  const brk = rect(-0.1, hy(1010) - 0.02, 0.1, hy(1010) + 0.16, -0.05);
  const plate = rect(-0.16, hy(1010) - 0.06, 0.16, hy(1010) + 0.02, -0.04);
  const pb = P(hw(ROD_BASE.x, ROD_BASE.y, -0.04)), pt = P(hw(ROD_TOP.x, ROD_TOP.y, -0.04));
  const rw = (cam.f * ROD_HW) / Math.max(0.5, pb.z);
  const rodD = `M${fmt(pb.x - rw)},${fmt(pb.y)} L${fmt(pt.x - rw * 0.15)},${fmt(pt.y + rw * 1.5)} L${fmt(pt.x)},${fmt(pt.y)} L${fmt(pt.x + rw * 0.15)},${fmt(pt.y + rw * 1.5)} L${fmt(pb.x + rw)},${fmt(pb.y)} Z`;
  const rodFill = mix('#9DA9B1', '#FFFFFF', clamp(lit * 0.8 + light.tip * 0.25));
  const tipP = {x: pt.x, y: pt.y};
  const gl = clamp(light.tip);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(Q(0, WT).y)} x2="0" y2={fmt(Q(0, 0).y)}>
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBot} />
        </linearGradient>
        <linearGradient id={`${id}-gnd`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(Q(0, 0, 30).y)} x2="0" y2={fmt(Q(0, 0, gz0 + 2).y)}>
          <stop offset="0" stopColor="#16222B" />
          <stop offset="1" stopColor="#1C2A33" />
        </linearGradient>
        <radialGradient id={`${id}-tg`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.35" stopColor="#DDE3FF" stopOpacity={0.4} />
          <stop offset="1" stopColor="#9AA6E8" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the wet garden */}
      <path d={ground} fill={`url(#${id}-gnd)`} />
      {stones.map((d, i) => <path key={`st${i}`} d={d} fill={mix('#24323A', '#4E5C7E', fl * 0.3)} opacity={0.75} />)}
      {puddles.map((d, i) => <path key={i} d={d} fill={mix('#2E4252', '#7584B8', fl * 0.5)} opacity={0.7} />)}
      {/* the fence along the garden's left side */}
      <g stroke={mix('#3E4C54', '#6E7AA0', fl * 0.4)} strokeLinecap="round">
        <path d={line([Q(hx(-920), 0.56, fenceZ), Q(hx(300), 0.56, fenceZ)])} strokeWidth={fmt(clamp(sc * 0.05, 2.5, 8))} />
        {posts.map((x, i) => {
          const a = Q(x, 0, fenceZ), b = Q(x, 0.78, fenceZ);
          return <line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} strokeWidth={fmt(clamp(sc * 0.09, 3, 14))} />;
        })}
      </g>
      {/* chimney (behind the gable's roof edge) */}
      <path d={chimney} fill={mix('#3F3532', '#7A6E92', fl * 0.35)} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <path d={chCap} fill="#332B29" stroke={INK} strokeWidth={fmt(ink * 0.8)} strokeLinejoin="round" />
      {/* the wall, its eave band, the windows (one lit) and the door */}
      <path d={rect(W0, 0, W1, WT)} fill={`url(#${id}-wall)`} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <path d={rect(W0, hy(1270), W1, WT)} fill="#353C44" />
      {winD.map((w, i) => {
        const lit = i === 1;
        const mx = (w.x0 + w.x1) / 2, my = (w.y0 + w.y1) / 2;
        return (
          <g key={i}>
            <path d={rect(w.x0, w.y0, w.x1, w.y1)} fill={lit ? '#5C5040' : mix('#18232C', '#6C7AA8', fl * 0.6)} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
            {!lit && <path d={poly([Q(w.x0 + 0.12, w.y1 - 0.1), Q(w.x0 + 0.62, w.y1 - 0.1), Q(w.x0 + 0.12, w.y1 - 0.7)])} fill="#4E6072" opacity={0.35 + 0.4 * fl} />}
            <path d={line([Q(mx, w.y0), Q(mx, w.y1)]) + ' ' + line([Q(w.x0, my), Q(w.x1, my)])} stroke={INK} strokeWidth={fmt(ink * 0.8)} fill="none" />
            <path d={line([Q(w.x0 - 0.08, w.y0 - 0.05), Q(w.x1 + 0.08, w.y0 - 0.05)])} stroke="#2A3138" strokeWidth={fmt(clamp(sc * 0.06, 2, 9))} fill="none" />
          </g>
        );
      })}
      <path d={rect(hx(700), 0, hx(800), hy(1560))} fill="#3A2E28" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <circle cx={fmt(Q(hx(785), hy(1660)).x)} cy={fmt(Q(hx(785), hy(1660)).y)} r={fmt(clamp(sc * 0.05, 1.5, 6))} fill="#8C7A5A" />
      {/* the slate roof (gable) */}
      <path d={roof} fill={mix('#2C3540', '#6A76A6', fl * 0.45)} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <path d={slates} stroke={INK} strokeOpacity={0.4} strokeWidth={fmt(ink * 0.6)} fill="none" />
      {/* the down-conductor: copper strip on stand-off clips, from the earth clamp to the mast base */}
      <path d={condD} fill="none" stroke={INK} strokeWidth={fmt(cw + 2 * ink)} strokeLinejoin="round" strokeLinecap="round" />
      <path d={condD} fill="none" stroke={cop} strokeWidth={fmt(cw)} strokeLinejoin="round" strokeLinecap="round" />
      <path d={condD} fill="none" stroke={copL} strokeWidth={fmt(cw * (0.3 + 0.12 * lit))} strokeLinejoin="round" opacity={0.55 + 0.45 * lit} transform={`translate(${fmt(-cw * 0.22)} 0)`} />
      {clips.map((c, i) => (
        <rect key={i} x={fmt(c.c.x - clipW / 2)} y={fmt(c.c.y - clipH / 2)} width={fmt(clipW)} height={fmt(clipH)} fill="#5A646A" stroke={INK} strokeWidth={fmt(ink * 0.7)} />
      ))}
      {rakeClips.map((c, i) => (
        <rect key={i} x={fmt(c.x - clipW / 2)} y={fmt(c.y - clipH / 2)} width={fmt(clipW)} height={fmt(clipH)} fill="#5A646A" stroke={INK} strokeWidth={fmt(ink * 0.7)} transform={`rotate(${fmt(rakeAng)} ${fmt(c.x)} ${fmt(c.y)})`} />
      ))}
      <rect x={fmt(clamp0.x - clampW / 2)} y={fmt(clamp0.y - clampH / 2)} width={fmt(clampW)} height={fmt(clampH)} rx={fmt(clampH * 0.15)} fill={mix('#77808A', '#C8CEEA', Math.max(fl, lit) * 0.6)} stroke={INK} strokeWidth={fmt(ink * 0.85)} />
      {/* the mast bracket and the air terminal */}
      <path d={plate} fill="#4A535A" stroke={INK} strokeWidth={fmt(ink * 0.8)} strokeLinejoin="round" />
      <path d={brk} fill="#5A646A" stroke={INK} strokeWidth={fmt(ink * 0.8)} strokeLinejoin="round" />
      <path d={rodD} fill={rodFill} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <path d={`M${fmt(pb.x - rw * 0.45)},${fmt(pb.y - 2)} L${fmt(pt.x - rw * 0.07)},${fmt(pt.y + rw * 2.2)}`} stroke="#FFFFFF" strokeOpacity={0.14 + 0.5 * lit} strokeWidth={fmt(clamp(rw * 0.22, 1, 3))} strokeLinecap="round" />
      {/* the flash caught by the whole run of metal at once, earth clamp to tip (a bloom while the sky is lit, then the
          even sheen alone, fading) */}
      {lit > 0.02 && (
        <g style={{mixBlendMode: 'screen'}} fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d={condD} stroke="#F6B98A" strokeOpacity={0.28 * gr + 0.1 * ct} strokeWidth={fmt(cw * 2.6)} />
          <path d={`M${fmt(pb.x)},${fmt(pb.y)} L${fmt(pt.x)},${fmt(pt.y + rw)}`} stroke="#DDE3FF" strokeOpacity={0.3 * gr + 0.1 * ct} strokeWidth={fmt(rw * 3)} />
        </g>
      )}
      {/* the glint on the metal tip */}
      {gl > 0.02 && (
        <g style={{mixBlendMode: 'screen'}}>
          <circle cx={fmt(tipP.x)} cy={fmt(tipP.y + rw * 0.6)} r={fmt(clamp(rw * 3.2, 10, 44))} fill={`url(#${id}-tg)`} opacity={gl} />
          <path d={`M${fmt(tipP.x - rw * 2.4)},${fmt(tipP.y + rw * 0.6)} L${fmt(tipP.x + rw * 2.4)},${fmt(tipP.y + rw * 0.6)}`} stroke="#FFFFFF" strokeOpacity={0.8 * gl} strokeWidth={1.4} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
