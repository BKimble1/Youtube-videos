import React from 'react';
import {EV} from '../cues';
import {C, F, RH, SURF, Plate, Headline, Burst, Shadow, E, kf, tw, lerp, clamp01, OUTLINE} from './common';
import {Hand, HandPose, ikDigit, defOf, toLocal, V, Place, tipWorld} from '../hand/Hand';
import {sp, SNAP, SOFT, ring, drift} from '../lib/motion';
import {Washer, Die, Tool, TOOL} from './props';
import {frontPose} from './beats1';

/* ------------------------------------------------------------------ B04: four digits, thirteen ways to move */

export const B04 = {start: 309, thirteen: EV['B04.count.thirteen']};

export const poseB04 = (g: number): HandPose => {
  const sw = kf(g, [[437, 1, E.inOut], [452, 0.18, E.inOut], [468, 1, E.inOut]]);
  const cT = kf(g, [[437, 0, E.inOut], [452, 0.55, E.inOut], [468, 0, E.inOut]]);
  const spread = kf(g, [[453, 0.2, E.inOut], [462, 1.0, E.inOut], [474, -0.1, E.inOut], [482, 0.2, E.inOut]]);
  const curl = (a: number) => kf(g, [[a, 0, E.inOut], [a + 11, 0.92, E.inOut], [a + 22, 0, E.inOut]]);
  return frontPose([cT, curl(461), curl(465), curl(469)], spread, sw);
};

const HL = ['thumb', 'index', 'middle', 'ring'] as const;
const hlAt = (g: number, n: (typeof HL)[number]) => {
  const t = EV[`B04.hl.${n}` as 'B04.hl.thumb'];
  return kf(g, [[t, 0, E.out], [t + 5, 1, E.out], [t + 18, 0.28, E.inOut], [B04.thirteen, 0.28, E.in], [B04.thirteen + 8, 0, E.in]]);
};

export const B04World: React.FC<{g: number}> = ({g}) => {
  const pose = poseB04(g);
  const all = kf(g, [[316, 0, E.out], [324, 0.9, E.out], [342, 0, E.inOut]]);
  const hl = Object.fromEntries(HL.map((n) => [n, Math.max(hlAt(g, n), all)])) as Record<(typeof HL)[number], number>;
  const pl: Place = {x: RH.x, y: RH.y, scale: RH.s};
  const badges = HL.map((n, i) => {
    const t = EV[`B04.hl.${n}` as 'B04.hl.thumb'];
    const p = tipWorld('robot', 'front', n, pose, pl);
    return {n, i, t, x: p.x, y: p.y - 78 - (n === 'thumb' ? -10 : 0)};
  });
  return (
    <g>
      <Hand x={RH.x} y={RH.y} scale={RH.s} pose={pose} forearm={{stand: SURF}} highlight={hl} pulse={all * 0.5} />
      {badges.map((b) => {
        const k = sp(g, b.t, SNAP);
        const out = tw(g, B04.thirteen - 4, 6, E.in);
        if (k < 0.02 || out >= 1) return null;
        return (
          <g key={b.n} transform={`translate(${b.x} ${b.y}) scale(${k * (1 - out)})`}>
            <circle r={34} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={44} fill={C.ink}>{b.i + 1}</text>
          </g>
        );
      })}
    </g>
  );
};

export const B04Hud: React.FC<{g: number}> = ({g}) => {
  const tD = EV['B04.label.digits'];
  const t13 = B04.thirteen;
  const a = sp(g, tD, SNAP);
  const out = tw(g, t13 - 3, 4, E.in);
  const b = sp(g, t13, SNAP);
  const lit = Math.min(13, Math.max(0, Math.floor(((g - (t13 + 4)) / 38) * 13 + 1)));
  const wave = (i: number) => (g >= 437 ? Math.max(0, Math.sin(((g - 437 - i * 2.2) / 11) * Math.PI)) * (g < 437 + 11 * 2 + 40 ? 1 : 0) : 0);
  return (
    <g>
      {g >= tD && g < t13 + 2 && <Headline y={310} text="4 DIGITS" size={132} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}
      {g >= t13 && (
        <g>
          <g transform={`translate(262 292) scale(${b})`}>
            <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={200} fill={C.ink} stroke={C.cream} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">13</text>
          </g>
          <Headline x={400} y={258} text="WAYS" size={76} anchor="start" sx={b} sy={b} />
          <Headline x={400} y={328} text="TO MOVE" size={76} anchor="start" sx={b} sy={b} />
          {/* 13 identical dots: a count, not a per-finger breakdown */}
          <g transform="translate(150 396)">
            {Array.from({length: 13}).map((_, i) => {
              const on = i < lit;
              const k = on ? 1 + 0.45 * wave(i) : 1;
              return <circle key={i} cx={i * 41} cy={0} r={15 * k} fill={on ? C.coral : C.cream} stroke={C.ink} strokeWidth={4} />;
            })}
          </g>
          <text x={700} y={396} dy="0.36em" fontFamily={F.mono} fontWeight={500} fontSize={44} fill={C.ink}>13 DOF</text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ B05: pinch, turn, press (side-view robot hand) */

const sd = (n: 'thumb' | 'index' | 'middle' | 'ring') => defOf('robot', 'side', n)!;
const Lc = (pl: Place, v: V) => toLocal(v.x, v.y, pl.x, pl.y, pl.scale, pl.rot, pl.flip);

/** Two-finger pinch: thumb tip target + index tip target (world); middle/ring tuck alongside the index. */
export const pinchPose = (pl: Place, thumbT: V, indexT: V, tuck = 14): HandPose => {
  const idx = ikDigit(sd('index'), Lc(pl, indexT), 0, -1);
  const th = ikDigit(sd('thumb'), Lc(pl, thumbT), 0, 1);
  const tk = (extra: number): [number, number, number] => [idx.ang[0] + 4, idx.ang[1] + 6, idx.ang[2] + tuck + extra];
  return {index: idx, thumb: th, middle: {ang: tk(0)}, ring: {ang: tk(6)}};
};

/** horizontal extent of a die rotated by theta (deg) at height dy from its centre: returns the right boundary offset. */
const dieRight = (s: number, thetaDeg: number, dy: number) => {
  const t = (thetaDeg * Math.PI) / 180;
  const h = s / 2;
  const cs = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => ({x: x * Math.cos(t) - y * Math.sin(t), y: x * Math.sin(t) + y * Math.cos(t)}));
  let best = -1e9;
  for (let i = 0; i < 4; i++) {
    const a = cs[i], b = cs[(i + 1) % 4];
    if ((a.y - dy) * (b.y - dy) <= 0 && a.y !== b.y) {
      const u = (dy - a.y) / (b.y - a.y);
      best = Math.max(best, a.x + (b.x - a.x) * u);
    }
  }
  return best;
};

const S5 = 1.55; // side-view hand scale in B05
export const W5 = {x: 630, y: SURF - 90, r: 54}; // washer in its rack
export const DIE5 = {x: 630, y: 830, s: 108};

/** Shot (a): pinch the washer from its rack with the hand coming down from above. */
export const shotA = (g: number) => {
  const contact = EV['B05.washer.pinch'];
  const lift = E.inOut(tw(g, contact + 3, 11));
  const approach = E.out(tw(g, 489, 30));
  const gap = kf(g, [[489, 70, E.linear], [contact - 8, 62, E.inOut], [contact, 0, E.in]]);
  const wy = W5.y - 70 * lift;
  const pad = 26 * S5 * 0.92;
  const target = {thumb: {x: W5.x - W5.r - pad - gap, y: wy}, index: {x: W5.x + W5.r + pad + gap, y: wy}};
  const P: Place = {x: W5.x + 12, y: lerp(wy - 175 - 330, wy - 175, approach), scale: S5, rot: 90};
  const pose = pinchPose(P, target.thumb, target.index);
  return {P, pose, wy};
};

export const ShotA: React.FC<{g: number}> = ({g}) => {
  const {P, pose, wy} = shotA(g);
  const contact = EV['B05.washer.pinch'];
  return (
    <g>
      <Shadow x={W5.x} rx={108} />
      <g>
        <rect x={W5.x - 80} y={SURF - 44} width={160} height={44} rx={10} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={W5.x - 12} y={SURF - 44} width={24} height={14} fill={C.ink} opacity={0.6} />
      </g>
      <Washer x={W5.x} y={wy} r={W5.r} />
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} pose={pose} forearm={{to: {x: P.x, y: -260}}} />
      <Burst x={W5.x} y={wy - 6} t={(g - contact) / 9} r0={W5.r + 40} r1={W5.r + 90} n={8} color={C.coral} w={6} />
    </g>
  );
};

/** Shot (b): in-hand rotation of a compact object; pads slide along its sides while it turns. */
export const shotB = (g: number) => {
  const t0 = EV['B05.object.rotate'];
  const theta = 90 * E.inOut(tw(g, t0, 17));
  const approach = E.out(tw(g, EV['B05.iris.rotate'] - 6, 12));
  const dy = 0.3 * DIE5.s * (Math.sin((theta * Math.PI) / 180) - Math.cos((theta * Math.PI) / 180));
  const xr = dieRight(DIE5.s, theta, dy);
  const pad = 26 * S5 * 0.92;
  const cx = DIE5.x, cy = DIE5.y + 8 * Math.sin((theta * Math.PI) / 90);
  const target = {index: {x: cx + xr + pad, y: cy + dy}, thumb: {x: cx - xr - pad, y: cy - dy}};
  const P: Place = {x: cx + 12, y: cy - 175 - 60 * (1 - approach), scale: S5, rot: 90};
  return {P, pose: pinchPose(P, target.thumb, target.index), theta, cx, cy};
};

export const ShotB: React.FC<{g: number}> = ({g}) => {
  const {P, pose, theta, cx, cy} = shotB(g);
  const t0 = EV['B05.object.rotate'];
  const arc = clamp01((g - t0) / 5) * (1 - clamp01((g - t0 - 17) / 6));
  return (
    <g>
      <Die x={cx} y={cy} s={DIE5.s} rot={theta} />
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} rot={P.rot} pose={pose} forearm={{to: {x: P.x, y: -260}}} />
      {arc > 0 && (
        <g transform={`translate(${cx} ${cy})`} opacity={arc} fill="none" stroke={C.coral} strokeWidth={7} strokeLinecap="round">
          <path d="M -86 -34 A 92 92 0 0 1 20 -90" />
          <path d="M 4 -104 L 24 -88 L 2 -76" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/** Shot (c): pistol-grip tool, index on the trigger. */
const TP = {x: 500, y: 860, s: 1.4};
export const shotC = (g: number) => {
  const press = kf(g, [[EV['B05.trigger.press'], 0, E.inOut], [EV['B05.trigger.contact'], 1, E.in], [EV['B05.card.morph'], 1, E.linear]]);
  const bob = 5 * drift(g, 4, 60);
  const P: Place = {x: TP.x, y: TP.y + bob, scale: TP.s};
  const L = (x: number, y: number) => toLocal(P.x + x * P.scale, P.y + y * P.scale, P.x, P.y, P.scale);
  const trig = {x: TOOL.trigX + 10 - 9 * press, y: TOOL.trigY + 8 + 3 * press};
  const pose: HandPose = {
    index: ikDigit(sd('index'), L(trig.x, trig.y), 74, -1),
    middle: ikDigit(sd('middle'), L(TOOL.handleX1 + 6, 0), 118, -1),
    ring: ikDigit(sd('ring'), L(TOOL.handleX1 + 6, 36), 124, -1),
    thumb: ikDigit(sd('thumb'), L(TOOL.handleX0 + 44, TOOL.handleY0 - 4), -52, 1),
  };
  return {P, pose, press};
};

export const ShotC: React.FC<{g: number}> = ({g}) => {
  const {P, pose, press} = shotC(g);
  const hit = EV['B05.trigger.contact'];
  return (
    <g>
      <Hand view="side" x={P.x} y={P.y} scale={P.scale} pose={pose} forearm={{to: {x: -100, y: P.y + 640}}}>
        <Tool press={press} />
      </Hand>
      <g transform={`translate(${P.x + 226 * P.scale} ${P.y - 111 * P.scale})`}>
        <Burst x={30} y={0} t={(g - hit) / 12} r0={20} r1={64} n={6} color={C.saffron} w={7} />
      </g>
      <Burst x={P.x + (TOOL.trigX + 14) * P.scale} y={P.y + (TOOL.trigY + 8) * P.scale} t={(g - hit) / 10} r0={46} r1={92} n={8} color={C.coral} w={6} />
    </g>
  );
};

export const B05Hud: React.FC<{g: number}> = ({g}) => {
  const items = [
    {t: EV['B05.washer.pinch'] - 2, text: 'PINCH.'},
    {t: EV['B05.iris.rotate'] + 2, text: 'TURN.'},
    {t: EV['B05.iris.trigger'] + 2, text: 'PRESS.'},
  ];
  return (
    <g>
      {items.map((it, i) => {
        const next = items[i + 1]?.t ?? EV['B05.card.morph'] - 2;
        if (g < it.t || g >= next + 3) return null;
        const k = sp(g, it.t, SNAP);
        const out = tw(g, next - 2, 4, E.in);
        return <Headline key={i} x={110} anchor="start" y={330} text={it.text} size={140} sx={k * (1 - out) + 0.001} sy={k * (1 - out) + 0.001} />;
      })}
    </g>
  );
};
