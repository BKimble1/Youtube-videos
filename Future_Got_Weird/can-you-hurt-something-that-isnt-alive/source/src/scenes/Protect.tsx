import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Paper, Card, Tag, Line} from '../components/Scenic';
import {C, F} from '../theme';
import {T, frames} from '../lib/narration';
import {easeOut, clamp01} from '../lib/anim';

// 155.1 to 210.9 s. Anthropic's stated reason, its position on the argument, and the two concerns (unequal labels).
export const Protect: React.FC = () => {
  const f = useCurrentFrame();
  const S0 = frames(T('Anthropic gives a reason'));
  const at = (s: number) => frames(s) - S0;
  const fade = (s: number, d = 12) => easeOut(clamp01((f - at(s)) / d));
  const outAt = (s: number, d = 12) => 1 - easeOut(clamp01((f - at(s)) / d));
  const closeWin = clamp01((f - at(T('In August 2025') + 2)) / 14);

  return (
    <Paper>
      {/* the feature: a chat ends, a new chat opens */}
      <div style={{position: 'absolute', inset: 0, opacity: fade(T('Anthropic gives a reason'), 12) * outAt(T('It also says'), 12)}}>
        <Card x={200} y={210} w={600} h={420} bg={C.white} style={{padding: 26, opacity: 1 - closeWin * 0.5}}>
          <div style={{background: C.blueLight, borderRadius: 16, padding: 16, fontSize: 30, width: '70%', fontFamily: F.body, fontWeight: 700}}>Can you hear me?</div>
          <div style={{background: C.saffronLight, borderRadius: 16, padding: 16, fontSize: 30, width: '60%', marginLeft: 'auto', marginTop: 14, fontFamily: F.body, fontWeight: 700}}>Yes.</div>
          <div style={{marginTop: 40}}><Tag bg={C.coral} fg={C.white} size={34} opacity={fade(T('end a conversation'), 8)}>conversation ended</Tag></div>
        </Card>
        <Card x={900} y={260} w={600} h={300} bg={C.cream} opacity={fade(T('The company says'), 10)}>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 40}}>new chat</div>
        </Card>
        <Card x={200} y={650} w={1320} h={230} bg={C.cream} style={{padding: 34}}>
          <div style={{fontFamily: F.serif, fontSize: 44, lineHeight: 1.3}}>
            “This ability is intended for use in rare, extreme cases of persistently harmful or abusive user interactions.”
          </div>
          <div style={{marginTop: 14, fontFamily: F.mono, fontSize: 24, color: C.inkSoft}}>anthropic.com · Aug 15, 2025 · Claude Opus 4 and 4.1</div>
        </Card>
      </div>

      {/* the company's stated uncertainty, verbatim */}
      <div style={{position: 'absolute', inset: 0, opacity: fade(T('It also says'), 12) * outAt(T("Here's the argument"), 12)}}>
        <Card x={300} y={300} w={1320} h={280} bg={C.white} style={{padding: 44}}>
          <div style={{fontFamily: F.serif, fontSize: 50, lineHeight: 1.32}}>
            “We remain highly uncertain about the potential moral status of Claude and other LLMs, now or in the future.”
          </div>
          <div style={{marginTop: 18, fontFamily: F.mono, fontSize: 24, color: C.inkSoft}}>anthropic.com · Claude Opus 4 and 4.1 can now end a rare subset of conversations</div>
        </Card>
      </div>

      {/* the argument, labelled as a position */}
      <div style={{position: 'absolute', inset: 0, opacity: fade(T("Here's the argument"), 12) * outAt(T('There are two concerns'), 12)}}>
        <Tag x={300} y={250} bg={C.saffron} size={40}>ANTHROPIC’S POSITION</Tag>
        <Line x={300} y={340} w={1320} size={62} style={{fontFamily: F.display, fontWeight: 700}}>If something is felt, a cheap safeguard matters.</Line>
        <Line x={300} y={460} w={1320} size={62} style={{fontFamily: F.display, fontWeight: 700}}>If nothing is felt, it costs little.</Line>
        <Tag x={300} y={620} bg={C.white} size={34}>a position, not a measured result</Tag>
      </div>

      {/* two concerns: different labels, so they do not read as equal odds */}
      <div style={{position: 'absolute', inset: 0, opacity: fade(T('There are two concerns'), 12) * outAt(T('So, can you hurt'), 12)}}>
        <Card x={300} y={250} w={620} h={380} bg={C.white} style={{padding: 36}}>
          <Tag bg={C.saffronLight} size={28}>a well-known pattern</Tag>
          <div style={{marginTop: 28, fontFamily: F.body, fontWeight: 700, fontSize: 46, lineHeight: 1.3}}>Over-reading feelings</div>
          <div style={{marginTop: 18, fontFamily: F.body, fontSize: 36, color: C.inkSoft, lineHeight: 1.3}}>people read feelings into anything that expresses them</div>
        </Card>
        <Card x={1000} y={250} w={620} h={380} bg={C.white} style={{padding: 36}}>
          <Tag bg={C.blueLight} size={28}>a possibility, not yet ruled out</Tag>
          <div style={{marginTop: 28, fontFamily: F.body, fontWeight: 700, fontSize: 46, lineHeight: 1.3}}>Dismissing it</div>
          <div style={{marginTop: 18, fontFamily: F.body, fontSize: 36, color: C.inkSoft, lineHeight: 1.3}}>because it’s inconvenient is also a mistake</div>
        </Card>
      </div>
    </Paper>
  );
};
