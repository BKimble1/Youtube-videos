import React from 'react';
import {C, F, E, tw, kf, lerp, clamp01, Burst, Headline, OUTLINE, W, H} from '../film/common';
import {Hand, HandPose, ikDigit, defOf, toLocal, rad, V, Place, mix} from '../hand/Hand';
import {sp, SNAP, SOFT, ring, impact, drift} from '../lib/motion';
import {V3} from '../cues_v3';
import {BgBlue, BgPeg, BgReceipt} from './stage';
import {GuideAt, basePose} from './util';
import {Actuator, Wrench} from '../film/props';
import {OPEN_POSE} from '../film/beats1';
import {pinch2} from './shots2';
import {solveTip, OUTLINE_PX} from './contacts';

/* ------------------------------------------------------------------ B06: exploded hardware diagram */

const HP6: Place = {x: 392, y: 812, scale: 1.05};
/** the three optional modules form one vertical exploded stack to the right of the hand, tied to the dashed fifth-digit slot by leaders */
const STACK_X = 716;
const MODS = [{y: 565, t: V3['b06.mod1']}, {y: 740, t: V3['b06.mod2']}, {y: 915, t: V3['b06.mod3']}];
const GHOST_C = {x: HP6.x + HP6.scale * 134, y: HP6.y - HP6.scale * 96}; // where the fifth digit would attach (front-view ghost slot)
const PLATE_Y = 1058;

export const B06World: React.FC<{g: number}> = ({g}) => {
  const ghost = sp(g, V3['b06.ghost'], SNAP);
  const costT = V3['b06.cost'], spaceT = V3['b06.space'], serviceT = V3['b06.service'];
  const bump = (t: number) => (g >= t ? Math.max(0, 1 - (g - t) / 8) * Math.cos((g - t) * 0.55) : 0);
  const effT = [costT, spaceT, serviceT];
  return (
    <g>
      <BgBlue />
      {/* leader lines from the optional digit slot to each module (exploded-assembly look) */}
      <g fill="none" stroke={C.blueDeep} strokeWidth={5} strokeDasharray="3 14" strokeLinecap="round" opacity={0.9}>
        {MODS.map((m, i) => {
          const k = tw(g, m.t - 16, 12);
          if (k <= 0) return null;
          const ex = lerp(GHOST_C.x + 40, STACK_X - 112, k), ey = lerp(GHOST_C.y, m.y, k);
          return <path key={i} d={`M ${GHOST_C.x + 50} ${GHOST_C.y} C ${GHOST_C.x + 140} ${GHOST_C.y}, ${ex - 90} ${ey}, ${ex} ${ey}`} />;
        })}
      </g>
      <Hand x={HP6.x} y={HP6.y} scale={HP6.scale} pose={OPEN_POSE} ghostPinky={0.55 + 0.45 * ghost} />
      {g >= V3['b06.ghost'] && (
        <g transform={`translate(${GHOST_C.x + 58} ${GHOST_C.y - 34}) scale(${ghost})`}>
          <circle r={30} fill={C.coral} stroke={C.ink} strokeWidth={5} />
          <path d="M -13 0 H 13 M 0 -13 V 13" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {/* the stack: three modules, each landing in turn; consequences attach to the objects */}
      {MODS.map((m, i) => {
        const k = sp(g, m.t, SNAP);
        if (g < m.t - 14) return null;
        const slideIn = E.out(clamp01((g - (m.t - 14)) / 14));
        const dx = (1 - slideIn) * 420; // modules slide in from the right edge, clear of the title
        const drop = 0;
        const y = m.y - 8 * bump(effT[i]);
        return (
          <g key={i}>
            <ellipse cx={STACK_X + 22 + dx} cy={m.y + 78} rx={96} ry={13} fill={C.shadow} opacity={0.8} />
            <g transform={`translate(${STACK_X + dx} ${y}) scale(${Math.min(1, 0.4 + 0.6 * k)})`}>
              <Actuator x={0} y={0} s={1.85} />
            </g>
          </g>
        );
      })}
      {/* COST: a blank price tag tied to the top module */}
      {g >= costT - 2 && (
        <g transform={`translate(${STACK_X + 84} ${MODS[0].y - 70}) rotate(${-10 + 6 * Math.sin((g - costT) * 0.3)}) scale(${sp(g, costT, SNAP)})`}>
          <line x1={-30} y1={80} x2={-44} y2={34} stroke={C.ink} strokeWidth={4} />
          <path d="M -64 -34 L 38 -34 L 66 0 L 38 34 L -64 34 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
          <circle cx={36} cy={0} r={8} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {/* SPACE: dashed volume box around the whole stack, arrows pushing outward */}
      {g >= spaceT - 2 && (() => {
        const k = sp(g, spaceT, SNAP);
        const e = 12 * k;
        const cy = (MODS[0].y + MODS[2].y) / 2 + 6;
        const hh = (MODS[2].y - MODS[0].y) / 2 + 100;
        return (
          <g transform={`translate(${STACK_X + 20} ${cy})`} opacity={clamp01(k)} fill="none" stroke={C.coralDeep} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
            <rect x={-124 - e} y={-hh - e} width={248 + 2 * e} height={2 * hh + 2 * e} rx={14} strokeDasharray="16 12" />
            {/* arrows push the volume outward on the open (left) side so everything stays inside the safe width */}
            <path d={`M ${-136 - e - 44} ${-hh * 0.5} H ${-136 - e - 8} M ${-136 - e - 24} ${-hh * 0.5 - 14} L ${-136 - e - 8} ${-hh * 0.5} L ${-136 - e - 24} ${-hh * 0.5 + 14}`} />
            <path d={`M ${-136 - e - 44} ${hh * 0.5} H ${-136 - e - 8} M ${-136 - e - 24} ${hh * 0.5 - 14} L ${-136 - e - 8} ${hh * 0.5} L ${-136 - e - 24} ${hh * 0.5 + 14}`} />
          </g>
        );
      })()}
      {/* REPAIRS: wrench on the lowest module */}
      {g >= serviceT - 2 && (() => {
        const k = sp(g, serviceT, SNAP);
        return (
          <g opacity={clamp01(k)}>
            <Wrench x={STACK_X + 92} y={MODS[2].y - 64} rot={-30 + 14 * Math.sin((g - serviceT) * 0.28)} s={1.3} />
          </g>
        );
      })()}
    </g>
  );
};

export const B06Hud: React.FC<{g: number}> = ({g}) => {
  const t0 = V3['b06.title'];
  const a = sp(g, t0, SNAP);
  const out = E.in(tw(g, 712, 7));
  // one consequence label at a time: each plate replaces the previous one
  const labels = [
    {t: V3['b06.cost'], text: 'COST', fill: C.coral},
    {t: V3['b06.space'], text: 'SPACE', fill: C.saffron},
    {t: V3['b06.service'], text: 'REPAIRS', fill: C.teal},
  ];
  const cur = [...labels].reverse().find((l) => g >= l.t);
  return (
    <g>
      {g >= t0 && (
        <>
          <Headline x={500} y={282} text="ONE MORE" size={88} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
          <Headline x={500} y={364} text="FINGER?" size={88} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
        </>
      )}
      {cur && (() => {
        const k = sp(g, cur.t, SNAP);
        const w = cur.text.length * 0.62 * 66 + 56;
        return (
          <g transform={`translate(${STACK_X + 10} ${PLATE_Y}) scale(${k})`}>
            <rect x={-w / 2 + 5} y={-40 + 7} width={w} height={80} rx={20} fill={C.ink} opacity={0.25} />
            <rect x={-w / 2} y={-40} width={w} height={80} rx={20} fill={cur.fill} stroke={C.ink} strokeWidth={OUTLINE} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={66} fill={C.ink}>{cur.text}</text>
          </g>
        );
      })()}
    </g>
  );
};

/* ------------------------------------------------------------------ B07/B08: placement workstation */

const sdef = (n: 'thumb' | 'index') => defOf('robot', 'side', n)!;
const TABLE_Y = 1130;
const TRAY = {x: 330, y: TABLE_Y};
// the first block goes to the FAR slot (kept off the right rail, x <= 820): while `BUILT TO WORK` is on screen the hand is already out at the right, clear of the title
const SLOT = [{x: 820}, {x: 670}];
export const BLK = 104;
const S7 = 2.0;

type Phase = {pick: number; carry0: number; carry1: number; place: number};
export const PH = [
  {pick: 807, carry0: 812, carry1: 840, place: V3['b07.place']},
  {pick: 898, carry0: 902, carry1: 914, place: V3['b08.place']},
];

/** returns block centre + hand placement for block i (0 = B07, 1 = B08) */
export const work = (g: number, i: 0 | 1) => {
  const ph = PH[i];
  const slotX = SLOT[i].x;
  const restY = TABLE_Y - BLK / 2 - 4;
  const slotY = TABLE_Y - BLK / 2 + 14 - 36; // seated lower than resting blocks
  const startX = i === 0 ? TRAY.x : TRAY.x + 10;
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

export const handFor = (g: number, i: 0 | 1) => {
  const w = work(g, i);
  const ph = PH[i];
  const away = g >= ph.place + 3 ? E.out(tw(g, ph.place + 3, 12)) : 0;
  const arrive = g < ph.pick ? E.out(tw(g, ph.pick - 22, 22)) : 1;
  const Py = lerp(-220, w.by - 280, arrive) - 260 * away;
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

export const B07World: React.FC<{g: number}> = ({g}) => {
  const lamps = [V3['b07.ok'], V3['b08.ok']];
  const bumpT = [V3['b07.place'], V3['b08.place']];
  const nod = V3['b07.nod'];
  const pose = basePose({
    brows: 0.15,
    mouth: g >= nod && g < 938 ? 'smile' : 'flat',
    lookX: 0.8,
    lookY: kf(g, [[792, 0.2], [845, 0.15], [nod, 0.55], [nod + 8, 0.0]]),
    tilt: g >= nod && g < nod + 12 ? 5 * Math.sin(((g - nod) / 12) * Math.PI) : 0,
  });
  // B08: human reference silhouette slides past behind the working hand
  const b0 = work(g, 0), b1 = work(g, 1);
  const h0 = handFor(g, 0), h1 = handFor(g, 1);
  const first = g < PH[1].pick - 24;
  const h = first ? h0 : h1;
  return (
    <g>
      <BgPeg tableY={TABLE_Y} />
      {/* guide watches from behind the table */}
      <GuideAt g={g} x={150} y={TABLE_Y + 120} scale={1.1} pose={pose} />
      {g >= 909 && g < 937 && (
        <g transform={`translate(0 ${-E.in(tw(g, 931, 5)) * 420})`}><HumanRef x={360} y={620} k={sp(g, 909, SNAP)} /></g>
      )}
      <rect x={0} y={TABLE_Y} width={W} height={H - TABLE_Y} fill={C.woodLight} opacity={0.0} />
      {/* tray + fixture */}
      <rect x={TRAY.x - 110} y={TABLE_Y - 30} width={220} height={34} rx={10} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={Math.min(SLOT[0].x, SLOT[1].x) - 100} y={TABLE_Y - 70} width={Math.abs(SLOT[1].x - SLOT[0].x) + 200} height={74} rx={12} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE + 1} />
      {SLOT.map((s, i) => (
        <g key={i}>
          <rect x={s.x - BLK / 2 - 8} y={TABLE_Y - 74} width={BLK + 16} height={22} rx={6} fill={C.ink} />
          <circle cx={s.x} cy={TABLE_Y - 320} r={22} fill={g >= lamps[i] ? C.teal : C.inkMuted} stroke={C.ink} strokeWidth={5} />
          {g >= lamps[i] && (
            <path d={`M ${s.x - 10} ${TABLE_Y - 320} l 8 9 l 14 -17`} stroke={C.cream} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          )}
          {g >= lamps[i] && <circle cx={s.x} cy={TABLE_Y - 320} r={22 + (g - lamps[i]) * 3} fill="none" stroke={C.teal} strokeWidth={4} opacity={clamp01(1 - (g - lamps[i]) / 9)} />}
        </g>
      ))}
      {/* blocks: resting in the tray until picked */}
      {g < PH[0].pick && <Block x={TRAY.x} y={TABLE_Y - BLK / 2 - 4} />}
      <Block x={b0.bx} y={g < PH[0].pick ? -999 : b0.by} />
      {g < PH[1].pick && <Block x={TRAY.x + 10} y={TABLE_Y - BLK / 2 - 4 - (g < PH[0].pick ? 0 : 0)} />}
      {g >= PH[1].pick && <Block x={b1.bx} y={b1.by} />}
      <Hand view="side" x={h.P.x} y={h.P.y} scale={h.P.scale} rot={h.P.rot} pose={h.pose} forearm={{to: {x: h.P.x, y: -320}}} armW={64} />
      {bumpT.map((t, i) => (
        <Burst key={i} x={SLOT[i].x} y={TABLE_Y - 40} t={(g - t) / 10} r0={70} r1={130} n={8} color={C.ink} w={6} />
      ))}
    </g>
  );
};

const HumanRef: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, k)})`}>
    <ellipse cx={10} cy={250} rx={170} ry={22} fill={C.shadow} />
    <Hand kind="human" nails x={0} y={0} scale={1.4} pose={{}} />
    <rect x={-88} y={190} width={176} height={54} rx={16} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <text x={0} y={217} dy="0.36em" textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={36} fill={C.ink}>HUMAN</text>
  </g>
);

export const B07Hud: React.FC<{g: number}> = ({g}) => {
  const t = V3['b07.label'];
  const a = sp(g, t, SNAP);
  const out = tw(g, 875, 4, E.in);
  if (g < t || g >= 881) return null;
  return (
    <g>
      <Headline x={120} anchor="start" y={286} text="BUILT" size={96} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
      <Headline x={120} anchor="start" y={382} text="TO WORK" size={96} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
    </g>
  );
};

/* ------------------------------------------------------------------ B09: editorial receipt gag (large, few items) */

const REC = {x: 540, top: 262, w: 700};
const LH = 100;
const ROWS: [string, string][] = [['5TH FINGER', '?'], ['+3 ACTUATORS', ''], ['+ COST', ''], ['+ BULK', ''], ['+ REPAIRS', '']];

export const B09World: React.FC<{g: number}> = ({g}) => {
  const p0 = V3['b09.print'] - 4; // the first row is already printing as the receipt lands
  const stampT = V3['b09.stamp'];
  const nLines = Math.min(ROWS.length, Math.max(0, Math.floor((g - p0) / 8.5) + 1));
  const full = 60 + ROWS.length * LH + 190;
  const printed = g >= stampT - 4 ? full : 60 + nLines * LH + 34;
  const stampK = sp(g, stampT, SNAP);
  const slip = 0.5 * Math.sin((g - p0) * 1.7) * (g > p0 && g < p0 + 50 ? 1 : 0);
  const stampY = 60 + ROWS.length * LH + 80;
  return (
    <g>
      <BgReceipt />
      <g transform={`translate(${REC.x} ${REC.top + slip})`}>
        <path d={`M ${-REC.w / 2} 0 H ${REC.w / 2} V ${printed} ${Array.from({length: 18}).map((_, i) => `L ${REC.w / 2 - (i + 1) * (REC.w / 18)} ${printed + (i % 2 ? 0 : 22)}`).join(' ')} Z`} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        {ROWS.slice(0, nLines).map(([l, r], i) => (
          <g key={i}>
            <text x={-REC.w / 2 + 46} y={86 + i * LH} fontFamily={F.mono} fontWeight={700} fontSize={64} fill={C.ink}>{l}</text>
            {r && <text x={REC.w / 2 - 46} y={86 + i * LH} textAnchor="end" fontFamily={F.mono} fontWeight={700} fontSize={64} fill={C.coralDeep}>{r}</text>}
            {i < ROWS.length - 1 && <line x1={-REC.w / 2 + 46} y1={86 + i * LH + 28} x2={REC.w / 2 - 46} y2={86 + i * LH + 28} stroke={C.inkMuted} strokeWidth={4} strokeDasharray="3 14" strokeLinecap="round" opacity={0.7} />}
          </g>
        ))}
        {g >= stampT && (
          <g transform={`translate(0 ${stampY}) rotate(-5) scale(${1 + 0.35 * (1 - stampK)})`} opacity={clamp01(stampK * 2)}>
            <rect x={-318} y={-66} width={636} height={132} rx={20} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE + 1} opacity={0.96} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={90} fill={C.ink}>NOT IN BUDGET</text>
          </g>
        )}
      </g>
      <Burst x={REC.x} y={REC.top + stampY} t={(g - stampT) / 10} r0={330} r1={400} n={10} color={C.saffron} w={8} />
    </g>
  );
};
void ikDigit; void toLocal; void mix; void SOFT; void ring; void impact; void drift; void sdef;
