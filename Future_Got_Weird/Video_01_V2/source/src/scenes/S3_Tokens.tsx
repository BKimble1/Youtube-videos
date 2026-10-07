import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, camLerp} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, easeOut, lerp, pop, ramp, window as win} from '../lib/anim';
import {C, F, FPS, OUTLINE} from '../theme';
import {ApparatusSet} from '../components/Sets';
import {Gauge, Slip, TokenTile} from '../components/Props';
import {Chip, Headline, Label} from '../components/Text';
import tok from '../data/tokens_gpt4o_sentence.json';
import {SLIPS} from './S1_Counter';

const TOKENS = tok.tokens as {id: number; text: string}[];
const PREFIX = 15; // tokens up to and including "200"
// Illustrative next-chunk scores after "… completed in 200". NOT measured from any model.
const CANDS_A = [
  {t: '2', p: 0.31},
  {t: '1', p: 0.26},
  {t: '0', p: 0.12},
  {t: '5', p: 0.09},
  {t: '3', p: 0.07},
];
const CANDS_B = [' at', ',', ' in', ')'];
const ROLL = [' at', ' CM', 'U', ')', ' is', ' entitled', ':']; // the real next tokens (o200k_base)
const WHOLE = new Set([0, 9, 11]); // Adam, dissertation, completed
const FRAG = new Set([1, 2, 6, 7]); // Ta, uman, Ph, .D
const KAL = [3, 4];

const TRACK_Y = 640;
const TRACK_X = 120;
const HOP_X = 1320;
const HOP_Y = 300;

export const S3Tokens: React.FC = () => {
  const g = useG();
  const c08 = at('s08');
  const cApart = at('s08', 'apart.');
  const cTokens = at('s09', 'tokens:');
  const cWhole = at('s09', 'whole');
  const cFrag = at('s09', 'fragments.');
  const cGpt = at('s09', "GPT-4o's");
  const cKal = at('s09', '“Kal”');
  const cAi = at('s09', '“ai.”');
  const cEvery = at('s10', 'every');
  const cScores = at('s10', 'scores');
  const cPicks = at('s10', 'picks');
  const cAgain = at('s10', 'again.');
  const cToken = at('s10', 'Token');
  const cRolls = at('s10', 'rolls');
  const cHere = at('s11', 'Here,');
  const cLikely = at('s11', 'likely.');
  const cTrue = at('s11', 'true.');
  const cModern = at('s12', 'Modern');
  const cInstr = at('s12', 'instruction');
  const cReason = at('s12', 'step-by-step');
  const cSearch = at('s12', 'web');
  const cBut = at('s12', 'But');
  const cPiece = at('s12', 'piece');
  const cEnd = segEnd('s12');

  // ---- camera
  const WIDE: Cam = {cx: 960, cy: 540, zoom: 1};
  const TRACK: Cam = {cx: 760, cy: 600, zoom: 1.35};
  const HOPPER: Cam = {cx: 1250, cy: 440, zoom: 1.25};
  const KALCAM: Cam = {cx: 520, cy: 560, zoom: 1.6};
  let cam = WIDE;
  cam = camLerp(cam, TRACK, ramp(g, cApart - 6, 20, easeInOut) * (1 - ramp(g, cGpt - 6, 16, easeInOut)));
  cam = camLerp(cam, KALCAM, ramp(g, cGpt - 6, 16, easeInOut) * (1 - ramp(g, cEvery - 10, 16, easeInOut)));
  cam = camLerp(cam, HOPPER, ramp(g, cEvery - 10, 18, easeInOut) * (1 - ramp(g, cToken - 2, 16, easeInOut)));
  cam = camLerp(cam, HOPPER, ramp(g, cHere - 4, 16, easeInOut) * (1 - ramp(g, cModern - 8, 16, easeInOut)));

  // ---- slip arrives, then unfolds into the sentence
  const slipIn = ramp(g, c08 - 6, 18, easeOut);
  const unfold = ramp(g, cApart, 16, easeInOut);
  // split into tiles
  const split = ramp(g, cTokens - 2, 18, easeOut);
  const wholeT = win(g, cWhole, cFrag - 2, 10, 8);
  const fragT = win(g, cFrag, cGpt - 2, 10, 8);
  const kalT = ramp(g, cKal - 6, 14);
  const aiT = ramp(g, cAi - 4, 12);
  const kalDown = ramp(g, cEvery - 8, 12, easeInOut);
  // hopper: scoring and the pick
  const hopIn = ramp(g, cEvery - 4, 14);
  const scoreT = ramp(g, cScores, 18);
  const pickT = ramp(g, cPicks, 18, easeInOut);
  const reload = ramp(g, cAgain - 4, 14);
  const pickB = ramp(g, cAgain + 10, 16, easeInOut);
  // roll-out: one token every 6 frames after "Token"
  const rollN = g >= cToken ? Math.min(ROLL.length, Math.floor((g - cToken) / 6) + 1) : 0;
  const rollT = (i: number) => ramp(g, cToken + i * 6, 8);
  // s11: the LIKELY vs TRUE gauges
  const likelyT = ramp(g, cHere + 4, 14);
  const trueT = ramp(g, cTrue - 10, 14);
  const likelyWord = ramp(g, cLikely - 6, 10);
  // s12: add-on modules
  const modT = [ramp(g, cInstr - 4, 14), ramp(g, cReason - 4, 14), ramp(g, cSearch - 4, 14)];
  const butT = ramp(g, cBut, 12);
  const pieceT = ramp(g, cPiece, 10);
  const sceneOut = 1 - ramp(g, cEnd + 22, 12);

  // How many tiles are on the track: prefix, then "2" after the pick, then the roll-out
  const tiles: {text: string; tone: 'paper' | 'teal' | 'coral' | 'saffron' | 'blue'; t: number; lift: number}[] = [];
  for (let i = 0; i < PREFIX; i++) {
    const isKal = KAL.includes(i);
    const tone = WHOLE.has(i) && wholeT > 0.5 ? 'teal' : FRAG.has(i) && fragT > 0.5 ? 'saffron' : isKal && kalT > 0.5 ? 'blue' : 'paper';
    tiles.push({text: TOKENS[i].text, tone, t: 1, lift: isKal ? (i === 3 ? kalT : aiT) * (1 - kalDown) : 0});
  }
  if (pickT > 0.95) tiles.push({text: '2', tone: pickB > 0.95 || rollN > 0 ? 'paper' : 'blue', t: 1, lift: 0});
  if (pickB > 0.95) tiles.push({text: ' at', tone: 'paper', t: 1, lift: 0});
  for (let i = 1; i < rollN; i++) tiles.push({text: ROLL[i], tone: 'paper', t: rollT(i), lift: 0});

  const s = SLIPS[0];
  const sentencePrefix = 'Adam Tauman Kalai’s Ph.D. dissertation (completed in 200';

  return (
    <AbsoluteFill style={{opacity: sceneOut, background: C.blueLight}}>
      <Camera cam={cam}>
        <ApparatusSet>
          <Layer depth={1}>
            {/* the machine housing: scorer/hopper unit above the track */}
            <div style={{position: 'absolute', left: HOP_X - 300, top: HOP_Y - 40, width: 600, height: 336, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 26, opacity: hopIn, transform: `translateY(${(1 - hopIn) * -30}px)`}}>
              <div style={{position: 'absolute', left: 20, top: 16, fontFamily: F.display, fontWeight: 700, fontSize: 26, color: C.white, letterSpacing: '0.04em'}}>NEXT-CHUNK SCORER</div>
              <div style={{position: 'absolute', right: 20, top: 18}}>
                <Chip tone="saffron" size={18} dashed>illustrative numbers</Chip>
              </div>
              {/* candidate slots */}
              <div style={{position: 'absolute', left: 24, top: 64, width: 552, height: 250, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6}}>
                {reload < 0.5 || g >= cHere
                  ? CANDS_A.map((c, i) => {
                      const picked = i === 0 && pickT > 0.02 && g < cHere;
                      return (
                        <div key={c.t} style={{opacity: picked ? 1 - pickT : 1, display: 'flex', alignItems: 'center', gap: 14}}>
                          <div style={{width: 60, textAlign: 'center', fontFamily: F.serif, fontSize: 30, color: C.ink, border: `3px solid ${i === 0 && scoreT > 0.9 ? C.saffronDeep : C.inkMuted}`, borderRadius: 8, background: i === 0 && scoreT > 0.9 ? C.saffronLight : C.white}}>{c.t}</div>
                          <div style={{position: 'relative', width: 360, height: 20, borderRadius: 10, background: C.paperDeep, border: `2px solid ${C.ink}`, overflow: 'hidden'}}>
                            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${c.p * 100 * 2.6 * scoreT}%`, background: i === 0 ? C.saffron : C.blue}} />
                          </div>
                          <div style={{width: 60, fontFamily: F.mono, fontSize: 20, color: C.inkMuted, opacity: scoreT}}>{Math.round(c.p * 100)}%</div>
                        </div>
                      );
                    })
                  : CANDS_B.map((c, i) => {
                      const picked = i === 0 && pickB > 0.02;
                      return (
                        <div key={c} style={{opacity: Math.min(reload, picked ? 1 - pickB : 1), display: 'flex', alignItems: 'center', gap: 14}}>
                          <div style={{width: 60, textAlign: 'center', fontFamily: F.serif, fontSize: 30, color: C.ink, border: `3px solid ${C.inkMuted}`, borderRadius: 8, background: C.white, whiteSpace: 'pre'}}>{c === ' at' ? 'at' : c === ' in' ? 'in' : c}</div>
                          <div style={{position: 'relative', width: 360, height: 20, borderRadius: 10, background: C.paperDeep, border: `2px solid ${C.ink}`, overflow: 'hidden'}}>
                            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${[62, 30, 18, 10][i] * reload}%`, background: i === 0 ? C.saffron : C.blue}} />
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
            {/* the chute from the scorer down to the track */}
            <div style={{position: 'absolute', left: HOP_X + 230, top: HOP_Y + 294, width: 54, height: 76, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '0 0 12px 12px', opacity: hopIn}} />
            {/* the falling picked tile (A then B) */}
            {pickT > 0.02 && pickT < 0.98 && (
              <div style={{position: 'absolute', left: lerp(HOP_X - 250, HOP_X + 150, pickT), top: lerp(HOP_Y + 80, TRACK_Y - 10, easeInOut(pickT)) - Math.sin(pickT * Math.PI) * 90, transform: `rotate(${pickT * 360}deg)`}}>
                <TokenTile text="2" size={36} tone="saffron" />
              </div>
            )}
            {pickB > 0.02 && pickB < 0.98 && (
              <div style={{position: 'absolute', left: lerp(HOP_X - 250, HOP_X + 230, pickB), top: lerp(HOP_Y + 80, TRACK_Y - 10, easeInOut(pickB)) - Math.sin(pickB * Math.PI) * 90, transform: `rotate(${pickB * 360}deg)`}}>
                <TokenTile text=" at" size={36} tone="saffron" />
              </div>
            )}

            {/* the track */}
            <div style={{position: 'absolute', left: -200, right: -200, top: TRACK_Y + 70, height: 26, background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13}} />
            {Array.from({length: 22}).map((_, i) => (
              <div key={i} style={{position: 'absolute', left: -200 + i * 110, top: TRACK_Y + 100, width: 24, height: 24, borderRadius: 12, background: C.inkSoft, border: `3px solid ${C.ink}`}} />
            ))}

            {/* the slip arriving and unfolding into the sentence */}
            {unfold < 1 && (
              <div style={{position: 'absolute', left: lerp(-700, 160, slipIn), top: TRACK_Y - 250, opacity: 1 - unfold, transform: `rotate(${lerp(-4, 0, slipIn)}deg) scaleX(${1 + unfold * 0.6})`, transformOrigin: '0% 100%'}}>
                <Slip model={s.model} detail={s.detail} width={520} fontSize={26}>
                  {s.pre}{s.year}{s.mid}{s.title}
                </Slip>
              </div>
            )}
            {unfold > 0 && split < 1 && (
              <div style={{position: 'absolute', left: TRACK_X, top: TRACK_Y - 8, fontFamily: F.serif, fontSize: 40, color: C.ink, whiteSpace: 'pre', opacity: unfold * (1 - split)}}>
                {sentencePrefix}
              </div>
            )}
            {/* the token tiles */}
            {split > 0 && (
              <div style={{position: 'absolute', left: TRACK_X - (pickB > 0.95 ? 60 : 0) - Math.max(0, rollN - 1) * 70, top: TRACK_Y - 18, display: 'flex', alignItems: 'flex-end', gap: lerp(0, 12, split), opacity: split}}>
                {tiles.map((tl, i) => (
                  <div key={i} style={{transform: `translateY(${-tl.lift * 110}px) scale(${1 + tl.lift * 0.35})`, transformOrigin: '50% 100%'}}>
                    <TokenTile text={tl.text} size={lerp(40, 36, split)} tone={tl.tone} t={tl.t} />
                  </div>
                ))}
              </div>
            )}
            {/* labels under the lifted "Kal" "ai" */}
            {kalT > 0 && kalDown < 1 && (
              <div style={{position: 'absolute', left: 300, top: TRACK_Y - 230, opacity: Math.min(kalT, 1 - kalDown)}}>
                <Chip tone="blue" size={24}>“Kalai” → “ Kal” + “ai” · GPT-4o tokenizer (o200k_base)</Chip>
              </div>
            )}
            {wholeT > 0 && (
              <div style={{position: 'absolute', left: TRACK_X, top: TRACK_Y + 140, opacity: wholeT}}>
                <Chip tone="teal" size={24}>whole words</Chip>
              </div>
            )}
            {fragT > 0 && (
              <div style={{position: 'absolute', left: TRACK_X + 260, top: TRACK_Y + 140, opacity: fragT}}>
                <Chip tone="saffron" size={24}>fragments</Chip>
              </div>
            )}

            {/* s11: LIKELY vs TRUE gauges, beside the scorer */}
            {likelyT > 0 && (
              <div style={{position: 'absolute', left: HOP_X - 300 - 520, top: HOP_Y - 20, width: 496, opacity: Math.min(likelyT, 1 - ramp(g, cModern - 6, 10))}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
                  <div style={{flex: 1, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 16, padding: '12px 16px'}}>
                    <Label size={22} color={C.blueDeep} weight={800}>WHAT THE SCORE MEASURES</Label>
                    <Headline size={34} align="left" style={{marginTop: 4, color: C.ink, opacity: 0.4 + 0.6 * likelyWord}}>How likely the chunk is</Headline>
                  </div>
                  <div style={{flex: 1, background: C.cream, border: `${OUTLINE}px solid ${trueT > 0.5 ? C.coral : C.inkMuted}`, borderRadius: 16, padding: '12px 16px', opacity: 0.35 + 0.65 * trueT}}>
                    <Label size={22} color={C.coralDeep} weight={800}>NOT MEASURED</Label>
                    <Headline size={34} align="left" style={{marginTop: 4, color: C.ink}}>Whether it’s true</Headline>
                  </div>
                </div>
              </div>
            )}

            {/* s12: add-on modules bolted onto the machine */}
            {[
              {label: 'Instruction training', icon: '✎'},
              {label: 'Step-by-step reasoning', icon: '⚙'},
              {label: 'Web search (sometimes)', icon: '⌕'},
            ].map((m, i) => (
              <div key={m.label} style={{position: 'absolute', left: 200 + i * 400, top: 150 - (1 - modT[i]) * 120, opacity: modT[i], width: 360, padding: '14px 18px', background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 16, boxShadow: `6px 8px 0 ${C.shadow}`, display: 'flex', alignItems: 'center', gap: 14}}>
                <div style={{width: 54, height: 54, borderRadius: 27, background: C.blue, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontFamily: F.body, fontWeight: 800}}>{m.icon}</div>
                <Label size={26} color={C.ink} weight={800}>{m.label}</Label>
              </div>
            ))}
            {butT > 0 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: TRACK_Y + 150, textAlign: 'center', opacity: butT}}>
                <Chip tone="ink" size={28}>still assembled one piece at a time</Chip>
              </div>
            )}
          </Layer>
        </ApparatusSet>
      </Camera>
    </AbsoluteFill>
  );
};
