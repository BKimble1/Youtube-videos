// V2 film: the ordered shot list on the measured timeline (6400 frames, the V2 narration master). Each shot names
// its transition into it; production/V2_TRANSITIONS.md is generated from this table (tools/v2_transitions.ts).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, H, W} from '../lib/core';
import {K} from '../state';
import {T} from '../lib/core';
import {END, EXPR_COPY} from './state2';
import * as O from './shots2';
import * as A from './shotsA';
import * as B from './shotsB';
import * as C from './shotsC';
import * as D from './shotsD';
import * as E from './shotsE';
import * as F from './shotsF';
import * as G from './shotsG';

export type Tr = 'start' | 'cut' | 'cut-action' | 'match' | 'occlusion' | 'continuous';
export type Shot2 = {id: string; a: number; b: number; C: React.FC<{f: number}>; tr: Tr; what: string; cont?: string};
const D_ = D;
export const SHOTS2: Shot2[] = [
  // ---- opening
  {id: 'v1-face', a: 0, b: T('Then it tries'), C: G.G1FaceOff, tr: 'start', what: 'Frame 0: face to face, inches apart, on a demonstration stage; he pulls a shocked face, a glare, a huge grin, and it gives each back a beat later (brows, lids, jaw, lips); the camera travels between the faces; he is amazed; a smile starts and it watches his mouth'},
  {id: 'v2-reveal', a: T('Then it tries'), b: T('same time'), C: E.V2Reveal, tr: 'cut-action', what: 'Close on its mouth as the smile begins: the silicone clears over the corner motor; the horn turns, the rod pulls, the skin moves, the smile forms; the clearing closes'},
  {id: 'v3-pair', a: T('same time'), b: K.corner, C: G.G3StagePair, tr: 'cut', what: 'The stage, side on: he leans in; the two smiles land together; he is delighted'},
  {id: 'v4-crowd', a: K.corner, b: T('Researchers'), C: G.G4Crowd, tr: 'cut', what: 'One pull back: the stage, the LED wall and the people watching; it makes a whole-face expression for them; one films it, two turn to each other, one raises both hands'},
  {id: 'a9-truck', a: T('Researchers'), b: K.mirrorCut, C: O.MirTruck, tr: 'cut', what: 'Across the lab: the mirror frame slides past and reveals the reflection'},
  {id: 'a10-tests', a: K.mirrorCut, b: T('copy human'), C: D_.A10Tests, tr: 'cut', what: 'The reflection: four different test expressions, the motors faintly visible'},
  {id: 'a11-lips', a: T('copy human'), b: T('copy human') + 0.62, C: D_.A11Lips, tr: 'cut', what: 'A person\u2019s lips, very close'},
  {id: 'a12-copy', a: T('copy human') + 0.62, b: T('predict an') + 0.05, C: D_.A12Copy, tr: 'match', what: 'The robot\u2019s lips (in the mirror) make the same shapes in the same place in the frame', cont: 'mouth position and size matched; identity changes, no morph'},
  {id: 'a13-predict', a: T('predict an') + 0.05, b: T('And the place'), C: D_.A13Predict, tr: 'cut', what: 'Face to face: his cue starts; its smile starts before his is plain'},
  {id: 'a14-mirror', a: T('And the place'), b: K.columbia, C: D_.A14Mirror, tr: 'cut', what: 'Back out of the reflection to the whole mirror setup'},
  // ---- mechanism
  {id: 'b1-orbit', a: K.columbia, b: T('flexible'), C: G.W1Build, tr: 'cut', what: 'The workshop where it is built: silicone still translucent over the frame; one engineer works in the cheek with a driver, the other checks the motors on a laptop and looks up; the camera tracks along the bench; Columbia tag'},
  {id: 'b2-flex', a: T('flexible'), b: F.MUSCLE_A, C: G.W2Flex, tr: 'cut', what: 'Closer: her fingertip presses its cheek and the silicone gives around it; she lets go, the skin clears, and the motors come on group by group as it tries brows, smile and lips'},
  {id: 'b4-muscle', a: F.MUSCLE_A, b: F.MUSCLE_B, C: F.H1Muscle, tr: 'cut', what: 'His face, close: as he smiles the cheek clears over the muscle doing it; it shortens and pulls the corner up and out'},
  {id: 'b5-actuator', a: T('face ways') + 0.3, b: K.combos, C: E.M1Actuator, tr: 'cut-action', what: 'Match cut from his mouth corner to the robot\u2019s: only the corner motor shows, its horn, rod and corner moving as one', cont: 'mouth corner in the same place across the cut'},
  {id: 'b6-combos', a: K.combos, b: T('create the'), C: G.W6Combos, tr: 'cut', what: 'The workshop, wide: one engineer runs the slider board; each combination pulls a face nobody asked for; the other laughs, then winces'},
  {id: 'b7-shapes', a: T('create the'), b: K.banana, C: F.B7Split, tr: 'cut', what: 'Split view of one moment: the whole face (left) and its side section (right); the linkages push and pull the lips into four distinct expressions'},
  // ---- mouths
  {id: 'u1-banana', a: K.banana, b: K.yourLips, C: A.BananaHuman, tr: 'cut', what: 'The visitor\u2019s mouth says the narrated \u201cbanana\u201d (syllables timed to the take)'},
  {id: 'u2-moves', a: K.yourLips, b: K.imagine, C: A.LipsMoves, tr: 'cut', what: 'His face: together / open / stretch / toward, each marked as named'},
  {id: 'u3-try', a: K.imagine, b: K.jaw, C: G.T3Try, tr: 'cut', what: 'The test bay: a researcher turns console knobs one at a time; the camera moves to the head on its stand; its skin clears over the lip motors; each turn moves them; the mouth misses the target shape', cont: 'mouth position and width matched across the cut'},
  {id: 'u4-jaw', a: K.jaw, b: K.puppet, C: G.T4Jaw, tr: 'cut', what: 'The test bay: she slides one fader up; a speaker on a cart plays speech; the jaw opens with every loud moment and nothing else'},
  {id: 'u5-puppet', a: K.puppet, b: T('puppet.') + 0.1, C: G.T5Puppet, tr: 'cut-action', what: 'A sock puppet rises beside the robot, flapping in sync', cont: 'jaw flap continues across the cut'},
  {id: 'u5b-look', a: T('puppet.') + 0.1, b: K.follow, C: G.T5Look, tr: 'cut', what: 'The researcher\u2019s deadpan look at the pair'},
  {id: 'u6-follow', a: K.follow, b: K.practiced, C: G.T6Follow, tr: 'cut', what: 'She leans to the desk microphone and says the word slowly; facing her, its lips follow her sound; the camera moves from her to it'},
  // ---- mirror practice
  {id: 'p1-turn', a: K.practiced, b: T('It moved its face'), C: A.PracWide, tr: 'cut', what: 'The lab with the mirror: it turns to its reflection'},
  {id: 'p2-refl', a: T('It moved its face'), b: T('building a relationship'), C: D_.P2Refl, tr: 'cut', what: 'The reflection, close: a trial, its motors showing through the skin'},
  {id: 'p3-montage', a: T('building a relationship'), b: K.moveThese, C: D_.P3Montage, tr: 'cut', what: 'A run of trials: each face it makes is captured with the commands that made it'},
  {id: 'p4-lips', a: K.moveThese, b: K.change, C: D_.P4Lips, tr: 'cut', what: 'The reflected mouth, very close: these motors, this mouth shape'},
  {id: 'p5-into', a: K.change, b: K.skin, C: D_.P5Into, tr: 'cut', what: 'A new combination; then the camera goes into the reflection\u2019s cheek until the skin fills the frame'},
  // ---- skin
  {id: 's1-skin', a: K.skin, b: K.pull, C: G.S1Material, tr: 'match', what: 'The workbench: she pulls a tab on a clamped silicone sheet and the whole area around it stretches; then she lifts a metal bracket and turns it: it moves as one piece', cont: 'skin fills the frame on both sides of the cut'},
  {id: 's2-pull', a: K.pull, b: K.controller, C: E.K2Pull, tr: 'cut', what: 'Close on the pulled point: the surface around it moves with it, the lip corner follows'},
  {id: 's3-face', a: K.controller, b: K.once, C: G.S3Controller, tr: 'cut', what: 'The face on the bench and, on the laptop beside it, the same face as the controller sees it; a smile forms on both at once; the engineer nods'},
  // ---- learning from people
  {id: 't1-turn', a: K.once, b: T('researchers gave'), C: G.L1BigLab, tr: 'cut', what: 'The robotics lab, wide: an arm stacking blocks, a rover crossing the floor, another head practising; ours turns away from its mirror'},
  {id: 't2-alcove', a: T('researchers gave'), b: K.people, C: B.AlcoveWide, tr: 'cut', what: 'Its gaze lands in the recording alcove; the monitor comes on'},
  {id: 't3-people', a: K.people, b: K.study26, C: D_.T3People, tr: 'cut', what: 'People: two cast members talking, one after the other'},
  {id: 't4-into', a: K.study26, b: D_.T4_IN, C: B.T4Into, tr: 'cut', what: 'Over the robot\u2019s shoulder the camera goes into the screen'},
  {id: 't4-full', a: D_.T4_IN, b: T('the system learned'), C: D_.T4Full, tr: 'match', what: 'The screen\u2019s scene becomes the frame: a person speaking close to the camera', cont: 'the screen content is the same scene, framed identically'},
  {id: 't5-profile', a: T('the system learned'), b: T('videos of humans'), C: D_.T5Profile, tr: 'cut', what: 'Another person in profile on a street, lips moving'},
  {id: 't6-talk', a: T('videos of humans'), b: T('singing,'), C: D_.T6Talk, tr: 'cut', what: 'Another, talking in a kitchen'},
  {id: 't8-sing', a: T('singing,'), b: K.youtube, C: D_.T8Sing, tr: 'cut', what: 'Someone singing on a small stage'},
  {id: 't9-hours', a: K.youtube, b: K.important, C: F.ScreenRoom, tr: 'cut', what: 'A dark room lit by a wall of screens: a different person speaking or singing on each, each changing clip on its own beat; it looks from face to face'},
  {id: 't10-one', a: K.important, b: K.linked, C: E.P2One, tr: 'cut', what: 'One person, one sample: the sound runs beneath them; the camera closes on the mouth'},
  {id: 't11-human', a: K.linked, b: T('robot’s model'), C: D_.T11Human, tr: 'cut', what: 'A person\u2019s lips, very close, saying that example'},
  {id: 't12-robot', a: T('robot’s model'), b: K.speechAudio, C: D_.T12Robot, tr: 'match', what: 'The robot\u2019s lips in the same place, making the same shapes', cont: 'mouth position matched'},
  {id: 'e1-path', a: K.speechAudio, b: T('through the motors.'), C: D_.E1Path, tr: 'cut', what: 'One move along the signal: speaker -> trace -> the learned map lights the matching shape -> cable -> motors -> lips'},
  {id: 'e2-robot', a: T('through the motors.'), b: K.result, C: D_.E2Robot, tr: 'cut', what: 'The robot, its lips moving with that speech'},
  // ---- the result, the distinction, the flaws, the late smile, the 2024 study (V2 first pass)
  {id: 'r1-speech', a: K.result, b: K.song, C: F.R1Compare, tr: 'cut', what: 'A dark testing room: two identical heads hear the same speech; the left only flaps its jaw with the loudness, late; the right makes the learned shapes on time; wide, then close on each mouth'},
  {id: 'r2-song', a: K.song, b: K.languages, C: B.ResultSong, tr: 'cut', what: 'Profile: sung vowels, held'},
  {id: 'r3-lang', a: K.languages, b: K.meaning, C: B.ResultLang, tr: 'cut', what: 'Front: a recording in an untrained language, lips still following'},
  {id: 'r4-puzzled', a: K.meaning, b: K.distinction, C: G.R4Studio, tr: 'cut', what: 'The studio: it keeps time with a recording in a language nobody there speaks; through the control-room glass the engineer listens, shrugs and smiles'},
  {id: 'd1-profile', a: K.distinction, b: T('looking as though'), C: G.D1Stage, tr: 'cut', what: 'Back at the demonstration: on stage it lip-syncs to a recording from the speaker beside it; the audience watches its mouth'},
  {id: 'd2-mouth', a: T('looking as though'), b: T('and understanding'), C: B.DistMouth, tr: 'cut', what: 'Its mouth, close: looking like speaking'},
  {id: 'd3-listener', a: T('and understanding'), b: T('are different'), C: G.D3Listener, tr: 'cut', what: 'In the audience, one of them listens to the words, head on one side, and frowns'},
  {id: 'd4-ots', a: T('are different'), b: K.flaws, C: G.D4Stage, tr: 'cut', what: 'Behind it on the stage, looking out over the audience'},
  {id: 'f1-mouth', a: K.flaws, b: T('The team reported'), C: B.FlawMouth, tr: 'cut', what: 'Its mouth still speaking, then stopping'},
  {id: 'f2-b', a: T('The team reported'), b: T('“W.”') - 0.12, C: B.FlawB, tr: 'cut', what: 'B: the person\u2019s lips close fully; the robot\u2019s leave a gap (large split)'},
  {id: 'f3-w', a: T('“W.”') - 0.12, b: K.small, C: B.FlawW, tr: 'cut', what: 'W: rounded and pushed forward; the robot under-rounds'},
  {id: 'f4-gap', a: K.small, b: T('when you’re watching'), C: B.FlawGap, tr: 'cut', what: 'The gap, very close, ringed'},
  {id: 'f5-notice', a: T('when you’re watching'), b: K.another, C: G.F5Squint, tr: 'cut', what: 'In the audience, someone leans in and narrows their eyes at its mouth'},
  {id: 'l1-two', a: K.another, b: K.when, C: F.L1Lobby, tr: 'cut', what: 'A hotel reception: he comes up to the counter and leans in to a robotic assistant; it turns to him in two stiff steps; he hesitates and eases back'},
  {id: 'l2-rob', a: K.when, b: K.news, C: F.L2Assist, tr: 'cut', what: 'The robot, waiting'},
  {id: 'l3-news', a: K.news, b: K.stare, C: C.LateNews, tr: 'cut', what: 'He tells good news, a letter in hand (silent)'},
  {id: 'l4-stare', a: K.stare, b: K.finish, C: F.L4Assist, tr: 'cut', what: 'The robot stares; slow push'},
  {id: 'l5-finish', a: K.finish, b: K.switchOn, C: C.LateFinish, tr: 'cut', what: 'His smile completes; the letter lowers'},
  {id: 'l6-switch', a: K.switchOn, b: K.awkward, C: F.L6Assist, tr: 'cut', what: 'The robot\u2019s smile switches on, late and fast'},
  {id: 'l7-compare', a: K.awkward, b: K.study24, C: F.L7Over, tr: 'cut', what: 'Over the assistant\u2019s shoulder: its late smile at the edge of frame; across the counter, his awkward reaction'},
  {id: 'y1-study', a: K.study24, b: K.watched, C: G.Y1Bay, tr: 'cut', what: 'The test bay set for the timing study: a participant across a small table from the head; the researcher at her console starts the session; 2024 tag'},
  {id: 'y2-screen', a: K.watched, b: T('and learned to'), C: C.StudyScreen, tr: 'cut', what: 'Screen insert: the face'},
  {id: 'y3-cue', a: T('and learned to'), b: K.oneModel, C: C.StudyCue, tr: 'cut', what: 'Corners and cheeks marked; the small changes begin'},
  {id: 'y4-lens', a: K.oneModel, b: T('human expression.'), C: C.StudyLens, tr: 'cut', what: 'The robot\u2019s eye camera'},
  {id: 'y5-predict', a: T('human expression.'), b: K.another2, C: C.StudyPredict, tr: 'cut', what: 'The predicted smile, dashed, over the mouth'},
  {id: 'y6-motor', a: K.another2, b: K.ms840, C: C.StudyMotor, tr: 'cut', what: 'The corner motor carries out the translated movement'},
  {id: 'y7-timing', a: K.ms840, b: T('allowing the robot'), C: G.Y7Face, tr: 'cut', what: 'Face to face, side on: on him as his smile begins; the camera moves to the robot, whose smile starts while his is still coming; it pulls back as both reach the full smile together'},
  {id: 'y8-together', a: T('allowing the robot'), b: K.less, C: G.Y8Bay, tr: 'cut', what: 'The bay again, wider: both smiling; the researcher smiles and nods'},
  {id: 'y9-less', a: K.less, b: K.enough, C: E.M2Actuator, tr: 'cut', what: 'The corner motor, very close, starting the smile'},
  // ---- the final minute
  {id: 'g1-his', a: K.enough, b: T('copy into'), C: D_.G1Mouth, tr: 'cut', what: 'His smile, very close'},
  {id: 'g2-its', a: T('copy into'), b: T('shared-looking'), C: D_.G2Mouth, tr: 'match', what: 'Its smile in the same place in the frame', cont: 'mouth position matched; identity changes, no morph'},
  {id: 'g3-pair', a: T('shared-looking'), b: K.these, C: F.G3Lobby, tr: 'cut', what: 'Back at the reception counter: this time its smile arrives with his, and he lights up, leaning in'},
  {id: 'g4-motor', a: K.these, b: T('A successful'), C: G.G4Review, tr: 'cut', what: 'From the smile, one pull back: stand, table, console, camera on its tripod, the control-room window: an experiment'},
  {id: 'g5-under', a: T('A successful'), b: K.picture, C: D_.G5Under, tr: 'cut', what: 'The smile; the camera draws back as the motors under it show through'},
  {id: 'h1-station', a: K.picture, b: K.speaking, C: D_.H1Station, tr: 'cut', what: 'An imagined concourse where such faces are ordinary: kiosk heads talking with passers-by'},
  {id: 'h2-call', a: K.speaking, b: T('Its mouth follows'), C: G.VC1Call, tr: 'cut', what: 'Possible future: at home on a video call; he talks to the laptop; on its screen the assistant lifts its eyes to him'},
  {id: 'h4-screen', a: T('Its mouth follows'), b: T('and its expression'), C: G.VC2Screen, tr: 'cut', what: 'The call full screen: the assistant answers, its lips following its own voice; his self-view in the corner'},
  {id: 'h5-gallery', a: T('and its expression'), b: K.tutor, C: G.VC3Gallery, tr: 'cut', what: 'The gallery view: him and the assistant side by side; he smiles and its smile arrives with his'},
  {id: 'n6-tutor', a: K.tutor, b: T('or a robotic'), C: C.UseTutor, tr: 'cut', what: 'A tutor: a hand turns the workbook page; the head watches across the table'},
  {id: 'n7-desk', a: T('or a robotic'), b: K.question, C: C.UseDesk, tr: 'cut', what: 'An assistant at a help desk: it turns to him, smiles, looks toward the door'},
  {id: 'h8-read', a: K.question, b: T('meaning we attach'), C: D_.H8Read, tr: 'cut', what: 'He leans in to read a humanoid assistant\u2019s face'},
  {id: 'h9-timed', a: T('meaning we attach'), b: K.again, C: D_.H9Timed, tr: 'cut', what: 'Its well-timed smile; one push in to the opening\u2019s framing'},
  // ---- the ending (loops to frame 0)
  {id: 'z1-smile', a: K.again, b: K.learned, C: G.Z1Stage, tr: 'cut', what: 'The finale on the stage, from the audience: the two face to face in the spotlight; his smile begins; the camera moves in'},
  {id: 'z2-him', a: K.learned, b: K.deciding, C: G.Z2Pair, tr: 'cut', what: 'Side on, close: its smile arrives with his; he leans in, delighted'},
  {id: 'z3-loop', a: K.deciding, b: END + 1, C: G.Z3Final, tr: 'cut', what: 'The face-off from the first frame, both smiling now; as the last words land the robot\u2019s eyes leave him and come to us'},
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
      <E.Grade f={f} />
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
