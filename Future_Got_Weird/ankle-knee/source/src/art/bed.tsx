// Recovery (S5): a calm hospital room. Wyatt half-sits against the raised backrest; his other leg lies under the
// blanket; the operated leg rests on a foam wedge with the turned foot hanging free past its end, so the toes can
// move. Clean white dressing over the join, no blood. Drawn in world centimetres around the hip H.
import React from 'react';
import {Cam, Layer, W, H as SH} from '../camera';
import {Inked, InkPath, Deco, INK} from '../dc/ink';
import {Blob, Lin, SoftShadow} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {closed} from '../core/geo';
import {C} from './pal';

const pth = (ps: [number, number][], t = 0.6) => closed(ps.map(([x, y]) => ({x, y})), t);

export const RoomBack: React.FC<{c: Cam; H: V; k: string}> = ({c, H, k}) => (
  <>
    <svg width={W} height={SH} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${k}wl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lit(C.wall, 0.3)} />
          <stop offset="1" stopColor={C.wallDeep} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={SH} fill={`url(#${k}wl)`} />
    </svg>
    <Layer c={c} D={260} blur={2.2}>
      {/* window with soft daylight, a monitor on its arm */}
      <rect x={H.x - 150} y={H.y - 150} width={92} height={110} rx={4} fill="#EAF6FB" stroke={C.wallDeep} strokeWidth={5} />
      <rect x={H.x - 144} y={H.y - 144} width={80} height={98} fill="#CFEAF6" />
      <path d={`M${H.x - 144},${H.y - 70} Q${H.x - 110},${H.y - 92} ${H.x - 64},${H.y - 80} L${H.x - 64},${H.y - 46} L${H.x - 144},${H.y - 46} Z`} fill="#B8DCC4" opacity={0.7} />
      <rect x={H.x - 160} y={H.y - 156} width={22} height={124} rx={6} fill="#C9DCE6" />
      <rect x={H.x + 70} y={H.y - 128} width={44} height={32} rx={4} fill="#5B6B79" />
      <rect x={H.x + 74} y={H.y - 124} width={36} height={24} rx={2} fill="#2F3D49" />
      <path d={`M${H.x + 78},${H.y - 112} l6,0 l3,-6 l4,12 l3,-6 l12,0`} fill="none" stroke="#7FE3B5" strokeWidth={1.4} />
      <rect x={H.x + 90} y={H.y - 96} width={4} height={30} fill="#8C9AA6" />
    </Layer>
  </>
);

/** bed, pillow, blanket over the far leg, the foam wedge under the operated thigh */
export const BedUnder: React.FC<{H: V; A: V; iw: number; k: string}> = ({H, A, iw, k}) => {
  const top = H.y + 8; // mattress top
  return (
    <g>
      {/* frame and mattress */}
      <rect x={H.x - 95} y={top + 14} width={175} height={6} fill={C.bedDeep} stroke={INK} strokeWidth={iw} />
      <Inked w={iw}>
        <Lin id={`${k}mt`} d={pth([[H.x - 92, top], [H.x + 78, top], [H.x + 78, top + 14], [H.x - 92, top + 14]], 0.15)} from={{x: 0, y: top}} to={{x: 0, y: top + 14}} stops={[[0, lit(C.sheet, 0.2)], [1, C.sheetDeep]]} />
        {/* the raised backrest behind him */}
        <InkPath d={pth([[H.x + 6, top + 2], [H.x + 30, top + 2], [H.x + 74, top - 58], [H.x + 52, top - 72]], 0.25)} fill={C.bed} />
      </Inked>
      {/* pillow */}
      <Inked w={iw}>
        <Blob id={`${k}pw`} d={pth([[H.x + 30, H.y - 60], [H.x + 50, H.y - 78], [H.x + 64, H.y - 72], [H.x + 62, H.y - 44], [H.x + 44, H.y - 30]])} c={{x: H.x + 44, y: H.y - 60}} r={24} color={C.sheet} />
      </Inked>
      {/* blanket over the other leg (it lies along the mattress toward the foot of the bed) */}
      <Inked w={iw}>
        <Blob id={`${k}bl`} d={pth([[H.x + 10, top + 1], [H.x + 8, top - 12], [H.x - 20, top - 15], [H.x - 50, top - 12], [H.x - 78, top - 9], [H.x - 88, top - 2], [H.x - 88, top + 4]])} c={{x: H.x - 30, y: top - 16}} r={50} color={C.gown} k={0.8} />
      </Inked>
      <Deco>
        {[-70, -48, -26, -4].map((x) => <path key={x} d={`M${fmt(H.x + x)},${fmt(top - 10)} q4,6 2,10`} fill="none" stroke={shade(C.gown, 0.25)} strokeWidth={iw * 0.5} opacity={0.6} />)}
      </Deco>
      {/* foam wedge: the thigh rests on it, the foot hangs free past its end */}
      <SoftShadow id={`${k}fs`} c={{x: (H.x + A.x) / 2 + 4, y: top - 12}} rx={22} ry={3} alpha={0.2} color="#2A4656" />
      <Inked w={iw}>
        <Blob id={`${k}fm`} d={pth([[A.x + 5, top - 13], [H.x - 2, top - 13], [H.x - 2, H.y + 6], [A.x + 5, A.y + 4]], 0.12)} c={{x: A.x + 10, y: A.y + 6}} r={30} color={C.foam} k={0.7} />
      </Inked>
    </g>
  );
};
