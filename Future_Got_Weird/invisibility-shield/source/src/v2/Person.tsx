// V2 characters. Each is ONE 3D skeleton in the corridor's metric space (pelvis, spine, shoulders, two-bone IK arms
// and legs, feet planted on the floor), drawn from whatever camera the shot uses: joints are projected with the shot's
// perspective, limbs are the Death Clock rig's continuous ink-contoured limbs between projected joints (so foreshortening
// is automatic), the torso is the hull of projected cross-section rings (wide from the front, narrow from the side), and
// the head is Head3 (features on its own tangent planes). Parts are painted far-to-near by camera depth, so the same
// model reads from the front, side, three-quarter and back, and from above in the plan view.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../lib/ink';
import {Limb} from '../lib/limb';
import {Capsule, SoftShadow} from '../lib/shade';
import {Hand, HandPose} from '../art/Hand';
import {clamp, lerp} from '../lib/math';
import {a3, Basis, c3, circle3, d3, fmt, fwdOf, hull, l3, m3, n3, P2, proj, projPoly, rotY, s3, smoothClosed, V3, v3} from './p3';
import {Head3, HeadExpr, HeadStyle} from './Head3';

export type Dims = {
  hip: number; hipCrouch: number; torso: number; neck: number; headUp: number; headR: number;
  shW: number; hipW: number; upper: number; fore: number; hand: number; thigh: number; shin: number; foot: number;
  rings: {hipA: number; hipB: number; waistA: number; waistB: number; chestA: number; chestB: number; shA: number; shB: number};
  limb: {up: [number, number, number]; leg: [number, number, number]};
};
export const DIM_W: Dims = {
  hip: 0.8, hipCrouch: 0.34, torso: 0.44, neck: 0.035, headUp: 0.165, headR: 0.14, shW: 0.165, hipW: 0.09,
  upper: 0.27, fore: 0.24, hand: 0.17, thigh: 0.37, shin: 0.37, foot: 0.2,
  rings: {hipA: 0.16, hipB: 0.11, waistA: 0.125, waistB: 0.09, chestA: 0.16, chestB: 0.11, shA: 0.185, shB: 0.1},
  limb: {up: [0.048, 0.04, 0.032], leg: [0.072, 0.054, 0.04]},
};
export const DIM_G: Dims = {
  hip: 0.9, hipCrouch: 0.48, torso: 0.5, neck: 0.04, headUp: 0.18, headR: 0.15, shW: 0.2, hipW: 0.105,
  upper: 0.3, fore: 0.27, hand: 0.19, thigh: 0.42, shin: 0.42, foot: 0.25,
  rings: {hipA: 0.185, hipB: 0.135, waistA: 0.185, waistB: 0.145, chestA: 0.205, chestB: 0.145, shA: 0.225, shB: 0.12},
  limb: {up: [0.058, 0.048, 0.038], leg: [0.082, 0.064, 0.048]},
};
export type Look = {style: HeadStyle; dims: Dims; top: string; topDeep: string; under: string; pants: string; shoe: string; sole: string; skin: string; trim: string};
export const LOOK_W: Look = {style: 'woman', dims: DIM_W, top: '#1E8FA8', topDeep: '#13667A', under: '#F07C5A', pants: '#23263A', shoe: '#E9E4DA', sole: '#7C7468', skin: '#E9B894', trim: '#9FE3EE'};
export const LOOK_G: Look = {style: 'guard', dims: DIM_G, top: '#3E5578', topDeep: '#2A3C59', under: '#2A3C59', pants: '#1B2233', shoe: '#15161B', sole: '#3A3B42', skin: '#C68E66', trim: '#E8B84A'};

export type ArmCtl = {W?: V3; pole?: V3; hand: HandPose; dir?: V3; palm?: V3; swing?: number};
export type Pose = {
  pos: V3; // ground point under the pelvis
  yaw: number; // body facing (0 = +z)
  crouch: number; // 0 standing .. 1 deep crouch
  lean: number; // extra forward pitch of the spine (rad)
  side: number; // lateral lean (rad, + toward the body's right)
  twist: number; // shoulder yaw relative to the hips (rad)
  bob: number; // pelvis vertical offset (m)
  headYaw: number; headPitch: number; headRoll: number; // relative to the chest
  walk: number; walkAmt: number; // gait phase (rad) and amount
  feet?: {l: V3; r: V3}; // planted feet (world); default stance otherwise
  R: ArmCtl; L: ArmCtl;
  expr: HeadExpr; blink: number; sway: number;
  flashlight?: boolean; // the guard's torch in his right hand
};

// --- 3D two-bone IK: root A, target T, bone lengths, pole hint; returns the middle joint and the clamped end
export const ik3 = (A: V3, T: V3, l1: number, l2: number, pole: V3) => {
  const d0 = s3(T, A);
  const dist = Math.min(l3(d0), (l1 + l2) * 0.999);
  const dir = n3(d0);
  const E = a3(A, m3(dir, dist));
  const a = (l1 * l1 + dist * dist - l2 * l2) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // pole direction orthogonal to dir
  let p = s3(pole, m3(dir, d3(pole, dir)));
  if (l3(p) < 1e-6) p = c3(dir, v3(0, 1, 0));
  p = n3(p);
  return {M: a3(a3(A, m3(dir, a)), m3(p, h)), E};
};

export const joints = (pz: Pose, D: Dims) => {
  const F = fwdOf(pz.yaw);
  const Rv = v3(Math.cos(pz.yaw), 0, -Math.sin(pz.yaw)); // body's right
  const U = v3(0, 1, 0);
  const cr = clamp(pz.crouch);
  const hy = lerp(D.hip, D.hipCrouch, cr) + pz.bob;
  const P = a3(a3(pz.pos, m3(U, hy)), m3(F, -0.17 * cr));
  const l = pz.lean + cr * 0.62;
  let spine = n3(a3(m3(U, Math.cos(l)), m3(F, Math.sin(l))));
  spine = n3(a3(spine, m3(Rv, Math.sin(pz.side))));
  const S = a3(P, m3(spine, D.torso));
  const Rs = rotY(Rv, pz.twist);
  const Fs = rotY(F, pz.twist);
  const N = a3(S, m3(spine, D.neck));
  // head frame: chest frame rotated by head yaw / pitch / roll
  let hF = rotY(Fs, pz.headYaw), hR = rotY(Rs, pz.headYaw);
  // pitch about hR (positive looks down), using the spine lean too
  const pitch = pz.headPitch + l * 0.55;
  let hU = n3(c3(hF, hR)); // up
  const rot = (v: V3, axis: V3, ang: number) => a3(a3(m3(v, Math.cos(ang)), m3(c3(axis, v), Math.sin(ang))), m3(axis, d3(axis, v) * (1 - Math.cos(ang))));
  hF = rot(hF, hR, pitch);
  hU = rot(hU, hR, pitch);
  const rollAx = hF;
  hR = rot(hR, rollAx, pz.headRoll);
  hU = rot(hU, rollAx, pz.headRoll);
  const Hc = a3(a3(N, m3(spine, D.headUp * 0.6)), m3(hU, D.headUp * 0.4));
  const sh = {r: a3(a3(S, m3(Rs, D.shW)), m3(spine, -0.03)), l: a3(a3(S, m3(Rs, -D.shW)), m3(spine, -0.03))};
  const hip = {r: a3(P, m3(Rv, D.hipW)), l: a3(P, m3(Rv, -D.hipW))};
  // feet
  const stance = (s: 1 | -1) => {
    if (pz.feet) return s > 0 ? pz.feet.r : pz.feet.l;
    const ph = pz.walk + (s > 0 ? 0 : Math.PI);
    const st = pz.walkAmt * 0.28 * Math.sin(ph);
    const lift = pz.walkAmt * 0.07 * Math.max(0, Math.cos(ph));
    return a3(a3(a3(pz.pos, m3(Rv, s * (D.hipW + 0.03 + cr * 0.03))), m3(F, st + cr * 0.12)), v3(0, 0.065 + lift, 0));
  };
  const ank = {r: stance(1), l: stance(-1)};
  const kneePole = (s: 1 | -1) => a3(F, m3(Rv, s * (0.12 + cr * 0.18)));
  const kr = ik3(hip.r, ank.r, D.thigh, D.shin, kneePole(1));
  const kl = ik3(hip.l, ank.l, D.thigh, D.shin, kneePole(-1));
  const toe = (A: V3) => a3(a3(A, m3(F, D.foot * 0.78)), v3(0, -0.06, 0));
  // arms
  const arm = (s: 1 | -1, c: ArmCtl) => {
    const Sh = s > 0 ? sh.r : sh.l;
    let W: V3;
    if (c.W) W = c.W;
    else {
      const sw = (c.swing ?? 0) + pz.walkAmt * 0.28 * Math.sin(pz.walk + (s > 0 ? Math.PI : 0));
      W = a3(a3(a3(Sh, m3(spine, -(D.upper + D.fore) * 0.93)), m3(F, sw * 0.5 + 0.06)), m3(Rs, s * 0.06));
    }
    const pole = c.pole ?? a3(a3(m3(U, -0.6), m3(F, -0.7)), m3(Rs, s * 0.6));
    const {M, E} = ik3(Sh, W, D.upper, D.fore, pole);
    const fd = n3(s3(E, M));
    const hd = c.dir ?? fd;
    return {S: Sh, E: M, W: E, dir: hd, palm: c.palm ?? n3(c3(hd, m3(Rs, s))), hand: c.hand};
  };
  return {F, Rv, U, P, S, N, Hc, hF, hR, hU, spine, Rs, Fs, sh, hip, ank, knee: {r: kr.M, l: kl.M}, toe: {r: toe(kr.E), l: toe(kl.E)}, ankE: {r: kr.E, l: kl.E}, R: arm(1, pz.R), L: arm(-1, pz.L)};
};
export type Joints = ReturnType<typeof joints>;

const ring = (c: V3, ax: V3, az: V3, a: number, bb: number, n = 18): V3[] => circle3(c, ax, az, a, n, bb);

export const Person: React.FC<{id: string; b: Basis; pz: Pose; look: Look; shadow?: boolean; light?: number}> = ({id, b, pz, look, shadow = true, light = 0}) => {
  const D = look.dims;
  const j = joints(pz, D);
  const pr = (p: V3) => proj(b, p);
  const depthOf = (...ps: V3[]) => ps.reduce((s, p) => s + pr(p).d, 0) / ps.length;
  // behind the camera or too close: skip
  if (pr(j.P).d < 0.15) return null;
  const kP = pr(j.P).k;
  const OUT = Math.max(1.2, 0.012 * kP), IN = OUT * 0.75;
  const camDir = b.fwd;
  const facing = -d3(j.Fs, camDir); // > 0: chest faces the camera
  // ---- torso and pelvis silhouettes
  const R_ = D.rings;
  const P = j.P, sp = j.spine;
  const lat = (k: number) => n3(a3(m3(j.Rv, 1 - k), m3(j.Rs, k)));
  const dep = (k: number) => n3(c3(lat(k), sp));
  const ringPts = (k: number, a: number, bb: number, off = 0) => ring(a3(P, m3(sp, D.torso * k + off)), lat(k), dep(k), a, bb).map(pr);
  const jacketUp = smoothClosed(hull([...ringPts(0.66, R_.chestA, R_.chestB), ...ringPts(0.97, R_.shA, R_.shB)]), 0.14);
  const jacketLo = smoothClosed(hull([...ringPts(0.08, R_.hipA * 1.02, R_.hipB * 1.02), ...ringPts(0.42, R_.waistA, R_.waistB), ...ringPts(0.68, R_.chestA, R_.chestB)]), 0.14);
  const pelvis = smoothClosed(hull([...ringPts(-0.02, R_.hipA, R_.hipB), ...ringPts(0.2, R_.waistA, R_.waistB)]), 0.12);
  const torsoDepth = depthOf(P, j.S);
  // ---- limbs
  const r3 = (p: V3) => pr(p);
  const limbPx = (p: V3, r: number) => r * pr(p).k;
  const Leg = (k: 'r' | 'l') => {
    const H = r3(j.hip[k]), K = r3(j.knee[k]), A = r3(j.ankE[k]);
    const T = r3(j.toe[k]);
    const [ra, rb, rc] = D.limb.leg;
    // shoe: a rounded wedge from the heel to the toe
    const heel = a3(j.ankE[k], v3(0, -0.06, 0));
    const hp = r3(a3(heel, m3(j.F, -0.05)));
    const sw = 0.05 * pr(j.ankE[k]).k;
    return {
      depth: depthOf(j.hip[k], j.knee[k], j.ankE[k]),
      node: (
        <g key={`leg${k}`}>
          <Inked w={IN}>
            <Limb id={`${id}-lg${k}`} A={H} B={K} C={A} rA={limbPx(j.hip[k], ra)} rB={limbPx(j.knee[k], rb)} rC={limbPx(j.ankE[k], rc)} color={look.pants} spec={0.08} capA="flat" crease={IN * 0.8} />
          </Inked>
          <Inked w={IN}>
            <Capsule id={`${id}-sh${k}`} a={hp} b={T} ra={sw * 1.05} rb={sw * 0.95} color={look.shoe} k={0.8} />
          </Inked>
          <Deco>
            <path d={`M${fmt(hp.x)},${fmt(hp.y + sw * 0.8)} L${fmt(T.x)},${fmt(T.y + sw * 0.75)}`} stroke={look.sole} strokeWidth={Math.max(1, sw * 0.35)} strokeLinecap="round" />
          </Deco>
        </g>
      ),
    };
  };
  const Arm = (k: 'R' | 'L') => {
    const a = j[k];
    const S2 = r3(a.S), E2 = r3(a.E), W2 = r3(a.W);
    const [ra, rb, rc] = D.limb.up;
    // hand in screen space: direction of the projected hand axis; palm toward the camera or away
    const tip = r3(a3(a.W, m3(a.dir, 0.1)));
    let ang = (Math.atan2(tip.y - W2.y, tip.x - W2.x) * 180) / Math.PI;
    const projLen = Math.hypot(tip.x - W2.x, tip.y - W2.y) / 0.1;
    const Lpx = Math.max(0.55, Math.min(1, projLen / pr(a.W).k)) * D.hand * pr(a.W).k;
    const palmVis = -d3(a.palm, camDir) > 0;
    // thumb side: thumb points along palm x dir (for the right hand: toward the body's front-left when palm faces in)
    const side = k === 'R' ? 1 : -1;
    const thumbW = n3(c3(a.palm, a.dir));
    const th2 = r3(a3(a.W, m3(thumbW, side * 0.05)));
    const cr = (tip.x - W2.x) * (th2.y - W2.y) - (tip.y - W2.y) * (th2.x - W2.x);
    const ts = (cr > 0 ? 1 : -1) as 1 | -1;
    const sleeveC = look.top;
    const cuff = a3(a.W, m3(n3(s3(a.E, a.W)), 0.035));
    const isGuard = look.style === 'guard';
    const torch = isGuard && pz.flashlight && k === 'R';
    const tA = r3(a3(a.W, m3(a.dir, 0.06))), tB = r3(a3(a.W, m3(a.dir, 0.29)));
    return {
      depth: depthOf(a.E, a.W),
      node: (
        <g key={`arm${k}`}>
          <Inked w={IN} id={`${id}-ai${k}`} fade={[{c: S2, r: limbPx(a.S, ra) * 1.1}]}>
            <Limb id={`${id}-ar${k}`} A={S2} B={E2} C={r3(cuff)} rA={limbPx(a.S, ra * 1.15)} rB={limbPx(a.E, rb * 1.12)} rC={limbPx(a.W, rc * 1.15)} color={sleeveC} spec={0.15} crease={IN * 0.8} capC="flat" />
          </Inked>
          {torch && (
            <Inked w={IN}>
              <Capsule id={`${id}-tc`} a={tA} b={tB} ra={0.022 * pr(a.W).k} rb={0.03 * pr(a.W).k} color="#24272E" k={1.2} spec={0.3} />
            </Inked>
          )}
          <Inked w={IN}>
            <Hand id={`${id}-h${k}`} wrist={W2} ang={ang} L={Lpx} thumbSide={ts} view={palmVis ? 'palm' : 'back'} pose={a.hand} color={look.skin} ink={IN * 0.9} />
          </Inked>
          {/* cuff band */}
          <Deco>
            <path d={`M${fmt(r3(cuff).x)},${fmt(r3(cuff).y)} L${fmt(W2.x)},${fmt(W2.y)}`} stroke={isGuard ? look.topDeep : look.trim} strokeWidth={Math.max(1, limbPx(a.W, rc) * 1.6)} strokeLinecap="butt" opacity={0.0} />
          </Deco>
        </g>
      ),
    };
  };
  // ---- torso details: undershirt V and zip (woman), badge, belt, epaulettes (guard)
  const front = (k: number, off: number, latOff: number) => a3(a3(a3(P, m3(sp, D.torso * k)), m3(dep(k), off)), m3(lat(k), latOff)); // dep(k) = lat x spine points forward
  const details = (() => {
    const vis = facing;
    const out: React.ReactNode[] = [];
    const Fb = (k: number, latOff: number) => pr(front(k, R_.chestB * (k > 0.6 ? 1.0 : 0.95), latOff));
    if (look.style === 'woman') {
      if (vis > 0.05) {
        const v1 = Fb(1.0, -0.06), v2 = Fb(1.0, 0.06), v3_ = Fb(0.74, 0);
        out.push(<path key="v" d={`M${fmt(v1.x)},${fmt(v1.y)} L${fmt(v3_.x)},${fmt(v3_.y)} L${fmt(v2.x)},${fmt(v2.y)} Z`} fill={look.under} stroke={INK} strokeWidth={IN * 0.7} strokeLinejoin="round" opacity={clamp(vis * 5)} />);
        const z1 = Fb(0.74, 0.005), z2 = Fb(0.16, 0.005);
        out.push(<path key="z" d={`M${fmt(z1.x)},${fmt(z1.y)} L${fmt(z2.x)},${fmt(z2.y)}`} stroke={look.topDeep} strokeWidth={IN * 0.9} opacity={clamp(vis * 5)} />);
        // jacket hem trim
        const h1 = Fb(0.13, -R_.waistA), h2 = Fb(0.13, R_.waistA);
        void h1; void h2;
      } else if (vis < -0.1) {
        const s1 = pr(front(0.95, -R_.shB, 0)), s2 = pr(front(0.2, -R_.waistB, 0));
        out.push(<path key="seam" d={`M${fmt(s1.x)},${fmt(s1.y)} L${fmt(s2.x)},${fmt(s2.y)}`} stroke={look.topDeep} strokeWidth={IN * 0.6} opacity={0.6} />);
      }
      // collar: a band around the neck base
      const col = ring(a3(j.S, m3(sp, 0.035)), j.Rs, n3(c3(j.Rs, sp)), 0.075, 0.06, 14).map(pr);
      out.push(<path key="col" d={smoothClosed(hull(col), 0.15)} fill={look.topDeep} stroke={INK} strokeWidth={IN * 0.7} />);
    } else {
      // belt: the front half of the waist ring
      const belt = ring(a3(P, m3(sp, D.torso * 0.12)), lat(0.12), dep(0.12), R_.waistA * 1.14, R_.waistB * 1.12, 24).map((p, i, arr) => ({p, n: i}));
      void belt;
      if (vis > 0.05) {
        const bd = Fb(0.78, -0.1);
        const s = 0.03 * pr(j.S).k;
        out.push(<path key="badge" d={`M${fmt(bd.x)},${fmt(bd.y - s)} L${fmt(bd.x + s * 0.8)},${fmt(bd.y - s * 0.3)} L${fmt(bd.x + s * 0.55)},${fmt(bd.y + s * 0.8)} L${fmt(bd.x - s * 0.55)},${fmt(bd.y + s * 0.8)} L${fmt(bd.x - s * 0.8)},${fmt(bd.y - s * 0.3)} Z`} fill={look.trim} stroke={INK} strokeWidth={IN * 0.6} />);
        const z1 = Fb(0.95, 0), z2 = Fb(0.16, 0);
        out.push(<path key="pl" d={`M${fmt(z1.x)},${fmt(z1.y)} L${fmt(z2.x)},${fmt(z2.y)}`} stroke={look.topDeep} strokeWidth={IN * 0.6} opacity={0.7} />);
        // radio on the chest (right)
        const rd = Fb(0.8, 0.1);
        out.push(<rect key="radio" x={fmt(rd.x - s * 0.5)} y={fmt(rd.y - s * 0.9)} width={fmt(s)} height={fmt(s * 1.6)} rx={fmt(s * 0.2)} fill="#16181E" stroke={INK} strokeWidth={IN * 0.5} />);
      }
      // belt band: full ring outline (front visible part dominates)
      const bl = ring(a3(P, m3(sp, D.torso * 0.1)), lat(0.1), dep(0.1), R_.waistA * 1.13, R_.waistB * 1.13, 24).map(pr);
      const bh = ring(a3(P, m3(sp, D.torso * 0.16)), lat(0.16), dep(0.16), R_.waistA * 1.13, R_.waistB * 1.13, 24).map(pr);
      out.push(<path key="belt" d={smoothClosed(hull([...bl, ...bh]), 0.1)} fill="#121418" stroke={INK} strokeWidth={IN * 0.6} opacity={0.95} />);
      if (vis > 0.05) {
        const bk = Fb(0.13, 0);
        const s = 0.022 * pr(j.P).k;
        out.push(<rect key="buckle" x={fmt(bk.x - s)} y={fmt(bk.y - s * 0.7)} width={fmt(s * 2)} height={fmt(s * 1.4)} fill="#B9BCC4" stroke={INK} strokeWidth={IN * 0.4} />);
      }
    }
    return out;
  })();
  // ---- head
  const hp = pr(j.Hc);
  const head = <Head3 key="head" id={`${id}-hd`} b={b} c={{x: hp.x, y: hp.y}} R={D.headR * hp.k * 1.0} F={j.hF} Rt={j.hR} U={j.hU} style={look.style} e={pz.expr} blink={pz.blink} sway={pz.sway} inkW={OUT * 0.8} />;
  // neck
  const nA = pr(a3(j.S, m3(sp, -0.02))), nB = pr(a3(j.N, m3(sp, 0.05)));
  const neck = (
    <Inked w={IN} key="neck">
      <Capsule id={`${id}-nk`} a={nA} b={nB} ra={0.05 * pr(j.N).k} rb={0.045 * pr(j.N).k} color={shade(look.skin, 0.12)} />
    </Inked>
  );
  const core = (
    <g key="core">
      <Inked w={IN}>
        <InkPath d={pelvis} fill={look.pants} />
      </Inked>
      {neck}
      <Inked w={IN}>
        <InkPath d={jacketLo} fill={`url(#${id}-jk)`} />
        <InkPath d={jacketUp} fill={`url(#${id}-jk)`} />
      </Inked>
      <Deco>{details}</Deco>
    </g>
  );
  const parts = [Leg('r'), Leg('l'), Arm('R'), Arm('L')];
  const behind = parts.filter((p) => p.depth > torsoDepth).sort((x, y) => y.depth - x.depth);
  const before = parts.filter((p) => p.depth <= torsoDepth).sort((x, y) => y.depth - x.depth);
  const jc = pr(j.S);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-jk`} gradientUnits="userSpaceOnUse" cx={fmt(jc.x - 0.12 * jc.k)} cy={fmt(jc.y)} r={fmt(0.6 * jc.k)}>
          <stop offset="0" stopColor={lit(look.top, 0.22 + light * 0.3)} />
          <stop offset="0.6" stopColor={look.top} />
          <stop offset="1" stopColor={look.topDeep} />
        </radialGradient>
      </defs>
      {shadow && (() => {
        const g = pr(v3(pz.pos.x, 0.005, pz.pos.z));
        const pts = projPoly(b, circle3(v3(pz.pos.x, 0.004, pz.pos.z), v3(1, 0, 0), v3(0, 0, 1), 0.34, 20, 0.26));
        if (g.d < 0.2 || pts.length < 3) return null;
        return <path d={`M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L')}Z`} fill="#000" opacity={0.32} style={{filter: 'blur(2px)'}} />;
      })()}
      <Inked w={OUT}>
        {behind.map((p) => p.node)}
        {core}
      </Inked>
      {head}
      {before.length > 0 && <Inked w={OUT}>{before.map((p) => p.node)}</Inked>}
    </g>
  );
};

export {mix, SoftShadow, InkLine};
export type {P2, HandPose};
