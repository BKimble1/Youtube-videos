// Machine check sheets (coordination system). page 0: mark, eyes, drones, pole cams, barriers. page 1: wardens.
// page 2: hauler, cars, recovery arm, breaker. page 3: refuge attendants, service bot, cover sheet.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {SysMark, SensorEye, Drone, Warden, wardenWalker, WardenForearm, Hauler, AutoCar, BarrierGate, RecoveryArm, Breaker, breakerMuzzle, Projectile, PoleCam, Attendant, ServiceBot, CoverSheet} from '../mech';

const Lab: React.FC<{x: number; y: number; s: string; light?: boolean}> = ({x, y, s, light}) => <text x={x} y={y} textAnchor="middle" fontFamily={F.body} fontSize={20} fill={light ? '#EDE3D6' : C.inkSoft}>{s}</text>;

export const MechSheet: React.FC<{page: number}> = ({page}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const bg = (
    <g>
      <rect width={1920} height={540} fill="#5B4A4D" />
      <rect y={540} width={1920} height={540} fill={C.paper} />
    </g>
  );
  if (page === 0) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {bg}
        <SysMark x={110} y={110} r={60} />
        <Lab x={110} y={200} s="mark" light />
        {[0, 0.5, 1].map((l, i) => <SensorEye key={i} x={260 + i * 120} y={110} r={42} lock={l} glow={0.6} look={{x: i === 1 ? 0.8 : 0, y: 0}} id={`e${i}`} />)}
        <SensorEye x={620} y={110} r={42} open={0} />
        <Lab x={440} y={200} s="eye: observe / look / lock / shut" light />
        <Drone x={840} y={140} s={1.2} t={t} seed={1} face={0} />
        <Drone x={1080} y={140} s={1.2} t={t} seed={2} face={1} tilt={12} look={{x: 0.7, y: 0.5}} />
        <Drone x={1320} y={140} s={1.2} t={t} seed={3} face={-0.6} tilt={-8} lock={1} look={{x: -0.5, y: 0.6}} />
        <Drone x={1580} y={140} s={1.2} t={t} seed={4} smash={{t0: 0.5, dir: -30, groundY: 480}} />
        <Lab x={1200} y={260} s="drones: front / side / locked / smashed (t0 0.5)" light />
        <PoleCam x={260} y={520} s={0.32} t={t} pan={0} side={1} />
        <PoleCam x={420} y={520} s={0.32} t={t} pan={50} lock={0.4} side={1} />
        <PoleCam x={580} y={520} s={0.32} t={t} pan={90} lock={1} side={1} />
        <Lab x={420} y={530} s="pole cams" light />
        <BarrierGate x={760} y={980} s={0.4} t={t} kind="arm" open={1} />
        <BarrierGate x={960} y={980} s={0.4} t={t} kind="arm" open={0} len={800} />
        <BarrierGate x={1360} y={980} s={0.45} t={t} kind="bollards" up={(t % 2) / 2} n={4} />
        <BarrierGate x={1640} y={980} s={0.45} t={t} kind="slide" open={0.3} len={500} />
        <Lab x={1200} y={1020} s="barriers: arm open / closed, bollards, slide" />
        <Drone x={300} y={800} s={2.4} t={t} seed={7} face={0.3} look={{x: 0.2, y: 0.4}} lock={0.6} />
        <Lab x={300} y={960} s="drone close" />
      </svg>
    );
  }
  if (page === 1) {
    const G = 500, G2 = 1040;
    const walk = wardenWalker(700, 60 + t * 160, 1, G, {t, s: 0.8, seed: 3, look: {x: 0.4, y: 0}});
    const torn = {x: 1180, y: G2, s: 0.8, t, seed: 8, yaw: 50, tear: 0.55, lock: 1, armR: {hand: {x: 1290, y: G2 - 300}}, sparks: [{t0: 0.8, where: 'chestL' as never}]};
    const broken = {x: 1520, y: G2, s: 0.8, t, seed: 9, yaw: -60, tear: 1, armOff: {side: 'R' as const, dx: 130, dy: 60, rot: 70}, leak: {t0: 0, amt: 1, groundY: G2}, eyeOpen: 0.3, lean: 12};
    const fallen = {x: 1790, y: G2, s: 0.8, t, seed: 10, yaw: 90, tear: 0.9, fall: {ang: 58, px: 1790, py: G2}, eyeOpen: 0, legL: {foot: {x: 1760, y: G2 - 22}}, legR: {foot: {x: 1820, y: G2 - 22}}};
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {bg}
        <Warden x={160} y={G} s={0.8} t={t} seed={1} />
        <Warden x={420} y={G} s={0.8} t={t} seed={2} yaw={40} lock={0.3} look={{x: 0.5, y: 0.2}} armR={{hand: {x: 560, y: G - 330}}} beam={{amt: 1, side: 'R', dir: 10, len: 700}} />
        <Warden {...walk} />
        <Warden x={1400} y={G} s={0.8} t={t} seed={4} yaw={-90} lean={24} drop={40} lock={1} legL={{foot: {x: 1320, y: G - 21}}} legR={{foot: {x: 1470, y: G - 21}}} armL={{hand: {x: 1220, y: G - 290}}} armR={{hand: {x: 1240, y: G - 230}}} />
        <Warden x={1700} y={G} s={0.8} t={t} seed={5} yaw={140} />
        <Lab x={160} y={530} s="front" light /><Lab x={420} y={530} s="3/4 + guidance beam" light /><Lab x={900} y={530} s="walk (profile)" light /><Lab x={1350} y={530} s="lunge, locked" light /><Lab x={1700} y={530} s="back 3/4" light />
        <Warden x={200} y={G2} s={0.8} t={t} seed={6} yaw={20} tear={0.2} />
        <Warden x={520} y={G2} s={0.8} t={t} seed={7} yaw={20} tear={0.45} />
        <Warden x={860} y={G2} s={0.8} t={t} seed={11} yaw={20} tear={0.8} crackle={1} />
        <Warden {...torn} sparks={[{t0: 0.8, where: 'chest'}]} />
        <Warden {...broken} />
        <WardenForearm x={1600} y={G2 - 80} ang={200} s={0.8} t={t} leak={0.6} />
        <Warden {...fallen} />
        <Lab x={520} y={1070} s="tear 0.2 / 0.45 / 0.8" /><Lab x={1180} y={1070} s="torn + sparks" /><Lab x={1520} y={1070} s="arm off + leak" /><Lab x={1790} y={1070} s="falling" />
      </svg>
    );
  }
  if (page === 2) {
    const G = 500, G2 = 1040;
    const bp = {x: 1500, y: G2, s: 0.42, t, aim: 18 + 6 * Math.sin(t), fire: {t0: 1.0}, seed: 2};
    const mz = breakerMuzzle(bp);
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {bg}
        <Hauler x={330} y={G} s={0.36} t={t} dist={t * 400} lights={1} />
        <Hauler x={930} y={G} s={0.36} t={t} dir={-1} crush={0.8} sparkT0={0.3} lights={0} lock={1} />
        {[0, 1, 2, 3].map((v) => <AutoCar key={v} x={1300 + (v % 2) * 360} y={G - (v < 2 ? 240 : 0)} s={0.28} t={t} variant={v} dist={t * 300} lights={v % 2} wreck={v === 3 ? 0.7 : 0} dir={v === 2 ? -1 : 1} />)}
        <Lab x={330} y={530} s="hauler (lights)" light /><Lab x={930} y={530} s="hauler crushed ram" light /><Lab x={1480} y={530} s="autonomous cars" light />
        {/* recovery arm lifting a placeholder overturned taxi */}
        {(() => {
          const lift = Math.max(0, Math.sin(t * 1.2)) * 60;
          const tgt = {x: 640, y: G2 - 200 - lift};
          return (
            <g>
              <rect x={540} y={G2 - 200 - lift} width={300} height={130} rx={20} fill="#F6B91C" stroke={C.ink} strokeWidth={4} />
              <RecoveryArm x={230} y={G2} s={0.5} t={t} target={tgt} clawAng={90} open={0.15} lock={0.3} strain={0.6} />
            </g>
          );
        })()}
        <Lab x={420} y={1070} s="recovery arm (IK to target)" />
        <Breaker {...bp} />
        <Projectile x={mz.x + (t > 1 ? (t - 1) * 900 : 0) * Math.cos((mz.ang * Math.PI) / 180)} y={mz.y + (t > 1 ? (t - 1) * 900 : 0) * Math.sin((mz.ang * Math.PI) / 180)} ang={mz.ang} s={0.6} />
        <Breaker x={1050} y={G2} s={0.42} t={t} dir={-1} crushed={0.8} crushT0={0.2} aim={-10} groundY={G2} />
        <Lab x={1050} y={1070} s="breaker crushed" /><Lab x={1500} y={1070} s="breaker aim + fire (t0 1.0)" />
      </svg>
    );
  }
  if (page === 4) {
    // close-ups at shot scale
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#4E3F43" />
        <Warden x={330} y={1500} s={2.2} t={t} seed={4} yaw={80} lock={Math.min(1, t)} look={{x: 0.6, y: 0.1}} headPitch={6} />
        <Warden x={800} y={1500} s={2.2} t={t} seed={5} yaw={-30} tear={0.7} lock={1} armOff={{side: 'L', dx: -60, dy: 200, rot: -40}} leak={{t0: 0, amt: 1}} crackle={1} />
        <PoleCam x={1250} y={1400} s={1.1} t={t} pan={35} lock={0.8} side={-1} />
        <Drone x={1650} y={260} s={2.6} t={t} seed={9} face={-0.4} tilt={-6} look={{x: -0.4, y: 0.6}} lock={0.3} />
        <Drone x={1650} y={700} s={2.6} t={t} seed={10} smash={{t0: 1.05, dir: 200, power: 0.6}} />
        <Hauler x={1500} y={1080} s={0.5} t={t} crush={Math.min(1, t)} sparkT0={1.0} />
      </svg>
    );
  }
  // page 3: the refuge
  const G = 1000;
  const bedY = G - 180;
  const body = (x: number) => (x < 420 || x > 900 ? bedY : bedY - 60 - 30 * Math.sin(((x - 420) / 480) * Math.PI) - (x < 520 ? 40 : 0));
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080">
      <rect width={1920} height={1080} fill="#F4EAD6" />
      <rect y={G} width={1920} height={80} fill="#E6D8BC" />
      <Attendant x={200} y={G} s={0.9} t={t} />
      <Attendant x={560} y={G - 400} s={0.7} t={t} urgent={1} face={0.6} scan={{amt: 1, x: 820, y: G - 300}} handR={{x: 720, y: G - 520}} />
      <Lab x={200} y={1050} s="attendant idle" /><Lab x={560} y={640} s="urgent + scanner" />
      {/* bed with a still figure stand-in and the sheet being drawn */}
      <rect x={380} y={bedY} width={560} height={40} rx={10} fill="#DDD6C6" stroke={C.ink} strokeWidth={4} />
      <rect x={400} y={bedY + 40} width={20} height={140} fill="#9AA" /><rect x={900} y={bedY + 40} width={20} height={140} fill="#9AA" />
      <path d={`M 420 ${bedY} L 420 ${bedY - 100} Q 470 ${bedY - 130} 520 ${bedY - 90} L 900 ${bedY - 60} L 900 ${bedY} Z`} fill="#1CA7A0" opacity={0.6} />
      <CoverSheet x0={920} x1={400} ySurf={bedY} top={body} progress={Math.min(1, t / 2)} lift={40} />
      <Attendant x={1060} y={G} s={0.9} t={t} stopped={1} face={-0.7} handL={{x: 920 - Math.min(1, t / 2) * 300, y: bedY - 130}} handR={{x: 980, y: bedY - 60}} />
      <Lab x={760} y={1050} s="stopped; sheet drawn (progress t/2)" />
      <ServiceBot x={1450} y={G} s={1} t={t} reach={{x: 1600, y: G - 120 + 40 * Math.sin(t * 2)}} grip={0.7}>
        <path d="M -40 -6 Q -46 -36 0 -40 Q 46 -36 40 -6 Z" fill="#1CA7A0" stroke={C.ink} strokeWidth={4} />
      </ServiceBot>
      <ServiceBot x={1750} y={G} s={0.8} t={t} dir={-1} dist={t * 200} />
      <Lab x={1600} y={1050} s="service bots (tray item)" />
    </svg>
  );
};
