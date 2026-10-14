// SHOTS H1–H7: the opening, 0:00 → "So why would a company do this?".
// One continuous jump timeline (robot #1), then a second robot on the production monitor and from a control-room window.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, Proj, makeProj, camMix} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, rnd, noise1, norm, mv, mm, rotX, rotY} from '../engine/math';
import {Item, Env, sortItems} from '../engine/prims';
import {hull, smoothClosed, clipRings} from '../engine/draw';
import {renderRobotItems, Light} from '../robot/Robot';
import {CharSpec, charItem} from '../engine/Scene3D';
import {CHEST, surfLocal} from '../robot/model';
import {Pose} from '../robot/rig';
import {DECK, FOUNDRY_ENV, GLOW_POS, HeatGlow, Haze, LADLE, LightShafts, foundryBack, ladle, moltenSurface, sparksAmbient, walkway} from '../sets/Foundry';
import {Flash, flames, smoke, splash} from '../fx/Splash';
import {makeJump, walkToEdge, walkDuration} from '../robot/jump';
import {blendPose, speedRamp} from '../robot/motion';
import {T, TE} from '../cues';
import {Chip} from '../ui/Chip';
import {F} from '../../theme';

export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// ---------------------------------------------------------------- timing (from the narration)
const T_STEEL = T('steel');                   // "…into molten STEEL"
const T_IN = T_STEEL + 0.06;                  // toes reach the surface
const T_TO = 0.5;                             // takeoff
const T_H2 = 0.8, T_H3 = 2.0, T_H4 = T_IN - 0.03;
const T_H5 = T_IN + 0.95;                    // close detail: a vented back plate floats, glows and goes under
const T_H5B = T_IN + 2.35;                   // aftermath: churned surface, tilt up to the empty edge
const T_H6 = T('Figure the robot maker') - 0.12;
const T_H7 = T('and a spokesperson') - 0.1;
export const HOOK_FOUNDRY_END = T('So why would') - 0.18;

export const JUMP1 = makeJump({
  tTakeoff: T_TO, tEntry: T_IN,
  ramp: [[T_TO, 1], [T_TO + 0.32, 0.24], [T_IN - 0.62, 0.24], [T_IN - 0.12, 1], [T_IN, 1]],
  pushDur: 0.62,
});
// robot #2: walks out during H6, jumps so its toes reach the steel on "in"
const R2_WALK0 = T_H6 - 0.4;
const R2_STOP = R2_WALK0 + walkDuration(6);
const R2_IN = TE('go in') - 0.55;
const JUMP2 = makeJump({tTakeoff: R2_IN - 1.06, tEntry: R2_IN, lateral: 0, pushDur: 0.7});

export const robotLight = (strength = 1.8): Light => ({dir: norm([0.25, 0.85, -0.45]), glow: {pos: GLOW_POS, color: '#FF8A2A', strength, falloff: 330}, rim: '#B6C7D6'});

// after entry: real time, then a 0.45× slow section for the close-up, then real time again
const POST = (() => {
  const keys: [number, number][] = [[T_IN, 1], [T_IN + 30, 1]];
  let tot = 0;
  for (let i = 0; i < keys.length - 1; i++) tot += ((keys[i][1] + keys[i + 1][1]) / 2) * (keys[i + 1][0] - keys[i][0]);
  return speedRamp(keys, tot);
})();
/** Seconds of physical time since entry at screen time tau (negative before entry). */
export const postEntry = (tau: number) => (tau < T_IN ? -1 : POST.phys(tau));
/** Robot #1 state at screen time tau. */
export const robot1 = (tau: number) => (tau < T_IN ? JUMP1.at(JUMP1.phys(tau)) : JUMP1.at(JUMP1.T + POST.phys(tau)));
const robot2 = (tau: number) => {
  if (tau < R2_STOP) return {pose: walkToEdge(tau - R2_WALK0), clipY: undefined as number | undefined, phase: 'walk'};
  const t = tau - (R2_IN - 1.06); // seconds since takeoff
  const s = JUMP2.at(t);
  if (s.phase === 'push' && t < -0.7) {
    const settle = smooth((tau - R2_STOP) / 0.7);
    return {pose: blendPose(walkToEdge(walkDuration(6)), JUMP2.K.look, settle), clipY: undefined, phase: 'stand'};
  }
  return {pose: s.pose, clipY: s.clipY, phase: s.phase};
};

// ---------------------------------------------------------------- scene assembly
export type SceneRobot = {pose: Pose; clipY?: number; id: string; inside: boolean; trail?: Pose[]; highlight?: {prefix: string; color: string; amount: number}[]};
type SceneOpts = {
  cam: Cam3;
  tau: number;
  robots: SceneRobot[];
  entries: {at: V3; t: number; seed: number}[];
  extra?: (pr: Proj, env: Env) => Item[];
  shake?: number;
  flameScale?: number;
  chars?: CharSpec[];
  frame?: number;
};

export const insideLadle = (p: V3) => Math.hypot(p[0] - LADLE.c[0], p[2] - LADLE.c[2]) < LADLE.rIn;

/** Builds the foundry frame as SVG children (also used inside the production monitor). */
export const foundryFrame = (o: SceneOpts, idp = ''): {pr: Proj; nodes: React.ReactNode; defs: React.ReactNode[]} => {
  const {cam, tau, robots, entries, extra, shake = 0} = o;
  const sh: [number, number] = shake > 0 ? [noise1(tau * 40, 1) * 14 * shake, noise1(tau * 40, 7) * 10 * shake] : [0, 0];
  const pr = makeProj({...cam, shake: sh});
  const env = FOUNDRY_ENV;
  const items: Item[] = [];
  items.push(...foundryBack(pr, env, tau));
  items.push(...walkway(pr, env));
  const L = ladle(pr, env);
  items.push(...L.back, ...L.front);
  const latest = entries.filter((e) => e.t >= 0).sort((a, b) => a.t - b.t)[0];
  const scar = entries.reduce((m, e) => Math.max(m, clamp01((e.t - 0.6) / 1.2)), 0);
  items.push(moltenSurface(pr, env, tau, latest ? {at: latest.at, t: latest.t} : undefined, scar));
  const zc = pr.p([0, LADLE.steel, 0]).z;
  const defs: React.ReactNode[] = [];
  for (const r of robots) {
    const draw = (pose: Pose, id: string, opacity: number) => {
      const {items: ri, defs: rd, sk} = renderRobotItems({pr, pose, id: idp + id, clipY: r.inside ? r.clipY : undefined, light: robotLight(), heat: {level: LADLE.steel, range: 70}, highlight: opacity === 1 ? r.highlight : undefined});
      defs.push(...rd);
      const z0 = pr.p(sk.pelvis).z;
      const z = r.inside ? Math.max(zc - LADLE.rTop * 0.8, Math.min(zc + LADLE.rTop * 0.8, z0)) : z0;
      ri.sort((a, b) => b.z - a.z);
      items.push({z: z + (opacity < 1 ? 1 : 0), key: 'robot-' + idp + id, el: <g key={'robot-' + idp + id} opacity={opacity}>{ri.map((x) => x.el)}</g>});
    };
    (r.trail ?? []).forEach((tp, k) => draw(tp, `${r.id}-tr${k}`, 0.22 / (k + 1)));
    draw(r.pose, r.id, 1);
  }
  for (const e of entries) {
    items.push(...splash(pr, [e.at[0], LADLE.steel, e.at[2]], e.t, LADLE.steel, {seed: e.seed, inside: insideLadle}));
    items.push(...flames(pr, [e.at[0], LADLE.steel, e.at[2]], e.t - 0.25, {seed: e.seed + 3, height: 45 * (o.flameScale ?? 1), width: 30 * (o.flameScale ?? 1), strength: clamp01((e.t - 0.25) * 2) * (1 - clamp01((e.t - 3.5) / 2))}));
    items.push(...smoke(pr, [e.at[0], LADLE.steel + 10, e.at[2]], e.t - 0.15, {seed: e.seed + 7, n: 16, dark: 0.75, opacity: 0.5}));
  }
  items.push(...smoke(pr, [40, LADLE.steel + 20, -30], tau + 3, {seed: 77, n: 8, dark: 0.35, opacity: 0.18, size: 60, rise: 70, spread: 90}));
  items.push(...sparksAmbient(pr, tau, 18, 5));
  if (extra) items.push(...extra(pr, env));
  for (const c of o.chars ?? []) items.push(charItem(pr, c, o.frame ?? Math.round(tau * 30)));
  sortItems(items);
  const flash = latest && latest.t < 0.3 ? <Flash t={latest.t} x={pr.p(latest.at).x} y={pr.p(latest.at).y} /> : null;
  return {
    pr, defs,
    nodes: (
      <>
        <rect width={1920} height={1080} fill="#18141C" />
        <LightShafts pr={pr} />
        {items.map((it) => it.el)}
        <HeatGlow pr={pr} intensity={1} id={idp + 'hg'} />
        <Haze id={idp + 'hz'} />
        {flash}
      </>
    ),
  };
};

export const FoundryScene: React.FC<SceneOpts> = (o) => {
  const {nodes, defs} = foundryFrame(o);
  return (
    <AbsoluteFill style={{background: '#18141C'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>{defs}</defs>
        {nodes}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- cameras
const comAt = (tau: number): V3 => add(robot1(tau).pose.pos, [0, 10, 0]);

const camH1 = (tau: number): Cam3 => {
  // just beyond the edge, below deck level: the foot drives off the hazard edge against the glow, then a fast pull-back
  const u = easeOut((tau - 0.2) / 0.6);
  const a: Cam3 = {pos: [-152, DECK.y + 5, 80], target: [-222, DECK.y + 16, 4], fov: 44, roll: -7};
  const b: Cam3 = {pos: [-20, DECK.y + 70, 430], target: [-150, DECK.y + 40, 0], fov: 56, roll: -2};
  const c = camMix(a, b, u);
  const com = comAt(tau);
  c.target = lerp3(c.target, [com[0], com[1] - 30, 0], u * 0.55);
  return c;
};
const camH2 = (tau: number): Cam3 => {
  const u = (tau - T_H2) / (T_H3 - T_H2);
  const com = comAt(tau);
  const tgt = lerp3(com, [0, LADLE.rim, 0], 0.38);
  return {pos: lerp3([300, 790, 540], [250, 750, 480], smooth(u)), target: tgt, fov: 50, roll: mix(-4, -1, u)};
};
const camH3 = (tau: number): Cam3 => {
  const u = (tau - T_H3) / (T_H4 - T_H3);
  const com = comAt(tau);
  const chest: V3 = add(com, [0, 28, 0]);
  return {pos: lerp3([400, 560, 480], [290, 470, 360], easeInOut(u)), target: lerp3(chest, [0, LADLE.steel + 60, 0], 0.18), fov: mix(36, 32, u), roll: mix(2, 0, u)};
};
const camH4 = (tau: number): Cam3 => {
  const u = (tau - T_H4) / (T_H5 - T_H4);
  return {pos: lerp3([330, 428, 430], [360, 440, 455], easeOut(u)), target: lerp3([-16, 400, 0], [-16, 385, 0], u), fov: 41};
};
const PLATE_C: V3 = [JUMP1.p1[0] + 4, LADLE.steel, JUMP1.p1[2] + 18];
const camH5 = (tau: number): Cam3 => {
  // low and close over the steel: the plate fills a third of the frame, the far lining glows behind it
  const u = (tau - T_H5) / (T_H5B - T_H5);
  return {pos: lerp3(add(PLATE_C, [58, 50, 74]), add(PLATE_C, [50, 40, 64]), smooth(u)), target: add(PLATE_C, [0, 6 - 10 * u, 0]), fov: 38, roll: mix(-4, -2, u)};
};
const camH5B = (tau: number): Cam3 => {
  const u = (tau - T_H5B) / (T_H6 - T_H5B);
  // from the churned surface, tilt up past the rising smoke to the now-empty launch edge
  const e = easeInOut(u);
  return {pos: lerp3([150, 600, 250], [190, 590, 310], e), target: lerp3([-12, LADLE.steel, 0], [DECK.edgeX - 30, DECK.y + 60, 0], e), fov: mix(40, 44, e), roll: mix(-3, 0, e)};
};
const camH6 = (tau: number): Cam3 => {
  const u = (tau - T_H6) / (T_H7 - T_H6);
  return {pos: lerp3([-120, DECK.y + 230, 520], [-180, DECK.y + 210, 470], smooth(u)), target: lerp3([-430, DECK.y + 60, -10], [-300, DECK.y + 70, 0], smooth(u)), fov: 44};
};
const camH7 = (tau: number): Cam3 => {
  const u = (tau - T_H7) / (HOOK_FOUNDRY_END - T_H7);
  // last 0.6 s: zoom through the glass onto the ladle rim (match cut to a round actuator cap in the workshop)
  const z = easeInOut((tau - (HOOK_FOUNDRY_END - 0.6)) / 0.6);
  const target = lerp3(lerp3([-120, 470, 30], [-100, 450, 20], smooth(u)), [0, LADLE.rim - 10, 0], z);
  return {pos: lerp3([900, 1000, -560], [840, 970, -510], smooth(u)), target, fov: mix(34, 13, z)};
};

// ---------------------------------------------------------------- props
/** Production monitor (screen space) showing robot #2 from the film camera's position: proof that it was filmed. */
const Monitor: React.FC<{tau: number; pose: Pose; appear: number}> = ({tau, pose, appear}) => {
  const a = clamp01(appear / 0.4);
  const e = 1 - Math.pow(1 - a, 3);
  const cam: Cam3 = {pos: [-110, DECK.y + 30, 70], target: [-300, DECK.y + 110, -4], fov: 38, roll: 3};
  const {nodes, defs} = foundryFrame({cam, tau, robots: [{pose, id: 'mon', inside: false}], entries: []}, 'm');
  const tc = (() => {
    const fr = Math.floor(tau * 24);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(fr / 24 / 60))}:${pad(Math.floor(fr / 24) % 60)}:${pad(fr % 24)}`;
  })();
  const x = 90, y = 90, w = 700, h = 394;
  return (
    <g transform={`translate(${(1 - e) * -120} 0)`} opacity={e}>
      <rect x={x - 22} y={y - 22} width={w + 44} height={h + 44} rx={16} fill="#1E2026" stroke="#0B0C0F" strokeWidth={6} />
      <svg x={x} y={y} width={w} height={h} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>{defs}</defs>
        {nodes}
        {[[60, 60, 1], [1860, 60, -1]].map(([cx, cy, s], i) => <path key={i} d={`M${cx} ${cy + 90}V${cy}H${cx + s * 140}`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeOpacity={0.85} />)}
        {[[60, 1020, 1], [1860, 1020, -1]].map(([cx, cy, s], i) => <path key={'b' + i} d={`M${cx} ${cy - 90}V${cy}H${cx + s * 140}`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeOpacity={0.85} />)}
        <circle cx={150} cy={160} r={26} fill={Math.floor(tau * 2) % 2 === 0 ? '#FF3B30' : '#6A1A16'} />
        <text x={196} y={182} fontFamily={F.mono} fontWeight={700} fontSize={64} fill="#FFFFFF">REC</text>
        <text x={1860} y={182} textAnchor="end" fontFamily={F.mono} fontWeight={700} fontSize={64} fill="#FFFFFF">{tc}</text>
      </svg>
      <text x={x + 6} y={y + h + 46} fontFamily={F.body} fontWeight={800} fontSize={22} fill="#AEB3BD">our illustration, not a frame from the film</text>
    </g>
  );
};

/** Control-room window frame (foreground, screen space) for the plant's point of view. */
export const ControlWindow: React.FC = () => (
  <g>
    <path d="M0 0H1920V1080H0Z M110 110H1810V930H110Z" fill="#262A34" fillRule="evenodd" />
    <rect x={110} y={110} width={1700} height={820} fill="none" stroke="#111015" strokeWidth={10} />
    <rect x={610} y={110} width={18} height={820} fill="#262A34" stroke="#111015" strokeWidth={4} />
    <path d="M110 930 L1810 930 L1880 1080 L40 1080 Z" fill="#363B47" stroke="#111015" strokeWidth={6} />
    <path d="M300 968 Q360 900 430 968 Z" fill="#F2B632" stroke="#111015" strokeWidth={5} />
    <rect x={280} y={962} width={170} height={14} rx={6} fill="#E3A520" stroke="#111015" strokeWidth={5} />
    <rect x={1500} y={930} width={60} height={86} rx={8} fill="#1E2026" stroke="#111015" strokeWidth={5} />
    <rect x={1512} y={944} width={36} height={22} rx={3} fill="#5BD6A3" fillOpacity={0.6} />
    <line x1={1548} y1={930} x2={1560} y2={880} stroke="#111015" strokeWidth={6} strokeLinecap="round" />
    <path d="M160 150 L400 150 L230 900 L160 900 Z" fill="#FFFFFF" fillOpacity={0.05} />
    <path d="M1250 150 L1330 150 L1150 900 L1070 900 Z" fill="#FFFFFF" fillOpacity={0.04} />
  </g>
);

/** H5: the robot's back plate (vents, seams, fasteners: clearly machine plating) floats tilted, glows at the edges and goes under. */
const backPlate = (pr: Proj, t: number): Item[] => {
  const items: Item[] = [];
  const y0 = LADLE.steel;
  const sink = smooth((t - 0.35) / 1.0);
  const M = mm(rotY(0.5 + t * 0.18), rotX(Math.PI / 2 - 0.85 + 0.35 * sink));
  const centre: V3 = [PLATE_C[0], y0 + 7 - sink * 30, PLATE_C[2]];
  const W = 21, Hh = 18, depth = 3.2, bow = 4;
  const P = (u: number, v: number, off: number): V3 => {
    // curved plate: u across (-1..1), v up (-1..1); bowed like the back of the torso
    const local: V3 = [u * W, v * Hh, bow * (1 - u * u) + off];
    return add(centre, mv(M, local));
  };
  const rows = (off: number) => {
    const out: V3[][] = [];
    for (let i = 0; i <= 6; i++) {
      const row: V3[] = [];
      for (let j = 0; j <= 8; j++) {
        const u = -1 + (2 * j) / 8, v = -1 + (2 * i) / 6;
        const r = 0.82 + 0.18 * Math.max(Math.abs(u), Math.abs(v)) ** 6; // rounded corners
        row.push(P(u * (Math.abs(u) > 0.9 && Math.abs(v) > 0.9 ? 0.92 : 1), v * (Math.abs(u) > 0.9 && Math.abs(v) > 0.9 ? 0.92 : 1), off * r));
      }
      out.push(row);
    }
    return out;
  };
  const front = rows(0), back = rows(-depth);
  const pts = clipRings([...back, ...front], y0);
  if (pts.length > 3) {
    const h = hull(pts.map((q) => pr.p(q)));
    const d = smoothClosed(h);
    const face = clipRings(front, y0);
    const fh = face.length > 3 ? smoothClosed(hull(face.map((q) => pr.p(q)))) : '';
    const hot = clamp01(t * 0.8);
    const slot = (v: number, k: number) => {
      const a = P(-0.55, v, 0.3), b = P(0.55, v, 0.3);
      if (a[1] < y0 || b[1] < y0) return null;
      const pa = pr.p(a), pb = pr.p(b);
      return <line key={'v' + k} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#0B0F12" strokeWidth={Math.max(3, 2.6 * pa.s)} strokeLinecap="round" />;
    };
    const bolt = (u: number, v: number, k: number) => {
      const q = P(u, v, 0.3);
      if (q[1] < y0) return null;
      const pq = pr.p(q);
      return <circle key={'b' + k} cx={pq.x} cy={pq.y} r={Math.max(2, 1.3 * pq.s)} fill="#6B7783" stroke="#0A1115" strokeWidth={1.2} />;
    };
    items.push({
      z: pr.p(centre).z - 30, key: 'plate',
      el: (
        <g key="plate">
          <path d={d} fill="#1A1F24" stroke="#0A1115" strokeWidth={3} />
          {fh ? <path d={fh} fill="#3A434C" stroke="#0A1115" strokeWidth={2} /> : null}
          {fh ? <path d={fh} fill="#FF6A1A" fillOpacity={0.08 + 0.32 * hot} /> : null}
          {[0.45, 0.15, -0.15].map((v, k) => slot(v, k))}
          {[[-0.82, 0.8], [0.82, 0.8], [-0.82, -0.8], [0.82, -0.8]].map(([u, v], k) => bolt(u, v, k))}
          <path d={d} fill="none" stroke="#FFD27A" strokeWidth={2.5 + 4 * hot} strokeOpacity={0.3 + 0.5 * hot} />
        </g>
      ),
    });
  }
  for (let i = 0; i < 12; i++) {
    const tt = (t * 1.3 + rnd(i * 7) * 1.5) % 1.5;
    const a = rnd(i * 3) * Math.PI * 2, r = 12 + rnd(i * 5) * 40;
    const p: V3 = [centre[0] + Math.cos(a) * r, y0 + 0.5, centre[2] + Math.sin(a) * r];
    const q = pr.p(p);
    const rr = (2 + 5 * tt) * q.s;
    items.push({z: q.z - 2, key: 'bub' + i, el: <ellipse key={'bub' + i} cx={q.x} cy={q.y} rx={rr} ry={rr * 0.42} fill="none" stroke="#FFF4C2" strokeWidth={2} strokeOpacity={1 - tt / 1.5} />});
  }
  items.push(...smoke(pr, [centre[0], y0 + 5, centre[2]], t + 0.4, {seed: 43, n: 8, dark: 0.8, opacity: 0.35, size: 14, rise: 45, spread: 18}));
  return items;
};

// ---------------------------------------------------------------- the composition
export const HookFoundry: React.FC = () => {
  const f = useCurrentFrame();
  const tau = f / 30;
  const s1 = robot1(tau);
  const fastTrail = (s1.phase === 'air' && JUMP1.ramp!.rateAt(tau) > 0.55) || s1.phase === 'push';
  const trail = fastTrail ? [robot1(tau - 1 / 30).pose, robot1(tau - 2 / 30).pose] : undefined;
  const r1: SceneRobot = {pose: s1.pose, clipY: s1.clipY, id: 'r1', inside: s1.phase === 'plunge' || (s1.phase === 'air' && insideLadle(s1.pose.pos)), trail};
  const e1 = {at: JUMP1.p1, t: postEntry(tau), seed: 11};
  const hideR1 = s1.phase === 'plunge' && s1.t - s1.tIn > 1.4;

  if (tau < T_H2) return <FoundryScene cam={camH1(tau)} tau={tau} robots={[r1]} entries={[]} />;
  if (tau < T_H3) return <FoundryScene cam={camH2(tau)} tau={tau} robots={[r1]} entries={[]} />;
  if (tau < T_H4) return <FoundryScene cam={camH3(tau)} tau={tau} robots={[r1]} entries={[]} />;
  if (tau < T_H5) {
    const shake = e1.t >= 0 ? Math.exp(-e1.t * 5) : 0;
    const tr = e1.t < 0.15 ? [robot1(tau - 1 / 30).pose, robot1(tau - 2 / 30).pose] : undefined;
    return <FoundryScene cam={camH4(tau)} tau={tau} robots={hideR1 ? [] : [{...r1, trail: tr}]} entries={[e1]} shake={shake} />;
  }
  if (tau < T_H6) {
    if (tau < T_H5B) return <FoundryScene cam={camH5(tau)} tau={tau} robots={[]} entries={[e1]} flameScale={0} extra={(pr) => backPlate(pr, tau - T_H5)} />;
    return <FoundryScene cam={camH5B(tau)} tau={tau} robots={[]} entries={[e1]} flameScale={0.45} />;
  }
  const s2 = robot2(tau);
  const r2: SceneRobot = {pose: s2.pose, clipY: s2.clipY, id: 'r2', inside: s2.phase === 'plunge'};
  const e2t = s2.phase === 'plunge' ? tau - R2_IN : -1;
  const entries = [{...e1, seed: 11}, {at: JUMP2.p1, t: e2t, seed: 23}];
  if (tau < T_H7) {
    return (
      <AbsoluteFill>
        <FoundryScene cam={camH6(tau)} tau={tau} robots={[r2]} entries={entries} />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <Monitor tau={tau} pose={s2.pose} appear={tau - T_H6 - 0.15} />
        </svg>
        <Chip x={90} y={560} lines={['FIGURE · “F.02 DECOMMISSION” · SEP 30, 2026']} appear={tau - T_H6 - 0.25} size={30} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <FoundryScene cam={camH7(tau)} tau={tau} robots={s2.phase === 'plunge' && tau - R2_IN > 1.4 ? [] : [r2]} entries={entries} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <ControlWindow />
      </svg>
    </AbsoluteFill>
  );
};

export {T_IN, T_TO, T_H2, T_H3, T_H4, T_H5, T_H5B, T_H6, T_H7, R2_IN, R2_WALK0, JUMP2};
