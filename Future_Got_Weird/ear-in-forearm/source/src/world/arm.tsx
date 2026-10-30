// Everything that happens on the inner forearm: the ear relief under the skin (the opening and the loop), the skin
// pocket and its stitches, the cutaway of new vessels forming in the tissue around the framework, the flap being
// outlined and lifted, the donor bed and, later, the healed graft.
import React from 'react';
import {ANAT, SK, INK} from './pal';
import {clamp, ss, ss5, lerp, hash} from '../lib';
import {B, TM} from './story';
import {FIG} from './woman';
import {EarHeight, Relief, EAR_OUTLINE, FRAME_OUTLINE} from './ear';
import {sample, at, partial, P} from './geom';
import {pieceAt, POCKET_X} from './piece';
import {Scalpel, slideIn} from './tools';
import {lit, shade} from '../core/color';

const A = FIG.armEar;
const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const HOOK_POS = A;

/** the forearm turning about its long axis (radians) */
export const turnAt = (t: number) => (t > B.turn[0] && t < B.turn[1] ? 0.24 * Math.sin((Math.PI * (t - B.turn[0])) / (B.turn[1] - B.turn[0])) * Math.min(1, (B.turn[1] - t) * 2.5) : 0);

/** the scaled outline used for the flap (the ear plus a margin of skin) */
const FLAP_K = 1.2;
const OUTL = sample(EAR_OUTLINE, 16);
export const FLAP_D = 'M ' + OUTL.pts.map((p) => `${(3 + (p.x - 3) * FLAP_K).toFixed(2)} ${(-1 + (p.y + 1) * FLAP_K).toFixed(2)}`).join(' L ') + ' Z';
const FLAP_S = sample(FLAP_D, 1);

/** relief amount of the ear under the forearm skin */
export const armEarAmt = (t: number) => {
  if (t < B.armOff) return 1 + 0.18 * Math.sin(Math.PI * clamp((t - B.pulse[0]) / (B.pulse[1] - B.pulse[0])));
  if (t < B.insert[0]) return 0;
  if (t < B.raise[0] + 0.05) return 1;
  if (t < B.rewind[0]) return 0;
  return ss5(t, B.rewind[0], B.rewind[1]);
};
const VS = {a: B.vessels[0] + 0.35, b: B.vessels[0] + 0.9, c: B.vessels[0] + 1.35};
/** after each growth stage lands, a short pulse brightens the vessels (and, at the end, the tissue flushes) */
const vesselPulse = (t: number) => Math.max(...[VS.b, VS.c, B.vessels[1]].map((p) => Math.exp(-(((t - p) / 0.09) ** 2))));
export const vesselWin = (t: number) => ss(t, B.vessels[0], B.vessels[0] + 0.4) * (1 - ss(t, B.winClose[0], B.winClose[1]));
const donorAmt = (t: number) => (t >= B.raise[0] && t < TM.reconnecting + 0.6 ? ss(t, B.raise[0], B.raise[0] + 0.25) : 0);
const graftAmt = (t: number) => (t >= TM.reconnecting + 0.6 ? 1 - ss(t, B.rewind[0], B.rewind[1] - 0.1) : 0);

// ---- the vessel network (arm-local, ear centre at origin) ----
type V = {d: string; s: ReturnType<typeof sample>; w: number; c: string; t0: number; t1: number; o: number};
const RING = (u: number, k = 1) => {
  const q = at(FLAP_S, ((u % 1) + 1) % 1).p;
  return {x: 3 + (q.x - 3) * k, y: -1 + (q.y + 1) * k};
};
const wig = (pts: P[], amp: number, seed: number) =>
  pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : {x: p.x + (hash(seed + i * 1.7) - 0.5) * amp, y: p.y + (hash(seed + i * 3.1) - 0.5) * amp}));
const smooth = (pts: P[]) => {
  // Catmull-Rom through the points, as cubic segments
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};
const VESSELS: V[] = (() => {
  const out: V[] = [];
  // V2: three clear stages after the cutaway opens (about 0.35 s): trunks sprout from the artery; branches reach the
  // framework and wrap around its margin; fine sprigs spread and the tissue flushes (VS)
  const v0 = VS.a, v1 = B.vessels[1];
  const add = (pts: P[], w: number, c: string, t0: number, dur: number, o = 0.95) => {
    const d = smooth(pts);
    out.push({d, s: sample(d, 12), w, c, t0, t1: t0 + dur, o});
  };
  // the forearm's own artery and its companion vein, on the thumb side (already there)
  add([{x: -40, y: -170}, {x: -37, y: -90}, {x: -42, y: -10}, {x: -38, y: 70}, {x: -41, y: 200}], 3.4, ANAT.artery, v0 - 0.4, 0.01);
  add([{x: -47, y: -170}, {x: -44, y: -90}, {x: -49, y: -10}, {x: -45, y: 70}, {x: -48, y: 200}], 3, ANAT.vein, v0 - 0.4, 0.01);
  // new vessels: three trunks leave the forearm artery and fan out through the tissue toward the framework, then wrap
  // around its margin (routed outside it, never across it)
  const C0 = {x: 3, y: -1};
  const out_ = (p: P, k: number) => ({x: C0.x + (p.x - C0.x) * k, y: C0.y + (p.y - C0.y) * k});
  const trunks: {y: number; node: P; targets: number[]}[] = [
    {y: -78, node: {x: -30, y: -56}, targets: [0.02, 0.1, 0.94]},
    {y: 2, node: {x: -30, y: 4}, targets: [0.86, 0.78, 0.7]},
    {y: 78, node: {x: -28, y: 56}, targets: [0.62, 0.55, 0.47]},
  ];
  trunks.forEach((tr, i) => {
    const t0 = VS.a + i * 0.06;
    add(wig([{x: -39, y: tr.y}, {x: -35, y: (tr.y + tr.node.y) / 2 + 3}, tr.node], 3, i * 31), 2.1, ANAT.artery, t0, 0.32);
    tr.targets.forEach((u, j) => {
      const T = RING(u, 1.04);
      const W = out_(T, 1.32);
      const pts = wig([tr.node, {x: (tr.node.x + W.x) / 2, y: (tr.node.y + W.y) / 2 + (hash(i * 9 + j) - 0.5) * 10}, W, T], 3.5, i * 50 + j * 7);
      const tj = VS.b + j * 0.06 + i * 0.03;
      add(pts, 1.4 - j * 0.15, i === 1 && j === 1 ? ANAT.vein : ANAT.artery, tj, 0.28);
      for (const dir of [-1, 1]) {
        const span = 0.06 + hash(i * 7.3 + j * 3 + dir) * 0.08;
        const arc = Array.from({length: 6}, (_, q) => RING(u + dir * span * (q / 5), 1.04 + 0.025 * Math.sin(q * 1.3 + j)));
        add(wig(arc, 2.2, i * 13 + j * 5 + dir), 0.95, ANAT.artery, tj + 0.22, 0.3, 0.9);
        const e = arc[arc.length - 1], f = out_(e, 1.25);
        add(wig([e, {x: (e.x + f.x) / 2 + 3, y: (e.y + f.y) / 2 - 2}, f], 3, i * 17 + j + dir), 0.6, ANAT.artery, VS.c + hash(i + j * 3 + dir) * 0.12, 0.25, 0.7);
      }
    });
  });
  return out;
})();

const Vessels: React.FC<{t: number}> = ({t}) => (
  <g>
    {VESSELS.map((v, i) => {
      const u = clamp((t - v.t0) / (v.t1 - v.t0));
      if (u <= 0) return null;
      const d = u >= 1 ? v.d : partial(v.s, u);
      return (
        <g key={i} opacity={v.o}>
          <path d={d} fill="none" stroke={shade(v.c, 0.45)} strokeWidth={v.w + 0.9} strokeLinecap="round" />
          <path d={d} fill="none" stroke={v.c} strokeWidth={v.w} strokeLinecap="round" />
          <path d={d} fill="none" stroke={lit(v.c, 0.55)} strokeWidth={v.w * (0.28 + 0.3 * vesselPulse(t))} strokeLinecap="round" transform="translate(-0.3 -0.4)" opacity={0.7 + 0.3 * vesselPulse(t)} />
        </g>
      );
    })}
  </g>
);

const CartilageFlat: React.FC<{px: number; id: string}> = ({px, id}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-g`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor={ANAT.cartilageLight} />
        <stop offset="0.6" stopColor={ANAT.cartilage} />
        <stop offset="1" stopColor={ANAT.cartilageShade} />
      </radialGradient>
      <clipPath id={`${id}-c`}>
        <path d={FRAME_OUTLINE} />
      </clipPath>
    </defs>
    <path d={FRAME_OUTLINE} fill={`url(#${id}-g)`} />
    <g clipPath={`url(#${id}-c)`}>
      <Relief id={`${id}-r`} x={-60} y={-70} w={120} h={130} px={px} depth={1.5} blur={1.1} gain={1.1} sheen={0.75} shadow="0.38 0.48 0.56" light="1 1 1">
        <EarHeight p={{}} />
      </Relief>
    </g>
  </g>
);

/** Inside the forearm clip: drawn by ForearmSkin. `px` = screen pixels per world unit. */
export const ArmSurface: React.FC<{t: number; px: number}> = ({t, px}) => {
  const turn = turnAt(t);
  const ex = A.x + Math.sin(turn) * 30, ek = Math.cos(turn);
  const amt = armEarAmt(t);
  const tex = 0.014 * ss(px, 2.5, 5.5);
  const inserting = t >= B.insert[0] && t < B.insert[1];
  const pc = pieceAt(t);
  const win = vesselWin(t);
  const dn = donorAmt(t), gr = graftAmt(t);
  const uInc = clamp((t - B.incise[0]) / (B.incise[1] - B.incise[0]));
  // skin pocket: opens just before the framework arrives, closes after; stitches stay until "Months later"
  const pocket = ss(t, B.carry2[1] - 0.45, B.insert[0]) * (1 - ss(t, B.insert[0] + 0.4, B.insert[1]));
  const stitches = ss(t, B.insert[1] - 0.15, B.insert[1] + 0.1) * (1 - ss(t, TM.months - 0.6, TM.months));
  const reliefX = inserting ? pc.x : ex;
  const depth = inserting ? 2.3 * ss(t, B.insert[0] + 0.05, B.insert[1]) : 2.3 * amt;
  return (
    <g>
      {/* a faint warmth over the stretched skin */}
      {amt > 0.02 && !inserting && <ellipse cx={ex} cy={A.y} rx={30 * ek} ry={50} fill="#C9705E" opacity={0.16 * Math.min(1, amt)} filter="url(#soft6)" />}
      {/* donor bed (fresh) and the healed graft */}
      {dn > 0 && (
        <g transform={`translate(${A.x} ${A.y})`} opacity={dn}>
          <path d={FLAP_D} fill={ANAT.tissue} />
          <path d={FLAP_D} fill="none" stroke={ANAT.tissueDeep} strokeWidth="3.5" />
          <path d={FLAP_D} fill={ANAT.muscle} opacity="0.35" transform="scale(0.7)" filter="url(#soft3)" />
          <path d="M -14 -30 C -4 -38 10 -36 16 -26" fill="none" stroke="#FFE4DA" strokeWidth="2" opacity="0.5" />
        </g>
      )}
      {gr > 0 && (
        <g transform={`translate(${A.x} ${A.y})`} opacity={gr}>
          <path d={FLAP_D} fill={SK.graft} />
          <path d={FLAP_D} fill="none" stroke={shade(SK.graft, 0.2)} strokeWidth="1.6" opacity="0.8" />
          {Array.from({length: 40}, (_, i) => (
            <circle key={i} cx={-22 + (i % 8) * 6.5 + (Math.floor(i / 8) % 2) * 3} cy={-34 + Math.floor(i / 8) * 15} r={0.9} fill={shade(SK.graft, 0.15)} opacity="0.5" />
          ))}
        </g>
      )}
      {/* the ear relief under the skin */}
      {depth > 0.01 && (
        <g clipPath={inserting ? 'url(#underSkin)' : undefined}>
          {inserting && (
            <defs>
              <clipPath id="underSkin">
                <rect x={POCKET_X - 400} y={A.y - 300} width={400} height={600} />
              </clipPath>
            </defs>
          )}
          <g transform={`translate(${reliefX} ${inserting ? pc.y : A.y}) scale(${inserting ? 1 : ek} 1)`}>
            <Relief id="armR" x={-90} y={-240} w={180} h={480} px={px} depth={depth * (1 + 0.35 * (1 - ss(px, 2.2, 4.5)))} blur={1.9} gain={1.15 + 0.45 * (1 - ss(px, 2.2, 4.5))} tex={tex} texFreq={0.9}>
              <EarHeight p={{lobule: 0.3}} />
            </Relief>
          </g>
        </g>
      )}
      {/* the skin pocket's opening, and the framework visible through the lifted lip */}
      {pocket > 0.01 && (
        <g>
          <path d={`M ${POCKET_X} ${A.y - 46} C ${POCKET_X - 3 - 5 * pocket} ${A.y - 15} ${POCKET_X - 3 - 5 * pocket} ${A.y + 15} ${POCKET_X} ${A.y + 46} C ${POCKET_X + 2} ${A.y + 15} ${POCKET_X + 2} ${A.y - 15} ${POCKET_X} ${A.y - 46} Z`} fill={ANAT.cavity} opacity={pocket} />
          <path d={`M ${POCKET_X + 1} ${A.y - 46} C ${POCKET_X + 4} ${A.y - 15} ${POCKET_X + 4} ${A.y + 15} ${POCKET_X + 1} ${A.y + 46}`} fill="none" stroke={SK.lighter} strokeWidth="1.6" opacity={0.8 * pocket} />
        </g>
      )}
      {stitches > 0.01 && (
        <g opacity={stitches}>
          <path d={`M ${POCKET_X} ${A.y - 44} L ${POCKET_X} ${A.y + 44}`} stroke={SK.deep} strokeWidth="1.4" opacity="0.7" />
          {[-36, -18, 0, 18, 36].map((dy) => (
            <path key={dy} d={`M ${POCKET_X - 5} ${A.y + dy - 2} L ${POCKET_X + 5} ${A.y + dy + 2}`} stroke="#1D2633" strokeWidth="1.3" strokeLinecap="round" />
          ))}
        </g>
      )}
      {/* the cutaway: skin made locally transparent over the framework, showing the new vessels in the tissue */}
      {win > 0.01 && (
        <g>
          <defs>
            <radialGradient id="vwG">
              <stop offset="0" stopColor="#FFF" />
              <stop offset="0.66" stopColor="#FFF" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id="vwM">
              <ellipse cx={A.x} cy={A.y} rx={78 * win} ry={110 * win} fill="url(#vwG)" opacity={Math.min(1, win * 1.6)} />
            </mask>
          </defs>
          <g mask="url(#vwM)">
            <rect x={A.x - 120} y={A.y - 160} width={240} height={320} fill={ANAT.tissue} />
            <rect x={A.x - 120} y={A.y - 160} width={240} height={320} fill={ANAT.fat} opacity="0.28" />
            {/* the tissue around the framework flushes as it is perfused */}
            <ellipse cx={A.x + 3} cy={A.y - 1} rx={52} ry={70} fill="#E0473F" opacity={0.28 * ss(t, VS.c, B.vessels[1]) + 0.12 * vesselPulse(t)} filter="url(#soft10)" />
            {Array.from({length: 14}, (_, i) => (
              <path key={i} d={`M ${A.x - 70 + i * 11} ${A.y - 160} C ${A.x - 66 + i * 11} ${A.y - 50} ${A.x - 74 + i * 11} ${A.y + 50} ${A.x - 70 + i * 11} ${A.y + 160}`} stroke={ANAT.tissueDeep} strokeWidth="1" opacity="0.25" fill="none" />
            ))}
            <g transform={`translate(${A.x} ${A.y})`}>
              <path d={FRAME_OUTLINE} fill="#3A1A1C" opacity="0.35" transform="translate(2 3)" filter="url(#soft3)" />
              <Vessels t={t} />
              <CartilageFlat px={px} id="vwF" />
            </g>
          </g>
        </g>
      )}
      {/* the flap's outline being cut */}
      {uInc > 0 && t < B.raise[0] + 0.05 && (
        <g transform={`translate(${A.x} ${A.y})`}>
          <path d={partial(FLAP_S, uInc)} fill="none" stroke="#6E1E22" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </g>
  );
};
/** Tools working on the forearm (drawn above the arm, not clipped by it). */
export const ArmTools: React.FC<{t: number}> = ({t}) => {
  if (t < B.incise[0] - 0.22 || t > B.incise[1] + 0.25) return null;
  const uInc = clamp((t - B.incise[0]) / (B.incise[1] - B.incise[0]));
  const q = at(FLAP_S, uInc).p;
  const k = ss(t, B.incise[0] - 0.22, B.incise[0]) * (1 - ss(t, B.incise[1], B.incise[1] + 0.25));
  const p = slideIn({x: A.x + q.x, y: A.y + q.y}, -155, k, 260);
  return <Scalpel x={p.x} y={p.y} a={-155} s={0.7} ow={1.3} />;
};
export {HOOK_POS};
