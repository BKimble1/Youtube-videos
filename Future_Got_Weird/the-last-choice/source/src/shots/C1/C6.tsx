// C6 · 1:09.0–1:14.0 · The decoy. The builder clips the tablet to the railing; the projector throws the four walkers
// onto the steam: giant shadows striding west. The drones over the deck swing to them and dive; the patrol cars below
// back away west after them. The Crew uses the seconds to run east. The Director stops and looks back for the builder.
import React from 'react';
import {Cam, smoothCam, mixCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV, limpOf, radioOnStrap} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {shot} from '../../film/timing';
import {ActorProps} from '../../rig/actor';
import {seg, smooth, lerp, keys, noise} from '../../kit/math';
import {CatwalkScene, CATWALK, Projection, PROJ} from './catwalk';
import {AutoCar, Drone} from './avenue';
import {Tablet, mover, stand, supportPair, G_RUN, G_HURRY, G_WALK, FACE, sk} from './kit';
import {BX, TabletContent} from './C5';

const ID = 'C6';
const S0 = shot(ID).start;
export const LAMP = 0.95; // projector on (shot-local)
export const T_LAMP = S0 + LAMP;

/** The tablet clipped on the rail (world), from C6 on. */
export const ClippedTablet: React.FC<{T: number; ink: number; id: string; lens?: number}> = ({T, ink, id, lens = 1}) => (
  <g transform={`translate(${PROJ.x - 10} ${PROJ.y + 26})`}>
    <Tablet s={1.25} ink={ink} view={0.45} rot={8} id={id} glow={0.9} lens={lens} content={<TabletContent t={T - S0 + 3} tap={0} draw={() => [0, 0.01] as const} />} />
  </g>
);

export const crewC6 = (t: number, T: number): ActorProps[] => {
  const out: ActorProps[] = [];
  const g = CATWALK;
  // builder: rises, steps to the rail, clips the tablet on, aims, keeps a hand on it
  const rise = smooth(seg(t, 0.0, 0.45));
  const bx = keys(t, [[0, BX], [0.5, BX - 10]]);
  out.push({...stand(look('builder'), bx, g, {t}, 40), seed: 37, dmg: dmg('builder', T), z: 40, yaw: lerp(26, -70, smooth(seg(t, 0.2, 0.6))), drop: lerp(118, 14, rise), lean: lerp(24, 10, rise), breath: 0.6,
    armL: {hand: {x: PROJ.x - 48, y: PROJ.y + 10, z: 60}, pole: {x: 0, y: 1, z: 0.4}}, armR: t < 0.85 ? {hand: {x: PROJ.x + 10, y: PROJ.y + 30, z: 70}} : {fk: {fwd: 10, out: 12, bend: 30}},
    face: {mouth: 'flat', brows: -0.5, lookX: -0.6, lookY: 0.4}, head: {yaw: -10, pitch: 10}});
  // Director: up, waves them east, runs, stops at the next bracket and looks back for her
  const dRun = sk(t, [[0.9, 0], [2.4, 430], [2.7, 450]], 0.2);
  const wave = smooth(seg(t, 0.35, 0.6)) * (1 - smooth(seg(t, 0.9, 1.1)));
  const dir = t < 0.9 ? stand(look('director'), BX + 215, g, {t}, 44) : t < 2.7 ? mover(look('director'), {x0: BX + 215, dist: dRun, dir: 1, ground: g, gait: G_RUN, t}) : stand(look('director'), BX + 215 + dRun, g, {t}, 44, -1);
  out.push({...dir, seed: 31, dmg: dmg('director', T), z: -20, drop: (dir.drop ?? 6) + lerp(104, 0, smooth(seg(t, 0, 0.35))), yaw: t > 2.6 ? lerp(90, -60, smooth(seg(t, 2.6, 3.0))) : t < 0.9 ? -45 + 135 * smooth(seg(t, 0.3, 0.9)) : 90,
    armR: wave > 0.01 ? {fk: {fwd: 80 + 30 * Math.sin(t * 14), out: 20, bend: 30}} : dir.armR, face: t > 2.7 ? FACE.worry : FACE.focus, breath: 0.8});
  // carrier: limps east behind her, past the Director
  const lim = limpOf('carrier', T);
  const dC = sk(t, [[0.5, 0], [5, 960]], 0.3);
  out.push({...mover(look('carrier'), {x0: BX - 270, dist: dC, dir: 1, ground: g, gait: {...G_HURRY, limp: lim}, t}), seed: 35, dmg: dmg('carrier', T), z: 10, face: FACE.pain, armL: {fk: {fwd: 40, out: 4, bend: 110}}, handL: 'fist', breath: 0.9});
  // the friend helps the teammate up and they go east
  const up = smooth(seg(t, 0.4, 1.3));
  const dP = sk(t, [[1.3, 0], [5, 560]], 0.3);
  const [fr, tm] = supportPair(look('friend'), look('teammate'), {x: BX + 400, ground: g, dist: dP, dir: 1, t, seed: 19, supDmg: dmg('friend', T), tmDmg: dmg('teammate', T)});
  out.push({...fr, drop: (fr.drop ?? 0) + 60 * (1 - up)}, {...tm, drop: (tm.drop ?? 0) + 80 * (1 - up), satchel: {radio: radioOnStrap(T)}});
  // civilians run ahead
  [0, 1, 2].forEach((i) => {
    const lk = CIV[i];
    const d = sk(t, [[0.6 + 0.2 * i, 0], [5, 1250 - 120 * i]], 0.3);
    out.push({...mover(lk, {x0: BX + 760 + i * 150, dist: d, dir: 1, ground: g, gait: G_RUN, t, s: lk.height}), seed: 50 + i, face: FACE.worry});
  });
  return out;
};

// drones: hovering over the deck (blind to the catwalk under its edge), then swinging to the giants and diving west
export const deckDrone = (i: number, T: number) => {
  const t = T - S0;
  const swing = smooth(seg(t, 1.25 + i * 0.15, 1.7 + i * 0.15));
  const dive = smooth(seg(t, 1.6 + i * 0.2, 3.8 + i * 0.25));
  const x = lerp(8150 + i * 330, 7250 + i * 260, dive) + 30 * noise(T * 0.7, i);
  const y = lerp(-2020 - (i % 2) * 110, -1150 + i * 170, dive) + 16 * noise(T * 1.1, i + 4);
  return {x, y, face: lerp(0.5, -0.9, swing), tilt: -14 * dive * (1 - smooth(seg(t, 3.6, 4.4))), look: {x: lerp(0.3, -0.7, swing), y: lerp(0.6, 0.4, swing)}, lock: swing};
};
// patrol cars under the cloud back away west after the giants
export const patrol = (i: number, T: number) => {
  const t = T - S0;
  const go = smooth(seg(t, 1.9 + i * 0.3, 4.8 + i * 0.3));
  const x0 = [7000, 7650][i], x1 = [5800, 6300][i];
  return {x: lerp(x0, x1, go), y: [-30, 360][i], dist: -(x0 - lerp(x0, x1, go))};
};

const camAt = (t: number): Cam => mixCam({x: 8640, y: -930, z: 0.42}, {x: 8700, y: -940, z: 0.41}, smooth(t / 5));

export const C6Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam = smoothCam(camAt, t, 0.3);
  const ink = 4 / cam.z;
  const on = smooth(seg(t, LAMP, LAMP + 0.3));
  const street = (
    <g>
      {[0, 1].map((i) => { const p = patrol(i, T); return <AutoCar key={i} x={p.x} y={p.y} s={0.85} dir={1} t={T} dist={p.dist} ink={ink} variant={i ? 2 : 0} sensor={1} lights={1} lock={on > 0.5 ? 1 : 0} seed={80 + i} />; })}
    </g>
  );
  const tablet = t < 0.85 ? null : <ClippedTablet T={T} ink={ink} id="c6tab" lens={on} />;
  const drones = <g>{[0, 1, 2].map((i) => { const d = deckDrone(i, T); return <Drone key={i} x={d.x} y={d.y} s={2.7} t={T} seed={70 + i} face={d.face} tilt={d.tilt} look={d.look} lock={d.lock} />; })}</g>;
  return (
    <CatwalkScene id="c6" cam={cam} T={T} crew={crewC6(t, T)} street={street}
      back={<g>{drones}</g>}
      onCloud={<Projection T={T} t0={T_LAMP} on={on} id="c6p" ink={ink} />}
      front={tablet} />
  );
};

const c = at(S0);
export const CUES: Cue[] = [
  c(0.55, 'padlock', {pan: 0.05, gain: -6, rate: 1.3}),
  c(LAMP, 'projector_beep', {pan: 0.05, gain: 0}),
  c(1.3, 'servo_whir', {pan: -0.2, dist: 0.4, gain: 1}),
  c(1.6, 'drone_rotor', {dur: 3.4, pan: -0.3, dist: 0.3, gain: 4, fade: 0.6}),
  c(1.9, 'servo_whir', {pan: -0.5, dist: 0.6, gain: -2, rate: 0.8}),
  c(1.0, 'step_grate', {dur: 4, pan: 0.4, dist: 0.3, gain: 0, fade: 0.3}),
  c(1.2, 'step_grate_b', {dur: 3.6, pan: 0.5, dist: 0.35, gain: -3, fade: 0.3}),
];
void G_WALK;
