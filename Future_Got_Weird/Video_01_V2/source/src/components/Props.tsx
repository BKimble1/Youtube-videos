import React from 'react';
import {C, F, H, OUTLINE, W} from '../theme';
import {clamp01, lerp, rand} from '../lib/anim';

export type Span = {text: string; mark?: 'coral' | 'teal' | 'strike' | 'dim' | 'ink'; markT?: number};

/** Inline text with animated marks: underline sweep (coral/teal), strike-through, dim. */
export const Marked: React.FC<{spans: Span[]; style?: React.CSSProperties}> = ({spans, style}) => (
  <span style={style}>
    {spans.map((s, i) => {
      const t = s.markT ?? (s.mark ? 1 : 0);
      if (!s.mark || t <= 0) return <span key={i}>{s.text}</span>;
      if (s.mark === 'dim') return <span key={i} style={{opacity: 1 - 0.6 * t}}>{s.text}</span>;
      if (s.mark === 'strike')
        return (
          <span key={i} style={{position: 'relative', whiteSpace: 'nowrap'}}>
            {s.text}
            <span style={{position: 'absolute', left: -2, top: '52%', height: 5, width: `calc(${t * 100}% + 4px)`, background: C.coral, borderRadius: 3, transform: 'rotate(-1.5deg)'}} />
          </span>
        );
      const col = s.mark === 'coral' ? C.coral : s.mark === 'teal' ? C.teal : C.ink;
      const bg = s.mark === 'coral' ? C.coralLight : s.mark === 'teal' ? C.tealLight : C.saffronLight;
      return (
        <span
          key={i}
          style={{
            backgroundImage: `linear-gradient(${bg}, ${bg})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${t * 100}% 100%`,
            boxShadow: t > 0.98 ? `inset 0 -5px 0 0 ${col}` : 'none',
            borderRadius: 4,
            padding: '0 4px',
            margin: '0 -4px',
          }}
        >
          {s.text}
        </span>
      );
    })}
  </span>
);

/** A polished answer slip: the physical prop that every confident answer rides on. */
export const Slip: React.FC<{
  model: string;
  detail?: string;
  children: React.ReactNode;
  width?: number;
  fontSize?: number;
  rotate?: number;
  style?: React.CSSProperties;
  stamp?: {text: string; tone: 'coral' | 'teal'; t: number};
  header?: boolean;
  footer?: React.ReactNode;
}> = ({model, detail, children, width = 560, fontSize = 32, rotate = 0, style, stamp, header = true, footer}) => (
  <div
    style={{
      position: 'relative',
      width,
      background: C.cream,
      border: `${OUTLINE}px solid ${C.ink}`,
      borderRadius: 10,
      boxShadow: `8px 10px 0 ${C.shadow}`,
      padding: '22px 28px 24px',
      transform: `rotate(${rotate}deg)`,
      transformOrigin: '50% 50%',
      ...style,
    }}
  >
    {/* gold "polished" edge */}
    <div style={{position: 'absolute', left: 8, right: 8, top: 8, bottom: 8, border: `2px solid ${C.saffronDeep}`, borderRadius: 6, pointerEvents: 'none', opacity: 0.7}} />
    {header && (
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10}}>
        <div style={{fontFamily: F.display, fontWeight: 600, fontSize: fontSize * 0.9, color: C.ink}}>{model}</div>
        {detail && <div style={{fontFamily: F.body, fontWeight: 700, fontSize: fontSize * 0.62, color: C.inkMuted}}>{detail}</div>}
      </div>
    )}
    <div style={{fontFamily: F.serif, fontSize, lineHeight: 1.32, color: C.ink}}>{children}</div>
    {footer && <div style={{marginTop: 12}}>{footer}</div>}
    {stamp && stamp.t > 0 && <StampMark text={stamp.text} tone={stamp.tone} t={stamp.t} style={{position: 'absolute', right: -18, bottom: -26}} />}
  </div>
);

/** Rubber-stamp impression. t: 0 → 1 is the impact (scale 1.5 → 1 with a thud), then it stays. */
export const StampMark: React.FC<{text: string; tone: 'coral' | 'teal' | 'ink'; t: number; size?: number; rotate?: number; style?: React.CSSProperties}> = ({text, tone, t, size = 40, rotate = -12, style}) => {
  const col = tone === 'coral' ? C.coralDeep : tone === 'teal' ? C.tealDeep : C.ink;
  const k = clamp01(t);
  const sc = lerp(1.6, 1, Math.min(1, k * 1.25)) ;
  return (
    <div
      style={{
        display: 'inline-block',
        padding: `${size * 0.18}px ${size * 0.45}px`,
        border: `${Math.max(3, size * 0.14)}px solid ${col}`,
        borderRadius: size * 0.25,
        color: col,
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1,
        opacity: k < 0.05 ? 0 : 0.92,
        transform: `rotate(${rotate}deg) scale(${sc})`,
        mixBlendMode: 'multiply',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Hand stamper (held by the fact-checker). press: 0 up … 1 down. Local origin at the handle grip. */
export const Stamper: React.FC<{press?: number; color?: string; scale?: number}> = ({press = 0, color = C.coral, scale = 1}) => (
  <svg viewBox="-60 -40 120 150" width={120 * scale} height={150 * scale} style={{position: 'absolute', left: -60 * scale, top: -40 * scale, overflow: 'visible'}}>
    <g transform={`translate(0 ${press * 18})`}>
      <rect x={-14} y={-34} width={28} height={54} rx={10} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={-44} y={16} width={88} height={30} rx={8} fill={color} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={-40} y={46} width={80} height={14} rx={3} fill={C.ink} />
    </g>
  </svg>
);

/** Gold trophy with optional cartoon feet (for the "trophy walks back" gag). */
export const Trophy: React.FC<{scale?: number; feet?: number; step?: number; style?: React.CSSProperties; sweat?: number}> = ({scale = 1, feet = 0, step = 0, style, sweat = 0}) => (
  <svg viewBox="-70 -140 140 160" width={140 * scale} height={160 * scale} style={{position: 'absolute', left: -70 * scale, top: -140 * scale, overflow: 'visible', ...style}}>
    {feet > 0 && (
      <g opacity={feet}>
        <ellipse cx={-18} cy={14 + Math.max(0, Math.sin(step) * -8)} rx={16} ry={7} fill={C.ink} />
        <ellipse cx={18} cy={14 + Math.max(0, Math.sin(step + Math.PI) * -8)} rx={16} ry={7} fill={C.ink} />
      </g>
    )}
    <rect x={-40} y={-4} width={80} height={16} rx={5} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-22} y={-30} width={44} height={28} rx={4} fill={C.saffronDeep} stroke={C.ink} strokeWidth={OUTLINE} />
    <path d="M -46 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q -30 -36 -38 -62 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    <path d="M -46 -104 Q -78 -100 -62 -68 Q -54 -56 -40 -60" fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} strokeLinecap="round" />
    <path d="M -46 -104 Q -78 -100 -62 -68 Q -54 -56 -40 -60" fill="none" stroke={C.saffron} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
    <path d="M 46 -104 Q 78 -100 62 -68 Q 54 -56 40 -60" fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} strokeLinecap="round" />
    <path d="M 46 -104 Q 78 -100 62 -68 Q 54 -56 40 -60" fill="none" stroke={C.saffron} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
    <path d="M -34 -112 L -28 -70" stroke={C.saffronLight} strokeWidth={6} strokeLinecap="round" />
    <text x={0} y={-80} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={26} fill={C.ink}>1</text>
    {sweat > 0 && <path d="M 54 -126 Q 60 -112 54 -108 Q 48 -112 54 -126 Z" fill={C.blue} stroke={C.ink} strokeWidth={2} opacity={sweat} />}
  </svg>
);

/** Game-show podium with a nameplate. Origin: bottom centre. */
export const Podium: React.FC<{name: string; color: string; scale?: number; style?: React.CSSProperties}> = ({name, color, scale = 1, style}) => (
  <div style={{position: 'absolute', left: -150 * scale, top: -230 * scale, width: 300 * scale, height: 230 * scale, ...style}}>
    <svg viewBox="-150 -230 300 230" width={300 * scale} height={230 * scale} style={{overflow: 'visible'}}>
      <path d="M -120 -230 L 120 -230 L 140 0 L -140 0 Z" fill={color} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <rect x={-130} y={-242} width={260} height={24} rx={6} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={-100} y={-150} width={200} height={54} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <text x={0} y={-112} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={34} fill={C.ink}>{name}</text>
      <circle cx={0} cy={-45} r={16} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
    </svg>
  </div>
);

/** Score counter with big mono digits (a solid block, no flip gimmick: readable at phone size). */
export const Scoreboard: React.FC<{value: number | string; label?: string; tone?: 'ink' | 'teal' | 'coral'; scale?: number; style?: React.CSSProperties; pulse?: number}> = ({value, label, tone = 'ink', scale = 1, style, pulse = 0}) => {
  const bg = tone === 'teal' ? C.teal : tone === 'coral' ? C.coral : C.ink;
  return (
    <div style={{position: 'absolute', transform: `scale(${scale * (1 + 0.08 * pulse)})`, transformOrigin: '50% 100%', ...style}}>
      <div style={{background: bg, color: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 18, padding: '6px 26px', fontFamily: F.mono, fontWeight: 700, fontSize: 96, lineHeight: 1.05, textAlign: 'center', minWidth: 150, boxShadow: `6px 8px 0 ${C.shadow}`}}>{value}</div>
      {label && <div style={{marginTop: 8, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 26, color: C.inkSoft}}>{label}</div>}
    </div>
  );
};

export type TileState = 'empty' | 'known' | 'blank' | 'guessing' | 'lucky' | 'wrong';
/** One answer tile on the quiz board. */
export const AnswerTile: React.FC<{state: TileState; t?: number; frame?: number; i?: number; size?: number; delta?: {text: string; t: number; tone: 'teal' | 'coral'}}> = ({state, t = 1, frame = 0, i = 0, size = 86, delta}) => {
  const s = {
    empty: {bg: C.cream, bd: C.paperLine, fg: C.inkMuted, glyph: ''},
    known: {bg: C.tealLight, bd: C.teal, fg: C.tealDeep, glyph: '✓'},
    blank: {bg: C.cream, bd: C.inkMuted, fg: C.inkMuted, glyph: '—'},
    guessing: {bg: C.saffronLight, bd: C.saffronDeep, fg: C.ink, glyph: 'ABCD'[Math.floor(frame / 3 + i) % 4]},
    lucky: {bg: C.tealLight, bd: C.teal, fg: C.tealDeep, glyph: '✓'},
    wrong: {bg: C.coralLight, bd: C.coral, fg: C.coralDeep, glyph: '✕'},
  }[state];
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 14, border: `3px solid ${C.paperLine}`, background: C.cream}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          background: s.bg,
          border: `${OUTLINE}px ${state === 'lucky' ? 'dashed' : 'solid'} ${s.bd}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: state === 'guessing' ? F.mono : F.display,
          fontWeight: 700,
          fontSize: size * 0.5,
          color: s.fg,
          opacity: t,
          transform: `scale(${lerp(0.6, 1, t)})`,
        }}
      >
        {s.glyph}
      </div>
      {delta && delta.t > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: -34 - 14 * delta.t, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: delta.tone === 'teal' ? C.tealDeep : C.coralDeep, opacity: delta.t}}>{delta.text}</div>
      )}
    </div>
  );
};

/** Rule card on the game-show rules board. flip: 0 shows value, 1 shows newValue (with a card flip). */
export const RuleCard: React.FC<{glyph: string; label: string; value: string; newValue?: string; flip?: number; tone: string; t?: number; width?: number}> = ({glyph, label, value, newValue, flip = 0, tone, t = 1, width = 330}) => {
  const showNew = flip > 0.5;
  const rot = flip <= 0.5 ? flip * 180 : (flip - 1) * 180;
  return (
    <div
      style={{
        width,
        height: 96,
        borderRadius: 16,
        background: C.cream,
        border: `${OUTLINE}px solid ${showNew ? C.coral : C.ink}`,
        boxShadow: `5px 6px 0 ${C.shadow}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: 16,
        opacity: t,
        transform: `translateY(${(1 - t) * 16}px) perspective(900px) rotateX(${rot}deg)`,
      }}
    >
      <div style={{fontFamily: F.display, fontSize: 40, fontWeight: 700, color: tone, width: 44, textAlign: 'center'}}>{glyph}</div>
      <div style={{flex: 1, fontFamily: F.body, fontSize: 28, fontWeight: 800, color: C.ink}}>{label}</div>
      <div style={{fontFamily: F.mono, fontSize: 42, fontWeight: 700, color: showNew ? C.coralDeep : C.ink}}>{showNew ? newValue : value}</div>
    </div>
  );
};

/** Token tile: a chunk of text on a small card. */
export const TokenTile: React.FC<{text: string; size?: number; tone?: 'paper' | 'teal' | 'coral' | 'saffron' | 'blue'; t?: number; style?: React.CSSProperties; sub?: string}> = ({text, size = 40, tone = 'paper', t = 1, style, sub}) => {
  const bg = {paper: C.cream, teal: C.tealLight, coral: C.coralLight, saffron: C.saffronLight, blue: C.blueLight}[tone];
  const bd = {paper: C.ink, teal: C.teal, coral: C.coral, saffron: C.saffronDeep, blue: C.blue}[tone];
  const shown = text === ' ' ? '␣' : text;
  return (
    <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', opacity: t, transform: `scale(${lerp(0.7, 1, t)})`, ...style}}>
      <div style={{padding: `${size * 0.18}px ${size * 0.34}px`, borderRadius: size * 0.22, background: bg, border: `${OUTLINE}px solid ${bd}`, fontFamily: F.serif, fontSize: size, color: C.ink, whiteSpace: 'pre', lineHeight: 1.1, boxShadow: `3px 4px 0 ${C.shadow}`}}>{shown}</div>
      {sub && <div style={{marginTop: 6, fontFamily: F.mono, fontSize: size * 0.42, color: C.inkMuted}}>{sub}</div>}
    </div>
  );
};

/** Horizontal gauge bar with a label (used for "likelihood", always marked illustrative). */
export const Gauge: React.FC<{label: string; value: number; t?: number; width?: number; tone?: string; active?: boolean}> = ({label, value, t = 1, width = 420, tone = C.blue, active}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: t}}>
    <div style={{width: 70, fontFamily: F.serif, fontSize: 36, color: C.ink, textAlign: 'right'}}>{label}</div>
    <div style={{position: 'relative', width, height: 30, borderRadius: 15, background: C.cream, border: `3px solid ${C.ink}`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value * 100 * t}%`, background: active ? C.saffron : tone, borderRight: `3px solid ${C.ink}`}} />
    </div>
    <div style={{width: 70, fontFamily: F.mono, fontSize: 24, color: C.inkMuted}}>{Math.round(value * 100)}%</div>
  </div>
);

/** A knob labelled with a value, 0..1 (randomness dial). */
export const Dial: React.FC<{value: number; label: string; scale?: number; style?: React.CSSProperties}> = ({value, label, scale = 1, style}) => {
  const ang = -135 + value * 270;
  return (
    <div style={{position: 'absolute', width: 160 * scale, textAlign: 'center', ...style}}>
      <svg viewBox="-80 -80 160 160" width={160 * scale} height={160 * scale}>
        <circle cx={0} cy={0} r={70} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        {Array.from({length: 11}).map((_, i) => {
          const a = ((-135 + i * 27) * Math.PI) / 180;
          return <line key={i} x1={Math.sin(a) * 58} y1={-Math.cos(a) * 58} x2={Math.sin(a) * 66} y2={-Math.cos(a) * 66} stroke={C.inkMuted} strokeWidth={3} />;
        })}
        <circle cx={0} cy={0} r={44} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} />
        <line x1={0} y1={0} x2={Math.sin((ang * Math.PI) / 180) * 40} y2={-Math.cos((ang * Math.PI) / 180) * 40} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
      </svg>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 26 * scale, color: C.inkSoft, marginTop: -6}}>{label}</div>
    </div>
  );
};

/** A row of book spines on a shelf, deterministic from a seed. Some spines show title words. */
export const BookRow: React.FC<{seed: number; width: number; height?: number; words?: string[]; highlight?: number; style?: React.CSSProperties; gap?: boolean; gapAt?: number}> = ({seed, width, height = 150, words = [], highlight = 0, style, gap, gapAt = 0.55}) => {
  const palette = [C.coral, C.teal, C.blue, C.saffron, C.woodDeep, C.tealDeep, C.blueDeep, C.coralDeep, '#8E6CB8', '#5B9A52'];
  const books: {x: number; w: number; h: number; col: number; word?: string}[] = [];
  let x = 0;
  let i = 0;
  let gapDone = false;
  while (x < width - 30) {
    let w = 26 + Math.floor(rand(seed * 31 + i) * 30);
    const h = height - 10 - Math.floor(rand(seed * 17 + i) * 42);
    const col = Math.floor(rand(seed * 7 + i) * palette.length);
    const word = words.length && rand(seed * 13 + i) < 0.5 ? words[i % words.length] : undefined;
    if (gap && !gapDone && x + w + 3 > width * gapAt) {
      // a missing book: the gap in the record runs exactly from gapAt to gapAt + 70
      w = Math.floor(width * gapAt - x - 3);
      if (w >= 22) books.push({x, w, h, col, word});
      x = Math.floor(width * gapAt) + 70;
      gapDone = true;
      i++;
      continue;
    }
    books.push({x, w, h, col, word});
    x += w + 3;
    i++;
  }
  return (
    <div style={{position: 'relative', width, height, ...style}}>
      {books.map((b, k) => {
        const left = b.x;
        const lit = b.word ? 1 : 0.55 + 0.45 * (1 - highlight);
        return (
          <div key={k} style={{position: 'absolute', left, bottom: 0, width: b.w, height: b.h, background: palette[b.col], border: `3px solid ${C.ink}`, borderRadius: 4, opacity: lit}}>
            {b.word && b.w >= 34 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: 10, bottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: F.serif, fontSize: 18, color: C.white, fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden'}}>{b.word}</div>
            )}
            {!b.word && <div style={{position: 'absolute', left: 6, right: 6, top: 14, height: 3, background: 'rgba(255,255,255,0.5)'}} />}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: -14, right: -14, bottom: -14, height: 14, background: C.wood, border: `3px solid ${C.ink}`, borderRadius: 3}} />
    </div>
  );
};

/** Birthday cake icon (the "no pattern" fact). */
export const Cake: React.FC<{scale?: number; style?: React.CSSProperties; flame?: number}> = ({scale = 1, style, flame = 1}) => (
  <svg viewBox="-60 -90 120 110" width={120 * scale} height={110 * scale} style={{position: 'absolute', left: -60 * scale, top: -90 * scale, ...style}}>
    <rect x={-50} y={-30} width={100} height={48} rx={8} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
    <path d="M -50 -30 Q -40 -16 -30 -30 Q -20 -16 -10 -30 Q 0 -16 10 -30 Q 20 -16 30 -30 Q 40 -16 50 -30" fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE - 1} />
    <rect x={-4} y={-66} width={8} height={36} fill={C.blue} stroke={C.ink} strokeWidth={3} />
    <path d="M 0 -84 Q 8 -72 0 -66 Q -8 -72 0 -84 Z" fill={C.saffron} stroke={C.ink} strokeWidth={2} opacity={flame} />
    <rect x={-56} y={16} width={112} height={10} rx={3} fill={C.woodLight} stroke={C.ink} strokeWidth={3} />
  </svg>
);

/** Desk bell. ding: 0..1 squash. */
export const Bell: React.FC<{scale?: number; ding?: number; style?: React.CSSProperties}> = ({scale = 1, ding = 0, style}) => (
  <svg viewBox="-40 -50 80 60" width={80 * scale} height={60 * scale} style={{position: 'absolute', left: -40 * scale, top: -50 * scale, ...style}}>
    <g transform={`scale(${1 + 0.08 * ding} ${1 - 0.12 * ding})`} style={{transformOrigin: '0px 0px'}}>
      <path d="M -34 0 Q -34 -34 0 -36 Q 34 -34 34 0 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={-7} y={-46} width={14} height={12} rx={4} fill={C.ink} />
    </g>
    <rect x={-40} y={0} width={80} height={8} rx={3} fill={C.ink} />
  </svg>
);

/** Deterministic confetti burst. t: 0..1 progress. */
export const Confetti: React.FC<{t: number; x: number; y: number; n?: number; seed?: number; spread?: number}> = ({t, x, y, n = 26, seed = 3, spread = 420}) => (
  <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none'}}>
    {Array.from({length: n}).map((_, i) => {
      const a = rand(seed + i * 3) * Math.PI - Math.PI;
      const v = 0.5 + rand(seed + i * 5) * 0.8;
      const px = Math.cos(a) * v * spread * t;
      const py = Math.sin(a) * v * spread * t * 0.7 + 600 * t * t;
      const col = [C.coral, C.teal, C.saffron, C.blue][i % 4];
      return <div key={i} style={{position: 'absolute', left: px, top: py, width: 14, height: 9, background: col, border: `2px solid ${C.ink}`, borderRadius: 2, transform: `rotate(${(rand(seed + i) * 360 + t * 720) % 360}deg)`, opacity: Math.max(0, 1 - t * 1.1)}} />;
    })}
  </div>
);

/** Strip of tape (for pinned evidence). */
export const Tape: React.FC<{rotate?: number; style?: React.CSSProperties; width?: number}> = ({rotate = -6, style, width = 110}) => (
  <div style={{position: 'absolute', width, height: 30, background: 'rgba(255,233,168,0.85)', border: `2px solid rgba(22,42,50,0.25)`, transform: `rotate(${rotate}deg)`, ...style}} />
);

/** A checklist card (the two verification questions). */
export const QuestionCard: React.FC<{n: number; text: string; state?: 'open' | 'yes' | 'no'; t?: number; width?: number; style?: React.CSSProperties}> = ({n, text, state = 'open', t = 1, width = 640, style}) => {
  const col = state === 'yes' ? C.teal : state === 'no' ? C.coral : C.ink;
  return (
    <div style={{width, display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px', background: C.cream, border: `${OUTLINE}px solid ${col}`, borderRadius: 16, boxShadow: `6px 8px 0 ${C.shadow}`, opacity: t, transform: `translateY(${(1 - t) * 20}px)`, ...style}}>
      <div style={{width: 54, height: 54, borderRadius: 27, background: col, color: C.white, fontFamily: F.display, fontWeight: 700, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{state === 'yes' ? '✓' : state === 'no' ? '✕' : n}</div>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink, lineHeight: 1.2}}>{text}</div>
    </div>
  );
};

/** A big hand with a stamper reaching in from the left edge of the frame. press: 0 up … 1 down. */
export const StampHand: React.FC<{x: number; y: number; press?: number; t?: number; skin?: string; sleeve?: string; color?: string}> = ({x, y, press = 0, t = 1, skin = '#F7D9C4', sleeve = C.coral, color = C.coral}) => {
  const hx = -260 + (x + 260) * t;
  const hy = y - 120 + press * 60;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <line x1={-200} y1={hy + 40} x2={hx} y2={hy} stroke={C.ink} strokeWidth={62} strokeLinecap="round" />
      <line x1={-200} y1={hy + 40} x2={hx - 160} y2={hy + 8} stroke={sleeve} strokeWidth={54} strokeLinecap="round" />
      <line x1={hx - 160} y1={hy + 8} x2={hx} y2={hy} stroke={skin} strokeWidth={54} strokeLinecap="round" />
      <line x1={hx - 168} y1={hy + 9} x2={hx - 140} y2={hy + 7} stroke={C.cream} strokeWidth={58} strokeLinecap="butt" />
      <line x1={hx - 168} y1={hy + 9} x2={hx - 140} y2={hy + 7} stroke={C.ink} strokeWidth={58} strokeLinecap="butt" opacity={0} />
      <g transform={`translate(${hx} ${hy})`}>
        <ellipse cx={0} cy={0} rx={38} ry={34} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-16} y={-6} width={32} height={70} rx={10} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-56} y={60} width={112} height={34} rx={8} fill={color} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-50} y={94} width={100} height={12} rx={3} fill={C.ink} />
      </g>
    </svg>
  );
};
