// DT (488-495, "they"): the fire insert, low over the operator's thumb. In the foreground, big and sharp, his gloved
// hand holds the research remote (the coat sleeve running up and back toward him), the thumb hovering just over the
// red fire button; beyond, softer, his head and shoulders in three-quarter, eyes on the monitor off screen left, whose
// cool glow lights the side of his face and the remote. The thumb comes down onto the cap and drives it home: the cap
// bottoms out at 16.49 s (the click), the status LED turns amber, hand and remote give a little and settle. Locked off.
import React from 'react';
import {clamp, keys} from '../../../lib/ease';
import {RemoteCloseUp, OperatorAtBench, remoteCloseUpGeometry} from '../../../crew/operator';
import {LabWall2, Bench2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {D_PRESS} from './trial';

/** the pad meets the raised cap, then drives it into its guard (bottoming out at D_PRESS) */
export const DT_CONTACT = D_PRESS - 0.06;
const pressAt = (t: number) => (t < DT_CONTACT ? 0 : t < D_PRESS ? Math.pow((t - DT_CONTACT) / (D_PRESS - DT_CONTACT), 1.6) : 1);
const liftAt = (t: number) => keys(t, [[16.26, 0.55], [16.33, 0.6], [DT_CONTACT, 0]]);
const dipAt = (t: number) => {
  const dt = t - D_PRESS;
  return dt < 0 ? Math.max(0, 1 - (D_PRESS - t) / 0.06) * 0.5 : Math.exp(-dt / 0.12) * Math.cos(dt * 18);
};
/** the close-up's placement (rotation: the forearm runs up and back toward him, beyond) */
export const DT_CU = {x: 390, y: 1470, scale: 0.95, rotation: -122};
export const dtProps = (t: number) => {
  const dip = dipAt(t);
  return {id: '', press: pressAt(t), lift: liftAt(t), led: (t >= D_PRESS + 0.01 ? 'fired' : 'armed') as 'fired' | 'armed', x: DT_CU.x + 3 * dip, y: DT_CU.y + 10 * dip, scale: DT_CU.scale, rotation: DT_CU.rotation};
};
/** where the button is on screen (for the caption check and the cue) */
export const dtButton = (t: number) => remoteCloseUpGeometry(dtProps(t)).button;
/** the operator beyond: hip point and scale */
const OP = {x: 680, y: 1580, s: 2.0};

export const DT: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const id = `dtf${f}`;
  const p = dtProps(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
        <filter id={`${id}-bo`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
        <radialGradient id={`${id}-mon`} cx="0" cy="0.36" r="0.8">
          <stop offset="0" stopColor="#D8F4FF" stopOpacity={0.85} />
          <stop offset="0.5" stopColor="#9FD8F0" stopOpacity={0.28} />
          <stop offset="1" stopColor="#9FD8F0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vg`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#0E1820" stopOpacity={0} />
          <stop offset="1" stopColor="#0E1820" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      {/* the lab far behind him, soft */}
      <rect width={1080} height={1920} fill="#CFDFE6" />
      <g filter={`url(#${id}-bl)`}>
        <g transform="translate(-420 -260) scale(1.5)">
          <LabWall2 id={`${id}w`} />
        </g>
        <Bench2 id={`${id}b`} top={1500} k={1.6} />
      </g>
      {/* the operator beyond (head and shoulders), a touch soft; no hands in this pass (his hand is the close-up's) */}
      <g filter={`url(#${id}-bo)`}>
        <OperatorAtBench id={`${id}op`} x={OP.x} y={OP.y} scale={OP.s} t={t} expr="focus" blink={0} gx={-0.85} gy={0.12} benchTopY={OP.y - 225 * OP.s} layer="body" />
      </g>
      {/* the monitor's cool glow from the left */}
      <rect width={1080} height={1920} fill={`url(#${id}-mon)`} />
      <RemoteCloseUp {...p} id={`${id}cu`} />
      <rect width={1080} height={1920} fill={`url(#${id}-vg)`} />
    </svg>
  );
};
export const dtPress = (t: number) => clamp(pressAt(t));
