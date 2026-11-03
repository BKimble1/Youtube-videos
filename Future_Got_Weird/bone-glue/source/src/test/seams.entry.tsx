// Geometry check for art/seams.ts (flat colours): displaced wedge, seated wedge with partial glue, full glue,
// healing growth at two stages.
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer} from '../camera';
import {resetIds, uid} from '../core/ids';
import {closed, open, P} from '../core/geo';
import {RADIUS} from '../art/anatomy';
import {SEAM_IDS, SeamId, WEDGE_POLY, WEDGE_SEATED, WedgeX, glueBand, growth, seamEdgeLine, seamLength, wedgeLerp, xfSvg, WEDGE_PRESS, xfPoint} from '../art/seams';

const RAD = closed(RADIUS, 0.55);
type S = {cam: Cam; seat: number; glue: Partial<Record<SeamId, [number, number]>>; bridge?: number};
const ALL: S['glue'] = {C1: [0, 99], C2: [0, 99], C3: [0, 99]};
const STATES: S[] = [
  {cam: {x: 2.5, y: -1.2, w: 27}, seat: 0, glue: {C1: [0, 9]}},
  {cam: {x: 2.5, y: -1.2, w: 27}, seat: 1, glue: {C1: [0, 20]}},
  {cam: {x: 2.5, y: -1.2, w: 27}, seat: 1, glue: {C1: [0, 99], C3: [0, 99]}},
  {cam: {x: 2.5, y: -1.2, w: 27}, seat: 1, glue: ALL},
  {cam: {x: 2.5, y: -1.2, w: 27}, seat: 1, glue: ALL, bridge: 0.45},
  {cam: {x: 2.5, y: -1.2, w: 27}, seat: 1, glue: ALL, bridge: 0.75},
  {cam: {x: -7, y: 1.0, w: 7.5}, seat: 1, glue: ALL},
  {cam: {x: 4, y: -6, w: 110}, seat: 1, glue: ALL},
];
const Faces: React.FC<{w: WedgeX; px: number}> = ({w, px}) => (
  <g>
    {SEAM_IDS.map((id) => {
      const L = seamLength(id);
      return ([1, -1] as const).map((side) => (
        <path key={id + side} d={open(seamEdgeLine(id, -0.6, L + 0.6, side, w), 0)} stroke="#5C4A33" strokeWidth={2.2 * px} fill="none" />
      ));
    })}
  </g>
);
const One: React.FC<{s: S; k: number}> = ({s, k}) => {
  resetIds(`s${k}_`);
  const px = s.cam.w / 1080;
  const w = wedgeLerp(s.seat);
  const rc = uid('rc'), nw = uid('nw'), wc = uid('wc');
  const inset = s.bridge ? (side: 1 | -1, sv: number, id: SeamId = 'C1') => growth(id, sv, s.bridge!, side) : undefined;
  const wedgePoly = closed(WEDGE_POLY as P[], 0);
  return (
    <AbsoluteFill style={{background: '#7a2030'}}>
      <Layer c={s.cam}>
        <defs>
          <clipPath id={rc}><path d={RAD} /></clipPath>
          <clipPath id={nw}><path d={`M-200 -200H200V400H-200Z ${wedgePoly}`} clipRule="evenodd" /></clipPath>
          <clipPath id={wc}><path d={wedgePoly} /></clipPath>
        </defs>
        <path d={RAD} fill="#3A0B14" />
        <g clipPath={`url(#${nw})`}>
          <path d={RAD} fill="#EFE3C8" stroke="#5C4A33" strokeWidth={3 * px} />
        </g>
        {/* gaps (cavity) between seated faces */}
        <g clipPath={`url(#${rc})`}>
          {SEAM_IDS.flatMap((id) => glueBand(id, -0.5, seamLength(id) + 0.5, WEDGE_SEATED, 0).map((r, i) => (
            <path key={id + i} d={closed([...r.lo, ...[...r.hi].reverse()], 0)} fill="#3A0B14" />
          )))}
        </g>
        <g transform={xfSvg(w)}>
          <g clipPath={`url(#${wc})`}>
            <path d={RAD} fill="#E9D9B8" stroke="#5C4A33" strokeWidth={3 * px} />
          </g>
        </g>
        <Faces w={w} px={px} />
        {SEAM_IDS.map((id) => {
          const g = s.glue[id];
          if (!g) return null;
          const runs = glueBand(id, g[0], Math.min(g[1], seamLength(id)), w, 0.14, inset ? (side, sv) => inset(side, sv, id) : undefined);
          return runs.map((r, i) => (
            <path key={id + i} d={closed([...r.lo, ...[...r.hi].reverse()], 0)} fill="#36B3A0" fillOpacity={0.9} stroke="#11564D" strokeWidth={1.6 * px} />
          ));
        })}
        {s.bridge && SEAM_IDS.map((id) => ([1, -1] as const).map((side) => {
          const L = seamLength(id);
          const ss: number[] = [];
          for (let v = 0; v <= L; v += 0.08) ss.push(v);
          const face = ss.map((v) => seamEdgeLine(id, v, v, side, w)[0]);
          const front = ss.map((v) => seamEdgeLine(id, v, v, side, w, -growth(id, v, s.bridge!, side))[0]);
          return <path key={id + side} d={closed([...face, ...[...front].reverse()], 0)} fill="#FFFFFF" opacity={0.95} />;
        }))}
        <circle cx={xfPoint(WEDGE_PRESS, w).x} cy={xfPoint(WEDGE_PRESS, w).y} r={0.4} fill="#B8C3CC" />
      </Layer>
    </AbsoluteFill>
  );
};
const Sheet: React.FC = () => (
  <AbsoluteFill style={{background: '#111'}}>
    {STATES.map((s, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One s={s} k={i} />
      </div>
    ))}
  </AbsoluteFill>
);
const Single: React.FC<{i: number}> = ({i}) => <One s={STATES[i]} k={i} />;
registerRoot(() => (
  <>
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={960} />
    <Composition id="One" component={Single} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 0}} />
  </>
));
