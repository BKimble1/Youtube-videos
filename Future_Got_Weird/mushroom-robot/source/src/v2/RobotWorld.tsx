// V2 world A: the lab bench and the walker, drawn every frame from one fixed 3D world through one pinhole camera.
// The walker is the persistent rig in robot.ts: the same hub, dome, five sockets and five fixed-length legs in every
// frame. No text is drawn anywhere.
import React from 'react';
import {V3, v3, clamp, lerp, noise1} from '../lib';
import {Cam, camAt, proj, projPoly, projSeg, pxPerCm, toCam, W, H} from './cam';
import {C, INK, INK_PX} from '../palette';
import {poly, hull, fmt, Pt} from '../g2';
import {pose, legAt, socket, legAngle, HUB_R, HUB_H, DOME_R, DISC_R, TETHER_ANCHOR, PATH_CENTROID, smoothCentre, Pose, Leg} from './robot';
import {NET, ELECTRODES, pulses, routeSlice, electrodeFlash} from './mycelium';
import {uvOn, lampIn, EVENTS_EXT} from './timing';
import {BEAKER} from './props';

const NS = 'non-scaling-stroke' as const;
const ring = (c: V3, r: number, y: number, n = 40): V3[] =>
  Array.from({length: n}, (_, i) => [c[0] + r * Math.cos((i / n) * 2 * Math.PI), y, c[2] + r * Math.sin((i / n) * 2 * Math.PI)] as V3);
const MAT_C: V3 = [PATH_CENTROID[0], 0, PATH_CENTROID[2]];
const MAT_W = 84, MAT_D = 70;

/** the UV lamp rides an overhead arm that keeps it above the walker's culture */
const LAMP_DIR: V3 = (() => { const c = camAt(12.6), p = smoothCentre(12.6); return v3.nrm([c.pos[0] - p[0], 0, c.pos[2] - p[2]]); })();
export const lampHead = (t: number): V3 => {
  const p = smoothCentre(t);
  return v3.add([p[0], 14.5 + 30 * (1 - lampIn(t)), p[2]], v3.mul(LAMP_DIR, -1.0));
};

// ------------------------------------------------------------------------------------------------ environment
const Background: React.FC<{c: Cam}> = ({c}) => {
  const R = 175, n = 8, out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
    const p0: V3 = [MAT_C[0] + R * Math.cos(a0), -95, MAT_C[2] + R * Math.sin(a0)];
    const p1: V3 = [MAT_C[0] + R * Math.cos(a1), -95, MAT_C[2] + R * Math.sin(a1)];
    const q = projPoly(c, [p0, p1, [p1[0], 160, p1[2]], [p0[0], 160, p0[2]]]);
    if (q.length > 2) out.push(<path key={'w' + i} d={poly(q)} fill={i % 2 ? C.wallTop : '#203A4D'} />);
    for (let s = 0; s < 3; s++) {
      const u0 = 0.12 + s * 0.29, u1 = u0 + 0.22;
      const y0 = s === 1 ? 20 : 8, y1 = y0 + (s === 1 ? 46 : 70);
      const A = v3.lerp(p0, p1, u0), B = v3.lerp(p0, p1, u1);
      const pa: V3 = [lerp(MAT_C[0], A[0], 0.985), y0, lerp(MAT_C[2], A[2], 0.985)], pb: V3 = [lerp(MAT_C[0], B[0], 0.985), y0, lerp(MAT_C[2], B[2], 0.985)];
      const qq = projPoly(c, [pa, pb, [pb[0], y1, pb[2]], [pa[0], y1, pa[2]]]);
      if (qq.length > 2) out.push(<path key={`s${i}_${s}`} d={poly(qq)} fill={s === 1 ? C.shelf : C.shelfDark} />);
      if (s === 1) for (let r = 1; r < 4; r++) {
        const sg = projSeg(c, [pa[0], y0 + r * 11.5, pa[2]], [pb[0], y0 + r * 11.5, pb[2]]);
        if (sg) out.push(<path key={`r${i}_${r}`} d={poly(sg, false)} stroke="#4C7387" strokeWidth={5} fill="none" />);
      }
    }
    const L: V3 = [MAT_C[0] + R * 0.97 * Math.cos(a0 + 0.35), 118, MAT_C[2] + R * 0.97 * Math.sin(a0 + 0.35)];
    const pl = proj(c, L);
    if (pl[2] > 1) out.push(<circle key={'l' + i} cx={pl[0]} cy={pl[1]} r={clamp(2600 / pl[2], 8, 60)} fill={C.lampWarm} opacity={0.5} />);
  }
  return <g filter="url(#dof)">{out}</g>;
};

const Bench: React.FC<{c: Cam; t: number; P: Pose}> = ({c, t, P}) => {
  const out: React.ReactNode[] = [];
  const S = 140;
  out.push(<path key="bench" d={poly(projPoly(c, [[MAT_C[0] - S, 0, MAT_C[2] - S], [MAT_C[0] + S, 0, MAT_C[2] - S], [MAT_C[0] + S, 0, MAT_C[2] + S], [MAT_C[0] - S, 0, MAT_C[2] + S]]))} fill={C.bench} />);
  const hw = MAT_W / 2, hd = MAT_D / 2;
  out.push(<path key="mat" d={poly(projPoly(c, [[MAT_C[0] - hw, 0.01, MAT_C[2] - hd], [MAT_C[0] + hw, 0.01, MAT_C[2] - hd], [MAT_C[0] + hw, 0.01, MAT_C[2] + hd], [MAT_C[0] - hw, 0.01, MAT_C[2] + hd]]))} fill={C.mat} stroke={INK} strokeWidth={2} vectorEffect={NS} />);
  let minor = '', major = '';
  for (let g = -hw; g <= hw + 0.01; g += 2) { const s = projSeg(c, [MAT_C[0] + g, 0.02, MAT_C[2] - hd], [MAT_C[0] + g, 0.02, MAT_C[2] + hd]); if (s) { if (Math.abs((g + hw) % 10) < 0.01) major += poly(s, false); else minor += poly(s, false); } }
  for (let g = -hd; g <= hd + 0.01; g += 2) { const s = projSeg(c, [MAT_C[0] - hw, 0.02, MAT_C[2] + g], [MAT_C[0] + hw, 0.02, MAT_C[2] + g]); if (s) { if (Math.abs((g + hd) % 10) < 0.01) major += poly(s, false); else minor += poly(s, false); } }
  const dens = pxPerCm(c, c.target) * 2;
  out.push(<path key="minor" d={minor} stroke={C.matLine} strokeWidth={1.2} opacity={0.5 * clamp((dens - 5) / 14)} fill="none" />);
  out.push(<path key="major" d={major} stroke={C.matLine5} strokeWidth={2} opacity={0.6} fill="none" />);
  const uv = uvOn(t);
  if (uv > 0.01) out.push(<path key="uvpool" d={poly(projPoly(c, ring([P.x, 0, P.z], 7.5, 0.03, 48)))} fill={C.uv} opacity={0.3 * uv} filter="url(#soft)" />);
  return <g>{out}</g>;
};

const Beaker: React.FC<{c: Cam}> = ({c}) => {
  const {c: b, r, h} = BEAKER;
  const bot = ring(b, r, 0, 32).map((p) => proj(c, p)), top = ring(b, r, h, 32).map((p) => proj(c, p));
  const lq = ring(b, r * 0.96, h * 0.52, 32).map((p) => proj(c, p)), lb = ring(b, r * 0.96, 0.15, 32).map((p) => proj(c, p));
  if (toCam(c, b)[2] < 2) return null;
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

const Lamp: React.FC<{c: Cam; t: number; P: Pose; part: 'body' | 'beam'}> = ({c, t, P, part}) => {
  if (lampIn(t) <= 0.001) return null;
  const head = lampHead(t);
  const aim: V3 = [P.x, P.y + HUB_H / 2 + 0.8, P.z];
  const dir = v3.nrm(v3.sub(aim, head));
  const uv = uvOn(t);
  const a = v3.nrm(v3.cross(dir, [0, 0, 1])), b = v3.cross(dir, a);
  if (part === 'beam') {
    if (uv < 0.01) return null;
    const em = v3.add(head, v3.mul(dir, 1.9));
    const pts: [number, number][] = [];
    for (let i = 0; i < 24; i++) {
      const g = (i / 24) * 2 * Math.PI;
      const q1 = proj(c, v3.add(em, v3.add(v3.mul(a, 1.2 * Math.cos(g)), v3.mul(b, 1.2 * Math.sin(g)))));
      const q2 = proj(c, [P.x + 7.5 * Math.cos(g), 0, P.z + 7.5 * Math.sin(g)]);
      pts.push([q1[0], q1[1]], [q2[0], q2[1]]);
    }
    return <path d={poly(hull(pts))} fill="url(#uvBeam)" opacity={0.36 * uv * (1 + 0.04 * noise1(t * 30, 2))} style={{mixBlendMode: 'screen'}} />;
  }
  const r = 1.25, L = 3.0;
  const back = v3.add(head, v3.mul(dir, -L / 2)), front = v3.add(head, v3.mul(dir, L / 2));
  const rim = (o: V3, rr: number) => Array.from({length: 28}, (_, i) => { const g = (i / 28) * 2 * Math.PI; return proj(c, v3.add(o, v3.add(v3.mul(a, rr * Math.cos(g)), v3.mul(b, rr * Math.sin(g))))); });
  const rimF = rim(front, r), rimB = rim(back, r * 0.85);
  const arm0 = proj(c, back), arm1 = proj(c, v3.add(back, [0, 60, 0]));
  const faceVisible = v3.dot(dir, v3.sub(c.pos, front)) > 0;
  return (
    <g>
      <path d={poly([arm0, arm1], false)} stroke={INK} strokeWidth={Math.max(5, 0.9 * pxPerCm(c, back))} strokeLinecap="round" />
      <path d={poly([arm0, arm1], false)} stroke="#5E7584" strokeWidth={Math.max(2, 0.5 * pxPerCm(c, back))} strokeLinecap="round" />
      <path d={poly(hull([...rimF, ...rimB]))} fill="#34444F" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
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
  const c = camAt(t), P = pose(t);
  const m = discToWorld(P, P.y + HUB_H / 2 + 0.03);
  const o = proj(c, m(0, 0)), ex = proj(c, m(1, 0)), ez = proj(c, m(0, 1));
  return {o: [o[0], o[1]], ex: [ex[0] - o[0], ex[1] - o[1]], ez: [ez[0] - o[0], ez[1] - o[1]]};
};

/** one soft leg: overlapping round-capped segments (ink, body, light, gloss), so its outline can never self-intersect */
const LegView: React.FC<{c: Cam; L: Leg}> = ({c, L}) => {
  const sp = L.pts.map((p) => proj(c, p));
  const hw = L.rs.map((r, k) => r * pxPerCm(c, L.pts[k]));
  const n = sp.length;
  const seg = (k: number, w: number, dx: number, dy: number, col: string, op = 1, key = '') =>
    <path key={key + k} d={`M${fmt(sp[k][0] + dx)} ${fmt(sp[k][1] + dy)}L${fmt(sp[k + 1][0] + dx)} ${fmt(sp[k + 1][1] + dy)}`} stroke={col} strokeWidth={w} strokeLinecap="round" opacity={op} />;
  const ink: React.ReactNode[] = [], body: React.ReactNode[] = [], light: React.ReactNode[] = [], gloss: React.ReactNode[] = [], ribs: React.ReactNode[] = [];
  for (let k = 0; k < n - 1; k++) {
    const h = (hw[k] + hw[k + 1]) / 2;
    ink.push(seg(k, 2 * h + 2 * INK_PX, 0, 0, INK, 1, 'i'));
    body.push(seg(k, 2 * h, 0, 0, C.legShade, 1, 'b'));
    light.push(seg(k, 1.5 * h, -0.2 * h, -0.24 * h, C.leg, 1, 'l'));
    gloss.push(seg(k, 0.34 * h, -0.42 * h, -0.48 * h, '#FFFFFF', 0.75, 'g'));
  }
  for (let k = 3; k < n - 2; k += 2) {
    const a = sp[k - 1], b = sp[k + 1];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const w = hw[k] * 0.82;
    ribs.push(<path key={'r' + k} d={`M${fmt(sp[k][0] - ty * w)} ${fmt(sp[k][1] + tx * w)}L${fmt(sp[k][0] + ty * w)} ${fmt(sp[k][1] - tx * w)}`} stroke={C.legRib} strokeWidth={Math.max(1.2, hw[k] * 0.12)} strokeLinecap="round" />);
  }
  const ch = L.foot.swing;
  return (
    <g>
      {ink}{body}{light}
      {ch > 0.03 && <path d={poly(sp, false)} stroke={C.legChannel} strokeWidth={Math.max(2, hw[4] * 0.5)} opacity={0.95 * ch} fill="none" strokeLinecap="round" />}
      {gloss}{ribs}
    </g>
  );
};

const Mycelium: React.FC<{c: Cam; t: number; P: Pose; y: number}> = ({c, t, P, y}) => {
  const m = discToWorld(P, y);
  let main = '', fine = '';
  for (const h of NET) {
    const s = poly(h.pts.map((p) => proj(c, m(p[0], p[1]))), false);
    if (h.tier === 2) fine += s; else main += s;
  }
  const s = pxPerCm(c, m(0, 0));
  const uv = uvOn(t);
  const col = uv > 0.01 ? '#EFE8FF' : C.hypha;
  const comets = pulses(t).map((q, i) => {
    const d = poly(routeSlice(q.r, q.head - q.tail, q.head).map((p) => proj(c, m(p[0], p[1]))), false);
    return <g key={i} opacity={q.k}>
      <path d={d} stroke={C.spike} strokeWidth={clamp(s * 0.05, 2.5, 12)} fill="none" strokeLinecap="round" filter="url(#glow)" />
      <path d={d} stroke={C.spikeCore} strokeWidth={clamp(s * 0.016, 1, 4)} fill="none" strokeLinecap="round" />
    </g>;
  });
  return (
    <g>
      <path d={fine} stroke={col} strokeWidth={clamp(s * 0.006, 0.6, 2)} fill="none" opacity={0.55} />
      <path d={main} stroke={C.hyphaShade} strokeWidth={clamp(s * 0.016, 1.2, 5)} fill="none" opacity={0.7} transform="translate(0.8 1)" />
      <path d={main} stroke={col} strokeWidth={clamp(s * 0.012, 0.9, 4)} fill="none" />
      {comets}
    </g>
  );
};

const Walker: React.FC<{c: Cam; t: number; P: Pose}> = ({c, t, P}) => {
  const centre: V3 = [P.x, P.y, P.z];
  const zc = toCam(c, centre)[2];
  const yTop = P.y + HUB_H / 2, yBot = P.y - HUB_H / 2;
  const legs = [0, 1, 2, 3, 4].map((i) => {
    const L = legAt(t, i, P);
    return {i, L, zs: toCam(c, L.socket)[2], zm: toCam(c, L.pts[Math.floor(L.pts.length / 2)])[2]};
  });
  const back = legs.filter((l) => l.zs >= zc).sort((a, b) => b.zm - a.zm);
  const front = legs.filter((l) => l.zs < zc).sort((a, b) => b.zm - a.zm);
  const topS = ring(centre, HUB_R, yTop, 48).map((p) => proj(c, p)), botS = ring(centre, HUB_R, yBot, 48).map((p) => proj(c, p));
  const side = hull([...topS, ...botS]);
  const xs = side.map((p) => p[0]), ys = side.map((p) => p[1]);
  let led = 0;
  for (const e of EVENTS_EXT) { const dt = t - e.spike - 0.03; if (dt > 0 && dt < 0.35) led = Math.max(led, e.amp * Math.exp(-dt * 8)); }
  const facing = (p: V3) => v3.dot(v3.sub([p[0], P.y, p[2]], centre), v3.sub(c.pos, p)) > 0;
  const band = ring(centre, HUB_R * 1.002, P.y - 0.05, 64).filter(facing).map((p) => proj(c, p));
  // dome (hemisphere, squashed) and its mesh
  const dpts: V3[] = [];
  for (let la = 0; la <= 6; la++) for (let lo = 0; lo < 32; lo++) {
    const phi = (la / 6) * (Math.PI / 2), th = (lo / 32) * 2 * Math.PI;
    dpts.push([P.x + DOME_R * Math.cos(phi) * Math.cos(th), yTop + DOME_R * 0.78 * Math.sin(phi), P.z + DOME_R * Math.cos(phi) * Math.sin(th)]);
  }
  const domeS = hull(dpts.map((p) => proj(c, p)));
  const mesh = (wantFront: boolean) => {
    let d = '';
    const vis = (p: V3) => v3.dot(v3.nrm([p[0] - P.x, (p[1] - yTop) / 0.78, p[2] - P.z]), v3.sub(c.pos, p)) > 0;
    const line = (f: (u: number) => V3, n: number) => {
      let run: Pt[] = [];
      for (let k = 0; k <= n; k++) { const p = f(k / n); if (vis(p) === wantFront) run.push(proj(c, p)); else { if (run.length > 1) d += poly(run, false); run = []; } }
      if (run.length > 1) d += poly(run, false);
    };
    for (let lo = 0; lo < 12; lo++) { const th = (lo / 12) * 2 * Math.PI + P.th; line((u) => { const phi = u * Math.PI / 2; return [P.x + DOME_R * Math.cos(phi) * Math.cos(th), yTop + DOME_R * 0.78 * Math.sin(phi), P.z + DOME_R * Math.cos(phi) * Math.sin(th)]; }, 12); }
    for (const la of [0.3, 0.62, 0.86]) { const phi = la * Math.PI / 2; line((u) => { const th = u * 2 * Math.PI; return [P.x + DOME_R * Math.cos(phi) * Math.cos(th), yTop + DOME_R * 0.78 * Math.sin(phi), P.z + DOME_R * Math.cos(phi) * Math.sin(th)]; }, 40); }
    return d;
  };
  const m = discToWorld(P, yTop + 0.03);
  const disc = Array.from({length: 48}, (_, k) => proj(c, m(DISC_R * Math.cos((k / 48) * 2 * Math.PI), DISC_R * Math.sin((k / 48) * 2 * Math.PI))));
  const s = pxPerCm(c, centre);
  const uv = uvOn(t);
  // sockets: a boss on the hub wall at each leg (persistent; seen when facing the camera)
  const bosses = [0, 1, 2, 3, 4].map((i) => {
    const so = socket(P, i);
    if (!facing(so)) return null;
    const a = legAngle(P.th, i);
    const rad: V3 = [Math.cos(a), 0, Math.sin(a)], tan: V3 = [-Math.sin(a), 0, Math.cos(a)];
    const o = v3.add(so, v3.mul(rad, 0.12));
    const pts = Array.from({length: 20}, (_, k) => { const g = (k / 20) * 2 * Math.PI; return proj(c, v3.add(o, v3.add(v3.mul(tan, 0.92 * Math.cos(g)), [0, 0.62 * Math.sin(g), 0]))); });
    return <path key={'bo' + i} d={poly(pts)} fill={C.hubBand} stroke={INK} strokeWidth={2} vectorEffect={NS} />;
  });
  const leds = [0, 1, 2, 3, 4].map((k) => {
    const a = P.th + ((k + 0.5) * 2 * Math.PI) / 5;
    const p: V3 = [P.x + HUB_R * 1.01 * Math.cos(a), P.y - 0.05, P.z + HUB_R * 1.01 * Math.sin(a)];
    if (!facing(p)) return null;
    const q = proj(c, p);
    return <g key={'led' + k}><circle cx={q[0]} cy={q[1]} r={0.12 * s} fill={led > 0.05 ? C.spikeCore : '#4C6573'} />
      {led > 0.05 && <circle cx={q[0]} cy={q[1]} r={0.4 * s} fill={C.hubLed} opacity={clamp(led)} filter="url(#glow)" />}</g>;
  });
  const el = ELECTRODES.map((e, k) => {
    const base = m(e[0], e[1]), tip = v3.add(base, [0, 0.32, 0]);
    const pb = proj(c, base), pt = proj(c, tip), r = 0.11 * s, fl = electrodeFlash(t, k);
    return <g key={'e' + k}>
      <path d={poly([pb, pt], false)} stroke={C.goldDark} strokeWidth={r * 2.3} strokeLinecap="round" />
      <path d={poly([pb, pt], false)} stroke={C.gold} strokeWidth={r * 1.6} strokeLinecap="round" />
      <circle cx={pt[0]} cy={pt[1]} r={r * 0.8} fill={C.goldLight} />
      {fl > 0.02 && <circle cx={pt[0]} cy={pt[1]} r={Math.min(r * (2 + 3 * fl), r + 40)} fill={C.spike} opacity={clamp(fl)} filter="url(#glow)" />}
    </g>;
  });
  // tether: air lines and the electrode cable from the back of the hub to the overhead boom
  const rear: V3 = [P.x - Math.cos(P.th) * HUB_R * 0.7, yTop + 0.1, P.z - Math.sin(P.th) * HUB_R * 0.7];
  let tether = '';
  for (let k = 0; k < 30; k++) {
    const q = (u: number): V3 => { const mid = v3.lerp(rear, TETHER_ANCHOR, 0.5); const ctl: V3 = [mid[0] - Math.cos(P.th) * 9, rear[1] + 6, mid[2] - Math.sin(P.th) * 9]; return v3.lerp(v3.lerp(rear, ctl, u), v3.lerp(ctl, TETHER_ANCHOR, u), u); };
    const sg = projSeg(c, q(k / 30), q((k + 1) / 30)); if (sg) tether += poly(sg, false);
  }
  const tw = 0.3 * pxPerCm(c, rear);
  // ground shadows: the hub and each leg projected straight down
  const legShadow = legs.map((l) => poly(l.L.pts.map((p) => { const q = proj(c, [p[0], 0.02, p[2]]); return [q[0], q[1]] as Pt; }), false)).join('');
  return (
    <g>
      <path d={poly(projPoly(c, ring([P.x + 0.5, 0.02, P.z + 0.4], HUB_R * 1.2, 0.02, 32)))} fill={C.shadow} opacity={clamp(1.25 - P.y / 6)} filter="url(#soft)" />
      <path d={legShadow} stroke={C.shadow} strokeWidth={Math.max(4, 0.9 * s)} fill="none" strokeLinecap="round" opacity={0.6} filter="url(#soft)" />
      {legs.map((l) => { if (!l.L.foot.planted) return null; const f = l.L.pts[l.L.pts.length - 1]; const q = proj(c, [f[0], 0.02, f[2]]); const rr = 0.55 * pxPerCm(c, f); return <ellipse key={'fs' + l.i} cx={q[0]} cy={q[1]} rx={rr} ry={rr * 0.35} fill={C.shadow} />; })}
      {back.map((l) => <LegView key={l.i} c={c} L={l.L} />)}
      <path d={tether} stroke={INK} strokeWidth={tw + 3} fill="none" strokeLinecap="round" />
      <path d={tether} stroke={C.tube} strokeWidth={tw} fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="hubG" gradientUnits="userSpaceOnUse" x1={Math.min(...xs)} y1={Math.min(...ys)} x2={Math.max(...xs)} y2={Math.max(...ys)}>
          <stop offset="0" stopColor={C.hub} /><stop offset="1" stopColor={C.hubShade} />
        </linearGradient>
      </defs>
      <path d={poly(side)} fill="url(#hubG)" stroke={INK} strokeWidth={INK_PX} strokeLinejoin="round" vectorEffect={NS} />
      {band.length > 1 && <path d={poly(band, false)} stroke={C.hubBand} strokeWidth={Math.max(2, 0.3 * s)} fill="none" />}
      {bosses}{leds}
      <path d={poly(topS)} fill={C.hub} stroke={INK} strokeWidth={2} vectorEffect={NS} />
      <path d={poly(disc)} fill={C.scaffold} stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <path d={mesh(false)} stroke={C.meshBack} strokeWidth={1.2} fill="none" opacity={0.6} />
      <Mycelium c={c} t={t} P={P} y={yTop + 0.05} />
      {el}
      <path d={poly(domeS)} fill="url(#glassG)" opacity={0.55} />
      {uv > 0.01 && <path d={poly(domeS)} fill={C.uv} opacity={0.16 * uv} />}
      <path d={mesh(true)} stroke={C.mesh} strokeWidth={clamp(s * 0.025, 1, 2.6)} fill="none" opacity={0.85} />
      <path d={poly(domeS)} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      {front.map((l) => <LegView key={l.i} c={c} L={l.L} />)}
    </g>
  );
};

export const RobotWorld: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const P = pose(t);
  const objs: {z: number; el: React.ReactNode}[] = [
    {z: toCam(c, BEAKER.c)[2], el: <Beaker key="bk" c={c} />},
    {z: toCam(c, [P.x, P.y, P.z])[2], el: <Walker key="wk" c={c} t={t} P={P} />},
    {z: -1e9, el: <Lamp key="lamp" c={c} t={t} P={P} part="body" />},
  ];
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
      <Bench c={c} t={t} P={P} />
      {objs.map((o) => o.el)}
      <Lamp c={c} t={t} P={P} part="beam" />
    </svg>
  );
};
