// FGW "Wi-Fi Through Walls" V4: the composition. Every frame is a pure function of the frame number; captions are
// drawn in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {clamp, FPS, IdCtx, ss, useUid, word} from './lib';
import {Captions} from './Captions';
import {capY} from './captions';
import {LAB_OUT, LabScene, LB, labSil} from './v7/Lab7';
import {LAB_IN} from './v7/hero7';
import {cafeCam, CafeScene4, cafeSil, E_OUT, G_IN, heroSteps, OR_SPLIT, povCam, rxCam, splitCam, UI_IN, UI_OUT} from './v7/Cafe7';
import {StudyScene4} from './v7/Study7';
import {CafeSplitUI, SPLIT_Y} from './v7/ui';
import {LAMPS} from './v7/cafeSet7';
import {Person} from './art/person';
import {keypoints, LIMBS, COL} from './art/skeleton';
import {lerpPose} from './dc/Man';
import {basis, proj, v3} from './world/cam';

/** V6: the lab | the café street (E) | the split screen (him passing, the receiver matching him) | the street | the
 *  study corridor | its matching screen | the café street (G) and the lamp-post CCTV (H) | the CCTV picture and the
 *  receiver side by side | the lab (the ending, still, into frame 0). Joins: the skeleton becomes a silhouette that
 *  walks out of the display into the street; a lamp post passing the lens (café to study); dissolves (corridor to its
 *  screen, his tile to him at the café, the ending split to the lab). */
const SIL_A = LB.creepy + 0.1;
const SIL_OUT = LAB_OUT + 0.5;
/** V7: the receiver's screen filling the frame (its vignette and grid, as DispPicture draws them): the push into the
 *  monitor on "creepy" arrives here, and the street appears from behind it */
const Navy: React.FC<{a: number}> = ({a}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
    <defs><radialGradient id="scrfld" cx="0.5" cy="0.55" r="0.75"><stop offset="0" stopColor="#0A1C2C" /><stop offset="1" stopColor="#02070D" /></radialGradient></defs>
    <rect width={1080} height={1920} fill="url(#scrfld)" />
    {Array.from({length: 7}, (_, i) => <line key={`v${i}`} x1={i * 180} y1={0} x2={i * 180} y2={1920} stroke="#10263A" strokeWidth={4} />)}
    {Array.from({length: 11}, (_, i) => <line key={`h${i}`} x1={0} y1={i * 192} x2={1080} y2={i * 192} stroke="#10263A" strokeWidth={4} />)}
  </svg>
);
/** the silhouette: his figure filled with the radio's cyan (and its skeleton fading out of it) */
const Silhouette: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  // locked on the display's skeleton until it is filled, then it walks out into the street
  const e = ss(t, LAB_OUT - 0.15, SIL_OUT - 0.05);
  const lab = labSil(Math.min(t, LAB_OUT));
  const cafe = cafeSil(t);
  const cd = {x: lab.cd.x + (cafe.cd.x - lab.cd.x) * e, y: lab.cd.y + (cafe.cd.y - lab.cd.y) * e, k: lab.cd.k + (cafe.cd.k - lab.cd.k) * e, depth: 1};
  const p = lerpPose(lab.p, cafe.p, e);
  const a = t < LAB_OUT ? ss(t, SIL_A, SIL_A + 0.25) : 1 - ss(t, LAB_OUT + 0.05, SIL_OUT);
  const kp = keypoints(p);
  const S = (q: {x: number; y: number}) => ({x: cd.x + cd.k * q.x, y: cd.y + cd.k * q.y});
  const skA = t < LAB_OUT ? 1 - ss(t, SIL_A, LAB_OUT - 0.1) : 0;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${u}sil`} x="-30%" y="-30%" width="160%" height="160%">
          <feFlood floodColor="#5CE1FF" result="f" />
          <feComposite in="f" in2="SourceAlpha" operator="in" result="c" />
          <feGaussianBlur in="c" stdDeviation="10" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="c" /></feMerge>
        </filter>
      </defs>
      <g opacity={a} filter={`url(#${u}sil)`}>
        <Person id={`${u}silp`} cd={cd} p={p} farBehind />
      </g>
      {skA > 0 && LIMBS.map((L, i) => {
        const A = S(kp[L.a]), Bp = S(kp[L.b]);
        return <line key={i} x1={A.x} y1={A.y} x2={Bp.x} y2={Bp.y} stroke={COL[L.side]} strokeWidth={6} strokeLinecap="round" opacity={skA * a} />;
      })}
    </svg>
  );
};
/** the scene behind the wiping element's trailing edge (screen x < edge) is the next place */
const Wipe: React.FC<{edge: number; before: React.ReactNode; after: React.ReactNode}> = ({edge, before, after}) => (
  <AbsoluteFill>
    <AbsoluteFill>{after}</AbsoluteFill>
    <AbsoluteFill style={{clipPath: `inset(0 0 0 ${Math.max(0, edge).toFixed(1)}px)`}}>{before}</AbsoluteFill>
  </AbsoluteFill>
);
const lampEdge = (t: number) => {
  const b = basis(cafeCam(t));
  // the lamp's left edge (its pole is 0.12 m thick), where the study shows through
  return proj(b, v3(LAMPS[0] - 0.06, 1.2, 0.45)).x;
};
/** the lamp-post wipe: from here the lamp's edge decides (left of the frame: all café) */
const WIPE_A = UI_OUT + 0.05;
const STEPS_E = heroSteps();
/** a split screen: above, a street picture (`top`); below, the Wi-Fi receiver's laptop (it slides up from the bottom
 *  at t0). The café experiment (him passing the café, the receiver matching him) and the ending (the CCTV's picture of
 *  him, the receiver that knows him) */
const Split: React.FC<{t: number; t0: number; top: React.ReactNode; bottom: React.ReactNode}> = ({t, t0, top, bottom}) => {
  const k = ss(t, t0, t0 + 0.3);
  const y = 1920 - (1920 - SPLIT_Y) * k;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateY(${(y - SPLIT_Y).toFixed(1)}px)`, clipPath: `inset(${SPLIT_Y}px 0 0 0)`}}>{bottom}</AbsoluteFill>
      <AbsoluteFill style={{top: SPLIT_Y - 3, height: 6, backgroundColor: '#14212A', transform: `translateY(${(y - SPLIT_Y).toFixed(1)}px)`}} />
      <AbsoluteFill style={{clipPath: `inset(0 0 ${(1920 - y).toFixed(1)}px 0)`}}>{top}</AbsoluteFill>
    </AbsoluteFill>
  );
};
export const SceneAt: React.FC<{t: number}> = ({t}) => {
  if (t < SIL_A) return <LabScene t={t} />;
  if (t < LAB_OUT) return <AbsoluteFill><LabScene t={t} /><Navy a={ss(t, LAB_OUT - 0.3, LAB_OUT)} /><Silhouette t={t} /></AbsoluteFill>;
  if (t < SIL_OUT) return <AbsoluteFill><CafeScene4 t={t} /><Navy a={1 - ss(t, LAB_OUT, SIL_OUT - 0.05)} /><Silhouette t={t} /></AbsoluteFill>;
  if (t < UI_IN) return <CafeScene4 t={t} />;
  if (t < UI_OUT) return <Split t={t} t0={UI_IN} top={<CafeScene4 t={t} camOverride={splitCam(t)} />} bottom={<svg width={1080} height={1920}><CafeSplitUI t={t} steps={STEPS_E} /></svg>} />;
  if (t < WIPE_A) return <CafeScene4 t={t} />;
  if (t < E_OUT + 0.25) {
    const edge = lampEdge(t);
    if (edge >= 1080) return <StudyScene4 t={t} />;
    if (edge <= 0) return <CafeScene4 t={t} />;
    return <Wipe edge={edge} before={<CafeScene4 t={t} />} after={<StudyScene4 t={t} />} />;
  }
  // the study (its results display included); from his tile on the display to him at the café
  if (t < G_IN) return <StudyScene4 t={t} />;
  if (t < G_IN + 0.4) return <AbsoluteFill><CafeScene4 t={t} /><AbsoluteFill style={{opacity: 1 - ss(t, G_IN, G_IN + 0.4)}}><StudyScene4 t={G_IN} /></AbsoluteFill></AbsoluteFill>;
  if (t < OR_SPLIT) return <CafeScene4 t={t} />;
  // "or Wi-Fi that knows who you are": the CCTV's picture above (it slides up: its centre moves from the frame's middle
  // to the upper half's); below, the café window, the router and the receiver's laptop holding his identity, no camera
  // anywhere. Under the CCTV he stops and ducks; on the end of "are" a match cut on that duck to the same duck behind
  // the lab wall, where the screen's skeleton ducks with him: the opening's composition, into frame 0
  const ending = <Split t={t} t0={OR_SPLIT} top={<CafeScene4 t={t} camOverride={povCam(900 - 330 * ss(t, OR_SPLIT, OR_SPLIT + 0.3))} povH={1920 - 1060 * ss(t, OR_SPLIT, OR_SPLIT + 0.3)} povLook />} bottom={<CafeScene4 t={t} camOverride={rxCam(1390)} />} />;
  if (t < LAB_IN) return ending;
  return <LabScene t={t} />;
};
void word;

export const Frame: React.FC<{f: number; captions: boolean; uid?: string}> = ({f, captions, uid = ''}) => (
  // ids carry the frame number: Chrome can keep a stale mask or clip between video frames when an id is reused
  <IdCtx.Provider value={`${uid}f${Math.round(f)}_`}>
    {/* key: every frame is a fresh mount (identical to a single still) */}
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
