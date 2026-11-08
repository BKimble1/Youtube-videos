// V2 lobby: "Or pressing a floating button without touching a screen." A second conceptual setting: an elevator
// lobby with a floating destination keypad. Two technologies, kept visibly apart:
//  - CONCEPT DISPLAY: the keypad is a picture made of light (violet-white, tagged), no screen behind it;
//  - ULTRASOUND ARRAY: the touch comes from the pedestal's array below (cyan crests, a pulse at the fingertip).
// It opens matched to the car's fingertip close-up, pulls back to the lobby, presses 7 on "screen." (the key fills, the
// readout shows the assigned car, its doors part), then pushes back into the fingertip: the next cut is a
// finger-position match to the real array in the lab.
import React from 'react';
import {Man, ManPose, manJoints, GUESSER} from '../dc/Man';
import {HAND_RELAXED} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {PAL, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {ProfileArm, H_POINT, handGeo} from '../it/hand';
import {BASE_MAN, EXN} from '../it/cast';
import {T} from '../it/timing';
import {keyS, ss, lerp} from '../lib';
import {CYAN, CYAN_HI, Focus, Pulse} from '../it/fx';
import {Conceptag} from '../it/tags';
import {car2Cam, car2PadScreen} from './car2';

export const lobby2Active = (t: number) => t >= T.without - 0.05 && t < T.and2 - 0.025;
const T0 = () => T.without - 0.05;
const T1 = () => T.and2 - 0.025;
const HAND_L = 96;
// the keypad: 3 x 4 keys, key 7 is the target
const KP = {x: -70, y: -250, s: 44};
const keyPos = (i: number) => ({x: KP.x + ((i % 3) - 1) * KP.s, y: KP.y + (Math.floor(i / 3) - 1.5) * KP.s});
const LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '◂', '0', '▸'];
const K7 = keyPos(6);
const PED = {x: -70, top: -40, w: 130};

const padAt = (t: number) => {
  const press = ss(t, T.screen - 0.22, T.screen + 0.03) * (1 - ss(t, T.screen + 0.3, T.screen + 0.6));
  const appr = ss(t, T0(), T.screen - 0.3);
  return {pad: {x: lerp(K7.x + 30, K7.x + 9, appr) - 8 * press, y: lerp(K7.y - 6, K7.y - 1, appr) + 2 * press}, press};
};

const camAt = (t: number) => {
  const ce = car2PadScreen(T0() - 0.001);
  const p0 = padAt(T0()).pad;
  const z0 = car2Cam(T0() - 0.001).z;
  const ex = p0.x - (ce.x - 540) / z0, ey = p0.y - (ce.y - 960) / z0;
  const pe = padAt(T1()).pad;
  // ends pushed into the fingertip, centred, ready for the finger-position match to the lab
  return {
    x: keyS(t, [[T0(), ex], [T.screen - 0.15, 40], [T.screen + 0.3, 46], [T1(), pe.x]]),
    y: keyS(t, [[T0(), ey], [T.screen - 0.3, -215], [T.screen + 0.35, -210], [T1(), pe.y]]),
    z: keyS(t, [[T0(), z0], [T.screen - 0.15, 1.62], [T.screen + 0.3, 1.7], [T1(), LOBBY_EXIT_K]]),
  };
};
export const LOBBY_EXIT_K = 4.0;
/** where the fingertip is on screen at the last lobby frame (the lab opens on it) */
export const lobbyExit = () => {
  const t = T1() - 0.001;
  const c = camAt(t);
  const p = padAt(t).pad;
  return {sx: 540 + (p.x - c.x) * c.z, sy: 960 + (p.y - c.y) * c.z, k: c.z};
};

export const Lobby2: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const tr = (depth: number) => {
    const z = 1 + (c.z - 1) / depth;
    return `translate(540 960) scale(${z.toFixed(4)}) translate(${(-c.x / depth).toFixed(2)} ${(-c.y / depth).toFixed(2)})`;
  };
  const {pad, press} = padAt(t);
  const ang = lerp(150, 166, ss(t, T0(), T0() + 0.5) * (1 - ss(t, T.screen + 0.4, T1())));
  const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, H_POINT);
  const W = {x: pad.x - g0.pad.x, y: pad.y - g0.pad.y};
  const man: ManPose = {...BASE_MAN, x: 260, y: 30, torso: 6, rW: 1, rWx: W.x, rWy: W.y, lW: 1, lWx: 278, lWy: 190};
  const inkK = 6.2 / 7 / c.z;
  const ink = 7 * inkK * 0.72;
  const done = ss(t, T.screen, T.screen + 0.15);
  const doors = ss(t, T.screen + 0.15, T1() + 0.4);
  const tags = ss(t, T.screen - 0.55, T.screen - 0.25);
  const expr = mixExpr(EXN.focus, EXN.delight, done);
  const farArm = (j: ReturnType<typeof manJoints>) => (
    <ProfileArm id="l2-ra" f={{W, dir, L: HAND_L}} pose={H_POINT} skin={shade(PAL.skin, 0.05)} ink={ink} limb={{S: j.R.S, E: j.R.E, rS: 29, rE: 23.5}} press={press} />
  );
  const DX = -70; // elevator car B: right behind the floating keypad, so its doors part behind the light
  return (
    <g>
      {/* lobby wall with warm light slots (parallax) */}
      <g transform={tr(1.7)}>
        <rect x={-3000} y={-3000} width={6000} height={6000} fill="#1E2A36" />
        {Array.from({length: 14}).map((_, i) => (
          <g key={i}>
            <rect x={-1500 + i * 240} y={-1200} width={14} height={1900} fill="#FFD9A0" opacity={0.55} />
            <rect x={-1515 + i * 240} y={-1200} width={44} height={1900} fill="#FFD9A0" opacity={0.08} />
          </g>
        ))}
      </g>
      <g transform={tr(1)}>
        {/* floor */}
        <rect x={-1500} y={480} width={3200} height={900} fill="#141D27" />
        <rect x={-1500} y={480} width={3200} height={8} fill="#2E3D4C" />
        {/* elevator car B: steel doors that part after the press, warm light inside */}
        <rect x={DX - 190} y={-480} width={380} height={960} fill="#FFE2B0" />
        <rect x={DX - 190} y={-480} width={380} height={960} fill="#FFF3DA" opacity={0.6 * doors} />
        {[-1, 1].map((sd) => {
          const off = 175 * doors;
          const x = sd < 0 ? DX - 190 - off : DX + off;
          return (
            <g key={sd}>
              <rect x={x} y={-480} width={190} height={960} fill="#8E9EAD" stroke={INK} strokeWidth={ink} />
              <rect x={x + 20} y={-470} width={8} height={940} fill="#B7C5D1" opacity={0.6} />
            </g>
          );
        })}
        <rect x={DX - 214} y={-504} width={428} height={28} fill="#56636F" stroke={INK} strokeWidth={ink} />
        <rect x={DX - 214} y={-480} width={24} height={960} fill="#56636F" stroke={INK} strokeWidth={ink} />
        <rect x={DX + 190} y={-480} width={24} height={960} fill="#56636F" stroke={INK} strokeWidth={ink} />
        <rect x={DX - 60} y={-580} width={120} height={58} rx={10} fill="#0D161E" stroke={INK} strokeWidth={ink} />
        <text x={DX - 34} y={-541} fontFamily="Nunito Variable, sans-serif" fontWeight={900} fontSize={30} fill={done > 0.5 ? '#7FE0A8' : '#3A4A58'}>B</text>
        <path d={`M${DX + 20},${-542} L${DX + 34},${-566} L${DX + 48},${-542} Z`} fill={done > 0.5 ? '#7FE0A8' : '#3A4A58'} />
        {/* pedestal with the ultrasonic array flush in its top */}
        <path d={`M${PED.x - 42},480 L${PED.x + 42},480 L${PED.x + 30},${PED.top + 22} L${PED.x - 30},${PED.top + 22} Z`} fill="#3B4855" stroke={INK} strokeWidth={ink} />
        <path d={`M${PED.x - PED.w / 2},${PED.top} L${PED.x + PED.w / 2},${PED.top} L${PED.x + PED.w / 2 - 6},${PED.top + 22} L${PED.x - PED.w / 2 + 6},${PED.top + 22} Z`} fill="#2C3742" stroke={INK} strokeWidth={ink} />
        <path d={`M${PED.x - PED.w / 2 + 4},${PED.top} L${PED.x + PED.w / 2 - 4},${PED.top} L${PED.x + PED.w / 2 - 10},${PED.top - 11} L${PED.x - PED.w / 2 + 10},${PED.top - 11} Z`} fill="#0F1E26" stroke={INK} strokeWidth={ink * 0.7} />
        {Array.from({length: 2}).map((_, r) =>
          Array.from({length: 15}).map((__, i) => {
            const fx = (i - 7) / 15;
            const on = 0.3 + 0.7 * Math.max(0, Math.cos(2 * Math.PI * (t * 4.5 - Math.abs(fx) * 1.3)));
            return <ellipse key={`${r}-${i}`} cx={PED.x + fx * (PED.w - 26 + r * 6)} cy={PED.top - 8 + r * 4} rx={2.7} ry={1.1} fill={CYAN} opacity={0.35 + 0.65 * on} />;
          }),
        )}
        {/* the keypad's glass backing and readout sit behind his hand (the finger presses into the light) */}
        <g>
          <rect x={KP.x - 82} y={KP.y - 124} width={164} height={242} rx={20} fill="#0B1424" fillOpacity={0.5} stroke="#EDE4FF" strokeWidth={1.4} strokeOpacity={0.6} />
          <text x={KP.x} y={KP.y - 100} textAnchor="middle" fontFamily="Nunito Variable, sans-serif" fontWeight={800} fontSize={15} fill="#EDE4FF" opacity={0.85}>{done > 0.5 ? '7  →  CAR B' : 'FLOOR?'}</text>
        </g>
        {/* the guesser */}
        <Man id="l2-man" pose={man} expr={expr} lHand={HAND_RELAXED} rHand={HAND_RELAXED} outfit={GUESSER} inkK={inkK} farArm={farArm} />
        {/* haptics: focused crests rising from the pedestal array to the fingertip */}
        {[0, 1, 2, 3, 4].map((k) => {
          const u = (t * 1.7 + k / 5) % 1;
          const yy = lerp(PED.top - 9, pad.y + 2, u);
          const r = lerp(PED.w / 2, 3, u);
          return <path key={k} d={`M${pad.x - r},${yy + r * 0.22} Q${pad.x},${yy - r * 0.16} ${pad.x + r},${yy + r * 0.22}`} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(1.1, 3 / c.z)} opacity={0.5 * (1 - 0.5 * u)} />;
        })}
        <Focus c={{x: pad.x, y: pad.y + 1}} r={Math.max(5, 26 / c.z)} a={0.6 + 0.4 * press} id="l2-fc" squash={0.6} />
        <Pulse c={{x: pad.x, y: pad.y + 1}} age={t - T.screen} size={Math.max(14, 72 / c.z)} w={3 / c.z} dur={0.5} />
        {/* the floating destination keypad: light only (concept) */}
        <g>
          {LABELS.map((lb, i) => {
            const p = keyPos(i);
            const on = i === 6 ? done : 0;
            const ring = i === 6 ? ss(t, T.screen, T.screen + 0.35) : 0;
            return (
              <g key={i}>
                {ring > 0 && ring < 1 && <circle cx={p.x} cy={p.y} r={17 + 16 * ring} fill="none" stroke="#EDE4FF" strokeWidth={2} opacity={1 - ring} />}
                <circle cx={p.x} cy={p.y} r={17} fill="#EDE4FF" fillOpacity={0.08 + 0.6 * on} stroke="#EDE4FF" strokeWidth={2} opacity={0.92} />
                <text x={p.x} y={p.y + 6} textAnchor="middle" fontFamily="Nunito Variable, sans-serif" fontWeight={900} fontSize={17} fill={on > 0.5 ? '#2B1D5C' : '#EDE4FF'}>{lb}</text>
              </g>
            );
          })}
        </g>
        <g opacity={tags}>
          <Conceptag x={KP.x} y={KP.y - 152} label="CONCEPT DISPLAY" color="#EDE4FF" anchor="middle" s={1.2 / Math.max(1, c.z / 1.8)} />
          <Conceptag x={PED.x} y={PED.top + 50} label="ULTRASOUND ARRAY" color={CYAN} anchor="middle" s={1.2 / Math.max(1, c.z / 1.8)} />
        </g>
      </g>
    </g>
  );
};
