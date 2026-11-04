// The predator as an illustrated radiograph, with EXACTLY the exterior's outline (the same body path and the same fin
// paths from fish.tsx, so the match cut reads). The Scene supplies the dark background (xrayBg0/1).
//   XRayBack  — soft tissue (brighter where the body is thicker), the fins' faint membranes, the gut a little denser,
//               the mouth and gill chamber a little darker, the swim bladder dark (gas). Drawn BELOW the eel.
//   XRayFront — the bright skeleton (skull, jaws, opercular bones, gill arches, girdles, vertebral column, ribs, spines,
//               pterygiophores, fin rays) and a cool edge glow. Drawn ABOVE the eel at partial opacity, so the eel
//               keeps its own colours inside the radiograph.
// Clean vector shapes only: no grid, no text. Bones have world-unit widths (they scale with the camera); each bone class
// is one path drawn twice (a soft halo and a bright core): no filters; one mask keeps the rim glow outside the outline.
import React from 'react';
import {ESOPHAGUS, EYE, GILL_ARCHES, PHARYNX, PREOPERCLE, SPINE, STOMACH, SWIM_BLADDER} from '../anatomy';
import {add, closed, lerpP, mul, n4, nrm, open, P, perp, pt, sub} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, lerp} from '../lib';
import {C, NS} from './palette';
import {BODY_PATH, botY, EDGE_REST, Fin, finPath, finsFor, FishLook, fishSilhouette, opercGeom, raysPath, sampleCurve, topY} from './fish';

// ---------------------------------------------------------------- small path helpers
const M = (p: P) => `M${n4(p.x)} ${n4(p.y)}`;
const L = (p: P) => `L${n4(p.x)} ${n4(p.y)}`;
const Q = (c: P, p: P) => `Q${n4(c.x)} ${n4(c.y)} ${n4(p.x)} ${n4(p.y)}`;
const seg = (a: P, b: P) => M(a) + L(b);
const quad = (a: P, c: P, b: P) => M(a) + Q(c, b);
/** a tapered bone (a long lens) between a and b, width w at the middle */
const rod = (a: P, b: P, w: number, bulge = 0) => {
  const d = nrm(sub(b, a)), n = perp(d), m = add(lerpP(a, b, 0.5), mul(n, bulge));
  const p1 = add(m, mul(n, w / 2)), p2 = add(m, mul(n, -w / 2));
  return M(a) + Q(add(p1, mul(n, w * 0.15)), b) + Q(add(p2, mul(n, -w * 0.15)), a) + 'Z';
};

// ---------------------------------------------------------------- the vertebral column
const SP = sampleCurve(SPINE, 1, 24);
const SP_S = (() => {
  const s = [0];
  for (let i = 1; i < SP.length; i++) s.push(s[i - 1] + Math.hypot(SP[i].x - SP[i - 1].x, SP[i].y - SP[i - 1].y));
  return s;
})();
const spineAt = (s: number) => {
  let i = 1;
  while (i < SP.length - 1 && SP_S[i] < s) i++;
  const u = clamp((s - SP_S[i - 1]) / (SP_S[i] - SP_S[i - 1] || 1));
  const p = lerpP(SP[i - 1], SP[i], u);
  const t = nrm(sub(SP[i], SP[i - 1]));
  return {p, t};
};
const SPINE_END_X = 31.6;
type Vert = {c: P; t: P; len: number; h: number; x: number};
const VERTS: Vert[] = (() => {
  const out: Vert[] = [];
  const step = 2.42;
  for (let s = 1.3; ; s += step) {
    const {p, t} = spineAt(s);
    if (p.x > SPINE_END_X) break;
    const f = clamp((p.x + 31) / 63);
    out.push({c: p, t, len: step * 0.84, h: lerp(1.55, 0.95, f), x: p.x});
  }
  return out;
})();
/** hourglass centrum outline */
const centrum = (v: Vert) => {
  const n = perp(v.t), a = v.len / 2, h = v.h / 2;
  const P_ = (u: number, w: number) => add(v.c, add(mul(v.t, u), mul(n, w)));
  return M(P_(-a, -h)) + Q(P_(0, -h * 0.72), P_(a, -h)) + Q(P_(a + 0.12, 0), P_(a, h)) + Q(P_(0, h * 0.72), P_(-a, h)) + Q(P_(-a - 0.12, 0), P_(-a, -h)) + 'Z';
};
const SKEL_STATIC = (() => {
  let cen = '', disc = '', neural = '', haemal = '', ribs = '', epi = '';
  VERTS.forEach((v, i) => {
    cen += centrum(v);
    const n = perp(v.t); // points down-ish (y+) for a rightward tangent
    const up = mul(n, -1);
    // intervertebral joint: a dark sliver is implied by the gaps; mark the joint faces brightly
    disc += seg(add(v.c, add(mul(v.t, v.len / 2), mul(n, -v.h * 0.45))), add(v.c, add(mul(v.t, v.len / 2), mul(n, v.h * 0.45))));
    // neural spine up and back, toward the dorsal profile
    const top = topY(v.x + 1.5);
    const nb = add(v.c, mul(up, v.h * 0.48));
    const reachN = Math.max(1.2, (nb.y - top) - 1.6);
    const angN = lerp(28, 48, clamp((v.x + 30) / 60)) * (Math.PI / 180);
    const nt = add(nb, pt(Math.sin(angN) * reachN * 1.05, -Math.cos(angN) * reachN));
    neural += quad(nb, add(lerpP(nb, nt, 0.5), pt(-0.25, 0)), nt);
    if (v.x < 4) {
      // abdominal: a pair of pleural ribs curving down and back round the gut
      if (i >= 1) {
        const rb = add(v.c, mul(n, v.h * 0.45));
        const bot = botY(v.x + 4);
        const depth = Math.max(2, (bot - rb.y) * 0.72);
        const rt = add(rb, pt(depth * 0.36, depth));
        ribs += quad(rb, add(rb, pt(-depth * 0.04, depth * 0.6)), rt);
        // epipleural, faint, angled back
        epi += seg(add(rb, pt(0.2, 0.1)), add(rb, pt(3.2, 1.4)));
      }
    } else {
      // caudal: a haemal spine down and back
      const hb = add(v.c, mul(n, v.h * 0.48));
      const bot = botY(v.x + 1.5);
      const reachH = Math.max(1.0, bot - hb.y - 1.5);
      const angH = lerp(34, 50, clamp((v.x - 4) / 28)) * (Math.PI / 180);
      const ht = add(hb, pt(Math.sin(angH) * reachH * 1.05, Math.cos(angH) * reachH));
      haemal += quad(hb, add(lerpP(hb, ht, 0.5), pt(-0.25, 0)), ht);
    }
    // fine epineurals above, angled back
    if (v.x < 24) epi += seg(add(nb, pt(0.2, -0.3)), add(nb, pt(3.4, -1.3)));
  });
  return {cen, disc, neural, haemal, ribs, epi};
})();

// ---------------------------------------------------------------- head bones (static parts)
const SKULL_TOP: P[] = [pt(-48.4, -2.2), pt(-46.4, -5.0), pt(-43.8, -7.6), pt(-41.0, -9.0), pt(-38.0, -9.9), pt(-34.5, -10.7), pt(-31.0, -11.0), pt(-29.0, -10.3), pt(-29.6, -8.2)];
const SKULL_BASE: P[] = [pt(-29.6, -8.2), pt(-31.0, -6.4), pt(-34.0, -5.2), pt(-37.5, -3.6), pt(-41.0, -2.6), pt(-44.5, -1.7), pt(-47.2, -1.1), pt(-48.4, -2.2)];
const SKULL_D = closed([...SKULL_TOP, ...SKULL_BASE.slice(1, -1)], 1);
const ORBIT_RING = (() => {
  const c = EYE.c, r = EYE.r + 0.25;
  return `M${n4(c.x - r)} ${n4(c.y)}a${n4(r)} ${n4(r)} 0 1 0 ${n4(2 * r)} 0a${n4(r)} ${n4(r)} 0 1 0 ${n4(-2 * r)} 0Z`;
})();
const PREMAX = rod(pt(-50.3, -0.35), pt(-41.6, 1.85), 0.62, -0.1);
const PREMAX_ASC = rod(pt(-49.9, -0.5), pt(-47.9, -3.0), 0.42);
const MAXILLA = rod(pt(-48.9, -1.5), pt(-40.2, 2.55), 0.46, -0.25);
/** the lower jaw: a dentary tapering to the chin, deeper at the back where it meets the articular */
const DENTARY = closed([pt(-50.9, 1.15), pt(-47.6, 1.75), pt(-44.2, 2.55), pt(-41.4, 3.15), pt(-40.6, 3.45), pt(-41.3, 4.15), pt(-43.6, 3.95), pt(-47.0, 3.0), pt(-50.2, 1.9)], 0.8);
const ARTIC = rod(pt(-41.6, 3.75), pt(-39.0, 3.05), 0.5);
const QUADRATE = closed([pt(-39.0, 2.7), pt(-37.5, 1.5), pt(-37.4, 2.9), pt(-38.6, 3.25)], 0.4);
const HYOMAND = rod(pt(-37.4, 1.0), pt(-35.4, -5.6), 0.75, 0.2);
const CERATOHYAL = rod(pt(-41.0, 5.6), pt(-33.2, 7.1), 0.62, 0.25);
const TEETH = (() => {
  let d = '';
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const a = lerpP(pt(-49.9, 0.05), pt(-43.0, 1.85), u);
    d += seg(a, add(a, pt(0.12, 0.3)));
    const b = lerpP(pt(-50.3, 1.25), pt(-43.4, 2.7), u);
    d += seg(b, add(b, pt(0.14, -0.28)));
  }
  return d;
})();
const BRANCHIOSTEGALS = (() => {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = pt(-38.6 + i * 0.75, 7.0 + i * 0.22);
    const b = pt(-31.5 + i * 0.45, 10.0 + i * 0.06);
    d += quad(a, pt(lerp(a.x, b.x, 0.5) - 0.4, Math.max(a.y, b.y) + 0.9), b);
  }
  return d;
})();
const PREOP_D = open(PREOPERCLE.map((q) => add(q, pt(0.55, 0))));
const INTEROP = rod(pt(-38.2, 7.7), pt(-31.8, 9.5), 0.8, 0.25);
const RAKERS = (() => {
  let d = '';
  GILL_ARCHES.forEach((arch) => {
    const ps = sampleCurve(arch, 1, 6);
    for (let i = 2; i < ps.length - 2; i += 2) {
      const t = nrm(sub(ps[i + 1], ps[i - 1]));
      const fwd = pt(t.y, -t.x); // forward (x−) side for a downward arch
      const dir = fwd.x < 0 ? fwd : mul(fwd, -1);
      d += seg(ps[i], add(ps[i], mul(dir, 0.55)));
    }
  });
  return d;
})();
const ARCHES_D = GILL_ARCHES.map((a) => open(a)).join('');
/** the cleithrum: the shoulder girdle just behind the gill opening, from the skull down to the throat */
const CLEITHRUM = open([pt(-29.6, -10.2), ...EDGE_REST.filter((_, i) => i % 6 === 0 && i > 0).map((q, i, arr) => add(q, pt(1.0 + 0.4 * Math.sin((i / (arr.length - 1)) * Math.PI), 0.1))), pt(-27.4, 10.9)]);
const POSTCLEITH = rod(pt(-21.6, 4.2), pt(-17.0, 9.6), 0.42, 0.2);
const SCAPULA = closed([pt(-21.7, 1.4), pt(-20.6, 1.3), pt(-20.4, 3.6), pt(-21.5, 3.9)], 1);
const CORACOID = closed([pt(-21.9, 4.0), pt(-20.4, 3.9), pt(-20.1, 6.6), pt(-21.6, 7.1)], 1);
const PECT_RADIALS = (() => {
  let d = '';
  for (let i = 0; i < 4; i++) {
    const a = lerpP(pt(-21.3, 2.0), pt(-20.9, 6.0), i / 3);
    d += seg(a, add(a, pt(0.9, 0.08)));
  }
  return d;
})();
const PELVIC_GIRDLE = closed([pt(-20.0, 10.2), pt(-17.0, 11.3), pt(-16.4, 11.9), pt(-17.6, 11.9), pt(-20.2, 10.8)], 0.6);
const OTOLITH = (() => {
  const c = pt(-32.6, -4.3), rx = 0.95, ry = 0.62;
  return `M${n4(c.x - rx)} ${n4(c.y)}a${rx} ${ry} -12 1 0 ${n4(2 * rx)} 0a${rx} ${ry} -12 1 0 ${n4(-2 * rx)} 0Z`;
})();
const HYPURALS = (() => {
  const base = pt(31.0, -0.25);
  let plates = '';
  const ends = [-4.6, -2.4, -0.2, 2.0, 4.2];
  ends.forEach((y, i) => {
    const y2 = i < ends.length - 1 ? ends[i + 1] - 0.25 : 4.9;
    plates += closed([pt(base.x, base.y + y * 0.12), pt(33.6, y), pt(33.6, y2), pt(base.x + 0.3, base.y + y2 * 0.12)], 0.6);
  });
  return plates;
})();
/** pterygiophores: internal supports from each dorsal / anal ray base into the body, toward the spine */
const pterygFor = (f: Fin, down: boolean) =>
  f.rays.map((r) => {
    const a = r.b;
    const sy = spineAt(Math.max(0, a.x + 31)).p.y;
    const lenY = Math.abs(sy - a.y) * 0.55;
    const b = add(a, pt(-0.55, down ? lenY : -lenY));
    return seg(a, b);
  }).join('');

// ---------------------------------------------------------------- the stroke styles (world units), each as halo + core
type Stroke = {d: string; w: number; a: number; fill?: number};
const Bones: React.FC<{items: Stroke[]; halo?: number}> = ({items, halo = 2.2}) => (
  <>
    {items.map((b, i) => (
      <path key={`h${i}`} d={b.d} fill={b.fill ? C.xrayEdge : 'none'} fillOpacity={b.fill ? b.fill * 0.35 : undefined} stroke={C.xrayEdge} strokeWidth={b.w * halo} strokeOpacity={0.13 * b.a} strokeLinecap="round" strokeLinejoin="round" />
    ))}
    {items.map((b, i) => (
      <path key={`c${i}`} d={b.d} fill={b.fill ? C.xrayBone : 'none'} fillOpacity={b.fill} stroke={C.xrayBone} strokeWidth={b.w} strokeOpacity={b.a} strokeLinecap="round" strokeLinejoin="round" />
    ))}
  </>
);

// ---------------------------------------------------------------- XRayBack: soft tissue, gut, gas
export const XRayBack: React.FC<{s: FishLook}> = ({s}) => {
  const f = finsFor(s);
  const id = {thick: uid('xrThick'), head: uid('xrHead'), clip: uid('xrClip'), gas: uid('xrGas'), stom: uid('xrStom'), cav: uid('xrCav'), fin: uid('xrFin')};
  const G = opercGeom(s);
  const fins = [f.caudal, f.d1, f.d2, f.anal, f.pelvic, f.pelvicFar, f.pectoral, f.pectoralFar];
  const SB = SWIM_BLADDER, ST = STOMACH;
  // the pharynx (water-filled throat: a little less dense)
  const phar = closed([pt(PHARYNX.front.x, PHARYNX.front.y - PHARYNX.halfH * 0.5), pt(-40, -1.4), pt(PHARYNX.back.x, PHARYNX.back.y - PHARYNX.halfH),
    pt(PHARYNX.back.x + 1, PHARYNX.back.y + 0.4), pt(PHARYNX.back.x, PHARYNX.back.y + PHARYNX.halfH), pt(-40, 3.6), pt(PHARYNX.front.x, PHARYNX.front.y + PHARYNX.halfH * 0.4)], 1);
  // the opercular chamber under the cover (between the gills and the cover)
  const cham = closed([...G.ec.filter((_, i) => i % 8 === 0).map((q) => add(q, pt(-0.6, 0))), pt(-30.5, 8.5), pt(-32.2, 2), pt(-31.6, -6), pt(-29.5, -9.6)], 1);
  const eso = closed([pt(ESOPHAGUS.front.x, ESOPHAGUS.front.y - ESOPHAGUS.halfH), pt(ESOPHAGUS.back.x, ESOPHAGUS.back.y - ESOPHAGUS.halfH * 1.1), pt(ESOPHAGUS.back.x + 1, ESOPHAGUS.back.y + 0.2), pt(ESOPHAGUS.back.x, ESOPHAGUS.back.y + ESOPHAGUS.halfH * 1.1), pt(ESOPHAGUS.front.x, ESOPHAGUS.front.y + ESOPHAGUS.halfH)], 1);
  return (
    <g>
      <defs>
        <radialGradient id={id.thick} gradientUnits="userSpaceOnUse" cx="-17" cy="0.3" r="12.8" gradientTransform="translate(-17 0.3) scale(3.7 1) translate(17 -0.3)">
          <stop offset="0" stopColor={C.xrayFlesh} stopOpacity={0.62} />
          <stop offset="0.55" stopColor={C.xrayFlesh} stopOpacity={0.4} />
          <stop offset="0.86" stopColor={C.xraySoft} stopOpacity={0.18} />
          <stop offset="1" stopColor={C.xraySoft} stopOpacity={0.05} />
        </radialGradient>
        <radialGradient id={id.head} gradientUnits="userSpaceOnUse" cx="-38" cy="-0.6" r="11.5">
          <stop offset="0" stopColor={C.xrayFlesh} stopOpacity={0.32} />
          <stop offset="1" stopColor={C.xrayFlesh} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id.gas} gradientUnits="userSpaceOnUse" cx={SB.c.x} cy={SB.c.y} r={SB.ry} gradientTransform={`translate(${SB.c.x} ${SB.c.y}) scale(${SB.rx / SB.ry} 1) translate(${-SB.c.x} ${-SB.c.y})`}>
          <stop offset="0" stopColor={C.xrayGas} stopOpacity={0.9} />
          <stop offset="0.78" stopColor={C.xrayGas} stopOpacity={0.82} />
          <stop offset="1" stopColor={C.xrayGas} stopOpacity={0.35} />
        </radialGradient>
        <radialGradient id={id.stom} gradientUnits="userSpaceOnUse" cx={ST.c.x} cy={ST.c.y} r={ST.ry} gradientTransform={`translate(${ST.c.x} ${ST.c.y}) scale(${ST.rx / ST.ry} 1) translate(${-ST.c.x} ${-ST.c.y})`}>
          <stop offset="0" stopColor={C.xrayFlesh} stopOpacity={0.12} />
          <stop offset="0.8" stopColor={C.xrayFlesh} stopOpacity={0.2} />
          <stop offset="1" stopColor={C.xrayFlesh} stopOpacity={0.32} />
        </radialGradient>
        <linearGradient id={id.fin} gradientUnits="userSpaceOnUse" x1="0" y1="-12" x2="0" y2="12">
          <stop offset="0" stopColor={C.xraySoft} stopOpacity={0.26} />
          <stop offset="0.5" stopColor={C.xraySoft} stopOpacity={0.34} />
          <stop offset="1" stopColor={C.xraySoft} stopOpacity={0.26} />
        </linearGradient>
        <clipPath id={id.clip}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>
      {/* the fins' thin membranes */}
      {fins.map((fn, i) => (
        <path key={i} d={finPath(fn)} fill={`url(#${id.fin})`} />
      ))}
      {/* soft tissue: base density, then thickness (the trunk's core and the broad head) */}
      <path d={BODY_PATH} fill={C.xraySoft} fillOpacity={0.3} />
      <g clipPath={`url(#${id.clip})`}>
        <path d={BODY_PATH} fill={`url(#${id.thick})`} />
        <circle cx={-38} cy={-0.6} r={11.5} fill={`url(#${id.head})`} />
        {/* the eyeball */}
        <circle cx={EYE.c.x} cy={EYE.c.y} r={EYE.r} fill={C.xrayFlesh} fillOpacity={0.2} />
        {/* the water-filled throat and gill chamber: less dense */}
        <path d={phar} fill={C.xrayBg0} fillOpacity={0.32} />
        <path d={cham} fill={C.xrayBg0} fillOpacity={0.22} />
        {/* the gut: the esophagus and the distended stomach a little denser; the intestine; the liver */}
        <ellipse cx={-14.5} cy={-1.4} rx={6.2} ry={2.6} fill={C.xrayFlesh} fillOpacity={0.16} transform="rotate(8 -14.5 -1.4)" />
        <path d={eso} fill={C.xrayFlesh} fillOpacity={0.14} />
        <ellipse cx={ST.c.x} cy={ST.c.y} rx={ST.rx} ry={ST.ry} fill={`url(#${id.stom})`} />
        <ellipse cx={ST.c.x} cy={ST.c.y} rx={ST.rx} ry={ST.ry} fill="none" stroke={C.xrayFlesh} strokeOpacity={0.16} strokeWidth={0.9} />
        <ellipse cx={ST.c.x} cy={ST.c.y} rx={ST.rx} ry={ST.ry} fill="none" stroke={C.xrayEdge} strokeOpacity={0.16} strokeWidth={0.22} />
        <ellipse cx={12.6} cy={7.2} rx={5.2} ry={2.6} fill={C.xrayFlesh} fillOpacity={0.1} transform="rotate(-8 12.6 7.2)" />
        {/* the swim bladder: gas, dark, with its thin bright wall */}
        <ellipse cx={SB.c.x} cy={SB.c.y} rx={SB.rx} ry={SB.ry} fill={`url(#${id.gas})`} />
        <ellipse cx={SB.c.x} cy={SB.c.y} rx={SB.rx} ry={SB.ry} fill="none" stroke={C.xrayEdge} strokeOpacity={0.32} strokeWidth={0.14} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- XRayFront: the skeleton and the edge glow
export const XRayFront: React.FC<{s: FishLook; opacity?: number}> = ({s, opacity = 1}) => {
  const f = finsFor(s);
  const G = opercGeom(s);
  const sil = fishSilhouette(s);
  const S = SKEL_STATIC;
  // the opercle (a thin plate in the upper cover) and the subopercle below it, moving with the flare
  const n = G.ec.length;
  const opUpper = G.ec.slice(1, Math.round(n * 0.66)).map((q, i) => add(q, mul(G.nrm[i + 1], -0.35)));
  const opercle = closed([pt(-34.0, -8.4), pt(-30.6, -10.3), ...opUpper.filter((_, i) => i % 3 === 0), pt(-27.6, 4.2), pt(-31.6, 2.2), pt(-33.8, -2.2)], 0.9);
  const opStrut = quad(pt(-33.6, -7.6), pt(-29.0, -6.6), add(G.ec[Math.round(n * 0.4)], mul(G.nrm[Math.round(n * 0.4)], -0.6)));
  const subUpper = G.ec.slice(Math.round(n * 0.62), n - 2).map((q, i) => add(q, mul(G.nrm[i + Math.round(n * 0.62)], -0.35)));
  const subop = closed([pt(-27.8, 4.6), ...subUpper.filter((_, i) => i % 3 === 0), pt(-31.2, 9.6), pt(-30.2, 6.8)], 0.9);
  const finRays = [f.caudal, f.d2, f.anal, f.pectoral, f.pelvic].map((fn) => raysPath(fn, 0.02, 0.97)).join('');
  const spines = raysPath(f.d1, 0.0, 0.98);
  const ptery = pterygFor(f.d1, true) + pterygFor(f.d2, true) + pterygFor(f.anal, false);
  const lens = pt(EYE.c.x - 0.3, EYE.c.y + 0.05);
  const bones: Stroke[] = [
    // the skull (a dense mass), jaws and the eye
    {d: SKULL_D, w: 0.18, a: 0.78, fill: 0.24},
    {d: ORBIT_RING, w: 0.22, a: 0.62},
    {d: PREMAX + PREMAX_ASC, w: 0.1, a: 0.9, fill: 0.62},
    {d: MAXILLA, w: 0.08, a: 0.6, fill: 0.3},
    {d: DENTARY, w: 0.12, a: 0.85, fill: 0.5},
    {d: ARTIC + QUADRATE, w: 0.08, a: 0.6, fill: 0.3},
    {d: HYOMAND, w: 0.08, a: 0.5, fill: 0.24},
    {d: TEETH, w: 0.09, a: 0.55},
    {d: OTOLITH, w: 0.06, a: 1, fill: 0.95},
    // the opercular series (thin plates, moving with the flare)
    {d: opercle, w: 0.13, a: 0.55, fill: 0.1},
    {d: opStrut, w: 0.28, a: 0.55},
    {d: subop, w: 0.11, a: 0.45, fill: 0.08},
    {d: PREOP_D, w: 0.38, a: 0.8},
    {d: INTEROP, w: 0.08, a: 0.45, fill: 0.2},
    {d: BRANCHIOSTEGALS, w: 0.1, a: 0.42},
    {d: CERATOHYAL, w: 0.08, a: 0.5, fill: 0.28},
    // the gill arches and rakers
    {d: ARCHES_D, w: 0.2, a: 0.58},
    {d: RAKERS, w: 0.06, a: 0.3},
    // the girdles
    {d: CLEITHRUM, w: 0.42, a: 0.8},
    {d: POSTCLEITH, w: 0.06, a: 0.45, fill: 0.3},
    {d: SCAPULA + CORACOID, w: 0.08, a: 0.45, fill: 0.22},
    {d: PECT_RADIALS, w: 0.16, a: 0.45},
    {d: PELVIC_GIRDLE, w: 0.08, a: 0.5, fill: 0.26},
    // the axial skeleton
    {d: S.ribs, w: 0.11, a: 0.5},
    {d: S.epi, w: 0.05, a: 0.18},
    {d: S.neural + S.haemal, w: 0.12, a: 0.62},
    {d: ptery, w: 0.09, a: 0.32},
    {d: S.cen, w: 0.1, a: 0.95, fill: 0.76},
    {d: S.disc, w: 0.08, a: 0.45},
    {d: HYPURALS, w: 0.08, a: 0.7, fill: 0.4},
    // the fin rays
    {d: spines, w: 0.13, a: 0.8},
    {d: finRays, w: 0.08, a: 0.7},
  ];
  const rim = uid('xrRim');
  return (
    <g opacity={opacity}>
      <defs>
        <mask id={rim} maskUnits="userSpaceOnUse" x="-70" y="-40" width="140" height="80">
          <rect x={-70} y={-40} width={140} height={80} fill="#FFF" />
          <path d={sil} fill="#000" />
        </mask>
      </defs>
      {/* the cool rim of the whole outline (outside half of a stroke): a soft halo and a crisp line */}
      <g mask={`url(#${rim})`}>
        <path d={sil} fill="none" stroke={C.xrayEdge} strokeWidth={1.4} strokeOpacity={0.14} strokeLinejoin="round" />
        <path d={sil} fill="none" stroke={C.xrayEdge} strokeWidth={3.6} vectorEffect={NS} strokeOpacity={0.75} strokeLinejoin="round" />
      </g>
      <Bones items={bones} />
      {/* the dense lens of the eye */}
      <circle cx={lens.x} cy={lens.y} r={0.95} fill={C.xrayBone} fillOpacity={0.55} />
      <circle cx={lens.x} cy={lens.y} r={0.55} fill={C.xrayBone} fillOpacity={0.8} />
    </g>
  );
};
