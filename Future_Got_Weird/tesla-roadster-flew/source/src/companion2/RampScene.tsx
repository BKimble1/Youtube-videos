// Mechanism 1, one connected illustrated scene: the car hanging under the C-ramp, gravity, air everywhere, the fans
// thinning the air in the floor gap, the outside air pushing the car into the ramp, the same push at any angle, the
// conditions (beat weight plus bumps, keep the seal), Tesla's 2 g claim, and the car leaving the ramp (the gap opens,
// air rushes back in, the grip is gone). Colours: blue = air flow, saffron = forces on the car, ink = weight.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose, mixPose, reach} from '../components/Character';
import {CAST} from '../components/cast';
import {BODY, PROFILE, WHEELS} from '../short3/Roadster';
import {CAR, CAR_K, CarSide, DROOP} from './Car';
import {LIP, RampDrawing, rampAt, S_END, S_HANG, S_WALL0, WALL} from './Ramp';
import {Arrow, Cam, camTrack, cue, E, FLOW, FLOW_LIGHT, FORCE, Label, lerp, ramp, rnd, Tag, toScreen, track, useT, WEIGHT, World, WSvg} from './kit';

const midX = (WHEELS[0].c[0] + WHEELS[1].c[0]) / 2;
/** Height of the body's top edge (car-local, negative) at local x (facing right). */
const roofAt = (lx: number) => {
  const sx = midX - lx / CAR_K;
  const near = BODY.filter((p) => Math.abs(p[0] - sx) < 18);
  const top = near.length ? Math.min(...near.map((p) => p[1])) : PROFILE.roof;
  return -(PROFILE.wheelBottom + DROOP - top) * CAR_K;
};

// ---- timeline cues (film seconds) ----
const T = {
  earlier: cue('earlier', 'P5'), hung: cue('hung', 'P5'), gravity: cue('Gravity', 'P5'), weight: cue('weight', 'P5'),
  held: cue('held', 'P5'), air: cue('air', 'P5', 0), presses: cue('presses', 'P5', 0), tons: cue('tons', 'P5'),
  side: cue('side', 'P5'), cancels: cue('cancels', 'P5'), fans: cue('fans', 'P5'), thin: cue('thin', 'P5'),
  notAll: cue('Not', 'P5'), weakly: cue('weakly', 'P5'), wins: cue('wins', 'P5'), presses2: cue('presses', 'P5', 1),
  isnt: cue("isn't", 'P5'), pushing: cue('pushing', 'P5'),
  surface: cue('surface', 'P6'), floor: cue('floor', 'P6'), wall: cue('wall', 'P6'), ceiling: cue('ceiling', 'P6'),
  beats: cue('beats', 'P7'), bump: cue('bump', 'P7'), seal: cue('seal', 'P7'), sealEnd: cue('holds', 'P7', 0, true),
  teslaSays: cue('Tesla', 'P8'), twoG: cue('two', 'P8'), twice: cue('twice', 'P8'),
  leaves: cue('leaves', 'P10'), opens: cue('opens', 'P10'), rushes: cue('rushes', 'P10'), gone: cue('gone', 'P10'),
};
export const RAMP_CUES = T;

// ---- the car's path: hanging, then driving to the lip, then falling free (slow-motion scale in the illustration) ----
const T_DRIVE = T.leaves - 1.25;
const T_LIP = T.leaves + 0.35;
const V0 = 260, G = 100;
const lip = rampAt(S_END);
const lipDir = {x: Math.cos((LIP * Math.PI) / 180), y: -Math.sin((LIP * Math.PI) / 180)};
export const carAt = (t: number) => {
  if (t <= T_DRIVE) {
    const p = rampAt(S_HANG);
    return {x: p.x, y: p.y, heading: p.heading, n: p.n, free: 0};
  }
  if (t <= T_LIP) {
    // accelerate from rest to V0 over the drive (ease-in), distance S_END - S_HANG
    const u = (t - T_DRIVE) / (T_LIP - T_DRIVE);
    const s = S_HANG + (S_END - S_HANG) * u * u;
    const p = rampAt(s);
    return {x: p.x, y: p.y, heading: p.heading, n: p.n, free: 0};
  }
  const tau = t - T_LIP;
  const x = lip.x + lipDir.x * V0 * tau;
  const y = lip.y + lipDir.y * V0 * tau + 0.5 * G * tau * tau;
  return {x, y, heading: lip.heading + 14 * Math.min(1, tau / 3) * Math.min(1, tau / 3), n: lip.n, free: tau};
};
/** World position of a car-local point. */
const W = (car: {x: number; y: number; heading: number}, lx: number, ly: number) => {
  const r = (car.heading * Math.PI) / 180;
  return {x: car.x + lx * Math.cos(r) - ly * Math.sin(r), y: car.y + lx * Math.sin(r) + ly * Math.cos(r)};
};

const HANG = carAt(0);
const CC = W(HANG, 0, CAR.cy); // body centre while hanging
const GAP = W(HANG, 0, CAR.floor / 2); // gap centre while hanging
export const RAMP_MATCH_CAM: Cam = {x: GAP.x, y: GAP.y, z: 3.9};

// ---- air particles ----
const P_WORLD = Array.from({length: 320}, (_, i) => ({x: -1800 + rnd(i) * 2600, y: -1500 + rnd(i + 999) * 1700, ph: rnd(i + 77) * 6.28, sp: 0.6 + rnd(i + 55) * 0.8}));
const N_GAP = 30;
const P_GAP = Array.from({length: N_GAP}, (_, i) => ({x: lerp(CAR.gapRear - 30, CAR.gapFront + 30, (i + rnd(i + 3) * 0.8) / N_GAP), y: lerp(CAR.floor * 0.85, -3, rnd(i + 31)), stays: i % 5 === 0 || i % 5 === 3, ph: rnd(i + 9) * 6.28}));

// ---- the fact-checker under the car with a crash mat ----
const CHECK = {x: -460, y: 0, scale: 0.39};
const MAT = {x0: -405, x1: -105, h: 70};

export const RampScene: React.FC<{start: number}> = ({start}) => {
  const t = useT(start);
  const frame = Math.round(t * 30);
  const car = carAt(t);

  // ---- camera ----
  const cc = W(car, 0, CAR.cy);
  const keys: [number, Cam, ((x: number) => number)?][] = [
    [12.9, RAMP_MATCH_CAM],
    [13.5, {x: GAP.x, y: GAP.y, z: 3.55}],
    [16.9, {x: CC.x, y: CC.y + 40, z: 1.2}, E.inOut],
    [19.4, {x: -200, y: -560, z: 0.78}, E.inOut],
    [20.3, {x: -230, y: -520, z: 0.8}, E.inOut],
    [21.3, {x: -380, y: -150, z: 1.75}, E.inOut],
    [22.3, {x: -370, y: -160, z: 1.8}, E.inOut],
    [23.6, {x: -240, y: -560, z: 0.8}, E.inOut],
    [24.6, {x: CC.x, y: CC.y + 80, z: 1.32}, E.inOut],
    [30.9, {x: CC.x + 10, y: CC.y + 70, z: 1.45}, E.inOut],
    [T.fans + 0.6, {x: GAP.x - 10, y: GAP.y, z: 2.5}, E.inOut],
    [T.thin + 0.6, {x: GAP.x, y: GAP.y, z: 3.1}, E.inOut],
    [T.weakly + 0.9, {x: GAP.x, y: GAP.y, z: 3.2}, E.inOut],
    [T.wins + 0.6, {x: CC.x, y: CC.y + 80, z: 1.3}, E.inOut],
    [T.isnt, {x: CC.x, y: CC.y + 110, z: 1.18}, E.inOut],
    [T.pushing + 0.7, {x: -320, y: -560, z: 0.86}, E.inOut],
    [T.surface, {x: -230, y: -560, z: 0.72}, E.inOut],
    [T.ceiling + 0.4, {x: -220, y: -560, z: 0.7}, E.inOut],
    [T.beats + 0.2, {x: CC.x + 40, y: CC.y + 90, z: 1.22}, E.inOut],
    [T.sealEnd, {x: CC.x + 40, y: CC.y + 70, z: 1.32}, E.inOut],
    [T.teslaSays + 0.3, {x: CC.x + 60, y: CC.y + 110, z: 1.18}, E.inOut],
    [T.twice + 1.4, {x: CC.x + 60, y: CC.y + 110, z: 1.24}, E.inOut],
    [T.leaves - 1.6, {x: CC.x - 60, y: CC.y + 60, z: 1.15}, E.inOut],
    [T_LIP, {x: lip.x - 220, y: lip.y + 150, z: 1.05}, E.inOut],
  ];
  let cam = camTrack(t, keys);
  if (t > T_LIP) {
    // follow the falling car
    const f = W(car, 0, CAR.cy);
    const u = ramp(t, T_LIP, T_LIP + 1.2);
    cam = {x: lerp(cam.x, f.x - 60, u), y: lerp(cam.y, f.y - 20, u), z: lerp(cam.z, 1.25, ramp(t, T_LIP, T.gone + 0.6)), r: 0};
  }

  // ---- state ----
  const airIn = ramp(t, T.air - 0.25, T.air + 0.6);
  const pressIn = ramp(t, T.presses, T.presses + 0.5);
  const fanOn = ramp(t, T.fans - 0.1, T.fans + 0.5);
  const thinning = ramp(t, T.fans + 0.3, T.weakly - 0.2, E.inOut); // gap air leaving
  const refill = ramp(t, T.rushes - 0.1, T.rushes + 0.9);
  const gapScale = lerp(lerp(1, 0.4, ramp(t, T.weakly - 0.4, T.weakly + 0.4)), 1, refill);
  const netIn = ramp(t, T.presses2 - 0.2, T.presses2 + 0.4) * (1 - refill);
  const grip = 1 - ramp(t, T.gone - 0.2, T.gone + 0.3);
  const weightIn = ramp(t, T.gravity, T.gravity + 0.45) * (1 - ramp(t, T.surface - 0.6, T.surface - 0.1)) + ramp(t, T.ceiling - 0.15, T.ceiling + 0.3) * (1 - ramp(t, T.leaves - 1.4, T.leaves - 0.9));
  const pushGrow = lerp(1.45, 2.0, ramp(t, T.twoG - 0.1, T.twoG + 0.8)); // push length in weights
  const stationsIn = [ramp(t, T.floor - 0.15, T.floor + 0.3), ramp(t, T.wall - 0.15, T.wall + 0.3), ramp(t, T.ceiling - 0.15, T.ceiling + 0.3)];
  const stationsOut = 1 - ramp(t, T.beats - 0.6, T.beats - 0.1);
  const bump = t > T.bump - 0.05 && t < T.bump + 0.7 ? Math.sin((t - T.bump) * 42) * 3 * (1 - (t - T.bump) / 0.7) : 0;
  const seal = ramp(t, T.seal - 0.1, T.seal + 0.3) * (1 - ramp(t, T.sealEnd + 0.6, T.sealEnd + 1.1));
  const carDraw = {...car, y: car.y + bump * Math.cos((car.heading * Math.PI) / 180)};
  const W_LEN = 150; // weight arrow length (world units)
  const WX = 110; // weight arrow: world x offset from the centre of mass (toward the tail while hanging)
  const PX = 90; // net push arrow: car-local x (toward the nose while hanging)

  // ---- the checker: braced under the car, then notices the arrows and lets go of the mat ----
  const brace: Pose = {...IDLE, armR: reach(CHECK, 1, MAT.x0 + 4, -MAT.h + 6), armL: {a: 34, b: 70}, lean: -3, tilt: -8, lookX: 0.5, lookY: -1, brows: 0.75, mouth: 'o'};
  const notice: Pose = {...IDLE, armR: reach(CHECK, 1, MAT.x0 + 4, -MAT.h + 6), armL: {a: 10, b: 20}, lean: 0, tilt: -4, lookX: 0.45, lookY: -0.9, brows: 0.2, browAsym: 0.7, mouth: 'hmm'};
  const letGo: Pose = {...IDLE, armR: {a: 6, b: 8}, armL: {a: 6, b: 8}, lean: 0, tilt: 2, lookX: -0.2, lookY: 0.1, brows: 0, browAsym: 0.5, mouth: 'flat'};
  const pose = t < T.isnt ? brace : t < T.pushing + 0.4 ? mixPose(brace, notice, ramp(t, T.isnt, T.isnt + 0.5)) : mixPose(notice, letGo, ramp(t, T.pushing + 0.4, T.pushing + 1.1));

  // ---- particles ----
  const wiggle = (ph: number, sp: number) => ({dx: Math.sin(t * sp * 1.3 + ph) * 14, dy: Math.cos(t * sp + ph * 1.7) * 12});
  const gapPts = P_GAP.map((p, i) => {
    const w = wiggle(p.ph, 1);
    // leaving particles stream to the rear and out (fans), the rest stay; after the car leaves the ramp they come back
    const leaveAt = T.fans + 0.2 + (i % 7) * 0.35;
    let x = p.x + w.dx * 0.5, y = p.y + w.dy * 0.15, o = 1;
    if (!p.stays) {
      const u = ramp(t, leaveAt, leaveAt + 1.6, E.in);
      x = lerp(x, CAR.gapRear - 140 - (i % 4) * 30, u);
      y = lerp(y, CAR.floor * 0.5 + (i % 3) * 6, u);
      o = 1 - ramp(t, leaveAt + 1.1, leaveAt + 1.6);
      if (refill > 0) { o = refill; x = lerp(p.x + (i % 2 ? 140 : -140), p.x, refill); y = p.y; }
    }
    return {x, y: Math.min(-2.5, Math.max(CAR.floor + 2.5, y)), o};
  });

  // pressure arrows: outside (roof side) and in the gap, equal until the fans thin the gap air
  const roofXs = [-150, -75, 0, 75, 150];
  const L_OUT = 52;
  const gapH = -CAR.floor;
  const view = (wx: number, wy: number) => toScreen(cam, wx, wy);
  const gapLabel = view(GAP.x, GAP.y);
  const ccS = view(cc.x, cc.y);

  // stations (P6): the same pair of arrows at the floor, the wall and the ceiling
  const stations = [{s: -760, k: 0}, {s: S_WALL0 + WALL / 2, k: 1}].map(({s, k}) => ({p: rampAt(s), k}));

  const inside = t < T_LIP + 0.01 ? 1 : 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#1D2944 0%, #2B3B5E 55%, #3C4F73 100%)'}}>
      <World cam={cam}>
        <WSvg>
          {/* distant site lights */}
          {Array.from({length: 14}, (_, i) => (
            <circle key={i} cx={-2600 + i * 420} cy={-30 - (i % 3) * 12} r={7} fill="#FFE6B0" opacity={0.5} />
          ))}
          <rect x={-6000} y={0} width={12000} height={4000} fill="#2A303B" />
          <rect x={-6000} y={0} width={12000} height={10} fill="#4A5363" />
          {/* air: sparse particles everywhere */}
          <g opacity={airIn * 0.6}>
            {P_WORLD.map((p, i) => {
              const w = wiggle(p.ph, p.sp);
              return <circle key={i} cx={p.x + w.dx} cy={p.y + w.dy} r={5.5} fill={FLOW_LIGHT} />;
            })}
          </g>
          <RampDrawing />
          {/* crash mat */}
          <g>
            <rect x={MAT.x0} y={-MAT.h} width={MAT.x1 - MAT.x0} height={MAT.h} rx={14} fill="#4F7CC9" stroke={C.ink} strokeWidth={4} />
            {[0.25, 0.5, 0.75].map((u) => <line key={u} x1={lerp(MAT.x0, MAT.x1, u)} y1={-MAT.h + 6} x2={lerp(MAT.x0, MAT.x1, u)} y2={-6} stroke="#3A5FA0" strokeWidth={4} />)}
          </g>
        </WSvg>
        <Character look={CAST.checker} pose={pose} frame={frame} seed={4} x={CHECK.x} y={CHECK.y} scale={CHECK.scale} life={0.6} />
        <WSvg>
          {/* ghost stations */}
          {stations.map(({p, k}) => {
            const o = stationsIn[k] * stationsOut;
            if (o <= 0) return null;
            const c = {x: p.x, y: p.y, heading: p.heading};
            const body = W(c, 0, CAR.cy);
            const pushFrom = W(c, 0, CAR.roof - 40 - 120);
            const pushTo = W(c, 0, CAR.roof - 40);
            return (
              <g key={k} opacity={o}>
                <CarSide x={p.x} y={p.y} heading={p.heading} opacity={0.55} />
                <Arrow x1={pushFrom.x} y1={pushFrom.y} x2={pushTo.x} y2={pushTo.y} color={FORCE} w={16} />
                <Arrow x1={body.x + 60} y1={body.y} x2={body.x + 60} y2={body.y + W_LEN * 0.8} color={WEIGHT} w={12} />
              </g>
            );
          })}
          {/* weight: always straight down, from the centre of mass (drawn behind the car) */}
          {weightIn > 0 && <Arrow x1={cc.x + WX} y1={cc.y} x2={cc.x + WX} y2={cc.y + 70 + W_LEN} color={WEIGHT} w={16} opacity={weightIn} />}
          {/* the car */}
          <CarSide x={carDraw.x} y={carDraw.y} heading={carDraw.heading}>
            {/* seal highlight along the skirt */}
            {seal > 0 && <line x1={CAR.gapRear} y1={CAR.floor} x2={CAR.gapFront} y2={CAR.floor} stroke="#3EE0C8" strokeWidth={7} opacity={seal} strokeLinecap="round" />}
            {/* air in the floor gap */}
            <g opacity={airIn}>
              {gapPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill={FLOW_LIGHT} opacity={p.o * 0.95} stroke="#9DB8E8" strokeWidth={1} />)}
            </g>
            {/* fans (conceptual): air pulled out of the gap and out at the back */}
            {fanOn > 0 && (
              <g opacity={fanOn * (1 - ramp(t, T.wins, T.wins + 0.6)) * inside}>
                <g transform={`translate(${-40} ${CAR.floor + 1})`}>
                  <circle r={11} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
                  {[0, 120, 240].map((a) => <path key={a} d="M 0 0 Q 4 -9 0 -10 Q -5 -6 0 0" fill={FLOW} transform={`rotate(${a + t * 720})`} />)}
                </g>
                <Arrow x1={CAR.gapFront - 20} y1={CAR.floor / 2} x2={-30} y2={CAR.floor / 2} color={FLOW} w={4} head={9} outline={1} opacity={thinning > 0 && thinning < 1 ? 1 : 0.7} />
                <Arrow x1={-60} y1={CAR.floor / 2} x2={CAR.gapRear - 120} y2={CAR.floor / 2 - 4} color={FLOW} w={4} head={9} outline={1} />
              </g>
            )}
            {/* pressure: outside air on the roof side, pushing toward the ramp */}
            <g opacity={pressIn * grip}>
              {roofXs.map((x) => {
                const top = roofAt(x);
                return <Arrow key={x} x1={x} y1={top - 10 - L_OUT} x2={x} y2={top - 10} color={FORCE} w={7} head={15} outline={1.5} />;
              })}
              {/* nose and tail: equal and opposite */}
              <Arrow x1={CAR.nose + 10 + L_OUT} y1={CAR.cy * 0.6} x2={CAR.nose + 10} y2={CAR.cy * 0.6} color={FORCE} w={7} head={15} outline={1.5} opacity={ramp(t, T.side - 0.2, T.side + 0.3)} />
              <Arrow x1={-CAR.tail - 10 - L_OUT} y1={CAR.cy * 0.6} x2={-CAR.tail - 10} y2={CAR.cy * 0.6} color={FORCE} w={7} head={15} outline={1.5} opacity={ramp(t, T.side - 0.2, T.side + 0.3)} />
              {/* in the gap: the gap air pushing the floor away from the ramp */}
              {[-110, -30, 50, 130].map((x) => (
                <Arrow key={x} x1={x} y1={-1.5} x2={x} y2={-1.5 - (gapH - 4) * gapScale} color={FORCE} w={3.2} head={7} outline={0.8} />
              ))}
            </g>
          </CarSide>
          {/* bumps add to the load */}
          {t > T.bump - 0.2 && t < T.teslaSays && <Arrow x1={cc.x + WX} y1={cc.y + 70 + W_LEN + 8} x2={cc.x + WX} y2={cc.y + 70 + W_LEN + 8 + 55} color={WEIGHT} w={10} opacity={ramp(t, T.bump - 0.2, T.bump + 0.2) * (1 - ramp(t, T.teslaSays - 0.5, T.teslaSays))} dash="2 16" />}
          {/* net push: the outside air wins */}
          {netIn > 0 && (() => {
            const a = W(car, PX, roofAt(PX) - 30 - W_LEN * pushGrow);
            const b = W(car, PX, roofAt(PX) - 30);
            return <Arrow x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={FORCE} w={22} opacity={netIn} />;
          })()}
        </WSvg>
      </World>
      {/* ---- labels (screen space) ---- */}
      <Tag kind="illustration" opacity={ramp(t, 13.6, 14.2) * (1 - ramp(t, T.teslaSays - 0.1, T.teslaSays + 0.3) * (1 - ramp(t, T.leaves - 1.8, T.leaves - 1.3)))} />
      <Label x={ccS.x + 300} y={ccS.y + 140} text="WEIGHT" color={C.cream} bg={WEIGHT} size={38} opacity={ramp(t, T.gravity, T.gravity + 0.45) * (1 - ramp(t, T.presses - 0.2, T.presses + 0.2))} />
      <Label x={960} y={980} text={<span>Air at sea level: about <b>10 tonnes</b> pressing on every m²</span>} size={38} opacity={ramp(t, T.tons - 0.1, T.tons + 0.3) * (1 - ramp(t, T.cancels + 0.5, T.cancels + 0.9))} />
      <Label x={960} y={980} text="Equal from every side: it cancels out" size={38} opacity={ramp(t, T.cancels + 0.6, T.cancels + 1.0) * (1 - ramp(t, T.fans - 0.4, T.fans))} />
      <Label x={gapLabel.x} y={gapLabel.y + 330} text="Tesla says: fans pull air out of the gap" size={38} bg={C.saffronLight} opacity={ramp(t, T.fans, T.fans + 0.4) * (1 - ramp(t, T.notAll, T.notAll + 0.3))} sub="fan position simplified" />
      <Label x={gapLabel.x} y={gapLabel.y + 330} text="LOWER PRESSURE in the gap · some air remains" size={38} color={C.ink} bg={FLOW_LIGHT} opacity={ramp(t, T.weakly - 0.4, T.weakly + 0.1) * (1 - ramp(t, T.wins - 0.2, T.wins + 0.3))} />
      <Label x={ccS.x - 330} y={ccS.y + 250} text="OUTSIDE AIR PUSHES IN" size={38} bg={C.saffronLight} opacity={netIn * (1 - ramp(t, T.surface - 0.5, T.surface))} />
      <Label x={ccS.x + 300} y={ccS.y + 140} text="WEIGHT" color={C.cream} bg={WEIGHT} size={38} opacity={ramp(t, T.beats - 0.2, T.beats + 0.2) * (1 - ramp(t, T.teslaSays - 0.4, T.teslaSays))} />
      <Label x={ccS.x + 300} y={ccS.y + 260} text="+ BUMPS" color={C.cream} bg={WEIGHT} size={32} opacity={ramp(t, T.bump - 0.1, T.bump + 0.3) * (1 - ramp(t, T.teslaSays - 0.4, T.teslaSays))} />
      <Label x={ccS.x} y={ccS.y - 230} text="…and the seal must hold" size={38} opacity={seal} />
      <Tag kind="claim" opacity={ramp(t, T.teslaSays - 0.1, T.teslaSays + 0.3) * (1 - ramp(t, T.leaves - 1.8, T.leaves - 1.3))} text="Tesla's claim, plus our reading of it" />
      <Label x={ccS.x - 380} y={ccS.y + 330} text="Tesla: up to 2 g of suction" size={38} bg={C.saffronLight} opacity={ramp(t, T.twoG - 0.1, T.twoG + 0.3) * (1 - ramp(t, T.leaves - 1.8, T.leaves - 1.3))} />
      <Label x={ccS.x + 330} y={ccS.y + 330} text="≈ 2 × the car's weight" size={38} opacity={ramp(t, T.twice - 0.2, T.twice + 0.3) * (1 - ramp(t, T.leaves - 1.8, T.leaves - 1.3))} sub="our reading, not Tesla's words" />
      <Label x={960} y={985} text="Gravity always down · the push always into the surface" size={38} opacity={ramp(t, T.surface, T.surface + 0.4) * (1 - ramp(t, T.beats - 0.6, T.beats - 0.1))} />
      <Label x={960} y={985} text="No seal, no pressure difference: no grip" size={38} opacity={ramp(t, T.gone - 0.2, T.gone + 0.2)} />
    </AbsoluteFill>
  );
};
