import React from 'react';
import {AbsoluteFill, Composition, Still} from 'remotion';
import {C, W, H, FPS} from './kit';
import {TOTAL} from './cues';
import {Film} from './Main';
import {auditCaptions} from './kit';
import {Character, IDLE} from './components/Character';
import {CAST} from './components/cast';
import './fonts';
import {TOTAL as TOTAL2} from './v2/cues';
import {Film2} from './v2/Film2';
import {auditCaptions2} from './v2/kit2';

/** Text-free portrait start plate for a later Runway attempt (native checker rig, medium close-up). */
const ReactionPlate: React.FC = () => {
  const s = 3.0;
  return (
    <AbsoluteFill style={{background: C.tealLight}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={380} cy={640} r={420} fill={C.cream} opacity={0.6} />
        <g transform={`translate(${540 - 200 * s} ${1330 - 500 * s})`}>
          <Character look={CAST.checker} pose={{...IDLE, mouth: 'flat', brows: 0.2, lookX: -0.5, lookY: 0.3, blink: 1}} frame={0} seed={5} x={200 * s} y={500 * s} scale={s} shadow={false} life={0} eyeDarts={false} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const AuditDummy: React.FC<{audit: unknown}> = () => null;

export const Root: React.FC = () => (
  <>
    <Composition id="CaptionAudit" component={AuditDummy} width={W} height={H} fps={FPS} durationInFrames={1} defaultProps={{audit: null as unknown}} calculateMetadata={async () => ({props: {audit: await auditCaptions()}})} />
    <Composition id="Short" component={Film} width={W} height={H} fps={FPS} durationInFrames={TOTAL} defaultProps={{captions: false, audio: true}} />
    <Composition id="ShortCaptioned" component={Film} width={W} height={H} fps={FPS} durationInFrames={TOTAL} defaultProps={{captions: true, audio: true}} />
    <Composition id="CaptionAuditV2" component={AuditDummy} width={W} height={H} fps={FPS} durationInFrames={1} defaultProps={{audit: null as unknown}} calculateMetadata={async () => ({props: {audit: await auditCaptions2()}})} />
    <Composition id="ShortV2" component={Film2} width={W} height={H} fps={FPS} durationInFrames={TOTAL2} defaultProps={{captions: false, audio: true}} />
    <Composition id="ShortV2Captioned" component={Film2} width={W} height={H} fps={FPS} durationInFrames={TOTAL2} defaultProps={{captions: true, audio: true}} />
    <Still id="ReactionPlate" component={ReactionPlate} width={W} height={H} />
  </>
);
