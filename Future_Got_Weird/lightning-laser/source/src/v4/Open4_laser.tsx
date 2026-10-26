// V4: the detailed 2D telescope (V3's LaserArt3, unchanged) composited on the projected exit window EXIT3, at its
// physical size and upright in the world.
//   V3 placed it at k0 1.4 at its LOW reference camera, which made it about 38 m long (its foot far down the rock).
//   V4 sets it on the laser terrace beside the summit station, so it has to agree with the building's human scale:
//   one art unit is TEL4_UNIT metres, which stands the mount's foot on the terrace (V3's rock: -19.2 m) under the
//   exit (-16.46 m): a 2.3 m telescope on its fork mount.
//   The art is turned so its vertical follows the projected world vertical at the exit (a low, wide camera looking up
//   tilts verticals), and the tube inside it is turned to the projected beam, so the tube always lies on the beam.
import React from 'react';
import {fmt} from '../dc/math';
import {add3, BEAM_DIR, Cam3, EXIT3, projector, v3} from '../v2/p3';
import {exitOf3, LaserArt3} from '../v3/Open3_laser';

/** metres per LaserArt3 unit: the exit sits ~503 units above the art's ground, 2.74 m above the terrace */
export const TEL4_UNIT = (EXIT3.y + 19.2) / 503;
const along = (d: number) => add3(EXIT3, v3(BEAM_DIR.x * d, BEAM_DIR.y * d, BEAM_DIR.z * d));
const DEG = 180 / Math.PI;

/** the telescope's screen placement: exit point, scale (px per art unit), the art's rotation and the tube's angle in it */
export const telescopeOnScreen = (cam: Cam3) => {
  const P = projector(cam);
  const a = P(EXIT3), b = P(along(3)), u = P(add3(EXIT3, v3(0, -2.7, 0)));
  const ok = a.ok && b.ok && u.ok && a.z > 0.5;
  const beamAng = Math.atan2(b.x - a.x, -(b.y - a.y)) * DEG;
  // the projected world vertical through the exit (from the foot up to the exit)
  const vAng = Math.atan2(a.x - u.x, -(a.y - u.y)) * DEG;
  return {x: a.x, y: a.y, z: a.z, ok, k: (TEL4_UNIT * cam.f) / Math.max(a.z, 0.5), rot: vAng, ang: beamAng - vAng, foot: u};
};

export const PlacedLaser4: React.FC<{cam: Cam3; flash: number; fire: number; tick: number; t: number; id: string}> = ({cam, flash, fire, tick, t, id}) => {
  const s = telescopeOnScreen(cam);
  if (!s.ok) return null;
  const k = s.k;
  // off screen: the exit's glow reaches ~170 units round the window, the tube and mount ~700 below or beside it
  if (s.y - 200 * k > 1920 || s.y + 800 * k < 0 || s.x + 700 * k < 0 || s.x - 700 * k > 1080) return null;
  const e = exitOf3(s.ang);
  return (
    <g transform={`translate(${fmt(s.x)} ${fmt(s.y)}) rotate(${fmt(s.rot)}) scale(${fmt(k)}) translate(${fmt(-e.x)} ${fmt(-e.y)})`}>
      <LaserArt3 id={id} ang={s.ang} flash={flash} fire={fire} tick={tick} t={t} detail="telescope" />
    </g>
  );
};
