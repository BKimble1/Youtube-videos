// Opening and closing macro: the same composition (same centre, same scale at 0.00 s and 28.00 s).
import React from 'react';
import {Shot} from '../plan4';
import {ImplantMacro} from '../art/Implant';
import {clamp, easeInOut} from '../../lib/math';

/** how uneasy the implant looks: starts uneasy at frame 0 and settles to the calm blue as "this brain chip" is said; the
 *  closing shot rises back to the same value so 28.00 s meets 0.00 s */
export const uneasyAt = (t: number) => (t < 1.2 ? 0.55 * (1 - easeInOut(clamp(t / 1.0))) : t >= 27.4 ? 0.1 + 0.45 * easeInOut(clamp((t - 27.4) / 0.6)) : 0);

export const macroShot = (id: 'macro' | 'macroEnd', t: number, f: number, lt: number, shot: Shot): React.ReactNode => {
  // opening: slow push 1.0 -> 1.05; closing: pull back 1.05 -> 1.0, ending exactly on the opening frame
  const dur = shot.b - shot.a;
  const zoom = id === 'macro' ? 1 + 0.05 * easeInOut(clamp(lt / dur)) : 1.05 - 0.05 * easeInOut(clamp(lt / dur));
  const pulses: (number | [number, number])[] = id === 'macro' ? [0.4, 0.72] : [[27.42, 0.5]];
  return (
    <g>
      <ImplantMacro t={t} f={f} uneasy={uneasyAt(t)} pulses={pulses} zoom={zoom} />
    </g>
  );
};
