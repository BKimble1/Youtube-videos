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

export type Tr = 'start' | 'cut' | 'cut-action' | 'match' | 'occlusion' | 'continuous';
export type Shot2 = {id: string; a: number; b: number; C: React.FC<{f: number}>; tr: Tr; what: string; cont?: string};
export const SHOTS2: Shot2[] = [
  {id: 'o1-two', a: 0, b: T('smile before'), C: O.OpenTwo, tr: 'start', what: 'Lab two-shot: the visitor’s cue is already forming; the robot watches him'},
  {id: 'o2-viscu', a: T('smile before'), b: T('Then it tries'), C: O.OpenVisCU, tr: 'cut-action', what: 'Visitor close-up: the cue grows (corners, cheeks) but the smile is not complete', cont: 'same exchange phase across the cut'},
  {id: 'o3-robcu', a: T('Then it tries'), b: T('same time'), C: O.OpenRobCU, tr: 'cut', what: 'Robot close-up: its smile begins and develops', cont: 'robot state continuous; gaze screen-right toward him'},
  {id: 'o4-profile', a: T('same time'), b: K.corner, C: O.OpenProfile, tr: 'cut', what: 'Profile two-shot: both smiles arrive together', cont: 'both states continuous'},
  {id: 'o5-cheek', a: K.corner, b: T('Researchers'), C: O.OpenCheek, tr: 'cut', what: 'Robot close-up, the near corner opens into a local section: servo -> rod -> corner as the smile relaxes and lifts'},
  {id: 'm1-truck', a: T('Researchers'), b: T('copy human'), C: O.MirTruck, tr: 'cut', what: 'Behind the robot: the mirror frame slides past (parallax) and reveals the reflection; a lopsided test movement'},
  {id: 'm2-refl', a: T('copy human'), b: T('And the place'), C: O.MirReflCU, tr: 'cut', what: 'Reflection close-up: lips open/round on “copy human lips”, corners rise on “predict”', cont: 'one rig state; reflection drawn mirrored'},
  {id: 'm3-wide', a: T('And the place'), b: K.columbia, C: O.MirWide, tr: 'cut', what: 'The whole setup: mirror on its stand, bench, robot, room'},
  {id: 'k1-profile', a: K.columbia, b: T('with twenty-six'), C: A.MechProfile, tr: 'cut', what: 'The head on its bench, three-quarter profile; the face flexes on \u201cflexible\u201d'},
  {id: 'k2-motors', a: T('with twenty-six'), b: K.combos, C: A.MechMotors, tr: 'cut', what: 'Lower face, both corners opened into sections: servos turn, rods pull, lips move; brows, smile, rounding'},
  {id: 'k3-combos', a: K.combos, b: K.banana, C: A.MechCombos, tr: 'cut', what: 'Sliders jump to untried combinations; the face makes shapes nobody asked for'},
  {id: 'u1-banana', a: K.banana, b: K.yourLips, C: A.BananaHuman, tr: 'cut', what: 'The visitor\u2019s mouth says the narrated \u201cbanana\u201d (syllables timed to the take)'},
  {id: 'u2-moves', a: K.yourLips, b: K.imagine, C: A.LipsMoves, tr: 'cut', what: 'Three-quarter mouth: together / open / stretch / toward, each marked as named', cont: 'same mouth track continues'},
  {id: 'u3-try', a: K.imagine, b: K.jaw, C: A.RobotTry, tr: 'match', what: 'Robot mouth at the same screen position and width as his: corners open into sections, motors miss the target shape in the inset', cont: 'mouth position and width matched across the human-to-robot cut (identity changes, no morph)'},
  {id: 'u4-jaw', a: K.jaw, b: K.puppet, C: A.JawFlap, tr: 'cut', what: 'Speaker box cabled to the robot: the jaw flaps with loudness only (labelled)'},
  {id: 'u5-puppet', a: K.puppet, b: K.follow, C: A.PuppetPair, tr: 'cut-action', what: 'A sock puppet rises beside the robot, flapping in sync', cont: 'jaw flap continues across the cut'},
  {id: 'u6-follow', a: K.follow, b: K.practiced, C: A.FollowSpeech, tr: 'cut', what: 'Robot mouth follows a slowed speech sample under its playhead'},
  {id: 'p1-wide', a: K.practiced, b: T('It moved its face'), C: A.PracWide, tr: 'cut', what: 'Back at the mirror; a laptop on the bench is recording'},
  {id: 'p2-refl', a: T('It moved its face'), b: T('building a relationship'), C: A.PracRefl, tr: 'cut', what: 'Reflection close: trial 1 (open, lopsided)'},
  {id: 'p3-laptop', a: T('building a relationship'), b: K.moveThese, C: A.PracLaptop, tr: 'cut', what: 'The laptop: live camera view, command bars, the record of pairs growing'},
  {id: 'p4-lips', a: K.moveThese, b: K.change, C: A.PracLips, tr: 'cut', what: 'Reflected mouth, very close: these motors -> this mouth shape (trial 2, wide smile)'},
  {id: 'p5-shared', a: K.change, b: K.skin, C: A.PracShared, tr: 'cut', what: 'Shared mirror view: new combination, rounded lips; the record gains a row (trial 3)'},
  {id: 's1-section', a: K.skin, b: K.pull, C: A.SkinPlate, tr: 'cut', what: 'Skin in section: flexible band beside a rigid link; the link turns and moves nothing else'},
  {id: 's2-pull', a: K.pull, b: K.controller, C: A.SkinPull, tr: 'cut', what: 'Closer on the section: one anchor is pulled; the band, the material inside it and the lip at its end all move'},
  {id: 's3-face', a: K.controller, b: K.once, C: A.SkinFace, tr: 'cut', what: 'The face, oblique: the corner pull releases, a smile forms from the same skin'},
  {id: 't1-turn', a: K.once, b: T('researchers gave'), C: B.TurnAway, tr: 'cut', what: 'At the mirror: it turns away from its reflection', cont: 'reflection shares the turn'},
  {id: 't2-alcove', a: T('researchers gave'), b: K.people, C: B.AlcoveWide, tr: 'cut', what: 'Recording alcove (setting B): robot at the desk; the monitor comes on'},
  {id: 't3-people', a: K.people, b: K.study26, C: B.ScreenPeople, tr: 'cut', what: 'Screen insert: a person talking'},
  {id: 't4-ots', a: K.study26, b: T('the system learned'), C: B.AlcoveOTS, tr: 'cut', what: 'Over the robot\u2019s shoulder to the screen; study tag'},
  {id: 't5-grid', a: T('the system learned'), b: K.youtube, C: B.GridInsert, tr: 'cut', what: 'Screen fills with talking and singing mouths'},
  {id: 't6-hours', a: K.youtube, b: K.important, C: B.HoursWatch, tr: 'cut', what: 'The robot watching; the screen runs on through hours of video'},
  {id: 't7-one', a: K.important, b: K.linked, C: B.OneExample, tr: 'cut', what: 'One example: a mouth and its sound trace, linked'},
  {id: 't8-linked', a: K.linked, b: K.speechAudio, C: B.Linked, tr: 'cut', what: 'Same mouth beside the robot\u2019s own recorded image with the matching shape', cont: 'same sample, same phase'},
  {id: 't9-drive', a: K.speechAudio, b: K.result, C: B.Drive, tr: 'cut', what: 'The same sound drives the corner motors; the robot\u2019s lips follow it', cont: 'same sample, same phase'},
  {id: 'r1-speech', a: K.result, b: K.song, C: B.ResultSpeech, tr: 'cut', what: 'Speaker box plays speech; the lips follow (silent illustration)'},
  {id: 'r2-song', a: K.song, b: K.languages, C: B.ResultSong, tr: 'cut', what: 'Profile: sung vowels, held'},
  {id: 'r3-lang', a: K.languages, b: K.meaning, C: B.ResultLang, tr: 'cut', what: 'Front: a recording in an untrained language, lips still following'},
  {id: 'r4-path', a: K.meaning, b: K.distinction, C: B.SignalPath, tr: 'cut', what: 'Sound -> motors -> lips; the meaning slot stays empty'},
  {id: 'd1-profile', a: K.distinction, b: T('looking as though'), C: B.DistProfile, tr: 'cut', what: 'Profile two-shot: the robot speaking (silent), the visitor listening'},
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
  {id: 'g1-two', a: K.enough, b: K.these, C: C.TogetherTwo, tr: 'cut', what: 'Lab two-shot: a shared-looking smile'},
  {id: 'g2-motor', a: K.these, b: T('A successful'), C: C.TogetherMotor, tr: 'cut', what: 'The smile from the side, its corner motor working: facial movement'},
  {id: 'g3-ots', a: T('A successful'), b: K.picture, C: C.TogetherOTS, tr: 'cut', what: 'Over the robot\u2019s cabled shoulder: his smile facing us'},
  {id: 'n1-nook', a: K.picture, b: K.speaking, C: C.UseWide, tr: 'cut', what: 'Study nook (setting C): Possible use'},
  {id: 'n2-speak', a: K.speaking, b: T('A machine looks'), C: C.UseSpeak, tr: 'cut', what: 'He speaks'},
  {id: 'n3-look', a: T('A machine looks'), b: T('Its mouth follows'), C: C.UseLook, tr: 'cut-action', what: 'It lifts its gaze from the book to him'},
  {id: 'n4-voice', a: T('Its mouth follows'), b: T('and its expression'), C: C.UseVoice, tr: 'cut', what: 'It speaks (silent); its own voice as a trace'},
  {id: 'n5-together', a: T('and its expression'), b: K.tutor, C: C.UseTogether, tr: 'cut', what: 'Two-shot: smiles together'},
  {id: 'n6-tutor', a: K.tutor, b: T('or a robotic'), C: C.UseTutor, tr: 'cut', what: 'Workbook: his hand turns the page; the robot watches across the table'},
  {id: 'n7-desk', a: T('or a robotic'), b: K.question, C: C.UseDesk, tr: 'cut', what: 'Help desk: the robot turns to him, smiles, looks toward the door'},
  {id: 'n8-thought', a: K.question, b: T('meaning we attach'), C: C.UseThought, tr: 'cut', what: 'He considers it'},
  {id: 'n9-robot', a: T('meaning we attach'), b: C.CLOSE_IN, C: C.UseRobot, tr: 'cut', what: 'The robot\u2019s small smile'},
  {id: 'n10-close', a: C.CLOSE_IN, b: C.CLOSE_CUT, C: C.UseClose, tr: 'cut-action', what: 'Insert: his hand closes the notebook'},
  {id: 'n11-nooktwo', a: C.CLOSE_CUT, b: K.again, C: C.UseCloseTwo, tr: 'cut', what: 'The nook two-shot framed exactly like the opening: closed notebook, robot, visitor', cont: 'framing identical to the lab callback'},
  {id: 'c1-two', a: K.again, b: K.learned, C: O.CbTwo, tr: 'match', what: 'The opening two-shot in the lab again (same camera): the cue rises', cont: 'composition match from the nook: robot, visitor and notebook on the same screen positions'},
  {id: 'c2-robcu', a: K.learned, b: K.deciding, C: O.CbRobCU, tr: 'cut', what: 'Robot close-up: its smile forms'},
  {id: 'c3-viscu', a: K.deciding, b: END + 1, C: O.CbVisCU, tr: 'cut', what: 'Visitor close-up: the warm smile settles into a knowing one; end'},
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
