import React from 'react';
import {EV} from '../cues';
import {C, F, RH, SURF, Plate, Headline, Burst, Shadow, E, kf, tw, lerp, clamp01, OUTLINE, W} from './common';
import {Hand, HandPose, ikDigit, defOf, toLocal, V, Place, mix} from '../hand/Hand';
import {sp, SNAP, SOFT, ring, impact, drift} from '../lib/motion';
import {Actuator, Die, Receipt, RegisterBox, Tag, Tool, TOOL, Wrench} from './props';
import {OPEN_POSE, frontPose} from './beats1';
import {pinchPose} from './beats2';

const sd = (n: 'thumb' | 'index' | 'middle' | 'ring') => defOf('robot', 'side', n)!;

/* ------------------------------------------------------------------ shared tray / dock */

export const TRAY = {x: 560, w: 520, h: 92};
const SLOTS = [400, 560, 720];

export const TrayDock: React.FC<{g: number; dock: number; contents?: React.ReactNode; bump: number}> = ({g, dock, contents, bump}) => {
  const {x, w, h} = TRAY;
  const [sx, sy] = [1 + 0.03 * bump, 1 - 0.07 * bump];
  void g;
  return (
    <g transform={`translate(${x} ${SURF}) scale(${sx} ${sy})`}>
      <Shadow x={0} y={4} rx={w / 2 + 18} />
      {/* back wall + interior (tray) */}
      <path d={`M ${-w / 2} ${-h} L ${w / 2} ${-h} L ${w / 2 - 14} 0 L ${-w / 2 + 14} 0 Z`} fill={mix(C.blueLight, C.ink, 0.28)} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" opacity={1 - dock} />
      {SLOTS.slice(0, 2).map((s, i) => (
        <line key={i} x1={(s + SLOTS[i + 1]) / 2 - x} y1={-h + 6} x2={(s + SLOTS[i + 1]) / 2 - x} y2={-6} stroke={C.ink} strokeWidth={4} opacity={0.55 * (1 - dock)} />
      ))}
      {contents}
      {/* front wall */}
      <path d={`M ${-w / 2 + 3} ${-h * 0.5} L ${w / 2 - 3} ${-h * 0.5} L ${w / 2 - 14} 0 L ${-w / 2 + 14} 0 Z`} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" opacity={1 - dock} />
      {/* dock: solid blue block with a slot in its top face (same rim silhouette as the tray) */}
      <g opacity={dock}>
        <path d={`M ${-w / 2} ${-h - 20} L ${w / 2} ${-h - 20} L ${w / 2} ${-h} L ${-w / 2} ${-h} Z`} fill={C.blueDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-48} y={-h - 15} width={96} height={11} rx={4} fill={C.ink} />
      </g>
    </g>
  );
};
export const DockFace: React.FC<{dock: number; bump: number}> = ({dock, bump}) => {
  const {x, w, h} = TRAY;
  return (
    <g transform={`translate(${x} ${SURF}) scale(${1 + 0.03 * bump} ${1 - 0.07 * bump})`} opacity={dock}>
      <path d={`M ${-w / 2} ${-h} L ${w / 2} ${-h} L ${w / 2 - 14} 0 L ${-w / 2 + 14} 0 Z`} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <rect x={-w / 2 + 30} y={-h + 16} width={w - 60} height={9} rx={4} fill="#FFFFFF" opacity={0.3} />
    </g>
  );
};

/* ------------------------------------------------------------------ B06: tradeoff */

const LAND = [EV['B06.actuator.1'], EV['B06.actuator.2'], EV['B06.actuator.3']];
const PLATE_T = [EV['B06.tray.cost'], EV['B06.tray.space'], EV['B06.tray.service']];
export const CARD6 = {x: 485, y: 585, w: 770, h: 260};
const CARD_OUT = 693;

export const trayBump = (g: number) => {
  const ts = [...LAND, ...PLATE_T];
  return ts.reduce((a, t) => a + (g >= t ? Math.max(0, 1 - (g - t) / 7) * Math.cos((g - t) * 0.5) : 0), 0);
};

const fallY = (g: number, land: number, y0: number, y1: number) => {
  const t = clamp01((g - (land - 11)) / 11);
  return lerp(y0, y1, t * t);
};

export const B06Tray: React.FC<{g: number; dock: number}> = ({g, dock}) => {
  const act = LAND.map((land, i) => {
    const slotY = CARD6.y + 30;
    const rest = -42;
    const x = SLOTS[i] - TRAY.x;
    const popK = sp(g, land - 18, SNAP);
    const landed = g >= land;
    const y = landed ? rest - 10 * Math.max(0, Math.sin(((g - land) / 7) * Math.PI)) * (g - land < 7 ? 1 : 0) - (PLATE_T.some((t) => g >= t && g < t + 7 && PLATE_T.indexOf(t) === i) ? 10 * Math.sin(((g - PLATE_T[i]) / 7) * Math.PI) : 0) : fallY(g, land, slotY - SURF, rest);
    return {x, y, popK, landed, i};
  });
  return (
    <TrayDock g={g} dock={dock} bump={trayBump(g)}
      contents={act.filter((a) => g >= LAND[a.i] - 18).map((a) => (
        <g key={a.i} opacity={1 - dock}>
          <Actuator x={a.x} y={a.y} s={0.95 * (a.landed ? 1 : a.popK)} />
        </g>
      ))}
    />
  );
};

export const B06Card: React.FC<{g: number}> = ({g}) => {
  const morph = E.inOut(tw(g, EV['B05.card.morph'], 12));
  const out = E.in(tw(g, CARD_OUT, 9));
  // starts as the trigger lever (saffron) from shot C, becomes the white design card
  const trig = {x: 330 + (TOOL.trigX + 7) * 1.3, y: 900 + (TOOL.trigY + 7) * 1.3, w: 36, h: 83};
  const x = lerp(trig.x, CARD6.x, morph), y = lerp(trig.y, CARD6.y, morph);
  const w = lerp(trig.w, CARD6.w, morph), h = lerp(trig.h, CARD6.h, morph);
  const inner = clamp01((morph - 0.7) / 0.3);
  const t0 = EV['B06.option.reveal'];
  const ghost = sp(g, t0 + 4, SNAP);
  return (
    <g transform={`translate(0 ${-out * 1000})`} opacity={1 - out}>
      <rect x={x - w / 2 + 6} y={y - h / 2 + 10} width={w} height={h} rx={lerp(8, 24, morph)} fill={C.ink} opacity={0.2} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={lerp(8, 24, morph)} fill={mix(C.saffron, C.white, morph)} stroke={C.ink} strokeWidth={OUTLINE + 1} />
      <g opacity={inner}>
        <text x={CARD6.x - CARD6.w / 2 + 28} y={CARD6.y - CARD6.h / 2 + 58} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.coralDeep}>DESIGN OPTION</text>
        {/* hand icon with the optional fifth digit sketched in */}
        <g transform="translate(0 6)">
          <Hand x={262} y={CARD6.y + 58} scale={0.52} pose={OPEN_POSE} ghostPinky={0.55 + 0.45 * ghost} />
          <g transform={`translate(${340} ${CARD6.y - 40}) scale(${ghost})`}>
            <circle r={24} fill={C.coral} stroke={C.ink} strokeWidth={4} />
            <path d="M -11 0 H 11 M 0 -11 V 11" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          </g>
        </g>
        {SLOTS.map((sx, i) => (
          <circle key={i} cx={sx} cy={CARD6.y + 30} r={42} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="12 10" opacity={g >= LAND[i] - 12 ? 0.25 : 0.8} />
        ))}
      </g>
    </g>
  );
};

const PLATES = [
  {text: 'COST', fill: C.coral, y: 600},
  {text: 'SPACE', fill: C.saffron, y: 735},
  {text: 'REPAIRS', fill: C.teal, y: 870},
];

export const B06Plates: React.FC<{g: number}> = ({g}) => {
  const out = E.in(tw(g, 784, 8));
  return (
    <g>
      {PLATES.map((p, i) => {
        const t = PLATE_T[i];
        if (g < t - 1) return null;
        const k = kf(g, [[t - 1, 1, E.linear], [t + 8, 0, E.back]]);
        const x = 485 + k * 900 + out * 1000;
        return (
          <g key={p.text} transform={`translate(${x} ${p.y})`}>
            <rect x={-379} y={-50} width={770} height={112} rx={22} fill={C.ink} opacity={0.22} />
            <rect x={-385} y={-56} width={770} height={112} rx={22} fill={p.fill} stroke={C.ink} strokeWidth={OUTLINE} />
            <g transform="translate(-318 0)">
              {i === 0 && (
                <g transform={`scale(${Math.cos((g - t) * 0.22)} 1)`}>
                  <circle r={34} fill={C.saffronLight} stroke={C.ink} strokeWidth={5} />
                  <circle r={21} fill="none" stroke={C.ink} strokeWidth={4} />
                </g>
              )}
              {i === 1 && (
                <g stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d={`M ${-34 - 5 * Math.sin((g - t) * 0.3)} -22 V 22 M ${34 + 5 * Math.sin((g - t) * 0.3)} -22 V 22`} />
                  <path d="M -22 0 H 22 M -10 -12 L -22 0 L -10 12 M 10 -12 L 22 0 L 10 12" />
                </g>
              )}
              {i === 2 && <Wrench x={0} y={0} rot={-35 + 14 * Math.sin((g - t) * 0.28)} s={0.62} />}
            </g>
            <text x={-250} y={0} dy="0.36em" fontFamily={F.display} fontWeight={700} fontSize={80} fill={C.ink}>{p.text}</text>
          </g>
        );
      })}
    </g>
  );
};

export const B06Hud: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['B06.option.reveal'];
  const a = sp(g, t0, SNAP);
  const out = E.in(tw(g, CARD_OUT - 2, 7));
  if (g < t0 || g >= CARD_OUT + 8) return null;
  return (
    <g>
      <Headline y={275} text="ONE MORE" size={100} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
      <Headline y={377} text="FINGER?" size={100} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
    </g>
  );
};

export const B06Bench: React.FC<{g: number}> = ({g}) => {
  const t = PLATE_T[2];
  if (g < t - 2) return null;
  const k = sp(g, t, SNAP);
  const out = tw(g, 784, 8, E.in);
  return (
    <g opacity={1 - out} transform={`scale(${1}) translate(0 0)`}>
      <Shadow x={200} y={SURF + 2} rx={60} />
      <Actuator x={200} y={SURF - 26 - 10 * (1 - k)} s={0.8 * k} />
      <Wrench x={296} y={SURF - 12} rot={-9} s={0.9 * k} />
    </g>
  );
};

/* ------------------------------------------------------------------ B07: tool docking, B08: die, B09: joke */

const P7 = {x: TRAY.x - 82 * 1.3, scale: 1.3};
const DOCK_Y = SURF - TRAY.h - 15; // slot centre
const HANDLE_BOTTOM = 82;

export const grip = (P: Place, press: number, open: number): HandPose => {
  const L = (x: number, y: number) => toLocal(P.x + x * P.scale, P.y + y * P.scale, P.x, P.y, P.scale);
  const trig = {x: TOOL.trigX + 10 - 9 * press + 44 * open, y: TOOL.trigY + 8 + 3 * press - 16 * open};
  return {
    index: ikDigit(sd('index'), L(trig.x, trig.y), lerp(74, 20, open), -1),
    middle: ikDigit(sd('middle'), L(TOOL.handleX1 + 6 + 52 * open, 0 - 10 * open), lerp(118, 24, open), -1),
    ring: ikDigit(sd('ring'), L(TOOL.handleX1 + 6 + 52 * open, 36 - 14 * open), lerp(124, 28, open), -1),
    thumb: ikDigit(sd('thumb'), L(TOOL.handleX0 + 44 + 30 * open, TOOL.handleY0 - 4 - 16 * open), lerp(-52, -10, open), 1),
  };
};

export const b07 = (g: number) => {
  const dockT = EV['B07.tool.dock'];
  const enter = E.out(tw(g, 800, 38));
  const lower = E.in(tw(g, dockT - 11, 11));
  const finalY = DOCK_Y + 8 - HANDLE_BOTTOM * P7.scale;
  const hover = finalY - 150;
  let y = lerp(lerp(finalY - 380, hover, enter), finalY, lower);
  let x = lerp(P7.x - 900, P7.x, enter);
  // let go: a small step back while the fingers open, then the hand returns and re-grips (B08)
  const regrip = E.inOut(tw(g, 880, 14));
  const away = E.out(tw(g, dockT + 5, 9)) * (1 - regrip);
  x -= 60 * away;
  y -= 40 * away;
  y -= 120 * E.inOut(tw(g, 899, 14)); // lifts the tool back out of the dock
  const rel = E.out(tw(g, dockT + 4, 8)) * (1 - regrip); // 1 = fingers open
  const press = kf(g, [[913, 0, E.inOut], [EV['B08.trigger.click'], 1, E.in], [960, 1, E.linear]]);
  const squash = impact(g, dockT, 0.04, 7);
  return {x, y, finalY, rel, press, squash, dockT, seated: g >= dockT + 2 && g < 897};
};

export const B07Tool: React.FC<{g: number}> = ({g}) => {
  const b = b07(g);
  const P: Place = {x: b.x, y: b.y, scale: P7.scale};
  const pose = grip(P, b.press, b.rel);
  const tp = b.seated ? {x: P7.x, y: b.finalY} : {x: b.x, y: b.y};
  const click = EV['B08.trigger.click'];
  return (
    <g>
      <g transform={`translate(${tp.x} ${tp.y}) scale(${P.scale}) scale(${b.squash[0]} ${b.squash[1]})`}>
        <Tool press={b.press} />
      </g>
      <DockFace dock={tw(g, 792, 8)} bump={trayBump(g)} />
      <Hand view="side" x={b.x} y={b.y} scale={P.scale} pose={pose} forearm={{to: {x: -100, y: b.y + 640}}} />
      <Burst x={TRAY.x} y={SURF - 100} t={(g - b.dockT) / 10} r0={60} r1={120} n={8} color={C.ink} w={5} />
      <Burst x={b.x + (TOOL.trigX + 14) * P.scale} y={b.y + (TOOL.trigY + 8) * P.scale} t={(g - click) / 10} r0={46} r1={92} n={8} color={C.coral} w={6} />
      <g transform={`translate(${b.x + 226 * P.scale + 30} ${b.y - 111 * P.scale})`}>
        <Burst x={0} y={0} t={(g - click) / 12} r0={20} r1={64} n={6} color={C.saffron} w={7} />
      </g>
    </g>
  );
};

export const B07Hud: React.FC<{g: number}> = ({g}) => {
  const t = EV['B07.label.built'];
  const a = sp(g, t, SNAP);
  const out = tw(g, 874, 4, E.in);
  if (g < t || g >= 880) return null;
  return (
    <g>
      <Headline y={275} text="BUILT" size={104} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
      <Headline y={382} text="TO WORK" size={104} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />
    </g>
  );
};

/* B08: the human reference card passes behind while the hand keeps working (re-grips the docked tool) */

export const refCardX = (g: number) => lerp(W + 260, -320, E.inOut(tw(g, 893, 44)));
export const B08Card: React.FC<{g: number}> = ({g}) => {
  const x = refCardX(g);
  const y = 560;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-142} y={-196} width={300} height={400} rx={22} fill={C.ink} opacity={0.2} />
      <rect x={-150} y={-204} width={300} height={400} rx={22} fill={C.white} stroke={C.ink} strokeWidth={OUTLINE} />
      <g transform="translate(0 -40) scale(0.9)">
        <Hand kind="human" x={0} y={0} scale={0.9} />
      </g>
      <text x={0} y={150} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>HUMAN</text>
      <text x={0} y={190} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>REFERENCE</text>
    </g>
  );
};

/* B09 */

export const poseB09 = (g: number): HandPose => {
  const t0 = 939;
  const c = kf(g, [[t0, 0.45, E.linear], [t0 + 12, 0.45, E.inOut], [EV['B09.hand.return_pose'] - 12, 0.12, E.inOut], [EV['B09.hand.return_pose'], 0, E.out]]);
  const sw = kf(g, [[t0, 0.5, E.linear], [EV['B09.hand.return_pose'], 1, E.out]]);
  return frontPose([c, c, c, c], 0.2, sw);
};

const REG = {x: 296, y: SURF};
const TRAY9 = {x: 800, w: 220};

export const B09World: React.FC<{g: number}> = ({g}) => {
  const rec = E.out(tw(g, EV['B09.receipt.entry'], 20)) * 0.62;
  const tagT = EV['B09.budget.tag_contact'];
  const drawer = tw(g, tagT, 3, E.out) * (1 - tw(g, tagT + 10, 6, E.inOut));
  const fall = clamp01((g - (tagT - 10)) / 10);
  const tagY = lerp(560, SURF - 60, fall * fall);
  const bounce = g >= tagT ? 10 * Math.max(0, Math.sin(((g - tagT) / 8) * Math.PI)) * (g - tagT < 8 ? 1 : 0) : 0;
  const tw9 = TRAY9.w;
  return (
    <g>
      <Hand x={RH.x} y={RH.y} scale={RH.s} pose={poseB09(g)} forearm={{stand: SURF}} />
      <Receipt x={REG.x} y={REG.y - 150} t={rec} />
      <RegisterBox x={REG.x} y={REG.y} drawer={drawer} />
      {/* small parts tray on the right: the price-tag-shaped prop drops in, blank */}
      <g transform={`translate(${TRAY9.x} ${SURF})`}>
        <Shadow x={0} y={4} rx={tw9 / 2 + 14} />
        <path d={`M ${-tw9 / 2} -66 L ${tw9 / 2} -66 L ${tw9 / 2 - 12} 0 L ${-tw9 / 2 + 12} 0 Z`} fill={mix(C.blueLight, C.ink, 0.28)} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        {g >= tagT - 12 && <Tag x={0} y={tagY - SURF - bounce + 4} rot={-10 * (1 - fall)} s={0.8} />}
        <path d={`M ${-tw9 / 2 + 3} -34 L ${tw9 / 2 - 3} -34 L ${tw9 / 2 - 12} 0 L ${-tw9 / 2 + 12} 0 Z`} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      </g>
      <Burst x={TRAY9.x} y={SURF - 60} t={(g - tagT) / 10} r0={50} r1={100} n={7} color={C.ink} w={5} />
    </g>
  );
};
