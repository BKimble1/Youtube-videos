import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at, atEnd} from '../lib/narration';
import {E, tw, kf, strike} from '../lib/motion';
import {Svg, Card, Chip, Headline} from '../components/UI';
import {Clapper, MiniLadle, Padlock} from '../components/Props';
import {RobotFront} from '../components/Robot';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {P} from '../lib/poses';
import type {Sfx} from '../lib/sfx';

export const filmCues = () => ({
  start: at('And the film?'),
  blame: at('Blame a reply'),
  august: at('In August,'),
  asked: at('asked what to do'),
  arnold: at('Arnold Schwarzenegger replied'),
  melt: at('"You should melt'),
  t2: at('In Terminator'),
  copy: at('copy its technology'),
  almost: at('which is almost'),
  hollywood: at('Hollywood wrote'),
  year: at('1991.'),
  hint: at('Figure took the hint'),
  appears: at('appears in the finished'),
  end: at('Now the hard'),
});

export const SFX = (): Sfx[] => {
  const c = filmCues();
  return [
    {f: c.blame + 4, kind: 'card_flick', gain: -6},
    {f: c.arnold + 4, kind: 'card_flick', gain: -6},
    {f: c.t2 + 2, kind: 'card_flick', gain: -6},
    {f: c.almost + 10, kind: 'pop_tick', gain: -4},
    {f: c.hollywood + 6, kind: 'paper_slide', gain: -8},
    {f: c.year + 6, kind: 'stamp', gain: 0},
    {f: c.hint + 2, kind: 'paper_swish', gain: -8},
  ];
};

export const S3Film: React.FC = () => {
  const g = useG();
  const c = filmCues();

  // F1: the exchange on X (typographic; not a mock-up of the X interface)
  const f1 = tw(g, c.start, 10) * (1 - tw(g, c.t2 - 6, 12));
  const clap = tw(g, c.start, 6);
  const cardA = tw(g, c.blame, 14, E.back);
  const askIn = tw(g, c.august, 12);
  const cardB = tw(g, c.arnold, 14, E.back);
  const quote = tw(g, c.melt - 2, 10, E.out);
  const checker = g < c.melt + 4 ? P({lookX: 0.7, lookY: -0.4, brows: 0.2, armR: {a: 12, b: 30}}) : P({lookX: 0.7, lookY: -0.5, brows: 1, mouth: 'o', armR: {a: 20, b: 120}, armL: {a: 12, b: 20}});

  // F2: the parallel
  const f2 = tw(g, c.t2 - 6, 12) * (1 - tw(g, c.hint - 6, 12));
  const left = tw(g, c.t2, 14, E.back);
  const right = tw(g, c.almost - 4, 14, E.back);
  const approx = tw(g, c.almost + 10, 10, E.back);
  const folder = tw(g, c.hollywood, 14, E.back);
  const stampK = strike(g, c.year + 6, 6, 3, 3, 9);
  const stampOn = g >= c.year + 6;

  // F3: the film itself
  const f3 = tw(g, c.hint - 6, 12) * (1 - tw(g, c.end - 8, 8));

  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      {f1 > 0 && (
        <AbsoluteFill style={{opacity: f1}}>
          <Svg>
            <Clapper x={1680} y={kf(g, [[c.start - 4, 1250], [c.start + 10, 960, E.out]])} s={0.85} rot={8} clap={1} text="F.02" opacity={clap * (1 - tw(g, c.arnold - 6, 10))} />
          </Svg>
          <Card x={kf(g, [[c.arnold - 8, 410], [c.arnold + 6, 150, E.inOut]])} y={kf(g, [[c.arnold - 8, 330], [c.arnold + 6, 110, E.inOut]])} w={1100} h={300} opacity={cardA} scale={0.92 + 0.08 * cardA} rot={-1} pad={34}>
            <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
              <Chip tone="saffron" size={28}>Aug 19, 2026</Chip>
              <Chip tone="paper" size={26}>a post on X · paraphrased</Chip>
            </div>
            <div style={{marginTop: 22, fontSize: 48, fontWeight: 800, lineHeight: 1.2, opacity: 0.25 + 0.75 * askIn}}>
              Figure CEO Brett Adcock asks what to do with the retired F.02s.
            </div>
          </Card>
          <Card x={420} y={470} w={1360} h={360} bg={C.white} opacity={cardB} scale={0.92 + 0.08 * cardB} rot={1} pad={40}>
            <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
              <Chip tone="ink" size={28}>Arnold Schwarzenegger replies</Chip>
              <Chip tone="paper" size={26}>quoted</Chip>
            </div>
            <div style={{marginTop: 34, fontFamily: F.serif, fontSize: 104, lineHeight: 1.05, whiteSpace: 'nowrap', opacity: quote, transform: `scale(${0.9 + 0.1 * quote})`, transformOrigin: '0 50%'}}>
              “You should melt them.”
            </div>
          </Card>
          <Character look={CAST.checker} pose={checker} frame={g} x={260} y={1080} scale={1.05} seed={3} />
        </AbsoluteFill>
      )}

      {f2 > 0 && (
        <AbsoluteFill style={{opacity: f2}}>
          <Card x={kf(g, [[c.almost - 8, 570], [c.almost + 6, 110, E.inOut]])} y={110} w={780} h={520} bg={C.cream} opacity={left} scale={0.9 + 0.1 * left} rot={-1.5} pad={36}>
            <Chip tone="ink" size={28}>THE MOVIE · 1991</Chip>
            <Headline size={62} style={{marginTop: 18}}>Terminator 2</Headline>
            <div style={{marginTop: 20, fontSize: 40, fontWeight: 700, lineHeight: 1.25}}>Its robot ends up lowered into molten steel, so nobody can copy its technology.</div>
          </Card>
          <Card x={1030} y={110} w={780} h={520} bg="#FFE7CC" opacity={right} scale={0.9 + 0.1 * right} rot={1.5} pad={36}>
            <Chip tone="ink" size={28}>REAL LIFE · 2026</Chip>
            <Headline size={62} style={{marginTop: 18}}>Figure</Headline>
            <div style={{marginTop: 20, fontSize: 40, fontWeight: 700, lineHeight: 1.25}}>Retired robots go into molten steel, to protect its proprietary hardware.</div>
          </Card>
          {approx > 0 && (
            <div style={{position: 'absolute', left: 900, top: 300, width: 120, height: 120, borderRadius: 60, background: C.saffron, border: `5px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 84, color: C.ink, transform: `scale(${approx})`}}>≈</div>
          )}
          {folder > 0 && (
            <div style={{position: 'absolute', left: 580, top: 690 + (1 - folder) * 200, width: 760, height: 300, opacity: folder}}>
              <div style={{position: 'absolute', left: 0, top: 30, width: 760, height: 270, background: '#E8C98E', border: `5px solid ${C.ink}`, borderRadius: 14}} />
              <div style={{position: 'absolute', left: 20, top: 0, width: 220, height: 50, background: '#E8C98E', border: `5px solid ${C.ink}`, borderBottom: 'none', borderRadius: '14px 14px 0 0'}} />
              <div style={{position: 'absolute', left: 40, top: 80, fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.ink}}>BUSINESS CASE</div>
              <div style={{position: 'absolute', left: 40, top: 160, fontSize: 32, fontWeight: 800, color: C.inkSoft}}>“Melt it, so nobody copies it.”</div>
              {stampOn && (
                <div style={{position: 'absolute', left: 545, top: 112, transform: `rotate(-12deg) scale(${1.25 - 0.25 * Math.max(0, stampK)})`, border: `7px solid ${C.coral}`, color: C.coral, borderRadius: 14, padding: '4px 22px', fontFamily: F.display, fontWeight: 700, fontSize: 76, background: 'rgba(255,255,255,0.6)'}}>1991</div>
              )}
            </div>
          )}
        </AbsoluteFill>
      )}

      {f3 > 0 && (
        <AbsoluteFill style={{opacity: f3}}>
          <Svg>
            <rect x={-10} y={-10} width={1940} height={1100} fill="#2E3F48" />
            {/* film strip frame */}
            <rect x={260} y={170} width={1400} height={700} rx={20} fill={C.ink} />
            {Array.from({length: 16}).map((_, i) => (
              <g key={i}>
                <rect x={300 + i * 84} y={190} width={44} height={30} rx={6} fill="#2E3F48" />
                <rect x={300 + i * 84} y={820} width={44} height={30} rx={6} fill="#2E3F48" />
              </g>
            ))}
            <rect x={320} y={250} width={1280} height={540} rx={12} fill="#F3E3C8" />
            <circle cx={1300} cy={560} r={230} fill="#FFD79A" opacity={0.7} />
            <MiniLadle x={1300} y={600} s={1.6} />
            <RobotFront pose={{x: 820, y: 760}} scale={0.95} view="back" shadow={false} />
          </Svg>
          <div style={{position: 'absolute', left: 340, top: 270}}>
            <Chip tone="ink" size={30}>“F.02 Decommission” · Figure · Sep 30, 2026</Chip>
          </div>
          <div style={{position: 'absolute', left: 340, top: 340, opacity: tw(g, c.appears, 12)}}>
            <Chip tone="saffron" size={32}>Schwarzenegger appears in it</Chip>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 920, display: 'flex', justifyContent: 'center'}}>
            <Chip tone="paper" size={30}>Our illustration, not a frame from the film · link to the original in the description</Chip>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
