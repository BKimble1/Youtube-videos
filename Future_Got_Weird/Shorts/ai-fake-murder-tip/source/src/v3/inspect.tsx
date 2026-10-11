import React from 'react';
import {C, E, tw, lerp, clamp01, HED_FONT, EV, INK, CREAM, PAPER, GREY, CX, Rect, rectLerp, Shield, DEEP, fitSize, ramp} from './kit3';
import {Character, IDLE, Pose, reach} from '../components/Character';
import {CAST} from '../components/cast';

/* ------------------------------------------------------------------ B3: the contradiction. No portrait box: the checker stands behind a desk, pulls the source page in beside the claim, scans it with a finger, stops. */
export const PAGE3: Rect = {x: 430, y: 610, w: 446, h: 540};
export const STRIP: Rect = {x: 226, y: 520, w: 520, h: 560};     // a webpage prop in the test strip (centre of the frame)
export const STRIP_PITCH = 640;
const S = 2.6;                                                      // checker scale
const HEAD = {x: 262, y: 806};
const GROUND = {x: HEAD.x, y: HEAD.y + 372 * S};
const CH = {x: GROUND.x, y: GROUND.y, scale: S};
export const DESK: Rect = {x: 96, y: 1170, w: 780, h: 70};       // the counter; a cream cover below it hides the lower body, so nothing of the character can reach the caption lane (y >= 1262)
const SLIDE_FROM = 480;                                             // the page enters through a slot at the right edge of the safe column

/** strip scroll: card i is centred when scroll == i. -1 = the source page, 0 = page A, 1 = page B, 2 = the police form */
export const stripScroll = (g: number) => {
  const a = E.inOut(tw(g, EV['b4.pageA'] + 4, 9, (x) => x));
  const b = E.inOut(tw(g, EV['b4.pageB'], 9, (x) => x));
  const c = E.inOut(tw(g, EV['b4.pageC'], 9, (x) => x));
  return -1 + a + b + c;
};

const pageX = (g: number) => PAGE3.x + (1 - E.out(tw(g, EV['b3.pull'] + 4, 10, (x) => x))) * SLIDE_FROM;

/** Checker motion (V3.1): rest on the desk -> ONE short anticipation toward the page -> ONE monotonic scan along the first lines -> a short stop -> the hand leaves as the label lands. No repeated sweeps. */
const R_HAND = {x: PAGE3.x - 40, y: DESK.y - 6};        // rest: on the desk, left of the page
const A_HAND = {x: PAGE3.x + 70, y: PAGE3.y + 200};     // anticipation: just inside the page's left margin
const B_HAND = {x: PAGE3.x + 330, y: PAGE3.y + 262};    // end of the single scan
const T_ANT = EV['b3.scan0'] - 11;                      // 162
const T_SCAN0 = EV['b3.scan0'];                         // 173
const T_SCAN1 = EV['b3.stamp'] - 6;                     // 188
const T_REL = EV['b3.stamp'] - 3;                       // 191: the hand is already leaving when the label lands (f194), so "no description" is never covered
const T_REST = T_REL + 8;                               // 199
const pathK = (g: number, t0: number, t1: number) => E.inOut(ramp(g, t0, t1 - t0));
const handTarget = (g: number) => {
  if (g < T_ANT) return R_HAND;
  if (g < T_SCAN0) { const u = pathK(g, T_ANT, T_SCAN0); return {x: lerp(R_HAND.x, A_HAND.x, u), y: lerp(R_HAND.y, A_HAND.y, u)}; }
  if (g < T_SCAN1) { const u = pathK(g, T_SCAN0, T_SCAN1); return {x: lerp(A_HAND.x, B_HAND.x, u), y: lerp(A_HAND.y, B_HAND.y, u)}; }
  if (g < T_REL) return B_HAND;
  const u = pathK(g, T_REL, T_REST);
  return {x: lerp(B_HAND.x, R_HAND.x, u), y: lerp(B_HAND.y, R_HAND.y, u)};
};
/** where the scan highlight bar sits on the page (page coordinates); follows the single scan */
const scanBand = (g: number) => (g >= T_SCAN0 && g < EV['b3.stamp'] + 2 ? lerp(150, 266, pathK(g, T_SCAN0, T_SCAN1)) : -1);

export const pose3 = (g: number): Pose => {
  const stamp = EV['b3.stamp'], brow = EV['b3.brow'], look = EV['b3.look'], back = EV['b3.back'], blinkT = EV['b3.blink'];
  const ht = handTarget(g);
  const armR = reach(CH, 1, ht.x, ht.y, 1);
  // gaze: to the page with the anticipation, along the single scan, rests on the label, glances up at the claim, back down
  let lx = 0.55, ly = 0.15;
  if (g >= T_ANT && g < T_SCAN0) { const u = pathK(g, T_ANT, T_SCAN0); lx = lerp(0.55, 0.35, u); ly = lerp(0.15, 0.1, u); }
  else if (g >= T_SCAN0 && g < T_SCAN1) { const u = pathK(g, T_SCAN0, T_SCAN1); lx = lerp(0.35, 0.95, u); ly = lerp(0.1, 0.28, u); }
  else if (g >= T_SCAN1) { lx = 0.95; ly = 0.28; }
  const up = E.inOut(ramp(g, look, 5)), dn = E.inOut(ramp(g, back, 6));
  if (g >= look) { lx = lerp(lx, -0.1, up); ly = lerp(ly, -0.85, up); }
  if (g >= back) { lx = lerp(-0.1, 0.55, dn); ly = lerp(-0.85, 0.2, dn); }
  const browUp = E.out(ramp(g, brow, 5)) * (1 - 0.45 * E.inOut(ramp(g, back + 10, 14)));
  const blinkNow = g >= blinkT && g < blinkT + 3;
  return {
    ...IDLE,
    armR,
    armL: {a: 10, b: 14},
    mouth: g < stamp ? 'flat' : 'hmm',
    lookX: lx, lookY: ly,
    brows: lerp(0.05, 0.85, browUp),
    browAsym: browUp,
    tilt: lerp(0, -5, browUp),
    blink: blinkNow ? 0.05 : 1,
  };
};

/** a pointing finger drawn in the right hand (character-local coordinates, hand at 0,0, forearm pointing +y) */
const Finger: React.FC = () => (
  <g>
    <rect x={-7} y={6} width={14} height={34} rx={7} fill={CAST.checker.skin} stroke={INK} strokeWidth={4} />
  </g>
);

/** the label must fit inside the page: 'DESCRIPTION' is the widest line */
const STAMP_SZ = Math.floor(fitSize('DESCRIPTION', HED_FONT, 364, 92, 800, 1));

const PageBody: React.FC<{r: Rect; stamp: number; stampOp: number; band?: number}> = ({r, stamp, stampOp, band}) => {
  const k = r.w / PAGE3.w, kh = r.h / PAGE3.h;
  const hdr = 64 * kh;
  return (
    <g>
      <rect x={r.x + 8} y={r.y + 12} width={r.w} height={r.h} rx={24} fill={INK} opacity={0.2} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={24} fill={PAPER} stroke={INK} strokeWidth={7} />
      <path d={`M ${r.x} ${r.y + hdr} L ${r.x} ${r.y + 24} Q ${r.x} ${r.y} ${r.x + 24} ${r.y} L ${r.x + r.w - 24} ${r.y} Q ${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + 24} L ${r.x + r.w} ${r.y + hdr} Z`} fill={C.teal} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <Shield x={r.x + 46 * k} y={r.y + hdr / 2} s={0.56 * Math.min(1, k * 1.15)} />
      <text x={r.x + 92 * k} y={r.y + hdr / 2 + 2} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={40 * Math.min(1, k * 1.1)} letterSpacing={2} fill={CREAM}>POLICE PAGE</text>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={r.x + 36 * k} y={r.y + (130 + i * 58) * kh} width={(r.w - 72 * k) * [0.92, 0.78, 0.86, 0.6, 0.72][i]} height={18 * kh} rx={9} fill={GREY} />
      ))}
      {band !== undefined && band >= 0 && <rect x={r.x + 20 * k} y={r.y + (band - 14) * kh} width={r.w - 40 * k} height={42 * kh} rx={12} fill={C.teal} opacity={0.26} />}
      {stampOp > 0 && (
        <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h * 0.56}) rotate(-3) scale(${k * lerp(1.15, 1, stamp)})`} opacity={stampOp}>
          <rect x={-208} y={-STAMP_SZ * 1.78} width={416} height={STAMP_SZ * 3.56} rx={14} fill={PAPER} stroke={C.coral} strokeWidth={9} />
          {['NO', 'DESCRIPTION', 'PROVIDED'].map((ln, i) => (
            <text key={ln} x={0} y={(i - 1) * STAMP_SZ * 1.06} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={ln === 'NO' ? STAMP_SZ * 1.18 : STAMP_SZ} letterSpacing={ln === 'NO' ? 6 : 1} fill={C.coral}>{ln}</text>
          ))}
        </g>
      )}
    </g>
  );
};

/** The source page: slides through the right edge of the safe column on "Except…", is scanned, takes the label, then becomes the first prop of the test strip. */
export const SourcePage3: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.start'];
  const endAt = EV['b4.pageA'] + 15;
  if (g < EV['b3.pull'] || g >= endAt) return null;
  const px = pageX(g);
  const st = EV['b3.stamp'];
  const stampK = g < st ? 0 : E.out(tw(g, st, 4, (x) => x));
  const toStrip = E.inOut(ramp(g, EV['b4.start'], 7));
  const scroll = stripScroll(g);
  let r: Rect = {...PAGE3, x: px};
  r = rectLerp(r, {...STRIP, x: STRIP.x + (-1 - scroll) * STRIP_PITCH}, toStrip);
  const stampOp = stampK * (1 - clamp01(toStrip * 2.4));
  const band = scanBand(g);
  return (
    <g>
      <clipPath id="slot3"><rect x={96} y={440} width={780} height={760} /></clipPath>
      <g clipPath="url(#slot3)">
        <PageBody r={r} stamp={stampK} stampOp={stampOp} band={toStrip > 0 ? undefined : band} />
      </g>
    </g>
  );
};

/** The checker: body behind the page, the pointing arm in front of it, a counter hiding the lower body. She fades and drifts in/out inside the illustration region (never through the caption lane). */
const StageClip: React.FC = () => <clipPath id="stage3Clip"><rect x={-60} y={0} width={1200} height={DESK.y + DESK.h + 4} /></clipPath>;

const stageIn = (g: number) => E.out(ramp(g, EV['b3.start'] + 5, 7));            // f152-159: she fades in once the field is (almost) cream and the paper is nearly home; her face is readable before the scan starts (f162)
const stageOut = (g: number) => E.inOut(ramp(g, EV['b4.start'], 7));            // f223-229: gone before the next caption (f231)
const stageT = (g: number) => {
  const a = stageIn(g), o = stageOut(g);
  return {op: a * (1 - o), dx: -(1 - a) * 46 - o * 34};
};

export const Stage3: React.FC<{g: number}> = ({g}) => {
  if (g < EV['b3.start'] + 2 || stageOut(g) >= 1) return null;
  const {op, dx} = stageT(g);
  const pose = pose3(g);
  const wrap = `translate(${GROUND.x - 200 * S} ${GROUND.y - 500 * S})`;
  return (
    <g opacity={op} transform={`translate(${dx} 0)`}>
      <StageClip />
      <g clipPath="url(#stage3Clip)">
        <circle cx={HEAD.x + 20} cy={HEAD.y - 10} r={290} fill={DEEP} opacity={0.5} />
        <g transform={wrap}>
          <Character look={CAST.checker} pose={pose} frame={g} seed={5} scale={S} shadow={false} life={0} eyeDarts={false} front="R" pass="body" />
        </g>
        {/* the page is drawn by SourcePage3 (above this group); the pointing arm and the counter go in front of it, see Stage3Front */}
        <rect x={DESK.x + 8} y={DESK.y + 12} width={DESK.w} height={DESK.h} rx={26} fill={INK} opacity={0.2} />
      </g>
    </g>
  );
};

export const Stage3Front: React.FC<{g: number}> = ({g}) => {
  if (g < EV['b3.start'] + 2 || stageOut(g) >= 1) return null;
  const {op, dx} = stageT(g);
  const pose = pose3(g);
  const wrap = `translate(${GROUND.x - 200 * S} ${GROUND.y - 500 * S})`;
  return (
    <g opacity={op} transform={`translate(${dx} 0)`}>
      <g clipPath="url(#stage3Clip)">
        <g transform={wrap}>
          <Character look={CAST.checker} pose={pose} frame={g} seed={5} scale={S} shadow={false} life={0} eyeDarts={false} front="R" pass="frontArm" holdR={<Finger />} />
        </g>
        <rect x={DESK.x} y={DESK.y} width={DESK.w} height={DESK.h} rx={26} fill={DEEP} stroke={INK} strokeWidth={7} />
      </g>
    </g>
  );
};
void CX;
