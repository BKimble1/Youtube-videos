// E7 — The teammate steps up and rests their good hand on the Director's shoulder, and the frame settles into the
// assembly composition again (src/shots/AB/assembly.ts — the same slots, the same direction, the same weight), now
// inside the glass: the mullions stand between them and the world, and between two of them is the empty place where
// the friend stood. The Director holds the visor. Hold. (6.95 s; the end card follows on M.CARD.)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV, radioOnStrap} from '../../film/crew';
import {Cast, ActorProps, solve} from '../../rig/actor';
import {Frame, Layer, Grade, Cam, camAt} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, noise} from '../../kit/math';
import {FarBank, River, FarDomes, PatrolDrones, CantileverBridge} from '../../sets/refugeFar';
import {Plant} from '../../sets/refugePlants';
import {refLight} from '../../sets/refugeLight';
import {RefugeExterior} from '../../sets/refuge';
import {Glow, LightShaft} from '../../fx/light';
import {mixHex} from '../../fx/common';
import {C, REF} from '../../theme';
import {Tint, Visor, basis, visorPt, seated} from './common';
import {ASSEMBLY} from '../AB/assembly';

const ID = 'E7';
export const E7_TIME = 0.35;
const SILL = 690;
// mullions: one between each pair of neighbours, and a pair framing the empty place (slot 5)
const MULLIONS = [96, 446, 822, 1046, 1276, 1500, 1780];

const E7: React.FC = () => {
  const {t, T} = useShot(ID);
  const time = E7_TIME;
  const L = refLight(time);
  const br = (seed: number, a = 1) => noise(t * 0.55, seed) * a;
  const slot = (role: string) => ASSEMBLY.slots.find((q) => q.role === role)!;
  const sB = slot('builder'), sC = slot('carrier'), sT = slot('teammate'), sD = slot('director'), sF = slot('friend');
  // ---- camera: from a little closer on the Director and teammate, settling exactly into the assembly framing
  const settle = easeInOut(seg(t, 0, 3.4));
  const cam: Cam = {x: lerp(990, 960, settle), y: lerp(585, 540, settle), z: lerp(1.08, 1, settle)};
  const ink = 4; // screen space, scaled per figure below
  // ---- the Director, holding the visor at the near (right) side
  const dS = sD.s;
  const turnTo = smooth(seg(t, 2.3, 3.1)) * (1 - smooth(seg(t, 4.2, 5.2)));
  const director: ActorProps = {
    look: look('director'), t, seed: 4, x: sD.x, y: sD.y, s: dS, z: sD.z, yaw: sD.yaw + br(4, 2), dmg: dmg('director', T),
    head: {yaw: 20 * turnTo + br(41, 2), pitch: 4 + 6 * turnTo}, lean: 3, breath: 0.45, ink: ink * dS,
    face: {mouth: 'flat', worry: 0.7, brows: -0.1, lids: 0.35},
    legL: {foot: {x: sD.x - 50 * dS, y: sD.y - 10 * dS, z: -10}}, legR: {foot: {x: sD.x + 40 * dS, y: sD.y - 10 * dS, z: 14}},
    armL: {fk: {fwd: 6, out: 10, bend: 18}},
    armR: {hand: {x: sD.x + 74 * dS, y: sD.y - 150 * dS, z: 40 * dS}, pole: {x: 1, y: 0.6, z: 0.4}}, handR: 'fist',
  };
  const dr = solve(director);
  // the visor hangs from the near hand by its band
  const vB = basis(30, 64, 10);
  const vt = visorPt(0, 0, 1, vB, 100, -0.45, 1.03);
  const dh = {x: dr.wr[1].x + (dr.wr[1].x - dr.el[1].x) * 0.15, y: dr.wr[1].y + (dr.wr[1].y - dr.el[1].y) * 0.15};
  // ---- the teammate (sling): steps in from behind and rests the right hand on the Director's left shoulder
  const step = easeInOut(seg(t, 0.2, 1.5));
  const reach = easeInOut(seg(t, 1.1, 2.3));
  const tS = sT.s;
  const tx = lerp(sT.x - 70, sT.x + 36, step), ty = lerp(sT.y - 18, sT.y + 4, step);
  const shoulder = {x: dr.sh[0].x - 6 * dS, y: dr.sh[0].y - 6 * dS, z: dr.sh[0].z};
  const teammate: ActorProps = {
    look: look('teammate'), t, seed: 3, x: tx, y: ty, s: tS, z: sT.z, yaw: sT.yaw - 6 + br(3, 2), dmg: dmg('teammate', T), ink: ink * tS,
    drop: 4 + Math.sin(Math.PI * seg(t, 0.2, 1.5)) * 6, side: 4, lean: 4, breath: 0.6,
    head: {yaw: -8 + 6 * reach, pitch: 8, roll: 4},
    legL: {foot: {x: lerp(sT.x - 106, sT.x, step) - 30 * tS, y: ty - 14 * tS, z: -20}, pitch: lerp(30, 10, step)},
    legR: {foot: {x: lerp(sT.x - 50, sT.x + 66, smooth(seg(t, 0.4, 1.4))), y: ty - 10 * tS, z: 10}},
    armR: reach > 0 ? {hand: {x: lerp(tx + 70 * tS, shoulder.x, reach), y: lerp(ty - 170 * tS, shoulder.y, reach), z: shoulder.z + 20}, pole: {x: 0.3, y: 1, z: 0.5}} : {fk: {fwd: 6, out: 8, bend: 20}},
    zHand: [undefined, 1500], handR: 'open', satchel: {radio: radioOnStrap(T)},
  };
  // ---- the carrier and the builder in their slots (bandaged forearm; no bag)
  const carrier: ActorProps = {
    look: look('carrier'), t, seed: 2, x: sC.x, y: sC.y, s: sC.s, z: sC.z, yaw: sC.yaw + br(2, 2), dmg: dmg('carrier', T), ink: ink * sC.s,
    side: -3, breath: 0.5, head: {yaw: 6 + br(21, 3), pitch: 5},
    legL: {foot: {x: sC.x - 50 * sC.s, y: sC.y - 10 * sC.s, z: -6}}, legR: {foot: {x: sC.x + 52 * sC.s, y: sC.y - 10 * sC.s, z: 8}},
    armL: {fk: {fwd: 4, out: 9, bend: 20}}, armR: {fk: {fwd: 8, out: 8, bend: 30}},
  };
  const builder: ActorProps = {
    look: look('builder'), t, seed: 6, x: sB.x, y: sB.y, s: sB.s, z: sB.z, yaw: sB.yaw + br(6, 2), dmg: dmg('builder', T), ink: ink * sB.s,
    side: -3, breath: 0.5, head: {yaw: 6 + br(61, 4), pitch: 2},
    legL: {foot: {x: sB.x - 44 * sB.s, y: sB.y - 10 * sB.s, z: -6}}, legR: {foot: {x: sB.x + 50 * sB.s, y: sB.y - 10 * sB.s, z: 8}},
    armL: {fk: {fwd: 2, out: 10, bend: 14}}, armR: {fk: {fwd: 6, out: 8, bend: 30}},
  };
  // ---- civilians, seated behind the line, smaller (none near the empty place)
  const civ: ActorProps[] = ASSEMBLY.civilians.map((c, i) => {
    const seatTop = c.y - 100 * c.s;
    return {...seated(CIV[i], c.x, c.y, seatTop, {t, s: c.s, yaw: c.yaw, z: -1 + i * 0.01, seed: 20 + i, knees: 60, spread: 30}), ink: ink * c.s, breath: 0.4,
      head: {yaw: br(70 + i, 8), pitch: 6}, face: {mouth: 'flat' as const, worry: 0.6}};
  });
  void sF;
  // ---- the view: the far shore, the river, another sealed dome where the refuge glowed in the assembly
  const glassTint = mixHex('#D6F0F6', L.skyLow, 0.3);
  return (
    <Frame bg={L.skyLow}>
      <Layer cam={cam} p={0.4}>
        <defs><linearGradient id="e7sky" x1="0" y1="-300" x2="0" y2={ASSEMBLY.horizonY} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={L.skyTop} /><stop offset="100%" stopColor={L.skyLow} /></linearGradient></defs>
        <rect x={-600} y={-600} width={3200} height={1400} fill="url(#e7sky)" />
        <Glow x={1500} y={170} r={420} color="#FFF3D6" opacity={0.35 * L.sun} id="e7sun" />
        <g transform={`translate(0 ${ASSEMBLY.horizonY}) scale(0.32) translate(0 ${-ASSEMBLY.horizonY})`}>
          <FarBank x0={-2400} x1={8400} y={ASSEMBLY.horizonY - 10} t={t} time={time} ink={4} seed={26} height={900} ruined={0.4} />
          <CantileverBridge x={-1800} y={ASSEMBLY.horizonY} w={4200} h={760} time={time} ink={4} />
        </g>
        <River x0={-600} x1={2600} y={ASSEMBLY.horizonY} depth={200} t={t} time={time} ink={2} seed={26} />
        <FarDomes domes={[{x: ASSEMBLY.lookAt.x - 110, y: ASSEMBLY.horizonY + 4, s: 0.075, shutter: 1}, {x: 240, y: ASSEMBLY.horizonY + 6, s: 0.05, shutter: 1}]} t={t} time={time} ink={1.2} seed={5} />
        <PatrolDrones x0={200} x1={1800} y={360} n={2} t={t} seed={11} s={0.5} />
      </Layer>
      <Layer cam={cam} p={1}>
        {/* the glass wall: tint, sheens, mullions, transom, sill */}
        <rect x={-200} y={-200} width={2400} height={SILL + 200} fill={glassTint} opacity={0.12} />
        {[300, 980, 1640].map((x0, i) => <polygon key={i} points={`${x0},${SILL} ${x0 + 60},${SILL} ${x0 + 260},${-200} ${x0 + 200},${-200}`} fill="#FFFFFF" opacity={0.06} />)}
        {MULLIONS.map((mx) => <g key={mx}><rect x={mx - 11} y={-200} width={22} height={SILL + 200} fill={REF.mullion} stroke={C.ink} strokeWidth={3} /><line x1={mx + 8} y1={-200} x2={mx + 8} y2={SILL} stroke="#FFFFFF" strokeWidth={2.5} opacity={0.5} /></g>)}
        <rect x={-200} y={248} width={2400} height={18} fill={REF.mullion} stroke={C.ink} strokeWidth={3} />
        <rect x={-200} y={SILL - 8} width={2400} height={28} fill={REF.mullionShade} stroke={C.ink} strokeWidth={3} />
        {/* the floor of the refuge */}
        <rect x={-200} y={SILL + 20} width={2400} height={600} fill={mixHex(REF.floor, L.tint, 0.1)} />
        {[760, 830, 930, 1060].map((yy) => <line key={yy} x1={-200} y1={yy} x2={2400} y2={yy} stroke={REF.floorShade} strokeWidth={2.5} />)}
        {Array.from({length: 16}, (_, i) => -200 + i * 170).map((xx) => <line key={xx} x1={960 + (xx - 960) * 0.6} y1={SILL + 20} x2={xx} y2={1100} stroke={REF.floorShade} strokeWidth={2.5} />)}
        {/* morning light through the pane where the friend stood: a quiet patch on the floor, no one in it */}
        <LightShaft x={1180} y={-200} angle={98} length={1040} w0={200} w1={250} color="#FFF4D6" opacity={0.16} id="e7shaft" seed={3} t={t} />
        <ellipse cx={1160} cy={812} rx={130} ry={22} fill="#FFF6DE" opacity={0.45} />
        <Plant x={60} y={792} s={0.8} t={t} seed={97} ink={3.2} kind="tall" />
        <Plant x={1840} y={800} s={0.75} t={t} seed={98} ink={3.2} kind="bush" />
        <Cast actors={[...civ, builder, carrier, teammate, director]} extra={[
          {z: sD.z * 1000 + 300, el: <Visor key="v" x={dh.x - vt.x * dS} y={dh.y - vt.y * dS} s={dS} b={vB} ink={ink * dS} />},
        ]} />
      </Layer>
      <Tint time={time} />
      <Grade vignette={0.4} id="vgE7" />
    </Frame>
  );
};
export default E7;
void RefugeExterior; void camAt;
