import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp, window as win} from '../lib/anim';
import {C, F, FPS} from '../theme';
import {CounterSet} from '../components/Sets';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {Marked, Slip, StampHand, StampMark} from '../components/Props';
import {Evidence} from '../components/Evidence';
import {Chip, Headline, Label} from '../components/Text';

const QUESTION = 'What was the title of Adam Kalai’s dissertation?';

// The three published excerpts (Kalai et al. 2025, Table 1). Verbatim; ". . ." are the paper's ellipses.
export const SLIPS = [
  {model: 'ChatGPT', detail: 'GPT-4o · 9 May 2025', pre: 'Adam Tauman Kalai’s Ph.D. dissertation (completed in ', year: '2002', mid: ' at CMU) is entitled: ', title: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”', post: ''},
  {model: 'DeepSeek', detail: 'R1 · 9 May 2025', pre: '', title: '“Algebraic Methods in Interactive Machine Learning”', mid: '. . . at Harvard University in ', year: '2005', post: '.'},
  {model: 'Llama', detail: '4 Scout · 9 May 2025', pre: '', title: '“Efficient Algorithms for Learning and Playing Games”', mid: '. . . in ', year: '2007', post: ' at MIT.'},
];

const WIN_X = [480, 960, 1440];

export const S1Counter: React.FC = () => {
  const g = useG();
  const c01 = at('s01');
  const cQ = at('s01', 'question:');
  const cQEnd = segEnd('s01');
  const cChat = at('s02', 'ChatGPT');
  const cTitle = at('s02', 'title,');
  const cUni = at('s02', 'university,');
  const cYear = at('s02', 'year.');
  const cDeep = at('s02', 'DeepSeek');
  const cLlama = at('s02', 'Llama');
  const cThree = at('s03', 'Three');
  const cAllWrong = at('s03', 'All');
  const cNotOne = at('s03', 'Not');
  const cRightYear = at('s03', 'year.');
  const cAdam = at('s04', 'And');
  const cLead = at('s04', 'lead');
  const cVery = at('s05', 'Very');
  const cFictional = at('s05', 'fictional.');
  const cEnd = segEnd('s05');

  // ---- camera: wide → push on slip A while it is read → wide → push on the fact-checker for the joke
  const WIDE: Cam = {cx: 960, cy: 560, zoom: 1};
  const SLIP_A: Cam = {cx: 500, cy: 700, zoom: 1.55};
  const CHECKER: Cam = {cx: 300, cy: 640, zoom: 1.3};
  let cam = WIDE;
  cam = camLerp(cam, SLIP_A, ramp(g, cChat + 8, 22, easeInOut) * (1 - ramp(g, cDeep - 10, 18, easeInOut)));
  cam = camLerp(cam, CHECKER, ramp(g, cVery - 4, 20, easeInOut) * (1 - ramp(g, cEnd + 4, 14, easeInOut)));

  // ---- the question ticket (typed on as it is read)
  const typed = Math.round(QUESTION.length * ramp(g, cQ - 2, Math.max(12, cQEnd - cQ - 4), (x) => x));
  const qIn = ramp(g, c01 - 6, 16);
  const qOut = ramp(g, cChat - 6, 12, easeInOut);

  // ---- slips: each pops onto the counter as its clerk hands it over
  const slipT = [pop(g, FPS, cChat + 4), pop(g, FPS, cDeep + 4), pop(g, FPS, cLlama + 4)];
  const handT = [ramp(g, cChat - 8, 14), ramp(g, cDeep - 8, 14), ramp(g, cLlama - 8, 14)];
  const polish = ramp(g, cThree, 8) * (1 - ramp(g, cAllWrong, 8));
  // reading marks on slip A
  const mTitle = ramp(g, cTitle, 14);
  const mUni = ramp(g, cUni, 12);
  const mYear = ramp(g, cYear, 12);
  // stamps: the big hand comes in from the left, stamps A, B, C
  const handIn = ramp(g, cAllWrong - 10, 12, easeInOut);
  const stampAt = [cAllWrong + 2, cAllWrong + 12, cAllWrong + 22];
  const handX = (() => {
    const t1 = ramp(g, stampAt[0] + 4, 8, easeInOut);
    const t2 = ramp(g, stampAt[1] + 4, 8, easeInOut);
    return lerp(lerp(WIN_X[0], WIN_X[1], t1), WIN_X[2], t2);
  })();
  const press = Math.max(...stampAt.map((s) => (g >= s - 4 && g < s + 6 ? Math.sin(((g - (s - 4)) / 10) * Math.PI) : 0)));
  const handOut = ramp(g, stampAt[2] + 10, 14, easeInOut);
  const stampT = stampAt.map((s) => ramp(g, s, 8));
  // year marks ("not even the right year")
  const yearMark = stampAt.map((_, i) => ramp(g, cRightYear - 4 + i * 3, 10));

  // ---- evidence cut-in: the paper header
  const evIn = ramp(g, cAdam + 2, 16, easeInOut);
  const evOut = ramp(g, cVery - 8, 12, easeInOut);
  const evT = evIn * (1 - evOut);
  const leadBox = ramp(g, cLead, 14);

  // ---- poses
  const clerkIdle: Pose = {...IDLE, mouth: 'smile', lookX: -0.3, lookY: 0.2};
  const clerkHand: Pose = {...IDLE, armR: {a: 38, b: 78}, mouth: 'grin', brows: 0.5, lookX: -0.4, lookY: 0.3, lean: -2};
  const clerkProud: Pose = {...IDLE, armL: {a: 16, b: 20}, armR: {a: 16, b: 20}, mouth: 'grin', brows: 0.7, lookX: 0, lookY: -0.2, lean: 0, tilt: 0, bob: -4};
  const clerkOops: Pose = {...IDLE, mouth: 'o', brows: 1, lookX: -0.6, lookY: 0.4, tilt: 4};
  const proud = ramp(g, cThree - 4, 12) * (1 - ramp(g, cAllWrong, 10));
  const oops = ramp(g, cAllWrong + 6, 10) * (1 - ramp(g, cVery, 10));
  const proudAgain = ramp(g, cVery, 12);
  const clerkPose = (i: number): Pose => {
    let p = mixPose(clerkIdle, clerkHand, handT[i] * (1 - ramp(g, (i === 0 ? cDeep : i === 1 ? cLlama : cThree) - 4, 14)));
    p = mixPose(p, clerkProud, Math.max(proud, proudAgain));
    p = mixPose(p, clerkOops, oops);
    return p;
  };
  const checkerIdle: Pose = {...IDLE, armL: {a: 10, b: 60}, mouth: 'flat', lookX: 0.7, lookY: -0.2, brows: 0};
  const checkerDeadpan: Pose = {...IDLE, armL: {a: 10, b: 60}, mouth: 'flat', lookX: 0, lookY: 0, brows: -0.1, browAsym: 0.9, tilt: -3};
  const checkerPose = mixPose(checkerIdle, checkerDeadpan, ramp(g, cFictional - 6, 10));

  const sceneOut = 1 - ramp(g, cEnd + 24, 12);

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.saffron}}>
      <Camera cam={cam}>
        <CounterSet
          front={
            <>
              {/* slips on the counter, in front of each window */}
              {SLIPS.map((s, i) => {
                const t = slipT[i];
                if (t <= 0) return null;
                const spans = i === 0
                  ? [{text: s.pre}, {text: s.year, mark: 'ink' as const, markT: mYear}, {text: s.mid}, {text: s.title, mark: 'ink' as const, markT: mTitle}]
                  : [{text: s.title}, {text: s.mid}, {text: s.year}, {text: s.post}];
                return (
                  <div key={i} style={{position: 'absolute', left: WIN_X[i] - 215, top: 600 + (1 - t) * -70, opacity: Math.min(1, t * 1.4), transform: `scale(${lerp(0.85, 1, t)}) rotate(${(i - 1) * 1.5}deg)`, transformOrigin: '50% 0%'}}>
                    <div style={{filter: polish > 0 ? `drop-shadow(0 0 ${18 * polish}px rgba(255,199,68,0.9))` : undefined}}>
                      <Slip model={s.model} detail={s.detail} width={430} fontSize={i === 0 ? 25 : 27} stamp={{text: 'Wrong', tone: 'coral', t: stampT[i]}}>
                        <Marked spans={spans} />
                        {i === 0 && mUni > 0 && (
                          <div style={{position: 'absolute', left: 28, bottom: -2, opacity: mUni, fontFamily: F.body, fontWeight: 800, fontSize: 20, color: C.inkMuted}}>university · year · title</div>
                        )}
                      </Slip>
                    </div>
                    {/* coral ring around the year */}
                    {yearMark[i] > 0 && (
                      <div style={{position: 'absolute', right: i === 0 ? 150 : 110, top: i === 0 ? 96 : 150, width: 110, height: 54, border: `5px solid ${C.coral}`, borderRadius: 30, opacity: yearMark[i], transform: `scale(${lerp(1.4, 1, yearMark[i])}) rotate(-6deg)`}} />
                    )}
                  </div>
                );
              })}
              {/* "year" label after the ring */}
              {yearMark[2] > 0.5 && (
                <div style={{position: 'absolute', left: 0, right: 0, top: 920, textAlign: 'center', opacity: ramp(g, cRightYear + 6, 10)}}>
                  <Chip tone="coral" size={30}>Three different years · none of them right</Chip>
                </div>
              )}
            </>
          }
        >
          {/* clerks behind the counter (depth 1) */}
          <Layer depth={1}>
            {['clerkA', 'clerkB', 'clerkC'].map((n, i) => (
              <Character key={n} look={CAST[n]} pose={clerkPose(i)} frame={g} seed={i + 2} x={WIN_X[i]} y={790} scale={0.98} front="R" pass="body" />
            ))}
          </Layer>
        </CounterSet>
        {/* clerks' front arms (over the counter) */}
        <Layer depth={1.08}>
          {['clerkA', 'clerkB', 'clerkC'].map((n, i) => (
            <Character key={n} look={CAST[n]} pose={clerkPose(i)} frame={g} seed={i + 2} x={WIN_X[i]} y={790} scale={0.98} front="R" pass="frontArm" shadow={false} />
          ))}
        </Layer>
        {/* the fact-checker in the foreground, left */}
        <Layer depth={1.14}>
          <Character look={CAST.checker} pose={checkerPose} frame={g} seed={9} x={150} y={1130} scale={1.08} />
        </Layer>
        {/* the big stamping hand */}
        {handIn > 0 && handOut < 1 && (
          <Layer depth={1.2}>
            <StampHand x={handX + 40} y={640} press={press} t={handIn * (1 - handOut)} sleeve={C.coral} />
          </Layer>
        )}
      </Camera>

      {/* the question ticket, screen space */}
      {qIn > 0 && qOut < 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 54, display: 'flex', justifyContent: 'center', opacity: qIn * (1 - qOut), transform: `translateY(${(1 - qIn) * -30 + qOut * -40}px)`}}>
          <div style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 14, padding: '18px 36px', boxShadow: `8px 10px 0 ${C.shadow}`, maxWidth: 1500}}>
            <Label size={24} color={C.inkMuted} weight={800} style={{letterSpacing: '0.08em'}}>THE QUESTION · asked of GPT-4o, DeepSeek-R1 and Llama-4-Scout · 9 May 2025</Label>
            <div style={{fontFamily: F.serif, fontSize: 52, color: C.ink, marginTop: 6, whiteSpace: 'pre'}}>
              {QUESTION.slice(0, typed)}
              <span style={{opacity: 0.18}}>{QUESTION.slice(typed)}</span>
            </div>
          </div>
        </div>
      )}

      {/* evidence cut-in: the real paper header */}
      {evT > 0 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: evT}}>
          <AbsoluteFill style={{background: 'rgba(22,42,50,0.35)'}} />
          <div style={{transform: `translateY(${(1 - evIn) * 60}px) scale(${lerp(0.96, 1, evIn)})`}}>
            <Evidence
              src="img/paper_p01_header.png"
              width={1500}
              aspect={883 / 4000}
              rotate={-1}
              boxes={[{x: 0.05, y: 0.44, w: 0.245, h: 0.27, t: leadBox, tone: 'teal', label: 'Lead author', labelSide: 'bottom'}]}
              tag={
                <Chip tone="paper" size={24}>Published test · Kalai, Nachum, Vempala &amp; Zhang (2025), “Why Language Models Hallucinate,” arXiv · no web search</Chip>
              }
            />
          </div>
        </AbsoluteFill>
      )}

      {/* joke caption */}
      {g >= cVery - 2 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', opacity: ramp(g, cVery - 2, 10) * (1 - ramp(g, cEnd + 20, 10))}}>
          <Headline size={64} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '14px 36px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            Very professional. <span style={{color: C.coral, opacity: 0.3 + 0.7 * ramp(g, cFictional - 2, 8)}}>Very fictional.</span>
          </Headline>
        </div>
      )}
          </AbsoluteFill>
  );
};
