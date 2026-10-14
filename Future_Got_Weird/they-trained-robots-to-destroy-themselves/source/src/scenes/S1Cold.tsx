import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at, atEnd} from '../lib/narration';
import {Camera, Layer, Cam} from '../lib/camera';
import {camPath, camKick, E, tw, kf} from '../lib/motion';
import {RobotSide} from '../components/Robot';
import {FoundryBack, Walkway, LadleBack, LadleFront, Splash, Heat, WALK_Y, EDGE_X, LADLE_X, RIM_Y} from '../components/Foundry';
import {jumpPose, walkTo, standPose, JumpPlan} from '../lib/moves';
import {Svg, IllusTag, Card, Chip, Sweep, Headline} from '../components/UI';
import type {Sfx} from '../lib/sfx';

const S = 0.74; // robot scale in the foundry shot
const EDGE_HIP = EDGE_X - 52; // hip x when the toes are at the edge

/** Cue plan, shared with the sound mix (see SFX below). */
export const coldCues = () => {
  const entry = at('steel.'); // the soles meet the steel on the word "steel"
  const J: JumpPlan = {crouchAt: entry - 34, takeoff: entry - 22, entry, edgeX: EDGE_HIP, groundY: WALK_Y, target: {x: LADLE_X - 10, y: RIM_Y + 6}, scale: S, apex: 70};
  const walk1 = {f0: -26, f1: J.crouchAt - 2, x0: 420, x1: EDGE_HIP};
  const r2 = {f0: entry + 18, f1: at('It\'s not') + 6, x0: 150, x1: EDGE_HIP - 210};
  const r2b = {f0: at('So why') - 30, f1: at('So why') + 16, x0: EDGE_HIP - 210, x1: EDGE_HIP};
  const r3 = {f0: entry + 40, f1: at('It\'s not') + 40, x0: -160, x1: EDGE_HIP - 470};
  const panelIn = at('It\'s not');
  const panelOut = at('So why') - 4;
  return {entry, J, walk1, r2, r2b, r3, panelIn, panelOut};
};

export const SFX = (): Sfx[] => {
  const c = coldCues();
  const steps: Sfx[] = [];
  // footfalls of the first robot (metal walkway): one per half-stride while walking
  for (let f = 0; f < c.walk1.f1; f += 9) steps.push({f, kind: 'robot_step', gain: -6, pitch: (f / 9) % 2 ? 0 : -1});
  return [
    {f: 0, kind: 'amb_foundry', dur: 23, gain: -3},
    ...steps,
    {f: c.J.crouchAt + 4, kind: 'servo_whir', gain: -4},
    {f: c.J.takeoff, kind: 'robot_push', gain: -2},
    {f: c.entry, kind: 'molten_entry', gain: -5},
    {f: c.entry + 2, kind: 'sizzle', dur: 3.5, gain: -8},
    {f: c.panelIn, kind: 'paper_slide', gain: -4},
    {f: c.panelIn + 10, kind: 'card_flick', gain: -6},
    {f: at('and the Finnish'), kind: 'card_flick', gain: -6},
    {f: c.panelOut, kind: 'paper_swish', gain: -6},
    {f: at('So why'), kind: 'pop_tick', gain: -6},
    {f: at('And how'), kind: 'pop_tick', gain: -6, pitch: 2},
  ];
};

export const S1Cold: React.FC = () => {
  const g = useG();
  const c = coldCues();
  const jump = jumpPose(g, c.J);
  const r1 = g < c.J.crouchAt ? walkTo(g, c.walk1.f0, c.walk1.f1, c.walk1.x0, c.walk1.x1, WALK_Y, S) : jump.pose;
  const r2 = g < c.r2b.f0 ? walkTo(g, c.r2.f0, c.r2.f1, c.r2.x0, c.r2.x1, WALK_Y, S) : walkTo(g, c.r2b.f0, c.r2b.f1, c.r2b.x0, c.r2b.x1, WALK_Y, S);
  const r2look = g > c.r2b.f1 ? standPose(EDGE_HIP, WALK_Y, S, g, Math.min(1, (g - c.r2b.f1) / 12)) : r2;
  const r3 = walkTo(g, c.r3.f0, c.r3.f1, c.r3.x0, c.r3.x1, WALK_Y, S);

  // camera: follow robot 1 to the edge, hold on the entry, then frame robot 2 for the evidence beat
  const start: Cam = {cx: 960, cy: 560, zoom: 1.2};
  let cam = camPath(g, start, [
    {at: 4, dur: 64, to: {cx: 1120, cy: 590, zoom: 1.26}, ease: E.inOut},
    {at: c.entry + 34, dur: 44, to: {cx: 880, cy: 560, zoom: 1.16}},
    {at: c.panelIn - 6, dur: 24, to: {cx: 1300, cy: 560, zoom: 1.22}},
    {at: c.panelOut, dur: 24, to: {cx: 1150, cy: 420, zoom: 1.0}},
  ]);
  cam = {...cam, zoom: cam.zoom * camKick(g, [c.entry], 0.018)};

  // entry effects
  const tIn = g - c.entry;
  const flare = tIn >= 0 ? Math.exp(-tIn / 9) : 0;
  const ripple = tIn >= 0 ? Math.min(1, tIn / 34) : -1;
  const burn = tIn >= 0 ? Math.min(1, tIn / 3) : 0;
  const gone = tIn >= 0 ? tw(g, c.entry + 6, 6, E.in) : 0;

  const panel = tw(g, c.panelIn, 18, E.out) * (1 - tw(g, c.panelOut, 16, E.in));
  const card1 = tw(g, c.panelIn + 10, 14, E.back);
  const sweep1 = tw(g, at('says the jumps'), atEnd('were real,') - at('says the jumps'), E.inOut);
  const card2 = tw(g, at('and the Finnish'), 14, E.back);
  const sweep2 = tw(g, at('watched them'), atEnd('go in.') - at('watched them'), E.inOut);
  const q1 = tw(g, at('So why'), 14, E.back);
  const q2 = tw(g, at('And how'), 14, E.back);

  return (
    <AbsoluteFill style={{background: '#EFE6D3', overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Layer depth={0.45}>
          <FoundryBack frame={g} id="s1" glow={1 + flare} />
        </Layer>
        <Layer depth={1}>
          <Walkway />
          <LadleBack frame={g} id="s1l" flare={flare} ripple={ripple} rippleX={LADLE_X - 10} />
          <Svg>
            <defs>
              <clipPath id="aboveSteel">
                <rect x={-2000} y={-2000} width={6000} height={2000 + RIM_Y + 8} />
              </clipPath>
            </defs>
            {/* queue: robots 3 and 2 behind, robot 1 in front */}
            {g > c.r3.f0 - 1 && <RobotSide pose={r3} scale={S} />}
            <RobotSide pose={g > c.r2b.f1 ? r2look : r2} scale={S} />
            {gone < 1 && (
              <g clipPath={tIn >= 0 ? 'url(#aboveSteel)' : undefined}>
                <RobotSide pose={r1} scale={S} opacity={1 - gone} />
              </g>
            )}
            {/* smoke puffs after entry */}
            {tIn > 0 && tIn < 100 && [0, 1, 2, 3, 4, 5].map((i) => {
              const tt = tIn + 3 - i * 1.5;
              if (tt < 0) return null;
              const sx = LADLE_X - 70 + i * 28 + Math.sin(tt / 9 + i) * 10;
              return <circle key={i} cx={sx} cy={RIM_Y - 30 - tt * 2.0 - (i % 2) * 30} r={40 + tt * 1.1} fill="#FFF8EC" stroke="#EADCC4" strokeWidth={3} opacity={Math.max(0, 0.85 - tt / 70)} />;
            })}
          </Svg>
          <LadleFront id="s1f" />
          <Splash x={LADLE_X - 10} y={RIM_Y + 4} t={tIn} n={16} seed={3} />
          <Heat frame={g} />
        </Layer>
      </Camera>

      {/* flash of light on entry: a warm wash, not a white strobe */}
      {flare > 0.02 && <AbsoluteFill style={{background: '#FFC56E', opacity: 0.22 * flare, mixBlendMode: 'multiply'}} />}

      <IllusTag opacity={1 - panel} />

      {/* evidence panel */}
      {panel > 0 && (
        <div style={{position: 'absolute', left: 1920 - 1140 * panel, top: 0, width: 1140, height: 1080, background: C.paper, borderLeft: `6px solid ${C.ink}`, boxShadow: `-14px 0 0 ${C.shadow}`}}>
          <div style={{position: 'absolute', left: 60, top: 58}}>
            <Chip tone="ink" size={26}>WHO SAYS IT HAPPENED</Chip>
          </div>
          <Card x={60} y={130} w={1020} h={470} opacity={card1} scale={0.92 + 0.08 * card1} pad={36}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontFamily: F.mono, fontSize: 28, color: C.inkSoft}}>figure.ai · “F.02 Decommission”</span>
              <Chip tone="saffron" size={26}>Sep 30, 2026</Chip>
            </div>
            <div style={{marginTop: 26, fontFamily: F.serif, fontSize: 46, lineHeight: 1.28}}>
              “…we <Sweep p={sweep1}>really trained robots to jump autonomously</Sweep>, shipped them to Finland, and had them leap into a vat of molten steel.”
            </div>
            <div style={{marginTop: 20, fontSize: 28, fontWeight: 800, color: C.inkSoft}}>The company’s own statement</div>
          </Card>
          <Card x={60} y={640} w={1020} h={360} bg={C.cream} opacity={card2} scale={0.92 + 0.08 * card2} pad={36}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontFamily: F.mono, fontSize: 28, color: C.inkSoft}}>Ovako steel plant · Imatra, Finland</span>
              <Chip tone="teal" size={24}>SECOND SOURCE</Chip>
            </div>
            <div style={{marginTop: 24, fontFamily: F.body, fontWeight: 800, fontSize: 44, lineHeight: 1.22}}>
              Its spokesperson says she <Sweep p={sweep2} color={C.tealLight}>watched the robots jump in.</Sweep>
            </div>
            <div style={{marginTop: 18, fontSize: 28, fontWeight: 700, color: C.inkSoft}}>As reported by Yle, Finland’s public broadcaster</div>
          </Card>
        </div>
      )}

      {/* the two questions */}
      {q1 > 0 && (
        <Card x={70} y={70} w={860} h={210} opacity={q1} scale={0.9 + 0.1 * q1} rot={-1.2} pad={30} bg={C.white}>
          <Chip tone="coral" size={24}>QUESTION 1</Chip>
          <Headline size={54} style={{marginTop: 14}}>Why make a spectacle of it?</Headline>
        </Card>
      )}
      {q2 > 0 && (
        <Card x={990} y={70} w={860} h={210} opacity={q2} scale={0.9 + 0.1 * q2} rot={1.2} pad={30} bg={C.white}>
          <Chip tone="blue" size={24}>QUESTION 2</Chip>
          <Headline size={54} style={{marginTop: 14}}>How do you teach that jump?</Headline>
        </Card>
      )}
    </AbsoluteFill>
  );
};
