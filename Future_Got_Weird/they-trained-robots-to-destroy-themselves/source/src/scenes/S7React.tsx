import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at, atEnd, NARRATION_END, frames} from '../lib/narration';
import {Camera, Layer, Cam} from '../lib/camera';
import {camPath, camKick, E, tw, kf} from '../lib/motion';
import {RobotSide} from '../components/Robot';
import {FoundryBack, Walkway, LadleBack, LadleFront, Splash, Heat, WALK_Y, EDGE_X, LADLE_X, RIM_Y, RIM_RX, FLOOR_Y} from '../components/Foundry';
import {jumpPose, walkTo, standPose, JumpPlan} from '../lib/moves';
import {joints} from '../lib/robot';
import {Svg, IllusTag, Card, Chip, Headline, Mark} from '../components/UI';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {P} from '../lib/poses';
import type {Sfx} from '../lib/sfx';

const S = 0.74;
const EDGE_HIP = EDGE_X - 52;

export const reactCues = () => {
  const landing = at('landing.') + 4;
  return {
    start: at('So why is it so'),
    shape: at("it's the shape"),
    arms: at('arms,'), legs: at('legs,'), head: at('head walks'),
    walks: at('walks to the edge'),
    choice: at('someone making'),
    but: at('But the choice'),
    ending: at('picked the ending'),
    target: at('built the target'),
    score: at('wrote the score'),
    policy: at('The policy just'),
    title: at('They trained robots to destroy'),
    want: at("The robots didn't want"),
    stuck: at('They just stuck'),
    landing,
    J: {crouchAt: landing - 30, takeoff: landing - 20, entry: landing, edgeX: EDGE_HIP, groundY: WALK_Y, target: {x: LADLE_X - 10, y: RIM_Y + 6}, scale: S, apex: 60} as JumpPlan,
    question: at('Does retiring'),
    narrEnd: frames(NARRATION_END),
  };
};

export const END_CARD_FRAMES = 180;

export const SFX = (): Sfx[] => {
  const c = reactCues();
  return [
    {f: c.start, kind: 'amb_foundry', dur: (c.question - c.start) / 30 + 1, gain: -6},
    {f: c.walks + 4, kind: 'robot_step', gain: -8},
    {f: c.walks + 13, kind: 'robot_step', gain: -8, pitch: -1},
    {f: c.walks + 22, kind: 'robot_step', gain: -8},
    {f: c.choice + 6, kind: 'pop_tick', gain: -8},
    {f: c.but + 6, kind: 'pop_tick', gain: -6, pitch: -4},
    {f: c.J.takeoff, kind: 'robot_push', gain: -6},
    {f: c.landing, kind: 'molten_entry', gain: -14},
    {f: c.landing + 2, kind: 'sizzle', dur: 2.5, gain: -14},
    {f: c.landing + 6, kind: 'card_flick', gain: -6, note: 'scorecards up'},
    {f: c.question + 12, kind: 'paper_slide', gain: -8},
    {f: c.narrEnd + 8, kind: 'card_flick', gain: -6, note: 'ask Arnold note'},
    {f: c.narrEnd + 30, kind: 'sting_end', gain: -4},
  ];
};

export const S7React: React.FC = () => {
  const g = useG();
  const c = reactCues();

  const r = g < c.walks ? standPose(EDGE_HIP - 150, WALK_Y, S, g, 0.3) : g < c.J.crouchAt ? walkTo(g, c.walks, c.walks + 30, EDGE_HIP - 150, EDGE_HIP, WALK_Y, S, 170) : jumpPose(g, c.J).pose;
  const tIn = g - c.landing;
  const flare = tIn >= 0 ? Math.exp(-tIn / 9) : 0;
  const ripple = tIn >= 0 ? Math.min(1, tIn / 34) : -1;
  const burn = tIn >= 0 ? Math.min(1, tIn / 3) : 0;
  const gone = tIn >= 0 ? tw(g, c.landing + 6, 6, E.in) : 0;

  const camClose: Cam = {cx: 840, cy: 420, zoom: 1.75};
  let cam = camPath(g, camClose, [
    {at: c.walks - 4, dur: 30, to: {cx: 900, cy: 430, zoom: 1.7}},
    {at: c.but + 4, dur: 30, to: {cx: 1010, cy: 600, zoom: 1.0}},
  ]);
  cam = {...cam, zoom: cam.zoom * camKick(g, [c.landing], 0.016)};

  const shape = tw(g, c.shape, 12) * (1 - tw(g, c.walks, 12));
  const bubble = tw(g, c.choice, 12, E.back) * (1 - tw(g, c.but + 2, 6, E.in));
  const pop = tw(g, c.but + 2, 8);
  const people = (t0: number) => tw(g, t0 - 4, 14, E.out);
  const emptyBubble = tw(g, c.want, 10, E.back) * (1 - tw(g, c.stuck, 8));
  const cards = tw(g, c.landing + 4, 8, E.back);
  const titleIn = tw(g, c.title, 14, E.out) * (1 - tw(g, c.question + 6, 10));
  const qIn = tw(g, c.question + 12, 14, E.back);
  const arnold = tw(g, c.narrEnd + 6, 14, E.back);
  const endIn = tw(g, c.narrEnd + 50, 18);

  const j = joints(r);
  const scaleW = (p: {x: number; y: number}) => ({x: r.x + (p.x - r.x) * S, y: r.y + (p.y - r.y) * S});
  const headW = scaleW(j.headBase), handW = scaleW(j.armN.wrist), kneeW = scaleW(j.legN.knee);

  const holdUp = (on: number, left = false) => left
    ? P({armL: {a: 160 * on + 10 * (1 - on), b: 10}, armR: {a: 12, b: 20}, brows: 0.5, mouth: on > 0.5 ? 'smile' : 'flat', lookX: -0.6})
    : P({armR: {a: 160 * on + 10 * (1 - on), b: 10}, armL: {a: 12, b: 20}, brows: 0.5, mouth: on > 0.5 ? 'smile' : 'flat', lookX: 0.6});

  return (
    <AbsoluteFill style={{background: '#EFE6D3', overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Layer depth={0.45}><FoundryBack frame={g} id="s7" glow={1 + flare} /></Layer>
        <Layer depth={1}>
          <Walkway />
          <LadleBack frame={g} id="s7l" flare={flare} ripple={ripple} rippleX={LADLE_X - 10} />
          {/* the target ring "built" by people */}
          <Svg opacity={people(c.target) * (1 - tw(g, c.title, 10))}>
            <ellipse cx={LADLE_X} cy={RIM_Y + 6} rx={RIM_RX * 0.5} ry={20} fill="none" stroke={C.teal} strokeWidth={8} strokeDasharray="20 14" />
          </Svg>
          <Svg>
            <defs>
              <clipPath id="aboveSteel7"><rect x={-2000} y={-2000} width={6000} height={2000 + RIM_Y + 8} /></clipPath>
              <filter id="shapeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feMorphology in="SourceAlpha" operator="dilate" radius={7} result="d" />
                <feFlood floodColor={C.saffron} />
                <feComposite in2="d" operator="in" />
              </filter>
            </defs>
            {shape > 0 && <g filter="url(#shapeGlow)" opacity={shape}><RobotSide pose={r} scale={S} /></g>}
            {gone < 1 && (
              <g clipPath={tIn >= 0 ? 'url(#aboveSteel7)' : undefined}>
                <RobotSide pose={r} scale={S} opacity={1 - gone} />
              </g>
            )}
            {tIn > 0 && tIn < 100 && [0, 1, 2, 3, 4, 5].map((i) => {
              const tt = tIn + 3 - i * 1.5;
              if (tt < 0) return null;
              return <circle key={i} cx={LADLE_X - 70 + i * 28 + Math.sin(tt / 9 + i) * 10} cy={RIM_Y - 30 - tt * 2.0 - (i % 2) * 30} r={40 + tt * 1.1} fill="#FFF8EC" stroke="#EADCC4" strokeWidth={3} opacity={Math.max(0, 0.85 - tt / 70)} />;
            })}
            {/* shape labels */}
            {shape > 0 && (
              <g opacity={shape} fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>
                {[[c.arms, handW, -110, 'arms'], [c.legs, kneeW, -110, 'legs'], [c.head, headW, -120, 'head']].map(([t0, p, dx, label], i) => {
                  const a = tw(g, (t0 as number) - 2, 8, E.back);
                  const q = p as {x: number; y: number};
                  return (
                    <g key={i} opacity={a}>
                      <line x1={q.x} y1={q.y} x2={q.x + (dx as number)} y2={q.y - 30} stroke={C.ink} strokeWidth={2.5} />
                      <rect x={q.x + (dx as number) - 62} y={q.y - 52} width={70} height={34} rx={17} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
                      <text x={q.x + (dx as number) - 27} y={q.y - 28} textAnchor="middle">{label as string}</text>
                    </g>
                  );
                })}
              </g>
            )}
            {/* thought bubble */}
            {(bubble > 0 || emptyBubble > 0) && (
              <g transform={`translate(${headW.x + (bubble > 0 ? 40 : 70)} ${headW.y - (bubble > 0 ? 90 : 120)}) scale(${bubble > 0 ? bubble * 0.55 : emptyBubble * 0.9})`}>
                <path d="M -120 0 Q -140 -70 -60 -80 Q -20 -120 40 -90 Q 120 -100 120 -30 Q 150 30 70 40 Q 20 80 -40 50 Q -130 60 -120 0 Z" fill={C.white} stroke={C.ink} strokeWidth={5} strokeDasharray="14 10" />
                <circle cx={-90} cy={70} r={12} fill={C.white} stroke={C.ink} strokeWidth={4} />
                <circle cx={-110} cy={100} r={7} fill={C.white} stroke={C.ink} strokeWidth={4} />
                {bubble > 0 && <text x={0} y={-6} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={50} fill={C.ink}>a choice?</text>}
              </g>
            )}
            {pop > 0 && pop < 1 && <circle cx={headW.x + 40} cy={headW.y - 110} r={30 + 90 * pop} fill="none" stroke={C.coral} strokeWidth={6 * (1 - pop)} />}
          </Svg>
          <LadleFront id="s7f" />
          <Splash x={LADLE_X - 10} y={RIM_Y + 4} t={tIn} n={16} seed={9} />
          <Heat frame={g} />
          {/* cast */}
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
            {people(c.score) > 0 && <Character look={CAST.clerkC} pose={g > c.landing + 2 ? holdUp(cards) : P({armR: {a: 30, b: 70}, lookX: 0.7})} frame={g} x={250} y={600} scale={0.78} seed={5} style={{opacity: people(c.score)}} />}
            {people(c.ending) > 0 && <Character look={CAST.checker} pose={g > c.landing + 2 ? holdUp(cards) : P({armR: {a: 40, b: 60}, lookX: 0.7, brows: 0.3})} frame={g} x={520} y={600} scale={0.78} seed={3} style={{opacity: people(c.ending)}} />}
            {people(c.target) > 0 && <Character look={CAST.clerkB} pose={g > c.landing + 2 ? holdUp(cards, true) : P({armL: {a: 100, b: -10}, lookX: -0.8, brows: 0.3})} frame={g} x={1790} y={FLOOR_Y - 20} scale={0.78} seed={4} style={{opacity: people(c.target)}} />}
          </div>
          {/* score cards: "10" */}
          {cards > 0 && (
            <Svg>
              {[[250, 600], [520, 600], [1790, FLOOR_Y - 20]].map(([x, y], i) => (
                <g key={i} transform={`translate(${x + (i === 2 ? -72 : 72)} ${y - 350 - 20 * cards}) scale(${cards})`}>
                  <rect x={-50} y={-60} width={100} height={80} rx={10} fill={C.white} stroke={C.ink} strokeWidth={5} />
                  <text x={0} y={2} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={54} fill={C.ink}>10</text>
                </g>
              ))}
            </Svg>
          )}
        </Layer>
      </Camera>
      {flare > 0.02 && <AbsoluteFill style={{background: '#FFC56E', opacity: 0.22 * flare, mixBlendMode: 'multiply'}} />}

      {/* labels for the people (screen space, during the reveal) */}
      {g > c.ending - 6 && g < c.title && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - tw(g, c.title - 8, 8)}}>
          <div style={{position: 'absolute', left: 300, top: 640, opacity: people(c.ending)}}><Chip tone="ink" size={30}>picked the ending</Chip></div>
          <div style={{position: 'absolute', left: 1480, top: 960, opacity: people(c.target)}}><Chip tone="teal" size={30}>built the target</Chip></div>
          <div style={{position: 'absolute', left: 40, top: 570, opacity: people(c.score)}}><Chip tone="saffron" size={30}>wrote the score</Chip></div>
          <div style={{position: 'absolute', left: 60, top: 40, opacity: people(c.ending)}}><Chip tone="paper" size={26}>illustrative people, not Figure’s team</Chip></div>
          {g > c.policy && (
            <Card x={760} y={36} w={560} h={150} bg={C.saffronLight} opacity={tw(g, c.policy, 12, E.back)} pad={24}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <div style={{position: 'relative', width: 64, height: 64}}><Mark ok x={0} y={0} size={64} /></div>
                <Headline size={44}>The policy hit its target</Headline>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* the title, said out loud */}
      {titleIn > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 890, display: 'flex', justifyContent: 'center', opacity: titleIn}}>
          <div style={{background: 'rgba(250,243,223,0.94)', border: `5px solid ${C.ink}`, borderRadius: 22, padding: '18px 40px', fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.ink}}>
            They trained robots to destroy themselves.
          </div>
        </div>
      )}

      {/* closing question */}
      {qIn > 0 && (
        <AbsoluteFill style={{background: `rgba(250,243,223,${0.82 * qIn})`}}>
          <Card x={260} y={250} w={1400} h={420} opacity={qIn} scale={0.92 + 0.08 * qIn} pad={60}>
            <Chip tone="coral" size={30}>OVER TO YOU</Chip>
            <Headline size={78} style={{marginTop: 26}}>Does retiring hardware feel different when the hardware looks like us?</Headline>
          </Card>
          {arnold > 0 && (
            <Card x={1180} y={720} w={600} h={220} bg={C.saffronLight} rot={-3} opacity={arnold * (1 - endIn)} scale={0.85 + 0.15 * arnold} pad={26}>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.inkSoft}}>Retirement options, revised:</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 14}}>
                <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 56}}>4. Ask Arnold</div>
                <div style={{position: 'relative', width: 66, height: 66}}><Mark ok x={0} y={0} size={66} /></div>
              </div>
            </Card>
          )}
        </AbsoluteFill>
      )}

      {/* end card */}
      {endIn > 0 && (
        <AbsoluteFill style={{background: C.paper, opacity: endIn, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 132, color: C.ink, letterSpacing: '-0.01em'}}>
            FUTURE <span style={{color: C.coral}}>GOT</span> WEIRD
          </div>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 48, color: C.inkSoft, marginTop: 14}}>The strange future, explained.</div>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 32, color: C.inkMuted, marginTop: 60}}>Sources and the original film are linked in the description.</div>
        </AbsoluteFill>
      )}
      {g < c.question + 26 && <IllusTag opacity={1 - qIn} />}
    </AbsoluteFill>
  );
};
