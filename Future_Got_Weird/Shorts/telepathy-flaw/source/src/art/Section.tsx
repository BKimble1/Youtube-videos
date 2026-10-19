// The cranial section: the sender's head turns see-through. Drawn in HEAD space (head radius 100, face toward -x,
// before the mirror) as two layers of <Head>:
//   underlay  the skull shell and the brain behind the face (the face features stay drawn on top, x-ray style), the
//             cortical patch (the motor-cortex strip), nine fine electrode threads and the signals running on them;
//   overlay   the fictional chip, seated in a shallow socket in the top of the skull.
// The transparency opens like an iris round the chip (a bright cut edge marks the sweep). Deep layers shift against the
// surface with the head's turn, so the head reads as a volume. Pure functions of the props: no state.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {add, clamp, fmt, lerp, mul, P, rot, V} from '../lib/math';

export const BONE = '#EFE2C6';
export const BRAIN = '#EBA5AC';
export const GYRI = '#C4687A';
export const SIG = '#46CFFF';
export const SIG_DEEP = '#1A8FD0';
export const CHIP = '#2563EB';
export const CHIP_DEEP = '#173FA8';
export const ALERT = '#EF3340';
export const ALERT_DEEP = '#B5122A';

/** chip centre and radius in head space (in the skull at the top of the head, between the two front spikes) */
export const CHIP_C: V = {x: 2, y: -96};
export const CHIP_R = 11.5;

const SKULL = {cx: 2, cy: -46, rx: 95, ry: 62};
const BRAINE = {cx: 4, cy: -44, rx: 82, ry: 49};

/** radius of the reveal iris round the chip for sweep progress p (0 = just the socket, 1 = the whole cranium) */
export const revealR = (p: number) => lerp(16, 150, Math.pow(clamp(p), 0.85));

// the cortical patch (the motor-cortex strip), running down from the chip
const PATCH_A: V = {x: 3, y: -83};
const PATCH_B: V = {x: 29, y: -34};
export const patchPt = (s: number, o: number): V => {
  const dx = PATCH_B.x - PATCH_A.x;
  const dy = PATCH_B.y - PATCH_A.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  return {x: PATCH_A.x + dx * s + nx * o, y: PATCH_A.y + dy * s + ny * o};
};
export const N_THREADS = 9;
const S_PARAM = [0.08, 0.2, 0.32, 0.44, 0.56, 0.66, 0.77, 0.87, 0.96];
const O_PARAM = [6, -6, 5, -5, 6, -6, 5, -5, 3];
export const threadGeo = (k: number) => {
  const S: V = {x: CHIP_C.x + (k - 4) * 1.9, y: CHIP_C.y + CHIP_R - 1.5};
  const T = patchPt(S_PARAM[k], O_PARAM[k]);
  const C: V = {x: (S.x + T.x) / 2 + (k - 4) * 2.4, y: (S.y + T.y) / 2 - 5 + Math.abs(k - 4) * 0.7};
  return {S, C, T};
};
export const threadAt = (k: number, u: number): V => {
  const {S, C, T} = threadGeo(k);
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return {x: a * S.x + b * C.x + c * T.x, y: a * S.y + b * C.y + c * T.y};
};
const threadD = (k: number) => {
  const {S, C, T} = threadGeo(k);
  return `M${P(S)} Q${P(C)} ${P(T)}`;
};

export type Pulse = {
  /** thread index 0..8 */
  k: number;
  /** 0 = at the chip, 1 = at the cortex */
  u: number;
  /** 0 blue, 1 red */
  red?: number;
  /** strength 0..1 */
  a?: number;
  /** trailing length in u */
  tail?: number;
};

export type SectionProps = {
  id: string;
  /** reveal progress */
  p: number;
  /** brightness of the cut edge (the sweep front) 0..1 */
  edge: number;
  /** head's 3/4 turn (the cranium follows it) */
  turn: number;
  pulses: Pulse[];
  /** cortical patch glow 0..1 and its red tint 0..1 */
  glow: number;
  glowRed?: number;
  /** chip LED 0..1, chip alert tint 0..1 */
  led: number;
  chipRed?: number;
  /** leader dot on the motor cortex 0..1 */
  mark?: number;
};

const ell = (e: {cx: number; cy: number; rx: number; ry: number}, k = 1) => `M${fmt(e.cx - e.rx * k)},${fmt(e.cy)} A${fmt(e.rx * k)} ${fmt(e.ry * k)} 0 1 0 ${fmt(e.cx + e.rx * k)},${fmt(e.cy)} A${fmt(e.rx * k)} ${fmt(e.ry * k)} 0 1 0 ${fmt(e.cx - e.rx * k)},${fmt(e.cy)} Z`;

/** deterministic wavy gyri, fixed in head space (the reveal uncovers them) */
const GYRUS = Array.from({length: 8}, (_, r) => {
  const y0 = -92 + r * 11;
  let d = `M${fmt(-82)},${fmt(y0)}`;
  const n = 16;
  for (let i = 1; i <= n; i++) {
    const x = -82 + (i * 170) / n;
    const w = Math.sin(i * 1.7 + r * 2.3) * 3.6 + Math.cos(i * 0.9 + r * 1.1) * 2.6;
    d += ` Q${fmt(x - 5.3)},${fmt(y0 + w * 1.5)} ${fmt(x)},${fmt(y0 + w * 0.5)}`;
  }
  return d;
});

export const cranialLayers = ({id, p, edge, turn, pulses, glow, glowRed = 0, led, chipRed = 0, mark = 0}: SectionProps) => {
  const rr = revealR(p);
  const sh = -9 * turn; // surface layers (skull, chip) follow the turn
  const par = 4.5 * turn - 1; // the brain sits deeper: it shifts against the surface
  const tint = mix(SIG, ALERT, clamp(glowRed));
  const chipTint = clamp(chipRed);
  const chipDeep = mix(CHIP_DEEP, ALERT_DEEP, chipTint);
  const chipBody = mix(CHIP, ALERT, chipTint);
  const led2 = mix('#9BE8FF', '#FFB3B8', chipTint);
  const patchD = `M${P(patchPt(0, -12))} Q${P(patchPt(0.5, -17))} ${P(patchPt(1, -11))} Q${P(patchPt(1.1, 0))} ${P(patchPt(1, 11))} Q${P(patchPt(0.5, 17))} ${P(patchPt(0, 12))} Q${P(patchPt(-0.1, 0))} ${P(patchPt(0, -12))} Z`;
  const pc = patchPt(0.5, 0);

  const underlay = (
    <g>
      <defs>
        <clipPath id={`${id}-iris`}>
          <circle cx={fmt(CHIP_C.x + sh)} cy={fmt(CHIP_C.y)} r={fmt(rr)} />
        </clipPath>
        <clipPath id={`${id}-skullclip`}>
          <g transform={`translate(${fmt(sh)} 0)`}>
            <path d={ell(SKULL)} />
          </g>
        </clipPath>
        <clipPath id={`${id}-brainclip`}>
          <path d={ell(BRAINE)} />
        </clipPath>
        <radialGradient id={`${id}-brain`} gradientUnits="userSpaceOnUse" cx={-10} cy={-70} r={105}>
          <stop offset="0" stopColor={lit(BRAIN, 0.3)} />
          <stop offset="0.5" stopColor={BRAIN} />
          <stop offset="1" stopColor={shade(BRAIN, 0.5)} />
        </radialGradient>
        <linearGradient id={`${id}-bone`} gradientUnits="userSpaceOnUse" x1={-60} y1={-104} x2={70} y2={20}>
          <stop offset="0" stopColor={lit(BONE, 0.5)} />
          <stop offset="0.5" stopColor={BONE} />
          <stop offset="1" stopColor={shade(BONE, 0.32)} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={tint} stopOpacity={0.9} />
          <stop offset="1" stopColor={tint} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-iris)`}>
        <g transform={`translate(${fmt(sh)} 0)`}>
          {/* skull shell, a little translucent so the skin still shows through at its edge */}
          <path d={ell(SKULL)} fill={`url(#${id}-bone)`} opacity={0.96} />
          <path d={ell(SKULL, 0.985)} fill="none" stroke={shade(BONE, 0.5)} strokeWidth={1.6} opacity={0.7} />
          {/* suture */}
          <path d={`M${fmt(-30)},${fmt(-104)} Q${fmt(-18)},${fmt(-98)} ${fmt(-26)},${fmt(-90)} Q${fmt(-34)},${fmt(-84)} ${fmt(-24)},${fmt(-78)}`} fill="none" stroke={shade(BONE, 0.4)} strokeWidth={1.3} opacity={0.5} />
        </g>
        <g transform={`translate(${fmt(sh + par)} 0)`}>
          <path d={ell(BRAINE)} fill={`url(#${id}-brain)`} />
          <g clipPath={`url(#${id}-brainclip)`}>
            <g>
              {GYRUS.map((d, i) => (
                <g key={i}>
                  <path d={d} fill="none" stroke={GYRI} strokeWidth={3.2} strokeLinecap="round" opacity={0.8} />
                  <path d={d} transform="translate(0 -2.3)" fill="none" stroke={lit(BRAIN, 0.55)} strokeWidth={1.5} strokeLinecap="round" opacity={0.65} />
                </g>
              ))}
              {/* the motor-cortex strip with the central sulcus behind it */}
              <path d={patchD} fill={tint} opacity={0.2 + 0.3 * glow} />
              <path d={patchD} fill="none" stroke={mix(SIG_DEEP, ALERT_DEEP, clamp(glowRed))} strokeWidth={2} opacity={0.6 + 0.4 * glow} />
              <path d={`M${P(patchPt(0.02, 13))} Q${P(patchPt(0.5, 18))} ${P(patchPt(0.98, 12))}`} fill="none" stroke={shade(GYRI, 0.3)} strokeWidth={2.8} strokeLinecap="round" opacity={0.7} />
              <ellipse cx={fmt(pc.x)} cy={fmt(pc.y)} rx={26 + 8 * glow} ry={38 + 10 * glow} fill={`url(#${id}-glow)`} opacity={0.18 + 0.75 * glow} />
              {/* threads and electrode tips */}
              {Array.from({length: N_THREADS}, (_, k) => (
                <g key={k}>
                  <path d={threadD(k)} fill="none" stroke="#0E2540" strokeWidth={3} strokeLinecap="round" opacity={0.3} />
                  <path d={threadD(k)} fill="none" stroke={mix('#7FD8FF', '#FF9AA0', clamp(glowRed * 0.6))} strokeWidth={1.6} strokeLinecap="round" opacity={0.98} />
                  <circle cx={fmt(threadGeo(k).T.x)} cy={fmt(threadGeo(k).T.y)} r={2.7} fill="#FFFFFF" stroke={SIG_DEEP} strokeWidth={1.3} />
                </g>
              ))}
              {/* signals */}
              {pulses.map((q, i) => {
                const a = clamp(q.a ?? 1);
                if (a <= 0.01) return null;
                const col = mix('#9BE8FF', '#FF7B84', clamp(q.red ?? 0));
                const glowC = mix(SIG, ALERT, clamp(q.red ?? 0));
                const tail = q.tail ?? 0.16;
                const pts = [0, 0.33, 0.66, 1].map((m) => threadAt(q.k, clamp(q.u - tail * m)));
                return (
                  <g key={i} opacity={a}>
                    <path d={`M${pts.map((z) => P(z)).join(' L')}`} fill="none" stroke={glowC} strokeWidth={3.4} strokeLinecap="round" opacity={0.55} />
                    <circle cx={fmt(pts[0].x)} cy={fmt(pts[0].y)} r={5 + 3 * clamp(q.red ?? 0)} fill={glowC} opacity={0.35 + 0.15 * clamp(q.red ?? 0)} />
                    <circle cx={fmt(pts[0].x)} cy={fmt(pts[0].y)} r={2.6 + 1.6 * clamp(q.red ?? 0)} fill={col} />
                  </g>
                );
              })}
              {mark > 0.01 && <circle cx={fmt(pc.x)} cy={fmt(pc.y)} r={3.2} fill="#FFFFFF" stroke="#172B3A" strokeWidth={1.2} opacity={mark} />}
            </g>
          </g>
          <path d={ell(BRAINE, 0.97)} fill="none" stroke="#5B1F33" strokeWidth={9} opacity={0.18} />
        </g>
      </g>
      {/* the bright cut edge sweeping outward from the chip (only where there is skull to cut) */}
      {edge > 0.01 && rr < 148 && (
        <g clipPath={`url(#${id}-skullclip)`}>
          <g transform={`translate(${fmt(sh)} 0)`}>
            <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={fmt(rr)} fill="none" stroke="#FFFFFF" strokeWidth={2 + 5 * edge} opacity={0.3 + 0.65 * edge} />
            <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={fmt(rr)} fill="none" stroke={SIG} strokeWidth={9 * edge} opacity={0.22 * edge} />
          </g>
        </g>
      )}
    </g>
  );

  const overlay = (
    <g transform={`translate(${fmt(sh)} 0)`}>
      <defs>
        <radialGradient id={`${id}-chip`} gradientUnits="userSpaceOnUse" cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={fmt(CHIP_R + 1)} fx={fmt(CHIP_C.x - 4)} fy={fmt(CHIP_C.y - 5)}>
          <stop offset="0" stopColor={lit(chipBody, 0.42)} />
          <stop offset="0.5" stopColor={chipBody} />
          <stop offset="1" stopColor={chipDeep} />
        </radialGradient>
        <radialGradient id={`${id}-ledg`}>
          <stop offset="0" stopColor={led2} stopOpacity={1} />
          <stop offset="1" stopColor={led2} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the shallow socket in the bone, then the chip seated flush in it */}
      <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={CHIP_R + 3} fill={shade(BONE, 0.55)} stroke="#172B3A" strokeWidth={1.7} />
      <circle cx={fmt(CHIP_C.x + 1.2)} cy={fmt(CHIP_C.y + 1.6)} r={CHIP_R + 1.4} fill="#2A1E2E" opacity={0.5} />
      <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={CHIP_R} fill={`url(#${id}-chip)`} stroke="#0E1F52" strokeWidth={1.5} />
      <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={CHIP_R - 2.8} fill="none" stroke={lit(chipBody, 0.55)} strokeWidth={1.1} opacity={0.8} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const q = add(CHIP_C, mul(rot({x: 1, y: 0}, a), CHIP_R - 2.8));
        return <circle key={a} cx={fmt(q.x)} cy={fmt(q.y)} r={1} fill="#DDF4FF" opacity={0.75} />;
      })}
      <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={6 + 3 * led} fill={`url(#${id}-ledg)`} opacity={0.35 + 0.6 * led} />
      <circle cx={fmt(CHIP_C.x)} cy={fmt(CHIP_C.y)} r={2.8} fill={led2} />
      <ellipse cx={fmt(CHIP_C.x - 4.4)} cy={fmt(CHIP_C.y - 5.2)} rx={4} ry={1.9} transform={`rotate(-35 ${fmt(CHIP_C.x - 4.4)} ${fmt(CHIP_C.y - 5.2)})`} fill="#FFFFFF" opacity={0.75} />
    </g>
  );
  return {underlay, overlay};
};

/** head-space -> world (shift = the surface shift the section applies for the turn, in head units) */
export const headToWorld = (q: V, c: V, R: number, roll: number, flip: boolean, shift = 0): V => {
  const s = R / 100;
  const local = {x: (q.x + shift) * (flip ? -s : s), y: q.y * s};
  return add(c, rot(local, roll));
};

/** where things sit in the world for a head at (c, R, roll, turn) */
export const chipWorld = (c: V, R: number, roll: number, turn: number) => headToWorld(CHIP_C, c, R, roll, true, -9 * turn);
export const patchWorld = (c: V, R: number, roll: number, turn: number, s = 0.5, o = 0) => headToWorld(patchPt(s, o), c, R, roll, true, -9 * turn + 4.5 * turn - 1);
