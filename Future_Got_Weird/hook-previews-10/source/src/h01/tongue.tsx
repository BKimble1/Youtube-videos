// The tongue (a firm pad on the floor of the mouth, in lower-jaw coordinates) and the cutaway that explains what
// happens to it: a sagittal cut window on the near side of the lower jaw shows the tongue's artery, the parasite's
// buccal cone drawing blood from it at the tongue's base, and the tongue losing its blood supply: the vessels beyond
// the bite empty and pale, and the tongue shrinks, pales and withers to a stub.
import React from 'react';
import {smoothClosed, smoothOpen, V2, V3} from '../shared/three';
import {INK} from '../shared/ink';
import {clamp, hash, lerp, noise1, sm} from '../shared/lib';
import {Ctx, f2, PJ} from './geo';
import {LinG, lit, mix, RadG, shade} from './paint';

export const FLOOR_Z = -2.0;
export type TongueState = {base: number; tip: number; h: number; w: number; col: string; wrinkle: number; d: number};
export const tongueState = (d: number): TongueState => {
  const e = sm(d);
  const col = d < 0.5 ? mix('#EC6F7D', '#E3B8AE', sm(d / 0.5)) : mix('#E3B8AE', '#9C8073', sm((d - 0.5) / 0.5));
  return {base: 8.3, tip: lerp(21.0, 13.6, e), h: lerp(3.9, 1.35, e), w: lerp(4.9, 3.3, e), col, wrinkle: sm(clamp((d - 0.25) / 0.6)), d};
};
/** tongue top height and half-width at fx */
export const tongueAt = (T: TongueState, fx: number) => {
  const u = (fx - T.base) / (T.tip - T.base);
  if (u < 0 || u > 1) return {top: FLOOR_Z, w: 0};
  const n = 1 + T.wrinkle * 0.14 * noise1(u * 9, 3);
  const ht = T.h * Math.sqrt(Math.max(0, 1 - ((u - 0.42) / 0.58) ** 2)) * n * (0.55 + 0.45 * sm(clamp(u / 0.3)));
  const wt = T.w * Math.sqrt(Math.max(0, 1 - ((u - 0.35) / 0.65) ** 2)) * (1 + T.wrinkle * 0.1 * noise1(u * 7, 8));
  return {top: FLOOR_Z + ht, w: wt};
};

/** the tongue as a shaded 3D pad (seen from above the open mouth) */
export const Tongue3D: React.FC<{C: Ctx; T: TongueState; uid: string}> = ({C, T, uid}) => {
  // outline: hull of sections
  const N = 14;
  const rimPts: V2[] = [];
  const topPts: V2[] = [];
  for (let i = 0; i <= N; i++) {
    const fx = lerp(T.base, T.tip, i / N);
    const {top, w} = tongueAt(T, fx);
    rimPts.push(PJ(C, [fx, w, FLOOR_Z + 0.1]));
    topPts.push(PJ(C, [fx, 0, top]));
  }
  const left: V2[] = [];
  for (let i = N; i >= 0; i--) {
    const fx = lerp(T.base, T.tip, i / N);
    const {w} = tongueAt(T, fx);
    left.push(PJ(C, [fx, -w, FLOOR_Z + 0.1]));
  }
  const mid = PJ(C, [lerp(T.base, T.tip, 0.55), 0, FLOOR_Z + T.h * 0.8]);
  // the outline: near rim, then over the top ridge back along the far rim
  const outline = [...rimPts, PJ(C, [T.tip + 0.4, 0, FLOOR_Z + 0.2]), ...left];
  const groove: V2[] = topPts.slice(1, -2).map((p, i) => PJ(C, [lerp(T.base, T.tip, (i + 1) / N), 0, tongueAt(T, lerp(T.base, T.tip, (i + 1) / N)).top + 0.05]));
  return (
    <g>
      <defs>
        <RadG id={uid + 'tg'} c={mid} r={mid.s * T.w * 1.9} col={T.col} k={1} />
      </defs>
      <path d={smoothClosed(outline)} fill={`url(#${uid}tg)`} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={smoothOpen(groove)} fill="none" stroke={shade(T.col, 0.45)} strokeOpacity={0.5} strokeWidth={f2(mid.s * 0.3)} strokeLinecap="round" />
      {T.wrinkle > 0.02 && [0.3, 0.5, 0.7].map((u, i) => {
        const fx = lerp(T.base, T.tip, u);
        const {top, w} = tongueAt(T, fx);
        const a = PJ(C, [fx - 0.4, w * 0.85, FLOOR_Z + (top - FLOOR_Z) * 0.5]), b = PJ(C, [fx + 0.3, 0, top]), c = PJ(C, [fx - 0.2, -w * 0.85, FLOOR_Z + (top - FLOOR_Z) * 0.5]);
        return <path key={i} d={`M${f2(a.x)},${f2(a.y)} Q${f2(b.x)},${f2(b.y - 4)} ${f2(c.x)},${f2(c.y)}`} fill="none" stroke={shade(T.col, 0.5)} strokeOpacity={0.6 * T.wrinkle} strokeWidth={2} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ cutaway (the plane fy = 0, lower-jaw coords)
const S = (C: Ctx, fx: number, fz: number) => PJ(C, [fx, 0, fz]);
const JAW_SEC: [number, number][] = [
  [22.2, 1.5], [22.7, 0.2], [22.4, -1.8], [20.6, -3.9], [16, -5.4], [8, -7.0], [0, -8.5], [-8, -10], [-16, -11.4], [-24, -12.6],
  [-34, -13.4], [-34, -2.3], [-20, -2.2], [-8, -2.05], [4, -2.0], [15, -1.9], [19.8, -1.5], [21.2, -0.2],
];

export type Feed = {flow: number; t: number; bite: V3; coneBase: V3};

/** the artery's centreline (upstream from the gills to the bite; downstream inside the tongue) */
export const arteryUp = (bite: V3): [number, number][] => [[-30, -9.0], [-18, -8.6], [-8, -8.0], [0, -7.3], [4.5, -6.2], [bite[0] - 1.6, lerp(-6.2, bite[2], 0.55)], [bite[0], bite[2]]];
export const arteryDown = (T: TongueState, bite: V3): [number, number][] => {
  const out: [number, number][] = [[bite[0], bite[2]]];
  const end = T.tip - 1.6;
  for (let i = 1; i <= 6; i++) {
    const fx = lerp(bite[0], end, i / 6);
    const {top} = tongueAt(T, fx);
    out.push([fx, lerp(bite[2], FLOOR_Z + (top - FLOOR_Z) * 0.45, Math.min(1, i / 3))]);
  }
  return out;
};
const along = (pts: [number, number][], u: number): [number, number] => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const s = clamp(u) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < s) i++;
  const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
};

export const Section: React.FC<{C: Ctx; T: TongueState; F: Feed; uid: string; t: number}> = ({C, T, F, uid, t}) => {
  const jaw = smoothClosed(JAW_SEC.map(([x, z]) => S(C, x, z)));
  const s = S(C, 5, -4).s;
  // muscle fibres inside the jaw section
  const fibres = [0.18, 0.34, 0.5, 0.66, 0.82].map((v, i) => {
    const pts: V2[] = [];
    for (let k = 0; k <= 12; k++) {
      const fx = lerp(-34, 19 - 6 * Math.abs(v - 0.5), k / 12);
      const zb = lerp(-13, -4.2, clamp((fx + 34) / 54) ** 1.4);
      pts.push(S(C, fx, lerp(-2.3, zb, v) + 0.25 * Math.sin(k * 1.3 + i)));
    }
    return <path key={i} d={smoothOpen(pts)} fill="none" stroke="#7A2832" strokeOpacity={0.45} strokeWidth={f2(s * 0.22)} />;
  });
  // mandibular symphysis (bone) at the chin
  const bone = smoothClosed(([[21.6, -0.6], [22.0, -2.0], [20.4, -3.8], [17.6, -4.6], [16.8, -3.9], [18.6, -2.9], [20.4, -1.2]] as [number, number][]).map(([x, z]) => S(C, x, z)));
  // tongue profile
  const tp: V2[] = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const fx = lerp(T.base - 0.6, T.tip, i / N);
    tp.push(S(C, fx, Math.max(FLOOR_Z, tongueAt(T, fx).top)));
  }
  tp.push(S(C, T.tip + 0.2, FLOOR_Z + 0.15), S(C, T.tip - 0.6, FLOOR_Z - 0.35), S(C, T.base, FLOOR_Z - 0.4));
  const tongue = smoothClosed(tp);
  const tm = S(C, lerp(T.base, T.tip, 0.5), FLOOR_Z + T.h * 0.5);
  // artery
  const up = arteryUp(F.bite), down = arteryDown(T, F.bite);
  const pulse = 0.5 + 0.5 * Math.sin(F.t * Math.PI * 2 * (2.2 + 1.8 * F.flow));
  const rUp = 0.62 * (1 + 0.14 * pulse * F.flow);
  const empt = sm(clamp(T.d / 0.55));
  const downCol = mix('#C81E2E', '#D9A7A2', empt);
  const rDown = lerp(0.5, 0.26, empt);
  const upPts = up.map(([x, z]) => S(C, x, z));
  const downPts = down.map(([x, z]) => S(C, x, z));
  // little branches into the tongue (fill with blood, then empty)
  const branches = [0.3, 0.55, 0.78].map((u, i) => {
    const [x, z] = along(down, u);
    const {top} = tongueAt(T, x + 0.8);
    const a = S(C, x, z), b = S(C, x + 0.9, lerp(z, top, 0.75)), c = S(C, x + 1.5, lerp(z, FLOOR_Z, 0.6));
    return (
      <g key={i} opacity={1 - empt * 0.85}>
        <path d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke={downCol} strokeWidth={f2(s * 0.2)} strokeLinecap="round" />
        <path d={`M${f2(a.x)},${f2(a.y)} L${f2(c.x)},${f2(c.y)}`} stroke={downCol} strokeWidth={f2(s * 0.16)} strokeLinecap="round" />
      </g>
    );
  });
  // blood drawn toward the bite and up into the mouthparts
  const drops: React.ReactNode[] = [];
  const nd = 16;
  const speed = 0.55 + 0.9 * F.flow;
  for (let i = 0; i < nd; i++) {
    const u = (i / nd + F.t * speed * 0.55 + hash(i) * 0.02) % 1;
    const [x, z] = along(up, u);
    const p = S(C, x, z);
    const a = F.flow * clamp(u * 6) * (u > 0.97 ? (1 - u) / 0.03 : 1);
    drops.push(<ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.s * 0.32)} ry={f2(p.s * 0.24)} fill="#FF5A5E" opacity={f2(a * 0.95)} />);
  }
  // into the cone
  const cb = PJ(C, F.coneBase), ct = PJ(C, F.bite);
  for (let i = 0; i < 4; i++) {
    const u = (i / 4 + F.t * speed * 1.4) % 1;
    const p = {x: lerp(ct.x, cb.x, u), y: lerp(ct.y, cb.y, u)};
    drops.push(<ellipse key={'c' + i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(s * 0.24)} ry={f2(s * 0.2)} fill="#FF4F57" opacity={f2(F.flow * (1 - u) * 0.95)} />);
  }
  const a0 = S(C, 0, -2), a1 = S(C, 0, -12);
  return (
    <g>
      <defs>
        <LinG id={uid + 'js'} a={a0} b={a1} stops={[[0, '#C4565C'], [0.5, '#A6404A'], [1, '#86303C']]} />
        <RadG id={uid + 'ts'} c={tm} r={tm.s * (T.tip - T.base) * 0.7} col={T.col} k={0.9} />
        <RadG id={uid + 'bn'} c={S(C, 19.5, -3)} r={s * 3.5} col="#D9C6A6" k={0.6} />
      </defs>
      <path d={jaw} fill={`url(#${uid}js)`} />
      {fibres}
      {/* the floor lining */}
      <path d={smoothOpen(([[-34, -2.3], [-20, -2.2], [-8, -2.05], [4, -2.0], [15, -1.9], [19.8, -1.5], [21.2, -0.2]] as [number, number][]).map(([x, z]) => S(C, x, z)))} fill="none" stroke="#F1A3A4" strokeWidth={f2(s * 0.45)} strokeLinecap="round" />
      {/* artery upstream (full, pulsing) */}
      <path d={smoothOpen(upPts)} fill="none" stroke={INK} strokeWidth={f2(s * rUp * 2 + 3)} strokeLinecap="round" />
      <path d={smoothOpen(upPts)} fill="none" stroke="#C81E2E" strokeWidth={f2(s * rUp * 2)} strokeLinecap="round" />
      <path d={smoothOpen(upPts)} fill="none" stroke="#FF7C7C" strokeOpacity={0.45 + 0.3 * pulse * F.flow} strokeWidth={f2(s * rUp * 0.6)} strokeLinecap="round" transform={`translate(${f2(-s * 0.15)},${f2(-s * 0.18)})`} />
      {/* tongue in section */}
      <path d={tongue} fill={`url(#${uid}ts)`} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      {[0.3, 0.55, 0.8].map((v, i) => {
        const pts: V2[] = [];
        for (let k = 0; k <= 8; k++) {
          const fx = lerp(T.base + 0.6, T.tip - 0.9, k / 8);
          const {top} = tongueAt(T, fx);
          pts.push(S(C, fx, lerp(FLOOR_Z, top, v)));
        }
        return <path key={i} d={smoothOpen(pts)} fill="none" stroke={shade(T.col, 0.4)} strokeOpacity={0.35 + 0.3 * T.wrinkle} strokeWidth={f2(s * 0.14)} />;
      })}
      {branches}
      <path d={smoothOpen(downPts)} fill="none" stroke={INK} strokeWidth={f2(s * rDown * 2 + 2.5)} strokeLinecap="round" opacity={0.85} />
      <path d={smoothOpen(downPts)} fill="none" stroke={downCol} strokeWidth={f2(s * rDown * 2)} strokeLinecap="round" />
      {drops}
    </g>
  );
};

/** the cut window: a blob in the fy = 0 plane, growing from the bite */
export const windowPath = (C: Ctx, o: number, bite: V3, t: number): string => {
  if (o <= 0.001) return '';
  const e = sm(o);
  const cx = lerp(bite[0], 13.2, e), cz = lerp(bite[2], -3.2, e);
  const rx = 12.5 * e, rz = 6.8 * e;
  const pts: V2[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const k = 1 + 0.06 * Math.sin(a * 3 + 1.1) + 0.04 * Math.sin(a * 5 + t * 1.5);
    pts.push(PJ(C, [cx + Math.cos(a) * rx * k, 0, cz + Math.sin(a) * rz * k]));
  }
  return smoothClosed(pts);
};
