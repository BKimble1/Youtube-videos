// Composed views: the foundry and the teaching stage rendered under a camera with slots for robots and effects.
import React from 'react';
import {Cam, Layer} from '../kit/scene';
import {FoundryBack, Deck, LadleBack, LadleFront, HeatGlow, Embers, Booth, Disturb, FD} from './foundry';
import {StageBack, Tower, Pad} from './stage';

export const FoundryView: React.FC<{cam: Cam; t: number; hit?: Disturb; scar?: number; behind?: React.ReactNode; inside?: React.ReactNode; front?: React.ReactNode; booth?: React.ReactNode; deck?: boolean; glow?: number; lights?: number; extraBack?: React.ReactNode; hook?: boolean}> =
  ({cam, t, hit, scar, behind, inside, front, booth, deck = true, glow = 1, lights = 1, extraBack, hook = true}) => {
    const lw = 4 / cam.z;
    return (
      <g>
        <Layer cam={cam} p={0.6}><FoundryBack lw={4 / (1 + (cam.z - 1) * 0.6)} t={t} lights={lights} hook={hook} /></Layer>
        <Layer cam={cam}>
          {extraBack}
          {booth !== undefined ? <Booth lw={lw}>{booth}</Booth> : null}
          {deck ? <Deck lw={lw} /> : null}
          {behind}
          <LadleBack lw={lw} t={t} hit={hit} scar={scar} />
          {inside}
          <LadleFront lw={lw} glow={glow} />
          <Embers t={t} lw={lw} />
          <HeatGlow k={glow} />
          {front}
        </Layer>
      </g>
    );
  };

export const StageView: React.FC<{cam: Cam; grid?: number; pulse?: number; bad?: boolean; behind?: React.ReactNode; onPad?: React.ReactNode; front?: React.ReactNode; tower?: boolean; pad?: boolean; target?: boolean}> =
  ({cam, grid = 0.5, pulse = 0, bad, behind, onPad, front, tower = true, pad = true, target = true}) => {
    const lw = 4 / cam.z;
    return (
      <g>
        <Layer cam={cam}>
          <StageBack lw={lw} grid={grid} />
          {behind}
          {tower ? <Tower lw={lw} /> : null}
          {pad ? <Pad lw={lw} pulse={pulse} bad={bad} target={target} /> : null}
          {onPad}
          {front}
        </Layer>
      </g>
    );
  };
export {FD};
