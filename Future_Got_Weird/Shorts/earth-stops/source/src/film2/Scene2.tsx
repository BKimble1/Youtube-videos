import React from 'react';
import {C, H, W} from '../theme';
import {CharacterSide, SidePose, hipOnGround, sideFK} from '../v2/side';
import {MugSide} from '../v2/props';
import {Street2} from '../v2/Street2';
import {HeroShadow} from '../v2/Fx2';
import {GSY, GYW, SC, X0, Z1} from '../v2/choreo2';
import {RW1, VW, WALK} from '../v2/choreoH';
import {blendPose} from '../v2/choreoEC';
import {E} from '../lib/motion';
import {CALM, cl, lerp, sm} from './ui';
import {T} from './timeline';

/**
 * The street after the rewind, as one scene for the rest of the walk and shared-motion beat (f >= RW1 - D). Scene time s = f - (RW1 - D) - 8 (the H1 "was" timeline: she walks east at VW px per frame
 * with the camera riding at a fixed offset). At T.b02 she slows to a stand (14 frames) and the camera stops with her. Everything in the world is drawn under one camera so the layers never fight.
 */
const F0 = RW1 - T.D; // first frame of this scene (79)
export const sOf = (f: number) => f - F0 - 8;
const S_STOP = sOf(T.b02); // 99
const CAM_OFF = (540 - 250) / Z1; // camera x minus hip x (the H1 offset)
const dist = (u: number) => { const t = Math.min(Math.max(u, 0), 14), x = t / 14; return t - 14 * (x ** 3 - x ** 4 / 2); }; // px/8 travelled while slowing
export const heroX = (s: number) => (s <= S_STOP ? X0 + VW * s : X0 + VW * S_STOP + VW * dist(s - S_STOP));
export const heroPoseS = (s: number): SidePose => {
  if (s <= S_STOP) return WALK(s);
  const u = s - S_STOP;
  return blendPose(WALK(S_STOP + dist(u)), CALM(s), sm(u / 14));
};
export const camS = (s: number) => heroX(s) + CAM_OFF;
export const zoomS = (s: number) => Z1 + (0.86 - Z1) * E.inOut(cl((s + 8) / 14));

const ScarfTail2: React.FC<{s: number; camX: number; z: number}> = ({s, camX, z}) => {
  const K = 9;
  const pts = Array.from({length: K}).map((_, k) => {
    const t = s - 1.2 * k;
    const pose = heroPoseS(t), hx = heroX(t);
    const n = sideFK(pose, hipOnGround(pose, hx, GYW, SC), SC).N;
    return {x: 540 + (n.x - camX) * z, y: GSY + (n.y - GYW) * z + (2.4 * k + (4 + 2.4 * k) * Math.sin(0.62 * t + 0.9 * k)) * z, w: Math.max(26, 46 - 1.8 * k) * z};
  });
  const lines = [...pts].reverse();
  const e = pts[K - 1], q = pts[K - 2];
  const L = Math.hypot(e.x - q.x, e.y - q.y) || 1, ux = (e.x - q.x) / L, uy = (e.y - q.y) / L, nx = -uy, ny = ux;
  return (
    <g>
      {lines.map((p, ri) => { const k = K - 1 - ri, a = k === 0 ? pts[0] : pts[k - 1]; return <line key={`o${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={p.w + 8 * z} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />; })}
      {lines.map((p, ri) => { const k = K - 1 - ri, a = k === 0 ? pts[0] : pts[k - 1]; return <line key={`i${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={k % 3 === 1 ? C.cream : C.coral} strokeWidth={p.w} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />; })}
      {[-1, 0, 1].map((i) => <line key={`fr${i}`} x1={e.x + nx * i * 10 * z} y1={e.y + ny * i * 10 * z} x2={e.x + ux * 18 * z + nx * i * 14 * z} y2={e.y + uy * 18 * z + ny * i * 14 * z} stroke={C.ink} strokeWidth={5 * z} strokeLinecap="round" />)}
    </g>
  );
};

export type HeroView = {pose: SidePose; hip: {x: number; y: number}; screen: {x: number; y: number}; fk: ReturnType<typeof sideFK>};
export const heroView = (s: number, camX: number, z: number): HeroView => {
  const pose = heroPoseS(s), hx = heroX(s);
  const hip = hipOnGround(pose, hx, GYW, SC);
  const screen = {x: 540 + (hip.x - camX) * z, y: GSY + (hip.y - GYW) * z};
  return {pose, hip, screen, fk: sideFK(pose, hip, SC)};
};

/** the world: Street2 + whatever the beat puts in it (`children`, world px) + her. cam/zoom default to following her. */
export const StreetScene: React.FC<{f: number; camX?: number; zoom?: number; blur?: number; children?: React.ReactNode; hero?: boolean; heroOver?: React.ReactNode}> = ({f, camX, zoom, blur = 0, children, hero = true, heroOver}) => {
  const s = sOf(f);
  const z = zoom ?? zoomS(s), cx = camX ?? camS(s);
  const hv = heroView(s, cx, z);
  const T2 = `translate(540 ${GSY}) scale(${z}) translate(${-cx} ${-GYW})`;
  const sv: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible'};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={blur} pad={420}>{children}</Street2>
      {hero && (
        <>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={sv}><g transform={T2}><HeroShadow x={hv.hip.x} lift={0} /></g></svg>
          <CharacterSide pose={hv.pose} hip={hv.screen} sc={SC * z} scarfWrap scarf={<ScarfTail2 s={s} camX={cx} z={z} />} holdN={<MugSide tilt={0} sc={SC * z} />} />
        </>
      )}
      {heroOver}
    </div>
  );
};
export {lerp};
