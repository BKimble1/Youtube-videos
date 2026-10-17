// E5 — Morning. From behind, the Director walks the planted terrace toward what looks like an open view of the river
// and the city — big clear panes, only a glint and the faintest mullion to say otherwise — carrying the visor. They
// reach out, and the hand stops flat on glass (soft thump): a faint palm print blooms around it and their reflection
// appears in the pane beside them. The camera has moved in on the hand by then. (6.95 s, ends on M.OPEN_FULL.)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Actor, ActorProps, solve, handCenter} from '../../rig/actor';
import {gait, WALK, stopDist} from '../../rig/gait';
import {HandCU} from '../../rig/HandCU';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam, toScreen} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, easeOut, clamp, V2} from '../../kit/math';
import {Plant} from '../../sets/refugePlants';
import {FarBank, River, CantileverBridge, FarDomes, PatrolDrones} from '../../sets/refugeFar';
import {refLight} from '../../sets/refugeLight';
import {Glow} from '../../fx/light';
import {fxId} from '../../fx/common';
import {C, REF} from '../../theme';
import {Tint, Visor, basis, visorPt} from './common';

const ID = 'E5';
export const E5_TIME = 0.15;
export const GLASS_Y = -60;          // the glass plane's base line (depth)
const HELD_B = basis(-120, 70, 0);   // the visor hanging from the left hand by its strap side

const E5: React.FC = () => {
  const {t, T, dur} = useShot(ID);
  const time = E5_TIME;
  const L = refLight(time);
  // ---- the walk into depth (toward the glass), then the reach
  const walkK = easeOut(seg(t, 0, 3.4));
  const D = stopDist(300, {...WALK, stride: 104, s: 1.05});
  const y0 = 330, dist = D * walkK;
  const yy = y0 - dist;
  const s = lerp(1.18, 0.98, clamp(dist / D));
  const x = 60;
  const g = gait(-y0, dist, 1, {...WALK, stride: 104, lift: 12, s});
  const stop = walkK > 0.995;
  const feetY = (f: {x: number; lift: number}) => -f.x - 9 * s - f.lift * 0.7;
  const reach = easeInOut(seg(t, 3.55, 4.6));
  const contact = 4.6;
  const touched = t >= contact;
  const handGlass: V2 = {x: x + 118, y: GLASS_Y - 258};
  // a tiny recoil at contact, then the palm settles flat
  const recoil = touched ? Math.exp(-(t - contact) * 9) * Math.sin((t - contact) * 30) * 4 : 0;
  const director: ActorProps = {
    look: look('director'), t, x, y: yy, s, yaw: 168, seed: 32, z: 0,
    drop: stop ? 0 : g.drop, lean: 4 + 6 * reach,
    legL: {foot: {x: x - 30 * s, y: feetY(g.L), z: 0}, pitch: g.L.pitch * 0.25}, legR: {foot: {x: x + 30 * s, y: feetY(g.R), z: 0}, pitch: g.R.pitch * 0.25},
    // right arm reaches forward (into depth) to the glass; left hand carries the visor at the side
    armR: reach > 0 ? {hand: {x: lerp(x + 70, handGlass.x, reach), y: lerp(yy - 170 * s, handGlass.y + recoil, reach), z: -80 * reach}, w: 1, pole: {x: 1, y: 0.6, z: 0.3}} : {fk: {fwd: g.armR * 0.6, out: 8, bend: 18}},
    armL: {hand: {x: x - 74 * s, y: yy - 150 * s, z: 10}, pole: {x: -1, y: 0.5, z: 0}},
    handL: 'fist', handR: 'open',
    head: {pitch: lerp(4, -6, reach), yaw: -8},
    dmg: dmg('director', T), breath: 0.5,
  };
  const r = solve(director);
  const lh = handCenter(r, 0);
  const vB = HELD_B;
  const tip = visorPt(0, 0, 1, vB, 120, -0.45, 1.03);
  const visor = <Visor x={lh.x - tip.x} y={lh.y - tip.y} s={s} b={vB} ink={inkFor(1.8, s)} />;
  // ---- the print and the reflection
  const print = smooth(seg(t, contact, contact + 0.5));
  const refl = smooth(seg(t, contact + 0.3, contact + 1.6));
  // ---- camera: follows the walk, then moves in on the hand
  const camF = (tt: number): Cam => {
    const k = easeInOut(seg(tt, 2.6, 5.3));
    const wide = camAt(60, -330, 960, 560, 0.92);
    const close = camAt(handGlass.x - 40, handGlass.y + 20, 1000, 520, 1.7);
    return {x: lerp(wide.x, close.x, k), y: lerp(wide.y, close.y, k), z: Math.exp(lerp(Math.log(wide.z), Math.log(close.z), k))};
  };
  const cam = smoothCam(camF, t, 0.25, 7);
  const ink = inkFor(cam.z, 1);
  const handInk = inkFor(cam.z, 0.6);
  const glint = 0.5 + 0.5 * Math.sin(t * 1.3);
  void dur; void toScreen;
  return (
    <Frame bg={L.skyLow}>
      <Layer cam={cam} p={0.35}>
        <g transform="translate(0 330)">
        <defs><linearGradient id="e5sky" x1="0" y1="-2600" x2="0" y2="-200" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={L.skyTop} /><stop offset="100%" stopColor={L.skyLow} /></linearGradient></defs>
        <rect x={-4000} y={-4000} width={8000} height={4400} fill="url(#e5sky)" />
        <Glow x={900} y={-1300} r={700} color="#FFF3D6" opacity={0.4 * L.sun} id="e5sun" />
        <g transform="translate(0 -230) scale(0.7) translate(0 230)">
          <FarBank x0={-5200} x1={5200} y={-260} t={t} time={time} ink={2.5} seed={18} height={760} ruined={0.35} />
          <CantileverBridge x={-1400} y={-230} w={4400} h={700} time={time} ink={2.5} />
        </g>
        <River x0={-4000} x1={4000} y={-230} depth={600} t={t} time={time} ink={2.5} seed={18} />
        <FarDomes domes={[{x: -1500, y: -236, s: 0.13, shutter: 1}, {x: 900, y: -236, s: 0.1, shutter: 1}]} t={t} time={time} ink={1.5} seed={3} />
        <PatrolDrones x0={-1600} x1={1600} y={-900} n={2} t={t} seed={7} s={0.9} />
        </g>
      </Layer>
      <Layer cam={cam} p={1}>
        {/* the glass: almost nothing — a sill, one far mullion, faint sheens, a slow glint */}
        <rect x={-3000} y={GLASS_Y - 30} width={6000} height={40} fill="#C9D3D6" stroke={C.ink} strokeWidth={ink * 0.7} />
        <rect x={-3000} y={GLASS_Y + 10} width={6000} height={900} fill="#E8DEC8" />
        {[0.18, 0.4].map((k, i) => <path key={i} d={`M ${-700 + i * 900} ${GLASS_Y - 30} l 220 0 l 520 -1500 l -220 0 Z`} fill="#FFFFFF" opacity={0.045 + 0.02 * glint} />)}
        <rect x={-1180} y={GLASS_Y - 1700} width={16} height={1670} fill={REF.mullion} stroke={C.ink} strokeWidth={ink * 0.6} />
        <rect x={1300} y={GLASS_Y - 1700} width={16} height={1670} fill={REF.mullion} stroke={C.ink} strokeWidth={ink * 0.6} />
        <path d={`M ${-1166} ${GLASS_Y - 900 - 300 * glint} l 10 0 l -4 40 Z`} fill="#FFFFFF" opacity={0.7} />
        {/* the reflection: the Director's face, faint, in the pane beside them */}
        <defs><clipPath id="e5refl"><rect x={-3000} y={-3000} width={6000} height={3000 + GLASS_Y - 170} /></clipPath></defs>
        {refl > 0.01 && (
          <g opacity={0.13 * refl} clipPath="url(#e5refl)">
            <Actor look={look('director')} t={t} x={x + 250} y={GLASS_Y - 20} s={0.94} yaw={-14} seed={32} shadow={false}
              head={{pitch: -4}} face={{mouth: 'flat', worry: 0.7, brows: -0.1, lids: 0.35, lookX: -0.2}} dmg={dmg('director', T)} armL={{fk: {fwd: 30, out: 10, bend: 60}}} />
          </g>
        )}
        {/* planted terrace beside the path */}
        <Plant x={-620} y={GLASS_Y + 40} s={1.1} t={t} seed={81} ink={ink} kind="palm" />
        <Plant x={780} y={GLASS_Y + 50} s={1.0} t={t} seed={82} ink={ink} kind="tall" />
        <Plant x={-380} y={GLASS_Y + 140} s={0.9} t={t} seed={83} ink={ink} kind="fern" />
        <Plant x={520} y={GLASS_Y + 160} s={0.8} t={t} seed={84} ink={ink} kind="bush" />
        {print > 0 && (
          <g opacity={print}>
            <Glow x={handGlass.x} y={handGlass.y - 10} r={90 * s} color="#FFFFFF" opacity={0.26} id={fxId('e5print', 1, handGlass.x, handGlass.y)} />
            <ellipse cx={handGlass.x} cy={handGlass.y - 6} rx={46 * s} ry={58 * s} fill="#FFFFFF" opacity={0.12} />
          </g>
        )}
        <Actor {...director} />
        {visor}
        {reach > 0.85 && (
          <HandCU x={handGlass.x} y={handGlass.y + 28 * s + recoil} rot={-90} s={0.46 * s} skin={look('director').skin} view="back" side="R"
            curl={lerp(0.25, 0, smooth(seg(t, contact - 0.1, contact + 0.25)))} spread={lerp(0.3, 0.7, smooth(seg(t, contact, contact + 0.3)))} thumb={0.25}
            blood={(dmg('director', T).handBlood?.R ?? 0) * 0.6} ink={handInk} />
        )}
        {/* foreground leaves (parallax) */}
      </Layer>
      <Layer cam={cam} p={1.35}>
        <Plant x={-900} y={760} s={1.5} t={t} seed={85} ink={inkFor(cam.z * 1.35, 1.2)} kind="tall" pot={false} />
        <Plant x={1120} y={760} s={1.4} t={t} seed={86} ink={inkFor(cam.z * 1.35, 1.2)} kind="bush" pot={false} />
      </Layer>
      <Tint time={time} />
      <Grade vignette={0.34} id="vgE5" />
    </Frame>
  );
};
export default E5;
