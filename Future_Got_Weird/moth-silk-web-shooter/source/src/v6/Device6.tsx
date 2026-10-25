// V4 bridge, frames 30-140: one continuous action from the hit into the working (imagined) device. The cut at 30
// follows the taut strand back to the lead's wrist shooter, with the camera already pushing toward the cartridge
// window while the hand settles from firing; by 50 the window's edges have left the frame and the silk solution
// inside fills it; a brighter pulse of it is driven to the cartridge's port (50-76) as the strands draw together;
// the camera pulls out into a connected cutaway (port -> channel -> barrel -> outlet) following the pulse, and a
// cohesive strand begins to form and leave the outlet (from about 100). At 140 the barrel, its flow and its place on
// screen are matched by the lab's silk syringe (Lab4). An explanatory bridge inside an imagined device, not a claim
// that one was built.
import React from 'react';
import {Man, manJoints, ManPose} from './dc/Man';
import {Cam, Layer} from './dc/camera';
import {add, clamp, fmt, lerp, lerpV, mul, norm, P as Pt, sub, V} from './dc/math';
import {mixHand, HAND_RELAXED} from './dc/Hand';
import {mixExpr} from './dc/Head';
import {INK} from './dc/ink';
import {EXPR_FIRE, EXPR_FOCUS, HAND_FIST, HAND_THWIP, HERO} from './cast6';
import {cartWindow, cutGeo, pathAt, shooterGeo, WristShooter} from './props6';
import {D_BG, D_MID, D_NEAR, Facades, HERO0, HS, Pavement, polar, SA, scr, strandEnds} from './Street6';
import {FLUID_BG, FluidField} from './Fluid6';

export const DV = {start: SA.end, fill: 46, port: 62, cut0: 60, cut1: 63, strand0: 80, end: 120};
const RW = 17 * HS;
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));

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
/** after the shot he holds the line: the forearm level, a small recoil still settling, the fingers relaxing */
export const deviceHeroAt = (f: number) => {
  const shoulder = manJoints({...HERO0, rWx: 0, rWy: 0}).R.S;
  const settle = 8 * Math.exp(-(f - DV.start) / 4) * Math.cos((f - DV.start) * 0.5);
  const T = polar(shoulder, LEVEL_ANG, 420 - settle);
  const pose: ManPose = {...HERO0, rWx: T.x, rWy: T.y, rWr: 0, torso: 8, chest: 6, neck: -12};
  const hand = mixHand(HAND_THWIP, HAND_RELAXED, ss(f, DV.start, DV.start + 14));
  return {pose, hand, expr: mixExpr(EXPR_FIRE, EXPR_FOCUS, ss(f, DV.start, DV.start + 12))};
};
/** the geometry is taken from the settled pose, so the camera's targets do not shake with the recoil */
const GEO = (() => {
  const j = manJoints(deviceHeroAt(DV.end).pose);
  const g = shooterGeo(j.R.E, j.R.W, RW, -1);
  return {j, g, win: cartWindow(g, RW), cg: cutGeo(g, RW)};
})();
export const deviceGeo = (f: number) => {
  const j = manJoints(deviceHeroAt(f).pose);
  const g = shooterGeo(j.R.E, j.R.W, RW, -1);
  return {j, g, win: cartWindow(g, RW), cg: cutGeo(g, RW)};
};

/** a camera on the lead's layer: zn is that layer's zoom, c its centre (lead-layer world coordinates) */
const nearCam = (c: V, zn: number): Cam => ({x: 540 + (c.x - 540) * D_NEAR, y: 960 + (c.y - 960) * D_NEAR, z: 1 + (zn - 1) * D_NEAR});
export const portPoint = (win: ReturnType<typeof cartWindow>) => add(win.c, mul(win.u, win.a - win.b * 0.42));
const fillPoint = add(GEO.win.c, mul(GEO.win.u, GEO.win.a - GEO.win.b * 0.805));
/** the cutaway framing: the cartridge's port, the channel, the barrel and the outlet with room for the strand */
const CUT_C = lerpV(GEO.cg.port, GEO.cg.outlet, 0.62);
type K = {f: number; c: V; z: number; ease: (u: number) => number};
const easeOut = (u: number) => 1 - (1 - u) ** 2;
const smooth = (u: number) => u * u * (3 - 2 * u);
const KEYS: K[] = [
  {f: DV.start, c: add(GEO.win.c, mul(GEO.win.u, -RW * 0.3)), z: 3.8, ease: smooth},
  // already pushing on arrival (ease-out: full speed at the cut); the window's edges leave the frame by 46
  {f: DV.fill, c: fillPoint, z: 95, ease: easeOut},
  // the pulse driven to the port
  {f: DV.port, c: GEO.cg.port, z: 42, ease: smooth},
  // out into the cutaway, following the pulse down the channel into the barrel
  {f: 84, c: lerpV(GEO.cg.join, GEO.cg.outlet, 0.25), z: 14, ease: smooth},
  // along the barrel toward the outlet while the strand forms and runs out of the frame
  {f: DV.end, c: add(GEO.cg.outlet, mul(GEO.g.u, RW * 0.25)), z: 18, ease: smooth},
];
export const deviceView = (f: number) => {
  let c = KEYS[0].c;
  let zn = KEYS[0].z;
  for (let i = 1; i < KEYS.length; i++) {
    const a = KEYS[i - 1];
    const b = KEYS[i];
    if (f <= b.f || i === KEYS.length - 1) {
      const u = b.ease(clamp((f - a.f) / (b.f - a.f)));
      zn = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u));
      // the centre moves with 1/z, so a deep zoom travels evenly
      const w = Math.abs(1 / b.z - 1 / a.z) > 1e-6 ? (1 / zn - 1 / a.z) / (1 / b.z - 1 / a.z) : u;
      c = lerpV(a.c, b.c, w);
      break;
    }
  }
  const {g, win, cg} = deviceGeo(f);
  return {cam: nearCam(c, zn), zn, win, g, cg};
};
/** the cartridge's fluid mapping (field -> lead-layer world): origin at the port, +x along the forearm (the flow) */
export const FILL_Z = 95;
export const fluidMap = (win: ReturnType<typeof cartWindow>) => (x: number, y: number): V => {
  const S = 1 / FILL_Z;
  const n = {x: -win.u.y, y: win.u.x};
  return add(portPoint(win), add(mul(win.u, x * S), mul(n, y * S)));
};
/** the barrel's fluid mapping: origin at the outlet; its scale on screen at DV.end is what the lab syringe takes over */
export const BARREL_S = (GEO.cg.rBarrel * 0.95) / 900;
export const barrelMap = (cg: ReturnType<typeof cutGeo>, u: V) => (x: number, y: number): V => {
  const n = {x: -u.y, y: u.x};
  return add(cg.outlet, add(mul(u, x * BARREL_S), mul(n, y * BARREL_S)));
};
/** the pulse's place along the path (port 0 .. outlet 1) */
export const pulseAt = (f: number) => (f < DV.port - 14 ? -1 : clamp((f - (DV.port - 14)) / (DV.strand0 - (DV.port - 14))) * 1.0);
/** the strand formed at the outlet: its length (lead-layer units) */
export const strandLen = (f: number) => RW * 14 * clamp((f - DV.strand0 + 2) / 36) ** 1.15;
/** the match for the lab: where the barrel and its outlet are on screen at DV.end, and its scale */
export const deviceMatch = () => {
  const v = deviceView(DV.end);
  const o = scr(v.cam, D_NEAR, v.cg.outlet);
  const j = scr(v.cam, D_NEAR, v.cg.join);
  return {outlet: o, join: j, half: v.cg.rBarrel * v.zn, fieldPx: BARREL_S * v.zn, t: DV.end / 30};
};

/** the screen direction of the taut strand in the hold on the runner, carried across the cut */
const STRAND_SCREEN_DIR = (() => {
  const e = strandEnds(SA.end - 1);
  return norm(sub(e.a, e.o));
})();

export const DeviceScene6: React.FC<{f: number}> = ({f}) => {
  const id = `d${Math.round(f * 100)}`;
  const h = deviceHeroAt(f);
  const {cam, zn, win, g, cg} = deviceView(f);
  const t = f / 30;
  const map = fluidMap(win);
  const half = (Math.hypot(540, 960) / zn) * FILL_Z;
  // the strands draw together toward the port as the pulse is driven there
  const pair = 0.4 + 0.5 * ss(f, DV.fill, DV.port);
  const insideOp = ss(zn, 5, 12);
  const pulseCart = f >= DV.fill - 6 && f < DV.port + 4 ? clamp((f - (DV.fill - 6)) / (DV.port - DV.fill + 6)) : -1;
  const inside =
    insideOp > 0 ? (
      <g opacity={insideOp}>
        <FluidField map={map} scale={1 / FILL_Z} t={t} xView={[-2 * half, half]} port={0} pair={pair} speed={260 + 200 * ss(f, DV.fill, DV.port)} density={2.4} />
        {pulseCart >= 0 && (() => {
          // a brighter slug of the solution moving down the cartridge to its port
          const x = lerp(-1700, 0, pulseCart);
          const a = map(x - 420, 0);
          const b = map(x, 0);
          return <path d={`M${Pt(a)} L${Pt(b)}`} stroke="#FFF2C4" strokeWidth={fmt((260 / FILL_Z) * (1 - 0.5 * pulseCart))} strokeLinecap="round" opacity={0.85} />;
        })()}
      </g>
    ) : null;
  const bmap = barrelMap(cg, g.u);
  const barrelInside = (
    <g>
      <FluidField map={bmap} scale={BARREL_S} t={t} xView={[-3000, 200]} port={0} pair={0.7} speed={420} />
    </g>
  );
  const cut = ss(f, DV.cut0, DV.cut1);
  // the strand forming at the outlet: cohesive, slightly wavy, thinning as it leaves
  const L = strandLen(f);
  const strand = L > 1 ? (() => {
    const N = 16;
    const pts = Array.from({length: N + 1}, (_, i) => {
      const s = (i / N) * L;
      return add(add(cg.outlet, mul(g.u, s)), mul(g.n, (s * s) / (RW * 60) + Math.sin(s / (RW * 1.4) - t * 5) * RW * 0.05 * (s / (RW * 4))));
    });
    const d = `M${pts.map(Pt).join(' L')}`;
    const w = RW * 0.12;
    return (
      <g>
        <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 2.2 / Math.sqrt(zn))} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#FBF6E6" strokeWidth={fmt(w)} strokeLinecap="round" />
      </g>
    );
  })() : null;
  const o = scr(cam, D_NEAR, g.outlet);
  const far = add(o, mul(STRAND_SCREEN_DIR, 4000));
  const sw = 4 * zn;
  // the hit's strand is still taut at the cut and is released as the camera goes in
  const oldStrand = 1 - ss(f, DV.start + 6, DV.start + 14);
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
      {oldStrand > 0.01 && (
        <g opacity={oldStrand}>
          <path d={`M${Pt(o)} L${Pt(far)}`} stroke={INK} strokeWidth={fmt(sw + 4)} strokeLinecap="round" />
          <path d={`M${Pt(o)} L${Pt(far)}`} stroke="#FBF8F0" strokeWidth={fmt(sw)} strokeLinecap="round" />
        </g>
      )}
      <Layer cam={cam} depth={D_NEAR}>
        <Man id={`${id}-hr`} pose={h.pose} expr={h.expr} lHand={HAND_FIST} rHand={h.hand} outfit={HERO}
          afterRightArm={
            <g>
              <WristShooter id={`${id}-sh`} E={manJoints(h.pose).R.E} W={manJoints(h.pose).R.W} rW={RW} side={-1} ink={(7 * 0.72 * HS) / Math.sqrt(Math.max(1, zn / 3))} fluid={1} inside={inside} cut={cut} barrelInside={barrelInside} pulse={pulseAt(f)} />
              {strand}
            </g>
          } />
      </Layer>
    </svg>
  );
};
