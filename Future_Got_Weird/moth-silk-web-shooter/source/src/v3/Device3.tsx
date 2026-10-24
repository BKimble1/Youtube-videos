// V3 bridge, frames 66-150: after the hit, a cut along the taut strand back to the lead's wrist shooter (same
// direction on screen), his fingers relaxing; the camera pushes into the cartridge's window until the silk solution
// inside fills the frame, its strands flowing toward the outlet. The lab's silk syringe takes the same view over at
// 150 (Lab3). An explanatory bridge inside an imagined device, not a claim that one was built.
import React from 'react';
import {Man, manJoints, ManPose} from './dc/Man';
import {Cam, Layer} from './dc/camera';
import {fmt, lerp, lerpV, P as Pt, V, add, mul, norm, sub} from './dc/math';
import {mixHand, HAND_RELAXED} from './dc/Hand';
import {mixExpr} from './dc/Head';
import {INK} from './dc/ink';
import {EXPR_FIRE, EXPR_FOCUS, HAND_FIST, HAND_THWIP, HERO} from './cast3';
import {cartWindow, shooterGeo, WristShooter} from './props3';
import {D_BG, D_MID, D_NEAR, Facades, HERO0, HS, Pavement, polar, SA, scr, strandEnds} from './Street3';
import {FLUID_BG, FluidField} from './Fluid3';

export const DV = {start: SA.end, relax0: 68, relax1: 86, push0: 86, fill: 140, end: 150};
/** zoom on the lead's layer when the window has filled the frame; the fluid field is at scale 1 there */
export const Z_FILL = 90;
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));
const ss5 = (f: number, a: number, b: number) => {
  const x = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** after the shot he holds the line: the forearm settles level, the wrist straight, the fingers relax */
/** the aim angle that leaves his forearm exactly level (pointing screen-left), so the cartridge lies level too */
const LEVEL_ANG = (() => {
  const shoulder = manJoints({...HERO0, rWx: 0, rWy: 0}).R.S;
  let lo = -150, hi = -130;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    const T = polar(shoulder, m, 420);
    const j = manJoints({...HERO0, rWx: T.x, rWy: T.y, torso: 8, chest: 6, neck: -12});
    // a level forearm (elbow -> wrist, which the shooter and its window follow) pointing left has dy = 0
    if (j.R.W.y - j.R.E.y < 0) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
})();
export const deviceHeroAt = (f: number) => {
  const shoulder = manJoints({...HERO0, rWx: 0, rWy: 0}).R.S;
  const T = polar(shoulder, LEVEL_ANG, 420);
  const pose: ManPose = {...HERO0, rWx: T.x, rWy: T.y, rWr: 0, torso: 8, chest: 6, neck: -12};
  const hand = mixHand(HAND_THWIP, HAND_RELAXED, ss(f, DV.relax0, DV.relax1));
  return {pose, hand, expr: mixExpr(EXPR_FIRE, EXPR_FOCUS, ss(f, DV.relax0, DV.relax1))};
};
export const deviceGeo = (f: number) => {
  const j = manJoints(deviceHeroAt(f).pose);
  const g = shooterGeo(j.R.E, j.R.W, 17 * HS, -1);
  return {j, g, win: cartWindow(g, 17 * HS)};
};

/** a camera on the lead's layer: zn is that layer's zoom, c its centre (lead-layer world coordinates) */
const nearCam = (c: V, zn: number): Cam => ({x: 540 + (c.x - 540) * D_NEAR, y: 960 + (c.y - 960) * D_NEAR, z: 1 + (zn - 1) * D_NEAR});
export const deviceView = (f: number) => {
  const {g, win} = deviceGeo(f);
  // the cut frames wrist, hand and device large (band right of centre, the hand and the strand to the left)
  const c0 = add(g.band, {x: -150, y: -30});
  const u = ss5(f, DV.push0, DV.fill);
  const zn = Math.exp(lerp(Math.log(2.9), Math.log(Z_FILL), u));
  const c = lerpV(c0, fillPoint(win), ss(f, DV.push0, DV.push0 + 34));
  return {cam: nearCam(c, zn), zn, win, g};
};
/** the cartridge's outlet port (its downstream end, toward the hand) and where the push ends (just inside it) */
export const portPoint = (win: ReturnType<typeof cartWindow>) => add(win.c, mul(win.u, win.a - win.b * 0.42));
export const fillPoint = (win: ReturnType<typeof cartWindow>) => add(win.c, mul(win.u, win.a - win.b * 0.805));
/** the bridge's fluid mapping (field -> lead-layer world): origin at the port, +x along the forearm (the flow) */
export const fluidMap = (win: ReturnType<typeof cartWindow>) => (x: number, y: number): V => {
  const S = 1 / Z_FILL;
  const n = {x: -win.u.y, y: win.u.x};
  return add(portPoint(win), add(mul(win.u, x * S), mul(n, y * S)));
};

/** the screen direction of the taut strand in the hold on the runner, carried across the cut */
const STRAND_SCREEN_DIR = (() => {
  const e = strandEnds(SA.end - 1);
  return norm(sub(e.a, e.o));
})();

export const DeviceScene3: React.FC<{f: number}> = ({f}) => {
  const id = `d${Math.round(f * 100)}`;
  const h = deviceHeroAt(f);
  const {cam, zn, win, g} = deviceView(f);
  const t = f / 30;
  const map = fluidMap(win);
  // visible field range along x (field units), for the fluid's wrap
  const half = Math.hypot(540, 960) / zn * Z_FILL;
  const insideOp = ss(zn, 6, 14);
  const inside = insideOp > 0 ? (
    <g opacity={insideOp}>
      <FluidField map={map} scale={1 / Z_FILL} t={t} xView={[-2 * half, half]} port={0} />
    </g>
  ) : null;
  const o = scr(cam, D_NEAR, g.outlet);
  const far = add(o, mul(STRAND_SCREEN_DIR, 4000));
  const sw = 4 * zn;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${id}-bb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={FLUID_BG} />
      <g filter={`url(#${id}-bb)`}>
        <Layer cam={cam} depth={D_BG}>
          <Facades id={`${id}-fc`} />
        </Layer>
        <Layer cam={cam} depth={D_MID}>
          <Pavement id={`${id}-pv`} />
        </Layer>
      </g>
      {/* the strand, still taut from the outlet toward the runner */}
      <path d={`M${Pt(o)} L${Pt(far)}`} stroke={INK} strokeWidth={fmt(sw + 4)} strokeLinecap="round" />
      <path d={`M${Pt(o)} L${Pt(far)}`} stroke="#FBF8F0" strokeWidth={fmt(sw)} strokeLinecap="round" />
      <Layer cam={cam} depth={D_NEAR}>
        <Man id={`${id}-hr`} pose={h.pose} expr={h.expr} lHand={HAND_FIST} rHand={h.hand} outfit={HERO}
          afterRightArm={<WristShooter id={`${id}-sh`} E={manJoints(h.pose).R.E} W={manJoints(h.pose).R.W} rW={17 * HS} side={-1} ink={(7 * 0.72 * HS) / Math.sqrt(Math.max(1, zn / 3))} fluid={1} inside={inside} />} />
      </Layer>
    </svg>
  );
};
