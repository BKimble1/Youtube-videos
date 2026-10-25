// Glass Climbing V2, shot A of the explanation: from the far side of the glass, the pad he has just seated (the near,
// left pad) fills the view with its adhesive face toward us; as he pulls himself up onto it, its tiles go dark with
// contact one after another (light passes into the glass where the silicone touches it). He is behind the glass,
// looking up at it. The camera then travels into one tile, whose rows of wedges resolve. V1's scenes/ThroughGlass.tsx,
// driven by the V2 climb, with the window frames behind the pads.
import React from 'react';
import {Man, ManPose} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {Expr, mixExpr} from '../dc/Head';
import {add, clamp, V} from '../dc/math';
import {Hall} from '../art/Bay';
import {PadFace, tileC} from '../art/PadFace';
import {Strap} from '../art/Pad';
import {H_BAR} from '../world/rig';
import {EX, HERO, P} from '../world/pose';
import {climbAt, ss, Y} from './climb2';

export const TG2 = {padL: {x: 190, y: 40} as V, padR: {x: -205, y: 330} as V, s: 1.62};
export const TG2_TILE = {c: 1, r: 3};
export const tg2TilePos = (): V => add(TG2.padL, {x: tileC(TG2_TILE.c, TG2_TILE.r).x * TG2.s, y: tileC(TG2_TILE.c, TG2_TILE.r).y * TG2.s});

/** tiles engage in a slightly uneven order as the pad takes his weight */
const contactOf = (load: number, seed: number) => (c: number, r: number) => {
  const thr = 0.08 + 0.42 * ((((Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + seed) * 43758.5453) % 1) + 1) % 1);
  return clamp((load - thr * 0.6) / 0.35) * 0.92 + 0.04;
};

export const ThroughGlass2: React.FC<{id: string; f: number; cam: Cam; k: number}> = ({id, f, cam, k}) => {
  const st = climbAt(f);
  const rise = (st.pose.y - climbAt(176).pose.y) * 1.2;
  const H: V = {x: 30, y: 800 + rise};
  let pose: ManPose = P({x: H.x, y: H.y, s: 1.1, torso: 2, chest: 3, neck: -6, turn: 0.18, lW: 1, rW: 1, lElb: 1, rElb: -1});
  pose = {...pose, lWx: TG2.padL.x + 4, lWy: TG2.padL.y + 40, lFa: 0.78, rWx: TG2.padR.x + 10, rWy: TG2.padR.y + 40, rFa: 0.66};
  const look: Expr = {...EX.focus, gx: 0.45, gy: -0.75, browDown: 0.3, browIn: 0.2};
  const expr = mixExpr(look, EX.strain, 0.6 * ss(f, 172, 180) * (1 - ss(f, 190, 200)));
  // this view shows the near pad taking his weight: its tiles engage across 176-200
  const loadL = 0.25 + 0.75 * ss(f, 174, 200), loadR = 0.6 - 0.3 * ss(f, 176, 200);
  const strapL0 = add(TG2.padL, {x: 6, y: 150}), strapR0 = add(TG2.padR, {x: -4, y: 150});
  return (
    <>
      <Layer cam={cam} depth={2.4}>
        <g transform="translate(0 -300)">
          <Hall id={`${id}-tg-h`} />
        </g>
        <rect x={-4000} y={-4000} width={8000} height={8000} fill="#1A2A33" opacity={0.28} />
      </Layer>
      <Layer cam={cam} depth={1.15}>
        {/* the window frames on his side of the glass: a transom above the pads, a mullion beside them */}
        <path d="M-3000,-330 H3000 V-280 H-3000 Z" fill="#9AA7B0" opacity={0.85} />
        <path d="M-3000,-330 H3000" stroke="#E6ECF0" strokeWidth={6} opacity={0.7} />
        <path d="M520,-3000 V3000 H566 V-3000 Z" fill="#9AA7B0" opacity={0.85} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Strap id={`${id}-tg-sR`} a={strapR0} b={{x: -150, y: 1500}} sag={50 * (1 - loadR)} k={k} far />
        <Strap id={`${id}-tg-sL`} a={strapL0} b={{x: 120, y: 1500}} sag={30 * (1 - loadL)} k={k} />
        <Man id={`${id}-tg-m`} pose={pose} expr={expr} lHand={H_BAR} rHand={H_BAR} outfit={HERO} blink={st.blink} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <PadFace id={`${id}-tg-pR`} c={TG2.padR} s={TG2.s} contact={contactOf(loadR, 3.1)} k={k} detail={0} />
        <PadFace id={`${id}-tg-pL`} c={TG2.padL} s={TG2.s} contact={contactOf(loadL, 7.7)} k={k} detail={clamp((cam.z - 2.2) / 2.5)} />
        <rect x={-3000} y={-3000} width={6000} height={6000} fill="#CFEFF0" opacity={0.08} />
        <path d="M-900,-700 L-300,-1300 L-120,-1300 L-720,-700 Z" fill="#FFFFFF" opacity={0.09} />
        <path d="M260,1300 L900,640 L980,640 L340,1300 Z" fill="#FFFFFF" opacity={0.07} />
      </Layer>
    </>
  );
};
export {Y};
