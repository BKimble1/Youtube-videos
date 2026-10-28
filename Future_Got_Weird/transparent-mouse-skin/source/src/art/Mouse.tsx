// The mouse: one reusable, sedated laboratory mouse lying on its back (belly up, head at the top, snout in an
// anaesthesia nose cone), drawn in world coordinates (the 1080x1920 wide view). Layers, back to front:
//   tail and limbs -> body silhouette (grey back fur at the rim, cream belly fur) -> the shaved abdominal patch:
//   [abdominal anatomy (always present, anchored, gently moving)] under [skin, whose optical state is one parameter]
//   -> skin surface (texture, sheen, the fur edge), which never changes with transmission.
// Transmission T (0 = ordinary opaque skin, 1 = the treated, clearer state) only changes how much the skin hides what
// is already there: the anatomy layer is never created, moved or deleted by it. Breathing is one transform shared by
// body, skin and anatomy.
import React from 'react';
import {mix, rgba} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, hash, lerp, V} from '../dc/math';

export const MC = {x: 540, y: 1065}; // patch centre (world)
export const PATCH = {rx: 150, ry: 205};
export const BREATH_C = {x: 540, y: 1050};

export const COL = {
  furBelly: '#F2ECE3', furShade: '#D8CEC2', furBack: '#A3A8AE', furBackDeep: '#7F868E',
  skin: '#F0C0B0', skinDeep: '#D99B8C', pink: '#F0A9A0', paw: '#F2B6A9', pawDeep: '#D48E82', nose: '#E58F8A',
  cavity: '#A4434B', liver: '#6E2230', liverLit: '#9A3A45', gut: '#E8978B', gutLit: '#F7C6B8', gutInk: '#6A2330',
  cecum: '#D97E78', bladder: '#F0D88E', vessel: '#B8283A', dye: '#F2A231', dyeDeep: '#E07A1E', cone: '#3F4C57', coneLit: '#5E6D79',
};

// ---------- geometry helpers ----------
export const crPath = (pts: V[], closed: boolean) => {
  const n = pts.length;
  const g = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d + (closed ? ' Z' : '');
};
/** sample a Catmull-Rom spline through pts every `step` world units: points with arc length and unit normal */
const sampleCR = (pts: V[], step: number) => {
  const dense: V[] = [];
  const g = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push({x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  dense.push(pts[pts.length - 1]);
  const out: {p: V; s: number; n: V}[] = [];
  let acc = 0, next = 0;
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1], b = dense[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    while (next <= acc + L) {
      const u = (next - acc) / (L || 1);
      const tx = (b.x - a.x) / (L || 1), ty = (b.y - a.y) / (L || 1);
      out.push({p: {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u}, s: next, n: {x: -ty, y: tx}});
      next += step;
    }
    acc += L;
  }
  return out;
};
const mirror = (half: V[]) => [...half, ...half.slice(1, -1).reverse().map((p) => ({x: 2 * 540 - p.x, y: p.y}))];

// ---------- silhouette ----------
const BODY_R: V[] = [
  {x: 540, y: 452}, {x: 586, y: 468}, {x: 630, y: 515}, {x: 664, y: 585}, {x: 684, y: 660}, {x: 676, y: 735},
  {x: 700, y: 808}, {x: 726, y: 905}, {x: 740, y: 1020}, {x: 739, y: 1140}, {x: 728, y: 1262}, {x: 706, y: 1352},
  {x: 666, y: 1418}, {x: 608, y: 1452}, {x: 540, y: 1462},
];
export const BODY = mirror(BODY_R);
export const BODY_D = crPath(BODY, true);

// ---------- abdominal anatomy (world coordinates, inside the patch) ----------
/** packed small-intestine coils: S-shaped runs of tube, each turned a little differently, overlapping like real loops */
const coil = (cx: number, cy: number, ang: number, L: number, rows: number, seed: number) => {
  const g = 33, pts: V[] = [];
  for (let r = 0; r < rows; r++) {
    const y = (r - (rows - 1) / 2) * g;
    const ends = r % 2 ? [L / 2, -L / 2] : [-L / 2, L / 2];
    pts.push({x: ends[0], y}, {x: (hash(r, seed) - 0.5) * L * 0.3, y: y + (hash(r, seed + 1) - 0.5) * 14}, {x: ends[1], y});
    if (r < rows - 1) pts.push({x: ends[1] + Math.sign(ends[1]) * g * 0.55, y: y + g / 2});
  }
  const c = Math.cos((ang * Math.PI) / 180), sn = Math.sin((ang * Math.PI) / 180);
  return pts.map((q) => ({x: cx + q.x * c - q.y * sn, y: cy + q.x * sn + q.y * c}));
};
const GUTS = [
  coil(600, 1150, 20, 84, 3, 51), coil(470, 1140, -64, 110, 3, 53), coil(498, 1014, 12, 90, 3, 47),
  coil(612, 1040, -58, 96, 3, 49), coil(548, 1208, -6, 120, 2, 55),
].map((pts) => sampleCR(pts, 3.2));
const GUT = GUTS[0];
const GUT_LEN = Math.max(...GUTS.map((g) => g[g.length - 1].s));
const CECUM = sampleCR([{x: 470, y: 1236}, {x: 500, y: 1252}, {x: 560, y: 1254}], 3.2);

/** peristalsis: slow travelling constrictions along the small intestine (a restrained, anchored motion) */
const constrict = (s: number, t: number) => {
  const period = 230, v = 64;
  let g = 0;
  for (let k = -1; k < GUT_LEN / period + 2; k++) {
    const c = ((k * period + v * t) % (GUT_LEN + period)) - period * 0.5;
    g += Math.exp(-(((s - c) / 26) ** 2));
  }
  return g;
};

const Tube: React.FC<{pts: {p: V; s: number; n: V}[]; r: (s: number) => number; t: number; color: string; lit: string; wob: number}> = ({pts, r, t, color, lit, wob}) => {
  const P = pts.map((q) => {
    const w = wob * Math.sin(q.s * 0.021 - t * 1.9) + wob * 0.5 * Math.sin(q.s * 0.047 + t * 1.3);
    return {x: q.p.x + q.n.x * w, y: q.p.y + q.n.y * w, r: r(q.s)};
  });
  return (
    <g>
      {P.map((q, i) => <circle key={`o${i}`} cx={q.x} cy={q.y} r={q.r + 2.4} fill={COL.gutInk} />)}
      {P.map((q, i) => <circle key={`f${i}`} cx={q.x} cy={q.y} r={q.r} fill={color} />)}
      {P.map((q, i) => <circle key={`h${i}`} cx={q.x - q.r * 0.3} cy={q.y - q.r * 0.38} r={q.r * 0.42} fill={lit} opacity={0.55} />)}
    </g>
  );
};

export const Anatomy: React.FC<{t: number}> = ({t}) => {
  const liverShift = 1.2 * Math.sin(t * 2 * Math.PI * 1.05); // the diaphragm's small push each breath
  return (
    <g>
      <ellipse cx={MC.x} cy={MC.y + 10} rx={PATCH.rx + 30} ry={PATCH.ry + 30} fill={COL.cavity} />
      {/* liver lobes, under the ribs at the top of the patch */}
      <g transform={`translate(0 ${(liverShift + 14).toFixed(2)})`}>
        <path d="M402,905 C420,860 500,845 545,858 C600,842 668,858 684,902 C690,940 640,958 600,950 C560,965 520,966 482,952 C440,962 398,945 402,905 Z" fill={COL.liver} stroke={COL.gutInk} strokeWidth={3} />
        <path d="M430,900 C460,875 520,868 545,880" stroke={COL.liverLit} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.65} />
        <path d="M600,872 C630,868 660,880 668,898" stroke={COL.liverLit} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.55} />
        <path d="M545,860 C548,895 552,930 548,955" stroke={COL.gutInk} strokeWidth={2.4} fill="none" opacity={0.6} />
      </g>
      {/* mesenteric vessels between the loops */}
      <g stroke={COL.vessel} strokeWidth={2.2} fill="none" opacity={0.75} strokeLinecap="round">
        <path d="M545,1000 C540,1040 548,1070 540,1110 C536,1140 544,1170 538,1200" />
        <path d="M540,1050 C510,1060 480,1058 462,1066" />
        <path d="M542,1120 C580,1118 610,1112 640,1112" />
        <path d="M538,1180 C510,1176 486,1172 470,1170" />
      </g>
      <Tube pts={CECUM} r={() => 21} t={t} color={COL.cecum} lit={COL.gutLit} wob={0.8} />
      {GUTS.map((g, i) => (
        <Tube key={i} pts={g} r={(s) => 16 * (1 - 0.26 * Math.min(1, constrict(s + i * 90, t)))} t={t + i * 0.7} color={[COL.gut, '#E28C83', '#EA9F92', '#E4938A', '#EC9C90'][i]} lit={COL.gutLit} wob={1.5} />
      ))}
      <ellipse cx={MC.x + 36} cy={1236} rx={24} ry={18} fill={COL.bladder} stroke={COL.gutInk} strokeWidth={2.6} />
    </g>
  );
};

// ---------- skin surface details (constant: present whatever the transmission) ----------
export const PORES = Array.from({length: 150}, (_, i) => {
  const a = hash(i, 3) * Math.PI * 2, rr = Math.sqrt(hash(i, 7)) * 0.97;
  return {x: MC.x + Math.cos(a) * rr * PATCH.rx, y: MC.y + Math.sin(a) * rr * PATCH.ry, r: 1.1 + hash(i, 11) * 1.4};
});
export const STUBBLE = Array.from({length: 170}, (_, i) => {
  const a = (i / 170) * Math.PI * 2 + hash(i, 5) * 0.04;
  const e = 0.97 + hash(i, 9) * 0.06;
  const x = MC.x + Math.cos(a) * PATCH.rx * e, y = MC.y + Math.sin(a) * PATCH.ry * e;
  const L = 6 + hash(i, 13) * 9;
  const nx = Math.cos(a) * PATCH.ry, ny = Math.sin(a) * PATCH.rx; const nl = Math.hypot(nx, ny);
  return {x, y, x2: x + (nx / nl) * L + (hash(i, 17) - 0.5) * 6, y2: y + (ny / nl) * L + (hash(i, 19) - 0.5) * 6};
});
export const BEADS = Array.from({length: 22}, (_, i) => {
  const a = hash(i, 41) * Math.PI * 2, rr = Math.sqrt(hash(i, 43)) * 0.9;
  return {x: MC.x + Math.cos(a) * rr * PATCH.rx, y: MC.y + Math.sin(a) * rr * PATCH.ry, r: 4 + hash(i, 47) * 7};
});
export const FURLINES = Array.from({length: 90}, (_, i) => {
  const x = 380 + hash(i, 21) * 320, y = 760 + hash(i, 23) * 640;
  return {x, y, a: (hash(i, 29) - 0.5) * 0.6};
});

export type MouseState = {
  t: number;          // seconds (anatomy and breathing keep running)
  T: number;          // skin transmission 0..1
  tint: number;       // dye held in the skin (orange tint) 0..1
  film: number;       // fresh wet solution on the surface 0..1 (or use coverage)
  coverage?: V[];     // swab track painted so far (application)
  wet: number;        // rinse water sheen 0..1
  sweep?: number;     // raking light position across the patch, -1..1 (undefined: none)
};

export const Mouse: React.FC<{id: string; s: MouseState}> = ({id, s}) => {
  const br = Math.sin(s.t * 2 * Math.PI * 1.05);
  const bx = 1 + 0.011 * br, by = 1 + 0.005 * br;
  const T = clamp(s.T);
  const blur = 1.0 + 9 * (1 - T) ** 1.4;
  const skinA = 1 - 0.9 * T;
  const tintA = 0.26 * s.tint;
  const fur = (dx: number) => mix(COL.furBelly, COL.furShade, dx);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-belly`} cx="0.42" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#FBF7F1" />
          <stop offset="0.6" stopColor={COL.furBelly} />
          <stop offset="1" stopColor={COL.furShade} />
        </radialGradient>
        <radialGradient id={`${id}-pm`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="0.98" stopColor="#000" />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.66" stopColor={COL.skin} stopOpacity="0" />
          <stop offset="0.93" stopColor={COL.skin} stopOpacity="0.8" />
          <stop offset="1" stopColor={COL.skin} stopOpacity="1" />
        </radialGradient>
        <mask id={`${id}-patch`} maskContentUnits="userSpaceOnUse">
          <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx} ry={PATCH.ry} fill={`url(#${id}-pm)`} />
        </mask>
        <clipPath id={`${id}-pclip`}>
          <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 4} ry={PATCH.ry + 4} />
        </clipPath>
        <clipPath id={`${id}-body`}>
          <path d={BODY_D} />
        </clipPath>
        <filter id={`${id}-scatter`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={blur.toFixed(2)} />
        </filter>
        <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFF4E6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* contact shadow on the pad */}
      <ellipse cx={548} cy={1000} rx={250} ry={560} fill="rgba(20,40,60,0.16)" style={{filter: 'blur(18px)'}} />
      <g transform={`translate(${BREATH_C.x} ${BREATH_C.y}) scale(${bx.toFixed(4)} ${by.toFixed(4)}) translate(${-BREATH_C.x} ${-BREATH_C.y})`}>
        {/* tail */}
        <path d="M540,1440 C560,1560 650,1590 640,1700 C632,1790 560,1820 590,1930" fill="none" stroke={INK} strokeWidth={27} strokeLinecap="round" />
        <path d="M540,1440 C560,1560 650,1590 640,1700 C632,1790 560,1820 590,1930" fill="none" stroke={COL.paw} strokeWidth={21} strokeLinecap="round" />
        {[0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map((u, i) => <circle key={i} cx={lerp(560, 600, u) + 40 * Math.sin(u * 5)} cy={1460 + u * 450} r={1.6} fill={COL.pawDeep} />)}
        {/* hind legs and feet (soles up) */}
        {[-1, 1].map((sd) => (
          <g key={`h${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
            <path d="M700,1280 C760,1300 790,1350 800,1420 C806,1470 780,1500 760,1480 C740,1440 720,1400 690,1370 Z" fill={COL.furBack} stroke={INK} strokeWidth={4} />
            <path d="M770,1410 C800,1440 826,1500 822,1556 C820,1586 796,1590 786,1566 C772,1520 756,1470 752,1430 Z" fill={COL.paw} stroke={INK} strokeWidth={4} />
            {[0, 1, 2, 3, 4].map((k) => <ellipse key={k} cx={790 + k * 9 - 12} cy={1572 + Math.abs(k - 2) * -4} rx={6} ry={9} fill={COL.paw} stroke={INK} strokeWidth={2.4} />)}
            <ellipse cx={792} cy={1500} rx={9} ry={14} fill={COL.pawDeep} opacity={0.45} />
          </g>
        ))}
        {/* forelimbs, folded up beside the chest */}
        {[-1, 1].map((sd) => (
          <g key={`f${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
            <path d="M680,800 C726,790 750,760 748,720 C746,700 726,698 716,716 C708,740 690,756 670,766 Z" fill={COL.furBack} stroke={INK} strokeWidth={4} />
            <ellipse cx={738} cy={700} rx={20} ry={16} fill={COL.paw} stroke={INK} strokeWidth={3.5} />
            {[-1, 0, 1, 2].map((k) => <ellipse key={k} cx={734 + k * 10} cy={684 - Math.abs(k - 0.5) * -3} rx={4.6} ry={7} fill={COL.paw} stroke={INK} strokeWidth={2.2} />)}
          </g>
        ))}
        {/* ears */}
        {[-1, 1].map((sd) => (
          <g key={`e${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
            <ellipse cx={700} cy={600} rx={74} ry={66} fill={COL.furBack} stroke={INK} strokeWidth={4.5} transform="rotate(-20 700 600)" />
            <ellipse cx={706} cy={598} rx={50} ry={44} fill={COL.pink} transform="rotate(-20 706 598)" />
            <path d="M676,586 C696,570 726,574 738,596" stroke={COL.pawDeep} strokeWidth={3} fill="none" opacity={0.5} />
          </g>
        ))}
        {/* body: grey back fur shows at the rim, cream belly fur facing up */}
        <path d={BODY_D} fill={COL.furBack} stroke={INK} strokeWidth={5} />
        <path d={BODY_D} fill={`url(#${id}-belly)`} transform="translate(540 960) scale(0.93 0.985) translate(-540 -960)" />
        <g clipPath={`url(#${id}-body)`}>
          {FURLINES.map((f, i) => (
            <path key={i} d={`M${f.x},${f.y} q${(6 * Math.sin(f.a)).toFixed(1)},6 ${(10 * Math.sin(f.a) + 2).toFixed(1)},14`} stroke={fur(0.9)} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.55} />
          ))}
          {/* chest/ribcage shading above the patch */}
          <path d="M420,830 C470,875 610,875 660,830" stroke={COL.furShade} strokeWidth={6} fill="none" opacity={0.55} />
        </g>
        {/* head details */}
        {[-1, 1].map((sd) => (
          <g key={`ey${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
            {/* closed eye (sedated): a calm lid line */}
            <path d="M586,602 C600,612 618,612 630,600" stroke={INK} strokeWidth={4.2} fill="none" strokeLinecap="round" />
            <path d="M592,596 C604,592 618,592 628,596" stroke={COL.furShade} strokeWidth={3} fill="none" opacity={0.7} />
          </g>
        ))}
        {/* ---------------- the shaved abdominal patch ---------------- */}
        <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill={COL.skin} />
        <g mask={`url(#${id}-patch)`}>
          <g filter={`url(#${id}-scatter)`} opacity={clamp(T * 1.15)}>
            <Anatomy t={s.t} />
          </g>
          {/* the skin: ordinary skin scatters (opaque); treated skin lets the anatomy through, with a red-orange cast */}
          <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill={COL.skin} opacity={skinA} />
          <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill={COL.dyeDeep} opacity={tintA} style={{mixBlendMode: 'multiply'}} />
          <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill="#FFB27A" opacity={0.14 * T} />
        </g>
        {/* skin thickens toward the neighbouring untreated skin: the clear area fades out under the fur edge */}
        <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill={`url(#${id}-rim)`} />
        <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill={COL.dyeDeep} opacity={0.1 * s.tint} style={{mixBlendMode: 'multiply'}} />
        {/* surface: always present over the patch, whatever its transmission */}
        <g clipPath={`url(#${id}-pclip)`}>
          {PORES.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={rgba('#8A4A44', 0.22 + 0.12 * T)} />)}
          {/* (no crease lines: on this patch any line can read as an incision) */}
          {/* broad soft sheen of an intact surface */}
          <ellipse cx={MC.x - 58} cy={MC.y - 96} rx={70} ry={120} fill="#FFF4EC" opacity={0.08} transform={`rotate(-18 ${MC.x - 58} ${MC.y - 96})`} style={{filter: 'blur(10px)'}} />
          {/* fresh solution on the surface (application) */}
          {s.coverage && s.coverage.length > 1 && (
            <g opacity={0.8}>
              <path d={crPath(s.coverage, false)} stroke={COL.dye} strokeWidth={96} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.55} style={{filter: 'blur(7px)'}} />
            </g>
          )}
          {s.film > 0 && (
            <g opacity={s.film}>
              <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill={COL.dye} opacity={0.5} />
              <ellipse cx={MC.x - 56} cy={MC.y - 100} rx={26} ry={70} fill="#FFF3C4" opacity={0.22} transform={`rotate(-18 ${MC.x - 56} ${MC.y - 100})`} style={{filter: 'blur(8px)'}} />
            </g>
          )}
          {/* rinse water: a clear sheet over the skin, beads, and a sheen running off toward the flanks (no streak
              lines: nothing on the surface may read as a scratch or a cut) */}
          {s.wet > 0 && (
            <g opacity={s.wet}>
              <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 6} ry={PATCH.ry + 6} fill="#E4F6FF" opacity={0.16} />
              <ellipse cx={MC.x - 30} cy={MC.y - 120 + ((s.t * 140) % 260)} rx={70} ry={46} fill="#FFFFFF" opacity={0.22} style={{filter: 'blur(14px)'}} />
              {BEADS.map((q, i) => (
                <g key={i}>
                  <circle cx={q.x} cy={q.y} r={q.r} fill="#E9F8FF" opacity={0.55} stroke="#7FB5CF" strokeWidth={1.4} />
                  <circle cx={q.x - q.r * 0.35} cy={q.y - q.r * 0.35} r={q.r * 0.35} fill="#FFFFFF" />
                </g>
              ))}
            </g>
          )}
          {/* raking light: moves across the intact surface ("without a cut") */}
          {s.sweep !== undefined && (
            <rect x={MC.x - 60 + s.sweep * 260} y={MC.y - 260} width={120} height={520} fill={`url(#${id}-sweep)`} transform={`rotate(14 ${MC.x} ${MC.y})`} />
          )}
        </g>
        {/* the fur edge around the shaved patch: continuous, no cut line */}
        <g>
          {STUBBLE.map((q, i) => <path key={i} d={`M${q.x.toFixed(1)},${q.y.toFixed(1)} L${q.x2.toFixed(1)},${q.y2.toFixed(1)}`} stroke={i % 4 ? COL.furShade : '#FFFFFF'} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />)}
        </g>
        {/* nose cone (anaesthesia: the mouse is sedated) over the snout, with its supply tube */}
        <path d="M540,0 C540,120 540,260 540,360" stroke={INK} strokeWidth={42} fill="none" />
        <path d="M540,0 C540,120 540,260 540,360" stroke="#C9D3DA" strokeWidth={34} fill="none" />
        <path d="M528,0 L528,360" stroke="#fff" strokeWidth={6} opacity={0.5} />
        <path d="M512,360 L568,360 L612,500 C590,520 490,520 468,500 Z" fill="#CFE3EC" fillOpacity={0.55} stroke={INK} strokeWidth={5} />
        <path d="M520,372 L486,494" stroke="#fff" strokeWidth={8} opacity={0.6} strokeLinecap="round" />
        <rect x={506} y={340} width={68} height={26} rx={6} fill={COL.cone} stroke={INK} strokeWidth={4} />
        <ellipse cx={540} cy={505} rx={72} ry={14} fill="none" stroke={INK} strokeWidth={4} />
        <ellipse cx={540} cy={470} rx={18} ry={12} fill={COL.nose} opacity={0.9} />
        {/* whiskers spread from the cone rim */}
        {[-1, 1].map((sd) => [0, 1, 2].map((k) => (
          <path key={`w${sd}${k}`} d={`M${540 + sd * 52},${508 + k * 6} q${sd * 50},${-6 + k * 8} ${sd * 110},${-20 + k * 22}`} stroke={INK} strokeWidth={2} fill="none" opacity={0.6} />
        )))}
      </g>
    </g>
  );
};
