// Test sheets for the guard and his coffee (src/art/guard.tsx, src/art/guardRig.tsx, src/art/cup.tsx).
//   cd source
//   npx remotion still src/test/guard.entry.tsx GuardSheet /tmp/claude-0/guard/sheet28.png --props='{"s":28}' --log=error
//   npx remotion still src/test/guard.entry.tsx GuardSheet /tmp/claude-0/guard/sheet60.png --props='{"s":60}' --log=error
//   npx remotion still src/test/guard.entry.tsx CupSheet /tmp/claude-0/guard/cups.png --log=error
//   npx remotion still src/test/guard.entry.tsx GuardFrame /tmp/claude-0/guard/f.png --props='{"act":"shock","s":28,"t":1.3}' --log=error
//   npx remotion still src/test/guard.entry.tsx GuardStrip /tmp/claude-0/guard/strip.png --props='{"s":40,"t0":0,"dt":0.2}' --log=error
//   npx remotion render src/test/guard.entry.tsx GuardAnim /tmp/claude-0/guard/anim.mp4 --log=error     (demo performance, 7 s)
// Each GuardSheet cell is a full 1080x1920 frame scaled to 1/3 (360x640: phone size).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {C} from '../art/palette';
import {resetIds, uid} from '../core/ids';
import {Guard, GuardAct, guardCupHand, guardFeet, GUARD_IDLE} from '../art/guard';
import {CoffeeCup, CoffeeSplash} from '../art/cup';
import {AlarmBeacon, AlarmWash, Bars, JailBack, JailFront} from '../art/jail';
import {Cam3, GUARD_AT, project} from '../world';

const ACTS: Record<string, GuardAct> = {
  idle: GUARD_IDLE,
  sip: {...GUARD_IDLE, sip: 1, look: -0.15},
  shock: {...GUARD_IDLE, shock: 1, drop: 1, holdCup: 0, look: -0.9},
  stare: {...GUARD_IDLE, stare: 1, holdCup: 0, look: -0.95},
  lookDown: {...GUARD_IDLE, lookDown: 1, holdCup: 0, look: -0.15, stare: 0.35},
  scratch: {...GUARD_IDLE, scratch: 1, holdCup: 0, look: -0.6},
  atCam: {...GUARD_IDLE, look: 0},
  right: {...GUARD_IDLE, look: 1},
  dropMid: {...GUARD_IDLE, shock: 0.5, drop: 1, holdCup: 0, look: -0.8},
};

const FLOOR_Y = 1500;
const Bg: React.FC<{floorY?: number}> = ({floorY = FLOOR_Y}) => {
  const wid = uid('gtWall'), fid = uid('gtFloor');
  return (
  <g>
    <defs>
      <linearGradient id={wid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.navy0} />
        <stop offset="1" stopColor={C.navy2} />
      </linearGradient>
      <linearGradient id={fid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.floorTile} />
        <stop offset="1" stopColor={C.floor} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill={`url(#${wid})`} />
    {/* bars of the cell at the left, out of focus in the corridor */}
    {[-60, 90, 240].map((x, i) => (
      <g key={i} opacity={0.55}>
        <rect x={x} y={0} width={52} height={floorY - 120} fill={C.steelDark} />
        <rect x={x + 8} y={0} width={10} height={floorY - 120} fill={C.steel} opacity={0.6} />
      </g>
    ))}
    <rect x={0} y={floorY - 160} width={1080} height={40} fill={C.wallMortar} />
    <rect x={0} y={floorY - 120} width={1080} height={1920 - floorY + 120} fill={`url(#${fid})`} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <line key={i} x1={0} y1={floorY - 120 + i * i * 22 + i * 18} x2={1080} y2={floorY - 120 + i * i * 22 + i * 18} stroke={C.navy1} strokeWidth={2} opacity={0.4} />
    ))}
  </g>
  );
};

const Frame: React.FC<{act: string; s: number; t: number; tag: string; fallCup?: boolean}> = ({act, s, t, tag, fallCup}) => {
  resetIds(`${tag}_`);
  const a = ACTS[act] ?? GUARD_IDLE;
  const big = s > 40;
  const x = big ? 600 : 620;
  const y = big ? 640 + 24 * s * 0.8 : FLOOR_Y;
  const feet = guardFeet(x, y, s);
  // the falling cup in the shock cell: launched from where the hand held it a moment ago
  const c0 = guardCupHand(x, y, s, {...GUARD_IDLE, look: -0.9}, t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <Bg floorY={big ? 2600 : FLOOR_Y} />
      <Guard x={x} y={y} s={s} t={t} act={a} />
      {fallCup && <CoffeeCup x={c0.x - 0.8 * s} y={c0.y + 4.2 * s} s={s} rot={-38} spill={0.55} />}
      {a.holdCup > 0 && (() => {
        const h = guardCupHand(x, y, s, a, t);
        return <circle cx={h.x} cy={h.y} r={4} fill="#FF2BD6" />;
      })()}
      {!big && (
        <g>
          <circle cx={feet.l.x} cy={feet.l.y} r={5} fill="#46E6FF" />
          <circle cx={feet.r.x} cy={feet.r.y} r={5} fill="#FFD84A" />
          <line x1={x - 20} y1={y} x2={x + 20} y2={y} stroke="#FF3B3B" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
};

export const GuardFrame: React.FC<{act: string; s: number; t?: number}> = ({act, s, t}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.navy0, overflow: 'hidden'}}>
      <Frame act={act} s={s} t={t ?? f / 30} tag="gf" fallCup={act === 'shock'} />
    </AbsoluteFill>
  );
};

const SHEET = ['idle', 'sip', 'shock', 'stare', 'lookDown', 'scratch', 'atCam', 'right', 'dropMid'];

export const GuardSheet: React.FC<{s: number; t?: number; cols?: number}> = ({s, t = 0.6, cols = 3}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHEET.map((name, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame act={name} s={s} t={t + i * 0.37} tag={`g${i}`} fallCup={name === 'shock'} />
          <div style={{position: 'absolute', left: 16, top: 12, color: '#FFD84A', font: '700 56px monospace', textShadow: '0 0 6px #000'}}>{name}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const CupSheet: React.FC = () => {
  resetIds('x_');
  const L = (x: number, y: number, s: string) => (
    <text x={x} y={y} fill={C.steelLit} fontSize={28} fontFamily="monospace" textAnchor="middle">
      {s}
    </text>
  );
  return (
    <AbsoluteFill style={{background: C.navy0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={C.navy1} />
        <rect y={1040} width={1080} height={880} fill={C.floor} />
        {/* falling cups with spill at three rotations (s = 60) and one in-hand size (s = 28) */}
        <CoffeeCup x={180} y={330} s={60} rot={0} steam={1} t={0.4} />
        <CoffeeCup x={430} y={360} s={60} rot={-35} spill={0.4} />
        <CoffeeCup x={690} y={380} s={60} rot={-95} spill={0.8} />
        <CoffeeCup x={930} y={400} s={60} rot={-160} spill={1} />
        <CoffeeCup x={180} y={640} s={28} rot={20} spill={0.6} />
        {L(180, 200, 'upright')}
        {L(430, 200, '-35 .4')}
        {L(690, 200, '-95 .8')}
        {L(930, 200, '-160 1')}
        {/* top-down splashes u = 0.2, 0.5, 1 (r = 150) */}
        <CoffeeSplash cx={190} cy={900} r={130} u={0.2} view={1} />
        <CoffeeSplash cx={540} cy={900} r={130} u={0.5} view={1} />
        <CoffeeSplash cx={890} cy={900} r={130} u={1} view={1} />
        {L(190, 1050, 'top u=.2')}
        {L(540, 1050, 'top u=.5')}
        {L(890, 1050, 'top u=1')}
        {/* side splashes */}
        <CoffeeSplash cx={190} cy={1330} r={130} u={0.2} view={0} />
        <CoffeeSplash cx={540} cy={1330} r={130} u={0.5} view={0} />
        <CoffeeSplash cx={890} cy={1330} r={130} u={1} view={0} cupLanded />
        {L(190, 1430, 'side u=.2')}
        {L(540, 1430, 'side u=.5')}
        {L(890, 1430, 'side u=1 cup')}
        {/* big top-down settled puddle (the match cut to the robot head) and a half view */}
        <CoffeeSplash cx={300} cy={1700} r={170} u={1} view={1} cupLanded />
        <CoffeeSplash cx={800} cy={1700} r={150} u={0.35} view={0.5} />
      </svg>
    </AbsoluteFill>
  );
};

/** a demo performance (how a shot might key the act): sip, look into the cell, the take + drop, frozen stare, slow
 *  look down, a puzzled scratch */
export const demoAct = (t: number): GuardAct => {
  const k = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const sm = (x: number) => x * x * (3 - 2 * x);
  const shock = sm(k(1.3, 1.42)) * (1 - sm(k(2.2, 2.9)));
  return {
    ...GUARD_IDLE,
    sip: sm(k(0.1, 0.5)) * (1 - sm(k(0.8, 1.15))),
    look: -0.35 - 0.6 * sm(k(1.0, 1.3)) + 0.75 * sm(k(4.0, 4.6)),
    shock,
    drop: sm(k(1.3, 1.36)) * (1 - sm(k(1.7, 2.2))),
    holdCup: 1 - k(1.33, 1.36),
    stare: sm(k(2.2, 2.9)) * (1 - sm(k(5.0, 5.4))),
    lookDown: sm(k(3.2, 4.2)) * (1 - sm(k(5.0, 5.4))),
    scratch: sm(k(5.0, 5.5)),
  };
};

export const GuardStrip: React.FC<{s: number; t0: number; dt: number}> = ({s, t0, dt}) => {
  const cols = 4;
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {Array.from({length: 16}, (_, i) => {
        const t = t0 + i * dt;
        const tag = `st${i}`;
        resetIds(`${tag}_`);
        const x = 600, y = 640 + 24 * s * 0.8;
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k * 0.5, width: 1080, height: 960, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <svg width={1080} height={960} viewBox="0 300 1080 960" style={{position: 'absolute', left: 0, top: 0}}>
              <Bg floorY={2600} />
              <Guard x={x} y={y} s={s} t={t} act={demoAct(t)} />
            </svg>
            <div style={{position: 'absolute', left: 16, top: 12, color: '#FFD84A', font: '700 56px monospace', textShadow: '0 0 6px #000'}}>{t.toFixed(2)}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** the demo performance as a clip (render with `npx remotion render ... GuardAnim out.mp4`) */
export const GuardAnim: React.FC<{s: number}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  resetIds('ga_');
  const x = 620, y = FLOOR_Y;
  const c0 = guardCupHand(x, y, s, demoAct(1.33), 1.33);
  const fall = t - 1.33;
  return (
    <AbsoluteFill style={{background: C.navy0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Bg />
        <Guard x={x} y={y} s={s} t={t} act={demoAct(t)} />
        {fall > 0 && c0.y + 0.5 * 110 * s * fall * fall < y - 0.8 * s && (
          <CoffeeCup x={c0.x - 2 * s * fall} y={c0.y + 0.5 * 110 * s * fall * fall} s={s} rot={c0.ang - 400 * fall} spill={Math.min(1, fall * 4)} />
        )}
        {fall > 0 && c0.y + 0.5 * 110 * s * fall * fall >= y - 0.8 * s && (() => {
          const tl = Math.sqrt((2 * (y - 0.8 * s - c0.y)) / (110 * s));
          return <CoffeeSplash cx={c0.x - 2 * s * tl} cy={y + 0.6 * s} r={3 * s} u={Math.min(1, (fall - tl) / 0.8)} view={0.15} cupLanded={fall - tl > 0.25} />;
        })()}
      </svg>
    </AbsoluteFill>
  );
};


/** the guard in the real set (jail.tsx), for judging integration / silhouette on the corridor */
const JCAMS: Record<string, Cam3> = {
  F: {x: 8, h: 9, d: -34, yaw: -8, pitch: 5, f: 1400},
  A: {x: 4, h: 9, d: -40, yaw: 0, pitch: 6, f: 1500},
  W: {x: 9, h: 13, d: -58, yaw: 2, pitch: 4, f: 1500},   // wide: the whole guard beside the cell
  K: {x: 16, h: 14, d: -42, yaw: 8, pitch: 7, f: 1300},
};
export const GuardInJail: React.FC<{cam: string; act: string; t: number; alarm?: number}> = ({cam, act, t, alarm = 1}) => {
  resetIds('gj_');
  const c = JCAMS[cam] ?? JCAMS.F;
  const g = project(c, GUARD_AT);
  return (
    <AbsoluteFill style={{background: C.navy0, overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <JailBack c={c} t={t} alarm={alarm} />
        <Bars c={c} t={t} door={0} alarm={alarm} />
        <AlarmBeacon c={c} t={t} alarm={alarm} />
        <Guard x={g.x} y={g.y} s={g.s} t={t} act={ACTS[act] ?? GUARD_IDLE} />
        <JailFront c={c} t={t} alarm={alarm} />
        <AlarmWash c={c} t={t} alarm={alarm} />
      </svg>
    </AbsoluteFill>
  );
};

/** the splash across views (side -> top-down) and times: the S1 -> S2 whip goes through the in-between views */
export const SplashSweep: React.FC = () => {
  resetIds('ss_');
  const views = [0, 0.25, 0.5, 0.75, 1];
  const us = [0.15, 0.35, 0.6, 1];
  return (
    <AbsoluteFill style={{background: C.floor}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {us.map((u, j) =>
          views.map((v, i) => <CoffeeSplash key={`${i}-${j}`} cx={110 + i * 215} cy={260 + j * 460} r={78} u={u} view={v} cupLanded={u > 0.5} />),
        )}
      </svg>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="GuardSheet" component={GuardSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{s: 28, t: 0.6, cols: 3}} />
    <Composition id="CupSheet" component={CupSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="GuardStrip" component={GuardStrip} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{s: 40, t0: 0, dt: 0.2}} />
    <Composition id="GuardAnim" component={GuardAnim} durationInFrames={210} fps={30} width={1080} height={1920} defaultProps={{s: 26}} />
    <Composition id="GuardInJail" component={GuardInJail} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cam: 'F', act: 'shock', t: 0.5, alarm: 1}} />
    <Composition id="SplashSweep" component={SplashSweep} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="GuardFrame" component={GuardFrame} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{act: 'idle', s: 28} as {act: string; s: number; t?: number}} />
  </>
);
registerRoot(Root);
