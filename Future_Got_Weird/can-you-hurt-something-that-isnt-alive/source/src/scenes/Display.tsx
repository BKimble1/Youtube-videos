import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Paper, Card, Tag, Line, Dashed} from '../components/Scenic';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {C, F} from '../theme';
import {T, frames} from '../lib/narration';
import {easeOut, clamp01} from '../lib/anim';
import {poseTrack, P} from '../lib/poses';

// Display versus experience: 30.0 to 53.6 s. A game character takes a hit: a convincing display.
export const Display: React.FC = () => {
  const f = useCurrentFrame();
  const S0 = frames(T('Picture'));
  const at = (s: number) => frames(s) - S0;
  const gameIn = easeOut(clamp01((f - at(30.0)) / 14));
  const hitX = poseTrack(f, [
    [0, P({})],
    [at(31.2), P({lean: -6, brows: 1})],
    [at(31.8), P({lean: 16, tilt: 12, armL: {a: 40, b: 60}, armR: {a: 20, b: 80}, mouth: 'o', brows: -1})],
    [at(33.2), P({lean: 10, tilt: 6, armL: {a: 36, b: 56}, armR: {a: 18, b: 84}, mouth: 'frown', brows: -1})],
    [at(35.0), P({lean: 10, tilt: 6, armL: {a: 36, b: 56}, armR: {a: 18, b: 84}, mouth: 'frown', brows: -1})],
    [at(36.5), P({lean: 2, tilt: 0, armL: {a: 10, b: 14}, armR: {a: 10, b: 14}, mouth: 'flat', brows: -0.3})],
  ]);
  const shove = Math.sin(clamp01((f - at(31.8)) / at(3.6)) * Math.PI) * -36 * (f >= at(31.8) ? 1 : 0);
  const freezeIn = easeOut(clamp01((f - at(35.2)) / 12));
  const gapIn = easeOut(clamp01((f - at(T("That's the gap"))) / 16));
  const limitIn = easeOut(clamp01((f - at(T('This example'))) / 14));

  return (
    <Paper>
      <div style={{position: 'absolute', left: 420, top: 150, width: 1080, height: 600, opacity: gameIn, background: C.blueLight, border: '6px solid ' + C.ink, borderRadius: 26, boxShadow: `10px 12px 0 ${C.shadow}`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 64, background: C.blue, borderBottom: '6px solid ' + C.ink}} />
        <Tag x={28} y={14} bg={C.saffron} size={26}>DISPLAY</Tag>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, background: C.blueDeep, borderTop: '6px solid ' + C.ink}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: `translateX(${shove}px)`}}>
          <Character look={CAST.guesser} pose={hitX} frame={f} x={540} y={500} scale={0.95} seed={5} life={0.5} />
        </div>
        <div style={{position: 'absolute', left: 560, top: 120, opacity: freezeIn, fontFamily: F.display, fontWeight: 700, fontSize: 40, color: C.ink}}>
          <Tag bg={C.white} size={30}>one frame of an animation</Tag>
        </div>
      </div>

      {/* inside the character: nothing on screen tells us */}
      <Dashed x={1300} y={800} w={460} h={180} opacity={gapIn}>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 40, color: C.ink}}>inner state: not shown</div>
      </Dashed>
      <Line x={380} y={800} w={880} size={46} opacity={gapIn}>
        The animation is a <span style={{color: C.coralDeep}}>display</span>. It doesn’t show what happens inside.
      </Line>

      {/* the analogy's limit, stated plainly */}
      <Tag x={520} y={920} bg={C.coral} fg={C.white} size={34} opacity={limitIn}>a gap in evidence, not a claim about AI</Tag>
    </Paper>
  );
};
