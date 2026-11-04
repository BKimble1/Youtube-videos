// S2. The setup and the game.
// From S1's campus wide shot the camera pushes into Rao's window and cuts inside: Rao (EEG cap) at a desk with only
// the game screen ("Rajesh Rao got the screen"). Cut to Stocco (swim cap, earbuds) at a desk with only a keyboard,
// in front of a bare wall ("Andrea Stocco got the space bar"). Pull back to the two labs as split-screen panels; on
// "Together" the screen and the keyboard slide out of their labs onto one ordinary desk, and an empty chair rolls in
// on "desk" (the joke is the hold). Push into that screen: the defend-the-city game. One playable decision: a supply
// plane flies the arc and lands safely ("Let it through"); a rocket launches along the same arc; CUT ON THE CLICK to
// Stocco's keyboard (his index strikes the space bar) and back on the click as the cannon fires and the rocket
// bursts. Pull back to the two labs: Stocco has no screen, Rao has no fire button; push in to end on Rao and his
// screen (S3 cuts to that screen).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, shade} from '../dc/color';
import {FPS, T, TE, pr, pulse} from '../lib/core';
import {GEvent} from '../art/game';
import {HandPoseP, SideHand} from '../art/hand';
import {Cam, Desk, INK, K, Keyboard, Monitor, Tag, monitorPt} from '../art/kit';
import {GameScreen} from '../art/game';
import {Campus, campusCam, RaoPanel, StoccoPanel, STOCCO_WRIST, tapPose, WIN_A} from './S1Hook';
import {CamS, camKeys, camLerp, Panel, RA, RAO_MON, RaoRoom, SB, STO_KB, StoccoRoom, toScreen, Z2} from '../art/s2rooms';

// ---------------------------------------------------------------- world layout (two rooms as panels: art/s2rooms)
const SPREAD = 300; // the panels part for the desk gag
/** the ordinary desk (world) */
const CD = {x0: -540, x1: 540, y: 822, d: 132, h: 270};
const C_MON = {x: -60, y: 702, s: RAO_MON.s};
const C_KB = {x: -60, y: 815, s: STO_KB.s};
const ZG = 1472 / (640 * RAO_MON.s); // game framing: the screen is 1472 px wide

// ---------------------------------------------------------------- timing
const tc = () => T('Shoot it down') + 0.07; // the fingertip lands on the space bar
const tFire = () => tc() + 0.03;
export const s2Events = (): GEvent[] => [
  {kind: 'plane', t0: T('supply plane') - 0.15, dur: 3.0},
  {kind: 'rocket', t0: T('launches a rocket'), dur: 3.4, fire: tFire()},
];
const tIn = () => T('Rajesh Rao got the screen') + 0.51; // cut inside Rao's lab (on "Rao")
const tSto = () => T('Andrea Stocco') - 0.3; // cut to Stocco
const tBack = () => T('Together') - 0.42; // pull back to the two labs
const tKB = () => tc() - 0.53; // cut to the keyboard
const tRet = () => tc() + 0.067; // cut back on the click
const tOut = () => T('Easy enough') - 0.05; // pull out of the game
const tEnd = () => T('himself') - 0.35; // push to Rao

const roomGameCam = (ox: number): CamS => {
  const c = monitorPt(ox + RAO_MON.x, RAO_MON.y, RAO_MON.s, 320, 200);
  return {x: c.x, y: c.y + 100 / ZG, z: ZG};
};
const centreGameCam = (): CamS => {
  const c = monitorPt(C_MON.x, C_MON.y, C_MON.s, 320, 200);
  return {x: c.x, y: c.y + 100 / ZG, z: ZG};
};

// ---------------------------------------------------------------- props
const OfficeChair: React.FC<{x: number; y: number; s: number; rock: number; spin: number}> = ({x, y, s, rock, spin}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rock)}) scale(${fmt(s)})`}>
    <ellipse cx={0} cy={4} rx={150} ry={16} fill={INK} opacity={0.14} />
    {/* star base: five legs (front view), casters turn while rolling */}
    {[-1, -0.45, 0.45, 1].map((u, i) => (
      <g key={i}>
        <path d={`M0,-40 L${u * 120},${-12 + Math.abs(u) * 4}`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <path d={`M0,-40 L${u * 120},${-12 + Math.abs(u) * 4}`} stroke="#4A4F57" strokeWidth={12} strokeLinecap="round" />
        <circle cx={u * 120} cy={-2} r={14} fill="#2D3238" stroke={INK} strokeWidth={4} />
        <path d={`M${u * 120},-2 l${fmt(Math.cos(spin + i) * 10)},${fmt(Math.sin(spin + i) * 10)}`} stroke="#8A929B" strokeWidth={3} />
      </g>
    ))}
    <rect x={-13} y={-170} width={26} height={136} rx={6} fill="#7E8B96" stroke={INK} strokeWidth={5} />
    {/* seat (seen from behind, slightly above) */}
    <ellipse cx={0} cy={-176} rx={130} ry={34} fill="#3E4A57" stroke={INK} strokeWidth={6} />
    <rect x={-16} y={-250} width={32} height={80} fill="#46525C" stroke={INK} strokeWidth={5} />
    {/* backrest */}
    <rect x={-112} y={-420} width={224} height={200} rx={48} fill="#4A5866" stroke={INK} strokeWidth={6} />
    <rect x={-86} y={-400} width={172} height={36} rx={16} fill={lit('#4A5866', 0.2)} opacity={0.7} />
  </g>
);

/** The ordinary desk (top, apron, a drawer pedestal on the left, a leg on the right, open knee space);
 *  `solid` 0 = a dashed idea of a desk, 1 = a real desk */
const CentreDesk: React.FC<{k: number; solid: number}> = ({k, solid}) => {
  if (k <= 0.001) return null;
  const {x0, x1, y, d, h} = CD;
  const ap = 44; // apron
  const fl = y + h; // floor
  const ped = {x0: x0 + 20, x1: x0 + 330};
  const leg = {x0: x1 - 60, x1: x1 - 20};
  return (
    <g opacity={k}>
      {solid < 1 && (
        <g opacity={1 - solid} fill="#FFFFFF" fillOpacity={0.3} stroke={INK} strokeWidth={8} strokeDasharray="26 18" strokeLinejoin="round">
          <path d={`M${x0 + 30},${y - d} L${x1 - 30},${y - d} L${x1},${y} L${x1},${y + ap} L${x0},${y + ap} L${x0},${y} Z`} />
          <rect x={ped.x0} y={y + ap} width={ped.x1 - ped.x0} height={fl - y - ap} />
          <rect x={leg.x0} y={y + ap} width={leg.x1 - leg.x0} height={fl - y - ap} />
        </g>
      )}
      {solid > 0 && (
        <g opacity={solid}>
          <ellipse cx={0} cy={fl + 6} rx={(x1 - x0) * 0.56} ry={20} fill={INK} opacity={0.12} />
          {/* knee space: the modesty panel in shadow */}
          <rect x={ped.x1} y={y + ap} width={leg.x0 - ped.x1} height={(fl - y - ap) * 0.62} fill={shade(K.desk, 0.42)} stroke={INK} strokeWidth={5} />
          <Desk id="s2cdesk" x0={x0} x1={x1} y={y} d={d} h={ap} />
          <rect x={ped.x0} y={y + ap} width={ped.x1 - ped.x0} height={fl - y - ap} fill={shade(K.desk, 0.06)} stroke={INK} strokeWidth={6} />
          {[0, 1, 2].map((i) => {
            const hh = (fl - y - ap - 40) / 3;
            const yy = y + ap + 14 + i * (hh + 6);
            return (
              <g key={i}>
                <rect x={ped.x0 + 18} y={yy} width={ped.x1 - ped.x0 - 36} height={hh} rx={8} fill={lit(K.desk, 0.08)} stroke={INK} strokeWidth={4} />
                <rect x={(ped.x0 + ped.x1) / 2 - 40} y={yy + hh / 2 - 6} width={80} height={12} rx={6} fill={K.deskDeep} />
              </g>
            );
          })}
          <rect x={leg.x0} y={y + ap} width={leg.x1 - leg.x0} height={fl - y - ap} fill={shade(K.desk, 0.1)} stroke={INK} strokeWidth={6} />
        </g>
      )}
    </g>
  );
};

/** Stocco's keyboard close-up for the cut on the click (built from S1's StoccoPanel parts at a larger scale) */
const KB0 = {x: 430, y: 862, s: 1.45};
const KeyCloseUp: React.FC<{f: number; taps: number[]}> = ({f, taps}) => {
  const t = f / FPS;
  const pose: HandPoseP = tapPose(t, taps);
  const press = Math.max(0, ...taps.map((c) => (t >= c && t < c + 0.12 ? 1 - (t - c) / 0.12 : 0)));
  const S = 1.38, X = 660 - KB0.x * S, Y = 790 - KB0.y * S;
  const wall = K.stoccoWall, top = '#D9A773';
  return (
    <g>
      <defs>
        <linearGradient id="s2cu-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(wall, 0.2)} />
          <stop offset="1" stopColor={wall} />
        </linearGradient>
        <linearGradient id="s2cu-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(top, 0.12)} />
          <stop offset="1" stopColor={lit(top, 0.1)} />
        </linearGradient>
      </defs>
      <g transform={`translate(${fmt(X)} ${fmt(Y)}) scale(${S})`}>
        <rect x={-600} y={0} width={2400} height={480} fill="url(#s2cu-wall)" />
        <rect x={-600} y={440} width={2400} height={28} fill={K.stoccoWallDeep} />
        <path d={`M-600,480 L1800,480 L1800,1080 L-600,1080 Z`} fill="url(#s2cu-top)" stroke={INK} strokeWidth={6} />
        <path d="M-600,480 L1800,480" stroke={lit(top, 0.35)} strokeWidth={8} />
        <Keyboard id="s2cukb" x={KB0.x} y={KB0.y} s={KB0.s} spaceDown={press} />
        <SideHand id="s2cuh" x={STOCCO_WRIST.x} y={STOCCO_WRIST.y} s={1.72} dir={-1} side="thumb" pose={pose} skin={K.stoccoSkin} sleeve={K.stoccoSleeve} arm={560} armAng={-8} />
        {taps.map((c, i) => {
          const k = (t - c) / 0.35;
          if (k < 0 || k > 1) return null;
          return (
            <g key={i} opacity={1 - k} stroke={K.saffron} strokeWidth={8} strokeLinecap="round">
              <path d={`M${KB0.x - 150},${KB0.y - 40 - 40 * k} l-30,-24`} />
              <path d={`M${KB0.x + 150},${KB0.y - 40 - 40 * k} l30,-24`} />
              <path d={`M${KB0.x},${KB0.y - 70 - 46 * k} l0,-30`} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the sequence
export const S2: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const ev = s2Events();

  // ---- A: the campus, then the push into Rao's window (first frame = S1's last)
  if (t < tIn()) {
    const c0 = campusCam(1);
    const tA = T('Rajesh Rao got the screen') - 0.35;
    const k = easeIn(clamp((t - tA) / (tIn() - tA)));
    const target = {x: WIN_A.x + 53, y: WIN_A.y + 60, z: 7.5};
    const cam = camLerp({x: c0.x, y: c0.y, z: c0.z}, target, k);
    const glow = 1 - pr(f, T('Rajesh Rao') - 0.6, T('Rajesh Rao') - 0.1);
    const tagK = pr(f, T('In 2013') - 0.1, T('In 2013') + 0.35) * (1 - pr(f, T('Rajesh Rao') - 0.6, T('Rajesh Rao') - 0.2));
    return (
      <g>
        <Cam x={cam.x} y={cam.y} z={cam.z}>
          <Campus f={f} shift={c0.shift} frameK={1} rao={<RaoPanel f={f} />} stocco={<StoccoPanel f={f} />} glowA={glow} glowB={glow}>
            <Tag x={0} y={150} text="University of Washington · 2013" size={40} k={tagK} />
          </Campus>
        </Cam>
        <Tag x={40} y={52} anchor="start" size={26} text="Animated reconstruction" fill="#FFFFFF" k={pr(f, T('In 2013') + 0.3, T('In 2013') + 0.8) * (1 - pr(f, T('Rajesh Rao') - 0.6, T('Rajesh Rao') - 0.2))} />
      </g>
    );
  }

  // ---- D: the cut on the click: Stocco's keyboard
  if (t >= tKB() && t < tRet()) {
    return <KeyCloseUp f={f} taps={[tc()]} />;
  }

  // ---- the two labs world (B, C, E)
  const gag = t >= tBack() && t < tKB();
  const cam: CamS = (() => {
    if (t < tSto()) return camKeys(t, [[tIn(), {x: RA.x + 960, y: 540, z: 1.1}], [tSto(), {x: RA.x + 960, y: 540, z: 1.0}]]);
    if (t < tKB())
      return camKeys(t, [
        [tSto(), {x: SB.x + 960, y: 540, z: 1.0}],
        [tBack(), {x: SB.x + 960, y: 540, z: 1.035}],
        [tBack() + 1.05, {x: 0, y: 540, z: Z2}],
        [T('you normally') - 0.1, {x: 0, y: 540, z: Z2}],
        [T('sitting down') + 0.1, {x: 20, y: 650, z: 0.84}],
        [T('Rao’s job') + 0.05, {x: 20, y: 650, z: 0.86}],
        [T('defend') + 0.15, centreGameCam()],
        [tKB(), {...centreGameCam(), z: ZG * 1.025}],
      ]);
    const g = roomGameCam(RA.x);
    return camKeys(t, [
      [tRet(), {...g, z: ZG * 1.03}],
      [tOut(), {...g, z: ZG * 1.045}],
      [T('except') + 0.05, {x: 0, y: 540, z: Z2}],
      [tEnd(), {x: 0, y: 540, z: Z2 * 1.012}],
      [T('himself') + 0.95, {x: RA.x + 960, y: 540, z: 1.05}],
    ]);
  })();

  // ---- gag state
  const tEq = T('the equipment');
  const spread = gag ? SPREAD * pr(f, tBack() + 1.0, tBack() + 1.7) + 1100 * pr(f, T('normally') - 0.05, T('sitting') + 0.2) : 0;
  const ringK = gag ? pulse(f, tEq - 0.05, tEq + 0.2, T('normally') - 0.1, T('normally') + 0.2) : 0;
  const mT0 = T('normally') - 0.1, mT1 = T('sitting') + 0.05;
  const kT0 = T('normally') + 0.05, kT1 = T('down at a desk') - 0.02;
  const mk = gag ? clamp((t - mT0) / (mT1 - mT0)) : 0;
  const kk = gag ? clamp((t - kT0) / (kT1 - kT0)) : 0;
  const monAway = gag && t >= mT0;
  const kbAway = gag && t >= kT0;
  const handOff = gag ? pr(f, mT0 - 0.35, mT0 + 0.05) : 0;
  const deskK = gag ? pr(f, tBack() + 1.0, tBack() + 1.5) : 0;
  const deskSolid = gag ? pr(f, mT1 - 0.15, mT1 + 0.2) : 0;
  const tChair = T('desk') + 0.06; // the chair stops on "desk"
  const chairK = gag ? clamp((t - (tChair - 0.75)) / 0.75) : 0;
  const chairX = lerp(1500, 250, easeOut(chairK));
  const chairRock = gag && t > tChair - 0.05 ? Math.sin((t - tChair + 0.05) * 16) * 3.2 * Math.exp(-(t - tChair) * 4.5) : 0;
  const roomDim = gag ? pr(f, mT0 - 0.1, mT0 + 0.5) * 0.85 : 0;

  // ---- beat 6 overlays (split world after the game)
  const late = t >= tRet();
  const ringRao = late ? pulse(f, T('the only person') - 0.05, T('the only person') + 0.3, T('had no way') - 0.1, T('had no way') + 0.3) : 0;
  const ghostSto = late ? pr(f, T('see the difference') + 0.1, T('see the difference') + 0.45) : 0;
  const ghostRao = late ? pr(f, T('no way to press') - 0.05, T('no way to press') + 0.3) : 0;
  const stoDim = late ? pr(f, T('the only person') - 0.1, T('the only person') + 0.3) * (1 - pr(f, T('see the difference') + 0.05, T('see the difference') + 0.35)) * 0.8 : 0;
  const raoLookDown = late ? pulse(f, T('press fire') - 0.15, T('press fire') + 0.15, T('himself') + 0.3, T('himself') + 0.7) : 0;

  // Rao's acting
  const raoFace = {
    lookX: lerp(0.85, 0.05, raoLookDown) + (gag ? 0.15 * mk : 0),
    lookY: lerp(0.15, 0.9, raoLookDown),
    mouth: (raoLookDown > 0.5 ? 'hmm' : 'smile') as 'hmm' | 'smile',
    brows: raoLookDown * 0.4,
  };
  const spaceGlow = pulse(f, T('space bar') - 0.05, T('space bar') + 0.2, TE('space bar') + 0.25, TE('space bar') + 0.6);
  const screenRing = t < tSto() ? pulse(f, T('screen') - 0.05, T('screen') + 0.2, TE('screen') + 0.15, TE('screen') + 0.45) : 0;

  // moving props (world)
  const monStart = {x: RA.x - spread + RAO_MON.x, y: RAO_MON.y};
  const kbStart = {x: SB.x + spread + STO_KB.x, y: STO_KB.y};
  const em = easeInOut(mk), ek = easeInOut(kk);
  const monPos = {x: lerp(monStart.x, C_MON.x, em), y: lerp(monStart.y, C_MON.y, em) - Math.sin(Math.PI * em) * 70};
  const kbPos = {x: lerp(kbStart.x, C_KB.x, ek), y: lerp(kbStart.y, C_KB.y, ek) - Math.sin(Math.PI * ek) * 60};

  const raoRoom = (
    <RaoRoom f={f} events={ev} prop={!monAway} ring={Math.max(ringK, ringRao, screenRing)} ghost={ghostRao} face={raoFace} dim={roomDim} />
  );
  const stoRoom = (
    <StoccoRoom f={f} prop={!kbAway} ring={ringK} ghost={ghostSto} space={spaceGlow} handOff={handOff} dim={Math.max(roomDim, stoDim)} />
  );

  // screen-space labels
  const tagRao = toScreen(cam, RA.x + 760, 180);
  const tagSto = toScreen(cam, SB.x + 860, 180);
  const kRao = t < tSto() ? pr(f, tIn() + 0.1, tIn() + 0.4) : 0;
  const kSto = t >= tSto() && t < tBack() + 0.3 ? pr(f, tSto() + 0.15, tSto() + 0.45) * (1 - pr(f, tBack() - 0.05, tBack() + 0.25)) : 0;
  const gs = toScreen(cam, SB.x + 1300, 525);
  const gr = toScreen(cam, RA.x + 760, 840);
  const tagScale = Math.min(1, 0.75 + cam.z * 0.25);
  // game labels (screen space, from the centre monitor while the game is on it)
  const inGame = gag && t >= T('defend') - 0.2;
  const gpt = (u: number, v: number) => {
    const w = monitorPt(C_MON.x, C_MON.y, C_MON.s, u, v);
    return toScreen(cam, w.x, w.y);
  };
  const cityK = inGame ? pulse(f, T('little city') - 0.05, T('little city') + 0.25, T('supply plane') - 0.6, T('supply plane') - 0.3) : 0;
  const cityP = gpt(520, 205);
  const planeE = ev[0];
  const planeU = clamp((t - planeE.t0) / planeE.dur);
  const pp = (() => {
    const P0 = {x: 128, y: 300}, P1 = {x: 340, y: -60}, P2 = {x: 560, y: 300};
    const u = planeU;
    return {x: (1 - u) * (1 - u) * P0.x + 2 * u * (1 - u) * P1.x + u * u * P2.x, y: (1 - u) * (1 - u) * P0.y + 2 * u * (1 - u) * P1.y + u * u * P2.y};
  })();
  const planeTagK = inGame ? pulse(f, T('supply plane') - 0.05, T('supply plane') + 0.25, T('Let it through') + 0.2, T('Let it through') + 0.5) : 0;
  const planeTag = gpt(pp.x, pp.y + 70);
  const okK = inGame ? pulse(f, planeE.t0 + planeE.dur - 0.02, planeE.t0 + planeE.dur + 0.2, T('A pirate') + 0.4, T('A pirate') + 0.7) : 0;
  const okP = gpt(560, 228);
  const rocketTagK = inGame ? pulse(f, T('launches') + 0.15, T('launches') + 0.4, tKB() - 0.01, tKB()) : 0;
  const rk = ev[1];
  const ru = clamp((t - rk.t0) / rk.dur);
  const rp = {x: (1 - ru) * (1 - ru) * 128 + 2 * ru * (1 - ru) * 340 + ru * ru * 560, y: (1 - ru) * (1 - ru) * 300 + 2 * ru * (1 - ru) * -60 + ru * ru * 300};
  const rocketTag = gpt(rp.x + 10, rp.y + 62);

  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Panel id="s2pa" ox={RA.x - spread} oy={RA.y}>{raoRoom}</Panel>
        <Panel id="s2pb" ox={SB.x + spread} oy={SB.y}>{stoRoom}</Panel>
        {gag && (
          <g>
            <CentreDesk k={deskK} solid={deskSolid} />
            {/* the screen and the keyboard slide in from their labs */}
            {monAway && (
              <Monitor id="s2cmon" x={monPos.x} y={monPos.y} s={C_MON.s}>
                <GameScreen t={t} events={ev} />
              </Monitor>
            )}
            {kbAway && <Keyboard id="s2ckb" x={kbPos.x} y={kbPos.y} s={C_KB.s} />}
            {chairK > 0 && <OfficeChair x={chairX} y={CD.y + CD.h + 22} s={0.92} rock={chairRock} spin={chairX / 30} />}
          </g>
        )}
      </Cam>
      {/* labels (screen space) */}
      <Tag x={tagRao.x - 40} y={Math.max(120, tagRao.y - 30)} text="Rajesh Rao" size={44} k={kRao} />
      <Tag x={tagSto.x + 40} y={Math.max(120, tagSto.y - 30)} text="Andrea Stocco" size={44} k={kSto} />
      <Tag x={cityP.x} y={cityP.y} text="the city" size={40} k={cityK} />
      <Tag x={planeTag.x} y={planeTag.y} text="supply plane" size={40} k={planeTagK} fill="#E3F4EC" />
      {okK > 0 && (
        <g transform={`translate(${fmt(okP.x)} ${fmt(okP.y)}) scale(${fmt(0.7 + 0.3 * okK)})`} opacity={okK}>
          <circle r={40} fill={K.green} stroke={INK} strokeWidth={6} />
          <path d="M-18,0 L-5,14 L20,-14" fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      <Tag x={rocketTag.x} y={rocketTag.y} text="pirate rocket" size={40} k={rocketTagK} fill="#FBE0DA" />
      <Tag x={gs.x} y={gs.y} text="No screen" size={44 * tagScale} k={ghostSto} />
      <Tag x={gr.x} y={Math.min(860, gr.y)} text="No fire button" size={44 * tagScale} k={ghostRao} />
    </g>
  );
};

/** sound cues for the mix (gain in dB, as in S1) */
export const CUES_S2 = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const ev = s2Events();
  const plane = ev[0];
  const tChair = T('desk') + 0.06;
  return [
    {t: T('Rajesh Rao got the screen') - 0.3, kind: 'whoosh', gain: -6, dur: 0.85},
    {t: tIn() + 0.12, kind: 'pop', gain: -7},
    {t: tSto() + 0.17, kind: 'pop', gain: -7},
    {t: T('space bar') + 0.02, kind: 'tick', gain: -7},
    {t: tBack(), kind: 'whoosh', gain: -8, dur: 1.0},
    {t: T('the equipment'), kind: 'pop', gain: -8},
    {t: T('normally') - 0.1, kind: 'whoosh', gain: -7, dur: 1.2},
    {t: T('sitting') + 0.05, kind: 'tick', gain: -6},
    {t: T('down at a desk') - 0.02, kind: 'tick', gain: -6},
    {t: tChair, kind: 'tick', gain: -4},
    {t: T('Rao’s job') + 0.1, kind: 'whoosh', gain: -7, dur: 1.0},
    {t: plane.t0, kind: 'plane_pass', gain: -4, dur: plane.dur},
    {t: plane.t0 + plane.dur, kind: 'pop', gain: -6},
    {t: T('launches a rocket'), kind: 'rocket_launch', gain: -6},
    {t: tc(), kind: 'key_click', gain: 0},
    {t: tFire(), kind: 'cannon', gain: 0},
    {t: tFire() + 0.32, kind: 'boom', gain: 0},
    {t: tOut() + 0.05, kind: 'whoosh', gain: -8, dur: 1.1},
    {t: T('see the difference') + 0.1, kind: 'pop', gain: -7},
    {t: T('no way to press') - 0.05, kind: 'pop', gain: -7},
    {t: T('himself') - 0.3, kind: 'whoosh', gain: -10, dur: 1.2},
  ];
};
