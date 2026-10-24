// Ported from FGW Invisibility Shield V4 (claude/inspiring-clarke-meyznm: invisibility-shield/source/src/v4).
// V4 Weird Crew rig: the Video 01 cutout construction (flat fills, one ink outline, stroke limbs with an ink underlay,
// mitt hands with a thumb, white-sclera eyes with ink pupils, ink-line brows, hook nose, drawn mouth) extended to
// every view a chase needs. The skeleton lives in card-local rig units (X = the character's left, Y up, Z forward);
// limbs are solved with two-bone IK so elbows and knees always bend the right way, and every shape is drawn flat at
// the joint positions the card projects. The head is a crew oval whose features ride on a sphere, so a head turn is
// a slide of the face across the oval (classic cutout turnaround), never a rotating model.
import React from 'react';
import {Body4, INK, Look4} from './cast4';
import {add3, Card, cardPt, cross3, dot3, ik2, inkW, len3, mul3, norm3, pathOf, sub3, V3, v3, yawV} from './geo4';

const RAD = Math.PI / 180;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const f1 = (n: number) => n.toFixed(1);

export type HandShape = 'mitt' | 'grip' | 'open' | 'fist';
export type Arm4 = {hand: V3; pole?: V3; shape?: HandShape; thumb?: number; splay?: number; curl?: number[]; wrist?: number};
export type Face4 = {
  gx: number; gy: number; // pupils -1..1
  brow: number; browIn: number; asym: number; // brow raise, inner-end raise (+ worried, - cross), right brow extra
  lid: number; wide: number; squint: number; blink: number;
  mw: number; curve: number; open: number; teeth: number; smirk: number; // mouth half-width (u), corners, opening 0..1
  blush: number; sweat: number;
};
export const FACE0: Face4 = {gx: 0, gy: 0, brow: 0, browIn: 0, asym: 0, lid: 0, wide: 0, squint: 0, blink: 0, mw: 15, curve: 0.3, open: 0, teeth: 0, smirk: 0, blush: 0, sweat: 0};
export type Pose4 = {
  pel: V3; hipYaw: number; pitch: number; roll: number; twist: number;
  hy: number; hp: number; hr: number; // head yaw / nod (+ chin down) / tilt, relative to the chest
  footL: V3; footR: V3; toeL: number; toeR: number;
  armL: Arm4; armR: Arm4;
  face: Face4;
};

/** Rodrigues rotation of v about a unit axis (deg). */
export const rotA = (v: V3, a: V3, deg: number): V3 => {
  const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
  const k = cross3(a, v);
  return add3(add3(mul3(v, c), mul3(k, s)), mul3(a, dot3(a, v) * (1 - c)));
};

export const joints4 = (b: Body4, p: Pose4) => {
  const Y = v3(0, 1, 0);
  const Lh = yawV(v3(1, 0, 0), p.hipYaw), Fh = yawV(v3(0, 0, 1), p.hipYaw);
  let u = add3(mul3(Y, Math.cos(p.pitch * RAD)), mul3(Fh, Math.sin(p.pitch * RAD)));
  u = norm3(add3(mul3(u, Math.cos(p.roll * RAD)), mul3(Lh, Math.sin(p.roll * RAD))));
  let Lc = rotA(Lh, Y, p.twist);
  Lc = norm3(sub3(Lc, mul3(u, dot3(Lc, u))));
  const Fc = cross3(Lc, u);
  const P = p.pel;
  const S = add3(P, mul3(u, b.spine));
  const SL = add3(S, mul3(Lc, b.shW)), SR = add3(S, mul3(Lc, -b.shW));
  const HL = add3(add3(P, mul3(Lh, b.hipW)), v3(0, -6, 0)), HR = add3(add3(P, mul3(Lh, -b.hipW)), v3(0, -6, 0));
  const legL = ik2(HL, p.footL, b.thigh, b.shin, add3(Fh, mul3(Lh, 0.12)));
  const legR = ik2(HR, p.footR, b.thigh, b.shin, add3(Fh, mul3(Lh, -0.12)));
  const poleL = p.armL.pole ?? add3(add3(mul3(Fc, -0.5), mul3(Y, -0.6)), mul3(Lc, 0.55));
  const poleR = p.armR.pole ?? add3(add3(mul3(Fc, -0.5), mul3(Y, -0.6)), mul3(Lc, -0.55));
  const armL = ik2(SL, p.armL.hand, b.upper, b.fore, poleL);
  const armR = ik2(SR, p.armR.hand, b.upper, b.fore, poleR);
  // head frame: yaw about the spine, nod about the head's lateral axis, tilt about its forward axis
  let hx = rotA(Lc, u, p.hy), hz = rotA(Fc, u, p.hy), hyv = u;
  const hz2 = norm3(add3(mul3(hz, Math.cos(p.hp * RAD)), mul3(hyv, -Math.sin(p.hp * RAD))));
  hyv = norm3(cross3(hz2, hx));
  hz = hz2;
  const hx3 = norm3(add3(mul3(hx, Math.cos(p.hr * RAD)), mul3(hyv, -Math.sin(p.hr * RAD))));
  hyv = norm3(cross3(hz, hx3));
  hx = hx3;
  const N = add3(S, mul3(u, 12));
  const Hc = add3(N, mul3(hyv, b.headUp - 12));
  return {P, S, SL, SR, HL, HR, KL: legL.j, AL: legL.e, KR: legR.j, AR: legR.e, EL: armL.j, WL: armL.e, ER: armR.j, WR: armR.e,
    short: Math.max(legL.short, legR.short), armShort: Math.max(armL.short, armR.short), u, Lc, Fc, Lh, Fh, N, Hc, hx, hy: hyv, hz};
};
export type J4 = ReturnType<typeof joints4>;

// ---------------------------------------------------------------- hands (mitt-local units, +y runs down the forearm)
export const HandArt: React.FC<{shape: HandShape; side: number; skin: string; ol: number; splay?: number; curl?: number[]}> = ({shape, side, skin, ol, splay = 0.5, curl = [0, 0, 0, 0]}) => {
  const st = {stroke: INK, strokeWidth: ol, strokeLinejoin: 'round' as const};
  const thumb = (
    <g transform={`rotate(${side * -30})`}>
      <ellipse cx={side * -14} cy={-2} rx={8} ry={10} fill={skin} {...st} />
    </g>
  );
  const thumbCover = (
    <g transform={`rotate(${side * -30})`}>
      <ellipse cx={side * -14} cy={-2} rx={6} ry={8} fill={skin} />
    </g>
  );
  if (shape === 'grip' || shape === 'fist') {
    return (
      <g>
        <ellipse cx={0} cy={5} rx={18} ry={16} fill={skin} {...st} />
        <ellipse cx={side * -7} cy={1} rx={10} ry={6.5} fill={skin} {...st} transform={`rotate(${side * 24} ${side * -7} 1)`} />
        <path d={`M ${side * 4} 14 Q ${side * 10} 17 ${side * 15} 12`} fill="none" stroke={INK} strokeWidth={ol * 0.7} strokeLinecap="round" />
      </g>
    );
  }
  if (shape === 'open') {
    const fingers = [-1.5, -0.5, 0.5, 1.5].map((i, n) => {
      const a = (i * 15 * (0.4 + splay)) * RAD;
      const L = (22 - Math.abs(i) * 2.5) * (1 - 0.45 * (curl[n] ?? 0));
      const x0 = i * 6.5, y0 = 12;
      return {x0, y0, x1: x0 + Math.sin(a) * L, y1: y0 + Math.cos(a) * L};
    });
    return (
      <g>
        {fingers.map((f, n) => <line key={`u${n}`} x1={f.x0} y1={f.y0} x2={f.x1} y2={f.y1} stroke={INK} strokeWidth={11 + ol * 2} strokeLinecap="round" />)}
        <g transform={`rotate(${side * -38})`}>
          <line x1={side * -10} y1={2} x2={side * -24} y2={8} stroke={INK} strokeWidth={11 + ol * 2} strokeLinecap="round" />
          <line x1={side * -10} y1={2} x2={side * -24} y2={8} stroke={skin} strokeWidth={11} strokeLinecap="round" />
        </g>
        <ellipse cx={0} cy={4} rx={18} ry={15} fill={skin} {...st} />
        {fingers.map((f, n) => <line key={`s${n}`} x1={f.x0} y1={f.y0} x2={f.x1} y2={f.y1} stroke={skin} strokeWidth={11} strokeLinecap="round" />)}
        <ellipse cx={0} cy={6} rx={15} ry={10} fill={skin} />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={0} cy={6} rx={20} ry={18} fill={skin} {...st} />
      {thumb}
      {thumbCover}
    </g>
  );
};

// ---------------------------------------------------------------- head
type S3 = {x: number; y: number; d: number};
const onSphere = (az: number, el: number) => v3(Math.sin(az * RAD) * Math.cos(el * RAD), Math.sin(el * RAD), Math.cos(az * RAD) * Math.cos(el * RAD));

/** An elliptical cap on the unit sphere (screen-aligned coords: x right, y up, d toward camera): centre c, angular
 *  half-widths ah (along the lateral axis lat) and av. Returns the boundary sampler and an inside test. */
const capOf = (c: S3, lat: S3, ah: number, av: number) => {
  const cv = v3(c.x, c.y, c.d);
  let e1 = v3(lat.x, lat.y, lat.d);
  e1 = norm3(sub3(e1, mul3(cv, dot3(e1, cv))));
  const e2 = cross3(cv, e1);
  const alpha = (t: number) => 1 / Math.sqrt((Math.cos(t) / ah) ** 2 + (Math.sin(t) / av) ** 2);
  const at = (t: number) => {
    const a = alpha(t) * RAD;
    return add3(mul3(cv, Math.cos(a)), add3(mul3(e1, Math.cos(t) * Math.sin(a)), mul3(e2, Math.sin(t) * Math.sin(a))));
  };
  const inside = (m: V3) => {
    const th = Math.acos(Math.max(-1, Math.min(1, dot3(m, cv)))) / RAD;
    return th <= alpha(Math.atan2(dot3(m, e2), dot3(m, e1)));
  };
  return {at, inside};
};

/** The projected, visible part of a cap: front-facing boundary plus the stretch of the head's limb inside it. */
const capPoly = (cap: ReturnType<typeof capOf>, N = 96): {x: number; y: number}[] | null => {
  const pts: V3[] = [];
  for (let i = 0; i < N; i++) pts.push(cap.at((i / N) * Math.PI * 2));
  const vis = pts.map((p) => p.z >= 0);
  if (vis.every((x) => x)) return pts.map((p) => ({x: p.x, y: p.y}));
  if (!vis.some((x) => x)) return null;
  let s = 0;
  for (let i = 0; i < N; i++) if (!vis[i] && vis[(i + 1) % N]) s = (i + 1) % N;
  const out: {x: number; y: number}[] = [];
  const prev = pts[(s - 1 + N) % N], first = pts[s];
  const ka = prev.z / (prev.z - first.z);
  const A = {x: prev.x + (first.x - prev.x) * ka, y: prev.y + (first.y - prev.y) * ka};
  out.push(A);
  let i = s;
  while (vis[i % N]) {
    out.push({x: pts[i % N].x, y: pts[i % N].y});
    i++;
    if (i - s > N) break;
  }
  const last = pts[(i - 1) % N], nx = pts[i % N];
  const kb = last.z / (last.z - nx.z);
  const Bp = {x: last.x + (nx.x - last.x) * kb, y: last.y + (nx.y - last.y) * kb};
  out.push(Bp);
  const bA = Math.atan2(A.y, A.x), bB = Math.atan2(Bp.y, Bp.x);
  let dPos = bA - bB;
  while (dPos < 0) dPos += Math.PI * 2;
  const mm = bB + dPos / 2;
  const useP = cap.inside(v3(Math.cos(mm), Math.sin(mm), 0));
  const span = useP ? dPos : Math.PI * 2 - dPos, dir = useP ? 1 : -1;
  for (let k = 1; k < 20; k++) {
    const m = bB + (dir * span * k) / 20;
    out.push({x: Math.cos(m), y: Math.sin(m)});
  }
  return out;
};

type HeadProps = {id: string; look: Look4; b: Body4; j: J4; cd: Card; face: Face4; ol: number; t: number};
export const Head4: React.FC<HeadProps> = ({id, look, b, j, cd, face, ol}) => {
  const R = b.R;
  const c = cardPt(cd, j.Hc);
  const cp = Math.cos(cd.phi * RAD), sp = Math.sin(cd.phi * RAD);
  const toS = (v: V3): S3 => ({x: v.x * cp + v.z * sp, y: v.y, d: -v.x * sp + v.z * cp});
  const Hx = toS(j.hx), Hy = toS(j.hy), Hz = toS(j.hz);
  const dirS = (az: number, el: number): S3 => {
    const o = onSphere(az, el);
    return {x: Hx.x * o.x + Hy.x * o.y + Hz.x * o.z, y: Hx.y * o.x + Hy.y * o.y + Hz.y * o.z, d: Hx.d * o.x + Hy.d * o.y + Hz.d * o.z};
  };
  const rho = Math.atan2(Hy.x, Math.max(1e-3, Hy.y));
  const cr = Math.cos(rho), sr = Math.sin(rho);
  const egg = (x: number, y: number, rad = R) => {
    // screen-aligned unit coords (y up) -> head-local px-units (y down), stretched along the head's own up axis
    const px = x * rad, py = -y * rad;
    const a = px * cr + py * sr, bb = (-px * sr + py * cr) * ((R + 4) / R);
    return {x: a * cr - bb * sr, y: a * sr + bb * cr};
  };
  const at = (s: S3, rad = R) => egg(s.x, s.y, rad);
  const lw = ol / cd.k;
  const st = {stroke: INK, strokeWidth: lw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const headRot = (rho * 180) / Math.PI;
  const yawS = Math.atan2(Hz.x, Hz.d); // screen yaw of the face
  const sY = Math.sin(yawS);
  const facing = Math.abs(sY) < 0.08 ? 1 : Math.sign(sY);
  // ---- hair behind the head
  let back: React.ReactNode = null;
  if (look.hair === 'bob') {
    const s = Math.abs(sY) * (Hz.d < 0 ? 1 : 1);
    const shift = -sY * R * 0.2;
    const wF = (R + 11) * (1 - 0.5 * s), wB = (R + 11) * (1 + 0.12 * s);
    const yF = 26 - 62 * s, yB = 28;
    const wl = facing > 0 ? wB : wF, wr = facing > 0 ? wF : wB, yl = facing > 0 ? yB : yF, yr = facing > 0 ? yF : yB;
    const xl = shift - wl, xr = shift + wr, top = -(R + 4) - 34;
    back = (
      <g transform={`rotate(${headRot})`}>
        <path d={`M ${f1(xl)} ${f1(yl)} L ${f1(xl)} -8 C ${f1(xl)} ${f1(top)} ${f1(xr)} ${f1(top)} ${f1(xr)} -8 L ${f1(xr)} ${f1(yr)} Q ${f1((xl + xr) / 2)} ${f1(Math.max(yl, yr) + 14)} ${f1(xl)} ${f1(yl)} Z`} fill={look.hairColor} {...st} />
        <path d={`M ${f1(xl + 14)} ${f1(-R * 0.6)} Q ${f1(xl + 22)} ${f1(-R - 8)} ${f1(shift - 6)} ${f1(-R - 14)}`} fill="none" stroke={look.hairShine} strokeWidth={lw * 1.6} strokeLinecap="round" opacity={Hz.d > -0.6 ? 1 : 0.4} />
      </g>
    );
  } else {
    const shift = -sY * R * 0.08;
    back = <ellipse cx={shift} cy={-6} rx={R + 4} ry={R + 9} fill={look.hairColor} {...st} transform={`rotate(${headRot})`} />;
  }
  // V4: the guesser's spikes (crown triangles; drawn behind the oval, so only the silhouette shows) and clerkB's bun
  let spikes: React.ReactNode = null, bunBack: React.ReactNode = null, bunFront: React.ReactNode = null;
  if (look.hair === 'spiky') {
    const SP: [number, number, number][] = [[-135, 40, 1.62], [-80, 50, 1.9], [-28, 58, 2.08], [28, 58, 2.02], [80, 50, 1.86], [135, 40, 1.58], [180, 36, 1.45]];
    spikes = (
      <g>
        {SP.map(([az, el, ln], i) => {
          const b1 = at(dirS(az - 30, el - 16), R - 4), b2 = at(dirS(az + 30, el - 16), R - 4), tp = at(dirS(az + 6, Math.min(86, el + 18)), R * ln);
          return <path key={i} d={`M ${f1(b1.x)} ${f1(b1.y)} L ${f1(tp.x)} ${f1(tp.y)} L ${f1(b2.x)} ${f1(b2.y)} Z`} fill={look.hairColor} {...st} />;
        })}
      </g>
    );
  }
  if (look.hair === 'bun') {
    const bd = dirS(180, 38), bp = at(bd, R + 16);
    const node = <g><circle cx={bp.x} cy={bp.y} r={23} fill={look.hairColor} {...st} /><path d={`M ${f1(bp.x - 12)} ${f1(bp.y + 6)} Q ${f1(bp.x)} ${f1(bp.y + 14)} ${f1(bp.x + 12)} ${f1(bp.y + 6)}`} fill="none" stroke={look.hairShine} strokeWidth={lw} strokeLinecap="round" /></g>;
    if (bd.d < 0) bunBack = node; else bunFront = node;
  }
  // ---- face cap: where skin shows (the rest of the oval is hair)
  const capC = look.hair === 'bob' ? dirS(6, -14) : dirS(0, -6);
  const faceCap = look.hair === 'bob' ? capOf(capC, Hx, 87, 56) : capOf(capC, Hx, 86, 62);
  const capRaw = capPoly(faceCap);
  const capPts = capRaw ? capRaw.map((p) => egg(p.x, p.y)) : null;
  const headPath = (() => {
    const pts: {x: number; y: number}[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(egg(Math.cos(a), Math.sin(a)));
    }
    return pathOf(pts);
  })();
  // visible arc of the hairline (cap boundary points facing the camera, above the jaw)
  const hairline = (() => {
    const segs: string[] = [];
    let cur: {x: number; y: number}[] = [];
    for (let i = 0; i <= 96; i++) {
      const p = faceCap.at((i / 96) * Math.PI * 2);
      if (p.z > 0.04 && dot3(p, v3(Hy.x, Hy.y, Hy.d)) > -0.2) cur.push(egg(p.x, p.y));
      else if (cur.length) { if (cur.length > 1) segs.push(pathOf(cur, false)); cur = []; }
    }
    if (cur.length > 1) segs.push(pathOf(cur, false));
    return segs.join(' ');
  })();
  // ---- features
  const feat = (az: number, el: number) => {
    const s = dirS(az, el);
    return {p: at(s), d: s.d, fs: 0.42 + 0.58 * clamp(s.d), vis: clamp((s.d - 0.18) / 0.16)};
  };
  const eyes = [1, -1].map((side) => {
    // side +1 = the character's left eye (local +X)
    const e = feat(side * 21, 6);
    const wd = 1 + 0.2 * face.wide;
    const rx = 12 * wd * e.fs, ry0 = 13 * wd, ry = Math.max(0.7, ry0 * (1 - face.blink));
    const scr = dirS(side * 21, 6);
    const sx = scr.x >= dirS(0, 6).x ? 1 : -1; // screen side of this eye relative to the nose line
    return {side, sx, ...e, rx, ry, ry0};
  });
  const nose0 = dirS(0, 0), noseTip = dirS(0, -11), noseBot = dirS(0, -17);
  const ntip = at(noseTip, R + 12), nr = at(nose0), nb = at(noseBot);
  const hook = facing * 7 * (1 - 0.5 * Math.abs(sY));
  const tipR = Math.hypot(ntip.x, ntip.y / ((R + 4) / R));
  const protrude = clamp((tipR - R + 2) / 6) * (noseTip.d > -0.3 ? 1 : 0);
  const mouth = feat(0, -29);
  const mouthPath = () => {
    const w = face.mw * (0.55 + 0.45 * mouth.fs);
    const c = face.curve, o = face.open, sm = face.smirk;
    const yl = -c * 3 - sm * 5, yr = -c * 3 + sm * 5 * 0 - Math.max(0, sm) * 0;
    const yR = -c * 3 + (sm > 0 ? -sm * 6 : 0), yL = -c * 3 + (sm < 0 ? sm * 6 : 0);
    void yl; void yr;
    if (o < 0.04) return {line: `M ${f1(-w)} ${f1(yL)} Q 0 ${f1(c * 13)} ${f1(w)} ${f1(yR)}`, fill: null as string | null, teeth: null as string | null};
    const up = c * 5 - o * 3, lo = c * 13 + o * 24;
    const fill = `M ${f1(-w)} ${f1(yL)} Q 0 ${f1(up)} ${f1(w)} ${f1(yR)} Q 0 ${f1(lo)} ${f1(-w)} ${f1(yL)} Z`;
    const th = face.teeth > 0 ? `M ${f1(-w * 0.8)} ${f1(yL + 1)} Q 0 ${f1(up + 1)} ${f1(w * 0.8)} ${f1(yR + 1)} L ${f1(w * 0.75)} ${f1(yR + 1 + 7 * face.teeth)} Q 0 ${f1(up + 2 + 9 * face.teeth)} ${f1(-w * 0.75)} ${f1(yL + 1 + 7 * face.teeth)} Z` : null;
    return {line: null as string | null, fill, teeth: th};
  };
  const mp = mouthPath();
  const ears = [1, -1].map((side) => {
    const e = dirS(side * 90, -6);
    return {side, p: at(e, R + 1), d: e.d};
  });
  const earNode = ears.filter((e) => e.d > -0.3).map((e) => (
    <g key={e.side} transform={`translate(${f1(e.p.x)} ${f1(e.p.y)}) rotate(${headRot})`}>
      <ellipse cx={0} cy={0} rx={9 + 3 * clamp(e.d)} ry={12 + 2 * clamp(e.d)} fill={look.skin} {...st} />
      {e.d > 0.35 && <path d={`M ${-facing * 3} -6 Q ${facing * 4} 0 ${-facing * 2} 6`} fill="none" stroke={INK} strokeWidth={lw * 0.7} strokeLinecap="round" />}
    </g>
  ));
  const earsOver = look.hair !== 'bob';
  // ---- hat (guard): crown is a cap tipped back from the top of the head, brim a flat half disc at the forehead
  let hatBack: React.ReactNode = null, hatFront: React.ReactNode = null;
  if (look.hat) {
    const crownC = dirS(180, 70);
    const cr2 = capPoly(capOf(crownC, Hx, 76, 76));
    const crown = cr2 ? pathOf(cr2.map((p) => egg(p.x, p.y, R + 7))) : '';
    const brimPts: {x: number; y: number}[] = [];
    let brimD = 0;
    const base = dirS(0, 30);
    const fw = v3(Hz.x, Hz.y, Hz.d), lt = v3(Hx.x, Hx.y, Hx.d), upv = v3(Hy.x, Hy.y, Hy.d);
    const fwd2 = norm3(add3(fw, mul3(upv, -0.12)));
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (i / 16);
      const q = add3(add3(mul3(v3(base.x, base.y, base.d), R + 6), mul3(lt, Math.cos(a) * 50)), mul3(fwd2, Math.sin(a) * 42 - 4));
      brimPts.push(egg(q.x / R, q.y / R));
      brimD += q.z;
    }
    for (let i = 16; i >= 0; i--) {
      const a = Math.PI * (i / 16);
      const q = add3(mul3(v3(base.x, base.y, base.d), R + 6), mul3(lt, Math.cos(a) * 50));
      const q2 = add3(q, mul3(upv, 10 * Math.sin(a) + 3));
      brimPts.push(egg(q2.x / R, q2.y / R));
    }
    const brim = <path d={pathOf(brimPts)} fill={look.hat.color} {...st} />;
    const badge = dirS(0, 46);
    const crownNode = (
      <g>
        <path d={crown} fill={look.hat.color} {...st} />
        {badge.d > 0.1 && (
          <g transform={`translate(${f1(at(badge, R + 7).x)} ${f1(at(badge, R + 7).y)}) rotate(${headRot}) scale(${f1(0.5 + 0.5 * badge.d)} 1)`}>
            <path d="M 0 -11 L 9 -6 L 7 6 L 0 11 L -7 6 L -9 -6 Z" fill={look.hat.badge} stroke={INK} strokeWidth={lw * 0.7} strokeLinejoin="round" />
          </g>
        )}
      </g>
    );
    if (brimD / 17 < -8) {
      hatBack = brim;
      hatFront = crownNode;
    } else {
      hatFront = <g>{crownNode}{brim}</g>;
    }
  }
  const showFace = Hz.d > -0.25;
  return (
    <g transform={`translate(${f1(c.x)} ${f1(c.y)}) scale(${cd.k.toFixed(4)})`}>
      <defs>
        <clipPath id={`${id}-hc`}><path d={headPath} /></clipPath>
      </defs>
      {hatBack}
      {spikes}
      {bunBack}
      {back}
      <path d={headPath} fill={look.skin} {...st} />
      {!earsOver && earNode}
      {/* hair over the oval: everything outside the face cap */}
      <g clipPath={`url(#${id}-hc)`}>
        <path d={`${headPath} ${capPts ? pathOf(capPts) : ''}`} fill={look.hairColor} fillRule="evenodd" />
        {capPts && <path d={hairline} fill="none" stroke={INK} strokeWidth={lw} strokeLinecap="round" />}
      </g>
      <path d={headPath} fill="none" {...st} />
      {earsOver && earNode}
      {showFace && (
        <g clipPath={`url(#${id}-hc)`}>
          {Math.max(face.blush, look.cheekBase ?? 0) > 0 && [1, -1].map((sd) => {
            const ch = feat(sd * 40, -16);
            return ch.vis > 0 ? <ellipse key={sd} cx={ch.p.x} cy={ch.p.y} rx={9 * ch.fs} ry={8} fill={look.cheek} opacity={0.5 * Math.max(face.blush, look.cheekBase ?? 0) * ch.vis} transform={`rotate(${headRot} ${ch.p.x} ${ch.p.y})`} /> : null;
          })}
          {eyes.map((e) => {
            if (e.vis <= 0) return null;
            const browUp = face.brow + (e.side < 0 ? face.asym : 0);
            const inner = -e.sx * 12 * e.fs, outer = e.sx * 12 * e.fs;
            const yo = -24 - browUp * 7, yi = yo - face.browIn * 6;
            const lidY = -e.ry + 2 * e.ry * clamp(face.lid);
            const sqY = e.ry - 2 * e.ry * clamp(face.squint) * 0.5;
            const pr = 5.5 * (1 - 0.25 * face.wide);
            const px = clamp(face.gx + (1 - e.fs) * facing * 0.6, -1, 1) * Math.max(1, e.rx - pr - 1.5), py = face.gy * 4;
            return (
              <g key={e.side} opacity={e.vis} transform={`translate(${f1(e.p.x)} ${f1(e.p.y)}) rotate(${headRot})`}>
                <defs><clipPath id={`${id}-e${e.side}`}><ellipse cx={0} cy={0} rx={e.rx} ry={e.ry} /></clipPath></defs>
                <ellipse cx={0} cy={0} rx={e.rx} ry={e.ry} fill="#FFFFFF" />
                {face.blink < 0.75 && (
                  <g clipPath={`url(#${id}-e${e.side})`}>
                    <circle cx={px} cy={py} r={pr} fill={INK} />
                    <circle cx={px + 2} cy={py - 2} r={1.6} fill="#FFFFFF" />
                    {face.lid > 0.02 && <rect x={-e.rx - 2} y={-e.ry - 4} width={e.rx * 2 + 4} height={lidY + e.ry + 4} fill={look.skin} />}
                    {face.squint > 0.02 && <rect x={-e.rx - 2} y={sqY} width={e.rx * 2 + 4} height={e.ry * 2} fill={look.skin} />}
                  </g>
                )}
                <ellipse cx={0} cy={0} rx={e.rx} ry={e.ry} fill="none" stroke={INK} strokeWidth={lw * 0.8} />
                {face.lid > 0.02 && face.blink < 0.75 && <line x1={-e.rx * Math.sqrt(1 - (lidY / e.ry) ** 2)} y1={lidY} x2={e.rx * Math.sqrt(1 - (lidY / e.ry) ** 2)} y2={lidY} stroke={INK} strokeWidth={lw * 0.9} strokeLinecap="round" />}
                <line x1={outer} y1={yo} x2={inner} y2={yi} stroke={INK} strokeWidth={lw * 1.25} strokeLinecap="round" />
              </g>
            );
          })}
          {mouth.vis > 0 && (
            <g opacity={mouth.vis} transform={`translate(${f1(mouth.p.x)} ${f1(mouth.p.y)}) rotate(${headRot}) scale(${f1(0.6 + 0.4 * mouth.fs)} 1)`}>
              {mp.line && <path d={mp.line} fill="none" stroke={INK} strokeWidth={lw} strokeLinecap="round" />}
              {mp.fill && <path d={mp.fill} fill="#5A2230" stroke={INK} strokeWidth={lw * 0.9} strokeLinejoin="round" />}
              {mp.teeth && <path d={mp.teeth} fill="#FFFFFF" />}
            </g>
          )}
          {face.sweat > 0.02 && (() => {
            const sw = feat(-facing * 62, 30);
            return <path d={`M ${f1(sw.p.x)} ${f1(sw.p.y - 9)} Q ${f1(sw.p.x + 7)} ${f1(sw.p.y + 4)} ${f1(sw.p.x)} ${f1(sw.p.y + 6)} Q ${f1(sw.p.x - 7)} ${f1(sw.p.y + 4)} ${f1(sw.p.x)} ${f1(sw.p.y - 9)} Z`} fill="#BFE8F3" stroke={INK} strokeWidth={lw * 0.7} opacity={face.sweat} />;
          })()}
        </g>
      )}
      {showFace && <g>
          {/* nose: the crew hook; at a strong turn it breaks the oval's silhouette as a little bump */}
          {protrude > 0.02 && (
            <path d={`M ${f1(nr.x)} ${f1(nr.y)} Q ${f1(ntip.x + hook)} ${f1(ntip.y)} ${f1(nb.x)} ${f1(nb.y)} L ${f1(nb.x * 0.85)} ${f1(nb.y)} L ${f1(nr.x * 0.85)} ${f1(nr.y)} Z`} fill={look.skin} opacity={protrude} />
          )}
          {nose0.d > -0.2 && <path d={`M ${f1(nr.x + facing * 2)} ${f1(nr.y + 1)} Q ${f1(ntip.x + hook)} ${f1(ntip.y + 4)} ${f1(nb.x)} ${f1(nb.y + 1)}`} fill="none" stroke={INK} strokeWidth={lw * 0.8} strokeLinecap="round" />}
      </g>}
      {bunFront}
      {showFace && look.glasses && (() => {
        const vis = eyes.filter((e) => e.vis > 0.05);
        const frames = vis.map((e) => (
          <g key={e.side} opacity={e.vis} transform={`translate(${f1(e.p.x)} ${f1(e.p.y)}) rotate(${headRot})`}>
            {look.glasses === 'round'
              ? <ellipse cx={0} cy={0} rx={17 * e.fs} ry={17} fill="#FFFFFF" fillOpacity={0.1} stroke={INK} strokeWidth={lw * 1.05} />
              : <rect x={-15 * e.fs} y={-13} width={30 * e.fs} height={26} rx={7 * e.fs} fill="#FFFFFF" fillOpacity={0.1} stroke={INK} strokeWidth={lw * 1.05} />}
          </g>
        ));
        const br = vis.length === 2 ? (() => {
          const a = vis[0].p, c = vis[1].p, gw = (look.glasses === 'round' ? 17 : 15);
          const ux = c.x - a.x, uy = c.y - a.y, l = Math.hypot(ux, uy) || 1;
          const pa = {x: a.x + (ux / l) * gw * vis[0].fs, y: a.y + (uy / l) * gw * vis[0].fs - 3}, pc = {x: c.x - (ux / l) * gw * vis[1].fs, y: c.y - (uy / l) * gw * vis[1].fs - 3};
          return <line x1={pa.x} y1={pa.y} x2={pc.x} y2={pc.y} stroke={INK} strokeWidth={lw} strokeLinecap="round" />;
        })() : null;
        // temple arm toward the visible ear in a turned view
        const tm = ears.filter((er) => er.d > 0.15).map((er) => {
          const e = vis.find((v) => v.side === er.side);
          if (!e || e.fs > 0.8) return null;
          const gw = (look.glasses === 'round' ? 17 : 15) * e.fs;
          const dx = er.p.x - e.p.x, dy = er.p.y - e.p.y, l = Math.hypot(dx, dy) || 1;
          return <line key={`t${er.side}`} x1={e.p.x + (dx / l) * gw} y1={e.p.y + (dy / l) * gw - 3} x2={er.p.x} y2={er.p.y - 4} stroke={INK} strokeWidth={lw} strokeLinecap="round" />;
        });
        return <g>{tm}{frames}{br}</g>;
      })()}
      {look.earring && ears.filter((er) => er.d > 0.05).map((er) => {
        const p = at(dirS(er.side * 90, -24), R + 2);
        return <circle key={`er${er.side}`} cx={p.x} cy={p.y} r={5.5} fill={look.earring} stroke={INK} strokeWidth={lw * 0.7} />;
      })}
      {look.pencil && (() => {
        const ed = dirS(-90, 8);
        if (ed.d < 0.05) return null;
        const p = at(ed, R + 4);
        return <g transform={`translate(${f1(p.x)} ${f1(p.y - 14)}) rotate(${headRot - 62})`}><rect x={-4.5} y={-26} width={9} height={52} rx={2} fill={'#FFC744'} stroke={INK} strokeWidth={lw * 0.8} /><path d="M -4.5 26 L 0 35 L 4.5 26 Z" fill={look.skin} stroke={INK} strokeWidth={lw * 0.7} /></g>;
      })()}
      {look.goggles && showFace && (() => {
        const g = [1, -1].map((sd) => ({sd, s: dirS(sd * 20, 34)})).filter((g) => g.s.d > 0.05);
        if (!g.length) return null;
        const band = [] as {x: number; y: number}[];
        for (let a = -80; a <= 80; a += 10) { const q = dirS(a, 34); if (q.d > 0) band.push(at(q, R + 3)); }
        return (
          <g>
            {band.length > 1 && <path d={pathOf(band, false)} fill="none" stroke={'#1CA7A0'} strokeWidth={9} strokeLinecap="round" />}
            {g.map(({sd, s: q}) => { const p = at(q, R + 6); const fs = 0.42 + 0.58 * clamp(q.d); return <ellipse key={sd} cx={p.x} cy={p.y} rx={15 * fs} ry={11} fill="#BFE8F3" fillOpacity={0.85} stroke={INK} strokeWidth={lw} transform={`rotate(${headRot} ${p.x} ${p.y})`} />; })}
          </g>
        );
      })()}
      {hatFront}
    </g>
  );
};

// ---------------------------------------------------------------- body
export type CrewProps = {
  id: string; look: Look4; b: Body4; pose: Pose4; cd: Card; t?: number;
  behind?: React.ReactNode; between?: React.ReactNode; front?: React.ReactNode;
  holdL?: React.ReactNode; holdR?: React.ReactNode; shadow?: boolean; shadowY?: number;
};
export const Crew4: React.FC<CrewProps> = ({id, look, b, pose, cd, t = 0, behind, between, front, holdL, holdR, shadow = true}) => {
  const j = joints4(b, pose);
  const ol = inkW(cd.k);
  const P = (p: V3) => cardPt(cd, p);
  const lwU = ol; // screen px
  const ink = {stroke: INK, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  const cp = Math.cos(cd.phi * RAD), sp = Math.sin(cd.phi * RAD);
  const dirScr = (v: V3) => ({x: v.x * cp + v.z * sp, y: -v.y, d: -v.x * sp + v.z * cp});
  // ---- legs
  const leg = (side: number) => {
    const H = side > 0 ? j.HL : j.HR, K = side > 0 ? j.KL : j.KR, A = side > 0 ? j.AL : j.AR;
    const toe = side > 0 ? pose.toeL : pose.toeR;
    const ph = P(H), pk = P(K), pa = P(A);
    const ff = add3(mul3(j.Fh, Math.cos(toe * RAD)), mul3(v3(0, -1, 0), Math.sin(toe * RAD)));
    const fs = dirScr(ff);
    const fl = Math.hypot(fs.x, fs.y);
    const sx = fs.x / (fl || 1), sy = fs.y / (fl || 1);
    const sideness = clamp(Math.abs(fs.x) * 1.6);
    const ang = (Math.atan2(sy * Math.sign(sx || 1), Math.abs(sx)) * 180) / Math.PI * sideness;
    const shoe = {x: pa.x + fs.x * 13 * cd.k, y: pa.y + (fs.y * 13 + 3) * cd.k};
    const pts = `${f1(ph.x)},${f1(ph.y)} ${f1(pk.x)},${f1(pk.y)} ${f1(pa.x)},${f1(pa.y)}`;
    return {
      d: (ph.d + pk.d + pa.d) / 3,
      node: (
        <g key={`leg${side}`}>
          <polyline points={pts} {...ink} strokeWidth={b.legW * cd.k + ol * 2} />
          <polyline points={pts} fill="none" stroke={look.pants} strokeWidth={b.legW * cd.k} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={shoe.x} cy={shoe.y} rx={(26 + 6 * sideness) * cd.k} ry={13 * cd.k} fill={look.shoes} stroke={INK} strokeWidth={ol} transform={`rotate(${f1(ang)} ${f1(shoe.x)} ${f1(shoe.y)})`} />
        </g>
      ),
    };
  };
  // ---- arms
  const arm = (side: number) => {
    const S = side > 0 ? j.SL : j.SR, E = side > 0 ? j.EL : j.ER, W = side > 0 ? j.WL : j.WR;
    const a = side > 0 ? pose.armL : pose.armR;
    const ps = P(S), pe = P(E), pw = P(W);
    const fx = pw.x - pe.x, fy = pw.y - pe.y;
    const ang = (Math.atan2(-fx, fy) * 180) / Math.PI + (a.wrist ?? 0);
    // thumb toward the body's forward side, as seen
    const fwd = dirScr(j.Fc);
    const perpX = Math.cos(ang * RAD);
    const thumb = a.thumb ?? (Math.abs(fwd.x) > 0.25 ? -Math.sign(fwd.x * perpX || 1) : -side * Math.sign(cp || 1));
    const chestD = P(add3(j.P, mul3(j.u, b.spine * 0.6))).d;
    const frontness = Math.max(ps.d - chestD - 8, (pe.d + pw.d) / 2 - chestD - b.torsoD * 0.85);
    return {
      front: frontness > 0, d: (ps.d + pe.d + pw.d) / 3,
      node: (
        <g key={`arm${side}`}>
          <polyline points={`${f1(ps.x)},${f1(ps.y)} ${f1(pe.x)},${f1(pe.y)} ${f1(pw.x)},${f1(pw.y)}`} {...ink} strokeWidth={b.armW * cd.k + ol * 2} />
          <polyline points={`${f1(ps.x)},${f1(ps.y)} ${f1(pe.x)},${f1(pe.y)}`} fill="none" stroke={look.sleeve} strokeWidth={b.armW * cd.k} strokeLinecap="round" />
          <polyline points={`${f1(pe.x)},${f1(pe.y)} ${f1(pw.x)},${f1(pw.y)}`} fill="none" stroke={look.skin} strokeWidth={b.armW * cd.k} strokeLinecap="round" />
          <g transform={`translate(${f1(pw.x)} ${f1(pw.y)}) rotate(${f1(ang)}) scale(${cd.k.toFixed(4)})`}>
            {(side > 0 ? holdL : holdR) && <g>{side > 0 ? holdL : holdR}</g>}
            <HandArt shape={a.shape ?? 'mitt'} side={thumb} skin={look.skin} ol={ol / cd.k} splay={a.splay} curl={a.curl} />
          </g>
        </g>
      ),
    };
  };
  // ---- torso
  const wb = P(add3(j.P, mul3(j.u, -14))), tp = P(add3(j.S, mul3(j.u, 22)));
  const ax = {x: wb.x - tp.x, y: wb.y - tp.y};
  const alen = Math.hypot(ax.x, ax.y) || 1;
  const ad = {x: ax.x / alen, y: ax.y / alen};
  const n = {x: -ad.y, y: ad.x};
  const half = (L: V3, F: V3, w: number, dd: number) => {
    const ls = dirScr(L), fs = dirScr(F);
    return w * Math.abs(ls.x * n.x + ls.y * n.y) + dd * Math.abs(fs.x * n.x + fs.y * n.y);
  };
  const wS = half(j.Lc, j.Fc, b.torsoW, b.torsoD) * cd.k, wW = half(j.Lh, j.Fh, b.torsoWh, b.torsoD * 0.9) * cd.k;
  const T = (along: number, across: number) => ({x: tp.x + ad.x * along + n.x * across, y: tp.y + ad.y * along + n.y * across});
  const L = alen, k = cd.k;
  const torsoPts = [T(24 * k, -wS), T(2 * k, -wS - 4 * k), T(0, -wS + 26 * k), T(0, wS - 26 * k), T(2 * k, wS + 4 * k), T(24 * k, wS), T(L, wW), T(L + 12 * k, 0), T(L, -wW)];
  const q = (p: {x: number; y: number}) => `${f1(p.x)} ${f1(p.y)}`;
  const torsoD = `M ${q(torsoPts[0])} Q ${q(torsoPts[1])} ${q(torsoPts[2])} L ${q(torsoPts[3])} Q ${q(torsoPts[4])} ${q(torsoPts[5])} L ${q(torsoPts[6])} Q ${q(torsoPts[7])} ${q(torsoPts[8])} Z`;
  // one cel-shade tone on the side turned away from the key (screen-left key, so the screen-right side, or the back when turned)
  const fsc = dirScr(j.Fc);
  const shadeSide = Math.abs(fsc.x) > 0.3 ? -Math.sign(fsc.x) * Math.sign(n.x || 1) : Math.sign(n.x || 1);
  const shadeW = 0.34;
  const shadePts = [T(-4 * k, shadeSide * wS * (1 - shadeW * 2)), T(-4 * k, shadeSide * (wS + 10 * k)), T(L + 14 * k, shadeSide * (wW + 10 * k)), T(L + 14 * k, shadeSide * wW * (1 - shadeW * 2))];
  // V4 overlays: an open cardigan / lab coat shows the shirt in a strip down the front centre line (narrowing as the
  // body turns away); the lab coat also hangs below the waist
  const frontVis = clamp(fsc.d * 1.4 + 0.1);
  const cf = P(add3(add3(j.S, mul3(j.u, 6)), mul3(j.Fc, b.torsoD))), wf = P(add3(j.P, mul3(j.Fh, b.torsoD * 0.9)));
  const hw = 15 * k * frontVis;
  const frontStrip = look.overlay && frontVis > 0.02 ? <path d={pathOf([{x: cf.x - n.x * hw, y: cf.y - n.y * hw}, {x: cf.x + n.x * hw, y: cf.y + n.y * hw}, {x: wf.x + n.x * hw * 0.6, y: wf.y + n.y * hw * 0.6}, {x: wf.x - n.x * hw * 0.6, y: wf.y - n.y * hw * 0.6}])} fill={look.shirt} /> : null;
  const frontEdges = look.overlay && frontVis > 0.02 ? <g>{[-1, 1].map((sd) => <line key={sd} x1={cf.x + sd * n.x * hw} y1={cf.y + sd * n.y * hw} x2={wf.x + sd * n.x * hw * 0.6} y2={wf.y + sd * n.y * hw * 0.6} stroke={INK} strokeWidth={ol * 0.8} />)}</g> : null;
  const coatSkirt = look.overlay?.kind === 'labcoat' ? (() => {
    const hipS = (sd: number) => P(add3(add3(j.P, mul3(j.Lh, sd * (b.torsoWh + 4))), mul3(j.u, 6)));
    const hemS = (sd: number) => P(add3(add3(j.P, mul3(j.Lh, sd * (b.torsoWh + 12))), v3(0, -78, 0)));
    const pts = [hipS(1), hipS(-1), hemS(-1), hemS(1)];
    return <path d={pathOf(pts)} fill={look.overlay!.color} stroke={INK} strokeWidth={ol} strokeLinejoin="round" />;
  })() : null;
  const pelvisC = P(add3(j.P, mul3(j.u, 2)));
  const pW = half(j.Lh, j.Fh, b.hipW + b.legW * 0.5, b.torsoD * 0.8) * cd.k;
  const legs = [leg(1), leg(-1)].sort((a, c) => a.d - c.d);
  const arms = [arm(1), arm(-1)];
  const backArms = arms.filter((a) => !a.front).sort((a, c) => a.d - c.d);
  const frontArms = arms.filter((a) => a.front).sort((a, c) => a.d - c.d);
  const neckA = P(add3(j.S, mul3(j.u, 4))), neckB = P(add3(j.Hc, mul3(j.hy, -30)));
  const gnd = cardPt(cd, v3(j.P.x, 0, j.P.z));
  // belt + badge (guard)
  const belt = look.belt ? (
    <g>
      <path d={`M ${q(T(L - 16 * k, -wW - 1 * k))} L ${q(T(L - 16 * k, wW + 1 * k))} L ${q(T(L - 1 * k, wW + 1 * k))} Q ${q(T(L + 11 * k, 0))} ${q(T(L - 1 * k, -wW - 1 * k))} Z`} fill={look.belt} stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
    </g>
  ) : null;
  const chestBadge = look.badge && fsc.d > -0.2 ? (() => {
    const bp = P(add3(add3(j.S, mul3(j.u, -40)), add3(mul3(j.Lc, b.torsoW * 0.45), mul3(j.Fc, b.torsoD))));
    return <path transform={`translate(${f1(bp.x)} ${f1(bp.y)}) scale(${f1(k * (0.45 + 0.55 * clamp(Math.abs(fsc.d))))} ${f1(k)})`} d="M 0 -12 L 10 -6 L 8 7 L 0 12 L -8 7 L -10 -6 Z" fill={look.badge} stroke={INK} strokeWidth={ol / k} strokeLinejoin="round" />;
  })() : null;
  return (
    <g>
      {shadow && <ellipse cx={gnd.x} cy={gnd.y} rx={(70 + 20 * Math.abs(sp)) * cd.k} ry={12 * cd.k} fill="rgba(5,12,18,0.35)" />}
      {behind}
      {backArms.map((a) => a.node)}
      {legs.map((l) => l.node)}
      <ellipse cx={pelvisC.x} cy={pelvisC.y} rx={pW} ry={28 * k} fill={look.pants} stroke={INK} strokeWidth={ol} transform={`rotate(${f1((Math.atan2(n.y, n.x) * 180) / Math.PI)} ${f1(pelvisC.x)} ${f1(pelvisC.y)})`} />
      <defs><clipPath id={`${id}-torso`}><path d={torsoD} /></clipPath></defs>
      {coatSkirt}
      <path d={torsoD} fill={look.shirt} />
      <g clipPath={`url(#${id}-torso)`}>
        {look.stripes && [0, 1, 2, 3, 4, 5].map((i) => {
          const a0 = (30 + i * 27) * k, a1 = a0 + 12 * k, wb2 = Math.max(wS, wW) + 30 * k;
          return <path key={i} d={pathOf([T(a0, -wb2), T(a0, wb2), T(a1, wb2), T(a1, -wb2)])} fill={look.stripes} />;
        })}
        {look.overlay && <path d={torsoD} fill={look.overlay.color} />}
        {look.overlay && frontStrip}
        <path d={pathOf(shadePts)} fill={look.overlay ? look.overlay.shade : look.shirtShade} opacity={look.overlay ? 0.9 : look.stripes ? 0.45 : 1} />
        {look.overlay && frontEdges}
      </g>
      {look.nametag && fsc.d > 0.25 && (() => {
        const np = P(add3(add3(j.S, mul3(j.u, -36)), add3(mul3(j.Lc, b.torsoW * 0.5), mul3(j.Fc, b.torsoD))));
        const sx = 0.45 + 0.55 * clamp(fsc.d);
        return <g transform={`translate(${f1(np.x)} ${f1(np.y)}) scale(${f1(k * sx)} ${f1(k)})`}><rect x={-15} y={-9} width={30} height={18} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={ol / k * 0.8} /><rect x={-10} y={-3} width={20} height={4} rx={2} fill="#3F5560" /></g>;
      })()}
      {belt}
      <path d={torsoD} fill="none" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
      {chestBadge}
      {/* neck */}
      <line x1={neckA.x} y1={neckA.y} x2={neckB.x} y2={neckB.y} stroke={INK} strokeWidth={32 * k + ol * 2} strokeLinecap="butt" />
      <line x1={neckA.x} y1={neckA.y} x2={neckB.x} y2={neckB.y} stroke={look.skinShade} strokeWidth={32 * k} strokeLinecap="butt" />
      {look.collar && (() => {
        const c0 = P(add3(j.S, mul3(j.u, 10)));
        return <path d={`M ${f1(c0.x - 22 * k)} ${f1(c0.y - 4 * k)} L ${f1(c0.x)} ${f1(c0.y + 16 * k)} L ${f1(c0.x + 22 * k)} ${f1(c0.y - 4 * k)}`} fill="none" stroke={INK} strokeWidth={ol * 0.9} strokeLinejoin="round" strokeLinecap="round" opacity={clamp(fsc.d + 0.3)} />;
      })()}
      <Head4 id={`${id}-h`} look={look} b={b} j={j} cd={cd} face={pose.face} ol={ol} t={t} />
      {between}
      {frontArms.map((a) => a.node)}
      {front}
      <g data-lw={lwU} />
    </g>
  );
};

/** World-space (card-local) point helper for props attached to a character. */
export const handFrame = (b: Body4, pose: Pose4, side: number) => {
  const j = joints4(b, pose);
  return side > 0 ? {E: j.EL, W: j.WL} : {E: j.ER, W: j.WR};
};
export {len3};
