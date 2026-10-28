// FGW "Wi-Fi Through Walls" V1: the composition. Every frame is a pure function of the frame number; captions are
// drawn in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {FPS, IdCtx} from './lib';
import {Captions} from './Captions';
import {capY} from './captions';
import {LAB_OUT, LabScene} from './v3/Lab3';
import {END0} from './v3/hero3';
import {cafeCam, CafeScene3, E_OUT, H_IN, panelEdge} from './v3/Cafe3';
import {StudyScene3} from './v3/Study3';
import {basis} from './world/cam';
import {clamp} from './lib';

/** the lab (hook to the push into the skeleton) | the café (E) | the study | the café (H) | the lab (the ending, into
 *  frame 0). Joins: a glow match (the skeleton's head keypoint becomes the café router's status light); the ad panel
 *  wiping past the lens (café to study, café to lab, both matched on his walk); a screen match (the study display to
 *  the café laptop). */
const Glow: React.FC<{a: number}> = ({a}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(240,255,255,${a}) 0%, rgba(150,240,255,${a * 0.85}) ${f1(8 + 30 * a)}%, rgba(20,40,60,${a * 0.6}) ${f1(30 + 60 * a)}%, rgba(10,20,30,0) 100%)`}} />
);
const f1 = (n: number) => n.toFixed(1);
/** the scene behind the panel's trailing edge (screen x < edge) is the next place */
const Wipe: React.FC<{edge: number; before: React.ReactNode; after: React.ReactNode}> = ({edge, before, after}) => (
  <AbsoluteFill>
    <AbsoluteFill>{after}</AbsoluteFill>
    <AbsoluteFill style={{clipPath: `inset(0 0 0 ${Math.max(0, edge).toFixed(1)}px)`}}>{before}</AbsoluteFill>
  </AbsoluteFill>
);
export const SceneAt: React.FC<{t: number}> = ({t}) => {
  // lab -> café: the push into the head keypoint ends in light; the café opens on the router's light
  if (t < LAB_OUT) return <AbsoluteFill><LabScene t={t} />{t > LAB_OUT - 0.3 && <Glow a={clamp((t - (LAB_OUT - 0.3)) / 0.3)} />}</AbsoluteFill>;
  if (t < LAB_OUT + 0.35) return <AbsoluteFill><CafeScene3 t={t} /><Glow a={1 - clamp((t - LAB_OUT) / 0.35)} /></AbsoluteFill>;
  // café -> study and café -> lab: the ad panel
  const wipe = (tt: number, next: React.ReactNode) => {
    const edge = panelEdge(basis(cafeCam(tt)));
    if (edge >= 1080) return next;
    if (edge <= 0) return <CafeScene3 t={tt} />;
    return <Wipe edge={edge} before={<CafeScene3 t={tt} />} after={next} />;
  };
  if (t < E_OUT - 0.7) return <CafeScene3 t={t} />;
  if (t < E_OUT + 0.3) return wipe(t, <StudyScene3 t={t} />);
  if (t < H_IN) return <StudyScene3 t={t} />;
  // study -> café: through the display into the café laptop's screen
  if (t < H_IN + 0.2) return <AbsoluteFill><CafeScene3 t={t} /><AbsoluteFill style={{opacity: 1 - clamp((t - H_IN) / 0.2)}}><StudyScene3 t={t} /></AbsoluteFill></AbsoluteFill>;
  if (t < END0 - 0.7) return <CafeScene3 t={t} />;
  if (t < END0 + 0.25) return wipe(t, <LabScene t={t} />);
  return <LabScene t={t} />;
};

export const Frame: React.FC<{f: number; captions: boolean; uid?: string}> = ({f, captions, uid = ''}) => (
  // ids carry the frame number: Chrome can keep a stale mask or clip between video frames when an id is reused
  <IdCtx.Provider value={`${uid}f${Math.round(f)}_`}>
    {/* key: every frame is a fresh mount (identical to a single still); reusing the DOM left ghost paint of masked
        sleeves from earlier frames in the video render */}
    <AbsoluteFill key={Math.round(f)} style={{backgroundColor: '#14212A', overflow: 'hidden'}}>
      <SceneAt t={f / FPS} />
      {captions && <Captions t={f / FPS} cy={capY(f / FPS)} />}
    </AbsoluteFill>
  </IdCtx.Provider>
);
export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame f={t * FPS} captions={captions} />;
/** contact sheet: up to 12 frames (frame numbers), 4 across at quarter size */
export const Sheet: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame f={f} captions={captions} uid={`c${i}_`} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
