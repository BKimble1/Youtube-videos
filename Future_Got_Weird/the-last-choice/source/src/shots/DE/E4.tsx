// E4 — Days, briefly. One wide, held, while the light turns from night to dawn: a service bot sets a meal on the
// table where the carrier and the teammate sit; an attendant collects the builder's tool bag from beside them and locks
// it in a wall locker (its lamp turns amber) while the builder watches; beyond the glass, a crane sets panels on a
// ruined building one at a time — reconstruction that takes nights, not seconds. (7.4 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Attendant, ServiceBot} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, easeOut, V2} from '../../kit/math';
import {RefugeInteriorBack, InteriorFloor, Table, tableTop, MealTray, Locker, Bench, benchTop} from '../../sets/refugeInterior';
import {FarBank, River, ReconstructionSite, PatrolDrones} from '../../sets/refugeFar';
import {refLight} from '../../sets/refugeLight';
import {C, SYS, REF} from '../../theme';
import {mixHex} from '../../fx/common';
import {Tint, seated} from './common';
import {ToolBag} from '../AB/props';

const ID = 'E4';
export const e4Time = (t: number) => lerp(3.0, 3.97, easeInOut(seg(t, 1.6, 7.2))); // night → dawn

const Stool: React.FC<{x: number; y: number; s: number; ink: number}> = ({x, y, s, ink}) => (
  <g>
    <rect x={x - 8 * s} y={y - 100 * s} width={16 * s} height={100 * s} fill="#9AA5AB" stroke={C.ink} strokeWidth={ink * 0.7} />
    <rect x={x - 60 * s} y={y - 112 * s} width={120 * s} height={18 * s} rx={8 * s} fill="#7FB0A0" stroke={C.ink} strokeWidth={ink} />
  </g>
);

const E4: React.FC = () => {
  const {t, T} = useShot(ID);
  const time = e4Time(t);
  const L = refLight(time);
  const cam = camAt(60, -380, 960, 540, 0.95);
  const ink = inkFor(cam.z, 1);
  // ---- the table (left): carrier and teammate; the meal arrives on a bot
  const TX = -560, TY = 30, TS = 1;
  const tTop = tableTop(TY, TS);
  const botIn = easeOut(seg(t, 0.2, 1.8));
  const setDown = easeInOut(seg(t, 1.9, 2.5));
  const bx = lerp(-1400, TX - 230, botIn) - 500 * easeInOut(seg(t, 3.0, 4.6));
  const trayW: V2 = {x: lerp(bx, TX + 10, setDown), y: lerp(TY + 40 - 223, tTop, setDown) - Math.sin(Math.PI * setDown) * 30};
  const carrier = seated(look('carrier'), TX - 250, TY, benchTop(TY, 1) + 3, {t, s: 1, yaw: 74, z: 0, seed: 42, knees: 70, spread: 34});
  const mate = seated(look('teammate'), TX + 250, TY, benchTop(TY, 1) + 3, {t, s: 1, yaw: -74, z: 0, seed: 33, knees: 70, spread: 34});
  const wake = smooth(seg(t, 4.5, 6.5)); // they stir as the light comes
  const carrierP: ActorProps = {...carrier, lean: lerp(30, 12, wake), head: {pitch: lerp(30, 6, wake), yaw: 0},
    armR: {hand: {x: TX - 110, y: tTop - 10, z: 30}}, armL: {hand: {x: TX - 120, y: tTop - 6, z: -30}},
    face: {closed: wake < 0.5, mouth: 'flat', lids: 0.5, worry: 0.4}, dmg: dmg('carrier', T), breath: 0.3};
  const mateP: ActorProps = {...mate, lean: lerp(24, 8, wake), head: {pitch: lerp(26, 4, wake)},
    armR: {hand: {x: TX + 120, y: tTop - 8, z: 30}}, face: {closed: wake < 0.6, mouth: 'flat', lids: 0.45, worry: 0.5}, dmg: dmg('teammate', T), breath: 0.3};
  // ---- the builder (right), their tool bag on the floor; an attendant locks it away
  const BX = 380, BY = 40;
  const builder = seated(look('builder'), BX, BY, benchTop(BY, 1), {t, s: 1, yaw: 30, z: 0, seed: 41, knees: 72, spread: 40});
  const bagFloor: V2 = {x: BX + 170, y: BY - 108};
  const LX = 800, LY = -20;
  const aIn = easeOut(seg(t, 1.8, 2.7));
  const carry = easeInOut(seg(t, 2.95, 3.7));
  const open = smooth(seg(t, 3.5, 3.85)) * (1 - smooth(seg(t, 4.25, 4.6)));
  const locked = smooth(seg(t, 4.6, 4.75));
  const ax = lerp(1300, BX + 280, aIn) + (LX - 120 - (BX + 280)) * carry;
  const grab = t > 2.85;
  const handW: V2 = grab ? (t < 4.1 ? {x: lerp(bagFloor.x, LX - 10, carry), y: lerp(bagFloor.y, LY - 260, carry) - Math.sin(Math.PI * carry) * 30} : {x: LX - 40, y: LY - 240}) : {x: ax - 70, y: -180};
  const bagIn = t > 4.15;
  const watch = smooth(seg(t, 2.4, 3.0));
  const builderP: ActorProps = {...builder, lean: 8 + 6 * watch, head: {yaw: -26 * watch, pitch: 6},
    armL: {hand: {x: BX + 70 + 40 * watch * (1 - smooth(seg(t, 4.2, 5.0))), y: benchTop(BY, 1) - 60 - 40 * watch * (1 - smooth(seg(t, 4.2, 5.0))), z: 80}},
    face: {mouth: watch > 0.3 ? 'flat' : 'soft', worry: 0.3 + 0.4 * watch, brows: -0.2 * watch, lids: 0.3, lookX: 0.8 * watch}, dmg: dmg('builder', T), breath: 0.3};
  // ---- far view: the city, the reconstruction (progress advances a few panels), drones
  const progress = lerp(0.3, 0.43, seg(t, 0, 7.4));
  const outside = (
    <g>
      <g transform="translate(0 -330) scale(0.62) translate(0 330)">
        <FarBank x0={-3800} x1={3800} y={-330} t={t} time={time} ink={ink} seed={14} height={700} />
        <ReconstructionSite x={-560} y={-330} s={1.45} progress={progress} t={t} time={time} ink={ink} seed={4} />
      </g>
      <River x0={-2600} x1={2600} y={-360} depth={40} t={t} time={time} ink={ink} seed={14} />
      <PatrolDrones x0={-1800} x1={1800} y={-900} n={2} t={t} seed={5} s={0.7} />
    </g>
  );
  const night = L.lamps;
  return (
    <Frame bg="#1E2236">
      <Layer cam={cam} p={1}>
        <RefugeInteriorBack x0={-2600} x1={2600} yFloor={-330} yTop={-1800} time={time} t={t} people={0} ink={ink} seed={9} plants={false} outside={outside} />
        <InteriorFloor x0={-2600} x1={2600} y={-330} depth={900} time={time} ink={ink} />
        {/* partition with the wall lockers (right) */}
        <rect x={LX - 170} y={-760} width={420} height={760} fill={mixHex('#E6DCC6', '#2E3550', 0.4 * night)} stroke={C.ink} strokeWidth={ink} />
        <Locker x={LX + 120} y={LY} s={0.95} open={0} t={t} ink={ink} light="locked" />
        <Locker x={LX - 30} y={LY} s={0.95} open={open} t={t} ink={ink} light={locked > 0.5 ? 'locked' : 'idle'} />
        {bagIn && open > 0.05 && <ToolBag x={LX - 34} y={LY - 250} s={0.8} ink={ink} tablet={false} />}
        {/* table group */}
        <Stool x={TX - 250} y={TY} s={1} ink={ink} />
        <Stool x={TX + 250} y={TY} s={1} ink={ink} />
        <Cast actors={[carrierP, mateP]} />
        <Table x={TX} y={TY} s={TS} w={380} ink={ink} />
        {setDown > 0.98 && <MealTray x={TX + 10} y={tTop} s={0.9} ink={ink} t={t} warm={1 - smooth(seg(t, 4.5, 7.0)) * 0.6} />}
        <ServiceBot x={bx} y={TY + 40} s={1} t={t} seed={5} dir={1} dist={bx} ink={ink} reach={setDown > 0 && setDown < 1 ? trayW : undefined}>
          {setDown <= 0 ? <MealTray x={0} y={0} s={0.9} ink={ink} t={t} /> : null}
        </ServiceBot>
        {setDown > 0 && setDown < 0.98 && <MealTray x={trayW.x} y={trayW.y} s={0.9} ink={ink} t={t} />}
        {/* builder and bag */}
        <Bench x={BX} y={BY} s={1} w={360} ink={ink} />
        <Cast actors={[builderP]} />
        {!grab && <ToolBag x={bagFloor.x} y={bagFloor.y} s={0.8} ink={ink} tablet={false} />}
        <Attendant x={ax} y={BY - 30} s={0.98} t={t} seed={14} face={grab ? 0.6 : -0.6} ink={ink} handL={grab ? handW : undefined} />
        {grab && !bagIn && <ToolBag x={handW.x} y={handW.y} s={0.8} ink={ink} tablet={false} />}
      </Layer>
      <Tint time={time} lamps={[{x: 420, y: 260, r: 520}, {x: 1500, y: 260, r: 560}]} />
      <Grade vignette={0.42} id="vgE4" />
    </Frame>
  );
};
export default E4;
void REF; void SYS;
