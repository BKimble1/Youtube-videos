// V2 side cut-away of the guesser's head. The anatomy is the V1 section (the palate is the model's own midline,
// vault(0, z)); the MouthPad itself is now the shared 3D model seen from the side with its near half cut away, so the
// device that flies in from the product view is the same object that sits on the roof of the mouth.
import React from 'react';
import {Jaw, vault, PAD, DEV} from '../art/jaw3d';
import {CAST} from '../crew';
import {lerp, smoothPath, P} from '../lib';

const INK = '#162A32';
const look = CAST.guesser;
export const palate = (z: number) => -vault(0, z);
const PAL: P[] = Array.from({length: 40}, (_, i) => {
  const z = 15 - (i / 39) * 38;
  return {x: z, y: palate(z)};
});
/** the tongue in profile: a body resting on the floor of the mouth with a defined tip. Lifting curls the tip and
 *  blade up to the pad at cz while the body stays low, so the airway above it stays open (dark). */
const tongueShape = (lift: number, cz: number, press: number): P[] => {
  const L = (a: P, b: P) => ({x: lerp(a.x, b.x, lift), y: lerp(a.y, b.y, lift)});
  const up = (z: number, off: number) => ({x: z, y: palate(z) + off});
  const tipTop = L({x: 12.6, y: -1.6}, up(cz, 0.45 - press * 0.65));
  const tipFront = L({x: 14.6, y: 1.4}, up(cz + 1.9, 2.4));
  const underTip = L({x: 13.2, y: 4.4}, up(cz + 0.6, 5.0));
  const blade = L({x: 6, y: -4.6}, up(cz - 4.2, 3.0));
  const dorsum = L({x: -6, y: -6.2}, {x: cz - 11, y: palate(cz - 11) + 8.5});
  return [
    tipFront, underTip,
    L({x: 10.5, y: 8.5}, {x: cz - 1, y: palate(cz) + 9.5}), // underside of the tongue, the frenulum
    {x: 6, y: 12.5}, {x: -10, y: 13.5}, {x: -26, y: 12}, {x: -31, y: 5},
    {x: -29, y: -2}, {x: -21, y: lerp(-4.8, -5.6, lift)}, dorsum, blade, tipTop,
  ];
};
export const SECTION_VIEW = {yaw: 90, pitch: 0, persp: 4000};
const SHELL_D = smoothPath([{x: 23.2, y: -12}, {x: 23.4, y: -3}, {x: 21.6, y: 1.2}, {x: 18.0, y: 1.4}, {x: 10, y: 0.8}, {x: -22.5, y: -1.2}, {x: -23.5, y: -9.6}, {x: -22, y: -11.2}, {x: 14.5, y: -10.6}, {x: 16, y: -13.2}], true, 0.35);

/** cx, cy: screen position of the model origin; px: screen px per mm; reveal: the head and anatomy (0..1); near:
 *  opacity of the device's near half; ring: seconds since the contact flash (or < 0) */
export const SectionScene: React.FC<{cx: number; cy: number; px: number; lift: number; cz: number; press: number; glow: number; ring: number; reveal: number; near: number; bg?: boolean; device?: boolean | number}> =
  ({cx, cy, px, lift, cz, press, glow, ring, reveal, near, bg = true, device = true}) => {
  const tg = tongueShape(lift, cz, press);
  const dO = typeof device === 'number' ? device : device ? 1 : 0; // (V4) the device fades in over the hand-off
  const contact = {x: cz, y: palate(cz) + 0.5};
  const w = (n: number) => ({strokeWidth: n, vectorEffect: 'non-scaling-stroke' as const});
  const padZ0 = PAD.cz - PAD.h / 2, padZ1 = PAD.cz + PAD.h / 2;
  const padPts: P[] = Array.from({length: 16}, (_, i) => {
    const z = lerp(padZ0, padZ1, i / 15);
    const dent = press * 0.7 * Math.exp(-((z - cz) ** 2) / 8);
    return {x: z, y: palate(z) + 0.75 - dent};
  });
  const ringO = ring >= 0 ? Math.max(0, 1 - ring / 0.35) : 0;
  return (
    <g>
      <defs>
        <linearGradient id="s2-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E8C93" /><stop offset="1" stopColor="#173A52" /></linearGradient>
        <clipPath id="s2-cut"><path d={CUT_D} /></clipPath>
        <clipPath id="s2-shirt"><path d="M -120 46 Q -30 30 50 50 L 70 160 L -150 160 Z" /></clipPath>
        <radialGradient id="s2-glow"><stop offset="0" stopColor="#FFF6C8" stopOpacity={1} /><stop offset="1" stopColor="#FFE08A" stopOpacity={0} /></radialGradient>
      </defs>
      {bg && <rect x={0} y={0} width={1080} height={1920} fill="url(#s2-bg)" />}
      <g transform={`translate(${cx} ${cy}) scale(${px})`}>
        <g opacity={reveal}>
          <path d="M -58 20 L -60 70 L 4 70 L 2 22 Z" fill={look.skin} stroke={INK} {...w(3)} />
          <path d="M -120 46 Q -30 30 50 50 L 70 160 L -150 160 Z" fill="#FFFFFF" stroke={INK} {...w(3)} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-150} y={58 + i * 24} width={230} height={11} fill="#FFC744" clipPath="url(#s2-shirt)" />)}
          <path d="M -98 -56 L -118 -74 L -100 -90 L -112 -112 L -86 -110 L -84 -136 L -60 -122 L -50 -150 L -30 -126 L -12 -150 L 0 -122 L 22 -136 L 22 -108 L 40 -104 L 26 -86 Q -20 -96 -60 -84 Q -84 -76 -94 -46 Z" fill={look.hairColor} stroke={INK} {...w(3.4)} strokeLinejoin="round" />
          <path d={HEAD_D} fill={look.skin} stroke={INK} {...w(3.4)} />
          <ellipse cx={-44} cy={-34} rx={10} ry={14} fill={look.skin} stroke={INK} {...w(3)} />
          <path d="M -46 -40 Q -40 -34 -46 -27" fill="none" stroke={INK} {...w(2)} />
          <ellipse cx={18} cy={-58} rx={8} ry={11} fill="#FFFFFF" stroke={INK} {...w(2.6)} />
          <circle cx={21} cy={-57} r={4.2} fill={INK} />
          <circle cx={22.4} cy={-58.6} r={1.3} fill="#FFFFFF" />
          <path d="M 8 -76 L 26 -74" stroke={INK} {...w(3.6)} strokeLinecap="round" />
          <circle cx={6} cy={-30} r={10} fill="#EF6B55" opacity={0.42} />
          <g clipPath="url(#s2-cut)">
            <rect x={-60} y={-40} width={120} height={90} fill="#F7C3B5" />
            <path d={smoothPath([...PAL.map((p) => ({x: p.x, y: p.y - 3.4})), ...[...PAL].reverse().map((p) => ({x: p.x, y: p.y}))], true, 0.3)} fill="#F3E6CF" stroke={INK} {...w(1.6)} />
            <path d={smoothPath([{x: 16, y: palate(16)}, ...PAL.slice(1), {x: -30, y: 4}, {x: -28, y: 22}, {x: 12, y: 20}], true, 0.3)} fill="#6E2232" />
            {[-19, -12.5, -6.5, -1, 4, 9].map((z, i) => (
              <path key={i} d={`M ${z - 2.8} 9.5 Q ${z - 3} ${2.2 + (i < 2 ? 1.4 : 0.5)} ${z - 2} ${1.6 + (i < 2 ? 1.4 : 0.5)} L ${z + 2} ${1.6 + (i < 2 ? 1.4 : 0.5)} Q ${z + 3} ${2.2 + (i < 2 ? 1.4 : 0.5)} ${z + 2.8} 9.5 Z`} fill={DEV.tooth1} stroke={INK} {...w(1.4)} />
            ))}
            <path d="M 14.4 11.5 Q 14.8 5 17.6 1.6 L 19.6 2 Q 18.8 6.5 18 11.5 Z" fill={DEV.tooth0} stroke={INK} {...w(1.8)} />
            {/* upper teeth: the far row seen through the section, then the front incisor */}
            {[-19, -12.5, -6.5, -1, 4, 9].map((z, i) => (
              <path key={`u${i}`} d={`M ${z - 2.9} -9.5 Q ${z - 3.2} ${-1.4 - (i < 2 ? 1.4 : 0.6)} ${z - 2} ${-0.6 - (i < 2 ? 1.4 : 0.5)} L ${z + 2} ${-0.6 - (i < 2 ? 1.4 : 0.5)} Q ${z + 3.2} ${-1.4 - (i < 2 ? 1.4 : 0.6)} ${z + 2.9} -9.5 Z`} fill={DEV.tooth1} stroke={INK} {...w(1.4)} />
            ))}
            <path d="M 16 -11.5 Q 15.6 -4 18.8 0.4 L 21.4 0.2 Q 22.8 -6 21.8 -11.5 Z" fill={DEV.tooth0} stroke={INK} {...w(1.8)} />
            {/* the MouthPad's clear shell over the upper teeth (about 1 mm) */}
            <path d={SHELL_D} fill="rgba(205,236,250,0.38)" stroke="rgba(240,252,255,0.95)" {...w(3)} />
            <path d={SHELL_D} fill="none" stroke={INK} {...w(1.1)} opacity={0.5} />
            <path d="M -40 13 Q -10 11 20 12 Q 26 22 18 34 L -40 38 Z" fill="#F3E6CF" stroke={INK} {...w(1.6)} />
          </g>
        </g>
        {/* the MouthPad and the upper teeth: the 3D model from the side, its near half cut away */}
        <g clipPath={reveal > 0.98 ? 'url(#s2-cut)' : undefined}>
          <Jaw view={SECTION_VIEW} px={px} id="s2-jaw" show={{palate: 0, pad: 0, teeth: 0, traces: 0.5 * near * dO, shell: near * dO, plate: dO, pods: dO}} near={near} />
        </g>
        <g opacity={reveal} clipPath="url(#s2-cut)">
          <path d={smoothPath(tg, true, 0.42)} fill="#EE8E98" stroke={INK} {...w(2.4)} />
          {/* a soft highlight along the top of the tongue, and the tip picked out */}
          <path d={smoothPath([tg[8], tg[9], tg[10], tg[11]].map((p) => ({x: p.x + 0.2, y: p.y + 1.4})), false)} fill="none" stroke="#F8B7BD" strokeWidth={1.1} strokeLinecap="round" opacity={0.85} />
          <circle cx={tg[11].x + 0.6} cy={tg[11].y + 1.2} r={1.1} fill="#F8C4C9" opacity={0.9} />
          <path d="M 21.8 -12 Q 30 -11 31.6 -5 Q 31.4 0.6 22.2 1.3 Z" fill="#E08E86" stroke={INK} {...w(1.8)} />
          <path d="M 21 1.5 Q 30 1.6 30 6.5 Q 28.6 11.5 19.4 12 Z" fill="#E08E86" stroke={INK} {...w(1.8)} />
        </g>
        {/* the gold pad on the roof of the mouth, cut through its middle */}
        <g opacity={reveal}>
          <path d={smoothPath(padPts, false)} fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" />
          <path d={smoothPath(padPts, false)} fill="none" stroke={DEV.gold1} strokeWidth={1.4} strokeLinecap="round" />
          <path d={smoothPath(padPts, false)} fill="none" stroke={DEV.gold0} strokeWidth={0.5} strokeLinecap="round" />
        </g>
        {glow > 0.01 && lift > 0.8 && <circle cx={contact.x} cy={contact.y} r={7 + 4 * press} fill="url(#s2-glow)" opacity={glow} />}
        {ringO > 0.01 && <circle cx={contact.x} cy={contact.y} r={2 + ring * 30} fill="none" stroke="#FFFFFF" {...w(5)} opacity={ringO} />}
        <g opacity={reveal}>
          <path d={CUT_D} fill="none" stroke={INK} {...w(3)} />
          <path d="M 38 -42 Q 47 -34 48 -26 Q 47 -21 39 -21" fill={look.skin} stroke={INK} {...w(3)} strokeLinejoin="round" />
        </g>
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
