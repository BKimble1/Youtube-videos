import React from 'react';
import {Composition, registerRoot} from 'remotion';
import '../fonts';
import {Wyatt, WPose} from '../art/wyatt';
import {EXPR_NEUTRAL} from '../dc/Head';
import {resetIds} from '../core/ids';

const base: WPose = {x: 0, y: -71, lean: 4, near: {hip: 14, knee: 55, ank: -8}, far: {hip: -6, knee: 16, ank: -6}, stagger: 3, aN: {sh: -25, el: 30}, aF: {sh: 30, el: 25}, neck: 4, turn: 0.9, expr: {...EXPR_NEUTRAL, smile: 0.5}, blink: 0};
const poses: [WPose, number][] = [
  [base, 1],
  [{...base, near: {hip: 0, knee: 0, ank: 0}, far: {hip: 0, knee: 0, ank: 0}, lean: 0, aN: {sh: 0, el: 10}, aF: {sh: 0, el: 10}}, 1],
  [{...base, near: {hip: 60, knee: 5, ank: 10}}, 1],
  [{...base, y: -48, lean: 10, near: {hip: 88, knee: 85, ank: 0}, far: {hip: 88, knee: 88, ank: 0}, aN: {sh: 20, el: 40}, aF: {sh: 20, el: 40}}, 1],
];
const Test: React.FC<{zoom: number; cx: number; cy: number}> = ({zoom, cx, cy}) => {
  resetIds('t');
  const w = 1080 / 2, h = 1920 / 2;
  return (
    <div style={{width: 1080, height: 1920, background: '#cfe6ef', position: 'relative'}}>
      {poses.map(([p], i) => {
        const s = zoom;
        return (
          <svg key={i} width={w} height={h} style={{position: 'absolute', left: (i % 2) * w, top: Math.floor(i / 2) * h}}>
            <rect x={0} y={h * 0.5 + (0 - cy) * s} width={w} height={h} fill="#6cae58" />
            <g transform={`translate(${w / 2} ${h / 2}) scale(${s}) translate(${-cx} ${-cy})`}>
              <Wyatt p={p} o={{id: `w${i}`, px: 1 / s, cut: 1}} />
            </g>
          </svg>
        );
      })}
    </div>
  );
};
registerRoot(() => <Composition id="Rig" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{zoom: 16, cx: -2, cy: -30}} />);
