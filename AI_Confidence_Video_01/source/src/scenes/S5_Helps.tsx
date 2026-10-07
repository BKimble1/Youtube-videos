import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {Doc, Photo} from '../components/Doc';
import {Headline, SourceLine, Tag} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, lerp, ramp} from '../lib/anim';
import {C, F} from '../theme';

const Node: React.FC<{x: number; y: number; w?: number; label: string; sub?: string; on: number; tone?: 'text' | 'teal' | 'coral' | 'muted'; dashed?: boolean}> = ({
  x,
  y,
  w = 330,
  label,
  sub,
  on,
  tone = 'text',
  dashed,
}) => {
  const col = tone === 'teal' ? C.teal : tone === 'coral' ? C.coral : tone === 'muted' ? C.muted : C.text;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - 60,
        width: w,
        height: 120,
        borderRadius: 18,
        border: `${dashed ? '2px dashed' : '2px solid'} ${on > 0.5 ? col : C.lineStrong}`,
        background: on > 0.5 ? `rgba(${tone === 'coral' ? '255,111,94' : tone === 'teal' ? '60,201,180' : '243,238,228'},${0.1 + 0.08 * on})` : 'rgba(21,33,58,0.85)',
        boxShadow: on > 0.5 ? `0 0 ${30 * on}px rgba(${tone === 'coral' ? '255,111,94' : tone === 'teal' ? '60,201,180' : '243,238,228'},0.25)` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.45 + 0.55 * on,
      }}
    >
      <div style={{fontFamily: F.sans, fontSize: 32, fontWeight: 700, color: on > 0.5 ? col : C.textDim}}>{label}</div>
      {sub && <div style={{fontFamily: F.sans, fontSize: 20, color: C.muted, marginTop: 6}}>{sub}</div>}
    </div>
  );
};

export const S5Helps: React.FC = () => {
  const g = useG();
  const c0 = at('s30');
  const cCheck = at('s30', 'check');
  const cHere = at('s31', "Here's");
  const cProb = at('s31', 'Probabilistic');
  const cCarnegie = at('s31', 'Carnegie');
  const cMay = at('s31', 'May');
  const cAnd = at('s32', 'And');
  const cExist = at('s32', 'exist,');
  const cSay = at('s32', 'say');
  const cResearchers = at('s33');
  const cAnthropic = at('s33', 'Anthropic');
  const cDefault = at('s33', 'default');
  const cRecog = at('s33', 'Recognizing');
  const cFor = at('s33', 'for');
  const cFamiliarName = at('s33', 'familiar');
  const cSwitches = at('s33', 'switches');
  const cOff = at('s33', 'off.');
  const cMisfire = at('s34', 'misfires,');
  const cFamiliar = at('s34', 'familiar');
  const cFacts = at('s34', 'facts');
  const cGuess = at('s34', 'guess.');
  const cKnowing = at('s34', 'Knowing');
  const cSearch = at('s35', 'Search,');
  const cRandom = at('s35', 'randomness');
  const cConsistent = at('s35', 'consistent,');
  const cNone = at('s35', 'None');
  const cEnd = segEnd('s35');

  // Phase A: library photo + headline
  const photoT = ramp(g, c0 - 8, 20) * (1 - ramp(g, cHere - 6, 14));
  const headT = ramp(g, at('s30', 'unglamorous') - 4, 14);
  // Phase B: thesis title page + checklist
  const thesisIn = ramp(g, cHere, 18);
  const boxTitle = ramp(g, cProb, 16);
  const boxCMU = ramp(g, cCarnegie, 14);
  const boxDate = ramp(g, cMay, 14);
  const boxCommittee = ramp(g, cMay + 26, 14);
  const checkIn = ramp(g, cAnd, 16);
  const q1 = ramp(g, cExist, 12);
  const q2 = ramp(g, cSay, 12);
  const thesisOut = ramp(g, at('s33', 'Claude') - 8, 8);
  // Phase C: Anthropic finding
  const anthIn = ramp(g, at('s33', 'Claude'), 10);
  const headerT = ramp(g, at('s33', 'Claude'), 10) * (1 - ramp(g, cAnthropic + 8, 8));
  const figT = ramp(g, cAnthropic + 14, 10) * (1 - ramp(g, cFor + 2, 8));
  const diagIn = ramp(g, cFor + 8, 12);
  const famOn = ramp(g, cFamiliarName, 12);
  const inhibit = ramp(g, cSwitches, 16, easeInOut);
  const misT = ramp(g, cMisfire - 4, 12);
  const factsEmpty = ramp(g, cFacts, 12);
  const guessOn = ramp(g, cGuess - 6, 14);
  const knowingT = ramp(g, cKnowing, 14);
  const anthOut = ramp(g, cSearch - 6, 14);
  // Phase D: tools
  const toolsIn = ramp(g, cSearch, 16);
  const randT = ramp(g, cRandom, 14);
  const consT = ramp(g, cConsistent, 14);
  const noneT = ramp(g, cNone, 14);
  const sceneOut = 1 - ramp(g, cEnd + 18, 10);

  // default node: on unless inhibited
  const misfire = g >= cMisfire - 4;
  const canOn = 1 - inhibit;

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Backdrop />

      {/* Library photo */}
      <AbsoluteFill style={{opacity: photoT}}>
        <Photo src="img/photo_library_stacks_1912.jpg" t={ramp(g, c0 - 8, 150, (x) => x)} zoomFrom={1.03} zoomTo={1.12} originX={60} originY={45} darken={0.5} />
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{fontFamily: F.sans, fontSize: 44, fontWeight: 650, color: C.textDim, marginBottom: 26, opacity: ramp(g, c0 - 2, 14), textShadow: '0 4px 30px rgba(0,0,0,0.7)'}}>
            So what actually helps?
          </div>
          <Headline size={120} style={{textAlign: 'center', opacity: headT, textShadow: '0 4px 30px rgba(0,0,0,0.6)', transform: `translateY(${(1 - headT) * 16}px)`}}>
            Check the record.
          </Headline>
        </AbsoluteFill>
        <SourceLine opacity={photoT}>Photo: library stacks, Smithsonian Institution Building, c. 1912 · Smithsonian Institution Archives (CC0)</SourceLine>
      </AbsoluteFill>

      {/* The actual thesis */}
      <AbsoluteFill style={{opacity: thesisIn * (1 - thesisOut)}}>
        <div style={{position: 'absolute', left: lerp(560, 120, ramp(g, cAnd - 4, 20, easeInOut)), top: 70, transform: `translateY(${(1 - thesisIn) * 30}px)`}}>
          <Doc
            src="img/thesis_titlepage_top.png"
            width={820}
            aspect={1947 / 2040}
            pad={22}
            boxes={[
              {x: 0.18, y: 0.115, w: 0.64, h: 0.103, t: boxTitle, tone: 'teal', label: 'Title', labelSide: 'top'},
              {x: 0.42, y: 0.343, w: 0.16, h: 0.053, t: boxDate, tone: 'teal', padY: 3},
              {x: 0.373, y: 0.558, w: 0.254, h: 0.022, t: boxCMU, tone: 'teal', padY: 2},
              {x: 0.42, y: 0.928, w: 0.158, h: 0.022, t: boxCommittee, tone: 'ink', label: 'Co-author of the 2025 paper', labelSide: 'bottom', padY: 2},
            ]}
          />
        </div>
        <div style={{position: 'absolute', left: 1080, top: 170, width: 740, opacity: checkIn, transform: `translateX(${(1 - checkIn) * 30}px)`}}>
          <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: C.muted}}>CHECKING A CLAIM</div>
          <div style={{marginTop: 30, padding: '24px 28px', borderRadius: 18, background: C.surface, border: `1.5px solid ${C.lineStrong}`}}>
            <div style={{fontFamily: F.sans, fontSize: 22, color: C.muted}}>Claim (ChatGPT, GPT-4o, May 9, 2025, no web search)</div>
            <div style={{fontFamily: F.serif, fontSize: 30, color: C.text, marginTop: 8, lineHeight: 1.3}}>
              “Boosting, Online Algorithms, and Other Topics in Machine Learning,” completed in 2002 at CMU
            </div>
          </div>
          {[
            {q: 'Is there a real source?', a: 'Yes: Kalai’s actual CMU thesis (CMU-CS-01-132)', t: q1, tone: 'teal' as const},
            {q: 'Does it actually say this?', a: 'No: a different title, and 2001, not 2002', t: q2, tone: 'coral' as const},
          ].map((r, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 30, opacity: 0.35 + 0.65 * r.t}}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 14,
                  border: `2px solid ${r.t > 0.5 ? (r.tone === 'teal' ? C.teal : C.coral) : C.lineStrong}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F.sans,
                  fontWeight: 800,
                  fontSize: 36,
                  color: r.tone === 'teal' ? C.teal : C.coral,
                }}
              >
                <span style={{opacity: r.t}}>{r.tone === 'teal' ? '✓' : '✕'}</span>
              </div>
              <div>
                <div style={{fontFamily: F.sans, fontSize: 34, fontWeight: 700, color: C.text}}>{r.q}</div>
                <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 600, color: r.tone === 'teal' ? C.teal : C.coral, opacity: r.t, marginTop: 4}}>{r.a}</div>
              </div>
            </div>
          ))}
          <div style={{marginTop: 34, opacity: q2}}>
            <Doc src="img/paper_p19_kalai2001.png" width={690} aspect={167 / 2000} pad={14} />
            <div style={{fontFamily: F.sans, fontSize: 20, color: C.muted, marginTop: 10}}>Also listed in the paper’s own references (p. 19)</div>
          </div>
        </div>
        <SourceLine opacity={thesisIn}>Thesis title page: A. Kalai, Carnegie Mellon University, May 16, 2001 (CMU-CS-01-132), via Microsoft Research’s copy · Reference: Kalai et al. (2025), p. 19</SourceLine>
      </AbsoluteFill>

      {/* Anthropic: where "I don't know" lives (one model) */}
      <AbsoluteFill style={{opacity: anthIn * (1 - anthOut)}}>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: headerT}}>
          <div style={{borderRadius: 14, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.5)'}}>
            <Img src={staticFile('img/anthropic_header.png')} style={{width: 1500, display: 'block'}} />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: figT}}>
          <div style={{background: '#fff', padding: 24, borderRadius: 14, boxShadow: '0 40px 90px rgba(0,0,0,0.5)'}}>
            <Img src={staticFile('img/anthropic_fig7.png')} style={{width: 1180, display: 'block'}} />
          </div>
        </AbsoluteFill>
        {/* Simplified diagram, redrawn */}
        <AbsoluteFill style={{opacity: diagIn}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 64, textAlign: 'center', fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: C.muted}}>
            WHY A FAMILIAR NAME ISN’T ENOUGH · ONE MECHANISM, ONE MODEL (SIMPLIFIED)
          </div>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={C.textDim} />
              </marker>
            </defs>
            {/* familiar -> can't answer : inhibition (bar end) */}
            <path d="M 560 500 C 680 420, 760 360, 790 340" stroke={C.text} strokeWidth={4} fill="none" strokeDasharray={320} strokeDashoffset={320 * (1 - inhibit)} />
            <line x1={776} y1={322} x2={806} y2={360} stroke={C.text} strokeWidth={7} opacity={inhibit} />
            <text x={470} y={420} fill={C.text} fontFamily="Inter Variable" fontSize={24} fontWeight={650} opacity={inhibit}>switches off</text>
            {/* familiar -> facts */}
            <path d="M 560 580 C 650 640, 720 690, 772 722" stroke={misfire ? C.lineStrong : C.textDim} strokeWidth={3} fill="none" markerEnd="url(#arr)" opacity={famOn} />
            {/* can't answer -> output */}
            <path d="M 1140 330 C 1260 330, 1300 470, 1335 500" stroke={C.textDim} strokeWidth={3} fill="none" markerEnd="url(#arr)" opacity={0.25 + 0.75 * canOn} />
            {/* facts -> output */}
            <path d="M 1140 750 C 1260 750, 1300 610, 1335 580" stroke={C.textDim} strokeWidth={3} fill="none" markerEnd="url(#arr)" opacity={misfire ? 0.25 : famOn} />
          </svg>
          <Node x={420} y={540} w={300} label="Familiar name?" sub={famOn > 0.5 ? 'yes' : 'checking…'} on={famOn} tone="text" />
          <Node x={960} y={330} w={360} label="“I can’t answer”" sub="on by default" on={canOn} tone="teal" />
          <Node x={960} y={750} w={360} label="Facts about them" sub={misfire && factsEmpty > 0.5 ? 'nothing there' : 'stored knowledge'} on={misfire ? 0.15 : famOn} tone="muted" dashed={misfire && factsEmpty > 0.5} />
          <Node
            x={1520}
            y={540}
            w={340}
            label={misfire ? 'Plausible guess' : inhibit > 0.5 ? 'Answer' : '“I don’t know”'}
            sub={misfire ? 'fluent, possibly untrue' : inhibit > 0.5 ? 'from what it knows' : 'declines'}
            on={misfire ? guessOn : 1}
            tone={misfire ? 'coral' : inhibit > 0.5 ? 'text' : 'teal'}
          />
          <div style={{position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', fontFamily: F.sans, fontSize: 40, fontWeight: 650, color: C.text, opacity: knowingT}}>
            Knowing a name isn’t knowing the facts.
          </div>
          <div style={{position: 'absolute', left: 250, top: 640, opacity: misT}}>
            <Tag tone="coral">Misfire: name feels familiar</Tag>
          </div>
        </AbsoluteFill>
        <SourceLine opacity={anthIn}>
          {figT > 0.5 || headerT > 0.5 ? 'Article and figure: Anthropic, “Tracing the thoughts of a large language model” (Mar 27, 2025)' : 'Diagram: our simplified redraw, based on Anthropic (Mar 27, 2025)'} · one Claude model (Claude 3.5 Haiku, per Anthropic’s summary)
        </SourceLine>
      </AbsoluteFill>

      {/* Tools: help, with conditions */}
      <AbsoluteFill style={{opacity: toolsIn}}>
        <div style={{position: 'absolute', left: 225, top: 230, display: 'flex', gap: 30}}>
          {[
            ['Search', at('s35', 'Search,')],
            ['Retrieval', at('s35', 'retrieval,')],
            ['Longer reasoning', at('s35', 'longer')],
          ].map(([t, f]) => (
            <div key={t as string} style={{width: 470, height: 130, borderRadius: 20, background: C.surface, border: `1.5px solid ${C.lineStrong}`, padding: '0 32px', display: 'flex', alignItems: 'center', opacity: ramp(g, (f as number) - 3, 12)}}>
              <div style={{fontFamily: F.sans, fontSize: 40, fontWeight: 750, color: C.text}}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 225, top: 384, fontFamily: F.sans, fontSize: 32, fontWeight: 650, color: C.teal, opacity: ramp(g, at('s35', 'help') - 2, 12)}}>
          …help when they bring in the right evidence.
          <span style={{marginLeft: 24, fontSize: 26, fontWeight: 500, color: C.textDim}}>e.g. the actual thesis record: 2001</span>
        </div>
        <div style={{position: 'absolute', left: 225, top: 480, width: 1470, borderRadius: 20, background: C.surface, border: `1.5px solid ${C.lineStrong}`, padding: 32, opacity: randT}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 40}}>
            <div style={{width: 470}}>
              <div style={{fontFamily: F.sans, fontSize: 40, fontWeight: 750, color: C.text}}>Less randomness</div>
              <div style={{fontFamily: F.sans, fontSize: 24, color: C.muted, marginTop: 8}}>(lower “temperature”)</div>
            </div>
            <div style={{display: 'flex', gap: 18}}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{padding: '16px 24px', borderRadius: 14, border: `2px solid ${C.coral}`, background: C.coralDim, fontFamily: F.mono, fontSize: 32, color: C.text, opacity: ramp(g, cConsistent + k * 4, 10)}}>
                  2002
                </div>
              ))}
            </div>
            <div style={{fontFamily: F.sans, fontSize: 30, fontWeight: 650, color: C.text, opacity: consT, lineHeight: 1.3}}>
              more consistent ≠ more correct
            </div>
          </div>
          <div style={{marginTop: 16, opacity: consT}}>
            <Tag tone="slate" dashed size={18}>Illustration</Tag>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', opacity: noneT}}>
          <div style={{fontFamily: F.sans, fontSize: 80, fontWeight: 800, color: C.text, letterSpacing: '-0.02em'}}>No guarantees.</div>
        </div>
        <SourceLine opacity={toolsIn}>Search and reasoning “are not panaceas”: Kalai et al. (2025), Section 5 (p. 15)</SourceLine>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
