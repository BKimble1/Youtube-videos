// V3 text policy. Every on-screen label in the V2 shots goes through this Tag. Only three kinds of text survive:
// source identification (top left), illustration / possible-use disclosures (bottom left, small) and one key number.
// Everything else (captions that repeat the narration, part names, arrows with words) renders nothing: the action on
// screen carries it. Survivors are plain text with a soft shadow, never in a pill, bubble or box.
import React from 'react';

type Kind = 'source' | 'disclose' | 'fact';
const ALLOW: Record<string, [Kind, string]> = {
  'Columbia University': ['source', 'Columbia University · Creative Machines Lab'],
  'Lip-sync study · Science Robotics · January 2026': ['source', 'Lip-sync study · Science Robotics · Jan 2026'],
  'Earlier study · Science Robotics · 2024': ['source', 'Earlier study · Science Robotics · 2024'],
  Illustration: ['disclose', 'Illustration'],
  'Illustration, not lab footage': ['disclose', 'Illustration, not lab footage'],
  'Possible future · illustration': ['disclose', 'Possible future · illustration'],
  'Possible use: a tutor': ['disclose', 'Possible use · illustration'],
  'Possible use: an assistant': ['disclose', 'Possible use · illustration'],
  'Possible use': ['disclose', 'Possible use · illustration'],
  'Illustration of the reported difficulty': ['disclose', 'Illustration of the reported difficulty'],
  '26 motors · some of them shown': ['fact', '26 motors'],
};
/** the list of strings that may appear on screen (for the audit in tools/text_audit_v3.ts) */
export const ALLOWED_TEXT = Object.values(ALLOW).map(([, s]) => s);

/** plain on-screen text with a soft shadow (no container) */
export const Plain: React.FC<{x: number; y: number; text: string; size: number; anchor?: 'start' | 'middle' | 'end'; k?: number; weight?: number; light?: boolean}> = ({x, y, text, size, anchor = 'start', k = 1, weight = 800, light = true}) =>
  k <= 0.001 ? null : (
    <g opacity={k}>
      <text x={x + 2} y={y + 3} textAnchor={anchor} fontFamily="Nunito Variable" fontWeight={weight} fontSize={size} fill="#0E1418" opacity={0.45}>
        {text}
      </text>
      <text x={x} y={y} textAnchor={anchor} fontFamily="Nunito Variable" fontWeight={weight} fontSize={size} fill={light ? '#FBF7EE' : '#1E2A33'} letterSpacing={0.4}>
        {text}
      </text>
    </g>
  );

export const Tag: React.FC<{x: number; y: number; text: string; k?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; tone?: string}> = ({text, k = 1}) => {
  const a = ALLOW[text];
  if (!a || k <= 0.001) return null;
  const [kind, s] = a;
  // V4: sources small and discreet, always in the same top-left spot
  if (kind === 'source') return <Plain x={56} y={66} text={s} size={23} k={k * 0.88} weight={700} />;
  if (kind === 'fact') return <Plain x={64} y={1030} text={s} size={40} k={k} />;
  return <Plain x={56} y={1040} text={s} size={22} k={k * 0.85} weight={700} />;
};
