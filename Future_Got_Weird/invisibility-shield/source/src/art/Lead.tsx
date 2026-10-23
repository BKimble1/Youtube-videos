// The lead: the Weird Crew "guesser" (red spiky hair, peach skin, white tee with saffron stripes, navy trousers,
// white shoes), standing and facing the camera. Built from the Death Clock rig's parts (lib/ink, lib/limb, lib/shade,
// art/Head, art/Hand: one ink contour per group, gradient shading from one fixed upper-left key light, five-digit
// hands). Feet stay planted; the hips can drop a little (knees soften) for the lift. Arms are two-bone chains from the
// shoulders to wrist targets supplied by the scene (the grips on the shield's back, or the reach round its edge).
// When a hand comes forward toward the camera the arm is foreshortened (both bones shorten together), so the elbow
// stays near the body instead of swinging wide.
import React from 'react';
import {mix, shade} from '../lib/color';
import {Deco, Inked, InkLine} from '../lib/ink';
import {Limb} from '../lib/limb';
import {add, clamp, fmt, len, lerp, mul, norm, P, perp, sub, V} from '../lib/math';
import {Blob, Capsule, Lin, SoftShadow} from '../lib/shade';
import {Expr, Head} from './Head';
import {Hand, HandPose} from './Hand';
import {BODY_X, GROUND} from '../world';

export const LC = {
  skin: '#F2C9A8',
  shirt: '#FFFFFF',
  stripe: '#FFC744',
  pants: '#2E3F5C',
  shoe: '#FFFFFF',
  sole: '#B9C4CC',
};

export type ArmPose = {
  W: V; // wrist target (world)
  ang: number; // hand direction (deg, atan2: 0 = +x, 90 = down)
  view: 'back' | 'palm';
  ts: 1 | -1; // thumb side
  hand: HandPose;
};
export type LeadPose = {
  bob: number; // hip drop (px), knees soften
  sway: number; // small lateral weight shift of the upper body (px)
  roll: number; // head roll (deg)
  turn: number; // head 3/4 turn (0 = facing the camera)
  expr: Expr;
  blink: number;
  R: ArmPose; // his right arm (screen-left)
  L: ArmPose; // his left arm (screen-right)
};

export const DIM = {upper: 199, fore: 178, hand: 96, headR: 96, thigh: 226, shin: 216};
const ANKLE_Y = GROUND - 24;
const HIP_Y0 = 868;

/** Joint positions (pure; shared by the drawing, shadows and QA). */
export const leadJoints = (p: LeadPose) => {
  const hipY = HIP_Y0 + p.bob;
  const cx = BODY_X + p.sway;
  const ys = hipY - 338; // shoulder line
  const head = {x: cx + p.sway * 0.3, y: ys - 120};
  const S = {r: {x: cx - 114, y: ys + 24}, l: {x: cx + 114, y: ys + 24}};
  const arm = (Sh: V, T: V, side: 1 | -1) => {
    const d0 = sub(T, Sh);
    const d = Math.max(1, len(d0));
    const Lt = DIM.upper + DIM.fore;
    // apparent length: a hand brought forward (close to the shoulder in the picture) foreshortens the whole arm
    const app = clamp(d / 0.9, 0.5 * Lt, Lt);
    const l1 = (DIM.upper * app) / Lt, l2 = (DIM.fore * app) / Lt;
    const r = Math.min(d, l1 + l2 - 0.5);
    const a = (l1 * l1 + r * r - l2 * l2) / (2 * r);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const dir = norm(d0);
    // the elbow bends partly toward the camera, so its sideways excursion in the picture is reduced
    const E = add(add(Sh, mul(dir, a)), mul(perp(dir), h * side * 0.55));
    return {S: Sh, E, W: T};
  };
  const hip = {r: {x: cx - 50, y: hipY + 6}, l: {x: cx + 50, y: hipY + 6}};
  const ank = {r: {x: BODY_X - 58, y: ANKLE_Y}, l: {x: BODY_X + 58, y: ANKLE_Y}};
  const knee = (h: V, a: V, out: number) => {
    const m = mul(add(h, a), 0.5);
    const dl = len(sub(a, h));
    const flex = clamp((DIM.thigh + DIM.shin - dl) / 60); // softened knee splays a touch outward in front view
    return {x: m.x + out * (2 + 10 * flex), y: m.y - 6};
  };
  return {
    hipY, cx, ys, head,
    R: arm(S.r, p.R.W, 1),
    L: arm(S.l, p.L.W, -1),
    legR: {H: hip.r, K: knee(hip.r, ank.r, -1), A: ank.r},
    legL: {H: hip.l, K: knee(hip.l, ank.l, 1), A: ank.l},
  };
};

export const torsoPath = (cx: number, ys: number) => {
  const pts: [number, number][] = [
    [-44, -26], [-96, -16], [-126, 4], [-128, 44], [-116, 120], [-106, 210], [-102, 290], [-108, 334], [-56, 342], [0, 344],
    [56, 342], [108, 334], [102, 290], [106, 210], [116, 120], [128, 44], [126, 4], [96, -16], [44, -26], [0, -14],
  ];
  const q = pts.map(([x, y]) => ({x: cx + x, y: ys + y}));
  let d = `M${P(q[0])}`;
  for (let i = 0; i < q.length; i++) {
    const p0 = q[(i - 1 + q.length) % q.length], p1 = q[i], p2 = q[(i + 1) % q.length], p3 = q[(i + 2) % q.length];
    d += ` C${P(add(p1, mul(sub(p2, p0), 1 / 6)))} ${P(add(p2, mul(sub(p1, p3), 1 / 6)))} ${P(p2)}`;
  }
  return d + ' Z';
};

export const Lead: React.FC<{id: string; p: LeadPose; arms?: 'all' | 'none'; shadows?: boolean}> = ({id, p, arms = 'all', shadows = true}) => {
  const j = leadJoints(p);
  const OUT = 7, IN = 5;
  const torsoD = torsoPath(j.cx, j.ys);
  const pelD = (() => {
    const y = j.hipY;
    return `M${fmt(j.cx - 104)},${fmt(y - 40)} L${fmt(j.cx + 104)},${fmt(y - 40)} C${fmt(j.cx + 112)},${fmt(y + 10)} ${fmt(j.cx + 104)},${fmt(y + 60)} ${fmt(j.cx + 96)},${fmt(y + 80)} L${fmt(j.cx)},${fmt(y + 70)} L${fmt(j.cx - 96)},${fmt(y + 80)} C${fmt(j.cx - 104)},${fmt(y + 60)} ${fmt(j.cx - 112)},${fmt(y + 10)} ${fmt(j.cx - 104)},${fmt(y - 40)} Z`;
  })();
  const Leg = (k: string, g: {H: V; K: V; A: V}) => (
    <Inked w={IN} key={k}>
      <Limb id={`${id}-${k}`} A={g.H} B={g.K} C={g.A} rA={46} rB={37} rC={30} color={LC.pants} spec={0.1} capA="flat" />
    </Inked>
  );
  const Shoe = (k: string, a: V, s: 1 | -1) => {
    const c = {x: a.x + s * 6, y: GROUND - 16};
    const d = `M${fmt(c.x - 44)},${fmt(c.y + 2)} C${fmt(c.x - 46)},${fmt(c.y - 26)} ${fmt(c.x - 20)},${fmt(c.y - 34)} ${fmt(c.x)},${fmt(c.y - 34)} C${fmt(c.x + 20)},${fmt(c.y - 34)} ${fmt(c.x + 46)},${fmt(c.y - 26)} ${fmt(c.x + 44)},${fmt(c.y + 2)} C${fmt(c.x + 40)},${fmt(c.y + 18)} ${fmt(c.x - 40)},${fmt(c.y + 18)} ${fmt(c.x - 44)},${fmt(c.y + 2)} Z`;
    return (
      <g key={k}>
        <Inked w={IN}>
          <Blob id={`${id}-${k}`} d={d} c={{x: c.x, y: c.y - 14}} r={56} color={LC.shoe} stops={[[0, '#FFFFFF'], [0.6, '#F3F6F8'], [1, '#C9D3DC']]} />
        </Inked>
        <Deco>
          <path d={`M${fmt(c.x - 42)},${fmt(c.y + 4)} C${fmt(c.x - 36)},${fmt(c.y + 16)} ${fmt(c.x + 36)},${fmt(c.y + 16)} ${fmt(c.x + 42)},${fmt(c.y + 4)}`} fill="none" stroke={LC.sole} strokeWidth={7} strokeLinecap="round" />
          <ellipse cx={fmt(c.x - 14)} cy={fmt(c.y - 22)} rx={12} ry={5} fill="#FFFFFF" opacity={0.8} />
        </Deco>
      </g>
    );
  };
  const stripes = [0, 1, 2, 3, 4].map((i) => {
    const y = j.ys + 34 + i * 62;
    return `M${fmt(j.cx - 160)},${fmt(y)} L${fmt(j.cx + 160)},${fmt(y)} L${fmt(j.cx + 160)},${fmt(y + 27)} L${fmt(j.cx - 160)},${fmt(y + 27)} Z`;
  });
  const Arm = (k: string, a: {S: V; E: V; W: V}, ap: ArmPose) => {
    const u = norm(sub(a.E, a.S));
    const sleeveEnd = add(a.S, mul(sub(a.E, a.S), 0.42));
    const foreDir = norm(sub(a.W, a.E));
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}i`} fade={[{c: a.S, r: 40}]}>
          <Limb id={`${id}-${k}lb`} A={add(a.S, mul(u, 10))} B={a.E} C={a.W} rA={36} rB={30} rC={23} color={LC.skin} spec={0.2} crease={IN * 0.8} capC="flat" />
          <Hand id={`${id}-${k}h`} wrist={add(a.W, mul(foreDir, -5))} ang={ap.ang} L={DIM.hand} thumbSide={ap.ts} view={ap.view} pose={ap.hand} color={LC.skin} ink={IN * 0.9} bare />
        </Inked>
        {/* short sleeve: the tee grows over the top of the arm */}
        <Inked w={IN}>
          <Capsule id={`${id}-${k}sl`} a={add(a.S, mul(u, -6))} b={sleeveEnd} ra={44} rb={41} color={LC.shirt} k={0.9} />
        </Inked>
        <Deco>
          <Capsule id={`${id}-${k}st`} a={add(a.S, mul(u, 30))} b={add(a.S, mul(u, 52))} ra={43} rb={42} color={LC.stripe} k={0.5} />
          <InkLine d={`M${P(add(sleeveEnd, mul(perp(u), 40)))} L${P(add(sleeveEnd, mul(perp(u), -40)))}`} w={IN * 0.8} opacity={0.8} />
        </Deco>
      </g>
    );
  };
  return (
    <g>
      {shadows && (
        <g>
          <SoftShadow id={`${id}-fsh`} c={{x: BODY_X, y: GROUND + 6}} rx={150} ry={20} alpha={0.32} color="#3A2A1C" />
          <SoftShadow id={`${id}-fsr`} c={{x: j.legR.A.x + 4, y: GROUND + 2}} rx={56} ry={10} alpha={0.42} color="#3A2A1C" />
          <SoftShadow id={`${id}-fsl`} c={{x: j.legL.A.x + 10, y: GROUND + 2}} rx={56} ry={10} alpha={0.42} color="#3A2A1C" />
        </g>
      )}
      <Inked w={OUT}>
        {Leg('lgr', j.legR)}
        {Leg('lgl', j.legL)}
        {Shoe('shr', j.legR.A, -1)}
        {Shoe('shl', j.legL.A, 1)}
        <Inked w={IN}>
          <Blob id={`${id}-pel`} d={pelD} c={{x: j.cx - 30, y: j.hipY - 20}} r={150} color={LC.pants} />
        </Inked>
        <Deco>
          <InkLine d={`M${fmt(j.cx)},${fmt(j.hipY + 2)} L${fmt(j.cx)},${fmt(j.hipY + 64)}`} w={IN * 0.7} opacity={0.6} />
        </Deco>
        {/* neck */}
        <Inked w={IN}>
          <Capsule id={`${id}-nk`} a={{x: j.head.x, y: j.ys - 70}} b={{x: j.cx, y: j.ys + 4}} ra={30} rb={32} color={shade(LC.skin, 0.1)} />
        </Inked>
        {/* tee */}
        <Inked w={IN}>
          <Blob id={`${id}-tor`} d={torsoD} c={{x: j.cx - 50, y: j.ys + 80}} r={260} color={LC.shirt} k={1.1} stops={[[0, '#FFFFFF'], [0.5, '#F8FAFC'], [0.82, '#DCE3EA'], [1, '#B9C6D3']]} />
        </Inked>
        <Deco>
          <defs>
            <clipPath id={`${id}-tclip`}>
              <path d={torsoD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-tclip)`}>
            {stripes.map((d, i) => (
              <path key={i} d={d} fill={LC.stripe} />
            ))}
            <Lin id={`${id}-tf`} d={torsoD} from={{x: j.cx - 130, y: j.ys}} to={{x: j.cx + 130, y: j.ys + 60}} stops={[[0, '#FFFFFF', 0.35], [0.35, '#FFFFFF', 0], [0.65, '#2E4A66', 0], [1, '#2E4A66', 0.28]]} />
            <ellipse cx={fmt(j.cx - 50)} cy={fmt(j.ys + 70)} rx={46} ry={16} transform={`rotate(-24 ${fmt(j.cx - 50)} ${fmt(j.ys + 70)})`} fill="#FFFFFF" opacity={0.3} />
            {/* the hem's soft fold at the waist */}
            <path d={`M${fmt(j.cx - 70)},${fmt(j.ys + 312)} Q${fmt(j.cx - 30)},${fmt(j.ys + 302)} ${fmt(j.cx + 10)},${fmt(j.ys + 314)}`} fill="none" stroke="#2E4A66" strokeOpacity={0.16} strokeWidth={3.2} strokeLinecap="round" />
          </g>
          {/* neckline */}
          <InkLine d={`M${fmt(j.cx - 40)},${fmt(j.ys - 22)} Q${fmt(j.cx)},${fmt(j.ys + 6)} ${fmt(j.cx + 40)},${fmt(j.ys - 22)}`} w={OUT * 0.7} />
        </Deco>
        <Head id={`${id}-hd`} c={j.head} R={DIM.headR} roll={p.roll} turn={p.turn} expr={p.expr} blink={p.blink} inkW={7} />
        {arms === 'all' && Arm('ar', j.R, p.R)}
        {arms === 'all' && Arm('al', j.L, p.L)}
      </Inked>
    </g>
  );
};

export {mix, lerp};
