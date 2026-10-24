// V4 atrium scene: the hall, its crowd, the demonstration transmitter and the two leads, painted far to near
// through one camera. `ir` renders the infrared-camera view (the beam visualised; everything else dimmed).
import React from 'react';
import {B, cardOf, cardPt, V3, v3, proj} from './rig/geo4';
import {Crew4} from './rig/Crew4';
import {BODY_P, GUESSER, CLERK, INK} from './rig/cast4';
import {handFrame} from './rig/Crew4';
import {AtriumShell, atriumItems, plant, demoStand} from './atrium4';
import {Item, paint, depthOf, line} from './draw3';
import {transmitter, exitRay} from './transmitter4';
import {EXTRA_LIST, extraAt, MACHINE, leadAt, friendAt, CharState, AIM, W_LANE} from './story4';
import {ATR} from './atrium4';

/** a paper coffee cup in a hand (card-local, drawn in screen space at the wrist) */
export const cupNode = (s: CharState, cd: ReturnType<typeof cardOf>, side: number, key: string) => {
  const hf = handFrame(BODY_P, s.pose, side);
  const p = cardPt(cd, v3(hf.W.x, hf.W.y + 6, hf.W.z + 8));
  const k = cd.k;
  return (
    <g key={key} transform={`translate(${p.x} ${p.y}) scale(${k})`}>
      <path d="M -17 -34 L 17 -34 L 13 22 L -13 22 Z" fill="#FAF3DF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -16 -16 L 16 -16 L 15 2 L -15 2 Z" fill="#C0392B" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-20} y={-44} width={40} height={11} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
    </g>
  );
};

export type Who = {s: CharState; look: typeof GUESSER; id: string; cup?: number};
export const charItem = (b: B, w: Who, t: number): Item => {
  const cd = cardOf(b, w.s.ground, w.s.heading);
  if (cd.depth < 0.25) return {d: cd.depth, node: null};
  return {
    d: cd.depth,
    node: <Crew4 key={w.id} id={w.id} look={w.look} b={BODY_P} pose={w.s.pose} cd={cd} t={t} front={w.cup ? cupNode(w.s, cd, w.cup, `${w.id}cup`) : undefined} />,
  };
};

export type AtriumOpts = {spin?: number; led?: number; open?: number; extras?: boolean};
export const atriumAim = (_t: number) => AIM;

/** All paint items of the atrium at time t (characters given by the caller so a scene can stage them). */
export const atriumPaint = (b: B, t: number, who: Who[], o: AtriumOpts = {}): Item[] => {
  const items: Item[] = [...atriumItems(b, t)];
  items.push(plant(b, -7.4, 5.7, 1.0, 'pA', t), plant(b, 9.6, 5.7, 1.1, 'pB', t), plant(b, -8.0, 1.5, 1.2, 'pC', t), plant(b, 3.0, -0.6, 1.3, 'pD', t));
  items.push(...demoStand(b, MACHINE, 'stand'));
  const aim = atriumAim(t);
  items.push(...transmitter(b, MACHINE, aim.yaw, aim.pitch, {key: 'tx', mount: 'tripod', led: o.led ?? 1, spin: o.spin ?? t * 40, open: o.open ?? 0}));
  if (o.extras !== false) {
    for (const e of EXTRA_LIST) {
      const s = extraAt(e, t);
      // the lane tiles every W_LANE: draw every copy inside the hall
      for (let n = -2; n <= 2; n++) {
        const x = s.ground.x + n * W_LANE;
        if (x < ATR.x0 + 1 || x > ATR.x1 - 1) continue;
        items.push(charItem(b, {s: {...s, ground: v3(x, s.ground.y, s.ground.z)}, look: e.look, id: `ex${e.z}${n}`}, t));
      }
    }
  }
  for (const w of who) items.push(charItem(b, w, t));
  return items;
};

export const AtriumView: React.FC<{b: B; t: number; who: Who[]; o?: AtriumOpts}> = ({b, t, who, o}) => (
  <g>
    <AtriumShell b={b} />
    {paint(atriumPaint(b, t, who, o))}
  </g>
);
export {proj, depthOf, line, exitRay, leadAt, friendAt};
export type {V3};
