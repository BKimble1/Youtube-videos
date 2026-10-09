import React from 'react';
import {C, F} from '../../theme';
import {textWidth, useFontsReady} from '../../lib/measure';
import {clamp01, f2, fontShorthand, warnOnce} from './util';

/**
 * v2 kit · labels (screen space, 1920×1080). Pure functions of their props; no frame hooks.
 *
 *  Label      – the base text label: SVG text with a white stroke halo (legible over any background), optional leader
 *               line to a point. Used by TeachLabel and SubLabel.
 *  TeachLabel – key teaching label: 64 px Nunito 800 ink with halo (warns in dev when set below 60 px).
 *  SubLabel   – secondary label: 48 px.
 *  Chip       – small rounded tag: "illustration", "simplified picture", "illustrative", "our analogy", "sped up".
 *               30–34 px Nunito 800, ink on cream, 3 px ink outline. With `maxWidth` it wraps into a rounded box.
 *
 * Coordinates: (x, y) is the text anchor point. `anchor` sets the horizontal side ('start' = x is the left edge,
 * 'middle', 'end' = x is the right edge); `valign` sets what y means ('baseline' default, 'middle' = optical centre of
 * the x-height/cap band, 'top' = cap top). Labels only fade (opacity): they never spring or move by themselves.
 *
 * Each label renders its own full-frame overlay <svg> (position absolute, top-left of the parent) unless `asGroup`,
 * which returns a bare <g> for a parent <svg> in the same screen space.
 */

export type Anchor = 'start' | 'middle' | 'end';
export type VAlign = 'baseline' | 'middle' | 'top';
export type Pt = {x: number; y: number};

export type LeaderSpec = {
  /** the point the leader points at (screen px) */
  x: number;
  y: number;
  /** px left clear before the target (default 8) */
  gap?: number;
  /** a small ink dot at the target end (default false) */
  dot?: boolean;
  /** stroke colour (default ink) */
  color?: string;
  /** 0..1 draw-on from the label toward the target (default 1) */
  t?: number;
};

export type LabelProps = {
  /** the text (one line) */
  children: string;
  x: number;
  y: number;
  /** font size px (Label default 48) */
  size?: number;
  anchor?: Anchor;
  valign?: VAlign;
  /** 0..1 (labels fade or cut in; they never spring) */
  opacity?: number;
  color?: string;
  /** 'body' = Nunito (default), 'display' = Fredoka */
  font?: 'body' | 'display';
  /** default 800 for Nunito, 600 for Fredoka */
  weight?: number;
  /** white stroke halo for legibility (default true); a colour string sets the halo colour */
  halo?: boolean | string;
  /** halo stroke width px (default max(6, 0.14 × size); half of it shows outside the glyphs) */
  haloWidth?: number;
  /** optional leader line from the label's box to a point */
  leader?: LeaderSpec;
  /** a flat highlight swash behind the text, 0..1 (used for "brighten once" pulses) */
  highlight?: number;
  highlightColor?: string;
  asGroup?: boolean;
};

/** Font family string for a label font key. */
const famOf = (font: 'body' | 'display') => (font === 'display' ? F.display : F.body);

/** Text box of a one-line label (screen px), from the measured advance width. */
export const labelBox = (text: string, x: number, y: number, size: number, anchor: Anchor = 'start', valign: VAlign = 'baseline', font: 'body' | 'display' = 'body', weight?: number) => {
  const w = textWidth(text, fontShorthand(famOf(font), weight ?? (font === 'display' ? 600 : 800), size));
  const base = valign === 'baseline' ? y : valign === 'middle' ? y + size * 0.36 : y + size * 0.74;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return {x0, x1: x0 + w, y0: base - size * 0.74, y1: base + size * 0.2, base, w};
};

/** Start (on the label box, padded) and end (at the target, minus gap) of a leader line. */
export const leaderEnds = (box: {x0: number; x1: number; y0: number; y1: number}, target: Pt, pad = 12, gap = 8) => {
  const bx0 = box.x0 - pad;
  const bx1 = box.x1 + pad;
  const by0 = box.y0 - pad;
  const by1 = box.y1 + pad;
  const s = {x: Math.max(bx0, Math.min(bx1, target.x)), y: Math.max(by0, Math.min(by1, target.y))};
  const dx = target.x - s.x;
  const dy = target.y - s.y;
  const L = Math.hypot(dx, dy);
  if (L < gap + 4) return null;
  const e = {x: target.x - (dx / L) * gap, y: target.y - (dy / L) * gap};
  return {s, e};
};

export const Label: React.FC<LabelProps> = ({children, x, y, size = 48, anchor = 'start', valign = 'baseline', opacity = 1, color = C.ink, font = 'body', weight, halo = true, haloWidth, leader, highlight = 0, highlightColor = C.saffronLight, asGroup}) => {
  useFontsReady(); // re-render once the fonts are in, so leader and highlight geometry use real glyph widths
  const op = clamp01(opacity);
  const wt = weight ?? (font === 'display' ? 600 : 800);
  const box = labelBox(children, x, y, size, anchor, valign, font, wt);
  const haloCol = halo === false ? undefined : typeof halo === 'string' ? halo : C.white;
  const hw = haloWidth ?? Math.max(6, size * 0.14);
  const hl = clamp01(highlight);
  let lead: React.ReactNode = null;
  if (leader && (leader.t ?? 1) > 0) {
    const ends = leaderEnds(box, leader, 12, leader.gap ?? 8);
    if (ends) {
      const t = clamp01(leader.t ?? 1);
      const ex = ends.s.x + (ends.e.x - ends.s.x) * t;
      const ey = ends.s.y + (ends.e.y - ends.s.y) * t;
      const col = leader.color ?? C.ink;
      const d = `M ${f2(ends.s.x)} ${f2(ends.s.y)} L ${f2(ex)} ${f2(ey)}`;
      lead = (
        <g>
          {haloCol && <path d={d} stroke={haloCol} strokeWidth={10} strokeLinecap="round" fill="none" />}
          <path d={d} stroke={col} strokeWidth={4} strokeLinecap="round" fill="none" />
          {leader.dot && t >= 1 && <circle cx={f2(leader.x)} cy={f2(leader.y)} r={7} fill={col} stroke={haloCol ?? 'none'} strokeWidth={3} />}
        </g>
      );
    }
  }
  const g = (
    <g opacity={op}>
      {hl > 0 && <rect x={f2(box.x0 - 16)} y={f2(box.y0 - 12)} width={f2(box.w + 32)} height={f2(box.y1 - box.y0 + 22)} rx={16} fill={highlightColor} opacity={f2(hl)} />}
      {lead}
      <text
        x={f2(x)}
        y={f2(box.base)}
        textAnchor={anchor}
        fontFamily={famOf(font)}
        fontWeight={wt}
        fontSize={size}
        fill={color}
        stroke={haloCol}
        strokeWidth={haloCol ? hw : undefined}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {children}
      </text>
    </g>
  );
  if (op <= 0) return null;
  return asGroup ? g : <Overlay>{g}</Overlay>;
};

/** Key teaching label: 64 px by default (60–72 allowed). Warns in dev when set below 60 px. */
export const TeachLabel: React.FC<LabelProps> = (props) => {
  const size = props.size ?? 64;
  if (size < 60) warnOnce(`TeachLabel "${props.children}" is ${size} px: key teaching labels are 64 px (60–72). Use SubLabel for secondary text.`);
  return <Label {...props} size={size} />;
};

/** Secondary label: 48 px by default (40–48). */
export const SubLabel: React.FC<LabelProps> = (props) => <Label {...props} size={props.size ?? 48} />;

/** Full-frame overlay svg (screen space). */
export const Overlay: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
    {children}
  </svg>
);

/* ------------------------------------------------------------------ ChipG (SVG chip) */

/**
 * The same one-line chip drawn as SVG (a <g> for a parent <svg>): use it inside scaled SVG drawings (it scales with
 * them, e.g. the ArrivalTimeline shrinking into a display). (x, y) as for Chip with valign 'middle'.
 */
export const ChipG: React.FC<{text: string; x: number; y: number; anchor?: Anchor; size?: number; opacity?: number; tone?: 'cream' | 'saffron'}> = ({text, x, y, anchor = 'start', size = 32, opacity = 1, tone = 'cream'}) => {
  useFontsReady();
  if (size < 30 || size > 34) warnOnce(`Chip "${text}" is ${size} px: chips and tags are 30–34 px.`);
  const op = clamp01(opacity);
  if (op <= 0) return null;
  const tw = textWidth(text, fontShorthand(F.body, 800, size));
  const padX = size * 0.7;
  const h = size * 1.6;
  const w = tw + padX * 2;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={f2(op)}>
      <rect x={f2(x0)} y={f2(y - h / 2)} width={f2(w)} height={f2(h)} rx={f2(h / 2)} fill={tone === 'saffron' ? C.saffronLight : C.cream} stroke={C.ink} strokeWidth={3} />
      <text x={f2(x0 + w / 2)} y={f2(y + size * 0.36)} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ Chip */

export type ChipProps = {
  children: React.ReactNode;
  x: number;
  y: number;
  /** horizontal anchor of (x, y) (default 'start') */
  anchor?: Anchor;
  /** vertical anchor: 'top' (default) or 'middle' or 'bottom' */
  valign?: 'top' | 'middle' | 'bottom';
  /** 30–34 px (default 32) */
  size?: number;
  opacity?: number;
  /** wrap into a rounded box at this width (px); default: one line, pill */
  maxWidth?: number;
  /** 'cream' (default: ink on cream) or 'saffron' (ink on saffron-light) */
  tone?: 'cream' | 'saffron';
  style?: React.CSSProperties;
};

/** Small rounded tag (HTML, absolutely positioned in screen px). */
export const Chip: React.FC<ChipProps> = ({children, x, y, anchor = 'start', valign = 'top', size = 32, opacity = 1, maxWidth, tone = 'cream', style}) => {
  if (size < 30 || size > 34) warnOnce(`Chip "${String(children)}" is ${size} px: chips and tags are 30–34 px.`);
  const op = clamp01(opacity);
  if (op <= 0) return null;
  const tx = anchor === 'start' ? '0' : anchor === 'middle' ? '-50%' : '-100%';
  const ty = valign === 'top' ? '0' : valign === 'middle' ? '-50%' : '-100%';
  const wrap = maxWidth !== undefined;
  return (
    <div
      style={{
        position: 'absolute',
        left: f2(x),
        top: f2(y),
        transform: `translate(${tx}, ${ty})`,
        opacity: op,
        display: 'inline-block',
        boxSizing: 'border-box',
        maxWidth: wrap ? maxWidth : undefined,
        width: wrap ? 'max-content' : undefined,
        padding: wrap ? `${f2(size * 0.42)}px ${f2(size * 0.66)}px` : `${f2(size * 0.3)}px ${f2(size * 0.7)}px`,
        borderRadius: wrap ? Math.round(size * 0.66) : 999,
        background: tone === 'saffron' ? C.saffronLight : C.cream,
        color: C.ink,
        border: `3px solid ${C.ink}`,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: size,
        lineHeight: wrap ? 1.22 : 1,
        letterSpacing: '0.01em',
        whiteSpace: wrap ? 'normal' : 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
