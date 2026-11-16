// V2 A (0:00-7.6): extreme close-up of the black roll; a spatula tries to lift its outer layer, cracks run, the
// layer crumbles. A scan line sweeps the frame and turns the same roll into its digital twin; the camera pulls back,
// then travels into the end face; the outer layers dissolve, the traced stretch holding column 19 lifts out and opens
// with its real Greek. Then everything reverses and the scan line sweeps back to the physical lump on its cradle.
import React from 'react';
import {Chip, K} from '../art/kit';
import {Cradle, ROLL_GEO, Roll1667} from '../art/Roll';
import {PageFace, World} from '../art/Sheet';
import {FPS} from '../lib/core';
import {clamp, easeIn, easeInOut, easeOut, hash, lerp, noise1} from '../lib/math';
import {R_OUT, SQUASH} from '../lib/sheet';
import {TM} from '../lib/time';
import {ribbonD, SEG, C19} from '../scenes/Open';
import {DigitalRoll, Dust, FaceSpiral, segK} from './kit3';

export const ROLL_A_END = {x: 960, y: 500, s: 1.75}; // the pose B starts from
const MACRO = {x: 600, y: 700, s: 5.2};
const PULL = {x: 960, y: 500, s: 1.75};
const SPZ = 8.8;
const SPC = {x: 960, y: 470};
const PAGE_C = {x: 960, y: 500};

// times
const T_BREAK = TM.crumble + 0.02; // the layer breaks on "crumble"
const T_SCAN0 = TM.computer - 2.75; // "So researchers…"
const T_SCAN1 = T_SCAN0 + 0.62;
const T_IN0 = T_SCAN1 + 0.05;
const T_IN1 = T_IN0 + 0.6;
const T_RIB0 = T_IN1 - 0.05;
const T_RIB1 = T_RIB0 + 0.55;
const T_OPEN0 = T_RIB1 - 0.15;
const T_OPEN1 = T_OPEN0 + 0.38;
const T_BACK0 = TM.book - 0.15;
const T_BACKS0 = T_BACK0 + 0.32;
const T_BACKS1 = T_BACKS0 + 0.34;

const {R, ex, erx} = ROLL_GEO;

/** the outer layer the spatula lifts (roll-local) */
const FLAP = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const x = 18 + (i / 12) * 128;
    pts.push([x, -R + 1.5 + 2.2 * noise1(i * 0.9, 41)]);
  }
  const inner = pts.map(([x, y]) => [x, y + 7 + 1.5 * noise1(x * 0.1, 42)] as [number, number]).reverse();
  return [...pts, ...inner];
})();
const HINGE = {x: 18, y: -R + 4};
const rotP = (p: [number, number], a: number): [number, number] => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = p[0] - HINGE.x;
  const dy = p[1] - HINGE.y;
  return [HINGE.x + dx * c - dy * s, HINGE.y + dx * s + dy * c];
};
const CRACKS = [0, 1, 2, 3].map((k) => {
  let x = HINGE.x + 2;
  let y = HINGE.y + 4 + k * 3;
  let d = `M${x} ${y}`;
  for (let i = 0; i < 9; i++) {
    x -= 9 + hash(i + k * 20, 3) * 9;
    y += (hash(i + k * 20, 4) - 0.35) * 9 + k * 1.6;
    d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
});

export type AttemptTimes = {lift0: number; lift1: number; crack0: number; crack1: number; brk: number};
export const ATTEMPT_A: AttemptTimes = {lift0: 0.25, lift1: T_BREAK - 0.1, crack0: 0.75, crack1: T_BREAK - 0.05, brk: T_BREAK};
export const flapTip = (t: number, at: AttemptTimes, pose: {x: number; y: number; s: number}) => {
  const lift = segK(t, at.lift0, at.lift1) * 0.3 * (t < at.brk ? 1 : 0);
  const q = rotP([140, -R + 4], -lift);
  return {x: pose.x + q[0] * pose.s, y: pose.y + q[1] * pose.s};
};
export const PhysicalRoll: React.FC<{t: number; f: number; pose: {x: number; y: number; s: number}; macro: number; at?: AttemptTimes; tint?: string}> = ({t, f, pose, macro, at = ATTEMPT_A}) => {
  const lift = segK(t, at.lift0, at.lift1) * 0.3 * (t < at.brk ? 1 : 0);
  const crack = segK(t, at.crack0, at.crack1, easeOut);
  const broken = t >= at.brk;
  const kb = clamp((t - at.brk) / 1.0);
  return (
    <g>
      <Roll1667 x={pose.x} y={pose.y} s={pose.s} f={f} />
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.s})`} opacity={macro}>
        {/* the layer underneath, exposed as the flap lifts or after it breaks away */}
        <path d={`M${HINGE.x} ${-R + 3} L${ex - 4} ${-R + 3} L${ex - 4} ${-R + 9} L${HINGE.x} ${-R + 10}Z`} fill="#4E4038" opacity={broken ? 1 : clamp(lift * 8)} />
        {CRACKS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#120E0C" strokeWidth={1.6 / Math.max(1, pose.s / 3)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(crack * 1.3 - i * 0.12)} strokeLinecap="round" />
        ))}
        {!broken && (
          <path
            d={FLAP.map((p, i) => {
              const q = rotP(p, -lift);
              return `${i ? 'L' : 'M'}${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
            }).join('') + 'Z'}
            fill="#2E2724"
            stroke={K.ink}
            strokeWidth={1.2}
          />
        )}
        {broken &&
          [0, 1, 2, 3, 4].map((k) => {
            // five pieces of the broken layer
            const a = 13 + k * 2;
            const b = 12 + k * 2 + 3;
            const pts = FLAP.slice(k * 2 + 1, k * 2 + 4).concat(FLAP.slice(FLAP.length - (k * 2 + 4), FLAP.length - (k * 2 + 1)));
            void a;
            void b;
            const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
            const vx = (hash(k, 51) - 0.3) * 30;
            const tx = vx * kb;
            const ty = -10 * kb + 120 * kb * kb;
            const rot = (hash(k, 52) - 0.5) * 300 * kb;
            return (
              <path
                key={k}
                d={pts.map((p, i) => `${i ? 'L' : 'M'}${(p[0] - cx).toFixed(2)} ${(p[1] - cy).toFixed(2)}`).join('') + 'Z'}
                transform={`translate(${cx + tx} ${cy + ty}) rotate(${rot})`}
                fill="#2E2724"
                stroke={K.ink}
                strokeWidth={1}
                opacity={clamp(1.6 - kb)}
              />
            );
          })}
      </g>
    </g>
  );
};

export const Spatula: React.FC<{tip: {x: number; y: number}; back: number; o: number}> = ({tip, back, o}) => {
  const ang = (-34 * Math.PI) / 180;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const tx = tip.x + dx * back;
  const ty = tip.y + dy * back;
  const p = (d: number, w: number) => ({x: tx + dx * d - dy * w, y: ty + dy * d + dx * w});
  const b0 = p(0, -9);
  const b1 = p(560, -16);
  const b2 = p(560, 16);
  const b3 = p(0, 9);
  const h0 = p(540, -26);
  const h1 = p(900, -30);
  const h2 = p(900, 30);
  const h3 = p(540, 26);
  const P = (q: {x: number; y: number}[]) => q.map((v, i) => `${i ? 'L' : 'M'}${v.x.toFixed(1)} ${v.y.toFixed(1)}`).join('') + 'Z';
  return (
    <g opacity={o}>
      <path d={P([b0, b1, b2, b3])} fill="#D7DCE0" stroke={K.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d={P([p(30, -3), p(540, -9), p(540, -4), p(30, 0)])} fill="#FFFFFF" opacity={0.7} />
      <path d={P([h0, h1, h2, h3])} fill="#8B5A2B" stroke={K.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

export const A3: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  // the roll's pose: macro, pull back, and (on the way back) the same pull-back pose
  const pk = segK(t, T_SCAN0 - 0.05, T_SCAN1 + 0.1);
  const drift = clamp(t / T_SCAN0);
  const macroPose = {x: MACRO.x - 40 * drift, y: MACRO.y, s: MACRO.s * (1 + 0.04 * drift)};
  const pose = {x: lerp(macroPose.x, PULL.x, pk), y: lerp(macroPose.y, PULL.y, pk), s: Math.exp(lerp(Math.log(macroPose.s), Math.log(PULL.s), pk))};
  // scan line: forward (physical -> digital) then back (digital -> physical)
  const fwd = segK(t, T_SCAN0, T_SCAN1, easeInOut);
  const bwd = segK(t, T_BACKS0, T_BACKS1, easeInOut);
  const scanX = t < T_BACKS0 ? lerp(-120, 2040, fwd) : lerp(2040, -120, bwd);
  const scanOn = (t > T_SCAN0 && t < T_SCAN1 + 0.05) || (t > T_BACKS0 && t < T_BACKS1 + 0.05);
  // into the end face and back out
  const inK = segK(t, T_IN0, T_IN1) * (1 - segK(t, T_BACK0 + 0.2, T_BACKS0 + 0.02));
  const faceX = pose.x + ex * pose.s;
  const zx0 = (erx * pose.s * 0.92) / R_OUT;
  const zy0 = (R * pose.s * 0.92) / (R_OUT * SQUASH);
  const zx = Math.exp(lerp(Math.log(zx0), Math.log(SPZ), inK));
  const zy = Math.exp(lerp(Math.log(zy0), Math.log(SPZ), inK));
  const scx = lerp(faceX, SPC.x, inK);
  const scy = lerp(pose.y, SPC.y, inK);
  // the traced stretch lifts out and opens; on the way back it closes and returns
  const u = segK(t, T_RIB0, T_RIB1) * (1 - segK(t, T_BACK0 + 0.08, T_BACK0 + 0.38));
  const open = segK(t, T_OPEN0, T_OPEN1) * (1 - segK(t, T_BACK0 - 0.05, T_BACK0 + 0.2));
  const pageZ = 2.35 * (1 + 0.07 * segK(t, T_OPEN1, T_BACK0, (x) => x));
  const camS = {x: 0, y: 0, z: SPZ};
  const camP = {x: C19, y: 0, z: pageZ};
  const p = (s: number) => {
    const k = (s - SEG[0]) / (SEG[1] - SEG[0]);
    return easeInOut(clamp(u * 1.7 - k * 0.7));
  };
  const showRibbon = u > 0.001 && open < 0.999;
  const dark = 1;
  const bodyO = Math.max(1 - segK(t, T_IN0 + 0.2, T_IN1 - 0.1), segK(t, T_BACK0 + 0.3, T_BACKS0));
  // tool
  const tipLocal = flapTip(t, ATTEMPT_A, pose);
  const toolIn = 220 * (1 - easeOut(clamp(t / 0.35)));
  const toolBack = easeIn(clamp((t - T_BREAK - 0.05) / 0.45)) * 900;
  const macro = 1 - pk;
  const physical = (
    <g>
      <rect width={1920} height={1080} fill={K.paper} />
      <ellipse cx={pose.x} cy={pose.y - 60 * pose.s / 1.75} rx={560} ry={380} fill="#FBF6EC" opacity={0.7 * (1 - macro)} />
      <rect x={-20} y={pose.y + 112 * pose.s} width={1960} height={1080} fill={K.paperDeep} />
      <rect x={-20} y={pose.y + 112 * pose.s} width={1960} height={6} fill="#D8CCB8" />
      {t > T_BACK0 && <Cradle x={pose.x} y={pose.y + 64 * pose.s} s={pose.s} w={330} />}
      <PhysicalRoll t={t} f={f} pose={pose} macro={macro} />
      {t < T_BREAK + 1.2 && <Dust x={tipLocal.x - 90} y={tipLocal.y + 10} k={(t - T_BREAK) / 1.0} n={26} seed={3} spread={1.3} />}
      {t < T_BREAK + 1 && <Spatula tip={tipLocal} back={toolIn + toolBack} o={1} />}
      {t > T_BACK0 && <Chip x={pose.x} y={pose.y + 150 * pose.s + 10} text="PHerc. 1667" size={30} anchor="middle" dot={K.saffron} opacity={segK(t, T_BACKS1 - 0.1, T_BACKS1 + 0.3)} />}
    </g>
  );
  const digital = (
    <g>
      <rect width={1920} height={1080} fill={K.scanBg} opacity={dark} />
      {bodyO > 0 && <DigitalRoll x={pose.x} y={pose.y} s={pose.s} o={bodyO} />}
      {inK > 0 && <FaceSpiral cx={scx} cy={scy} zx={zx} zy={zy} width={lerp(1, 1.3, inK)} color={K.scanLine} o={(1 - 0.55 * open) * clamp(inK * 4)} fill="#0F2A44" fillO={clamp((1 - inK) / 0.25)} />}
      {open > 0 && (
        <World cam={camP} cx={PAGE_C.x} cy={PAGE_C.y}>
          <PageFace id={`a2page${f}`} anchor={{s: 0, x: 0, y: 0}} s0={SEG[0]} s1={SEG[1]} open={open} ink={1} />
        </World>
      )}
      {showRibbon && inK > 0.98 && (
        <path d={ribbonD(SEG[0], SEG[1], p, camS, SPC, camP, PAGE_C)} fill="none" stroke={K.saffron} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" opacity={1 - easeOut(clamp(open * 1.4))} />
      )}
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`a2phys${f}`}>
          <rect x={scanX} y={0} width={2400} height={1080} />
        </clipPath>
        <clipPath id={`a2dig${f}`}>
          <rect x={-400} y={0} width={scanX + 400} height={1080} />
        </clipPath>
      </defs>
      <g clipPath={`url(#a2phys${f})`}>{physical}</g>
      <g clipPath={`url(#a2dig${f})`}>{digital}</g>
      {scanOn && (
        <g>
          <rect x={scanX - 60} y={0} width={60} height={1080} fill="#7FE3FF" opacity={0.18} />
          <rect x={scanX - 3} y={0} width={6} height={1080} fill="#BFF1FF" />
        </g>
      )}
    </g>
  );
};
