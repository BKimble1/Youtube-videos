import React from 'react';
import {C, E, tw, sp, SNAP, SOFT, lerp, clamp01, measure, HED_FONT, CAP_FONT, EV, INK, CREAM, PAPER, GREY, WIN, TB1, BTN2, P_START, Rect, rectLerp, Card, PoliceHeader, Button2, Cursor2} from './kit2';
import {ITRAY} from './flow';

/* ============================================================================================ B6: meaning (ink). Invented language gains an action; then the geometry returns to the opening state. */
export const CHAT: Rect = {x: 100, y: 440, w: 770, h: 520};
export const BTN6: Rect = {x: 305, y: 1040, w: 360, h: 128};
const BUB: Rect = {x: 232, y: 524, w: 600, h: 300};
const TAIL0 = {x: 262, y: 872};            // tip of the bubble's tail: it becomes the AI pointer
const P6 = {x: 596, y: 1110};              // pointer tip on SUBMIT
const DEEP = '#EADFC0';
const SQ = ['someone matching', 'the description…'];

const retK = (g: number) => E.inOut(tw(g, EV['loop.build'], 26, (x) => x));
const morphK = (g: number) => E.inOut(tw(g, EV['b6.start'], 12, (x) => x));

const squiggle = (x0: number, x1: number, y: number) => {
  const pts: string[] = [];
  for (let x = x0, i = 0; x <= x1; x += 10, i++) pts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y + 6 * Math.sin(i * 1.3)}`);
  return pts.join(' ');
};

export const Close6: React.FC<{g: number}> = ({g}) => {
  const t0 = EV['b6.start'];
  if (g < t0) return null;
  const m = morphK(g), ret = retK(g);
  let r: Rect = rectLerp(ITRAY, CHAT, m);
  r = rectLerp(r, WIN, ret);
  const dash = m < 0.5 ? '20 14' : undefined;
  const hdrH = 66;
  // chat content
  const bub = sp(g, EV['b6.bubble'], SOFT, 14);
  const contentOp = clamp01(bub * 3) * (1 - clamp01(ret * 2.2));
  const lineT = [0, 1, 2].map((i) => E.out(tw(g, EV['b6.bubble'] + 1 + i * 3, 4, (x) => x)));
  const L = ['“I recall seeing', 'someone matching', 'the description…'];
  const ty = [598, 672, 746];
  const tx = BUB.x + 36;
  const sqP = E.inOut(tw(g, EV['b6.squiggle'], 14, (x) => x));
  const w2 = measure('someone matching', CAP_FONT, 52), off2 = measure('someone ', CAP_FONT, 52), w3 = measure('the description…', CAP_FONT, 52);
  // tail -> pointer
  const tailT = EV['b6.tail'], arr = EV['b6.arrive'];
  const tailK = 1 - E.in(tw(g, tailT, 8, (x) => x));
  const showTail = g < tailT + 8 && contentOp > 0;
  const cu = E.inOut(tw(g, tailT + 4, arr - tailT - 4, (x) => x));
  const ctrl = {x: 300, y: 1010};
  const bez = (t: number) => ({x: (1 - t) * (1 - t) * TAIL0.x + 2 * (1 - t) * t * ctrl.x + t * t * P6.x, y: (1 - t) * (1 - t) * TAIL0.y + 2 * (1 - t) * t * ctrl.y + t * t * P6.y});
  let cp = g < arr ? bez(cu) : P6;
  if (ret > 0) cp = {x: lerp(P6.x, P_START.x, ret), y: lerp(P6.y, P_START.y, ret)};
  const curS = lerp(0.5, 1.15, E.out(tw(g, tailT + 1, 8, (x) => x)));
  const showCur = g >= tailT + 1;
  // button
  const btnIn = sp(g, EV['b6.btn'], SNAP, 14);
  const unlock = E.out(tw(g, EV['b6.unlock'], 6, (x) => x));
  const locked = g < EV['b6.unlock'] ? 1 : 1 - E.out(tw(g, EV['b6.unlock'] + 3, 7, (x) => x));
  const br = rectLerp(BTN6, BTN2, ret);
  const bs = lerp(0.7, 1, btnIn);
  const ringT = EV['b6.unlock'];
  const ring = g >= ringT && g < ringT + 12 ? (g - ringT) / 12 : 0;
  // attribution (once)
  const attr = EV['b6.attr'];
  const attrOp = E.out(tw(g, attr, 5, (x) => x)) * (1 - E.in(tw(g, EV['b6.squiggle'] + 12, 6, (x) => x)));
  const atxt = 'ANTHROPIC REPORT · OCT 9, 2026';
  const aw = measure(atxt, CAP_FONT, 29) + 56;
  const showHdr = 1 - ret;
  return (
    <g>
      {/* window */}
      <Card r={r} fill={PAPER} shadow={0} dash={dash} />
      {/* chat header -> police header */}
      <g opacity={showHdr * clamp01((m - 0.4) * 2.5)}>
        <path d={`M ${r.x} ${r.y + hdrH} L ${r.x} ${r.y + 30} Q ${r.x} ${r.y} ${r.x + 30} ${r.y} L ${r.x + r.w - 30} ${r.y} Q ${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + 30} L ${r.x + r.w} ${r.y + hdrH} Z`} fill={DEEP} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {[C.coral, CREAM, C.teal].map((c, i) => <circle key={i} cx={r.x + 44 + i * 36} cy={r.y + hdrH / 2} r={12} fill={c} stroke={INK} strokeWidth={4} />)}
      </g>
      {ret > 0 && <g opacity={ret}><PoliceHeader r={r} /></g>}
      {/* tip box of the opening state fades in as the window returns */}
      {ret > 0 && (
        <g opacity={ret}>
          <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
          <rect x={TB1.x} y={TB1.y} width={TB1.w} height={TB1.h} rx={20} fill={PAPER} stroke={INK} strokeWidth={7} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={TB1.x + 28} y={TB1.y + 30 + i * 46} width={[600, 520, 560, 330][i]} height={16} rx={8} fill={GREY} />)}
        </g>
      )}
      {/* the invented answer in a chat bubble */}
      {contentOp > 0 && (
        <g opacity={contentOp} transform={`translate(${BUB.x + BUB.w / 2} ${BUB.y + BUB.h}) scale(${lerp(0.9, 1, bub)}) translate(${-(BUB.x + BUB.w / 2)} ${-(BUB.y + BUB.h)})`}>
          <circle cx={168} cy={578} r={44} fill={C.teal} stroke={INK} strokeWidth={6} />
          <text x={168} y={580} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={46} fill={CREAM}>AI</text>
          <rect x={BUB.x} y={BUB.y} width={BUB.w} height={BUB.h} rx={36} fill={C.white} stroke={INK} strokeWidth={7} />
          {showTail && <path d={`M ${BUB.x + 36} ${BUB.y + BUB.h - 2} L ${lerp(BUB.x + 70, TAIL0.x, tailK)} ${lerp(BUB.y + BUB.h, TAIL0.y, tailK)} L ${BUB.x + 104} ${BUB.y + BUB.h - 2} Z`} fill={C.white} stroke={INK} strokeWidth={7} strokeLinejoin="round" />}
          {showTail && <rect x={BUB.x + 41} y={BUB.y + BUB.h - 10} width={58} height={12} fill={C.white} />}
          {L.map((ln, i) => <text key={i} x={tx} y={ty[i] + 8 * (1 - lineT[i])} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={52} fill={INK} opacity={lineT[i]}>{ln}</text>)}
          {sqP > 0 && (
            <g>
              <clipPath id="sqClip"><rect x={tx} y={600} width={w3 * sqP + 40} height={220} /></clipPath>
              <g clipPath="url(#sqClip)">
                <path d={squiggle(tx + off2, tx + w2, ty[1] + 40)} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
                <path d={squiggle(tx, tx + w3, ty[2] + 40)} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>
      )}
      {/* attribution, once */}
      {attrOp > 0 && g < EV['loop.build'] && (
        <g opacity={attrOp}>
          <rect x={485 - aw / 2} y={338} width={aw} height={58} rx={29} fill="none" stroke={CREAM} strokeWidth={4} />
          <text x={485} y={368} dy="0.36em" textAnchor="middle" fontFamily={CAP_FONT} fontWeight={800} fontSize={29} letterSpacing={1} fill={CREAM}>{atxt}</text>
        </g>
      )}
      {/* SUBMIT: appears locked, unlocks when the pointer arrives */}
      {g >= EV['b6.btn'] && (
        <g transform={`translate(${br.x + br.w / 2} ${br.y + br.h / 2}) scale(${bs}) translate(${-(br.x + br.w / 2)} ${-(br.y + br.h / 2)})`} opacity={clamp01(btnIn * 3)}>
          <Button2 r={br} locked={locked} unlock={unlock} />
          {ring > 0 && <rect x={br.x - 14 * ring} y={br.y - 14 * ring} width={br.w + 28 * ring} height={br.h + 28 * ring + 12} rx={34} fill="none" stroke={C.teal} strokeWidth={7} opacity={1 - ring} />}
        </g>
      )}
      {showCur && <Cursor2 x={cp.x} y={cp.y} s={curS} />}
    </g>
  );
};
void SNAP;
