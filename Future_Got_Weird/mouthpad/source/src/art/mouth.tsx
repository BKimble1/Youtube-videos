// The guesser's mouth when it opens: lips, the dark cavity, the upper arch with the MouthPad (the shared 3D model,
// seen from slightly below so the palate and the gold pad show behind the front teeth), the lower teeth and the
// tongue. Drawn in the rig's head space (head centre at 0, CREW_HEAD.y) so it rides every head tilt, and so a camera
// push from the wide shot into the mouth is one continuous move through the same drawing.
import React from 'react';
import {clamp, lerp, smoothPath, P} from '../lib';
import {Jaw, View, projector, padPoint} from './jaw3d';

export const HEAD_Y = -372;
export const MOUTH_TOP = HEAD_Y + 22; // the upper lip line when open (just under the nose)
export const LIP = '#D9837A';
export const LIP_DARK = '#B95F5A';
const INK = '#162A32';

export type MouthState = {
  open: number; // 0 closed .. 1 wide "aah"
  smile?: number; // corners lifted
  tongueLift?: number; // 0 rest .. 1 the tip up on the pad
  u?: number; v?: number; // where the tip touches the pad (-1..1)
  press?: number; // 0..1 pressing up (click)
  glow?: number; // pad glow / contact glow
  pitch?: number; // view into the mouth (default -60: from below)
  yaw?: number;
};

/** the mouth view used inside the lips */
export const mouthView = (m: MouthState): View => ({yaw: m.yaw ?? 0, pitch: m.pitch ?? -60, persp: 260});
const MM = 0.58; // rig units per millimetre inside the mouth

/** geometry of the opening for an open amount */
export const opening = (m: MouthState) => {
  const o = clamp(m.open);
  const w = 13 + 8 * o; // half width
  const h = 3 + 31 * o; // height
  const s = (m.smile ?? 0) * 4;
  const top = MOUTH_TOP + 4 - 3 * o;
  return {w, h, s, top, bot: top + h};
};
const openingPath = (m: MouthState) => {
  const {w, h, s, top} = opening(m);
  const L = {x: -w, y: top + h * 0.3 - s}, R = {x: w, y: top + h * 0.3 - s};
  return `M ${L.x} ${L.y} C ${-w * 0.7} ${top - 1} ${w * 0.7} ${top - 1} ${R.x} ${R.y} C ${w * 0.95} ${top + h * 0.95} ${w * 0.45} ${top + h} 0 ${top + h} C ${-w * 0.45} ${top + h} ${-w * 0.95} ${top + h * 0.95} ${L.x} ${L.y} Z`;
};

/** where the upper arch sits inside the opening: model mm → head space */
export const jawPlacement = (m: MouthState) => {
  const v = mouthView(m);
  const pr = projector(v);
  const inc = pr({x: 0, y: 0, z: 20});
  const {top, h} = opening(m);
  // the incisal edge sits about a quarter of the way down the opening
  const ty = top + Math.max(4, h * 0.22);
  return {v, k: MM, tx: -inc.x * MM, ty: ty - inc.y * MM};
};
/** head-space position of a pad point, for effects and for the tongue tip */
export const padInHead = (m: MouthState, u: number, vv: number): P => {
  const J = jawPlacement(m);
  const p = projector(J.v)(padPoint(u, vv, 0.5));
  return {x: J.tx + p.x * J.k, y: J.ty + p.y * J.k};
};

export const OpenMouth: React.FC<{m: MouthState; id: string; px: number}> = ({m, id, px}) => {
  const o = clamp(m.open);
  const {w, h, top} = opening(m);
  const bot = top + h;
  const J = jawPlacement(m);
  const lift = clamp(m.tongueLift ?? 0);
  const press = clamp(m.press ?? 0);
  const glow = m.glow ?? 0;
  const u = m.u ?? 0, vv = m.v ?? 0;
  // tongue: a mound on the floor of the mouth; its tip rises to the pad
  const tipRest = {x: 0, y: bot - h * 0.42};
  const tipPad = padInHead(m, u, vv);
  const tip = {x: lerp(tipRest.x, tipPad.x, lift), y: lerp(tipRest.y, tipPad.y + 1.2 - press * 1.2, lift)};
  const tw = lerp(w * 0.62, w * 0.42, lift); // half width at the base
  const tongue: P[] = [
    {x: -tw - 6, y: bot + 6},
    {x: -tw, y: lerp(bot - h * 0.25, bot - h * 0.35, lift)},
    {x: lerp(-w * 0.45, tip.x - 6.5, lift), y: lerp(tipRest.y + 2, tip.y + 5, lift)},
    {x: tip.x, y: tip.y},
    {x: lerp(w * 0.45, tip.x + 6.5, lift), y: lerp(tipRest.y + 2, tip.y + 5, lift)},
    {x: tw, y: lerp(bot - h * 0.25, bot - h * 0.35, lift)},
    {x: tw + 6, y: bot + 6},
  ];
  const lw = Math.max(1.6, Math.min(5, px * 1.2));
  const contact = lift > 0.85 ? {u, v: vv, press, glow: glow * clamp((lift - 0.85) / 0.15)} : null;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-op`}><path d={openingPath(m)} /></clipPath>
        <radialGradient id={`${id}-cav`} cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#3A0F1A" />
          <stop offset="1" stopColor="#7A2A36" />
        </radialGradient>
        <linearGradient id={`${id}-tg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F49AA2" />
          <stop offset="1" stopColor="#D9667A" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-op)`}>
        <path d={openingPath(m)} fill={`url(#${id}-cav)`} />
        {o > 0.12 && (
          <g transform={`translate(${J.tx} ${J.ty}) scale(${J.k})`} opacity={clamp((o - 0.12) / 0.15)}>
            <Jaw view={J.v} px={px * J.k} id={`${id}-jaw`} padGlow={glow * 0.6 * (1 - lift)} contact={contact} />
          </g>
        )}
        {/* lower teeth */}
        {o > 0.2 && (
          <g opacity={clamp((o - 0.2) / 0.2)}>
            <path d={`M ${-w * 0.8} ${bot - 1} Q 0 ${bot - 8 - h * 0.08} ${w * 0.8} ${bot - 1} L ${w * 0.8} ${bot + 4} L ${-w * 0.8} ${bot + 4} Z`} fill="#F4EEDD" stroke={INK} strokeWidth={lw * 0.6} vectorEffect="non-scaling-stroke" />
            {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
              <line key={i} x1={i * w * 0.2} y1={bot - 5 - h * 0.06 * (1 - Math.abs(i) / 4)} x2={i * w * 0.2} y2={bot + 2} stroke="#CDBE9F" strokeWidth={lw * 0.5} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        )}
        <path d={smoothPath(tongue, false)} fill={`url(#${id}-tg)`} stroke={INK} strokeWidth={lw * 0.7} vectorEffect="non-scaling-stroke" />
        <path d={`M ${tip.x} ${tip.y + 4} Q ${tip.x - 0.5} ${lerp(tip.y + 10, bot, 0.5)} ${tip.x * 0.4} ${bot}`} fill="none" stroke="#C9576A" strokeWidth={lw * 0.6} vectorEffect="non-scaling-stroke" opacity={0.6} />
        {contact && glow > 0 && (
          <g>
            <circle cx={tip.x} cy={tip.y} r={5 + 3 * press} fill="#FFF3B0" opacity={0.35 * contact.glow!} />
            <circle cx={tip.x} cy={tip.y} r={2.4 + 2.4 * press} fill="none" stroke="#FFFFFF" strokeWidth={lw * 0.8} vectorEffect="non-scaling-stroke" opacity={0.9 * contact.glow!} />
          </g>
        )}
      </g>
      {/* lips */}
      <path d={openingPath(m)} fill="none" stroke={LIP_DARK} strokeWidth={lw * 1.9} vectorEffect="non-scaling-stroke" opacity={0.55} />
      <path d={openingPath(m)} fill="none" stroke={INK} strokeWidth={lw} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </g>
  );
};
