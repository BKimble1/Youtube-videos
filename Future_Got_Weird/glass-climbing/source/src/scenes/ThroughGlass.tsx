// Shot F ("like Spider-Man"): from the far side of the glass. The two pads are pressed on the glass in front of him,
// their adhesive faces toward us: the left pad (on screen-right, his left) has just been seated high, and as his left
// foot takes its stirrup the left pad's tiles go dark with contact while the right pad's lighten as it unloads. He is
// behind the glass, looking up at the left pad, rising a little. The camera then pushes into one tile.
import React from 'react';
import {Man, ManPose} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {Expr, mixExpr} from '../dc/Head';
import {add, clamp, fmt, lerp, V} from '../dc/math';
import {Lin} from '../dc/shade';
import {Hall} from '../art/Bay';
import {PadFace, tileC} from '../art/PadFace';
import {Strap, WEB} from '../art/Pad';
import {climbAt, ss, Y} from '../world/climb';
import {H_BAR} from '../world/rig';
import {EX, HERO, P} from '../world/pose';

export const TG = {
  padL: {x: 190, y: 40} as V,
  padR: {x: -205, y: 330} as V,
  s: 1.62, // face units -> px
};
/** the tile the camera enters (left pad, second column, fourth row) */
export const TG_TILE = {c: 1, r: 3};
export const tgTilePos = (): V => add(TG.padL, {x: tileC(TG_TILE.c, TG_TILE.r).x * TG.s, y: tileC(TG_TILE.c, TG_TILE.r).y * TG.s});

/** per-tile contact as a pad takes load: tiles engage in a slightly uneven order (not all at once) */
const contactOf = (load: number, seed: number) => (c: number, r: number) => {
  const thr = 0.08 + 0.42 * ((Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + seed) * 43758.5453) % 1 + 1) % 1;
  return clamp((load - thr * 0.6) / 0.35) * 0.92 + 0.04;
};

export const ThroughGlass: React.FC<{id: string; f: number; cam: Cam; k: number}> = ({id, f, cam, k}) => {
  const st = climbAt(f);
  const rise = (st.pose.y - climbAt(146).pose.y) * 1.2; // his rise (world units -> this view)
  const H: V = {x: 30, y: 800 + rise};
  let pose: ManPose = P({x: H.x, y: H.y, s: 1.1, torso: 2, chest: 3, neck: -6, turn: 0.18, lW: 1, rW: 1, lElb: 1, rElb: -1});
  // hands behind the pads (hidden by the plates): the arms point toward the glass, foreshortened
  pose = {...pose, lWx: TG.padL.x + 4, lWy: TG.padL.y + 40 + (st.padL.y - Y.L1) * 1.2, lFa: 0.78, rWx: TG.padR.x + 10, rWy: TG.padR.y + 40, rFa: 0.66};
  const look: Expr = {...EX.focus, gx: 0.45, gy: -0.75, browDown: 0.3, browIn: 0.2};
  const expr = mixExpr(look, EX.strain, 0.5 * ss(f, 150, 160) * (1 - ss(f, 172, 180)));
  const loadL = st.padL.load, loadR = st.padR.load;
  const strapL0 = add(TG.padL, {x: 6, y: 150 + (st.padL.y - Y.L1) * 1.2}), strapR0 = add(TG.padR, {x: -4, y: 150});
  return (
    <>
      <Layer cam={cam} depth={2.4}>
        <g transform="translate(0 -300)">
          <Hall id={`${id}-tg-h`} />
        </g>
        <rect x={-4000} y={-4000} width={8000} height={8000} fill="#1A2A33" opacity={0.28} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the straps run from the pads' lower edges down to his feet, away from the glass */}
        <Strap id={`${id}-tg-sR`} a={strapR0} b={{x: -150, y: 1500}} sag={60 * (1 - loadR)} k={k} far />
        <Strap id={`${id}-tg-sL`} a={strapL0} b={{x: 120, y: 1500}} sag={40 * (1 - loadL)} k={k} />
        <Man id={`${id}-tg-m`} pose={pose} expr={expr} lHand={H_BAR} rHand={H_BAR} outfit={HERO} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <PadFace id={`${id}-tg-pR`} c={TG.padR} s={TG.s} contact={contactOf(loadR, 3.1)} k={k} detail={0} />
        {/* the left pad arrives from below (carried up the glass, just off it) and seats */}
        <g opacity={1 - 0.25 * clamp(st.padL.gap / 20)}>
          <PadFace id={`${id}-tg-pL`} c={add(TG.padL, {x: 0, y: (st.padL.y - Y.L1) * 1.2})} s={TG.s * (1 - 0.0025 * st.padL.gap)} contact={st.padL.gap > 0.5 ? () => 0.02 : contactOf(loadL, 7.7)} k={k} detail={clamp((cam.z - 2.2) / 2.5)} />
        </g>
        {/* the glass we look through: a faint cool tint and two soft reflections of the hall's windows */}
        <rect x={-3000} y={-3000} width={6000} height={6000} fill="#CFEFF0" opacity={0.08} />
        <path d="M-900,-700 L-300,-1300 L-120,-1300 L-720,-700 Z" fill="#FFFFFF" opacity={0.09} />
        <path d="M260,1300 L900,640 L980,640 L340,1300 Z" fill="#FFFFFF" opacity={0.07} />
      </Layer>
    </>
  );
};
export {WEB, fmt, lerp, Lin};
