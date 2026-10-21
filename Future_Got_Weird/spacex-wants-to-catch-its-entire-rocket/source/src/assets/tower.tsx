// Launch-and-catch tower ("Mechazilla"), metres, local frame: tower base centre at (0,0), +y down, vehicles to the +x side.
// Side (broadside) view: the camera looks across the arms, so the near arm is drawn in front of a caught vehicle and the
// far arm behind it. Arms rotate about vertical hinges on the carriage; opening by θ foreshortens them to L·cosθ.
// Plan view: same geometry from above (x right, z toward the camera = down the screen).
import React from 'react';
import {NS} from './defs';
import {OUT, R} from './vehicles';

export const TOWER_W = 12;
export const TOWER_H = 146;
export const HINGE_X = TOWER_W / 2 + 1.6;   // arm hinge line (carriage face)
export const ARM_LEN = 24;                 // V3 "shorter chopsticks" (exact length not published; proportion only)
export const ARM_OLD_LEN = 30;             // first-generation arms (proportion only)
export const ARM_Z = 6.0;                  // half spacing between the arms (plan)
export const VEH_X = HINGE_X + 14;         // vehicle centreline when lined up
export const MOUNT_H = 14;                 // launch-mount top (stack base)
export const ARM_DEPTH = 3.0;

type Light = 'day' | 'dusk' | 'night';

/** Lattice tower (no carriage/arms). */
export const TowerFrame: React.FC<{light?: Light; top?: number}> = ({light = 'day', top = TOWER_H}) => {
  const hw = TOWER_W / 2;
  const bays: React.ReactNode[] = [];
  const bay = 7.3;
  for (let y = 0; y > -top + 0.1; y -= bay) {
    const y2 = Math.max(-top, y - bay);
    bays.push(
      <g key={y}>
        <line x1={-hw} x2={hw} y1={y2} y2={y2} stroke="#2a323b" strokeWidth={2} {...NS} />
        <line x1={-hw} x2={0} y1={y} y2={y2} stroke="#46525e" strokeWidth={1.4} {...NS} />
        <line x1={0} x2={-hw} y1={y} y2={y2} stroke="#46525e" strokeWidth={1.4} {...NS} />
        <line x1={0} x2={hw} y1={y} y2={y2} stroke="#46525e" strokeWidth={1.4} {...NS} />
        <line x1={hw} x2={0} y1={y} y2={y2} stroke="#46525e" strokeWidth={1.4} {...NS} />
      </g>,
    );
  }
  const shade = light === 'night' ? 0.35 : light === 'dusk' ? 0.15 : 0;
  return (
    <g>
      {/* back face (darker, seen through the lattice) */}
      <rect x={-hw} y={-top} width={TOWER_W} height={top} fill="#25303a" opacity={0.22} />
      {bays.map((b, i) => <g key={`bk${i}`} transform="translate(1.1 -1.6)" opacity={0.45}>{b}</g>)}
      {bays}
      {/* corner columns */}
      {[-hw, -hw / 3, hw / 3, hw].map((x, i) => (
        <rect key={i} x={x - (i % 3 === 0 ? 0.7 : 0.35)} y={-top} width={i % 3 === 0 ? 1.4 : 0.7} height={top} fill="url(#towerSteel)" stroke={OUT} strokeWidth={1.4} {...NS} />
      ))}
      {/* carriage rails on the vehicle side */}
      <rect x={hw + 0.2} y={-top + 4} width={0.8} height={top - 6} fill="#77838f" stroke={OUT} strokeWidth={1.2} {...NS} />
      {/* top: crown + lightning mast */}
      <rect x={-hw - 0.8} y={-top - 2.2} width={TOWER_W + 1.6} height={2.4} fill="#3e4954" stroke={OUT} strokeWidth={1.6} {...NS} />
      <rect x={-0.35} y={-top - 12} width={0.7} height={10} fill="#56626e" stroke={OUT} strokeWidth={1.2} {...NS} />
      {shade > 0 ? <rect x={-hw - 1} y={-top - 12} width={TOWER_W + 2} height={top + 12} fill="#0a0f18" opacity={shade} /> : null}
    </g>
  );
};

/** Carriage block that rides the tower; arms hang from its +x face. */
export const Carriage: React.FC<{y: number}> = ({y}) => (
  <g>
    <rect x={-TOWER_W / 2 - 1.2} y={y - 4} width={TOWER_W + 2.8} height={9} rx={0.6} fill="#58646f" stroke={OUT} strokeWidth={2} {...NS} />
    <rect x={-TOWER_W / 2 - 0.4} y={y - 3} width={TOWER_W + 1.2} height={1.2} fill="#7b8793" />
    <rect x={HINGE_X - 1.2} y={y - 4.5} width={1.6} height={10} fill="#46515c" stroke={OUT} strokeWidth={1.6} {...NS} />
    {/* hoist cables to the crown */}
    <line x1={-2.4} x2={-2.4} y1={y - 4} y2={-TOWER_H} stroke="#202830" strokeWidth={1.1} {...NS} />
    <line x1={2.4} x2={2.4} y1={y - 4} y2={-TOWER_H} stroke="#202830" strokeWidth={1.1} {...NS} />
  </g>
);

/** One chopstick arm in side view. y = top-rail level. open = θ in degrees (0 = closed). */
export const Arm: React.FC<{y: number; open: number; len?: number; near: boolean; ghost?: boolean}> = ({y, open, len = ARM_LEN, near, ghost}) => {
  const L = len * Math.cos((open * Math.PI) / 180);
  const x0 = HINGE_X, x1 = HINGE_X + L;
  const d = ARM_DEPTH * (near ? 1 : 0.92);
  const taper = 0.55;
  const path = `M${x0} ${y} L${x1} ${y} L${x1} ${y + d * taper} L${x0} ${y + d} Z`;
  const struts: React.ReactNode[] = [];
  const n = Math.max(2, Math.round(L / 3.2));
  for (let i = 0; i < n; i++) {
    const xa = x0 + (i / n) * L, xb = x0 + ((i + 1) / n) * L;
    const yb = (x: number) => y + d - (d - d * taper) * ((x - x0) / Math.max(1, L));
    struts.push(<line key={i} x1={xa} y1={i % 2 ? y + 0.4 : yb(xa) - 0.3} x2={xb} y2={i % 2 ? yb(xb) - 0.3 : y + 0.4} stroke="#2a323b" strokeWidth={1.2} {...NS} />);
  }
  if (ghost) return <path d={path} fill="none" stroke="#ffc93c" strokeWidth={2.5} strokeDasharray="8 6" {...NS} />;
  return (
    <g>
      <path d={path} fill={near ? 'url(#armSteel)' : '#3b4550'} stroke={OUT} strokeWidth={2} {...NS} />
      {struts}
      {/* top rail the catch points land on */}
      <rect x={x0 + 1} y={y - 0.45} width={Math.max(0, L - 1.4)} height={0.55} fill={near ? '#d8dee4' : '#8a96a2'} stroke={OUT} strokeWidth={1.2} {...NS} />
    </g>
  );
};

/** Launch mount (simplified Pad-2-style table over a flame trench) centred at x. */
export const Mount: React.FC<{x: number}> = ({x}) => (
  <g>
    <path d={`M${x - 12} 0 L${x - 8} ${-MOUNT_H} L${x + 8} ${-MOUNT_H} L${x + 12} 0 Z`} fill="#8d8a84" stroke={OUT} strokeWidth={2} {...NS} />
    <rect x={x - 8.5} y={-MOUNT_H - 1.6} width={17} height={1.8} fill="#5b636b" stroke={OUT} strokeWidth={1.6} {...NS} />
    <path d={`M${x - 5} 0 L${x - 3.5} ${-MOUNT_H + 4} L${x + 3.5} ${-MOUNT_H + 4} L${x + 5} 0 Z`} fill="#3a3a3a" opacity={0.75} />
    {[-6, -2, 2, 6].map((dx) => (
      <line key={dx} x1={x + dx} x2={x + dx * 1.35} y1={-MOUNT_H} y2={0} stroke="#6c6a66" strokeWidth={1.2} {...NS} />
    ))}
  </g>
);

/** Ground strip, pad apron and distant Starbase skyline (local x range ±600). */
export const Ground: React.FC<{light?: Light; x0?: number; x1?: number}> = ({light = 'day', x0 = -600, x1 = 600}) => {
  const g = light === 'night' ? '#2c3530' : light === 'dusk' ? '#5d5a4c' : '#b9ad8c';
  const g2 = light === 'night' ? '#222a26' : light === 'dusk' ? '#4a4a40' : '#a39878';
  return (
    <g>
      <rect x={x0} y={0} width={x1 - x0} height={60} fill={g} />
      <rect x={x0} y={0} width={x1 - x0} height={1.2} fill={g2} />
      <rect x={-40} y={0} width={110} height={2} fill="#9b9890" opacity={0.8} />
      {/* tank farm and hangars in the distance */}
      {[-140, -120, -100].map((x, i) => (
        <g key={i}>
          <rect x={x} y={-14} width={10} height={14} rx={1} fill={light === 'night' ? '#38424c' : '#d9dee2'} stroke={OUT} strokeWidth={1} {...NS} />
          <ellipse cx={x + 5} cy={-14} rx={5} ry={1.2} fill={light === 'night' ? '#46515c' : '#eef1f3'} stroke={OUT} strokeWidth={1} {...NS} />
        </g>
      ))}
      <rect x={110} y={-18} width={46} height={18} fill={light === 'night' ? '#323b44' : '#c8ced4'} stroke={OUT} strokeWidth={1} {...NS} />
    </g>
  );
};

export type TowerProps = {
  light?: Light;
  carY: number;          // top-rail level of the arms (negative)
  openNear: number;      // degrees
  openFar: number;
  armLen?: number;
  vehicle?: React.ReactNode;     // drawn between the far and near arms, already positioned in tower coordinates
  showMount?: boolean;
  qd?: boolean;
  ghostOldArms?: number;         // 0..1 dashed outline of the longer first-generation arms
};

/** Complete tower with the vehicle layered between the arms. */
export const Tower: React.FC<TowerProps> = ({light = 'day', carY, openNear, openFar, armLen = ARM_LEN, vehicle, showMount = true, qd = true, ghostOldArms = 0}) => (
  <g>
    {showMount ? <Mount x={VEH_X} /> : null}
    <TowerFrame light={light} />
    {qd ? <path d={`M${TOWER_W / 2} -92 L${TOWER_W / 2 + 7} -92 L${TOWER_W / 2 + 7} -90 L${TOWER_W / 2} -89 Z`} fill="#4f5a66" stroke={OUT} strokeWidth={1.4} {...NS} /> : null}
    <Arm y={carY} open={openFar} len={armLen} near={false} />
    <Carriage y={carY + 2.2} />
    {vehicle}
    <Arm y={carY} open={openNear} len={armLen} near />
    {ghostOldArms > 0 ? <g opacity={ghostOldArms}><Arm y={carY} open={0} len={ARM_OLD_LEN} near ghost /></g> : null}
  </g>
);

/** Plan (top-down) view of tower, arms and a vehicle cross-section with fins. Units metres; z down-screen. */
export const PlanView: React.FC<{
  openNear: number; openFar: number; vx: number; vz: number; fins?: number[]; finSpan?: number; armLen?: number; ship?: boolean; highlightContact?: number; dark?: boolean;
}> = ({openNear, openFar, vx, vz, fins = [30, 150, 270], finSpan = 4.6, armLen = ARM_LEN, ship, highlightContact = 0, dark}) => {
  const hw = TOWER_W / 2;
  const arm = (side: 1 | -1, open: number) => {
    const a = (side * open * Math.PI) / 180;
    const hx = HINGE_X, hz = side * ARM_Z;
    const ex = hx + armLen * Math.cos(a), ez = hz + armLen * Math.sin(a);
    const w = 1.6;
    const nx = -Math.sin(a) * w, nz = Math.cos(a) * w;
    return (
      <g key={side}>
        <path d={`M${hx + nx} ${hz + nz} L${ex + nx * 0.6} ${ez + nz * 0.6} L${ex - nx * 0.6} ${ez - nz * 0.6} L${hx - nx} ${hz - nz} Z`} fill="url(#armSteel)" stroke={OUT} strokeWidth={2} {...NS} />
        <circle cx={hx} cy={hz} r={1.3} fill="#2a323b" stroke={OUT} strokeWidth={1.5} {...NS} />
      </g>
    );
  };
  return (
    <g>
      <rect x={-hw} y={-hw} width={TOWER_W} height={TOWER_W} fill={dark ? '#2a333d' : '#4a5663'} stroke={OUT} strokeWidth={2.4} {...NS} />
      <path d={`M${-hw} ${-hw} L${hw} ${hw} M${hw} ${-hw} L${-hw} ${hw}`} stroke="#25303a" strokeWidth={1.6} {...NS} />
      <rect x={hw - 0.5} y={-hw - 1.5} width={3} height={TOWER_W + 3} fill="#5f6b77" stroke={OUT} strokeWidth={2} {...NS} />
      {arm(-1, openFar)}
      {arm(1, openNear)}
      {/* vehicle */}
      <g transform={`translate(${vx} ${vz})`}>
        {!ship
          ? fins.map((f, i) => {
              const a = ((f - 90) * Math.PI) / 180; // azimuth 0 = +z (toward camera)
              const dir = [Math.cos(a + Math.PI / 2) * -1, Math.sin(a + Math.PI / 2)];
              const ux = Math.sin((f * Math.PI) / 180), uz = Math.cos((f * Math.PI) / 180);
              void dir;
              const tx = -uz, tz = ux;
              const w = 2.5;
              const p = (r: number, q: number) => `${ux * r + tx * q} ${uz * r + tz * q}`;
              return (
                <path key={i} d={`M${p(R - 0.2, -w)} L${p(R + finSpan, -w)} L${p(R + finSpan, w)} L${p(R - 0.2, w)} Z`} fill="url(#gridLattice)" stroke={OUT} strokeWidth={1.8} {...NS} />
              );
            })
          : null}
        <circle r={R} fill="#cfd5db" stroke={OUT} strokeWidth={2.4} {...NS} />
        <circle r={R * 0.62} fill="none" stroke="#aab2ba" strokeWidth={1.2} {...NS} />
        {ship ? (
          <>
            <path d={`M${-R} 0 A ${R} ${R} 0 0 0 ${R} 0 Z`} fill="#24282e" opacity={0.0} />
            {[-1, 1].map((s) => (
              <rect key={s} x={-0.55} y={s > 0 ? R - 0.1 : -R - 1.0} width={1.1} height={1.1} rx={0.2} fill="#e8b23a" stroke={OUT} strokeWidth={1.4} {...NS} />
            ))}
          </>
        ) : null}
      </g>
      {highlightContact > 0 ? (
        <g opacity={highlightContact}>
          <circle cx={vx + 3.46} cy={vz + ARM_Z} r={1.9} fill="none" stroke="#ffc93c" strokeWidth={3} {...NS} />
          <circle cx={vx + 3.46} cy={vz - ARM_Z} r={1.9} fill="none" stroke="#ffc93c" strokeWidth={3} {...NS} />
        </g>
      ) : null}
    </g>
  );
};

/** Vehicle cross-section from above (no tower): body circle and grid fins. */
export const VehiclePlan: React.FC<{fins: number[]; finSpan: number; hl?: number}> = ({fins, finSpan, hl = 0}) => (
  <g>
    {fins.map((f, i) => {
      const ux = Math.sin((f * Math.PI) / 180), uz = Math.cos((f * Math.PI) / 180);
      const tx = -uz, tz = ux, w = 2.5;
      const p = (r: number, q: number) => `${ux * r + tx * q} ${uz * r + tz * q}`;
      return <path key={i} d={`M${p(R - 0.2, -w)} L${p(R + finSpan, -w)} L${p(R + finSpan, w)} L${p(R - 0.2, w)} Z`} fill="url(#gridLattice)" stroke={OUT} strokeWidth={1.8} {...NS} />;
    })}
    <circle r={R} fill="#cfd5db" stroke={OUT} strokeWidth={2.4} {...NS} />
    <circle r={R * 0.62} fill="none" stroke="#aab2ba" strokeWidth={1.2} {...NS} />
    {hl > 0 ? fins.map((f, i) => <circle key={i} cx={Math.sin((f * Math.PI) / 180) * (R + 0.8)} cy={Math.cos((f * Math.PI) / 180) * (R + 0.8)} r={1.2} fill="#e8b23a" stroke={OUT} strokeWidth={1.4} opacity={hl} {...NS} />) : null}
  </g>
);
