// The opening composition (also the closing callback): the physical roll on its cradle (left) and the scan
// (right). One traced stretch of the sheet, the part that holds column 19, lifts out of the spiral, straightens
// and opens into a page with the real column-19 Greek. Morphing happens in screen space between two cameras: the
// cross-section camera (camS) and the page camera (camP).
import React from 'react';
import {Chip, K} from '../art/kit';
import {Cradle, Roll1667} from '../art/Roll';
import {Cam, PageFace, SheetLine, toScreen, World} from '../art/Sheet';
import {clamp, easeInOut, easeOut, lerp} from '../lib/math';
import {mix} from '../lib/color';
import {colCenter, PL, SPIRAL, idxAt, BREAKS} from '../lib/sheet';

export const C19 = colCenter(19);
export const SEG: [number, number] = [C19 - 128, C19 + 132];
export const CAM_S: Cam = {x: 0, y: 0, z: 4.4};
export const CAM_S_C = {x: 1172, y: 250};
export const CAM_P: Cam = {x: C19, y: 0, z: 2.0};
export const CAM_P_C = {x: 1545, y: 600};
export const ROLL = {x: 450, y: 500, s: 1.5};

/** screen-space ribbon of the segment for morph p(s); returns path d */
export const ribbonD = (s0: number, s1: number, p: (s: number) => number, camS: Cam, cS: {x: number; y: number}, camP: Cam, cP: {x: number; y: number}) => {
  let d = '';
  let pen = false;
  for (let i = idxAt(s0); i <= idxAt(s1) + 1 && i < SPIRAL.length; i++) {
    const q = SPIRAL[i];
    if (BREAKS.some(([a, b]) => q.s > a && q.s < b)) {
      pen = false;
      continue;
    }
    const pp = p(q.s);
    const A = toScreen(camS, q.x, q.y, cS.x, cS.y);
    const B = toScreen(camP, q.s, 0, cP.x, cP.y);
    const x = lerp(A.x, B.x, pp);
    const y = lerp(A.y, B.y, pp) - Math.sin(pp * Math.PI) * 40;
    d += (pen ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    pen = true;
  }
  return d;
};

export type OpenState = {
  u: number; // straightening progress of the segment (0..1)
  open: number; // page face opening (0..1)
  split: number; // 1 = split screen; 0 = the dark panel has slid off to the right
  roll: {x: number; y: number; s: number};
  crumbs?: number;
  darkFade?: number; // 0..1: the scan panel fades to the wall colour (ending)
  pushP?: number; // extra page zoom
  leader?: number;
  chips?: number;
  leftIn?: number; // 1 = the wall/roll side is in place; 0 = slid off to the left (ending)
  scanIn?: number; // opacity of the scan cross-section (ending: fades back in)
  partial?: boolean; // thumbnail: only the straightened part is opened as a page; the rest is still coming out
};

export const OpenComp: React.FC<{st: OpenState; f: number}> = ({st, f}) => {
  const slide = (1 - st.split) * 980;
  const camP = {...CAM_P, z: CAM_P.z * (1 + (st.pushP ?? 0))};
  const cS = {x: CAM_S_C.x + slide, y: CAM_S_C.y};
  const cP = {x: CAM_P_C.x + slide, y: CAM_P_C.y};
  const KF = 0.62; // thumbnail: share of the stretch already flat
  const p = (s: number) => {
    const k = (s - SEG[0]) / (SEG[1] - SEG[0]);
    if (st.partial) return k <= KF ? 1 : easeInOut(clamp(1 - (k - KF) / 0.3));
    return easeInOut(clamp(st.u * 1.7 - k * 0.7));
  };
  const panelBg = mix(K.scanBg, K.paper, st.darkFade ?? 0);
  const allFlat = st.u >= 0.999;
  const sFlat = st.partial ? SEG[0] + KF * (SEG[1] - SEG[0]) : SEG[1];
  const lx = (1 - (st.leftIn ?? 1)) * -980;
  const endFace = {x: st.roll.x + 150 * st.roll.s + lx, y: st.roll.y};
  const df = st.darkFade ?? 0;
  const tableY = st.roll.y + 112 * st.roll.s;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={panelBg} />
      <clipPath id={`leftclip`}>
        <rect x={-20} y={0} width={980 + slide} height={1080} />
      </clipPath>
      <g transform={`translate(${lx} 0)`} clipPath="url(#leftclip)">
        <rect x={-20} y={0} width={980 + slide} height={1080} fill={K.paper} />
        {/* soft wall light */}
        <ellipse cx={st.roll.x} cy={st.roll.y - 60} rx={560} ry={380} fill="#FBF6EC" opacity={0.7 * (1 - (st.darkFade ?? 0))} />
        {/* display table */}
        <rect x={-20} y={tableY} width={980 + slide} height={1080} fill={K.paperDeep} />
        <rect x={-20} y={tableY} width={980 + slide} height={6} fill="#D8CCB8" />
      </g>
      {df > 0 && (
        <g opacity={df}>
          <ellipse cx={st.roll.x + lx} cy={st.roll.y - 60} rx={560} ry={380} fill="#FBF6EC" opacity={0.7} />
          <rect x={-20} y={tableY} width={1980} height={1080} fill={K.paperDeep} />
          <rect x={-20} y={tableY} width={1980} height={6} fill="#D8CCB8" />
          <rect x={960} y={tableY} width={980} height={1080} fill={K.paperDeep} />
          <rect x={960} y={tableY} width={980} height={6} fill="#D8CCB8" />
        </g>
      )}
      <g opacity={1 - (st.darkFade ?? 0)}>
        <World cam={CAM_S} cx={cS.x} cy={cS.y}>
          <g opacity={st.scanIn ?? 1}>
          <SheetLine color={K.scanLine} width={1.1} opacity={0.75} stride={1} />
          {/* where the traced stretch came from */}
          <SheetLine s0={SEG[0]} s1={SEG[1]} color={K.saffron} width={1.4} opacity={0.35} />
          </g>
        </World>
        {st.partial && <path d={ribbonD(sFlat - 2, SEG[1], p, CAM_S, cS, camP, cP)} fill="none" stroke={K.saffron} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
        <World cam={camP} cx={cP.x} cy={cP.y}>
          <PageFace id="openpage" anchor={{s: 0, x: 0, y: 0}} s0={SEG[0]} s1={sFlat} open={st.open} ink={1} />
        </World>
        {!st.partial && (!allFlat || st.open < 1) && (
          <path d={ribbonD(SEG[0], SEG[1], p, CAM_S, cS, camP, cP)} fill="none" stroke={K.saffron} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" opacity={1 - easeOut(clamp(st.open * 1.4))} />
        )}
        {(st.chips ?? 1) > 0 && <Chip x={1890 + slide} y={44} text="Reconstruction" size={22} anchor="end" bg="rgba(255,255,255,0.88)" opacity={st.chips ?? 1} />}
      </g>
      {/* leader from the real end face to the scan */}
      {(st.leader ?? 1) > 0 && (
        <path
          d={`M${endFace.x + 34 * st.roll.s} ${endFace.y} C${endFace.x + 200} ${endFace.y - 30} ${cS.x - 360} ${cS.y + 90} ${cS.x - 190} ${cS.y + 10}`}
          fill="none"
          stroke={K.saffronDeep}
          strokeWidth={5}
          strokeDasharray="2 12"
          strokeLinecap="round"
          opacity={(st.leader ?? 1) * 0.95}
        />
      )}
      <g transform={`translate(${lx} 0)`}>
        <Cradle x={st.roll.x} y={st.roll.y + 64 * st.roll.s} s={st.roll.s} w={330} />
        <Roll1667 x={st.roll.x} y={st.roll.y} s={st.roll.s} crumbs={st.crumbs ?? 0} f={f} />
        {(st.chips ?? 1) > 0 && <Chip x={st.roll.x} y={st.roll.y + 150 * st.roll.s + 10} text="PHerc. 1667" size={30} anchor="middle" dot={K.saffron} opacity={st.chips ?? 1} />}
      </g>
    </g>
  );
};

export const PL_ = PL;
