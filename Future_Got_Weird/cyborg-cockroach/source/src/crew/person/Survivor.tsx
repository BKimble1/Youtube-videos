// <Survivor>: the Weird Crew "person" trapped prone in rubble, propped on her forearms, head raised, facing screen-right.
// The skeleton, face and screen layout come from ./survivorRig.ts. The drawing is Crew4's own construction (./Crew.tsx,
// copied unchanged): the leg, pelvis, torso (flat trapezoid + one cel-shade tone), neck and stroke-limb code below is
// Crew4's body code re-fed with the prone skeleton (only the parts the PERSON look uses: no coat, belt, pouch or badge);
// the head is Crew4's Head4 itself (hair, face cap, eyes, brows, nose, mouth untouched) and the hands are its HandArt,
// laid flat on the floor through an affine map. Line weight is the rig's inkW(scale).
//
// Draw order, fixed for a figure lying face-down and seen from her near (right) side:
//   behind -> legs, pelvis -> far (left) arm -> torso (+ shirt dust) -> between -> neck -> near (right) arm -> head
//   (+ face dust) -> front.
// With cutX (the screen x of a slab's leading edge lying across her) the order becomes
//   behind -> legs, pelvis, torso -> between (the slab) -> far arm -> the torso again, clipped to x > cutX -> neck ->
//   near arm -> head -> front,
// so a slab drawn in `between` covers her hips and lower back but never her far arm, chest, near arm or head. The
// slab's edge is a vertical screen line: in this orthographic card view that is a slab face seen edge-on (a plane
// containing the view direction), so "in front of the slab" is exactly "x > cutX". The slab must not reach right of
// cutX where it overlaps her torso (the redrawn torso would cut it with a straight line).
// The legs, pelvis and torso can also be clipped (bodyClip / hideLeftOf); arms and head are never clipped.
import React from 'react';
import {BODY_P, Body4, INK, Look4, PERSON} from './cast';
import {HandArt, Head4} from './Crew';
import {add3, cardPt, inkW, mul3, pathOf, V3} from './geo';
import {FlatHand, handMap, SurvivorOpts, survivorRig} from './survivorRig';

const RAD = Math.PI / 180;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const f1 = (n: number) => n.toFixed(1);
const DUST = '#B3A58F'; // dry plaster dust: a light warm grey that reads on the blue shirt and on skin
const DUST_SKIN = '#B9A994';

export type SurvivorProps = SurvivorOpts & {
  /** unique per instance (SVG clip ids) */
  id: string;
  /** screen px of the anchor: the floor point midway between her elbow contacts */
  x: number;
  y: number;
  /** px per rig unit (u); 1 u = 3.75 mm. Medium shot (head + shoulders + forearms = 45-60 % of 1080 px) ~2.7-3.6,
   *  close-up (face + near hand ~70 %) ~4.5 */
  scale: number;
  look?: Look4;
  b?: Body4;
  /** render slots: behind everything / after the torso (before neck, near arm, head; with cutX also before the far arm
   *  and the redrawn front of the torso) / over everything */
  behind?: React.ReactNode;
  between?: React.ReactNode;
  front?: React.ReactNode;
  /** SVG path (screen px): legs, pelvis and torso are drawn only inside it */
  bodyClip?: string;
  /** screen x: legs, pelvis and torso are not drawn left of it (a hard cut; put the slab edge on it) */
  hideLeftOf?: number;
  /** skip the legs entirely (they are under the slab) */
  hideLegs?: boolean;
  /** skip the far (left) arm: tucked under her chest, it only peeks out as a stray knob beside the near hand */
  hideFarArm?: boolean;
  /** screen x of a slab's leading edge lying across her (see draw order); survivorLayout(...).cutAt(z).x gives it for a
   *  body position z (use z <= -40: behind the shoulders, so both arms stay in front of the slab) */
  cutX?: number;
};

export const Survivor: React.FC<SurvivorProps> = (props) => {
  const look = props.look ?? PERSON, b = props.b ?? BODY_P, id = props.id;
  const R = survivorRig(props, {x: props.x, y: props.y, scale: props.scale}, b);
  const {cd, j} = R;
  const k = cd.k, ol = inkW(k);
  const P = (p: V3) => cardPt(cd, p);
  const cp = Math.cos(cd.phi * RAD), sp = Math.sin(cd.phi * RAD);
  const dirScr = (v: V3) => ({x: v.x * cp + v.z * sp, y: -v.y, d: -v.x * sp + v.z * cp});
  const ink = {stroke: INK, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  const dust = clamp(props.dust ?? 0);

  // ---- legs (Crew4 leg(), with the prone foot direction: toes down into the floor)
  const leg = (side: number) => {
    const H = side > 0 ? j.HL : j.HR, K = side > 0 ? j.KL : j.KR, A = side > 0 ? j.AL : j.AR;
    const ph = P(H), pk = P(K), pa = P(A);
    const fs = dirScr(side > 0 ? R.toeL : R.toeR);
    const fl = Math.hypot(fs.x, fs.y);
    const sx = fs.x / (fl || 1), sy = fs.y / (fl || 1);
    const sideness = clamp(Math.abs(fs.x) * 1.6);
    const ang = ((Math.atan2(sy * Math.sign(sx || 1), Math.abs(sx)) * 180) / Math.PI) * sideness;
    const shoe = {x: pa.x + fs.x * 13 * k, y: pa.y + (fs.y * 13 + 3) * k};
    const pts = `${f1(ph.x)},${f1(ph.y)} ${f1(pk.x)},${f1(pk.y)} ${f1(pa.x)},${f1(pa.y)}`;
    return {
      d: (ph.d + pk.d + pa.d) / 3,
      node: (
        <g key={`leg${side}`}>
          <polyline points={pts} {...ink} strokeWidth={b.legW * k + ol * 2} />
          <polyline points={pts} fill="none" stroke={look.pants} strokeWidth={b.legW * k} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={shoe.x} cy={shoe.y} rx={(26 + 6 * sideness) * k} ry={13 * k} fill={look.shoes} stroke={INK} strokeWidth={ol} transform={`rotate(${f1(ang)} ${f1(shoe.x)} ${f1(shoe.y)})`} />
        </g>
      ),
    };
  };

  // ---- a hand lying flat on the floor (the cheated top view, see handMap in ./survivorRig.ts)
  const flatHand = (h: FlatHand) => {
    const m = handMap(h, cd);
    return (
      <g transform={m.matrix}>
        <HandArt shape={h.shape} side={h.thumb} skin={look.glove ?? look.skin} ol={ol / (k * m.gm)} splay={h.splay} curl={h.curl} />
      </g>
    );
  };

  // ---- arms (Crew4 arm(): ink underlay, sleeve on the upper arm, skin forearm), hand flat at the wrist
  const arm = (side: number) => {
    const S = side > 0 ? j.SL : j.SR, E = side > 0 ? j.EL : j.ER, W = side > 0 ? j.WL : j.WR;
    const ps = P(S), pe = P(E), pw = P(W);
    const fore = `${f1(pe.x)},${f1(pe.y)} ${f1(pw.x)},${f1(pw.y)}`;
    // dust: a smudge on the near forearm
    const sm = side < 0 && dust > 0 ? (() => {
      const m = {x: pe.x + (pw.x - pe.x) * 0.45, y: pe.y + (pw.y - pe.y) * 0.45};
      const a = (Math.atan2(pw.y - pe.y, pw.x - pe.x) * 180) / Math.PI;
      return <ellipse cx={m.x} cy={m.y - 3 * k} rx={16 * k} ry={5.5 * k} fill={DUST_SKIN} opacity={0.38 * dust} transform={`rotate(${f1(a)} ${f1(m.x)} ${f1(m.y)})`} />;
    })() : null;
    return (
      <g key={`arm${side}`}>
        <polyline points={`${f1(ps.x)},${f1(ps.y)} ${fore}`} {...ink} strokeWidth={b.armW * k + ol * 2} />
        <polyline points={`${f1(ps.x)},${f1(ps.y)} ${f1(pe.x)},${f1(pe.y)}`} fill="none" stroke={look.sleeve} strokeWidth={b.armW * k} strokeLinecap="round" />
        <polyline points={fore} fill="none" stroke={look.longSleeve ? look.sleeve : look.skin} strokeWidth={b.armW * k} strokeLinecap="round" />
        {sm}
        {flatHand(side > 0 ? R.handL : R.handR)}
      </g>
    );
  };

  // ---- torso (Crew4 torso: a flat trapezoid along the projected spine; frame from survivorRig)
  const {T, alen: L, wS, wW, pW} = R.torso;
  const wH = wW, n = R.torso.n;
  const torsoPts = [T(24 * k, -wS), T(2 * k, -wS - 4 * k), T(0, -wS + 26 * k), T(0, wS - 26 * k), T(2 * k, wS + 4 * k), T(24 * k, wS), T(L, wH), T(L + 12 * k, 0), T(L, -wH)];
  const q = (p: {x: number; y: number}) => `${f1(p.x)} ${f1(p.y)}`;
  const torsoD = `M ${q(torsoPts[0])} Q ${q(torsoPts[1])} ${q(torsoPts[2])} L ${q(torsoPts[3])} Q ${q(torsoPts[4])} ${q(torsoPts[5])} L ${q(torsoPts[6])} Q ${q(torsoPts[7])} ${q(torsoPts[8])} Z`;
  // the cel-shade tone goes on the floor (belly) side, since her chest faces the floor, not Crew4's away-from-key side
  const shadeW = 0.34;
  const shadePts = [T(-4 * k, wS * (1 - shadeW * 2)), T(-4 * k, wS + 10 * k), T(L + 14 * k, wH + 10 * k), T(L + 14 * k, wH * (1 - shadeW * 2))];
  const pelvisC = P(add3(j.P, mul3(j.u, 2)));
  const legs = props.hideLegs ? [] : [leg(1), leg(-1)].sort((a, c) => a.d - c.d);
  const neckA = P(add3(j.S, mul3(j.u, 4))), neckB = P(add3(j.Hc, mul3(j.hy, -30)));
  const rotN = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  // shirt dust: a few soft smudges and specks, placed in torso coordinates (fraction along the spine, fraction across)
  const shirtDust = dust > 0 ? (
    <g>
      {([[0.28, 0.35, 15, 5.5], [0.55, -0.25, 18, 6], [0.75, 0.5, 11, 4.5], [0.42, -0.62, 9, 4]] as const).map(([a, c, rx, ry], i) => {
        const p = T(L * a, c * wS);
        return <ellipse key={i} cx={p.x} cy={p.y} rx={rx * k} ry={ry * k} fill={DUST} opacity={0.24 * dust} transform={`rotate(${f1(rotN + 90 + i * 17)} ${f1(p.x)} ${f1(p.y)})`} />;
      })}
      {([[0.2, 0.1], [0.34, 0.58], [0.5, 0.12], [0.63, -0.5], [0.83, 0.2], [0.66, 0.34]] as const).map(([a, c], i) => {
        const p = T(L * a, c * wS);
        return <circle key={`s${i}`} cx={p.x} cy={p.y} r={(1.8 + (i % 3) * 0.7) * k} fill={DUST} opacity={0.45 * dust} />;
      })}
    </g>
  ) : null;

  // ---- face dust: two soft streaks and a speck on the near cheek, placed on Head4's own sphere mapping
  const hm = R.hm;
  const faceDust = dust > 0 ? (() => {
    const marks = ([[-40, -18, 11, 3.6, -14], [-30, -27, 6, 2.2, -8], [-50, -8, 1.8, 1.8, 0]] as const)
      .map(([az, el, rx, ry, rot]) => ({p: hm.at(az, el), rx, ry, rot}))
      .filter((m) => m.p.d > 0.15);
    return (
      <g transform={`translate(${f1(hm.c.x)} ${f1(hm.c.y)}) scale(${k.toFixed(4)})`}>
        <defs><clipPath id={`${id}-dc`}><path d={pathOf(hm.outline)} /></clipPath></defs>
        <g clipPath={`url(#${id}-dc)`}>
          {marks.map((m, i) => <ellipse key={i} cx={m.p.lx} cy={m.p.ly} rx={m.rx} ry={m.ry} fill={DUST_SKIN} opacity={0.42 * dust * clamp((m.p.d - 0.15) / 0.2)} transform={`rotate(${f1(hm.headRot + m.rot)} ${f1(m.p.lx)} ${f1(m.p.ly)})`} />)}
        </g>
      </g>
    );
  })() : null;

  // ---- the torso node (drawn once, or twice around a slab with cutX)
  const torso = (
    <g>
      <path d={torsoD} fill={look.shirt} />
      <g clipPath={`url(#${id}-torso)`}>
        <path d={pathOf(shadePts)} fill={look.shirtShade} />
        {shirtDust}
      </g>
      <path d={torsoD} fill="none" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
    </g>
  );
  // cutX: the part of the torso in front of the slab's edge-on leading face
  const cutClip = props.cutX !== undefined ? `M ${f1(props.cutX)} -100000 L 100000 -100000 L 100000 100000 L ${f1(props.cutX)} 100000 Z` : null;

  // ---- body clip (legs, pelvis, torso only)
  const clipD = props.bodyClip ?? (props.hideLeftOf !== undefined ? `M ${f1(props.hideLeftOf)} -100000 L 100000 -100000 L 100000 100000 L ${f1(props.hideLeftOf)} 100000 Z` : null);
  const bodyClip = clipD ? `url(#${id}-bc)` : undefined;

  return (
    <g>
      {clipD && <defs><clipPath id={`${id}-bc`}><path d={clipD} /></clipPath></defs>}
      {props.behind}
      <g clipPath={bodyClip}>
        {legs.map((l) => l.node)}
        <ellipse cx={pelvisC.x} cy={pelvisC.y} rx={pW} ry={28 * k} fill={look.pants} stroke={INK} strokeWidth={ol} transform={`rotate(${f1(rotN)} ${f1(pelvisC.x)} ${f1(pelvisC.y)})`} />
      </g>
      <defs><clipPath id={`${id}-torso`}><path d={torsoD} /></clipPath></defs>
      {cutClip && <defs><clipPath id={`${id}-cut`}><path d={cutClip} /></clipPath></defs>}
      {!cutClip && !props.hideFarArm && arm(1)}
      <g clipPath={bodyClip}>{torso}</g>
      {props.between}
      {cutClip && !props.hideFarArm && arm(1)}
      {cutClip && <g clipPath={`url(#${id}-cut)`}><g clipPath={bodyClip}>{torso}</g></g>}
      {/* neck */}
      <line x1={neckA.x} y1={neckA.y} x2={neckB.x} y2={neckB.y} stroke={INK} strokeWidth={32 * k + ol * 2} strokeLinecap="butt" />
      <line x1={neckA.x} y1={neckA.y} x2={neckB.x} y2={neckB.y} stroke={look.skinShade} strokeWidth={32 * k} strokeLinecap="butt" />
      {arm(-1)}
      <Head4 id={`${id}-h`} look={look} b={b} j={j} cd={cd} face={R.face} ol={ol} t={props.t ?? 0} />
      {faceDust}
      {props.front}
    </g>
  );
};

/** The survivor's screen layout (px) for the same props, without drawing: head, eyes, chin, mouth, elbows, wrists,
 *  near palm and fingertips, shoulders, pelvis/waist (for the slab edge), knees, feet, a floor spot for the insect,
 *  ground(x, z) to project any floor point and point(x, y, z) any point, both given in her card-local u, and
 *  cutAt(z): {x, back, belly, floor} for a slab edge crossing her body at card-local z (pass x as cutX). */
export const survivorLayout = (props: SurvivorOpts & {x: number; y: number; scale: number; b?: Body4}) => {
  const R = survivorRig(props, {x: props.x, y: props.y, scale: props.scale}, props.b ?? BODY_P);
  return {...R.layout, ground: R.ground, point: R.point, cutAt: R.cutAt, face: R.face, upperErr: R.upperErr};
};
