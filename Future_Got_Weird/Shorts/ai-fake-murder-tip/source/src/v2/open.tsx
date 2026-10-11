import React from 'react';
import {C, E, tw, sp, SNAP, lerp, clamp01, measure, CAP_FONT, HED_FONT, fitSize, EV, INK, CREAM, PAPER, GREY, CX, WIN, HDR_H, TB1, BTN2, Q2, Q3, P_START, P_PRESS, rectLerp, Rect, Card, PoliceHeader, Cursor2, Button2} from './kit2';

/** window -> evidence-card morph (the message box of the tip window expands into the quoted excerpt) */
export const zoomK = (g: number) => E.inOut(tw(g, EV['b1.zoom'], 10, (x) => x));
/** ink -> cream wipe, grown out of the evidence card on "Except…" */
export const wipeK = (g: number) => E.inOut(tw(g, EV['b3.start'], 10, (x) => x));
export const TRAY_C = {x: 600, y: 1119};   // centre of the empty INVESTIGATORS tray: the closing ink iris grows from here
export const irisK = (g: number) => E.inOut(tw(g, EV['b6.start'], 12, (x) => x));

/** two flat colour fields (no texture): ink, a cream rectangle that grows out of the evidence card, and an ink iris that grows out of the empty tray */
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

/** B1: giant factual headline over the police form; the stamp pops once on "fake" */
export const Headline2: React.FC<{g: number}> = ({g}) => {
  const z = zoomK(g);
  if (z >= 1 || g >= EV['b3.start']) return null;
  const f = EV['b1.fake'];
  const pop = g >= f && g < f + 9 ? Math.sin(((g - f) / 9) * Math.PI) : 0;
  const s2 = fitSize('MURDER TIP', HED_FONT, 650, 160, 800, 2);
  return (
    <g>
      <g transform={`translate(${CX} 345) rotate(${-3 - 1.2 * pop}) scale(${1 + 0.06 * pop})`}>
        <rect x={-246} y={-108} width={492} height={216} rx={20} fill={C.coral} />
        <rect x={-232} y={-94} width={464} height={188} rx={12} fill="none" stroke={CREAM} strokeWidth={5} opacity={0.9} />
        <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={206} letterSpacing={6} fill={CREAM}>FAKE</text>
      </g>
      <text x={CX} y={530} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={s2} letterSpacing={2} fill={CREAM}>MURDER TIP</text>
    </g>
  );
};

/** where the AI pointer is in B1: already travelling at frame 0, contact on "sent" */
const cursorAt = (g: number) => {
  const hit = EV['b1.press'];
  const e0 = E.inOut(clamp01((0 + 7) / (hit + 7)));
  const s0 = {x: (P_START.x - e0 * P_PRESS.x) / (1 - e0), y: (P_START.y - e0 * P_PRESS.y) / (1 - e0)};
  const u = E.inOut(clamp01((g + 7) / (hit + 7)));
  return {x: lerp(s0.x, P_PRESS.x, u), y: lerp(s0.y, P_PRESS.y, u)};
};

/** B1 window: POLICE TIP header, message box (drawn by ClaimCard so it can become the evidence card), SUBMIT -> SENT, AI pointer */
export const TipWindow: React.FC<{g: number}> = ({g}) => {
  const z = zoomK(g);
  if (z >= 1 || g >= EV['b3.start']) return null;
  const hit = EV['b1.press'];
  const press = g < hit ? 0 : g < hit + 3 ? 1 : 1 - E.out(tw(g, hit + 3, 5));
  const sent = g >= EV['b1.sent'];
  const pulseT = EV['b1.police'];
  const pulse = g >= pulseT && g < pulseT + 10 ? E.out((g - pulseT) / 10) : 0;
  const ringT = EV['b1.sent'];
  const ring = g >= ringT && g < ringT + 9 ? (g - ringT) / 9 : 0;
  const c = cursorAt(g);
  return (
    <g>
      <Card r={WIN} />
      <PoliceHeader r={WIN} pulse={pulse} />
      <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
      <Button2 r={BTN2} press={press} sent={sent} />
      {ring > 0 && <rect x={BTN2.x - 14 * ring} y={BTN2.y - 14 * ring} width={BTN2.w + 28 * ring} height={BTN2.h + 28 * ring + 12} rx={34} fill="none" stroke={C.teal} strokeWidth={6} opacity={1 - ring} />}
      <Cursor2 x={c.x} y={c.y} s={1.15} press={g >= hit && g < hit + 5 ? 1 : 0} />
    </g>
  );
};

const LINES = ['“I recall seeing', 'someone matching', 'the description…'];

/** The tip's message box -> the quoted excerpt -> the "claim" card above the comparison. Saffron appears only as the highlight on the claim. */
export const ClaimCard: React.FC<{g: number}> = ({g}) => {
  const z = zoomK(g), w = wipeK(g);
  const exit = E.in(tw(g, EV['b4.start'], 9, (x) => x));
  if (exit >= 1) return null;
  let r: Rect = rectLerp(TB1, Q2, z);
  if (g >= EV['b3.start']) r = rectLerp(Q2, Q3, w);
  const s = g >= EV['b3.start'] ? lerp(1, Q3.w / Q2.w, w) : 1;
  const size = 70 * s;
  const tx = r.x + 46 * s;
  const yc = (i: number) => r.y + (100 + 104 * i) * s;
  const lineIn = (t: number) => E.out(tw(g, t, 4));
  const ts = [EV['b2.line1'], EV['b2.line2'], EV['b2.line3']];
  // highlight geometry
  const off2 = measure('someone ', CAP_FONT, 70) * s, w2 = measure('matching', CAP_FONT, 70) * s;
  const w3 = measure('the description', CAP_FONT, 70) * s;
  const hl2 = E.out(tw(g, EV['b2.hl0'], 6)), hl3 = E.out(tw(g, EV['b2.hl0'] + 12, 14));
  const showCard = g >= 0;
  const greek = 1 - clamp01(z * 2.2);
  const tagOp = clamp01((z - 0.7) * 4);
  return (
    <g transform={`translate(0 ${-exit * 340})`} opacity={1 - exit * 0.4}>
      {showCard && (
        <Card r={r} rad={lerp(20, 30, z)} fill={PAPER} shadow={z > 0 ? 0.2 : 0}>
          {/* greeked message lines of the tip window (fade out as the excerpt arrives) */}
          <g opacity={greek}>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={r.x + 28} y={r.y + 30 + i * 46} width={[600, 520, 560, 330][i]} height={16} rx={8} fill={GREY} />
            ))}
          </g>
          {/* saffron highlight: the only saffron in the film */}
          <g>
            <rect x={tx + off2 - 10 * s} y={yc(1) - 48 * s} width={(w2 + 20 * s) * hl2} height={96 * s} rx={16 * s} fill={C.saffron} />
            <rect x={tx - 10 * s} y={yc(2) - 48 * s} width={(w3 + 20 * s) * hl3} height={96 * s} rx={16 * s} fill={C.saffron} />
          </g>
          {LINES.map((ln, i) => {
            const k = lineIn(ts[i]);
            return (
              <text key={i} x={tx} y={yc(i) + 10 * (1 - k) * s} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={size} fill={INK} opacity={k}>
                {ln}
              </text>
            );
          })}
          <g opacity={tagOp}>
            <rect x={r.x + 30 * s} y={r.y - 24 * s} width={206 * s} height={48 * s} rx={14 * s} fill={C.teal} stroke={INK} strokeWidth={5} />
            <text x={r.x + 133 * s} y={r.y} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={36 * s} letterSpacing={2} fill={CREAM}>AI’S TIP</text>
          </g>
        </Card>
      )}
    </g>
  );
};
/** B1 as one masked group: as the message box expands into the evidence card, the mask closes in on the box and everything else (headline, header, button, pointer) is cropped away. */
export const OpenScene: React.FC<{g: number}> = ({g}) => {
  const z = zoomK(g);
  if (z >= 1 || g >= EV['b3.start']) return null;
  const card = rectLerp(TB1, Q2, z);
  const m = rectLerp({x: 30, y: 190, w: 1020, h: 1140}, card, z);
  return (
    <g>
      <clipPath id="openCrop"><rect x={m.x} y={m.y} width={m.w} height={m.h} rx={lerp(0, 24, z)} /></clipPath>
      <g clipPath="url(#openCrop)">
        <TipWindow g={g} />
        <Headline2 g={g} />
      </g>
    </g>
  );
};
void SNAP; void sp;
