// The illustrated middle of the Short: one dusk test site and one schematic car (CarRig, one car-local frame), seen in
// six compositions joined by camera moves that each reveal something:
//   match      the drawn outline lands on the real car (side replay, the frame the trace was made from); the drawing
//              replaces it, still descending on its jets, and the night becomes the illustrated dusk
//   B gas      one push-in to a close cutaway: gas stored in the tank, the valve opening, gas markers running through
//              the pipe, a burst leaving the nozzle; each burst takes a few markers and the gas pales (reserve, no number)
//   C forces   pull back to the whole car: THRUST up equals WEIGHT down (same scale), then both go
//   D tank     the side panel lifts again and the tank becomes the subject (the rest of the frame dims): a bigger tank
//              with more gas, a heavier wall, brackets bolted to the body, a small weight arrow growing, a frame closing
//   E balance  pull back to a larger side view: centre-of-mass dot; the rear jet runs stronger, the push misses the
//              centre (amber line of action and lever arm), the car turns nose-down (one amber arc); one nose burst
//              stops it and sends it back, a short trim settles it level, the dot goes from amber to white; a dashed
//              phantom of the tank shows that correction's gas leaving for the nose
//   F gravel   the camera follows the rear jet down as the car descends to a patch of loose gravel: a few stones thrown
//              outward along the pad, a little dust, then a short dust pass back to the footage
// Colours (as the companion): gas/air blue, forces saffron, weight ink-grey, the imbalance amber.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {OUTLINE_D} from '../companion3/Car3';
import {C, F} from '../theme';
import {ArcArrow, Arrow, Cam, E, FLOW, FORCE, PWorld, Tag, WEIGHT, camAt, ramp, rnd, toScreen, win} from './kit';
import {AMBER, CarRig} from './CarRig';
import {FPS, T, WIPE} from './data';
import {CG, DESC0, DESC1, GROW, H_HOVER, H_LOW, NOZ, PITCH_SEGS, SETTLED, heightAt, nozzleAt, pitchAt, tankAt} from './sim';

// ---------------------------------------------------------------- the match with the footage
// At the swap the replay's car spans about x 49-1031 (nose to tail lights), roof at y 994 on the 1080x1920 frame
// (measured on magnified frames, footage/CLIP_LEDGER.md); the drawn car is placed on it at the same size, nose left.
export const MATCH = {z: 2.28, noseX: 49, roofY: 994};
const H_SWAP = heightAt(T.swap);
const M: Cam = {z: MATCH.z, x: -213 - (MATCH.noseX - 540) / MATCH.z, y: -H_SWAP - 134 - (MATCH.roofY - 960) / MATCH.z};
const ROOF = -134, FLOOR = -20;
const L0 = 160;                                   // force arrow length (C): thrust and weight drawn to the same scale

/** World position of a car-local point (mirrored: local +x is screen left), with the pitch about CG. */
export const carPt = (t: number, lx: number, ly: number) => {
  const th = (pitchAt(t).th * Math.PI) / 180;
  const dx = lx - CG.x, dy = ly - CG.y;
  const rx = CG.x + dx * Math.cos(th) - dy * Math.sin(th), ry = CG.y + dx * Math.sin(th) + dy * Math.cos(th);
  return {x: -rx, y: ry - heightAt(t)};
};

// cameras: B-E ride with the car (relative to its height h), F is fixed to the ground at the rear jet
const KB = (h: number): Cam => ({x: 2, y: -50 - h, z: 5.6});        // tank, valve, pipe, front nozzle and its exit
const KC = (h: number): Cam => ({x: 2, y: 116 - h, z: 1.55});       // whole car, centre of mass at y ~700
const KC2 = (h: number): Cam => ({x: 8, y: 112 - h, z: 1.66});      // the same view, drifting in slowly while it holds
const KD = (h: number): Cam => ({x: 20, y: -71 - h, z: 6.6});       // the tank alone, centred at y ~900
const KE = (h: number): Cam => ({x: 2, y: -2 - h, z: 2.15});        // larger side view, centre of mass at y ~860
const KF: Cam = {x: -NOZ.rear.x, y: -57.7, z: 3.29};                // rear nozzle at y ~640, the ground at y ~1150
export const camKeys = (h: number): [number, Cam, ((x: number) => number)?][] => [
  [T.swap + 0.02, M], [T.jets + 0.65, KB(h), E.inOut],
  [T.upEnd + 0.05, KB(h)], [T.hovering + 0.55, KC(h), E.inOut],
  [T.weightEnd + 0.25, KC2(h), (x: number) => x], [T.bigger + 0.45, KD(h), E.inOut],
  [T.protectionEnd + 0.25, KD(h)], [T.then + 0.55, KE(h), E.inOut],
  [T.tooEnd + 0.1, KE(h)], [DESC1 + 0.1, KF, E.inOut],
];

// ---------------------------------------------------------------- environment
/** Sky: screen space, behind everything. */
const Sky: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #1D2B4E 0%, #3E5487 34%, #7E7BA0 62%, #D79A6A 86%, #F0C089 100%)'}} />
);
/** Far layer (drawn with a slower, flatter camera): clouds, the far edge of the site, lights, a plain. */
const Far: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rkHaze" x1="0" y1={-260} x2="0" y2={40} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#F2C48C" stopOpacity={0} />
        <stop offset="1" stopColor="#F2C48C" stopOpacity={0.55} />
      </linearGradient>
    </defs>
    {[[-520, -900, 1.2], [380, -760, 1], [-120, -1120, 1.3], [620, -1040, 0.9], [-760, -600, 0.8], [260, -520, 0.7]].map(([cx, cy, k], i) => (
      <g key={i} opacity={0.32}>
        <ellipse cx={cx} cy={cy} rx={210 * k} ry={42 * k} fill="#F2E9F0" />
        <ellipse cx={cx + 90 * k} cy={cy - 28 * k} rx={110 * k} ry={40 * k} fill="#F2E9F0" />
        <ellipse cx={cx - 100 * k} cy={cy - 14 * k} rx={96 * k} ry={34 * k} fill="#F2E9F0" />
      </g>
    ))}
    <path d="M -3000 -70 C -2200 -150 -1600 -90 -900 -128 C -300 -165 300 -80 900 -122 C 1500 -160 2200 -90 3000 -112 L 3000 10 L -3000 10 Z" fill="#8A7378" opacity={0.75} />
    <path d="M -3000 -30 C -2000 -70 -1200 -40 -400 -62 C 400 -84 1300 -36 3000 -58 L 3000 10 L -3000 10 Z" fill="#6E5E66" opacity={0.85} />
    {/* distant light towers and a hangar */}
    {[-1500, -640, 380, 1240].map((x, i) => (
      <g key={i} opacity={0.8}>
        <line x1={x} y1={0} x2={x} y2={-170} stroke="#4F4650" strokeWidth={6} />
        <rect x={x - 22} y={-184} width={44} height={16} rx={3} fill="#4F4650" />
        <circle cx={x} cy={-176} r={9} fill="#FFE6B0" opacity={0.85} />
      </g>
    ))}
    <path d="M -1150 0 L -1150 -58 Q -980 -120 -810 -58 L -810 0 Z" fill="#5A4E58" opacity={0.9} />
    {Array.from({length: 26}, (_, i) => <circle key={i} cx={-2600 + i * 210 + rnd(i) * 80} cy={-14 - rnd(i + 7) * 16} r={4.5} fill="#FFE6B0" opacity={0.7} />)}
    <linearGradient id="rkPlain" x1="0" y1={0} x2="0" y2={700} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#C9AE93" />
      <stop offset="0.35" stopColor="#A89A8C" />
      <stop offset="1" stopColor="#8F877E" />
    </linearGradient>
    <rect x={-3000} y={0} width={6000} height={3000} fill="url(#rkPlain)" />
    <rect x={-3000} y={-260} width={6000} height={300} fill="url(#rkHaze)" />
  </g>
);
/** The near pad (world, top edge at y = 0). */
const Pad: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rkPad" x1="0" y1={0} x2="0" y2={500} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#B9B2A6" />
        <stop offset="1" stopColor="#8B857B" />
      </linearGradient>
    </defs>
    <rect x={-3000} y={0} width={6000} height={900} fill="url(#rkPad)" />
    <rect x={-3000} y={0} width={6000} height={6} fill="#7E786F" />
    {Array.from({length: 14}, (_, i) => <line key={i} x1={-2600 + i * 400} y1={8} x2={-2700 + i * 400} y2={900} stroke="#A49D92" strokeWidth={4} />)}
  </g>
);

// loose gravel under the rear jet's ground point: a low mound of small stones, a few larger ones that get thrown
const PATCH = {x: -NOZ.rear.x, w: 120};
const STONES = Array.from({length: 70}, (_, i) => {
  const big = i < 14;
  const side = i % 2 ? 1 : -1;
  return {
    x: PATCH.x + (big ? side * (8 + 50 * rnd(i * 3 + 1)) : (rnd(i * 3 + 1) - 0.5) * 2 * PATCH.w * (0.3 + 0.7 * rnd(i + 400))),
    r: big ? 4.2 + 2.6 * rnd(i * 5 + 2) : 1.6 + 2.2 * rnd(i * 5 + 2),
    c: ['#6E655B', '#857A6D', '#5A524A', '#9A8F80', '#776B5E'][i % 5],
    vx: rnd(i * 7 + 3), vy: rnd(i * 11 + 5), big,
  };
});
/** The gravel: before the blast a light stir under the descending jet; on "blast" the big stones are thrown outward
 *  (each one easy to follow), land and skid; small ones scatter a little. The pad itself is untouched. */
const Gravel: React.FC<{t: number}> = ({t}) => {
  const stir = DESC1 - 0.15, blast = T.blast2 + 0.02;
  return (
    <g>
      <path d={`M ${PATCH.x - PATCH.w - 26} 2 Q ${PATCH.x - PATCH.w + 8} -8 ${PATCH.x - PATCH.w * 0.5} -10 L ${PATCH.x + PATCH.w * 0.5} -10 Q ${PATCH.x + PATCH.w - 8} -8 ${PATCH.x + PATCH.w + 26} 2 Z`} fill="#8A7E70" stroke="#5E554B" strokeWidth={2} />
      {STONES.map((p, i) => {
        const near = 1 - Math.min(1, Math.abs(p.x - PATCH.x) / PATCH.w);
        const rest = -p.r * 0.6 - 8 * Math.max(0, near);
        const dir = Math.sign(p.x - PATCH.x) || 1;
        let x = p.x, y = rest;
        // stir: small stones near the centre shuffle outward a little
        if (!p.big && t > stir && near > 0.5) x += dir * 10 * Math.min(1, (t - stir) / 0.6) * near;
        const t0 = p.big ? blast + (i % 7) * 0.07 + rnd(i + 700) * 0.05 : blast + 0.05 + rnd(i + 700) * 0.4;
        const a = t - t0;
        if (a > 0 && (p.big || near > 0.35)) {
          const vx = p.big ? 130 + 150 * p.vx : 60 + 80 * p.vx;
          const vy = p.big ? 110 + 140 * p.vy : 50 + 70 * p.vy;
          const tFly = (2 * vy) / 981;
          const ta = Math.min(a, tFly);
          const skid = a > tFly ? (vx * 0.35 / 3) * (1 - Math.exp(-(a - tFly) * 3)) : 0;
          x = x + dir * (vx * ta + skid);
          y = Math.min(rest, -(vy * ta - 0.5 * 981 * ta * ta) - p.r * 0.6);
        }
        return <circle key={i} cx={x} cy={y} r={p.r} fill={p.c} stroke="#2E2823" strokeWidth={p.big ? 1.4 : 0.8} />;
      })}
    </g>
  );
};
/** Dust at the jet's footprint (world): soft puffs rolling outward along the pad, stronger after the blast. */
const Dust: React.FC<{t: number}> = ({t}) => {
  const a0 = DESC1 - 0.1;
  if (t < a0) return null;
  const blobs: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const born = a0 + i * 0.09;
    const a = t - born;
    if (a < 0) continue;
    const dir = i % 2 ? 1 : -1;
    const strong = born > T.blast2 ? 1.5 : 0.6;
    const x = PATCH.x + dir * (14 + a * 120 * strong * (0.6 + 0.6 * rnd(i)));
    const y = -10 - a * (24 + 40 * rnd(i + 3)) * strong;
    const r = 10 + a * 44 * strong;
    blobs.push(<circle key={i} cx={x} cy={y} r={r} fill="url(#rkDust)" opacity={Math.max(0, 0.75 - a * 0.35)} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="rkDust"><stop offset="0" stopColor="#B9A88F" stopOpacity={0.8} /><stop offset="0.55" stopColor="#C2B39C" stopOpacity={0.45} /><stop offset="1" stopColor="#C8BAA4" stopOpacity={0} /></radialGradient>
      </defs>
      {blobs}
    </g>
  );
};
/** The jet meeting the ground: flow lines spreading both ways along the pad. */
const Splash: React.FC<{t: number; x: number; k: number; gap: number}> = ({t, x, k, gap}) => {
  if (k <= 0.05 || gap > 230) return null;
  const s = Math.min(1, (230 - gap) / 120) * Math.min(1, k);
  return (
    <g opacity={s}>
      {[-1, 1].map((d) => [0, 1].map((j) => {
        const ph = (t * 1.6 + j * 0.5) % 1;
        return <path key={`${d}${j}`} d={`M ${x + d * 14} -8 Q ${x + d * (34 + ph * 50)} -5 ${x + d * (60 + ph * 120)} -${7 + j * 7}`} stroke={FLOW} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={1 - ph} />;
      }))}
    </g>
  );
};

// ---------------------------------------------------------------- the scene
export const Schematic: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / FPS;
  const H = heightAt(t);
  const cam = camAt(t, camKeys(H));
  const far: Cam = {x: cam.x * 0.3, y: cam.y * 0.3, z: 1 + (cam.z - 1) * 0.25};
  const pitch = pitchAt(t);
  const bg = ramp(t, T.swap - 0.05, T.swap + 0.5, E.inOut);
  const outline = win(t, T.match, T.swap + 0.25, 0.1, 0.18);
  const carO = ramp(t, T.swap - 0.04, T.swap + 0.08);
  const pre = win(t, T.pre, T.swap + 0.1, 0.12, 0.12);
  // the side panel: open for B, shut for C, open for D, shut from E on
  const cut = Math.max(
    ramp(t, T.jets - 0.1, T.jets + 0.5, E.inOut) * (1 - ramp(t, T.upEnd, T.hovering + 0.4, E.inOut)),
    ramp(t, T.weightEnd + 0.25, T.bigger + 0.35, E.inOut) * (1 - ramp(t, T.protectionEnd + 0.15, T.then + 0.45, E.inOut)),
  );
  const shell = ramp(t, T.add - 0.05, T.add + 0.4, E.out);
  const brackets = ramp(t, T.weight2, T.weight2 + 0.45, E.out);
  const cage = ramp(t, T.protection - 0.08, T.protection + 0.45, E.inOut);
  const tankWeight = win(t, T.add, T.protectionEnd + 0.2, 0.2, 0.25) * (0.3 + 0.7 * (shell + brackets + cage) / 3);
  const focus = win(t, T.bigger + 0.1, T.protectionEnd + 0.3, 0.4, 0.45);
  // E
  const cg = ramp(t, T.balance - 0.05, T.balance + 0.3, E.out) * (1 - ramp(t, DESC0, DESC0 + 0.3, E.in));
  const offO = win(t, T.misses - 0.05, PITCH_SEGS[0].t1 + 0.35, 0.22, 0.3);
  const amber = Math.min(1, ramp(t, T.misses - 0.05, T.misses + 0.25) * (1 - ramp(t, SETTLED - 0.3, SETTLED + 0.1)));
  const phantom = win(t, T.thrusters - 0.12, T.tooEnd + 0.1, 0.25, 0.3);
  // C: thrust up from the roof and weight down from the floor, on the centre's line, equal; gone when C ends
  const cOut = 1 - ramp(t, T.weightEnd + 0.12, T.weightEnd + 0.4, E.in);
  const wIn = ramp(t, T.hovering + 0.3, T.hovering + 0.7, E.out) * cOut;
  const tIn = ramp(t, T.pushing, T.pushing + 0.4, E.out) * cOut;
  const eq = win(t, T.entire - 0.05, T.weightEnd + 0.4, 0.15, 0.28);
  const cgW = carPt(t, CG.x, CG.y);
  const roofW = carPt(t, CG.x, ROOF), floorW = carPt(t, CG.x, FLOOR);
  const S = (p: {x: number; y: number}) => toScreen(cam, p.x, p.y);
  const k = nozzleAt(t);
  const rearGround = carPt(t, NOZ.rear.x, NOZ.rear.y), frontGround = carPt(t, NOZ.front.x, NOZ.front.y);
  const arcO = Math.min(1, Math.max(0, (pitch.w - 0.4) / 1.6)) * cg * (t < PITCH_SEGS[1].t1 ? 1 : 0);
  const massGain = 1 + 0.16 * ramp(t, T.add + 0.1, T.protection + 0.3, E.inOut) * (t < GROW.t0 ? 0 : 1);
  // dust pass at the end: grows from the impact toward the camera, covers briefly, thins over the footage
  const fgIn = ramp(t, WIPE - 0.42, WIPE - 0.04, E.in);
  const world = t < WIPE ? 1 : 0;                  // behind the dust the drawing is gone; the aerial is underneath
  const thin = 1 - ramp(t, WIPE + 0.02, WIPE + 0.32, E.out);
  const patchS = S({x: PATCH.x, y: 0});
  // labels
  const cgS = S(cgW);
  const tagCG = win(t, T.balance + 0.05, T.rotate + 0.1, 0.2, 0.3);
  const thrS = S({x: roofW.x, y: roofW.y - L0 * tIn});
  const wS = S({x: floorW.x, y: floorW.y + L0 * wIn});
  const illus = win(t, T.swap + 0.3, T.swap + 1.65, 0.2, 0.3);
  const tankS = tankAt(t);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: world}}>
        <AbsoluteFill style={{opacity: bg}}>
          <Sky />
          <PWorld cam={far}><Far /></PWorld>
          <PWorld cam={cam}><Pad /><Gravel t={t} /></PWorld>
        </AbsoluteFill>
        <PWorld cam={cam}>
          <Dust t={t} />
          <Splash t={t} x={rearGround.x} k={k.rear} gap={-rearGround.y} />
          <Splash t={t} x={frontGround.x} k={k.front} gap={-frontGround.y} />
          <defs><clipPath id="rkAbove"><rect x={-4000} y={-4000} width={8000} height={4000} /></clipPath></defs>
          <g clipPath="url(#rkAbove)">
            <g opacity={carO} transform={`translate(0 ${-H}) scale(-1 1) rotate(${pitch.th} ${CG.x} ${CG.y})`}>
              <CarRig s={{t, cut, shell, brackets, cage, tankWeight, cgMark: cg, cgAmber: amber, offset: {o: offO, d: 50}, noseArrow: true,
                phantom, plumeLen: (250 + 30 * (1 - H / H_HOVER)) * massGain, flowGlow: win(t, T.blast - 0.05, T.air + 0.3, 0.1, 0.3)}} />
            </g>
          </g>
          {/* just before the swap: gas-flow chevrons on the real jets (the replay is still playing underneath) */}
          {pre > 0.01 && [NOZ.front, NOZ.rear].map((n, i) => {
            const p = carPt(t, n.x, n.y);
            const len = 175, ph = (t * 2.2) % 1;
            return (
              <g key={i} opacity={pre}>
                <path d={`M ${p.x} ${p.y + 4} L ${p.x} ${p.y + 4 + len}`} stroke="#BFD4F6" strokeWidth={16} strokeLinecap="round" opacity={0.45} />
                {[0, 1, 2].map((j) => {
                  const y = p.y + 14 + ((ph + j / 3) % 1) * (len - 30);
                  return <path key={j} d={`M ${p.x - 9} ${y} L ${p.x} ${y + 10} L ${p.x + 9} ${y}`} stroke={FLOW} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                })}
                <Arrow x1={p.x} y1={p.y + len - 18} x2={p.x} y2={p.y + len + 20} color={FLOW} w={7} head={22} />
              </g>
            );
          })}
          {/* the drawn outline arrives on the real car */}
          {outline > 0 && (
            <g transform={`translate(0 ${-H}) scale(-1 1)`} opacity={outline}>
              <path d={OUTLINE_D} fill="none" stroke={C.saffron} strokeWidth={9 / MATCH.z * 2} strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - ramp(t, T.match, T.match + 0.16, E.out))} />
            </g>
          )}
          {/* C: thrust up, weight down, the same length; equal ticks on "entire weight" */}
          {wIn > 0.01 && <Arrow x1={floorW.x} y1={floorW.y} x2={floorW.x} y2={floorW.y + L0 * wIn} color={WEIGHT} w={16} />}
          {tIn > 0.01 && <Arrow x1={roofW.x} y1={roofW.y} x2={roofW.x} y2={roofW.y - L0 * tIn} color={FORCE} w={16} />}
          {eq > 0.01 && (
            <g opacity={eq * cOut}>
              <line x1={roofW.x - 24} y1={roofW.y - L0 / 2} x2={roofW.x + 24} y2={roofW.y - L0 / 2} stroke={C.ink} strokeWidth={5} />
              <line x1={floorW.x - 24} y1={floorW.y + L0 / 2} x2={floorW.x + 24} y2={floorW.y + L0 / 2} stroke={C.ink} strokeWidth={5} />
            </g>
          )}
          {/* E: one amber arc at the nose while it turns nose-down (none on the way back) */}
          {arcO > 0.01 && <ArcArrow cx={cgW.x} cy={cgW.y} r={235} a0={194} a1={164} color={AMBER} w={11} opacity={arcO} />}
        </PWorld>
        {/* D: the tank is the subject, the rest of the frame dims */}
        {focus > 0.01 && (() => {
          const c = S(carPt(t, (tankS.x0 + tankS.x1) / 2, (tankS.y0 + tankS.y1) / 2));
          const rx = ((tankS.x1 - tankS.x0) / 2 + 24) * cam.z, ry = ((tankS.y1 - tankS.y0) / 2 + 30) * cam.z;
          return (
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: focus * 0.62}}>
              <defs>
                <radialGradient id="rkFocus" cx={c.x} cy={c.y} r={Math.max(rx, ry) * 1.25} gradientUnits="userSpaceOnUse" gradientTransform={`translate(${c.x} ${c.y}) scale(1 ${ry / rx}) translate(${-c.x} ${-c.y})`}>
                  <stop offset="0.62" stopColor="#0B1418" stopOpacity={0} />
                  <stop offset="1" stopColor="#0B1418" stopOpacity={0.85} />
                </radialGradient>
              </defs>
              <rect width={1080} height={1920} fill="url(#rkFocus)" />
            </svg>
          );
        })()}
      </AbsoluteFill>
      {/* the dust pass: from the impact toward the camera, briefly covering, then thinning over the footage */}
      {fgIn > 0 && thin > 0 && (
        <AbsoluteFill style={{pointerEvents: 'none', opacity: thin}}>
          <svg width={1080} height={1920}>
            <defs>
              <radialGradient id="rkFog"><stop offset="0" stopColor="#E2D7C4" stopOpacity={0.9} /><stop offset="0.6" stopColor="#D3C5AE" stopOpacity={0.62} /><stop offset="1" stopColor="#C9BAA2" stopOpacity={0} /></radialGradient>
              <radialGradient id="rkFog2"><stop offset="0" stopColor="#AE9E85" stopOpacity={0.88} /><stop offset="0.6" stopColor="#B8A88F" stopOpacity={0.5} /><stop offset="1" stopColor="#B8A88F" stopOpacity={0} /></radialGradient>
            </defs>
            {Array.from({length: 18}, (_, i) => {
              const born = WIPE - 0.42 + i * 0.02;
              const a = Math.max(0, t - born);
              const sx = patchS.x + (rnd(i + 40) - 0.5) * 1100 * Math.min(1, a * 2.2);
              const sy = patchS.y - 120 + (rnd(i + 80) - 0.4) * 900 * Math.min(1, a * 2.0);
              const r = 90 + a * 1500 * (0.6 + 0.6 * rnd(i + 3));
              return <circle key={i} cx={sx} cy={sy} r={r} fill={i % 3 ? 'url(#rkFog)' : 'url(#rkFog2)'} opacity={Math.min(1, a * 5)} />;
            })}
            <rect width={1080} height={1920} fill="#CFC2AC" opacity={ramp(t, WIPE - 0.1, WIPE - 0.02, E.in) * (1 - ramp(t, WIPE + 0.02, WIPE + 0.14, E.out))} />
          </svg>
        </AbsoluteFill>
      )}
      {world > 0 && <>
        <Tag x={thrS.x + 175} y={thrS.y + 40} text="THRUST" o={tIn} color={C.ink} bg={C.saffronLight} size={50} />
        <Tag x={wS.x + 175} y={wS.y - 40} text="WEIGHT" o={wIn} color={C.cream} bg={WEIGHT} size={50} />
        <Tag x={cgS.x - 30} y={cgS.y + 220} to={{x: cgS.x, y: cgS.y + 22}} text="center of mass" o={tagCG} size={40} />
        {illus > 0 && (
          <div style={{position: 'absolute', top: 236, width: 1080, textAlign: 'center', opacity: illus}}>
            <span style={{fontFamily: F.body, fontWeight: 700, fontSize: 34, letterSpacing: 1.5, color: C.cream, background: 'rgba(14,22,38,0.5)', borderRadius: 16, padding: '5px 18px'}}>Illustration</span>
          </div>
        )}
      </>}
    </AbsoluteFill>
  );
};
export {H_LOW};
