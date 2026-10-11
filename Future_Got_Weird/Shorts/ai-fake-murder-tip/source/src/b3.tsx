import React from 'react';
import {C, E, tw, lerp, clamp01, sp, SNAP, CAP_FONT, HED_FONT, measure, hop, OY} from './kit';
import {EV} from './cues';
import {Bubble} from './shapes';
import {scrollA, typedA} from './world';
import {Character, IDLE, Pose} from './components/Character';
import {CAST} from './components/cast';

/* ------------------------------------------------------------------ the AI's invented statement (a short original paraphrase) */
export const BUB = {x: 110, y: 232, w: 740, h: 296};
const LINES = ['“I remember seeing', 'someone matching', 'the description.”'];
const FS = 52, LH = 66, TX = BUB.x + 54, TY0 = BUB.y + 78;

export const StatementBubble: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.type0'];
  const pop = sp(g, t0 - 8, SNAP, 16);
  const out = tw(g, EV['b3.out'] - 6, 8, E.in);
  if (g < t0 - 8 || g >= EV['b3.out'] + 2) return null;
  const typed = typedA(g);
  const total = LINES.join('').length;
  let left = Math.floor(typed * total + 0.001);
  const shown = LINES.map((l) => {
    const n = Math.max(0, Math.min(l.length, left));
    left -= l.length;
    return l.slice(0, n);
  });
  const small = g >= EV['b3.lift'] ? 1 - 0.06 * E.out(tw(g, EV['b3.lift'], 10)) : 1;
  const hl = tw(g, EV['b3.match'], 12, E.out);
  const lift = g >= EV['b3.lift'];
  const wSome = measure('someone ', CAP_FONT, FS), wMatch = measure('matching', CAP_FONT, FS), wThe = measure('the description.', CAP_FONT, FS);
  const caret = typed < 1 || Math.floor(g / 8) % 2 === 0;
  const lastLine = shown.findIndex((s, i) => s.length < LINES[i].length);
  const caretLine = lastLine < 0 ? LINES.length - 1 : lastLine;
  const caretX = TX + measure(shown[caretLine], CAP_FONT, FS) + 6;
  return (
    <g transform={`translate(${BUB.x + BUB.w / 2} ${BUB.y + BUB.h / 2}) scale(${(0.6 + 0.4 * pop) * small}) translate(${-(BUB.x + BUB.w / 2)} ${-(BUB.y + BUB.h / 2)}) translate(0 ${-out * 60})`} opacity={clamp01(pop * 3) * (1 - out)}>
      <Bubble x={BUB.x} y={BUB.y} w={BUB.w} h={BUB.h} tx={300} ty={BUB.y + BUB.h + 34}>
        {/* highlight: "matching the description" */}
        <g opacity={hl}>
          <rect x={TX - 8 + wSome} y={TY0 + LH - 34} width={(wMatch + 16) * hl} height={50} rx={10} fill={C.saffron} opacity={lift ? 0.55 : 1} />
          <rect x={TX - 8} y={TY0 + 2 * LH - 34} width={(wThe + 16) * hl} height={50} rx={10} fill={C.saffron} opacity={lift ? 0.55 : 1} />
        </g>
        {LINES.map((_, i) => (
          <text key={i} x={TX} y={TY0 + i * LH} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={FS} fill={C.ink}>{shown[i]}</text>
        ))}
        {caret && g < EV['b3.lift'] && <rect x={caretX} y={TY0 + caretLine * LH - 30} width={6} height={60} rx={3} fill={C.coral} />}
      </Bubble>
    </g>
  );
};

/** The highlighted phrase lifts off the bubble and becomes the coral outline around the empty field (the outline itself is drawn in the page). */
export const Chip: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.lift'], t1 = EV['b3.tap'] - 2;
  if (g < t0 || g >= EV['b3.tap']) return null;
  const u = tw(g, t0, t1 - t0, (x) => x);
  const e = E.inOut(u);
  const sx0 = 480, sy0 = 440;
  const fieldY = 590 + (300 - scrollA(g)) + OY + 42;
  const x = lerp(sx0, 480, e), y = lerp(sy0, fieldY, e) - 90 * Math.sin(u * Math.PI);
  const w = lerp(470, 688, E.in(u)), h = lerp(70, 112, E.in(u));
  const txtOp = 1 - E.in(tw(u, 0.6, 0.4, (v) => v));
  return (
    <g transform={`translate(${x} ${y}) rotate(${-4 * (1 - u)})`}>
      <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={18} fill={C.ink} opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={33} fill={C.ink} opacity={txtOp}>matching the description</text>
    </g>
  );
};

/* ------------------------------------------------------------------ the checker's reaction (native vector rig; a brief supporting beat) */
export const RW = {x: 96, y: 936, w: 330, h: 350};

export const checkerPose = (g: number): Pose => {
  const r = g - EV['b3.react'];
  const glance = E.inOut(tw(r, 5, 6, (x) => x));
  const up = E.out(tw(r, 8, 5, (x) => x));
  const settle = E.inOut(tw(r, 20, 10, (x) => x));
  const blinkAt = EV['b3.blink'] - EV['b3.react'];
  return {
    ...IDLE,
    mouth: r < 14 ? 'hmm' : 'flat',
    lookX: lerp(-0.75, 0.95, glance),
    lookY: lerp(0.45, -0.3, glance),
    brows: lerp(0.15, 1, up) - 0.45 * settle,
    browAsym: up * (1 - 0.35 * settle),
    tilt: lerp(0, -5, up) + 2.5 * settle,
    blink: r >= blinkAt && r < blinkAt + 3 ? 0.05 : 1,
    armL: {a: 8, b: 10},
    armR: {a: 8, b: 10},
  };
};

export const CheckerWindow: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.react'], t1 = EV['b3.out'];
  if (g < t0 || g >= t1 + 2) return null;
  const inn = E.out(tw(g, t0, 9, (x) => x));
  const out = E.in(tw(g, t1 - 7, 8, (x) => x));
  const dx = -(1 - inn) * 400 - out * 400;
  const s = 1.78;
  const cx = RW.x + RW.w / 2, headY = RW.y + 150;
  const gy = headY + 372 * s;
  return (
    <g transform={`translate(${dx} 0)`}>
      <clipPath id="rwClip"><rect x={RW.x} y={RW.y} width={RW.w} height={RW.h} rx={34} /></clipPath>
      <rect x={RW.x + 10} y={RW.y + 14} width={RW.w} height={RW.h} rx={34} fill={C.ink} opacity={0.22} />
      <rect x={RW.x} y={RW.y} width={RW.w} height={RW.h} rx={34} fill={C.tealLight} />
      <g clipPath="url(#rwClip)">
        <circle cx={cx - 60} cy={RW.y + 80} r={150} fill={C.cream} opacity={0.55} />
        <g transform={`translate(${cx - 200 * s} ${gy - 500 * s})`}>
          <Character look={CAST.checker} pose={checkerPose(g)} frame={g} seed={5} x={200 * s} y={500 * s} scale={s} shadow={false} life={0.6} eyeDarts={false} />
        </g>
      </g>
      <rect x={RW.x} y={RW.y} width={RW.w} height={RW.h} rx={34} fill="none" stroke={C.ink} strokeWidth={6} />
    </g>
  );
};
void HED_FONT; void hop;
