// HOOK 10: "A brain implant helped this man walk again… by bypassing his spinal injury."
// One continuous 6 s scene: an experimental brain-spine interface participant steps with a walker; the camera rises to
// his head, the head turns translucent locally (motor cortex, skull implant, headset coil), then follows the decoded
// signal down his body past the injured neck segment (headset -> cable -> backpack processor -> belt transmitter ->
// implanted pulse generator -> lead -> paddle on the lower spinal cord) to the leg nerves and muscles as the step
// completes. Event times: scene/cues.ts (mirrored in tools/audio/h10.py).
import React from 'react';
import {Man, Outfit} from './rig/Man';
import {EXPR_NEUTRAL, Expr} from './rig/Head';
import {HandPose} from './rig/Hand';
import {SoftShadow} from './rig/shade';
import {Backdrop, Floor} from './scene/Env';
import {camAt} from './scene/camera';
import {HAND_Y, poseAt, walkerX} from './scene/walk';
import {WalkerSide, FRAME} from './scene/Walker';
import {framesOf, polyD, slice} from './scene/body';
import {anchorTrack, pathsOf} from './scene/paths';
import {Xray} from './scene/Xray';
import {Backpack, Headset, Wearables} from './scene/Gear';
import {GlowDefs, Train} from './scene/Pulse';
import {actAt, windowAt} from './scene/story';
import {CUE} from './scene/cues';
import {Capsule} from './rig/shade';

export const PARTICIPANT: Outfit = {
  skin: '#E9BE9C',
  hair: '#4B3A2E',
  shirt: '#7F9FB4',
  stripe: null,
  pants: '#3A4350',
  shoe: '#F2F4F5',
  crop: true,
};
const EXPR: Expr = {...EXPR_NEUTRAL, browIn: 0.35, browDown: 0.35, lid: 0.22, squint: 0.1, smile: 0.0, open: 0.03, wide: 0.9, gx: -0.7, gy: 0.55, flush: 0.12};
const GRIP: HandPose = {curl: [0.78, 0.82, 0.84, 0.86], spread: 0.12, thumb: 34, thumbCurl: 0.55};

/** repeating pulse trains down a nerve from t0 (every `every` s, each taking `dur` s) */
const Repeat: React.FC<{T: Parameters<typeof Train>[0]['T']; t: number; t0: number; every: number; dur: number; r?: number; tail?: number}> = ({T, t, t0, every, dur, r, tail}) => {
  if (t < t0) return null;
  const k0 = Math.max(0, Math.floor((t - t0 - dur * 1.2) / every));
  const k1 = Math.floor((t - t0) / every);
  const out: React.ReactNode[] = [];
  for (let k = k0; k <= k1; k++) out.push(<Train key={k} T={T} t={t} t0={t0 + k * every} t1={t0 + k * every + dur} n={1} r={r} tail={tail} />);
  return <g>{out}</g>;
};

export const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const pose = poseAt(t);
  const F = framesOf(pose);
  const Pt = pathsOf(F);
  const act = actAt(t);
  const win = windowAt(t);
  const wx = walkerX(t);
  const G = {x: wx, y: HAND_Y};
  const GF = {x: wx - 68, y: HAND_Y - 8};
  const roll = -wx;
  const world = `translate(540 960) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(3)} ${(-cam.y).toFixed(3)})`;
  const W = anchorTrack(Pt.winAnchors);
  const d0 = W.idx(win.top), d1 = W.idx(win.bot) + 0.5;
  const winPts = slice(W.T, d0, d1);
  const winD = polyD(winPts);
  const pad = win.r * 2.2 + 10;
  const bx0 = Math.min(...winPts.map((p) => p.x)) - pad, bx1 = Math.max(...winPts.map((p) => p.x)) + pad;
  const by0 = Math.min(...winPts.map((p) => p.y)) - pad, by1 = Math.max(...winPts.map((p) => p.y)) + pad;
  const box = {x: bx0.toFixed(1), y: by0.toFixed(1), width: (bx1 - bx0).toFixed(1), height: (by1 - by0).toFixed(1)};
  const ink = 5;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <GlowDefs />
      <Backdrop cam={cam} dim={0.28 * win.on} />
      <g transform={world}>
        <defs>
          <filter id="h10-wblur" filterUnits="userSpaceOnUse" {...box}>
            <feGaussianBlur stdDeviation={(win.r * 0.3 + 0.01).toFixed(2)} />
          </filter>
          <mask id="h10-win" maskUnits="userSpaceOnUse" {...box}>
            {win.r > 0.5 && <path d={winD} fill="none" stroke="#FFF" strokeWidth={(win.r * 2).toFixed(2)} strokeLinecap="round" strokeLinejoin="round" filter="url(#h10-wblur)" />}
          </mask>
        </defs>
        <Floor cx={cam.x} />
        <SoftShadow id="h10-shm" c={{x: pose.x - 40, y: 4}} rx={300} ry={22} alpha={0.35} />
        <WalkerSide id="h10-wf" G={GF} far roll={roll} ink={ink} />
        {/* cross bars joining the two side frames */}
        <g>
          {[-200, -60].map((dy, i) => (
            <Capsule key={i} id={`h10-xb${i}`} a={{x: G.x + FRAME.front - 6, y: HAND_Y + 30 - dy * 0}} b={{x: GF.x + FRAME.front - 6, y: HAND_Y + 22}} ra={6} rb={6} color="#8D9CA6" />
          )).slice(0, 1)}
          <Capsule id="h10-xb2" a={{x: G.x + FRAME.front - 10, y: -250}} b={{x: GF.x + FRAME.front - 10, y: -258}} ra={5} rb={5} color="#7F8E98" />
        </g>
        <Backpack F={F} dec={act.dec} t={t} />
        <Man id="h10-man" pose={pose} expr={EXPR} lHand={GRIP} rHand={GRIP} outfit={PARTICIPANT}
          overTorso={
            <g>
              {win.r > 0.5 && (
                <g mask="url(#h10-win)">
                  <Xray F={F} Pt={Pt} pose={pose} act={act}>
                    <Train T={Pt.natural} t={t} t0={CUE.cord0} t1={CUE.cordStop} n={2} gap={0.1} kind="nat" r={4.5} tail={50} />
                    <Train T={Pt.hop2} t={t} t0={CUE.hop2} t1={CUE.hop2 + 0.1} n={2} gap={0.05} r={4} tail={16} />
                    <Train T={Pt.lead} t={t} t0={CUE.lead0} t1={CUE.lead1} n={3} gap={0.06} r={4} tail={40} />
                    <Repeat T={Pt.femoral} t={t} t0={CUE.stim} every={0.16} dur={0.34} r={3.6} tail={44} />
                    <Repeat T={Pt.sciatic} t={t} t0={CUE.stim + 0.03} every={0.16} dur={0.4} r={4} tail={50} />
                    <Repeat T={Pt.peroneal} t={t} t0={CUE.stim + 0.3} every={0.16} dur={0.2} r={3.2} tail={30} />
                    <Train T={Pt.hop1} t={t} t0={CUE.hop1} t1={CUE.hop1 + 0.12} n={3} gap={0.05} r={3.6} tail={14} />
                  </Xray>
                </g>
              )}
              <Wearables F={F} Pt={Pt} tx={act.tx} />
              <Headset F={F} rx={act.rx} />
              <Train T={Pt.cableHead} t={t} t0={CUE.cable0} t1={CUE.cable1} n={4} gap={0.07} r={4.5} tail={60} />
              <Train T={Pt.cableBelt} t={t} t0={CUE.belt0} t1={CUE.belt1} n={4} gap={0.06} r={4.5} tail={60} />
            </g>
          }
        />
        <WalkerSide id="h10-wn" G={G} roll={roll} ink={ink} />
        <Man id="h10-mh" pose={pose} expr={EXPR} lHand={GRIP} rHand={GRIP} outfit={PARTICIPANT} handsOnly handsOnlySide="L" />
      </g>
    </svg>
  );
};

