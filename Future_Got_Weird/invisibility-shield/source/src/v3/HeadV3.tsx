// V3 heads: the V2 head (below) with a readable profile (brow, nose, lips and chin points join the silhouette), the
// fringe kept to the front of the skull (from the side it no longer wraps round the face like goggles), and hair lift
// for secondary motion (tufts and locks trail the head's movement through `sway` and bounce through `lift`).
// V2 notes: a head is an ellipsoid with a jaw in its own 3D frame (F forward, Rt its right, U up), drawn with an
// orthographic projection at its screen centre. Every facial feature is drawn in 2D on its own tangent plane and placed
// with that plane's projected axes (an SVG affine matrix), so eyes, brows, mouth and ears foreshorten and turn away
// correctly at any angle, and features on the far side fade out. The silhouette is the hull of the ellipsoid's outline
// and the chin/nose points, so profiles have a jaw and a nose; the face/hair boundary is a projected hairline cap. One
// model reads from the front, three-quarter, profile and back.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {INK} from '../lib/ink';
import {a3, Basis, d3, fmt, hull, m3, n3, V2, V3, v3} from '../v2/p3';
import {clamp, lerp} from '../lib/math';

export type HeadExpr = {
  lid: number; // upper lid closure 0..1
  squint: number; // lower lid raise 0..1
  wide: number; // eyes widened (surprise) 0..1
  browIn: number; // inner brow raise (worry) -1..1
  browDown: number; // brows lowered (suspicion/focus) 0..1
  browAsym: number; // one brow raised (mischief/doubt) -1..1
  smile: number; // -1..1
  open: number; // mouth open 0..1
  smirk: number; // one-sided smile 0..1
  gx: number; gy: number; // gaze offset -1..1
};
export const EXP0: HeadExpr = {lid: 0.08, squint: 0, wide: 0, browIn: 0, browDown: 0, browAsym: 0, smile: 0.1, open: 0, smirk: 0, gx: 0, gy: 0};
export const mixE = (a: HeadExpr, b: HeadExpr, t: number): HeadExpr => {
  const o = {} as HeadExpr;
  (Object.keys(a) as (keyof HeadExpr)[]).forEach((k) => (o[k] = lerp(a[k], b[k], clamp(t))));
  return o;
};

export type HeadStyle = 'woman' | 'guard';
export const HC = {
  woman: {skin: '#EBB993', skinDeep: '#C98D6A', hair: '#1D1A25', hairHi: '#4B4560', lip: '#B85E58', iris: '#6A4430', cheek: '#E58B7A', cap: '', capHi: '', badge: '', brow: '#1D1A25'},
  guard: {skin: '#C68E66', skinDeep: '#9C6747', hair: '#3A2C24', hairHi: '#5A4636', lip: '#8E4F3E', iris: '#3B2A20', cheek: '#C9785F', cap: '#1E2B45', capHi: '#34466A', badge: '#E8B84A', brow: '#2A1E18'},
};

type Props = {
  id: string;
  b: Basis;
  c: {x: number; y: number};
  R: number; // px per head radius
  F: V3; Rt: V3; U: V3;
  style: HeadStyle;
  e: HeadExpr;
  blink?: number;
  sway?: number;
  lift?: number;
  inkW?: number;
};

const AX = 0.86, AY = 1.0, AZ = 0.92;

export const HeadV3: React.FC<Props> = ({id, b, c, R, F, Rt, U, style, e, blink = 0, sway = 0, lift = 0, inkW = 3}) => {
  const C = HC[style];
  const W = (lx: number, ly: number, lz: number): V3 => a3(a3(m3(Rt, lx), m3(U, ly)), m3(F, lz));
  const Pw = (w: V3): V2 => ({x: c.x + d3(w, b.right) * R, y: c.y - d3(w, b.up) * R});
  const P = (lx: number, ly: number, lz: number) => Pw(W(lx, ly, lz));
  const vis = (n: V3) => -d3(n, b.fwd);
  const S = (az: number, el: number) => ({lx: AX * Math.sin(az) * Math.cos(el), ly: AY * Math.sin(el), lz: AZ * Math.cos(az) * Math.cos(el)});
  const nrm = (az: number, el: number) => n3(W(Math.sin(az) * Math.cos(el) / AX, Math.sin(el) / AY, Math.cos(az) * Math.cos(el) / AZ));
  const place = (az: number, el: number, lift = 1) => {
    const s = S(az, el);
    const p = P(s.lx * lift, s.ly * lift, s.lz * lift);
    const tu = n3(W(Math.cos(az), 0, -Math.sin(az)));
    const tv = n3(W(-Math.sin(az) * Math.sin(el), Math.cos(el), -Math.cos(az) * Math.sin(el)));
    const ux = d3(tu, b.right) * R, uy = -d3(tu, b.up) * R;
    const vx = d3(tv, b.right) * R, vy = -d3(tv, b.up) * R;
    return {m: `matrix(${fmt(ux)} ${fmt(uy)} ${fmt(-vx)} ${fmt(-vy)} ${fmt(p.x)} ${fmt(p.y)})`, v: vis(nrm(az, el))};
  };
  // outline of a projected ellipsoid (support points), plus jaw and nose points: convex hull -> silhouette
  const ellOutline = (sx: number, sy: number, sz: number, off: V3 = v3(0, 0, 0), n = 36): V2[] => {
    const ax = [m3(Rt, AX * sx), m3(U, AY * sy), m3(F, AZ * sz)].map((v) => ({x: d3(v, b.right), y: -d3(v, b.up)}));
    const o = Pw(off);
    const out: V2[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      const hz = Math.sqrt(ax.reduce((s, q) => s + (q.x * dx + q.y * dy) ** 2, 0)) || 1;
      const pt = ax.reduce((s, q) => {
        const w = (q.x * dx + q.y * dy) / hz;
        return {x: s.x + q.x * w, y: s.y + q.y * w};
      }, {x: 0, y: 0});
      out.push({x: o.x + pt.x * R, y: o.y + pt.y * R});
    }
    return out;
  };
  const isW = style === 'woman';
  const jaw = [P(0, -1.13, 0.5), P(0.42, -0.86, 0.5), P(-0.42, -0.86, 0.5), P(0.62, -0.55, 0.3), P(-0.62, -0.55, 0.3)];
  const noseTip = P(0, -0.3, AZ + (isW ? 0.16 : 0.2));
  // profile points on the centre line: brow, nose bridge, upper lip, lower lip, chin
  const prof = [P(0, 0.3, AZ + 0.01), P(0, 0.02, AZ + 0.05), P(0, -0.48, AZ + 0.045), P(0, -0.66, AZ + 0.0), P(0, -0.92, AZ - 0.1)];
  const sil = hull([...ellOutline(1, 1, 1), ...jaw, noseTip, ...prof]);
  const silD = smoothClosed(sil);
  // face region: ear line (az +-1.5) up to the hairline, the hairline across, down to under the chin
  const hl = isW ? 0.5 : 0.52;
  // face region: the visible part of the face cap (ear line to ear line, chin to hairline), as a hull of its visible
  // sample points and the jaw points: stays correct from the front, in three-quarter and in profile
  const face: V2[] = [];
  for (let i = 0; i <= 12; i++) {
    for (let k = 0; k <= 8; k++) {
      const az = lerp(-1.5, 1.5, i / 12);
      const el = lerp(-1.25, hl + (isW ? 0.05 : 0.08) * Math.cos((az / 1.5) * Math.PI * 0.5), k / 8);
      if (vis(nrm(az, el)) < -0.02) continue;
      const s0 = S(az, el);
      face.push(P(s0.lx, s0.ly, s0.lz));
    }
  }
  face.push(...jaw.slice(0, 3), noseTip);
  const faceH = face.length >= 3 ? hull(face) : [];
  const faceD = faceH.length >= 3 ? smoothClosed(faceH, 0.08) : '';
  const fc = vis(F);
  const skinG = `${id}-sk`, hairG = `${id}-hr`;

  // ---- eyes
  const bl = clamp(blink + e.lid * 0.85);
  const Eye = (side: 1 | -1) => {
    const pl = place(side * 0.37, 0.0);
    if (pl.v < 0.06) return null;
    const w = isW ? 0.235 : 0.19;
    const h0 = (isW ? 0.21 : 0.16) * (1 + 0.32 * e.wide) * (1 - 0.45 * e.squint);
    const h = Math.max(0.01, h0 * (1 - bl));
    const gx = e.gx * 0.07, gy = -e.gy * 0.06;
    const ir = (isW ? 0.105 : 0.08) * (1 - 0.12 * e.wide);
    const eid = `${id}-e${side}`;
    const top = -h * 1.2, botm = h * (isW ? 0.95 : 1.0);
    const almond = `M${-w},0 C${-w * 0.55},${fmt(top)} ${w * 0.55},${fmt(top)} ${w},${fmt(-h * 0.12)} C${w * 0.55},${fmt(botm)} ${-w * 0.5},${fmt(botm)} ${-w},0 Z`;
    return (
      <g key={side} transform={pl.m} opacity={clamp(pl.v * 4)}>
        <defs>
          <clipPath id={`${eid}-c`}>
            <path d={almond} />
          </clipPath>
        </defs>
        {h > 0.025 ? (
          <>
            <path d={almond} fill="#FCFAF6" />
            <g clipPath={`url(#${eid}-c)`}>
              <circle cx={gx} cy={gy + 0.01} r={ir} fill={C.iris} />
              <circle cx={gx} cy={gy + 0.01} r={ir * 0.82} fill={mix(C.iris, '#000000', 0.25)} opacity={0.5} />
              <circle cx={gx} cy={gy + 0.01} r={ir * 0.48} fill="#120C0A" />
              <circle cx={gx + ir * 0.38} cy={gy - ir * 0.38} r={ir * 0.3} fill="#FFFFFF" />
              <circle cx={gx - ir * 0.35} cy={gy + ir * 0.4} r={ir * 0.12} fill="#FFFFFF" opacity={0.8} />
              <path d={`M${-w},${fmt(top)} L${w},${fmt(top)} L${w},${fmt(top + h * 0.55)} Q0,${fmt(top + h * 0.35)} ${-w},${fmt(top + h * 0.55)} Z`} fill={shade(C.skin, 0.35)} opacity={0.22} />
            </g>
            <path d={`M${-w * 1.04},0.01 C${-w * 0.55},${fmt(top)} ${w * 0.55},${fmt(top)} ${w * 1.05},${fmt(-h * 0.12)}`} fill="none" stroke={INK} strokeWidth={isW ? 0.05 : 0.036} strokeLinecap="round" />
            {isW && <path d={`M${w * 0.78},${fmt(-h * 0.55)} l0.075,-0.045 M${w * 1.0},${fmt(-h * 0.16)} l0.085,-0.01`} stroke={INK} strokeWidth={0.03} strokeLinecap="round" />}
            {e.squint > 0.2 && <path d={`M${-w * 0.8},${fmt(botm * 0.9)} Q0,${fmt(botm * 1.15)} ${w * 0.8},${fmt(botm * 0.9)}`} fill="none" stroke={C.skinDeep} strokeWidth={0.025} opacity={e.squint} />}
          </>
        ) : (
          <path d={`M${-w},0 Q0,0.06 ${w},0`} fill="none" stroke={INK} strokeWidth={0.045} strokeLinecap="round" />
        )}
      </g>
    );
  };
  const Brow = (side: 1 | -1) => {
    const pl = place(side * 0.38, 0.3 - 0.07 * e.browDown + 0.07 * e.wide);
    if (pl.v < 0.06) return null;
    const asym = side * e.browAsym * 0.07;
    const inner = -0.07 * e.browIn - asym + 0.03 * e.browDown;
    const outer = 0.02 * e.browIn - asym * 0.5 - 0.01;
    const th = isW ? 0.06 : 0.08;
    const xi = -side * 0.15, xo = side * 0.2;
    return (
      <g key={`b${side}`} transform={pl.m} opacity={clamp(pl.v * 4)}>
        <path d={`M${fmt(xi)},${fmt(inner)} Q${fmt(side * 0.03)},${fmt(-0.06 + (inner + outer) / 2)} ${fmt(xo)},${fmt(outer + 0.03)}`} fill="none" stroke={C.brow} strokeWidth={th} strokeLinecap="round" />
      </g>
    );
  };
  // nose: a filled wedge on the centre line (reads as a cartoon nose from the front, a profile nose from the side)
  const nose = (() => {
    const root = P(0, -0.04, AZ - 0.02), tip = noseTip, bl2 = P(0.09, -0.34, AZ - 0.0), br = P(-0.09, -0.34, AZ - 0.0);
    const under = P(0, -0.37, AZ + 0.02);
    return (
      <g>
        <path d={`M${fmt(root.x)},${fmt(root.y)} Q${fmt(tip.x)},${fmt(tip.y)} ${fmt(bl2.x)},${fmt(bl2.y)} Q${fmt(under.x)},${fmt(under.y)} ${fmt(br.x)},${fmt(br.y)} Q${fmt(tip.x)},${fmt(tip.y)} ${fmt(root.x)},${fmt(root.y)} Z`} fill={shade(C.skin, 0.06)} opacity={fc > -0.3 ? 1 : 0} />
        <path d={`M${fmt(root.x)},${fmt(root.y)} Q${fmt(tip.x)},${fmt(tip.y)} ${fmt(under.x)},${fmt(under.y)}`} fill="none" stroke={shade(C.skin, 0.5)} strokeWidth={Math.max(1, R * 0.03)} strokeLinecap="round" opacity={clamp((fc + 0.3) * 2)} />
      </g>
    );
  })();
  const mouth = (() => {
    const pl = place(0, -0.56);
    if (pl.v < 0.05) return null;
    const w = 0.19 * (1 - 0.25 * e.open);
    const cy = -e.smile * 0.05;
    const sk = e.smirk * 0.07;
    const op = e.open * 0.18;
    return (
      <g transform={pl.m} opacity={clamp(pl.v * 4)}>
        {op > 0.012 ? (
          <path d={`M${-w},${fmt(cy)} Q0,-0.035 ${w},${fmt(cy - sk)} Q0,${fmt(op * 2.2)} ${-w},${fmt(cy)} Z`} fill="#5A1F25" stroke={INK} strokeWidth={0.028} />
        ) : (
          <path d={`M${-w},${fmt(cy)} Q0,${fmt(0.05 + e.smile * 0.07)} ${w},${fmt(cy - sk)}`} fill="none" stroke={isW ? C.lip : INK} strokeWidth={isW ? 0.05 : 0.04} strokeLinecap="round" />
        )}
        {!isW && <path d="M-0.2,-0.15 Q0,-0.24 0.2,-0.15 Q0.1,-0.08 0,-0.1 Q-0.1,-0.08 -0.2,-0.15 Z" fill={C.hair} />}
      </g>
    );
  })();
  const Ear = (side: 1 | -1) => {
    const pl = place(side * 1.52, -0.08);
    if (pl.v < -0.2) return null;
    return (
      <g key={`ear${side}`} transform={pl.m}>
        <ellipse cx={0} cy={0} rx={0.11} ry={0.17} fill={C.skin} stroke={INK} strokeWidth={0.03} />
        <path d="M-0.02,-0.09 Q0.06,0 -0.02,0.09" fill="none" stroke={C.skinDeep} strokeWidth={0.03} />
      </g>
    );
  };
  const Cheek = (side: 1 | -1) => {
    const pl = place(side * 0.5, -0.33);
    if (pl.v < 0.1) return null;
    return <ellipse key={`ck${side}`} transform={pl.m} cx={0} cy={0} rx={0.14} ry={0.085} fill={C.cheek} opacity={0.3 * clamp(pl.v * 3)} />;
  };

  // ---- hair (woman): a volume behind/above the skull, a crown of messy tufts, and a side-swept fringe
  const tuft = (key: string, az: number, el: number, len: number, droop: number, width: number, fwdK: number, fill: string) => {
    const s = S(az, el);
    const base = W(s.lx * 1.02, s.ly * 1.02, s.lz * 1.02);
    const nn = nrm(az, el);
    const dir = n3(a3(a3(a3(nn, m3(U, -droop * (1 - 0.45 * lift))), m3(F, fwdK - 0.25 * lift)), m3(Rt, sway * 0.45)));
    const tip = a3(base, m3(dir, len));
    const sd = n3(a3(m3(Rt, Math.cos(az)), m3(F, -Math.sin(az))));
    const p0 = Pw(a3(base, m3(sd, width))), p1 = Pw(a3(base, m3(sd, -width))), tp = Pw(tip);
    const c0 = Pw(a3(a3(base, m3(dir, len * 0.55)), m3(sd, width * 0.9))), c1 = Pw(a3(a3(base, m3(dir, len * 0.45)), m3(sd, -width * 0.6)));
    return <path key={key} d={`M${fmt(p0.x)},${fmt(p0.y)} Q${fmt(c0.x)},${fmt(c0.y)} ${fmt(tp.x)},${fmt(tp.y)} Q${fmt(c1.x)},${fmt(c1.y)} ${fmt(p1.x)},${fmt(p1.y)} Z`} fill={fill} stroke={INK} strokeWidth={inkW * 0.7} strokeLinejoin="round" />;
  };
  const hairBack = isW ? smoothClosed(hull(ellOutline(1.1, 1.08, 1.08, W(0, 0.1, -0.06)))) : null;
  const crown: React.ReactNode[] = [];
  const fringe: React.ReactNode[] = [];
  if (isW) {
    // crown and back tufts (behind the face plane)
    const T: [number, number, number, number, number][] = [
      [0, 0.95, 0.32, 0.2, 0.2], [0.9, 0.85, 0.34, 0.25, 0.2], [-0.9, 0.85, 0.34, 0.25, 0.2], [1.6, 0.6, 0.4, 0.55, 0.22],
      [-1.6, 0.6, 0.4, 0.55, 0.22], [2.3, 0.5, 0.42, 0.7, 0.24], [-2.3, 0.5, 0.42, 0.7, 0.24], [3.14, 0.45, 0.44, 0.8, 0.26],
      [2.7, 0.0, 0.34, 0.9, 0.22], [-2.7, 0.0, 0.34, 0.9, 0.22], [1.9, 0.0, 0.32, 0.95, 0.2], [-1.9, 0.0, 0.32, 0.95, 0.2],
    ];
    T.forEach(([az, el, len, droop, wd], i) => {
      const v = vis(nrm(az, el));
      const node = tuft(`c${i}`, az, el, len * 0.8, droop, wd * 0.8, 0, i % 3 === 0 ? C.hairHi : C.hair);
      if (v > 0.15) fringe.push(node);
      else if (v > -0.6) crown.push(node);
    });
    // fringe: one swept mass over the forehead with a jagged lower edge (longer toward the head's left), plus side
    // locks in front of the ears; drawn on the skull surface so it turns with the head
    const top: V2[] = [], bot: V2[] = [];
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const az = lerp(1.15, -1.2, i / N);
      const u = i / N;
      const s0 = S(az, hl + 0.32);
      top.push(Pw(W(s0.lx * 1.06, s0.ly * 1.06, s0.lz * 1.06)));
      const jag = (i % 2 === 0 ? 0 : 0.1) + 0.05 * Math.sin(i * 1.7);
      const el = hl - 0.06 - 0.3 * Math.pow(u, 1.3) * (1 - 0.6 * Math.abs(az) / 1.2) - jag + 0.04 * sway + 0.05 * lift;
      const s1 = S(az + 0.08 * sway, el);
      bot.push(Pw(W(s1.lx * 1.07, s1.ly * 1.07, s1.lz * 1.07)));
    }
    const vf = vis(nrm(0, hl));
    if (vf > -0.45) {
      const pts = [...top, ...bot.reverse()];
      const dd = pts.map((q, i) => `${i ? 'L' : 'M'}${fmt(q.x)},${fmt(q.y)}`).join('') + 'Z';
      fringe.push(<path key="fr" d={dd} fill={`url(#${hairG})`} stroke={INK} strokeWidth={inkW * 0.8} strokeLinejoin="round" />);
      // a few strand lines
      [0.25, 0.45, 0.65].forEach((u0, k) => {
        const az = lerp(1.2, -1.2, u0);
        const p0 = S(az, hl + 0.25), p1 = S(az - 0.12, hl - 0.12 - 0.2 * u0);
        const A = Pw(W(p0.lx * 1.07, p0.ly * 1.07, p0.lz * 1.07)), B = Pw(W(p1.lx * 1.08, p1.ly * 1.08, p1.lz * 1.08));
        fringe.push(<path key={`fs${k}`} d={`M${fmt(A.x)},${fmt(A.y)} L${fmt(B.x)},${fmt(B.y)}`} stroke={C.hairHi} strokeWidth={inkW * 0.6} strokeLinecap="round" opacity={0.7} />);
      });
    }
    [1, -1].forEach((sd) => {
      const v = vis(nrm(sd * 1.35, 0.0));
      if (v > -0.25 && v < 0.8) fringe.push(tuft(`sl${sd}`, sd * 1.3, 0.34, 0.26, 1.5, 0.15, 0.08, C.hair));
    });
  }
  // guard's cap: crown + band (hull), brim forward, badge
  const cap = (() => {
    if (isW) return null;
    const pts: V2[] = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const s = S(a, 0.3);
      pts.push(P(s.lx * 1.07, s.ly + 0.02, s.lz * 1.07));
      const s2 = S(a, 1.0);
      pts.push(P(s2.lx * 1.15, s2.ly * 1.18 + 0.1, s2.lz * 1.15));
    }
    const capD = smoothClosed(hull(pts), 0.1);
    const brim: V2[] = [];
    for (let i = 0; i <= 16; i++) { const a = -1.3 + (2.6 * i) / 16; brim.push(P(Math.sin(a) * 0.93, 0.33, Math.cos(a) * 0.95)); }
    for (let i = 16; i >= 0; i--) { const a = -1.3 + (2.6 * i) / 16; brim.push(P(Math.sin(a) * 0.98, 0.26, Math.cos(a) * 1.38)); }
    const brimD = brim.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('') + 'Z';
    const bd = place(0, 0.66);
    return (
      <g>
        <path d={capD} fill={`url(#${id}-cap)`} stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />
        <path d={brimD} fill={shade(C.cap, 0.3)} stroke={INK} strokeWidth={inkW * 0.8} strokeLinejoin="round" />
        {bd.v > 0.1 && (
          <g transform={bd.m}>
            <path d="M0,-0.13 L0.11,-0.04 L0.08,0.11 L-0.08,0.11 L-0.11,-0.04 Z" fill={C.badge} stroke={INK} strokeWidth={0.025} />
          </g>
        )}
      </g>
    );
  })();
  const back = fc < -0.25;
  const light = {x: c.x - R * 0.35, y: c.y - R * 0.4};
  return (
    <g>
      <defs>
        <radialGradient id={skinG} cx={fmt(light.x)} cy={fmt(light.y)} r={fmt(R * 1.6)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(C.skin, 0.28)} />
          <stop offset="0.5" stopColor={C.skin} />
          <stop offset="1" stopColor={shade(C.skin, 0.32)} />
        </radialGradient>
        <radialGradient id={hairG} cx={fmt(c.x - R * 0.3)} cy={fmt(c.y - R * 0.7)} r={fmt(R * 1.8)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.hairHi} />
          <stop offset="0.45" stopColor={C.hair} />
          <stop offset="1" stopColor={shade(C.hair, 0.4)} />
        </radialGradient>
        {!isW && (
          <radialGradient id={`${id}-cap`} cx={fmt(c.x - R * 0.3)} cy={fmt(c.y - R * 0.9)} r={fmt(R * 1.6)} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.capHi} />
            <stop offset="1" stopColor={C.cap} />
          </radialGradient>
        )}
        <clipPath id={`${id}-hc`}>
          <path d={silD} />
        </clipPath>
      </defs>
      {hairBack && <path d={hairBack} fill={`url(#${hairG})`} stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />}
      {crown}
      {Ear(1)}
      {Ear(-1)}
      <path d={silD} fill={`url(#${hairG})`} stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />
      {fc > -0.55 && (
        <g clipPath={`url(#${id}-hc)`}>
          <path d={faceD} fill={`url(#${skinG})`} />
          <path d={faceD} fill="none" stroke={shade(C.skin, 0.4)} strokeWidth={R * 0.07} opacity={0.22} />
        </g>
      )}
      {/* silhouette ink again over the face edge (the jaw/nose outline) */}
      {fc > -0.55 && <path d={silD} fill="none" stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />}
      {!back && (
        <g>
          {Cheek(1)}
          {Cheek(-1)}
          {nose}
          {Eye(1)}
          {Eye(-1)}
          {Brow(1)}
          {Brow(-1)}
          {mouth}
        </g>
      )}
      {fringe}
      {cap}
      <ellipse cx={fmt(c.x - R * 0.3)} cy={fmt(c.y - R * 0.78)} rx={fmt(R * 0.3)} ry={fmt(R * 0.1)} transform={`rotate(-18 ${fmt(c.x - R * 0.3)} ${fmt(c.y - R * 0.78)})`} fill="#FFFFFF" opacity={0.16} />
    </g>
  );
};

const smoothClosed = (q: V2[], k = 1 / 6) => {
  const n = q.length;
  if (n < 3) return '';
  let d = `M${fmt(q[0].x)},${fmt(q[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
    d += ` C${fmt(p1.x + (p2.x - p0.x) * k)},${fmt(p1.y + (p2.y - p0.y) * k)} ${fmt(p2.x - (p3.x - p1.x) * k)},${fmt(p2.y - (p3.y - p1.y) * k)} ${fmt(p2.x)},${fmt(p2.y)}`;
  }
  return d + 'Z';
};
export {mix, v3};
