// Phase B consistency sheet: each Laser Voices cast member on the Weird Crew rig, in front / three-quarter / profile,
// neutral / surprised / eyes closed, listening and walking.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Crew4, Pose4} from '../rig/Crew';
import {face, FACES, stand} from '../rig/poses';
import {Card, v3} from '../rig/geo';
import {Body4, Look4} from '../rig/cast';
import {B_L, B_O, B_P, LISTENER, OPERATOR, PASSERBY} from '../castLV';

const card = (x: number, y: number, k: number, phi: number): Card => ({x, y, k, phi, depth: 3});
const Lbl: React.FC<{x: number; y: number; s: string}> = ({x, y, s}) => (
  <text x={x} y={y} fontFamily='"Nunito Variable", sans-serif' fontWeight={800} fontSize={22} fill="#3F5560" textAnchor="middle">{s}</text>
);
const SURPRISE = face({brow: 1, browIn: 0.3, wide: 1, mw: 10, curve: -0.2, open: 0.55});
const CLOSED = face({blink: 1, curve: 0.3});
const LISTEN = face({brow: 0.6, browIn: 0.6, gx: 0.8, mw: 12, curve: 0.1, open: 0.12});

export const C2Sheet: React.FC<{who: number; page: number}> = ({who, page}) => {
  const [look, b] = [[LISTENER, B_L], [OPERATOR, B_O], [PASSERBY, B_P]][who] as [Look4, Body4];
  const rows: React.ReactNode[] = [];
  if (page === 0) {
    // turnaround (bodies) and three faces
    const views = [0, 35, 90, -35, -90];
    const names = ['front', '3/4', 'profile', '3/4 L', 'profile L'];
    views.forEach((phi, i) => {
      const x = 110 + i * 215;
      rows.push(<g key={`t${i}`}><Crew4 id={`t${i}`} look={look} b={b} pose={stand(b)} cd={card(x, 720, 1.05, phi)} /><Lbl x={x} y={765} s={names[i]} /></g>);
    });
    const faces: [string, Pose4['face']][] = [['neutral', FACES.neutral], ['surprised', SURPRISE], ['eyes closed', CLOSED]];
    faces.forEach(([n, f], i) => {
      const x = 180 + i * 360;
      // bust crops: the head and shoulders at 2.3x, clipped to a frame so the bodies never overlap the rows below
      rows.push(
        <g key={`f${i}`}>
          <defs><clipPath id={`fc${i}`}><rect x={x - 165} y={830} width={330} height={350} rx={18} /></clipPath></defs>
          <rect x={x - 165} y={830} width={330} height={350} rx={18} fill="#F1E6CC" stroke="#3F5560" strokeWidth={2} />
          <g clipPath={`url(#fc${i})`}><Crew4 id={`f${i}`} look={look} b={b} pose={{...stand(b, f), hy: 20}} cd={card(x, 1880, 2.3, 0)} shadow={false} /></g>
          <Lbl x={x} y={1215} s={n} />
        </g>,
      );
    });
    // listening (hand cupped at the ear) and walking
    const HEADY = b.hipY + b.spine + 12 + b.headUp;
    // the cupped hand is placed from the ear (head yaw -25), as in the film
    const listen: Pose4 = {...stand(b, LISTEN), hy: -25, hr: 5, armL: {hand: v3(Math.cos(-25 * Math.PI / 180) * (b.R + 2) + 16, HEADY - 46, -Math.sin(-25 * Math.PI / 180) * (b.R + 2) - 6), shape: 'open', splay: 0.15, wrist: 15, curl: [0.3, 0.3, 0.3, 0.3]}};
    const walk: Pose4 = {...stand(b), pel: v3(0, b.hipY - 4, 0), footL: v3(b.hipW, 14, 40), footR: v3(-b.hipW, 22, -38), toeR: 26, armL: {hand: v3(b.shW + 12, b.hipY + b.spine - b.upper - b.fore + 22, -34)}, armR: {hand: v3(-b.shW - 12, b.hipY + b.spine - b.upper - b.fore + 22, 34)}};
    rows.push(<g key="l"><Crew4 id="l" look={look} b={b} pose={listen} cd={card(300, 1780, 1.05, 20)} /><Lbl x={300} y={1830} s="listening" /></g>);
    rows.push(<g key="w"><Crew4 id="w" look={look} b={b} pose={walk} cd={card(780, 1780, 1.05, 90)} /><Lbl x={780} y={1830} s="walking" /></g>);
  } else {
    // head turn strip: one head, yaw -90..90 in 15 deg steps (QA of the projection)
    for (let i = 0; i < 13; i++) {
      const hy = -90 + i * 15;
      const x = 140 + (i % 4) * 270, y = 420 + Math.floor(i / 4) * 470;
      rows.push(
        <g key={`h${i}`}>
          <defs><clipPath id={`hc${i}`}><rect x={x - 120} y={y - 150} width={240} height={270} rx={14} /></clipPath></defs>
          <rect x={x - 120} y={y - 150} width={240} height={270} rx={14} fill="#F1E6CC" stroke="#3F5560" strokeWidth={2} />
          <g clipPath={`url(#hc${i})`}><Crew4 id={`h${i}`} look={look} b={b} pose={{...stand(b, face({gx: hy / 120})), hy}} cd={card(x, y + 620, 1.6, 0)} shadow={false} /></g>
          <Lbl x={x} y={y + 150} s={`hy ${hy}`} />
        </g>,
      );
    }
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#FAF3DF'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs><clipPath id="pg"><rect x={0} y={0} width={1080} height={1920} /></clipPath></defs>
        <g clipPath="url(#pg)">{rows}</g>
      </svg>
    </AbsoluteFill>
  );
};
