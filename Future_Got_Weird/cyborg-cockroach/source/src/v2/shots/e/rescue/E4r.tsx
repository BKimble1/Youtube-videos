// E4 (700-715, "carrying"): macro, low and front-three-quarter, on the medic's near legs crossing uneven rubble in the
// shaft's warm light: angular chunks of broken concrete and brick, gravel, a rusted rebar stub. The camera tracks with
// the body; the ground slides under it. Every foot is planted on the height of the rubble under it (kit.onGround): a
// tripod lifts, swings over the chunks and lands on a chunk top while the other tripod holds, and the body rides at the
// mean height of its feet.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../../rig/roach';
import {Roach2D} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt, View, P, D} from '../../../roach/ortho';
import {rnd} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../../lib/color';
import {RB, Pt, Rebar, Glow2, Motes, VGrad, Vignette, poly, f2} from '../art';
import {ShotProps} from '../../index2';
import {idf, FPS, onGround, Blur} from './kit';

export const E4_N = 16;
const S = 13.5; // px per mm
const V_MM = 34;
const SX = 470, SY = 1010; // the body's ground point on screen
const AZ = 24, EL = 52;
const s0 = 31;

/** angular rubble chunks (world mm): a convex broken footprint in the ground plane (x, z), extruded to a slightly
 *  tilted top: top(x, z) = h + gx (x - xc) + gz (z - zc) */
type Chunk = {fp: [number, number][]; xc: number; zc: number; h: number; gx: number; gz: number; tone: string};
const TONES = [RB.concLit, RB.conc, '#9A6A52', RB.concDark, RB.concPale, RB.conc];
const CHUNKS: Chunk[] = Array.from({length: 190}, (_, i) => {
  // dense along the insect's path, thinning out to the sides
  const zu = rnd(i + 9, 41) * 2 - 1;
  const xc = -60 + rnd(i, 41) * 240, zc = 115 * zu * Math.abs(zu) ** 0.4;
  const r = 2.6 + rnd(i + 3, 41) * 5.2;
  const k = 5 + Math.floor(rnd(i + 5, 41) * 3);
  const a0 = rnd(i + 13, 41) * 6.28;
  const fp: [number, number][] = Array.from({length: k}, (_, j) => {
    const a = a0 + (j / k) * Math.PI * 2;
    const rr = r * (0.72 + 0.28 * rnd(i * 11 + j, 43));
    return [xc + Math.cos(a) * rr, zc + Math.sin(a) * rr];
  });
  const h = 1.2 + rnd(i + 7, 41) * 4.4;
  return {fp, xc, zc, h, gx: (rnd(i + 17, 41) - 0.5) * 0.25, gz: (rnd(i + 19, 41) - 0.5) * 0.25, tone: TONES[i % TONES.length]};
});
const topAt = (c: Chunk, x: number, z: number) => Math.max(0.5, c.h + c.gx * (x - c.xc) + c.gz * (z - c.zc));
const inside = (c: Chunk, x: number, z: number) => {
  let sg = 0;
  for (let i = 0; i < c.fp.length; i++) {
    const [ax, az] = c.fp[i], [bx, bz] = c.fp[(i + 1) % c.fp.length];
    const cr = (bx - ax) * (z - az) - (bz - az) * (x - ax);
    if (cr === 0) continue;
    if (sg === 0) sg = Math.sign(cr);
    else if (Math.sign(cr) !== sg) return false;
  }
  return true;
};
/** the rubble's height under a ground point (mm) */
export const e4H = (x: number, z: number) => CHUNKS.reduce((m, c) => (Math.abs(x - c.xc) < 11 && Math.abs(z - c.zc) < 11 && inside(c, x, z) ? Math.max(m, topAt(c, x, z)) : m), 0);

const motion = (lf: number, lift = 0) => {
  const t = lf / FPS;
  return {path: straightPath([0, 0, 0], 0), s: s0 + V_MM * t, t: t + 23.4, search: 0.5, antL: {yaw: 0.5, pitch: 0.1}, antR: {yaw: 0.46, pitch: 0.14}, seed: 5, offset: [0, lift, 0] as [number, number, number]};
};
/** the posed insect on the rubble: feet on the chunk tops, the body raised to the mean height of its feet */
export const e4Pose = (lf: number): RoachPose => {
  const p0 = poseRoach(motion(lf));
  const lift = p0.legs.reduce((a, l) => a + e4H(l.foot[0], l.foot[2]), 0) / 6;
  return onGround(poseRoach(motion(lf, lift)), e4H);
};
export const e4View = (lf: number): View => viewAt(AZ, EL, S, [s0 + V_MM * (lf / FPS), 0, 0], SX, SY);

const Chunk3: React.FC<{v: View; c: Chunk}> = ({v, c}) => {
  const n = c.fp.length;
  const q = (x: number, y: number, z: number) => P(v, [x, y, z]) as Pt;
  const top: Pt[] = c.fp.map(([x, z]) => q(x, topAt(c, x, z), z));
  const sides: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const [ax, az] = c.fp[i], [bx, bz] = c.fp[(i + 1) % n];
    // outward normal of the edge in the ground plane (the footprint runs either way round: test against the centre)
    let nx = bz - az, nz = -(bx - ax);
    if (nx * ((ax + bx) / 2 - c.xc) + nz * ((az + bz) / 2 - c.zc) < 0) (nx = -nx), (nz = -nz);
    const facing = nx * v.F[0] + nz * v.F[2];
    if (facing <= 0) continue;
    const lit = Math.max(0, (nx * -0.6 + nz * -0.3) / Math.hypot(nx, nz));
    sides.push(<path key={i} d={poly([q(ax, topAt(c, ax, az), az), q(bx, topAt(c, bx, bz), bz), q(bx, -0.5, bz), q(ax, -0.5, az)])} fill={shadeC(c.tone, 0.42 - 0.2 * lit)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />);
  }
  return (
    <g>
      {sides}
      <path d={poly(top)} fill={litC(mix(c.tone, RB.day, 0.15), 0.1)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${f2(top[0][0])},${f2(top[0][1])} L${f2((top[1][0] + top[2][0]) / 2)},${f2((top[1][1] + top[2][1]) / 2)}`} stroke={RB.dayHot} strokeWidth={2.5} opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

export const E4: React.FC<ShotProps> = ({f, lf}) => {
  const id = idf('e3d', f);
  const t = lf / FPS;
  const v = e4View(lf);
  const pose = e4Pose(lf);
  const q = (x: number, z: number, y = 0) => P(v, [x, y, z]) as Pt;
  const grit = Array.from({length: 160}, (_, i) => {
    const x = -60 + rnd(i, 51) * 230, z = -120 + rnd(i + 1, 51) * 240;
    const p = q(x, z);
    if (p[0] < -40 || p[0] > 1120 || p[1] < -40 || p[1] > 1960) return null;
    const r = (0.35 + rnd(i + 2, 51) * 0.7) * S;
    return <ellipse key={i} cx={f2(p[0])} cy={f2(p[1])} rx={f2(r)} ry={f2(r * 0.5)} fill={i % 3 ? '#7A7067' : '#9A8F82'} stroke={INK} strokeWidth={2} />;
  });
  const chunks = CHUNKS.map((c, i) => ({c, i, d: D(v, [c.xc, 0, c.zc])})).sort((a, b) => a.d - b.d);
  const rbx = 62, rbz = -52;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {/* the dark rubble far behind, out of focus, with warm dust bokeh in the shaft */}
      <VGrad id={`${id}-bg`} x0={0} y0={0} x1={1080} y1={1920} stops={[[0, '#120F0D'], [0.4, '#2C241E'], [0.55, '#3A3029'], [1, '#2A231E']]} />
      <Blur id={`${id}-bb`} sd={16}>
        <path d={poly([[-100, 760], [300, 690], [520, 760], [760, 670], [1180, 740], [1180, 1000], [-100, 1000]])} fill="#2A231F" />
        {Array.from({length: 9}, (_, i) => (
          <circle key={i} cx={f2(((rnd(i, 61) * 1300 - 60 * t + 1300) % 1300) - 110)} cy={f2(200 + rnd(i + 1, 61) * 620)} r={f2(18 + rnd(i + 2, 61) * 30)} fill={RB.day} opacity={0.18} />
        ))}
      </Blur>
      <Glow2 id={`${id}-key`} cx={360} cy={760} rx={900} ry={700} color={RB.day} a={0.2} />
      {/* the floor: a gravel bed receding into the dark */}
      <path d={poly([q(-300, -300), q(400, -300), q(400, 300), q(-300, 300)])} fill="#5E554D" />
      <Glow2 id={`${id}-pool`} cx={SX + 80} cy={SY + 80} rx={700} ry={560} color={RB.day} a={0.3} />
      {grit}
      <Rebar pts={[q(rbx, rbz, -2), q(rbx + 0.5, rbz, 22), q(rbx + 7, rbz, 30)]} w={1.9 * S} dark={0.15} />
      {chunks.map(({c, i}) => <Chunk3 key={i} v={v} c={c} />)}
      <Roach2D pose={pose} v={v} o={{id: `${id}-r`, gear: <Gear2D id={`${id}-g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      <Motes id={`${id}-mo`} t={t + 5} n={20} x0={0} y0={300} x1={1080} y1={1250} r={4} seed={62} a={0.7} />
      <Vignette id={`${id}-vg`} a={0.75} />
    </svg>
  );
};
