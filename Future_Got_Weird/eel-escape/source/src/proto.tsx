// Geometry prototype (flat shapes): the fish outline and landmarks, the route, and the eel tube at any time, through
// the story camera. For staging checks only; never part of the film.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {closed, open, P, pt, tube} from './core/geo';
import {BODY, EXIT, EYE, GILL_ARCHES, MOUTH, OPERCLE_EDGE, PECTORAL, PREOPERCLE, STOMACH, TRACT} from './anatomy';
import {Layer} from './camera';
import {RADII, S_EXIT} from './eel';
import {camAt, eelAt, fishAt, lensAt} from './story';
import {DIST, layerScale, W as SW, H as SH} from './camera';
import {DUR} from './lib';
import {FPS} from './lib';

export const Proto: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const e = eelAt(t);
  const f = fishAt(t);
  const C: P[] = e.pts.map((q) => pt(q.x, q.y));
  const tb = tube(C, RADII.map((r) => Math.max(0.05, r)), true, true);
  const inside = e.exitIdx;
  const inPts = C.slice(0, Math.min(inside + 1, C.length));
  const skinA = f.xray > 0.5 ? 0.25 : 1 - 0.75 * f.translucent;
  const bg = f.xray > 0.5 ? '#0B1422' : '#5E8F86';
  // the loop wipe: the region the departing tail has already crossed (right of its centreline) shows frame 0
  let wipe: string | null = null;
  if (e.free && t > DUR - 0.62) {
    const z = -lensAt(t) * DIST * c.w, s = layerScale(c, z);
    const sp = C.map((q) => pt(SW / 2 + s * (q.x - c.x), SH / 2 + s * (q.y - c.y)));
    const tail = sp.slice(Math.round(C.length * 0.3));
    wipe = 'M' + tail.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L') + ` L 3000 ${tail[tail.length - 1].y.toFixed(1)} L 3000 -3000 L ${tail[0].x.toFixed(1)} -3000 Z`;
  }
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Layer c={c}>
        <rect x={-200} y={13.5} width={400} height={80} fill="#6E6450" />
        {/* stomach + tract (seen when translucent) */}
        <ellipse cx={STOMACH.c.x} cy={STOMACH.c.y} rx={STOMACH.rx} ry={STOMACH.ry} fill="#C98F7E" opacity={0.6} />
        <path d={open(TRACT.map((q) => pt(q.x, q.y)))} stroke="#B35F57" strokeWidth={3.2} fill="none" strokeLinecap="round" opacity={0.6} />
        {GILL_ARCHES.map((a, i) => <path key={i} d={open(a)} stroke="#C2303A" strokeWidth={0.8} fill="none" />)}
        {/* the eel's inside part */}
        <path d={open(inPts)} stroke="#4E6C86" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        {/* the fish's skin */}
        <path d={closed(BODY, 0.8)} fill="#7A6A45" opacity={skinA} stroke="#172B3A" strokeWidth={0.25} />
        <path d={open(OPERCLE_EDGE)} stroke="#2A2416" strokeWidth={0.35} fill="none" />
        <path d={open(PREOPERCLE)} stroke="#2A2416" strokeWidth={0.25} fill="none" opacity={0.6} />
        <circle cx={EYE.c.x} cy={EYE.c.y} r={EYE.r} fill="#D9A93A" stroke="#172B3A" strokeWidth={0.25} />
        <circle cx={EYE.c.x - 0.3} cy={EYE.c.y} r={EYE.r * 0.55} fill="#111" />
        <path d={`M${MOUTH.tip.x} ${MOUTH.tip.y} Q${(MOUTH.tip.x + MOUTH.corner.x) / 2} ${MOUTH.corner.y + 0.6} ${MOUTH.corner.x} ${MOUTH.corner.y}`} stroke="#172B3A" strokeWidth={0.35} fill="none" />
        <path d={`M${PECTORAL.base[0].x} ${PECTORAL.base[0].y} L${PECTORAL.base[0].x + PECTORAL.reach} ${PECTORAL.base[0].y + 3} L${PECTORAL.base[1].x + PECTORAL.reach * 0.8} ${PECTORAL.base[1].y + 4} L${PECTORAL.base[1].x} ${PECTORAL.base[1].y} Z`} fill="#B7893F" opacity={0.85} />
        {/* gill flare: a dark gap beneath the edge */}
        <path d={open(OPERCLE_EDGE.map((q, i) => pt(q.x + f.gill * 0.9 * Math.sin((i / 7) * Math.PI), q.y)))} stroke="#5A1418" strokeWidth={0.7 * f.gill + 0.1} fill="none" />
        {/* the eel's outside part (and, in X-ray/translucent, the whole eel drawn over) */}
        <path d={closed(tb.outline, 0.5)} fill="#5E7E9A" stroke="#172B3A" strokeWidth={0.18} opacity={e.free && lensAt(t) === 0 ? 1 : 0} />
        {!e.free && inside <= C.length - 1 && (
          <path d={open(C.slice(Math.max(0, inside - 1)))} stroke="#5E7E9A" strokeWidth={RADII[Math.min(RADII.length - 1, inside)] * 2} fill="none" strokeLinecap="round" />
        )}
        {(f.translucent > 0.3 || f.xray > 0.3) && <path d={closed(tb.outline, 0.5)} fill="#5E7E9A" opacity={0.95} />}
        <circle cx={C[3].x} cy={C[3].y} r={0.45} fill="#111" />
        <circle cx={EXIT.x} cy={EXIT.y} r={0.3} fill="#FF0" />
      </Layer>
      {wipe && <div style={{position: 'absolute', inset: 0, clipPath: `path('${wipe}')`}}><Proto t={t - DUR} /></div>}
      {e.free && lensAt(t) > 0 && (
        <Layer c={c} z={-lensAt(t) * DIST * c.w}>
          <path d={closed(tb.outline, 0.5)} fill="#5E7E9A" stroke="#172B3A" strokeWidth={0.18} />
        </Layer>
      )}
      <div style={{position: 'absolute', left: 30, bottom: 40, color: '#FF0', fontSize: 44, fontFamily: 'monospace'}}>
        {`t ${t.toFixed(2)}  σtip ${(e.sigTip - S_EXIT).toFixed(1)} (rel exit)  ${e.free ? 'FREE' : ''} yaw ${(f.yaw * 57.3).toFixed(0)} cut ${f.cut.toFixed(2)} x ${f.xray.toFixed(2)}`}
      </div>
    </AbsoluteFill>
  );
};

export const ProtoSheet: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 5}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Proto t={t} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
export const PROTO_FPS = FPS;
