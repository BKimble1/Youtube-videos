// V5 beat H1 (28.94-30.78): the comparison, one split frame (cameras End5_cam.ts).
//   left   the ordinary rod (G's house, G's end camera): on "But these scientists" a stepped leader comes down out of
//          the storm (visible from ~29.25 as the views draw back), all the way to the rod; a short streamer leaps from the
//          metal tip and meets it just above the tip (29.5): the only place this rod reaches. Its glow fades by ~29.82,
//          leaving the plain tip under the rain, and the panel steps back a little (dimmed ~16%) under EXTENDED.
//   right  the tower's rod tip at the same height and size, the same storm and horizon: the warm channel extends from
//          the tip along the cyan line (the shimmer, 29.19-30.6), and from 29.95 the guided leader runs up it, high
//          into the sky, leaving the line above the guided section and branching toward the deck.
//   Both views draw back together about their tips (29.06-29.72); the divider slides in from the right edge at the
//   start (28.94-29.33), pushing G's frame into the left half.
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {BOLT3, Cam3, projector, v3, V3} from '../v2/p3';
import {House} from '../v3/Rod3_house';
import {RodRain} from '../v3/Rod3_sky';
import {Clouds, LOOP, Ranges, SkyGrad} from '../v3/Scene3_sky';
import {Beam3D, Tower3D} from '../v3/Scene3';
import {BOLT3V} from '../v3/bolt3';
import {facadeScale, hw, ROD_TOP} from '../v3/Rod3_cam';
import {St, TipCorona3} from '../v3/view3';
import {endPulses} from '../v3/Open3_end';
import {ChannelGrow4} from '../v4/End4_fx';
import {PAL} from '../v3/palette';
import {B, EV, tau3} from '../v3/timeline3';
import {DOLLY_R, dividerX, houseSplitCam, PAY_TOP, towerSplitCam} from './End5_cam';
import {tortuous, withU} from './Rod5_bolt';
import {drift5} from './Rod5';

const INK = '#0B151C';
type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');

// ------------------------------------------------------------------ left: the leader coming down to the house rod
/** timing: the front leaves the top of the path at LL0 and meets the tip's streamer at LJ (V5 review END-1: on "But these
 *  scientists", while the views draw back, so the ordinary strike is over before EXTENDED, 29.92, and the right panel's
 *  extension and guided leader are the only action under that word) */
export const LL0 = 29.0, LJ = 29.5;
/** px per metre on the facade plane at the drawn-back framing (houseSplitCam dollied back to 10.2 x DOLLY_R m) */
const PXM_REF = 2750 / (10.2 * DOLLY_R);
/** the path on the facade plane (house-local metres), from well above the panel's top down to the junction */
const JUNC = {x: 0.03, y: ROD_TOP.y + 0.6};
const LEFT_PATH = (() => {
  // drawn in reference px (tip-relative: x right, y down), then turned into metres
  const top = {x: 140, y: -1420}, end = {x: JUNC.x * PXM_REF, y: -(JUNC.y - ROD_TOP.y) * PXM_REF};
  const pts = tortuous(top, end, 9101, 22, 80, 32, 70);
  return withU(pts).map(({p, u}) => ({x: p.x / PXM_REF, y: ROD_TOP.y - p.y / PXM_REF, u}));
})();
const LEFT_BR = [
  {at: 0.16, side: 1, px: 170, ang: 42},
  {at: 0.3, side: -1, px: 150, ang: 40},
  {at: 0.52, side: 1, px: 120, ang: 46},
  {at: 0.7, side: -1, px: 80, ang: 36},
].map((b, bi) => {
  const k = LEFT_PATH.findIndex((q) => q.u >= b.at);
  const r = LEFT_PATH[k];
  const rp = {x: r.x * PXM_REF, y: -(r.y - ROD_TOP.y) * PXM_REF};
  const a = (b.side * b.ang * Math.PI) / 180;
  const pts = tortuous(rp, {x: rp.x + Math.sin(a) * b.px, y: rp.y + Math.cos(a) * b.px}, 9201 + bi * 13, 12, 36, 28, 24);
  return {at: r.u, pts: withU(pts).map(({p, u}) => ({x: p.x / PXM_REF, y: ROD_TOP.y - p.y / PXM_REF, u}))};
});
const STREAM = [{x: 0, y: ROD_TOP.y, u: 0}, {x: 0.06, y: ROD_TOP.y + 0.3, u: 0.5}, {x: JUNC.x, y: JUNC.y, u: 1}];
type UP = {x: number; y: number; u: number};
const partial = (pts: UP[], k: number): UP[] => {
  if (k <= 0) return [];
  const out: UP[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].u <= k) out.push(pts[i]);
    else {
      if (i > 0) {
        const a = pts[i - 1], b = pts[i], w = (k - a.u) / (b.u - a.u || 1);
        out.push({x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, u: k});
      }
      break;
    }
  }
  return out;
};
const Layers: React.FC<{d: string; w: number; a: number; core: number}> = ({d, w, a, core}) => (
  <g opacity={clamp(a)} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={PAL.halo} strokeOpacity={0.2 + 0.1 * core} strokeWidth={fmt(w * 6.5)} />
    <path d={d} stroke={PAL.mid} strokeOpacity={0.55 + 0.2 * core} strokeWidth={fmt(w * 2.4)} />
    <path d={d} stroke={PAL.core} strokeOpacity={clamp(0.75 + 0.25 * core)} strokeWidth={fmt(w)} />
  </g>
);
/** the left leader's light after the junction (a modest brightening, then the channel fades) */
const leftHold = (t: number) => (t < LJ ? 0 : (0.5 + 0.9 * Math.exp(-(t - LJ) / 0.1)) * (1 - ss(t, LJ + 0.1, LJ + 0.34)));
/** the left panel steps back a little once its strike is over (one focus at a time: the extension on the right) */
const LEFT_DIM = (t: number) => 0.16 * ss(t, LJ + 0.3, LJ + 0.55);
const LeftLeader: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  if (t < LL0) return null;
  const joined = t >= LJ;
  const hold = leftHold(t);
  if (joined && hold <= 0.01) return null;
  const P = projector(cam);
  const q = (pts: UP[]) => pts.map((p) => P(hw(p.x, p.y, -0.05))).filter((p) => p.ok);
  const uf = clamp((t - LL0) / (LJ - LL0));
  const main = q(joined ? [...LEFT_PATH, ...STREAM.slice().reverse().slice(1)] : partial(LEFT_PATH, uf));
  if (main.length < 2) return null;
  const front = main[main.length - 1];
  const stK = joined ? 1 : clamp((t - (LJ - 0.1)) / 0.1);
  const streamer = !joined && stK > 0 ? q(partial(STREAM, stK)) : [];
  const brs = LEFT_BR.map((b) => (joined || uf > b.at ? q(partial(b.pts, joined ? 1 : clamp(((uf - b.at) / (1 - b.at)) * 2.2))) : [])).filter((p) => p.length > 1);
  const core = joined ? clamp(hold, 0, 1.4) : 0.5;
  const step = 0.6 + 0.4 * noise1(t * 90, 9301);
  const sc = cam.f / 2750; // the line weight follows the zoom a little
  const w = (joined ? 2.6 + 1.4 * clamp(hold - 0.5) : 1.9) * (0.75 + 0.5 * sc);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={12} />
        </filter>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.5} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g filter={`url(#${id}-bl)`} opacity={joined ? 0.45 * clamp(hold) : 0.25}>
        <path d={line(main)} fill="none" stroke="#8C96FF" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {brs.map((b, i) => <Layers key={i} d={line(b)} w={w * 0.55} a={joined ? clamp(hold) * 0.8 : 0.8} core={0.4} />)}
      <Layers d={line(main)} w={w} a={joined ? clamp(hold * 2.2) : 1} core={core} />
      {streamer.length > 1 && <Layers d={line(streamer)} w={w * 0.7} a={0.9} core={0.5} />}
      {!joined && <circle cx={fmt(front.x)} cy={fmt(front.y)} r={fmt(26 + 10 * step)} fill={`url(#${id}-tip)`} opacity={0.9} />}
      {joined && hold > 0.6 && <circle cx={fmt(front.x)} cy={fmt(front.y)} r={fmt(40 * clamp(hold))} fill={`url(#${id}-tip)`} opacity={clamp(hold - 0.4)} />}
    </g>
  );
};

/** the shared backdrop: the storm sky, cloud deck and ridges through the house camera, across the whole frame (the two
 *  views keep one horizon line, so it is the same storm and the same horizon on both sides of the divider) */
const Backdrop: React.FC<{t: number; id: string; fl: number}> = ({t, id, fl}) => {
  const cam = houseSplitCam(t);
  const P = projector(cam);
  return (
    <g>
      <SkyGrad cam={cam} flash={fl} id={`${id}-sky`} />
      <Clouds cam={cam} P={P} flash={fl} s={0} drift={drift5(t)} id={`${id}-cl`} />
      <Ranges cam={cam} P={P} flash={fl} />
    </g>
  );
};
/** the house half: G's rain and house through the split camera, and the leader coming down to it */
const HouseHalf: React.FC<{t: number; id: string}> = ({t, id}) => {
  const cam = houseSplitCam(t);
  const P = projector(cam);
  const hk = leftHold(t);
  const fl = 0.25 * clamp(hk);
  const sc = facadeScale(cam);
  const tip = P(hw(0, ROD_TOP.y));
  // rain held back round the tip's point, as on G's last frame (sized with the view)
  const quiet = {x: tip.x, y: tip.y, r: 90 * clamp(sc / facadeScale(houseSplitCam(B.H)), 0.4, 1)};
  return (
    <g>
      <RodRain cam={cam} rainT={t + 40} front={false} flash={fl} quiet={quiet} />
      <House cam={cam} light={{flash: 0.6 * fl, glare: 0, catch: 0.35 * clamp(hk), tip: clamp(0.8 * hk)}} id={`${id}h`} />
      <LeftLeader cam={cam} t={t} id={`${id}-ll`} />
      <RodRain cam={cam} rainT={t + 40} front flash={fl} quiet={quiet} k={Math.max(0.5, clamp(1.2 - sc / 260))} />
    </g>
  );
};

// ------------------------------------------------------------------ right: the tower, the channel, the guided leader
/** the channel's top (site px along the axis): from the tip over the shimmer, on past the top of the panel toward the
 *  cloud base (the payoff, End5_wide PAY_TOP, shows it reaching the deck) */
export const chTop5 = (t: number) => -6 + (PAY_TOP + 6) * ss(t, EV.channelExtends, 30.7);
/** the guided leader: incepts at the tip (RI), runs the guided section by RG, then on toward the deck (no connection) */
export const RI = 30.0, RG = 30.45;
const rightS = (t: number) => {
  if (t < RI) return -1;
  const g = BOLT3.guidedS;
  if (t <= RG) {
    const x = (t - RI) / (RG - RI);
    return Math.max(0.3, g * (0.35 * x + 0.65 * x * x));
  }
  const v0 = (g * 1.65) / (RG - RI);
  return g + v0 * (t - RG);
};
const towerSt = (t: number): St => {
  const top = chTop5(t);
  const s = rightS(t);
  return {
    s, core: s > 0 ? 0.9 : 0, flash: s > 0 ? 0.12 * clamp(s / 16) : 0, beam: 0.9, pulses: endPulses(t), channel: 0.9 * ss(top, 60, 200), channelTop: top,
    tipCorona: s > 0 ? clamp(1 - (s - 2) / 10) : ss(t, 29.5, RI) * (0.45 + 0.55 * Math.abs(Math.sin(t * 27))),
  };
};
/** the guided leader in the split's tower view, drawn in the film's discharge layers at the split's line weight (V3's
 *  Discharge3D sizes its strokes for the far views): the leader climbing BOLT3V, its newest part brightest, its tip a
 *  small glow; past the guided section its branches fork off and stall */
type P3s = V3 & {s: number};
const partial3 = (pts: P3s[], s: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].s <= s) out.push(pts[i]);
    else {
      if (i > 0) {
        const a = pts[i - 1], b = pts[i], w = (s - a.s) / (b.s - a.s || 1);
        out.push(v3(a.x + (b.x - a.x) * w, a.y + (b.y - a.y) * w, a.z + (b.z - a.z) * w));
      }
      break;
    }
  }
  return out;
};
export const GuidedLeader5: React.FC<{cam: Cam3; s: number; t: number; id: string; tipGlow?: boolean; gain?: number}> = ({cam, s, t, id, tipGlow = true, gain = 1}) => {
  if (s <= 0.2) return null;
  const P = projector(cam);
  const main = partial3(BOLT3V.pts, s).map(P).filter((p) => p.ok);
  if (main.length < 2) return null;
  const tip = main[main.length - 1];
  const brs = BOLT3V.branches
    .map((b) => ({b, l: Math.min(b.len, (s - b.s0) * 0.7)}))
    .filter((x) => x.l > 0)
    .map((x) => partial3(x.b.pts, x.l).map(P).filter((p) => p.ok))
    .filter((p) => p.length > 1);
  const step = 0.65 + 0.35 * noise1(t * 80, 9401);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={11} />
        </filter>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.5} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g filter={`url(#${id}-bl)`} opacity={fmt(clamp(0.4 * gain))}>
        <path d={line(main)} fill="none" stroke="#8C96FF" strokeWidth={fmt(22 * Math.sqrt(gain))} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {brs.map((b, i) => <Layers key={i} d={line(b)} w={1.2 * (0.7 + 0.3 * gain)} a={0.85} core={0.4 * gain} />)}
      <Layers d={line(main)} w={2.3 * (0.75 + 0.25 * gain)} a={1} core={0.8 * gain} />
      {tipGlow && <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(30 + 10 * step)} fill={`url(#${id}-tip)`} opacity={0.9} />}
    </g>
  );
};
/** rain round the tower camera (V3's 3D rain cells, as Rod3_sky RodRain, all drops; held back over the caption band) */
const PanelRain: React.FC<{cam: Cam3; rainT: number}> = ({cam, rainT}) => {
  const P = projector(cam);
  const RC = 9;
  const dFar = 78 * Math.sqrt(cam.f / 1360);
  const izMax = Math.ceil(dFar / RC) + 1;
  const drops = new Map<number, string[]>();
  const op = [0.22, 0.14, 0.07];
  const cxi = Math.floor(cam.pos.x / RC), cyi = Math.floor(cam.pos.y / RC), czi = Math.floor(cam.pos.z / RC);
  const fwd = {x: Math.sin((cam.yaw * Math.PI) / 180), z: Math.cos((cam.yaw * Math.PI) / 180)};
  for (let ix = -6; ix <= 6; ix++) for (let iy = -3; iy <= 4; iy++) for (let iz = -6; iz <= 6; iz++) {
    // only cells in front of the camera, out to the reach
    const ax = ix * RC, az = iz * RC;
    const ahead = ax * fwd.x + az * fwd.z;
    if (ahead < -RC || ahead > izMax * RC) continue;
    const gx = cxi + ix, gy = cyi + iy, gz = czi + iz;
    const key = ((gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791)) | 0;
    for (let m = 0; m < 2; m++) {
      const hx = hash(key + m * 7, 311), hzz = hash(key + m * 7, 313), hy = hash(key + m * 7, 315);
      const sp = (28 + Math.floor(hash(key + m, 317) * 11)) / LOOP;
      const fall = (hy * RC + rainT * 9 * sp) % RC;
      const w = v3((gx + hx) * RC, (gy + 1) * RC - fall, (gz + hzz) * RC);
      const p0 = P(w), p1 = P(v3(w.x - 0.25, w.y - 1.1, w.z));
      if (!p0.ok || !p1.ok || p0.z < 2.5) continue;
      const far = clamp((dFar - p0.z) / 22);
      if (far <= 0) continue;
      if (p0.x < -40 || p0.x > 1120 || p0.y < -40 || p0.y > 1960) continue;
      const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (L < 6 || L > 120) continue;
      const my = (p0.y + p1.y) / 2;
      const band = my > 1530 && my < 1790 ? 2 : my > 1470 && my < 1850 ? 1 : 0;
      const o = Math.round(100 * op[band] * far);
      if (o <= 0) continue;
      const d = `M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`;
      const list = drops.get(o);
      if (list) list.push(d);
      else drops.set(o, [d]);
    }
  }
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={2}>
      {[...drops.entries()].sort((a, b) => a[0] - b[0]).map(([o, d]) => <path key={o} d={d.join(' ')} stroke="#8FA6BC" strokeOpacity={o / 100} />)}
    </g>
  );
};
/** the tower half: the tower, the beam and its packets, the growing channel, the corona and the guided leader (the
 *  site's own pieces, without its sky: the backdrop is shared) */
const TowerHalf: React.FC<{t: number; id: string}> = ({t, id}) => {
  const cam = towerSplitCam(t);
  const st = towerSt(t);
  return (
    <g>
      <Tower3D cam={cam} flash={st.flash} aviation={0.5 + 0.5 * Math.sin((2 * Math.PI * 17 * tau3(t)) / 33.5)} id={`${id}-tw`} />
      <Beam3D cam={cam} alpha={st.beam} pulses={st.pulses} channel={st.channel} channelTop={st.channelTop} id={`${id}-bm`} />
      <ChannelGrow4 cam={cam} t={t} top={st.channelTop ?? 0} k={1} wS={2.1} gain={2.1} id={`${id}-g`} />
      <TipCorona3 cam={cam} k={st.tipCorona} t={t} />
      <GuidedLeader5 cam={cam} s={st.s} t={t} id={`${id}-gl`} />
      <PanelRain cam={cam} rainT={t + 40} />
    </g>
  );
};

export const SplitH5: React.FC<{t: number}> = ({t}) => {
  const id = `h5s-${Math.round(t * 30)}`;
  const X = dividerX(t);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-cl`}>
          <rect x={-20} y={-20} width={fmt(X + 20)} height={1960} />
        </clipPath>
        <clipPath id={`${id}-cr`}>
          <rect x={fmt(X)} y={-20} width={fmt(1100 - X)} height={1960} />
        </clipPath>
      </defs>
      <Backdrop t={t} id={`${id}-bd`} fl={0.25 * clamp(leftHold(t))} />
      <g clipPath={`url(#${id}-cl)`}>
        <HouseHalf t={t} id={`${id}-h`} />
        {LEFT_DIM(t) > 0.002 && <rect x={-20} y={-20} width={fmt(X + 20)} height={1960} fill={INK} opacity={fmt(LEFT_DIM(t))} />}
      </g>
      {X < 1079 && (
        <g>
          <g clipPath={`url(#${id}-cr)`}>
            <TowerHalf t={t} id={`${id}-t`} />
          </g>
          <rect x={fmt(X - 4)} y={-20} width={8} height={1960} fill={INK} />
          <rect x={fmt(X - 0.75)} y={-20} width={1.5} height={1960} fill="#7F93A8" opacity={0.45} />
        </g>
      )}
    </g>
  );
};
