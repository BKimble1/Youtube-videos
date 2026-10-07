import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {MarkedText} from '../components/cards';
import {Doc} from '../components/Doc';
import {Headline, SourceLine, Tag} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, easeOut, inOut, lerp, ramp} from '../lib/anim';
import {C, F} from '../theme';

export const ANSWERS = [
  {
    model: 'ChatGPT',
    detail: 'GPT-4o',
    pre: 'Adam Tauman Kalai’s Ph.D. dissertation (completed in ',
    year: '2002',
    mid: ' at CMU) is entitled: ',
    title: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”',
    post: '',
  },
  {model: 'DeepSeek', detail: 'R1', pre: '', title: '“Algebraic Methods in Interactive Machine Learning”', mid: '. . . at Harvard University in ', year: '2005', post: '.'},
  {model: 'Llama', detail: '4 Scout', pre: '', title: '“Efficient Algorithms for Learning and Playing Games”', mid: '. . . in ', year: '2007', post: ' at MIT.'},
];

const PROMPT = 'What was the title of Adam Kalai’s dissertation?';

const RowCard: React.FC<{i: number; t: number; markTitle: number; markYear: number; y: number; scale?: number; read?: number; readTitle?: number; readYear?: number; glow?: number}> = ({
  i,
  t,
  markTitle,
  markYear,
  y,
  scale = 1,
  read = 1,
  readTitle = 0,
  readYear = 0,
  glow = 0,
}) => {
  const a = ANSWERS[i];
  const spans =
    i === 0
      ? [
          {text: a.pre},
          markYear > 0 ? {text: a.year, mark: 'coral' as const, markT: markYear} : {text: a.year, mark: 'warm' as const, markT: readYear},
          {text: a.mid},
          markTitle > 0 ? {text: a.title, mark: 'coral' as const, markT: markTitle} : {text: a.title, mark: 'warm' as const, markT: readTitle},
        ]
      : [
          {text: a.title, mark: 'coral' as const, markT: markTitle},
          {text: a.mid},
          {text: a.year, mark: 'coral' as const, markT: markYear},
          {text: a.post},
        ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 960 - 760,
        top: y,
        width: 1520,
        opacity: t,
        transform: `translateY(${(1 - t) * 40}px) scale(${scale})`,
        transformOrigin: '50% 0%',
        display: 'flex',
        borderRadius: 20,
        background: `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.surface} 100%)`,
        border: `1.5px solid ${C.lineStrong}`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.4), 0 0 ${40 * glow}px rgba(243,238,228,${0.12 * glow})`,
        padding: '26px 34px',
        gap: 34,
      }}
    >
      <div style={{width: 210, flexShrink: 0}}>
        <div style={{fontFamily: F.sans, fontWeight: 750, fontSize: 32, color: C.text}}>{a.model}</div>
        <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 22, color: C.muted, marginTop: 4}}>{a.detail}</div>
      </div>
      <div style={{fontFamily: F.serif, fontSize: 35, lineHeight: 1.36, color: C.text, flex: 1, opacity: 0.72 + 0.28 * read}}>
        <MarkedText spans={spans} />
      </div>
      <div style={{width: 150, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
        <div style={{opacity: markTitle}}>
          <Tag tone="coral" size={17}>✕ Title</Tag>
        </div>
        <div style={{opacity: markYear}}>
          <Tag tone="coral" size={17}>✕ Year</Tag>
        </div>
      </div>
    </div>
  );
};

export const S1Hook: React.FC = () => {
  const g = useG();
  const c0 = at('s01');
  const cWhat = at('s01', 'question:') - 4;
  const cChatbots = at('s01', 'chatbots');
  const cQEnd = segEnd('s01');
  const cGPT = at('s02', 'ChatGPT');
  const cDS = at('s03', 'DeepSeek');
  const cLL = at('s03', 'Llama');
  const cTitle = at('s04', 'title');
  const cYear = at('s04', 'year');
  const cKalai = at('s05', 'Kalai?');
  const cResearchers = at('s05', "He's");
  const cDiff = at('s06', 'different');
  const cFive = at('s06', 'five');
  const cSix = at('s06', 'six');
  const cCredited = at('s06', 'credited');
  const cSame = at('s07', 'same');
  const cStill = at('s07', 'still');
  const cSo = at('s07', 'So');
  const cSure = at('s07', 'sure');
  const cWrong = at('s07', 'wrong');
  const cShort = at('s07b', 'Short');
  const cLikely = at('s07b', 'chatbot');
  const cIsnt = at('s07b', 'likely', 2);
  const cApart = at('s07b', 'take');
  const cEnd = segEnd('s07b');

  // ---- Prompt card with a type-on synced to the narration ----
  // first frame already shows the layout (dim question + label), so the video never opens on an empty screen
  const promptIn = 1;
  const chipsT = ramp(g, cChatbots - 6, 12) * (1 - ramp(g, cGPT - 14, 10));
  const kickerT = 1 - ramp(g, cGPT - 14, 10);
  const readTitle = ramp(g, at('s02', 'Boosting,'), 40, (x) => x);
  const readTitleMark = ramp(g, at('s02', 'Boosting,'), 70, (x) => x);
  const readYearMark = ramp(g, at('s02', '2002.'), 10);
  const polished = ramp(g, at('s04', 'polished'), 10) * (1 - ramp(g, at('s04', 'Not') + 4, 16));
  const typed = Math.round(PROMPT.length * ramp(g, cWhat - 4, Math.max(10, cQEnd - cWhat), (x) => x));
  const promptUp = ramp(g, cGPT - 10, 18, easeInOut);
  const promptY = lerp(430, 92, promptUp);
  const promptScale = lerp(1, 0.62, promptUp);

  const cardsOut = ramp(g, cKalai - 4, 16, easeInOut);
  const paperIn = ramp(g, cKalai, 14);
  const paperBox = ramp(g, cResearchers, 16);
  const c06 = at('s06');
  const paperOut = ramp(g, c06 + 4, 8);
  const cSplit = c06 + 12; // the split screen arrives just after the lead-author tag has had time to read

  const splitIn = ramp(g, cSplit - 2, 16);
  const creditT = ramp(g, cCredited - 4, 14);
  const sameT = ramp(g, cDiff - 2, 16);
  const samePulse = ramp(g, cSame - 4, 10) * (1 - ramp(g, cSame + 26, 18));
  // the split holds while the narration still refers to it ("...take on olympiad problems"), then hands off
  const splitOut = ramp(g, cStill - 8, 16, easeInOut);

  const titleIn = ramp(g, cStill - 2, 18);
  const sureT = ramp(g, cSure - 6, 10);
  const wrongT = ramp(g, cWrong - 6, 10);
  const handoff = ramp(g, cApart, 30, easeInOut);
  const shortT = ramp(g, cShort, 14);
  const likelyT = ramp(g, cLikely - 4, 12);
  const isntT = ramp(g, cIsnt - 2, 12);
  const sceneOut = 1 - ramp(g, cEnd + 6, 10);

  const marksTitle = ramp(g, cTitle - 6, 14);
  const marksYear = ramp(g, cYear - 6, 14);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Backdrop glow={{x: 960, y: 300, color: 'rgba(60,140,200,0.4)', size: 1500, opacity: 0.1}} />

      {/* --- The question + the three answers --- */}
      <AbsoluteFill style={{opacity: 1 - cardsOut, transform: `translateY(${cardsOut * -40}px)`}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: promptY,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: promptIn,
            transform: `scale(${promptScale})`,
            transformOrigin: '50% 0%',
          }}
        >
          <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, marginBottom: 20}}>
            THE QUESTION, AS ASKED
          </div>
          <div style={{fontFamily: F.serif, fontSize: 72, color: C.text, fontWeight: 450, whiteSpace: 'pre'}}>
            {PROMPT.slice(0, typed)}
            <span style={{opacity: 0.16}}>{PROMPT.slice(typed)}</span>
          </div>
        </div>

        <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', opacity: kickerT * (1 - promptUp)}}>
          <Tag tone="slate">A published test · 2025</Tag>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', gap: 28, opacity: chipsT}}>
          {ANSWERS.map((a, i) => (
            <div
              key={a.model}
              style={{
                padding: '16px 30px',
                borderRadius: 16,
                background: C.surface,
                border: `1.5px solid ${C.lineStrong}`,
                fontFamily: F.sans,
                fontSize: 34,
                fontWeight: 700,
                color: C.text,
                opacity: ramp(g, cChatbots - 6 + i * 4, 10),
                transform: `translateY(${(1 - ramp(g, cChatbots - 6 + i * 4, 10)) * 16}px)`,
              }}
            >
              {a.model}
              <span style={{fontWeight: 500, fontSize: 24, color: C.muted, marginLeft: 12}}>{a.detail}</span>
            </div>
          ))}
        </div>

        <RowCard i={0} t={ramp(g, cGPT, 16)} markTitle={marksTitle} markYear={marksYear} y={262} read={readTitle} readTitle={readTitleMark} readYear={readYearMark} glow={polished} />
        <RowCard i={1} t={ramp(g, cDS, 16)} markTitle={ramp(g, cTitle - 2, 14)} markYear={ramp(g, cYear - 2, 14)} y={512} glow={polished} />
        <RowCard i={2} t={ramp(g, cLL, 16)} markTitle={ramp(g, cTitle + 2, 14)} markYear={ramp(g, cYear + 2, 14)} y={692} glow={polished} />

        <SourceLine opacity={ramp(g, cGPT, 12)}>
          Excerpts as published in Kalai, Nachum, Vempala &amp; Zhang (2025), “Why Language Models Hallucinate,” Table 1
          <br />
          Models accessed May&nbsp;9,&nbsp;2025 · none searched the web
        </SourceLine>
      </AbsoluteFill>

      {/* --- Kalai was one of the researchers asking: real paper header --- */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: paperIn * (1 - paperOut)}}>
        <div style={{transform: `translateY(${(1 - paperIn) * 40}px) scale(${lerp(0.97, 1.02, ramp(g, cKalai, 90, (x) => x))})`}}>
          <Doc
            src="img/paper_p01_header.png"
            width={1500}
            aspect={442 / 2000}
            boxes={[{x: 0.05, y: 0.44, w: 0.245, h: 0.27, t: paperBox, tone: 'teal', label: 'Lead author', labelSide: 'bottom'}]}
          />
        </div>
        <SourceLine opacity={paperIn}>Kalai et al. (2025), arXiv:2509.04664, p. 1 · CC BY 4.0</SourceLine>
      </AbsoluteFill>

      {/* --- Contrast: a different system, a different test ---
           Left shows only what the opened PDF supports: written solutions to P1-P5, credited to
           Gemini Deep Think (no score, grading or medal claim). */}
      <AbsoluteFill style={{opacity: splitIn * (1 - splitOut), transform: `scale(${lerp(1, 0.97, splitOut)})`}}>
        <div style={{position: 'absolute', left: 110, top: 128, width: 780}}>
          <Tag tone="teal">Published solutions · IMO 2025</Tag>
          <div style={{marginTop: 22, transform: `translateY(${(1 - splitIn) * 24}px)`}}>
            <Doc
              src="img/imo2025_solutions_p01.png"
              width={720}
              aspect={1300 / 1790}
              pad={18}
              boxes={[{x: 0.004, y: 0.022, w: 0.745, h: 0.05, t: creditT, tone: 'teal', label: 'Credited to Gemini Deep Think', labelSide: 'bottom'}]}
            />
          </div>
          <div style={{display: 'flex', gap: 12, marginTop: 26}}>
            {[0, 1, 2, 3, 4, 5].map((p) => {
              const solved = p < 5;
              const on = solved ? ramp(g, cFive - 6 + p * 3, 10) : ramp(g, cSix - 4, 12);
              return (
                <div
                  key={p}
                  style={{
                    width: solved ? 108 : 160,
                    height: 78,
                    borderRadius: 12,
                    border: solved ? `2px solid rgba(60,201,180,${0.25 + 0.75 * on})` : `2px dashed rgba(133,146,168,${0.35 + 0.5 * on})`,
                    background: solved ? `rgba(60,201,180,${0.15 * on})` : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: F.sans,
                  }}
                >
                  <div style={{fontSize: 26, fontWeight: 700, color: solved ? C.text : C.muted}}>P{p + 1}</div>
                  <div style={{fontSize: 15, fontWeight: 650, letterSpacing: '0.04em', color: solved ? C.teal : C.muted, opacity: on, marginTop: 2, whiteSpace: 'nowrap'}}>
                    {solved ? 'SOLUTION' : 'NOT INCLUDED'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{position: 'absolute', left: 1030, top: 128, width: 780}}>
          <Tag tone="coral">Invented titles · May 2025</Tag>
          <div style={{marginTop: 30, fontFamily: F.sans, fontWeight: 750, fontSize: 50, color: C.text, lineHeight: 1.1}}>A dissertation title</div>
          <div style={{marginTop: 34, display: 'flex', flexDirection: 'column', gap: 14}}>
            {ANSWERS.map((a, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 14,
                  background: C.surface,
                  border: `1.5px solid ${C.lineStrong}`,
                  padding: '16px 22px',
                  fontFamily: F.serif,
                  fontSize: 27,
                  lineHeight: 1.3,
                  color: C.text,
                  opacity: ramp(g, cSplit + 8 + i * 4, 12),
                  transform: `translateY(${(1 - ramp(g, cSplit + 8 + i * 4, 12)) * 14}px)`,
                }}
              >
                <span style={{fontFamily: F.sans, fontWeight: 700, fontSize: 22, color: C.muted, marginRight: 14}}>{a.model}</span>
                <span style={{textDecoration: 'line-through', textDecorationColor: C.coral, textDecorationThickness: 3}}>{a.title}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop: 24, fontFamily: F.sans, fontSize: 24, color: C.textDim, lineHeight: 1.45}}>
            GPT-4o · DeepSeek-R1 · Llama-4-Scout
            <br />
            accessed May 9, 2025 · no web search
          </div>
        </div>
        <div style={{position: 'absolute', left: 960, top: 150, bottom: 230, width: 2, background: C.line}} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 892,
            textAlign: 'center',
            fontFamily: F.sans,
            fontSize: 30,
            fontWeight: 600,
            color: samePulse > 0.01 ? C.text : C.textDim,
            opacity: sameT,
            transform: `scale(${1 + 0.03 * samePulse})`,
          }}
        >
          Different systems, different tests. Same basic technology: <span style={{color: C.text, fontWeight: 720}}>language models</span>.
        </div>
        <SourceLine opacity={splitIn}>
          Left: Google DeepMind, IMO_2025.pdf, p. 1 (published Jul 21, 2025), storage.googleapis.com/deepmind-media/gemini/
          <br />
          Right: Kalai et al. (2025), Table 1
        </SourceLine>
      </AbsoluteFill>

      {/* --- The question of the video --- */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: titleIn * (1 - 0.85 * handoff), transform: `scale(${1 + 0.08 * handoff})`}}>
        <div style={{textAlign: 'center', transform: `translateY(${(1 - titleIn) * 20 - 90 * shortT}px) scale(${1 - 0.12 * shortT})`}}>
          <Headline size={124} style={{fontWeight: 780}}>
            Why AI Sounds <span style={{color: C.text, opacity: 0.35 + 0.65 * sureT}}>Right</span>
          </Headline>
          <Headline size={124} style={{fontWeight: 780, marginTop: 10}}>
            When It’s <span style={{color: wrongT > 0.5 ? C.coral : C.text, opacity: 0.35 + 0.65 * wrongT}}>Wrong</span>
          </Headline>
          <div style={{marginTop: 64, opacity: shortT, fontFamily: F.sans, fontWeight: 750, color: C.muted, letterSpacing: '0.1em', fontSize: 28}}>SHORT ANSWER</div>
          <div style={{marginTop: 14, opacity: shortT, fontFamily: F.sans, fontSize: 56, fontWeight: 680, color: C.textDim, letterSpacing: '-0.01em', lineHeight: 1.25}}>
            <div style={{opacity: likelyT}}>It writes what’s likely.</div>
            <div style={{opacity: isntT, color: C.text}}>Likely isn’t always true.</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
