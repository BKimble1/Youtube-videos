// One frame of the film: the camera for time t, the far forest, the floor, every plant with what hangs from it, the
// ants on the floor, the spores, then light and captions on top (captions in screen space, never in the camera).
import React from 'react';
import {basis, Basis, Orbit, proj, V3} from './core/three';
import {Item, resetIds} from './core/draw3';
import {resetTubeIds} from './core/tube';
import {Rig, solve} from './ant/rig';
import {antItems, bodyClipPaths, groupItem} from './ant/draw';
import {Leaf, leafItems, resetLeafIds, stemItems} from './world/plant';
import {Dome, FarLayer, floorItems} from './world/env';
import {resetFungusIds, sporeEl, SporeDefs, tetherItems, trailEl} from './fungus/fungus';
import {emergeItems, resetStalkIds, stalkItemsV2} from './fungus/stalk2';
import {brainItems, germTube, interiorItems} from './fungus/hyphae';
import {organicNetworkEl, tissueItems} from './fungus/hyphae2';
import {cam} from './world/camera';
import {blurAt, lightAt, shotCam} from './world/shots';
import {A1, ant1State, burst1, fungus1, heroSpore1, HOOK, LAND2, leaf1, P1_STEM, P2_STEM, SP1, TM} from './world/story';
import {A2, ant2State, ant3State, ant5State, burst2, fungus2, heroSpore2, INF, leaf2, netTime, cellTime, pulseAt, SP2, TC2, xrayAt} from './world/story2';
import {GRAVES} from './world/grave';
import {ant4State, leaf4, P4_STEM} from './world/loop';
import {biteMark} from './world/marks';
import {FOREST} from './world/forest';
import {Captions} from './Captions';
import {toW} from './core/frame';
import {clamp, DUR} from './lib';

const sortDraw = (items: Item[]) => items.sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);

/** a plant: stem, leaves (blade behind or in front of what hangs beneath it) and whatever is attached */
const plantGroup = (B: Basis, key: string, leaves: Leaf[], stem: V3[] | null, stemR: [number, number], attached: Item[], fog = 0): Item | null => {
  const items: Item[] = [];
  let anchor = Infinity;
  leaves.forEach((lf) => {
    const {blade, under, rib} = leafItems(B, lf, {fog});
    if (blade.z < 1) return;
    anchor = Math.min(anchor, blade.z);
    items.push({...blade, z: under ? 1e7 : -1e7});
    rib.forEach((r) => r.z > 1 && items.push(r));
  });
  if (stem) stemItems(B, stem, stemR[0], stemR[1], undefined, `${key}s`, fog).forEach((it) => it.z > 1 && items.push(it));
  attached.forEach((it) => it.z > 1 && items.push(it));
  if (!items.length) return null;
  if (!isFinite(anchor)) anchor = Math.min(...items.map((i) => i.z));
  return {z: anchor, el: <g key={key}>{sortDraw(items)}</g>};
};
/** a dead ant with its fungus */
const deadAnt = (B: Basis, R: Rig, sp: typeof SP1, f: {g: number; asc: number; open: number; teth: number; e?: number}) => [
  ...antItems(B, R),
  ...emergeItems(B, R, f.e ?? 1, sp),
  ...stalkItemsV2(B, R, sp, f.g, f.asc, f.open),
  ...tetherItems(B, R, f.teth),
];
/** is a world point roughly in front of the camera and near the frame? */
const near = (B: Basis, p: V3, margin = 600) => {
  const P = proj(B, p);
  return P.z > 2 && P.x > -margin && P.x < 1080 + margin && P.y > -margin && P.y < 1920 + margin;
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean; orbit?: Orbit}> = ({t, fkey, captions = true, orbit}) => {
  resetIds(fkey);
  resetLeafIds(fkey);
  resetFungusIds(fkey);
  resetStalkIds(fkey);
  resetTubeIds(fkey);
  const O = orbit ?? shotCam(t);
  const B = basis(cam(O));
  const light = lightAt(t);
  const scale = O.f / O.d;
  const groups: Item[] = [];
  // ---- the surrounding understory: a soft layer behind the set, faded out in macro (and so in the loop frames)
  const focusZ = proj(B, O.target).z;
  const bgGroups: Item[] = [];
  // (thinned during the graveyard, where the dead ants' own plants are the vegetation)
  const bgA = clamp((115 - scale) / 50) * (1 - 0.6 * clamp((t - 26.6) / 1.2));
  if (bgA > 0.01)
    FOREST.forEach((p) => {
      const zMin = Math.min(...p.stem.map((q) => proj(B, q).z), ...p.leaves.map((l) => proj(B, l.base).z));
      if (zMin < Math.max(60, focusZ * 1.6)) return;
      const g = plantGroup(B, p.id, p.leaves, p.stem, p.r, [], p.fog);
      if (g) bgGroups.push(g);
    });
  // ---- ant #1 on leaf L1
  const R1 = solve(ant1State(t));
  const f1 = fungus1(t);
  const g1 = plantGroup(B, 'P1', [leaf1(t)], P1_STEM, [1.3, 0.9], [...deadAnt(B, R1, SP1, f1), ...biteMark(B, A1(t), t - HOOK.contact)]);
  if (g1) groups.push(g1);
  // ---- ant #2: on the floor (with the x-ray of the infection), then on plant P2
  const st2 = ant2State(t);
  const R2 = solve(st2);
  const onPlant = t > 8.9;
  const f2 = fungus2(t);
  const a2: Item[] = onPlant ? [...deadAnt(B, R2, SP2, f2), ...biteMark(B, A2(t), t - TC2)] : antItems(B, R2);
  const hs = heroSpore1(t);
  if (hs && hs.on && t < INF.germ1 + 0.4) {
    const k = Math.max(0, 1 - (t - HOOK.land) / 0.5);
    a2.push({z: proj(B, hs.p).z - 0.6, el: <g key="hsl">{sporeEl(B, hs.p, hs.d, 0.45, 1, 'hs', 0.3 + 0.8 * k, 7).el}</g>});
  }
  const g2 = plantGroup(B, 'P2', [leaf2(t)], P2_STEM, [2.0, 1.4], onPlant ? a2 : []);
  if (g2) groups.push(g2);
  const xr = xrayAt(t);
  if (!onPlant) {
    const c2 = proj(B, R2.body.o);
    if (c2.z > 1) {
      if (t > INF.xr0 && t < INF.xrOut1 + 0.05 && xr.r > 0.5) {
        // the x-ray: inside a soft circle round the entry point the shell turns translucent and the interior shows
        const E = proj(B, toW(st2.body, LAND2));
        const pulse = pulseAt(t);
        const g = netTime(t);
        const shell = antItems(B, R2, {xray: true});
        const inner = interiorItems(B, R2, pulse, clamp(g / 3));
        const tissue = tissueItems(B, R2, cellTime(t), pulse);
        const clipD = bodyClipPaths(B, R2);
        const germ = clamp((t - INF.germ0) / (INF.germ1 - INF.germ0));
        groups.push({
          z: c2.z,
          el: (
            <g key="a2x">
              <defs>
                <radialGradient id={`${fkey}xrIn`} gradientUnits="userSpaceOnUse" cx={E.x} cy={E.y} r={xr.r}>
                  <stop offset="0" stopColor="#FFF" stopOpacity={xr.a} />
                  <stop offset="0.78" stopColor="#FFF" stopOpacity={xr.a} />
                  <stop offset="1" stopColor="#FFF" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${fkey}xrOut`} gradientUnits="userSpaceOnUse" cx={E.x} cy={E.y} r={xr.r}>
                  <stop offset="0" stopColor="#000" stopOpacity={xr.a} />
                  <stop offset="0.78" stopColor="#000" stopOpacity={xr.a} />
                  <stop offset="1" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <mask id={`${fkey}mIn`} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="6000">
                  <rect x="-2000" y="-2000" width="5000" height="6000" fill="#000" />
                  <circle cx={E.x} cy={E.y} r={xr.r} fill={`url(#${fkey}xrIn)`} />
                </mask>
                <clipPath id={`${fkey}bodyClip`}>
                  {clipD.map((d, k) => <path key={k} d={d} />)}
                </clipPath>
                <mask id={`${fkey}mOut`} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="6000">
                  <rect x="-2000" y="-2000" width="5000" height="6000" fill="#FFF" />
                  <circle cx={E.x} cy={E.y} r={xr.r} fill={`url(#${fkey}xrOut)`} />
                </mask>
              </defs>
              <g mask={`url(#${fkey}mOut)`}>{sortDraw(a2.filter((i) => i.z > 1))}</g>
              <g mask={`url(#${fkey}mIn)`}>
                {sortDraw(shell.filter((i) => i.z > 1))}
                <g clipPath={`url(#${fkey}bodyClip)`}>{sortDraw(tissue.filter((i) => i.z > 1))}</g>
                <g opacity={clamp((200 - scale) / 70)}>{sortDraw(inner.filter((i) => i.z > 1))}</g>
                {organicNetworkEl(B, R2, g)}
                {sortDraw(brainItems(B, R2).filter((i) => i.z > 1))}
                {germTube(B, R2, germ, LAND2)}
                {hs && hs.on && sporeEl(B, hs.p, hs.d, 0.45, 1, 'hsx', 0.2, 7).el}
              </g>
            </g>
          ),
        });
      } else groups.push({z: c2.z, el: <g key="a2">{sortDraw(a2.filter((i) => i.z > 1))}</g>});
    }
  }
  // ---- the ants on the floor below ant #2
  if (t > 21.5) {
    const s3 = ant3State(t);
    const a3 = antItems(B, solve(s3));
    const h2 = heroSpore2(t);
    if (h2 && h2.on) a3.push({...sporeEl(B, h2.p, h2.d, 0.45, 1, 'h2l', 0.3 + 0.8 * Math.max(0, 1 - (t - 24.9) / 0.5), 7), z: proj(B, h2.p).z - 0.6});
    if (near(B, s3.body.o)) groups.push(groupItem(a3, proj(B, s3.body.o).z, 'a3'));
    const s5 = ant5State(t);
    if (near(B, s5.body.o)) groups.push(groupItem(antItems(B, solve(s5)), proj(B, s5.body.o).z, 'a5'));
  }
  // ---- the graveyard and the vegetation the camera pulls back through
  if (t > 24.5) {
    GRAVES.forEach((gv) => {
      if (!near(B, gv.leaf.base, 900)) return;
      const R = solve(gv.st);
      const g = plantGroup(B, gv.id, [gv.leaf, ...gv.extra], gv.stem, [0.9, 0.65], deadAnt(B, R, gv.sp, gv));
      if (g) groups.push(g);
    });
  }
  // ---- ant #4 on its leaf (the loop)
  if (t > 27.0) {
    const R4 = solve(ant4State(t));
    const g4 = plantGroup(B, 'P4', [leaf4(t)], P4_STEM, [1.3, 0.9], antItems(B, R4));
    if (g4) groups.push(g4);
  }
  // ---- spores in the air
  if (hs && !hs.on) {
    const e = sporeEl(B, hs.p, hs.d, 0.4, 1, 'hs', 0.6, 9);
    const tr: V3[] = [];
    for (let k = 0; k <= 6; k++) {
      const q = heroSpore1(t - k * 0.035);
      if (q) tr.push(q.p);
    }
    if (e.z > 1) groups.push({z: e.z, el: <g key="hsg">{trailEl(B, tr, 'hst', 3)}{e.el}</g>});
  }
  const h2 = heroSpore2(t);
  if (h2 && !h2.on) {
    const e = sporeEl(B, h2.p, h2.d, 0.4, 1, 'h2', 0.6, 9);
    const tr: V3[] = [];
    for (let k = 0; k <= 6; k++) {
      const q = heroSpore2(t - k * 0.035);
      if (q && !q.on) tr.push(q.p);
    }
    if (e.z > 1) groups.push({z: e.z, el: <g key="h2g">{trailEl(B, tr, 'h2t', 3)}{e.el}</g>});
  }
  [...burst1(t), ...burst2(t)].forEach((s, k) => {
    const e = sporeEl(B, s.p, s.d, 0.32, s.a * 0.8, `b${k}`, 0.35, 4);
    if (e.z > 1) groups.push(e);
  });
  const blur = blurAt(t, O);
  // depth of field: groups well beyond the subject go to a softened layer; in extreme macro (the first and last
  // frames) they fade out, leaving the subject's own leaf against the far forest, so the loop's two ends match
  const farZ = focusZ + Math.max(14, 0.85 * focusZ);
  const farGroups = groups.filter((g) => g.z > farZ);
  const focusGroups = groups.filter((g) => g.z <= farZ);
  const farA = clamp((118 - scale) / 22);
  const farBlur = clamp(scale * 0.05, 1.2, 6.5);
  const cool = clamp((t - TM.beneath) / 1.2) * (1 - clamp((t - 29.7) / 0.6));
  return (
    <>
      <Dome B={B} light={light} ns={fkey} />
      <div style={{position: 'absolute', inset: 0, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
        <FarLayer B={B} light={light} blur={blur} ns={fkey} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {floorItems(B, light, fkey)}
      </svg>
      {bgGroups.length > 0 && (
        <div style={{position: 'absolute', inset: 0, opacity: bgA, filter: `blur(${Math.max(0.6, blur * 0.45).toFixed(1)}px)`}}>
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>{sortDraw(bgGroups)}</svg>
        </div>
      )}
      {farGroups.length > 0 && farA > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: farA, filter: `blur(${farBlur.toFixed(1)}px)`}}>
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
            <SporeDefs />
            {sortDraw(farGroups)}
          </svg>
        </div>
      )}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <SporeDefs />
        {sortDraw(focusGroups)}
      </svg>
      <div style={{position: 'absolute', inset: 0, background: `rgba(10,22,30,${((1 - light) * 0.55).toFixed(3)})`}} />
      {cool > 0.01 && <div style={{position: 'absolute', inset: 0, background: `rgba(30,60,70,${(0.16 * cool).toFixed(3)})`, mixBlendMode: 'multiply'}} />}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(5,14,10,0.42) 100%)'}} />
      {captions && <Captions t={t} />}
    </>
  );
};
void DUR;
