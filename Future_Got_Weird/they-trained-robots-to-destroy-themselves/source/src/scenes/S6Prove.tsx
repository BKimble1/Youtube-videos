import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at} from '../lib/narration';
import {E, tw} from '../lib/motion';
import {Card, Chip, Headline, Mark} from '../components/UI';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {P} from '../lib/poses';
import type {Sfx} from '../lib/sfx';

export const proveCues = () => ({
  start: at('So what does this prove'),
  less: at('Less than it looks'),
  one: at('One movement'),
  target: at('for one kind of target'),
  people: at('with people arranging'),
  plant: at('The steel plant says experts'),
  seen: at("We haven't seen"),
  rate: at('a failure rate'),
  report: at('a test report'),
  check: at('an independent check'),
  shows: at('It shows a trained'),
  doesnt: at("It doesn't show"),
  end: at('So why is it so'),
});

export const SFX = (): Sfx[] => {
  const c = proveCues();
  return [
    {f: c.one + 2, kind: 'pop_tick', gain: -8},
    {f: c.target + 2, kind: 'pop_tick', gain: -8, pitch: 2},
    {f: c.people + 2, kind: 'pop_tick', gain: -8, pitch: 4},
    {f: c.plant + 4, kind: 'card_flick', gain: -6},
    {f: c.rate + 2, kind: 'pop_tick', gain: -8, pitch: -2},
    {f: c.report + 2, kind: 'pop_tick', gain: -8, pitch: -2},
    {f: c.check + 2, kind: 'pop_tick', gain: -8, pitch: -2},
    {f: c.shows + 4, kind: 'ding_yes', gain: -8},
    {f: c.doesnt + 4, kind: 'buzz_no', gain: -8},
  ];
};

const Row: React.FC<{text: string; a: number; ok: boolean | null; dashed?: boolean}> = ({text, a, ok, dashed}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 22, minHeight: 92, opacity: a, transform: `translateY(${(1 - a) * 18}px)`}}>
    <div style={{position: 'relative', width: 66, height: 66, flex: '0 0 66px'}}>
      {ok === null ? <div style={{width: 58, height: 58, border: `5px dashed ${C.inkMuted}`, borderRadius: 12}} /> : <Mark ok={ok} x={0} y={0} size={64} />}
    </div>
    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, lineHeight: 1.15, color: dashed ? C.inkSoft : C.ink}}>{text}</div>
  </div>
);

export const S6Prove: React.FC = () => {
  const g = useG();
  const c = proveCues();
  const a = (t0: number) => tw(g, t0 - 2, 12, E.out);
  const checker = g < c.seen ? P({armR: {a: 40, b: 60}, lookX: 0.8, brows: 0.3, mouth: 'hmm'}) : g < c.shows ? P({armR: {a: 40, b: 60}, lookX: 0.8, brows: 0.8, browAsym: 0.6, mouth: 'flat'}) : P({armR: {a: 96, b: -10}, lookX: 0.9, brows: 0.4});
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <div style={{position: 'absolute', left: 80, top: 60, opacity: tw(g, c.start, 12)}}>
        <Headline size={76}>What does this prove?</Headline>
        <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 44, color: C.coralDeep, marginTop: 6, opacity: tw(g, c.less, 10)}}>Less than it looks like.</div>
      </div>
      {/* SHOWN */}
      <Card x={520} y={250} w={640} h={700} bg={C.white} opacity={tw(g, c.one - 6, 12)} pad={34}>
        <Chip tone="teal" size={30}>WHAT IT SHOWS</Chip>
        <div style={{marginTop: 22}}>
          <Row text="One trained movement" a={a(c.one)} ok={true} />
          <Row text="…for one kind of target" a={a(c.target)} ok={true} />
          <Row text="…with people arranging everything around it" a={a(c.people)} ok={true} />
          <Row text="A trained jump survived a brutal environment (per Figure)" a={a(c.shows)} ok={true} />
        </div>
      </Card>
      {/* NOT SHOWN */}
      <Card x={1210} y={250} w={640} h={700} bg={C.cream} opacity={tw(g, c.seen - 6, 12)} pad={34}>
        <Chip tone="coral" size={30}>WHAT WE HAVEN’T SEEN</Chip>
        <div style={{marginTop: 22}}>
          <Row text="A failure rate" a={a(c.rate)} ok={null} dashed />
          <Row text="A test report" a={a(c.report)} ok={null} dashed />
          <Row text="An independent check of the autonomy" a={a(c.check)} ok={null} dashed />
          <Row text="A robot that can handle any factory" a={a(c.doesnt + 10)} ok={false} />
        </div>
      </Card>
      {/* safety and supervision note from the host plant */}
      {g > c.plant - 4 && (
        <Card x={80} y={290} w={410} h={330} bg={C.tealLight} rot={-1.5} opacity={tw(g, c.plant - 4, 12, E.back)} pad={26}>
          <Chip tone="ink" size={22}>THE STEEL PLANT SAYS</Chip>
          <div style={{fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginTop: 14}}>Experts supervised the work, alongside normal production.</div>
          <div style={{fontSize: 22, fontWeight: 700, color: C.inkSoft, marginTop: 10}}>Ovako, via Yle</div>
        </Card>
      )}
      <Character look={CAST.checker} pose={checker} frame={g} x={280} y={1080} scale={0.95} seed={3} />
    </AbsoluteFill>
  );
};
