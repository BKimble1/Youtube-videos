// HOOK 04: "This metal robot melts through a cage… then gets remolded into shape."
// One continuous shot on a lab bench (magnetoactive liquid-solid phase transitional matter, Wang, Pan, Majidi et al.,
// Matter 2023): a small cast gallium figure stands in a cage of vertical bars on a flat induction coil. The coil's
// alternating field heats it and it melts from the soles up and slumps into a mirror-bright puddle; a hand-held
// magnet pulls the liquid out between the bars, where it beads and re-merges; the magnet leads the pool onto an open
// silicone mould and drags it down the figure-shaped cavity; the metal freezes matte; the magnet lifts the recast
// figure out, stands it up and sets it down outside the cage.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import {clamp, keyCR as keyCRl, ss} from '../shared/lib';
import {a3, Cam, ellipsoid, Ell, l3, m3, project, V3, v3} from './cam';
import {FIG_H, FIG_T, FigureArt, FigureSheen, meltDeform, P2, PARTS, partPath} from './figure';
import {Goo, gooBox, GooLayer} from './liquid';
import {C_POOL, CAV, camera, castPose, magnetAt, meltState, T, W} from './motion';
import {Bench, boxFaces, cage, CORAL_C, frontRegion, Magnet, MOULD, MouldBody, Pad, RC, surfaceZ, ZT} from './props';
import {SoftShadow} from './shade';
import {lit} from '../shared/color';
import {Inked, InkPath} from '../shared/ink';

type Aff = {a: number; b: number; c: number; d: number; e: number; f: number};
const affine = (cam: Cam, O3: V3, U3: V3, V3_: V3): Aff => {
  const o = project(cam, O3), u = project(cam, a3(O3, U3)), v = project(cam, a3(O3, V3_));
  return {a: u.x - o.x, b: u.y - o.y, c: v.x - o.x, d: v.y - o.y, e: o.x, f: o.y};
};
const affStr = (A: Aff) => `matrix(${[A.a, A.b, A.c, A.d, A.e, A.f].map((x) => x.toFixed(4)).join(' ')})`;
const ap = (A: Aff, p: P2) => ({x: A.a * p.x + A.c * p.y + A.e, y: A.b * p.x + A.d * p.y + A.f});
/** screen offset -> local units under A */
const toLocal = (A: Aff, dx: number, dy: number): P2 => {
  const det = A.a * A.d - A.b * A.c;
  return {x: (A.d * dx - A.c * dy) / det, y: (-A.b * dx + A.a * dy) / det};
};
const pathScreen = (A: Aff, pts: P2[], off?: P2) => partPath(pts.map((q) => ap(A, off ? {x: q.x + off.x, y: q.y + off.y} : q)));

/** a flat liquid ellipsoid lying on the surface (centre on the surface) */
const lump = (c: Cam, p: V3, ra: number, rb: number, h: number, ang = 0): Ell => {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return ellipsoid(c, v3(p.x, p.y, p.z + h * 0.45), [v3(ra * ca, ra * sa, 0), v3(-rb * sa, rb * ca, 0), v3(0, 0, h * 0.55)]);
};

// cavity sample points (figure-local), for the filling liquid
const inside = (pts: P2[], p: P2) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const CAV_PTS: P2[] = (() => {
  const out: P2[] = [];
  for (let v = 0.02; v <= FIG_H; v += 0.075)
    for (let u = -0.6; u <= 0.6; u += 0.075) if (PARTS.some((p) => inside(p.pts, {x: u, y: v}))) out.push({x: u, y: v});
  return out;
})();

const GAPS = [
  {phi: -30, a: T.esc0, b: T.esc1 - 0.08, w: 1},
  {phi: -60, a: T.esc0 + 0.1, b: T.esc1, w: 1},
  {phi: -90, a: T.esc0 + 0.26, b: T.esc1 - 0.14, w: 0.72},
];
const DRIPS = [
  {u: -0.46, v: 0.82, t0: 0.22, d: 0.5},
  {u: 0.44, v: 0.98, t0: 0.38, d: 0.5},
  {u: 0.12, v: 1.32, t0: 0.55, d: 0.55},
  {u: -0.2, v: 1.12, t0: 0.66, d: 0.5},
];

const Scene: React.FC<{t: number}> = ({t}) => {
  const c = camera(t);
  const k0 = c.s;
  const ink = 0.0165 * k0;
  const gooInk = 0.0058 * k0;
  const ms = meltState(t);
  const power = 1 - ss(t, T.power0, T.power0 + 0.35);

  // ---------------------------------------------------------------- the figure in the cage (billboard)
  const yr = (c.yaw * Math.PI) / 180;
  const right = v3(Math.cos(yr), -Math.sin(yr), 0), away = v3(Math.sin(yr), Math.cos(yr), 0);
  const Ffront = a3(v3(0, 0, ZT), m3(away, -FIG_T / 2));
  const Afig = affine(c, Ffront, right, v3(0, 0, 1));
  const so = project(c, a3(Ffront, m3(away, FIG_T))), sf = project(c, Ffront);
  const sweepFig = toLocal(Afig, so.x - sf.x, so.y - sf.y);
  const deformed = PARTS.map((p) => ({name: p.name, tone: p.tone, pts: p.pts.map((q) => meltDeform(q, !!p.arm, ms.slump, t))}));
  const figGone = ms.slump > 0.995 || t > T.esc0 + 0.35;
  const kf = project(c, Ffront).k;

  // ---------------------------------------------------------------- liquid (one height field, screen space)
  const items: Goo[] = [];
  const shadows: React.ReactNode[] = [];
  if (!figGone) {
    const shrink = 1 - ss(t, T.slump1 - 0.1, T.esc0 + 0.35);
    for (const p of deformed) {
      const pts = p.pts.map((q) => ({x: q.x * shrink, y: q.y * shrink}));
      items.push({k: 'p', d: pathScreen(Afig, pts), g: 'dome'});
      items.push({k: 'p', d: pathScreen(Afig, pts, {x: sweepFig.x * 0.6, y: sweepFig.y * 0.6}), g: 'dome'});
    }
    for (const dr of DRIPS) {
      const u = clamp((t - dr.t0) / dr.d);
      if (u <= 0 || u >= 1) continue;
      const lp = meltDeform({x: dr.u * (1 + 0.15 * u), y: dr.v * (1 - u * u)}, false, ms.slump, t);
      const sp = ap(Afig, lp);
      const r = 0.07 * kf * Math.sin(Math.PI * Math.min(1, u * 1.6)) ** 0.5;
      items.push({k: 'e', e: {cx: sp.x, cy: sp.y, rx: r, ry: r * 1.15, rot: 0}, g: 'dome'});
    }
  }
  // the puddle in the cage
  const rin = (0.15 + 0.45 * ss(t, 0.0, 1.45)) * (1 - ss(t, T.esc0 + 0.25, T.esc1 - 0.04));
  const pc = v3(0.3 * ss(t, T.esc0, 2.0), -0.3 * ss(t, T.esc0, 2.0), ZT);
  if (rin > 0.01) {
    items.push({k: 'e', e: lump(c, pc, rin, rin * 0.96, 0.22 + 0.06 * (1 - ms.slump)), g: 'flat'});
    const lobe = 1 - ss(t, 1.4, 1.8);
    for (let i = 0; i < (lobe > 0.02 ? 6 : 0); i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4 + 0.25 * Math.sin(t * 2.3 + i);
      const rr = rin * (0.62 + 0.06 * Math.sin(t * 3.1 + i * 1.7));
      items.push({k: 'e', e: lump(c, v3(pc.x + rr * Math.cos(a), pc.y + rr * Math.sin(a), ZT), rin * 0.42 * lobe, rin * 0.36 * lobe, 0.18, a), g: 'dome'});
    }
    shadows.push(<SoftShadow key="ps" id="pud-sh" c={{x: project(c, pc).x + 6, y: project(c, pc).y + 5}} rx={rin * project(c, pc).k * 1.25} ry={rin * project(c, pc).k * 0.62} alpha={0.45} color="#03090C" />);
  }
  // streams through the bar gaps
  for (const g of GAPS) {
    const p = (t - g.a) / (g.b - g.a);
    if (p <= 0 || p >= 1.02) continue;
    const ph = (g.phi * Math.PI) / 180;
    const n = v3(Math.cos(ph), Math.sin(ph), 0);
    const G = v3(RC * n.x, RC * n.y, ZT);
    const I = v3(pc.x + n.x * rin * 0.8, pc.y + n.y * rin * 0.8, ZT);
    const O = a3(G, m3(n, 0.16 + 0.34 * ss(p, 0, 0.6)));
    const B = l3(O, C_POOL, ss(p, 0.42, 1.0));
    const rn = 0.125 * g.w * ss(p, 0, 0.1) * (1 - ss(p, 0.76, 0.96));
    const rb = 0.27 * g.w * Math.sqrt(ss(p, 0.02, 0.62)) * (1 - 0.5 * ss(p, 0.8, 1.0));
    const jig = 1 + 0.06 * Math.sin(t * 19 + g.phi) * ss(p, 0.75, 1);
    for (let i = 0; i <= 4; i++) {
      const f = i / 4;
      const q = l3(I, G, f);
      const r = Math.max(rn, Math.min(0.24, rin * 0.5) * (1 - f) + rn * f);
      if (r > 0.012) items.push({k: 'e', e: lump(c, q, r, r * 0.9, 0.2), g: 'dome'});
    }
    for (let i = 1; i <= 4; i++) {
      const f = i / 4;
      const q = l3(G, B, f * 0.8);
      const r = rn + (rb * 0.6 - rn) * f;
      if (r > 0.012 && rn > 0.008) items.push({k: 'e', e: lump(c, q, r, r * 0.9, 0.2), g: 'dome'});
    }
    if (rb > 0.01) items.push({k: 'e', e: lump(c, B, rb * jig, rb / jig, 0.3), g: 'dome'});
  }
  // the collected pool, then steered by the magnet
  const fillU = clamp((t - 3.22) / (T.fill1 - 3.22));
  const P = v3(
    t < 2.3 ? C_POOL.x : keyP(t, 'x'),
    t < 2.3 ? C_POOL.y : keyP(t, 'y'),
    ZT,
  );
  const rP = (0.5 * ss(t, 1.62, 2.32)) * Math.sqrt(Math.max(0, 1 - fillU * 1.02));
  const M0 = magnetAt(t);
  if (rP > 0.015) {
    const dmx = M0.x - P.x, dmy = M0.y - P.y;
    const dh = Math.hypot(dmx, dmy) || 1;
    const dist = Math.hypot(dh, M0.z - ZT);
    const att = t > T.mag0 ? Math.exp(-Math.max(0, dist - 0.65) / 0.55) : 0;
    const ang = Math.atan2(dmy, dmx);
    // stretch along the motion while it is being dragged
    const vx = keyP(t + 0.04, 'x') - keyP(t - 0.04, 'x'), vy = keyP(t + 0.04, 'y') - keyP(t - 0.04, 'y');
    const sp = t > 2.32 ? Math.min(1, Math.hypot(vx, vy) / 0.12) : 0;
    const va = sp > 0.02 ? Math.atan2(vy, vx) : ang;
    const wob = 1 + 0.05 * Math.sin(t * 9.5);
    items.push({k: 'e', e: lump(c, P, rP * (1 + 0.35 * sp) * wob, rP * (1 - 0.18 * sp) / wob, 0.3, va), g: 'flat'});
    if (att > 0.02) {
      const tq = v3(P.x + Math.cos(ang) * rP * 0.7 * att, P.y + Math.sin(ang) * rP * 0.7 * att, ZT);
      items.push({k: 'e', e: lump(c, tq, rP * 0.55, rP * 0.42, 0.28, ang), g: 'dome'});
      // the liquid heaps up toward the magnet
      const pk = v3(P.x + Math.cos(ang) * rP * 0.55 * att, P.y + Math.sin(ang) * rP * 0.55 * att, ZT + 0.12 + 0.16 * att);
      const pr = rP * (0.2 + 0.18 * att);
      items.push({k: 'e', e: ellipsoid(c, pk, [v3(pr, 0, 0), v3(0, pr, 0), v3(0, 0, 0.1 + 0.2 * att)]), g: 'dome'});
    }
    if (sp > 0.05) {
      // trailing beads
      for (let i = 1; i <= 2; i++) {
        const q = v3(P.x - Math.cos(va) * rP * (1.1 + 0.55 * i), P.y - Math.sin(va) * rP * (1.1 + 0.55 * i), ZT);
        const r = rP * 0.28 * sp / i;
        if (r > 0.02) items.push({k: 'e', e: lump(c, q, r, r, 0.15), g: 'dome'});
      }
    }
    const pp = project(c, P);
    shadows.push(<SoftShadow key="pls" id="pool-sh" c={{x: pp.x + 6, y: pp.y + 6}} rx={rP * pp.k * 1.35} ry={rP * pp.k * 0.7} alpha={0.4} color="#03090C" />);
  }

  // ---------------------------------------------------------------- the cavity and its fill
  const Acav = affine(c, v3(CAV.x, CAV.yF, ZT), v3(1, 0, 0), v3(0, 1, 0));
  const Afloor = affine(c, v3(CAV.x, CAV.yF, ZT - FIG_T), v3(1, 0, 0), v3(0, 1, 0));
  const fv = FIG_H + 0.08 - (FIG_H + 0.22) * fillU;
  const cavItems: Goo[] = [];
  if (t > 3.15 && t < T.freeze1 + 0.05) {
    for (const q of CAV_PTS) {
      const r = 0.12 * ss(q.y - fv, -0.04, 0.12);
      if (r < 0.01) continue;
      cavItems.push({k: 'e', e: lump(c, v3(CAV.x + q.x, CAV.yF + q.y, ZT - 0.06), r, r, 0.08), g: 'flat'});
    }
  }

  // ---------------------------------------------------------------- the cast figure (frozen, then lifted)
  const pose = castPose(t);
  const th = (pose.th * Math.PI) / 180;
  const Vd = v3(0, Math.cos(th), Math.sin(th)), nrm = v3(0, -Math.sin(th), Math.cos(th));
  const Ff = a3(pose.F, m3(nrm, FIG_T));
  const sw = (pose.swing * Math.PI) / 180;
  const wpt = (u: number, vv: number) => {
    const uu = Math.cos(sw) * u - Math.sin(sw) * (vv - FIG_H);
    const vy = Math.sin(sw) * u + Math.cos(sw) * (vv - FIG_H) + FIG_H;
    return a3(Ff, a3(v3(uu, 0, 0), m3(Vd, vy)));
  };
  const o0 = wpt(0, 0);
  const Acast = affine(c, o0, s3v(wpt(1, 0), o0), s3v(wpt(0, 1), o0));
  const cb = project(c, a3(Ff, m3(nrm, -FIG_T))), cf = project(c, Ff);
  const sweepCast0 = toLocal(Acast, cb.x - cf.x, cb.y - cf.y);
  const sweepCast = {x: sweepCast0.x * ss(pose.th, 4, 30), y: sweepCast0.y * ss(pose.th, 4, 30)};
  const vc = FIG_H * 0.85 + (FIG_H - FIG_H * 0.85) * ss(pose.th, 0, 40);
  const contact = wpt(0, vc);
  const M = magnetAt(t, contact);
  const fz = FIG_H + 0.1 - (FIG_H + 0.3) * ss(t, T.freeze0, T.freeze1);
  const castVisible = t > T.freeze0;
  const kc = project(c, o0).k;

  // ---------------------------------------------------------------- the solid figure in the cage
  const solidA = 1 - ss(ms.slump, 0.2, 0.55);
  const frontV = ms.front * (1 - 0.86 * Math.pow(ms.slump, 1.1));

  const cg = cage(c, ink);
  const box = gooBox(items, 60, undefined);
  const sigma = (0.016 + 0.05 * ss(t, 0.1, 1.2)) * k0;
  const fr = frontRegion(c);
  const mg = project(c, v3(M.x, M.y, surfaceZ(M.x, M.y)));
  const mh = M.z - surfaceZ(M.x, M.y);
  const lipNeeded = castVisible && pose.F.z < ZT - 0.004 && t > T.touch;

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Bench c={c} t={t} />
      <Pad c={c} t={t} power={power} ink={ink} />
      <MouldBody c={c} ink={ink} />
      {/* the figure-shaped cavity: far walls in shade, the floor below */}
      <defs>
        <clipPath id="cav-clip">
          {PARTS.map((p) => (
            <path key={p.name} d={pathScreen(Acav, p.pts)} />
          ))}
        </clipPath>
        <mask id="liqB">
          <path d={fr} fill="#FFF" />
        </mask>
      </defs>
      <Inked w={ink * 0.8}>
        {PARTS.map((p) => (
          <InkPath key={p.name} d={pathScreen(Acav, p.pts)} fill="#8E3F31" />
        ))}
      </Inked>
      <g clipPath="url(#cav-clip)">
        {PARTS.map((p) => (
          <path key={p.name} d={pathScreen(Afloor, p.pts)} fill="#B65A47" />
        ))}
      </g>
      <GooLayer id="cav" items={cavItems} sigma={0.035 * k0} box={gooBox(cavItems, 50)} ink={gooInk} clip="url(#cav-clip)" solid={0} spec={1} />
      {shadows}
      {/* contact shadow of the standing figure in the cage */}
      {!figGone && (
        <SoftShadow id="fig-sh" c={{x: project(c, v3(0, 0, ZT)).x + 10, y: project(c, v3(0, 0, ZT)).y + 6}} rx={0.62 * kf} ry={0.24 * kf} alpha={0.55 * (1 - ms.slump)} color="#03090C" />
      )}
      {cg.back}
      <GooLayer id="liqA" items={items} sigma={sigma} box={box} ink={gooInk} />
      {!figGone && solidA > 0.01 && (
        <g transform={affStr(Afig)} opacity={solidA}>
          <defs>
            <linearGradient id="melt-m" gradientUnits="userSpaceOnUse" x1="0" y1={(frontV - 0.07).toFixed(3)} x2="0" y2={(frontV + 0.09).toFixed(3)}>
              <stop offset="0" stopColor="#000" />
              <stop offset="1" stopColor="#FFF" />
            </linearGradient>
            <mask id="melt-mask" maskUnits="userSpaceOnUse" x="-3" y="-1" width="6" height="5">
              <rect x="-3" y="-1" width="6" height="5" fill="url(#melt-m)" />
            </mask>
            <linearGradient id="melt-warm" gradientUnits="userSpaceOnUse" x1="0" y1={(frontV - 0.02).toFixed(3)} x2="0" y2={(frontV + 0.22).toFixed(3)}>
              <stop offset="0" stopColor="#FFB869" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FFB869" stopOpacity={0} />
            </linearGradient>
          </defs>
          <g mask="url(#melt-mask)">
            <FigureArt id="figA" parts={deformed} sweep={sweepFig} ink={ink / kf} grain={1} />
            <g>
              {deformed.map((p) => (
                <path key={p.name} d={partPath(p.pts)} fill="url(#melt-warm)" opacity={power * 0.45} />
              ))}
            </g>
            <FigureSheen parts={deformed} a={1} />
          </g>
        </g>
      )}
      {cg.front}
      <GooLayer id="liqB" items={items} sigma={sigma} box={box} ink={gooInk} mask="url(#liqB)" />
      {/* the recast figure: revealed as the metal freezes, then lifted out by the magnet */}
      {castVisible && (
        <g>
          {pose.th > 20 && (
            <SoftShadow id="cast-sh" c={{x: project(c, v3(pose.F.x, pose.F.y - 0.12, surfaceZ(pose.F.x, pose.F.y))).x + 8, y: project(c, v3(pose.F.x, pose.F.y - 0.12, surfaceZ(pose.F.x, pose.F.y))).y + 5}}
              rx={0.6 * kc} ry={0.22 * kc} alpha={0.5 * ss(pose.th, 20, 80) / (1 + 6 * Math.max(0, pose.F.z - ZT))} color="#03090C" />
          )}
          <g transform={affStr(Acast)}>
            <defs>
              <linearGradient id="frz-m" gradientUnits="userSpaceOnUse" x1="0" y1={(fz - 0.06).toFixed(3)} x2="0" y2={(fz + 0.06).toFixed(3)}>
                <stop offset="0" stopColor="#000" />
                <stop offset="1" stopColor="#FFF" />
              </linearGradient>
              <mask id="frz-mask" maskUnits="userSpaceOnUse" x="-3" y="-1" width="6" height="5">
                <rect x="-3" y="-1" width="6" height="5" fill="url(#frz-m)" />
              </mask>
            </defs>
            <g mask={t < T.freeze1 + 0.02 ? 'url(#frz-mask)' : undefined}>
              <FigureArt id="figC" parts={PARTS} sweep={sweepCast} ink={ink / kc} grain={1} />
              <FigureSheen parts={PARTS} a={1} />
            </g>
          </g>
        </g>
      )}
      {lipNeeded && <Lip c={c} />}
      {/* the magnet and its shadow */}
      <SoftShadow id="mag-sh" c={{x: mg.x + 10, y: mg.y + 8}} rx={(0.42 + 0.25 * mh) * mg.k} ry={(0.2 + 0.12 * mh) * mg.k} alpha={0.42 / (1 + 1.4 * mh)} color="#03090C" />
      <Magnet c={c} M={M} ink={ink} />
    </svg>
  );
};

const s3v = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);

/** pool centre while it is steered (keyed with the magnet's lead) */
const keyP = (t: number, ax: 'x' | 'y') => {
  const X: [number, number][] = [[2.3, 1.35], [2.5, 1.37], [2.82, 1.22], [3.08, 1.0], [3.3, 0.92], [T.fill1, 0.9]];
  const Y: [number, number][] = [[2.3, -1.45], [2.5, -1.55], [2.82, -2.0], [3.08, -2.45], [3.3, -2.92], [T.fill1, -4.3]];
  return keyCRl(t, ax === 'x' ? X : Y);
};

/** the mould's top strip in front of the cavity, redrawn over the soles while they are still below the top */
const Lip: React.FC<{c: Cam}> = ({c}) => {
  const f = boxFaces(c, v3(MOULD.x0 + 0.01, MOULD.y0 + 0.01, 0), v3(MOULD.x1 - 0.01, CAV.yF - 0.03, ZT), {
    top: lit(CORAL_C, 0.1), nx: 'none', px: 'none', ny: 'none', py: 'none',
  }).filter((q) => q.top);
  return <g>{f.map((q, i) => <path key={i} d={q.d} fill={q.col} />)}</g>;
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="04" W={W} bg="#1C3634" capY={[300, 300]} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
