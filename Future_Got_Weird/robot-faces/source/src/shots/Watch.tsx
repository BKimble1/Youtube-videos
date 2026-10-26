// "Once it had a way to control its own appearance, researchers gave it something else to watch. People." ...
// "Speech audio could then drive coordinated lip movements through the motors."
// The camera draws back from the face and travels along the bench to the monitor as the robot turns to it: the source
// of what it watches has changed, so the scene changes. The monitor shows a person talking, then many talking and
// singing mouths, then one sound/mouth example with its trace anchored to the screen's lower edge. The robot's
// self-model (the recorded pairs from the mirror) is linked to it, and speech then drives the robot's lips.
import React from 'react';
import {Tag, UI, Wave} from '../art/Ui';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {camPath, toScreen} from '../lib/cam';
import {pr, T} from '../lib/core';
import {humanVis} from '../lib/visemes';
import {K, robotAt, screenFaceAt, SPEECH} from '../state';
import {BenchWorld, BW, ScreenFace} from './BenchWorld';
import {Pair} from './Practice';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TONES = ['#F2C9A8', '#C98B5E', '#8D5A3B', '#E7B48F', '#5E3A25', '#F5D3B8'];
/** a cropped talking (or singing) mouth: skin, lips opening with a deterministic syllable track */
export const MouthTile: React.FC<{x: number; y: number; w: number; h: number; tone: string; open: number; wide: number; id: string}> = ({x, y, w, h, tone, open, wide, id}) => {
  const cx = x + w / 2;
  const cy = y + h / 2 + 4;
  const hw = w * 0.3 * wide;
  const o = h * 0.26 * clamp(open);
  const lipC = tone === '#F2C9A8' || tone === '#F5D3B8' || tone === '#E7B48F' ? '#C9786E' : '#7A3E38';
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={x} y={y} width={w} height={h} rx={8} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={x} y={y} width={w} height={h} fill={tone} />
        <ellipse cx={cx} cy={y - h * 0.1} rx={w * 0.18} ry={h * 0.32} fill="#000" opacity={0.08} />
        <path d={`M${fmt(cx - hw)},${fmt(cy)} Q${fmt(cx)},${fmt(cy - o - 4)} ${fmt(cx + hw)},${fmt(cy)} Q${fmt(cx)},${fmt(cy + o + 4)} ${fmt(cx - hw)},${fmt(cy)} Z`} fill="#3B1A20" />
        <path d={`M${fmt(cx - hw)},${fmt(cy)} Q${fmt(cx - hw * 0.4)},${fmt(cy - o - 16)} ${fmt(cx)},${fmt(cy - o - 10)} Q${fmt(cx + hw * 0.4)},${fmt(cy - o - 16)} ${fmt(cx + hw)},${fmt(cy)} Q${fmt(cx)},${fmt(cy - o - 2)} ${fmt(cx - hw)},${fmt(cy)} Z`} fill={lipC} stroke={INK} strokeWidth={2} />
        <path d={`M${fmt(cx - hw)},${fmt(cy)} Q${fmt(cx)},${fmt(cy + o + 2)} ${fmt(cx + hw)},${fmt(cy)} Q${fmt(cx)},${fmt(cy + o + 20)} ${fmt(cx - hw)},${fmt(cy)} Z`} fill={lipC} stroke={INK} strokeWidth={2} />
      </g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke="#10161D" strokeWidth={3} />
    </g>
  );
};

export const Watch: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const MX = BW.mon.x, MY = BW.mon.y, MW = BW.mon.w, MH = BW.mon.h;
  const cam = camPath(
    f,
    [
      [K.once, {x: 1000, y: 520, z: 1.1}],
      [K.people - 0.2, {x: 1560, y: 560, z: 1.02}],
      [K.important - 0.3, {x: 1600, y: 560, z: 1.04}],
      [K.important + 1.2, {x: MX - 40, y: MY + 20, z: 1.75}],
      [K.linked - 0.2, {x: MX - 40, y: MY + 20, z: 1.8}],
      [K.linked + 1.3, {x: 1560, y: 560, z: 1.02}],
      [K.result, {x: 1520, y: 560, z: 1.05}],
    ],
    ease,
  );
  const monOn = pr(f, K.people - 0.25, K.people + 0.1);
  // screen content phases
  const faceK = 1 - pr(f, T('videos of humans') - 0.2, T('videos of humans') + 0.2);
  const tilesK = pr(f, T('videos of humans') - 0.2, T('videos of humans') + 0.2) * (1 - pr(f, K.important - 0.3, K.important + 0.1));
  const oneK = pr(f, K.important - 0.3, K.important + 0.1);
  const playerK = pr(f, K.youtube - 0.1, K.youtube + 0.3) * (1 - pr(f, K.important - 0.4, K.important));
  const sf = screenFaceAt(f);
  // tiles: six mouths, three talking, three singing (longer vowels)
  const tiles = TONES.map((tone, i) => {
    const sing = i % 2 === 1;
    const tr = SPEECH(K.people, K.result, 3 + i * 5);
    const v = humanVis(sing ? (t * 0.4) + i : t + i * 0.37, tr, 0.06);
    return {tone, open: sing ? 0.35 + 0.35 * Math.abs(Math.sin(t * 1.6 + i)) : v.open * 1.4, wide: sing ? 0.75 : v.wide};
  });
  // the one example: its mouth follows a short sample; the trace runs along the screen's lower edge with a playhead
  const ex0 = K.important;
  const exT = (t - ex0) % 3.0;
  const exTrack = SPEECH(0, 3.0, 9);
  const exV = humanVis(exT, exTrack, 0.06);
  const exFn = (tt: number) => {
    const v = humanVis(((tt % 3) + 3) % 3, exTrack, 0.06);
    return clamp(v.open * 1.6 + (v.wide > 1.1 ? 0.3 : 0));
  };
  // the link to the self-model and the drive into the motors
  const linkK = pr(f, K.linked + 0.6, K.linked + 1.3);
  const driveK = pr(f, K.speechAudio, K.speechAudio + 0.6);
  const head = toScreen(cam, {x: BW.head.x, y: BW.head.y});
  const monS = toScreen(cam, {x: MX - MW / 2, y: MY + MH / 2 - 40});
  return (
    <g>
      <BenchWorld
        id="wt"
        cam={cam}
        st={st}
        monOn={monOn}
        xray={driveK * 0.85}
        xrayHot={['lip', 'corner', 'jaw']}
        screen={
          <g>
            <ScreenFace id="wt-sf" expr={sf} k={faceK} />
            {tilesK > 0.001 && (
              <g opacity={tilesK}>
                <rect x={MX - MW / 2} y={MY - MH / 2} width={MW} height={MH} fill="#141B22" />
                {tiles.map((q, i) => (
                  <MouthTile key={i} id={`wt-t${i}`} x={MX - MW / 2 + 16 + (i % 3) * 178} y={MY - MH / 2 + 18 + Math.floor(i / 3) * 150} w={168} h={136} tone={q.tone} open={q.open} wide={q.wide} />
                ))}
                {playerK > 0.001 && (
                  <g opacity={playerK}>
                    <rect x={MX - MW / 2} y={MY + MH / 2 - 46} width={MW} height={46} fill="#000" opacity={0.7} />
                    <path d={`M${MX - MW / 2 + 18},${MY + MH / 2 - 32} l16,9 l-16,9 Z`} fill="#FFF" />
                    <rect x={MX - MW / 2 + 50} y={MY + MH / 2 - 25} width={MW - 200} height={6} rx={3} fill="#5A6672" />
                    <rect x={MX - MW / 2 + 50} y={MY + MH / 2 - 25} width={fmt((MW - 200) * clamp((t - K.youtube) / 2.2))} height={6} rx={3} fill={UI.coral} />
                    <text x={MX + MW / 2 - 18} y={MY + MH / 2 - 16} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize={20} fill="#FFF">
                      {`${String(Math.floor(clamp((t - K.youtube) / 2.2) * 5)).padStart(2, '0')}:${String(Math.floor(((t * 977) % 60))).padStart(2, '0')}:${String(Math.floor((t * 6011) % 60)).padStart(2, '0')}`}
                    </text>
                  </g>
                )}
              </g>
            )}
            {oneK > 0.001 && (
              <g opacity={oneK}>
                <rect x={MX - MW / 2} y={MY - MH / 2} width={MW} height={MH} fill="#141B22" />
                <MouthTile id="wt-one" x={MX - 150} y={MY - MH / 2 + 20} w={300} h={200} tone={TONES[1]} open={exV.open * 1.4} wide={exV.wide} />
                <Wave x={MX - MW / 2 + 30} y={MY + MH / 2 - 52} w={MW - 60} h={34} t0={exT - 1.5} t1={exT + 1.5} cursor={exT} fn={exFn} />
                <rect x={MX - 30} y={MY + MH / 2 - 96} width={60} height={88} rx={8} fill="none" stroke={UI.amber} strokeWidth={4} />
                <path d={`M${MX},${MY + MH / 2 - 96} L${MX},${MY + MH / 2 - 112} L${MX},${MY - MH / 2 + 222}`} stroke={UI.amber} strokeWidth={3} strokeDasharray="6 5" />
              </g>
            )}
          </g>
        }
      />
      <Tag x={70} y={90} text="Lip-sync study · Science Robotics · January 2026" k={pr(f, K.study26 + 0.1, K.study26 + 0.5) * (1 - pr(f, K.important - 0.6, K.important - 0.2))} size={26} />
      <Tag x={monS.x} y={monS.y - 280 * cam.z} text="sound ↔ mouth" k={oneK * (1 - pr(f, K.linked + 0.4, K.linked + 0.8))} size={28} tone="warm" />
      {/* the robot's self-model (the mirror record), linked to the sound/mouth examples */}
      {linkK > 0.001 && (
        <g opacity={linkK}>
          <Tag x={head.x + 300} y={head.y - 300} text="its model of its own face" k={1} size={24} tone="light" />
          {[0, 1, 2].map((i) => (
            <Pair key={i} id={`wl${i}`} x={head.x + 300} y={head.y - 270 + i * 132} i={i} k={1} />
          ))}
          <path d={`M${fmt(monS.x + 40)},${fmt(monS.y - 300 * cam.z)} C${fmt(monS.x - 40)},${fmt(head.y - 420)} ${fmt(head.x + 700)},${fmt(head.y - 400)} ${fmt(head.x + 555)},${fmt(head.y - 240)}`} fill="none" stroke={UI.amber} strokeWidth={4} strokeDasharray="10 8" />
        </g>
      )}
      <Tag x={head.x} y={head.y + 290} text="speech audio → lip motors" k={driveK} size={26} tone="warm" anchor="middle" />
    </g>
  );
};
