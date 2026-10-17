// C14 — the catch (muffled perspective in the mix). The friend hangs from the severed walkway's lip, their grip going.
// The Director runs back along the failing walkway — the film's one deliberate reversal, right to left — drops flat on
// the slope and catches the slipping hand (insert, on a Portals accent). The builder and the carrier arrive, the
// builder anchoring the Director's legs; they haul the friend up over the lip and get them on their feet between them.
import React from 'react';
import {Frame, Grade, Cam, smoothCam, shake} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, lerp, easeInOut, smooth, noise} from '../../kit/math';
import {HandCU} from '../../rig/HandCU';
import {look} from '../../film/crew';
import {C, BLOOD} from '../../theme';
import {Debris, Dust, Smoke} from '../../fx';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt} from './blocking';
import {BreakerAt, Drones, EscortWarden} from './machines';
import {BEAT, SHOT} from './world';
import {lipAt} from './fall';

const S = SHOT.C14.start;
const INS = [BEAT.catch - 0.02, BEAT.catch + 0.85] as const; // 109.23 → 110.1

const camA = (T: number): Cam => ({
  x: keys(T, [[S, 11150], [108.5, 10860, easeInOut], [INS[0], 10800]]),
  y: keys(T, [[S, -1560], [108.5, -1470, easeInOut], [INS[0], -1440]]),
  z: keys(T, [[S, 0.78], [108.6, 0.92, easeInOut], [INS[0], 0.98]]),
});
const camB = (T: number): Cam => ({
  x: keys(T, [[INS[1], 10820], [111.6, 10860], [112.6, 10930, easeInOut], [SHOT.C14.end, 11080, easeInOut]]),
  y: keys(T, [[INS[1], -1440], [111.6, -1500], [SHOT.C14.end, -1640, easeInOut]]),
  z: keys(T, [[INS[1], 1.0], [111.6, 0.94], [SHOT.C14.end, 0.86, easeInOut]]),
});

/** Insert: the Director's hand closes on the friend's wrist as it leaves the lip; the weight comes on. */
const CatchInsert: React.FC<{T: number}> = ({T}) => {
  const a = T - INS[0];
  const grab = smooth(clamp((a - 0.04) / 0.12));
  const weight = a > 0.16 ? Math.exp(-5 * (a - 0.16)) * Math.sin((a - 0.16) * 18) * 28 : 0;
  const drop = 40 * (1 - Math.exp(-8 * Math.max(0, a - 0.1)));
  const tremor = noise(T * 20, 3) * 3;
  const dSkin = look('director').skin, fSkin = look('friend').skin;
  return (
    <g>
      <defs>
        <linearGradient id="c14ibg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3A2A30" /><stop offset="60%" stopColor="#1C1418" /><stop offset="100%" stopColor="#0E0A0C" /></linearGradient>
      </defs>
      <rect x={-20} y={-20} width={1960} height={1120} fill="url(#c14ibg)" />
      {/* the far road and the fallen debris far below; dust drifting */}
      <rect x={-20} y={940} width={1960} height={160} fill="#2A2224" opacity={0.6} />
      <Debris x={1300} y={-40} t={T} t0={INS[0] - 0.4} seed={5} n={10} dir={95} spread={30} speed={[200, 500]} size={[10, 26]} material="metal" ink={4} />
      <Dust x={900} y={1000} t={T} t0={INS[0] - 1} size={600} n={8} seed={7} color="#5A4A48" opacity={0.4} life={4} />
      {/* the lip: the broken walkway end across the top */}
      <g transform={`translate(0 ${(-drop * 0.2).toFixed(1)})`}>
        <path d="M -40 -40 L 1960 -40 L 1960 110 L 1180 150 L 1120 120 L 1040 172 L -40 160 Z" fill="#39424A" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
        <path d="M 1040 172 L 1070 230 M 1120 120 L 1150 210" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      </g>
      <g transform={`translate(${tremor.toFixed(1)} ${(drop + weight).toFixed(1)})`}>
        {/* the friend's arm from below: hand up, closing on the Director's wrist */}
        <HandCU x={1000} y={560} rot={-88} s={3.2} skin={fSkin} sleeve={C.teal} cuffTorn view="side" side="L" curl={lerp(0.2, 0.85, grab)} thumb={lerp(0.2, 0.8, grab)} ink={9} blood={1} dirt={0.6} scrape={0.8} />
      </g>
      <g transform={`translate(0 ${(drop * 0.5 + weight * 0.6).toFixed(1)})`}>
        {/* the Director's hand from above: clamps the friend's wrist */}
        <HandCU x={925} y={170} rot={92} s={3.2} skin={dSkin} sleeve={C.saffron} view="side" side="R" curl={lerp(0.25, 0.95, grab)} thumb={lerp(0.15, 0.9, grab)} ink={9} blood={0.8} dirt={0.6} />
      </g>
      {a < 0.25 && <circle cx={960} cy={560} r={40 + 400 * a} fill="none" stroke="#FFF2D8" strokeWidth={6} opacity={0.3 * (1 - a / 0.25)} />}
      {void BLOOD}
    </g>
  );
};

export const C14: React.FC = () => {
  const {t, T} = useShot('C14');
  const sub = T < INS[0] ? 'a' : T < INS[1] ? 'i' : 'b';
  // the catch: a close two-shot at the lip (the Director's face above, the friend's below, the hands between)
  const camI = (T: number): Cam => {
    const lip = lipAt(T);
    return {x: lip.x + 30, y: lip.y + 30 + 10 * Math.exp(-6 * Math.max(0, T - BEAT.catch)), z: keys(T, [[INS[0], 2.15], [INS[1], 2.3]])};
  };
  const cam0 = smoothCam(sub === 'a' ? camA : sub === 'i' ? camI : camB, T, sub === 'i' ? 0.08 : 0.25);
  // the walkway lurches as the Director lands on it; a small jolt on the catch
  const jolt = (T > 108.15 ? 10 * Math.exp(-4 * (T - 108.15)) : 0) + (T > 108.75 ? 8 * Math.exp(-5 * (T - 108.75)) : 0) + (T > BEAT.catch ? 16 * Math.exp(-7 * (T - BEAT.catch)) : 0);
  const cam = shake(cam0, T, jolt, 21, 10);
  const ink = ik(cam);
  // in the close two-shot the walkway's front rail would cut across both faces: cheat the two of them in front of it
  const crew = sub === 'i' ? crewAt(T).map((q) => (q.key === 'director' || q.key === 'friend' ? {...q, slot: 'deck' as const} : q)) : crewAt(T);
  const slots = slotsOf(crew, ink, {
    deckBack: <g><EscortWarden T={T} ink={ink} /><BreakerAt T={T} ink={ink} /></g>,
    air: <g>
      <Drones T={T} ink={ink} far={false} only="B" />
      <Smoke x={10480} y={-1750} t={T} t0={BEAT.blast} t1={BEAT.blast + 6} rate={3} life={5} vy={-140} size={110} grow={80} color="#2E272B" opacity={0.55} seed={77} />
      {[108.2, 108.5, 108.8, 109.4].map((tb, i) => <Debris key={i} x={10620 + i * 60} y={-1420 + i * 20} t={T} t0={tb} seed={30 + i} n={4} dir={100} spread={30} speed={[60, 200]} size={[6, 14]} ground={40} material="metal" ink={ink} />)}
    </g>,
  });
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id={`c14${sub}`} slots={slots} haze={0.9} />
      <Grade vignette={0.5} id={`c14${sub}vg`} tint="#3A2A40" tintOp={0.25} />
    </Frame>
  );
};
