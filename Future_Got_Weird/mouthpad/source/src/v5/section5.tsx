// V2 side cut-away of the guesser's head. The anatomy is the V1 section (the palate is the model's own midline,
// vault(0, z)); the MouthPad itself is now the shared 3D model seen from the side with its near half cut away, so the
// device that flies in from the product view is the same object that sits on the roof of the mouth.
import React from 'react';
import {Jaw, vault, PAD, DEV} from '../art/jaw3d';
import {CAST} from '../crew';
import {lerp, smoothPath, P} from '../lib';

const INK = '#162A32';
const look = CAST.guesser;
export const palate = (z: number) => -vault(0, z);
const PAL: P[] = Array.from({length: 40}, (_, i) => {
  const z = 15 - (i / 39) * 38;
  return {x: z, y: palate(z)};
});
/** (V5) the tongue in profile, built from a SPINE with a thickness profile, so its outline is smooth at every lift
 *  value (no straight-line blending of outline points, which made a flat top and square corners mid-rise):
 *  - the back of the spine (root to a hinge under the soft palate) never moves: the body rests low on the floor of
 *    the mouth and cannot pop;
 *  - the front of the spine is a cubic leaving the hinge tangentially; lifting swings its end along an ARC about the
 *    hinge (polar interpolation) and turns its end direction from forward to up, so the blade curls up smoothly;
 *  - the half-thickness tapers from the body to a narrow blade and ends in a round cap, whose end point is placed on
 *    the underside of the gold pad at cz (0.25 mm into the pad's outline, which is drawn over the tongue: no gap);
 *    a press widens the cap a little against the pad. */
const PAD_UNDER = 1.8; // the pad is drawn 0.75 mm under the palate, 2.1 mm thick: its underside is ~1.8 mm below
type V2 = {x: number; y: number};
const nrm = (v: V2) => { const l = Math.hypot(v.x, v.y) || 1; return {x: v.x / l, y: v.y / l}; };
const sstep = (u: number) => { const c = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };
const tongueShape = (lift: number, cz: number, press: number): {outline: P[]; top: P[]} => { // top: a highlight line along the blade
  const k = sstep(lift);
  const R = {x: -27, y: 5.0}, Q = {x: -18, y: 3.4}, H = {x: -10, y: 4.6}; // hinge further back: a gentler bend
  const tH = nrm({x: H.x - Q.x, y: H.y - Q.y});
  const wEnd = 3.4 + (2.6 - 3.4) * k + 0.5 * press; // a fuller tip at rest, slimmer when curled up
  // the contact pose: the cap's end on the pad's underside at cz, the tip pointing up and slightly forward
  const dirC = nrm({x: 0.22, y: -1});
  const contactY = palate(cz) + PAD_UNDER - 0.25 - 0.4 * press;
  const Tc = {x: cz - dirC.x * wEnd, y: contactY - dirC.y * wEnd};
  // the rest pose: the tip low and forward, behind the lower incisors
  const dirR = nrm({x: 1, y: 0.18});
  const Tr = {x: 11.6, y: 5.6};
  // the end travels on a curve that comes up to the pad from directly below (it cannot brush the pad's angled front
  // on the way, and a partial lift hovers just under the contact point)
  const Cq = {x: Tc.x + 1.2, y: Tc.y + 8.5};
  const m1 = 1 - k;
  const T = {x: m1 * m1 * Tr.x + 2 * m1 * k * Cq.x + k * k * Tc.x, y: m1 * m1 * Tr.y + 2 * m1 * k * Cq.y + k * k * Tc.y};
  const dir = nrm({x: dirR.x + (dirC.x - dirR.x) * k, y: dirR.y + (dirC.y - dirR.y) * k});
  const P1 = {x: H.x + tH.x * 9, y: H.y + tH.y * 9}; // a long first handle spreads the bend over the blade
  const P2 = {x: T.x - dir.x * (5 + 2 * k), y: T.y - dir.y * (5 + 2 * k)};
  const spine: {p: V2; t: V2}[] = [];
  const NB = 16, NF = 40;
  for (let i = 0; i <= NB; i++) { // root → hinge (quadratic)
    const u = i / NB, m = 1 - u;
    spine.push({p: {x: m * m * R.x + 2 * m * u * Q.x + u * u * H.x, y: m * m * R.y + 2 * m * u * Q.y + u * u * H.y},
      t: nrm({x: 2 * m * (Q.x - R.x) + 2 * u * (H.x - Q.x), y: 2 * m * (Q.y - R.y) + 2 * u * (H.y - Q.y)})});
  }
  for (let i = 1; i <= NF; i++) { // hinge → tip (cubic)
    const u = i / NF, m = 1 - u;
    const p = {x: m ** 3 * H.x + 3 * m * m * u * P1.x + 3 * m * u * u * P2.x + u ** 3 * T.x, y: m ** 3 * H.y + 3 * m * m * u * P1.y + 3 * m * u * u * P2.y + u ** 3 * T.y};
    const d = {x: 3 * m * m * (P1.x - H.x) + 6 * m * u * (P2.x - P1.x) + 3 * u * u * (T.x - P2.x), y: 3 * m * m * (P1.y - H.y) + 6 * m * u * (P2.y - P1.y) + 3 * u * u * (T.y - P2.y)};
    spine.push({p, t: nrm(d)});
  }
  const n = spine.length - 1;
  // half-thickness: a deep body, tapering through the blade to the tip (the body's underside rests on the floor)
  const half = (i: number) => { const s = i / n; return s < 0.28 ? 7.2 : 7.2 + (wEnd - 7.2) * Math.pow(sstep((s - 0.28) / 0.72), 0.85); };
  // the inner (top) side of a bend cannot be offset further than the bend's radius, or it folds over itself:
  // limit it to 85% of the local radius of curvature (measured on the spine), smoothed along the spine
  const kap = spine.map((q, i) => {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n, i + 1)];
    const ds = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y) || 1;
    const cross = a.t.x * b.t.y - a.t.y * b.t.x; // > 0: turning toward the "below" side; < 0: toward the top
    return cross / ds;
  });
  const wTopRaw = spine.map((_, i) => (kap[i] < 0 ? Math.min(half(i), 0.7 / -kap[i]) : half(i)));
  const wTop = wTopRaw.map((_, i) => { let acc = 0, ws = 0; for (let j = -4; j <= 4; j++) { const q = wTopRaw[Math.min(n, Math.max(0, i + j))]; acc += q * (5 - Math.abs(j)); ws += 5 - Math.abs(j); } return Math.min(acc / ws, half(i)); });
  const top: P[] = [], bot: P[] = [], hl: P[] = [];
  spine.forEach((q, i) => {
    const nx = -q.t.y, ny = q.t.x; // normal pointing "below" the spine
    top.push({x: q.p.x - nx * wTop[i], y: q.p.y - ny * wTop[i]});
    bot.push({x: q.p.x + nx * half(i), y: q.p.y + ny * half(i)});
    hl.push({x: q.p.x - nx * Math.max(0, wTop[i] - 1.3), y: q.p.y - ny * Math.max(0, wTop[i] - 1.3)});
  });
  // remove any remaining loop on the inner (top) edge where the body meets the rising blade: where two segments of
  // the edge cross, cut the loop out at the crossing point
  const untangle = (pts: P[]): P[] => {
    const out = [...pts];
    for (let i = 0; i < out.length - 3; i++) {
      for (let j = out.length - 2; j > i + 1; j--) {
        const a1 = out[i], a2 = out[i + 1], b1 = out[j], b2 = out[j + 1];
        const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
        if (Math.abs(d) < 1e-9) continue;
        const ua = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
        const ub = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
        if (ua > 0 && ua < 1 && ub > 0 && ub < 1) {
          const X = {x: a1.x + ua * (a2.x - a1.x), y: a1.y + ua * (a2.y - a1.y)};
          out.splice(i + 1, j - i, X);
          break;
        }
      }
    }
    return out;
  };
  // then round the inner crease: Chaikin corner cutting (keeps the end points), so no V-notch or ink spur remains
  const chaikin = (pts: P[], it: number): P[] => {
    let q = pts;
    for (let r = 0; r < it; r++) {
      const o: P[] = [q[0]];
      for (let i = 0; i < q.length - 1; i++) {
        const A = q[i], B = q[i + 1];
        o.push({x: 0.75 * A.x + 0.25 * B.x, y: 0.75 * A.y + 0.25 * B.y}, {x: 0.25 * A.x + 0.75 * B.x, y: 0.25 * A.y + 0.75 * B.y});
      }
      o.push(q[q.length - 1]);
      q = o;
    }
    return q;
  };
  const lapl = (pts: P[], it: number): P[] => { // neighbour averaging (end points fixed)
    let q = pts;
    for (let r = 0; r < it; r++) q = q.map((p, i) => (i === 0 || i === q.length - 1 ? p : {x: (q[i - 1].x + 2 * p.x + q[i + 1].x) / 4, y: (q[i - 1].y + 2 * p.y + q[i + 1].y) / 4}));
    return q;
  };
  const topClean = lapl(chaikin(untangle(top), 3), 160);
  // round caps: the tip (around T) and the root (around R)
  const cap = (c: V2, tg: V2, w: number, from: number, to: number) => Array.from({length: 23}, (_, j) => {
    const a = from + ((to - from) * (j + 1)) / 24;
    const bx = Math.cos(a), by = Math.sin(a); // in the tangent frame: x along tg, y along the normal
    return {x: c.x + (tg.x * bx - tg.y * by) * w, y: c.y + (tg.y * bx + tg.x * by) * w};
  });
  const tipCap = cap(T, spine[n].t, wEnd, -Math.PI / 2, Math.PI / 2);
  const rootCap = cap(R, {x: -spine[0].t.x, y: -spine[0].t.y}, half(0), -Math.PI / 2, Math.PI / 2);
  const outline = [...topClean, ...tipCap, ...[...bot].reverse(), ...rootCap];
  return {outline, top: hl.slice(Math.round(n * 0.5), n - 2)};
};
export const SECTION_VIEW = {yaw: 90, pitch: 0, persp: 4000};
const SHELL_D = smoothPath([{x: 23.2, y: -12}, {x: 23.4, y: -3}, {x: 21.6, y: 1.2}, {x: 18.0, y: 1.4}, {x: 10, y: 0.8}, {x: -22.5, y: -1.2}, {x: -23.5, y: -9.6}, {x: -22, y: -11.2}, {x: 14.5, y: -10.6}, {x: 16, y: -13.2}], true, 0.35);

/** cx, cy: screen position of the model origin; px: screen px per mm; reveal: the head and anatomy (0..1); near:
 *  opacity of the device's near half; ring: seconds since the contact flash (or < 0) */
export const SectionScene: React.FC<{cx: number; cy: number; px: number; lift: number; cz: number; press: number; glow: number; ring: number; reveal: number; near: number; bg?: boolean; device?: boolean | number}> =
  ({cx, cy, px, lift, cz, press, glow, ring, reveal, near, bg = true, device = true}) => {
  const tng = tongueShape(lift, cz, press);
  const dO = typeof device === 'number' ? device : device ? 1 : 0; // (V4) the device fades in over the hand-off
  const contact = {x: cz, y: palate(cz) + 0.5};
  const w = (n: number) => ({strokeWidth: n, vectorEffect: 'non-scaling-stroke' as const});
  const padZ0 = PAD.cz - PAD.h / 2, padZ1 = PAD.cz + PAD.h / 2;
  const padPts: P[] = Array.from({length: 16}, (_, i) => {
    const z = lerp(padZ0, padZ1, i / 15);
    const dent = press * 0.7 * Math.exp(-((z - cz) ** 2) / 8);
    return {x: z, y: palate(z) + 0.75 - dent};
  });
  const ringO = ring >= 0 ? Math.max(0, 1 - ring / 0.35) : 0;
  return (
    <g>
      <defs>
        <linearGradient id="s2-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E8C93" /><stop offset="1" stopColor="#173A52" /></linearGradient>
        <clipPath id="s2-cut"><path d={CUT_D} /></clipPath>
        <clipPath id="s2-shirt"><path d="M -120 46 Q -30 30 50 50 L 70 160 L -150 160 Z" /></clipPath>
        <radialGradient id="s2-glow"><stop offset="0" stopColor="#FFF6C8" stopOpacity={1} /><stop offset="1" stopColor="#FFE08A" stopOpacity={0} /></radialGradient>
      </defs>
      {bg && <rect x={0} y={0} width={1080} height={1920} fill="url(#s2-bg)" />}
      <g transform={`translate(${cx} ${cy}) scale(${px})`} opacity={reveal}>
        <g>
          <path d="M -58 20 L -60 70 L 4 70 L 2 22 Z" fill={look.skin} stroke={INK} {...w(3)} />
          <path d="M -120 46 Q -30 30 50 50 L 70 160 L -150 160 Z" fill="#FFFFFF" stroke={INK} {...w(3)} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-150} y={58 + i * 24} width={230} height={11} fill="#FFC744" clipPath="url(#s2-shirt)" />)}
          <path d="M -98 -56 L -118 -74 L -100 -90 L -112 -112 L -86 -110 L -84 -136 L -60 -122 L -50 -150 L -30 -126 L -12 -150 L 0 -122 L 22 -136 L 22 -108 L 40 -104 L 26 -86 Q -20 -96 -60 -84 Q -84 -76 -94 -46 Z" fill={look.hairColor} stroke={INK} {...w(3.4)} strokeLinejoin="round" />
          <path d={HEAD_D} fill={look.skin} stroke={INK} {...w(3.4)} />
          <ellipse cx={-44} cy={-34} rx={10} ry={14} fill={look.skin} stroke={INK} {...w(3)} />
          <path d="M -46 -40 Q -40 -34 -46 -27" fill="none" stroke={INK} {...w(2)} />
          <ellipse cx={18} cy={-58} rx={8} ry={11} fill="#FFFFFF" stroke={INK} {...w(2.6)} />
          <circle cx={21} cy={-57} r={4.2} fill={INK} />
          <circle cx={22.4} cy={-58.6} r={1.3} fill="#FFFFFF" />
          <path d="M 8 -76 L 26 -74" stroke={INK} {...w(3.6)} strokeLinecap="round" />
          <circle cx={6} cy={-30} r={10} fill="#EF6B55" opacity={0.42} />
          <g clipPath="url(#s2-cut)">
            <rect x={-60} y={-40} width={120} height={90} fill="#F7C3B5" />
            <path d={smoothPath([...PAL.map((p) => ({x: p.x, y: p.y - 3.4})), ...[...PAL].reverse().map((p) => ({x: p.x, y: p.y}))], true, 0.3)} fill="#F3E6CF" stroke={INK} {...w(1.6)} />
            <path d={smoothPath([{x: 16, y: palate(16)}, ...PAL.slice(1), {x: -30, y: 4}, {x: -28, y: 22}, {x: 12, y: 20}], true, 0.3)} fill="#6E2232" />
            {[-19, -12.5, -6.5, -1, 4, 9].map((z, i) => (
              <path key={i} d={`M ${z - 2.8} 9.5 Q ${z - 3} ${2.2 + (i < 2 ? 1.4 : 0.5)} ${z - 2} ${1.6 + (i < 2 ? 1.4 : 0.5)} L ${z + 2} ${1.6 + (i < 2 ? 1.4 : 0.5)} Q ${z + 3} ${2.2 + (i < 2 ? 1.4 : 0.5)} ${z + 2.8} 9.5 Z`} fill={DEV.tooth1} stroke={INK} {...w(1.4)} />
            ))}
            <path d="M 14.4 11.5 Q 14.8 5 17.6 1.6 L 19.6 2 Q 18.8 6.5 18 11.5 Z" fill={DEV.tooth0} stroke={INK} {...w(1.8)} />
            {/* upper teeth: the far row seen through the section, then the front incisor */}
            {[-19, -12.5, -6.5, -1, 4, 9].map((z, i) => (
              <path key={`u${i}`} d={`M ${z - 2.9} -9.5 Q ${z - 3.2} ${-1.4 - (i < 2 ? 1.4 : 0.6)} ${z - 2} ${-0.6 - (i < 2 ? 1.4 : 0.5)} L ${z + 2} ${-0.6 - (i < 2 ? 1.4 : 0.5)} Q ${z + 3.2} ${-1.4 - (i < 2 ? 1.4 : 0.6)} ${z + 2.9} -9.5 Z`} fill={DEV.tooth1} stroke={INK} {...w(1.4)} />
            ))}
            <path d="M 16 -11.5 Q 15.6 -4 18.8 0.4 L 21.4 0.2 Q 22.8 -6 21.8 -11.5 Z" fill={DEV.tooth0} stroke={INK} {...w(1.8)} />
            {/* the MouthPad's clear shell over the upper teeth (about 1 mm) */}
            <path d={SHELL_D} fill="rgba(205,236,250,0.38)" stroke="rgba(240,252,255,0.95)" {...w(3)} />
            <path d={SHELL_D} fill="none" stroke={INK} {...w(1.1)} opacity={0.5} />
            <path d="M -40 13 Q -10 11 20 12 Q 26 22 18 34 L -40 38 Z" fill="#F3E6CF" stroke={INK} {...w(1.6)} />
          </g>
        </g>
        {/* the MouthPad and the upper teeth: the 3D model from the side, its near half cut away */}
        <g clipPath={reveal > 0.98 ? 'url(#s2-cut)' : undefined}>
          <Jaw view={SECTION_VIEW} px={px} id="s2-jaw" show={{palate: 0, pad: 0, teeth: 0, traces: 0.5 * near * dO, shell: near * dO, plate: dO, pods: dO}} near={near} />
        </g>
        <g clipPath="url(#s2-cut)">
          <path d={'M ' + tng.outline.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join(' L ') + ' Z'} strokeLinejoin="round" fill="#EE8E98" stroke={INK} {...w(2.4)} />
          {/* a soft highlight along the top of the tongue, and the tip picked out */}
          {/* (V5) a soft highlight along the dorsum and blade, */}
          <path d={smoothPath(tng.top, false)} fill="none" stroke="#F8B7BD" strokeWidth={1.0} strokeLinecap="round" opacity={0.8} />
          <path d="M 21.8 -12 Q 30 -11 31.6 -5 Q 31.4 0.6 22.2 1.3 Z" fill="#E08E86" stroke={INK} {...w(1.8)} />
          <path d="M 21 1.5 Q 30 1.6 30 6.5 Q 28.6 11.5 19.4 12 Z" fill="#E08E86" stroke={INK} {...w(1.8)} />
        </g>
        {/* the gold pad on the roof of the mouth, cut through its middle */}
        <g>
          <path d={smoothPath(padPts, false)} fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" />
          <path d={smoothPath(padPts, false)} fill="none" stroke={DEV.gold1} strokeWidth={1.4} strokeLinecap="round" />
          <path d={smoothPath(padPts, false)} fill="none" stroke={DEV.gold0} strokeWidth={0.5} strokeLinecap="round" />
        </g>
        {glow > 0.01 && lift > 0.8 && <circle cx={contact.x} cy={contact.y} r={7 + 4 * press} fill="url(#s2-glow)" opacity={glow} />}
        {ringO > 0.01 && <circle cx={contact.x} cy={contact.y} r={2 + ring * 30} fill="none" stroke="#FFFFFF" {...w(5)} opacity={ringO} />}
        <g>
          <path d={CUT_D} fill="none" stroke={INK} {...w(3)} />
          <path d="M 38 -42 Q 47 -34 48 -26 Q 47 -21 39 -21" fill={look.skin} stroke={INK} {...w(3)} strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
};

// the rig's round head in profile (section mm): a circle with a small chin
const HEAD_D = smoothPath([
  {x: -30, y: -112}, {x: 14, y: -104}, {x: 38, y: -76}, {x: 44, y: -40}, {x: 38, y: -20}, {x: 33, y: -6}, {x: 32.5, y: 6}, {x: 30, y: 16},
  {x: 24, y: 26}, {x: 6, y: 34}, {x: -24, y: 36}, {x: -60, y: 26}, {x: -92, y: 0}, {x: -104, y: -38}, {x: -92, y: -78}, {x: -66, y: -104},
]);
// the opened region: the mouth, in front of the throat, under the nose
const CUT_D = smoothPath([
  {x: 33.6, y: -16}, {x: 34.4, y: 2}, {x: 31.5, y: 15}, {x: 22, y: 25}, {x: -6, y: 30}, {x: -32, y: 26}, {x: -37, y: 2}, {x: -32, y: -24}, {x: -6, y: -30}, {x: 20, y: -24},
], true, 0.45);
