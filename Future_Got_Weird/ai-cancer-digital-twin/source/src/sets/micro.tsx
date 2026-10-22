// The molecular set shared by the opening and its return: a crowded interstitial space above a cell membrane with
// death receptors, and the DNA switch drifting in it. The membrane is a gentle arc (a large cell seen up close).
import React from 'react';
import {C, M} from '../theme';
import {Cam, camTransform, W, H} from '../kit/cam';
import {blurId} from '../kit/fx';
import {blob, clamp01, drift, lerp, mixHex, noise, rand, smooth} from '../kit/core';
import {DeathReceptor, DnaSwitch, Membrane} from '../art/molecules';

export const CELL_R = 2600; // membrane curvature radius (world units)
export const memY = (x: number, bulgeX = 0, bulge = 0) => (x * x) / (2 * CELL_R) - bulge * 22 * Math.exp(-((x - bulgeX) ** 2) / (2 * 110 * 110));
export const memSlope = (x: number, bulgeX = 0, bulge = 0) => (memY(x + 1, bulgeX, bulge) - memY(x - 1, bulgeX, bulge)) / 2;

// receptor rest positions along the membrane
export const RECEPTORS = (() => {
  const out: number[] = [];
  let x = -1500;
  let i = 0;
  while (x < 1500) {
    out.push(x);
    x += 120 + rand(i * 13 + 5) * 110;
    i++;
  }
  return out;
})();
/** the four slots under the open device's ligands (front row of the hexagon in side view) */
export const SLOTS = [-70, -35, 35, 70];

export type MicroState = {
  t: number; cam: Cam;
  devX: number; devY: number; devRot?: number; open?: number; unlock?: number; xray?: number; protons?: number; devGlow?: number;
  gather?: number; devOp?: number; act?: number; adaptors?: number; bulge?: number; acid?: number; showDevice?: boolean; crowd?: number; interior?: number;
  under?: React.ReactNode; // drawn inside the cell (below the membrane), in world units
  over?: React.ReactNode;  // drawn above everything in world units
};

/** Which receptor indices gather into the slots under the device at devX. */
const gatherMap = (devX: number) => {
  const near = RECEPTORS.map((x, i) => ({i, d: Math.abs(x - devX)})).sort((a, b) => a.d - b.d).slice(0, SLOTS.length);
  const byX = near.sort((a, b) => RECEPTORS[a.i] - RECEPTORS[b.i]);
  const m = new Map<number, number>();
  byX.forEach((n, k) => m.set(n.i, k));
  return m;
};

export const MicroWorld: React.FC<MicroState> = (s) => {
  const {t, cam} = s;
  const acid = s.acid ?? 0;
  const bg = mixHex(M.void, M.acid, acid * 0.55);
  const crowd = s.crowd ?? 1;
  const gm = gatherMap(s.devX);
  const g = smooth(s.gather ?? 0);
  // crowd blobs at three depths; the near layer slides past the lens
  // crowd: globular proteins (3-4 fused lobes) at three depths, in muted colours, plus matrix fibres far back
  const PCOL = ['#5A3550', '#3E4A6A', '#4F3A6E', '#6A4A3A', '#38575A'];
  const layer = (depth: number, n: number, seed: number, rmin: number, rmax: number, tint: number, blurPx: number, op: number) => (
    <g filter={blurId(blurPx)} opacity={op * crowd}>
      <g transform={camTransform(cam, depth)}>
        {Array.from({length: n}, (_, i) => {
          const span = 2800 / depth;
          const x = cam.x + (rand(seed * 97 + i) - 0.5) * span + noise(t * 0.15 + i, seed) * 40;
          const y = cam.y + (rand(seed * 89 + i) - 0.5) * (1700 / depth) + noise(t * 0.12 + i * 1.3, seed + 5) * 40;
          const r = rmin + rand(seed * 83 + i) * (rmax - rmin);
          const col = mixHex(mixHex(PCOL[i % PCOL.length], M.void, 1 - tint), M.acid, acid * 0.4);
          const rot = noise(t * 0.1 + i, seed + 2) * 40 + i * 47;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
              <path d={blob(0, 0, r, seed + i, t, 0.14, 9)} fill={col} />
              <path d={blob(r * 0.8, r * 0.3, r * 0.62, seed + i + 50, t, 0.16, 8)} fill={col} />
              <path d={blob(-r * 0.5, r * 0.75, r * 0.5, seed + i + 90, t, 0.16, 8)} fill={col} />
              {i % 3 === 0 && <path d={blob(r * 0.2, -r * 0.85, r * 0.45, seed + i + 70, t, 0.16, 8)} fill={col} />}
              <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.22} fill="#FFFFFF" opacity={0.08} />
            </g>
          );
        })}
      </g>
    </g>
  );
  const fibres = (
    <g filter={blurId(5)} opacity={0.35 * crowd}>
      <g transform={camTransform(cam, 0.3)}>
        {Array.from({length: 7}, (_, i) => {
          const y0 = cam.y + (rand(i * 17) - 0.5) * 2600;
          return <path key={i} d={`M ${cam.x - 3400} ${y0} C ${cam.x - 1200} ${y0 - 400 + noise(t * 0.05, i) * 80} ${cam.x + 1000} ${y0 + 500} ${cam.x + 3400} ${y0 - 200}`} fill="none" stroke={mixHex('#4A3048', M.acid, acid * 0.5)} strokeWidth={26 + rand(i) * 30} strokeLinecap="round" />;
        })}
      </g>
    </g>
  );
  return (
    <>
      <rect width={W} height={H} fill={bg} />
      {fibres}
      {layer(0.4, 34, 3, 26, 70, 0.55, 8, 0.9)}
      {layer(0.7, 26, 7, 14, 40, 0.85, 3, 0.8)}
      {/* acidity: a faint drift of protons through the space */}
      {acid > 0.01 && (
        <g transform={camTransform(cam, 0.9)} opacity={acid}>
          {Array.from({length: 40}, (_, i) => {
            const x = cam.x + (rand(i * 31) - 0.5) * 2200 + noise(t * 0.4 + i, 9) * 60;
            const y = -320 + (rand(i * 37) - 0.5) * 900 + noise(t * 0.35 + i, 11) * 60;
            return <circle key={i} cx={x} cy={y} r={3 + rand(i) * 2} fill="#FFE29A" opacity={0.55} />;
          })}
        </g>
      )}
      <g transform={camTransform(cam)}>
        {/* cell interior below the membrane */}
        <path d={`M -2000 ${memY(-2000)} ${Array.from({length: 41}, (_, i) => { const x = -2000 + i * 100; return `L ${x} ${memY(x, s.devX, s.bulge ?? 0)}`; }).join(' ')} L 2000 2600 L -2000 2600 Z`} fill={mixHex(M.cytoDeep, '#5A2A3A', 0.35)} opacity={s.interior ?? 1} />
        {s.under}
        <Membrane f={(x) => memY(x, s.devX, s.bulge ?? 0)} x0={Math.max(-2000, cam.x - 1100 / cam.z)} x1={Math.min(2000, cam.x + 1100 / cam.z)} t={t} step={10} th={28} hr={4.6} />
        {RECEPTORS.map((x0, i) => {
          if (Math.abs(x0 - cam.x) > 1300 / cam.z + 100) return null;
          const k = gm.get(i);
          const target = k !== undefined ? s.devX + SLOTS[k] : x0;
          const x = lerp(x0 + drift(t, i, 4) * 10, target, k !== undefined ? g : 0);
          const y = memY(x, s.devX, s.bulge ?? 0);
          const rot = (Math.atan(memSlope(x, s.devX, s.bulge ?? 0)) * 180) / Math.PI;
          const act = k !== undefined ? s.act ?? 0 : 0;
          return (
            <g key={i} transform={`translate(${x} ${y - 14}) rotate(${rot})`}>
              <DeathReceptor t={t} seed={i} act={act} adaptors={k !== undefined ? s.adaptors ?? 0 : 0} />
            </g>
          );
        })}
        {s.showDevice !== false && (
          <g transform={`translate(${s.devX} ${s.devY}) rotate(${s.devRot ?? 0})`} opacity={s.devOp ?? 1}>
            <DnaSwitch t={t} open={s.open} unlock={s.unlock} xray={s.xray} protons={s.protons} glow={s.devGlow} />
          </g>
        )}
        {s.over}
      </g>
      {/* near foreground crowd (defocused) */}
      {layer(1.9, 6, 13, 50, 120, 0.25, 18, 0.9)}
    </>
  );
};

export const devicePts = (devX: number, devY: number) => [[devX - 170, devY - 70], [devX + 170, devY - 70], [devX - 170, devY + 60], [devX + 170, devY + 60]] as [number, number][];
export const INK = C.ink;
export const c01 = clamp01;
