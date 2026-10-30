// Pistol (snapping) shrimp, Alpheus-type, side view facing right, drawn in millimetres in shrimp-local space.
// Anatomy shown: carapace with orbital hoods covering the eyes (eyes seen through the translucent hood), rostrum,
// antennules (two flagella each) and long antennae with the antennal scale, 5 pairs of pereopods (P1: one huge snapping
// claw on the near side + a small normal claw on the far side; P2: slender chelate legs with a ringed carpus; P3-P5:
// walking legs), 6 abdominal segments (caridean 2nd pleuron overlapping the 1st and 3rd), 5 pairs of pleopods, telson
// and uropods (tail fan). The snapping claw: merus, carpus, swollen palm (propodus), fixed finger with a socket, and a
// hinged dactyl carrying the plunger that seats in the socket.
import React from 'react';
import {Deco, Inked, INK} from '../shared/ink';
import {lit, mix, rgba, shade} from '../shared/color';
import {closedPath, openPath, noise1} from '../shared/lib';
import {Blob, Capsule, Gloss, Lin, SoftShadow} from './shade';
import {add, fmt, len, lerpV, mul, norm, perp, rot, sub, V} from './math';
import {BODY_ROT, CLAW_COXA, CLAW_RAISE, FLOOR_Y} from './timeline';

const BODY = '#A89D62';
const ABD = '#ABA066';
const BAND = '#6C6A3A';
const LEG = '#BCAE7C';
const PALM = '#8F9452';
const TIP = '#D4874A';
const FAR = (c: string) => shade(mix(c, '#3E6A6A', 0.25), 0.32);

const v = (x: number, y: number): V => ({x, y});
const pts = (a: number[][]) => a.map(([x, y]) => v(x, y));

// ---------------- leg IK ----------------
/** two-bone IK: knee on the side of the hip->foot line given by `side` (+1 / -1) */
const ik = (h: V, f: V, l1: number, l2: number, side: number): V => {
  const d = Math.min(len(sub(f, h)), l1 + l2 - 1e-3);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const u = norm(sub(f, h));
  const m = add(h, mul(u, a));
  return add(m, mul(perp(u), hh * side));
};

type LegProps = {id: string; hip: V; foot: V; color: string; w: number; r?: number; kneeSide: number};
/** walking leg: merus (hip->knee), carpus, propodus, dactyl to the foot */
const Leg: React.FC<LegProps> = ({id, hip, foot, color, w, r = 0.36, kneeSide}) => {
  const L1 = 3.5, L2 = 4.4;
  const knee = ik(hip, foot, L1, L2, kneeSide);
  const kf = sub(foot, knee);
  const j1 = add(add(knee, mul(kf, 0.36)), mul(perp(norm(kf)), 0.12 * kneeSide));
  const j2 = add(add(knee, mul(kf, 0.82)), mul(perp(norm(kf)), 0.08 * kneeSide));
  return (
    <Inked w={w}>
      <Capsule id={`${id}m`} a={hip} b={knee} ra={r} rb={r * 0.82} color={color} spec={0.25} />
      <Capsule id={`${id}c`} a={knee} b={j1} ra={r * 0.78} rb={r * 0.66} color={color} />
      <Capsule id={`${id}p`} a={j1} b={j2} ra={r * 0.62} rb={r * 0.5} color={color} />
      <Capsule id={`${id}d`} a={j2} b={foot} ra={r * 0.42} rb={r * 0.12} color={shade(color, 0.15)} />
    </Inked>
  );
};

/** P2: slender chelate leg with a ringed (multi-articulate) carpus */
const LegP2: React.FC<{id: string; hip: V; tip: V; color: string; w: number}> = ({id, hip, tip, color, w}) => {
  const knee = ik(hip, tip, 3.0, 4.8, 1);
  const kt = sub(tip, knee);
  const rings = [0.12, 0.26, 0.4, 0.54, 0.68].map((u) => add(knee, mul(kt, u)));
  const chela = add(knee, mul(kt, 0.84));
  return (
    <Inked w={w}>
      <Capsule id={`${id}m`} a={hip} b={knee} ra={0.26} rb={0.22} color={color} />
      {rings.map((p, i) => (
        <Capsule key={i} id={`${id}r${i}`} a={i === 0 ? knee : rings[i - 1]} b={p} ra={0.2} rb={0.17} color={color} />
      ))}
      <Capsule id={`${id}p`} a={rings[4]} b={chela} ra={0.24} rb={0.2} color={color} />
      <Capsule id={`${id}f`} a={chela} b={tip} ra={0.16} rb={0.05} color={shade(color, 0.12)} />
    </Inked>
  );
};

// ---------------- abdomen: a curved chain of 6 segments (shrimp-local; dorsal line, ventral side inward) ----------------
const SEG_L = [3.5, 3.4, 3.1, 2.8, 2.6, 2.9];
export const SEG_H = [5.8, 6.0, 5.7, 5.0, 4.1, 3.1];
const SEG_A = [182, 175, 162, 150, 140, 132]; // direction (deg) of each segment's dorsal line, going backward
const TEL_A = 126;
const dirOf = (a: number): V => v(Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180));
const venOf = (a: number): V => {
  const d = dirOf(a);
  return v(d.y, -d.x); // the ventral side, 90 degrees from the dorsal direction (down for a segment pointing back)
};
export const SEG_D: V[] = (() => {
  const out = [v(-12.7, -2.9)];
  SEG_L.forEach((l, i) => out.push(add(out[i], mul(dirOf(SEG_A[i]), l))));
  return out;
})();
/** a point of segment i in (u along its dorsal line, v toward the ventral side) */
const segAt = (i: number, u: number, w: number) => add(add(SEG_D[i], mul(dirOf(SEG_A[i]), u)), mul(venOf(SEG_A[i]), w));
const segPts = (i: number) => {
  const L = SEG_L[i], h = SEG_H[i];
  const big = i === 1 ? 0.9 : 0; // caridean 2nd pleuron overlaps 1st and 3rd
  return [
    segAt(i, -0.5, 0.05),
    segAt(i, L / 2, -0.4),
    segAt(i, L + 0.15, 0.05),
    segAt(i, L + 0.1 + big * 0.4, h * 0.5),
    segAt(i, L - 0.35 + big, h * 0.9),
    segAt(i, L / 2, h * 1.02 + big * 0.25),
    segAt(i, -0.35 - big, h * 0.9),
    segAt(i, -0.7, h * 0.45),
  ];
};

// ---------------- the snapping claw (claw-local, unrotated: palm axis horizontal) ----------------
export const DACTYL_HINGE: V = v(13.5, 1.75);
const MERUS = pts([[-1.4, 2.0], [1.6, 2.15], [4.6, 2.55], [4.85, 4.55], [1.6, 4.35], [-1.1, 3.95]]);
const CARPUS = pts([[4.2, 2.3], [5.7, 1.9], [6.15, 3.4], [5.6, 4.95], [4.3, 4.8]]);
const PALM_P = pts([[5.3, 2.2], [7.4, 0.95], [10.4, 0.45], [12.8, 0.75], [14.0, 1.75], [14.25, 3.4], [13.9, 5.0], [12.4, 6.0], [9.5, 6.4], [6.8, 5.95], [5.35, 4.6]]);
const POLLEX = pts([[13.5, 3.15], [15.4, 3.55], [17.5, 3.85], [19.25, 4.05], [19.85, 4.45], [19.3, 4.95], [17.2, 5.3], [15.2, 5.55], [13.5, 5.4]]);
const DACTYL = pts([[12.9, 1.05], [15.0, 0.8], [17.2, 1.35], [19.0, 2.35], [19.9, 3.45], [19.75, 4.1], [18.6, 3.85], [16.6, 3.6], [15.55, 3.5], [15.3, 3.7], [14.9, 3.95], [14.5, 3.65], [14.05, 3.2], [13.2, 2.75], [12.75, 1.9]]);

const BigClaw: React.FC<{open: number; w: number; t: number}> = ({open, w, t}) => {
  const d = DACTYL.map((p) => rot(p, -open, DACTYL_HINGE));
  const plunger = rot(v(14.9, 3.72), -open, DACTYL_HINGE);
  const dTip = rot(v(19.6, 3.4), -open, DACTYL_HINGE);
  const palmD = closedPath(PALM_P, 0.95);
  return (
    <g>
      <Inked w={w}>
        <Blob id="h9-merus" d={closedPath(MERUS, 0.9)} c={v(1.6, 2.6)} r={4.5} color={BODY} k={1.1} />
      </Inked>
      <Inked w={w}>
        <Blob id="h9-carpus" d={closedPath(CARPUS, 0.9)} c={v(5.0, 2.8)} r={2.6} color={BODY} k={1.1} />
      </Inked>
      {/* fixed finger (pollex) and its socket */}
      <Inked w={w}>
        <Lin id="h9-pollex" d={closedPath(POLLEX, 0.85)} from={v(13.5, 4)} to={v(19.9, 4.6)} stops={[[0, PALM], [0.55, mix(PALM, TIP, 0.55)], [1, TIP]]} />
      </Inked>
      <Deco>
        <path d={openPath(pts([[14.2, 5.15], [16.8, 5.0], [19.0, 4.6]]))} fill="none" stroke={rgba('#FFF6EA', 0.0)} strokeWidth={0.1} />
        <path d={openPath(pts([[14.0, 5.25], [17.0, 5.05], [19.2, 4.7]]))} fill="none" stroke={rgba(shade(TIP, 0.6), 0.45)} strokeWidth={0.16} strokeLinecap="round" />
        <ellipse cx={14.9} cy={3.55} rx={0.6} ry={0.22} fill={shade(PALM, 0.55)} opacity={0.85} />
        <ellipse cx={14.86} cy={3.52} rx={0.4} ry={0.11} fill={shade(PALM, 0.85)} opacity={0.7} />
      </Deco>
      {/* palm (propodus) */}
      <Inked w={w}>
        <Blob id="h9-palm" d={palmD} c={v(9.6, 3.0)} r={6.2} color={PALM} k={1.15} focal={0.55} />
        <Deco>
          {/* mottling and the translucent edge of the palm */}
          {[[7.4, 4.6, 0.9, 0.5], [10.6, 5.1, 1.1, 0.45], [9.0, 2.6, 0.7, 0.4], [12.2, 4.0, 0.6, 0.5], [7.0, 2.7, 0.5, 0.35], [11.6, 2.0, 0.5, 0.3]].map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={shade(PALM, 0.55)} opacity={0.32} transform={`rotate(${-12 + i * 9} ${x} ${y})`} />
          ))}
          <path d={openPath(pts([[6.0, 5.5], [8.8, 6.15], [11.8, 5.9], [13.6, 4.9]]))} fill="none" stroke={rgba(lit(PALM, 0.6), 0.45)} strokeWidth={0.22} strokeLinecap="round" />
          <Gloss id="h9-palmgl" c={v(8.6, 1.6)} rx={1.7} ry={0.36} rotate={-9} opacity={0.6} />
          {/* palm-finger junction tint */}
          <path d={openPath(pts([[13.3, 1.2], [14.0, 2.6], [13.8, 4.6], [13.1, 5.7]]))} fill="none" stroke={rgba(TIP, 0.35)} strokeWidth={0.5} strokeLinecap="round" />
        </Deco>
      </Inked>
      {/* dactyl (movable finger) with the plunger */}
      <Inked w={w}>
        <Lin id="h9-dactyl" d={closedPath(d, 0.85)} from={DACTYL_HINGE} to={dTip} stops={[[0, lit(PALM, 0.08)], [0.5, mix(PALM, TIP, 0.5)], [1, lit(TIP, 0.08)]]} />
        <Deco>
          <ellipse cx={fmt(plunger.x)} cy={fmt(plunger.y)} rx={0.32} ry={0.2} fill={shade(TIP, 0.35)} opacity={0.55} transform={`rotate(${-open} ${fmt(plunger.x)} ${fmt(plunger.y)})`} />
          <path d={openPath([rot(v(13.6, 1.25), -open, DACTYL_HINGE), rot(v(16.4, 1.15), -open, DACTYL_HINGE), rot(v(18.8, 2.4), -open, DACTYL_HINGE)])} fill="none"
            stroke={rgba('#FFF6EA', 0.55)} strokeWidth={0.18} strokeLinecap="round" />
          <circle cx={DACTYL_HINGE.x} cy={DACTYL_HINGE.y} r={0.34} fill={shade(PALM, 0.5)} opacity={0.8} />
        </Deco>
      </Inked>
      <Deco>{t < 0 ? null : null}</Deco>
    </g>
  );
};

