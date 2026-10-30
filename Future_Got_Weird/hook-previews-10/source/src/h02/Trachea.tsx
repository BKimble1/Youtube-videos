// HOOK 02: the local cut window on the near side of the thorax. Inside: thoracic muscle bundles and fat body, the two
// thoracic spiracles' atria, the lateral longitudinal tracheal trunk that joins them, and the branching tracheae (silvery
// tubes with taenidial rings) that end in fine tracheoles among the muscle fibres. Oxygen arriving through the sealed
// tubes is shown as a pale cyan fill spreading from each spiracle into the branches. No lungs: insects have none.
import React from 'react';
import {V2, V3, Frame, toW} from './rig/v3';
import {INK} from '../shared/ink';
import {lit, shade} from '../shared/color';
import {View, P, f2, smoothClosed, smoothOpen} from './rig/ortho';
import {inkFor} from './rig/Roach2D';
import {clamp, hash, noise1} from '../shared/lib';
import {Tube} from './Suit2D';

const C = {
  tissue: '#E2B4A0',
  muscle: '#C4545A',
  muscleLit: '#E07F7C',
  fat: '#F0D9A2',
  trach: '#EEF4F5',
  ring: '#AFC0C6',
  o2: '#7FE6FF',
  o2Hi: '#E8FDFF',
  cut: '#B9774F',
  cutDark: '#6A3A26',
};

type Seg = {a: [number, number]; b: [number, number]; w: number; d0: number; d1: number; fine?: boolean};

const ZP = 17.5; // the cut plane inside the near body wall (body-frame z)

/** the tracheal tree in body-frame (x, y) on the near side, from the two spiracle positions */
const buildTree = (s1: [number, number], s2: [number, number]): Seg[] => {
  const segs: Seg[] = [];
  const add = (a: [number, number], b: [number, number], w: number, d0: number, fine = false) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({a, b, w, d0, d1: d0 + L, fine});
    return d0 + L;
  };
  const grow = (a: [number, number], ang: number, len: number, w: number, d0: number, depth: number, seed: number) => {
    const b: [number, number] = [a[0] + Math.cos(ang) * len, a[1] + Math.sin(ang) * len];
    const d1 = add(a, b, w, d0);
    if (depth >= 3) {
      // tracheoles: a fan of fine wavy endings
      for (let k = 0; k < 3; k++) {
        const an = ang + (k - 1) * 0.55 + 0.2 * noise1(seed + k, 3);
        let p = b, dd = d1;
        for (let j = 0; j < 3; j++) {
          const q: [number, number] = [p[0] + Math.cos(an + 0.5 * Math.sin(j * 2 + seed)) * 0.9, p[1] + Math.sin(an + 0.5 * Math.sin(j * 2 + seed)) * 0.9];
          dd = add(p, q, 0.16, dd, true);
          p = q;
        }
      }
      return;
    }
    const spread = 0.42 + 0.12 * hash(seed);
    grow(b, ang + spread, len * 0.7, w * 0.68, d1, depth + 1, seed * 1.7 + 1);
    grow(b, ang - spread * 0.9, len * 0.66, w * 0.66, d1, depth + 1, seed * 2.3 + 2);
  };
  // atria: short, wide, inward and up from each spiracle
  const n1: [number, number] = [s1[0] + 0.3, s1[1] + 1.9];
  const n2: [number, number] = [s2[0] + 0.2, s2[1] + 1.9];
  const a1 = add(s1, n1, 1.0, 0);
  const a2 = add(s2, n2, 0.95, 0);
  // the lateral longitudinal trunk linking both spiracles, running on forward and back
  add(n2, n1, 0.62, a2);
  add(n1, [n1[0] + 6.5, n1[1] + 0.9], 0.6, a1);
  add(n2, [n2[0] - 7, n2[1] - 0.2], 0.6, a2);
  // dorsal branches into the thoracic muscles
  grow(n1, 1.75, 3.4, 0.6, a1, 1, 3);
  grow(n1, 1.05, 3.6, 0.55, a1, 1, 5);
  grow(n2, 1.95, 3.6, 0.6, a2, 1, 7);
  grow(n2, 1.25, 3.0, 0.5, a2, 1, 9);
  grow([n1[0] + 4.5, n1[1] + 0.6], 1.45, 3.0, 0.48, a1 + 4.5, 1, 11);
  grow([n2[0] - 4.5, n2[1] - 0.1], 1.6, 3.0, 0.48, a2 + 4.5, 2, 13);
  // ventral branches toward the leg bases
  grow(n1, -1.35, 2.6, 0.45, a1, 2, 15);
  grow(n2, -1.75, 2.6, 0.45, a2, 2, 17);
  return segs;
};

export const TracheaWindow: React.FC<{id: string; v: View; f: Frame; open: number; t: number; fill0: number; fillEnd: number; tubes: Tube[]; side: 1 | -1}> = ({id, v, f, open, t, fill0, fillEnd, tubes, side}) => {
  if (open <= 0.005) return null;
  const s = v.s, ink = inkFor(v);
  const iw = Math.max(1, 0.14 * s + 0.4);
  const z = ZP * side;
  const Pp = (x: number, y: number, zz = z): V2 => P(v, toW(f, [x, y, zz] as V3));
  const meso = tubes.find((q) => q.side === side && q.to === 'meso')!;
  const meta = tubes.find((q) => q.side === side && q.to === 'meta')!;
  const s1: [number, number] = [meso.end[0], meso.end[1]];
  const s2: [number, number] = [meta.end[0], meta.end[1]];
  const cx = (s1[0] + s2[0]) / 2 + 2.2, cy = (s1[1] + s2[1]) / 2 + 4.2;
  const rx = 11.6 * open, ry = 6.4 * open;
  // the window outline on the body wall (slightly wobbly, like a cut)
  const ring = (k: number, zz: number) =>
    Array.from({length: 48}, (_, i) => {
      const th = (i / 48) * Math.PI * 2;
      const wob = 1 + 0.035 * Math.sin(th * 5 + 1.3) + 0.02 * Math.sin(th * 11);
      return Pp(cx + Math.cos(th) * rx * k * wob, cy + Math.sin(th) * ry * k * wob, zz);
    });
  const outer = smoothClosed(ring(1, z + 1.6 * side));
  const inner = smoothClosed(ring(0.94, z));
  const tree = buildTree(s1, s2);
  // oxygen front (mm of tracheal path from the spiracle)
  const front = Math.max(0, (t - fill0) / (fillEnd - fill0)) * 15.5;
  // muscle bundles: slanted bands across the window
  const bands = Array.from({length: 7}, (_, i) => {
    const x0 = cx - 13 + i * 4.1, w = 1.6 + 0.5 * hash(i * 3.3);
    const tl = -0.32 + 0.08 * Math.sin(i * 1.7);
    const pts: V2[] = [Pp(x0 - w, cy - 9), Pp(x0 + w, cy - 9), Pp(x0 + w + 18 * tl, cy + 9), Pp(x0 - w + 18 * tl, cy + 9)];
    const fib = Array.from({length: 4}, (_, k) => {
      const xx = x0 - w + ((k + 0.5) * 2 * w) / 4;
      return [Pp(xx, cy - 9), Pp(xx + 18 * tl, cy + 9)] as [V2, V2];
    });
    return {pts, fib};
  });
  const fat = Array.from({length: 9}, (_, i) => ({c: Pp(cx - 10 + 20 * hash(i * 1.9), cy - 5 + 10 * hash(i * 4.4)), r: (0.9 + 0.8 * hash(i * 7.1)) * s}));
  const segEl = (g: Seg, i: number) => {
    const a = Pp(g.a[0], g.a[1]), b = Pp(g.b[0], g.b[1]);
    const d = `M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`;
    const W = g.w * s;
    const lf = clamp((front - g.d0) / Math.max(0.01, g.d1 - g.d0));
    const m: V2 = [a[0] + (b[0] - a[0]) * lf, a[1] + (b[1] - a[1]) * lf];
    const dl = `M${f2(a[0])},${f2(a[1])} L${f2(m[0])},${f2(m[1])}`;
    if (g.fine)
      return (
        <g key={i}>
          <path d={d} stroke={shade(C.trach, 0.25)} strokeWidth={f2(Math.max(0.9, W))} strokeLinecap="round" opacity={0.85} />
          {lf > 0 && <path d={dl} stroke={C.o2} strokeWidth={f2(Math.max(0.9, W * 1.1))} strokeLinecap="round" />}
        </g>
      );
    const ringGap = Math.max(1.4, 0.32 * s);
    return (
      <g key={i}>
        <path d={d} stroke={INK} strokeWidth={f2(W + 2 * iw)} strokeLinecap="round" />
        <path d={d} stroke={C.trach} strokeWidth={f2(W)} strokeLinecap="round" />
        <path d={d} stroke={C.ring} strokeWidth={f2(W * 0.82)} strokeDasharray={`${f2(ringGap * 0.35)} ${f2(ringGap * 0.65)}`} opacity={0.9} />
        {lf > 0 && (
          <g>
            <path d={dl} stroke={C.o2} strokeWidth={f2(W * 0.62)} strokeLinecap="round" opacity={0.95} />
            <path d={dl} stroke={C.o2Hi} strokeWidth={f2(W * 0.22)} strokeLinecap="round" />
          </g>
        )}
        <path d={d} stroke="#FFFFFF" strokeWidth={f2(Math.max(0.7, W * 0.18))} strokeLinecap="round" opacity={0.7} transform={`translate(${f2(-W * 0.18)} ${f2(-W * 0.22)})`} />
      </g>
    );
  };
  // oxygen moving outward along already-filled branches
  const motes = tree
    .filter((g) => !g.fine && front > g.d1)
    .flatMap((g, i) =>
      [0, 0.5].map((o, k) => {
        const u = (t * 1.6 + o + hash(i * 3.7)) % 1;
        const p = Pp(g.a[0] + (g.b[0] - g.a[0]) * u, g.a[1] + (g.b[1] - g.a[1]) * u);
        return <circle key={`${i}-${k}`} cx={f2(p[0])} cy={f2(p[1])} r={f2(Math.max(1, g.w * s * 0.28))} fill={C.o2Hi} opacity={0.9} />;
      }),
    );
  // the spiracle openings (peritreme rim + dark atrium mouth) under the tube ends
  const spir = [s1, s2].map((q, i) => {
    const c = Pp(q[0], q[1], meso.end[2]);
    return (
      <g key={i}>
        <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(1.25 * s)} ry={f2(0.8 * s)} fill="#8A5A3E" stroke={INK} strokeWidth={f2(iw)} />
        <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(0.7 * s)} ry={f2(0.4 * s)} fill="#24130D" />
      </g>
    );
  });
  const glow = clamp((t - fill0) / 0.3) * (1 - clamp((t - fillEnd - 0.4) / 0.5));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-wc`}>
          <path d={inner} />
        </clipPath>
        <radialGradient id={`${id}-ws`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#3A120C" stopOpacity={0} />
          <stop offset="1" stopColor="#3A120C" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      {/* the cut: a cuticle rim of real thickness */}
      <path d={outer} fill={C.cutDark} />
      <path d={outer} fill="none" stroke={INK} strokeWidth={f2(ink * 0.8)} />
      <g clipPath={`url(#${id}-wc)`}>
        <path d={inner} fill={C.tissue} />
        {bands.map((b, i) => (
          <g key={i}>
            <path d={smoothClosed(b.pts)} fill={i % 2 ? C.muscle : shade(C.muscle, 0.12)} opacity={0.9} />
            {b.fib.map(([p, q], k) => (
              <path key={k} d={`M${f2(p[0])},${f2(p[1])} L${f2(q[0])},${f2(q[1])}`} stroke={C.muscleLit} strokeWidth={f2(Math.max(0.8, 0.12 * s))} opacity={0.55} />
            ))}
          </g>
        ))}
        {fat.map((q, i) => (
          <ellipse key={i} cx={f2(q.c[0])} cy={f2(q.c[1])} rx={f2(q.r)} ry={f2(q.r * 0.75)} fill={C.fat} stroke={shade(C.fat, 0.35)} strokeWidth={f2(Math.max(0.8, 0.1 * s))} opacity={0.9} />
        ))}
        {spir}
        {tree.map(segEl)}
        {motes}
        {glow > 0 && <path d={inner} fill={C.o2} opacity={0.05 * glow} />}
        <path d={inner} fill={`url(#${id}-ws)`} />
      </g>
      <path d={inner} fill="none" stroke={lit(C.cut, 0.25)} strokeWidth={f2(Math.max(1.2, 0.35 * s))} />
      <path d={inner} fill="none" stroke={INK} strokeWidth={f2(Math.max(1, ink * 0.45))} opacity={0.8} />
    </g>
  );
};
