// V4 opening (new narration N0): the news first. Real booster catch → the empty arms waiting for the second target,
// identified as the Oct 20 Flight 15 plan → orbit-to-return in one move → two separate journeys → the real stack
// named stage by stage → real separation → one connected move from the arriving ship to the rails and down to the
// site the rails stand on.
import React from 'react';
import {ep, prog, lerp, fadeWin, smoother} from '../../kit/anim';
import {Cam3, V3, proj} from '../cam3';
import {ArmState, CAR_DEFAULT, MOUNT_TOP, Place, VX, azFor} from '../site';
import {Booster, Ship} from '../vehicles';
import {Credit, Frame, Limb, Sky, Tag, Word} from '../scene';
import {F5, F14L, F14S, Footage, Shot, TELEM_CROP} from '../timeline';
import {CatchView, InFlight, ShipAt, Streaks, shipRestY} from './common';
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

  // O1 — frame zero: the real Flight 5 catch, booster entering the arms
  const o2a = tMusk - 0.35;
  shots.push({
    id: 'O1_realCatch', a: 0, b: o2a,
    render: (t) => <Footage file={F5} a={0} src0={4.6} scale={1.12} cx={0.42} cy={0.42}>{svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, 0.3, o2a, 0.25)} />)}</Footage>,
  });

  // O2 — the same tower position, drawn: the arms open and empty, the camera tilts up to the second target — the ship,
  // upright on its engines high above them. Identified once: OCT 20 · FLIGHT 15.
  const o3a = tAfter + 0.05;
  shots.push({
    id: 'O2_secondTarget', a: o2a, b: o3a, tin: 'column',
    render: (t) => {
      const u = ep(t, o2a, o3a);
      const c: Cam3 = {at: [14, lerp(CAR + 4, CAR + 46, u), 0], z: lerp(7.2, 5.2, u), yaw: -24, pitch: lerp(6, 12, u)};
      const s: ArmState = {carY: CAR, open: lerp(34, 26, u)};
      const above = lerp(150, 118, u);
      const k = prog(t, tCraft - 0.6, tCraft);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tCraft - 0.2, o3a + 1, 0.3) * 0.8}
          vehicle={<g opacity={k}><ShipAt c={c} carY={CAR} above={above} l="day" props={{engines: 1, t, plumeLen: 24, flapFwd: 60, flapAft: 70, id: 'o2s'}} /></g>}
          overlay={svg(<IdChip text="OCT 20 · FLIGHT 15" o={idO(t)} />)}
        />
      );
    },
  });

  // O3 — "after it comes back from orbit": one move, orbit to entry — the ship crossing the limb turns belly-first and
  // starts to glow as the camera drops with it
  const o4a = tAnn - 0.1;
  shots.push({
    id: 'O3_orbitReturn', a: o3a, b: o4a, tin: 'cut',
    render: (t) => {
      const u = ep(t, o3a, o4a, (v) => v);
      return (
        <Frame>
          <Sky k="space" />
          <g transform={`rotate(${lerp(0, -8, u)} 960 540)`}>
            <Limb top={lerp(880, 620, smoother(u))} r={5200} glow={1} scroll={t * 300} />
            <InFlight x={lerp(1250, 860, u)} y={lerp(420, 520, u)} rot={lerp(90, 66, smoother(prog(u, 0.2, 0.7)))} z={lerp(5, 8, u)}>
              <g transform="translate(0 26)"><Ship az={lerp(120, 30, smoother(prog(u, 0.2, 0.8)))} t={t} pal="space" heat={prog(u, 0.45, 0.95)} id="o3s" /></g>
            </InFlight>
          </g>
          {svg(<IdChip text="OCT 20 · FLIGHT 15" o={idO(t)} />)}
        </Frame>
      );
    },
  });

  // O4 — both stages, one mission: two separate journeys from one launch. The booster's short return comes home first;
  // the ship's long flight comes back to the same arms later. No simultaneous arrival.
  const o5a = tSH - 0.15;
  shots.push({
    id: 'O4_twoJourneys', a: o4a, b: o5a, tin: 'cut',
    render: (t) => {
      const pad: [number, number] = [520, 860];
      const up = (u: number): [number, number] => [lerp(pad[0], 900, u), lerp(pad[1], 330, Math.pow(u, 0.8))];
      const bk = (u: number): [number, number] => [lerp(900, pad[0] + 30, u), lerp(330, pad[1] - 120, Math.pow(u, 1.4)) - Math.sin(u * Math.PI) * 140];
      const out = (u: number): [number, number] => [lerp(900, 2100, u), lerp(330, 120, Math.sqrt(u))];
      const back = (u: number): [number, number] => [lerp(-200, pad[0] + 30, u), lerp(160, pad[1] - 120, Math.pow(u, 1.6))];
      const uL = ep(t, o4a, o4a + 1.1);
      const uB = ep(t, o4a + 1.1, tBoth + 0.3);
      const uO = ep(t, o4a + 1.1, tBoth + 0.6);
      const uR = ep(t, tOne - 0.4, o5a - 0.05);
      const line = (f: (u: number) => [number, number], u: number, col: string, w = 7) =>
        u <= 0 ? null : <polyline points={Array.from({length: 40}, (_, i) => f((i / 39) * u)).map((p) => p.join(',')).join(' ')} stroke={col} strokeWidth={w} strokeLinecap="round" strokeDasharray="2 14" fill="none" />;
      const dot = (p: [number, number], col: string, label: string, o: number) => (
        <g opacity={o}>
          <circle cx={p[0]} cy={p[1]} r={16} fill={col} stroke={C.ink} strokeWidth={4} />
          <text x={p[0] + 26} y={p[1] + 10} fontFamily={FONT.title} fontWeight={700} fontSize={30} fill={C.cream} stroke={C.ink} strokeWidth={4} style={{paintOrder: 'stroke'}}>{label}</text>
        </g>
      );
      const towerX = pad[0] + 30;
      return (
        <Frame>
          <Sky k="day" horizon={0.82} />
          <rect x={0} y={880} width={1920} height={200} fill="#cbbf9c" />
          <rect x={1100} y={880} width={820} height={200} fill="#4d8db4" />
          <rect x={1080} y={880} width={30} height={200} fill="#ddd2b0" />
          <g>
            <rect x={towerX - 10} y={720} width={20} height={160} fill="#76808a" />
            <rect x={towerX + 10} y={752} width={44} height={8} fill="#66707a" />
          </g>
          {line(up, uL, '#fbf4e4')}
          {line(bk, uB, C.yellow)}
          {line(out, uO, '#9fd3ff')}
          {line(back, uR, '#9fd3ff')}
          {dot(bk(1), C.yellow, '1 · BOOSTER', prog(t, tBoth - 0.2, tBoth + 0.2))}
          {dot([towerX + 30, pad[1] - 150], '#9fd3ff', '2 · SHIP, AFTER ITS FLIGHT', prog(t, o5a - 0.5, o5a - 0.2))}
          {uL > 0 && uL < 1 ? <InFlight x={up(uL)[0]} y={up(uL)[1]} rot={lerp(0, 30, uL)} z={1.2}><g transform="translate(0 60)"><Booster az={70} pal="day" t={t} engines={1} plumeLen={20} id="o4b" /></g></InFlight> : null}
          {svg(<IdChip text="OCT 20 · FLIGHT 15" o={idO(t)} />)}
        </Frame>
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

  // O9 — the second catch, one connected move: from the ship hovering down on its engines, to the receiving rails it
  // has to meet, down the tower to the carriage, and out over the site that all of it stands on (daylight, rebuilt pad)
  shots.push({
    id: 'O9_shipToSite', a: o9a, b: s2 - 0.18, tin: 'cut',
    render: (t) => {
      const above = lerp(30, 16, ep(t, o9a, s2));
      const shipC: V3 = [VX, shipRestY(CAR) + above + 30, 0];
      const rail: V3 = [VX - 6, CAR + 2, 0];
      const site: V3 = [-8, 46, -8];
      const u1 = ep(t, o9a, tSecond + 0.5), u2 = ep(t, tMiss - 0.2, tCatcher + 0.3);
      const at: V3 = u2 > 0 ? [lerp(rail[0], site[0], u2), lerp(rail[1], site[1], u2), lerp(rail[2], site[2], u2)] : [lerp(shipC[0], rail[0], u1), lerp(shipC[1], rail[1], u1), 0];
      const z = u2 > 0 ? Math.exp(lerp(Math.log(13), Math.log(3.6), u2)) : Math.exp(lerp(Math.log(7), Math.log(13), u1));
      const c: Cam3 = {at, z, yaw: lerp(-20, -36, u1 * 0.5 + u2 * 0.5), pitch: lerp(4, -12, u2)};
      const s: ArmState = {carY: CAR, open: lerp(30, 22, u1)};
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tSecond - 0.2, tMiss + 0.3, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="day" props={{engines: 1, t, plumeLen: 22, flapFwd: 60, flapAft: 70, id: 'o9s'}} />} />
      );
    },
  });
  return shots;
};
export {MOUNT_TOP, Place, azFor, proj};
