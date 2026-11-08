// "Or pressing a floating button without touching a screen." A second conceptual application: an elevator call panel
// with no screen and no physical button. The two technologies are kept visibly apart:
//  - CONCEPT DISPLAY: the floating buttons are a picture made of light (soft violet-white, tagged);
//  - ULTRASOUND ARRAY: the touch comes from the array in the pedestal below (cyan crests, tagged).
// It opens matched to the car's fingertip close-up (same screen point and scale) and pulls back.
import React from 'react';
import {Man, ManPose, manJoints, GUESSER} from '../dc/Man';
import {HAND_RELAXED} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {PAL, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {ProfileArm, H_POINT, handGeo} from './hand';
import {BASE_MAN, EXN} from './cast';
import {T} from './timing';
import {keyS, ss, lerp, clamp} from '../lib';
import {CYAN, CYAN_HI, Focus, Pulse} from './fx';
import {Conceptag} from './tags';
import {carCam, carPadScreen} from './car';

export const kioskActive = (t: number) => t >= T.without - 0.05 && t < T.and2 - 0.025;
const HAND_L = 96;
const BTN = {x: -30, y: -236, r: 32};
const BTN2 = {x: -30, y: -160, r: 32};
const PED = {x: -30, top: -40, w: 120};
const T0 = () => T.without - 0.05;

const padAt = (t: number) => {
  // the finger approaches the up button and presses into it on "screen."
  const press = ss(t, T.screen - 0.25, T.screen + 0.05) * (1 - ss(t, T.screen + 0.35, T.screen + 0.7));
  const appr = ss(t, T0(), T.screen - 0.3);
  const x = lerp(BTN.x + 34, BTN.x + 14, appr) - 10 * press;
  const y = lerp(BTN.y - 6, BTN.y - 2, appr) + 2 * press;
  return {pad: {x, y}, press};
};

export const KioskView: React.FC<{t: number}> = ({t}) => {
  // camera: opens where the car shot ended (fingertip close-up), pulls back to show the lobby
  const ce = carPadScreen(T0() - 0.001);
  const p0 = padAt(T0()).pad;
  const z0 = carCam(T0() - 0.001).z;
  const ex = p0.x - (ce.x - 540) / z0, ey = p0.y - (ce.y - 960) / z0;
  const cx = keyS(t, [[T0(), ex], [T.screen - 0.35, 90], [T.and2, 96]]);
  const cy = keyS(t, [[T0(), ey], [T.screen - 0.35, -170], [T.and2, -170]]);
  const z = keyS(t, [[T0(), z0], [T.screen - 0.35, 1.75], [T.and2, 1.68]]);
  const tr = `translate(540 960) scale(${z.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
  const trBg = `translate(540 960) scale(${(1 + (z - 1) / 1.6).toFixed(4)}) translate(${(-cx / 1.6).toFixed(2)} ${(-cy / 1.6).toFixed(2)})`;
  const {pad, press} = padAt(t);
  const ang = lerp(150, 168, ss(t, T0(), T0() + 0.6));
  const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, H_POINT);
  const W = {x: pad.x - g0.pad.x, y: pad.y - g0.pad.y};
  const man: ManPose = {...BASE_MAN, x: 300, y: 30, torso: 6, rW: 1, rWx: W.x, rWy: W.y, lW: 1, lWx: 318, lWy: 190};
  const inkK = 6.2 / 7 / z;
  const ink = 7 * inkK * 0.72;
  const done = ss(t, T.screen, T.screen + 0.18);
  const tags = ss(t, T.screen - 0.5, T.screen - 0.2);
  const expr = mixExpr(EXN.focus, EXN.delight, done);
  const farArm = (j: ReturnType<typeof manJoints>) => (
    <ProfileArm id="ks-ra" f={{W, dir, L: HAND_L}} pose={H_POINT} skin={shade(PAL.skin, 0.05)} ink={ink} limb={{S: j.R.S, E: j.R.E, rS: 29, rE: 23.5}} press={press} />
  );
  const lit = (k: number) => 0.5 + 0.5 * k;
  return (
    <g>
      {/* lobby wall (parallax) */}
      <g transform={trBg}>
        <rect x={-2000} y={-2000} width={4000} height={4000} fill="#3B4F5E" />
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={-1200 + i * 220} y={-900} width={4} height={1800} fill="#33475A" />
        ))}
      </g>
      <g transform={tr}>
        {/* elevator doors and their arrival indicator */}
        <rect x={420} y={-430} width={340} height={910} fill="#8C9BA8" stroke={INK} strokeWidth={ink} />
        <line x1={590} y1={-430} x2={590} y2={480} stroke={INK} strokeWidth={ink} />
        <rect x={400} y={-450} width={380} height={24} fill="#5F6E7B" stroke={INK} strokeWidth={ink} />
        <rect x={555} y={-520} width={70} height={46} rx={8} fill="#13202A" stroke={INK} strokeWidth={ink} />
        <path d="M590,-509 L605,-486 L575,-486 Z" fill={done > 0.5 ? '#7FE0A8' : '#2D3C48'} />
        {/* floor */}
        <rect x={-1200} y={480} width={2600} height={600} fill="#2A3946" />
        {/* the pedestal with the ultrasonic array set into its top */}
        <path d={`M${PED.x - 40},480 L${PED.x + 40},480 L${PED.x + 30},${PED.top + 20} L${PED.x - 30},${PED.top + 20} Z`} fill="#55636F" stroke={INK} strokeWidth={ink} />
        <path d={`M${PED.x - PED.w / 2},${PED.top} L${PED.x + PED.w / 2},${PED.top} L${PED.x + PED.w / 2 - 6},${PED.top + 22} L${PED.x - PED.w / 2 + 6},${PED.top + 22} Z`} fill="#3E4B57" stroke={INK} strokeWidth={ink} />
        <path d={`M${PED.x - PED.w / 2 + 4},${PED.top} L${PED.x + PED.w / 2 - 4},${PED.top} L${PED.x + PED.w / 2 - 10},${PED.top - 10} L${PED.x - PED.w / 2 + 10},${PED.top - 10} Z`} fill="#16262E" stroke={INK} strokeWidth={ink * 0.7} />
        {Array.from({length: 2}).map((_, r) =>
          Array.from({length: 14}).map((__, i) => {
            const fx = (i - 6.5) / 14;
            const on = 0.35 + 0.65 * Math.max(0, Math.cos(2 * Math.PI * (t * 4.5 - Math.abs(fx) * 1.2)));
            return <ellipse key={`${r}-${i}`} cx={PED.x + fx * (PED.w - 26 + r * 6)} cy={PED.top - 7 + r * 4} rx={2.6} ry={1.1} fill={CYAN} opacity={0.4 + 0.6 * on} />;
          }),
        )}
        {/* the guesser */}
        <Man id="ks-man" pose={man} expr={expr} lHand={HAND_RELAXED} rHand={HAND_RELAXED} outfit={GUESSER} inkK={inkK} farArm={farArm} />
        {/* haptics: focused crests rising from the pedestal array to the fingertip */}
        <g>
          {[0, 1, 2, 3, 4].map((k) => {
            const u = (t * 1.7 + k / 5) % 1;
            const y0 = PED.top - 8, y1 = pad.y + 2;
            const yy = lerp(y0, y1, u);
            const r = lerp(PED.w / 2, 3, u);
            return <path key={k} d={`M${pad.x - r},${yy + r * 0.22} Q${pad.x},${yy - r * 0.16} ${pad.x + r},${yy + r * 0.22}`} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(1.2, 3 / z)} opacity={0.5 * (1 - 0.5 * u)} />;
          })}
          <Focus c={{x: pad.x, y: pad.y + 1}} r={Math.max(5, 26 / z)} a={0.6 + 0.4 * press} id="ks-fc" squash={0.6} />
          <Pulse c={{x: pad.x, y: pad.y + 1}} age={t - T.screen} size={Math.max(14, 70 / z)} w={3 / z} dur={0.5} />
        </g>
        {/* the floating call buttons: light only (concept) */}
        {[{b: BTN, up: true}, {b: BTN2, up: false}].map(({b, up}, i) => {
          const fill = up ? done : 0;
          return (
            <g key={i}>
              <circle cx={b.x} cy={b.y} r={b.r + 9} fill="#D9C8FF" opacity={0.1 * lit(fill)} />
              <circle cx={b.x} cy={b.y} r={b.r} fill={fill > 0.02 ? '#EDE4FF' : 'none'} fillOpacity={0.55 * fill} stroke="#EDE4FF" strokeWidth={3} opacity={0.9} />
              <path d={up ? `M${b.x},${b.y - 11} L${b.x + 11},${b.y + 7} L${b.x - 11},${b.y + 7} Z` : `M${b.x},${b.y + 11} L${b.x + 11},${b.y - 7} L${b.x - 11},${b.y - 7} Z`} fill={fill > 0.5 ? '#3B2A6E' : '#EDE4FF'} opacity={0.95} />
            </g>
          );
        })}
        <g opacity={tags}>
          <Conceptag x={BTN.x - 140} y={BTN.y - 66} label="CONCEPT DISPLAY" color="#EDE4FF" s={1.35 / Math.max(1, z / 1.75)} />
          <Conceptag x={PED.x - 100} y={PED.top + 70} label="ULTRASOUND ARRAY" color={CYAN} s={1.35 / Math.max(1, z / 1.75)} />
        </g>
      </g>
    </g>
  );
};
void clamp;
