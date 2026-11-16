// "It's called the MouthPad. And that tiny gold square? It's a touchpad sitting on the roof of your mouth."
// One continuous device: it lifts off the guesser's teeth and out of his mouth (the face recedes into a studio
// backdrop), turns once to show its shape, the camera dives onto the gold sensor, then it turns side-on and flies back
// into place as a cut-away of his head assembles around it: the tongue rises to the roof of the mouth and touches it.
import React from 'react';
import {Jaw, View, projector, padPoint} from '../art/jaw3d';
import {jawPlacement, opening, openingPath, tonguePath} from '../art/mouth';
import {G, gMouth, Cam} from '../art/room';
import {RoomScene} from './room5';
import {SectionScene, SECTION_VIEW, palate} from './section5';
import {guesser5, honest5} from './cast5';
import {game2} from './play5';
import {T} from '../story';
import {clamp, keys, lerp, ss, ss5, eo, pulse} from '../lib';

export const C2_START = 5.78;
export const C5_END = T.mouth2 + 0.0;
export const ECU2: Cam = {x: gMouth.x, y: gMouth.y + 8, z: 13};

/** where the device sits on screen inside the mouth at the start of the lift (model origin, px/mm, view) */
const inMouth = () => {
  const m = {...guesser5(C2_START).m, device: 1};
  const J = jawPlacement(m);
  const wx = G.x + J.tx * G.scale, wy = G.ground + J.ty * G.scale;
  return {x: 540 + ECU2.z * (wx - ECU2.x), y: 960 + ECU2.z * (wy - ECU2.y), px: J.k * G.scale * ECU2.z, view: J.v, m};
};
// the section framing at the hand-off and at "roof"
const SEC0 = {fx: -26, fy: -28, px: 6.2};
const SEC1 = {fx: 5, fy: -5, px: 15.5};

/** monotone cubic through (t, v) keys (no overshoot, smooth velocity, flat at the ends) */
const smoothKeys = (t: number, K: [number, number][]) => {
  if (t <= K[0][0]) return K[0][1];
  if (t >= K[K.length - 1][0]) return K[K.length - 1][1];
  const n = K.length, d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  let i = 0; while (t > K[i + 1][0]) i++;
  const h = K[i + 1][0] - K[i][0], s = (t - K[i][0]) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return h00 * K[i][1] + h10 * h * m[i] + h01 * K[i + 1][1] + h11 * h * m[i + 1];
};
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0')).join('');
};

export const DeviceFlow: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const M = inMouth();
  // ---- phases
  const lift = ss5(t, C2_START, C2_START + 0.55); // out of the mouth to the product framing
  const dive = ss5(t, T.tiny - 0.12, T.gold + 0.1); // onto the sensor
  // back into the head, in two gentle moves: out of the sensor close-up to a three-quarter view, then a turn side-on
  // as it travels to the roof of the mouth
  const back = ss5(t, T.its2 - 0.25, T.its2 + 0.12);
  const fly = ss5(t, T.its2 + 0.05, T.touchpad + 0.35);
  const push = ss(t, T.touchpad + 0.3, T.roof - 0.05); // push in on the roof of the mouth
  // ---- view
  // (V4) one smooth turn (no 60° swing in 0.18 s, no velocity corners)
  const yaw = smoothKeys(t, [[C2_START, M.view.yaw], [C2_START + 0.5, -24], [T.tiny - 0.12, 18], [T.gold + 0.1, 0], [T.its2 - 0.25, 0], [T.its2 + 0.12, 38], [T.touchpad + 0.35, 90]]);
  const pitch = smoothKeys(t, [[C2_START, M.view.pitch], [C2_START + 0.5, -56], [T.tiny - 0.12, -68], [T.gold + 0.1, -90], [T.its2 - 0.25, -88], [T.its2 + 0.12, -40], [T.touchpad + 0.35, 0]]);
  const roll = keys(t, [[C2_START + 0.55, 0], [T.and1, -5], [T.tiny, 0], [T.square, 6], [T.its2 - 0.15, 0]]);
  // (V4) starts at the mouth's own perspective (no jump on the first frame); milder in the sensor close-up so the
  // pods near the frame edge never stretch into spikes
  const persp = lerp(lerp(lerp(M.view.persp ?? 260, 420, lift), 1000, dive), 4000, back);
  const view: View = {yaw, pitch, roll, persp};
  const pr = projector(view);
  // ---- placement (model origin on screen, px per mm)
  const pad = pr(padPoint(0, 0)), mid = pr({x: 0, y: 9, z: 0});
  const prodPx = 13.5 * (1 + 0.035 * Math.sin(t * 1.4)), sensPx = 34;
  // the lift: the device comes toward us first (bigger), then settles
  const toward = Math.sin(lift * Math.PI) * 0.35;
  let px = lerp(M.px, prodPx, lift) * (1 + toward);
  let cx = lerp(M.x, 540 - mid.x * prodPx, lift), cy = lerp(M.y + 120 * Math.sin(lift * Math.PI), 880 - mid.y * prodPx, lift);
  px = lerp(px, sensPx, dive); cx = lerp(cx, 540 - pad.x * sensPx, dive); cy = lerp(cy, 900 - pad.y * sensPx, dive);
  // (V4) a slow continuing push after the touch, so the end of the shot never freezes
  const sec = {fx: lerp(SEC0.fx, SEC1.fx, push), fy: lerp(SEC0.fy, SEC1.fy, push), px: lerp(SEC0.px, SEC1.px, push) * (1 + 0.05 * ss(t, T.roof, C5_END + 0.3))};
  const secX = 540 - sec.fx * sec.px, secY = 900 - sec.fy * sec.px;
  const midPx = 15;
  px = lerp(px, midPx, back); cx = lerp(cx, 540 - mid.x * midPx, back); cy = lerp(cy, 900 - mid.y * midPx, back);
  px = lerp(px, sec.px, fly); cx = lerp(cx, secX, fly); cy = lerp(cy, secY, fly);
  // ---- backdrop: the mouth recedes, the studio comes up
  const studio = ss(t, C2_START + 0.05, C2_START + 0.4);
  const recede = ss(t, C2_START, C2_START + 0.45);
  const reveal = ss(t, T.touchpad + 0.0, T.touchpad + 0.4);
  const near = 1 - ss(t, T.touchpad + 0.15, T.touchpad + 0.45);
  // (V4) the device stays inside the lips and behind the tongue until it has started to come forward
  const inLips = 1 - ss(t, C2_START + 0.14, C2_START + 0.34);
  const fwd = ss(t, C2_START + 0.19, C2_START + 0.26);
  // the shell starts as the in-mouth drawing shows it (its back half hidden by the teeth, the lighter tint)
  const shellK = ss(t, C2_START + 0.1, C2_START + 0.4);
  // line weights start at the in-mouth drawing's scale (it is drawn at a quarter of this px) and grow as it leaves
  const inkK = lerp(0.25, 1, ss(t, C2_START, C2_START + 0.45));
  // the in-mouth drawing carries a soft glow on the pad; it fades as the device leaves
  const g0 = 0.6 * (M.m.glow ?? 0) * (1 - clamp(M.m.tongueLift ?? 0)) * (1 - ss(t, C2_START, C2_START + 0.3));
  const hand = ss(t, T.touchpad + 0.31, T.touchpad + 0.44); // the hand-off to the section's own device (4 frames)
  // sensor: glint on "gold", touch-sensing ripple on "square"
  const glint = clamp((t - T.gold) / 0.4);
  const ripple = clamp((t - (T.square - 0.05)) / 0.6);
  // the section: tongue rises to the roof on "roof", slides along the pad on "of your mouth"
  const tl = ss(t, T.sitting1 + 0.05, T.roof - 0.02);
  const cz = keys(t, [[T.roof, 1.5], [T.roof + 0.28, 1.5], [T.mouth2 - 0.15, 5.0]]);
  const room = guesser5(C2_START);
  const ow = opening({...room.m});
  void ow;
  return (
    <g>
      {/* the room (the open mouth, now without the device) recedes behind */}
      {studio < 1 && (
        <g opacity={1} transform={`translate(540 960) scale(${1 - 0.25 * recede}) translate(-540 -960)`}>
          <RoomScene t={C2_START} frame={Math.round(C2_START * 30)} cam={ECU2} g={{...room, m: {...room.m, device: 0}, life: 0}} h={honest5(C2_START)} game={game2(C2_START)} id="dv-room" alwaysMouth />
        </g>
      )}
      <defs>
        <radialGradient id="dv-bg" cx="50%" cy="46%" r="75%">
          <stop offset="0" stopColor="#2E8C93" />
          <stop offset="1" stopColor="#173A52" />
        </radialGradient>
        <radialGradient id="dv-sh"><stop offset="0" stopColor="#0B1E2C" stopOpacity={0.45} /><stop offset="1" stopColor="#0B1E2C" stopOpacity={0} /></radialGradient>
        <radialGradient id="dv-pg"><stop offset="0" stopColor="#FFF3B0" stopOpacity={0.9} /><stop offset="1" stopColor="#FFE08A" stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#dv-bg)" opacity={studio} />
      {/* the cut-away head assembles around the device */}
      {reveal > 0.001 && (
        <SectionScene cx={secX} cy={secY} px={sec.px} lift={tl} cz={cz} press={0} glow={ss(t, T.roof - 0.08, T.roof + 0.05)} ring={t - (T.roof - 0.02)} reveal={reveal} near={near} bg={false} device={hand} />
      )}
      <ellipse cx={540} cy={1260} rx={340} ry={56} fill="url(#dv-sh)" opacity={studio * (1 - dive) * (1 - fly)} />
      {/* the device (drawn by the section once it has arrived) */}
      {hand < 0.999 && (
        <g opacity={1 - hand}>
          <defs><clipPath id="dv-lips"><path d={openingPath(M.m)} transform={`translate(540 960) scale(${ECU2.z}) translate(${-ECU2.x} ${-ECU2.y}) translate(${G.x} ${G.ground}) scale(${G.scale})`} /></clipPath></defs>
          <mask id="dv-tmask" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={5000} height={6000}>
            <rect x={-2000} y={-2000} width={5000} height={6000} fill="#FFFFFF" />
            <path d={tonguePath(M.m)} fill="#000000" opacity={1 - fwd} transform={`translate(540 960) scale(${ECU2.z}) translate(${-ECU2.x} ${-ECU2.y}) translate(${G.x} ${G.ground}) scale(${G.scale})`} />
          </mask>
          <g opacity={inLips} clipPath="url(#dv-lips)">
            <g mask="url(#dv-tmask)"><g transform={`translate(${cx} ${cy}) scale(${px})`}><Jaw view={view} px={px * inkK} id="dv-in" show={{teeth: 0, palate: 0}} padGlow={g0} shellBack={shellK} shellOpacity={lerp(0.42, 0.55, shellK)} /></g></g>
          </g>
          <g opacity={1 - inLips} >
            <g transform={`translate(${cx} ${cy}) scale(${px})`}>
              <Jaw view={view} px={px * inkK} id="dv-jaw" shellBack={shellK} shellOpacity={lerp(0.42, 0.55, shellK)} show={{teeth: 0, palate: 0, traces: 1 - fly}} near={near} padGlow={Math.max(g0, pulse(t, T.gold - 0.05, T.gold + 0.05, T.gold + 0.2, T.gold + 0.45) * 0.8)} />
            </g>
          </g>
          {/* sensing ripple across the electrodes on "square" */}
          {ripple > 0 && ripple < 1 && (
            <circle cx={cx + pad.x * px} cy={cy + pad.y * px} r={px * (1 + 9 * ripple)} fill="none" stroke="#FFF6C8" strokeWidth={6} opacity={(1 - ripple) * (1 - fly)} />
          )}
          {glint > 0 && glint < 1 && (() => {
            const x = cx + pad.x * px + lerp(-7, 7, glint) * px, y = cy + pad.y * px + lerp(-5, 5, glint) * px;
            return <path d={`M ${x} ${y - 46} L ${x + 11} ${y - 11} L ${x + 46} ${y} L ${x + 11} ${y + 11} L ${x} ${y + 46} L ${x - 11} ${y + 11} L ${x - 46} ${y} L ${x - 11} ${y - 11} Z`} fill="#FFFFFF" opacity={Math.sin(glint * Math.PI)} />;
          })()}
        </g>
      )}
      {void eo}{void mixHex}{void palate}{void SECTION_VIEW}{void frame}
    </g>
  );
};
