// Glass Climbing V5: the microscopic section (scenes/Micro.tsx with a higher-contrast palette: bright silicone wedges on
// a deep ground, a darker backing, deeper glass with a lit face).
// The microscopic view (a schematic, not a photograph): a cross-section through one tile and the surface it is on, in
// the bay's own orientation (glass on the left, the tile's silicone backing on the right, "down" is down), in microns.
// Each wedge is a thin silicone blade about 100 um long, rooted in the backing and leaning down toward the glass
// (Hawkes et al.: wedges about 100 um tall). Unloaded, only their tips touch. Pulled down (shear along the glass),
// they bend over and lie flat against it, so the area in true close contact grows from points to strips; that close
// contact is what lets the short-range (van der Waals) attractions add up. Unloaded again, they spring back and let go.
// On rough brick only the few wedges whose tips land on a peak can touch; the rest hang over gaps.
import React from 'react';
import {mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {add, clamp, fmt, lerp, lerpV, mul, norm, P, perp, sub, V} from '../dc/math';
import {Cam, Layer} from '../dc/camera';
import {Lin} from '../dc/shade';

import {MW, brickX, B0, Surface, MicroState, UM} from '../scenes/Micro';
export {MW, UM};
export type {MicroState};
const D0: V = norm({x: -Math.cos((MW.lean * Math.PI) / 180), y: Math.sin((MW.lean * Math.PI) / 180)});
const surfX = (s: Surface, y: number) => (s === 'glass' ? 0 : brickX(y));
const SILK = '#E2EEF0';
const BACK = '#8FA8B1';

/** one wedge, rooted at R on the backing face. lam: 0..1 load. Returns its outline and its contact strip. */
const wedgeShape = (R: V, lam: number, surface: Surface, slipY: number) => {
  // where would the tip land unloaded?
  const tip0 = add(R, mul(D0, MW.L));
  const sx = surfX(surface, tip0.y - slipY);
  const reach = tip0.x - sx; // > 0: the tip is short of the surface (a gap); <= 0: touching
  const touching = reach < 1.5;
  // on brick the few tips that land on a peak can bend only a little before the backing drags them off
  const l = touching ? clamp(lam) * (surface === 'brick' ? 0.3 : 1) : 0;
  const c = MW.contact * l * (surface === 'brick' ? 0.35 : 1);
  const pts: V[] = [];
  const dirs: (V | null)[] = Array(24).fill(null); // fixed directions for the contact strip's points (see below)
  let strip: [V, V] | null = null;
  let gap = 0;
  // straight blade (free, or just touching at its tip); the bent blade below has the same point count and starts from it
  const straight: V[] = [add(R, mul(D0, -10))];
  for (let i = 0; i <= 16; i++) straight.push(add(R, mul(D0, (MW.L * i) / 16)));
  for (let i = 1; i <= 6; i++) straight.push(straight[17]);
  if (!touching || l < 0.001) {
    pts.push(...straight);
  } else {
    // the last of the approach: a hairline of air along the strip (opening from nothing as the blade starts to lie
    // down, so the shape never jumps) that closes as the load comes on fully
    const hair = l < 0.88 ? 0.85 * Math.min(1, l / 0.3) : 0.85 * Math.max(0, 1 - l) / 0.12;
    const Q0x = sx + MW.tc * Math.min(1, 0.4 + l * 4) + hair;
    const rem = (MW.L - c) * lerp(1, 0.93, Math.min(1, l * 3)); // the blade's free length: continuous with the straight blade at no load
    const dx = R.x - Q0x;
    const dy = Math.sqrt(Math.max(1, rem * rem - dx * dx));
    const Q: V = {x: Q0x, y: R.y + dy};
    const tq = norm(lerpV(D0, {x: 0, y: 1}, Math.min(1, l * 6))); // along the glass by the time the strip has length
    pts.push(add(R, mul(D0, -10)));
    const c1 = add(R, mul(D0, rem * 0.38));
    const c2 = sub(Q, mul(tq, rem * 0.38));
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, u = 1 - t;
      pts.push({x: u * u * u * R.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * Q.x, y: u * u * u * R.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * Q.y});
    }
    for (let i = 1; i <= 6; i++) pts.push({x: Q.x, y: Q.y + (c * i) / 6});
    // the strip's outline turns from the blade's end tangent to along the glass as the strip lengthens (no corner
    // where a short strip meets the blade)
    const ds = norm(lerpV(tq, {x: 0, y: 1}, Math.min(1, c / (2 * MW.tc))));
    for (let i = 17; i < 24; i++) dirs[i] = ds;
    // under the first load the blade eases from its straight shape into the bent one (no jump at the onset)
    const kb = Math.min(1, l / 0.15);
    for (let i = 0; i < pts.length; i++) pts[i] = lerpV(straight[i], pts[i], kb);
    gap = Q0x - MW.tc - sx;
    strip = [{x: sx, y: Q.y - 1}, {x: sx, y: Q.y + c}];
  }
  // offset the centreline by a tapering half-thickness (the lower, gripping face is the side toward the surface)
  const n = pts.length;
  const left: V[] = [], right: V[] = [];
  let d0: V = D0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    // a contact strip with (almost) no length yet keeps the blade's last direction instead of a degenerate normal
    const ab = sub(b, a);
    const d = dirs[i] ?? (Math.hypot(ab.x, ab.y) > 1e-3 ? norm(ab) : d0);
    d0 = d;
    const nn = perp(d);
    const t = Math.min(1, i / 17); // along the blade: root (1) to tip (17); the strip keeps the tip's thickness
    // the bent blade's blunt contact end grows in with the load, so the shape never changes in one frame
    const k = strip ? Math.min(1, l / 0.15) : 0;
    const h = lerp(MW.wb / 2, lerp(1.2, MW.tc, k), t ** 0.85);
    left.push(add(pts[i], mul(nn, h)));
    right.push(add(pts[i], mul(nn, -h)));
  }
  const d = `M${left.map((p) => P(p)).join(' L')} L${right.reverse().map((p) => P(p)).join(' L')} Z`;
  return {d, strip, gap, root: R, tip: pts[n - 1], touching, l};
};

export const MicroView: React.FC<{id: string; st: MicroState; cam: Cam; k?: number}> = ({id, st, cam, k = 1}) => (
  <Layer cam={cam} depth={1}>
    <MicroContent id={id} st={st} z={cam.z} k={k} />
  </Layer>
);

/** the section's drawing in its own (micron) coordinates; `z` is the screen scale (for line widths); `bg` false leaves
 *  the ground out (when nested inside a larger scene) */
export const MicroContent: React.FC<{id: string; st: MicroState; z: number; k?: number; bg?: boolean}> = ({id, st, z, k = 1, bg = true}) => {
  const {surface, lam, gx, back} = st;
  const shear = MW.shear * lam + st.slip;
  const B = B0 - MW.approach * lam + back;
  const roots: V[] = Array.from({length: st.count}).map((_, i) => ({x: B, y: st.y0 + i * MW.pitch + shear}));
  const shapes = roots.map((R) => wedgeShape(R, lam, surface, st.slip));
  const ink = 1.1 / Math.max(1e-6, z) * 1.6 * k;
  // the surfaces run on past the screen's height at this scale, so a fast pull-back never reveals where they end
  const margin = Math.max(2000, 1100 / Math.max(z, 1e-4));
  const yTop = st.y0 - margin, yBot = st.y0 + st.count * MW.pitch + margin;
  // the surface
  let surf: React.ReactNode;
  if (surface === 'glass') {
    surf = (
      <g transform={`translate(${fmt(gx)} 0)`}>
        {/* the glass body runs on well past the frame (deep tone), so a pull-back never reveals its far edge */}
        <rect x={-120000} y={yTop} width={119100} height={yBot - yTop} fill="#17434D" />
        <Lin id={`${id}-gl`} d={`M-900,${yTop} H0 V${yBot} H-900 Z`} from={{x: -900, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#17434D'], [0.7, '#3E8A92'], [0.95, '#8FD6D8'], [1, '#D2FAF8']]} />
        {Array.from({length: Math.ceil((yBot - yTop) / 260)}).map((_, i) => {
          const y = yTop + i * 260;
          return <path key={i} d={`M-80,${y} L-20,${y - 90} L-12,${y - 90} L-72,${y} Z`} fill="#FFFFFF" opacity={0.12} />;
        })}
        <path d={`M-0.6,${yTop} V${yBot}`} stroke="#F4FFFF" strokeWidth={fmt(Math.min(ink * 2, 1.4))} opacity={0.95} />
      </g>
    );
  } else {
    const pts: V[] = [];
    for (let y = yTop; y <= yBot; y += 3) pts.push({x: brickX(y), y});
    surf = (
      <g transform={`translate(${fmt(gx)} 0)`}>
        <path d={`M-900,${yTop} L${pts.map((p) => P(p)).join(' L')} L-900,${yBot} Z`} fill="#A4573E" />
        <path d={`M-900,${yTop} L${pts.map((p) => P({x: p.x - 16, y: p.y + 5})).join(' L')} L-900,${yBot} Z`} fill="#8B4632" opacity={0.55} />
        {Array.from({length: Math.ceil((yBot - yTop) / 37)}).map((_, i) => {
          const y = yTop + i * 37;
          const x = brickX(y) - 26 - ((i * 53) % 140);
          return <circle key={i} cx={fmt(x)} cy={fmt(y)} r={fmt(3 + (i % 4) * 2)} fill={i % 3 ? '#C4775A' : '#6E3424'} opacity={0.5} />;
        })}
        <path d={`M${pts.map((p) => P({x: p.x - 0.8, y: p.y})).join(' L')}`} fill="none" stroke="#E7A486" strokeWidth={fmt(Math.min(ink * 1.6, 1.2))} opacity={0.7} />
        <path d={`M${pts.map((p) => P(p)).join(' L')}`} fill="none" stroke={INK} strokeWidth={fmt(ink)} opacity={0.8} />
      </g>
    );
  }
  return (
    <g>
      {/* the material view's ground (air between the surfaces) */}
      {bg ? <rect x={-5000} y={yTop - 5000} width={10000} height={yBot - yTop + 10000} fill="#0D161D" /> : <rect x={-100} y={yTop} width={B + 100} height={yBot - yTop} fill="#0D161D" />}
      {surf}
      {/* wedges (lower ones first, so each overlaps the one beneath it as it lies down); shaded root to tip */}
      {shapes
        .map((s, i) => ({s, i}))
        .reverse()
        .map(({s, i}) => (
          <g key={i}>
            <defs>
              <linearGradient id={`${id}-wg${i}`} gradientUnits="userSpaceOnUse" x1={fmt(s.root.x)} y1={fmt(s.root.y)} x2={fmt(s.tip.x)} y2={fmt(s.tip.y)}>
                <stop offset="0" stopColor={shade(SILK, 0.3)} />
                <stop offset="0.55" stopColor={SILK} />
                <stop offset="1" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <path d={s.d} fill={st.highlight === i ? mix(SILK, '#FFFFFF', 0.3) : `url(#${id}-wg${i})`} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
          </g>
        ))}
      {/* the backing: the tile's silicone body */}
      <Lin id={`${id}-bk`} d={`M${fmt(B)},${yTop} H${fmt(B + 900)} V${yBot} H${fmt(B)} Z`} from={{x: B, y: 0}} to={{x: B + 300, y: 0}} stops={[[0, mix(BACK, '#FFFFFF', 0.25)], [0.15, BACK], [1, shade(BACK, 0.28)]]} />
      {Array.from({length: Math.ceil((yBot - yTop) / 90)}).map((_, i) => (
        <circle key={i} cx={fmt(B + 30 + ((i * 47) % 220))} cy={fmt(yTop + i * 90)} r={fmt(1.6 + (i % 3))} fill="#FFFFFF" opacity={0.18} />
      ))}
      <path d={`M${fmt(B)},${yTop} V${yBot}`} stroke={INK} strokeWidth={fmt(ink)} opacity={0.6} />
      {/* the contact strips: the interface, a hairline of air while the last of the approach closes, and (beat 8) a
          restrained cue confined to the contact edge */}
      {shapes.map((s, i) =>
        s.strip ? (
          <g key={`c${i}`}>
            {s.gap > 0.05 && <path d={`M${P(add(s.strip[0], {x: s.gap / 2, y: 0}))} L${P(add(s.strip[1], {x: s.gap / 2, y: 0}))}`} stroke="#0E161B" strokeWidth={fmt(s.gap)} />}
            <path d={`M${P(add(s.strip[0], {x: s.gap, y: 0}))} L${P(add(s.strip[1], {x: s.gap, y: 0}))}`} stroke="#28474F" strokeWidth={fmt(Math.min(ink * 1.8, 1.1))} opacity={0.9 * Math.min(1, s.l / 0.15)} />
            {st.glow > 0.01 && (() => {
              // the cue runs along each strip from where it first touched (its upper end) to its tip as it builds
              const a = add(s.strip[0], {x: 0.2, y: 1});
              const b = add(s.strip[0], {x: 0.2, y: 1 + (s.strip[1].y - s.strip[0].y - 2) * Math.min(1, st.glow * 1.25)});
              return (
                <>
                  <path d={`M${P(a)} L${P(b)}`} stroke="#9FF4FF" strokeWidth={3.4} opacity={0.3 * Math.min(1, st.glow * 2)} strokeLinecap="round" />
                  <path d={`M${P(a)} L${P(b)}`} stroke="#F0FEFF" strokeWidth={1.0} opacity={0.95 * Math.min(1, st.glow * 2)} strokeLinecap="round" />
                </>
              );
            })()}
          </g>
        ) : null,
      )}
    </g>
  );
};

