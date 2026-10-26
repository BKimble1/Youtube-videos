// V3: the 3D site through a camera, on the V3 scene art (Scene3.tsx). Same model as V2 (v2/p3.ts), so every view of
// the summit, tower, beam and bolt agrees. A view can be zoomed about a screen point (zoomAbout) without scaling its
// strokes, which the hand-offs to and from the molecular views use.
import React from 'react';
import {clamp} from '../dc/math';
import {BOLT3, Cam3, EXIT3, len3, projector, sub3, TIP3, v3, V3, add3, axis3} from '../v2/p3';
import {G} from '../world/site';
import {Apparatus3D, Beam3D, Discharge3D, FlashWash, Sky3D, Tower3D} from './Scene3';
import {PAL} from './palette';
import {tau3} from './timeline3';
import {BOLT3V} from './bolt3';
import {SiteExtras} from './features3';

export type St = {
  s: number; // leader length along BOLT3 (m); <= 0: no discharge
  core: number; // discharge brightness (0..1.6)
  flash: number; // scene light from the discharge (0..1)
  beam: number; // laser line opacity
  pulses: number[]; // packet positions (site px along the axis, see v2/shots3d stream)
  channel: number; // prepared-air haze strength
  channelTop?: number; // haze extends from the tip to this axis height (site px)
  tipCorona: number;
  bracket?: number; // 0..1 growth of the 160+ ft bracket on the guided section
  label?: number; // label opacity
  apparatus?: boolean; // draw the crude 3D apparatus (wides only; close views composite LaserArt)
};

/** a camera zoomed by Z about screen point (px, py): the point stays put, everything else spreads from it */
export const zoomAbout = (cam: Cam3, px: number, py: number, Z: number): Cam3 => {
  const cx = cam.cx ?? 540, cy = cam.cy ?? 960;
  return {...cam, f: cam.f * Z, cx: px - Z * (px - cx), cy: py - Z * (py - cy)};
};

/** screen position and on-screen direction (degrees clockwise from straight up) of the beam axis at height h */
export const beamOnScreen = (cam: Cam3, h: number) => {
  const P = projector(cam);
  const a = P(axis3(h)), b = P(axis3(h + 20));
  return {x: a.x, y: a.y, ang: (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI, ok: a.ok && b.ok};
};

/** the 160+ ft bracket beside the guided section, attached in 3D (it stays on the segment as the camera moves) */
const Bracket3 = ({cam, k, label}: {cam: Cam3; k: number; label: number}) => {
  if (k <= 0) return null;
  const P = projector(cam);
  const off = (h: number, o: number): V3 => add3(axis3(h), v3(o * 0.951, -o * 0.309, 0));
  const a = P(off(0, 7)), b = P(off(G * k, 7));
  const ta = [P(off(0, 4.5)), P(off(0, 9.5))], tb = [P(off(G, 4.5)), P(off(G, 9.5))];
  const m = P(off(G / 2, 14));
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#0B151C" strokeOpacity={0.6} strokeWidth={9} strokeLinecap="round" />
      <g stroke="#FFE27A" strokeWidth={5} strokeLinecap="round">
        <line x1={ta[0].x} y1={ta[0].y} x2={ta[1].x} y2={ta[1].y} />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        {k >= 1 && <line x1={tb[0].x} y1={tb[0].y} x2={tb[1].x} y2={tb[1].y} />}
      </g>
      {label > 0 && (
        <text x={m.x} y={m.y} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={56} fill="#FFE27A" stroke="#0B151C" strokeWidth={10} paintOrder="stroke" opacity={label} dominantBaseline="middle">
          160+ ft
        </text>
      )}
    </g>
  );
};

/** corona at the rod tip before a leader incepts: short violet sparks that flicker in and out */
export const TipCorona3 = ({cam, k, t}: {cam: Cam3; k: number; t: number}) => {
  if (k <= 0.02) return null;
  const P = projector(cam);
  const tip = P(TIP3);
  if (!tip.ok) return null;
  const sc = clamp((cam.f * 1.0) / tip.z, 2, 70);
  const sparks = Array.from({length: 7}, (_, i) => {
    const on = Math.sin(t * (31 + i * 7) + i * 2.1) > 0.2;
    if (!on) return null;
    const a = -90 + (i - 3) * 24 + 10 * Math.sin(t * 17 + i);
    const L = sc * (0.8 + 0.6 * Math.abs(Math.sin(t * 13 + i * 3)));
    const r = (a * Math.PI) / 180;
    const mx = tip.x + Math.cos(r) * L * 0.5 + Math.sin(t * 40 + i) * sc * 0.15, my = tip.y + Math.sin(r) * L * 0.5;
    return `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${mx.toFixed(1)},${my.toFixed(1)} L${(tip.x + Math.cos(r) * L).toFixed(1)},${(tip.y + Math.sin(r) * L).toFixed(1)}`;
  }).filter(Boolean) as string[];
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={k}>
      <circle cx={tip.x} cy={tip.y} r={sc * 1.3} fill={PAL.mid} opacity={0.22} />
      <path d={sparks.join(' ')} fill="none" stroke="#E6E0FF" strokeWidth={Math.max(1.4, sc * 0.08)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** the site: sky and summit, tower, (crude 3D apparatus in wides), beam and prepared air, corona, discharge, bracket */
/** dk fades the discharge (0..1, default 1); rain scales the rain (default 1). The flash wash is drawn under the
 *  discharge, so it can never wash out the bolt's core or the bracket label. */
export const View3: React.FC<{cam: Cam3; st: St; t: number; tag: string; children?: React.ReactNode; dk?: number; rain?: number}> = ({cam, st, t, tag, children, dk = 1, rain = 1}) => {
  const top = st.s > 0 ? BOLT3V.pts[Math.max(0, BOLT3V.pts.findIndex((p) => p.s >= Math.min(st.s, BOLT3V.total)))] : undefined;
  const drift = tau3(t);
  const apFirst = len3(sub3(EXIT3, cam.pos)) > len3(sub3(v3(0, 60, 0), cam.pos));
  const Extra = React.useContext(SiteExtras);
  return (
    <g>
      <Sky3D cam={cam} flash={st.flash} boltTop={top} drift={drift} rainT={drift + 40} rain={rain} />
      {Extra && <Extra cam={cam} flash={st.flash} t={t} layer="back" id={`${tag}-xb`} />}
      {apFirst && st.apparatus && <Apparatus3D cam={cam} flash={st.flash} fire={1} id={`${tag}-ap`} />}
      <Tower3D cam={cam} flash={st.flash} aviation={0.5 + 0.5 * Math.sin((2 * Math.PI * 17 * drift) / 33.5)} id={`${tag}-tw`} />
      {!apFirst && st.apparatus && <Apparatus3D cam={cam} flash={st.flash} fire={1} id={`${tag}-ap`} />}
      {Extra && <Extra cam={cam} flash={st.flash} t={t} layer="front" id={`${tag}-xf`} />}
      <Beam3D cam={cam} alpha={st.beam} pulses={st.pulses} channel={st.channel} channelTop={st.channelTop} id={`${tag}-bm`} />
      <TipCorona3 cam={cam} k={st.tipCorona} t={t} />
      {top && <FlashWash cam={cam} at={top} flash={st.flash} id={`${tag}-fw`} />}
      {dk >= 1 ? (
        <Discharge3D cam={cam} s={st.s} core={st.core} id={`${tag}-dc`} />
      ) : dk > 0.003 ? (
        <g opacity={dk} style={{mixBlendMode: 'screen'}}>
          <Discharge3D cam={cam} s={st.s} core={st.core} id={`${tag}-dc`} />
        </g>
      ) : null}
      {children}
      <Bracket3 cam={cam} k={st.bracket ?? 0} label={st.label ?? 0} />
    </g>
  );
};
