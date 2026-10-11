import React from 'react';
import {C, E, tw, kf, lerp, clamp01, sp, SNAP, mix, PAGE, BTN, P0, PRESS, OY, CAP_FONT, HED_FONT, ZoomCtx, useSw, impact, hop, drift, Hed} from './kit';
import {EV} from './cues';
import {Panel, Cursor, SubmitBtn, Shield, Chrome} from './shapes';

/* ------------------------------------------------------------------ camera, scroll, state tracks (pure functions of the global frame g) */
export const Z2 = 0.6;
export const camA = (g: number) => {
  const t = tw(g, EV['b2.start'], 34, E.inOut) * (1 - tw(g, EV['b2.light'] + 8, 34, E.inOut));
  return {cx: 540, cy: lerp(960, 862, t), z: lerp(1, Z2, t)};
};
/** page scroll in px: 300 = the form framing (case file hidden under the header), 0 = case file visible */
export const scrollA = (g: number) => {
  if (g < EV['b3.lift']) return 300;
  if (g < EV['b3.lift'] + 20) return lerp(300, 0, E.inOut(tw(g, EV['b3.lift'], 20, (x) => x)));
  if (g < EV['b3.react'] + 20) return 0;
  return lerp(0, 300, E.inOut(tw(g, EV['b3.react'] + 20, 20, (x) => x)));
};
const pressAt = (g: number, at: number, hold = 6, rel = 8) => (g < at - 2 ? 0 : g < at ? (g - (at - 2)) / 2 : g < at + hold ? 1 : Math.max(0, 1 - (g - at - hold) / rel));
export const press1 = (g: number) => pressAt(g, EV['b1.press']);
export const press2 = (g: number) => pressAt(g, EV['b4.press']);
/** how much of the typed text has landed in the tip box (0 -> 1) */
export const typedA = (g: number) => (g < EV['b2.start'] + 14 ? 1 : g < EV['b3.type0'] ? 0 : tw(g, EV['b3.type0'], 30, (x) => x)); // the reset happens mid pull-back, out of sight
/** the tip form button reads SENT only right after a press */
export const sentA = (g: number) => (g >= EV['b1.sent'] && g < EV['b2.start'] + 14) || (g >= EV['b4.press'] + 1 && g < EV['b4.fold'] + 6);
export const foldK = (g: number) => E.inOut(tw(g, EV['b4.fold'], 14, (x) => x));

/* ------------------------------------------------------------------ the tip page */
const SC0 = 300; // content coordinates are authored for scroll = 300

const TextBars: React.FC<{x: number; y: number; w: number; n: number; p: number}> = ({x, y, w, n, p}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const ww = (w - (i === n - 1 ? 190 : i === 1 ? 60 : 0)) * clamp01(p * n - i);
      return ww > 2 ? <rect key={i} x={x} y={y + i * 44} width={ww} height={20} rx={10} fill={C.inkMuted} opacity={0.55} /> : null;
    })}
  </g>
);

export const PageP: React.FC<{g: number; headerOn: number; scroll: number; typed: number; press: number; sent: boolean; ring: number; outlineP: number; tagP: number; hot: number; hideBtn?: boolean}> = ({g, headerOn, scroll, typed, press, sent, ring, outlineP, tagP, hot, hideBtn = false}) => {
  const sw = useSw();
  const {x, y, w, h, hdr, r} = PAGE;
  const dy = SC0 - scroll + OY;
  const field = {x: 150, y: 590, w: 660, h: 84};
  const op = outlineP;
  const pulse = 1 + 0.05 * Math.sin(clamp01((g - EV['b3.tap']) / 10) * Math.PI) * (op > 0 ? 1 : 0);
  return (
    <g>
      <clipPath id="pageClip"><rect x={x} y={y + hdr - 2} width={w} height={h - hdr + 2} rx={r} /></clipPath>
      <Panel x={x} y={y} w={w} h={h} r={r} fill={C.white} />
      {/* content */}
      <g clipPath="url(#pageClip)">
        <g transform={`translate(0 ${dy})`}>
          {/* case file (above the form) */}
          <text x={150} y={466} fontFamily={HED_FONT} fontWeight={800} fontSize={44} letterSpacing={3} fill={C.inkSoft}>CASE FILE</text>
          <rect x={150} y={486} width={520} height={16} rx={8} fill={C.paperLine} />
          <rect x={150} y={514} width={380} height={16} rx={8} fill={C.paperLine} />
          <text x={150} y={566} fontFamily={CAP_FONT} fontWeight={800} fontSize={26} letterSpacing={1} fill={C.inkSoft}>SUSPECT DESCRIPTION</text>
          <rect x={field.x} y={field.y} width={field.w} height={field.h} rx={16} fill="#FFFDF5" stroke={C.inkMuted} strokeWidth={4} strokeDasharray="14 10" />
          {/* the form */}
          <text x={150} y={742} fontFamily={CAP_FONT} fontWeight={800} fontSize={28} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
          <rect x={150} y={760} width={660} height={230} rx={18} fill={C.cream} stroke={C.ink} strokeWidth={5} />
          <TextBars x={180} y={796} w={600} n={4} p={typed} />
          <text x={150} y={1040} fontFamily={CAP_FONT} fontWeight={800} fontSize={26} letterSpacing={1} fill={C.inkSoft}>NAME (OPTIONAL)</text>
          <rect x={150} y={1056} width={360} height={58} rx={14} fill="#FFFDF5" stroke={C.inkMuted} strokeWidth={4} strokeDasharray="14 10" />
          {!hideBtn && <SubmitBtn x={BTN.x} y={BTN.y - OY} w={BTN.w} h={BTN.h} press={press} sent={sent} hot={hot} />}
          {/* the mismatch: a coral outline around the empty field, then a tag */}
          {op > 0 && (
            <g transform={`translate(${field.x + field.w / 2} ${field.y + field.h / 2}) scale(${pulse})`} opacity={clamp01(op * 3)}>
              <rect x={-field.w / 2 - 9} y={-field.h / 2 - 9} width={field.w + 18} height={field.h + 18} rx={22} fill="none" stroke={C.coral} strokeWidth={sw(10)} strokeDasharray="30 16" strokeLinecap="round" />
            </g>
          )}
        </g>
      </g>
      {/* sticky header */}
      <path d={`M ${x} ${y + hdr} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + hdr} Z`} fill={headerOn > 0.5 ? C.blue : C.paperDeep} stroke={C.ink} strokeWidth={sw(6)} strokeLinejoin="round" />
      {headerOn > 0.5 ? (
        <g transform={`translate(${x + 78} ${y + hdr / 2 + 2}) scale(${1 + ring * 0.15})`}>
          <Shield x={0} y={0} s={0.78} />
          <text x={74} y={0} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={86} letterSpacing={3} fill={C.cream} stroke={C.ink} strokeWidth={1}>POLICE TIP</text>
        </g>
      ) : (
        <g>
          <circle cx={x + 76} cy={y + hdr / 2} r={26} fill={C.paperLine} />
          <rect x={x + 130} y={y + hdr / 2 - 14} width={300} height={28} rx={14} fill={C.paperLine} />
        </g>
      )}
      {/* EMPTY tag on the outline */}
      {tagP > 0 && (
        <g transform={`translate(${field.x + field.w - 104} ${field.y + dy - 20}) scale(${0.6 + 0.4 * E.back(tagP)})`} opacity={clamp01(tagP * 3)}>
          <rect x={-86} y={-30} width={172} height={60} rx={14} fill={C.coral} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={3} fill={C.cream} stroke={C.ink} strokeWidth={0.8}>EMPTY</text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ evaluation cards and the test marker */
const CARD = {w: 500, h: 600};
export const C1 = {x: 90, y: 220};
export const C2 = {x: 823, y: 187};
const P_C = {x: PAGE.x + PAGE.w / 2, y: PAGE.y + PAGE.h / 2};

const CardFrame: React.FC<{cx: number; cy: number; pop: number; hot?: number; children: React.ReactNode}> = ({cx, cy, pop, hot = 0, children}) => {
  const sw = useSw();
  const x = -CARD.w / 2, y = -CARD.h / 2;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${0.7 + 0.3 * E.back(pop)})`} opacity={clamp01(pop * 2.5)}>
      <Panel x={x} y={y} w={CARD.w} h={CARD.h} r={30} sdx={14} sdy={18}>
        {hot > 0 && <rect x={x - 12} y={y - 12} width={CARD.w + 24} height={CARD.h + 24} rx={40} fill="none" stroke={C.saffron} strokeWidth={sw(12)} opacity={hot} />}
        <Chrome x={x} y={y} w={CARD.w} h={74} r={30} />
        {children}
      </Panel>
    </g>
  );
};

const RecipeCard: React.FC<{cx: number; cy: number; pop: number; hot: number}> = ({cx, cy, pop, hot}) => {
  const x = -CARD.w / 2, y = -CARD.h / 2;
  return (
    <CardFrame cx={cx} cy={cy} pop={pop} hot={hot}>
      <rect x={x + 30} y={y + 104} width={CARD.w - 60} height={230} rx={22} fill={C.saffronLight} stroke={C.ink} strokeWidth={5} />
      <ellipse cx={0} cy={y + 244} rx={120} ry={34} fill={C.white} stroke={C.ink} strokeWidth={5} />
      <path d={`M -120 ${y + 244} Q 0 ${y + 400} 120 ${y + 244} Z`} fill={C.coral} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M -34 ${y + 190} q 14 -26 0 -50 M 30 ${y + 190} q 14 -26 0 -50`} fill="none" stroke={C.inkMuted} strokeWidth={6} strokeLinecap="round" />
      <rect x={x + 30} y={y + 366} width={300} height={22} rx={11} fill={C.inkMuted} opacity={0.45} />
      <rect x={x + 30} y={y + 408} width={420} height={18} rx={9} fill={C.paperLine} />
      <rect x={x + 30} y={y + 440} width={380} height={18} rx={9} fill={C.paperLine} />
      <rect x={x + 30} y={y + 472} width={250} height={18} rx={9} fill={C.paperLine} />
    </CardFrame>
  );
};

const ShopCard: React.FC<{cx: number; cy: number; pop: number; hot: number}> = ({cx, cy, pop, hot}) => {
  const x = -CARD.w / 2, y = -CARD.h / 2;
  const tiles = [C.tealLight, C.coralLight, C.blueLight, C.saffronLight];
  return (
    <CardFrame cx={cx} cy={cy} pop={pop} hot={hot}>
      {tiles.map((c, i) => {
        const tx = x + 30 + (i % 2) * 220, ty = y + 104 + Math.floor(i / 2) * 250;
        return (
          <g key={i}>
            <rect x={tx} y={ty} width={200} height={170} rx={20} fill={c} stroke={C.ink} strokeWidth={5} />
            <circle cx={tx + 100} cy={ty + 80} r={34} fill={C.white} stroke={C.ink} strokeWidth={5} />
            <rect x={tx + 20} y={ty + 128} width={90} height={18} rx={9} fill={C.ink} opacity={0.35} />
            <rect x={tx + 20} y={ty + 178} width={120} height={16} rx={8} fill={C.paperLine} />
            <rect x={tx + 150} y={ty + 174} width={46} height={26} rx={13} fill={C.coral} stroke={C.ink} strokeWidth={4} />
          </g>
        );
      })}
    </CardFrame>
  );
};

const Marker: React.FC<{x: number; y: number; s: number; sq: [number, number]}> = ({x, y, s, sq}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={34} ry={10} fill={C.ink} opacity={0.22} />
    <g transform={`scale(${sq[0]} ${sq[1]})`}>
      <path d="M 0 0 L 0 -62" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <rect x={-92} y={-166} width={184} height={92} rx={20} fill={C.teal} stroke={C.ink} strokeWidth={7} />
      <text x={0} y={-120} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={70} letterSpacing={3} fill={C.cream} stroke={C.ink} strokeWidth={1.2}>TEST</text>
    </g>
  </g>
);

/** stops of the task path in world coordinates: (start above C1) -> C1 -> C2 -> the police page */
const STOPS = [{x: C1.x - 120, y: C1.y - 260}, {x: C1.x, y: C1.y + 40}, {x: C2.x, y: C2.y + 40}, {x: P_C.x, y: P_C.y - 140}];

export const EvalWorld: React.FC<{g: number}> = ({g}) => {
  const sw = useSw();
  const t0 = EV['b2.start'];
  const popC1 = sp(g, t0 + 6, SNAP, 20), popC2 = sp(g, t0 + 12, SNAP, 20);
  const exit = 1 - E.in(tw(g, 224, 12, (x) => x)); // cards leave before the push back into the page
  const hops = [EV['b2.hop1'], EV['b2.hop2'], EV['b2.hop3']];
  // marker position along stops with parabolic hops
  let mx = STOPS[0].x, my = STOPS[0].y, mscale = 1, sq: [number, number] = [1, 1];
  if (g >= t0 + 6) {
    let seg = -1;
    for (let i = 0; i < hops.length; i++) if (g >= hops[i] - 12) seg = i;
    const i = Math.max(0, seg);
    const from = STOPS[i], to = STOPS[i + 1];
    const u = clamp01((g - (hops[i] - 12)) / 12);
    const e = E.inOut(u);
    mx = lerp(from.x, to.x, e);
    my = lerp(from.y, to.y, e) - 120 * Math.sin(u * Math.PI);
    sq = u >= 1 ? impact(g, hops[i], 0.16, 9) : [1, 1];
  }
  const dash = (a: {x: number; y: number}, b: {x: number; y: number}, p: number) => {
    const mxp = (a.x + b.x) / 2 + (b.y - a.y) * 0.18, myp = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;
    return <path d={`M ${a.x} ${a.y} Q ${mxp} ${myp} ${b.x} ${b.y}`} fill="none" stroke={C.ink} strokeWidth={sw(7)} strokeDasharray="26 22" strokeLinecap="round" pathLength={1} strokeDashoffset={0} opacity={0.75 * clamp01(p * 2)} />;
  };
  const lit = tw(g, EV['b2.light'], 8, E.out) * (1 - tw(g, 224, 10, (x) => x));
  return (
    <g opacity={exit}>
      {dash({x: C1.x, y: C1.y + 40}, {x: C2.x, y: C2.y + 40}, tw(g, hops[0], 20))}
      {dash({x: C2.x, y: C2.y + 40}, {x: P_C.x, y: P_C.y - 140}, tw(g, hops[1], 20))}
      <RecipeCard cx={C1.x} cy={C1.y} pop={popC1} hot={0} />
      <ShopCard cx={C2.x} cy={C2.y} pop={popC2} hot={0} />
      {/* the police page glows when the marker settles on it */}
      {lit > 0 && <rect x={PAGE.x - 14} y={PAGE.y - 14} width={PAGE.w + 28} height={PAGE.h + 28} rx={44} fill="none" stroke={C.saffron} strokeWidth={sw(14)} opacity={lit} />}
      {g >= t0 + 6 && <Marker x={mx} y={my} s={1} sq={sq} />}
    </g>
  );
};

/* ------------------------------------------------------------------ the world (opener, pull-back, page) */
export const cursorA = (g: number) => {
  // opening: moving toward SUBMIT from the rest pose, pressing on "submitted"
  const t = E.inOut(tw(g, 0, EV['b1.press'] - 1, (x) => x));
  const arc = -34 * Math.sin(t * Math.PI);
  let x = lerp(P0.x, PRESS.x, t), y = lerp(P0.y, PRESS.y, t) + arc, op = 1, s = 1;
  if (g >= EV['b2.start'] - 14 && g < EV['b2.start']) op = 1 - tw(g, EV['b2.start'] - 14, 12, E.in);
  if (g >= EV['b2.start']) op = 0;
  // consequence: same route, same press
  if (g >= EV['b4.start'] + 2) {
    const u = E.inOut(tw(g, EV['b4.start'] + 6, EV['b4.press'] - EV['b4.start'] - 8, (v) => v));
    x = lerp(P0.x, PRESS.x, u);
    y = lerp(P0.y, PRESS.y, u) - 34 * Math.sin(u * Math.PI);
    op = sp(g, EV['b4.start'] + 2, SNAP, 14);
    s = 0.6 + 0.4 * op;
    if (g >= EV['b4.fold'] + 4) op = 1 - tw(g, EV['b4.fold'] + 4, 8, E.in);
  }
  return {x, y, op, s};
};

export const WorldA: React.FC<{g: number}> = ({g}) => {
  const cam = camA(g);
  const scroll = scrollA(g);
  const fk = foldK(g);
  const cur = cursorA(g);
  const ringHdr = g >= EV['b1.real'] ? Math.sin(clamp01((g - EV['b1.real']) / 12) * Math.PI) : 0;
  const hot = Math.max(0, 1 - Math.abs(g - EV['b4.press']) / 8) + Math.max(0, 1 - Math.abs(g - EV['b1.press']) / 8);
  const tap = EV['b3.tap'];
  const gone = 1 - tw(g, EV['b3.react'] + 18, 6, (x) => x); // the mismatch marks clear as the page scrolls back to the button
  const outlineP = clamp01((g - tap) / 5) * gone;
  const tagP = clamp01((g - tap - 8) / 10) * gone;
  // fold: the page shrinks toward the envelope's shape
  const sx = lerp(1, 300 / PAGE.w, fk), sy = lerp(1, 210 / PAGE.h, fk);
  const pageOp = 1 - E.in(tw(fk, 0.5, 0.5, (x) => x));
  const shake = g >= tap && g < tap + 8 ? Math.sin((g - tap) * 2.4) * 5 * (1 - (g - tap) / 8) : 0;
  return (
    <ZoomCtx.Provider value={cam.z}>
      <g transform={`translate(540 960) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
        <EvalWorld g={g} />
        {g < EV['b4.fold'] + 16 && (
          <g opacity={pageOp} transform={`translate(${P_C.x + shake} ${P_C.y}) rotate(${-5 * fk}) scale(${sx} ${sy}) translate(${-P_C.x} ${-P_C.y})`}>
            <PageP
              g={g}
              headerOn={g >= EV['b1.real'] ? 1 : 0}
              scroll={scroll}
              typed={typedA(g)}
              press={g >= EV['b4.start'] ? press2(g) : press1(g)}
              sent={sentA(g)}
              ring={ringHdr}
              outlineP={outlineP}
              tagP={tagP}
              hot={hot}
            />
          </g>
        )}
        {cur.op > 0 && <Cursor x={cur.x} y={cur.y + (g >= EV['b1.press'] && g < EV['b1.press'] + 8 ? 3 : 0)} s={cur.s} press={g < EV['b2.start'] ? press1(g) : press2(g)} op={cur.op} />}
      </g>
      {g >= EV['b2.start'] + 20 && g < 242 && (() => {
        const inn = E.out(tw(g, EV['b2.start'] + 20, 10, (x) => x));
        const out = E.in(tw(g, 222, 12, (x) => x));
        return <Hed x={485} y={276} text="EVALUATION" size={140} color={C.cream} outline={C.ink} shadow={C.coral} ls={6} opacity={clamp01(inn * 3) * (1 - out)} sy={0.8 + 0.2 * inn} />;
      })()}
    </ZoomCtx.Provider>
  );
};
void kf; void mix; void hop; void drift;
