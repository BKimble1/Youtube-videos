// V3 natural settings, drawn in the shot's own camera so every layer moves with real parallax:
// - Rock: a warm, weathered stone surface with cracks, lichen, grit and a few fallen leaves; behind it, out-of-focus
//   stones and foliage at two depths;
// - Leaf: the spider stands on a broad green leaf with raised veins; blurred foliage behind.
import React from 'react';
import {INK} from '../dc/ink';
import {Basis, P2, proj, projPoly, V3} from '../three';

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const blob = (c: V3, rx: number, ry: number, rot: number, n = 14, wob = 0.18, seed = 0): V3[] =>
  Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const r = 1 + wob * (rnd(seed + k) - 0.5) * 2;
    const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    return [c[0] + x * cr - y * sr, c[1] + x * sr + y * cr, c[2]];
  });
/** a leaf outline lying on a plane z (local length along rot) */
const leafPts = (c: V3, len: number, wid: number, rot: number, n = 18): V3[] => {
  const pts: V3[] = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    pts.push([u * len - len / 2, Math.sin(Math.PI * u) ** 0.8 * wid * 0.5, 0]);
  }
  for (let k = n - 1; k > 0; k--) {
    const u = k / n;
    pts.push([u * len - len / 2, -(Math.sin(Math.PI * u) ** 0.8) * wid * 0.5, 0]);
  }
  const cr = Math.cos(rot), sr = Math.sin(rot);
  return pts.map(([x, y]) => [c[0] + x * cr - y * sr, c[1] + x * sr + y * cr, c[2]] as V3);
};
const blurOf = (B: Basis, p: V3, k: number) => Math.min(18, Math.max(0, (proj(B, p).z - k) / 18));

/** far background: soft stones and foliage standing up behind the ground, blurred by distance */
const Backdrop: React.FC<{B: Basis; id: string; z: number; tint: 'rock' | 'leaf'}> = ({B, id, z, tint}) => {
  const layers: {y: number; blur: number; items: React.ReactNode[]}[] = [];
  for (const [li, y] of [180, 420].entries()) {
    const items: React.ReactNode[] = [];
    for (let k = 0; k < 14; k++) {
      const x = -260 + k * 40 + (rnd(k + li * 50) - 0.5) * 30;
      const h = (li === 0 ? 30 : 70) * (0.6 + rnd(k + 7 + li * 50));
      const w = (li === 0 ? 22 : 50) * (0.7 + rnd(k + 13 + li * 50));
      const leafy = tint === 'leaf' || rnd(k + 3 + li * 50) > 0.55;
      const col = leafy ? (li === 0 ? '#5E8A55' : '#7FA27A') : li === 0 ? '#8C8274' : '#A9A396';
      const pts: V3[] = Array.from({length: 16}, (_, j) => {
        const a = (j / 16) * Math.PI;
        return [x + Math.cos(a) * w, y + (rnd(k + j) - 0.5) * 4, z + Math.sin(a) * h * (0.85 + 0.3 * rnd(k * 3 + j))] as V3;
      });
      pts.push([x - w, y, z - 5], [x + w, y, z - 5]);
      items.push(<path key={k} d={projPoly(B, pts.slice(0, 16).concat([[x - w, y, z - 2]]))} fill={col} opacity={li === 0 ? 0.95 : 0.7} />);
    }
    layers.push({y, blur: li === 0 ? 7 : 14, items});
  }
  return (
    <g>
      <defs>
        {layers.map((l, i) => (
          <filter key={i} id={`${id}bd${i}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={l.blur} />
          </filter>
        ))}
      </defs>
      {layers
        .slice()
        .reverse()
        .map((l, i) => (
          <g key={i} filter={`url(#${id}bd${layers.length - 1 - i})`}>{l.items}</g>
        ))}
    </g>
  );
};

export const RockGround: React.FC<{B: Basis; id: string; z: number}> = ({B, id, z}) => {
  const els: React.ReactNode[] = [];
  // broad tonal patches in the stone
  for (let i = 0; i < 26; i++) {
    const x = (rnd(i + 900) - 0.5) * 220, y = (rnd(i + 950) - 0.5) * 200 + 20;
    const d = projPoly(B, blob([x, y, z], 8 + 16 * rnd(i + 3), 6 + 10 * rnd(i + 4), rnd(i + 5) * 6, 16, 0.35, i + 900));
    if (d) els.push(<path key={`p${i}`} d={d} fill={rnd(i + 6) > 0.5 ? '#C4B79F' : '#A99C86'} opacity={0.5} />);
  }
  // grit and lichen
  for (let i = 0; i < 220; i++) {
    const x = (rnd(i) - 0.5) * 140, y = (rnd(i + 500) - 0.5) * 140 + 10;
    if (Math.hypot(x + 2, y) < 4) continue;
    const lich = i % 11 === 0;
    const r = lich ? 1.5 + 2.5 * rnd(i + 9) : 0.2 + 0.5 * rnd(i + 9);
    const d = projPoly(B, blob([x, y, z], r, r * 0.75, rnd(i + 3) * 6, 10, 0.3, i));
    if (!d) continue;
    els.push(<path key={`g${i}`} d={d} fill={lich ? (rnd(i + 2) > 0.5 ? '#B9B77A' : '#C9C3A0') : rnd(i + 5) > 0.5 ? '#7D7366' : '#BDB2A0'} opacity={lich ? 0.55 : 0.6} />);
  }
  // cracks
  for (let c = 0; c < 7; c++) {
    let p: V3 = [(rnd(c + 40) - 0.5) * 120, (rnd(c + 41) - 0.5) * 120 + 10, z];
    const pts = [p];
    let a = rnd(c + 42) * 6.28;
    for (let k = 0; k < 9; k++) {
      a += (rnd(c * 9 + k) - 0.5) * 1.1;
      p = [p[0] + Math.cos(a) * 5, p[1] + Math.sin(a) * 5, z];
      pts.push(p);
    }
    els.push(<path key={`c${c}`} d={`M${pts.map((q) => P2(proj(B, q))).join(' L')}`} fill="none" stroke="#5E554A" strokeWidth={Math.max(1, 0.12 * proj(B, pts[4]).s)} opacity={0.6} strokeLinecap="round" />);
  }
  // fallen leaves
  [[-26, 14, 16, 7, 0.6, '#B98A4A'], [22, -10, 13, 6, 2.2, '#9C6E3E'], [30, 30, 18, 8, 1.1, '#C29A55'], [-38, -24, 15, 6, 2.9, '#A97B45']].forEach(([x, y, l, w, r, col], i) => {
    const d = projPoly(B, leafPts([x as number, y as number, z + 0.05], l as number, w as number, r as number));
    if (!d) return;
    const a = proj(B, [(x as number) - Math.cos(r as number) * (l as number) * 0.5, (y as number) - Math.sin(r as number) * (l as number) * 0.5, z + 0.1]);
    const b = proj(B, [(x as number) + Math.cos(r as number) * (l as number) * 0.5, (y as number) + Math.sin(r as number) * (l as number) * 0.5, z + 0.1]);
    els.push(
      <g key={`l${i}`}>
        <path d={d} fill={col as string} stroke={INK} strokeWidth={Math.max(1, 0.06 * a.s)} strokeLinejoin="round" />
        <path d={`M${P2(a)} L${P2(b)}`} stroke="#6E4B26" strokeWidth={Math.max(0.8, 0.08 * a.s)} opacity={0.7} />
      </g>,
    );
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C8D6BE" />
          <stop offset="1" stopColor="#E4DCC8" />
        </linearGradient>
        <radialGradient id={`${id}rk`} cx="540" cy="1100" r="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D2C6B1" />
          <stop offset="1" stopColor="#9E927F" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id}sky)`} />
      <Backdrop B={B} id={id} z={z} tint="rock" />
      <path d={projPoly(B, [[-400, -300, z], [400, -300, z], [400, 150, z], [-400, 150, z]])} fill={`url(#${id}rk)`} />
      {els}
    </g>
  );
};

export const LeafGround: React.FC<{B: Basis; id: string; z: number}> = ({B, id, z}) => {
  // the leaf: a long ellipse-like blade, midrib along x, veins angled to the margin
  const blade = leafPts([0, 4, z], 150, 90, 0.18, 40);
  const vein = (u: number, side: number) => {
    const cr = Math.cos(0.18), sr = Math.sin(0.18);
    const x0 = u * 150 - 75;
    const a: V3 = [x0, 0, z], b: V3 = [x0 + 26, side * 34, z];
    const T = (q: V3): V3 => [q[0] * cr - q[1] * sr, q[0] * sr + q[1] * cr + 4, z + 0.05];
    return `M${P2(proj(B, T(a)))} Q${P2(proj(B, T([x0 + 12, side * 14, z])))} ${P2(proj(B, T(b)))}`;
  };
  const veins: React.ReactNode[] = [];
  for (let k = 1; k < 10; k++) for (const s of [1, -1]) veins.push(<path key={`${k}${s}`} d={vein(k / 10, s)} fill="none" stroke="#9CC77A" strokeWidth={Math.max(1, 0.35 * proj(B, [0, 0, z]).s)} opacity={0.75} strokeLinecap="round" />);
  const cr = Math.cos(0.18), sr = Math.sin(0.18);
  const mid = `M${P2(proj(B, [-75 * cr, -75 * sr + 4, z + 0.05]))} L${P2(proj(B, [75 * cr, 75 * sr + 4, z + 0.05]))}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B9D3B0" />
          <stop offset="1" stopColor="#DCE8CF" />
        </linearGradient>
        <radialGradient id={`${id}lf`} cx="540" cy="1000" r="1200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6FA552" />
          <stop offset="1" stopColor="#3F7A3A" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id}sky)`} />
      <Backdrop B={B} id={id} z={z - 6} tint="leaf" />
      <path d={projPoly(B, blade)} fill={`url(#${id}lf)`} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {veins}
      <path d={mid} stroke="#B5DA8F" strokeWidth={Math.max(1.5, 0.7 * proj(B, [0, 0, z]).s)} opacity={0.85} strokeLinecap="round" />
    </g>
  );
};
void blurOf;
