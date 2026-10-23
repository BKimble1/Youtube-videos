// L0: the optics room, drawn through the one fixed projection (world2.proj). Cool teal/navy walls and floor, one
// low optics cart at lower left carrying the laser head and its control box, a clear aisle, a tall night window on
// the back wall (the one landmark) and an open doorway in the left wall (the clerk's destination).
import React from 'react';
import {ROOM as R, C} from './theme2';
import {pp, proj, v3, V3, ROOM_B as B, WINDOW as WI, DOOR, CART, EXIT, EAR} from './world2';
import {Pt, f3, rnd, P} from './lib2';

const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join('L') + 'Z';
const P3 = (x: number, y: number, z: number) => pp(v3(x, y, z));
const quad3 = (a: V3, b: V3, c: V3, d: V3) => poly([pp(a), pp(b), pp(c), pp(d)]);

export const RoomBack: React.FC<{id: string; t: number}> = ({id, t}) => {
  const zb = B.zBack, h = B.h;
  // floor boards (lines along Z) and seams across
  const boards = Array.from({length: 13}, (_, i) => B.x0 + (i + 1) * ((B.x1 - B.x0) / 14));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={R.wallDeep} />
          <stop offset="0.55" stopColor={R.wall} />
          <stop offset="1" stopColor={R.wallDeep} />
        </linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A1428" />
          <stop offset="0.7" stopColor={R.windowSky} />
          <stop offset="1" stopColor="#2A3F66" />
        </linearGradient>
        <radialGradient id={`${id}-pool`} cx="0.5" cy="0.1" r="0.9">
          <stop offset="0" stopColor={R.lampGlow} stopOpacity={0.13} />
          <stop offset="1" stopColor={R.lampGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* everything outside the room reads as deep wall */}
      <rect x={-6000} y={-6000} width={13000} height={14000} fill={R.wallDeep} />
      {/* ceiling, side walls, back wall, floor */}
      <path d={quad3(v3(B.x0, h, -1.5), v3(B.x1, h, -1.5), v3(B.x1, h, zb), v3(B.x0, h, zb))} fill={R.ceiling} />
      <path d={quad3(v3(B.x0, 0, -1.2), v3(B.x0, h, -1.2), v3(B.x0, h, zb), v3(B.x0, 0, zb))} fill={R.wallSide} />
      <path d={quad3(v3(B.x1, 0, -1.2), v3(B.x1, h, -1.2), v3(B.x1, h, zb), v3(B.x1, 0, zb))} fill={R.wallSide} />
      <path d={quad3(v3(B.x0, 0, zb), v3(B.x1, 0, zb), v3(B.x1, h, zb), v3(B.x0, h, zb))} fill={`url(#${id}-wall)`} />
      <path d={quad3(v3(B.x0, 0, -1.2), v3(B.x1, 0, -1.2), v3(B.x1, 0, zb), v3(B.x0, 0, zb))} fill={R.floor} />
      {boards.map((x, i) => <path key={i} d={`M${f3(P3(x, 0, -0.6).x)} ${f3(P3(x, 0, -0.6).y)}L${f3(P3(x, 0, zb).x)} ${f3(P3(x, 0, zb).y)}`} stroke={R.floorLine} strokeWidth={2} opacity={0.55} />)}
      {/* skirting and the wall-floor seams */}
      <path d={quad3(v3(B.x0, 0, zb), v3(B.x1, 0, zb), v3(B.x1, 0.09, zb), v3(B.x0, 0.09, zb))} fill={R.skirting} />
      <path d={quad3(v3(B.x0, 0, -1.2), v3(B.x0, 0, zb), v3(B.x0, 0.09, zb), v3(B.x0, 0.09, -1.2))} fill={R.skirting} />
      <path d={quad3(v3(B.x1, 0, -1.2), v3(B.x1, 0, zb), v3(B.x1, 0.09, zb), v3(B.x1, 0.09, -1.2))} fill={R.skirting} />
      {/* a trim rail along the back and side walls (yellow accent) */}
      <path d={`M${f3(P3(B.x0, 1.02, -1.2).x)} ${f3(P3(B.x0, 1.02, -1.2).y)}L${f3(P3(B.x0, 1.02, zb).x)} ${f3(P3(B.x0, 1.02, zb).y)}L${f3(P3(B.x1, 1.02, zb).x)} ${f3(P3(B.x1, 1.02, zb).y)}L${f3(P3(B.x1, 1.02, -1.2).x)} ${f3(P3(B.x1, 1.02, -1.2).y)}`} fill="none" stroke={R.trimDeep} strokeWidth={4} opacity={0.75} />
      {/* the landmark: one tall night window in the back wall (as the Contacts train window) */}
      <path d={quad3(v3(WI.x0, WI.y0, zb), v3(WI.x1, WI.y0, zb), v3(WI.x1, WI.y1, zb), v3(WI.x0, WI.y1, zb))} fill={`url(#${id}-sky)`} />
      {(() => {
        const a = P3(WI.x0, WI.y1, zb), b = P3(WI.x1, WI.y0, zb), W = b.x - a.x, H = b.y - a.y;
        return (
          <g>
            <circle cx={a.x + W * 0.7} cy={a.y + H * 0.2} r={W * 0.07} fill="#F4EBC8" opacity={0.9} />
            {Array.from({length: 14}, (_, i) => <circle key={i} cx={a.x + rnd(i * 3.3) * W} cy={a.y + rnd(i * 7.1) * H * 0.55} r={1.3 + rnd(i) * 1.1} fill="#FFFFFF" opacity={0.45 + 0.4 * rnd(i * 2.2)} />)}
            <path d={`M${a.x} ${a.y + H * 0.82} L${a.x + W * 0.2} ${a.y + H * 0.72} L${a.x + W * 0.45} ${a.y + H * 0.79} L${a.x + W * 0.7} ${a.y + H * 0.68} L${b.x} ${a.y + H * 0.76} L${b.x} ${b.y} L${a.x} ${b.y} Z`} fill="#13213D" />
            {Array.from({length: 7}, (_, i) => <rect key={i} x={a.x + W * (0.08 + i * 0.13)} y={a.y + H * (0.86 + 0.04 * rnd(i * 5))} width={W * 0.03} height={H * 0.012} fill={R.lamp} opacity={0.8} />)}
            <rect x={a.x + W / 2 - 3} y={a.y} width={6} height={H} fill={R.trimDeep} />
            <rect x={a.x} y={a.y} width={W} height={H} fill="none" stroke={R.trim} strokeWidth={7} />
            <rect x={a.x - 4} y={a.y - 4} width={W + 8} height={H + 8} fill="none" stroke={C.ink} strokeWidth={2.5} />
            <rect x={a.x - 10} y={b.y} width={W + 20} height={8} fill={R.trimDeep} />
          </g>
        );
      })()}
      {/* open doorway in the left wall (the clerk's destination) */}
      <path d={quad3(v3(B.x0, 0, DOOR.z0), v3(B.x0, 0, DOOR.z1), v3(B.x0, DOOR.h, DOOR.z1), v3(B.x0, DOOR.h, DOOR.z0))} fill="#0F1E25" />
      <path d={quad3(v3(B.x0, 0, DOOR.z0), v3(B.x0, 0, DOOR.z1), v3(B.x0, DOOR.h, DOOR.z1), v3(B.x0, DOOR.h, DOOR.z0))} fill="none" stroke={R.trimDeep} strokeWidth={5} />
      {/* pendant lamp above the aisle, warm pool on the floor */}
      {(() => {
        const top = P3(-0.2, B.h, 3.4), bulb = P3(-0.2, 2.1, 3.4), fl = proj(v3(-0.2, 0, 3.4));
        return (
          <g>
            <path d={`M${bulb.x} ${bulb.y} L${bulb.x - fl.s * 0.9} ${fl.y} L${bulb.x + fl.s * 0.9} ${fl.y} Z`} fill={`url(#${id}-pool)`} />
            <line x1={top.x} y1={top.y} x2={bulb.x} y2={bulb.y - 14} stroke={C.ink} strokeWidth={2.5} />
            <path d={`M${bulb.x - 26} ${bulb.y} L${bulb.x + 26} ${bulb.y} L${bulb.x + 15} ${bulb.y - 22} L${bulb.x - 15} ${bulb.y - 22} Z`} fill={R.trim} stroke={C.ink} strokeWidth={2.5} />
            <ellipse cx={bulb.x} cy={bulb.y + 1} rx={16} ry={4} fill={R.lamp} />
          </g>
        );
      })()}
    </g>
  );
};

// the low optics cart (near, lower left): top, front edge, legs and a lower shelf
export const Cart: React.FC = () => {
  const {x0, x1, z0, z1, top} = CART;
  const leg = (x: number, z: number) => {
    const a = P3(x, top - 0.04, z), b = P3(x, 0.06, z);
    return <g key={`${x}${z}`}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={13} strokeLinecap="round" /><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={R.leg} strokeWidth={8} strokeLinecap="round" /><circle cx={b.x} cy={b.y + 6} r={9} fill={C.ink} /></g>;
  };
  return (
    <g>
      {leg(x0 + 0.06, z1 - 0.06)}{leg(x1 - 0.06, z1 - 0.06)}
      <path d={quad3(v3(x0, 0.16, z0), v3(x1, 0.16, z0), v3(x1, 0.16, z1), v3(x0, 0.16, z1))} fill={R.benchDeep} stroke={C.ink} strokeWidth={2.5} />
      {leg(x0 + 0.06, z0 + 0.06)}{leg(x1 - 0.06, z0 + 0.06)}
      {/* breadboard top with a hole grid, front apron */}
      <path d={quad3(v3(x0, top, z0), v3(x1, top, z0), v3(x1, top, z1), v3(x0, top, z1))} fill={R.benchTop} stroke={C.ink} strokeWidth={3} />
      {Array.from({length: 7}, (_, i) => Array.from({length: 6}, (_, j) => {
        const p = P3(x0 + 0.1 + i * ((x1 - x0 - 0.2) / 6), top, z0 + 0.1 + j * ((z1 - z0 - 0.2) / 5));
        return <circle key={`${i}-${j}`} cx={p.x} cy={p.y} r={2.2} fill={R.leg} opacity={0.8} />;
      }))}
      <path d={quad3(v3(x0, top, z0), v3(x1, top, z0), v3(x1, top - 0.07, z0), v3(x0, top - 0.07, z0))} fill={R.bench} stroke={C.ink} strokeWidth={3} />
      <path d={quad3(v3(x1, top, z0), v3(x1, top, z1), v3(x1, top - 0.07, z1), v3(x1, top - 0.07, z0))} fill={R.benchDeep} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

// the control box on the cart, with the apparatus indicator (a steady saffron LED while transmitting)
export const ControlBox: React.FC<{on: number}> = ({on}) => {
  const x0 = -1.36, x1 = -1.08, z0 = 1.86, z1 = 2.1, y0 = CART.top, y1 = CART.top + 0.13;
  const led = P3(x1 - 0.06, y0 + 0.075, z0);
  const s = proj(v3(x1 - 0.06, y0, z0)).s;
  return (
    <g>
      <path d={quad3(v3(x0, y1, z0), v3(x1, y1, z0), v3(x1, y1, z1), v3(x0, y1, z1))} fill={R.housingLight} stroke={C.ink} strokeWidth={3} />
      <path d={quad3(v3(x0, y0, z0), v3(x1, y0, z0), v3(x1, y1, z0), v3(x0, y1, z0))} fill={R.housing} stroke={C.ink} strokeWidth={3} />
      <path d={quad3(v3(x1, y0, z0), v3(x1, y0, z1), v3(x1, y1, z1), v3(x1, y1, z0))} fill="#22282E" stroke={C.ink} strokeWidth={3} />
      {[0, 1].map((i) => { const k = P3(x0 + 0.07 + i * 0.08, y0 + 0.07, z0); return <circle key={i} cx={k.x} cy={k.y} r={s * 0.018} fill={R.metal} stroke={C.ink} strokeWidth={2} />; })}
      <circle cx={led.x} cy={led.y} r={s * 0.034} fill={C.saffron} opacity={0.25 * on} />
      <circle cx={led.x} cy={led.y} r={s * 0.016} fill={on > 0.5 ? C.saffron : '#5A4A20'} stroke={C.ink} strokeWidth={1.5} />
      {/* cable to the laser head */}
      {(() => { const a = P3(x1, y0 + 0.04, (z0 + z1) / 2), b = P3(-0.98, y0 + 0.01, 2.05), c = pp(v3(EXIT.x - 0.24, y0, EXIT.z - 0.18)); return <path d={`M${a.x} ${a.y} Q${b.x} ${b.y + 10} ${c.x} ${c.y}`} fill="none" stroke={C.ink} strokeWidth={5} />; })()}
    </g>
  );
};
export {EAR, P};
