import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at, atEnd} from '../lib/narration';
import {E, tw, kf, drop, hop, ring} from '../lib/motion';
import {RobotSide, RobotFront} from '../components/Robot';
import {armIK, joints, RIG, RobotPose, STAND_HEIGHT} from '../lib/robot';
import {standPose} from '../lib/moves';
import {Svg, IllusTag, Card, Chip, Headline, Mark} from '../components/UI';
import {Padlock, Wrench, Bolt, Calendar, MiniLadle, Clapper, HangTag, Building, RecycleMark} from '../components/Props';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {P} from '../lib/poses';
import type {Sfx} from '../lib/sfx';

export const whyCues = () => ({
  start: at('Start with the why'),
  these: at('These are'),
  bmw: at('Figure says they spent'),
  newer: at('But as its newer'),
  sense: at('stopped making sense'),
  board: at('So what do you do'),
  sell: at('Sell it?'),
  custom: at("Figure says they're packed"),
  actuators: at('actuators'),
  building: at("It didn't want"),
  sellX: atEnd('building.') + 2,
  apart: at('Take it apart?'),
  every: at('every robot'),
  delay: at('delay the next'),
  apartX: atEnd('next model.') + 2,
  melt: at('Melt it?'),
  simple: at('Simple.'),
  battery: at('Except a robot'),
  refused: at('Figure says foundries'),
  mexico: at('Mexico'),
  imatra: at('One in Imatra'),
  recycle: at('Plenty of companies'),
  crew: at('came with a film'),
  clap: at('crew.'),
  end: at('And the film?'),
});

export const SFX = (): Sfx[] => {
  const c = whyCues();
  return [
    {f: c.these + 8, kind: 'robot_step', gain: -4},
    {f: c.bmw + 14, kind: 'servo_whir', gain: -8},
    {f: c.bmw + 44, kind: 'card_flick', gain: -10, note: 'part set on shelf'},
    {f: c.bmw + 104, kind: 'card_flick', gain: -10},
    {f: c.sense + 6, kind: 'tag_clink', gain: -2},
    {f: c.sell + 2, kind: 'card_flick', gain: -6},
    {f: c.building + 10, kind: 'pop_tick', gain: -6},
    {f: c.sellX, kind: 'marker_x', gain: -4},
    {f: c.apart + 2, kind: 'card_flick', gain: -6},
    {f: c.delay + 6, kind: 'paper_slide', gain: -10},
    {f: c.apartX, kind: 'marker_x', gain: -4},
    {f: c.melt + 2, kind: 'card_flick', gain: -6},
    {f: c.simple + 4, kind: 'ding_yes', gain: -8},
    {f: c.refused + 12, kind: 'buzz_no', gain: -8},
    {f: c.mexico + 8, kind: 'buzz_no', gain: -8},
    {f: c.imatra + 26, kind: 'map_pin', gain: -4},
    {f: c.recycle + 4, kind: 'paper_slide', gain: -10},
    {f: c.clap, kind: 'clapper', gain: 0},
  ];
};

/** Side-view loading cycle: lift a part from a cart, set it on a shelf. Returns pose + part position. */
const loading = (g: number, t0: number) => {
  const x = 820, ground = 960, s = 1.0;
  const base = standPose(x, ground, s, g, 0.4);
  const period = 60;
  const t = ((g - t0) % period + period) % period;
  const k = Math.floor((g - t0) / period);
  const pick = {x: 1000, y: 724};
  const place = {x: 1040, y: 560};
  const rest = {x: 930, y: 760};
  const tgt = t < 14 ? lerpV(rest, pick, E.inOut(t / 14)) : t < 20 ? pick : t < 42 ? lerpV(pick, place, E.inOut((t - 20) / 22)) : t < 46 ? place : lerpV(place, rest, E.inOut((t - 46) / 14));
  const hold = t >= 18 && t < 44;
  const crouch = t < 20 ? Math.sin((t / 20) * Math.PI) * 0.0 : 0;
  const j0 = joints({...base, x: 0, y: 0});
  const local = {x: (tgt.x - base.x) / s, y: (tgt.y - base.y) / s};
  const aN = armIK(j0.shoulder, local, base.rot);
  const aF = armIK(j0.shoulder, {x: local.x - 8, y: local.y + 4}, base.rot);
  const pose: RobotPose = {...base, lean: base.lean + 8, neck: 10, shN: aN.sh, elN: aN.el, shF: aF.sh, elF: aF.el, hand: hold ? 1 : 0};
  return {pose, part: hold ? tgt : null, placed: Math.max(0, k) + (t >= 44 ? 1 : 0), crouch};
};
const lerpV = (a: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

export const S2Why: React.FC = () => {
  const g = useG();
  const c = whyCues();

  // D1: identity card
  const showD1 = g < c.bmw + 8;
  const idIn = tw(g, c.start + 2, 16, E.back);
  const titleIn = tw(g, c.these + 6, 14, E.out);
  const genIn = tw(g, at("Figure's second-generation") - 2, 14, E.out);
  const d1Out = tw(g, c.bmw - 6, 12, E.in);

  // D2: loading at a car plant
  const showD2 = g >= c.bmw - 8 && g < c.newer + 10;
  const d2 = tw(g, c.bmw - 8, 14) * (1 - tw(g, c.newer - 4, 12));
  const ld = loading(g, c.bmw + 6);

  // D3: newer fleet, RETIRED tag
  const showD3 = g >= c.newer - 6 && g < c.board + 12;
  const d3 = tw(g, c.newer - 6, 14) * (1 - tw(g, c.board - 2, 12));
  const fleet = [0, 1, 2, 3].map((i) => tw(g, c.newer + 10 + i * 14, 26, E.out));
  const tagDrop = tw(g, c.sense, 10, E.in);
  const tagSwing = g < c.sense + 10 ? 0 : ring(g, c.sense + 10, 0.35, 0.08) * 14;

  // E: options board
  const showE = g >= c.board - 8;
  const eIn = tw(g, c.board - 8, 16);
  const cardIn = (t0: number) => tw(g, t0 - 2, 14, E.back);
  const xs = (t0: number) => tw(g, t0, 8, E.out);
  const checkerPose = g < c.sell ? P({armR: {a: 30, b: 20}, lookX: 0.6, brows: 0.3}) :
    g < c.apart ? P({armR: {a: 96, b: -14}, lookX: 0.9, brows: 0.2}) :
    g < c.melt ? P({armR: {a: 104, b: -24}, lookX: 0.9, brows: 0.5}) :
    g < c.recycle ? P({armR: {a: 110, b: -30}, lookX: 0.9, brows: 0.6}) :
    g < c.clap ? P({armR: {a: 40, b: 60}, lookX: 0.5, brows: 0.2, mouth: 'hmm'}) : P({armR: {a: 30, b: 70}, armL: {a: 20, b: 30}, lookX: 0.8, brows: 1, browAsym: 0.8, mouth: 'smirk'});
  const COLX = [690, 1090, 1490];
  const CW = 370;

  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      {showD1 && (
        <AbsoluteFill style={{opacity: 1 - d1Out}}>
          <Svg>
            <circle cx={560} cy={640} r={380} fill={C.paperDeep} />
            <ellipse cx={560} cy={1004} rx={260} ry={26} fill={C.shadow} />
            <g transform={`translate(0 ${(1 - idIn) * 60})`} opacity={idIn}>
              <RobotFront pose={{x: 560, y: 1000}} scale={1.2} />
            </g>
          </Svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center', opacity: tw(g, c.start, 10) * (1 - tw(g, c.these, 10))}}>
            <Chip tone="ink" size={34}>PART 1 · WHY RETIRE THEM THIS WAY?</Chip>
          </div>
          <div style={{position: 'absolute', left: 1020, top: 300, opacity: titleIn, transform: `translateX(${(1 - titleIn) * 40}px)`}}>
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 200, lineHeight: 1, color: C.ink}}>F.02</div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 54, marginTop: 20, color: C.inkSoft, opacity: genIn}}>Figure’s second-generation<br />humanoid robot</div>
          </div>
          <IllusTag text="ILLUSTRATION · our drawing of the F.02" />
        </AbsoluteFill>
      )}

      {showD2 && (
        <AbsoluteFill style={{opacity: d2}}>
          <Svg>
            <rect x={0} y={0} width={1920} height={1080} fill="#EEE7D7" />
            {/* factory wall stripes and a big window */}
            <rect x={80} y={90} width={560} height={300} rx={10} fill="#F8F4EA" stroke="#CDBFA5" strokeWidth={4} />
            <line x1={360} y1={90} x2={360} y2={390} stroke="#CDBFA5" strokeWidth={4} />
            <rect x={0} y={960} width={1920} height={120} fill="#D9CFBD" />
            <rect x={0} y={950} width={1920} height={12} fill={C.saffron} />
            {/* shelf for placed parts */}
            <rect x={1000} y={570} width={300} height={16} fill="#8A929B" stroke={C.ink} strokeWidth={4} />
            <rect x={1270} y={570} width={16} height={390} fill="#8A929B" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: Math.min(6, ld.placed)}).map((_, i) => (
              <rect key={i} x={1010 + i * 4} y={548 - i * 14} width={220} height={20} rx={6} fill="#B8C0C8" stroke={C.ink} strokeWidth={4} />
            ))}
            {/* cart with parts */}
            <rect x={960} y={736} width={300} height={22} fill="#6F7B86" stroke={C.ink} strokeWidth={4} />
            <rect x={970} y={758} width={14} height={180} fill="#6F7B86" stroke={C.ink} strokeWidth={3} />
            <rect x={1236} y={758} width={14} height={180} fill="#6F7B86" stroke={C.ink} strokeWidth={3} />
            {[985, 1235].map((wx) => <circle key={wx} cx={wx} cy={944} r={16} fill={C.ink} />)}
            {Array.from({length: Math.max(0, 6 - ld.placed - (ld.part ? 1 : 0))}).map((_, i) => (
              <rect key={i} x={980 + (i % 2) * 4} y={714 - i * 14} width={220} height={20} rx={6} fill="#B8C0C8" stroke={C.ink} strokeWidth={4} />
            ))}
            <RobotSide pose={ld.pose} scale={1} groundY={962} />
            {ld.part && <rect x={ld.part.x - 40} y={ld.part.y - 16} width={220} height={20} rx={6} fill="#B8C0C8" stroke={C.ink} strokeWidth={4} />}
          </Svg>
          <div style={{position: 'absolute', left: 90, top: 470, width: 640}}>
            <Card x={0} y={0} w={640} h={260} pad={30} opacity={tw(g, c.bmw + 4, 14, E.back)}>
              <Chip tone="ink" size={24}>FIGURE SAYS</Chip>
              <Headline size={50} style={{marginTop: 14}}>Months of loading parts at a BMW plant</Headline>
            </Card>
          </div>
          <IllusTag text="ILLUSTRATION · not the real factory" />
        </AbsoluteFill>
      )}

      {showD3 && (
        <AbsoluteFill style={{opacity: d3}}>
          <Svg>
            <rect x={0} y={1000} width={1920} height={80} fill={C.paperDeep} />
            <RobotFront pose={{x: 380, y: 1000}} scale={1.0} />
            <HangTag x={380} y={1000 - (STAND_HEIGHT + RIG.shoulderUp - 10)} s={1.1} text="RETIRED" opacity={tagDrop} swing={tagSwing + (1 - tagDrop) * 0} />
            {fleet.map((k, i) => {
              const x = 900 + i * 260 + (1 - k) * 1100;
              const b = k < 1 ? Math.abs(Math.sin(k * Math.PI * 5)) * -10 : 0;
              return k > 0 ? <RobotFront key={i} pose={{x, y: 1000 + b, legL: k < 1 ? 6 * Math.sin(k * 30) : 2, legR: k < 1 ? -6 * Math.sin(k * 30) : 2}} finish="F03" scale={1.0} /> : null;
            })}
          </Svg>
          <div style={{position: 'absolute', left: 1040, top: 110, opacity: tw(g, c.newer + 10, 14)}}>
            <Chip tone="paper" size={34}>F.03 · the newer model (silhouette)</Chip>
          </div>
          <div style={{position: 'absolute', left: 150, top: 110, opacity: tw(g, c.newer, 14)}}>
            <Chip tone="ink" size={34}>F.02</Chip>
          </div>
        </AbsoluteFill>
      )}

      {showE && (
        <AbsoluteFill style={{opacity: eIn}}>
          {/* board */}
          <div style={{position: 'absolute', left: 630, top: 60, width: 1250, height: 900, background: C.white, border: `6px solid ${C.ink}`, borderRadius: 18, boxShadow: `12px 14px 0 ${C.shadow}`}} />
          <div style={{position: 'absolute', left: 630, top: 950, width: 1250, height: 24, background: C.wood, border: `5px solid ${C.ink}`, borderRadius: 8}} />
          <div style={{position: 'absolute', left: 680, top: 92, opacity: tw(g, c.board, 12)}}>
            <Headline size={58}>What do you do with a retired robot?</Headline>
          </div>
          {/* empty slots until each option is named */}
          {[c.sell, c.apart, c.melt].map((t0, i) => (
            <div key={`slot${i}`} style={{position: 'absolute', left: COLX[i], top: 200, width: CW, height: 720, border: `5px dashed ${C.inkMuted}`, borderRadius: 20, opacity: tw(g, c.board + 6 + i * 4, 10) * (1 - tw(g, t0 - 2, 6)), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 120, color: C.paperLine}}>?</div>
          ))}
          {/* option cards */}
          {[
            {t0: c.sell, title: 'SELL IT?', x: COLX[0], xAt: c.sellX},
            {t0: c.apart, title: 'TAKE IT APART?', x: COLX[1], xAt: c.apartX},
            {t0: c.melt, title: 'MELT IT?', x: COLX[2], xAt: -1},
          ].map((o, i) => {
            const a = cardIn(o.t0);
            if (a <= 0) return null;
            const x = xs(o.xAt);
            return (
              <div key={i} style={{position: 'absolute', left: o.x, top: 200, width: CW, height: 720, opacity: a, transform: `translateY(${(1 - a) * 30}px) rotate(${[-1, 0.8, -0.6][i]}deg)`}}>
                <div style={{position: 'absolute', inset: 0, background: [C.cream, C.blueLight, '#FFE7CC'][i], border: `4px solid ${C.ink}`, borderRadius: 20}} />
                <div style={{position: 'absolute', left: 24, top: 18, right: 24, fontFamily: F.display, fontWeight: 700, fontSize: i === 1 ? 48 : 56, lineHeight: 1.0, color: C.ink}}>{o.title}</div>
                {o.xAt > 0 && x > 0 && (
                  <svg width={CW} height={720} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                    <path d={`M 40 40 L ${40 + (CW - 80) * Math.min(1, x * 2)} ${40 + 600 * Math.min(1, x * 2)}`} stroke={C.coral} strokeWidth={16} strokeLinecap="round" opacity={0.9} />
                    {x > 0.5 && <path d={`M ${CW - 40} 40 L ${CW - 40 - (CW - 80) * Math.min(1, (x - 0.5) * 2)} ${40 + 600 * Math.min(1, (x - 0.5) * 2)}`} stroke={C.coral} strokeWidth={16} strokeLinecap="round" opacity={0.9} />}
                  </svg>
                )}
              </div>
            );
          })}
          {/* card contents (icons and short lines), drawn in board space */}
          <Svg>
            {/* SELL */}
            {g > c.custom - 4 && (
              <g opacity={tw(g, c.custom - 4, 12)}>
                <RobotFront pose={{x: COLX[0] + 185, y: 560}} scale={0.62} glowKnee={tw(g, c.actuators, 10) * (0.7 + 0.3 * Math.sin(g / 4))} />
              </g>
            )}
            {g > c.building - 4 && (
              <g opacity={tw(g, c.building - 4, 12)}>
                <Building x={COLX[0] + 120} y={790} s={0.6} />
                <Padlock x={COLX[0] + 280} y={770} s={0.62 * tw(g, c.building + 10, 10, E.back)} />
              </g>
            )}
            {/* TAKE APART */}
            {g > c.apart + 6 && (
              <g opacity={tw(g, c.apart + 6, 12)}>
                <Wrench x={COLX[1] + 120} y={410} s={1.0} />
                {[0, 1, 2, 3].map((i) => <Bolt key={i} x={COLX[1] + 220 + (i % 2) * 60} y={380 + Math.floor(i / 2) * 70 + hop(g, c.every + i * 3, 10, 10)} s={0.9} rot={i * 25} />)}
              </g>
            )}
            {g > c.every - 2 && <text x={COLX[1] + 185} y={580} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={48} fill={C.ink} opacity={tw(g, c.every - 2, 10)}>× every robot</text>}
            {g > c.delay - 8 && <Calendar x={COLX[1] + 185} y={730} s={0.78} slide={tw(g, c.delay, 24, E.inOut)} label="next model" opacity={tw(g, c.delay - 8, 10)} />}
            {/* MELT */}
            {g > c.melt + 4 && <MiniLadle x={COLX[2] + 110} y={420} s={0.9} opacity={tw(g, c.melt + 4, 12)} />}
            {g > c.battery - 4 && (
              <g opacity={tw(g, c.battery - 4, 12)}>
                <RobotFront pose={{x: COLX[2] + 280, y: 560}} scale={0.5} battery={tw(g, at('battery.'), 10) * (0.75 + 0.25 * Math.sin(g / 4))} />
              </g>
            )}
          </Svg>
          {/* card captions: the reason, in words, at the moment it is said */}
          {[
            [COLX[0], 590, c.custom + 6, 'Packed with custom parts'],
            [COLX[0], 860, c.building + 6, 'Not leaving the building'],
            [COLX[1], 860, c.delay + 6, 'Would delay the next model'],
            [COLX[2], 580, c.battery + 20, 'Jumping in means the battery goes too'],
          ].map(([x, y, t0, text], i) => (
            <div key={i} style={{position: 'absolute', left: (x as number) + 20, top: y as number, width: CW - 40, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 32, lineHeight: 1.15, color: C.ink, opacity: tw(g, t0 as number, 10) * (g < (t0 as number) ? 0 : 1)}}>{text as string}</div>
          ))}
          {g > c.actuators - 2 && g < c.apart && (
            <div style={{position: 'absolute', left: COLX[0] + 250, top: 470, opacity: tw(g, c.actuators, 8)}}><Chip tone="saffron" size={24}>actuators</Chip></div>
          )}
          {/* MELT: who said yes */}
          {g > c.simple - 2 && g < c.battery + 4 && <Mark ok x={COLX[2] + 250} y={290} size={84} opacity={tw(g, c.simple, 8) * (1 - tw(g, c.battery - 4, 8))} />}
          {g > c.refused && (
            <div style={{position: 'absolute', left: COLX[2] + 24, top: 680, width: CW - 48, fontFamily: F.body, fontWeight: 800, fontSize: 32, lineHeight: 1.5}}>
              {[['U.S. foundries', false, c.refused + 10], ['Mexico', false, c.mexico + 4], ['Imatra, Finland', true, c.imatra + 22]].map(([label, ok, t0], i) => {
                const a = tw(g, t0 as number, 10, E.back);
                return (
                  <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: a, height: 70}}>
                    <span>{label as string}</span>
                    <span style={{position: 'relative', width: 60, height: 60}}><Mark ok={ok as boolean} x={0} y={0} size={58} /></span>
                  </div>
                );
              })}
            </div>
          )}
          {/* recycling footnote */}
          {g > c.recycle - 2 && (
            <Card x={30} y={150} w={570} h={170} bg={C.tealLight} rot={-2} opacity={tw(g, c.recycle - 2, 12, E.back)} pad={22}>
              <svg width={90} height={90} style={{position: 'absolute', left: 20, top: 28, overflow: 'visible'}}><RecycleMark x={45} y={45} s={1} /></svg>
              <div style={{marginLeft: 110, fontSize: 34, fontWeight: 800, lineHeight: 1.15}}>Usual route for old hardware: recycling</div>
            </Card>
          )}
          {/* the film crew */}
          {g > c.crew - 10 && (
            <Svg>
              <Clapper x={COLX[2] + 190} y={kf(g, [[c.crew - 10, 120], [c.crew + 4, 330, E.out]])} s={1.15} rot={kf(g, [[c.crew - 10, -20], [c.crew + 4, -6, E.out]])} clap={tw(g, c.clap - 3, 3, E.in)} text="FILM CREW" />
            </Svg>
          )}
          <Character look={CAST.checker} pose={checkerPose} frame={g} x={330} y={1000} scale={1.15} seed={3} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
