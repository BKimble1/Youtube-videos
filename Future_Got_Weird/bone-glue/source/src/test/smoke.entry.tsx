import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Layer} from '../camera';
import {RADIUS, ULNA, CARPALS, C1, C2, C3, jag, INCISION} from '../art/anatomy';
import {closed, open} from '../core/geo';
import {C} from '../art/palette';

const T: React.FC<{w: number; x: number; y: number}> = ({w, x, y}) => (
  <AbsoluteFill style={{background: '#20303a'}}>
    <Layer c={{x, y, w}}>
      <path d={closed(ULNA, 0.6)} fill={C.bone} stroke={C.boneInk} strokeWidth={0.5} />
      <path d={closed(RADIUS, 0.6)} fill={C.bone} stroke={C.boneInk} strokeWidth={0.5} />
      {CARPALS.map((k, i) => <ellipse key={i} cx={k.c.x} cy={k.c.y} rx={k.rx} ry={k.ry} transform={`rotate(${(k.rot * 180) / Math.PI} ${k.c.x} ${k.c.y})`} fill={C.bone} stroke={C.boneInk} strokeWidth={0.4} />)}
      {[C1, C2, C3].map((c, i) => <path key={i} d={open(jag(c), 0)} fill="none" stroke="#300" strokeWidth={0.6} />)}
      <ellipse cx={INCISION.c.x} cy={INCISION.c.y} rx={INCISION.rx} ry={INCISION.ry} fill="none" stroke="#f0f" strokeWidth={0.4} />
    </Layer>
  </AbsoluteFill>
);
registerRoot(() => <Composition id="T" component={T} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{w: 160, x: -5, y: -60}} />);
