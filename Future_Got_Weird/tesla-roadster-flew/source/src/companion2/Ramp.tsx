// The C-shaped ramp, simplified, seen from the side: an approach on the floor, a curve up into a vertical wall, and a
// curve over the top that ends past upside down (the car hung at about 170 degrees of pitch, per Tesla's on-screen
// gauge). Height is compressed (about 2.3 car lengths, the real ramp is closer to 5) so the car and a person fit in
// one frame. White riding surface, red side panels and a steel truss, as in the footage.
import React from 'react';

export const R1 = 340; // bottom curve radius
export const WALL = 260; // straight vertical section
export const R2 = 400; // top curve radius
export const TOP = 170; // pitch (deg) of the straight overhang (Tesla's gauge read 170 deg while the car hung)
export const CEIL = 560; // length of the straight overhang
export const FLOOR_X0 = -1500;
const C1 = {x: 0, y: -R1};
const C2 = {x: R1 - R2, y: -R1 - WALL};
const rad = (d: number) => (d * Math.PI) / 180;
const A1 = (Math.PI / 2) * R1; // arc length of the bottom curve

/** Arc-length parameter s: s < 0 is the floor approach (x = s), then the bottom curve, the wall and the top curve. */
export const S_WALL0 = A1;
export const S_WALL1 = A1 + WALL;
export const S_ARC2 = S_WALL1 + rad(TOP - 90) * R2;
export const S_END = S_ARC2 + CEIL;
export const LIP = TOP;
/** Surface point, pitch (deg: 0 floor, 90 wall, 180 ceiling) and outward normal n (pointing from the track into the surface). */
export const rampAt = (s: number) => {
  let x: number, y: number, phi: number;
  if (s <= 0) { x = s; y = 0; phi = 0; }
  else if (s <= A1) { phi = (s / R1) * (180 / Math.PI); x = C1.x + R1 * Math.sin(rad(phi)); y = C1.y + R1 * Math.cos(rad(phi)); }
  else if (s <= S_WALL1) { phi = 90; x = R1; y = -R1 - (s - A1); }
  else if (s <= S_ARC2) { phi = 90 + ((s - S_WALL1) / R2) * (180 / Math.PI); x = C2.x + R2 * Math.sin(rad(phi)); y = C2.y + R2 * Math.cos(rad(phi)); }
  else {
    phi = TOP;
    const u = s - S_ARC2;
    x = C2.x + R2 * Math.sin(rad(TOP)) + Math.cos(rad(TOP)) * u;
    y = C2.y + R2 * Math.cos(rad(TOP)) - Math.sin(rad(TOP)) * u;
  }
  const n = {x: Math.sin(rad(phi)), y: Math.cos(rad(phi))};
  return {x, y, phi, n, heading: -phi};
};
/** Arc length at a given pitch on the top curve (phi >= 90). */
export const sAtPhi = (phi: number) => (phi <= 90 ? (rad(phi) * R1) : S_WALL1 + rad(Math.min(phi, TOP) - 90) * R2);
/** Where the car hung: the middle of the straight overhang. */
export const S_HANG = S_ARC2 + CEIL * 0.5;

const path = (offset: number, s0: number, s1: number, step = 8) => {
  const pts: string[] = [];
  for (let s = s0; s <= s1 + 1e-6; s += step) {
    const p = rampAt(Math.min(s, s1));
    pts.push(`${(p.x + p.n.x * offset).toFixed(1)},${(p.y + p.n.y * offset).toFixed(1)}`);
  }
  return pts;
};

export const RampDrawing: React.FC<{ink?: string}> = ({ink = '#0B1418'}) => {
  const T = 64; // band thickness (riding surface + side panel)
  const inner = path(0, 0, S_END);
  const outer = path(T, 0, S_END);
  const band = `M ${inner.join(' L ')} L ${outer.reverse().join(' L ')} Z`;
  const edge = path(12, 0, S_END);
  const ribs: React.ReactNode[] = [];
  for (let s = 40; s < S_END - 20; s += 70) {
    const p = rampAt(s);
    ribs.push(<line key={s} x1={p.x + p.n.x * 16} y1={p.y + p.n.y * 16} x2={p.x + p.n.x * (T - 4)} y2={p.y + p.n.y * (T - 4)} stroke="#7E1F25" strokeWidth={4} />);
  }
  // steel truss behind the wall and under the overhang
  const truss: React.ReactNode[] = [];
  const tx0 = R1 + T, tx1 = R1 + T + 210, top = rampAt(S_END).y - T - 90;
  for (let y = 0; y > top; y -= 140) {
    truss.push(<line key={`h${y}`} x1={tx0} y1={y} x2={tx1} y2={y} />);
    truss.push(<line key={`d${y}`} x1={tx0} y1={y} x2={tx1} y2={Math.max(top, y - 140)} />);
  }
  const beamY = top;
  const bx0 = rampAt(S_END).x - 30;
  for (let x = bx0; x < tx1; x += 120) {
    truss.push(<line key={`b${x}`} x1={x} y1={beamY} x2={Math.min(tx1, x + 120)} y2={beamY - 60} />);
  }
  return (
    <g>
      <g stroke="#7D8C96" strokeWidth={7} fill="none" opacity={0.9}>
        <rect x={tx0} y={top} width={tx1 - tx0} height={-top} stroke="#7D8C96" />
        {truss}
        <line x1={bx0} y1={beamY} x2={tx1} y2={beamY} />
        <line x1={bx0} y1={beamY - 60} x2={tx1} y2={beamY - 60} />
        {/* hangers from the beam to the overhang */}
        {[0.05, 0.35, 0.65, 0.95].map((u) => { const p = rampAt(S_ARC2 + CEIL * u); return <line key={u} x1={p.x + p.n.x * T} y1={p.y + p.n.y * T} x2={p.x + p.n.x * T} y2={beamY} />; })}
        {[115, 140].map((a) => { const p = rampAt(sAtPhi(a)); return <line key={a} x1={p.x + p.n.x * T} y1={p.y + p.n.y * T} x2={p.x + p.n.x * T} y2={beamY} />; })}
      </g>
      {/* floor approach strip */}
      <rect x={FLOOR_X0} y={0} width={-FLOOR_X0} height={T} fill="#C8323C" stroke={ink} strokeWidth={4} />
      <rect x={FLOOR_X0} y={0} width={-FLOOR_X0} height={12} fill="#F4F6F7" />
      <path d={band} fill="#C8323C" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {ribs}
      <path d={`M ${inner.join(' L ')} L ${edge.slice().reverse().join(' L ')} Z`} fill="#F4F6F7" />
      <path d={`M ${inner.join(' L ')}`} fill="none" stroke={ink} strokeWidth={4} />
      {/* glow line along the panel, as the ramp's edge lighting in the footage */}
      <path d={`M ${path(T - 10, 0, S_END).join(' L ')}`} fill="none" stroke="#FF6B6B" strokeWidth={3} opacity={0.8} />
    </g>
  );
};
