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

export const MW = {
  pitch: 42,
  L: 100,
  wb: 15, // blade width at the root
  lean: 38, // degrees below the -x axis, unloaded
  shear: 30, // backing travel down at full load
  approach: 40, // backing travel toward the surface at full load
  contact: 30, // contact strip length at full load (shorter than the pitch: each wedge's own strip)
  tc: 3.0, // half-thickness of the strip lying on the glass
};
const D0: V = norm({x: -Math.cos((MW.lean * Math.PI) / 180), y: Math.sin((MW.lean * Math.PI) / 180)});
/** the backing's face when the tips just touch a surface at x = 0 */
export const B0 = MW.L * Math.cos((MW.lean * Math.PI) / 180) + 1;

const SILK = '#D7E6EA';
const SILK_D = '#9FB9C2';
const BACK = '#C2D6DC';

export type Surface = 'glass' | 'brick';
/** the surface profile x(y) (<= 0; 0 is the top of the asperities). Brick: an irregular, jagged profile. */
export const brickX = (y: number) => {
  const a = Math.sin(y * 0.021 + 1.3) * 0.5 + Math.sin(y * 0.057 + 0.4) * 0.3 + Math.sin(y * 0.11 + 2.1) * 0.2;
  const b = Math.abs(Math.sin(y * 0.034 + 0.7));
  return -Math.max(0, 70 * (0.55 - a * 0.5) * (0.4 + b) - 6);
};
const surfX = (s: Surface, y: number) => (s === 'glass' ? 0 : brickX(y));

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

export type MicroState = {
  surface: Surface;
  lam: number; // load 0..1
  gx: number; // the surface slab's offset (negative: still sliding in from the left)
  back: number; // extra backing retreat (release)
  glow: number; // contact-edge cue 0..1
  slip: number; // brick: the backing slides down (slip), in um
  y0: number; // first root's y
  count: number;
  highlight?: number; // index of a wedge to pick out (the close-up), or -1
};

/** micron -> bay/bench world units (6.2 units per cm) */
export const UM = 6.2e-4;

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
        <rect x={-120000} y={yTop} width={119100} height={yBot - yTop} fill="#2F6A72" />
        <Lin id={`${id}-gl`} d={`M-900,${yTop} H0 V${yBot} H-900 Z`} from={{x: -900, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#2F6A72'], [0.75, '#7DBDC0'], [0.97, '#B9E6E6'], [1, '#D9F6F5']]} />
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
      {bg ? <rect x={-5000} y={yTop - 5000} width={10000} height={yBot - yTop + 10000} fill="#18232B" /> : <rect x={-100} y={yTop} width={B + 100} height={yBot - yTop} fill="#18232B" />}
      {surf}
      {/* wedges (lower ones first, so each overlaps the one beneath it as it lies down); shaded root to tip */}
      {shapes
        .map((s, i) => ({s, i}))
        .reverse()
        .map(({s, i}) => (
          <g key={i}>
            <defs>
              <linearGradient id={`${id}-wg${i}`} gradientUnits="userSpaceOnUse" x1={fmt(s.root.x)} y1={fmt(s.root.y)} x2={fmt(s.tip.x)} y2={fmt(s.tip.y)}>
                <stop offset="0" stopColor={shade(SILK, 0.12)} />
                <stop offset="0.6" stopColor={SILK} />
                <stop offset="1" stopColor={mix(SILK, '#FFFFFF', 0.45)} />
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

/** The texture-to-section turn (beat 5 -> 6): a strip of the tile seen first face-on (rows of wedges as fine ridges),
 *  then turned about the vertical axis until it is seen edge-on, as the section above. alpha 0 = face-on (looking at
 *  the face from the surface's side), 1 = profile. Unloaded wedges, no surface. */
export const MicroTurn: React.FC<{id: string; alpha: number; cam: Cam; y0: number; count: number}> = ({id, alpha, cam, y0, count}) => (
  <Layer cam={cam} depth={1}>
    <MicroTurnContent id={id} alpha={alpha} z={cam.z} y0={y0} count={count} />
  </Layer>
);
export const MicroTurnContent: React.FC<{id: string; alpha: number; z: number; y0: number; count: number; bg?: boolean; wz?: number}> = ({alpha, z, y0, count, bg = true, wz = 600}) => {
  const a = (alpha * Math.PI) / 2;
  const ca = Math.cos(a), sa = Math.sin(a);
  const WZ = wz; // the strip's extent across the tile (z): enough to fill the frame face-on; its near end swings in as it turns
  const B = B0;
  // the screen x of a point: profile view shows x (glass side left); face-on shows z
  const sx = (x: number, z: number) => x * sa + z * ca; // at alpha = 1 this is the section's own coordinates
  const pt = (x: number, y: number, z: number): V => ({x: sx(x, z), y});
  const ink = 1.1 / Math.max(1e-6, z) * 1.6;
  const rows = Array.from({length: count}).map((_, i) => y0 + i * MW.pitch);
  const zN = WZ / 2, zF = -WZ / 2;
  return (
    <g>
      {bg && <rect x={-6000} y={y0 - 6000} width={12000} height={12000} fill="#1C2830" />}
      {/* the backing block: its face (toward the surface) and, as it turns, its near side */}
      <path d={`M${P(pt(B, y0 - 900, zF))} L${P(pt(B, y0 - 900, zN))} L${P(pt(B, y0 + 900 + count * MW.pitch, zN))} L${P(pt(B, y0 + 900 + count * MW.pitch, zF))} Z`} fill={shade(BACK, 0.12)} />
      <path d={`M${P(pt(B, y0 - 900, zN))} L${P(pt(B + 900, y0 - 900, zN))} L${P(pt(B + 900, y0 + 900 + count * MW.pitch, zN))} L${P(pt(B, y0 + 900 + count * MW.pitch, zN))} Z`} fill={BACK} />
      {rows.map((y, i) => {
        const r0 = {x: B, y: y - MW.wb / 2}, r1 = {x: B, y: y + MW.wb / 2};
        const t = add({x: B, y}, mul(D0, MW.L));
        // the upper (gripping) face, seen from the surface side: a long sloping strip across the whole width
        const face = `M${P(pt(r0.x, r0.y, zF))} L${P(pt(r0.x, r0.y, zN))} L${P(pt(t.x, t.y, zN))} L${P(pt(t.x, t.y, zF))} Z`;
        const lower = `M${P(pt(r1.x, r1.y, zF))} L${P(pt(r1.x, r1.y, zN))} L${P(pt(t.x, t.y, zN))} L${P(pt(t.x, t.y, zF))} Z`;
        const side = `M${P(pt(r0.x, r0.y, zN))} L${P(pt(r1.x, r1.y, zN))} L${P(pt(t.x, t.y, zN))} Z`;
        return (
          <g key={i}>
            <path d={lower} fill={shade(SILK, 0.3)} stroke={INK} strokeWidth={fmt(ink * 0.7)} opacity={0.9} />
            <path d={face} fill={mix(SILK, '#FFFFFF', 0.1 + 0.15 * (1 - alpha))} stroke={INK} strokeWidth={fmt(ink * 0.7)} />
            {/* the shadow each row's tip throws on the row beneath (gives the face-on ridges their relief) */}
            <path d={`M${P(pt(t.x, t.y + 1, zF))} L${P(pt(t.x, t.y + 1, zN))}`} stroke="#5E7C86" strokeWidth={6} opacity={0.45 * (1 - alpha)} />
            <path d={side} fill={shade(SILK, 0.08)} stroke={INK} strokeWidth={fmt(ink)} opacity={clamp(alpha * 3)} />
          </g>
        );
      })}
    </g>
  );
};
