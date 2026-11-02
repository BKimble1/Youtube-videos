import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../../fonts';
import {Capsule2, flightPath, noseRot, Trail, FLIGHT} from '../craft';
import {BlackHole} from '../../art/space';

const States: React.FC = () => (
  <AbsoluteFill style={{background: '#203040'}}>
    <svg width={1080} height={1920}>
      <g transform="translate(270 700) scale(0.62)"><Capsule2 t={0.3} id="a" flame={1} glow={1} win={<circle r={60} cx={0} cy={-468} fill="#3A6" />} /></g>
      <g transform="translate(810 700) scale(0.62)"><Capsule2 t={0.3} id="b" retro={1} legs={1} /></g>
      <g transform="translate(270 1500) scale(0.62)"><Capsule2 t={0.3} id="c" legs={1} hatch={1} /></g>
      <g transform="translate(640 1500) scale(0.4)"><Capsule2 t={0.3} id="d" bank={-0.8} flame={0.6} /></g>
      <g transform="translate(900 1500) scale(0.4)"><Capsule2 t={0.3} id="e" bank={0.8} flame={0.6} /></g>
    </svg>
  </AbsoluteFill>
);
const Flight: React.FC = () => {
  const z = 30;
  const u = 0.55;
  const p = flightPath(u);
  return (
    <AbsoluteFill style={{background: '#0B0E1D'}}>
      <svg width={1080} height={1920}>
        <g transform={`translate(540 1180) scale(${z})`}>
          <BlackHole t={2.6} />
          <Trail u={u} id="tr" px={z} />
          {[0.05, 0.25, 0.85, 1].map((uu) => {
            const q = flightPath(uu);
            return <g key={uu} transform={`translate(${q.x} ${q.y}) rotate(${noseRot(q.ang)}) scale(${q.scale / 600})`} opacity={0.35}><Capsule2 t={0} id={`s${uu}`} /></g>;
          })}
          <g transform={`translate(${p.x} ${p.y}) rotate(${noseRot(p.ang)}) scale(${p.scale / 600})`}><Capsule2 t={2.6} id="f" flame={1} glow={1} /></g>
          <circle cx={FLIGHT.cx} cy={FLIGHT.cy} r={0.3} fill="red" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <>
    <Composition id="CraftStates" component={States} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CraftFlight" component={Flight} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
