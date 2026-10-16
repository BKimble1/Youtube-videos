import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import plan from '../data/companion_shots.json';
import {C} from '../theme';
import {E, tw} from '../lib/motion';
import {Chip, Paper} from '../kit/base';
import {FootageShot, SlotId} from '../kit/Footage';
import {SuctionDiagram, ThrusterDiagram} from '../kit/Diagrams';
import {AccelCard, TargetCard, TrimCards} from '../kit/Cards';
import {
  Balloon, Checklist, EventCard, FanCarCard, GCompare, GMeter, LaunchOverlay, PartsDiagram, Question, SeparateCard, Sources,
  SpaceXCard, Tiles, Timeline, Verdict,
} from './Panels';

/**
 * The 16:9 companion. Shot times and in-shot cues come from data/companion_shots.json, which tools/plan_companion.py
 * resolves from cue words in the stitched narration. Footage shots play official Tesla clips (data/footage.json).
 */
export const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
type Shot = {id: string; a: number; b: number; kind: string; slot?: string; offset?: number; chip?: string; overlay?: string; cues: Record<string, number>};
const SHOTS = plan.shots as Shot[];
export const COMPANION_FRAMES = fr(plan.duration);
export const COMPANION_SLOTS = Array.from(new Set(SHOTS.flatMap((s) => (s.slot ? [s.slot] : [])))) as SlotId[];

const Enter: React.FC<{children: React.ReactNode; how: 'push' | 'iris' | 'cut'}> = ({children, how}) => {
  const f = useCurrentFrame();
  if (how === 'cut') return <AbsoluteFill>{children}</AbsoluteFill>;
  if (how === 'iris') {
    const r = tw(f, 0, 9, E.inOut) * 2300;
    return <AbsoluteFill style={{clipPath: f >= 9 ? undefined : `circle(${r}px at 960px 540px)`}}>{children}</AbsoluteFill>;
  }
  const u = tw(f, 0, 9, E.out);
  return <AbsoluteFill style={{transform: `translateX(${(1 - u) * 520}px)`, opacity: Math.min(1, u * 1.6)}}>{children}</AbsoluteFill>;
};

const Illus: React.FC = () => (
  <div style={{position: 'absolute', left: 60, top: 50}}><Chip text="ILLUSTRATION · not Tesla's actual layout" kind="illus" size={28} /></div>
);

const AnimShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const c = (k: string) => fr(shot.cues[k] - shot.a); // cue as a frame within this shot
  switch (shot.kind) {
    case 'tiles':
      return <Paper><Tiles f={f} at={[c('t1'), c('t2'), c('t3')]} labelsAt={c('labels')} askAt={c('ask')} /></Paper>;
    case 'event':
      return <Paper><EventCard f={f} /></Paper>;
    case 'timeline':
      return <Paper><Timeline f={f} at17={c('y17')} at28={c('y28')} /></Paper>;
    case 'suction':
      return (
        <Paper>
          <Illus />
          <div style={{position: 'absolute', left: 120, top: 110, width: 900, height: 900}}>
            <SuctionDiagram f={f} fanAt={c('fan')} gapAt={c('gap')} pushAt={c('push')} gravAt={c('grav')} />
          </div>
          <GMeter f={f} gAt={c('grav')} twoAt={c('two')} doubleAt={c('double')} />
        </Paper>
      );
    case 'fancar':
      return <Paper><FanCarCard f={f} rulesAt={c('rules')} /></Paper>;
    case 'separate':
      return <Paper><SeparateCard f={f} at={c('sep')} /></Paper>;
    case 'parts':
      return <Paper><PartsDiagram f={f} tankAt={c('tank')} valvesAt={c('valves')} nozzAt={c('nozzles')} fuelAt={c('fuel')} flameAt={c('flame')} /></Paper>;
    case 'balloon':
      return <Paper><Balloon f={f} at={c('go') + 10} /></Paper>;
    case 'thrust':
      return (
        <Paper>
          <Illus />
          <div style={{position: 'absolute', left: 480, top: 60, width: 960, height: 960}}>
            <ThrusterDiagram f={f} a0={c('a0')} a1={c('a1')} b0={c('b0')} b1={c('b1')} />
          </div>
        </Paper>
      );
    case 'spacex':
      return <Paper><SpaceXCard f={f} airAt={c('air')} /></Paper>;
    case 'notshown':
      return (
        <Paper>
          <Checklist f={f} mark="x" title="What the demo didn't show"
            items={[['Sustained flight', c('i1')], ['A useful flying range', c('i2')], ['Certified passenger flight', c('i3')]]} />
        </Paper>
      );
    case 'accel':
      return <Paper><div style={{position: 'absolute', left: 410, top: 110}}><AccelCard f={f} tagAt={c('tag')} portrait={false} /></div></Paper>;
    case 'gcompare':
      return <Paper><GCompare f={f} gAt={c('g')} tiresAt={c('tires')} thrAt={c('thr')} pushAt={c('push')} /></Paper>;
    case 'trims':
      return (
        <Paper>
          <div style={{position: 'absolute', left: 120, top: 240}}>
            <TrimCards f={f} portrait={false} w={1680} highlightAt={c('r')} stampAt={c('stamp')} seq={[c('p'), c('t'), c('r')]} />
          </div>
        </Paper>
      );
    case 'verdict':
      return (
        <Paper>
          <Verdict f={f}
            shown={[['Left the ground for a few seconds', c('s1')], ['Rolled itself upright on jets of air', c('s2')], ['Landed on the pavement', c('s3')]]}
            notYet={[['A flying car you can actually drive', c('n1')], ['A flying version approved for the road', c('n2')]]} />
        </Paper>
      );
    case 'target':
      return <Paper><div style={{position: 'absolute', left: 410, top: 170}}><TargetCard f={f} portrait={false} /></div></Paper>;
    case 'question':
      return <Paper><Question f={f} aAt={c('a')} bAt={c('b')} /></Paper>;
    case 'sources':
      return <Paper><Sources f={f} /></Paper>;
    default:
      return null;
  }
};

const FootShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FootageShot id={shot.slot as SlotId} offset={shot.offset ?? 0} push={0.03} markTop={40} markSize={26} />
      {shot.chip && (
        <div style={{position: 'absolute', right: 50, top: 40, opacity: tw(f, shot.cues.chipAt ? fr(shot.cues.chipAt - shot.a) : 6, 10)}}>
          <Chip text={shot.chip} kind="demo" size={30} />
        </div>
      )}
      {shot.overlay === 'launch' && <LaunchOverlay f={f} rampAt={fr(shot.cues.ramp - shot.a)} jetsAt={fr(shot.cues.jets - shot.a)} />}
    </AbsoluteFill>
  );
};

export const CompanionMain: React.FC<{audio?: boolean}> = ({audio = true}) => (
  <AbsoluteFill style={{background: C.paper}}>
    {SHOTS.map((s, i) => {
      const prev = SHOTS[i - 1];
      const how = s.kind === 'foot' ? 'cut' : !prev || prev.kind === 'foot' ? 'iris' : 'push';
      return (
        <Sequence key={s.id} from={fr(s.a)} durationInFrames={fr(s.b) - fr(s.a)} name={`${s.id} ${s.kind}`}>
          <Enter how={how}>{s.kind === 'foot' ? <FootShot shot={s} /> : <AnimShot shot={s} />}</Enter>
        </Sequence>
      );
    })}
    {audio && <Audio src={staticFile('companion/narration_companion.wav')} />}
    {audio && <Audio src={staticFile('companion/sfx_companion.wav')} />}
  </AbsoluteFill>
);
