import React from 'react';
import {C, E, lerp, clamp01, EV, INK, CREAM, PAPER, GREY, WIN, TB1, BTN2, P_START, Q2, Rect, rectLerp, Card, PoliceHeader, Button2, Cursor2, Env3, sp, SNAP, ramp, T_INK, BG_FRAMES, CAP_FONT} from './kit3';
import {QuotePaper} from './quote';

/* ============================================================================================ B6: the takeaway (ink). One invented-answer paper stays contained; an enabled button opens a path beyond it.
   V3.1: the paper arrives with its text (no empty card), the cursor is routed BELOW the paper (never across the excerpt) and carries no moving AI tag, and the return to the
   opening is: quote content fades out completely -> the opaque paper morphs into the form -> header and form lines appear -> the existing button becomes the opening button -> the headline reveals as one group. */
export const Q6: Rect = {x: 96, y: 330, w: 780, h: Q2.h};
export const BTN6: Rect = {x: 336, y: 930, w: 300, h: 116};
const P6 = {x: 560, y: 1000};                           // pointer tip on SUBMIT
const CUR_FROM = {x: 790, y: 790};                      // the pointer appears below the paper's bottom-right corner (paper bottom 696 + shadow)
const CUR_CTRL = {x: 800, y: 940};
const T_PAPER = T_INK + 6;                              // 447: the paper arrives (with its text) as soon as the outcome props are gone (they leave over f441-447); the field finishes its change to ink at f449
const D_PAPER = 6;
const RET0 = EV['loop.build'] + 2;                      // 598
const D_RET = 12;

/** the action path out of the button, beyond the paper */
const PATH = {a: {x: 646, y: 1004}, b: {x: 726, y: 1004}, c: {x: 774, y: 1030}, d: {x: 774, y: 1190}};
const onPath = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * PATH.a.x + 3 * u * u * t * PATH.b.x + 3 * u * t * t * PATH.c.x + t * t * t * PATH.d.x,
    y: u * u * u * PATH.a.y + 3 * u * u * t * PATH.b.y + 3 * u * t * t * PATH.c.y + t * t * t * PATH.d.y,
  };
};

export const Close6: React.FC<{g: number}> = ({g}) => {
  if (g < T_PAPER) return null;
  const ret = E.inOut(ramp(g, RET0, D_RET));
  // paper: arrives with its text, then (loop return) its content fades out and the opaque surface morphs into the opening form
  const pin = E.out(ramp(g, T_PAPER, D_PAPER));
  const grow = lerp(0.94, 1, pin);
  const cx = Q6.x + Q6.w / 2, cy = Q6.y + Q6.h / 2;
  let r: Rect = {x: cx - (Q6.w * grow) / 2, y: cy - (Q6.h * grow) / 2, w: Q6.w * grow, h: Q6.h * grow};
  r = rectLerp(r, WIN, ret);
  const content = 1 - E.inOut(ramp(g, EV['loop.build'], 6));
  const contain = E.inOut(ramp(g, EV['b6.contain'], 12));
  // pointer
  const arr = EV['b6.arrive'], cur0 = EV['b6.tag'] - 4;
  const cu = E.inOut(ramp(g, cur0, arr - cur0));
  const bez = (t: number) => ({x: (1 - t) * (1 - t) * CUR_FROM.x + 2 * (1 - t) * t * CUR_CTRL.x + t * t * P6.x, y: (1 - t) * (1 - t) * CUR_FROM.y + 2 * (1 - t) * t * CUR_CTRL.y + t * t * P6.y});
  let cp = g < arr ? bez(cu) : P6;
  cp = {x: lerp(cp.x, P_START.x, ret), y: lerp(cp.y, P_START.y, ret)};
  const curOp = E.out(ramp(g, cur0, 6));
  const tagK = E.out(ramp(g, RET0 + 10, 8));              // the opener's AI tag returns only as the layout returns
  // button
  const btnIn = sp(g, EV['b6.btn'], SNAP, 14);
  const enable = E.out(ramp(g, EV['b6.enable'], 6));
  const dim = g < EV['b6.enable'] ? 1 : 1 - enable;
  const br = rectLerp(BTN6, BTN2, ret);
  const bs = lerp(0.7, 1, btnIn);
  const ring = g >= EV['b6.enable'] && g < EV['b6.enable'] + 12 ? (g - EV['b6.enable']) / 12 : 0;
  // action path + the packet that follows it beyond the paper
  const pathT = E.inOut(ramp(g, EV['b6.path'], 20));
  const pathOn = g >= EV['b6.path'] && ret < 0.05;
  const pk = onPath(pathT);
  // opening-state furniture: header, label and tip box appear only after the quote content is gone
  const furn = E.inOut(ramp(g, RET0 + 6, 6));
  return (
    <g>
      <QuotePaper r={r} content={content} contain={contain} op={pin} />
      {ret > 0 && furn > 0 && (
        <g opacity={furn}>
          <PoliceHeader r={r} />
          <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
          <rect x={TB1.x} y={TB1.y} width={TB1.w} height={TB1.h} rx={20} fill={PAPER} stroke={INK} strokeWidth={7} />
          {[0, 1].map((i) => <rect key={i} x={TB1.x + 30} y={TB1.y + 40 + i * 56} width={[560, 420][i]} height={18} rx={9} fill={GREY} />)}
        </g>
      )}
      {pathOn && (
        <g>
          <path d={`M ${PATH.a.x} ${PATH.a.y} C ${PATH.b.x} ${PATH.b.y} ${PATH.c.x} ${PATH.c.y} ${PATH.d.x} ${PATH.d.y}`} fill="none" stroke={CREAM} strokeWidth={8} strokeLinecap="round" strokeDasharray="4 18" pathLength={100} opacity={0.9} />
          <path d={`M ${PATH.d.x - 26} ${PATH.d.y - 18} L ${PATH.d.x} ${PATH.d.y + 8} L ${PATH.d.x + 26} ${PATH.d.y - 18}`} fill="none" stroke={CREAM} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01((pathT - 0.6) * 4)} />
          <Env3 x={pk.x} y={pk.y} s={0.42 * (1 - 0.25 * pathT)} rot={10 * pathT} flap={1} op={1 - E.in(ramp(g, EV['b6.path'] + 16, 8))} />
        </g>
      )}
      {g >= EV['b6.btn'] && (
        <g transform={`translate(${br.x + br.w / 2} ${br.y + br.h / 2}) scale(${bs}) translate(${-(br.x + br.w / 2)} ${-(br.y + br.h / 2)})`} opacity={clamp01(btnIn * 3)}>
          <Button2 r={br} dim={dim} />
          {ring > 0 && <rect x={br.x - 14 * ring} y={br.y - 14 * ring} width={br.w + 28 * ring} height={br.h + 28 * ring + 12} rx={34} fill="none" stroke={C.teal} strokeWidth={7} opacity={1 - ring} />}
        </g>
      )}
      {g >= cur0 && <Cursor2 x={cp.x} y={cp.y} s={1.5} op={curOp} tag={tagK > 0.01} tagK={Math.max(tagK, 0.01)} />}
    </g>
  );
};
