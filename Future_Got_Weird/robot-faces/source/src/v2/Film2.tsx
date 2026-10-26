// V2 film: the ordered shot list on the measured timeline (6400 frames, the V2 narration master). Each shot names
// its transition into it; production/V2_TRANSITIONS.md is generated from this table (tools/v2_transitions.ts).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, H, W} from '../lib/core';
import {K} from '../state';
import {T} from '../lib/core';
import {END} from './state2';
import * as O from './shots2';
import * as A from './shotsA';
import * as B from './shotsB';
import * as C from './shotsC';
import * as D from './shotsD';

export type Tr = 'start' | 'cut' | 'cut-action' | 'match' | 'occlusion' | 'continuous';
export type Shot2 = {id: string; a: number; b: number; C: React.FC<{f: number}>; tr: Tr; what: string; cont?: string};
const D_ = D;
export const SHOTS2: Shot2[] = [
  // ---- opening
  {id: 'a1-ecu', a: 0, b: T('smile before'), C: D_.A1Ecu, tr: 'start', what: 'Extreme close-up: the robot\u2019s face already moving, eyes on the camera; the camera draws back and it is a machine on a support'},
  {id: 'a2-pair', a: T('smile before'), b: T('Then it tries'), C: D_.A2Pair, tr: 'cut', what: 'Face to face, close: his cue forms; its eyes go to his mouth and back'},
  {id: 'a3-under', a: T('Then it tries'), b: T('tries to smile') + 0.52, C: D_.A3Under, tr: 'cut', what: 'One push into its cheek: the skin opens onto the motor and linkage beneath'},
  {id: 'a4-side', a: T('tries to smile') + 0.52, b: T('person in front') + 0.1, C: D_.A4Side, tr: 'cut-action', what: 'The same smile in side section: the motor turns, the linkage pulls the skin, the lips change shape', cont: 'smile continues across the cut'},
  {id: 'a5-shared', a: T('person in front') + 0.1, b: K.corner, C: D_.A5Shared, tr: 'cut', what: 'Both smiles arrive together'},
  {id: 'a6-old', a: K.corner, b: T('moving the') + 0.25, C: D_.A6Old, tr: 'cut', what: 'Contrast: a stiffer robot face moves only its corners (illustration)'},
  {id: 'a7-recoil', a: T('moving the') + 0.25, b: T('of a mouth.') - 0.1, C: D_.A7Recoil, tr: 'cut', what: 'He flinches at the stiff grin'},
  {id: 'a8-soft', a: T('of a mouth.') - 0.1, b: T('Researchers'), C: D_.A8Soft, tr: 'cut', what: 'The soft face: corners, cheeks, lips and skin move together'},
  {id: 'a9-truck', a: T('Researchers'), b: K.mirrorCut, C: O.MirTruck, tr: 'cut', what: 'Across the lab: the mirror frame slides past and reveals the reflection'},
  {id: 'a10-tests', a: K.mirrorCut, b: T('copy human'), C: D_.A10Tests, tr: 'cut', what: 'The reflection: four different test expressions, the motors faintly visible'},
  {id: 'a11-lips', a: T('copy human'), b: T('copy human') + 0.62, C: D_.A11Lips, tr: 'cut', what: 'A person\u2019s lips, very close'},
  {id: 'a12-copy', a: T('copy human') + 0.62, b: T('predict an') + 0.05, C: D_.A12Copy, tr: 'match', what: 'The robot\u2019s lips (in the mirror) make the same shapes in the same place in the frame', cont: 'mouth position and size matched; identity changes, no morph'},
  {id: 'a13-predict', a: T('predict an') + 0.05, b: T('And the place'), C: D_.A13Predict, tr: 'cut', what: 'Two faces: his cue starts; its smile starts before his is plain'},
  {id: 'a14-mirror', a: T('And the place'), b: K.columbia, C: D_.A14Mirror, tr: 'cut', what: 'Back out of the reflection to the whole mirror setup'},
  // ---- mechanism
  {id: 'b1-orbit', a: K.columbia, b: T('flexible'), C: D_.B1Orbit, tr: 'cut', what: 'The camera circles from its profile to its face; Columbia tag'},
  {id: 'b2-flex', a: T('flexible'), b: T('with twenty-six'), C: D_.B2Flex, tr: 'cut', what: 'Close: the silicone stretches'},
  {id: 'b3-motors', a: T('with twenty-six'), b: T('face ways') + 0.3, C: D_.B3Motors, tr: 'cut', what: 'The skin turns translucent; motors switch on by group as brows, smile and lips move'},
  {id: 'b5-side', a: T('face ways') + 0.3, b: K.combos, C: D_.B5Side, tr: 'cut-action', what: 'From the side: a motor turns and a linkage pushes the lips forward', cont: 'the rounding continues across the cut'},
  {id: 'b6-combos', a: K.combos, b: T('create the'), C: A.MechCombos, tr: 'cut', what: 'Sliders jump to untried combinations; the face makes shapes nobody asked for'},
  {id: 'b7-shapes', a: T('create the'), b: K.banana, C: D_.B7Shapes, tr: 'cut', what: 'The sections close, the skin is whole, and it makes four distinct expressions'},
  // ---- mouths
  {id: 'u1-banana', a: K.banana, b: K.yourLips, C: A.BananaHuman, tr: 'cut', what: 'The visitor\u2019s mouth says the narrated \u201cbanana\u201d (syllables timed to the take)'},
  {id: 'u2-moves', a: K.yourLips, b: K.imagine, C: A.LipsMoves, tr: 'cut', what: 'His face: together / open / stretch / toward, each marked as named'},
  {id: 'u3-try', a: K.imagine, b: K.jaw, C: A.RobotTry, tr: 'match', what: 'Robot mouth where his was: corners open into sections, motors miss the target shape', cont: 'mouth position and width matched across the cut'},
  {id: 'u4-jaw', a: K.jaw, b: K.puppet, C: A.JawFlap, tr: 'cut', what: 'Speaker box cabled to the robot: the jaw flaps with loudness only (labelled)'},
  {id: 'u5-puppet', a: K.puppet, b: T('puppet.') + 0.1, C: A.PuppetPair, tr: 'cut-action', what: 'A sock puppet rises beside the robot, flapping in sync', cont: 'jaw flap continues across the cut'},
  {id: 'u5b-look', a: T('puppet.') + 0.1, b: K.follow, C: D_.U5Look, tr: 'cut', what: 'His deadpan look at the pair'},
  {id: 'u6-follow', a: K.follow, b: K.practiced, C: A.FollowSpeech, tr: 'cut', what: 'Robot mouth follows a slowed speech sample under its playhead'},
  // ---- mirror practice
  {id: 'p1-turn', a: K.practiced, b: T('It moved its face'), C: A.PracWide, tr: 'cut', what: 'The lab with the mirror: it turns to its reflection'},
  {id: 'p2-refl', a: T('It moved its face'), b: T('building a relationship'), C: D_.P2Refl, tr: 'cut', what: 'The reflection, close: a trial, its motors showing through the skin'},
  {id: 'p3-montage', a: T('building a relationship'), b: K.moveThese, C: D_.P3Montage, tr: 'cut', what: 'A run of trials: each face it makes is captured with the commands that made it'},
  {id: 'p4-lips', a: K.moveThese, b: K.change, C: D_.P4Lips, tr: 'cut', what: 'The reflected mouth, very close: these motors, this mouth shape'},
  {id: 'p5-into', a: K.change, b: K.skin, C: D_.P5Into, tr: 'cut', what: 'A new combination; then the camera goes into the reflection\u2019s cheek until the skin fills the frame'},
  // ---- skin
  {id: 's1-section', a: K.skin, b: K.pull, C: A.SkinPlate, tr: 'match', what: 'That skin in section beside a rigid link; the link turns and moves nothing else', cont: 'skin fills the frame on both sides of the cut'},
  {id: 's2-pull', a: K.pull, b: K.controller, C: A.SkinPull, tr: 'cut', what: 'Closer: one anchor is pulled; the band, the material and the lip move'},
  {id: 's3-face', a: K.controller, b: K.once, C: A.SkinFace, tr: 'cut', what: 'The face, oblique: the pull releases, a smile forms from the same skin'},
  // ---- learning from people
  {id: 't1-turn', a: K.once, b: T('researchers gave'), C: B.TurnAway, tr: 'cut', what: 'At the mirror: it turns away from its reflection'},
  {id: 't2-alcove', a: T('researchers gave'), b: K.people, C: B.AlcoveWide, tr: 'cut', what: 'Its gaze lands in the recording alcove; the monitor comes on'},
  {id: 't3-people', a: K.people, b: K.study26, C: D_.T3People, tr: 'cut', what: 'People: two cast members talking, one after the other'},
  {id: 't4-into', a: K.study26, b: D_.T4_IN, C: B.T4Into, tr: 'cut', what: 'Over the robot\u2019s shoulder the camera goes into the screen'},
  {id: 't4-full', a: D_.T4_IN, b: T('the system learned'), C: D_.T4Full, tr: 'match', what: 'The screen\u2019s scene becomes the frame: a person speaking close to the camera', cont: 'the screen content is the same scene, framed identically'},
  {id: 't5-profile', a: T('the system learned'), b: T('videos of humans'), C: D_.T5Profile, tr: 'cut', what: 'Another person in profile on a street, lips moving'},
  {id: 't6-talk', a: T('videos of humans'), b: T('singing,'), C: D_.T6Talk, tr: 'cut', what: 'Another, talking in a kitchen'},
  {id: 't8-sing', a: T('singing,'), b: K.youtube, C: D_.T8Sing, tr: 'cut', what: 'Someone singing on a small stage'},
  {id: 't9-hours', a: K.youtube, b: K.important, C: B.HoursWatch, tr: 'cut', what: 'The robot watching; the screen runs on through hours of video'},
  {id: 't10-one', a: K.important, b: K.linked, C: B.OneExample, tr: 'cut', what: 'One training example: a mouth and its sound trace, linked'},
  {id: 't11-human', a: K.linked, b: T('robot’s model'), C: D_.T11Human, tr: 'cut', what: 'A person\u2019s lips, very close, saying that example'},
  {id: 't12-robot', a: T('robot’s model'), b: K.speechAudio, C: D_.T12Robot, tr: 'match', what: 'The robot\u2019s lips in the same place, making the same shapes', cont: 'mouth position matched'},
  {id: 'e1-path', a: K.speechAudio, b: T('through the motors.'), C: D_.E1Path, tr: 'cut', what: 'One move along the signal: speaker -> trace -> the learned map lights the matching shape -> cable -> motors -> lips'},
  {id: 'e2-robot', a: T('through the motors.'), b: K.result, C: D_.E2Robot, tr: 'cut', what: 'The robot, its lips moving with that speech'},
  // ---- the result, the distinction, the flaws, the late smile, the 2024 study (V2 first pass)
  {id: 'r1-speech', a: K.result, b: K.song, C: B.ResultSpeech, tr: 'cut', what: 'Speaker box plays speech; the lips follow (silent illustration)'},
  {id: 'r2-song', a: K.song, b: K.languages, C: B.ResultSong, tr: 'cut', what: 'Profile: sung vowels, held'},
  {id: 'r3-lang', a: K.languages, b: K.meaning, C: B.ResultLang, tr: 'cut', what: 'Front: a recording in an untrained language, lips still following'},
  {id: 'r4-puzzled', a: K.meaning, b: K.distinction, C: D_.R4Puzzled, tr: 'cut', what: 'Face to face: its lips keep time with a language neither of them speaks; he plainly doesn\u2019t follow it'},
  {id: 'd1-profile', a: K.distinction, b: T('looking as though'), C: B.DistProfile, tr: 'cut', what: 'The interaction bench: the robot speaking (silent), the visitor listening'},
  {id: 'd2-mouth', a: T('looking as though'), b: T('and understanding'), C: B.DistMouth, tr: 'cut', what: 'Its mouth, close: looking like speaking'},
  {id: 'd3-listener', a: T('and understanding'), b: T('are different'), C: B.DistListener, tr: 'cut', what: 'The listener: understanding is his side of it'},
  {id: 'd4-ots', a: T('are different'), b: K.flaws, C: B.DistOTS, tr: 'cut', what: 'Over the robot\u2019s shoulder: movement / meaning'},
  {id: 'f1-mouth', a: K.flaws, b: T('The team reported'), C: B.FlawMouth, tr: 'cut', what: 'Its mouth still speaking, then stopping'},
  {id: 'f2-b', a: T('The team reported'), b: T('“W.”') - 0.12, C: B.FlawB, tr: 'cut', what: 'B: the person\u2019s lips close fully; the robot\u2019s leave a gap (large split)'},
  {id: 'f3-w', a: T('“W.”') - 0.12, b: K.small, C: B.FlawW, tr: 'cut', what: 'W: rounded and pushed forward; the robot under-rounds'},
  {id: 'f4-gap', a: K.small, b: T('when you’re watching'), C: B.FlawGap, tr: 'cut', what: 'The gap, very close, ringed'},
  {id: 'f5-notice', a: T('when you’re watching'), b: K.another, C: B.FlawNotice, tr: 'cut', what: 'The visitor\u2019s eyes narrow on it'},
  {id: 'l1-two', a: K.another, b: K.when, C: C.LateTwo, tr: 'cut', what: 'Back at the interaction bench'},
  {id: 'l2-rob', a: K.when, b: K.news, C: C.LateRob, tr: 'cut', what: 'The robot, waiting'},
  {id: 'l3-news', a: K.news, b: K.stare, C: C.LateNews, tr: 'cut', what: 'He tells good news, a letter in hand (silent)'},
  {id: 'l4-stare', a: K.stare, b: K.finish, C: C.LateStare, tr: 'cut', what: 'The robot stares; slow push'},
  {id: 'l5-finish', a: K.finish, b: K.switchOn, C: C.LateFinish, tr: 'cut', what: 'His smile completes; the letter lowers'},
  {id: 'l6-switch', a: K.switchOn, b: K.awkward, C: C.LateSwitch, tr: 'cut', what: 'The robot\u2019s smile switches on, late and fast'},
  {id: 'l7-compare', a: K.awkward, b: K.study24, C: C.LateCompare, tr: 'cut', what: 'Compact comparison: both faces, both smile curves, the gap'},
  {id: 'y1-study', a: K.study24, b: K.watched, C: C.StudyWide, tr: 'cut', what: 'Study set: robot facing a monitor that plays a face; push toward the screen'},
  {id: 'y2-screen', a: K.watched, b: T('and learned to'), C: C.StudyScreen, tr: 'cut', what: 'Screen insert: the face'},
  {id: 'y3-cue', a: T('and learned to'), b: K.oneModel, C: C.StudyCue, tr: 'cut', what: 'Corners and cheeks marked; the small changes begin'},
  {id: 'y4-lens', a: K.oneModel, b: T('human expression.'), C: C.StudyLens, tr: 'cut', what: 'The robot\u2019s eye camera'},
  {id: 'y5-predict', a: T('human expression.'), b: K.another2, C: C.StudyPredict, tr: 'cut', what: 'The predicted smile, dashed, over the mouth'},
  {id: 'y6-motor', a: K.another2, b: K.ms840, C: C.StudyMotor, tr: 'cut', what: 'The corner motor carries out the translated movement'},
  {id: 'y7-timing', a: K.ms840, b: T('allowing the robot'), C: C.StudyTiming, tr: 'cut', what: 'Two faces large, a small schematic track: robot starts 0.84 s before the smile is visible'},
  {id: 'y8-together', a: T('allowing the robot'), b: K.less, C: C.StudyTogether, tr: 'cut', what: 'Study set: both smiling together'},
  {id: 'y9-less', a: K.less, b: K.enough, C: C.StudyLess, tr: 'cut', what: 'The comparison again: less than a second'},
  // ---- the final minute
  {id: 'g1-his', a: K.enough, b: T('copy into'), C: D_.G1Mouth, tr: 'cut', what: 'His smile, very close'},
  {id: 'g2-its', a: T('copy into'), b: T('shared-looking'), C: D_.G2Mouth, tr: 'match', what: 'Its smile in the same place in the frame', cont: 'mouth position matched; identity changes, no morph'},
  {id: 'g3-pair', a: T('shared-looking'), b: K.these, C: D_.G3Pair, tr: 'cut', what: 'Face to face: a shared-looking moment'},
  {id: 'g4-motor', a: K.these, b: T('A successful'), C: C.TogetherMotor, tr: 'cut', what: 'The smile from the side, its corner motor working: facial movement'},
  {id: 'g5-under', a: T('A successful'), b: K.picture, C: D_.G5Under, tr: 'cut', what: 'The smile; the camera draws back as the motors under it show through'},
  {id: 'h1-station', a: K.picture, b: K.speaking, C: D_.H1Station, tr: 'cut', what: 'An imagined concourse where such faces are ordinary: kiosk heads talking with passers-by'},
  {id: 'h2-speak', a: K.speaking, b: T('A machine looks'), C: D_.H2Speak, tr: 'cut', what: 'At home: he speaks'},
  {id: 'h3-look', a: T('A machine looks'), b: T('Its mouth follows'), C: D_.H3Look, tr: 'cut-action', what: 'The companion head lifts its gaze to him'},
  {id: 'h4-lips', a: T('Its mouth follows'), b: T('and its expression'), C: D_.H4Lips, tr: 'cut', what: 'Its eyes, then its lips, very close, following its own voice'},
  {id: 'h5-his', a: T('and its expression'), b: T('as yours does.'), C: D_.H5His, tr: 'cut', what: 'His smile'},
  {id: 'h6-its', a: T('as yours does.'), b: K.tutor, C: D_.H6Its, tr: 'cut', what: 'Its smile, the same size in the frame'},
  {id: 'n6-tutor', a: K.tutor, b: T('or a robotic'), C: C.UseTutor, tr: 'cut', what: 'A tutor: a hand turns the workbook page; the head watches across the table'},
  {id: 'n7-desk', a: T('or a robotic'), b: K.question, C: C.UseDesk, tr: 'cut', what: 'An assistant at a help desk: it turns to him, smiles, looks toward the door'},
  {id: 'h8-read', a: K.question, b: T('meaning we attach'), C: D_.H8Read, tr: 'cut', what: 'He leans in to read a humanoid assistant\u2019s face'},
  {id: 'h9-timed', a: T('meaning we attach'), b: K.again, C: D_.H9Timed, tr: 'cut', what: 'Its well-timed smile; one push in to the opening\u2019s framing'},
  // ---- the ending (loops to frame 0)
  {id: 'z1-smile', a: K.again, b: K.learned, C: D_.Z1Smile, tr: 'match', what: 'The research head, to the camera, in the opening\u2019s framing: its smile forms', cont: 'face framing matched from the humanoid'},
  {id: 'z2-him', a: K.learned, b: K.deciding, C: D_.Z2Him, tr: 'cut', what: 'The person it smiled with'},
  {id: 'z3-loop', a: K.deciding, b: END + 1, C: D_.Z3Loop, tr: 'cut', what: 'Back to it, looking at us: the smile softens, the brows lift, its lips part into frame 0\u2019s shape as the camera arrives at frame 0\u2019s framing'},
];
export const shotAt2 = (f: number) => {
  const t = f / FPS;
  return SHOTS2.find((s) => t >= s.a && t < s.b) ?? SHOTS2[SHOTS2.length - 1];
};
export const Frame2: React.FC<{f: number}> = ({f}) => {
  const S = shotAt2(f);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <S.C f={f} />
    </svg>
  );
};
export const Film2: React.FC<{audio?: string | false}> = ({audio = 'mix_v2'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#1E242B'}}>
      <Frame2 f={f} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Still2: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{backgroundColor: '#1E242B'}}>
    <Frame2 f={Math.round(t * FPS)} />
  </AbsoluteFill>
);
export const Sheet2: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % cols) * (W / cols), top: Math.floor(i / cols) * (H / cols), width: W, height: H, transform: `scale(${1 / cols})`, transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame2 f={Math.round(t * FPS)} />
        <div style={{position: 'absolute', left: 20, top: 16, fontFamily: 'Nunito Variable', fontWeight: 800, fontSize: 64, color: '#FFE36A', textShadow: '0 0 8px #000'}}>{t.toFixed(2)}</div>
      </div>
    ))}
  </AbsoluteFill>
);
/** dev: the middle frame of every shot, 16 per page (page p), labelled with the shot id */
export const ShotSheet: React.FC<{page: number; at?: number}> = ({page, at = 0.5}) => {
  const ss = SHOTS2.slice(page * 16, page * 16 + 16);
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {ss.map((s, i) => {
        const t = s.a + (Math.min(s.b, END) - s.a) * at;
        return (
          <div key={i} style={{position: 'absolute', left: (i % 4) * (W / 4), top: Math.floor(i / 4) * (H / 4), width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
            <Frame2 f={Math.round(t * FPS)} />
            <div style={{position: 'absolute', left: 20, top: 16, fontFamily: 'Nunito Variable', fontWeight: 800, fontSize: 64, color: '#FFE36A', textShadow: '0 0 8px #000'}}>{`${s.id} ${t.toFixed(1)}`}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
