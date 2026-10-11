import React from 'react';
import {C, E, tw, kf, lerp, clamp01, Burst, OUTLINE, W, H} from '../film/common';
import {Hed} from './type';
import {HED_FONT, CAP_FONT} from './fonts4';
import {F} from '../film/common';
import {Hand, HandPose, defOf, rad, V, Place} from '../hand/Hand';
import {sp, SNAP} from '../lib/motion';
import {V4, fm} from './cues';
import {BgBlue, BgPeg, BgReceipt} from './stage';
import {GuideAt, basePose} from './util';
import {Actuator, Wrench} from '../film/props';
import {OPEN_POSE} from '../film/beats1';
import {pinch2} from './shots2';
import {solveTip, OUTLINE_PX} from './contacts';

/* ------------------------------------------------------------------ B06: tradeoff assembly
 * hand with the dashed fifth-digit slot -> three actuator modules stack up -> price tag attaches -> footprint box expands -> wrench + crack.
 * Each consequence replaces the previous one. No text on the assembly itself (the captions carry the words), no invented numbers. */

const HP6: Place = {x: 385, y: 880, scale: 1.2};
const STACK_X = 700;
const MS = 2.5; // module scale (V3: 1.85)
const MODS = [{y: 600, t: V4['b06.mod1']}, {y: 835, t: V4['b06.mod2']}, {y: 1070, t: V4['b06.mod3']}];
const GHOST_C = {x: HP6.x + HP6.scale * 134, y: HP6.y - HP6.scale * 96}; // where the fifth digit would attach (front-view ghost slot)

const exit = (g: number, t: number, d = 5) => 1 - E.in(tw(g, t, d));

export const B06World: React.FC<{g: number}> = ({g}) => {
  const ghost = sp(g, V4['b06.ghost'], SNAP);
  const costT = V4['b06.cost'], spaceT = V4['b06.space'], serviceT = V4['b06.service'];
  const bump = (t: number) => (g >= t ? Math.max(0, 1 - (g - t) / 8) * Math.cos((g - t) * 0.55) : 0);
  const effT = [costT, spaceT, serviceT];
  const tagK = sp(g, costT, SNAP) * exit(g, spaceT - 1);
  const boxK = sp(g, spaceT, SNAP) * exit(g, serviceT - 1);
  const wrK = sp(g, serviceT, SNAP);
  const tilt = g >= serviceT ? 7 * clamp01((g - serviceT) / 6) : 0;
  return (
    <g>
      <BgBlue />
      <g fill="none" stroke={C.blueDeep} strokeWidth={5} strokeDasharray="3 14" strokeLinecap="round" opacity={0.9}>
        {MODS.map((m, i) => {
          const k = tw(g, m.t - 16, 12);
          if (k <= 0) return null;
          const ex = lerp(GHOST_C.x + 40, STACK_X - 112, k), ey = lerp(GHOST_C.y, m.y, k);
          return <path key={i} d={`M ${GHOST_C.x + 50} ${GHOST_C.y} C ${GHOST_C.x + 140} ${GHOST_C.y}, ${ex - 90} ${ey}, ${ex} ${ey}`} />;
        })}
      </g>
      <Hand x={HP6.x} y={HP6.y} scale={HP6.scale} pose={OPEN_POSE} ghostPinky={0.55 + 0.45 * ghost} />
      {g >= V4['b06.ghost'] && (
        <g transform={`translate(${GHOST_C.x + 58} ${GHOST_C.y - 34}) scale(${ghost})`}>
          <circle r={32} fill={C.coral} stroke={C.ink} strokeWidth={5} />
          <path d="M -14 0 H 14 M 0 -14 V 14" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
        </g>
      )}
      {MODS.map((m, i) => {
        const k = sp(g, m.t, SNAP);
        if (g < m.t - 14) return null;
        const slideIn = E.out(clamp01((g - (m.t - 14)) / 14));
        const dx = (1 - slideIn) * 420;
        const y = m.y - 8 * bump(effT[i]);
        const rot = i === 2 ? tilt : 0;
        return (
          <g key={i}>
            <ellipse cx={STACK_X + 26 + dx} cy={m.y + 86} rx={110} ry={14} fill={C.shadow} opacity={0.8} />
            <g transform={`translate(${STACK_X + dx} ${y}) rotate(${rot}) scale(${Math.min(1, 0.4 + 0.6 * k)})`}>
              <Actuator x={0} y={0} s={MS} />
            </g>
          </g>
        );
      })}
      {/* COST: a price tag swings onto the top module */}
      {tagK > 0.01 && (
        <g transform={`translate(${STACK_X + 20} ${MODS[0].y - 130}) rotate(${-8 + 9 * Math.sin((g - costT) * 0.32) * clamp01(1 - (g - costT) / 26)}) scale(${tagK * 1.9})`}>
          <path d="M -34 78 C -30 50 -40 40 -44 30" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M -64 -34 L 38 -34 L 66 0 L 38 34 L -64 34 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
          <circle cx={36} cy={0} r={8} fill={C.cream} stroke={C.ink} strokeWidth={3} />
          <text x={-14} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={54} fill={C.ink}>$</text>
        </g>
      )}
      {/* BULK: the footprint around the whole stack grows outward */}
      {boxK > 0.01 && (() => {
        const e = 30 * E.out(clamp01((g - spaceT) / 9));
        const top = MODS[0].y - 30 * MS - 24 - e, bot = MODS[2].y + 30 * MS + 24 + e;
        const x0 = STACK_X - 34 * MS - 18 - e, x1 = STACK_X + 54 * MS + 14 + e;
        return (
          <g opacity={clamp01(boxK)} fill="none" stroke={C.coralDeep} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
            <rect x={x0} y={top} width={x1 - x0} height={bot - top} rx={16} strokeDasharray="18 12" />
            {[[x0, top, -1, -1], [x1, top, 1, -1], [x0, bot, -1, 1], [x1, bot, 1, 1]].map(([cx, cy, sx, sy], i) => (
              <path key={i} d={`M ${cx + sx * 8} ${cy + sy * 8} l ${sx * 34} ${sy * 34} M ${cx + sx * 46} ${cy + sy * 20} l ${-sx * 0} ${sy * 22} M ${cx + sx * 20} ${cy + sy * 46} l ${sx * 22} ${-sy * 0}`} />
            ))}
          </g>
        );
      })()}
      {/* BREAK: a wrench comes onto the lowest module, a crack opens across it */}
      {wrK > 0.01 && (
        <g>
          <g transform={`translate(${STACK_X + 8} ${MODS[2].y})`} opacity={clamp01(wrK * 2)} fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
            <path d={`M -6 ${-30 * MS * 0.8} l 18 ${22 * MS * 0.8} l -24 ${16 * MS * 0.8} l 20 ${26 * MS * 0.8}`} strokeDasharray={`${400 * clamp01((g - serviceT) / 5)} 400`} />
          </g>
          <g transform={`translate(${STACK_X + 70 - 60 * (1 - wrK)} ${MODS[2].y - 70 - 60 * (1 - wrK)})`}>
            <Wrench x={0} y={0} rot={-34 + 14 * Math.sin((g - serviceT) * 0.28)} s={2.4} />
          </g>
          <Burst x={STACK_X} y={MODS[2].y} t={(g - serviceT) / 9} r0={110} r1={170} n={8} color={C.ink} w={7} />
        </g>
      )}
    </g>
  );
};

export const B06Hud: React.FC<{g: number}> = ({g}) => {
  const t0 = V4['b06.title'];
  const a = sp(g, t0, SNAP);
  return (
    <g>
      {g >= t0 && (
        <>
          <Hed x={120} anchor="start" y={296} text="ONE MORE" size={150} sx={a + 0.001} sy={a + 0.001} />
          <Hed x={120} anchor="start" y={428} text="FINGER?" size={150} sx={a + 0.001} sy={a + 0.001} />
        </>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ B07/B08: placement workstation */

const sdef = (n: 'thumb' | 'index') => defOf('robot', 'side', n)!;
const TABLE_Y = 1130;
const TRAY = {x: 330, y: TABLE_Y};
const TRAY2_X = 470; // the second block waits at the right end of the tray, so the second hand never covers the guide's face
// the first block goes to the FAR slot (kept off the right rail, x <= 820): while `BUILT TO WORK` is on screen the hand is already out at the right, clear of the title
const SLOT = [{x: 820}, {x: 670}];
export const BLK = 104;
const S7 = 2.0;

type Phase = {pick: number; carry0: number; carry1: number; place: number};
export const PH = [
  {pick: fm(807), carry0: fm(812), carry1: fm(840), place: V4['b07.place']},
  {pick: V4['b08.pick'], carry0: V4['b08.pick'] + 3, carry1: V4['b08.pick'] + 15, place: V4['b08.place']},
];

/** returns block centre + hand placement for block i (0 = B07, 1 = B08) */
export const work = (g: number, i: 0 | 1) => {
  const ph = PH[i];
  const slotX = SLOT[i].x;
  const restY = TABLE_Y - BLK / 2 - 4;
  const slotY = TABLE_Y - BLK / 2 + 14 - 36; // seated lower than resting blocks
  const startX = i === 0 ? TRAY.x : TRAY2_X;
  const hover = TABLE_Y - 330;
  const carry = E.inOut(tw(g, ph.carry0, ph.carry1 - ph.carry0));
  const down = E.in(tw(g, ph.carry1, ph.place - ph.carry1));
  const lifted = clamp01((g - ph.pick) / 5) * (1 - clamp01((g - ph.place) / 2));
  const grabbed = g >= ph.pick && g < ph.place + 3;
  let bx = grabbed || g >= ph.place ? lerp(startX, slotX, carry) : startX;
  let by = lerp(restY, hover, E.out(tw(g, ph.pick + 1, ph.carry0 - ph.pick))) ;
  if (g >= ph.carry0) by = lerp(hover, slotY, down);
  if (g < ph.pick) by = restY;
  if (g >= ph.place + 3) by = slotY;
  const jaw = g < ph.pick ? kf(g, [[ph.pick - 22, 110, E.out], [ph.pick, 0, E.in]]) : g < ph.place ? 0 : 90 * E.out(tw(g, ph.place + 1, 8));
  return {bx, by, jaw, grabbed: g >= ph.pick && g < ph.place + 3};
};

const ARR = [22, 14]; // frames the hand takes to arrive above its block (the second one is quicker: it must clear the headline lane)
export const handFor = (g: number, i: 0 | 1) => {
  const w = work(g, i);
  const ph = PH[i];
  const away = g >= ph.place + 3 ? E.out(tw(g, ph.place + 3, 12)) : 0;
  const arrive = g < ph.pick ? E.out(tw(g, ph.pick - ARR[i], ARR[i])) : 1;
  const Py = lerp(-220, w.by - 280, arrive) - 1300 * away;
  const P: Place = {x: w.bx + 12, y: Py, scale: S7, rot: 90};
  // pad tips are SOLVED onto the block faces (capsule just touches the square), then opened by `jaw` before the pick / after the place
  const poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({x: w.bx + (x * BLK) / 2, y: w.by + (y * BLK) / 2}));
  const c = {x: w.bx, y: w.by};
  const dir = {x: Math.cos(rad(P.rot ?? 0)), y: Math.sin(rad(P.rot ?? 0))}; // the distal segments point down the screen
  const axis = {x: 1, y: 0};
  const pr = (n: 'thumb' | 'index') => (sdef(n).w / 2) * S7 + OUTLINE_PX / 2;
  const t = solveTip(poly, c, axis, dir, -1, 0, sdef('thumb').len[2] * S7, pr('thumb'));
  const ix = solveTip(poly, c, axis, dir, 1, 0, sdef('index').len[2] * S7, pr('index'));
  t.x -= w.jaw; ix.x += w.jaw;
  return {P, pose: pinch2(P, t, ix), w, poly};
};

const Block: React.FC<{x: number; y: number; on?: boolean}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-BLK / 2} y={-BLK / 2} width={BLK} height={BLK} rx={14} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE + 1} />
    <rect x={-BLK / 2 + 10} y={-BLK / 2 + 10} width={BLK - 20} height={20} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={4} />
    <circle cx={0} cy={18} r={14} fill={C.ink} />
  </g>
);

/** closer framing: the whole workstation is scaled about this point (the headline lane stays unscaled) */
export const ZW = {cx: 500, cy: 900, k: 1.12};
const GUIDE = {x: 168, y: TABLE_Y + 112, s: 1.3};
export const TITLE_OUT7 = V4['b08.pick'] - 18; // BUILT TO WORK has left (4 frames) before the second hand starts arriving (pick - 14)

export const B07World: React.FC<{g: number}> = ({g}) => {
  const lamps = [V4['b07.ok'], V4['b08.ok']];
  const bumpT = [V4['b07.place'], V4['b08.place']];
  const nod = V4['b07.nod'];
  const pose = basePose({
    brows: 0.15,
    mouth: g >= nod && g < fm(938) ? 'smile' : 'flat',
    lookX: 0.8,
    lookY: kf(g, [[fm(792), 0.2], [V4['b07.place'] + 4, 0.3], [nod, 0.55], [nod + 8, 0.0]]),
    tilt: g >= nod && g < nod + 12 ? 5 * Math.sin(((g - nod) / 12) * Math.PI) : 0,
  });
  const b0 = work(g, 0), b1 = work(g, 1);
  const h0 = handFor(g, 0), h1 = handFor(g, 1);
  const first = g < PH[1].pick - 15;
  const h = first ? h0 : h1;
  const hu = V4['b08.human'] + 2;
  const humanOut = V4['b09.drop'] - 6;
  return (
    <g>
      <BgPeg tableY={TABLE_Y} />
      <g transform={`translate(${ZW.cx} ${ZW.cy}) scale(${ZW.k}) translate(${-ZW.cx} ${-ZW.cy})`}>
        {/* guide watches from behind the table: larger and further in so the reaction reads */}
        <GuideAt g={g} x={GUIDE.x} y={GUIDE.y} scale={GUIDE.s} pose={pose} />
        <rect x={0} y={TABLE_Y} width={W} height={H - TABLE_Y} fill={C.woodLight} opacity={0.0} />
        <rect x={TRAY.x - 110} y={TABLE_Y - 30} width={TRAY2_X - TRAY.x + 220 - 10} height={34} rx={10} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={Math.min(SLOT[0].x, SLOT[1].x) - 100} y={TABLE_Y - 70} width={Math.abs(SLOT[1].x - SLOT[0].x) + 200} height={74} rx={12} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE + 1} />
        {SLOT.map((s, i) => (
          <g key={i}>
            <rect x={s.x - BLK / 2 - 8} y={TABLE_Y - 74} width={BLK + 16} height={22} rx={6} fill={C.ink} />
            <circle cx={s.x} cy={TABLE_Y - 320} r={24} fill={g >= lamps[i] ? C.teal : C.inkMuted} stroke={C.ink} strokeWidth={5} />
            {g >= lamps[i] && <path d={`M ${s.x - 11} ${TABLE_Y - 320} l 9 10 l 15 -19`} stroke={C.cream} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
            {g >= lamps[i] && <circle cx={s.x} cy={TABLE_Y - 320} r={24 + (g - lamps[i]) * 3} fill="none" stroke={C.teal} strokeWidth={4} opacity={clamp01(1 - (g - lamps[i]) / 9)} />}
          </g>
        ))}
        {g < PH[0].pick && <Block x={TRAY.x} y={TABLE_Y - BLK / 2 - 4} />}
        <Block x={b0.bx} y={g < PH[0].pick ? -999 : b0.by} />
        {g < PH[1].pick && <Block x={TRAY2_X} y={TABLE_Y - BLK / 2 - 4} />}
        {g >= PH[1].pick && <Block x={b1.bx} y={b1.by} />}
        {/* B08: the human reference sits behind the working hand */}
        {g >= hu && g < humanOut + 6 && (
          <g transform={`translate(0 ${-E.in(tw(g, humanOut, 6)) * 480})`}><HumanRef x={346} y={565} k={sp(g, hu, SNAP)} /></g>
        )}
        <Hand view="side" x={h.P.x} y={h.P.y} scale={h.P.scale} rot={h.P.rot} pose={h.pose} forearm={{to: {x: h.P.x, y: -320}}} armW={64} />
        {bumpT.map((t, i) => (
          <Burst key={i} x={SLOT[i].x} y={TABLE_Y - 40} t={(g - t) / 10} r0={70} r1={130} n={8} color={C.ink} w={6} />
        ))}
      </g>
    </g>
  );
};

const HumanRef: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, k)})`}>
    <Hand kind="human" nails x={0} y={0} scale={1.1} pose={{}} />
    <Hed x={26} y={236} text="HUMAN" size={84} />
  </g>
);

export const B07Hud: React.FC<{g: number}> = ({g}) => {
  const t = V4['b07.label'];
  const a = sp(g, t, SNAP);
  const out = tw(g, TITLE_OUT7, 4, E.in);
  if (g < t || g >= TITLE_OUT7 + 4) return null;
  return (
    <g>
      <Hed x={76} anchor="start" y={300} text="BUILT" size={128} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
      <Hed x={76} anchor="start" y={414} text="TO WORK" size={128} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
    </g>
  );
};

/* ------------------------------------------------------------------ B09: receipt gag. Few big rows, then a dominant stamp on the final word. */

const REC = {x: 540, top: 262, w: 700};
const LH = 92;
const ROWS: [string, string][] = [['5TH FINGER', '?'], ['+3 ACTUATORS', ''], ['+ COST + BULK', ''], ['+ REPAIRS', '']];
export const REC_STAMP = {w: 760, h: 410, y: 60 + ROWS.length * LH + 250};

export const B09World: React.FC<{g: number}> = ({g}) => {
  const p0 = V4['b09.print'] - 4;
  const stampT = V4['b09.stamp'];
  const nLines = Math.min(ROWS.length, Math.max(0, Math.floor((g - p0) / 10) + 1));
  const full = 60 + ROWS.length * LH + 250 + REC_STAMP.h / 2 + 50;
  // paper height: every row feeds out over 3 frames; before the stamp the paper then lengthens smoothly (no one-frame jump)
  const hRow = (i: number) => 60 + (i + 1) * LH + 34;
  const k = nLines - 1;
  let printed = nLines === 0 ? 30 : lerp(k === 0 ? 60 : hRow(k - 1), hRow(k), E.out(tw(g, p0 + 10 * k, 3)));
  if (g >= stampT - 12) printed = lerp(hRow(ROWS.length - 1), full, E.inOut(tw(g, stampT - 12, 9)));
  const stampK = sp(g, stampT, SNAP);
  const slip = 0.5 * Math.sin((g - p0) * 1.7) * (g > p0 && g < p0 + 50 ? 1 : 0);
  const sx = 1 + 0.45 * (1 - stampK);
  return (
    <g>
      <BgReceipt />
      <g transform={`translate(${REC.x} ${REC.top + slip})`}>
        <path d={`M ${-REC.w / 2} 0 H ${REC.w / 2} V ${printed} ${Array.from({length: 18}).map((_, i) => `L ${REC.w / 2 - (i + 1) * (REC.w / 18)} ${printed + (i % 2 ? 0 : 22)}`).join(' ')} Z`} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <clipPath id="recClip"><rect x={-W} y={0} width={2 * W} height={printed} /></clipPath>
        <g clipPath="url(#recClip)">
        {ROWS.slice(0, nLines).map(([l, r], i) => (
          <g key={i}>
            <text x={-REC.w / 2 + 46} y={86 + i * LH} fontFamily={F.mono} fontWeight={700} fontSize={58} fill={C.ink}>{l}</text>
            {r && <text x={REC.w / 2 - 46} y={86 + i * LH} textAnchor="end" fontFamily={F.mono} fontWeight={700} fontSize={58} fill={C.coralDeep}>{r}</text>}
            {i < ROWS.length - 1 && <line x1={-REC.w / 2 + 46} y1={86 + i * LH + 26} x2={REC.w / 2 - 46} y2={86 + i * LH + 26} stroke={C.inkMuted} strokeWidth={4} strokeDasharray="3 14" strokeLinecap="round" opacity={0.7} />}
          </g>
        ))}
        </g>
        {g >= stampT && (
          <g transform={`translate(0 ${REC_STAMP.y}) rotate(-6) scale(${sx})`} opacity={clamp01(stampK * 2)}>
            <rect x={-REC_STAMP.w / 2 + 8} y={-REC_STAMP.h / 2 + 10} width={REC_STAMP.w} height={REC_STAMP.h} rx={26} fill={C.ink} opacity={0.35} />
            <rect x={-REC_STAMP.w / 2} y={-REC_STAMP.h / 2} width={REC_STAMP.w} height={REC_STAMP.h} rx={26} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE + 2} />
            <rect x={-REC_STAMP.w / 2 + 22} y={-REC_STAMP.h / 2 + 22} width={REC_STAMP.w - 44} height={REC_STAMP.h - 44} rx={14} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.5} />
            <Hed x={0} y={-92} text="NOT IN" size={226} color={C.ink} shadow={null} ls={4} />
            <Hed x={0} y={96} text="BUDGET" size={236} color={C.ink} shadow={null} ls={4} />
          </g>
        )}
      </g>
      <Burst x={REC.x} y={REC.top + REC_STAMP.y} t={(g - stampT) / 10} r0={360} r1={430} n={10} color={C.saffron} w={8} />
    </g>
  );
};
void CAP_FONT; void HED_FONT; 
