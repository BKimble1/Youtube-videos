// V2: shots that put the 2D laser illustration (LaserArt) on a 3D background: the telescope's exit window sits on
// the projected exit point and its tube is turned to the projected beam angle, so the beam leaves the aperture.
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {sm5} from '../camera';
import {ss} from '../lib';
import {axis3, add3, BEAM_DIR, Cam3, EXIT3, lerp3, lookAt, projector, TIP3, v3, V3} from './p3';
import {exitOf, LaserArt} from './LaserArt';
import {cam3For, hFollow, loopState, quietState, St3, stream, View3D} from './shots3d';
import {S} from './timeline2';

/** camera at pos with `target` placed at screen (sx, sy) */
export const camScreen = (pos: V3, target: V3, f: number, sx: number, sy: number, roll = 0): Cam3 => {
  let c: Cam3 = {...lookAt(pos, target, f), roll};
  for (let i = 0; i < 8; i++) {
    const p = projector(c)(target);
    c = {...c, yaw: c.yaw - ((sx - p.x) / f) * (180 / Math.PI) * Math.cos((c.roll ?? 0) * Math.PI / 180), pitch: c.pitch + ((sy - p.y) / f) * (180 / Math.PI)};
  }
  return c;
};
const beamScreen = (cam: Cam3) => {
  const P = projector(cam);
  const a = P(EXIT3), b = P(add3(EXIT3, v3(BEAM_DIR.x * 30, BEAM_DIR.y * 30, 0)));
  return {x: a.x, y: a.y, ang: (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI};
};

/** the 2D apparatus placed over a camera: scale k, exit on the projected exit */
const Placed: React.FC<{cam: Cam3; k: number; st: St3; t: number; id: string; detail?: 'full' | 'telescope'}> = ({cam, k, st, t, id, detail}) => {
  const b = beamScreen(cam);
  const e = exitOf(b.ang);
  return (
    <g transform={`translate(${fmt(b.x - e.x * k)} ${fmt(b.y - e.y * k)}) scale(${fmt(k)})`}>
      <LaserArt id={id} ang={b.ang} flash={st.flash} fire={st.fire * (0.7 + 0.3 * Math.abs(Math.sin(t * 9)))} t={t} detail={detail} />
    </g>
  );
};

/** H2: low on the terrace, the apparatus in the foreground aimed at the storm, the tower and the bolt beyond */
export const H2View: React.FC<{t: number}> = ({t}) => {
  const k = sm5(clamp((t - S.H2) / (S.H3 - S.H2)));
  const cam = camScreen(lerp3(v3(-72, -16.5, -34), v3(-73, -15.8, -36.5), k), EXIT3, 700, 610 - 20 * k, 1270 + 10 * k);
  const st = loopState(t);
  return (
    <g>
      <View3D id="H2" t={t} tag="h2" camOverride={cam} stOverride={st} noApparatus />
      <Placed cam={cam} k={0.62 - 0.04 * k} st={st} t={t} id="h2l" />
    </g>
  );
};

/** E1: the ending's low view: the telescope rising out of the lower corner, firing up into the clouds past the tower */
export const E1View: React.FC<{t: number}> = ({t}) => {
  const k = sm5(clamp((t - S.E1) / (S.E2 - S.E1)));
  const cam = camScreen(lerp3(v3(-58, -18.6, -14), v3(-57, -18.4, -15.5), k), add3(EXIT3, v3(BEAM_DIR.x * 26, BEAM_DIR.y * 26, 0)), 520, 560, 760 - 120 * k, -6);
  const st: St3 = {...quietState(t, 0.95), pulses: stream(t, 560, 190), tipCorona: 0.25 + 0.2 * Math.abs(Math.sin(t * 19))};
  return (
    <g>
      <View3D id="E1" t={t} tag="e1" camOverride={cam} stOverride={st} noApparatus />
      <Placed cam={cam} k={1.55} st={st} t={t} id="e1l" detail="telescope" />
    </g>
  );
};
/** F4: the 3D view plus the followed packet's glow, drawn in 2D at its projected point so it can bloom as we push in */
export const F4View: React.FC<{t: number}> = ({t}) => {
  const cam = cam3For('F4', t);
  const P = projector(cam);
  const hf = hFollow(t);
  const a = P(axis3(hf)), b = P(axis3(hf - 30));
  const ang = (Math.atan2(a.x - b.x, -(a.y - b.y)) * 180) / Math.PI;
  const zoom = ss(t, 10.98, S.M2);
  const r = 70 + 290 * zoom * zoom;
  return (
    <g>
      <View3D id="F4" t={t} tag="f4" />
      {a.ok && (
        <g style={{mixBlendMode: 'screen'}} transform={`translate(${fmt(a.x)} ${fmt(a.y)}) rotate(${fmt(ang)})`}>
          <defs>
            <radialGradient id="f4-pk">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset="0.3" stopColor="#D8C8FF" stopOpacity={0.7} />
              <stop offset="1" stopColor="#8C6CFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={0} cy={0} rx={fmt(r * 0.55)} ry={fmt(r * (1.6 - 0.9 * zoom))} fill="url(#f4-pk)" />
          <ellipse cx={0} cy={0} rx={fmt(4 + 30 * zoom)} ry={fmt(26 + 30 * zoom)} fill="#FFFFFF" opacity={0.9} />
        </g>
      )}
    </g>
  );
};
export {TIP3, ss};
