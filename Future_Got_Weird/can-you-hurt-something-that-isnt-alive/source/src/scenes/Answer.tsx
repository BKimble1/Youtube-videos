import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Paper, Card, Tag, Line, Sweep, Mark} from '../components/Scenic';
import {Monitor, Covering} from '../components/Monitor';
import {C, F} from '../theme';
import {T, frames, NARRATION_END} from '../lib/narration';
import {easeOut, clamp01} from '../lib/anim';

// 210.9 to the end of the narration. The covering comes off completely; the code shows a mechanism, not an experience.
const CODE = [
  'def assess(system):',
  '    score = indicators(system)',
  '    felt = unknown',
  '    if not felt:',
  '        return "precaution"',
];

export const Answer: React.FC = () => {
  const f = useCurrentFrame();
  const S0 = frames(T('So, can you hurt'));
  const at = (s: number) => frames(s) - S0;
  const fade = (s: number, d = 12) => easeOut(clamp01((f - at(s)) / d));
  const outAt = (s: number, d = 12) => 1 - easeOut(clamp01((f - at(s)) / d));
  const peel = clamp01((f - at(T('So, can you hurt') + 0.2)) / at(T('So, can you hurt') + 3) );

  return (
    <Paper>
      <div style={{position: 'absolute', left: 1200, top: 170, opacity: 1}}>
        <Monitor x={0} y={0} w={620} h={400}>
          <div style={{position: 'absolute', left: 24, top: 24, fontFamily: F.mono, fontWeight: 500, fontSize: 22, lineHeight: '34px', color: C.cream, whiteSpace: 'pre'}}>
            {CODE.join('\n')}
          </div>
          <Covering peel={peel} w={572} h={352} />
        </Monitor>
        <Tag x={0} y={430} bg={C.cream} size={24}>ILLUSTRATIVE code, not any real system</Tag>
      </div>

      <div style={{position: 'absolute', inset: 0, opacity: fade(T("Here's the precise"), 10) * outAt(T('What would count'), 12)}}>
        <Line x={140} y={220} w={1000} size={50}>Current evidence doesn’t establish <Sweep p={fade(T("doesn't establish"), 14)}>subjective suffering.</Sweep></Line>
        <Line x={140} y={340} w={1000} size={50} opacity={fade(T('A convincing reaction'), 10)}>A convincing reaction alone can’t settle it.</Line>
        <Line x={140} y={460} w={1000} size={50} opacity={fade(T('And being alive'), 10)}>Being alive isn’t a sufficient test.</Line>
        <Mark ok={false} x={100} y={580} size={60} opacity={fade(T('Life and consciousness'), 10)} />
        <Line x={190} y={580} w={1000} size={44} opacity={fade(T('Life and consciousness'), 10)}>Life and consciousness are different questions.</Line>
      </div>

      <div style={{position: 'absolute', inset: 0, opacity: fade(T('What would count'), 12) * outAt(T('Revealing the code'), 12)}}>
        <Card x={140} y={210} w={900} h={250} bg={C.tealLight} style={{padding: 34}}>
          <Tag bg={C.teal} fg={C.white} size={26}>counts as evidence</Tag>
          <div style={{marginTop: 22, fontFamily: F.body, fontWeight: 700, fontSize: 40, lineHeight: 1.3}}>Checks on how a system works, measured against theories.</div>
        </Card>
        <Card x={140} y={500} w={900} h={200} bg={C.coralLight} style={{padding: 34}}>
          <Tag bg={C.coral} fg={C.white} size={26}>does not count alone</Tag>
          <div style={{marginTop: 22, fontFamily: F.body, fontWeight: 700, fontSize: 40, lineHeight: 1.3, textDecoration: 'line-through'}}>The system’s own description of itself.</div>
        </Card>
        <Tag x={140} y={760} bg={C.white} size={36} opacity={fade(T('Brains predict'), 10)}>Saying “just predicting words” doesn’t settle it either. Brains predict too.</Tag>
      </div>

      <div style={{position: 'absolute', inset: 0, opacity: fade(T('Revealing the code'), 12)}}>
        <Line x={140} y={260} w={960} size={58} style={{fontFamily: F.display, fontWeight: 700}}>
          Revealing the code doesn’t reveal whether anyone is home.
        </Line>
        <Tag x={140} y={480} bg={C.saffron} size={46}>The rule is a precaution, not a proof.</Tag>
        <Line x={140} y={600} w={960} size={44} color={C.inkSoft}>That’s a decision, not a conclusion.</Line>
      </div>
    </Paper>
  );
};
