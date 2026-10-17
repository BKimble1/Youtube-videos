// Group C1 helpers (shots C1–C8: the closing avenue and the decoy). Motion builders on top of the rig — travel with
// realistic stride lengths, stair stepping on treads, the support pair (a supporter carrying the injured teammate's
// weight) — plus the small props these shots need (tool bag, tablet + clip-on projector, the hanging hook, a steel
// column, the breakable catwalk railing). Everything is a pure function of time.
import React from 'react';
import {Actor, ActorProps, solve, handCenter, Damage} from '../../rig/actor';
import {gait, GaitOpts} from '../../rig/gait';
import {Look} from '../../rig/looks';
import {C, SYS} from '../../theme';
import {V2, V3, clamp, lerp, smooth, rnd, f2, rad, noise, polyPath} from '../../kit/math';

// ------------------------------------------------------------------ gaits with cartoon-leg strides
// The rig's legs are 155 long: comfortable footprints ~115 apart at a walk, ~210 at a run. stride = full cycle.
export const G_WALK = {stride: 230, duty: 0.6, lift: 20, bob: 5, armAmp: 16};
export const G_HURRY = {stride: 290, duty: 0.5, lift: 28, bob: 7, armAmp: 24};
export const G_RUN = {stride: 400, duty: 0.36, lift: 44, bob: 10, armAmp: 38};
export const G_SUPPORT = {stride: 210, duty: 0.66, lift: 16, bob: 6, armAmp: 6};
export type Gait = Omit<GaitOpts, 's'>;

/** Piecewise-linear keys smoothed by a Gaussian window (smooth starts/stops without overshoot). */
export const sk = (t: number, k: [number, number][], win = 0.25) => {
  const lin = (x: number) => {
    if (x <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (x <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (x - k[i - 1][0]) / Math.max(1e-6, k[i][0] - k[i - 1][0]));
    return k[k.length - 1][1];
  };
  if (win <= 0) return lin(t);
  let a = 0, w = 0;
  for (let i = 0; i < 9; i++) {
    const u = (i / 8) * 2 - 1;
    const g = Math.exp(-3 * u * u);
    a += lin(t + u * win) * g; w += g;
  }
  return a / w;
};

/** A figure travelling on flat ground: planted feet from the gait, arm swing, posture by pace. */
export const mover = (look: Look, o: {x0: number; dist: number; dir: 1 | -1; ground: number; gait: Gait; t: number; s?: number; run?: number}, base: Partial<ActorProps> = {}): ActorProps => {
  const s = base.s ?? o.s ?? 1;
  const g = gait(o.x0, o.dist, o.dir, {...o.gait, s});
  const run = o.run ?? clamp((o.gait.stride - 230) / 170);
  const fy = (f: {lift: number}) => o.ground - 10 * s - f.lift;
  const swing = (a: number) => ({fwd: a, out: 8, bend: 18 + Math.max(0, a) * 0.8 + run * 62});
  return {
    look, t: o.t, s,
    x: o.x0 + o.dir * o.dist, y: o.ground, yaw: o.dir * 90,
    drop: g.drop + run * 12, side: g.side, lean: 3 + run * 11,
    legL: {foot: {x: g.L.x, y: fy(g.L)}, pitch: g.L.pitch},
    legR: {foot: {x: g.R.x, y: fy(g.R)}, pitch: g.R.pitch},
    armL: {fk: swing(g.armL)}, armR: {fk: swing(g.armR)},
    ...base,
  } as ActorProps;
};

/** Standing still with weight on both feet (feet planted at x ± spread). */
export const stand = (look: Look, x: number, ground: number, base: Partial<ActorProps> & {t: number}, spread = 34, dir: 1 | -1 = 1): ActorProps => {
  const s = base.s ?? 1;
  return {
    look, x, y: ground, yaw: dir * 90, drop: 6,
    legL: {foot: {x: x - dir * spread * s, y: ground - 10 * s}}, legR: {foot: {x: x + dir * spread * s, y: ground - 10 * s}},
    ...base,
  } as ActorProps;
};

// ------------------------------------------------------------------ stairs: feet on treads
/**
 * Feet alternate onto treads (holds[0] = both feet; then holds 1, 2, … alternating R, L). k is continuous progress in
 * treads. Returns leg targets, pelvis x and the ground y to pass to the actor.
 */
export const treads = (holds: V2[], k: number, s = 1, lift = 26) => {
  const n = holds.length;
  const kk = clamp(k, 0, n - 1);
  const j = Math.max(1, Math.ceil(kk - 1e-6));
  const u = clamp(kk - (j - 1));
  const e = smooth(u);
  const from = holds[Math.max(0, j - 2)], to = holds[j], plant = holds[j - 1];
  const rise = Math.max(0, from.y - to.y);
  const arc = Math.sin(Math.PI * u) * (lift * s + rise * 0.45);
  const sw = {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) - arc};
  const swingIsR = j % 2 === 1;
  const footR = kk <= 0 ? holds[0] : swingIsR ? sw : plant;
  const footL = kk <= 0 ? holds[0] : swingIsR ? plant : sw;
  const mid = {x: (lerp(from.x, to.x, e) + plant.x) / 2, y: (lerp(from.y, to.y, e) + plant.y) / 2};
  return {footL, footR, mid, pitchL: swingIsR ? 0 : 18 * Math.sin(Math.PI * u), pitchR: swingIsR ? 18 * Math.sin(Math.PI * u) : 0};
};
/** A figure on treads (stairs): pass the treads' top surface points. */
export const climber = (look: Look, holds: V2[], k: number, dir: 1 | -1, base: Partial<ActorProps> & {t: number}, o: {drop?: number; lean?: number; gap?: number} = {}): ActorProps => {
  const s = base.s ?? 1;
  const q = treads(holds, k, s);
  const off = (o.gap ?? 4) * s;
  return {
    look, x: q.mid.x + dir * 6 * s, y: q.mid.y, yaw: dir * 90, drop: o.drop ?? 20, lean: o.lean ?? 8,
    legL: {foot: {x: q.footL.x - dir * off, y: q.footL.y - 10 * s}, pitch: q.pitchL},
    legR: {foot: {x: q.footR.x + dir * off, y: q.footR.y - 10 * s}, pitch: q.pitchR},
    armL: {fk: {fwd: 10, out: 10, bend: 40}}, armR: {fk: {fwd: 14, out: 10, bend: 50}},
    ...base,
  } as ActorProps;
};

// ------------------------------------------------------------------ the support pair
/**
 * The supporter walks on the teammate's right (nearer camera when heading +x); the teammate's right arm is over the
 * supporter's shoulders, the supporter's left arm round her back. Her left leg bears no weight (toes trailing), her
 * left arm is held to her chest. Returns [supporter, teammate].
 */
export const supportPair = (sup: Look, tm: Look, o: {x: number; ground: number; dist: number; dir: 1 | -1; t: number; s?: number; yaw?: number;
  supDmg?: Damage; tmDmg?: Damage; supFace?: ActorProps['face']; tmFace?: ActorProps['face']; supArmR?: ActorProps['armR']; seed?: number; supLean?: number; tmLean?: number; hop?: number}): [ActorProps, ActorProps] => {
  const s = o.s ?? 1, dir = o.dir;
  const yaw = o.yaw ?? 90 * dir;
  const gs = gait(o.x, o.dist, dir, {...G_SUPPORT, s});
  const gt = gait(o.x - dir * 10 * s, o.dist, dir, {...G_SUPPORT, stride: G_SUPPORT.stride, duty: 0.7, s, limp: {side: 'L', amt: 1}});
  const X = o.x + dir * o.dist;
  const sx = X + dir * 14 * s, tx = X - dir * 22 * s;
  const fy = (f: {lift: number}) => o.ground - 10 * s - f.lift;
  const supBase: ActorProps = {
    look: sup, t: o.t, s, seed: (o.seed ?? 1) * 2 + 1, x: sx, y: o.ground, z: 0.05, yaw, drop: gs.drop + 10, side: gs.side, lean: o.supLean ?? 9,
    legL: {foot: {x: gs.L.x + dir * 14 * s, y: fy(gs.L)}, pitch: gs.L.pitch}, legR: {foot: {x: gs.R.x + dir * 14 * s, y: fy(gs.R)}, pitch: gs.R.pitch},
    dmg: o.supDmg, face: o.supFace ?? {mouth: 'grit', brows: -0.4}, breath: 0.6,
    armR: o.supArmR ?? {fk: {fwd: gs.armR * 0.6, out: 10, bend: 30}},
  };
  // her right foot steps; the left trails, toes skimming the ground behind
  const hop = (o.hop ?? 1) * Math.max(0, Math.sin(2 * Math.PI * (o.dist / (G_SUPPORT.stride * s)) + 0.6)) * 5;
  const tmBase: ActorProps = {
    look: tm, t: o.t, s, seed: (o.seed ?? 1) * 2 + 2, x: tx, y: o.ground, z: 0, yaw, drop: gt.drop + 22 - hop, side: 6, lean: o.tmLean ?? 12,
    legR: {foot: {x: gt.R.x - dir * 22 * s, y: fy(gt.R)}, pitch: gt.R.pitch},
    legL: {foot: {x: tx - dir * 34 * s, y: o.ground - 30 * s}, pitch: 38},
    dmg: o.tmDmg, face: o.tmFace ?? {mouth: 'pain', worry: 0.8, lids: 0.35, brows: -0.2}, breath: 0.9,
    head: {pitch: 8, roll: dir * -4},
  };
  const rs = solve(supBase), rt = solve(tmBase);
  // her right hand rests on his right (near) shoulder; her forearm passes behind his neck
  const shR = rs.sh[1];
  const tmHand: V3 = {x: shR.x + dir * 6 * s, y: shR.y + 4 * s, z: shR.z + 12 * s};
  // his left hand at her far (left) hip, behind her
  const hipL = rt.hip[0];
  const supHand: V3 = {x: hipL.x - dir * 4 * s, y: hipL.y - 26 * s, z: hipL.z - 10 * s};
  // her injured left arm held to the chest
  const chest = {x: rt.P.x + dir * 38 * s, y: rt.P.y - 92 * s, z: rt.P.z + 30 * s};
  return [
    {...supBase, armL: {hand: supHand, pole: {x: -dir * 0.2, y: 1, z: -1}}, zArm: [-110, undefined], handL: 'mitt'},
    {...tmBase, armR: {hand: tmHand, pole: {x: 0, y: -0.4, z: -1}}, armL: {hand: chest, pole: {x: -dir * 0.3, y: 1, z: 0.6}}, zArm: [undefined, -170], zHand: [undefined, 110], handL: 'fist'},
  ];
};

// ------------------------------------------------------------------ props
/** The builder's canvas tool bag (hangs from a hand; world-space, drawn as an extra part). */
export const ToolBag: React.FC<{x: number; y: number; ink: number; s?: number; swing?: number; tablet?: boolean}> = ({x, y, ink, s = 1, swing = 0, tablet = true}) => (
  <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(swing)}) scale(${s})`}>
    <path d="M -22 4 Q 0 -30 22 4" fill="none" stroke={C.ink} strokeWidth={ink * 2.2} strokeLinecap="round" />
    <path d="M -22 4 Q 0 -30 22 4" fill="none" stroke="#5E4A33" strokeWidth={ink * 1.1} strokeLinecap="round" />
    <path d="M -46 6 L 46 6 L 54 74 Q 0 84 -54 74 Z" fill="#7C6A4A" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
    <path d="M -46 6 L 46 6 L 48 24 L -48 24 Z" fill="#665538" />
    <rect x={-10} y={30} width={20} height={14} rx={3} fill="#B9A36F" stroke={C.ink} strokeWidth={ink * 0.6} />
    {tablet && <g transform="translate(40 42) rotate(8)"><rect x={-6} y={-30} width={22} height={58} rx={4} fill="#2B3036" stroke={C.ink} strokeWidth={ink * 0.7} /><path d="M 2 -18 l 8 10 l -6 8" stroke="#9AA3AA" strokeWidth={1.5} fill="none" /></g>}
  </g>
);

/** The battered tablet with the clip-on projector. Origin at its centre; w ≈ 92 at s = 1. view 0..1 tilts the screen
 *  toward camera (1 = face on). content: drawn in screen-local coordinates (−40..40 × −26..26). */
export const Tablet: React.FC<{s?: number; ink: number; view?: number; content?: React.ReactNode; glow?: number; rot?: number; lens?: number; id: string; cracked?: number}> = ({s = 1, ink, view = 1, content, glow = 0.8, rot = 0, lens = 0, id, cracked = 0}) => {
  const sy = lerp(0.18, 1, view);
  return (
    <g transform={`rotate(${f2(rot)}) scale(${s} ${s})`}>
      <g transform={`scale(1 ${f2(sy)})`}>
        <rect x={-46} y={-31} width={92} height={62} rx={8} fill="#2B3036" stroke={C.ink} strokeWidth={ink} />
        <defs><clipPath id={id}><rect x={-40} y={-26} width={80} height={52} rx={3} /></clipPath></defs>
        <rect x={-40} y={-26} width={80} height={52} rx={3} fill="#10242C" />
        <g clipPath={`url(#${id})`}>
          <rect x={-40} y={-26} width={80} height={52} fill="#163A44" opacity={glow} />
          {content}
          {/* crack across a corner (battered) */}
          <path d="M 20 -26 L 26 -12 L 22 -4 L 34 8 L 40 6" fill="none" stroke="#DDEFF2" strokeWidth={1.2} opacity={0.75} />
          {cracked > 0 && <path d="M -40 -6 L -14 2 L -4 -10 L 12 6 L 40 -2 M -14 2 L -20 26 M 12 6 L 18 26" fill="none" stroke="#DDEFF2" strokeWidth={2} opacity={cracked} />}
        </g>
        {/* clip-on projector on the top edge */}
        <rect x={-14} y={-44} width={30} height={16} rx={4} fill="#4A535B" stroke={C.ink} strokeWidth={ink * 0.8} />
        <circle cx={10} cy={-36} r={5} fill={lens > 0 ? '#FFF1C9' : '#1A1F24'} stroke={C.ink} strokeWidth={ink * 0.5} />
      </g>
    </g>
  );
};

/** Crude finger-sketch walking figure (stroke only) at (x, y) with height h; phase ph animates a walk. */
export const SketchFigure: React.FC<{x: number; y: number; h: number; ph?: number; draw?: number; color?: string; w?: number; fill?: string}> = ({x, y, h, ph = 0, draw = 1, color = '#BFF3FF', w = 1.6, fill}) => {
  const a = Math.sin(ph) * 0.45;
  const hip = {x, y: y - h * 0.45}, neck = {x: x + h * 0.03, y: y - h * 0.8};
  const head = {x: x + h * 0.04, y: y - h * 0.92};
  const legs = [a, -a].map((k) => ({x: hip.x + Math.sin(k) * h * 0.45, y: hip.y + Math.cos(k) * h * 0.45}));
  const arms = [-a, a].map((k) => ({x: neck.x + Math.sin(k) * h * 0.3, y: neck.y + h * 0.04 + Math.cos(k) * h * 0.3}));
  const segs: [V2, V2][] = [[hip, neck], [hip, legs[0]], [hip, legs[1]], [neck, arms[0]], [neck, arms[1]]];
  const nDraw = draw * (segs.length + 1);
  if (fill) {
    return (
      <g>
        {segs.map(([p, q], i) => <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={fill} strokeWidth={h * 0.13} strokeLinecap="round" />)}
        <circle cx={head.x} cy={head.y} r={h * 0.09} fill={fill} />
      </g>
    );
  }
  return (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round">
      {nDraw > 0.01 && <circle cx={head.x} cy={head.y} r={h * 0.08} strokeDasharray={`${f2(clamp(nDraw) * h * 0.5)} 999`} />}
      {segs.map(([p, q], i) => {
        const u = clamp(nDraw - 1 - i);
        if (u <= 0) return null;
        return <line key={i} x1={p.x} y1={p.y} x2={lerp(p.x, q.x, u)} y2={lerp(p.y, q.y, u)} />;
      })}
    </g>
  );
};

/** Vertical steel H-column (hanger from the deck overhang down to the catwalk floor). */
export const SteelColumn: React.FC<{x: number; y0: number; y1: number; ink: number; dent?: number; seed?: number}> = ({x, y0, y1, ink, dent = 0, seed = 3}) => {
  const w = 54;
  const dy = lerp(y0, y1, 0.42);
  const pts = [{x: x - w / 2, y: y0}, {x: x + w / 2, y: y0}, {x: x + w / 2 - dent * 18, y: dy}, {x: x + w / 2, y: y1}, {x: x - w / 2, y: y1}, {x: x - w / 2 - dent * 18, y: dy}];
  return (
    <g>
      <path d={polyPath(pts)} fill="#56616A" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <rect x={x - 8} y={y0} width={16} height={y1 - y0} fill="#3F4950" />
      {[0.12, 0.88].map((u, i) => <rect key={i} x={x - w / 2 - 10} y={lerp(y0, y1, u) - 10} width={w + 20} height={20} fill="#6E7A83" stroke={C.ink} strokeWidth={ink * 0.6} />)}
      {[0.12, 0.88].map((u, i) => [-1, 1].map((k) => <circle key={`${i}${k}`} cx={x + k * (w / 2)} cy={lerp(y0, y1, u)} r={4} fill="#2A3238" />))}
      <path d={`M ${f2(x - 10)} ${f2(y0 + 60)} q 6 30 -2 70`} stroke="#8C4B30" strokeWidth={ink * 1.3} fill="none" opacity={0.6} />
      {void seed}
    </g>
  );
};

/** Maintenance davit on the deck edge with a chain and a heavy hook. theta: pendulum angle (deg, + swings west/left). */
export const davitHook = (px: number, py: number, L: number, theta: number) => {
  const a = rad(theta);
  return {x: px - Math.sin(a) * L, y: py + Math.cos(a) * L};
};
export const DavitHook: React.FC<{px: number; py: number; L: number; theta: number; ink: number; deckY: number; t: number}> = ({px, py, L, theta, ink, deckY, t}) => {
  const h = davitHook(px, py, L, theta);
  const a = rad(theta);
  // chain: links along the line
  const n = Math.max(6, Math.round(L / 34));
  const links: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const cx = lerp(px, h.x, u), cy = lerp(py, h.y, u);
    links.push(<ellipse key={i} cx={cx} cy={cy} rx={i % 2 ? 5 : 9} ry={14} transform={`rotate(${f2(-theta)} ${f2(cx)} ${f2(cy)})`} fill="none" stroke="#3A4148" strokeWidth={ink * 1.1} />);
  }
  return (
    <g>
      {/* davit: post on the deck edge, gooseneck over the catwalk */}
      <path d={`M ${f2(px + 70)} ${f2(deckY)} L ${f2(px + 70)} ${f2(py - 50)} Q ${f2(px + 70)} ${f2(py - 90)} ${f2(px + 20)} ${f2(py - 70)} L ${f2(px)} ${f2(py - 40)}`} fill="none" stroke={C.ink} strokeWidth={ink * 6.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${f2(px + 70)} ${f2(deckY)} L ${f2(px + 70)} ${f2(py - 50)} Q ${f2(px + 70)} ${f2(py - 90)} ${f2(px + 20)} ${f2(py - 70)} L ${f2(px)} ${f2(py - 40)}`} fill="none" stroke="#C99A2E" strokeWidth={ink * 4.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px} cy={py - 26} r={16} fill="#5B6670" stroke={C.ink} strokeWidth={ink * 0.8} />
      {links}
      {/* hook block and hook */}
      <g transform={`translate(${f2(h.x)} ${f2(h.y)}) rotate(${f2(-theta)})`}>
        <rect x={-34} y={-14} width={68} height={70} rx={12} fill="#C99A2E" stroke={C.ink} strokeWidth={ink} />
        <rect x={-34} y={-14} width={68} height={18} rx={8} fill="#A57B1E" />
        <path d="M -8 56 L -8 96 Q -8 150 38 150 Q 82 150 82 106 L 82 92 L 58 100 L 58 106 Q 58 126 38 126 Q 16 126 16 98 L 16 56 Z" fill="#6E7A83" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      </g>
      {void a}{void t}
    </g>
  );
};

/** The catwalk's outer (front) railing, with one breakable bay: [bx0, bx1] bends outward/down by `bend` 0..1. */
export const CatwalkRail: React.FC<{x0: number; x1: number; y: number; ink: number; bay?: [number, number]; bend?: number; steel: string; steelDark: string}> = ({x0, x1, y, ink, bay, bend = 0, steel, steelDark}) => {
  const els: React.ReactElement[] = [];
  const rail = (a: number, b: number, key: string) => (
    <g key={key}>
      <rect x={a} y={y - 260} width={b - a} height={18} fill={steel} stroke={C.ink} strokeWidth={ink * 0.7} />
      <rect x={a} y={y - 130} width={b - a} height={12} fill={steel} stroke={C.ink} strokeWidth={ink * 0.5} />
    </g>
  );
  const posts: number[] = [];
  for (let k = 0; x0 + k * 500 <= x1; k++) posts.push(x0 + k * 500);
  if (!bay || bend <= 0) {
    els.push(rail(x0, x1, 'r'));
  } else {
    els.push(rail(x0, bay[0], 'ra'), rail(bay[1], x1, 'rb'));
    // the bent bay: top rail sags in a V and tears free from one post
    const sag = bend * 210;
    const mid = (bay[0] + bay[1]) / 2 + bend * 30;
    const tear = clamp((bend - 0.55) / 0.3);
    const endB = {x: lerp(bay[1], bay[1] - 60, tear), y: y - 251 + tear * 260};
    els.push(<polyline key="bt" points={`${bay[0]},${y - 251} ${f2(mid)},${f2(y - 251 + sag)} ${f2(endB.x)},${f2(endB.y)}`} fill="none" stroke={C.ink} strokeWidth={18 + ink * 1.4} strokeLinejoin="round" strokeLinecap="round" />);
    els.push(<polyline key="bt2" points={`${bay[0]},${y - 251} ${f2(mid)},${f2(y - 251 + sag)} ${f2(endB.x)},${f2(endB.y)}`} fill="none" stroke={steel} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />);
    els.push(<polyline key="bm" points={`${bay[0]},${y - 124} ${f2(mid - 20)},${f2(y - 124 + sag * 0.5)} ${f2(bay[1])},${y - 124}`} fill="none" stroke={C.ink} strokeWidth={12 + ink} strokeLinejoin="round" />);
    els.push(<polyline key="bm2" points={`${bay[0]},${y - 124} ${f2(mid - 20)},${f2(y - 124 + sag * 0.5)} ${f2(bay[1])},${y - 124}`} fill="none" stroke={steel} strokeWidth={12} strokeLinejoin="round" />);
  }
  posts.forEach((px, k) => {
    const inBay = bay && bend > 0 && px > bay[0] && px < bay[1];
    const lean = inBay ? bend * 40 : 0;
    els.push(<path key={`p${k}`} d={`M ${px - 8} ${y} L ${px - 8 + lean * 0.3} ${y - 260} L ${px + 8 + lean * 0.3} ${y - 260} L ${px + 8} ${y} Z`} fill={steelDark} stroke={C.ink} strokeWidth={ink * 0.4} transform={inBay ? `rotate(${f2(lean)} ${px} ${y})` : undefined} />);
  });
  els.push(<rect key="toe" x={x0} y={y + 20} width={x1 - x0} height={40} fill={steelDark} stroke={C.ink} strokeWidth={ink * 0.8} />);
  return <g>{els}</g>;
};

/** Small helper: an actor plus extra world-space parts, all depth sorted with the cast elsewhere. */
export const hand = (p: ActorProps, i: 0 | 1): V2 => {
  const r = solve(p);
  const h = handCenter(r, i);
  return {x: h.x, y: h.y};
};

/** Faces by situation (fatigue, concentration, recognition — never permanent panic). */
export const FACE = {
  tired: {mouth: 'pant', brows: -0.2, worry: 0.4, lids: 0.25} as ActorProps['face'],
  focus: {mouth: 'flat', brows: -0.5, lids: 0.15} as ActorProps['face'],
  grit: {mouth: 'grit', brows: -0.7} as ActorProps['face'],
  alarm: {mouth: 'open', open: 0.4, brows: 0.4, worry: 0.6} as ActorProps['face'],
  pain: {mouth: 'pain', brows: -0.3, worry: 0.7, lids: 0.3} as ActorProps['face'],
  worry: {mouth: 'sad', worry: 0.7, brows: 0.1} as ActorProps['face'],
};

export const flicker = (t: number, seed: number) => 0.85 + 0.15 * noise(t * 7, seed);
export {Actor, rnd, SYS};
