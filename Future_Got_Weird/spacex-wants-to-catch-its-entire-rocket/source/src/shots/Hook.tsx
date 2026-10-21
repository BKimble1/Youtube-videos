// 0:00–0:28 Hook. Frame zero: tracking close beside the descending ship's nose, engines lit below; pull back to reveal
// the tower and arms; cut to the closing gap at the catch point and freeze before contact ("hasn't happened yet");
// match-cut to the real (2024) booster catch, illustrated; tilt to the sky where the ship is coming back; the split.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, Earth, Frame, Sky, Stars, World} from '../assets/env';
import {Booster, Ship, shipCatchX} from '../assets/vehicles';
import {VEH_X} from '../assets/tower';
import {BoosterCatch, CATCH_Y, ShipCatch, CatchState, shipPinWorld} from '../kit/catch';
import {clamp, ep, keys, lerp, le, ls, noise, prog, smoother, wt} from '../kit/anim';
import {BigText, C, Callout, Chip, Disclose, FONT, Mark} from '../kit/ui';
import {Shot} from '../kit/timeline';

// ---- one continuous ship approach shared by H1 and H2 (gap freezes at TF) ----
const TF = () => wt('h2', 'yet') + 0.25;
const shipState = (t: number): CatchState => {
  const tf = TF();
  const u = clamp(t / tf);
  return {
    gap: 1.0 + 41 * Math.pow(1 - u, 2.1),
    dx: 2.6 * Math.pow(1 - u, 2) * Math.cos(t * 0.9),
    tilt: 1.6 * Math.pow(1 - u, 2) * Math.sin(t * 1.1 + 0.4),
    open: keys(t, [[0, 40], [4.5, 32], [7.2, 12], [tf, 8]]),
    engines: 0.9,
    plumeLen: 34,
  };
};

const H1: React.FC<{t: number}> = ({t}) => {
  const s = shipState(t);
  const pin = shipPinWorld(s);
  // frame 0: low, tracking beside the whole descending ship (flame, flaps, open arms); then push toward the catch point
  const wide: Cam = {x: pin.x - 13, y: pin.y + 30 + 0.4 * noise(t, 1), z: 10.5 + t * 0.4, rot: -3 + t * 0.25};
  const close: Cam = {x: pin.x - 2, y: CATCH_Y - 6, z: 24, rot: 0};
  const k = ep(t, 3.6, 7.0);
  const cam: Cam = {x: lerp(wide.x, close.x, k), y: lerp(wide.y, close.y, k), z: Math.exp(lerp(Math.log(wide.z), Math.log(close.z), k)), rot: lerp(wide.rot!, close.rot!, k)};
  return (
    <Frame>
      <ShipCatch t={t} cam={cam} light="dusk" s={s} flapTrim={0.5 * noise(t * 0.8, 2)} />
      <Disclose t={t} a={0.0} b={99} />
    </Frame>
  );
};

const H2: React.FC<{t: number}> = ({t}) => {
  const tf = TF();
  const frozen = t >= tf;
  const tt = Math.min(t, tf);
  const s = shipState(tt);
  const pin = shipPinWorld(s);
  const cam: Cam = {x: pin.x + 1.5, y: CATCH_Y - 3.2 + (t - ls('h2')) * -0.05, z: 46 + (t - ls('h2')) * 1.4};
  const fz = ep(t, tf, tf + 0.35);
  // screen coordinates of the pin and the rail for the measurement mark
  const sx = (x: number) => 960 + (x - cam.x) * cam.z, sy = (y: number) => 540 + (y - cam.y) * cam.z;
  const gapTop = sy(pin.y), gapBot = sy(CATCH_Y - 0.45);
  return (
    <AbsoluteFill style={{filter: `saturate(${1 - 0.55 * fz}) contrast(${1 + 0.06 * fz})`}}>
      <Frame>
        <ShipCatch t={tt} cam={cam} light="dusk" s={s} catchPts={1} clouds={false} />
        {frozen ? (
          <g opacity={fz}>
            <line x1={sx(pin.x) + 70} x2={sx(pin.x) + 70} y1={gapTop + 4} y2={gapBot - 4} stroke={C.yellow} strokeWidth={5} strokeDasharray="12 8" />
            <path d={`M${sx(pin.x) + 58} ${gapTop + 16} L${sx(pin.x) + 70} ${gapTop + 2} L${sx(pin.x) + 82} ${gapTop + 16} M${sx(pin.x) + 58} ${gapBot - 16} L${sx(pin.x) + 70} ${gapBot - 2} L${sx(pin.x) + 82} ${gapBot - 16}`} stroke={C.yellow} strokeWidth={5} fill="none" />
          </g>
        ) : null}
        <Callout text="NOT YET ATTEMPTED" sub="SpaceX says Flight 15 will try it" x={1180} y={210} o={ep(t, wt('h2', 'hasnt') - 0.1, wt('h2', 'hasnt') + 0.4)} size={40} />
        <Callout text="catch point" sub="approximate position" x={420} y={330} to={[sx(pin.x) - 30, sy(pin.y)]} o={ep(t, ls('h2') + 0.3, ls('h2') + 0.8) * (1 - ep(t, wt('h2', 'hasnt') - 0.3, wt('h2', 'hasnt')))} size={28} />
        <Disclose t={t} a={ls('h2') - 1} b={99} />
      </Frame>
    </AbsoluteFill>
  );
};

/** Flight 5 (13 Oct 2024, morning): the first booster catch, earlier-generation booster (4 grid fins, separate pins). */
const H3: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('h3');
  const u = t - t0;
  const settle = 1.4;
  const s: CatchState = {gap: Math.max(0, 3.0 * Math.pow(1 - clamp(u / settle), 2)), open: keys(u, [[0, 9], [settle, 4]]), engines: u < settle ? 0.8 : Math.max(0, 0.8 - (u - settle) * 3), plumeLen: 6};
  const rail = -80;
  const close: Cam = {x: VEH_X + 3, y: rail - 2, z: 30};
  const wide: Cam = {x: VEH_X - 6, y: -58, z: 8.2};
  const k = ep(u, 1.2, 4.6);
  const cam: Cam = {x: lerp(close.x, wide.x, k), y: lerp(close.y, wide.y, k), z: Math.exp(lerp(Math.log(close.z), Math.log(wide.z), k))};
  return (
    <Frame>
      <BoosterCatch t={t} cam={cam} light="day" s={s} version="v1" carY={rail} />
      <Chip text="FLIGHT 5 · OCT 13, 2024 · FIRST BOOSTER CATCH" sub="Illustrated reconstruction · earlier booster: four grid fins, separate catch pins" x={44} y={1036} o={ep(t, t0 + 0.2, t0 + 0.6)} accent={C.teal} />
      <Mark x={1720} y={170} ok o={ep(t, wt('h3', 'more') - 0.1, wt('h3', 'more') + 0.3)} s={44} />
      <Callout text="DONE" sub="booster caught · several times" x={1530} y={240} o={ep(t, wt('h3', 'more'), wt('h3', 'more') + 0.4)} size={34} />
    </Frame>
  );
};

/** Tilt up: the ship as a glowing streak, coming back from orbit. */
const H4: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('h4');
  const u = t - t0;
  const p = clamp(u / (ls('h5') - t0 + 0.6));
  const x = lerp(-200, 1400, p), y = lerp(240, 600, p);
  const ang = (Math.atan2(620 - 260, 1500 + 120) * 180) / Math.PI;
  return (
    <Frame>
      <Sky kind="high" />
      <Stars o={0.9} t={t} n={180} dy={u * 6} />
      <Earth cx={960} cy={2350} r={1550} rot={-10 + u * 0.4} />
      <g transform={`translate(${x} ${y}) rotate(${ang})`}>
        {/* trail */}
        <path d="M0 -9 C -260 -14, -600 -6, -900 0 C -600 6, -260 14, 0 9 Z" fill="url(#plumeOuter)" opacity={0.65} transform="rotate(180) scale(-1 1)" />
        <ellipse cx={-180} cy={0} rx={260} ry={22} fill="url(#glowPlasma)" opacity={0.9} />
        <ellipse cx={60} cy={30} rx={150} ry={60} fill="url(#glowPlasma)" />
        <g transform="scale(3.4) rotate(-12) rotate(90) scale(-1 1)">
          <Ship t={t} view="profile" heat={0.9} fwdFlap={0.7} aftFlap={0.7} />
        </g>
      </g>
      <Callout text="THE SHIP" sub="coming back from orbit" x={x + 40} y={y - 210} to={[x - 10, y - 40]} o={ep(u, 1.2, 1.8)} size={34} />
      <Chip text="ILLUSTRATION — PLANNED FLIGHT 15 RETURN" x={44} y={1036} accent={C.yellow} o={ep(u, 0.2, 0.5)} />
    </Frame>
  );
};

/** Split: done vs never done, then the title. */
const H5: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('h5');
  const u = t - t0;
  const split = ep(u, 0, 0.5);
  const W = 960 * split;
  const camL: Cam = {x: VEH_X - 2, y: -62, z: 7.2 + u * 0.12};
  const camR: Cam = {x: VEH_X - 2, y: -98, z: 7.2 + u * 0.12};
  const sS: CatchState = {gap: 9 - u * 1.2, open: 14, engines: 0.9, plumeLen: 30};
  const ttl = ep(t, wt('h5', 'different') - 0.2, wt('h5', 'different') + 0.25);
  return (
    <Frame>
      <defs>
        <clipPath id="h5L"><rect x={0} y={0} width={1920 - W} height={1080} /></clipPath>
        <clipPath id="h5R"><rect x={1920 - W} y={0} width={W} height={1080} /></clipPath>
      </defs>
      <g clipPath="url(#h5L)">
        <g transform={`translate(${-480 * split} 0)`}>
          <svg x={0} y={0} width={1920} height={1080} overflow="visible"><BoosterCatch t={t} cam={camL} light="day" s={{gap: 0, open: 4}} version="v3" carY={-80} /></svg>
        </g>
      </g>
      <g clipPath="url(#h5R)">
        <g transform={`translate(${480 + 480 * (1 - split)} 0)`}>
          <svg x={0} y={0} width={1920} height={1080} overflow="visible"><ShipCatch t={t} cam={camR} light="dusk" s={sS} /></svg>
        </g>
      </g>
      <rect x={957} y={0} width={6} height={1080} fill={C.ink} opacity={split} />
      <Chip text="BOOSTER · CAUGHT SINCE 2024" x={60} y={70} anchor="tl" o={ep(u, 0.4, 0.8)} accent={C.teal} size={22} />
      <Chip text="SHIP · NEVER CAUGHT" x={1860} y={70} anchor="tr" o={ep(u, 0.6, 1.0)} accent={C.yellow} size={22} />
      <rect x={0} y={0} width={1920} height={1080} fill="#05070a" opacity={0.45 * ttl} />
      <BigText text="SPACEX WANTS TO CATCH" x={960} y={500} size={96} o={ttl} />
      <BigText text="ITS ENTIRE ROCKET" x={960} y={630} size={124} fill={C.yellow} o={ttl} />
      <Chip text="ILLUSTRATIONS" x={44} y={1036} o={split} />
    </Frame>
  );
};

export const hookShots = (): Shot[] => [
  {id: 'H1', a: 0, b: ls('h2'), render: (t) => <H1 t={t} />},
  {id: 'H2', a: ls('h2'), b: ls('h3') - 0.15, render: (t) => <H2 t={t} />},
  {id: 'H3', a: ls('h3') - 0.15, b: ls('h4'), render: (t) => <H3 t={t} />, tin: 'flash'},
  {id: 'H4', a: ls('h4'), b: ls('h5'), render: (t) => <H4 t={t} />, tin: 'whipU'},
  {id: 'H5', a: ls('h5'), b: ls('a1'), render: (t) => <H5 t={t} />, tin: 'cut'},
];
void Booster; void Ship; void shipCatchX; void smoother; void prog; void le; void FONT;
