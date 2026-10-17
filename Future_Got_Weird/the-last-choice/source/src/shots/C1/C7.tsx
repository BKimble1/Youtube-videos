// C7 · 1:14.0–1:18.6 · A small drone circles to the edge of the steam and drifts into one of the giants: the light
// lands on its own hull, its own shadow appears on the "giant" — nothing is there but vapour and light. It stops, its
// iris tightens, and it turns along the beam toward the source: the builder, last on the catwalk, starting to pack up.
// (The iris snaps on M.HIT_DRONE_SEES, 0.1 s into C8.)
import React from 'react';
import {Cam, smoothCam, mixCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {shot} from '../../film/timing';
import {ActorProps} from '../../rig/actor';
import {seg, smooth, lerp, noise, keys, V2} from '../../kit/math';
import {CatwalkScene, CATWALK, Projection, PROJ} from './catwalk';
import {Drone} from './avenue';
import {stand, FACE} from './kit';
import {BX} from './C5';
import {ClippedTablet, T_LAMP, deckDrone} from './C6';

const ID = 'C7';
const S0 = shot(ID).start;

/** The scout drone through C7 and the first second of C8 (film time). */
export const scout = (T: number) => {
  const t = T - S0;
  const x = keys(t, [[0, 7050], [1.0, 7380], [2.1, 7870], [3.4, 7930], [4.6, 8010], [5.4, 8060]]);
  const y = keys(t, [[0, -560], [1.0, -980], [2.1, -1020], [3.4, -1010], [4.6, -1040], [5.4, -1060]]) + 10 * noise(T * 1.4, 7);
  const turn = smooth(seg(t, 3.0, 3.8));
  const squint = smooth(seg(t, 2.5, 2.9));
  return {x, y, face: lerp(lerp(-0.2, 0.7, smooth(seg(t, 0, 1.0))), 0.95, turn), tilt: lerp(-12, 4, smooth(seg(t, 1.6, 2.2))), look: {x: lerp(-0.6, 0.95, turn), y: lerp(0.2, -0.15, turn)}, open: 1 - 0.35 * squint, squint};
};

/** The drone's own shadow on the projected field (it sits in the beam): offset and enlarged along the ray. */
export const DroneShadow: React.FC<{d: V2; s: number}> = ({d, s}) => {
  const k = 1.22;
  const x = PROJ.x + (d.x - PROJ.x) * k, y = PROJ.y + (d.y - PROJ.y) * k;
  const w = 150 * s * k;
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.75}>
      <rect x={-w * 0.3} y={-w * 0.1} width={w * 0.6} height={w * 0.2} rx={w * 0.08} fill="#2B2226" />
      {[-1, 1].map((k2) => <ellipse key={k2} cx={k2 * w * 0.44} cy={-w * 0.12} rx={w * 0.2} ry={w * 0.035} fill="#2B2226" />)}
      <circle cx={0} cy={w * 0.16} r={w * 0.08} fill="#2B2226" />
    </g>
  );
};

export const crewC7 = (t: number, T: number): ActorProps[] => {
  const g = CATWALK;
  const pack = smooth(seg(t, 3.7, 4.4));
  const wary = smooth(seg(t, 2.6, 3.0));
  return [{
    ...stand(look('builder'), BX - 10, g, {t}, 40), seed: 37, dmg: dmg('builder', T), z: 40, yaw: lerp(-70, -40, wary), drop: 14 + 10 * pack, lean: 10 + 8 * pack, breath: 0.7,
    armL: {hand: {x: PROJ.x - 48, y: PROJ.y + 10, z: 60}, pole: {x: 0, y: 1, z: 0.4}},
    armR: pack > 0.01 ? {hand: {x: PROJ.x + 24, y: PROJ.y + 22, z: 70}, w: pack} : {fk: {fwd: 10, out: 12, bend: 30}},
    face: {mouth: wary > 0.5 ? 'grit' : 'flat', brows: lerp(-0.5, 0.2, wary), worry: 0.5 * wary, lookX: -0.7, lookY: 0.3}, head: {yaw: -14, pitch: 8},
  }];
};

const camAt = (t: number): Cam => mixCam({x: 7820, y: -1050, z: 0.78}, {x: 8380, y: -1320, z: 1.05}, smooth(seg(t, 1.8, 4.5)));

export const C7Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam = smoothCam(camAt, t, 0.3);
  const ink = 4 / cam.z;
  const d = scout(T);
  const lit = smooth(seg(t, 1.6, 2.1));
  const others = <g>{[0, 2].map((i) => { const q = deckDrone(i, T); return <Drone key={i} x={q.x - 650 - 300 * smooth(seg(t, 0, 4))} y={q.y + 150} s={2.1} t={T} seed={70 + i} face={-0.9} look={{x: -0.6, y: 0.4}} lock={1} />; })}</g>;
  const scoutEl = (
    <g>
      <Drone x={d.x} y={d.y} s={2.6} t={T} seed={77} face={d.face} tilt={d.tilt} look={d.look} lock={0} glow={0.4 + 0.4 * d.squint} eyeOpen={d.open} />
      {/* the beam lands on its hull */}
      <ellipse cx={d.x + 40} cy={d.y - 8} rx={70} ry={28} fill="#FFF0C8" opacity={0.55 * lit} />
    </g>
  );
  return (
    <CatwalkScene id="c7" cam={cam} T={T} crew={crewC7(t, T)}
      back={others}
      onCloud={<g><Projection T={T} t0={T_LAMP} on={1} id="c7p" ink={ink} beam={2.2} occluder={lit > 0 ? <g opacity={lit}><DroneShadow d={d} s={2.6} /></g> : null} />{scoutEl}</g>}
      front={<ClippedTablet T={T} ink={ink} id="c7tab" />} />
  );
};

const c = at(S0);
export const CUES: Cue[] = [
  c(0, 'drone_rotor', {dur: 4.6, pan: -0.4, dist: 0.15, gain: 2, fade: 0.5}),
  c(2.6, 'servo_whir', {pan: -0.1, dist: 0.2, gain: -3, rate: 1.3}),
  c(3.1, 'servo_whir', {pan: 0, dist: 0.2, gain: -1}),
];
void FACE;
