// V4 model sheet (production document): the two Crew rigs in turnaround and the expression range, on Crew paper.
// page 'turn' = turnarounds + action poses, 'face' = expression heads.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../fonts';
import {BODY_G, BODY_P, GUARD, PERSON, Look4, Body4} from './cast4';
import {Crew4, Pose4} from './Crew4';
import {crouch, FACES, stand} from './poses4';
import {Card, v3} from './geo4';

const card = (x: number, y: number, k: number, phi: number): Card => ({x, y, k, phi, depth: 3});
const Lbl: React.FC<{x: number; y: number; s: string}> = ({x, y, s}) => (
  <text x={x} y={y} fontFamily='"Nunito Variable", sans-serif' fontWeight={800} fontSize={24} fill="#3F5560" textAnchor="middle">{s}</text>
);

const head = (b: Body4, f: Pose4['face'], hy = 0, hp = 0): Pose4 => ({...stand(b, f), hy, hp});

export const ModelSheet4: React.FC<{page: string}> = ({page}) => {
  const rows: React.ReactNode[] = [];
  if (page === 'turn') {
    const views = [0, 40, 90, 150, 180, -60];
    const names = ['front', '3/4', 'profile', '3/4 back', 'back', '3/4 L'];
    [[PERSON, BODY_P, 560], [GUARD, BODY_G, 1060]].forEach(([lk, bd, y], r) => {
      views.forEach((phi, i) => {
        const x = 95 + i * 178;
        rows.push(<g key={`${r}-${i}`}><Crew4 id={`t${r}${i}`} look={lk as Look4} b={bd as Body4} pose={stand(bd as Body4)} cd={card(x, y as number, 0.92, phi)} />
          <Lbl x={x} y={(y as number) + 40} s={names[i]} /></g>);
      });
    });
    // action poses
    const run: Pose4 = {...stand(BODY_P, FACES.run), pel: v3(0, 168, 0), pitch: 14, twist: -8,
      footL: v3(34, 40, 70), footR: v3(-30, 70, -80), toeL: -10, toeR: 40,
      armL: {hand: v3(70, 200, -40), shape: 'fist'}, armR: {hand: v3(-60, 250, 70), shape: 'fist'}, hy: 0};
    const look: Pose4 = {...run, twist: -26, hy: -95, hp: -5, face: FACES.alarm};
    const cr = crouch(BODY_P);
    const reach: Pose4 = {...crouch(BODY_P, FACES.giggle), twist: 18, armL: {hand: v3(170, 210, 150), shape: 'open', splay: 0.9}};
    const acts: [Pose4, number, string][] = [[run, 90, 'run'], [look, 90, 'run, looking back'], [cr, 90, 'crouch'], [cr, 0, 'crouch front'], [reach, 70, 'reach around']];
    acts.forEach(([p, phi, s], i) => {
      const x = 110 + i * 215;
      rows.push(<g key={`a${i}`}><Crew4 id={`a${i}`} look={PERSON} b={BODY_P} pose={p} cd={card(x, 1560, 0.82, phi)} /><Lbl x={x} y={1600} s={s} /></g>);
    });
  } else {
    const fs: [keyof typeof FACES, number][] = [['neutral', 30], ['alarm', 30], ['hold', 20], ['relief', 25], ['smug', 35], ['giggle', 25], ['grin', 20], ['uhoh', 15], ['focus', 60]];
    fs.forEach(([f, hy], i) => {
      const x = 180 + (i % 3) * 360, y = 330 + Math.floor(i / 3) * 520;
      rows.push(<g key={f}><Crew4 id={`f${i}`} look={PERSON} b={BODY_P} pose={head(BODY_P, FACES[f], hy)} cd={card(x, y + 860, 2.2, 0)} shadow={false} /><Lbl x={x} y={y + 210} s={f} /></g>);
    });
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#FAF3DF'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs><clipPath id="pg"><rect x={0} y={0} width={1080} height={1920} /></clipPath></defs>
        <g clipPath="url(#pg)">{rows}</g>
        <text x={540} y={80} fontFamily='"Fredoka Variable", sans-serif' fontWeight={600} fontSize={40} fill="#162A32" textAnchor="middle">V4 Weird Crew rigs: {page === 'turn' ? 'turnaround + actions' : 'expressions'}</text>
      </svg>
    </AbsoluteFill>
  );
};
