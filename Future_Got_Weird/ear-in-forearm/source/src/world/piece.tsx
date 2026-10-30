// The harvested block on its way to becoming the ear framework. V2: forceps lift it out of the chest and carry it to
// the instrument tray beside her; there it is cut to the ear's outline (the offcuts slide aside on the drape), its
// hollows carved and its rim cut free; forceps then carry the finished framework to the forearm and slide it in under
// the skin. It stays the same pearly cartilage throughout; only material is removed. Every instrument enters and
// leaves along its own axis (from outside the frame), never appearing in place.
import React from 'react';
import {ANAT, INK} from './pal';
import {clamp, ss, ss5, lerp, hash} from '../lib';
import {B} from './story';
import {BLOCK, PIECE_HOME} from './chest';
import {FRAME_OUTLINE, EarHeight, Relief, HELIX, SCAPHA, ANTIHELIX} from './ear';
import {sample, at, poly, P} from './geom';
import {Scalpel, Forceps, slideIn} from './tools';
import {FIG} from './woman';
import {TRAY} from './tray';

const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const});
export const POCKET_X = FIG.armEar.x + 30; // the incision on the forearm, on the little-finger side of the ear
export const ARM_IN = {x: FIG.armEar.x + 68, y: FIG.armEar.y - 6};
const HOME = {...PIECE_HOME, s: 1};
const LIFT = {x: PIECE_HOME.x + 16, y: PIECE_HOME.y - 14, rot: -70, s: 1.1};
export const ON_TRAY = {x: TRAY.x - 34, y: TRAY.y - 2, rot: 0, s: 1};

export type PieceState = {x: number; y: number; rot: number; s: number; lift: number; visible: boolean};
type Pose = {x: number; y: number; rot: number; s: number};
const mixP = (a: Pose, b: Pose, u: number) => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), rot: lerp(a.rot, b.rot, u), s: lerp(a.s, b.s, u)});
/** where the piece is (world), and how far it is lifted off a surface (for its shadow) */
export const pieceAt = (t: number): PieceState => {
  if (t < B.lift[0]) return {...HOME, lift: 0, visible: false};
  if (t < B.lift[1]) return {...mixP(HOME, LIFT, ss5(t, B.lift[0], B.lift[1])), lift: ss(t, B.lift[0], B.lift[1]), visible: true};
  if (t < B.carry1[1]) {
    const u = ss5(t, B.carry1[0], B.carry1[1]);
    const p = mixP(LIFT, ON_TRAY, u);
    return {...p, y: p.y - Math.sin(u * Math.PI) * 50, lift: 1 - ss(u, 0.75, 1), visible: true};
  }
  if (t < B.carry2[0]) return {...ON_TRAY, lift: 0, visible: true};
  if (t < B.carry2[1]) {
    const u = ss5(t, B.carry2[0], B.carry2[1]);
    const p = mixP(ON_TRAY, {...ARM_IN, rot: 0, s: 1.04}, u);
    return {...p, x: p.x + Math.sin(u * Math.PI) * 40, lift: ss(u, 0, 0.2), visible: true};
  }
  if (t < B.insert[1]) {
    const u = ss5(t, B.insert[0], B.insert[0] + 0.42);
    return {x: lerp(ARM_IN.x, FIG.armEar.x, u), y: lerp(ARM_IN.y, FIG.armEar.y, u), rot: 0, s: lerp(1.04, 1, u), lift: 1 - u, visible: u < 1};
  }
  return {...HOME, lift: 0, visible: false};
};
const toWorld = (p: Pose, q: P) => {
  const c = Math.cos((p.rot * Math.PI) / 180), s = Math.sin((p.rot * Math.PI) / 180);
  return {x: p.x + p.s * (q.x * c - q.y * s), y: p.y + p.s * (q.x * s + q.y * c)};
};
const approach = slideIn;

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

const GRIP_BLOCK = {x: 4, y: 44}; // forceps hold the block by its end
const GRIP_FRAME = {x: 27, y: -8}; // and the framework by the back of its rim
const tipPath = (t: number): P | null => {
  const uO = clamp((t - B.outline[0]) / (B.outline[1] - B.outline[0]));
  const uG = clamp((t - B.grooves[0]) / (B.grooves[1] - B.grooves[0]));
  const uR = clamp((t - B.rim[0]) / (B.rim[1] - B.rim[0]));
  const lp = (a: P, b: P, u: number) => ({x: lerp(a.x, b.x, ss(u, 0, 1)), y: lerp(a.y, b.y, ss(u, 0, 1))});
  if (t < B.outline[0]) return at(OUT, 0).p;
  if (t < B.outline[1]) return at(OUT, uO).p;
  if (t < B.grooves[1]) {
    if (uG < 0.12) return lp(at(OUT, 1).p, at(SCA, 0).p, uG / 0.12);
    if (uG < 0.55) return at(SCA, (uG - 0.12) / 0.43).p;
    if (uG < 0.62) return lp(at(SCA, 1).p, at(ANT, 0).p, (uG - 0.55) / 0.07);
    return at(ANT, (uG - 0.62) / 0.38).p;
  }
  if (uR < 0.12) return lp(at(ANT, 1).p, at(HEL, 0).p, uR / 0.12);
  return at(HEL, (uR - 0.12) / 0.88).p;
};

/** The piece in world space, with the instruments that move it and carve it. `camZ` is the camera zoom. */
export const Piece: React.FC<{t: number; camZ: number}> = ({t, camZ}) => {
  const st = pieceAt(t);
  const uO = clamp((t - B.outline[0]) / (B.outline[1] - B.outline[0]));
  const uG = clamp((t - B.grooves[0]) / (B.grooves[1] - B.grooves[0]));
  const uR = clamp((t - B.rim[0]) / (B.rim[1] - B.rim[0]));
  const px = camZ * st.s;
  const inserting = t >= B.insert[0];
  const raw = t < B.outline[0];
  const carvedOutline = t >= B.outline[1];
  const onTray = t >= B.carry1[1] - 0.05 && t < B.carry2[0] + 0.3;
  const blockHeight = (
    <g>
      <path d={BLOCK} fill="#FFF" opacity={0.42} />
      <path d="M -12 -46 C -14 -10 -14 20 -12 40" fill="none" stroke="#FFF" strokeWidth="18" strokeLinecap="round" opacity="0.4" />
      <path d="M 22 -46 C 25 -12 25 16 22 38" fill="none" stroke="#FFF" strokeWidth="17" strokeLinecap="round" opacity="0.4" />
      <path d="M 5 -50 C 6 -12 6 16 5 42" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" opacity="0.25" />
      <path d="M -24 -46 C -10 -52 20 -52 34 -44" fill="none" stroke="#000" strokeWidth="3" opacity="0.2" />
    </g>
  );
  const frameP = {plate: 1, rim: carvedOutline ? 1 : 0, anti: carvedOutline ? 1 : 0, carve: uG, rimCarve: uR, tragus: carvedOutline ? 1 : 0};
  const tr = `translate(${st.x} ${st.y}) rotate(${st.rot}) scale(${st.s})`;
  // forceps: carry 1 (chest -> tray) and carry 2 (tray -> forearm)
  const fa = 196;
  let forceps: React.ReactNode = null;
  if (t >= B.cut[1] - 0.3 && t < B.carry1[1] + 0.45) {
    const tip = toWorld(st.visible ? st : HOME, GRIP_BLOCK);
    const k = ss(t, B.cut[1] - 0.3, B.lift[0]) * (1 - ss(t, B.carry1[1] + 0.1, B.carry1[1] + 0.45));
    const open = 1 - ss(t, B.lift[0] - 0.08, B.lift[0]) + ss(t, B.carry1[1], B.carry1[1] + 0.1);
    const p = approach(tip, fa, k);
    forceps = <Forceps x={p.x} y={p.y} a={fa} s={0.75} ow={1.3} open={Math.min(1, open) * 0.6} />;
  } else if (t >= B.rim[1] - 0.15 && t < B.insert[1] + 0.3) {
    const pose = st.visible ? st : {...FIG.armEar, rot: 0, s: 1};
    const tip = toWorld(pose, GRIP_FRAME);
    const rel = B.insert[0] + 0.42;
    const k = ss(t, B.rim[1] - 0.15, B.carry2[0]) * (1 - ss(t, rel + 0.08, rel + 0.4));
    const open = 1 - ss(t, B.carry2[0] - 0.08, B.carry2[0]) + ss(t, rel, rel + 0.08);
    const p = approach(tip, fa, k);
    forceps = <Forceps x={p.x} y={p.y} a={fa} s={0.75} ow={1.3} open={Math.min(1, open) * 0.6} />;
  }
  // scalpel on the tray: in along its axis, carving, out again
  let scalpel: React.ReactNode = null;
  if (t >= B.outline[0] - 0.25 && t < B.rim[1] + 0.3) {
    const q = tipPath(t)!;
    const tip = toWorld(ON_TRAY, q);
    const k = ss(t, B.outline[0] - 0.25, B.outline[0]) * (1 - ss(t, B.rim[1], B.rim[1] + 0.3));
    const p = approach(tip, -148, k, 260);
    scalpel = <Scalpel x={p.x} y={p.y} a={-148} s={0.55} ow={1.3} />;
  }
  if (!st.visible) return <g>{forceps}</g>;
  return (
    <g>
      {/* shadow: a soft drop shadow while carried, a tight contact shadow on the drape */}
      {!inserting && (
        <g transform={`translate(${st.x + 4 + 10 * st.lift} ${st.y + 4 + 14 * st.lift}) rotate(${st.rot}) scale(${st.s})`} opacity={onTray && st.lift < 0.2 ? 0.45 : 0.32 * st.lift}>
          <path d={raw ? BLOCK : FRAME_OUTLINE} fill="#0B1A1A" filter={st.lift < 0.2 ? 'url(#soft2)' : 'url(#soft5)'} />
        </g>
      )}
      {inserting && (
        <defs>
          <clipPath id="pocketOut">
            <rect x={POCKET_X} y={st.y - 200} width={400} height={400} />
          </clipPath>
        </defs>
      )}
      {/* offcuts: slide aside on the drape once the cut passes through them, and stay there */}
      {!raw && t < B.carry2[0] + 0.6 &&
        CHUNKS.map(([a, b], k) => {
          const tCut = B.outline[0] + b * (B.outline[1] - B.outline[0]);
          const age = Math.max(0, t - tCut);
          if (t < tCut) return null;
          const m = ss(age, 0, 0.35);
          const dir = [{x: -1, y: -0.6}, {x: 1, y: 0.2}, {x: -0.6, y: 1}][k];
          return (
            <g key={k} transform={`translate(${ON_TRAY.x + dir.x * 14 * m} ${ON_TRAY.y + dir.y * 14 * m}) rotate(${(k - 1) * 12 * m})`}>
              <defs>
                <mask id={`off${k}`}>
                  <path d={sector(a, b)} fill="#FFF" />
                  <path d={FRAME_OUTLINE} fill="#000" />
                </mask>
              </defs>
              <g mask={`url(#off${k})`}>
                <path d={BLOCK} fill="#0B1A1A" opacity="0.35" transform="translate(2 3)" filter="url(#soft2)" />
                <path d={BLOCK} fill={ANAT.cartilage} {...ln(1.2)} />
                <path d={BLOCK} fill={ANAT.cartilageShade} opacity="0.35" />
              </g>
            </g>
          );
        })}
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
                  {uO > 0 && <path d={sector(0, uO)} fill="#000" />}
                  <path d={FRAME_OUTLINE} fill="#FFF" />
                </mask>
              </defs>
              <g mask="url(#keepMask)">
                <Cartilage id="blk2" outline={BLOCK} px={px}>
                  {blockHeight}
                </Cartilage>
              </g>
              <path d={`M ${OUT.pts.slice(0, Math.max(2, Math.round(uO * OUT.pts.length))).map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')}`} fill="none" stroke={ANAT.cartilageDeep} strokeWidth={0.9} />
            </g>
          )}
          {carvedOutline && (
            <Cartilage id="frm" outline={FRAME_OUTLINE} px={px}>
              <EarHeight p={frameP} />
            </Cartilage>
          )}
          {t >= B.outline[0] && t < B.rim[1] && (
            <Shavings
              t={t}
              t0={t < B.grooves[0] ? B.outline[0] : t < B.rim[0] ? B.grooves[0] : B.rim[0]}
              t1={t < B.grooves[0] ? B.outline[1] : t < B.rim[0] ? B.grooves[1] : B.rim[1]}
              tip={(u) => tipPath(lerp(t < B.grooves[0] ? B.outline[0] : t < B.rim[0] ? B.grooves[0] : B.rim[0], t < B.grooves[0] ? B.outline[1] : t < B.rim[0] ? B.grooves[1] : B.rim[1], u))!}
            />
          )}
        </g>
      </g>
      {scalpel}
      {forceps}
    </g>
  );
};
