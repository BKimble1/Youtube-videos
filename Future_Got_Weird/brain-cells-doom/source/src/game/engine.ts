// A small deterministic raycaster (grid walls, textured floor and ceiling, billboard sprites with a depth buffer,
// banded distance light), rendering one game state into a 480 x 300 RGBA buffer. Pure: the same state draws the same
// pixels, so any frame of the film can be rendered on its own.
import {CEIL, EH, EW, FLOOR, flash, glyph, Img, enemy, Pose, puff, textures, weapon, WH, WW} from './art';

export const GW = 480, GH = 300;
const H0 = 372; // projected height (px) of a wall one unit tall at distance 1
const FOVK = 1.0; // tan(half horizontal FOV): 90 degrees

// 1 brick, 2 tech, 3 stone, 4 light panel, 0 open. 32 x 32.
// Corridor A: rows 20-22, cols 1-20, the north passage at cols 6-7 (rows 12-19).
// Room C: cols 20-28, rows 3-10; a north door at col 27, a west door at row 5.
const ROWS = [
  '33333333333333333333222222222222',
  '33333333333333333333222222202222',
  '33333333333333333333222242202222',
  '33333333333333333332000000000222',
  '33333333333333333332000000000422',
  '33333333333333333300000000000222',
  '33333333333333333332000000000222',
  '33333333333333333334000000000222',
  '33333333333333333332000000000422',
  '33333333333333333332000000000222',
  '33333300000003333332000000000222',
  '33333300000003333332022422242222',
  '33333300000003333333033333333333',
  '33333300333333333333333333333333',
  '33333300333333333333333333333333',
  '33333300333333333333333333333333',
  '33333300333333333333333333333333',
  '33333300333333333333333333333333',
  '33333300333333333333333333333333',
  '11111100111114111111411111111111',
  '10000000000000000000011111111111',
  '10000000000000000000011111111111',
  '10000000000000000000011111111111',
  '11111411111141111114111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
  '11111111111111111111111111111111',
];
export const MAP = ROWS.map((r) => r.split('').map(Number));
export const cell = (x: number, y: number) => (x < 0 || y < 0 || x >= 32 || y >= 32 ? 1 : MAP[Math.floor(y)][Math.floor(x)]);

export type Sprite = {x: number; y: number; pose: Pose; h?: number; bright?: number};
export type Puff = {x: number; y: number; z: number; kind: 'blood' | 'spark'; f: number};
export type GameState = {
  x: number; y: number; a: number; // player position and heading (radians, 0 = east, y down)
  bob: number; // view bob (px)
  walk: number; // weapon sway phase
  kick: number; // recoil 0..1
  flash: number; // muzzle flash 0..1 (frame index from its value)
  hurt: number; // red pain flash 0..1
  enemies: Sprite[];
  puffs: Puff[];
  health: number;
  ammo: number;
};

const shadeOf = (d: number, boost: number) => {
  // banded light diminishing (8 bands), lifted by the muzzle flash
  const v = Math.max(0.16, Math.min(1, 1.22 - d * 0.085));
  return Math.min(1.25, Math.floor(v * 8) / 8 + boost);
};

export const render = (s: GameState, out: Uint8ClampedArray) => {
  const TX = textures();
  const dx = Math.cos(s.a), dy = Math.sin(s.a);
  const plx = -dy * FOVK, ply = dx * FOVK;
  const hor = GH / 2 + s.bob;
  const boost = s.flash * 0.28;
  const zbuf = new Float32Array(GW);
  const o32 = new Uint32Array(out.buffer);
  const pix = (r: number, g: number, b: number) => (255 << 24) | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
  // floor and ceiling, row by row
  const FL = TX[FLOOR], CE = TX[CEIL];
  for (let y = 0; y < GH; y++) {
    const p = y - hor;
    const isFloor = p > 0;
    const pp = Math.abs(p) + 0.5;
    const rowD = (0.5 * H0) / pp;
    const rx0 = dx - plx, ry0 = dy - ply, rx1 = dx + plx, ry1 = dy + ply;
    const stepX = (rowD * (rx1 - rx0)) / GW, stepY = (rowD * (ry1 - ry0)) / GW;
    let fx = s.x + rowD * rx0, fy = s.y + rowD * ry0;
    const sh = shadeOf(rowD, boost) * (isFloor ? 1 : 0.95);
    const T = isFloor ? FL : CE;
    for (let x = 0; x < GW; x++) {
      const tx = ((Math.floor(fx * 64) % 64) + 64) % 64, ty = ((Math.floor(fy * 64) % 64) + 64) % 64;
      const i = (ty * 64 + tx) * 4;
      o32[y * GW + x] = pix(T.px[i] * sh, T.px[i + 1] * sh, T.px[i + 2] * sh);
      fx += stepX; fy += stepY;
    }
  }
  // walls
  for (let x = 0; x < GW; x++) {
    const cam = (2 * (x + 0.5)) / GW - 1;
    const rdx = dx + plx * cam, rdy = dy + ply * cam;
    let mx = Math.floor(s.x), my = Math.floor(s.y);
    const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
    const sx = rdx < 0 ? -1 : 1, sy = rdy < 0 ? -1 : 1;
    let sdx = rdx < 0 ? (s.x - mx) * ddx : (mx + 1 - s.x) * ddx;
    let sdy = rdy < 0 ? (s.y - my) * ddy : (my + 1 - s.y) * ddy;
    let side = 0, hit = 0;
    for (let k = 0; k < 64 && !hit; k++) {
      if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
      hit = cell(mx, my);
    }
    const perp = side === 0 ? sdx - ddx : sdy - ddy;
    zbuf[x] = perp;
    const lh = H0 / perp;
    const y0 = Math.floor(hor - lh / 2), y1 = Math.ceil(hor + lh / 2);
    let wx = side === 0 ? s.y + perp * rdy : s.x + perp * rdx;
    wx -= Math.floor(wx);
    let tx = Math.floor(wx * 64);
    if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = 63 - tx;
    const T = TX[hit] ?? TX[1];
    const sh = shadeOf(perp, boost) * (side ? 0.82 : 1);
    const glow = hit === 4;
    for (let y = Math.max(0, y0); y < Math.min(GH, y1); y++) {
      const ty = Math.min(63, Math.floor(((y - (hor - lh / 2)) / lh) * 64));
      const i = (ty * 64 + tx) * 4;
      const r = T.px[i], g = T.px[i + 1], b = T.px[i + 2];
      const lit = glow && b > 200 ? Math.max(sh, 1) : sh;
      o32[y * GW + x] = pix(r * lit, g * lit, b * lit);
    }
  }
  // sprites, far to near
  type Draw = {img: Img; x: number; y: number; z: number; hgt: number; bright: number};
  const draws: Draw[] = [];
  for (const e of s.enemies) draws.push({img: enemy(e.pose), x: e.x, y: e.y, z: 0, hgt: e.h ?? 0.86, bright: e.bright ?? 0});
  for (const p of s.puffs) draws.push({img: puff(p.kind, p.f), x: p.x, y: p.y, z: p.z, hgt: 0.32, bright: 0.2});
  const inv = 1 / (plx * dy - dx * ply);
  const proj = draws
    .map((d) => {
      const rx = d.x - s.x, ry = d.y - s.y;
      const tX = inv * (dy * rx - dx * ry);
      const tY = inv * (-ply * rx + plx * ry);
      return {d, tX, tY};
    })
    .filter((q) => q.tY > 0.15)
    .sort((a, b) => b.tY - a.tY);
  for (const {d, tX, tY} of proj) {
    const sxc = (GW / 2) * (1 + tX / tY);
    const hpx = (d.hgt * H0) / tY;
    const wpx = (hpx * d.img.w) / d.img.h;
    const floorY = hor + H0 / (2 * tY);
    const top = floorY - hpx - (d.z * H0) / tY;
    const sh = shadeOf(tY, boost) + d.bright;
    const x0 = Math.floor(sxc - wpx / 2), x1 = Math.ceil(sxc + wpx / 2);
    for (let x = Math.max(0, x0); x < Math.min(GW, x1); x++) {
      if (zbuf[x] < tY) continue;
      const u = Math.floor(((x - (sxc - wpx / 2)) / wpx) * d.img.w);
      if (u < 0 || u >= d.img.w) continue;
      for (let y = Math.max(0, Math.floor(top)); y < Math.min(GH, Math.ceil(top + hpx)); y++) {
        const v = Math.floor(((y - top) / hpx) * d.img.h);
        if (v < 0 || v >= d.img.h) continue;
        const i = (v * d.img.w + u) * 4;
        if (d.img.px[i + 3] < 128) continue;
        o32[y * GW + x] = pix(d.img.px[i] * sh, d.img.px[i + 1] * sh, d.img.px[i + 2] * sh);
      }
    }
  }
  // the weapon (2 px per art pixel), recoil and sway; the muzzle flash above the barrel
  const W = weapon();
  const sc = 2;
  const wx0 = Math.round(GW / 2 - (WW * sc) / 2 + Math.sin(s.walk) * 6);
  const wy0 = Math.round(GH - WH * sc + 12 + s.kick * 18 + Math.abs(Math.cos(s.walk)) * 4);
  if (s.flash > 0.05) {
    const F = flash(s.flash > 0.55 ? 0 : 1);
    const fs = 2;
    const fx0 = Math.round(GW / 2 - 20 * fs + Math.sin(s.walk) * 6), fy0 = wy0 - 27 * fs + 4;
    blit(o32, F, fx0, fy0, fs, 1);
  }
  blit(o32, W, wx0, wy0, sc, 1 + s.flash * 0.35);
  // HUD: health (left) and ammo (right) in a 3x5 pixel font
  text(o32, `+${Math.round(s.health)}`, 10, GH - 22, 3, s.health < 75 ? [255, 120, 90] : [235, 225, 200]);
  text(o32, `${s.ammo}`, GW - 10 - 4 * 3 * String(s.ammo).length, GH - 22, 3, [235, 225, 200]);
  // full-screen tints: muzzle light, pain
  if (s.hurt > 0.01 || s.flash > 0.01) {
    for (let i = 0; i < GW * GH; i++) {
      const c = o32[i];
      let r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
      if (s.hurt > 0) { r = r + (200 - r) * s.hurt * 0.32; g *= 1 - s.hurt * 0.3; b *= 1 - s.hurt * 0.3; }
      if (s.flash > 0) { r += 22 * s.flash; g += 14 * s.flash; }
      o32[i] = pix(r | 0, g | 0, b | 0);
    }
  }
};

const blit = (o32: Uint32Array, m: Img, x0: number, y0: number, sc: number, gain: number) => {
  for (let v = 0; v < m.h; v++)
    for (let u = 0; u < m.w; u++) {
      const i = (v * m.w + u) * 4;
      if (m.px[i + 3] < 128) continue;
      const r = Math.min(255, m.px[i] * gain), g = Math.min(255, m.px[i + 1] * gain), b = Math.min(255, m.px[i + 2] * gain);
      const c = (255 << 24) | (b << 16) | (g << 8) | r;
      for (let yy = 0; yy < sc; yy++)
        for (let xx = 0; xx < sc; xx++) {
          const X = x0 + u * sc + xx, Y = y0 + v * sc + yy;
          if (X >= 0 && Y >= 0 && X < GW && Y < GH) o32[Y * GW + X] = c;
        }
    }
};
const text = (o32: Uint32Array, str: string, x0: number, y0: number, sc: number, rgb: number[]) => {
  const c = (255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
  const sh = (255 << 24) | (10 << 16) | (8 << 8) | 8;
  [...str].forEach((ch, k) => {
    const g = glyph(ch);
    for (let i = 0; i < 15; i++) {
      if (g[i] !== '1') continue;
      const gx = i % 3, gy = Math.floor(i / 3);
      for (let yy = 0; yy < sc; yy++)
        for (let xx = 0; xx < sc; xx++) {
          const X = x0 + k * 4 * sc + gx * sc + xx, Y = y0 + gy * sc + yy;
          if (X + 1 < GW && Y + 1 < GH) o32[(Y + 1) * GW + X + 1] = sh;
          if (X < GW && Y < GH) o32[Y * GW + X] = c;
        }
    }
  });
};
export {EW, EH};
