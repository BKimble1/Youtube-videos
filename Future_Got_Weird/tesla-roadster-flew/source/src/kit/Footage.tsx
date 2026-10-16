import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import manifest from '../data/footage.json';
import {C, F} from '../theme';
import {Chip} from './base';

export type SlotId = keyof typeof manifest.slots;
/** cxKeys: [seconds after `in`, cx] steps, for clips that contain a broadcast cut between two camera angles. */
type Slot = {label: string; want: string; file: string | null; in: number; cx: number; cy: number; zoom: number; audio: number; cxKeys?: [number, number][]};
export const slot = (id: SlotId) => manifest.slots[id] as Slot;
export const missingSlots = (ids: SlotId[]) => ids.filter((id) => !slot(id).file);

/**
 * One shot of official Tesla footage, or an honest placeholder when the clip has not been supplied.
 * `offset` plays from `in + offset` (for replays of the same clip). Audio is the demo's own sound at the slot's
 * level, ducked by `duck` (0..1) while narration runs. `push` adds a slow push-in (fraction of scale per shot).
 */
export const FootageShot: React.FC<{id: SlotId; offset?: number; duck?: number; push?: number; mark?: boolean; markTop?: number; markSize?: number}> = ({
  id, offset = 0, duck = 0.35, push = 0.04, mark = true, markTop = 210, markSize = 30,
}) => {
  const s = slot(id);
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  if (!s.file) return <Placeholder id={id} />;
  // the crop settings in footage.json are for the 9:16 Short; a 16:9 frame shows the whole 16:9 source
  const portrait = height > width;
  const scale = (portrait ? s.zoom : 1) * (1 + push * (frame / Math.max(1, durationInFrames)));
  const tIn = offset + frame / fps;
  const cx = portrait ? (s.cxKeys ?? []).reduce((v, [t, c]) => (tIn >= t ? c : v), s.cx) : 0.5;
  const cy = portrait ? s.cy : 0.5;
  const fade = interpolate(frame, [0, 3], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile('footage/' + s.file)}
        trimBefore={Math.round((s.in + offset) * fps)}
        volume={s.audio * duck * fade}
        style={{
          position: 'absolute', width, height, objectFit: 'cover',
          objectPosition: `${cx * 100}% ${cy * 100}%`, transform: `scale(${scale})`,
          transformOrigin: `${cx * 100}% ${cy * 100}%`,
        }}
      />
      {mark && (
        <div style={{position: 'absolute', left: 48, top: markTop}}>
          <Chip text={manifest.source_mark} kind="source" size={markSize} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Clearly not real footage: says what belongs here, never imitates the shot. */
export const Placeholder: React.FC<{id: SlotId}> = ({id}) => {
  const s = slot(id);
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const u = portrait ? width / 1080 : height / 1080;
  return (
    <AbsoluteFill style={{background: C.paperDeep}}>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <defs>
          <pattern id={'hatch' + id} width={46 * u} height={46 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width={46 * u} height={46 * u} fill={C.paperDeep} />
            <rect width={10 * u} height={46 * u} fill={C.paperLine} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#hatch${id})`} />
        <rect x={40 * u} y={(portrait ? 300 : 60) * u} width={width - 80 * u} height={height - (portrait ? 760 : 120) * u} rx={30 * u}
          fill="rgba(250,243,223,0.82)" stroke={C.coralDeep} strokeWidth={6 * u} strokeDasharray={`${28 * u} ${18 * u}`} />
      </svg>
      <div style={{
        position: 'absolute', left: 90 * u, right: 90 * u, top: (portrait ? 420 : 170) * u, textAlign: 'center',
        fontFamily: F.display, color: C.ink,
      }}>
        <Chip text="PLACEHOLDER · NOT FOR UPLOAD" kind="warn" size={34 * u} />
        <div style={{fontSize: 92 * u, fontWeight: 700, lineHeight: 1.0, marginTop: 40 * u}}>TESLA FOOTAGE<br />GOES HERE</div>
        <div style={{fontSize: 58 * u, fontWeight: 600, marginTop: 34 * u, color: C.coralDeep}}>{id.replace('_', ' · ').replace(/_/g, ' ')}</div>
        <div style={{fontFamily: F.body, fontSize: 40 * u, fontWeight: 700, marginTop: 26 * u}}>{s.label}</div>
        <div style={{fontFamily: F.body, fontSize: 32 * u, fontWeight: 600, marginTop: 18 * u, color: C.inkSoft, lineHeight: 1.3}}>{s.want}</div>
        <div style={{fontFamily: F.mono, fontSize: 26 * u, marginTop: 30 * u, color: C.inkMuted}}>source: official Tesla replay · set in src/data/footage.json</div>
      </div>
    </AbsoluteFill>
  );
};
