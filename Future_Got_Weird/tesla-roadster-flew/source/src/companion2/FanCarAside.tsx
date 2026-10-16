// Brief aside: 1970s racing fan cars (a generic illustration, not a specific car). One drives in and sticks, rivals
// protest, and the fact-checker gives it a shove off the track ("quickly pushed out of racing").
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose, mixPose, reachLocal} from '../components/Character';
import {CAST} from '../components/cast';
import {Arrow, cue, E, FLOW, FORCE, Label, lerp, ramp, Tag, track, useT} from './kit';

const T = {
  race: cue('Race', 'P9'), seventies: cue('seventies', 'P9'), gripped: cue('gripped', 'P9'), rivals: cue('rivals', 'P9'),
  foul: cue('foul', 'P9'), cars: cue('cars', 'P9', 1), pushed: cue('pushed', 'P9'), racing: cue('racing', 'P9', 0, true),
};
const GROUND = 880;

const FanCar: React.FC<{x: number; spin: number}> = ({x, spin}) => (
  // generic 1970s fan car, facing right, 700 px long; (x, GROUND) is the middle of its footprint
  <g transform={`translate(${x} ${GROUND})`}>
    <ellipse cx={0} cy={4} rx={360} ry={16} fill="rgba(22,42,50,0.25)" />
    {/* skirt touching the ground */}
    <rect x={-250} y={-46} width={470} height={40} rx={6} fill="#2B2B33" stroke={C.ink} strokeWidth={4} />
    {/* body: low nose rising to the cockpit and a tall box at the tail housing the fan */}
    <path d="M 340 -40 L 330 -66 L 120 -110 L 40 -150 L -60 -152 L -150 -128 L -260 -150 L -350 -150 L -350 -40 Z" fill="#E9663F" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 330 -66 L 120 -110 L 110 -92 L 320 -54 Z" fill="#FFFBF0" opacity={0.9} />
    {/* driver's helmet */}
    <circle cx={-10} cy={-168} r={30} fill="#FFFBF0" stroke={C.ink} strokeWidth={4} />
    <path d="M 4 -176 L 32 -172 L 30 -158 L 6 -160 Z" fill="#2B3B5E" />
    {/* number roundel */}
    <circle cx={140} cy={-80} r={26} fill="#FFFBF0" stroke={C.ink} strokeWidth={3} />
    <text x={140} y={-70} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={30} fill={C.ink}>7</text>
    {/* the fan at the tail */}
    <circle cx={-300} cy={-96} r={50} fill="#3A4348" stroke={C.ink} strokeWidth={5} />
    <g transform={`translate(-300 -96) rotate(${spin})`}>
      {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M 0 0 Q 18 -30 6 -44 Q -10 -30 0 0" fill="#C9D3D9" transform={`rotate(${a})`} />)}
      <circle r={9} fill={C.ink} />
    </g>
    {/* wheels */}
    {[[230, 34], [-210, 44]].map(([wx, r]) => (
      <g key={wx}>
        <circle cx={wx} cy={-r} r={r} fill="#1E2328" stroke={C.ink} strokeWidth={4} />
        <circle cx={wx} cy={-r} r={r * 0.45} fill="#9AA6AD" />
      </g>
    ))}
  </g>
);

export const FanCarAside: React.FC<{start: number}> = ({start}) => {
  const t = useT(start);
  const frame = Math.round(t * 30);
  // drive in and stop, then a shove sends it rolling off to the left
  const x = track(t, [[start, -500], [T.seventies - 0.2, 893, E.out], [T.pushed - 0.05, 893], [T.pushed + 0.25, 860, E.out], [T.racing + 0.1, -560, E.in]]);
  const spin = t * 900;
  const grip = ramp(t, T.gripped - 0.2, T.gripped + 0.3) * (1 - ramp(t, T.pushed - 0.3, T.pushed));
  const signs = ramp(t, T.rivals - 0.2, T.rivals + 0.25, E.back);
  // she stands planted at the right with a push broom resting against the car's nose; one shove and it rolls away
  const CH = {x: 1520, y: GROUND, scale: 0.7};
  const ready = reachLocal(150, -215, 1);
  const thrust = reachLocal(205, -200, 1);
  const watch: Pose = {...IDLE, armR: ready, lookX: 0.7, lookY: 0.2, brows: 0.1, browAsym: 0.6, mouth: 'hmm', tilt: 3};
  const shove: Pose = {...IDLE, armR: thrust, lean: 5, tilt: 4, lookX: 0.8, lookY: 0.25, brows: -0.1, mouth: 'flat'};
  const after: Pose = {...IDLE, armR: ready, lean: 0, tilt: -2, lookX: -0.3, lookY: 0, brows: 0, browAsym: 0.4, mouth: 'smirk'};
  const pose = t < T.pushed - 0.35 ? watch : t < T.pushed + 0.5 ? mixPose(watch, shove, ramp(t, T.pushed - 0.35, T.pushed - 0.02, E.out)) : mixPose(shove, after, ramp(t, T.pushed + 0.5, T.pushed + 1.1));
  const broom = (
    <g>
      <line x1={0} y1={0} x2={262} y2={200} stroke="#9E6B30" strokeWidth={14} strokeLinecap="round" />
      <line x1={0} y1={0} x2={262} y2={200} stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <g transform="translate(262 200) rotate(37)">
        <rect x={-70} y={-12} width={140} height={26} rx={6} fill="#5B4636" stroke={C.ink} strokeWidth={4} />
        <rect x={-66} y={12} width={132} height={22} fill="#E3B77A" stroke={C.ink} strokeWidth={3} />
      </g>
    </g>
  );
  const drift = (t - start) * 10;
  const push = ramp(t, T.seventies - 0.4, T.pushed - 0.2, E.inOut); // slow push toward the stuck car
  const pulse = 1 + 0.18 * Math.sin(t * 7);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#F6E7C8 0%, #F1D9A8 60%, #E8C98E 100%)'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', transform: `translateX(${-drift}px) scale(${1 + 0.05 * push})`, transformOrigin: '55% 75%'}}>
        {/* grandstand and fence */}
        <rect x={-100} y={430} width={2200} height={190} fill="#D9B98A" stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 22}, (_, i) => <rect key={i} x={-80 + i * 100} y={450} width={70} height={30} rx={6} fill="#C99E66" />)}
        {Array.from({length: 22}, (_, i) => <rect key={`r${i}`} x={-60 + i * 100} y={500} width={70} height={30} rx={6} fill="#C99E66" />)}
        <rect x={-100} y={620} width={2200} height={70} fill="#EDE3CF" stroke={C.ink} strokeWidth={4} />
        {/* track and kerb */}
        <rect x={-100} y={690} width={2200} height={400} fill="#6B6F75" />
        {Array.from({length: 24}, (_, i) => <rect key={`k${i}`} x={-100 + i * 100} y={690} width={50} height={18} fill={i % 2 ? C.cream : C.coral} />)}
        <line x1={-100} y1={980} x2={2100} y2={980} stroke="#8A8F96" strokeWidth={8} strokeDasharray="60 50" />
      </svg>
      {/* protest placards pop up behind the fence */}
      {[{x: 420, text: 'FOUL!', r: -6}, {x: 760, text: 'NOT FAIR!', r: 5}].map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.x, top: 470 + 120 * (1 - signs), transform: `rotate(${p.r}deg)`, opacity: Math.min(1, signs * 1.4) * (1 - ramp(t, T.pushed + 0.6, T.pushed + 1.0))}}>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.ink, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 10, padding: '6px 18px'}}>{p.text}</div>
          <div style={{width: 12, height: 110, background: '#9E6B30', border: `3px solid ${C.ink}`, margin: '0 auto'}} />
        </div>
      ))}
      <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', transform: `translateX(${-drift}px) scale(${1 + 0.05 * push})`, transformOrigin: '55% 75%'}}>
        <FanCar x={x} spin={spin} />
        {/* suction: air pulled from under the car and blown out of the tail (blue), the car pressed down (saffron) */}
        <g opacity={grip}>
          <Arrow x1={x + 150} y1={GROUND - 22} x2={x - 210} y2={GROUND - 22} color={FLOW} w={8} head={20} outline={2} />
          <Arrow x1={x - 360} y1={GROUND - 96} x2={x - 480} y2={GROUND - 96} color={FLOW} w={10} head={24} outline={2} />
          {[-120, 20, 160].map((dx) => <Arrow key={dx} x1={x + dx} y1={GROUND - 200 - 90 * pulse} x2={x + dx} y2={GROUND - 200} color={FORCE} w={14} />)}
        </g>
      </svg>
      <Character look={CAST.checker} pose={pose} frame={frame} seed={4} x={CH.x} y={CH.y} scale={CH.scale} flip life={0.5} holdR={broom} front="R" />
      <Tag kind="illustration" text="Aside · generic 1970s fan car (illustration)" />
      <Label x={960} y={160} text="1970s racing: fans under the car" size={40} opacity={ramp(t, T.seventies - 0.3, T.seventies + 0.2) * (1 - ramp(t, T.rivals - 0.3, T.rivals))} />
    </AbsoluteFill>
  );
};
