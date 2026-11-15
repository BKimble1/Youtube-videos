// H: back on PHerc. 1667 (a cut back to the opening's landmark, column 19 at the opening zoom). Pull out to the whole
// ~1.4 m surface with its gaps, count the columns, return to column 19 and give the translated fragment room. On the
// last sentences the opening composition returns: the page re-rolls into the scan and the still-rolled object holds.
import React from 'react';
import {Chip, FONT_BODY, FONT_HEAD, K} from '../art/kit';
import {Cam, HOLE_PATHS, PageFace, quoteBox, toScreen, World} from '../art/Sheet';
import {FPS} from '../lib/core';
import {clamp, easeInOut, easeOut, lerp} from '../lib/math';
import {ADV, colCenter, FS, LAYOUT, NCOL, PH, PL} from '../lib/sheet';
import {TM} from '../lib/time';
import {C19, CAM_P, CAM_P_C, OpenComp, ROLL} from './Open';

const ZF = 1720 / PL;
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k))});
type K2 = [number, Cam, {x: number; y: number}];
const camAt = (t: number, keys: K2[]) => {
  if (t <= keys[0][0]) return {cam: keys[0][1], c: keys[0][2]};
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, A, ca] = keys[i];
    const [b, B, cb] = keys[i + 1];
    if (t <= b) {
      const k = easeInOut(clamp((t - a) / (b - a)));
      return {cam: lerpCam(A, B, k), c: {x: lerp(ca.x, cb.x, k), y: lerp(ca.y, cb.y, k)}};
    }
  }
  const L = keys[keys.length - 1];
  return {cam: L[1], c: L[2]};
};
const QUOTE_LINE = LAYOUT.glyphs.filter((g) => g.col === 19 && g.line === 11 && !g.trace);

export const SeqH: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const tCb = TM.youJust + 1.0;
  const callback = t >= tCb;
  if (callback) {
    // the opening composition returns: the left panel slides back in, the page re-rolls, the scan gives way
    const inK = easeInOut(clamp((t - tCb) / 1.1));
    const open = 1 - easeInOut(clamp((t - TM.still - 0.05) / 0.6));
    const u = 1 - easeInOut(clamp((t - TM.still - 0.45) / (TM.stillEnd + 0.5 - TM.still - 0.45)));
    const fade = easeInOut(clamp((t - TM.stillEnd - 0.4) / 1.1));
    const toC = easeInOut(clamp((t - TM.stillEnd - 0.3) / 1.6));
    const hold = clamp((t - TM.stillEnd - 1.9) / 2.5);
    const roll = {x: lerp(ROLL.x, 960, toC), y: lerp(ROLL.y, 470, toC), s: lerp(ROLL.s, 1.75, toC) * (1 + 0.05 * hold)};
    return (
      <g>
        <OpenComp f={f} st={{u, open, split: 1, roll, crumbs: 1.3, darkFade: fade, leader: inK * (1 - fade), chips: 1, leftIn: inK, scanIn: inK}} />
        {/* the rest of the sheet around column 19, shrinking back to the traced stretch */}
        {inK < 1 && (
          <g opacity={1 - inK} clipPath="url(#hcbclip)">
            <clipPath id="hcbclip">
              <rect x={980 + (1 - inK) * -980} y={0} width={1920} height={1080} />
            </clipPath>
            <World cam={CAM_P} cx={CAM_P_C.x} cy={CAM_P_C.y}>
              <PageFace id="hcb" anchor={{s: 0, x: 0, y: 0}} s0={C19 - 700} s1={C19 + 700} view={[C19 - 900, C19 + 900]} />
            </World>
          </g>
        )}
      </g>
    );
  }
  const C0 = {x: 960, y: 470};
  const CQ = {x: 960, y: 560};
  const {cam, c} = camAt(t, [
    [TM.back - 0.1, {x: C19, y: 0, z: 2.0}, C0],
    [TM.back + 0.25, {x: C19, y: 0, z: 2.0}, C0],
    [TM.feet + 0.1, {x: PL / 2, y: 0, z: ZF}, {x: 960, y: 430}],
    [TM.oneOf - 0.15, {x: PL / 2, y: 0, z: ZF * 1.06}, {x: 960, y: 430}],
    [TM.study + 0.3, {x: C19 + 4, y: 0, z: 2.35}, CQ],
    [TM.youJust - 0.1, {x: C19 + 4, y: 10, z: 2.55}, CQ],
    [tCb, {x: CAM_P.x, y: CAM_P.y, z: CAM_P.z}, CAM_P_C],
  ]);
  const view: [number, number] = [cam.x - c.x / cam.z - 60, cam.x + (1920 - c.x) / cam.z + 60];
  const scale = clamp((t - TM.back - 1.3) / 0.6) * (1 - clamp((t - TM.oneOf) / 0.5));
  const ticks = (k: number) => clamp((t - (TM.scholars + 0.1 + (k / NCOL) * (TM.columns - TM.scholars))) / 0.25) * (1 - clamp((t - TM.oneOf) / 0.5));
  const gaps = clamp((t - TM.gaps) / 0.4) * (1 - clamp((t - TM.missing - 0.6) / 0.5));
  const out = 1 - clamp((t - TM.youJust - 0.1) / 0.7);
  const hi = easeOut(clamp((t - TM.fragment - 0.2) / 0.6)) * out;
  const card = easeOut(clamp((t - TM.quote + 0.05) / 0.5)) * out;
  const pen = clamp((t - TM.somebody - 0.1) / (TM.ago - TM.somebody - 0.2));
  const qb = quoteBox();
  const left = toScreen(cam, 0, 0, c.x, c.y);
  const right = toScreen(cam, PL, 0, c.x, c.y);
  const yb = toScreen(cam, 0, PH / 2 + 30, c.x, c.y).y;
  const penG = QUOTE_LINE[Math.min(QUOTE_LINE.length - 1, Math.floor(pen * QUOTE_LINE.length))];
  return (
    <g>
      <rect width={1920} height={1080} fill={K.scanBg} />
      <World cam={cam} cx={c.x} cy={c.y}>
        <PageFace id="hpage" anchor={{s: 0, x: 0, y: 0}} view={view} />
        {gaps > 0 &&
          HOLE_PATHS.filter((h) => h.ry >= 16).map((h, i) => (
            <path key={i} d={h.d} fill="none" stroke={K.coral} strokeWidth={3.5} vectorEffect="non-scaling-stroke" opacity={gaps * (0.6 + 0.4 * Math.sin(t * 6 + i))} />
          ))}
        {hi > 0 && <rect x={qb.x0} y={qb.y0} width={(qb.x1 - qb.x0) * hi} height={qb.y1 - qb.y0} rx={4} fill={K.saffron} opacity={0.32} />}
        {pen > 0 && pen < 1 && penG && (
          <g transform={`translate(${penG.s + ADV} ${penG.v - FS * 0.2}) rotate(-38)`}>
            <rect x={-2} y={-90} width={6} height={88} rx={3} fill="#A0703C" stroke={K.ink} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
            <path d="M-2 -4 L4 -4 L1 4Z" fill={K.ink} />
          </g>
        )}
      </World>
      {/* scale: the whole flattened surface */}
      {scale > 0 && (
        <g opacity={scale}>
          <line x1={left.x} y1={yb} x2={right.x} y2={yb} stroke={K.white} strokeWidth={3} />
          <line x1={left.x} y1={yb - 12} x2={left.x} y2={yb + 12} stroke={K.white} strokeWidth={3} />
          <line x1={right.x} y1={yb - 12} x2={right.x} y2={yb + 12} stroke={K.white} strokeWidth={3} />
          <rect x={960 - 150} y={yb + 18} width={300} height={50} rx={25} fill="rgba(255,255,255,0.92)" />
          <text x={960} y={yb + 53} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={800} fontSize={30} fill={K.ink}>
            ≈ 1.4 m · 4½ ft
          </text>
        </g>
      )}
      {Array.from({length: NCOL}, (_, k) => {
        const a = ticks(k);
        if (a <= 0) return null;
        const p = toScreen(cam, colCenter(k + 1), -PH / 2 - 26, c.x, c.y);
        return <rect key={k} x={p.x - 9} y={p.y - 22 * easeOut(a)} width={18} height={22 * easeOut(a)} rx={6} fill={k === 18 ? K.saffron : '#E8E2D4'} opacity={a} />;
      })}
      {/* the translated fragment */}
      {card > 0 && (
        <g opacity={card} transform={`translate(0 ${(1 - card) * -20})`}>
          <rect x={360} y={44} width={1200} height={128} rx={22} fill="rgba(255,255,255,0.96)" stroke={K.saffron} strokeWidth={4} />
          <text x={960} y={112} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={600} fontSize={46} fill={K.ink}>
            “possessing the same practical wisdom as they do”
          </text>
          <text x={960} y={152} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={22} fill={K.inkSoft}>
            PHerc. 1667, column 19 (translation)
          </text>
        </g>
      )}
      <Chip x={1890} y={44} text="Reconstruction" size={22} anchor="end" opacity={1 - card} />
    </g>
  );
};
