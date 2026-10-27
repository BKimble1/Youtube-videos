// E4 (700-715, "carrying"): macro in profile on the medic's legs crossing uneven rubble in the shaft's warm light:
// broken ridges of concrete grit, gravel, a rusted rebar stub. The camera tracks with the body; the ground slides
// under it. Every foot is planted on the height of the rubble under it (kit.onGround): a tripod lifts, swings over the
// grit and lands on a stone top while the other tripod holds, and the body rides at the mean height of its feet.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../../rig/roach';
import {Roach2D} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt, View, P} from '../../../roach/ortho';
import {rnd, clamp} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../../lib/color';
import {RB, Pt, Rebar, Glow2, Motes, VGrad, poly, f2} from '../art';
import {ShotProps} from '../../index2';
import {idf, FPS, onGround, Blur} from './kit';

export const E4_N = 16;
const S = 19; // px per mm
const V_MM = 40;
const SX = 330, SY = 1440; // the body's ground point on screen
const s0 = 31;

/** angular rubble chunks across the insect's path (world mm): each a broken top (x, height) between x0 and x1, set
 *  in the bed from z0 (far) to z1 (near) */
type Chunk = {top: [number, number][]; z0: number; z1: number; tone: string};
const TONES = [RB.concLit, RB.conc, RB.concDark, '#9A6A52', RB.concPale];
const CHUNKS: Chunk[] = Array.from({length: 14}, (_, i) => {
  const x0 = -60 + i * 12.5 + (rnd(i, 41) - 0.5) * 5;
  const w = 7 + rnd(i + 3, 41) * 6;
  const hgt = 1.6 + rnd(i + 7, 41) * 3.6;
  const k = 3 + Math.floor(rnd(i + 5, 41) * 2);
  const top: [number, number][] = [[x0, 0]];
  for (let j = 1; j <= k; j++) top.push([x0 + (w * j) / (k + 1) + (rnd(i * 5 + j, 43) - 0.5) * 1.2, hgt * (0.65 + 0.35 * rnd(i * 7 + j, 44))]);
  top.push([x0 + w, 0]);
  return {top, z0: -48 + rnd(i + 9, 41) * 10, z1: 36 + rnd(i + 11, 41) * 12, tone: TONES[i % TONES.length]};
});
const prof = (c: Chunk, x: number) => {
  const t = c.top;
  if (x <= t[0][0] || x >= t[t.length - 1][0]) return 0;
  for (let i = 1; i < t.length; i++)
    if (x <= t[i][0]) {
      const u = (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
      return t[i - 1][1] + (t[i][1] - t[i - 1][1]) * u;
    }
  return 0;
};
export const e4H = (x: number) => CHUNKS.reduce((m, c) => Math.max(m, prof(c, x)), 0);

const rawPose = (lf: number) => {
  const t = lf / FPS;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: s0 + V_MM * t, t: t + 23.4, search: 0.5, antL: {yaw: 0.5, pitch: 0.12}, antR: {yaw: 0.46, pitch: 0.16}, seed: 5});
};
/** the posed insect on the rubble: feet on the stone tops, the body raised to the mean of its feet */
export const e4Pose = (lf: number): RoachPose => {
  const p0 = rawPose(lf);
  const lift = p0.legs.reduce((a, l) => a + e4H(l.foot[0]), 0) / 6;
  const t = lf / FPS;
  const p1 = poseRoach({path: straightPath([0, 0, 0], 0), s: s0 + V_MM * t, t: t + 23.4, search: 0.5, antL: {yaw: 0.5, pitch: 0.12}, antR: {yaw: 0.46, pitch: 0.16}, seed: 5, offset: [0, lift, 0]});
  return onGround(p1, e4H);
};
export const e4View = (lf: number): View => viewAt(0, 4, S, [s0 + V_MM * (lf / FPS), 0, 0], SX, SY);

const Stone: React.FC<{v: View; c: Chunk}> = ({v, c}) => {
  const front: Pt[] = c.top.map(([x, y]) => P(v, [x, y, c.z1]) as Pt);
  const back: Pt[] = c.top.map(([x, y]) => P(v, [x, y, c.z0]) as Pt);
  const base: Pt[] = [P(v, [c.top[c.top.length - 1][0], -2, c.z1]) as Pt, P(v, [c.top[0][0], -2, c.z1]) as Pt];
  return (
    <g>
      <path d={poly([...back, ...front.slice().reverse()])} fill={litC(mix(c.tone, RB.day, 0.2), 0.12)} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={poly([...front, ...base])} fill={shadeC(c.tone, 0.28)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${f2(front[1][0])},${f2(front[1][1] + 3)} L${f2(front[front.length - 2][0])},${f2(front[front.length - 2][1] + 3)}`} stroke={RB.dayHot} strokeWidth={3} fill="none" opacity={0.45} strokeLinecap="round" />
    </g>
  );
};

export const E4: React.FC<ShotProps> = ({f, lf}) => {
  const id = idf('e3d', f);
  const t = lf / FPS;
  const v = e4View(lf);
  const pose = e4Pose(lf);
  const xNow = s0 + V_MM * t;
  const near = (x: number, z: number, y = 0) => P(v, [x, y, z]) as Pt;
  // the gravel bed: its top band (z -70..70) and its front down to the frame's bottom
  const bedTop: Pt[] = [near(xNow - 80, -70), near(xNow + 80, -70), near(xNow + 80, 70), near(xNow - 80, 70)];
  const grit = Array.from({length: 70}, (_, i) => {
    const x = -120 + rnd(i, 51) * 330, z = -66 + rnd(i + 1, 51) * 130;
    const p = near(x, z);
    if (p[0] < -40 || p[0] > 1120) return null;
    const r = (0.5 + rnd(i + 2, 51) * 1.1) * S;
    return <ellipse key={i} cx={f2(p[0])} cy={f2(p[1])} rx={f2(r)} ry={f2(r * 0.42)} fill={i % 3 ? '#6F665E' : '#8F857A'} stroke={INK} strokeWidth={2} />;
  });
  // the rebar stub behind the far legs
  const rbx = 46;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {/* the dark rubble far behind, out of focus, with warm dust bokeh in the shaft */}
      <VGrad id={`${id}-bg`} x0={0} y0={0} x1={1080} y1={1920} stops={[[0, '#120F0D'], [0.45, '#2C241E'], [0.7, '#3A3029'], [1, '#1A1512']]} />
      <Blur id={`${id}-bb`} sd={16}>
        <path d={poly([[-100, 760], [300, 700], [520, 780], [760, 690], [1180, 760], [1180, 1240], [-100, 1240]])} fill="#2A231F" />
        {Array.from({length: 9}, (_, i) => (
          <circle key={i} cx={f2(((rnd(i, 61) * 1300 - 110 * t * 0.4 + 1300) % 1300) - 110)} cy={f2(260 + rnd(i + 1, 61) * 700)} r={f2(18 + rnd(i + 2, 61) * 30)} fill={RB.day} opacity={0.18} />
        ))}
      </Blur>
      <Glow2 id={`${id}-key`} cx={300} cy={700} rx={900} ry={700} color={RB.day} a={0.18} />
      {/* the bed */}
      <path d={poly(bedTop)} fill="#7A7067" />
      <path d={poly([near(xNow - 80, 70), near(xNow + 80, 70), [1200, 2000], [-200, 2000]])} fill="#3F3832" />
      {grit}
      <Rebar pts={[near(rbx, -52, -2), near(rbx + 0.5, -52, 20), near(rbx + 6, -52, 27)]} w={2.1 * S} dark={0.15} />
      {CHUNKS.map((c, i) => <Stone key={i} v={v} c={c} />)}
      <Roach2D pose={pose} v={v} o={{id: `${id}-r`, gear: <Gear2D id={`${id}-g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      <Motes id={`${id}-mo`} t={t + 5} n={20} x0={0} y0={300} x1={1080} y1={1250} r={4} seed={62} a={0.7} />
      {/* near grit, out of focus, sliding past */}
      <Blur id={`${id}-nb`} sd={10}>
        {Array.from({length: 7}, (_, i) => {
          const x = -60 + i * 46 + rnd(i, 71) * 20;
          const p = near(x, 120, 0);
          const r = (3 + rnd(i + 1, 71) * 4) * S;
          return <ellipse key={i} cx={f2(p[0])} cy={f2(p[1] + 330 + rnd(i + 2, 71) * 160)} rx={f2(r)} ry={f2(r * 0.6)} fill={i % 2 ? '#2C2621' : '#3C342D'} />;
        })}
      </Blur>
    </svg>
  );
};
void clamp;
