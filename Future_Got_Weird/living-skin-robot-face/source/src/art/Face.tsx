// The 2024 experimental face, as a simple laboratory device: a pink cultured-skin covering on a white face-shaped
// base, mounted on a block with two pull actuators at mouth level. Drawn as a real 2.5D model (dome surface projected
// with yaw/pitch), so alternate viewpoints are rebuilt, not a rotated flat drawing. No eyes, teeth or lips: shallow
// hollows and one mouth crease only, matching the simplicity of the research prototype.
// Smile = one displacement field driven by the mouth-corner anchors; every surface mark (crease, pores, sheen, window)
// moves with that same field, so the covering stays attached and coherent.
import React from 'react';
import {Pt, hull, path, smooth, lerp, rnd, clamp} from '../lib';
import {TissueSection, TMap, DERM} from './Tissue';

export type View = {yaw: number; pitch: number}; // radians
export type P3 = {x: number; y: number; z: number};
export const proj = (p: P3, v: View): Pt => {
  const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
  const x1 = p.x * c + p.z * s, z1 = -p.x * s + p.z * c;
  return {x: x1, y: p.y * Math.cos(v.pitch) + z1 * Math.sin(v.pitch)};
};
const depth = (p: P3, v: View) => -p.x * Math.sin(v.yaw) + p.z * Math.cos(v.yaw);

export const FACE = {a: 250, b: 312, T: 16, formPad: 22, corner: {x: 118, y: 150}};
export const K = {
  skin: '#EBA3A6', skinLight: '#FAD0CD', skinDark: '#C97279', skinDeep: '#A9545F', skinEdge: '#B6606B',
  form: '#EEF2F5', formShade: '#BAC5CF', block: '#E3E8EC', blockSide: '#AEB9C3', blockTop: '#F4F7F9', blockInk: '#7D8B98',
  metal: '#3B444E', metalDark: '#232A31', metalHi: '#8E9AA6', rod: '#C9D2DA', accent: '#E0475A',
  bg0: '#16212B', bg1: '#0B1117', bench: '#1E2A35', benchTop: '#2A3846',
};

// face-form dome (white base under the skin)
const A2 = FACE.a + FACE.formPad, B2 = FACE.b + FACE.formPad;
export const formZ = (x: number, y: number) => {
  const q = (x / A2) ** 2 + (y / B2) ** 2;
  if (q >= 1) return 0;
  const dome = 84 * Math.pow(1 - q, 0.55);
  const nose = 24 * Math.exp(-((x / 38) ** 2 + ((y - 12) / 70) ** 2));
  const eyes = -11 * (Math.exp(-(((x - 100) / 52) ** 2 + ((y + 96) / 32) ** 2)) + Math.exp(-(((x + 100) / 52) ** 2 + ((y + 96) / 32) ** 2)));
  return dome + nose + eyes;
};
// smile displacement field: corner anchors pull up and outward; cheeks bulge
export const disp = (x: number, y: number, s: number): P3 => {
  let dx = 0, dy = 0, dz = 0;
  for (const sg of [-1, 1]) {
    const cx = sg * FACE.corner.x, cy = FACE.corner.y;
    const w = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (88 * 88));
    dx += s * sg * 17 * w;
    dy += s * -46 * w;
    const wb = Math.exp(-((x - (cx + sg * 34)) ** 2 + (y - (cy - 58)) ** 2) / (62 * 62));
    dz += s * 15 * wb;
  }
  return {x: dx, y: dy, z: dz};
};
// a rest-position point on the skin top surface -> displaced 3D point
export const skinPt = (x: number, y: number, s: number, lift = FACE.T): P3 => {
  const d = disp(x, y, s);
  return {x: x + d.x, y: y + d.y, z: formZ(x, y) + lift + d.z};
};
export const skinScreen = (x: number, y: number, s: number, v: View, lift = FACE.T) => proj(skinPt(x, y, s, lift), v);

// mouth crease in rest coordinates, u in [-1, 1]
export const mouthRest = (u: number, s: number) => ({x: u * FACE.corner.x, y: FACE.corner.y + 7 * (1 - u * u) + 11 * s * (1 - u * u) ** 2});

// the cheek section window (rest coordinates) and the tissue region it shows
export const WIN = {x0: 112, x1: 240, y0: -44, y1: 36, u0: 420, u1: 860, wMax: 236};
export const winQuad = (s: number, v: View): Pt[] => [
  skinScreen(WIN.x0, WIN.y0, s, v), skinScreen(WIN.x1, WIN.y0, s, v), skinScreen(WIN.x1, WIN.y1, s, v), skinScreen(WIN.x0, WIN.y1, s, v),
];
export const winMap = (s: number, v: View): TMap => {
  const Q = winQuad(s, v);
  return (u, w) => {
    const a = (u - WIN.u0) / (WIN.u1 - WIN.u0), b = w / WIN.wMax;
    const top = {x: lerp(Q[0].x, Q[1].x, a), y: lerp(Q[0].y, Q[1].y, a)};
    const bot = {x: lerp(Q[3].x, Q[2].x, a), y: lerp(Q[3].y, Q[2].y, a)};
    return {x: lerp(top.x, bot.x, b), y: lerp(top.y, bot.y, b)};
  };
};

// rounded-rect outline in the xy plane
const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 6): {x: number; y: number}[] => {
  const pts: {x: number; y: number}[] = [];
  const cs = [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= n; i++) {
    const a = ((a0 + (90 * i) / n) * Math.PI) / 180;
    pts.push({x: cx + r * Math.cos(a), y: cy + r * Math.sin(a)});
  }
  return pts;
};

// extruded prism along z with per-face shading (only camera-facing side quads are drawn)
export const Extrude: React.FC<{pts: {x: number; y: number}[]; z0: number; z1: number; v: View; front: string; side: string; sideDark: string; top?: string; stroke?: string}> = ({pts, z0, z1, v, front, side, sideDark, top, stroke}) => {
  const F = pts.map((p) => proj({...p, z: z0}, v)), B = pts.map((p) => proj({...p, z: z1}, v));
  const quads: React.ReactNode[] = [];
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const q = [F[i], F[j], B[j], B[i]];
    const area = (q[1].x - q[0].x) * (q[3].y - q[0].y) - (q[1].y - q[0].y) * (q[3].x - q[0].x);
    if (area > -0.01) continue;
    // outward normal of this edge in xy decides the tone: up-facing = lit top, right/left = sides
    const nx = pts[j].y - pts[i].y, ny = -(pts[j].x - pts[i].x);
    const fill = ny < -0.5 * Math.abs(nx) && top ? top : nx > 0 ? sideDark : side;
    quads.push(<path key={i} d={path(q)} fill={fill} stroke={fill} strokeWidth={0.8} />);
  }
  return (
    <g>
      {quads}
      <path d={path(F)} fill={front} stroke={stroke} strokeWidth={stroke ? 1.5 : 0} />
    </g>
  );
};

// horizontal cylinder (along x) between x0 and x1 at (y, z), radius r
const CylX: React.FC<{x0: number; x1: number; y: number; z: number; r: number; v: View; id: string; c0: string; c1: string}> = ({x0, x1, y, z, r, v, id, c0, c1}) => {
  const a = proj({x: x0, y: y - r, z}, v), b = proj({x: x1, y: y - r, z}, v), c = proj({x: x1, y: y + r, z}, v), d = proj({x: x0, y: y + r, z}, v);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.6" stopColor={c0} />
          <stop offset="1" stopColor={c1} />
        </linearGradient>
      </defs>
      <path d={path([a, b, c, d])} fill={`url(#${id})`} />
    </g>
  );
};

const PORES = Array.from({length: 190}, (_, i) => {
  const a = rnd(i * 2 + 1) * Math.PI * 2, r = Math.sqrt(rnd(i * 2 + 2)) * 0.93;
  return {x: Math.cos(a) * r * FACE.a, y: Math.sin(a) * r * FACE.b, k: rnd(i * 5 + 3)};
});

export const FaceDevice: React.FC<{
  v: View; s: number; t: number; id: string;
  win?: number; // 0 closed .. 1 open (section window in the right cheek)
  winTone?: number; stretch?: number; // emphasis of stretch sheen (on "skin")
  showStand?: boolean; anchorGlow?: number;
}> = ({v, s, t, id, win = 0, winTone = 0, stretch = 0, showStand = true, anchorGlow = 0}) => {
  // --- block, stand, actuators ---
  const block = rrect(-338, -410, 338, 420, 64);
  const housingR = rrect(230, -262, 470, -150, 16), housingL = rrect(-470, -262, -230, -150, 16);
  const slide = 16 * s; // output shaft travel (the pull)
  const yawR = Math.sin(v.yaw) < 0; // right side faces the camera
  // --- skin geometry ---
  const NS = 22;
  const top: Pt[] = [], rim0: Pt[] = [];
  for (let i = 0; i <= NS; i++) for (let j = 0; j <= NS; j++) {
    const x = (-1 + (2 * i) / NS) * FACE.a, y = (-1 + (2 * j) / NS) * FACE.b;
    if ((x / FACE.a) ** 2 + (y / FACE.b) ** 2 <= 1) top.push(skinScreen(x, y, s, v));
  }
  const rimN = 72;
  const rimT: Pt[] = [];
  for (let i = 0; i < rimN; i++) {
    const a = (i / rimN) * Math.PI * 2, x = Math.cos(a) * FACE.a, y = Math.sin(a) * FACE.b;
    rimT.push(skinScreen(x, y, s, v));
    rim0.push(skinScreen(x, y, s, v, 0));
  }
  const skinTopHull = hull([...top, ...rimT]);
  const skinSideHull = hull([...rimT, ...rim0]);
  const formRim: Pt[] = [];
  for (let i = 0; i < rimN; i++) {
    const a = (i / rimN) * Math.PI * 2;
    formRim.push(proj({x: Math.cos(a) * A2, y: Math.sin(a) * B2, z: 0}, v));
  }
  const formTop: Pt[] = [];
  for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) {
    const x = (-1 + i / 8) * A2, y = (-1 + j / 8) * B2;
    if ((x / A2) ** 2 + (y / B2) ** 2 <= 1) formTop.push(proj({x, y, z: formZ(x, y)}, v));
  }
  const formHull = hull([...formTop, ...formRim]);
  const L = skinScreen(-96, -176, s, v);
  // mouth crease
  const mouth = Array.from({length: 25}, (_, i) => {
    const u = -1 + i / 12, r = mouthRest(u, s);
    return skinScreen(r.x, r.y, s, v);
  });
  const mouthShadow = Array.from({length: 25}, (_, i) => {
    const u = -1 + i / 12, r = mouthRest(u, s);
    return skinScreen(r.x * 0.97, r.y + 7 + 3 * s * (1 - u * u), s, v);
  });
  const mouthHi = Array.from({length: 21}, (_, i) => {
    const u = -0.9 + (i / 20) * 1.8, r = mouthRest(u, s);
    return skinScreen(r.x * 0.98, r.y - 6, s, v);
  });
  const eye = (sg: number) => Array.from({length: 18}, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return skinScreen(sg * 100 + Math.cos(a) * 46, -96 + Math.sin(a) * 24, s, v);
  });
  const cornerPts = [-1, 1].map((sg) => skinScreen(sg * FACE.corner.x * 1.0, FACE.corner.y, s, v));
  const bulge = [-1, 1].map((sg) => skinScreen(sg * (FACE.corner.x + 34), FACE.corner.y - 58, s, v));
  // smile folds: from each pulled corner up and out along the bulge's lower edge
  const folds = [-1, 1].map((sg) => [0, 1, 2, 3, 4, 5].map((q) => {
    const k = q / 5;
    return skinScreen(sg * (FACE.corner.x + 8 + 30 * k), FACE.corner.y - 6 - 60 * k + 20 * k * k, s, v);
  }));
  // stretch sheen: short strokes along the pull direction between corner and cheek
  const sheen = [-1, 1].flatMap((sg) => [0, 1, 2, 3, 4].map((k) => {
    const ox = sg * (FACE.corner.x + 6 + k * 9), oy = FACE.corner.y - 18 - k * 13;
    return [0, 1, 2, 3, 4, 5].map((q) => skinScreen(ox + sg * q * 7, oy - q * 9 + k * 2, s, v));
  }));
  const wq = winQuad(s, v);
  const wOpen = clamp(win);
  const wClip = wq.map((p, i) => (i < 2 ? p : {x: lerp(wq[i === 2 ? 1 : 0].x, p.x, wOpen), y: lerp(wq[i === 2 ? 1 : 0].y, p.y, wOpen)}));
  const pz = 0.6 + 0.4 * s;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} gradientUnits="userSpaceOnUse" cx={L.x} cy={L.y} r={470}>
          <stop offset="0" stopColor={K.skinLight} />
          <stop offset="0.38" stopColor={K.skin} />
          <stop offset="0.78" stopColor={K.skinDark} />
          <stop offset="1" stopColor={K.skinDeep} />
        </radialGradient>
        <radialGradient id={`${id}-form`} gradientUnits="userSpaceOnUse" cx={L.x} cy={L.y} r={480}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.7" stopColor={K.form} />
          <stop offset="1" stopColor={K.formShade} />
        </radialGradient>
        <radialGradient id={`${id}-hollow`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor={K.skinDeep} stopOpacity={0.2} />
          <stop offset="1" stopColor={K.skinDeep} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-bulge`} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-blk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={K.blockTop} />
          <stop offset="1" stopColor={K.block} />
        </linearGradient>
        <clipPath id={`${id}-skinclip`}><path d={path(skinTopHull)} /></clipPath>
        <clipPath id={`${id}-win`}><path d={smooth([...wClip, wClip[0]].map((p) => p), true, 0.02)} /></clipPath>
      </defs>
      {showStand && (
        <g>
          <Extrude pts={rrect(-80, 380, 80, 620, 14)} z0={-60} z1={-120} v={v} front={K.metal} side={K.metalDark} sideDark={K.metalDark} />
          <Extrude pts={rrect(-230, 600, 230, 650, 18)} z0={40} z1={-220} v={v} front={K.metal} side={K.metalDark} sideDark={'#1A2026'} top={K.metalHi} />
        </g>
      )}
      {/* pull motors behind the block (upper back), cables down to the stand */}
      {[-1, 1].map((sg) => {
        const c0 = proj({x: sg * 300, y: -150, z: -230}, v), c1 = proj({x: sg * 300, y: 200, z: -236}, v), c2 = proj({x: sg * 60, y: 520, z: -110}, v);
        return <path key={sg} d={`M${c0.x} ${c0.y}C${c1.x} ${c1.y} ${c1.x} ${c1.y} ${c2.x} ${c2.y}`} fill="none" stroke={K.metalDark} strokeWidth={9} strokeLinecap="round" />;
      })}
      {[housingL, housingR].map((hp, k) => {
        const sg = k ? 1 : -1;
        return (
          <g key={k}>
            <Extrude pts={hp} z0={-165} z1={-262} v={v} front={K.metal} side={K.metalDark} sideDark={'#1A2026'} top={K.metalHi} />
            {[0, 1, 2, 3].map((q) => {
              const x = sg * (430 - q * 11);
              const a2 = proj({x, y: -252, z: -165}, v), b2 = proj({x, y: -160, z: -165}, v);
              return <line key={q} x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke={K.metalHi} strokeWidth={3} opacity={0.6} />;
            })}
            <CylX x0={sg > 0 ? 470 : -500} x1={sg > 0 ? 500 : -470} y={-206} z={-212} r={10} v={v} id={`${id}-sh${k}`} c0={K.rod} c1={K.metalHi} />
            {(() => {
              const x = sg * (478 + slide * 0.9);
              const p0 = proj({x: x - 5, y: -219, z: -212}, v), p1 = proj({x: x + 5, y: -193, z: -212}, v);
              return <rect x={Math.min(p0.x, p1.x)} y={p0.y} width={Math.abs(p1.x - p0.x) + 4} height={p1.y - p0.y} rx={2} fill={K.accent} />;
            })()}
          </g>
        );
      })}
      <Extrude pts={block} z0={0} z1={-150} v={v} front={`url(#${id}-blk)`} side={K.blockSide} sideDark={'#97A3AE'} top={K.blockTop} stroke={K.blockInk} />
      {/* screws */}
      {[[-290, -362], [290, -362], [-290, 372], [290, 372]].map(([x, y], k) => {
        const p = proj({x, y, z: 0}, v);
        return (
          <g key={k}>
            <circle cx={p.x} cy={p.y} r={11} fill={K.formShade} />
            <circle cx={p.x} cy={p.y} r={7} fill={K.blockInk} />
            <line x1={p.x - 5} y1={p.y} x2={p.x + 5} y2={p.y} stroke={K.form} strokeWidth={2} />
          </g>
        );
      })}
      {/* white face form, then the skin's cut edge (thickness), then the skin surface */}
      <path d={path(formHull)} fill={`url(#${id}-form)`} stroke={K.formShade} strokeWidth={1.5} />
      <path d={path(skinSideHull)} fill={K.skinEdge} />
      <path d={path(skinTopHull)} fill={`url(#${id}-skin)`} />
      <g clipPath={`url(#${id}-skinclip)`}>
        {[-1, 1].map((sg) => <path key={sg} d={smooth(eye(sg), true)} fill={`url(#${id}-hollow)`} />)}
        {/* nose: soft highlight and the shadow side */}
        {(() => {
          const n = skinScreen(-8, 0, s, v), nsh = skinScreen(22, 34, s, v);
          return (
            <g>
              <ellipse cx={nsh.x} cy={nsh.y} rx={26} ry={52} fill={`url(#${id}-hollow)`} opacity={0.9} />
              <ellipse cx={n.x - 4} cy={n.y - 10} rx={9} ry={34} fill="#FFFFFF" opacity={0.1} />
            </g>
          );
        })()}
        {/* living-tissue texture: pores move with the field (stretch reads on the surface) */}
        {PORES.map((p, k) => {
          const q = skinScreen(p.x, p.y, s, v);
          return <circle key={k} cx={q.x} cy={q.y} r={p.k > 0.5 ? 1.7 : 1.2} fill={p.k > 0.72 ? K.skinDeep : '#FFFFFF'} opacity={p.k > 0.72 ? 0.22 : 0.28} />;
        })}
        {bulge.map((b, k) => <ellipse key={k} cx={b.x} cy={b.y - 8} rx={46} ry={34} fill={`url(#${id}-bulge)`} opacity={0.75 * s} />)}
        {folds.map((f, k) => (
          <g key={k}>
            <path d={smooth(f)} fill="none" stroke={K.skinDeep} strokeWidth={9} strokeLinecap="round" opacity={0.16 * s} />
            <path d={smooth(f)} fill="none" stroke={K.skinDeep} strokeWidth={3} strokeLinecap="round" opacity={0.42 * s} />
          </g>
        ))}
        {sheen.map((pts, k) => <path key={k} d={smooth(pts)} fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={(0.08 + 0.32 * stretch) * clamp(s * 1.3 - 0.2)} />)}
        <path d={smooth(mouth)} fill="none" stroke={K.skinDeep} strokeWidth={16} strokeLinecap="round" opacity={0.2 * pz} />
        <path d={smooth(mouthShadow)} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.22} />
        <path d={smooth(mouth)} fill="none" stroke={K.skinDeep} strokeWidth={4.5} strokeLinecap="round" opacity={0.9} />
        <path d={smooth(mouthHi)} fill="none" stroke={K.skinDeep} strokeWidth={3} strokeLinecap="round" opacity={0.18} />
        {/* anchor sites at the mouth corners */}
        {cornerPts.map((c, k) => (
          <g key={k}>
            {anchorGlow > 0 && <circle cx={c.x} cy={c.y} r={22} fill="none" stroke="#7FF2EA" strokeWidth={3} opacity={anchorGlow} />}
            <circle cx={c.x} cy={c.y} r={6 + 2 * s} fill={K.skinDeep} opacity={0.75} />
            <circle cx={c.x - 1.5} cy={c.y - 2} r={2} fill="#FFFFFF" opacity={0.35} />
          </g>
        ))}
        {/* broad specular sheen of the moist culture */}
        {(() => {
          const h = skinScreen(-84, -170, s, v);
          const h2 = skinScreen(-150, -30, s, v), h3 = skinScreen(60, 210, s, v);
          return (
            <g>
              <ellipse cx={h.x} cy={h.y} rx={70} ry={30} fill="#FFFFFF" opacity={0.22} transform={`rotate(-24 ${h.x} ${h.y})`} />
              <ellipse cx={h.x - 20} cy={h.y - 6} rx={24} ry={8} fill="#FFFFFF" opacity={0.35} transform={`rotate(-24 ${h.x} ${h.y})`} />
              <ellipse cx={h2.x} cy={h2.y} rx={10} ry={36} fill="#FFFFFF" opacity={0.16} transform={`rotate(12 ${h2.x} ${h2.y})`} />
              <ellipse cx={h3.x} cy={h3.y} rx={40} ry={9} fill="#FFFFFF" opacity={0.14} transform={`rotate(-8 ${h3.x} ${h3.y})`} />
            </g>
          );
        })()}
      </g>
      {/* cheek section window: the cut face of the covering, magnified (illustrative scale) */}
      {wOpen > 0.001 && (
        <g>
          <path d={smooth([...wClip], true, 0.02)} fill={K.skinDeep} transform="translate(0 4)" opacity={0.5} />
          <g clipPath={`url(#${id}-win)`}>
            <rect x={-2000} y={-2000} width={4000} height={4000} fill={'#DCE6EC'} />
            <TissueSection m={winMap(s, v)} u0={WIN.u0 - 20} u1={WIN.u1 + 20} t={t} tone={winTone} id={`${id}-wt`} />
            {/* silicone layer below the dermis */}
            {(() => {
              const m = winMap(s, v);
              const a = Array.from({length: 11}, (_, i) => m(WIN.u0 - 20 + i * 44, DERM)), b = Array.from({length: 11}, (_, i) => m(WIN.u0 - 20 + i * 44, WIN.wMax + 30));
              return <path d={path([...a, ...b.reverse()])} fill="#CFDDE6" opacity={0.95} />;
            })()}
          </g>
          <g clipPath={`url(#${id}-win)`}>
            {(() => {
              const m = winMap(s, v);
              const a = Array.from({length: 11}, (_, i) => m(WIN.u0 + i * 40, 0)), b = Array.from({length: 11}, (_, i) => m(WIN.u0 + i * 40, -18));
              const l0 = Array.from({length: 9}, (_, i) => m(WIN.u0, i * 30)), l1 = Array.from({length: 9}, (_, i) => m(WIN.u0 - 14, i * 30));
              return (
                <g>
                  <path d={path([...l0, ...l1.reverse()])} fill={K.skinDeep} opacity={0.55} />
                  <path d={path([...a.map((p) => ({x: p.x, y: p.y + 7})), ...b.reverse()])} fill={K.skinEdge} opacity={0.9} />
                </g>
              );
            })()}
          </g>
          <path d={smooth([...wClip], true, 0.02)} fill="none" stroke={K.skinDeep} strokeWidth={3} />
          <path d={`M${wClip[0].x} ${wClip[0].y}L${wClip[1].x} ${wClip[1].y}`} stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />
        </g>
      )}
    </g>
  );
};
