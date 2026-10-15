// V5 foundry view: the V4 set pieces in the same geography, with the heat glow split in two so it lights the room
// behind the robots but never washes over them (V4 drew it on top, which made the robot read as a ghost near the ladle).
import React from 'react';
import {Cam, Layer} from '../../v4/kit/scene';
import {FoundryBack, Deck, LadleBack, LadleFront, Embers, Booth, Disturb, FD} from '../../v4/sets/foundry';

/** Warm screen-blended glow centred on the molten surface (unique gradient id per instance). */
export const Glow5: React.FC<{k?: number; id: string; r?: number; cx?: number; cy?: number; color?: string}> = ({k = 1, id, r = 900, cx = FD.ladle.cx, cy = FD.ladle.surf - 40, color = '#FFB04A'}) => {
  if (k <= 0.001) return null;
  return (
    <g style={{mixBlendMode: 'screen'}} pointerEvents="none">
      <defs>
        <radialGradient id={id} cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity={0.42 * k} />
          <stop offset="0.4" stopColor="#FF7A22" stopOpacity={0.16 * k} />
          <stop offset="1" stopColor="#FF7A22" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={cx - 1800} y={cy - 1500} width={3600} height={2800} fill={`url(#${id})`} />
    </g>
  );
};

export type FoundryProps = {
  cam: Cam; t: number; hit?: Disturb; scar?: number;
  behind?: React.ReactNode;   // after the deck (robots on the deck)
  inside?: React.ReactNode;   // between the ladle's back half and its front lip (robot in the vessel, splash)
  front?: React.ReactNode;    // after the front lip (foreground props)
  booth?: React.ReactNode; deck?: boolean; glow?: number; glowFront?: number; lights?: number; embers?: number;
  extraBack?: React.ReactNode; hook?: boolean; id?: string;
};

export const FoundryView5: React.FC<FoundryProps> = ({cam, t, hit, scar, behind, inside, front, booth, deck = true, glow = 1, glowFront = 0.18, lights = 1, embers = 1, extraBack, hook = true, id = 'f5'}) => {
  const lw = 4 / cam.z;
  return (
    <g>
      <Layer cam={cam} p={0.6}><FoundryBack lw={4 / (1 + (cam.z - 1) * 0.6)} t={t} lights={lights} hook={hook} /></Layer>
      <Layer cam={cam}>
        {extraBack}
        {booth !== undefined ? <Booth lw={lw}>{booth}</Booth> : null}
        <Glow5 k={glow} id={id + 'gb'} />
        {deck ? <Deck lw={lw} /> : null}
        {behind}
        <LadleBack lw={lw} t={t} hit={hit} scar={scar} />
        {inside}
        <LadleFront lw={lw} glow={glow} />
        {embers > 0 ? <g opacity={embers}><Embers t={t} lw={lw} n={18} /></g> : null}
        <Glow5 k={glowFront * glow} id={id + 'gf'} r={700} />
        {front}
      </Layer>
    </g>
  );
};
export {FD};
