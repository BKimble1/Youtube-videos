import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, pop, ramp} from '../lib/anim';
import {C, F, FPS, OUTLINE} from '../theme';
import {Evidence} from '../components/Evidence';
import {Trophy} from '../components/Props';
import {Chip, Headline, Label, Sign} from '../components/Text';

// Table 2 of Kalai et al. 2025 (p. 14), fractional boxes on paper_p14_table2.png
const ROW0 = 0.286;
const ROWH = 0.0502;
const COL_BENCH = {x: 0.02, y: 0.235, w: 0.2, h: 0.555};
const COL_BIN = {x: 0.633, y: 0.235, w: 0.187, h: 0.555};
const COL_IDK = {x: 0.84, y: 0.235, w: 0.128, h: 0.555};

export const S7Benchmarks: React.FC = () => {
  const g = useG();
  const c26 = at('s26');
  const cTen = at('s26', 'ten');
  const cNine = at('s26', 'Nine');
  const cStrictly = at('s26', 'strictly');
  const cNoCredit = at('s26', 'no');
  const cTrain = at('s27', 'Train');
  const cPays = at('s27', 'pays.');
  const cOne = at('s27', "It's");
  const cSimple = at('s27', 'simple');
  const cEnd = segEnd('s27');

  const tableIn = pop(g, FPS, c26 - 4, 26);
  const benchT = ramp(g, cTen, 14);
  // row sweep while "nine" is counted: rows 0..9 over ~40 frames, WildBench (row 4) is the exception
  const sweepStart = cNine - 4;
  const sweepEnd = cStrictly + 20;
  const rowF = Math.max(-1, Math.min(9, Math.floor(((g - sweepStart) / Math.max(1, sweepEnd - sweepStart)) * 10)));
  const tally = rowF < 0 ? 0 : Array.from({length: rowF + 1}).filter((_, r) => r !== 4).length;
  const binT = ramp(g, cNine - 6, 14);
  const idkT = ramp(g, cNoCredit - 4, 14);
  const shift = ramp(g, cTrain - 6, 18, easeInOut);
  const boardT = pop(g, FPS, cTrain + 4, 26);
  const paysT = ramp(g, cPays - 4, 12);
  const oneT = ramp(g, cOne, 12);
  const simpleT = ramp(g, cSimple - 2, 10);
  const sceneOut = 1 - ramp(g, cEnd + 10, 8);

  const tableX = lerp(110, 90, shift);
  const tableW = lerp(1250, 1080, shift);

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.paper}}>
      {/* a big colour field behind the evidence */}
      <div style={{position: 'absolute', left: -200, top: -200, width: 2320, height: 560, background: C.tealLight, transform: 'rotate(-2deg)', transformOrigin: '50% 100%'}} />
      <div style={{position: 'absolute', left: tableX, top: 70, opacity: Math.min(1, tableIn * 1.5), transform: `scale(${lerp(0.9, 1, tableIn)})`, transformOrigin: '50% 0%'}}>
        <Evidence
          src="img/paper_p14_table2.png"
          width={tableW}
          aspect={2250 / 3933}
          pad={20}
          boxes={[
            ...(g >= sweepStart && g < sweepEnd + 6 ? [{x: 0.02, y: ROW0 + Math.max(0, rowF) * ROWH, w: 0.95, h: 0.044, t: 1, tone: (rowF === 4 ? 'ink' : 'teal') as 'ink' | 'teal', pad: 2}] : []),
            {...COL_BENCH, t: benchT * (1 - binT), tone: 'ink'},
            {...COL_BIN, t: binT, tone: 'teal'},
            {...COL_IDK, t: idkT, tone: 'coral'},
          ]}
          tag={<Chip tone="paper" size={22}>Kalai, Nachum, Vempala &amp; Zhang (2025), Table 2 · ten benchmarks sampled from major leaderboards, mid-2025 · CC BY 4.0</Chip>}
        />
      </div>
      {/* the tally */}
      {g >= sweepStart && (
        <div style={{position: 'absolute', left: lerp(1440, 1260, shift), top: 110}}>
          <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.tealDeep}}>
            {g < sweepEnd ? tally : 9}
            <span style={{fontSize: 70, color: C.inkMuted}}> / 10</span>
          </div>
          <Label size={30} color={C.ink} weight={800} style={{marginTop: 6, width: 440}}>graded strictly right or wrong</Label>
          <div style={{marginTop: 10, opacity: idkT}}>
            <Chip tone="coral" size={24}>no credit for “I don’t know”</Chip>
          </div>
          <Label size={22} color={C.inkMuted} weight={700} style={{marginTop: 12, width: 440}}>the tenth, WildBench, uses a rubric with partial credit</Label>
        </div>
      )}
      {/* leaderboard: train and rank on tests like that */}
      {boardT > 0 && (
        <div style={{position: 'absolute', left: 1240, top: 470, width: 600, transform: `scale(${boardT})`, transformOrigin: '50% 0%'}}>
          <Sign size={36} width={600} style={{boxSizing: 'border-box'}}>LEADERBOARD</Sign>
          <div style={{marginTop: 18, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 18, padding: '14px 18px', boxShadow: `6px 8px 0 ${C.shadow}`}}>
            {[
              {rank: '1', label: 'always answers', w: 0.96, tone: C.coral},
              {rank: '2', label: 'guesses often', w: 0.8, tone: C.saffron},
              {rank: '3', label: 'says “I don’t know”', w: 0.6, tone: C.inkMuted},
            ].map((r, i) => (
              <div key={r.rank} style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10}}>
                <div style={{width: 40, fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.ink}}>#{r.rank}</div>
                <div style={{flex: 1, position: 'relative', height: 34, background: C.paperDeep, border: `3px solid ${C.ink}`, borderRadius: 17, overflow: 'hidden'}}>
                  <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.w * 100 * ramp(g, cTrain + 10 + i * 6, 14)}%`, background: r.tone}} />
                </div>
                <div style={{width: 210, fontFamily: F.body, fontWeight: 800, fontSize: 22, color: C.inkSoft}}>{r.label}</div>
              </div>
            ))}
          </div>
          {paysT > 0 && (
            <div style={{position: 'absolute', right: -40, top: -60, transform: `scale(${paysT})`}}>
              <Trophy scale={0.9} />
            </div>
          )}
          <div style={{marginTop: 16, textAlign: 'center', opacity: paysT}}>
            <Chip tone="coral" size={26}>guessing pays · illustration</Chip>
          </div>
        </div>
      )}
      {oneT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 54, textAlign: 'center', opacity: oneT}}>
          <Chip tone="ink" size={28}>one explanation · not the whole story{simpleT > 0.5 ? ' · but a simple one' : ''}</Chip>
        </div>
      )}
    </AbsoluteFill>
  );
};
