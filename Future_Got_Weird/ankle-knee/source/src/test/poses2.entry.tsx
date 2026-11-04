import React from 'react';
import {Composition, registerRoot} from 'remotion';
import '../fonts';
import {Wyatt2, BOpts} from '../v2/body';
import {kickPose, railPose, recoveryPose, strideAt, happy, focus} from '../v2/poses';
import {EXPR_NEUTRAL} from '../dc/Head';

const P = [
  {p: kickPose({H: {x: 0, y: -71}, stag: {x: -15, y: -0.8}, fFoot: {x: -13, y: -7.7}, nearPA: {x: 27, y: -31}, nearPitch: 58, chest: -4, pelvis: 2, aN: {sh: -38, el: 28}, aF: {sh: 58, el: 62}}), o: {shoeN: 'cleat', shoeF: 'cleat', socket: {clear: 1, local: 0}}, cy: -60},
  {p: railPose({x: 0, u: 1, railN: {x: -19, y: -66}, railF: {x: -28, y: -70}, expr: focus}), o: {shoeN: 'sneaker', shoeF: 'sneaker', socket: {clear: 0, local: 1}, shirt: '#7FB8E8', shorts: '#2E3F5C'}, cy: -60},
  {p: recoveryPose({H: {x: 0, y: -30}, expr: {...EXPR_NEUTRAL, smile: 0.4, gx: -0.6, gy: 0.8}, blink: 0, neck: 20}), o: {shoeN: 'bare', shoeF: 'bare', prosthesis: false, shirt: '#A9D3E8', shorts: '#A9D3E8', sock: null}, cy: -45},
  {p: strideAt({H: {x: 0, y: -71}, nP: {x: 14, y: -9.5}, nPitch: 68, fP: {x: -30, y: -15}, fPitch: 100, lean: 14, swing: 1, expr: happy}), o: {shoeN: 'cleat', shoeF: 'cleat', socket: {clear: 0, local: 0}}, cy: -62},
];
const Test: React.FC<{sil: boolean}> = ({sil}) => {
  const w = 540, h = 960, s = 4.6;
  return (
    <div style={{width: 1080, height: 1920, background: sil ? '#fff' : '#d9eaf1', position: 'relative'}}>
      {P.map((q, i) => (
        <svg key={i} width={w} height={h} style={{position: 'absolute', left: (i % 2) * w, top: Math.floor(i / 2) * h}}>
          <line x1={0} x2={w} y1={h / 2 + (0 - q.cy) * s} y2={h / 2 + (0 - q.cy) * s} stroke="#999" />
          <g transform={`translate(${w / 2} ${h / 2}) scale(${s}) translate(0 ${-q.cy})`}>
            <Wyatt2 p={q.p} o={{id: `p${i}`, px: 1 / s, prosthesis: true, silhouette: sil, ...(q.o as Partial<BOpts>)} as BOpts} />
          </g>
        </svg>
      ))}
    </div>
  );
};
registerRoot(() => <Composition id="P2" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{sil: false}} />);
