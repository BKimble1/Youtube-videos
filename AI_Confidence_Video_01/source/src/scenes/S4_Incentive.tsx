import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {Doc} from '../components/Doc';
import {Headline, SourceLine, Tag} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, ramp} from '../lib/anim';
import {C, F} from '../theme';

type CellState = 'empty' | 'known' | 'idk' | 'guessing' | 'lucky' | 'wrong';

const Cell: React.FC<{state: CellState; t: number; g: number; i: number; penalty: number; pulse: number}> = ({state, t, g, i, penalty, pulse}) => {
  const styles: Record<CellState, {bg: string; border: string; color: string; glyph: string}> = {
    empty: {bg: 'transparent', border: C.line, color: C.muted, glyph: ''},
    known: {bg: 'rgba(60,201,180,0.14)', border: 'rgba(60,201,180,0.65)', color: C.teal, glyph: '✓'},
    idk: {bg: 'rgba(133,146,168,0.12)', border: C.lineStrong, color: C.textDim, glyph: '?'},
    guessing: {bg: 'rgba(243,238,228,0.06)', border: C.lineStrong, color: C.text, glyph: 'ABCD'[Math.floor(g / 3 + i) % 4]},
    lucky: {bg: 'rgba(60,201,180,0.14)', border: 'rgba(60,201,180,0.65)', color: C.teal, glyph: '✓'},
    wrong: {bg: `rgba(255,111,94,${0.14 + 0.18 * pulse})`, border: C.coral, color: C.coral, glyph: '✕'},
  };
  const s = styles[state];
  return (
    <div style={{position: 'relative', width: 96, height: 96}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 14, border: `2px solid ${C.line}`}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          background: s.bg,
          border: `2px solid ${s.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: state === 'guessing' ? F.mono : F.sans,
          fontWeight: 700,
          fontSize: state === 'guessing' ? 40 : 48,
          color: s.color,
          opacity: t,
          transform: `scale(${lerp(0.7, 1, t)})`,
        }}
      >
        {s.glyph}
      </div>
      {state === 'wrong' && penalty > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: -44 - 10 * penalty, textAlign: 'center', fontFamily: F.mono, fontSize: 30, fontWeight: 700, color: C.coral, opacity: penalty}}>
          −1
        </div>
      )}
    </div>
  );
};

const Rule: React.FC<{glyph: string; label: string; value: string; t: number; tone: string; flip?: number; newValue?: string}> = ({glyph, label, value, t, tone, flip = 0, newValue}) => {
  const showNew = flip > 0.5;
  const rot = flip <= 0.5 ? flip * 180 : (flip - 1) * 180;
  return (
    <div
      style={{
        width: 380,
        height: 120,
        borderRadius: 18,
        background: C.surface,
        border: `1.5px solid ${flip > 0 && flip < 1 ? C.text : showNew ? C.coral : C.lineStrong}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 20,
        opacity: t,
        transform: `translateY(${(1 - t) * 20}px) perspective(800px) rotateX(${rot}deg)`,
      }}
    >
      <div style={{fontFamily: F.sans, fontSize: 40, fontWeight: 700, color: tone, width: 44, textAlign: 'center'}}>{glyph}</div>
      <div style={{flex: 1, fontFamily: F.sans, fontSize: 30, fontWeight: 600, color: C.text}}>{label}</div>
      <div style={{fontFamily: F.mono, fontSize: 44, fontWeight: 700, color: showNew ? C.coral : C.text}}>{showNew ? newValue : value}</div>
    </div>
  );
};

export const S4Incentive: React.FC = () => {
  const g = useG();
  const c0 = at('s22');
  const cArgue = at('s22', 'argue');
  const cPicture = at('s23', 'Picture');
  const cRight = at('s23', 'Right');
  const cWrong = at('s23', 'Wrong');
  const cIdk = at('s23', 'also');
  const cTwo = at('s24', 'Two');
  const cSix = at('s24', 'six');
  const cRest = at('s24', 'rest.');
  const cSixPts = at('s24', 'Six');
  const cShot = at('s25', 'shot');
  const cLands = at('s25', 'lands.');
  const cSeven = at('s25', 'Seven');
  const cWins = at('s25', 'wins,');
  const cThree = at('s25', 'three');
  const cChange = at('s26', 'change');
  const cCosts = at('s26', 'costs');
  const cStill = at('s27', 'still');
  const cPlus = at('s27', 'plus');
  const cMinus = at('s27', 'minus');
  const cFour = at('s27', 'Four.');
  const cLoses = at('s27', 'loses.');
  const cChecked = at('s28', 'checked');
  const cNine = at('s28', 'nine');
  const cZero = at('s28', 'zero');
  const cFix = at('s29', 'fix:');
  const cOne = at('s29', 'one');
  const cEnd = segEnd('s29');

  const photoT = ramp(g, c0 - 10, 20) * (1 - ramp(g, cPicture - 6, 14));
  const argueT = ramp(g, cArgue, 12);
  const quizIn = ramp(g, cPicture - 4, 16);
  const quizOut = ramp(g, cChecked - 6, 14);

  const rightT = ramp(g, cRight, 12);
  const wrongT = ramp(g, cWrong, 12);
  const idkT = ramp(g, cIdk - 4, 12);
  const flip = ramp(g, cCosts, 18, easeInOut);
  const rulePulse = ramp(g, cChange, 10) * (1 - ramp(g, cStill, 10));

  const rowsIn = ramp(g, cTwo, 16);
  const knownT = (k: number) => ramp(g, cSix + k * 2, 10);
  const idkCells = (k: number) => ramp(g, cRest + k * 2, 10);
  const honestScore = g >= cSixPts ? 6 : null;

  const guessPhase = g >= cShot && g < cLands;
  const guessResolved = g >= cLands;
  const guesserScore = g >= cFour ? 4 : g >= cSeven ? 7 : g >= cSixPts ? null : null;
  const penaltyT = (k: number) => ramp(g, cMinus + k * 4, 10);
  const wrongPulse = ramp(g, cThree, 8) * (1 - ramp(g, cThree + 24, 12));
  const winBadge = g >= cWins && g < cLoses ? 'guesser' : g >= cLoses ? 'honest' : null;
  const eqT = ramp(g, cPlus - 6, 12);

  const tableIn = ramp(g, cChecked, 18);
  const colBin = ramp(g, cNine, 16);
  const colIdk = ramp(g, cZero, 16);
  const tableOut = ramp(g, cFix - 6, 14);
  const instrIn = ramp(g, cFix, 18);
  const oneT = ramp(g, cOne, 14);
  const sceneOut = 1 - ramp(g, cEnd + 18, 10);

  const row = (who: 'honest' | 'guesser', y: number) => {
    const cells: {state: CellState; t: number}[] = [];
    for (let k = 0; k < 10; k++) {
      if (k < 6) cells.push({state: 'known', t: knownT(k)});
      else if (who === 'honest') cells.push({state: g >= cRest ? 'idk' : 'empty', t: g >= cRest ? idkCells(k - 6) : 1});
      else if (guessResolved) cells.push({state: k === 6 ? 'lucky' : 'wrong', t: ramp(g, cLands + (k - 6) * 3, 10)});
      else if (guessPhase) cells.push({state: 'guessing', t: 1});
      else cells.push({state: 'empty', t: 1});
    }
    const score = who === 'honest' ? honestScore : guesserScore;
    const winner = winBadge === who;
    return (
      <div style={{position: 'absolute', left: 110, top: y, display: 'flex', alignItems: 'center', opacity: rowsIn}}>
        <div style={{width: 230}}>
          <div style={{fontFamily: F.sans, fontSize: 34, fontWeight: 750, color: C.text, letterSpacing: '0.02em'}}>{who === 'honest' ? 'Honest' : 'Guesser'}</div>
          <div style={{fontFamily: F.sans, fontSize: 21, color: C.muted, marginTop: 4}}>{who === 'honest' ? 'says “I don’t know”' : 'always answers'}</div>
        </div>
        <div style={{display: 'flex', gap: 14}}>
          {cells.map((c, k) => (
            <Cell key={k} state={c.state} t={c.t} g={g} i={k} penalty={who === 'guesser' && k > 6 ? penaltyT(k - 7) : 0} pulse={who === 'guesser' ? wrongPulse : 0} />
          ))}
        </div>
        <div style={{width: 330, marginLeft: 40, display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{fontFamily: F.mono, fontSize: 84, fontWeight: 700, color: C.text, width: 110, textAlign: 'right'}}>{score ?? ''}</div>
          <div style={{opacity: winner ? 1 : 0}}>
            <Tag tone="slate" size={20} style={{color: C.text, borderColor: C.text}}>
              ▲ Higher score
            </Tag>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Backdrop />

      {/* Real-world anchor: a 1929 test booklet (cropped to its title) */}
      <AbsoluteFill style={{opacity: photoT}}>
        <div
          style={{
            position: 'absolute',
            left: 1010,
            top: 250,
            width: 800,
            padding: 16,
            background: '#F3EFE6',
            borderRadius: 6,
            boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
            transform: `rotate(${lerp(-1.2, -2.2, ramp(g, c0, 160, (x) => x))}deg) scale(${lerp(0.98, 1.03, ramp(g, c0, 160, (x) => x))})`,
          }}
        >
          <Img src={staticFile('img/photo_test_booklet_1929_title.jpg')} style={{width: 768, height: 768 * (2199 / 3840), objectFit: 'cover', display: 'block', filter: 'sepia(0.15)'}} />
          <div style={{fontFamily: F.sans, fontSize: 18, color: C.inkDim, marginTop: 10}}>1929 test workbook (cover, cropped)</div>
        </div>
        <div style={{position: 'absolute', left: 120, top: 330, width: 820}}>
          <Headline size={92}>
            Why not just say
            <br />
            “I don’t know”?
          </Headline>
          <div style={{marginTop: 44, opacity: argueT}}>
            <Tag tone="teal">The researchers’ argument: grading</Tag>
          </div>
        </div>
        <SourceLine opacity={photoT}>Photo: “Sharp’s Language Drills and Tests,” 1929 workbook · Smithsonian NMAAHC (CC0)</SourceLine>
      </AbsoluteFill>

      {/* The quiz */}
      <AbsoluteFill style={{opacity: quizIn * (1 - quizOut)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 54, display: 'flex', justifyContent: 'center'}}>
          <Tag tone="slate" dashed>Analogy · toy numbers, not model data</Tag>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', justifyContent: 'center', gap: 28}}>
          <Rule glyph="✓" label="Right" value="+1" t={rightT} tone={C.teal} />
          <div style={{transform: `scale(${1 + 0.05 * rulePulse})`}}>
            <Rule glyph="✕" label="Wrong" value="0" t={wrongT} tone={C.coral} flip={flip} newValue="−1" />
          </div>
          <Rule glyph="?" label="I don’t know" value="0" t={idkT} tone={C.textDim} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontFamily: F.sans, fontSize: 26, color: C.muted, opacity: rowsIn}}>
          10 questions · both know the same 6 answers · 4 choices per question
        </div>
        {row('honest', 390)}
        {row('guesser', 600)}
        <div style={{position: 'absolute', left: 1440, top: 712, fontFamily: F.mono, fontSize: 30, color: C.textDim, opacity: eqT}}>
          6 + 1 − 3 = 4
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 820,
            textAlign: 'center',
            fontFamily: F.sans,
            fontSize: 38,
            fontWeight: 650,
            color: g >= cLoses ? C.text : C.coral,
            opacity: ramp(g, cThree, 12) * (1 - ramp(g, cChange - 4, 10)) + ramp(g, cLoses, 12),
          }}
        >
          {g >= cLoses ? 'Change the scoring, and bluffing stops paying.' : 'Higher score, with three confident wrong answers.'}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 890, textAlign: 'center', fontFamily: F.sans, fontSize: 24, color: C.muted, opacity: ramp(g, cLands, 12)}}>
          On average, 1 of 4 blind guesses lands (each has a 1-in-4 chance).
        </div>
      </AbsoluteFill>

      {/* Real evidence: Table 2 */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: tableIn * (1 - tableOut)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 60}}>
          <Doc
            src="img/paper_p14_table2.png"
            width={1080}
            aspect={1125 / 1967}
            boxes={[
              {x: 0.63, y: 0.22, w: 0.19, h: 0.6, t: colBin, tone: 'teal'},
              {x: 0.835, y: 0.22, w: 0.14, h: 0.6, t: colIdk, tone: 'teal'},
            ]}
          />
          <div style={{width: 520}}>
            <div style={{fontFamily: F.mono, fontSize: 110, fontWeight: 700, color: C.text, opacity: colBin}}>9 / 10</div>
            <div style={{fontFamily: F.sans, fontSize: 32, fontWeight: 600, color: C.textDim, opacity: colBin, lineHeight: 1.3}}>
              popular benchmarks graded strictly right-or-wrong
            </div>
            <div style={{marginTop: 34, fontFamily: F.sans, fontSize: 32, fontWeight: 600, color: C.textDim, opacity: colIdk, lineHeight: 1.3}}>
              …and those nine give <span style={{color: C.text, fontWeight: 750}}>no credit</span> for “I don’t know”
            </div>
          </div>
        </div>
        <SourceLine opacity={tableIn}>Kalai et al. (2025), Table 2 (p. 14) · the tenth, WildBench, uses a rubric that gives partial credit · CC BY 4.0</SourceLine>
      </AbsoluteFill>

      {/* The proposal */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: instrIn}}>
        <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: C.muted, marginBottom: 30}}>THE AUTHORS’ PROPOSAL: SAY THE PENALTY UP FRONT</div>
        <Doc src="img/paper_p13_instruction.png" width={1500} aspect={171 / 1850} boxes={[{x: 0.415, y: 0.05, w: 0.395, h: 0.42, t: ramp(g, cFix + 12, 16), tone: 'teal'}]} />
        <div style={{marginTop: 54, display: 'flex', gap: 24, opacity: oneT}}>
          <Tag tone="slate">One explanation · not the whole story</Tag>
        </div>
        <SourceLine opacity={instrIn}>Kalai et al. (2025), Section 4.2 (p. 13) · CC BY 4.0</SourceLine>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
