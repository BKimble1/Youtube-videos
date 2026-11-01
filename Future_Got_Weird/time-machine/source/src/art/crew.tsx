// The Weird Crew head and hands, built on the approved cast rig (robot-faces/source/src/v2/crew.tsx, ported from
// can-you-hurt-something-that-isnt-alive Character.tsx): tall oval head rx 58 / ry 62 with a 4 px ink contour, ears,
// white eyes with an ink pupil and a catch-light, a hooked ink nose, an ink-line mouth and coral cheeks.
// New for this episode: a continuous AGE parameter (0 = young adult, 1 = elderly). Nothing switches between models:
// every age cue is a continuous function of age, so the face changes as one biological process:
//   hair greys (salt-and-pepper, then white), thins and recedes, the crown shows; brows thicken, whiten and droop;
//   forehead lines, crow's feet, eye bags, nasolabial and marionette folds draw in progressively (their stroke length
//   and weight grow); the upper lids droop; the jaw softens and jowls form (the silhouette itself is re-shaped); the
//   nose and ears lengthen; the lips thin and the mouth corners settle; the skin pales slightly and age spots come in.
import React from 'react';
import {mix} from '../core/color';
import {closed, P} from '../core/geo';
import {clamp, sm} from '../lib';

export const INK = '#162A32';
export const C = {
  ink: INK, inkMuted: '#6F8590', saffron: '#FFC744', saffronDeep: '#E9A91C', teal: '#1CA7A0', coral: '#EF6B55', coralDeep: '#C94A36',
  blue: '#4F7CC9', blueLight: '#D3E1F8', white: '#FFFFFF', cream: '#FFFBF0', shadow: 'rgba(22,42,50,0.16)',
};
export const OUT = 4;
export const HEAD_R = 58;
const ss = (x: number, a: number, b: number) => sm((x - a) / (b - a));

export type Hair = 'spiky' | 'swoop' | 'bob';
export type Expr = {
  brows?: number; // -1 down .. 1 raised
  wide?: number; // 0..1 eyes widen (shock)
  mouth?: 'smile' | 'flat' | 'o' | 'frown' | 'gasp' | 'soft' | 'tremble';
  open?: number; // 0..1 for o / gasp
  lookX?: number;
  lookY?: number;
  blink?: number; // 1 open
  turn?: number; // -1..1, features shift sideways (3/4 turn)
  sad?: number; // 0..1 inner brows up
};

/** hair colour by age: own colour, then salt-and-pepper, then white */
export const hairAt = (base: string, age: number) => {
  const g1 = mix(base, '#8E9097', ss(age, 0.12, 0.62));
  return mix(g1, '#E6E7EC', ss(age, 0.58, 1));
};
export const skinAt = (base: string, age: number) => mix(base, '#DCC2B2', 0.28 * ss(age, 0.35, 1));

/** a stroke that "draws in" as u goes 0 -> 1 (length via dash, weight with it) */
const Grow: React.FC<{d: string; u: number; w?: number; len?: number; color?: string; op?: number}> = ({d, u, w = 3, len = 80, color = INK, op = 0.85}) => {
  if (u <= 0.001) return null;
  return <path d={d} fill="none" stroke={color} strokeWidth={w * (0.45 + 0.55 * u)} strokeLinecap="round" strokeDasharray={`${len * u} ${len * 2}`} opacity={op * clamp(u * 2.5)} />;
};

export const Head: React.FC<{
  skin: string; hair: Hair; hairColor: string; age?: number; e?: Expr; cheeks?: boolean; glasses?: number; id: string; noHair?: boolean;
  /** a reflection drawn on one eye (head-local content, clipped to the eye white, under the pupil) */
  eyeRefl?: {side: 1 | -1; node: React.ReactNode; op: number};
}> = ({skin: skin0, hair, hairColor, age = 0, e = {}, cheeks = true, glasses = 0, id, noHair = false, eyeRefl}) => {
  const a = clamp(age);
  const skin = skinAt(skin0, a);
  const hc = hairAt(hairColor, a);
  const tx = (e.turn ?? 0) * 9; // feature shift for a 3/4 turn
  const j = ss(a, 0.35, 1); // jowl / softening
  const wide = e.wide ?? 0;
  // silhouette: an ellipse whose lower half widens and sags with age (jowls), chin softens
  const pts: P[] = [];
  for (let k = 0; k < 24; k++) {
    const th = (k / 24) * Math.PI * 2;
    let x = Math.sin(th) * HEAD_R, y = -Math.cos(th) * (HEAD_R + 4);
    const low = Math.max(0, -Math.cos(th)) ; // 0 at top half, 1 at the chin
    const side = Math.abs(Math.sin(th));
    x *= 1 + j * 0.07 * Math.pow(Math.max(0, -Math.cos(th) + 0.3), 1.5) * side;
    y += j * 5 * low * side + j * 3 * low;
    pts.push({x, y});
  }
  const sil = closed(pts);
  const eyeY = -6;
  const eyeRy = 13 * (1 - 0.18 * ss(a, 0.4, 1)) * (1 + 0.16 * wide);
  const eyeRx = 12 * (1 + 0.1 * wide);
  const bl = e.blink ?? 1;
  const brows = e.brows ?? 0;
  const sad = e.sad ?? 0;
  const lx = (e.lookX ?? 0) * 5, ly = (e.lookY ?? 0) * 4;
  const browY = eyeY - 22 - brows * 6 - wide * 5;
  const browW = 5 + 3 * ss(a, 0.45, 1);
  const earRy = 12 * (1 + 0.28 * ss(a, 0.3, 1));
  const noseS = 1 + 0.22 * ss(a, 0.3, 1);
  const mouthY = 30 + 2 * j;
  const mw = 16 * (1 - 0.08 * j);
  const clipId = `${id}-sil`;
  // hair -----------------------------------------------------------------------------------------------------------
  const thin = ss(a, 0.45, 1); // thinning / receding
  const hairEl = (() => {
    if (noHair) return null;
    const r = HEAD_R, cy = 0;
    const st = {fill: hc, stroke: INK, strokeWidth: OUT, strokeLinejoin: 'round' as const};
    if (hair === 'spiky')
      return <path d={`M ${-r} ${cy - 12} L ${-r + 4} ${cy - r - 22} L ${-28} ${cy - r - 4} L ${-14} ${cy - r - 34} L 0 ${cy - r - 6} L 14 ${cy - r - 36} L 28 ${cy - r - 4} L ${r - 4} ${cy - r - 22} L ${r} ${cy - 12} Q ${r * 0.6} ${cy - r * 0.55} 0 ${cy - r * 0.6} Q ${-r * 0.6} ${cy - r * 0.55} ${-r} ${cy - 12} Z`} {...st} />;
    if (hair === 'bob') {
      const lift = thin * 6;
      return <path d={`M ${-r - 10} ${cy + 26 - lift} L ${-r - 10} ${cy - 10} Q ${-r - 6} ${cy - r - 20} 0 ${cy - r - 18 + thin * 4} Q ${r + 6} ${cy - r - 20} ${r + 10} ${cy - 10} L ${r + 10} ${cy + 26 - lift} L ${r - 6} ${cy + 26 - lift} L ${r - 6} ${cy - 20} Q ${r * 0.5} ${cy - r * 0.6} 0 ${cy - r * 0.62} Q ${-r * 0.5} ${cy - r * 0.6} ${-r + 6} ${cy - 20} L ${-r + 6} ${cy + 26 - lift} Z`} {...st} />;
    }
    // swoop: the crest flattens and the front edge recedes; by old age only side hair and a thin wisp remain
    const top = r + 24 - 18 * thin; // crest height above centre
    const front = 2 + 22 * thin; // how far the hairline has moved back
    const sideTop = cy - 4 - 10 * thin;
    const crest = (1 - ss(a, 0.62, 0.95)); // crest volume
    return (
      <g>
        {crest > 0.02 && (
          <path d={`M ${-r - 4} ${sideTop} Q ${-r - 6} ${cy - top} ${-10} ${cy - top + 4 * (1 - crest)} Q ${r + 10} ${cy - top - 10 * crest} ${r + 8} ${cy - r + 10 + front * 0.4} Q ${r - 10} ${cy - r - 2 + front} ${20} ${cy - r + 2 + front} Q ${-20} ${cy - r + 4 + front} ${-r - 4} ${sideTop} Z`} {...st} opacity={clamp(crest * 1.6)} />
        )}
        {/* side hair (stays, whitens; the temples grey first) */}
        <path d={`M ${-r - 3} ${cy + 8} Q ${-r - 7} ${cy - 22} ${-r + 10} ${cy - 40 + 8 * thin} L ${-r + 16} ${cy - 30} Q ${-r + 6} ${cy - 12} ${-r + 4} ${cy + 10} Z`} {...st} fill={hairAt(hairColor, Math.min(1, a + 0.22))} />
        <path d={`M ${r + 3} ${cy + 8} Q ${r + 7} ${cy - 22} ${r - 10} ${cy - 40 + 8 * thin} L ${r - 16} ${cy - 30} Q ${r - 6} ${cy - 12} ${r - 4} ${cy + 10} Z`} {...st} fill={hairAt(hairColor, Math.min(1, a + 0.22))} />
        {/* a thin wisp over the crown in old age */}
        {thin > 0.5 && <path d={`M ${-22} ${cy - r + 4} Q 0 ${cy - r - 10 + 4 * thin} 24 ${cy - r + 2}`} fill="none" stroke={hc} strokeWidth={5 * (thin - 0.5) * 2} strokeLinecap="round" />}
      </g>
    );
  })();
  return (
    <g>
      {hair === 'bob' && !noHair && hairEl}
      {/* ears */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * (HEAD_R + 2) - tx * 0.3} cy={6 + (earRy - 12) * 0.5} rx={9} ry={earRy} fill={skin} stroke={INK} strokeWidth={OUT} />
          <path d={`M ${s * (HEAD_R + 2) - tx * 0.3 - s * 1} ${0} q ${s * 4} ${6} 0 ${10 + (earRy - 12)}`} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.5} strokeLinecap="round" />
        </g>
      ))}
      <path d={sil} fill={skin} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <defs>
        <clipPath id={clipId}><path d={sil} /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* soft form shading on the shadow side (lower right), part of the FGW finish */}
        <path d={`M ${HEAD_R * 0.55} ${-HEAD_R} Q ${HEAD_R * 1.25} ${0} ${HEAD_R * 0.3} ${HEAD_R + 12} L ${HEAD_R + 20} ${HEAD_R + 20} L ${HEAD_R + 20} ${-HEAD_R} Z`} fill={mix(skin, '#9C6A55', 0.32)} opacity={0.35} />
        {/* age spots */}
        {a > 0.7 && [[-34, -30, 3.2], [-26, -38, 2.2], [38, -22, 2.6]].map(([x, y, r], i) => <circle key={i} cx={x + tx * 0.5} cy={y} r={r * ss(a, 0.72 + i * 0.04, 1)} fill="#B88866" opacity={0.55} />)}
        {/* forehead lines */}
        {[0, 1, 2].map((k) => <Grow key={k} d={`M ${-22 - k * 3 + tx * 0.6} ${-36 - k * 8} Q ${tx * 0.6} ${-40 - k * 8} ${22 + k * 3 + tx * 0.6} ${-36 - k * 8}`} u={ss(a, 0.18 + 0.1 * k, 0.7 + 0.08 * k)} w={2.6} len={50 + k * 6} op={0.55} />)}
      </g>
      {hair !== 'bob' && hairEl}
      {/* cheeks */}
      {cheeks && (
        <g opacity={0.55 * (1 - 0.45 * ss(a, 0.4, 1))}>
          <circle cx={-34 + tx} cy={16 + 3 * j} r={9} fill={C.coral} />
          <circle cx={34 + tx} cy={16 + 3 * j} r={9} fill={C.coral} />
        </g>
      )}
      {/* eyes */}
      {[-1, 1].map((s) => {
        const ex = s * 21 + tx;
        const bw = s * (sad * 5); // inner-brow lift
        return (
          <g key={s}>
            {/* eye bags */}
            <Grow d={`M ${ex - 10} ${eyeY + 15} Q ${ex} ${eyeY + 21} ${ex + 10} ${eyeY + 15}`} u={ss(a, 0.22, 0.8)} w={2.4} len={26} op={0.5} />
            <ellipse cx={ex} cy={eyeY} rx={eyeRx} ry={Math.max(0.6, eyeRy * bl)} fill={C.white} stroke={INK} strokeWidth={3} />
            {eyeRefl && eyeRefl.side === s && eyeRefl.op > 0.001 && (
              <g>
                <clipPath id={`${id}-eye${s}`}><ellipse cx={ex} cy={eyeY} rx={eyeRx - 1.4} ry={Math.max(0.6, eyeRy * bl - 1.4)} /></clipPath>
                <g clipPath={`url(#${id}-eye${s})`} opacity={eyeRefl.op}>{eyeRefl.node}</g>
              </g>
            )}
            {bl > 0.25 && <circle cx={ex + lx} cy={eyeY + ly} r={5.5 * (1 - 0.12 * wide)} fill={eyeRefl && eyeRefl.side === s ? '#05060B' : INK} />}
            {bl > 0.25 && <circle cx={ex + lx + 2} cy={eyeY + ly - 2} r={1.6} fill={C.white} opacity={eyeRefl && eyeRefl.side === s ? 1 - clamp(eyeRefl.op * 1.4) : 1} />}
            {/* drooping upper lid: a skin cap over the top of the eye that grows with age */}
            {a > 0.35 && bl > 0.25 && (
              <path d={`M ${ex - eyeRx - 1} ${eyeY - 1} Q ${ex} ${eyeY - eyeRy - 4} ${ex + eyeRx + 1} ${eyeY - 1} Q ${ex} ${eyeY - eyeRy + 6 * ss(a, 0.35, 1) * (1 - wide)} ${ex - eyeRx - 1} ${eyeY - 1} Z`} fill={skin} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" opacity={ss(a, 0.35, 0.6)} />
            )}
            {/* crow's feet */}
            {[0, 1].map((k) => <Grow key={k} d={`M ${ex + s * (eyeRx + 3)} ${eyeY - 3 + k * 7} l ${s * 8} ${-4 + k * 7}`} u={ss(a, 0.45 + 0.08 * k, 0.9)} w={2.2} len={10} op={0.6} />)}
            {/* brow */}
            <path d={`M ${ex - s * 12} ${browY + 6 * ss(a, 0.5, 1) * 0 - bw} Q ${ex} ${browY - 4 - brows * 2} ${ex + s * 12} ${browY + 4 * ss(a, 0.45, 1) + (brows < 0 ? -brows * 4 : 0)}`} fill="none" stroke={a > 0.3 ? mix(INK, hc, ss(a, 0.4, 0.9) * 0.85) : INK} strokeWidth={browW} strokeLinecap="round" />
          </g>
        );
      })}
      {/* nose */}
      <g transform={`translate(${tx * 1.15} 0) scale(${noseS}) `}>
        <path d={`M 2 2 Q 10 16 0 18`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* nasolabial folds, marionette lines */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <Grow d={`M ${s * 12 + tx} ${14} Q ${s * 24 + tx} ${24} ${s * 22 + tx} ${mouthY + 4}`} u={ss(a, 0.14, 0.75)} w={2.6} len={30} op={0.55} />
          <Grow d={`M ${s * 15 + tx} ${mouthY + 6} Q ${s * 17 + tx} ${mouthY + 14} ${s * 15 + tx} ${mouthY + 20}`} u={ss(a, 0.6, 1)} w={2.4} len={16} op={0.5} />
        </g>
      ))}
      {/* mouth */}
      <g transform={`translate(${tx} 0)`}>
        {(() => {
          const m = e.mouth ?? 'smile';
          const o = e.open ?? 0.6;
          const sag = 3 * j;
          const st = {fill: 'none', stroke: INK, strokeWidth: OUT * (1 - 0.15 * j), strokeLinecap: 'round' as const};
          if (m === 'smile') return <path d={`M ${-mw} ${mouthY + sag * 0.5} Q 0 ${mouthY + 14 - sag} ${mw} ${mouthY + sag * 0.5}`} {...st} />;
          if (m === 'soft') return <path d={`M ${-mw * 0.8} ${mouthY + 2 + sag * 0.5} Q 0 ${mouthY + 8 - sag} ${mw * 0.8} ${mouthY + 2 + sag * 0.5}`} {...st} />;
          if (m === 'flat') return <path d={`M ${-mw * 0.85} ${mouthY + 3 + sag * 0.4} L ${mw * 0.85} ${mouthY + 3 + sag * 0.4}`} {...st} />;
          if (m === 'frown') return <path d={`M ${-mw} ${mouthY + 7} Q 0 ${mouthY - 4} ${mw} ${mouthY + 7}`} {...st} />;
          if (m === 'tremble') return <path d={`M ${-mw * 0.9} ${mouthY + 5} Q ${-mw * 0.4} ${mouthY + 1} 0 ${mouthY + 4} Q ${mw * 0.4} ${mouthY + 1} ${mw * 0.9} ${mouthY + 5}`} {...st} />;
          // o / gasp: an ink opening
          const w = m === 'gasp' ? 11 + 3 * o : 7 + 2 * o, h = (m === 'gasp' ? 9 : 6) + 10 * o;
          return (
            <g>
              <ellipse cx={0} cy={mouthY + 4} rx={w} ry={h} fill={INK} />
              {o > 0.3 && <ellipse cx={0} cy={mouthY + 4 + h * 0.5} rx={w * 0.55} ry={h * 0.28} fill="#C9575F" />}
            </g>
          );
        })()}
      </g>
      {/* glasses (appear in later life) */}
      {glasses > 0.01 && (
        <g fill="none" stroke={INK} strokeWidth={3.5} opacity={clamp(glasses * 1.5)} transform={`translate(${tx} ${-8 * (1 - glasses)})`}>
          <circle cx={-21} cy={eyeY} r={17} fill="rgba(220,236,255,0.18)" />
          <circle cx={21} cy={eyeY} r={17} fill="rgba(220,236,255,0.18)" />
          <line x1={-4} y1={eyeY - 2} x2={4} y2={eyeY - 2} />
          <path d={`M -38 ${eyeY - 2} L -56 ${eyeY - 6} M 38 ${eyeY - 2} L 56 ${eyeY - 6}`} />
        </g>
      )}
    </g>
  );
};

/** mitt hand in the cast style (palm + thumb), with optional age (knuckle lines, spots, thinner) */
export const Mitt: React.FC<{skin: string; age?: number; side?: 1 | -1; open?: number}> = ({skin, age = 0, side = 1, open = 0}) => {
  const a = clamp(age);
  const sk = skinAt(skin, a);
  return (
    <g>
      <ellipse cx={0} cy={6} rx={20 * (1 - 0.06 * a)} ry={18 + 4 * open} fill={sk} stroke={INK} strokeWidth={OUT} />
      <g transform={`rotate(${side * (-30 - 25 * open)})`}>
        <ellipse cx={side * -14} cy={-2} rx={8} ry={10} fill={sk} stroke={INK} strokeWidth={OUT} />
        <ellipse cx={side * -14} cy={-2} rx={6} ry={8} fill={sk} />
      </g>
      {a > 0.3 && <path d={`M -10 ${14} q 4 3 8 0 M 2 ${15} q 4 3 8 0`} fill="none" stroke={INK} strokeWidth={2} opacity={0.5 * ss(a, 0.3, 0.8)} strokeLinecap="round" />}
      {a > 0.65 && <circle cx={6} cy={2} r={2.4 * ss(a, 0.65, 1)} fill="#B88866" opacity={0.6} />}
    </g>
  );
};
