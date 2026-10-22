// V4 opening (new narration N0): the news first. Real booster catch → the empty arms waiting for the second target,
// identified as the Oct 20 Flight 15 plan → orbit-to-return in one move → two separate journeys → the real stack
// named stage by stage → real separation → one connected move from the arriving ship to the rails and down to the
// site the rails stand on.
import React from 'react';
import {ep, prog, lerp, fadeWin, smoother} from '../../kit/anim';
import {AbsoluteFill} from 'remotion';
import {Cam3, V3, proj} from '../cam3';
import {ArmState, ARM_Z, CAR_DEFAULT, MOUNT_TOP, Place, RAIL_DY, VX, azFor} from '../site';
import {Booster, Ship} from '../vehicles';
import {Credit, Frame, Limb, Sky, Tag, Word} from '../scene';
import {F5, F14L, F14S, Footage, Shot, TELEM_CROP} from '../timeline';
import {CatchView, InFlight, ShipAt, BoosterAt, Streaks, approach, throttle, shipRestY} from './common';
import {ls, wt} from '../time';
import {C, FONT} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = CAR_DEFAULT;

/** Small identification chip (top-left). */
export const IdChip: React.FC<{text: string; o: number}> = ({text, o}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <rect x={56} y={52} width={text.length * 19 + 44} height={52} rx={10} fill="rgba(16,20,26,0.78)" />
      <text x={78} y={88} fontFamily={FONT.title} fontWeight={700} fontSize={30} fill={C.cream} letterSpacing={2.4}>{text}</text>
    </g>
  );

export const openShots = (): Shot[] => {
  const shots: Shot[] = [];
  const tMusk = wt('N0_01', 'elon'), tCraft = wt('N0_01', 'spacecraft'), tAfter = wt('N0_01', 'too—after');
  const tAnn = ls('N0_02'), tBoth = wt('N0_02', 'both'), tOne = wt('N0_02', 'one');
  const tSH = ls('N0_03'), tSS = ls('N0_04'), tTogether = ls('N0_05'), tReturn = wt('N0_05', 'return');
  const tHard = ls('N0_06'), tSecond = wt('N0_06', 'second'), tMiss = ls('N0_07'), tCatcher = wt('N0_07', 'catcher');
  const s2 = ls('S2_00');
  const idO = (t: number) => fadeWin(t, tMusk + 0.3, tSH - 0.2, 0.3);

  // O1 — frame zero: the real Flight 5 catch in progress — booster on its landing burn above the arms; a restrained crop
  // so booster, arms and burn read on a phone
  const o2a = tMusk - 0.35;
  shots.push({
    id: 'O1_realCatch', a: 0, b: o2a,
    render: (t) => <Footage file={F5} a={0} src0={4.6} scale={1.38} cx={0.47} cy={0.36}>{svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, 0.3, o2a, 0.25)} />)}</Footage>,
  });

  // O2 — a straight cut to the harder thing, same arrangement (tower left, vehicle right, arms open toward it): the
  // pointed ship already descending on its engines toward the open arms. OCT 20 · FLIGHT 15 identified once.
  const o3a = tAfter + 0.05;
  shots.push({
    id: 'O2_shipToArms', a: o2a, b: o3a, tin: 'cut',
    render: (t) => {
      const u = ep(t, o2a, o3a, (v) => v);
      const above = lerp(34, 12, Math.pow(u, 0.85));
      const yc = CAR - 6.4 + above; // ship centre
      const k = smoother(u);
      // the camera settles onto the ship as it brakes toward the arms, ending centred at the size O3 picks up
      const c: Cam3 = {at: [lerp(VX - 7, VX, k), lerp(CAR + 16, yc, k), 0], z: lerp(8.2, 10, k), yaw: -10, pitch: 3};
      const s: ArmState = {carY: CAR, open: lerp(28, 14, ep(t, o2a + 0.8, o3a))};
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tCraft - 0.3, o3a + 1, 0.3) * 0.8}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="day" props={{engines: 1, t, plumeLen: 26, flapFwd: 60, flapAft: 70, id: 'o2s'}} />}
          overlay={svg(<IdChip text="OCT 20 · FLIGHT 15" o={idO(t)} />)}
        />
      );
    },
  });

  // O3 — matched into orbit: the same ship, same place and size, upright against space; it pitches over to belly-first
  // and its black heat shield turns to the camera as the entry glow builds — clearly not the blunt booster
  const o4a = tAnn - 0.1;
  shots.push({
    id: 'O3_orbitReturn', a: o3a, b: o4a, tin: 'cut',
    render: (t) => {
      const u = ep(t, o3a, o4a, (v) => v);
      const pitch = smoother(prog(u, 0.12, 0.75));
      return (
        <Frame>
          <Sky k="space" />
          <Limb top={lerp(1150, 760, smoother(u))} r={5200} glow={1} scroll={t * 300} />
          <InFlight x={lerp(960, 980, u)} y={lerp(540, 500, u)} rot={lerp(0, -72, pitch)} z={lerp(10, 8.5, u)}>
            <g transform="translate(0 26)"><Ship az={lerp(90, 22, pitch)} t={t} pal="space" heat={prog(u, 0.5, 1)} flapFwd={20} flapAft={20} id="o3s" /></g>
          </InFlight>
          {svg(<IdChip text="OCT 20 · FLIGHT 15" o={idO(t)} />)}
        </Frame>
      );
    },
  });

  // O4 — both stages, one mission, in sequence: two large side-by-side views of the same arms. First the blunt booster
  // comes down on its engines and is caught (1); then, after its flight, the pointed ship (2). Never together.
  const o5a = tSH - 0.15;
  shots.push({
    id: 'O4_twoCatches', a: o4a, b: o5a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 5, CAR - 20, 0], z: 6.6, yaw: -16, pitch: 4};
      const bc = tBoth + 0.1, sc = o5a - 0.35;
      const bAbove = approach(t, o4a - 0.4, bc, 46, 0.25);
      const sAbove = approach(t, bc + 0.3, sc, 46, 0.25);
      const half = (side: -1 | 1, node: React.ReactNode, dim: number, label: string, lo: number) => (
        <div style={{position: 'absolute', inset: 0, clipPath: side < 0 ? 'inset(0 960px 0 0)' : 'inset(0 0 0 960px)'}}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${side * 480}px)`}}>{node}</div>
          <div style={{position: 'absolute', inset: 0, background: '#0b0d14', opacity: dim}} />
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <text x={side < 0 ? 480 : 1440} y={190} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={44} fill={C.cream} stroke={C.ink} strokeWidth={5} style={{paintOrder: 'stroke'}} opacity={lo}>{label}</text>
          </svg>
        </div>
      );
      return (
        <AbsoluteFill>
          {half(-1, <CatchView t={t} c={c} l="day" s={{carY: CAR, open: lerp(20, 4, ep(t, o4a, bc))}}
            vehicle={<BoosterAt c={c} carY={CAR} above={bAbove} v="v3" l="day" heading={0} props={{engines: throttle(t, o4a - 0.4, bc, 0.5), t, plumeLen: 30, id: 'o4b'}} />} />,
            0.32 * prog(t, bc + 0.3, bc + 0.8), '1 · BOOSTER', prog(t, o4a + 0.1, o4a + 0.4))}
          {half(1, <CatchView t={t} c={c} l="day" s={{carY: CAR, open: lerp(20, 4, ep(t, bc + 0.3, sc))}}
            vehicle={t > bc ? <ShipAt c={c} carY={CAR} above={sAbove} l="day" props={{engines: throttle(t, bc + 0.3, sc, 0.5), t, plumeLen: 26, flapFwd: 60, flapAft: 70, id: 'o4s'}} /> : null} />,
            0.45 * (1 - prog(t, bc - 0.1, bc + 0.3)), '2 · SHIP, AFTER ITS FLIGHT', prog(t, bc - 0.1, bc + 0.2))}
          {svg(<><rect x={956} y={0} width={8} height={1080} fill="#0b0d14" /><IdChip text="OCT 20 · FLIGHT 15" o={idO(t)} /></>)}
        </AbsoluteFill>
      );
    },
  });

  // O5 — the stack itself: Super Heavy named beside the booster, then Starship beside the ship (real Flight 14)
  const o6a = tSS - 0.12;
  shots.push({
    id: 'O5_realStackBooster', a: o5a, b: o6a, tin: 'cut',
    render: (t) => (
      <Footage file={F14L} a={o5a} src0={0.6} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(
          <>
            <Tag text="SUPER HEAVY" x={1210} y={720} to={[1000, 720]} o={fadeWin(t, tSH + 0.05, o6a, 0.2)} size={40} />
            <Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, o5a + 0.1, o6a, 0.2)} />
          </>,
        )}
      </Footage>
    ),
  });
  const o7a = tTogether - 0.08;
  shots.push({
    id: 'O6_realStackShip', a: o6a, b: o7a, tin: 'cut',
    render: (t) => (
      <Footage file={F14L} a={o6a} src0={3.55} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(<Tag text="STARSHIP" x={1230} y={250} to={[1010, 230]} o={fadeWin(t, tSS + 0.05, o7a, 0.2)} size={40} />)}
      </Footage>
    ),
  });
  // O7 — launched together (the joined stack seen from the ship), then they part: the real hot-staging flash (source
  // 12.9 s) lands on "return"
  const o9a = tHard - 0.1;
  shots.push({
    id: 'O7_realSeparation', a: o7a, b: o9a, tin: 'cut',
    render: (t) => <Footage file={F14S} a={o7a} src0={12.9 - (tReturn - o7a)} scale={TELEM_CROP} cx={0.5} cy={0}>{svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, o7a + 0.1, o9a, 0.2)} />)}</Footage>,
  });

  // O9 — the second catch, at mechanism scale: the ship's support region comes down toward the receiving rail; on
  // "Miss badly" a small sideways error carries it to the rail's inner edge (that is how the catcher gets hurt), then the
  // alignment is restored and the descent continues. Illustrative; no crash is shown.
  shots.push({
    id: 'O9_supportToRail', a: o9a, b: s2 - 0.18, tin: 'cut',
    render: (t) => {
      const above = lerp(16, 1.4, ep(t, o9a, tSecond + 0.8));
      const err = ep(t, tMiss - 0.05, tMiss + 0.75) * (1 - ep(t, tCatcher - 0.2, tCatcher + 0.8));
      const dz = -1.25 * err;
      const fitW: V3 = [VX, CAR + RAIL_DY + above + 0.6, ARM_Z - 1.3];
      const c: Cam3 = {at: [VX - 2, CAR + RAIL_DY + 2 + above * 0.4, ARM_Z - 2], z: lerp(9, 19, ep(t, o9a, tSecond + 0.8)) + 2 * ep(t, tMiss - 0.3, tMiss + 0.6), yaw: -34, pitch: -14};
      const s: ArmState = {carY: CAR, open: 4};
      const edge = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3 - 0.4]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={0.35}
          vehicle={<ShipAt c={c} carY={CAR} above={above} dz={dz} l="day" props={{engines: 0.9, t, plumeLen: 18, flapFwd: 60, flapAft: 70, id: 'o9s'}} />}
          overlay={svg(<ellipse cx={edge[0]} cy={edge[1]} rx={90} ry={34} fill="none" stroke={C.red} strokeWidth={8} opacity={err * 0.9} />)} />
      );
    },
  });
  return shots;
};
export {MOUNT_TOP, Place, azFor, proj};
