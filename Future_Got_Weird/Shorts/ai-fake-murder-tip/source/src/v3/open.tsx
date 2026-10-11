import React from 'react';
import {C, E, tw, lerp, clamp01, measure, CAP_FONT, HED_FONT, fitSize, mix, EV, INK, CREAM, PAPER, GREY, WIN, HDR_H, TB1, BTN2, Q2, Q3, P_START, P_PRESS, rectLerp, Rect, Card, PoliceHeader, Cursor2, Button2, AIMark, Env3} from './kit3';
import {ITRAY} from './flow';

/** ink -> cream wipe, grown out of the quote paper on "Except…"; ink iris grown out of the empty tray at the takeaway */
export const wipeK = (g: number) => E.inOut(tw(g, EV['b3.start'], 10, (x) => x));
export const TRAY_C = {x: ITRAY.x + ITRAY.w / 2, y: ITRAY.y + ITRAY.h / 2};
export const irisK = (g: number) => E.inOut(tw(g, EV['b6.start'], 12, (x) => x));

export const Backdrop: React.FC<{g: number}> = ({g}) => {
  const w = wipeK(g), i = irisK(g);
  const cr = rectLerp(Q2, {x: -20, y: -20, w: 1120, h: 1960}, w);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={INK} />
      {w > 0 && <rect x={cr.x} y={cr.y} width={cr.w} height={cr.h} rx={lerp(34, 0, w)} fill={CREAM} />}
      {i > 0 && <circle cx={TRAY_C.x} cy={TRAY_C.y} r={i * 2300} fill={INK} />}
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
  const clear = E.in(tw(g, EV['o.clear'], 9, (x) => x));
  if (clear >= 1) return null;
  const size = Math.min(118, fitSize('AI SENT POLICE', HED_FONT, 770, 120, 800, 2));
  const lh = size * 1.03;
  const y0 = 262 + size * 0.42;
  return (
    <g opacity={1 - clear} transform={`translate(0 ${-clear * 70})`}>
      {LINES.map((ln, li) => {
        let x = HL_X;
        const space = measure(' ', HED_FONT, size, 800, 2);
        return ln.words.map((w, wi) => {
          const idx = ln.idx[wi];
          const t = EV[WORD_EV[idx]];
          const k = E.out(tw(g, t - 1, 4, (v) => v));        // 0 = not yet spoken, 1 = spoken
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
  if (g < hit - 3) { const u = E.out(tw(g, hit - 7, 4, (v) => v)); return {x: P_START.x - 22 * u, y: P_START.y - 16 * u}; }       // anticipation: a small pull-back
  const u = E.in(tw(g, hit - 3, 3, (v) => v));                                                                              // strike
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
  const press = g < hit ? 0 : g < hit + 3 ? 1 : 1 - E.out(tw(g, hit + 3, 5));
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

/** B1 as one masked group; the mask closes onto the opening packet as the headline clears, so nothing else is on screen when the paper opens. */
export const OpenScene: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['o.clear'] - 2, t1 = EV['b2.paper'] + 2;
  if (g >= t1) return null;
  const k = E.inOut(tw(g, t0, 8, (x) => x));
  const m = rectLerp({x: 0, y: 190, w: 1080, h: 1290}, {x: Q2.x, y: Q2.y, w: Q2.w, h: Q2.h}, k);
  return (
    <g>
      <clipPath id="openCrop3"><rect x={m.x} y={m.y} width={m.w} height={m.h} rx={lerp(0, 30, k)} /></clipPath>
      <g clipPath="url(#openCrop3)">
        <TipWindow g={g} />
        <Headline3 g={g} />
      </g>
    </g>
  );
};

/** The submitted tip: a copy lifts off the form, folds into an AI-marked envelope, travels, and opens toward camera into the quote paper. */
export const Packet3: React.FC<{g: number}> = ({g}) => {
  const tL = EV['o.lift'], tF = EV['o.fold'], tE = EV['o.env'], tT = EV['o.travel'], tO = EV['o.open'], tP = EV['b2.paper'];
  if (g < tL - 1 || g >= tP + 1) return null;
  const E0 = {x: 486, y: 934}, E1 = {x: 486, y: 744};
  const lift = E.out(tw(g, tL, 6, (x) => x));
  const shrink = E.inOut(tw(g, tF, 8, (x) => x));
  const slide = E.inOut(tw(g, tF + 7, 5, (x) => x));
  const flap = g < EV['o.fold'] + 11 ? 0 : E.out(tw(g, EV['o.fold'] + 11, 5, (x) => x));
  const envOp = E.out(tw(g, tF + 1, 4, (x) => x));
  const frontOp = E.out(tw(g, tF + 7, 3, (x) => x));
  const trav = E.inOut(tw(g, tT, tO - tT - 4, (x) => x));
  const open = E.inOut(tw(g, tO, tP - tO, (x) => x));
  // envelope centre / scale
  const ex = lerp(E0.x, E1.x, trav) + 46 * Math.sin(trav * Math.PI), ey = lerp(E0.y, E1.y, trav) - 18 * Math.sin(trav * Math.PI);
  const es = lerp(0.82, 0.92, trav);
  const er = -5 * Math.sin(trav * Math.PI);
  // paper: starts as the tip box copy, shrinks into the envelope pocket
  const pw = lerp(TB1.w, 330, shrink), ph = lerp(TB1.h, 92, shrink);
  const pcx = lerp(TB1.x + TB1.w / 2, E0.x, shrink), pcy = lerp(TB1.y + TB1.h / 2 - 30 * lift, E0.y - 8, shrink) + slide * 120;
  const inEnvelope = g >= tF + 7 && g < tO;
  if (g >= tO) {
    // the envelope opens toward camera: flap up, the paper rises out of it and grows into the quote paper
    const envY = E1.y + open * 150, envS = lerp(0.92, 1.35, open);
    const r = rectLerp({x: E1.x - 165, y: E1.y - 40, w: 330, h: 92}, Q2, open);
    return (
      <g>
        <Env3 x={E1.x} y={envY} s={envS} flap={1 - E.out(tw(g, tO, 4, (x) => x))} front={1 - open} op={1 - E.in(tw(g, tO + 4, tP - tO - 4, (x) => x))} />
        <Card r={r} rad={lerp(14, 30, open)} sw={7} shadow={0.2}>
          {[0, 1].map((i) => <rect key={i} x={r.x + r.w * 0.06} y={r.y + r.h * (0.3 + i * 0.22)} width={r.w * [0.8, 0.6][i]} height={Math.max(8, r.h * 0.07)} rx={6} fill={GREY} opacity={1 - open} />)}
        </Card>
        <AIMark x={r.x + r.w - 54} y={r.y + 6} s={lerp(0.9, 1.3, open)} rot={8} />
      </g>
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

/* ------------------------------------------------------------------ B2: the opened paper is the quote surface; two phrase groups, one highlight */
const QLINES = ['“I recall seeing', 'someone matching', 'the description…'];
export const ClaimCard: React.FC<{g: number}> = ({g}) => {
  const w = wipeK(g);
  const exit = E.in(tw(g, EV['b4.start'], 9, (x) => x));
  if (g < EV['b2.paper'] || exit >= 1) return null;
  const r: Rect = g >= EV['b3.start'] ? rectLerp(Q2, Q3, w) : Q2;
  const s = g >= EV['b3.start'] ? lerp(1, Q3.w / Q2.w, w) : 1;
  const size = 70 * s;
  const tx = r.x + 52 * s;
  const yc = (i: number) => r.y + (112 + 106 * i) * s;
  const inK = (t: number) => E.out(tw(g, t, 4));
  const k1 = inK(EV['b2.line1']), k2 = inK(EV['b2.group2']);
  const ks = [k1, k2, k2];
  const off2 = measure('someone ', CAP_FONT, 70) * s, w2 = measure('matching', CAP_FONT, 70) * s, w3 = measure('the description', CAP_FONT, 70) * s;
  const hl2 = E.out(tw(g, EV['b2.hl0'], 6)), hl3 = E.out(tw(g, EV['b2.hl0'] + 12, 14));
  return (
    <g transform={`translate(0 ${-exit * 340})`} opacity={1 - exit * 0.4}>
      <Card r={r} rad={30} fill={PAPER}>
        <g>
          <rect x={tx + off2 - 10 * s} y={yc(1) - 50 * s} width={(w2 + 20 * s) * hl2} height={100 * s} rx={16 * s} fill={C.saffron} />
          <rect x={tx - 10 * s} y={yc(2) - 50 * s} width={(w3 + 20 * s) * hl3} height={100 * s} rx={16 * s} fill={C.saffron} />
        </g>
        {QLINES.map((ln, i) => (
          <text key={i} x={tx} y={yc(i) + 10 * (1 - ks[i]) * s} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={size} fill={INK} opacity={ks[i]}>{ln}</text>
        ))}
        <rect x={r.x + 36 * s} y={r.y - 26 * s} width={196 * s} height={52 * s} rx={14 * s} fill={CREAM} stroke={INK} strokeWidth={5} />
        <text x={r.x + 134 * s} y={r.y} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={38 * s} letterSpacing={3} fill={INK}>EXCERPT</text>
      </Card>
      <AIMark x={r.x + r.w - 56 * s} y={r.y + 8 * s} s={1.3 * s} rot={8} />
    </g>
  );
};
void P_START; void P_PRESS;

/** Loop return only: the opening headline builds back in its frame-0 state over the last frames, so frame 629 hands over to frame 0 without a pop. */
export const LoopHeadline: React.FC<{g: number}> = ({g}) => {
  const k = E.out(tw(g, EV['loop.build'] + 16, 10, (x) => x));
  if (k <= 0) return null;
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 36})`}>
      <Headline3 g={0} />
    </g>
  );
};
