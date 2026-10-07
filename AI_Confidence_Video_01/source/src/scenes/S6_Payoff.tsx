import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {Headline} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {TL, at, segEnd} from '../lib/timeline';
import {easeInOut, ramp} from '../lib/anim';
import {C, F} from '../theme';

export const S6Payoff: React.FC = () => {
  const g = useG();
  const c0 = at('s36');
  const cBecause = at('s36', 'Because');
  const cPatterns = at('s36', 'patterns');
  const cBeing = at('s36', 'being');
  const cEvidence = at('s36', 'evidence');
  const cDont = at('s37', "don't");
  const cAsk = at('s37', 'Ask:');
  const cActually = at('s37', 'actually');
  const cWorks = at('s38', 'It');
  const cPeople = at('s38', 'people,');
  const cEnd = segEnd('s38');

  const qT = ramp(g, c0, 14) * (1 - ramp(g, cBecause - 2, 12));
  const linesIn = ramp(g, cBecause, 14);
  const l1 = ramp(g, cPatterns - 6, 16);
  const l2 = ramp(g, cEvidence - 6, 16);
  const linesOut = ramp(g, cDont - 8, 14);
  const soundsT = ramp(g, cDont - 2, 14);
  const strikeT = ramp(g, cAsk - 6, 12, easeInOut);
  const askT = ramp(g, cAsk, 16);
  const actuallyT = ramp(g, cActually, 12);
  const habitOut = ramp(g, cEnd + 18, 18);
  const endCard = ramp(g, cEnd + 26, 22);
  const fadeAll = 1 - ramp(g, TL.durationInFrames - 26, 24);

  return (
    <AbsoluteFill style={{opacity: fadeAll}}>
      <Backdrop glow={{x: 960, y: 520, color: 'rgba(60,201,180,0.35)', size: 1400, opacity: 0.08}} />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: qT}}>
        <Headline size={92} style={{textAlign: 'center'}}>
          So why does AI sound right
          <br />
          when it’s <span style={{color: C.coral}}>wrong</span>?
        </Headline>
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: linesIn * (1 - linesOut)}}>
        <div style={{display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 46, rowGap: 56, alignItems: 'center'}}>
          <div style={{fontFamily: F.sans, fontSize: 72, fontWeight: 760, color: C.text, opacity: l1, textAlign: 'right'}}>Sounding right</div>
          <div style={{fontFamily: F.sans, fontSize: 60, color: C.muted, opacity: l1}}>←</div>
          <div style={{fontFamily: F.sans, fontSize: 60, fontWeight: 600, color: C.textDim, opacity: l1}}>patterns in language</div>
          <div style={{fontFamily: F.sans, fontSize: 72, fontWeight: 760, color: C.text, opacity: l2, textAlign: 'right'}}>Being right</div>
          <div style={{fontFamily: F.sans, fontSize: 60, color: C.muted, opacity: l2}}>←</div>
          <div style={{fontFamily: F.sans, fontSize: 60, fontWeight: 650, color: C.teal, opacity: l2}}>evidence</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: soundsT * (1 - habitOut)}}>
        <div style={{position: 'relative', fontFamily: F.sans, fontSize: 52, fontWeight: 600, color: C.muted, marginBottom: 70}}>
          Does it sound right?
          <div style={{position: 'absolute', left: -10, top: '52%', height: 5, width: `calc(${strikeT * 100}% + 20px)`, background: C.muted, borderRadius: 3}} />
        </div>
        <div style={{opacity: askT, transform: `translateY(${(1 - askT) * 16}px)`, textAlign: 'center'}}>
          <Headline size={96}>What’s the evidence,</Headline>
          <Headline size={96} style={{marginTop: 12}}>
            and does it <span style={{color: C.teal, opacity: 0.4 + 0.6 * actuallyT}}>actually say this?</span>
          </Headline>
        </div>
        <div style={{marginTop: 60, fontFamily: F.sans, fontSize: 32, color: C.textDim, opacity: ramp(g, cWorks, 14) * (1 - habitOut)}}>
          Works on chatbots. <span style={{opacity: ramp(g, cPeople - 8, 14)}}>Works pretty well on people, too.</span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: endCard}}>
        <div style={{fontFamily: F.sans, fontSize: 30, fontWeight: 700, letterSpacing: '0.16em', color: C.muted}}>BLAKE KIMBLE</div>
        <Headline size={70} style={{marginTop: 26, textAlign: 'center'}}>
          Why AI Sounds Right When It’s Wrong
        </Headline>
        <div style={{marginTop: 34, fontFamily: F.sans, fontSize: 28, color: C.textDim}}>Sources, credits, and the full paper links are in the description.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
