// FGW "Wi-Fi Through Walls" V4: the composition. Every frame is a pure function of the frame number; captions are
// drawn in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {clamp, FPS, IdCtx, ss, useUid, word} from './lib';
import {Captions} from './Captions';
import {capY} from './captions';
import {LAB_OUT, LabScene, LB, labSil} from './v10/Lab10';
import {LAB_IN} from './v10/hero10';
import {cafeCam, CafeScene4, cafeSil, CF, E_OUT, G_BACK, G_IN, heroSteps, heroStepsG, heroX, OR_SPLIT, POV_IN, povCam, rxCam, splitCam, UI_IN, UI_OUT} from './v10/Cafe10';
import {StudyScene4} from './v10/Study10';
import {CafeSplitUI, ReturnUI, SPLIT_Y} from './v10/ui';
import {LAMPS, PATH_Z, RXANT} from './v10/cafeSet10';
import {Person} from './art/person';
import {BodyGlow, keypoints, LIMBS, COL} from './art/skeleton';
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
/** V8: the tracked figure leaving the screen is joints and limbs only (what the radio infers), never an outline of his
 *  appearance: the skeleton walks out of the screen into the street, where it fades as the separate study begins */
const Silhouette: React.FC<{t: number}> = ({t}) => {
  const e = ss(t, LAB_OUT - 0.15, SIL_OUT - 0.05);
  const lab = labSil(Math.min(t, LAB_OUT));
  const cafe = cafeSil(t);
  const cd = {x: lab.cd.x + (cafe.cd.x - lab.cd.x) * e, y: lab.cd.y + (cafe.cd.y - lab.cd.y) * e, k: lab.cd.k + (cafe.cd.k - lab.cd.k) * e};
  const p = lerpPose(lab.p, cafe.p, e);
  const a = t < LAB_OUT ? ss(t, SIL_A, SIL_A + 0.2) : 1 - ss(t, SIL_OUT - 0.2, SIL_OUT);
  const kp = keypoints(p);
  const S = (q: {x: number; y: number}) => ({x: cd.x + cd.k * q.x, y: cd.y + cd.k * q.y});
  const w = Math.max(5, cd.k * 26);
  const M = Object.fromEntries(Object.entries(kp).map(([k, q]) => [k, S(q)])) as typeof kp;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      {/* V9: the same generic glowing body as on the screen */}
      <BodyGlow kp={M} m={cd.k * 600} soft={0.8} />
      <g style={{mixBlendMode: 'screen'}}>
        {LIMBS.map((L, i) => {
          const A = S(kp[L.a]), Bp = S(kp[L.b]);
          return <line key={`g${i}`} x1={A.x} y1={A.y} x2={Bp.x} y2={Bp.y} stroke={COL[L.side]} strokeWidth={w * 2.5} strokeLinecap="round" opacity={0.24} />;
        })}
      </g>
      {LIMBS.map((L, i) => {
        const A = S(kp[L.a]), Bp = S(kp[L.b]);
        return <line key={i} x1={A.x} y1={A.y} x2={Bp.x} y2={Bp.y} stroke={COL[L.side]} strokeWidth={w} strokeLinecap="round" />;
      })}
      {Object.entries(kp).map(([k, q]) => {
        const P = S(q);
        return <circle key={k} cx={P.x} cy={P.y} r={w * (k === 'head' ? 1.9 : 1.05)} fill="#FFFFFF" />;
      })}
    </svg>
  );
};
/** "In a separate experiment": a plain tag that marks the change of study (top of frame, clear of the captions) */
const StudyTag: React.FC<{t: number; t0: number; t1: number; text: string; sub?: string}> = ({t, t0, t1, text, sub}) => {
  const a = ss(t, t0, t0 + 0.2) * (1 - ss(t, t1 - 0.25, t1));
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', opacity: a, transform: `translateY(${(1 - ss(t, t0, t0 + 0.25)) * -20}px)`}}>
      <div style={{background: 'rgba(8,14,22,0.88)', border: '4px solid #FFD84A', borderRadius: 22, padding: '14px 34px', textAlign: 'center', fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif'}}>
        <div style={{color: '#FFD84A', fontWeight: 900, fontSize: 58, letterSpacing: '0.06em'}}>{text}</div>
        {sub && <div style={{color: '#DCE7EE', fontWeight: 800, fontSize: 34, marginTop: 2}}>{sub}</div>}
      </div>
    </div>
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
const STEPS_E = heroSteps(), STEPS_G = heroStepsG();
/** the return visit: the new signal starts arriving, and the same ID (on "recognizes") */
const G_NEW = CF.cafe, G_SAME = CF.recognizes;
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
  // the return visit (hypothetical, as the narration says; later, at dusk): above, he walks past the café again; below,
  // the receiver's laptop: his SAVED RECORD #12 is still there, a NEW SIGNAL arrives, SAME ID: #12. Then him, unaware
  const ret = <Split t={t} t0={G_IN - 1} top={<CafeScene4 t={t} />} bottom={<svg width={1080} height={1920}><ReturnUI t={t} tNew={G_NEW} tSame={G_SAME} steps={STEPS_G} /></svg>} />;
  if (t < G_IN + 0.4) return <AbsoluteFill>{ret}<AbsoluteFill style={{opacity: 1 - ss(t, G_IN, G_IN + 0.4)}}><StudyScene4 t={G_IN} /></AbsoluteFill></AbsoluteFill>;
  if (t < G_BACK) return ret;
  if (t < OR_SPLIT) return <CafeScene4 t={t} />;
  // "or Wi-Fi that knows who you are": the CCTV's picture above (it slides up: its centre moves from the frame's middle
  // to the upper half's); below, the café window, the router and the receiver's laptop holding his identity, no camera
  // anywhere. Under the CCTV he stops and ducks; on the end of "are" a match cut on that duck to the same duck behind
  // the lab wall, where the screen's skeleton ducks with him: the opening's composition, into frame 0
  const k = ss(t, OR_SPLIT, OR_SPLIT + 0.3);
  const ending = <Split t={t} t0={OR_SPLIT} top={<CafeScene4 t={t} camOverride={povCam(900 - 520 * k)} povH={1920 - 1160 * k} povLook />} bottom={<AbsoluteFill><CafeScene4 t={t} camOverride={rxCam(1340)} /><WifiEchoes t={t} /></AbsoluteFill>} />;
  if (t < LAB_IN) return ending;
  return <LabScene t={t} />;
};
void word;

/** the few plain labels the story needs: SEPARATE STUDY (the identity experiment is not the pose demo), LATER (the
 *  return visit), and the two alternatives of the closing question, CAMERA and WI-FI */
const Chip: React.FC<{x: number; y: number; text: string; a: number; color?: string}> = ({x, y, text, a, color = '#FFFFFF'}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity: a, background: 'rgba(8,14,22,0.85)', border: `4px solid ${color}`, borderRadius: 18, padding: '6px 26px',
    fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 56, letterSpacing: '0.08em', color}}>{text}</div>
);
/** the WI-FI alternative's signal: echoes from him (outside, to the left) arriving at the receiver's antennas */
const WifiEchoes: React.FC<{t: number}> = ({t}) => {
  const b = basis(rxCam(1340));
  // the receiver's antenna tips (its box top is at table height + 0.09, the antennas reach + 0.25)
  const E = proj(b, v3(RXANT.x, 0.99, RXANT.z));
  // V9: they start right under him (where he walks in the picture above), so the signal visibly runs from him to the
  // receiver
  const hx = Math.max(160, Math.min(760, proj(basis(povCam(380)), v3(heroX(t), 0.3, PATH_Z)).x));
  const trains = [0, 1, 2, 3].map((k) => {
    const u = (((t - OR_SPLIT) * 0.8 + k / 4) % 1 + 1) % 1;
    const S = {x: hx - 90 + k * 60, y: SPLIT_Y + 30};
    const P = {x: S.x + (E.x - S.x) * u, y: S.y + (E.y - S.y) * u};
    const dx = E.x - S.x, dy = E.y - S.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const pts: string[] = [];
    for (let j = 0; j <= 24; j++) {
      const sj = j / 24, along = -150 + 150 * sj, o = Math.sin(sj * Math.PI * 5 - t * 18) * 16 * Math.sin(Math.PI * sj);
      pts.push(`${(P.x + ux * along - uy * o).toFixed(1)},${(P.y + uy * along + ux * o).toFixed(1)}`);
    }
    return {pts: pts.join(' '), a: Math.sin(Math.PI * u)};
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {trains.map((q, i) => (
        <g key={i} opacity={q.a}>
          <polyline points={q.pts} fill="none" stroke="#7A5A00" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          <polyline points={q.pts} fill="none" stroke="#FFE27A" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
};
const Tags: React.FC<{t: number}> = ({t}) => {
  const later = ss(t, G_IN + 0.3, G_IN + 0.5) * (1 - ss(t, G_BACK - 0.2, G_BACK));
  const camA = t >= POV_IN && t < LAB_IN ? ss(t, POV_IN + 0.05, POV_IN + 0.25) : 0;
  const wifiA = t >= OR_SPLIT && t < LAB_IN ? ss(t, OR_SPLIT + 0.2, OR_SPLIT + 0.4) : 0;
  return (
    <AbsoluteFill>
      {camA > 0 && <Chip x={60} y={205} text="CAMERA" a={camA} />}
      {wifiA > 0 && <Chip x={60} y={SPLIT_Y + 24} text="WI-FI" a={wifiA} color="#7CFFB2" />}
    </AbsoluteFill>
  );
};
export const Frame: React.FC<{f: number; captions: boolean; uid?: string}> = ({f, captions, uid = ''}) => (
  // ids carry the frame number: Chrome can keep a stale mask or clip between video frames when an id is reused
  <IdCtx.Provider value={`${uid}f${Math.round(f)}_`}>
    {/* key: every frame is a fresh mount (identical to a single still) */}
    <AbsoluteFill key={Math.round(f)} style={{backgroundColor: '#14212A', overflow: 'hidden'}}>
      <SceneAt t={f / FPS} />
      <Tags t={f / FPS} />
      {/* the closing caption ends at the cut back to the lab (the opening composition carries no caption) */}
      {captions && f / FPS < LAB_IN && <Captions t={f / FPS} cy={capY(f / FPS)} />}
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
