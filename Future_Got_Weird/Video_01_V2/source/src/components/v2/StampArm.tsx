import React from 'react';
import {C, H, OUTLINE, W} from '../../theme';
import {E, impact, kf, strike, tw} from '../../lib/motion';

/**
 * The checking hand: a point-of-view arm that rises from the bottom edge of the frame holding a rubber stamp.
 * It is always staged the same way (forearm leaving the frame bottom-right at a fixed angle), so the crop reads as
 * deliberate. Between targets it travels in a shallow arc; each strike winds up, accelerates down, squashes the stamp
 * on contact (frame `hit`), holds, and recoils. Screen space: give it screen coordinates (use worldToScreen when the
 * target lives inside a moving camera).
 *
 *   targets: [{at, x, y}] — where the stamp pad's contact point should be; the hand travels to each (arriving at `at`)
 *   hits:    contact frames (each should fall after the matching target's `at`)
 *   enter / exit: frames when the arm starts rising into frame / finishes leaving
 */
export type StampTarget = {at: number; x: number; y: number};

export const StampArm: React.FC<{
  g: number;
  targets: StampTarget[];
  hits: number[];
  enter: number;
  exit: number;
  scale?: number;
  sleeve?: string;
  skin?: string;
  inkColor?: string;
}> = ({g, targets, hits, enter, exit, scale = 1.4, sleeve = C.coral, skin = '#F7D9C4', inkColor = C.coral}) => {
  if (g < enter || g > exit + 2 || targets.length === 0) return null;
  const hover = 95 * scale;
  // travel between targets: x, y keyframed with arcs
  const moveDur = 9;
  const xs: [number, number, ((x: number) => number)?][] = [];
  const ys: [number, number, ((x: number) => number)?][] = [];
  targets.forEach((t, i) => {
    if (i === 0) {
      xs.push([t.at, t.x]);
      ys.push([t.at, t.y]);
    } else {
      xs.push([t.at - moveDur, targets[i - 1].x], [t.at, t.x, E.inOut]);
      ys.push([t.at - moveDur, targets[i - 1].y], [t.at, t.y, E.inOut]);
    }
  });
  let x = kf(g, xs);
  let y = kf(g, ys);
  // arc lift while travelling between targets
  let arc = 0;
  targets.forEach((t, i) => {
    if (i > 0 && g > t.at - moveDur && g < t.at) arc = Math.sin(((g - (t.at - moveDur)) / moveDur) * Math.PI) * 50 * scale;
  });
  // press: sum of strike envelopes (only one is active at a time)
  const press = hits.reduce((acc, h) => {
    const s = strike(g, h);
    return Math.abs(s) > Math.abs(acc) ? s : acc;
  }, 0);
  // entry from below / exit downwards
  const inT = tw(g, enter, 14, E.out);
  const outT = tw(g, exit - 12, 12, E.in);
  const off = (1 - inT) * (H + 260 - y) + outT * (H + 300 - y);
  const contactY = y - hover * (1 - press) - arc + off;
  // stamp geometry (local): contact point at (0,0); pad above it; handle above that; hand grips the handle
  const lastHit = hits.filter((h) => g >= h).pop();
  const [sx, sy] = lastHit !== undefined ? impact(g, lastHit, 0.14, 8) : [1, 1];
  const s = scale;
  const wristX = x + 6 * s;
  const wristY = contactY - 150 * s;
  // forearm leaves the frame bottom-right at a fixed angle (about 24 deg from vertical)
  const ang = (24 * Math.PI) / 180;
  const len = (H + 400 - wristY) / Math.cos(ang);
  const elbowX = wristX + Math.sin(ang) * len;
  const elbowY = wristY + Math.cos(ang) * len;
  const armW = 104 * s;
  const cuffX = wristX + Math.sin(ang) * 92 * s;
  const cuffY = wristY + Math.cos(ang) * 92 * s;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {/* forearm: outline, sleeve, skin */}
      <line x1={elbowX} y1={elbowY} x2={wristX} y2={wristY} stroke={C.ink} strokeWidth={armW + OUTLINE * 2} strokeLinecap="round" />
      <line x1={elbowX} y1={elbowY} x2={cuffX} y2={cuffY} stroke={sleeve} strokeWidth={armW} strokeLinecap="butt" />
      <line x1={cuffX} y1={cuffY} x2={wristX} y2={wristY} stroke={skin} strokeWidth={armW * 0.86} strokeLinecap="round" />
      {/* cuff band */}
      <line x1={cuffX - Math.sin(ang) * 6 * s} y1={cuffY - Math.cos(ang) * 6 * s} x2={cuffX + Math.sin(ang) * 10 * s} y2={cuffY + Math.cos(ang) * 10 * s} stroke={C.cream} strokeWidth={armW + 6 * s} strokeLinecap="butt" />
      <line x1={cuffX - Math.sin(ang) * 6 * s} y1={cuffY - Math.cos(ang) * 6 * s} x2={cuffX + Math.sin(ang) * 10 * s} y2={cuffY + Math.cos(ang) * 10 * s} stroke={C.ink} strokeWidth={3} strokeDasharray="0" opacity={0} />
      <g transform={`translate(${x} ${contactY})`}>
        {/* the stamp: squashes on contact around its pad */}
        <g transform={`scale(${sx} ${sy})`}>
          <rect x={-70 * s} y={-24 * s} width={140 * s} height={16 * s} rx={3 * s} fill={C.ink} />
          <rect x={-76 * s} y={-62 * s} width={152 * s} height={40 * s} rx={10 * s} fill={inkColor} stroke={C.ink} strokeWidth={OUTLINE} />
          <rect x={-18 * s} y={-138 * s} width={36 * s} height={80 * s} rx={12 * s} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE} />
          <circle cx={0} cy={-142 * s} r={26 * s} fill={C.wood} stroke={C.ink} strokeWidth={OUTLINE} />
        </g>
        {/* hand gripping the handle: fingers wrap the front */}
        <g transform={`translate(${6 * s} ${-150 * s + (1 - sy) * 40 * s})`}>
          <ellipse cx={0} cy={0} rx={46 * s} ry={40 * s} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
          {[-24, -8, 8, 24].map((fx, i) => (
            <rect key={i} x={fx * s - 9 * s} y={-6 * s} width={18 * s} height={34 * s} rx={9 * s} fill={skin} stroke={C.ink} strokeWidth={3} />
          ))}
          <ellipse cx={-40 * s} cy={-6 * s} rx={14 * s} ry={20 * s} fill={skin} stroke={C.ink} strokeWidth={3} transform={`rotate(20 ${-40 * s} ${-6 * s})`} />
        </g>
      </g>
    </svg>
  );
};
