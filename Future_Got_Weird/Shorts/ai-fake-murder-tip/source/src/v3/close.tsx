import React from 'react';
import {C, E, tw, sp, SNAP, SOFT, lerp, clamp01, measure, HED_FONT, CAP_FONT, EV, INK, CREAM, PAPER, GREY, WIN, TB1, BTN2, P_START, Rect, rectLerp, Card, PoliceHeader, Button2, Cursor2, AIMark, Env3} from './kit3';
import {ITRAY} from './flow';

/* ============================================================================================ B6: the takeaway (ink). One invented-answer paper stays contained; an enabled button opens a path beyond it. */
export const Q6: Rect = {x: 96, y: 330, w: 780, h: 440};
export const BTN6: Rect = {x: 336, y: 930, w: 300, h: 116};
const MARK = {x: Q6.x + Q6.w - 56, y: Q6.y + 8};      // where the AI corner mark sits on the paper
const P6 = {x: 560, y: 1000};                           // pointer tip on SUBMIT
const QL = ['“I recall seeing', 'someone matching', 'the description…'];

const retK = (g: number) => E.inOut(tw(g, EV['loop.build'], 26, (x) => x));
const morphK = (g: number) => E.inOut(tw(g, EV['b6.start'], 12, (x) => x));

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
  const t0 = EV['b6.start'];
  if (g < t0) return null;
  const m = morphK(g), ret = retK(g);
  let r: Rect = rectLerp(ITRAY, Q6, m);
  r = rectLerp(r, WIN, ret);
  const dash = m < 0.5 ? '20 14' : undefined;
  const contentK = E.out(tw(g, EV['b6.paper'], 5, (x) => x));
  const contentOp = contentK * (1 - clamp01(ret * 2.2));
  const s = 1;
  const tx = r.x + 52 * s;
  const yc = (i: number) => r.y + (112 + 106 * i) * s;
  const off2 = measure('someone ', CAP_FONT, 70), w2 = measure('matching', CAP_FONT, 70), w3 = measure('the description', CAP_FONT, 70);
  // containment: a coral frame draws round the claim on "making things up" and stays
  const contain = E.inOut(tw(g, EV['b6.contain'], 12, (x) => x));
  const perim = 2 * ((Q6.w - 40) + (Q6.h - 40));
  // pointer: the AI corner mark peels off the paper and becomes the pointer
  const tagT = EV['b6.tag'], arr = EV['b6.arrive'];
  const cu = E.inOut(tw(g, tagT + 3, arr - tagT - 3, (x) => x));
  const ctrl = {x: 820, y: 660};
  const bez = (t: number) => ({x: (1 - t) * (1 - t) * MARK.x + 2 * (1 - t) * t * ctrl.x + t * t * P6.x, y: (1 - t) * (1 - t) * (MARK.y + 40) + 2 * (1 - t) * t * ctrl.y + t * t * P6.y});
  let cp = g < arr ? bez(cu) : P6;
  if (ret > 0) cp = {x: lerp(P6.x, P_START.x, ret), y: lerp(P6.y, P_START.y, ret)};
  const markOn = g < tagT + 3 && contentOp > 0;
  const showCur = g >= tagT;
  const curS = lerp(0.7, 1.5, E.out(tw(g, tagT, 8, (x) => x)));
  const tagK = lerp(0.2, 1, E.out(tw(g, tagT, 8, (x) => x)));
  // button
  const btnIn = sp(g, EV['b6.btn'], SNAP, 14);
  const enable = E.out(tw(g, EV['b6.enable'], 6, (x) => x));
  const dim = g < EV['b6.enable'] ? 1 : 1 - enable;
  const br = rectLerp(BTN6, BTN2, ret);
  const bs = lerp(0.7, 1, btnIn);
  const ring = g >= EV['b6.enable'] && g < EV['b6.enable'] + 12 ? (g - EV['b6.enable']) / 12 : 0;
  // action path + the packet that follows it beyond the paper
  const pathT = E.inOut(tw(g, EV['b6.path'], 20, (x) => x));
  const pathOn = g >= EV['b6.path'] && ret < 0.05;
  const pk = onPath(pathT);
  return (
    <g>
      <Card r={r} fill={PAPER} shadow={0} dash={dash} />
      {ret > 0 && <g opacity={ret}><PoliceHeader r={r} /></g>}
      {ret > 0 && (
        <g opacity={ret}>
          <text x={TB1.x} y={TB1.y - 26} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={30} letterSpacing={1} fill={C.inkSoft}>YOUR TIP</text>
          <rect x={TB1.x} y={TB1.y} width={TB1.w} height={TB1.h} rx={20} fill={PAPER} stroke={INK} strokeWidth={7} />
          {[0, 1].map((i) => <rect key={i} x={TB1.x + 30} y={TB1.y + 40 + i * 56} width={[560, 420][i]} height={18} rx={9} fill={GREY} />)}
        </g>
      )}
      {contentOp > 0 && (
        <g opacity={contentOp}>
          <rect x={tx + off2 - 10} y={yc(1) - 50} width={w2 + 20} height={100} rx={16} fill={C.saffron} />
          <rect x={tx - 10} y={yc(2) - 50} width={w3 + 20} height={100} rx={16} fill={C.saffron} />
          {QL.map((ln, i) => <text key={i} x={tx} y={yc(i)} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={70} fill={INK}>{ln}</text>)}
          <rect x={r.x + 36} y={r.y - 26} width={196} height={52} rx={14} fill={CREAM} stroke={INK} strokeWidth={5} />
          <text x={r.x + 134} y={r.y} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={38} letterSpacing={3} fill={INK}>EXCERPT</text>
          {contain > 0 && (
            <rect x={r.x + 20} y={r.y + 20} width={r.w - 40} height={r.h - 40} rx={22} fill="none" stroke={C.coral} strokeWidth={7} strokeLinejoin="round" pathLength={100} strokeDasharray={`${contain * 100} 100`} />
          )}
          {markOn && <AIMark x={MARK.x} y={MARK.y} s={1.3 * (1 - E.in(tw(g, tagT, 6, (x) => x)) * 0.0)} rot={8} op={1 - E.in(tw(g, tagT + 1, 5, (x) => x))} />}
          {g < tagT + 3 && <AIMark x={MARK.x} y={MARK.y} s={1.3} rot={8} op={g < tagT ? 1 : 0} />}
        </g>
      )}
      {/* the action path beyond the paper, and the packet that follows it */}
      {pathOn && (
        <g>
          <path d={`M ${PATH.a.x} ${PATH.a.y} C ${PATH.b.x} ${PATH.b.y} ${PATH.c.x} ${PATH.c.y} ${PATH.d.x} ${PATH.d.y}`} fill="none" stroke={CREAM} strokeWidth={8} strokeLinecap="round" strokeDasharray="4 18" pathLength={100} opacity={0.9} />
          <path d={`M ${PATH.d.x - 26} ${PATH.d.y - 18} L ${PATH.d.x} ${PATH.d.y + 8} L ${PATH.d.x + 26} ${PATH.d.y - 18}`} fill="none" stroke={CREAM} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01((pathT - 0.6) * 4)} />
          <Env3 x={pk.x} y={pk.y} s={0.42 * (1 - 0.25 * pathT)} rot={10 * pathT} flap={1} op={1 - E.in(tw(g, EV['b6.path'] + 16, 8, (x) => x))} />
        </g>
      )}
      {g >= EV['b6.btn'] && (
        <g transform={`translate(${br.x + br.w / 2} ${br.y + br.h / 2}) scale(${bs}) translate(${-(br.x + br.w / 2)} ${-(br.y + br.h / 2)})`} opacity={clamp01(btnIn * 3)}>
          <Button2 r={br} dim={dim} />
          {ring > 0 && <rect x={br.x - 14 * ring} y={br.y - 14 * ring} width={br.w + 28 * ring} height={br.h + 28 * ring + 12} rx={34} fill="none" stroke={C.teal} strokeWidth={7} opacity={1 - ring} />}
        </g>
      )}
      {showCur && <Cursor2 x={cp.x} y={cp.y} s={curS} tagK={tagK} />}
    </g>
  );
};
void SOFT;
