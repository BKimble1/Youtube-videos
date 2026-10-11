import React from 'react';
import {C, E, lerp, measure, CAP_FONT, HED_FONT, fitSize, mix, EV, INK, CREAM, PAPER, GREY, WIN, HDR_H, TB1, BTN2, Q2, Q3, P_START, P_PRESS, rectLerp, Rect, Card, PoliceHeader, Cursor2, Button2, Env3, AIMark, bgCream, ramp} from './kit3';
import {QuotePaper, lineReveal} from './quote';

/** Opening handoff (V3.1), frames at 30 fps. The headline, the old form + cursor and the envelope each leave or open as ONE group; no mask crops anything. */
export const T_EXIT = EV['o.clear'] - 2;           // 56: headline and form start to leave
const HEAD_EXIT = 7, FORM_EXIT = 6;
export const T_PAPER0 = EV['o.open'] - 3;          // 58: the envelope opens and the paper starts to rise out of it
export const T_PAPER1 = EV['b2.paper'] + 2;        // 66: the paper owns the shot
const T_L1 = T_PAPER1 - 2;                         // 64: first phrase appears as the paper settles
const T_L2 = T_PAPER1 + 3;                         // 69: the rest of the excerpt follows promptly (the highlight stays on the narration: b2.hl0)
const E1 = {x: 486, y: 744};
const POCKET: Rect = {x: E1.x - 165, y: E1.y - 40, w: 330, h: 92};

/** two flat colour fields: ink, and a cream layer that cross-fades in/out over 8 frames (no shape wipe, no second card edge) */
export const Backdrop: React.FC<{g: number}> = ({g}) => {
  const k = bgCream(g);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={INK} />
      {k > 0 && <rect x={0} y={0} width={1080} height={1920} fill={CREAM} opacity={k} />}
    </g>
  );
};

/* ------------------------------------------------------------------ opening headline: the first sentence, in three lines, is the integrated caption */
const LINES: {words: string[]; idx: number[]}[] = [
  {words: ['AI', 'SENT', 'POLICE'], idx: [0, 1, 2]},
  {words: ['A', 'FAKE'], idx: [3, 4]},
  {words: ['MURDER', 'TIP.'], idx: [5, 6]},
];
const WORD_EV = ['h.ai', 'h.sent', 'h.police', 'h.a', 'h.fake', 'h.murder', 'h.tip'] as const;
export const HL_X = 100;

export const Headline3: React.FC<{g: number}> = ({g}) => {
  const clear = E.inOut(ramp(g, T_EXIT, HEAD_EXIT));
  if (clear >= 1) return null;
  const size = Math.min(118, fitSize('AI SENT POLICE', HED_FONT, 770, 120, 800, 2));
  const lh = size * 1.03;
  const y0 = 262 + size * 0.42;
  return (
    <g opacity={1 - clear} transform={`translate(0 ${-clear * 22})`}>
      {LINES.map((ln, li) => {
        let x = HL_X;
        const space = measure(' ', HED_FONT, size, 800, 2);
        return ln.words.map((w, wi) => {
          const idx = ln.idx[wi];
          const t = EV[WORD_EV[idx]];
          const k = E.out(ramp(g, t - 1, 4));        // 0 = not yet spoken, 1 = spoken
          let fill = mix(CREAM, INK, 0.3 * (1 - k));
          if (w === 'AI') fill = C.saffron;
          if (w === 'POLICE') fill = mix(mix(CREAM, INK, 0.3), C.teal, k);
          if (w === 'FAKE') fill = C.coral;
          const pop = w === 'FAKE' && g >= t && g < t + 9 ? Math.sin(((g - t) / 9) * Math.PI) : 0;
          const wd = measure(w, HED_FONT, size, 800, 2);
          const xx = x;
          x += wd + space;
          return (
            <text key={`${li}-${wi}`} transform={`translate(${xx + wd / 2} ${y0 + li * lh}) scale(${1 + 0.06 * pop})`} x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={size} letterSpacing={2} fill={fill}>
              {w}
            </text>
          );
        });
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ the opening event */
const cursorAt = (g: number) => {
  const hit = EV['o.press'];
  const idle = {x: 2.5 * Math.sin(g / 7), y: 2 * Math.sin(g / 5 + 1)};
  if (g < hit - 7) return {x: P_START.x + idle.x, y: P_START.y + idle.y};
  if (g < hit - 3) { const u = E.out(ramp(g, hit - 7, 4)); return {x: P_START.x - 22 * u, y: P_START.y - 16 * u}; }       // anticipation: a small pull-back
  const u = E.in(ramp(g, hit - 3, 3));                                                                              // strike
  return {x: lerp(P_START.x - 22, P_PRESS.x, u), y: lerp(P_START.y - 16, P_PRESS.y, u)};
};

const TipBox: React.FC<{r: Rect; s?: number}> = ({r, s = 1}) => (
  <g>
    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={20 * s} fill={PAPER} stroke={INK} strokeWidth={7 * s} />
    {[0, 1].map((i) => <rect key={i} x={r.x + 30 * s} y={r.y + (40 + i * 56) * s} width={[560, 420][i] * s} height={18 * s} rx={9 * s} fill={GREY} />)}
  </g>
);

/** The tip window as it first appears (the same asset family as the form in the test beat). */
export const TipWindow: React.FC<{g: number}> = ({g}) => {
  const hit = EV['o.press'];
  const press = g < hit ? 0 : g < hit + 3 ? 1 : 1 - E.out(ramp(g, hit + 3, 5));
  const sent = g >= EV['o.sent'];
  const ring = g >= EV['o.sent'] && g < EV['o.sent'] + 9 ? (g - EV['o.sent']) / 9 : 0;
  const c = cursorAt(g);
  return (
    <g>
      <Card r={WIN} />
      <PoliceHeader r={WIN} h={HDR_H} />
      <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
      <TipBox r={TB1} />
      <Button2 r={BTN2} press={press} sent={sent} />
      {ring > 0 && <rect x={BTN2.x - 16 * ring} y={BTN2.y - 16 * ring} width={BTN2.w + 32 * ring} height={BTN2.h + 32 * ring + 12} rx={34} fill="none" stroke={C.teal} strokeWidth={7} opacity={1 - ring} />}
      <Cursor2 x={c.x} y={c.y} press={g >= hit && g < hit + 5 ? 1 : 0} />
    </g>
  );
};

/** B1: the headline and the form (with its cursor) are two separate groups that fade out whole, while the envelope sits in front of the form. */
export const OpenScene: React.FC<{g: number}> = ({g}) => {
  if (g >= T_EXIT + HEAD_EXIT) return null;
  const form = 1 - E.inOut(ramp(g, T_EXIT, FORM_EXIT));
  return (
    <g>
      {form > 0 && <g opacity={form}><TipWindow g={g} /></g>}
      <Headline3 g={g} />
    </g>
  );
};

/** The submitted tip: a copy lifts off the form, folds into an AI-marked envelope, travels, and opens toward camera into the quote paper. */
export const Packet3: React.FC<{g: number}> = ({g}) => {
  const tL = EV['o.lift'], tF = EV['o.fold'], tT = EV['o.travel'], tO = EV['o.open'];
  if (g < tL - 1 || g >= T_PAPER1 + 1) return null;
  const E0 = {x: 486, y: 934};
  const lift = E.out(ramp(g, tL, 6));
  const shrink = E.inOut(ramp(g, tF, 8));
  const slide = E.inOut(ramp(g, tF + 7, 5));
  const flap = g < EV['o.fold'] + 11 ? 0 : E.out(ramp(g, EV['o.fold'] + 11, 5));
  const envOp = E.out(ramp(g, tF + 1, 4));
  const frontOp = E.out(ramp(g, tF + 7, 3));
  const trav = E.inOut(ramp(g, tT, tO - tT - 4));
  // envelope centre / scale
  const ex = lerp(E0.x, E1.x, trav) + 46 * Math.sin(trav * Math.PI), ey = lerp(E0.y, E1.y, trav) - 18 * Math.sin(trav * Math.PI);
  const es = lerp(0.82, 0.92, trav);
  const er = -5 * Math.sin(trav * Math.PI);
  // paper: starts as the tip box copy, shrinks into the envelope pocket
  const pw = lerp(TB1.w, 330, shrink), ph = lerp(TB1.h, 92, shrink);
  const pcx = lerp(TB1.x + TB1.w / 2, E0.x, shrink), pcy = lerp(TB1.y + TB1.h / 2 - 30 * lift, E0.y - 8, shrink) + slide * 120;
  const inEnvelope = g >= tF + 7 && g < T_PAPER0;
  if (g >= T_PAPER0) {
    // the envelope opens toward camera and drops away behind the paper; the PAPER itself is the quote card (ClaimCard), so there is one surface only
    const open = E.inOut(ramp(g, T_PAPER0, T_PAPER1 - T_PAPER0));
    return (
      <Env3 x={E1.x} y={E1.y + open * 150} s={lerp(0.92, 1.35, open)} flap={1 - E.out(ramp(g, T_PAPER0, 4))} front={1 - open} op={1 - E.in(ramp(g, T_PAPER0 + 2, T_PAPER1 - T_PAPER0 - 2))} />
    );
  }
  return (
    <g>
      {g < tF + 7 && (
        <g transform={`translate(${pcx} ${pcy}) rotate(${-2.5 * lift * (1 - shrink)}) translate(${-pcx} ${-pcy})`}>
          <rect x={pcx - pw / 2 + 10} y={pcy - ph / 2 + 14 * lift} width={pw} height={ph} rx={18} fill={INK} opacity={0.22 * lift} />
          <rect x={pcx - pw / 2} y={pcy - ph / 2} width={pw} height={ph} rx={18} fill={PAPER} stroke={INK} strokeWidth={7} />
          {[0, 1].map((i) => <rect key={i} x={pcx - pw / 2 + pw * 0.06} y={pcy - ph / 2 + ph * (0.28 + i * 0.28)} width={pw * [0.8, 0.6][i]} height={Math.max(8, ph * 0.09)} rx={6} fill={GREY} />)}
          <AIMark x={pcx + pw / 2 - 40} y={pcy - ph / 2 + 8} s={lerp(1, 0.8, shrink)} rot={8} />
        </g>
      )}
      {g >= tF + 1 && (
        <g>
          <Env3 x={ex} y={ey} s={es} rot={er} flap={flap} clipId="packClip3" front={frontOp} op={envOp}>
            {inEnvelope && (
              <g>
                <rect x={-165} y={-86 + slide * 120 - 40} width={330} height={92} rx={14} fill={PAPER} stroke={INK} strokeWidth={7} />
                {[0, 1].map((i) => <rect key={i} x={-165 + 20} y={-86 + slide * 120 - 40 + 24 + i * 28} width={[260, 190][i]} height={10} rx={5} fill={GREY} />)}
              </g>
            )}
          </Env3>
          <clipPath id="packClip3"><rect x={-700} y={-900} width={1400} height={1040} /></clipPath>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ B2/B3: ONE quote-paper instance. It rises out of the envelope, becomes the quote surface, and later moves to the claim position above the checker. */
export const ClaimCard: React.FC<{g: number}> = ({g}) => {
  if (g < T_PAPER0) return null;
  const exit = E.inOut(ramp(g, EV['b4.start'], 7));
  if (exit >= 1) return null;
  const openK = E.inOut(ramp(g, T_PAPER0, T_PAPER1 - T_PAPER0));
  let r: Rect = rectLerp(POCKET, Q2, openK);
  if (g >= EV['b3.start']) r = rectLerp(Q2, Q3, E.inOut(ramp(g, EV['b3.start'], 10)));
  const reveal = lineReveal(g, T_L1, T_L2);
  const hl = [E.out(ramp(g, EV['b2.hl0'], 6)), E.out(ramp(g, EV['b2.hl0'] + 12, 14))];
  const detail = E.inOut(ramp(g, T_PAPER0 + 3, T_PAPER1 - T_PAPER0 - 2));
  return (
    <g transform={`translate(0 ${-16 * exit})`}>
      <QuotePaper r={r} reveal={reveal} hl={hl} detail={detail} op={1 - exit} />
    </g>
  );
};
void P_START; void P_PRESS; void Q3;

/** Loop return only: the opening headline reveals as ONE group in its frame-0 state (cream-on-ink words as at frame 0), so frame 629 hands over to frame 0 without a pop. */
export const T_LOOP_HEAD = EV['loop.build'] + 14;
export const LoopHeadline: React.FC<{g: number}> = ({g}) => {
  const k = E.out(ramp(g, T_LOOP_HEAD, 10));
  if (k <= 0) return null;
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 18})`}>
      <Headline3 g={0} />
    </g>
  );
};
