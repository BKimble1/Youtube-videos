import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Paper, Card, Tag, Line} from '../components/Scenic';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {C, F} from '../theme';
import {T, frames} from '../lib/narration';
import {easeOut, clamp01} from '../lib/anim';
import {poseTrack, P} from '../lib/poses';

// 54.1 to 97.3 s. Same question, different setups; then the printer joke; then the sincere-sounding trap.
export const Chatbot: React.FC = () => {
  const f = useCurrentFrame();
  const S0 = frames(T('So why not'));
  const at = (s: number) => frames(s) - S0;
  const fade = (s: number, d = 12) => easeOut(clamp01((f - at(s)) / d));
  const outAt = (s: number) => 1 - easeOut(clamp01((f - at(s)) / 10));
  const panels = outAt(T("There's a second"));
  const funnel = fade(T("There's a second"), 12) * outAt(T('This scene is illustrative'));
  const printerIn = fade(T('This scene is illustrative'), 12);
  const clerkX = 1700 - easeOut(clamp01((f - at(T('This scene is illustrative'))) / 60)) * 520;
  const sincere = fade(T('And here’s'), 14);
  const under = fade(T('what’s'), 10);

  const clerk = poseTrack(f, [[0, P({armR: {a: 40, b: 10}})], [at(T('This scene is illustrative')), P({armR: {a: 60, b: -20}, mouth: 'smile'})], [at(T('Yes')) , P({armR: {a: 60, b: -30}, mouth: 'o'})], [at(T('That’s the joke')), P({armR: {a: 30, b: 30}, mouth: 'smile'})]]);
  const checker = poseTrack(f, [[0, P({})], [at(T('So why not')) + 15, P({armR: {a: 60, b: 4}, brows: 0.6})], [at(T('And here’s')), P({armR: {a: 70, b: -10}, lookX: 0.8, brows: 0.8})]]);

  return (
    <Paper>
      {/* 1. the same question, three setups (all labelled illustrative) */}
      <div style={{position: 'absolute', inset: 0, opacity: panels}}>
        <Card x={460} y={150} w={1000} h={110} bg={C.white} style={{padding: 26}}>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 36}}>“How do you feel when people are rude to you?”</div>
        </Card>
        {[
          {x: 180, setup: 'setup 1: cheerful shop assistant', reply: 'Happy to help, always!', bg: C.saffronLight, d: 0},
          {x: 720, setup: 'setup 2: tragic stage role', reply: 'It stings more than you’d think.', bg: C.coralLight, d: 2},
          {x: 1260, setup: 'setup 3: “describe your feelings honestly”', reply: 'I may have something like feelings. I can’t be sure.', bg: C.tealLight, d: 4},
        ].map((p) => (
          <div key={p.x} style={{opacity: fade(T('So why not') + 1.5 + p.d * 0.5, 10)}}>
            <Tag x={p.x} y={320} size={24} bg={C.white}>{p.setup}</Tag>
            <Card x={p.x} y={390} w={480} h={230} bg={p.bg}>
              <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 38, lineHeight: 1.25}}>{p.reply}</div>
            </Card>
          </div>
        ))}
        <Tag x={560} y={680} bg={C.white} size={28}>ILLUSTRATIVE: invented replies to show how setup changes wording</Tag>
      </div>

      {/* 2. three inputs shape one reply */}
      <div style={{position: 'absolute', inset: 0, opacity: funnel}}>
        <Tag x={180} y={260} bg={C.blueLight} size={36}>how it was trained</Tag>
        <Tag x={180} y={420} bg={C.saffronLight} size={36}>what it was told</Tag>
        <Tag x={180} y={580} bg={C.tealLight} size={36}>what’s been said so far</Tag>
        <Line x={860} y={380} w={900} size={52} style={{fontFamily: F.display, fontWeight: 700}}>
          One reply. Three inputs. Change any of them, and the wording changes.
        </Line>
      </div>

      {/* 3. the printer joke (illustrative) */}
      <div style={{position: 'absolute', inset: 0, opacity: printerIn * outAt(T("And here's"))}}>
        <div style={{position: 'absolute', left: 1400, top: 540, width: 300, height: 230, background: C.cream, border: '5px solid ' + C.ink, borderRadius: 18, boxShadow: `10px 12px 0 ${C.shadow}`}}>
          <div style={{position: 'absolute', left: 60, top: -70, width: 180, height: 90, background: C.white, border: '5px solid ' + C.ink, borderRadius: 6}} />
          <div style={{position: 'absolute', left: 80, top: 170, width: 90, height: 16, background: C.blue, borderRadius: 8}} />
        </div>
        <div style={{position: 'absolute', left: 1450, top: 790, fontSize: 56, color: C.blue, fontFamily: F.body}}>💧💧</div>
        <Tag x={1400} y={840} bg={C.white} size={24}>ILLUSTRATIVE: a crying printer</Tag>
        <Character look={CAST.clerkA} pose={clerk} frame={f} x={clerkX} y={900} scale={1.05} seed={7} life={0.6} />
        <Character look={CAST.checker} pose={checker} frame={f} x={420} y={900} scale={1.05} seed={3} life={0.6} />
        <Card x={1040} y={560} w={190} h={120} bg={C.white} rot={-6} style={{padding: 14, fontSize: 24}}>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 26, textAlign: 'center'}}>sympathy card</div>
        </Card>
        <Tag x={560} y={230} bg={C.white} size={34} opacity={fade(T("Yes,"), 10)}>Evidence?</Tag>
        <Line x={1000} y={160} w={820} size={48} style={{fontFamily: F.display, fontWeight: 700, opacity: fade(T('Yes,'), 10)}}>
          The printer is crying. That’s the joke.
        </Line>
      </div>

      {/* 4. the sincere-sounding trap */}
      <div style={{position: 'absolute', inset: 0, opacity: sincere}}>
        <Card x={560} y={200} w={820} h={180} bg={C.white}>
          <div style={{fontFamily: F.serif, fontSize: 44, lineHeight: 1.3}}>“I really do feel that. It hurts.”</div>
        </Card>
        <Line x={560} y={470} w={820} size={46}>A sincere-sounding answer shows what the setup produced.</Line>
        <div style={{position: 'absolute', left: 560, top: 640, width: 820, height: 200, opacity: under, border: `4px dashed ${C.inkSoft}`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 54, color: C.inkSoft}}>
          what’s underneath? not shown
        </div>
      </div>
    </Paper>
  );
};
