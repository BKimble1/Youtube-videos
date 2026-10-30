// HOOK 05: the semi-transparent anatomical cutaway of the abdomen, revealed in place (a soft clearing that grows on the
// beetle's own body while the camera keeps moving). Paired pygidial glands, one per side, each: secretory lobes and
// their efferent duct -> a large thin-walled reservoir (hydroquinones + hydrogen peroxide) -> a muscular valve -> a
// small thick-walled reaction chamber lined with enzyme-secreting cells (catalases, peroxidases) -> an outlet to the
// opening at the abdominal tip. Each pulse: the valve opens, reactants enter, the enzymes act, the mixture heats
// (to about 100 C: a colour shift to hot orange-white, vapour bubbles, a pressure bulge), the pressure snaps the valve
// shut and drives the hot slug out through the outlet; then the valve reopens. No flames anywhere.
import React from 'react';
import {add3, Basis, cross3, dot3, lerp3, mul3, norm3, P2, proj, smoothClosed, spline3, sub3, V3} from '../shared/three';
import {clamp, hash, ss} from '../shared/lib';
import {lit, mix, rgba, shade} from '../shared/color';
import {INK} from '../shared/ink';
import {ellipsoidPath, inkW, Item} from './core/draw3';
import {dirW, Frame, toW} from './core/frame';
import {BRig} from './beetle/rig';
import {abdomenClip, BCOL, ELY, elyProf, hullPath, sweepPts} from './beetle/draw';
import {EV, PULSES} from './scene';

const f2 = (n: number) => n.toFixed(2);

export type GState = {valve: number; heat: number; press: number; slug: number; inflow: number; mixing: number};
/** the chamber cycle at time t */
export const glandState = (t: number): GState => {
  let valve = 0, heat = 0.22, press = 0, slug = -1, inflow = -1, mixing = 0;
  // before the first pop: one slow, readable fill from EV.valve0
  const opens = [EV.valve0, ...PULSES.slice(0, -1).map((p) => p + 0.035)];
  for (let k = 0; k < PULSES.length; k++) {
    const o = opens[k], p = PULSES[k];
    if (t >= o - 0.02 && t < p + 0.12) {
      const u = clamp((t - o) / (p - o));
      if (t < p) {
        valve = ss(t, o, o + Math.min(0.06, (p - o) * 0.35)) * (1 - ss(t, p - 0.03, p));
        heat = 0.4 + 0.6 * u * u;
        press = u * u * u;
        inflow = u;
        mixing = clamp((u - 0.15) / 0.85);
      } else {
        const a = t - p;
        valve = 0;
        heat = 1 - 0.5 * clamp(a / 0.1);
        press = Math.max(0, 1 - a / 0.05);
        slug = a / 0.075;
      }
    }
  }
  if (t > PULSES[PULSES.length - 1] + 0.12) heat = 0.5 * (1 - ss(t, PULSES[PULSES.length - 1], 5.2)) + 0.15;
  return {valve, heat, press, slug, inflow, mixing};
};

// ------------------------------------------------------------------ geometry (body coordinates)
const RES = (s: number): {c: V3; a: V3} => ({c: [-3.45, 0.62 * s, -0.22], a: [0.98, 0.47, 0.42]});
const NECK0 = (s: number): V3 => [-4.38, 0.5 * s, -0.3];
const VALVE = (s: number): V3 => [-4.6, 0.42 * s, -0.33];
const CH = (s: number): {c: V3; a: V3} => ({c: [-4.98, 0.31 * s, -0.36], a: [0.4, 0.31, 0.31]});
const OUT0 = (s: number): V3 => [-5.3, 0.19 * s, -0.38];
const LOBES = (s: number): V3[] => [[-2.05, 0.82, 0.12], [-2.25, 0.98, -0.05], [-2.0, 0.62, -0.1], [-2.3, 0.72, 0.18], [-1.85, 0.86, -0.02], [-2.15, 0.88, -0.25]].map(([x, y, z]) => [x, y * s, z] as V3);
const DUCT = (s: number): V3[] => [[-2.2, 0.8 * s, 0.0], [-2.45, 0.72 * s, -0.05], [-2.6, 0.68 * s, -0.12]];

const ell = (B: Basis, F: Frame, c: V3, a: V3, k = 1) => ellipsoidPath(B, toW(F, c), [mul3(F.f, a[0] * k), mul3(F.l, a[1] * k), mul3(F.u, a[2] * k)]);
const tube = (B: Basis, pts: V3[], r0: number, r1: number) => {
  // a tapered tube along world points as one closed outline (left side out, right side back)
  const P = pts.map((p) => proj(B, p));
  const L: {x: number; y: number}[] = [], Rr: {x: number; y: number}[] = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    const r = (r0 + (r1 - r0) * (i / (P.length - 1))) * P[i].s;
    L.push({x: P[i].x - (dy / l) * r, y: P[i].y + (dx / l) * r});
    Rr.push({x: P[i].x + (dy / l) * r, y: P[i].y - (dx / l) * r});
  }
  return smoothClosed([...L, ...Rr.reverse()]);
};

export const cutawayItem = (B: Basis, R: BRig, t: number, c: number, ns: string): Item | null => {
  if (c <= 0.002) return null;
  const F = R.st.body;
  const W = (p: V3) => toW(F, p);
  const G = glandState(t);
  const center = proj(B, W([-4.3, 0, -0.3]));
  const sc = center.s;
  const clips = abdomenClip(B, R);
  const elyD = clips[0];
  const id = `${ns}cut`;
  const rMask = (0.4 + 3.4 * c) * sc;
  // which gland is nearer the camera
  const sides = [1, -1].sort((a, b) => proj(B, W(RES(b).c)).z - proj(B, W(RES(a).c)).z);
  const lw = inkW(sc, 0.62);
  const gland = (s: number, near: boolean) => {
    const op = near ? 1 : 0.72;
    const els: React.ReactNode[] = [];
    // secretory lobes and their efferent duct
    const duct = spline3([...DUCT(s), RES(s).c.map((v, i) => (i === 0 ? v + 0.75 : v)) as V3].map(W), 4);
    els.push(<path key="du" d={tube(B, duct, 0.06, 0.08)} fill="#E9D7C3" stroke={INK} strokeWidth={f2(lw * 0.6)} />);
    LOBES(s).forEach((q, k) => {
      const P = proj(B, W(q));
      const r = (0.15 + 0.04 * hash(k * 3.1 + s)) * P.s;
      els.push(<circle key={`l${k}`} cx={f2(P.x)} cy={f2(P.y)} r={f2(r)} fill={`url(#${id}lobe)`} stroke={INK} strokeWidth={f2(lw * 0.55)} />);
    });
    // reservoir: a thin translucent wall around the pale reactant mixture
    const res = RES(s);
    const resD = ell(B, F, res.c, res.a);
    const rc = proj(B, W(res.c));
    const Rr = res.a[0] * rc.s;
    els.push(
      <g key="res">
        <path d={resD} fill={`url(#${id}liq)`} fillOpacity={0.92} />
        <path d={ell(B, F, res.c, res.a, 0.86)} fill="none" stroke="#FFF8D8" strokeWidth={f2(lw * 0.8)} opacity={0.35} />
        {Array.from({length: 14}, (_, k) => {
          const h = (n: number) => hash(k * 5.3 + n * 1.7 + s * 9);
          const q = W([res.c[0] + (h(1) - 0.5) * 1.4 * res.a[0], res.c[1] + (h(2) - 0.5) * 1.2 * res.a[1], res.c[2] + (h(3) - 0.5) * 1.2 * res.a[2] + 0.04 * Math.sin(t * 3 + k)]);
          const P = proj(B, q);
          return <circle key={k} cx={f2(P.x)} cy={f2(P.y)} r={f2(0.035 * P.s)} fill="#C8A955" opacity={0.6} />;
        })}
        <ellipse cx={f2(rc.x - Rr * 0.3)} cy={f2(rc.y - Rr * 0.22)} rx={f2(Rr * 0.32)} ry={f2(Rr * 0.1)} transform={`rotate(-28 ${f2(rc.x - Rr * 0.3)} ${f2(rc.y - Rr * 0.22)})`} fill="#FFFFFF" opacity={0.4} />
        <path d={resD} fill="none" stroke={INK} strokeWidth={f2(lw)} />
      </g>,
    );
    // neck from the reservoir to the valve and on into the chamber (lumen fills when open)
    const neck = spline3([W([res.c[0] - res.a[0] * 0.85, res.c[1] * 0.92, res.c[2] - 0.05]), W(NECK0(s)), W(VALVE(s)), W(lerp3(VALVE(s), CH(s).c, 0.45))], 4);
    els.push(<path key="nk" d={tube(B, neck, 0.13, 0.1)} fill="#D9C08A" stroke={INK} strokeWidth={f2(lw * 0.8)} />);
    els.push(<path key="nl" d={tube(B, neck, 0.06 * (0.3 + 0.7 * G.valve), 0.05 * (0.3 + 0.7 * G.valve))} fill="#F6E9B2" opacity={0.9} />);
    // inflow: reactant droplets carried through the open valve
    if (G.inflow >= 0 && G.valve > 0.05) {
      for (let k = 0; k < 4; k++) {
        const u = (G.inflow * 2.2 + k / 4) % 1;
        const p = neck[Math.min(neck.length - 1, Math.floor(u * (neck.length - 1)))];
        const P = proj(B, p);
        els.push(<circle key={`if${k}`} cx={f2(P.x)} cy={f2(P.y)} r={f2(0.05 * P.s * G.valve)} fill="#FFF6CF" opacity={0.95} />);
      }
    }
    // the muscular valve: a ring around the duct that pinches shut
    {
      const v = W(VALVE(s));
      const ax = norm3(sub3(W(lerp3(VALVE(s), CH(s).c, 0.5)), W(NECK0(s))));
      let u = norm3(cross3(ax, F.u));
      const w = cross3(ax, u);
      const rr = 0.16 + 0.07 * G.valve;
      const ring = Array.from({length: 20}, (_, k) => {
        const th = (k / 20) * Math.PI * 2;
        return proj(B, add3(v, add3(mul3(u, rr * Math.cos(th)), mul3(w, rr * Math.sin(th)))));
      });
      const thick = (0.1 - 0.025 * G.valve) * proj(B, v).s;
      els.push(
        <g key="valve">
          <path d={smoothClosed(ring)} fill="none" stroke={INK} strokeWidth={f2(thick + lw * 1.6)} />
          <path d={smoothClosed(ring)} fill="none" stroke="#C9475A" strokeWidth={f2(thick)} />
          <path d={smoothClosed(ring)} fill="none" stroke="#F08A96" strokeWidth={f2(thick * 0.3)} strokeDasharray={f2(thick * 0.5) + ' ' + f2(thick * 0.6)} opacity={0.8} />
        </g>,
      );
    }
    // the reaction chamber: thick cuticular wall, enzyme-secreting lining, contents heating with every pulse
    {
      const ch = CH(s);
      const k = 1 + 0.09 * G.press;
      const cc = proj(B, W(ch.c));
      const outer = ell(B, F, ch.c, ch.a, k);
      const inner = ell(B, F, ch.c, ch.a, 0.64 * k);
      const hot = G.heat;
      const cMid = mix('#E9D68E', '#FFB04A', clamp(hot * 1.3));
      const cCore = mix('#F3E3A6', '#FFF6DE', clamp((hot - 0.4) / 0.6));
      const r = ch.a[0] * cc.s * k;
      els.push(
        <g key="ch">
          <defs>
            <radialGradient id={`${id}glow${s}`} gradientUnits="userSpaceOnUse" cx={f2(cc.x)} cy={f2(cc.y)} r={f2(r * 2.6)}>
              <stop offset="0" stopColor="#FFE2A0" stopOpacity={f2(0.75 * clamp((hot - 0.3) / 0.7))} />
              <stop offset="0.5" stopColor="#FFB45A" stopOpacity={f2(0.28 * clamp((hot - 0.3) / 0.7))} />
              <stop offset="1" stopColor="#FF9A40" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}hot${s}`} gradientUnits="userSpaceOnUse" cx={f2(cc.x)} cy={f2(cc.y)} r={f2(r * 0.7)}>
              <stop offset="0" stopColor={cCore} />
              <stop offset="0.65" stopColor={cMid} />
              <stop offset="1" stopColor={shade(cMid, 0.25)} />
            </radialGradient>
          </defs>
          <circle cx={f2(cc.x)} cy={f2(cc.y)} r={f2(r * 2.6)} fill={`url(#${id}glow${s})`} />
          <path d={outer} fill={`url(#${id}wall)`} stroke={INK} strokeWidth={f2(lw * 1.1)} />
          {/* lining cells around the cavity */}
          {Array.from({length: 14}, (_, j) => {
            const th = (j / 14) * Math.PI * 2;
            const q = W([ch.c[0] + ch.a[0] * 0.72 * k * Math.cos(th), ch.c[1] + ch.a[1] * 0.72 * k * Math.sin(th) * 0.4, ch.c[2] + ch.a[2] * 0.72 * k * Math.sin(th)]);
            const P = proj(B, q);
            return <circle key={j} cx={f2(P.x)} cy={f2(P.y)} r={f2(0.075 * P.s)} fill="#E7A88C" stroke={shade('#E7A88C', 0.5)} strokeWidth={f2(lw * 0.35)} />;
          })}
          <path d={inner} fill={`url(#${id}hot${s})`} stroke={shade('#8E5A3C', 0.3)} strokeWidth={f2(lw * 0.5)} />
          {/* enzyme specks released from the lining as the reactants arrive */}
          {G.mixing > 0 && Array.from({length: 7}, (_, j) => {
            const h = (n: number) => hash(j * 4.1 + n * 2.3 + s * 3);
            const th = h(1) * Math.PI * 2;
            const rr = 0.6 - 0.35 * G.mixing * h(2);
            const q = W([ch.c[0] + ch.a[0] * rr * k * Math.cos(th), ch.c[1], ch.c[2] + ch.a[2] * rr * k * Math.sin(th)]);
            const P = proj(B, q);
            return <circle key={`e${j}`} cx={f2(P.x)} cy={f2(P.y)} r={f2(0.035 * P.s)} fill="#7FD8B6" opacity={f2(0.9 * (1 - G.mixing * 0.6))} />;
          })}
          {/* vapour bubbles as it heats */}
          {Array.from({length: 6}, (_, j) => {
            const h = (n: number) => hash(j * 7.7 + n * 1.3 + s * 5);
            const b = clamp((hot - 0.45) / 0.55);
            if (b <= 0) return null;
            const ph = (t * (3 + 2 * h(3)) + h(4)) % 1;
            const q = W([ch.c[0] + ch.a[0] * 0.45 * (h(1) - 0.5) * 2 * k, ch.c[1], ch.c[2] + ch.a[2] * (0.45 * (ph - 0.5) * 2) * k]);
            const P = proj(B, q);
            return <circle key={`b${j}`} cx={f2(P.x)} cy={f2(P.y)} r={f2((0.03 + 0.05 * b * h(2)) * P.s)} fill="#FFFFFF" opacity={f2(0.85 * b)} />;
          })}
          <ellipse cx={f2(cc.x - r * 0.35)} cy={f2(cc.y - r * 0.32)} rx={f2(r * 0.28)} ry={f2(r * 0.1)} transform={`rotate(-30 ${f2(cc.x - r * 0.35)} ${f2(cc.y - r * 0.32)})`} fill="#FFFFFF" opacity={0.35} />
        </g>,
      );
    }
    // outlet to the opening at the tip; the hot slug runs along it after each pop
    {
      const side = norm3(cross3(R.tipDirW, F.u));
      const end = add3(R.tipEnd, mul3(side, 0.09 * s * Math.sign(dot3(side, F.l) || 1)));
      const mid = add3(W([-5.55, 0.12 * s, -0.42]), mul3(R.tipDirW, 0.12));
      const out = spline3([W(OUT0(s)), mid, add3(lerp3(mid, end, 0.5), mul3(R.tipDirW, 0.05)), end], 5);
      els.push(<path key="od" d={tube(B, out, 0.1, 0.07)} fill="#A9724F" stroke={INK} strokeWidth={f2(lw * 0.7)} />);
      els.push(<path key="ol" d={tube(B, out, 0.045, 0.035)} fill={mix('#6E4030', '#FFE7A8', clamp(G.heat - 0.2))} />);
      if (G.slug >= 0 && G.slug <= 1.2) {
        const u = clamp(G.slug);
        const p = out[Math.min(out.length - 1, Math.round(u * (out.length - 1)))];
        const P = proj(B, p);
        const o = 1 - clamp((G.slug - 0.9) / 0.3);
        els.push(<circle key="sl" cx={f2(P.x)} cy={f2(P.y)} r={f2(0.13 * P.s)} fill={`url(#${id}slug)`} opacity={f2(o)} />);
      }
    }
    return <g key={`g${s}`} opacity={op}>{els}</g>;
  };
  // a faint hindgut down the midline, ending at the tip between the gland openings (context, not a focus)
  const gut = spline3([W([-0.6, 0, -0.32]), W([-2.2, -0.05, -0.5]), W([-3.8, 0, -0.55]), W([-4.9, 0, -0.5]), add3(R.tipEnd, mul3(R.tipDirW, -0.25))], 5);
  const elyLines = (() => {
    const out: React.ReactNode[] = [];
    out.push(<path key="eo" d={elyD} fill="none" stroke="#9FB8E8" strokeWidth={f2(lw * 1.2)} opacity={0.45} />);
    [0.22, 0.5, 0.78].forEach((q, k) => [1, -1].forEach((sd) => {
      const ph = sd > 0 ? Math.acos(q) : Math.PI - Math.acos(q);
      const pts: {x: number; y: number}[] = [];
      for (let i = 0; i <= 14; i++) {
        const u = ELY.u0 + 0.08 + ((ELY.u1 - ELY.u0 - 0.16) * i) / 14;
        const pr = elyProf(u);
        pts.push(proj(B, W([ELY.cx + ELY.a * u, pr.w * Math.cos(ph), pr.zc + pr.hu * Math.sin(ph)])));
      }
      out.push(<path key={`gs${k}${sd}`} d={'M' + pts.map(P2).join(' L')} fill="none" stroke="#8FA8DA" strokeWidth={f2(lw * 0.7)} opacity={0.22} />);
    }));
    return out;
  })();
  const el = (
    <g key="cutaway">
      <defs>
        <radialGradient id={`${id}m`} gradientUnits="userSpaceOnUse" cx={f2(center.x)} cy={f2(center.y)} r={f2(rMask)}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.62" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <mask id={`${id}mask`} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5080" height="5920">
          <rect x="-2000" y="-2000" width="5080" height="5920" fill="#000" />
          <circle cx={f2(center.x)} cy={f2(center.y)} r={f2(rMask)} fill={`url(#${id}m)`} />
        </mask>
        <clipPath id={`${id}clip`}>
          {clips.map((d, k) => <path key={k} d={d} />)}
        </clipPath>
        <radialGradient id={`${id}bg`} gradientUnits="userSpaceOnUse" cx={f2(center.x)} cy={f2(center.y)} r={f2(4.5 * sc)}>
          <stop offset="0" stopColor="#3B2632" stopOpacity="0.8" />
          <stop offset="0.7" stopColor="#2A2238" stopOpacity="0.7" />
          <stop offset="1" stopColor="#1E2A44" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={`${id}liq`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFF7D6" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#F1DE9C" stopOpacity="0.85" />
          <stop offset="1" stopColor="#C9AE62" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={`${id}lobe`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FBEBDD" />
          <stop offset="1" stopColor="#CDAE96" />
        </radialGradient>
        <radialGradient id={`${id}wall`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={lit('#A86F4B', 0.35)} />
          <stop offset="0.6" stopColor="#A86F4B" />
          <stop offset="1" stopColor={shade('#A86F4B', 0.45)} />
        </radialGradient>
        <radialGradient id={`${id}slug`}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#FFF1C4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFD98A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask={`url(#${id}mask)`} opacity={f2(clamp(c * 1.6))}>
        <g clipPath={`url(#${id}clip)`}>
          <rect x="-200" y="-200" width="1480" height="2320" fill={`url(#${id}bg)`} />
          <path d={tube(B, gut, 0.2, 0.16)} fill="#B9868E" opacity={0.35} />
          {sides.map((s, k) => gland(s, k === 1))}
        </g>
        {elyLines}
      </g>
    </g>
  );
  return {z: proj(B, W([ELY.cx, 0, 0.3])).z - 0.6, el};
};
export {sweepPts, elyProf, hullPath, BCOL, rgba, P2, dirW};
