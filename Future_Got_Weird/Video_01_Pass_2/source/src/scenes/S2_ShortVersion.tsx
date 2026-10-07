import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp} from '../lib/anim';
import {C, F, FPS} from '../theme';
import {Headline, Label, Chip} from '../components/Text';
import {Slip, StampMark, Scoreboard} from '../components/Props';
import {Wordmark} from '../components/Sets';
import {SLIPS} from './S1_Counter';

/**
 * S2 — "the short version": the title moment, then three illustrated claims, then the channel sting.
 * Flat paper field with big colour blocks (a deliberate contrast to the busy counter).
 */
export const S2ShortVersion: React.FC = () => {
  const g = useG();
  const c06 = at('s06');
  const cSure = at('s06', 'sure?');
  const cShort = at('s06', "Here's");
  const c07 = at('s07');
  const cLikely = at('s07', 'likely');
  const cChecking = at('s07', 'Checking');
  const cDifferent = at('s07', 'different');
  const cTests = at('s07', 'tests');
  const cGuessing = at('s07', 'guessing.');
  const cEnd = segEnd('s07');

  const slipIn = pop(g, FPS, c06 - 4);
  const titleIn = ramp(g, c06 + 10, 16);
  const sureT = ramp(g, cSure - 2, 10);
  const panelOut = ramp(g, cShort + 6, 14, easeInOut);
  const threeIn = ramp(g, cShort + 10, 14);
  const k1 = ramp(g, c07, 14);
  const k1b = ramp(g, cLikely, 12);
  const k2 = ramp(g, cChecking, 14);
  const k2b = ramp(g, cDifferent, 12);
  const k3 = ramp(g, cTests, 14);
  const k3b = ramp(g, cGuessing - 2, 12);
  // sting: starts a beat after the last word, holds ~2 s, hands off to S3
  const stingIn = ramp(g, cEnd + 14, 12, easeInOut);
  const stingOut = ramp(g, cEnd + 62, 10, easeInOut);
  const sting = stingIn * (1 - stingOut);
  const s = SLIPS[0];

  return (
    <AbsoluteFill style={{background: C.paper}}>
      {/* title moment */}
      <AbsoluteFill style={{opacity: 1 - panelOut}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', opacity: titleIn, transform: `translateY(${(1 - titleIn) * 24}px)`}}>
          <Label size={30} color={C.inkMuted} weight={800} align="center" style={{letterSpacing: '0.12em'}}>FUTURE GOT WEIRD · EPISODE 1</Label>
          <Headline size={112} style={{marginTop: 10}}>
            Why AI Is So <span style={{color: C.coral, opacity: 0.25 + 0.75 * sureT}}>Confidently</span> Wrong
          </Headline>
        </div>
        <div style={{position: 'absolute', left: 960 - 330, top: 470, transform: `scale(${lerp(0.7, 1, slipIn)}) rotate(-3deg)`, opacity: Math.min(1, slipIn * 1.5), transformOrigin: '50% 50%'}}>
          <Slip model={s.model} detail={s.detail} width={660} fontSize={30} stamp={{text: 'Wrong', tone: 'coral', t: 1}}>
            {s.pre}
            {s.year}
            {s.mid}
            {s.title}
          </Slip>
        </div>
      </AbsoluteFill>

      {/* the three claims */}
      <AbsoluteFill style={{opacity: threeIn * (1 - stingIn)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center'}}>
          <Chip tone="ink" size={30}>The short version</Chip>
        </div>
        <div style={{position: 'absolute', left: 90, top: 190, display: 'flex', gap: 40}}>
          {/* 1: writes what's likely */}
          <div style={{width: 560, opacity: k1, transform: `translateY(${(1 - k1) * 30}px)`}}>
            <div style={{height: 330, background: C.blueLight, border: `4px solid ${C.ink}`, borderRadius: 24, position: 'relative', overflow: 'hidden'}}>
              {/* a little apparatus: hopper, chute, slip emerging */}
              <div style={{position: 'absolute', left: 60, top: 40, width: 300, height: 120, background: C.blue, border: `4px solid ${C.ink}`, borderRadius: 16}} />
              <div style={{position: 'absolute', left: 190, top: 160, width: 40, height: 80, background: C.blueDeep, border: `4px solid ${C.ink}`}} />
              {['likely', 'likelier', 'likeliest'].map((w, i) => (
                <div key={w} style={{position: 'absolute', left: 80 + i * 92, top: 72, padding: '6px 10px', background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 8, fontFamily: F.serif, fontSize: 20, opacity: 0.4 + 0.6 * (i === 1 ? k1b : 0.5)}}>{['Kal', 'ai', '2002'][i]}</div>
              ))}
              <div style={{position: 'absolute', left: 120, top: 238, width: 200, height: 60, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 8, transform: `translateX(${k1b * 60}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontSize: 22}}>…in 2002 at CMU</div>
              <div style={{position: 'absolute', right: 24, top: 24, width: 150, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 24, color: C.blueDeep}}>WHAT'S LIKELY TO COME NEXT</div>
            </div>
            <Label size={34} color={C.ink} weight={800} align="center" style={{marginTop: 18}}>Built to write what’s <span style={{color: C.blueDeep}}>likely</span></Label>
          </div>
          {/* 2: checking is a different job */}
          <div style={{width: 560, opacity: k2, transform: `translateY(${(1 - k2) * 30}px)`}}>
            <div style={{height: 330, background: C.tealLight, border: `4px solid ${C.ink}`, borderRadius: 24, position: 'relative', overflow: 'hidden'}}>
              {/* a separate booth with a closed shutter */}
              <div style={{position: 'absolute', left: 130, top: 30, width: 300, height: 250, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 16}} />
              <div style={{position: 'absolute', left: 130, top: 30, width: 300, height: 60, background: C.teal, border: `4px solid ${C.ink}`, borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 26, color: C.white}}>EVIDENCE CHECK</div>
              <div style={{position: 'absolute', left: 160, top: 110, width: 240, height: 150 * (1 - 0.0), background: C.inkMuted, border: `4px solid ${C.ink}`, borderRadius: 8, opacity: 1}}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 10 + i * 28, height: 4, background: C.ink, opacity: 0.4}} />
                ))}
              </div>
              <div style={{position: 'absolute', left: 130, top: 292, width: 300, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 22, color: C.coralDeep, opacity: k2b}}>a different job · not on this route</div>
            </div>
            <Label size={34} color={C.ink} weight={800} align="center" style={{marginTop: 18}}>Checking if it’s <span style={{color: C.tealDeep}}>true</span> is a different job</Label>
          </div>
          {/* 3: tests reward guessing */}
          <div style={{width: 560, opacity: k3, transform: `translateY(${(1 - k3) * 30}px)`}}>
            <div style={{height: 330, background: C.saffronLight, border: `4px solid ${C.ink}`, borderRadius: 24, position: 'relative', overflow: 'hidden'}}>
              <Scoreboard value={7} label="guesser" tone="coral" scale={0.62} style={{left: 90, top: 70}} />
              <Scoreboard value={6} label="honest" tone="ink" scale={0.62} style={{left: 330, top: 70}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', opacity: k3b}}>
                <StampMark text="Guessing pays" tone="coral" t={k3b} size={30} rotate={-4} />
              </div>
            </div>
            <Label size={34} color={C.ink} weight={800} align="center" style={{marginTop: 18}}>Some tests quietly <span style={{color: C.coralDeep}}>reward guessing</span></Label>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', opacity: k3b}}>
          <Chip tone="paper" size={24}>argued in Kalai, Nachum, Vempala &amp; Zhang (2025) · simplified</Chip>
        </div>
      </AbsoluteFill>

      {/* channel sting */}
      {sting > 0 && (
        <AbsoluteFill style={{background: C.saffron, opacity: sting, justifyContent: 'center', alignItems: 'center'}}>
          <div style={{transform: `scale(${lerp(0.9, 1, stingIn)})`}}>
            <Wordmark size={150} tagline />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
