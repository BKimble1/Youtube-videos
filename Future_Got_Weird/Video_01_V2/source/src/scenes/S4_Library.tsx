import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, easeOut, lerp, pop, ramp, window as win} from '../lib/anim';
import {C, F, FPS} from '../theme';
import {LibrarySet} from '../components/Sets';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {Cake, Marked, Slip} from '../components/Props';
import {Bubble, Catalogue, Seal} from '../components/Props2';
import {Chip, Headline, Label} from '../components/Text';

const SPINE_WORDS = ['Methods', 'Algorithms', 'Machine Learning', 'Learning', 'Theory', 'Online', 'Topics in', 'Analysis', 'Models', 'Approaches'];
// title words that fly off the shelves into the slip (the ChatGPT title shares these pattern words)
const FLY = [
  {w: 'Boosting,', from: [300, 120]},
  {w: 'Online', from: [900, 300]},
  {w: 'Algorithms,', from: [520, 500]},
  {w: 'and Other Topics in', from: [1500, 120]},
  {w: 'Machine Learning.', from: [1200, 690]},
];

export const S4Library: React.FC = () => {
  const g = useG();
  const c13 = at('s13');
  const cLearned = at('s13', 'learned');
  const cSound = at('s14', 'sound');
  const cMethods = at('s14', '“Methods.”');
  const cAlgo = at('s14', '“Algorithms.”');
  const cML = at('s14', '“Machine');
  const cShelf = at('s14', 'Shelf');
  const cBut = at('s15', 'But');
  const cRarely = at('s15', 'rarely,');
  const cBirthday = at('s15', 'birthday,');
  const cPattern = at('s15', 'pattern');
  const cSo = at('s16', 'So');
  const cFills = at('s16', 'fills');
  const cConfidence = at('s16', 'confidence');
  const cEntitled = at('s16', '“Is');
  const cThink = at('s16', 'think.”');
  const cMaybe = at('s16', '“maybe.”');
  const cEnd = segEnd('s16');
  const GAP_FRAC = 0.33; // where the missing birthday book would be on the second shelf

  // ---- camera
  const WIDE: Cam = {cx: 960, cy: 540, zoom: 1};
  const SHELF_A: Cam = {cx: 620, cy: 300, zoom: 1.5};
  const SHELF_B: Cam = {cx: 1300, cy: 300, zoom: 1.5};
  const CAB: Cam = {cx: 1250, cy: 520, zoom: 1.15};
  const SLIPCAM: Cam = {cx: 1180, cy: 520, zoom: 1.3};
  let cam = WIDE;
  const panT = ramp(g, cSound - 4, 18, easeInOut) * (1 - ramp(g, cShelf - 8, 18, easeInOut));
  cam = camLerp(cam, camLerp(SHELF_A, SHELF_B, ramp(g, cMethods, cML - cMethods + 10, easeInOut)), panT);
  cam = camLerp(cam, CAB, ramp(g, cBut - 4, 18, easeInOut) * (1 - ramp(g, cSo - 6, 16, easeInOut)));
  cam = camLerp(cam, SLIPCAM, ramp(g, cSo - 6, 16, easeInOut) * (1 - ramp(g, cEnd + 10, 14, easeInOut)));

  // ---- beats
  const walkIn = ramp(g, c13 - 4, 40, easeInOut);
  const lit = ramp(g, cLearned, 20);
  const wordT = [ramp(g, cMethods - 2, 10), ramp(g, cAlgo - 2, 10), ramp(g, cML - 2, 10)];
  const wordsOut = ramp(g, cShelf + 10, 10);
  const drawer = ramp(g, cBut + 6, 20, easeInOut) * (1 - ramp(g, cSo - 4, 12));
  const gapT = win(g, cRarely - 2, cSo - 4, 10, 10);
  const cakeT = pop(g, FPS, cBirthday) * (1 - ramp(g, cSo - 4, 10));
  const patternT = ramp(g, cPattern - 2, 10) * (1 - ramp(g, cSo - 4, 10));
  const flyT = FLY.map((_, i) => ramp(g, cFills - 4 + i * 5, 18, easeInOut));
  const slipT = ramp(g, cFills + 26, 14);
  const sealT = pop(g, FPS, cConfidence + 4);
  const entitledT = ramp(g, cEntitled, 10);
  const thinkT = ramp(g, cThink - 8, 12);
  const thinkStrike = ramp(g, cThink + 2, 10);
  const maybeT = ramp(g, cMaybe - 8, 12);
  const maybeStrike = ramp(g, cMaybe + 2, 10);
  const sceneOut = 1 - ramp(g, cEnd + 24, 12);

  // ---- the clerk (clerk A again: the same confident character from the counter)
  const clerkX = lerp(-260, 1225, walkIn);
  const look: Pose = {...IDLE, lookY: -0.8, lookX: 0.2, mouth: 'smile', tilt: -4};
  const drawerPose: Pose = {...IDLE, armR: {a: 55, b: 40}, lookX: 0.9, lookY: 0.5, mouth: 'hmm', brows: 0.6, tilt: 6};
  const holdPose: Pose = {...IDLE, armL: {a: 28, b: 100}, armR: {a: 28, b: 100}, lookX: 0, lookY: 0.4, mouth: 'grin', brows: 0.6, bob: -4};
  let pose = look;
  pose = mixPose(pose, drawerPose, ramp(g, cBut, 14) * (1 - ramp(g, cSo - 6, 12)));
  pose = mixPose(pose, holdPose, ramp(g, cFills + 10, 14));
  const stepBob = walkIn < 1 ? Math.abs(Math.sin(g * 0.5)) * -8 : 0;

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.tealLight}}>
      <Camera cam={cam}>
        <LibrarySet words={SPINE_WORDS} gapShelf={2} gapAt={GAP_FRAC} highlight={lit}>
          <Layer depth={0.7}>
            {/* word call-outs on the top shelf */}
            {[
              {t: 'Methods.', x: 200 + 420},
              {t: 'Algorithms.', x: 200 + 880},
              {t: 'Machine Learning.', x: 200 + 1300},
            ].map((w, i) => (
              <div key={w.t} style={{position: 'absolute', left: w.x, top: 200 + 110, opacity: wordT[i] * (1 - wordsOut), transform: `translateY(${(1 - wordT[i]) * 20}px) scale(${lerp(0.8, 1, wordT[i])})`}}>
                <Chip tone="saffron" size={30}>{w.t}</Chip>
              </div>
            ))}
            {/* the gap in the second shelf */}
            {gapT > 0 && (
              <div style={{position: 'absolute', left: 80 + 1760 * GAP_FRAC - 10, top: 440 - 10, width: 92, height: 172, border: `5px dashed ${C.coral}`, borderRadius: 10, opacity: gapT}}>
                <div style={{position: 'absolute', right: 0, top: -62, whiteSpace: 'nowrap'}}>
                  <Chip tone="coral" size={24}>rarely, or not at all</Chip>
                </div>
                {/* birthday cake in the gap: no pattern to learn from */}
                {cakeT > 0 && (
                  <div style={{position: 'absolute', left: 46, top: 172, transform: `scale(${cakeT})`, transformOrigin: '50% 100%'}}>
                    <Cake scale={0.9} />
                    <div style={{position: 'absolute', left: -200, top: 22, width: 240, textAlign: 'center', opacity: patternT}}>
                      <Chip tone="ink" size={22}>no pattern to learn from</Chip>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Layer>
          <Layer depth={1}>
            {/* card catalogue */}
            <Catalogue
              open={drawer}
              scale={1}
              style={{left: 1330, top: 520}}
              card={
                <div style={{width: 250, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 8, padding: '10px 14px', boxShadow: `4px 5px 0 ${C.shadow}`}}>
                  <div style={{fontFamily: F.mono, fontSize: 20, color: C.inkMuted}}>KALAI, A. · 2001</div>
                  <div style={{fontFamily: F.serif, fontSize: 24, color: C.ink, marginTop: 6}}>title:</div>
                  <div style={{height: 3, background: C.inkMuted, marginTop: 10, opacity: 0.6}} />
                  <div style={{height: 3, background: C.inkMuted, marginTop: 14, opacity: 0.6}} />
                </div>
              }
            />
            {/* the clerk */}
            <Character look={CAST.clerkA} pose={{...pose, bob: (pose.bob ?? 0) + stepBob}} frame={g} seed={4} x={clerkX} y={850} scale={0.92} />
            {/* words flying off the shelves into the slip */}
            {FLY.map((f, i) => {
              const t = flyT[i];
              if (t <= 0 || t >= 1) return null;
              const x = lerp(f.from[0], clerkX + 10, t);
              const y = lerp(f.from[1], 560, t) - Math.sin(t * Math.PI) * 120;
              return (
                <div key={f.w} style={{position: 'absolute', left: x, top: y, transform: `rotate(${(1 - t) * -12}deg) scale(${lerp(1.1, 0.8, t)})`}}>
                  <Chip tone="paper" size={28}>{f.w}</Chip>
                </div>
              );
            })}
            {/* the assembled slip, held by the clerk */}
            {slipT > 0 && (
              <div style={{position: 'absolute', left: clerkX - 230, top: 430, opacity: slipT, transform: `scale(${lerp(0.8, 1, slipT)}) rotate(-3deg)`, transformOrigin: '50% 100%'}}>
                <Slip model="ChatGPT" detail="GPT-4o · published excerpt" width={470} fontSize={27}>
                  <Marked
                    spans={[
                      {text: '…is entitled: ', mark: 'ink', markT: entitledT},
                      {text: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”'},
                    ]}
                  />
                </Slip>
                {sealT > 0 && <Seal text={'IS\nENTITLED'} t={sealT} size={130} style={{right: -40, top: -60, whiteSpace: 'pre-line'}} />}
              </div>
            )}
            {/* hedge words that never showed up */}
            {thinkT > 0 && (
              <div style={{position: 'absolute', left: clerkX + 290, top: 470, opacity: thinkT, transform: `translateY(${(1 - thinkT) * 20}px)`}}>
                <div style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 12, padding: '8px 18px', fontFamily: F.serif, fontSize: 34, color: C.ink}}>
                  <Marked spans={[{text: 'I think', mark: 'strike', markT: thinkStrike}]} />
                </div>
              </div>
            )}
            {maybeT > 0 && (
              <div style={{position: 'absolute', left: clerkX + 330, top: 560, opacity: maybeT, transform: `translateY(${(1 - maybeT) * 20}px) rotate(4deg)`}}>
                <div style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 12, padding: '8px 18px', fontFamily: F.serif, fontSize: 34, color: C.ink}}>
                  <Marked spans={[{text: 'maybe', mark: 'strike', markT: maybeStrike}]} />
                </div>
              </div>
            )}
          </Layer>
        </LibrarySet>
      </Camera>
      {/* the honesty note for the gap beat */}
      {gapT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, textAlign: 'center', opacity: gapT}}>
          <Chip tone="ink" size={26}>a birthday shows up rarely, or not at all · training exposure is unknown for these models</Chip>
        </div>
      )}
      {/* a chip anchoring the idea: title-shaped answer */}
      {slipT > 0.5 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, textAlign: 'center', opacity: ramp(g, cFills + 30, 10)}}>
          <Chip tone="ink" size={28}>a title-shaped answer · simplified illustration</Chip>
        </div>
      )}
      {g < cSound && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 60, textAlign: 'center', opacity: ramp(g, c13, 12) * (1 - ramp(g, cSound - 8, 8))}}>
          <Headline size={60} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '12px 32px', boxShadow: `8px 10px 0 ${C.shadow}`}}>What the model learned from</Headline>
        </div>
      )}
    </AbsoluteFill>
  );
};
