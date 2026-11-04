// S1. The hook and the campus.
// Frame 0: two LARGE hands side by side in separate labs. Frame left, Rao's hand lies flat beside the game. Frame
// right, Stocco's index finger is already coming down on the space bar; the click fires the cannon on Rao's screen
// at 0.2 s. A supply plane then flies through untouched ("That's the guy playing"); a second rocket is shot down on
// "fired his cannon". On "across campus" the two panels pull back as two lab windows, and the buildings separate
// to reveal the campus between them. The wide shot carries "In 2013 ... between two buildings", where one game
// (screen + keyboard) splits: the screen flies to Rao's window, the keyboard to Stocco's.
import React from 'react';
import {clamp, easeInOut, easeOut, fmt, lerp, smooth} from '../dc/math';
import {FPS, T, pr} from '../lib/core';
import {GameScreen, GEvent} from '../art/game';
import {FLAT, HandPoseP, HOVER, indexTip, mixP, SideHand} from '../art/hand';
import {Building, Cam, FONT_HEAD, INK, K, Keyboard, Monitor, Tag, Tree} from '../art/kit';
import {lit, shade} from '../dc/color';

// ---------------------------------------------------------------- the two desks (panel-local 954 x 1080)
export const PW = 954, PH = 1080;

/** Desk top seen from above-front filling the lower panel; wall above. */
const DeskRoom: React.FC<{id: string; wall: string; wallDeep: string; top?: string}> = ({id, wall, wallDeep, top = K.deskTop}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit(wall, 0.2)} />
        <stop offset="1" stopColor={wall} />
      </linearGradient>
      <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(top, 0.12)} />
        <stop offset="1" stopColor={lit(top, 0.1)} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={PW} height={PH} fill={`url(#${id}-wall)`} />
    <rect x={0} y={440} width={PW} height={28} fill={wallDeep} />
    <path d={`M-40,480 L${PW + 40},480 L${PW + 40},${PH} L-40,${PH} Z`} fill={`url(#${id}-top)`} stroke={INK} strokeWidth={6} />
    <path d={`M-40,480 L${PW + 40},480`} stroke={lit(top, 0.35)} strokeWidth={8} />
  </g>
);

/** Rao's game events in the hook (seconds). */
export const hookEvents = (): GEvent[] => [
  {kind: 'rocket', t0: -1.6, dur: 3.4, fire: 0.2},
  {kind: 'plane', t0: 3.0, dur: 3.2},
  {kind: 'rocket', t0: T('fired') - 2.1, dur: 3.4, fire: T('fired') + 0.05},
];
export const strikeTimes = () => [0.17, T('fired') + 0.02];

export const RaoPanel: React.FC<{f: number; events?: GEvent[]; dim?: number}> = ({f, events, dim = 0}) => {
  const t = f / FPS;
  const breathe = Math.sin(t * 1.3) * 1.2;
  return (
    <g>
      <DeskRoom id="rao" wall={K.raoWall} wallDeep={K.raoWallDeep} />
      {/* a pinboard and a plant: Rao's room */}
      <rect x={70} y={120} width={190} height={140} rx={6} fill="#E9D8B8" stroke={INK} strokeWidth={5} />
      <rect x={96} y={142} width={56} height={44} fill="#FFFFFF" stroke={INK} strokeWidth={3} transform="rotate(-4 124 164)" />
      <rect x={170} y={150} width={60} height={70} fill={K.blueLight} stroke={INK} strokeWidth={3} transform="rotate(5 200 185)" />
      <Monitor id="raomon" x={590} y={545} s={0.78}>
        <GameScreen t={t} events={events ?? hookEvents()} />
      </Monitor>
      <SideHand id="raoh" x={250} y={760 + breathe} s={1.72} dir={1} side="thumb" pose={FLAT} skin={K.raoSkin} sleeve={K.raoSleeve} arm={560} armAng={5} contact={1} surfaceY={56} />
      {dim > 0 && <rect x={0} y={0} width={PW} height={PH} fill={INK} opacity={0.42 * dim} />}
    </g>
  );
};

/** index-tap pose at time t for contact times `taps` (fingertip lands on the bar at each tap time) */
export const tapPose = (t: number, taps: number[]): HandPoseP => {
  const LIFT: HandPoseP = {wrist: -6, idx: [-16, 10, 6], curl: 0.42, thumb: 0.45};
  const DOWN: HandPoseP = {wrist: -4, idx: [26, 26, 14], curl: 0.42, thumb: 0.45};
  let best = HOVER;
  for (const tc of taps) {
    const d = t - tc;
    if (d >= -0.55 && d < -0.18) best = mixP(HOVER, LIFT, easeInOut(clamp((d + 0.55) / 0.3)));
    else if (d >= -0.18 && d < 0) best = mixP(LIFT, DOWN, easeOut(clamp((d + 0.18) / 0.18) ** 1.6));
    else if (d >= 0 && d < 0.5) best = mixP(DOWN, HOVER, easeInOut(clamp((d - 0.08) / 0.42)));
  }
  return best;
};
// Stocco's wrist is placed so the index fingertip of the DOWN pose lands on the space bar.
const KB = {x: 430, y: 862, s: 1.45};
const HS = 1.72;
const DOWN_TIP = indexTip({wrist: -4, idx: [26, 26, 14], curl: 0.42, thumb: 0.45}, -1, HS);
export const STOCCO_WRIST = {x: KB.x - DOWN_TIP.x, y: KB.y - 150 * 0.08 * KB.s - DOWN_TIP.y - 6};

export const StoccoPanel: React.FC<{f: number; taps?: number[]; dim?: number}> = ({f, taps, dim = 0}) => {
  const t = f / FPS;
  const tp = taps ?? strikeTimes();
  const pose = tapPose(t, tp);
  const press = Math.max(0, ...tp.map((tc) => (t >= tc && t < tc + 0.12 ? 1 - (t - tc) / 0.12 : 0)));
  return (
    <g>
      <DeskRoom id="sto" wall={K.stoccoWall} wallDeep={K.stoccoWallDeep} top="#D9A773" />
      {/* a bare wall: no screen on this desk */}
      <rect x={560} y={150} width={150} height={190} rx={8} fill="#F8EEDC" stroke={INK} strokeWidth={5} />
      <path d="M585,190 L685,190 M585,220 L665,220 M585,250 L690,250 M585,280 L650,280" stroke="#C8B79A" strokeWidth={8} strokeLinecap="round" />
      <Keyboard id="stokb" x={KB.x} y={KB.y} s={KB.s} spaceDown={press} />
      <SideHand id="stoh" x={STOCCO_WRIST.x} y={STOCCO_WRIST.y} s={HS} dir={-1} side="thumb" pose={pose} skin={K.stoccoSkin} sleeve={K.stoccoSleeve} arm={560} armAng={-8} />
      {/* click mark on contact */}
      {tp.map((tc, i) => {
        const k = (t - tc) / 0.35;
        if (k < 0 || k > 1) return null;
        return (
          <g key={i} opacity={1 - k} stroke={K.saffron} strokeWidth={8} strokeLinecap="round">
            <path d={`M${KB.x - 150},${KB.y - 40 - 40 * k} l-30,-24`} />
            <path d={`M${KB.x + 150},${KB.y - 40 - 40 * k} l30,-24`} />
            <path d={`M${KB.x},${KB.y - 70 - 46 * k} l0,-30`} />
          </g>
        );
      })}
      {dim > 0 && <rect x={0} y={0} width={PW} height={PH} fill={INK} opacity={0.42 * dim} />}
    </g>
  );
};

// ---------------------------------------------------------------- the campus world
// Final positions of the two lab windows (world units). Each window has the panel's aspect (954 x 1080).
const WW = 106, WH = 120;
export const WIN_A = {x: -560, y: 400};
export const WIN_B = {x: 454, y: 400};
const BA = {x: -820, y: 230, w: 480, h: 530};
const BB = {x: 340, y: 230, w: 480, h: 530};
const GROUND = 760;

/** separation offset of the buildings: 1 = pushed together (windows adjacent), 0 = real positions */
export const campusCam = (p: number) => {
  // p 0..1 pull back
  const z0 = PH / WH; // 9.0: a window fills the frame height
  const gap0 = 12 / z0;
  const together = (WIN_B.x - WIN_A.x - WW - gap0) / 2;
  const sep = 1 - smooth(clamp((p - 0.18) / 0.82));
  // overfill the frame by 3.5 % at p = 0 so no building edge shows around the two windows
  const z = z0 * 1.035 * Math.pow(1.02 / (z0 * 1.035), easeInOut(p));
  const cx0 = (WIN_A.x + together + WW + WIN_B.x - together) / 2;
  const cy0 = WIN_A.y + WH / 2;
  const k = easeInOut(clamp((p - 0.05) / 0.95));
  return {x: lerp(cx0, 0, k), y: lerp(cy0, 470, k), z, shift: together * sep};
};

const WindowFrame: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g opacity={k}>
    <rect x={x - 5} y={y - 5} width={WW + 10} height={WH + 10} rx={3} fill="none" stroke={K.stone} strokeWidth={8} />
    <rect x={x - 5} y={y - 5} width={WW + 10} height={WH + 10} rx={3} fill="none" stroke={INK} strokeWidth={3} />
    <rect x={x - 12} y={y + WH + 4} width={WW + 24} height={9} fill={K.stone} stroke={INK} strokeWidth={2.5} />
  </g>
);

/** The campus with both labs; `rao` / `stocco` are the window contents (panel-local drawings). */
export const Campus: React.FC<{f: number; shift: number; frameK: number; rao: React.ReactNode; stocco: React.ReactNode; glowA?: number; glowB?: number; children?: React.ReactNode}> = ({
  f, shift, frameK, rao, stocco, glowA = 0, glowB = 0, children,
}) => {
  const t = f / FPS;
  const sc = WW / PW;
  const cloud = (x: number, y: number, s: number) => (
    <g transform={`translate(${fmt(x + ((t * 6) % 3000) - 1500)} ${y}) scale(${s})`} opacity={0.9}>
      <ellipse cx={0} cy={0} rx={90} ry={34} fill="#FFFFFF" />
      <ellipse cx={-50} cy={8} rx={60} ry={26} fill="#FFFFFF" />
      <ellipse cx={60} cy={10} rx={64} ry={24} fill="#FFFFFF" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={K.skyDeep} />
          <stop offset="1" stopColor={lit(K.sky, 0.3)} />
        </linearGradient>
      </defs>
      <rect x={-3000} y={-1500} width={6000} height={GROUND + 1500} fill="url(#csky)" />
      {cloud(-400, 60, 1)}
      {cloud(500, 20, 0.8)}
      {cloud(1600, 90, 1.1)}
      <path d={`M-3000,${GROUND - 60} Q-1500,${GROUND - 170} -400,${GROUND - 80} T1400,${GROUND - 90} T3000,${GROUND - 70} L3000,${GROUND} L-3000,${GROUND} Z`} fill={K.grassDeep} opacity={0.55} />
      <rect x={-3000} y={GROUND} width={6000} height={1400} fill={K.grass} />
      {/* the walk between the two buildings */}
      <path d={`M${-340 + shift},${GROUND + 6} C-120,${GROUND + 160} 120,${GROUND + 120} ${340 - shift},${GROUND + 6} L${340 - shift},${GROUND + 40} C120,${GROUND + 170} -120,${GROUND + 210} ${-340 + shift},${GROUND + 40} Z`} fill={K.path} stroke={INK} strokeWidth={4} />
      <Tree x={-60} y={GROUND + 10} s={1.05} />
      <Tree x={150} y={GROUND - 4} s={0.8} />
      <Tree x={-1000} y={GROUND} s={1.1} />
      <Tree x={1010} y={GROUND} s={1.0} />
      <g transform={`translate(${fmt(shift)} 0)`}>
        <Building id="ba" x={BA.x} y={BA.y} w={BA.w} h={BA.h} cols={3} rows={3} />
        <rect x={WIN_A.x - 16} y={WIN_A.y - 16} width={WW + 32} height={WH + 34} fill={shade(K.brick, 0.05)} />
      </g>
      <g transform={`translate(${fmt(-shift)} 0)`}>
        <Building id="bb" x={BB.x} y={BB.y} w={BB.w} h={BB.h} cols={3} rows={3} color="#B8775E" />
        <rect x={WIN_B.x - 16} y={WIN_B.y - 16} width={WW + 32} height={WH + 34} fill={shade('#B8775E', 0.05)} />
      </g>
      {/* the two lab windows are drawn above both buildings (they overlap while pushed together) */}
      <g transform={`translate(${fmt(shift)} 0)`}>
        <g transform={`translate(${WIN_A.x} ${WIN_A.y}) scale(${fmt(sc)})`}>
          <defs><clipPath id="wa"><rect x={0} y={0} width={PW} height={PH} /></clipPath></defs>
          <g clipPath="url(#wa)">{rao}</g>
          {glowA > 0 && <rect x={0} y={0} width={PW} height={PH} fill={K.saffron} opacity={0.35 * glowA} />}
        </g>
        <WindowFrame x={WIN_A.x} y={WIN_A.y} k={frameK} />
      </g>
      <g transform={`translate(${fmt(-shift)} 0)`}>
        <g transform={`translate(${WIN_B.x} ${WIN_B.y}) scale(${fmt(sc)})`}>
          <defs><clipPath id="wb"><rect x={0} y={0} width={PW} height={PH} /></clipPath></defs>
          <g clipPath="url(#wb)">{stocco}</g>
          {glowB > 0 && <rect x={0} y={0} width={PW} height={PH} fill={K.saffron} opacity={0.35 * glowB} />}
        </g>
        <WindowFrame x={WIN_B.x} y={WIN_B.y} k={frameK} />
      </g>
      {children}
    </g>
  );
};

/** small icons used for the "split one video game" beat (world units) */
const ScreenIcon: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <Monitor id="icmon" x={x} y={y} s={s}>
    <GameScreen t={t} events={[{kind: 'rocket', t0: t - 1.2, dur: 3.4}]} />
  </Monitor>
);

export const Hook: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const p = pr(f, T('across campus') - 0.15, T('across campus') + 2.6);
  const cam = campusCam(p);
  // emphasis: the left hand first, then the right finger
  const dimR = pr(f, T('Watch the hand') - 0.2, T('Watch the hand') + 0.25) * (1 - pr(f, T('The finger on the right') - 0.25, T('The finger on the right') + 0.15));
  const dimL = pr(f, T('The finger on the right') - 0.1, T('The finger on the right') + 0.3) * (1 - pr(f, T('across campus') - 0.5, T('across campus') + 0.1));
  // split game beat
  const ts = T('split one video game');
  const kIcon = pr(f, ts - 0.5, ts);
  const kSplit = pr(f, ts + 0.5, T('two buildings') + 0.2);
  const gone = pr(f, T('two buildings') + 0.1, T('two buildings') + 0.5);
  const glow = gone * (1 - pr(f, T('Rajesh Rao') - 0.6, T('Rajesh Rao') - 0.1));
  const shiftA = cam.shift, shiftB = -cam.shift;
  const target = (w: {x: number; y: number}, sh: number) => ({x: w.x + sh + WW / 2, y: w.y + WH / 2});
  const tA = target(WIN_A, shiftA), tB = target(WIN_B, shiftB);
  const mv = easeInOut(kSplit);
  const scrPos = {x: lerp(-40, tA.x, mv), y: lerp(430, tA.y + 40, mv)};
  const kbPos = {x: lerp(40, tB.x, mv), y: lerp(470, tB.y + 30, mv)};
  const iconS = lerp(0.36, 0.06, mv);
  return (
    <g>
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Campus
          f={f}
          shift={cam.shift}
          frameK={pr(f, T('across campus') + 0.1, T('across campus') + 1.0)}
          rao={<RaoPanel f={f} dim={dimL} />}
          stocco={<StoccoPanel f={f} dim={dimR} />}
          glowA={glow}
          glowB={glow}
        >
          <Tag x={0} y={150} text="University of Washington · 2013" size={40} k={pr(f, T('In 2013') - 0.1, T('In 2013') + 0.35) * (1 - pr(f, T('Rajesh Rao') - 0.6, T('Rajesh Rao') - 0.2))} />
          {kIcon > 0 && gone < 1 && (
            <g opacity={kIcon * (1 - gone)}>
              <ScreenIcon x={scrPos.x} y={scrPos.y} s={iconS} t={t} />
              <Keyboard id="ickb" x={kbPos.x} y={kbPos.y} s={iconS * 0.75} />
              {kSplit < 0.05 && <path d="M0,240 L0,500" stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={kIcon * 0.6} />}
            </g>
          )}
        </Campus>
      </Cam>
      <Tag x={40} y={52} anchor="start" size={26} text="Animated reconstruction" fill="#FFFFFF" k={pr(f, T('In 2013') + 0.3, T('In 2013') + 0.8) * (1 - pr(f, T('Rajesh Rao') - 0.6, T('Rajesh Rao') - 0.2))} />
    </g>
  );
};

/** sound cues for the mix (tools/export_cues.ts) */
export const CUES_S1 = (): {t: number; kind: string; gain?: number}[] => {
  const ev = hookEvents();
  const out: {t: number; kind: string; gain?: number}[] = [];
  strikeTimes().forEach((t) => out.push({t, kind: 'key_click'}));
  ev.forEach((e) => {
    if (e.t0 > -0.5) out.push({t: e.t0, kind: e.kind === 'plane' ? 'plane_pass' : 'rocket_launch', gain: e.kind === 'plane' ? -4 : -6});
    if (e.fire !== undefined) {
      out.push({t: e.fire, kind: 'cannon'});
      out.push({t: e.fire + 0.32, kind: 'boom'});
    }
  });
  out.push({t: T('across campus') - 0.1, kind: 'whoosh', gain: -4});
  out.push({t: T('In 2013') - 0.05, kind: 'pop', gain: -6});
  out.push({t: T('split one video game') + 0.5, kind: 'whoosh', gain: -8});
  out.push({t: T('two buildings') + 0.15, kind: 'tick', gain: -6});
  return out;
};
