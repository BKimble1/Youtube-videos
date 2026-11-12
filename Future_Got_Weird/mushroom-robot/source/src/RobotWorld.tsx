// World A: the walker on a cutting mat in a lab, drawn from a pinhole projection of one fixed 3D layout every frame,
// so camera moves and the orbit keep consistent geometry, parallax and occlusion.
import React from 'react';
import {V3, v3, clamp, ss, lerp, noise1} from './lib';
import {Cam, camAt, proj, projPoly, projSeg, pxPerCm, toCam, W, H} from './cam3d';
import {C, INK, INK_PX} from './palette';
import {poly, hull, tubePath, offsetLine, fmt, Pt} from './g2';
import {
  pose, legCurve, HUB_R, HUB_H, DOME_R, DISC_R, BOX, boxJolt, TETHER_ANCHOR, smoothCentre, footprints, T_CONTACT,
  pathAt, walked, Pose,
} from './robot';
import {NET, ELECTRODES, glowAt, electrodeFlash} from './mycelium';
import {spikeTrace, uvOn, lampIn, EVENTS_EXT, UV, DUR} from './timing';

const NS = 'non-scaling-stroke' as const;
const ring = (c: V3, r: number, y: number, n = 40): V3[] =>
  Array.from({length: n}, (_, i) => [c[0] + r * Math.cos((i / n) * 2 * Math.PI), y, c[2] + r * Math.sin((i / n) * 2 * Math.PI)] as V3);

// ------------------------------------------------------------------------------------------------ fixed layout
const MAT_C: V3 = [TETHER_ANCHOR[0], 0, TETHER_ANCHOR[2]];
const MAT_W = 84, MAT_D = 66;
/** monitor: behind the walker as seen from the UV framing, so the trace sits above it in frame */
const rayTo = (c: Cam, px: number, py: number, y: number): V3 => {
  // world point on the horizontal plane at height y seen at pixel (px, py)
  const dx = (px - W / 2) / c.fpx, dy = -(py - H / 2) / c.fpx;
  const dir = v3.nrm(v3.add(c.fwd, v3.add(v3.mul(c.right, dx), v3.mul(c.up, dy))));
  const k = (y - c.pos[1]) / dir[1];
  return v3.add(c.pos, v3.mul(dir, k));
};
export const MONITOR = (() => {
  const t = 14.3;
  const c = camAt(t);
  const back = v3.nrm([c.fwd[0], 0, c.fwd[2]]);
  const side = v3.nrm(v3.cross(back, [0, 1, 0]));
  const h = 9.5, w = 15, lift = 2;
  const mid = rayTo(c, 590, 640, lift + h / 2);
  return {base: [mid[0], 0, mid[2]] as V3, n: v3.mul(back, -1), side, w, h, lift};
})();
const BEAKER: {c: V3; r: number; h: number} = {c: [17, 0, -9], r: 3.3, h: 8.5};
const DISHES: {c: V3; r: number} = {c: [-33, 0, 24], r: 4.6};
/** the UV lamp: overhead on a boom, aimed at the walker's dome during the UV beat */
export const LAMP = (() => {
  const p = smoothCentre(14.3);
  const c = camAt(13.4);
  // the lamp head hangs at the top of the UV framing, about the walker's depth
  const d = toCam(c, p)[2];
  const dx = (420 - W / 2) / c.fpx, dy = -(300 - H / 2) / c.fpx;
  const dir = v3.add(c.fwd, v3.add(v3.mul(c.right, dx), v3.mul(c.up, dy)));
  const head: V3 = v3.add(c.pos, v3.mul(dir, d));
  const aim: V3 = [p[0], 0, p[2]];
  return {head, aim, spotR: 15};
})();

// ------------------------------------------------------------------------------------------------ small parts
const Shape: React.FC<{d: string; fill: string; ink?: number; op?: number; stroke?: string}> = ({d, fill, ink = INK_PX, op = 1, stroke = INK}) =>
  <path d={d} fill={fill} stroke={ink ? stroke : 'none'} strokeWidth={ink} strokeLinejoin="round" opacity={op} vectorEffect={NS} />;

const Background: React.FC<{c: Cam}> = ({c}) => {
  // lab walls on an octagon around the bench, shelves and warm lights; all far away (soft focus)
  const R = 175, n = 8, out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
    const p0: V3 = [MAT_C[0] + R * Math.cos(a0), -95, MAT_C[2] + R * Math.sin(a0)];
    const p1: V3 = [MAT_C[0] + R * Math.cos(a1), -95, MAT_C[2] + R * Math.sin(a1)];
    const q = projPoly(c, [p0, p1, [p1[0], 160, p1[2]], [p0[0], 160, p0[2]]]);
    if (q.length > 2) out.push(<path key={'w' + i} d={poly(q)} fill={i % 2 ? C.wallTop : '#203A4D'} />);
    // shelves and cabinets on each wall
    for (let s = 0; s < 3; s++) {
      const u0 = 0.12 + s * 0.29, u1 = u0 + 0.22;
      const y0 = s === 1 ? 20 : 8, y1 = y0 + (s === 1 ? 46 : 70);
      const A = v3.lerp(p0, p1, u0), B = v3.lerp(p0, p1, u1);
      const k = 0.985;
      const pa: V3 = [lerp(MAT_C[0], A[0], k), y0, lerp(MAT_C[2], A[2], k)], pb: V3 = [lerp(MAT_C[0], B[0], k), y0, lerp(MAT_C[2], B[2], k)];
      const qq = projPoly(c, [pa, pb, [pb[0], y1, pb[2]], [pa[0], y1, pa[2]]]);
      if (qq.length > 2) out.push(<path key={`s${i}_${s}`} d={poly(qq)} fill={s === 1 ? C.shelf : C.shelfDark} />);
      if (s === 1) for (let r = 1; r < 4; r++) {
        const sg = projSeg(c, [pa[0], y0 + r * 11.5, pa[2]], [pb[0], y0 + r * 11.5, pb[2]]);
        if (sg) out.push(<path key={`r${i}_${r}`} d={poly(sg, false)} stroke="#4C7387" strokeWidth={5} fill="none" />);
      }
    }
    // warm lights high on the wall
    const L: V3 = [MAT_C[0] + R * 0.97 * Math.cos(a0 + 0.35), 118, MAT_C[2] + R * 0.97 * Math.sin(a0 + 0.35)];
    const pl = proj(c, L);
    if (pl[2] > 1) out.push(<circle key={'l' + i} cx={pl[0]} cy={pl[1]} r={clamp(2600 / pl[2], 8, 60)} fill={C.lampWarm} opacity={0.5} />);
  }
  return <g filter="url(#dof)">{out}</g>;
};

const Bench: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const out: React.ReactNode[] = [];
  const S = 130;
  const b = projPoly(c, [[MAT_C[0] - S, 0, MAT_C[2] - S], [MAT_C[0] + S, 0, MAT_C[2] - S], [MAT_C[0] + S, 0, MAT_C[2] + S], [MAT_C[0] - S, 0, MAT_C[2] + S]]);
  out.push(<path key="bench" d={poly(b)} fill={C.bench} />);
  const hw = MAT_W / 2, hd = MAT_D / 2;
  const m = projPoly(c, [[MAT_C[0] - hw, 0.01, MAT_C[2] - hd], [MAT_C[0] + hw, 0.01, MAT_C[2] - hd], [MAT_C[0] + hw, 0.01, MAT_C[2] + hd], [MAT_C[0] - hw, 0.01, MAT_C[2] + hd]]);
  out.push(<path key="mat" d={poly(m)} fill={C.mat} stroke={INK} strokeWidth={2} vectorEffect={NS} />);
  // grid: 2 cm minor, 10 cm major; lines fade when they get denser than ~6 px
  let minor = '', major = '';
  for (let g = -hw; g <= hw + 0.01; g += 2) {
    const s = projSeg(c, [MAT_C[0] + g, 0.02, MAT_C[2] - hd], [MAT_C[0] + g, 0.02, MAT_C[2] + hd]);
    if (s) { if (Math.abs(g % 10) < 0.01) major += poly(s, false); else minor += poly(s, false); }
  }
  for (let g = -hd; g <= hd + 0.01; g += 2) {
    const s = projSeg(c, [MAT_C[0] - hw, 0.02, MAT_C[2] + g], [MAT_C[0] + hw, 0.02, MAT_C[2] + g]);
    if (s) { if (Math.abs((g + hd) % 10) < 0.01) major += poly(s, false); else minor += poly(s, false); }
  }
  const dens = pxPerCm(c, c.target) * 2;
  out.push(<path key="minor" d={minor} stroke={C.matLine} strokeWidth={1.2} opacity={0.55 * clamp((dens - 5) / 14)} fill="none" />);
  out.push(<path key="major" d={major} stroke={C.matLine5} strokeWidth={2} opacity={0.7} fill="none" />);
  // UV pool on the mat
  const uv = uvOn(t);
  if (uv > 0.01) {
    const pool = projPoly(c, ring(LAMP.aim, LAMP.spotR, 0.03, 48));
    out.push(<path key="uvpool" d={poly(pool)} fill={C.uv} opacity={0.32 * uv} filter="url(#soft)" />);
  }
  return <g>{out}</g>;
};

// ------------------------------------------------------------------------------------------------ props
const boxFaces = (c: Cam, t: number) => {
  const j = boxJolt(t);
  const n = BOX.n, lat: V3 = [-n[2], 0, n[0]];
  const cc = v3.add(BOX.c, v3.mul(n, 0.35 * j));
  const corner = (a: number, b: number, y: number): V3 => v3.add(cc, v3.add(v3.mul(lat, (a * BOX.w) / 2), v3.add(v3.mul(n, (b * BOX.d) / 2), [0, y, 0])));
  const hb = BOX.h - 1.0;
  const faces: {ps: V3[]; nrm: V3; fill: string}[] = [
    {ps: [corner(-1, -1, 0), corner(1, -1, 0), corner(1, -1, hb), corner(-1, -1, hb)], nrm: v3.mul(n, -1), fill: C.box},
    {ps: [corner(-1, 1, 0), corner(1, 1, 0), corner(1, 1, hb), corner(-1, 1, hb)], nrm: n, fill: C.boxDark},
    {ps: [corner(-1, -1, 0), corner(-1, 1, 0), corner(-1, 1, hb), corner(-1, -1, hb)], nrm: v3.mul(lat, -1), fill: C.boxDark},
    {ps: [corner(1, -1, 0), corner(1, 1, 0), corner(1, 1, hb), corner(1, -1, hb)], nrm: lat, fill: C.box},
  ];
  const out: React.ReactNode[] = [];
  // shadow
  const sh = projPoly(c, [corner(-1.08, -1.1, 0.02), corner(1.12, -1.1, 0.02), corner(1.12, 1.14, 0.02), corner(-1.08, 1.14, 0.02)]);
  out.push(<path key="bsh" d={poly(sh)} fill={C.shadow} filter="url(#soft)" />);
  faces.forEach((f, i) => {
    const mid = v3.mul(f.ps.reduce((a, b) => v3.add(a, b), [0, 0, 0] as V3), 0.25);
    if (v3.dot(f.nrm, v3.sub(c.pos, mid)) <= 0) return;
    out.push(<Shape key={'bf' + i} d={poly(projPoly(c, f.ps))} fill={f.fill} />);
  });
  // rack plate and the tips
  const top = projPoly(c, [corner(-1, -1, hb), corner(1, -1, hb), corner(1, 1, hb), corner(-1, 1, hb)]);
  out.push(<Shape key="top" d={poly(top)} fill={C.boxLight} />);
  const tips: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++) for (let q = 0; q < 12; q++) {
    const a = -1 + (2 * (q + 0.5)) / 12, b = -1 + (2 * (r + 0.5)) / 8;
    const jig = 0.18 * j * Math.sin(q * 1.7 + r * 2.3);
    const base = corner(a * 0.92, b * 0.9, hb);
    const tip = v3.add(base, [0, 1.6 + jig, 0]);
    const pb = proj(c, base), pt = proj(c, tip);
    const rr = 0.3 * pxPerCm(c, base);
    // a pipette tip: a narrow cone, wide end down in the rack
    tips.push(<path key={`t${r}_${q}`} d={`M${fmt(pb[0] - rr)} ${fmt(pb[1])}L${fmt(pt[0])} ${fmt(pt[1])}L${fmt(pb[0] + rr)} ${fmt(pb[1])}Z`} fill={C.tip} stroke={C.tipDark} strokeWidth={1} opacity={0.9} />);
  }
  out.push(<g key="tips">{tips}</g>);
  return out;
};

const Beaker: React.FC<{c: Cam}> = ({c}) => {
  const {c: b, r, h} = BEAKER;
  const bot = ring(b, r, 0, 32).map((p) => proj(c, p)), top = ring(b, r, h, 32).map((p) => proj(c, p));
  const lq = ring(b, r * 0.96, h * 0.52, 32).map((p) => proj(c, p));
  const lb = ring(b, r * 0.96, 0.15, 32).map((p) => proj(c, p));
  return (
    <g>
      <path d={poly(projPoly(c, ring([b[0] + 1.2, 0.02, b[2] + 0.8], r * 1.15, 0.02, 24)))} fill={C.shadow} filter="url(#soft)" />
      <path d={poly(hull([...lb, ...lq]))} fill={C.liquid} opacity={0.85} />
      <path d={poly(lq)} fill="#F7C18A" opacity={0.9} />
      <path d={poly(hull([...bot, ...top]))} fill={C.beaker} opacity={0.28} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      <path d={poly(top)} fill="none" stroke={INK} strokeWidth={1.8} opacity={0.8} />
    </g>
  );
};

const Dishes: React.FC<{c: Cam}> = ({c}) => {
  const out: React.ReactNode[] = [];
  out.push(<path key="sh" d={poly(projPoly(c, ring([DISHES.c[0] + 1, 0.02, DISHES.c[2] + 0.8], DISHES.r * 1.1, 0.02, 24)))} fill={C.shadow} filter="url(#soft)" />);
  for (let k = 0; k < 3; k++) {
    const y0 = k * 1.35, y1 = y0 + 1.25;
    const a = ring([DISHES.c[0] + k * 0.25, 0, DISHES.c[2] - k * 0.2], DISHES.r, y0, 32).map((p) => proj(c, p));
    const b = ring([DISHES.c[0] + k * 0.25, 0, DISHES.c[2] - k * 0.2], DISHES.r, y1, 32).map((p) => proj(c, p));
    out.push(<path key={'d' + k} d={poly(hull([...a, ...b]))} fill="#EAF4F7" opacity={0.75} stroke={INK} strokeWidth={2.2} vectorEffect={NS} />);
    out.push(<path key={'t' + k} d={poly(b)} fill="#F4FAFB" opacity={0.6} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />);
  }
  return <g>{out}</g>;
};

const Monitor: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const M = MONITOR;
  const up: V3 = [0, 1, 0];
  const at = (u: number, v: number, inset = 0): V3 => v3.add(M.base, v3.add(v3.mul(M.side, (u - 0.5) * (M.w - inset)), [0, M.lift + v * (M.h - inset) + inset / 2, 0]));
  const facing = v3.dot(M.n, v3.sub(c.pos, M.base)) > 0;
  const out: React.ReactNode[] = [];
  // stand
  const s0 = proj(c, v3.add(M.base, [0, 0, 0])), s1 = proj(c, v3.add(M.base, [0, M.lift, 0]));
  out.push(<path key="st" d={poly([s0, s1], false)} stroke={INK} strokeWidth={Math.max(4, 1.6 * pxPerCm(c, M.base))} />);
  const foot = projPoly(c, [v3.add(M.base, v3.add(v3.mul(M.side, -5), v3.mul(M.n, -3))), v3.add(M.base, v3.add(v3.mul(M.side, 5), v3.mul(M.n, -3))), v3.add(M.base, v3.add(v3.mul(M.side, 5), v3.mul(M.n, 3))), v3.add(M.base, v3.add(v3.mul(M.side, -5), v3.mul(M.n, 3)))]);
  out.push(<Shape key="ft" d={poly(foot)} fill={C.monitor} />);
  out.push(<Shape key="fr" d={poly(projPoly(c, [at(0, 0), at(1, 0), at(1, 1), at(0, 1)]))} fill={C.monitor} />);
  if (!facing) return <g>{out}</g>;
  const scr = projPoly(c, [at(0, 0, 2), at(1, 0, 2), at(1, 1, 2), at(0, 1, 2)]);
  out.push(<path key="sc" d={poly(scr)} fill={C.screen} />);
  // grid and the live trace: the last 5 s of the electrode signal (the same spikes that drive the legs)
  let g = '';
  for (let k = 1; k < 5; k++) g += poly([proj(c, at(k / 5, 0.06, 2)), proj(c, at(k / 5, 0.94, 2))], false);
  g += poly([proj(c, at(0.03, 0.42, 2)), proj(c, at(0.97, 0.42, 2))], false);
  out.push(<path key="g" d={g} stroke={C.grid} strokeWidth={1.5} fill="none" />);
  const N = 140, span = 5;
  const tr: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const tt = t - span + (k / N) * span;
    const v = spikeTrace(tt) + 0.05 * noise1(tt * 38, 3) + 0.03 * noise1(tt * 90, 7);
    tr.push(proj(c, at(0.04 + 0.92 * (k / N), 0.42 + clamp(v * 0.22, -0.3, 0.52), 2)));
  }
  out.push(<path key="trg" d={poly(tr, false)} stroke={C.trace} strokeWidth={7} opacity={0.25} fill="none" strokeLinejoin="round" />);
  out.push(<path key="tr" d={poly(tr, false)} stroke={C.trace} strokeWidth={2.6} fill="none" strokeLinejoin="round" />);
  // UV period marked under the trace (violet band), so the change is read against the lamp being on
  const uvSeg: Pt[] = [];
  for (let k = 0; k <= N; k++) { const tt = t - span + (k / N) * span; if (uvOn(tt) > 0.5) uvSeg.push(proj(c, at(0.04 + 0.92 * (k / N), 0.08, 2))); }
  if (uvSeg.length > 1) out.push(<path key="uvb" d={poly(uvSeg, false)} stroke={C.uv} strokeWidth={Math.max(3, 0.7 * pxPerCm(c, M.base))} fill="none" />);
  // tiny diegetic label
  const lp = proj(c, at(0.05, 0.86, 2));
  const fs = 0.95 * pxPerCm(c, M.base);
  out.push(<text key="lb" x={lp[0]} y={lp[1]} fill="#8FB7C7" fontSize={fs} fontFamily="JetBrains Mono" opacity={clamp((fs - 7) / 4)}>mycelium signal</text>);
  if (uvOn(t) > 0.5) {
    const up2 = proj(c, at(0.83, 0.86, 2));
    out.push(<text key="uvl" x={up2[0]} y={up2[1]} fill={C.uvLight} fontSize={fs} fontFamily="JetBrains Mono" fontWeight={700}>UV</text>);
  }
  void up;
  return <g>{out}</g>;
};

const Lamp: React.FC<{c: Cam; t: number; part: 'body' | 'beam'}> = ({c, t, part}) => {
  const k = lampIn(t);
  if (k <= 0.001) return null;
  const head = v3.add(LAMP.head, [0, 30 * (1 - k), 0]);
  const dir = v3.nrm(v3.sub(LAMP.aim, head));
  const uv = uvOn(t);
  if (part === 'beam') {
    if (uv < 0.01) return null;
    // a cone from the emitter face to the spot
    const a = v3.nrm(v3.cross(dir, [0, 0, 1])), b = v3.cross(dir, a);
    const em = v3.add(head, v3.mul(dir, 1.6));
    const pts: [number, number][] = [];
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * 2 * Math.PI;
      pts.push(proj(c, v3.add(em, v3.add(v3.mul(a, 2.2 * Math.cos(ang)), v3.mul(b, 2.2 * Math.sin(ang))))) as unknown as [number, number]);
      pts.push(proj(c, [LAMP.aim[0] + LAMP.spotR * Math.cos(ang), 0, LAMP.aim[2] + LAMP.spotR * Math.sin(ang)]) as unknown as [number, number]);
    }
    const flick = 1 + 0.04 * noise1(t * 30, 2);
    return <path d={poly(hull(pts))} fill="url(#uvBeam)" opacity={0.42 * uv * flick} style={{mixBlendMode: 'screen'}} />;
  }
  const a = v3.nrm(v3.cross(dir, [0, 0, 1])), b = v3.cross(dir, a);
  const r = 1.9, L = 4.0;
  const back = v3.add(head, v3.mul(dir, -L / 2)), front = v3.add(head, v3.mul(dir, L / 2));
  const rimF = Array.from({length: 28}, (_, i) => { const g = (i / 28) * 2 * Math.PI; return proj(c, v3.add(front, v3.add(v3.mul(a, r * Math.cos(g)), v3.mul(b, r * Math.sin(g))))); });
  const rimB = Array.from({length: 28}, (_, i) => { const g = (i / 28) * 2 * Math.PI; return proj(c, v3.add(back, v3.add(v3.mul(a, r * 0.85 * Math.cos(g)), v3.mul(b, r * 0.85 * Math.sin(g))))); });
  const arm0 = proj(c, back), arm1 = proj(c, v3.add(back, [-4, 60, 6]));
  const faceVisible = v3.dot(dir, v3.sub(c.pos, front)) > 0;
  return (
    <g>
      <path d={poly([arm0, arm1], false)} stroke={INK} strokeWidth={Math.max(5, 1.1 * pxPerCm(c, back))} strokeLinecap="round" />
      <path d={poly([arm0, arm1], false)} stroke="#5E7584" strokeWidth={Math.max(2, 0.6 * pxPerCm(c, back))} strokeLinecap="round" />
      <Shape d={poly(hull([...rimF, ...rimB]))} fill="#34444F" />
      {faceVisible && <path d={poly(rimF)} fill={uv > 0.5 ? C.uvLight : '#4A3D6E'} stroke={INK} strokeWidth={2} vectorEffect={NS} />}
      {faceVisible && uv > 0.01 && <path d={poly(rimF)} fill={C.uv} opacity={0.8 * uv} filter="url(#glow)" />}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the walker
const discToWorld = (P: Pose, y: number) => {
  const f: V3 = [Math.cos(P.th), 0, Math.sin(P.th)], s: V3 = [-Math.sin(P.th), 0, Math.cos(P.th)];
  return (dx: number, dz: number): V3 => [P.x + dx * f[0] + dz * s[0], y, P.z + dx * f[2] + dz * s[2]];
};
export const discAffine = (t: number) => {
  // the screen-space affine of the scaffold disc (for the match into the macro shot)
  const c = camAt(t), P = pose(t);
  const y = P.y + HUB_H / 2 + 0.03;
  const m = discToWorld(P, y);
  const o = proj(c, m(0, 0)), ex = proj(c, m(1, 0)), ez = proj(c, m(0, 1));
  return {o: [o[0], o[1]], ex: [ex[0] - o[0], ex[1] - o[1]], ez: [ez[0] - o[0], ez[1] - o[1]]};
};

const Leg: React.FC<{c: Cam; t: number; P: Pose; i: number; back?: boolean}> = ({c, t, P, i, back}) => {
  const L = legCurve(t, i, P);
  // the leg starts where it leaves the hub wall (its root inside the hub is never drawn)
  let k0 = 0;
  while (!back && k0 < L.pts.length - 3 && Math.hypot(L.pts[k0][0] - P.x, L.pts[k0][2] - P.z) < HUB_R * 0.98) k0++;
  const pts3 = L.pts.slice(k0), rs = L.rs.slice(k0);
  const sp = pts3.map((p) => proj(c, p));
  const hw = rs.map((r, k) => r * pxPerCm(c, pts3[k]));
  const d = tubePath(sp, hw, !!back, true);
  const sock = (() => {
    const a = sp[0], b = sp[1];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const w = hw[0] * 1.08;
    return `M${fmt(a[0] - ty * w)} ${fmt(a[1] + tx * w)}L${fmt(a[0] + ty * w)} ${fmt(a[1] - tx * w)}`;
  })();
  // ribs of the pneumatic chambers
  let ribs = '';
  for (let k = 3; k < sp.length - 2; k += 2) {
    const a = sp[k - 1], b = sp[k + 1];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const w = hw[k] * 0.86;
    ribs += `M${fmt(sp[k][0] - ty * w)} ${fmt(sp[k][1] + tx * w)}Q${fmt(sp[k][0] + tx * w * 0.35)} ${fmt(sp[k][1] + ty * w * 0.35)} ${fmt(sp[k][0] + ty * w)} ${fmt(sp[k][1] - tx * w)}`;
  }
  // light side: the offset toward the upper left in screen space
  const side = (sp[sp.length - 1][0] - sp[0][0]) >= 0 ? 1 : -1;
  const hi = offsetLine(sp, hw.map((h) => h * 0.45 * side));
  const lo = offsetLine(sp, hw.map((h) => -h * 0.55 * side));
  const inf = L.st.inflate;
  const chEnd = Math.max(2, Math.round(sp.length * clamp(inf * 1.2)));
  const pulse = inf > 0.05 ? sp.slice(0, chEnd) : [];
  const gUV = uvOn(t);
  const fp = proj(c, [L.pts[L.pts.length - 1][0], 0.02, L.pts[L.pts.length - 1][2]]);
  const hk = Math.min(6, hw.length - 1);
  return (
    <g>
      <path d={d} fill={C.leg} />
      <path d={poly(lo, false)} stroke={C.legShade} strokeWidth={hw[hk] * 0.7} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d={poly(hi, false)} stroke="#FFFFFF" strokeWidth={hw[hk] * 0.35} fill="none" strokeLinecap="round" opacity={0.75} />
      {pulse.length > 1 && <path d={poly(pulse, false)} stroke={C.legChannel} strokeWidth={hw[Math.min(4, hw.length - 1)] * 0.55 * (0.6 + 0.4 * inf)} fill="none" strokeLinecap="round" opacity={0.9} />}
      <path d={ribs} stroke={C.legRib} strokeWidth={Math.max(1.2, hw[Math.min(8, hw.length - 1)] * 0.12)} fill="none" />
      {gUV > 0.01 && <path d={d} fill={C.uv} opacity={0.12 * gUV} />}
      <path d={d} fill="none" stroke={INK} strokeWidth={INK_PX} strokeLinejoin="round" vectorEffect={NS} />
      {!back && <path d={sock} stroke={C.hubBand} strokeWidth={Math.max(3, hw[0] * 0.38)} strokeLinecap="round" />}
      {L.st.lift < 0.05 && <ellipse cx={fp[0]} cy={fp[1]} rx={hw[hw.length - 1] * 0.9} ry={hw[hw.length - 1] * 0.25} fill={C.shadow} opacity={0.5} />}
    </g>
  );
};

const Mycelium: React.FC<{c: Cam; t: number; P: Pose; y: number}> = ({c, t, P, y}) => {
  const m = discToWorld(P, y);
  let main = '', fine = '', glow = '';
  for (const h of NET) {
    const pts = h.pts.map((p) => proj(c, m(p[0], p[1])));
    const s = poly(pts, false);
    if (h.tier === 2) fine += s; else main += s;
    // glowing stretches (spike waves)
    let run: Pt[] = [];
    for (let k = 0; k < h.pts.length; k += 1) {
      if (glowAt(h.pts[k], t) > 0.25) run.push(pts[k]);
      else { if (run.length > 1) glow += poly(run, false); run = []; }
    }
    if (run.length > 1) glow += poly(run, false);
  }
  const s = pxPerCm(c, m(0, 0));
  const uv = uvOn(t);
  const col = uv > 0.01 ? '#E6DCFF' : C.hypha;
  return (
    <g>
      <path d={fine} stroke={col} strokeWidth={clamp(s * 0.006, 0.6, 2)} fill="none" opacity={0.6} />
      <path d={main} stroke={C.hyphaShade} strokeWidth={clamp(s * 0.016, 1.2, 5)} fill="none" opacity={0.7} transform="translate(0.8 1)" />
      <path d={main} stroke={col} strokeWidth={clamp(s * 0.012, 0.9, 4)} fill="none" />
      {glow && <path d={glow} stroke={C.spike} strokeWidth={clamp(s * 0.03, 2.5, 9)} fill="none" filter="url(#glow)" strokeLinecap="round" />}
      {glow && <path d={glow} stroke={C.spikeCore} strokeWidth={clamp(s * 0.012, 1, 3)} fill="none" strokeLinecap="round" />}
    </g>
  );
};

const Walker: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const P = pose(t);
  const centre: V3 = [P.x, P.y, P.z];
  const zc = toCam(c, centre)[2];
  const yTop = P.y + HUB_H / 2, yBot = P.y - HUB_H / 2;
  const legs = [0, 1, 2, 3, 4].map((i) => {
    const a = P.th + (i * 2 * Math.PI) / 5;
    const hip: V3 = [P.x + HUB_R * Math.cos(a), P.y, P.z + HUB_R * Math.sin(a)];
    return {i, z: toCam(c, hip)[2]};
  });
  const back = legs.filter((l) => l.z >= zc).sort((a, b) => b.z - a.z);
  const front = legs.filter((l) => l.z < zc).sort((a, b) => b.z - a.z);
  const topR = ring(centre, HUB_R, yTop, 48), botR = ring(centre, HUB_R, yBot, 48);
  const topS = topR.map((p) => proj(c, p)), botS = botR.map((p) => proj(c, p));
  const side = hull([...topS, ...botS]);
  const ys = side.map((p) => p[1]);
  const xs = side.map((p) => p[0]);
  // electronics LEDs on the band light when a spike is detected
  let led = 0;
  for (const e of EVENTS_EXT) { const dt = t - e.spike - 0.03; if (dt > 0 && dt < 0.35) led = Math.max(led, e.amp * Math.exp(-dt * 8)); }
  const band = ring(centre, HUB_R * 1.002, P.y - 0.05, 48);
  const bandVis = band.filter((p) => v3.dot(v3.sub(p, centre), v3.sub(c.pos, p)) > -0.0).map((p) => proj(c, p));
  // dome: hemisphere samples
  const dpts: V3[] = [];
  for (let la = 0; la <= 6; la++) for (let lo = 0; lo < 32; lo++) {
    const phi = (la / 6) * (Math.PI / 2), th = (lo / 32) * 2 * Math.PI;
    dpts.push([P.x + DOME_R * Math.cos(phi) * Math.cos(th), yTop + DOME_R * 0.78 * Math.sin(phi), P.z + DOME_R * Math.cos(phi) * Math.sin(th)]);
  }
  const domeS = hull(dpts.map((p) => proj(c, p)));
  const mesh = (front: boolean) => {
    let d = '';
    const vis = (p: V3) => {
      const nrm = v3.nrm([p[0] - P.x, (p[1] - yTop) / 0.78, p[2] - P.z]);
      return v3.dot(nrm, v3.sub(c.pos, p)) > 0;
    };
    for (let lo = 0; lo < 12; lo++) {
      const th = (lo / 12) * 2 * Math.PI + P.th;
      let run: Pt[] = [];
      for (let la = 0; la <= 12; la++) {
        const phi = (la / 12) * (Math.PI / 2);
        const p: V3 = [P.x + DOME_R * Math.cos(phi) * Math.cos(th), yTop + DOME_R * 0.78 * Math.sin(phi), P.z + DOME_R * Math.cos(phi) * Math.sin(th)];
        if (vis(p) === front) run.push(proj(c, p)); else { if (run.length > 1) d += poly(run, false); run = []; }
      }
      if (run.length > 1) d += poly(run, false);
    }
    for (const la of [0.3, 0.62, 0.86]) {
      const phi = la * (Math.PI / 2);
      let run: Pt[] = [];
      for (let lo = 0; lo <= 40; lo++) {
        const th = (lo / 40) * 2 * Math.PI;
        const p: V3 = [P.x + DOME_R * Math.cos(phi) * Math.cos(th), yTop + DOME_R * 0.78 * Math.sin(phi), P.z + DOME_R * Math.cos(phi) * Math.sin(th)];
        if (vis(p) === front) run.push(proj(c, p)); else { if (run.length > 1) d += poly(run, false); run = []; }
      }
      if (run.length > 1) d += poly(run, false);
    }
    return d;
  };
  const m = discToWorld(P, yTop + 0.03);
  const disc = Array.from({length: 48}, (_, k) => proj(c, m(DISC_R * Math.cos((k / 48) * 2 * Math.PI), DISC_R * Math.sin((k / 48) * 2 * Math.PI))));
  const s = pxPerCm(c, centre);
  const uv = uvOn(t);
  // shadow under the walker (softer and larger when it is higher)
  const shR = ring([P.x + 0.6, 0.02, P.z + 0.5], HUB_R * 1.25, 0.02, 32);
  // tether: the air lines and the electrode cable leave the back of the hub up to the overhead boom
  const rear: V3 = [P.x - Math.cos(P.th) * HUB_R * 0.7, yTop + 0.1, P.z - Math.sin(P.th) * HUB_R * 0.7];
  const tpts: V3[] = [];
  for (let k = 0; k <= 30; k++) {
    const u = k / 30;
    const mid: V3 = v3.lerp(rear, TETHER_ANCHOR, 0.5);
    const ctl: V3 = [mid[0] - Math.cos(P.th) * 9, rear[1] + 6, mid[2] - Math.sin(P.th) * 9];
    const a = v3.lerp(rear, ctl, u), b = v3.lerp(ctl, TETHER_ANCHOR, u);
    tpts.push(v3.lerp(a, b, u));
  }
  let tether = '';
  for (let k = 0; k < tpts.length - 1; k++) { const sg = projSeg(c, tpts[k], tpts[k + 1]); if (sg) tether += poly(sg, false); }
  const tw = 0.3 * pxPerCm(c, rear);
  // electrode flashes
  const el = ELECTRODES.map((e, k) => {
    const base = m(e[0], e[1]), tip = v3.add(base, [0, 0.32, 0]);
    const pb = proj(c, base), pt = proj(c, tip);
    const r = 0.11 * s;
    const fl = electrodeFlash(t, k);
    return (
      <g key={'e' + k}>
        <path d={poly([pb, pt], false)} stroke={C.goldDark} strokeWidth={r * 2.3} strokeLinecap="round" />
        <path d={poly([pb, pt], false)} stroke={C.gold} strokeWidth={r * 1.6} strokeLinecap="round" />
        <circle cx={pt[0]} cy={pt[1]} r={r * 0.8} fill={C.goldLight} />
        {fl > 0.02 && <circle cx={pt[0]} cy={pt[1]} r={r * (2 + 3 * fl)} fill={C.spike} opacity={clamp(fl)} filter="url(#glow)" />}
      </g>
    );
  });
  return (
    <g>
      <path d={poly(projPoly(c, shR))} fill={C.shadow} opacity={clamp(1.2 - P.y / 6)} filter="url(#soft)" />
      {back.map((l) => <Leg key={l.i} c={c} t={t} P={P} i={l.i} back />)}
      <path d={tether} stroke={INK} strokeWidth={tw * 1.0 + 3} fill="none" strokeLinecap="round" />
      <path d={tether} stroke={C.tube} strokeWidth={tw} fill="none" strokeLinecap="round" />
      <path d={tether} stroke={C.cable} strokeWidth={tw * 0.35} fill="none" strokeLinecap="round" transform={`translate(${fmt(tw * 0.25)} 0)`} />
      <defs>
        <linearGradient id="hubG" gradientUnits="userSpaceOnUse" x1={Math.min(...xs)} y1={Math.min(...ys)} x2={Math.max(...xs)} y2={Math.max(...ys)}>
          <stop offset="0" stopColor={C.hub} /><stop offset="1" stopColor={C.hubShade} />
        </linearGradient>
      </defs>
      <Shape d={poly(side)} fill="url(#hubG)" />
      {bandVis.length > 1 && <path d={poly(bandVis, false)} stroke={C.hubBand} strokeWidth={Math.max(2, 0.32 * s)} fill="none" />}
      {[0, 1, 2, 3, 4].map((k) => {
        const a = P.th + ((k + 0.5) * 2 * Math.PI) / 5;
        const p: V3 = [P.x + HUB_R * 1.01 * Math.cos(a), P.y - 0.05, P.z + HUB_R * 1.01 * Math.sin(a)];
        if (v3.dot(v3.sub(p, centre), v3.sub(c.pos, p)) < 0) return null;
        const q = proj(c, p);
        return <g key={'led' + k}>
          <circle cx={q[0]} cy={q[1]} r={0.12 * s} fill={led > 0.05 ? C.spikeCore : '#4C6573'} />
          {led > 0.05 && <circle cx={q[0]} cy={q[1]} r={0.4 * s} fill={C.hubLed} opacity={led} filter="url(#glow)" />}
        </g>;
      })}
      <Shape d={poly(topS)} fill={C.hub} ink={2} />
      <path d={poly(disc)} fill={C.scaffold} stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <path d={mesh(false)} stroke={C.meshBack} strokeWidth={1.2} fill="none" opacity={0.6} />
      <Mycelium c={c} t={t} P={P} y={yTop + 0.05} />
      {el}
      <path d={poly(domeS)} fill="url(#glassG)" opacity={0.55} />
      {uv > 0.01 && <path d={poly(domeS)} fill={C.uv} opacity={0.38 * uv} />}
      <path d={mesh(true)} stroke={C.mesh} strokeWidth={clamp(s * 0.025, 1, 2.6)} fill="none" opacity={0.85} />
      <path d={poly(domeS)} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      {front.map((l) => <Leg key={l.i} c={c} t={t} P={P} i={l.i} />)}
    </g>
  );
};

const Footprints: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const vis = ss(19.95, 20.5, t) * (1 - ss(21.6, 22.3, t));
  if (vis < 0.01) return null;
  const fps = footprints(t, 14);
  return <g opacity={vis}>{fps.map((f, k) => {
    const pts = projPoly(c, ring([f.p[0], 0.03, f.p[2]], 0.45, 0.03, 12));
    return <path key={k} d={poly(pts)} fill="#D8F2E6" opacity={0.25 + 0.55 * clamp(1 - (t - f.t) / 14)} />;
  })}</g>;
};

export const RobotWorld: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const objs: {z: number; el: React.ReactNode}[] = [];
  const zOf = (p: V3) => toCam(c, p)[2];
  objs.push({z: zOf(v3.add(MONITOR.base, [0, 12, 0])), el: <Monitor key="mon" c={c} t={t} />});
  objs.push({z: zOf(BOX.c), el: <g key="box">{boxFaces(c, t)}</g>});
  objs.push({z: zOf(BEAKER.c), el: <Beaker key="bk" c={c} />});
  const P = pose(t);
  objs.push({z: zOf([P.x, P.y, P.z]), el: <Walker key="wk" c={c} t={t} />});
  objs.push({z: zOf(LAMP.head) - 100, el: <Lamp key="lamp" c={c} t={t} part="body" />});
  objs.sort((a, b) => b.z - a.z);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="dof" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6" /></filter>
        <radialGradient id="glassG" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" /><stop offset="0.35" stopColor={C.glass} stopOpacity="0.18" /><stop offset="1" stopColor="#9CC7DC" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id="uvBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.uvLight} /><stop offset="1" stopColor={C.uv} stopOpacity="0.4" /></linearGradient>
      </defs>
      <rect width={W} height={H} fill={C.wallBot} />
      <Background c={c} />
      <Bench c={c} t={t} />
      <Footprints c={c} t={t} />
      {objs.map((o) => o.el)}
      <Lamp c={c} t={t} part="beam" />
    </svg>
  );
};
export {DUR, UV, T_CONTACT, pathAt, walked};
