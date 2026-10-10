import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Paper, Card, Tag, Line, Sweep, Mark, Dashed} from '../components/Scenic';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {C, F} from '../theme';
import {T, frames} from '../lib/narration';
import {easeOut, clamp01} from '../lib/anim';
import {poseTrack, P} from '../lib/poses';

// 97.3 to 155.1 s. What researchers check instead: one indicator, its limit, and what the 2023 report suggested.
export const Indicator: React.FC = () => {
  const f = useCurrentFrame();
  const S0 = frames(T('So researchers look'));
  const at = (s: number) => frames(s) - S0;
  const fade = (s: number, d = 12) => easeOut(clamp01((f - at(s)) / d));
  const outAt = (s: number, d = 12) => 1 - easeOut(clamp01((f - at(s)) / d));

  const spot = clamp01((f - at(T("Here's one"))) / (at(T('check whether a design')) - at(T("Here's one"))) );
  const limit = fade(T('Even this is hard'), 10);
  const wouldnt = fade(T("But passing that"), 12);
  const suggested = clamp01((f - at(T('suggested'))) / 20);
  const researcher = poseTrack(f, [
    [0, P({})],
    [at(T('So researchers look')) + 12, P({armR: {a: 58, b: 4}, lookX: -0.4})],
    [at(T('Here’s one')), P({armR: {a: 66, b: 2}, lookX: 0.5, brows: 0.8})],
    [at(T('But passing that')), P({armR: {a: 22, b: 30}, mouth: 'flat'})],
  ]);
  const modules = Array.from({length: 6}, (_, i) => ({x: 460 + (i % 3) * 300, y: 260 + Math.floor(i / 3) * 210}));

  return (
    <Paper>
      {/* the three paper records on the bench */}
      <div style={{position: 'absolute', inset: 0, opacity: outAt(T("Here's one"), 10)}}>
        {[{t: 'THEORY', x: 1100, rot: -6, d: 0}, {t: 'INDICATOR', x: 1300, rot: 3, d: 1.2}, {t: 'SYSTEM', x: 1500, rot: -2, d: 2.4}].map((c) => (
          <Card key={c.t} x={c.x} y={210 + (c.d * 4) - 0} w={170} h={200} rot={c.rot} bg={C.cream} opacity={fade(T('So researchers look') + c.d * 0.8, 10)} style={{padding: 16}}>
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 26, textAlign: 'center', marginTop: 40}}>{c.t}</div>
          </Card>
        ))}
        <Card x={1040} y={700} w={740} h={60} bg={C.woodLight} style={{padding: 0}} />
        <Character look={CAST.checker} pose={researcher} frame={f} x={520} y={900} scale={1.05} seed={11} life={0.6} />
        <Line x={1040} y={420} w={800} size={46}>Researchers check the design, not the reply.</Line>
      </div>

      {/* one indicator, drawn as a spotlight across modules */}
      <div style={{position: 'absolute', inset: 0, opacity: fade(T("Here's one"), 10) * outAt(T('Even this is hard'), 12)}}>
        <Card x={400} y={190} w={1100} h={680} bg={C.blueLight}>
          <div style={{position: 'absolute', left: 30, top: 22, fontFamily: F.display, fontWeight: 700, fontSize: 40}}>
            Broadcast? Is information shared widely across the system?
          </div>
          {modules.map((m, i) => (
            <div key={i} style={{position: 'absolute', left: m.x - 400 + 40, top: m.y - 190 + 70, width: 220, height: 160, background: C.white, border: `4px solid ${C.ink}`, borderRadius: 16}} />
          ))}
          <div style={{position: 'absolute', left: 0, top: 90, width: 1100, height: 590, clipPath: `polygon(0 0, ${spot * 1100}px 0, ${spot * 1100 + 260}px 590px, ${spot * 1100 - 40}px 590px)`, background: `linear-gradient(180deg, rgba(255,199,68,0.75), rgba(255,199,68,0.18))`}} />
        </Card>
        <Tag x={560} y={920} bg={C.saffron} size={34}>a checkable design feature, one of several</Tag>
      </div>

      {/* the limit */}
      <div style={{position: 'absolute', inset: 0, opacity: limit * outAt(T("But passing that"), 12)}}>
        <Tag x={560} y={330} bg={C.coral} fg={C.white} size={90}>LIMIT</Tag>
        <Line x={560} y={480} w={1200} size={50}>Whether broadcasting is the right feature is <Sweep p={limit} color={C.coralLight}>disputed.</Sweep></Line>
      </div>

      {/* passing the check does not prove consciousness */}
      <div style={{position: 'absolute', inset: 0, opacity: wouldnt * outAt(T('Their 2023 analysis'), 12)}}>
        <Mark ok={true} x={560} y={300} size={120} opacity={wouldnt} scale={0.7 + 0.3 * wouldnt} />
        <Line x={740} y={320} w={1100} size={52}>Passing that check wouldn’t prove consciousness.</Line>
        <Dashed x={560} y={560} w={1200} h={150} opacity={wouldnt}>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 40}}>Indicators come from theories that are still disputed.</div>
        </Dashed>
      </div>

      {/* what the 2023 analysis said, and its limits */}
      <div style={{position: 'absolute', inset: 0, opacity: fade(T('Their 2023 analysis'), 12) * outAt(T('Anthropic gives a reason'), 12)}}>
        <Card x={300} y={240} w={1320} h={340} bg={C.white} style={{padding: 40}}>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 48, lineHeight: 1.35}}>
            Their 2023 analysis <Sweep p={suggested}>suggested</Sweep> the systems they considered weren’t conscious.
          </div>
          <div style={{marginTop: 20, fontFamily: F.body, fontSize: 40, color: C.inkSoft}}>They saw no obvious technical barrier to building systems with these indicators.</div>
        </Card>
        <Tag x={300} y={650} bg={C.tealLight} size={36} opacity={fade(T('They also saw'), 10)}>arXiv:2308.08708 · Butlin, Long et al. · 2023</Tag>
        <Tag x={300} y={740} bg={C.saffron} size={36} opacity={fade(T("That was an assessment"), 10)}>2023 systems, not a verdict on today’s models</Tag>
      </div>
    </Paper>
  );
};
