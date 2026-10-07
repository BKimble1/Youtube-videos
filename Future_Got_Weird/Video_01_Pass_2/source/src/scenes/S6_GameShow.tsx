import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp, window as win} from '../lib/anim';
import {C, F, FPS} from '../theme';
import {StageSet} from '../components/Sets';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {AnswerTile, Confetti, Podium, RuleCard, Scoreboard, TileState, Trophy} from '../components/Props';
import {Bubble} from '../components/Props2';
import {Chip, Headline, Sign} from '../components/Text';

const HONEST_X = 560;
const GUESSER_X = 1360;
const HOST_X = 960;
const FLOOR_Y = 850;

export const S6GameShow: React.FC = () => {
  const g = useG();
  const c20 = at('s20');
  const cWhyNot = at('s20', 'Why', 2);
  const cArgue = at('s20', 'argue');
  const cGraded = at('s20', 'graded.');
  const cPicture = at('s21', 'Picture');
  const cRight = at('s21', 'Right');
  const cWrong = at('s21', 'Wrong');
  const cIdk = at('s21', '“I');
  const cTwo = at('s22', 'Two');
  const cBoth = at('s22', 'Both');
  const cHonest = at('s22', 'honest');
  const cBlank = at('s22', 'blank.');
  const cSixPts = at('s22', 'Six');
  const cGuesser = at('s23', 'guesser');
  const cFour = at('s23', 'Four');
  const cLands = at('s23', 'lands.');
  const cSeven = at('s23', 'Seven');
  const cLucky = at('s24', 'One');
  const cThree = at('s24', 'Three');
  const cSomehow = at('s24', 'Somehow,');
  const cTrophy = at('s24', 'trophy.');
  const cChange = at('s25', 'change');
  const cCosts = at('s25', 'costs');
  const cStill = at('s25', 'still');
  const cPlus = at('s25', 'plus');
  const cMinus = at('s25', 'minus');
  const cFourPts = at('s25', 'Four.');
  const cWalks = at('s25', 'trophy');
  const cEnd = segEnd('s25');

  // ---- camera
  const WIDE: Cam = {cx: 960, cy: 540, zoom: 1};
  const HOST: Cam = {cx: 960, cy: 520, zoom: 1.35};
  const RULES: Cam = {cx: 960, cy: 330, zoom: 1.25};
  const GUESS: Cam = {cx: 1300, cy: 460, zoom: 1.25};
  let cam = WIDE;
  cam = camLerp(cam, HOST, ramp(g, c20 - 4, 16, easeInOut) * (1 - ramp(g, cPicture - 8, 16, easeInOut)));
  cam = camLerp(cam, RULES, ramp(g, cPicture - 8, 16, easeInOut) * (1 - ramp(g, cTwo - 8, 16, easeInOut)));
  cam = camLerp(cam, GUESS, ramp(g, cGuesser - 6, 16, easeInOut) * (1 - ramp(g, cTrophy + 20, 16, easeInOut)));

  // ---- beats
  const hostIn = ramp(g, c20 - 10, 20, easeInOut);
  const shrugT = win(g, cWhyNot, cArgue, 10, 10);
  const signT = pop(g, FPS, cGraded - 8);
  const ruleT = [ramp(g, cRight - 4, 12), ramp(g, cWrong - 4, 12), ramp(g, cIdk - 4, 12)];
  const flip = ramp(g, cCosts, 16, easeInOut);
  const podiumT = pop(g, FPS, cTwo - 2, 26);
  const knownT = (k: number) => ramp(g, cBoth + 4 + k * 3, 10);
  const blankT = (k: number) => ramp(g, cBlank - 8 + k * 4, 10);
  const honestScore = g >= cSixPts ? 6 : null;
  const guessPhase = g >= cFour && g < cLands;
  const resolved = g >= cLands;
  const resolveT = (k: number) => ramp(g, cLands + k * 4, 10);
  const guesserScore = g >= cFourPts ? 4 : g >= cSeven ? 7 : null;
  const seven = ramp(g, cSeven, 8);
  const trophyIn = pop(g, FPS, cTrophy - 6, 26);
  const confettiT = ramp(g, cTrophy - 4, 50, (x) => x);
  // rule change
  const changeT = ramp(g, cChange - 4, 12);
  const penalty = (k: number) => ramp(g, cMinus + 2 + k * 5, 10);
  const plusT = ramp(g, cPlus, 10);
  const fourT = ramp(g, cFourPts, 8);
  // the trophy walks from the guesser's podium to the honest one
  const walk = ramp(g, cWalks, 38, easeInOut);
  const feet = ramp(g, cWalks - 6, 8) * (1 - ramp(g, cWalks + 44, 10));
  const trophyX = lerp(GUESSER_X + 160, HONEST_X - 170, walk);
  const sceneOut = 1 - ramp(g, cEnd + 30, 12);

  // ---- poses
  const hostIdle: Pose = {...IDLE, armR: {a: 30, b: 120}, mouth: 'smile', lookX: 0, lookY: 0.1};
  const hostShrug: Pose = {...IDLE, armL: {a: 60, b: 70}, armR: {a: 60, b: 70}, mouth: 'hmm', brows: 1, tilt: 6, lookX: 0.4};
  const hostDeadpan: Pose = {...IDLE, armR: {a: 30, b: 120}, mouth: 'flat', brows: -0.2, browAsym: 0.9, lookX: 0.6, lookY: 0.2};
  let host = mixPose(hostIdle, hostShrug, shrugT);
  host = mixPose(host, hostDeadpan, win(g, cSomehow - 4, cChange - 6, 8, 8));
  const honestIdle: Pose = {...IDLE, mouth: 'smile', lookX: 0.3, lookY: -0.2};
  const honestHmm: Pose = {...IDLE, mouth: 'flat', brows: -0.1, lookX: 0.8, lookY: 0};
  const honestWin: Pose = {...IDLE, mouth: 'grin', brows: 1, lookX: 0.5, lookY: 0.3, bob: -8};
  let honest = mixPose(honestIdle, honestHmm, win(g, cTrophy - 6, cWalks, 10, 10));
  honest = mixPose(honest, honestWin, ramp(g, cWalks + 28, 10));
  const guesserIdle: Pose = {...IDLE, mouth: 'grin', lookX: -0.3, lookY: -0.1, brows: 0.5};
  const guesserGuess: Pose = {...IDLE, armR: {a: 40, b: 110}, mouth: 'o', brows: 1, lookX: -0.2, lookY: -0.8, bob: -6};
  const guesserWin: Pose = {...IDLE, armL: {a: 150, b: 20}, armR: {a: 150, b: 20}, mouth: 'grin', brows: 1, lookX: -0.2, lookY: -0.4, bob: -10};
  const guesserLose: Pose = {...IDLE, mouth: 'frown', brows: -0.6, lookX: -0.9, lookY: 0.6, tilt: 8, lean: 4};
  let guesser = mixPose(guesserIdle, guesserGuess, win(g, cFour - 4, cLands + 6, 10, 10));
  guesser = mixPose(guesser, guesserWin, win(g, cSeven, cChange - 6, 10, 14));
  guesser = mixPose(guesser, guesserLose, ramp(g, cMinus, 14));

  const row = (who: 'honest' | 'guesser') => {
    const x = who === 'honest' ? HONEST_X : GUESSER_X;
    const cells: {state: TileState; t: number; delta?: {text: string; t: number; tone: 'teal' | 'coral'}}[] = [];
    for (let k = 0; k < 10; k++) {
      if (k < 6) cells.push({state: 'known', t: knownT(k)});
      else if (who === 'honest') cells.push({state: g >= cBlank - 8 ? 'blank' : 'empty', t: g >= cBlank - 8 ? blankT(k - 6) : 1});
      else if (resolved) cells.push({state: k === 6 ? 'lucky' : 'wrong', t: resolveT(k - 6), delta: k === 6 ? {text: '+1', t: plusT, tone: 'teal'} : {text: '−1', t: penalty(k - 7), tone: 'coral'}});
      else if (guessPhase) cells.push({state: 'guessing', t: 1});
      else cells.push({state: 'empty', t: 1});
    }
    return (
      <div style={{position: 'absolute', left: x - 380, top: 310, width: 760, display: 'flex', gap: 8, justifyContent: 'center', opacity: podiumT}}>
        {cells.map((c, k) => (
          <AnswerTile key={k} state={c.state} t={c.t} frame={g} i={k} size={66} delta={c.delta} />
        ))}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.saffronDeep}}>
      <Camera cam={cam}>
        <StageSet>
          <Layer depth={0.85}>
            {/* rules board hangs at the back */}
            <div style={{position: 'absolute', left: 960 - 560, top: 70, width: 1120, display: 'flex', gap: 24, justifyContent: 'center'}}>
              <RuleCard glyph="✓" label="Right" value="+1" t={ruleT[0]} tone={C.tealDeep} width={340} />
              <div style={{transform: `scale(${1 + 0.06 * win(g, cChange, cStill, 8, 8)})`}}>
                <RuleCard glyph="✕" label="Wrong" value="0" newValue="−1" flip={flip} t={ruleT[1]} tone={C.coralDeep} width={340} />
              </div>
              <RuleCard glyph="?" label="“I don’t know”" value="0" t={ruleT[2]} tone={C.inkMuted} width={380} />
            </div>
            {ruleT[0] > 0 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: 184, textAlign: 'center', opacity: ruleT[2]}}>
                <Chip tone="paper" size={22} dashed>illustrative quiz · 10 questions · 4 options each · expected scores</Chip>
              </div>
            )}
            {signT > 0 && (
              <div style={{position: 'absolute', left: 960 - 300, top: 110, width: 600, textAlign: 'center', transform: `scale(${signT})`, opacity: 1 - ramp(g, cPicture - 6, 8)}}>
                <Sign size={44} width={600} style={{boxSizing: 'border-box'}}>HOW MODELS GET GRADED</Sign>
                <div style={{marginTop: 14}}><Chip tone="paper" size={22}>the researchers’ argument · Kalai et al. 2025</Chip></div>
              </div>
            )}
          </Layer>
          <Layer depth={1}>
            {/* answer tiles */}
            {row('honest')}
            {row('guesser')}
            {/* contestants behind podiums */}
            {podiumT > 0 && (
              <>
                <Character look={CAST.honest} pose={honest} frame={g} seed={11} x={HONEST_X} y={FLOOR_Y + 30} scale={0.95} />
                <Character look={CAST.guesser} pose={guesser} frame={g} seed={12} x={GUESSER_X} y={FLOOR_Y + 30} scale={0.95} />
                <Podium name="HONEST" color={C.teal} style={{left: HONEST_X, top: FLOOR_Y + 20, transform: `scale(${podiumT})`, transformOrigin: '50% 100%'}} />
                <Podium name="GUESSER" color={C.coral} style={{left: GUESSER_X, top: FLOOR_Y + 20, transform: `scale(${podiumT})`, transformOrigin: '50% 100%'}} />
                <Scoreboard value={honestScore ?? '–'} tone={honestScore === null ? 'ink' : 'teal'} scale={0.8} style={{left: HONEST_X - 380, top: 560}} pulse={win(g, cSixPts, cSixPts + 12, 4, 8)} />
                <Scoreboard value={guesserScore ?? '–'} tone={guesserScore === null ? 'ink' : g >= cFourPts ? 'ink' : 'coral'} scale={0.8} style={{left: GUESSER_X + 230, top: 560}} pulse={Math.max(win(g, cSeven, cSeven + 12, 4, 8), win(g, cFourPts, cFourPts + 12, 4, 8))} />
                {/* the arithmetic for the rule change */}
                {changeT > 0 && (
                  <div style={{position: 'absolute', right: 60, top: 505, fontFamily: F.mono, fontSize: 30, color: C.white, opacity: ramp(g, cStill, 10), whiteSpace: 'pre', background: C.ink, padding: '6px 16px', borderRadius: 10, border: `3px solid ${C.ink}`}}>
                    6<span style={{opacity: plusT}}> + 1</span><span style={{opacity: penalty(0)}}> − 1</span><span style={{opacity: penalty(1)}}> − 1</span><span style={{opacity: penalty(2)}}> − 1</span><span style={{opacity: fourT, color: C.saffron}}> = 4</span>
                  </div>
                )}
              </>
            )}
            {/* the host */}
            <Character look={CAST.host} pose={host} frame={g} seed={13} x={HOST_X} y={FLOOR_Y + 30 + (1 - hostIn) * 400} scale={0.95} />
            {/* trophy */}
            {trophyIn > 0 && (
              <div style={{position: 'absolute', left: walk > 0 ? trophyX : GUESSER_X + 160, top: FLOOR_Y + 12, transform: `scale(${trophyIn})`, transformOrigin: '50% 100%'}}>
                <Trophy scale={1.2} feet={feet} step={g * 0.6} sweat={feet} />
              </div>
            )}
            {confettiT > 0 && confettiT < 1 && <Confetti t={confettiT} x={GUESSER_X} y={420} seed={5} />}
          </Layer>
        </StageSet>
      </Camera>
      {/* the quiz label and the joke */}
      {g >= cLucky - 2 && g < cChange - 4 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 60, textAlign: 'center', opacity: ramp(g, cLucky - 2, 10) * (1 - ramp(g, cChange - 12, 8))}}>
          <Headline size={56} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '12px 32px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            One lucky guess. <span style={{opacity: 0.3 + 0.7 * ramp(g, cThree - 2, 8)}}>Three wrong answers.</span> <span style={{color: C.coral, opacity: 0.3 + 0.7 * ramp(g, cSomehow - 2, 8)}}>Somehow, a trophy.</span>
          </Headline>
        </div>
      )}
      {g >= cLands && g < cChange - 4 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 50, textAlign: 'center', opacity: ramp(g, cLands, 10)}}>
          <Chip tone="paper" size={22}>1 in 4 per guess · one correct guess is the average outcome, shown here for the demonstration</Chip>
        </div>
      )}
      {g >= cWalks && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 50, textAlign: 'center', opacity: ramp(g, cWalks, 10)}}>
          <Chip tone="ink" size={26}>Same knowledge. One rule changed. Bluffing stops paying.</Chip>
        </div>
      )}
    </AbsoluteFill>
  );
};
