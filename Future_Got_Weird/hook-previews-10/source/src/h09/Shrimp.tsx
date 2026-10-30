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
import {closedPath, hash, openPath, noise1} from '../shared/lib';
import {Blob, Capsule, Gloss, Lin, SoftShadow} from './shade';
import {add, fmt, len, lerpV, mul, norm, perp, rot, sub, V} from './math';
import {CLAW_COXA, CLAW_RAISE, FOOT_Y} from './timeline';

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

// ---------------- the whole shrimp ----------------
export type ShrimpProps = {t: number; tau: number; open: number; w: number};
const FOOT = FOOT_Y;

export const Shrimp: React.FC<ShrimpProps> = ({t, tau, open, w}) => {
  const n = (x: number, s: number) => noise1(x, s);
  const breathe = 0.04 * Math.sin(tau * 5.2);
  const kneeSide = (hip: V, foot: V) => (foot.x > hip.x ? -1 : 1);

  // pereopods P3-P5: hips spaced along the carapace floor, feet on the rock, knees up and outward (no crossings)
  const legs = [
    {hip: v(-5.8, 2.75), foot: v(-3.0, FOOT)},
    {hip: v(-8.2, 2.85), foot: v(-7.0, FOOT)},
    {hip: v(-10.6, 2.7), foot: v(-12.6, FOOT)},
  ];
  const farOff = v(0.35, -0.35);
  const farFoot = v(0.55, -0.45);

  // antenna flagella sweep up and back over the body (never across the claw); antennules point up-forward
  const sway = (i: number, k: number) => 0.6 * n(tau * 0.9 + i * 0.37, 11 + k) * (i / 8);
  const antenna = (k: number, ctrl: number[][]) => ctrl.map(([x, y], i) => add(v(x, y), v(sway(i, k) * 1.2, sway(i, k + 3) * 1.6)));
  const antNear = antenna(0, [[3.4, 0.35], [4.8, -0.4], [5.6, -2.4], [5.0, -5.2], [2.6, -8.0], [-2.0, -10.6], [-8.6, -12.4], [-16.0, -12.8], [-23.5, -11.8], [-30.0, -9.6]]);
  const antFar = antenna(5, [[3.2, 0.05], [4.4, -0.9], [4.7, -3.0], [3.6, -5.8], [0.8, -8.6], [-4.6, -10.8], [-11.6, -12.0], [-18.6, -11.6], [-24.6, -10.2]]);
  const aU = antenna(9, [[3.3, -1.65], [4.4, -3.0], [5.0, -4.8], [5.0, -6.8], [4.4, -8.3]]);
  const aL = antenna(13, [[3.3, -1.45], [5.0, -2.3], [6.4, -3.6], [7.4, -5.0]]);
  const flag = (p: V[], w0: number, col: string, key: string) => {
    const m = Math.floor(p.length / 2);
    return (
      <g key={key}>
        <path d={openPath(p.slice(0, m + 1))} fill="none" stroke={INK} strokeWidth={w0 + w * 0.5} strokeLinecap="round" />
        <path d={openPath(p.slice(m))} fill="none" stroke={INK} strokeWidth={w0 * 0.55 + w * 0.4} strokeLinecap="round" />
        <path d={openPath(p.slice(0, m + 1))} fill="none" stroke={col} strokeWidth={w0} strokeLinecap="round" />
        <path d={openPath(p.slice(m))} fill="none" stroke={col} strokeWidth={w0 * 0.55} strokeLinecap="round" />
      </g>
    );
  };

  // pleopods (5 pairs) under abdominal segments 1-5, metachronal beat
  const pleo = (i: number, far: boolean) => {
    const L = SEG_L[i], h = SEG_H[i];
    const base = add(segAt(i, L * 0.45, h * 0.8), far ? v(0.3, -0.25) : v(0, 0));
    const ven = venOf(SEG_A[i]);
    const ang = (Math.atan2(ven.y, ven.x) * 180) / Math.PI - 12 + 16 * Math.sin(tau * 2 * Math.PI * 2.4 - i * 0.95) + (far ? 8 : 0);
    const dir = dirOf(ang);
    const knee = add(base, mul(dir, 1.2 + h * 0.06));
    const r1 = add(knee, mul(rot(dir, -16), 2.0));
    const r2 = add(knee, mul(rot(dir, 12), 1.8));
    const col = far ? FAR(LEG) : lit(LEG, 0.1);
    return (
      <g key={`p${i}${far}`}>
        <Inked w={w}>
          <Capsule id={`h9-pl${i}${far ? 'f' : 'n'}a`} a={base} b={knee} ra={0.3} rb={0.24} color={col} />
          <Capsule id={`h9-pl${i}${far ? 'f' : 'n'}b`} a={knee} b={r1} ra={0.2} rb={0.07} color={col} />
          <Capsule id={`h9-pl${i}${far ? 'f' : 'n'}c`} a={knee} b={r2} ra={0.18} rb={0.06} color={col} />
        </Inked>
        <Deco>
          {[0.3, 0.5, 0.7, 0.9].map((u, j) => {
            const p = lerpV(knee, r1, u);
            const q = add(p, mul(rot(dir, -75), 0.5));
            return <line key={j} x1={fmt(p.x)} y1={fmt(p.y)} x2={fmt(q.x)} y2={fmt(q.y)} stroke={rgba(lit(LEG, 0.35), 0.65)} strokeWidth={0.06} />;
          })}
        </Deco>
      </g>
    );
  };

  // tail fan (telson + uropods), drawn in its old straight-body frame and carried to the end of segment 6
  const fan = 2.0 * Math.sin(tau * 1.6) + 1.2 * n(tau * 0.7, 4);
  const D6 = SEG_D[6];
  const tailT = `translate(${fmt(D6.x)} ${fmt(D6.y)}) rotate(${fmt(TEL_A - 180 + fan)}) translate(33 1.1)`;

  // small (normal) claw on the far side
  const sHip = v(-1.4, 2.4);
  const sKnee = v(2.7, 4.7 + 0.1 * Math.sin(tau * 1.3));
  const sCarp = v(4.0, 4.85);
  const sPalm = v(6.5, 5.25);
  const sTip = v(8.0, 5.65);
  const sOpen = 6 + 5 * Math.sin(tau * 1.1);
  const farC = FAR(BODY);

  // carapace: slim, laterally compressed profile; the rounded orbital hoods project forward over the eyes
  const CARA = pts([[0.85, -1.85], [1.45, -1.35], [1.6, -0.6], [1.15, 0.15], [0.2, 0.85], [-1.2, 1.9], [-3.8, 2.6], [-8.2, 2.8], [-11.8, 2.55], [-13.1, 1.8], [-13.3, -0.4], [-12.9, -2.8], [-10.0, -3.3], [-6.0, -3.4], [-2.6, -3.05], [-0.7, -2.55], [0.4, -2.15]]);
  const caraD = closedPath(CARA, 0.9);

  // chromatophore speckles (deterministic)
  const speck: V[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i * 2.399963) % (2 * Math.PI), r = Math.sqrt((i + 0.5) / 40);
    speck.push(v(-6.6 + Math.cos(a) * r * 5.8, -0.3 + Math.sin(a) * r * 2.4));
  }

  return (
    <g>
      {/* ---- far side: antenna, legs, small claw ---- */}
      {flag(antFar, 0.11, FAR(LEG), 'af')}
      {legs.map((L, i) => {
        const hip = add(L.hip, farOff), foot = add(L.foot, farFoot);
        return <Leg key={`fl${i}`} id={`h9-fl${i}`} hip={hip} foot={foot} color={FAR(LEG)} w={w} r={0.32} kneeSide={kneeSide(hip, foot)} />;
      })}
      <LegP2 id="h9-fp2" hip={add(v(-3.4, 2.65), farOff)} tip={v(0.4, FOOT - 0.5)} color={FAR(LEG)} w={w} />
      <Inked w={w}>
        <Capsule id="h9-sm1" a={sHip} b={sKnee} ra={0.5} rb={0.42} color={farC} />
        <Capsule id="h9-sm2" a={sKnee} b={sCarp} ra={0.42} rb={0.4} color={farC} />
        <Capsule id="h9-sm3" a={sCarp} b={sPalm} ra={0.55} rb={0.48} color={farC} />
        <Capsule id="h9-sm4" a={sPalm} b={sTip} ra={0.24} rb={0.08} color={mix(farC, TIP, 0.3)} />
        <Capsule id="h9-sm5" a={add(sPalm, v(0, -0.2))} b={add(rot(sub(sTip, sPalm), -sOpen), add(sPalm, v(0, -0.25)))} ra={0.2} rb={0.07} color={mix(farC, TIP, 0.3)} />
      </Inked>
      {/* ---- pleopods (bases hidden under the pleura) ---- */}
      {[0, 1, 2, 3, 4].map((i) => pleo(i, true))}
      {[0, 1, 2, 3, 4].map((i) => pleo(i, false))}
      {/* ---- tail fan: telson + uropods ---- */}
      <g transform={tailT}>
        <Inked w={w}>
          <Blob id="h9-uroF" d={closedPath(pts([[-32.6, 0.2], [-36.0, -1.6], [-39.2, -2.2], [-39.6, -1.1], [-36.4, 0.6]]), 0.9)} c={v(-36, -1)} r={4} color={FAR(ABD)} />
          <Blob id="h9-uroE" d={closedPath(pts([[-32.6, 1.0], [-36.2, 1.8], [-39.0, 2.9], [-39.6, 2.1], [-36.5, 0.5]]), 0.9)} c={v(-36, 1.5)} r={4} color={lit(ABD, 0.05)} />
          <Blob id="h9-tel" d={closedPath(pts([[-32.4, -0.9], [-35.8, -0.45], [-38.9, 0.05], [-39.1, 0.6], [-35.8, 1.1], [-32.4, 1.5]]), 0.9)} c={v(-35, 0)} r={4} color={ABD} />
          <Blob id="h9-uroN" d={closedPath(pts([[-32.6, 0.6], [-35.9, -0.6], [-39.6, -0.6], [-40.1, 0.4], [-36.2, 1.4]]), 0.9)} c={v(-36, 0.2)} r={4} color={lit(ABD, 0.08)} />
        </Inked>
        <Deco>
          {[-0.4, 0.2, 0.8].map((y, i) => (
            <path key={i} d={`M-33.4,${0.5 + y * 0.3} L-39.3,${-0.5 + y}`} stroke={rgba(BAND, 0.35)} strokeWidth={0.06} fill="none" />
          ))}
          <path d="M-35.5,-0.1 L-39.6,0.05" stroke={rgba(TIP, 0.45)} strokeWidth={0.35} strokeLinecap="round" />
        </Deco>
      </g>
      {/* ---- abdomen: 6 curved segments back-to-front; the 2nd pleuron overlaps the 1st and 3rd; translucent banding ---- */}
      {[5, 4, 3, 2, 0, 1].map((i) => {
        const P = segPts(i);
        const c = segAt(i, SEG_L[i] * 0.4, SEG_H[i] * 0.3);
        return (
          <Inked key={`s${i}`} w={w}>
            <Blob id={`h9-seg${i}`} d={closedPath(P, 0.8)} c={c} r={SEG_H[i] * 0.95} color={ABD} k={1.05} focal={0.5} />
            <Deco>
              <path d={openPath([lerpV(P[1], P[2], 0.5), P[2], P[3], P[4]])} fill="none" stroke={rgba(BAND, 0.55)} strokeWidth={0.55} strokeLinecap="round" />
              <path d={openPath([segAt(i, SEG_L[i] - 0.55, 0.15), segAt(i, SEG_L[i] - 0.5, SEG_H[i] * 0.5), segAt(i, SEG_L[i] - 0.95, SEG_H[i] * 0.88)])} fill="none" stroke={rgba('#F3EED6', 0.42)} strokeWidth={0.4} strokeLinecap="round" />
              <path d={openPath([P[4], P[5], P[6]])} fill="none" stroke={rgba(lit(ABD, 0.55), 0.5)} strokeWidth={0.22} strokeLinecap="round" />
              <Gloss id={`h9-sgl${i}`} c={segAt(i, SEG_L[i] * 0.45, 0.5)} rx={SEG_L[i] * 0.28} ry={0.13} rotate={SEG_A[i] - 180} opacity={0.5} />
              {[0, 1, 2].map((k) => {
                const q = segAt(i, SEG_L[i] * (0.2 + 0.3 * k), SEG_H[i] * (0.5 + 0.12 * (k % 2)));
                return <circle key={k} cx={fmt(q.x)} cy={fmt(q.y)} r={0.12} fill="#8A3E2A" opacity={0.42} />;
              })}
            </Deco>
          </Inked>
        );
      })}
      {/* gut line seen through the translucent abdomen */}
      <path d={openPath([v(-11.8, -1.5), ...[0, 1, 2, 3, 4, 5].map((i) => segAt(i, SEG_L[i] * 0.5, SEG_H[i] * 0.3)), add(D6, mul(venOf(SEG_A[5]), 1.0))])} fill="none" stroke={rgba('#4E4420', 0.3)} strokeWidth={0.3} strokeLinecap="round" />
      {/* ---- near legs: P2 then P5..P3 (bases under the carapace edge) ---- */}
      <LegP2 id="h9-np2" hip={v(-3.4, 2.65)} tip={v(-0.2, FOOT - 0.1)} color={LEG} w={w} />
      {legs.slice().reverse().map((L, i) => (
        <Leg key={`nl${i}`} id={`h9-nl${i}`} hip={L.hip} foot={L.foot} color={LEG} w={w} kneeSide={kneeSide(L.hip, L.foot)} />
      ))}
      {/* ---- carapace ---- */}
      <g transform={`translate(0 ${fmt(breathe * 0.2)})`}>
        <Inked w={w}>
          <Blob id="h9-cara" d={caraD} c={v(-6.0, -1.4)} r={8.2} color={BODY} k={1.1} focal={0.5} />
          <Deco>
            <defs>
              <clipPath id="h9-caraclip">
                <path d={caraD} />
              </clipPath>
            </defs>
            <g clipPath="url(#h9-caraclip)">
              {/* translucent interior: digestive gland and heart showing through */}
              <ellipse cx={-6.8} cy={-0.5} rx={3.6} ry={1.6} fill="#8E5A2E" opacity={0.15} />
              <ellipse cx={-9.4} cy={-2.2} rx={0.9} ry={0.5} fill="#9A4A34" opacity={0.18 + 0.06 * Math.sin(tau * 9)} />
              {/* translucent bands: a pale dorsal saddle and two darker transverse bands */}
              <path d={openPath(pts([[-12.6, -2.6], [-8, -3.1], [-3, -2.8], [-0.6, -2.3]]))} fill="none" stroke={rgba('#F3EED6', 0.35)} strokeWidth={0.7} strokeLinecap="round" />
              <rect x={-4.8} y={-4} width={1.3} height={8} fill={BAND} opacity={0.2} transform="rotate(8 -4.2 0)" />
              <rect x={-10.2} y={-4} width={1.6} height={8} fill={BAND} opacity={0.2} transform="rotate(8 -9.4 0)" />
              <rect x={-12.9} y={-4} width={0.6} height={8} fill="#F3EED6" opacity={0.22} />
            </g>
            {/* branchiostegite lower edge and the pale ventral rim */}
            <path d={openPath(pts([[-1.0, 1.7], [-4.5, 2.35], [-9.0, 2.5], [-12.5, 2.1]]))} fill="none" stroke={rgba(lit(BODY, 0.55), 0.5)} strokeWidth={0.22} strokeLinecap="round" />
            {speck.map((p, i) => (
              <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={0.08 + 0.05 * ((i * 7) % 3)} fill="#86402A" opacity={0.36} />
            ))}
            <Gloss id="h9-caragl" c={v(-7.2, -2.7)} rx={3.2} ry={0.3} rotate={-2} opacity={0.6} />
          </Deco>
        </Inked>
        {/* the eye lies UNDER the translucent orbital hood: a soft dark spot, no crisp outline, the hood's sheen over it */}
        <Deco>
          <defs>
            <radialGradient id="h9-eye">
              <stop offset="0" stopColor="#24120E" stopOpacity="0.62" />
              <stop offset="0.55" stopColor="#3A1C14" stopOpacity="0.45" />
              <stop offset="1" stopColor="#3A1C14" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="h9-hood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFF6EA" stopOpacity="0.34" />
              <stop offset="1" stopColor="#FFF6EA" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <ellipse cx={0.05} cy={-1.3} rx={0.95} ry={0.82} fill="url(#h9-eye)" />
          <path d={closedPath(pts([[-1.9, -2.55], [-0.4, -2.45], [0.9, -1.85], [1.5, -1.0], [1.3, -0.25], [0.3, 0.0], [-1.1, -0.45], [-1.95, -1.4]]), 0.9)} fill="url(#h9-hood)" />
          <path d={openPath(pts([[-1.95, -2.5], [-2.05, -1.3], [-1.2, -0.4], [0.2, -0.05]]))} fill="none" stroke={rgba(INK, 0.45)} strokeWidth={w * 0.45} strokeLinecap="round" />
          <path d={openPath(pts([[-0.9, -2.25], [0.4, -2.0], [1.1, -1.4]]))} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={0.16} strokeLinecap="round" />
        </Deco>
      </g>
      {/* ---- antennal scale, peduncles, antennules, the near antenna (all behind the claw) ---- */}
      <Inked w={w}>
        <Capsule id="h9-ped" a={v(0.2, 0.2)} b={v(3.6, 0.35)} ra={0.32} rb={0.26} color={LEG} />
        <Blob id="h9-scale" d={closedPath(pts([[0.3, -0.2], [2.6, -0.65], [4.8, -0.55], [5.0, -0.25], [2.6, 0.35], [0.5, 0.5]]), 0.9)} c={v(2.4, -0.3)} r={2.6} color={lit(LEG, 0.12)} />
        <Capsule id="h9-a1a" a={v(0.6, -1.2)} b={v(1.9, -1.45)} ra={0.3} rb={0.27} color={LEG} />
        <Capsule id="h9-a1b" a={v(1.9, -1.45)} b={v(2.8, -1.55)} ra={0.25} rb={0.23} color={LEG} />
        <Capsule id="h9-a1c" a={v(2.8, -1.55)} b={v(3.4, -1.55)} ra={0.22} rb={0.2} color={LEG} />
      </Inked>
      {flag(aL, 0.12, lit(LEG, 0.05), 'al')}
      {flag(aU, 0.13, lit(LEG, 0.05), 'au')}
      {flag(antNear, 0.13, LEG, 'an')}
      {/* ---- near side: the big snapping claw ---- */}
      <g transform={`rotate(${CLAW_RAISE} ${CLAW_COXA.x} ${CLAW_COXA.y})`}>
        <BigClaw open={open} w={w} t={t} />
      </g>
    </g>
  );
};

/** the boulder the shrimp is perched on, drawn in shrimp-local space (top surface at FOOT_Y), with its contact shadow */
export const Rock: React.FC<{tau: number; w: number}> = ({tau, w}) => {
  const F = FOOT_Y;
  const top = pts([[-70, F + 1.2], [-52, F + 0.4], [-40, F + 0.9], [-30, F + 0.3], [-20, F + 0.55], [-10, F + 0.15], [-3, F + 0.3], [1.5, F + 0.5], [4.4, F + 1.6], [6.0, F + 4.0]]);
  const body = [...top, ...pts([[6.2, F + 8], [4.0, F + 12.5], [-2, F + 16], [-14, F + 19], [-30, F + 21], [-50, F + 24], [-70, F + 30]])];
  const d = openPath(body, 0.8) + ' Z';
  // encrusting growth as soft irregular blotches (coralline pink, sponge ochre, algal green), low contrast
  const blot = (cx: number, cy: number, r: number, k: number) =>
    closedPath(Array.from({length: 9}).map((_, i) => {
      const a = (i / 9) * Math.PI * 2, rr = r * (0.75 + 0.45 * hash(k * 13 + i * 3.1));
      return v(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6);
    }), 1);
  const patches: [number, number, number, string][] = [[-24, 2.2, 3.0, '#A97C84'], [-8, 6, 4.0, '#8B9468'], [-1, 2.0, 1.8, '#A97C84'], [-38, 7, 5, '#7D8B70'], [-15, 13, 4.5, '#A68A64'], [-30, 16, 5, '#A97C84'], [-46, 3, 3.5, '#A68A64']];
  return (
    <g>
      <defs>
        <linearGradient id="h9-rock" gradientUnits="userSpaceOnUse" x1="0" y1={F - 1} x2="3" y2={F + 20}>
          <stop offset="0" stopColor="#8A8E7A" />
          <stop offset="0.15" stopColor="#6A7468" />
          <stop offset="0.6" stopColor="#4A5A58" />
          <stop offset="1" stopColor="#36474C" />
        </linearGradient>
      </defs>
      <path d={d} fill={INK} stroke={INK} strokeWidth={w * 0.72 * 2} strokeLinejoin="round" />
      <path d={d} fill="url(#h9-rock)" />
      {/* encrusting coralline and sponge patches, pits */}
      {patches.map(([x, y, r, c], i) => (
        <path key={i} d={blot(x, F + y, r, i)} fill={c} opacity={0.24} />
      ))}
      {Array.from({length: 46}).map((_, i) => {
        const x = -62 + ((i * 37.3) % 76), y = F + 1.5 + ((i * 13.7) % 22);
        return <ellipse key={`pit${i}`} cx={fmt(x)} cy={fmt(y)} rx={fmt(0.3 + (i % 4) * 0.18)} ry={fmt(0.18 + (i % 3) * 0.1)} fill="#2A3A3A" opacity={0.3} />;
      })}
      {/* lit top edge and a few algae tufts along it */}
      <path d={openPath(top, 0.8)} fill="none" stroke={rgba('#E8E4CC', 0.35)} strokeWidth={0.45} strokeLinecap="round" />
      {[-46, -27, -16].map((x, i) => (
        <g key={`tuft${i}`}>
          {[0, 1, 2, 3].map((k) => {
            const sw = 0.4 * Math.sin(tau * 1.3 + i + k * 0.7);
            const bx = x + (k - 1.5) * 0.4;
            return <path key={k} d={`M${fmt(bx)},${fmt(F + 0.5)} Q${fmt(bx + (k - 1.5) * 0.4 + sw * 0.4)},${fmt(F - 1.6)} ${fmt(bx + (k - 1.5) * 0.7 + sw)},${fmt(F - 3.0 - (k % 2))}`}
              stroke={i % 2 ? '#6E7F4A' : '#7C6A44'} strokeWidth={0.22} fill="none" strokeLinecap="round" />;
          })}
        </g>
      ))}
      <SoftShadow id="h9-shadow" c={v(-9, F + 0.35)} rx={16} ry={1.1} alpha={0.4} color="#14302E" />
      <SoftShadow id="h9-shadow2" c={v(-24, F + 0.3)} rx={6} ry={0.8} alpha={0.3} color="#14302E" />
    </g>
  );
};
