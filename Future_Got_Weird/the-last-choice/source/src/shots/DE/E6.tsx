// E6 — The reveal (starts on M.OPEN_FULL, where the song opens from the radio speaker to the full recording). From
// outside: the Director's palm against the pane, their face behind it, the visor in the other hand. The camera pulls
// back and up: the pavilion is a sealed dome on its pier — entrance shuttered — and along the waterfront other domes
// hold other people, patrol drones and wardens moving between them, the ruined city with its slow reconstruction
// beyond. A calm, readable wide; no move after it lands. (5.65 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Actor} from '../../rig/actor';
import {HandCU} from '../../rig/HandCU';
import {Warden, wardenWalker} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, Cam} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, clamp} from '../../kit/math';
import {RefugeExterior} from '../../sets/refuge';
import {Plant, SoftFigure} from '../../sets/refugePlants';
import {FarBank, River, ReconstructionSite, PatrolDrones, CantileverBridge} from '../../sets/refugeFar';
import {refLight} from '../../sets/refugeLight';
import {Glow} from '../../fx/light';
import {mixHex} from '../../fx/common';
import {REF, C} from '../../theme';
import {Tint, Visor, basis, visorPt} from './common';

const ID = 'E6';
export const E6_TIME = 0.25;
// the Director stands inside a large pane of the planted terrace (refuge local coordinates, scale 1)
const DX = 1985, FLOOR = -70, DS = 0.86;
const PANE = {x0: 1860, x1: 2140, y0: -470, y1: -70};
const DOMES = [{x: -5600, s: 0.92}, {x: 5200, s: 0.86}, {x: 9200, s: 0.8}, {x: -9800, s: 0.84}];

const E6: React.FC = () => {
  const {t, T} = useShot(ID);
  const time = E6_TIME;
  const L = refLight(time);
  // ---- camera: hold on the hand and face, then pull back and up to the waterfront wide
  const k = easeInOut(seg(t, 0.55, 5.2));
  const near = camAt(DX - 40, -300, 960, 560, 3.1);
  const far = camAt(1300, -1500, 960, 540, 0.17);
  const cam: Cam = {x: lerp(near.x, far.x, k), y: lerp(near.y, far.y, k), z: Math.exp(lerp(Math.log(near.z), Math.log(far.z), k))};
  const ink = inkFor(cam.z, 1);
  // ---- the Director inside (facing out, palm on the glass)
  const hand = {x: DX - 92, y: FLOOR - 262};
  const dir = {
    look: look('director'), t, x: DX, y: FLOOR, s: DS, yaw: -6, seed: 32, z: 0,
    armR: {hand: {x: hand.x, y: hand.y + 18, z: 40}, pole: {x: -1, y: 0.6, z: 0}},
    armL: {hand: {x: DX + 56, y: FLOOR - 150, z: 20}},
    handR: 'open' as const, handL: 'fist' as const,
    head: {pitch: 2, yaw: 4},
    face: {mouth: 'flat' as const, worry: 0.75, brows: -0.15, lids: 0.3, lookX: -0.15, lookY: -0.05},
    dmg: dmg('director', T), breath: 0.4,
  };
  const vB = basis(-120, 70, 0);
  const tip = visorPt(0, 0, 1, vB, 120, -0.45, 1.03);
  const lhx = DX + 56, lhy = FLOOR - 150;
  // ---- outside: wardens walking the esplanade between the domes, drones overhead
  const wk = t * 140;
  const wardens = [
    wardenWalker(3500, wk, -1, 0, {t, s: 0.95, seed: 61, lock: 0}),
    wardenWalker(-1500, wk * 0.9, 1, 0, {t, s: 0.95, seed: 62, lock: 0}),
    wardenWalker(7600, wk, -1, 0, {t, s: 0.9, seed: 63, lock: 0}),
  ];
  // the glass over the Director (the terrace's large pane): tint, its frame, a reflection sheen
  const kk = ink; // local ink (scale 1)
  const mw = 9 * (kk / 4) * 1.4 + 3;
  const mull = mixHex(REF.mullion, '#26334C', 0.5 * L.lamps);
  const sheen = 0.5 + 0.5 * Math.sin(t * 0.8);
  return (
    <Frame bg={L.skyLow}>
      <Layer cam={cam} p={0.12}>
        <defs><linearGradient id="e6sky" x1="0" y1="-9000" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={L.skyTop} /><stop offset="100%" stopColor={L.skyLow} /></linearGradient></defs>
        <rect x={-30000} y={-30000} width={60000} height={30200} fill="url(#e6sky)" />
        <Glow x={4000} y={-3800} r={2600} color="#FFF3D6" opacity={0.35 * L.sun} id="e6sun" />
      </Layer>
      <Layer cam={cam} p={0.45}>
        {/* the city beyond: ruins, the bridge, reconstruction — the place they came through */}
        <FarBank x0={-16000} x1={16000} y={-60} t={t} time={time} ink={kk * 1.8} seed={22} height={1250} ruined={0.45} />
        <ReconstructionSite x={-3400} y={-60} s={1.25} progress={0.4572} t={t} time={time} ink={kk * 1.8} seed={6} />
        <CantileverBridge x={6000} y={-40} w={9000} h={2000} time={time} ink={kk * 1.8} />
      </Layer>
      <Layer cam={cam} p={1}>
        {/* the esplanade and the piers; the other domes, shuttered, with people inside */}
        <rect x={-16000} y={-20} width={32000} height={60} fill="#B8B0A4" />
        {DOMES.map((d, i) => <RefugeExterior key={i} x={d.x} y={0} scale={d.s} t={t} time={time} ink={kk} seed={30 + i} shutter={1} glints={0.8} />)}
        <RefugeExterior x={0} y={0} scale={1} t={t} time={time} ink={kk} seed={4} shutter={1} doors={0} glints={1} figures={false} />
        {/* people inside our pavilion (other survivors) */}
        {[[880, true], [1380, false], [1650, true], [2330, false]].map(([fx, seated], i) => <SoftFigure key={i} x={fx as number} y={seated ? -150 : -80} s={0.86} t={t} seed={70 + i} seated={seated as boolean} ink={kk * 0.8} opacity={0.9} />)}
        {/* the terrace pane: a clear view through, the Director behind it */}
        <rect x={PANE.x0} y={PANE.y0} width={PANE.x1 - PANE.x0} height={PANE.y1 - PANE.y0} fill="#F8E6C2" />
        <Plant x={PANE.x1 - 40} y={FLOOR} s={0.6} t={t} seed={91} ink={kk * 0.8} kind="fern" />
        <Actor {...dir} />
        <Visor x={lhx - tip.x * DS} y={lhy - tip.y * DS} s={DS} b={vB} ink={kk} />
        <HandCU x={hand.x} y={hand.y + 26} rot={-90} s={0.4 * DS} skin={look('director').skin} view="back" side="L" curl={0} spread={0.7} thumb={0.25} ink={kk * 0.8}
          blood={(dmg('director', T).handBlood?.R ?? 0) * 0.5} />
        {/* glass in front of them: tint, sheen, the print of the palm, the pane's frame */}
        <rect x={PANE.x0} y={PANE.y0} width={PANE.x1 - PANE.x0} height={PANE.y1 - PANE.y0} fill="#D6F0F6" opacity={0.16} />
        <polygon points={`${PANE.x0 + 30},${PANE.y1} ${PANE.x0 + 70},${PANE.y1} ${PANE.x0 + 180},${PANE.y0} ${PANE.x0 + 140},${PANE.y0}`} fill="#FFFFFF" opacity={0.08 + 0.05 * sheen} />
        <Glow x={hand.x} y={hand.y + 8} r={44} color="#FFFFFF" opacity={0.3} id="e6print" />
        {[PANE.x0, PANE.x1].map((xx) => <line key={xx} x1={xx} y1={PANE.y1} x2={xx} y2={PANE.y0 - 90} stroke={mull} strokeWidth={mw} />)}
        <line x1={PANE.x0 - 40} y1={PANE.y0} x2={PANE.x1 + 40} y2={PANE.y0} stroke={mull} strokeWidth={mw * 0.8} opacity={0.9} />
        {wardens.map((w, i) => <Warden key={i} {...w} ink={kk} />)}
        <PatrolDrones x0={-9000} x1={11000} y={-2300} n={5} t={t} seed={9} s={2.6} />
      </Layer>
      <Layer cam={cam} p={1}>
        <River x0={-20000} x1={20000} y={40} depth={3000} t={t} time={time} ink={kk * 2} seed={22} />
        {/* pier piles in the water under every dome */}
        {[0, ...DOMES.map((d) => d.x)].map((x0, i) => <g key={i}>{Array.from({length: 14}, (_, j) => x0 - 300 + j * 260).map((px) => <rect key={px} x={px - 20} y={40} width={40} height={360} fill="#4A4743" stroke={C.ink} strokeWidth={kk * 0.8} />)}</g>)}
      </Layer>
      <Tint time={time} />
      <Grade vignette={lerp(0.3, 0.42, k)} id="vgE6" />
    </Frame>
  );
};
export default E6;
void clamp; void smooth;
