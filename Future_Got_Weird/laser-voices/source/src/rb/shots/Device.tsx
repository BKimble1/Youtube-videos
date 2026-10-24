// 15.0-17.8 "Now, sweeping that beam at exactly the right speed": back along the path into the emitter.
//  15.0-15.45 a fast move back up the path (out of the canal, past the molecules), arriving at the lens
//  15.45-17.8 the emitter, close: the camera eases round it while its side panel turns to x-ray: the diode's pulses,
//             the collimator, the wedge prism that spins to sweep the beam (on "sweeping"; faster, then locked on
//             "exactly the right speed" as the operator's hand turns the rear dial), the objective; the swept beam
//             leaves the lens
import React from 'react';
import {Layer} from '../lib/camera';
import {clamp, fmt, lerp} from '../lib/math';
import {Emitter, lensPoint, LENS_X, LENS_Y} from '../art/Emitter';
import {proj, v3} from '../lib/p3';
import {E_FOCUS, E_REST, mixExpr} from '../art/Face';
import {HAND_CLUTCH} from '../art/Hand';
import {Person, Pose} from '../art/Person';
import {RoomReverse} from '../art/Lab';
import {OPERATOR, OPERATOR_FIT} from '../cast';
import {blinkAt, breath, eio, ss} from './common';

/** the prism's angle: still, then spinning up on "sweeping", faster through "exactly", locked at "right speed" */
export const prismAngle = (t: number) => {
  // integrate a speed profile (deg/s)
  const speed = (u: number) => 900 * ss(15.55, 16.0, u) + 900 * ss(16.55, 17.2, u);
  let a = 0;
  const dt = 1 / 120;
  for (let u = 15.4; u < t; u += dt) a += speed(u) * dt;
  return a;
};

export const DeviceShot: React.FC<{t: number}> = ({t}) => {
  const orbit = eio(clamp((t - 15.45) / 2.35));
  const yaw = lerp(34, 58, orbit);
  const k = lerp(26, 30, orbit);
  const view = {ox: 620, oy: 1130, k, yaw, pitch: lerp(12, 16, orbit), f: 160};
  const xray = ss(15.7, 16.2, t);
  const prism = prismAngle(t);
  const dial = (prism / 9) % 360;
  const lens = lensPoint(view);
  // arrival: the whole frame slides in from the left (the move up the path), blurred while fast
  const arrive = clamp((t - 15.0) / 0.45);
  const slide = (1 - eio(arrive)) * 1400;
  const blur = 16 * Math.sin(Math.PI * clamp(arrive));
  // the swept beam leaving the lens: an instructional path that wavers a few degrees with the prism
  const sweep = Math.sin((prism * Math.PI) / 180) * 4 * ss(15.6, 16.0, t);
  const ahead = proj(view, v3(LENS_X + 30, LENS_Y, 30 * Math.tan((sweep * Math.PI) / 180)));
  const dl = Math.hypot(ahead.x - lens.x, ahead.y - lens.y) || 1;
  const out = {x: lens.x + ((ahead.x - lens.x) / dl) * 1600, y: lens.y + ((ahead.y - lens.y) / dl) * 1600};
  // the operator behind the device (soft focus), her hand on the dial
  const op: Pose = {
    x: 790, y: 1180, s: 1.15, yaw: 0.85, head: -0.25, lean: 8, chest: 6, nod: 10, roll: 0, shrug: 0,
    nU: 260, nV: 260, fU: 220, fV: 330, nElb: 1, fElb: 1, nWr: -10 + 15 * Math.sin(t * 3), fWr: 0,
    nAx: 810, nAy: 2500, fAx: 730, fAy: 2500, breath: breath(t + 1),
  };
  return (
    <g>
      <defs>
        <filter id="dv-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <filter id="dv-mb" x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation={`${fmt(blur)} 0`} />
        </filter>
      </defs>
      <Layer cam={{x: 540 - slide * 0.25, y: 960, z: 1}} depth={1.8}>
        <RoomReverse id="dvr" t={t} floorY={1500} blur={8} />
      </Layer>
      <g transform={`translate(${fmt(slide)} 0)`} filter={blur > 0.5 ? 'url(#dv-mb)' : undefined}>
        <g filter="url(#dv-blur)" opacity={0.85}>
          <Person id="dvo" pose={op} look={OPERATOR} fit={OPERATOR_FIT} expr={mixExpr({...E_FOCUS, gy: 0.6}, E_REST, 0)} blink={blinkAt(t, [16.4])} nHand={HAND_CLUTCH} />
        </g>
        <Emitter id="dvE" view={view} led={1} dial={dial} xray={xray} prism={prism} slide={Math.sin(t * 2) * 0.3} pedestal={false} inner={xray} t={t} />
        {/* the beam out of the lens (instructional), sweeping with the prism */}
        <g opacity={ss(15.55, 15.8, t)}>
          <line x1={fmt(lens.x)} y1={fmt(lens.y)} x2={fmt(out.x)} y2={fmt(out.y)} stroke="#FFAA5E" strokeWidth={5} strokeDasharray="18 13" strokeDashoffset={fmt(-t * 160)} opacity={0.85} strokeLinecap="round" />
          <line x1={fmt(lens.x)} y1={fmt(lens.y)} x2={fmt(out.x)} y2={fmt(out.y)} stroke="#FF8A3D" strokeWidth={22} opacity={0.12} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
};
