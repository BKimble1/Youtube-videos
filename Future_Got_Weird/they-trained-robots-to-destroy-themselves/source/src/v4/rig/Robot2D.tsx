// V4 vector robot rig. One skeleton, separate model art (models.ts), explicit pivots and a fixed near/far draw order.
//   - Torso, pelvis, head and feet blend between authored front and side drawings by `yaw` (0 front … 1 side).
//   - Limb directions come from a small 3D direction model (sagittal swing + abduction, projected by yaw), so a limb
//     foreshortens instead of sliding through the body; every part is opaque.
//   - Facing left mirrors the drawing but never the markings: the symbol and "F.02" are counter-flipped in place.
//   - IK for feet and hands works in the sagittal plane (planted feet, hands on props).
import React from 'react';
import {Mat, P, T, S, R, mul, apply, ms, inv, lerp, mixPts, smooth, smoothOpen, capsule, circle, ellipse, rrect, I} from './geom';
import {ART, PAL, SK, ModelKey, Pal, ViewPts} from './models';
import {PATH_D} from '../../v3/brand/figureSymbol';

export type ArmP = {sh: number; el: number; wr?: number; ab?: number; grip?: number};
export type LegP = {hip: number; kn: number; an: number; ab?: number};
export type Tgt = {x: number; y: number; pitch?: number};
export type RPose = {
  x: number; y: number;          // pelvis centre, world
  rot: number;                   // whole-body lean (deg, + forward)
  waist: number;                 // torso relative to pelvis (deg, + forward)
  neck: number; head: number;    // deg, + = nod forward/down
  armN: ArmP; armF: ArmP; legN: LegP; legF: LegP;
  yaw?: number;                  // 0 front, 0.5 three-quarter, 1 side (facing the `face` direction)
  headYaw?: number;              // head's own yaw (defaults to yaw): turn the visor toward camera
  footN?: Tgt; footF?: Tgt; handN?: Tgt; handF?: Tgt;
};

export const D2R = Math.PI / 180;
const deg = (r: number) => r / D2R;

/** Direction of a limb segment in the screen plane for a sagittal angle `sag` (deg, + forward) and abduction `ab`
 *  (deg, + outward), projected for body yaw. Returns [screen angle (deg, clockwise from straight down), length factor]. */
const limbDir = (sag: number, ab: number, lat: -1 | 1, yaw: number): [number, number] => {
  const th = yaw * 90 * D2R;
  const s = sag * D2R, a = ab * D2R;
  const dl = lat * Math.sin(a), dd = Math.cos(a) * Math.cos(s), df = Math.cos(a) * Math.sin(s);
  // camera axes: forward F = (sin th, 0, cos th); lateral (robot's left) L = (cos th, 0, -sin th)
  const x = dl * Math.cos(th) + df * Math.sin(th);
  const y = dd;
  const len = Math.max(0.18, Math.hypot(x, y));
  return [deg(Math.atan2(-x, y)), len];
};

export type Rig = {
  M: Record<string, Mat>;           // part matrices (world)
  pts: Record<string, P>;           // joint positions (world)
  yaw: number; face: 1 | -1; s: number;
};

const hipPos = (side: 'N' | 'F', yaw: number): P => {
  const v = side === 'N' ? SK.hipN : SK.hipF;
  return [lerp(v[0], v[1], yaw), SK.hipY];
};
const shPos = (side: 'N' | 'F', yaw: number): P => {
  const v = side === 'N' ? SK.shN : SK.shF;
  return [lerp(v[0], v[1], yaw), SK.shY - (side === 'F' ? 4 * yaw : 0)];
};

/** Two-bone IK in the sagittal plane. Returns [upper sagittal angle, flex] (deg). knee = +1 bends the joint forward
 *  (legs: knee ahead, shin swings back), -1 bends it backward (arms: elbow behind, forearm swings forward). */
const ik2 = (vx: number, vy: number, L1: number, L2: number, knee: 1 | -1): [number, number] => {
  const d = Math.min(L1 + L2 - 0.01, Math.max(Math.abs(L1 - L2) + 0.01, Math.hypot(vx, vy)));
  const al = Math.atan2(vx, vy);
  const be = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const flex = Math.PI - Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2))));
  return [deg(al + knee * be), deg(flex)];
};

/** Forward kinematics (with IK targets resolved). */
export const rig = (pose0: RPose, s = 1, face: 1 | -1 = 1): Rig => {
  const pose: RPose = {...pose0, armN: {...pose0.armN}, armF: {...pose0.armF}, legN: {...pose0.legN}, legF: {...pose0.legF}};
  const yaw = pose.yaw ?? 1;
  const root = mul(mul(T(pose.x, pose.y), S(face * s, s)), R(pose.rot));
  const rootInv = inv(root);
  const sinT = Math.max(0.3, Math.sin(yaw * 90 * D2R));
  // ---- IK (sagittal): feet
  for (const sd of ['N', 'F'] as const) {
    const tg = sd === 'N' ? pose.footN : pose.footF;
    if (!tg) continue;
    const q = apply(rootInv, [tg.x, tg.y]);
    const h = hipPos(sd, yaw);
    const [hip, kn] = ik2((q[0] - h[0]) / sinT, q[1] - h[1], SK.TH, SK.SH, 1);
    const leg = sd === 'N' ? pose.legN : pose.legF;
    leg.hip = hip; leg.kn = kn;
    // foot pitch: sole angle relative to the ground (deg, + toes up) → ankle angle relative to the shin.
    // The foot's screen rotation is rot - (hip - kn + an)·yaw (clockwise), which must equal -pitch.
    leg.an = (pose.rot + (tg.pitch ?? 0)) / Math.max(0.3, yaw) - (hip - kn);
  }
  const torso = mul(mul(root, T(0, SK.waist)), R(pose.waist));
  const torsoInv = inv(torso);
  // ---- IK: hands
  for (const sd of ['N', 'F'] as const) {
    const tg = sd === 'N' ? pose.handN : pose.handF;
    if (!tg) continue;
    const q = apply(torsoInv, [tg.x, tg.y]);
    const sp = shPos(sd, yaw);
    const [sh, el] = ik2((q[0] - sp[0]) / sinT, q[1] - sp[1], SK.UA, SK.FA, -1);
    const arm = sd === 'N' ? pose.armN : pose.armF;
    arm.sh = sh; arm.el = el;
  }
  const M: Record<string, Mat> = {};
  const pts: Record<string, P> = {};
  M.pelvis = root;
  M.torso = torso;
  const neckBase: P = [lerp(0, 2, yaw), SK.neckY];
  M.neck = mul(mul(torso, T(neckBase[0], neckBase[1])), R(pose.neck));
  M.head = mul(mul(M.neck, T(0, -SK.neckL)), R(pose.head));
  // ---- arms (torso frame)
  for (const sd of ['N', 'F'] as const) {
    const a = sd === 'N' ? pose.armN : pose.armF;
    const lat: -1 | 1 = sd === 'N' ? -1 : 1;
    const sp = shPos(sd, yaw);
    const [aU, kU] = limbDir(a.sh, a.ab ?? 6, lat, yaw);
    const [aF, kF] = limbDir(a.sh + a.el, a.ab ?? 6, lat, yaw);
    const elb: P = [sp[0] - Math.sin(aU * D2R) * SK.UA * kU, sp[1] + Math.cos(aU * D2R) * SK.UA * kU];
    const wri: P = [elb[0] - Math.sin(aF * D2R) * SK.FA * kF, elb[1] + Math.cos(aF * D2R) * SK.FA * kF];
    M['sh' + sd] = mul(torso, T(sp[0], sp[1]));
    M['ua' + sd] = mul(mul(mul(torso, T(sp[0], sp[1])), R(aU)), S(1, kU));
    M['el' + sd] = mul(torso, T(elb[0], elb[1]));
    M['fa' + sd] = mul(mul(mul(torso, T(elb[0], elb[1])), R(aF)), S(1, kF));
    M['hand' + sd] = mul(mul(mul(torso, T(wri[0], wri[1])), R(aF - (a.wr ?? 0) * yaw)), S(1, Math.max(0.55, kF)));
    pts['sh' + sd] = apply(torso, sp); pts['el' + sd] = apply(torso, elb); pts['wr' + sd] = apply(torso, wri);
    pts['hand' + sd] = apply(M['hand' + sd], [0, 44]);
  }
  // ---- legs (pelvis frame)
  for (const sd of ['N', 'F'] as const) {
    const l = sd === 'N' ? pose.legN : pose.legF;
    const lat: -1 | 1 = sd === 'N' ? -1 : 1;
    const hp = hipPos(sd, yaw);
    const [aT, kT] = limbDir(l.hip, l.ab ?? 2, lat, yaw);
    const [aS, kS] = limbDir(l.hip - l.kn, l.ab ?? 2, lat, yaw);
    const kne: P = [hp[0] - Math.sin(aT * D2R) * SK.TH * kT, hp[1] + Math.cos(aT * D2R) * SK.TH * kT];
    const ank: P = [kne[0] - Math.sin(aS * D2R) * SK.SH * kS, kne[1] + Math.cos(aS * D2R) * SK.SH * kS];
    M['hip' + sd] = mul(root, T(hp[0], hp[1]));
    M['th' + sd] = mul(mul(mul(root, T(hp[0], hp[1])), R(aT)), S(1, kT));
    M['kn' + sd] = mul(root, T(kne[0], kne[1]));
    M['shin' + sd] = mul(mul(mul(root, T(kne[0], kne[1])), R(aS)), S(1, kS));
    M['foot' + sd] = mul(mul(root, T(ank[0], ank[1])), R(-(l.hip - l.kn + l.an) * yaw));
    pts['hip' + sd] = apply(root, hp); pts['knee' + sd] = apply(root, kne); pts['ankle' + sd] = apply(root, ank);
    pts['heel' + sd] = apply(M['foot' + sd], [-18, 31]); pts['toe' + sd] = apply(M['foot' + sd], [lerp(20, 66, yaw), 31]);
  }
  pts.pelvis = apply(root, [0, 0]);
  pts.waist = apply(torso, [0, 0]);
  pts.chest = apply(torso, [lerp(0, 40, yaw), -118]);
  pts.neck = apply(M.neck, [0, 0]);
  pts.head = apply(M.head, [0, -50]);
  pts.visor = apply(M.head, [lerp(0, 33, pose.headYaw ?? yaw), -52]);
  return {M, pts, yaw, face, s};
};

/** Ground the rig: returns the pelvis y that puts the lowest sole on `groundY` for a pose (useful for idle/crouch). */
export const soleY = (r: Rig) => Math.max(...['N', 'F'].map((sd) => Math.max(apply(r.M['foot' + sd], [-10, 31])[1], apply(r.M['foot' + sd], [40, 31])[1])));

// ---------------------------------------------------------------- drawing
const darken = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v * k))).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
};

const vp = (v: ViewPts, yaw: number) => (yaw <= 0 ? v.front : yaw >= 1 ? v.side : mixPts(v.front, v.side, yaw));
const vpo = (v: {front: P[]; side: P[]}, yaw: number) => (v.front.length === v.side.length ? mixPts(v.front, v.side, yaw) : yaw < 0.5 ? v.front : v.side);

export type Hl = Partial<Record<string, {color: string; amount: number}>>;
export type RobotProps = {
  pose: RPose;
  model?: ModelKey;
  s?: number;                      // world units per rig unit
  face?: 1 | -1;
  id: string;                      // unique per instance (gradient ids)
  px?: number;                     // screen px per rig unit (for constant ink width); defaults to s
  inkPx?: number;
  hl?: Hl;                         // part highlights
  marks?: boolean;                 // draw markings (default true for F02/F03)
  after?: Partial<Record<string, (r: Rig) => React.ReactNode>>; // extra drawing after a part (cutaways, props in hand)
  clipBelow?: number;              // world y below which the robot is hidden (molten surface)
  opacity?: number;
};

const SYM_H = 368.64;
/** The Figure symbol (supplied path, unchanged) centred at (cx, cy), height h. `flip` counter-mirrors it. */
const Symbol: React.FC<{m: Mat; cx: number; cy: number; h: number; sx: number; flip: boolean; fill: string}> = ({m, cx, cy, h, sx, flip, fill}) => {
  if (sx < 0.3) return null;
  const k = h / SYM_H;
  const t = mul(mul(mul(m, T(cx, cy)), S((flip ? -1 : 1) * k * sx, k)), T(-256, -256));
  return <path d={PATH_D} transform={ms(t)} fill={fill} />;
};

export const Robot2D: React.FC<RobotProps> = ({pose, model = 'F02', s = 1, face = 1, id, px, inkPx = 4.2, hl = {}, marks, after = {}, clipBelow, opacity = 1}) => {
  const r = rig(pose, s, face);
  const yaw = r.yaw;
  const hy = pose.headYaw ?? yaw;
  const pal: Pal = PAL[model];
  const art = ART[model];
  const lw = inkPx / (px ?? s);
  const flip = face < 0;
  const showMarks = marks ?? (model === 'F02' || model === 'F03');
  const g = (k: string) => `${id}-${k}`;
  const far = (c: string) => darken(c, 0.8);
  const F = {fill: `url(#${g('cel')})`, farFill: `url(#${g('celF')})`};
  const st = {stroke: pal.ink, strokeWidth: lw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const P_ = (key: string, d: string, m: Mat, fill: string, extra: React.SVGProps<SVGPathElement> = {}) => (
    <path key={key} d={d} transform={ms(m)} fill={fill} {...st} {...extra} />
  );
  const glow = (key: string, d: string, m: Mat) => {
    const h = hl[key];
    if (!h || h.amount <= 0.01) return null;
    return <path key={key + '-hl'} d={d} transform={ms(m)} fill={h.color} fillOpacity={0.55 * h.amount} stroke={h.color} strokeOpacity={h.amount} strokeWidth={lw * 2.4} strokeLinejoin="round" />;
  };
  const els: React.ReactNode[] = [];
  const push = (...n: React.ReactNode[]) => els.push(...n);
  const isF03 = model === 'F03';
  const isPerf = model === 'PERF';

  // ---------- limbs
  const arm = (sd: 'N' | 'F') => {
    const farS = sd === 'F' && yaw >= 0.25;
    const fill = farS ? F.farFill : F.fill;
    const ua = art.ua as number[], fa = art.fa as number[];
    const a = sd === 'N' ? pose.armN : pose.armF;
    const out: React.ReactNode[] = [];
    const uaD = capsule(SK.UA, ua[0], ua[1]);
    out.push(P_('ua' + sd, uaD, r.M['ua' + sd], fill), glow('ua' + sd, uaD, r.M['ua' + sd]));
    const faD = capsule(SK.FA, fa[0], fa[1]);
    out.push(P_('fa' + sd, faD, r.M['fa' + sd], fill), glow('fa' + sd, faD, r.M['fa' + sd]));
    // elbow joint
    if (isF03) out.push(P_('elb' + sd, rrect(0, 0, fa[0] + 3, 9, 4), mul(r.M['fa' + sd], T(0, 2)), pal.band!));
    else out.push(P_('elb' + sd, circle(0, 0, (art as typeof ART.F02).elbowR), r.M['el' + sd], farS ? far(pal.joint) : pal.joint), <path key={'elbh' + sd} d={circle(0, 0, (art as typeof ART.F02).elbowR * 0.45)} transform={ms(r.M['el' + sd])} fill={pal.jointHi} />);
    // hand: palm + finger block (curls with grip) + thumb
    const grip = a.grip ?? 0.25;
    const hm = r.M['hand' + sd];
    const handFill = isF03 ? (farS ? far(pal.base) : pal.base) : isPerf ? '#E2B48F' : farS ? far(pal.joint) : pal.joint;
    out.push(P_('wrist' + sd, rrect(0, 2, fa[1] + 2, 8, 3), hm, isF03 ? pal.band! : farS ? far(pal.shade) : pal.shade));
    out.push(P_('palm' + sd, smooth([[-12, 4], [12, 4], [15, 20], [13, 38], [-13, 38], [-15, 20]], 1, [0, 1]), hm, handFill));
    const fm = mul(mul(hm, T(0, 36)), R(-grip * 85));
    out.push(P_('fing' + sd, smooth([[-12, 0], [12, 0], [11, 18], [7, 27], [-7, 27], [-11, 18]]), fm, handFill));
    out.push(<path key={'fsep' + sd} d="M-4 3 L-4 22 M4 3 L4 22" transform={ms(fm)} fill="none" stroke={pal.ink} strokeWidth={lw * 0.55} strokeLinecap="round" />);
    const tm = mul(mul(hm, T(11, 16)), R(-30 - grip * 30));
    out.push(P_('thumb' + sd, capsule(20, 10, 8), tm, handFill));
    // shoulder cap on top of the upper arm
    if (isF03) out.push(P_('shb' + sd, rrect(0, 6, ua[0] + 2, 9, 4), r.M['ua' + sd], pal.band!));
    else {
      const R_ = (art as typeof ART.F02).shoulderR;
      out.push(P_('shc' + sd, circle(0, 0, R_), r.M['sh' + sd], farS ? far(pal.base) : pal.base));
      out.push(<path key={'shr' + sd} d={circle(0, 0, R_ * 0.55)} transform={ms(r.M['sh' + sd])} fill="none" stroke={farS ? far(pal.hi) : pal.hi} strokeWidth={lw * 0.8} />);
    }
    if (after['arm' + sd]) out.push(<g key={'aft-arm' + sd}>{after['arm' + sd]!(r)}</g>);
    return out;
  };
  const leg = (sd: 'N' | 'F') => {
    const farS = sd === 'F' && yaw >= 0.25;
    const fill = farS ? F.farFill : F.fill;
    const th = art.th as number[], sh = art.sh as number[];
    const out: React.ReactNode[] = [];
    const thD = capsule(SK.TH, th[0], th[1]);
    out.push(P_('th' + sd, thD, r.M['th' + sd], fill), glow('th' + sd, thD, r.M['th' + sd]));
    const shD = capsule(SK.SH, sh[0], sh[1]);
    out.push(P_('shin' + sd, shD, r.M['shin' + sd], fill), glow('shin' + sd, shD, r.M['shin' + sd]));
    if (!isF03 && !isPerf) {
      // shin plate (front)
      out.push(<path key={'sp' + sd} d={smooth([[3, 18], [12, 24], [10, 96], [4, 112], [1, 60]])} transform={ms(r.M['shin' + sd])} fill={farS ? far(pal.hi) : pal.hi} fillOpacity={0.55} />);
    }
    // foot
    const fp = vp(art.foot, yaw);
    const fd = smooth(fp, 1, [6]);
    out.push(P_('foot' + sd, fd, r.M['foot' + sd], isF03 ? (farS ? far(pal.base) : pal.base) : farS ? far(pal.shade) : pal.shade), glow('foot' + sd, fd, r.M['foot' + sd]));
    out.push(<path key={'sole' + sd} d={`M${lerp(-14, -20, yaw)} 26 L${lerp(14, 64, yaw)} 26`} transform={ms(r.M['foot' + sd])} stroke={isF03 ? pal.band : pal.joint} strokeWidth={lw * 1.6} strokeLinecap="round" />);
    // joints: knee + ankle
    if (isF03) {
      out.push(P_('knb' + sd, rrect(0, 2, sh[0] + 4, 10, 4), r.M['shin' + sd], pal.band!));
      out.push(P_('anb' + sd, rrect(0, SK.SH - 6, sh[1] + 3, 9, 4), r.M['shin' + sd], pal.band!));
    } else {
      const kr = (art as typeof ART.F02).kneeR;
      out.push(P_('kn' + sd, circle(0, 0, kr), r.M['kn' + sd], farS ? far(pal.joint) : pal.joint), glow('knee' + sd, circle(0, 0, kr), r.M['kn' + sd]));
      out.push(<path key={'knh' + sd} d={circle(0, 0, kr * 0.45)} transform={ms(r.M['kn' + sd])} fill={pal.jointHi} />);
      out.push(P_('an' + sd, circle(0, 0, 10), mul(r.M['foot' + sd], T(0, -2)), farS ? far(pal.joint) : pal.joint), glow('ankle' + sd, circle(0, 0, 10), mul(r.M['foot' + sd], T(0, -2))));
    }
    if (after['leg' + sd]) out.push(<g key={'aft-leg' + sd}>{after['leg' + sd]!(r)}</g>);
    return out;
  };

  // ---------- body
  const torsoParts = () => {
    const out: React.ReactNode[] = [];
    const tp = vp(art.torso, yaw);
    const tD = smooth(tp);
    out.push(P_('torso', tD, r.M.torso, F.fill), glow('torso', tD, r.M.torso));
    if (!isF03 && !isPerf) {
      const a2 = ART.F02;
      out.push(P_('abd', smooth(vp(a2.abdomen, yaw)), r.M.torso, pal.joint));
      // rib lines across the exposed waist
      const ab = vp(a2.abdomen, yaw);
      const xs = (y: number) => {
        const left = Math.min(...ab.map((p) => p[0])), right = Math.max(...ab.map((p) => p[0]));
        return [left + 4, right - 4, y];
      };
      for (const y of [-60, -46, -32, -18]) {
        const [x0, x1] = xs(y);
        out.push(<path key={'rib' + y} d={`M${x0} ${y} L${x1} ${y}`} transform={ms(r.M.torso)} stroke={pal.jointHi} strokeWidth={lw * 0.7} strokeLinecap="round" />);
      }
      out.push(P_('plate', smooth(vp(a2.chestPlate, yaw)), r.M.torso, pal.hi, {fillOpacity: 0.35, strokeWidth: lw * 0.6}));
      // centre seam on the plate
      const seamX = lerp(0, 22, yaw);
      out.push(<path key="pseam" d={`M${seamX} ${-149} Q${seamX + lerp(0, 4, yaw)} ${-112} ${seamX} ${-76}`} transform={ms(r.M.torso)} fill="none" stroke={pal.ink} strokeWidth={lw * 0.5} strokeOpacity={0.6 * (1 - Math.abs(yaw - 0.5) * 0.8)} />);
      if (showMarks && model === 'F02') {
        const sx = Math.cos(yaw * 80 * D2R);
        const cx = lerp(0, 36, yaw);
        out.push(<Symbol key="csym" m={r.M.torso} cx={cx} cy={-124} h={24} sx={sx} flip={flip} fill={pal.mark} />);
        if (sx > 0.35) {
          const tm = mul(mul(r.M.torso, T(cx, -97)), S((flip ? -1 : 1) * sx, 1));
          out.push(<text key="ctxt" transform={ms(tm)} textAnchor="middle" fontFamily='"Fredoka Variable", "Nunito Variable", sans-serif' fontWeight={600} fontSize={15} fill={pal.mark} letterSpacing={0.5}>F.02</text>);
        }
      }
    } else if (isF03) {
      const a3 = ART.F03;
      out.push(<path key="yoke" d={smoothOpen(vpo(a3.yoke, yaw))} transform={ms(r.M.torso)} fill="none" stroke={pal.shade} strokeWidth={lw * 0.9} strokeLinecap="round" />);
      out.push(<path key="sseam" d={smoothOpen(vpo(a3.sideSeam, yaw))} transform={ms(r.M.torso)} fill="none" stroke={pal.shade} strokeWidth={lw * 0.9} strokeLinecap="round" />);
      // waist break (dark band)
      out.push(P_('wband', rrect(lerp(0, 4, yaw), -10, lerp(98, 60, yaw), 13, 6), r.M.torso, pal.band!));
      if (showMarks) {
        const sx = Math.cos(yaw * 80 * D2R);
        out.push(<Symbol key="csym" m={r.M.torso} cx={lerp(0, 40, yaw)} cy={-104} h={26} sx={sx} flip={flip} fill={pal.mark} />);
      }
    } else if (isPerf) {
      for (const [x, y] of [[lerp(-30, -6, yaw), -120], [lerp(30, 30, yaw), -120], [lerp(0, 34, yaw), -80]] as P[]) out.push(<path key={'md' + x + y} d={circle(x, y, 5)} transform={ms(r.M.torso)} fill={pal.dots} />);
    }
    if (model === 'SIM') {
      out.push(<path key="simline" d={`M${lerp(-56, -28, yaw)} -112 L${lerp(56, 42, yaw)} -112 M${lerp(-44, -24, yaw)} -70 L${lerp(44, 28, yaw)} -70`} transform={ms(r.M.torso)} stroke={pal.ink} strokeOpacity={0.35} strokeWidth={lw * 0.6} />);
    }
    if (after.torso) out.push(<g key="aft-torso">{after.torso(r)}</g>);
    return out;
  };
  const pelvisParts = () => {
    const out: React.ReactNode[] = [];
    const pd = smooth(vp(art.pelvis, yaw));
    out.push(P_('pelvis', pd, r.M.pelvis, isF03 ? F.fill : isPerf ? F.fill : F.fill), glow('pelvis', pd, r.M.pelvis));
    if (!isF03 && !isPerf) {
      // the broad exposed hip assembly: a dark centre block; the actuator discs are drawn with each leg
      out.push(P_('crotch', rrect(0, 6, lerp(36, 22, yaw), 34, 8), r.M.pelvis, pal.joint));
      if (yaw < 0.25) out.push(...hipDisc('N'), ...hipDisc('F'));
    } else if (isF03) {
      out.push(P_('pband', rrect(lerp(0, 2, yaw), -33, lerp(100, 62, yaw), 11, 5), r.M.pelvis, pal.band!));
    }
    return out;
  };
  const hipDisc = (sd: 'N' | 'F'): React.ReactNode[] => {
    if (isF03 || isPerf) return [];
    const farS = sd === 'F' && yaw >= 0.25;
    const hp = hipPos(sd, yaw);
    const rr = ART.F02.hipR * (sd === 'N' ? lerp(1, 1.3, yaw) : lerp(1, 0.9, yaw));
    const m = mul(r.M.pelvis, T(hp[0] + (sd === 'N' ? -9 : 9) * (1 - yaw), hp[1] - 9));
    const jc = farS ? far(pal.joint) : pal.joint;
    return [
      P_('hipd' + sd, circle(0, 0, rr), m, jc), glow('hip' + sd, circle(0, 0, rr), m),
      <path key={'hipr' + sd} d={circle(0, 0, rr * 0.58)} transform={ms(m)} fill="none" stroke={pal.jointHi} strokeWidth={lw * 0.8} />,
      <path key={'hipc' + sd} d={circle(0, 0, rr * 0.22)} transform={ms(m)} fill={pal.jointHi} />,
    ];
  };
  const headParts = () => {
    const out: React.ReactNode[] = [];
    // neck (compact, mechanical)
    const nk = isF03 ? pal.band! : pal.joint;
    out.push(P_('neck', rrect(0, -12, isF03 ? 26 : 24, 28, 6), r.M.neck, nk));
    if (!isF03) for (const y of [-18, -8]) out.push(<path key={'nr' + y} d={`M-10 ${y} L10 ${y}`} transform={ms(r.M.neck)} stroke={pal.jointHi} strokeWidth={lw * 0.6} />);
    if (isPerf) {
      const hd = ellipse(lerp(0, 8, hy), -50, 34, 44);
      out.push(P_('head', hd, r.M.head, pal.face));
      out.push(P_('cap', smooth([[-34, -56], [-30, -86], [0, -96], [30, -86], [36, -56], [0, -66]]), r.M.head, pal.base));
      out.push(<path key="eye" d={circle(lerp(10, 26, hy), -48, 3.5)} transform={ms(r.M.head)} fill={pal.ink} />);
      return out;
    }
    const hp = vp(art.head, hy);
    const hd = smooth(hp);
    out.push(P_('head', hd, r.M.head, F.fill), glow('head', hd, r.M.head));
    if (!isF03) {
      const a2 = ART.F02;
      out.push(P_('vrim', smooth(vp(a2.visorRim, hy)), r.M.head, pal.faceRim, {strokeWidth: lw * 0.8}));
      out.push(<path key="hseam" d={smoothOpen(vpo(a2.headSeam, hy))} transform={ms(r.M.head)} fill="none" stroke={pal.ink} strokeWidth={lw * 0.6} strokeOpacity={0.55} />);
    }
    const vd = smooth(vp(art.visor, hy));
    out.push(P_('visor', vd, r.M.head, pal.face));
    // glint: a soft reflection band (moves with the head's turn, not painted on)
    const gx = lerp(isF03 ? -14 : -8, isF03 ? 32 : 31, hy);
    out.push(<path key="glint" d={smooth([[gx - 4, -76], [gx + 4, -78], [gx + 2, -44], [gx - 5, -40]])} transform={ms(r.M.head)} fill={pal.faceGlint} fillOpacity={0.9} />);
    out.push(<path key="glint2" d={circle(gx + (isF03 ? 16 : 10) * (1 - hy), -72, isF03 ? 3.2 : 2.4)} transform={ms(r.M.head)} fill="#FFFFFF" fillOpacity={0.55} />);
    if (showMarks && model === 'F02') {
      const sx = Math.cos(hy * 80 * D2R);
      out.push(<Symbol key="vsym" m={r.M.head} cx={lerp(0, 34, hy)} cy={-70} h={13} sx={sx} flip={flip} fill={pal.mark} />);
    }
    if (model === 'SIM') out.push(<path key="simdot" d={circle(lerp(0, 33, hy), -52, 4)} transform={ms(r.M.head)} fill={pal.dots} />);
    return out;
  };

  const dots = () => {
    if (!pal.dots || model === 'F03') return null;
    const ks = ['shN', 'elN', 'wrN', 'kneeN', 'ankleN', 'hipN'];
    return <g key="jdots">{ks.map((k) => <circle key={k} cx={r.pts[k][0]} cy={r.pts[k][1]} r={6.5 * s} fill={pal.dots} stroke={pal.ink} strokeWidth={lw * s * 0.5} />)}</g>;
  };

  // ---------- order: far limbs → torso → pelvis → near leg → head → near arm (front view: legs, body, arms)
  if (yaw >= 0.25) {
    push(...arm('F'), ...leg('F'), ...hipDisc('F'), ...torsoParts(), ...pelvisParts(), ...leg('N'), ...hipDisc('N'), ...headParts(), ...arm('N'));
  } else {
    push(...leg('F'), ...leg('N'), ...pelvisParts(), ...torsoParts(), ...headParts(), ...arm('F'), ...arm('N'));
  }
  const cid = g('clip');
  const celX = flip ? ['1', '0'] : ['0', '1'];
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={g('cel')} x1={celX[0]} y1="0" x2={celX[1]} y2="0.25">
          <stop offset="0" stopColor={pal.base} /><stop offset="0.6" stopColor={pal.base} /><stop offset="0.6" stopColor={pal.shade} /><stop offset="1" stopColor={pal.shade} />
        </linearGradient>
        <linearGradient id={g('celF')} x1={celX[0]} y1="0" x2={celX[1]} y2="0.25">
          <stop offset="0" stopColor={far(pal.base)} /><stop offset="0.6" stopColor={far(pal.base)} /><stop offset="0.6" stopColor={far(pal.shade)} /><stop offset="1" stopColor={far(pal.shade)} />
        </linearGradient>
        {clipBelow !== undefined ? <clipPath id={cid}><rect x={-1e5} y={-1e5} width={2e5} height={1e5 + clipBelow} /></clipPath> : null}
      </defs>
      <g clipPath={clipBelow !== undefined ? `url(#${cid})` : undefined}>
        {els}
        {model === 'SIM' || model === 'PERF' ? dots() : null}
      </g>
    </g>
  );
};
export {I};
