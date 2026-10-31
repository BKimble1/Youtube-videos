// The character: one side-view rig (facing screen right) used by every human shot. World units are centimetres, y down,
// the floor at y = 0. The near arm is a two-bone chain (shoulder S, elbow E, wrist W) whose soft tissue is built from
// radius profiles along each bone, so the humerus, elbow and shoulder never move when the muscles swell: only the
// profiles grow. The limb outline is a union (strokes underneath, fills on top), with the elbow crease drawn on top.
import React from 'react';
import {P, add, closed, dir, lerpP, mul, nrm, open, pt, rot, sub} from '../core/geo';
import {mix, rgba} from '../core/color';
import {uid} from '../core/ids';
import {clamp, lerp, noise1, ss} from '../lib';

export const LU = 31, LF = 27, HAND = 9.5;
const PI = Math.PI;
const bump = (s: number, c: number, w: number) => {
  const x = (s - c) / w;
  return Math.abs(x) >= 1 ? 0 : (1 - x * x) ** 2;
};
const lin = (a: number, b: number, n: number) => Array.from({length: n}, (_, i) => a + ((b - a) * i) / (n - 1));

export const SKIN = {lit: '#F6BE97', mid: '#E59C74', shade: '#B4674B', deep: '#8E4734', ink: '#4A2219', rim: '#FFE3C9'};
export const SHIRT = {base: '#2F62D0', lit: '#4F86EE', shade: '#1B3C8E', ink: '#0E1F4A', seam: '#9BB8FF'};

export type ArmState = {
  S: P; a1: number; a2: number;
  m: number;      // muscle mass: 0 normal .. 1 huge
  c: number;      // biceps contraction 0..1
  tear: number;   // sleeve seam split 0..1
  stretch: number; // sleeve tension 0..1
  xray: number;   // 0 opaque skin .. 1 translucent anatomical view
  cut?: {r: number; s: number; v: number; c?: P}; // circular skin cutaway on the biceps: radius (cm), position along/across the arm (or a fixed centre)
  pops?: number;  // 0..1 progress of a burst of stitches popping off the straining seam (no split)
  gripK?: number; // how hard the hand squeezes the handle
  elbowCut?: number; // 0..1: the elbow cutaway (muscle, tendon, bone)
  grip: boolean;  // holding the dumbbell handle
  fibreGlow?: number; // activation along the biceps fascicles (elbow cutaway)
  t: number;
};

export const armFrame = (a: ArmState) => {
  const u = dir(a.a1), an = rot(u, -PI / 2);
  const E = add(a.S, mul(u, LU));
  const f = rot(u, -a.a2), fa = rot(f, -PI / 2);
  const W = add(E, mul(f, LF));
  const m = a.m, c = a.c;
  const B = lerp(1.35, 7.7, m) * (1 + 0.28 * c);
  const cb = 0.53 + 0.07 * c, wb = 0.45 - 0.08 * c;
  const ra = (s: number) => lerp(3.25, 2.45, s) + (2.4 + 2.2 * m) * bump(s, -0.02, 0.32) + B * bump(s, cb, wb) + 0.35 * m * bump(s, 0.86, 0.12);
  const rp = (s: number) => lerp(3.45, 2.5, s) + (3.0 + 2.6 * m) * bump(s, 0.0, 0.36) + (1.5 + 4.6 * m) * bump(s, 0.37, 0.5);
  const rfa = (t: number) => lerp(2.55, 1.75, t) + (1.25 + 2.9 * m) * bump(t, 0.2, 0.44) * (1 + 0.15 * c);
  const rfp = (t: number) => lerp(2.45, 1.65, t) + (0.85 + 1.8 * m) * bump(t, 0.24, 0.52);
  /** point on the upper arm: s along (0 shoulder, 1 elbow), v across in units of the local radius (+ anterior) */
  const UA = (s: number, v: number) => add(add(a.S, mul(u, s * LU)), mul(an, v >= 0 ? v * ra(s) : v * rp(s)));
  const FA = (t: number, v: number) => add(add(E, mul(f, t * LF)), mul(fa, v >= 0 ? v * rfa(t) : v * rfp(t)));
  return {u, an, E, f, fa, W, ra, rp, rfa, rfp, UA, FA, B};
};
export type ArmFrame = ReturnType<typeof armFrame>;

/** the skin's cel finish across a limb: lit edge, body, core shadow and a little bounce light at the far edge */
const LimbGrad: React.FC<{id: string; a: P; b: P; k?: number}> = ({id, a, b, k = 1}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
    <stop offset={0} stopColor={mix(SKIN.lit, '#FFF1E0', 0.25 * k)} />
    <stop offset={0.34} stopColor={SKIN.lit} />
    <stop offset={0.56} stopColor={SKIN.mid} />
    <stop offset={0.84} stopColor={SKIN.shade} />
    <stop offset={1} stopColor={mix(SKIN.shade, '#7FA6C8', 0.25)} />
  </linearGradient>
);
// the key light comes from the upper left
const LIGHT = nrm(pt(-0.55, -1));
const litSide = (n: P) => (n.x * LIGHT.x + n.y * LIGHT.y >= 0 ? 1 : -1);

/** internal anatomy of the arm in its own frame: humerus, radius and ulna, biceps (belly, tendon to the radial tuberosity),
 *  brachialis, triceps, forearm flexors. Used by the elbow cutaway and by the translucent (speculative) view. */
export const ArmAnatomy: React.FC<{a: ArmState; g: ArmFrame; mode: 'cut' | 'xray'}> = ({a, g, mode}) => {
  const {UA, FA, E, an, f, fa} = g;
  const m = a.m, glow = a.fibreGlow ?? 0;
  const xr = mode === 'xray';
  const C = (ps: P[]) => closed(ps, 0.9);
  // bones: humerus (shaft widening to the condyles), ulna (hooking behind the elbow as the olecranon), radius
  const hum = [...lin(0.04, 0.93, 9).map((s) => UA(s, -0.12 - 0.1 * s + 0.0 * s)), ];
  const humTube = (() => {
    const L = hum.map((p, i) => add(p, mul(an, 0.9 + (i === 0 ? 1.0 : 0) + (i >= 7 ? 0.8 * (i - 6) : 0))));
    const R = hum.map((p, i) => add(p, mul(an, -(0.9 + (i === 0 ? 1.0 : 0) + (i >= 7 ? 0.7 * (i - 6) : 0)))));
    return C([...L, add(E, mul(an, 1.6)), add(E, mul(f, 1.4)), add(E, mul(an, -1.9)), ...R.reverse()]);
  })();
  const ulnaP = [add(E, mul(an, -2.3)), add(add(E, mul(an, -1.2)), mul(f, 1.6)), ...lin(0.12, 0.95, 6).map((t) => FA(t, -0.3))];
  const ulna = C([add(ulnaP[0], mul(f, -0.9)), ...ulnaP.map((p, i) => add(p, mul(fa, i < 2 ? 0.9 : 0.55))), ...[...ulnaP].reverse().map((p, i) => add(p, mul(fa, i > ulnaP.length - 3 ? -0.7 : -0.5)))]);
  const radP = [add(add(E, mul(f, 1.2)), mul(fa, 0.55)), ...lin(0.1, 0.95, 6).map((t) => FA(t, 0.32))];
  const tub = add(FA(0.12, 0.32), mul(fa, 0.8)); // radial tuberosity: the biceps tendon's insertion
  const radius = C([add(radP[0], mul(f, -0.6)), ...radP.map((p, i) => add(p, mul(fa, i === 0 ? 1.0 : i === 1 ? 1.15 : 0.55))), ...[...radP].reverse().map((p) => add(p, mul(fa, -0.5)))]);
  // muscles
  const bicTip = UA(0.82, 0.52);
  const bic = C([...lin(0.06, 0.76, 11).map((s) => UA(s, 0.97)), bicTip, ...lin(0.74, 0.06, 11).map((s) => UA(s, 0.3 + 0.08 * Math.sin(PI * s)))]);
  const tendon = C([UA(0.72, 0.74), add(bicTip, mul(an, 0.5)), add(lerpP(bicTip, tub, 0.5), mul(fa, 0.55)), add(tub, mul(f, 0.5)), add(tub, mul(f, -0.6)), add(lerpP(UA(0.8, 0.36), tub, 0.5), mul(fa, -0.35)), UA(0.72, 0.36)]);
  const brach = C([...lin(0.5, 0.88, 6).map((s) => UA(s, 0.34)), add(FA(0.1, 0.0), mul(fa, 0.9)), add(FA(0.06, 0.0), mul(fa, -0.2)), ...lin(0.9, 0.5, 6).map((s) => UA(s, 0.06))]);
  const triT = add(E, mul(an, -2.4));
  const tri = C([...lin(0.06, 0.86, 10).map((s) => UA(s, -0.5)), triT, ...lin(0.86, 0.06, 10).map((s) => UA(s, -0.97))]);
  const flex = C([...lin(0.08, 0.7, 8).map((t) => FA(t, 0.97)), ...lin(0.7, 0.08, 8).map((t) => FA(t, 0.5))]);
  const ext = C([...lin(0.06, 0.7, 8).map((t) => FA(t, -0.45)), ...lin(0.7, 0.06, 8).map((t) => FA(t, -0.97))]);
  const red = xr ? 'rgba(255,90,110,0.40)' : '#B0222E';
  const redLit = xr ? 'rgba(255,150,165,0.48)' : '#D63A45';
  const fasc = xr ? 'rgba(255,210,220,0.8)' : '#EE7A7A';
  const ink = xr ? 'rgba(255,220,230,0.85)' : '#3E0A10';
  const bone = xr ? 'rgba(225,242,255,0.6)' : '#F0E5CB';
  const boneInk = xr ? 'rgba(235,250,255,0.95)' : '#6A5638';
  const sw = xr ? 0.14 : 0.2;
  const nF = 8;
  const fascicles = Array.from({length: nF}, (_, k) => {
    const v = 0.36 + (0.58 * (k + 0.5)) / nF;
    return lin(0.1, 0.74, 9).map((s) => UA(s, v));
  });
  const triF = Array.from({length: 4}, (_, k) => lin(0.12, 0.8, 7).map((s) => UA(s, -0.58 - 0.1 * k)));
  return (
    <g>
      <path d={humTube} fill={bone} stroke={boneInk} strokeWidth={0.16} />
      <path d={open(lin(0.15, 0.85, 6).map((s) => UA(s, -0.16 - 0.1 * s)))} stroke={xr ? 'rgba(255,255,255,0.6)' : '#FFF8E8'} strokeWidth={0.35} fill="none" strokeLinecap="round" />
      <path d={ulna} fill={bone} stroke={boneInk} strokeWidth={0.15} />
      <path d={radius} fill={bone} stroke={boneInk} strokeWidth={0.15} />
      <path d={tri} fill={red} stroke={ink} strokeWidth={sw} />
      {triF.map((ps, k) => <path key={k} d={open(ps)} stroke={fasc} strokeWidth={0.22} fill="none" opacity={0.5} />)}
      <path d={ext} fill={red} stroke={ink} strokeWidth={sw} opacity={0.95} />
      <path d={flex} fill={redLit} stroke={ink} strokeWidth={sw} opacity={0.95} />
      <path d={brach} fill={red} stroke={ink} strokeWidth={sw} />
      <path d={bic} fill={redLit} stroke={ink} strokeWidth={sw} />
      {fascicles.map((ps, k) => {
        const ph = (a.t * 2.6 - k * 0.09) % 1;
        const on = glow * (0.5 + 0.5 * Math.sin(PI * 2 * ph));
        return (
          <g key={k}>
            <path d={open(ps)} stroke={fasc} strokeWidth={(0.3 + 0.42 * m) * (xr ? 1.1 : 0.85)} fill="none" strokeLinecap="round" opacity={xr ? 0.85 : 0.6} />
            {on > 0.02 && <path d={open(ps)} stroke="#FFD7A8" strokeWidth={0.24 + 0.25 * m} fill="none" strokeLinecap="round" opacity={on} />}
          </g>
        );
      })}
      <path d={open(lin(0.18, 0.66, 7).map((s) => UA(s, 0.84)))} stroke={xr ? 'rgba(255,255,255,0.55)' : 'rgba(255,212,204,0.75)'} strokeWidth={0.45} fill="none" strokeLinecap="round" />
      {/* the tendon: silvery, fibrous, from the end of the belly over the joint to the radius */}
      <path d={tendon} fill={xr ? 'rgba(240,250,255,0.85)' : mix('#DCE3E8', '#FFFFFF', 0.5 * glow)} stroke={xr ? 'rgba(255,255,255,0.95)' : '#56616C'} strokeWidth={0.16} />
      <path d={open([lerpP(UA(0.77, 0.52), bicTip, 0.5), lerpP(bicTip, tub, 0.55), tub])} stroke={xr ? 'rgba(255,255,255,0.6)' : '#AEB8C1'} strokeWidth={0.12} fill="none" />
      <circle cx={tub.x} cy={tub.y} r={0.35} fill={boneInk} opacity={0.6} />
    </g>
  );
};

/** the fitted t-shirt sleeve over the upper arm, with a stitched seam that pops and splits */
const Sleeve: React.FC<{a: ArmState; g: ArmFrame}> = ({a, g}) => {
  const {UA} = g;
  const sH = 0.31 - 0.045 * a.stretch; // hem position along the upper arm: it rides up as the sleeve tightens
  const gap = lerp(0.32, 0.1, a.stretch);
  const off = (s: number, v: number) => {
    const p = UA(s, v);
    return add(p, mul(v >= 0 ? g.an : mul(g.an, -1), gap));
  };
  const ant = lin(-0.34, sH, 9).map((s) => off(s, 1));
  const post = lin(sH, -0.34, 9).map((s) => off(s, -1));
  const outline = [...ant, ...post];
  const tear = a.tear;
  // the seam runs from the hem up the outer face of the sleeve; the split opens along it as a V, widest at the hem
  const seam = (k: number) => {
    const s = sH - k * 0.4;
    return UA(s, 0.1 + 0.14 * k);
  };
  const len = clamp(tear * 1.25);
  const open_ = clamp(tear * 1.1) * (0.9 + 0.25 * a.m);
  const notch: P[] = [];
  const W0 = 9.5;
  if (tear > 0) {
    const n = 14;
    const L: P[] = [], R: P[] = [];
    for (let i = 0; i <= n; i++) {
      const k = (len * i) / n;
      const p = seam(k);
      const w = open_ * W0 * (1 - i / n) ** 0.7;
      const jag = (i % 2 ? 0.22 : -0.22) * Math.min(1, open_ * 2) * (1 - i / n);
      L.push(add(p, mul(g.an, w * 0.55 + jag)));
      R.push(add(p, mul(g.an, -w * 0.45 + jag)));
    }
    const hemOut = add(L[0], mul(g.u, 1.2));
    const hemOut2 = add(R[0], mul(g.u, 1.2));
    notch.push(hemOut, ...L, ...[...R].reverse(), hemOut2);
  }
  const id = uid('slv');
  const mk = uid('slm');
  const stitches = lin(0.02, 0.98, 13).map((k) => seam(k * 1.0));
  const hemSt = lin(-0.9, 0.95, 11).map((v) => add(UA(sH - 0.025, v), mul(g.u, -0.6)));
  // tension folds radiate from the seam toward the bulge before it gives way
  const folds = a.stretch * (1 - 0.6 * clamp(tear * 2));
  const ls = litSide(g.an);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={UA(0.1, ls).x} y1={UA(0.1, ls).y} x2={UA(0.1, -ls).x} y2={UA(0.1, -ls).y}>
          <stop offset={0} stopColor={SHIRT.lit} />
          <stop offset={0.45} stopColor={SHIRT.base} />
          <stop offset={1} stopColor={SHIRT.shade} />
        </linearGradient>
        {tear > 0 && (
          <mask id={mk} maskUnits="userSpaceOnUse" x={-1000} y={-1000} width={2000} height={2000}>
            <rect x={-1000} y={-1000} width={2000} height={2000} fill="#fff" />
            <path d={closed(notch, 0.5)} fill="#000" />
          </mask>
        )}
      </defs>
      <g mask={tear > 0 ? `url(#${mk})` : undefined}>
        <path d={closed(outline, 0.9)} fill={`url(#${id})`} />
        {/* only the sleeve's top and bottom edges and its hem are inked: its back end merges into the shirt */}
        <path d={open(lin(-0.02, sH, 6).map((s) => off(s, 1)))} stroke={SHIRT.ink} strokeWidth={0.32} fill="none" strokeLinecap="round" />
        <path d={open(lin(-0.02, sH, 6).map((s) => off(s, -1)))} stroke={SHIRT.ink} strokeWidth={0.32} fill="none" strokeLinecap="round" />
        <path d={open([off(sH, 1), ...lin(0.9, -0.9, 5).map((v) => add(UA(sH, v), mul(v >= 0 ? g.an : mul(g.an, -1), gap))), off(sH, -1)])} stroke={SHIRT.ink} strokeWidth={0.32} fill="none" strokeLinecap="round" />
        {/* hem band */}
        <path d={open(lin(-1, 1, 7).map((v) => UA(sH - 0.012, v)))} stroke={SHIRT.shade} strokeWidth={0.9} fill="none" opacity={0.6} />
        <path d={open(hemSt)} stroke={SHIRT.seam} strokeWidth={0.12} strokeDasharray="0.35 0.3" fill="none" opacity={0.9} />
        {/* the stitched seam */}
        <path d={open(stitches)} stroke={SHIRT.shade} strokeWidth={0.32} fill="none" opacity={0.8} />
        <path d={open(stitches)} stroke={SHIRT.seam} strokeWidth={0.11} strokeDasharray={`0.4 ${(0.32 + 0.45 * a.stretch).toFixed(2)}`} fill="none" />
        {folds > 0.02 &&
          [0.15, 0.45, 0.75].map((k, i) => {
            const p0 = seam(k);
            const p1 = add(UA(sH - 0.05 - 0.1 * i, 0.85), mul(g.u, -0.5));
            const p2 = add(UA(sH - 0.06 - 0.12 * i, -0.6), mul(g.u, -0.3));
            return (
              <g key={i} opacity={folds}>
                <path d={open([p0, lerpP(p0, p1, 0.5), p1])} stroke={SHIRT.shade} strokeWidth={0.28} fill="none" strokeLinecap="round" />
                <path d={open([p0, lerpP(p0, p2, 0.5), p2])} stroke={SHIRT.lit} strokeWidth={0.18} fill="none" strokeLinecap="round" opacity={0.7} />
              </g>
            );
          })}
      </g>
      {/* frayed edges and stretched threads across the split */}
      {tear > 0 &&
        Array.from({length: 9}, (_, i) => {
          const k = (len * (i + 0.5)) / 9;
          const p = seam(k);
          const w = open_ * W0 * (1 - (i + 0.5) / 9) ** 0.7;
          const a0 = add(p, mul(g.an, w * 0.55)), b0 = add(p, mul(g.an, -w * 0.45));
          const broken = (i * 0.37) % 1 < clamp(tear * 1.4 - 0.2);
          const sag = mul(g.u, 0.25 * w);
          return broken ? (
            <g key={i}>
              <path d={open([a0, add(lerpP(a0, b0, 0.3), sag)])} stroke="#C9D6F5" strokeWidth={0.09} fill="none" />
              <path d={open([b0, add(lerpP(a0, b0, 0.7), sag)])} stroke="#C9D6F5" strokeWidth={0.09} fill="none" />
            </g>
          ) : (
            <path key={i} d={open([a0, add(lerpP(a0, b0, 0.5), sag), b0])} stroke="#C9D6F5" strokeWidth={0.08} fill="none" />
          );
        })}
      {tear > 0 && <path d={open(notch.slice(1, -1), 0.5)} stroke={SHIRT.ink} strokeWidth={0.22} fill="none" opacity={0.9} />}
      {tear > 0 && notch.slice(1, -1).map((p, i) => {
        const c = notch.length > 2 ? notch[Math.floor(notch.length / 2)] : p;
        const d = nrm(sub(c, p));
        const q = add(p, mul(d, 0.45 + 0.35 * ((i * 0.37) % 1)));
        return <path key={`fr${i}`} d={open([p, q])} stroke="#B9CBF5" strokeWidth={0.12} strokeLinecap="round" opacity={0.85} />;
      })}
      {/* popped stitches flying off the seam */}
      {((tear > 0.01 && tear < 0.75) || (a.pops ?? 0) > 0) &&
        Array.from({length: 10}, (_, i) => {
          const k = (i + 0.5) / 10 * Math.min(1, Math.max(len, 0.7) + 0.1);
          const p0 = seam(k);
          const u = clamp(((a.pops ?? 0) > 0 ? (a.pops ?? 0) * 1.4 : tear * 2.2) - i * 0.05);
          if (u <= 0) return null;
          const v = add(mul(g.an, 2.4 + 2.2 * ((i * 0.618) % 1)), mul(g.u, (i % 2 ? 1 : -1) * 1.6));
          const p1 = add(add(p0, mul(v, u * 2.6)), pt(0, 3.2 * u * u));
          const ang = i * 1.3 + u * 6;
          const q = add(p1, pt(Math.cos(ang) * 0.7, Math.sin(ang) * 0.7));
          return <path key={`st${i}`} d={open([p1, lerpP(p1, q, 0.5), q])} stroke="#DCE6FF" strokeWidth={0.16} fill="none" strokeLinecap="round" opacity={1 - u} />;
        })}
    </g>
  );
};

/** the fist: back of the hand to the camera, knuckles across the far end, thumb wrapped on the anterior side */
const Fist: React.FC<{a: ArmState; g: ArmFrame; stroke?: boolean}> = ({a, g, stroke}) => {
  const {W, f, fa} = g;
  const m = a.m;
  const hw = 3.9 + 0.5 * m;
  const L = HAND;
  const at = (t: number, v: number) => add(add(W, mul(f, t)), mul(fa, v));
  const body = [at(-0.6, hw * 0.78), at(2.5, hw * 1.02), at(6.2, hw * 1.05), at(L - 0.6, hw * 0.95), at(L + 0.2, hw * 0.4), at(L + 0.35, -hw * 0.3), at(L - 0.5, -hw * 0.98), at(5.8, -hw * 1.06), at(2.0, -hw * 0.95), at(-0.6, -hw * 0.72)];
  const d = closed(body, 0.85);
  if (stroke) return <path d={d} fill={SKIN.ink} stroke={SKIN.ink} strokeWidth={0.7} strokeLinejoin="round" />;
  const id = uid('fg');
  const ls = litSide(fa);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={at(4, hw * ls).x} y1={at(4, hw * ls).y} x2={at(4, -hw * ls).x} y2={at(4, -hw * ls).y}>
          <stop offset={0} stopColor={SKIN.lit} />
          <stop offset={0.5} stopColor={SKIN.mid} />
          <stop offset={1} stopColor={SKIN.shade} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {/* knuckle row and the folded fingers */}
      {[-0.62, -0.2, 0.22, 0.62].map((v, i) => (
        <g key={i}>
          <ellipse cx={at(L - 1.9, v * hw).x} cy={at(L - 1.9, v * hw).y} rx={0.85} ry={0.75} fill={SKIN.lit} opacity={0.6} />
          <path d={open([at(L - 0.9, (v - 0.2) * hw), at(L - 0.35, v * hw), at(L - 0.9, (v + 0.2) * hw)])} stroke={SKIN.ink} strokeWidth={0.12} fill="none" opacity={0.5} />
        </g>
      ))}
      {[-0.4, 0.02, 0.42].map((v, i) => (
        <path key={i} d={open([at(L - 3.0, v * hw), at(L + 0.1, v * hw)])} stroke={SKIN.shade} strokeWidth={0.14} fill="none" opacity={0.7} />
      ))}
      {/* thumb across the fingers */}
      <path d={closed([at(2.6, hw * 0.95), at(5.2, hw * 1.1), at(7.6, hw * 0.55), at(7.9, hw * 0.05), at(6.8, hw * 0.0), at(5.0, hw * 0.55), at(3.0, hw * 0.62)], 0.8)} fill={SKIN.mid} stroke={SKIN.ink} strokeWidth={0.2} strokeLinejoin="round" />
      <path d={open([at(7.5, hw * 0.35), at(7.6, hw * 0.08)])} stroke={SKIN.lit} strokeWidth={0.35} strokeLinecap="round" opacity={0.7} />
      {/* tendons on the back of the hand */}
      {[-0.5, -0.1, 0.3].map((v, i) => (
        <path key={i} d={open([at(0.5, v * hw * 0.6), at(L - 2.6, v * hw)])} stroke={SKIN.lit} strokeWidth={0.22} fill="none" opacity={0.25 + 0.35 * m} />
      ))}
      <path d={d} fill="none" stroke={SKIN.ink} strokeWidth={0.26} strokeLinejoin="round" />
    </g>
  );
};

/** the near arm: union of upper arm, elbow and forearm, cel shaded, with grooves, veins, sleeve and the cutaways */
export const Arm: React.FC<{a: ArmState; behindHand?: React.ReactNode; inCut?: React.ReactNode; cutWindow?: (g: ArmFrame) => {c: P; r: number}}> = ({a, inCut}) => {
  const g = armFrame(a);
  const {S, m} = {S: a.S, m: a.m};
  const {u, an, E, f, fa, W, UA, FA} = g;
  // tremor (shaking under load) acts on the drawn shape only
  const upper = closed([...lin(-0.12, 1.0, 18).map((s) => UA(s, 1)), add(E, mul(an, 0.4 * g.ra(1))), add(E, mul(u, 2.3)), add(E, mul(an, -0.5 * g.rp(1))), ...lin(1.0, -0.12, 18).map((s) => UA(s, -1))], 0.9);
  const fore = closed([...lin(0.04, 1, 14).map((t) => FA(t, 1)), add(W, mul(f, 0.9)), ...lin(1, 0.04, 14).map((t) => FA(t, -1)), add(E, mul(f, -2.0))], 0.9);
  const elbowR = 2.55 + 0.45 * m;
  const bis = nrm(add(an, fa));
  const olec = add(E, mul(bis, -(1.0 + 0.4 * Math.sin(a.a2 / 2))));
  const idU = uid('ug'), idF = uid('fg'), idC = uid('clip'), idHL = uid('hl');
  const lsU = litSide(an), lsF = litSide(fa);
  const midU = UA(0.5, 0), midF = FA(0.4, 0);
  const wU = (g.ra(0.5) + g.rp(0.5)) / 2, wF = (g.rfa(0.4) + g.rfp(0.4)) / 2;
  const ga = add(midU, mul(an, lsU * wU * 1.08)), gb = add(midU, mul(an, -lsU * wU * 1.08));
  const fa1 = add(midF, mul(fa, lsF * wF * 1.1)), fb1 = add(midF, mul(fa, -lsF * wF * 1.1));
  const xr = a.xray;
  const skinOp = 1 - 0.86 * xr;
  const crease = [FA(0.02, 0.82), FA(0.1, 1.02), FA(0.22, 1.08)];
  const peak = UA(0.56 + 0.05 * a.c, 0.72);
  const cut = a.cut && a.cut.r > 0.01 ? a.cut : undefined;
  const cutC = cut ? cut.c ?? UA(cut.s, cut.v) : undefined;
  const ec = a.elbowCut ?? 0;
  const ecC = add(UA(0.86, 0.15), mul(f, 1.2));
  const ecR = (12 + 2 * m) * ss(ec, 0, 1);
  const veinOp = clamp((m - 0.35) / 0.5) * 0.85 * skinOp;
  const v1 = [UA(0.36, 0.42), UA(0.5, 0.5), UA(0.66, 0.44), UA(0.8, 0.47)];
  const v2 = [UA(0.55, 0.48), UA(0.62, 0.64), UA(0.66, 0.74)];
  const v3 = [FA(0.18, 0.35), FA(0.42, 0.25), FA(0.66, 0.32), FA(0.86, 0.2)];
  const skinFill = (id: string) => (xr > 0.99 ? 'none' : `url(#${id})`);
  return (
    <g>
      <defs>
        <LimbGrad id={idU} a={ga} b={gb} k={0.5 + 0.8 * m} />
        <LimbGrad id={idF} a={fa1} b={fb1} />
        <clipPath id={idC}>
          <path d={upper} />
          <path d={fore} />
          <circle cx={E.x} cy={E.y} r={elbowR} />
        </clipPath>
        <radialGradient id={idHL}>
          <stop offset={0} stopColor="#FFF4E8" stopOpacity={0.85} />
          <stop offset={0.5} stopColor="#FFE2C8" stopOpacity={0.3} />
          <stop offset={1} stopColor="#FFE2C8" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* union outline: strokes first, fills over them */}
      <g opacity={skinOp + (1 - skinOp) * 0.0}>
        <path d={upper} fill={SKIN.ink} stroke={SKIN.ink} strokeWidth={0.62} strokeLinejoin="round" />
        <path d={fore} fill={SKIN.ink} stroke={SKIN.ink} strokeWidth={0.62} strokeLinejoin="round" />
        <circle cx={E.x} cy={E.y} r={elbowR} fill={SKIN.ink} stroke={SKIN.ink} strokeWidth={0.62} />
        <Fist a={a} g={g} stroke />
      </g>
      {xr > 0 && (
        <g>
          <path d={upper} fill="rgba(120,200,255,0.10)" stroke="rgba(170,225,255,0.95)" strokeWidth={0.32} />
          <path d={fore} fill="rgba(120,200,255,0.10)" stroke="rgba(170,225,255,0.95)" strokeWidth={0.32} />
        </g>
      )}
      <g opacity={skinOp}>
        <circle cx={E.x} cy={E.y} r={elbowR} fill={skinFill(idU)} />
        <path d={fore} fill={skinFill(idF)} />
        <path d={upper} fill={skinFill(idU)} />
        <circle cx={E.x} cy={E.y} r={elbowR * 0.92} fill={skinFill(idF)} opacity={0.55} />
        <g clipPath={`url(#${idC})`}>
          {/* elbow point in shadow */}
          <ellipse cx={olec.x} cy={olec.y} rx={2.0} ry={2.0} fill={SKIN.shade} opacity={0.55} />
          {/* the biceps/triceps groove and the edge of the biceps belly */}
          <path d={open(lin(0.22, 0.9, 8).map((s) => UA(s, -0.12 + 0.05 * Math.sin(PI * s))))} stroke={SKIN.deep} strokeWidth={0.38 + 0.35 * m} fill="none" strokeLinecap="round" opacity={0.1 + 0.45 * m} />
          <path d={open(lin(0.28, 0.86, 8).map((s) => UA(s, 0.12 + 0.1 * Math.sin(PI * (s - 0.2)))))} stroke={SKIN.shade} strokeWidth={0.3 + 0.3 * m} fill="none" strokeLinecap="round" opacity={0.05 + 0.45 * m} />
          {/* deltoid edge (seen when the sleeve has split) */}
          <path d={open([UA(0.04, 0.95), UA(0.16, 0.45), UA(0.27, -0.05), UA(0.2, -0.6)])} stroke={SKIN.shade} strokeWidth={0.3 + 0.3 * m} fill="none" opacity={0.3 + 0.3 * m} />
          {/* forearm: brachioradialis groove */}
          <path d={open(lin(0.08, 0.75, 7).map((t) => FA(t, 0.15 - 0.15 * t)))} stroke={SKIN.shade} strokeWidth={0.3 + 0.2 * m} fill="none" opacity={0.06 + 0.3 * m} />
          {/* taut skin: the highlight on the peak sharpens as it swells */}
          <ellipse cx={peak.x} cy={peak.y} rx={(4 + 5 * m) * (1 + 0.1 * a.c)} ry={(1.6 + 2.6 * m)} transform={`rotate(${(Math.atan2(u.y, u.x) * 180) / PI} ${peak.x} ${peak.y})`} fill={`url(#${idHL})`} opacity={0.55 + 0.4 * m} />
          <ellipse cx={FA(0.24, 0.55).x} cy={FA(0.24, 0.55).y} rx={2.6 + 1.6 * m} ry={1.2 + 0.8 * m} transform={`rotate(${(Math.atan2(f.y, f.x) * 180) / PI} ${FA(0.24, 0.55).x} ${FA(0.24, 0.55).y})`} fill={`url(#${idHL})`} opacity={0.45} />
          {veinOp > 0.01 && (
            <g opacity={veinOp}>
              {[v1, v2, v3].map((v, i) => (
                <g key={i}>
                  <path d={open(v)} stroke="#C47E6C" strokeWidth={0.55} fill="none" strokeLinecap="round" opacity={0.55} />
                  <path d={open(v.map((p) => add(p, mul(LIGHT, 0.14))))} stroke="#FFDCC4" strokeWidth={0.2} fill="none" strokeLinecap="round" opacity={0.8} />
                </g>
              ))}
            </g>
          )}
          {/* rim light from the cool practical on the right */}
          <path d={open(lin(0.15, 0.95, 9).map((s) => UA(s, lsU < 0 ? 0.96 : -0.96)))} stroke="#9FD8FF" strokeWidth={0.35} fill="none" opacity={0.3} />
        </g>
        {/* the forearm presses into the biceps: the crease */}
        <path d={open(crease)} stroke={SKIN.ink} strokeWidth={0.28} fill="none" strokeLinecap="round" opacity={clamp(a.a2 / 0.9)} />
      </g>
      {xr > 0 && <g opacity={clamp(xr * 1.2)}><ArmAnatomy a={a} g={g} mode="xray" /></g>}
      {/* the clean skin cutaway on the biceps, with skin, fat and fascia layers at its rim */}
      {cut && cutC && (
        <g>
          <defs>
            <clipPath id={`${idC}w`}>
              <circle cx={cutC.x} cy={cutC.y} r={cut.r} />
            </clipPath>
          </defs>
          <circle cx={cutC.x} cy={cutC.y} r={cut.r + 0.34} fill="#F7D9C4" stroke={SKIN.ink} strokeWidth={0.12} />
          <circle cx={cutC.x} cy={cutC.y} r={cut.r + 0.2} fill="#F2CE62" />
          {Array.from({length: 18}, (_, i) => {
            const ang = (i / 18) * 2 * PI;
            const p = add(cutC, mul(dir(ang), cut.r + 0.12));
            return <circle key={i} cx={p.x} cy={p.y} r={0.1} fill="#FFE7A0" />;
          })}
          <circle cx={cutC.x} cy={cutC.y} r={cut.r + 0.05} fill="#F4EEF0" />
          <g clipPath={`url(#${idC}w)`}>
            <rect x={cutC.x - cut.r} y={cutC.y - cut.r} width={2 * cut.r} height={2 * cut.r} fill="#8E1622" />
            {inCut}
            {/* the rim casts a soft shadow onto the muscle */}
            <circle cx={cutC.x - 0.25} cy={cutC.y - 0.45} r={cut.r + 0.25} fill="none" stroke="rgba(30,0,6,0.55)" strokeWidth={0.7} />
          </g>
        </g>
      )}
      {/* the elbow cutaway: muscle, tendon and bone working together (clipped to the arm, then to the window) */}
      {ec > 0.001 && (
        <g clipPath={`url(#${idC})`}>
          <defs>
            <clipPath id={`${idC}e`}>
              <circle cx={ecC.x} cy={ecC.y} r={ecR} />
            </clipPath>
          </defs>
          <circle cx={ecC.x} cy={ecC.y} r={ecR + 0.4} fill="#F7D9C4" stroke={SKIN.ink} strokeWidth={0.12} />
          <circle cx={ecC.x} cy={ecC.y} r={ecR + 0.22} fill="#F2CE62" />
          <circle cx={ecC.x} cy={ecC.y} r={ecR + 0.06} fill="#F4EEF0" />
          <g clipPath={`url(#${idC}e)`}>
            <circle cx={ecC.x} cy={ecC.y} r={ecR} fill="#4A1219" />
            <ArmAnatomy a={a} g={g} mode="cut" />
            <circle cx={ecC.x - 0.3} cy={ecC.y - 0.5} r={ecR + 0.3} fill="none" stroke="rgba(30,0,6,0.5)" strokeWidth={0.8} />
          </g>
        </g>
      )}
      <g opacity={skinOp}>
        <Fist a={a} g={g} />
      </g>
      {xr > 0 && <Fist a={{...a}} g={g} stroke={false} />}
      <Sleeve a={a} g={g} />
      {void S}
      {void W}
    </g>
  );
};

// ------------------------------------------------------------------ the rest of the character
export type Face = {brow: number; eyes: number; mouth: number; strain: number; look: P; smile?: number};
export type PersonState = {arm: ArmState; hip: P; lean: number; head: P; headTilt: number; face: Face; t: number; xray: number; farArm: number};

/** torso (turned three-quarters toward the camera), legs, head and the far arm, drawn behind the near arm */
export const Body: React.FC<{p: PersonState}> = ({p}) => {
  const {arm} = p;
  const m = arm.m;
  const S = arm.S;
  const H = p.hip;
  const K = pt(H.x + 40, H.y - 9), A = pt(H.x + 45, -9), toe = pt(H.x + 60, -1.5), heel = pt(H.x + 41, -1.5);
  const K2 = pt(K.x + 7, K.y - 3);
  const cw = 19 + 9 * m;                   // chest width across, near shoulder to far shoulder
  const backR = 8 + 6 * m;
  const FS = pt(S.x + cw, S.y + 1.5);      // far shoulder joint
  const neck = pt(S.x + cw * 0.38, S.y - 8.5);
  const stern = S.x + cw * 0.5;
  const torso = closed([
    pt(H.x - 9, H.y + 2), pt(H.x - 11, H.y - 13), pt(S.x - backR, S.y + 16), pt(S.x - backR * 0.85, S.y + 4), pt(S.x - backR * 0.35, S.y - 4.5),
    pt(neck.x - 6.5, neck.y + 2.5), pt(neck.x + 6.5, neck.y + 2.8), pt(FS.x - 4, FS.y - 6.5 - 1.5 * m), pt(FS.x + 3 + 2 * m, FS.y - 2.5), pt(FS.x + 5 + 2.5 * m, FS.y + 6),
    pt(FS.x + 2 + 1.5 * m, FS.y + 18), pt(H.x + 22 + 4 * m, H.y - 14), pt(H.x + 20, H.y + 3),
  ], 0.85);
  const thigh = closed([pt(H.x - 6, H.y + 6), pt(H.x - 6, H.y - 8), pt(K.x - 2, K.y - 7.5 - 1.5 * m), pt(K.x + 5, K.y - 1), pt(K.x + 4, K.y + 6), pt(H.x + 10, H.y + 9)], 0.9);
  const thigh2 = closed([pt(H.x + 6, H.y + 2), pt(H.x + 6, H.y - 10), pt(K2.x - 2, K2.y - 7.5 - 1.5 * m), pt(K2.x + 5, K2.y - 1), pt(K2.x + 4, K2.y + 6), pt(H.x + 16, H.y + 6)], 0.9);
  const shin = closed([pt(K.x - 3.5, K.y), pt(K.x + 5, K.y), pt(A.x + 3.2, A.y - 2), pt(A.x - 3, A.y - 1), pt(K.x - 4.8, K.y + 14)], 0.9);
  const shin2 = closed([pt(K2.x - 3.5, K2.y), pt(K2.x + 5, K2.y), pt(A.x + 10, A.y - 4), pt(A.x + 4.5, A.y - 3), pt(K2.x - 4.4, K2.y + 14)], 0.9);
  const shoe = (h: P, a: P, tt: P) => closed([pt(h.x - 1, h.y + 1.5), pt(h.x - 1.5, h.y - 6), pt(a.x + 4, a.y - 4), pt(tt.x - 3, tt.y - 4.5), pt(tt.x + 1, tt.y - 1), pt(tt.x, tt.y + 1.5)], 0.8);
  const idT = uid('tg'), idL = uid('lg'), idC = uid('tc');
  // the far arm: from the far shoulder down to a hand resting on the far knee
  const fe = pt(FS.x + 4 + 2 * m, FS.y + 25), fh = pt(K2.x - 1, K2.y - 6);
  const r1 = 4.4 + 3.6 * m, r2 = 3.2 + 1.8 * m;
  const n1 = rot(nrm(sub(fe, FS)), PI / 2), n2 = rot(nrm(sub(fh, fe)), PI / 2);
  const farArm = closed([add(FS, mul(n1, r1 * 1.1)), add(lerpP(FS, fe, 0.45), mul(n1, r1 * 1.15)), add(fe, mul(n1, r2)), add(fe, mul(n2, r2)), add(fh, mul(n2, 2.3)), add(fh, mul(n2, -2.3)), add(fe, mul(n2, -r2)), add(lerpP(FS, fe, 0.45), mul(n1, -r1)), add(FS, mul(n1, -r1))], 0.85);
  const farSkin = mix(SKIN.shade, '#2A3550', 0.18);
  return (
    <g>
      <defs>
        <linearGradient id={idT} x1="0" y1="0" x2="1" y2="0.25">
          <stop offset={0} stopColor={SHIRT.shade} />
          <stop offset={0.45} stopColor={SHIRT.base} />
          <stop offset={0.72} stopColor={SHIRT.lit} />
          <stop offset={1} stopColor={SHIRT.base} />
        </linearGradient>
        <linearGradient id={idL} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#3A3F4E" />
          <stop offset={1} stopColor="#1E2230" />
        </linearGradient>
        <clipPath id={idC}><path d={torso} /></clipPath>
      </defs>
      {/* far leg, far arm */}
      <path d={shin2} fill={mix(SKIN.mid, '#2A3550', 0.2)} stroke={SKIN.ink} strokeWidth={0.5} />
      <path d={shoe(pt(heel.x + 6, heel.y - 2), pt(A.x + 7, A.y - 2), pt(toe.x + 6, toe.y - 2))} fill="#C9CED8" stroke="#2A2F3C" strokeWidth={0.5} />
      <path d={thigh2} fill="#1A1D28" stroke="#0E1018" strokeWidth={0.5} />
      <path d={farArm} fill={farSkin} stroke={SKIN.ink} strokeWidth={0.5} />
      <ellipse cx={fh.x + 1.2} cy={fh.y} rx={4.2} ry={3.3} fill={farSkin} stroke={SKIN.ink} strokeWidth={0.45} />
      {/* near leg */}
      <path d={shin} fill={SKIN.mid} stroke={SKIN.ink} strokeWidth={0.5} />
      <path d={shoe(heel, A, toe)} fill="#E9ECF2" stroke="#2A2F3C" strokeWidth={0.5} />
      <path d={open([pt(heel.x - 1, heel.y), pt(toe.x, toe.y)])} stroke="#C23B3B" strokeWidth={1.2} />
      <path d={thigh} fill={`url(#${idL})`} stroke="#0E1018" strokeWidth={0.5} />
      {/* torso in the fitted tee: chest toward the camera, the far shoulder cap on the right */}
      <path d={torso} fill={`url(#${idT})`} stroke={SHIRT.ink} strokeWidth={0.55} strokeLinejoin="round" />
      <g clipPath={`url(#${idC})`}>
        {/* pecs: the near one broad, the far one foreshortened; the sternum line between them */}
        <path d={open([pt(S.x + 1, S.y + 3), pt(S.x + cw * 0.3, S.y + 12 + 2 * m), pt(stern - 1, S.y + 13 + 2 * m)])} stroke={SHIRT.shade} strokeWidth={0.75} fill="none" opacity={0.75} strokeLinecap="round" />
        <path d={open([pt(stern + 0.5, S.y + 13 + 2 * m), pt(stern + cw * 0.28, S.y + 12 + 1.5 * m), pt(FS.x - 1, FS.y + 5)])} stroke={SHIRT.shade} strokeWidth={0.65} fill="none" opacity={0.7} strokeLinecap="round" />
        <path d={open([pt(stern, S.y - 2), pt(stern - 0.4, S.y + 12)])} stroke={SHIRT.shade} strokeWidth={0.5} fill="none" opacity={0.55} />
        <ellipse cx={S.x + cw * 0.32} cy={S.y + 6} rx={cw * 0.2} ry={4 + m} fill={SHIRT.lit} opacity={0.35} />
        <ellipse cx={stern + cw * 0.22} cy={S.y + 6} rx={cw * 0.14} ry={3.4 + m} fill={SHIRT.lit} opacity={0.25} />
        {/* abs under the stretched shirt, and the far deltoid's edge */}
        {[0, 1, 2].map((k) => <path key={k} d={open([pt(stern - 3.2, S.y + 19 + k * 5.2), pt(stern + 3.4, S.y + 19.4 + k * 5.2)])} stroke={SHIRT.shade} strokeWidth={0.4} fill="none" opacity={0.35 * m} />)}
        <path d={open([pt(FS.x - 5, FS.y - 4), pt(FS.x - 1.5, FS.y + 4), pt(FS.x + 1, FS.y + 10)])} stroke={SHIRT.shade} strokeWidth={0.55} fill="none" opacity={0.6} />
        <path d={open([pt(S.x - backR * 0.6, S.y + 20), pt(S.x, S.y + 24), pt(S.x + 8, S.y + 23.5)])} stroke={SHIRT.shade} strokeWidth={0.45} fill="none" opacity={0.5} />
      </g>
      {/* neck: thick, with the near sternomastoid; a crew collar in three-quarters */}
      <path d={closed([pt(neck.x - 6, neck.y + 3.2), pt(neck.x - 5.6, neck.y - 7), pt(neck.x + 5, neck.y - 8), pt(neck.x + 6.2, neck.y + 3.4)], 0.6)} fill={SKIN.mid} stroke={SKIN.ink} strokeWidth={0.45} />
      <path d={open([pt(neck.x - 3.5, neck.y - 6), pt(neck.x + 0.5, neck.y + 1), pt(neck.x + 2.5, neck.y + 3)])} stroke={SKIN.shade} strokeWidth={0.5} fill="none" opacity={0.7} />
      <path d={`M${neck.x - 6.6} ${neck.y + 2.6} Q${neck.x} ${neck.y + 6.4} ${neck.x + 6.8} ${neck.y + 2.9}`} stroke={SHIRT.shade} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Head p={p} />
    </g>
  );
};

/** where the head sits for a given near-shoulder position (the neck is part of the torso) */
export const headFor = (S: P, m: number) => pt(S.x + (19 + 9 * m) * 0.38 - 1.5, S.y - 22.5);

/** the head in a fixed three-quarter view (turned toward screen right). The face is one rigid design: brows, eyes and
 *  mouth sit on the face plane and only open, close or lift; the whole head tilts as one piece; the pupils move inside
 *  the eyes. Both eyes stay inside the silhouette, the far one foreshortened beside the bridge of the nose. */
export const Head: React.FC<{p: PersonState}> = ({p}) => {
  const c = p.head;
  const F = p.face;
  const id = uid('hd'), idC = uid('hc');
  const smile = F.smile ?? 0;
  const P_ = (x: number, y: number) => pt(c.x + x, c.y + y);
  const skull = closed([P_(-8.7, -1.6), P_(-7.6, -7.6), P_(-3.2, -11.2), P_(2.6, -11.6), P_(7.2, -9.0), P_(9.0, -4.4), P_(9.3, 0.4), P_(8.7, 4.6), P_(7.4, 8.0), P_(4.6, 10.3), P_(1.6, 10.5), P_(-2.8, 8.4), P_(-6.0, 4.9), P_(-8.1, 1.8)], 0.9);
  const open_ = clamp(0.25 + 0.75 * F.eyes - 0.35 * F.strain);
  const lk = pt(clamp(F.look.x, -1, 1), clamp(F.look.y, -1, 1));
  const eye = (cx: number, cy: number, rx: number, ry: number, k: number) => {
    const e = P_(cx, cy);
    const ryo = ry * (0.35 + 0.65 * open_);
    const px = e.x + lk.x * rx * 0.38, py = e.y + lk.y * ryo * 0.3;
    const ir = Math.min(rx, ry) * 0.62;
    const idE = `${id}e${k}`;
    return (
      <g key={k}>
        <defs><clipPath id={idE}><ellipse cx={e.x} cy={e.y} rx={rx} ry={ryo} /></clipPath></defs>
        <ellipse cx={e.x} cy={e.y} rx={rx} ry={ryo} fill="#FFFFFF" />
        <g clipPath={`url(#${idE})`}>
          <circle cx={px} cy={py} r={ir} fill="#4A3220" />
          <circle cx={px} cy={py} r={ir * 0.52} fill="#0B0705" />
          <circle cx={px - ir * 0.35} cy={py - ir * 0.4} r={ir * 0.28} fill="#FFFFFF" />
          {/* upper lid shadow */}
          <ellipse cx={e.x} cy={e.y - ryo * 1.05} rx={rx * 1.1} ry={ryo * 0.45} fill={SKIN.shade} opacity={0.35} />
        </g>
        <path d={`M${e.x - rx * 1.08} ${e.y + ryo * 0.1} Q${e.x} ${e.y - ryo * 1.5} ${e.x + rx * 1.08} ${e.y - ryo * 0.05}`} stroke={SKIN.ink} strokeWidth={0.42} fill="none" strokeLinecap="round" />
        <path d={`M${e.x - rx * 0.8} ${e.y + ryo * 0.75} Q${e.x} ${e.y + ryo * 1.12} ${e.x + rx * 0.85} ${e.y + ryo * 0.6}`} stroke={SKIN.shade} strokeWidth={0.22} fill="none" opacity={0.8} />
      </g>
    );
  };
  // brows: attached to the brow ridge; they lift, lower and pinch, and never leave it
  const bl = 1.5 * F.brow - 1.0 * F.strain;
  const brow = (x0: number, x1: number, y: number, w: number, inner: number) => (
    <path d={open([P_(x0, y - bl * 0.75 + inner), P_((x0 + x1) / 2, y - bl - 0.5), P_(x1, y - bl * 0.85)])} stroke="#2B1C14" strokeWidth={w} fill="none" strokeLinecap="round" />
  );
  const mo = F.mouth;
  const mC = P_(4.9, 6.0);
  return (
    <g transform={`rotate(${p.headTilt} ${c.x + 1} ${c.y + 9})`}>
      <defs>
        <radialGradient id={id} cx="0.66" cy="0.38" r="0.8">
          <stop offset={0} stopColor={SKIN.lit} />
          <stop offset={0.55} stopColor={SKIN.mid} />
          <stop offset={1} stopColor={SKIN.shade} />
        </radialGradient>
        <clipPath id={idC}><path d={skull} /></clipPath>
      </defs>
      <path d={skull} fill={`url(#${id})`} stroke={SKIN.ink} strokeWidth={0.45} strokeLinejoin="round" />
      <g clipPath={`url(#${idC})`}>
        {/* the near side of the face turns away from the light: cheek and jaw plane */}
        <path d={closed([P_(-9, -2), P_(-5, -3), P_(-2.5, 3.8), P_(-0.5, 8.4), P_(-3, 11), P_(-9, 6)], 0.8)} fill={SKIN.shade} opacity={0.22} />
        {/* hair: short, dark, a side part; hairline over the forehead to a sideburn by the ear */}
        <path d={closed([P_(-9.2, 0.6), P_(-9.2, -7), P_(-4.8, -12.4), P_(2.6, -13.2), P_(8.2, -10.6), P_(9.6, -6.4), P_(7.6, -6.6), P_(4.6, -7.6), P_(1.0, -7.4), P_(-2.6, -6.0), P_(-3.8, -3.2), P_(-4.3, 0.6), P_(-5.8, 1.2)], 0.85)} fill="#2B1C14" />
        <path d={open([P_(-5.4, -10.4), P_(0.2, -11.4), P_(5.4, -10.4)])} stroke="#5A4232" strokeWidth={0.55} fill="none" strokeLinecap="round" />
        <path d={open([P_(1.6, -12.4), P_(3.2, -9.4)])} stroke="#140C08" strokeWidth={0.35} fill="none" />
        {/* cheek warmth */}
        <ellipse cx={c.x + 1.6} cy={c.y + 3.6} rx={2.4} ry={1.4} fill="#F08C78" opacity={0.22} />
      </g>
      {/* near ear */}
      <path d={closed([P_(-4.6, -2.4), P_(-6.6, -3.0), P_(-7.6, -0.6), P_(-7.0, 2.6), P_(-5.0, 3.4), P_(-4.4, 1.2)], 0.9)} fill={SKIN.mid} stroke={SKIN.ink} strokeWidth={0.35} />
      <path d={open([P_(-5.4, -1.6), P_(-6.6, -0.2), P_(-5.6, 2.2)])} stroke={SKIN.shade} strokeWidth={0.4} fill="none" />
      {/* eyes (the far one foreshortened beside the nose bridge) */}
      {eye(1.1, -1.5, 1.85, 1.3, 0)}
      {eye(6.9, -1.7, 1.15, 1.22, 1)}
      {brow(-1.0, 3.0, -4.0, 0.95, 0.3 * F.strain)}
      {brow(5.7, 8.3, -4.2, 0.75, -0.3 * F.strain)}
      {/* nose: the bridge, the tip just inside the far cheek, the shadowed underside */}
      <path d={open([P_(5.2, -1.4), P_(6.4, 1.2), P_(7.5, 2.8), P_(6.6, 3.7), P_(5.2, 3.5)])} stroke={SKIN.ink} strokeWidth={0.42} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={closed([P_(5.0, -1.0), P_(6.1, 1.4), P_(5.0, 3.2), P_(4.3, 1.6)], 0.8)} fill={SKIN.shade} opacity={0.35} />
      <ellipse cx={c.x + 6.2} cy={c.y + 3.5} rx={0.45} ry={0.25} fill={SKIN.deep} />
      {/* mouth: a set line, a grin, gritted teeth when straining, a small open "o" in surprise */}
      {mo > 0.05 ? (
        <path d={closed([P_(3.3, 6.0), P_(4.9, 5.6 - 0.1 * mo), P_(6.7, 5.8), P_(6.3, 6.3 + 1.6 * mo), P_(4.8, 6.6 + 2.0 * mo), P_(3.6, 6.3 + 1.2 * mo)], 0.8)} fill="#5A1E1E" stroke={SKIN.ink} strokeWidth={0.3} />
      ) : F.strain > 0.3 ? (
        <g>
          <path d={closed([P_(2.9, 5.6), P_(7.0, 5.3), P_(6.8, 6.9), P_(3.1, 7.1)], 0.4)} fill="#FFFFFF" stroke={SKIN.ink} strokeWidth={0.32} />
          <path d={open([P_(3.0, 6.25), P_(6.9, 6.05)])} stroke={SKIN.shade} strokeWidth={0.16} fill="none" />
          {[4.0, 5.0, 6.0].map((x, i) => <path key={i} d={open([P_(x, 5.5), P_(x, 7.0)])} stroke={SKIN.shade} strokeWidth={0.12} />)}
        </g>
      ) : (
        <path d={open([P_(2.9, 6.0 - 0.3 * smile), mC, P_(6.9, 5.6 - 0.6 * smile)].map((q, i) => (i === 1 ? pt(q.x, q.y + 0.35 * smile) : q)))} stroke={SKIN.ink} strokeWidth={0.42} fill="none" strokeLinecap="round" />
      )}
      {/* jaw line and chin */}
      <path d={open([P_(-4.6, 6.2), P_(-0.6, 9.4), P_(2.6, 10.3)])} stroke={SKIN.shade} strokeWidth={0.5} fill="none" opacity={0.55} />
      <path d={open([P_(3.4, 9.6), P_(5.0, 9.9), P_(6.2, 9.2)])} stroke={SKIN.shade} strokeWidth={0.35} fill="none" opacity={0.6} />
      {F.strain > 0.5 && <path d={`M${c.x + 4.8} ${c.y - 7.6} q0.6 1.4 0 2.0 q-0.6 -0.6 0 -2.0Z`} fill="#CDEBFF" opacity={(F.strain - 0.5) * 1.6} stroke="#6E9AB8" strokeWidth={0.1} />}
    </g>
  );
};

/** heavy dumbbell, handle axis in the picture plane (forward-back), plates seen nearly edge-on with a 3/4 face */
export const DUMB_R = 18;
export const Dumbbell: React.FC<{h: P; tilt?: number}> = ({h, tilt = 0}) => {
  const id = uid('db');
  // plates seen at three-quarters: an ellipse face, its rim and thickness, a hub
  const plate = (x: number, w: number, r: number, k: number) => {
    const rx = r * 0.42;
    return (
      <g key={k}>
        <path d={`M${x - w / 2} ${-r} A${rx} ${r} 0 0 0 ${x - w / 2} ${r} L${x + w / 2} ${r} A${rx} ${r} 0 0 0 ${x + w / 2} ${-r} Z`} fill="#0B0C10" stroke="#05060A" strokeWidth={0.4} />
        <ellipse cx={x + w / 2} cy={0} rx={rx} ry={r} fill={`url(#${id})`} stroke="#05060A" strokeWidth={0.4} />
        <ellipse cx={x + w / 2} cy={0} rx={rx * 0.78} ry={r * 0.8} fill="none" stroke="#3A404C" strokeWidth={0.45} />
        <ellipse cx={x + w / 2} cy={0} rx={rx * 0.22} ry={r * 0.2} fill="#9AA2AE" stroke="#2A2E36" strokeWidth={0.25} />
        <path d={`M${x + w / 2 - rx * 0.55} ${-r * 0.72} A${rx * 0.9} ${r * 0.9} 0 0 0 ${x + w / 2 - rx * 0.86} ${r * 0.1}`} stroke="#8D95A6" strokeWidth={0.4} fill="none" opacity={0.7} />
      </g>
    );
  };
  return (
    <g transform={`translate(${h.x} ${h.y}) rotate(${tilt})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#4A505E" />
          <stop offset={0.35} stopColor="#23262E" />
          <stop offset={1} stopColor="#0E1014" />
        </linearGradient>
      </defs>
      {/* far plates, the handle, then the near plates (the hand sits between them) */}
      {[-14.5, -11.2].map((x, k) => plate(x, 3.0, k === 0 ? DUMB_R - 2.2 : DUMB_R, k))}
      <rect x={-9.5} y={-1.4} width={19} height={2.8} rx={1.2} fill="#A4ACB8" stroke="#2A2E36" strokeWidth={0.3} />
      {[-6.5, -4.5, -2.5, -0.5, 1.5, 3.5, 5.5].map((x, k) => <path key={k} d={`M${x} -1.3 l0.6 2.6`} stroke="#6E7682" strokeWidth={0.18} />)}
      {[8.2, 11.5].map((x, k) => plate(x, 3.0, k === 1 ? DUMB_R - 2.2 : DUMB_R, k + 2))}
    </g>
  );
};

/** a low flat bench, side view */
export const Bench: React.FC<{x0: number; x1: number; top: number}> = ({x0, x1, top}) => (
  <g>
    <rect x={x0 + 6} y={top + 5} width={4} height={-top - 5} fill="#2A2D36" stroke="#090A0E" strokeWidth={0.4} />
    <rect x={x1 - 12} y={top + 5} width={4} height={-top - 5} fill="#2A2D36" stroke="#090A0E" strokeWidth={0.4} />
    <rect x={x0} y={-3} width={x1 - x0} height={3} rx={1.2} fill="#31343E" stroke="#090A0E" strokeWidth={0.4} />
    <rect x={x0} y={top} width={x1 - x0} height={6.5} rx={2.6} fill="#1A1C24" stroke="#07080B" strokeWidth={0.5} />
    <rect x={x0 + 1.5} y={top + 0.6} width={x1 - x0 - 3} height={1.4} rx={0.7} fill="#3E4250" opacity={0.8} />
  </g>
);

export const tremorAt = (t: number, k: number) => k * (0.6 * noise1(t * 23, 3) + 0.4 * noise1(t * 41, 7));
void rgba;
/** centre of the dumbbell handle held in the fist */
export const handleAt = (a: ArmState) => {
  const g = armFrame(a);
  return add(g.W, mul(g.f, 4.6));
};
