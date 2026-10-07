import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp} from '../lib/anim';
import {C, F, FPS} from '../theme';
import {DeskSet} from '../components/Sets';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {Evidence} from '../components/Evidence';
import {Marked, QuestionCard, Slip, StampHand, StampMark} from '../components/Props';
import {Chip, Headline, Sign} from '../components/Text';
import {SLIPS} from './S1_Counter';

export const S9Verify: React.FC = () => {
  const g = useG();
  const c29 = at('s29');
  const cCheck = at('s29', 'check.');
  const cTwo = at('s30', 'Two');
  const cExist = at('s30', 'exist?');
  const cSay = at('s30', 'say');
  const cTake = at('s31', 'Take');
  const cIsThere = at('s31', 'Is');
  const cYes = at('s31', 'Yes.');
  const cDoes = at('s31', 'Does');
  const cNo = at('s31', 'No.');
  const cItSays = at('s31', 'It');
  const c2001 = at('s31', '2001.');
  const cSource = at('s32', 'Source');
  const cClaim = at('s32', 'Claim');
  const cStamp = at('s32', 'Stamp');
  const cEnd = segEnd('s32');

  const WIDE: Cam = {cx: 960, cy: 540, zoom: 1};
  const DESK: Cam = {cx: 900, cy: 600, zoom: 1.15};
  let cam = camLerp(WIDE, DESK, ramp(g, cTake - 6, 18, easeInOut) * (1 - ramp(g, cEnd + 6, 12, easeInOut)));

  const signT = pop(g, FPS, cCheck - 4);
  const q1 = ramp(g, cTwo + 6, 14);
  const q2 = ramp(g, cSay - 10, 14);
  const slipIn = pop(g, FPS, cTake - 2);
  const q1yes = ramp(g, cYes - 2, 8);
  const recIn = pop(g, FPS, cIsThere + 6, 24);
  const q2no = ramp(g, cNo - 2, 8);
  const mTitle = ramp(g, cDoes + 6, 14);
  const mYear = ramp(g, cDoes + 20, 10);
  const rTitle = ramp(g, cItSays, 14);
  const rYear = ramp(g, c2001 - 6, 10);
  const existsT = ramp(g, cSource, 10);
  const failsT = ramp(g, cClaim, 10);
  const handIn = ramp(g, cStamp - 10, 12, easeInOut);
  const press = g >= cStamp && g < cStamp + 10 ? Math.sin(((g - cStamp) / 10) * Math.PI) : 0;
  const stampT = ramp(g, cStamp + 4, 8);
  const handOut = ramp(g, cStamp + 16, 14, easeInOut);
  const sceneOut = 1 - ramp(g, cEnd + 18, 10);

  const checkerPose: Pose = mixPose(
    {...IDLE, armR: {a: 20, b: 60}, lookX: -0.6, lookY: 0.4, mouth: 'flat'},
    {...IDLE, armR: {a: 20, b: 60}, lookX: -0.4, lookY: 0.3, mouth: 'smirk', brows: 0.3},
    ramp(g, cStamp + 6, 10),
  );
  const s = SLIPS[0];

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.coralLight}}>
      <Camera cam={cam}>
        <DeskSet
          wall={C.tealLight}
          board={
            <>
              {/* the two questions pinned on the board */}
              <div style={{position: 'absolute', left: 60, top: 60}}>
                <QuestionCard n={1} text="Does the source exist?" state={q1yes > 0.5 ? 'yes' : 'open'} t={q1} width={620} />
              </div>
              <div style={{position: 'absolute', left: 60, top: 190}}>
                <QuestionCard n={2} text="Does it actually say this?" state={q2no > 0.5 ? 'no' : 'open'} t={q2} width={620} />
              </div>
              {/* the real record, pinned on the right once found */}
              {recIn > 0 && (
                <div style={{position: 'absolute', left: 780, top: 40, transform: `scale(${lerp(0.8, 1, recIn)}) rotate(1.5deg)`, opacity: Math.min(1, recIn * 1.5), transformOrigin: '50% 0%'}}>
                  <Evidence
                    src="img/thesis_title_block.png"
                    width={760}
                    aspect={1386 / 3264}
                    pad={16}
                    boxes={[
                      {x: 0.03, y: 0.03, w: 0.94, h: 0.42, t: rTitle, tone: 'teal', label: 'what it actually says', labelSide: 'top'},
                      {x: 0.418, y: 0.748, w: 0.162, h: 0.07, t: rYear, tone: 'teal', label: '2001', labelSide: 'right', pad: 4},
                    ]}
                    tag={<Chip tone="teal" size={22}>found: Kalai (2001), PhD thesis, Carnegie Mellon · exists ✓</Chip>}
                  />
                </div>
              )}
            </>
          }
        >
          <Layer depth={1}>
            {/* the fact-checker behind the desk */}
            <Character look={CAST.checker} pose={checkerPose} frame={g} seed={9} x={1500} y={890} scale={0.95} />
          </Layer>
          <Layer depth={1.05}>
            {/* the slip on the desk */}
            {slipIn > 0 && (
              <div style={{position: 'absolute', left: 190, top: 700, transform: `scale(${lerp(0.8, 1, slipIn)}) rotate(-2deg)`, transformOrigin: '50% 0%', opacity: Math.min(1, slipIn * 1.5)}}>
                <Slip model={s.model} detail={s.detail} width={760} fontSize={30}>
                  <Marked
                    spans={[
                      {text: 'Adam Tauman Kalai’s Ph.D. dissertation (completed in '},
                      {text: '2002', mark: 'coral', markT: mYear},
                      {text: ' at CMU) is entitled: '},
                      {text: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”', mark: 'coral', markT: mTitle},
                    ]}
                  />
                </Slip>
                {stampT > 0 && (
                  <div style={{position: 'absolute', left: 420, top: 60}}>
                    <StampMark text="Claim fails" tone="coral" t={stampT} size={56} rotate={-10} />
                  </div>
                )}
                {existsT > 0 && (
                  <div style={{position: 'absolute', left: 0, top: -70, display: 'flex', gap: 14}}>
                    <div style={{opacity: existsT}}><Chip tone="teal" size={26}>source exists</Chip></div>
                    <div style={{opacity: failsT}}><Chip tone="coral" size={26}>claim fails</Chip></div>
                  </div>
                )}
              </div>
            )}
          </Layer>
          {handIn > 0 && handOut < 1 && (
            <Layer depth={1.15}>
              <StampHand x={700} y={760} press={press} t={handIn * (1 - handOut)} sleeve={C.coral} />
            </Layer>
          )}
        </DeskSet>
      </Camera>
      {signT > 0 && g < cTake + 10 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', transform: `scale(${signT})`, opacity: 1 - ramp(g, cTake - 4, 10)}}>
          <Headline size={64} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '12px 36px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            The unglamorous move: <span style={{color: C.tealDeep}}>check.</span>
          </Headline>
        </div>
      )}
    </AbsoluteFill>
  );
};
