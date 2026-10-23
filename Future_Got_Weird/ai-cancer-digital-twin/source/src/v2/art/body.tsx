// The patient: one front-view human model used in every body-scale shot (same geometry for the warm anatomical view,
// the translucent organ cutaway and the cyan digital twin). Units: the figure is ~1720 tall, centred on (0, 0).
// Anatomy is simplified but placed correctly: lungs either side of the heart (heart slightly to the patient's left =
// viewer's right), liver under the right lung (viewer's left), stomach under the left lung, aorta down the midline.
import React from 'react';
import {closedPath, openPath, P as Pt, noise, lerp, clamp01, smooth, mixHex} from '../../kit/core';
import {P} from '../palette';

type Pt2 = [number, number];
// right half of the silhouette, top centre → down the outside → back up the inside of the leg to the crotch
const HALF: Pt2[] = [
  [0, -850], [52, -838], [82, -800], [90, -755], [80, -706], [56, -676], [42, -660], [46, -632], [90, -612], [170, -596], [222, -578], [246, -548],
  [258, -470], [268, -360], [276, -250], [286, -120], [298, 0], [310, 80], [314, 140], [300, 178], [278, 170], [262, 120], [254, 40], [238, -90],
  [222, -240], [204, -380], [182, -452], [170, -380], [156, -260], [144, -140], [158, -40], [184, 50], [190, 150], [180, 300], [156, 450], [146, 520],
  [148, 600], [134, 720], [118, 800], [150, 836], [140, 856], [70, 856], [62, 820], [64, 760], [62, 640], [58, 520], [52, 420], [40, 260], [18, 140], [0, 118],
];
export const SILHOUETTE: Pt2[] = [...HALF, ...HALF.slice(1, -1).reverse().map(([x, y]) => [-x, y] as Pt2)];
export const BODY_PATH = closedPath(SILHOUETTE, 0.85);

/** Key anatomical sites (body units). TUMOR = patient's left upper lung lobe (viewer's right); METS = liver. */
export const SITE = {
  tumor: [118, -440] as Pt2,
  mets: [-96, -168] as Pt2,
  heart: [34, -360] as Pt2,
};

export const LUNG_R: Pt2[] = [[40, -560], [92, -575], [150, -540], [178, -460], [186, -360], [180, -270], [150, -232], [96, -246], [70, -290], [52, -360], [40, -440]];
const LUNG_L: Pt2[] = LUNG_R.map(([x, y]) => [-x - 6, y] as Pt2).map(([x, y], i) => (i >= 6 && i <= 8 ? [x - 6, y + 8] : [x, y]) as Pt2);
const HEART: Pt2[] = [[0, -420], [40, -430], [82, -396], [92, -340], [64, -292], [26, -276], [-14, -302], [-30, -350], [-18, -400]];
export const LIVER: Pt2[] = [[-182, -232], [-120, -252], [-40, -246], [40, -232], [70, -210], [40, -186], [-40, -150], [-120, -128], [-176, -146], [-196, -190]];
const STOMACH: Pt2[] = [[60, -228], [110, -236], [150, -210], [158, -160], [130, -116], [86, -110], [62, -140], [74, -180]];
const GUT_PATH = openPath([[-120, -96], [-60, -110], [20, -100], [120, -96], [140, -60], [80, -46], [-10, -54], [-110, -40], [-130, -6], [-60, 6], [30, -4], [120, 4], [126, 40], [40, 52], [-60, 48], [-120, 60]], 0.8);

export type BodyProps = {
  t: number;
  xray?: number;      // 0 = opaque skin, 1 = organs fully visible through translucent skin
  digital?: number;   // 0 = biological, 1 = cyan digital twin
  glow?: number;      // tumour-site glow strength
  glowColor?: string; // id of glow gradient
  mets?: number;      // secondary-site glow
  tumorSize?: number; // 0..1 visible tumour mass in the lung (organ view)
  metsSize?: number;
  scanY?: number;     // y of a scanning plane (body units), or undefined
  vessels?: number;   // circulatory overlay
  slices?: number;    // digital contour slices
  healthy?: number;   // final resolution: glow suppressed, warm healthy light
  chest?: number;     // a soft window through the skin over the chest showing the lungs (opening / ending)
  lesion?: number;    // the affected patch of lung tissue at SITE.tumor
  lineW?: number;     // digital-twin line weight multiplier (thinner lines for close-ups)
};

export const Body: React.FC<BodyProps> = ({t, xray = 0, digital = 0, glow = 0, glowColor = 'glowMag', mets = 0, tumorSize = 0, metsSize = 0, scanY, vessels = 0, slices = 0, healthy = 0, chest = 0, lesion = 0, lineW = 1}) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const bio = 1 - digital;
  const pulse = 0.75 + 0.25 * Math.sin(t * 3.2) + 0.1 * Math.sin(t * 7.1);
  const breathe = 1 + 0.006 * Math.sin(t * 1.4);
  const organOp = 0.15 + 0.85 * xray;
  const D = (c: string) => (digital > 0.5 ? P.ai : c);
  return (
    <g transform={`scale(1 ${breathe})`}>
      <defs>
        <clipPath id="bodyClip"><path d={BODY_PATH} /></clipPath>
        <radialGradient id={`chestWin${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.62" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id={`organMask${uid}`} maskUnits="userSpaceOnUse" x={-500} y={-1000} width={1000} height={2000}>
          <rect x={-500} y={-1000} width={1000} height={2000} fill="#FFFFFF" opacity={organOp} />
          {chest > 0.01 && <ellipse cx={20} cy={-420} rx={250} ry={225} fill={`url(#chestWin${uid})`} opacity={chest} />}
        </mask>
      </defs>
      {/* soft back-light halo */}
      <ellipse cx={0} cy={-120} rx={520} ry={980} fill={digital > 0.5 ? 'url(#glowAi)' : 'url(#glowWhite)'} opacity={0.06 + 0.05 * healthy} />
      {/* ---------------- biological body ---------------- */}
      {bio > 0.01 && (
        <g opacity={bio}>
          <path d={BODY_PATH} fill="url(#skinGrad)" opacity={1 - 0.62 * xray} />
          <path d={BODY_PATH} fill="url(#volSoft)" opacity={1 - 0.5 * xray} />
          {/* surface anatomy: collarbones, chest, abdomen, knees (soft shading strokes) */}
          <g opacity={0.22 * (1 - xray)} fill="none" stroke={P.skinDeep} strokeWidth={6} strokeLinecap="round">
            <path d="M -40 -626 Q -110 -616 -190 -592 M 40 -626 Q 110 -616 190 -592" />
            <path d="M -10 -560 Q -100 -470 -170 -500 M 10 -560 Q 100 -470 170 -500" />
            <path d="M 0 -440 L 0 -60" strokeWidth={4} />
            <path d="M -60 -300 Q 0 -290 60 -300 M -56 -220 Q 0 -212 56 -220 M -52 -140 Q 0 -134 52 -140" strokeWidth={4} />
            <path d="M -150 -60 Q -100 60 -30 110 M 150 -60 Q 100 60 30 110" strokeWidth={5} />
            <path d="M -130 470 Q -100 490 -70 470 M 130 470 Q 100 490 70 470" strokeWidth={5} />
          </g>
          <ellipse cx={-26} cy={-790} rx={30} ry={46} fill="#FFFFFF" opacity={0.08 * (1 - xray)} />
          <g clipPath="url(#bodyClip)" mask={`url(#organMask${uid})`}>
            {/* rib cage hints */}
            {Array.from({length: 7}, (_, i) => {
              const y = -560 + i * 46;
              return (
                <g key={i} opacity={0.35 * xray}>
                  <path d={`M 8 ${y} Q 120 ${y - 18} 196 ${y + 40}`} fill="none" stroke={P.bone} strokeWidth={9} strokeLinecap="round" />
                  <path d={`M -8 ${y} Q -120 ${y - 18} -196 ${y + 40}`} fill="none" stroke={P.bone} strokeWidth={9} strokeLinecap="round" />
                </g>
              );
            })}
            <path d={closedPath(LUNG_R)} fill={P.lung} stroke={P.lungDeep} strokeWidth={5} />
            <path d={closedPath(LUNG_L)} fill={P.lung} stroke={P.lungDeep} strokeWidth={5} />
            {/* bronchial tree */}
            <path d="M 0 -640 L 0 -520 M 0 -520 Q 30 -500 60 -470 Q 90 -440 120 -400 M 60 -470 Q 100 -480 140 -500 M 0 -520 Q -30 -500 -60 -470 Q -92 -440 -122 -400 M -60 -470 Q -100 -480 -140 -500" fill="none" stroke={P.tissueLight} strokeWidth={8} strokeLinecap="round" opacity={0.8} />
            <path d={closedPath(LUNG_R)} fill="url(#volSoft)" />
            <path d={closedPath(LUNG_L)} fill="url(#volSoft)" />
            <path d={closedPath(HEART)} transform={`translate(${SITE.heart[0] - 6} -100) scale(${0.72 * (1 + 0.03 * Math.max(0, Math.sin(t * 7)))}) translate(0 140)`} fill={mixHex(P.heart, '#C8606A', 0.35)} stroke="#7A1A22" strokeWidth={5} />
            <path d={closedPath(HEART)} transform={`translate(${SITE.heart[0] - 6} -100) scale(0.72) translate(0 140)`} fill="url(#volSoft)" />
            <path d={closedPath(LIVER)} fill={P.liver} stroke="#5E1E1E" strokeWidth={5} />
            <path d={closedPath(LIVER)} fill="url(#volSoft)" />
            <path d={closedPath(STOMACH)} fill="#D9877A" stroke="#9E4E44" strokeWidth={5} />
            <path d={GUT_PATH} fill="none" stroke={P.gut} strokeWidth={30} strokeLinecap="round" opacity={0.9} />
            <path d={GUT_PATH} fill="none" stroke="#B87562" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
            {/* the affected lung shows its spongy tissue, and the patch where the cell sits is tinted (part of the
                lung, not a light floating over it) */}
            {(chest > 0.01 || lesion > 0.01) && (
              <g>
                <path d={closedPath(LUNG_R)} fill="url(#lungPat)" opacity={0.55 * Math.max(chest, xray)} />
                {lesion > 0.01 && (
                  <g>
                    <circle cx={SITE.tumor[0]} cy={SITE.tumor[1]} r={34} fill="url(#glowMag)" opacity={0.75 * lesion * (0.85 + 0.15 * pulse)} />
                    <path d={closedPath(Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2; const r = 17 * (1 + 0.3 * noise(i * 1.3, 2)); return [SITE.tumor[0] + Math.cos(a) * r, SITE.tumor[1] + Math.sin(a) * r] as Pt2; }))} fill={P.tumorLight} opacity={0.6 * lesion} />
                    <circle cx={SITE.tumor[0]} cy={SITE.tumor[1]} r={4} fill="#FFD6EC" opacity={lesion * (0.6 + 0.4 * pulse)} />
                  </g>
                )}
              </g>
            )}
            {/* tumour mass in the lung, metastasis in the liver */}
            {tumorSize > 0.01 && <path d={closedPath(Array.from({length: 11}, (_, i) => { const a = (i / 11) * Math.PI * 2; const r = 26 * tumorSize * (1 + 0.25 * noise(i * 1.3, 4)); return [SITE.tumor[0] + Math.cos(a) * r, SITE.tumor[1] + Math.sin(a) * r * 0.9] as Pt2; }))} fill={P.tumor} stroke={P.tumorDeep} strokeWidth={3} />}
            {metsSize > 0.01 && <path d={closedPath(Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2; const r = 16 * metsSize * (1 + 0.25 * noise(i * 1.7, 9)); return [SITE.mets[0] + Math.cos(a) * r, SITE.mets[1] + Math.sin(a) * r] as Pt2; }))} fill={P.tumor} stroke={P.tumorDeep} strokeWidth={3} />}
          </g>
          {/* circulation overlay */}
          {vessels > 0.01 && <Vessels t={t} op={vessels} />}
          {/* rim light */}
          <path d={BODY_PATH} fill="none" stroke={P.rim} strokeWidth={4} opacity={0.35} />
        </g>
      )}
      {/* ---------------- digital twin ---------------- */}
      {digital > 0.01 && (
        <g opacity={digital}>
          <path d={BODY_PATH} fill={P.aiBgLift} opacity={0.55} />
          <g clipPath="url(#bodyClip)">
            {slices > 0.01 && Array.from({length: 44}, (_, i) => {
              const y = -850 + i * 40;
              const k = clamp01(slices * 1.4 - (i / 44) * 0.4);
              return <line key={i} x1={-340} x2={-340 + 680 * k} y1={y} y2={y} stroke={P.ai} strokeWidth={1.6 * lineW} opacity={0.32} />;
            })}
            <path d={closedPath(LUNG_R)} fill={P.ai} fillOpacity={0.06} stroke={P.ai} strokeWidth={3 * lineW} />
            <path d={closedPath(LUNG_L)} fill={P.ai} fillOpacity={0.06} stroke={P.ai} strokeWidth={3 * lineW} />
            <path d={closedPath(HEART)} transform={`translate(${SITE.heart[0] - 30} 0)`} fill="none" stroke={P.ai} strokeWidth={3 * lineW} />
            <path d={closedPath(LIVER)} fill={P.ai} fillOpacity={0.05} stroke={P.ai} strokeWidth={3 * lineW} />
            <path d={closedPath(STOMACH)} fill="none" stroke={P.aiDeep} strokeWidth={3 * lineW} />
            <path d={GUT_PATH} fill="none" stroke={P.aiDeep} strokeWidth={3 * lineW} />
            <Vessels t={t} op={0.9} color={P.ai} w={lineW} />
            {tumorSize > 0.01 && <circle cx={SITE.tumor[0]} cy={SITE.tumor[1]} r={28 * tumorSize} fill={P.aiGold} fillOpacity={0.25} stroke={P.aiGold} strokeWidth={4 * lineW} />}
            {metsSize > 0.01 && <circle cx={SITE.mets[0]} cy={SITE.mets[1]} r={18 * metsSize} fill={P.aiGold} fillOpacity={0.25} stroke={P.aiGold} strokeWidth={4 * lineW} />}
          </g>
          <path d={BODY_PATH} fill="none" stroke={P.ai} strokeWidth={4 * lineW} />
          <path d={BODY_PATH} fill="none" stroke={P.aiHot} strokeWidth={1.5 * lineW} opacity={0.6} />
        </g>
      )}
      {/* scanning plane */}
      {scanY !== undefined && (
        <g>
          <rect x={-420} y={scanY - 3} width={840} height={6} fill={P.ai} />
          <rect x={-420} y={scanY - 60} width={840} height={60} fill={P.ai} opacity={0.1} />
          <ellipse cx={0} cy={scanY} rx={460} ry={30} fill="none" stroke={P.aiHot} strokeWidth={3} opacity={0.7} />
        </g>
      )}
      {/* tumour-site glow (the threat) and the secondary site */}
      {glow > 0.01 && (
        <g>
          <circle cx={SITE.tumor[0]} cy={SITE.tumor[1]} r={70 * (0.9 + 0.2 * pulse)} fill={`url(#${glowColor})`} opacity={glow} />
          <circle cx={SITE.tumor[0]} cy={SITE.tumor[1]} r={7} fill="#FFE1F1" opacity={glow * (0.6 + 0.4 * pulse)} />
        </g>
      )}
      {mets > 0.01 && <circle cx={SITE.mets[0]} cy={SITE.mets[1]} r={55 * (0.9 + 0.2 * pulse)} fill="url(#glowMag)" opacity={mets} />}
    </g>
  );
};

/** Major vessels (arteries red, veins blue-ish) as a flowing overlay. */
export const Vessels: React.FC<{t: number; op?: number; color?: string; w?: number}> = ({t, op = 1, color, w = 1}) => {
  const art = color ?? P.bloodLight, ven = color ?? '#7B5CC9';
  const A = 'M 6 -640 L 6 -560 Q 12 -420 10 -300 L 10 0 L 10 60 Q 40 200 70 420 Q 90 600 100 800 M 10 60 Q -20 200 -60 420 Q -80 600 -94 800 M 6 -580 Q 120 -600 200 -560 Q 250 -300 270 0 Q 280 80 290 140 M 6 -580 Q -120 -600 -200 -560 Q -250 -300 -270 0 Q -280 80 -290 140 M 6 -620 L 24 -760 M 6 -620 L -12 -760 M 10 -200 Q 60 -190 120 -180 M 10 -200 Q -60 -190 -120 -180';
  const V = 'M -14 -640 L -14 -560 Q -20 -420 -18 -300 L -18 60 Q -50 200 -78 420 Q -100 600 -110 800 M -18 60 Q 20 200 54 420 Q 74 600 86 800';
  return (
    <g opacity={op}>
      <path d={A} fill="none" stroke={art} strokeWidth={7 * w} strokeLinecap="round" opacity={0.75} />
      <path d={V} fill="none" stroke={ven} strokeWidth={7 * w} strokeLinecap="round" opacity={0.6} />
      <path d={A} fill="none" stroke="#FFFFFF" strokeWidth={3 * w} strokeLinecap="round" strokeDasharray="6 40" strokeDashoffset={-t * 160} opacity={0.5} />
    </g>
  );
};
export const _b = {lerp, smooth, Pt: null as unknown as Pt};
