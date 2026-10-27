// The lab shots: the hook, the radio and its waves through the wall, the reflections and the skeleton, the raised
// hand, the push into the display (scenes hook-D, 0 to LAB_OUT), and the security-camera ending (scene I, END0 to the
// last frame) that runs into frame 0.
import React from 'react';
import {add3, B, basis, Cam, camKeys, mul3, norm3, proj, scaleAt, sub3, v3, V3} from '../world/cam';
import {cardAt, FloorShadow, Person, U} from '../art/person';
import {BUILT, Build, keypoints, KPName, mapKP, Pt, SkeletonDraw} from '../art/skeleton';
import {ANT, antPt, C, Cctv, CCTV, MON, monRect, MonitorStand, PubScreen, pubRect, Radio, Room, Section, WALL, Z_CUT} from './labSet';
import {END0, HERO_G, heroLab} from './labHero';
import {clamp, DUR, f1, hash, lerp, ss, useUid, word} from '../lib';

const W = word;
/** beats (seconds) taken from the measured narration */
export const LB = {
  push0: W('watch').start - 0.1, // the push toward the display
  sci: W('scientists', 0).start,
  open: W('built').start, // the radio's cover opens
  emit: W('shoots').start, // first wave front
  through: W('through').start,
  body: W('bounce').start,
  ai: W('a', 1).start, // "AI creates"
  skel: W('moving').start,
  raise: W('raise').start,
  hand2: W('hand', 1).start,
  but: W('but').start,
  creepy: W('creepy').start,
  out: W('in', 0).start - 0.12, // cut to the cafe
};
export const LAB_OUT = LB.out;

// ------------------------------------------------------------------ cameras
/** C0: the opening (and closing) frame. */
export const C0: Cam = {pos: v3(-0.1, 1.42, -2.95), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 687};
const C1: Cam = {...C0, pos: v3(0.04, 1.42, -2.95)};
/** looking at the display (it fills most of the frame) */
const CMON = (d: number, dy = 0): Cam => ({pos: v3(MON.x, MON.y + dy, MON.z - d), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 960});
/** the radio, close */
const CDEV: Cam = {pos: v3(ANT.x - 0.18, 0.92, ANT.z - 2.05), yaw: 0, pitch: -3, f: 2000, cx: 540, cy: 900};
/** the wall section, close (both faces and the layers) */
const CWALL: Cam = {pos: v3(0.02, 0.98, -1.45), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 960};
/** the hidden man, close */
const CHERO: Cam = {pos: v3(-0.42, 0.78, -1.05), yaw: 0, pitch: -3, f: 2000, cx: 540, cy: 960};
/** the display and the man together (the proof) */
const CSPLIT: Cam = {pos: v3(-0.03, 1.2, -2.55), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 860};
/** scene I: the office corner with the security camera, then back to the opening frame */
const CI1: Cam = {pos: v3(-0.95, 1.45, -2.6), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 690};
const CI2: Cam = {pos: v3(-0.98, 1.5, -2.3), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 720};
const CI3: Cam = {pos: v3(-0.45, 1.5, -3.9), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 690};

export const labCam = (t: number): Cam => {
  if (t > END0) {
    const or = W('or').start;
    return camKeys(t, [
      [END0, CI1],
      [W('camera').start + 0.4, CI2],
      [or - 0.2, CI2],
      [or + 0.4, CI3],
      [DUR - 1.1, CI3],
      [DUR, C0],
    ]);
  }
  return camKeys(t, [
    [0, C0],
    [1.5, C1],
    [LB.push0, C1],
    [LB.sci + 0.25, CMON(1.5)],
    [LB.open - 0.05, CMON(1.5)],
    [LB.open + 0.6, CDEV],
    [LB.emit + 0.3, CDEV],
    [LB.through + 0.1, CWALL, (x) => x * x],
    [LB.body - 0.05, CHERO, (x) => 1 - (1 - x) * (1 - x)],
    [LB.body + 0.55, {...CHERO, pos: add3(CHERO.pos, v3(0.05, 0.02, 0.15))}],
    [LB.ai - 0.05, CDEV],
    [LB.ai + 0.25, CDEV],
    [LB.skel - 0.1, CMON(1.22)],
    [LB.raise - 0.25, CMON(1.16)],
    [LB.raise + 0.2, CSPLIT],
    [LB.but, CSPLIT],
    [LB.creepy + 0.1, CMON(1.0)],
    [LB.out, CMON(0.42)],
  ]);
};

// ------------------------------------------------------------------ the waves
/** wave fronts leave the T array every PERIOD s from LB.emit, at SPEED m/s, toward the man (a fan of arcs in the
 *  vertical plane through the array and him) */
const SPEED = 0.95;
const PERIOD = 0.28;
const target = () => v3(HERO_G.x + 0.12, 0, HERO_G.z);
const fanFrame = () => {
  const o = antPt(0, ANT.y - 0.12, 0.03);
  const tg = target();
  const dir = norm3(v3(tg.x - o.x, 0, tg.z - o.z));
  return {o, dir, dist: Math.hypot(tg.x - o.x, tg.z - o.z)};
};
/** where along the path the wall is (m from the array) */
const wallAt = () => {
  const {o, dir} = fanFrame();
  return (WALL.x1 - o.x) / dir.x;
};
const arcPts = (o: V3, dir: V3, r: number, a0: number, a1: number, n = 18): V3[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return add3(o, add3(mul3(dir, Math.cos(a) * r), v3(0, Math.sin(a) * r, 0)));
  });
const Waves: React.FC<{b: B; t: number}> = ({b, t}) => {
  if (t < LB.emit || t > LB.ai + 1.2) return null;
  const {o, dir, dist} = fanFrame();
  const wa = wallAt();
  const stop = LB.body + 0.2; // the last wave leaves here
  const fronts: React.ReactNode[] = [];
  for (let k = 0; ; k++) {
    const te = LB.emit + k * PERIOD;
    if (te > Math.min(t, stop)) break;
    const r = (t - te) * SPEED;
    if (r < 0.02 || r > dist + 0.5) continue;
    // fade in from the array, dim while crossing the wall, fade beyond the man
    const inWall = r > wa - 0.02 && r < wa + 0.32 ? 0.55 : 1;
    const a = clamp(r / 0.15) * clamp((dist + 0.5 - r) / 0.5) * inWall * (r > wa + 0.3 ? 0.85 : 1);
    const pts = arcPts(o, dir, r, -38, 38);
    const P = pts.map((p) => proj(b, p));
    const d = `M${P.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`;
    const w = Math.max(1.5, scaleAt(b, add3(o, mul3(dir, r))) * 0.006);
    fronts.push(
      <g key={k} opacity={a}>
        <path d={d} fill="none" stroke={C.rf} strokeWidth={w * 4} strokeLinecap="round" opacity={0.18} />
        <path d={d} fill="none" stroke="#C9F6FF" strokeWidth={w} strokeLinecap="round" />
      </g>,
    );
  }
  return <g style={{mixBlendMode: 'screen'}}>{fronts}</g>;
};

/** reflections: from his torso, head, hands and knees, short arcs head back toward the array (faster) */
const REFL: {kp: KPName; d: number}[] = [{kp: 'neck', d: 0}, {kp: 'lhip', d: 0.06}, {kp: 'head', d: 0.12}, {kp: 'lkn', d: 0.18}, {kp: 'lwr', d: 0.24}, {kp: 'rkn', d: 0.3}, {kp: 'lel', d: 0.36}];
const RSPEED = 1.9;
const Reflections: React.FC<{b: B; t: number; kpW: Record<KPName, V3>}> = ({b, t, kpW}) => {
  const t0 = LB.body + 0.12;
  if (t < t0 || t > LB.ai + 1.4) return null;
  const o = antPt(0, ANT.y - 0.12, 0.03);
  const out: React.ReactNode[] = [];
  REFL.forEach(({kp, d}, i) => {
    for (let k = 0; k < 3; k++) {
      const te = t0 + d + k * 0.22;
      if (t < te) continue;
      const src = kpW[kp];
      const back = norm3(sub3(o, src));
      const dist = Math.hypot(o.x - src.x, o.y - src.y, o.z - src.z);
      const r = (t - te) * RSPEED;
      if (r > dist) continue;
      const c = add3(src, mul3(back, r));
      const P = arcPts(c, back, 0.07 + r * 0.05, -55, 55, 10).map((p) => proj(b, p));
      // the arcs bulge toward the array: draw them about the advancing centre
      const dd = `M${P.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`;
      const w = Math.max(1.4, scaleAt(b, c) * 0.005);
      const a = clamp(r / 0.08) * clamp((dist - r) / 0.25);
      out.push(
        <g key={`${i}-${k}`} opacity={a}>
          <path d={dd} fill="none" stroke="#FFD24A" strokeWidth={w * 4} strokeLinecap="round" opacity={0.2} />
          <path d={dd} fill="none" stroke="#FFF1B8" strokeWidth={w} strokeLinecap="round" />
        </g>,
      );
    }
    // a brief glint where the wave meets the body
    const g = clamp(1 - Math.abs(t - (t0 + d)) / 0.18);
    if (g > 0) {
      const p = proj(b, kpW[kp]);
      out.push(<circle key={`gl${i}`} cx={f1(p.x)} cy={f1(p.y)} r={f1(scaleAt(b, kpW[kp]) * 0.05)} fill="#FFF6C8" opacity={0.5 * g} />);
    }
  });
  return <g style={{mixBlendMode: 'screen'}}>{out}</g>;
};

// ------------------------------------------------------------------ the display
type ScreenState = {build: Build; heat: number; dissolve: number; ping: number};
const screenState = (t: number): ScreenState => {
  const s = LB.skel;
  // scene B: raw RF heat first, then keypoints condense limb group by limb group
  if (t > LB.ai - 0.3 && t < LB.raise) {
    return {
      build: {torso: ss(t, s - 0.05, s + 0.25), arms: ss(t, s + 0.2, s + 0.5), legs: ss(t, s + 0.45, s + 0.75), head: ss(t, s + 0.7, s + 0.9)},
      heat: clamp(1 - ss(t, s + 0.6, s + 1.1)) * ss(t, LB.ai - 0.3, LB.ai + 0.2),
      dissolve: 0,
      ping: 0,
    };
  }
  return {build: BUILT, heat: 0, dissolve: t < LAB_OUT + 0.2 ? ss(t, LB.creepy + 0.05, LB.creepy + 0.55) : 0, ping: 0};
};
const Screen: React.FC<{b: B; t: number}> = ({b, t}) => {
  const u = useUid();
  const r = monRect(b);
  const st = screenState(t);
  // world window shown on the display (metres): x from -1.85 to 0.3 (the wall at its right edge), floor at the bottom
  const wide = 1 - ss(t, 0.6, 1.4) * (1 - ss(t, END0 - 0.2, END0));
  const X1 = 0.3, X0 = X1 - (1.85 + 0.35 * wide);
  const s = r.w / (X1 - X0);
  const floorY = r.y + r.h * 0.95;
  const toS = (wx: number, wy: number) => ({x: r.x + (wx - X0) * s, y: floorY - wy * s});
  // the radio's estimate lags the body by about a tenth of a second
  const h = heroLab(t >= 0.1 ? t - 0.1 : t - 0.1 + DUR);
  const kp = mapKP(keypoints(h.p), (p) => toS(HERO_G.x + p.x / U, -p.y / U));
  const wallA = toS(WALL.x0, 0), wallB = toS(WALL.x1, 0);
  const lw = Math.max(1.6, r.w * 0.0135);
  const grid = Array.from({length: 9}, (_, i) => r.x + (i / 8) * r.w);
  // raw RF heat: blobs around the body's reflecting parts, noisy
  const heat = st.heat > 0 ? (
    <g opacity={st.heat}>
      <defs>
        <radialGradient id={`${u}rfheat`}>
          <stop offset="0" stopColor="#FFE38A" stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#FF7A3D" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7A1FA2" stopOpacity={0} />
        </radialGradient>
      </defs>
      {(['neck', 'lhip', 'rhip', 'head', 'lkn', 'rkn', 'lwr', 'rwr', 'lel', 'lan', 'ran'] as KPName[]).map((k, i) => {
        const jit = (q: number) => (hash(Math.floor(t * 12) * 31 + i, q) - 0.5) * r.w * 0.03;
        return <ellipse key={k} cx={f1(kp[k].x + jit(1))} cy={f1(kp[k].y + jit(2))} rx={f1(r.w * (0.07 + 0.02 * hash(i, 3)))} ry={f1(r.w * (0.06 + 0.02 * hash(i, 4)))} fill={`url(#${u}rfheat)`} />;
      })}
    </g>
  ) : null;
  // scene D: the skeleton streams away as signal traces running to the right
  const traces = st.dissolve > 0 ? (
    <g>
      {Array.from({length: 14}, (_, i) => {
        const y = r.y + r.h * (0.12 + (i / 13) * 0.8);
        const ph = t * 5 + i * 0.7;
        const amp = r.h * 0.02 * (0.6 + hash(i, 9));
        const x0 = r.x + r.w * (0.3 + 0.2 * hash(i, 7)) - st.dissolve * r.w * 0.6;
        const pts = Array.from({length: 40}, (_, k) => {
          const x = x0 + (k / 39) * r.w * (0.2 + 1.3 * st.dissolve);
          return `${f1(x)},${f1(y + Math.sin(ph + k * 0.5) * amp * (0.4 + st.dissolve))}`;
        });
        return <path key={i} d={`M${pts.join('L')}`} fill="none" stroke={i % 2 ? '#5CE1FF' : '#FFD24A'} strokeWidth={lw * 0.8} opacity={st.dissolve * 0.9} strokeLinecap="round" />;
      })}
    </g>
  ) : null;
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#081626" />
      {grid.map((x, i) => <line key={i} x1={f1(x)} y1={r.y} x2={f1(x)} y2={r.y + r.h} stroke="#17324A" strokeWidth={Math.max(1, lw * 0.35)} />)}
      {[0.2, 0.4, 0.6, 0.8].map((q) => <line key={q} x1={r.x} y1={f1(r.y + r.h * q)} x2={r.x + r.w} y2={f1(r.y + r.h * q)} stroke="#17324A" strokeWidth={Math.max(1, lw * 0.35)} />)}
      <line x1={r.x} y1={f1(floorY)} x2={r.x + r.w} y2={f1(floorY)} stroke="#2D5674" strokeWidth={lw * 0.6} />
      {/* the wall, as the radio maps it: a hatched band at the display's right edge */}
      <rect x={f1(wallA.x)} y={r.y} width={f1(wallB.x - wallA.x)} height={f1(floorY - r.y)} fill="#2A4258" opacity={0.85} />
      {Array.from({length: 16}, (_, i) => <line key={i} x1={f1(wallA.x)} y1={f1(r.y + i * r.h * 0.065)} x2={f1(wallB.x)} y2={f1(r.y + i * r.h * 0.065 + (wallB.x - wallA.x))} stroke="#3E5E78" strokeWidth={Math.max(1, lw * 0.3)} />)}
      {heat}
      <SkeletonDraw id={`${u}monsk`} kp={kp} w={lw} build={st.build} dissolve={st.dissolve} />
      {traces}
      <circle cx={f1(r.x + r.w * 0.06)} cy={f1(r.y + r.h * 0.065)} r={f1(r.h * 0.017)} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : '#B33'} />
      <text x={f1(r.x + r.w * 0.09)} y={f1(r.y + r.h * 0.08)} fontSize={f1(r.h * 0.045)} fill="#7FA9C9" fontFamily="JetBrains Mono, monospace" letterSpacing={1}>RF · LIVE</text>
    </g>
  );
};

/** the public-view screen: the security camera's picture of the doorway side of the office */
const PubFeed: React.FC<{b: B; t: number; hx: number}> = ({b, t, hx}) => {
  const r = pubRect(b);
  const camera = W('camera').start;
  // the palm arrives over the lens from about camera - 0.12; it leaves as he lets go before the dash
  const cover = ss(t, camera - 0.14, camera + 0.02) * (1 - ss(t, DUR - 1.32, DUR - 1.18));
  const dark = t > END0 ? ss(t, camera + 0.02, camera + 0.12) * (1 - ss(t, DUR - 1.3, DUR - 1.2)) : 0;
  // he is in the picture while he stands under the camera (local hip x left of about -380)
  const inView = clamp((-330 - hx) / 80);
  const fx = r.x + r.w * clamp(0.75 + (hx + 534) / 900, 0, 1.2);
  return (
    <PubScreen b={b}>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#56707E" />
      <rect x={f1(r.x)} y={f1(r.y + r.h * 0.68)} width={r.w} height={f1(r.h * 0.32)} fill="#7B6A57" />
      <rect x={f1(r.x + r.w * 0.12)} y={f1(r.y + r.h * 0.1)} width={f1(r.w * 0.24)} height={f1(r.h * 0.6)} fill="#8A6A4E" stroke="#2C3A42" strokeWidth={1} />
      {inView > 0 && (
        <g opacity={inView}>
          <ellipse cx={f1(fx)} cy={f1(r.y + r.h * 0.3)} rx={f1(r.w * 0.05)} ry={f1(r.h * 0.11)} fill="#E7B898" />
          <path d={`M${f1(fx - r.w * 0.05)},${f1(r.y + r.h * 0.22)} l${f1(r.w * 0.02)},${f1(-r.h * 0.12)} l${f1(r.w * 0.025)},${f1(r.h * 0.07)} l${f1(r.w * 0.02)},${f1(-r.h * 0.1)} l${f1(r.w * 0.02)},${f1(r.h * 0.13)} Z`} fill="#C0392B" />
          <rect x={f1(fx - r.w * 0.07)} y={f1(r.y + r.h * 0.42)} width={f1(r.w * 0.14)} height={f1(r.h * 0.34)} rx={f1(r.w * 0.03)} fill="#F2F2EC" />
          {[0, 1, 2].map((i) => <rect key={i} x={f1(fx - r.w * 0.07)} y={f1(r.y + r.h * (0.47 + i * 0.1))} width={f1(r.w * 0.14)} height={f1(r.h * 0.04)} fill="#E8B43A" />)}
          <rect x={f1(fx - r.w * 0.06)} y={f1(r.y + r.h * 0.76)} width={f1(r.w * 0.12)} height={f1(r.h * 0.22)} fill="#2E3F5C" />
        </g>
      )}
      {/* the palm approaching the lens: a big soft skin-coloured shape filling the picture */}
      {cover > 0 && <ellipse cx={f1(r.x + r.w * 0.55)} cy={f1(r.y + r.h * 0.5)} rx={f1(r.w * 0.9 * cover)} ry={f1(r.h * 1.1 * cover)} fill="#C98B6A" opacity={clamp(cover * 1.2)} />}
      {dark > 0 && <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#05080B" opacity={dark} />}
      {dark > 0.6 && <text x={f1(r.x + r.w / 2)} y={f1(r.y + r.h * 0.56)} textAnchor="middle" fontSize={f1(r.h * 0.13)} fill="#9AA9B3" fontFamily="JetBrains Mono, monospace" opacity={(dark - 0.6) / 0.4}>NO SIGNAL</text>}
      <circle cx={f1(r.x + r.w * 0.08)} cy={f1(r.y + r.h * 0.1)} r={f1(r.h * 0.035)} fill={dark > 0.5 ? '#552' : '#FF3B3B'} />
      <text x={f1(r.x + r.w * 0.13)} y={f1(r.y + r.h * 0.13)} fontSize={f1(r.h * 0.09)} fill="#E6EEF2" fontFamily="JetBrains Mono, monospace">CAM 1</text>
    </PubScreen>
  );
};

/** wall layers part while the waves cross */
const wallSep = (t: number) => 0.045 * ss(t, LB.through - 0.55, LB.through - 0.1) * (1 - ss(t, LB.through + 0.5, LB.body - 0.1));

export const LabScene: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const cam = labCam(t);
  const b = basis(cam);
  const h = heroLab(t);
  const cd = cardAt(b, HERO_G);
  const pulse = t > LB.emit && t < LB.body + 0.3 ? 0.5 + 0.5 * Math.sin((t - LB.emit) * (2 * Math.PI) / PERIOD) : t > LB.ai + 0.1 && t < LB.ai + 0.7 ? 1 - ss(t, LB.ai + 0.3, LB.ai + 0.7) : 0.15;
  const sep = wallSep(t);
  const open = ss(t, LB.open, LB.open + 0.45) * (1 - ss(t, LB.raise, LB.raise + 0.4));
  // keypoints in the world (for the reflections)
  const kpL = keypoints(h.p);
  const kpW = Object.fromEntries(Object.entries(kpL).map(([k, p]) => [k, v3(HERO_G.x + p.x / U, -p.y / U, HERO_G.z - 0.05)])) as Record<KPName, V3>;
  // the waves light his near side as they arrive
  const lit = t > LB.through + 0.3 && t < LB.ai + 0.4 ? ss(t, LB.through + 0.3, LB.body) * (1 - ss(t, LB.body + 0.6, LB.ai + 0.4)) : 0;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={C.out} />
      <Room b={b} sep={sep} />
      <PubFeed b={b} t={t} hx={h.p.x} />
      <Radio b={b} pulse={pulse} open={open} />
      <MonitorStand b={b}>
        <Screen b={b} t={t} />
      </MonitorStand>
      <FloorShadow cd={cd} x={h.p.x - 20} w={230} />
      <Cctv b={b} live={!(t > W('camera').start && t < DUR - 1.2)} />
      <Person id={`${u}hero`} cd={cd} p={h.p} look={{expr: h.x, lHand: h.lh, rHand: h.rh}} />
      {lit > 0 && <ellipse cx={f1(cd.x + cd.k * (h.p.x - 40))} cy={f1(cd.y - cd.k * 420)} rx={f1(cd.k * 260)} ry={f1(cd.k * 480)} fill={C.rf} opacity={0.1 * lit} style={{mixBlendMode: 'screen'}} />}
      <Reflections b={b} t={t} kpW={kpW} />
      <Section b={b} sep={sep} glow={lit} />
      <Waves b={b} t={t} />
    </svg>
  );
};
export {CCTV, lerp, Z_CUT};
