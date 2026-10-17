// THE LAST CHOICE — R2 master timeline. One Sequence per registered shot (src/r2/film/registry.ts and the section
// modules in src/r2/shots/*); uncovered stretches of a section show a card with the section's beat. Audio: the R2 mix
// (git-ignored: it contains the supplied recordings).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, SECTIONS, FILM_END} from '../timing';
import {BASE_SHOTS, R2Shot} from './registry';
import {SECTION_SHOTS} from '../shots';
import {F} from '../../theme';

const tc = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;

const Card: React.FC<{id: string; start: number; end: number; note: string}> = ({id, start, end, note}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#1d1d22'}}>
      <text x={96} y={200} fontFamily={F.display} fontSize={96} fill="#E8E2D4">{id}</text>
      <text x={96} y={270} fontFamily={F.body} fontSize={38} fill="#9A9488">{tc(start)} – {tc(end)}</text>
      <foreignObject x={96} y={320} width={1700} height={520}><div style={{fontFamily: F.body, fontSize: 46, color: '#E8E2D4', lineHeight: 1.25}}>{note}</div></foreignObject>
      <rect x={96} y={900} width={1728 * Math.min(1, t / Math.max(0.1, end - start))} height={10} fill="#E9A91C" />
    </svg>
  );
};

/** All shots in time order, plus filler cards for uncovered spans of each section. */
export const timeline = (): R2Shot[] => {
  const shots = [...BASE_SHOTS, ...SECTION_SHOTS].sort((a, b) => a.start - b.start);
  const out: R2Shot[] = [];
  let cursor = 0;
  const fill = (a: number, b: number) => {
    // split the gap by section
    SECTIONS.forEach((s) => {
      const x0 = Math.max(a, s.start), x1 = Math.min(b, s.end);
      if (x1 - x0 > 1 / FPS) out.push({id: `${s.id}·card`, sec: s.id, start: x0, end: x1, note: s.note, C: () => <Card id={s.id} start={x0} end={x1} note={s.note} />});
    });
  };
  shots.forEach((s) => {
    if (s.start > cursor + 1 / FPS) fill(cursor, s.start);
    out.push(s);
    cursor = Math.max(cursor, s.end);
  });
  if (cursor < FILM_END - 1 / FPS) fill(cursor, FILM_END);
  return out;
};

export const MainR2: React.FC<{audio?: 'mix' | false}> = ({audio = false}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {timeline().map((s, i) => {
      const from = Math.round(s.start * FPS), to = Math.round(s.end * FPS);
      return (
        <Sequence key={`${s.id}_${i}`} name={s.id} from={from} durationInFrames={Math.max(1, to - from)}>
          <s.C />
        </Sequence>
      );
    })}
    {audio === 'mix' ? <Audio src={staticFile('audio/r2_mix.wav')} /> : null}
  </AbsoluteFill>
);
