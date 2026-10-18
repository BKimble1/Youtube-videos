// The episode timeline. Each shot is a pure function of the global time t (seconds); transitions blend neighbours.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from './theme';
import {FPS} from './cues';
import {Stage, Chip} from './kit/stage';
import {SideLaunch, T as TL, GO_T, launchCarX, CAM_DIAG} from './shots/SideLaunch';
import {FrontCorner, CORNER_IN, CORNER_OUT} from './shots/FrontCorner';
import {SideBrake, BRAKE_IN, BRAKE_HOLD, BRAKE_OUT, brakeCarScreenTail} from './shots/SideBrake';
import {FrontPassenger} from './shots/FrontPassenger';
import {SideClose, CLOSE_IN, MATCH_T} from './shots/SideClose';
import {RealClip, FOOTAGE} from './footage';
import {smooth, seg} from './kit/util';

export type MainProps = {audio: false | 'narration' | 'mix'};

/** Screen x of the side-view car's tail while it drives off (the wipe edge into the bend). */
const tailEdge = (t: number) => 960 + (launchCarX(t) - 2526 - CAM_DIAG.x) * CAM_DIAG.z;

export const Main: React.FC<MainProps> = ({audio}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const clipOut = 1 - smooth(seg(t, TL.suspension - 0.05, TL.suspension + 0.55));
  const edge = t > GO_T ? tailEdge(t) : -10;
  const showLaunch = t < GO_T + 1.4 && edge < 1930;
  const showCorner = t > CORNER_IN - 0.25 && t < BRAKE_IN;
  const bEdge = t > BRAKE_HOLD ? brakeCarScreenTail(t) : -10;
  const showBrake = t >= BRAKE_IN && t < BRAKE_OUT && bEdge < 1930;
  const showPass = t > BRAKE_HOLD && t < CLOSE_IN;
  const replayOut = 1 - smooth(seg(t, MATCH_T - 0.05, MATCH_T + 0.5));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {showLaunch && (
        <Stage>
          <SideLaunch t={t} />
        </Stage>
      )}
      {showCorner && (
        <AbsoluteFill style={{clipPath: showLaunch ? `inset(0 ${Math.max(0, 1920 - edge)}px 0 0)` : undefined}}>
          <Stage>
            <FrontCorner t={t} />
          </Stage>
        </AbsoluteFill>
      )}
      {showBrake && (
        <Stage>
          <SideBrake t={t} />
        </Stage>
      )}
      {showPass && (
        <AbsoluteFill style={{clipPath: showBrake ? `inset(0 ${Math.max(0, 1920 - bEdge)}px 0 0)` : undefined}}>
          <Stage>
            <FrontPassenger t={t} frame={f} />
          </Stage>
        </AbsoluteFill>
      )}
      {t >= CLOSE_IN && (
        <Stage>
          <SideClose t={t} />
        </Stage>
      )}
      {t >= CLOSE_IN && t < MATCH_T + 0.6 && (
        <Sequence from={Math.round(CLOSE_IN * FPS)} durationInFrames={Math.ceil((MATCH_T + 0.6 - CLOSE_IN) * FPS)}>
          <RealClip from={FOOTAGE.replay.from} t0={CLOSE_IN} t={t} opacity={replayOut} />
        </Sequence>
      )}
      {t < TL.suspension + 0.6 && (
        <Sequence from={0} durationInFrames={Math.ceil((TL.suspension + 0.6) * FPS)}>
          <RealClip from={FOOTAGE.opening.from} t0={0} t={t} opacity={clipOut} />
        </Sequence>
      )}
      {/* source credit on the first use of the real clip */}
      {t < TL.suspension + 0.6 && (
        <Stage bg="transparent">
          <Chip x={40} y={1000} text={FOOTAGE.credit.toUpperCase()} opacity={clipOut * Math.min(1, t / 0.25)} size={24} />
        </Stage>
      )}
      {audio === 'narration' && <Audio src={staticFile('audio/narration.mp3')} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix.mp3')} />}
    </AbsoluteFill>
  );
};
