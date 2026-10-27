// The wolf spider drawn through a camera: banded legs (darker rings at the joints), a dark carapace with the pale
// median band and margins of a lycosid, a low eye row with two large posterior eyes (drawn once and never animated), short
// pedipalps and chelicerae, and an abdomen with the dark heart mark and paired pale spots. The specimen is dead: nothing
// on it moves except what the pressure in the legs moves.
import React from 'react';
import {lit, shade} from './dc/color';
import {INK} from './dc/ink';
import {capsuleItem, Core, ellipsoidItem, Item} from './draw3';
import {ABD, legsWorld, LEG_R, palpLocal, PRO, SpiderPose, toWorld} from './spider';
import {add3, Basis, depth, mul3, proj, rotZ, smoothClosed, sub3, V3} from './three';

export type SpiderLook = {leg: string; legBand: string; cara: string; caraBand: string; abd: string; heart: string; spot: string; eye: string};
/** the gripper specimen */
export const LOOK_A: SpiderLook = {leg: '#8C6A45', legBand: '#4E3826', cara: '#4C3626', caraBand: '#B39467', abd: '#6E5034', heart: '#3A281B', spot: '#C7A97C', eye: '#121A20'};
/** the living-spider illustration (cutaway): a pale shell so the hemolymph inside reads */
export const LOOK_CUT: SpiderLook = {leg: '#D9C9B2', legBand: '#C2AE93', cara: '#CDB89C', caraBand: '#E6D9C4', abd: '#D3C0A4', heart: '#B9A386', spot: '#EFE5D3', eye: '#3A4650'};
export type Cut = {fluid: string; core: number; flow?: number; squeeze: number; dim: number};

/** the second specimen (same species; a slightly paler, warmer individual so the two bodies stay distinct) */
export const LOOK_B: SpiderLook = {leg: '#B08A5C', legBand: '#6D5034', cara: '#6B5038', caraBand: '#D2B88E', abd: '#93704A', heart: '#5A3F29', spot: '#E2CDA6', eye: '#121A20'};

const surf = (P: SpiderPose, c: V3, a: number, b: number, cc: number, x: number, y: number, up = 1): V3 => {
  // a point on an ellipsoid's upper (up = 1) surface above local (x, y) relative to its centre
  const k = 1 - (x / a) ** 2 - (y / b) ** 2;
  return toWorld(P, [c[0] + x, c[1] + y, c[2] + up * cc * Math.sqrt(Math.max(0, k))]);
};

export const spiderItems = (B: Basis, P: SpiderPose, look: SpiderLook, o: {id: string; hideLegs?: number[]; opacity?: number; cut?: Cut; focusLeg?: number; focus?: number} = {id: 's'}): Item[] => {
  const items: Item[] = [];
  const sk = P.s ?? 1;
  const W = (p: V3) => toWorld(P, p);
  const ax = (v: V3): V3 => sub3(W(v), W([0, 0, 0]));
  const sc = proj(B, W([0, 0, 0])).s;
  const dorsalVisible = (() => {
    const up = ax([0, 0, 1]);
    const toEye = sub3(B.eye, W([0, 0, 0]));
    return up[0] * toEye[0] + up[1] * toEye[1] + up[2] * toEye[2] > 0;
  })();

  // ---- legs (each segment its own part, so the segments read as an arthropod's jointed leg)
  const legs = legsWorld(P);
  legs.forEach((L, i) => {
    if (o.hideLegs?.includes(i)) return;
    for (let k = 0; k < 6; k++) {
      const c = k === 0 ? shade(look.leg, 0.15) : k === 2 || k === 5 ? look.legBand : look.leg;
      const core: Core | undefined = o.cut ? {color: o.cut.fluid, k: o.cut.core * (k === 5 ? 0.5 : 0.62), flow: o.cut.flow !== undefined ? o.cut.flow - k * 0.6 : undefined} : undefined;
      const dimmed = o.focusLeg !== undefined && o.focusLeg !== i ? 1 - 0.8 * (o.focus ?? 0) : 1;
      items.push(capsuleItem(B, L[k], L[k + 1], LEG_R[k] * sk, LEG_R[k + 1] * sk, c, {band: !o.cut && (k === 1 || k === 3 || k === 4) ? look.legBand : undefined, bandAt: 0.78, spec: 0.4, opacity: (o.opacity ?? 1) * dimmed, core}));
    }
    // a few spines on the tibia and metatarsus
    for (const k of o.cut ? [] : [3, 4]) {
      const a = L[k], b = L[k + 1];
      const mid = (u: number) => add3(a, mul3(sub3(b, a), u));
      for (const u of [0.35, 0.7]) {
        const p0 = mid(u);
        const dir = sub3(b, a);
        const out: V3 = [dir[1] * 0.12 - dir[2] * 0.02, -dir[0] * 0.12, 0.08];
        const q0 = proj(B, p0), q1 = proj(B, add3(add3(p0, out), mul3(dir, 0.06)));
        items.push({z: q0.z - 0.01, el: <path key={`${o.id}sp${i}${k}${u}`} d={`M${q0.x.toFixed(1)},${q0.y.toFixed(1)} L${q1.x.toFixed(1)},${q1.y.toFixed(1)}`} stroke={INK} strokeWidth={Math.max(0.8, 0.05 * q0.s).toFixed(2)} strokeLinecap="round" opacity={0.8 * (o.opacity ?? 1)} />});
      }
    }
  });
  // ---- pedipalps (short) and chelicerae
  for (const s of [1, -1]) {
    const pp = palpLocal(s, P.e.reduce((a, b) => a + b, 0) / 8).map(W);
    const r = [0.3, 0.26, 0.22, 0.17];
    const dimP = (o.opacity ?? 1) * (o.focusLeg !== undefined ? 1 - 0.8 * (o.focus ?? 0) : 1);
    for (let k = 0; k < 3; k++) items.push(capsuleItem(B, pp[k], pp[k + 1], r[k] * sk, r[k + 1] * sk, k === 2 ? look.legBand : look.leg, {spec: 0.3, opacity: dimP}));
    items.push(ellipsoidItem(B, W([PRO.a * 0.9, s * 0.42, -0.35]), [ax([0.55, 0, 0]), ax([0, 0.42, 0]), ax([0, 0, 0.6])], shade(look.cara, 0.25), {spec: 0.6, opacity: dimP}));
  }

  // ---- abdomen (behind the prosoma in a top view; its markings on the dorsal surface)
  const aC: V3 = [ABD.x, 0, ABD.z];
  const abdDeco = dorsalVisible && !o.cut ? (
    <g>
      {/* heart mark: a dark lance on the front half */}
      <path d={smoothClosed([[-0.2, 0], [-1.0, 0.55], [-2.2, 0.42], [-3.0, 0], [-2.2, -0.42], [-1.0, -0.55]].map(([x, y]) => proj(B, surf(P, aC, ABD.a, ABD.b, ABD.c, x + 2.4, y))))} fill={look.heart} opacity={0.9} />
      {[-0.4, -1.2, -2.0].flatMap((x) => [1, -1].map((s) => {
        const q = proj(B, surf(P, aC, ABD.a, ABD.b, ABD.c, x - 0.2, s * (0.95 - 0.1 * x * 0)));
        return <ellipse key={`${x}${s}`} cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} rx={(0.26 * q.s * sk).toFixed(1)} ry={(0.18 * q.s * sk).toFixed(1)} fill={look.spot} opacity={0.75} />;
      }))}
    </g>
  ) : undefined;
  items.push(ellipsoidItem(B, W(aC), [ax([ABD.a, 0, 0]), ax([0, ABD.b, 0]), ax([0, 0, ABD.c])], look.abd, {deco: abdDeco, spec: 0.9, opacity: o.opacity}));
  // pedicel (the waist)
  items.push(capsuleItem(B, W([-1.9, 0, 0.05]), W([-2.4, 0, 0.15]), 0.55 * sk, 0.6 * sk, shade(look.abd, 0.2), {spec: 0, opacity: o.opacity}));

  // ---- prosoma with carapace pattern and eyes
  const pC: V3 = [0, 0, 0];
  const band = [[2.0, 0.55], [1.2, 0.7], [0.2, 0.55], [-0.8, 0.42], [-1.8, 0.28], [-2.2, 0], [-1.8, -0.28], [-0.8, -0.42], [0.2, -0.55], [1.2, -0.7], [2.0, -0.55]];
  const cutDeco = o.cut
    ? (() => {
        // the prosoma's fluid space, squeezed by the muscles on "pressure"; and the leg bases it feeds
        const sq = o.cut.squeeze;
        const chamber = smoothClosed(Array.from({length: 20}, (_, j) => {
          const th = (j / 20) * 2 * Math.PI;
          return proj(B, W([0.1 + 1.65 * Math.cos(th), 1.35 * (1 - 0.18 * sq) * Math.sin(th), -0.1 + 0.25 * Math.sin(th)]));
        }));
        const muscles = [-0.9, 0, 0.9].map((x) => {
          const a = proj(B, W([x, 0, PRO.c * 0.92])), b = proj(B, W([x * 0.8, 0, -0.35 + 0.35 * sq]));
          return {a, b};
        });
        return (
          <g>
            <path d={chamber} fill={o.cut.fluid} opacity={0.85} />
            {muscles.map((m, j) => (
              <path key={j} d={`M${m.a.x.toFixed(1)},${m.a.y.toFixed(1)} L${m.b.x.toFixed(1)},${m.b.y.toFixed(1)}`} stroke="#D98C8C" strokeWidth={((0.32 + 0.14 * sq) * m.a.s).toFixed(2)} strokeLinecap="round" opacity={0.85} />
            ))}
          </g>
        );
      })()
    : undefined;
  const proDeco = o.cut ? cutDeco : dorsalVisible ? (
    <g>
      <path d={smoothClosed(band.map(([x, y]) => proj(B, surf(P, pC, PRO.a, PRO.b, PRO.c, x, y))))} fill={look.caraBand} opacity={0.85} />
      {/* pale margins */}
      {[1, -1].map((s) => (
        <path key={s} d={smoothClosed([[1.6, 1.45], [0.4, 1.85], [-1.0, 1.75], [-1.9, 1.1], [-1.2, 1.35], [0.2, 1.55], [1.3, 1.25]].map(([x, y]) => proj(B, surf(P, pC, PRO.a, PRO.b, PRO.c, x, s * y))))} fill={look.caraBand} opacity={0.55} />
      ))}
      {/* radiating striae */}
      {[-50, -20, 20, 50, 150, 180, 210].map((a) => {
        const r0 = 0.6, r1 = 1.5;
        const p0 = proj(B, surf(P, pC, PRO.a, PRO.b, PRO.c, -0.5 + r0 * Math.cos((a * Math.PI) / 180), r0 * Math.sin((a * Math.PI) / 180)));
        const p1 = proj(B, surf(P, pC, PRO.a, PRO.b, PRO.c, -0.5 + r1 * Math.cos((a * Math.PI) / 180), r1 * Math.sin((a * Math.PI) / 180)));
        return <path key={a} d={`M${p0.x.toFixed(1)},${p0.y.toFixed(1)} L${p1.x.toFixed(1)},${p1.y.toFixed(1)}`} stroke={shade(look.cara, 0.3)} strokeWidth={(0.12 * p0.s).toFixed(2)} opacity={0.5} strokeLinecap="round" />;
      })}
    </g>
  ) : undefined;
  items.push(ellipsoidItem(B, W(pC), [ax([PRO.a, 0, 0]), ax([0, PRO.b, 0]), ax([0, 0, PRO.c])], look.cara, {deco: proDeco, spec: 1, glossy: true, zBias: -0.05, opacity: o.opacity}));
  // eyes: anterior row of four small, two large posterior medians, two posterior laterals (static)
  const eyes: [number, number, number][] = [
    [2.25, 0.18, 0.11], [2.25, -0.18, 0.11], [2.22, 0.48, 0.1], [2.22, -0.48, 0.1],
    [1.85, 0.42, 0.2], [1.85, -0.42, 0.2], [1.35, 0.78, 0.18], [1.35, -0.78, 0.18],
  ];
  for (const [x, y, r] of eyes) {
    const p = surf(P, pC, PRO.a, PRO.b, PRO.c * 1.04, x - 0.15, y);
    const n = ax([x / PRO.a ** 2, y / PRO.b ** 2, 0.25]);
    const toEye = sub3(B.eye, p);
    if (n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2] <= 0) continue;
    const q = proj(B, p);
    const R = r * q.s * sk;
    items.push({
      z: depth(B, W(pC)) - PRO.c - 0.06,
      el: (
        <g key={`${o.id}e${x}${y}`} opacity={o.opacity}>
          <circle cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} r={R.toFixed(2)} fill={look.eye} />
          <circle cx={(q.x - R * 0.3).toFixed(1)} cy={(q.y - R * 0.35).toFixed(1)} r={(R * 0.22).toFixed(2)} fill="#9FB3BF" opacity={0.55} />
        </g>
      ),
    });
  }
  void sc;
  void rotZ;
  void lit;
  return items;
};
