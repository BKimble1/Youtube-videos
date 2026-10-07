import React from 'react';
import {C, F} from '../theme';

export type Span = {text: string; mark?: 'coral' | 'teal' | 'strike' | 'dim' | 'warm'; markT?: number; key?: string};

/** Inline text with animated highlight marks. markT ∈ [0,1] sweeps the highlight in. */
export const MarkedText: React.FC<{spans: Span[]; style?: React.CSSProperties; dark?: boolean}> = ({spans, style, dark = true}) => (
  <span style={style}>
    {spans.map((s, i) => {
      const t = s.markT ?? (s.mark ? 1 : 0);
      if (!s.mark || t <= 0) return <span key={i}>{s.text}</span>;
      if (s.mark === 'dim') return <span key={i} style={{opacity: 1 - 0.65 * t}}>{s.text}</span>;
      if (s.mark === 'strike')
        return (
          <span key={i} style={{position: 'relative', opacity: 1 - 0.35 * t}}>
            {s.text}
            <span style={{position: 'absolute', left: 0, top: '54%', height: 4, width: `${t * 100}%`, background: C.coral, borderRadius: 2}} />
          </span>
        );
      const col = s.mark === 'coral' ? C.coral : s.mark === 'warm' ? 'rgba(243,238,228,0.75)' : C.teal;
      const bg = s.mark === 'coral' ? 'rgba(255,111,94,0.22)' : s.mark === 'warm' ? 'rgba(243,238,228,0.10)' : 'rgba(60,201,180,0.20)';
      return (
        <span
          key={i}
          style={{
            backgroundImage: `linear-gradient(${bg}, ${bg})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${t * 100}% 100%`,
            boxShadow: `inset 0 -4px 0 0 ${t > 0.98 ? col : 'transparent'}`,
            borderRadius: 4,
            padding: '0 3px',
            margin: '0 -3px',
            color: dark ? C.text : C.ink,
          }}
        >
          {s.text}
        </span>
      );
    })}
  </span>
);

/** Model label chip shown on every answer card so outputs are never confused between models. */
export const ModelChip: React.FC<{name: string; detail?: string; light?: boolean}> = ({name, detail, light}) => (
  <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
    <div
      style={{
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: 28,
        color: light ? C.ink : C.text,
        letterSpacing: '-0.005em',
      }}
    >
      {name}
    </div>
    {detail && (
      <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 22, color: light ? C.inkDim : C.muted}}>{detail}</div>
    )}
  </div>
);

/** A polished answer card. Every card uses the same treatment, so polish alone tells you nothing. */
export const AnswerCard: React.FC<{
  model: string;
  detail?: string;
  children: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
  footer?: React.ReactNode;
  accent?: string;
  light?: boolean;
}> = ({model, detail, children, width = 1100, style, footer, accent, light}) => (
  <div
    style={{
      width,
      borderRadius: 22,
      background: light ? C.paper : `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.surface} 100%)`,
      border: `1.5px solid ${accent ?? (light ? C.paperEdge : C.lineStrong)}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.04) inset',
      padding: '30px 40px 34px',
      ...style,
    }}
  >
    <ModelChip name={model} detail={detail} light={light} />
    <div
      style={{
        marginTop: 18,
        fontFamily: F.serif,
        fontSize: 40,
        lineHeight: 1.32,
        color: light ? C.ink : C.text,
        fontWeight: 420,
      }}
    >
      {children}
    </div>
    {footer && <div style={{marginTop: 20}}>{footer}</div>}
  </div>
);
