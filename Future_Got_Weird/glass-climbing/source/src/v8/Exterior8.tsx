// Glass Climbing V8: the exterior views. The tower, the street and the traffic are either the perspective scene
// (Tower8) or, in the hero views, a still environment plate (generated in Runway from a clean render of the same scene
// at the same camera, so its geometry is the scene's; see production/v8_plates/PLATES.md). A plate is only ever used
// from the eye it was made for: a change of focal length is an exact 2D scale of the picture about its centre, and a
// small change of aim is (to within a fraction of a pixel at these angles) a 2D shift, so the plate and the 3D scene
// stay registered and the climber's pads stay on its glass. The
// climber is the hand-drawn Weird Crew character of the bay views (BayWorld, without its scenery), drawn over it at the
// scale of his depth: the bay camera is set so that the glass point between his pads lands where the perspective
// camera puts it, at the perspective's scale there. He is drawn in profile, so these cameras look along the facade
// (from the +z side, out from the glass), where a profile reads correctly.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {Cam} from '../dc/camera';
import {H, W} from '../lib';
import {kOf} from '../camera';
import {BayWorld5 as BayWorld8} from './Bay8';
import {ClimbState, PIER_Z} from './climb8';
import {KX} from '../world/geo';
import {PIER_W} from './Scenery8';
import {Cam3, fromBay, makeCam, TowerScene, UPM} from './Tower8';

/** the bay camera that puts the climber where the perspective camera sees him */
export const bayCamFor = (cam: Cam3, st: ClimbState): Cam => {
  const ref = {x: 0, y: (st.padL.y + st.padR.y) / 2};
  const s = makeCam(cam).pr(fromBay(ref.x, ref.y, 0));
  const z = cam.f / Math.max(0.05, s.d) / UPM;
  return {x: ref.x - (s.x - W / 2) / z, y: ref.y - (s.y - H / 2) / z, z};
};
/** the screen angle (deg) of the building's vertical at the climber, and its screen point: he is drawn upright to it */
export const uprightFor = (cam: Cam3, st: ClimbState) => {
  const C = makeCam(cam);
  const y = (st.padL.y + st.padR.y) / 2;
  const a = C.pr(fromBay(0, y, 0)), b = C.pr(fromBay(0, y - 300, 0));
  return {x: a.x, y: a.y, deg: (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI};
};

/** a still environment plate and the camera it was made for (same eye; the shot's camera may change f and aim) */
export type Plate = {src: string; cam: Cam3; w: number; h: number};
/** where the plate goes on screen for camera `cam`: its centre (the plate camera's aim) and its scale */
export const plateXform = (pl: Plate, cam: Cam3) => {
  const k = cam.f / pl.cam.f;
  // the plate's centre is the point its camera aims at: find where the shot's camera sees that point
  const c = makeCam(cam).pr(pl.cam.target);
  // (the plate image is fitted to the frame by width; any small aspect difference is split top and bottom)
  const w = W * k, h = (W * pl.h) / pl.w * k;
  return {left: c.x - w / 2, top: c.y - h / 2, w, h};
};
export const PlateImg: React.FC<{pl: Plate; cam: Cam3}> = ({pl, cam}) => {
  const x = plateXform(pl, cam);
  return <Img src={staticFile(pl.src)} style={{position: 'absolute', left: x.left, top: x.top, width: x.w, height: x.h}} />;
};

/** (V8) where the brick pier beside his bay must sit in the 3D scene (metres along the facade) for this camera, so that
 *  its perspective position matches where the 2D drawing (the bay's flat oblique projection, x + KX z) puts brick: the
 *  pad that goes onto the brick then lands on brick in the exterior views too */
export const matchedPier = (cam: Cam3, st: ClimbState): [number, number] => {
  const bc = bayCamFor(cam, st);
  const C = makeCam(cam);
  const y = st.padL.y;
  const x0 = C.pr(fromBay(0, y, 0)).x;
  const solve = (zb: number) => {
    const want = KX * zb * bc.z; // screen px from the glass line in the 2D drawing
    let lo = 0, hi = 4;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const dx = C.pr(fromBay(0, y, mid * UPM)).x - x0;
      if ((dx - want) * Math.sign(want) < 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  return [solve(PIER_Z), solve(PIER_Z + PIER_W)];
};

export const Exterior8: React.FC<{id: string; f: number; cam: Cam3; st: ClimbState | null; detail?: number; plate?: Plate | null; brickMatch?: ClimbState | null}> = ({id, f, cam, st, detail = 1, plate, brickMatch}) => {
  const bc = st ? bayCamFor(cam, st) : null;
  const up = st ? uprightFor(cam, st) : null;
  return (
    <>
      {plate ? <PlateImg pl={plate} cam={cam} /> : <TowerScene id={`${id}-t`} cam={cam} f={f} st={null} detail={detail} nearPier={brickMatch ? matchedPier(cam, brickMatch) : null} />}
      {st && bc && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <g transform={`rotate(${up ? up.deg.toFixed(3) : 0} ${up ? up.x.toFixed(2) : 0} ${up ? up.y.toFixed(2) : 0})`}>
            <BayWorld8 id={`${id}-m`} st={st} cam={bc} k={kOf(Math.min(bc.z, 8))} f={f} scenery={false} />
          </g>
        </svg>
      )}
    </>
  );
};
