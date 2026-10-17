// The illustrated middle of the Short, one continuous space: a dusk sky over the test pad, with the schematic car.
//   match      the drawn outline lands on the real car (side replay, the frame the trace was made from), the drawing
//              replaces it still descending on its jets, the night becomes the illustrated dusk, the jets brake it to a hover
//   cutaway    the lower side panel lifts off: tank of gas, valve, manifold, nozzles; the gas ribbon runs through them
//   bursts     the jets fire in bursts; each burst takes a few dots of gas out of the tank and the car bobs between them
//   hold       steady jets; THRUST up equals WEIGHT down; gas keeps leaving while the car stays put
//   tank       a bigger tank (more dots) adds weight: heavier wall and mounts, the weight arrow grows (ghost of the
//              old length), the thrust grows to match; a protective frame closes around it
//   balance    the forces retract into a centre-of-mass marker; the rear jet runs stronger, so the lift misses the
//              centre (lever arm): the car turns nose-down; the nose thruster stops it, turns it back, the tail
//              thruster stops it level; every pulse takes gas from the same tank
//   gravel     the panel closes, the car descends toward the pad; under the rear jet is a patch of loose gravel; the
//              blast throws it outward along the ground and a dust cloud rolls toward the camera and wipes to footage
// Colours (as the companion): gas/air blue, forces saffron, weight ink-grey. All of it is a labelled schematic.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {OUTLINE_D} from '../companion3/Car3';
import {C, F} from '../theme';
import {ArcArrow, Arrow, Cam, E, FLOW, FORCE, PWorld, Tag, WEIGHT, camAt, ramp, rnd, toScreen, win} from './kit';
import {CarRig} from './CarRig';
import {FPS, T, WIPE} from './data';
import {CG, H_HOVER, H_LOW, NOZ, PITCH_SEGS, heightAt, nozzleAt, pitchAt, tankAt} from './sim';

// ---------------------------------------------------------------- the match with the footage
// At the swap the replay's car spans about x 49-1031 (nose to tail lights), roof at y 969 on the 1080x1920 frame
// (measured on magnified frames, footage/CLIP_LEDGER.md); the drawn car is placed on it at the same size, nose left.
export const MATCH = {z: 2.28, noseX: 49, roofY: 994};
const H_SWAP = heightAt(T.swap);
const M: Cam = {z: MATCH.z, x: -213 - (MATCH.noseX - 540) / MATCH.z, y: -H_SWAP - 134 - (MATCH.roofY - 960) / MATCH.z};
const ROOF = -134, FLOOR = -20;
const L0 = 160;                                   // force arrow length for the car as built

/** World position of a car-local point (mirrored: local +x is screen left), with the pitch about CG. */
const carPt = (t: number, lx: number, ly: number) => {
  const th = (pitchAt(t).th * Math.PI) / 180;
  const dx = lx - CG.x, dy = ly - CG.y;
  const rx = CG.x + dx * Math.cos(th) - dy * Math.sin(th), ry = CG.y + dx * Math.sin(th) + dy * Math.cos(th);
  return {x: -rx, y: ry - heightAt(t)};
};

const camKeys = (H: number): [number, Cam, ((x: number) => number)?][] => {
  const K1 = {x: 0, y: -H - 58 + 70, z: 2.3};
  const K2 = {x: 30, y: -H - 77 + 60, z: 1.55};
  const K3 = {x: 10, y: -H - 70, z: 1.78};
  const K4 = {x: 25, y: -H - 58 + 30, z: 2.05};
  const K6 = {x: 150, y: -118, z: 2.55};
  return [
    [T.swap + 0.1, M], [T.jets + 0.8, K1, E.inOut],
    [T.keeping - 0.1, K1], [T.airborne + 0.35, K2, E.inOut],
    [T.bigger - 0.05, K2], [T.bigger + 0.7, K3, E.inOut], [T.add - 0.2, K3], [T.add + 0.4, K2, E.inOut],
    [T.then + 0.05, K2], [T.balance + 0.25, K4, E.inOut],
    [T.fire - 0.35, K4], [T.gravel + 0.15, K6, E.inOut],
  ];
};

// ---------------------------------------------------------------- environment
const Sky: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rkSky" x1="0" y1={-1700} x2="0" y2={0} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1F2E52" />
        <stop offset="0.55" stopColor="#4F6596" />
        <stop offset="0.86" stopColor="#D89C6C" />
        <stop offset="1" stopColor="#F2C48C" />
      </linearGradient>
      <linearGradient id="rkPad" x1="0" y1={0} x2="0" y2={500} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#B7B0A4" />
        <stop offset="1" stopColor="#8E887E" />
      </linearGradient>
    </defs>
    <rect x={-3000} y={-2600} width={6000} height={2640} fill="url(#rkSky)" />
    {[[-520, -1180, 1.2], [380, -980, 1], [-120, -1460, 1.3], [620, -1360, 0.9], [-700, -760, 0.8], [260, -640, 0.7]].map(([cx, cy, k], i) => (
      <g key={i} opacity={0.38}>
        <ellipse cx={cx} cy={cy} rx={210 * k} ry={46 * k} fill="#F2E9F0" />
        <ellipse cx={cx + 90 * k} cy={cy - 30 * k} rx={110 * k} ry={44 * k} fill="#F2E9F0" />
        <ellipse cx={cx - 100 * k} cy={cy - 16 * k} rx={96 * k} ry={36 * k} fill="#F2E9F0" />
      </g>
    ))}
    {/* low hills, the far edge of the site and its lights */}
    <path d="M -3000 -50 C -2200 -120 -1600 -70 -900 -100 C -300 -130 300 -60 900 -96 C 1500 -128 2200 -70 3000 -90 L 3000 10 L -3000 10 Z" fill="#7D6A6A" opacity={0.7} />
    {Array.from({length: 22}, (_, i) => <circle key={i} cx={-2600 + i * 250 + rnd(i) * 90} cy={-38 - rnd(i + 7) * 20} r={5} fill="#FFE6B0" opacity={0.75} />)}
    {/* the pad */}
    <rect x={-3000} y={0} width={6000} height={900} fill="url(#rkPad)" />
    <rect x={-3000} y={0} width={6000} height={7} fill="#7E786F" />
    {Array.from({length: 14}, (_, i) => <line key={i} x1={-2600 + i * 400} y1={8} x2={-2700 + i * 400} y2={900} stroke="#A49D92" strokeWidth={4} />)}
  </g>
);

// loose gravel under the rear jet's ground point
const PATCH = {x: 175, w: 150};
const PEBBLES = Array.from({length: 150}, (_, i) => ({
  x: PATCH.x + (rnd(i * 3 + 1) - 0.5) * 2 * PATCH.w * (0.35 + 0.65 * rnd(i + 400)),
  r: i % 4 === 0 ? 1.4 + rnd(i) * 1.2 : 2.4 + rnd(i * 5 + 2) * 4.2,
  c: ['#6E655B', '#857A6D', '#5A524A', '#9A8F80', '#776B5E'][i % 5],
  vx: rnd(i * 7 + 3), vy: rnd(i * 11 + 5), wave: i % 3,
}));
/** The patch, and the gravel the rear jet throws: outward along the pad (the spreading jet), a few lofted high, landing
 *  and skidding to rest. Three waves: a stir as the car gets low, the blast, the rest. The pad itself is untouched. */
const Gravel: React.FC<{t: number}> = ({t}) => {
  const tBlast = [T.gravel - 0.2, T.blast2 + 0.02, T.debris - 0.1];
  return (
    <g>
      <path d={`M ${PATCH.x - PATCH.w - 30} 2 Q ${PATCH.x - PATCH.w + 10} -9 ${PATCH.x - PATCH.w * 0.5} -11 L ${PATCH.x + PATCH.w * 0.5} -12 Q ${PATCH.x + PATCH.w - 6} -9 ${PATCH.x + PATCH.w + 30} 2 Z`} fill="#8A7E70" stroke="#5E554B" strokeWidth={2} />
      {PEBBLES.map((p, i) => {
        const near = 1 - Math.min(1, Math.abs(p.x - PATCH.x) / PATCH.w);
        const rest = -p.r * 0.6 - 9 * Math.max(0, near);
        const t0 = tBlast[p.wave] + rnd(i + 700) * 0.25 + (1 - near) * 0.12;
        const a = t - t0;
        if (a <= 0 || (p.wave === 0 && near < 0.55)) return <circle key={i} cx={p.x} cy={rest} r={p.r} fill={p.c} stroke="#3C352F" strokeWidth={0.8} />;
        const dir = Math.sign(p.x - PATCH.x) || 1;
        const gentle = p.wave === 0;
        const vx = (gentle ? 90 : 230) + (gentle ? 80 : 260) * p.vx;
        const vy = (gentle ? 70 : 160) + (gentle ? 80 : 300) * p.vy * (p.r < 2.5 ? 1.3 : 1);
        const tFly = (2 * vy) / 981;
        const ta = Math.min(a, tFly);
        const skid = a > tFly ? (vx * 0.3 / 4) * (1 - Math.exp(-(a - tFly) * 4)) : 0;
        const x = p.x + dir * (vx * ta + skid);
        const y = Math.min(rest, -(vy * ta - 0.5 * 981 * ta * ta) - p.r * 0.6);
        return <circle key={i} cx={x} cy={y} r={p.r} fill={p.c} stroke="#3C352F" strokeWidth={0.8} />;
      })}
    </g>
  );
};
/** Dust on the ground around the jet's impact (world): soft puffs rolling outward along the pad. */
const Dust: React.FC<{t: number}> = ({t}) => {
  const a0 = T.gravel - 0.35;
  if (t < a0) return null;
  const blobs: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const born = a0 + i * 0.07;
    const a = t - born;
    if (a < 0) continue;
    const dir = i % 2 ? 1 : -1;
    const strong = born > T.blast2 ? 1.9 : 0.8;
    const x = PATCH.x + dir * (20 + a * 170 * strong * (0.6 + 0.6 * rnd(i)));
    const y = -12 - a * (30 + 50 * rnd(i + 3)) * strong;
    const r = 14 + a * 60 * strong;
    blobs.push(<circle key={i} cx={x} cy={y} r={r} fill="url(#rkDust)" opacity={Math.max(0, 0.9 - a * 0.28)} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="rkDust"><stop offset="0" stopColor="#B9A88F" stopOpacity={0.85} /><stop offset="0.55" stopColor="#C2B39C" stopOpacity={0.5} /><stop offset="1" stopColor="#C8BAA4" stopOpacity={0} /></radialGradient>
      </defs>
      {blobs}
    </g>
  );
};
/** The jet meeting the ground: flow lines spreading both ways along the pad (no debris on the solid pad). */
const Splash: React.FC<{t: number; x: number; k: number; gap: number}> = ({t, x, k, gap}) => {
  if (k <= 0.05 || gap > 230) return null;
  const s = Math.min(1, (230 - gap) / 120) * Math.min(1, k);
  return (
    <g opacity={s}>
      {[-1, 1].map((d) => [0, 1].map((j) => {
        const ph = (t * 1.6 + j * 0.5) % 1;
        return <path key={`${d}${j}`} d={`M ${x + d * 18} -10 Q ${x + d * (40 + ph * 60)} -6 ${x + d * (70 + ph * 140)} -${8 + j * 8}`} stroke={FLOW} strokeWidth={4} fill="none" strokeLinecap="round" opacity={1 - ph} />;
      }))}
    </g>
  );
};

// ---------------------------------------------------------------- the scene
export const Schematic: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / FPS;
  const H = heightAt(t);
  const cam = camAt(t, camKeys(heightAt(9)));
  const pitch = pitchAt(t);
  const bg = ramp(t, T.swap - 0.05, T.swap + 0.5, E.inOut);
  const outline = win(t, T.match, T.swap + 0.25, 0.1, 0.18);
  const carO = ramp(t, T.swap - 0.04, T.swap + 0.08);
  const pre = win(t, T.catch - 0.02, T.swap + 0.1, 0.12, 0.12);
  const cut = ramp(t, T.jets + 0.15, T.jets + 0.75, E.inOut) * (1 - ramp(t, T.fire - 0.3, T.fire + 0.25, E.inOut));
  const shell = ramp(t, T.add, T.add + 0.45, E.out);
  const cage = ramp(t, T.protection - 0.08, T.protection + 0.5, E.inOut);
  const cg = ramp(t, T.balance - 0.05, T.balance + 0.3, E.out) * (1 - ramp(t, T.fire - 0.3, T.fire, E.in));
  const offO = win(t, T.misses - 0.05, PITCH_SEGS[0].t1 + 0.25, 0.22, 0.3);
  // force arrows (hold and tank): weight below the floor, thrust above the roof, both on the centre's line
  const wLen = L0 * (1 + 0.18 * ramp(t, T.add + 0.1, T.weight2 + 0.3, E.inOut));
  const tLen = L0 * (1 + 0.18 * ramp(t, T.add + 0.28, T.weight2 + 0.5, E.inOut));
  const retract = 1 - ramp(t, T.then + 0.1, T.balance - 0.02, E.in);
  const wIn = ramp(t, T.airborne, T.airborne + 0.4, E.out) * retract;
  const tIn = ramp(t, T.thrust, T.thrust + 0.45, E.out) * retract;
  const eq = win(t, T.entire - 0.05, T.weight + 0.55, 0.15, 0.3);
  const ghost = win(t, T.add + 0.1, T.then, 0.15, 0.3);
  const cgW = carPt(t, CG.x, CG.y);
  const roofW = carPt(t, CG.x, ROOF), floorW = carPt(t, CG.x, FLOOR);
  const glow = 1 + 0.25 * eq;
  // labels
  const S = (p: {x: number; y: number}) => toScreen(cam, p.x, p.y);
  const tank = tankAt(t);
  const tankS = S(carPt(t, (tank.x0 + tank.x1) / 2 - 30, tank.y0));
  const valveS = S(carPt(t, -22, -55));
  const nozS = S(carPt(t, NOZ.front.x, NOZ.front.y + 6));
  const tagA = win(t, T.compressed - 0.05, T.every + 0.1, 0.18, 0.25);
  const tagV = win(t, T.compressed + 0.3, T.every + 0.1, 0.18, 0.25);
  const tagN = win(t, T.air - 0.05, T.every + 0.1, 0.18, 0.25);
  const cgS = S(cgW);
  const tagCG = win(t, T.center - 0.05, T.other + 0.2, 0.18, 0.3);
  const thrS = S({x: roofW.x, y: roofW.y - tLen * tIn});
  const wS = S({x: floorW.x, y: floorW.y + wLen * wIn});
  const patchS = S({x: PATCH.x, y: 0});
  const tagLoose = win(t, T.loose - 0.1, WIPE - 0.4, 0.2, 0.3);
  const chip = ramp(t, T.swap + 0.25, T.swap + 0.6) * (1 - ramp(t, WIPE - 0.3, WIPE));
  const k = nozzleAt(t);
  const rearGround = carPt(t, NOZ.rear.x, NOZ.rear.y), frontGround = carPt(t, NOZ.front.x, NOZ.front.y);
  const omega = pitch.w;
  const arcO = Math.min(1, Math.max(0, (Math.abs(omega) - 0.4) / 2.2)) * cg;
  // dust in the foreground at the end, then the wipe
  const fg = ramp(t, T.debris - 0.1, WIPE - 0.02, E.in);
  const world = t < WIPE ? 1 : 0;                  // behind the full dust cloud the drawing is gone; the aerial is underneath
  const thin = 1 - ramp(t, WIPE + 0.02, WIPE + 0.5, E.out);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: world}}>
      <AbsoluteFill style={{opacity: bg}}>
        <PWorld cam={cam}><Sky /><Gravel t={t} /></PWorld>
      </AbsoluteFill>
      <PWorld cam={cam}>
        <Dust t={t} />
        <Splash t={t} x={rearGround.x} k={k.rear} gap={-rearGround.y} />
        <Splash t={t} x={frontGround.x} k={k.front} gap={-frontGround.y} />
        <defs><clipPath id="rkAbove"><rect x={-4000} y={-4000} width={8000} height={4000} /></clipPath></defs>
        <g clipPath="url(#rkAbove)">
        <g opacity={carO} transform={`translate(0 ${-H}) scale(-1 1) rotate(${pitch.th} ${CG.x} ${CG.y})`}>
          <CarRig s={{t, cut, shell, cage, cgMark: cg, offset: {o: offO, d: 48}, pulseArrows: true, plumeLen: 250 + 30 * (1 - H / H_HOVER),
            flowGlow: win(t, T.blast - 0.05, T.compressed + 0.3, 0.1, 0.3), tankGlow: win(t, T.air2 - 0.05, T.too + 0.3, 0.1, 0.25) + 0.6 * win(t, T.bigger, T.time, 0.1, 0.2)}} />
        </g>
        </g>
        {/* on "catch": gas-flow lines on the real jets (the replay is still playing underneath) */}
        {pre > 0.01 && [NOZ.front, NOZ.rear].map((n, i) => {
          const p = carPt(t, n.x, n.y);
          const len = 175, ph = (t * 2.2) % 1;
          return (
            <g key={i} opacity={pre}>
              <path d={`M ${p.x} ${p.y + 12} L ${p.x} ${p.y + 12 + len}`} stroke="#BFD4F6" strokeWidth={16} strokeLinecap="round" opacity={0.45} />
              {[0, 1, 2].map((j) => {
                const y = p.y + 22 + ((ph + j / 3) % 1) * (len - 30);
                return <path key={j} d={`M ${p.x - 9} ${y} L ${p.x} ${y + 10} L ${p.x + 9} ${y}`} stroke={FLOW} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              })}
              <Arrow x1={p.x} y1={p.y + len - 10} x2={p.x} y2={p.y + len + 28} color={FLOW} w={7} head={22} />
            </g>
          );
        })}
        {/* the drawn outline arrives on the real car */}
        {outline > 0 && (
          <g transform={`translate(0 ${-H}) scale(-1 1)`} opacity={outline}>
            <path d={OUTLINE_D} fill="none" stroke={C.saffron} strokeWidth={9 / MATCH.z * 2} strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - ramp(t, T.match, T.match + 0.16, E.out))} />
          </g>
        )}
        {/* forces in the hold: thrust up from the roof, weight down from the floor, equal; the ghost shows the old weight */}
        {ghost > 0 && (
          <g opacity={0.8 * ghost}>
            <line x1={floorW.x + 30} y1={floorW.y + 6} x2={floorW.x + 30} y2={floorW.y + L0} stroke="#FFFFFF" strokeWidth={5} strokeDasharray="9 9" />
            <line x1={floorW.x + 16} y1={floorW.y + L0} x2={floorW.x + 44} y2={floorW.y + L0} stroke="#FFFFFF" strokeWidth={5} />
          </g>
        )}
        {wIn > 0.01 && <Arrow x1={floorW.x} y1={floorW.y} x2={floorW.x} y2={floorW.y + wLen * wIn} color={WEIGHT} w={15 * glow} />}
        {tIn > 0.01 && <Arrow x1={roofW.x} y1={roofW.y} x2={roofW.x} y2={roofW.y - tLen * tIn} color={FORCE} w={15 * glow} />}
        {eq > 0.01 && [-1, 1].map((d) => (
          <g key={d} opacity={eq}>
            <line x1={roofW.x - 26} y1={roofW.y - tLen + 10} x2={roofW.x + 26} y2={roofW.y - tLen + 10} stroke={C.ink} strokeWidth={5} />
            <line x1={floorW.x - 26} y1={floorW.y + wLen - 10} x2={floorW.x + 26} y2={floorW.y + wLen - 10} stroke={C.ink} strokeWidth={5} />
          </g>
        ))}
        {/* the turn: a rotation arrow around the centre of mass while the car is turning */}
        {arcO > 0.01 && (omega > 0
          ? <ArcArrow cx={cgW.x} cy={cgW.y} r={190} a0={-158} a1={-206} color={C.coralDeep} w={11} opacity={arcO} />
          : <ArcArrow cx={cgW.x} cy={cgW.y} r={190} a0={-206} a1={-158} color={C.tealDeep} w={11} opacity={arcO} />)}
      </PWorld>
      </AbsoluteFill>
      {/* foreground dust: rolls toward the camera and covers the frame, then thins as it passes the camera */}
      {fg > 0 && (
        <AbsoluteFill style={{pointerEvents: 'none', opacity: thin}}>
          <svg width={1080} height={1920}>
            <defs>
              <radialGradient id="rkFog"><stop offset="0" stopColor="#E2D7C4" stopOpacity={0.85} /><stop offset="0.6" stopColor="#D3C5AE" stopOpacity={0.6} /><stop offset="1" stopColor="#C9BAA2" stopOpacity={0} /></radialGradient>
            </defs>
            <defs>
              <radialGradient id="rkFog2"><stop offset="0" stopColor="#AE9E85" stopOpacity={0.85} /><stop offset="0.6" stopColor="#B8A88F" stopOpacity={0.5} /><stop offset="1" stopColor="#B8A88F" stopOpacity={0} /></radialGradient>
            </defs>
            {Array.from({length: 22}, (_, i) => {
              const born = T.debris - 0.1 + i * 0.04;
              const a = Math.max(0, t - born);
              const sx = patchS.x + (rnd(i + 40) - 0.5) * 1000 * Math.min(1, a * 1.4) + Math.sin(t * 1.3 + i) * 20;
              const sy = patchS.y - 80 + (rnd(i + 80) - 0.35) * 800 * Math.min(1, a * 1.2) + a * 260;
              const r = 100 + a * 820 * (0.6 + 0.6 * rnd(i + 3));
              return <circle key={i} cx={sx} cy={sy} r={r} fill={i % 3 ? 'url(#rkFog)' : 'url(#rkFog2)'} opacity={Math.min(1, a * 3)} />;
            })}
            <rect width={1080} height={1920} fill="#CFC2AC" opacity={ramp(t, WIPE - 0.12, WIPE - 0.02, E.in) * (1 - ramp(t, WIPE + 0.02, WIPE + 0.22, E.out))} />
          </svg>
        </AbsoluteFill>
      )}
      {world > 0 && <>
      {/* labels */}
      <Tag x={tankS.x - 80} y={tankS.y - 150} to={tankS} text="air tank" o={tagA} />
      <Tag x={valveS.x + 170} y={valveS.y - 120} to={valveS} text="valve" o={tagV} />
      <Tag x={nozS.x - 40} y={nozS.y + 150} to={nozS} text="nozzle" o={tagN} />
      <Tag x={thrS.x + 150} y={thrS.y + 30} text="THRUST" o={tIn * (1 - ramp(t, T.then, T.then + 0.3))} color={C.ink} bg={C.saffronLight} size={36} />
      <Tag x={wS.x + 150} y={wS.y - 30} text="WEIGHT" o={wIn * (1 - ramp(t, T.then, T.then + 0.3))} color={C.cream} bg={WEIGHT} size={36} />
      <Tag x={cgS.x + 40} y={cgS.y + 175} to={cgS} text="center of mass" o={tagCG} size={32} />
      <Tag x={Math.min(780, patchS.x + 170)} y={patchS.y - 215} to={{x: patchS.x + 95, y: patchS.y - 12}} text="loose surface" o={tagLoose} size={34} bg={C.cream} />
      {chip > 0 && (
        <div style={{position: 'absolute', top: 96, width: 1080, textAlign: 'center', opacity: chip}}>
          <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, letterSpacing: 0.5, color: C.ink, background: C.cream, border: `2.5px solid ${C.ink}`, borderRadius: 20, padding: '5px 18px'}}>
            SIMPLIFIED SCHEMATIC · not Tesla's layout
          </span>
        </div>
      )}
      </>}
    </AbsoluteFill>
  );
};
export {H_LOW};
