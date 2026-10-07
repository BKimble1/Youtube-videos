import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {StampArm} from '../components/v2/StampArm';
import {RollingNumber} from '../components/v2/RollingNumber';
import {DrawBox} from '../components/v2/DrawBox';
import {Slip, StampMark} from '../components/Props';
import {Character, IDLE} from '../components/Character';
import {CAST} from '../components/cast';
import {impact, sp, SNAP, tw} from '../lib/motion';

/** Dev composition: the V2 shared motion pieces in isolation. */
export const Kit: React.FC = () => {
  const g = useCurrentFrame();
  const hits = [40, 58, 76];
  const xs = [420, 960, 1500];
  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, height: 440, background: C.wood, borderTop: `6px solid ${C.ink}`}} />
      {xs.map((x, i) => {
        const [sx, sy] = impact(g, hits[i], 0.06, 10);
        return (
          <div key={i} style={{position: 'absolute', left: x - 220, top: 520, transform: `scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}}>
            <Slip model="ChatGPT" detail="GPT-4o · 9 May 2025" width={440} fontSize={26} stamp={{text: 'Wrong', tone: 'coral', t: g >= hits[i] ? 1 : 0}}>
              A confident answer slip with a title and a year.
            </Slip>
          </div>
        );
      })}
      <StampArm g={g} enter={20} exit={100} targets={[{at: 34, x: 560, y: 640}, {at: 52, x: 1100, y: 640}, {at: 70, x: 1640, y: 640}]} hits={hits} />
      <div style={{position: 'absolute', left: 80, top: 60}}>
        <RollingNumber from={6} to={7} t={sp(g, 30, SNAP)} />
      </div>
      <div style={{position: 'absolute', left: 260, top: 60}}>
        <RollingNumber from={7} to={4} t={sp(g, 50, SNAP)} bg={C.coral} />
      </div>
      <DrawBox t={tw(g, 10, 24)} x={500} y={60} w={420} h={140} tone="coral" />
      <Character look={CAST.checker} pose={IDLE} frame={g} seed={3} x={1600} y={500} scale={0.8} />
      <div style={{position: 'absolute', left: 1100, top: 80, fontSize: 40, fontFamily: 'monospace'}}>f{g}</div>
    </AbsoluteFill>
  );
};
