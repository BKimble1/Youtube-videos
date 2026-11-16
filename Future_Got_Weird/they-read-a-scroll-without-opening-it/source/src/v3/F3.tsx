// D + E + F: one continuous world, no cuts. The cross-section from the scan; one layer is followed; a hypothetical
// wrong turn at a contact skips a whole turn (and shows what that would do to the text); reset; the correct trace
// is completed and checked at every contact; the traced sheet is flattened about that same bend; the page opens
// almost blank; the camera pushes in; the ink is found patch by patch.
import React from 'react';
import {Chip, K} from '../art/kit';
import {Cam, flatPos, PageFace, SheetLine, toScreen, World} from '../art/Sheet';
import {FPS, T} from '../lib/core';
import {mix} from '../lib/color';
import {clamp, easeInOut, easeOut, hash, lerp} from '../lib/math';
import {ADV, colCenter, CONTACTS, FS, LAYOUT, PL, S_BEND, S_BEND_IN, sAtTurnPhi, spiralAt, TURN_LEN} from '../lib/sheet';
import {TM} from '../lib/time';
import {SPIRAL_C, SPIRAL_Z} from '../scenes/SeqC';

const CX = SPIRAL_C.x;
const CY = SPIRAL_C.y;
const B = spiralAt(S_BEND);
const BIN = spiralAt(S_BEND_IN);
const ANCHOR = {s: S_BEND, x: B.x, y: B.y};
const S_T0 = S_BEND - 0.85 * TURN_LEN;
const CONTACT_S = CONTACTS.map((c) => sAtTurnPhi(c.turn, c.phi));
const ZF = 1720 / PL;
const COL = 17;
// the glyph used for the close-ups (a clear, certain letter in the middle of column 17)
const G = (() => {
  const gs = LAYOUT.glyphs.filter((g) => g.col === COL && !g.trace && !g.unc && g.ch.trim() && g.line >= 4);
  return gs[Math.floor(gs.length * 0.35)];
})();
const COL_GLYPHS = LAYOUT.glyphs.filter((g) => g.col === COL);
const CB = {
  x0: Math.min(...COL_GLYPHS.map((g) => g.s)) - 6,
  x1: Math.max(...COL_GLYPHS.map((g) => g.s)) + ADV + 6,
  y0: Math.min(...COL_GLYPHS.map((g) => g.v)) - FS - 4,
  y1: Math.max(...COL_GLYPHS.map((g) => g.v)) + 6,
};
const PS = 9; // patch size in page units: smaller than a letter (≈ 11 x 14)
const flat = (s: number) => flatPos(ANCHOR, s);
// the patch sweep: three lines of column 17 around the close-up letter, two patch rows per line
const SWEEP = (() => {
  const lines = [G.line - 1, G.line, G.line + 1];
  const out: {x: number; y: number; ink: number}[] = [];
  lines.forEach((ln) => {
    const gs = LAYOUT.glyphs.filter((g) => g.col === COL && g.line === ln);
    if (!gs.length) return;
    const v = gs[0].v;
    for (let r = 0; r < 2; r++) {
      const y = v - FS * 0.85 + r * PS;
      for (let x = CB.x0; x < CB.x1 - PS / 2; x += PS) {
        const cx = x + PS / 2;
        const g = gs.find((q) => !q.trace && q.ch.trim() && Math.abs(cx - (q.s + ADV / 2)) < ADV * 0.55);
        const ink = g ? (g.unc ? 0.35 : 0.55) + 0.45 * hash(Math.round(x * 3 + y), 11) : 0.12 * hash(Math.round(x * 5 + y), 12);
        out.push({x, y, ink});
      }
    }
  });
  return out;
})();

const segE = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k))});

/** camera keyframes: [time, cam] with eased (log-zoom) interpolation */
const camAt = (t: number, keys: [number, Cam][]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, A] = keys[i];
    const [b, Bc] = keys[i + 1];
    if (t <= b) return lerpCam(A, Bc, easeInOut(clamp((t - a) / (b - a))));
  }
  return keys[keys.length - 1][1];
};

const tileRevealTime = (gx: number, gy: number) => {
  const ord = (gx - CB.x0) / (CB.x1 - CB.x0);
  const row = (gy - CB.y0) / (CB.y1 - CB.y0);
  return TM.put + 0.25 + (ord * 0.6 + row * 0.25 + hash(Math.round(gx * 7 + gy * 13), 5) * 0.15) * (TM.stroke - TM.put - 0.3);
};

export const F3: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const CAM0: Cam = {x: 0, y: 0, z: SPIRAL_Z};
  const T_HEAT = T('the heat had');
  const T_CUT_OUT = TM.identical + 0.35;
  const fitX = flat(PL / 2).x;
  const g17 = flat(colCenter(COL));
  const gG = flat(G.s + ADV / 2);
  const camFlatEnd: Cam = {x: fitX, y: B.y, z: ZF};
  const camBlank: Cam = {x: g17.x, y: B.y + 8, z: 1.45};
  const camInk: Cam = {x: g17.x + 6, y: B.y + (CB.y0 + CB.y1) / 2 + 6, z: 3.0};
  const camLetter: Cam = {x: gG.x, y: B.y + G.v - FS * 0.4, z: 6.0};
  const camSweep: Cam = {x: gG.x - 40, y: B.y + G.v - FS * 0.4, z: 4.0};
  const tReset = TM.eachOther + 0.3;
  const cam = camAt(t, [
    [TM.see - 0.35, CAM0],
    [TM.together - 0.1, {x: B.x, y: B.y, z: 44}],
    [TM.jump + 0.9, {x: B.x, y: B.y, z: 47}],
    [TM.page - 0.2, {x: 28, y: 0, z: 10.5}],
    [tReset + 0.2, {x: 28, y: 0, z: 11.4}],
    [TM.traced + 1.4, CAM0],
    [TM.gave + 0.05, {...CAM0, z: CAM0.z * 1.05}],
    [TM.flatten + 1.1, camFlatEnd],
    [TM.blank - 0.5, {...camFlatEnd, z: camFlatEnd.z * 1.06}],
    [TM.blank + 1.1, camBlank],
    [TM.inkWas - 0.1, {...camBlank, z: camBlank.z * 1.07}],
    [T_CUT_OUT + 0.2, {...camInk, z: camInk.z * 0.85}],
    [TM.trained + 0.9, camSweep],
    [TM.tiny + 0.4, {...camSweep, x: camSweep.x + 30}],
    [TM.each - 0.1, {...camSweep, z: camSweep.z * 1.12}],
    [TM.each + 0.9, camLetter],
    [TM.put - 0.2, {...camLetter, z: camLetter.z * 1.1}],
    [TM.put + 1.0, camInk],
    [TM.checked, {...camInk, z: camInk.z * 1.06}],
  ]);
  const W = (s: number) => toScreen(cam, s, 0, CX, CY); // helper (unused for y)
  void W;
  const ws = (x: number, y: number) => toScreen(cam, x, y, CX, CY);
  const viewX: [number, number] = [cam.x - CX / cam.z - 50, cam.x + (1920 - CX) / cam.z + 50];

  // ---------------------------------------------------------------- D: following one layer, the wrong turn
  const sweep = clamp((t - TM.sheetOf) / (TM.overOver - TM.sheetOf + 0.3));
  const sweepOn = sweep > 0 && sweep < 1;
  const sH = PL * easeInOut(sweep);
  const traceK = easeInOut(clamp((t - TM.pick - 0.1) / (TM.around - TM.pick + 0.1)));
  const fwd = easeInOut(clamp((t - TM.traced - 0.2) / (TM.messy - TM.traced - 0.2)));
  const sTraceEnd = lerp(lerp(S_T0, S_BEND, traceK), PL, fwd);
  const sTraceStart = lerp(S_T0, 0, fwd);
  const showTrace = t > TM.pick;
  const ring = clamp((t - (TM.see + 0.3)) / 0.5) * (1 - clamp((t - TM.jump - 0.2) / 0.4));
  const jumpK = clamp((t - TM.jump - 0.15) / 0.35);
  const wrongW = 0.8 * TURN_LEN * easeOut(clamp((t - TM.jump - 0.5) / (TM.page - TM.jump - 0.5)));
  const resetK = easeInOut(clamp((t - tReset) / 0.55));
  const wrongOn = (1 - resetK) * (t > TM.jump ? 1 : 0);
  const skipped = clamp((t - TM.skipped + 0.1) / 0.4) * (1 - resetK);
  const frag = easeOut(clamp((t - TM.keep - 0.2) / 0.6)) * (1 - clamp((t - tReset) / 0.4));

  // ---------------------------------------------------------------- E: flatten about the bend, open the page
  const u = clamp((t - (TM.gave + 0.15)) / (TM.flatten + 1.0 - TM.gave - 0.15));
  const maxD = Math.max(S_BEND, PL - S_BEND);
  const p = (s: number) => easeInOut(clamp(u * 2.2 - (Math.abs(s - S_BEND) / maxD) * 1.2));
  const ghost = 1 - easeInOut(clamp((t - TM.gave) / 1.8));
  const open = easeInOut(clamp((t - (TM.nowPage - 0.15)) / 0.9));
  const flattening = u > 0;
  const traceFade = 1 - easeInOut(clamp((t - TM.nowPage) / 0.8));

  // ---------------------------------------------------------------- F: ink
  const mag = clamp((t - TM.inkWas + 0.15) / 0.5) * (1 - clamp((t - T_CUT_OUT) / 0.45));
  const scanMode = easeInOut(clamp((t - TM.inScan) / 0.6));
  const SW0 = TM.trained + 0.15;
  const SW1 = TM.each - 0.25;
  const headF = clamp((t - SW0) / (SW1 - SW0)) * SWEEP.length;
  const headI = Math.floor(headF);
  const sweepOn2 = clamp((t - SW0 + 0.2) / 0.3) * (1 - clamp((t - TM.each + 0.1) / 0.4));
  const patchOn = clamp((t - TM.each + 0.3) / 0.3) * (1 - clamp((t - TM.put - 0.1) / 0.4));
  // the patch steps over the letter: it takes several patches to cover one letter
  const stepK = clamp((t - TM.each - 0.35) / (TM.letter - TM.each - 0.1));
  const STEPS = [[-0.3, -0.25], [0.35, -0.25], [0.35, 0.55], [-0.3, 0.55]];
  const si = Math.min(3, Math.floor(stepK * 4));
  const patchDX = STEPS[si][0] * PS * (stepK > 0 ? 1 : 0);
  const patchDY = STEPS[si][1] * PS * (stepK > 0 ? 1 : 0);
  const patchAt = G;
  const outline = clamp((t - TM.each - 0.5) / 0.4) * (1 - clamp((t - TM.imagine - 0.2) / 0.4));
  const road = clamp((t - TM.imagine + 0.05) / 0.55) * (1 - clamp((t - TM.time - 0.15) / 0.5));
  const smudge = clamp((t - TM.onePatch) / 0.35) * (1 - clamp((t - TM.smudge - 0.25) / 0.35));
  const revealing = t > TM.put;
  const glyphAlpha = (g: (typeof LAYOUT.glyphs)[number]) => {
    if (g.col !== COL || !revealing) return 0;
    return clamp((t - tileRevealTime(g.s, g.v)) / 0.45);
  };
  const inkOn = t > TM.put;

  const pScreen = ws(flat(patchAt.s + ADV / 2 - PS / 2 + patchDX).x, B.y + patchAt.v - FS * 0.75 + patchDY);
  return (
    <g>
      <rect width={1920} height={1080} fill={K.scanBg} />
      <World cam={cam} cx={CX} cy={CY}>
        {/* the scan: stays put until the flattening, then fades */}
        {ghost > 0 && <SheetLine color={K.scanLine} width={cam.z > 14 ? 2.2 : 1.4} opacity={ghost * (flattening ? 0.55 : 1)} />}
        {sweepOn && (
          <>
            <SheetLine s0={Math.max(0, sH - 900)} s1={Math.max(0, sH - 300)} color={K.saffron} width={2} opacity={0.35} />
            <SheetLine s0={Math.max(0, sH - 300)} s1={sH} color={K.saffron} width={2.6} opacity={0.95} />
          </>
        )}
        {/* the wrong turn (hypothetical) and the turn it skips */}
        {skipped > 0 && <SheetLine s0={S_BEND} s1={S_BEND_IN} color={K.coral} width={2.6} glow={K.coral} opacity={skipped * (0.55 + 0.25 * Math.sin(t * 7))} />}
        {wrongOn > 0 && t > TM.jump && (
          <g opacity={wrongOn}>
            <SheetLine s0={S_BEND - 14 * (1 - resetK)} s1={S_BEND - 14 * (1 - resetK) + 14 * clamp((t - TM.jump) / 0.25)} color={K.coral} width={5} />
            {jumpK > 0 && <line x1={B.x} y1={B.y} x2={lerp(B.x, BIN.x, jumpK)} y2={lerp(B.y, BIN.y, jumpK)} stroke={K.coral} strokeWidth={5} vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
            {wrongW > 0 && <SheetLine s0={S_BEND_IN} s1={S_BEND_IN + wrongW * (1 - resetK)} color={K.coral} width={4.5} dash="12 7" />}
            {(() => {
              const sHead = wrongW > 0 ? S_BEND_IN + wrongW * (1 - resetK) : S_BEND;
              const h = spiralAt(sHead);
              return <circle cx={h.x} cy={h.y} r={9 / cam.z} fill={K.coral} stroke={K.white} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />;
            })()}
          </g>
        )}
        {/* the two ways out of the contact: the same layer (faint saffron) and the neighbouring layer (white) */}
        {ring > 0 && <SheetLine s0={S_BEND_IN - 40} s1={S_BEND_IN + 40} color={K.white} width={3.2} opacity={ring} />}
        {ring > 0 && <SheetLine s0={S_BEND} s1={S_BEND + 45} color={K.saffron} width={3.2} dash="6 8" opacity={ring * 0.8} />}
        {/* the correct trace */}
        {showTrace && traceFade > 0 && (
          <SheetLine s0={sTraceStart} s1={sTraceEnd} color={K.saffron} width={flattening ? 2.6 : lerp(3.4, 1.7, fwd)} glow={flattening || fwd > 0.05 ? undefined : K.saffron} p={flattening ? p : undefined} anchor={ANCHOR} opacity={traceFade} stride={flattening ? 2 : 1} />
        )}
        {/* the page */}
        {open > 0 && (
          <PageFace
            id="sheetpage"
            anchor={ANCHOR}
            open={open}
            ink={inkOn ? 0 : 0}
            faint={0.06}
            glyphAlpha={inkOn ? glyphAlpha : undefined}
            view={viewX}
          />
        )}
        {/* ink tiles: the patch grid sweeping the column */}
        {revealing && open > 0.99 && (
          <g transform={`translate(${ANCHOR.x - ANCHOR.s} ${ANCHOR.y})`}>
            {Array.from({length: Math.ceil((CB.x1 - CB.x0) / PS)}, (_, ix) =>
              Array.from({length: Math.ceil((CB.y1 - CB.y0) / PS)}, (_, iy) => {
                const x = CB.x0 + ix * PS;
                const y = CB.y0 + iy * PS;
                const rt = tileRevealTime(x + PS / 2, y + PS / 2);
                const a = clamp((t - rt) / 0.15) * (1 - clamp((t - rt - 0.35) / 0.6));
                if (a <= 0) return null;
                return <rect key={`${ix}-${iy}`} x={x} y={y} width={PS} height={PS} fill={K.saffron} fillOpacity={0.18 * a} stroke={K.saffron} strokeOpacity={0.8 * a} strokeWidth={1} vectorEffect="non-scaling-stroke" />;
              }),
            )}
          </g>
        )}
        {/* the model at work: one tiny patch at a time, raster-scanning three lines; each patch keeps a faint score */}
        {sweepOn2 > 0 && (
          <g transform={`translate(${ANCHOR.x - ANCHOR.s} ${ANCHOR.y})`} opacity={sweepOn2}>
            {SWEEP.map((q, i) => {
              if (i > headI) return null;
              const age = (headF - i) / 30;
              const a = clamp(1 - age) * 0.6 + q.ink * 0.45;
              return <rect key={i} x={q.x} y={q.y} width={PS} height={PS} fill={K.saffron} fillOpacity={a * (0.15 + 0.5 * q.ink)} stroke={K.saffron} strokeOpacity={clamp(1 - age) * 0.7} strokeWidth={1} vectorEffect="non-scaling-stroke" />;
            })}
            {headI < SWEEP.length && (
              <rect x={SWEEP[headI].x} y={SWEEP[headI].y} width={PS} height={PS} fill="none" stroke={K.white} strokeWidth={4} vectorEffect="non-scaling-stroke" />
            )}
          </g>
        )}
        {/* one patch against one letter */}
        {patchOn > 0 && t >= TM.each - 0.3 && (
          <g transform={`translate(${ANCHOR.x - ANCHOR.s} ${ANCHOR.y})`} opacity={patchOn}>
            <rect x={G.s + ADV / 2 - PS / 2 + patchDX} y={G.v - FS * 0.75 + patchDY} width={PS} height={PS} fill={K.saffron} fillOpacity={0.25} stroke={K.saffron} strokeWidth={4.5} vectorEffect="non-scaling-stroke" />
          </g>
        )}
        {/* the letter's outline, for scale */}
        {outline > 0 && (
          <g transform={`translate(${ANCHOR.x - ANCHOR.s} ${ANCHOR.y})`} opacity={outline}>
            <text x={G.s + ADV / 2} y={G.v} textAnchor="middle" fontFamily='"Noto Serif", serif' fontWeight={500} fontSize={FS} fill="none" stroke={K.white} strokeWidth={1.6} strokeDasharray="3 3" vectorEffect="non-scaling-stroke">
              {G.ch}
            </text>
          </g>
        )}
      </World>

      {/* the contact ring */}
      {ring > 0 && (() => {
        const q = ws(B.x, B.y);
        return <circle cx={q.x} cy={q.y} r={46 + 10 * Math.sin(t * 6)} fill="none" stroke={K.saffron} strokeWidth={4} opacity={ring} />;
      })()}
      {/* side by side: what the wrong turn would splice together */}
      {frag > 0 && (
        <g transform={`translate(${(1 - frag) * 300 + 520} 270) scale(0.82)`} opacity={frag}>
          <rect x={560} y={46} width={800} height={250} rx={18} fill="#0A121A" stroke={K.coral} strokeWidth={3} />
          <clipPath id="fragA">
            <rect x={580} y={66} width={380} height={210} rx={8} />
          </clipPath>
          <clipPath id="fragB">
            <rect x={960} y={66} width={380} height={210} rx={8} />
          </clipPath>
          <g clipPath="url(#fragA)">
            <World cam={{x: S_BEND - 95, y: 40, z: 2.2}} cx={770} cy={171}>
              <PageFace id="fa" anchor={{s: 0, x: 0, y: 0}} s0={S_BEND - 200} s1={S_BEND} ink={1} outline={0} />
            </World>
          </g>
          <g clipPath="url(#fragB)">
            <World cam={{x: S_BEND_IN + 95, y: 40, z: 2.2}} cx={1150} cy={171}>
              <PageFace id="fb" anchor={{s: 0, x: 0, y: 0}} s0={S_BEND_IN} s1={S_BEND_IN + 200} ink={1} outline={0} />
            </World>
          </g>
          <path d="M960 60 L948 100 L972 140 L948 180 L972 220 L960 282" fill="none" stroke={K.coral} strokeWidth={5} strokeLinejoin="round" />
          <g transform="translate(960 316)">
            <circle r={26} fill={K.coral} stroke={K.ink} strokeWidth={3} />
            <path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke={K.white} strokeWidth={5} strokeLinecap="round" />
          </g>
        </g>
      )}

      {/* the cutaway: three layers of the roll seen edge-on, ink on the middle one. Heat chars the papyrus to match
          the ink; then the scan turns both the same grey. */}
      {mag > 0 && (() => {
        const q = ws(gG.x, B.y + G.v - FS * 0.35);
        const P = {x0: 210, y0: 120, w: 1500, h: 640};
        const k = easeOut(mag);
        const x0 = lerp(q.x, P.x0, k);
        const y0 = lerp(q.y, P.y0, k);
        const w = lerp(10, P.w, k);
        const h = lerp(10, P.h, k);
        const heat = clamp((t - T_HEAT + 0.1) / 1.1); // char front, 0..1 across
        const scanX = lerp(-0.05, 1.05, clamp((t - TM.inScan + 0.05) / 0.8));
        // a slow push into the ink on the middle layer while the narration explains
        const push = lerp(1, 1.45, segE(t, TM.carbonRich - 0.3, TM.inScan));
        const pan = (t - TM.inkWas) * 10;
        const LY = [150, 330, 510]; // layer centres
        const TH = 64;
        const INK = [0.16, 0.4, 0.63, 0.86].map((u, i) => ({x: u * P.w, wd: 150 + hash(i, 5) * 90}));
        const layer = (y: number, idx: number, scan: boolean, charF: (x: number) => number) => {
          const raw = '#A9824F';
          const ch = '#2C2522';
          const sc = '#8E8A84';
          const segs = 64;
          return (
            <g key={idx}>
              {Array.from({length: segs}, (_, j) => {
                const xa = (j / segs) * P.w - 30;
                const c = scan ? sc : mix(raw, ch, charF(xa / P.w));
                return <rect key={j} x={xa} y={y - TH / 2 + Math.sin(j * 0.7 + idx) * 4} width={P.w / segs + 2} height={TH} fill={c} />;
              })}
              {/* papyrus is two plies: fibres run along the top ply, across the bottom ply */}
              {Array.from({length: 5}, (_, i) => (
                <line key={'h' + i} x1={-30} x2={P.w + 30} y1={y - TH / 2 + 6 + i * 6} y2={y - TH / 2 + 6 + i * 6 + (hash(i + idx * 9, 2) - 0.5) * 5} stroke={scan ? '#9C9892' : '#000'} strokeOpacity={scan ? 0.5 : 0.22} strokeWidth={2} />
              ))}
              {Array.from({length: 90}, (_, i) => {
                const x = ((i / 90) * (P.w + 60) + pan * 0.3) % (P.w + 60) - 30;
                return <line key={'v' + i} x1={x} x2={x + 2} y1={y + 4} y2={y + TH / 2 - 4} stroke={scan ? '#9C9892' : '#000'} strokeOpacity={scan ? 0.45 : 0.22} strokeWidth={2} />;
              })}
            </g>
          );
        };
        const inkBlobs = (scan: boolean, charF: (x: number) => number) =>
          INK.map((d, i) => {
            const y = LY[1] - TH / 2 + 4;
            const c = scan ? '#8B8781' : '#0B0908';
            return (
              <g key={i}>
                <path d={`M${d.x - d.wd / 2} ${y} Q${d.x - d.wd / 3} ${y - 40} ${d.x} ${y - 44} Q${d.x + d.wd / 3} ${y - 40} ${d.x + d.wd / 2} ${y}Z`} fill={c} />
                {!scan &&
                  Array.from({length: 9}, (_, j) => (
                    <circle key={j} cx={d.x - d.wd / 3 + (j / 8) * (d.wd * 0.66)} cy={y - 12 - hash(j + i * 11, 4) * 20} r={3.4} fill="#3B3633" opacity={0.6 + 0.4 * (1 - charF(d.x / P.w))} />
                  ))}
                {!scan && <path d={`M${d.x - d.wd / 4} ${y - 32} Q${d.x} ${y - 40} ${d.x + d.wd / 5} ${y - 33}`} fill="none" stroke="#7A716A" strokeWidth={5} strokeLinecap="round" opacity={1 - 0.6 * charF(d.x / P.w)} />}
              </g>
            );
          });
        const charF = (u: number) => clamp((heat * 1.3 - u) / 0.3);
        const scene = (scan: boolean) => (
          <g>
            <rect x={-40} y={-40} width={P.w + 80} height={P.h + 80} fill={scan ? '#4D5256' : '#17130F'} />
            {LY.map((y, i) => layer(y, i, scan, charF))}
            {inkBlobs(scan, charF)}
          </g>
        );
        // labels: which is ink, which is papyrus
        const lab = clamp((t - TM.inkWas - 0.35) / 0.3) * (1 - clamp((t - TM.inScan + 0.2) / 0.3));
        const sw = clamp((t - (TM.inScan + 0.95)) / 0.35);
        return (
          <g opacity={clamp(mag * 3)}>
            <rect width={1920} height={1080} fill="#0A121A" opacity={0.55 * k} />
            <clipPath id={`cut${f}`}>
              <rect x={x0} y={y0} width={w} height={h} rx={10} />
            </clipPath>
            <g clipPath={`url(#cut${f})`}>
              <g transform={`translate(${x0} ${y0}) scale(${w / P.w} ${h / P.h})`}>
                <g transform={`translate(${INK[1].x} ${LY[1]}) scale(${push}) translate(${-INK[1].x} ${-LY[1]})`}>
                  {scene(false)}
                  {/* heat front */}
                  {heat > 0 && heat < 1 && (
                    <rect x={heat * 1.3 * P.w - 160} y={-40} width={200} height={P.h + 80} fill="#FF8A3D" opacity={0.22 * Math.sin(Math.PI * heat)} />
                  )}
                  <clipPath id={`cutS${f}`}>
                    <rect x={-40} y={-40} width={(P.w + 80) * scanX} height={P.h + 80} />
                  </clipPath>
                  <g clipPath={`url(#cutS${f})`}>{scene(true)}</g>
                  {scanX > 0 && scanX < 1 && <rect x={-40 + (P.w + 80) * scanX - 4} y={-40} width={8} height={P.h + 80} fill="#BFF1FF" />}
                </g>
              </g>
            </g>
            <rect x={x0} y={y0} width={w} height={h} rx={10} fill="none" stroke={K.white} strokeWidth={4} />
            {lab > 0 && k > 0.95 && (
              <g opacity={lab}>
                <Chip x={P.x0 + INK[1].x} y={P.y0 + LY[1] - 112} text="ink" size={30} anchor="middle" />
                <Chip x={P.x0 + 160} y={P.y0 + LY[2] + 70} text="papyrus" size={30} anchor="middle" />
              </g>
            )}
            {/* the same two spots sampled from the scan: indistinguishable */}
            {sw > 0 && (
              <g opacity={sw * clamp(mag * 3)}>
                {[0, 1].map((i) => {
                  const cx = 960 + (i ? 1 : -1) * 190;
                  const cy = 470;
                  const S = 220 * easeOut(sw);
                  return (
                    <g key={i}>
                      <rect x={cx - S / 2} y={cy - S / 2} width={S} height={S} rx={8} fill="#8C8882" stroke={K.white} strokeWidth={5} />
                      {Array.from({length: 40}, (_, j) => (
                        <rect key={j} x={cx - S / 2 + hash(j, 31) * (S - 14)} y={cy - S / 2 + hash(j, 32) * (S - 14)} width={14} height={14} fill={hash(j, 33) > 0.5 ? '#86827C' : '#928E88'} />
                      ))}
                      <Chip x={cx} y={cy + S / 2 + 36} text={i ? 'papyrus' : 'ink'} size={28} anchor="middle" />
                    </g>
                  );
                })}
                <text x={960} y={490} textAnchor="middle" fontFamily='"Noto Serif", serif' fontSize={84} fill={K.white} opacity={sw}>≈</text>
              </g>
            )}
          </g>
        );
      })()}

      {/* the road analogy: one pebble at a time */}
      {road > 0 && (() => {
        const R = {x: 960, y: 440, r: 420};
        const k = easeInOut(road);
        const cx = lerp(pScreen.x, R.x, k);
        const cy = lerp(pScreen.y, R.y, k);
        const rr = lerp(14, R.r, k);
        const wk = clamp((t - TM.imagine - 0.6) / (TM.time - TM.imagine - 0.6));
        const wps = [
          {x: -520, y: 120},
          {x: -120, y: -150},
          {x: 260, y: 30},
          {x: 560, y: -90},
        ];
        const wi = Math.min(2, Math.floor(wk * 3));
        const wf = easeInOut(clamp(wk * 3 - wi));
        const win = {x: lerp(wps[wi].x, wps[wi + 1].x, wf), y: lerp(wps[wi].y, wps[wi + 1].y, wf)};
        const pebbles = Array.from({length: 320}, (_, i) => ({x: (hash(i, 61) - 0.5) * 4 * R.r, y: (hash(i, 62) - 0.5) * 2 * R.r, r: 10 + hash(i, 63) * 16, c: ['#5D5A57', '#706C67', '#4C4946', '#86817A'][Math.floor(hash(i, 64) * 4)]}));
        return (
          <g>
            <clipPath id={`roadc${f}`}>
              <rect x={cx - rr * 2} y={cy - rr} width={rr * 4} height={rr * 2} rx={8} />
            </clipPath>
            <g clipPath={`url(#roadc${f})`}>
              <g transform={`translate(${cx} ${cy}) scale(${rr / R.r})`}>
                <rect x={-R.r * 2} y={-R.r} width={R.r * 4} height={R.r * 2} fill="#3E3C3A" />
                {pebbles.map((q, i) => (
                  <circle key={i} cx={q.x} cy={q.y} r={q.r} fill={q.c} />
                ))}
                <path d={`M${-R.r * 2} ${R.r * 0.45} L${R.r * 2} ${-R.r * 0.25} L${R.r * 2} ${-R.r * 0.05} L${-R.r * 2} ${R.r * 0.65}Z`} fill="#F4F1EA" opacity={0.92} />
                {/* only one pebble is visible at a time */}
                <path d={`M${-R.r * 2} ${-R.r} H${R.r * 2} V${R.r} H${-R.r * 2}Z M${win.x - 38} ${win.y - 38} v76 h76 v-76Z`} fill="#0A121A" opacity={0.86 * clamp(wk * 5)} fillRule="evenodd" />
                <rect x={win.x - 38} y={win.y - 38} width={76} height={76} fill="none" stroke={K.saffron} strokeWidth={6} opacity={clamp(wk * 5)} />
              </g>
            </g>
            <rect x={cx - rr * 2} y={cy - rr} width={rr * 4} height={rr * 2} rx={8} fill="none" stroke={K.white} strokeWidth={5} />
          </g>
        );
      })()}

      {/* one patch alone: a smudge */}
      {smudge > 0 && (() => {
        const S = {x: pScreen.x + 230, y: pScreen.y - 190};
        return (
          <g opacity={smudge}>
            <line x1={pScreen.x + 30} y1={pScreen.y} x2={S.x - 80} y2={S.y + 70} stroke={K.saffron} strokeWidth={3} strokeDasharray="4 8" />
            <rect x={S.x - 120} y={S.y - 120} width={240} height={240} rx={10} fill="#9A958C" stroke={K.saffron} strokeWidth={6} />
            <ellipse cx={S.x + 10} cy={S.y - 6} rx={72} ry={46} fill="#6E6A64" opacity={0.7} transform={`rotate(-20 ${S.x} ${S.y})`} />
            <ellipse cx={S.x - 26} cy={S.y + 26} rx={42} ry={24} fill="#7C7871" opacity={0.6} />
          </g>
        );
      })()}

      <Chip x={1890} y={44} text="Reconstruction" size={22} anchor="end" bg="rgba(255,255,255,0.88)" />
    </g>
  );
};
