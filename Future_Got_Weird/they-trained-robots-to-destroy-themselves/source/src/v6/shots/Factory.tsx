// V5 FACTORY (HOOK_END → "So what do you do"): the F.02 introduced at work, the line it fed, the F.03s, retirement.
//   cut   matched pose from the training avatar: same pose, same screen position and size, hands open in front
//   +0.0  the hands close on a door panel's top edge (grasp) → lift → hang it on the moving overhead line → release
//   12.2  "months loading parts": plant time speeds up (the windows cycle day/night, cycles blur past)
//   15.0  "newer F.03 fleet": follow a panel down the line to an F.03 that unloads it; more F.03s walk in
//   17.6  "keeping the old ones running": the F.02 is stopped for service, powered down, tipped onto a hand truck
//   19.9  a crate on a pallet jack crosses the foreground (wipe) and reveals the next scene
// Generic car-parts line; no real plant, logo or brand is shown.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Layer, Bot, Crew, Title, mixCam, seg, smooth, easeInOut, easeOut, easeIn, lerp, keys, crewReach} from '../../v4/kit/scene';
import {BayBack, BCOL} from '../../v4/sets/bay';
import {rig, RPose} from '../../v4/rig/Robot2D';
import {stand, blend, A, ANK} from '../../v4/rig/poses';
import {walkStop, leadFootX, STOP_DUR} from '../rig/stop';
import {HOOK_END, HOOK_LAST, S_HK} from './Hook';
import {Panel, PANEL, HookLine, Tote, PL, Dolly, Sparks} from '../sets/plant';
import {MonthBoard} from '../../v4/sets/props';
import {smoothCam, camPutting, creep} from '../kit/cam5';
import {reachArms, palms} from '../rig/arms';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C} from '../../theme';

const G = PL.floor;
export const FACTORY_END = T('So what do you') - 0.12;
const T_MONTHS = T('months') - 0.4;
const T_NEWER = T('But as its newer') - 0.05;
const T_FLEET = T('fleet grew') - 0.2;
const T_KEEP = T('keeping the old') - 0.1;
const T_STOP = T('stopped making') - 0.05;
const T_WIPE = FACTORY_END - 0.5;

// ------------------------------------------------------------------ the matched pose, rescaled into the plant
const K = 1 / S_HK;
const scalePose = (p: RPose, ax: number, ay: number, bx: number, by: number, k: number): RPose => {
  const P = (q?: {x: number; y: number; pitch?: number}) => (q ? {...q, x: bx + (q.x - ax) * k, y: by + (q.y - ay) * k} : undefined);
  return {...p, x: bx + (p.x - ax) * k, y: by + (p.y - ay) * k, footN: P(p.footN), footF: P(p.footF), handN: P(p.handN), handF: P(p.handF)};
};
const P0 = scalePose(HOOK_LAST.pose, HOOK_LAST.pose.x, 800, 0, G, K);
const R0 = rig(P0, 1);
const PALM_OFF = {x: R0.pts.handN[0] - R0.pts.wrN[0], y: R0.pts.handN[1] - R0.pts.wrN[1]};
/** Grip point at the cut: the near palm. The panel's top edge sits just under it. */
const G0 = {x: R0.pts.handN[0], y: R0.pts.handN[1]};
const TOTE_X = G0.x + 6;
const PANEL_IN_TOTE = {x: TOTE_X, y: G0.y + 6 + PANEL.h / 2};
const TOTE_TOP = PANEL_IN_TOTE.y + 14;
const HOOK_X = G0.x + 22;
const HOOK_Y = G0.y - 92;
/** Hanging panel centre for a hook tip at x. */
const hangAt = (hx: number) => ({x: hx, y: HOOK_Y + PANEL.tab - 8 + PANEL.h / 2});
const GRIP_ON_HOOK = {x: 0, y: HOOK_Y + PANEL.tab - 8 - 6}; // grip (palm) relative to a hook tip

// ------------------------------------------------------------------ plant time and the line
const HSP = 330, V = 140, PER = HSP / V; // hook spacing, line speed (u/s), cycle period (s)
/** Plant time: real time, sped up ×3 for "months" and the follow down the line. */
const TL = [T_MONTHS, T_MONTHS + 0.45, T_NEWER + 1.05, T_NEWER + 1.5];
const rateAt = (t: number) => (t < TL[0] ? 1 : t < TL[1] ? lerp(1, 3, smooth(seg(t, TL[0], TL[1]))) : t < TL[2] ? 3 : t < TL[3] ? lerp(3, 1, smooth(seg(t, TL[2], TL[3]))) : 1);
const tauOf = (() => {
  const N = 1200, t0 = HOOK_END - 1, t1 = FACTORY_END + 1;
  const cum: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const a = t0 + ((t1 - t0) * (i - 1)) / N, b = t0 + ((t1 - t0) * i) / N;
    cum.push(cum[i - 1] + ((rateAt(a) + rateAt(b)) / 2) * (b - a));
  }
  return (t: number) => {
    const x = Math.max(0, Math.min(N, ((t - t0) / (t1 - t0)) * N));
    const i = Math.floor(x);
    return t0 + cum[i] + (cum[Math.min(N, i + 1)] - cum[i]) * (x - i);
  };
})();
// F.02 load cycle k engages hook k at plant time TK(k); cycle 0's grasp (φ = 0.22) is the cut
const PH = {reach: 0.22, grip: 0.3, lift: 0.58, over: 0.66, hang: 0.72, rel: 0.8};
const C0 = tauOf(HOOK_END) - PH.reach * PER;
const TK = (k: number) => C0 + PH.hang * PER + k * PER;
const hookX = (k: number, tau: number) => HOOK_X + V * (tau - TK(k));
/** Station of the first F.03. V6: it sits two and a half hooks downstream, so it works half a cycle out of phase with
 * the F.02 (one places while the other reaches) instead of mirroring the same keyframes. */
const LAG = 2.5;
const X3 = HOOK_X + LAG * HSP + 40;

// ------------------------------------------------------------------ F.02 load cycle
const REST = stand(0, G, 1, {yaw: 0.5, armN: A(4, 14, {grip: 0.3}), armF: A(-4, 16, {grip: 0.3})});
const feet = {footN: P0.footN, footF: P0.footF};
const BODY_REST: RPose = {...REST, ...feet, x: 0};
const BODY_REACH: RPose = {...BODY_REST, y: BODY_REST.y + 14, rot: 6, waist: 12, neck: 8, head: 10};
const BODY_LIFT: RPose = {...BODY_REST, y: BODY_REST.y - 4, rot: -2, waist: 0, neck: -6, head: -8};

type Held = {pose: RPose; panel: {x: number; y: number} | null; grip: number; k: number; ph: number};
const panelFromPalm = (pm: {x: number; y: number}) => ({x: pm.x, y: pm.y + 6 + PANEL.h / 2});
/** Where a panel waits in the tote for cycles ≥ 1: exactly under the palm the reaching pose arrives at. */
const PANEL_IN_TOTE_K = (() => {
  const wt = {x: G0.x - PALM_OFF.x, y: G0.y - PALM_OFF.y};
  const p = reachArms({...BODY_REACH, ...feet}, 1, 1, wt, {x: wt.x - 10, y: wt.y + 8}, 1);
  return panelFromPalm(palms(p, 1, 1).N);
})();
/** F.02 pose for plant time tau. Cycle 0 starts from the matched pose (FK arms), blending into the grasp. */
const f02At = (tau: number): Held => {
  const k = Math.floor((tau - C0) / PER);
  const ph = (tau - C0) / PER - k;
  let body: RPose;
  if (k === 0 && ph < PH.lift) body = blend(P0, BODY_LIFT, smooth(seg(ph, PH.grip, PH.lift)));
  else if (ph < PH.reach) body = blend(BODY_REST, BODY_REACH, smooth(seg(ph, 0.02, PH.reach)));
  else if (ph < PH.lift) body = blend(BODY_REACH, BODY_LIFT, smooth(seg(ph, PH.grip, PH.lift)));
  else body = blend(BODY_LIFT, BODY_REST, smooth(seg(ph, PH.rel, 1)));
  body = {...body, ...feet};
  const hk = hookX(k, tau);
  const onHook = {x: hk + GRIP_ON_HOOK.x, y: GRIP_ON_HOOK.y};
  const g0 = k === 0 ? G0 : {x: PANEL_IN_TOTE_K.x, y: PANEL_IN_TOTE_K.y - 6 - PANEL.h / 2};
  let grip: {x: number; y: number};
  if (ph < PH.grip) grip = g0;
  else if (ph < PH.lift) {
    const a = {x: hk - 12, y: GRIP_ON_HOOK.y + 46};
    const u = smooth(seg(ph, PH.grip, PH.lift));
    grip = {x: lerp(g0.x, a.x, u), y: lerp(g0.y, a.y, u) - Math.sin(Math.PI * u) * 24};
  } else if (ph < PH.over) {
    const u = smooth(seg(ph, PH.lift, PH.over));
    grip = {x: lerp(hk - 12, onHook.x, u), y: lerp(GRIP_ON_HOOK.y + 46, onHook.y - 16, u)};
  } else if (ph < PH.hang) grip = {x: onHook.x, y: lerp(onHook.y - 16, onHook.y, smooth(seg(ph, PH.over, PH.hang)))};
  else {
    const u = smooth(seg(ph, PH.hang, PH.rel));
    grip = {x: onHook.x - 30 * u, y: onHook.y + 20 * u};
  }
  const w = k === 0 && ph < PH.grip ? smooth(seg(ph, PH.reach, PH.grip)) : ph < PH.reach ? smooth(seg(ph, 0.02, PH.reach)) : ph < PH.rel ? 1 : 1 - smooth(seg(ph, PH.rel, 0.97));
  const gripK = ph < PH.reach ? 0.12 : ph < PH.grip ? lerp(0.12, 0.88, smooth(seg(ph, PH.reach, PH.grip))) : ph < PH.hang ? 0.88 : lerp(0.88, 0.12, smooth(seg(ph, PH.hang, PH.rel)));
  const wN = {x: grip.x - PALM_OFF.x, y: grip.y - PALM_OFF.y};
  const pose = reachArms({...body, armN: {...body.armN, grip: gripK}, armF: {...body.armF, grip: gripK}}, 1, 1, wN, {x: wN.x - 10, y: wN.y + 8}, w);
  let panel: {x: number; y: number} | null = null;
  if (ph < PH.reach) panel = k === 0 ? panelFromPalm(G0) : PANEL_IN_TOTE_K;
  else if (ph < PH.hang + 0.05) {
    const fromPalm = panelFromPalm(palms(pose, 1, 1).N);
    const onH = hangAt(hk);
    const u = smooth(seg(ph, PH.hang - 0.02, PH.hang + 0.05));
    panel = {x: lerp(fromPalm.x, onH.x, u), y: lerp(fromPalm.y, onH.y, u)};
  }
  return {pose, panel, grip: gripK, k, ph};
};

// ------------------------------------------------------------------ F.03 unload cycle (station X3, faces left)
const F3G = G;
const F3_REST = stand(X3 + 120, F3G, 1, {yaw: 0.5, armN: A(4, 14, {grip: 0.3}), armF: A(-4, 16, {grip: 0.3})}, -1);
const F3_REACH: RPose = {...F3_REST, rot: -2, waist: 0, neck: -6, head: -8};
const F3_BEND: RPose = {...F3_REST, y: F3_REST.y + 26, rot: 12, waist: 20, neck: 10, head: 12};
const JIG_X = X3 + 10, JIG_TOP = 790;
const JIG_PANEL_Y = JIG_TOP - PANEL.h - 4 + 6 + PANEL.h / 2;
/** The F.03 unloads hook k when it reaches X3. Returns pose and the panel it carries (or null). */
const f03At = (tau: number) => {
  // hook k is at X3 - 40 at plant time TK(k) + 2·PER; the unload cycle is centred on it
  const kf = (tau - (TK(0) + LAG * PER) + 0.3 * PER) / PER;
  const k = Math.floor(kf), ph = kf - k;
  const hk = hookX(k, tau);
  const top = {x: hk, y: GRIP_ON_HOOK.y};
  const jig = {x: JIG_X, y: JIG_PANEL_Y - 6 - PANEL.h / 2};
  let grip = top;
  if (ph >= 0.3 && ph < 0.42) grip = {x: hk, y: GRIP_ON_HOOK.y - 26 * smooth(seg(ph, 0.3, 0.42))};
  else if (ph >= 0.42 && ph < 0.8) {
    const u = smooth(seg(ph, 0.42, 0.8));
    const a = {x: hookX(k, TK(k) + LAG * PER + 0.12 * PER), y: GRIP_ON_HOOK.y - 26};
    grip = {x: lerp(a.x, jig.x, u), y: lerp(a.y, jig.y, u) - Math.sin(Math.PI * u) * 30};
  } else if (ph >= 0.8) grip = {x: jig.x + 24 * smooth(seg(ph, 0.8, 0.88)), y: jig.y + 16 * smooth(seg(ph, 0.8, 0.88))};
  const body = ph < 0.42 ? blend(F3_REST, F3_REACH, smooth(seg(ph, 0.05, 0.28))) : ph < 0.8 ? blend(F3_REACH, F3_BEND, smooth(seg(ph, 0.5, 0.8))) : blend(F3_BEND, F3_REST, smooth(seg(ph, 0.86, 1)));
  const w = ph < 0.3 ? smooth(seg(ph, 0.05, 0.28)) : ph < 0.86 ? 1 : 1 - smooth(seg(ph, 0.86, 0.99));
  const gK = ph < 0.22 ? 0.12 : ph < 0.32 ? lerp(0.12, 0.88, seg(ph, 0.22, 0.32)) : ph < 0.8 ? 0.88 : lerp(0.88, 0.12, seg(ph, 0.8, 0.88));
  const wN = {x: grip.x + PALM_OFF.x, y: grip.y - PALM_OFF.y};
  const pose = reachArms({...body, armN: {...body.armN, grip: gK}, armF: {...body.armF, grip: gK}}, 1, -1, wN, {x: wN.x + 10, y: wN.y + 8}, w);
  let panel: {x: number; y: number} | null = null;
  if (ph >= 0.3 && ph < 0.84) {
    const fromPalm = panelFromPalm(palms(pose, 1, -1).N);
    const onH = hangAt(hk);
    const toJig = {x: JIG_X, y: JIG_PANEL_Y};
    const u0 = smooth(seg(ph, 0.3, 0.36)), u1 = smooth(seg(ph, 0.76, 0.84));
    panel = {x: lerp(lerp(onH.x, fromPalm.x, u0), toJig.x, u1), y: lerp(lerp(onH.y, fromPalm.y, u0), toJig.y, u1)};
  }
  return {pose, k, ph, panel, placed: ph >= 0.84};
};

// ------------------------------------------------------------------ the fleet (V6)
// Two F.03s are already at their stations (the camera move establishes them); each makes one placing motion, at
// different moments (no loops). A third walks in from beyond the right edge of the frame: the fleet grows.
const FLEET = [0, 1, 2].map((j) => ({x: X3 + 640 + j * 520, tIn: j < 2 ? T_NEWER + 0.6 + 0.55 * j : T_FLEET - 0.65}));
const FLEET_N = 5, FLEET_SW = 130;
const fleetWalk = (j: number) => {
  const f = FLEET[j];
  const lead = f.x - 20, trail = lead + 24;
  const x0 = lead + (FLEET_N + 0.25) * FLEET_SW;
  const feet = {footN: {x: lead, y: G - ANK, pitch: 0}, footF: {x: trail, y: G - ANK, pitch: 0}};
  const ready = stand(lead + 12, G, 1, {yaw: 0.55, armN: A(4, 14, {grip: 0.3}), armF: A(-4, 16, {grip: 0.3}), ...feet}, -1);
  return {x0, ground: G, s: 1, n: FLEET_N, stride: FLEET_SW, face: -1 as const, o: {yaw: 0.6}, t0: f.tIn, t1: f.tIn + 1.75, ready, lead, feet};
};
const fleetPose = (j: number, t: number): RPose => {
  const w = fleetWalk(j), f = FLEET[j];
  if (j === 2 && t < w.t1 + STOP_DUR) return walkStop(w, t);
  // one reach-and-place motion (or, for the new arrival, one look down the line), never repeated
  const t0 = j === 2 ? w.t1 + STOP_DUR + 0.1 : f.tIn;
  const u = seg(t, t0, t0 + 1.5);
  const k = Math.sin(Math.PI * smooth(u));
  return stand(w.lead + 12, G, 1, {yaw: 0.55, rot: 8 * k, waist: 16 * k, neck: 6 * k, head: 8 * k,
    armN: A(4 + 54 * k, 14 + 26 * k, {grip: 0.3 + 0.4 * k}), armF: A(-4 + 44 * k, 16 + 28 * k, {grip: 0.3 + 0.4 * k}), ...w.feet}, -1);
};

// ------------------------------------------------------------------ cameras
const camAtCut: Cam = (() => {
  const sc = {x: 960 + (HOOK_LAST.pose.x - HOOK_LAST.cam.x) * HOOK_LAST.cam.z, y: 540 + (HOOK_LAST.pose.y - HOOK_LAST.cam.y) * HOOK_LAST.cam.z};
  return camPutting(P0.x, P0.y, sc.x, sc.y, HOOK_LAST.cam.z * S_HK);
})();
const CAM_HANDS: Cam = {x: 120, y: 560, z: 1.85};     // head, hands, tote and hook: the whole grasp → hang → release
const CAM_LINE2: Cam = {x: 560, y: 590, z: 1.12};     // both stations: the F.02 loading, the F.03 unloading
const CAM_FLEET: Cam = {x: 1650, y: 590, z: 0.66};
const T_WIDE0 = TK(0) + 0.35, T_WIDE1 = T_WIDE0 + 1.9;   // widen once the first panel has been released on its hook
const camRaw = (t: number): Cam => {
  let c = mixCam(camAtCut, CAM_HANDS, easeInOut(seg(t, HOOK_END + 0.15, HOOK_END + 0.75)));
  c = mixCam(c, CAM_LINE2, easeInOut(seg(t, T_WIDE0, T_WIDE1)));
  c = creep(c, t, T_WIDE1, T_NEWER - 0.1, 0.03, 30);
  c = mixCam(c, CAM_FLEET, easeInOut(seg(t, T_NEWER + 0.2, T_KEEP - 0.15)));
  return c;
};
const camLine = (t: number) => (t < HOOK_END + 0.35 ? camRaw(t) : smoothCam(camRaw, t, 0.3));

// ------------------------------------------------------------------ service / power-down shot (after T_KEEP)
const SV_CAM: Cam = {x: 40, y: 640, z: 1.22};
const DOLLY_X = 30;

export const Factory: React.FC = () => {
  const f = useCurrentFrame() + Math.round(HOOK_END * 30);
  const t = f / 30;
  const tau = tauOf(t);
  // V6 time-lapse: the daylight cycles through the windows (their colour is the source) and the whole frame dims and
  // brightens evenly with it — no partial overlays. A month board on a column flips through the months.
  const dayPh = ((tau - tauOf(T_MONTHS)) / 2.4) * Math.PI * 2;
  const night = t < T_MONTHS ? 0 : 0.5 - 0.5 * Math.cos(Math.max(0, dayPh));
  const nightK = night * (1 - seg(t, TL[2], TL[3]));
  const month = 2 + Math.max(0, tauOf(t) - tauOf(T_MONTHS)) / 2.4;
  const boardK = smooth(seg(t, T_MONTHS - 0.4, T_MONTHS)) * (1 - smooth(seg(t, T_NEWER + 0.3, T_NEWER + 0.8)));

  if (t >= T_KEEP) return <Service t={t} f={f} />;

  const cam = camLine(t);
  const lw = 4 / cam.z;
  const me = f02At(tau);
  const f3 = f03At(tau);
  // hooks: which carry a panel (loaded by the F.02 at TK(k), unloaded by the F.03 around its station)
  const kMin = Math.floor((tau - TK(0)) / PER) - 14, kMax = kMin + 22;
  const hooks: number[] = [];
  const hanging: React.ReactNode[] = [];
  for (let k = kMin; k <= kMax; k++) {
    const hx = hookX(k, tau);
    hooks.push(hx);
    const loaded = k < 0 || k < me.k || (k === me.k && me.ph >= PH.hang + 0.05);
    const unloaded = k < f3.k || (k === f3.k && f3.ph >= 0.3);
    if (loaded && !unloaded) hanging.push(<Panel key={'hp' + k} x={hangAt(hx).x} y={hangAt(hx).y} lw={lw} />);
  }
  const fleetVisible = t > T_NEWER - 0.2;
  return (
    <Scene bg={BCOL.wall}
      over={(
        <>
          {(() => {
            const k = seg(t, T_WIDE0 + 0.4, T_WIDE0 + 0.85) * (1 - seg(t, T_MONTHS - 0.25, T_MONTHS + 0.1));
            return k > 0 ? <div style={{position: 'absolute', left: 84, top: 44, width: 800, height: 196, borderRadius: 18, background: C.paper, opacity: 0.94 * Math.min(1, k * 2), boxShadow: '0 6px 0 rgba(0,0,0,0.12)'}} /> : null;
          })()}
          <Title x={110} y={60} big="F.02" small="Figure's second-generation humanoid" k={seg(t, T_WIDE0 + 0.4, T_WIDE0 + 0.85) * (1 - seg(t, T_MONTHS - 0.25, T_MONTHS + 0.1))} />
          <Title x={1330} y={70} big="F.03" small="newer model" k={seg(t, T_NEWER + 1.2, T_NEWER + 1.6) * (1 - seg(t, T_KEEP - 0.5, T_KEEP - 0.15))} accent={C.teal} />
        </>
      )}>
      <Layer cam={cam}>
        <BayBack lw={lw} />
        {nightK > 0.01 ? Array.from({length: 12}, (_, i) => <rect key={'nw' + i} x={-2600 + i * 560} y={-80} width={360} height={560} rx={8} fill="#2B3A66" opacity={0.85 * nightK} />) : null}
        {boardK > 0.01 ? <g opacity={boardK}><MonthBoard x={600} y={770} lw={lw} m={month} w={190} h={220} /></g> : null}
        {/* far: the fleet's jigs and robots */}
        {fleetVisible ? FLEET.map((fl, j) => (
          <g key={'fl' + j}>
            <g>
              <rect x={fl.x - 230} y={G - 20} width={150} height={20} rx={6} fill={BCOL.frameD} stroke={BCOL.ink} strokeWidth={lw} />
              <Panel x={fl.x - 155} y={G - 20 - PANEL.h / 2 - 50} lw={lw} />
              <rect x={fl.x - 220} y={G - 90} width={130} height={70} fill={BCOL.frame} stroke={BCOL.ink} strokeWidth={lw} />
            </g>
            {j < 2 || t > fl.tIn ? <Bot cam={cam} id={'fl3' + j} model="F03" s={1} face={-1} pose={fleetPose(j, t)} /> : null}
          </g>
        )) : null}
        <HookLine x0={-1400} x1={6000} lw={lw} hooks={hooks} hookY={HOOK_Y} />
        {hanging}
        {/* the F.03 station: jig + robot */}
        <rect x={JIG_X - 70} y={G - 24} width={140} height={24} rx={6} fill={BCOL.frameD} stroke={BCOL.ink} strokeWidth={lw} />
        {f3.k > -6 ? <Panel x={JIG_X} y={JIG_PANEL_Y} lw={lw} /> : null}
        <rect x={JIG_X - 60} y={JIG_TOP} width={120} height={G - 24 - JIG_TOP} fill={BCOL.frame} stroke={BCOL.ink} strokeWidth={lw} />
        <Bot cam={cam} id="f03a" model="F03" s={1} face={-1} pose={f3.pose} after={f3.panel ? {legN: () => <Panel x={f3.panel!.x} y={f3.panel!.y} lw={lw} />} : {}} />
        {/* the F.02 station */}
        <Tote x={TOTE_X} top={TOTE_TOP} lw={lw} />
        <Panel x={PANEL_IN_TOTE.x - 22} y={PANEL_IN_TOTE.y + 4} lw={lw} tone={1} />
        {me.ph < PH.reach && me.panel ? <Panel x={me.panel.x} y={me.panel.y} lw={lw} /> : null}
        {me.ph >= 0.84 ? <Panel x={PANEL_IN_TOTE_K.x} y={PANEL_IN_TOTE_K.y + 90 * (1 - smooth(seg(me.ph, 0.84, 1)))} lw={lw} /> : null}
        <Bot cam={cam} id="f02w" model="F02" s={1} pose={me.pose} after={me.ph >= PH.reach && me.panel ? {legN: () => <Panel x={me.panel!.x} y={me.panel!.y} lw={lw} />} : {}} />
        <Tote x={TOTE_X} top={TOTE_TOP} lw={lw} front />
      </Layer>
      {nightK > 0.01 ? <rect width={1920} height={1080} fill="#1E2A4A" opacity={0.3 * nightK} /> : null}
    </Scene>
  );
};

/** Service shot: the F.02 stopped, a technician at its forearm, then power-down and onto a hand truck.
 * V6: the wrench is a world prop with one owner at a time — on the bolt in an opened forearm hatch (hand on the handle,
 * three short ratchet strokes), then back on the technician's belt; only then does the hand press the power button.
 * Depth order is fixed: robot → hatch/component → wrench → technician's hand. */
const Service: React.FC<{t: number; f: number}> = ({t, f}) => {
  const cam = smoothCam((tt) => mixCam(SV_CAM, {...SV_CAM, x: SV_CAM.x - 60, z: SV_CAM.z * 1.04}, seg(tt, T_KEEP, FACTORY_END)), t, 0.2);
  const lw = 4 / cam.z;
  const offK = smooth(seg(t, T_STOP + 0.25, T_STOP + 0.8));
  const sag = smooth(seg(t, T_STOP + 0.45, T_STOP + 1.0));
  const tip = smooth(seg(t, T_STOP + 1.05, T_WIPE + 0.1));
  const base = stand(0, G, 1, {yaw: 0.45, armN: A(lerp(30, 4, sag), lerp(70, 12, sag), {grip: 0.3}), armF: A(-6, 16), neck: 10 * sag, head: 16 * sag, waist: 4 * sag});
  const pivot = {x: DOLLY_X + 40, y: G - 30};
  const ang = -14 * tip;
  const tech = {x: -330, y: G, h: 560, flip: false};
  const R = rig(base, 1).pts;
  const fa = Math.atan2(R.wrN[1] - R.elN[1], R.wrN[0] - R.elN[0]);
  const bolt = {x: R.elN[0] + 0.32 * (R.wrN[0] - R.elN[0]), y: R.elN[1] + 0.32 * (R.wrN[1] - R.elN[1])};
  const hatchK = smooth(seg(t, T_KEEP - 0.2, T_KEEP + 0.1)) * (1 - smooth(seg(t, T_STOP - 0.3, T_STOP - 0.05)));
  // wrench work: three strokes about the bolt, then to the belt
  const W0 = T_KEEP + 0.12, W1 = T_STOP - 0.38, H1 = T_STOP - 0.08;
  const LW = 112;
  const th0 = (205 * Math.PI) / 180;
  const stroke = t < W1 ? Math.sin(Math.PI * 3 * seg(t, W0, W1)) * 0.26 : 0;
  const th = th0 + stroke;
  const onBolt = {x: bolt.x + LW * Math.cos(th), y: bolt.y + LW * Math.sin(th)};
  const belt = {x: tech.x + 52, y: G - 0.47 * tech.h};
  const toBelt = smooth(seg(t, W1, H1));
  const button = {x: R.shF[0] - 40, y: R.shF[1] + 40};
  const handle = {x: DOLLY_X - 60, y: G - 560};
  let hand = t < W1 ? onBolt : {x: lerp(onBolt.x, belt.x + 4, toBelt), y: lerp(onBolt.y, belt.y - 46, toBelt)};
  if (t > H1) hand = {x: lerp(belt.x + 4, button.x, smooth(seg(t, H1, T_STOP + 0.22))), y: lerp(belt.y - 46, button.y, smooth(seg(t, H1, T_STOP + 0.22)))};
  if (t > T_STOP + 0.9) hand = {x: lerp(button.x, handle.x, smooth(seg(t, T_STOP + 0.9, T_STOP + 1.3))), y: lerp(button.y, handle.y, smooth(seg(t, T_STOP + 0.9, T_STOP + 1.3)))};
  const armR = crewReach(tech, 1, hand.x, hand.y);
  // the wrench: jaw on the bolt while working; carried by the hand to the belt; then hanging on the belt
  const wr = t < W1 ? {jaw: bolt, end: onBolt, rot: th} : t < H1 ? {jaw: {x: hand.x - LW * Math.cos(lerp(th0, -Math.PI / 2, toBelt)), y: hand.y - LW * Math.sin(lerp(th0, -Math.PI / 2, toBelt))}, end: hand, rot: lerp(th0, -Math.PI / 2, toBelt)} : {jaw: {x: belt.x + 4, y: belt.y + 66}, end: {x: belt.x + 4, y: belt.y - 46}, rot: -Math.PI / 2};
  const sparkK = (1 - seg(t, W1 - 0.2, W1)) * seg(t, W0, W0 + 0.15);
  const hooks = Array.from({length: 12}, (_, i) => -900 + i * HSP + ((t * V) % HSP));
  const jawRot = (Math.atan2(wr.end.y - wr.jaw.y, wr.end.x - wr.jaw.x) * 180) / Math.PI;
  const wrench = (
    <g>
      <line x1={wr.jaw.x} y1={wr.jaw.y} x2={wr.end.x} y2={wr.end.y} stroke="#162A32" strokeWidth={lw * 5.2} strokeLinecap="round" />
      <line x1={wr.jaw.x} y1={wr.jaw.y} x2={wr.end.x} y2={wr.end.y} stroke="#9AA4AE" strokeWidth={lw * 3.2} strokeLinecap="round" />
      <g transform={`translate(${wr.jaw.x} ${wr.jaw.y}) rotate(${jawRot})`}>
        <path d="M6 -14 A15 15 0 1 0 6 14 L-2 6 L-2 -6 Z" fill="#9AA4AE" stroke="#162A32" strokeWidth={lw} strokeLinejoin="round" />
      </g>
      {t >= H1 ? <rect x={belt.x - 8} y={belt.y - 54} width={24} height={20} rx={4} fill="#4A3A2C" stroke="#162A32" strokeWidth={lw * 0.8} /> : null}
    </g>
  );
  return (
    <Scene bg={BCOL.wall}>
      <Layer cam={cam}>
        <BayBack lw={lw} />
        <HookLine x0={-1400} x1={3000} lw={lw} hooks={hooks} hookY={HOOK_Y} />
        <Tote x={TOTE_X} top={TOTE_TOP} lw={lw} />
        <Panel x={PANEL_IN_TOTE.x} y={PANEL_IN_TOTE.y} lw={lw} />
        <Tote x={TOTE_X} top={TOTE_TOP} lw={lw} front />
        <Dolly x={DOLLY_X + lerp(-60, 0, smooth(seg(t, T_STOP + 0.6, T_STOP + 1.0)))} lw={lw} tilt={14 * tip} />
        <g transform={`rotate(${ang} ${pivot.x} ${pivot.y})`}>
          <Bot cam={cam} id="svf02" model="F02" s={1} pose={base} off={offK} />
          {hatchK > 0.01 ? (
            <g transform={`translate(${bolt.x} ${bolt.y}) rotate(${(fa * 180) / Math.PI})`} opacity={Math.min(1, hatchK * 2)}>
              <rect x={-22} y={-11} width={44} height={22} rx={5} fill="#1A1F24" stroke={C.ink} strokeWidth={lw * 0.8} />
              <circle r={7} fill="#9AA4AE" stroke={C.ink} strokeWidth={lw * 0.6} />
              <rect x={-24} y={-11 - 16 * hatchK} width={48} height={8} rx={3} fill="#2B2E35" stroke={C.ink} strokeWidth={lw * 0.6} />
            </g>
          ) : null}
        </g>
        <Sparks x={bolt.x} y={bolt.y} t={t} k={sparkK} lw={lw} />
        {t < H1 ? wrench : null}
        <Crew look={CAST.clerkA} x={tech.x} y={tech.y} h={tech.h} frame={f} seed={4} life={0.4}
          pose={{...IDLE, armR, armL: {a: 14, b: 20}, lookX: 0.7, lookY: t < T_STOP ? 0.1 : -0.2, mouth: t < T_STOP ? 'flat' : 'hmm', brows: t < T_STOP ? -0.2 : 0.3}} />
        {t >= H1 ? wrench : null}
      </Layer>
      <CrateWipe t={t} />
    </Scene>
  );
};

/** A crate on a pallet jack crosses the foreground right → left; fully covers the frame at its middle. */
export const T_CRATE_WIPE = T_WIPE;
export const CrateWipe: React.FC<{t: number}> = ({t}) => {
  const u = seg(t, T_WIPE, T_WIPE + 1.0); // crosses in 1.0 s; covered at u = 0.5 (the cut)
  if (u <= 0 || u >= 1) return null;
  const x = lerp(2300, -2760, easeInOut(u)); // left edge of a 2600-px-wide crate face; it fully leaves the frame at u = 1
  const W = 2600;
  return (
    <g>
      <rect x={x} y={-60} width={W} height={1200} fill="#D9A35E" stroke="#162A32" strokeWidth={14} />
      {Array.from({length: 9}, (_, i) => <line key={i} x1={x + (W * (i + 1)) / 10} y1={-60} x2={x + (W * (i + 1)) / 10} y2={1140} stroke="#8A5A26" strokeWidth={8} />)}
      <rect x={x} y={420} width={W} height={90} fill="#B57D3C" stroke="#162A32" strokeWidth={10} />
      <rect x={x + 60} y={40} width={W - 120} height={30} fill="#EDC48A" opacity={0.6} />
    </g>
  );
};
void easeIn; void keys;
/** Event times for the sound cue sheet (TK is in plant time; tauOf maps real → plant time). */
export const FACTORY_EV = {TK, tauOf, PER, FLEET, T_MONTHS, T_NEWER, T_FLEET, T_KEEP, T_STOP, T_WIPE};

export const FACTORY_WALK = {fleetPose, fleetWalk};
export const FACTORY_GEOM = {G0, HOOK_X, HOOK_Y, TOTE_X, TOTE_TOP, X3, P0x: P0.x, P0y: P0.y, camAtCut, PER, C0, TK0: TK(0)};
