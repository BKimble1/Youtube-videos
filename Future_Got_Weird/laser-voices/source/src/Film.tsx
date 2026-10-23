// FGW "This Laser Makes You Hear Voices": one optics room, one continuous camera, keyed to the measured narration.
//   A (hook)      her private reaction; widening to the transmitter, the bystander unaffected beside her
//   B             the push to her bare left ear
//   C             the air just outside the ear, magnified: absorption -> heating -> expansion -> pressure fronts
//   D             back along the path to the transmitter: its scanning mirror (section), the sweep gathering the
//                 sound at her position, 8 FT; the bystander glances to the aisle and turns
//   E             the crossing: he steps into the path; the path ends at his shoulder; her signal and the message stop
//   F             he moves on; the path reconnects; push back to her face (matches the opening)
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {clamp, inv, smooth} from './lib/math';
import {a3, basis, proj, v3} from './p3';
import {RoomScene} from './Scene';
import {byAt, earOf, FOCUS, messageOn, pathHit, recAt, WALK} from './story';
import {camAt} from './cams';
import {DashedPath, Dimension, EarAccent, HitMark, Sweep, sweepPhase, sweepSpot} from './Overlay';
import {Magnifier} from './Magnifier';
import {Captions} from './Captions';
import {DUR, EXIT, FPS, w, we} from './world';
import {C} from './Room';
import {MAG, OV} from './timing';
export {MAG, OV};

const ramp = (t: number, a0: number, a1: number, b0: number, b1: number) => smooth(clamp(inv(a0, a1, t))) * (1 - smooth(clamp(inv(b0, b1, t))));

export const Scene: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const cam = camAt(t);
  const b = basis(cam);
  const rec = recAt(t);
  const by = byAt(t);
  const hit = pathHit(t);
  const ear = earOf(rec);
  // sweep and the mirror
  const sweepAmt = ramp(t, ...OV.sweep);
  const ph = sweepPhase(t, OV.sweep0);
  const spot = sweepSpot(FOCUS, ph, sweepAmt);
  const realTilt = 0.5 * Math.atan2(spot.p.y - EXIT.y, spot.p.x - EXIT.x);
  const dev = {section: ramp(t, ...OV.section), mirror: realTilt * 3.2, tx: 1, t};
  // the path and the signal
  const pathA = Math.max(ramp(t, ...OV.hookPath), ramp(t, ...OV.path));
  const end = hit ? hit.p : sweepAmt > 0.001 ? spot.p : FOCUS;
  const msg = messageOn(t) ? 1 : 0;
  const rx = hit ? 0 : msg * clamp(pathA * 1.2);
  const canal = a3(ear.p, v3(0.012, -0.005, 0.0));
  const hitA = hit ? ramp(t, ...OV.hitMark) : 0;
  const hitPulse = clamp(inv(w(90), w(90) + 0.6, t));
  // the magnifier's anchor and orientation, from the scene
  const fP = proj(b, FOCUS), fB = proj(b, a3(FOCUS, v3(-0.05, 0, 0))), eP = proj(b, canal);
  const beamAng = Math.atan2(fP.y - fB.y, fP.x - fB.x), earAng = Math.atan2(eP.y - fP.y, eP.x - fP.x);
  const magOn = t > MAG.open0 - 0.1 && t < MAG.close1 + 0.1;
  const legend = ramp(t, ...OV.legend);
  const dimA = (t > OV.dimDraw[0] ? 1 : 0) * (1 - smooth(clamp(inv(...OV.dimOut, t))));
  return (
    <AbsoluteFill style={{backgroundColor: C.wall}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <RoomScene b={b} rec={rec} by={by} dev={dev} />
        <Dimension b={b} ear={v3(ear.p.x, ear.p.y, 0)} draw={smooth(clamp(inv(...OV.dimDraw, t)))} a={dimA} />
        <DashedPath id="ir" b={b} from={EXIT} to={end} a={pathA} t={t} fadeEnd={hit ? 0 : 0.05} />
        <Sweep b={b} focus={FOCUS} t={t} t0={OV.sweep0} amt={sweepAmt} strength={msg} />
        <EarAccent id="ea" b={b} focus={FOCUS} ear={canal} region={pathA * (hit ? 0 : 1)} rx={rx} t={t} />
        {hit && <HitMark b={b} p={hit.p} a={hitA * pathA} pulse={hitPulse} />}
        {magOn && <Magnifier t={t} anchor={fP} center={{x: 420, y: 640}} R={345} beamAng={beamAng} earAng={earAng} cue={MAG} />}
        <defs>
          <radialGradient id="vig" cx="0.5" cy="0.45" r="0.78">
            <stop offset="0.62" stopColor="#2A2016" stopOpacity={0} />
            <stop offset="1" stopColor="#2A2016" stopOpacity={0.28} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vig)" />
      </svg>
      {legend > 0.01 && (
        <div style={{position: 'absolute', left: 64, top: 236, opacity: legend, display: 'flex', alignItems: 'center', gap: 14, fontFamily: '"Nunito Variable", system-ui', fontWeight: 800, fontSize: 30, letterSpacing: '0.06em', color: '#FFFFFF', background: 'rgba(19,36,48,0.86)', padding: '10px 22px', borderRadius: 999}}>
          <svg width={56} height={10}><path d="M2,5 L54,5" stroke={C.amber} strokeWidth={6} strokeDasharray="12 8" strokeLinecap="round" /></svg>
          IR PATH · ILLUSTRATED
        </div>
      )}
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Scene t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Scene t={t} captions={captions} />;
void DUR; void WALK;
