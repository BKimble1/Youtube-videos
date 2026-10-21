// Starship (ship / upper stage) and Super Heavy (booster), drawn in metres in a local frame:
// origin = centre of the vehicle's base plane (engine gimbal plane), +y DOWN (SVG), so the vehicle extends to negative y.
// One geometry source for every shot; only the pose, lighting and engine state change.
//
// Reference geometry (see FGW_Starship_Dual_Catch_Sources.md):
//   diameter 9 m; full V3 stack ≈ 124.4 m; booster ≈ 72 m; ship ≈ 52 m.
//   Super Heavy V3: 33 Raptor 3 (3 centre + 10 inner ring + 20 outer ring); THREE grid fins, ~50 % larger than V2,
//   mounted lower; the fins carry the catch points; integrated (non-jettisoned) hot-stage ring at the top.
//   Super Heavy V1/V2 (Flights 5–8 catches): FOUR grid fins near the top + separate catch pins; separate hot-stage ring.
//   Ship: windward heat-shield tiles, two small forward flaps (shifted leeward since V2) and two large aft flaps;
//   catch points reported near the forward flaps (exact geometry not published → drawn as small generic hard points).
import React from 'react';
import {NS} from './defs';
import {noise} from '../kit/anim';

export const R = 4.5;
export const BOOSTER_LEN = 72;
export const SHIP_LEN = 52;
export const OUT = '#1c232b';

type Light = 'day' | 'dusk' | 'night';
const steelFill = (light: Light) => (light === 'dusk' ? 'url(#steelCylDusk)' : 'url(#steelCyl)');

/** Engine exhaust plume in the local frame: starts at y=0 and points to +y. */
export const Plume: React.FC<{x?: number; w: number; len: number; k: number; t: number; seed?: number; tint?: 'sea' | 'vac'}> = ({x = 0, w, len, k, t, seed = 0, tint = 'sea'}) => {
  if (k <= 0.01) return null;
  const f = 1 + 0.06 * noise(t * 9, seed) + 0.03 * noise(t * 23, seed + 4);
  const L = len * k * f;
  const W = w * (0.75 + 0.25 * k);
  const outer = `M${x - W * 0.5} 0 C ${x - W * 0.9} ${L * 0.25}, ${x - W * 1.15} ${L * 0.6}, ${x} ${L} C ${x + W * 1.15} ${L * 0.6}, ${x + W * 0.9} ${L * 0.25}, ${x + W * 0.5} 0 Z`;
  const core = `M${x - W * 0.36} 0 C ${x - W * 0.5} ${L * 0.2}, ${x - W * 0.42} ${L * 0.45}, ${x} ${L * 0.62} C ${x + W * 0.42} ${L * 0.45}, ${x + W * 0.5} ${L * 0.2}, ${x + W * 0.36} 0 Z`;
  const diamonds = [0.16, 0.3, 0.43].map((u, i) => (
    <ellipse key={i} cx={x} cy={L * u} rx={W * (0.22 - i * 0.04)} ry={W * 0.12} fill={tint === 'vac' ? '#d9c8ff' : '#ffffff'} opacity={0.55 * k} />
  ));
  return (
    <g>
      <ellipse cx={x} cy={L * 0.35} rx={W * 2.2} ry={L * 0.55} fill="url(#glowWarm)" opacity={0.55 * k} />
      <path d={outer} fill="url(#plumeOuter)" opacity={0.95} />
      <path d={core} fill="url(#plumeCore)" />
      {diamonds}
    </g>
  );
};

/** Raptor bell (side view) hanging below the base plane. */
const Bell: React.FC<{x: number; w: number; h: number; o?: number}> = ({x, w, h, o = 1}) => (
  <path
    d={`M${x - w * 0.22} -0.2 L${x + w * 0.22} -0.2 L${x + w * 0.3} ${h * 0.25} C ${x + w * 0.42} ${h * 0.6}, ${x + w * 0.5} ${h * 0.85}, ${x + w * 0.5} ${h} L${x - w * 0.5} ${h} C ${x - w * 0.5} ${h * 0.85}, ${x - w * 0.42} ${h * 0.6}, ${x - w * 0.3} ${h * 0.25} Z`}
    fill="url(#bell)" stroke={OUT} strokeWidth={1.6} opacity={o} {...NS}
  />
);

// ---------- Super Heavy ----------

type GridFinProps = {phi: number; y: number; span: number; width: number; chord: number; deflect: number; elev: number; catchPt: boolean};
/** One grid fin projected: azimuth phi (deg; 0 = toward camera, 90 = right edge). Deflection = fin rotation about its radial axis. */
const GridFin: React.FC<GridFinProps> = ({phi, y, span, width, chord, deflect, elev, catchPt}) => {
  const p = (phi * Math.PI) / 180;
  const s = Math.sin(p), c = Math.cos(p);
  const e = Math.sin((elev * Math.PI) / 180);
  // corners of the fin's mid-plane (radial r, tangential q) → screen (x, depth)
  const pt = (r: number, q: number) => [r * s + q * c, y - e * (r * c - q * s)] as [number, number];
  const tilt = Math.sin((deflect * Math.PI) / 180) * chord * 0.5;
  const r0 = R - 0.1, r1 = R + span;
  const a = pt(r0, -width / 2), b = pt(r1, -width / 2), cc = pt(r1, width / 2), d = pt(r0, width / 2);
  const top = `M${a[0]} ${a[1] - chord / 2 + tilt} L${b[0]} ${b[1] - chord / 2 + tilt} L${cc[0]} ${cc[1] - chord / 2 - tilt} L${d[0]} ${d[1] - chord / 2 - tilt} Z`;
  const box = (xa: number, ya: number, xb: number, yb: number, t1: number, t2: number) =>
    `M${xa} ${ya - chord / 2 + t1} L${xb} ${yb - chord / 2 + t2} L${xb} ${yb + chord / 2 + t2} L${xa} ${ya + chord / 2 + t1} Z`;
  // visible side faces: the outer tip face and whichever long face points at the camera
  const longFace = c * 1 >= 0 ? box(d[0], d[1], cc[0], cc[1], -tilt, -tilt) : box(a[0], a[1], b[0], b[1], tilt, tilt);
  const tip = box(b[0], b[1], cc[0], cc[1], tilt, -tilt);
  return (
    <g>
      <path d={longFace} fill="#4a5560" stroke={OUT} strokeWidth={1.6} {...NS} />
      <path d={tip} fill="#3a444f" stroke={OUT} strokeWidth={1.6} {...NS} />
      <path d={top} fill="url(#gridLattice)" stroke={OUT} strokeWidth={1.8} {...NS} />
      {catchPt ? (
        <rect x={(a[0] + d[0]) / 2 - 0.55 + s * 0.5} y={(a[1] + d[1]) / 2 + chord / 2 - 0.1} width={1.1} height={0.8} rx={0.15} fill="#e8b23a" stroke={OUT} strokeWidth={1.4} {...NS} />
      ) : null}
    </g>
  );
};

export type BoosterProps = {
  t: number;
  version?: 'v3' | 'v1';
  light?: Light;
  engines?: number;          // 0..1 plume intensity
  plumeLen?: number;         // metres at full intensity
  ring?: 'inner' | 'all';    // which engines fire (landing burn = 13 inner; ascent = all 33)
  finDeflect?: number;       // degrees
  finClock?: number;         // rotation of the fin pattern about the axis (degrees)
  elev?: number;             // camera elevation for fin foreshortening (degrees, + = looking down)
  catchHighlight?: number;   // 0..1 highlight of the catch points
  frost?: number;            // 0..1 frost band on the tanks
  scorch?: number;           // 0..1 soot on the aft end after flight
};

export const Booster: React.FC<BoosterProps> = ({
  t, version = 'v3', light = 'day', engines = 0, plumeLen = 60, ring = 'all', finDeflect = 0, finClock = 0, elev = 16, catchHighlight = 0, frost = 0, scorch = 0,
}) => {
  const L = version === 'v3' ? BOOSTER_LEN : 71;
  const finY = version === 'v3' ? -(L - 9.5) : -(L - 4.6);
  const fins = version === 'v3'
    ? [30, 150, 270].map((a) => a + finClock)
    : [45, 135, 225, 315].map((a) => a + finClock);
  const finGeo = version === 'v3' ? {span: 4.8, width: 5.2, chord: 1.7} : {span: 3.4, width: 3.8, chord: 1.15};
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const back = fins.filter((a) => Math.cos((a * Math.PI) / 180) < 0);
  const front = fins.filter((a) => Math.cos((a * Math.PI) / 180) >= 0);
  const fin = (a: number, i: number) => (
    <GridFin key={i} phi={norm(a)} y={finY} {...finGeo} deflect={finDeflect} elev={elev} catchPt={version === 'v3' && catchHighlight > 0} />
  );
  const welds = [];
  for (let y = -3; y > -L + 2; y -= 1.85) welds.push(<line key={y} x1={-R} x2={R} y1={y} y2={y} stroke="rgba(40,48,56,0.22)" strokeWidth={0.6} {...NS} />);
  const hsTop = -L, hsBot = -L + (version === 'v3' ? 4.2 : 4.0);
  const vents = [];
  for (let i = 0; i < 9; i++) {
    const x = -R + 0.55 + i * ((2 * R - 1.1) / 8);
    vents.push(<rect key={i} x={x - 0.28} y={hsTop + 1.0} width={0.56} height={hsBot - hsTop - 2.0} rx={0.12} fill="#2a3038" />);
  }
  const plumeW = 2.0;
  const engineXs = ring === 'inner' ? [-2.0, -0.7, 0.7, 2.0] : [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6];
  return (
    <g>
      {/* plumes (behind body) */}
      {engines > 0
        ? engineXs.map((x, i) => <Plume key={i} x={x} w={plumeW} len={plumeLen} k={engines} t={t} seed={i} />)
        : null}
      {back.map(fin)}
      {/* engine bells: ascent shows the outer ring skirt edge, inner bells protrude below */}
      {[-2.6, -1.3, 0, 1.3, 2.6].map((x, i) => <Bell key={i} x={x} w={1.25} h={1.5} />)}
      {/* aft skirt + tank */}
      <path d={`M${-R} 0 L${-R} ${-L + 0.5} L${R} ${-L + 0.5} L${R} 0 Z`} fill={steelFill(light)} stroke={OUT} strokeWidth={2.2} {...NS} />
      {welds}
      {frost > 0 ? <rect x={-R} y={-L * 0.62} width={2 * R} height={L * 0.5} fill="#ffffff" opacity={0.35 * frost} /> : null}
      {scorch > 0 ? <rect x={-R} y={-12} width={2 * R} height={12} fill="url(#tileCyl)" opacity={0.55 * scorch} /> : null}
      {/* engine-section skirt band and raceway (conduit) */}
      <rect x={-R} y={-6} width={2 * R} height={6} fill="rgba(60,68,78,0.22)" />
      <rect x={-R} y={-1.4} width={2 * R} height={1.4} fill="#4a525b" opacity={0.85} />
      {[-0.62, 0.62].map((f) => <line key={f} x1={f * R} x2={f * R} y1={-6} y2={-L + 5} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} {...NS} />)}
      <line x1={-R} x2={R} y1={-6} y2={-6} stroke={OUT} strokeWidth={1.2} {...NS} opacity={0.6} />
      <rect x={R - 1.15} y={-L + 6} width={0.75} height={L - 12} rx={0.3} fill="#aab3bc" stroke={OUT} strokeWidth={1.1} {...NS} opacity={0.9} />
      {/* hot-stage ring at the top */}
      <rect x={-R} y={hsTop} width={2 * R} height={hsBot - hsTop} fill="#5f6a76" stroke={OUT} strokeWidth={2} {...NS} />
      {vents}
      <line x1={-R} x2={R} y1={hsBot} y2={hsBot} stroke={OUT} strokeWidth={1.6} {...NS} />
      {/* V1: separate catch pins below the fins */}
      {version === 'v1' ? (
        <>
          <rect x={-R - 1.1} y={finY + 1.6} width={1.2} height={0.9} rx={0.2} fill="#c9a04a" stroke={OUT} strokeWidth={1.4} {...NS} />
          <rect x={R - 0.1} y={finY + 1.6} width={1.2} height={0.9} rx={0.2} fill="#c9a04a" stroke={OUT} strokeWidth={1.4} {...NS} />
        </>
      ) : null}
      {front.map(fin)}
      {catchHighlight > 0 && version === 'v3' ? (
        <g opacity={catchHighlight}>
          {fins.filter((a) => Math.abs(Math.sin((a * Math.PI) / 180)) > 0.4).map((a, i) => {
            const s = Math.sin((a * Math.PI) / 180);
            return <circle key={i} cx={s * (R + 0.6)} cy={finY + 1.1} r={1.6} fill="none" stroke="#ffc93c" strokeWidth={3} {...NS} />;
          })}
        </g>
      ) : null}
    </g>
  );
};

// ---------- Starship (ship) ----------

/** Nose ogive half-width at height h above the cylinder top (0..NOSE). */
const NOSE = 18, CYL = SHIP_LEN - NOSE;
const noseX = (h: number) => R * Math.pow(Math.max(0, 1 - Math.pow(h / NOSE, 1.9)), 0.6);
const nosePath = (side: 1 | -1, steps = 24) => {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const h = (i / steps) * NOSE;
    pts.push(`${side * noseX(h)} ${-CYL - h}`);
  }
  return pts;
};
/** Body outline (cylinder + ogive), closed. */
export const shipOutline = () => {
  const right = nosePath(1);
  const left = nosePath(-1).reverse();
  return `M${-R} 0 L${R} 0 L${R} ${-CYL} L${right.join(' L')} L${left.join(' L')} Z`;
};
export type ShipView = 'profile' | 'belly' | 'three';
// profile: camera looks along the flap axis (windward tiles on the LEFT half, leeward steel on the right; near flaps
//          face the camera at the tile line, far flaps hidden). Used whenever the ship meets the tower arms, whose
//          rails run toward/away from this camera, and for side-on flight.
// belly:   camera looks at the windward (tiled) face; all four flaps stick out at the silhouette edges.
// three:   three-quarter beauty view (tiles on the left ~60 %, flaps at both edges) for standing / stacked shots.

export type ShipProps = {
  t: number;
  view?: ShipView;
  light?: Light;
  engines?: number;
  plumeLen?: number;
  fwdFlap?: number;          // deployment 0 (folded) .. 1 (straight out)
  aftFlap?: number;
  flapTrim?: number;         // -1..1 differential (left vs right / up vs down)
  heat?: number;             // 0..1 tile glow (reentry)
  catchPts?: number;         // 0..1 show the (approximate) catch hard points
  frost?: number;
};

const FWD_Y0 = -CYL - 3.0, FWD_Y1 = -CYL - 10.5;
const AFT_Y0 = -1.2, AFT_Y1 = -12.5;
const xr = (y: number) => (y < -CYL ? noseX(-y - CYL) : R);

/** Edge flap (belly / three views). */
const Flap: React.FC<{side: 1 | -1; y0: number; y1: number; span: number; dep: number; tip: number; steel?: boolean}> = ({side, y0, y1, span, dep, tip, steel}) => {
  const ext = span * (0.2 + 0.8 * Math.max(0, Math.min(1.2, dep)));
  const a = [side * (xr(y0) - 0.2), y0], b = [side * (xr(y1) - 0.2), y1];
  const c = [side * (xr(y1) + ext), y1 - tip], d = [side * (xr(y0) + ext * 0.85), y0 + tip * 0.3];
  const dpath = `M${a[0]} ${a[1]} L${d[0]} ${d[1]} L${c[0]} ${c[1]} L${b[0]} ${b[1]} Z`;
  return (
    <g>
      <path d={dpath} fill={steel ? '#8e98a2' : '#262a30'} stroke={OUT} strokeWidth={2} {...NS} />
      <path d={`M${a[0] + side * 0.4} ${(a[1] + b[1]) / 2} L${(c[0] + d[0]) / 2} ${(c[1] + d[1]) / 2}`} stroke={steel ? '#6d7781' : '#4a535d'} strokeWidth={1} {...NS} />
    </g>
  );
};

/** Near flap seen end-on (profile view): a narrow plate whose tip swings toward the tiles or the steel with deflection. */
const EndFlap: React.FC<{x: number; y0: number; y1: number; dep: number; chord: number}> = ({x, y0, y1, dep, chord}) => {
  // dep 1 = straight at the camera (thin edge only); smaller = folded toward the leeward (right) side
  const swing = (1 - Math.max(0, Math.min(1, dep))) * 3.2;
  const w = chord * (0.45 + 0.55 * (1 - Math.max(0, Math.min(1, dep))));
  const ym = (y0 + y1) / 2;
  return (
    <g>
      <ellipse cx={x + swing * 0.5} cy={ym} rx={w * 0.9 + swing * 0.4} ry={Math.abs(y1 - y0) * 0.5} fill="#000" opacity={0.18} />
      <path
        d={`M${x - w / 2} ${y0} L${x + w / 2} ${y0} L${x + w / 2 + swing} ${y1 * 0.15 + y0 * 0.85} L${x + w / 2 + swing} ${y1 * 0.85 + y0 * 0.15} L${x + w / 2} ${y1} L${x - w / 2} ${y1} Z`}
        fill="#2b3036" stroke={OUT} strokeWidth={2} {...NS}
      />
      <line x1={x} x2={x} y1={y0 - 0.3} y2={y1 + 0.3} stroke="#4c5560" strokeWidth={1} {...NS} />
    </g>
  );
};

export const Ship: React.FC<ShipProps> = ({t, view = 'profile', light = 'day', engines = 0, plumeLen = 45, fwdFlap = 0.7, aftFlap = 0.7, flapTrim = 0, heat = 0, catchPts = 0, frost = 0}) => {
  const outline = shipOutline();
  const edge = view === 'profile' ? 0.0 : view === 'three' ? 0.18 : 1.0; // tile boundary (fraction of half-width)
  const tilePts: string[] = [`${-R} 0`, `${-R} ${-CYL}`];
  for (let i = 0; i <= 24; i++) tilePts.push(`${-noseX((i / 24) * NOSE)} ${-CYL - (i / 24) * NOSE}`);
  for (let i = 24; i >= 0; i--) tilePts.push(`${edge * noseX((i / 24) * NOSE)} ${-CYL - (i / 24) * NOSE}`);
  tilePts.push(`${edge * R} ${-CYL}`, `${edge * R} 0`);
  const tiles = `M${tilePts.join(' L')} Z`;
  const welds = [];
  for (let y = -2.5; y > -CYL; y -= 1.85) welds.push(<line key={y} x1={edge * R} x2={R} y1={y} y2={y} stroke="rgba(40,48,56,0.22)" strokeWidth={0.6} {...NS} />);
  const trimL = 1 - 0.3 * flapTrim, trimR = 1 + 0.3 * flapTrim;
  const fwdX = 0.28 * xr((FWD_Y0 + FWD_Y1) / 2); // forward flaps sit slightly leeward
  const steelFace = view === 'belly' ? false : true;
  return (
    <g>
      {engines > 0 ? (
        <>
          <Plume x={-1.6} w={1.6} len={plumeLen} k={engines} t={t} seed={11} />
          <Plume x={0} w={1.6} len={plumeLen} k={engines} t={t} seed={12} />
          <Plume x={1.6} w={1.6} len={plumeLen} k={engines} t={t} seed={13} />
        </>
      ) : null}
      <Bell x={-3.0} w={2.2} h={1.6} />
      <Bell x={3.0} w={2.2} h={1.6} />
      {[-1.4, 0, 1.4].map((x, i) => <Bell key={i} x={x} w={1.1} h={1.3} />)}
      {view !== 'profile' ? (
        <>
          <Flap side={1} y0={AFT_Y0} y1={AFT_Y1} span={3.8} dep={aftFlap * trimR} tip={1.2} steel={view === 'three'} />
          <Flap side={1} y0={FWD_Y0} y1={FWD_Y1} span={2.6} dep={fwdFlap * trimR} tip={1.0} steel={view === 'three'} />
        </>
      ) : null}
      <path d={outline} fill={steelFill(light)} stroke={OUT} strokeWidth={2.2} {...NS} />
      {steelFace ? welds : null}
      {frost > 0 ? <rect x={-R} y={-CYL + 4} width={2 * R} height={CYL * 0.55} fill="#ffffff" opacity={0.32 * frost} /> : null}
      <path d={tiles} fill="url(#tileCyl)" />
      <path d={tiles} fill="url(#tilesHex)" opacity={0.7} />
      {heat > 0 ? <path d={tiles} fill="#ff7a3a" opacity={0.55 * heat} /> : null}
      {heat > 0 ? <path d={tiles} fill="#ffd2a0" opacity={0.3 * heat * heat} /> : null}
      <path d={outline} fill="none" stroke={OUT} strokeWidth={2.2} {...NS} />
      {view === 'profile' ? (
        <>
          <EndFlap x={0.05} y0={AFT_Y0} y1={AFT_Y1} dep={aftFlap * trimL} chord={1.5} />
          <EndFlap x={fwdX} y0={FWD_Y0} y1={FWD_Y1} dep={fwdFlap * trimL} chord={1.1} />
        </>
      ) : (
        <>
          <Flap side={-1} y0={AFT_Y0} y1={AFT_Y1} span={3.8} dep={aftFlap * trimL} tip={1.2} />
          <Flap side={-1} y0={FWD_Y0} y1={FWD_Y1} span={2.6} dep={fwdFlap * trimL} tip={1.0} />
        </>
      )}
      {catchPts > 0 ? (
        <g opacity={catchPts}>
          {view === 'profile' ? (
            <rect x={fwdX - 0.6} y={shipCatchY - 0.5} width={1.2} height={1.0} rx={0.2} fill="#e8b23a" stroke={OUT} strokeWidth={1.4} {...NS} />
          ) : (
            ([-1, 1] as const).map((sd) => {
              const x0 = sd * xr(shipCatchY);
              return <rect key={sd} x={sd > 0 ? x0 - 0.1 : x0 - 1.0} y={shipCatchY - 0.45} width={1.1} height={0.9} rx={0.2} fill="#e8b23a" stroke={OUT} strokeWidth={1.4} {...NS} />;
            })
          )}
        </g>
      ) : null}
    </g>
  );
};

/** Ship catch point (approximate, below the forward flaps) in the ship's local frame. Profile view: x = shipCatchX. */
export const shipCatchY = -CYL - 3.0 + 1.0;
export const shipCatchX = 0.28 * R;
/** Booster V3 fin/catch level in local frame. */
export const boosterCatchY = (version: 'v3' | 'v1' = 'v3') => (version === 'v3' ? -(BOOSTER_LEN - 9.5) + 0.55 : -(71 - 4.6) + 2.5);
