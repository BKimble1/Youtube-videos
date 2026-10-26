// Dev root for S07 / S08 check renders (camera-roach): single frames, contact sheets, camera tries and a top-view plan.
import React from 'react';
import {AbsoluteFill, Still} from 'remotion';
import '../../fonts';
import {S07, S07CamSet, s07Cam, obsPose} from '../../shots/S07';
import {S08, medicPose, povCam} from '../../shots/S08';
import {shotAt} from '../../shots';
import {Captions} from '../../Captions';
import {FPS} from '../../timeline';
import {lookAt, proj} from '../../lib/cam';
import {Roach} from '../../rig/Roach';
import {Gear} from '../../rig/Gear';
import {ArenaFloor, TargetFixture} from '../../sets/Lab';
import {fmt} from '../../lib/g3';
import {V3} from '../../lib/v3';

const Shot: React.FC<{f: number; k?: string}> = ({f, k}) => {
  if (f >= 315 && f < 372) return <S07 f={f} lf={f - 315} n={57} k={k} />;
  if (f >= 372 && f < 462) return <S08 f={f} lf={f - 372} n={90} k={k} />;
  const s = shotAt(f);
  return <s.C f={f} lf={f - s.from} n={s.to - s.from} />;
};
const One: React.FC<{f: number; captions?: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
    <Shot f={f} />
    {captions && <Captions f={f} />}
  </AbsoluteFill>
);
const Tile: React.FC<{i: number; n: number; f: number; label: string; captions?: boolean; children?: React.ReactNode}> = ({i, n, f, label, captions, children}) => {
  const W = 1080 / n, H = 1920 / n;
  return (
    <div style={{position: 'absolute', left: (i % n) * W, top: Math.floor(i / n) * H, width: 1080, height: 1920, transform: `scale(${1 / n})`, transformOrigin: '0 0', overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
        {children ?? <Shot f={f} k={`t${i}`} />}
        {captions && <Captions f={f} />}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 20, top: 20, fontSize: 30 * n, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{label}</div>
    </div>
  );
};
/** n across (n = 4: 16 frames at quarter size; n = 6: 36 frames) */
const Sheet: React.FC<{fs: number[]; captions?: boolean; n?: number}> = ({fs, captions, n = 4}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <Tile key={i} i={i} n={n} f={f} captions={captions} label={`${f} (${(f / FPS).toFixed(2)})`} />
    ))}
  </AbsoluteFill>
);
type Try = {f: number; az: number; el: number; R: number; fl: number; cy: number; tgt?: V3};
const D2R = Math.PI / 180;
const CamTry: React.FC<{tries: Try[]; captions?: boolean}> = ({tries, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {tries.map((c, i) => {
      const cs: S07CamSet = {az: c.az * D2R, el: c.el * D2R, R: c.R, f: c.fl, cy: c.cy, aim: c.tgt ?? [10, 13, 0]};
      return (
        <Tile key={i} i={i} n={4} f={c.f} captions={captions} label={`${i}: ${c.f} az${c.az} el${c.el} R${c.R} f${c.fl}`}>
          <S07 f={c.f} lf={c.f - 315} n={57} k={`c${i}`} cam={cs} />
        </Tile>
      );
    })}
  </AbsoluteFill>
);
/** top view of the arena at film frame f: target, both insects, the S07 camera (red) and the POV camera (blue) */
const Top: React.FC<{f: number; c?: [number, number]; span?: number}> = ({f, c = [150, 40], span = 520}) => {
  const t = f / FPS;
  const fl = 1920 / (span / 1000) / 1.8;
  const cam = lookAt([c[0], 1000, c[1] + 0.001], [c[0], 0, c[1]], 1000 * 1080 / span, 540, 960);
  const mp = medicPose(t), op = obsPose(t);
  const c7 = s07Cam(Math.min(Math.max(t, 10.5), 12.39));
  const pc = povCam(t);
  const P = (p: V3) => proj(cam, p);
  const mark = (p: V3, col: string, dir?: V3) => {
    const a = P(p);
    const b = dir ? P([p[0] + dir[0] * 60, 0, p[2] + dir[2] * 60]) : a;
    return (
      <g>
        <circle cx={fmt(a[0])} cy={fmt(a[1])} r={10} fill={col} />
        {dir && <path d={`M${fmt(a[0])} ${fmt(a[1])} L${fmt(b[0])} ${fmt(b[1])}`} stroke={col} strokeWidth={5} />}
      </g>
    );
  };
  return (
    <AbsoluteFill style={{backgroundColor: '#fff'}}>
      <svg width={1080} height={1920}>
        <ArenaFloor id="tf" cam={cam} x0={-400} x1={500} z0={-400} z1={500} />
        <TargetFixture id="tt" cam={cam} />
        <Roach pose={mp} cam={cam} o={{id: 'tm', legsBehind: true, gear: <Gear id="tmg" cam={cam} f={mp.frame} g={{kind: 'injector', loaded: true, latched: true}} />}} />
        <Roach pose={op} cam={cam} o={{id: 'to', legsBehind: true, gear: <Gear id="tog" cam={cam} f={op.frame} g={{kind: 'camera', loaded: false}} />}} />
        {mark([c7.eye[0], 0, c7.eye[2]], '#E33', [c7.fwd[0], 0, c7.fwd[2]])}
        {mark([pc.eye[0], 0, pc.eye[2]], '#33E', [pc.fwd[0], 0, pc.fwd[2]])}
      </svg>
      <div style={{position: 'absolute', left: 20, top: 20, fontSize: 50, color: '#000', fontFamily: 'monospace'}}>{`${f} (${t.toFixed(2)})`}</div>
    </AbsoluteFill>
  );
};

export const CameraRoachRoot: React.FC = () => (
  <>
    <Still id="One" component={One} width={1080} height={1920} defaultProps={{f: 315, captions: false}} />
    <Still id="Sheet" component={Sheet} width={1080} height={1920} defaultProps={{fs: [315, 330, 345, 360], captions: false, n: 4}} />
    <Still id="CamTry" component={CamTry} width={1080} height={1920} defaultProps={{tries: [] as Try[], captions: false}} />
    <Still id="Top" component={Top} width={1080} height={1920} defaultProps={{f: 372, c: [150, 40] as [number, number], span: 520}} />
  </>
);
