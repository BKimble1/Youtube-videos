import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {rand} from './lib/anim';

const Base: React.FC<{children: React.ReactNode; glow?: string}> = ({children, glow = 'rgba(255,111,94,0.18)'}) => (
  <AbsoluteFill style={{background: `radial-gradient(110% 90% at 50% 40%, #13213B 0%, ${C.bg1} 55%, ${C.bg0} 100%)`, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(50% 60% at 62% 50%, ${glow} 0%, transparent 70%)`}} />
    {children}
  </AbsoluteFill>
);

/** A: the verified fabricated detail, stamped. */
export const ThumbA: React.FC = () => (
  <Base>
    <div
      style={{
        position: 'absolute',
        left: 50,
        top: 70,
        width: 1150,
        padding: '34px 46px',
        borderRadius: 26,
        background: `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.surface} 100%)`,
        border: `2px solid ${C.lineStrong}`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        transform: 'rotate(-2deg)',
      }}
    >
      <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: C.muted}}>Dissertation title:</div>
      <div style={{fontFamily: F.serif, fontSize: 80, lineHeight: 1.14, color: C.text, marginTop: 10}}>
        <span style={{background: 'rgba(255,111,94,0.22)', boxShadow: `inset 0 -7px 0 ${C.coral}`, borderRadius: 6, padding: '0 6px'}}>
          “Boosting, Online Algorithms, and Other Topics in Machine Learning”
        </span>
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 46,
        bottom: 46,
        transform: 'rotate(-5deg)',
        border: `8px solid ${C.coral}`,
        borderRadius: 18,
        padding: '10px 28px',
        fontFamily: F.sans,
        fontWeight: 900,
        fontSize: 92,
        letterSpacing: '0.01em',
        color: C.coral,
        background: 'rgba(8,16,30,0.82)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      IT MADE THIS UP
    </div>
  </Base>
);

/** B: the core idea as type, with real token tiles. */
export const ThumbB: React.FC = () => {
  const toks = ['Adam', ' Ta', 'uman', ' Kal', 'ai', '’s', ' Ph', '.D', ' dissertation'];
  return (
    <Base glow="rgba(60,201,180,0.14)">
      <div style={{position: 'absolute', left: 60, top: 70, display: 'flex', gap: 12, opacity: 0.5}}>
        {toks.map((t, i) => (
          <div key={i} style={{padding: '10px 16px', borderRadius: 12, background: C.surface, border: `2px solid ${C.lineStrong}`, fontFamily: F.serif, fontSize: 38, color: C.text}}>
            {t.trim()}
          </div>
        ))}
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 170, letterSpacing: '-0.04em', color: C.text, lineHeight: 1, marginTop: 30, whiteSpace: 'nowrap'}}>
          LIKELY <span style={{color: C.coral}}>≠</span> TRUE
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', gap: 16}}>
        {[0.31, 0.26, 0.12, 0.09].map((p, i) => (
          <div key={i} style={{width: p * 1400, height: 26, borderRadius: 13, background: i === 0 ? C.text : 'rgba(185,193,207,0.45)'}} />
        ))}
      </div>
    </Base>
  );
};

/** C: three confident answers, all fabricated. */
export const ThumbC: React.FC = () => {
  const rows = [
    ['ChatGPT', '“Boosting, Online Algorithms, and Other Topics…”'],
    ['DeepSeek', '“Algebraic Methods in Interactive Machine…”'],
    ['Llama', '“Efficient Algorithms for Learning and…”'],
  ];
  return (
    <Base>
      <div style={{position: 'absolute', left: 60, top: 60, width: 760, display: 'flex', flexDirection: 'column', gap: 22}}>
        {rows.map(([m, t], i) => (
          <div
            key={m}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '22px 26px',
              borderRadius: 20,
              background: `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.surface} 100%)`,
              border: `2px solid ${C.lineStrong}`,
              boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
              transform: `rotate(${(rand(i + 2) - 0.5) * 3}deg)`,
            }}
          >
            <div style={{width: 64, height: 64, borderRadius: 14, border: `4px solid ${C.coral}`, color: C.coral, fontFamily: F.sans, fontWeight: 900, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              ✕
            </div>
            <div>
              <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 30, color: C.muted}}>{m}</div>
              <div style={{fontFamily: F.serif, fontSize: 34, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', width: 600, textOverflow: 'ellipsis'}}>{t}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', right: 50, top: 150, width: 420, textAlign: 'right'}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 112, lineHeight: 0.98, color: C.text, letterSpacing: '-0.03em'}}>3 titles.</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 112, lineHeight: 0.98, color: C.coral, letterSpacing: '-0.03em', marginTop: 14}}>All made up.</div>
      </div>
    </Base>
  );
};
