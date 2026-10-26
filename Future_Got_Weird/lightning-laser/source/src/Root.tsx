import React from 'react';
import {AbsoluteFill, Still} from 'remotion';
import './fonts';
import {FPS, FRAMES, H, W} from './lib';
import {Composition} from 'remotion';
import {Film, FilmStill, Sheet} from './Film';
import {Man} from './dc/Man';
import {SiteWorld} from './scenes/Site';
import {Skeleton} from './art/Skeleton';
import {ShotTest, Test3D} from './v2/Test3D';
import {FilmStillV2, FilmV2, SheetV2} from './v2/Film2';
import {CamTest3} from './v3/Test3';
import {CamSeq3} from './v3/CamSeq3';
import {FilmStillV3, FilmV3, QuadV3, SheetV3} from './v3/Film3';
import {BOLT, CAM0, loopS} from './world/site';
import {BASE, E_FOCUS, E_FRAZZLED, E_JOLT, E_TRACK, E_WARY, H_REST, LEAD, OPERATOR, P} from './cast';

const CastSheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#3A4E5C'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {[
        {o: LEAD, e: E_WARY, x: 270, y: 760},
        {o: LEAD, e: E_FRAZZLED, x: 800, y: 760},
        {o: OPERATOR, e: E_FOCUS, x: 270, y: 1700},
        {o: OPERATOR, e: E_TRACK, x: 800, y: 1700},
      ].map((c, i) => (
        <g key={i}>
          <Man id={`cs${i}`} pose={P({x: c.x, y: c.y + 260, s: 1.25, lTu: -280, lTv: -30, rTu: -270, rTv: 20})} expr={c.e} lHand={H_REST} rHand={H_REST} outfit={c.o} />
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);

const SiteTest: React.FC<{cams: {x: number; y: number; z: number}[]; s: number; flash: number}> = ({cams, s, flash}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {cams.map((cam, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 2) * 540, top: Math.floor(i / 2) * 960, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <SiteWorld id={`st${i}`} cam={cam} st={{boltS: s, boltCore: 1, flash, beam: 0.9, pulses: [-700, -500, -300, -100, 100], channel: 0.8, tau: 0, rainT: 0.5, drift: 0}} />
        </svg>
      </div>
    ))}
  </AbsoluteFill>
);

const PoseTest: React.FC<{ps: Record<string, number>[]; op: boolean; skel?: boolean}> = ({ps, op, skel}) => (
  <AbsoluteFill style={{backgroundColor: '#3A4E5C'}}>
    {ps.map((q, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 2) * 540, top: Math.floor(i / 2) * 640, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <g transform={op ? 'translate(1080 0) scale(-1 1)' : undefined}>
            <Man id={`pt${i}`} pose={P({x: 540, y: 820, s: 0.95, ...q})} expr={E_WARY} lHand={H_REST} rHand={H_REST} outfit={op ? OPERATOR : LEAD} />
            {skel && <g opacity={0.75}><Skeleton pose={P({x: 540, y: 820, s: 0.95, ...q})} /></g>}
          </g>
          <text x={20} y={80} fontSize={60} fill="#FF0">{i}</text>
        </svg>
      </div>
    ))}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LightningLaser" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="PoseTest" component={PoseTest} width={W} height={1920} defaultProps={{ps: [{}], op: false, skel: false}} />
    <Composition id="LightningLaserV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="FilmStillV2" component={FilmStillV2} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="SheetV2" component={SheetV2} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="ShotTest" component={ShotTest} width={W} height={1280} defaultProps={{items: [{id: 'H1', t: 0}]}} />
    <Still id="Test3D" component={Test3D} width={W} height={1280} defaultProps={{names: ['Hf', 'Hk', 'H2e', 'E1g', 'T2', 'W'], sFrac: 0.7, flash: 0.5}} />
    <Composition id="LightningLaserV3" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="FilmStillV3" component={FilmStillV3} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="SheetV3" component={SheetV3} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="QuadV3" component={QuadV3} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: true}} />
    <Still id="CamTest3" component={CamTest3} width={W} height={1920} defaultProps={{items: [{cam: [-22, 108, -22, 14, 168, 0, 640, -8], st: 'open', t: 0}]}} />
    <Still id="CamSeq3" component={CamSeq3} width={W} height={1920} defaultProps={{items: [{which: 'open', t: 0}]}} />
    <Still id="CastSheet" component={CastSheet} width={W} height={1920} />
    <Still id="SiteTest" component={SiteTest} width={W} height={1920} defaultProps={{cams: [{x: 540, y: 960, z: 1}, {x: 400, y: 1640, z: 2.6}, {x: CAM0.x, y: CAM0.y, z: CAM0.z}, {x: 720, y: 640, z: 2.6}], s: 700, flash: 0.5}} />
  </>
);
