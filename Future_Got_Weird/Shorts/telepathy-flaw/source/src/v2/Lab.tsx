// Development stills: draw one piece of the V2 art at a chosen camera (props: scene, x, y, z). Not part of the film.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Column, X0, SURF0} from './art/Column';
import {Layer} from '../lib/camera';
import {Room} from '../art/Room';
import {SenderP} from './art/Profile';
import {EXPR_NEUTRAL} from '../art/Head';

export const Lab: React.FC<{scene: string; x?: number; y?: number; z?: number; a?: number; k?: number}> = ({scene, x = 0, y = 0, z = 10, a = 0}) => {
  const cam = {x: 540 + x, y: 960 + y, z};
  if (scene === 'column') {
    // the column drawn alone in head units centred on (540,960): camera x,y in head units
    const par = {x, y};
    return (
      <AbsoluteFill style={{backgroundColor: '#DDEBF2'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <g transform={`translate(540 960) scale(${z}) translate(${-x} ${-y})`}>
            <rect x={-300} y={-300} width={600} height={600} fill="#DDEBF2" />
            <Column id="L" pulses={[{k: 3, u: 0.4}, {k: 4, u: 0.7, red: 0}, {k: 5, u: 0.2}]} dec={[{u: a}]} glow={0.8} dim={0.3} lens={0.8} lensRed={0} distort={0} gates={[0.4, 0, 0]} active={[0, 0, 0, 1, 0.6, 0.8]} par={par} detail={1} wide />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }
  if (scene === 'profile') {
    const c = {x: 260, y: 800};
    const par = {x: (cam.x - c.x) / 1.3, y: (cam.y - c.y) / 1.3};
    return (
      <AbsoluteFill style={{backgroundColor: '#DDEBF2'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <Layer cam={cam} depth={1.45}>
            <Room />
          </Layer>
          <Layer cam={cam} depth={1}>
            <SenderP id="s" c={c} R={130} pose={{roll: 0, shiftX: 0, shiftY: 0, reach: 0, reachTo: {x: 400, y: 1000}, press: 0, sway: 0}} expr={{...EXPR_NEUTRAL, smile: 0.1}} aperture={a} lens={0.7} lensRed={0}
              column={{id: 'x', pulses: [{k: 3, u: 0.5}, {k: 5, u: 0.2}], dec: [], glow: 0.5, dim: 0.2, lens: 0.7, lensRed: 0, distort: 0, active: [0, 0, 0, 1, 0.5, 0.6], par, detail: z > 3 ? 1 : 0}} />
          </Layer>
        </svg>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{backgroundColor: '#fff'}}>{void cam}{void Layer}{void Room}{void X0}{void SURF0}</AbsoluteFill>;
};
