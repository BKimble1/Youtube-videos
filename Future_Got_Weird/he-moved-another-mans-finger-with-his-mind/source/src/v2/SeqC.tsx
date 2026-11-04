// V2 Sequence C: "the route" (44.64 -> 90.0 s), one physically connected chain from Rao's game to Stocco's finger
// and back into the game. Parts: c_rao.tsx (game -> Rao -> brain rhythm -> EEG computer -> cursor -> the command
// leaves the lab), c_campus.tsx (overhead campus -> skylight dive -> TMS machine, coil, motor cortex, pathway),
// c_end.tsx (hand ECU -> cannon -> Rao's shoulder -> Stocco's tic -> into the game he never sees).
import React from 'react';
import {FPS} from './core2';
import {RaoShot} from './c_rao';
import {CampusShot, campusStart} from './c_campus';
import {EcuShot, EndShot, GameRaoShot} from './c_end';
import {ct} from './c_time';

export const VC: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const c = ct();
  if (t < campusStart()) return <RaoShot t={t} f={f} />;
  if (t < c.ecu) return <CampusShot t={t} f={f} />;
  if (t < c.cut) return <EcuShot t={t} f={f} />;
  if (t < c.imagine - 0.2) return <GameRaoShot t={t} f={f} />;
  return <EndShot t={t} f={f} />;
};

/** sound cues (absolute seconds; gain in dB): restrained, on the physical events of the chain */
export const CUES_VC = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const c = ct();
  return [
    {t: c.rocket, kind: 'rocket_launch'},
    {t: c.changes + 0.05, kind: 'tick', gain: -9},
    {t: c.target, kind: 'pop', gain: -6},
    {t: c.sends, kind: 'packet_send'},
    {t: c.fire - 0.02, kind: 'packet_arrive', gain: -3},
    {t: c.fireE + 0.25, kind: 'whoosh', gain: -12},
    {t: c.command2 + 0.2, kind: 'tick', gain: -6},
    {t: c.pulse, kind: 'coil_pulse'},
    {t: c.contact, kind: 'key_click'},
    {t: c.cut, kind: 'cannon'},
    {t: c.hit, kind: 'boom'},
    {t: c.raoScreenE - 0.1, kind: 'whoosh', gain: -12},
  ];
};
