// Test sheets for the operator (dev only).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Remote} from '../Remote';
import {RemoteCloseUp, RemoteCloseUpProps} from '../RemoteCloseUp';
import {OperatorAtBench, OperatorAtBenchProps} from '../OperatorAtBench';

const Panel: React.FC<{x: number; y: number; w: number; h: number; label: string; children: React.ReactNode; bg?: string; vb?: [number, number, number, number]}> = ({x, y, w, h, label, children, bg = '#DCE6EC', vb}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} fill={bg} />
    <svg width={w} height={h} viewBox={vb ? vb.join(' ') : `0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" overflow="hidden">{children}</svg>
    <rect width={w} height={h} fill="none" stroke="#172B3A" strokeWidth={2} />
    <text x={8} y={22} fontSize={18} fontFamily="monospace" fill="#172B3A" style={{paintOrder: 'stroke'}} stroke="#DCE6EC" strokeWidth={4}>{label}</text>
  </g>
);

export const RemoteSheet: React.FC<{tilt?: number}> = ({tilt = 35}) => (
  <AbsoluteFill style={{background: '#CFD8DE'}}>
    <svg width={1080} height={1920}>
      <Panel x={0} y={0} w={1080} h={640} label={`k=12 tilt=${tilt} press 0`}>
        <Remote id="a" view={{c: {x: 540, y: 340}, k: 12, rot: 0, tilt}} press={0} led="armed" />
      </Panel>
      <Panel x={0} y={640} w={1080} h={640} label={`k=12 tilt=${tilt} press 1 fired`}>
        <Remote id="b" view={{c: {x: 540, y: 340}, k: 12, rot: -8, tilt}} press={1} led="fired" />
      </Panel>
      {[0, 20, 45, 65, 75].map((t, i) => (
        <Panel key={i} x={i * 216} y={1280} w={216} h={320} label={`t${t}`}>
          <Remote id={`c${i}`} view={{c: {x: 108, y: 170}, k: 2.4, rot: 0, tilt: t}} press={i % 2} led={i % 2 ? 'fired' : 'armed'} />
        </Panel>
      ))}
      {[1.0, 1.4, 4].map((k, i) => (
        <Panel key={i} x={i * 360} y={1600} w={360} h={320} label={`k${k}`}>
          <Remote id={`d${i}`} view={{c: {x: 180, y: 170}, k, rot: -12, tilt: 60}} press={0} led="armed" />
        </Panel>
      ))}
    </svg>
  </AbsoluteFill>
);

/** The operator test sheet: (a) the remote alone at three sizes, (b) the close-up press / release sequence,
 *  (c) the figure at the bench at two scales, three expressions, thumb press 0 and 1. */
export const OperatorSheet: React.FC = () => {
  const cu: [string, RemoteCloseUpProps][] = [
    ['press 0', {press: 0, lift: 0, led: 'armed'}],
    ['press .5', {press: 0.5, lift: 0, led: 'armed'}],
    ['press 1', {press: 1, lift: 0, led: 'fired'}],
    ['lift .5', {press: 1, lift: 0.5, led: 'fired'}],
    ['lift 1 led .4', {press: 1, lift: 1, led: 0.4}],
  ];
  // the figure panels: a virtual 1080 x 1920 frame, cropped by each panel's viewBox
  const fx = 640;
  const fy = 1200;
  const S2 = 1.1;
  const faces: [string, OperatorAtBenchProps][] = [
    ['focus p0', {x: fx, y: fy, scale: S2, expr: 'focus', thumbPress: 0, led: 'armed'}],
    ['neutral p0', {x: fx, y: fy, scale: S2, expr: 'neutral', thumbPress: 0, led: 'armed'}],
    ['pleased p1', {x: fx, y: fy, scale: S2, expr: 'pleased', thumbPress: 1, led: 'fired'}],
    ['focus p1', {x: fx, y: fy, scale: S2, expr: 'focus', thumbPress: 1, led: 'fired', blink: 0}],
  ];
  const bench2 = fy - 40 * S2;
  return (
    <AbsoluteFill style={{background: '#CFD8DE'}}>
      <svg width={1080} height={1920}>
        {/* (a) the remote alone */}
        <Panel x={0} y={0} w={240} h={300} label="a k1.6 t58">
          <Remote id="ra0" view={{c: {x: 120, y: 170}, k: 1.6, rot: -6, tilt: 58}} led="armed" />
        </Panel>
        <Panel x={240} y={0} w={320} h={300} label="a k3.4 t35">
          <Remote id="ra1" view={{c: {x: 160, y: 170}, k: 3.4, rot: -6, tilt: 35}} led="armed" />
        </Panel>
        <Panel x={560} y={0} w={520} h={300} label="a k5.8 t35 press1 fired">
          <Remote id="ra2" view={{c: {x: 260, y: 168}, k: 5.8, rot: -6, tilt: 35}} press={1} led="fired" />
        </Panel>
        {/* (b) the close-up sequence */}
        {cu.map(([label, p], i) => (
          <Panel key={i} x={i * 216} y={300} w={216} h={480} label={`b ${label}`} vb={[262, 520, 556, 1236]}>
            <rect x={0} y={0} width={1080} height={1920} fill="#DCE6EC" />
            <RemoteCloseUp id={`cu${i}`} {...p} />
          </Panel>
        ))}
        {/* (c) the figure: full, no bench, scale .66 / 3/4 at the bench, scale 1.25 */}
        <Panel x={0} y={780} w={540} h={680} label="c full s.58 focus">
          <circle cx={90} cy={560} r={7} fill="#E8B04B" stroke="#172B3A" strokeWidth={2} />
          <OperatorAtBench id="fA" x={320} y={364} scale={0.58} expr="focus" gazeX={90} gazeY={560} t={0.3} led="armed" />
        </Panel>
        <Panel x={540} y={780} w={540} h={680} label="c bench s1.0 neutral, far hand on bench">
          <OperatorAtBench id="fB" x={330} y={662} scale={1.0} expr="neutral" benchTopY={624} farHand="bench" gazeX={70} gazeY={640} layer="body" t={1.2} led="armed" />
          <TestBench y={624} target={{x: 70}} />
          <OperatorAtBench id="fB" x={330} y={662} scale={1.0} expr="neutral" benchTopY={624} farHand="bench" gazeX={70} gazeY={640} layer="hands" t={1.2} led="armed" />
        </Panel>
        {faces.map(([label, p], i) => (
          <Panel key={i} x={i * 270} y={1460} w={270} h={460} label={`c ${label}`} vb={[fx - 330, fy - 700, 450, 767]}>
            <rect x={0} y={0} width={1080} height={1920} fill="#DCE6EC" />
            <OperatorAtBench id={`fc${i}`} {...p} benchTopY={bench2} layer="body" />
            <TestBench y={bench2} target={{x: fx - 380 * S2}} />
            <OperatorAtBench id={`fc${i}`} {...p} benchTopY={bench2} layer="hands" />
          </Panel>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** one close-up frame at full size (dev) */
export const CloseUpStill: React.FC<RemoteCloseUpProps> = (p) => (
  <AbsoluteFill style={{background: '#DCE6EC'}}>
    <svg width={1080} height={1920}>
      <RemoteCloseUp {...p} />
    </svg>
  </AbsoluteFill>
);

/** a stand-in bench for the tests: top surface band, front face, and a small target on it at screen-left */
export const TestBench: React.FC<{y: number; x0?: number; x1?: number; target?: {x: number}; depth?: number}> = ({y, x0 = -100, x1 = 1200, target, depth = 40}) => (
  <g>
    {/* benchTopY is the back edge of the top surface: the figure behind is hidden below it */}
    <rect x={x0} y={y} width={x1 - x0} height={depth} fill="#C9D6DC" stroke="#172B3A" strokeWidth={3} />
    <rect x={x0} y={y + depth} width={x1 - x0} height={2000} fill="#2F5E6B" stroke="#172B3A" strokeWidth={3} />
    {target && <rect x={target.x - 26} y={y + depth * 0.5 - 30} width={52} height={30} rx={6} fill="#E8B04B" stroke="#172B3A" strokeWidth={3} />}
  </g>
);

/** one figure at full size with the stand-in bench (dev) */
export const FigureStill: React.FC<OperatorAtBenchProps & {noBench?: boolean}> = (p) => {
  const bench = p.benchTopY;
  return (
    <AbsoluteFill style={{background: '#DCE6EC'}}>
      <svg width={1080} height={1920}>
        <OperatorAtBench {...p} layer="body" />
        {bench !== undefined && !p.noBench && <TestBench y={bench} target={{x: p.gazeX ?? p.x - 380 * (p.scale ?? 1)}} />}
        <OperatorAtBench {...p} layer="hands" />
      </svg>
    </AbsoluteFill>
  );
};
