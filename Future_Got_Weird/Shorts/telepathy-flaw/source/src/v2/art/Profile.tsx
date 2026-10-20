// The sender in V2: a dedicated three-quarter-profile drawing (not the frontal sprite squashed). Same proportions as the
// Weird Crew "guesser" (head radius 100, red spiky hair, peach skin, white tee with saffron stripes), facing screen-right
// toward the receiver. The head has ONE implant, seated at the crown, and two optional sections that are separate
// masks on the exterior drawing:
//   - the crown window (aperture a): a clean cut through hair, scalp and skull, filled by the Column drawing;
//   - the neck window: a see-through throat with the (still) vocal folds.
// Exterior face features never sit under a section: the window stays above and behind the eyes.
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../../lib/ink';
import {Limb} from '../../lib/limb';
import {add, clamp, fmt, lerp, mul, norm, P, rot, sub, V} from '../../lib/math';
import {Blob, Capsule, Lin, LIGHT} from '../../lib/shade';
import {CREW, Expr} from '../../art/Head';
import {Hand, HAND_RELAXED, HandPose} from '../../art/Hand';
import {ik2, SAFFRON} from '../../art/Figures';
import {ALERT, CHIP, SIG, BONE} from '../../art/Section';
import {Column, ColumnProps, X0, topY} from './Column';

export type SenderPPose = {
  roll: number;
  shiftX: number;
  shiftY: number;
  /** cancel arm: 0 hanging .. 1 hand at reachTo */
  reach: number;
  reachTo: V;
  press: number;
  /** hair follow-through (deg) */
  sway: number;
  /** torso lean toward (+) / away from (-) the receiver, px */
  lean?: number;
};

const HEAD_D = 'M0,-107 C56,-107 99,-64 99,-8 C99,28 96,56 82,78 C70,98 44,107 12,107 C-50,107 -100,62 -100,0 C-100,-60 -56,-107 0,-107 Z';
const NOSE_D = 'M92,-14 C105,-8 117,6 115,21 C113,32 102,36 92,31 Z';
const EAR_D = 'M-22,-15 C-6,-23 9,-8 7,9 C5,25 -6,35 -16,34 C-26,33 -31,22 -31,8 C-31,-3 -28,-12 -22,-15 Z';
const EAR_RIM = 'M-19,-6 C-8,-9 -1,2 -2,12 C-3,21 -9,26 -15,25';

// spiky hair in profile: outer polygon (tips lean back), hairline underneath. The gap between the 2nd and 3rd spike is
// the crown, where the implant sits in a shaved pad.
const HAIR_PTS: V[] = [
  {x: 95, y: -66},
  {x: 103, y: -116},
  {x: 64, y: -104},
  {x: 42, y: -150},
  {x: 16, y: -111},
  {x: -26, y: -109},
  {x: -46, y: -150},
  {x: -68, y: -98},
  {x: -122, y: -118},
  {x: -97, y: -60},
  {x: -146, y: -56},
  {x: -101, y: -12},
];

/** the exterior implant: the shaved skin pad, the seat ring and the dome with its lens (same geometry as the Column's) */
const ImplantOutside: React.FC<{id: string; lens: number; lensRed: number}> = ({id, lens, lensRed}) => {
  const y0 = topY(X0);
  const xL = X0 - 12.5;
  const xR = X0 + 12.5;
  const lensCol = mix('#46CFFF', ALERT, lensRed);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-dm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(CHIP, 0.38)} />
          <stop offset="0.5" stopColor={CHIP} />
          <stop offset="1" stopColor="#173FA8" />
        </linearGradient>
        <radialGradient id={`${id}-gl`}>
          <stop offset="0" stopColor={lensRed > 0.5 ? '#FFC7CB' : '#BFF1FF'} stopOpacity={0.9} />
          <stop offset="0.45" stopColor={lensCol} stopOpacity={0.4} />
          <stop offset="1" stopColor={lensCol} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* skin pad round the seat (a shaved patch, seen edge-on) */}
      <ellipse cx={fmt(X0)} cy={fmt(y0 + 1.5)} rx={25} ry={6.5} fill="#F3C9AB" stroke={INK} strokeWidth={1.6} />
      <ellipse cx={fmt(X0 - 6)} cy={fmt(y0 - 0.4)} rx={9} ry={1.6} fill="#FFFFFF" opacity={0.35} />
      {/* seat ring */}
      <path d={`M${fmt(xL - 4)},${fmt(y0 + 0.5)} L${fmt(xR + 4)},${fmt(y0 + 0.5)} L${fmt(xR + 4)},${fmt(y0 + 3.2)} L${fmt(xL - 4)},${fmt(y0 + 3.2)} Z`} fill={lit(CHIP, 0.2)} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      {/* dome */}
      <path d={`M${fmt(xL + 1)},${fmt(y0 + 0.9)} C${fmt(xL + 2)},${fmt(y0 - 11)} ${fmt(xR - 2)},${fmt(y0 - 11)} ${fmt(xR - 1)},${fmt(y0 + 0.9)} Z`} fill={`url(#${id}-dm)`} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <ellipse cx={fmt(X0)} cy={fmt(y0 - 1.6)} rx={7.6} ry={1.35} fill={lensCol} opacity={0.35 + 0.65 * lens} />
      <ellipse cx={fmt(X0 - 2.2)} cy={fmt(y0 - 2.3)} rx={2.6} ry={0.5} fill="#FFFFFF" opacity={0.7} />
      {lens > 0.05 && <ellipse cx={fmt(X0)} cy={fmt(y0 - 2)} rx={16 * (0.6 + 0.4 * lens)} ry={7 * (0.6 + 0.4 * lens)} fill={`url(#${id}-gl)`} opacity={0.8 * lens} />}
    </g>
  );
};

/** the crown window: a rounded cut whose size follows the aperture a (0 closed .. 1 the full window .. 2+ unbounded) */
export const windowRect = (a: number) => {
  if (a <= 1) {
    const hw = lerp(9, 45, a);
    const hh = lerp(11, 56, a);
    const xc = X0 - 7 * a;
    return {x0: xc - hw, x1: xc + hw, y0: -100 - hh, y1: -100 + hh, r: lerp(hw, 9, Math.min(1, a * 1.4))};
  }
  const e = (a - 1) * 520;
  if (a <= 1.5) {
    // still a window in the head: wider and deeper, but inside the head's own silhouette
    return {x0: X0 - 52 - Math.min(e, 42), x1: X0 + 38 + Math.min(e, 54), y0: -156 - Math.min(e * 0.05, 10), y1: -44 + Math.min(e * 0.6, 34), r: 9};
  }
  return {x0: X0 - 52 - e, x1: X0 + 38 + e, y0: -156 - e, y1: -44 + e * 2, r: 9};
};
const rrD = (w: {x0: number; x1: number; y0: number; y1: number; r: number}) => {
  // the cut: below the head's contour only, plus a chimney round the implant dome (the hair gap)
  const r = Math.min(w.r, (w.x1 - w.x0) / 2, (w.y1 - w.y0) / 2);
  const big = w.y0 < -170; // unbounded (the dive): a plain big rectangle
  if (big) return `M${fmt(w.x0)},${fmt(w.y0)} L${fmt(w.x1)},${fmt(w.y0)} L${fmt(w.x1)},${fmt(w.y1)} L${fmt(w.x0)},${fmt(w.y1)} Z`;
  const cl = Math.max(w.x0, X0 - 15);
  const cr = Math.min(w.x1, X0 + 15);
  const top = (x: number) => (x > cl && x < cr ? -127 : topY(x) - 0.5);
  let d = `M${fmt(w.x0)},${fmt(top(w.x0))} L${fmt(w.x0)},${fmt(w.y1 - r)} Q${fmt(w.x0)},${fmt(w.y1)} ${fmt(w.x0 + r)},${fmt(w.y1)} L${fmt(w.x1 - r)},${fmt(w.y1)} Q${fmt(w.x1)},${fmt(w.y1)} ${fmt(w.x1)},${fmt(w.y1 - r)} L${fmt(w.x1)},${fmt(top(w.x1))}`;
  const xs: number[] = [];
  for (let x = w.x1 - 3; x > w.x0 + 1; x -= 3) xs.push(x);
  for (const x of xs) {
    if (x > cl && x < cr) continue;
    d += ` L${fmt(x)},${fmt(top(x))}`;
  }
  // chimney
  if (cr > cl) d += ` L${fmt(cr)},${fmt(topY(cr) - 0.5)} L${fmt(cr)},-127 L${fmt(cl)},-127 L${fmt(cl)},${fmt(topY(cl) - 0.5)}`;
  return d + ' Z';
};

/** the cut edge: down the left side, along the bottom and up the right side (the top is open to the air) */
const rimD = (w: {x0: number; x1: number; y0: number; y1: number; r: number}) => {
  const r = Math.min(w.r, (w.x1 - w.x0) / 2, (w.y1 - w.y0) / 2);
  const ya = Math.max(w.y0 + r, topY(w.x0) - 1);
  const yb = Math.max(w.y0 + r, topY(w.x1) - 1);
  return `M${fmt(w.x0)},${fmt(ya)} L${fmt(w.x0)},${fmt(w.y1 - r)} Q${fmt(w.x0)},${fmt(w.y1)} ${fmt(w.x0 + r)},${fmt(w.y1)} L${fmt(w.x1 - r)},${fmt(w.y1)} Q${fmt(w.x1)},${fmt(w.y1)} ${fmt(w.x1)},${fmt(w.y1 - r)} L${fmt(w.x1)},${fmt(yb)}`;
};

export const senderPArm = (c: V, R: number, p: SenderPPose) => {
  const S: V = {x: c.x - R * 0.5 + p.shiftX + (p.lean ?? 0), y: c.y + R * 1.86 + p.shiftY};
  const l1 = R * 1.55;
  const l2 = R * 1.38;
  const rest = ik2(S, {x: S.x - R * 0.12, y: S.y + (l1 + l2) * 0.93}, l1, l2, -1);
  const rch = ik2(S, {x: p.reachTo.x - p.press * R * 0.2, y: p.reachTo.y}, l1, l2, 1);
  const E = add(mul(rest.E, 1 - p.reach), mul(rch.E, p.reach));
  const W = add(mul(rest.W, 1 - p.reach), mul(rch.W, p.reach));
  return {S, E, W, l1, l2};
};

export const SenderP: React.FC<{
  id: string;
  c: V;
  R: number;
  pose: SenderPPose;
  expr: Expr;
  blink?: number;
  /** crown window aperture and the implant lens */
  aperture: number;
  lens: number;
  lensRed: number;
  column: ColumnProps;
  /** content drawn in the neck window (world px), and its opening 0..1 */
  neck?: React.ReactNode;
  neckOpen?: number;
  hand?: HandPose;
}> = ({id, c, R, pose, expr: e, blink = 0, aperture, lens, lensRed, column, neck, neckOpen = 0, hand = HAND_RELAXED}) => {
  const s = R / 100;
  const hc = {x: c.x + pose.shiftX * 0.7 + (pose.lean ?? 0) * 0.8, y: c.y + pose.shiftY * 0.7};
  const cx = c.x + pose.shiftX + (pose.lean ?? 0);
  const sy = c.y + R * 1.58 + pose.shiftY;
  const sh = {x: pose.shiftX, y: pose.shiftY};
  void sh;
  const torsoD = `M${fmt(cx - R * 1.36)},${fmt(sy + R * 0.34)} C${fmt(cx - R * 1.36)},${fmt(sy - R * 0.02)} ${fmt(cx - R * 0.95)},${fmt(sy - R * 0.28)} ${fmt(cx - R * 0.42)},${fmt(sy - R * 0.31)} L${fmt(cx + R * 0.36)},${fmt(sy - R * 0.31)} C${fmt(cx + R * 0.86)},${fmt(sy - R * 0.28)} ${fmt(cx + R * 1.12)},${fmt(sy - R * 0.02)} ${fmt(cx + R * 1.14)},${fmt(sy + R * 0.42)} L${fmt(cx + R * 1.2)},${fmt(sy + R * 7)} L${fmt(cx - R * 1.42)},${fmt(sy + R * 7)} Z`;
  const neckA = {x: hc.x - R * 0.1, y: hc.y + R * 0.78};
  const neckB = {x: cx - R * 0.04, y: sy - R * 0.1};
  const arm = senderPArm(c, R, pose);
  const reaching = pose.reach > 0.02;
  const wristAng = (Math.atan2(arm.W.y - arm.E.y, arm.W.x - arm.E.x) * 180) / Math.PI;
  const bands = Array.from({length: 14}, (_, k) => k);
  const skin = CREW.skin;
  const hair = CREW.hair;

  // head-space helpers
  const Lc = rot(LIGHT, -pose.roll);
  const rg = (gid: string, cx0: number, cy0: number, r: number, focal: number, stops: [number, string, number?][]) => {
    const f = add({x: cx0, y: cy0}, mul(Lc, r * focal));
    return (
      <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={fmt(cx0)} cy={fmt(cy0)} r={fmt(r)} fx={fmt(f.x)} fy={fmt(f.y)}>
        {stops.map(([o, col, a], i) => (
          <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />
        ))}
      </radialGradient>
    );
  };
  const fw = 5.6;
  const win = windowRect(aperture);
  const winOn = aperture > 0.01;
  const swayR = (k: number) => rot({x: 0, y: -1}, pose.sway * k);

  // hair with sway on the tips
  const hairTips = HAIR_PTS.map((p, i) => {
    const tip = i === 1 || i === 3 || i === 6 || i === 8 || i === 10;
    if (!tip) return p;
    const base = {x: p.x, y: p.y + 40};
    const v = sub(p, base);
    const k = i === 8 || i === 10 ? 1.3 : 1;
    const r = rot(v, pose.sway * k);
    return add(base, r);
  });
  void swayR;
  const hairD = `M${P(hairTips[0])} ${hairTips
    .slice(1)
    .map((p) => `L${P(p)}`)
    .join(' ')} Q-62,-34 -14,-58 Q44,-90 95,-68 Z`;

  // eye (near) and the far eye's sliver, brows, mouth
  const eyeY = -10;
  const ex = 58;
  const rx = 19;
  const ry = 22;
  const eyeD = (x: number, w: number) => `M${fmt(x - w)},${eyeY} C${fmt(x - w)},${fmt(eyeY - ry * 1.33)} ${fmt(x + w)},${fmt(eyeY - ry * 1.33)} ${fmt(x + w)},${eyeY} C${fmt(x + w)},${fmt(eyeY + ry * 1.33)} ${fmt(x - w)},${fmt(eyeY + ry * 1.33)} ${fmt(x - w)},${eyeY} Z`;
  const L = clamp(e.lid + (blink + e.shut) * (1 - e.lid));
  const sq = clamp(e.squint + e.shut * 0.4);
  const Eye = (k: string, x: number, w: number) => {
    const topY0 = eyeY - ry + L * ry * 2.05;
    const botY = eyeY + ry - sq * ry * 0.95;
    if (L > 0.9 || botY - topY0 < 4) {
      const ch = e.shut;
      const d = ch > 0.35 ? `M${fmt(x - w * 0.9)},${fmt(eyeY - 11 * ch)} L${fmt(x + w * 0.85)},${fmt(eyeY + 2)} L${fmt(x - w * 0.9)},${fmt(eyeY + 13 * ch)}` : `M${fmt(x - w)},${eyeY + 2} Q${fmt(x)},${eyeY + 12} ${fmt(x + w)},${eyeY + 2}`;
      return <InkLine key={k} d={d} w={fw * 1.2} />;
    }
    const pr = 10.5 * e.pupil;
    const ix = x + 4 + e.gx * w * 0.5;
    const iy = eyeY + 2 + e.gy * ry * 0.38;
    return (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD(x, w)} />
          </clipPath>
          {rg(`${id}-ew${k}`, x, eyeY - 4, ry * 1.4, 0.4, [
            [0, '#FFFFFF'],
            [0.55, '#F6F8FA'],
            [1, '#C9D5DE'],
          ])}
        </defs>
        <Inked w={fw * 0.85}>
          <InkPath d={eyeD(x, w)} fill={`url(#${id}-ew${k})`} />
        </Inked>
        <g clipPath={`url(#${id}-ec${k})`}>
          <circle cx={fmt(ix)} cy={fmt(iy)} r={fmt(pr)} fill={INK} />
          <circle cx={fmt(ix + pr * 0.38)} cy={fmt(iy - pr * 0.42)} r={fmt(pr * 0.34 + 0.6)} fill="#FFFFFF" />
          <circle cx={fmt(ix - pr * 0.36)} cy={fmt(iy + pr * 0.36)} r={fmt(pr * 0.15 + 0.3)} fill="#FFFFFF" opacity={0.85} />
          <rect x={fmt(x - w - 4)} y={fmt(topY0)} width={fmt(w * 2 + 8)} height={7} fill="#5E7486" opacity={0.18} />
          <path d={`M${fmt(x - w - 4)},${fmt(eyeY - ry * 1.7)} L${fmt(x + w + 4)},${fmt(eyeY - ry * 1.7)} L${fmt(x + w + 4)},${fmt(topY0 + 1)} Q${fmt(x)},${fmt(topY0 - 6 * (1 - L))} ${fmt(x - w - 4)},${fmt(topY0 + 1)} Z`} fill={mix(skin, shade(skin, 0.2), 0.5)} />
          <path d={`M${fmt(x - w - 4)},${fmt(eyeY + ry * 1.7)} L${fmt(x + w + 4)},${fmt(eyeY + ry * 1.7)} L${fmt(x + w + 4)},${fmt(botY)} Q${fmt(x)},${fmt(botY + 6)} ${fmt(x - w - 4)},${fmt(botY)} Z`} fill={lit(skin, 0.06)} />
        </g>
        {L > 0.04 && <InkLine d={`M${fmt(x - w - 1)},${fmt(topY0 + 1)} Q${fmt(x)},${fmt(topY0 - 6 * (1 - L))} ${fmt(x + w + 1)},${fmt(topY0 + 1)}`} w={fw} />}
      </g>
    );
  };
  const Brow = (x: number, w: number, k: string) => {
    const by = -50 + e.browDown * 9;
    const innerX = x + w * 0.95; // inner = toward the nose/front
    const outerX = x - w * 1.05;
    const innerY = by - e.browIn * 17 + e.browDown * 5;
    const outerY = by + e.browIn * 5 - e.browDown;
    const midY = (innerY + outerY) / 2 - 5 + e.browDown * 2;
    return <InkLine key={k} d={`M${fmt(outerX)},${fmt(outerY)} Q${fmt(x)},${fmt(midY)} ${fmt(innerX)},${fmt(innerY)}`} w={fw * 1.75} />;
  };
  // mouth in profile: a short line that bends with smile; clenched teeth for tension
  const sm0 = e.smile;
  const clench = e.teeth > 0.5 ? e.teeth : 0;
  const mouthD = `M66,${fmt(57 - 3 * sm0)} Q82,${fmt(62 + 5 * sm0 - 3 * clench)} 97,${fmt(50 - 8 * sm0)}`;

  const flush = clamp(0.5 + 0.5 * e.flush);

  const body = (
    <g>
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
        {rg(`${id}-ear`, -12, 10, 30, 0.5, [
          [0, lit(skin, 0.24)],
          [0.7, skin],
          [1, shade(skin, 0.28)],
        ])}
        <radialGradient id={`${id}-ck`}>
          <stop offset="0" stopColor={CREW.cheek} stopOpacity={0.75} />
          <stop offset="0.55" stopColor={CREW.cheek} stopOpacity={0.45} />
          <stop offset="1" stopColor={CREW.cheek} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-hc`}>
          <path d={HEAD_D} />
        </clipPath>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
          <rect x={-400} y={-400} width={800} height={800} fill="#FFFFFF" />
          {winOn && <path d={rrD(win)} fill="#000000" />}
        </mask>
      </defs>
      <g mask={`url(#${id}-wm)`}>
        {/* ear, head, nose: one silhouette */}
        <Inked w={7}>
          <InkPath d={HEAD_D} fill={`url(#${id}-sk)`} />
          <InkPath d={NOSE_D} fill={`url(#${id}-sk)`} />
        </Inked>
        <Inked w={5.5}>
          <InkPath d={EAR_D} fill={`url(#${id}-ear)`} />
        </Inked>
        <Deco>
          <g clipPath={`url(#${id}-hc)`}>
            <ellipse cx={16} cy={118} rx={110} ry={44} fill={shade(skin, 0.4)} opacity={0.22} />
            <path d="M99,-10 C99,60 60,100 12,107 C54,92 88,56 93,-10 Z" fill="#CFE3F2" opacity={0.28} />
            <ellipse cx={64} cy={30} rx={21} ry={16} fill={`url(#${id}-ck)`} opacity={0.5 + 0.5 * flush} />
          </g>
          <path d={EAR_RIM} fill="none" stroke={shade(skin, 0.42)} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
          <ellipse cx={-12} cy={12} rx={5} ry={9} fill={shade(skin, 0.3)} opacity={0.4} />
          <ellipse cx={104} cy={18} rx={4} ry={2.6} fill="#FFFFFF" opacity={0.55} transform="rotate(-30 104 18)" />
        </Deco>
        {/* hair */}
        <Inked w={7}>
          <InkPath d={hairD} fill={`url(#${id}-hr)`} />
        </Inked>
        <Deco>
          {[
            [42, -150, 14],
            [-46, -150, 14],
            [-122, -118, 10],
          ].map(([bx, by, ln], i) => (
            <ellipse key={i} cx={fmt(bx - 5)} cy={fmt(by + 24)} rx={ln * 0.4} ry={3.8} transform={`rotate(70 ${fmt(bx - 5)} ${fmt(by + 24)})`} fill="#FFFFFF" opacity={0.42} />
          ))}
          <ellipse cx={-52} cy={-84} rx={26} ry={6} transform="rotate(-8 -52 -84)" fill="#FFFFFF" opacity={0.3} />
        </Deco>
        {/* the exterior implant sits in its skin pad between the 2nd and 3rd spike */}
        <ImplantOutside id={`${id}-io`} lens={lens} lensRed={lensRed} />
        {/* face: far eye (a sliver at the edge), near eye, brows, nose line, mouth */}
        <g>
          <g clipPath={`url(#${id}-hc)`}>{Eye('f', 98, 16)}</g>
          {Eye('n', ex, rx)}
          <g clipPath={`url(#${id}-hc)`}>{Brow(96, 10, 'bf')}</g>
          {Brow(ex - 2, 21, 'bn')}
          <InkLine d="M94,-8 Q101,4 100,17" w={fw * 0.55} opacity={0.55} />
          {clench > 0.05 ? (
            <g opacity={clench}>
              <InkLine d={mouthD} w={fw * 0.9} />
              <g transform="rotate(-13 83 55)">
                <rect x={71.5} y={fmt(50.5 - 2 * sm0)} width={23} height={9} rx={3} fill="#FBFAF6" stroke={INK} strokeWidth={fw * 0.55} />
                <line x1={72} y1={fmt(55 - 2 * sm0)} x2={94} y2={fmt(55 - 2 * sm0)} stroke={INK} strokeWidth={fw * 0.32} opacity={0.7} />
              </g>
            </g>
          ) : (
            <InkLine d={mouthD} w={fw * 1.1} />
          )}
          {e.open > 0.12 && (
            <path d={`M70,58 Q84,${fmt(60 + e.open * 30)} 96,52 Q84,56 70,58 Z`} fill="#6A2430" stroke={INK} strokeWidth={fw * 0.6} />
          )}
          {e.sweat > 0.02 &&
            [
              [-4, -62, 0.5],
              [-14, -40, 0.34],
            ].map(([x, y, k], i) => (
              <g key={i} opacity={e.sweat} transform={`translate(${fmt(x)} ${fmt(y)}) scale(${k})`}>
                <Inked w={fw * 0.7}>
                  <InkPath d="M0,-13 C6,-4 9,3 9,8 C9,14 5,17 0,17 C-5,17 -9,14 -9,8 C-9,3 -6,-4 0,-13 Z" fill="#BFE6F5" />
                </Inked>
                <Deco>
                  <ellipse cx={-3} cy={6} rx={2.6} ry={4} fill="#FFFFFF" />
                </Deco>
              </g>
            ))}
          {e.browIn > 0.55 && (
            <g opacity={clamp((e.browIn - 0.55) * 2)}>
              <InkLine d="M44,-82 Q56,-87 68,-82" w={fw * 0.7} />
            </g>
          )}
        </g>
      </g>
      {/* the crown window: the section itself, then its cut edge */}
      {winOn && (
        <g>
          <defs>
            <clipPath id={`${id}-wc`}>
              <path d={rrD(win)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-wc)`}>
            <Column {...column} id={`${id}-col`} wide={aperture > 1.05} />
          </g>
          {aperture <= 1.6 && (
            <g>
              <path d={rimD(win)} fill="none" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.9} />
              <path d={rimD(win)} fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.45} transform="translate(1.2 -1.2)" />
            </g>
          )}
        </g>
      )}
    </g>
  );

  return (
    <g>
      {/* far arm: a sleeve hanging behind the torso */}
      <Inked w={R * 0.05} id={`${id}-fig`}>
        <Capsule id={`${id}-fa`} a={{x: cx + R * 0.9, y: sy + R * 0.1}} b={{x: cx + R * 0.98, y: sy + R * 2.2}} ra={R * 0.34} rb={R * 0.3} color={mix('#FFFFFF', '#DCE6EE', 0.4)} k={0.9} />
        <Blob id={`${id}-torso`} d={torsoD} c={{x: cx - R * 0.35, y: sy + R * 0.5}} r={R * 2.3} color="#FFFFFF" k={0.8} focal={0.5} />
        <Capsule id={`${id}-neck`} a={neckA} b={neckB} ra={R * 0.27} rb={R * 0.3} color={skin} k={1} />
      </Inked>
      <Deco>
        <clipPath id={`${id}-tc`}>
          <path d={torsoD} />
        </clipPath>
        <g clipPath={`url(#${id}-tc)`}>
          {bands.map((k) => (
            <path key={k} d={`M${fmt(cx - R * 1.6)},${fmt(sy + R * 0.16 + k * R * 0.52 + R * 0.04)} L${fmt(cx + R * 1.4)},${fmt(sy + R * 0.16 + k * R * 0.52 - R * 0.05)} L${fmt(cx + R * 1.4)},${fmt(sy + R * 0.16 + k * R * 0.52 + R * 0.2)} L${fmt(cx - R * 1.6)},${fmt(sy + R * 0.16 + k * R * 0.52 + R * 0.29)} Z`} fill={SAFFRON} />
          ))}
          <Lin id={`${id}-tsh`} d={torsoD} from={{x: cx - R * 1.2, y: sy}} to={{x: cx + R * 1.3, y: sy + R * 0.12}} stops={[[0, '#FFFFFF', 0.3], [0.4, '#FFFFFF', 0], [0.75, '#2B4A78', 0.08], [1, '#2B4A78', 0.24]]} />
        </g>
        <path d={`M${fmt(neckB.x - R * 0.32)},${fmt(neckB.y - R * 0.04)} Q${fmt(neckB.x)},${fmt(neckB.y + R * 0.34)} ${fmt(neckB.x + R * 0.33)},${fmt(neckB.y - R * 0.05)}`} fill="none" stroke={INK} strokeWidth={R * 0.05} strokeLinecap="round" />
        <path d={`M${fmt(neckB.x - R * 0.3)},${fmt(neckB.y - R * 0.12)} Q${fmt(neckB.x)},${fmt(neckB.y + R * 0.2)} ${fmt(neckB.x + R * 0.31)},${fmt(neckB.y - R * 0.13)} L${fmt(neckB.x + R * 0.3)},${fmt(neckB.y - R * 0.3)} L${fmt(neckB.x - R * 0.3)},${fmt(neckB.y - R * 0.3)} Z`} fill={shade(skin, 0.12)} opacity={0.55} />
        <ellipse cx={fmt(hc.x - R * 0.06)} cy={fmt(hc.y + R * 0.98)} rx={R * 0.3} ry={R * 0.16} fill={shade(skin, 0.5)} opacity={0.45} />
      </Deco>
      {neckOpen > 0.01 && neck}
      {/* near arm */}
      <Inked w={R * 0.045} id={`${id}-arm`} fade={[{c: arm.S, r: R * 0.62}]}>
        <Limb id={`${id}-limb`} A={arm.S} B={arm.E} C={arm.W} rA={R * 0.3} rB={R * 0.25} rC={R * 0.21} color={skin} spec={0.25} crease={R * 0.03} />
        <Limb id={`${id}-slv`} A={arm.S} B={add(arm.S, mul(norm(sub(arm.E, arm.S)), arm.l1 * 0.28))} C={add(arm.S, mul(norm(sub(arm.E, arm.S)), arm.l1 * 0.56))} rA={R * 0.37} rB={R * 0.36} rC={R * 0.35} color="#FFFFFF" capC="flat" k={0.85} />
        <Hand id={`${id}-hand`} wrist={arm.W} ang={wristAng} L={R * 0.98} thumbSide={-1} view={reaching ? 'palm' : 'back'} pose={reaching ? {curl: [0.04, 0.78, 0.82, 0.86], spread: 0.2, thumb: 28, thumbCurl: 0.65} : hand} color={skin} bare />
      </Inked>
      <g transform={`translate(${fmt(hc.x)} ${fmt(hc.y)}) rotate(${fmt(pose.roll)}) scale(${fmt(s)})`}>{body}</g>
    </g>
  );
};
