// V2 mechanism drawings.
// CheekSection: a local window in the robot's cheek beside one mouth corner. A servo sits on the frame inside; its horn
// and rod are SOLVED to reach the corner's actual attachment point on the rig (art/Robot lipAnchors), so when the
// expression moves the corner, the horn visibly turns and the rod follows: motor -> attachment -> lip, one chain.
// The skin's cut edge keeps its thickness; the lips and the rest of the face stay drawn around the window.
// SkinSection: a cross-section of the silicone skin as one continuous band with an embedded anchor; a pull moves the
// anchor, the surface and the material around it (markers inside the band), with the lip at the band's end as a
// landmark. A rigid link beside it turns and moves nothing else.
import React from 'react';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {lipAnchors, P3, projFace, RobotState, RPAL} from '../art/Robot';
import {lit, mix, shade} from '../dc/color';

type V = {x: number; y: number};
/** horn angle so that |S + r(cos a, sin a) - A| = L; picks the solution nearer a reference angle */
export const solveHorn = (S: V, A: V, r: number, L: number, ref: number) => {
  const dx = A.x - S.x, dy = A.y - S.y;
  const d = Math.max(1e-6, Math.hypot(dx, dy));
  // law of cosines for the angle between SA and the horn
  const c = clamp((r * r + d * d - L * L) / (2 * r * d), -1, 1);
  const base = Math.atan2(dy, dx);
  const off = Math.acos(c);
  const a1 = base + off, a2 = base - off;
  const da = (a: number) => Math.abs(Math.atan2(Math.sin(a - ref), Math.cos(a - ref)));
  return da(a1) < da(a2) ? a1 : a2;
};

const Servo: React.FC<{S: V; ang: number; r: number; A: V; hot?: boolean; w?: number; h?: number; rot?: number}> = ({S, ang, r, A, hot, w = 30, h = 20, rot = 0}) => {
  const tip = {x: S.x + r * Math.cos(ang), y: S.y + r * Math.sin(ang)};
  return (
    <g>
      <rect x={fmt(S.x - w / 2)} y={fmt(S.y - h / 2)} width={w} height={h} rx={3} fill={hot ? '#7D6B4E' : '#5E6782'} stroke="#10141F" strokeWidth={1.4} transform={`rotate(${rot} ${fmt(S.x)} ${fmt(S.y)})`} />
      <rect x={fmt(S.x - w / 2 + 3)} y={fmt(S.y - h / 2 + 3)} width={w - 6} height={4} rx={1} fill="#FFFFFF" opacity={0.18} transform={`rotate(${rot} ${fmt(S.x)} ${fmt(S.y)})`} />
      {/* horn */}
      <line x1={fmt(S.x)} y1={fmt(S.y)} x2={fmt(tip.x)} y2={fmt(tip.y)} stroke="#E8ECF4" strokeWidth={5.5} strokeLinecap="round" />
      <line x1={fmt(S.x)} y1={fmt(S.y)} x2={fmt(tip.x)} y2={fmt(tip.y)} stroke="#10141F" strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      <circle cx={fmt(S.x)} cy={fmt(S.y)} r={4.2} fill={hot ? RPAL.led : '#C9D1E4'} stroke="#10141F" strokeWidth={1.1} />
      {/* rod to the attachment */}
      <line x1={fmt(tip.x)} y1={fmt(tip.y)} x2={fmt(A.x)} y2={fmt(A.y)} stroke={hot ? '#FFD18A' : '#D6DCEB'} strokeWidth={hot ? 3.2 : 2.6} strokeLinecap="round" />
      <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={2.6} fill="#10141F" />
      <circle cx={fmt(A.x)} cy={fmt(A.y)} r={hot ? 4.4 : 3.6} fill={hot ? RPAL.led : '#F2F5FF'} stroke="#10141F" strokeWidth={1.1} />
    </g>
  );
};

/** cheek section beside the left (robot's right) mouth corner, in head-local coordinates (draw inside the head's
 *  transform). k: 0..1 opening. focus: highlight the corner chain. */
export const CheekSection: React.FC<{id: string; st: RobotState; k: number; hot?: boolean; two?: boolean; side?: 1 | -1; r?: number; u?: number}> = ({id, st, k, hot = true, two = true, side = -1, r = 1, u = 66}) => {
  if (k <= 0.001) return null;
  const A = lipAnchors(st);
  const sd = -side; // -1: the corner at negative face u (cornerL)
  const cor = A.find((a) => a.k === (side < 0 ? 'cornerL' : 'cornerR'))!.p;
  const upL = A.find((a) => a.k === (side < 0 ? 'upperL' : 'upperR'))!.p;
  // window centre: on the cheek, outside the corner (face units -> head coords)
  const c = projFace(st, -u * sd, -6, 1.0);
  const rx = 34 * k * r * Math.max(0.45, c.z), ry = 30 * k * r;
  // servos are fixed to the frame (they turn with the head): placed in face units, projected deeper
  const S1 = projFace(st, -(u + 12) * sd, 4, 0.9);
  const S2 = projFace(st, -(u + 4) * sd, -26, 0.9);
  // rest-pose rod lengths (from the neutral rig), so the horns rotate as the corner moves
  const L1 = 21, L2 = 22;
  const a1 = solveHorn(S1, cor, 11, L1, sd > 0 ? -0.3 : Math.PI + 0.3);
  const a2 = solveHorn(S2, upL, 10, L2, sd > 0 ? 0.6 : Math.PI - 0.6);
  const skin = RPAL.skin;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-w`}>
          <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} />
        </clipPath>
        <radialGradient id={`${id}-cv`} cx={fmt(c.x - 6)} cy={fmt(c.y - 8)} r={fmt(Math.max(1, rx * 1.3))} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A6688" />
          <stop offset="1" stopColor="#363F5C" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-w)`}>
        <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx + 2)} ry={fmt(ry + 2)} fill={`url(#${id}-cv)`} />
        {/* frame ribs */}
        {[-14, 0, 14].map((dy, i) => (
          <path key={i} d={`M${fmt(c.x - rx)},${fmt(c.y + dy)} Q${fmt(c.x)},${fmt(c.y + dy - 5)} ${fmt(c.x + rx)},${fmt(c.y + dy + 3)}`} fill="none" stroke="#7B87AA" strokeWidth={2.2} opacity={0.7} />
        ))}
        {/* the skin's underside near the corner (a soft lip edge seen from inside) */}
        <path d={`M${fmt(cor.x + 2)},${fmt(cor.y - 12)} Q${fmt(cor.x - 4)},${fmt(cor.y)} ${fmt(cor.x + 2)},${fmt(cor.y + 12)}`} fill="none" stroke={mix(skin, '#FFFFFF', 0.2)} strokeWidth={5} opacity={0.75} />
        {two && <Servo S={S2} ang={a2} r={10} A={upL} hot={false} w={24} h={16} />}
        <Servo S={S1} ang={a1} r={11} A={cor} hot={hot} />
      </g>
      {/* cut edge with thickness */}
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} fill="none" stroke={lit(skin, 0.15)} strokeWidth={4.5} />
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(Math.max(0, rx - 2.4))} ry={fmt(Math.max(0, ry - 2.4))} fill="none" stroke={shade(skin, 0.35)} strokeWidth={1.4} />
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx + 2.4)} ry={fmt(ry + 2.4)} fill="none" stroke={INK} strokeWidth={1.2} />
      {/* the attachment shows through at the corner itself */}
      <circle cx={fmt(cor.x)} cy={fmt(cor.y)} r={3.6} fill={hot ? RPAL.led : '#F2F5FF'} stroke="#10141F" strokeWidth={1} opacity={0.95} />
    </g>
  );
};

/** skin as a continuous band in section; pull (0..1) drags the anchor down and toward the motor */
export const SkinSection: React.FC<{id: string; x: number; y: number; w: number; pull: number; rigidK?: number; rigidAng?: number; markerK?: number; thick?: number}> = ({id, x, y, w, pull, rigidK = 0, rigidAng = 0, markerK = 1, thick = 64}) => {
  const ax = x + w * 0.45; // anchor position along the band
  const disp = (px: number, depth: number) => {
    // gaussian falloff along the band; deeper material moves more (near the anchor), surface a bit less
    const g = Math.exp(-((px - ax) ** 2) / (2 * 120 * 120));
    return {dx: -38 * pull * g * (0.6 + 0.4 * depth), dy: 46 * pull * g * (0.55 + 0.45 * depth)};
  };
  const N = 60;
  const top: V[] = [], bot: V[] = [];
  for (let i = 0; i <= N; i++) {
    const px = x + (w * i) / N;
    const d0 = disp(px, 0), d1 = disp(px, 1);
    top.push({x: px + d0.dx, y: y + d0.dy});
    bot.push({x: px + d1.dx, y: y + thick + d1.dy * 0.8});
  }
  const path = `M${top.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} L${fmt(x + w + 70)},${fmt(y + 10)} Q${fmt(x + w + 70 + thick * 0.65)},${fmt(y + thick * 0.5)} ${fmt(x + w + 70)},${fmt(y + thick - 6)} L${bot
    .slice()
    .reverse()
    .map((p) => `${fmt(p.x)},${fmt(p.y)}`)
    .join(' L')} Z`;
  const A0 = {x: ax, y: y + thick * 0.62};
  const dA = disp(ax, 1);
  const A = {x: A0.x + dA.dx, y: A0.y + dA.dy};
  const M = {x: ax - 150, y: y + thick + 210}; // motor below
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sk`} x1="0" y1={y} x2="0" y2={y + thick} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(RPAL.skin, 0.2)} />
          <stop offset="1" stopColor={RPAL.skinDeep} />
        </linearGradient>
      </defs>
      {/* frame under the skin */}
      <rect x={x - 40} y={y + thick + 120} width={w + 100} height={26} rx={6} fill="#AEB6BF" stroke={INK} strokeWidth={2.5} />
      {/* the band, with its lip end (the landmark) on the right */}
      <path d={path} fill={`url(#${id}-sk)`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* material markers: a few rows of small marks that travel with the material */}
      {markerK > 0.01 &&
        [0.25, 0.55, 0.82].map((dep, r) =>
          Array.from({length: 13}, (_, i) => {
            const px = x + 40 + i * ((w - 80) / 12);
            const d = disp(px, dep);
            return <ellipse key={`${r}-${i}`} cx={fmt(px + d.dx)} cy={fmt(y + thick * dep + d.dy * (1 - 0.2 * (1 - dep)))} rx={5} ry={3.2} fill="#E9EEFF" opacity={0.75 * markerK} />;
          }),
        )}
      {/* anchor, rod and motor */}
      <line x1={fmt(A.x)} y1={fmt(A.y)} x2={fmt(M.x + 34)} y2={fmt(M.y - 10)} stroke="#D6DCEB" strokeWidth={5} strokeLinecap="round" />
      <line x1={fmt(A.x)} y1={fmt(A.y)} x2={fmt(M.x + 34)} y2={fmt(M.y - 10)} stroke={INK} strokeWidth={1.2} opacity={0.5} />
      <circle cx={fmt(A.x)} cy={fmt(A.y)} r={11} fill={RPAL.led} stroke={INK} strokeWidth={2} />
      <rect x={M.x - 50} y={M.y - 30} width={100} height={60} rx={8} fill="#5E6782" stroke={INK} strokeWidth={2.5} />
      <circle cx={M.x + 34} cy={M.y - 10} r={9} fill="#C9D1E4" stroke={INK} strokeWidth={2} />
      {/* rigid comparison: a metal link on a pin above the band; it turns and nothing around it changes */}
      {rigidK > 0.01 && (
        <g opacity={rigidK}>
          <g transform={`rotate(${fmt(rigidAng)} ${fmt(x + 80)} ${fmt(y - 140)})`}>
            <rect x={x + 60} y={y - 158} width={300} height={36} rx={18} fill="#9AA5B1" stroke={INK} strokeWidth={3} />
            <circle cx={x + 330} cy={y - 140} r={8} fill="#5C6670" />
          </g>
          <circle cx={x + 80} cy={y - 140} r={13} fill="#3A4450" stroke={INK} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};
export {lerp};
export type {P3};
