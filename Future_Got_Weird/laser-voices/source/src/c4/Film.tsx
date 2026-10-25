// Laser Voices V4: the film. Each storyboard shot (shots.ts) is a camera in the one world, with its own explanatory
// overlays; the molecular sequence is its own drawing, entered from the air at her ear and left by a dissolve into the
// transmitter (the pressure waves becoming the machine that makes them).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions3} from '../v3/Captions3';
import {clamp, DUR, FPS, ss} from './lib';
import {BeamSort, RoomScene} from './Scene';
import {beamEnd, BLOCK, cast, dialAt, earAndHead, earOf, galvoAt, pressAt, sendAt, sweepAt, SWEEP} from './story';
import {basis, Cam, proj, v3, V3} from './rig/geo';
import {depth} from './art/d3';
import {beamDir} from './art/Emitter';
import {CUT, Shot, shotAt} from './shots';
import {Micro} from './Micro';
import {LENS} from './world';

/** the beam's far end on her ear's plane for a scan angle */
const endFor = (delta: number, ear: V3) => {
  const d = beamDir(delta);
  const s = (ear.x - LENS.x) / d.x;
  return v3(ear.x, ear.y + d.y * s, ear.z);
};
/** the sweep's fan: where the beam's end was a moment ago within this pass */
const ghostsAt = (t: number, ear: V3): V3[] => {
  const sw = sweepAt(t);
  if (sw.phase < 0) return [];
  return [0.2, 0.14, 0.08].filter((dt) => sw.phase * (SWEEP.P - SWEEP.flyback) > dt).map((dt) => endFor(galvoAt(t - dt), ear));
};
/** the sweep's sound: a wavelet from each point the beam's end passes, growing at the end's own speed, so all the
 *  wavelets of a pass arrive at her ear together as the pass ends */
const waveletsAt = (t: number, ear: V3) => {
  const out: {c: V3; r: number; op: number}[] = [];
  if (t < SWEEP.t0 || t > SWEEP.t1 + 0.4) return out;
  const pass = SWEEP.P - SWEEP.flyback;
  const v = Math.abs(endFor(SWEEP.d0, ear).y - ear.y) / pass;
  const k0 = Math.floor((t - SWEEP.t0) / SWEEP.P);
  for (let k = Math.max(0, k0 - 1); k <= k0; k++) {
    const tp = SWEEP.t0 + k * SWEEP.P;
    for (let te = tp; te < Math.min(t, tp + pass); te += 0.05) {
      const sw = sweepAt(te);
      if (sw.phase < 0 || sw.on < 0.05) continue;
      const age = t - te;
      out.push({c: endFor(sw.delta, ear), r: v * age, op: 0.6 * sw.on * clamp(1 - age / 0.75) * clamp(1 - (t - (tp + pass)) / 0.25)});
    }
  }
  return out.filter((w) => w.op > 0.02);
};
/** is she hearing it: the transmission is on throughout, except while his head is in the beam (cut on the frame it
 *  enters, back on the frame it leaves) */
export const hearing = (t: number) => !beamEnd(t).blocked;
/** the sound at her ear: rings that grow out from the ear while she hears it; they stop dead on the block and start
 *  again from the ear on the clear */
const SoundRings: React.FC<{cam: Cam; t: number}> = ({cam, t}) => {
  if (!hearing(t)) return null;
  const b = basis(cam);
  const p = proj(b, earOf(t));
  if (p.z < 0.05) return null;
  const R = (b.c.f * 0.05) / p.z;
  const since = t > BLOCK.t1 ? t - BLOCK.t1 : 99;
  const intro = clamp(since / 0.15);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {[0, 1, 2].map((k) => {
        const ph = (t / 0.55 + k / 3) % 1;
        if (since < 0.55 && ph > since / 0.55 + 0.02) return null;
        return <circle key={k} cx={p.x} cy={p.y} r={R * (0.5 + 2.6 * ph)} fill="none" stroke="#FFC744" strokeWidth={Math.max(2, R * 0.16) * (1 - ph)} opacity={0.9 * (1 - ph) * intro} />;
      })}
    </svg>
  );
};
export const beamSortOf = (t: number, cam: Cam, blocked: boolean): BeamSort => {
  if (blocked) return {id: 'P', after: true};
  const b = basis(cam);
  const {ear, head} = earAndHead(t);
  return {id: 'L', after: depth(b, ear) <= depth(b, head)};
};
export const RoomShot: React.FC<{t: number; shot?: Shot}> = ({t, shot = shotAt(t)}) => {
  const cam = shot.cam(t);
  const be = beamEnd(t);
  const v = shot.viz ? shot.viz(t) : {vis: 0, prog: 1};
  const sw = sweepAt(t);
  const vis = v.vis * (t > SWEEP.t0 && t < SWEEP.t1 && sw.phase < 0 ? 0.15 : 1);
  const ear = earOf(t);
  return (
    <AbsoluteFill>
      <RoomScene
        t={t}
        cam={cam}
        beamSort={beamSortOf(t, cam, be.blocked)}
        beamTop={shot.beamTop}
        actors={cast(t, shot.earCU ?? 0)}
        beam={{vis, prog: v.prog, tail: v.tail, bold: v.bold, end: be.end, hit: be.blocked ? 1 : 0, ghosts: be.blocked ? [] : ghostsAt(t, ear), wavelets: waveletsAt(t, ear)}}
        dial={dialAt(t)}
        delta={galvoAt(t)}
        press={pressAt(t)}
        send={sendAt(t)}
        tapeLit={ss(t, 21.75, 22.43)}
      />
      {shot.rings && <SoundRings cam={cam} t={t} />}
    </AbsoluteFill>
  );
};

export const SceneC4: React.FC<{t: number}> = ({t}) => {
  const shot = shotAt(t);
  let node: React.ReactNode;
  // into the air beside her ear: the room push carries on as the molecular drawing grows from the same point; out: the
  // pressure waves dissolve into the transmitter that makes them
  const inK = clamp((t - (CUT.micro - 0.45)) / 0.55);
  const outK = clamp((t - (CUT.ret - 0.02)) / 0.32);
  if (shot.micro || (shot.id.startsWith('S10') && t > CUT.micro - 0.45)) {
    node = (
      <>
        {inK < 1 && <RoomShot t={Math.min(t, CUT.micro - 0.001)} shot={shotAt(Math.min(t, CUT.micro - 0.001))} />}
        <Micro t={t} grow={inK} />
      </>
    );
  } else if (shot.id.startsWith('S18') && outK < 1) {
    node = (
      <>
        <RoomShot t={t} shot={shot} />
        <AbsoluteFill style={{opacity: 1 - outK}}><Micro t={t} grow={1} /></AbsoluteFill>
      </>
    );
  } else node = <RoomShot t={t} shot={shot} />;
  return <AbsoluteFill style={{background: '#F1E6CC'}}>{node}</AbsoluteFill>;
};

export const FilmC4: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_c4', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#F1E6CC'}}>
      <SceneC4 t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmC4Still: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#F1E6CC'}}>
    <SceneC4 t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
export {DUR};
