// V4 reference stills: the V4 eel (head vs tail) and the two screen-space hand-off contracts.
//   npx remotion still src/v4/test/ref.entry.tsx EelRef out.png
//   npx remotion still src/v4/test/ref.entry.tsx CarryRef out.png --props='{"t":5.78}'
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {C, INK} from '../../art/palette';
import {alongPath, Eel2D, N, path2} from '../eelV4';
import {carryTail, EDGE, pokeTail} from '../timing';
import {Eel} from '../../art/eelArt';
import {RADII, EYE_SCALE} from '../eelV4';

const EelRef: React.FC = () => {
  resetIds('r');
  // a straight eel and an S-curved eel, both in eel units, scaled 16 px per unit
  const straight = path2(Array.from({length: 60}, (_, i) => ({x: 4 + i, y: 30})));
  const sCurve = path2(Array.from({length: 200}, (_, i) => ({x: 6 + i * 0.3, y: 70 + 7 * Math.sin(i * 0.05)})));
  return (
    <AbsoluteFill style={{background: C.waterMid}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform="scale(16)">
          <Eel2D pts={alongPath(straight, 58)} px={16} t={0} />
          <Eel2D pts={alongPath(sCurve, 60)} px={16} t={0.3} />
        </g>
        <g transform="translate(-100,-900) scale(40)">
          <Eel2D pts={alongPath(straight, 58)} px={40} t={0} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
const CarryRef: React.FC<{t: number; which: 'carry' | 'poke'}> = ({t, which}) => {
  resetIds('c');
  const c = which === 'carry' ? carryTail(t) : pokeTail(t);
  // full-length radii array: the renderer needs the whole body; draw only the contract section
  const pts = Array.from({length: N + 1}, (_, i) => (i < c.i0 ? c.pts[0] : c.pts[i - c.i0]));
  // extend the body straight back from the contract section (so the section is drawn mid-body, not a capped stub)
  const d0 = {x: c.pts[0].x - c.pts[1].x, y: c.pts[0].y - c.pts[1].y};
  const l = Math.hypot(d0.x, d0.y) || 1;
  for (let i = c.i0 - 1; i >= 0; i--) pts[i] = {x: pts[i + 1].x + (d0.x / l) * (c.pts.length > 1 ? l : 1), y: pts[i + 1].y + (d0.y / l) * l};
  const k = which === 'carry' ? 55 : 60;
  return (
    <AbsoluteFill style={{background: which === 'carry' ? '#5a2a2a' : '#203040'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`scale(${k})`}>
          <Eel pts={pts.map((p) => ({x: p.x / k, y: p.y / k}))} radii={RADII} px={k} t={t} from={c.i0} eyeScale={EYE_SCALE} />
        </g>
        {which === 'poke' && <polyline points={EDGE.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#FFD84A" strokeWidth={3} />}
        <rect x={0} y={0} width={1080} height={500} fill="#fff" fillOpacity={0.12} />
        <text x={30} y={1880} fontSize={40} fill="#fff">{`${which} t=${t}`}</text>
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <>
    <Composition id="EelRef" component={EelRef} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CarryRef" component={CarryRef} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 5.78, which: 'carry' as 'carry' | 'poke'}} />
  </>
);
registerRoot(Root);
