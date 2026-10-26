// V2 shots, part 3: training on people (alcove B), the result, the distinction and the flaws (77.15 - 132.32 s).
import React from 'react';
import {Head, EXPR_NEUTRAL} from '../dc/Head';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {Monitor, Shadow} from '../art/Lab';
import {Robot, RobotState, RobotSupport, ROBOT_NEUTRAL} from '../art/Robot';
import {Tag, UI, Wave} from '../art/Ui';
import {VX} from '../art/Visitor';
import {Cam, camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {humanVis, robotVis, Track, Vis} from '../lib/visemes';
import {MouthTile} from '../shots/Watch';
import {K, screenFaceAt, SONG, SPEECH} from '../state';
import {Counter} from './env';
import {Back, LabTwo, MirrorSet2, OverRobot, ProfileTwo, RobotCU, VisitorCU} from './sets';
import {CheekSection} from './mech';
import {Bracket, Panel, Plate, robotTrace, humanTrace, SpeakerBox} from './props';
import {FIRST_BA, rob2, SAMPLE, sampleT, vis2} from './state2';
import {drift, e2, e3, TWO_A} from './shots2';
import {CrewTalk, glide, T4_CAM0, T4_IN, T4_TRACK} from './shotsD';

const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
const CAM0: Cam = {x: 960, y: 540, z: 1};
const pulseK = (f: number, a: number, b: number) => pr(f, a, a + 0.25) * (1 - pr(f, b - 0.25, b));

// ------------------------------------------------------------------ the alcove (setting B)
export const AL = {robot: {x: 600, y: 440, s: 2.1}, deskY: 800, mon: {x: 1330, y: 470, w: 600, h: 380}};
const TONES = ['#F2C9A8', '#C98B5E', '#8D5A3B', '#E7B48F', '#5E3A25', '#F5D3B8'];
/** the person on the alcove monitor: a recorded speaker (the visitor's head), talking */
const ScreenPerson: React.FC<{id: string; x: number; y: number; w: number; h: number; f: number}> = ({id, x, y, w, h, f}) => {
  const e = screenFaceAt(f);
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#D9E4E6" />
      <rect x={x - w / 2} y={y + h * 0.18} width={w} height={h * 0.4} fill="#8FB3AD" />
      <Head id={id} c={{x: x + w * 0.02, y: y + h * 0.04}} R={h * 0.3} roll={0} turn={0.1} expr={e} inkW={5} />
    </g>
  );
};
/** six cropped mouths, talking and singing */
const MouthGrid: React.FC<{id: string; x: number; y: number; w: number; h: number; t: number; k?: number; hotTalk?: number; hotSing?: number}> = ({id, x, y, w, h, t, k = 1, hotTalk = 0, hotSing = 0}) => {
  const tw = (w - 40) / 3, th = (h - 30) / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#141B22" />
      {TONES.map((tone, i) => {
        const sing = i % 2 === 1;
        const tr = SPEECH(K.people, K.result, 3 + i * 5);
        const v = humanVis(sing ? t * 0.4 + i : t + i * 0.37, tr, 0.06);
        const op = sing ? 0.35 + 0.35 * Math.abs(Math.sin(t * 1.6 + i)) : v.open * 1.4;
        const ap = clamp((k * 6 - i) / 1.0);
        const hot = sing ? hotSing : hotTalk;
        return (
          <g key={i} opacity={ap}>
            <MouthTile id={`${id}-t${i}`} x={x + 10 + (i % 3) * (tw + 10)} y={y + 10 + Math.floor(i / 3) * (th + 10)} w={tw} h={th} tone={tone} open={op} wide={sing ? 0.75 : v.wide} />
            {hot > 0.01 && <rect x={x + 10 + (i % 3) * (tw + 10)} y={y + 10 + Math.floor(i / 3) * (th + 10)} width={tw} height={th} rx={8} fill="none" stroke={sing ? UI.amber : '#7CC7E8'} strokeWidth={8} opacity={hot} />}
          </g>
        );
      })}
    </g>
  );
};
const MicStand2: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <path d="M0,0 L0,-260 L-100,-330" fill="none" stroke="#2B333C" strokeWidth={10} strokeLinecap="round" />
    <ellipse cx={0} cy={4} rx={60} ry={12} fill="#2B333C" />
    <rect x={-138} y={-372} width={40} height={74} rx={20} fill="#59627E" stroke={INK} strokeWidth={3} transform="rotate(-30 -118 -335)" />
  </g>
);
const Lamp2: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <ellipse cx={0} cy={0} rx={56} ry={13} fill="#2B333C" stroke={INK} strokeWidth={2.5} />
    <path d="M0,0 L-26,-150 L56,-236" fill="none" stroke="#2B333C" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M36,-256 L104,-236 L86,-178 L28,-206 Z" fill="#E6B85C" stroke={INK} strokeWidth={3} />
  </g>
);
/** setting B: the robot on its support at the desk, facing a monitor; mic and lamp; acoustic wall behind */
export const AlcoveSet: React.FC<{id: string; cam: Cam; st: RobotState; f: number; screen?: React.ReactNode; monOn?: number; veil?: number}> = ({id, cam, st, f, screen, monOn = 1, veil = 0}) => {
  const post = (AL.deskY + 36 - AL.robot.y) / AL.robot.s - 206;
  return (
    <g>
      <Layer cam={cam} depth={2.0}>
        <Back id={`${id}-bk`} bg="alcove" veil={veil} dx={0} dy={120} />
      </Layer>
      <Layer cam={cam} depth={1.15}>
        <Lamp2 x={1820} y={AL.deskY - 10} s={1.2} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Counter id={`${id}-desk`} x0={-900} x1={2900} y={AL.deskY} depth={90} face={700} top="#B98A5E" front="#8E6640" />
        <Shadow cx={AL.mon.x} cy={AL.deskY + 40} rx={170} ry={14} />
        <Monitor id={`${id}-mon`} x={AL.mon.x} y={AL.mon.y} w={AL.mon.w} h={AL.mon.h} on={monOn}>
          {screen ?? <ScreenScene id={`${id}-sc`}><CrewTalk id={`${id}-cp`} f={f} look="clerkC" bg="kitchen" tr={SPEECH(K.people - 2, K.result, 7)} cam={{x: 960, y: 540, z: 1}} /></ScreenScene>}
        </Monitor>
        <path d={`M${AL.mon.x - 80},${AL.deskY + 40} C${AL.mon.x - 300},${AL.deskY + 70} 900,${AL.deskY + 66} ${AL.robot.x + 150},${AL.deskY + 50}`} fill="none" stroke="#2B313A" strokeWidth={7} strokeLinecap="round" />
        <Shadow cx={AL.robot.x} cy={AL.deskY + 46} rx={150} ry={14} />
        <RobotSupport id={`${id}-sup`} x={AL.robot.x} y={AL.robot.y} s={AL.robot.s} yaw={st.yaw} postLen={post} />
        <Robot id={`${id}-r`} st={st} x={AL.robot.x} y={AL.robot.y} s={AL.robot.s} lensGlow={0.4} />
      </Layer>
      <Layer cam={cam} depth={0.85}>
        <MicStand2 x={-60} y={AL.deskY + 240} s={1.3} />
      </Layer>
    </g>
  );
};
/** a monitor insert: the screen fills the frame inside its bezel */
const ScreenInsert: React.FC<{cam: Cam; children: React.ReactNode; id: string}> = ({cam, children, id}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#3E5A5F" />
    <Layer cam={cam} depth={1}>
      <rect x={60} y={20} width={1800} height={1040} rx={26} fill="#1E252C" stroke={INK} strokeWidth={6} />
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={100} y={60} width={1720} height={960} rx={8} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>{children}</g>
    </Layer>
  </g>
);

// "Once it had a way to control its own appearance,": at the mirror, it turns away from its reflection
export const TurnAway: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const k = e2(clamp((t - (K.once + 0.5)) / 1.6));
  const st = {...rob2(f), yaw: lerp(152, 104, k), gx: lerp(0, 0.4, k)};
  return <MirrorSet2 id="ta" cam={drift(f, K.once, T('researchers gave'), {x: 1000, y: 520, z: 1.06}, {x: 980, y: 520, z: 1.1})} st={st} />;
};
// "researchers gave it something else to watch.": the recording alcove; the monitor comes on
export const AlcoveWide: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 62, 0.55, 0.05);
  const on = pr(f, T('something else') - 0.2, T('something else') + 0.2);
  return <AlcoveSet id="aw" cam={drift(f, T('researchers gave'), K.people, {x: 960, y: 520, z: 0.98}, {x: 990, y: 512, z: 1.05})} st={st} f={f} monOn={on} />;
};
// "People.": the screen, close
export const ScreenPeople: React.FC<{f: number}> = ({f}) => (
  <ScreenInsert id="sp" cam={drift(f, K.people, K.study26, CAM0, {x: 960, y: 540, z: 1.03})}>
    <ScreenPerson id="sp-p" x={960} y={540} w={1720} h={960} f={f} />
  </ScreenInsert>
);
// "In the lip-sync study published in January 2026,": over the robot's shoulder to the screen
export const AlcoveOTS: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 62, 0.55, 0.05);
  return (
    <g>
      <AlcoveSet id="ao" cam={drift(f, K.study26, T('the system learned'), {x: 1060, y: 520, z: 1.55}, {x: 1080, y: 516, z: 1.62})} st={{...st, yaw: 128}} f={f} />
      <Tag x={90} y={110} text="Lip-sync study · Science Robotics · January 2026" k={pr(f, K.study26 + 0.15, K.study26 + 0.5)} size={30} />
    </g>
  );
};
// "the system learned from videos of humans talking and singing,": the screen fills with mouths
export const GridInsert: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const k = 0.55 + 0.45 * pr(f, T('the system learned'), T('the system learned') + 0.5, (x) => x); // three tiles on the cut, all six by half a second
  return (
    <g>
      <ScreenInsert id="gi" cam={drift(f, T('the system learned'), K.youtube, CAM0, {x: 960, y: 540, z: 1.04})}>
        <MouthGrid id="gi-g" x={100} y={60} w={1720} h={960} t={t} k={k} hotTalk={pulseK(f, T('talking and') - 0.05, T('singing,'))} hotSing={pr(f, T('singing,') - 0.05, T('singing,') + 0.25)} />
      </ScreenInsert>
      <Tag x={500} y={1040} text="talking" k={pulseK(f, T('talking and') - 0.05, T('singing,'))} size={34} anchor="middle" tone="light" />
      <Tag x={1420} y={1040} text="singing" k={pr(f, T('singing,') - 0.05, T('singing,') + 0.25)} size={34} anchor="middle" tone="warm" />
    </g>
  );
};
// "including hours of YouTube footage.": the robot watching, the screen running on through hours of video
export const HoursWatch: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 62, 0.55, 0.05);
  const p = clamp((t - K.youtube) / 1.9);
  const MX = AL.mon.x, MY = AL.mon.y, MW = AL.mon.w, MH = AL.mon.h;
  return (
    <AlcoveSet
      id="hw"
      cam={drift(f, K.youtube, K.important, {x: 1040, y: 470, z: 1.32}, {x: 1060, y: 466, z: 1.4})}
      st={st}
      f={f}
      screen={
        <g>
          <MouthGrid id="hw-g" x={MX - MW / 2} y={MY - MH / 2} w={MW} h={MH} t={t * 3} k={1} />
          <rect x={MX - MW / 2} y={MY + MH / 2 - 54} width={MW} height={54} fill="#000" opacity={0.75} />
          <rect x={MX - MW / 2 + 24} y={MY + MH / 2 - 32} width={MW - 220} height={10} rx={5} fill="#5A6672" />
          <rect x={MX - MW / 2 + 24} y={MY + MH / 2 - 32} width={fmt((MW - 220) * p)} height={10} rx={5} fill={UI.coral} />
          {/* fast-forward through the footage: no figure for the amount (the source says only "hours") */}
          <path d={`M${MX + MW / 2 - 150},${MY + MH / 2 - 40} l18,13 l-18,13 Z M${MX + MW / 2 - 130},${MY + MH / 2 - 40} l18,13 l-18,13 Z`} fill="#FFF" />
          <text x={MX + MW / 2 - 20} y={MY + MH / 2 - 18} textAnchor="end" fontFamily="Nunito Variable" fontWeight={800} fontSize={28} fill="#FFF">
            hours
          </text>
        </g>
      }
    />
  );
};
const SampleMouth: React.FC<{id: string; x: number; y: number; w: number; h: number; t: number}> = ({id, x, y, w, h, t}) => {
  const v = humanVis(sampleT(t), SAMPLE, 0.06);
  return <MouthTile id={id} x={x} y={y} w={w} h={h} tone={TONES[1]} open={v.open * 1.4} wide={v.wide} />;
};
const sampleWave = humanTrace(SAMPLE);
// "The important information was the relationship between the sound and the moving mouth.": one example
export const OneExample: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = sampleT(t);
  const relK = pr(f, T('relationship between the sound') - 0.1, T('relationship between the sound') + 0.3);
  const sK = pulseK(f, T('the sound and') + 0.1, T('the moving mouth.'));
  const mK = pr(f, T('the moving mouth.') + 0.1, T('the moving mouth.') + 0.4);
  return (
    <g>
      <ScreenInsert id="oe" cam={drift(f, K.important, K.linked, CAM0, {x: 960, y: 520, z: 1.04})}>
        <rect x={100} y={60} width={1720} height={960} fill="#141B22" />
        <SampleMouth id="oe-m" x={560} y={120} w={800} h={520} t={t} />
        <rect x={160} y={700} width={1600} height={250} rx={18} fill="#1E2730" />
        <Wave x={200} y={825} w={1520} h={90} t0={st - 1.6} t1={st + 1.6} cursor={st} fn={(tt) => sampleWave(((tt % 3.4) + 3.4) % 3.4)} color="#58B6AE" />
        {relK > 0.01 && (
          <g opacity={relK}>
            <rect x={900} y={710} width={120} height={230} rx={12} fill="none" stroke={UI.amber} strokeWidth={6} />
            <path d="M960,710 L960,640" stroke={UI.amber} strokeWidth={6} strokeDasharray="12 8" />
            <rect x={556} y={116} width={808} height={528} rx={12} fill="none" stroke={UI.amber} strokeWidth={6} opacity={mK} />
          </g>
        )}
      </ScreenInsert>
      <Tag x={330} y={980} text="sound" k={sK + mK * 0.0} size={34} anchor="middle" tone="warm" />
      <Tag x={960} y={1050} text="sound ↔ moving mouth" k={mK} size={34} anchor="middle" tone="warm" />
    </g>
  );
};
// "The researchers linked that to the robot's model of its own face.": the human mouth beside the robot's own
// recorded image with the matching shape (composition match: same height and scale)
export const Linked: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = sampleT(t);
  const rv = robotVis(st, SAMPLE, 0.06);
  const rk = pr(f, T('linked that') - 0.1, T('linked that') + 0.3, e3);
  const modelK = pr(f, T('robot’s model') - 0.1, T('robot’s model') + 0.3);
  const robot = {...ROBOT_NEUTRAL, ...rv, yaw: 0, gx: 0, gy: 0.05};
  const cam = drift(f, K.linked, K.speechAudio, CAM0, {x: 960, y: 540, z: 1.03});
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id="lk-bk" bg="alcove" veil={0.5} dx={0} dy={120} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Panel id="lk-h" x={100} y={170} w={800} h={560} bg="#141B22">
          <SampleMouth id="lk-m" x={140} y={210} w={720} h={480} t={t} />
        </Panel>
        <g transform={`translate(${fmt((1 - rk) * 1100)} 0)`}>
          <Panel id="lk-r" x={1020} y={170} w={800} h={560} bg="#C9D3D2" border={modelK > 0.5 ? UI.amber : INK}>
            <Robot id="lk-rob" st={robot} x={1420} y={210} s={4.6} />
          </Panel>
        </g>
        <path d="M900,450 L1020,450" stroke={UI.amber} strokeWidth={8} strokeDasharray="14 10" opacity={rk} />
      </Layer>
      <Tag x={500} y={820} text="a person’s mouth (video)" k={1} size={30} anchor="middle" tone="light" />
      <Tag x={1420} y={820} text="its own face (its self-model): the matching shape" k={modelK} size={28} anchor="middle" tone="warm" />
      <Wave x={160} y={950} w={680} h={50} t0={st - 1.2} t1={st + 1.2} cursor={st} fn={(tt) => sampleWave(((tt % 3.4) + 3.4) % 3.4)} color="#3E8F88" />
    </g>
  );
};
const robotSampleWave = robotTrace(SAMPLE);
// "Speech audio could then drive coordinated lip movements through the motors.": the same sound enters, the corner
// motors turn, the robot's lips follow it
export const Drive: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = rob2(f);
  const ss = sampleT(t);
  const k = pr(f, T('drive') - 0.2, T('drive') + 0.3);
  const lipK = pr(f, T('lip movements') - 0.1, T('lip movements') + 0.3);
  return (
    <g>
      <RobotCU id="dv" cam={drift(f, K.speechAudio, K.result, {x: 960, y: 470, z: 1}, {x: 960, y: 480, z: 1.05})} st={st} x={960} y={250} s={5.4} veil={0.45} bg="alcove" bgDx={0} bgDy={300} cheek={{k, side: -1, r: 1.2}} over={<g transform="translate(960 250) scale(5.4)"><CheekSection id="dv-ck2" st={st} k={k} side={1} r={1.2} hot /></g>} />
      <rect x={160} y={860} width={1600} height={170} rx={20} fill="#141B22" opacity={0.9} />
      <Wave x={200} y={945} w={1520} h={60} t0={ss - 1.6} t1={ss + 1.6} cursor={ss} fn={(tt) => robotSampleWave(((tt % 3.4) + 3.4) % 3.4)} color="#58B6AE" />
      <Tag x={90} y={110} text="speech audio" k={pr(f, K.speechAudio, K.speechAudio + 0.3)} size={30} tone="light" />
      <Tag x={90} y={170} text="→ lip motors" k={k} size={30} tone="warm" />
      <Tag x={90} y={230} text="→ lips" k={lipK} size={30} tone="warm" />
    </g>
  );
};

// ------------------------------------------------------------------ the result (silent demonstrations)
const R_SPEECH = SPEECH(K.speechAudio + 1.2, K.song + 0.6, 3);
const R_SONG = SONG(K.song + 0.3, K.languages + 0.2);
const R_LANG = SPEECH(K.languages - 0.2, K.distinction, 11);
const tr1 = robotTrace(R_SPEECH), tr2 = robotTrace(R_SONG), tr3 = robotTrace(R_LANG);
// "The result was a physical face moving its lips along with speech": a speaker box plays a recording; the lips follow
export const ResultSpeech: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 34, 0.45, 0.05);
  const lv = tr1(t);
  return (
    <g>
      <RobotCU
        id="rs"
        cam={drift(f, K.result, K.song, {x: 960, y: 540, z: 1}, {x: 940, y: 530, z: 1.07})}
        st={st}
        x={760}
        y={430}
        s={2.7}
        benchY={880}
        veil={0.12}
        bgDx={-300}
        bgDy={160}
        bgS={1.0}
        over={
          <g>
            <path d="M1380,920 C1200,960 1000,950 900,922" fill="none" stroke="#2B313A" strokeWidth={8} strokeLinecap="round" />
            <SpeakerBox x={1460} y={780} s={1.2} level={lv} />
            <rect x={1250} y={470} width={440} height={120} rx={16} fill="#141B22" opacity={0.9} />
            <Wave x={1270} y={530} w={400} h={44} t0={t - 2} t1={t} fn={tr1} color="#58B6AE" />
          </g>
        }
      />
      <Tag x={90} y={110} text="Silent illustration: lips follow a speech recording" k={pr(f, K.result + 0.2, K.result + 0.6)} size={26} />
      <Tag x={1470} y={440} text="speech" k={pr(f, T('with speech') - 0.2, T('with speech') + 0.2)} size={30} anchor="middle" tone="light" />
    </g>
  );
};
// "and song.": profile, sung vowels held longer
export const ResultSong: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 64, 0.3, -0.05);
  return (
    <g>
      <RobotCU id="rg" cam={drift(f, K.song, K.languages, {x: 900, y: 560, z: 1}, {x: 900, y: 560, z: 1.05})} st={st} x={820} y={450} s={3.6} veil={0.3} bgDx={600} bgDy={160} />
      <rect x={1250} y={300} width={560} height={150} rx={18} fill="#141B22" opacity={0.9} />
      <Wave x={1275} y={375} w={510} h={56} t0={t - 2.4} t1={t} fn={tr2} color={UI.amber} />
      <Tag x={1530} y={520} text="song" k={1} size={34} anchor="middle" tone="warm" />
    </g>
  );
};
// "It could even synchronize with audio in languages it hadn't been trained on.": front; a recording in another
// language (not one it was trained on), the lips still following the sound
export const ResultLang: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 0, 0, 0.05);
  return (
    <g>
      <RobotCU id="rl" cam={drift(f, K.languages, K.meaning, {x: 960, y: 520, z: 1}, {x: 960, y: 530, z: 1.06})} st={st} x={960} y={360} s={3.8} veil={0.35} bgDx={-900} bgDy={160} />
      <rect x={260} y={860} width={1400} height={160} rx={20} fill="#141B22" opacity={0.9} />
      <Wave x={300} y={940} w={1320} h={56} t0={t - 3} t1={t} fn={tr3} color="#B48FD9" />
      <Tag x={960} y={820} text="a language it was not trained on" k={pr(f, T('in languages') - 0.2, T('in languages') + 0.2)} size={32} anchor="middle" tone="light" />
    </g>
  );
};
// "The meaning of those words wasn't required for the lip movements.": the physical path, sound -> motors -> lips,
// with an empty slot where meaning would be
export const SignalPath: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = {...rob2(f), yaw: 0, gx: 0, gy: 0.05};
  const lv = tr3(t);
  const a1 = 1, a2 = 1, a3 = 1;
  // a pulse runs along the path, speaker -> motor -> lips, once per 1.2 s
  const ph = ((t - K.meaning) % 1.2) / 1.2;
  const px = 300 + ph * 1000;
  const mk = pr(f, T('wasn’t required') - 0.2, T('wasn’t required') + 0.2);
  const cam = drift(f, K.meaning, K.distinction, CAM0, {x: 960, y: 540, z: 1.03});
  const ang = -0.6 + 1.2 * lv;
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Plate id="sg-pl" />
      </Layer>
      <Layer cam={cam} depth={1}>
        <SpeakerBox x={260} y={560} s={1.2} level={lv} arcs={false} />
        <g opacity={a1}>
          <rect x={420} y={500} width={420} height={120} rx={16} fill="#141B22" />
          <Wave x={440} y={560} w={380} h={44} t0={t - 2} t1={t} fn={tr3} color="#B48FD9" />
          <path d="M860,560 l50,0 m-16,-16 l16,16 l-16,16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
        <g opacity={a2} transform="translate(1030 560)">
          <rect x={-80} y={-55} width={160} height={110} rx={12} fill="#59627E" stroke={INK} strokeWidth={4} />
          <line x1={0} y1={0} x2={fmt(60 * Math.cos(ang))} y2={fmt(60 * Math.sin(ang))} stroke="#E8ECF4" strokeWidth={14} strokeLinecap="round" />
          <circle cx={0} cy={0} r={14} fill={UI.amber} stroke={INK} strokeWidth={3} />
          <path d="M100,0 l50,0 m-16,-16 l16,16 l-16,16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
        <g opacity={a3}>
          <Panel id="sg-p" x={1250} y={330} w={520} h={460} bg="#C9D3D2">
            <Robot id="sg-r" st={st} x={1510} y={420} s={3.6} />
          </Panel>
        </g>
        <circle cx={fmt(px)} cy={560} r={14} fill={UI.amber} opacity={0.9 * Math.sin(Math.PI * ph)} />
        <g opacity={mk}>
          <rect x={760} y={170} width={400} height={150} rx={18} fill="none" stroke="#8A94A0" strokeWidth={5} strokeDasharray="16 12" />
          <text x={960} y={262} textAnchor="middle" fontFamily="Fredoka Variable" fontWeight={600} fontSize={46} fill="#8A94A0">
            meaning
          </text>
          <path d="M960,320 L960,470" stroke="#8A94A0" strokeWidth={5} strokeDasharray="12 10" />
        </g>
      </Layer>
      <Tag x={960} y={920} text="sound → motors → lips" k={a3} size={34} anchor="middle" tone="light" />
      <Tag x={960} y={120} text="not needed for the lip movements" k={mk} size={30} anchor="middle" tone="warm" />
    </g>
  );
};

// ------------------------------------------------------------------ the distinction (grounded in a mouth and a listener)
// "Which gives us a useful distinction:": the profile two-shot, the robot "speaking" (silent), the visitor listening
export const DistProfile: React.FC<{f: number}> = ({f}) => <LabTwo id="dp" cam={drift(f, K.distinction, T('looking as though'), {x: 990, y: 440, z: 1.5}, {x: 990, y: 432, z: 1.62})} robot={{...rob2(f), yaw: 42, gx: 0.6}} vis={vis2(f)} />;
// "looking as though you are speaking": its mouth, close
export const DistMouth: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 22, 0.6, 0);
  return (
    <g>
      <RobotCU id="dm" cam={drift(f, T('looking as though'), T('and understanding'), {x: 940, y: 520, z: 1}, {x: 930, y: 530, z: 1.06})} st={st} x={900} y={250} s={5.6} veil={0.35} bgDx={600} />
      <Tag x={960} y={1010} text="looking like speaking" k={pr(f, T('looking as though') + 0.2, T('looking as though') + 0.6)} size={34} anchor="middle" tone="light" />
    </g>
  );
};
// "and understanding what you are saying": the listener
export const DistListener: React.FC<{f: number}> = ({f}) => (
  <g>
    <VisitorCU id="dl" cam={drift(f, T('and understanding'), T('are different'), {x: 1010, y: 560, z: 1}, {x: 1020, y: 545, z: 1.05})} vis={vis2(f)} turn={0.42} />
    <Tag x={960} y={1010} text="understanding what is said" k={pr(f, T('understanding') + 0.1, T('understanding') + 0.5)} size={34} anchor="middle" tone="light" />
  </g>
);
// "are different problems.": over the robot's shoulder, the listener facing us
export const DistOTS: React.FC<{f: number}> = ({f}) => (
  <g>
    <OverRobot id="do" cam={drift(f, T('are different'), K.flaws, {x: 960, y: 540, z: 1}, {x: 980, y: 530, z: 1.04})} robot={rob2(f)} vis={vis2(f)} />
    <Tag x={470} y={1000} text="movement" k={pr(f, T('different problems.') - 0.3, T('different problems.'))} size={34} anchor="middle" tone="warm" />
    <Tag x={1240} y={1000} text="meaning" k={pr(f, T('different problems.') - 0.1, T('different problems.') + 0.2)} size={34} anchor="middle" tone="warm" />
  </g>
);

// ------------------------------------------------------------------ the flaws (labelled illustrations)
// "The movements still had flaws.": its mouth, still speaking, then stopped
export const FlawMouth: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 0, 0, 0.05);
  return <RobotCU id="fm" cam={drift(f, K.flaws, T('The team reported'), {x: 960, y: 520, z: 1}, {x: 960, y: 540, z: 1.08})} st={st} x={960} y={40} s={7.0} veil={0.45} bgDx={-600} />;
};
/** the person's lips: a first "ba" on "difficulties", then B on "B", then W on "W" */
const W_CUT = T('“W.”') - 0.12;
const HUMAN_BW: Track = [[0, 'rest'], [FIRST_BA, 'B'], [FIRST_BA + 0.22, 'A'], [FIRST_BA + 0.5, 'rest'], [K.bw - 0.12, 'B'], [W_CUT - 0.04, 'rest'], [T('“W.”') - 0.04, 'W'], [T('“W.”') + 0.7, 'rest']];
const MouthPanel: React.FC<{id: string; x: number; expr: any}> = ({id, x, expr}) => {
  const R = 520;
  const turn = 0.08;
  const m = {x: (-36 * turn) * (R / 100), y: 54 * (R / 100)};
  return (
    <Panel id={id} x={x} y={150} w={820} h={640} bg="#F1D9BF">
      <Head id={`${id}-h`} c={{x: x + 410 - m.x, y: 470 - m.y}} R={R} roll={0} turn={turn} expr={expr} inkW={16} />
    </Panel>
  );
};
const RobotPanel: React.FC<{id: string; x: number; st: RobotState; ring?: number}> = ({id, x, st, ring = 0}) => (
  <Panel id={id} x={x} y={150} w={820} h={640} bg="#C9D3D2">
    <Robot id={`${id}-r`} st={st} x={x + 410} y={-10} s={6.6} />
    {ring > 0.01 && <ellipse cx={x + 410} cy={470} rx={150} ry={70} fill="none" stroke={UI.coral} strokeWidth={8} opacity={ring} />}
  </Panel>
);
/** the B / W comparison: the person's lips (left) and the robot's attempt (right), large */
const BWSplit: React.FC<{f: number; which: 'B' | 'W'; id: string; a: number; b: number}> = ({f, which, id, a, b}) => {
  const t = f / 30;
  const hv = humanVis(t, HUMAN_BW, 0.06);
  const expr = {...EXPR_NEUTRAL, ...VX.rest, ...hv, smile: 0.05, gx: 0, gy: 0};
  const st = {...rob2(f), yaw: 0, gx: 0, gy: 0.05};
  const at = which === 'B' ? K.bw : T('“W.”');
  const on = pr(f, at - 0.1, at + 0.15);
  const cam = drift(f, a, b, CAM0, {x: 960, y: 520, z: 1.03});
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#F1E9D7" />
      <Layer cam={cam} depth={1}>
        <MouthPanel id={`${id}-h`} x={110} expr={expr} />
        <RobotPanel id={`${id}-r`} x={990} st={st} ring={on * 0.9} />
      </Layer>
      <text x={960} y={120} textAnchor="middle" fontFamily="Fredoka Variable" fontWeight={600} fontSize={96} fill={UI.ink} opacity={on}>
        {which === 'B' ? '“B”' : '“W”'}
      </text>
      <Tag x={520} y={880} text={which === 'B' ? 'lips close fully' : 'lips round and push forward'} k={on} size={32} anchor="middle" tone="light" />
      <Tag x={1400} y={880} text={which === 'B' ? 'a small gap stays open' : 'too little rounding'} k={pr(f, at + 0.1, at + 0.35)} size={32} anchor="middle" tone="warm" />
      <Tag x={960} y={1010} text="Illustration of the reported difficulty" k={pr(f, a + 0.2, a + 0.5)} size={26} anchor="middle" />
    </g>
  );
};
export const FlawB: React.FC<{f: number}> = ({f}) => <BWSplit f={f} which="B" id="fb" a={T('The team reported')} b={W_CUT} />;
export const FlawW: React.FC<{f: number}> = ({f}) => <BWSplit f={f} which="W" id="fw" a={W_CUT} b={K.small} />;
// "A small error is easy to notice": the gap, very close
export const FlawGap: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 0, 0, 0.05);
  const ring = pr(f, K.small + 0.6, K.small + 0.9);
  return (
    <g>
      <RobotCU id="fg" cam={drift(f, K.small, T('when you’re watching'), {x: 960, y: 500, z: 1}, {x: 960, y: 500, z: 1.12})} st={st} x={960} y={-230} s={10.5} veil={0.45} bgDx={-600} over={<ellipse cx={960} cy={520} rx={230} ry={95} fill="none" stroke={UI.coral} strokeWidth={9} opacity={ring} />} />
    </g>
  );
};
// "when you're watching a mouth.": the visitor's eyes narrow on it
export const FlawNotice: React.FC<{f: number}> = ({f}) => <VisitorCU id="fn" cam={drift(f, T('when you’re watching'), K.another, {x: 1050, y: 420, z: 1.5}, {x: 1060, y: 420, z: 1.6})} vis={vis2(f)} turn={0.42} />;
export {LabTwo, TWO_A, Bracket, camPath, e2, Monitor, Vis as _Vis};

/** the screen showing a full-frame scene, scaled into the monitor (so a push into the screen arrives at that scene) */
export const ScreenScene: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
  const sc = AL.mon.w / 1920;
  return (
    <g>
      <rect x={AL.mon.x - AL.mon.w / 2} y={AL.mon.y - AL.mon.h / 2} width={AL.mon.w} height={AL.mon.h} fill="#141B22" />
      <g transform={`translate(${AL.mon.x - AL.mon.w / 2} ${AL.mon.y - (1080 * sc) / 2}) scale(${sc})`}>
        <defs>
          <clipPath id={`${id}-c`}>
            <rect x={0} y={0} width={1920} height={1080} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-c)`}>{children}</g>
      </g>
    </g>
  );
};
// 82.91 - 84.40 "In the lip-sync study published in": over the robot's shoulder, the camera goes into the screen; the
// screen's scene becomes the frame
export const T4Into: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 128, 0.55, 0.05);
  const zEnd = 1920 / AL.mon.w;
  const cam = glide(f, K.study26, T4_IN, [{x: 1060, y: 520, z: 1.5}, {x: 1200, y: 500, z: 1.9}, {x: AL.mon.x, y: AL.mon.y, z: zEnd}], (x) => x * x);
  return (
    <g>
      <AlcoveSet id="t4i" cam={cam} st={st} f={f} screen={<ScreenScene id="t4i-sc"><CrewTalk id="t4i-p" f={f} look="honest" bg="office" tr={T4_TRACK} cam={T4_CAM0} scale={3.4} /></ScreenScene>} />
      <Tag x={90} y={110} text="Lip-sync study · Science Robotics · January 2026" k={pr(f, K.study26 + 0.15, K.study26 + 0.5)} size={30} />
    </g>
  );
};
