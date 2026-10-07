import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {Doc} from '../components/Doc';
import {Headline, SourceLine, Tag} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, ramp, rand} from '../lib/anim';
import {C, F} from '../theme';

const PATTERN_WORDS = ['Methods', 'Algorithms', 'Machine Learning', 'Learning', 'Theory', 'Analysis', 'Online', 'Models', 'Topics in', 'Approaches to', 'Efficient', 'Probabilistic', 'Interactive', 'Games', 'Boosting', 'Optimization'];
const GPT_TITLE = ['Boosting,', 'Online', 'Algorithms,', 'and', 'Other', 'Topics', 'in', 'Machine', 'Learning.'];

const Field: React.FC<{label: string; value: string; state: number; tone: 'coral' | 'teal' | 'none'; tag?: string; serif?: boolean}> = ({label, value, state, tone, tag, serif}) => {
  const col = tone === 'coral' ? C.coral : tone === 'teal' ? C.teal : C.lineStrong;
  return (
    <div style={{display: 'flex', alignItems: 'flex-start', gap: 22, padding: '18px 0', borderTop: `1px solid ${C.line}`}}>
      <div style={{width: 150, flexShrink: 0, fontFamily: F.sans, fontSize: 22, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, paddingTop: 8}}>{label}</div>
      <div style={{flex: 1}}>
        <div
          style={{
            display: 'inline',
            fontFamily: serif ? F.serif : F.sans,
            fontSize: serif ? 36 : 34,
            lineHeight: 1.3,
            fontWeight: serif ? 450 : 600,
            color: C.text,
            backgroundImage: tone !== 'none' ? `linear-gradient(${tone === 'coral' ? 'rgba(255,111,94,0.22)' : 'rgba(60,201,180,0.2)'}, ${tone === 'coral' ? 'rgba(255,111,94,0.22)' : 'rgba(60,201,180,0.2)'})` : undefined,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${state * 100}% 100%`,
            boxShadow: state > 0.98 && tone !== 'none' ? `inset 0 -4px 0 ${col}` : undefined,
            borderRadius: 4,
          }}
        >
          {value}
        </div>
        {tag && (
          <div style={{marginTop: 12, opacity: state}}>
            <Tag tone={tone === 'coral' ? 'coral' : 'teal'} size={18}>
              {tag}
            </Tag>
          </div>
        )}
      </div>
    </div>
  );
};

export const S3Convincing: React.FC = () => {
  const g = useG();
  const c0 = at('s15');
  const cEverywhere = at('s16', 'everywhere:');
  const cMethods = at('s16', 'Methods');
  const cFamous = at('s17', 'Famous');
  const cPaper = at('s17', 'paper');
  const cBut = at('s18', 'But');
  const cOnce = at('s18', 'once.');
  const cNever = at('s18', 'never.');
  const cBirthday = at('s18', 'birthday,');
  const cFills = at('s19', 'fills');
  const cEntitled = at('s19', 'entitled.');
  const cThink = at('s19', 'think,');
  const cReadout = at('s19', 'readout');
  const cHere = at('s20', "Here's");
  const cSpot = at('s20', 'Spot');
  const cSame = at('s21', 'Same');
  const cYear = at('s21', 'year:');
  const cTitle = at('s21', 'title.');
  const cInvented = at('s21', 'invented');
  const cEnd = segEnd('s21');

  // Phase A: headline + pattern field
  const headIn = ramp(g, c0, 14) * (1 - ramp(g, cEverywhere - 8, 12));
  const fieldIn = ramp(g, cEverywhere - 6, 24);
  const fieldOut = ramp(g, cFamous - 6, 14);
  // Phase B: Einstein vs one researcher
  const einIn = ramp(g, cFamous, 16);
  const einPaper = ramp(g, cPaper, 16);
  const oneIn = ramp(g, cBut, 16);
  const onceT = ramp(g, cOnce, 10);
  const neverT = ramp(g, cNever, 10);
  const bOut = ramp(g, cBirthday - 4, 14);
  const figIn = ramp(g, cBirthday, 16);
  const figBox = ramp(g, cBirthday + 10, 16);
  const figOut = ramp(g, cFills - 4, 14);
  // Phase C: assembling a title-shaped answer, then tone
  const asmT = ramp(g, cFills, 34, easeInOut);
  const entT = ramp(g, cEntitled, 12);
  const hedgeT = ramp(g, cThink - 6, 14);
  const readT = ramp(g, cReadout, 14);
  const cOut = ramp(g, cHere - 6, 14);
  // Phase D: side by side
  const sbsIn = ramp(g, cHere, 18);
  const spotT = ramp(g, cSpot, 12);
  const sameT = ramp(g, cSame, 14);
  const yearT = ramp(g, cYear, 14);
  const titleT = ramp(g, cTitle, 16);
  const evidT = ramp(g, cInvented - 4, 18);
  const sceneOut = 1 - ramp(g, cEnd + 18, 10);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Backdrop glow={{x: 960, y: 540, color: 'rgba(60,140,200,0.35)', size: 1400, opacity: 0.1}} />

      {/* Headline */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: headIn}}>
        <Headline size={78} style={{textAlign: 'center'}}>
          So why would the <span style={{color: C.textDim}}>likely</span> answer be wrong?
        </Headline>
      </AbsoluteFill>

      {/* Pattern field: the style of a dissertation title is everywhere (illustration) */}
      <AbsoluteFill style={{opacity: fieldIn * (1 - fieldOut)}}>
        {Array.from({length: 64}).map((_, i) => {
          const w = PATTERN_WORDS[i % PATTERN_WORDS.length];
          const x = rand(i * 5 + 1) * 1700 + 60;
          const y = rand(i * 9 + 3) * 760 + 120;
          const appear = ramp(g, cEverywhere - 6 + rand(i * 3) * 50, 14);
          const drift = (g - cEverywhere) * (0.25 + rand(i * 17) * 0.4);
          const isKey = w === 'Methods' || w === 'Algorithms' || w === 'Machine Learning';
          const keyT = isKey ? ramp(g, cMethods, 14) : 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - drift,
                top: y,
                fontFamily: F.serif,
                fontSize: 26 + rand(i * 7) * 24,
                color: isKey ? `rgba(243,238,228,${0.25 + 0.65 * keyT})` : 'rgba(185,193,207,0.22)',
                opacity: appear,
                whiteSpace: 'nowrap',
              }}
            >
              {w}
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center'}}>
          <Tag tone="slate" dashed>Illustration · the style of a title shows up again and again</Tag>
        </div>
      </AbsoluteFill>

      {/* Einstein: frequently referenced. One researcher: maybe once, maybe never. */}
      <AbsoluteFill style={{opacity: (einIn) * (1 - bOut)}}>
        <div style={{position: 'absolute', left: 150, top: 150, width: 720}}>
          <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: C.muted}}>A FAMOUS FACT</div>
          <div style={{position: 'relative', marginTop: 40, height: 300}}>
            {Array.from({length: 7}).map((_, k) => (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  left: k * 14,
                  top: k * 14,
                  width: 600,
                  padding: '26px 30px',
                  borderRadius: 16,
                  background: C.surfaceHi,
                  border: `1.5px solid ${C.lineStrong}`,
                  opacity: ramp(g, cFamous + k * 3, 10) * (k === 6 ? 1 : 0.55),
                  fontFamily: F.serif,
                  fontSize: 30,
                  color: C.text,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{fontFamily: F.sans, fontSize: 20, color: C.muted, marginBottom: 8}}>Einstein’s dissertation (1905)</div>
                “A New Determination of Molecular Dimensions”
              </div>
            ))}
          </div>
          <div style={{marginTop: 30, fontFamily: F.sans, fontSize: 30, fontWeight: 650, color: C.teal}}>written about many, many times</div>
        </div>
        <div style={{position: 'absolute', left: 1040, top: 150, width: 720, opacity: oneIn}}>
          <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: C.muted}}>ONE RESEARCHER’S THESIS</div>
          <div
            style={{
              marginTop: 40,
              width: 600,
              padding: '26px 30px',
              borderRadius: 16,
              border: `2px dashed ${C.lineStrong}`,
              fontFamily: F.serif,
              fontSize: 30,
              color: C.textDim,
            }}
          >
            <div style={{fontFamily: F.sans, fontSize: 20, color: C.muted, marginBottom: 8}}>Kalai’s dissertation (2001)</div>
            “ ? ”
          </div>
          <div style={{marginTop: 40, display: 'flex', gap: 18}}>
            <div style={{opacity: onceT}}>
              <Tag tone="slate">seen once?</Tag>
            </div>
            <div style={{opacity: neverT}}>
              <Tag tone="slate">never?</Tag>
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 150, right: 150, bottom: 150, opacity: einPaper * (1 - oneIn)}}>
          <Doc src="img/paper_p10_einstein.png" width={1300} aspect={174 / 2000} boxes={[{x: 0.36, y: 0.33, w: 0.64, h: 0.36, t: ramp(g, cPaper + 8, 14), tone: 'teal'}]} />
        </div>
        <SourceLine opacity={einPaper}>Kalai et al. (2025), p. 10 · Einstein’s 1905 dissertation shown for illustration</SourceLine>
      </AbsoluteFill>

      {/* Paper Figure 1: birthdays have no pattern */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: figIn * (1 - figOut)}}>
        <div style={{transform: `scale(${lerp(0.96, 1.0, figIn)})`}}>
          <Doc
            src="img/paper_p03_fig1.png"
            width={1560}
            aspect={475 / 1992}
            boxes={[{x: 0.63, y: 0.72, w: 0.36, h: 0.27, t: figBox, tone: 'teal', label: 'No pattern to learn', labelSide: 'bottom'}]}
            dimOutside={figBox}
          />
        </div>
        <SourceLine opacity={figIn}>Kalai et al. (2025), Figure 1 (p. 3) · CC BY 4.0</SourceLine>
      </AbsoluteFill>

      {/* A title-shaped answer + confident tone */}
      <AbsoluteFill style={{opacity: asmT > 0 ? 1 - cOut : 0}}>
        <div style={{position: 'absolute', left: 160, right: 160, top: 260, textAlign: 'center'}}>
          <div style={{fontFamily: F.sans, fontSize: 24, fontWeight: 700, letterSpacing: '0.12em', color: C.muted, opacity: asmT}}>
            WHAT A TITLE USUALLY LOOKS LIKE
          </div>
          <div style={{marginTop: 30, fontFamily: F.serif, fontSize: 64, lineHeight: 1.25, color: C.text}}>
            <span style={{opacity: ramp(g, cFills + 4, 14), backgroundColor: entT > 0 ? `rgba(243,238,228,${0.14 * entT})` : undefined, borderRadius: 6, padding: '0 6px', boxShadow: entT > 0.9 ? `inset 0 -4px 0 ${C.text}` : undefined}}>
              …is entitled:
            </span>{' '}
            {GPT_TITLE.map((w, i) => {
              const t = ramp(g, cFills + 6 + i * 3, 14);
              return (
                <span key={i} style={{display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * (rand(i) * 120 - 60)}px)`, marginRight: 16}}>
                  {w}
                </span>
              );
            })}
          </div>
          <div style={{marginTop: 50, display: 'flex', gap: 24, justifyContent: 'center', opacity: hedgeT}}>
            {['I think', 'maybe', 'I’m not sure'].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: F.serif,
                  fontStyle: 'italic',
                  fontSize: 36,
                  color: C.muted,
                  border: `1.5px dashed ${C.lineStrong}`,
                  borderRadius: 12,
                  padding: '8px 20px',
                  textDecoration: 'line-through',
                }}
              >
                {h}
              </div>
            ))}
          </div>
          <div style={{marginTop: 54, fontFamily: F.sans, fontSize: 40, fontWeight: 650, color: C.text, opacity: readT}}>
            Confident wording isn’t a readout of what the model knows.
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 110, display: 'flex', justifyContent: 'center', opacity: asmT}}>
          <Tag tone="slate" dashed>Illustration · the words are ChatGPT’s published title</Tag>
        </div>
      </AbsoluteFill>

      {/* Side by side: answer vs record */}
      <AbsoluteFill style={{opacity: sbsIn}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: F.sans, fontSize: 40, fontWeight: 700, color: C.text, opacity: spotT * (1 - sameT)}}>
          Spot the difference?
        </div>
        {[0, 1].map((side) => {
          const isRecord = side === 1;
          const x = isRecord ? 990 : 90;
          return (
            <div
              key={side}
              style={{
                position: 'absolute',
                left: x,
                top: 160,
                width: 840,
                borderRadius: 22,
                background: `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.surface} 100%)`,
                border: `1.5px solid ${C.lineStrong}`,
                boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                padding: '30px 40px 20px',
                transform: `translateY(${(1 - ramp(g, cHere + side * 5, 18)) * 40}px)`,
                opacity: ramp(g, cHere + side * 5, 18),
              }}
            >
              <div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16}}>
                <div style={{fontFamily: F.sans, fontWeight: 750, fontSize: 32, color: C.text}}>{isRecord ? 'The record' : 'ChatGPT'}</div>
                <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 22, color: C.muted}}>{isRecord ? 'Kalai’s thesis, CMU-CS-01-132' : 'GPT-4o · May 2025'}</div>
              </div>
              <Field
                label="TITLE"
                serif
                value={isRecord ? '“Probabilistic and On-line Methods in Machine Learning”' : '“Boosting, Online Algorithms, and Other Topics in Machine Learning”'}
                state={titleT}
                tone={isRecord ? 'teal' : 'coral'}
                tag={isRecord ? undefined : 'Not in the record'}
              />
              <Field label="SCHOOL" value={isRecord ? 'Carnegie Mellon University' : 'CMU'} state={sameT} tone="teal" tag={isRecord ? undefined : 'Matches'} />
              <Field label="YEAR" value={isRecord ? '2001' : '2002'} state={yearT} tone={isRecord ? 'teal' : 'coral'} tag={isRecord ? undefined : 'Not in the record'} />
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 1080, top: 600, opacity: evidT, transform: `translateY(${(1 - evidT) * 30}px)`}}>
          <Doc src="img/thesis_title_block.png" width={660} aspect={693 / 1632} pad={18} />
          <div style={{marginTop: 10, fontFamily: F.sans, fontSize: 20, color: C.muted}}>Evidence: the thesis title page itself</div>
        </div>
        <div style={{position: 'absolute', left: 90, top: 820, width: 840, fontFamily: F.sans, fontSize: 34, fontWeight: 650, color: C.text, lineHeight: 1.3, opacity: evidT}}>
          The invented details are formatted just as neatly as the true one.
        </div>
        <SourceLine opacity={sbsIn}>
          Left: GPT-4o’s answer as excerpted in Kalai et al. (2025), Table 1 · Right: thesis title page, A. Kalai, “Probabilistic and On-line Methods in Machine Learning,” Carnegie Mellon University, May 16, 2001 (CMU-CS-01-132)
        </SourceLine>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
