// V4 beat F (18.79-25.61): the demonstration in three connected beats on one camera path (cams4_demo.ts):
//   F1 18.79-20.45  E's pull-out carries straight on and settles on a closer view of the rod tip; the field builds at
//                   the tip (19.1-19.55), the leader incepts there (19.55) and emerges upward along the line ("UPWARD")
//   F2 20.45-23.0   one move up the channel with the leader's tip through the guided section to where it leaves the
//                   line and branches to the cloud; connection 21.85 with local light; on "followed that CHANNEL" the
//                   guided section is the brightest part, hugging the cyan line, the branching above it
//   F3 23.0-25.61   one pull-back, farther and lower, to the whole tower from its base (the summit station's lit
//                   windows and the telescope on the terrace for scale) with the guided section and the bolt to the
//                   cloud; the 160+ ft bracket grows on "one hundred", the label on "sixty"; then a living afterglow:
//                   the unguided bolt cools while the guided section stays hot, until the hard cut to G (25.61)
// The bolt is F's (Demo4_discharge.tsx BOLT_F: V3's, leaving the line decisively where the guidance ends, V3 finding
// F-2), drawn as View3's child with dk = 0 so View3's bolt-lit sky and FlashWash still follow the leader; the light
// over the scene is Demo4_fx.tsx (V3's Demo3_fx retuned for the closer and wider views).
import React from 'react';
import {clamp, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {boltLight} from '../world/site';
import {BOLT3} from '../v2/p3';
import {EV} from '../v3/timeline3';
import {St, View3} from '../v3/view3';
import {DemoFx4, DemoHaze4, Fx} from './Demo4_fx';
import {Bracket160} from '../v3/Demo3_bracket';
import {DischargeF4} from './Demo4_discharge';
import {fCam, fZoom} from './cams4_demo';
import {fSt4} from './states4_demo';
import {PlacedLaser4} from './Open4_laser';

const C0 = EV.demoConnect;
const W_FOLLOWED = 22.31, W_CHANNEL = EV.wordChannelF;
const fxAt = (t: number, st: St): Fx => {
  const s = st.s;
  const inc = EV.demoInception;
  const corona = s > 0 ? clamp(1 - (s - 2) / 10) : ss(t, 19.1, inc);
  const dt = t - C0;
  const pre = 0.22 * ss(t, inc + 0.1, inc + 0.5);
  const conn = dt >= 0 ? clamp(0.35 + 0.4 * Math.min(1, boltLight(dt, 1.5).core)) : 0;
  const hold = 0.95 * ss(t, W_FOLLOWED - 0.05, W_FOLLOWED + 0.35) * (1 - 0.18 * ss(t, 24.4, 25.6)) * (0.85 + 0.15 * noise1(t * 6, 173));
  const guided = Math.max(pre, conn, hold);
  const sg = (t0: number, a: number) => {
    const u = (t - t0) / 0.3;
    return u < 0 || u > 1.5 ? null : {u, a: a * (u < 1 ? 1 : 1 - (u - 1) / 0.5)};
  };
  const s1 = sg(W_FOLLOWED, 0.95) ?? sg(W_CHANNEL, 0.5);
  const glow = ss(t, 19.15, 19.6) * (0.85 + 0.35 * ss(t, W_FOLLOWED - 0.1, W_FOLLOWED + 0.3) * (1 - 0.6 * ss(t, 23.4, 24.2)));
  const lit = dt >= 0 ? clamp(0.8 * boltLight(dt, 1.5).scene + 0.15 * Math.exp(-dt / 0.9)) : 0;
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
const bracketK = (t: number) => ss(t, EV.wordOne, EV.wordSixty - 0.04);
const labelK = (t: number) => ss(t, EV.wordSixty, EV.wordSixty + 0.22);

export const DemoF4: React.FC<{t: number}> = ({t}) => {
  const cam = fCam(t);
  const Z = fZoom(t);
  const st = fSt4(t);
  const fx = fxAt(t, st);
  const rain = 1 - 0.4 * ss(t, 18.95, 19.6);
  return (
    <View3 cam={cam} st={st} t={t} tag="f" rain={rain} dk={0}>
      <DemoHaze4 cam={cam} Z={Z} a={0.85} macro={ss(t, 19.2, 19.7) * (1 + 0.7 * ss(t, W_CHANNEL - 0.1, W_CHANNEL + 0.25) * (1 - ss(t, 23.5, 24.3)))} id="fhz" />
      <DischargeF4 cam={cam} s={st.s} core={st.core} id="fdc" streamerK={0.35} branchK={0.85} tipK={crackle(t)} upperK={1 - 0.4 * ss(t, 24.35, 25.5)} />
      <DemoFx4 cam={cam} t={t} fx={fx} id="ffx" />
      {/* the telescope on the laser terrace, in front of the summit station (the A+H views' own placement, at its
          physical size): only the wide can see it */}
      {t > 23.4 && <PlacedLaser4 cam={cam} flash={st.flash} fire={1} tick={0} t={t} id="ftel" />}
      <Bracket160 cam={cam} k={bracketK(t)} label={labelK(t)} />
    </View3>
  );
};
