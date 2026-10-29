// The film: environment → shadows → trail → rig pieces (far to near) → props → labels → captions.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {CAPTIONS, FPS, H, W, clamp} from './lib';
import {projector} from './geo';
import {AlgaeEnv, Brush, Label, LabEnv, MicroLayer, SeaHaze, TealEnv} from './sets/Envs';
import {BlurDefs, SlugPiece, SlugShadow, Trail, piecePoint} from './slug/Slug';
import {State, stateAt} from './shots';
import {capPlace} from './captions';

export const Picture: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const st: State = stateAt(f);
  const pr = projector(st.cam);
  const t = f / FPS;
  const env = st.env;
  const sorted = [...st.pieces].sort((a, b) => pr.scaleAt(piecePoint(a, (a.a0 + a.a1) / 2)) - pr.scaleAt(piecePoint(b, (b.a0 + b.a1) / 2)));
  const focus = st.pieces.length ? piecePoint(st.pieces[0], 50) : [0, 0, 0];
  return (
    <AbsoluteFill style={{backgroundColor: '#0B2A31', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <BlurDefs />
        {(env.lab ?? 0) > 0 && <g opacity={env.lab}><LabEnv pr={pr} t={t} /></g>}
        {(env.teal ?? 0) > 0 && <g opacity={env.teal}><TealEnv pr={pr} t={t} focus={[focus[0], focus[1]]} /></g>}
        {(env.algae ?? 0) > 0 && <g opacity={env.algae}><AlgaeEnv pr={pr} t={t} eaten={st.eaten ?? (() => 0)} /></g>}
        {st.trail && <Trail path={st.trail.path} from={st.trail.from} to={st.trail.to} pr={pr} op={st.trail.op * (env.lab ?? 0)} />}
        {sorted.map((p) => <SlugShadow key={p.id + 's'} p={p} pr={pr} op={0.2 * (1 - 0.5 * (env.teal ?? 0))} />)}
        {sorted.map((p) => (
          <g key={p.id} filter={st.blurHead && p.id === 'head' ? `url(#blur${st.blurHead})` : undefined}>
            <SlugPiece p={p} pr={pr} />
          </g>
        ))}
        {st.ring && <NeckRing st={st} />}
        {st.micro && <MicroLayer pr={pr} c={st.micro.c} op={st.micro.op} t={t} para={st.micro.para} />}
        {(env.algae ?? 0) > 0 && <SeaHaze op={env.algae ?? 0} />}
        {st.night ? <rect width={W} height={H} fill="#06141F" opacity={st.night} /> : null}
        {st.brush && <Brush tip={pr(st.brush.tip)} press={st.brush.press} op={st.brush.op} scale={pr.scaleAt(st.brush.tip) / 9} />}
        {st.labels.map((l, i) => <Label key={i} text={l.text} op={l.op} icon={l.icon} y={l.y} />)}
      </svg>
      {captions && <Captions t={t} f={f} />}
    </AbsoluteFill>
  );
};

/** the weak spot: a fine pale line around the neck groove */
const NeckRing: React.FC<{st: State}> = ({st}) => {
  const r = st.ring!;
  const pr = projector(st.cam);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const th = Math.PI * (i / 16);
    const p = piecePoint(r.piece, 25, Math.cos(th) * 4.1, 1.8 + Math.sin(th) * 2.2);
    pts.push(pr(p));
  }
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L');
  return (
    <g opacity={r.op}>
      <path d={d} fill="none" stroke="#E9FFF6" strokeWidth={26} opacity={0.45} filter="url(#blur7)" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
    </g>
  );
};

export const Captions: React.FC<{t: number; f: number}> = ({t, f}) => {
  const fr = (s: number) => Math.round(s * FPS);
  const i = CAPTIONS.findIndex((c, k) => f >= (k === 0 ? 0 : fr(c.show)) && f < fr(c.hide));
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const y = capPlace(i, f);
  const words = c.text.split(' ');
  void t;
  return (
    <div style={{position: 'absolute', left: 80, width: 920, top: y, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 68, lineHeight: 1.15, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.55)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <>
      <Picture f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

/** contact sheet: up to 12 frames, 4 across at quarter size */
export const Sheet: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.slice(0, 16).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Picture f={f} captions={captions} />
        <div style={{position: 'absolute', right: 24, bottom: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f} · {(f / FPS).toFixed(2)}s</div>
      </div>
    ))}
  </AbsoluteFill>
);
void clamp;
