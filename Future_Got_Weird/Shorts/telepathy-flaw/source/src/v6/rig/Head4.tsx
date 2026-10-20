// V4 head: the Weird Crew head (tall oval, ink contour, side ear, white-sclera eyes with ink pupils, thick brows, hook
// nose, drawn mouth, coral cheeks) with a REAL yaw. Every facial feature sits on one 3-D face (eyes, nose, mouth,
// cheeks, ear) and is projected for the chosen yaw, so the views are coherent by construction:
//   yaw 0   = facing the camera (both eyes, nose centred)
//   yaw ~35 = three-quarter (far eye narrowed, its inner corner behind the nose bridge)
//   yaw 90  = true profile (far eye and far cheek hidden, nose and lips on the contour, the ear in the middle)
// The hair is a 3-D shell (a flat-topped crown with six spikes for the guesser, a rounded bob with a swept fringe for
// the fact-checker) cut by a hairline and projected the same way, split into a back layer (behind the skull) and a
// front layer (over it). The head always turns toward screen-left; `flip` mirrors the whole drawing (the light is
// mirrored with it, so it stays upper-left on screen). Expression: lib Expr (art/Head.tsx); gaze gx/gy is in SCREEN
// terms (gx < 0 = looks screen-left) and is converted here.
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {INK, Inked, InkLine, InkPath, useInk} from '../../lib/ink';
import {add, clamp, fmt, lerp, mul, P, rad, rot, V} from '../../lib/math';
import {LIGHT} from '../../lib/shade';
import {CREW, Expr} from '../../art/Head';

export type HeadStyle = 'spiky' | 'bob';

export type Head4Props = {
  id: string;
  c: V;
  /** head radius in world units */
  R: number;
  /** in-plane roll (deg, + = clockwise on screen) */
  roll: number;
  /** yaw in degrees: 0 = front, 35 = three-quarter, 90 = profile (toward screen-left unless flipped) */
  yaw: number;
  expr: Expr;
  blink?: number;
  skin?: string;
  hair?: string;
  inkW?: number;
  hairSway?: number;
  flip?: boolean;
  style?: HeadStyle;
  glasses?: boolean;
  /** drawn in head space over everything (e.g. the implant) */
  overlay?: React.ReactNode;
  /** head-space layer drawn over the hair, under the face features */
  underlay?: React.ReactNode;
};

const Q = (a: V, c: V, b: V) => `M${P(a)} Q${P(c)} ${P(b)}`;
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Catmull-Rom closed smooth path */
const smoothClosed = (pts: V[]) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + ' Z';
};
const polyD = (pts: V[]) => `M${pts.map(P).join(' L')} Z`;

/** convex hull (monotone chain) */
const hull = (pts: V[]): V[] => {
  const s = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [];
  for (const p of s) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: V[] = [];
  for (const p of [...s].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

const SKULL_RX = 100;
const SKULL_RY = 107;
const skullHalfW = (y: number) => SKULL_RX * Math.sqrt(Math.max(0, 1 - (y / SKULL_RY) ** 2));

// ---------------------------------------------------------------------------------------------------------------
// hair shells
// ---------------------------------------------------------------------------------------------------------------
type Shell = {
  /** half-width of the shell at height y (head units) */
  r: (y: number) => number;
  top: number;
  /** lowest hair height on the shell at azimuth a (deg, 0 = front, + = toward the viewer's left at yaw 0) */
  low: (a: number) => number;
};
const wrap = (a: number) => {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  if (x === -180) x = 180;
  return x;
};
const SPIKY: Shell = {
  // a rounded red cap (as the Death Clock man's), cylindrical down to the hairline and domed above y = -64
  r: (y) => (y >= -64 ? 98 : 98 * Math.sqrt(Math.max(0, 1 - ((-64 - y) / 54) ** 2))),
  top: -118,
  // hairline: low in the middle of the forehead, rising to the temples, dipping again behind the ear toward the nape
  low: (a) => {
    const q = Math.abs(wrap(a));
    return q <= 90 ? -62 + 41 * sstep(0, 90, q) : -21 + 38 * sstep(90, 180, q);
  },
};
const BOB: Shell = {
  r: (y) => 116 * Math.sqrt(Math.max(0, 1 - (y / 122) ** 2)),
  top: -120,
  // swept fringe over the forehead (high in the middle, down at the temples), side locks hanging to the jaw and a
  // straight hem behind the head
  low: (a) => {
    const q = Math.abs(wrap(a));
    return q <= 90 ? -70 + 52 * sstep(0, 90, q) : -18 + 76 * sstep(90, 132, q);
  },
};

/** polygon of the hair seen over azimuths a = yaw+phi, phi in [p0, p1] (monotone); phi in (-90,90) = the near face of the shell. */
const shellPoly = (sh: Shell, yaw: number, p0: number, p1: number, n = 26): V[] => {
  const lowPts: V[] = [];
  for (let i = 0; i <= n; i++) {
    const phi = lerp(p0, p1, i / n);
    const a = yaw + phi;
    const y = sh.low(a);
    lowPts.push({x: sh.r(y) * Math.sin(rad(phi)), y});
  }
  // the limbs: dome outline from the lowest hair at each limb up to the top and over
  const yR = lowPts[lowPts.length - 1].y;
  const yL = lowPts[0].y;
  const side = (y0: number, sign: number, up: boolean): V[] => {
    const pts: V[] = [];
    const m = 10;
    for (let i = 0; i <= m; i++) {
      const y = up ? lerp(y0, sh.top, i / m) : lerp(sh.top, y0, i / m);
      pts.push({x: sign * sh.r(y), y});
    }
    return pts;
  };
  const sgn = Math.sign(Math.sin(rad(p1)) - Math.sin(rad(p0))) || 1;
  // x of the first and last lowPts decide which limb is which
  const first = lowPts[0].x;
  const last = lowPts[lowPts.length - 1].x;
  const rightIsLast = last >= first;
  const rightY = rightIsLast ? yR : yL;
  const leftY = rightIsLast ? yL : yR;
  const rightUp = side(rightY, 1, true);
  const leftDown = side(leftY, -1, false);
  const topEdge: V[] = [];
  const mt = 8;
  for (let i = 1; i < mt; i++) {
    const x = lerp(1, -1, i / mt) * sh.r(sh.top + 0.01 + (sh === SPIKY ? 0 : 0));
    topEdge.push({x: x === 0 ? 0 : x, y: sh.top - (sh === SPIKY ? 7 * (1 - Math.abs(i / mt * 2 - 1) ** 2) : 0)});
  }
  void sgn;
  // order lowPts so that x ascends (left to right), then up the right limb, across the top (right to left), down the left limb
  const lowAsc = rightIsLast ? lowPts : [...lowPts].reverse();
  const out: V[] = [...lowAsc, ...rightUp.slice(1), ...topEdge, ...leftDown.slice(0, -1)];
  return out;
};

// six fat spikes on the dome: (azimuth, root radius and height on the dome, length, outward lean)
const ringSpikes = [
  {a: 30, len: 66, r: 62, y: -104, lean: 0.35, bw: 30},
  {a: -30, len: 66, r: 62, y: -104, lean: 0.35, bw: 30},
  {a: 90, len: 52, r: 92, y: -80, lean: 0.9, bw: 24},
  {a: -90, len: 52, r: 92, y: -80, lean: 0.9, bw: 24},
  {a: 150, len: 56, r: 66, y: -102, lean: 0.4, bw: 28},
  {a: -150, len: 56, r: 66, y: -102, lean: 0.4, bw: 28},
];

export const Head4: React.FC<Head4Props> = ({id, c, R, roll, yaw: yawIn, expr: e, blink = 0, skin = CREW.skin, hair = CREW.hair, inkW = 7, hairSway = 0, flip = false, style = 'spiky', glasses = false, overlay, underlay}) => {
  let Lc = rot(LIGHT, -roll);
  if (flip) Lc = {x: -Lc.x, y: Lc.y};
  const s = R / 100;
  const yaw = clamp(yawIn, 0, 95);
  const th = rad(yaw);
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const fw = inkW * 0.74;
  const X = (l: number, z: number) => l * cs - z * sn;
  const D = (l: number, z: number) => l * sn + z * cs;
  // gaze (screen terms -> head terms: the head is drawn facing screen-left, `flip` mirrors it)
  const gxL = flip ? -e.gx : e.gx;

  const rg = (gid: string, cx: number, cy: number, r: number, focal: number, stops: [number, string, number?][]) => {
    const f = add({x: cx, y: cy}, mul(Lc, r * focal));
    return (
      <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} fx={fmt(f.x)} fy={fmt(f.y)}>
        {stops.map(([o, col, a], i) => (
          <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />
        ))}
      </radialGradient>
    );
  };
  const lightPt = (r: number, cx = 0, cy = 0) => add({x: cx, y: cy}, mul(Lc, r));

  const headD = `M0,-107 C55,-107 100,-60 100,0 C100,60 55,107 0,107 C-55,107 -100,60 -100,0 C-100,-60 -55,-107 0,-107 Z`;

  // --- face features on the 3-D face (l = lateral, + = viewer's right at yaw 0; z = toward the front)
  const EYE_Y = -10;
  const eyeN = {x: X(37, 90), w: clamp(D(37, 90) / 90, 0, 1)};
  const eyeF = {x: X(-37, 90), w: clamp(D(-37, 90) / 90, 0, 1)};
  const farVisible = eyeF.w > 0.07;
  const L = clamp(e.lid + (blink + e.shut) * (1 - e.lid));
  const sq = clamp(e.squint + e.shut * 0.4);

  // nose wedge (3-D): root between the eyes, tip, and the two nostril wings
  const noseRoot = {x: X(0, 95), y: -8};
  const noseTip = {x: X(0, 121), y: 26};
  const noseWL = {x: X(-14, 101), y: 33};
  const noseWR = {x: X(14, 101), y: 33};
  const noseRL = {x: X(-6, 97), y: -4};
  const noseRR = {x: X(6, 97), y: -4};
  const noseTipT = {x: X(0, 118), y: 15};
  const noseTipB = {x: X(0, 117), y: 34};
  const noseHull = hull([noseRoot, noseTip, noseTipT, noseTipB, noseWL, noseWR, noseRL, noseRR]);
  // lips and chin: a small bump on the lower face so a profile has lips and a chin (inside the skull in the front view)
  const faceHull = hull([{x: X(-18, 88), y: 40}, {x: X(18, 88), y: 40}, {x: X(0, 94), y: 50}, {x: X(0, 90), y: 64}, {x: X(0, 78), y: 80}, {x: X(-14, 76), y: 80}, {x: X(14, 76), y: 80}]);
  const noseD = smoothClosed(noseHull);
  const noseOut = Math.min(0, noseTip.x - noseRoot.x); // how far the tip sticks out toward the face front

  // mouth: the far corner on the face surface, the near corner recessed (so in profile the lips are a short line on
  // the contour running into the cheek)
  const edgeAtMouth = skullHalfW(54);
  const mxFar = Math.max(X(-28 * e.wide, 92), -(edgeAtMouth + 3 * sn));
  const mxNear = X(28 * e.wide, 80);
  const mxL = Math.min(mxFar, mxNear);
  const mxR = Math.max(mxFar, mxNear);
  const mcx = (mxL + mxR) / 2;
  const my = 54;
  const cornerY = my - e.smile * 10;
  const o = e.open;
  const upY = my - 2 - o * 6 - Math.max(0, e.smile) * 2;
  const loY = my + 4 + o * 46 + Math.max(0, e.smile) * 12;
  const mxA = mxL;
  const mxB = mxR;
  const mxC = mcx;
  const mouthD = `M${fmt(mxA)},${fmt(cornerY)} Q${fmt(mxC)},${fmt(upY - (cornerY - my) * 0.6)} ${fmt(mxB)},${fmt(cornerY)} Q${fmt(mxC)},${fmt(loY)} ${fmt(mxA)},${fmt(cornerY)} Z`;
  const clenched = e.teeth > 0.5 && o < 0.62;
  const mw = (mxB - mxA) / 2;

  // cheeks
  const cheekN = {x: X(60, 72), vis: D(60, 72) > 0};
  const cheekF = {x: X(-60, 72), vis: D(-60, 72) > 6};

  // ears
  const earKx = 0.55 + 0.55 * sn;
  const earN = X(102, -8);
  const earF = X(-102, -8);
  const ear = (x: number, k: number) =>
    `M${fmt(x - 8 * k)},-16 C${fmt(x + 10 * k)},-24 ${fmt(x + 22 * k)},-8 ${fmt(x + 20 * k)},8 C${fmt(x + 19 * k)},22 ${fmt(x + 12 * k)},34 ${fmt(x + 3 * k)},36 C${fmt(x - 4 * k)},37 ${fmt(x - 9 * k)},32 ${fmt(x - 10 * k)},26 L${fmt(x - 12 * k)},-8 Z`;
  const earRim = (x: number, k: number) => `M${fmt(x - 2 * k)},-10 C${fmt(x + 9 * k)},-13 ${fmt(x + 14 * k)},0 ${fmt(x + 12 * k)},11 C${fmt(x + 11 * k)},19 ${fmt(x + 6 * k)},26 ${fmt(x)},27`;
  // the near ear sits on the side of the head: at yaw 0 it sticks out of the contour, at 90 it lies inside it
  const earNx = lerp(earN, earN - 4, sn);
  const farEarOn = yaw < 14;

  // --- hair
  const shell = style === 'bob' ? BOB : SPIKY;
  const frontPoly = shellPoly(shell, yaw, -90, 90);
  const backPoly = shellPoly(shell, yaw, 90, 270);
  const sw = (k: number) => rot({x: 0, y: -1}, hairSway * k);
  const spikes = style === 'spiky' ? ringSpikes.map((sp) => {
    const phi = wrap(sp.a - yaw);
    const sphi = Math.sin(rad(phi));
    const x = sp.r * sphi;
    const front = Math.cos(rad(phi)) > 0;
    const dirv = sw(1);
    const len = sp.len * (front ? 1 : 0.88);
    const lean = sphi * sp.lean;
    const baseY = sp.y;
    const tip = {x: x + (dirv.x + lean) * len, y: baseY + dirv.y * len + 6};
    const bw = sp.bw * (0.75 + 0.25 * Math.abs(Math.cos(rad(phi))));
    return {front, d: `M${P({x: x - bw, y: baseY + 12})} Q${P({x: x - bw * 0.35, y: baseY - len * 0.4})} ${P(tip)} Q${P({x: x + bw * 0.45, y: baseY - len * 0.35})} ${P({x: x + bw, y: baseY + 12})} Z`, tip, base: {x, y: baseY}, phi, len};
  }) : [];

  const Eye = (k: 'n' | 'f', ex: number, wf: number, side: 1 | -1) => {
    const rx = 21 * Math.max(wf, 0.2);
    const ry = 23;
    const eyeD = `M${fmt(ex - rx)},${EYE_Y} C${fmt(ex - rx)},${fmt(EYE_Y - ry * 1.33)} ${fmt(ex + rx)},${fmt(EYE_Y - ry * 1.33)} ${fmt(ex + rx)},${EYE_Y} C${fmt(ex + rx)},${fmt(EYE_Y + ry * 1.33)} ${fmt(ex - rx)},${fmt(EYE_Y + ry * 1.33)} ${fmt(ex - rx)},${EYE_Y} Z`;
    const topY = EYE_Y - ry + L * ry * 2.05;
    const botY = EYE_Y + ry - sq * ry * 0.95;
    const closed = L > 0.9 || botY - topY < 4;
    if (closed) {
      const ch = e.shut;
      const inner = side;
      const tipX = ex - inner * rx * 0.9;
      const d =
        ch > 0.35
          ? `M${fmt(ex + inner * rx * 0.85)},${fmt(EYE_Y - 11 * ch)} L${fmt(tipX)},${fmt(EYE_Y + 2)} L${fmt(ex + inner * rx * 0.85)},${fmt(EYE_Y + 13 * ch)}`
          : Q({x: ex - rx, y: EYE_Y + 2}, {x: ex, y: EYE_Y + 12}, {x: ex + rx, y: EYE_Y + 2});
      return <InkLine key={k} d={d} w={fw * 1.15} />;
    }
    const pr = 10.5 * e.pupil;
    const u = clamp(gxL * 0.75 - sn * 0.55, -1, 1);
    const ix = ex + u * Math.max(0, rx - pr * Math.max(0.45, wf) * 0.55);
    const iy = EYE_Y + 2 + e.gy * ry * 0.38;
    const prx = pr * Math.max(0.5, wf);
    return (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD} />
          </clipPath>
          {rg(`${id}-ew${k}`, ex, EYE_Y - 4, ry * 1.4, 0.4, [
            [0, '#FFFFFF'],
            [0.55, '#F6F8FA'],
            [1, '#C9D5DE'],
          ])}
        </defs>
        <Inked w={fw * 0.85}>
          <InkPath d={eyeD} fill={`url(#${id}-ew${k})`} />
        </Inked>
        <g clipPath={`url(#${id}-ec${k})`}>
          <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(prx)} ry={fmt(pr)} fill={INK} />
          <circle cx={fmt(ix + prx * 0.38)} cy={fmt(iy - pr * 0.42)} r={fmt(Math.min(prx, pr) * 0.34 + 0.6)} fill="#FFFFFF" />
          <circle cx={fmt(ix - prx * 0.36)} cy={fmt(iy + pr * 0.36)} r={fmt(Math.min(prx, pr) * 0.15 + 0.3)} fill="#FFFFFF" opacity={0.85} />
          <rect x={fmt(ex - rx - 4)} y={fmt(topY)} width={fmt(rx * 2 + 8)} height={7} fill="#5E7486" opacity={0.18} />
          <path d={`M${fmt(ex - rx - 4)},${fmt(EYE_Y - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(EYE_Y - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(topY + 1)} Q${fmt(ex)},${fmt(topY - 6 * (1 - L))} ${fmt(ex - rx - 4)},${fmt(topY + 1)} Z`} fill={mix(skin, shade(skin, 0.2), 0.5)} />
          <path d={`M${fmt(ex - rx - 4)},${fmt(EYE_Y + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(EYE_Y + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(botY)} Q${fmt(ex)},${fmt(botY + 6)} ${fmt(ex - rx - 4)},${fmt(botY)} Z`} fill={lit(skin, 0.06)} />
        </g>
        {L > 0.04 && <InkLine d={Q({x: ex - rx - 1, y: topY + 1}, {x: ex, y: topY - 6 * (1 - L)}, {x: ex + rx + 1, y: topY + 1})} w={fw} />}
        {sq > 0.08 && <InkLine d={Q({x: ex - rx * 0.9, y: botY}, {x: ex, y: botY + 6}, {x: ex + rx * 0.9, y: botY})} w={fw * 0.7} opacity={clamp(sq * 2)} />}
      </g>
    );
  };

  const Brow = (k: 'n' | 'f', ex: number, wf: number, inner: 1 | -1) => {
    const by = -50 + e.browDown * 9;
    const w = 22 * Math.max(wf, 0.25);
    const innerX = ex + inner * w * 0.95;
    const outerX = ex - inner * w * 1.05;
    const innerY = by - e.browIn * 17 + e.browDown * 5;
    const outerY = by + e.browIn * 5 - e.browDown * 1;
    const midY = (innerY + outerY) / 2 - 5 + e.browDown * 2;
    return <InkLine key={`b${k}`} d={Q({x: outerX, y: outerY}, {x: ex, y: midY}, {x: innerX, y: innerY})} w={inkW * 1.35} />;
  };

  const pass = useInk().pass;
  const noseK = sstep(0, 1, 1); // nose is always the filled wedge; the hook line below carries the 3/4 contour

  const body = (
    <>
      <defs>
        {rg(`${id}-sk`, -6, -8, 126, 0.52, [
          [0, lit(skin, 0.32)],
          [0.4, lit(skin, 0.08)],
          [0.74, skin],
          [0.93, shade(skin, 0.22)],
          [1, shade(skin, 0.3)],
        ])}
        {rg(`${id}-hr`, -10, -90, 130, 0.6, [
          [0, lit(hair, 0.38)],
          [0.45, hair],
          [1, shade(hair, 0.42)],
        ])}
        {rg(`${id}-ear`, 0, 10, 30, 0.5, [
          [0, lit(skin, 0.24)],
          [0.7, skin],
          [1, shade(skin, 0.28)],
        ])}
        <radialGradient id={`${id}-ck`}>
          <stop offset="0" stopColor={CREW.cheek} stopOpacity={0.75} />
          <stop offset="0.55" stopColor={CREW.cheek} stopOpacity={0.45} />
          <stop offset="1" stopColor={CREW.cheek} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-mo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A1720" />
          <stop offset="1" stopColor="#8A2C36" />
        </linearGradient>
        <clipPath id={`${id}-hc`}>
          <path d={headD} />
        </clipPath>
        <clipPath id={`${id}-mc`}>
          <path d={mouthD} />
        </clipPath>
      </defs>

      {/* hair behind the skull: the far/back half of the shell and the back spikes */}
      <Inked w={inkW}>
        <InkPath d={style === 'bob' ? smoothClosed(backPoly) : polyD(backPoly)} fill={`url(#${id}-hr)`} />
        {spikes.filter((q) => !q.front).map((q, i) => (
          <InkPath key={i} d={q.d} fill={`url(#${id}-hr)`} />
        ))}
      </Inked>
      {/* far ear (only near the front view) */}
      {farEarOn && (
        <Inked w={inkW * 0.9}>
          <InkPath d={ear(earF, -(1 - yaw / 14) * earKx)} fill={`url(#${id}-ear)`} />
        </Inked>
      )}
      {/* head with the near ear and the nose wedge in the same contour group (one silhouette) */}
      <Inked w={inkW}>
        <InkPath d={headD} fill={`url(#${id}-sk)`} />
        <InkPath d={ear(earNx, earKx)} fill={`url(#${id}-ear)`} />
        <InkPath d={noseD} fill={`url(#${id}-sk)`} />
        <InkPath d={smoothClosed(faceHull)} fill={`url(#${id}-sk)`} />
      </Inked>
      {pass !== 'ink' && (
        <g clipPath={`url(#${id}-hc)`}>
          <ellipse cx={18} cy={118} rx={110} ry={44} fill={shade(skin, 0.4)} opacity={0.22} />
          <path d="M100,-10 C100,60 55,107 0,107 C50,96 88,56 94,-10 Z" fill="#CFE3F2" opacity={0.28} />
          <ellipse cx={0} cy={-66} rx={108} ry={20} fill={shade(skin, 0.45)} opacity={0.2} />
          {cheekN.vis && <ellipse cx={fmt(cheekN.x)} cy={30} rx={fmt(21 * clamp(D(60, 72) / 72, 0.35, 1))} ry={17} fill={`url(#${id}-ck)`} opacity={0.55 + 0.45 * e.flush} />}
          {cheekF.vis && <ellipse cx={fmt(cheekF.x)} cy={30} rx={fmt(18 * clamp(D(-60, 72) / 72, 0.3, 1))} ry={16} fill={`url(#${id}-ck)`} opacity={0.5 + 0.45 * e.flush} />}
        </g>
      )}
      {pass !== 'ink' && (
        <g>
          {/* near ear: shaded hollow and rim */}
          <ellipse cx={fmt(earNx + 5 * earKx)} cy={11} rx={fmt(6 * earKx)} ry={11} fill={shade(skin, 0.3)} opacity={0.45} />
          <path d={earRim(earNx, earKx)} fill="none" stroke={shade(skin, 0.42)} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
          {/* nose shading: the far-side plane in shadow, a glossy tip */}
          <path d={smoothClosed(hull([noseRoot, noseTip, noseWL, noseWR]))} fill={shade(skin, 0.3)} opacity={0.12 + 0.12 * sn} />
        </g>
      )}
      {/* hair in front of the skull */}
      <Inked w={inkW}>
        <InkPath d={style === 'bob' ? smoothClosed(frontPoly) : polyD(frontPoly)} fill={`url(#${id}-hr)`} />
        {spikes.filter((q) => q.front).map((q, i) => (
          <InkPath key={i} d={q.d} fill={`url(#${id}-hr)`} />
        ))}
      </Inked>
      {pass !== 'ink' && style === 'bob' && (
        <g>
          <ellipse cx={fmt(lerp(-38, -10, sn) )} cy={-96} rx={30} ry={6} transform={`rotate(-14 ${fmt(lerp(-38, -10, sn))} -96)`} fill="#FFFFFF" opacity={0.4} />
        </g>
      )}
      {pass !== 'ink' && style === 'spiky' && (
        <g>
          {spikes.filter((q) => q.front).slice(0, 3).map((q, i) => {
            const m = {x: q.base.x * 0.9 + (q.tip.x - q.base.x) * 0.45 - 5, y: q.base.y + (q.tip.y - q.base.y) * 0.5};
            const ang = (Math.atan2(q.tip.y - q.base.y, q.tip.x - q.base.x) * 180) / Math.PI;
            return <ellipse key={i} cx={fmt(m.x)} cy={fmt(m.y)} rx={fmt(q.len * 0.26)} ry={4.2} transform={`rotate(${fmt(ang)} ${fmt(m.x)} ${fmt(m.y)})`} fill="#FFFFFF" opacity={0.5} />;
          })}
          <ellipse cx={fmt(-34 * cs - 6 * sn)} cy={-84} rx={26} ry={6} transform={`rotate(-12 ${fmt(-34 * cs - 6 * sn)} -84)`} fill="#FFFFFF" opacity={0.3} />
        </g>
      )}
      {pass !== 'ink' && underlay && <g clipPath={`url(#${id}-hc)`}>{underlay}</g>}
      {e.browIn > 0.5 && (
        <g opacity={clamp((e.browIn - 0.5) * 2)}>
          <InkLine d={Q({x: X(0, 90) - 14 * cs, y: -86}, {x: X(0, 90), y: -91}, {x: X(0, 90) + 14 * cs, y: -86})} w={fw * 0.7} />
        </g>
      )}
      {farVisible && Eye('f', eyeF.x, eyeF.w, -1)}
      {Eye('n', eyeN.x, eyeN.w, 1)}
      {glasses && (
        <g>
          {farVisible && <path d={`M${fmt(eyeF.x + 30 * eyeF.w)},${EYE_Y - 2} Q${fmt((eyeF.x + eyeN.x) / 2)},${EYE_Y - 9} ${fmt(eyeN.x - 30 * eyeN.w)},${EYE_Y - 2}`} fill="none" stroke={INK} strokeWidth={fw * 1.1} strokeLinecap="round" />}
          {/* temple arm from the near lens back to the ear */}
          <path d={`M${fmt(eyeN.x + 30 * eyeN.w)},${EYE_Y - 4} L${fmt(earNx + 2)},${EYE_Y - 7}`} fill="none" stroke={INK} strokeWidth={fw * 1.1} strokeLinecap="round" />
          {farVisible && <ellipse cx={fmt(eyeF.x)} cy={EYE_Y} rx={fmt(Math.max(8, 30 * eyeF.w))} ry={30} fill="#DFF1FA" fillOpacity={0.22} stroke={INK} strokeWidth={fw * 1.2} />}
          <ellipse cx={fmt(eyeN.x)} cy={EYE_Y} rx={fmt(Math.max(8, 30 * eyeN.w))} ry={30} fill="#DFF1FA" fillOpacity={0.22} stroke={INK} strokeWidth={fw * 1.2} />
          <path d={`M${fmt(eyeN.x - 20 * eyeN.w)},${EYE_Y - 18} Q${fmt(eyeN.x - 10 * eyeN.w)},${EYE_Y - 25} ${fmt(eyeN.x + 4 * eyeN.w)},${EYE_Y - 26}`} fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" opacity={0.75} />
        </g>
      )}
      {(e.shut > 0.3 || e.squint > 0.5) && (
        <g opacity={clamp(Math.max(e.shut, (e.squint - 0.5) * 2))}>
          {[-1, 0, 1].map((k) => (
            <InkLine key={k} d={`M${fmt(eyeN.x + 26 * eyeN.w)},${fmt(EYE_Y + k * 9)} l${fmt(9)},${fmt(k * 5 - 1)}`} w={fw * 0.6} />
          ))}
        </g>
      )}
      {farVisible && Brow('f', eyeF.x, eyeF.w, 1)}
      {Brow('n', eyeN.x, eyeN.w, -1)}

      {/* nose contour: the far-side edge of the wedge, bridge to tip, with the nostril line under it */}
      {(() => {
        const bulge = noseOut;
        const d = `M${fmt(noseRoot.x - 1)},-2 Q${fmt(noseRoot.x + bulge * 0.55 - 6 * cs)},${fmt(18)} ${fmt(noseTip.x + 2 * cs)},${fmt(noseTip.y + 4)}`;
        const under = `M${fmt(noseTip.x + 2 * cs)},${fmt(noseTip.y + 5)} Q${fmt(noseTip.x + 7 * cs + 4 * sn)},${fmt(34)} ${fmt(noseWR.x + 1)},${fmt(32)}`;
        const k = clamp(1 - sstep(70, 92, yaw) * 0.0);
        void noseK;
        return (
          <g opacity={k}>
            <InkLine d={d} w={fw} />
            <InkLine d={under} w={fw * 0.7} opacity={0.75} />
            {pass !== 'ink' && <ellipse cx={fmt(noseTip.x - 3 * cs - 2 * sn)} cy={fmt(noseTip.y - 8)} rx={4} ry={2.6} fill="#FFFFFF" opacity={0.65} transform={`rotate(-30 ${fmt(noseTip.x - 3 * cs - 2 * sn)} ${fmt(noseTip.y - 8)})`} />}
          </g>
        );
      })()}

      {/* mouth */}
      {o < 0.07 ? (
        <InkLine d={Q({x: mxA, y: cornerY}, {x: mxC, y: my + e.smile * 14}, {x: mxB, y: cornerY})} w={fw * 1.05} />
      ) : (
        <g>
          <Inked w={fw * 0.85}>
            <InkPath d={mouthD} fill={`url(#${id}-mo)`} />
          </Inked>
          {pass !== 'ink' && (
            <g clipPath={`url(#${id}-mc)`}>
              {e.tongue > 0.01 && <ellipse cx={fmt(mxC + 4)} cy={fmt(loY + 2)} rx={fmt(mw * 0.62)} ry={fmt(8 + o * 14)} fill="#E27583" opacity={e.tongue} />}
              {clenched ? (
                <g opacity={e.teeth}>
                  <rect x={fmt(mxA)} y={fmt(upY - 10)} width={fmt(mw * 2)} height={fmt(loY - upY + 20)} fill="#FBFAF6" />
                  <rect x={fmt(mxA)} y={fmt((upY + loY) / 2 + 2)} width={fmt(mw * 2)} height={fmt(loY - upY)} fill="#E4E8EC" />
                  <line x1={fmt(mxA)} y1={fmt((upY + loY) / 2 + 1)} x2={fmt(mxB)} y2={fmt((upY + loY) / 2 + 1)} stroke={INK} strokeWidth={fw * 0.6} />
                </g>
              ) : (
                e.teeth > 0.01 && <rect x={fmt(mxA)} y={fmt(upY - 12)} width={fmt(mw * 2)} height={fmt(12 + 6 + o * 8)} rx={3} fill="#FBFAF6" opacity={e.teeth} />
              )}
            </g>
          )}
          {pass !== 'ink' && <InkLine d={mouthD} w={fw * 0.85} />}
        </g>
      )}

      {e.sweat > 0.02 &&
        [
          [farVisible ? eyeF.x - 26 : eyeN.x + 36, -52, 0.5],
          [farVisible ? eyeF.x - 30 : eyeN.x + 42, -26, 0.34],
        ].map(([x, y, k], i) => (
          <g key={i} opacity={e.sweat} transform={`translate(${fmt(Math.max(x, -skullHalfW(y) + 14))} ${fmt(y)}) scale(${k})`}>
            <Inked w={fw * 0.7}>
              <InkPath d="M0,-13 C6,-4 9,3 9,8 C9,14 5,17 0,17 C-5,17 -9,14 -9,8 C-9,3 -6,-4 0,-13 Z" fill="#BFE6F5" />
            </Inked>
            {pass !== 'ink' && <ellipse cx={-3} cy={6} rx={2.6} ry={4} fill="#FFFFFF" />}
          </g>
        ))}

      {pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(lightPt(52).x + 4)} cy={fmt(lightPt(52).y - 4)} rx={20} ry={9} transform={`rotate(-30 ${fmt(lightPt(52).x + 4)} ${fmt(lightPt(52).y - 4)})`} fill="#FFFFFF" opacity={0.42} />
          {farVisible && <ellipse cx={fmt(cheekF.x + 6)} cy={22} rx={5} ry={3.4} fill="#FFFFFF" opacity={0.55} />}
          <ellipse cx={fmt(cheekN.x - 6)} cy={20} rx={4.2} ry={3} fill="#FFFFFF" opacity={0.5} />
        </g>
      )}
    </>
  );

  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(flip ? -s : s)} ${fmt(s)})`}>
      {body}
      {overlay}
    </g>
  );
};

/** world position of the mouth centre for a head drawn with Head4 (centre c, radius R, `roll` and `flip` as passed to it) */
export const mouthPoint = (c: V, R: number, roll: number, yaw: number, flip: boolean): V => {
  const u = R / 100;
  const sn = Math.sin((clamp(yaw, 0, 95) * Math.PI) / 180);
  const lx = -86 * sn * u * (flip ? -1 : 1);
  const ly = 58 * u;
  const a = (roll * Math.PI) / 180;
  return {x: c.x + lx * Math.cos(a) - ly * Math.sin(a), y: c.y + lx * Math.sin(a) + ly * Math.cos(a)};
};
