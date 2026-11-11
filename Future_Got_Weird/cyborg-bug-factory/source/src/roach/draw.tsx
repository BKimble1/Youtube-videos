// Drawing the cockroach rig in the FGW finish (one ink contour per part, gradient fills from the upper-left key light,
// restrained gloss). Every part is an Item with a camera depth. The dorsal plates are drawn back to front so each
// plate overlaps the one behind it (as the real tergites do), with the amber band of a hissing cockroach on each
// plate's rear edge. The whole insect is returned as items so near legs pass in front of the body and far legs behind.
import React from 'react';
import {add3, Basis, dot3, lerp3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V3} from '../core/three';
import {capsuleItem, ellipsoidItem, ellipsoidPath, inkW, Item} from '../core/draw3';
import {lit, mix, shade} from '../core/color';
import {INK} from '../core/ink';
import {dirW, Frame, pitchF, toW} from '../core/frame';
import {bw, HEAD_AX, HEAD_C, hw, LegJ, pair, Plate, PRONOTUM, RAD, Rig, TERGITES, THORAX, VENTER} from './rig';

export const ROACH_COL = {
  plate: '#3B2117', // glossy chestnut-black
  plateHi: '#5A3424',
  band: '#8A4A24', // amber rear band
  prono: '#4A2A1C',
  pronoRim: '#9A5A30',
  venter: '#4A2A1C',
  head: '#2A1610',
  leg: '#6A3820',
  legDark: '#4C2716',
  ant: '#5B301C',
  eye: '#120B08',
};
const f2 = (n: number) => n.toFixed(2);
const ax3 = (F: Frame, a: V3, sc: number): [V3, V3, V3] => [mul3(F.f, a[0] * sc), mul3(F.l, a[1] * sc), mul3(F.u, a[2] * sc)];

let rid = 0;
let rns = 'r';
export const resetRoachIds = (p = 'r') => { rid = 0; rns = p.replace(/[^A-Za-z0-9_-]/g, '_'); };
const nid = (p: string) => `${rns}${p}${rid++}`;
const LIGHT = {x: -0.62, y: -0.78};

/** one dorsal plate: the amber band colour underneath, the dark plate shifted forward on top (so the band shows as a
 *  crescent on the rear edge), a soft gloss, one contour */
const plateEl = (B: Basis, st: Rig['st'], P: Plate, base: string, band: string | null, key: string, glossK = 1) => {
  const sc = st.scale ?? 1;
  const F = pitchF(st.body, P.pitch);
  const c = bw(st, P.c);
  const outer = ellipsoidPath(B, c, ax3(F, P.a, sc));
  const innerC = bw(st, add3(P.c, [P.a[0] * 0.13, 0, P.a[2] * 0.05]));
  const inner = band ? ellipsoidPath(B, innerC, ax3(F, [P.a[0] * 0.9, P.a[1] * 0.95, P.a[2] * 0.99], sc)) : outer;
  const C = proj(B, c);
  const R = Math.max(P.a[0], P.a[1]) * C.s * sc;
  const id = nid('pl');
  return (
    <g key={key}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(C.x + LIGHT.x * R * 0.35)} cy={f2(C.y + LIGHT.y * R * 0.35)} r={f2(R * 1.3)}>
          <stop offset="0" stopColor={lit(base, 0.22)} />
          <stop offset="0.5" stopColor={base} />
          <stop offset="1" stopColor={shade(base, 0.55)} />
        </radialGradient>
        {band && (
          <linearGradient id={`${id}b`} gradientUnits="userSpaceOnUse" x1={f2(C.x - R)} y1={f2(C.y - R)} x2={f2(C.x + R)} y2={f2(C.y + R)}>
            <stop offset="0" stopColor={lit(band, 0.25)} />
            <stop offset="1" stopColor={shade(band, 0.35)} />
          </linearGradient>
        )}
      </defs>
      <path d={outer} fill={band ? `url(#${id}b)` : `url(#${id})`} stroke={shade(base, 0.75)} strokeWidth={f2(inkW(C.s * sc, 0.45))} strokeLinejoin="round" />
      {band && <path d={inner} fill={`url(#${id})`} />}
      {glossK > 0 && (
        <ellipse cx={f2(C.x + LIGHT.x * R * 0.25)} cy={f2(C.y + LIGHT.y * R * 0.18)} rx={f2(R * 0.32)} ry={f2(R * 0.07)} transform={`rotate(-12 ${f2(C.x + LIGHT.x * R * 0.25)} ${f2(C.y + LIGHT.y * R * 0.18)})`} fill="#FFFFFF" opacity={0.16 * glossK} />
      )}
    </g>
  );
};

export type RoachDraw = {key?: string; dim?: number; tint?: string; pronoOp?: number};

/** the body plates as one group, back to front (venter, tergites 7..1, metanotum, mesonotum), and the pronotum */
export const roachItems = (B: Basis, R: Rig, o: RoachDraw = {}): {items: Item[]; rearZ: number; pronoZ: number} => {
  const st = R.st;
  const sc = st.scale ?? 1;
  const items: Item[] = [];
  const k = o.key ?? 'rc';
  const tint = (c: string) => (o.tint ? mix(c, o.tint, 0.35) : c);
  // ---- abdomen pump: tergites breathe very slightly
  const abd = (P: Plate, i: number): Plate => {
    const pitch = P.pitch - st.abdPitch * (i / 6);
    const z = P.c[2] + st.abdPitch * 0.06 * i * Math.abs(P.c[0] + 8) * 0.12;
    const w = 1 + 0.015 * st.breathe * Math.sin(i * 0.7);
    return {...P, c: [P.c[0], 0, z], a: [P.a[0], P.a[1] * w, P.a[2]], pitch};
  };
  const venterC = bw(st, VENTER.c);
  const vEl = (() => {
    const d = ellipsoidPath(B, venterC, ax3(st.body, VENTER.a, sc));
    const C = proj(B, venterC);
    return <path key="v" d={d} fill={shade(tint(ROACH_COL.venter), 0.25)} stroke={INK} strokeWidth={f2(inkW(C.s * sc))} />;
  })();
  // cerci: tiny paired appendages at the tip
  const tipW = bw(st, [-41.5, 0, 4.0]);
  const cerci = [1, -1].map((s) => {
    const a = bw(st, [-39.5, 2.2 * s, 4.0]);
    const b = bw(st, [-43.2, 3.6 * s, 3.4]);
    return capsuleItem(B, a, b, 0.7 * sc, 0.35 * sc, tint(ROACH_COL.legDark), {key: `${k}cc${s}`, spec: 0.2}).el;
  });
  void tipW;
  const sil = [...TERGITES.map((P, i) => abd(P, i)), ...THORAX].map((P) => ellipsoidPath(B, bw(st, P.c), ax3(pitchF(st.body, P.pitch), P.a, sc)));
  const silW = inkW(proj(B, bw(st, [-10, 0, 6])).s * sc, 1.1) * 2;
  const rear = (
    <g key={`${k}rear`}>
      {sil.map((d, i) => <path key={`sl${i}`} d={d} fill={INK} stroke={INK} strokeWidth={f2(silW)} strokeLinejoin="round" />)}
      {vEl}
      {cerci}
      {[...TERGITES].map((P, i) => ({P: abd(P, i), i})).reverse().map(({P, i}) => plateEl(B, st, P, tint(i % 2 ? ROACH_COL.plate : ROACH_COL.plateHi), tint(ROACH_COL.band), `${k}t${i}`, 0.8))}
      {[...THORAX].reverse().map((P, i) => plateEl(B, st, P, tint(ROACH_COL.plateHi), tint(ROACH_COL.band), `${k}th${i}`, 0.9))}
    </g>
  );
  const rearZ = proj(B, bw(st, [-10, 0, 6])).z;
  items.push({z: rearZ, el: rear});
  // ---- pronotum: the big shield, a paler rim, a faint median line
  const pc = bw(st, PRONOTUM.c);
  const pronoZ = proj(B, pc).z;
  const pF = pitchF(st.body, PRONOTUM.pitch);
  const rimP: Plate = {...PRONOTUM};
  const innerP: Plate = {...PRONOTUM, c: add3(PRONOTUM.c, [-0.7, 0, 0.15]), a: [PRONOTUM.a[0] * 0.9, PRONOTUM.a[1] * 0.88, PRONOTUM.a[2]]};
  const mid = [bw(st, [22.5, 0, 9.0]), bw(st, [14.5, 0, 10.6]), bw(st, [5.5, 0, 9.6])].map((p) => proj(B, p));
  items.push({
    z: pronoZ,
    el: (
      <g key={`${k}pro`} opacity={o.pronoOp}>
        {(() => { const d = ellipsoidPath(B, pc, ax3(pF, PRONOTUM.a, sc)); return <path d={d} fill={INK} stroke={INK} strokeWidth={f2(inkW(proj(B, pc).s * sc, 1.1) * 2)} strokeLinejoin="round" />; })()}
        {plateEl(B, st, rimP, tint(ROACH_COL.pronoRim), null, `${k}pr0`, 0)}
        {(() => {
          const d = ellipsoidPath(B, bw(st, innerP.c), ax3(pF, innerP.a, sc));
          const C = proj(B, pc);
          const R0 = PRONOTUM.a[1] * C.s * sc;
          const id = nid('pg');
          return (
            <g>
              <defs>
                <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(C.x + LIGHT.x * R0 * 0.3)} cy={f2(C.y + LIGHT.y * R0 * 0.3)} r={f2(R0 * 1.25)}>
                  <stop offset="0" stopColor={lit(tint(ROACH_COL.prono), 0.25)} />
                  <stop offset="0.5" stopColor={tint(ROACH_COL.prono)} />
                  <stop offset="1" stopColor={shade(tint(ROACH_COL.prono), 0.5)} />
                </radialGradient>
              </defs>
              <path d={d} fill={`url(#${id})`} />
              <path d={smoothOpen(mid)} fill="none" stroke={lit(tint(ROACH_COL.prono), 0.35)} strokeWidth={f2(Math.max(0.8, 0.35 * C.s * sc))} strokeLinecap="round" opacity={0.45} />
              <ellipse cx={f2(C.x + LIGHT.x * R0 * 0.3)} cy={f2(C.y + LIGHT.y * R0 * 0.25)} rx={f2(R0 * 0.36)} ry={f2(R0 * 0.1)} transform={`rotate(-14 ${f2(C.x + LIGHT.x * R0 * 0.3)} ${f2(C.y + LIGHT.y * R0 * 0.25)})`} fill="#FFFFFF" opacity={0.22} />
            </g>
          );
        })()}
      </g>
    ),
  });
  // ---- head (under the front of the pronotum; seen from the front and the side)
  const H = R.head;
  items.push(ellipsoidItem(B, R.headC, ax3(H, HEAD_AX, sc), tint(ROACH_COL.head), {spec: 0.7, glossy: true}));
  [1, -1].forEach((s) => {
    const c = hw(st, H, [HEAD_C[0] + 1.2, 3.9 * s, HEAD_C[2] + 1.0]);
    const n = dirW(H, [0.3, s, 0.2]);
    if (dot3(n, sub3(B.eye, c)) > -0.2) items.push(ellipsoidItem(B, c, [mul3(H.f, 1.6 * sc), mul3(norm3(n), 0.6 * sc), mul3(H.u, 2.4 * sc)], ROACH_COL.eye, {zBias: -0.3 * sc, spec: 1.2, glossy: true}));
  });
  // palps
  [1, -1].forEach((s) => {
    const a = hw(st, H, [5.2, 1.6 * s, -2.6]);
    const b = hw(st, H, [6.8, 2.6 * s, -4.4]);
    items.push(capsuleItem(B, a, b, 0.55 * sc, 0.4 * sc, tint(ROACH_COL.leg), {key: `${k}pp${s}`, spec: 0.3}));
  });
  // ---- antennae
  R.ants.forEach((a, j) => {
    for (let q = 0; q < a.pts.length - 1; q++) {
      const r0 = (0.46 - q * 0.022) * sc, r1 = (0.46 - (q + 1) * 0.022) * sc;
      items.push(capsuleItem(B, a.pts[q], a.pts[q + 1], Math.max(0.16, r0), Math.max(0.15, r1), tint(q % 2 ? ROACH_COL.ant : shade(ROACH_COL.ant, 0.15)), {key: `${k}a${j}${q}`, spec: 0.25}));
    }
  });
  // ---- legs: coxa, femur, spiny tibia, two-piece tarsus with claws
  R.legs.forEach((L: LegJ) => {
    const pk = pair(L.i);
    const c = tint(ROACH_COL.leg);
    items.push(capsuleItem(B, L.socket, L.troch, RAD.coxa * sc, RAD.coxa * 0.75 * sc, tint(ROACH_COL.venter), {key: `${k}c${L.i}`, spec: 0.3}));
    items.push(capsuleItem(B, L.troch, L.knee, RAD.femur[0] * sc * (pk === 2 ? 1.15 : 1), RAD.femur[1] * sc, c, {key: `${k}f${L.i}`, spec: 0.55}));
    const tib = capsuleItem(B, L.knee, L.ankle, RAD.tibia[0] * sc, RAD.tibia[1] * sc, c, {key: `${k}tb${L.i}`, spec: 0.45});
    // spines: short ticks along the tibia, on its outer side
    const A = proj(B, L.knee), Bp = proj(B, L.ankle);
    const dx = Bp.x - A.x, dy = Bp.y - A.y, LL = Math.hypot(dx, dy) || 1;
    const nx = -dy / LL, ny = dx / LL;
    const sp = (A.s + Bp.s) / 2;
    const spines = LL > 18 ? [0.25, 0.45, 0.65, 0.85].map((u, q) => {
      const x0 = A.x + dx * u, y0 = A.y + dy * u;
      const sgn = q % 2 ? 1 : -1;
      const r = (RAD.tibia[0] + (RAD.tibia[1] - RAD.tibia[0]) * u) * sp * sc;
      return <path key={q} d={`M${f2(x0 + nx * r * sgn)},${f2(y0 + ny * r * sgn)} l${f2(nx * sgn * 1.6 * sp * sc + dx / LL * 1.4 * sp * sc)},${f2(ny * sgn * 1.6 * sp * sc + dy / LL * 1.4 * sp * sc)}`} stroke={INK} strokeWidth={f2(Math.max(0.8, 0.22 * sp * sc))} strokeLinecap="round" />;
    }) : null;
    items.push({z: tib.z, el: <g key={`${k}tbg${L.i}`}>{tib.el}{spines}</g>});
    const m = lerp3(L.ankle, L.foot, 0.55);
    items.push(capsuleItem(B, L.ankle, m, RAD.tarsus[0] * sc, 0.38 * sc, tint(ROACH_COL.legDark), {key: `${k}s${L.i}a`, spec: 0.3}));
    items.push(capsuleItem(B, m, L.foot, 0.36 * sc, RAD.tarsus[1] * sc, tint(ROACH_COL.legDark), {key: `${k}s${L.i}b`, spec: 0.2}));
  });
  return {items, rearZ, pronoZ};
};

/** V2: the body's plate outlines (screen paths), for a soft rim light behind the insect on dark sets */
export const roachSilhouette = (B: Basis, R: Rig): string[] => {
  const st = R.st, sc = st.scale ?? 1;
  return [...TERGITES, ...THORAX, PRONOTUM].map((P) => ellipsoidPath(B, bw(st, P.c), ax3(pitchF(st.body, P.pitch), P.a, sc)));
};
/** the body's screen outline (for contact shadows and masks) */
export const roachShadow = (B: Basis, R: Rig, z0: number, alpha = 0.35) => {
  const st = R.st;
  const pts = [[26, 0], [20, 13], [6, 15], [-12, 15.5], [-30, 12], [-41, 4], [-41, -4], [-30, -12], [-12, -15.5], [6, -15], [20, -13]].map(([x, y]) => {
    const w = toW(st.body, [x * (st.scale ?? 1), y * (st.scale ?? 1), 0]);
    return proj(B, [w[0] + 1.2, w[1] + 1.6, z0]);
  });
  return <path d={smoothClosed(pts)} fill="#0B141B" opacity={alpha} style={{filter: 'blur(6px)'}} />;
};
export {P2};
