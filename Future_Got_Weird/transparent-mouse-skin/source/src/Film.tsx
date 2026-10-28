// FGW "This Food Dye Makes Mouse Skin See-Through" V1: the film as a pure function of time.
// Scenes (transitions are listed in production/SHOTS_AND_TRANSITIONS.md):
//   S1  0.00-7.00  treated result: one continuous push toward the clear patch; a slight angle/light change on "cut"
//   S2  7.00-9.7   EARLIER, same framing (matched cut): the solution rubbed onto intact, still-opaque skin
//   S3  9.7-20.0   call-out from a spot on that patch into the skin section (Section.tsx); the patch clears below it
//   S4  20.0-end   back on the clear patch: rinse, TIME-LAPSE return to opaque skin over the still-moving organs
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Bench} from './art/Bench';
import {Mouse, MouseState} from './art/Mouse';
import {BottleHand, Stream, SwabHand} from './art/Operator';
import {Section, SR} from './art/Section';
import {B} from './beats';
import {Captions, Chip} from './Captions';
import {easeInOut, easeOut, inv, lerp, V} from './dc/math';
import {FPS} from './lib';

export type FilmProps = {audio: string | null; captions: boolean};
type Cam = {x: number; y: number; z: number; r: number};
const lc = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), r: lerp(a.r, b.r, u)});
const toScreen = (c: Cam, p: V): V => {
  const dx = (p.x - c.x) * c.z, dy = (p.y - c.y) * c.z, a = (c.r * Math.PI) / 180;
  return {x: 540 + dx * Math.cos(a) - dy * Math.sin(a), y: 960 + dx * Math.sin(a) + dy * Math.cos(a)};
};

const CAM0: Cam = {x: 540, y: 1030, z: 1.2, r: 0};
const CAM1: Cam = {x: 548, y: 1100, z: 1.96, r: -4.5};
const CAM2: Cam = {x: 552, y: 1102, z: 1.9, r: -3};
const SPOT: V = {x: 560, y: 1040}; // the call-out's spot on the patch
const CAM3: Cam = {x: 548, y: SPOT.y - (1560 - 960) / 1.42, z: 1.42, r: 0};
const CAM4: Cam = {x: 548, y: 1082, z: 1.86, r: 0};
const CAMEND: Cam = {x: 540, y: 1036, z: 1.26, r: 0};
const CALL_C: V = {x: 540, y: 800};

// the swab's track over the patch (world), crossed at an even pace between contact and lift
const STROKES: V[] = [{x: 628, y: 975}, {x: 470, y: 958}, {x: 452, y: 1010}, {x: 622, y: 1030}, {x: 632, y: 1085}, {x: 450, y: 1080},
  {x: 446, y: 1134}, {x: 626, y: 1150}, {x: 604, y: 1206}, {x: 470, y: 1200}, {x: 520, y: 1246}];
const strokeAt = (u: number): V => {
  const x = u * (STROKES.length - 1), i = Math.min(STROKES.length - 2, Math.floor(x)), f = x - i;
  const s = f * f * (3 - 2 * f) * 0.5 + f * 0.5;
  return {x: lerp(STROKES[i].x, STROKES[i + 1].x, s), y: lerp(STROKES[i].y, STROKES[i + 1].y, s)};
};

const camAt = (t: number): Cam => {
  if (t < B.cutEarlier) {
    // one continuous push: a soft start at 0.4 s, most of the travel by "underneath", still creeping in on "cut";
    // the roll (the slight angle change) belongs to "without making a single cut" only
    const x = inv(B.pushStart, B.cutEarlier - 0.05, t);
    const u = (1 - (1 - x) ** 2.3) * easeInOut(Math.min(1, x / 0.16) * 0.5 + 0.5 * Math.min(1, x / 0.16));
    const c = lc(CAM0, CAM1, u);
    return {...c, r: CAM1.r * easeInOut(inv(B.angle0, B.cutEarlier - 0.05, t))};
  }
  if (t < B.callout0) return lc(CAM1, CAM2, inv(B.cutEarlier, B.callout0, t));
  if (t < B.camBack0) return lc(CAM2, CAM3, easeInOut(inv(B.callout0 - 0.08, B.callout1 + 0.15, t)));
  if (t < B.pullOut0) return lc(CAM3, CAM4, easeInOut(inv(B.camBack0, B.camBack1, t)));
  return lc(CAM4, CAMEND, easeInOut(inv(B.pullOut0, B.end, t)));
};

const mouseAt = (t: number): MouseState => {
  if (t < B.cutEarlier) return {t, T: 1, tint: 1, film: 0, wet: 0, sweep: t > B.sweep0 - 0.1 && t < B.sweep1 + 0.1 ? lerp(-1.2, 1.2, easeInOut(inv(B.sweep0, B.sweep1, t))) : undefined};
  if (t < B.callout0) {
    const u = inv(B.swabContact, B.swabLift, t);
    const cov: V[] = [];
    if (t > B.swabContact) for (let k = 0; k <= 60; k++) { if (k / 60 > u) break; cov.push(strokeAt(k / 60)); }
    if (cov.length) cov.push(strokeAt(u));
    return {t, T: 0, tint: 0, film: 0.45 * easeInOut(inv(B.swabLift - 0.3, B.callout0, t)), coverage: cov, wet: 0};
  }
  if (t < B.calloutBack0) {
    const k = easeInOut(inv(B.dyeIn + 0.4, B.settled, t));
    return {t, T: k, tint: k, film: lerp(0.45, 0.1, k), wet: 0};
  }
  const hide = easeInOut(inv(B.hide0, B.hide1, t));
  const wet = Math.min(easeOut(inv(B.rinse0 + 0.1, B.rinse0 + 0.5, t)), 1 - easeInOut(inv(B.rinse1 + 0.1, B.hide1 - 0.3, t)));
  return {t, T: 1 - hide, tint: 1 - hide, film: 0.12 * (1 - easeOut(inv(B.rinse0, B.rinse0 + 0.6, t))), wet};
};

/** tangent points from an outside point p to the circle (c, r) */
const tangents = (p: V, c: V, r: number): [V, V] | null => {
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
  if (d <= r + 1) return null;
  const a = Math.atan2(dy, dx), b = Math.acos(r / d);
  return [{x: c.x + r * Math.cos(a + b), y: c.y + r * Math.sin(a + b)}, {x: c.x + r * Math.cos(a - b), y: c.y + r * Math.sin(a - b)}];
};

export const Frame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  const cam = camAt(t);
  const ms = mouseAt(t);
  const stain = easeInOut(inv(B.rinse0 + 0.3, B.hide1, t));
  // operator
  let swab: React.ReactNode = null;
  if (t >= B.swabIn && t < B.callout0 + 0.2) {
    const inU = easeOut(inv(B.swabIn, B.swabContact, t));
    const outU = easeInOut(inv(B.swabLift, B.swabOut, t));
    const off: V = {x: 860, y: 1380};
    let tip = t < B.swabContact ? {x: lerp(off.x, STROKES[0].x, inU), y: lerp(off.y, STROKES[0].y, inU)} : strokeAt(inv(B.swabContact, B.swabLift, t));
    if (t > B.swabLift) tip = {x: lerp(tip.x, off.x + 80, outU), y: lerp(tip.y, off.y + 60, outU)};
    const lift = t < B.swabContact ? 1 - inU : outU;
    swab = <SwabHand id="sw" tip={tip} ang={32 + 6 * Math.sin(t * 5)} lift={lift} />;
  }
  let bottle: React.ReactNode = null, stream: React.ReactNode = null;
  if (t > B.calloutBack1 - 0.4 && t < B.hide0 + 0.8) {
    const inU = easeOut(inv(B.calloutBack1 - 0.4, B.rinse0, t));
    const outU = easeInOut(inv(B.rinse1, B.hide0 + 0.7, t));
    const home: V = {x: 690, y: 880}, off: V = {x: 1010, y: 600};
    const nz = {x: lerp(lerp(off.x, home.x, inU), off.x, outU), y: lerp(lerp(off.y, home.y, inU), off.y, outU) + 10 * Math.sin(t * 3)};
    const squeeze = Math.min(inv(B.rinse0 - 0.1, B.rinse0 + 0.1, t), 1 - inv(B.rinse1 - 0.15, B.rinse1, t));
    bottle = <BottleHand id="wb" nozzle={nz} ang={-40} squeeze={squeeze} />;
    const land = {x: lerp(520, 552, inv(B.rinse0, B.rinse1, t)), y: lerp(940, 1190, easeInOut(inv(B.rinse0, B.rinse1, t)))};
    stream = <Stream from={nz} to={land} a={squeeze} t={t} />;
  }
  // call-out
  const open = easeOut(inv(B.callout0 + 0.06, B.callout1, t));
  const close = easeInOut(inv(B.calloutBack0, B.calloutBack1 - 0.1, t));
  const cu = t < B.calloutBack0 ? open : 1 - close;
  const spot = toScreen(cam, SPOT);
  const cc = {x: lerp(spot.x, CALL_C.x, cu), y: lerp(spot.y, CALL_C.y, cu)};
  const cr = SR * cu;
  const tan = cu > 0.02 ? tangents(spot, cc, cr) : null;
  const ringR = 30 * cam.z;
  const earlier = Math.min(inv(B.cutEarlier, B.cutEarlier + 0.15, t), 1 - inv(B.callout0 + 0.3, B.callout1, t));
  const lapse = Math.min(inv(B.timelapse0, B.timelapse0 + 0.2, t), 1 - inv(B.timelapse1, B.timelapse1 + 0.25, t));
  return (
    <AbsoluteFill style={{backgroundColor: '#56677A'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(540 960) rotate(${cam.r}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
          <Bench id="b" wetStain={stain} />
          <Mouse id="m" s={ms} />
          {swab}
          {stream}
          {bottle}
        </g>
        {cu > 0.001 && (
          <g>
            <rect x={0} y={0} width={1080} height={1920} fill="#0A121A" opacity={0.24 * cu} />
            <circle cx={spot.x} cy={spot.y} r={ringR} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={Math.min(1, cu * 3)} />
            {tan && tan.map((q, i) => {
              const a = Math.atan2(q.y - spot.y, q.x - spot.x);
              return <path key={i} d={`M${spot.x + ringR * Math.cos(a)},${spot.y + ringR * Math.sin(a)} L${q.x},${q.y}`} stroke="#FFFFFF" strokeWidth={5} opacity={0.85 * Math.min(1, cu * 3)} />;
            })}
            <g transform={`translate(${cc.x} ${cc.y}) scale(${Math.max(0.001, cu)})`}>
              <Section t={t} />
            </g>
          </g>
        )}
      </svg>
      <Chip text="EARLIER" a={earlier} />
      <Chip text="TIME-LAPSE" a={lapse} clockT={t} />
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<FilmProps> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
