// Shots D-E (8.75-16.55 s): the process, as one continuous illustrated camera move through the material itself.
// The cocoon (exactly where the lab shot left it on screen) -> fine silk fibers lifting off it -> the fibers sinking
// into a vial and dissolving into a pale-gold liquid -> the liquid drawn up a tube into the reservoir -> along to the
// handheld coaxial nozzle, opened as a cutaway: silk solution (gold) in the central channel, acetone (teal) in the
// surrounding channel, both flowing toward the outlet -> at the outlet the silk becomes a connected solid fiber while
// the acetone sheath thins away -> the camera travels on alongside the fiber and the cutaway closes, landing on the real
// nozzle's screen position, size and direction for the cut back to the bench.
// A compressed illustration of the process, not a preparation method: no quantities, no conditions.
import React from 'react';
import {INK} from '../rig/cast';
import {clamp, f1, keyS, lerp, mixHex, ss, ss5} from '../lib';

export const MACRO = {t0: 8.75, t1: 16.55};
const C = {bg0: '#26353D', bg1: '#2E3D45', cocoon: '#F3E8CB', cocoonD: '#DCCBA3', silk: '#FFFBF0', liq: '#F2D48A', liqD: '#D9B45E', clear: '#DCEFF2',
  ace: '#9EE6DD', aceD: '#5CC3B8', glass: '#CFEAF0', steel: '#C9D3D8', steelD: '#8D9BA3', body: '#F3F5F6', teal: '#1CA7A0'};

type P = {x: number; y: number};
const add = (a: P, b: P, k = 1): P => ({x: a.x + b.x * k, y: a.y + b.y * k});
// the nozzle axis: the direction the real nozzle points in the lab frame at 16.55 (measured from the lab camera)
const TH = (-24.6 * Math.PI) / 180;
const D: P = {x: Math.cos(TH), y: Math.sin(TH)}, NRM: P = {x: -D.y, y: D.x}; // NRM points screen-down-right of the axis
// ---- world layout (units: px at zoom 1)
const COC = {c: {x: 0, y: 0}, rx: 150, ry: 84, rot: -6};
const VIAL = {x: 560, top: 560, bot: 1080, hw: 118, surf: 680};
const RES = {a: {x: 820, y: 1240}, len: 400, r: 62};
const RES_B = add(RES.a, D, RES.len);
const O: P = {x: 2900, y: -300}; // the outlet
const NEEDLE = 874, BODY = 900; // needle length; body length shown
const F = add(O, D, -NEEDLE), WR = add(F, D, -BODY);
const R = {body: 182, bodyIn: 150, collar: 100, sleeve: 34, sleeveIn: 26, inner: 15, innerIn: 10, lumen: 30, aceIn: 46, aceOut: 92};
// ---- camera keys: [t, cx, cy, zoom]; the first and last are the lab's own framings
const MATCH0 = {x: 520.1, y: 994.2, rx: 266}; // the cocoon on screen at the end of the lab shot (measured from the lab camera)
const MATCH1 = {x: 332.8, y: 1167.0, r: 40.0, fiber: 282}; // the lab nozzle at 16.55 (measured from the lab camera) // the nozzle tip, needle radius and fiber length at 16.55
const Z0 = MATCH0.rx / COC.rx, Z1 = MATCH1.r / R.sleeve;
const camKeys: [number, number, number, number][] = [
  [MACRO.t0, COC.c.x - (MATCH0.x - 540) / Z0, COC.c.y - (MATCH0.y - 960) / Z0, Z0],
  [9.55, 75, 12, 1.55],
  [10.35, 330, 380, 1.0],
  [11.0, 560, 820, 0.95],
  [11.65, 900, 1120, 0.85],
  [12.3, 1240, 820, 0.8],
  [12.95, 1700, 330, 0.9],
  [13.75, 2080, 110, 1.2],
  [14.6, 2520, -100, 1.7],
  [15.45, O.x + D.x * 95, O.y + D.y * 95, 3.6],
  [MACRO.t1, O.x - (MATCH1.x - 540) / Z1, O.y - (MATCH1.y - 960) / Z1, Z1],
];
export const macroCam = (t: number) => {
  const k = camKeys;
  if (t <= k[0][0]) return {x: k[0][1], y: k[0][2], z: k[0][3]};
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      // zoom interpolates in log space; the centre follows a smooth Catmull-Rom through the keys
      const [t0] = k[i - 1], [t1] = k[i];
      // one continuous move: ease in from the lab's push-in, then straight through every key (no stops), into the cut
      const x = clamp((t - t0) / (t1 - t0));
      const u = i === 1 ? x * x : x;
      const p0 = k[Math.max(0, i - 2)], p1 = k[i - 1], p2 = k[i], p3 = k[Math.min(k.length - 1, i + 1)];
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      return {x: cr(p0[1], p1[1], p2[1], p3[1]), y: cr(p0[2], p1[2], p2[2], p3[2]), z: Math.exp(lerp(Math.log(p1[3]), Math.log(p2[3]), u))};
    }
  }
  const l = k[k.length - 1];
  return {x: l[1], y: l[2], z: l[3]};
};

// ---- timings of the material
const T = {
  peel0: 8.85, peel1: 10.3, // fibers lift off and stream to the vial
  dis0: 10.0, dis1: 11.15, // dissolving
  draw0: 10.85, draw1: 11.6, // drawn up the tube into the reservoir
  feed0: 11.9, feedF: 13.85, feedO: 14.72, // silk front: wand rear -> needle base -> outlet
  cut0: 12.5, cut1: 13.0, // the cutaway opens (rear to front)
  ace0: 13.3, aceF: 14.0, aceO: 14.68, // acetone front
  jet: 14.8, close0: 16.05, close1: 16.45,
};
export const fiberLen = (t: number) => (t < T.jet ? 0 : (MATCH1.fiber / Z1) * (1 - (1 - clamp((t - T.jet) / (MACRO.t1 - T.jet))) ** 2.2));

// ---- helpers
const pth = (pts: P[], close = false) => (pts.length ? `M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}${close ? 'Z' : ''}` : '');
const bez = (a: P, b: P, c: P, d: P, n = 40): P[] => Array.from({length: n + 1}, (_, i) => {
  const u = i / n, k0 = (1 - u) ** 3, k1 = 3 * u * (1 - u) ** 2, k2 = 3 * u * u * (1 - u), k3 = u ** 3;
  return {x: a.x * k0 + b.x * k1 + c.x * k2 + d.x * k3, y: a.y * k0 + b.y * k1 + c.y * k2 + d.y * k3};
});
const along = (pts: P[], s: number) => {
  // point at arc-length fraction s
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const d = clamp(s) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) if (L[i] >= d) {
    const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return {x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u};
  }
  return pts[pts.length - 1];
};
const sub = (pts: P[], s0: number, s1: number, n = 40) => Array.from({length: n + 1}, (_, i) => along(pts, s0 + ((s1 - s0) * i) / n));
/** a band along the nozzle axis between offsets r0..r1 (on one side: sign), from axis distance a0 to a1 (from O) */
const band = (a0: number, a1: number, r0: number, r1: number, side: number) => {
  const p = (a: number, r: number) => add(add(O, D, a), NRM, r * side);
  return pth([p(a0, r0), p(a1, r0), p(a1, r1), p(a0, r1)], true);
};

// the fibers: each a wavy strand anchored on the cocoon's right end, streaming down into the vial
const FIB = Array.from({length: 9}, (_, i) => {
  const a = (-55 + i * 13) * (Math.PI / 180);
  const anchor = {x: COC.rx * 0.92 * Math.cos(a), y: COC.ry * 0.92 * Math.sin(a)};
  const end = {x: VIAL.x - 70 + i * 17, y: VIAL.surf + 120 + ((i * 37) % 90)};
  const c1 = {x: anchor.x + 140 + 10 * i, y: anchor.y - 10 + 6 * i}, c2 = {x: end.x - 60 + 8 * i, y: VIAL.top - 160 + 12 * i};
  return {i, anchor, path: bez(anchor, c1, c2, end, 60), delay: (i % 4) * 0.12 + Math.floor(i / 4) * 0.07, wob: 1 + (i % 3)};
});

// ------------------------------------------------------------------ pieces
const Cocoon: React.FC<{t: number; ol: number; u: string}> = ({t, ol, u}) => {
  const {rx, ry, rot} = COC;
  // fine strands wrapped round the cocoon; on the right end some lift away (they become the streaming fibers)
  const wraps = Array.from({length: 26}).map((_, i) => {
    const u = -0.92 + (i / 25) * 1.84;
    const x = u * rx, h = ry * Math.sqrt(Math.max(0, 1 - u * u)) * 0.98;
    const bow = 18 * Math.sin(i * 1.7);
    return <path key={i} d={`M ${f1(x - 6)} ${f1(-h)} Q ${f1(x + bow)} 0 ${f1(x + 6)} ${f1(h)}`} fill="none" stroke={i % 2 ? '#C9B484' : '#FFFFFF'} strokeWidth={i % 2 ? ol * 0.45 : ol * 0.6} opacity={i % 2 ? 0.55 : 0.5} />;
  });
  return (
    <g transform={`rotate(${rot})`}>
      <ellipse cx={8} cy={ry * 0.8} rx={rx * 0.95} ry={ry * 0.3} fill="#000" opacity={0.2} />
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={C.cocoon} stroke={INK} strokeWidth={ol} />
      <ellipse cx={rx * 0.12} cy={ry * 0.3} rx={rx * 0.8} ry={ry * 0.55} fill={C.cocoonD} opacity={0.45} />
      <g clipPath={`url(#cocClip${u})`}>{wraps}</g>
      <ellipse cx={-rx * 0.35} cy={-ry * 0.45} rx={rx * 0.3} ry={ry * 0.16} fill="#FFFFFF" opacity={0.55} />
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={ol} />
      {void t}
    </g>
  );
};
const Fibers: React.FC<{t: number; ol: number}> = ({t, ol}) => (
  <g>
    {FIB.map((f) => {
      const g = ss(t, T.peel0 + f.delay, T.peel1 - 0.25 + f.delay * 0.5); // how far along its path it has streamed
      if (g <= 0.002) return null;
      const pts = sub(f.path, 0, g, 60).map((p, k, arr) => {
        // a gentle travelling wave so the strands read as soft fibers, not wires
        const s = k / (arr.length - 1);
        const w = Math.sin(s * 9 + t * 4 * f.wob + f.i) * 5 * s * (1 - s * 0.5);
        return {x: p.x + w * 0.4, y: p.y + w};
      });
      // the part under the liquid surface dissolves: it softens, widens, takes the liquid's colour and fades
      const inLiq = (p: P) => p.y > VIAL.surf - 4 && Math.abs(p.x - VIAL.x) < VIAL.hw;
      const above = pts.filter((p) => !inLiq(p)), below = pts.filter(inLiq);
      const dis = ss(t, T.dis0 + f.delay, T.dis1 - 0.1);
      // once dissolving is well along, the strands above the surface also run out (the cocoon has given its silk)
      const fadeTop = ss(t, T.dis1 - 0.4, T.dis1 + 0.25);
      return (
        <g key={f.i}>
          {above.length > 1 && <g opacity={1 - fadeTop}><path d={pth(above)} fill="none" stroke={INK} strokeWidth={ol * 0.55 + 4} strokeLinecap="round" /><path d={pth(above)} fill="none" stroke={C.silk} strokeWidth={4} strokeLinecap="round" /></g>}
          {below.length > 1 && <path d={pth(below)} fill="none" stroke={mixHex(C.silk, C.liq, dis)} strokeWidth={4 + 14 * dis} strokeLinecap="round" opacity={(1 - dis) * 0.9} />}
        </g>
      );
    })}
  </g>
);
const Vial: React.FC<{t: number; ol: number; front: boolean}> = ({t, ol, front}) => {
  const {x, top, bot, hw, surf} = VIAL;
  const outline = `M ${x - hw} ${top} L ${x - hw} ${bot - hw} A ${hw} ${hw} 0 0 0 ${x + hw} ${bot - hw} L ${x + hw} ${top}`;
  const drained = ss(t, T.draw0, T.draw1) * 0.55; // some liquid drawn off
  const s = surf + (bot - surf) * drained;
  const liquid = `M ${x - hw + 6} ${s} L ${x - hw + 6} ${bot - hw} A ${hw - 6} ${hw - 6} 0 0 0 ${x + hw - 6} ${bot - hw} L ${x + hw - 6} ${s} Z`;
  const col = mixHex(C.clear, C.liq, ss(t, T.dis0 + 0.2, T.dis1));
  if (!front) {
    return (
      <g>
        <path d={`${outline} Z`} fill={C.glass} opacity={0.18} />
        <path d={liquid} fill={col} opacity={0.88} />
        <path d={`M ${x - hw + 6} ${s} L ${x + hw - 6} ${s}`} stroke="#FFFFFF" strokeWidth={4} opacity={0.6} />
      </g>
    );
  }
  return (
    <g>
      <path d={outline} fill="none" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
      <path d={`M ${x - hw + 18} ${top + 30} L ${x - hw + 18} ${bot - hw - 10}`} stroke="#FFFFFF" strokeWidth={10} opacity={0.35} strokeLinecap="round" />
      <path d={`M ${x - hw - 14} ${top} L ${x + hw + 14} ${top}`} stroke={INK} strokeWidth={ol * 1.6} strokeLinecap="round" />
    </g>
  );
};
// the draw tube: from inside the vial, up out of the mouth, over to the reservoir
const DRAW = bez({x: VIAL.x + 60, y: VIAL.bot - 40}, {x: VIAL.x + 120, y: VIAL.bot + 90}, {x: RES.a.x - 260, y: RES.a.y + 160}, add(RES.a, D, -6), 50);
// the feed tube: reservoir outlet to the nozzle's rear
const FEED = bez(add(RES_B, D, 30), add(RES_B, D, 220), add(WR, D, -260), WR, 40);
// the acetone line: comes up from below into the rear of the nozzle
const ACE = bez(add(add(WR, D, 120), NRM, 700), add(add(WR, D, 120), NRM, 380), add(add(WR, D, -120), NRM, 140), add(add(WR, D, 30), NRM, 60), 40);

const Tube: React.FC<{pts: P[]; r: number; fill: P[] | null; col: string; ol: number; frac?: [number, number]}> = ({pts, r, fill, col, ol, frac}) => (
  <g>
    <path d={pth(pts)} fill="none" stroke={INK} strokeWidth={2 * r + 2 * ol} strokeLinecap="round" strokeLinejoin="round" />
    <path d={pth(pts)} fill="none" stroke="#EAF2F4" strokeWidth={2 * r} strokeLinecap="round" strokeLinejoin="round" />
    {fill && frac && frac[1] > frac[0] && <path d={pth(sub(pts, frac[0], frac[1], 60))} fill="none" stroke={col} strokeWidth={2 * r * 0.62} strokeLinecap="round" strokeLinejoin="round" />}
    <path d={pth(pts.map((p) => ({x: p.x - r * 0.3, y: p.y - r * 0.3})))} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.3} strokeLinecap="round" opacity={0.6} />
  </g>
);
const Reservoir: React.FC<{t: number; ol: number}> = ({t, ol}) => {
  const a = RES.a, b = RES_B, r = RES.r;
  const p = (s: number, off: number) => add(add(a, D, s * RES.len), NRM, off);
  const fill = ss(t, T.draw0 + 0.35, T.draw1 + 0.3);
  const lvl = 0.12 + 0.75 * fill;
  // plunger at the rear end pushes (from the feed start)
  const push = 0.05 * ss(t, T.feed0 - 0.2, T.aceO);
  return (
    <g>
      <path d={pth([p(0, -r), p(1, -r), p(1, r), p(0, r)], true)} fill="#F4FAFB" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
      <path d={pth([p(push + 0.04, -r * 0.82), p(lvl + push, -r * 0.82), p(lvl + push, r * 0.82), p(push + 0.04, r * 0.82)], true)} fill={C.liq} opacity={0.95} />
      <path d={pth([p(push, -r * 0.86), p(push + 0.05, -r * 0.86), p(push + 0.05, r * 0.86), p(push, r * 0.86)], true)} fill="#4F5D64" stroke={INK} strokeWidth={ol * 0.8} />
      <path d={pth([p(-0.35, -8), p(push, -8), p(push, 8), p(-0.35, 8)], true)} fill="#E8EDEF" stroke={INK} strokeWidth={ol * 0.8} />
      <path d={pth([p(1, -16), add(b, D, 34), add(add(b, D, 34), NRM, 16), p(1, 16)], true)} fill="#E8EDEF" stroke={INK} strokeWidth={ol * 0.8} />
      <path d={pth([p(0.06, -r * 0.62), p(0.95, -r * 0.62)])} stroke="#FFFFFF" strokeWidth={8} opacity={0.6} strokeLinecap="round" />
    </g>
  );
};

/** the nozzle: body, collar and needle; `cut` opens the near half from the rear (0) to the front (1); flows inside */
const Nozzle: React.FC<{t: number; ol: number; u: string}> = ({t, ol, u}) => {
  const cut = ss(t, T.cut0, T.cut1) * (1 - ss(t, T.close0, T.close1));
  const aBody0 = -(NEEDLE + BODY), aBody1 = -NEEDLE, aCol = -NEEDLE - 60;
  const P2 = (a: number, r: number) => add(add(O, D, a), NRM, r);
  // silk front position along the axis (a from O; negative = behind the outlet)
  const silkA = t < T.feed0 ? aBody0 - 400 : t < T.feedF ? lerp(aBody0 - 200, aBody1, ss(t, T.feed0, T.feedF) ** 0.9) : lerp(aBody1, 0, clamp((t - T.feedF) / (T.feedO - T.feedF)));
  const aceA = t < T.ace0 ? aBody0 - 400 : t < T.aceF ? lerp(aBody0, aBody1, clamp((t - T.ace0) / (T.aceF - T.ace0))) : lerp(aBody1, 0, clamp((t - T.aceF) / (T.aceO - T.aceF)));
  // the cut line: the near half is removed behind this axial position
  const cutA = lerp(aBody0 - 40, 40, cut);
  const shellTop = (a0: number, a1: number, r0: number, r1: number) => pth([P2(a0, -r0), P2(a1, -r0), P2(a1, -r1), P2(a0, -r1)], true);
  // flow particles (dashes moving toward the outlet)
  const parts = (a0: number, a1: number, r0: number, r1: number, front: number, speed: number, col: string, n: number, key: string) => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const L = a1 - a0;
      const a = a0 + ((((i * 97.3) % L) + t * speed) % L);
      if (a > front) continue;
      const r = lerp(r0, r1, ((i * 0.618) % 1));
      const p = P2(a, r), q = P2(a + 22, r);
      out.push(<line key={`${key}${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={col} strokeWidth={5} strokeLinecap="round" opacity={0.8} />);
    }
    return out;
  };
  // geometry of the channels (radial offsets; both sides of the axis)
  const lumenR = (a: number) => (a < aCol ? R.lumen : R.innerIn);
  const sides = [-1, 1];
  const silkFill = (side: number) => {
    const a0 = aBody0, a1 = Math.min(silkA, -8);
    if (a1 <= a0) return null;
    const pts: P[] = [];
    for (let a = a0; a <= a1; a += 20) pts.push(P2(a, side * lumenR(a)));
    pts.push(P2(a1, side * lumenR(a1)));
    for (let a = a1; a >= a0; a -= 20) pts.push(P2(a, 0));
    pts.push(P2(a0, 0));
    return <path d={pth(pts, true)} fill={C.liq} />;
  };
  const aceFill = (side: number) => {
    const a1 = Math.min(aceA, -2);
    if (a1 <= aBody0) return null;
    // body: a wide channel; collar: it narrows into the annulus round the inner needle
    const rIn = (a: number) => (a < aCol ? R.aceIn : R.inner + 2), rOut = (a: number) => (a < aCol ? R.aceOut : R.sleeveIn);
    const pts: P[] = [];
    for (let a = aBody0; a <= a1; a += 20) pts.push(P2(a, side * rOut(a)));
    pts.push(P2(a1, side * rOut(a1)));
    for (let a = a1; a >= aBody0; a -= 20) pts.push(P2(a, side * rIn(a)));
    return <path d={pth(pts, true)} fill={C.ace} opacity={0.92} />;
  };
  // the interior (seen through the cut): channel walls in section
  const interior = (
    <g>
      {/* body interior background */}
      <path d={pth([P2(aBody0, -R.bodyIn), P2(aCol, -R.bodyIn), P2(aCol, R.bodyIn), P2(aBody0, R.bodyIn)], true)} fill="#DDE5E8" />
      <path d={pth([P2(aCol, -R.sleeveIn), P2(0, -R.sleeveIn), P2(0, R.sleeveIn), P2(aCol, R.sleeveIn)], true)} fill="#DDE5E8" />
      {sides.map((s) => <g key={s}>{aceFill(s)}{silkFill(s)}</g>)}
      {parts(aBody0, -10, -R.lumen * 0.7, R.lumen * 0.7, silkA, 180, '#FFF2C4', 26, 's')}
      {parts(aBody0, -10, R.aceIn + 6, R.aceOut - 6, aceA, 230, '#DFFBF7', 18, 'a')}
      {parts(aBody0, -10, -R.aceOut + 6, -R.aceIn - 6, aceA, 230, '#DFFBF7', 18, 'b')}
      {/* the wall between the silk lumen and the acetone channel (body), then the inner needle wall */}
      {sides.map((s) => (
        <g key={`w${s}`}>
          <path d={pth([P2(aBody0, s * R.lumen), P2(aCol, s * R.lumen), P2(aCol, s * R.aceIn), P2(aBody0, s * R.aceIn)], true)} fill={C.steelD} stroke={INK} strokeWidth={ol * 0.6} />
          <path d={pth([P2(aCol, s * R.innerIn), P2(-14, s * R.innerIn), P2(-14, s * (R.inner + 2)), P2(aCol, s * (R.inner + 2))], true)} fill={C.steel} stroke={INK} strokeWidth={ol * 0.6} />
        </g>
      ))}
    </g>
  );
  const outerShell = (half: number) => {
    // half = -1: the far half (always drawn), +1: the near half (removed behind the cut line)
    const segs: React.ReactNode[] = [];
    const s = half;
    segs.push(<path key="b" d={pth([P2(aBody0, 0), P2(aBody1 - 60, 0), P2(aBody1 - 60, s * R.body), P2(aBody0, s * R.body)], true)} fill={C.body} />);
    segs.push(<path key="band" d={pth([P2(aBody1 - 260, 0), P2(aBody1 - 160, 0), P2(aBody1 - 160, s * R.body * 1.02), P2(aBody1 - 260, s * R.body * 1.02)], true)} fill={C.teal} />);
    segs.push(<path key="c" d={pth([P2(aBody1 - 60, 0), P2(aBody1 + 10, 0), P2(aBody1 + 10, s * R.collar), P2(aBody1 - 60, s * R.collar)], true)} fill={C.steelD} />);
    segs.push(<path key="n" d={pth([P2(aBody1 + 10, 0), P2(0, 0), P2(0, s * R.sleeve), P2(aBody1 + 10, s * R.sleeve)], true)} fill={C.steel} />);
    return <g>{segs}</g>;
  };
  const outline = pth([P2(aBody0, -R.body), P2(aBody1 - 60, -R.body), P2(aBody1 - 60, -R.collar), P2(aBody1 + 10, -R.collar), P2(aBody1 + 10, -R.sleeve), P2(0, -R.sleeve), P2(0, R.sleeve), P2(aBody1 + 10, R.sleeve), P2(aBody1 + 10, R.collar), P2(aBody1 - 60, R.collar), P2(aBody1 - 60, R.body), P2(aBody0, R.body)]);
  // the cut: the shell is a full silhouette, then the section (interior) is shown inside it behind the cut line
  const clipCut = pth([P2(aBody0 - 50, -300), P2(cutA, -300), P2(cutA, 300), P2(aBody0 - 50, 300)], true);
  void outerShell;
  return (
    <g>
      <defs>
        <clipPath id={`nozShape${u}`}><path d={`${outline} Z`} /></clipPath>
        <clipPath id={`cutZone${u}`}><path d={clipCut} /></clipPath>
      </defs>
      <g clipPath={`url(#nozShape${u})`}>
        {outerShell(-1)}
        {outerShell(1)}
        {cut > 0.001 && (
          <g clipPath={`url(#cutZone${u})`}>
            {/* the cut faces: the shell walls in section, then the interior */}
            <path d={pth([P2(aBody0, -R.body), P2(aBody1 - 60, -R.body), P2(aBody1 - 60, R.body), P2(aBody0, R.body)], true)} fill="#B8C6CC" />
            <path d={pth([P2(aBody1 - 60, -R.collar), P2(aBody1 + 10, -R.collar), P2(aBody1 + 10, R.collar), P2(aBody1 - 60, R.collar)], true)} fill={C.steelD} />
            <path d={pth([P2(aBody1 + 10, -R.sleeve), P2(0, -R.sleeve), P2(0, R.sleeve), P2(aBody1 + 10, R.sleeve)], true)} fill={C.steelD} />
            {interior}
            {/* the cut line itself, a crisp edge travelling forward while the cutaway opens */}
          </g>
        )}
      </g>
      <path d={`${outline} Z`} fill="none" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
      {cut > 0.001 && cut < 0.999 && (() => {
        const a = P2(cutA, -R.body - 20), b = P2(cutA, R.body + 20);
        return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeWidth={ol} opacity={0.0} />;
      })()}
    </g>
  );
};
/** beyond the outlet: the silk jet inside its acetone sheath; the silk hardens into one connected fiber, the sheath
 *  thins and its last traces lift away */
const Outlet: React.FC<{t: number; ol: number; u: string}> = ({t, ol, u}) => {
  const L = fiberLen(t);
  const bead = t < T.jet ? ss(t, T.feedO - 0.05, T.jet) * 10 : 0;
  const P2 = (a: number, r: number) => add(add(O, D, a), NRM, r);
  const droop = (a: number) => 0.00012 * a * a; // a very slight fall over a long stretch
  const ax = (a: number, r: number) => add(P2(a, r), {x: 0, y: droop(a)});
  if (L <= 0 && bead <= 0) return null;
  // the sheath: from the outlet, tapering and fading over ~110 units
  const sheathL = Math.min(L, 80) * ss(t, T.jet - 0.05, T.jet + 0.15);
  const sheathOp = 0.85 * (1 - 0.35 * ss(t, T.close0, MACRO.t1));
  const sheath: P[] = [];
  for (let a = 0; a <= sheathL; a += 4) sheath.push(ax(a, -lerp(R.sleeveIn, 8, (a / 80) ** 0.7)));
  for (let a = sheathL; a >= 0; a -= 4) sheath.push(ax(a, lerp(R.sleeveIn, 8, (a / 80) ** 0.7)));
  // the jet: liquid at the outlet, hardening over the first ~110 units; radius narrows to the fiber's
  const H0 = 70;
  const jetR = (a: number) => lerp(R.innerIn, 6, ss(a, 0, H0));
  const top: P[] = [], bot: P[] = [];
  for (let a = 0; a <= L; a += 5) { top.push(ax(a, -jetR(a))); bot.push(ax(a, jetR(a))); }
  const hard = ss(t, T.jet + 0.05, T.jet + 0.5); // hardening begins as the sheath forms round the jet
  const grad = `jetg${u}`;
  const p0 = ax(0, 0), p1 = ax(H0, 0);
  // fibrils: short strokes along the solid part, so it reads as a drawn fiber, not a liquid
  const fib: React.ReactNode[] = [];
  for (let a = H0 * 0.7; a < L - 8; a += 26) {
    const q0 = ax(a, -2), q1 = ax(a + 12, -2);
    fib.push(<line key={a} x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke="#D9D2BE" strokeWidth={1.6} opacity={hard * 0.9} />);
  }
  const wisps = [0, 1, 2, 3].map((i) => {
    const tw = (t - T.jet - 0.25 - i * 0.3);
    if (tw <= 0 || L < 60) return null;
    const life = (tw % 1.2) / 1.2;
    const a = 40 + i * 22 + life * 30;
    const side = i % 2 ? 1 : -1;
    const p = ax(a, side * (22 + life * 60));
    return <path key={i} d={`M ${f1(p.x)} ${f1(p.y)} q ${f1(10 * side)} ${f1(-12)} ${f1(2)} ${f1(-26)} q ${f1(-10 * side)} ${f1(-12)} ${f1(4)} ${f1(-24)}`} fill="none" stroke={C.ace} strokeWidth={3} strokeLinecap="round" opacity={(1 - life) * 0.55 * sheathOp} />;
  });
  return (
    <g>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}>
          <stop offset="0" stopColor={C.liq} />
          <stop offset={0.25 + 0.5 * (1 - hard)} stopColor={mixHex(C.liq, C.silk, 0.5)} />
          <stop offset="1" stopColor={hard > 0.01 ? C.silk : C.liq} />
        </linearGradient>
      </defs>
      {bead > 0 && <circle cx={O.x + D.x * bead * 0.6} cy={O.y + D.y * bead * 0.6} r={bead} fill={C.liq} stroke={INK} strokeWidth={ol * 0.7} />}
      {L > 0 && sheath.length > 2 && <path d={pth(sheath, true)} fill={C.ace} opacity={sheathOp * 0.75} stroke={C.aceD} strokeWidth={2} />}
      {L > 0 && top.length > 1 && <path d={pth([...top, ...bot.reverse()], true)} fill={`url(#${grad})`} stroke={INK} strokeWidth={ol * 0.7} strokeLinejoin="round" />}
      {fib}
      {wisps}
    </g>
  );
};

// ------------------------------------------------------------------ the shot
export const MacroScene: React.FC<{t: number}> = ({t}) => {
  const cam = macroCam(t);
  const u = `m${Math.round(t * 1000)}`;
  const z = cam.z;
  const ol = Math.max(2, Math.min(5, 4 * Math.pow(z, 0.5))) / z; // ink in world units
  const tf = `translate(540 960) scale(${z.toFixed(5)}) translate(${f1(-cam.x)} ${f1(-cam.y)})`;
  // soft out-of-focus shapes behind (the lab beyond), moving at a fraction of the camera
  const bokeh = [
    {x: -300, y: -500, r: 260, c: '#3E6A72'}, {x: 600, y: -700, r: 340, c: '#4E5F3E'}, {x: 1500, y: -900, r: 300, c: '#3E6A72'},
    {x: 2300, y: -800, r: 380, c: '#5A5038'}, {x: 3100, y: -1000, r: 320, c: '#3E6A72'}, {x: 900, y: 1300, r: 280, c: '#3B4B54'}, {x: 2600, y: 900, r: 360, c: '#3B4B54'},
  ];
  const par = 0.35;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={`mbg${u}`} cx="0.5" cy="0.45" r="0.85"><stop offset="0" stopColor={C.bg1} /><stop offset="1" stopColor={C.bg0} /></radialGradient>
        <filter id={`mblur${u}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={60} /></filter>
        <clipPath id={`cocClip${u}`}><ellipse cx={0} cy={0} rx={COC.rx} ry={COC.ry} /></clipPath>
        <radialGradient id={`mvig${u}`} cx="0.5" cy="0.47" r="0.78"><stop offset="0.6" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.4} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#mbg${u})`} />
      <g filter={`url(#mblur${u})`} opacity={0.55}>
        {bokeh.map((k, i) => <circle key={i} cx={540 + (k.x - cam.x * par) * 0.5} cy={960 + (k.y - cam.y * par) * 0.5} r={k.r} fill={k.c} />)}
      </g>
      <g transform={tf}>
        <Vial t={t} ol={ol} front={false} />
        <Tube pts={DRAW} r={14} fill={DRAW} col={C.liq} ol={ol} frac={[0, ss(t, T.draw0, T.draw1)]} />
        <Fibers t={t} ol={ol} />
        <Vial t={t} ol={ol} front />
        <g transform={`translate(${COC.c.x} ${COC.c.y})`}><Cocoon t={t} ol={ol} u={u} /></g>
        <Reservoir t={t} ol={ol} />
        <Tube pts={FEED} r={16} fill={FEED} col={C.liq} ol={ol} frac={[0, ss(t, T.feed0 - 0.25, T.feed0 + 0.25)]} />
        <Tube pts={ACE} r={16} fill={ACE} col={C.ace} ol={ol} frac={[0, ss(t, T.ace0 - 0.6, T.ace0)]} />
        <Outlet t={t} ol={ol} u={u} />
        <Nozzle t={t} ol={ol} u={u} />
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#mvig${u})`} />
      {void keyS}
    </svg>
  );
};
