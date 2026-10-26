// V3 beat F (18.79-25.61): upward lightning and the measured guided section, one main view (demoCam).
//   18.79-19.6  E's pull-out carries straight on (one move, C1/C2 in ln Z at 18.79): demoCam zooms out about P0 from
//               Z_HAND to the main view (cams3 demoZoom), the macro channel only (warm haze, cyan line); the rod tip
//               and the mast rise into frame, the cloud base above
//   19.1-19.55  the field builds at the rod tip (violet glow, short streamers reaching up the cyan path)
//   19.55-20.95 the upward leader incepts at the tip and climbs the guided section along the cyan line ("UPWARD"
//               19.99); the line glows softly ahead of it
//   20.95-21.85 past the guided section it leaves the line, branches (restrained) and races to the cloud base
//   21.85       connection: the guided section strengthens, the cloud base is lit locally where the bolt meets it, the
//               tower catches the light (Scene3); the wash stays local (FlashWash, under the bolt)
//   22.3-23.3   "part of the bolt / followed that CHANNEL": the rest of the bolt settles to an afterglow while the
//               guided section stays the brightest part, hugging the cyan line (from "followed" the cyan path shows
//               as a cyan edge on both sides of its white core, held to the end); a surge runs up it on "followed"
//   23.3-24.3   one restrained widening (a short dolly straight back, held about the rod tip; cams3 DEMO0 -> DEMO1):
//               the rod tip stays put, the measured segment stays large (about 10% shorter), a little more storm
//               opens above, and the tower's concrete deck only reaches the bottom edge, below the caption band
//   23.64-24.34 the 160+ ft bracket grows from the tip up the guided section ("one hundred"); label on "sixty"
//   24.3-25.61  the result registers: bracket, label, the guided section bright in the afterglow, the cyan line
//               running on into the cloud; hard cut to G at 25.61
// The bolt is DischargeF (Demo3_discharge.tsx, Discharge3D with its side streamers held back), drawn as View3's
// child with dk = 0 so View3's bolt-lit sky and FlashWash still follow the leader. Every layer over the scene is
// screen-blended, so drawing the haze after the bolt looks the same as Beam3D's haze under it.
import React from 'react';
import {clamp, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {boltLight} from '../world/site';
import {BOLT3} from '../v2/p3';
import {demoCam, demoZoom} from './cams3';
import {demoSt} from './states3';
import {EV} from './timeline3';
import {St, View3} from './view3';
import {DemoFx, DemoHaze, Fx} from './Demo3_fx';
import {Bracket160} from './Demo3_bracket';
import {DischargeF} from './Demo3_discharge';

// ------------------------------------------------------------------ the discharge light
const C0 = EV.demoConnect;
/** the whole bolt: the leader's core, then the connection flash with its re-strokes (boltLight), settling to an
 *  afterglow that holds (slowly fading) until the cut at 25.61; the scene light stays local and decays */
const fLight = (t: number) => {
  if (t < C0) return {core: 0.85, scene: 0.15}; // (the leader lights the mast head a little: "from a nearby TOWER")
  const dt = t - C0;
  const b = boltLight(dt, 1.5);
  const hold = (0.4 + 0.5 * Math.exp(-dt / 0.55)) * (0.94 + 0.06 * noise1(t * 9, 171)) * (1 - 0.15 * ss(t, 23.5, 25.6));
  return {core: Math.max(b.core, hold), scene: Math.max(b.scene, 0.1 + 0.12 * Math.exp(-dt / 1.0))};
};
/** F's state: demoSt (leader length, packets, corona) with F's own light, haze and bracket (drawn by Demo3_fx/_bracket) */
export const fSt = (t: number): St => {
  const d = demoSt(t);
  const L = fLight(t);
  return {...d, core: d.s > 0 ? L.core : 0, flash: d.s > 0 ? Math.max(L.scene, 0.08) * clamp(d.s / 16) : 0, channel: 0, bracket: 0, label: 0};
};

// ------------------------------------------------------------------ the emphasis
const W_FOLLOWED = 22.31, W_CHANNEL = EV.wordChannelF; // "followed" 22.31, "channel" 22.9
const fxAt = (t: number, st: St): Fx => {
  const s = st.s;
  const inc = EV.demoInception;
  const corona = s > 0 ? clamp(1 - (s - 2) / 10) : ss(t, 19.1, inc);
  // the guided section: a quiet lift while the leader rides it; strengthened at the connection and its re-strokes;
  // from "followed" the brightest part of the bolt, held (gently flickering) to the end
  const dt = t - C0;
  const pre = 0.22 * ss(t, inc + 0.1, inc + 0.5);
  const conn = dt >= 0 ? clamp(0.35 + 0.4 * Math.min(1, boltLight(dt, 1.5).core)) : 0;
  const hold = 0.95 * ss(t, W_FOLLOWED - 0.05, W_FOLLOWED + 0.35) * (1 - 0.18 * ss(t, 24.4, 25.6)) * (0.93 + 0.07 * noise1(t * 11, 173));
  const guided = Math.max(pre, conn, hold);
  // one surge up the guided section on "followed", a fainter one on "channel"
  const sg = (t0: number, a: number) => {
    const u = (t - t0) / 0.3;
    return u < 0 || u > 1.5 ? null : {u, a: a * (u < 1 ? 1 : 1 - (u - 1) / 0.5)};
  };
  const s1 = sg(W_FOLLOWED, 0.95) ?? sg(W_CHANNEL, 0.5);
  // the cyan path: in once the view has resolved, a little stronger while the narration names the channel
  const glow = ss(t, 19.15, 19.6) * (0.85 + 0.35 * ss(t, W_FOLLOWED - 0.1, W_FOLLOWED + 0.3) * (1 - 0.6 * ss(t, 23.4, 24.2)));
  const lit = dt >= 0 ? clamp(0.8 * boltLight(dt, 1.5).scene + 0.15 * Math.exp(-dt / 0.9)) : 0;
  // the cyan path showing on both sides of the guided section from "followed" on (it hugs the line), held to the end
  const rim = ss(t, W_FOLLOWED - 0.15, W_FOLLOWED + 0.3) * (1 - 0.2 * ss(t, 23.4, 24.2));
  return {
    glow, corona, coronaFlick: corona, sG: Math.min(Math.max(s, 0), BOLT3.guidedS), guided,
    surge: s1 ? s1.u : -1, surgeA: s1 ? s1.a : 0, lit, rim,
  };
};

/** the leader's crackle (19.55-21.85): the growing tip flickers in uneven steps (0.55..1.2) */
const crackle = (t: number) => {
  const k = Math.floor(t * 24);
  const stepA = hash(k, 175), stepB = hash(k + 1, 175);
  const u = t * 24 - k;
  return 0.55 + 0.65 * (u < 0.35 ? stepA : stepA + (stepB - stepA) * ((u - 0.35) / 0.65)) ** 1.5;
};

// ------------------------------------------------------------------ the bracket
const bracketK = (t: number) => ss(t, EV.wordOne, EV.wordSixty - 0.04);
const labelK = (t: number) => ss(t, EV.wordSixty, EV.wordSixty + 0.22);

export const DemoF: React.FC<{t: number}> = ({t}) => {
  const Z = demoZoom(t);
  const cam = demoCam(t, Z);
  const st = fSt(t);
  const fx = fxAt(t, st);
  // rain held back a little while the demonstration plays (it is all but invisible during the zoom)
  const rain = 1 - 0.4 * ss(t, 18.95, 19.6);
  return (
    <View3 cam={cam} st={st} t={t} tag="f" rain={rain} dk={0}>
      <DemoHaze cam={cam} Z={Z} a={0.85} macro={ss(t, 19.2, 19.7) * (1 + 0.7 * ss(t, W_CHANNEL - 0.1, W_CHANNEL + 0.25) * (1 - ss(t, 23.5, 24.3)))} id="fhz" />
      <DischargeF cam={cam} s={st.s} core={st.core} id="fdc" streamerK={0.35} branchK={0.85} tipK={crackle(t)} />
      <DemoFx cam={cam} t={t} fx={fx} id="ffx" />
      <Bracket160 cam={cam} k={bracketK(t)} label={labelK(t)} />
    </View3>
  );
};
