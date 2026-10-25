import React from 'react';
import {AbsoluteFill, Composition, Still} from 'remotion';
import './fonts';
import {FPS, FRAMES, H, W} from './lib';
import {BayWorld} from './scenes/BayScene';
import {climbAt} from './world/climb';
import {Film, FilmStill, Sheet} from './Film';
import {MicroTurn, MicroView} from './scenes/Micro';

/** working sheet for the micro view: 4 states side by side */
const MicroTest: React.FC = () => {
  const cam = {x: 40, y: 150, z: 2.6};
  const cells: React.ReactNode[] = [
    <MicroTurn key="t0" id="t0" alpha={0} cam={cam} y0={0} count={12} />,
    <MicroTurn key="t1" id="t1" alpha={0.5} cam={cam} y0={0} count={12} />,
    <MicroView key="m0" id="m0" st={{surface: 'glass', lam: 0, gx: 0, back: 0, glow: 0, slip: 0, y0: 0, count: 12}} cam={cam} />,
    <MicroView key="m1" id="m1" st={{surface: 'glass', lam: 0.5, gx: 0, back: 0, glow: 0, slip: 0, y0: 0, count: 12}} cam={cam} />,
    <MicroView key="m2" id="m2" st={{surface: 'glass', lam: 1, gx: 0, back: 0, glow: 1, slip: 0, y0: 0, count: 12}} cam={cam} />,
    <MicroView key="m3" id="m3" st={{surface: 'brick', lam: 0, gx: 0, back: 0, glow: 0, slip: 0, y0: 0, count: 12}} cam={cam} />,
    <MicroView key="m4" id="m4" st={{surface: 'brick', lam: 1, gx: 0, back: 0, glow: 0, slip: 0, y0: 0, count: 12}} cam={cam} />,
    <MicroTurn key="t2" id="t2" alpha={1} cam={cam} y0={0} count={12} />,
  ];
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {cells.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{c}</svg>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** working still: the bay at frame f through a given camera */
const BayTest: React.FC<{f: number; cx: number; cy: number; z: number}> = ({f, cx, cy, z}) => (
  <AbsoluteFill style={{backgroundColor: '#22303A'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <BayWorld id="bt" st={climbAt(f)} cam={{x: cx, y: cy, z}} k={1 / Math.sqrt(z)} />
    </svg>
  </AbsoluteFill>
);
/** up to 12 bay frames, 4 across at quarter size */
const BaySheet: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean}> = ({fs, cx, cy, z, follow}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = climbAt(f);
      const cam = follow ? {x: st.pose.x - 120, y: st.pose.y - 120, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld id={`bs${i}`} st={st} cam={cam} k={1 / Math.sqrt(z)} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GlassClimbing" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="MicroTest" component={MicroTest} width={W} height={1920} />
    <Still id="BayTest" component={BayTest} width={W} height={H} defaultProps={{f: 0, cx: 200, cy: -600, z: 0.85}} />
    <Still id="BaySheet" component={BaySheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], cx: 200, cy: -600, z: 0.85, follow: true}} />
  </>
);
