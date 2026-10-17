// R2 rig lab (not part of the film). Pages:
//   0..6  model + pose sheet per Crew member (front, ¾, profile, rear ¾, back, crouch, kneel, braced, fall, injured)
//   7     hand poses            8  proof 1: the Director rising on the rubble ridge (engine, low camera)
//   9     contact proof: catch + hand on shoulder      10 death close-up + hand clasp
//   11    pitch check (−20° / 0 / +35°)                 12 props
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Figure, FigProps} from '../rig/figure';
import {CAST, ROLES2, ROLE2} from '../rig/looks';
import {C, F} from '../../theme';

const BG = '#EDE6D6';
const LIGHT0 = {dir: {x: -0.75, y: -0.35, z: 0.35}, key: 1, shadowC: '#30395A', rimC: '#FFD3A0', rim: 1};

const Label: React.FC<{x: number; y: number; t: string; size?: number}> = ({x, y, t, size = 22}) => (
  <text x={x} y={y} fontFamily={F.body} fontSize={size} fill={C.ink} textAnchor="middle">{t}</text>
);

const sheetPoses = (look: FigProps['look']): {label: string; p: Partial<FigProps>}[] => [
  {label: 'front', p: {yaw: 0}},
  {label: 'three-quarter', p: {yaw: 40}},
  {label: 'profile', p: {yaw: 90}},
  {label: 'rear ¾', p: {yaw: 140}},
  {label: 'back', p: {yaw: 180}},
  {label: 'crouch', p: {yaw: 35, drop: 70, lean: 28, legL: {local: {r: -40, u: 10, f: 40}}, legR: {local: {r: 44, u: 10, f: -36}}, armL: {local: {r: -40, u: 150, f: 120}}, armR: {local: {r: 70, u: 110, f: 60}}, handL: 'open', handR: 'fist', head: {pitch: -14}}},
  {label: 'kneel', p: {yaw: 60, drop: 82, lean: 6, legL: {local: {r: -36, u: 10, f: 70}}, legR: {local: {r: 36, u: 30, f: -70}, pitch: -50}, armL: {local: {r: -30, u: 115, f: 90}}, handL: 'relaxed'}},
  {label: 'braced', p: {yaw: 30, drop: 24, lean: 10, legL: {local: {r: -70, u: 10, f: 70}}, legR: {local: {r: 70, u: 10, f: -60}}, armL: {local: {r: -20, u: 290, f: 90}, palm: {r: 0, u: 0, f: 1}}, armR: {local: {r: 85, u: 170, f: 40}}, handL: 'fist', handR: 'fist', face: {mouth: 'grit', brows: -0.6}}},
  {label: 'fall', p: {yaw: 70, bodyPitch: -38, drop: 30, lean: -12, legL: {fk: {fwd: 50, knee: 40}}, legR: {fk: {fwd: 20, knee: 20}}, armL: {fk: {fwd: 110, out: 40, bend: 30}}, armR: {fk: {fwd: 60, out: 60, bend: 20}}, handL: 'open', handR: 'open', face: {mouth: 'open', open: 0.6, brows: 0.6}}},
  {label: 'injured', p: {yaw: 25, drop: 14, lean: 14, side: -8, legL: {local: {r: -40, u: 10, f: 22}}, legR: {local: {r: 40, u: 10, f: -14}}, armL: {local: {r: 10, u: 220, f: 60}, palm: {r: 1, u: 0, f: 0}}, armR: {local: {r: 64, u: 190, f: 40}}, handL: 'brace', head: {pitch: 12, roll: -6}, face: {mouth: 'pain', brows: 0.4, worry: 0.6, lids: 0.4}}},
].map((q) => ({...q, p: {...q.p}})) as {label: string; p: Partial<FigProps>}[];

export const RigLab: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (page <= 6) {
    const role = ROLES2[page];
    const look = CAST[ROLE2[role]];
    const P = sheetPoses(look);
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={F.display} fontSize={34} fill={C.ink}>{`R2 model sheet · ${role} (${ROLE2[role]})`}</text>
        {P.map((q, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = 200 + col * 380, y = 480 + row * 470;
          return (
            <g key={i}>
              <Figure look={look} t={t} seed={3 + i} id={`ms${i}`} x={x} y={y} s={0.82} ink={3.4} light={LIGHT0} {...q.p} />
              <Label x={x} y={y + 50} t={q.label} />
            </g>
          );
        })}
      </svg>
    );
  }
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}} />;
};
