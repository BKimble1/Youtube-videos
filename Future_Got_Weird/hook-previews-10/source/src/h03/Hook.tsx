// HOOK 03: "This worm drives a mantis into water… then crawls out of its body."
// One continuous shot: a green mantis mid-plunge through the pond surface (frame 0), the camera follows it under,
// a soft clearing in the abdomen shows the coiled horsehair worm, the worm's pale tip pushes out between the last
// segments and the camera tracks along it as it uncoils, then pulls back to the mantis with the long thread
// curling below it.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import {basis, Basis, proj, V3} from '../shared/three';
import {ss} from '../shared/lib';
import {Item, Items, resetIds} from './core/draw3';
import {resetTubeIds} from './core/tube';
import {toW} from './core/frame';
import {abdPath, ABD, mantisItems, MState, proFrame} from './mantis';
import {coilEl, wormItems} from './worm';
import {Backdrop, bubbleItems, motes, splashItems, Waterline} from './env';
import {camera, mantisO, mantisState, wormNow} from './scene';
import {EV, W03} from './timeline';

const f2 = (n: number) => n.toFixed(2);

/** the soft clearing on the abdomen: tissue, the gut and the coiled worm, clipped to the abdomen outline */
const windowItem = (B: Basis, st: MState, t: number, e: number, z: number): Item | null => {
  const open = ss(t, EV.window, EV.window + 0.5);
  if (open < 0.01) return null;
  const F = st.body;
  const c = proj(B, toW(F, [ABD.c[0] - 1.5, -1.5, ABD.c[2] - 0.2]));
  const a0 = proj(B, toW(F, [ABD.c[0] + 10, 0, ABD.c[2]])), a1 = proj(B, toW(F, [ABD.c[0] - 10, 0, ABD.c[2]]));
  const ang = (Math.atan2(a0.y - a1.y, a0.x - a1.x) * 180) / Math.PI;
  const rx = 14.5 * c.s, ry = 3.9 * c.s;
  const gut = [-46, -38, -30, -22, -14].map((x) => proj(B, toW(F, [x, 0.5, ABD.c[2] + 0.9])));
  return {
    z,
    el: (
      <g key="win">
        <defs>
          <clipPath id="h3abd"><path d={abdPath(B, st)} /></clipPath>
          <radialGradient id="h3wm">
            <stop offset="0" stopColor="#FFF" />
            <stop offset="0.5" stopColor="#FFF" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="h3wmask">
            <ellipse cx={f2(c.x)} cy={f2(c.y)} rx={f2(rx)} ry={f2(ry)} transform={`rotate(${f2(ang)} ${f2(c.x)} ${f2(c.y)})`} fill="url(#h3wm)" />
          </mask>
          <radialGradient id="h3tis" gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={f2(rx)}>
            <stop offset="0" stopColor="#D8CD94" />
            <stop offset="0.7" stopColor="#B5B072" />
            <stop offset="1" stopColor="#8E9A5A" />
          </radialGradient>
        </defs>
        <g clipPath="url(#h3abd)">
          <g mask="url(#h3wmask)" opacity={open}>
            <rect x={f2(c.x - rx * 1.3)} y={f2(c.y - rx * 1.3)} width={f2(rx * 2.6)} height={f2(rx * 2.6)} fill="url(#h3tis)" />
            <path d={gut.map((p, i) => `${i ? 'L' : 'M'}${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke="#EADFAF" strokeWidth={f2(2.2 * c.s)} strokeLinecap="round" opacity={0.45} />
            {coilEl(B, F, t, e)}
          </g>
        </g>
      </g>
    ),
  };
};

/** where the plunging prothorax pierces the surface at frame 0 (the splash centre) */
const ENTRY: V3 = (() => {
  const Fp = proFrame(mantisState(0));
  for (let x = 0; x <= 26; x += 0.25) {
    const p = toW(Fp, [x, 0, 0]);
    if (p[2] <= 0) return [p[0], 0, 0] as V3;
  }
  return [toW(Fp, [22, 0, 0])[0], 0, 0] as V3;
})();

const Scene: React.FC<{t: number}> = ({t}) => {
  resetIds('h3');
  resetTubeIds('h3t');
  const cam = camera(t);
  const B = basis(cam);
  const st = mantisState(t);
  const w = wormNow(t, st);
  const M = mantisItems(B, st);
  const items: Item[] = [...M.items, ...wormItems(B, w.pts, st.tint)];
  const win = windowItem(B, st, t, w.e, Math.min(M.abdZ, M.wingZ) - 0.4);
  if (win) items.push(win);
  // the entry point: where the prothorax crossed the surface
  const entry = ENTRY;
  items.push(...splashItems(B, t, entry));
  const src = (ts: number, k: number): V3 => {
    const s2 = mantisState(Math.max(0, ts));
    const anchors: V3[] = [[24, 0, 0], [14, -2, -4], [6, 2, -2], [0, -3, -3], [-6, 0, -3], [-20, -3, -2], [-38, 2, 0]];
    const a = anchors[k % anchors.length];
    return toW(s2.body, a);
  };
  const vel = (ts: number): V3 => {
    const a = mantisO(Math.max(0, ts)), b = mantisO(Math.max(0, ts) + 0.02);
    return [(b[0] - a[0]) / 0.02, 0, (b[2] - a[2]) / 0.02];
  };
  items.push(...bubbleItems(B, t, src, vel));
  return (
    <>
      <Backdrop B={B} t={t} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {motes(B, t, false)}
        <Items items={items} />
      </svg>
      <Waterline B={B} t={t} entry={entry} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {motes(B, t, true)}
      </svg>
    </>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="03" W={W03} bg="#2C6767" capY={[330, 330]} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
