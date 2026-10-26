// The research remote: a compact handheld controller (70 x 36 x 14 mm) in the crew finish: one ink contour round the
// body, gradient fills from the fixed upper-left key light, glossy highlights. Pale grey/white plastic body with a
// darker side band, a 4-way direction pad on the left half (steering), a round red fire button under a slim raised
// guard ring on the right half, a tiny status LED (green armed, amber just after firing) and a short stubby antenna
// on the top edge. Modelled in millimetres (x along the length, +x = the button half; y across, -y = the top edge;
// z up out of the face) and drawn with a simple tilt projection, so one model serves the face-on close-up and the
// steep view in the operator's hand. The fire button's cap travels down into its guard when pressed.
import React from 'react';
import {Inked, InkLine, InkPath, Deco} from '../../lib/ink';
import {lit, mix, shade} from '../../lib/color';
import {add, clamp, fmt, mul, P, V, rad, sub, dot} from '../../lib/math';
import {Glow, LIGHT, Lin} from '../../lib/shade';

/** dimensions (mm) */
export const REMOTE = {
  L: 70,
  W: 36,
  T: 14,
  r: 9,
  dpad: {x: -17, y: 1.5, arm: 10, w: 3.7, h: 1.4, well: 13},
  btn: {x: 17, y: 1.5, cap: 7.4, hole: 8.6, ring: 10.6, ringH: 1.8, rest: 4.6, pressed: 0.5},
  led: {x: -5, y: -12.6, r: 1.7},
  ant: {x: -23, len: 11, r0: 2.9, r1: 2.3, lean: 22},
};
export const REMOTE_COL = {body: '#E9EDF1', side: '#9AA6B2', fire: '#E0393E', armed: '#3DDC84', fired: '#FFB347', dpad: '#5B6976', ring: '#C5CDD5', ant: '#33404B'};

export type LedArg = 'armed' | 'fired' | number;
/** 0 = green (armed / idle), 1 = amber (just fired) */
export const ledAmount = (led: LedArg | undefined) => (led === undefined || led === 'armed' ? 0 : led === 'fired' ? 1 : clamp(led));

export type RemoteView = {
  /** screen point of the face centre (model origin) */
  c: V;
  /** px per mm */
  k: number;
  /** in-plane rotation (deg, screen convention: + = clockwise); 0 = long axis along +x, antenna up */
  rot: number;
  /** 0 = face-on; larger tips the face back so the near long side (+y) shows below it (deg, 0..80) */
  tilt: number;
};

/** model point (mm) -> screen */
export const remotePt = (v: RemoteView, x: number, y: number, z = 0): V => {
  const ct = Math.cos(rad(v.tilt));
  const st = Math.sin(rad(v.tilt));
  const lx = x * v.k;
  const ly = (y * ct - z * st) * v.k;
  const cr = Math.cos(rad(v.rot));
  const sr = Math.sin(rad(v.rot));
  return {x: v.c.x + lx * cr - ly * sr, y: v.c.y + lx * sr + ly * cr};
};

/** height (mm above the face) of the fire button's cap top for a press amount 0..1 */
export const capTopAt = (press: number) => REMOTE.btn.rest + (REMOTE.btn.pressed - REMOTE.btn.rest) * clamp(press);
/** screen point of the cap top's centre */
export const buttonTop = (v: RemoteView, press = 0) => remotePt(v, REMOTE.btn.x, REMOTE.btn.y, capTopAt(press));

// ------------------------------------------------------------------ geometry helpers (model space)
type M = [number, number];
const rrect = (cx: number, cy: number, hw: number, hh: number, r: number, n = 7): M[] => {
  const out: M[] = [];
  const corner = (ox: number, oy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = rad(a0 + (90 * i) / n);
      out.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
    }
  };
  corner(cx + hw - r, cy - hh + r, -90);
  corner(cx + hw - r, cy + hh - r, 0);
  corner(cx - hw + r, cy + hh - r, 90);
  corner(cx - hw + r, cy - hh + r, 180);
  return out;
};
const circle = (cx: number, cy: number, r: number, n = 40, a0 = 0, a1 = 360): M[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as M;
  });
const poly = (pts: V[], close = true) => `M${pts.map(P).join(' L')}${close ? ' Z' : ''}`;
/** convex hull (monotone chain) */
const hull = (pts: V[]): V[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: V[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

/** the face's outline on screen (closed SVG path), e.g. to clip a shadow cast onto the remote */
export const remoteFacePath = (v: RemoteView) => poly(rrect(0, 0, REMOTE.L / 2, REMOTE.W / 2, REMOTE.r).map(([x, y]) => remotePt(v, x, y, 0)));

type Props = {
  id: string;
  view: RemoteView;
  /** fire button travel 0..1 (0 up, 1 fully down) */
  press?: number;
  /** status LED: 'armed' green, 'fired' amber, or 0..1 between them */
  led?: LedArg;
  /** contour width (as an <Inked> w); default 3.5 k (the crew figure's hand contour for a remote in his hand) */
  ink?: number;
  /** LED glow strength multiplier */
  glow?: number;
  /** skip the antenna (when a hand covers that edge) */
  noAntenna?: boolean;
};

export const Remote: React.FC<Props> = ({id, view: v, press = 0, led, ink, glow = 1, noAntenna}) => {
  const R = REMOTE;
  const C = REMOTE_COL;
  const k = v.k;
  const w = ink ?? 3.5 * k;
  const st = Math.sin(rad(v.tilt));
  const pr = (pts: M[], z: number) => pts.map(([x, y]) => remotePt(v, x, y, z));
  const sweep = (pts: M[], z0: number, z1: number) => hull([...pr(pts, z0), ...pr(pts, z1)]);
  const lightAcross = (c: V, r: number) => ({from: add(c, mul(LIGHT, r)), to: add(c, mul(LIGHT, -r))});

  // body: the face (z = 0) over the side band (the sweep down to the bottom face)
  const face = rrect(0, 0, R.L / 2, R.W / 2, R.r);
  const facePts = pr(face, 0);
  const bodyPts = sweep(face, 0, -R.T);
  const ctr = remotePt(v, 0, 0, 0);
  const halfDiag = Math.hypot(R.L / 2, R.W / 2) * k;
  const fl = lightAcross(ctr, halfDiag);
  const leftEnd = remotePt(v, -R.L / 2, R.W / 2, -R.T / 2);
  const rightEnd = remotePt(v, R.L / 2, R.W / 2, -R.T / 2);
  const down = sub(remotePt(v, 0, 0, -R.T), ctr); // face -> bottom offset on screen
  // the face's near edge (where it meets the side band): its outline from the right extreme round the near side
  const nearEdgeD = st > 0.02 ? (() => {
    const pts = pr(face, 0);
    // walk the outline from the left extreme to the right extreme along the near (+y) side
    const ax = {x: Math.cos(rad(v.rot)), y: Math.sin(rad(v.rot))};
    const iL = pts.reduce((b, p, i) => (dot(p, ax) < dot(pts[b], ax) ? i : b), 0);
    const iR = pts.reduce((b, p, i) => (dot(p, ax) > dot(pts[b], ax) ? i : b), 0);
    const out: V[] = [];
    for (let i = iR; ; i = (i + 1) % pts.length) {
      out.push(pts[i]);
      if (i === iL) break;
    }
    return poly(out, false);
  })() : null;

  // antenna: from the middle of the top side, leaning up out of the face plane
  const la = rad(R.ant.lean);
  const aBase = remotePt(v, R.ant.x, -R.W / 2 + 2, -R.T * 0.45);
  const aDir = sub(remotePt(v, R.ant.x, -R.W / 2 - Math.cos(la), -R.T * 0.45 + Math.sin(la)), remotePt(v, R.ant.x, -R.W / 2, -R.T * 0.45));
  const aLen = Math.hypot(aDir.x, aDir.y);
  const aU = aLen > 1e-6 ? mul(aDir, 1 / aLen) : {x: 0, y: -1};
  const aTip = add(aBase, mul(aU, (R.ant.len + 2) * aLen));
  const aR0 = R.ant.r0 * k;
  const aR1 = R.ant.r1 * k;
  const aN = {x: -aU.y, y: aU.x};
  const antD = `M${P(add(aBase, mul(aN, aR0)))} L${P(add(aTip, mul(aN, aR1)))} A${fmt(aR1)} ${fmt(aR1)} 0 0 0 ${P(add(aTip, mul(aN, -aR1)))} L${P(add(aBase, mul(aN, -aR0)))} Z`;

  // d-pad: two crossing bars in a shallow round well
  const D = R.dpad;
  const barH = rrect(D.x, D.y, D.arm, D.w, D.w * 0.55, 4);
  const barV = rrect(D.x, D.y, D.w, D.arm, D.w * 0.55, 4);
  const dTop = (pts: M[]) => pr(pts, D.h);
  const dSide = (pts: M[]) => sweep(pts, 0, D.h);
  const wellPts = pr(circle(D.x, D.y, D.well, 48), 0);
  const wellC = remotePt(v, D.x, D.y, 0);
  const arrows = [0, 90, 180, 270].map((a) => {
    const c = Math.cos(rad(a));
    const s = Math.sin(rad(a));
    const tip: M = [D.x + c * (D.arm - 1.6), D.y + s * (D.arm - 1.6)];
    const b1: M = [D.x + c * (D.arm - 4.4) - s * 2.0, D.y + s * (D.arm - 4.4) + c * 2.0];
    const b2: M = [D.x + c * (D.arm - 4.4) + s * 2.0, D.y + s * (D.arm - 4.4) - c * 2.0];
    return poly(pr([tip, b1, b2], D.h));
  });
  const dc = remotePt(v, D.x, D.y, D.h);

  // fire button: guard ring, its well, the cap (raised: its red skirt shows; pressed: it sits down in the well)
  const B = R.btn;
  const capTop = capTopAt(press);
  const ringOuter = circle(B.x, B.y, B.ring, 48);
  const ringSide = sweep(ringOuter, 0, B.ringH);
  const ringTop = pr(ringOuter, B.ringH);
  const holePts = pr(circle(B.x, B.y, B.hole, 48), B.ringH);
  const capCircle = circle(B.x, B.y, B.cap, 48);
  const capBase = Math.min(capTop, B.ringH - 0.3);
  const capSide = sweep(capCircle, capBase - 1.2, capTop);
  const capTopPts = pr(capCircle, capTop);
  const capC = remotePt(v, B.x, B.y, capTop);
  const nearRing = [...pr(circle(B.x, B.y, B.ring, 24, 0, 180), B.ringH), ...pr(circle(B.x, B.y, B.hole, 24, 180, 0), B.ringH)];
  const nearHoleEdge = pr(circle(B.x, B.y, B.hole, 24, 0, 180), B.ringH);
  const depth = clamp((B.rest - capTop) / (B.rest - B.pressed)); // 0 up .. 1 down
  const fire = mix(C.fire, shade(C.fire, 0.3), depth * 0.7);
  const capR = B.cap * k;
  const cl = lightAcross(capC, capR);

  // LED
  const amber = ledAmount(led);
  const ledCol = mix(C.armed, C.fired, amber);
  const ledC = remotePt(v, R.led.x, R.led.y, 0.6);
  const ledPts = pr(circle(R.led.x, R.led.y, R.led.r, 28), 0.6);
  const bezel = pr(circle(R.led.x, R.led.y, R.led.r + 0.9, 28), 0.2);

  const IN = w * 0.62;
  return (
    <g>
      {!noAntenna && (
        <Inked w={w * 0.9}>
          <InkPath d={antD} fill={C.ant} />
          <Deco>
            <g>
              <defs>
                <linearGradient id={`${id}-an`} gradientUnits="userSpaceOnUse" x1={fmt(add(aBase, mul(aN, aR0)).x)} y1={fmt(add(aBase, mul(aN, aR0)).y)} x2={fmt(add(aBase, mul(aN, -aR0)).x)} y2={fmt(add(aBase, mul(aN, -aR0)).y)}>
                  <stop offset="0" stopColor={dot(aN, LIGHT) > 0 ? lit(C.ant, 0.35) : shade(C.ant, 0.3)} />
                  <stop offset="0.5" stopColor={C.ant} />
                  <stop offset="1" stopColor={dot(aN, LIGHT) > 0 ? shade(C.ant, 0.3) : lit(C.ant, 0.35)} />
                </linearGradient>
              </defs>
              <path d={antD} fill={`url(#${id}-an)`} />
              <path d={`M${P(add(add(aBase, mul(aU, 2 * k)), mul(aN, (dot(aN, LIGHT) > 0 ? 1 : -1) * aR0 * 0.45)))} L${P(add(add(aTip, mul(aU, -1 * k)), mul(aN, (dot(aN, LIGHT) > 0 ? 1 : -1) * aR1 * 0.45)))}`} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={fmt(0.7 * k)} strokeLinecap="round" />
            </g>
          </Deco>
        </Inked>
      )}
      {/* the body: side band, then the face */}
      <Inked w={w}>
        <Lin id={`${id}-sd`} d={poly(bodyPts)} from={leftEnd} to={rightEnd} stops={[[0, lit(C.side, 0.18)], [0.35, C.side], [1, shade(C.side, 0.3)]]} />
      </Inked>
      <Deco>
        {/* the side band rounds over into the face: a light edge just under it, darker toward the bottom */}
        <Lin id={`${id}-sv`} d={poly(bodyPts)} from={ctr} to={add(ctr, add(down, mul(sub(remotePt(v, 0, R.W / 2, 0), ctr), 1)))} stops={[[0.62, '#FFFFFF', 0], [0.8, '#FFFFFF', 0.22], [0.9, '#1D3346', 0], [1, '#1D3346', 0.18]]} />
        <Lin id={`${id}-fc`} d={poly(facePts)} from={fl.from} to={fl.to} stops={[[0, lit(C.body, 0.7)], [0.42, C.body], [0.8, mix(C.body, '#C9D2DB', 0.6)], [1, '#BCC7D1']]} />
        {/* soft bevel: a bright rim along the lit upper-left edge of the face */}
        <path d={poly(pr(rrect(0, 0, R.L / 2 - 1.3, R.W / 2 - 1.3, R.r - 1.3), 0))} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={fmt(1.1 * k)} strokeDasharray="none" />
        <path d={poly(pr(rrect(0, 0, R.L / 2 - 0.5, R.W / 2 - 0.5, R.r - 0.5), 0))} fill="none" stroke="#7F8C99" strokeOpacity={0.35} strokeWidth={fmt(0.5 * k)} />
        {nearEdgeD && <InkLine d={nearEdgeD} w={IN} />}
        {/* gloss streak on the face, upper left */}
        <path d={poly(pr(rrect(-14, -11.5, 16, 2.1, 2.1, 4), 0))} fill="#FFFFFF" opacity={0.5} />
      </Deco>

      {/* d-pad well and pad */}
      <Deco>
        <defs>
          <linearGradient id={`${id}-wg`} gradientUnits="userSpaceOnUse" x1={fmt(add(wellC, mul(LIGHT, D.well * k)).x)} y1={fmt(add(wellC, mul(LIGHT, D.well * k)).y)} x2={fmt(add(wellC, mul(LIGHT, -D.well * k)).x)} y2={fmt(add(wellC, mul(LIGHT, -D.well * k)).y)}>
            <stop offset="0" stopColor={shade(C.body, 0.22)} />
            <stop offset="0.5" stopColor={mix(C.body, '#D3DAE1', 0.7)} />
            <stop offset="1" stopColor={lit(C.body, 0.6)} />
          </linearGradient>
        </defs>
        <path d={poly(wellPts)} fill={`url(#${id}-wg)`} />
        <InkLine d={poly(wellPts)} w={IN * 0.6} opacity={0.55} />
      </Deco>
      <Inked w={IN}>
        <InkPath d={poly(dSide(barH))} fill={shade(C.dpad, 0.3)} />
        <InkPath d={poly(dSide(barV))} fill={shade(C.dpad, 0.3)} />
      </Inked>
      <Deco>
        <Lin id={`${id}-dh`} d={poly(dTop(barH))} from={add(dc, mul(LIGHT, D.arm * k))} to={add(dc, mul(LIGHT, -D.arm * k))} stops={[[0, lit(C.dpad, 0.3)], [0.5, C.dpad], [1, shade(C.dpad, 0.2)]]} />
        <Lin id={`${id}-dv`} d={poly(dTop(barV))} from={add(dc, mul(LIGHT, D.arm * k))} to={add(dc, mul(LIGHT, -D.arm * k))} stops={[[0, lit(C.dpad, 0.3)], [0.5, C.dpad], [1, shade(C.dpad, 0.2)]]} />
        <ellipse cx={fmt(dc.x)} cy={fmt(dc.y)} rx={fmt(2.1 * k)} ry={fmt(2.1 * k * Math.cos(rad(v.tilt)))} transform={`rotate(${fmt(v.rot)} ${fmt(dc.x)} ${fmt(dc.y)})`} fill={shade(C.dpad, 0.18)} />
        {arrows.map((d, i) => (
          <path key={i} d={d} fill="#C8D1DA" opacity={0.95} />
        ))}
        <path d={poly(pr(rrect(D.x - 4, D.y - 2.2, 5, 0.7, 0.7, 3), D.h))} fill="#FFFFFF" opacity={0.3} />
      </Deco>

      {/* fire button guard ring */}
      <Inked w={IN}>
        <InkPath d={poly(ringSide)} fill={shade(C.ring, 0.25)} />
      </Inked>
      <Deco>
        <Lin id={`${id}-rt`} d={poly(ringTop)} from={add(remotePt(v, B.x, B.y, B.ringH), mul(LIGHT, B.ring * k))} to={add(remotePt(v, B.x, B.y, B.ringH), mul(LIGHT, -B.ring * k))} stops={[[0, lit(C.ring, 0.55)], [0.5, C.ring], [1, shade(C.ring, 0.18)]]} />
        {/* the well inside the ring: dark, so a pressed cap shows a dark rim round it */}
        <path d={poly(holePts)} fill="#3B2328" />
        <InkLine d={poly(holePts)} w={IN * 0.55} />
      </Deco>
      {/* the cap: red skirt + domed top */}
      <Inked w={IN * 0.8}>
        <InkPath d={poly(capSide)} fill={shade(fire, 0.34)} />
      </Inked>
      <Deco>
        <Lin id={`${id}-cs`} d={poly(capSide)} from={remotePt(v, B.x - B.cap, B.y, capTop)} to={remotePt(v, B.x + B.cap, B.y, capTop)} stops={[[0, shade(fire, 0.12)], [0.4, shade(fire, 0.28)], [1, shade(fire, 0.5)]]} />
        <defs>
          <radialGradient id={`${id}-ct`} gradientUnits="userSpaceOnUse" cx={fmt(capC.x)} cy={fmt(capC.y)} r={fmt(capR * 1.15)} fx={fmt(cl.from.x * 0.45 + capC.x * 0.55)} fy={fmt(cl.from.y * 0.45 + capC.y * 0.55)}>
            <stop offset="0" stopColor={lit(fire, 0.42 - 0.18 * depth)} />
            <stop offset="0.45" stopColor={fire} />
            <stop offset="1" stopColor={shade(fire, 0.32)} />
          </radialGradient>
        </defs>
        <path d={poly(capTopPts)} fill={`url(#${id}-ct)`} />
        <InkLine d={poly(capTopPts)} w={IN * 0.5} opacity={0.75} />
        {/* glossy highlight, dimmer when pressed into the well */}
        <ellipse cx={fmt(add(capC, mul(LIGHT, capR * 0.48)).x)} cy={fmt(add(capC, mul(LIGHT, capR * 0.48)).y)} rx={fmt(capR * 0.38)} ry={fmt(capR * 0.2 * (0.55 + 0.45 * Math.cos(rad(v.tilt))))} transform={`rotate(${fmt(-32 + v.rot * 0.5)} ${fmt(add(capC, mul(LIGHT, capR * 0.48)).x)} ${fmt(add(capC, mul(LIGHT, capR * 0.48)).y)})`} fill="#FFFFFF" opacity={0.75 - 0.3 * depth} />
        {/* the near part of the guard ring stays in front of a cap sunk into the well */}
        <path d={poly(nearRing)} fill={mix(C.ring, shade(C.ring, 0.18), 0.6)} />
        <InkLine d={poly(nearHoleEdge, false)} w={IN * 0.55} />
      </Deco>

      {/* status LED */}
      <Deco>
        <path d={poly(bezel)} fill="#4A5763" />
        <defs>
          <radialGradient id={`${id}-ld`} gradientUnits="userSpaceOnUse" cx={fmt(ledC.x)} cy={fmt(ledC.y)} r={fmt(R.led.r * k * 1.1)}>
            <stop offset="0" stopColor={lit(ledCol, 0.75)} />
            <stop offset="0.55" stopColor={ledCol} />
            <stop offset="1" stopColor={shade(ledCol, 0.35)} />
          </radialGradient>
        </defs>
        <path d={poly(ledPts)} fill={`url(#${id}-ld)`} />
        <Glow id={`${id}-lg`} c={ledC} r={R.led.r * k * 3.2} color={ledCol} alpha={0.55 * glow} />
        <circle cx={fmt(ledC.x - 0.55 * k)} cy={fmt(ledC.y - 0.55 * k)} r={fmt(0.45 * k)} fill="#FFFFFF" opacity={0.9} />
      </Deco>
    </g>
  );
};
