import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../fonts';
import {Micro} from '../micro/Micro';
import {setActivity} from '../micro/culture';
setActivity({stims: [{t: 1.2, cs: [26, 27, 19], pulses: 3}], resps: [{t: 1.5, cs: [32, 33, 34]}], bursts: []});
const V = [
  {t: 1.0, cx: -300, cy: -100, w: 420, scope: 0},
  {t: 1.25, cx: -300, cy: -100, w: 420, scope: 0},
  {t: 1.62, cx: -420, cy: 60, w: 520, scope: 0},
  {t: 1.62, cx: -400, cy: 0, w: 2200, scope: 0},
  {t: 1.62, cx: 0, cy: 0, w: 14000, scope: 0},
  {t: 1.62, cx: -300, cy: 0, w: 700, scope: 1},
];
const Grid: React.FC = () => (
  <AbsoluteFill style={{background: '#111'}}>
    {V.map((v, i) => {
      const s = 1080 / v.w;
      return (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 1080, top: Math.floor(i / 3) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
          <Micro t={v.t} id={`m${i}`} W={1080} H={1920} scope={v.scope} m={{sx: s, sy: s, tx: 540 - v.cx * s, ty: 960 - v.cy * s}} />
        </div>
      );
    })}
  </AbsoluteFill>
);
registerRoot(() => <Composition id="M" component={Grid} durationInFrames={1} fps={30} width={3240} height={3840} />);
