import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, H, W, E, tw, tapeLead, tapePoly, TAPE_BW, lerp} from '../film/common';
import {TOTAL_V2, V2} from '../cues_v2';
import {OpenerHud, OpenerWorld} from './opener';
import {B02Hud, B02World, B03World, STAMP_AT} from './shots1';
import {B04Hud, B04World, B05Hud, ShotA, ShotB, ShotC} from './shots2';
import {B06Hud, B06World, B07Hud, B07World, B09World} from './shots3';
import {Attrib, CaptionsV2} from './hud';

const LOOP = V2['loop.tear'];
const WIPE = {from: V2['tape.wipe'], to: V2['tape.wipe'] + 17};
const IRIS = {from: V2['iris.b04'] - 2, to: V2['iris.b04'] + 13};
const IR = 2300;

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

const slideX = (g: number, from: number, dur = 6) => (1 - E.out(tw(g, from, dur))) * W;
const slideY = (g: number, from: number, dur = 8) => (1 - E.out(tw(g, from, dur))) * H;

export const FilmV2: React.FC<{captions?: boolean; audio?: boolean}> = ({captions = false, audio = true}) => {
  const g = useCurrentFrame();
  const t = g >= LOOP ? g - TOTAL_V2 : g; // the closing tear plays the opener's pre-roll
  const wiping = g >= WIPE.from && g < WIPE.to + 1;
  const rIris = E.inOut(tw(g, IRIS.from, IRIS.to - IRIS.from)) * IR;
  const leftPoly = `-20,0 ${tapeLead(g, WIPE.from, WIPE.to, 0)},0 ${tapeLead(g, WIPE.from, WIPE.to, H)},${H} -20,${H}`;
  const rightPoly = tapePoly(g, WIPE.from, WIPE.to);
  const lead = (y: number) => tapeLead(g, WIPE.from, WIPE.to, y);
  // closing tear: the receipt (layer above) is pulled up, revealing the opener pre-roll underneath
  const yT = lerp(H + 70, -90, E.inOut(tw(g, LOOP, TOTAL_V2 - LOOP - 1)));
  const edge = zig(yT, g);
  const aboveEdge = `0,-20 ${W},-20 ${edge.slice().reverse().join(' ')}`;
  const belowEdge = `0,${H + 20} ${W},${H + 20} ${edge.slice().reverse().join(' ')}`;

  const k0 = E.inOut(tw(t, 18, 22));
  const cam0 = {z: 1 + 0.05 * k0, cx: lerp(540, 640, k0), cy: lerp(936, 876, k0)};
  const showOpener = g <= 114 || g >= LOOP;

  // attribution state
  const leadText = g < 46 || g >= LOOP ? 'ATLAS HAND · Boston Dynamics' : 'Source: Boston Dynamics';
  const TAGS: [number, number, string | undefined][] = [
    [84, 243, 'RECONSTRUCTION'], [297, 489, 'CONCEPT DIAGRAM'], [489, 609, 'COMPANY-REPORTED ABILITY'],
    [609, 792, 'DESIGN OPTION'], [792, 939, 'DESIGN-GOAL ILLUSTRATION'], [939, 1038, 'EDITORIAL JOKE'],
  ];
  const tg = TAGS.find(([a, b]) => g >= a && g < b);
  const tagK = tg ? Math.min(1, (g - tg[0] + 1) / 6) * Math.min(1, (tg[1] - g) / 4) : 0;

  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id="tL"><polygon points={leftPoly} /></clipPath>
          <clipPath id="tR"><polygon points={rightPoly} /></clipPath>
          <clipPath id="b03out"><path clipRule="evenodd" d={outside(STAMP_AT.x, STAMP_AT.y, rIris)} /></clipPath>
          <clipPath id="b04in"><path d={circle(STAMP_AT.x, STAMP_AT.y, Math.max(0.01, rIris))} /></clipPath>
          <clipPath id="above"><polygon points={aboveEdge} /></clipPath>
          <clipPath id="below"><polygon points={belowEdge} /></clipPath>
        </defs>

        {/* underlay: the opener (frame 0 .. and, after the tear, its pre-roll: t = g - total) */}
        {showOpener && (
          <g clipPath={wiping ? 'url(#tL)' : undefined}>
            <g transform={`translate(540 960) scale(${cam0.z}) translate(${-cam0.cx} ${-cam0.cy})`}>
              <OpenerWorld t={t} />
            </g>
            <OpenerHud t={t} />
          </g>
        )}

        {g >= WIPE.from && g < 254 && (
          <g clipPath={wiping ? 'url(#tR)' : undefined}>
            <B02World g={g} />
            <B02Hud g={g} />
          </g>
        )}
        {g >= 238 && g < IRIS.to + 1 && (
          <g transform={`translate(0 ${slideY(g, 238, 10)})`} clipPath={g >= IRIS.from ? 'url(#b03out)' : undefined}>
            <B03World g={g} />
          </g>
        )}
        {g >= IRIS.from && g < 512 && (
          <g clipPath={g < IRIS.to ? 'url(#b04in)' : undefined}>
            <B04World g={g} />
            <B04Hud g={g} />
          </g>
        )}
        {g >= 486 && g < 548 && (
          <g transform={`translate(${slideX(g, 486)} 0)`}><ShotA g={g} /></g>
        )}
        {g >= 538 && g < 578 && (
          <g transform={`translate(0 ${slideY(g, 538, 7)})`}><ShotB g={g} /></g>
        )}
        {g >= 567 && g < 616 && (
          <g transform={`translate(${slideX(g, 567)} 0)`}><ShotC g={g} /></g>
        )}
        {g >= 520 && g < 612 && <B05Hud g={g} />}
        {g >= 604 && g < 800 && (
          <g transform={`translate(${slideX(g, 604, 8)} 0)`}>
            <B06World g={g} />
            <B06Hud g={g} />
          </g>
        )}
        {g >= 789 && g < 948 && (
          <g transform={`translate(0 ${slideY(g, 789, 9)})`}>
            <B07World g={g} />
            {g < 882 && <B07Hud g={g} />}
          </g>
        )}
        {g >= 935 && (
          <g transform={`translate(0 ${-(1 - E.out(tw(g, 935, 9))) * H})`} clipPath={g >= LOOP ? 'url(#above)' : undefined}>
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

        {/* attribution pills */}
        {g < LOOP && <Attrib lead={leadText} tag={tg?.[2]} tagK={tagK} />}
        {g >= LOOP && (
          <>
            <g clipPath="url(#above)"><Attrib lead="Source: Boston Dynamics" tag="EDITORIAL JOKE" tagK={1} /></g>
            <g clipPath="url(#below)"><Attrib lead="ATLAS HAND · Boston Dynamics" /></g>
          </>
        )}
        {captions && <CaptionsV2 g={g} />}
        {wiping && (
          <polygon points={`${lead(0)},0 ${lead(0) + TAPE_BW},0 ${lead(H) + TAPE_BW},${H} ${lead(H)},${H}`} fill={C.blue} stroke={C.ink} strokeWidth={5} opacity={0.96} />
        )}
      </svg>
      {audio && <Audio src={staticFile('audio/final_mix_v2.wav')} />}
    </AbsoluteFill>
  );
};
