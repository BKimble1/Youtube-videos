// V2 car: "Now imagine reaching into thin air and feeling the controls of your car." A conceptual application, drawn
// as one. A parked car at night (P on the display, the city still outside), the guesser in the driver's seat seen
// through the open driver's door, an ultrasonic array set into the centre console, and an arc of floating controls
// drawn as light (tagged CONCEPT). The touch on the fingertip comes from the console array (cyan crests, a pulse at
// the exact contact point on each detent); the floating graphics are only a picture.
// A flat figure plane with a 2D camera (centre, zoom) and parallax layers; it opens matched to the lab hand.
import React from 'react';
import {Man, ManPose, manJoints, GUESSER} from '../dc/Man';
import {HAND_RELAXED} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {PAL, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {ProfileArm, H_POINT, handGeo, mixH} from '../it/hand';
import {BASE, EXN} from '../it/cast';
import {T} from '../it/timing';
import {keyS, ss, lerp, clamp, hash} from '../lib';
import {CYAN, CYAN_HI, Focus, Pulse} from '../it/fx';
import {Conceptag} from '../it/tags';
import {V} from '../dc/math';

export const car2Active = (t: number) => t >= T.now - 0.03 && t < T.without - 0.05;
const T0 = () => T.now - 0.03;
const T1 = () => T.without - 0.05;
const HAND_L = 96;
const SEAT: ManPose = {
  ...BASE, x: 330, y: 0, torso: -6, chest: 6, neck: 8, turn: 0.55, pelvis: 0,
  lHip: 86, lKnee: 82, lAnk: 6, rHip: 82, rKnee: 78, rAnk: 6, lFs: 1, lFsh: 1, rFs: 0.96, rFsh: 0.96,
  lW: 1, lWx: 300, lWy: 30, lElb: 1, lWr: 10, rElb: -1,
};
export const DIAL = {x: -18, y: -108, r: 44};
const VOL = {x: 70, y: -190, r: 24};
const FAN = {x: -110, y: -210, r: 22};
const ARRAY = {x: -10, y: 24, w: 150};
const TICKS = () => [T.controls + 0.02, T.controls + 0.3, T.controls + 0.58, T.car + 0.05];

type Cam2 = {x: number; y: number; z: number; r?: number};
const camT = (c: Cam2, depth = 1) => {
  const z = 1 + (c.z - 1) / depth;
  return `translate(540 960) rotate(${((c.r ?? 0) / depth).toFixed(3)}) scale(${z.toFixed(4)}) translate(${(-c.x / depth).toFixed(2)} ${(-c.y / depth).toFixed(2)})`;
};

const padAt = (t: number) => {
  const a0 = -42, a1 = 66;
  const turn = keyS(t, [[T.controls - 0.05, 0], [T.car + 0.15, 1]]);
  const da = lerp(a0, a1, turn);
  const onDial = {x: DIAL.x + DIAL.r * Math.cos((da * Math.PI) / 180), y: DIAL.y + DIAL.r * Math.sin((da * Math.PI) / 180)};
  const start = {x: DIAL.x + 175, y: DIAL.y - 62};
  const hover = {x: onDial.x + 12, y: onDial.y - 18};
  const reach = ss(t, T.feeling - 0.2, T.controls);
  const dt = t - T0();
  const v0 = 105;
  const mid = {x: start.x - v0 * 0.25, y: start.y};
  const e = 1 - Math.pow(1 - clamp((dt - 0.25) / 1.3), 3);
  let pad: V = dt < 0.25 ? {x: start.x - v0 * Math.max(0, dt), y: start.y} : {x: lerp(mid.x, hover.x, e), y: lerp(mid.y, hover.y, e)};
  pad = {x: lerp(pad.x, onDial.x, reach), y: lerp(pad.y, onDial.y, reach)};
  const push = ss(t, T.or, T.pressing + 0.7);
  pad = {x: pad.x - 14 * push, y: pad.y + 4 * push};
  return {pad, touch: reach};
};

let ENTRY = {sx: 540, sy: 960, k: 5};
export const setCar2Entry = (e: {sx: number; sy: number; k: number}) => {
  ENTRY = e;
};
export const car2Cam = (t: number): Cam2 => {
  const t0 = T0();
  const p0 = padAt(t0).pad;
  const pe = padAt(T1()).pad;
  const z0 = ENTRY.k;
  const ex = p0.x - (ENTRY.sx - 540) / z0, ey = p0.y - (ENTRY.sy - 960) / z0;
  if (t < t0 + 0.25) return {x: ex - 105 * Math.max(0, t - t0), y: ey, z: z0, r: 0};
  return {
    x: keyS(t, [[t0 + 0.25, ex - 26], [T.reaching + 0.55, 140], [T.feeling, 95], [T.car, 50], [T.or, 30], [T1(), pe.x]]),
    y: keyS(t, [[t0 + 0.25, ey], [T.reaching + 0.55, -175], [T.feeling, -160], [T.car, -140], [T.or, -130], [T1(), pe.y]]),
    z: keyS(t, [[t0 + 0.25, z0], [T.reaching + 0.55, 1.18], [T.feeling, 1.34], [T.car, 1.62], [T.or, 1.78], [T1(), 6.0]]),
    r: keyS(t, [[t0 + 0.25, 0], [T.reaching + 0.55, -2.5], [T.car, 1.5], [T1(), 0]]),
  };
};
export const car2PadScreen = (t: number) => {
  const c = car2Cam(t);
  const {pad} = padAt(t);
  return {x: 540 + (pad.x - c.x) * c.z, y: 960 + (pad.y - c.y) * c.z, k: c.z};
};

const City: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="c2-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#081124" />
        <stop offset="0.6" stopColor="#16264A" />
        <stop offset="1" stopColor="#2A2A55" />
      </linearGradient>
    </defs>
    <rect x={-3000} y={-3000} width={6000} height={6000} fill="url(#c2-sky)" />
    {Array.from({length: 26}).map((_, i) => {
      const x = -1600 + i * 130 + hash(i) * 40;
      const h = 260 + hash(i + 7) * 520;
      const w = 90 + hash(i + 3) * 70;
      return (
        <g key={i}>
          <rect x={x} y={-h} width={w} height={h + 600} fill={i % 3 ? '#101C38' : '#0D1730'} />
          {Array.from({length: 18}).map((__, k) => {
            const on = hash(i * 31 + k) > 0.55;
            return on ? <rect key={k} x={x + 10 + (k % 3) * (w / 3.2)} y={-h + 22 + Math.floor(k / 3) * 36} width={12} height={16} fill={hash(k + i) > 0.5 ? '#FFD38A' : '#9FD8FF'} opacity={0.7} /> : null;
          })}
        </g>
      );
    })}
    {[[-700, -60, '#FF8FB1'], [-200, -20, '#9FD8FF'], [420, -80, '#FFD38A'], [900, -30, '#9B7BFF']].map(([x, y, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r={70} fill={c as string} opacity={0.12} />
    ))}
    <rect x={-3000} y={280} width={6000} height={1200} fill="#0A1222" />
  </g>
);

export const Car2: React.FC<{t: number}> = ({t}) => {
  const c = car2Cam(t);
  const {pad, touch} = padAt(t);
  const ang = 150;
  const pose = mixH(H_POINT, {...H_POINT, i0: 4, i1: 6}, 0);
  const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, pose);
  const W = {x: pad.x - g0.pad.x, y: pad.y - g0.pad.y};
  const man: ManPose = {...SEAT, rW: 1, rWx: W.x, rWy: W.y};
  const inkK = 6.2 / 7 / c.z;
  const ink = 7 * inkK * 0.72;
  const ui = ss(t, T.reaching + 0.15, T.feeling - 0.05);
  const ticks = TICKS();
  const n = ticks.filter((x) => t >= x).length;
  const last = n ? ticks[n - 1] : undefined;
  const pulseAge = last !== undefined ? t - last : 99;
  const temp = 21 + n;
  const expr = mixExpr(EXN.wonder, EXN.delight, ss(t, T.controls, T.car));
  const amb = 0.7 + 0.3 * Math.sin(t * 2);
  const farArm = (j: ReturnType<typeof manJoints>) => (
    <ProfileArm id="c2-ra" f={{W, dir, L: HAND_L}} pose={pose} skin={shade(PAL.skin, 0.06)} ink={ink} limb={{S: j.R.S, E: j.R.E, rS: 29, rE: 23.5}} press={touch > 0.9 && pulseAge < 0.2 ? 0.6 : 0} />
  );
  const glassDisc = (x: number, y: number, r: number, key: string) => (
    <g key={key}>
      <circle cx={x} cy={y} r={r + 8} fill="#7FDFFF" opacity={0.07} />
      <circle cx={x} cy={y} r={r} fill="#BFE9FF" opacity={0.1} />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#E7F7FF" strokeWidth={2.4} opacity={0.9} />
    </g>
  );
  return (
    <g>
      <g transform={camT(c, 3)}>
        <City />
      </g>
      <g transform={camT(c)}>
        {/* far door panel with its ambient light line */}
        <path d="M-700,-150 L950,-150 L950,420 L-700,420 Z" fill="#141B25" stroke={INK} strokeWidth={ink} />
        <path d="M60,-70 L640,-70" stroke={CYAN} strokeWidth={4} opacity={0.65 * amb} />
        <path d="M60,-70 L640,-70" stroke={CYAN} strokeWidth={16} opacity={0.12 * amb} />
        <path d="M90,-40 L620,-40 Q650,-40 650,-14 L650,4 L90,4 Z" fill="#1E2733" stroke={INK} strokeWidth={ink * 0.8} />
        {/* roof, A-pillar and the wraparound windscreen's frame */}
        <path d="M-1000,-900 L1200,-900 L1200,-590 Q700,-640 120,-600 L-260,-210 L-1000,-210 Z" fill="#0F151D" stroke={INK} strokeWidth={ink} />
        <path d="M120,-600 L-260,-210 L-226,-204 L150,-590 Z" fill="#26313E" />
        <path d="M120,-600 Q700,-640 1200,-590" stroke="#9B7BFF" strokeWidth={3} opacity={0.5 * amb} fill="none" />
        <rect x={630} y={-600} width={46} height={450} fill="#0F151D" stroke={INK} strokeWidth={ink} />
        {/* bucket seat with light piping */}
        <path d="M372,-340 Q410,-372 462,-344 L512,40 Q480,74 424,62 Z" fill="#202833" stroke={INK} strokeWidth={ink} />
        <path d="M392,-320 L448,46" stroke={CYAN} strokeWidth={2} opacity={0.45} />
        <rect x={382} y={-468} width={92} height={104} rx={38} fill="#202833" stroke={INK} strokeWidth={ink} />
        <path d="M118,10 Q300,-16 478,20 L478,84 Q300,72 128,78 Z" fill="#1C232D" stroke={INK} strokeWidth={ink} />
        {/* centre console with the ultrasonic array */}
        <path d="M-240,26 L300,26 L322,128 L-258,128 Z" fill="#232C38" stroke={INK} strokeWidth={ink} />
        <path d="M-240,26 L300,26 L290,6 L-230,6 Z" fill="#33404E" stroke={INK} strokeWidth={ink} />
        <path d="M-240,128 L322,128" stroke="#9B7BFF" strokeWidth={3} opacity={0.6 * amb} />
        <path d={`M${ARRAY.x - ARRAY.w / 2},${ARRAY.y - 15} L${ARRAY.x + ARRAY.w / 2},${ARRAY.y - 15} L${ARRAY.x + ARRAY.w / 2 + 8},${ARRAY.y - 1} L${ARRAY.x - ARRAY.w / 2 - 8},${ARRAY.y - 1} Z`} fill="#0F1E26" stroke={INK} strokeWidth={ink * 0.7} />
        {Array.from({length: 3}).map((_, r) =>
          Array.from({length: 16}).map((__, i) => {
            const fx = (i - 7.5) / 16;
            const x = ARRAY.x + fx * (ARRAY.w - 12 + r * 6);
            const y = ARRAY.y - 12 + r * 4;
            const on = touch > 0.4 ? 0.3 + 0.7 * Math.max(0, Math.cos(2 * Math.PI * (t * 4.5 - Math.abs(fx) * 1.3))) : 0.12;
            return <ellipse key={`${r}-${i}`} cx={x} cy={y} rx={3} ry={1.25} fill={CYAN} opacity={0.25 + 0.75 * on} />;
          }),
        )}
        {/* dashboard with a pillar-to-pillar display: parked */}
        <path d="M-1000,-210 L-300,-210 Q-140,-206 -110,-126 L-100,-40 Q-130,-8 -220,4 L-1000,4 Z" fill="#18202A" stroke={INK} strokeWidth={ink} />
        <path d="M-1000,-30 L-140,-30" stroke="#9B7BFF" strokeWidth={3} opacity={0.6 * amb} />
        <path d="M-700,-206 L-250,-206 Q-186,-204 -172,-168 L-700,-168 Z" fill="#081018" stroke={INK} strokeWidth={ink * 0.8} />
        <text x={-640} y={-178} fontFamily="Nunito Variable, sans-serif" fontWeight={900} fontSize={26} fill="#7FE0A8">P</text>
        <text x={-604} y={-180} fontFamily="Nunito Variable, sans-serif" fontWeight={800} fontSize={14} fill="#7C93A6">PARKED</text>
        <text x={-470} y={-180} fontFamily="Nunito Variable, sans-serif" fontWeight={800} fontSize={14} fill="#7C93A6">412 km</text>
        <path d="M-380,-188 Q-340,-200 -300,-186" stroke={CYAN} strokeWidth={2} fill="none" opacity={0.7} />
        {/* the steering yoke, edge-on, still */}
        <path d="M-150,-112 L-82,-160" stroke="#0E141B" strokeWidth={20} strokeLinecap="round" />
        <rect x={-98} y={-246} width={26} height={130} rx={12} transform="rotate(-18 -85 -181)" fill="#0E141B" stroke={INK} strokeWidth={ink} />
        <rect x={-92} y={-236} width={8} height={110} rx={4} transform="rotate(-18 -85 -181)" fill={CYAN} opacity={0.35} />
        {/* the guesser, seated; his right hand reaches over the console */}
        <Man id="c2-man" pose={man} expr={expr} lHand={HAND_RELAXED} rHand={HAND_RELAXED} outfit={GUESSER} inkK={inkK} farArm={farArm} nearLegFront />
        {/* haptics: focused crests from the console array to the fingertip (cyan) */}
        {touch > 0.25 && (
          <g opacity={ss(touch, 0.25, 0.9)}>
            {[0, 1, 2, 3, 4].map((k) => {
              const u = (t * 1.7 + k / 5) % 1;
              const yy = lerp(ARRAY.y - 13, pad.y + 2, u);
              const r = lerp(ARRAY.w / 2, 3, u);
              return <path key={k} d={`M${pad.x - r},${yy + r * 0.22} Q${pad.x},${yy - r * 0.16} ${pad.x + r},${yy + r * 0.22}`} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(1.2, 3.2 / c.z)} opacity={0.55 * (1 - u * 0.4)} />;
            })}
            <Focus c={{x: pad.x, y: pad.y + 1}} r={Math.max(4, 24 / c.z)} a={0.8} id="c2-fc" squash={0.6} />
            <Pulse c={{x: pad.x, y: pad.y + 1}} age={pulseAge} size={Math.max(12, 72 / c.z)} w={3 / c.z} dur={0.4} />
          </g>
        )}
        {/* the floating control arc: light only (concept) */}
        <g opacity={ui}>
          <path d={`M${FAN.x - 40},${FAN.y + 30} Q${DIAL.x},${DIAL.y - 150} ${VOL.x + 50},${VOL.y + 20}`} stroke="#BFE9FF" strokeWidth={1.5} strokeDasharray="4 6" fill="none" opacity={0.5} />
          {glassDisc(FAN.x, FAN.y, FAN.r, 'fan')}
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={FAN.x} cy={FAN.y} rx={4} ry={14} transform={`rotate(${i * 120 + t * 90} ${FAN.x} ${FAN.y}) translate(0 -8)`} fill="#E7F7FF" opacity={0.8} />
          ))}
          {glassDisc(VOL.x, VOL.y, VOL.r, 'vol')}
          <path d={`M${VOL.x - 9},${VOL.y - 6} L${VOL.x - 3},${VOL.y - 6} L${VOL.x + 5},${VOL.y - 12} L${VOL.x + 5},${VOL.y + 12} L${VOL.x - 3},${VOL.y + 6} L${VOL.x - 9},${VOL.y + 6} Z`} fill="#E7F7FF" />
          {glassDisc(DIAL.x, DIAL.y, DIAL.r, 'dial')}
          <path d={arcD(DIAL.x, DIAL.y, DIAL.r - 9, -220, -220 + 260 * (0.3 + 0.14 * n))} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
          {Array.from({length: 13}).map((_, i) => {
            const a = ((-220 + i * (260 / 12)) * Math.PI) / 180;
            return <line key={i} x1={DIAL.x + (DIAL.r + 5) * Math.cos(a)} y1={DIAL.y + (DIAL.r + 5) * Math.sin(a)} x2={DIAL.x + (DIAL.r + 11) * Math.cos(a)} y2={DIAL.y + (DIAL.r + 11) * Math.sin(a)} stroke="#E7F7FF" strokeWidth={2} opacity={0.7} />;
          })}
          <text x={DIAL.x} y={DIAL.y + 9} textAnchor="middle" fontFamily="Nunito Variable, sans-serif" fontWeight={900} fontSize={26} fill="#FFFFFF">{temp}°</text>
          <Conceptag x={DIAL.x - 150} y={DIAL.y + 72} label="CONCEPT" s={1.3 / Math.max(1, c.z / 1.4)} />
        </g>
      </g>
      {/* the near door sill frames the bottom of the cutaway */}
      <g transform={camT(c, 0.85)}>
        <path d="M-1400,250 L1600,250 L1600,1500 L-1400,1500 Z" fill="#1E3456" stroke={INK} strokeWidth={ink} />
        <path d="M-1400,262 L1600,262" stroke={CYAN} strokeWidth={5} opacity={0.6 * amb} />
      </g>
    </g>
  );
};

const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => ({x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180)});
  const s0 = p(a0), s1 = p(a1);
  return `M${s0.x.toFixed(2)},${s0.y.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${s1.x.toFixed(2)},${s1.y.toFixed(2)}`;
};
