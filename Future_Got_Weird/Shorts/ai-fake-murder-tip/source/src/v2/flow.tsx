import React from 'react';
import {C, E, tw, sp, SNAP, SOFT, FIRM, lerp, clamp01, measure, HED_FONT, CAP_FONT, EV, INK, CREAM, PAPER, GREY, CX, WIN, HDR_H, TB1, BTN2, Rect, rectLerp, Card, PoliceHeader, Button2, Cursor2, Shield, mix} from './kit2';
import {SLOT} from './inspect';
import {Character, IDLE, Pose} from '../components/Character';
import {CAST} from '../components/cast';

const DEEP = '#EADFC0';   // darker paper for envelopes / page bars

/* ============================================================================================ B4: why it happened (test context) -> the real form */
export const FORM4: Rect = {x: 100, y: 520, w: 770, h: 620};

/** The tip window as sent: header, message box (greeked), SENT. Drawn in WIN coordinates; callers place and scale it. */
export const FormBody: React.FC = () => (
  <g>
    <Card r={WIN} />
    <PoliceHeader r={WIN} />
    <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
    <rect x={TB1.x} y={TB1.y} width={TB1.w} height={TB1.h} rx={20} fill={PAPER} stroke={INK} strokeWidth={7} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={TB1.x + 28} y={TB1.y + 30 + i * 46} width={[600, 520, 560, 330][i]} height={16} rx={8} fill={GREY} />)}
    <Button2 r={BTN2} sent press={1} />
  </g>
);

const growK = (g: number) => E.inOut(tw(g, EV['b4.grow'], 11, (x) => x));
const foldK = (g: number) => E.inOut(tw(g, EV['b5.fold'], 6, (x) => x));
const slideK = (g: number) => E.inOut(tw(g, EV['b5.fold'] + 4, 5, (x) => x));
export const ENV0 = {x: CX, y: 830};

const PageCard: React.FC<{r: Rect; kind: 'a' | 'b'; pop: number; out: number}> = ({r, kind, pop, out}) => {
  const s = lerp(0.82, 1, pop);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`} opacity={clamp01(pop * 3) * (1 - out)}>
      <rect x={r.x + 8} y={r.y + 12} width={r.w} height={r.h} rx={22} fill={INK} opacity={0.2} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={22} fill={PAPER} stroke={INK} strokeWidth={7} />
      <path d={`M ${r.x} ${r.y + 46} L ${r.x} ${r.y + 22} Q ${r.x} ${r.y} ${r.x + 22} ${r.y} L ${r.x + r.w - 22} ${r.y} Q ${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + 22} L ${r.x + r.w} ${r.y + 46} Z`} fill={DEEP} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[C.coral, CREAM, C.teal].map((c, i) => <circle key={i} cx={r.x + 30 + i * 24} cy={r.y + 23} r={8} fill={c} stroke={INK} strokeWidth={3} />)}
      {kind === 'a' ? (
        <g>
          <rect x={r.x + 24} y={r.y + 70} width={r.w - 48} height={150} rx={14} fill={C.tealLight} stroke={INK} strokeWidth={5} />
          <circle cx={r.x + r.w / 2} cy={r.y + 145} r={36} fill={C.teal} />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={r.x + 24} y={r.y + 250 + i * 34} width={[170, 140, 150, 110, 160, 90][i]} height={14} rx={7} fill={GREY} />)}
        </g>
      ) : (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={r.x + 24 + (i % 2) * 100} y={r.y + 70 + Math.floor(i / 2) * 100} width={88} height={88} rx={14} fill={[C.coral, C.tealLight, INK, C.teal][i]} stroke={INK} strokeWidth={5} opacity={i === 2 ? 0.85 : 1} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={r.x + 24} y={r.y + 288 + i * 34} width={[160, 120, 150, 100, 130][i]} height={14} rx={7} fill={GREY} />)}
        </g>
      )}
    </g>
  );
};

const pill = (text: string, size: number, padX = 30): {w: number} => ({w: measure(text, HED_FONT, size, 800, 2) + padX * 2});

/** B4 scene: model chip, WEBSITE TEST chip, three webpage cards, the AI pointer hopping across them; the police card grows into the real form */
export const Test4: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b4.start'];
  const fold = foldK(g);
  if (g < t0 || g >= EV['b5.fold'] + 20) return null;
  const chipOut = E.inOut(tw(g, EV['b5.fold'], 8, (x) => x));
  const c1 = E.out(tw(g, EV['b4.chip1'], 9, (x) => x)), c2 = E.out(tw(g, EV['b4.chip2'], 9, (x) => x));
  const w1 = pill('CLAUDE HAIKU 4.5', 50).w, w2 = pill('WEBSITE TEST', 50).w;
  const CH = {y: 300, h: 84};
  const grow = growK(g);
  const outCards = E.in(tw(g, EV['b4.grow'], 8, (x) => x));
  const pop1 = sp(g, EV['b4.chip1'] + 5, SOFT, 14), pop2 = sp(g, EV['b4.chip1'] + 10, SOFT, 14);
  // pointer: flies in with the model chip, hops on the three cards
  const hops = [EV['b4.hop1'], EV['b4.hop2'], EV['b4.hop3']];
  const centres = SLOT.map((r) => ({x: r.x + r.w / 2, y: r.y + 190}));
  let px = 130, py = 330;
  const start = {x: 150, y: 400};
  const seg = (a: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) - 38 * Math.sin(t * Math.PI)});
  let cur: {x: number; y: number};
  if (g < hops[0]) cur = seg(start, centres[0], E.inOut(tw(g, EV['b4.chip1'] + 2, hops[0] - EV['b4.chip1'] - 2, (x) => x)));
  else if (g < hops[1]) cur = seg(centres[0], centres[1], E.inOut(tw(g, hops[0] + 3, hops[1] - hops[0] - 3, (x) => x)));
  else if (g < hops[2]) cur = seg(centres[1], centres[2], E.inOut(tw(g, hops[1] + 3, hops[2] - hops[1] - 3, (x) => x)));
  else cur = centres[2];
  px = cur.x; py = cur.y;
  const curOp = clamp01(c1 * 3) * (1 - E.in(tw(g, EV['b4.grow'] + 2, 6, (x) => x)));
  const landed = (i: number) => {
    const d = g - hops[i];
    return d >= 0 && d < 10 ? d / 10 : 0;
  };
  // labels
  const real = sp(g, EV['b4.real'], SNAP, 16);
  const showReal = g >= EV['b4.real'];
  // form placement (grows out of the police card slot)
  const fs = lerp(SLOT[2].w / WIN.w, 1, grow);
  const fx = lerp(SLOT[2].x, FORM4.x, grow), fy = lerp(SLOT[2].y, FORM4.y, grow);
  const formOp = clamp01((g - EV['b4.grow']) / 4);
  const formVisible = g >= EV['b4.grow'] && g < EV['b5.fold'];
  const hopsRing = [0, 1, 2].map(landed);
  return (
    <g>
      {/* chips */}
      <g transform={`translate(0 ${-chipOut * 220})`} opacity={1 - chipOut}>
        <g transform={`translate(${-(1 - c1) * 560} 0)`}>
          <rect x={100} y={CH.y} width={w1} height={CH.h} rx={42} fill={C.teal} stroke={INK} strokeWidth={7} />
          <text x={100 + w1 / 2} y={CH.y + CH.h / 2 + 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={2} fill={CREAM}>CLAUDE HAIKU 4.5</text>
        </g>
        <g transform={`translate(${(1 - c2) * 560} 0)`} opacity={c2 > 0 ? 1 : 0}>
          <rect x={870 - w2} y={CH.y} width={w2} height={CH.h} rx={42} fill={INK} />
          <text x={870 - w2 / 2} y={CH.y + CH.h / 2 + 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={2} fill={CREAM}>WEBSITE TEST</text>
        </g>
      </g>
      {/* webpage cards */}
      <PageCard r={SLOT[0]} kind="a" pop={pop1} out={outCards} />
      <PageCard r={SLOT[1]} kind="b" pop={pop2} out={outCards} />
      {hopsRing.map((k, i) => k > 0 && g < EV['b4.grow'] + 2 && (
        <rect key={i} x={SLOT[i].x - 12 * k} y={SLOT[i].y - 12 * k} width={SLOT[i].w + 24 * k} height={SLOT[i].h + 24 * k} rx={30} fill="none" stroke={C.teal} strokeWidth={7} opacity={1 - k} />
      ))}
      {/* the real form grows out of the police card */}
      {formVisible && (
        <g opacity={formOp}>
          <g transform={`translate(${fx} ${fy}) scale(${fs}) translate(${-WIN.x} ${-WIN.y})`}>
            <FormBody />
          </g>
        </g>
      )}
      {showReal && g < EV['b5.fold'] + 6 && (
        <g opacity={1 - chipOut}>
          <g transform={`translate(100 ${454}) scale(${lerp(0.6, 1, real)})`} opacity={clamp01(real * 3)}>
            <rect x={0} y={-40} width={140} height={80} rx={14} fill={C.coral} stroke={INK} strokeWidth={7} transform="rotate(-3)" />
            <text x={70} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={64} letterSpacing={3} fill={CREAM} transform="rotate(-3)">REAL</text>
          </g>
          <text x={266} y={456} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={64} letterSpacing={3} fill={INK} opacity={clamp01((g - EV['b4.real'] - 2) / 4)}>POLICE FORM</text>
        </g>
      )}
      <Cursor2 x={px} y={py} s={0.95} press={landed(0) + landed(1) + landed(2) > 0 ? 1 : 0} op={curOp} />
    </g>
  );
};

/* ============================================================================================ B5: the actual outcome */
export const FOLDER: Rect = {x: 316, y: 590, w: 554, h: 380};
export const INBOX: Rect = {x: 100, y: 280, w: 420, h: 112};
export const ITRAY: Rect = {x: 316, y: 1040, w: 554, h: 116};
const MOUTH = {x: 312, y: 528};
const FOLD_MOUTH = {x: 585, y: 846};

const bez = (a: {x: number; y: number}, c: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

/** envelope centre / scale / rotation over time */
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
  const p = bez(MOUTH, {x: 600, y: 330}, FOLD_MOUTH, t);
  return {...p, s: lerp(0.9, 0.85, t), rot: lerp(-8, 22, t)};
};

const Env: React.FC<{x: number; y: number; s?: number; rot?: number; flap?: number; children?: React.ReactNode; clipId?: string; seal?: number; front?: number; op?: number}> = ({x, y, s = 1, rot = 0, flap = 1, children, clipId, seal = 1, front = 1, op = 1}) => {
  // 400 x 280 envelope centred on (0,0); flap 0 = open (apex up), 1 = closed
  const apex = lerp(-300, 78, flap);
  const closed = flap > 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
      <rect x={-188} y={-128} width={400} height={280} rx={22} fill={INK} opacity={0.2} />
      <rect x={-200} y={-140} width={400} height={280} rx={22} fill={DEEP} stroke={INK} strokeWidth={8} />
      {!closed && <path d={`M -200 -140 L 0 ${apex} L 200 -140 Z`} fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />}
      {clipId ? <g clipPath={`url(#${clipId})`}>{children}</g> : children}
      <g opacity={front}>
        <path d="M -200 140 L -200 -70 L 0 62 L 200 -70 L 200 140 Z" fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -200 140 L 0 -20" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.35} />
        <path d="M 200 140 L 0 -20" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      </g>
      {closed && <path d={`M -200 -140 L 0 ${apex} L 200 -140 Z`} fill={DEEP} stroke={INK} strokeWidth={8} strokeLinejoin="round" />}
      <circle cx={0} cy={lerp(20, 70, flap)} r={20} fill={C.coral} stroke={INK} strokeWidth={6} opacity={flap > 0.9 ? seal : 0} />
    </g>
  );
};

const FolderV2: React.FC<{r: Rect; inside: React.ReactNode; label: number; latch: number; squash: [number, number]}> = ({r, inside, label, latch, squash}) => {
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
          <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={190} letterSpacing={6} fill={CREAM} stroke={INK} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">SPAM</text>
        </g>
      )}
      <g transform={`translate(${r.x + r.w - 70} ${frontTop + 4})`} opacity={latch > 0 ? 1 : 0}>
        <rect x={-24} y={-8} width={48} height={36} rx={9} fill={INK} transform={`rotate(${(1 - latch) * -26})`} />
        <rect x={-14} y={0} width={28} height={10} rx={4} fill={CREAM} transform={`rotate(${(1 - latch) * -26})`} />
      </g>
    </g>
  );
};

export const checker5 = (g: number): Pose => {
  const e = envAt(g);
  const lx = Math.max(-0.2, Math.min(1, (e.x - 215) / 420)), ly = Math.max(-0.9, Math.min(0.8, (e.y - 1090) / 380));
  const tray = g >= EV['b5.tray'];
  const fin = tray ? E.inOut(tw(g, EV['b5.tray'], 8, (x) => x)) : 0;
  const x = lerp(lx, 0.8, fin), y = lerp(ly, 0.55, fin);
  const mood = g >= EV['b5.land'];
  return {...IDLE, mouth: mood ? 'smirk' : 'flat', lookX: x, lookY: y, brows: mood ? 0.15 : 0.35, browAsym: 0, tilt: lerp(2, -2, fin)};
};

/** B5: the form folds into an envelope, travels to the POLICE INBOX, is swatted into SPAM; INVESTIGATORS stays empty. */
export const Mail5: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b5.fold'];
  const iris = E.inOut(tw(g, EV['b6.start'], 12, (x) => x));
  if (g < t0 - 4 || g >= EV['b6.start'] + 14) return null;
  const fade = 1 - clamp01(iris * 1.6);
  const e = envAt(g);
  const fk = foldK(g), sk = slideK(g);
  const flap = g < t0 + 9 ? 0 : E.out(tw(g, t0 + 9, 5, (x) => x));
  const envPop = E.out(tw(g, t0 + 1, 4, (x) => x));
  const frontOp = E.out(tw(g, t0 + 4, 3, (x) => x));
  // form inside the envelope while folding
  const fsc = lerp(1, 0.44, fk);
  const showForm = g < t0 + 16;
  // spam folder
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
  // inbox + filter arm
  const inboxIn = E.out(tw(g, t0 + 2, 9, (x) => x));
  const hitF = EV['b5.divert'];
  const armX = g < hitF - 7 ? 1180 : g < hitF ? lerp(1180, 506, E.in(tw(g, hitF - 7, 7, (x) => x))) : lerp(506, 1180, E.out(tw(g, hitF + 3, 9, (x) => x)));
  const armOn = armX < 1170;
  const trayIn = E.out(tw(g, EV['b5.tray'], 9, (x) => x));
  const never = E.out(tw(g, EV['b5.never'], 8, (x) => x));
  const porthole = E.out(tw(g, t0 + 2, 10, (x) => x));
  const PS = 1.35, PC = {x: 210, y: 1130, r: 100};
  return (
    <g opacity={g >= EV['b6.start'] ? 1 : 1}>
      <g opacity={fade}>
        {/* POLICE INBOX */}
        <g transform={`translate(${-(1 - inboxIn) * 640} 0)`}>
          <rect x={INBOX.x + 8} y={INBOX.y + 14} width={INBOX.w} height={INBOX.h} rx={22} fill={INK} opacity={0.2} />
          <rect x={INBOX.x} y={INBOX.y} width={INBOX.w} height={INBOX.h} rx={22} fill={C.teal} stroke={INK} strokeWidth={7} />
          <rect x={INBOX.x + 30} y={INBOX.y + INBOX.h - 38} width={INBOX.w - 60} height={14} rx={7} fill={INK} />
          <Shield x={INBOX.x + 62} y={INBOX.y + 40} s={0.62} />
          <text x={INBOX.x + 112} y={INBOX.y + 40} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={2} fill={CREAM}>POLICE INBOX</text>
        </g>
        {/* SPAM folder (the envelope slips between its back and front) */}
        <g transform={`translate(${(1 - folderIn) * 900} 0)`}>
          <FolderV2 r={FOLDER} label={label} latch={latch} squash={sq}
            inside={inFolder ? <Env x={e.x} y={e.y} s={e.s} rot={e.rot} flap={1} /> : null} />
        </g>
        {/* INVESTIGATORS: empty, readable, secondary */}
        <g opacity={trayIn}>
          <rect x={ITRAY.x} y={ITRAY.y} width={ITRAY.w} height={ITRAY.h} rx={22} fill="none" stroke={INK} strokeWidth={7} strokeDasharray="20 14" />
          <rect x={ITRAY.x + 20} y={ITRAY.y + 24} width={ITRAY.w - 40} height={ITRAY.h - 52} rx={12} fill={PAPER} opacity={0.8} />
          <text x={ITRAY.x + ITRAY.w / 2} y={ITRAY.y + ITRAY.h + 48} textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={50} letterSpacing={3} fill={INK}>INVESTIGATORS</text>
        </g>
        {never > 0 && (
          <g opacity={never}>
            <path d={`M ${ITRAY.x + ITRAY.w / 2} ${FOLDER.y + FOLDER.h + 22} L ${ITRAY.x + ITRAY.w / 2} ${ITRAY.y - 14}`} stroke={INK} strokeWidth={8} strokeDasharray="6 16" strokeLinecap="round" />
            <g transform={`translate(${ITRAY.x + ITRAY.w / 2 + 70} ${(FOLDER.y + FOLDER.h + ITRAY.y) / 2 + 4}) scale(${lerp(0.6, 1, never)})`}>
              <circle r={30} fill={C.coral} stroke={INK} strokeWidth={6} />
              <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={CREAM} strokeWidth={9} strokeLinecap="round" />
            </g>
          </g>
        )}
        {/* the envelope (outside the folder until it is swatted); the form shrinks into it */}
        {!inFolder && (
          <g>
            <Env x={e.x} y={e.y} s={e.s} rot={e.rot} flap={flap} clipId="envClipFold" op={envPop} front={frontOp}>
              {showForm && (
                <g transform={`translate(0 ${-fk * 50 + sk * 214}) scale(${fsc}) translate(${-(WIN.x + WIN.w / 2)} ${-(WIN.y + WIN.h / 2)})`}>
                  <FormBody />
                </g>
              )}
            </Env>
            <clipPath id="envClipFold"><rect x={-700} y={-900} width={1400} height={1040} /></clipPath>
          </g>
        )}
        {/* the spam filter swats the envelope */}
        {armOn && (
          <g transform={`translate(${armX} ${MOUTH.y + 4})`}>
            <rect x={0} y={-16} width={620} height={32} rx={16} fill={INK} />
            <rect x={0} y={-38} width={196} height={76} rx={18} fill={C.coral} stroke={INK} strokeWidth={7} />
            <text x={98} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={40} letterSpacing={1.5} fill={CREAM}>SPAM FILTER</text>
          </g>
        )}
        {/* the checker follows the message with her eyes */}
        <g transform={`translate(${PC.x} ${PC.y}) scale(${lerp(0.6, 1, porthole)}) translate(${-PC.x} ${-PC.y})`} opacity={porthole}>
          <clipPath id="portClip"><circle cx={PC.x} cy={PC.y} r={PC.r} /></clipPath>
          <circle cx={PC.x + 8} cy={PC.y + 12} r={PC.r} fill={INK} opacity={0.2} />
          <circle cx={PC.x} cy={PC.y} r={PC.r} fill={C.tealLight} />
          <g clipPath="url(#portClip)">
            <g transform={`translate(${PC.x - 200 * PS} ${PC.y - 15 - 128 * PS})`}>
              <Character look={CAST.checker} pose={checker5(g)} frame={g} seed={5} scale={PS} shadow={false} life={0.4} eyeDarts={false} />
            </g>
          </g>
          <circle cx={PC.x} cy={PC.y} r={PC.r} fill="none" stroke={INK} strokeWidth={7} />
        </g>
      </g>
    </g>
  );
};
void FIRM; void mix; void sp;
