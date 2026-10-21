// Cover 1080x1920: the opening composition (same artwork) with two large words. Not inserted into the video.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {openPose} from './rig/kin';
import {SceneDefs, TableScene} from './components/TableScene';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';

export const COVER_U = 1.75; // opening-move time used as the base (also the best in-video frame, ~1.75 s)

export const Cover: React.FC = () => {
  const pose = openPose(COVER_U);
  const cam = {cx: 585, cy: 1080, z: 1.4, ay: 1090};
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <SceneDefs />
        <g transform={`translate(540 ${cam.ay}) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
          <TableScene pose={pose} />
        </g>
        <rect x={0} y={0} width={1080} height={760} fill="url(#fgwht-cover-fade)" />
        <defs>
          <linearGradient id="fgwht-cover-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={C.navy} stopOpacity={0.92} />
            <stop offset="0.7" stopColor={C.navy} stopOpacity={0.7} />
            <stop offset="1" stopColor={C.navy} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g>
          <rect x={390} y={250} width={300} height={56} rx={28} fill="#0B1220" stroke={C.cyan} strokeWidth={3} />
          <text x={540} y={289} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={30} fill={C.cyan} letterSpacing={4}>LAB TEST</text>
        </g>
        {['WRONG', 'TARGET.'].map((w, i) => (
          <text key={w} x={540} y={462 + i * 168} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={176} fill={i === 0 ? C.text : C.hand} stroke="#050913" strokeWidth={14} paintOrder="stroke" letterSpacing={2}>
            {w}
          </text>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
