import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F, H, OUTLINE, W} from '../../theme';
import {Layer} from '../../lib/camera';
import {rand} from '../../lib/anim';
import {Sign} from '../Text';
import {StampMark} from '../Props';

/**
 * S10 set pieces. The answer counter is the cold-open set (components/Sets CounterSet), split up so the payoff can
 * stage it: the wall colour and dots stay on the far plane (depth 0.75) while the arches, the sign, the clerks and the
 * counter all share the subject plane (depth 1), so no camera move ever slides a clerk out of his window. The set can
 * be struck (sunk / hoisted) piece by piece for the end card.
 */

/* ------------------------------------------------------------------ the wall (far plane) */
const DOTS = Array.from({length: 70}).map((_, i) => ({x: rand(i * 3 + 11) * (W + 400), y: rand(i * 5 + 7) * (H + 400), r: 3 + rand(i * 9 + 1) * 6}));

/** Saffron wall with the cutout dot texture (same seeds as Sets.Wall). `shift` drifts the dots very slowly. */
export const S10Wall: React.FC<{shift?: number}> = ({shift = 0}) => (
  <Layer depth={0.75}>
    <AbsoluteFill style={{background: C.saffron, left: -200, top: -200, width: W + 400, height: H + 400, boxShadow: `0 0 0 400px ${C.saffron}`}}>
      <svg width={W + 400} height={H + 400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(${shift} ${shift * 0.35})`}>
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={C.saffronDeep} opacity={0.35} />
          ))}
          {/* a second band of dots so a long drift never runs out of texture */}
          {DOTS.map((d, i) => (
            <circle key={`b${i}`} cx={d.x - (W + 400)} cy={d.y} r={d.r} fill={C.saffronDeep} opacity={0.35} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  </Layer>
);

/* ------------------------------------------------------------------ subject-plane pieces (world px) */
export const WIN_X = [480, 960, 1440];

/** The three arched service windows (world px, subject plane). As in the cold open's CounterSet, the openings run
 *  down behind the counter, so the clerks stand inside them (no strip of wall below a sill). */
export const Arches: React.FC = () => (
  <>
    {WIN_X.map((cx) => (
      <div key={cx} style={{position: 'absolute', left: cx - 210, top: 150, width: 420, height: 900, background: C.paper, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '210px 210px 18px 18px'}}>
        <div style={{position: 'absolute', left: 14, right: 14, top: 14, bottom: 14, border: `3px solid ${C.paperLine}`, borderRadius: '196px 196px 10px 10px'}} />
      </div>
    ))}
  </>
);

/** The hanging ANSWERS sign; the strings run far above the frame so it can be hoisted out. */
export const HangingSign: React.FC<{rot?: number; dy?: number}> = ({rot = 0, dy = 0}) => (
  <div style={{position: 'absolute', left: 960 - 230, top: 70 + dy, transform: `rotate(${rot}deg)`, transformOrigin: '230px -70px'}}>
    <div style={{position: 'absolute', left: 60, top: -1070, width: 4, height: 1070, background: C.ink}} />
    <div style={{position: 'absolute', left: 396, top: -1070, width: 4, height: 1070, background: C.ink}} />
    <Sign bg={C.cream} size={48} width={460} style={{boxSizing: 'border-box'}}>
      ANSWERS
    </Sign>
  </div>
);

export const COUNTER_TOP = 690;
/** The counter: top board and the panelled front (subject plane). `nudge` = a 1–3 px shudder on impacts. */
export const Counter: React.FC<{nudge?: number}> = ({nudge = 0}) => (
  <div style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${nudge}px)`}}>
    <div style={{position: 'absolute', left: -700, width: 3400, top: COUNTER_TOP, height: 36, background: C.woodLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6}} />
    <div style={{position: 'absolute', left: -700, width: 3400, top: COUNTER_TOP + 32, height: 520, background: C.wood, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
      {Array.from({length: 11}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 120 + i * 300, top: 40, width: 230, height: 150, border: `${OUTLINE}px solid ${C.woodDeep}`, borderRadius: 10, opacity: 0.8}} />
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ the conclusion boards */
/** A big cream board (the s33 placards and the s34 habit cards share its look). */
export const Board: React.FC<{w: number; h: number; children?: React.ReactNode; edge?: string; radius?: number; style?: React.CSSProperties}> = ({w, h, children, edge = C.ink, radius = 24, style}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, ...style}}>
    <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE + 1}px solid ${edge}`, borderRadius: radius, boxShadow: `10px 12px 0 ${C.shadow}`}} />
    <div style={{position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, border: `2px solid ${C.paperLine}`, borderRadius: radius - 8}} />
    {children}
  </div>
);

/** The real thesis title block (Kalai 2001) as a small pinned document. */
export const THUMB_W = 330;
export const THUMB_IMG_H = Math.round(((THUMB_W - 24) * 1386) / 3264);
export const THUMB_H = THUMB_IMG_H + 24;
export const EvidenceThumb: React.FC<{glow?: number}> = ({glow = 0}) => (
  <div style={{position: 'relative', width: THUMB_W, height: THUMB_H}}>
    <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6, boxShadow: `6px 7px 0 ${C.shadow}${glow > 0 ? `, 0 0 ${22 * glow}px ${8 * glow}px rgba(28,167,160,${0.55 * glow})` : ''}`}} />
    <Img src={staticFile('img/thesis_title_block.png')} style={{position: 'absolute', left: 12, top: 12, width: THUMB_W - 24, height: THUMB_IMG_H}} />
    <div style={{position: 'absolute', left: -18, top: -12, width: 74, height: 24, background: 'rgba(255,233,168,0.88)', border: `2px solid ${C.saffronDeep}`, transform: 'rotate(-9deg)'}} />
  </div>
);

/* ------------------------------------------------------------------ the person's slip (a parody of the answer slips) */
export const PSLIP_W = 400;
export const PSLIP_H = 300;
/** Where the SOURCE? stamp prints (local px): the lower-right corner, below and right of the quote's last line. */
export const PSLIP_STAMP_AT = {x: 298, y: 248};
export const PersonSlipArt: React.FC<{stamp?: {scale: number; sx: number; sy: number}; glint?: number}> = ({stamp, glint = 0}) => (
  <div style={{position: 'relative', width: PSLIP_W, height: PSLIP_H}}>
    <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10, boxShadow: `7px 9px 0 ${C.shadow}`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 7, right: 7, top: 7, bottom: 7, border: `2px solid ${C.saffronDeep}`, borderRadius: 6, opacity: 0.75}} />
      {glint > 0 && glint < 1 && (
        <div style={{position: 'absolute', left: -120 + glint * (PSLIP_W + 200), top: -40, width: 46, height: PSLIP_H + 80, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,240,190,0.95), rgba(255,255,255,0))', transform: 'rotate(18deg)'}} />
      )}
      <div style={{position: 'absolute', left: 24, top: 18, fontFamily: F.display, fontWeight: 600, fontSize: 33, color: C.ink, lineHeight: 1}}>A person</div>
      <div style={{position: 'absolute', left: 24, top: 58, fontFamily: F.body, fontWeight: 800, fontSize: 23, color: C.inkMuted, lineHeight: 1}}>any given Tuesday</div>
      <div style={{position: 'absolute', left: 24, top: 96, width: 214, fontFamily: F.serif, fontSize: 35, lineHeight: 1.18, color: C.ink}}>
        “Trust me, I&nbsp;read it somewhere.”
      </div>
    </div>
    {stamp && (
      <div style={{position: 'absolute', left: PSLIP_STAMP_AT.x, top: PSLIP_STAMP_AT.y, transform: `translate(-50%, -50%) scale(${stamp.scale * stamp.sx}, ${stamp.scale * stamp.sy})`}}>
        <StampMark text="Source?" tone="coral" t={1} size={29} rotate={-8} />
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ the checker's pencil */
export const Pencil: React.FC = () => (
  <g transform="rotate(-30)">
    <rect x={-6} y={-60} width={12} height={62} rx={3} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
    <path d="M -6 2 L 6 2 L 0 16 Z" fill={C.woodLight} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={-6} y={-70} width={12} height={12} rx={3} fill={C.coralLight} stroke={C.ink} strokeWidth={3} />
  </g>
);

/* ------------------------------------------------------------------ the wordmark (original), end-card version */
/**
 * FUTURE GOT WEIRD, word by word. Each word keeps its final width in the layout (scale only), and the gap is wide
 * enough that no overshoot closes it. The swash bar is saffronDeep so it reads on the saffron card.
 */
export const S10Wordmark: React.FC<{size: number; pops: [number, number, number]; gotTilt?: number; swash?: number; bob?: [number, number, number]}> = ({size, pops, gotTilt = 0, swash = 0, bob = [0, 0, 0]}) => (
  <div style={{display: 'inline-block', position: 'relative'}}>
    <div style={{position: 'absolute', left: -size * 0.12, right: -size * 0.12, bottom: -size * 0.1, height: size * 0.2, background: C.saffronDeep, borderRadius: size * 0.1, transform: 'rotate(-1deg)', clipPath: `inset(0 ${(1 - swash) * 100}% 0 0 round ${size * 0.1}px)`}} />
    <div style={{position: 'relative', fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
      {(['FUTURE', 'GOT', 'WEIRD'] as const).map((w, i) => (
        <span
          key={w}
          style={{
            display: 'inline-block',
            transform: `translateY(${bob[i]}px) scale(${Math.max(0.001, pops[i])}) rotate(${i === 1 ? gotTilt : 0}deg)`,
            transformOrigin: '50% 85%',
            color: i === 1 ? C.coral : C.ink,
            marginRight: i < 2 ? size * 0.36 : 0,
            opacity: pops[i] <= 0.001 ? 0 : 1,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  </div>
);
