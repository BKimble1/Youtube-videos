// The electric flying board (version 2), one locked asset used in every shot. Reference-grounded on the reported build:
// a white 3D-printed frame carrying TEN brushless electric ducted-fan units (two rows of five, port and starboard of a
// solid spine), a phone set into the spine between the feet that reads the board's attitude, a battery pack under the
// spine, a cyan light strip on the nose and a red one on the tail. Board-local frame: x = toe side, y = up (deck top at
// y = 0), z = nose. The geometry below is the only definition of the board; nothing morphs.
import React from 'react';
import {a3, d3, Frame, Lens, m3, n3, s3, toW, V3, v3} from '../eng/v3';
import {bbox, circ3, f2, hull, inkW, LinFill, lit, P2, polyD, proj, shade, smoothD, thin} from '../eng/draw';
import {INK} from '../dc/ink';

export const BD = {
  thick: 0.11,
  ductR: 0.118,
  rimR: 0.13,
  fanY: -0.05,
  /** the ten duct centres (x, z): two rows of five */
  ducts: [-0.52, -0.26, 0, 0.26, 0.52].flatMap((z) => [[-0.285, z], [0.285, z]] as [number, number][]),
  outline: [
    [0, 0.9], [0.16, 0.84], [0.33, 0.74], [0.44, 0.6], [0.45, 0.2], [0.45, -0.3], [0.44, -0.62], [0.36, -0.74], [0.18, -0.79], [0, -0.78],
    [-0.18, -0.79], [-0.36, -0.74], [-0.44, -0.62], [-0.45, -0.3], [-0.45, 0.2], [-0.44, 0.6], [-0.33, 0.74], [-0.16, 0.84],
  ] as [number, number][],
};
export const COL = {
  frame: '#F2F4F6',
  side: '#C6CED6',
  under: '#DDE2E7',
  duct: '#1E252D',
  ductIn: '#2C353F',
  blade: '#5B6673',
  hub: '#8C98A5',
  grip: '#3A424C',
  led: '#46CFFF',
  tail: '#FF4B4B',
  battery: '#2F3742',
};

export type BoardState = {
  /** rotor phase (turns) and speed (turns per second, for the blur) */
  phase: number;
  rps: number;
  /** 0..1 thrust (airflow and glow) */
  thrust: number;
  /** attitude readout on the board phone */
  tilt?: {pitch: number; roll: number};
  /** 0..1: duct rims flash in sequence (the count of ten) */
  count?: number;
  /** subset of duct units installed (redesign build-up): 0..10, fractional = the next one seating */
  built?: number;
};

const ductPt = (B: Frame, i: number, y: number) => toW(B, v3(BD.ducts[i][0], y, BD.ducts[i][1]));

/** Draw the board through lens L. Returns the element and whether the camera sees the deck top. */
export const boardAbove = (L: Lens, B: Frame) => d3(s3(L.pos, B.o), B.y) > 0;

export const Board: React.FC<{id: string; L: Lens; B: Frame; st: BoardState}> = ({id, L, B, st}) => {
  const above = boardAbove(L, B);
  const kc = L.p(B.o).k;
  const w = inkW(kc, 0.004);
  const built = st.built ?? 10;
  const top = BD.outline.map(([x, z]) => toW(B, v3(x, 0, z)));
  const bot = BD.outline.map(([x, z]) => toW(B, v3(x * 0.97, -BD.thick, z * 0.98)));
  const all = proj(L, [...top, ...bot]);
  const sideH = thin(hull(all), 1.2);
  const face = above ? top : bot;
  const faceP = proj(L, face);
  const faceD = smoothD(faceP, 0.12);
  const fy = above ? 0 : -BD.thick;
  // duct holes on the visible face
  const holes = BD.ducts.map((_, i) => proj(L, circ3(ductPt(B, i, fy), B.x, B.z, BD.ductR, 30)));
  const holeD = holes.map((h) => polyD(h)).join(' ');
  const order = BD.ducts.map((_, i) => i).sort((a, b) => d3(s3(ductPt(B, b, 0), L.pos), L.f) - d3(s3(ductPt(B, a, 0), L.pos), L.f));
  const blur = Math.min(1, st.rps / 18);
  const dz = (i: number) => {
    if (i + 1 > built + 0.999) return <path key={i} d={polyD(holes[i])} fill="#4A535C" stroke={INK} strokeWidth={f2(w * 1.2)} />;
    const seat0 = Math.min(1, Math.max(0, built - i));
    if (seat0 < 0.999) return null;
    const c = ductPt(B, i, BD.fanY);
    const rim = holes[i];
    const pc = L.p(c);
    const blades: React.ReactNode[] = [];
    const nb = 5;
    const ph = st.phase * Math.PI * 2 * (i % 2 ? -1 : 1) + i * 0.7;
    for (let b = 0; b < nb; b++) {
      const a = ph + (b * Math.PI * 2) / nb;
      const pts = [0.03, 0.105].flatMap((r, k) => {
        const da = k === 0 ? 0.32 : 0.16;
        return [a - da, a + da].map((aa) => toW(B, v3(BD.ducts[i][0] + Math.cos(aa) * r, BD.fanY, BD.ducts[i][1] + Math.sin(aa) * r)));
      });
      const pp = proj(L, [pts[0], pts[2], pts[3], pts[1]]);
      blades.push(<path key={b} d={polyD(pp)} fill={COL.blade} opacity={1 - blur * 0.82} />);
    }
    const disc = proj(L, circ3(c, B.x, B.z, 0.108, 28));
    const hub = proj(L, circ3(c, B.x, B.z, 0.034, 16));
    // count flash: rims light in sequence
    const cnt = st.count ?? 0;
    const flash = cnt > 0 ? Math.max(0, 1 - Math.abs(cnt * 10 - (order.indexOf(i) + 0.5)) * 0.9) : 0;
    return (
      <g key={i}>
        <defs>
          <clipPath id={`${id}-dc${i}`}>
            <path d={polyD(rim)} />
          </clipPath>
        </defs>
        <path d={polyD(rim)} fill={COL.duct} />
        <g clipPath={`url(#${id}-dc${i})`}>
          <path d={polyD(proj(L, circ3(ductPt(B, i, above ? -BD.thick : 0), B.x, B.z, BD.ductR, 30)))} fill={COL.ductIn} />
          {blur > 0.05 && <path d={polyD(disc)} fill="#A9B5C1" opacity={0.42 * blur} />}
          {blades}
          {blur > 0.2 && [0, 1, 2].map((r) => {
            const a0 = st.phase * Math.PI * 2 + r * 2.1;
            const arc = proj(L, circ3(c, B.x, B.z, 0.05 + r * 0.022, 8, a0, a0 + 1.4));
            return <path key={`s${r}`} d={`M${arc.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' L')}`} stroke="#E4ECF2" strokeOpacity={0.6 * blur} strokeWidth={f2(Math.max(0.6, 0.006 * pc.k))} fill="none" strokeLinecap="round" />;
          })}
          {/* V3: the exit side (seen from below): three stator arms holding the motor can in front of the fan */}
          {!above && [0, 1, 2].map((s) => {
            const aa = (s * Math.PI * 2) / 3 + 0.5 + i;
            const q = proj(L, [0.036, BD.ductR].map((r) => toW(B, v3(BD.ducts[i][0] + Math.cos(aa) * r, -BD.thick + 0.018, BD.ducts[i][1] + Math.sin(aa) * r))));
            return <path key={`st${s}`} d={`M${f2(q[0].x)},${f2(q[0].y)} L${f2(q[1].x)},${f2(q[1].y)}`} stroke="#3B444E" strokeWidth={f2(Math.max(0.8, 0.016 * pc.k))} strokeLinecap="round" />;
          })}
          {!above && <path d={polyD(proj(L, circ3(toW(B, v3(BD.ducts[i][0], -BD.thick + 0.02, BD.ducts[i][1])), B.x, B.z, 0.046, 18)))} fill="#59636F" stroke={INK} strokeWidth={f2(w * 0.8)} />}
          <path d={polyD(hub)} fill={COL.hub} stroke={INK} strokeWidth={f2(w * 0.8)} />
        </g>
        <path d={polyD(rim)} fill="none" stroke={flash > 0.01 ? COL.led : INK} strokeWidth={f2(w * (1.6 + flash * 2.4))} strokeOpacity={1} />
      </g>
    );
  };
  const b = bbox(faceP);
  const seating = BD.ducts.map((_, i) => i).filter((i) => built - i > 0 && built - i < 0.999);
  const dropUnit = (i: number) => {
    const u = built - i;
    const e = 1 - Math.pow(1 - Math.min(1, u / 0.8), 3);
    const lift = (1 - e) * 0.32;
    const c0 = ductPt(B, i, 0);
    const ring = (y: number, r: number) => proj(L, circ3(a3(c0, m3(B.y, y + lift)), B.x, B.z, r, 28));
    const top = ring(0.01, BD.rimR), bot = ring(-BD.thick, BD.rimR * 0.98);
    const hullP = hull([...top, ...bot]);
    const hub = ring(-0.02, 0.034);
    return (
      <g key={`drop${i}`} opacity={Math.min(1, u / 0.3)}>
        <path d={smoothD(hullP, 0.05)} fill={COL.duct} stroke={INK} strokeWidth={f2(w * 2)} paintOrder="stroke" />
        <path d={polyD(top)} fill={COL.ductIn} stroke="#5A6672" strokeWidth={f2(w * 1.2)} />
        <path d={polyD(hub)} fill={COL.hub} />
      </g>
    );
  };
  // spine grip strip and the phone in the deck (top only)
  const grip = above ? proj(L, [[-0.12, -0.5], [0.12, -0.5], [0.12, 0.5], [-0.12, 0.5]].map(([x, z]) => toW(B, v3(x, 0.002, z)))) : null;
  const phoneC = toW(B, v3(0, 0.004, 0));
  const ph = (u: number, v: number) => L.p(toW(B, v3(u, 0.004, v)));
  const tilt = st.tilt ?? {pitch: 0, roll: 0};
  const ok = Math.abs(tilt.roll) < 4 && Math.abs(tilt.pitch) < 4;
  const hr = (tilt.roll * Math.PI) / 180;
  const hz = 0.03 * Math.max(-1, Math.min(1, tilt.pitch / 12));
  // grille bars over each inlet (top)
  const grilles = above
    ? BD.ducts.map(([x, z], i) =>
        i + 1 > built + 0.999 ? null : (
          <g key={i} opacity={0.75}>
            {[0, 1].map((k) => {
              const a = proj(L, [toW(B, v3(x + (k ? 0 : -BD.ductR), 0.003, z + (k ? -BD.ductR : 0))), toW(B, v3(x + (k ? 0 : BD.ductR), 0.003, z + (k ? BD.ductR : 0)))]);
              return <path key={k} d={`M${f2(a[0].x)},${f2(a[0].y)} L${f2(a[1].x)},${f2(a[1].y)}`} stroke="#C5CDD5" strokeWidth={f2(Math.max(0.6, 0.008 * kc))} />;
            })}
          </g>
        ),
      )
    : null;
  // light strips along the nose and tail edges, at mid-thickness
  // V5: each segment of the strip fades with how squarely its stretch of the board's side faces the camera, so the
  // lights turn away smoothly instead of popping on and off point by point
  const strip = (ids: number[], color: string) => {
    const pts = ids.map((k) => {
      const [x, z] = BD.outline[k];
      return toW(B, v3(x * 1.003, -BD.thick * 0.45, z * 1.003));
    });
    const segs: React.ReactNode[] = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const m = a3(m3(pts[i], 0.5), m3(pts[i + 1], 0.5));
      const outward = n3(s3(s3(m, B.o), m3(B.y, d3(s3(m, B.o), B.y))));
      const fc = d3(n3(s3(L.pos, m)), outward);
      const op = Math.max(0, Math.min(1, (fc + 0.02) / 0.18));
      if (op <= 0.01) continue;
      const a = L.p(pts[i]), b = L.p(pts[i + 1]);
      segs.push(<path key={i} d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke={color} strokeOpacity={op} strokeWidth={f2(Math.max(1, 0.02 * kc))} fill="none" strokeLinecap="round" />);
    }
    return segs.length ? <g>{segs}</g> : null;
  };
  // underside: battery pack and wiring runs along the spine
  const battery = !above ? (() => {
    const c: V3[] = [];
    for (const x of [-0.1, 0.1]) for (const z of [-0.3, 0.3]) for (const y of [-BD.thick, -BD.thick - 0.06]) c.push(toW(B, v3(x, y, z)));
    const pts = hull(proj(L, c));
    return <path d={smoothD(pts, 0.06)} fill={COL.battery} stroke={INK} strokeWidth={f2(w * 2)} paintOrder="stroke" />;
  })() : null;
  const wires = !above
    ? BD.ducts.map(([x, z], i) => {
        const a = L.p(toW(B, v3(Math.sign(x) * 0.1, -BD.thick - 0.005, z * 0.6)));
        const c = L.p(toW(B, v3(x - Math.sign(x) * BD.rimR, -BD.thick - 0.004, z)));
        return <path key={i} d={`M${f2(a.x)},${f2(a.y)} L${f2(c.x)},${f2(c.y)}`} stroke={i % 2 ? '#C0392B' : '#20262D'} strokeWidth={f2(Math.max(0.6, 0.008 * kc))} opacity={0.8} />;
      })
    : null;
  return (
    <g>
      <defs>
        <LinFill id={`${id}-fg`} b={b} color={above ? COL.frame : COL.under} k={0.9} />
      </defs>
      {/* thickness: the hull of both faces, in the side tone */}
      <path d={smoothD(sideH, 0.1)} fill={COL.side} stroke={INK} strokeWidth={f2(w * 2)} strokeLinejoin="round" paintOrder="stroke" />
      {strip([0, 1, 2, 17, 16], COL.led)}
      {strip([8, 9, 10], COL.tail)}
      {order.map(dz)}
      {/* the visible face with the ten inlets cut out */}
      <path d={`${faceD} ${holeD}`} fillRule="evenodd" fill={`url(#${id}-fg)`} stroke={INK} strokeWidth={f2(w * 1.6)} strokeLinejoin="round" />
      {grilles}
      {grip && <path d={polyD(grip)} fill={COL.grip} opacity={0.9} />}
      {above && (
        <g>
          <path d={polyD([ph(-0.045, -0.085), ph(0.045, -0.085), ph(0.045, 0.085), ph(-0.045, 0.085)])} fill="#11171D" stroke="#060A0E" strokeWidth={f2(w)} />
          <path d={polyD([ph(-0.038, -0.075), ph(0.038, -0.075), ph(0.038, 0.075), ph(-0.038, 0.075)])} fill="#1F5F86" />
          {/* V3: an artificial horizon: the ground half tilts with the board's roll and slides with its pitch */}
          <clipPath id={`${id}-phc`}>
            <path d={polyD([ph(-0.038, -0.075), ph(0.038, -0.075), ph(0.038, 0.075), ph(-0.038, 0.075)])} />
          </clipPath>
          <path clipPath={`url(#${id}-phc)`} d={polyD([[-0.2, 0], [0.2, 0], [0.2, -0.2], [-0.2, -0.2]].map(([u, v]) => ph(u * Math.cos(hr) - v * Math.sin(hr), hz * 2.2 + u * Math.sin(hr) + v * Math.cos(hr))))} fill="#6B4C33" />
          {[-1, 1].map((sg) => <path key={sg} d={`M${f2(ph(sg * 0.038, 0).x)},${f2(ph(sg * 0.038, 0).y)} L${f2(ph(sg * 0.024, 0).x)},${f2(ph(sg * 0.024, 0).y)}`} stroke="#FFFFFF" strokeWidth={f2(Math.max(0.8, 0.006 * kc))} />)}
          <path d={`M${f2(ph(-0.03 * Math.cos(hr), hz - 0.03 * Math.sin(hr)).x)},${f2(ph(-0.03 * Math.cos(hr), hz - 0.03 * Math.sin(hr)).y)} L${f2(ph(0.03 * Math.cos(hr), hz + 0.03 * Math.sin(hr)).x)},${f2(ph(0.03 * Math.cos(hr), hz + 0.03 * Math.sin(hr)).y)}`} stroke={ok ? '#21D19F' : '#FFB347'} strokeWidth={f2(Math.max(0.8, 0.007 * kc))} strokeLinecap="round" />
          <circle cx={f2(L.p(phoneC).x)} cy={f2(L.p(phoneC).y)} r={f2(Math.max(0.6, 0.006 * kc))} fill="#E8F6FF" />
        </g>
      )}
      {battery}
      {wires}
      {above && seating.map(dropUnit)}
    </g>
  );
};

/** Board shadow / downwash centre on a horizontal plane at height gy (world), along the sun. */
export const shadowOn = (B: Frame, gy: number, sun: V3): V3 => {
  const h = B.o.y - gy;
  return a3(B.o, m3(sun, -h / Math.max(0.2, sun.y)));
};
export const ductWorld = ductPt;
export {shade, m3};
export type {P2};

/** One loose ducted-fan unit (brushless motor, five-blade fan, duct ring) resting on a surface, axis = B.y. */
export const DuctUnit: React.FC<{L: Lens; B: Frame; c: V3; phase: number}> = ({L, B, c, phase}) => {
  const kc = L.p(c).k;
  const w = inkW(kc, 0.004);
  const ring = (y: number, r: number) => proj(L, circ3(a3(c, m3(B.y, y)), B.x, B.z, r, 28));
  const top = ring(BD.thick, BD.rimR), bot = ring(0, BD.rimR * 0.98);
  const hullP = hull([...top, ...bot]);
  const blades = [0, 1, 2, 3, 4].map((b) => {
    const a = phase * Math.PI * 2 + (b * Math.PI * 2) / 5;
    const P = (r: number, aa: number) => a3(a3(a3(c, m3(B.y, BD.thick * 0.6)), m3(B.x, Math.cos(aa) * r)), m3(B.z, Math.sin(aa) * r));
    return <path key={b} d={polyD(proj(L, [P(0.03, a - 0.32), P(0.105, a - 0.16), P(0.105, a + 0.16), P(0.03, a + 0.32)]))} fill={COL.blade} />;
  });
  const hub = ring(BD.thick * 0.62, 0.034);
  // motor can and its wires trailing out of the duct
  const lead = proj(L, [a3(c, m3(B.y, BD.thick * 0.3)), a3(a3(c, m3(B.y, 0.01)), m3(B.x, -0.22)), a3(a3(c, m3(B.y, 0.0)), m3(B.x, -0.34))]);
  return (
    <g>
      <path d={smoothD(hullP, 0.05)} fill={COL.duct} stroke={INK} strokeWidth={f2(w * 2)} paintOrder="stroke" />
      <path d={polyD(top)} fill={COL.ductIn} stroke="#5A6672" strokeWidth={f2(w * 1.2)} />
      {blades}
      <path d={polyD(hub)} fill={COL.hub} stroke={INK} strokeWidth={f2(w)} />
      <path d={`M${lead.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' L')}`} stroke="#C0392B" strokeWidth={f2(Math.max(1, 0.01 * kc))} fill="none" />
    </g>
  );
};
