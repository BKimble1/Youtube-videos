import React from 'react';
import {C, E, tw, lerp, clamp01, HED_FONT, EV, INK, CREAM, PAPER, GREY, CX, Rect, rectLerp, Shield, DEEP, fitSize} from './kit3';
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
export const DESK: Rect = {x: 96, y: 1170, w: 780, h: 96};
const SLIDE_FROM = 480;                                             // the page enters through a slot at the right edge of the safe column

/** strip scroll: card i is centred when scroll == i. -1 = the source page, 0 = page A, 1 = page B, 2 = the police form */
export const stripScroll = (g: number) => {
  const a = E.inOut(tw(g, EV['b4.pageA'] + 4, 9, (x) => x));
  const b = E.inOut(tw(g, EV['b4.pageB'], 9, (x) => x));
  const c = E.inOut(tw(g, EV['b4.pageC'], 9, (x) => x));
  return -1 + a + b + c;
};

const pageX = (g: number) => PAGE3.x + (1 - E.out(tw(g, EV['b3.pull'] + 2, 10, (x) => x))) * SLIDE_FROM;

/** where the checker's right hand is aimed in world coordinates */
const handTarget = (g: number) => {
  const scan0 = EV['b3.scan0'], stamp = EV['b3.stamp'];
  const px = pageX(g);
  const pull = EV['b3.pull'];
  if (g < scan0 - 6) {
    // pulling: the hand grips the page's left edge and brings it in; then it settles at the margin
    const settle = E.inOut(tw(g, pull + 12, 6, (x) => x));
    return {x: lerp(px + 20, PAGE3.x + 40, settle * 0), y: lerp(PAGE3.y + 330, PAGE3.y + 250, settle)};
  }
  const rel = stamp - 3;                  // the hand is already on its way off the page when the label lands, so "no description" is never covered
  if (g < rel) {
    const n = clamp01((g - scan0) / (rel - scan0));
    const idx = Math.min(2, Math.floor(n * 3));
    const fr = n * 3 - idx;
    return {x: lerp(PAGE3.x + 90, PAGE3.x + 360, E.inOut(fr)), y: PAGE3.y + 150 + idx * 58};
  }
  const rest = E.inOut(tw(g, rel, 7, (x) => x));
  return {x: lerp(PAGE3.x + 360, PAGE3.x - 60, rest), y: lerp(PAGE3.y + 266, PAGE3.y + 620, rest)};   // lets go and rests on the desk, clear of the label
};

export const pose3 = (g: number): Pose => {
  const scan0 = EV['b3.scan0'], stamp = EV['b3.stamp'], brow = EV['b3.brow'], look = EV['b3.look'], back = EV['b3.back'], blinkT = EV['b3.blink'];
  const ht = handTarget(g);
  const armR = reach(CH, 1, ht.x, ht.y, 1);
  // gaze: at the page, three reading sweeps, freeze at the label, glance up at the claim, back down
  let lx = 0.55, ly = 0.15;
  if (g >= scan0 && g < stamp) {
    const n = clamp01((g - scan0) / (stamp - scan0));
    const idx = Math.min(2, Math.floor(n * 3));
    const fr = n * 3 - idx;
    lx = lerp(0.35, 0.95, E.inOut(fr)); ly = 0.1 + 0.12 * idx;
  } else if (g >= stamp) { lx = 0.95; ly = 0.3; }
  const up = E.inOut(tw(g, look, 5, (x) => x)), dn = E.inOut(tw(g, back, 6, (x) => x));
  if (g >= look) { lx = lerp(lx, -0.1, up); ly = lerp(ly, -0.85, up); }
  if (g >= back) { lx = lerp(-0.1, 0.55, dn); ly = lerp(-0.85, 0.2, dn); }
  const browUp = E.out(tw(g, brow, 5, (x) => x)) * (1 - 0.45 * E.inOut(tw(g, back + 10, 14, (x) => x)));
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
  const st = EV['b3.stamp'], sc0 = EV['b3.scan0'];
  const stampK = g < st ? 0 : E.out(tw(g, st, 4, (x) => x));
  const toStrip = E.inOut(tw(g, EV['b4.start'], 9, (x) => x));
  const scroll = stripScroll(g);
  let r: Rect = {...PAGE3, x: px};
  r = rectLerp(r, {...STRIP, x: STRIP.x + (-1 - scroll) * STRIP_PITCH}, toStrip);
  const stampOp = stampK * (1 - clamp01(toStrip * 2.4));
  const band = g >= sc0 && g < st + 2 ? lerp(150, 150 + 2 * 58, clamp01((g - sc0) / (st - sc0))) : -1;
  return (
    <g>
      <clipPath id="slot3"><rect x={96} y={560} width={780} height={640} /></clipPath>
      <g clipPath={toStrip > 0 ? undefined : 'url(#slot3)'}>
        <PageBody r={r} stamp={stampK} stampOp={stampOp} band={toStrip > 0 ? undefined : band} />
      </g>
    </g>
  );
};

/** The checker: body behind the page, the pointing arm in front of it, a desk hiding the lower body. Leaves (drops away) as the page joins the strip. */
export const Stage3: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.start'];
  const ex = E.inOut(tw(g, EV['b4.start'], 9, (x) => x));
  if (g < t0 + 2 || ex >= 1) return null;
  const en = E.out(tw(g, EV['b3.start'] + 1, 10, (x) => x));
  const dy = (1 - en) * 620 + ex * 560;
  const pose = pose3(g);
  const wrap = `translate(${GROUND.x - 200 * S} ${GROUND.y - 500 * S})`;
  const px = pageX(g);
  return (
    <g transform={`translate(0 ${dy})`}>
      <circle cx={HEAD.x + 20} cy={HEAD.y - 10} r={290} fill={DEEP} opacity={0.5} />
      <g transform={wrap}>
        <Character look={CAST.checker} pose={pose} frame={g} seed={5} scale={S} shadow={false} life={0} eyeDarts={false} front="R" pass="body" />
      </g>
      {/* the page is drawn by SourcePage3 (above this group); the pointing arm and the desk go in front of it, see Stage3Front */}
      <rect x={DESK.x + 8} y={DESK.y + 12} width={DESK.w} height={DESK.h} rx={26} fill={INK} opacity={0.2} />
    </g>
  );
};

export const Stage3Front: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.start'];
  const ex = E.inOut(tw(g, EV['b4.start'], 9, (x) => x));
  if (g < t0 + 2 || ex >= 1) return null;
  const en = E.out(tw(g, EV['b3.start'] + 1, 10, (x) => x));
  const dy = (1 - en) * 620 + ex * 560;
  const pose = pose3(g);
  const wrap = `translate(${GROUND.x - 200 * S} ${GROUND.y - 500 * S})`;
  return (
    <g transform={`translate(0 ${dy})`}>
      <g transform={wrap}>
        <Character look={CAST.checker} pose={pose} frame={g} seed={5} scale={S} shadow={false} life={0} eyeDarts={false} front="R" pass="frontArm" holdR={<Finger />} />
      </g>
      <rect x={DESK.x} y={DESK.y} width={DESK.w} height={DESK.h} rx={26} fill={DEEP} stroke={INK} strokeWidth={7} />
      <rect x={-40} y={DESK.y + DESK.h - 4} width={1160} height={700} fill={CREAM} />
    </g>
  );
};
void CX;
