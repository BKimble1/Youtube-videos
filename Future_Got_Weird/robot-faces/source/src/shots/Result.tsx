// "The result was a physical face moving its lips along with speech and song. It could even synchronize with audio in
// languages it hadn't been trained on. The meaning of those words wasn't required for the lip movements."
// Close on the robot at its bench. Silent illustrations (no demonstration audio plays under the narration): a speech
// trace, then a sung one with longer vowels, then a trace marked as an untrained language. Then the pipeline:
// audio -> lip motors, with "meaning" standing off the path.
import React from 'react';
import {Tag, UI, Wave} from '../art/Ui';
import {INK} from '../dc/ink';
import {clamp, fmt} from '../dc/math';
import {camPath} from '../lib/cam';
import {pr, T} from '../lib/core';
import {robotVis} from '../lib/visemes';
import {K, robotAt, SONG, SPEECH} from '../state';
import {BenchWorld} from './BenchWorld';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const Box: React.FC<{x: number; y: number; w: number; text: string; k: number; dim?: boolean}> = ({x, y, w, text, k, dim}) =>
  k <= 0.001 ? null : (
    <g opacity={k}>
      <rect x={x - w / 2} y={y - 34} width={w} height={68} rx={18} fill={dim ? '#E8E3D8' : UI.paper} stroke={dim ? '#A9A397' : INK} strokeWidth={3} strokeDasharray={dim ? '8 6' : undefined} />
      <text x={x} y={y + 10} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={800} fontSize={28} fill={dim ? '#8C8679' : INK}>
        {text}
      </text>
    </g>
  );

export const Result: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const cam = camPath(
    f,
    [
      [K.result, {x: 960, y: 540, z: 1.4}],
      [K.meaning - 0.3, {x: 960, y: 545, z: 1.48}],
      [K.meaning + 0.9, {x: 960, y: 430, z: 1.22}],
      [K.distinction, {x: 960, y: 425, z: 1.2}],
    ],
    ease,
  );
  // the drawn trace follows the same silent track the lips follow
  const track = t < K.song + 0.3 ? SPEECH(K.speechAudio + 1.2, K.song + 0.6, 3) : t < K.languages ? SONG(K.song + 0.3, K.languages + 0.2) : SPEECH(K.languages - 0.2, K.distinction, 11);
  const fn = (tt: number) => {
    const v = robotVis(tt, track, 0.06);
    return clamp(v.open * 1.5 + v.round * 0.4 + 0.08);
  };
  const lang = pr(f, K.languages - 0.1, K.languages + 0.3);
  const songK = pr(f, K.song - 0.1, K.song + 0.3) * (1 - lang);
  const pipeK = pr(f, K.meaning - 0.1, K.meaning + 0.4);
  const waveK = 1 - pr(f, K.distinction - 0.6, K.distinction - 0.1);
  return (
    <g>
      <BenchWorld id="rs" cam={cam} st={st} />
      <rect x={300} y={880} width={1320} height={150} rx={24} fill={UI.paper} opacity={0.92 * waveK} stroke={INK} strokeWidth={3} strokeOpacity={waveK} />
      <Wave x={340} y={955} w={1240} h={48} t0={t - 2.5} t1={t + 0.5} cursor={t} fn={fn} k={waveK} color={lang > 0.5 ? UI.blue : UI.teal} />
      <Tag x={330} y={850} text={lang > 0.5 ? 'Audio in a language it was not trained on' : songK > 0.5 ? 'Song' : 'Speech'} k={waveK} size={26} tone="warm" />
      <Tag x={1590} y={850} text="Illustration · demo audio not played" k={waveK * 0.95} size={22} anchor="end" />
      {songK > 0.01 &&
        [0, 1, 2].map((i) => {
          const u = ((t * 0.6 + i / 3) % 1);
          return (
            <text key={i} x={fmt(1260 + i * 70 + u * 40)} y={fmt(520 - u * 160)} fontSize={54} fill={UI.blue} opacity={songK * (1 - u)} fontFamily="Nunito Variable">
              ♪
            </text>
          );
        })}
      {/* the pipeline: audio -> lip motors; meaning is not on the path */}
      <Box x={430} y={180} w={260} text="speech audio" k={pipeK} />
      <Box x={1490} y={180} w={260} text="lip motors" k={pipeK} />
      <Box x={960} y={90} w={220} text="meaning" k={pipeK} dim />
      {pipeK > 0.01 && (
        <g opacity={pipeK}>
          <path d="M565,180 L1355,180" stroke={UI.amber} strokeWidth={6} strokeLinecap="round" />
          <path d="M1335,166 l22,14 l-22,14" fill="none" stroke={UI.amber} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <text x={960} y={225} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={700} fontSize={24} fill="#5A6672">
            not needed for the lip movements
          </text>
        </g>
      )}
    </g>
  );
};
export {T};
