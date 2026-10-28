// V5 lab shots. Opening (0-3.6): the cross-section, him crouched on one side of the concrete wall, the screen's skeleton
// on the other; his arm snaps up and the skeleton's follows; the camera moves toward the wall as he tucks in (the screen
// still tracking); close on his face and his hand at his chin; along the echoes' path through the concrete to the
// screen (his pose, hand at chin, on it); up the mast to the radio. Mechanism (3.6-10.7), one connected path: the
// transmitter, the packets leaving the array, the whole path seen wide, the wall crossing (slower, weaker inside the
// concrete), his body (soft glints where packets meet him, echoes shaped by how he moves), the echoes back to the
// receiver and its screen, where raw traces become the pose. Demo (10.7-14.9): his right hand (his action), the screen
// (its reconstruction), both side by side for the turn and the step, the push into the screen. The ending (loop time
// < 0): out of the screen (the café laptop's screen dissolves into it), pulling back to the section and frame 0.
import React from 'react';
import {add3, B, basis, Cam, camPath, depth, lookAt, norm3, proj, scaleAt, sub3, v3, V3} from '../world/cam';
import {cardAt, FloorShadow, Person, U} from '../art/person';
import {manJoints} from '../dc/Man';
import {keypoints, KPName, LIMBS, COL} from '../art/skeleton';
import {ANT, antPt, BOX, C, DevRoom, DISP, Display, lcdQuad, Office, Radio, ROOM_H, screenRect, Section, Storeys, WALL, WallFaces, WallInterior, Z_CUT} from './labSet5';
import {HERO_G, heroCard, heroLab, LAB_IN, RF_LAG, tau} from './hero5';
import {clamp, DUR, f1, hash, ss, useUid, word} from '../lib';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
export const LB = {
  sci: T_('scientists', 0), built: T_('built'), shoots: T_('shoots'), radio: T_('radio'), through: T_('through'), and: T_('and', 0),
  bounce: T_('bounce'), body: T_('body'), ai: T_('a', 1), moving: T_('moving'), skel: T_('skeleton'), of: T_('of'), raise: T_('raise'), hand: T_('hand', 0),
  it: T_('it', 0), its: T_('its'), but: T_('but'), where: T_('where'), creepy: T_('creepy'), or: T_('or'),
};
/** the lab hands over to the café during the push into the display (Film.tsx) */
export const LAB_OUT = LB.creepy + 0.62;
const LAB_IN_T = LAB_IN - DUR;

// ------------------------------------------------------------------ cameras
const cam = (x: number, y: number, z: number, f = 1000, yaw = 0, cy = 960, pitch = 0): Cam => ({pos: v3(x, y, z), yaw, pitch, f, cx: 540, cy});
/** frame 0: the whole section, him | the wall | the display */
export const CW0 = cam(0.1, 1.22, -1.05, 880, 0, 860);
const CDISP = (d = 1.15, dx = 0) => cam(DISP.x + dx, DISP.y + 0.05, DISP.z - d, 1000, 0, 940);
const CRADIO = cam(0.85, 2.05, 0.75, 1150, 6, 980);
const CARRAY = cam(0.7, 1.9, 0.82, 1150, 2, 960);
const CHIM = cam(-0.5, 1.3, -0.25, 980, 0, 980);
const CWIDE = cam(0.02, 1.3, -1.32, 900, 0, 900);

export const labCam = (t: number): Cam => {
  const T = tau(t);
  if (T < 0) {
    // the ending: out of the screen (the café laptop's screen dissolves into this one), pulling back to the section:
    // his skeleton, the wall, then him hiding behind it, into frame 0
    return camPath(T, [
      [LAB_IN_T, CDISP(0.85)],
      [LAB_IN_T + 0.55, CDISP(1.12, -0.06)],
      // arriving at rest, as the opening starts from rest: the loop seam has no jolt
      [0, CW0, true],
      [0.35, {...CW0, pos: add3(CW0.pos, v3(0, 0, 0.06))}],
    ]);
  }
  if (t < LB.sci - 0.05) {
    return camPath(t, [
      [0, CW0],
      // the arm move is seen whole: him, the wall, the screen
      [0.4, {...CW0, pos: add3(CW0.pos, v3(0, 0, 0.05))}],
      [0.9, {...CW0, pos: add3(CW0.pos, v3(-0.08, -0.03, 0.2)), f: 900}],
      // toward the wall as he tucks in behind it; the screen keeps tracking at the right
      [1.45, cam(-0.16, 1.02, -0.32, 960, 2, 930)],
      // close: his face and hand
      [1.85, cam(-0.55, 1.0, 0.42, 1000, 2, 950)],
      [2.22, cam(-0.53, 1.01, 0.47, 1000, 4, 950)],
      // along the echoes' path: to the wall's cut face beside him, through the concrete, back out at the screen
      [2.5, cam(-0.12, 1.05, 0.28, 950, 8, 960)],
      [2.7, cam(0.0, 1.08, 0.8, 950, 4, 960)],
      [2.95, cam(0.42, 1.02, 0.22, 980, 0, 950)],
      [3.2, cam(0.74, 0.95, 0.02, 1000, 0, 945)],
      // up the mast to the radio (the equipment)
      [LB.sci - 0.05, CRADIO],
    ]);
  }
  if (t < LB.of) {
    // the mechanism, one connected path: the transmitter (the box opens on its board), the packets leaving the
    // array, the whole path seen wide (array -> room -> wall -> him), the wall crossing, his body (hits and echoes),
    // the echoes back to the receive bar, down to the screen where the traces become a pose
    return camPath(t, [
      [LB.sci - 0.05, CRADIO],
      [LB.built + 0.1, cam(0.93, 2.07, 0.9, 1180, 5, 980)],
      [LB.shoots - 0.1, cam(0.82, 1.98, 1.0, 1260, 2, 960)],
      [LB.shoots + 0.45, cam(0.66, 2.02, 0.62, 1080, -6, 930)],
      [LB.radio + 0.1, cam(0.28, 2.18, -0.85, 860, -3, 800)],
      [LB.through, cam(0.18, 2.1, -1.05, 860, -3, 820)],
      [LB.through + 0.55, cam(0.02, 1.55, -0.2, 1000, 0, 930)],
      [LB.and + 0.05, cam(-0.08, 1.4, -0.15, 1000, 0, 950)],
      [LB.bounce + 0.2, cam(-0.46, 1.2, -0.42, 960, 0, 960)],
      [LB.body, cam(-0.42, 1.22, -0.36, 960, 0, 960)],
      // the echoes go back over the wall and up to the receive bar
      [LB.body + 0.4, cam(0.42, 1.66, 0.0, 1050, 4, 950)],
      // the receiver and its screen together, then into the screen
      [LB.ai + 0.25, cam(0.86, 1.46, -0.55, 1000, 3, 850)],
      [LB.moving + 0.05, CDISP(1.2)],
      [LB.of, CDISP(1.05)],
    ]);
  }
  // the demo: his action (the right hand), its electronic reconstruction (the screen), then both side by side for the
  // turn and the step, then the push into the screen
  return camPath(t, [
    [LB.of, CDISP(1.05)],
    [LB.raise - 0.05, CHIM],
    [LB.hand + 0.15, {...CHIM, pos: v3(-0.44, 1.32, -0.15)}],
    [LB.it + 0.06, CDISP(1.12, -0.04)],
    [LB.its + 0.3, CDISP(1.02, -0.02)],
    [LB.but - 0.02, CWIDE],
    [LB.where, {...CWIDE, pos: v3(0.06, 1.28, -1.2)}],
    [LB.creepy + 0.05, CDISP(1.04)],
    [LAB_OUT, CDISP(0.92, 0.04)],
  ]);
};

// ------------------------------------------------------------------ the display's picture
/** display-local mapping: his skeleton at life size while crouched, scaled to fit when he stands, his hips a little
 *  right of centre; the wall where the radio maps it */
/** the skeleton's figure as a card in the display's screen rect (for the silhouette that leaves the screen) */
/** the radio's estimate of him: his pose RF_LAG earlier, in loop time (so it is right across the loop seam and the
 *  ending's start: just after LAB_IN it is the ending's pose a moment earlier, not the demo's) */
const lagged = (t: number) => tau(t) - RF_LAG;
/** the display's scale: life size while he is low, scaled so his highest point (head or a raised hand, looked for a
 *  little before and after, so the scale changes smoothly) stays on the screen */
const dispScale = (t: number) => {
  let top = 0;
  for (let k = -4; k <= 4; k++) {
    const j = manJoints(heroLab(lagged(t) + k * 0.1).p);
    top = Math.max(top, -j.head.y / U + 0.12, -j.L.W.y / U + 0.16, -j.R.W.y / U + 0.16);
  }
  return Math.min(1, 1.22 / top);
};
export const labSil = (t: number) => {
  const b = basis(labCam(t));
  const r = screenRect(b, DISP);
  const h = heroLab(lagged(t)).p;
  const kp = keypoints(h);
  const s = dispScale(t);
  const hipW = HERO_G.x + h.x / U;
  const hc = heroCard(h);
  return {cd: {x: r.x + r.w * (0.5 + ((hc.at.x - hipW) * s + 0.08) / DISP.w), y: r.y + r.h * (1 - 0.07 / DISP.h), k: (s * r.w) / (U * DISP.w), depth: 1}, p: hc.p, kp};
};
export const dispMap = (t: number) => {
  const h = heroLab(lagged(t)).p;
  const s = dispScale(t);
  const hipW = HERO_G.x + h.x / U;
  return (wx: number, wy: number) => ({u: (wx - hipW) * s + 0.08, v: wy * s + 0.07});
};
type P2 = {x: number; y: number};
const toScreen = (r: {x: number; y: number; w: number; h: number}, q: {u: number; v: number}): P2 => ({x: r.x + (0.5 + q.u / DISP.w) * r.w, y: r.y + r.h - (q.v / DISP.h) * r.h});
/** the display's state: 'live' (the skeleton), the raw echo traces, then the traces becoming the skeleton */
const dispPhase = (t: number) => {
  const T = tau(t);
  if (T < 0 || t < LB.shoots) return {raw: 0, form: 1};
  if (t < LB.of + 0.2) {
    const off = 1 - ss(t, LB.shoots, LB.shoots + 0.3);
    return {raw: ss(t, LB.shoots + 0.1, LB.shoots + 0.5) * (1 - ss(t, LB.skel - 0.1, LB.skel + 0.4)), form: t < LB.shoots + 0.3 ? off : ss(t, LB.moving - 0.25, LB.skel + 0.35)};
  }
  return {raw: 0, form: 1};
};
const KP_ORDER: KPName[] = ['head', 'neck', 'lsh', 'rsh', 'lel', 'rel', 'lwr', 'rwr', 'lhip', 'rhip', 'lkn', 'rkn', 'lan', 'ran'];
export const DispPicture: React.FC<{r: {x: number; y: number; w: number; h: number}; t: number; contrast?: number}> = ({r, t, contrast = 1}) => {
  const u = useUid();
  const map = dispMap(t);
  const est = (tt: number) => {
    const kp = keypoints(heroLab(lagged(tt)).p);
    return Object.fromEntries(Object.entries(kp).map(([k, p], i) => {
      const q = Math.floor(tt * 15);
      const n = 0.006;
      return [k, toScreen(r, map(HERO_G.x + p.x / U + (hash(q * 31 + i, 1) - 0.5) * n, -p.y / U + (hash(q * 31 + i, 2) - 0.5) * n))];
    })) as Record<KPName, P2>;
  };
  const kp = est(t);
  const {raw, form} = dispPhase(t);
  const lw = Math.max(2, r.w * 0.013);
  const floor = toScreen(r, map(0, 0)).y;
  // raw echo traces: one row per receive channel; the peaks sit where his parts are (range), wobble as he moves
  const rows = 7;
  const traceY = (i: number) => r.y + r.h * (0.14 + (i / (rows - 1)) * 0.72);
  const traces = raw > 0.01 || form < 0.99 ? (
    <g opacity={Math.max(raw, 1 - form) * 0.95}>
      {Array.from({length: rows}, (_, i) => {
        const pts: string[] = [];
        for (let k = 0; k <= 60; k++) {
          const x = r.x + r.w * (0.04 + 0.92 * (k / 60));
          // two or three of his keypoints project onto this row's position as bumps
          let y = 0;
          KP_ORDER.forEach((name, j) => {
            if (j % rows !== i && (j + 3) % rows !== i) return;
            y += Math.exp(-(((x - kp[name].x) / (r.w * 0.035)) ** 2)) * (0.6 + 0.4 * Math.sin(t * 9 + j));
          });
          y += 0.08 * Math.sin(k * 0.9 + t * 14 + i) * (0.5 + hash(k + i * 61 + Math.floor(t * 12) * 7, 3));
          pts.push(`${f1(x)},${f1(traceY(i) - y * r.h * 0.06)}`);
        }
        return <polyline key={i} points={pts.join(' ')} fill="none" stroke={i % 2 ? '#5CE1FF' : '#FFD24A'} strokeWidth={f1(lw * 0.45)} strokeLinejoin="round" opacity={0.85} />;
      })}
    </g>
  ) : null;
  // the keypoints condense out of the traces: each starts at its bump on its row and flies to its joint
  const kpShown = KP_ORDER.map((name, j) => {
    const start = {x: kp[name].x, y: traceY(j % rows)};
    const a = clamp((form - j * 0.025) / 0.5);
    const e = a * a * (3 - 2 * a);
    return {name, p: {x: start.x + (kp[name].x - start.x) * e, y: start.y + (kp[name].y - start.y) * e}, a: form < 0.99 ? clamp(form * 3) : 1};
  });
  const P = Object.fromEntries(kpShown.map((q) => [q.name, q.p])) as Record<KPName, P2>;
  const limbA = clamp((form - 0.5) / 0.4);
  // on CREEPY the skeleton is handed to the silhouette that fills it (Film.tsx) and leaves the screen with it
  const handOver = t > LB.creepy && t < LB.creepy + 1.5 ? 1 - ss(t, LB.creepy + 0.25, LB.creepy + 0.4) : 1;
  const trail: Record<KPName, P2>[] = [];
  const limb = (k: Record<KPName, P2>, a: number, w: number, key: string, glow = false) => LIMBS.map((L, i) => (
    <line key={`${key}${i}`} x1={f1(k[L.a].x)} y1={f1(k[L.a].y)} x2={f1(k[L.b].x)} y2={f1(k[L.b].y)} stroke={COL[L.side]} strokeWidth={f1(w)} strokeLinecap="round" opacity={a} style={glow ? {mixBlendMode: 'screen'} : undefined} />
  ));
  const grid: React.ReactNode[] = [];
  for (let i = 1; i < 10; i++) grid.push(<line key={`gx${i}`} x1={f1(r.x + (i / 10) * r.w)} y1={r.y} x2={f1(r.x + (i / 10) * r.w)} y2={r.y + r.h} stroke="#10263A" strokeWidth={Math.max(1, lw * 0.25)} />);
  for (let i = 1; i < 12; i++) grid.push(<line key={`gy${i}`} x1={r.x} y1={f1(r.y + (i / 12) * r.h)} x2={r.x + r.w} y2={f1(r.y + (i / 12) * r.h)} stroke="#10263A" strokeWidth={Math.max(1, lw * 0.25)} />);
  return (
    <g>
      <defs>
        <radialGradient id={`${u}vig`} cx="0.5" cy="0.55" r="0.75">
          <stop offset="0" stopColor="#0A1C2C" />
          <stop offset="1" stopColor="#02070D" />
        </radialGradient>
      </defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${u}vig)`} />
      {grid}
      <line x1={r.x} y1={f1(floor)} x2={r.x + r.w} y2={f1(floor)} stroke="#2D5674" strokeWidth={lw * 0.5} />
      {traces}
      {trail.map((k, i) => <g key={`tr${i}`}>{limb(k, 0.14 + 0.08 * i, lw * 0.8, `t${i}`)}</g>)}
      <g opacity={handOver}>
      {limbA > 0 && limb(P, 0.3 * limbA * contrast, lw * 3.2, 'g', true)}
      {limbA > 0 && limb(P, limbA, lw, 'l')}
      {kpShown.map((q) => (
        <g key={q.name} opacity={q.a}>
          <circle cx={f1(q.p.x)} cy={f1(q.p.y)} r={f1(lw * (q.name === 'head' ? 2.6 : 1.5) * 2.2)} fill="#FFFFFF" opacity={0.12 * contrast} />
          <circle cx={f1(q.p.x)} cy={f1(q.p.y)} r={f1(lw * (q.name === 'head' ? 1.9 : 1.05))} fill="#FFFFFF" />
        </g>
      ))}
      </g>
      <circle cx={f1(r.x + r.w * 0.06)} cy={f1(r.y + r.h * 0.045)} r={f1(r.h * 0.012)} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : '#B33'} />
    </g>
  );
};

// ------------------------------------------------------------------ the radio waves (packets)
/** a wave packet is a short train of oscillation travelling along a ray (not a beam, not a ring): it moves at SPEED in
 *  the air and at SLOW of that inside the concrete, and leaves the wall weaker. Echoes travel back from the part of his
 *  body each packet reached; their oscillation is shaped by how fast that part is moving (the change the receiver
 *  measures). */
const SPEED = 1.15, SLOW = 0.42, PERIOD = 0.34, ESPEED = 1.9;
const TX = () => antPt(0, ANT.y, 0.04);
const RX = () => antPt(0, ANT.y - 0.3, 0.04);
const TARGETS: KPName[] = ['head', 'lhip', 'lkn'];
/** the world position of keypoint k at time t (slightly in front of his card plane) */
const kpWorld = (t: number, k: KPName): V3 => {
  const p = keypoints(heroLab(t).p)[k];
  return v3(HERO_G.x + p.x / U, -p.y / U, HERO_G.z - 0.04);
};
/** distance travelled along a straight segment A->Bp after `r` of air-equivalent travel, accounting for the wall */
const travel = (A: V3, Bp: V3, r: number) => {
  const L = Math.hypot(Bp.x - A.x, Bp.y - A.y, Bp.z - A.z);
  const dx = Bp.x - A.x;
  let dIn = 1e9, dOut = 1e9;
  if (Math.abs(dx) > 1e-6) {
    const a = (WALL.x1 - A.x) / dx, c = (WALL.x0 - A.x) / dx;
    const s0 = Math.min(a, c), s1 = Math.max(a, c);
    if (s1 > 0 && s0 < 1) { dIn = Math.max(0, s0) * L; dOut = Math.min(1, s1) * L; }
  }
  let d: number, zone: 0 | 1 | 2;
  if (r < dIn) { d = r; zone = 0; }
  else if (r < dIn + (dOut - dIn) / SLOW) { d = dIn + (r - dIn) * SLOW; zone = 1; }
  else { d = dOut + (r - dIn - (dOut - dIn) / SLOW); zone = dOut < 1e8 ? 2 : 0; }
  const total = dIn < 1e8 ? L + (dOut - dIn) * (1 / SLOW - 1) : L;
  const u = Math.min(1, d / L);
  return {p: v3(A.x + (Bp.x - A.x) * u, A.y + (Bp.y - A.y) * u, A.z + (Bp.z - A.z) * u), zone, done: r >= total, total, dir: norm3(sub3(Bp, A))};
};
/** strength of the visible signal (it is always there; it is shown more when the story is about it) */
const waveShow = (t: number) => {
  const T = tau(t);
  if (T < 0) return 0.3;
  if (t < 1.45) return 0.3;
  if (t < 3.0) return 0.85;
  if (t < LB.shoots - 0.05) return 0.3;
  if (t < LB.ai + 0.3) return 1;
  if (t > LB.raise && t < LB.its + 0.4) return 0.55;
  return 0.28;
};
type Pk = {c: V3; dir: V3; zone: number; amp: number; freq: number; col: string; a: number};
const packets = (t: number): {list: Pk[]; arrivals: number[]; glints: {c: V3; a: number}[]} => {
  const list: Pk[] = [];
  const arrivals: number[] = [];
  const glints: {c: V3; a: number}[] = [];
  const o = TX(), rx = RX();
  const n0 = Math.floor((t - 2.6) / PERIOD), n1 = Math.floor(t / PERIOD);
  for (let n = n0; n <= n1; n++) {
    const te = n * PERIOD;
    TARGETS.forEach((k, i) => {
      // aim at where that part of him is when the packet gets there (close enough: where it is at emission + 0.9 s)
      const tgt = kpWorld(te + 0.9, k);
      const out = travel(o, tgt, (t - te) * SPEED);
      if (!out.done) {
        const amp = out.zone === 0 ? 1 : out.zone === 1 ? 0.65 : 0.45;
        list.push({c: out.p, dir: out.dir, zone: out.zone, amp: 0.026 * amp, freq: 40, col: '#BFF4FF', a: (out.zone === 2 ? 0.7 : 1) * clamp((t - te) * 6)});
        return;
      }
      // the echo: leaves the body part at the moment of arrival, shaped by its speed
      const th = te + out.total / SPEED;
      const p0 = kpWorld(th, k), p1 = kpWorld(th - 0.12, k);
      if (t - th < 0.2) glints.push({c: kpWorld(t, k), a: 1 - (t - th) / 0.2});
      const spd = Math.min(1.5, Math.hypot(p0.x - p1.x, p0.y - p1.y) / 0.12);
      const back = travel(p0, rx, (t - th) * ESPEED);
      if (i === 0 || i === 1) arrivals.push(th + back.total / ESPEED);
      if (back.done) return;
      const amp = (0.012 + 0.03 * spd) * (back.zone === 0 ? 1 : back.zone === 1 ? 0.65 : 0.5);
      list.push({c: back.p, dir: back.dir, zone: back.zone, amp, freq: 24 + 24 * spd, col: '#FFE27A', a: 0.9 * clamp((t - th) * 8)});
    });
    // multipath: a few rays carry on past him and bounce off the office's floor and far wall
    [v3(-1.5, 0.0, 1.9), v3(-2.2, 1.2, 3.5)].forEach((bp, j) => {
      const out = travel(o, bp, (t - te) * SPEED);
      if (!out.done) list.push({c: out.p, dir: out.dir, zone: out.zone, amp: 0.018 * (out.zone ? 0.5 : 1), freq: 40, col: '#BFF4FF', a: 0.45});
      else {
        const th = te + out.total / SPEED;
        const ref = j === 0 ? v3(-0.9, 1.6, 1.4) : v3(-1.2, 0.4, 1.6);
        const b2 = travel(bp, ref, (t - th) * SPEED);
        if (!b2.done) list.push({c: b2.p, dir: b2.dir, zone: 0, amp: 0.014, freq: 40, col: '#BFF4FF', a: 0.3 * clamp(1 - (t - th) / 1.2)});
      }
    });
  }
  return {list, arrivals, glints};
};
/** echo arrivals at the receiver (for the receive patches, the readout and the sound) */
export const echoArrivals = (t0: number, t1: number) => {
  const s = new Set<number>();
  for (let t = t0; t < t1; t += 0.05) packets(t).arrivals.forEach((a) => s.add(Math.round(a * 1000) / 1000));
  return [...s].filter((a) => a >= t0 && a < t1).sort((a, b) => a - b);
};
const Waves: React.FC<{b: B; t: number; back?: boolean}> = ({b, t, back = false}) => {
  const show = waveShow(t);
  // packets behind the display's plane on the lab side are drawn under it
  const pk = packets(t);
  const list = pk.list.filter((q) => (q.c.x > WALL.x1 && q.c.z > DISP.z - 0.02) === back);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {/* where a packet meets his body: a small soft glint (the scattering), not a ring */}
      {!back && pk.glints.map((g, i) => {
        if (depth(b, g.c) < 0.1) return null;
        const P = proj(b, g.c), k = scaleAt(b, g.c);
        return <circle key={`gl${i}`} cx={f1(P.x)} cy={f1(P.y)} r={f1(k * 0.035)} fill="#EFFCFF" opacity={0.5 * g.a * show} style={{filter: `blur(${f1(k * 0.012)}px)`}} />;
      })}
      {list.map((q, i) => {
        if (depth(b, q.c) < 0.1) return null;
        const L = 0.15;
        const A = proj(b, add3(q.c, v3(-q.dir.x * L, -q.dir.y * L, -q.dir.z * L))), Bp = proj(b, q.c);
        const dx = Bp.x - A.x, dy = Bp.y - A.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const k = scaleAt(b, q.c);
        const pts: string[] = [];
        const N = 30;
        for (let j = 0; j <= N; j++) {
          const s = j / N;
          const env = Math.sin(Math.PI * s);
          const o = Math.sin(s * (q.freq / 16) * Math.PI * 2 - t * 20) * q.amp * k * env;
          pts.push(`${f1(A.x + dx * s + nx * o)},${f1(A.y + dy * s + ny * o)}`);
        }
        const w = Math.max(1.3, k * 0.0045);
        return (
          <g key={i} opacity={q.a * show}>
            <polyline points={pts.join(' ')} fill="none" stroke={q.col} strokeWidth={f1(w * 4)} opacity={0.18} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts.join(' ')} fill="none" stroke={q.col} strokeWidth={f1(w)} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the radio's range readout
const RangeLcd: React.FC<{b: B; t: number; level: number}> = ({b, t, level}) => {
  if (depth(b, antPt(0, 0.4, 0)) < 0.2) return null;
  const q = lcdQuad().map((p) => proj(b, p));
  const at = (uu: number, vv: number) => {
    const a = {x: q[0].x + (q[1].x - q[0].x) * uu, y: q[0].y + (q[1].y - q[0].y) * uu};
    const c = {x: q[3].x + (q[2].x - q[3].x) * uu, y: q[3].y + (q[2].y - q[3].y) * uu};
    return {x: a.x + (c.x - a.x) * vv, y: a.y + (c.y - a.y) * vv};
  };
  const pts: P2[] = [];
  for (let i = 0; i <= 48; i++) {
    const x = i / 48;
    const n = 0.05 * hash(i + Math.floor(t * 10) * 50, 5);
    const y = 0.08 + n + 0.5 * Math.exp(-(((x - 0.3) / 0.03) ** 2)) + level * (0.7 + 0.08 * Math.sin(t * 6)) * Math.exp(-(((x - 0.62 - 0.015 * Math.sin(t * 2.6)) / 0.035) ** 2));
    pts.push(at(0.04 + x * 0.92, 0.08 + Math.min(0.86, y)));
  }
  const k = scaleAt(b, antPt(0, 0.4, 0));
  return (
    <g>
      <path d={`M${q.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`} fill="#071711" stroke={C.darker} strokeWidth={Math.max(1, k * 0.004)} />
      <path d={`M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`} fill="none" stroke="#7CFFB2" strokeWidth={Math.max(1, k * 0.0035)} strokeLinejoin="round" />
    </g>
  );
};

// ------------------------------------------------------------------ light
/** warm lamp light in his room, the display's cool glow on the lab side (screen-space soft gradients) */
const Light: React.FC<{b: B}> = ({b}) => {
  const u = useUid();
  const lamp = proj(b, v3(-1.4, ROOM_H - 0.1, 2.0)), disp = proj(b, v3(DISP.x, DISP.y, DISP.z + 0.05));
  const k1 = scaleAt(b, v3(-1.4, 1.5, 2.0)), k2 = scaleAt(b, v3(DISP.x, DISP.y, DISP.z));
  return (
    <g style={{mixBlendMode: 'soft-light'}}>
      <defs>
        <radialGradient id={`${u}lw`}><stop offset="0" stopColor="#FFE2A8" stopOpacity={0.7} /><stop offset="1" stopColor="#FFE2A8" stopOpacity={0} /></radialGradient>
        <radialGradient id={`${u}lc`}><stop offset="0" stopColor="#7FE8FF" stopOpacity={0.75} /><stop offset="1" stopColor="#7FE8FF" stopOpacity={0} /></radialGradient>
      </defs>
      <ellipse cx={f1(lamp.x)} cy={f1(lamp.y + k1 * 1.2)} rx={f1(k1 * 2.2)} ry={f1(k1 * 2.0)} fill={`url(#${u}lw)`} />
      <ellipse cx={f1(disp.x)} cy={f1(disp.y)} rx={f1(k2 * 1.6)} ry={f1(k2 * 1.6)} fill={`url(#${u}lc)`} />
    </g>
  );
};

// ------------------------------------------------------------------ the scene
export const LabScene: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const c = labCam(t);
  const b = basis(c);
  const h = heroLab(t);
  const hc = heroCard(h.p);
  const cd = cardAt(b, hc.at);
  const {arrivals} = packets(t);
  const tx = t > LB.shoots - 0.1 && t < LB.ai ? Math.max(0, 1 - (t % PERIOD) / 0.1) : 0.25 * Math.max(0, 1 - (t % PERIOD) / 0.1);
  const recent = arrivals.reduce((a, ta) => a + (t > ta ? Math.exp(-(t - ta) / 0.12) : 0), 0);
  const rxl = [0, 1, 2, 3].map((i) => clamp(recent * (0.6 + 0.15 * i)));
  const open = ss(t, LB.built, LB.built + 0.45) * (1 - ss(t, LB.shoots + 0.2, LB.shoots + 0.6));
  const T = tau(t);
  const contrast = T < 0 ? 1 : t < 0.35 ? 0.75 : 0.75 + 0.25 * ss(t, 0.35, 0.85);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill="#2A3740" />
      <Storeys b={b} />
      <Office b={b} />
      <DevRoom b={b} />
      <WallFaces b={b} />
      <Radio b={b} open={open} tx={tx} rx={rxl} lcd={open < 0.05 ? <RangeLcd b={b} t={t} level={clamp(0.4 + recent)} /> : null} />
      <Waves b={b} t={t} back />
      <Display b={b}>
        <DispPicture r={screenRect(b, DISP)} t={t} contrast={contrast} />
      </Display>
      <FloorShadow cd={cd} x={-20} w={230} />
      <Person id={`${u}hero`} cd={cd} p={hc.p} look={{expr: h.x, lHand: h.lh, rHand: h.rh}} farBehind />
      <Light b={b} />
      <Section b={b} glow={0} />
      <Waves b={b} t={t} />
      <WallInterior b={b} />
      {void Z_CUT}
      {void lookAt}
    </svg>
  );
};
