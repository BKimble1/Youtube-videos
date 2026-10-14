import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at, atEnd} from '../lib/narration';
import {E, tw, kf, ring} from '../lib/motion';
import {Camera, Layer, Cam} from '../lib/camera';
import {rand} from '../lib/anim';
import {RobotSide} from '../components/Robot';
import {FoundryBack, Walkway, LadleBack, LadleFront, Heat, WALK_Y, EDGE_X} from '../components/Foundry';
import {SimBackdrop, Lane, Slider, alongLoop, SIMC} from '../components/Sim';
import {standPose, jumpPose, crouchPose, JumpPlan} from '../lib/moves';
import {joints, RobotPose, STAND_HEIGHT} from '../lib/robot';
import {Svg, IllusTag, Card, Chip, Headline, Mark} from '../components/UI';
import {Airbag, CameraIcon, ChipIcon} from '../components/Props';
import type {Sfx} from '../lib/sfx';

export const realCues = () => ({
  start: at('But a simulator'),
  slack: at('Real joints'),
  flat: at('Real floors'),
  noisy: at('Sensors are'),
  never: at('And Figure says this jump'),
  visited: at('never visited.'),
  messy: at('A common fix'),
  change: at('Change the weight'),
  dontKnow: at("We don't know"),
  general: at("That's just"),
  airbag: at('Figure also rehearsed'),
  airbags: at('giant airbags.'),
  foundry: at('And the foundry did'),
  heat: at('Figure says the heat'),
  cameras: at('cameras and other'),
  electronics: at('electronics,'),
  policies: at('and the policies'),
  end: at('So what does this prove'),
});

export const SFX = (): Sfx[] => {
  const c = realCues();
  const out: Sfx[] = [
    {f: c.start, kind: 'amb_sim', dur: 2, gain: -6},
    {f: c.slack + 6, kind: 'servo_whir', gain: -8},
    {f: c.noisy + 6, kind: 'static', gain: -8},
    {f: c.visited, kind: 'map_pin', gain: -6},
    {f: c.dontKnow + 10, kind: 'stamp', gain: -4},
  ];
  for (let f = c.change; f < c.dontKnow - 6; f += 20) out.push({f, kind: 'slider_tick', gain: -12});
  out.push({f: airbagLand(c) - 1, kind: 'airbag', gain: -7});
  out.push({f: c.foundry, kind: 'amb_foundry', dur: (c.end - c.foundry) / 30, gain: -2});
  out.push({f: c.cameras + 4, kind: 'static', gain: -4});
  out.push({f: c.electronics + 2, kind: 'static', gain: -6, pitch: -3});
  out.push({f: c.policies + 6, kind: 'ding_yes', gain: -8});
  return out;
};

const airbagLand = (c: ReturnType<typeof realCues>) => at('giant') + 3;

/** The real-world robot with a slack knee wobble (amount 0..1). */
const wobbleKnee = (p: RobotPose, g: number, amt: number): RobotPose => ({...p, kneeN: p.kneeN + amt * 5 * Math.sin(g * 1.3), lean: p.lean + amt * 1.2 * Math.sin(g * 0.9 + 1)});

export const S5Real: React.FC = () => {
  const g = useG();
  const c = realCues();

  // R1: split screen
  const r1 = 1 - tw(g, c.messy - 6, 12);
  const slack = tw(g, c.slack, 12);
  const flat = tw(g, c.flat, 12);
  const noisy = tw(g, c.noisy, 12);
  const pin = tw(g, c.never + 10, 14, E.back);

  // R2: messy simulation (domain randomisation, conceptual)
  const r2 = tw(g, c.messy - 6, 12) * (1 - tw(g, c.airbag - 6, 12));
  const round = Math.floor(Math.max(0, g - c.change) / 20);
  const rv = (k: number) => (g < c.change ? 0.5 : 0.2 + 0.6 * rand(round * 17 + k * 5 + 3));
  const tint = ['#E9F1FC', '#EEF6EE', '#F6F0FA', '#FBF3E6', '#EAF4F7'][round % 5];
  const qStamp = tw(g, c.dontKnow + 10, 8, E.out);

  // R3: airbag rehearsal
  const r3 = tw(g, c.airbag - 6, 12) * (1 - tw(g, c.foundry - 6, 12));
  const land = airbagLand(c);
  const J: JumpPlan = {crouchAt: land - 34, takeoff: land - 24, entry: land, edgeX: 690, groundY: 470, target: {x: 1130, y: 770}, scale: 0.78, apex: 60};
  const jp = g < J.crouchAt ? {pose: standPose(690, 470, 0.78, g, 0.5)} : jumpPose(Math.min(g, land), J);
  const squash = g < land ? 0 : Math.max(0, Math.exp(-(g - land) / 7) * Math.cos((g - land) * 0.45));
  const robotAir: RobotPose = g < land ? jp.pose : crouchPose(1130, 770 + 34 * squash, 0.78, kf(g - land, [[0, 0.25], [5, 0.9, E.out], [20, 0.35], [34, 0.1]]), 0.3);

  // R4: the foundry gets messy
  const r4 = tw(g, c.foundry - 6, 12);
  const camX = tw(g, c.cameras + 2, 8, E.back);
  const chipX = tw(g, c.electronics, 8, E.back);
  const loop = tw(g, c.policies, 12, E.back);

  const camSplit: Cam = {cx: 860, cy: 600, zoom: 1.35};

  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      {r1 > 0 && (
        <AbsoluteFill style={{opacity: r1}}>
          {/* left: simulator */}
          <AbsoluteFill style={{clipPath: 'inset(0 50% 0 0)'}}>
            <Camera cam={{cx: (EDGE_X - 300) + 480 / 1.35, cy: 450, zoom: 1.35}}>
              <Layer depth={1}><SimBackdrop horizon={WALK_Y} /></Layer>
              <Layer depth={1}>
                <Svg>
                  <rect x={-900} y={WALK_Y - 10} width={EDGE_X + 900} height={600} fill={SIMC.deck} stroke={SIMC.deckDark} strokeWidth={4} />
                  <RobotSide pose={standPose(EDGE_X - 300, WALK_Y, 0.74, g, 0.3)} scale={0.74} finish="SIM" />
                </Svg>
              </Layer>
            </Camera>
          </AbsoluteFill>
          {/* right: real world */}
          <AbsoluteFill style={{clipPath: 'inset(0 0 0 50%)'}}>
            <Camera cam={{cx: (EDGE_X - 300) - 480 / 1.35, cy: 450, zoom: 1.35}}>
              <Layer depth={0.45}><FoundryBack frame={g} id="s5a" glow={0.6} /></Layer>
              <Layer depth={1}>
                <Walkway />
                <Svg>
                  {flat > 0 && <path d={`M ${EDGE_X - 330} ${WALK_Y - 10} Q ${EDGE_X - 300} ${WALK_Y - 10 - 16 * flat} ${EDGE_X - 270} ${WALK_Y - 10}`} fill="#C3BBAE" stroke={C.ink} strokeWidth={3} />}
                  <RobotSide pose={wobbleKnee({...standPose(EDGE_X - 300, WALK_Y - 4 * flat, 0.74, g, 0.3)}, g, slack)} scale={0.74} />
                </Svg>
              </Layer>
            </Camera>
          </AbsoluteFill>
          <div style={{position: 'absolute', left: 957, top: 0, width: 6, height: 1080, background: C.ink}} />
          <div style={{position: 'absolute', left: 40, top: 40}}><Chip tone="blue" size={34}>SIMULATOR</Chip></div>
          <div style={{position: 'absolute', left: 1000, top: 40}}><Chip tone="ink" size={34}>REAL WORLD</Chip></div>
          {/* callouts on the real side */}
          <div style={{position: 'absolute', left: 1540, top: 150, display: 'flex', flexDirection: 'column', gap: 22}}>
            {[['joints have slack', slack], ['floors aren’t flat', flat], ['sensors are noisy', noisy]].map(([t, a], i) => (
              <div key={i} style={{opacity: a as number, transform: `translateX(${(1 - (a as number)) * 30}px)`}}><Chip tone="coral" size={32}>{t as string}</Chip></div>
            ))}
          </div>
          {noisy > 0 && (
            <svg width={360} height={140} style={{position: 'absolute', left: 1540, top: 420, opacity: noisy}}>
              <rect x={2} y={2} width={356} height={136} rx={14} fill={C.white} stroke={C.ink} strokeWidth={4} />
              <polyline points={Array.from({length: 44}).map((_, i) => `${16 + i * 7.6},${70 + Math.sin(i / 4 + g / 6) * 18 + (rand(i * 31 + Math.floor(g / 2)) - 0.5) * 34}`).join(' ')} fill="none" stroke={C.coral} strokeWidth={4} strokeLinejoin="round" />
              <text x={16} y={128} fontFamily={F.mono} fontSize={20} fill={C.inkSoft}>balance sensor (illustrative)</text>
            </svg>
          )}
          {pin > 0 && (
            <Card x={1000} y={640} w={860} h={210} bg={C.cream} rot={-1} opacity={pin} scale={0.9 + 0.1 * pin} pad={28}>
              <Chip tone="ink" size={24}>FIGURE SAYS</Chip>
              <Headline size={48} style={{marginTop: 12}}>It had to work at a foundry the team had never visited</Headline>
            </Card>
          )}
          <IllusTag text="ILLUSTRATION · simplified" />
        </AbsoluteFill>
      )}

      {r2 > 0 && (
        <AbsoluteFill style={{opacity: r2, background: tint}}>
          <Svg>
            <rect x={-10} y={-10} width={1940} height={1100} fill={tint} />
            {Array.from({length: 17}).map((_, i) => <line key={i} x1={i * 120} y1={0} x2={i * 120} y2={1080} stroke={SIMC.grid} strokeWidth={3} />)}
            {Array.from({length: 10}).map((_, i) => <line key={i} x1={0} y1={i * 120} x2={1920} y2={i * 120} stroke={SIMC.grid} strokeWidth={3} />)}
            <Lane x={760} y={250} w={1080} h={620} g={g} seed={41} skill={0.85} showMark={false} />
          </Svg>
          <Card x={60} y={200} w={640} h={640} pad={36}>
            <Headline size={50}>Messy on purpose</Headline>
            <div style={{fontSize: 28, fontWeight: 800, color: C.inkSoft, marginTop: 8}}>new random settings every round</div>
            <Slider label="weight" value={rv(1)} x={36} y={200} w={560} />
            <Slider label="friction" value={rv(2)} x={36} y={320} w={560} />
            <Slider label="timing" value={rv(3)} x={36} y={440} w={560} />
            <div style={{position: 'absolute', left: 36, bottom: 30, fontFamily: F.mono, fontSize: 30}}>round {Math.max(1, round + 1)}</div>
          </Card>
          {qStamp > 0 && (
            <div style={{position: 'absolute', left: 120, top: 420, transform: `rotate(-10deg) scale(${1.5 - 0.5 * qStamp})`, opacity: qStamp, background: 'rgba(255,255,255,0.92)', border: `7px solid ${C.coral}`, color: C.coralDeep, borderRadius: 16, padding: '10px 26px', fontFamily: F.display, fontWeight: 700, fontSize: 54, lineHeight: 1.05}}>
              Figure’s actual<br />settings: not public
            </div>
          )}
          <div style={{position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', justifyContent: 'center'}}>
            <Chip tone="blue" size={32}>CONCEPTUAL EXAMPLE · a common technique, not Figure’s recipe</Chip>
          </div>
        </AbsoluteFill>
      )}

      {r3 > 0 && (
        <AbsoluteFill style={{opacity: r3, background: '#EAF1F6'}}>
          <Svg>
            <rect x={-10} y={-10} width={1940} height={1100} fill="#E6EEF5" />
            <circle cx={1650} cy={170} r={80} fill={C.saffronLight} />
            {/* two-storey building */}
            <rect x={120} y={140} width={600} height={790} fill="#E8DCC6" stroke={C.ink} strokeWidth={5} />
            <rect x={120} y={455} width={600} height={18} fill="#CDBFA5" stroke={C.ink} strokeWidth={4} />
            {[0, 1, 2].map((i) => <rect key={i} x={170 + i * 180} y={590} width={110} height={150} rx={6} fill="#F8F4EA" stroke={C.ink} strokeWidth={4} />)}
            {[0, 1].map((i) => <rect key={i} x={170 + i * 180} y={220} width={110} height={150} rx={6} fill="#F8F4EA" stroke={C.ink} strokeWidth={4} />)}
            {/* open second-floor bay the robot jumps from */}
            <rect x={530} y={150} width={190} height={320} fill="#4B5B66" stroke={C.ink} strokeWidth={5} />
            <rect x={520} y={462} width={230} height={16} fill="#B9B2A6" stroke={C.ink} strokeWidth={4} />
            <rect x={0} y={930} width={1920} height={160} fill="#CFD8C4" />
            <Airbag x={1130} y={935} s={1.0} squash={squash} />
            <RobotSide pose={robotAir} scale={0.78} />
          </Svg>
          <div style={{position: 'absolute', left: 900, top: 120}}>
            <Card x={0} y={0} w={880} h={210} pad={28} opacity={tw(g, c.airbag, 14, E.back)}>
              <Chip tone="ink" size={24}>FIGURE SAYS</Chip>
              <Headline size={48} style={{marginTop: 12}}>Rehearsal: second-floor jumps onto giant airbags</Headline>
            </Card>
          </div>
          <IllusTag text="ILLUSTRATION · not Figure’s campus" />
        </AbsoluteFill>
      )}

      {r4 > 0 && (
        <AbsoluteFill style={{opacity: r4, background: '#EFE6D3'}}>
          <Camera cam={{cx: 1200, cy: 560, zoom: 1.3}}>
            <Layer depth={0.45}><FoundryBack frame={g} id="s5b" glow={1.3} /></Layer>
            <Layer depth={1}>
              <Walkway />
              <LadleBack frame={g} id="s5bl" />
              <Svg><RobotSide pose={standPose(EDGE_X - 52, WALK_Y, 0.74, g, 1)} scale={0.74} /></Svg>
              <LadleFront id="s5bf" />
              <Heat frame={g} opacity={1.4} />
              <Heat frame={g + 40} x={1100} w={600} y={520} opacity={1} />
            </Layer>
          </Camera>
          {/* electromagnetic noise squiggles (illustrative) */}
          <Svg opacity={0.55 * tw(g, c.heat, 12)}>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M ${1080 + i * 50} 200 ${Array.from({length: 10}).map((_, k) => `L ${1080 + i * 50 + (k % 2 ? 22 : -22)} ${230 + k * 30}`).join(' ')}`} fill="none" stroke={C.blue} strokeWidth={5} opacity={0.5 + 0.5 * Math.sin(g / 3 + i)} />
            ))}
          </Svg>
          <Svg>
            <g opacity={tw(g, c.cameras - 2, 10)}>
              <circle cx={300} cy={300} r={110} fill={C.white} stroke={C.ink} strokeWidth={5} />
              <CameraIcon x={300} y={296} s={1} broken={camX} />
            </g>
            <g opacity={tw(g, c.electronics - 2, 10)}>
              <circle cx={560} cy={300} r={110} fill={C.white} stroke={C.ink} strokeWidth={5} />
              <ChipIcon x={560} y={300} s={1} />
            </g>
          </Svg>
          <Mark ok={false} x={340} y={200} size={84} opacity={camX} scale={camX} />
          <Mark ok={false} x={600} y={200} size={84} opacity={chipX} scale={chipX} />
          {loop > 0 && (
            <Card x={120} y={520} w={700} h={250} bg={C.saffronLight} opacity={loop} scale={0.9 + 0.1 * loop} pad={30}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <svg width={90} height={90} style={{overflow: 'visible'}}>
                  <circle cx={45} cy={45} r={36} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="10 8" />
                  {(() => { const p = alongLoop([[45, 9], [81, 45], [45, 81], [9, 45]], g / 12); return <circle cx={p.x} cy={p.y} r={10} fill={C.saffronDeep} stroke={C.ink} strokeWidth={3} />; })()}
                </svg>
                <Headline size={52}>The policy kept running</Headline>
              </div>
              <div style={{fontSize: 30, fontWeight: 800, marginTop: 16, color: C.inkSoft}}>Figure’s account of the shoot</div>
            </Card>
          )}
          <IllusTag text="ILLUSTRATION · not footage of the event" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
