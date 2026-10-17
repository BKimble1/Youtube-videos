// B6 — THE ASSEMBLY (cut on M.ASSEMBLY). Raised stone terrace, three-quarter back views facing east (screen right,
// into depth): builder · carrier with the teammate · DIRECTOR · friend; three civilians behind. To the right the view
// opens: the avenue below full of coordinated machines (rows of wardens, haulers, a drone formation), and beyond it
// the elevated highway with its broken span and gantry, and the bright refuge with its teal aid symbol. Near-locked
// frame with a slow creep in. Physical beats on the hits (no camera pulses): HIT_AS2 the friend turns to the
// Director; HIT_AS3 the carrier hitches the teammate up and tightens his hold. Late: the Director glances back over
// the shoulder at the group, then on MARCH faces front and lifts a hand — ready. Ends with everyone in the slots.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg, CIV, visorOn} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, mixCam} from '../../kit/cam';
import {clamp, lerp, noise, smooth} from '../../kit/math';
import {CITY} from '../../theme';
import {ASSEMBLY, ASSEMBLY_CAM} from './assembly';
import {BurningSky, District, DroneFormation, Place, SmokeBank, ease, inkAt, ink as inkL} from './kit';
import {SkylineFar, Street, TerraceBack, TerraceFront, TERRACE_TOP, Flames} from '../../sets/city';
import {Warden, Hauler, AutoCar} from '../../mech';
import {Embers} from '../../fx/fire';
import {Smoke} from '../../fx/smoke';
import {ToolBag, handOf} from './props';
import {at, Cue} from '../../film/cue';

const START = M.ASSEMBLY;
const DUR = 47.0 - START;
const CAM0: Cam = {x: ASSEMBLY_CAM.x - 40, y: ASSEMBLY_CAM.y - 20, z: ASSEMBLY_CAM.z * 0.955};

/** world ground point for a slot under the final camera */
const W = (sx: number, sy: number) => ({x: ASSEMBLY_CAM.x + (sx - 960) / ASSEMBLY_CAM.z, y: ASSEMBLY_CAM.y + (sy - 540) / ASSEMBLY_CAM.z});
const slot = (role: string) => ASSEMBLY.slots.find((q) => q.role === role)!;

export const B6: React.FC = () => {
  const {t, T} = useShot('B6');
  const cam = mixCam(CAM0, ASSEMBLY_CAM, smooth(clamp(t / DUR)) * 0.85 + clamp(t / DUR) * 0.15);
  const k1 = cam.z;
  const ik = inkL(cam, 1, 1);
  const h2 = M.HIT_AS2 - START, h3 = M.HIT_AS3 - START, march = M.MARCH - START;

  // ---------------------------------------------------------------- the group
  const sB = slot('builder'), sC = slot('carrier'), sT = slot('teammate'), sD = slot('director'), sF = slot('friend');
  const wb = W(sB.x, sB.y), wc = W(sC.x, sC.y), wt = W(sT.x, sT.y), wd = W(sD.x, sD.y), wf = W(sF.x, sF.y);
  const sc = (q: {s: number}) => q.s / ASSEMBLY_CAM.z;
  const br = (seed: number, a = 1) => noise(t * 0.55, seed) * a;

  // Director: stands slightly forward; glances back at the group ~4.6–6.2, faces front and lifts the right hand on MARCH
  const back = ease(t, 4.5, 5.2) * (1 - ease(t, 6.0, 6.7));
  const ready = ease(t, march - 0.25, march + 0.35);
  const dirP: ActorProps = {
    look: look('director'), t: T, seed: 4, x: wd.x, y: wd.y, s: sc(sD), z: sD.z, yaw: sD.yaw + br(4, 2), dmg: dmg('director', T),
    head: {yaw: lerp(0, -62, back) + br(41, 3), pitch: lerp(4, -2, back) + ready * -3},
    lean: 2 + ready * 3, breath: 0.5,
    face: {mouth: back > 0.4 ? 'flat' : 'grit', brows: -0.35, lids: 0.15, lookX: -0.3 * back},
    legL: {foot: {x: wd.x - 52 * sc(sD), y: wd.y - 10 * sc(sD), z: -10}},
    legR: {foot: {x: wd.x + 40 * sc(sD) + ready * 26 * sc(sD), y: wd.y - 10 * sc(sD) - Math.sin(Math.PI * clamp((t - march + 0.2) / 0.5)) * 14 * sc(sD), z: 14}},
    armL: {fk: {fwd: 6, out: 10, bend: 18}},
    armR: {fk: {fwd: lerp(6, 28, ready), out: lerp(10, 34, ready), bend: lerp(18, 118, ready)}}, handR: ready > 0.6 ? 'open' : 'mitt',
  };
  // Friend: turns to look at the Director on HIT_AS2, a small nod back; visor on
  const look2 = ease(t, h2 - 0.1, h2 + 0.35) * (1 - ease(t, 4.2, 5.0));
  const friendP: ActorProps = {
    look: look('friend'), t: T, seed: 5, x: wf.x, y: wf.y, s: sc(sF), z: sF.z, yaw: sF.yaw - look2 * 34 + br(5, 2), dmg: dmg('friend', T), visor: visorOn(T),
    head: {yaw: -look2 * 38, pitch: 3 + Math.sin(Math.PI * clamp((t - h2 - 0.6) / 0.5)) * 8},
    breath: 0.45, face: {mouth: look2 > 0.5 ? 'soft' : 'flat', brows: -0.1, lookX: -0.6 * look2},
    legL: {foot: {x: wf.x - 46 * sc(sF), y: wf.y - 10 * sc(sF), z: -6}}, legR: {foot: {x: wf.x + 44 * sc(sF), y: wf.y - 10 * sc(sF), z: 8}},
    armL: {fk: {fwd: 4, out: 8, bend: 22}}, armR: {fk: {fwd: 8, out: 10, bend: 26}},
  };
  // Carrier supports the teammate: right arm around the teammate's back (visible: we see their backs); hitch on HIT_AS3
  const hitch = Math.sin(Math.PI * clamp((t - h3 + 0.12) / 0.42));
  const tmS = sc(sT);
  const tmDrop = 10 - hitch * 8;
  const tmP: ActorProps = {
    look: look('teammate'), t: T, seed: 3, x: wt.x, y: wt.y, s: tmS, z: sT.z, yaw: sT.yaw + br(3, 2), dmg: dmg('teammate', T),
    drop: tmDrop, side: 9, lean: 6, breath: 0.8,
    head: {yaw: -8 + br(31, 4), pitch: 10, roll: -6},
    face: {mouth: 'pant', worry: 0.7, lids: 0.35, brows: 0.2},
    // left leg can't bear weight: toes trailing behind; right leg carries
    legL: {foot: {x: wt.x - 30 * tmS, y: wt.y - 22 * tmS, z: -34}, pitch: 30},
    legR: {foot: {x: wt.x + 36 * tmS, y: wt.y - 10 * tmS, z: 10}},
    armL: {fk: {fwd: 30, out: 6, bend: 110}},
    armR: {fk: {fwd: 8, out: 14, bend: 30}},
  };
  const carS = sc(sC);
  const waist = {x: wt.x - 18 * tmS, y: wt.y - (150 - tmDrop) * tmS, z: 40};
  const carP: ActorProps = {
    look: look('carrier'), t: T, seed: 2, x: wc.x, y: wc.y, s: carS, z: sC.z, yaw: sC.yaw + br(2, 2), dmg: dmg('carrier', T),
    side: -4, drop: 4 + hitch * 10, lean: 3 + hitch * 4, breath: 0.6,
    head: {yaw: 10 + ease(t, h3, h3 + 0.4) * 14 * (1 - ease(t, 3.4, 4.2)), pitch: 6},
    face: {mouth: hitch > 0.3 ? 'grit' : 'flat', brows: -0.3},
    legL: {foot: {x: wc.x - 50 * carS, y: wc.y - 10 * carS, z: -6}}, legR: {foot: {x: wc.x + 48 * carS, y: wc.y - 10 * carS, z: 8}},
    armR: {hand: {x: waist.x + 30 * carS, y: waist.y - hitch * 6 * carS, z: waist.z}, pole: {x: 0.3, y: 1, z: 0.4}},
    zArm: [undefined, 1150], handR: 'mitt',
    armL: {fk: {fwd: 4, out: 9, bend: 20}},
  };
  // Builder: tool bag in the left hand, weight on one hip
  const bS = sc(sB);
  const builderP: ActorProps = {
    look: look('builder'), t: T, seed: 6, x: wb.x, y: wb.y, s: bS, z: sB.z, yaw: sB.yaw + br(6, 2), dmg: dmg('builder', T),
    side: -3, breath: 0.5, head: {yaw: 6 + br(61, 5), pitch: 2},
    face: {mouth: 'hmm', brows: -0.2},
    legL: {foot: {x: wb.x - 44 * bS, y: wb.y - 10 * bS, z: -6}}, legR: {foot: {x: wb.x + 50 * bS, y: wb.y - 10 * bS, z: 8}},
    armL: {fk: {fwd: 2, out: 12, bend: 10}}, handL: 'fist',
    armR: {fk: {fwd: 6, out: 8, bend: 34}},
  };
  const bagH = handOf(builderP, 0);
  // civilians behind (standing, smaller), seen from behind
  const civ = ASSEMBLY.civilians.map((c, i) => {
    const w = W(c.x, c.y);
    const s = c.s / ASSEMBLY_CAM.z;
    return {look: CIV[i], t: T, seed: 20 + i, x: w.x, y: w.y, s, z: -1 + i * 0.01, yaw: c.yaw + br(20 + i, 3), breath: 0.4,
      head: {yaw: noise(t * 0.3, 70 + i) * 10, pitch: 4}, face: {mouth: 'flat' as const, worry: 0.6},
      legL: {foot: {x: w.x - 40 * s, y: w.y - 10 * s}}, legR: {foot: {x: w.x + 40 * s, y: w.y - 10 * s}},
      armL: {fk: {fwd: i === 1 ? 30 : 4, out: 10, bend: i === 1 ? 90 : 18}}, armR: {fk: {fwd: 4, out: 8, bend: 20}}} as ActorProps;
  });

  // ---------------------------------------------------------------- the view (screen-placed layers with parallax)
  const par = (k: number) => ({dx: (ASSEMBLY_CAM.x - cam.x) * k * 0.9, dy: (ASSEMBLY_CAM.y - cam.y) * k * 0.9});
  const kFar = 0.075, kMid = 0.2;
  void kMid;
  const pf = par(kFar), pm = par(kMid);
  const sweep = Math.sin(t * 0.9) * 0.6; // wardens' eyes sweep in unison
  const halt = ease(t, 2.2, 2.6) * (1 - ease(t, 5.6, 6.0)); // coordinated pause: they all stop and look up
  // the avenue below, seen from the terrace: a ground band with machines in rows (screen space, depth by scale)
  const wardens: React.ReactElement[] = [];
  const rows = [{y: 892, s: 0.15, n: 5, x0: 1330, dx: 120}, {y: 962, s: 0.18, n: 4, x0: 1390, dx: 140}, {y: 1046, s: 0.215, n: 4, x0: 1470, dx: 160}];
  rows.forEach((r, ri) => {
    for (let c = 0; c < r.n; c++) {
      const x = r.x0 + c * r.dx + pm.dx * (1 + ri * 0.3);
      const lag = c * 0.05 + ri * 0.08; // a ripple through the formation: coordination with a small mechanical delay
      const hh = ease(t, 2.2 + lag, 2.6 + lag) * (1 - ease(t, 5.6 + lag, 6.0 + lag));
      wardens.push(<Warden key={`w${ri}_${c}`} x={x} y={r.y + pm.dy} s={r.s} t={T} seed={100 + ri * 10 + c} ink={2} yaw={-62}
        look={{x: hh > 0.5 ? -0.4 : sweep, y: hh > 0.5 ? -0.5 : 0.1}} headPitch={-hh * 16} headYaw={-hh * 30} lock={0} glow={0.6} />);
    }
  });
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="b6sky" glowY={640} glow={0.6} />
        <g transform={`translate(${pf.dx * 0.4} ${pf.dy * 0.4})`}><SkylineFar x0={-300} x1={2300} base={640} h={0.75} t={T} ink={2} seed={5} sky={false} /></g>
        {/* far: the highway, broken span, gantry, landing, refuge */}
        <g transform={`translate(${pf.dx} ${pf.dy})`}>
          <Place wx={16290} wy={-820} sx={ASSEMBLY.lookAt.x} sy={ASSEMBLY.lookAt.y - 12} k={kFar}>
            <District t={T} k={kFar} facades={false} refugeGlow={1} symbolPx={15} seed={3} />
          </Place>
        </g>
        <SmokeBank x={1560 + pf.dx} y={740} w={1100} h={200} t={T} seed={61} opacity={0.75} drift={20} />
        <SmokeBank x={1500 + pf.dx} y={850} w={1000} h={90} t={T} seed={64} opacity={0.6} drift={14} />
        {/* mid: the avenue below — machines in rows */}
        <path d={`M 1080 ${846 + pm.dy} L 1940 ${836 + pm.dy} L 1940 1100 L 1080 1100 Z`} fill={CITY.asphalt} />
        {[0, 1, 2].map((i) => <line key={i} x1={1160 + i * 30} y1={900 + i * 70 + pm.dy} x2={1940} y2={896 + i * 72 + pm.dy} stroke="#D9CBA6" strokeWidth={2 + i} strokeDasharray={`${24 + i * 10} ${40 + i * 14}`} opacity={0.35} />)}
        <g transform={`translate(${pm.dx} ${pm.dy})`}>
          <Hauler x={1800} y={872} s={0.11} t={T} dir={-1} lights={1} ink={2} seed={4} />
          <AutoCar x={1250} y={880} s={0.12} t={T} dir={1} lights={1} sensor={1} ink={2} variant={1} />
          <g transform="translate(1720 860) scale(0.18)"><Flames w={300} h={420} t={T} seed={8} /></g>
        </g>
        {wardens}
        <DroneFormation x={1560 + pm.dx * 0.6} y={250} t={t} s={0.42} n={5} dx={240} seed={7} drift={6} look={{x: -0.2, y: 0.7}} />
        
        {/* near: the terrace and the group */}
        <Layer cam={cam} p={1}>
          {/* a burned building corner frames the left edge */}
          <rect x={3500} y={-2600} width={990} height={2700} fill="#3A2428" stroke="#162A32" strokeWidth={ik} />
          {[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => <rect key={`${r}_${c}`} x={3600 + c * 300} y={-2450 + r * 420} width={150} height={230} fill={(r + c) % 3 === 0 ? '#E07A30' : '#1E1418'} opacity={0.9} stroke="#162A32" strokeWidth={ik * 0.6} />))}
          <TerraceBack ink={ik} />
          {/* the terrace floor band (paving seen from just above) */}
          <rect x={4480} y={TERRACE_TOP - 40} width={1190} height={150} fill="#B8A58F" stroke="#162A32" strokeWidth={ik} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={4520 + i * 150} y1={TERRACE_TOP - 38} x2={4500 + i * 160} y2={TERRACE_TOP + 108} stroke="#9C8A74" strokeWidth={ik * 0.6} />)}
          <g transform={`translate(0 110)`}><TerraceFront ink={ik} balustrade={false} /></g>
          <defs><linearGradient id="b6wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E1418" stopOpacity={0.25} /><stop offset="100%" stopColor="#1E1418" stopOpacity={0.75} /></linearGradient></defs>
          <rect x={4470} y={-592} width={1210} height={720} fill="url(#b6wall)" />
          <Cast actors={civ} />
          <Cast actors={[builderP, carP, tmP, dirP, friendP]} extra={[{z: sB.z * 1000 + 30, el: <ToolBag x={bagH.x} y={bagH.y - 4} s={bS * 0.9} ink={ik} swing={noise(t * 0.8, 9) * 3} />}]} />
        </Layer>
        {/* foreground drift: smoke and embers */}
        <Smoke mode="cloud" x={300} y={980} w={900} h={260} n={7} t={T} seed={63} color={CITY.smoke} opacity={0.45} drift={24} />
        <Embers x={0} y={-100} w={1920} h={1200} t={T} seed={9} n={22} />
        <Grade vignette={0.42} id="b6vg" />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_B6: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.0, 'breath_exert', {gain: -8, pan: -0.2, dist: 0.1}),
    c(M.HIT_AS3 - START - 0.05, 'breath_exert', {gain: -4, pan: -0.45}),
    c(1.2, 'robot_step_heavy', {gain: -6, pan: 0.6, dist: 0.7}),
    c(2.2, 'servo_whir', {gain: -4, pan: 0.6, dist: 0.6}),
    c(5.8, 'servo_whir', {gain: -6, pan: 0.6, dist: 0.6}),
    c(0.5, 'drone_rotor', {gain: -6, pan: 0.5, dist: 0.6, dur: 7.5, fade: 1.2}),
    c(M.MARCH - START, 'steps_gravel', {gain: -6, pan: 0.0}),
  ];
})();
