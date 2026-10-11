import React from 'react';
import {C, E, tw, sp, SNAP, SOFT, lerp, clamp01, measure, HED_FONT, CAP_FONT, EV, INK, CREAM, PAPER, GREY, CX, WIN, HDR_H, TB1, BTN2, Rect, Card, PoliceHeader, Button2, Cursor2, Shield, DEEP, Env3, ramp, T_INK, BG_FRAMES} from './kit3';
import {STRIP, STRIP_PITCH, stripScroll} from './inspect';

/* ============================================================================================ B4: test context -> the real form. Three large pages pass under the AI pointer. */
export const FORM4: Rect = {x: 96, y: 520, w: 780, h: 600};
export const ENV0 = {x: CX, y: FORM4.y + FORM4.h / 2};

/** The tip window as sent (the same asset as the opening window): header, message box, SENT. Drawn in WIN coordinates; callers place and scale it. */
export const FormBody: React.FC = () => (
  <g>
    <Card r={WIN} />
    <PoliceHeader r={WIN} h={HDR_H} />
    <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
    <rect x={TB1.x} y={TB1.y} width={TB1.w} height={TB1.h} rx={20} fill={PAPER} stroke={INK} strokeWidth={7} />
    {[0, 1].map((i) => <rect key={i} x={TB1.x + 30} y={TB1.y + 40 + i * 56} width={[560, 420][i]} height={18} rx={9} fill={GREY} />)}
    <Button2 r={BTN2} sent press={1} />
  </g>
);

const growK = (g: number) => E.inOut(tw(g, EV['b4.grow'], 11, (x) => x));

const PageProp: React.FC<{r: Rect; kind: 'a' | 'b'}> = ({r, kind}) => (
  <g>
    <rect x={r.x + 8} y={r.y + 12} width={r.w} height={r.h} rx={26} fill={INK} opacity={0.2} />
    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={26} fill={PAPER} stroke={INK} strokeWidth={7} />
    <path d={`M ${r.x} ${r.y + 58} L ${r.x} ${r.y + 26} Q ${r.x} ${r.y} ${r.x + 26} ${r.y} L ${r.x + r.w - 26} ${r.y} Q ${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + 26} L ${r.x + r.w} ${r.y + 58} Z`} fill={DEEP} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[C.coral, CREAM, C.teal].map((c, i) => <circle key={i} cx={r.x + 36 + i * 30} cy={r.y + 29} r={10} fill={c} stroke={INK} strokeWidth={3} />)}
    {kind === 'a' ? (
      <g>
        <rect x={r.x + 30} y={r.y + 88} width={r.w - 60} height={210} rx={18} fill={C.tealLight} stroke={INK} strokeWidth={5} />
        <circle cx={r.x + r.w / 2} cy={r.y + 193} r={50} fill={C.teal} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={r.x + 30} y={r.y + 332 + i * 46} width={[330, 270, 300, 200][i]} height={18} rx={9} fill={GREY} />)}
      </g>
    ) : (
      <g>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={r.x + 30 + (i % 2) * 232} y={r.y + 88 + Math.floor(i / 2) * 150} width={218} height={136} rx={18} fill={[C.coral, C.tealLight, INK, C.teal][i]} stroke={INK} strokeWidth={5} opacity={i === 2 ? 0.85 : 1} />
        ))}
        {[0, 1, 2].map((i) => <rect key={i} x={r.x + 30} y={r.y + 400 + i * 46} width={[330, 250, 180][i]} height={18} rx={9} fill={GREY} />)}
      </g>
    )}
  </g>
);

const pill = (text: string, size: number, padX = 30) => measure(text, HED_FONT, size, 800, 2) + padX * 2;

export const Test4: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b4.start'];
  if (g < t0 || g >= EV['b5.fold'] + 20) return null;
  const chipOut = E.inOut(ramp(g, EV['b5.fold'] - 8, 6));        // the old badges retire in an orderly 6-frame exit BEFORE the fold and before the inbox header arrives
  const c1 = E.out(tw(g, EV['b4.chip1'], 8, (x) => x)), c2 = E.out(tw(g, EV['b4.chip2'], 8, (x) => x));
  const w1 = pill('CLAUDE HAIKU 4.5', 44), w2 = pill('WEBSITE TEST', 44);
  const CHY = 300, CHH = 76;
  const scroll = stripScroll(g);
  const grow = growK(g);
  const cardX = (i: number) => STRIP.x + (i - scroll) * STRIP_PITCH;
  const real = sp(g, EV['b4.real'], SNAP, 16);
  const showReal = g >= EV['b4.real'];
  // the police form is the third prop; it grows into the full form
  const fs = lerp(STRIP.w / WIN.w, 1, grow);
  const fx = lerp(cardX(2), FORM4.x, grow), fy = lerp(STRIP.y + (STRIP.h - 600 * (STRIP.w / WIN.w)) / 2, FORM4.y, grow);
  const formVisible = g >= EV['b4.pageC'] - 12 && g < EV['b5.fold'];
  const landed = (t: number) => (g >= t && g < t + 10 ? (g - t) / 10 : 0);
  const rings = [EV['b4.pageA'] + 12, EV['b4.pageB'] + 10, EV['b4.reach']].map(landed);
  const curOp = clamp01(c1 * 3) * (1 - E.in(tw(g, EV['b4.grow'] + 4, 6, (x) => x)));
  const cp = {x: 560, y: 790};
  return (
    <g>
      {/* model + test chips: legible, subordinate */}
      <g transform={`translate(0 ${-chipOut * 26})`} opacity={1 - chipOut}>
        <g transform={`translate(${-(1 - c1) * 220} 0)`} opacity={c1}>
          <rect x={96} y={CHY} width={w1} height={CHH} rx={38} fill={C.saffron} stroke={INK} strokeWidth={6} />
          <text x={96 + w1 / 2} y={CHY + CHH / 2 + 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={44} letterSpacing={2} fill={INK}>CLAUDE HAIKU 4.5</text>
        </g>
        <g transform={`translate(${(1 - c2) * 220} 0)`} opacity={c2}>
          <rect x={876 - w2} y={CHY} width={w2} height={CHH} rx={38} fill={INK} />
          <text x={876 - w2 / 2} y={CHY + CHH / 2 + 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={44} letterSpacing={2} fill={CREAM}>WEBSITE TEST</text>
        </g>
      </g>
      {/* the strip: pages pass through a slot the width of the safe column */}
      <clipPath id="strip3"><rect x={96} y={440} width={780} height={720} /></clipPath>
      <clipPath id="strip3Full"><rect x={86} y={200} width={800} height={1250} /></clipPath>
      <g clipPath={grow > 0.98 ? 'url(#strip3Full)' : 'url(#strip3)'}>
        {scroll < 1.97 && <PageProp r={{...STRIP, x: cardX(0)}} kind="a" />}
        {scroll < 1.97 && <PageProp r={{...STRIP, x: cardX(1)}} kind="b" />}
        {formVisible && (
          <g transform={`translate(${fx} ${fy}) scale(${fs}) translate(${-WIN.x} ${-WIN.y})`}>
            <FormBody />
          </g>
        )}
      </g>
      {rings.map((k, i) => k > 0 && g < EV['b4.grow'] + 2 && (
        <rect key={i} x={STRIP.x - 14 * k} y={STRIP.y - 14 * k} width={STRIP.w + 28 * k} height={STRIP.h + 28 * k} rx={32} fill="none" stroke={C.teal} strokeWidth={7} opacity={(1 - k) * 0.9} />
      ))}
      {showReal && chipOut < 1 && (
        <g opacity={1 - chipOut} transform={`translate(96 ${452}) scale(${lerp(0.7, 1, real)})`}>
          <g opacity={clamp01(real * 3)}>
            <rect x={0} y={-34} width={measure('REAL POLICE FORM', HED_FONT, 46, 800, 2) + 40} height={68} rx={34} fill={DEEP} stroke={INK} strokeWidth={5} />
            <text x={20} y={2} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={46} letterSpacing={2} fill={C.coralDeep}>REAL</text>
            <text x={20 + measure('REAL ', HED_FONT, 46, 800, 2)} y={2} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={46} letterSpacing={2} fill={INK}>POLICE FORM</text>
          </g>
        </g>
      )}
      <Cursor2 x={cp.x} y={cp.y} s={1.3} press={rings.some((k) => k > 0 && k < 0.4) ? 1 : 0} op={curOp} />
    </g>
  );
};

/* ============================================================================================ B5: the actual outcome: the same envelope into SPAM; the investigator tray stays empty */
export const FOLDER: Rect = {x: 206, y: 590, w: 664, h: 390};
export const INBOX: Rect = {x: 96, y: 280, w: 420, h: 112};
export const ITRAY: Rect = {x: 206, y: 1040, w: 664, h: 116};
const MOUTH = {x: 312, y: 528};
const FOLD_MOUTH = {x: 540, y: 846};

const bez = (a: {x: number; y: number}, c: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

export const envAt = (g: number) => {
  const go = EV['b5.go'], arr = EV['b5.inbox'], div = EV['b5.divert'], land = EV['b5.land'];
  if (g < go) return {x: ENV0.x, y: ENV0.y, s: 1, rot: 0};
  if (g < arr) {
    const t = E.inOut(tw(g, go, arr - go, (x) => x));
    const p = bez(ENV0, {x: 230, y: 760}, MOUTH, t);
    return {...p, s: lerp(1, 0.9, t), rot: lerp(0, -8, t)};
  }
  if (g < div) return {x: MOUTH.x, y: MOUTH.y + 2 * Math.sin(((g - arr) / (div - arr)) * Math.PI * 2), s: 0.9, rot: -8};
  const t = E.in(tw(g, div, land - div, (x) => x));
  const p = bez(MOUTH, {x: 620, y: 330}, FOLD_MOUTH, t);
  return {...p, s: lerp(0.9, 0.85, t), rot: lerp(-8, 22, t)};
};

const FolderV3: React.FC<{r: Rect; inside: React.ReactNode; label: number; latch: number; squash: [number, number]}> = ({r, inside, label, latch, squash}) => {
  const frontTop = r.y + r.h * 0.3;
  return (
    <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h}) scale(${squash[0]} ${squash[1]}) translate(${-(r.x + r.w / 2)} ${-(r.y + r.h)})`}>
      <rect x={r.x + 12} y={r.y + 18} width={r.w} height={r.h} rx={26} fill={INK} opacity={0.2} />
      <path d={`M ${r.x} ${r.y + 40} Q ${r.x} ${r.y} ${r.x + 36} ${r.y} L ${r.x + r.w * 0.34} ${r.y} L ${r.x + r.w * 0.34 + 44} ${r.y + 40} Z`} fill={C.coralDeep} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={r.x} y={r.y + 36} width={r.w} height={r.h - 36} rx={26} fill={C.coralDeep} stroke={INK} strokeWidth={7} />
      {inside}
      <rect x={r.x} y={frontTop} width={r.w} height={r.y + r.h - frontTop} rx={26} fill={C.coral} stroke={INK} strokeWidth={7} />
      <rect x={r.x + 20} y={frontTop + 14} width={r.w - 40} height={12} rx={6} fill={CREAM} opacity={0.35} />
      {label > 0 && (
        <g transform={`translate(${r.x + r.w / 2} ${frontTop + (r.y + r.h - frontTop) / 2 + 10}) scale(${0.7 + 0.3 * label})`} opacity={clamp01(label * 3)}>
          <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={200} letterSpacing={6} fill={CREAM} stroke={INK} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">SPAM</text>
        </g>
      )}
      <g transform={`translate(${r.x + r.w - 70} ${frontTop + 4})`} opacity={latch > 0 ? 1 : 0}>
        <rect x={-24} y={-8} width={48} height={36} rx={9} fill={INK} transform={`rotate(${(1 - latch) * -26})`} />
        <rect x={-14} y={0} width={28} height={10} rx={4} fill={CREAM} transform={`rotate(${(1 - latch) * -26})`} />
      </g>
    </g>
  );
};

export const Mail5: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b5.fold'];
  const out = E.inOut(ramp(g, T_INK, 6));                         // the whole outcome (inbox, folder, tray, route) leaves as ONE group while the field goes to ink
  if (g < t0 - 4 || g >= T_INK + 6) return null;
  const fade = 1 - out;
  const e = envAt(g);
  // fold (V3.1): A f335-341 the form shrinks and rises above the open envelope; B f341-347 it folds (height 1 -> 0.34) and slides in behind the envelope's FRONT panel (a real occluder, no crop); C f346-351 the flap closes
  const aK = E.inOut(ramp(g, t0, 6)), bK = E.inOut(ramp(g, t0 + 6, 6));
  const fx = lerp(1, 0.42, aK);
  const fcy = lerp(lerp(0, -250, aK), -20, bK);
  const fsx = fx, fsy = fx * lerp(1, 0.34, bK);
  const flap = g < t0 + 11 ? 0 : E.out(ramp(g, t0 + 11, 5));
  const envPop = E.out(ramp(g, t0, 4));
  const frontOp = E.out(ramp(g, t0 + 2, 4));
  const showForm = g < t0 + 16;
  const formG = (cy: number) => (
    <g transform={`translate(0 ${cy}) scale(${fsx} ${fsy}) translate(${-(WIN.x + WIN.w / 2)} ${-(WIN.y + WIN.h / 2)})`}>
      <FormBody />
    </g>
  );
  const slideIn = g >= t0 + 6;
  const folderIn = E.out(tw(g, EV['b5.inbox'] - 8, 8, (x) => x));
  const land = EV['b5.land'];
  const label = sp(g, land, SNAP, 16);
  const latch = g < EV['b5.latch'] ? 0 : E.out(tw(g, EV['b5.latch'], 4, (x) => x));
  const sq = ((): [number, number] => {
    const d = g - land;
    if (d < 0 || d > 10) return [1, 1];
    const k = Math.exp(-d / 3) * Math.cos(d * 0.9) * 0.06;
    return [1 + k, 1 - k];
  })();
  const inFolder = g >= EV['b5.divert'] + 4;
  const inboxIn = E.out(tw(g, t0 + 2, 9, (x) => x));
  const hitF = EV['b5.divert'];
  const armX = g < hitF - 7 ? 1180 : g < hitF ? lerp(1180, 506, E.in(tw(g, hitF - 7, 7, (x) => x))) : lerp(506, 1180, E.out(tw(g, hitF + 3, 9, (x) => x)));
  const armOn = armX < 1170;
  const trayIn = E.out(tw(g, EV['b5.tray'], 9, (x) => x));
  const never = E.out(tw(g, EV['b5.never'], 12, (x) => x));
  const routeEnd = lerp(FOLDER.y + FOLDER.h + 14, ITRAY.y - 30, 0.5 * never);   // the route starts and stops short: it never reaches the tray
  return (
    <g>
      <clipPath id="b5Col"><rect x={84} y={0} width={800} height={1920} /></clipPath>
      <g opacity={fade} clipPath="url(#b5Col)">
        <g transform={`translate(${-(1 - inboxIn) * 640} 0)`}>
          <rect x={INBOX.x + 8} y={INBOX.y + 14} width={INBOX.w} height={INBOX.h} rx={22} fill={INK} opacity={0.2} />
          <rect x={INBOX.x} y={INBOX.y} width={INBOX.w} height={INBOX.h} rx={22} fill={C.teal} stroke={INK} strokeWidth={7} />
          <rect x={INBOX.x + 30} y={INBOX.y + INBOX.h - 38} width={INBOX.w - 60} height={14} rx={7} fill={INK} />
          <Shield x={INBOX.x + 62} y={INBOX.y + 40} s={0.62} />
          <text x={INBOX.x + 112} y={INBOX.y + 40} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={2} fill={CREAM}>POLICE INBOX</text>
        </g>
        <g transform={`translate(${(1 - folderIn) * 900} 0)`}>
          <FolderV3 r={FOLDER} label={label} latch={latch} squash={sq} inside={inFolder ? <Env3 x={e.x} y={e.y} s={e.s} rot={e.rot} flap={1} /> : null} />
        </g>
        <g opacity={trayIn}>
          <rect x={ITRAY.x} y={ITRAY.y} width={ITRAY.w} height={ITRAY.h} rx={22} fill="none" stroke={INK} strokeWidth={7} strokeDasharray="20 14" />
          <rect x={ITRAY.x + 20} y={ITRAY.y + 24} width={ITRAY.w - 40} height={ITRAY.h - 52} rx={12} fill={PAPER} opacity={0.8} />
          <text x={ITRAY.x + ITRAY.w / 2} y={ITRAY.y + ITRAY.h + 48} textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={3} fill={INK}>INVESTIGATORS</text>
        </g>
        {never > 0 && <path d={`M ${ITRAY.x + ITRAY.w / 2} ${FOLDER.y + FOLDER.h + 14} L ${ITRAY.x + ITRAY.w / 2} ${routeEnd}`} stroke={INK} strokeWidth={8} strokeDasharray="6 16" strokeLinecap="round" opacity={0.8} />}
        {!inFolder && (
          <g>
            <Env3 x={e.x} y={e.y} s={e.s} rot={e.rot} flap={flap} op={envPop} front={frontOp}>
              {showForm && slideIn && formG(fcy)}
            </Env3>
            {showForm && !slideIn && <g transform={`translate(${e.x} ${e.y}) scale(${e.s})`}>{formG(fcy)}</g>}
          </g>
        )}
        {armOn && (
          <g transform={`translate(${armX} ${MOUTH.y + 4})`}>
            <rect x={0} y={-16} width={620} height={32} rx={16} fill={INK} />
            <rect x={0} y={-38} width={196} height={76} rx={18} fill={C.coral} stroke={INK} strokeWidth={7} />
            <text x={98} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={40} letterSpacing={1.5} fill={CREAM}>SPAM FILTER</text>
          </g>
        )}
      </g>
    </g>
  );
};
void SOFT; void GREY; void Cursor2;
