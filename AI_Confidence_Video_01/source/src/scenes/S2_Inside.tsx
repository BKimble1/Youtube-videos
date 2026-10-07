import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {AnswerCard, MarkedText} from '../components/cards';
import {SourceLine, Tag} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, easeOut, inOut, lerp, ramp, rand} from '../lib/anim';
import {C, F} from '../theme';
import tok from '../data/tokens_gpt4o_sentence.json';

const TOKENS = tok.tokens as {id: number; text: string}[];
const PREFIX = 15; // tokens up to and including "200" (index 14)
const ROW1 = 10; // first row: "Adam" … " dissertation"

// Illustrative next-token scores after "… completed in 200". NOT measured from GPT-4o.
const CANDS = [
  {t: '2', p: 0.31},
  {t: '1', p: 0.26},
  {t: '0', p: 0.12},
  {t: '5', p: 0.09},
  {t: '3', p: 0.07},
  {t: '4', p: 0.05},
];

const visibleText = (s: string) => (s === ' ' ? '␣' : s.replace(/^ /, ''));
const hasLeadingSpace = (s: string) => s.length > 1 && s.startsWith(' ');
const FRAGMENTS = new Set([1, 2, 3, 4, 5, 6, 7, 14, 15, 17, 18]);

const TokenTile: React.FC<{
  text: string;
  id: number;
  split: number; // 0 = plain text, 1 = tile
  showId: number;
  frag: number; // fragment emphasis 0..1
  teal: number; // teal emphasis 0..1
  size: number;
  opacity?: number;
}> = ({text, id, split, showId, frag, teal, size, opacity = 1}) => {
  const pad = lerp(0, size * 0.22, split);
  const border = teal > 0 ? `rgba(60,201,180,${0.25 + 0.75 * teal})` : `rgba(226,232,240,${0.2 * split + 0.25 * frag})`;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity, margin: `0 ${lerp(0, size * 0.09, split)}px`}}>
      <div
        style={{
          position: 'relative',
          padding: `${pad * 0.55}px ${pad}px`,
          borderRadius: size * 0.18,
          background: `rgba(27,41,71,${0.95 * split})`,
          border: `${2 * split + teal * 1.5}px solid ${border}`,
          boxShadow: teal > 0 ? `0 0 ${24 * teal}px rgba(60,201,180,${0.35 * teal})` : 'none',
          fontFamily: F.serif,
          fontSize: size,
          lineHeight: 1.15,
          color: C.text,
          whiteSpace: 'pre',
        }}
      >
        {hasLeadingSpace(text) && split > 0.05 && (
          <span
            style={{
              position: 'absolute',
              left: pad * 0.32,
              top: '50%',
              width: size * 0.13,
              height: size * 0.13,
              marginTop: -size * 0.065,
              borderRadius: '50%',
              background: C.textDim,
              opacity: split,
            }}
          />
        )}
        {split < 0.05 ? text : visibleText(text)}
      </div>
      <div
        style={{
          marginTop: 10,
          height: 26,
          fontFamily: F.mono,
          fontSize: 21,
          color: C.muted,
          opacity: showId,
          transform: `translateY(${(1 - showId) * -8}px)`,
        }}
      >
        {id}
      </div>
    </div>
  );
};

export const S2Inside: React.FC = () => {
  const g = useG();
  // ---- cue frames (global) ----
  const cStart = at('s08');
  const cBegan = at('s08', 'answer.');
  const cTokens = at('s09', 'tokens');
  const cFrag = at('s09', 'fragments');
  const cKalai = at('s09', 'Kalai');
  const cNumber = at('s10', 'number');
  const cTurns = at('s10', 'turns');
  const cScores = at('s10', 'scores');
  const cChoosing = at('s11', 'choosing');
  const cPicked = at('s11', 'picked');
  const cAdded = at('s11', 'added');
  const cLoop = at('s11', 'loop');
  const cEnd = segEnd('s11') + 8;

  // ---- phase values ----
  const cardIn = ramp(g, cStart - 12, 10);
  const dimRest = ramp(g, cBegan, 14);
  const split = ramp(g, cTokens, 22, easeInOut);
  const cardFade = 1 - ramp(g, cTokens - 10, 8);
  const fragT = ramp(g, cFrag, 12) * (1 - ramp(g, cKalai, 10));
  const tealT = ramp(g, cKalai, 12) * (1 - ramp(g, cNumber - 6, 8));
  const idT = ramp(g, cNumber, 14);
  const toContext = ramp(g, cTurns, 26, easeInOut); // tokens move up, suffix fades
  const ctxIn = ramp(g, cTurns + 10, 22);
  const scoresIn = ramp(g, cScores, 18);
  const slotHi = ramp(g, cChoosing, 12);
  const pickT = ramp(g, cPicked, 22, easeInOut);
  const flyT = ramp(g, cAdded, 16, easeInOut);
  const loopT = ramp(g, cLoop, 10);
  const out = 1 - ramp(g, cEnd - 10, 12);

  // Tile size shrinks as tokens move to the top strip
  const size = lerp(60, 40, toContext);
  const rowsY = lerp(380, 150, toContext);

  // Loop: after the "2" lands, append the remaining tokens quickly (illustrative)
  const loopStep = 7; // frames per appended token
  const appended = g < cLoop + 6 ? 0 : Math.min(TOKENS.length - (PREFIX + 1), Math.floor((g - cLoop - 6) / loopStep) + 1);
  const shownCount = PREFIX + (flyT > 0.98 ? 1 : 0) + appended; // number of tokens in the strip

  const renderRow = (from: number, to: number) => (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-start'}}>
      {TOKENS.slice(from, to).map((t, k) => {
        const i = from + k;
        const isSuffix = i >= PREFIX;
        // during the context phase, suffix tokens fade out, then re-appear as they are generated
        let op = 1;
        if (isSuffix) {
          const fadeOut = 1 - ramp(g, cTurns, 14);
          const reappear = i < shownCount ? ramp(g, i === PREFIX ? cAdded + 14 : cLoop + 6 + (i - PREFIX - 1) * loopStep, 5) : 0;
          op = Math.max(fadeOut, reappear);
        }
        return (
          <TokenTile
            key={i}
            text={t.text}
            id={t.id}
            split={split}
            showId={idT}
            frag={FRAGMENTS.has(i) ? fragT : 0}
            teal={i === 3 || i === 4 ? tealT : 0}
            size={size}
            opacity={op}
          />
        );
      })}
    </div>
  );

  // Estimated strip width so the growing sentence always fits on screen
  const tileW = (t: string) => visibleText(t).length * size * 0.53 + size * 0.44 + size * 0.18 + 4;
  const stripCount = Math.max(PREFIX, shownCount);
  const stripW = TOKENS.slice(0, stripCount).reduce((a, t) => a + tileW(t.text), 0);
  const stripScale = Math.min(1, 1800 / stripW);
  const prefixW = TOKENS.slice(0, PREFIX).reduce((a, t) => a + tileW(t.text), 0) * Math.min(1, 1800 / stripW);
  const slotX = 960 + prefixW / 2 + 22;
  const slotY = 150;

  // Context matrix (simplified): one column per prefix token, seeded intensities
  const cols = Math.min(shownCount, TOKENS.length);
  const ctxX = 160;
  const ctxY = 470;
  const cell = 22;

  // pick sweep: highlight index moves over candidates and settles on index 0 ("2")
  const sweepPos = pickT < 1 ? Math.floor(interpolate(pickT, [0, 1], [0, CANDS.length * 2 - 1], {easing: easeOut})) % CANDS.length : 0;
  const settled = pickT >= 1;

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Backdrop glow={{x: 960, y: 520, color: 'rgba(60,140,200,0.35)', size: 1300, opacity: 0.12}} />

      {/* The real answer card, which the sentence is lifted from */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: cardIn * cardFade}}>
        <div style={{transform: `translateY(${(1 - cardIn) * 30}px) scale(${lerp(0.96, 1.03, dimRest)})`}}>
          <AnswerCard model="ChatGPT" detail="GPT-4o · excerpt as published in Table 1" width={1380}>
            <MarkedText
              spans={[
                {text: 'Adam Tauman Kalai’s Ph.D. dissertation (completed in 2002 at CMU) is entitled: '},
                {text: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”', mark: 'dim', markT: dimRest},
              ]}
            />
          </AnswerCard>
        </div>
      </AbsoluteFill>

      {/* Token strip: the same sentence, split by the real tokenizer */}
      <div style={{position: 'absolute', left: 0, right: 0, top: rowsY, opacity: ramp(g, cTokens - 3, 8)}}>
        {toContext < 0.5 ? (
          <>
            {renderRow(0, ROW1)}
            <div style={{height: lerp(14, 8, toContext)}} />
            {renderRow(ROW1, TOKENS.length)}
          </>
        ) : (
          // single strip once tokens have moved up: prefix + generated tokens
          <div style={{transform: `scale(${lerp(0.9, 1, ramp(g, cTurns + 13, 10)) * stripScale})`, transformOrigin: '50% 0%'}}>
            {renderRow(0, Math.max(PREFIX, shownCount))}
          </div>
        )}
      </div>

      {/* Labels for the split */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 735, display: 'flex', justifyContent: 'center', gap: 22, opacity: ramp(g, cTokens + 14, 14) * (1 - toContext)}}>
        <Tag tone="slate" caps={false}>Real split · GPT-4o’s tokenizer (o200k_base)</Tag>
        <Tag tone="slate" dashed caps={false}>
          <span style={{display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: C.textDim}} /> = starts with a space · ␣ = a space on its own
        </Tag>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 820,
          textAlign: 'center',
          fontFamily: F.sans,
          fontSize: 40,
          fontWeight: 650,
          color: C.teal,
          opacity: tealT,
        }}
      >
        one word, two tokens: “Kal” + “ai”
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 820,
          textAlign: 'center',
          fontFamily: F.sans,
          fontSize: 36,
          fontWeight: 600,
          color: C.textDim,
          opacity: idT * (1 - toContext),
        }}
      >
        To the model, each token is a number.
      </div>

      {/* Context matrix */}
      <div style={{position: 'absolute', left: ctxX, top: ctxY - 80, opacity: ctxIn}}>
        <div style={{fontFamily: F.sans, fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: C.textDim, marginBottom: 18}}>
          CONTEXT → NUMBERS
          <span style={{marginLeft: 14, fontWeight: 500, letterSpacing: '0.04em', color: C.muted}}>(simplified)</span>
        </div>
        <svg width={cols * (cell + 6) + 40} height={12 * (cell + 6) + 10}>
          {Array.from({length: cols}).map((_, ci) =>
            Array.from({length: 12}).map((__, ri) => {
              const v = rand(ci * 97 + ri * 13 + 5);
              const appear = ci < PREFIX ? ramp(g, cTurns + 10 + ci * 1.2, 10) : ramp(g, ci === PREFIX ? cAdded + 14 : cLoop + 6 + (ci - PREFIX - 1) * loopStep, 5);
              return (
                <rect
                  key={`${ci}-${ri}`}
                  x={ci * (cell + 6)}
                  y={ri * (cell + 6)}
                  width={cell}
                  height={cell}
                  rx={4}
                  fill={`rgba(${lerp(70, 60, v)},${lerp(110, 201, v)},${lerp(170, 180, v)},${(0.15 + 0.75 * v) * appear})`}
                />
              );
            }),
          )}
        </svg>
      </div>

      {/* Arrow from context to scores */}
      <svg style={{position: 'absolute', left: 0, top: 0}} width={1920} height={1080}>
        <path
          d={`M ${Math.min(990, ctxX + cols * (cell + 6) + 24)} 640 L 1010 640`}
          stroke={C.lineStrong}
          strokeWidth={3}
          fill="none"
          strokeDasharray={600}
          strokeDashoffset={600 * (1 - scoresIn)}
        />
        <path d="M 996 628 L 1012 640 L 996 652" stroke={C.lineStrong} strokeWidth={3} fill="none" opacity={scoresIn} />
        {/* loop arrow: output back to input */}
        <defs>
          <marker id="loopArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.textDim} />
          </marker>
        </defs>
        <path
          d={`M 1640 470 C 1760 470, 1800 330, ${Math.min(1840, slotX + 40)} 250`}
          stroke={C.textDim}
          strokeWidth={3}
          fill="none"
          markerEnd={loopT > 0.95 ? 'url(#loopArr)' : undefined}
          strokeDasharray={520}
          strokeDashoffset={520 * (1 - loopT)}
          opacity={loopT * (1 - ramp(g, cEnd - 30, 14))}
        />
        <text x={1690} y={545} fill={C.textDim} fontFamily="Inter Variable" fontSize={24} fontWeight={650} opacity={loopT * (1 - ramp(g, cEnd - 30, 14))}>
          repeat
        </text>
      </svg>

      {/* Next-token scores (illustrative) */}
      <div style={{position: 'absolute', left: 1040, top: ctxY - 80, width: 720, opacity: scoresIn}}>
        <div style={{fontFamily: F.sans, fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: C.textDim, marginBottom: 18, opacity: flyT > 0 && flyT < 1 ? 0.15 : 1}}>
          SCORES FOR THE NEXT TOKEN
        </div>
        {CANDS.map((c, i) => {
          const loopJitter = g > cLoop + 6 ? 0.35 + 0.6 * rand(Math.floor((g - cLoop) / loopStep) * 31 + i * 7) : 1;
          const w = c.p * 1500 * ramp(g, cScores + i * 3, 16) * (g > cLoop + 6 && appended < TOKENS.length - PREFIX - 1 ? loopJitter : 1);
          const hi = (pickT > 0 && !settled && sweepPos === i) || (settled && i === 0);
          const label = g > cLoop + 6 ? '?' : c.t;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', height: 58}}>
              <div
                style={{
                  width: 70,
                  height: 50,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F.serif,
                  fontSize: 36,
                  color: C.text,
                  background: hi ? 'rgba(243,238,228,0.16)' : 'rgba(27,41,71,0.9)',
                  border: `2px solid ${hi ? C.text : C.line}`,
                  transform: i === 0 && flyT > 0 && flyT < 1 ? `translate(${lerp(0, slotX - 1075, flyT)}px, ${lerp(0, slotY - 467, flyT)}px)` : undefined,
                  opacity: i === 0 && flyT > 0.95 && g < cLoop + 6 ? 0.35 : 1,
                }}
              >
                {label}
              </div>
              <div style={{marginLeft: 18, height: 22, width: w, borderRadius: 11, background: hi ? C.text : 'rgba(185,193,207,0.55)'}} />
              <div style={{marginLeft: 14, fontFamily: F.mono, fontSize: 22, color: C.muted, opacity: g > cLoop + 6 ? 0 : 1}}>
                {(c.p * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
        <div style={{display: 'flex', alignItems: 'center', height: 50, fontFamily: F.sans, fontSize: 24, color: C.muted, marginLeft: 6}}>
          … and every other token in the vocabulary
        </div>
        <div style={{marginTop: 22}}>
          <Tag tone="slate" dashed size={19} caps={false}>Illustrative numbers · not GPT-4o’s actual scores</Tag>
        </div>
      </div>

      {/* "last digit of the year" callout */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 268,
          textAlign: 'center',
          fontFamily: F.sans,
          fontSize: 30,
          fontWeight: 600,
          color: C.text,
          opacity: slotHi * (1 - ramp(g, cLoop, 10)),
        }}
      >
        next up: the last digit of the year
      </div>

      <SourceLine opacity={ramp(g, cStart, 12)}>
        Sentence: ChatGPT (GPT-4o) answer as excerpted in Kalai et al. (2025), Table 1 (accessed May&nbsp;9,&nbsp;2025, no web search) · Token split computed with js-tiktoken (o200k_base)
      </SourceLine>
    </AbsoluteFill>
  );
};
