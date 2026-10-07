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
import {Marked, Slip} from '../components/Props';
import {Magnifier} from '../components/Props2';
import {Evidence} from '../components/Evidence';
import {Chip, Headline, Label} from '../components/Text';
import {SLIPS} from './S1_Counter';

// Thesis title page (Kalai 2001), fractional boxes measured on thesis_titlepage_top.png
const BOX_TITLE = {x: 0.18, y: 0.115, w: 0.64, h: 0.103};
const BOX_DATE = {x: 0.42, y: 0.343, w: 0.16, h: 0.053};
const BOX_CMU = {x: 0.373, y: 0.558, w: 0.254, h: 0.022};

export const S5Record: React.FC = () => {
  const g = useG();
  const c17 = at('s17');
  const cThesis = at('s17', 'thesis:');
  const cProb = at('s17', '“Probabilistic');
  const cCarnegie = at('s17', 'Carnegie');
  const cMay = at('s17', 'May');
  const cGot = at('s18', 'ChatGPT');
  const cRight = at('s18', 'right.');
  const cYear = at('s18', 'year');
  const cOne = at('s18', 'one.');
  const cTitle = at('s18', 'title');
  const cInvented = at('s18', 'invented.');
  const cEvery = at('s18', 'every');
  const cSolid = at('s18', 'solid');
  const cFont = at('s19', 'confident');
  const cJust = at('s19', 'just');
  const cEnd = segEnd('s19');

  // record card geometry (world coords), full page
  const PW = 880;
  const PH = PW * (3894 / 4080);
  const PX = 520;
  const PY = 90;
  const pad = 22;
  const boxCenter = (b: {x: number; y: number; w: number; h: number}) => ({cx: PX + pad + (b.x + b.w / 2) * PW, cy: PY + pad + (b.y + b.h / 2) * PH});

  // ---- camera: whole page, then title, then CMU, then date; then wide for the comparison
  const WIDE: Cam = {cx: 960, cy: 540, zoom: 1};
  const tTitle = boxCenter(BOX_TITLE);
  const tCMU = boxCenter(BOX_CMU);
  const tDate = boxCenter(BOX_DATE);
  const CAM_T: Cam = {cx: tTitle.cx, cy: tTitle.cy + 60, zoom: 1.55};
  const CAM_C: Cam = {cx: tCMU.cx, cy: tCMU.cy, zoom: 1.9};
  const CAM_D: Cam = {cx: tDate.cx, cy: tDate.cy + 20, zoom: 1.9};
  let cam = WIDE;
  const toTitle = ramp(g, cProb - 6, 18, easeInOut);
  const toCMU = ramp(g, cCarnegie - 6, 16, easeInOut);
  const toDate = ramp(g, cMay - 4, 14, easeInOut);
  const toWide = ramp(g, cGot - 12, 18, easeInOut);
  cam = camLerp(cam, CAM_T, toTitle);
  cam = camLerp(cam, CAM_C, toCMU);
  cam = camLerp(cam, CAM_D, toDate);
  cam = camLerp(cam, WIDE, toWide);

  const pageIn = pop(g, FPS, c17 - 2, 26);
  const bTitle = ramp(g, cProb, 16);
  const bCMU = ramp(g, cCarnegie, 12);
  const bDate = ramp(g, cMay, 12);
  // comparison layout
  const cmp = ramp(g, cGot - 10, 18, easeInOut);
  const slipIn = pop(g, FPS, cGot - 4);
  const mUni = ramp(g, cGot + 8, 12);
  const mUniRec = ramp(g, cRight - 2, 12);
  const mYear = ramp(g, cYear, 12);
  const mYearRec = ramp(g, cOne - 4, 12);
  const mTitle = ramp(g, cTitle, 14);
  const mTitleRec = ramp(g, cInvented - 4, 12);
  const solid = ramp(g, cEvery, 14) * (1 - ramp(g, cFont - 4, 10));
  const magT = pop(g, FPS, cFont - 2);
  const fontTag = ramp(g, cJust, 10);
  const checkerIn = ramp(g, cFont - 8, 16, easeInOut);
  const sceneOut = 1 - ramp(g, cEnd + 24, 12);

  const checkerPose: Pose = mixPose({...IDLE, lookX: -0.8, lookY: 0.2, mouth: 'flat'}, {...IDLE, lookX: -0.9, lookY: 0.1, mouth: 'flat', browAsym: 1, brows: -0.1, tilt: -6, lean: -8}, ramp(g, cJust - 4, 10));
  const s = SLIPS[0];

  // page position: centred while being read, then slides right for the comparison
  const pageX = lerp(PX, 1080, cmp);
  const pageY = lerp(PY, 150, cmp);
  const pageW = lerp(PW, 700, cmp);

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.coralLight}}>
      <Camera cam={cam}>
        <DeskSet>
          <Layer depth={1}>
            {/* the real record */}
            <div style={{position: 'absolute', left: pageX, top: pageY, opacity: Math.min(1, pageIn * 1.5), transform: `scale(${lerp(0.8, 1, pageIn)}) rotate(${lerp(-2, 0, pageIn)}deg)`, transformOrigin: '50% 0%'}}>
              <Evidence
                src="img/thesis_titlepage_top.png"
                width={pageW}
                aspect={3894 / 4080}
                pad={pad}
                boxes={[
                  {...BOX_TITLE, t: Math.max(bTitle, mTitleRec), tone: 'teal', label: cmp > 0.5 ? 'the real title' : 'Title', labelSide: 'top'},
                  {...BOX_CMU, t: Math.max(bCMU, mUniRec), tone: 'teal', label: cmp > 0.5 ? 'university ✓' : undefined, labelSide: 'right', pad: 6},
                  {...BOX_DATE, t: Math.max(bDate, mYearRec), tone: 'teal', label: cmp > 0.5 ? '2001' : undefined, labelSide: 'right', pad: 6},
                ]}
                tag={<Chip tone="paper" size={22}>Kalai (2001), PhD thesis title page · Carnegie Mellon University · CMU-CS-01-132</Chip>}
              />
            </div>
            {/* the slip, for the comparison */}
            {slipIn > 0 && (
              <div style={{position: 'absolute', left: 150, top: 230, opacity: Math.min(1, slipIn * 1.5), transform: `scale(${lerp(0.8, 1, slipIn)}) rotate(-2deg)`, transformOrigin: '50% 0%'}}>
                <div style={{filter: solid > 0 ? `drop-shadow(0 0 ${22 * solid}px rgba(255,199,68,0.95))` : undefined}}>
                  <Slip model={s.model} detail={s.detail} width={720} fontSize={34}>
                    <Marked
                      spans={[
                        {text: 'Adam Tauman Kalai’s Ph.D. dissertation (completed in '},
                        {text: '2002', mark: 'coral', markT: mYear},
                        {text: ' at '},
                        {text: 'CMU', mark: 'teal', markT: mUni},
                        {text: ') is entitled: '},
                        {text: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”', mark: 'coral', markT: mTitle},
                      ]}
                    />
                  </Slip>
                </div>
                {/* verdict chips under the slip */}
                <div style={{position: 'absolute', left: 0, top: 'calc(100% + 24px)', display: 'flex', gap: 14, flexWrap: 'wrap', width: 720}}>
                  <div style={{opacity: mUni}}><Chip tone="teal" size={26}>university · right</Chip></div>
                  <div style={{opacity: mYear}}><Chip tone="coral" size={26}>year · off by one</Chip></div>
                  <div style={{opacity: mTitle}}><Chip tone="coral" size={26}>title · invented</Chip></div>
                </div>
                {/* the magnifier for the font joke */}
                {magT > 0 && (
                  <div style={{position: 'absolute', left: 420, top: 150}}>
                    <Magnifier scale={1.3} t={magT} />
                    <div style={{position: 'absolute', left: -60, top: 110, opacity: fontTag}}>
                      <Chip tone="saffron" size={26}>nice font</Chip>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Layer>
          {/* the fact-checker leans in from the right for the joke */}
          <Layer depth={1.1}>
            <Character look={CAST.checker} pose={checkerPose} frame={g} seed={9} x={lerp(2200, 1760, checkerIn)} y={1160} scale={1.15} />
          </Layer>
        </DeskSet>
      </Camera>
      {/* headers */}
      {g < cGot - 10 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center', opacity: ramp(g, c17, 10) * (1 - ramp(g, cProb - 8, 8))}}>
          <Chip tone="teal" size={30}>The actual record</Chip>
        </div>
      )}
      {g >= cFont - 2 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 60, textAlign: 'center', opacity: ramp(g, cFont - 2, 10) * (1 - ramp(g, cEnd + 20, 10))}}>
          <Headline size={60} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '12px 32px', boxShadow: `8px 10px 0 ${C.shadow}`}}>
            A confident font is still <span style={{color: C.coral, opacity: 0.3 + 0.7 * fontTag}}>just a font.</span>
          </Headline>
        </div>
      )}
    </AbsoluteFill>
  );
};
