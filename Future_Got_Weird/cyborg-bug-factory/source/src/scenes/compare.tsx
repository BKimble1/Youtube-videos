// D: "So now, instead of building tiny robots from scratch... scientists can use actual living insects."
// A split screen on one obstacle (a rough ledge about 10 mm high, rubble on top), drawn twice from the same camera:
// left, a tiny wheeled robot built from scratch drives up to it and its small wheels can't get over the edge; right,
// a cyborg cockroach walks up to it and climbs over on its own legs. It makes no claim about speed, strength, cost or
// endurance: it only shows what the researchers are after, the insect's own locomotion over rough ground.
import React from 'react';
import {add3, basis, Basis, P2, proj, projPoly, V3} from '../core/three';
import {cylinderItem, Item, resetIds} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame} from '../core/frame';
import {cam, at} from '../camera';
import {hash, ring, ss, clamp} from '../lib';
import {walkState, Path} from '../roach/gait';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {seatFrame} from '../kit/backpack';
import {PACK_SEAT} from '../roach/rig';

export const D0 = 14.89, D1 = 20.6;
const LEDGE_Y = 30; // the ledge's front edge
const LEDGE_H = 10;
/** terrain: floor at 0, a ledge rising (steep but rounded edge) at LEDGE_Y */
export const ground = (x: number, y: number) => LEDGE_H * clamp((y - LEDGE_Y) / 2.2) + 0.6 * Math.sin(x * 0.11) * Math.sin(y * 0.09);
const ROCKS: {p: V3; h: V3; yaw: number; c: string}[] = Array.from({length: 16}, (_, i) => {
  const x = -150 + hash(i * 3.1) * 300;
  const y = 60 + hash(i * 7.3) * 160;
  const sz = 4 + hash(i * 5.7) * 9;
  return {p: [x, y, LEDGE_H + sz * 0.4] as V3, h: [sz, sz * (0.6 + 0.5 * hash(i)), sz * 0.55] as V3, yaw: hash(i * 9.1) * 180, c: ['#A69C8E', '#8E857A', '#B9AE9E'][i % 3]};
}).filter((r) => Math.abs(r.p[0]) > 40 || r.p[1] > 190);

const terrainEls = (B: Basis): React.ReactNode[] => {
  const floor = projPoly(B, [[-600, -400, 0], [600, -400, 0], [600, LEDGE_Y, 0], [-600, LEDGE_Y, 0]], 4);
  const face = projPoly(B, [[-600, LEDGE_Y, 0], [600, LEDGE_Y, 0], [600, LEDGE_Y + 2.2, LEDGE_H], [-600, LEDGE_Y + 2.2, LEDGE_H]], 4);
  const top = projPoly(B, [[-600, LEDGE_Y + 2.2, LEDGE_H], [600, LEDGE_Y + 2.2, LEDGE_H], [600, 900, LEDGE_H], [-600, 900, LEDGE_H]], 4);
  const lip = [proj(B, [-600, LEDGE_Y + 2.2, LEDGE_H]), proj(B, [600, LEDGE_Y + 2.2, LEDGE_H])];
  const grit = Array.from({length: 60}, (_, i) => {
    const x = -200 + hash(i * 1.7) * 400, y = -160 + hash(i * 2.9) * 420;
    const p = proj(B, [x, y, ground(x, y) + 0.1]);
    return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={(0.6 + hash(i * 4.4) * 1.2) * p.s} fill={i % 2 ? '#8A8173' : '#C8BFB0'} opacity={0.7} />;
  });
  return [
    <path key="fl" d={floor} fill="#B7AFA2" />,
    <path key="tp" d={top} fill="#C4BBAD" />,
    <path key="fc" d={face} fill="#8F8677" />,
    <path key="lp" d={`M${P2(lip[0])} L${P2(lip[1])}`} stroke="#172B3A" strokeWidth={3} />,
    ...grit,
  ];
};

/** the tiny robot: a 40 mm chassis on four small wheels; drives to the ledge, bumps, rocks back, wheels spin */
const robotItems = (B: Basis, t: number): Item[] => {
  const u = t - D0;
  // drive forward, hit the edge at ~1.5 s, bump back, try again twice, then stall with the wheels spinning
  const hit = 1.45;
  let y: number;
  const front = 20; // chassis front from its centre
  const yHit = LEDGE_Y - front - 4.6;
  if (u < hit) y = -70 + (yHit + 70) * ss(u, 0, hit) ** 0.85;
  else y = yHit - 3.5 * Math.abs(Math.sin((u - hit) * 3.2)) * Math.exp(-(u - hit) * 0.35);
  const pitch = u > hit ? 7 * Math.abs(ring(u, hit, 1.6, 0.6)) + 3 * Math.abs(ring(u, hit + 1.9, 1.6, 0.6)) : 0;
  const pr = (pitch * Math.PI) / 180;
  const f: V3 = [0, Math.cos(pr), Math.sin(pr)];
  const c: V3 = [0, y, 9 + 18 * Math.sin(pr) * 0.5];
  const F = frame(c, f, [0, 0, 1]);
  const W = (p: V3): V3 => add3(F.o, add3([F.l[0] * -p[0], F.l[1] * -p[0], F.l[2] * -p[0]], add3([F.f[0] * p[1], F.f[1] * p[1], F.f[2] * p[1]], [F.u[0] * p[2], F.u[1] * p[2], F.u[2] * p[2]])));
  const it: Item[] = [];
  it.push(obbItem(B, {...F, o: W([0, 0, 1])}, [20, 15, 5.5], '#3E5C8A', {key: 'rb', top: '#5577AA'}));
  it.push(obbItem(B, {...F, o: W([0, 13, 7.5])}, [5, 6, 2.6], '#2A3440', {key: 'rs'}));
  const eye = proj(B, W([0, 19.2, 7.6]));
  it.push({z: eye.z - 2, el: <circle key="re" cx={eye.x.toFixed(1)} cy={eye.y.toFixed(1)} r={(1.8 * eye.s).toFixed(1)} fill="#5CF2FF" stroke="#172B3A" strokeWidth={2} />});
  it.push(cylinderItem(B, W([-8, -6, 6]), W([-8, -10, 20]), 0.6, '#2A3440', {key: 'ra'}));
  const spin = u * (u > hit ? 26 : 9);
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy], i) => {
    const wc = W([sx * 21.5, sy * 13, -4.6]);
    const a = add3(wc, [sx * -2.5, 0, 0]), b = add3(wc, [sx * 2.5, 0, 0]);
    it.push(cylinderItem(B, a, b, 4.6, '#1E2329', {key: `rw${i}`, cap: '#55606B'}));
    const P = proj(B, sx > 0 ? b : a);
    const r = 3.4 * P.s;
    const sp = [0, 1, 2].map((k) => {
      const an = spin + (k * 2 * Math.PI) / 3;
      return <line key={k} x1={P.x.toFixed(1)} y1={P.y.toFixed(1)} x2={(P.x + Math.cos(an) * r * 0.3).toFixed(1)} y2={(P.y + Math.sin(an) * r).toFixed(1)} stroke="#AAB4BE" strokeWidth={2} />;
    });
    it.push({z: P.z - 1, el: <g key={`rsp${i}`}>{sp}</g>});
  });
  return it;
};

const roachPath: Path = {p0: [0, -95, 0], yaw0: 90, segs: [{len: 1000}], ground};
const roachS = (t: number) => {
  const u = t - D0 - 0.6;
  return u <= 0 ? 0 : 33 * u;
};

const Panel: React.FC<{t: number; fkey: string; which: 'bot' | 'bug'}> = ({t, fkey, which}) => {
  resetIds(fkey + which);
  resetRoachIds(fkey + which + 'r');
  const u = t - D0;
  const tgtY = which === 'bot' ? -30 + 18 * ss(u, 0, 1.6) : -60 + 150 * ss(u, 0.6, 5.4);
  const B = basis(cam(at([0, tgtY, 8], -10, 36, 7.2, 1000, 0, 270)));
  const items: Item[] = [];
  ROCKS.forEach((r, i) => items.push(obbItem(B, frame(r.p, [Math.cos(r.yaw), Math.sin(r.yaw), 0], [0, 0, 1]), r.h, r.c, {key: `k${i}`})));
  if (which === 'bot') items.push(...robotItems(B, t));
  else {
    const st = walkState(roachPath, roachS(t), {antTw: [18, 18], antLift: [16, 14], headPitch: -6, breathe: 0.5});
    items.push(cyborgGroup(B, st, {F: seatFrame(st.body, PACK_SEAT), led: 0.85, hook: 1}, 'cr', {shadowZ: ground(st.body.o[0], st.body.o[1])}).item);
  }
  return (
    <svg width={540} height={1920} viewBox="0 0 540 1920" style={{position: 'absolute', left: which === 'bot' ? 0 : 540, top: 0}}>
      <defs>
        <linearGradient id={`${fkey}${which}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B5B66" />
          <stop offset="1" stopColor="#8E8A82" />
        </linearGradient>
      </defs>
      <rect width={540} height={1920} fill={`url(#${fkey}${which}sky)`} />
      {terrainEls(B)}
      {items.filter((i) => i.z > 2).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
    </svg>
  );
};

export const Compare: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const u = t - D0;
  const stuck = ss(u, 2.2, 2.45);
  const over = ss(t, 19.35, 19.6);
  const dimL = 0.32 * ss(t, 17.9, 18.4);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E1E2B'}}>
      <Panel t={t} fkey={fkey} which="bot" />
      <Panel t={t} fkey={fkey} which="bug" />
      <div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920, background: '#0E1E2B', opacity: dimL}} />
      <div style={{position: 'absolute', left: 534, top: 0, width: 12, height: 1920, background: '#0E1E2B'}} />
      <div style={{position: 'absolute', left: 0, top: 230, width: 540, textAlign: 'center'}}><PanelTitle text="TINY ROBOT" sub="built from scratch" color="#8FB3E8" /></div>
      <div style={{position: 'absolute', left: 540, top: 230, width: 540, textAlign: 'center'}}><PanelTitle text="LIVING INSECT" sub="+ electronic backpack" color="#FFD84A" /></div>
      <div style={{position: 'absolute', left: 0, top: 1150, width: 540, textAlign: 'center', opacity: stuck, transform: `scale(${(0.85 + 0.15 * stuck).toFixed(3)})`}}>
        <Badge text="STUCK AT THE EDGE" color="#FF6B5A" />
      </div>
      <div style={{position: 'absolute', left: 540, top: 1150, width: 540, textAlign: 'center', opacity: over, transform: `scale(${(0.85 + 0.15 * over).toFixed(3)})`}}>
        <Badge text="WALKS RIGHT OVER" color="#59E39A" />
      </div>
    </div>
  );
};
const PanelTitle: React.FC<{text: string; sub: string; color: string}> = ({text, sub, color}) => (
  <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '14px 26px', borderRadius: 22, background: 'rgba(14,30,43,0.88)', borderBottom: `8px solid ${color}`}}>
    <span style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 46, color: '#FFFFFF', letterSpacing: '0.03em'}}>{text}</span>
    <span style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 800, fontSize: 30, color}}>{sub}</span>
  </div>
);
const Badge: React.FC<{text: string; color: string}> = ({text, color}) => (
  <span style={{display: 'inline-block', padding: '10px 22px', borderRadius: 18, background: 'rgba(14,30,43,0.9)', border: `5px solid ${color}`, fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 32, color}}>{text}</span>
);
