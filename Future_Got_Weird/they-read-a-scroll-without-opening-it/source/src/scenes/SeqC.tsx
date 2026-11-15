// C: scan the roll. A new place (the beamline), so a deliberate cut. A crew member starts the scan in a brief wide
// shot; the mounted roll turns between a source and a detector; projections from several angles gather into a
// volume; a slice through the volume is pushed into until it fills the frame as the cross-section spiral. The last
// frame here matches the first frame of the sheet sequence exactly (centre, scale, line weight).
import React from 'react';
import {CAST, CrewChar, IDLE, mixPose, Pose, reach} from '../art/crew3';
import {K} from '../art/kit';
import {Roll1667} from '../art/Roll';
import {SheetLine} from '../art/Sheet';
import {FPS} from '../lib/core';
import {clamp, easeInOut, easeOut, hash, lerp} from '../lib/math';
import {R_OUT, SQUASH} from '../lib/sheet';
import {TM} from '../lib/time';

export const SPIRAL_C = {x: 960, y: 470};
export const SPIRAL_Z = 8.8;

const SAMPLE = {x: 960, y: 455, s: 1.0};
const SRC = {x: 300, y: 455};
const DET = {x: 1560, y: 455};

/** a projection image: the roll's shadow at rotation angle `a` */
const Projection: React.FC<{x: number; y: number; w: number; h: number; a: number; o?: number}> = ({x, y, w, h, a, o = 1}) => (
  <g opacity={o}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6} fill="#E9F2F6" stroke={K.ink} strokeWidth={3} />
    <rect x={x - w * 0.22} y={y - h * 0.4} width={w * 0.44} height={h * 0.8} rx={w * 0.2} fill="#5E6C78" />
    {Array.from({length: 6}, (_, i) => {
      const xx = x - w * 0.18 + ((Math.sin(a + i * 1.7) + 1) / 2) * w * 0.36;
      return <line key={i} x1={xx} y1={y - h * 0.36} x2={xx + (hash(i, 3) - 0.5) * 6} y2={y + h * 0.36} stroke="#3B4650" strokeWidth={2 + hash(i, 4) * 2} opacity={0.8} />;
    })}
  </g>
);

export const SeqC: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const t0 = TM.look - 0.85;
  // the crew member starts the scan
  const press = TM.look + 0.55;
  const crew = {x: 520, y: 1010, scale: 1.0};
  const btn = {x: 720, y: 745};
  const reachK = easeInOut(clamp((t - (t0 + 0.2)) / (press - t0 - 0.2))) * (1 - easeInOut(clamp((t - press - 0.35) / 0.6)));
  const armR = reach(crew, 1, btn.x, btn.y + (t > press - 0.05 && t < press + 0.25 ? 6 : 0));
  const pose: Pose = mixPose({...IDLE, lookX: 0.6, mouth: 'smile'}, {...IDLE, armR, lookX: 0.7, lookY: 0.3, brows: 0.2, mouth: 'smirk', handR: {curl: 0.6, point: 1}}, reachK);
  const beam = clamp((t - press) / 0.25) * (1 - clamp((t - TM.map3d - 0.1) / 0.5));
  // rotation and projections
  const spin = Math.max(0, t - press) * 2.4;
  const snaps = Array.from({length: 6}, (_, k) => TM.researchers + 0.2 + k * ((TM.map3d - 0.6 - TM.researchers) / 6));
  const gather = easeInOut(clamp((t - (TM.map3d - 0.4)) / 1.0));
  const volume = clamp((t - (TM.map3d + 0.3)) / 0.5);
  // camera: a gentle push toward the sample once the scan is running, then into the slice
  const push = 1 + 0.32 * easeInOut(clamp((t - TM.map3d) / (TM.slice + 0.6 - TM.map3d)));
  const sliceDrop = easeInOut(clamp((t - TM.slice) / 0.75));
  const into = clamp((t - (TM.slice + 0.85)) / (TM.spiral + 0.05 - (TM.slice + 0.85)));
  const intoE = easeInOut(into);
  // roll geometry (upright): height 300*s, radius 75*s; the end face (top) is the cross-section
  const rh = 150 * SAMPLE.s;
  const rr = 75 * SAMPLE.s;
  const sliceY = lerp(SAMPLE.y - rh - 30, SAMPLE.y, sliceDrop);
  // slice ellipse on screen (inside the camera push) -> the full-screen spiral
  const sx0 = rr * 0.98 * push;
  const sy0 = sx0 * 0.3;
  const scx0 = 960 + (SAMPLE.x - 960) * push;
  const scy0 = 470 + (sliceY - 470) * push;
  const zx = lerp(sx0 / R_OUT, SPIRAL_Z, intoE);
  const zy = lerp(sy0 / (R_OUT * SQUASH), SPIRAL_Z, intoE);
  const cx = lerp(scx0, SPIRAL_C.x, intoE);
  const cy = lerp(scy0, SPIRAL_C.y, intoE);
  const dark = easeOut(clamp(into * 1.4));
  return (
    <g>
      <rect width={1920} height={1080} fill="#EAF0F2" />
      <g transform={`translate(${960 - 960 * push} ${470 - 470 * push}) scale(${push})`}>
        {/* lab */}
        <rect x={-400} y={760} width={2800} height={800} fill="#D5DEE2" />
        <rect x={-400} y={760} width={2800} height={6} fill="#B9C6CC" />
        {/* source */}
        <rect x={SRC.x - 190} y={SRC.y - 120} width={210} height={240} rx={22} fill="#4F7CC9" stroke={K.ink} strokeWidth={4} />
        <rect x={SRC.x - 160} y={SRC.y - 90} width={110} height={36} rx={10} fill="#D3E1F8" stroke={K.ink} strokeWidth={3} />
        <circle cx={SRC.x + 20} cy={SRC.y} r={18} fill="#2E3F5C" stroke={K.ink} strokeWidth={3} />
        <rect x={SRC.x - 140} y={SRC.y + 120} width={130} height={185} fill="#8FA3AE" stroke={K.ink} strokeWidth={4} />
        {/* beam */}
        <path d={`M${SRC.x + 20} ${SRC.y - 14} L${DET.x} ${DET.y - 150} L${DET.x} ${DET.y + 150} L${SRC.x + 20} ${SRC.y + 14}Z`} fill="#7FE3FF" opacity={0.28 * beam} />
        <path d={`M${SRC.x + 20} ${SRC.y} L${DET.x} ${DET.y}`} stroke="#7FE3FF" strokeWidth={3} opacity={0.6 * beam} strokeDasharray="4 10" strokeDashoffset={-t * 120} />
        {/* rotation stage */}
        <rect x={SAMPLE.x - 120} y={SAMPLE.y + rh + 6} width={240} height={36} rx={10} fill="#9AA8B0" stroke={K.ink} strokeWidth={4} />
        <rect x={SAMPLE.x - 70} y={SAMPLE.y + rh + 42} width={140} height={258} fill="#8796A0" stroke={K.ink} strokeWidth={4} />
        <ellipse cx={SAMPLE.x} cy={SAMPLE.y + rh + 6} rx={120} ry={16} fill="#B7C3CA" stroke={K.ink} strokeWidth={4} />
        {Array.from({length: 8}, (_, i) => {
          const a = spin + (i / 8) * Math.PI * 2;
          if (Math.sin(a) < 0) return null;
          return <line key={i} x1={SAMPLE.x + Math.cos(a) * 112} y1={SAMPLE.y + rh + 6 + Math.sin(a) * 14} x2={SAMPLE.x + Math.cos(a) * 112} y2={SAMPLE.y + rh + 24 + Math.sin(a) * 14} stroke={K.ink} strokeWidth={3} opacity={0.6} />;
        })}
        {/* the roll, upright in its holder (end face = top) */}
        <Roll1667 x={SAMPLE.x} y={SAMPLE.y} s={SAMPLE.s} upright spin={spin} />
        {/* the reconstructed volume */}
        {volume > 0 && (
          <g opacity={volume * (1 - dark)}>
            <rect x={SAMPLE.x - rr - 10} y={SAMPLE.y - rh - 6} width={(rr + 10) * 2} height={rh * 2 + 12} rx={(rr + 10) * 0.4} fill="#7FE3FF" opacity={0.22} stroke="#2BB7E0" strokeWidth={3} />
            {Array.from({length: 7}, (_, i) => (
              <ellipse key={i} cx={SAMPLE.x} cy={SAMPLE.y - rh + (i * rh * 2) / 6} rx={rr + 10} ry={(rr + 10) * 0.28} fill="none" stroke="#2BB7E0" strokeWidth={1.6} opacity={0.6} />
            ))}
          </g>
        )}
        {/* slicing plane */}
        {sliceDrop > 0 && into < 0.02 && (
          <g>
            <ellipse cx={SAMPLE.x} cy={sliceY} rx={rr * 1.9} ry={rr * 0.55} fill={K.saffron} opacity={0.25} stroke={K.saffronDeep} strokeWidth={3} />
            <ellipse cx={SAMPLE.x} cy={sliceY} rx={rr * 0.98} ry={rr * 0.29} fill={K.scanBg} stroke={K.saffron} strokeWidth={3} opacity={clamp(sliceDrop * 3)} />
          </g>
        )}
        {/* detector */}
        <rect x={DET.x} y={DET.y - 170} width={70} height={340} rx={12} fill="#2E3F5C" stroke={K.ink} strokeWidth={4} />
        <rect x={DET.x + 70} y={DET.y + 150} width={40} height={305} fill="#8FA3AE" stroke={K.ink} strokeWidth={4} />
        <Projection x={DET.x + 210} y={DET.y - 30} w={190} h={250} a={spin} o={beam} />
        {/* projections gathered from several angles, then folded into the volume */}
        {snaps.map((ts, k) => {
          const c = clamp((t - ts) / 0.5);
          if (c <= 0) return null;
          const ax = 560 + k * 160;
          const ay = 150;
          const x0 = lerp(DET.x + 210, ax, easeOut(c));
          const y0 = lerp(DET.y - 30, ay, easeOut(c));
          const x = lerp(x0, SAMPLE.x, gather);
          const y = lerp(y0, SAMPLE.y, gather);
          const sc = lerp(lerp(1, 0.55, easeOut(c)), 0.2, gather);
          return <Projection key={k} x={x} y={y} w={190 * sc} h={250 * sc} a={ts * 2.4} o={1 - clamp((gather - 0.7) / 0.3)} />;
        })}
        {/* console and crew member */}
        <g>
          <rect x={655} y={752} width={150} height={260} rx={10} fill="#C6D0D6" stroke={K.ink} strokeWidth={4} />
          <circle cx={btn.x} cy={btn.y} r={16} fill={t > press ? K.green : K.coral} stroke={K.ink} strokeWidth={3} />
          <CrewChar look={CAST.clerkB} pose={pose} frame={f} x={crew.x} y={crew.y} scale={crew.scale} id="crewC" />
        </g>
      </g>
      {/* the push into the slice: the same spiral the sheet sequence starts from */}
      {into > 0 && (
        <g>
          <rect width={1920} height={1080} fill={K.scanBg} opacity={dark} />
          <ellipse cx={cx} cy={cy} rx={R_OUT * zx * 1.06} ry={R_OUT * SQUASH * zy * 1.06} fill={K.scanBg} />
          <g transform={`translate(${cx} ${cy}) scale(${zx} ${zy})`}>
            <SheetLine color={K.scanLine} width={lerp(1, 1.4, intoE)} />
          </g>
        </g>
      )}
    </g>
  );
};
