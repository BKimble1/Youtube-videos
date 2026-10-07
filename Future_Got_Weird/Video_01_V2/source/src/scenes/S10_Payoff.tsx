import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {TL, at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp} from '../lib/anim';
import {C, F, FPS} from '../theme';
import {CounterSet, Wordmark} from '../components/Sets';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {Marked, QuestionCard, Slip, StampHand, StampMark} from '../components/Props';
import {Chip, Headline, Label} from '../components/Text';

const WIN_X = [480, 960, 1440];

export const S10Payoff: React.FC = () => {
  const g = useG();
  const c33 = at('s33');
  const cBecause = at('s33', 'Because');
  const cPatterns = at('s33', 'patterns');
  const cBeing = at('s33', 'being');
  const cEvidence = at('s33', 'evidence');
  const cDont = at('s34', "don't");
  const cAsk = at('s34', 'Ask');
  const cActually = at('s34', 'actually');
  const cChatbots = at('s35', 'chatbots.');
  const cPeople = at('s35', 'people,');
  const cThis = at('s36', 'This');
  const cTwice = at('s36', 'twice');
  const cSubscribe = at('s36', 'subscribe.');
  const cEnd = segEnd('s36');

  const WIDE: Cam = {cx: 960, cy: 560, zoom: 1};
  const PERSON: Cam = {cx: 1380, cy: 640, zoom: 1.35};
  const cam = camLerp(WIDE, PERSON, ramp(g, cPeople - 14, 18, easeInOut) * (1 - ramp(g, cThis - 10, 14, easeInOut)));

  const qT = ramp(g, c33 - 4, 12) * (1 - ramp(g, cBecause - 6, 8));
  const col1 = ramp(g, cBecause, 14);
  const col1b = ramp(g, cPatterns, 12);
  const col2 = ramp(g, cBeing, 14);
  const col2b = ramp(g, cEvidence, 12);
  const colsOut = ramp(g, cDont - 8, 10);
  const soundsT = ramp(g, cDont - 2, 12);
  const strike = ramp(g, cDont + 10, 12, easeInOut);
  const askT = ramp(g, cAsk, 14);
  const ask2 = ramp(g, cActually - 6, 12);
  const habitOut = ramp(g, cChatbots - 8, 10);
  const nodT = ramp(g, cChatbots - 6, 10);
  const personIn = ramp(g, cPeople - 16, 24, easeInOut);
  const personSlip = pop(g, FPS, cPeople - 2);
  const handIn = ramp(g, cPeople + 6, 10, easeInOut);
  const pressAt = cPeople + 16;
  const press = g >= pressAt && g < pressAt + 10 ? Math.sin(((g - pressAt) / 10) * Math.PI) : 0;
  const stampT = ramp(g, pressAt + 4, 8);
  const handOut = ramp(g, pressAt + 18, 12, easeInOut);
  const endIn = ramp(g, cThis - 6, 14, easeInOut);
  const twiceT = ramp(g, cTwice - 2, 12);
  const subT = pop(g, FPS, cSubscribe - 6);
  const wordPop = (w: string) => pop(g, FPS, at('s36', w) - 4, 20);
  const reveal: [number, number, number] = [wordPop('Future'), wordPop('Got'), wordPop('Weird.')];
  const taglineT: [number, number] = [ramp(g, at('s36', 'AI') - 2, 10), ramp(g, at('s36', 'we') - 2, 10)];
  // two small nudges of the subscribe chip while the card holds (deterministic, frame-driven)
  const nudge = [cSubscribe + 40, cSubscribe + 85].reduce((acc, p0) => (g >= p0 && g < p0 + 12 ? acc + 0.08 * Math.sin(((g - p0) / 12) * Math.PI) : acc), 0);
  const fadeAll = 1 - ramp(g, TL.durationInFrames - 24, 22);

  const clerkPose = (i: number): Pose => mixPose({...IDLE, mouth: 'smile', lookX: -0.2, lookY: 0.2}, {...IDLE, mouth: 'grin', brows: 0.6, bob: -4 * Math.abs(Math.sin((g + i * 7) / 6)), lookX: 0, lookY: 0.1}, nodT * (1 - ramp(g, cPeople + 10, 10)));
  const checkerPose: Pose = {...IDLE, armL: {a: 10, b: 60}, mouth: 'smirk', lookX: 0.6, lookY: -0.1, browAsym: 0.4};
  const personPose: Pose = mixPose({...IDLE, armR: {a: 40, b: 80}, mouth: 'grin', brows: 0.6, lookX: -0.5, lookY: 0.2, lean: -3}, {...IDLE, armR: {a: 30, b: 60}, mouth: 'o', brows: 1, lookX: -0.7, lookY: 0.6}, ramp(g, pressAt + 4, 8));

  return (
    <AbsoluteFill style={{opacity: fadeAll, background: C.saffron}}>
      <Camera cam={cam}>
        <CounterSet
          signText="ANSWERS"
          front={
            <>
              {/* the person's slip on the counter, window 3 */}
              {personSlip > 0 && (
                <div style={{position: 'absolute', left: WIN_X[2] - 200, top: 610, opacity: Math.min(1, personSlip * 1.5), transform: `scale(${lerp(0.8, 1, personSlip)}) rotate(2deg)`, transformOrigin: '50% 0%'}}>
                  <Slip model="A person" detail="any given Tuesday" width={400} fontSize={30}>
                    <Marked spans={[{text: '“Trust me, I read it somewhere.”'}]} />
                  </Slip>
                  {stampT > 0 && (
                    <div style={{position: 'absolute', left: 150, top: 70}}>
                      <StampMark text="Source?" tone="coral" t={stampT} size={50} rotate={-10} />
                    </div>
                  )}
                </div>
              )}
            </>
          }
        >
          <Layer depth={1}>
            {['clerkA', 'clerkB'].map((n, i) => (
              <Character key={n} look={CAST[n]} pose={clerkPose(i)} frame={g} seed={i + 2} x={WIN_X[i]} y={790} scale={0.98} />
            ))}
            {/* window 3: clerk C steps aside, a regular person steps up */}
            <Character look={CAST.clerkC} pose={clerkPose(2)} frame={g} seed={5} x={WIN_X[2] + personIn * 260} y={790} scale={0.98} />
            <Character look={CAST.person} pose={personPose} frame={g} seed={21} x={lerp(2300, WIN_X[2] - 20, personIn)} y={790} scale={0.98} />
          </Layer>
        </CounterSet>
        <Layer depth={1.14}>
          <Character look={CAST.checker} pose={checkerPose} frame={g} seed={9} x={150} y={1130} scale={1.08} />
        </Layer>
        {handIn > 0 && handOut < 1 && (
          <Layer depth={1.2}>
            <StampHand x={WIN_X[2] + 60} y={650} press={press} t={handIn * (1 - handOut)} sleeve={C.coral} />
          </Layer>
        )}
      </Camera>

      {/* the question, big */}
      {qT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', opacity: qT}}>
          <Headline size={88} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 22, padding: '18px 44px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            So why is AI so <span style={{color: C.coral}}>confidently</span> wrong?
          </Headline>
        </div>
      )}
      {/* two columns: sounding right vs being right */}
      {col1 > 0 && colsOut < 1 && (
        <div style={{position: 'absolute', left: 120, right: 120, top: 70, display: 'flex', gap: 40, opacity: 1 - colsOut}}>
          <div style={{flex: 1, opacity: col1, transform: `translateY(${(1 - col1) * 20}px)`, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 22, padding: '22px 30px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            <Label size={26} color={C.inkMuted} weight={800} style={{letterSpacing: '0.1em'}}>SOUNDING RIGHT</Label>
            <Headline size={54} align="left" style={{marginTop: 6}}>comes from <span style={{color: C.blueDeep, opacity: 0.3 + 0.7 * col1b}}>patterns in language</span></Headline>
            <div style={{marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', opacity: col1b}}>
              {['Methods', 'Algorithms', 'Machine Learning', 'is entitled:'].map((w) => (
                <Chip key={w} tone="paper" size={22}>{w}</Chip>
              ))}
            </div>
          </div>
          <div style={{flex: 1, opacity: col2, transform: `translateY(${(1 - col2) * 20}px)`, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 22, padding: '22px 30px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            <Label size={26} color={C.inkMuted} weight={800} style={{letterSpacing: '0.1em'}}>BEING RIGHT</Label>
            <Headline size={54} align="left" style={{marginTop: 6}}>takes <span style={{color: C.tealDeep, opacity: 0.3 + 0.7 * col2b}}>evidence</span> the model doesn’t always have</Headline>
            <div style={{marginTop: 14, opacity: col2b}}>
              <Chip tone="teal" size={22}>Kalai (2001) · thesis title page</Chip>
            </div>
          </div>
        </div>
      )}
      {/* the habit */}
      {soundsT > 0 && habitOut < 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: soundsT * (1 - habitOut)}}>
          <div style={{background: C.cream, border: `4px solid ${C.inkMuted}`, borderRadius: 18, padding: '12px 30px', fontFamily: F.display, fontWeight: 600, fontSize: 48, color: C.inkMuted}}>
            <Marked spans={[{text: 'Does it sound right?', mark: 'strike', markT: strike}]} />
          </div>
          <div style={{opacity: askT, transform: `translateY(${(1 - askT) * 16}px)`}}>
            <QuestionCard n={1} text="What’s the evidence?" width={760} />
          </div>
          <div style={{opacity: ask2, transform: `translateY(${(1 - ask2) * 16}px)`}}>
            <QuestionCard n={2} text="Does it actually say this?" width={760} />
          </div>
        </div>
      )}
      {/* end card */}
      {endIn > 0 && (
        <AbsoluteFill style={{background: C.saffron, opacity: endIn, justifyContent: 'center', alignItems: 'center'}}>
          <div style={{transform: `translateY(${(1 - endIn) * 30}px)`}}>
            <Wordmark size={150} tagline reveal={reveal} taglineT={taglineT} />
          </div>
          <div style={{marginTop: 70, display: 'flex', gap: 28, alignItems: 'center', opacity: twiceT, transform: `translateY(${(1 - twiceT) * 16}px)`}}>
            <Chip tone="ink" size={30}>New episodes twice a week</Chip>
            <div style={{transform: `scale(${Math.max(0.01, subT) * (1 + nudge)})`}}>
              <Chip tone="coral" size={34}>Subscribe</Chip>
            </div>
          </div>
          <Label size={26} color={C.inkSoft} weight={800} align="center" style={{marginTop: 50}}>Sources, excerpts and credits are in the description.</Label>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
