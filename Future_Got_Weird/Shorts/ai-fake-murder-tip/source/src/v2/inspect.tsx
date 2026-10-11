import React from 'react';
import {C, E, tw, kf, sp, SNAP, lerp, clamp01, measure, HED_FONT, CAP_FONT, EV, INK, CREAM, PAPER, GREY, CX, Rect, rectLerp, Shield} from './kit2';
import {Character, IDLE, Pose} from '../components/Character';
import {CAST} from '../components/cast';

/* ------------------------------------------------------------------ B3: the first reveal. A large checker examines the source page; the page has no description. */
export const PANEL: Rect = {x: 100, y: 604, w: 770, h: 656};
export const PAPER3: Rect = {x: 130, y: 968, w: 710, h: 276};      // the source page lying in front of her
export const SLOT: Rect[] = [
  {x: 100, y: 540, w: 250, h: 470},
  {x: 360, y: 540, w: 250, h: 470},
  {x: 620, y: 540, w: 250, h: 470},
];
const S = 2.55;                    // checker scale
const HEAD = {x: 330, y: 800};     // head centre in the panel
const GROUND = {x: HEAD.x, y: HEAD.y + 372 * S};

const enterK = (g: number) => E.out(tw(g, EV['b3.checker'] - 4, 12, (x) => x));
const exitK = (g: number) => E.inOut(tw(g, EV['b4.start'], 9, (x) => x));

export const pose3 = (g: number): Pose => {
  const scan0 = EV['b3.scan0'], stamp = EV['b3.stamp'], brow = EV['b3.brow'], look = EV['b3.look'], back = EV['b3.back'], blinkT = EV['b3.blink'];
  // gaze: down at the page, three reading sweeps, freeze at the stamp, glance up at the claim, back down
  let lx = 0.05, ly = 0.55;
  if (g >= scan0 && g < stamp) {
    const n = clamp01((g - scan0) / (stamp - scan0));
    const idx = Math.min(2, Math.floor(n * 3));
    const fr = n * 3 - idx;
    lx = lerp(-0.7, 0.7, E.inOut(fr)); ly = 0.62 + 0.16 * idx;
  } else if (g >= stamp) { lx = 0.7; ly = 0.78; }
  const up = E.inOut(tw(g, look, 5, (x) => x)), dn = E.inOut(tw(g, back, 6, (x) => x));
  if (g >= look) { lx = lerp(lx, -0.2, up); ly = lerp(ly, -0.72, up); }
  if (g >= back) { lx = lerp(-0.2, 0.05, dn); ly = lerp(-0.72, 0.7, dn); }
  const browUp = E.out(tw(g, brow, 5, (x) => x)) * (1 - 0.45 * E.inOut(tw(g, back + 10, 14, (x) => x)));
  const blinkNow = g >= blinkT && g < blinkT + 3;
  return {
    ...IDLE,
    mouth: g < stamp ? 'flat' : 'hmm',
    lookX: lx, lookY: ly,
    brows: lerp(0.05, 0.85, browUp),
    browAsym: browUp,
    tilt: lerp(0, -5, browUp),
    blink: blinkNow ? 0.05 : 1,
  };
};

const lineY = (i: number) => PAPER3.y + 106 + i * 36;

/** The source page: POLICE PAGE header, greeked lines, and (after "no") the editorial stamp. Morphs into a card of the test board at b4.start. */
export const SourcePage: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.start'];
  if (g < t0 + 6 || g >= EV['b4.grow'] + 5) return null;
  const m = E.inOut(tw(g, EV['b4.start'], 10, (x) => x));
  const rise = E.out(tw(g, EV['b3.checker'], 10, (x) => x));
  const r0: Rect = {...PAPER3, y: PAPER3.y + (1 - rise) * 420};
  const r = rectLerp(r0, SLOT[2], m);
  const k = r.w / PAPER3.w;
  const hdr = lerp(52, 60, m);
  const st = EV['b3.stamp'];
  const stampK = g < st ? 0 : E.out(tw(g, st, 5, (x) => x));
  const stampOp = stampK * (1 - clamp01(m * 2.2));
  const nL = Math.round(lerp(5, 5, m));
  // scan band
  const sc0 = EV['b3.scan0'], sc1 = st;
  const scanOn = g >= sc0 && g < sc1 + 2;
  const scanY = lerp(PAPER3.y + 100, PAPER3.y + 100 + 4 * 36, clamp01((g - sc0) / (sc1 - sc0)));
  const fade = 1 - clamp01((g - EV['b4.grow']) / 4);
  return (
    <g opacity={fade}>
      <rect x={r.x + 8} y={r.y + 12} width={r.w} height={r.h} rx={24} fill={INK} opacity={0.2} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={24} fill={PAPER} stroke={INK} strokeWidth={7} />
      <path d={`M ${r.x} ${r.y + hdr} L ${r.x} ${r.y + 24} Q ${r.x} ${r.y} ${r.x + 24} ${r.y} L ${r.x + r.w - 24} ${r.y} Q ${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + 24} L ${r.x + r.w} ${r.y + hdr} Z`} fill={C.teal} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <Shield x={r.x + 38 * Math.max(0.6, k)} y={r.y + hdr / 2} s={0.5 * Math.max(0.7, Math.min(1, k * 1.2))} />
      {r.w > 400 ? (
        <text x={r.x + 78} y={r.y + hdr / 2 + 2} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={38} letterSpacing={2} fill={CREAM}>POLICE PAGE</text>
      ) : (
        <text x={r.x + 70} y={r.y + hdr / 2 + 2} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={30} letterSpacing={1.5} fill={CREAM}>POLICE</text>
      )}
      {Array.from({length: nL}).map((_, i) => {
        const yy = r.y + hdr + 28 + i * ((r.h - hdr - 56) / (nL - 1 + 0.001)) * (nL > 1 ? 1 : 0);
        const wMul = [0.92, 0.78, 0.86, 0.6, 0.7][i];
        return <rect key={i} x={r.x + 30} y={yy} width={(r.w - 60) * wMul} height={16 * Math.max(0.75, k)} rx={8} fill={GREY} />;
      })}
      {scanOn && r.w > 400 && <rect x={PAPER3.x + 14} y={scanY - 6} width={PAPER3.w - 28} height={30} rx={10} fill={C.teal} opacity={0.28} />}
      {stampOp > 0 && (
        <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2 + 24}) rotate(${-3}) scale(${lerp(1.18, 1, stampK)})`} opacity={stampOp}>
          <rect x={-282} y={-106} width={564} height={212} rx={14} fill={PAPER} stroke={C.coral} strokeWidth={10} />
          <text x={0} y={-46} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={92} letterSpacing={2} fill={C.coral}>NO DESCRIPTION</text>
          <text x={0} y={46} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={92} letterSpacing={4} fill={C.coral}>PROVIDED</text>
        </g>
      )}
    </g>
  );
};

/** The checker's shot: a large panel, head and shoulders, examining the page. Slides up with the cream wipe; leaves as the page becomes a card. */
export const Stage3: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b3.start'];
  const ex = exitK(g);
  if (g < t0 + 2 || ex >= 1) return null;
  const en = enterK(g);
  const dy = (1 - en) * 700 + ex * 520;
  const op = 1 - ex;
  return (
    <g transform={`translate(0 ${dy})`} opacity={op}>
      <clipPath id="panel3Clip"><rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={34} /></clipPath>
      <rect x={PANEL.x + 10} y={PANEL.y + 14} width={PANEL.w} height={PANEL.h} rx={34} fill={INK} opacity={0.2} />
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={34} fill={C.tealLight} />
      <g clipPath="url(#panel3Clip)">
        <circle cx={HEAD.x + 20} cy={HEAD.y - 20} r={300} fill={PAPER} opacity={0.6} />
        <g transform={`translate(${GROUND.x - 200 * S} ${GROUND.y - 500 * S})`}>
          <Character look={CAST.checker} pose={pose3(g)} frame={g} seed={5} scale={S} shadow={false} life={0.5} eyeDarts={false} />
        </g>
      </g>
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={34} fill="none" stroke={INK} strokeWidth={7} />
    </g>
  );
};
void kf; void sp; void SNAP; void measure; void CAP_FONT; void CX;
