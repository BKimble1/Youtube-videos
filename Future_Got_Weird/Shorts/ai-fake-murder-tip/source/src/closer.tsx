import React from 'react';
import {C, E, tw, lerp, clamp01, sp, SNAP, CAP_FONT, measure, Hed, fitSize, BTN, PAGE, P0, PRESS, HED_FONT, ring} from './kit';
import {EV, TOTAL} from './cues';
import {Bubble, Chrome, Cursor, Panel, SubmitBtn} from './shapes';
import {PageP} from './world';
import {B5CARD, B6SCREEN, rectLerp} from './report';

const BTN_C = {x: BTN.x + BTN.w / 2, y: BTN.y + BTN.h / 2};

/* ------------------------------------------------------------------ opening headline (also the closing loop's pre-roll: t = g - TOTAL) */
const H1 = {text: 'FAKE', size: 228, y: 306};
const HX = 485;   // centre of the 100-870 safe column (the 1080 canvas centre would push the coral shadow past x=870)
const H2 = {text: 'MURDER TIP', y: 462, w: 728};
export const Headlines: React.FC<{g: number}> = ({g}) => {
  const t = g >= EV['loop.build'] ? g - TOTAL : g;
  if (g >= 150 && g < EV['loop.build']) return null;
  const inn = t < 0 ? E.out(tw(t, -16, 16, (x) => x)) : 1;
  const exit = t > 100 ? E.in(tw(t, 108, 14, (x) => x)) : 0;
  const fake = EV['b1.fake'];
  const popF = t >= fake && t < fake + 10 ? Math.sin(((t - fake) / 10) * Math.PI) : 0;
  const s2 = fitSize(H2.text, HED_FONT, H2.w, 186, 800, 2);
  const sc = lerp(1.35, 1, inn);
  return (
    <g opacity={clamp01(inn * 3) * (1 - exit)} transform={`translate(0 ${-exit * 50})`}>
      <g transform={`translate(${HX} ${H1.y}) scale(${sc * (1 + 0.04 * popF)}) rotate(${-1.2 * popF}) translate(${-HX} ${-H1.y})`}>
        <Hed x={HX} y={H1.y} text={H1.text} size={H1.size} color={C.cream} outline={C.ink} shadow={C.coral} ls={6} />
      </g>
      <g transform={`translate(${HX} ${H2.y}) scale(${sc}) translate(${-HX} ${-H2.y})`}>
        <Hed x={HX} y={H2.y} text={H2.text} size={s2} color={C.cream} outline={C.ink} shadow={C.coral} ls={2} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ B6: meaning, and the loop */
const BUB1 = {x: 176, y: 392, w: 608, h: 270};
const L1 = ['“I remember seeing', 'someone matching', 'the description.”'];
const FS = 46, LH = 58;


const squiggle = (x0: number, y: number, w: number, p: number) => {
  const n = Math.max(2, Math.round((w * p) / 16));
  let d = `M ${x0} ${y}`;
  for (let i = 1; i <= n; i++) d += ` q 4 ${i % 2 ? -12 : 12} 8 0 t 8 0`;
  return d;
};

export const cursorB6 = (g: number) => {
  const m = EV['b6.morph'];
  const a = {x: 470, y: 924};
  let pos = {x: a.x, y: a.y};
  const t1 = tw(g, m + 14, EV['b6.button'] + 14 - m - 14, (x) => x);
  const t2 = tw(g, EV['b6.arrive'] - 4, EV['loop.build'] + 6 - EV['b6.arrive'] + 4, (x) => x);
  pos = {x: lerp(a.x, PRESS.x, E.inOut(t1)), y: lerp(a.y, PRESS.y, E.inOut(t1)) - 46 * Math.sin(Math.min(1, t1) * Math.PI)};
  pos = {x: lerp(pos.x, P0.x, E.inOut(t2)), y: lerp(pos.y, P0.y, E.inOut(t2))};
  const op = sp(g, m + 4, SNAP, 12);
  return {...pos, op, s: 0.5 + 0.5 * op};
};

export const Closer: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b6.start'];
  if (g < t0) return null;
  const m = E.inOut(tw(g, t0, 16, (x) => x));
  const R = rectLerp(B5CARD, B6SCREEN, m);
  const b = EV['loop.build'];
  const build = clamp01((g - b) / (TOTAL - b));
  const buildE = E.out(build);
  const scrOut = E.in(tw(g, b - 6, 12, (x) => x));
  const bub1 = sp(g, EV['b6.bubble1'], SNAP, 16);
  const things = tw(g, EV['b6.things'], 16, E.out);
  // bubble 2 leaves the screen, travels down, then becomes the cursor
  const b2 = sp(g, EV['b6.bubble2'], SNAP, 16);
  const down = E.out(tw(g, EV['b6.bubble2'] + 4, 16, (x) => x));
  const morph = E.inOut(tw(g, EV['b6.morph'], 12, (x) => x));
  const b2x = 480, b2y = lerp(700, 930, down);
  const cur = cursorB6(g);
  const near = clamp01(1 - Math.hypot(cur.x - PRESS.x, cur.y - PRESS.y) / 170);
  const btnPop = sp(g, EV['b6.button'], SNAP, 16);
  const wSome = measure('someone ', CAP_FONT, FS);
  void wSome;
  const gr = lerp(0.16, 1, buildE);
  return (
    <g>
      {/* the screen (the report card's panel morphs into it) */}
      <g transform={`translate(${R.x + R.w / 2} ${R.y + R.h / 2}) scale(${lerp(1, 0.9, scrOut)}) translate(${-(R.x + R.w / 2)} ${-(R.y + R.h / 2)})`} opacity={1 - scrOut}>
        <Panel x={R.x} y={R.y} w={R.w} h={R.h} r={34} sdx={14} sdy={18}>
          {m > 0.7 && (
            <g opacity={clamp01((m - 0.7) / 0.3)}>
              <Chrome x={R.x} y={R.y} w={R.w} h={64} r={34} />
              <g transform={`translate(${BUB1.x + BUB1.w / 2} ${BUB1.y + BUB1.h / 2}) scale(${0.6 + 0.4 * bub1}) translate(${-(BUB1.x + BUB1.w / 2)} ${-(BUB1.y + BUB1.h / 2)})`} opacity={clamp01(bub1 * 3)}>
                <Bubble x={BUB1.x} y={BUB1.y} w={BUB1.w} h={BUB1.h} tx={BUB1.x + 80} ty={BUB1.y + BUB1.h + 40} fill={C.cream}>
                  {L1.map((l, i) => (
                    <text key={i} x={BUB1.x + 44} y={BUB1.y + 70 + i * LH} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={FS} fill={C.ink}>{l}</text>
                  ))}
                  {things > 0 && <path d={squiggle(BUB1.x + 44, BUB1.y + 70 + 2 * LH + 34, 460, things)} fill="none" stroke={C.coral} strokeWidth={7} strokeLinecap="round" />}
                </Bubble>
              </g>
            </g>
          )}
        </Panel>
      </g>
      {/* the second bubble becomes the cursor */}
      {g >= EV['b6.bubble2'] && morph < 1 && (
        <g transform={`translate(${b2x} ${b2y}) scale(${(0.5 + 0.5 * b2) * (1 - 0.8 * morph)}) translate(${-b2x} ${-b2y})`} opacity={clamp01(b2 * 3) * (1 - morph)}>
          <Bubble x={b2x - 150} y={b2y - 70} w={300} h={140} tx={b2x - 60} ty={b2y + 112} fill={C.white}>
            {[-60, 0, 60].map((dx, i) => <circle key={i} cx={b2x + dx} cy={b2y} r={14} fill={C.ink} opacity={0.35 + 0.65 * (Math.floor(g / 6) % 3 === i ? 1 : 0.4)} />)}
          </Bubble>
        </g>
      )}
      {/* the page grows around the button on the way back to frame 0 (the opening framing, button geometry unchanged) */}
      {g >= b && (
        <g transform={`translate(${BTN_C.x} ${BTN_C.y}) scale(${gr}) translate(${-BTN_C.x} ${-BTN_C.y})`} opacity={clamp01(buildE * 2.5)}>
          <PageP g={g} headerOn={0} scroll={300} typed={1} press={0} sent={false} ring={0} outlineP={0} tagP={0} hot={0} hideBtn />
        </g>
      )}
      {/* the button (same geometry as the opening) */}
      {g >= EV['b6.button'] && <g transform={`translate(${BTN_C.x} ${BTN_C.y}) scale(${0.6 + 0.4 * btnPop}) translate(${-BTN_C.x} ${-BTN_C.y})`} opacity={clamp01(btnPop * 3)}>
        <SubmitBtn x={BTN.x} y={BTN.y} w={BTN.w} h={BTN.h} hot={near * 0.9} />
      </g>}
      {cur.op > 0 && <Cursor x={cur.x} y={cur.y} s={cur.s} op={clamp01(cur.op)} />}
    </g>
  );
};
void PAGE; void ring;
