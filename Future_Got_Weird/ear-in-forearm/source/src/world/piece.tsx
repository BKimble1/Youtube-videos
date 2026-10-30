// The harvested block on its way to becoming the ear framework: lifted out of the chest toward us, cut to the ear's
// outline (the offcuts drop away), its hollows carved, its rim cut free, then carried to the forearm and slid under the
// skin. It stays the same pearly cartilage throughout; only material is removed.
import React from 'react';
import {ANAT, INK} from './pal';
import {clamp, ss, ss5, lerp, hash} from '../lib';
import {B} from './story';
import {BLOCK, PIECE_HOME} from './chest';
import {FRAME_OUTLINE, EarHeight, Relief, HELIX, SCAPHA, ANTIHELIX} from './ear';
import {sample, at, poly, P} from './geom';
import {Scalpel} from './tools';
import {FIG} from './woman';

const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const});
export const WORK = {x: 384, y: 1104, rot: 0, s: 1.12};
export const POCKET_X = FIG.armEar.x + 30; // the incision on the forearm, on the little-finger side of the ear
export const ARM_IN = {x: FIG.armEar.x + 68, y: FIG.armEar.y - 6};

export type PieceState = {x: number; y: number; rot: number; s: number; lift: number; visible: boolean};
const mixP = (a: {x: number; y: number; rot: number; s: number}, b: {x: number; y: number; rot: number; s: number}, u: number) => ({
  x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), rot: lerp(a.rot, b.rot, u), s: lerp(a.s, b.s, u),
});
/** where the piece is (world), and how far it is lifted toward the camera (for its shadow) */
export const pieceAt = (t: number): PieceState => {
  const home = {...PIECE_HOME, s: 1};
  if (t < B.lift[0]) return {...home, lift: 0, visible: false};
  if (t < B.lift[1]) {
    const u = ss5(t, B.lift[0], B.lift[1]);
    return {...mixP(home, WORK, u), lift: u, visible: true};
  }
  if (t < B.travel[0]) return {...WORK, lift: 1, visible: true};
  if (t < B.travel[1]) {
    const u = ss5(t, B.travel[0], B.travel[1]);
    const p = mixP(WORK, {...ARM_IN, rot: 0, s: 1.04}, u);
    return {...p, y: p.y - Math.sin(u * Math.PI) * 40, lift: 1, visible: true};
  }
  if (t < B.insert[1]) {
    const u = ss5(t, B.insert[0], B.insert[0] + 0.45);
    return {x: lerp(ARM_IN.x, FIG.armEar.x, u), y: lerp(ARM_IN.y, FIG.armEar.y, u), rot: 0, s: lerp(1.04, 1, u), lift: 1 - u, visible: u < 1};
  }
  return {...home, lift: 0, visible: false};
};

const OUT = sample(FRAME_OUTLINE, 16);
const HEL = sample(HELIX, 16), SCA = sample(SCAPHA, 16), ANT = sample(ANTIHELIX, 16);
/** the region outside the outline swept by the cut so far, split into three offcuts that drop when cut through */
const sector = (u0: number, u1: number) => {
  const pts: P[] = [{x: 3, y: -4}];
  for (let k = 0; k <= 12; k++) {
    const q = at(OUT, lerp(u0, u1, k / 12)).p;
    pts.push({x: 3 + (q.x - 3) * 4, y: -4 + (q.y + 4) * 4});
  }
  return poly(pts);
};
const CHUNKS = [[0, 0.36], [0.36, 0.68], [0.68, 1.0]] as const;

/** the material: pearly fill + lit relief from a height map (white = raised) */
const Cartilage: React.FC<{id: string; outline: string; px: number; children: React.ReactNode; glow?: number}> = ({id, outline, px, children}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-g`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor={ANAT.cartilageLight} />
        <stop offset="0.6" stopColor={ANAT.cartilage} />
        <stop offset="1" stopColor={ANAT.cartilageShade} />
      </radialGradient>
      <clipPath id={`${id}-c`}>
        <path d={outline} />
      </clipPath>
    </defs>
    <path d={outline} fill={`url(#${id}-g)`} {...ln(1.3)} />
    <g clipPath={`url(#${id}-c)`}>
      <Relief id={`${id}-r`} x={-60} y={-70} w={120} h={130} px={px} depth={1.5} blur={1.1} gain={1.1} sheen={0.75} shadow="0.38 0.48 0.56" light="1 1 1" tex={0.008} texFreq={0.5}>
        {children}
      </Relief>
    </g>
  </g>
);

/** A few curled shavings flicking off the tool tip while it works (deterministic). */
const Shavings: React.FC<{t: number; t0: number; t1: number; tip: (u: number) => P}> = ({t, t0, t1, tip}) => {
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 9; k++) {
    const born = t0 + (k + 0.3) * ((t1 - t0) / 9);
    const age = t - born;
    if (age < 0 || age > 0.6) continue;
    const p = tip((born - t0) / (t1 - t0));
    const vx = 30 + 40 * hash(k * 3.3), vy = -40 - 30 * hash(k * 5.1);
    const x = p.x + vx * age, y = p.y + vy * age + 220 * age * age;
    const r = 1.6 + 1.2 * hash(k);
    out.push(
      <path key={k} d={`M ${x} ${y} c ${r} ${-r} ${2.4 * r} 0 ${r} ${r} c ${-r} ${r * 0.6} ${-1.6 * r} 0 ${-0.6 * r} ${-0.8 * r}`} fill="none" stroke={ANAT.cartilageLight} strokeWidth={0.9} opacity={1 - age / 0.6} />,
    );
  }
  return <g>{out}</g>;
};

/** The piece in world space. `camZ` is the camera zoom (for the lighting resolution). */
export const Piece: React.FC<{t: number; camZ: number}> = ({t, camZ}) => {
  const st = pieceAt(t);
  if (!st.visible) return null;
  const uO = clamp((t - B.outline[0]) / (B.outline[1] - B.outline[0]));
  const uG = clamp((t - B.grooves[0]) / (B.grooves[1] - B.grooves[0]));
  const uR = clamp((t - B.rim[0]) / (B.rim[1] - B.rim[0]));
  const px = camZ * st.s;
  const lifted = st.lift;
  const inserting = t >= B.insert[0];
  const raw = t < B.outline[0];
  const carvedOutline = t >= B.outline[1];
  // block bands: the two fused rib cartilages run along the block's length
  const blockHeight = (
    <g>
      <path d={BLOCK} fill="#FFF" opacity={0.42} />
      <path d="M -12 -46 C -14 -10 -14 20 -12 40" fill="none" stroke="#FFF" strokeWidth="18" strokeLinecap="round" opacity="0.4" />
      <path d="M 22 -46 C 25 -12 25 16 22 38" fill="none" stroke="#FFF" strokeWidth="17" strokeLinecap="round" opacity="0.4" />
      <path d="M 5 -50 C 6 -12 6 16 5 42" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" opacity="0.25" />
      {/* the cut ends of the cartilage bars */}
      <path d="M -24 -46 C -10 -52 20 -52 34 -44" fill="none" stroke="#000" strokeWidth="3" opacity="0.2" />
    </g>
  );
  const frameP = {plate: 1, rim: carvedOutline ? 1 : 0, anti: carvedOutline ? 1 : 0, carve: uG, rimCarve: uR, tragus: carvedOutline ? 1 : 0};
  let toolTip: P | null = null, toolA = -150;
  if (t >= B.outline[0] && t < B.outline[1]) toolTip = at(OUT, uO).p;
  else if (t >= B.grooves[0] && t < B.grooves[1]) {
    toolTip = uG < 0.55 ? at(SCA, uG / 0.55).p : at(ANT, (uG - 0.55) / 0.45).p;
    toolA = -135;
  } else if (t >= B.rim[0] && t < B.rim[1]) {
    toolTip = at(HEL, uR).p;
    toolA = -140;
  }
  const toolO = toolTip ? 1 : 0;
  const tr = `translate(${st.x} ${st.y}) rotate(${st.rot}) scale(${st.s})`;
  return (
    <g>
      {/* soft shadow on whatever is below, offset as it comes up toward us */}
      {!inserting && (
        <g transform={`translate(${st.x + 10 * lifted} ${st.y + 16 * lifted}) rotate(${st.rot}) scale(${st.s})`} opacity={0.35 * lifted}>
          <path d={raw ? BLOCK : FRAME_OUTLINE} fill="#0B0F12" filter="url(#soft5)" />
        </g>
      )}
      {inserting && (
        <defs>
          <clipPath id="pocketOut">
            <rect x={POCKET_X} y={st.y - 200} width={400} height={400} />
          </clipPath>
        </defs>
      )}
      <g clipPath={inserting ? 'url(#pocketOut)' : undefined}>
        <g transform={tr}>
          {raw && (
            <Cartilage id="blk" outline={BLOCK} px={px}>
              {blockHeight}
            </Cartilage>
          )}
          {!raw && !carvedOutline && (
            <g>
              <defs>
                <mask id="keepMask">
                  <rect x={-80} y={-80} width={160} height={160} fill="#FFF" />
                  {CHUNKS.map(([a, b], k) => (uO >= b ? <path key={k} d={sector(a, b)} fill="#000" /> : null))}
                  {uO > 0 && <path d={sector(0, uO)} fill="#000" />}
                  <path d={FRAME_OUTLINE} fill="#FFF" />
                </mask>
              </defs>
              <g mask="url(#keepMask)">
                <Cartilage id="blk2" outline={BLOCK} px={px}>
                  {blockHeight}
                </Cartilage>
              </g>
              {/* the cut line already traced */}
              <path d={`M ${OUT.pts.slice(0, Math.max(2, Math.round(uO * OUT.pts.length))).map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')}`} fill="none" stroke={ANAT.cartilageDeep} strokeWidth={0.9} />
            </g>
          )}
          {/* offcuts: each drops once the cut has passed through it */}
          {!raw &&
            CHUNKS.map(([a, b], k) => {
              const tCut = B.outline[0] + b * (B.outline[1] - B.outline[0]);
              const age = t - tCut;
              if (age < 0 || age > 0.7) return null;
              return (
                <g key={k} transform={`translate(${8 * age * (k - 1)} ${260 * age * age + 10 * age}) rotate(${(k - 1) * 40 * age})`} opacity={1 - ss(age, 0.3, 0.7)}>
                  <defs>
                    <mask id={`off${k}`}>
                      <path d={sector(a, b)} fill="#FFF" />
                      <path d={FRAME_OUTLINE} fill="#000" />
                    </mask>
                  </defs>
                  <g mask={`url(#off${k})`}>
                    <path d={BLOCK} fill={ANAT.cartilage} {...ln(1.3)} />
                    <path d={BLOCK} fill={ANAT.cartilageShade} opacity="0.35" />
                  </g>
                </g>
              );
            })}
          {carvedOutline && (
            <Cartilage id="frm" outline={FRAME_OUTLINE} px={px}>
              <EarHeight p={frameP} />
            </Cartilage>
          )}
          {toolTip && (
            <Shavings
              t={t}
              t0={t < B.grooves[0] ? B.outline[0] : t < B.rim[0] ? B.grooves[0] : B.rim[0]}
              t1={t < B.grooves[0] ? B.outline[1] : t < B.rim[0] ? B.grooves[1] : B.rim[1]}
              tip={(u) => (t < B.grooves[0] ? at(OUT, u).p : t < B.rim[0] ? (u < 0.55 ? at(SCA, u / 0.55).p : at(ANT, (u - 0.55) / 0.45).p) : at(HEL, u).p)}
            />
          )}
          {toolTip && <Scalpel x={toolTip.x} y={toolTip.y} a={toolA} s={0.55} ow={1.3} o={toolO} />}
        </g>
      </g>
    </g>
  );
};

/** The dark scrim that drops the body back while the piece is worked on in front of it. */
export const carveScrim = (t: number) => 0.5 * ss(t, B.lift[0] + 0.1, B.lift[1]) * (1 - ss(t, B.rim[0] + 0.1, B.travel[0] + 0.45));
