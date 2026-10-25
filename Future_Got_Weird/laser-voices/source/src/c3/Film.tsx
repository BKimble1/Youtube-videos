// Laser Voices V3: the film. Room shots render the one world (Scene) from the shot's camera; the molecular sequence is
// its own drawing, entered and left by the same camera move into (and back out of) the air beside her ear.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions3} from '../v3/Captions3';
import {clamp, DUR, FPS, ss} from './lib';
import {BeamSort, RoomScene} from './Scene';
import {beamEnd, cast, dialAt, earAndHead, earOf, galvoAt, pressAt, sendAt, sweepAt, SWEEP} from './story';
import {basis, v3, V3} from './rig/geo';
import {depth} from './art/d3';
import {beamDir} from './art/Emitter';
import {camAt, CUT, shotAt} from './shots';
import {Micro} from './Micro';
import {LENS} from './world';

/** The beam is invisible: its path is drawn only inside these explanatory windows (vis, and the front of a travelling
 *  pulse 0..1) */
export const beamViz = (t: number): {vis: number; prog: number} => {
  const win = (a: number, b: number, fi = 0.15, fo = 0.3) => ss(t, a, a + fi) * (1 - ss(t, b - fo, b));
  const travel = (a: number, d: number) => clamp((t - a) / d);
  // the reveal: one pulse from the transmitter to her ear, connecting them
  if (t < 3) return {vis: win(1.5, 2.75) * 0.9, prog: travel(1.5, 0.5)};
  // "the beam is invisible": the path shows itself, then dissolves on "invisible"
  if (t < 9) return {vis: ss(t, 7.2, 7.5) * (1 - ss(t, 7.85, 8.3)) * 0.85, prog: 1};
  // the transmitter: the path the camera follows, the sweep, the sound gathering at her
  if (t < 20.5) return {vis: win(15.35, 20.1, 0.2, 0.35), prog: travel(15.35, 0.45)};
  // eight feet: one pulse across the lane, arriving with "feet"
  if (t < 23.5) return {vis: win(21.7, 23.15), prog: travel(21.75, 0.68)};
  // the block, explained: the path, which ends where he steps into it
  if (t < 27.5) return {vis: win(25.5, 27.15), prog: 1};
  // "they're blocking it"
  if (t < 31) return {vis: win(29.3, 30.35), prog: 1};
  // he moves: the path runs on to her ear again
  return {vis: win(31.85, 32.75), prog: travel(31.9, 0.25)};
};
export const ringsAt = (t: number) => ss(t, 18.35, 18.6) * (1 - ss(t, 19.6, 19.9)) + ss(t, 22.42, 22.55) * (1 - ss(t, 22.85, 23.1)) + ss(t, 31.95, 32.1) * (1 - ss(t, 32.45, 32.7));
/** the beam's far end for a galvo angle, on her ear's plane */
const endFor = (delta: number, ear: V3) => {
  const d = beamDir(delta);
  const s = (ear.x - LENS.x) / d.x;
  return v3(LENS.x + d.x * s, ear.y, LENS.z + d.z * s);
};
/** the sweep's trace: where the beam's far end was a moment ago within this pass (the fan) */
const ghostsAt = (t: number, ear: V3): V3[] => {
  const sw = sweepAt(t);
  if (sw.phase < 0) return [];
  return [0.2, 0.14, 0.08].filter((dt) => sw.phase * (SWEEP.P - SWEEP.flyback) > dt).map((dt) => endFor(galvoAt(t - dt), ear));
};
/** the sweep's sound: wavelets sent out from each point the beam end passes, growing at the beam end's own speed, so
 *  that the wavelets of a pass all reach her ear together as the pass ends */
const waveletsAt = (t: number, ear: V3) => {
  const out: {c: V3; r: number; op: number}[] = [];
  if (t < SWEEP.t0 || t > SWEEP.t1 + 0.4) return out;
  const pass = SWEEP.P - SWEEP.flyback;
  const v = Math.abs(endFor(SWEEP.d0, ear).z - ear.z) / pass;
  const k0 = Math.floor((t - SWEEP.t0) / SWEEP.P);
  for (let k = Math.max(0, k0 - 1); k <= k0; k++) {
    const tp = SWEEP.t0 + k * SWEEP.P;
    for (let te = tp; te < Math.min(t, tp + pass); te += 0.055) {
      const sw = sweepAt(te);
      if (sw.phase < 0 || sw.on < 0.05) continue;
      const age = t - te;
      const fadeAfter = clamp(1 - (t - (tp + pass)) / 0.25);
      out.push({c: endFor(sw.delta, ear), r: v * age, op: 0.55 * sw.on * clamp(1 - age / 0.75) * fadeAfter});
    }
  }
  return out.filter((w) => w.op > 0.02);
};
/** blocked: the beam paints over his head (it ends on its near side); otherwise just behind her head when her ear is
 *  farther from the camera than her head's centre, just in front of it when nearer */
export const beamSortOf = (t: number, cam: Parameters<typeof basis>[0], blocked: boolean): BeamSort => {
  if (blocked) return {id: 'P', after: true};
  const b = basis(cam);
  const {ear, head} = earAndHead(t);
  return {id: 'L', after: depth(b, ear) <= depth(b, head)};
};
export const RoomShot: React.FC<{t: number}> = ({t}) => {
  const s = shotAt(t);
  const cam = camAt(t, s);
  const be = beamEnd(t);
  const ear = s === 'ear' ? ss(t, 5.9, 6.4) : 0;
  const bv = beamViz(t);
  return (
    <RoomScene
      t={t}
      cam={cam}
      beamSort={beamSortOf(t, cam, be.blocked)}
      beamTop={s === 'mirror' || s === 'press'}
      actors={cast(t, ear)}
      beam={{vis: bv.vis * (t > SWEEP.t0 && t < SWEEP.t1 && sweepAt(t).phase < 0 ? 0.15 : 1), prog: bv.prog, end: be.end, hit: be.blocked ? 1 : 0, rings: ringsAt(t), ghosts: be.blocked ? [] : ghostsAt(t, earOf(t)), wavelets: waveletsAt(t, earOf(t))}}
      dial={dialAt(t)}
      delta={galvoAt(t)}
      press={pressAt(t)}
      send={sendAt(t)}
      tapeLit={ss(t, 21.75, 22.43)}
    />
  );
};

export const SceneC3: React.FC<{t: number}> = ({t}) => {
  const s = shotAt(t);
  let node: React.ReactNode;
  // into the air beside her ear (the room push carries on as the molecular drawing grows from the same point), and,
  // at the end of the sequence, the same move reversed
  const inK = clamp((t - (CUT.micro - 0.45)) / 0.55);
  const outK = clamp((t - (CUT.ret - 0.05)) / 0.4);
  if ((s === 'ear' && t > CUT.micro - 0.45) || s === 'micro') {
    node = (
      <>
        {inK < 1 && <RoomShot t={Math.min(t, CUT.micro - 0.001)} />}
        <Micro t={t} grow={inK} />
      </>
    );
  } else if (s === 'ret' && outK < 1) {
    node = (
      <>
        <RoomShot t={t} />
        <Micro t={t} grow={1 - outK} />
      </>
    );
  } else node = <RoomShot t={t} />;
  return <AbsoluteFill style={{background: '#F1E6CC'}}>{node}</AbsoluteFill>;
};

export const FilmC3: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_c3', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#F1E6CC'}}>
      <SceneC3 t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmC3Still: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#F1E6CC'}}>
    <SceneC3 t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
export {DUR};
