// Draws the biohybrid fish (fish/model.ts) through a 3D camera, in the FGW finish: flat cel colour with one soft
// gradient per surface, light from the upper left, navy ink of constant screen width on top.
//
// The body is split into surface regions (side A and side B faces of the paper front, the gelatin hinge and the paper
// caudal fin; the two muscle sheets; the edge strips along the top and bottom, which carry the five layers; the
// G-nodes; the floater fin). Each region is one closed path, sorted far to near, back faces first, so the thin body
// reads correctly from the side, from above and in between, and the translucent gelatin shows what is behind it.
import React from 'react';
import {Basis, proj, sub3, dot3, norm3, V2, V3} from '../core/cam';
import {mix, shade, lit} from '../dc/color';
import {INK} from '../dc/ink';
import {botOf, fishGeo, FishGeo, FishPose, floatH, GNODE, HC, HINGE0, HINGE1, L, MUS0, MUS1, musBot, musThick, musTop, notchOf, SS, stretchOf, topOf} from './model';

export const PAPER = '#F5F2EA';
export const GEL = '#F6E3B4';
export const MUS_RELAX = '#C24452';
export const MUS_CONTRACT = '#D9293C';
export const MUS_YOUNG = '#E8A6A6';
export const FLOATER = '#CDEBF5';
export const XRAY = '#A6ECFF';

export type FishLook = {
  /** 0..1: everything but the muscle turns to X-ray glass */
  xray?: number;
  /** tint toward the water colour (distance haze) */
  haze?: number;
  hazeColor?: string;
  /** ink width multiplier */
  ink?: number;
  /** 0..1 extra detail (cell texture) for close views */
  detail?: number;
  /** opacity of the muscle sheets (0 = not yet grown) */
  muscle?: number;
  /** draw the G-nodes */
  gnode?: boolean;
  /** core opacity (to fade the whole body) */
  opacity?: number;
  /** final screen px per drawing unit (when drawn inside a zoomed 2D layer), so ink stays constant on screen */
  pxScale?: number;
  /** draw only the body (paper front + gelatin hinge, with the floater) or only the caudal fin piece (assembly) */
  only?: 'body' | 'tail';
};

type Region = {key: string; pts: V2[][]; z: number; front: boolean; fill: string; op: number; ink: boolean; grad?: [V2, V2, string, string]; extra?: React.ReactNode};

const LIGHT: V3 = norm3([-0.45, -0.8, 0.4]);
const P2 = (p: V2) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const pathOf = (loops: V2[][]) => loops.map((l) => 'M' + l.map(P2).join('L') + 'Z').join('');
const sRange = (a: number, b: number) => [a, ...SS.filter((s) => s > a + 1e-4 && s < b - 1e-4), b];
const rangeIdxMid = (a: number, b: number) => {
  const m = (a + b) / 2;
  let i = 0;
  while (i < SS.length - 1 && SS[i] < m) i++;
  return i;
};

export const muscleColor = (pose: FishPose, act: number) => mix(mix(MUS_YOUNG, MUS_RELAX, pose.mature), MUS_CONTRACT, act * (0.5 + 0.5 * pose.mature));

/** screen extent of the fish (for camera framing and keep-outs) */
export const fishScreen = (B: Basis, pose: FishPose) => {
  const g = fishGeo(pose);
  const pts = [0, 0.25, 0.5, 0.75, 1].flatMap((s) => [g.atS(s, topOf(s), 0), g.atS(s, botOf(s), 0)]).map((p) => proj(B, p));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), c: proj(B, g.atS(0.5, 0, 0))};
};

export const Fish: React.FC<{id: string; B: Basis; pose: FishPose; look?: FishLook}> = ({id, B, pose, look = {}}) => {
  const g: FishGeo = fishGeo(pose);
  const xr = look.xray ?? 0;
  const haze = look.haze ?? 0;
  const hz = look.hazeColor ?? '#7FB8C4';
  const mOp = look.muscle ?? 1;
  const bodyOp = look.opacity ?? 1;
  const hcT = HC * pose.TK;
  const P = (p: V3) => proj(B, p);
  const sc = P(g.atS(0.45, 0, 0)).s;
  const pxs = look.pxScale ?? 1;
  const lenPx = L * sc * pxs;
  const wInk = (Math.min(3.6, Math.max(1.1, 0.9 + 0.0042 * lenPx)) * (look.ink ?? 1)) / pxs;
  const H = (c: string) => (haze > 0 ? mix(c, hz, haze) : c);
  const facing = (n: V3, p: V3) => dot3(n, sub3(B.eye, p)) / Math.max(1e-6, Math.hypot(...sub3(B.eye, p)));
  const bright = (n: V3) => 0.62 + 0.38 * Math.max(0, dot3(n, LIGHT));
  const regions: Region[] = [];

  // ---------------------------------------------------------------- faces
  const faceLoop = (a: number, b: number, d: number, vt: (s: number) => number, vb: (s: number) => number, fork: boolean): V2[][] => {
    const ss = sRange(a, b);
    const top = ss.map((s) => P(g.atS(s, vt(s), d)));
    const bot = ss.map((s) => P(g.atS(s, vb(s), d))).reverse();
    if (!fork) return [[...top, ...bot]];
    const fs = sRange(0.9, 1).reverse();
    const nUp = fs.map((s) => P(g.atS(s, -notchOf(s), d)));
    const nDn = [...fs].reverse().map((s) => P(g.atS(s, notchOf(s), d)));
    return [[...top, ...nUp, ...nDn, ...bot]];
  };
  const mats: {key: string; a: number; b: number; c: string; op: number}[] = [
    {key: 'front', a: 0, b: HINGE0, c: PAPER, op: 1},
    {key: 'gel', a: HINGE0, b: HINGE1, c: GEL, op: 0.62},
    {key: 'tail', a: HINGE1, b: 1, c: PAPER, op: 1},
  ].filter((m) => !look.only || (look.only === 'tail') === (m.key === 'tail'));
  for (const side of [1, -1] as const) {
    for (const m of mats) {
      const d = side * hcT;
      const i = rangeIdxMid(m.a, m.b);
      const n = g.nA(i).map((x) => x * side) as V3;
      const pm = g.at(i, 0, d);
      const fc = facing(n, pm);
      if (Math.abs(fc) < 0.035 && xr < 0.05) continue;
      const loops = faceLoop(m.a, m.b, d, topOf, botOf, m.b === 1);
      const zc = proj(B, pm).z;
      const base = H(mix(m.c, XRAY, xr));
      const col = mix(shade(base, 0.32), base, bright(n));
      const op = (m.op + (1 - m.op) * 0) * (1 - xr * (m.key === 'gel' ? 0.75 : 0.86)) * bodyOp;
      const gt = P(g.at(i, topOf(SS[i]), d)), gb = P(g.at(i, botOf(SS[i]), d));
      regions.push({key: `${m.key}${side}`, pts: loops, z: zc, front: fc > 0, fill: col, op, ink: true, grad: [gt, gb, lit(col, 0.18), shade(col, 0.16)]});
    }
  }
  // ---------------------------------------------------------------- edge strips (the five layers seen edge-on)
  const strip = (key: string, a: number, b: number, vf: (s: number) => number, d0: number, d1: number, c: string, op: number, up: boolean) => {
    const ss = sRange(a, b);
    const A0 = ss.map((s) => P(g.atS(s, vf(s), d0)));
    const A1 = ss.map((s) => P(g.atS(s, vf(s), d1))).reverse();
    const sm = (a + b) / 2;
    const pm = g.atS(sm, vf(sm), (d0 + d1) / 2);
    const n: V3 = up ? [0, -1, 0] : [0, 1, 0];
    const fc = facing(n, pm);
    if (fc < 0.02 && xr < 0.05) return;
    const base = H(mix(c, XRAY, xr * (c === PAPER || c === GEL ? 1 : 0)));
    regions.push({key, pts: [[...A0, ...A1]], z: proj(B, pm).z, front: fc > 0, fill: mix(shade(base, 0.3), base, bright(n)), op: op * bodyOp, ink: true});
  };
  for (const up of [true, false]) {
    const vf = up ? topOf : botOf;
    for (const m of mats) strip(`e${up ? 't' : 'b'}${m.key}`, m.a, m.b, vf, -hcT, hcT, m.c, m.key === 'gel' ? 0.85 : 1, up);
  }

  // ---------------------------------------------------------------- muscle sheets
  const muscle = (side: 1 | -1) => {
    if (mOp <= 0.001) return;
    const act = side > 0 ? pose.actA : pose.actB;
    const wave = side > 0 ? pose.waveA ?? -1 : pose.waveB ?? -1;
    const hm = musThick(pose, side) * Math.min(1, mOp * 1.4);
    const d = side * (hcT + hm);
    const i = rangeIdxMid(MUS0, MUS1);
    const n = g.nA(i).map((x) => x * side) as V3;
    const pm = g.at(i, 0, d);
    const fc = facing(n, pm);
    const base = H(mix(muscleColor(pose, act), '#F2B8B8', 0.24 * stretchOf(pose, side) * (1 - act)));
    const col = mix(shade(base, 0.38), base, bright(n));
    const front = fc > 0;
    const ss = sRange(MUS0, MUS1);
    const loop = [...ss.map((s) => P(g.atS(s, musTop(s), d))), ...ss.map((s) => P(g.atS(s, musBot(s), d))).reverse()];
    const gt = P(g.at(i, musTop(SS[i]), d)), gb = P(g.at(i, musBot(SS[i]), d));
    // texture: aligned fibres along the body axis, sarcomere cross-bands in close views, the wet sheen, a trigger wave
    const fib: React.ReactNode[] = [];
    const fibW = Math.max(0.7, wInk * 0.42);
    const fibOp = (0.3 + 0.35 * pose.mature) * (front ? 1 : 0.6);
    const nf = 9;
    for (let k = 1; k < nf; k++) {
      const f = k / nf;
      const s0 = MUS0 + 0.025 + 0.012 * ((k * 37) % 5), s1 = MUS1 - 0.02 - 0.01 * ((k * 23) % 4);
      const pts = sRange(s0, s1).map((s) => P(g.atS(s, musTop(s) + f * (musBot(s) - musTop(s)), d)));
      fib.push(<path key={`f${k}`} d={'M' + pts.map(P2).join('L')} fill="none" stroke={shade(base, 0.45)} strokeWidth={fibW} opacity={fibOp} strokeLinecap="round" />);
    }
    // tissue: elongated cell flecks aligned with the fibres (lighter and darker), seeded and fixed to the sheet
    const nfl = lenPx > 260 ? 70 : 0;
    for (let k = 0; k < nfl; k++) {
      const hs = Math.sin(k * 91.7) * 43758.5;
      const r1 = hs - Math.floor(hs), r2 = (hs * 7.13) % 1, r3 = (hs * 3.77) % 1;
      const sf = MUS0 + 0.04 + (MUS1 - MUS0 - 0.08) * Math.abs(r1);
      const vf = musTop(sf) * 0.88 + (musBot(sf) * 0.88 - musTop(sf) * 0.88) * Math.abs(r2);
      const c0 = P(g.atS(sf, vf, d)), c1 = P(g.atS(sf + 0.018, vf, d));
      const ang = (Math.atan2(c1.y - c0.y, c1.x - c0.x) * 180) / Math.PI;
      const rl = Math.hypot(c1.x - c0.x, c1.y - c0.y) * (0.7 + 0.5 * Math.abs(r3));
      const light = k % 3 === 0;
      fib.push(<ellipse key={`c${k}`} cx={c0.x.toFixed(1)} cy={c0.y.toFixed(1)} rx={rl.toFixed(1)} ry={(rl * 0.26).toFixed(1)} transform={`rotate(${ang.toFixed(1)} ${c0.x.toFixed(1)} ${c0.y.toFixed(1)})`} fill={light ? lit(base, 0.35) : shade(base, 0.3)} opacity={(light ? 0.3 : 0.32) * (front ? 1 : 0.5) * (0.5 + 0.5 * pose.mature)} />);
    }
    const det = look.detail ?? 0;
    if (lenPx > 700 || det > 0) {
      const nb = 34;
      const bOp = Math.min(1, (lenPx - 700) / 600 + det) * 0.32 * (0.3 + 0.7 * pose.mature);
      for (let k = 1; k < nb; k++) {
        const s = MUS0 + ((MUS1 - MUS0) * k) / nb;
        const a = P(g.atS(s, musTop(s) * 0.97, d)), b = P(g.atS(s, musBot(s) * 0.97, d));
        fib.push(<path key={`b${k}`} d={`M${P2(a)}L${P2(b)}`} stroke={shade(base, 0.3)} strokeWidth={fibW * 0.8} opacity={bOp} />);
      }
    }
    // sheen: a lighter band along the upper third
    const sheen = sRange(MUS0 + 0.04, MUS1 - 0.05);
    const shA = sheen.map((s) => P(g.atS(s, musTop(s) * 0.78, d)));
    const shB = sheen.map((s) => P(g.atS(s, musTop(s) * 0.55, d))).reverse();
    fib.push(<path key="sh" d={pathOf([[...shA, ...shB]])} fill={lit(base, 0.55)} opacity={(front ? 0.28 : 0.1) * (0.4 + 0.6 * act + 0.3)} />);
    if (wave >= 0 && wave <= 1) {
      const sw = MUS0 + wave * (MUS1 - MUS0);
      const w0 = Math.max(MUS0, sw - 0.05), w1 = Math.min(MUS1, sw + 0.05);
      if (w1 > w0 + 0.005) {
        const wl = [...sRange(w0, w1).map((s) => P(g.atS(s, musTop(s), d))), ...sRange(w0, w1).map((s) => P(g.atS(s, musBot(s), d))).reverse()];
        fib.push(<path key="wv" d={pathOf([wl])} fill="#FFE3D6" opacity={0.7 * Math.sin(Math.PI * Math.min(1, wave * 1.1))} />);
      }
    }
    const op = mOp * bodyOp * (xr > 0 ? 1 - 0.15 * xr : 1);
    regions.push({key: `mus${side}`, pts: [loop], z: proj(B, pm).z - 0.2, front, fill: col, op, ink: true, grad: [gt, gb, lit(col, 0.12), shade(col, 0.2)], extra: <g opacity={op}>{fib}</g>});
    // the sheet's own edges (seen from above or below)
    for (const up of [true, false]) {
      const vf = up ? musTop : musBot;
      const A0 = ss.map((s) => P(g.atS(s, vf(s), side * hcT)));
      const A1 = ss.map((s) => P(g.atS(s, vf(s), d))).reverse();
      const sm = (MUS0 + MUS1) / 2;
      const pe = g.atS(sm, vf(sm), side * (hcT + hm / 2));
      const ne: V3 = up ? [0, -1, 0] : [0, 1, 0];
      const fe = facing(ne, pe);
      if (fe < 0.05) continue;
      // sarcomere bands across the edge strip (they crowd on the shortened side and open on the stretched one)
      const bands: React.ReactNode[] = [];
      if (fe > 0.4) {
        const nb = 26;
        for (let k = 1; k < nb; k++) {
          const s = MUS0 + 0.03 + ((MUS1 - MUS0 - 0.06) * k) / nb;
          bands.push(<path key={k} d={`M${P2(P(g.atS(s, vf(s), side * (hcT + 0.15 * hm))))}L${P2(P(g.atS(s, vf(s), side * (hcT + 0.9 * hm))))}`} stroke={shade(base, 0.42)} strokeWidth={Math.max(0.8, wInk * 0.5)} opacity={0.55 * Math.min(1, (fe - 0.4) * 3)} />);
        }
        if (wave >= 0 && wave <= 1) {
          const sw = MUS0 + wave * (MUS1 - MUS0);
          const w0 = Math.max(MUS0, sw - 0.075), w1 = Math.min(MUS1, sw + 0.075);
          if (w1 > w0 + 0.005) {
            const wl = [...sRange(w0, w1).map((s) => P(g.atS(s, vf(s), side * hcT))), ...sRange(w0, w1).map((s) => P(g.atS(s, vf(s), d))).reverse()];
            bands.push(<path key="wv" d={pathOf([wl])} fill="#FFE3D6" opacity={0.85 * Math.sin(Math.PI * Math.min(1, wave * 1.1))} />);
          }
        }
      }
      regions.push({key: `me${side}${up}`, pts: [[...A0, ...A1]], z: proj(B, pe).z, front: true, fill: mix(shade(base, 0.3), base, bright(ne)), op: mOp * bodyOp, ink: true, extra: <g>{bands}</g>});
    }
  };
  muscle(1);
  muscle(-1);

  // ---------------------------------------------------------------- G-nodes
  if (look.gnode !== false && mOp > 0.01) {
    for (const side of [1, -1] as const) {
      const d = side * (hcT + 0.6 * pose.TK);
      const i = SS.findIndex((s) => s >= GNODE.s);
      const n = g.nA(i).map((x) => x * side) as V3;
      const pc = g.atS(GNODE.s, GNODE.v * L, d);
      const fc = facing(n, pc);
      if (fc < 0.05 && xr < 0.05) continue;
      const loop: V2[] = [];
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        const rr = 1 + 0.13 * Math.sin(3 * a + 0.7) + 0.06 * Math.sin(5 * a);
        loop.push(P(g.atS(GNODE.s + GNODE.r * 0.9 * rr * Math.cos(a), (GNODE.v + GNODE.r * 1.05 * rr * Math.sin(a)) * L, d)));
      }
      // the single exit pathway: a narrow strand to the muscle's front edge
      const bridge: V2[] = [];
      const bw = 0.011;
      const bs = sRange(GNODE.s + GNODE.r * 0.8, MUS0 + 0.012);
      bs.forEach((s) => bridge.push(P(g.atS(s, (GNODE.v - bw) * L, d))));
      [...bs].reverse().forEach((s) => bridge.push(P(g.atS(s, (GNODE.v + bw) * L, d))));
      const base = H(muscleColor(pose, Math.max(pose.actA, pose.actB) * 0.6));
      regions.push({key: `gn${side}`, pts: [loop, bridge], z: proj(B, pc).z - 0.3, front: fc > 0, fill: base, op: mOp * bodyOp, ink: true});
    }
  }

  // ---------------------------------------------------------------- floater fin (clear plastic, in the mid-plane)
  {
    const ss = sRange(0.16, 0.39);
    const base = ss.map((s) => P(g.atS(s, topOf(s) + 1, 0)));
    const top = ss.map((s) => P(g.atS(s, topOf(s) - floatH(s), 0))).reverse();
    const pm = g.atS(0.26, topOf(0.26) - 0.05 * L, 0);
    const edgeOn = Math.abs(facing(g.nA(SS.findIndex((s) => s >= 0.26)), pm));
    const fo = Math.min(1, Math.max(0, (edgeOn - 0.12) / 0.2));
    if (fo > 0.01 && look.only !== 'tail') regions.push({key: 'float', pts: [[...base, ...top]], z: proj(B, pm).z, front: true, fill: H(mix(FLOATER, XRAY, xr)), op: 0.5 * bodyOp * fo, ink: true});
  }

  // ---------------------------------------------------------------- draw
  const back = regions.filter((r) => !r.front).sort((a, b) => b.z - a.z);
  const front = regions.filter((r) => r.front).sort((a, b) => b.z - a.z);
  const inkCol = mix(INK, XRAY, xr * 0.85);
  const draw = (r: Region, isBack: boolean) => {
    const d = pathOf(r.pts);
    const gid = `${id}-${r.key}${isBack ? 'b' : ''}`;
    if (isBack && xr < 0.02 && !r.key.startsWith('gel')) return null;
    const op = isBack ? r.op * (0.35 + 0.65 * xr) : r.op;
    if (op <= 0.003) return null;
    return (
      <g key={gid}>
        {r.grad && (
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={r.grad[0].x.toFixed(1)} y1={r.grad[0].y.toFixed(1)} x2={r.grad[1].x.toFixed(1)} y2={r.grad[1].y.toFixed(1)}>
              <stop offset="0" stopColor={r.grad[2]} />
              <stop offset="1" stopColor={r.grad[3]} />
            </linearGradient>
          </defs>
        )}
        <path d={d} fill={r.grad ? `url(#${gid})` : r.fill} opacity={op} strokeLinejoin="round" />
        {!isBack && r.extra}
        {r.ink && (!isBack || xr > 0.05) && <path d={d} fill="none" stroke={inkCol} strokeWidth={wInk * (isBack ? 0.6 : 1)} strokeLinejoin="round" opacity={isBack ? 0.5 * xr * bodyOp : Math.min(1, 0.25 + op) * (r.key === 'float' ? 0.7 : 1)} />}
      </g>
    );
  };
  return (
    <g>
      {back.map((r) => draw(r, true))}
      {front.map((r) => draw(r, false))}
    </g>
  );
};
