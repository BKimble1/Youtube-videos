// Generic depth-sorted scene: set items + robots + cast characters (as perspective-scaled cutouts) in one painter pass.
import React from 'react';
import {Proj} from './camera';
import {V3} from './math';
import {Item, sortItems} from './prims';
import {renderRobotItems, Light, DEFAULT_LIGHT} from '../robot/Robot';
import {Pose} from '../robot/rig';
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
};
export type CharSpec = {id: string; look: Look; pose: CPose; feet: V3; height?: number; flip?: boolean; seed?: number; holdL?: React.ReactNode; holdR?: React.ReactNode; zBias?: number};

export const robotItems = (pr: Proj, r: RobotSpec, defs: React.ReactNode[]): Item[] => {
  const out: Item[] = [];
  const draw = (pose: Pose, id: string, opacity: number, ghost?: RobotSpec['ghost']) => {
    const {items, defs: d, sk} = renderRobotItems({pr, pose, id, kind: r.kind, clipY: r.clipY, light: r.light ?? DEFAULT_LIGHT, explode: r.explode, hide: r.hide, highlight: r.highlight, ghost, heat: r.heat});
    defs.push(...d);
    items.sort((a, b) => b.z - a.z);
    out.push({z: pr.p(sk.pelvis).z - (r.zBias ?? 0) + (opacity < 1 && !ghost ? 0.5 : 0), key: 'rb-' + id, el: <g key={'rb-' + id} opacity={opacity}>{items.map((x) => x.el)}</g>});
  };
  (r.trail ?? []).forEach((tp, k) => draw(tp, `${r.id}-tr${k}`, 0.24 / (k + 1)));
  draw(r.pose, r.id, r.opacity ?? 1, r.ghost);
  return out;
};

export const charItem = (pr: Proj, c: CharSpec, frame: number): Item => {
  const q = pr.p(c.feet);
  const scale = ((c.height ?? 168) * q.s) / 440;
  return {
    z: q.z - (c.zBias ?? 0), key: 'ch-' + c.id,
    el: (
      // Character draws a nested <svg viewBox="-200 -500 400 520">: its ground point sits at (200, 500) inside it
      <g key={'ch-' + c.id} transform={`translate(${q.x - 200 * scale} ${q.y - 500 * scale}) scale(${scale})`}>
        <Character look={c.look} pose={c.pose} frame={frame} seed={c.seed ?? 1} flip={c.flip} holdL={c.holdL} holdR={c.holdR} />
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
  for (const c of chars) all.push(charItem(pr, c, frame));
  sortItems(all);
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
