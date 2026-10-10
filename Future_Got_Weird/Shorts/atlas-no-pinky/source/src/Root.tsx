import React from 'react';
import {AbsoluteFill, Composition, Still} from 'remotion';
import {C, F, H, W} from './theme';
import {Hand, ikDigit, defOf, toLocal, HandPose} from './hand/Hand';
import {Film} from './Film';
import {Cover} from './Cover';
import {TOTAL_FRAMES, FPS} from './cues';

const PoseLab: React.FC = () => {
  const curl = (fl: number): HandPose => ({
    thumb: {ang: [-120, -112, -100], flex: [10, 20, 20]},
    index: {ang: [-100, -100, -100], flex: [fl, fl * 0.9, fl * 0.7]},
    middle: {ang: [-90, -90, -90], flex: [fl, fl * 0.9, fl * 0.7]},
    ring: {ang: [-80, -80, -80], flex: [fl, fl * 0.9, fl * 0.7]},
  });
  // side pinch of a washer
  const hx = 640, hy = 1000, s = 1.0;
  const wc = {x: hx + 250, y: hy - 10}, r = 40;
  const idx = defOf('robot', 'side', 'index')!, th = defOf('robot', 'side', 'thumb')!;
  const pinch: HandPose = {
    index: ikDigit(idx, toLocal(wc.x, wc.y - r - idx.w / 2 * 0.9, hx, hy, s), 6, -1),
    middle: {ang: [10, 40, 80]},
    ring: {ang: [10, 40, 80]},
    thumb: ikDigit(th, toLocal(wc.x, wc.y + r + th.w / 2 * 0.9, hx, hy, s), -4, 1),
  };
  return (
    <AbsoluteFill style={{background: C.paper, fontFamily: F.display}}>
     <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <Hand x={300} y={360} scale={0.95} forearm={{stand: 640}} ghostPinky={1} />
      <Hand x={780} y={360} scale={0.95} pose={curl(55)} forearm={{stand: 640}} />
      <Hand x={300} y={860} scale={0.95} kind="human" />
      <g>
        <circle cx={wc.x} cy={wc.y} r={r} fill={C.cream} stroke={C.ink} strokeWidth={5} />
        <circle cx={wc.x} cy={wc.y} r={r * 0.42} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      </g>
      <Hand view="side" x={hx} y={hy} scale={s} pose={pinch} forearm={{to: {x: -100, y: hy + 90}}} />
      <Hand view="side" kind="human" x={400} y={1500} scale={0.9} forearm={{to: {x: -100, y: 1600}}} />
     </svg>
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Still id="PoseLab" component={PoseLab} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} />
    <Composition id="Short" component={Film} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} defaultProps={{captions: false, audio: true}} />
    <Composition id="ShortCaptioned" component={Film} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} defaultProps={{captions: true, audio: true}} />
  </>
);
