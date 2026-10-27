// A1 (0-54, "This cockroach can fire a needle."): the hook. A macro three-quarter view in the middle of the experiment:
// the living medic fills the frame, its launch tube aimed at a soft silicone target a few millimetres ahead, the
// nichrome coil already glowing. It is finishing its last step as the film opens (frame 0 continues F5's walk: the
// loop). On "fire" the line parts, the spring snaps forward and the injector extends along the tube, the needle sinking
// into the silicone; the body recoils a little on its planted feet and the spring rings down. One slow push toward the
// needle and the target through the whole shot.
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {INJ} from '../../../rig/gear';
import {clamp, sr, keys} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, deployAt} from '../../roach/Gear2D';
import {viewAt, View} from '../../roach/ortho';
import {LabWall2, Bench2, Surface2D, Target2D, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {word} from '../../../timeline';
import {ShotProps} from '../index2';

/** the firing stance: body origin at world x = 0 heading +x, the target face 40 mm ahead */
export const A1_FACE = 40;
export const A1_TRAVEL = A1_FACE + 5 - (INJ.barrelLen + 1.2 + INJ.needleLen) - INJ.loadedRear;
export const A1_FIRE = word('fire', 0).start + 0.01;
const S_STOP = plantedStop(36);
/** the walk into the stance: still moving at frame 0, planted by 0.34 s (before frame 0 it is F5's approach) */
export const a1Walk = (t: number) => {
  const V0 = (26 * 2.2) / 1.09;
  const s = t < -0.75 ? S_STOP - 26 + V0 * (t + 0.75) : S_STOP - 26 * Math.pow(1 - clamp((t + 0.75) / 1.09), 2.2);
  return s;
};
const PATH = straightPath([-S_STOP, 0, 0], 0);
export const a1Pose = (t: number): RoachPose => {
  const d = deployAt(t, A1_FIRE, A1_TRAVEL);
  return poseRoach({
    path: PATH, s: a1Walk(t), t, search: 0.7,
    offset: [-1.4 * d.recoil, -0.3 * d.recoil, 0],
    antL: {yaw: 0.95, pitch: 0.45}, antR: {yaw: 0.95, pitch: 0.45},
  });
};
/** the view: three-quarter from the insect's left front, pushing in slowly toward the tube mouth / target */
export const A1_AZ = 12, A1_EL = 16;
export const a1View = (t: number): View => {
  const u = sr(t, -0.2, 1.9);
  const s = 15.5 + 2.6 * u;
  const at: [number, number, number] = [16 + 12 * u, 16, 0];
  return viewAt(A1_AZ, A1_EL, s, at, 500 - 20 * u, 960);
};

export const A1Scene: React.FC<{t: number; id: string; hand?: React.ReactNode; back?: React.ReactNode}> = ({t, id, back}) => {
  const v = a1View(t);
  const pose = a1Pose(t);
  const d = deployAt(t, A1_FIRE, A1_TRAVEL);
  const imp = d.impact;
  const jig = imp >= 0 ? Math.exp(-imp / 0.07) * Math.sin(imp * 60) : 0;
  const cam = {x: 540, y: 960, z: 1};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {back ?? (
        <g>
          <g filter={`url(#${id}-bl)`}>
            <defs>
              <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            <Layer cam={cam} depth={1}>
              <g transform="translate(-160 -260) scale(1.25)">
                <LabWall2 id={`${id}w`} />
              </g>
            </Layer>
          </g>
          <Bench2 id={`${id}b`} top={1080} k={1.4} />
        </g>
      )}
      <Surface2D v={v} x0={-400} x1={400} z0={-160} z1={140} color={LAB2.surface} />
      <g transform={jig ? `translate(${(jig * 2).toFixed(2)} 0)` : undefined}>
        <Target2D id={`${id}t`} v={v} face={A1_FACE} dir={1} dent={imp >= 0 ? 1 : 0} />
      </g>
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector', injRear: d.injRear, latched: d.latched, heat: d.heat, led: d.heat > 0.2 ? 1 : 0}} />}} />
      <g transform={jig ? `translate(${(jig * 2).toFixed(2)} 0)` : undefined}>
        <Target2D id={`${id}tv`} v={v} face={A1_FACE} dir={1} veil={0.62} />
      </g>
    </svg>
  );
};

export const A1: React.FC<ShotProps> = ({f}) => <A1Scene t={f / 30} id="a1" />;
void keys;
