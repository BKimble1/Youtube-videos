// V3 Sequence C: "the route" (44.64 -> 90.0 s), one physically connected cause-and-effect chain from Rao's game to
// Stocco's finger and back into the game.
//  c_rao.tsx     game -> pull back through Rao's screen -> his concentration and the imagined hand -> the cap over his
//                left motor cortex -> the rhythm rides the wire to the EEG computer -> the cursor climbs -> the one
//                FIRE command leaves through the wall jack
//  c_campus.tsx  the command crosses campus (true perspective, overhead) into Stocco's building
//  c_stocco.tsx  Stocco's room from behind: jack -> receiving computer -> TMS machine -> coil on his LEFT motor
//                cortex -> the pulse -> the pathway down his right arm; later his reaction (front view) and the
//                "missing the entire game" beat, ending in the empty network port (GAME_FULL contract)
//  c_end.tsx     the finger ECU (involuntary jerk, drop, contact) -> cut on the press to the cannon -> back out of
//                Rao's screen to his relief
import React from 'react';
import {FPS} from './core2';
import {RaoShot} from './c_rao';
import {CampusShot, campusEnd, campusStart} from './c_campus';
import {CannonRaoShot, EcuShot} from './c_end';
import {StoccoEndShot, StoccoFrontShot, StoccoShotA} from './c_stocco';
import {ct} from './c_time';

export const VC: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const c = ct();
  if (t < campusStart()) return <RaoShot t={t} f={f} />;
  if (t < campusEnd()) return <CampusShot t={t} f={f} />;
  if (t < c.ecu) return <StoccoShotA t={t} f={f} />;
  if (t < c.cut) return <EcuShot t={t} f={f} />;
  if (t < c.front) return <CannonRaoShot t={t} f={f} />;
  if (t < c.back) return <StoccoFrontShot t={t} f={f} />;
  return <StoccoEndShot t={t} f={f} />;
};

/** sound cues (absolute seconds; gain in dB): restrained, on the physical events of the chain */
export const CUES_VC = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const c = ct();
  return [
    {t: c.rocket, kind: 'rocket_launch'},
    {t: c.target, kind: 'pop', gain: -6},
    {t: c.sends, kind: 'packet_send'},
    {t: c.fire - 0.02, kind: 'packet_arrive', gain: -3},
    {t: c.sRoom + 0.5, kind: 'tick', gain: -9},
    {t: c.pulse, kind: 'coil_pulse'},
    {t: c.contact, kind: 'key_click'},
    {t: c.cut, kind: 'cannon'},
    {t: c.hit, kind: 'boom'},
  ];
};
