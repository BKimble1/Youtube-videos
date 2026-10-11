import React from 'react';
import {C, E, tw, lerp, clamp01, sp, SNAP, HED_FONT, CAP_FONT, ring, fitSize} from './kit';
import {EV} from './cues';
import {Panel} from './shapes';

export const B5CARD = {x: 110, y: 400, w: 740, h: 740};
export const B6SCREEN = {x: 130, y: 300, w: 700, h: 470};
export const rectLerp = (a: typeof B5CARD, b: typeof B6SCREEN, t: number) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});

/** report card: Anthropic attribution once, plus one simple date comparison. The panel is handed to the closing scene at b6.start. */
export const Report: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b5.start'], t1 = EV['b6.start'];
  if (g < t0 || g >= t1 + 10) return null;
  const pop = sp(g, t0 + 6, SNAP, 18);
  const fade = 1 - E.in(tw(g, t1, 8, (x) => x));
  const d1 = sp(g, EV['b5.date1'], SNAP, 14);
  const line = E.inOut(tw(g, EV['b5.line'], 26, (x) => x));
  const d2 = sp(g, EV['b5.date2'], SNAP, 14);
  const pulse = ring(g, EV['b5.date2'], 0.7, 0.2);
  const R = B5CARD;
  const X1 = 262, X2 = 640, YL = R.y + 470;
  const m = E.inOut(tw(g, t1, 16, (x) => x));
  const MR = rectLerp(B5CARD, B6SCREEN, m);
  const titleSize = fitSize('ANTHROPIC REPORT', HED_FONT, 620, 110, 800, 3);
  return (
    <g transform={`translate(${MR.x} ${MR.y}) scale(${MR.w / R.w} ${MR.h / R.h}) translate(${-R.x} ${-R.y}) translate(${R.x + R.w / 2} ${R.y + R.h / 2}) scale(${0.55 + 0.45 * pop}) translate(${-(R.x + R.w / 2)} ${-(R.y + R.h / 2)})`} opacity={clamp01(pop * 3)}>
      {g < t1 && <Panel x={R.x} y={R.y} w={R.w} h={R.h} r={34} sdx={14} sdy={18} />}
      <g opacity={fade}>
        <path d={`M ${R.x} ${R.y + 150} L ${R.x} ${R.y + 34} Q ${R.x} ${R.y} ${R.x + 34} ${R.y} L ${R.x + R.w - 34} ${R.y} Q ${R.x + R.w} ${R.y} ${R.x + R.w} ${R.y + 34} L ${R.x + R.w} ${R.y + 150} Z`} fill={C.ink} />
        <text x={R.x + R.w / 2} y={R.y + 72} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={titleSize} letterSpacing={3} fill={C.cream}>ANTHROPIC REPORT</text>
        <text x={R.x + R.w / 2} y={R.y + 212} textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={36} fill={C.inkSoft}>Investigating unintended</text>
        <text x={R.x + R.w / 2} y={R.y + 258} textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={36} fill={C.inkSoft}>model actions</text>
        <path d={`M ${X1} ${YL} L ${X2} ${YL}`} stroke={C.paperLine} strokeWidth={10} strokeLinecap="round" strokeDasharray="4 22" fill="none" opacity={1 - line} />
        <path d={`M ${X1} ${YL} L ${lerp(X1, X2, line)} ${YL}`} stroke={C.ink} strokeWidth={10} strokeLinecap="round" fill="none" />
        <g transform={`translate(${X1} ${YL}) scale(${0.5 + 0.5 * d1})`} opacity={clamp01(d1 * 3)}>
          <circle r={34} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
          <text x={0} y={-96} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={88} letterSpacing={2} fill={C.ink}>JULY 18</text>
          <text x={0} y={96} dy="0.36em" textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={32} fill={C.inkSoft}>TIP SENT</text>
        </g>
        <g transform={`translate(${X2} ${YL}) scale(${(0.5 + 0.5 * d2) * (1 + 0.08 * pulse)})`} opacity={clamp01(d2 * 3)}>
          <circle r={34} fill={C.coral} stroke={C.ink} strokeWidth={7} />
          <text x={0} y={-96} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={88} letterSpacing={2} fill={C.ink}>OCT 9</text>
          <text x={0} y={96} dy="0.36em" textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={32} fill={C.inkSoft}>REPORT OUT · 2026</text>
        </g>
        <text x={R.x + R.w / 2} y={R.y + R.h - 50} textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} fill={C.inkMuted}>Tip date per police statement</text>
      </g>
    </g>
  );
};
