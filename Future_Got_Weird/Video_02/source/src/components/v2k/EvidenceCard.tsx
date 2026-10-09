import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {textWidth, useFontsReady} from '../../lib/measure';
import {Chip} from './Labels';
import {clamp01, f2, fontShorthand} from './util';

/**
 * v2 kit · EvidenceCard: the house real-data board (S1.3 / S3.3 / S7 family): a white card with a 4 px ink outline,
 * a hard offset shadow and two tape strips, on a flat paper field. Slots:
 *
 *  - headline  "Real data" (Fredoka 600, 64 px), top-left of the card (baseline y 116)
 *  - icon      optional small icon right of the headline (e.g. the 3×3 zone box), centred on the headline's middle
 *  - tag       optional corner tag top-right (a Chip, 34 px), e.g. "sped up"
 *  - source    one source line, 34 px, bottom-left (baseline y 914)
 *  - children  the plot: full-frame screen-space layers, drawn inside EVIDENCE.content
 *
 * Each slot has its own 0..1 progress (fade only). Everything is screen space (1920×1080) and a pure function of the
 * props. V1.3 / V10 (RealTrackBoard), V4.2, V6 and V10.5 boards use this so they read as one family.
 */

export const EVIDENCE = {
  /** the card rectangle (its edges sit just outside the safe area; only the card edge, never content) */
  card: {x0: 80, y0: 30, x1: 1840, y1: 944},
  headline: {x: 150, baseline: 116, size: 64},
  /** the icon slot's centre when the headline is "Real data" (computed from the measured headline otherwise) */
  iconGap: 56,
  tag: {x: 1790, y: 92, size: 34},
  source: {x: 150, baseline: 914, size: 34},
  /** where the plot may draw (inside the card, below the headline row, above the source line) */
  content: {x0: 120, y0: 146, x1: 1800, y1: 870},
  shadow: {dx: 12, dy: 14},
} as const;

export type EvidenceCardProps = {
  children?: React.ReactNode;
  /** headline text (default "Real data") and its 0..1 progress (default 1) */
  headline?: string;
  headlineT?: number;
  /** optional small icon, drawn with its local origin at the icon slot centre (e.g. <ZoneBox x={0} y={0} size={96}/>) */
  icon?: React.ReactNode;
  iconT?: number;
  /** override the icon slot centre (screen px) */
  iconAt?: {x: number; y: number};
  /** one source line (34 px) and its 0..1 progress */
  source?: string;
  sourceT?: number;
  /** optional corner tag (34 px chip) and its 0..1 progress */
  tag?: string;
  tagT?: number;
  /** flat paper field behind the card, full frame (default true) */
  background?: boolean;
  /** draw the card itself (default true; false = slots only, over a card the scene draws) */
  card?: boolean;
  /** 0..1 whole-board opacity (default 1). Boards cut in; avoid whole-board fade-ins. */
  opacity?: number;
};

/** Centre of the icon slot for a headline text (right of the measured headline). */
export const evidenceIconSlot = (headline = 'Real data') => {
  const H = EVIDENCE.headline;
  const w = textWidth(headline, fontShorthand(F.display, 600, H.size));
  return {x: H.x + w + EVIDENCE.iconGap + 48, y: H.baseline - H.size * 0.36};
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({children, headline = 'Real data', headlineT = 1, icon, iconT = 1, iconAt, source, sourceT = 1, tag, tagT = 1, background = true, card = true, opacity = 1}) => {
  useFontsReady();
  const R = EVIDENCE.card;
  const w = R.x1 - R.x0;
  const h = R.y1 - R.y0;
  const slot = iconAt ?? evidenceIconSlot(headline);
  const H = EVIDENCE.headline;
  const S = EVIDENCE.source;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: clamp01(opacity), background: background ? C.paper : undefined}}>
      {card && (
        <div style={{position: 'absolute', left: R.x0, top: R.y0, width: w, height: h}}>
          <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, boxShadow: `${EVIDENCE.shadow.dx}px ${EVIDENCE.shadow.dy}px 0 ${C.shadow}`}} />
        </div>
      )}
      {children}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {headlineT > 0 && (
          <text x={H.x} y={H.baseline} fontFamily={F.display} fontWeight={600} fontSize={H.size} fill={C.ink} opacity={f2(clamp01(headlineT))}>
            {headline}
          </text>
        )}
        {source && sourceT > 0 && (
          <text x={S.x} y={S.baseline} fontFamily={F.body} fontWeight={800} fontSize={S.size} fill={C.inkSoft} opacity={f2(clamp01(sourceT))}>
            {source}
          </text>
        )}
      </svg>
      {icon && iconT > 0 && <div style={{position: 'absolute', left: f2(slot.x), top: f2(slot.y), width: 0, height: 0, opacity: clamp01(iconT)}}>{icon}</div>}
      {tag && <Chip x={EVIDENCE.tag.x} y={EVIDENCE.tag.y} anchor="end" valign="middle" size={EVIDENCE.tag.size} opacity={tagT}>{tag}</Chip>}
      {card && (
        <>
          <Tape x={R.x0 - 34} y={R.y0 - 10} rot={-9} />
          <Tape x={R.x1 - 96} y={R.y0 - 10} rot={8} />
        </>
      )}
    </div>
  );
};

/** A strip of tape (saffron-light, flat), top-left corner at (x, y). */
const Tape: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 130, height: 34, background: 'rgba(255,233,168,0.92)', border: '2px solid rgba(22,42,50,0.25)', transform: `rotate(${rot}deg)`}} />
);
