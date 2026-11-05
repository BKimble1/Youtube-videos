// Original retro-shooter pixel art, generated procedurally (no game assets are used): wall, floor and ceiling textures,
// the enemy (a horned red brute, drawn here from shaded ellipses and quantised to a small palette), the weapon and
// its muzzle flash, impact puffs, and a 3x5 pixel font for the HUD. Every image is an RGBA array, built once.
export type Img = {w: number; h: number; px: Uint8ClampedArray};

const img = (w: number, h: number): Img => ({w, h, px: new Uint8ClampedArray(w * h * 4)});
const hex = (c: string): [number, number, number] => {
  const v = parseInt(c.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const put = (m: Img, x: number, y: number, c: [number, number, number], a = 255) => {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return;
  const i = (y * m.w + x) * 4;
  m.px[i] = c[0]; m.px[i + 1] = c[1]; m.px[i + 2] = c[2]; m.px[i + 3] = a;
};
const get = (m: Img, x: number, y: number) => {
  const i = (y * m.w + x) * 4;
  return m.px[i + 3];
};
/** deterministic integer hash noise in [0,1) */
export const hn = (x: number, y: number, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const ramp = (cols: string[], u: number) => hex(cols[Math.max(0, Math.min(cols.length - 1, Math.floor(u * cols.length)))]);

// ------------------------------------------------------------------ textures (64 x 64)
const T = 64;
/** 1: warm brick (corridor) */
const brick = () => {
  const m = img(T, T);
  const C = ['#3B2218', '#55301F', '#6E3F27', '#83502F', '#9A6238'];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const row = Math.floor(y / 16), off = row % 2 ? 16 : 0;
      const bx = (x + off) % 32, by = y % 16;
      const mortar = by < 2 || bx < 2;
      const n = hn(Math.floor((x + off) / 32), row, 3) * 0.25 + hn(x, y, 1) * 0.3;
      const edge = by === 2 || bx === 2 ? 0.25 : by === 15 || bx === 31 ? -0.2 : 0;
      put(m, x, y, mortar ? hex('#24160F') : ramp(C, 0.35 + n + edge));
    }
  return m;
};
/** 2: grey tech panel with rivets and a vent */
const tech = () => {
  const m = img(T, T);
  const C = ['#2A2F36', '#3A414A', '#4B545E', '#5E6873', '#76818C'];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const px = x % 32, py = y;
      let u = 0.45 + hn(x, y, 7) * 0.12;
      if (px === 0 || py === 0) u = 0.85;
      if (px === 31 || py === 63) u = 0.08;
      if ((px === 4 || px === 27) && (py === 4 || py === 59)) u = 0.95;
      if (py > 40 && py < 52 && px > 6 && px < 26 && py % 3 === 0) u = 0.1;
      put(m, x, y, ramp(C, u));
    }
  return m;
};
/** 3: rough stone blocks (passage) */
const stone = () => {
  const m = img(T, T);
  const C = ['#2C2A27', '#3D3A35', '#504B44', '#635D54', '#7A7268'];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const row = Math.floor(y / 21), off = (row * 23) % 64;
      const bx = (x + off) % 64 % 32, by = y % 21;
      const joint = by === 0 || bx === 0;
      const n = hn(Math.floor((x + off) / 32), row, 5) * 0.3 + hn(x >> 1, y >> 1, 2) * 0.35;
      put(m, x, y, joint ? hex('#1C1A18') : ramp(C, 0.2 + n + (by === 1 || bx === 1 ? 0.2 : 0)));
    }
  return m;
};
/** 4: tech panel with a glowing blue light strip */
const light = () => {
  const m = tech();
  for (let y = 8; y < 56; y++)
    for (let x = 12; x < 20; x++) put(m, x, y, x === 12 || x === 19 ? hex('#2C6E9E') : y % 8 < 1 ? hex('#7FD3FF') : hex('#BDEBFF'));
  for (let y = 8; y < 56; y++) for (let x = 44; x < 52; x++) put(m, x, y, x === 44 || x === 51 ? hex('#2C6E9E') : hex('#BDEBFF'));
  return m;
};
const floor = () => {
  const m = img(T, T);
  const C = ['#1E2124', '#2A2E31', '#363B3E', '#43494C'];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const tile = ((x >> 5) + (y >> 5)) % 2;
      const seam = x % 32 === 0 || y % 32 === 0;
      put(m, x, y, seam ? hex('#141618') : ramp(C, 0.3 + tile * 0.25 + hn(x, y, 9) * 0.2));
    }
  return m;
};
const ceil = () => {
  const m = img(T, T);
  const C = ['#16181B', '#1E2125', '#262A2F'];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const seam = x % 16 === 0 || y % 16 === 0;
      const lamp = x > 24 && x < 40 && y > 24 && y < 40;
      put(m, x, y, lamp ? hex(x % 4 === 0 ? '#9FB6C4' : '#D8E6EE') : seam ? hex('#101113') : ramp(C, 0.4 + hn(x, y, 4) * 0.3));
    }
  return m;
};
let TEX: Img[] | null = null;
export const textures = () => (TEX ??= [floor(), brick(), tech(), stone(), light(), ceil()]);
export const FLOOR = 0, CEIL = 5;

// ------------------------------------------------------------------ the enemy (original): 44 x 56 frames
export const EW = 44, EH = 56;
const SKIN = ['#24070A', '#3F0E0E', '#621912', '#882816', '#AD3C1B', '#D05E2A'];
const HORN = ['#2E2820', '#544A3D', '#8A7F6B', '#C9BFA6'];
const LIGHT_DIR = [-0.55, -0.62, 0.56];
type Ell = {cx: number; cy: number; rx: number; ry: number; rot?: number; pal: string[]; k?: number};
const shadeEll = (e: Ell, x: number, y: number): number | null => {
  const c = Math.cos(-(e.rot ?? 0)), s = Math.sin(-(e.rot ?? 0));
  const dx = x - e.cx, dy = y - e.cy;
  const u = (dx * c - dy * s) / e.rx, v = (dx * s + dy * c) / e.ry;
  const r2 = u * u + v * v;
  if (r2 > 1) return null;
  const z = Math.sqrt(1 - r2);
  // the normal back in screen space
  const nx = u * Math.cos(e.rot ?? 0) - v * Math.sin(e.rot ?? 0), ny = u * Math.sin(e.rot ?? 0) + v * Math.cos(e.rot ?? 0);
  return Math.max(0, Math.min(0.999, 0.25 + 0.75 * (nx * LIGHT_DIR[0] + ny * LIGHT_DIR[1] + z * LIGHT_DIR[2]) * (e.k ?? 1)));
};
export type Pose = 'walkA' | 'walkB' | 'attack' | 'pain' | 'die1' | 'die2' | 'die3';
const enemyFrame = (pose: Pose): Img => {
  const m = img(EW, EH);
  const parts: Ell[] = [];
  const down = pose === 'die1' ? 6 : pose === 'die2' ? 16 : pose === 'die3' ? 31 : 0;
  const tilt = pose === 'die1' ? 0.25 : pose === 'die2' ? 0.6 : pose === 'die3' ? 1.35 : pose === 'pain' ? -0.12 : 0;
  const lx = pose === 'walkA' ? -2 : pose === 'walkB' ? 2 : 0;
  const cx = 22, oy = down;
  // legs
  if (pose !== 'die3') {
    parts.push({cx: cx - 6 + lx, cy: 46 + oy * 0.4, rx: 4.2, ry: 8.5 - oy * 0.15, pal: SKIN, k: 0.8});
    parts.push({cx: cx + 6 - lx, cy: 46 + oy * 0.4, rx: 4.2, ry: 8.5 - oy * 0.15, pal: SKIN, k: 0.8});
  }
  const rot = (x: number, y: number): [number, number] => {
    // tilt the upper body about the hips
    const px = 22, py = 40;
    const c = Math.cos(tilt), s = Math.sin(tilt);
    return [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c + oy];
  };
  const P = (x: number, y: number, rx: number, ry: number, pal: string[], r = 0, k = 1) => {
    const [X, Y] = rot(x, y);
    parts.push({cx: X, cy: Y, rx, ry, rot: r + tilt, pal, k});
  };
  const armUp = pose === 'attack' ? -9 : pose === 'pain' ? -3 : 0;
  const swing = pose === 'walkA' ? 1.5 : pose === 'walkB' ? -1.5 : 0;
  // arms (behind the torso first)
  P(cx - 15, 30 + armUp + swing, 4.6, 9.5, SKIN, 0.3);
  P(cx + 15, 30 + armUp - swing, 4.6, 9.5, SKIN, -0.3);
  P(cx - 11, 22, 6.5, 5.5, SKIN, 0.4); // shoulders
  P(cx + 11, 22, 6.5, 5.5, SKIN, -0.4);
  P(cx, 30, 13.5, 11.5, SKIN); // torso
  P(cx, 34, 7.5, 6, ['#3A0B0B', '#561410', '#762314', '#93361A'], 0, 0.7); // belly plates
  P(cx, 17, 7.2, 6.6, SKIN); // head, sunk between the shoulders
  P(cx - 8, 9, 2.1, 6.5, HORN, -0.75); // horns, swept out
  P(cx + 8, 9, 2.1, 6.5, HORN, 0.75);
  const fill = new Array(EW * EH).fill(-1);
  for (const e of parts)
    for (let y = 0; y < EH; y++)
      for (let x = 0; x < EW; x++) {
        const u = shadeEll(e, x + 0.5, y + 0.5);
        if (u !== null) {
          put(m, x, y, ramp(e.pal, pose === 'pain' ? Math.min(0.999, u + 0.18) : u));
          fill[y * EW + x] = 1;
        }
      }
  // face details
  const face = (x: number, y: number, c: string) => {
    const [X, Y] = rot(x, y);
    put(m, Math.round(X), Math.round(Y), hex(c));
  };
  if (pose !== 'die3') {
    for (const ex of [-3, 3]) {
      face(cx + ex - 0.5, 15, '#FFE45C'); face(cx + ex + 0.5, 15, '#FFF7B8'); face(cx + ex - 0.5, 16, '#E8A21E'); face(cx + ex + 0.5, 16, '#FFD23A');
    }
    const open = pose === 'pain' || pose === 'attack' ? 2 : 1;
    for (let x = -4; x <= 4; x++) for (let k = 0; k <= open; k++) face(cx + x, 20 + k, '#1A0503');
    for (let x = -4; x <= 4; x += 2) face(cx + x, 20, '#F2E8D0');
    for (let x = -3; x <= 3; x += 2) face(cx + x, 21 + open, '#D8CDB2');
    // claws
    for (const [sx, d] of [[-15, -1], [15, 1]] as const) for (let k = -1; k <= 1; k++) face(cx + sx + k * 1.6 + d, 39 + (d < 0 ? armUp + swing : armUp - swing), '#F2E8D0');
  } else {
    for (let x = -6; x <= 6; x += 3) face(cx + x, 46, '#F2E8D0');
  }
  // 1-px dark outline
  for (let y = 0; y < EH; y++)
    for (let x = 0; x < EW; x++) {
      if (fill[y * EW + x] > 0) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const X = x + dx, Y = y + dy;
        return X >= 0 && Y >= 0 && X < EW && Y < EH && fill[Y * EW + X] > 0;
      });
      if (nb) put(m, x, y, hex('#120504'));
    }
  return m;
};
const EF: Partial<Record<Pose, Img>> = {};
export const enemy = (p: Pose) => (EF[p] ??= enemyFrame(p));

// ------------------------------------------------------------------ the weapon (original): 64 x 54, seen from behind
// A stubby rifle: a long barrel with a front sight and bore, the receiver with an orange stripe, the support hand round
// the barrel and the trigger hand on the grip below. Shaded ellipses (the enemy's light), quantised, outlined.
export const WW = 64, WH = 54;
let WEAP: Img | null = null;
export const weapon = () => {
  if (WEAP) return WEAP;
  const m = img(WW, WH);
  const MET = ['#14191E', '#232B33', '#35414C', '#4D5C69', '#6E8290', '#A2B6C2'];
  const DARK = ['#0E1215', '#1A2026', '#28313A', '#3A4651'];
  const GLOVE = ['#1E120B', '#3A2414', '#59391F', '#7A512C', '#9C6B3B'];
  const fill = new Array(WW * WH).fill(0);
  const box = (x0: number, x1: number, y0: number, y1: number, pal: string[], taper = 0) => {
    for (let y = Math.max(0, y0); y < Math.min(WH, y1); y++) {
      const k = (y - y0) / Math.max(1, y1 - y0);
      const a0 = x0 - taper * k, a1 = x1 + taper * k;
      for (let x = Math.floor(a0); x < Math.ceil(a1); x++) {
        const u = (x + 0.5 - a0) / (a1 - a0);
        const v = 0.92 - Math.pow(Math.abs(u - 0.32) * 1.5, 1.4) - k * 0.15;
        put(m, x, y, ramp(pal, Math.max(0, Math.min(0.999, v))));
        fill[y * WW + x] = 1;
      }
    }
  };
  const blob = (e: Ell) => {
    for (let y = 0; y < WH; y++)
      for (let x = 0; x < WW; x++) {
        const u = shadeEll(e, x + 0.5, y + 0.5);
        if (u !== null) { put(m, x, y, ramp(e.pal, u)); fill[y * WW + x] = 1; }
      }
  };
  box(26, 38, 22, 54, DARK, 10); // receiver
  box(28, 36, 0, 30, MET, 3); // barrel
  box(30.5, 33.5, 0, 3, ['#05070A', '#0B0F13'], 0); // bore
  box(31, 33, 0, 2, ['#05070A'], 0);
  for (let y = 33; y < 36; y++) for (let x = 20; x < 44; x++) if (fill[y * WW + x]) put(m, x, y, hex(x % 4 < 2 ? '#F08A2C' : '#C9631B'));
  blob({cx: 25, cy: 19, rx: 5.2, ry: 6.5, rot: 0.3, pal: GLOVE}); // support hand, both sides of the barrel
  blob({cx: 39, cy: 19, rx: 5.2, ry: 6.5, rot: -0.3, pal: GLOVE});
  blob({cx: 32, cy: 23.5, rx: 6, ry: 2.6, pal: GLOVE});
  blob({cx: 43, cy: 47, rx: 9.5, ry: 8, rot: -0.35, pal: GLOVE}); // trigger hand
  blob({cx: 21, cy: 49, rx: 8.5, ry: 6.5, rot: 0.4, pal: GLOVE});
  for (const [x, y] of [[23, 15], [24, 18], [40, 15], [39, 18], [41, 43], [44, 44]]) put(m, x, y, hex('#B98552'));
  const out = img(WW, WH);
  out.px.set(m.px);
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      if (fill[y * WW + x]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < WW && y + dy < WH && fill[(y + dy) * WW + x + dx])) put(out, x, y, hex('#07090B'));
    }
  WEAP = out;
  return out;
};
/** the muzzle flash, 40 x 32, two frames */
const FL: Img[] = [];
export const flash = (k: 0 | 1) => {
  if (FL[k]) return FL[k];
  const m = img(40, 32);
  const C = ['#C2410C', '#F97316', '#FDBA4A', '#FFE58A', '#FFFBEA'];
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 40; x++) {
      const dx = (x + 0.5 - 20) / 20, dy = (y + 0.5 - 20) / 16;
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const spikes = 0.62 + 0.38 * Math.abs(Math.cos(a * (k ? 3.5 : 2.5) + k));
      const v = 1 - r / spikes;
      if (v > 0 && y < 30) put(m, x, y, ramp(C, Math.min(0.999, v * 1.6 + hn(x, y, 11 + k) * 0.15)));
    }
  FL[k] = m;
  return m;
};
/** an impact puff, 16 x 16: 'blood' (a dark red spray) or 'spark' (a grey-yellow wall chip), 3 frames */
const PF: Record<string, Img> = {};
export const puff = (kind: 'blood' | 'spark', f: number) => {
  const key = kind + f;
  if (PF[key]) return PF[key];
  const m = img(16, 16);
  const C = kind === 'blood' ? ['#3A0505', '#7A0F0A', '#B3261A', '#E0502E'] : ['#4A4A42', '#8D8C7C', '#D9D3A8', '#FFF6C8'];
  const rad = [3.5, 5.5, 7][f];
  for (let i = 0; i < 26; i++) {
    const a = hn(i, f, kind === 'blood' ? 1 : 2) * Math.PI * 2, r = hn(i, f, 3) * rad;
    const x = Math.round(8 + Math.cos(a) * r), y = Math.round(8 + Math.sin(a) * r + f * 1.2);
    put(m, x, y, ramp(C, 1 - r / rad * 0.8 - f * 0.15));
    if (f < 2) put(m, x + 1, y, ramp(C, 0.5));
  }
  PF[key] = m;
  return m;
};
// ------------------------------------------------------------------ 3x5 pixel font (digits, a few letters, %)
const GLYPH: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  '%': '101001010100101', A: '010101111101101', M: '101111111101101', O: '111101101101111', H: '101101111101101',
  P: '111101111100100', ' ': '000000000000000', '+': '000010111010000',
};
export const glyph = (ch: string) => GLYPH[ch] ?? GLYPH[' '];
