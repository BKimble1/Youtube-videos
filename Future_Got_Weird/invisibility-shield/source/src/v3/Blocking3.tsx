// V3 blocking map (production document, not part of the film): the corridor from above with every character and
// camera position over the whole timeline, drawn from the same functions the film uses. z runs left to right.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DUR} from '../world';
import {camAt, guardPos, herPos, shieldAt, shotAt, SHOT} from './story3';
import {LAY3, MOD, PERIOD} from './Corridor3';

const W = 1920, H = 1080;
const Z0 = -2.2, Z1 = 12.4, S = (W - 160) / (Z1 - Z0);
const X = (z: number) => 80 + (z - Z0) * S;
const Y = (x: number) => H / 2 + 60 - x * S; // +x up
const SHOTC: Record<string, string> = {A: '#FFB23F', B: '#3FE0D0', E: '#FF7AB6', F: '#B48CFF', G: '#7CFF6B', H: '#FF5A4E'};

export const Blocking3: React.FC = () => {
  const ticks: React.ReactNode[] = [];
  const herPts: string[] = [], gPts: string[] = [];
  for (let t = 0; t <= DUR; t += 1 / 30) {
    const p = herPos(t), g = guardPos(t);
    herPts.push(`${X(p.z).toFixed(1)},${Y(p.x).toFixed(1)}`);
    gPts.push(`${X(g.z).toFixed(1)},${Y(g.x).toFixed(1)}`);
  }
  for (let s = 0; s <= 29; s += 1) {
    const p = herPos(s), g = guardPos(s);
    ticks.push(<g key={`t${s}`}>
      <circle cx={X(p.z)} cy={Y(p.x)} r={5} fill="#1E8FA8" stroke="#fff" strokeWidth={1.5} />
      <circle cx={X(g.z)} cy={Y(g.x)} r={5} fill="#3E5578" stroke="#fff" strokeWidth={1.5} />
      {s % 2 === 0 && <text x={X(g.z) + 6} y={Y(g.x) - 8} fill="#C9D6E2" fontSize={15}>{s}s</text>}
    </g>);
  }
  // cameras every 0.25 s with their view direction
  const cams: React.ReactNode[] = [];
  for (let t = 0; t <= DUR; t += 0.25) {
    const c = camAt(t);
    const d = {x: c.tgt.x - c.pos.x, z: c.tgt.z - c.pos.z};
    const L = Math.hypot(d.x, d.z) || 1;
    const col = SHOTC[shotAt(t)];
    if (c.pos.z < Z0 || c.pos.z > Z1) continue;
    cams.push(<g key={`c${t.toFixed(2)}`}>
      <line x1={X(c.pos.z)} y1={Y(c.pos.x)} x2={X(c.pos.z + (d.z / L) * 0.35)} y2={Y(c.pos.x + (d.x / L) * 0.35)} stroke={col} strokeWidth={2} />
      <circle cx={X(c.pos.z)} cy={Y(c.pos.x)} r={3.5} fill={col} />
    </g>);
  }
  const sh = [0, 2.7, 12, 24.5, 26, 29.2].map((t) => shieldAt(t));
  const modules: React.ReactNode[] = [];
  for (let z = LAY3.zb; z < Z1; z += MOD) {
    if (z + MOD < Z0) continue;
    modules.push(<g key={`m${z}`}>
      <rect x={X(z + MOD * 0.62 - 0.6)} y={Y(-LAY3.xw) - 4} width={1.2 * S} height={8} fill="#3A5462" />
      <rect x={X(z + MOD * 0.18)} y={Y(LAY3.xw) - 4} width={MOD * 0.64 * S} height={8} fill="#7FE6E8" opacity={0.6} />
      <line x1={X(z)} x2={X(z)} y1={Y(LAY3.xw)} y2={Y(-LAY3.xw)} stroke="#2E4552" strokeDasharray="4 6" />
    </g>);
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#0E1821', fontFamily: 'system-ui, sans-serif'}}>
      <svg width={W} height={H}>
        <rect x={X(Z0)} y={Y(LAY3.xw)} width={(Z1 - Z0) * S} height={2 * LAY3.xw * S} fill="#1A242C" stroke="#4F6A78" strokeWidth={3} />
        {modules}
        <line x1={X(Z0)} x2={X(Z1)} y1={Y(-0.42)} y2={Y(-0.42)} stroke="#FFFFFF" strokeOpacity={0.25} strokeDasharray="10 8" />
        <polyline points={herPts.join(' ')} fill="none" stroke="#1E8FA8" strokeWidth={4} />
        <polyline points={gPts.join(' ')} fill="none" stroke="#8FA6C8" strokeWidth={4} />
        {sh.map((s, i) => {
          const r = {x: Math.cos(s.yaw), z: -Math.sin(s.yaw)};
          return <line key={i} x1={X(s.c.z - r.z * 0.37)} y1={Y(s.c.x - r.x * 0.37)} x2={X(s.c.z + r.z * 0.37)} y2={Y(s.c.x + r.x * 0.37)} stroke="#CFF3F6" strokeWidth={5} />;
        })}
        {cams}
        {ticks}
        <text x={80} y={60} fill="#E8F2F8" fontSize={30} fontWeight={700}>V3 blocking: top view, z along the corridor (m), +x up</text>
        <text x={80} y={98} fill="#9FB4C4" fontSize={19}>Woman (teal) flees toward -z; guard (blue) chases from +z on lane x -0.28. Shield (white bars) at t 0, 2.7, 12, 24.5, 26, 29.2. Dots: positions each second.</text>
        <text x={80} y={124} fill="#9FB4C4" fontSize={19}>Cameras every 0.25 s with view direction, by shot: A amber, B teal, E pink, F violet, G green, H red. Dashed line: the line of action (all cameras stay on its +x side).</text>
        <text x={80} y={150} fill="#9FB4C4" fontSize={19}>{`Modules every ${MOD.toFixed(2)} m (doors on the -x wall, lab windows on the +x wall); the corridor repeats every ${PERIOD} m, which is what makes the loop exact. The sealed lab door closes the -z end at z ${LAY3.zb.toFixed(2)}.`}</text>
        <text x={80} y={H - 40} fill="#9FB4C4" fontSize={19}>{`Shot cuts: ${Object.entries(SHOT).map(([k, v]) => `${k} ${v.toFixed(2)} s`).join(' | ')}. The opening run (z 7.1 at t 0) is the ending run (z -0.68 at 29.27 s) continued one period further along.`}</text>
      </svg>
    </AbsoluteFill>
  );
};
