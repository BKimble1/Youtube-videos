// The film: which world is on screen at time t. Cuts are deliberate (a new representation or a new place); every
// move within a world is a continuous camera path.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {RoomShot} from './scenes/roomShots';
import {ROOM_END} from './scenes/roomShots';
import {ProductShot, PRODUCT_END} from './scenes/product';
import {SectionShot} from './scenes/section';
import {SplitShot, SPLIT_START, SPLIT_END} from './scenes/split';
import {AssistShot, ASSIST_START, ASSIST_END} from './scenes/assist';
import {T} from './story';
import {FPS} from './lib';

export const SECTION2_START = T.press - 0.08;
export const SECTION2_END = T.click + 0.08;
export const SHOTS: {name: string; a: number; b: number}[] = [
  {name: 'room-hook', a: 0, b: ROOM_END},
  {name: 'product', a: ROOM_END, b: PRODUCT_END},
  {name: 'section-roof', a: PRODUCT_END, b: SPLIT_START},
  {name: 'split-move', a: SPLIT_START, b: SPLIT_END},
  {name: 'room-aim', a: SPLIT_END, b: SECTION2_START},
  {name: 'section-press', a: SECTION2_START, b: SECTION2_END},
  {name: 'room-click', a: SECTION2_END, b: ASSIST_START},
  {name: 'assist', a: ASSIST_START, b: ASSIST_END},
  {name: 'room-twist-versus', a: ASSIST_END, b: 99},
];

export const Frame: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = SHOTS.find((q) => t >= q.a && t < q.b) ?? SHOTS[SHOTS.length - 1];
  switch (s.name) {
    case 'product': return <ProductShot t={t} />;
    case 'section-roof': return <SectionShot t={t} part={1} />;
    case 'split-move': return <SplitShot t={t} />;
    case 'section-press': return <SectionShot t={t} part={2} />;
    case 'assist': return <AssistShot t={t} frame={frame} />;
    default: return <RoomShot t={t} frame={frame} />;
  }
};

export const Film: React.FC<{audio?: string | false}> = ({audio}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#1B1D33'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Frame t={t} frame={frame} />
      </svg>
      {audio ? <Audio src={staticFile(`audio/${audio}.wav`)} /> : null}
    </AbsoluteFill>
  );
};
