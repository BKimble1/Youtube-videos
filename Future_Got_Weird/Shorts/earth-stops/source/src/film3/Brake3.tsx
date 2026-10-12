import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {GlobeP, Globe3, GlobeBack, SpaceBG} from './Globe3';
import {T} from './timeline3';

/**
 * The fictional brake (an impossible visual metaphor, not technology): a saffron-and-ink caliper with two broad coral pads that close on a rotor ring around Earth's equator.
 * The pads grip the RING, not the planet: the sphere is never squeezed or deformed, and the stop reads as spin arrested. Contact is a clean lock, 3 px of recoil, no shock ring.
 *
 * Loop contract: `t` is the frame relative to the film's frame 0 (the tail of the film calls it with f - N). t = 0 is frame 0: the pads are already closing; contact is t = T.brakeContact.
 */
export const BK = {cx: 440, cy: 1090, R: 390, spin: 4, G0: 130, PT: 64, AT: 54, TH: 30};
export const OMEGA_DEG = BK.spin; // degrees of longitude per frame while the planet turns freely
const CONTACT = T.brakeContact;

/** distance from each pad face to the ring edge (px): 130 when open, 0 at contact. Closing accelerates (strain), so frame 0 is already well under way. */
export const padGap = (t: number) => (t >= CONTACT ? 0 : t <= -16 ? BK.G0 : BK.G0 * (1 - Math.pow((t + 16) / (CONTACT + 16), 2.1)));
/** the planet turns at OMEGA until the pads lock on `CONTACT`, then it is still */
export const spinRot = (t: number, rot0 = 40) => rot0 + OMEGA_DEG * Math.min(t, CONTACT);
export const recoil = (t: number) => (t < CONTACT || t > CONTACT + 5 ? 0 : 3.2 * Math.exp(-(t - CONTACT) * 0.7) * Math.cos((t - CONTACT) * 1.1));

export const Caliper: React.FC<{t: number; open?: number}> = ({t, open = 1}) => {
  const {cx, cy, R, PT, AT, TH} = BK;
  const g = padGap(t), rc = recoil(t);
  const px1 = cx + 1.07 * R + 4, px0 = px1 - 150;
  const sq = t >= CONTACT && t < CONTACT + 4 ? 3 : 0; // the pads settle 3 px into the ring faces
  const d = TH + g - sq; // pad face distance from the equator
  const outer = d + PT + 10 + AT; // outer face of an arm
  const wallX = px1 + 36;
  const armT = (dir: 1 | -1) => ({y: dir === 1 ? cy + d + PT + 10 : cy - d - PT - 10 - AT});
  const Pad: React.FC<{dir: 1 | -1}> = ({dir}) => {
    const y0 = dir === 1 ? cy + d : cy - d - PT;
    return (
      <g>
        <rect x={px0 - 6} y={dir === 1 ? y0 + PT : y0 - 10} width={px1 - px0 + 12} height={10} fill={C.ink} />
        <rect x={px0} y={y0} width={px1 - px0} height={PT} rx={14} fill={C.coral} stroke={C.ink} strokeWidth={6} />
        <rect x={px0 + 10} y={dir === 1 ? y0 + 8 : y0 + PT - 18} width={px1 - px0 - 20} height={10} rx={5} fill={C.coralDeep} opacity={0.9} />
        {[px0 + 24, px1 - 24].map((x) => <circle key={x} cx={x} cy={dir === 1 ? y0 + PT - 18 : y0 + 18} r={6} fill={C.saffronLight} stroke={C.ink} strokeWidth={3} />)}
      </g>
    );
  };
  const Arm: React.FC<{dir: 1 | -1}> = ({dir}) => {
    const y = armT(dir).y;
    return (
      <g>
        <rect x={px0 - 30} y={y} width={wallX + AT - px0 + 30} height={AT} rx={8} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
        <rect x={px0 - 22} y={y + (dir === 1 ? AT - 15 : 6)} width={wallX + AT - px0 + 14} height={9} rx={4} fill={C.saffronLight} opacity={0.85} />
      </g>
    );
  };
  return (
    <g transform={`translate(${rc} 0)`} opacity={open}>
      {/* the mounting beam out to the frame edge */}
      <rect x={wallX + AT - 6} y={cy - 78} width={W - wallX - AT + 200} height={156} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
      <rect x={wallX + AT - 6} y={cy - 78} width={W - wallX - AT + 200} height={20} fill={C.saffronLight} opacity={0.8} />
      {[0, 1].map((i) => <circle key={i} cx={wallX + AT + 50 + i * 80} cy={cy} r={11} fill={C.saffronDeep} stroke={C.ink} strokeWidth={4} />)}
      <rect x={wallX} y={cy - outer} width={AT} height={2 * outer} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
      <Arm dir={-1} />
      <Arm dir={1} />
      <Pad dir={-1} />
      <Pad dir={1} />
    </g>
  );
};

/** whole brake picture for relative frame t. `caliperIn` slides the bracket in from the right (finale); `ringK` is the ring's size (the equator line grows into it in the finale). */
export const BrakeScene: React.FC<{t: number; caliperIn?: number; ringK?: number; line?: number; rot0?: number; tilt?: number}> = ({t, caliperIn = 1, ringK = 1, line = 0, rot0 = 40, tilt = 0}) => {
  const rot = spinRot(t, rot0), spinning = t < CONTACT;
  const g: GlobeP = {cx: BK.cx, cy: BK.cy, R: BK.R, rot, tilt, id: 'gb', cloud: rot * 0.35, blur: spinning ? 6 : 0, ring: ringK, line};
  const slide = (1 - caliperIn) * 520;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <SpaceBG id="bkbg" glowX={BK.cx + 60} glowY={BK.cy} />
      <GlobeBack {...g} />
      <Globe3 {...g} />
      <g transform={`translate(${slide} 0)`}><Caliper t={t} /></g>
    </svg>
  );
};

/** the dive: a fast punch-in at the contact point after the lock (f15-19), then the action cut */
export const diveScale = (f: number) => 1 + 1.35 * E.in(Math.max(0, Math.min(1, (f - T.diveA) / (T.cutStreet - T.diveA))));
export const DIVE_AT = {x: BK.cx + 0.98 * BK.R - 60, y: BK.cy};
