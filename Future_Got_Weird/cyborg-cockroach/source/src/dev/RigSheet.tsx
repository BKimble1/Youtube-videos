// Rig test sheet: the cockroach from the cameras the film uses, plus a walk strip (feet must stay planted).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lookAt, Cam} from '../lib/cam';
import {V3} from '../lib/v3';
import {poseRoach, straightPath, splinePath} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear} from '../rig/Gear';

const Panel: React.FC<{x: number; y: number; w: number; h: number; label: string; children: React.ReactNode}> = ({x, y, w, h, label, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} fill="#E9E2D3" stroke="#172B3A" strokeWidth={2} />
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">{children}</svg>
    <text x={12} y={28} fontSize={22} fontFamily="monospace" fill="#172B3A">{label}</text>
  </g>
);

export const RigSheet: React.FC<{t?: number; big?: number}> = ({t: tp, big}) => {
  const fr = useCurrentFrame();
  const t = tp ?? fr / 30;
  const W = 540, H = 640;
  const path = straightPath([0, 0, 0], 0);
  const s = 20 + t * 40;
  const pose = poseRoach({path, s, t, search: 0.8});
  const o = pose.frame.o;
  const at = (dx: number, dy: number, dz: number): V3 => [o[0] + dx, o[1] + dy, o[2] + dz];
  const views: [string, Cam][] = [
    ['3/4 front low', lookAt(at(150, 30, -150), at(0, 10, 0), 900, W / 2, H / 2 + 40)],
    ['side (left)', lookAt(at(0, 25, -260), at(-4, 10, 0), 900, W / 2, H / 2)],
    ['top', lookAt(at(0, 300, 0.01), at(-4, 0, 0), 900, W / 2, H / 2)],
    ['front', lookAt(at(220, 30, 0), at(0, 10, 0), 900, W / 2, H / 2)],
    ['rear 3/4 high', lookAt(at(-170, 150, 120), at(0, 6, 0), 900, W / 2, H / 2)],
    ['ground 3/4 right', lookAt(at(140, 14, 160), at(0, 12, 0), 900, W / 2, H / 2 + 40)],
  ];
  if (big !== undefined) {
    const [label, c0] = views[big];
    const cam = {...c0, f: c0.f * 2, cx: 540, cy: 960};
    return (
      <AbsoluteFill style={{background: '#CFC6B4'}}>
        <svg width={1080} height={1920}>
          <Panel x={0} y={0} w={1080} h={1920} label={label}>
            <Roach pose={pose} cam={cam} o={{id: 'big', gear: <Gear id="bg" cam={cam} f={pose.frame} g={{kind: big >= 4 ? 'camera' : 'injector', loaded: true, latched: true, pulses: {antL: [0.55]}, zap: {antL: 0.6}}} />}} />
          </Panel>
        </svg>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: '#CFC6B4'}}>
      <svg width={1080} height={1920}>
        {views.map(([label, cam], i) => {
          const lp = {...cam};
          return (
            <Panel key={i} x={(i % 2) * W} y={Math.floor(i / 2) * H} w={W} h={H} label={label}>
              <Roach pose={pose} cam={lp} o={{id: `r${i}`, gear: <Gear id={`g${i}`} cam={lp} f={pose.frame} g={{kind: i >= 4 ? 'camera' : 'injector', loaded: true, latched: true}} />}} />
            </Panel>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** walk strip: one camera, 8 frames across a stride, to check planted feet */
export const WalkStrip: React.FC = () => {
  const W = 540, H = 480;
  const path = splinePath([[0, 0], [60, 0], [110, -25], [150, -70]]);
  return (
    <AbsoluteFill style={{background: '#CFC6B4'}}>
      <svg width={1080} height={1920}>
        {Array.from({length: 8}, (_, i) => {
          const t = i * 0.12;
          const s = 30 + t * 60;
          const pose = poseRoach({path, s, t, search: 0.6});
          const cam = lookAt([60, 230, 100], [70, 0, -20], 700, W / 2, H / 2);
          return (
            <Panel key={i} x={(i % 2) * W} y={Math.floor(i / 2) * H} w={W} h={H} label={`t=${t.toFixed(2)} s=${s.toFixed(0)}`}>
              <Roach pose={pose} cam={cam} o={{id: `w${i}`}} />
              {pose.legs.map((l, k) => {
                const p = (cam as any) && l.foot;
                return null;
              })}
            </Panel>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
