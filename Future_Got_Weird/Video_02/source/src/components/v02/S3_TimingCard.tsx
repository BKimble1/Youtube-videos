import React from 'react';
import {C, F} from '../../theme';

/**
 * S2's settled "what survives: timing" card, carried across the S2 -> S3 match cut (review r1 D03, lead L1 option a).
 *
 * S2.4 ends on the room at HANDOFF_S2S3 (tilt 0) with this card settled in the left column (S2_Mirror BARS: screen
 * x 92..792, y 540..912, the blended blip's bar risen in slot 7, the label at 52 px). S3 opens on the same camera and
 * poses and draws this card where S2 left it, so across the cut only S2's light routes go; the card then slides out to
 * the left as S3's push starts (it also hides most of the bare paper beyond the room's left wall in that framing).
 *
 * The drawing is S2_Mirror's bars card at its settled state (barsIn = 1, the bar's spring settled, label scale 1), in
 * the same DOM structure, so the frames either side of the cut match pixel for pixel. If S2 changes its card, this
 * copy must follow (S2 does not export it).
 *
 * Screen space; pure function of `dx` (the slide-out offset, px; 0 = S2's place).
 */

/** S2_Mirror BARS (screen px): the card rect, the slots and the bar baseline. */
export const TIMING_CARD = {x0: 92, y0: 540, x1: 792, y1: 912, n: 12, slot: 7, base: 846, x: 152, w: 40, gap: 10, hMax: 150, shadow: {dx: 10, dy: 14}};

const f2 = (n: number) => Math.round(n * 100) / 100;

export const TimingCard: React.FC<{dx: number}> = ({dx}) => {
  const B = TIMING_CARD;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, ...(dx !== 0 ? {transform: `translateX(${f2(dx)}px)`} : {})}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1, transform: 'translateX(0px)'}}>
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <rect x={B.x0 + B.shadow.dx} y={B.y0 + B.shadow.dy} width={B.x1 - B.x0} height={B.y1 - B.y0} rx={22} fill={C.shadow} />
          <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} rx={22} fill={C.cream} stroke={C.ink} strokeWidth={4} />
          {Array.from({length: B.n}, (_, i) => {
            const x = B.x + i * (B.w + B.gap);
            const h = i === B.slot ? B.hMax : 0;
            return (
              <g key={i}>
                <rect x={x} y={B.base - B.hMax} width={B.w} height={B.hMax} rx={6} fill={C.paperDeep} stroke={C.tealDeep} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.75} />
                {h > 0.5 && <rect x={x} y={f2(B.base - h)} width={B.w} height={f2(h)} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={4} />}
              </g>
            );
          })}
          <line x1={B.x - 14} y1={B.base} x2={B.x + B.n * (B.w + B.gap) + 4} y2={B.base} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <text x={B.x + B.n * (B.w + B.gap) + 4} y={B.base + 46} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.inkSoft}>
            time →
          </text>
        </svg>
      </div>
      <div style={{position: 'absolute', left: B.x0 + 36, top: B.y0 + 58, transform: 'translateY(-50%) scale(1)', transformOrigin: '0 50%', fontFamily: F.display, fontWeight: 600, fontSize: 52, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1}}>
        what survives: timing
      </div>
    </div>
  );
};
