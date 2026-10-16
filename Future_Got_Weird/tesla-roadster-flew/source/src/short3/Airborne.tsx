// Airborne control on the real footage: the hop flip from the side (rec_224911 36.2–39.1, half speed). Every vector sits
// on a gas plume that is visible in that frame (positions keyed by hand from 10 fps gridded frames, research/trace/);
// none marks a nozzle. Phases: upside down, plumes firing up; rolling, an opposite pair; upright, two plumes down.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {pop} from '../lib/anim';
import {Key, keyed} from './Clip';

// v3_hop_slow.mp4 = rec_224911 36.20–38.12 then 38.14–39.07, both at half speed (camera cut at 38.12–38.14)
const clipT = (src: number) => (src < 38.13 ? (src - 36.2) * 2 : 3.867 + (src - 38.14) * 2);
const srcT = (clip: number) => (clip < 3.867 ? 36.2 + clip / 2 : 38.14 + (clip - 3.867) / 2);

const camX: Key[] = [[36.4, 941], [36.6, 873], [36.8, 806], [37.0, 733], [37.2, 653], [37.4, 595], [37.6, 576], [37.8, 570], [38.0, 700], [38.12, 760], [38.13, 840], [38.2, 850], [38.3, 885], [38.5, 990], [38.7, 1070]];
const camY: Key[] = [[36.4, 390], [37.0, 365], [37.4, 335], [37.8, 365], [38.0, 430], [38.12, 450], [38.13, 520], [38.3, 540], [38.5, 600], [38.7, 640]];
const S = 1.25;
const X0 = 540, Y0 = 760;

type Vec = {keys: [number, number, number, number, number][]; on: [number, number]};
const VECS: Vec[] = [
  // upside down: plumes rising from the floor side
  {keys: [[36.4, 845, 300, 845, 70], [36.8, 691, 300, 691, 70], [37.0, 614, 320, 614, 80], [37.2, 538, 310, 538, 80]], on: [36.47, 37.25]},
  {keys: [[36.4, 1152, 300, 1152, 70], [36.8, 1044, 300, 1044, 70], [37.0, 960, 320, 960, 90], [37.2, 902, 310, 902, 90]], on: [36.47, 37.25]},
  // rolling: one plume up at one end, one down at the other
  {keys: [[37.7, 338, 230, 338, 40], [37.8, 338, 245, 338, 30], [37.9, 365, 280, 365, 60], [38.0, 422, 300, 422, 190]], on: [37.7, 38.02]},
  {keys: [[37.7, 818, 440, 818, 600], [37.8, 826, 445, 826, 610], [37.9, 845, 480, 845, 660], [38.0, 960, 470, 960, 630]], on: [37.74, 38.02]},
  // upright: two plumes straight down, front and rear
  {keys: [[38.15, 725, 545, 725, 860], [38.2, 730, 548, 730, 870], [38.3, 768, 568, 768, 890], [38.5, 902, 660, 902, 950], [38.6, 940, 690, 940, 970]], on: [38.17, 38.62]},
  {keys: [[38.15, 1065, 535, 1065, 850], [38.2, 1075, 538, 1075, 860], [38.3, 1133, 558, 1133, 880], [38.5, 1229, 650, 1229, 940], [38.6, 1265, 680, 1265, 960]], on: [38.17, 38.62]},
];
const interpVec = (keys: Vec['keys'], t: number) => [1, 2, 3, 4].map((j) => keyed(keys.map((k) => [k[0], k[j]] as Key), t));

const JetArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; o: number}> = ({x1, y1, x2, y2, o}) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const w = 22, hl = 44, hw = 34, bx = x2 - ux * hl, by = y2 - uy * hl;
  const d = `M ${x1 + nx * w / 2} ${y1 + ny * w / 2} L ${bx + nx * w / 2} ${by + ny * w / 2} L ${bx + nx * hw} ${by + ny * hw} L ${x2} ${y2} L ${bx - nx * hw} ${by - ny * hw} L ${bx - nx * w / 2} ${by - ny * w / 2} L ${x1 - nx * w / 2} ${y1 - ny * w / 2} Z`;
  return <path d={d} fill="#BFE6FF" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" opacity={o} />;
};

const BigLabel: React.FC<{text: string; y: number; o: number; s?: number; color?: string}> = ({text, y, o, s = 1, color = C.cream}) => (
  <div style={{position: 'absolute', left: 0, width: 1080, top: y, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
    <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 76, color, letterSpacing: 2, WebkitTextStroke: `11px ${C.ink}`, paintOrder: 'stroke fill'}}>{text}</span>
  </div>
);

export const Airborne: React.FC<{from: number; start: number; cues: {jets: number; rotate: number; hold: number}}> = ({from, start, cues}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = start + frame / fps;           // narration time
  const clip = from + frame / fps;         // seconds into v3_hop_slow.mp4
  const src = srcT(clip);                  // seconds in rec_224911
  const cx = keyed(camX, src), cy = keyed(camY, src);
  const toScr = (x: number, y: number): [number, number] => [X0 + (x - cx) * S, Y0 + (y - cy) * S];
  const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
  const left = X0 - cx * S, top = Y0 - cy * S;

  // roll arc around the car while it rotates
  const arcO = interpolate(src, [37.3, 37.42, 37.98, 38.06], [0, 1, 1, 0], clamp);
  const [ax, ay] = toScr(keyed([[37.4, 595], [37.6, 576], [37.8, 570], [38.0, 700]], src), keyed([[37.4, 322], [37.6, 350], [37.8, 365], [38.0, 432]], src));
  const R = 330 * S, a0 = (-150 * Math.PI) / 180, a1 = (-30 * Math.PI) / 180;
  const sweep = interpolate(src, [37.35, 37.7], [0, 1], clamp);
  const ae = a0 + (a1 - a0) * sweep;
  const arcD = `M ${ax + R * Math.cos(a0)} ${ay + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${ax + R * Math.cos(ae)} ${ay + R * Math.sin(ae)}`;
  const tipX = ax + R * Math.cos(ae), tipY = ay + R * Math.sin(ae);
  const tang = ae + Math.PI / 2;
  const head = `M ${tipX + 34 * Math.cos(tang)} ${tipY + 34 * Math.sin(tang)} L ${tipX + 26 * Math.cos(ae)} ${tipY + 26 * Math.sin(ae)} L ${tipX - 26 * Math.cos(ae)} ${tipY - 26 * Math.sin(ae)} Z`;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('footage/v3_hop_slow.mp4')} trimBefore={Math.round(from * fps)} muted
        style={{position: 'absolute', left, top, width: 1920 * S, height: 1080 * S}} />
      {/* soft fade at the frame edges so the 16:9 picture melts into the night sky */}
      <div style={{position: 'absolute', left: 0, width: 1080, top, height: 160, background: 'linear-gradient(#000, rgba(0,0,0,0))'}} />
      <div style={{position: 'absolute', left: 0, width: 1080, top: top + 1080 * S - 200, height: 200, background: 'linear-gradient(rgba(0,0,0,0), #000)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {VECS.map((v, i) => {
          const o = interpolate(src, [v.on[0], v.on[0] + 0.05, v.on[1] - 0.05, v.on[1]], [0, 1, 1, 0], clamp);
          if (o <= 0) return null;
          const [x1, y1, x2, y2] = interpVec(v.keys, src);
          const [a, b] = toScr(x1, y1), [c, d] = toScr(x2, y2);
          return <JetArrow key={i} x1={a} y1={b} x2={c} y2={d} o={o} />;
        })}
        <g opacity={arcO}>
          <path d={arcD} fill="none" stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
          <path d={arcD} fill="none" stroke={C.saffron} strokeWidth={18} strokeLinecap="round" />
          <path d={head} fill={C.saffron} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        </g>
      </svg>
      <BigLabel text="GAS JETS" y={250} o={interpolate(t, [cues.jets - 0.1, cues.jets + 0.1, cues.rotate - 0.25, cues.rotate - 0.05], [0, 1, 1, 0], clamp)} s={0.85 + 0.15 * pop(frame, fps, (cues.jets - start) * fps, 16)} />
      <BigLabel text="ROLL" y={250} color={C.saffron} o={interpolate(t, [cues.rotate - 0.05, cues.rotate + 0.1, cues.hold - 0.2, cues.hold - 0.05], [0, 1, 1, 0], clamp)} s={0.85 + 0.15 * pop(frame, fps, (cues.rotate - start) * fps, 16)} />
      <BigLabel text="HOLD STEADY" y={250} o={interpolate(t, [cues.hold - 0.05, cues.hold + 0.1], [0, 1], clamp)} s={0.85 + 0.15 * pop(frame, fps, (cues.hold - start) * fps, 16)} />
    </AbsoluteFill>
  );
};
export {clipT};
