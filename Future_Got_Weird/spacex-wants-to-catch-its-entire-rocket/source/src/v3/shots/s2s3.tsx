// "What actually catches it" (S2) and "Coming back from orbit" (S3).
import React from 'react';
import {keys, ep, prog, clamp, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, proj} from '../cam3';
import {ArmState, VX, RAIL_DY, azFor, Place, PinMark, ARM_Z} from '../site';
import {Booster, Ship, ShipEngineView, BOOSTER_LEN, R} from '../vehicles';
import {Clouds, Credit, Frame, Limb, Sky, Tag, Word} from '../scene';
import {F5, F14R, Footage, Shot} from '../timeline';
import {CatchView, InFlight, ShipAt, BoosterAt, Streaks, approach, throttle, boosterRestY} from './common';
import {ShipReturnSky} from './s0s1';
import {le, ls, ss, wt} from '../time';
import {C} from '../../kit/ui';

const svg = (children: React.ReactNode) => (
  <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>
);

/** Arrow (screen px) for forces / speed. */
const Arrow: React.FC<{x: number; y: number; dx: number; dy: number; color?: string; w?: number; o?: number}> = ({x, y, dx, dy, color = C.yellow, w = 10, o = 1}) => {
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
export {Arrow};

export const s2s3Shots = (): Shot[] => {
  const shots: Shot[] = [];
  const s2 = ss('S2');
  const tFiring = wt('S2_01', 'firing'), tLoad = wt('S2_02', 'load');
  const tArmsSup = ls('S2_03'), tTop = wt('S2_03', 'top');
  const tCrush = ls('S2_04'), tShelves = ls('S2_05'), tLine = ls('S2_06'), tGently = wt('S2_06', 'gently'), tTransfer = wt('S2_06', 'transfer');
  const tSounds = ls('S2_07'), tRocket = wt('S2_07', 'rocket'), tMove = wt('S2_07', 'move'), tCrane = wt('S2_07', 'crane'), tEngines = wt('S2_07', 'engines');
  const tBetween = ls('S2_08'), tMotion = ls('S2_09');
  const CAR = 104;

  // B1 — the real catch again, a different, earlier portion: the powered approach
  const b1a = s2 - 1.05, b1b = tLoad - 2.6;
  shots.push({
    id: 'B1_real', a: b1a, b: b1b, tin: 'cut',
    render: (t) => (
      <Footage file={F5} a={b1a} src0={1.0} scale={lerp(1.08, 2.3, ep(t, b1b - 0.8, b1b))} cx={0.45} cy={0.32}>
        {svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, b1a + 0.3, b1b - 0.1, 0.3)} />)}
      </Footage>
    ),
  });

  // B2 — on the tower edge into the enlarged drawing: engines still firing, downward speed bleeding off to zero at contact
  const b2a = b1b, b2b = tArmsSup - 0.1;
  shots.push({
    id: 'B2_speed', a: b2a, b: b2b, tin: 'cut',
    render: (t) => {
      const above = approach(t, b2a - 1.2, tLoad + 0.05, 22);
      const v = Math.max(0, (approach(t - 0.05, b2a - 1.2, tLoad + 0.05, 22) - above) / 0.05);
      const c: Cam3 = {at: [lerp(27, 24, ep(t, b2a, b2b)), lerp(84, 92, ep(t, b2a, b2b)), 0], z: lerp(10.5, 13, ep(t, b2a, b2b)), yaw: -8, pitch: 0};
      const s: ArmState = {carY: CAR, open: lerp(10, 4, ep(t, b2a, tLoad))};
      const bc = proj(c, [VX, boosterRestY(CAR, 'v1') + above + 50, 0]);
      return (
        <CatchView t={t} c={c} l="dusk" s={s} hiRail={fadeWin(t, tLoad - 0.4, b2b + 1, 0.2)}
          vehicle={<BoosterAt c={c} carY={CAR} above={above} v="v1" l="dusk" heading={45} props={{engines: throttle(t, b2a - 1, tLoad + 0.05, 0.6), t, plumeLen: 30, id: 'b2b'}} />}
          overlay={svg(<Arrow x={bc[0] + 130} y={bc[1] - 60} dx={0} dy={Math.min(260, v * 26)} o={1 - prog(t, tLoad, tLoad + 0.3)} />)}
        />
      );
    },
  });

  // B3 — the pins near the top bear on the arms
  shots.push({
    id: 'B3_pin', a: b2b, b: tCrush - 0.1, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 5, CAR + 2, 0], z: lerp(34, 38, prog(t, b2b, tCrush)), yaw: -28, pitch: 6};
      const s: ArmState = {carY: CAR, open: 4, flex: 0.25};
      const pin = proj(c, [VX, CAR + RAIL_DY + 0.5, ARM_Z - 1.3]);
      return (
        <CatchView t={t} c={c} l="dusk" s={s} hiRail={0.6} fore={<PinMark c={c} s={s} above={0} />}
          vehicle={<BoosterAt c={c} carY={CAR} above={-0.25} v="v1" l="dusk" heading={45} props={{t, id: 'b3b', catchHi: 1}} />}
          overlay={svg(
            <>
              <Arrow x={pin[0]} y={pin[1] - 210} dx={0} dy={170} o={fadeWin(t, tArmsSup + 0.3, tCrush, 0.25)} />
              <Tag text="SUPPORT FEATURE" x={pin[0] - 470} y={pin[1] - 240} to={[pin[0] - 10, pin[1] - 8]} o={fadeWin(t, tTop - 0.3, tCrush, 0.25)} size={36} />
            </>,
          )}
        />
      );
    },
  });

  // B4 — not a squeeze: full-screen plan view. The arms pass either side of the tank with clearance; the pins rest on
  // the rails and carry the load. A squeeze is shown, then struck out.
  shots.push({
    id: 'B4_plan', a: tCrush - 0.1, b: tShelves - 0.15, tin: 'cut',
    render: (t) => {
      const sq = ep(t, tCrush + 0.1, tCrush + 0.8);
      const no = prog(t, wt('S2_04', 'sticks') - 0.5, wt('S2_04', 'sticks') - 0.1);
      const k = 30; // px per metre
      const cx = 1060, cy = 540;
      const armW = 3.4 * k, gap = (ARM_Z - 1.3 - R) * k;
      const armRect = (sd: number) => {
        const y = cy + sd * (R * k + gap) + (sd > 0 ? 0 : -armW);
        return (
          <g key={sd}>
            <rect x={140} y={y} width={1500} height={armW} fill="#46525e" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 15}, (_, i) => <line key={i} x1={160 + i * 100} y1={y + 6} x2={240 + i * 100} y2={y + armW - 6} stroke="#2b333c" strokeWidth={6} />)}
            <rect x={300} y={sd > 0 ? y : y + armW - 18} width={1300} height={18} fill="#c9d1d9" stroke={C.ink} strokeWidth={3} />
          </g>
        );
      };
      return (
        <Frame>
          <rect width={1920} height={1080} fill="#d9d2bf" />
          <rect x={0} y={0} width={180} height={1080} fill="#38424d" />
          {armRect(1)}
          {armRect(-1)}
          <defs>
            <radialGradient id="b4tank" cx="0.38" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#f4f6f8" />
              <stop offset="0.6" stopColor="#b9c2cb" />
              <stop offset="1" stopColor="#7e8994" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R * k} fill="url(#b4tank)" stroke={C.ink} strokeWidth={5} />
          {[1, -1].map((sd) => <rect key={sd} x={cx - 0.6 * k} y={cy + sd * (R * k) - (sd > 0 ? 0 : 1.6 * k) + (sd > 0 ? -0.2 * k : 0.2 * k)} width={1.2 * k} height={(gap / k + 1.6) * k} fill="#ffc93c" stroke={C.ink} strokeWidth={4} />)}
          {/* clearance brackets */}
          {[1, -1].map((sd) => {
            const y1 = cy + sd * R * k, y2 = cy + sd * (R * k + gap);
            return <g key={`g${sd}`} stroke={C.ink} strokeWidth={4}><line x1={cx + 260} y1={y1} x2={cx + 260} y2={y2} /><line x1={cx + 245} y1={y1} x2={cx + 275} y2={y1} /><line x1={cx + 245} y1={y2} x2={cx + 275} y2={y2} /></g>;
          })}
          <Word text="CLEARANCE" x={cx + 300} y={cy - 40} anchor="start" size={44} color="#fbf4e4" o={prog(t, tCrush + 0.8, tCrush + 1.1)} />
          <g opacity={1 - prog(t, tShelves - 0.5, tShelves - 0.2)}>
            <Arrow x={cx - 110} y={cy - R * k - 250} dx={0} dy={(250 - 24) * sq} color={C.red} />
            <Arrow x={cx - 110} y={cy + R * k + 250} dx={0} dy={-(250 - 24) * sq} color={C.red} />
            <g opacity={no} stroke={C.red} strokeWidth={24} strokeLinecap="round">
              <line x1={cx - 170} y1={cy - 170} x2={cx + 170} y2={cy + 170} />
              <line x1={cx + 170} y1={cy - 170} x2={cx - 170} y2={cy + 170} />
            </g>
          </g>
          <Word text="VIEW FROM ABOVE" x={60} y={1040} anchor="start" size={30} color="#fbf4e4" o={0.9} />
        </Frame>
      );
    },
  });

  // B5 — the analogy, plainly: a heavy steel drum with two lugs, lowered by a crane onto two shelves
  const b5a = tShelves - 0.15, b6a = tSounds + 0.55, b6b = tBetween - 0.2;
  shots.push({
    id: 'B5_shelves', a: b5a, b: b6a, tin: 'dip', td: 0.5,
    render: (t) => {
      const k = 34;
      const cx = 960, shelfY = 640;
      const drop = lerp(380, 0, ep(t, b5a, tGently + 0.25));
      const sway = (1 - prog(t, b5a, tLine + 0.3)) * 26 * Math.sin(t * 2.6);
      const slack = prog(t, tTransfer, tTransfer + 0.5);
      const dx = cx + sway;
      const top = shelfY - 1.1 * k - drop;
      const lineA = prog(t, tLine - 0.1, tLine + 0.3) * (1 - prog(t, tGently, tGently + 0.3));
      return (
        <Frame>
          <Sky k="studio" />
          <g transform={(() => { const z = Math.exp(lerp(0, Math.log(3.4), ep(t, b6a - 0.75, b6a))); const lx = cx + 5.1 * k, ly = shelfY - 0.1 * k; const m = ep(t, b6a - 0.75, b6a); return `translate(${lerp(0, 960 - lx, m)} ${lerp(0, 540 - ly, m)}) translate(${lx} ${ly}) scale(${z}) translate(${-lx} ${-ly})`; })()}>
          <rect x={0} y={760} width={1920} height={320} fill="#c7c1ad" />
          {/* two wall shelves on posts */}
          {[-1, 1].map((sd) => (
            <g key={sd}>
              <rect x={cx + sd * 6.9 * k - 0.9 * k} y={shelfY} width={1.8 * k} height={760 - shelfY} fill="#5b6875" stroke={C.ink} strokeWidth={4} />
              <rect x={cx + sd * 5.0 * k - 2.2 * k} y={shelfY} width={4.4 * k} height={0.6 * k} fill="#c9d1d9" stroke={C.ink} strokeWidth={4} />
            </g>
          ))}
          {/* crane cable */}
          <line x1={dx} y1={-10} x2={dx} y2={top - 1.6 * k + slack * 26} stroke="#2b333c" strokeWidth={7} />
          <path d={`M${dx - 22} ${top - 1.6 * k} q 22 40 44 0`} stroke="#2b333c" strokeWidth={10} fill="none" />
          <line x1={dx} y1={top - 1.4 * k} x2={dx - 3.6 * k} y2={top} stroke="#2b333c" strokeWidth={5} />
          <line x1={dx} y1={top - 1.4 * k} x2={dx + 3.6 * k} y2={top} stroke="#2b333c" strokeWidth={5} />
          {/* the drum: a short steel section with two lugs */}
          <defs>
            <linearGradient id="b5drum" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#7e8994" /><stop offset="0.3" stopColor="#f3f6f8" /><stop offset="0.6" stopColor="#c2cad2" /><stop offset="1" stopColor="#6b7580" />
            </linearGradient>
          </defs>
          <rect x={dx - 4.5 * k} y={top} width={9 * k} height={6 * k} fill="url(#b5drum)" stroke={C.ink} strokeWidth={5} />
          {[-1, 1].map((sd) => <rect key={sd} x={dx + sd * 4.5 * k - (sd > 0 ? 0 : 1.2 * k)} y={top + 0.2 * k} width={1.2 * k} height={0.9 * k} fill="#8a949e" stroke={C.ink} strokeWidth={4} />)}
          <g opacity={lineA} stroke={C.yellow} strokeWidth={4} strokeDasharray="10 10">
            {[-1, 1].map((sd) => <line key={sd} x1={dx + sd * 5.1 * k} y1={top + 1.1 * k} x2={dx + sd * 5.1 * k} y2={shelfY} />)}
          </g>
          {[-1, 1].map((sd) => <Arrow key={sd} x={cx + sd * 5.1 * k} y={shelfY - 230} dx={0} dy={180} o={fadeWin(t, tTransfer + 0.2, b6a, 0.2)} />)}
          </g>
          <Word text="LINE UP" x={960} y={180} size={84} o={fadeWin(t, tLine, tGently, 0.2)} color="#fbf4e4" />
          <Word text="ARRIVE GENTLY" x={960} y={180} size={84} o={fadeWin(t, tGently, tTransfer, 0.2)} color="#fbf4e4" />
          <Word text="TRANSFER THE WEIGHT" x={960} y={180} size={84} o={fadeWin(t, tTransfer, b6a - 0.6, 0.2)} color="#fbf4e4" />
        </Frame>
      );
    },
  });

  // B6 — except: the object is a rocket, the shelves move (the arms swing in), the crane is its own engines
  shots.push({
    id: 'B6_except', a: b6a, b: b6b, tin: 'cut',
    render: (t) => {
      const back = ep(t, b6a, tMove - 0.4);
      const pinW: [number, number, number] = [VX, CAR + RAIL_DY + 0.4, ARM_Z - 1.3];
      const far: [number, number, number] = [VX - 4, lerp(CAR - 6, CAR - 24, ep(t, tCrane - 0.3, tEngines + 0.5)), 0];
      const c: Cam3 = {at: [lerp(pinW[0], far[0], back), lerp(pinW[1], far[1], back), lerp(pinW[2], far[2], back)], z: Math.exp(lerp(Math.log(46), Math.log(lerp(9.5, 7.2, ep(t, tCrane - 0.3, tEngines + 0.5))), back)), yaw: -18, pitch: 2};
      // the shelves move: arms swing open and back in, the booster held on them throughout the first beat
      const swing = Math.sin(Math.PI * ep(t, tMove - 0.55, tCrane - 0.1));
      const s: ArmState = {carY: CAR, open: 4 + 22 * swing};
      const eng = prog(t, tEngines - 0.35, tEngines);
      const above = swing > 0.02 || t > tMove ? lerp(0, 6, ep(t, tMove - 0.55, tMove)) : 0;
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tMove - 0.4, tCrane, 0.2)}
          fore={back < 0.5 ? <PinMark c={c} s={s} above={above} /> : null}
          vehicle={<BoosterAt c={c} carY={CAR} above={above} v="v1" l="day" heading={45} props={{t, id: 'b6b', engines: eng, plumeLen: 34}} />}
          overlay={svg(
            <>
              <Word text="ROCKET" x={1500} y={260} size={80} o={fadeWin(t, tRocket - 0.1, tMove - 0.1, 0.15)} color="#fbf4e4" />
              <Word text="SHELVES MOVE" x={1500} y={260} size={80} o={fadeWin(t, tMove - 0.1, tCrane - 0.1, 0.15)} color="#fbf4e4" />
              <Word text="CRANE = ENGINES" x={1500} y={260} size={80} o={fadeWin(t, tCrane - 0.1, b6b, 0.15)} color="#fbf4e4" />
            </>,
          )}
        />
      );
    },
  });

  // B7 — between the arms is only the start: drift and wobble, then the motion is brought under control
  shots.push({
    id: 'B7_control', a: b6b, b: ss('S3') - 1.4, tin: 'cut',
    render: (t) => {
      const k = 1 - ep(t, tMotion + 0.2, tMotion + 1.6);
      const dx = (2.4 * noise(t * 0.9, 3) + 1.2 * Math.sin(t * 2.1)) * k;
      const tilt = 3.2 * noise(t * 1.1, 7) * k;
      const above = lerp(14, 5, ep(t, b6b, tMotion + 1.6));
      const c: Cam3 = {at: [VX - 6, CAR + 6, 0], z: 9, yaw: -18, pitch: 2};
      const s: ArmState = {carY: CAR, open: 9};
      return (
        <CatchView t={t} c={c} l="day" s={s}
          vehicle={
            <>
              <BoosterAt c={c} carY={CAR} above={above} dx={dx} tilt={tilt} v="v1" l="day" heading={45} props={{t, id: 'b7b', engines: 0.85, plumeLen: 28}} />
            </>
          }
        />
      );
    },
  });

  // ---------------- S3 ----------------
  const s3 = ss('S3');
  const tOrbSpeed = wt('S3_00', 'orbital'), tSide = wt('S3_01', 'sideways'), tFalling = wt('S3_01', 'falling');
  const tHome = ls('S3_02'), tAtmo = ls('S3_03'), tHot = wt('S3_03', 'hot');
  const tTiles = ls('S3_04'), tOrient = ls('S3_05'), tFlow = wt('S3_05', 'flow'), tSurvive = wt('S3_05', 'survive');
  const tDamaged = ls('S3_06'), tEnginesC = wt('S3_07', 'engines'), tControl = wt('S3_07', 'control'), tFinal = wt('S3_07', 'final');
  const tNext = ls('S3_08');

  // C1/C2/C3 — one orbital shot: the ship (drawn) cruising sideways; pull out to the curve of the Earth; turn belly-first
  // and dip into the atmosphere; end on the limb tilted like the real onboard view
  const c1a = ss('S3') - 1.4, c3b = tAtmo - 0.1;
  shots.push({
    id: 'C1_orbit', a: c1a, b: c3b, tin: 'dip', td: 0.6,
    render: (t) => {
      const pull = ep(t, tSide - 0.6, tFalling + 0.4);
      const dive = ep(t, tHome - 0.2, c3b);
      const z = lerp(lerp(16, 12, ep(t, c1a, tSide - 0.6)), 6.5, pull) * lerp(1, 1.5, dive);
      const limbTop = lerp(1010, 800, pull) - dive * 330;
      const roll = lerp(0, -9, dive);
      const rot = lerp(90, lerp(78, 64, smoother(prog(t, tHome - 0.3, tHome + 1.4))), pull > 0 ? 1 : 0); // pitch up to a high angle of attack, nose still leading
      const shipX = lerp(860, 960, pull), shipY = lerp(520, 470, pull) + dive * 120;
      const trail = Array.from({length: 40}, (_, i) => {
        const a = (-i / 40) * 0.5 * pull;
        const r = 5200;
        return [960 + Math.sin(a - 0.05) * r * 0.42 - 420 * pull * (i / 40) * 0, 0];
      });
      return (
        <Frame>
          <Sky k="space" />
          <g transform={`rotate(${roll} 960 540)`}>
            <Limb top={limbTop} r={5200} glow={1} scroll={t * lerp(260, 120, pull)} />
            <path d={`M ${shipX - 900 * pull} ${shipY + 120 * pull} Q ${shipX - 450 * pull} ${shipY - 30 * pull} ${shipX - 40} ${shipY}`} stroke="#fbf4e4" strokeWidth={5} strokeDasharray="2 14" strokeLinecap="round" fill="none" opacity={pull * (1 - dive)} />
            <InFlight x={shipX} y={shipY} rot={rot} z={z}>
              <g transform="translate(0 26)"><Ship az={lerp(130, 40, dive)} t={t} pal="space" heat={prog(t, tAtmo - 1.4, tAtmo) * 0.8} id="c1s" /></g>
            </InFlight>
          </g>
          <Word text="SIDEWAYS" x={1450} y={300} size={80} color="#fbf4e4" o={fadeWin(t, tSide, tFalling + 0.6, 0.25)} />
          {trail.length < 0 ? null : null}
        </Frame>
      );
    },
  });

  // C4 — matching horizon into the real Flight 14 plasma
  const c4a = c3b, c4b = tTiles + 0.05;
  shots.push({
    id: 'C4_real', a: c4a, b: c4b, tin: 'fade', td: 0.17,
    render: (t) => (
      <Footage file={F14R} a={c4a} src0={4.0} scale={1.2} cx={0.92} cy={0}>
        {svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, c4a + 0.3, c4b - 0.1, 0.3)} />)}
      </Footage>
    ),
  });

  // C5 — tile detail pulls back to the complete windward body; heat stays on the surface and its flow
  const c5b = tOrient + 1.9;
  shots.push({
    id: 'C5_tiles', a: c4b, b: c5b, tin: 'fade', td: 0.25,
    render: (t) => {
      const u = ep(t, c4b, c5b - 0.4);
      const z = Math.exp(lerp(Math.log(150), Math.log(12), u));
      const flaps = 18 + 14 * Math.sin(t * 2.4);
      return (
        <Frame>
          <Sky k="high" />
          <Streaks t={t} dir={[0.2, -1]} k={0.5} color="rgba(255,180,160,0.3)" />
          <InFlight x={960} y={lerp(380, 560, u)} rot={-96} z={z}>
            <g transform={`translate(${lerp(2.0, 0, u)} ${lerp(22, 26, u)})`}>
              <Ship az={lerp(8, 30, u)} heat={lerp(0.15, 0.85, prog(u, 0.25, 0.8))} t={t} pal="space" detail flapFwd={flaps} flapAft={flaps * 0.7} id="c5s" />
            </g>
          </InFlight>
        </Frame>
      );
    },
  });

  // C6 — hold the orientation, heat shield into the flow, flaps working
  // C6 — the flap and its hinge answering the flow: the attitude is held by flap motion, close on the aft flap
  shots.push({
    id: 'C6_flapHinge', a: c5b, b: tDamaged - 0.1, tin: 'cut',
    render: (t) => {
      const u = prog(t, c5b, tDamaged);
      const resp = 22 + 20 * Math.sin((t - c5b) * 2.4) * (1 - 0.5 * u);
      const tiltBody = -90 + 3.5 * Math.sin((t - c5b) * 2.4 - 0.9);
      const z = lerp(30, 22, u);
      return (
        <Frame>
          <Sky k="high" />
          <Streaks t={t} dir={[0, -1]} k={0.6} color="rgba(255,190,170,0.4)" />
          {Array.from({length: 7}, (_, i) => {
            const ph = (t * 1.6 + i / 7) % 1;
            return <Arrowish key={i} x={420 + i * 170} y={1060 - ph * 360} o={(1 - ph) * prog(t, c5b, c5b + 0.6)} />;
          })}
          <InFlight x={lerp(1080, 1000, u)} y={470} rot={tiltBody} z={z}>
            <g transform="translate(-1 6)"><Ship az={38} heat={0.55} t={t} pal="space" flapFwd={resp * 0.8} flapAft={resp} id="c6s" /></g>
          </InFlight>
          <Word text="FLAPS HOLD THE ATTITUDE" x={1820} y={170} anchor="end" size={56} color="#fbf4e4" o={fadeWin(t, wt('S3_05', 'orientation') - 0.2, tDamaged - 0.3, 0.25)} />
        </Frame>
      );
    },
  });

  // C7 — reaching the right coastline is not enough: high view over the Gulf coast, the ship's glowing track arriving
  shots.push({
    id: 'C7_coast', a: tDamaged - 0.1, b: tEnginesC - 0.25, tin: 'dip', td: 0.45,
    render: (t) => {
      const u = prog(t, tDamaged - 0.1, tEnginesC - 0.25);
      return (
        <Frame bg="#2f6c9c">
          <rect width={1920} height={1080} fill="#2f6c9c" />
          {/* coastline seen from very high: land to the left */}
          <path d="M0 0 L760 0 C 720 160, 800 320, 760 470 C 720 620, 820 780, 780 1080 L0 1080 Z" fill="#c9bb8f" />
          <path d="M760 0 C 720 160, 800 320, 760 470 C 720 620, 820 780, 780 1080" stroke="#f3ead2" strokeWidth={10} fill="none" />
          <path d="M0 0 L640 0 C 610 200, 680 360, 640 520 C 600 700, 700 860, 660 1080 L0 1080 Z" fill="#a9a37b" />
          <circle cx={748} cy={540} r={9} fill="#ffc93c" stroke={C.ink} strokeWidth={3} />
          <path d={`M 1980 ${150} Q 1300 ${330} ${lerp(1500, 860, u)} ${lerp(260, 470, u)}`} stroke="#ffb27a" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.7} strokeDasharray="2 14" />
          <InFlight x={lerp(1500, 900, u)} y={lerp(300, 470, u)} rot={-115} z={lerp(4.0, 6.0, u)}>
            <g transform="translate(0 26)"><Ship az={150} pal="day" t={t} heat={0.3 * (1 - u)} id="c7s" flapAft={40} /></g>
          </InFlight>
          <Clouds n={6} seed={21} y0={0} y1={1080} dx={t * 10} s={1.4} o={0.35} />
        </Frame>
      );
    },
  });

  // C8 — engines, control, a final manoeuvre beside a tower: three quick beats
  shots.push({
    id: 'C8a_engines', a: tEnginesC - 0.25, b: tControl - 0.12, tin: 'cut',
    render: (t) => (
      <Frame>
        <Sky k="night" />
        <g transform={`translate(960 540) scale(${lerp(70, 80, prog(t, tEnginesC - 0.25, tControl))})`}>
          <ShipEngineView lit={prog(t, tEnginesC, tEnginesC + 0.3)} hiSea={1} t={t} />
        </g>
      </Frame>
    ),
  });
  shots.push({
    id: 'C8b_control', a: tControl - 0.12, b: tFinal - 0.12, tin: 'cut',
    render: (t) => {
      const fl = 10 + 40 * smoother(prog(t, tControl, tControl + 0.5));
      return (
        <Frame>
          <Sky k="day" />
          <Streaks t={t} dir={[0, -1]} k={0.5} />
          <InFlight x={1100} y={560} rot={-90} z={30}>
            <g transform="translate(0 30)"><Ship az={150} pal="day" t={t} flapFwd={10} flapAft={fl} id="c8s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });
  shots.push({
    id: 'C8c_tower', a: tFinal - 0.12, b: tNext - 0.1, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [lerp(12, 16, prog(t, tFinal, tNext)), 98, 0], z: 13, yaw: 24, pitch: -3};
      return <CatchView t={t} c={c} l="day" s={{carY: 98, open: lerp(28, 18, ep(t, tFinal, tNext))}} hiRail={fadeWin(t, tFinal + 0.2, tNext + 1, 0.3)} />;
    },
  });

  // C9 — reentry survived; the subsonic belly-flop, one continuous shot: glow fades, clouds rise past, the camera
  // swings round to show the flaps working, then closes on the aft flap from above the hull (the view the real onboard
  // camera has as the ocean-return footage takes over)
  const oceanA = wt('S4_01', 'relight') - 4.85;
  shots.push({
    id: 'C9_bellyflop', a: tNext - 0.1, b: oceanA, tin: 'fade', td: 0.35,
    render: (t) => {
      const u = prog(t, tNext - 0.1, oceanA);
      const ff = 25 + 22 * Math.sin(t * 1.7) + 6 * noise(t * 2, 1);
      const fa = 30 - 18 * Math.sin(t * 1.7 + 0.8);
      const az = lerp(110, 58, ep(t, tNext + 0.6, wt('S4_00', 'flaps')));
      const close = ep(t, oceanA - 1.6, oceanA);
      const z = lerp(lerp(9, 14, ep(t, tNext, tNext + 4)), 34, close);
      const x = lerp(960, 960 - 17 * z, close), y = lerp(520, 660, close);
      const hiF = fadeWin(t, wt('S4_00', 'flaps') - 0.1, oceanA - 1.5, 0.25);
      return (
        <Frame>
          <Sky k="high" />
          <g opacity={prog(u, 0, 0.35)}><Sky k="day" /></g>
          <Clouds n={12} seed={41} y0={-300} y1={1400} dy={-t * 520} s={1.3} o={0.85 * prog(u, 0.1, 0.4)} />
          <Streaks t={t} dir={[0, -1]} k={0.45} />
          <InFlight x={x} y={y} rot={-90 + 2.5 * noise(t * 0.8, 5)} z={z}>
            <g transform="translate(0 26)"><Ship az={az} pal="day" heat={0.35 * (1 - prog(u, 0, 0.3))} t={t} flapFwd={ff} flapAft={fa} id="c9s" /></g>
          </InFlight>
          {svg(
            <>
              <Tag text="FLAPS" x={x - 14 * z - 200} y={300} to={[x - 14 * z, y - 3.5 * z]} o={hiF} size={36} />
              <Tag text="FLAPS" x={x + 19 * z + 240} y={300} to={[x + 19 * z, y - 3.5 * z]} o={hiF} size={36} align="r" />
            </>,
          )}
        </Frame>
      );
    },
  });
  return shots;
};

/** Small upward flow chevron. */
const Arrowish: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) =>
  o <= 0.01 ? null : <path d={`M${x - 26} ${y + 18} L${x} ${y - 8} L${x + 26} ${y + 18}`} stroke="#ffd6b0" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o * 0.8} />;
