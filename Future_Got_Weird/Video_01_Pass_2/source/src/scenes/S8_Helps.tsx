import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp, window as win} from '../lib/anim';
import {C, F, FPS, OUTLINE} from '../theme';
import {ApparatusSet} from '../components/Sets';
import {Evidence} from '../components/Evidence';
import {Dial, Slip, StampMark} from '../components/Props';
import {Bubble} from '../components/Props2';
import {Chip, Headline, Label} from '../components/Text';
import {SLIPS} from './S1_Counter';

export const S8Helps: React.FC = () => {
  const g = useG();
  const c28 = at('s28');
  const cSearch = at('s28', 'Search');
  const cRoom = at('s28', 'room.');
  const cReasoning = at('s28', 'Reasoning,');
  const cTurning = at('s28', 'Turning');
  const cConsistent = at('s28', 'consistent,');
  const cCorrect = at('s28', 'correct.');
  const cNone = at('s28', 'None');
  const cEnd = segEnd('s28');

  const WIDE: Cam = {cx: 960, cy: 540, zoom: 1};
  const BOOTH: Cam = {cx: 1330, cy: 520, zoom: 1.2};
  const DIAL: Cam = {cx: 700, cy: 560, zoom: 1.25};
  let cam = WIDE;
  cam = camLerp(cam, BOOTH, ramp(g, cSearch - 4, 16, easeInOut) * (1 - ramp(g, cTurning - 8, 16, easeInOut)));
  cam = camLerp(cam, DIAL, ramp(g, cTurning - 8, 16, easeInOut) * (1 - ramp(g, cNone - 4, 14, easeInOut)));

  const headT = ramp(g, c28 - 4, 12) * (1 - ramp(g, cSearch + 20, 10));
  const cartT = ramp(g, cSearch, 36, easeInOut);
  const shutter = ramp(g, cSearch + 24, 16, easeInOut);
  const roomT = ramp(g, cRoom - 2, 10) * (1 - ramp(g, cTurning - 8, 10));
  const bubbleT = pop(g, FPS, cReasoning + 2) * (1 - ramp(g, cTurning - 6, 8));
  const dialT = ramp(g, cTurning + 6, 30, easeInOut);
  const slipsT = [0, 1, 2].map((i) => pop(g, FPS, cConsistent - 4 + i * 6));
  const stampT = [0, 1, 2].map((i) => ramp(g, cCorrect - 8 + i * 4, 8));
  const notT = ramp(g, cCorrect - 4, 10);
  const noneT = pop(g, FPS, cNone);
  const sceneOut = 1 - ramp(g, cEnd + 14, 8);
  const s = SLIPS[0];

  const cartX = lerp(-500, 980, cartT);

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.blueLight}}>
      <Camera cam={cam}>
        <ApparatusSet>
          <Layer depth={1}>
            {/* the track, as in S3 */}
            <div style={{position: 'absolute', left: -200, right: -200, top: 710, height: 26, background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13}} />
            {/* the EVIDENCE CHECK booth: closed in S3, now its shutter opens */}
            <div style={{position: 'absolute', left: 1180, top: 300, width: 420, height: 420, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 18}}>
              <div style={{position: 'absolute', left: -4, top: -4, width: 420, height: 70, background: C.teal, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.white}}>EVIDENCE CHECK</div>
              <div style={{position: 'absolute', left: 30, top: 100, width: 360, height: 290, background: C.paperDeep, border: `3px solid ${C.ink}`, borderRadius: 10, overflow: 'hidden'}}>
                {/* the record inside once the cart delivers it */}
                {cartT > 0.95 && (
                  <div style={{position: 'absolute', left: 30, top: 30, transform: 'scale(0.42)', transformOrigin: '0 0'}}>
                    <Evidence src="img/thesis_title_block.png" width={700} aspect={1386 / 3264} pad={16} tape={false} boxes={[{x: 0.03, y: 0.03, w: 0.94, h: 0.42, t: roomT, tone: 'teal'}]} />
                  </div>
                )}
                {/* shutter */}
                <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: `${(1 - shutter) * 100}%`, background: C.inkMuted, borderBottom: `4px solid ${C.ink}`}}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 14 + i * 44, height: 4, background: C.ink, opacity: 0.4}} />
                  ))}
                </div>
              </div>
            </div>
            {/* retrieval cart bringing the real record */}
            {cartT > 0 && cartT < 0.97 && (
              <div style={{position: 'absolute', left: cartX, top: 560}}>
                <div style={{position: 'absolute', left: 0, top: -20, transform: 'scale(0.5)', transformOrigin: '0 100%'}}>
                  <Evidence src="img/thesis_title_block.png" width={700} aspect={1386 / 3264} pad={16} tape={false} />
                </div>
                <svg viewBox="0 0 380 150" width={380} height={150} style={{position: 'absolute', left: 0, top: 0}}>
                  <rect x={10} y={20} width={360} height={60} rx={10} fill={C.wood} stroke={C.ink} strokeWidth={OUTLINE} />
                  <rect x={30} y={0} width={14} height={24} fill={C.ink} />
                  <circle cx={70} cy={110} r={28} fill={C.ink} />
                  <circle cx={70} cy={110} r={16} fill={C.cream} transform={`rotate(${cartX} 70 110)`} />
                  <circle cx={310} cy={110} r={28} fill={C.ink} />
                  <circle cx={310} cy={110} r={16} fill={C.cream} transform={`rotate(${cartX} 310 110)`} />
                  <text x={190} y={60} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={26} fill={C.cream}>RETRIEVAL</text>
                </svg>
              </div>
            )}
            {roomT > 0 && (
              <div style={{position: 'absolute', left: 1180, top: 740, width: 420, textAlign: 'center', opacity: roomT}}>
                <Chip tone="teal" size={24}>the real record is now in the room</Chip>
              </div>
            )}
            {/* reasoning bubble */}
            {bubbleT > 0 && (
              <Bubble thought t={bubbleT} width={520} style={{left: 560, top: 180}}>
                <span style={{fontFamily: F.body}}>step 1 → step 2 → step 3 → …</span>
                <div style={{marginTop: 8}}><Chip tone="paper" size={20}>reasoning · helps sometimes</Chip></div>
              </Bubble>
            )}
            {/* the randomness dial on the machine, and the three identical slips */}
            <div style={{position: 'absolute', left: 300, top: 330, width: 520, height: 380, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 24}}>
              <div style={{position: 'absolute', left: 24, top: 16, fontFamily: F.display, fontWeight: 700, fontSize: 26, color: C.white}}>ASSEMBLY</div>
              <Dial value={lerp(0.8, 0.1, dialT)} label="randomness" scale={1.1} style={{left: 160, top: 70}} />
              <div style={{position: 'absolute', left: 190, top: 300, fontFamily: F.body, fontWeight: 800, fontSize: 22, color: C.white, opacity: dialT}}>turned down</div>
            </div>
            {slipsT.map((t, i) =>
              t > 0 ? (
                <div key={i} style={{position: 'absolute', left: 790 + i * 70, top: 560 - i * 56, transform: `scale(${lerp(0.6, 0.62, t)}) rotate(${-2 + i * 2}deg)`, transformOrigin: '0 0', opacity: Math.min(1, t * 1.5)}}>
                  <Slip model={s.model} detail="same answer, again" width={560} fontSize={30} stamp={{text: 'Wrong', tone: 'coral', t: stampT[i]}}>
                    {s.pre}{s.year}{s.mid}{s.title}
                  </Slip>
                </div>
              ) : null,
            )}
          </Layer>
        </ApparatusSet>
      </Camera>
      {headT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 60, textAlign: 'center', opacity: headT}}>
          <Headline size={64} style={{display: 'inline-block', background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '12px 36px', boxShadow: `8px 10px 0 ${C.shadow}`}}>So what helps?</Headline>
        </div>
      )}
      {notT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', opacity: notT}}>
          <Chip tone="ink" size={30}>more consistent · not necessarily more correct</Chip>
        </div>
      )}
      {noneT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', transform: `scale(${noneT})`}}>
          <StampMark text="No guarantee" tone="coral" t={noneT} size={44} rotate={-3} />
        </div>
      )}
    </AbsoluteFill>
  );
};
