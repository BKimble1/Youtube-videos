import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, H, W, E, tw, tapeLead, tapePoly, TAPE_BW, lerp, clamp01} from '../film/common';
import {TOTAL_V4, V4, MIX_FILE} from './cues';
import './fonts4';
import {OpenerHud, OpenerWorld} from './opener';
import {B02Hud, B02World, B03World, STAMP_AT} from './shots1';
import {B04Hud, B04World, ShotA, ShotB, ShotC} from './shots2';
import {B06Hud, B06World, B07Hud, B07World, B09World} from './shots3';
import {CaptionsV4} from './type';

/**
 * V4 film: no persistent source/tag bars (the company is named once, in the opener); captions are the only text in the lower lane.
 * Scene changes other than the three signature transitions (tape wipe, stamp iris, receipt tear) are SHORT edge wipes: the incoming scene
 * does not translate, a thin ink/coral bar travels across it, so no scene artwork is dragged through the fixed caption lane.
 */
const LOOP = V4['loop.tear'];
const WIPE = {from: V4['tape.wipe'], to: V4['tape.wipe'] + 17};
const IRIS = {from: V4['iris.b04'] - 2, to: V4['iris.b04'] + 13};
const IR = 2300;
const CUT = 5; // frames for a short wipe

const START = {
  b03: V4['slip.in'] - 4,
  a: V4['b05.cut_b'] - 46,
  b: V4['b05.cut_b'],
  c: V4['b05.cut_c'],
  b06: V4['b06.slide'],
  b07: V4['b07.slide'],
  b09: V4['b09.drop'],
};

const circle = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
const outside = (cx: number, cy: number, r: number) => `M -10 -10 H ${W + 10} V ${H + 10} H -10 Z ${circle(cx, cy, Math.max(0.01, r))}`;

const zig = (y: number, g: number) => {
  const pts: string[] = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const x = (W / n) * i;
    pts.push(`${x},${y + (i % 2 ? 20 : -6) + 4 * Math.sin(i * 1.9 + g * 0.2)}`);
  }
  return pts;
};

type Dir = 'left' | 'up' | 'down';
/** revealed-region rect for an edge wipe that starts at frame `from`; `p` is 0..1 progress (eased) */
const wipeRect = (dir: Dir, p: number) => {
  if (dir === 'left') return {x: W * (1 - p), y: 0, width: W * p + 2, height: H};
  if (dir === 'up') return {x: 0, y: H * (1 - p), width: W, height: H * p + 2};
  return {x: 0, y: 0, width: W, height: H * p};
};
const WipeBar: React.FC<{g: number; from: number; dir: Dir}> = ({g, from, dir}) => {
  const k = (g - from) / CUT;
  if (k <= 0 || k >= 1) return null;
  const p = E.inOut(k);
  const bw = 26;
  if (dir === 'left') {
    const x = W * (1 - p);
    return <g><rect x={x - 2} y={0} width={bw} height={H} fill={C.ink} /><rect x={x + 6} y={0} width={10} height={H} fill={C.coral} /></g>;
  }
  if (dir === 'up') {
    const y = H * (1 - p);
    return <g><rect x={0} y={y - 2} width={W} height={bw} fill={C.ink} /><rect x={0} y={y + 6} width={W} height={10} fill={C.coral} /></g>;
  }
  const y = H * p;
  return <g><rect x={0} y={y - bw + 2} width={W} height={bw} fill={C.ink} /><rect x={0} y={y - 16} width={W} height={10} fill={C.coral} /></g>;
};

export const FilmV4: React.FC<{captions?: boolean; audio?: boolean}> = ({captions = false, audio = true}) => {
  const g = useCurrentFrame();
  const t = g >= LOOP ? g - TOTAL_V4 : g; // the closing tear plays the opener's pre-roll
  const wiping = g >= WIPE.from && g < WIPE.to + 1;
  const rIris = E.inOut(tw(g, IRIS.from, IRIS.to - IRIS.from)) * IR;
  const leftPoly = `-20,0 ${tapeLead(g, WIPE.from, WIPE.to, 0)},0 ${tapeLead(g, WIPE.from, WIPE.to, H)},${H} -20,${H}`;
  const rightPoly = tapePoly(g, WIPE.from, WIPE.to);
  const lead = (y: number) => tapeLead(g, WIPE.from, WIPE.to, y);
  const yT = lerp(H + 70, -90, E.inOut(tw(g, LOOP, TOTAL_V4 - LOOP - 1)));
  const edge = zig(yT, g);
  const aboveEdge = `0,-20 ${W},-20 ${edge.slice().reverse().join(' ')}`;

  const showOpener = g <= WIPE.to + 1 || g >= LOOP;
  const win = (from: number, dir: Dir) => (g >= from && g < from + CUT + 1 ? wipeRect(dir, E.inOut(clamp01((g - from) / CUT))) : null);
  const r03 = win(START.b03, 'up'), rA = win(START.a, 'left'), rB = win(START.b, 'up'), rC = win(START.c, 'left');
  const r06 = win(START.b06, 'left'), r07 = win(START.b07, 'up'), r09 = win(START.b09, 'down');
  const clip = (id: string, r: ReturnType<typeof win>) => (r ? <clipPath id={id}><rect {...r} /></clipPath> : null);

  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id="tL"><polygon points={leftPoly} /></clipPath>
          <clipPath id="tR"><polygon points={rightPoly} /></clipPath>
          <clipPath id="b03out"><path clipRule="evenodd" d={outside(STAMP_AT.x, STAMP_AT.y, rIris)} /></clipPath>
          <clipPath id="b04in"><path d={circle(STAMP_AT.x, STAMP_AT.y, Math.max(0.01, rIris))} /></clipPath>
          <clipPath id="above"><polygon points={aboveEdge} /></clipPath>
          {clip('w03', r03)}{clip('wA', rA)}{clip('wB', rB)}{clip('wC', rC)}{clip('w06', r06)}{clip('w07', r07)}{clip('w09', r09)}
        </defs>

        {showOpener && (
          <g clipPath={wiping ? 'url(#tL)' : undefined}>
            <OpenerWorld t={t} />
            <OpenerHud t={t} />
          </g>
        )}

        {g >= WIPE.from && g < START.b03 + CUT + 1 && (
          <g clipPath={wiping ? 'url(#tR)' : undefined}>
            <B02World g={g} />
            <B02Hud g={g} />
          </g>
        )}
        {g >= START.b03 && g < IRIS.to + 1 && (
          <g clipPath={g >= IRIS.from ? 'url(#b03out)' : r03 ? 'url(#w03)' : undefined}>
            <B03World g={g} />
          </g>
        )}
        {g >= IRIS.from && g < START.a + CUT + 1 && (
          <g clipPath={g < IRIS.to ? 'url(#b04in)' : undefined}>
            <B04World g={g} />
            <B04Hud g={g} />
          </g>
        )}
        {g >= START.a && g < START.b + CUT + 1 && (
          <g clipPath={rA ? 'url(#wA)' : undefined}><ShotA g={g} /></g>
        )}
        {g >= START.b && g < START.c + CUT + 1 && (
          <g clipPath={rB ? 'url(#wB)' : undefined}><ShotB g={g} /></g>
        )}
        {g >= START.c && g < START.b06 + CUT + 1 && (
          <g clipPath={rC ? 'url(#wC)' : undefined}><ShotC g={g} /></g>
        )}
        {g >= START.b06 && g < START.b07 + CUT + 1 && (
          <g clipPath={r06 ? 'url(#w06)' : undefined}>
            <B06World g={g} />
            <B06Hud g={g} />
          </g>
        )}
        {g >= START.b07 && g < START.b09 + CUT + 1 && (
          <g clipPath={r07 ? 'url(#w07)' : undefined}>
            <B07World g={g} />
            <B07Hud g={g} />
          </g>
        )}
        {g >= START.b09 && (
          <g clipPath={g >= LOOP ? 'url(#above)' : r09 ? 'url(#w09)' : undefined}>
            <B09World g={g} />
          </g>
        )}
        {g >= LOOP && (
          <g>
            <polygon points={`${edge.join(' ')} ${edge.slice().reverse().map((p) => { const [x, y] = p.split(',').map(Number); return `${x},${y - 46}`; }).join(' ')}`} fill={C.cream} stroke={C.ink} strokeWidth={5} />
            <g stroke={C.inkMuted} strokeWidth={6} strokeLinecap="round" opacity={0.7}>
              {Array.from({length: 22}).map((_, i) => (
                <circle key={i} cx={30 + i * 48} cy={yT - 28} r={5} fill={C.inkMuted} stroke="none" />
              ))}
            </g>
          </g>
        )}

        {captions && <CaptionsV4 g={g} />}
        {wiping && (
          <polygon points={`${lead(0)},0 ${lead(0) + TAPE_BW},0 ${lead(H) + TAPE_BW},${H} ${lead(H)},${H}`} fill={C.blue} stroke={C.ink} strokeWidth={5} opacity={0.96} />
        )}
        <WipeBar g={g} from={START.b03} dir="up" />
        <WipeBar g={g} from={START.a} dir="left" />
        <WipeBar g={g} from={START.b} dir="up" />
        <WipeBar g={g} from={START.c} dir="left" />
        <WipeBar g={g} from={START.b06} dir="left" />
        <WipeBar g={g} from={START.b07} dir="up" />
        <WipeBar g={g} from={START.b09} dir="down" />
      </svg>
      {audio && <Audio src={staticFile(MIX_FILE)} />}
    </AbsoluteFill>
  );
};
