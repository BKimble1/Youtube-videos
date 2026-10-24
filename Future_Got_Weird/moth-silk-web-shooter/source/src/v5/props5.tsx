// V2 props in the Death Clock art system (ink contour groups, gradients from the fixed key light): the imagined wrist
// shooter and the stolen bag.
import React from 'react';
import {lit, shade} from './dc/color';
import {Deco, INK, Inked, InkLine, InkPath} from './dc/ink';
import {add, fmt, lerpV, mul, norm, P as Pt, perp, sub, V} from './dc/math';
import {Capsule, Glow, Lin} from './dc/shade';
import {BAG} from './cast5';

/** a rounded box along axis u centred at c (half-length a along u, half-width b across) */
const box = (c: V, u: V, a: number, b: number, r: number) => {
  const n = perp(u);
  const q = (x: number, y: number) => add(c, add(mul(u, x), mul(n, y)));
  const rr = Math.min(r, a, b);
  return `M${Pt(q(-a + rr, -b))} L${Pt(q(a - rr, -b))} Q${Pt(q(a, -b))} ${Pt(q(a, -b + rr))} L${Pt(q(a, b - rr))} Q${Pt(q(a, b))} ${Pt(q(a - rr, b))} L${Pt(q(-a + rr, b))} Q${Pt(q(-a, b))} ${Pt(q(-a, b - rr))} L${Pt(q(-a, -b + rr))} Q${Pt(q(-a, -b))} ${Pt(q(-a + rr, -b))} Z`;
};

export type ShooterGeo = {band: V; outlet: V; dir: V; u: V; n: V};
/** Geometry of the wrist shooter on a forearm E -> W (wrist radius rW). side: which edge of the arm (on screen)
 *  carries the barrel. The outlet sits just past the wrist, under the heel of the hand. */
export const shooterGeo = (E: V, W: V, rW: number, side: 1 | -1): ShooterGeo => {
  const u = norm(sub(W, E));
  const n = mul(perp(u), side);
  const band = add(W, mul(u, -rW * 1.25));
  const outlet = add(add(W, mul(u, rW * 0.55)), mul(n, rW * 1.02));
  return {band, outlet, dir: u, u, n};
};

/** V3: the cartridge's window (a clear strip along the forearm showing the silk solution inside): centre, axis,
 *  half-length and half-width, for the camera's push and the fluid seen through it */
export const cartWindow = (g: ShooterGeo, rW: number) => {
  const cartC = add(g.band, mul(g.n, -rW * 0.15));
  return {c: add(cartC, mul(g.u, -rW * 0.05)), u: g.u, a: rW * 0.82, b: rW * 0.3, r: rW * 0.26};
};
export const windowPath = (w: ReturnType<typeof cartWindow>) => box(w.c, w.u, w.a, w.b, w.r);

/** V4: the cutaway's geometry: the cartridge port, the channel down to the barrel, and the barrel to the outlet */
export const cutGeo = (g: ShooterGeo, rW: number) => {
  const win = cartWindow(g, rW);
  const port = add(win.c, mul(g.u, win.a - win.b * 0.42));
  const join = add(port, mul(g.n, rW * 1.17));
  return {port, join, outlet: g.outlet, rBarrel: rW * 0.15, rChannel: rW * 0.09};
};
/** a point along the material's path (0 the port, ~0.4 the junction, 1 the outlet) */
export const pathAt = (cg: ReturnType<typeof cutGeo>, t: number): V => {
  const l1 = Math.hypot(cg.join.x - cg.port.x, cg.join.y - cg.port.y);
  const l2 = Math.hypot(cg.outlet.x - cg.join.x, cg.outlet.y - cg.join.y);
  const d = t * (l1 + l2);
  return d <= l1 ? add(cg.port, mul(sub(cg.join, cg.port), d / l1)) : add(cg.join, mul(sub(cg.outlet, cg.join), (d - l1) / l2));
};
export const WristShooter: React.FC<{id: string; E: V; W: V; rW: number; side: 1 | -1; ink: number; fire?: number; fluid?: number; inside?: React.ReactNode; cut?: number; barrelInside?: React.ReactNode; pulse?: number}> = ({id, E, W, rW, side, ink, fire = 0, fluid = 0.8, inside, cut = 0, barrelInside, pulse = -1}) => {
  const g = shooterGeo(E, W, rW, side);
  const {u, n} = g;
  const bandD = box(g.band, u, rW * 0.62, rW * 1.2, rW * 0.35);
  const cartC = add(g.band, mul(n, -rW * 0.15));
  const cartD = box(cartC, u, rW * 0.95, rW * 0.42, rW * 0.4);
  const win = cartWindow(g, rW);
  const winD = windowPath(win);
  const barrelA = add(g.band, mul(n, rW * 1.02));
  return (
    <g>
      <Inked w={ink}>
        <Lin id={`${id}-bd`} d={bandD} from={add(g.band, mul(n, -rW * 1.2))} to={add(g.band, mul(n, rW * 1.2))} stops={[[0, lit('#2C4656', 0.25)], [0.5, '#2C4656'], [1, shade('#2C4656', 0.35)]]} />
        <Capsule id={`${id}-br`} a={barrelA} b={g.outlet} ra={rW * 0.26} rb={rW * 0.2} color="#B9C7D2" spec={0.25} k={0.9} />
        <Lin id={`${id}-ct`} d={cartD} from={add(cartC, mul(n, -rW * 0.42))} to={add(cartC, mul(n, rW * 0.42))} stops={[[0, lit('#FFC744', 0.3)], [0.55, '#FFC744'], [1, shade('#FFC744', 0.3)]]} />
      </Inked>
      <Deco>
        <path d={winD} fill="#FFF3C9" />
        <defs>
          <clipPath id={`${id}-wc`}>
            <path d={winD} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-wc)`}>
          <path d={box(add(win.c, mul(u, -win.a * (1 - fluid))), u, win.a * fluid, win.b, win.r)} fill="#F2D98E" />
          {inside}
          {/* the outlet port at the downstream end of the cartridge */}
          <circle cx={fmt(add(win.c, mul(u, win.a - win.b * 0.42)).x)} cy={fmt(add(win.c, mul(u, win.a - win.b * 0.42)).y)} r={fmt(win.b * 0.2)} fill="#5C4520" />
          <path d={`M${Pt(add(win.c, add(mul(u, -win.a), mul(n, -win.b * 0.55))))} L${Pt(add(win.c, add(mul(u, win.a), mul(n, -win.b * 0.55))))}`} stroke="#FFFFFF" strokeWidth={fmt(win.b * 0.22)} opacity={0.45} strokeLinecap="round" />
        </g>
        <InkLine d={winD} w={ink * 0.5} />
        <InkLine d={`M${Pt(add(g.band, add(mul(u, -rW * 0.62), mul(n, rW * 0.7))))} L${Pt(add(g.band, add(mul(u, rW * 0.62), mul(n, rW * 0.7))))}`} w={ink * 0.45} opacity={0.6} />
        <circle cx={fmt(g.outlet.x)} cy={fmt(g.outlet.y)} r={fmt(rW * 0.11)} fill="#1D2B36" />
      </Deco>
      {cut > 0.001 && (() => {
        // V4 cutaway: the housing opened between the cartridge's port and the barrel, the barrel shown in section
        const cg = cutGeo(g, rW);
        const cav = box(lerpV(cg.port, cg.join, 0.5), n, rW * 0.62, rW * 0.24, rW * 0.12);
        const bar = box(lerpV(cg.join, cg.outlet, 0.5), u, Math.hypot(cg.outlet.x - cg.join.x, cg.outlet.y - cg.join.y) / 2 + rW * 0.05, cg.rBarrel, cg.rBarrel * 0.9);
        const pp = pulse >= 0 ? [pathAt(cg, Math.max(0, pulse - 0.06)), pathAt(cg, Math.min(1, pulse + 0.06))] : null;
        return (
          <g opacity={cut}>
            <path d={cav} fill="#1C2E39" stroke={INK} strokeWidth={fmt(ink * 0.5)} />
            <path d={`M${Pt(cg.port)} L${Pt(cg.join)}`} stroke={INK} strokeWidth={fmt(cg.rChannel * 2 + ink * 0.5)} strokeLinecap="round" />
            <path d={`M${Pt(cg.port)} L${Pt(cg.join)}`} stroke="#F2D98E" strokeWidth={fmt(cg.rChannel * 2)} strokeLinecap="round" />
            <path d={bar} fill="#F2D98E" stroke={INK} strokeWidth={fmt(ink * 0.5)} />
            <defs>
              <clipPath id={`${id}-bc`}>
                <path d={bar} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-bc)`}>
              {barrelInside}
              <path d={`M${Pt(add(cg.join, mul(n, -cg.rBarrel * 0.55)))} L${Pt(add(cg.outlet, mul(n, -cg.rBarrel * 0.55)))}`} stroke="#FFFFFF" strokeWidth={fmt(cg.rBarrel * 0.22)} opacity={0.45} strokeLinecap="round" />
            </g>
            {pp && <path d={`M${Pt(pp[0])} L${Pt(pp[1])}`} stroke="#FFF6D6" strokeWidth={fmt(cg.rChannel * 1.3)} strokeLinecap="round" opacity={0.95} />}
          </g>
        );
      })()}
      {fire > 0.01 && <Glow id={`${id}-fg`} c={g.outlet} r={rW * 1.6} color="#FFF4D0" alpha={0.55 * fire} />}
    </g>
  );
};

/** the stolen bag hanging from a hand point by its strap (swing angle in deg; 0 = straight down) */
export const Bag: React.FC<{id: string; hand: V; swing: number; s: number; ink: number}> = ({id, hand, swing, s, ink}) => {
  const a = (swing * Math.PI) / 180;
  const d = {x: -Math.sin(a), y: Math.cos(a)};
  const n = perp(d);
  const top = add(hand, mul(d, 38 * s));
  const c = add(top, mul(d, 46 * s));
  const q = (x: number, y: number) => add(c, add(mul(n, x * s), mul(d, y * s)));
  const body = `M${Pt(q(-62, -40))} Q${Pt(q(0, -52))} ${Pt(q(62, -40))} L${Pt(q(70, 36))} Q${Pt(q(0, 50))} ${Pt(q(-70, 36))} Z`;
  return (
    <g>
      <InkLine d={`M${Pt(q(-40, -44))} Q${Pt(hand)} ${Pt(q(40, -44))}`} w={ink * 2.2} color={BAG.strap} />
      <Inked w={ink}>
        <Lin id={`${id}-b`} d={body} from={q(-60, -40)} to={q(60, 40)} stops={[[0, lit(BAG.body, 0.25)], [0.55, BAG.body], [1, BAG.deep]]} />
      </Inked>
      <Deco>
        <path d={`M${Pt(q(-60, -18))} Q${Pt(q(0, -28))} ${Pt(q(60, -18))}`} fill="none" stroke={BAG.deep} strokeWidth={fmt(5 * s)} />
        <circle cx={fmt(q(0, -8).x)} cy={fmt(q(0, -8).y)} r={fmt(7 * s)} fill="#F3E2B0" stroke={BAG.strap} strokeWidth={fmt(2 * s)} />
        <ellipse cx={fmt(q(-30, -30).x)} cy={fmt(q(-30, -30).y)} rx={fmt(18 * s)} ry={fmt(5 * s)} fill="#FFFFFF" opacity={0.35} />
      </Deco>
    </g>
  );
};
