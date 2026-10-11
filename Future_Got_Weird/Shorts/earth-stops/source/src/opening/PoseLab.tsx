import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, H, W} from '../theme';
import {Character, IDLE, Pose} from '../components/Character';
import {HERO_LOOK, SC, charXY, footOffset} from './rig';

type Panel = {label: string; theta: number; legL: number; legR: number; flat: number; planted: boolean; air?: number; armL: {a: number; b: number}; armR: {a: number; b: number}; mouth?: Pose['mouth']; look?: number};
const PANELS: Panel[] = [
  {label: '1 · idle (reference)', theta: 0, legL: 0, legR: 0, flat: 0, planted: true, armL: {a: 8, b: 10}, armR: {a: 8, b: 10}},
  {label: '2 · planted, lean 18°', theta: 18, legL: 14, legR: -4, flat: 1, planted: true, armL: {a: 38, b: 24}, armR: {a: 88, b: -8}, mouth: 'o'},
  {label: '3 · planted, lean 32°', theta: 32, legL: 20, legR: -6, flat: 1, planted: true, armL: {a: 62, b: 34}, armR: {a: 108, b: -6}, mouth: 'o'},
  {label: '4 · flight, lean 42°', theta: 42, legL: 22, legR: 40, flat: 0.15, planted: false, air: 90, armL: {a: 40, b: 40}, armR: {a: 118, b: -10}, mouth: 'o'},
  {label: '5 · landing skid, 30°', theta: 30, legL: 10, legR: 34, flat: 1, planted: true, armL: {a: 70, b: 30}, armR: {a: 112, b: -4}, mouth: 'o'},
  {label: '6 · low skid, 20°', theta: 20, legL: 12, legR: 6, flat: 1, planted: true, armL: {a: 46, b: 22}, armR: {a: 96, b: -6}, mouth: 'o'},
];

const GROUNDS = [760, 1500];
const CENTERS = [180, 540, 900];

export const PoseLab: React.FC = () => (
  <AbsoluteFill style={{background: C.paper}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <text x={40} y={90} fontFamily={F.display} fontWeight={700} fontSize={44} fill={C.ink}>Earth Stops · off-balance pose lab (rig extension: leg swing + flat feet)</text>
      {PANELS.map((p, i) => {
        const gy = GROUNDS[Math.floor(i / 3)];
        const cx = CENTERS[i % 3];
        return (
          <g key={i}>
            <line x1={cx - 175} y1={gy} x2={cx + 175} y2={gy} stroke={C.ink} strokeWidth={4} />
            <line x1={cx} y1={gy - 520} x2={cx} y2={gy + 10} stroke={C.coral} strokeWidth={2} strokeDasharray="8 8" opacity={0.6} />
            <text x={cx} y={gy + 56} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={28} fill={C.inkSoft}>{p.label}</text>
          </g>
        );
      })}
    </svg>
    {PANELS.map((p, i) => {
      const sc = 0.8;
      const gy = GROUNDS[Math.floor(i / 3)];
      const cx = CENTERS[i % 3];
      // planted poses: the LOWEST shoe sits on the ground line (the other foot may hang above it); flight poses float
      const oL = footOffset(p.theta, p.legL, -1, sc);
      const oR = footOffset(p.theta, p.legR, 1, sc);
      const low = oL.y >= oR.y ? oL : oR;
      const footX = cx - 70 * sc * (p.theta / 40);
      const planted = {x: footX - low.x, y: gy - 6 * sc - low.y};
      const hips = p.planted ? planted : {x: cx + 30, y: planted.y - (p.air ?? 0) * sc};
      const xy = charXY(hips.x, hips.y, sc);
      const pose: Pose = {...IDLE, armL: p.armL, armR: p.armR, lean: p.theta, legL: p.legL, legR: p.legR, footFlat: p.flat, mouth: p.mouth ?? 'smile', brows: p.theta ? 0.9 : 0, lookX: p.theta ? 1 : 0, blink: 1};
      return <Character key={i} look={HERO_LOOK} pose={pose} frame={0} x={xy.x} y={xy.y} scale={sc} life={0} eyeDarts={false} front="R" shadow={p.planted} />;
    })}
  </AbsoluteFill>
);
