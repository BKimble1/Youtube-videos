// The amber snail (Succinea / Oxyloma) in profile, crawling to the right, in snail-local units (foot sole on y = 0).
// Thin translucent amber shell (elongated, huge body whorl, short spire) carried obliquely on the back, soft grey-tan
// body that cannot fully withdraw into it, two pairs of tentacles: long upper eyestalks with the eyes at their tips
// (the far one normal, the near one swollen by the parasite: see eyestalk.tsx) and short lower tentacles.
import React from 'react';
import {closedPath, hash} from '../shared/lib';
import {lit, mix, shade} from '../shared/color';
import {INK} from '../shared/ink';
import {add, cubicArc, mul, nrm, P, poly, sub, V} from './geo';

const BODY = '#AC9E83';
const DARK = '#857A66';
const f2 = (n: number) => n.toFixed(2);

/** a small tapered tentacle tube along a cubic, gradient-shaded across */
const Tent: React.FC<{p0: P; p1: P; p2: P; p3: P; r0: number; r1: number; col: string; px: number; id: string; eye?: boolean}> = ({p0, p1, p2, p3, r0, r1, col, px, id, eye}) => {
  const n = 18;
  const {pts} = cubicArc(p0, p1, p2, p3, n);
  const L: P[] = [], R: P[] = [];
  pts.forEach((p, i) => {
    const tg = nrm(sub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)]));
    const nn = V(-tg.y, tg.x);
    const r = r0 + (r1 - r0) * (i / n);
    L.push(add(p, mul(nn, -r)));
    R.push(add(p, mul(nn, r)));
  });
  const tip = pts[n];
  const tg = nrm(sub(pts[n], pts[n - 2]));
  const cap = add(tip, mul(tg, r1));
  const d = closedPath([...L, cap, ...R.reverse()], 0.9);
  const mid = pts[n >> 1];
  const tgm = nrm(sub(pts[(n >> 1) + 1], pts[(n >> 1) - 1]));
  const nm = V(-tgm.y, tgm.x);
  const sgn = nm.x * -0.6 + nm.y * -0.8 > 0 ? 1 : -1;
  const rr = (r0 + r1) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(mid.x + nm.x * rr * sgn)} y1={f2(mid.y + nm.y * rr * sgn)} x2={f2(mid.x - nm.x * rr * sgn)} y2={f2(mid.y - nm.y * rr * sgn)}>
          <stop offset="0" stopColor={lit(col, 0.28)} />
          <stop offset="0.5" stopColor={col} />
          <stop offset="1" stopColor={shade(col, 0.4)} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} stroke={INK} strokeWidth={1.9 * px} strokeLinejoin="round" />
      {eye && (
        <g>
          <circle cx={f2(tip.x + tg.x * 2)} cy={f2(tip.y + tg.y * 2)} r={r1 * 1.18} fill={shade(col, 0.15)} stroke={INK} strokeWidth={1.6 * px} />
          <circle cx={f2(tip.x + tg.x * 4 + 2)} cy={f2(tip.y + tg.y * 4)} r={r1 * 0.55} fill="#121212" />
          <circle cx={f2(tip.x + tg.x * 4 + 0.6)} cy={f2(tip.y + tg.y * 4 - 1.4)} r={r1 * 0.18} fill="#FFFFFF" opacity={0.85} />
        </g>
      )}
    </g>
  );
};

// body outline (tail at left, head at right), snail-local units
const bodyPts = (t: number): P[] => {
  const b = Math.sin(t * 2.2) * 2.5; // slow head bob
  return [
    V(-462, -6), V(-430, -24), V(-370, -52), V(-300, -84), V(-220, -114), V(-120, -136), V(-20, -148), V(60, -154 + b * 0.3),
    V(130, -162 + b * 0.5), V(190, -178 + b * 0.8), V(240, -192 + b), V(292, -186 + b), V(328, -160 + b), V(348, -122 + b * 0.8),
    V(352, -84 + b * 0.6), V(344, -50 + b * 0.3), V(326, -26), V(300, -16), V(100, -14), V(-200, -12), V(-420, -9),
  ];
};

export const SHELL = {apex: V(-302, -414), ang: 38}; // apex position and axis angle (deg), shell length 408
const SH_TOP: [number, number][] = [[0, 0], [8, -5], [18, -9], [30, -15], [45, -20], [70, -33], [105, -48], [122, -62], [150, -80], [200, -95], [260, -101], [320, -93], [365, -70], [395, -34], [408, 2]];
const SH_BOT: [number, number][] = [[400, 30], [375, 72], [330, 106], [270, 122], [205, 116], [150, 96], [110, 68], [75, 42], [45, 24], [20, 11], [6, 4]];
const shellOutline = () => closedPath([...SH_TOP, ...SH_BOT].map(([x, y]) => V(x, y)), 0.95);
const topY = (x: number) => {
  for (let i = 1; i < SH_TOP.length; i++) if (x <= SH_TOP[i][0]) { const [a, ya] = SH_TOP[i - 1], [b, yb] = SH_TOP[i]; return ya + ((yb - ya) * (x - a)) / (b - a); }
  return 0;
};
const botY = (x: number) => {
  const B = [[0, 0] as [number, number], ...[...SH_BOT].reverse()];
  for (let i = 1; i < B.length; i++) if (x <= B[i][0]) { const [a, ya] = B[i - 1], [b, yb] = B[i]; return ya + ((yb - ya) * (x - a)) / (b - a); }
  return 0;
};

const Shell: React.FC<{px: number; t: number}> = ({px, t}) => {
  const d = shellOutline();
  // sutures: whorl boundaries slanting across the shell (short spire of about three whorls, huge last whorl)
  const sutX: [number, number][] = [[18, 27], [45, 60], [105, 132]];
  const sut = sutX.map(([x, xb], k) => {
    const a = V(x, topY(x)), b = V(xb, botY(xb));
    const m = V((a.x + b.x) / 2 + 8 + k * 6, (a.y + b.y) / 2);
    return `M${f2(a.x)},${f2(a.y)} Q${f2(m.x)},${f2(m.y)} ${f2(b.x)},${f2(b.y)}`;
  });
  // the convex face of each whorl just after its suture catches the light
  const bulge = sutX.map(([x, xb], k) => {
    const o = 8 + k * 5;
    const a = V(x + o, topY(x + o) + 2), b = V(xb + o, botY(xb + o) - 2);
    const m = V((a.x + b.x) / 2 + 10 + k * 6, (a.y + b.y) / 2);
    return `M${f2(a.x)},${f2(a.y)} Q${f2(m.x)},${f2(m.y)} ${f2(b.x)},${f2(b.y)}`;
  });
  // growth lines on the body whorl, parallel to the aperture lip
  const growth = Array.from({length: 15}, (_, k) => {
    const x = 150 + k * 16 + hash(k) * 5;
    const xb = Math.min(400, x + 40);
    const a = V(x, topY(x) + 3), b = V(xb, botY(xb) - 3);
    const m = V((a.x + b.x) / 2 + 18, (a.y + b.y) / 2);
    return `M${f2(a.x)},${f2(a.y)} Q${f2(m.x)},${f2(m.y)} ${f2(b.x)},${f2(b.y)}`;
  });
  const br = 0.5 + 0.5 * Math.sin(t * 1.6);
  const lip = 'M196,117 C262,96 330,72 400,28';
  return (
    <g transform={`translate(${SHELL.apex.x} ${SHELL.apex.y}) rotate(${SHELL.ang})`}>
      <defs>
        <clipPath id="h06-shell"><path d={d} /></clipPath>
        <linearGradient id="h06-shg" gradientUnits="userSpaceOnUse" x1="150" y1="-105" x2="230" y2="125">
          <stop offset="0" stopColor="#FADB8C" />
          <stop offset="0.3" stopColor="#E8B552" />
          <stop offset="0.75" stopColor="#BC7A2A" />
          <stop offset="1" stopColor="#8A5216" />
        </linearGradient>
        <radialGradient id="h06-shm" gradientUnits="userSpaceOnUse" cx="270" cy="20" r="150">
          <stop offset="0" stopColor="#77705A" />
          <stop offset="1" stopColor="#3C382A" />
        </radialGradient>
        <radialGradient id="h06-shl" gradientUnits="userSpaceOnUse" cx="190" cy="-60" r="160">
          <stop offset="0" stopColor="#FFF4D2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF4D2" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* what shows through the thin shell: the mottled mantle in the last whorl, the digestive gland up the spire */}
      <g clipPath="url(#h06-shell)">
        <rect x={-20} y={-130} width={450} height={270} fill="#93703A" />
        <path d="M118,-70 C200,-104 330,-96 404,-6 C392,70 330,124 240,126 C170,116 120,40 118,-70Z" fill="url(#h06-shm)" />
        <path d="M0,0 C30,-14 90,-36 140,-52 C128,-6 120,36 124,84 C64,44 20,14 0,0Z" fill="#6A4422" />
        {Array.from({length: 30}, (_, k) => (
          <circle key={k} cx={f2(150 + hash(k * 2.1) * 240)} cy={f2(-74 + hash(k * 3.7) * 170)} r={f2(3 + hash(k * 5.3) * 7)} fill="#D2BC74" opacity={0.32} />
        ))}
        {/* the translucent amber shell itself */}
        <path d={d} fill="url(#h06-shg)" opacity={0.8} />
        <path d={d} fill="url(#h06-shl)" />
        {bulge.map((s, k) => <path key={k} d={s} fill="none" stroke="#FFE7A8" strokeWidth={7} opacity={0.32} />)}
        {sut.map((s, k) => <path key={k} d={s} fill="none" stroke="#6E4210" strokeWidth={9} opacity={0.18} transform="translate(-4 0)" />)}
        {growth.map((g, k) => <path key={k} d={g} fill="none" stroke="#8A5A1E" strokeWidth={1.3} opacity={0.3} />)}
        {/* aperture: the body inside the wide opening at the lower edge of the last whorl */}
        <path d={`${lip} C392,72 330,128 240,132 C220,130 205,126 196,117Z`} fill={mix(BODY, '#C99A48', 0.3)} />
        {/* glossy sheen */}
        <path d="M40,-16 C100,-46 190,-82 280,-88" fill="none" stroke="#FFF6E0" strokeWidth={11} strokeLinecap="round" opacity={0.36} />
        <path d="M70,-26 C130,-52 200,-74 260,-80" fill="none" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" opacity={0.55 + 0.12 * br} />
        <ellipse cx={300} cy={-62} rx={16} ry={6} fill="#FFFFFF" opacity={0.5} transform="rotate(-6 300 -62)" />
      </g>
      {sut.map((s, k) => <path key={k} d={s} fill="none" stroke="#5E360E" strokeWidth={f2(1.7 * px)} opacity={0.9} />)}
      <path d={lip} fill="none" stroke="#6A3E12" strokeWidth={f2(1.6 * px)} opacity={0.85} />
      <path d={d} fill="none" stroke={INK} strokeWidth={f2(2.2 * px)} strokeLinejoin="round" />
    </g>
  );
};

export const SnailBehind: React.FC<{t: number; px: number}> = ({t, px}) => {
  const b = Math.sin(t * 2.2) * 2.5;
  const sw = 0.06 * Math.sin(t * 1.3 + 0.4);
  return (
    <g>
      {/* far upper tentacle (a normal eyestalk, eye at its tip) and far lower tentacle */}
      <Tent id="h06-tf" p0={V(206, -176 + b)} p1={V(196, -232 + b)} p2={V(190 - 30 * sw, -290 + b)} p3={V(196 - 70 * sw, -346 + b)} r0={13} r1={8} col={shade(DARK, 0.1)} px={px} eye />
      <Tent id="h06-tlf" p0={V(338, -100 + b)} p1={V(350, -100 + b)} p2={V(360, -98 + b)} p3={V(370, -96 + b)} r0={10} r1={7} col={shade(DARK, 0.25)} px={px} />
    </g>
  );
};

export const SnailBody: React.FC<{t: number; px: number}> = ({t, px}) => {
  const pts = bodyPts(t);
  const d = closedPath(pts, 1);
  const footD = closedPath([V(-472, -4), V(-300, -24), V(0, -30), V(300, -30), V(356, -26), V(378, -14), V(380, 0), V(360, 6), V(250, 8), V(0, 9), V(-300, 7), V(-462, 3)], 0.9);
  const b = Math.sin(t * 2.2) * 2.5;
  // pedal waves: soft bands running forward along the foot skirt
  const waves = Array.from({length: 11}, (_, k) => (((k * 72 + t * 95) % 792) + 792) % 792 - 462);
  // skin: a fine net of grooves (short irregular furrows) and darker mottling
  const grooves = Array.from({length: 46}, (_, k) => {
    const x = -440 + hash(k * 1.7) * 770;
    const topAt = x < -200 ? -20 - (x + 462) * 0.34 : x < 0 ? -125 : -150 - Math.max(0, x - 100) * 0.2;
    const y = topAt + 12 + hash(k * 2.3) * Math.max(10, -topAt - 30);
    const l = 14 + hash(k * 3.9) * 18;
    return `M${f2(x)},${f2(y)} q${f2(l * 0.4)},${f2(l * 0.2)} ${f2(l * 0.7)},${f2(l * 0.8)}`;
  });
  return (
    <g>
      <defs>
        <linearGradient id="h06-bg1" gradientUnits="userSpaceOnUse" x1="80" y1="-180" x2="150" y2="14">
          <stop offset="0" stopColor={lit(BODY, 0.36)} />
          <stop offset="0.42" stopColor={BODY} />
          <stop offset="1" stopColor={shade(BODY, 0.5)} />
        </linearGradient>
        <radialGradient id="h06-bg2" gradientUnits="userSpaceOnUse" cx="230" cy="-140" r="120">
          <stop offset="0" stopColor="#FFF4DE" stopOpacity="0.34" />
          <stop offset="1" stopColor="#FFF4DE" stopOpacity="0" />
        </radialGradient>
        <clipPath id="h06-body"><path d={d} /></clipPath>
        <clipPath id="h06-foot"><path d={footD} /></clipPath>
        <radialGradient id="h06-hd">
          <stop offset="0" stopColor={DARK} stopOpacity="0.45" />
          <stop offset="0.6" stopColor={DARK} stopOpacity="0.3" />
          <stop offset="1" stopColor={DARK} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h06-ft" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="9">
          <stop offset="0" stopColor={lit(BODY, 0.42)} />
          <stop offset="1" stopColor={shade(BODY, 0.2)} />
        </linearGradient>
      </defs>
      {/* the foot: a broad muscular sole whose margin shows below the body, a rounded lip in front of the head */}
      <path d={footD} fill="url(#h06-ft)" stroke={INK} strokeWidth={f2(2.1 * px)} strokeLinejoin="round" />
      <g clipPath="url(#h06-foot)">
        {waves.map((x, k) => <path key={k} d={`M${f2(x)},-24 q9,10 4,30`} fill="none" stroke={shade(BODY, 0.35)} strokeWidth={7} opacity={0.22} strokeLinecap="round" />)}
        <path d="M-470,-9 C-200,-20 100,-24 360,-20" fill="none" stroke="#FFF6EA" strokeWidth={2.6} opacity={0.5} />
      </g>
      <path d={d} fill="url(#h06-bg1)" />
      <g clipPath="url(#h06-body)">
        {/* darker head and dorsal stripe */}
        <ellipse cx={290} cy={-140} rx={150} ry={95} fill="url(#h06-hd)" />
        <path d={`M20,-148 C120,-156 190,-176 236,-${188 - b}`} fill="none" stroke={shade(DARK, 0.35)} strokeWidth={5} opacity={0.35} />
        <path d={d} fill="url(#h06-bg2)" />
        {grooves.map((g, k) => <path key={k} d={g} fill="none" stroke={shade(BODY, 0.6)} strokeWidth={1.8} opacity={0.26} strokeLinecap="round" />)}
        {Array.from({length: 30}, (_, k) => (
          <circle key={k} cx={f2(-430 + hash(k * 1.7 + 0.3) * 760)} cy={f2(-12 - hash(k * 2.9) * 130)} r={f2(2.4 + hash(k * 4.1) * 5)} fill={shade(BODY, 0.55)} opacity={0.2} />
        ))}

        {/* mouth */}
        <path d={`M348,${f2(-56 + b * 0.5)} q-6,9 -15,11`} fill="none" stroke={INK} strokeWidth={2} opacity={0.7} />
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={f2(2.3 * px)} strokeLinejoin="round" />
      <Shell px={px} t={t} />
    </g>
  );
};

export const SnailFront: React.FC<{t: number; px: number}> = ({t, px}) => {
  const b = Math.sin(t * 2.2) * 2.5;
  const w = 3 * Math.sin(t * 1.7);
  return <Tent id="h06-tln" p0={V(340, -86 + b)} p1={V(354, -84 + b)} p2={V(366, -78 + b + w * 0.5)} p3={V(380, -72 + b + w)} r0={11} r1={7.5} col={DARK} px={px} />;
};
