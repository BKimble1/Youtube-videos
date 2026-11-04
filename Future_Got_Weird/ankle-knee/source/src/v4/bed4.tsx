// V4 recovery, and the match back to the field.
//   WakeShot4   17.03-18.20  "woke up, he could still": WIDE. The hospital room (window, monitor, drip stand), the raised
//                            bed, the blanket over his other leg, the operated leg on a wedge pillow with his own turned
//                            foot hanging past its end, toes resting on the sheet. His eyes open on "woke"; on "he could
//                            still" his head dips and his gaze goes down to the leg.
//   ToesShot4   18.20-18.84  "wiggle his toes": straight to the toes. The turned foot hangs toes-down (big toe, four
//                            smaller toes, nails) with its toes on the sheet; ONE wiggle (WIGGLE0-WIGGLE1): the toes curl
//                            and grip, the sheet dimples and creases under them, then they spread and settle.
//   NoticeShot4 18.84-19.50  close on his face: his eyes drop to the foot, a small believable smile.
//   SockShot4   19.50-20.20  "And once he learned": a MATCH CUT. The same foot at the same screen position, size and angle,
//                            now inside the fitted, rimmed, translucent socket, back on the field: he sits on the turf
//                            with the knee up, the pylon running down to the cleat resting on its heel. A small toe flex
//                            inside the socket, then the turned ankle flexes and draws the cleat back toward him, as if
//                            getting ready to stand.
// The match: the turned foot's ankle pivot A is at A_SCR (screen px) with the same angle FA_M and the same scale (W_M
// cm across the frame) at the end of ToesShot4 and at the start of SockShot4; the bed's foot and the socket's foot are
// the same drawing (BioFoot geometry; the socket seats it at SEAT = 35 deg off the shank, so the field shank runs at
// FA_M + 35 deg).
// World units are centimetres, y up is negative; he faces screen-LEFT, his right (operated) leg nearest the lens.
import React from 'react';
import {Cam, Layer, W, H as SH, camScale, D0, horizonY, groundD, proj} from '../camera';
import {Deco, INK, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {Blob, Capsule, Lin, SoftShadow} from '../dc/shade';
import {Limb} from '../dc/limb';
import {Expr, Head, EXPR_NEUTRAL} from '../dc/Head';
import {Hand, HandPose, HAND_RELAXED} from '../dc/Hand';
import {lit, mix, shade} from '../dc/color';
import {add, fmt, mul, norm, P, sub, V} from '../dc/math';
import {closed} from '../core/geo';
import {C} from '../art/pal';
import {BioFoot, Cleat, DIMW, FOOT_BODY, TOES, SEAT, SOCKET_BOT, SOCKET_OUT, dirA, footPt, cleatLow, shankPt} from '../art/wyatt';
import {ForeGrass} from '../art/pitch';
import {Wyatt2, bjoints, BPose, SKIN} from '../v2/body';
import {HAND_EASY, HAND_OPEN, legTo} from '../v2/poses';
import {clamp, lerp, ss, ss5, hash, keyS} from '../lib';
import {T4, CUT_WAKE, CUT_TOES, WIGGLE0, WIGGLE1, CUT_NOTICE, CUT_SOCK, CUT_FIELD} from './story4';

const rad = (d: number) => (d * Math.PI) / 180;
const angOf = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const pth = (ps: V[], t = 0.6) => closed(ps, t);
const pp = (ps: [number, number][], t = 0.6) => closed(ps.map(([x, y]) => ({x, y})), t);

// ------------------------------------------------------------------------------------------------ the match
/** the turned foot's angle (from straight down, + = toes toward his front) in the toes shot and the socket shot */
export const FA_M = 10;
/** cm across the frame in the toes shot and at the start of the socket shot (40: with the leg extended the cleat lies
 *  ~34 cm forward of the turned ankle, so at this width and A_SCR most of the cleat, heel and studs, is in frame from
 *  the first socket frame, and all of it once it is drawn back) */
export const W_M = 40;
/** screen position (px) of the turned ankle's pivot A at the match (right and high: room for the pylon and cleat
 *  down-left of the socket in the field; spare sheet below the toes in bed) */
export const A_SCR: V = {x: 770, y: 820};
const S_M = W / W_M;
/** a camera of width W_M that puts world point A at A_SCR */
const matchCam = (A: V, eye: number): Cam => ({x: A.x - (A_SCR.x - W / 2) / S_M, y: A.y - (A_SCR.y - SH / 2) / S_M, w: W_M, eye});

// ------------------------------------------------------------------------------------------------ his own foot
/** BioFoot (art/wyatt) with two extras for the wiggle: `spread` fans the four smaller toes away from the big toe
 *  (deg), `curlS` is the smaller toes' own curl (a little behind the big toe's, a ripple across the toes). With
 *  spread = 0 and curlS = curl it draws exactly BioFoot (h = -1), the foot the socket holds in the field. */
const WiggleFoot: React.FC<{id: string; A: V; fa: number; iw: number; curl: number; curlS?: number; spread?: number; skin?: string}> = ({id, A, fa, iw, curl, curlS, spread = 0, skin = SKIN}) => {
  const h = -1;
  const F = (u: number, v: number) => footPt(A, fa, h, u, v);
  const d = closed(FOOT_BODY.map(([u, v]) => F(u, v)), 1);
  const cs = curlS ?? curl;
  const toe = (k: number) => {
    const [u, v, l, r] = TOES[k];
    const a = rad((k === 0 ? curl : cs * 1.15) - (k === 0 ? 2 : 4 + k * 2) - (k === 0 ? -0.35 : 0.3 + 0.28 * k) * spread);
    const tip = {u: u + l * Math.cos(a), v: v + l * Math.sin(a)};
    return {b: F(u - 0.6, v), t: F(tip.u, tip.v), r};
  };
  const ts = [0, 1, 2, 3, 4].map(toe);
  const fdir = dirA(fa);
  return (
    <g>
      <Inked w={iw}>
        {[4, 3, 2, 1].map((k) => (
          <Capsule key={k} id={`${id}-t${k}`} a={ts[k].b} b={ts[k].t} ra={ts[k].r * 1.05} rb={ts[k].r} color={shade(skin, 0.08 + 0.04 * k)} />
        ))}
      </Inked>
      <Inked w={iw}>
        <Blob id={`${id}-f`} d={d} c={F(3, 0.5)} r={13} color={skin} k={0.85} />
        <Capsule id={`${id}-t0`} a={ts[0].b} b={ts[0].t} ra={1.95} rb={ts[0].r} color={skin} />
      </Inked>
      <Deco>
        <ellipse cx={fmt(F(6.2, 4.2).x)} cy={fmt(F(6.2, 4.2).y)} rx={4.0} ry={0.85} transform={`rotate(${fmt(angOf(fdir))} ${fmt(F(6.2, 4.2).x)} ${fmt(F(6.2, 4.2).y)})`} fill={shade(skin, 0.3)} opacity={0.35} />
        <ellipse cx={fmt(F(-0.4, -1.0).x)} cy={fmt(F(-0.4, -1.0).y)} rx={1.7} ry={1.4} fill={lit(skin, 0.35)} opacity={0.55} />
        <InkLine d={`M${P(F(-1.6, -2.2))} Q${P(F(-0.3, -2.9))} ${P(F(1.0, -1.9))}`} w={iw * 0.45} opacity={0.5} />
        <ellipse cx={fmt(F(-4.6, 2.4).x)} cy={fmt(F(-4.6, 2.4).y)} rx={1.3} ry={0.8} fill="#FFFFFF" opacity={0.3} />
        <InkLine d={`M${P(F(12.1, 3.2))} Q${P(F(12.5, 4.4))} ${P(F(12.2, 5.6))}`} w={iw * 0.4} opacity={0.5} />
        {ts.map((q, k) => {
          const back = k === 0 ? 1.0 : 0.6;
          const along = norm(sub(q.t, q.b));
          const c = add(add(q.t, mul(along, -back)), mul(dirA(fa - 90 * h), -q.r * 0.45));
          const rx = k === 0 ? 0.95 : 0.55, ry = k === 0 ? 0.55 : 0.36;
          return <ellipse key={k} cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} transform={`rotate(${fmt(angOf(along))} ${fmt(c.x)} ${fmt(c.y)})`} fill={C.nail} stroke={INK} strokeWidth={iw * 0.3} opacity={k === 0 ? 1 : 0.9} />;
        })}
      </Deco>
    </g>
  );
};
/** the big toe's end (its capsule's end circle) and its lowest point: where it meets the sheet */
const bigToe = (A: V, fa: number, curl: number) => {
  const [u, v, l, r] = TOES[0];
  const a = rad(curl - 2);
  const c = footPt(A, fa, -1, u + l * Math.cos(a), v + l * Math.sin(a));
  return {c, r, low: {x: c.x, y: c.y + r}};
};

// ------------------------------------------------------------------------------------------------ the bed world
const HB: V = {x: 0, y: -22}; // his hip in bed
const MT = -10.95; // the sheet's surface (mattress top): the big toe's pad rests on it
const FLOOR = 44;
/** in bed: recoveryPose's body (back and head on the raised bed, the operated leg on a wedge), his other knee drawn up
 *  under the blanket (it tents the blanket behind the hanging foot) */
const HB_F: V = {x: HB.x + 2, y: HB.y - 2};
const FAR_BED = legTo(HB_F, {x: -46, y: MT - 4.2}, 90);
const bedPose = (o: {expr: Expr; blink: number; neck: number; aN?: {sh: number; el: number}; breath?: number; turn?: number}): BPose => ({
  hip: HB, pelvis: -24, chest: -40 + 0.8 * (o.breath ?? 0), near: {hip: 100, knee: 0, ank: 0}, far: FAR_BED,
  stag: {x: 2, y: -2}, aN: o.aN ?? {sh: 26, el: 66}, aF: {sh: 26, el: 66}, hN: HAND_RELAXED, hF: HAND_RELAXED, wN: 8, wF: 8,
  neck: o.neck, turn: o.turn ?? 0.85, expr: o.expr, blink: o.blink,
});
const BED_A = bjoints(bedPose({expr: EXPR_NEUTRAL, blink: 0, neck: 20})).A; // (-34.5, -28.1)
const BED_FOOTREL = 100 - FA_M; // the foot's angle from the thigh's axis (90 = neutral)

/** the toes' wiggle (curl deg, + = toward the sole) and spread, one movement WIGGLE0 -> WIGGLE1 */
const W0 = WIGGLE0, W1 = WIGGLE1;
const WIG_CURL: [number, number][] = [[W0, 0], [W0 + 0.13, 44], [W0 + 0.2, 40], [W0 + 0.33, -24], [W1, 0]];
const WIG_PRESS: [number, number][] = [[W0 + 0.24, 0.3], [W0 + 0.345, 1], [W1 - 0.06, 0.5], [W1 + 0.04, 0.3]];
export const wiggle4 = (t: number) => {
  // C2 ease between keys (no overshoot: exactly 0 before W0 and from W1 on, so the match frame is the socket's foot)
  const curl = keyS(t, WIG_CURL);
  const curlS = keyS(t - 0.035, WIG_CURL);
  const spread = 14 * Math.max(0, Math.sin(Math.PI * clamp((t - (W0 + 0.2)) / (W1 - W0 - 0.2))));
  // the foot gives with the toes: it lifts a little as they curl (the gripped sheet comes up with them) and presses
  // down as they extend (the dimple); exactly FA_M at rest
  const fa = FA_M + 0.06 * curl;
  const grip = ss(t, W0 + 0.02, W0 + 0.08) * (1 - ss(t, W0 + 0.2, W0 + 0.27));
  // how hard the toes press the sheet (dimple and creases): builds over ~3 frames as they come down and extend, eases
  // back to the resting 0.3 by W1 + 0.04
  const press = keyS(t, WIG_PRESS);
  return {curl, curlS, spread, fa, grip, press};
};

/** the sheet under the toes: a dimple and creases where they press; when they curl they grip the sheet and pull a
 *  little tent of it up with them */
const SheetReact: React.FC<{pad: V; press: number; grip: number; iw: number; k: string; creases?: boolean; pullAct?: number}> = ({pad, press, grip, iw, k, creases = true, pullAct}) => {
  const s = clamp(press), g = clamp(grip);
  const lift = Math.max(0, MT - pad.y) * g;
  const ink = shade(C.sheetDeep, 0.3);
  const x = pad.x;
  // crease activity: the press, or the pull of the gripped fabric (pullAct: a 3-frame average of it, so the creases
  // build with the curl instead of snapping on in one frame)
  const act = Math.max(s, pullAct ?? clamp(lift / 1.6));
  // the gripped fabric: a soft hump (rounded crown, long feathered skirts) in the sheet's own colour, no closed contour
  // (its skirts run out along the sheet's visible edge, SL: the blanket's lower edge and its ink line, at MT + 0.5 ..
  // MT + 0.76, which the hump covers)
  const SL = MT + 0.66;
  const crown = MT - lift, hw = 0.9 + lift * 0.35;
  const xl = x - 5.0 - lift * 1.3, xr = x + 4.1 + lift * 0.8;
  const tentTop = `M${fmt(xl)},${fmt(SL)} C${fmt(x - 2.6)},${fmt(SL)} ${fmt(x - hw - 0.9)},${fmt(crown)} ${fmt(x - 0.2)},${fmt(crown - 0.05)} C${fmt(x + hw + 0.4)},${fmt(crown)} ${fmt(x + 1.9)},${fmt(SL)} ${fmt(xr)},${fmt(SL)}`;
  const tent = `${tentTop} L${fmt(xr)},${fmt(SL + 0.14)} L${fmt(xl)},${fmt(SL + 0.14)} Z`;
  return (
    <g>
      {/* the gripped hump first: the dimple's shadow and the creases fall over its base */}
      {lift > 0.04 && (
        <g opacity={clamp(lift / 0.5)}>
          <path d={tent} fill={lit(C.sheet, 0.3)} />
          {/* only a faint, thin line along the crown (no ink round its base), so it reads as the sheet pulled up */}
          <path d={tentTop} fill="none" stroke={shade(C.sheetDeep, 0.15)} strokeWidth={iw * 0.3} strokeLinecap="round" opacity={0.45} />
          <path d={`M${fmt(x - 2.6 - lift * 0.5)},${fmt(MT)} Q${fmt(x - 1.2)},${fmt(MT - lift * 0.45)} ${fmt(x - 0.6)},${fmt(MT - lift * 0.9)}`} fill="none" stroke={ink} strokeWidth={iw * 0.45} opacity={0.8} />
          <path d={`M${fmt(x + 2.2 + lift * 0.3)},${fmt(MT)} Q${fmt(x + 1.0)},${fmt(MT - lift * 0.4)} ${fmt(x + 0.4)},${fmt(MT - lift * 0.85)}`} fill="none" stroke={ink} strokeWidth={iw * 0.4} opacity={0.6} />
        </g>
      )}
      <SoftShadow id={`${k}dp`} c={{x: x - 0.3, y: MT + 0.8}} rx={4.4 + 2.2 * act} ry={1.0 + 0.8 * s} alpha={0.18 + 0.3 * act} color="#3E5A6B" />
      {creases && [-1, -0.5, 0.15, 0.75].map((q, i) => {
        const x0 = x + q * 1.6 - 0.4;
        const len = 4.5 + 4.5 * act;
        const pull = lift * 0.5;
        return <path key={i} d={`M${fmt(x0 - q * pull)},${fmt(MT + 0.6)} Q${fmt(x0 + q * (2.4 + 1.4 * act))},${fmt(MT + 1.9 + 1.0 * s)} ${fmt(x0 + q * len)},${fmt(MT + 3.2 + 2.0 * Math.abs(q) + 1.3 * act)}`} fill="none" stroke={ink} strokeWidth={iw * (0.55 + 0.7 * act)} strokeLinecap="round" opacity={0.22 + 0.7 * act} />;
      })}
    </g>
  );
};

/** the room behind the bed (wide shot, a still camera): wall, window with daylight, the monitor, the drip stand */
const Room: React.FC<{c: Cam; k: string}> = ({c, k}) => (
  <>
    <svg width={W} height={SH} style={{position: 'absolute', left: 0, top: 0}}>
      <defs><linearGradient id={`${k}wl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={lit(C.wall, 0.35)} /><stop offset="1" stopColor={C.wallDeep} /></linearGradient></defs>
      <rect x={0} y={0} width={W} height={SH} fill={`url(#${k}wl)`} />
    </svg>
    <Layer c={c} blur={1.4}>
      {/* the window: soft daylight, a tree outside; a curtain */}
      <rect x={-44} y={-104} width={40} height={46} rx={1.6} fill="#F2FAFD" stroke={shade(C.wallDeep, 0.1)} strokeWidth={1.6} />
      <rect x={-41.5} y={-101.5} width={35} height={41} fill="#CBE8F5" />
      <ellipse cx={-30} cy={-66} rx={13} ry={9} fill="#AFD8B8" opacity={0.85} />
      <ellipse cx={-14} cy={-70} rx={9} ry={7.5} fill="#BFE0C4" opacity={0.75} />
      <rect x={-24.6} y={-101.5} width={1.3} height={41} fill={shade(C.wallDeep, 0.05)} />
      <path d="M-50,-108 C-47,-92 -51,-74 -48,-56 L-41,-56 C-43,-74 -40,-92 -42,-108 Z" fill="#D7E7EF" />
      {/* the service rail on the wall behind the bed head */}
      <rect x={8} y={-86} width={60} height={5} rx={1.2} fill="#C7D8E1" />
      {[16, 26, 36].map((x) => <circle key={x} cx={x} cy={-83.5} r={1.2} fill="#9FB3BF" />)}
      {/* the floor */}
      <rect x={-120} y={FLOOR} width={260} height={40} fill={shade(C.wallDeep, 0.18)} />
      <rect x={-120} y={FLOOR - 3} width={260} height={3} fill={shade(C.wallDeep, 0.1)} />
    </Layer>
    <Layer c={c} blur={0.7}>
      {/* the bedside monitor on its arm */}
      <rect x={33} y={-90} width={2} height={20} fill="#8C9AA6" />
      <rect x={24} y={-104} width={24} height={16} rx={2} fill="#5B6B79" />
      <rect x={26} y={-102} width={20} height={12} rx={1} fill="#2F3D49" />
      <path d="M27.5,-96 l3.5,0 l1.5,-3 l2,6 l1.5,-3 l7,0" fill="none" stroke="#7FE3B5" strokeWidth={0.8} />
    </Layer>
  </>
);
/** the bed under him: frame, mattress and sheet, the lowered side rail, the raised backrest */
const BedFrame: React.FC<{iw: number; k: string}> = ({iw, k}) => (
  <g>
    {/* the drip stand behind the bed head */}
    <rect x={40} y={-98} width={1.4} height={FLOOR + 96} fill="#A7B3BD" stroke={INK} strokeWidth={iw * 0.3} />
    <path d="M35,-98 L46,-98" stroke="#A7B3BD" strokeWidth={1.4} />
    <path d="M36.5,-97 q-3.5,1.5 -3.5,7 l0,9 q0,3.5 3.5,3.5 q3.5,0 3.5,-3.5 l0,-9 q0,-5.5 -3.5,-7 z" fill="#E6F3F8" stroke="#8FB0C0" strokeWidth={iw * 0.5} opacity={0.95} />
    <path d="M36.5,-77.5 C36.5,-66 33,-56 30,-50" fill="none" stroke="#C9DCE6" strokeWidth={0.6} />
    {/* legs, wheels, the frame */}
    {[-86, 52].map((x) => (
      <g key={x}>
        <rect x={x - 1.6} y={MT + 20} width={3.2} height={FLOOR - MT - 26} fill={C.bedDeep} stroke={INK} strokeWidth={iw * 0.6} />
        <circle cx={x} cy={FLOOR - 3.2} r={3.2} fill="#5E6B76" stroke={INK} strokeWidth={iw * 0.6} />
      </g>
    ))}
    <Inked w={iw}>
      <InkPath d={pp([[-95, MT + 14], [62, MT + 14], [62, MT + 21], [-95, MT + 21]], 0.1)} fill={C.bedDeep} />
      <Lin id={`${k}mt`} d={pp([[-95, MT], [62, MT], [62, MT + 14], [-95, MT + 14]], 0.12)} from={{x: 0, y: MT}} to={{x: 0, y: MT + 14}} stops={[[0, lit(C.sheet, 0.25)], [1, C.sheetDeep]]} />
      {/* the raised backrest behind his back */}
      <InkPath d={pp([[10, MT + 1], [30, MT + 1], [86, -84], [66, -96]], 0.22)} fill={C.bed} />
    </Inked>
    {/* the lowered side rail */}
    <g>
      <rect x={-62} y={MT + 24} width={70} height={11} rx={3} fill="none" stroke={INK} strokeWidth={iw * 1.25} />
      <rect x={-62} y={MT + 24} width={70} height={11} rx={3} fill="none" stroke={C.metal} strokeWidth={iw * 0.75} />
      {[-48, -27, -6].map((x) => <rect key={x} x={x} y={MT + 24} width={1.2} height={11} fill={C.metal} stroke={INK} strokeWidth={iw * 0.25} />)}
    </g>
    <Deco>
      <path d={`M-95,${fmt(MT + 3.2)} L62,${fmt(MT + 3.2)}`} stroke={C.sheetDeep} strokeWidth={iw * 0.5} opacity={0.5} />
    </Deco>
  </g>
);
/** pillows behind his back and head */
const Pillows: React.FC<{iw: number; k: string}> = ({iw, k}) => (
  <Inked w={iw}>
    <Blob id={`${k}pb`} d={pp([[14, -30], [26, -52], [40, -60], [50, -44], [36, -20], [20, -14]])} c={{x: 30, y: -40}} r={26} color={lit(C.sheet, 0.05)} k={0.8} />
    <Blob id={`${k}ph`} d={pp([[22, -62], [36, -88], [58, -86], [60, -58], [42, -46], [28, -48]])} c={{x: 40, y: -68}} r={26} color={C.sheet} k={0.8} />
  </Inked>
);
/** the blanket over his other leg (tented over the drawn-up knee) and his lap */
const BED_J = bjoints(bedPose({expr: EXPR_NEUTRAL, blink: 0, neck: 20}));
const Blanket: React.FC<{iw: number; k: string; x0?: number}> = ({iw, k, x0 = -110}) => {
  const K = BED_J.K;
  const d = pp([[x0, MT + 0.5], [x0, MT - 4], [-78, MT - 6.5], [-60, MT - 9.5], [-52.5, MT - 19.5], [K.x - 13, K.y + 1], [K.x - 4, K.y - 5.6], [K.x + 3.5, K.y - 5], [K.x + 13, K.y - 2.4], [K.x + 23, K.y + 1.8], [K.x + 31, K.y + 5], [9, K.y + 5.6], [16, -30], [19, MT - 4], [17, MT + 0.5]], 0.5);
  return (
    <g>
      <Inked w={iw}>
        <Blob id={`${k}bk`} d={d} c={{x: K.x - 2, y: K.y - 2}} r={52} color={C.gown} k={0.75} />
      </Inked>
      <Deco>
        {/* folds falling from the knee */}
        {[[-14, 7, -22, 22], [-10, 6, -17, 27], [-7, 6, -10, 26], [4, 5, 6, 24], [11, 6, 14, 18]].map(([a, b, c2, d2], i) => (
          <path key={i} d={`M${fmt(K.x + a * 0.3)},${fmt(K.y - 3.5 + b * 0.2)} Q${fmt(K.x + a * 0.8)},${fmt(K.y + b)} ${fmt(K.x + c2)},${fmt(K.y + d2)}`} fill="none" stroke={shade(C.gown, 0.22)} strokeWidth={iw * 0.55} opacity={0.6} />
        ))}
        <path d={`M${fmt(K.x - 2)},${fmt(K.y - 4.6)} Q${fmt(K.x + 4)},${fmt(K.y - 4.2)} ${fmt(K.x + 9)},${fmt(K.y + 1)}`} fill="none" stroke={lit(C.gown, 0.45)} strokeWidth={iw * 1.1} opacity={0.6} strokeLinecap="round" />
      </Deco>
    </g>
  );
};
/** the wedge pillow under the operated thigh; the foot hangs past its end */
const Wedge: React.FC<{iw: number; k: string; A: V}> = ({iw, k, A}) => {
  const top0 = A.y + 4.2, x1 = A.x + 5.2, x2 = -2;
  return (
    <g>
      <SoftShadow id={`${k}ws`} c={{x: (x1 + x2) / 2, y: MT + 0.3}} rx={20} ry={1.6} alpha={0.22} color="#2A4656" />
      <Inked w={iw}>
        <Blob id={`${k}wg`} d={pp([[x1, MT + 0.4], [x1 - 0.6, top0 + 1.2], [x1 + 1.5, top0], [(x1 + x2) / 2, top0 + 3.6], [x2, MT - 6], [x2 + 1, MT + 0.4]], 0.35)} c={{x: x1 + 6, y: top0 + 2}} r={24} color={lit(C.sheet, 0.08)} k={0.7} />
      </Inked>
      <Deco>
        <path d={`M${fmt(x1 + 3)},${fmt(top0 + 2.2)} Q${fmt(x1 + 4)},${fmt((top0 + MT) / 2)} ${fmt(x1 + 2.6)},${fmt(MT - 1)}`} fill="none" stroke={C.sheetDeep} strokeWidth={iw * 0.5} opacity={0.6} />
      </Deco>
    </g>
  );
};
/** the operated thigh in bed (its gown hem, the clean dressing over the join) and his own turned foot */
const BedLeg: React.FC<{id: string; H: V; A: V; hip: number; iw: number; fa: number; curl: number; curlS?: number; spread?: number}> = ({id, H, A, hip, iw, fa, curl, curlS, spread}) => {
  const ax = norm(sub(A, H));
  const nrm = dirA(hip + 90);
  const at = (u: number) => add(H, mul(sub(A, H), u));
  return (
    <g>
      <Inked w={iw}>
        <Limb id={`${id}-th`} A={H} B={at(0.6)} C={A} rA={8.1} rB={5.5} rC={3.8} color={SKIN} k={0.9} />
      </Inked>
      <WiggleFoot id={`${id}-ft`} A={A} fa={fa} iw={iw} curl={curl} curlS={curlS} spread={spread} />
      <Inked w={iw}>
        <Capsule id={`${id}-dr`} a={at(0.5)} b={at(0.7)} ra={6.6} rb={5.6} color={C.dressing} k={0.5} />
      </Inked>
      <Deco>
        {[0.55, 0.6, 0.65].map((u) => {
          const q = at(u), r0 = 6.6 - (u - 0.5) * 5;
          return <path key={u} d={`M${P(add(q, mul(nrm, r0)))} L${P(add(add(q, mul(nrm, -r0)), mul(ax, 1.0)))}`} stroke={C.dressingDeep} strokeWidth={0.45} opacity={0.85} />;
        })}
      </Deco>
      {/* the gown's hem over the top of the thigh */}
      <Inked w={iw}>
        <Capsule id={`${id}-hm`} a={add(H, mul(ax, -1.5))} b={add(H, mul(ax, 10))} ra={8.6} rb={8.0} color={C.gown} />
      </Inked>
      <Deco>
        <path d={`M${P(add(at(0.27), mul(nrm, 8.1)))} L${P(add(at(0.27), mul(nrm, -8.1)))}`} stroke={lit(C.gown, 0.4)} strokeWidth={0.9} opacity={0.7} />
      </Deco>
    </g>
  );
};

/** Wyatt in bed: Wyatt2's construction (body.tsx), drawn in the bed's order: far arm, far leg, pelvis and gown, head,
 *  then the blanket (over the far leg and his lap), then the operated leg and the near arm on top of it */
const BedBoy: React.FC<{p: BPose; id: string; px: number; blanket: React.ReactNode; leg: React.ReactNode; nod?: number}> = ({p, id, px, blanket, leg, nod = 0}) => {
  const j = bjoints(p);
  const iw = 7 * px;
  const skin = SKIN, shirt = C.gown, shorts = C.gown;
  const fd = 0.1;
  const pel = j.pel, rib = j.rib;
  const sh = (q: V, k: number) => ({x: q.x + p.stag.x * k, y: q.y + p.stag.y * k});
  const jersey = pth([pel(7.4, 3.2), pel(7.9, 9), rib(8.0, 3.5), rib(9.2, 12), rib(8.6, 19), rib(4.8, 24.2), rib(-2.6, 24.8), rib(-7.1, 21.5), rib(-8.4, 12), rib(-7.6, 3.5), pel(-9.8, 9), pel(-10.2, 3.2)], 1);
  const jerseyF = pth([pel(7.4, 3.2), pel(7.9, 9), rib(8.0, 3.5), rib(9.2, 12), rib(8.6, 19), rib(4.8, 24.2), rib(-2.6, 24.8), rib(-7.1, 21.5), rib(-8.4, 12), rib(-7.6, 3.5), pel(-9.8, 9), pel(-10.2, 3.2)].map((q, i) => sh(q, i < 2 || i > 9 ? 0.85 : 0.5)), 1);
  const pelvisD = pth([pel(7.6, 6.5), pel(8.0, 0), pel(5.2, -7.5), pel(-3.6, -9.6), pel(-9.6, -5.5), pel(-10.4, 2), pel(-9.4, 6.5)], 1);
  const armDraw = (k: string, a: {S: V; E: V; W: V}, hand: HandPose, wb: number, dim: number, back = 2.6) => {
    const fdir = norm(sub(a.W, a.E));
    const sk = dim ? shade(skin, dim) : skin;
    const ud = norm(sub(a.E, a.S));
    return (
      <g>
        <Inked w={iw}>
          <Limb id={`${id}-${k}a`} A={a.S} B={a.E} C={a.W} rA={3.7} rB={3.0} rC={2.4} color={sk} k={0.9} capC="flat" crease={iw * 0.6} />
          <Hand id={`${id}-${k}h`} wrist={a.W} ang={angOf(fdir) + wb} L={DIMW.hand} thumbSide={1} view="back" pose={hand} color={sk} bare />
        </Inked>
        <Inked w={iw}>
          <Capsule id={`${id}-${k}sv`} a={add(a.S, mul(ud, -back))} b={add(a.S, mul(ud, 8.0))} ra={4.7} rb={4.1} color={dim ? shade(shirt, dim) : shirt} />
        </Inked>
      </g>
    );
  };
  const farLeg = (
    <Inked w={iw}>
      <Limb id={`${id}-fl`} A={j.Hf} B={j.K} C={j.FA} rA={7.8} rB={4.6} rC={3.0} color={shade(skin, fd)} k={0.9} />
    </Inked>
  );
  const dots = [[2, 6], [-3, 12], [4, 17], [-1, 20], [5, 9], [-5, 5]].map(([f, u]) => rib(f, u));
  // the near shoulder sits a little lower on the reclined rib cage than the standing rig's (and its sleeve is cut
  // shorter at the top), so a little neck shows between his jaw and the sleeve instead of a shrug
  const aN = p.aN as {sh: number; el: number};
  const Sn = rib(1.2, 17.7);
  const En = add(Sn, mul(dirA(aN.sh), DIMW.upper));
  const armN = {S: Sn, E: En, W: add(En, mul(dirA(aN.sh + aN.el), DIMW.fore))};
  return (
    <g>
      {armDraw('f', j.armF, p.hF ?? HAND_RELAXED, p.wF ?? 0, fd)}
      {farLeg}
      <Inked w={iw}>
        <Blob id={`${id}-pv`} d={pelvisD} c={pel(0, 2)} r={14} color={shorts} />
        <Blob id={`${id}-tof`} d={jerseyF} c={rib(3, 13)} r={26} color={shade(shirt, 0.06)} />
        <Capsule id={`${id}-nk`} a={rib(0.8, 20)} b={add(j.N, mul({x: -Math.sin(rad(p.chest + p.neck)), y: -Math.cos(rad(p.chest + p.neck))}, 3))} ra={3.2} rb={3.1} color={skin} />
        <Blob id={`${id}-to`} d={jersey} c={rib(3, 13)} r={24} color={shirt} />
      </Inked>
      <Deco>
        {dots.map((q, i) => <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={0.75} fill={C.gownDot} opacity={0.7} />)}
        <path d={`M${P(rib(4.6, 24.0))} Q${P(rib(1.0, 22.6))} ${P(rib(-2.4, 24.6))}`} stroke={shade(C.gown, 0.25)} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      </Deco>
      <Head id={`${id}-hd`} c={j.headC} R={DIMW.headR} roll={-(p.chest + p.neck) * 0.55 + nod} turn={p.turn} expr={p.expr} blink={p.blink} skin={skin} hair={C.hair} inkW={7 * px * (100 / DIMW.headR)} hairStyle="crop" />
      {blanket}
      {leg}
      {armDraw('n', armN, p.hN ?? HAND_RELAXED, p.wN ?? 0, 0, 0.6)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ wake
const HE = 17.74, STILL = 17.93; // "he could still" (word starts, timeline_v3)
/** his face through the bed shots: eyes open on "woke", the gaze goes down to the leg on "he could still", then (the
 *  notice) the eyes drop to the foot and a small smile */
const bedFace = (t: number) => {
  const open1 = ss(t, T4.woke + 0.02, T4.woke + 0.3);
  const blink2 = Math.max(0, 1 - Math.abs(t - (T4.woke + 0.47)) / 0.07);
  const blink = Math.max(1 - open1, blink2) * (t < CUT_NOTICE ? 1 : 0);
  const down = ss(t, HE - 0.02, STILL + 0.18);
  // the notice: the eyes drop to the foot and open a little wider, the head dips; then the small smile
  const notice = ss(t, CUT_NOTICE + 0.03, CUT_NOTICE + 0.17);
  const wonder = notice * (1 - ss(t, CUT_NOTICE + 0.3, CUT_NOTICE + 0.5));
  const smile = ss(t, CUT_NOTICE + 0.17, CUT_NOTICE + 0.45);
  const lift = ss(t, T4.woke + 0.05, T4.woke + 0.4);
  const expr: Expr = {
    ...EXPR_NEUTRAL,
    lid: lerp(lerp(lerp(0.42, 0.24, lift), 0.0, notice), 0.1, smile), browIn: 0.2 + 0.3 * wonder - 0.1 * smile, pupil: 1 + 0.1 * notice,
    squint: 0.28 * smile,
    gx: lerp(lerp(-0.1, -0.55, down), -0.8, notice), gy: lerp(lerp(-0.15, 0.5, down), 1.0, notice),
    smile: lerp(0.0, 0.55, smile), wide: lerp(0.92, 1.04, smile), open: 0.01, flush: 0.22 + 0.22 * smile,
  };
  const neck = 12 + 7 * lift + 9 * down + 5 * notice;
  const breath = Math.sin(2 * Math.PI * (t - 17.0) / 2.6);
  // on "he could still" the head also turns a little further toward the leg (screen-left) and nods toward it
  const turn = 0.85 + 0.09 * down;
  const nod = -4.5 * down;
  return {expr, blink, neck, breath, turn, nod};
};
const bedAN = (t: number) => {
  const stir = Math.sin(Math.PI * clamp((t - (T4.woke + 0.05)) / 0.55));
  return {sh: 26 - 4 * stir, el: 66 + 8 * stir};
};

export const WakeShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  // wide (88 cm across, against the notice shot's 50: just room for the hanging foot at the left and his head at the
  // right), framed high on the bed: the room above, the mattress's side only a band below the sheet line (the side
  // rail is out of frame)
  const c: Cam = {x: -3, y: -66, w: 88, eye: -60};
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const f = bedFace(t);
  const p = bedPose({...f, aN: bedAN(t)});
  const j = bjoints(p);
  const toe = bigToe(j.A, FA_M, 0);
  return (
    <>
      <Room c={c} k={k} />
      <Layer c={c}>
        <BedFrame iw={iw} k={k} />
        <Pillows iw={iw} k={k} />
        {/* (the wide shot sees the mattress's front face below the sheet line: only the toes' contact shadow) */}
        <SheetReact pad={toe.low} press={0.2} grip={0} iw={iw} k={`${k}sr`} creases={false} />
        <BedBoy p={p} id={`${k}w`} px={px} nod={f.nod}
          blanket={<><Blanket iw={iw} k={`${k}b`} /><Wedge iw={iw} k={`${k}wg`} A={j.A} /></>}
          leg={<BedLeg id={`${k}l`} H={j.H} A={j.A} hip={p.near.hip} iw={iw} fa={j.nSa - BED_FOOTREL} curl={0} />} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------------------------------------ toes
/** how far the curled big toe lifts the gripped sheet above the sheet line (cm) */
const gripLift = (t: number) => {
  const w = wiggle4(t);
  return Math.max(0, MT - bigToe(BED_A, w.fa, w.curl).low.y) * clamp(w.grip);
};
export const ToesShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = matchCam(BED_A, -60);
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const p = bedPose({expr: EXPR_NEUTRAL, blink: 0, neck: 20});
  const j = bjoints(p);
  const wg = wiggle4(t);
  const toe = bigToe(j.A, wg.fa, wg.curl);
  const grip = wg.grip;
  const press = wg.press;
  return (
    <>
      <svg width={W} height={SH} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id={`${k}wl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={lit(C.wall, 0.35)} /><stop offset="1" stopColor={C.wallDeep} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={SH} fill={`url(#${k}wl)`} />
      </svg>
      <Layer c={c}>
        {/* the sheet's surface under the foot, receding to the blanket over his other leg */}
        <Inked w={iw}>
          <Lin id={`${k}sh`} d={pp([[-90, MT], [40, MT], [40, MT + 60], [-90, MT + 60]], 0.1)} from={{x: 0, y: MT}} to={{x: 0, y: MT + 30}} stops={[[0, lit(C.sheet, 0.3)], [1, mix(C.sheet, C.sheetDeep, 0.7)]]} />
        </Inked>
        <Blanket iw={iw} k={`${k}b`} />
        <Wedge iw={iw} k={`${k}wg`} A={j.A} />
        <SheetReact pad={toe.low} press={press} grip={grip} iw={iw} k={`${k}sr`} pullAct={clamp((gripLift(t - 1 / 30) + gripLift(t) + gripLift(t + 1 / 30)) / 3 / 1.6)} />
        <BedLeg id={`${k}l`} H={j.H} A={j.A} hip={p.near.hip} iw={iw} fa={wg.fa} curl={wg.curl} curlS={wg.curlS} spread={wg.spread} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------------------------------------ notice
export const NoticeShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const f = bedFace(t);
  const p = bedPose({...f});
  const j0 = bjoints(bedPose({expr: EXPR_NEUTRAL, blink: 0, neck: 25}));
  const c: Cam = {x: j0.headC.x - 50 / (W / 50), y: j0.headC.y + 160 / (W / 50), w: 50, eye: -60};
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const j = bjoints(p);
  return (
    <>
      <svg width={W} height={SH} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id={`${k}wl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={lit(C.wall, 0.35)} /><stop offset="1" stopColor={C.wallDeep} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={SH} fill={`url(#${k}wl)`} />
      </svg>
      <Layer c={c}>
        <BedFrame iw={iw} k={k} />
        <Pillows iw={iw} k={k} />
        <BedBoy p={p} id={`${k}w`} px={px} nod={f.nod}
          blanket={<><Blanket iw={iw} k={`${k}b`} /><Wedge iw={iw} k={`${k}wg`} A={j.A} /></>}
          leg={<BedLeg id={`${k}l`} H={j.H} A={j.A} hip={p.near.hip} iw={iw} fa={j.nSa - BED_FOOTREL} curl={0} />} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------------------------------------ the socket, on the field
/** the pitch behind a close, low shot (art/pitch.tsx Pitch, trimmed): sky, the far tree line, the turf receding in mowing
 *  stripes, one touchline in front of him (below the socket), grass tufts. No goal or far lines behind the socket's
 *  clear shell, so nothing busy shows through it. */
const FieldBack: React.FC<{c: Cam; id: string; lineD: number}> = ({c, id, lineD}) => {
  const yh = horizonY(c);
  const k0 = W / c.w;
  const K = k0 * D0 * (0 - c.eye);
  const bands: React.ReactNode[] = [];
  const dStart = Math.max(40, Math.min(D0, groundD(c, SH + 20)));
  const step = 180;
  for (let i = Math.floor(dStart / step); i < 60; i++) {
    const dn = Math.max(dStart, i * step), df = (i + 1) * step;
    const yn = Math.min(SH + 20, yh + K / dn), yf = yh + K / df;
    if (yn - yf < 0.3) break;
    const haze = Math.min(0.55, (df / 9000) * 0.9);
    bands.push(<rect key={i} x={-10} y={fmt(yf)} width={W + 20} height={fmt(yn - yf + 0.6)} fill={mix(i % 2 ? C.turf : C.turfLight, C.sky, haze)} />);
  }
  const DT = 9000;
  const kT = k0 * (D0 / DT);
  const span = (W / 2) / kT + 800;
  const trees: React.ReactNode[] = [];
  for (let i = Math.floor((c.x - span) / 260); i <= Math.ceil((c.x + span) / 260); i++) {
    const x = i * 260 + hash(i * 3.1) * 120;
    const h = 900 + hash(i * 7.7) * 600, r = 240 + hash(i * 1.9) * 160;
    const p = proj(c, DT, {x, y: -h * 0.6}), q = proj(c, DT, {x, y: 0});
    const rr = r * kT;
    trees.push(
      <g key={i}>
        <rect x={fmt(q.x - 14 * kT)} y={fmt(p.y)} width={fmt(28 * kT)} height={fmt(q.y - p.y)} fill={mix(C.treesDeep, C.sky, 0.45)} />
        <ellipse cx={fmt(p.x)} cy={fmt(p.y - rr * 0.2)} rx={fmt(rr)} ry={fmt(rr * 1.15)} fill={mix(i % 2 ? C.trees : C.treesDeep, C.sky, 0.42)} />
      </g>,
    );
  }
  const la = yh + K / lineD, lb = yh + K / (lineD + 10);
  const tufts = (D: number, gap: number, size: number, seed: number, dark: number) => {
    const k = k0 * (D0 / D);
    const half = (W / 2) / k + 20;
    const out: React.ReactNode[] = [];
    for (let i = Math.floor((c.x - half) / gap); i <= Math.ceil((c.x + half) / gap); i++) {
      const x = i * gap + (hash(i * 1.37 + seed) - 0.5) * gap * 0.8;
      const b = proj(c, D, {x, y: 0});
      if (b.y < -20 || b.y > SH + 40) continue;
      const sz = size * k * (0.7 + 0.6 * hash(i * 2.9 + seed));
      const col = shade(i % 3 ? C.turfDeep : C.turf, dark);
      const blades = [-0.5, 0, 0.45].map((o, j) => {
        const lean = (hash(i * 5.1 + j + seed) - 0.5) * 0.9 + o * 0.6;
        const tip = {x: b.x + lean * sz * 0.7, y: b.y - sz * (0.8 + 0.4 * hash(i + j * 3 + seed))};
        const w = sz * 0.13;
        return `M${fmt(b.x - w + o * sz * 0.3)},${fmt(b.y)} Q${fmt((b.x + tip.x) / 2 + o * sz * 0.2)},${fmt((b.y + tip.y) / 2)} ${fmt(tip.x)},${fmt(tip.y)} Q${fmt((b.x + tip.x) / 2 + o * sz * 0.3 + w)},${fmt((b.y + tip.y) / 2)} ${fmt(b.x + w + o * sz * 0.3)},${fmt(b.y)} Z`;
      });
      out.push(<path key={i} d={blades.join(' ')} fill={col} />);
    }
    return out;
  };
  return (
    <svg width={W} height={SH} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.skyHigh} /><stop offset="1" stopColor={lit(C.sky, 0.25)} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={fmt(Math.max(0, yh + 2))} fill={`url(#${id}-sky)`} />
      <g style={{filter: 'blur(2.5px)'}}>{trees}</g>
      <rect x={0} y={fmt(yh)} width={W} height={fmt(Math.max(0, SH - yh))} fill={mix(C.turfLight, C.sky, 0.5)} />
      {bands}
      <rect x={-10} y={fmt(lb)} width={W + 20} height={fmt(Math.max(0.6, la - lb))} fill={C.line} />
      {tufts(D0 + 40, 10, 5.5, 3, 0.08)}
      {tufts(D0, 7, 4.5, 5, 0.0)}
    </svg>
  );
};
const SIT_H: V = {x: 0, y: -9.5};
const SIT_STAG: V = {x: -2, y: -1.2};
/** hip angle that rests the cleat's lowest point `lift` cm above the turf, for a given turned-ankle flexion */
const sitHip = (knee: number, ank: number, lift: number) => {
  let lo = 92, hi = 178;
  for (let i = 0; i < 44; i++) {
    const hip = (lo + hi) / 2;
    const A = add(SIT_H, mul(dirA(hip), DIMW.thigh));
    const PA = add(A, mul(dirA(hip - knee), DIMW.shin));
    if (cleatLow(PA, hip - knee + 90 - ank) > -lift) lo = hip; else hi = hip;
  }
  return (lo + hi) / 2;
};
/** the start: the shank at FA_M + SEAT (the foot in the socket at the bed's angle), cleat on its heel */
const ANK0 = 6, ANK1 = 22;
const KNEE0 = (() => {
  // knee such that hip - knee = FA_M + SEAT with the cleat on the turf
  let lo = 20, hi = 140;
  for (let i = 0; i < 44; i++) {
    const k = (lo + hi) / 2;
    if (sitHip(k, ANK0, 0) - k > FA_M + SEAT) lo = k; else hi = k;
  }
  return (lo + hi) / 2;
})();
const DRAW0 = 19.85, DRAW1 = CUT_FIELD;
export const sitLeg = (t: number) => {
  const u = ss5(t, DRAW0, DRAW1 + 0.06);
  const knee = KNEE0 + 34 * u;
  const ank = lerp(ANK0, ANK1, u);
  const lift = 2.2 * Math.sin(Math.PI * u);
  const hip = sitHip(knee, ank, lift);
  return {hip, knee, ank};
};
const sitPose = (t: number): BPose => {
  const n = sitLeg(t);
  const ready = ss(t, DRAW0, DRAW1);
  return {
    hip: SIT_H, pelvis: -16 + 6 * ready, chest: -10 + 6 * ready,
    near: n, far: {hip: -84, knee: 0, ank: 0}, // (his other leg is out of frame, behind him)
    stag: SIT_STAG, aN: {sh: -32, el: 6}, aF: {sh: -40, el: 8}, hN: HAND_OPEN, hF: HAND_OPEN, wN: 60, wF: 60,
    neck: 18, turn: 0.9, expr: {...EXPR_NEUTRAL, gx: -0.6, gy: 0.7, smile: 0.4}, blink: 0,
  };
};
const SOCK_A = bjoints(sitPose(CUT_SOCK)).A;
const SOCKET = {clear: 1, local: 0, rim: 1};

/** Prosthesis2 (v2/body) for this close-up, with the clear finish only: the residual limb's capsule inside the shell is
 *  clipped to the socket's outline (at 27 px/cm its rounded upper end would otherwise show on the thigh outside the
 *  socket, like a kneecap or seam) */
const SockProsthesis: React.FC<{id: string; j: ReturnType<typeof bjoints>; iw: number; s: {clear: number; rim: number}; toeCurl: number}> = ({id, j, iw, s, toeCurl}) => {
  const pass = useInk().pass;
  const sp = (q: V) => shankPt(j.A, j.nSa, q.x, q.y);
  const out = pth(SOCKET_OUT.map(sp), 0.9);
  const pyl0 = sp({x: 0, y: SOCKET_BOT - 0.6}), pyl1 = sp({x: 0, y: DIMW.shin - 2.2});
  const shellOp = 1 - 0.86 * s.clear;
  const foot = (
    <g>
      <g clipPath={`url(#${id}-oc)`}>
        <Inked w={iw}>
          <Capsule id={`${id}-lg`} a={add(j.A, mul(sub(j.H, j.A), 0.3))} b={j.A} ra={4.3} rb={3.7} color={SKIN} />
        </Inked>
      </g>
      <BioFoot id={`${id}-bf`} A={j.A} fa={j.bioFoot} h={-1} iw={iw} toeCurl={toeCurl} skin={SKIN} />
    </g>
  );
  return (
    <g>
      <Inked w={iw}>
        <Capsule id={`${id}-py`} a={pyl0} b={pyl1} ra={1.45 + 0.35 * s.rim} rb={1.45 + 0.35 * s.rim} color={C.pylon} spec={0.55} />
        <InkPath d={pth([sp({x: -2.6, y: SOCKET_BOT - 1.2}), sp({x: 2.6, y: SOCKET_BOT - 1.2}), sp({x: 1.8, y: SOCKET_BOT + 1.4}), sp({x: -1.8, y: SOCKET_BOT + 1.4})], 0.3)} fill={C.pylonDeep} />
      </Inked>
      <Cleat id={`${id}-sh`} A={j.PA} fa={j.nFoot} iw={iw} />
      <g opacity={shellOp}>
        <Inked w={iw * (1 - 0.55 * s.clear)}>
          <Blob id={`${id}-sl`} d={out} c={sp({x: 3, y: 4})} r={20} color={C.carbon} k={1.1} />
        </Inked>
      </g>
      {pass !== 'ink' && (
        <g>
          <defs><clipPath id={`${id}-oc`}><path d={out} /></clipPath></defs>
          <g clipPath={`url(#${id}-oc)`}>
            {Array.from({length: 14}, (_, i) => {
              const a = sp({x: -12 + i * 2.4, y: -8}), b = sp({x: -12 + i * 2.4 + 14, y: 24});
              return <line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={C.carbonLight} strokeWidth={0.45} opacity={0.2 * shellOp + 0.06} />;
            })}
            <path d={`M${P(sp({x: 7.6, y: -3.5}))} Q${P(sp({x: 8.4, y: 6}))} ${P(sp({x: 5.2, y: 14.5}))}`} stroke="#FFFFFF" strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.25 + 0.25 * s.clear} />
          </g>
          <g opacity={Math.min(1, s.clear * 1.6)}>{foot}</g>
          <g opacity={s.clear}>
            <g opacity={s.rim}>
              <g clipPath={`url(#${id}-oc)`}><path d={out} fill="none" stroke={C.carbon} strokeWidth={3.0} /></g>
              <g clipPath={`url(#${id}-oc)`}><path d={out} fill="none" stroke={C.carbonCut} strokeWidth={0.5} opacity={0.9} /></g>
              <path d={out} fill="none" stroke={INK} strokeWidth={iw * 0.75} />
            </g>
            <path d={out} fill="none" stroke={C.carbonCut} strokeWidth={0.55} opacity={0.9} />
            <path d={out} fill="none" stroke={INK} strokeWidth={iw * 0.3} opacity={0.55} />
          </g>
          <path d={`M${P(sp({x: -6.4, y: -2.6}))} L${P(sp({x: 9.6, y: -7.2}))}`} stroke={C.liner} strokeWidth={1.3} strokeLinecap="round" opacity={0.9} />
        </g>
      )}
    </g>
  );
};
const sockToe = (t: number) => 26 * Math.max(0, Math.sin(Math.PI * clamp((t - 19.6) / 0.2)));

export const SockShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = matchCam(SOCK_A, -38);
  const px = 1 / camScale(c);
  const p = sitPose(t);
  const j = bjoints(p);
  const lowP = cleatLow(j.PA, j.nFoot);
  const iw = 7 * px;
  // the near leg below the shorts: Wyatt2's thigh, then the socket copy above (stump clipped to the shell)
  const nearLeg = (
    <g>
      <Inked w={iw}>
        <Limb id={`${k}w-nt`} A={j.H} B={add(j.H, mul(sub(j.A, j.H), 0.6))} C={j.A} rA={8.1} rB={5.5} rC={3.8} color={SKIN} k={0.9} />
      </Inked>
      <SockProsthesis id={`${k}w-pr`} j={j} iw={iw} s={SOCKET} toeCurl={sockToe(t)} />
    </g>
  );
  return (
    <>
      <FieldBack c={c} id={`${k}pt`} lineD={235} />
      <Layer c={c} D={D0}>
        <SoftShadow id={`${k}cs`} c={{x: j.PA.x + 2, y: 0.4}} rx={10} ry={1.8} alpha={0.32 * (1 - clamp(-lowP / 20))} color="#1E3A22" />
        <SoftShadow id={`${k}ss`} c={{x: j.A.x - 8, y: 0.4}} rx={16} ry={2.2} alpha={0.22} color="#1E3A22" />
        <Wyatt2 p={p} o={{id: `${k}w`, px, shoeN: 'cleat', shoeF: 'cleat', prosthesis: true, socket: SOCKET, toeCurl: sockToe(t), nearLeg}} />
      </Layer>
      <ForeGrass c={c} />
    </>
  );
};

/** caption heights (px) over these shots: kept clear of his eyes, the toes, the socket and the cleat */
export const CAP_Y_BED: Record<number, number | ((t: number) => number)> = {10: 260, 11: 260, 12: 240, 13: 240};
export {CUT_WAKE, CUT_TOES, KNEE0};
/** for checks: the match geometry (the turned ankle in bed and in the socket, and the two cameras) */
export const matchInfo4 = () => ({bedA: BED_A, sockA: SOCK_A, toesCam: matchCam(BED_A, -60), sockCam: matchCam(SOCK_A, -38), bedFa: wiggle4(CUT_NOTICE - 1 / 60).fa, bedCurl: wiggle4(CUT_NOTICE - 1 / 60).curl, sockToe0: sockToe(CUT_SOCK)});
