import React from 'react';
import {C, F, E, tw} from '../film/common';
import {CAPTIONS_V2} from '../cues_v2';

/** Concise attribution: always "Source: Boston Dynamics" (40 px); an optional tag pill names what kind of picture this is. */
/** Width estimate for the 40 px extra-bold UI face (per-class advance, em). */
const textW = (s: string, size = 40, ls = 0) => s.split('').reduce((a, ch) => a + (ch === ' ' ? 0.3 : /[A-Z0-9]/.test(ch) ? 0.74 : /[a-z]/.test(ch) ? 0.6 : 0.4) * size + ls, 0);

export const Attrib: React.FC<{lead?: string; tag?: string; tagK?: number}> = ({lead = 'Source: Boston Dynamics', tag, tagK = 1}) => {
  const w1 = textW(lead) + 48;
  const w2 = tag ? textW(tag, 40, 0.5) + 48 : 0;
  return (
    <g>
      {tag && (
        <g transform={`translate(120 1190)`} opacity={tagK}>
          <rect x={4} y={5} width={w2} height={58} rx={16} fill={C.ink} opacity={0.3} />
          <rect x={0} y={0} width={w2} height={58} rx={16} fill={C.coral} stroke={C.ink} strokeWidth={4} />
          <text x={22} y={30} dy="0.36em" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink} letterSpacing={0.5}>{tag}</text>
        </g>
      )}
      <g transform="translate(120 1262)">
        <rect x={4} y={5} width={w1} height={58} rx={16} fill={C.ink} opacity={0.3} />
        <rect x={0} y={0} width={w1} height={58} rx={16} fill={C.cream} stroke={C.ink} strokeWidth={4} />
        <text x={22} y={30} dy="0.36em" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>{lead}</text>
      </g>
    </g>
  );
};

/** Stable caption lane: <= 2 lines, 66 px, one emphasised word in saffron. Lane never moves. */
export const CaptionsV2: React.FC<{g: number}> = ({g}) => {
  const c = CAPTIONS_V2.find((k) => g >= k.from && g < k.to);
  if (!c) return null;
  const a = Math.min(1, (g - c.from + 1) / 3) * Math.min(1, (c.to - g) / 3);
  const words = c.lines.map((l) => l.split(' '));
  let n = 0;
  const lineEm = words.map((ws) => ws.map(() => n++));
  const widest = Math.max(...c.lines.map((l) => l.length));
  const w = Math.min(780, widest * 35 + 72);
  const lh = 74;
  const h = c.lines.length * lh + 30;
  const CY = 1405;
  return (
    <g transform={`translate(495 ${CY})`} opacity={a}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={C.ink} opacity={0.95} />
      {words.map((ws, li) => {
        const y = (li - (c.lines.length - 1) / 2) * lh;
        return (
          <text key={li} x={0} y={y} dy="0.36em" textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={66} fill={C.cream}>
            {ws.map((word, wi) => (
              <tspan key={wi} fill={lineEm[li][wi] === c.em ? C.saffron : C.cream}>
                {word}
                {wi < ws.length - 1 ? ' ' : ''}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
};
void E; void tw;
