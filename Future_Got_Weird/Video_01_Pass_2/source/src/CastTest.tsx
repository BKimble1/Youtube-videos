import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F} from './theme';
import {CAST} from './components/cast';
import {Character, IDLE, Pose} from './components/Character';

/** Dev still: the whole cast in a lineup with a few poses, to check the rig by eye. */
export const CastTest: React.FC = () => {
  const frame = useCurrentFrame();
  const names = Object.keys(CAST);
  const poses: Pose[] = [
    IDLE,
    {...IDLE, armR: {a: 40, b: 80}, mouth: 'grin', brows: 0.6, lookX: 0.6},
    {...IDLE, armL: {a: 20, b: 120}, armR: {a: 20, b: 120}, mouth: 'o', brows: 1, lookY: -0.5},
    {...IDLE, lean: -6, tilt: 8, mouth: 'smirk', browAsym: 1, lookX: -0.5},
    {...IDLE, armR: {a: 70, b: 40}, mouth: 'flat', brows: -0.6},
    {...IDLE, armL: {a: 30, b: 100}, mouth: 'frown', brows: -0.3, lookY: 0.6},
    {...IDLE, armR: {a: 100, b: 50}, mouth: 'talk', brows: 0.3},
    {...IDLE, mouth: 'hmm', browAsym: 0.8, lookX: 0.8, lookY: -0.3, tilt: -6},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <div style={{position: 'absolute', left: 60, top: 40, fontFamily: F.display, fontSize: 48, color: C.ink, fontWeight: 600}}>Future Got Weird · cast rig check</div>
      {names.map((n, i) => (
        <React.Fragment key={n}>
          <Character look={CAST[n]} pose={poses[i % poses.length]} frame={frame} seed={i + 1} x={170 + i * 230} y={760} scale={1.05} />
          <div style={{position: 'absolute', left: 170 + i * 230 - 100, width: 200, top: 790, textAlign: 'center', fontFamily: F.body, fontSize: 26, color: C.inkSoft, fontWeight: 700}}>{n}</div>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: 60, top: 880, fontFamily: F.body, fontSize: 30, color: C.inkSoft}}>
        Fredoka display · <span style={{fontFamily: F.body}}>Nunito body</span> · <span style={{fontFamily: F.serif}}>Source Serif quotes</span> · <span style={{fontFamily: F.mono}}>JetBrains 2001</span>
      </div>
    </AbsoluteFill>
  );
};
