// The side cut-away: the guesser in profile (his skin, red spiky hair, cheek blush and the cast's eye style), the
// lower face opened as a clean section. The roof of the mouth is the model's own palate midline (vault(0, z)), so
// the MouthPad's plate and gold pad sit exactly where the product view showed them. Lips closed, teeth almost
// together: the device works with the mouth shut. Used for "a touchpad sitting on the roof of your mouth" and again
// for "Press your tongue up, you CLICK".
import React from 'react';
import {Jaw, vault, PAD, DEV} from '../art/jaw3d';
import {CAST} from '../crew';
import {T, FIRE} from '../story';
import {clamp, keys, lerp, ss, pulse, smoothPath, P, blip} from '../lib';

const INK = '#162A32';
const look = CAST.guesser;
// section space: x = model z (mm, front → right), y = −model y (mm, down)
const palate = (z: number) => -vault(0, z);
const PAL: P[] = Array.from({length: 40}, (_, i) => {
  const z = 15 - (i / 39) * 38;
  return {x: z, y: palate(z)};
});

/** the tongue's upper contour for a lift 0..1, contact position along the pad (cz, model z) and press */
const tongueShape = (lift: number, cz: number, press: number): P[] => {
  // rest: tip behind the lower incisors, dorsum low; lifted: the blade presses the pad at cz
  const tipRest = {x: 14.5, y: 4.5}, tipUp = {x: Math.min(cz + 7.5, 13), y: palate(Math.min(cz + 7.5, 13)) + 2.2};
  const tip = {x: lerp(tipRest.x, tipUp.x, lift), y: lerp(tipRest.y, tipUp.y, lift)};
  const bladeUp = {x: cz, y: palate(cz) + 0.9 - press * 0.7};
  const blade = {x: lerp(4, bladeUp.x, lift), y: lerp(-3.5, bladeUp.y, lift)};
  const dorsum = {x: lerp(-10, cz - 9, lift), y: lerp(-7, palate(cz - 9) + 3.5, lift)};
  const back = {x: -24, y: lerp(-4, -9, lift)};
  return [
    {x: 12, y: 13}, // under the tip, behind the lower incisors
    {x: tip.x + 0.8, y: tip.y + 2},
    tip,
    blade,
    dorsum,
    back,
    {x: -31, y: 6},
    {x: -31, y: 24},
    {x: 8, y: 22},
  ];
};

export const SectionShot: React.FC<{t: number; part: 1 | 2}> = ({t, part}) => {
  let px: number, fx: number, fy: number, lift: number, cz: number, press: number, glow: number;
  if (part === 1) {
    // start on the whole head (who this is), push in on the roof of the mouth by "roof"
    const a = ss(t, T.its2 + 0.05, T.roof - 0.05);
    px = lerp(5.4, 15.5, a);
    fx = lerp(-28, 5, a);
    fy = lerp(-30, -4, a);
    lift = ss(t, T.sitting1 + 0.05, T.roof - 0.02);
    cz = keys(t, [[T.roof, 1.5], [T.roof + 0.35, 1.5], [T.mouth2 - 0.25, 5.5], [T.mouth2 + 0.15, -3.5]]);
    press = 0;
    glow = ss(t, T.roof - 0.08, T.roof + 0.05);
  } else {
    const a = ss(t, T.press - 0.1, T.up);
    px = lerp(15, 18, a);
    fx = 4;
    fy = lerp(-4, -8, a);
    lift = ss(t, T.tongue3 - 0.05, T.up - 0.05);
    cz = 1.2;
    press = pulse(t, FIRE.click - 0.12, FIRE.click - 0.07, FIRE.click + 0.05, FIRE.click + 0.2);
    glow = ss(t, T.up - 0.15, T.up);
  }
  const cx = 540 - fx * px, cy = 900 - fy * px;
  const tg = tongueShape(lift, cz, press);
  const ringT0 = part === 2 ? FIRE.click - 0.08 : T.roof - 0.02;
  const ring = blip(t, ringT0, 0.35);
  const contact = {x: cz, y: palate(cz) + 0.5};
  const w = (n: number) => ({strokeWidth: n, vectorEffect: 'non-scaling-stroke' as const});
  const padZ0 = PAD.cz - PAD.h / 2, padZ1 = PAD.cz + PAD.h / 2;
  const padPts: P[] = Array.from({length: 16}, (_, i) => {
    const z = lerp(padZ0, padZ1, i / 15);
    const dent = press * 0.7 * Math.exp(-((z - cz) ** 2) / 8);
    return {x: z, y: palate(z) + 0.75 - dent};
  });
  const platePts: P[] = PAL.filter((p) => p.x <= 15.5 && p.x >= -10.5).map((p) => ({x: p.x, y: p.y + 0.55}));
  const shell = smoothPath([{x: 23.2, y: -12}, {x: 23.4, y: -3}, {x: 21.6, y: 1.2}, {x: 18.0, y: 1.4}, {x: 10, y: 0.8}, {x: -22.5, y: -1.2}, {x: -23.5, y: -9.6}, {x: -22, y: -11.2}, {x: 14.5, y: -10.6}, {x: 16, y: -13.2}], true, 0.35);
  return (
    <g>
      <defs>
        <linearGradient id="se-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E8C93" />
          <stop offset="1" stopColor="#173A52" />
        </linearGradient>
        <clipPath id="se-cut"><path d={CUT_D} /></clipPath>
        <clipPath id="se-shirt"><path d="M -120 46 Q -30 30 50 50 L 70 160 L -150 160 Z" /></clipPath>
        <radialGradient id="se-glow"><stop offset="0" stopColor="#FFF6C8" stopOpacity={1} /><stop offset="1" stopColor="#FFE08A" stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#se-bg)" />
      <g transform={`translate(${cx} ${cy}) scale(${px})`}>
        {/* neck and the striped tee */}
        <path d="M -58 20 L -60 70 L 4 70 L 2 22 Z" fill={look.skin} stroke={INK} {...w(3)} />
        <path d="M -120 46 Q -30 30 50 50 L 70 160 L -150 160 Z" fill="#FFFFFF" stroke={INK} {...w(3)} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={-150} y={58 + i * 24} width={230} height={11} fill="#FFC744" clipPath="url(#se-shirt)" />)}
        {/* hair behind */}
        <path d="M -98 -56 L -118 -74 L -100 -90 L -112 -112 L -86 -110 L -84 -136 L -60 -122 L -50 -150 L -30 -126 L -12 -150 L 0 -122 L 22 -136 L 22 -108 L 40 -104 L 26 -86 Q -20 -96 -60 -84 Q -84 -76 -94 -46 Z" fill={look.hairColor} stroke={INK} {...w(3.4)} strokeLinejoin="round" />
        {/* the head: the rig's round head, in profile */}
        <path d={HEAD_D} fill={look.skin} stroke={INK} {...w(3.4)} />
        <ellipse cx={-44} cy={-34} rx={10} ry={14} fill={look.skin} stroke={INK} {...w(3)} />
        <path d="M -46 -40 Q -40 -34 -46 -27" fill="none" stroke={INK} {...w(2)} />
        {/* eye (white, ink pupil, highlight) and brow, as on the rig */}
        <ellipse cx={18} cy={-58} rx={8} ry={11} fill="#FFFFFF" stroke={INK} {...w(2.6)} />
        <circle cx={21} cy={-57} r={4.2} fill={INK} />
        <circle cx={22.4} cy={-58.6} r={1.3} fill="#FFFFFF" />
        <path d="M 8 -76 L 26 -74" stroke={INK} {...w(3.6)} strokeLinecap="round" />
        <circle cx={6} cy={-30} r={10} fill="#EF6B55" opacity={0.42} />
        {/* the cut-away */}
        <g clipPath="url(#se-cut)">
          <rect x={-60} y={-40} width={120} height={90} fill="#F7C3B5" />
          {/* bony palate above the roof of the mouth, nasal floor above that */}
          <path d={smoothPath([...PAL.map((p) => ({x: p.x, y: p.y - 3.4})), ...[...PAL].reverse().map((p) => ({x: p.x, y: p.y}))], true, 0.3)} fill="#F3E6CF" stroke={INK} {...w(1.6)} />
          {/* oral cavity */}
          <path d={smoothPath([{x: 16, y: palate(16)}, ...PAL.slice(1), {x: -30, y: 4}, {x: -28, y: 22}, {x: 12, y: 20}], true, 0.3)} fill="#6E2232" />
          {/* upper teeth: the far row, seen through the section; then the incisor */}
          {[-19, -12.5, -6.5, -1, 4, 9].map((z, i) => (
            <path key={i} d={`M ${z - 2.9} -9.5 Q ${z - 3.2} ${-1.4 - (i < 2 ? 1.4 : 0.6)} ${z - 2} ${-0.6 - (i < 2 ? 1.4 : 0.5)} L ${z + 2} ${-0.6 - (i < 2 ? 1.4 : 0.5)} Q ${z + 3.2} ${-1.4 - (i < 2 ? 1.4 : 0.6)} ${z + 2.9} -9.5 Z`} fill={DEV.tooth1} stroke={INK} {...w(1.4)} />
          ))}
          <path d="M 16 -11.5 Q 15.6 -4 18.8 0.4 L 21.4 0.2 Q 22.8 -6 21.8 -11.5 Z" fill={DEV.tooth0} stroke={INK} {...w(1.8)} />
          {/* lower teeth and jaw bone */}
          {[-19, -12.5, -6.5, -1, 4, 9].map((z, i) => (
            <path key={i} d={`M ${z - 2.8} 9.5 Q ${z - 3} ${2.2 + (i < 2 ? 1.4 : 0.5)} ${z - 2} ${1.6 + (i < 2 ? 1.4 : 0.5)} L ${z + 2} ${1.6 + (i < 2 ? 1.4 : 0.5)} Q ${z + 3} ${2.2 + (i < 2 ? 1.4 : 0.5)} ${z + 2.8} 9.5 Z`} fill={DEV.tooth1} stroke={INK} {...w(1.4)} />
          ))}
          <path d="M 14.4 11.5 Q 14.8 5 17.6 1.6 L 19.6 2 Q 18.8 6.5 18 11.5 Z" fill={DEV.tooth0} stroke={INK} {...w(1.8)} />
          <path d="M -40 13 Q -10 11 20 12 Q 26 22 18 34 L -40 38 Z" fill="#F3E6CF" stroke={INK} {...w(1.6)} />
          {/* the MouthPad: clear shell over the upper teeth, plate along the palate, battery module at the rear molars */}
          <path d={shell} fill="rgba(205,236,250,0.38)" stroke="rgba(240,252,255,0.95)" {...w(3)} />
          <path d={shell} fill="none" stroke={INK} {...w(1.2)} opacity={0.5} />
          <path d={smoothPath(platePts, false)} fill="none" stroke="rgba(225,246,255,0.95)" strokeWidth={1.5} strokeLinecap="round" />
          <path d={smoothPath(platePts, false)} fill="none" stroke={INK} {...w(1.1)} opacity={0.55} />
          <path d="M -20.5 -6.4 L -9.8 -6.8" stroke={INK} strokeWidth={5.6} strokeLinecap="round" />
          <path d="M -20.5 -6.4 L -9.8 -6.8" stroke={DEV.pod1} strokeWidth={4.6} strokeLinecap="round" />
          <path d="M -20.2 -7.3 L -10.1 -7.7" stroke={DEV.pod0} strokeWidth={1.7} strokeLinecap="round" />
          {/* tongue */}
          <path d={smoothPath(tg, true, 0.45)} fill="#EE8E98" stroke={INK} {...w(2.4)} />
          <path d={smoothPath(tg.slice(1, 6).map((p) => ({x: p.x - 0.6, y: p.y + 1.8})), false)} fill="none" stroke="#F8B7BD" strokeWidth={1.2} strokeLinecap="round" opacity={0.8} />
          {/* the gold pad on the roof of the mouth (dents slightly under a press) */}
          <path d={smoothPath(padPts, false)} fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" />
          <path d={smoothPath(padPts, false)} fill="none" stroke={DEV.gold1} strokeWidth={1.4} strokeLinecap="round" />
          <path d={smoothPath(padPts, false)} fill="none" stroke={DEV.gold0} strokeWidth={0.5} strokeLinecap="round" />
          {glow > 0.01 && lift > 0.8 && <circle cx={contact.x} cy={contact.y} r={7 + 4 * press} fill="url(#se-glow)" opacity={glow} />}
          {ring > 0.01 && <circle cx={contact.x} cy={contact.y} r={2 + (t - ringT0) * 26} fill="none" stroke="#FFFFFF" {...w(4)} opacity={ring} />}
          {/* lips, closed, in section */}
          <path d="M 21.8 -12 Q 30 -11 31.6 -5 Q 31.4 0.6 22.2 1.3 Z" fill="#E08E86" stroke={INK} {...w(1.8)} />
          <path d="M 21 1.5 Q 30 1.6 30 6.5 Q 28.6 11.5 19.4 12 Z" fill="#E08E86" stroke={INK} {...w(1.8)} />
        </g>
        <path d={CUT_D} fill="none" stroke={INK} {...w(3)} />
        {/* nose */}
        <path d="M 38 -42 Q 47 -34 48 -26 Q 47 -21 39 -21" fill={look.skin} stroke={INK} {...w(3)} strokeLinejoin="round" />
      </g>
    </g>
  );
};

// the rig's round head in profile (section mm): a circle with a small chin
const HEAD_D = smoothPath([
  {x: -30, y: -112}, {x: 14, y: -104}, {x: 38, y: -76}, {x: 44, y: -40}, {x: 38, y: -20}, {x: 33, y: -6}, {x: 32.5, y: 6}, {x: 30, y: 16},
  {x: 24, y: 26}, {x: 6, y: 34}, {x: -24, y: 36}, {x: -60, y: 26}, {x: -92, y: 0}, {x: -104, y: -38}, {x: -92, y: -78}, {x: -66, y: -104},
]);
// the opened region: the mouth, in front of the throat, under the nose
const CUT_D = smoothPath([
  {x: 33.6, y: -16}, {x: 34.4, y: 2}, {x: 31.5, y: 15}, {x: 22, y: 25}, {x: -6, y: 30}, {x: -32, y: 26}, {x: -37, y: 2}, {x: -32, y: -24}, {x: -6, y: -30}, {x: 20, y: -24},
], true, 0.45);
void clamp; void Jaw;
