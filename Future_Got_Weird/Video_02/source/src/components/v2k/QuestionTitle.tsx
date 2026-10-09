import React from 'react';
import {interpolate} from 'remotion';
import {C, F} from '../../theme';
import {textWidth, useFontsReady} from '../../lib/measure';
import {f2, fontShorthand, warnOnce} from './util';

/**
 * v2 kit · QuestionTitle: the spoken question line, top-left, one line, Fredoka 600 64 px ink, plain text (no box)
 * with a thin white stroke halo so it reads over any background.
 *
 *  - Position: left edge x 96 (safe area), baseline y 118 (= 54 + 64), so the cap top sits at about y 71.
 *  - Timing (global frames; pass useG()): fades in over 6 frames from `from`, fades out over the 8 frames ending at
 *    `to`; renders nothing before `from` or from `to` on.
 *  - Width: measured with lib/measure textWidth; if the line would pass x 1824 it is set smaller to fit (and warns in
 *    dev: shorten the question instead).
 *
 * Pure function of its props (the font-ready hook only re-renders once when the fonts arrive).
 */

export const QT = {x: 96, baseline: 118, size: 64, maxRight: 1824, fadeIn: 6, fadeOut: 8} as const;

export type QuestionTitleProps = {
  text: string;
  /** global frame the title starts fading in */
  from: number;
  /** global frame the title is gone (its fade-out ends here) */
  to: number;
  /** the current global frame (useG()) */
  frame: number;
  /** optional colour override (default ink) */
  color?: string;
};

/** The font size QuestionTitle will actually use for `text` (64, or smaller to fit inside x 96–1824). */
export const questionTitleSize = (text: string) => {
  const w = textWidth(text, fontShorthand(F.display, 600, QT.size));
  const room = QT.maxRight - QT.x - 6; // 6 px for the halo
  return w > room ? Math.floor((QT.size * room) / w) : QT.size;
};

export const QuestionTitle: React.FC<QuestionTitleProps> = ({text, from, to, frame, color = C.ink}) => {
  useFontsReady();
  if (frame < from || frame >= to) return null;
  const fin = interpolate(frame, [from, from + QT.fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fout = interpolate(frame, [to - QT.fadeOut, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = Math.min(fin, fout);
  const size = questionTitleSize(text);
  if (size < QT.size) warnOnce(`QuestionTitle "${text}" is too long for one 64 px line; set at ${size} px to fit. Shorten it.`);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <text
        x={QT.x}
        y={QT.baseline}
        fontFamily={F.display}
        fontWeight={600}
        fontSize={size}
        fill={color}
        stroke={C.white}
        strokeWidth={8}
        strokeLinejoin="round"
        paintOrder="stroke"
        opacity={f2(op)}
      >
        {text}
      </text>
    </svg>
  );
};
