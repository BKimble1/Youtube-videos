// V4 "What actually catches it" (S2) and "Coming back from orbit" (S3).
// Catch mechanism: real powered deceleration → contact at the rails → the load entering the receiving surface →
// clearance (no squeeze) → the shelf analogy, whose shelves become the actual rails mid-sentence → the rocket, moving
// shelves and engine "crane" revealed in one pull-back → motion brought under control. No action-repeating captions.
// Reentry: one orbital move to belly-first → real plasma → windward tiles → the flap answering the flow.
import React from 'react';
import {ep, prog, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, V3, proj} from '../cam3';
import {ArmState, CAR_DEFAULT, VX, RAIL_DY, ARM_Z} from '../site';
import {Ship, R} from '../vehicles';
import {Credit, Frame, Limb, Sky, Tag, Word} from '../scene';
import {F5, F14R, Footage, Shot} from '../timeline';
import {CatchView, InFlight, BoosterAt, Streaks, approach, throttle} from './common';
import {ls, wt} from '../time';
import {C} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = CAR_DEFAULT;

/** Arrow (screen px) for forces / speed. */
export const Arrow: React.FC<{x: number; y: number; dx: number; dy: number; color?: string; w?: number; o?: number}> = ({x, y, dx, dy, color = C.yellow, w = 10, o = 1}) => {
  const L = Math.hypot(dx, dy);
  if (L < 4 || o <= 0.01) return null;
  const ux = dx / L, uy = dy / L, h = Math.min(L * 0.5, w * 3);
  const ex = x + dx, ey = y + dy;
  const hx = ex - ux * h, hy = ey - uy * h;
  return (
    <g opacity={o} strokeLinecap="round" strokeLinejoin="round">
      <line x1={x} y1={y} x2={hx} y2={hy} stroke={C.ink} strokeWidth={w + 6} />
      <polygon points={`${ex},${ey} ${hx - uy * w * 1.6},${hy + ux * w * 1.6} ${hx + uy * w * 1.6},${hy - ux * w * 1.6}`} fill={color} stroke={C.ink} strokeWidth={4} />
      <line x1={x} y1={y} x2={hx} y2={hy} stroke={color} strokeWidth={w} />
    </g>
  );
};

/** Front view looking down the arms from their tips: the two rails sit left and right of the vehicle like shelves. */
export const FV: Cam3 = {at: [VX, CAR - 1, 0], z: 23, yaw: -90, pitch: 6};

export const mechShots = (): Shot[] => {
  const shots: Shot[] = [];
  const s2 = ls('S2_00');
  const tLoad = wt('S2_02', 'load');
  const tArmsSup = ls('S2_03'), tTop = wt('S2_03', 'top');
  const tCrush = ls('S2_04'), tSticks = wt('S2_04', 'sticks'), tShelves = ls('S2_05'), tLine = ls('S2_06'), tGently = wt('S2_06', 'gently'), tTransfer = wt('S2_06', 'transfer');
  const tSounds = ls('S2_07'), tRocket = wt('S2_07', 'rocket'), tMove = wt('S2_07', 'move'), tCrane = wt('S2_07', 'crane'), tEngines = wt('S2_07', 'engines');
  const tBetween = ls('S2_08'), tMotion = ls('S2_09');

  // B1 — the real catch, looked at closely: the powered approach; ends pushing in on the arms
  const b1a = s2 - 0.18, b1b = tLoad - 1.95;
  shots.push({
    id: 'B1_realApproach', a: b1a, b: b1b, tin: 'cut',
    render: (t) => (
      <Footage file={F5} a={b1a} src0={1.0} scale={lerp(1.08, 2.0, ep(t, b1b - 0.9, b1b))} cx={0.45} cy={0.32}>
        {svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, b1a + 0.3, b1b - 0.1, 0.3)} />)}
      </Footage>
    ),
  });

  // B2 — drawn at the pushed-in framing: the last metres on the engines, relative motion stopping as the pins meet the rails
  const b2b = tArmsSup - 0.15;
  shots.push({
    id: 'B2_contact', a: b1b, b: b2b, tin: 'cut',
    render: (t) => {
      const above = approach(t, b1b - 1.4, tLoad + 0.05, 16, 0.25);
      const u = ep(t, b1b, b2b);
      const c: Cam3 = {at: [lerp(VX - 3, VX - 1, u), lerp(CAR + 8, CAR + 4, u), 0], z: lerp(10.5, 14, u), yaw: -14, pitch: 2};
      const s: ArmState = {carY: CAR, open: lerp(9, 4, ep(t, b1b, tLoad)), flex: 0.3 * prog(t, tLoad, tLoad + 0.5)};
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tLoad - 0.1, b2b + 1, 0.2)}
          vehicle={<BoosterAt c={c} carY={CAR} above={above} v="v1" l="day" heading={90} props={{engines: throttle(t, b1b - 1, tLoad + 0.05, 0.5), t, plumeLen: 30, id: 'b2b'}} />} />
      );
    },
  });

  // B3 — mechanism scale at the near pin: the load goes into the receiving surface and on into the arm's truss
  const b3b = tCrush - 0.12;
  shots.push({
    id: 'B3_supportFeature', a: b2b, b: b3b, tin: 'cut',
    render: (t) => {
      const pinW: V3 = [VX, CAR + RAIL_DY + 0.5, ARM_Z - 1.3];
      const u = ep(t, b2b, b3b);
      const c: Cam3 = {at: [lerp(pinW[0], pinW[0] - 7, u), lerp(pinW[1], pinW[1] - 1.5, u), pinW[2]], z: lerp(40, 26, u), yaw: lerp(-34, -22, u), pitch: 8};
      const s: ArmState = {carY: CAR, open: 4, flex: 0.3};
      const pin = proj(c, pinW);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={0.5} hiTruss={fadeWin(t, tTop - 0.2, b3b + 0.5, 0.3)} load={ep(t, tTop - 0.2, b3b)}
          vehicle={<BoosterAt c={c} carY={CAR} above={-0.25} v="v1" l="day" heading={90} props={{t, id: 'b3b'}} />}
          overlay={svg(
            <>
              <Arrow x={pin[0]} y={pin[1] - 220} dx={0} dy={180} o={fadeWin(t, tArmsSup + 0.2, tTop + 0.4, 0.25)} />
              <Tag text="SUPPORT FEATURE" x={pin[0] - 520} y={pin[1] - 250} to={[pin[0] - 14, pin[1] - 10]} o={fadeWin(t, tArmsSup + 0.4, b3b, 0.25)} size={34} />
            </>,
          )}
        />
      );
    },
  });

  // B4 — not a squeeze, from directly above: the arms pass either side with clearance; a squeeze is shown and struck out
  shots.push({
    id: 'B4_noSqueeze', a: b3b, b: tShelves - 0.15, tin: 'cut',
    render: (t) => {
      const sq = ep(t, tCrush + 0.1, tCrush + 0.8);
      const no = prog(t, tSticks - 0.5, tSticks - 0.1);
      const k = 30, cx = 1060, cy = 540;
      const armW = 3.4 * k, gap = (ARM_Z - 1.3 - R) * k;
      const armRect = (sd: number) => {
        const y = cy + sd * (R * k + gap) + (sd > 0 ? 0 : -armW);
        return (
          <g key={sd}>
            <rect x={140} y={y} width={1500} height={armW} fill="#66707a" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 15}, (_, i) => <line key={i} x1={160 + i * 100} y1={y + 6} x2={240 + i * 100} y2={y + armW - 6} stroke="#454e57" strokeWidth={6} />)}
            <rect x={300} y={sd > 0 ? y : y + armW - 18} width={1300} height={18} fill="#e2e6e8" stroke={C.ink} strokeWidth={3} />
          </g>
        );
      };
      return (
        <Frame>
          <rect width={1920} height={1080} fill="#d9d4c7" />
          <rect x={0} y={0} width={180} height={1080} fill="#76808a" />
          {armRect(1)}
          {armRect(-1)}
          <defs>
            <radialGradient id="v4tank" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stopColor="#f4f6f8" /><stop offset="0.6" stopColor="#b9c2cb" /><stop offset="1" stopColor="#7e8994" /></radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R * k} fill="url(#v4tank)" stroke={C.ink} strokeWidth={5} />
          {[1, -1].map((sd) => <rect key={sd} x={cx - 0.6 * k} y={cy + sd * (R * k) - (sd > 0 ? 0 : 1.6 * k) + (sd > 0 ? -0.2 * k : 0.2 * k)} width={1.2 * k} height={(gap / k + 1.6) * k} fill="#8a949e" stroke={C.ink} strokeWidth={4} />)}
          {[1, -1].map((sd) => {
            const y1 = cy + sd * R * k, y2 = cy + sd * (R * k + gap);
            return <g key={`g${sd}`} stroke={C.ink} strokeWidth={4}><line x1={cx + 260} y1={y1} x2={cx + 260} y2={y2} /><line x1={cx + 245} y1={y1} x2={cx + 275} y2={y1} /><line x1={cx + 245} y1={y2} x2={cx + 275} y2={y2} /></g>;
          })}
          <Word text="CLEARANCE" x={cx + 300} y={cy - 40} anchor="start" size={44} color="#2b3540" o={prog(t, tCrush + 0.8, tCrush + 1.1)} />
          <g opacity={1 - prog(t, tShelves - 0.5, tShelves - 0.2)}>
            <Arrow x={cx - 110} y={cy - R * k - 250} dx={0} dy={(250 - 24) * sq} color={C.red} />
            <Arrow x={cx - 110} y={cy + R * k + 250} dx={0} dy={-(250 - 24) * sq} color={C.red} />
            <g opacity={no} stroke={C.red} strokeWidth={24} strokeLinecap="round">
              <line x1={cx - 170} y1={cy - 170} x2={cx + 170} y2={cy + 170} />
              <line x1={cx + 170} y1={cy - 170} x2={cx - 170} y2={cy + 170} />
            </g>
          </g>
        </Frame>
      );
    },
  });

  // B5a — the analogy, briefly: a heavy drum with two lugs lowered by a crane onto two shelves (screen layout matches
  // the front view of the arms that replaces it)
  const b5a = tShelves - 0.15, b5b = tGently - 0.25;
  const shelfY = proj(FV, [VX, CAR + RAIL_DY, ARM_Z - 1.3])[1];
  const shelfX = proj(FV, [VX, CAR + RAIL_DY, ARM_Z - 1.3])[0];
  shots.push({
    id: 'B5a_shelves', a: b5a, b: b5b, tin: 'dip', td: 0.45,
    render: (t) => {
      const k = Math.abs(shelfX - 960) / 5.3;
      const drop = 360 * Math.max(0, 1 - ep(t, b5a + 0.1, b5b - 0.55)) - 6 * Math.exp(-Math.max(0, t - (b5b - 0.55)) * 5) * Math.sin(Math.max(0, t - (b5b - 0.55)) * 14);
      const sway = (1 - ep(t, b5a, b5b - 0.6)) * 22 * Math.sin(t * 2.6);
      const dx = 960 + sway;
      const top = shelfY - 1.1 * k - drop;
      return (
        <Frame>
          <Sky k="day" horizon={0.9} />
          <rect x={0} y={shelfY + 260} width={1920} height={1080} fill="#cbbf9c" />
          {[-1, 1].map((sd) => (
            <g key={sd}>
              <rect x={960 + sd * 7.4 * k - 0.9 * k} y={shelfY} width={1.8 * k} height={1080} fill="#66707a" stroke={C.ink} strokeWidth={4} />
              <rect x={960 + sd * 5.3 * k - 2.2 * k} y={shelfY} width={4.4 * k} height={0.6 * k} fill="#e2e6e8" stroke={C.ink} strokeWidth={4} />
            </g>
          ))}
          <line x1={dx} y1={-10} x2={dx} y2={top - 1.6 * k} stroke="#2b333c" strokeWidth={7} />
          <line x1={dx} y1={top - 1.4 * k} x2={dx - 3.6 * k} y2={top} stroke="#2b333c" strokeWidth={5} />
          <line x1={dx} y1={top - 1.4 * k} x2={dx + 3.6 * k} y2={top} stroke="#2b333c" strokeWidth={5} />
          <defs>
            <linearGradient id="v4drum" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#7e8994" /><stop offset="0.3" stopColor="#f3f6f8" /><stop offset="0.6" stopColor="#c2cad2" /><stop offset="1" stopColor="#6b7580" /></linearGradient>
          </defs>
          <rect x={dx - 4.5 * k} y={top} width={9 * k} height={6 * k} fill="url(#v4drum)" stroke={C.ink} strokeWidth={5} />
          {[-1, 1].map((sd) => <rect key={sd} x={dx + sd * 4.5 * k - (sd > 0 ? 0 : 1.2 * k)} y={top + 0.2 * k} width={1.2 * k} height={0.9 * k} fill="#8a949e" stroke={C.ink} strokeWidth={4} />)}
        </Frame>
      );
    },
  });

  // B5b — the shelves are the rails: same layout, now the arms seen down their length with the booster's pins
  // arriving gently and the weight transferring (arms flex slightly)
  const b6a = tSounds + 0.4;
  const FrontBooster: React.FC<{t: number; c: Cam3; above: number; eng: number; flex: number; open?: number}> = ({t, c, above, eng, flex, open = 0}) => (
    <CatchView t={t} c={c} l="day" s={{carY: CAR, open, flex}} farm={false}
      vehicle={<BoosterAt c={c} carY={CAR} above={above} v="v1" l="day" heading={90} props={{engines: eng, t, plumeLen: 30, id: 'b5bb'}} />} />
  );
  shots.push({
    id: 'B5b_rails', a: b5b, b: b6a, tin: 'fade', td: 0.45,
    render: (t) => {
      const above = approach(t, b5b - 0.6, tTransfer - 0.1, 2.6, 0.18);
      return <FrontBooster t={t} c={FV} above={above} eng={throttle(t, b5b - 0.6, tTransfer - 0.1, 0.4)} flex={0.5 * prog(t, tTransfer - 0.1, tTransfer + 0.4)} />;
    },
  });

  // B6 — except: one pull-back from the rails reveals the rocket on the tower; the "shelves" move (the booster lifts
  // on its engines, the arms swing out and back, the carriage travels); the "crane" is its own engines
  const b6b = tBetween - 0.15;
  shots.push({
    id: 'B6_except', a: b6a, b: b6b, tin: 'cut',
    render: (t) => {
      const back = ep(t, b6a, tRocket + 0.3);
      const c: Cam3 = {
        at: [lerp(FV.at[0], VX - 8, back), lerp(FV.at[1], CAR - 14, back), 0],
        z: Math.exp(lerp(Math.log(FV.z), Math.log(6.2), back)), yaw: lerp(-90, -30, back), pitch: lerp(6, 4, back),
      };
      const lift = ep(t, tMove - 0.6, tMove - 0.1) * (1 - ep(t, tEngines + 0.1, b6b));
      const swing = Math.sin(Math.PI * ep(t, tMove - 0.1, tCrane + 0.1));
      const car = CAR + 10 * Math.sin(Math.PI * ep(t, tMove + 0.2, tCrane + 0.4));
      const s: ArmState = {carY: car, open: 4 + 24 * swing};
      const eng = Math.max(lift > 0.01 ? 0.8 : 0, prog(t, tCrane - 0.2, tCrane + 0.2) * (1 - prog(t, b6b - 0.4, b6b)));
      return (
        <CatchView t={t} c={c} l="day" s={s} hiCarriage={fadeWin(t, tMove + 0.1, tCrane + 0.4, 0.2) * 0.7}
          vehicle={<BoosterAt c={c} carY={CAR} above={lift * 9} v="v1" l="day" heading={90} props={{t, id: 'b6b', engines: eng, plumeLen: 36}} />} />
      );
    },
  });

  // B7 — between the arms is only the start: low view toward the arms; drift and wobble brought under control
  shots.push({
    id: 'B7_control', a: b6b, b: ls('S3_00') - 0.4, tin: 'cut',
    render: (t) => {
      const k = 1 - ep(t, tMotion + 0.2, tMotion + 1.4);
      const dx = (2.6 * noise(t * 0.9, 3) + 1.3 * Math.sin(t * 2.1)) * k;
      const tilt = 3.0 * noise(t * 1.1, 7) * k;
      const b7b = ls('S3_00') - 0.4, tC = b7b - 0.75;
      const above = approach(t, b6b, tC, 15, 0.2);
      const c: Cam3 = {at: [VX - 4, CAR + lerp(8, 5, ep(t, b6b, tC)), 0], z: lerp(7.6, 9.4, ep(t, b6b, tC)), yaw: -22, pitch: 10};
      return (
        <CatchView t={t} c={c} l="day" s={{carY: CAR, open: lerp(10, 4, ep(t, tC - 1.4, tC)), flex: 0.3 * prog(t, tC, tC + 0.4)}} hiRail={fadeWin(t, tC - 0.1, b7b + 1, 0.2) * 0.6}
          vehicle={<BoosterAt c={c} carY={CAR} above={above} dx={dx} tilt={tilt} v="v1" l="day" heading={90} props={{t, id: 'b7b', engines: lerp(0.85, 0.5, prog(t, tC - 1.2, tC)) * (1 - prog(t, tC + 0.1, tC + 0.5)), plumeLen: 28}} />} />
      );
    },
  });

  // ---------------- S3 ----------------
  const c1a = ls('S3_00') - 0.4;
  const tOrbital = wt('S3_00', 'orbital'), tHome = ls('S3_02'), tAtmo = ls('S3_03'), tTiles = ls('S3_04');
  const tOrient = wt('S3_05', 'orientation'), tFlow = wt('S3_05', 'flow'), tSurvive = wt('S3_05', 'survive');

  // C1 — one orbital move: the ship cruising fast over the turning Earth; at "coming home" it pitches up to a high
  // angle of attack and dips toward the atmosphere, ending on the limb tilted like the real onboard view
  const c3b = tAtmo - 0.1;
  shots.push({
    id: 'C1_orbit', a: c1a, b: c3b, tin: 'dip', td: 0.5,
    render: (t) => {
      const pull = ep(t, tOrbital - 0.8, tOrbital + 0.6);
      const dive = ep(t, tHome - 0.2, c3b);
      const push = ep(t, c3b - 1.1, c3b + 0.2);
      const z = lerp(14, 7, pull) * lerp(1, 1.5, dive) * Math.exp(lerp(0, Math.log(7), push));
      const limbTop = lerp(1000, 800, pull) - dive * 330;
      const rot = lerp(90, 64, smoother(prog(t, tHome - 0.3, tHome + 1.4)));
      return (
        <Frame>
          <Sky k="space" />
          <g transform={`rotate(${lerp(0, -9, dive)} 960 540)`}>
            <Limb top={limbTop} r={5200} glow={1} scroll={t * lerp(320, 140, pull)} />
            <InFlight x={lerp(880, 960, pull)} y={lerp(lerp(520, 470, pull) + dive * 120, 380, push)} rot={rot} z={z}>
              <g transform="translate(0 26)"><Ship az={lerp(130, 40, dive)} t={t} pal="space" heat={prog(t, tAtmo - 1.8, tAtmo) * 0.95} detail={push > 0.2} id="c1s" /></g>
            </InFlight>
          </g>
        </Frame>
      );
    },
  });

  // C4 — the real Flight 14 plasma, entered on the matching horizon
  const c4b = tTiles + 0.05;
  shots.push({
    id: 'C4_realPlasma', a: c3b, b: c4b, tin: 'fade', td: 0.35,
    render: (t) => (
      <Footage file={F14R} a={c3b} src0={4.0} scale={1.2} cx={0.92} cy={0}>
        {svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, c3b + 0.3, c4b - 0.1, 0.3)} />)}
      </Footage>
    ),
  });

  // C5 — the black-tiled windward side, close, pulling back to the whole heated body
  const c5b = tOrient - 0.3;
  shots.push({
    id: 'C5_tiles', a: c4b, b: c5b, tin: 'fade', td: 0.25,
    render: (t) => {
      const u = ep(t, c4b, c5b);
      const z = Math.exp(lerp(Math.log(150), Math.log(14), u));
      return (
        <Frame>
          <Sky k="high" />
          <Streaks t={t} dir={[0.2, -1]} k={0.5} color="rgba(255,180,160,0.3)" />
          <InFlight x={960} y={lerp(380, 560, u)} rot={-96} z={z}>
            <g transform={`translate(${lerp(2.0, 0, u)} ${lerp(22, 26, u)})`}>
              <Ship az={lerp(8, 30, u)} heat={lerp(0.15, 0.85, prog(u, 0.25, 0.8))} t={t} pal="space" detail flapFwd={20} flapAft={16} id="c5s" />
            </g>
          </InFlight>
        </Frame>
      );
    },
  });

  // C6 — hold the orientation: close on the aft flap and its hinge; each flap movement answers a body swing
  const c6b = tSurvive - 0.1;
  shots.push({
    id: 'C6_flapAttitude', a: c5b, b: c6b, tin: 'cut',
    render: (t) => {
      const u = prog(t, c5b, c6b);
      const ph = (t - c5b) * 2.4;
      const resp = 22 + 22 * Math.sin(ph) * (1 - 0.6 * prog(t, tFlow, c6b));
      const body = -90 + 4 * Math.sin(ph - 0.9) * (1 - 0.6 * prog(t, tFlow, c6b));
      const z = lerp(30, 16, ep(t, tFlow - 0.4, c6b));
      return (
        <Frame>
          <Sky k="high" />
          <Streaks t={t} dir={[0, -1]} k={0.6} color="rgba(255,190,170,0.4)" />
          <InFlight x={lerp(1080, 980, u)} y={470} rot={body} z={z}>
            <g transform="translate(-1 6)"><Ship az={38} heat={lerp(0.55, 0.3, u)} t={t} pal="space" flapFwd={resp * 0.8} flapAft={resp} id="c6s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });
  return shots;
};
