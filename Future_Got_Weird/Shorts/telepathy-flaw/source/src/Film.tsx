// The Telepathy Flaw film: the story world (shots/Scene.tsx) plus, over its last second, the loop layer - the opening
// head scene revealed by a circular wipe that grows out of the delivery icon - and the screen-fixed overlays.
// Captioned master = captions on; clean version = captions off (device UI and the opening cue stay).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Tag} from './art/Ui';
import {SENDER_C, SENDER_R} from './art/Figures';
import {patchWorld} from './art/Section';
import {Captions, FictionCue} from './shots/Overlay';
import {World} from './shots/Scene';
import {camAt, HUD_C, loopCamAt, motorTag, senderState} from './lib/choreo';
import {toScreen} from './lib/camera';
import {easeInQuad, inv, lerp} from './lib/math';
import {mix} from './lib/color';
import {B, FPS, TOTAL} from './lib/timeline';
import './fonts';

/** the iris of the closing wipe at frame f: centre (screen), radius, 0..1 progress */
export const irisAt = (f: number) => {
  const t = f / FPS;
  const w = inv(B.wipeFrom, B.wipeTo, t);
  const cam = camAt(f);
  const c = toScreen(cam, {x: HUD_C.x - 121, y: HUD_C.y + 96});
  return {c, r: w <= 0 ? 0 : lerp(26, 2500, easeInQuad(w)), w};
};

export const Film: React.FC<{captions: boolean}> = ({captions}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f);
  const iris = irisAt(f);
  const covered = iris.r > 2300;
  const tag = motorTag(t);
  const ss = senderState(t);
  const hc = {x: SENDER_C.x + ss.shiftX * 0.7, y: SENDER_C.y + ss.shiftY * 0.7};
  const pw = patchWorld(hc, SENDER_R, ss.roll, ss.turn, 0.5, 0);
  const ps = toScreen(cam, pw);
  return (
    <AbsoluteFill style={{backgroundColor: '#DDEBF2'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {!covered && <World p="a" t={t} cam={cam} />}
        {iris.r > 0 && (
          <g>
            <defs>
              <clipPath id="iris">
                <circle cx={iris.c.x.toFixed(1)} cy={iris.c.y.toFixed(1)} r={iris.r.toFixed(1)} />
              </clipPath>
            </defs>
            <g clipPath="url(#iris)">
              <World p="b" t={(f - TOTAL) / FPS} cam={loopCamAt((f - TOTAL) / FPS)} />
            </g>
            {iris.r < 2300 && (
              <g>
                <circle cx={iris.c.x.toFixed(1)} cy={iris.c.y.toFixed(1)} r={iris.r.toFixed(1)} fill="none" stroke={mix('#EF3340', '#46CFFF', Math.min(1, iris.w * 1.8))} strokeWidth={Math.max(6, 30 * (1 - iris.w))} opacity={0.9} />
                <circle cx={iris.c.x.toFixed(1)} cy={iris.c.y.toFixed(1)} r={iris.r.toFixed(1)} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.8} />
              </g>
            )}
          </g>
        )}
        {/* the one label for the motor-cortex reveal, in screen space so it stays readable */}
        {tag > 0.01 && (
          <g>
            <line x1={ps.x + 12} y1={ps.y - 10} x2={ps.x + 118} y2={ps.y - 96} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.9 * tag} />
            <circle cx={ps.x + 10} cy={ps.y - 9} r={7} fill="#FFFFFF" stroke="#172B3A" strokeWidth={2.5} opacity={tag} />
            <rect x={ps.x + 112} y={ps.y - 138} width={352} height={68} rx={34} fill="#172B3A" opacity={0.88 * tag} />
            <Tag c={{x: ps.x + 128, y: ps.y - 92}} text="Motor cortex" alpha={tag} size={46} />
          </g>
        )}
        <FictionCue f={f} />
        {captions && <Captions f={f} />}
      </svg>
    </AbsoluteFill>
  );
};
