// Glass Climbing V3 (from V2's ThroughGlass2.tsx): from the far side of the glass, the pad he has just seated (the
// far, right pad: the upper one; seen from this side his right hand is on screen-left) fills the view with its adhesive face toward us; as he pulls himself up onto it, its tiles go dark with
// contact one after another (light passes into the glass where the silicone touches it). He is behind the glass,
// looking up at it. The camera then travels into one tile, whose rows of wedges resolve. V1's scenes/ThroughGlass.tsx,
// driven by the V2 climb, with the window frames behind the pads.
import React from 'react';
import {Man, ManPose} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {Expr, mixExpr} from '../dc/Head';
import {add, clamp, V} from '../dc/math';
import {City, Sky} from './Scenery3';
import {PadFace, tileC} from '../art/PadFace';
import {Strap} from '../art/Pad';
import {H_BAR} from '../world/rig';
import {EX, HERO, P} from '../world/pose';
import {climbAt, ss} from './climb3';

/** from this side: the upper (right) pad on screen-left, the lower (left) one below it on screen-right */
export const TG3 = {padUp: {x: -150, y: 20} as V, padLow: {x: 205, y: 300} as V, s: 1.62};
export const TG3_TILE = {c: 2, r: 3};
export const tg3TilePos = (): V => add(TG3.padUp, {x: tileC(TG3_TILE.c, TG3_TILE.r).x * TG3.s, y: tileC(TG3_TILE.c, TG3_TILE.r).y * TG3.s});

/** tiles engage in a slightly uneven order as the pad takes his weight */
const contactOf = (load: number, seed: number) => (c: number, r: number) => {
  const thr = 0.08 + 0.42 * ((((Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + seed) * 43758.5453) % 1) + 1) % 1);
  return clamp((load - thr * 0.6) / 0.35) * 0.92 + 0.04;
};

export const ThroughGlass3: React.FC<{id: string; f: number; cam: Cam; k: number}> = ({id, f, cam, k}) => {
  const st = climbAt(f);
  const rise = (st.pose.y - climbAt(184).pose.y) * 1.2;
  const H: V = {x: 30, y: 800 + rise};
  let pose: ManPose = P({x: H.x, y: H.y, s: 1.1, torso: 2, chest: 3, neck: -6, turn: 0.18, lW: 1, rW: 1, lElb: 1, rElb: -1});
  // seen from in front: his right hand (screen-left) on the upper pad, his left on the lower one
  pose = {...pose, rWx: TG3.padUp.x + 4, rWy: TG3.padUp.y + 40, rFa: 0.78, lWx: TG3.padLow.x - 6, lWy: TG3.padLow.y + 40, lFa: 0.66};
  const look: Expr = {...EX.focus, gx: 0.45, gy: -0.75, browDown: 0.3, browIn: 0.2};
  const expr = mixExpr({...look, gx: -0.45}, EX.strain, 0.6 * ss(f, 172, 180) * (1 - ss(f, 190, 200)));
  // this view shows the upper pad taking his weight as he pulls up onto it: its tiles engage across 176-200
  const loadUp = 0.25 + 0.75 * ss(f, 174, 200), loadLow = 0.7 - 0.45 * ss(f, 176, 200);
  const strapUp0 = add(TG3.padUp, {x: -6, y: 150}), strapLow0 = add(TG3.padLow, {x: 4, y: 150});
  return (
    <>
      <Layer cam={cam} depth={2.4}>
        {/* from inside the building, looking out past him: the street and the city opposite */}
        <g transform="translate(0 1500) scale(0.5)">
          <Sky id={`${id}-tg-s`} />
          <City id={`${id}-tg-cf`} far />
          <g transform="translate(300 200)">
            <City id={`${id}-tg-cn`} far={false} />
          </g>
        </g>
        <rect x={-4000} y={-4000} width={8000} height={8000} fill="#1A2A33" opacity={0.28} />
      </Layer>
      <Layer cam={cam} depth={1.15}>
        {/* the window frames on his side of the glass: a transom above the pads, a mullion beside them */}
        <path d="M-3000,-520 H3000 V-400 H-3000 Z" fill="#2E4A5C" opacity={0.9} />
        <path d="M-3000,-520 H3000" stroke="#7FA1B2" strokeWidth={8} opacity={0.8} />
        <path d="M-560,-3000 V3000 H-516 V-3000 Z" fill="#B6C1C9" opacity={0.85} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Strap id={`${id}-tg-sU`} a={strapUp0} b={{x: -120, y: 1500}} sag={30 * (1 - loadUp)} k={k} />
        <Strap id={`${id}-tg-sL`} a={strapLow0} b={{x: 150, y: 1500}} sag={50 * (1 - loadLow)} k={k} far />
        <Man id={`${id}-tg-m`} pose={pose} expr={expr} lHand={H_BAR} rHand={H_BAR} outfit={HERO} blink={st.blink} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <PadFace id={`${id}-tg-pL`} c={TG3.padLow} s={TG3.s} contact={contactOf(loadLow, 3.1)} k={k} detail={0} />
        <PadFace id={`${id}-tg-pR`} c={TG3.padUp} s={TG3.s} contact={contactOf(loadUp, 7.7)} k={k} detail={clamp((cam.z - 2.2) / 2.5)} />
        <rect x={-3000} y={-3000} width={6000} height={6000} fill="#CFEFF0" opacity={0.08} />
        <path d="M-900,-700 L-300,-1300 L-120,-1300 L-720,-700 Z" fill="#FFFFFF" opacity={0.09} />
        <path d="M260,1300 L900,640 L980,640 L340,1300 Z" fill="#FFFFFF" opacity={0.07} />
      </Layer>
    </>
  );
};

