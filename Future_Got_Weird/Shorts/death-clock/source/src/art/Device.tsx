// The V2 device: one design used in every shot, from the wide fall to the macro and the underside section.
// A slim, rounded cobalt case with a dark glass face, a small bevel and one side control, on a strap that wraps
// the LEFT wrist. A recessed sensor/injector module sits in the case's underside (seen only when the arm is
// opened in section, see ArmInterior.tsx). All lettering is drawn here, in the compositor.
//
// The forearm is a tapered cylinder seen almost side-on. A point on it is given in arm-local 3D coordinates:
// u along the arm (from the elbow toward the wrist), v across it on screen (toward n, the arm's "upper" edge
// when it points screen-right) and w toward the camera. A small yaw (sy = sin yaw) lets w lean the projection
// along the arm, so rings around the wrist read as ellipses (the strap and its contact shadow wrap the wrist).
// `roll` turns the case about the arm's axis: 0 = the glass faces the camera, +90 = the case sits on the
// arm's upper edge in profile (the "camera tips toward the underside" view of the section).
import React from 'react';
import {UI_FONT} from '../fontNames';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, hash, len, lerp, mul, norm, sub, V} from '../lib/math';
import {Capsule, Glow, Lin, Sphere} from '../lib/shade';
import {Inked, InkFade, useInk} from '../lib/ink';
import {Limb, limbGeo} from '../lib/limb';
import {fmtClock, ScreenState} from '../lib/screen';
import {ringAlpha} from '../lib/device3';
import {Hand, HandPose} from './Hand';

const f2 = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
const f4 = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(4));
const P2 = (p: V) => `${f2(p.x)},${f2(p.y)}`;

// ------------------------------------------------------------------ arm frame
export type ArmFrame = {E: V; W: V; rE: number; rW: number; u: V; n: V; L: number};
export const armFrame = (E: V, W: V, rE: number, rW: number): ArmFrame => {
  const u = norm(sub(W, E));
  return {E, W, rE, rW, u, n: {x: u.y, y: -u.x}, L: len(sub(W, E))};
};
/** Arm-local 3D -> world (orthographic, with a small oblique lean of w along the arm). */
export const armPt = (A: ArmFrame, u: number, v: number, w = 0, sy = 0): V => ({
  x: A.E.x + A.u.x * (u + w * sy) + A.n.x * v,
  y: A.E.y + A.u.y * (u + w * sy) + A.n.y * v,
});
/** Radius of the forearm at u. */
export const armR = (A: ArmFrame, u: number) => lerp(A.rE, A.rW, clamp(u / A.L));
/** SVG matrix for arm-local 2D drawing: x = u * k, y = -v * k (k = local units per world unit). */
export const armMatrix = (A: ArmFrame, k = 1) =>
  `matrix(${f4(A.u.x / k)} ${f4(A.u.y / k)} ${f4(-A.n.x / k)} ${f4(-A.n.y / k)} ${f4(A.E.x)} ${f4(A.E.y)})`;

/** Device geometry, all relative to the wrist radius R (one design at every scale). */
export const DEV_GEO = {
  bandFromWrist: 1.75, // band centre sits this many R behind the wrist joint (clear of the hand)
  bandW: 0.95,
  ringOut: 1.07,
  caseL: 2.0,
  caseW: 1.62,
  caseT: 0.32,
  caseRad: 0.4,
  screenL: 0.8, // fraction of case length used by the screen
  screenW: 0.74,
};
export const SW = 300; // screen design space (along the arm)
export const SH = 232; // across the arm

export type DeviceView = {
  screen: ScreenState;
  /** case roll about the arm axis (deg) */
  roll: number;
  /** projection lean along the arm (deg), gives the ring curvature */
  yaw?: number;
  /** 0..1 strength of the screen's light on the skin */
  glow?: number;
  /** extra content drawn in arm-local units (u, -v) on top of the arm and band (sections, x-ray) */
  overArm?: (A: ArmFrame) => React.ReactNode;
  /** drawn between the arm surface and the strap (the section window opens under the strap edge) */
  inArm?: (A: ArmFrame) => React.ReactNode;
  /** V4: drawn on the bare arm skin, under the sleeve and the strap, clipped to the bare arm (the exterior
   *  diagnostic trace) */
  onSkin?: (A: ArmFrame) => React.ReactNode;
  /** case content clipped to the case profile when cut open (the underside module) */
  caseCut?: (A: ArmFrame, c: CaseGeo) => React.ReactNode;
  /** 0..1 how far the case's near half is cut away */
  caseOpen?: number;
  /** turn the glass UI 180 degrees so it reads upright when the forearm points screen-left (default: by direction) */
  flip?: boolean;
  /** V3: turn the UI layout in quarter turns so it reads upright on screen (portrait when the arm is vertical) */
  upright?: boolean;
};

export type CaseGeo = {uc: number; R: number; rr: number; t: number; L: number; Wd: number; roll: number; sy: number};

// ------------------------------------------------------------------ screen UI (design space SW x SH, origin at centre)
const Mono: React.FC<{text: string; x: number; y: number; size: number; cell: number; colon: number; fill: string; weight?: number}> = ({text, x, y, size, cell, colon, fill, weight = 800}) => {
  const widths = text.split('').map((c) => (c === ':' ? colon : cell));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = x - total / 2;
  return (
    <g fontFamily={UI_FONT} fontWeight={weight} fontSize={size} fill={fill} textAnchor="middle">
      {text.split('').map((c, i) => {
        const w = widths[i];
        const el = (
          <text key={i} x={f2(cx + w / 2)} y={f2(y + (c === ':' ? -size * 0.06 : 0))}>
            {c}
          </text>
        );
        cx += w;
        return el;
      })}
    </g>
  );
};

/** Heart-rhythm trace (a UI mark). irregular 0..1 breaks the rhythm. */
export const tracePts = (f: number, w: number, amp: number, irregular: number, n = 80) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (w * i) / n;
    const ph = (i / n) * 2.6 + f * 0.035;
    const k = ph - Math.floor(ph);
    const jitter = irregular * (hash(Math.floor(ph * 7), 5) - 0.5) * 2;
    const kk = clamp(k + jitter * 0.18);
    let y = 0;
    if (kk > 0.42 && kk < 0.46) y = -amp * 0.35;
    else if (kk >= 0.46 && kk < 0.5) y = amp * (1 + irregular * 0.6 * jitter);
    else if (kk >= 0.5 && kk < 0.54) y = -amp * 0.5;
    else if (kk > 0.66 && kk < 0.76) y = amp * 0.18 * Math.sin(((kk - 0.66) / 0.1) * Math.PI);
    y += irregular * Math.sin(i * 1.7 + f * 0.4) * amp * 0.12;
    pts.push(`${f2(x)},${f2(-y)}`);
  }
  return pts.join(' ');
};

const BG = {
  green: ['#0F3A2C', '#061A12'],
  red: ['#5A0B16', '#1E0208'],
  blue: ['#0C3358', '#041628'],
  rec: ['#14583A', '#07291B'],
};

export const ScreenUI: React.FC<{id: string; s: ScreenState; rot?: number}> = ({id, s, rot = 0}) => {
  const green = PAL.normal;
  const crimson = PAL.alert;
  const stab = s.stab;
  const rec = s.recover;
  // sequential blends: each later state fully replaces the earlier one (no red left under the recovery).
  // V4: the held state stays red (steady, not flashing; cyan border and label), so "green replaces red" is literal
  const HELD_BLUE = 0;
  const top = mix(mix(mix(BG.green[0], BG.red[0], s.red), BG.blue[0], stab * HELD_BLUE), BG.rec[0], rec);
  const bot = mix(mix(mix(BG.green[1], BG.red[1], s.red), BG.blue[1], stab * HELD_BLUE), BG.rec[1], rec);
  const flash = s.red * (1 - stab) * (0.5 + 0.5 * Math.cos(s.flash * Math.PI * 2));
  const scanY = -SH / 2 + ((s.f * 4) % SH);
  const showGreen = (1 - s.red) * (1 - rec);
  // V4: green replaces red as a wipe up the glass (no dissolve, no ghost digits under the new readout)
  const wiping = rec > 0.001 && rec < 0.999;
  const wipeY = SH / 2 + 12 - (SH + 24) * rec;
  const showRed = wiping ? s.red : s.red * (1 - rec);
  const diag = s.diag ?? 0;
  const timerCol = '#FFFFFF';
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
        <radialGradient id={`${id}-edge`} cx="0.5" cy="0.5" r="0.72">
          <stop offset="0.6" stopColor={crimson} stopOpacity={0} />
          <stop offset="1" stopColor={crimson} stopOpacity={0.8} />
        </radialGradient>
      </defs>
      <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill={`url(#${id}-bg)`} />
      {/* V3: the band turns its layout upright (portrait) when the forearm is held vertical */}
      <g transform={rot ? `rotate(${f2(rot)}) scale(${f2(Math.abs(Math.sin((rot * Math.PI) / 180)) > 0.5 ? (SH / SW) * 0.99 : 1)})` : undefined}>
      {/* green: vital scan */}
      {showGreen > 0.01 && (
        <g opacity={showGreen}>
          <rect x={-SW / 2} y={scanY - 16} width={SW} height={16} fill={green} opacity={0.1} />
          <text x={0} y={-58} textAnchor="middle" fontFamily={UI_FONT} fontWeight={700} fontSize={27} letterSpacing={3} fill={lit(green, 0.4)}>
            {s.scanText ?? 'VITAL SCAN'}
          </text>
          <polyline points={tracePts(s.f, SW - 70, 30, 0)} fill="none" stroke={lit(green, 0.25)} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" transform="translate(0 16)" />
          <rect x={-SW / 2 + 46} y={70} width={SW - 92} height={8} rx={4} fill={shade(green, 0.6)} />
          <rect x={-SW / 2 + 46} y={70} width={f2((SW - 92) * (0.2 + 0.8 * ((s.f * 0.012) % 1)))} height={8} rx={4} fill={green} />
        </g>
      )}
      {s.edge > 0.01 && <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill={`url(#${id}-edge)`} opacity={s.edge * (0.6 + 0.4 * Math.sin(s.f * 0.5))} />}
      {/* crimson countdown; blue when the treatment holds it */}
      {wiping && (
        <defs>
          <clipPath id={`${id}-wr`}>
            <rect x={-SW} y={-SH * 1.5} width={SW * 2} height={f2(wipeY + SH * 1.5)} />
          </clipPath>
          <clipPath id={`${id}-wg`}>
            <rect x={-SW} y={f2(wipeY)} width={SW * 2} height={SH * 2} />
          </clipPath>
        </defs>
      )}
      {showRed > 0.01 && (
        <g opacity={showRed} clipPath={wiping ? `url(#${id}-wr)` : undefined}>
          <rect x={-SW / 2 + 6} y={-SH / 2 + 6} width={SW - 12} height={SH - 12} rx={16} fill="none" stroke={mix(lit(crimson, 0.25), PAL.signal, Math.max(stab, s.alert * 0.6))} strokeWidth={5} opacity={0.3 + 0.6 * Math.max(flash, stab * 0.8)} />
          {s.secs === null && (
            <text x={0} y={16} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={40} letterSpacing={4} fill="#FFD6D9" opacity={0.6 + 0.4 * Math.sin(s.f * 0.7)}>
              CALCULATING
            </text>
          )}
          {s.secs !== null && (
            <g opacity={s.timerIn} transform={`scale(${f2(lerp(1.2, 1, s.timerIn))})`}>
              <text x={0} y={-56} textAnchor="middle" fontFamily={UI_FONT} fontWeight={700} fontSize={20} letterSpacing={3} fill={mix('#FFC9CE', '#BDEBFF', stab)}>
                {stab > 0.5 ? 'TIMER HELD · STABILIZING' : 'TIME REMAINING'}
              </text>
              <Mono text={fmtClock(s.secs)} x={0} y={30} size={88} cell={38} colon={17} fill={timerCol} />
              {/* rhythm under the digits: irregular while red, steadier once treated */}
              {s.alert < 0.5 && stab < 0.5 && diag < 0.02 && (
                <polyline points={tracePts(s.f, 150, 11, 1 - stab, 60)} fill="none" stroke="#FF9AA2" strokeWidth={3.5} strokeLinejoin="round" transform="translate(0 78)" />
              )}
            </g>
          )}
          {/* the diagnostic resolves: a slim bar under the digits fills, then hands over to the alert */}
          {diag > 0.01 && s.alert < 0.99 && stab < 0.5 && (
            <g opacity={1 - s.alert}>
              <rect x={-100} y={66} width={200} height={9} rx={4.5} fill="#3A0A12" />
              <rect x={-100} y={66} width={f2(200 * diag)} height={9} rx={4.5} fill={mix('#FF9AA2', PAL.signal, clamp((diag - 0.85) / 0.15))} />
            </g>
          )}
        </g>
      )}
      {/* blue help-alert strip */}
      {s.alert > 0.01 && (
        <g transform={`translate(0 ${f2(lerp(70, 0, s.alert))})`} opacity={clamp(s.alert * 2) * (1 - stab) * (1 - rec)}>
          <rect x={-SW / 2 + 14} y={54} width={SW - 28} height={46} rx={12} fill={PAL.signal} />
          <rect x={-SW / 2 + 14} y={54} width={SW - 28} height={18} rx={9} fill="#FFFFFF" opacity={0.25} />
          <g transform="translate(-104 77) scale(0.8)">
            <path d="M0,-15 C8,-15 13,-9 13,-2 C13,6 4,12 0,17 C-4,12 -13,6 -13,-2 C-13,-9 -8,-15 0,-15 Z" fill="#0A3550" />
            <circle cx={0} cy={-2} r={5} fill={PAL.signal} />
          </g>
          <text x={16} y={86} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={27} letterSpacing={1.4} fill="#06263A">
            HELP ALERT SENT
          </text>
        </g>
      )}
      {/* the state change into stabilizing: one blue sweep across the glass */}
      {stab > 0.01 && stab < 0.99 && <rect x={-SW / 2 + (SW + 60) * stab - 60} y={-SH / 2} width={60} height={SH} fill="#BFF3FF" opacity={0.35 * Math.sin(stab * Math.PI)} />}
      {/* green recovery readout: exactly "Life Expectancy: 42 Years" */}
      {wiping && <rect x={-SW / 2} y={f2(wipeY - 2)} width={SW} height={4} fill={lit(green, 0.5)} opacity={0.7} />}
      {rec > 0.01 && (
        <g opacity={(wiping ? 1 : rec) * (1 - clamp(s.glitch * 1.4))} clipPath={wiping ? `url(#${id}-wg)` : undefined}>
          <rect x={-SW / 2 + 6} y={-SH / 2 + 6} width={SW - 12} height={SH - 12} rx={16} fill="none" stroke={lit(green, 0.35)} strokeWidth={4} opacity={0.7} />
          <text x={0} y={-34} textAnchor="middle" fontFamily={UI_FONT} fontWeight={700} fontSize={36} letterSpacing={0.5} fill={lit(green, 0.6)}>
            Life Expectancy:
          </text>
          <text x={0} y={54} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={86} fill="#FFFFFF">
            42 Years
          </text>
        </g>
      )}
      {/* one localized glitch: a few slices shift and a clear question mark */}
      {s.glitch > 0.01 && (
        <g>
          {Array.from({length: 6}).map((_, i) => {
            const y0 = -SH / 2 + (SH / 6) * i;
            const dx = (hash(i + Math.floor(s.f), 21) - 0.5) * 60 * s.glitch;
            return <rect key={i} x={-SW / 2 + dx} y={y0} width={SW} height={SH / 6 - 2} fill={i % 2 ? BG.rec[0] : '#1C1236'} opacity={0.6 * s.glitch} />;
          })}
          <g opacity={clamp(s.glitch * 1.6)}>
            <text x={-6} y={66} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={186} fill="#FF3B6B" opacity={0.7}>
              ?
            </text>
            <text x={6} y={66} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={186} fill={PAL.signal} opacity={0.7}>
              ?
            </text>
            <text x={0} y={66} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={186} fill="#FFFFFF">
              ?
            </text>
          </g>
        </g>
      )}
      </g>
    </g>
  );
};

/** Colour of the screen's light on skin and casing. */
export const screenLight = (s: ScreenState) => {
  if (s.glitch > 0.5) return '#B9F6FF';
  if (s.recover > 0.5) return PAL.normal;
  if (s.stab > 0.5 || s.alert > 0.5) return PAL.signal;
  return mix(PAL.normal, PAL.alert, s.red);
};

// ------------------------------------------------------------------ geometry helpers
const hull = (pts: V[]): V[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: V[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: V[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
};
/** Rounded-rectangle outline (half extents a, b, corner radius c) as points, counter-clockwise. */
const rrect = (a: number, b: number, c: number, n = 6): [number, number][] => {
  const out: [number, number][] = [];
  const corners: [number, number, number][] = [
    [a - c, b - c, 0],
    [-(a - c), b - c, 90],
    [-(a - c), -(b - c), 180],
    [a - c, -(b - c), 270],
  ];
  corners.forEach(([cx, cy, a0]) => {
    for (let i = 0; i <= n; i++) {
      const t = ((a0 + (90 * i) / n) * Math.PI) / 180;
      out.push([cx + c * Math.cos(t), cy + c * Math.sin(t)]);
    }
  });
  return out;
};
const poly = (pts: V[]) => `M${pts.map(P2).join(' L')} Z`;

/** The case's planar frame at radius rr, tilted by roll: maps (a along arm, b across, y-down on the glass). */
const caseFrame = (A: ArmFrame, uc: number, rr: number, roll: number, sy: number, flip = false) => {
  const r = (roll * Math.PI) / 180;
  const sb = Math.sin(r);
  const cb = Math.cos(r);
  const O = armPt(A, uc, rr * sb, rr * cb, sy);
  // glass "down" = minus the tangent (0, cos, -sin) of the cylinder at the case; flip turns the glass frame 180 deg
  const k = flip ? -1 : 1;
  const ax = mul(A.u, k);
  const ay: V = mul({x: -A.n.x * cb + A.u.x * sb * sy, y: -A.n.y * cb + A.u.y * sb * sy}, k);
  return {O, ax, ay, cb, sb, at: (a: number, b: number): V => add(O, add(mul(ax, a), mul(ay, b)))};
};
const matrixOf = (fr: {O: V; ax: V; ay: V}, k: number) => `matrix(${f4(fr.ax.x * k)} ${f4(fr.ax.y * k)} ${f4(fr.ay.x * k)} ${f4(fr.ay.y * k)} ${f4(fr.O.x)} ${f4(fr.O.y)})`;

// ------------------------------------------------------------------ V4 alarm ring (loop area)
/** The band's red alarm ring (ScreenState.ring / ringEnv from lib/device3.ts alarmAt): one expanding stroke,
 *  concentric with the glass centre, starting just outside the case's corners so it never crosses the digits.
 *  A thin line (normal blend, no glow) that fades in as it leaves the case and out as it grows. */
export const AlarmRing: React.FC<{c: V; R: number; u: number; env: number}> = ({c, R, u, env}) => {
  if (env <= 0.001) return null;
  const a = ringAlpha(u, env);
  if (a < 0.004) return null;
  const r = (0.5 * Math.hypot(DEV_GEO.caseL, DEV_GEO.caseW) + 0.16 + 0.75 * u) * R;
  // the line scales with the band (about 9 px in the glass close-ups, a hairline in the wide shot after the cut)
  return <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} fill="none" stroke="#FF5A66" strokeWidth={f2(0.04 * R)} opacity={f2(a)} />;
};

// ------------------------------------------------------------------ the forearm, strap, case and hand
type WristProps = {
  id: string;
  E: V;
  W: V;
  rE: number;
  rW: number;
  dev: DeviceView;
  hand?: {pose: HandPose; L: number; ang: number; thumbSide: 1 | -1; offset: number};
  skin?: string;
  ink: number;
  /** V3: the shoulder; when given, the whole arm is one continuous limb (no elbow piece) */
  S?: V;
  rS?: number;
  /** drawn right after the arm's skin (the sleeve over the upper arm) */
  afterArm?: React.ReactNode;
  /** dissolve the arm's own contour here (where it grows out of the body) */
  fade?: InkFade[];
};

export const Wrist3D: React.FC<WristProps> = ({id, E, W, rE, rW, dev, hand, skin = PAL.skin, ink, S, rS, afterArm, fade}) => {
  const pass = useInk().pass;
  const A = armFrame(E, W, rE, rW);
  const R = rW;
  const G = DEV_GEO;
  const sy = Math.sin(((dev.yaw ?? 14) * Math.PI) / 180);
  const ub = A.L - G.bandFromWrist * R;
  const rb = armR(A, ub) * G.ringOut;
  const bw = G.bandW * R;
  const light = screenLight(dev.screen);
  const glowK = dev.glow ?? 1;

  // strap: ring edges (front half: phi in [-90, 90], w >= 0; back half: w <= 0)
  const ring = (u0: number, front: boolean, n = 16) =>
    Array.from({length: n + 1}).map((_, i) => {
      const ph = ((-90 + (180 * i) / n) * Math.PI) / 180;
      const w = (front ? 1 : -1) * rb * Math.cos(ph);
      return armPt(A, u0, rb * Math.sin(ph), w, sy);
    });
  const strap = (front: boolean) => {
    const a = ring(ub - bw / 2, front);
    const b = ring(ub + bw / 2, front).reverse();
    return poly([...a, ...b]);
  };
  const topP = armPt(A, ub, rb, 0, sy);
  const botP = armPt(A, ub, -rb, 0, sy);
  const armD = (() => {
    // the forearm silhouette (tapered capsule) for clipping the light and contact shadows
    const p1 = armPt(A, 0, rE);
    const p2 = armPt(A, A.L, rW);
    const p3 = armPt(A, A.L, -rW);
    const p4 = armPt(A, 0, -rE);
    return `M${P2(p1)} L${P2(p2)} A${f2(rW)} ${f2(rW)} 0 0 1 ${P2(p3)} L${P2(p4)} A${f2(rE)} ${f2(rE)} 0 0 1 ${P2(p1)} Z`;
  })();

  // case
  const cL = G.caseL * R;
  const cW = G.caseW * R;
  const cT = G.caseT * R;
  const rr0 = armR(A, ub) * 0.985;
  const rr1 = armR(A, ub) + cT;
  const fr0 = caseFrame(A, ub, rr0, dev.roll, sy);
  const flip = dev.flip ?? A.u.x < 0;
  const fr1 = caseFrame(A, ub, rr1, dev.roll, sy, flip);
  // quarter turns that bring the glass's layout upright on screen
  const uiRot = dev.upright ? -Math.round((Math.atan2(fr1.ax.y, fr1.ax.x) * 180) / Math.PI / 90) * 90 : 0;
  // a pillowed profile: full size through the lower body, a chamfered lip at the glass
  const layers: [number, number][] = [
    [rr0, 1],
    [rr0 + (rr1 - rr0) * 0.55, 1],
    [rr0 + (rr1 - rr0) * 0.85, 0.985],
    [rr1, 0.95],
  ];
  const sideHull = hull(
    layers.flatMap(([rr, k]) => {
      const fr = caseFrame(A, ub, rr, dev.roll, sy);
      return rrect((cL / 2) * k, (cW / 2) * k, G.caseRad * R * k).map(([a, b]) => fr.at(a, b));
    }),
  );
  const facing = fr1.cb; // > 0: the glass is turned toward the camera
  const frMid = caseFrame(A, ub, (rr0 + rr1) / 2 + cT * 0.12, dev.roll, sy);
  const sideFrom = fr1.at(0, -cW / 2);
  const sideTo = fr0.at(0, cW / 2);
  const kUI = (G.screenL * cL) / SW;
  const geo: CaseGeo = {uc: ub, R, rr: armR(A, ub), t: cT, L: cL, Wd: cW, roll: dev.roll, sy};
  const caseOpen = dev.caseOpen ?? 0;

  // the arm: one continuous limb from the shoulder (or the forearm alone in close views) with the hand inside the
  // same contour group, so no line crosses the elbow or the wrist
  const armGroup = (
    <Inked w={ink} id={`${id}-ai`} fade={fade}>
      {S && rS ? (
        <Limb id={`${id}-lb`} A={S} B={E} C={W} rA={rS} rB={rE} rC={rW} color={skin} spec={0.2} crease={ink * 0.7} />
      ) : (
        <Capsule id={`${id}-fa`} a={add(E, mul(A.u, -rE))} b={W} ra={rE * 1.02} rb={rW} color={skin} spec={0.22} />
      )}
      {hand && <Hand id={`${id}-hd`} wrist={add(W, mul(A.u, -hand.offset))} ang={hand.ang} L={hand.L} thumbSide={hand.thumbSide} view="back" pose={hand.pose} color={skin} ink={ink * 0.85} bare />}
    </Inked>
  );
  if (pass === 'ink') {
    // inside a figure's silhouette pass only the arm, hand and sleeve contribute
    return (
      <g>
        {armGroup}
        {afterArm}
      </g>
    );
  }

  return (
    <g>
      <defs>
        <clipPath id={`${id}-arm`}>
          <path d={armD} />
        </clipPath>
        <clipPath id={`${id}-scr`}>
          <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} rx={30} />
        </clipPath>
      </defs>
      {/* far side of the strap: only its edge shows past the wrist's outline */}
      <Lin id={`${id}-stb`} d={strap(false)} from={topP} to={botP} stops={[[0, shade(PAL.band, 0.35)], [1, shade(PAL.band, 0.6)]]} />
      {armGroup}
      {dev.onSkin && S && rS && (
        <g>
          <defs>
            <clipPath id={`${id}-skin`}>
              <path d={limbGeo(S, E, W, rS, rE, rW).d} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-skin)`}>{dev.onSkin(A)}</g>
        </g>
      )}
      {afterArm}
      {dev.inArm && <g clipPath={`url(#${id}-arm)`}>{dev.inArm(A)}</g>}
      {/* the screen's coloured light on the skin, and the strap's contact shadows, kept on the arm */}
      <g clipPath={`url(#${id}-arm)`}>
        {facing > -0.2 && <Glow id={`${id}-lt`} c={armPt(A, ub, armR(A, ub) * Math.sin((dev.roll * Math.PI) / 180) * 0.6, 0, sy)} r={R * 2.6} ry={R * 1.6} color={light} alpha={0.42 * glowK * clamp(facing + 0.4)} />}
        {[ub - bw / 2, ub + bw / 2].map((u0, i) => {
          const d = `M${ring(u0 + (i ? 1 : -1) * R * 0.05, true).map(P2).join(' L')}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#6B3A2A" strokeOpacity={0.14} strokeWidth={f2(R * 0.34)} />
              <path d={d} fill="none" stroke="#6B3A2A" strokeOpacity={0.2} strokeWidth={f2(R * 0.12)} />
            </g>
          );
        })}
      </g>
      {/* strap, front half, wrapping the wrist */}
      <Lin id={`${id}-st`} d={strap(true)} from={topP} to={botP} stops={[[0, lit(PAL.band, 0.32)], [0.18, PAL.band], [0.62, PAL.bandDeep], [0.9, shade(PAL.bandDeep, 0.35)], [1, shade(PAL.bandDeep, 0.15)]]} />
      {[-0.3, 0, 0.3].map((k, i) => {
        const d = `M${ring(ub + k * bw, true, 10).map(P2).join(' L')}`;
        return <path key={i} d={d} fill="none" stroke="#0B205F" strokeOpacity={0.22} strokeWidth={f2(R * 0.03)} />;
      })}
      <path d={`M${ring(ub - bw / 2 + R * 0.04, true, 12).slice(8, 13).map(P2).join(' L')}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={f2(R * 0.05)} strokeLinecap="round" />
      {/* case: side walls (hull of the outline at the skin and at the glass) */}
      <path d={poly(sideHull)} fill="#0E2A6E" stroke="#0A1A44" strokeWidth={f2(R * 0.035)} strokeLinejoin="round" />
      <Lin id={`${id}-cs`} d={poly(sideHull)} from={sideFrom} to={sideTo} stops={[[0, '#2F5FD8'], [0.45, '#1A3E9E'], [1, '#0B2160']]} />
      {/* the underside module, when the case is opened in section */}
      {caseOpen > 0.01 && dev.caseCut && (
        <g>
          <defs>
            <clipPath id={`${id}-cc`}>
              <path d={poly(sideHull)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-cc)`} opacity={caseOpen}>
            {dev.caseCut(A, geo)}
          </g>
        </g>
      )}
      {/* side control (crown) toward the hand */}
      <Capsule id={`${id}-cr`} a={frMid.at(cL / 2 - 0.02 * R, 0)} b={frMid.at(cL / 2 + 0.12 * R, 0)} ra={0.1 * R} rb={0.1 * R} color="#2A56C9" spec={0.6} k={1.2} />
      {/* glass face (only when turned toward the camera) */}
      {facing > 0.04 && (
        <g transform={matrixOf(fr1, 1)}>
          <defs>
            <linearGradient id={`${id}-top`} gradientUnits="userSpaceOnUse" x1={f2(-cL / 2)} y1={f2(-cW / 2)} x2={f2(cL / 3)} y2={f2(cW / 2)}>
              <stop offset="0" stopColor="#5C86F2" />
              <stop offset="0.4" stopColor={PAL.band} />
              <stop offset="1" stopColor="#13328A" />
            </linearGradient>
            <linearGradient id={`${id}-gl`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(-cW / 2)} x2="0" y2={f2(cW / 2)}>
              <stop offset="0" stopColor="#1A2744" />
              <stop offset="1" stopColor="#05080F" />
            </linearGradient>
          </defs>
          <path d={`M${rrect((cL / 2) * 0.95, (cW / 2) * 0.95, G.caseRad * R * 0.95).map(([a, b]) => `${f2(a)},${f2(b)}`).join(' L')} Z`} fill={`url(#${id}-top)`} />
          {/* bevel: a thin lit lip around the glass */}
          <path d={`M${rrect(cL * 0.475 - 0.07 * R, cW * 0.475 - 0.07 * R, (G.caseRad - 0.07) * R).map(([a, b]) => `${f2(a)},${f2(b)}`).join(' L')} Z`} fill="#8FB0FF" opacity={0.55} />
          <path d={`M${rrect(cL * 0.475 - 0.1 * R, cW * 0.475 - 0.1 * R, (G.caseRad - 0.09) * R).map(([a, b]) => `${f2(a)},${f2(b)}`).join(' L')} Z`} fill={`url(#${id}-gl)`} />
          <g transform={`scale(${f4(kUI)})`}>
            <g clipPath={`url(#${id}-scr)`}>
              <ScreenUI id={`${id}-ui`} s={dev.screen} rot={uiRot} />
              {/* one restrained reflection on the glass, away from the digits */}
              <path d={`M${-SW / 2},${-SH / 2 + 22} L${-SW / 2 + 58},${-SH / 2} L${-SW / 2 + 92},${-SH / 2} L${-SW / 2},${-SH / 2 + 56} Z`} fill="#FFFFFF" opacity={0.12} />
            </g>
          </g>
          {/* gloss on the cobalt shell */}
          <ellipse cx={f2(-cL * 0.18)} cy={f2(-cW / 2 + 0.05 * R)} rx={f2(cL * 0.26)} ry={f2(0.035 * R)} fill="#FFFFFF" opacity={0.65} />
        </g>
      )}
      {/* lit top lip of the case in profile */}
      {facing <= 0.04 && <path d={`M${P2(fr1.at(-cL / 2 + G.caseRad * R, 0))} L${P2(fr1.at(cL / 2 - G.caseRad * R, 0))}`} stroke="#9DB8FF" strokeOpacity={0.7} strokeWidth={f2(R * 0.05)} strokeLinecap="round" />}
      {/* V4: the alarm ring round the glass (loop alarm and the warning landing) */}
      <AlarmRing c={fr1.O} R={R} u={dev.screen.ring ?? 0} env={dev.screen.ringEnv ?? 0} />
      {dev.overArm && dev.overArm(A)}
    </g>
  );
};
