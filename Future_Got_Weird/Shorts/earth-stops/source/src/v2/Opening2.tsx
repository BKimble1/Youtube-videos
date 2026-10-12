import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Hed} from '../opening/type';
import {CharacterSide} from './side';
import {MugSide} from './props';
import {Street2} from './Street2';
import {BikeWorld} from './Bike2';
import {CoffeeFx, GroundFx, HeroShadow} from './Fx2';
import {GSY, GYW, SC, camSpeed, camX, heroFK, heroPose, mugTilt, toScreen, zoomAt} from './choreo2';
import {heroStateEC} from './choreoEC';

export type Opening2Props = {marker?: boolean};

const panBlur = (f: number) => Math.min(9, Math.max(0, camSpeed(f) * zoomAt(f) * 0.32));

/** scarf tail: follow-the-leader ribbon from the neck (screen space); full-width striped end with fringe so it reads as a scarf */
const ScarfTail: React.FC<{f: number; neckAt: (t: number) => {x: number; y: number}}> = ({f, neckAt}) => {
  const K = 9;
  const pts = Array.from({length: K}).map((_, k) => {
    const t = f - 1.2 * k;
    const n = neckAt(t);
    const s = toScreen(n.x, n.y, f);
    const z = zoomAt(f);
    return {x: s.x, y: s.y + (2.4 * k + (4 + 2.4 * k) * Math.sin(0.62 * t + 0.9 * k)) * z, w: Math.max(26, 46 - 1.8 * k) * z};
  });
  const lines = [...pts].reverse();
  const e = pts[K - 1], q = pts[K - 2];
  const L = Math.hypot(e.x - q.x, e.y - q.y) || 1, ux = (e.x - q.x) / L, uy = (e.y - q.y) / L, nx = -uy, ny = ux;
  const z = zoomAt(f);
  return (
    <g>
      {lines.map((p, ri) => { const k = K - 1 - ri, a = k === 0 ? pts[0] : pts[k - 1]; return <line key={`o${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={p.w + 8 * z} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />; })}
      {lines.map((p, ri) => { const k = K - 1 - ri, a = k === 0 ? pts[0] : pts[k - 1]; return <line key={`i${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={k % 3 === 1 ? C.cream : C.coral} strokeWidth={p.w} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />; })}
      {[-1, 0, 1].map((i) => <line key={`fr${i}`} x1={e.x + nx * i * 10 * z} y1={e.y + ny * i * 10 * z} x2={e.x + ux * 18 * z + nx * i * 14 * z} y2={e.y + uy * 18 * z + ny * i * 14 * z} stroke={C.ink} strokeWidth={5 * z} strokeLinecap="round" />)}
    </g>
  );
};

export type Scene2Props = {f: number; marker?: boolean; ec?: boolean; pad?: number};

/** One picture of the street scene at (scene) frame f. E-A calls it with f = the composition frame. E-C calls it with f = frame - T0 (negative = calm, before the stop) inside a scaled panel. */
export const Scene2: React.FC<Scene2Props> = ({f, marker = true, ec = false, pad = 80}) => {
  const z = zoomAt(f), cx = camX(f);
  const T = `translate(540 ${GSY}) scale(${z}) translate(${-cx} ${-GYW})`;
  const st = ec ? heroStateEC(f) : {pose: heroPose(f), fk: heroFK(f), mug: mugTilt(f)};
  const fk = st.fk;
  const hip = toScreen(fk.P.x, fk.P.y, f);
  const lift = Math.max(0, GYW - fk.lowest);
  const b0 = ec ? 0 : undefined, t0 = ec ? 0 : undefined;
  const neckAt = (t: number) => (ec ? heroStateEC(t).fk.N : heroFK(t).N);
  const svgStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible'};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={panBlur(f)} pad={pad}>
        <GroundFx f={f} t0={t0} b0={b0} />
      </Street2>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={svgStyle}>
        {!ec && <g transform={T}><BikeWorld f={f} /></g>}
        <g transform={T}><HeroShadow x={fk.P.x} lift={lift} /></g>
      </svg>
      <CharacterSide pose={st.pose} hip={hip} sc={SC * z} scarfWrap scarf={<ScarfTail f={f} neckAt={neckAt} />} holdN={<MugSide tilt={st.mug} sc={SC * z} />} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={svgStyle}>
        <g transform={T}><CoffeeFx f={f} b0={b0} /></g>
        {marker && (
          <g>
            <rect x={(W - 318) / 2 + 7} y={222} width={318} height={96} rx={22} fill={C.ink} />
            <rect x={(W - 318) / 2} y={215} width={318} height={96} rx={22} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
            <Hed x={W / 2} y={263} text="WHAT IF" size={68} color={C.ink} shadow={null} ls={3} />
          </g>
        )}
      </svg>
    </div>
  );
};

export const Opening2: React.FC<Opening2Props> = ({marker = true}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Scene2 f={f} marker={marker} />
    </AbsoluteFill>
  );
};
