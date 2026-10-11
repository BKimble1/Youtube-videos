import React from 'react';
import {C, HED_FONT, CAP_FONT, useSw} from './kit';

/** Flat cutout card: ink outline + a hard offset shadow. */
export const Panel: React.FC<{x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string; sw?: number; shadow?: boolean; dash?: string; op?: number; sdx?: number; sdy?: number; children?: React.ReactNode}> = ({
  x, y, w, h, r = 26, fill = C.white, stroke = C.ink, sw = 6, shadow = true, dash, op = 1, sdx = 10, sdy = 14, children,
}) => {
  const s = useSw()(sw);
  return (
    <g opacity={op}>
      {shadow && <rect x={x + sdx} y={y + sdy} width={w} height={h} rx={r} fill={C.ink} opacity={0.2} />}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={s} strokeDasharray={dash} strokeLinejoin="round" />
      {children}
    </g>
  );
};

/** The AI cursor: an arrow with a small "AI" tag. (x, y) is the arrow tip. */
export const Cursor: React.FC<{x: number; y: number; s?: number; press?: number; rot?: number; op?: number}> = ({x, y, s = 1, press = 0, rot = 0, op = 1}) => {
  const k = s * (1 - 0.1 * press);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} opacity={op}>
      <path d="M 7 9 L 7 69 L 22 55 L 33 82 L 47 76 L 36 50 L 58 50 Z" fill={C.ink} opacity={0.22} />
      <path d="M 0 0 L 0 62 L 15 48 L 26 75 L 40 69 L 29 43 L 51 43 Z" fill={C.cream} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <g transform="translate(34 62)">
        <rect x={0} y={0} width={64} height={40} rx={13} fill={C.teal} stroke={C.ink} strokeWidth={5} />
        <text x={32} y={21} dy="0.36em" textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={25} fill={C.white}>AI</text>
      </g>
    </g>
  );
};

/** SUBMIT button. press 0..1 depresses the face; sent switches the label. Same geometry everywhere it appears. */
export const SubmitBtn: React.FC<{x: number; y: number; w: number; h: number; press?: number; sent?: boolean; op?: number; hot?: number}> = ({x, y, w, h, press = 0, sent = false, op = 1, hot = 0}) => {
  const lift = 12 * (1 - press);
  const fill = sent ? C.teal : C.coral;
  const base = sent ? C.tealDeep : C.coralDeep;
  return (
    <g opacity={op}>
      <rect x={x + 6} y={y + 18} width={w} height={h} rx={26} fill={C.ink} opacity={0.2} />
      <rect x={x} y={y + 12} width={w} height={h} rx={26} fill={base} stroke={C.ink} strokeWidth={6} />
      <g transform={`translate(0 ${12 - lift})`}>
        <rect x={x} y={y} width={w} height={h} rx={26} fill={fill} stroke={C.ink} strokeWidth={6} />
        {hot > 0 && <rect x={x - 6 * hot} y={y - 6 * hot} width={w + 12 * hot} height={h + 12 * hot} rx={30} fill="none" stroke={C.saffron} strokeWidth={6} opacity={hot} />}
        {sent ? (
          <g>
            <path d={`M ${x + w / 2 - 78} ${y + h / 2 + 2} l 20 22 l 34 -42`} fill="none" stroke={C.cream} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
            <text x={x + w / 2 + 38} y={y + h / 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={56} fill={C.cream} stroke={C.ink} strokeWidth={0.8} letterSpacing={1}>SENT</text>
          </g>
        ) : (
          <text x={x + w / 2} y={y + h / 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={62} fill={C.cream} stroke={C.ink} strokeWidth={0.8} letterSpacing={2}>SUBMIT</text>
        )}
      </g>
    </g>
  );
};

/** A generic shield badge (no real emblem). */
export const Shield: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -42 L 36 -28 L 36 6 Q 36 32 0 48 Q -36 32 -36 6 L -36 -28 Z" fill={C.saffron} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 0 -20 L 7 -4 L 24 -4 L 11 7 L 16 24 L 0 14 L -16 24 L -11 7 L -24 -4 L -7 -4 Z" fill={C.ink} />
  </g>
);

/** An envelope, 300 x 210 at s = 1, centred on (x, y). */
export const Envelope: React.FC<{x: number; y: number; s?: number; rot?: number; op?: number; flap?: number; tag?: string}> = ({x, y, s = 1, rot = 0, op = 1, flap = 0, tag}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <rect x={-142} y={-95} width={300} height={210} rx={20} fill={C.ink} opacity={0.2} />
    <rect x={-150} y={-105} width={300} height={210} rx={20} fill={C.cream} stroke={C.ink} strokeWidth={7} />
    <path d={`M -150 -96 L 0 ${14 - flap * 40} L 150 -96`} fill={C.saffronLight} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -146 98 L -34 -2 M 146 98 L 34 -2" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
    <circle cx={0} cy={14 - flap * 40} r={17} fill={C.coral} stroke={C.ink} strokeWidth={5} />
    {tag && (
      <g transform="translate(70 52) rotate(-8)">
        <rect x={-62} y={-24} width={124} height={48} rx={10} fill={C.coral} stroke={C.ink} strokeWidth={5} />
        <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={40} fill={C.cream} stroke={C.ink} strokeWidth={0.6} letterSpacing={1.5}>{tag}</text>
      </g>
    )}
  </g>
);

/** Browser-card chrome: three dots and a url pill across the top of a card of width w. */
export const Chrome: React.FC<{x: number; y: number; w: number; h?: number; r?: number}> = ({x, y, w, h = 70, r = 26}) => (
  <g>
    <path d={`M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`} fill={C.paperDeep} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {[C.coral, C.saffron, C.teal].map((c, i) => <circle key={i} cx={x + 38 + i * 34} cy={y + h / 2} r={11} fill={c} stroke={C.ink} strokeWidth={3} />)}
    <rect x={x + 150} y={y + h / 2 - 17} width={w - 190} height={34} rx={17} fill={C.cream} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** Large folder: back + tab behind, front panel in front. The `inside` node is drawn between them (an envelope slipping in). */
export const Folder: React.FC<{x: number; y: number; w: number; h: number; inside?: React.ReactNode; label?: string; labelPop?: number; shake?: number; latch?: number}> = ({x, y, w, h, inside, label, labelPop = 0, shake = 0, latch = 0}) => {
  const frontTop = y + h * 0.28;
  return (
    <g transform={`translate(${shake} 0)`}>
      <rect x={x + 12} y={y + 18} width={w} height={h} rx={26} fill={C.ink} opacity={0.2} />
      <path d={`M ${x} ${y + 40} Q ${x} ${y} ${x + 36} ${y} L ${x + w * 0.34} ${y} L ${x + w * 0.34 + 44} ${y + 40} Z`} fill={C.coralDeep} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={x} y={y + 36} width={w} height={h - 36} rx={26} fill={C.coralDeep} stroke={C.ink} strokeWidth={6} />
      {inside}
      <rect x={x} y={frontTop} width={w} height={y + h - frontTop} rx={26} fill={C.coral} stroke={C.ink} strokeWidth={6} />
      <rect x={x + 18} y={frontTop + 14} width={w - 36} height={12} rx={6} fill={C.white} opacity={0.3} />
      {label && (
        <g transform={`translate(${x + w / 2} ${frontTop + (y + h - frontTop) / 2 + 6}) scale(${1 + labelPop * 0.12})`}>
          <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={212} letterSpacing={4} fill={C.cream} stroke={C.ink} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">{label}</text>
        </g>
      )}
      {latch > 0 && (
        <g transform={`translate(${x + w - 64} ${frontTop + 6})`}>
          <rect x={-22} y={-8} width={44} height={34} rx={8} fill={C.saffron} stroke={C.ink} strokeWidth={5} transform={`rotate(${(1 - latch) * -24} 0 0)`} />
        </g>
      )}
    </g>
  );
};

/** A shallow tray with a label under it. */
export const Tray: React.FC<{x: number; y: number; w: number; h?: number; label: string; fill?: string; dash?: boolean; labelSize?: number; labelOp?: number; children?: React.ReactNode}> = ({x, y, w, h = 120, label, fill = C.blueLight, dash = false, labelSize = 50, labelOp = 1, children}) => (
  <g>
    <rect x={x + 8} y={y + 14} width={w} height={h} rx={22} fill={C.ink} opacity={0.2} />
    <rect x={x} y={y} width={w} height={h} rx={22} fill={fill} stroke={C.ink} strokeWidth={6} strokeDasharray={dash ? '18 14' : undefined} />
    <rect x={x + 20} y={y + 22} width={w - 40} height={h - 54} rx={12} fill={C.white} opacity={0.55} stroke={C.ink} strokeWidth={dash ? 4 : 0} strokeDasharray="10 10" />
    {children}
    <text x={x + w / 2} y={y + h + 44} textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={labelSize} letterSpacing={3} fill={C.ink} opacity={labelOp}>{label}</text>
  </g>
);

/** Chat bubble with a tail pointing to (tx, ty). */
export const Bubble: React.FC<{x: number; y: number; w: number; h: number; tx: number; ty: number; fill?: string; children?: React.ReactNode; op?: number}> = ({x, y, w, h, tx, ty, fill = C.white, children, op = 1}) => {
  const bx = Math.max(x + 60, Math.min(x + w - 60, tx));
  const by = ty > y + h / 2 ? y + h : y;
  const dir = ty > y + h / 2 ? 1 : -1;
  const tail = `M ${bx - 34} ${by} L ${tx} ${ty} L ${bx + 34} ${by} Z`;
  return (
    <g opacity={op}>
      <rect x={x + 10} y={y + 14} width={w} height={h} rx={40} fill={C.ink} opacity={0.2} />
      <path d={tail} fill={fill} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" transform={`translate(10 14)`} opacity={0.2} />
      <rect x={x} y={y} width={w} height={h} rx={40} fill={fill} stroke={C.ink} strokeWidth={6} />
      <path d={tail} fill={fill} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={bx - 28} y={by - dir * 4 - 4} width={56} height={10} fill={fill} />
      {children}
    </g>
  );
};
