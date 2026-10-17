// The clasp (D3): the friend's right hand and the Director's right hand, fingers interlaced, seen from above on the
// bed sheet. Purpose-built for the spine beat in the series' close-up hand language (flat skin, one ink weight, soft
// mitt-like fingers): `grip` 1 → 0 is the friend's grip letting go (fingertips slide back off the Director's hand and
// the fingers straighten and part), `sag` lets the friend's wrist go heavy, `squeeze` is the Director's answering grip.
// Local frame: x runs from the friend's wrist (left) to the Director's wrist (right); place it with x, y, rot, s.
import React from 'react';
import {C, BLOOD} from '../../theme';
import {blob} from '../../rig/actor';
import {V2, lerp, smoothPath, f2, clamp} from '../../kit/math';
import {mixHex} from '../../fx/common';

type Finger = {base: V2; mid: V2; tip: V2; w: number; w1?: number};
/** A soft tapered finger along a quadratic curve (base → tip), with a rounded tip, ink outline and a knuckle crease. */
const fingerEl = (f: Finger, skin: string, ink: number, key: string, crease = true) => {
  const N = 10;
  const w0 = f.w, w1 = f.w1 ?? f.w * 0.82;
  const P = (u: number) => ({x: (1 - u) * (1 - u) * f.base.x + 2 * (1 - u) * u * f.mid.x + u * u * f.tip.x, y: (1 - u) * (1 - u) * f.base.y + 2 * (1 - u) * u * f.mid.y + u * u * f.tip.y});
  const D = (u: number) => ({x: 2 * (1 - u) * (f.mid.x - f.base.x) + 2 * u * (f.tip.x - f.mid.x), y: 2 * (1 - u) * (f.mid.y - f.base.y) + 2 * u * (f.tip.y - f.mid.y)});
  const L: V2[] = [], R: V2[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = P(u), d = D(u), l = Math.hypot(d.x, d.y) || 1;
    const nx = -d.y / l, ny = d.x / l, w = lerp(w0, w1, u) / 2;
    L.push({x: p.x + nx * w, y: p.y + ny * w}); R.push({x: p.x - nx * w, y: p.y - ny * w});
  }
  // rounded tip: a half circle around the end point
  const e = P(1), de = D(1), le = Math.hypot(de.x, de.y) || 1, ux = de.x / le, uy = de.y / le;
  const cap: V2[] = [];
  const nX = -uy, nY = ux, r = w1 / 2;
  for (let k = 1; k < 6; k++) {
    const a = (Math.PI * k) / 6;
    cap.push({x: e.x + r * (nX * Math.cos(a) + ux * Math.sin(a)), y: e.y + r * (nY * Math.cos(a) + uy * Math.sin(a))});
  }
  // rounded base too (the knuckle), so a finger reads as attached wherever it meets the hand
  const b0 = P(0), db = D(0), lb = Math.hypot(db.x, db.y) || 1, bx = db.x / lb, by = db.y / lb, r0 = w0 / 2;
  const capB: V2[] = [];
  for (let k = 1; k < 6; k++) {
    const a = (Math.PI * k) / 6;
    capB.push({x: b0.x + r0 * (by * Math.cos(a) - bx * Math.sin(a)), y: b0.y + r0 * (-bx * Math.cos(a) - by * Math.sin(a))});
  }
  const outline = [...L, ...cap, ...[...R].reverse(), ...capB];
  const d = 'M ' + outline.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ') + ' Z';
  const c = P(0.64), dc = D(0.64), lc = Math.hypot(dc.x, dc.y) || 1, nx = -dc.y / lc, ny = dc.x / lc, wc = lerp(w0, w1, 0.64) * 0.24;
  return (
    <g key={key}>
      <path d={d} fill={skin} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      {crease && <path d={`M ${f2(c.x + nx * wc)} ${f2(c.y + ny * wc)} L ${f2(c.x - nx * wc)} ${f2(c.y - ny * wc)}`} stroke={C.ink} strokeWidth={ink * 0.55} strokeLinecap="round" opacity={0.5} />}
    </g>
  );
};

export type ClaspProps = {x: number; y: number; rot?: number; s?: number; t: number; grip: number; sag?: number; squeeze?: number;
  skinF: string; skinD: string; pale?: number; bloodF?: number; bloodD?: number; ink?: number};

export const Clasp: React.FC<ClaspProps> = ({x, y, rot = 0, s = 1, t, grip, sag = 0, squeeze = 0, skinF, skinD, pale = 0, bloodF = 0, bloodD = 0, ink = 5}) => {
  void t;
  const g = clamp(grip), sg = clamp(sag), sq = clamp(squeeze);
  const sf = mixHex(skinF, '#E2DAD2', 0.3 * pale);
  const sfShade = mixHex(sf, '#B88E78', 0.35);
  const sdShade = mixHex(skinD, '#7A4A2C', 0.35);
  const k = ink / s;
  // the friend's hand: wrist at (−430, 0); as it goes heavy it slides a little back and rotates (heel down)
  const fx = -10 * sg - 16 * (1 - g), fy = 12 * sg, fr = 6 * sg;
  // lanes across the interlace (8 alternating fingers): Director D, friend F
  const lanesD = [-150, -64, 22, 108], lanesF = [-107, -21, 65, 151];
  const elsBack: React.ReactElement[] = [];
  const elsFront: React.ReactElement[] = [];
  // ---- the friend's forearm and hand back
  const fArm = <path key="farm" d={`M -1400 -90 Q -900 -70 -430 -64 L -430 76 Q -900 92 -1400 120 Z`} fill={sf} stroke={C.ink} strokeWidth={k} strokeLinejoin="round" />;
  const fBack = smoothPath([{x: -470, y: -66}, {x: -300, y: -112}, {x: -150, y: -128}, {x: -110, y: -60}, {x: -100, y: 40}, {x: -120, y: 148}, {x: -260, y: 150}, {x: -460, y: 82}], true, 0.5);
  // ---- the Director's forearm and hand back (mirrored, from the right)
  const dArm = <path key="darm" d={`M 1400 -110 Q 900 -96 440 -82 L 440 92 Q 900 104 1400 130 Z`} fill={skinD} stroke={C.ink} strokeWidth={k} strokeLinejoin="round" />;
  const dBack = smoothPath([{x: 470, y: -84}, {x: 300, y: -150}, {x: 150, y: -176}, {x: 112, y: -96}, {x: 104, y: 10}, {x: 120, y: 134}, {x: 270, y: 140}, {x: 470, y: 94}], true, 0.5);
  // ---- fingers
  // Director's fingers: from their knuckles (x ≈ 120) leftward through the interlace, curling over the friend's hand
  // back (tips at x ≈ −190 … −150). A squeeze curls them a little further.
  lanesD.forEach((ly, i) => {
    const len = [1, 1.08, 1.04, 0.86][i];
    const base = {x: 128, y: ly * 0.62 - 20};
    const tip = {x: -150 - (60 + 20 * sq) * len, y: ly * 0.86 - 6 + 6 * sq};
    const mid = {x: lerp(base.x, tip.x, 0.55), y: lerp(base.y, tip.y, 0.5) - 6};
    elsFront.push(fingerEl({base, mid, tip, w: 46, w1: 40}, skinD, k, `d${i}`));
  });
  // the Director's thumb lies along the near (lower) edge over the friend's thumb base
  {
    const base = {x: 300, y: 128}, tip = {x: 70 - 20 * sq, y: 196 + 6 * sq};
    elsFront.push(fingerEl({base, mid: {x: 190, y: 182}, tip, w: 46}, skinD, k, 'dth'));
  }
  // Friend's fingers: from their knuckles (x ≈ −120) rightward between the Director's fingers; gripping, the tips
  // curl down onto the Director's hand back (x ≈ 170 … 210); letting go, the tips slide back out and the fingers
  // straighten and part (they rest flat in the gaps, tips short of the Director's knuckles).
  lanesF.forEach((ly, i) => {
    const len = [1, 1.06, 1.02, 0.84][i];
    const base = {x: -118 + fx, y: ly * 0.6 + fy - 6};
    const tipG = {x: 150 + 52 * len, y: ly * 0.84};
    const tipR = {x: 0 + 66 * len, y: ly * 1.2 + 16};
    const tip = {x: lerp(tipR.x, tipG.x, g) + fx * 0.8, y: lerp(tipR.y, tipG.y, g) + fy};
    const mid = {x: lerp(base.x, tip.x, 0.5), y: lerp(base.y, tip.y, 0.5) + lerp(10, -4, g)};
    // relaxed fingers rise off the sheet and foreshorten a little (thinner at the tip end)
    elsFront.push(fingerEl({base, mid, tip, w: lerp(42, 45, g), w1: lerp(34, 39, g)}, sf, k, `f${i}`, g > 0.4));
  });
  // the friend's thumb: hooked over the Director's index side when gripping; slips off and falls toward the sheet
  {
    const base = {x: -300 + fx, y: -96 + fy};
    const tipG = {x: 60, y: -214};
    const tipR = {x: -140 + fx, y: -196 + fy * 0.5};
    const tip = {x: lerp(tipR.x, tipG.x, g), y: lerp(tipR.y, tipG.y, g)};
    elsBack.push(fingerEl({base, mid: {x: lerp(base.x, tip.x, 0.5), y: lerp(-170, -200, g)}, tip, w: 46}, sf, k, 'fth'));
  }
  // order: arms, hand backs, then interleave fingers so neighbours overlap consistently
  const order = [...elsFront];
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(s)})`}>
      {/* soft contact shadows on the sheet */}
      <ellipse cx={-700} cy={60} rx={720} ry={120} fill="rgba(60,50,40,0.08)" />
      <ellipse cx={700} cy={70} rx={720} ry={130} fill="rgba(60,50,40,0.08)" />
      <ellipse cx={0} cy={30} rx={300} ry={170} fill="rgba(60,50,40,0.07)" />
      <g transform={`rotate(${f2(fr)} -430 0) translate(${f2(fx)} ${f2(fy)})`}>
        {fArm}
        <path d={fBack} fill={sf} stroke={C.ink} strokeWidth={k} strokeLinejoin="round" />
        <path d={`M -440 -40 Q -330 -66 -210 -74`} fill="none" stroke={sfShade} strokeWidth={k * 0.8} strokeLinecap="round" opacity={0.7} />
        {bloodF > 0 && <path d={blob(30, 17, 9, 0.5, 1.5, 0.8)} transform="translate(-300 40)" fill={BLOOD.dry} opacity={0.7 * bloodF} />}
      </g>
      {elsBack}
      {dArm}
      <path d={dBack} fill={skinD} stroke={C.ink} strokeWidth={k} strokeLinejoin="round" />
      <path d={`M 450 -50 Q 330 -90 210 -104`} fill="none" stroke={sdShade} strokeWidth={k * 0.8} strokeLinecap="round" opacity={0.6} />
      {bloodD > 0 && <path d={blob(26, 41, 9, 0.5, 1.4, 0.8)} transform="translate(330 30)" fill={BLOOD.dry} opacity={0.65 * bloodD} />}
      {order}
    </g>
  );
};
