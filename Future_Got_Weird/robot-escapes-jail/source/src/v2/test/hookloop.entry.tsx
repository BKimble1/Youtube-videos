// H1 / J1 test entry (owner A).
//   cd source; npx remotion still src/v2/test/hookloop.entry.tsx H1 /tmp/claude-0/v2_hookloop/h1.png --frame=0 --log=error
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {resetIds} from '../../core/ids';
import {SHOTS2} from '../story2';
import {H1, J1} from '../shots/HookLoop';
import {FU} from '../shots/Future';
import {LB} from '../shots/LabEscape';
import {Captions} from '../../Captions';
import {capBox2} from '../shots';
import {DUR} from '../../lib';

const FPS = 30;
/** H1 / J1 plus the neighbours across the boundaries (LB after 3.40, FU before 27.90) for the boundary sheets */
const shotFor = (t: number) => (t < SHOTS2.H1[1] ? H1 : t < SHOTS2.LB[1] ? LB : t < SHOTS2.J1[0] ? FU : J1);

const One: React.FC<{t: number; captions?: boolean; tag: string}> = ({t, captions, tag}) => {
  resetIds(tag);
  const S = shotFor(t);
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <S t={t} />
      {captions && <Captions t={t} box={capBox2} />}
    </AbsoluteFill>
  );
};

/** a shot at its real film times */
const Shot: React.FC<{t0: number; captions?: boolean}> = ({t0, captions}) => {
  const f = useCurrentFrame();
  return <One t={t0 + f / FPS} captions={captions} tag={`s${f}_`} />;
};

/** contact sheet of film frames (cells 1080/cols wide) */
const Sheet: React.FC<{fs: number[]; cols: number; captions?: boolean}> = ({fs, cols, captions}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <One t={f / FPS} captions={captions} tag={`c${i}_`} />
          <div style={{position: 'absolute', left: 12, top: 8, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const range = (a: number, b: number, step = 1) => Array.from({length: Math.floor((b - a) / step) + 1}, (_, i) => a + i * step);
const LAST = Math.round(DUR * FPS) - 1; // 971
// the loop seam: film frames 960..971 then 0..12 (one sheet, 5 x 5)
const LOOP_FS = [...range(LAST - 11, LAST), ...range(0, 12)];
// H1 every 3 frames (102 frames -> 34) + J1 every 4 frames
const H1_FS = range(0, 101, 3);
const J1_FS = range(837, 971, 4);

// ---- exploration (frame-0 design): ?cam / state overrides
import {JailFrame} from '../shots/HookLoop';
import {camLook, HERO} from '../robot2';
import {GUARD_IDLE} from '../../art/guard';
const GUARD_IDLE_SIP = {...GUARD_IDLE, look: -0.5, sip: 0.3};
type EV = {p: number[]; at: number[]; f: number; u?: number; head?: number; press?: number; tau?: number; g?: number[]};
const Explore: React.FC<{vs: EV[]}> = ({vs}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {vs.map((v, i) => {
      resetIds(`e${i}_`);
      const cam = camLook({x: v.p[0], h: v.p[1], d: v.p[2]}, {x: v.at[0], h: v.at[1], d: v.at[2]}, v.f);
      return (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
          {v.tau !== undefined ? (
            <JailFrame tau={v.tau} escalated={v.tau < 0} ov={{cam}} guard={v.g ? {p: {x: v.g[0], h: v.g[1], d: v.g[2]}, act: GUARD_IDLE_SIP, t: v.tau + 32.4} : null} />
          ) : (
            <JailFrame tau={0} escalated={false} ov={{cam, state: {press: v.press ?? 1, soften: {head: v.head ?? 0, upper: 0, lower: 0}, squeeze: {gap: HERO.gap, out: HERO.out, u: v.u ?? 0}}}} />
          )}
        </div>
      );
    })}
  </AbsoluteFill>
);
export const ExploreRoot = () => <Composition id="Explore" component={Explore} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{vs: [] as EV[]}} />;

registerRoot(() => (
  <>
    <Composition id="H1" component={Shot} durationInFrames={Math.round((SHOTS2.H1[1] - SHOTS2.H1[0]) * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{t0: SHOTS2.H1[0]}} />
    <Composition id="J1" component={Shot} durationInFrames={Math.round((SHOTS2.J1[1] - SHOTS2.J1[0]) * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{t0: SHOTS2.J1[0]}} />
    <Composition id="H1cap" component={Shot} durationInFrames={Math.round((SHOTS2.H1[1] - SHOTS2.H1[0]) * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{t0: SHOTS2.H1[0], captions: true}} />
    <Composition id="J1cap" component={Shot} durationInFrames={Math.round((SHOTS2.J1[1] - SHOTS2.J1[0]) * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{t0: SHOTS2.J1[0], captions: true}} />
    {/* the loop as one take: J1 then H1 (film frames 837..971, 0..101) */}
    <Composition id="LoopTake" component={LoopTake} durationInFrames={135 + 102} fps={FPS} width={1080} height={1920} />
    <Composition id="SheetH1" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: H1_FS, cols: 6}} />
    <Composition id="SheetJ1" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: J1_FS, cols: 6}} />
    <Composition id="SheetLoop" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: LOOP_FS, cols: 5}} />
    <Composition id="SheetCap" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 40, 43, 46, 49, 54, 60, 72, 84, 93, 840, 852, 864, 876, 900, 915, 930, 945, 960, 971], cols: 5, captions: true}} />
    {/* boundaries: FU -> J1 (837..842), J1 -> H1 (968..971, 0..3), H1 -> LB (96..101) */}
    <ExploreRoot />
    {/* cross-shot boundaries: FU -> J1 (828..845, FU's own frames before 837) and H1 -> LB (96..107, LB from 102) */}
    <Composition id="SheetCross" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [...range(830, 845), ...range(94, 107)], cols: 7}} />
    <Composition id="SheetReform" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: range(30, 59), cols: 6}} />
    <Composition id="SheetBounds" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [837, 838, 839, 840, 841, 842, 968, 969, 970, 971, 0, 1, 2, 3, 96, 97, 98, 99, 100, 101], cols: 5}} />
  </>
));

function LoopTake() {
  const f = useCurrentFrame();
  const film = f < 135 ? 837 + f : f - 135;
  return <One t={film / FPS} tag={`l${f}_`} />;
}

