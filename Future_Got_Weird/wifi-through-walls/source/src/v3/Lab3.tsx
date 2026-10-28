// V3 lab shots: the hook (0 to 3.5 s), how the sensing works (to 8.9), the living skeleton and the raised hand (to
// 13.4), the push into the display (to the café), and the ending (the security camera, the blind spot, the duck that
// frame 0 is in the middle of). All shots share one set and one coordinate space (v3/labSet3.tsx).
import React from 'react';
import {add3, B, basis, Cam, camPath, depth, lookAt, mul3, norm3, proj, scaleAt, sub3, v3, V3} from '../world/cam';
import {cardAt, FloorShadow, Person, U} from '../art/person';
import {keypoints, KPName, Pt, LIMBS, COL} from '../art/skeleton';
import {ANT, antPt, C, CAMMON, OFFICE_ROUTER, Cctv, CCTV, DevRoom, lcdQuad, ObsStand, Office, Radio, Rect, RFMON, ROOM_H, screenRect, Section, STAND, WALL, WallFaces, Z_CUT} from './labSet3';
import {END0, HERO_G, heroCard, heroLab, RF_LAG, tau} from './hero3';
import {clamp, DUR, f1, hash, ss, useUid, word} from '../lib';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
export const LB = {
  sci: T_('scientists', 0), built: T_('built'), shoots: T_('shoots'), radio: T_('radio'), through: T_('through'), and: T_('and', 0),
  bounce: T_('bounce'), body: T_('body'), ai: T_('a', 1), moving: T_('moving'), skel: T_('skeleton'), raise: T_('raise'), hand: T_('hand', 0),
  it: T_('it', 0), its: T_('its'), but: T_('but'), creepy: T_('creepy'), now: T_('now'), camera: T_('camera'), or: T_('or'),
};
/** the lab hands over to the café on the push into the skeleton's head keypoint */
export const LAB_OUT = LB.creepy + 0.55;

// ------------------------------------------------------------------ cameras
const cam = (x: number, y: number, z: number, f = 1500, yaw = 0, cy = 960, pitch = 0): Cam => ({pos: v3(x, y, z), yaw, pitch, f, cx: 540, cy});
/** frame 0: medium-close on him at the wall (his side) */
export const CA0 = cam(0.02, 1.02, -0.9, 1150, 1, 1000);
/** the observation stand, close (the camera picture above, the skeleton below) */
const CSTAND = cam(0.6, 1.3, -0.45, 1500, 0, 960);
/** two-shot: him, the wall, the stand */
const C2 = cam(0.22, 1.22, -1.72, 1450, 0, 1000);
/** the lateral cutaway: both rooms, the wall's section, the radio */
const CWIDE = cam(0.38, 1.18, -1.95, 1400, 0, 1020);
/** the RF screen, close */
const CRF = (d: number) => cam(RFMON.x, RFMON.y, RFMON.z - d, 1500, 0, 960);
const CDEV = cam(1.08, 0.82, 0.78, 1500, 8, 980);
const CARRAY = cam(1.0, 1.0, 1.32, 1500, 4, 960);
const CWALL = cam(0.03, 1.02, -0.5, 1500, 0, 960);
const CBODY = cam(-0.5, 0.86, -0.42, 1500, 2, 940);
const CRX = cam(1.1, 0.62, 1.12, 1500, 6, 960);
const CHERO = cam(-0.52, 1.18, -1.1, 1450, 0, 1020);
/** the ending: walking in the office (the camera follows him), the security camera, then the wide */
const CWALK = (hx: number) => cam(hx + 0.15, 1.25, -1.35, 1450, 0, 900);

/** the skeleton's head keypoint on the RF screen (world), the target of the push out of the lab */
const headOnScreen = (t: number): V3 => {
  const r = rfWindow(t);
  const kp = keypoints(heroLab(t - RF_LAG).p);
  const hw = HERO_G.x + kp.head.x / U, hy = -kp.head.y / U;
  const u = (hw - r.x0) / r.w, vv = (hy - r.y0) / r.h;
  return v3(RFMON.x - RFMON.w / 2 + u * RFMON.w, RFMON.y - RFMON.h / 2 + vv * RFMON.h, RFMON.z);
};

export const labCam = (t: number): Cam => {
  const T = tau(t);
  if (T < 0) {
    const hx = HERO_G.x + heroLab(t).p.x / U;
    const camera = LB.camera - DUR, or = LB.or - DUR;
    const walkC = CWALK(Math.max(-1.5, hx));
    return camPath(T, [
      [END0 - DUR, CWALK(HERO_G.x - 0.33)],
      [camera - 0.3, walkC],
      // he stops and looks up at the security camera: both in one frame
      [camera + 0.35, cam(-0.82, 1.45, -1.6, 1400, 0, 900)],
      // wide: the camera's picture and the radio's skeleton both show him; he backs into the camera's blind spot
      [or - 0.25, {...CWIDE, pos: v3(-0.11, 1.3, -2.3), f: 1350, cy: 980}],
      [-0.95, {...CWIDE, pos: v3(-0.12, 1.26, -2.05), f: 1380, cy: 980}],
      [0, CA0],
      [0.42, CSTAND],
    ]);
  }
  if (t < LB.sci - 0.1) {
    return camPath(t, [
      [-0.95, {...CWIDE, pos: v3(-0.12, 1.35, -2.3), f: 1420}],
      [0, CA0],
      [0.42, CSTAND],
      [1.02, C2],
      [1.62, CWIDE],
      [2.3, {...CWIDE, pos: add3(CWIDE.pos, v3(0.05, -0.02, 0.18))}],
      [LB.sci - 0.1, CRF(1.05), true],
    ]);
  }
  if (t < LB.ai + 0.05) {
    return camPath(t, [
      [LB.sci - 0.1, CRF(1.05), true],
      [LB.sci + 0.3, cam(1.05, 1.05, -0.5, 1500, 4, 960)],
      [LB.built + 0.1, CDEV],
      [LB.shoots - 0.05, {...CDEV, pos: add3(CDEV.pos, v3(-0.02, 0.06, 0.12))}],
      [LB.shoots + 0.45, CARRAY],
      // out past the stand's right side (the camera never passes through the screens)
      [LB.radio - 0.05, cam(1.5, 1.15, 0.45, 1450, 2, 940)],
      [LB.radio + 0.25, CWIDE],
      [LB.through, {...CWIDE, pos: v3(0.25, 1.25, -1.9)}],
      [LB.through + 0.45, CWALL],
      [LB.and + 0.1, {...CWALL, pos: v3(-0.12, 0.98, -0.5)}],
      [LB.bounce + 0.15, CBODY],
      [LB.body, {...CBODY, pos: v3(-0.35, 0.88, -0.45)}],
      [LB.body + 0.45, CRX],
      [LB.ai + 0.05, {...CRX, pos: add3(CRX.pos, v3(-0.03, 0.02, 0.06))}],
    ]);
  }
  if (t < LB.raise - 0.1) {
    return camPath(t, [
      [LB.ai + 0.05, {...CRX, pos: add3(CRX.pos, v3(-0.03, 0.02, 0.06))}],
      [LB.ai + 0.3, cam(1.5, 1.05, 0.55, 1450, 0, 960)],
      [LB.ai + 0.65, CRF(1.0)],
      [LB.skel + 0.45, CRF(1.12)],
      [LB.raise - 0.6, C2],
      [LB.raise - 0.1, CHERO],
    ]);
  }
  const head = headOnScreen(LB.creepy + 0.5);
  return camPath(t, [
    [LB.raise - 0.1, CHERO],
    [LB.hand + 0.05, {...CHERO, pos: add3(CHERO.pos, v3(0.04, 0.05, 0.08))}],
    [LB.it + 0.1, {...CSTAND, pos: v3(0.6, 1.3, -0.4)}],
    [LB.its + 0.15, {...CSTAND, pos: v3(0.62, 1.28, -0.32)}],
    [LB.but - 0.05, C2],
    [LB.creepy - 0.2, CRF(1.15)],
    [LB.creepy + 0.25, lookAt(add3(head, v3(0, 0, -0.35)), head, 1600)],
    [LAB_OUT, lookAt(add3(head, v3(0, 0, -0.06)), head, 2600)],
  ]);
};

// ------------------------------------------------------------------ the RF picture
/** the radio's picture: a window in the world (metres) around him; its right edge is the wall */
export const rfWindow = (t: number) => {
  const p = heroLab(t).p;
  const hipW = HERO_G.x + p.x / U;
  const crouch = clamp((-p.y - 200) / 290); // 0 squatting .. 1 standing
  const h = 1.5 + 0.62 * crouch;
  const w = h * (RFMON.w / RFMON.h);
  // him a little right of centre, the wall's section at the right
  return {x0: hipW - w * 0.6, y0: -0.06, w, h};
};
/** contrast: the screen's background darkens and the skeleton brightens as he sinks out of sight (the proof) */
const rfContrast = (t: number) => {
  const T = tau(t);
  return T < 0 ? 0.6 : clamp(0.55 + 0.45 * ss(T, 1.6, 2.3));
};
/** build phase of the skeleton (scene B): raw heat first, then keypoints, then limbs */
const rfBuild = (t: number) => {
  const s = LB.moving;
  if (t > LB.ai - 0.2 && t < LB.skel + 1.2) {
    return {heat: clamp(ss(t, LB.ai, LB.ai + 0.3) * (1 - ss(t, s + 0.5, s + 1.0))), kp: ss(t, s - 0.25, s + 0.25), torso: ss(t, s, s + 0.25), arms: ss(t, s + 0.2, s + 0.45), legs: ss(t, s + 0.4, s + 0.65), head: ss(t, s + 0.55, s + 0.8)};
  }
  // before the radio is explained the screen already tracks him (the hook); while it is explained (scene A) it
  // shows the same live picture
  return {heat: 0, kp: 1, torso: 1, arms: 1, legs: 1, head: 1};
};
const LIMB_GROUP: Record<string, 'torso' | 'arms' | 'legs' | 'head'> = {};
LIMBS.forEach((l) => (LIMB_GROUP[`${l.a}-${l.b}`] = l.g));
const KP_GROUP: Record<KPName, 'torso' | 'arms' | 'legs' | 'head'> = {head: 'head', neck: 'torso', lsh: 'arms', rsh: 'arms', lel: 'arms', rel: 'arms', lwr: 'arms', rwr: 'arms', lhip: 'torso', rhip: 'torso', lkn: 'legs', rkn: 'legs', lan: 'legs', ran: 'legs'};

/** the RF screen's content in screen rect r */
export const RfPicture: React.FC<{r: Rect; t: number}> = ({r, t}) => {
  const u = useUid();
  const win = rfWindow(t);
  const toS = (wx: number, wy: number): Pt => ({x: r.x + ((wx - win.x0) / win.w) * r.w, y: r.y + r.h - ((wy - win.y0) / win.h) * r.h});
  const con = rfContrast(t);
  const bd = rfBuild(t);
  // the estimate: keypoints from his body a tenth of a second ago, with a small estimation noise that settles as the
  // network gains confidence
  const est = (tt: number) => {
    const kp = keypoints(heroLab(tt - RF_LAG).p);
    return Object.fromEntries(Object.entries(kp).map(([k, p], i) => {
      const n = (1 - bd.kp * 0.85) * 0.03 + 0.006;
      const q = Math.floor(tt * 15);
      const jx = (hash(q * 31 + i, 1) - 0.5) * n, jy = (hash(q * 31 + i, 2) - 0.5) * n;
      return [k, toS(HERO_G.x + p.x / U + jx, -p.y / U + jy)];
    })) as Record<KPName, Pt>;
  };
  const kp = est(t);
  const lw = Math.max(1.6, r.w * (0.011 + 0.006 * con));
  const wallA = toS(WALL.x0, 0), wallB = toS(WALL.x1, 0);
  const grid: React.ReactNode[] = [];
  for (let i = 1; i < 8; i++) grid.push(<line key={`gx${i}`} x1={f1(r.x + (i / 8) * r.w)} y1={r.y} x2={f1(r.x + (i / 8) * r.w)} y2={r.y + r.h} stroke="#13283A" strokeWidth={Math.max(1, lw * 0.3)} />);
  for (let i = 1; i < 6; i++) grid.push(<line key={`gy${i}`} x1={r.x} y1={f1(r.y + (i / 6) * r.h)} x2={r.x + r.w} y2={f1(r.y + (i / 6) * r.h)} stroke="#13283A" strokeWidth={Math.max(1, lw * 0.3)} />);
  // motion history: the last few estimates, fading (the reconstruction is a moving measurement, not a drawing)
  const trail = [0.2, 0.13, 0.07].map((d, i) => ({kp: est(t - d), a: 0.12 + 0.06 * i}));
  const limb = (k: Record<KPName, Pt>, a: number, w: number, keyp: string) => LIMBS.map((L, i) => {
    const g = bd[L.g];
    if (g <= 0) return null;
    const A = k[L.a], Bp = k[L.b];
    const E = {x: A.x + (Bp.x - A.x) * clamp(g), y: A.y + (Bp.y - A.y) * clamp(g)};
    return <line key={`${keyp}${i}`} x1={f1(A.x)} y1={f1(A.y)} x2={f1(E.x)} y2={f1(E.y)} stroke={COL[L.side]} strokeWidth={f1(w)} strokeLinecap="round" opacity={a} />;
  });
  const heat = bd.heat > 0 ? (
    <g opacity={bd.heat}>
      <defs>
        <radialGradient id={`${u}rfh`}>
          <stop offset="0" stopColor="#FFE38A" stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#FF7A3D" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7A1FA2" stopOpacity={0} />
        </radialGradient>
      </defs>
      {(['neck', 'lhip', 'rhip', 'head', 'lkn', 'rkn', 'lwr', 'rwr', 'lel', 'lan', 'ran', 'lsh'] as KPName[]).map((k, i) => {
        const jit = (q: number) => (hash(Math.floor(t * 12) * 31 + i, q) - 0.5) * r.w * 0.04;
        return <ellipse key={k} cx={f1(kp[k].x + jit(1))} cy={f1(kp[k].y + jit(2))} rx={f1(r.w * (0.06 + 0.025 * hash(i, 3)))} ry={f1(r.w * (0.05 + 0.025 * hash(i, 4)))} fill={`url(#${u}rfh)`} />;
      })}
    </g>
  ) : null;
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={con > 0.8 ? '#02070D' : '#061220'} />
      {grid}
      <line x1={r.x} y1={f1(toS(0, 0).y)} x2={r.x + r.w} y2={f1(toS(0, 0).y)} stroke="#2D5674" strokeWidth={lw * 0.5} />
      {/* the wall as the radio maps it: a hatched band at the right edge */}
      <rect x={f1(wallA.x)} y={r.y} width={f1(Math.max(0, wallB.x - wallA.x))} height={r.h} fill="#1E3346" />
      {Array.from({length: 14}, (_, i) => <line key={`w${i}`} x1={f1(wallA.x)} y1={f1(r.y + i * r.h * 0.08)} x2={f1(wallB.x)} y2={f1(r.y + i * r.h * 0.08 + (wallB.x - wallA.x))} stroke="#2E4A62" strokeWidth={Math.max(1, lw * 0.3)} />)}
      <text x={f1((wallA.x + wallB.x) / 2)} y={f1(r.y + r.h * 0.97)} textAnchor="middle" fontSize={f1(r.h * 0.035)} fill="#4F7391" fontFamily="JetBrains Mono, monospace">WALL</text>
      {heat}
      {bd.torso > 0.99 && trail.map((tr, i) => <g key={`tr${i}`}>{limb(tr.kp, tr.a, lw * 0.8, `t${i}`)}</g>)}
      {limb(kp, 0.25 + 0.15 * con, lw * 3, 'g')}
      {limb(kp, 1, lw, 'l')}
      {(Object.keys(kp) as KPName[]).map((k) => {
        const a = clamp((bd[KP_GROUP[k]] - 0.1) / 0.4) * bd.kp;
        if (a <= 0) return null;
        const rr = lw * (k === 'head' ? 1.9 : 1.05);
        return (
          <g key={k} opacity={a}>
            <circle cx={f1(kp[k].x)} cy={f1(kp[k].y)} r={f1(rr * 2.4)} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={f1(lw * 0.35)} />
            <circle cx={f1(kp[k].x)} cy={f1(kp[k].y)} r={f1(rr)} fill="#FFFFFF" />
          </g>
        );
      })}
      <circle cx={f1(r.x + r.w * 0.05)} cy={f1(r.y + r.h * 0.07)} r={f1(r.h * 0.018)} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : '#B33'} />
      <text x={f1(r.x + r.w * 0.08)} y={f1(r.y + r.h * 0.085)} fontSize={f1(r.h * 0.05)} fill="#7FA9C9" fontFamily="JetBrains Mono, monospace" letterSpacing={1}>RADIO · LIVE</text>
    </g>
  );
};

// ------------------------------------------------------------------ the security camera's picture
/** the view from the security camera on the office wall, drawn into rect r (a real projection of the office) */
export const CamPicture: React.FC<{r: Rect; t: number; live?: boolean}> = ({r, t, live = true}) => {
  const VW = 1000, VH = (1000 * CAMMON.h) / CAMMON.w;
  const cc: Cam = {...lookAt(CCTV.pos, CCTV.aim, 620, VW / 2, VH / 2)};
  const b = basis(cc);
  const h = heroLab(t);
  const hc = heroCard(h.p);
  const cd = cardAt(b, hc.at);
  const sc = r.w / VW;
  const T = tau(t);
  const ts = `${String(14 + Math.floor((22 + t / 60) / 60)).padStart(2, '0')}:${String(22 + Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(7 + t) % 60).padStart(2, '0')}`;
  const u = useUid();
  return (
    <g transform={`translate(${f1(r.x)} ${f1(r.y)}) scale(${sc.toFixed(5)})`}>
      <defs>
        <clipPath id={`${u}camv`}>
          <rect width={VW} height={VH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${u}camv)`}>
      <rect width={VW} height={VH} fill="#6E7F87" />
      <g opacity={0.92}>
        <Office b={b} front />
        <FloorShadow cd={cd} x={-20} w={230} />
        <Person id={`cam${Math.round(t * 30)}`} cd={cd} p={hc.p} look={{expr: h.x, lHand: h.lh, rHand: h.rh}} farBehind />
      </g>
      {/* security-camera look: cool cast, vignette, scan lines, timestamp */}
      <rect width={VW} height={VH} fill="#7FA4B4" opacity={0.22} style={{mixBlendMode: 'multiply'}} />
      {Array.from({length: 40}, (_, i) => <rect key={i} x={0} y={i * (VH / 40)} width={VW} height={VH / 80} fill="#000" opacity={0.06} />)}
      <circle cx={42} cy={44} r={13} fill={live ? (Math.floor(t * 2) % 2 ? '#FF3B3B' : '#A22') : '#552'} />
      <text x={66} y={56} fontSize={38} fill="#F2F6F8" fontFamily="JetBrains Mono, monospace">CAM 1</text>
      <text x={VW - 30} y={VH - 28} textAnchor="end" fontSize={34} fill="#F2F6F8" fontFamily="JetBrains Mono, monospace" opacity={0.9}>{ts}</text>
      {void T}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the waves
/** transmit wavefronts: from the horizontal bar toward him, in the vertical plane through the array and him. Each
 *  point of a front travels along its own ray; inside the concrete it moves at under half speed and comes out
 *  weaker, so every front kinks and dims where it crosses the wall (a picture of the physics, not to scale). */
const SPEED = 1.15;
const PERIOD = 0.3;
const SLOW = 0.42;
const target = () => v3(HERO_G.x + 0.18, 0, HERO_G.z);
const fanFrame = () => {
  const o = antPt(0, ANT.y, 0.03);
  const tg = target();
  const dir = norm3(v3(tg.x - o.x, 0, tg.z - o.z));
  return {o, dir, dist: Math.hypot(tg.x - o.x, tg.z - o.z)};
};
/** the point a front emitted te ago has reached along a ray (elevation a deg), and whether it is past the wall */
const along = (o: V3, ray: V3, r: number) => {
  // ray.x < 0 (toward the wall); entry and exit distances along the ray
  const dIn = (WALL.x1 - o.x) / ray.x, dOut = (WALL.x0 - o.x) / ray.x;
  const len = dOut - dIn;
  let d: number, zone: 0 | 1 | 2;
  if (r < dIn) { d = r; zone = 0; }
  else if (r < dIn + len / SLOW) { d = dIn + (r - dIn) * SLOW; zone = 1; }
  else { d = dOut + (r - dIn - len / SLOW); zone = 2; }
  return {p: add3(o, mul3(ray, d)), zone, d};
};
const rayOf = (dir: V3, a: number) => {
  const r = (a * Math.PI) / 180;
  return v3(dir.x * Math.cos(r), Math.sin(r), dir.z * Math.cos(r));
};
/** sound timing: transmit pulses and the moment the first front enters the concrete */
export const waveTiming = () => {
  const {o, dir} = fanFrame();
  const ray = rayOf(dir, 0);
  const dIn = (WALL.x1 - o.x) / ray.x;
  const pulses: number[] = [];
  for (let te = LB.shoots; te <= LB.body + 0.1; te += PERIOD) pulses.push(te);
  return {pulses, wallIn: LB.shoots + dIn / SPEED, hit: hitTime()};
};
export const waveOn = (t: number) => t > LB.shoots && t < LB.ai + 0.6;
const Waves: React.FC<{b: B; t: number}> = ({b, t}) => {
  if (!waveOn(t)) return null;
  const {o, dir, dist} = fanFrame();
  const stop = LB.body + 0.1;
  const fronts: React.ReactNode[] = [];
  for (let k = 0; ; k++) {
    const te = LB.shoots + k * PERIOD;
    if (te > Math.min(t, stop)) break;
    const r = (t - te) * SPEED;
    if (r < 0.02 || r > dist + 1.6) continue;
    const segs: {pts: Pt[]; zone: number}[] = [];
    let cur: {pts: Pt[]; zone: number} | null = null;
    for (let i = 0; i <= 24; i++) {
      const a = -34 + (68 * i) / 24;
      const q = along(o, rayOf(dir, a), r);
      if (q.p.y < 0.01 || q.p.y > ROOM_H - 0.02) { cur = null; continue; }
      const P = proj(b, q.p);
      if (!cur || cur.zone !== q.zone) {
        if (cur) cur.pts.push({x: P.x, y: P.y});
        cur = {pts: [], zone: q.zone};
        segs.push(cur);
      }
      cur.pts.push({x: P.x, y: P.y});
    }
    const fade = clamp(r / 0.15) * clamp((dist + 1.6 - r) / 0.6);
    const w = Math.max(1.4, scaleAt(b, add3(o, mul3(dir, Math.min(r, dist)))) * 0.006);
    segs.forEach((sg, i) => {
      if (sg.pts.length < 2) return;
      const d = `M${sg.pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`;
      const a = fade * (sg.zone === 0 ? 1 : sg.zone === 1 ? 0.75 : 0.5);
      fronts.push(
        <g key={`${k}-${i}`} opacity={a}>
          <path d={d} fill="none" stroke={C.rf} strokeWidth={w * 4} strokeLinecap="round" opacity={0.2} />
          <path d={d} fill="none" stroke={sg.zone === 1 ? '#8FE9FF' : '#D6F8FF'} strokeWidth={w * (sg.zone === 2 ? 0.75 : 1)} strokeLinecap="round" />
        </g>,
      );
    });
  }
  return <g style={{mixBlendMode: 'screen'}}>{fronts}</g>;
};

/** echoes: from his head, torso, hands and knees back toward the receive bar, slowed and weakened by the wall again */
const ECHO: {kp: KPName; d: number}[] = [{kp: 'neck', d: 0}, {kp: 'lhip', d: 0.05}, {kp: 'head', d: 0.1}, {kp: 'lkn', d: 0.15}, {kp: 'lwr', d: 0.2}, {kp: 'rkn', d: 0.25}];
const ESPEED = 3.2;
const rxPoint = () => antPt(0, ANT.y - 0.3, 0.03);
/** when the first front reaches him (his near side) */
export const hitTime = () => {
  const {o, dir, dist} = fanFrame();
  const ray = rayOf(dir, 0);
  const dIn = (WALL.x1 - o.x) / ray.x, dOut = (WALL.x0 - o.x) / ray.x;
  return LB.shoots + (dIn + (dOut - dIn) / SLOW + (dist - 0.2 - dOut)) / SPEED;
};
/** the echo set launched at `t0` from keypoint world positions; returns arcs and arrival times at the receiver */
/** the raised hand's echoes (the tracking responds to the arm going up) */
export const RAISE_ECHO = () => ({t0: LB.raise + 0.05, list: [{kp: 'rwr' as KPName, d: 0}, {kp: 'rel' as KPName, d: 0.08}], n: 3});
export const echoes = (t: number, kpW: Record<KPName, V3>, set?: {t0: number; list: {kp: KPName; d: number}[]; n: number}) => {
  const out: {c: V3; back: V3; r: number; zone: number; a: number}[] = [];
  const arrivals: number[] = [];
  const t0 = set ? set.t0 : Math.max(hitTime(), LB.bounce + 0.05);
  const rx = rxPoint();
  (set ? set.list : ECHO).forEach(({kp, d}, i) => {
    for (let k = 0; k < (set ? set.n : 3); k++) {
      const te = t0 + d + k * PERIOD;
      const src = kpW[kp];
      const back = norm3(sub3(rx, src));
      const dist = Math.hypot(rx.x - src.x, rx.y - src.y, rx.z - src.z);
      // wall crossing on the way back (back.x > 0)
      const dIn = (WALL.x0 - src.x) / back.x, dOut = (WALL.x1 - src.x) / back.x;
      const extra = (dOut - dIn) * (1 / SLOW - 1);
      arrivals.push(te + (dist + extra) / ESPEED);
      if (t < te) continue;
      const rr = (t - te) * ESPEED;
      if (rr > dist + extra) continue;
      let dd: number, zone: number;
      if (rr < dIn) { dd = rr; zone = 0; }
      else if (rr < dIn + (dOut - dIn) / SLOW) { dd = dIn + (rr - dIn) * SLOW; zone = 1; }
      else { dd = dOut + (rr - dIn - (dOut - dIn) / SLOW); zone = 2; }
      out.push({c: add3(src, mul3(back, dd)), back, r: 0.06 + dd * 0.05, zone, a: clamp(rr / 0.08) * clamp((dist + extra - rr) / 0.2) * (i === 0 ? 1 : 0.85)});
    }
  });
  return {out, arrivals};
};
const Echoes: React.FC<{b: B; t: number; kpW: Record<KPName, V3>}> = ({b, t, kpW}) => {
  const raiseSet = t > LB.raise && t < LB.its + 0.6;
  if (!raiseSet && (t < LB.bounce - 0.1 || t > LB.ai + 1.0)) return null;
  const set = raiseSet ? RAISE_ECHO() : undefined;
  const {out} = echoes(t, kpW, set);
  const t0 = set ? set.t0 : Math.max(hitTime(), LB.bounce + 0.05);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {out.map((e, i) => {
        const pts: Pt[] = [];
        for (let j = 0; j <= 10; j++) {
          const a = ((-55 + 11 * j) * Math.PI) / 180;
          const side = norm3(v3(-e.back.z, 0, e.back.x));
          const p = add3(e.c, add3(mul3(e.back, Math.cos(a) * e.r - e.r), add3(mul3(v3(0, 1, 0), Math.sin(a) * e.r), mul3(side, 0))));
          const P = proj(b, p);
          pts.push({x: P.x, y: P.y});
        }
        const w = Math.max(1.3, scaleAt(b, e.c) * 0.005);
        const d = `M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`;
        const a = e.a * (e.zone === 0 ? 1 : e.zone === 1 ? 0.7 : 0.5);
        return (
          <g key={i} opacity={a}>
            <path d={d} fill="none" stroke="#FFD24A" strokeWidth={w * 4} strokeLinecap="round" opacity={0.22} />
            <path d={d} fill="none" stroke="#FFF1B8" strokeWidth={w} strokeLinecap="round" />
          </g>
        );
      })}
      {/* where a front meets his body: a brief glint at each reflecting part */}
      {(set ? set.list : ECHO).map(({kp, d}, i) => {
        const g = clamp(1 - Math.abs(t - (t0 + d)) / 0.16);
        if (g <= 0) return null;
        const P = proj(b, kpW[kp]);
        return <circle key={`g${i}`} cx={f1(P.x)} cy={f1(P.y)} r={f1(scaleAt(b, kpW[kp]) * 0.05)} fill="#FFF6C8" opacity={0.55 * g} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the radio's range readout
const RangeLcd: React.FC<{b: B; t: number; level: number}> = ({b, t, level}) => {
  if (depth(b, antPt(0, 0.4, 0)) < 0.2) return null;
  const q = lcdQuad().map((p) => proj(b, p));
  // bilinear map of (u 0..1 across, v 0..1 up) into the quad (q0 near-left, q1 near-right, q2 far-right, q3 far-left)
  const at = (uu: number, vv: number) => {
    const a = {x: q[0].x + (q[1].x - q[0].x) * uu, y: q[0].y + (q[1].y - q[0].y) * uu};
    const c = {x: q[3].x + (q[2].x - q[3].x) * uu, y: q[3].y + (q[2].y - q[3].y) * uu};
    return {x: a.x + (c.x - a.x) * vv, y: a.y + (c.y - a.y) * vv};
  };
  // range profile: the wall (a fixed peak), him (a peak that rises as his echoes arrive, and wobbles as he breathes)
  const wallR = 0.28, himR = 0.6;
  const pts: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const x = i / 48;
    const n = 0.05 * hash(i + Math.floor(t * 10) * 50, 5);
    const y = 0.08 + n + 0.5 * Math.exp(-(((x - wallR) / 0.03) ** 2)) + level * (0.7 + 0.05 * Math.sin(t * 6)) * Math.exp(-(((x - himR - 0.01 * Math.sin(t * 2.6)) / 0.035) ** 2));
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

/** "Or Wi-Fi": the office's ordinary router, its broadcast spreading through the room he hides in */
const OfficeWifi: React.FC<{b: B; t: number}> = ({b, t}) => {
  const T = tau(t);
  const on = T < 0 ? ss(T, LB.or - DUR - 0.1, LB.or - DUR + 0.3) * (1 - ss(T, -0.5, -0.1)) : 0;
  if (on <= 0) return null;
  const c = proj(b, add3(OFFICE_ROUTER, v3(0, 0.1, 0)));
  const k = scaleAt(b, OFFICE_ROUTER);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {[0, 1, 2, 3].map((i) => {
        const ph = (t * 0.9 + i / 4) % 1;
        return <circle key={i} cx={f1(c.x)} cy={f1(c.y)} r={f1(k * (0.1 + ph * 2.6))} fill="none" stroke="#BFF6FF" strokeWidth={Math.max(1.4, k * 0.009)} opacity={on * 0.7 * (1 - ph) * clamp(ph * 5)} />;
      })}
      <circle cx={f1(c.x)} cy={f1(c.y - k * 0.04)} r={f1(k * 0.025)} fill="#7CFFB2" opacity={on * (0.6 + 0.4 * Math.sin(t * 20))} />
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
  const kpL = keypoints(h.p);
  const kpW = Object.fromEntries(Object.entries(kpL).map(([k, p]) => [k, v3(HERO_G.x + p.x / U, -p.y / U, HERO_G.z - 0.05)])) as Record<KPName, V3>;
  // the transmitter pulses with each emitted front; the receive patches light as echoes arrive
  const tx = waveOn(t) && t < LB.body + 0.2 ? Math.max(0, 1 - ((t - LB.shoots) % PERIOD) / 0.12) : 0;
  const {arrivals} = t > LB.bounce - 0.1 && t < LB.ai + 1.2 ? echoes(t, kpW) : t > LB.raise && t < LB.its + 0.8 ? echoes(t, kpW, RAISE_ECHO()) : {arrivals: [] as number[]};
  const rxl = [0, 1, 2, 3].map((i) => arrivals.reduce((a, ta) => a + (t > ta + i * 0.015 ? Math.exp(-(t - ta - i * 0.015) / 0.09) : 0), 0)).map((v) => clamp(v));
  const level = t > LB.raise ? 1 : arrivals.length ? clamp(arrivals.filter((ta) => t > ta).length / 6) : t > LB.ai ? 1 : 0;
  const open = ss(t, LB.built, LB.built + 0.45) * (1 - ss(t, LB.shoots + 0.6, LB.shoots + 1.0));
  // his near side lights while the fronts reach him
  const lit = t > hitTime() - 0.1 && t < LB.ai + 0.3 ? ss(t, hitTime() - 0.1, hitTime() + 0.2) * (1 - ss(t, LB.body + 0.3, LB.ai + 0.3)) : 0;
  const camOk = t < LB.sci + 0.3 || tau(t) < 0 || t > LB.raise;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill="#20303A" />
      <Office b={b} />
      <DevRoom b={b} />
      <WallFaces b={b} />
      <Cctv b={b} />
      <Radio b={b} open={open} tx={tx} rx={rxl} lcd={open < 0.05 ? <RangeLcd b={b} t={t} level={level} /> : null} />
      <ObsStand b={b} cam={camOk ? <CamPicture r={screenRect(b, CAMMON)} t={t} /> : <CamPicture r={screenRect(b, CAMMON)} t={t} />} rf={<RfPicture r={screenRect(b, RFMON)} t={t} />} />
      <FloorShadow cd={cd} x={-20} w={230} />
      <Person id={`${u}hero`} cd={cd} p={hc.p} look={{expr: h.x, lHand: h.lh, rHand: h.rh}} farBehind />
      {lit > 0 && <ellipse cx={f1(cd.x + cd.k * 40)} cy={f1(cd.y - cd.k * 330)} rx={f1(cd.k * 240)} ry={f1(cd.k * 380)} fill={C.rf} opacity={0.12 * lit} style={{mixBlendMode: 'screen'}} />}
      <Echoes b={b} t={t} kpW={kpW} />
      <Section b={b} glow={waveOn(t) ? 0.5 : 0} />
      <Waves b={b} t={t} />
      <OfficeWifi b={b} t={t} />
      {void STAND}
    </svg>
  );
};
