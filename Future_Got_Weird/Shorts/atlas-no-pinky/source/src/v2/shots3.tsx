import React from 'react';
import {C, F, E, tw, kf, lerp, clamp01, Burst, Headline, OUTLINE, W, H} from '../film/common';
import {Hand, HandPose, ikDigit, defOf, toLocal, V, Place, mix} from '../hand/Hand';
import {sp, SNAP, SOFT, ring, impact, drift} from '../lib/motion';
import {V2} from '../cues_v2';
import {BgBlue, BgPeg, BgReceipt} from './stage';
import {GuideAt, basePose} from './util';
import {Actuator, Wrench} from '../film/props';
import {OPEN_POSE} from '../film/beats1';
import {pinchPose} from '../film/beats2';

/* ------------------------------------------------------------------ B06: exploded hardware diagram (design option) */

const HP6: Place = {x: 340, y: 735, scale: 1.25};
const MODS = [{x: 235, t: V2['b06.mod1']}, {x: 520, t: V2['b06.mod2']}, {x: 805, t: V2['b06.mod3']}];
const MOD_Y = 985;
const GHOST_C = {x: HP6.x + HP6.scale * 134, y: HP6.y - HP6.scale * 96}; // where the fifth digit would attach (front-view ghost slot)

export const B06World: React.FC<{g: number}> = ({g}) => {
  const t0 = V2['b06.title'];
  const ghost = sp(g, V2['b06.ghost'], SNAP);
  const costT = V2['b06.cost'], spaceT = V2['b06.space'], serviceT = V2['b06.service'];
  const bump = (t: number) => (g >= t ? Math.max(0, 1 - (g - t) / 8) * Math.cos((g - t) * 0.55) : 0);
  return (
    <g>
      <BgBlue />
      {/* leader lines from the optional digit to each module (exploded-assembly look) */}
      <g fill="none" stroke={C.blueDeep} strokeWidth={5} strokeDasharray="3 14" strokeLinecap="round" opacity={0.9}>
        {MODS.map((m, i) => {
          const k = tw(g, m.t - 16, 12);
          if (k <= 0) return null;
          const ex = lerp(GHOST_C.x, m.x, k), ey = lerp(GHOST_C.y + 40, MOD_Y - 80, k);
          return <path key={i} d={`M ${GHOST_C.x} ${GHOST_C.y + 40} C ${GHOST_C.x} ${GHOST_C.y + 220}, ${ex} ${ey - 200}, ${ex} ${ey}`} />;
        })}
      </g>
      <Hand x={HP6.x} y={HP6.y} scale={HP6.scale} pose={OPEN_POSE} ghostPinky={0.55 + 0.45 * ghost} />
      {g >= V2['b06.ghost'] && (
        <g transform={`translate(${GHOST_C.x + 60} ${GHOST_C.y - 36}) scale(${ghost})`}>
          <circle r={30} fill={C.coral} stroke={C.ink} strokeWidth={5} />
          <path d="M -13 0 H 13 M 0 -13 V 13" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {/* three modules, each with its qualitative consequence attached to the object */}
      {MODS.map((m, i) => {
        const k = sp(g, m.t, SNAP);
        if (g < m.t - 14) return null;
        const drop = (1 - clamp01((g - (m.t - 14)) / 14)) * -420;
        const y = MOD_Y + drop - 10 * bump([costT, spaceT, serviceT][i]);
        return (
          <g key={i}>
            <ellipse cx={m.x + 22} cy={MOD_Y + 86} rx={110} ry={16} fill={C.shadow} opacity={clamp01(1 + drop / 300)} />
            <g transform={`translate(${m.x} ${y}) scale(${Math.min(1, 0.4 + 0.6 * k)})`}>
              <Actuator x={0} y={0} s={2.2} />
            </g>
          </g>
        );
      })}
      {/* COST: a blank price tag tied to module 1 */}
      {g >= costT - 2 && (
        <g transform={`translate(${MODS[0].x + 40} ${MOD_Y - 120}) rotate(${-10 + 6 * Math.sin((g - costT) * 0.3)}) scale(${sp(g, costT, SNAP)})`}>
          <line x1={0} y1={90} x2={-14} y2={40} stroke={C.ink} strokeWidth={4} />
          <path d="M -64 -34 L 38 -34 L 66 0 L 38 34 L -64 34 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
          <circle cx={36} cy={0} r={8} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {/* SPACE: dashed volume box around module 2 and arrows pushing outward */}
      {g >= spaceT - 2 && (() => {
        const k = sp(g, spaceT, SNAP);
        const e = 18 * k;
        return (
          <g transform={`translate(${MODS[1].x + 30} ${MOD_Y})`} opacity={clamp01(k)} fill="none" stroke={C.coralDeep} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
            <rect x={-130 - e} y={-96 - e} width={260 + 2 * e} height={192 + 2 * e} rx={14} strokeDasharray="16 12" />
            <path d={`M ${-130 - e - 38} 0 H ${-130 - e - 6} M ${-130 - e - 22} -14 L ${-130 - e - 6} 0 L ${-130 - e - 22} 14`} />
            <path d={`M ${130 + e + 38} 0 H ${130 + e + 6} M ${130 + e + 22} -14 L ${130 + e + 6} 0 L ${130 + e + 22} 14`} />
          </g>
        );
      })()}
      {/* REPAIRS: spare module beside a wrench at module 3 */}
      {g >= serviceT - 2 && (() => {
        const k = sp(g, serviceT, SNAP);
        return (
          <g opacity={clamp01(k)}>
            <g transform={`translate(${MODS[2].x - 18} ${MOD_Y - 130 * (1 - k)}) scale(${0.62}) rotate(${-8})`}>
              <Actuator x={0} y={0} s={1.8} />
            </g>
            <Wrench x={MODS[2].x + 50} y={MOD_Y - 96} rot={-30 + 14 * Math.sin((g - serviceT) * 0.28)} s={1.1} />
          </g>
        );
      })()}
    </g>
  );
};

export const B06Hud: React.FC<{g: number}> = ({g}) => {
  const t0 = V2['b06.title'];
  const a = sp(g, t0, SNAP);
  const out = E.in(tw(g, 712, 7));
  const labels = [
    {t: V2['b06.cost'], text: 'COST', x: MODS[0].x, fill: C.coral},
    {t: V2['b06.space'], text: 'SPACE', x: MODS[1].x, fill: C.saffron},
    {t: V2['b06.service'], text: 'REPAIRS', x: MODS[2].x, fill: C.teal},
  ];
  return (
    <g>
      {g >= t0 && (
        <>
          <Headline x={500} y={262} text="ONE MORE" size={96} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
          <Headline x={500} y={360} text="FINGER?" size={96} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
        </>
      )}
      {labels.map((l) => {
        if (g < l.t) return null;
        const k = sp(g, l.t, SNAP);
        const w = l.text.length * 0.64 * 70 + 44;
        const cx = Math.min(870 - w / 2, Math.max(120 + w / 2, l.x + 10));
        return (
          <g key={l.text} transform={`translate(${cx} ${MOD_Y + 140}) scale(${k})`}>
            <rect x={-w / 2 + 5} y={-37 + 6} width={w} height={74} rx={18} fill={C.ink} opacity={0.25} />
            <rect x={-w / 2} y={-37} width={w} height={74} rx={18} fill={l.fill} stroke={C.ink} strokeWidth={OUTLINE} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={56} fill={C.ink}>{l.text}</text>
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ B07/B08: placement workstation */

const sdef = (n: 'thumb' | 'index') => defOf('robot', 'side', n)!;
const TABLE_Y = 1130;
const TRAY = {x: 330, y: TABLE_Y};
const SLOT = [{x: 680}, {x: 860}];
const BLK = 104;
const S7 = 2.0;

type Phase = {pick: number; carry0: number; carry1: number; place: number};
const PH = [
  {pick: 807, carry0: 812, carry1: 840, place: V2['b07.place']},
  {pick: 898, carry0: 902, carry1: 914, place: V2['b08.place']},
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

const handFor = (g: number, i: 0 | 1) => {
  const w = work(g, i);
  const pad = 22 * S7 * 0.92;
  const t = {x: w.bx - (BLK / 2 + pad + w.jaw), y: w.by};
  const ix = {x: w.bx + (BLK / 2 + pad + w.jaw), y: w.by};
  const ph = PH[i];
  const away = g >= ph.place + 3 ? E.out(tw(g, ph.place + 3, 12)) : 0;
  const arrive = g < ph.pick ? E.out(tw(g, ph.pick - 22, 22)) : 1;
  const Py = lerp(-220, w.by - 280, arrive) - 260 * away;
  const P: Place = {x: w.bx + 12, y: Py, scale: S7, rot: 90};
  return {P, pose: pinchPose(P, t, ix), w};
};

const Block: React.FC<{x: number; y: number; on?: boolean}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-BLK / 2} y={-BLK / 2} width={BLK} height={BLK} rx={14} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE + 1} />
    <rect x={-BLK / 2 + 10} y={-BLK / 2 + 10} width={BLK - 20} height={20} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={4} />
    <circle cx={0} cy={18} r={14} fill={C.ink} />
  </g>
);

export const B07World: React.FC<{g: number}> = ({g}) => {
  const lamps = [V2['b07.ok'], V2['b08.ok']];
  const bumpT = [V2['b07.place'], V2['b08.place']];
  const nod = V2['b07.nod'];
  const pose = basePose({
    brows: 0.15,
    mouth: g >= nod && g < 938 ? 'smile' : 'flat',
    lookX: 0.8,
    lookY: kf(g, [[792, 0.2], [845, 0.15], [nod, 0.55], [nod + 8, 0.0]]),
    tilt: g >= nod && g < nod + 12 ? 5 * Math.sin(((g - nod) / 12) * Math.PI) : 0,
  });
  // B08: human reference silhouette slides past behind the working hand
  const hx = lerp(W + 300, -420, E.inOut(tw(g, V2['b08.human'] - 4, 40)));
  const b0 = work(g, 0), b1 = work(g, 1);
  const h0 = handFor(g, 0), h1 = handFor(g, 1);
  const first = g < PH[1].pick - 24;
  const h = first ? h0 : h1;
  return (
    <g>
      <BgPeg tableY={TABLE_Y} />
      {/* guide watches from behind the table */}
      <GuideAt g={g} x={150} y={TABLE_Y + 120} scale={1.1} pose={pose} />
      {g >= 889 && <HumanRef x={hx} y={700} />}
      <rect x={0} y={TABLE_Y} width={W} height={H - TABLE_Y} fill={C.woodLight} opacity={0.0} />
      {/* tray + fixture */}
      <rect x={TRAY.x - 110} y={TABLE_Y - 30} width={220} height={34} rx={10} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={SLOT[0].x - 100} y={TABLE_Y - 70} width={SLOT[1].x - SLOT[0].x + 200} height={74} rx={12} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE + 1} />
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

const HumanRef: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`} opacity={0.96}>
    <Hand kind="human" nails x={0} y={0} scale={1.7} pose={{}} />
    <rect x={-190} y={250} width={380} height={64} rx={16} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <text x={0} y={282} dy="0.36em" textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>HUMAN HAND</text>
  </g>
);

export const B07Hud: React.FC<{g: number}> = ({g}) => {
  const t = V2['b07.label'];
  const a = sp(g, t, SNAP);
  const out = tw(g, 875, 4, E.in);
  if (g < t || g >= 881) return null;
  return (
    <g>
      <Headline x={110} anchor="start" y={262} text="BUILT" size={104} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
      <Headline x={110} anchor="start" y={366} text="TO WORK" size={104} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
    </g>
  );
};

/* ------------------------------------------------------------------ B09: editorial receipt gag */

const REC = {x: 540, top: 262, w: 760};
const LH = 86;
const LINES = ['5TH FINGER (OPTIONAL)', '- - - - - - - - - - -', '3 ACTUATORS ........ —', 'MORE COST .......... —', 'MORE BULK .......... —', 'MORE REPAIRS ....... —', '- - - - - - - - - - -', 'BUDGET ............. ?'];

export const B09World: React.FC<{g: number}> = ({g}) => {
  const p0 = V2['b09.print'];
  const stampT = V2['b09.stamp'];
  const clickT = V2['b09.click'];
  const nLines = Math.min(LINES.length, Math.max(0, Math.floor((g - p0) / 8.5) + 1));
  const printed = 60 + nLines * LH + 34;
  const sheet = E.out(tw(g, V2['b09.drop'], 14));
  const stampK = sp(g, stampT, SNAP);
  const pose = basePose({brows: -0.4, mouth: 'flat', lookX: -0.6, lookY: -0.5, tilt: -2});
  const slip = 0.5 * Math.sin((g - p0) * 1.7) * (g > p0 && g < p0 + 70 ? 1 : 0);
  return (
    <g>
      <BgReceipt />
            <g transform={`translate(${REC.x} ${REC.top + slip})`}>
        <path d={`M ${-REC.w / 2} 0 H ${REC.w / 2} V ${printed} ${Array.from({length: 18}).map((_, i) => `L ${REC.w / 2 - (i + 1) * (REC.w / 18)} ${printed + (i % 2 ? 0 : 22)}`).join(' ')} Z`} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        {LINES.slice(0, nLines).map((l, i) => (
          <text key={i} x={-REC.w / 2 + 38} y={78 + i * LH} fontFamily={F.mono} fontWeight={500} fontSize={46} fill={C.ink}>{l}</text>
        ))}
        {g >= stampT && (
          <g transform={`translate(0 ${60 + 7 * LH + 14}) rotate(-6) scale(${1 + 0.35 * (1 - stampK)})`} opacity={clamp01(stampK * 2)}>
            <rect x={-300} y={-62} width={600} height={124} rx={18} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE + 1} opacity={0.94} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={84} fill={C.ink}>NOT IN BUDGET</text>
          </g>
        )}
      </g>
      <GuideAt g={g} x={885} y={1585} scale={1.0} pose={pose} flip />
      <Burst x={REC.x} y={REC.top + 60 + 7 * LH + 14} t={(g - stampT) / 10} r0={300} r1={380} n={10} color={C.saffron} w={8} />
      <g opacity={clamp01(1 - (g - clickT) / 20) * (g >= clickT ? 1 : 0)} />
    </g>
  );
};
void ikDigit; void toLocal; void mix; void SOFT; void ring; void impact; void drift; void sdef;
