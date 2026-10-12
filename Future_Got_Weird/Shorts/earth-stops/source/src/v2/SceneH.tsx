import React from 'react';
import {C, H, W} from '../theme';
import {CharacterSide} from './side';
import {MugSide} from './props';
import {Street2} from './Street2';
import {BikeWorld} from './Bike2';
import {CoffeeFx, GroundFx, HeroShadow} from './Fx2';
import {GSY, GYW, SC} from './choreo2';
import {BIKE_X0, LAND, SceneState, bikeSpinH, bikeTiltH, bikeXH, camFor, heroFor, rateAt, sceneFor, shoeXH, toScreenFor, zoomFor} from './choreoH';

/** One picture of the H1 street scene (the E-A v2 scene driven by the H1 choreography: walk before the stop, friction-stopped hero, loose bicycle, slow-down after the brake). */
const ScarfTailH: React.FC<{st: SceneState}> = ({st}) => {
  const K = 9, s = st.s, z = zoomFor(st);
  const pts = Array.from({length: K}).map((_, k) => {
    const t = s - 1.2 * k;
    const n = heroFor({s: t, mode: st.mode}).fk.N;
    const p = toScreenFor(n.x, n.y, st);
    return {x: p.x, y: p.y + (2.4 * k + (4 + 2.4 * k) * Math.sin(0.62 * t + 0.9 * k)) * z, w: Math.max(26, 46 - 1.8 * k) * z};
  });
  const lines = [...pts].reverse();
  const e = pts[K - 1], q = pts[K - 2];
  const L = Math.hypot(e.x - q.x, e.y - q.y) || 1, ux = (e.x - q.x) / L, uy = (e.y - q.y) / L, nx = -uy, ny = ux;
  return (
    <g>
      {lines.map((p, ri) => { const k = K - 1 - ri, a = k === 0 ? pts[0] : pts[k - 1]; return <line key={`o${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={p.w + 8 * z} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />; })}
      {lines.map((p, ri) => { const k = K - 1 - ri, a = k === 0 ? pts[0] : pts[k - 1]; return <line key={`i${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={k % 3 === 1 ? C.cream : C.coral} strokeWidth={p.w} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />; })}
      {[-1, 0, 1].map((i) => <line key={`fr${i}`} x1={e.x + nx * i * 10 * z} y1={e.y + ny * i * 10 * z} x2={e.x + ux * 18 * z + nx * i * 14 * z} y2={e.y + uy * 18 * z + ny * i * 14 * z} stroke={C.ink} strokeWidth={5 * z} strokeLinecap="round" />)}
    </g>
  );
};

export const SceneH: React.FC<{f: number; pad?: number; st?: SceneState}> = ({f, pad = 420, st: stIn}) => {
  const st = stIn ?? sceneFor(f), s = st.s, stop = st.mode === 'stop';
  const z = zoomFor(st), cx = camFor(st);
  const T = `translate(540 ${GSY}) scale(${z}) translate(${-cx} ${-GYW})`;
  const hero = heroFor(st);
  const fk = hero.fk;
  const p = toScreenFor(fk.P.x, fk.P.y, st);
  const lift = Math.max(0, GYW - fk.lowest);
  const camSpeed = stop ? (camFor({s, mode: 'stop'}) - camFor({s: s - 1, mode: 'stop'})) * (f < 66 ? rateAt(f) : 1) : 0;
  const blur = !stop || s < 0.5 ? 0 : Math.min(9, Math.max(0, Math.abs(camSpeed) * z * 0.32));
  const fx = stop ? s : -100; // no skid marks, stains or coffee in the "no stop" timeline
  const bike = stop ? {x: bikeXH(s), ang: bikeSpinH(s), tilt: bikeTiltH(s)} : {x: BIKE_X0, ang: 0, tilt: 0};
  const svgStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible'};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={blur} pad={pad}>
        <GroundFx f={fx} t0={0} b0={0} shoeX={shoeXH} slideUntil={LAND + 36} />
      </Street2>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={svgStyle}>
        <g transform={T}><BikeWorld f={s} at={bike} /></g>
        <g transform={T}><HeroShadow x={fk.P.x} lift={lift} /></g>
      </svg>
      <CharacterSide pose={hero.pose} hip={p} sc={SC * z} scarfWrap scarf={<ScarfTailH st={st} />} holdN={<MugSide tilt={hero.mug} sc={SC * z} />} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={svgStyle}>
        <g transform={T}><CoffeeFx f={fx} b0={0} /></g>
      </svg>
    </div>
  );
};
