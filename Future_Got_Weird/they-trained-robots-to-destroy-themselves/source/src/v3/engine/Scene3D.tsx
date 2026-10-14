// Generic depth-sorted scene: set items + robots + cast characters (as perspective-scaled cutouts) in one painter pass.
import React from 'react';
import {Proj} from './camera';
import {V3, add, cross, mulS, norm, clamp01} from './math';
import {Item, sortItems, bbOf} from './prims';
import {smoothClosed} from './draw';
import {renderRobotItems, Light, DEFAULT_LIGHT} from '../robot/Robot';
import {Pose, solve} from '../robot/rig';
import {ModelKind} from '../robot/model';
import {Character, Look, Pose as CPose} from '../../components/Character';

export type RobotSpec = {
  id: string;
  pose: Pose;
  kind?: ModelKind;
  clipY?: number;
  light?: Light;
  opacity?: number;
  explode?: number;
  hide?: string[];
  highlight?: {prefix: string; color: string; amount: number}[];
  trail?: Pose[];
  ghost?: {stroke: string; fill: string; fillOpacity: number; width?: number};
  zBias?: number;
  heat?: {level: number; range: number};
  /** Height of the support surface under the robot: draws a soft contact shadow (body) and foot contacts. */
  ground?: number;
};
export type CharSpec = {id: string; look: Look; pose: CPose; feet: V3; height?: number; flip?: boolean; seed?: number; holdL?: React.ReactNode; holdR?: React.ReactNode; zBias?: number; noShadow?: boolean};

/** A soft elliptical shadow lying on the plane y = c[1] (perspective-correct; drawn as part of that surface). */
export const groundShadow = (pr: Proj, key: string, c: V3, rx: number, rz: number, opacity: number, yaw = 0): Item | null => {
  if (opacity <= 0.01 || pr.pos[1] <= c[1]) return null;
  const pts: {x: number; y: number}[] = [];
  const w3: V3[] = [];
  const ca = Math.cos(yaw), sa = Math.sin(yaw);
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    const lx = Math.cos(a) * rx, lz = Math.sin(a) * rz;
    const q: V3 = [c[0] + lx * ca + lz * sa, c[1] + 0.4, c[2] - lx * sa + lz * ca];
    if (pr.depth(q) < 10) return null;
    pts.push(pr.p(q));
    if (k % 4 === 0) w3.push(q);
  }
  const gid = key + '-g';
  return {
    z: pr.p(c).z + 0.5, key, geo: {kind: 'plane', n: [0, 1, 0], d: c[1], pts: w3}, bb: bbOf(pts), poly: pts,
    el: (
      <g key={key}>
        <defs>
          <radialGradient id={gid}>
            <stop offset="0" stopColor="#0B1620" stopOpacity={opacity} />
            <stop offset="0.6" stopColor="#0B1620" stopOpacity={opacity * 0.6} />
            <stop offset="1" stopColor="#0B1620" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={smoothClosed(pts)} fill={`url(#${gid})`} />
      </g>
    ),
  };
};

/** Contact shadow for a robot standing on (or flying above) the plane y = ground. */
export const robotShadow = (pr: Proj, id: string, pose: Pose, ground: number): Item[] => {
  const sk = solve(pose);
  const out: Item[] = [];
  const h = sk.pelvis[1] - ground - 95;
  const k = clamp01(1 - h / 260);
  const body = groundShadow(pr, 'sh-' + id, [sk.pelvis[0], ground, sk.pelvis[2]], 34 + 20 * (1 - k), 24 + 14 * (1 - k), 0.34 * k, pose.yaw);
  if (body) out.push(body);
  for (const s of ['L', 'R'] as const) {
    const a = sk.side[s].ankle;
    const d = a[1] - ground - 8;
    if (d > 10) continue;
    const f = groundShadow(pr, `shf-${id}${s}`, [a[0] + Math.sin(pose.yaw) * 6, ground, a[2] + Math.cos(pose.yaw) * 6], 9, 15, 0.4 * clamp01(1 - d / 10), pose.yaw);
    if (f) out.push({...f, z: f.z - 0.1});
  }
  return out;
};

export const robotItems = (pr: Proj, r: RobotSpec, defs: React.ReactNode[]): Item[] => {
  const out: Item[] = [];
  const draw = (pose: Pose, id: string, opacity: number, ghost?: RobotSpec['ghost']) => {
    const {items, defs: d, sk, bound} = renderRobotItems({pr, pose, id, kind: r.kind, clipY: r.clipY, light: r.light ?? DEFAULT_LIGHT, explode: r.explode, hide: r.hide, highlight: r.highlight, ghost, heat: r.heat});
    defs.push(...d);
    items.sort((a, b) => b.z - a.z);
    const solid = opacity >= 1 && !ghost && bound.pts.length > 0;
    out.push({z: pr.p(sk.pelvis).z - (r.zBias ?? 0) + (opacity < 1 && !ghost ? 0.5 : 0), key: 'rb-' + id,
      geo: solid ? {kind: 'body', pts: bound.pts} : undefined, bb: solid ? bound.bb : undefined, poly: solid ? bound.pts.map((q) => pr.p(q)) : undefined,
      el: <g key={'rb-' + id} opacity={opacity}>{items.map((x) => x.el)}</g>});
  };
  (r.trail ?? []).forEach((tp, k) => draw(tp, `${r.id}-tr${k}`, 0.24 / (k + 1)));
  draw(r.pose, r.id, r.opacity ?? 1, r.ghost);
  if (r.ground !== undefined && !r.ghost && (r.opacity ?? 1) > 0.5) out.push(...robotShadow(pr, r.id, r.pose, r.ground));
  return out;
};

export const charItem = (pr: Proj, c: CharSpec, frame: number): Item => {
  const q = pr.p(c.feet);
  const scale = ((c.height ?? 168) * q.s) / 440;
  const h = c.height ?? 168;
  // body volume for occlusion: a flat card standing at the feet, ~0.45 h wide, facing the camera
  const side = norm(cross([0, 1, 0], pr.toCam(c.feet)));
  const w = h * 0.24;
  const pts: V3[] = [];
  for (const y of [1, h * 0.5, h]) for (const s of [-1, 0, 1]) pts.push(add(c.feet, add([0, y, 0], mulS(side, s * w))));
  return {
    z: q.z - (c.zBias ?? 0), key: 'ch-' + c.id,
    geo: {kind: 'body', pts}, bb: [q.x - 200 * scale, q.y - 470 * scale, q.x + 200 * scale, q.y + 10 * scale],
    poly: [{x: q.x - 120 * scale, y: q.y + 10 * scale}, {x: q.x + 120 * scale, y: q.y + 10 * scale}, {x: q.x + 150 * scale, y: q.y - 470 * scale}, {x: q.x - 150 * scale, y: q.y - 470 * scale}],
    el: (
      // Character draws a nested <svg viewBox="-200 -500 400 520">: its ground point sits at (200, 500) inside it
      <g key={'ch-' + c.id} transform={`translate(${q.x - 200 * scale} ${q.y - 500 * scale}) scale(${scale})`}>
        <Character look={c.look} pose={c.pose} frame={frame} seed={c.seed ?? 1} flip={c.flip} holdL={c.holdL} holdR={c.holdR} shadow={false} />
      </g>
    ),
  };
};

export const Scene3D: React.FC<{
  pr: Proj;
  bg: React.ReactNode;
  items: Item[];
  robots?: RobotSpec[];
  chars?: CharSpec[];
  frame: number;
  over?: React.ReactNode;
  under?: React.ReactNode;
}> = ({pr, bg, items, robots = [], chars = [], frame, over, under}) => {
  const defs: React.ReactNode[] = [];
  const all = [...items];
  for (const r of robots) all.push(...robotItems(pr, r, defs));
  for (const c of chars) {
    all.push(charItem(pr, c, frame));
    if (!c.noShadow) {
      const sh = groundShadow(pr, 'chsh-' + c.id, c.feet, (c.height ?? 168) * 0.2, (c.height ?? 168) * 0.13, 0.32);
      if (sh) all.push(sh);
    }
  }
  sortItems(all, pr);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <defs>{defs}</defs>
      {bg}
      {under}
      {all.map((it) => it.el)}
      {over}
    </svg>
  );
};
