// V3 (Real Web Fluid): flatter skin gradient, no jaw shade or cool bounce on the lower face (it read as stubble), smaller
// highlights; the face's construction is unchanged.
// Copied from the Death Clock V4 project (Shorts/death-clock/source/src/art/Head.tsx, commit e5b4770e) for Real Web
// Fluid V2. Added: optional beanie (replaces the hair), domino mask and clear safety glasses.
//
// The man's head in the Weird Crew style (Future Got Weird cast, Video 01 rig): tall oval head with ink contour,
// side ears, white-sclera eyes with ink pupils, thick ink brows, hook nose, drawn mouth, coral cheeks. He is the
// cast's "guesser" (red spiky hair, peach skin, cheeks). This version adds dimensional gradients, glossy
// highlights and a wider expression range (squeezed-shut eyes, pupil size, teeth, tongue, worry lines, sweat).
// Drawn in a local space where the head radius is 100; the key light is counter-rotated into that space so
// tilting the head never moves the light.
import React from 'react';
import {lit, mix, shade} from './color';
import {INK, Inked, InkLine, InkPath, useInk} from './ink';
import {add, clamp, fmt, lerp, mul, P, rot, V} from './math';
import {LIGHT} from './shade';

export const CREW = {
  skin: '#F2C9A8',
  hair: '#C0392B',
  cheek: '#EF6B55',
  shirt: '#FFFFFF',
  stripe: '#FFC744',
  pants: '#2E3F5C',
  shoe: '#FFFFFF',
  sole: '#B9C4CC',
};

export type Expr = {
  /** inner brow raise (worry/pain) 0..1 */
  browIn: number;
  /** whole brow lowered (strain) 0..1 */
  browDown: number;
  /** upper lid closure 0..1 */
  lid: number;
  /** lower lid squint 0..1 */
  squint: number;
  /** eyes squeezed shut (crew "> <" eyes) 0..1 */
  shut: number;
  /** pupil size (1 normal, smaller = fear) */
  pupil: number;
  /** mouth opening 0..1 */
  open: number;
  /** mouth width factor 0.6..1.4 */
  wide: number;
  /** mouth corners: -1 frown .. 1 smile */
  smile: number;
  /** teeth showing 0..1 (above 0.5 with a small opening = clenched grimace) */
  teeth: number;
  /** tongue 0..1 */
  tongue: number;
  /** gaze offset -1..1 */
  gx: number;
  gy: number;
  /** sweat drops 0..1 */
  sweat: number;
  /** cheek flush 0..1 */
  flush: number;
};

export const EXPR_PAIN: Expr = {browIn: 1, browDown: 0.75, lid: 0.32, squint: 0.45, shut: 0, pupil: 0.85, open: 0.3, wide: 0.86, smile: -0.85, teeth: 0.2, tongue: 0, gx: -0.15, gy: 0.1, sweat: 0.8, flush: 0.6};
export const EXPR_GASP: Expr = {browIn: 0.95, browDown: 0.15, lid: 0.12, squint: 0.1, shut: 0, pupil: 0.66, open: 0.5, wide: 0.72, smile: -0.6, teeth: 0.15, tongue: 0.1, gx: 0, gy: 0.1, sweat: 0.8, flush: 0.5};
export const EXPR_WINCE: Expr = {browIn: 1, browDown: 1, lid: 0.6, squint: 0.75, shut: 0.85, pupil: 0.9, open: 0.24, wide: 0.92, smile: -0.9, teeth: 0.3, tongue: 0, gx: 0, gy: 0, sweat: 0.8, flush: 0.7};
export const EXPR_RELIEF: Expr = {browIn: 0.7, browDown: 0, lid: 0.3, squint: 0.12, shut: 0, pupil: 1, open: 0.2, wide: 0.85, smile: 0.05, teeth: 0, tongue: 0, gx: 0, gy: 0.05, sweat: 0.5, flush: 0.35};
export const EXPR_UNEASY: Expr = {browIn: 0.9, browDown: 0.05, lid: 0.05, squint: 0, shut: 0, pupil: 0.8, open: 0.1, wide: 0.82, smile: -0.4, teeth: 0, tongue: 0, gx: -0.1, gy: 0.7, sweat: 0.5, flush: 0.25};
export const EXPR_NEUTRAL: Expr = {browIn: 0.1, browDown: 0, lid: 0.12, squint: 0, shut: 0, pupil: 1, open: 0.02, wide: 1, smile: 0.25, teeth: 0, tongue: 0, gx: 0, gy: 0, sweat: 0, flush: 0.1};

export const mixExpr = (a: Expr, b: Expr, t: number): Expr => {
  const o = {} as Expr;
  (Object.keys(a) as (keyof Expr)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};

type Props = {
  id: string;
  c: V;
  /** head radius in world units */
  R: number;
  /** in-plane roll (deg) */
  roll: number;
  /** 0 = facing camera, 1 = strong 3/4 toward screen-left */
  turn: number;
  expr: Expr;
  /** blink 0..1 (closes both lids) */
  blink?: number;
  skin?: string;
  hair?: string;
  /** contour width in head-local units (head radius = 100) */
  inkW?: number;
  /** spike jiggle (deg) from the body's motion (follow-through) */
  hairSway?: number;
  /** a knitted beanie in place of the hair */
  hat?: {color: string; band: string};
  /** a domino mask across the eyes (colour) */
  mask?: string;
  /** clear safety glasses */
  glasses?: boolean;
  /** Lightning Laser: iris colour (the lead's green eyes); default none (ink pupils only, as before) */
  iris?: string;
  /** Lightning Laser: hair style. 'spiky' (default) is the guesser's; 'bun' is Video 01 clerkB's smooth cap with a
   *  bun on top, scaled from the Video 01 rig (head radius 58 -> 100) and keeping the same hairline curve */
  hairStyle?: 'spiky' | 'bun';
  /** Lightning Laser: Video 01 'glasses' (dark rounded-rectangle frames) instead of the clear safety glasses */
  frames?: boolean;
  /** Lightning Laser: Video 01 'earring' (saffron stud on the near ear) */
  earring?: boolean;
  /** Lightning Laser: cheek colour strength multiplier (default 1) */
  cheekK?: number;
};

const Q = (a: V, c: V, b: V) => `M${P(a)} Q${P(c)} ${P(b)}`;

export const Head: React.FC<Props> = ({id, c, R, roll, turn: t, expr: e, blink = 0, skin = CREW.skin, hair = CREW.hair, inkW = 7, hairSway = 0, hat, mask, glasses, iris, hairStyle = 'spiky', frames, earring, cheekK = 1}) => {
  const Lc = rot(LIGHT, -roll); // light direction in head space
  const s = R / 100;
  const xf = -30 * t; // face centre line moves toward screen-left in 3/4
  const fw = inkW * 0.74; // feature line width
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
  // highlight point on the head surface toward the light (for glosses)
  const lightPt = (r: number, cx = 0, cy = 0) => add({x: cx, y: cy}, mul(Lc, r));

  // --- geometry (crew proportions, scaled from the Video 01 rig: head rx 58 / ry 62 -> 100 / 107)
  const headD = `M0,-107 C55,-107 100,-60 100,0 C100,60 55,107 0,107 C-55,107 -100,60 -100,0 C-100,-60 -55,-107 0,-107 Z`;
  // V3 ear: a rim that grows out of the side of the head (its flat side is inside the head, and it shares the
  // head's contour group, so no outlined disk); an inner rim line and a shaded hollow give it the form of an ear
  const ear = (x: number, k = 1) =>
    `M${fmt(x - 8 * k)},-16 C${fmt(x + 10 * k)},-24 ${fmt(x + 22 * k)},-8 ${fmt(x + 20 * k)},8 C${fmt(x + 19 * k)},22 ${fmt(x + 12 * k)},34 ${fmt(x + 3 * k)},36 C${fmt(x - 4 * k)},37 ${fmt(x - 9 * k)},32 ${fmt(x - 10 * k)},26 L${fmt(x - 12 * k)},-8 Z`;
  const earRim = (x: number, k = 1) => `M${fmt(x - 2 * k)},-10 C${fmt(x + 9 * k)},-13 ${fmt(x + 14 * k)},0 ${fmt(x + 12 * k)},11 C${fmt(x + 11 * k)},19 ${fmt(x + 6 * k)},26 ${fmt(x)},27`;
  const nearEarX = 101 - 8 * t;
  const farEarX = -101 + 22 * t;
  // spiky hair (crew 'spiky'), shifted a little with the turn; spikes sway with follow-through
  const hx = xf * 0.25;
  const sw = (k: number) => rot({x: 0, y: -1}, hairSway * k);
  const spike = (bx: number, by: number, len: number, k: number) => add({x: bx + hx, y: by}, mul(sw(k), len));
  const hairPts: V[] = [
    {x: -100 + hx, y: -21},
    spike(-93, -110, 28, 1.2),
    {x: -48 + hx, y: -107},
    spike(-26, -126, 34, 1),
    {x: 0 + hx, y: -110},
    spike(26, -128, 36, 1),
    {x: 48 + hx, y: -107},
    spike(93, -110, 28, 1.2),
    {x: 100 + hx, y: -21},
  ];
  // Video 01 'bun' (clerkB): a smooth cap whose lower edge is the same hairline curve, and a round bun on top
  const bunCap = `M${fmt(-102 + hx)},-21 Q${fmt(-100 + hx)},-128 ${fmt(hx)},-125 Q${fmt(100 + hx)},-128 ${fmt(102 + hx)},-21 Q${fmt(60 + hx)},-55 ${fmt(hx)},-62 Q${fmt(-60 + hx)},-55 ${fmt(-102 + hx)},-21 Z`;
  const bunC = {x: hx + 6 * t, y: -150};
  const hairD = hairStyle === 'bun' ? bunCap : `M${P(hairPts[0])} ${hairPts
    .slice(1)
    .map((p) => `L${P(p)}`)
    .join(' ')} Q${fmt(60 + hx)},-55 ${fmt(0 + hx)},-62 Q${fmt(-60 + hx)},-55 ${fmt(-100 + hx)},-21 Z`;

  // --- eyes
  const eyeY = -10;
  const nearX = xf + 37 * (1 - 0.08 * t);
  const farX = xf - 37 * (1 - 0.3 * t);
  const farW = 1 - 0.32 * t;
  const L = clamp(e.lid + (blink + e.shut) * (1 - e.lid));
  const sq = clamp(e.squint + e.shut * 0.4);

  const Eye = (k: 'n' | 'f', ex: number, wf: number, side: 1 | -1) => {
    const rx = 21 * wf;
    const ry = 23;
    const eyeD = `M${fmt(ex - rx)},${eyeY} C${fmt(ex - rx)},${fmt(eyeY - ry * 1.33)} ${fmt(ex + rx)},${fmt(eyeY - ry * 1.33)} ${fmt(ex + rx)},${eyeY} C${fmt(ex + rx)},${fmt(eyeY + ry * 1.33)} ${fmt(ex - rx)},${fmt(eyeY + ry * 1.33)} ${fmt(ex - rx)},${eyeY} Z`;
    const topY = eyeY - ry + L * ry * 2.05;
    const botY = eyeY + ry - sq * ry * 0.95;
    const closed = L > 0.9 || botY - topY < 4;
    if (closed) {
      // closed: a gentle lid arc for a blink, a squeezed chevron for pain (crew "> <" eyes)
      const ch = e.shut;
      const inner = side; // +1: inner corner toward screen-left for the near (right) eye
      const tipX = ex - inner * rx * 0.9;
      const d =
        ch > 0.35
          ? `M${fmt(ex + inner * rx * 0.85)},${fmt(eyeY - 11 * ch)} L${fmt(tipX)},${fmt(eyeY + 2)} L${fmt(ex + inner * rx * 0.85)},${fmt(eyeY + 13 * ch)}`
          : Q({x: ex - rx, y: eyeY + 2}, {x: ex, y: eyeY + 12}, {x: ex + rx, y: eyeY + 2});
      return <InkLine key={k} d={d} w={fw * 1.15} />;
    }
    const pr = 10.5 * e.pupil;
    const ix = ex + e.gx * rx * 0.42 - t * 4;
    const iy = eyeY + 2 + e.gy * ry * 0.38;
    return (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD} />
          </clipPath>
          {rg(`${id}-ew${k}`, ex, eyeY - 4, ry * 1.4, 0.4, [
            [0, '#FFFFFF'],
            [0.55, '#F6F8FA'],
            [1, '#C9D5DE'],
          ])}
        </defs>
        <Inked w={fw * 0.85}>
          <InkPath d={eyeD} fill={`url(#${id}-ew${k})`} />
        </Inked>
        <g clipPath={`url(#${id}-ec${k})`}>
          {iris && <circle cx={fmt(ix)} cy={fmt(iy)} r={fmt(pr * 1.62)} fill={iris} />}
          {iris && <circle cx={fmt(ix)} cy={fmt(iy)} r={fmt(pr * 1.62)} fill="none" stroke={shade(iris, 0.45)} strokeWidth={1.6} />}
          <circle cx={fmt(ix)} cy={fmt(iy)} r={fmt(iris ? pr * 0.82 : pr)} fill={INK} />
          {/* glossy catchlights: one big, one small (the shiny 2.5D eyes) */}
          <circle cx={fmt(ix + pr * 0.38)} cy={fmt(iy - pr * 0.42)} r={fmt(pr * 0.34 + 0.6)} fill="#FFFFFF" />
          <circle cx={fmt(ix - pr * 0.36)} cy={fmt(iy + pr * 0.36)} r={fmt(pr * 0.15 + 0.3)} fill="#FFFFFF" opacity={0.85} />
          {/* upper lid with its soft shadow on the eyeball */}
          <rect x={fmt(ex - rx - 4)} y={fmt(topY)} width={fmt(rx * 2 + 8)} height={7} fill="#5E7486" opacity={0.18} />
          <path d={`M${fmt(ex - rx - 4)},${fmt(eyeY - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(eyeY - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(topY + 1)} Q${fmt(ex)},${fmt(topY - 6 * (1 - L))} ${fmt(ex - rx - 4)},${fmt(topY + 1)} Z`} fill={mix(skin, shade(skin, 0.2), 0.5)} />
          {/* lower lid (squint) */}
          <path d={`M${fmt(ex - rx - 4)},${fmt(eyeY + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(eyeY + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(botY)} Q${fmt(ex)},${fmt(botY + 6)} ${fmt(ex - rx - 4)},${fmt(botY)} Z`} fill={lit(skin, 0.06)} />
        </g>
        {L > 0.04 && <InkLine d={Q({x: ex - rx - 1, y: topY + 1}, {x: ex, y: topY - 6 * (1 - L)}, {x: ex + rx + 1, y: topY + 1})} w={fw} />}
        {sq > 0.08 && <InkLine d={Q({x: ex - rx * 0.9, y: botY}, {x: ex, y: botY + 6}, {x: ex + rx * 0.9, y: botY})} w={fw * 0.7} opacity={clamp(sq * 2)} />}
      </g>
    );
  };

  // brows: thick ink strokes; inner end raised for worry/pain, whole brow lowered for strain
  // Glass Climbing V3: a brow never rises into the fringe: each of its points stays below the hairline curve (the
  // hair's lower edge, two quadratics through (+-100, -21), (+-60, -55), (0, -62), shifted with the turn) by the brow's
  // half thickness and a little skin
  const hairlineY = (x: number) => {
    const u = Math.min(1, Math.abs(x - hx) / 100);
    // invert x(t) = 100 - 80t - 20t^2 (one side of the curve, in |x|), then y(t)
    const t = (-80 + Math.sqrt(6400 + 80 * (100 - 100 * u))) / 40;
    const tc = Math.min(1, Math.max(0, t));
    return (1 - tc) * (1 - tc) * -21 + 2 * (1 - tc) * tc * -55 + tc * tc * -62;
  };
  const browFloor = (x: number, y: number) => Math.max(y, hairlineY(x) + inkW * 1.35 * 0.5 + 6);
  const Brow = (k: 'n' | 'f', ex: number, wf: number, inner: 1 | -1) => {
    const by = -50 + e.browDown * 9;
    const w = 22 * wf;
    const innerX = ex + inner * w * 0.95;
    const outerX = ex - inner * w * 1.05;
    const innerY = browFloor(innerX, by - e.browIn * 17 + e.browDown * 5);
    const outerY = browFloor(outerX, by + e.browIn * 5 - e.browDown * 1);
    const midY = browFloor(ex, (innerY + outerY) / 2 - 5 + e.browDown * 2);
    return <InkLine key={`b${k}`} d={Q({x: outerX, y: outerY}, {x: ex, y: midY}, {x: innerX, y: innerY})} w={inkW * 1.35} />;
  };

  // --- mouth
  const mx = xf - 6 * t;
  const my = 54;
  const mw = 28 * e.wide * (1 - 0.15 * t);
  const cornerY = my - e.smile * 10;
  const o = e.open;
  const upY = my - 2 - o * 6 - Math.max(0, e.smile) * 2;
  const loY = my + 4 + o * 46 + Math.max(0, e.smile) * 12;
  const mouthD = `M${fmt(mx - mw)},${fmt(cornerY)} Q${fmt(mx)},${fmt(upY - (cornerY - my) * 0.6)} ${fmt(mx + mw)},${fmt(cornerY)} Q${fmt(mx)},${fmt(loY)} ${fmt(mx - mw)},${fmt(cornerY)} Z`;
  const clenched = e.teeth > 0.5 && o < 0.62;

  const pass = useInk().pass;
  const body = (
    <>
      <defs>
        {rg(`${id}-sk`, -6, -8, 126, 0.52, [
          [0, lit(skin, 0.14)],
          [0.4, lit(skin, 0.04)],
          [0.78, skin],
          [0.95, shade(skin, 0.1)],
          [1, shade(skin, 0.15)],
        ])}
        {rg(`${id}-hr`, hx - 10, -90, 120, 0.6, [
          [0, lit(hair, 0.24)],
          [0.45, hair],
          [1, shade(hair, 0.3)],
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

      {/* far ear (mostly hidden by the head in 3/4) */}
      <Inked w={inkW * 0.9}>
        <InkPath d={ear(farEarX, -1)} fill={`url(#${id}-ear)`} />
      </Inked>
      {/* head, with the near ear in the same contour group (crew construction, one silhouette) */}
      <Inked w={inkW}>
        <InkPath d={headD} fill={`url(#${id}-sk)`} />
        <InkPath d={ear(nearEarX)} fill={`url(#${id}-ear)`} />
      </Inked>
      {pass !== 'ink' && (
        <g clipPath={`url(#${id}-hc)`}>
          {/* V3: no jaw shade or cool bounce light: the lower face stays one clean skin tone (clean-shaven) */}
          {/* hairline shadow on the forehead */}
          <ellipse cx={hx} cy={-66} rx={108} ry={18} fill={shade(skin, 0.3)} opacity={0.14} />
          {/* cheeks */}
          <ellipse cx={fmt(nearX + 18)} cy={30} rx={21} ry={17} fill={`url(#${id}-ck)`} opacity={(0.55 + 0.45 * e.flush) * cheekK} />
          <ellipse cx={fmt(farX - 16 * farW)} cy={30} rx={fmt(18 * farW)} ry={16} fill={`url(#${id}-ck)`} opacity={(0.5 + 0.45 * e.flush) * cheekK} />
        </g>
      )}
      {pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(nearEarX + 5)} cy={11} rx={6} ry={11} fill={shade(skin, 0.3)} opacity={0.45} />
          <path d={earRim(nearEarX)} fill="none" stroke={shade(skin, 0.42)} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
        </g>
      )}
      {earring && (
        <Inked w={inkW * 0.6}>
          <InkPath d={`M${fmt(nearEarX + 4 - 8)},38 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 Z`} fill="#FFC744" />
        </Inked>
      )}
      {/* hair (or a beanie over it) */}
      {hat ? (
        <g>
          <Inked w={inkW}>
            <InkPath d={`M${fmt(-106 + hx)},-30 C${fmt(-112 + hx)},-126 ${fmt(-52 + hx)},-152 ${fmt(4 + hx)},-150 C${fmt(60 + hx)},-150 ${fmt(112 + hx)},-122 ${fmt(106 + hx)},-30 Z`} fill={hat.color} />
          </Inked>
          {pass !== 'ink' && <ellipse cx={fmt(-40 + hx)} cy={-108} rx={34} ry={14} transform={`rotate(-24 ${fmt(-40 + hx)} -108)`} fill="#FFFFFF" opacity={0.16} />}
          {pass !== 'ink' && [-60, -30, 0, 30, 60].map((x) => <InkLine key={x} d={`M${fmt(x * 1.02 + hx)},-62 Q${fmt(x * 0.9 + hx)},-110 ${fmt(x * 0.5 + hx)},-140`} w={fw * 0.4} opacity={0.35} />)}
          <Inked w={inkW * 0.9}>
            <InkPath d={`M${fmt(-110 + hx)},-62 Q${fmt(hx)},-80 ${fmt(110 + hx)},-62 L${fmt(108 + hx)},-30 Q${fmt(hx)},-46 ${fmt(-108 + hx)},-30 Z`} fill={hat.band} />
          </Inked>
          {pass !== 'ink' && [-80, -48, -16, 16, 48, 80].map((x) => <InkLine key={`r${x}`} d={`M${fmt(x + hx)},${fmt(-66 - (1 - (x / 110) ** 2) * 10)} L${fmt(x + hx)},${fmt(-34 - (1 - (x / 110) ** 2) * 10)}`} w={fw * 0.45} opacity={0.4} />)}
        </g>
      ) : (
      <Inked w={inkW}>
        {hairStyle === 'bun' && <InkPath d={`M${fmt(bunC.x - 36)},${fmt(bunC.y)} a36,36 0 1,0 72,0 a36,36 0 1,0 -72,0 Z`} fill={`url(#${id}-hr)`} />}
        <InkPath d={hairD} fill={`url(#${id}-hr)`} />
      </Inked>
      )}
      {mask && (
        <Inked w={inkW * 0.8}>
          <InkPath d={`M${fmt(xf - 112)},-34 Q${fmt(xf)},-58 ${fmt(xf + 112)},-34 L${fmt(xf + 106)},12 Q${fmt(xf + 56)},30 ${fmt(xf)},8 Q${fmt(xf - 56)},30 ${fmt(xf - 106)},12 Z`} fill={mask} />
        </Inked>
      )}
      {!hat && hairStyle === 'bun' && pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(-42 + hx)} cy={-96} rx={30} ry={7} transform={`rotate(-20 ${fmt(-42 + hx)} -96)`} fill="#FFFFFF" opacity={0.16} />
          <ellipse cx={fmt(bunC.x - 12)} cy={fmt(bunC.y - 14)} rx={12} ry={6} transform={`rotate(-30 ${fmt(bunC.x - 12)} ${fmt(bunC.y - 14)})`} fill="#FFFFFF" opacity={0.18} />
        </g>
      )}
      {!hat && hairStyle !== 'bun' && pass !== 'ink' && (
        <g>
          {/* glossy streaks on the light side of the spikes */}
          {[
            [-26, -126, 34, 1],
            [26, -128, 36, 1],
            [-93, -110, 28, 1.2],
          ].map(([bx, by, ln, k], i) => {
            const tip = spike(bx, by, ln, k);
            const base = {x: bx * 0.75 + hx, y: -72};
            const m = add(base, mul({x: tip.x - base.x, y: tip.y - base.y}, 0.55));
            const ang = (Math.atan2(tip.y - base.y, tip.x - base.x) * 180) / Math.PI;
            return <ellipse key={i} cx={fmt(m.x - 5)} cy={fmt(m.y)} rx={fmt(Math.hypot(tip.x - base.x, tip.y - base.y) * 0.28)} ry={4.2} transform={`rotate(${fmt(ang)} ${fmt(m.x - 5)} ${fmt(m.y)})`} fill="#FFFFFF" opacity={0.3} />;
          })}
          <ellipse cx={fmt(-40 + hx)} cy={-78} rx={26} ry={6} transform={`rotate(-12 ${fmt(-40 + hx)} -78)`} fill="#FFFFFF" opacity={0.18} />
        </g>
      )}

      {/* worry lines above the brows */}
      {e.browIn > 0.5 && (
        <g opacity={clamp((e.browIn - 0.5) * 2)}>
          <InkLine d={Q({x: xf - 14, y: -86}, {x: xf, y: -91}, {x: xf + 14, y: -86})} w={fw * 0.7} />
          <InkLine d={Q({x: xf - 9, y: -76}, {x: xf, y: -80}, {x: xf + 9, y: -76})} w={fw * 0.6} />
        </g>
      )}
      {Eye('f', farX, farW, -1)}
      {Eye('n', nearX, 1, 1)}
      {/* crow's feet when squeezing */}
      {(e.shut > 0.3 || e.squint > 0.5) && (
        <g opacity={clamp(Math.max(e.shut, (e.squint - 0.5) * 2))}>
          {[-1, 0, 1].map((k) => (
            <InkLine key={k} d={`M${fmt(nearX + 26)},${fmt(eyeY + k * 9)} l${fmt(9)},${fmt(k * 5 - 1)}`} w={fw * 0.6} />
          ))}
          {[-1, 0, 1].map((k) => (
            <InkLine key={`f${k}`} d={`M${fmt(farX - 24 * farW)},${fmt(eyeY + k * 9)} l${fmt(-8 * farW)},${fmt(k * 5 - 1)}`} w={fw * 0.6} />
          ))}
        </g>
      )}
      {glasses && (
        <g>
          {[[nearX, 1], [farX, farW]].map(([x, wf], i) => {
            const lens = `M${fmt(x - 31 * wf)},-38 Q${fmt(x)},-44 ${fmt(x + 31 * wf)},-38 Q${fmt(x + 34 * wf)},4 ${fmt(x + 24 * wf)},18 Q${fmt(x)},26 ${fmt(x - 24 * wf)},18 Q${fmt(x - 34 * wf)},4 ${fmt(x - 31 * wf)},-38 Z`;
            return (
              <g key={i}>
                {pass !== 'ink' && <path d={lens} fill="#D8EEF8" opacity={0.22} />}
                <InkLine d={lens} w={fw * 0.75} />
              </g>
            );
          })}
          <InkLine d={`M${fmt(farX + 31 * farW)},-30 Q${fmt((nearX + farX) / 2)},-36 ${fmt(nearX - 31)},-30`} w={fw * 0.8} />
          {pass !== 'ink' && <path d={`M${fmt(nearX + 6)},-30 l10,-3 l-16,28 l-7,1 Z`} fill="#FFFFFF" opacity={0.22} />}
        </g>
      )}
      {frames && (
        <g>
          {[[nearX, 1], [farX, farW]].map(([x, wf], i) => {
            const w2 = 27 * wf, y0 = eyeY - 25, y1 = eyeY + 20, r = 11 * wf;
            const lens = `M${fmt(x - w2 + r)},${y0} L${fmt(x + w2 - r)},${y0} Q${fmt(x + w2)},${y0} ${fmt(x + w2)},${y0 + 11} L${fmt(x + w2)},${y1 - 11} Q${fmt(x + w2)},${y1} ${fmt(x + w2 - r)},${y1} L${fmt(x - w2 + r)},${y1} Q${fmt(x - w2)},${y1} ${fmt(x - w2)},${y1 - 11} L${fmt(x - w2)},${y0 + 11} Q${fmt(x - w2)},${y0} ${fmt(x - w2 + r)},${y0} Z`;
            return (
              <g key={i}>
                {pass !== 'ink' && <path d={lens} fill="#D8EEF8" opacity={0.16} />}
                <InkLine d={lens} w={fw * 1.15} />
              </g>
            );
          })}
          <InkLine d={`M${fmt(farX + 27 * farW)},${eyeY - 8} Q${fmt((nearX + farX) / 2)},${eyeY - 14} ${fmt(nearX - 27)},${eyeY - 8}`} w={fw * 1.1} />
          <InkLine d={`M${fmt(nearX + 27)},${eyeY - 12} L${fmt(nearEarX - 2)},${eyeY - 4}`} w={fw * 1.0} />
          {pass !== 'ink' && <path d={`M${fmt(nearX + 4)},${eyeY - 20} l9,-2 l-14,30 l-6,1 Z`} fill="#FFFFFF" opacity={0.2} />}
        </g>
      )}
      {Brow('f', farX, farW, 1)}
      {Brow('n', nearX, 1, -1)}

      {/* nose: the crew hook, turned toward screen-left in 3/4, with a glossy tip */}
      <InkLine d={`M${fmt(xf - 1)},${-2} Q${fmt(xf - 17 - 10 * t)},${24} ${fmt(xf - 2)},${31}`} w={fw} />
      {pass !== 'ink' && <ellipse cx={fmt(xf - 9 - 6 * t)} cy={12} rx={4} ry={2.6} fill="#FFFFFF" opacity={0.7} transform={`rotate(-30 ${fmt(xf - 9 - 6 * t)} 12)`} />}

      {/* mouth */}
      {o < 0.07 ? (
        <InkLine d={Q({x: mx - mw, y: cornerY}, {x: mx, y: my + e.smile * 14}, {x: mx + mw, y: cornerY})} w={fw * 1.05} />
      ) : (
        <g>
          <Inked w={fw * 0.85}>
            <InkPath d={mouthD} fill={`url(#${id}-mo)`} />
          </Inked>
          {pass !== 'ink' && (
            <g clipPath={`url(#${id}-mc)`}>
              {e.tongue > 0.01 && <ellipse cx={fmt(mx + 4)} cy={fmt(loY + 2)} rx={fmt(mw * 0.62)} ry={fmt(8 + o * 14)} fill="#E27583" opacity={e.tongue} />}
              {e.tongue > 0.01 && <ellipse cx={fmt(mx - 2)} cy={fmt(loY - 6 - o * 4)} rx={fmt(mw * 0.18)} ry={3} fill="#FFFFFF" opacity={0.45 * e.tongue} />}
              {clenched ? (
                <g opacity={e.teeth}>
                  <rect x={fmt(mx - mw)} y={fmt(upY - 10)} width={fmt(mw * 2)} height={fmt(loY - upY + 20)} fill="#FBFAF6" />
                  <rect x={fmt(mx - mw)} y={fmt((upY + loY) / 2 + 2)} width={fmt(mw * 2)} height={fmt(loY - upY)} fill="#E4E8EC" />
                  <line x1={fmt(mx - mw)} y1={fmt((upY + loY) / 2 + 1)} x2={fmt(mx + mw)} y2={fmt((upY + loY) / 2 + 1)} stroke={INK} strokeWidth={fw * 0.6} />
                  {[-0.5, 0, 0.5].map((k) => (
                    <line key={k} x1={fmt(mx + k * mw)} y1={fmt(upY - 6)} x2={fmt(mx + k * mw)} y2={fmt(loY + 6)} stroke={INK} strokeWidth={fw * 0.4} opacity={0.6} />
                  ))}
                </g>
              ) : (
                e.teeth > 0.01 && <rect x={fmt(mx - mw)} y={fmt(upY - 12)} width={fmt(mw * 2)} height={fmt(12 + 6 + o * 8)} rx={3} fill="#FBFAF6" opacity={e.teeth} />
              )}
            </g>
          )}
          {pass !== 'ink' && <InkLine d={mouthD} w={fw * 0.85} />}
        </g>
      )}

      {/* sweat: crew-style outlined drops at the temple */}
      {e.sweat > 0.02 &&
        [
          [farX - 44 * farW, -56, 0.5],
          [farX - 50 * farW, -34, 0.34],
        ].map(([x, y, k], i) => (
          <g key={i} opacity={e.sweat} transform={`translate(${fmt(x)} ${fmt(y)}) scale(${k})`}>
            <Inked w={fw * 0.7}>
              <InkPath d="M0,-13 C6,-4 9,3 9,8 C9,14 5,17 0,17 C-5,17 -9,14 -9,8 C-9,3 -6,-4 0,-13 Z" fill="#BFE6F5" />
            </Inked>
            {pass !== 'ink' && <ellipse cx={-3} cy={6} rx={2.6} ry={4} fill="#FFFFFF" />}
          </g>
        ))}

      {/* glossy highlights: forehead and cheekbone */}
      {pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(lightPt(52).x + 4)} cy={fmt(lightPt(52).y - 4)} rx={14} ry={6} transform={`rotate(-30 ${fmt(lightPt(52).x + 4)} ${fmt(lightPt(52).y - 4)})`} fill="#FFFFFF" opacity={0.2} />
          <ellipse cx={fmt(farX - 6)} cy={22} rx={4} ry={2.6} fill="#FFFFFF" opacity={0.35} />
          <ellipse cx={fmt(nearX + 8)} cy={20} rx={3.4} ry={2.4} fill="#FFFFFF" opacity={0.3} />
        </g>
      )}
    </>
  );

  return <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(s)})`}>{body}</g>;
};
