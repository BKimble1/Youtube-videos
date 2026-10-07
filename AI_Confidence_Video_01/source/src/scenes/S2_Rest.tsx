import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {Doc} from '../components/Doc';
import {SourceLine, Tag} from '../components/ui';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {easeInOut, ramp, rand} from '../lib/anim';
import {C, F} from '../theme';
import {S2Inside} from './S2_Inside';

const DATES = ['03-07', '15-06', '01-01'];

export const S2Rest: React.FC = () => {
  const g = useG();
  const cBecause = at('s12', 'Because');
  const cAsked = at('s12', 'Asked');
  const cThree = at('s12', 'three', 1);
  const cDiffer = at('s12', 'differently.');
  const cOnly = at('s12', 'only');
  const cKey = at('s13', "Here's");
  const cScores = at('s13', 'scores');
  const cNot = at('s13', 'Not');
  const cTrue = at('s13', 'true.');
  const cModern = at('s14', 'Modern');
  const cInstr = at('s14', 'instruction');
  const cReason = at('s14', 'step-by-step');
  const cSearch = at('s14', 'search.');
  const cStill = at('s14', 'still');
  const cEnd = segEnd('s14');

  const bIn = ramp(g, cBecause - 4, 16);
  const promptT = ramp(g, cBecause + 2, 14);
  const bOut = ramp(g, cKey - 6, 14);
  const mIn = ramp(g, cKey - 2, 16);
  const m1 = ramp(g, cScores, 22, easeInOut);
  const m2 = ramp(g, cNot, 14);
  const trueT = ramp(g, cNot + 6, 14);
  const mOut = ramp(g, cModern - 6, 14);
  const stIn = ramp(g, cModern, 16);
  const ring1 = ramp(g, cInstr, 16);
  const ring2 = ramp(g, cReason, 16);
  const ring3 = ramp(g, cSearch - 4, 16);
  const streamT = ramp(g, cStill, 20);
  const out = 1 - ramp(g, cEnd + 22, 10);

  return (
    <AbsoluteFill style={{opacity: out}}>
      {/* Same question, three tries */}
      <AbsoluteFill style={{opacity: bIn * (1 - bOut)}}>
        <Backdrop />
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: promptT}}>
          <div style={{fontFamily: F.sans, fontSize: 24, fontWeight: 700, letterSpacing: '0.12em', color: C.muted, marginBottom: 14}}>SAME PAPER, ANOTHER QUESTION, THREE TRIES</div>
          <div style={{marginBottom: 18}}>
            <Tag tone="slate" caps={false} size={20}>Model here: DeepSeek-V3, May 11, 2025 (not one of the three in Table 1)</Tag>
          </div>
          <div style={{transform: `scale(${1 + 0.035 * ramp(g, cBecause, cKey - cBecause, (x) => x)})`}}>
            <Doc
              src="img/paper_p01_birthday.png"
              width={1300}
              aspect={299 / 2000}
              pad={22}
              boxes={[
                {x: 0.505, y: 0.07, w: 0.412, h: 0.2, t: ramp(g, cOnly - 2, 14), tone: 'teal'},
                {x: 0.083, y: 0.628, w: 0.302, h: 0.15, t: ramp(g, cThree, 14), tone: 'coral'},
                {x: 0.014, y: 0.852, w: 0.262, h: 0.125, t: ramp(g, cThree + 24, 14), tone: 'teal'},
              ]}
            />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', gap: 40}}>
          {DATES.map((d, i) => {
            // empty outlines on "differently", filled with each wrong date on "three different dates"
            const shell = ramp(g, cDiffer + i * 5, 12);
            const t = ramp(g, cThree + i * 7, 12);
            return (
              <div
                key={d}
                style={{
                  width: 380,
                  padding: '28px 30px',
                  borderRadius: 20,
                  position: 'relative',
                  background: `linear-gradient(180deg, rgba(27,41,71,${t}) 0%, rgba(21,33,58,${t}) 100%)`,
                  border: `1.5px ${t > 0.5 ? 'solid' : 'dashed'} ${C.lineStrong}`,
                  opacity: shell,
                  transform: `translateY(${(1 - shell) * 30 - t * 6}px) rotate(${(rand(i + 3) - 0.5) * 3 * t}deg)`,
                }}
              >
                <div style={{fontFamily: F.sans, fontSize: 22, color: C.muted}}>Attempt {i + 1}</div>
                <div style={{position: 'relative', height: 94, marginTop: 6}}>
                  <div style={{position: 'absolute', fontFamily: F.mono, fontSize: 78, fontWeight: 700, color: C.muted, opacity: 0.6 * (1 - t)}}>??-??</div>
                  <div style={{position: 'absolute', fontFamily: F.mono, fontSize: 78, fontWeight: 700, color: C.text, opacity: t}}>{d}</div>
                </div>
                <div style={{marginTop: 12, opacity: t}}>
                  <Tag tone="coral" size={17}>✕ Incorrect</Tag>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 870, textAlign: 'center', fontFamily: F.sans, fontSize: 30, color: C.textDim, opacity: ramp(g, cThree + 24, 14)}}>
          The real date is in autumn, the paper notes. A response was requested only if known.
        </div>
        <SourceLine opacity={bIn}>DeepSeek-V3 via the DeepSeek app, May 11, 2025 · three separate attempts · Kalai et al. (2025), p. 1</SourceLine>
      </AbsoluteFill>

      {/* Likely vs true */}
      <AbsoluteFill style={{opacity: mIn * (1 - mOut)}}>
        <Backdrop />
        <div style={{position: 'absolute', left: 170, top: 230, width: 1580}}>
          <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: C.muted}}>WHAT THE SCORE MEASURES</div>
          <div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 40}}>
            <div style={{width: 700, fontFamily: F.sans, fontSize: 44, fontWeight: 700, color: C.text}}>How likely to come next</div>
            <div style={{flex: 1, height: 48, borderRadius: 24, background: 'rgba(243,238,228,0.08)', border: `1.5px solid ${C.lineStrong}`, overflow: 'hidden'}}>
              <div style={{width: `${m1 * 72}%`, height: '100%', background: C.text, borderRadius: 24}} />
            </div>
          </div>
          <div style={{marginTop: 70, display: 'flex', alignItems: 'center', gap: 40, opacity: 0.3 + 0.7 * m2}}>
            <div style={{width: 700, fontFamily: F.sans, fontSize: 44, fontWeight: 700, color: C.text}}>How likely to be true</div>
            <div style={{flex: 1, height: 48, borderRadius: 24, border: `2px dashed ${C.lineStrong}`, display: 'flex', alignItems: 'center', paddingLeft: 26}}>
              <span style={{fontFamily: F.sans, fontSize: 26, color: C.muted, opacity: m2}}>not what this score measures</span>
            </div>
          </div>
          <div style={{marginTop: 110, textAlign: 'center', fontFamily: F.sans, fontSize: 72, fontWeight: 760, color: C.text, letterSpacing: '-0.02em', opacity: trueT}}>
            likely isn’t the same as true
          </div>
        </div>
      </AbsoluteFill>

      {/* Modern assistants: layers on top, token-by-token underneath */}
      <AbsoluteFill style={{opacity: stIn}}>
        <Backdrop />
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          {[
            {r: 420, t: ring3, label: 'sometimes: web search & tools'},
            {r: 320, t: ring2, label: 'step-by-step reasoning'},
            {r: 220, t: ring1, label: 'instruction training'},
          ].map((ring, i) => (
            <g key={i} opacity={ring.t}>
              <circle cx={700} cy={540} r={ring.r} fill={`rgba(27,41,71,${0.18 * ring.t})`} stroke={C.lineStrong} strokeWidth={2.5} strokeDasharray={`${2 * Math.PI * ring.r * ring.t} 9999`} transform="rotate(-90 700 540)" />
              <text x={700} y={540 - ring.r + 42} textAnchor="middle" fill={C.text} fontFamily="Inter Variable" fontSize={30} fontWeight={650} stroke={C.bg1} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">
                {ring.label}
              </text>
            </g>
          ))}
          <circle cx={700} cy={540} r={128} fill="rgba(27,41,71,0.97)" stroke={C.text} strokeWidth={3} />
          <text x={700} y={530} textAnchor="middle" fill={C.text} fontFamily="Inter Variable" fontSize={32} fontWeight={750}>
            next-token
          </text>
          <text x={700} y={570} textAnchor="middle" fill={C.text} fontFamily="Inter Variable" fontSize={32} fontWeight={750}>
            generator
          </text>
        </svg>
        {/* token stream */}
        <div style={{position: 'absolute', left: 1150, top: 500, display: 'flex', gap: 10, opacity: stIn}}>
          {['Adam', 'Ta', 'uman', 'Kal', 'ai', '’s', '…'].map((t, i) => {
            const tt = ramp(g, cModern + 6 + i * 9, 8);
            return (
              <div key={i} style={{padding: '10px 14px', borderRadius: 10, background: 'rgba(27,41,71,0.95)', border: `1.5px solid ${C.lineStrong}`, fontFamily: F.serif, fontSize: 32, color: C.text, opacity: tt, transform: `translateX(${(1 - tt) * -40}px)`}}>
                {t}
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 1150, top: 610, width: 700, fontFamily: F.sans, fontSize: 38, fontWeight: 700, color: C.text, opacity: streamT}}>
          The answer is still written
          <br />
          token by token.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const S2Scene: React.FC = () => (
  <AbsoluteFill>
    <S2Inside />
    <S2Rest />
  </AbsoluteFill>
);

