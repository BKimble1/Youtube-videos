import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose} from '../components/Character';
import {HERO_LOOK, charXY, footOffset} from '../opening/rig';
import {CharacterSide, SidePose, hipOnGround, sideFK} from './side';
import {MugSide} from './props';

/** Pose lab for the side / three-quarter test: the approved clerkB reference, the same character standing in side view, the v1 front-view off-balance pose, and new side-view off-balance poses, all at one scale (1.0 = rig px). */
const GY = 880;
const SC = 1.0;
export const SIDE_POSES: Record<string, SidePose & {air?: number}> = {
  idle: {lean: 3, head: 0, armN: {s: 8, e: 10}, armF: {s: 4, e: 10}, legN: {h: 4, k: 0}, legF: {h: -4, k: 0}, mouth: 'smile', brows: 0, lookY: 0},
  // TEST POSE: stopped feet skidding, body pitched forward about them, the mug arm forward, the far arm thrown up and ahead
  pitch: {lean: 31, head: 9, armN: {s: 76, e: 52}, armF: {s: 134, e: 10}, legN: {h: 22, k: 24, f: 6}, legF: {h: -44, k: 14, f: -28}, mouth: 'o', brows: 0.9},
  flight: {lean: 43, head: 12, armN: {s: 90, e: 34}, armF: {s: -104, e: 8}, legN: {h: -50, k: 50, f: -34}, legF: {h: -66, k: 26, f: -38}, mouth: 'o', brows: 0.9, air: 70},
  skid: {lean: 33, head: 10, armN: {s: 70, e: 52}, armF: {s: -78, e: -12}, legN: {h: 32, k: 40, f: 8}, legF: {h: -40, k: 10, f: -16}, mouth: 'o', brows: 0.9},
};
const PANELS = ['ref', 'idle', 'front', 'pitch', 'flight', 'skid'] as const;
const X = (i: number) => 170 + i * 315;
const LABEL: Record<string, string> = {ref: 'approved ref (clerkB)', idle: 'side, standing', front: 'v1 front, off-balance', pitch: 'side, off-balance (TEST)', flight: 'side, flight', skid: 'side, skid'};

export const PoseLab2: React.FC = () => {
  const frontPose: Pose = {...IDLE, armL: {a: 104, b: 12}, armR: {a: 38, b: 70}, lean: 32, legL: 8, legR: -2, footFlat: 1, mouth: 'o', brows: 0.95, lookX: 1, blink: 1, tilt: -9};
  const oL = footOffset(32, 8, -1, SC), oR = footOffset(32, -2, 1, SC);
  const low = oL.y >= oR.y ? oL : oR;
  const frontHips = {x: X(2) - low.x - 36, y: GY - 6 - low.y};
  const frontXY = charXY(frontHips.x, frontHips.y, SC);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        <text x={40} y={70} fontFamily={F.display} fontWeight={700} fontSize={40} fill={C.ink}>Earth Stops · side / three-quarter pose test (same cast member, same scale, same palette)</text>
        {PANELS.map((k, i) => (
          <g key={k}>
            <line x1={X(i) - 150} y1={GY} x2={X(i) + 150} y2={GY} stroke={C.ink} strokeWidth={4} />
            <text x={X(i)} y={GY + 50} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={24} fill={k === 'pitch' ? C.coralDeep : C.inkSoft}>{LABEL[k]}</text>
          </g>
        ))}
      </svg>
      {/* approved reference crop (clerkB from cast_rig_check.png), native scale */}
      <div style={{position: 'absolute', left: X(0) - 115, top: GY + 2 - 530, width: 230, height: 540, overflow: 'hidden'}}>
        <Img src={staticFile('refs/cast_rig_check.png')} style={{position: 'absolute', left: -285, top: -250, width: 1920, height: 1080}} />
      </div>
      {/* v1 front-view rig, off-balance */}
      <Character look={HERO_LOOK} pose={frontPose} frame={0} x={frontXY.x} y={frontXY.y} scale={SC} life={0} eyeDarts={false} front="R" shadow={false} />
      {(['idle', 'pitch', 'flight', 'skid'] as const).map((k) => {
        const p = SIDE_POSES[k];
        const idx = k === 'idle' ? 1 : k === 'pitch' ? 3 : k === 'flight' ? 4 : 5;
        const planted = hipOnGround(p, X(idx) - (k === 'idle' ? 0 : 60), GY, SC);
        const hip = {x: planted.x, y: planted.y - (p.air ?? 0)};
        const fk = sideFK(p, hip, SC);
        const mug = k !== 'idle' && k !== 'flight' ? <MugSide tilt={78} sc={SC} /> : k === 'flight' ? <MugSide tilt={88} sc={SC} /> : null;
        void fk;
        return <CharacterSide key={k} pose={p} hip={hip} sc={SC} holdN={mug} />;
      })}
    </AbsoluteFill>
  );
};
