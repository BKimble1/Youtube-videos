import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E, drop, impact} from '../../lib/motion';

/**
 * S3.2 arrival card (screen space): an ILLUSTRATIVE arrival histogram built from blocks. Each block is one unit of
 * returned light dropping into its arrival-time slot: a tall stack for the one-bounce wall echo, one small block for
 * the three-bounce echo from him. Time runs left to right; the slots are the scene's choice (from the room's geometry).
 *
 * Pure function of the global frame `g` and the drop schedule the scene computes from its cues.
 */

export type BlockDrop = {slot: number; land: number; tone: 'teal' | 'saffron'};

/** Screen rect at CAM_PATH_SIDE: the card covers the whole potted plant in the back-left corner (top above its leaves,
 *  right edge past its rightmost leaf tip, bottom below the pot and its shadow; with the set-scaled plant the pot used to
 *  stick out under the card and a leaf tip at its right edge), and stays clear of her hand. */
export const BLOCK_CARD = {x0: 96, y0: 56, w: 808, h: 778};
const SLOTS = 16;
const IN = {x0: 64, x1: 750, base: 650}; // card-local: slot area and baseline (the extra height goes above the stack)
const SLOT_W = (IN.x1 - IN.x0) / SLOTS;
const BLOCK = 40;
const PITCH = 43; // vertical pitch of stacked blocks

/** Card-local guard-rail chip ("illustrative") and the static "not to scale" note under it (review r2 N05, lead decision
 *  R2-L2, closing D19 step 5): the S3.1 tally beside this card already says "not to scale · far more is lost", and 9
 *  countable blocks against 1 would otherwise invite "his echo is a tenth of the wall's". The note is part of the card
 *  (it slides with it, no entrance of its own). Nunito at line-height 1 puts the ink of a 30 px line ~2 px below its box
 *  top and the baseline ~24 px below it (measured on the chip's own text); the note has no descenders. */
const CHIP = {right: 26, top: 26, padX: 20, padY: 7, border: 3, size: 30};
const CHIP_BOTTOM = CHIP.top + 2 * CHIP.padY + 2 * CHIP.border + CHIP.size; // line-height 1
const NOTE = {text: 'not to scale · far weaker', right: 30, top: 98, size: 30};
const NOTE_INK_TOP = NOTE.top + 2;
const NOTE_INK_BOTTOM = NOTE.top + 24;
/** Ink width of the note at 30 px bold (measured 333 px at f3370, rounded up) and the title's ink right edge (measured
 *  card-local 415), used only for the clearance checks and the no-fall zone below. */
const NOTE_W = 340;
const NOTE_X1 = BLOCK_CARD.w - NOTE.right;
const NOTE_X0 = NOTE_X1 - NOTE_W;
const TITLE_X1 = 420;
const TITLE_BOTTOM = 66; // title baseline (no descenders)
/** Blocks fall from just under the title band (the blocks' clip rect starts at CLIP_Y0). In the note's columns a falling
 *  block is drawn only once its top is below the note (NOTE_COLS.y1), so no block ever passes under the note's text (the
 *  one-block slot for him sits under it; with the 7-frame drop this hides exactly the one frame it would have crossed).
 *  The clip itself is unchanged, so every other block renders as before. */
const CLIP_Y0 = 92;
const NOTE_COLS = {x0: NOTE_X0 - 12, x1: NOTE_X1 + 12, y1: NOTE_INK_BOTTOM + 10};
const inNoteCols = (cx: number) => cx + BLOCK / 2 > NOTE_COLS.x0 && cx - BLOCK / 2 < NOTE_COLS.x1;
const MIN_GAP = 20;

/** Module-load checks of the card's static layout (any failure throws). */
(() => {
  const fails: string[] = [];
  if (NOTE.size < 30) fails.push(`the not-to-scale note is ${NOTE.size} px (< 30 guard-rail)`);
  if (NOTE_INK_TOP - CHIP_BOTTOM < MIN_GAP) fails.push(`the note is ${NOTE_INK_TOP - CHIP_BOTTOM} px under the chip (< ${MIN_GAP})`);
  if (NOTE_X0 - TITLE_X1 < MIN_GAP && NOTE_INK_TOP - TITLE_BOTTOM < MIN_GAP) fails.push('the note runs into the title');
  if (NOTE_X1 > BLOCK_CARD.w - 26 || NOTE_X0 < 34) fails.push('the note is outside the card text column');
  if (!(NOTE_COLS.y1 > CLIP_Y0) || NOTE_COLS.x0 >= NOTE_COLS.x1) fails.push('the no-fall zone under the note is malformed');
  if (fails.length) throw new Error(`S3 block card layout: ${fails.join('; ')}`);
})();

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (n: number) => Math.round(n * 100) / 100;
const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));

/** Card-local centre x of a slot. */
export const slotX = (slot: number) => IN.x0 + (slot + 0.5) * SLOT_W;
/** Number of slots on the card. */
export const BLOCK_SLOTS = SLOTS;

export type BlockCardT = {
  /** 0..1 slide in from the left */
  enter: number;
  /** 0..1 labels */
  wallLabel: number;
  himLabel: number;
  /** 0..1 a small pointer ring on his block ("tiny") */
  tiny: number;
};

export const BlockCard: React.FC<{g: number; drops: BlockDrop[]; t: BlockCardT; opacity?: number}> = ({g, drops, t, opacity = 1}) => {
  const enter = clamp01(t.enter);
  if (enter <= 0) return null;
  const dx = -(BLOCK_CARD.x0 + BLOCK_CARD.w + 40) * (1 - E.out(enter));
  // stack index of each drop in its slot (in drop order)
  const counts = new Map<number, number>();
  const placed = drops.map((d) => {
    const k = counts.get(d.slot) ?? 0;
    counts.set(d.slot, k + 1);
    return {...d, k};
  });
  const wallSlot = placed.find((d) => d.tone === 'teal')?.slot ?? 0;
  const wallN = counts.get(wallSlot) ?? 0;
  const himSlot = placed.find((d) => d.tone === 'saffron')?.slot ?? SLOTS - 3;
  const himD = placed.find((d) => d.tone === 'saffron');
  const wallTopY = IN.base - wallN * PITCH;
  // a block resting in the note's columns must sit below the note (else it would never be drawn), and the wall label
  // ("1 bounce", 44 px, over the stack) stays clear of the note
  for (const d of placed) {
    const restTop = IN.base - (d.k + 1) * PITCH + (PITCH - BLOCK);
    if (inNoteCols(slotX(d.slot)) && restTop < NOTE_COLS.y1) throw new Error(`S3 block card: a resting block in slot ${d.slot} reaches up under the not-to-scale note`);
  }
  if (slotX(wallSlot) + 34 + 200 > NOTE_X0 && wallTopY + 30 - 44 - NOTE_INK_BOTTOM < MIN_GAP) throw new Error('S3 block card: the "1 bounce" label runs into the not-to-scale note');
  return (
    <div style={{position: 'absolute', left: BLOCK_CARD.x0, top: BLOCK_CARD.y0, width: BLOCK_CARD.w, height: BLOCK_CARD.h, transform: `translateX(${f2(dx)}px)`, opacity}}>
      <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 22, boxShadow: `10px 12px 0 ${C.shadow}`}} />
      <svg width={BLOCK_CARD.w} height={BLOCK_CARD.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id="s3blocks">
            <rect x={6} y={92} width={BLOCK_CARD.w - 12} height={BLOCK_CARD.h - 98} rx={4} />
          </clipPath>
        </defs>
        <text x={34} y={66} fontFamily={F.body} fontWeight={800} fontSize={38} fill={C.inkSoft}>
          arrivals at the sensor
        </text>
        {/* blocks */}
        <g clipPath="url(#s3blocks)">
          {placed.map((d, i) => {
            if (g < d.land - 10) return null;
            const restY = IN.base - (d.k + 1) * PITCH + (PITCH - BLOCK);
            const fallH = restY + BLOCK - 80; // from just under the title band
            const y = restY + drop(g, d.land, fallH, 7);
            const [sx, sy] = impact(g, d.land, 0.14, 8);
            const cx = slotX(d.slot);
            if (inNoteCols(cx) && y < NOTE_COLS.y1) return null; // still falling past the note (see NOTE_COLS)
            const fill = d.tone === 'teal' ? C.teal : C.saffron;
            const top = d.tone === 'teal' ? C.tealLight : C.saffronLight;
            return (
              <g key={i} opacity={f2(clamp01((g - (d.land - 7)) / 3))} transform={`translate(${f2(cx)} ${f2(y + BLOCK)}) scale(${f2(sx)} ${f2(sy)})`}>
                <rect x={-BLOCK / 2} y={-BLOCK} width={BLOCK} height={BLOCK} rx={7} fill={fill} stroke={C.ink} strokeWidth={3.5} />
                <path d={`M ${-BLOCK / 2 + 7} ${-BLOCK + 7} L ${BLOCK / 2 - 9} ${-BLOCK + 7}`} stroke={top} strokeWidth={4} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
        {/* time axis with slot ticks */}
        <path d={`M ${IN.x0 - 10} ${IN.base} L ${IN.x1 + 6} ${IN.base}`} stroke={C.ink} strokeWidth={OUTLINE} strokeLinecap="round" />
        {Array.from({length: SLOTS + 1}, (_, i) => (
          <path key={i} d={`M ${f2(IN.x0 + i * SLOT_W)} ${IN.base} L ${f2(IN.x0 + i * SLOT_W)} ${IN.base + 12}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        ))}
        <path d={`M ${IN.x1 - 4} ${IN.base + 44} L ${IN.x1 + 14} ${IN.base + 44} M ${IN.x1 + 2} ${IN.base + 34} L ${IN.x1 + 14} ${IN.base + 44} L ${IN.x1 + 2} ${IN.base + 54}`} fill="none" stroke={C.inkSoft} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <text x={IN.x1 - 14} y={IN.base + 56} textAnchor="end" fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft}>
          arrival time
        </text>
        {/* labels */}
        {t.wallLabel > 0 && (
          <g opacity={clamp01(t.wallLabel * 2)} transform={`translate(${f2(slotX(wallSlot) + 34)} ${f2(wallTopY + 30)}) scale(${f2(pop(clamp01(t.wallLabel)))})`}>
            <text x={0} y={0} fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.tealDeep}>
              1 bounce
            </text>
            <text x={2} y={40} fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft}>
              wall
            </text>
          </g>
        )}
        {t.himLabel > 0 && himD && (
          <g opacity={clamp01(t.himLabel * 2)} transform={`translate(${f2(slotX(himSlot))} ${f2(IN.base - PITCH - 70)}) scale(${f2(pop(clamp01(t.himLabel)))})`}>
            <text x={0} y={-36} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.saffronDeep}>
              3 bounces
            </text>
            <text x={0} y={4} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft}>
              him
            </text>
            <path d={`M 0 22 L 0 48`} stroke={C.inkSoft} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {t.tiny > 0 && himD && (
          <circle cx={f2(slotX(himSlot))} cy={f2(IN.base - BLOCK / 2)} r={f2(30 * pop(clamp01(t.tiny)))} fill="none" stroke={C.coral} strokeWidth={5} opacity={clamp01(t.tiny * 3)} />
        )}
      </svg>
      {/* guard-rail chip */}
      <div style={{position: 'absolute', right: CHIP.right, top: CHIP.top, padding: `${CHIP.padY}px ${CHIP.padX}px`, borderRadius: 999, background: C.cream, border: `${CHIP.border}px solid ${C.inkMuted}`, fontFamily: F.body, fontWeight: 800, fontSize: CHIP.size, color: C.inkSoft, lineHeight: 1}}>
        illustrative
      </div>
      {/* static guard-rail note (N05 / R2-L2), part of the card */}
      <div style={{position: 'absolute', right: NOTE.right, top: NOTE.top, fontFamily: F.body, fontWeight: 700, fontSize: NOTE.size, color: C.inkSoft, lineHeight: 1, whiteSpace: 'nowrap'}}>{NOTE.text}</div>
    </div>
  );
};
