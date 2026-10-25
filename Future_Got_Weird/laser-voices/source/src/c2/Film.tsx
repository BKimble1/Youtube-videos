// Laser Voices, Rebuild V2: the film. Room shots render the one world (Scene) from the shot's camera; the micro
// sequence and the emitter's optics are their own drawings, entered by continuous camera moves.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions3} from '../v3/Captions3';
import {clamp, DUR, FPS, ss} from './lib';
import {RoomScene} from './Scene';
import {beamEnd, cast, earAndHead} from './story';
import {basis} from './rig/geo';
import {depth} from './art/d3';
import {BeamSort} from './Scene';
import {camAt, CUT, shotAt} from './shots';
import {Micro} from './Micro';
import {Optics} from './Optics';

/** how visible the beam's drawn path is: a faint hint at the start (and at the loop point), gone on "invisible", drawn
 *  in full after the micro sequence */
export const beamVis = (t: number) => {
  if (t < 7.85) return 0.35;
  if (t < CUT.optics) return 0.35 * (1 - ss(t, 7.85, 8.25));
  if (t < 32.6) return 1;
  return 1 - 0.65 * ss(t, 32.6, 33.6);
};
/** sweep amplitude (m, at the ear) while "sweeping that beam" and "concentrates" are on */
export const sweepAt = (t: number) => ss(t, 15.5, 15.8) * (1 - ss(t, 19.6, 20.1));

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
  const ear = s === 'ear' ? ss(t, CUT.s4, CUT.s4 + 0.4) : 0;
  const rings = be.blocked ? 0 : ss(t, 17.9, 18.4) * (1 - ss(t, 19.8, 20.2)) + (t > 31.87 && t < 33.4 ? ss(t, 31.87, 32.1) * (1 - ss(t, 33.0, 33.4)) : 0);
  return (
    <RoomScene
      t={t}
      cam={cam}
      beamSort={beamSortOf(t, cam, be.blocked)}
      actors={cast(t, ear)}
      beam={{vis: beamVis(t), end: be.end, hit: be.blocked ? 1 : 0, sweep: sweepAt(t), rings}}
      dial={-40 * ss(t, 15.5, 17.4)}
      tapeLit={ss(t, 22.05, 22.95)}
    />
  );
};

export const SceneC2: React.FC<{t: number}> = ({t}) => {
  const s = shotAt(t);
  let node: React.ReactNode;
  if (s === 'micro' || (s === 'ear' && t > CUT.micro - 0.45)) {
    // the push into the ear carries on into the air beside the canal: the micro drawing grows from that point
    const k = clamp((t - (CUT.micro - 0.45)) / 0.55);
    node = (
      <>
        {k < 1 && <RoomShot t={Math.min(t, CUT.micro - 0.001)} />}
        <Micro t={t} grow={k} />
      </>
    );
  } else if (s === 'optics') node = <Optics t={t} />;
  else node = <RoomShot t={t} />;
  return <AbsoluteFill style={{background: '#F1E6CC'}}>{node}</AbsoluteFill>;
};

export const FilmC2: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_c2', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#F1E6CC'}}>
      <SceneC2 t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmC2Still: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#F1E6CC'}}>
    <SceneC2 t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
export {DUR};
