// A4 (90-112, "remote decides"): low side view at the insect's height (el 6). The medic (empty tube, spring extended)
// has drawn back off the fired injector, which stays in the clear target at right; on short quick tripod steps it turns
// toward us and away from the target (planted feet, no sliding), its head swinging round to screen-left, and sets off
// toward the foam course at left. The camera trucks left with it (the look point leads the insect along its heading);
// the target with the injector in it slides away at right.
import React from 'react';
import {sr, lerp} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, Injector2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, Target2D, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {A1_FACE} from '../h/A1';
import {FoamBox} from '../b/common';
import {GroundShadow} from './kitA';
import {medPose, medGear, medAt, medInjFrame, MED_INJ_REAR} from './medicA';
import {shotRange} from '../../cuts2';

const R = shotRange('A4');
const T0 = R.from / 30;
const T1 = R.to / 30;
export const A4_AZ = -6;
export const A4_EL = 6;
const S = 7.4;

/** the look point: the body plus a lead along its heading (so the frame swings left as the head comes round), eased */
const look = (t: number) => {
  const m = medAt(t);
  const lead = 16;
  return {x: m.p[0] + lead * Math.cos(m.yaw), z: m.p[2] - lead * Math.sin(m.yaw)};
};
export const a4View = (t: number): View => {
  // the camera follows the look point with a little lag (a tracking dolly, no snap)
  const u = sr(t, T0 - 0.15, T1 + 0.25);
  const a = look(T0 - 0.15), b = look(Math.min(t, T1 + 0.25) - 0.08);
  const k = 0.35 + 0.65 * u;
  const x = lerp(a.x, b.x, k);
  return viewAt(A4_AZ, A4_EL, S, [x, 10, 0], 475, 1080);
};

/** the far lab beyond the bench (scene px; blurred), parallax against the truck */
const BackWall: React.FC<{id: string; dx: number}> = ({id, dx}) => (
  <g>
    <defs>
      <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="12" />
      </filter>
    </defs>
    <g filter={`url(#${id}-bl)`}>
      <Layer cam={{x: 540 - dx, y: 960, z: 1}} depth={3.2}>
        <g transform="translate(-300 -260) scale(1.35)">
          <LabWall2 id={`${id}w`} />
        </g>
      </Layer>
    </g>
  </g>
);

export const A4Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const v = a4View(t);
  const v0 = a4View(T0);
  const pose = medPose(t);
  const truck = P(v, [0, 0, 0])[0] - P(v0, [0, 0, 0])[0];
  // the bench top: the pale tray in front of the far, darker bench (ground plane y = 0)
  const far = P(v, [0, 0, -420]);
  const trayFar = P(v, [0, 0, -190]);
  const near = P(v, [0, 0, 560]);
  const rect = (y0: number, y1: number) => `M-50,${f2(y0)} H1130 V${f2(y1)} H-50 Z`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <BackWall id={`${id}b`} dx={truck} />
      {/* bench top far of the tray, the tray, then the bench's near lip and the cabinets */}
      <path d={rect(far[1], trayFar[1] + 2)} fill={LAB2.benchTopLit} />
      <path d={rect(far[1] - 3, far[1] + 3)} fill="#FFFFFF" opacity={0.18} />
      <path d={rect(trayFar[1], near[1])} fill={LAB2.surface} />
      <path d={rect(trayFar[1], trayFar[1] + 4)} fill={LAB2.surfaceShade} />
      <path d={rect(near[1], near[1] + 26)} fill={LAB2.benchTop} stroke="#172B3A" strokeWidth={5} />
      <path d={rect(near[1] + 26, 2000)} fill={LAB2.cabinet} stroke="#172B3A" strokeWidth={5} />
      {/* another test area far down the bench at left: foam blocks (they come into view as it tracks) */}
      <FoamBox id={`${id}f1`} v={v} b={[-330, -282, 0, 34, -150, -112]} color={LAB2.foamB} />
      <FoamBox id={`${id}f2`} v={v} b={[-250, -196, 0, 24, -170, -140]} color={LAB2.foamY} />
      <Target2D id={`${id}t`} v={v} face={A1_FACE} dir={1} dent={1} />
      <Injector2D id={`${id}i`} v={v} frame={medInjFrame()} rear={MED_INJ_REAR} />
      <Target2D id={`${id}tv`} v={v} face={A1_FACE} dir={1} veil={0.62} />
      <GroundShadow pose={pose} v={v} alpha={0.2} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, shadow: 0, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={medGear(t)} />}} />
      {/* V5: near-lens foreground on the bench lip (out of focus), sliding faster than the set as the camera trucks:
          a beaker, a vial rack and a coiled lead, so the low view has depth instead of an empty tray */}
      <g filter={`url(#${id}-nf)`} transform={`translate(${f2(truck * 2.3)} 0)`}>
        <defs>
          <filter id={`${id}-nf`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
        </defs>
        <path d="M120,1290 L360,1290 L340,1940 L140,1940 Z" fill="#D9EEF2" stroke="#172B3A" strokeWidth={14} opacity={0.9} />
        <path d="M150,1560 L330,1560 L338,1940 L142,1940 Z" fill="#7FC9C2" opacity={0.75} />
        <path d="M600,1520 H1000 V1940 H600 Z" fill="#9AAAB3" stroke="#172B3A" strokeWidth={14} />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${640 + k * 92},1380 h56 v190 h-56 Z`} fill={['#F2C46A', '#E98F7A', '#BFD8E6', '#9ED0B0'][k]} stroke="#172B3A" strokeWidth={10} />
        ))}
        <path d="M-60,1760 C 120,1700 300,1820 480,1760 S 760,1700 1140,1790" fill="none" stroke="#3A4A55" strokeWidth={26} strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const A4: React.FC<ShotProps> = ({f}) => <A4Scene t={f / 30} id={`a4f${f}`} />;
