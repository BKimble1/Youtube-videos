// V2 C (26.6-39.0): the scan as one connected move. Dolly in on the beamline while a crew member starts it; beam
// pulses pass through the turning roll and it turns translucent; scan slices fly in and stack into a volume that the
// camera orbits; the stack parts and the camera drops onto one slice until it fills the frame as the cross-section.
// The last frame equals the first frame of D2 (spiral centre 960/470, zoom 8.8).
import React from 'react';
import {CAST, CrewChar, IDLE, mixPose, Pose, reach} from '../art/crew3';
import {K} from '../art/kit';
import {Roll1667} from '../art/Roll';
import {mix} from '../lib/color';
import {FPS} from '../lib/core';
import {clamp, easeIn, easeInOut, easeOut, hash, lerp} from '../lib/math';
import {R_OUT, SQUASH} from '../lib/sheet';
import {TM} from '../lib/time';
import {DigitalRoll, FaceSpiral, segK} from './kit2';

export const C2_END = TM.spiral + 0.5;
export const SPZ = 8.8;
export const SPC = {x: 960, y: 470};
const SAMPLE = {x: 960, y: 455};
const SRC = {x: 300, y: 455};
const DET = {x: 1560, y: 455};
const NS = 13; // slices in the stack
const RR = 75; // roll radius (px, before camera)
const RH = 150; // half height

export const C2: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const t0 = TM.look - 0.85;
  const press = TM.look + 0.35;
  // camera: dolly in on the sample
  const dolly = lerp(0.82, 1.45, segK(t, t0, TM.researchers + 0.6));
  const cam = (x: number, y: number) => ({x: 960 + (x - 960) * dolly, y: 470 + (y - 470) * dolly});
  // crew member
  const crew = {x: 520, y: 1010, scale: 1.0};
  const btn = {x: 720, y: 745};
  const reachK = easeInOut(clamp((t - (t0 + 0.15)) / (press - t0 - 0.15))) * (1 - easeInOut(clamp((t - press - 0.3) / 0.6)));
  const armR = reach(crew, 1, btn.x, btn.y + (t > press - 0.05 && t < press + 0.2 ? 6 : 0));
  const pose: Pose = mixPose({...IDLE, lookX: 0.6}, {...IDLE, armR, lookX: 0.7, lookY: 0.3, brows: 0.2, mouth: 'smirk', handR: {curl: 0.6, point: 1}}, reachK);
  // beam and x-ray look
  const beam = segK(t, press + 0.1, press + 0.4) * (1 - segK(t, TM.map3d - 0.3, TM.map3d + 0.2));
  const xray = segK(t, TM.researchers + 0.2, TM.researchers + 1.6);
  const spin = Math.max(0, t - press) * 2.2;
  // to the volume: the lab gives way to the scan space
  const toVol = segK(t, TM.angles + 0.2, TM.map3d + 0.2);
  const stackT = (i: number) => TM.angles + 0.5 + i * 0.13; // slice i arrives
  // orbit: tilt of the stack (ellipse ratio) and turn of the spiral
  const tilt = lerp(0.3, 0.55, segK(t, TM.map3d - 0.2, TM.slice + 0.2));
  const turn = (t - TM.angles) * 26;
  // slice: the stack parts, the middle slice comes to face the camera and fills the frame
  const part = segK(t, TM.slice - 0.05, TM.slice + 0.7);
  const face = segK(t, TM.slice + 0.5, C2_END - 0.05);
  const mid = Math.floor(NS / 2);
  const volScale = lerp(1, 1.15, segK(t, TM.map3d, TM.slice));
  const D1 = 1.45; // dolly after the push
  const rollC = {x: 960 + (SAMPLE.x - 960) * D1, y: 470 + (SAMPLE.y - 470) * D1};
  const rr = RR * D1 * volScale;
  const cY = lerp(rollC.y, SPC.y, segK(t, TM.map3d, TM.slice));
  const ySl = (i: number) => cY + ((i - mid) / (NS - 1)) * RH * 2 * D1 * volScale * 0.92 + (i === mid ? 0 : Math.sign(i - mid) * part * 560);
  const discs = Array.from({length: NS}, (_, i) => i);
  const order = [...discs].sort((a, b) => b - a); // bottom first, so the top slice is in front (seen from above)
  const labOpacity = 1 - toVol;
  return (
    <g>
      <rect width={1920} height={1080} fill={mix('#EAF0F2', K.scanBg, toVol)} />
      {labOpacity > 0 && (
        <g opacity={labOpacity} transform={`translate(${960 - 960 * dolly} ${470 - 470 * dolly}) scale(${dolly})`}>
          <rect x={-800} y={760} width={3600} height={900} fill="#D5DEE2" />
          <rect x={-800} y={760} width={3600} height={6} fill="#B9C6CC" />
          <rect x={SRC.x - 190} y={SRC.y - 120} width={210} height={240} rx={22} fill="#4F7CC9" stroke={K.ink} strokeWidth={4} />
          <rect x={SRC.x - 160} y={SRC.y - 90} width={110} height={36} rx={10} fill="#D3E1F8" stroke={K.ink} strokeWidth={3} />
          <circle cx={SRC.x + 20} cy={SRC.y} r={18} fill="#2E3F5C" stroke={K.ink} strokeWidth={3} />
          <rect x={SRC.x - 140} y={SRC.y + 120} width={130} height={185} fill="#8FA3AE" stroke={K.ink} strokeWidth={4} />
          {/* beam with pulses travelling through the roll */}
          <path d={`M${SRC.x + 20} ${SRC.y - 14} L${DET.x} ${DET.y - 150} L${DET.x} ${DET.y + 150} L${SRC.x + 20} ${SRC.y + 14}Z`} fill="#7FE3FF" opacity={0.22 * beam} />
          {beam > 0 &&
            Array.from({length: 5}, (_, i) => {
              const ph = ((t - press) * 0.9 + i / 5) % 1;
              const x = lerp(SRC.x + 20, DET.x, ph);
              const h = lerp(14, 150, ph);
              return <rect key={i} x={x - 6} y={SRC.y - h} width={12} height={h * 2} rx={6} fill="#CFF6FF" opacity={beam * 0.7 * Math.sin(ph * Math.PI)} />;
            })}
          <rect x={SAMPLE.x - 120} y={SAMPLE.y + RH + 6} width={240} height={36} rx={10} fill="#9AA8B0" stroke={K.ink} strokeWidth={4} />
          <rect x={SAMPLE.x - 70} y={SAMPLE.y + RH + 42} width={140} height={258} fill="#8796A0" stroke={K.ink} strokeWidth={4} />
          <ellipse cx={SAMPLE.x} cy={SAMPLE.y + RH + 6} rx={120} ry={16} fill="#B7C3CA" stroke={K.ink} strokeWidth={4} />
          <g opacity={1 - xray}>
            <Roll1667 x={SAMPLE.x} y={SAMPLE.y} s={1} upright spin={spin} />
          </g>
          {xray > 0 && <DigitalRoll x={SAMPLE.x} y={SAMPLE.y} s={1} upright o={xray} />}
          <rect x={DET.x} y={DET.y - 170} width={70} height={340} rx={12} fill="#2E3F5C" stroke={K.ink} strokeWidth={4} />
          <rect x={DET.x + 70} y={DET.y + 150} width={40} height={305} fill="#8FA3AE" stroke={K.ink} strokeWidth={4} />
          {/* the detector face lights with each projection */}
          {beam > 0 && <rect x={DET.x + 8} y={DET.y - 150} width={54} height={300} rx={8} fill="#BFF1FF" opacity={beam * (0.35 + 0.35 * Math.abs(Math.sin(spin * 2)))} />}
          <rect x={655} y={752} width={150} height={260} rx={10} fill="#C6D0D6" stroke={K.ink} strokeWidth={4} />
          <circle cx={btn.x} cy={btn.y} r={16} fill={t > press ? K.green : K.coral} stroke={K.ink} strokeWidth={3} />
          <CrewChar look={CAST.clerkB} pose={pose} frame={f} x={crew.x} y={crew.y} scale={crew.scale} id="crewC2" />
        </g>
      )}
      {/* the slices: each flies in from the detector and stacks into the volume; then the stack parts */}
      {toVol > 0 &&
        order.map((i) => {
          const arr = segK(t, stackT(i), stackT(i) + 0.45, easeOut);
          if (arr <= 0) return null;
          const start = cam(DET.x + 30, DET.y);
          const yT = ySl(i);
          const x = lerp(start.x, SPC.x, arr);
          const y = lerp(start.y, yT, arr);
          const isMid = i === mid;
          const fk = isMid ? face : 0;
          const zx0 = (rr / R_OUT) * lerp(0.4, 1, arr);
          const zy0 = (zx0 * tilt) / SQUASH;
          const zx = Math.exp(lerp(Math.log(zx0), Math.log(SPZ), fk));
          const zy = Math.exp(lerp(Math.log(zy0), Math.log(SPZ), fk));
          const cy = lerp(y, SPC.y, fk);
          const o = isMid ? 1 : clamp(arr * 2) * (1 - segK(t, TM.slice + 0.3, C2_END - 0.2));
          const rot = lerp(turn, 0, fk);
          return (
            <g key={i} opacity={o}>
              {fk < 0.9 && <ellipse cx={x} cy={cy + 10 * (1 - fk)} rx={R_OUT * zx * 1.05} ry={R_OUT * SQUASH * zy * 1.05} fill="#0A1C2E" stroke="#3A87B8" strokeWidth={1.5} />}
              <FaceSpiral cx={x} cy={cy} zx={zx} zy={zy} rot={rot} width={isMid ? lerp(1, 1.4, fk) : 1} stride={isMid && fk > 0.3 ? 1 : 3} color={isMid ? mix('#9BE3FF', K.scanLine, fk) : '#7FD4FF'} fill="#0F2A44" fillO={clamp((1 - fk) / 0.3)} />
            </g>
          );
        })}
      {/* the slice plane passing through the volume before it parts */}
      {t > TM.slice - 0.4 && t < TM.slice + 0.4 && (
        <ellipse cx={SPC.x} cy={lerp(cY - RH * D1, cY, segK(t, TM.slice - 0.4, TM.slice))} rx={rr * 1.7} ry={rr * 1.7 * tilt} fill={K.saffron} opacity={0.22 * (1 - segK(t, TM.slice, TM.slice + 0.4))} stroke={K.saffronDeep} strokeWidth={3} />
      )}
    </g>
  );
};
void easeIn;
void hash;
