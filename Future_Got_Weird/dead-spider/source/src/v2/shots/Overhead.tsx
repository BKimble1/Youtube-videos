// BEAT A (4.52 - 7.80): "Because when a spider dies, all its legs curl inward."
// A match on the open spider: the same camera and the same open pose as the hook's last frame, but the needle, syringe
// and pad are gone and the spider stands on open ground (a neutral explanation space, not the experiment). The camera
// rises to straight overhead. On "dies" the colour drains from it; on "curl inward" all eight legs fold in under the
// body (a slow, heavy spring, a few frames apart) while a faint trace of where they were stays on the ground, so
// extended and curled read side by side. Nothing walks: the body never moves.
import React from 'react';
import {mix} from '../../dc/color';
import {INK} from '../../dc/ink';
import {Item} from '../../draw3';
import {ss, ss5} from '../../lib';
import {LOOK_A, SpiderLook, spiderItems} from '../../SpiderDraw';
import {legsWorld, SpiderPose} from '../../spider';
import {Basis, lerpOrbit, Orbit, orbitCam, P2, proj, projPoly, toOrbit, V3} from '../../three';
import {Scene} from '../../shots/common';
import {A_LIFE, A_YAW2, A_Z, CUT, overheadPose, TM} from '../world2';
import {camHook} from './Hook';

/** the ground the spider stands on: its open feet just reach it */
const GZ = A_Z - 3.45;
const OV: Orbit = {target: [-2.2, 0, A_Z], az: -8, el: 89, d: 130, f: 5300, cy: 900};
const OVb: Orbit = {...OV, d: 108};
export const camA = (t: number) => {
  const o0 = toOrbit(camHook(CUT.overhead));
  const o = lerpOrbit(o0, OV, ss5(t, CUT.overhead + 0.08, TM.dies + 0.25));
  return orbitCam(lerpOrbit(o, OVb, ss5(t, TM.dies + 0.25, CUT.leg + 0.3)));
};

const DEAD_LOOK: SpiderLook = {leg: '#7E6E5E', legBand: '#4C4036', cara: '#4A3E35', caraBand: '#9C8C78', abd: '#655648', heart: '#3C3129', spot: '#B0A08A', eye: '#1A1F24'};
const lookAt = (life: number): SpiderLook => {
  const o = {} as SpiderLook;
  (Object.keys(LOOK_A) as (keyof SpiderLook)[]).forEach((k) => (o[k] = mix(DEAD_LOOK[k], LOOK_A[k], life)));
  return o;
};

/** open ground: warm soil with scattered grit and a few pale pebbles, anchored in the world so the camera move reads */
const Ground: React.FC<{B: Basis; z: number}> = ({B, z}) => {
  const rnd = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const grit: React.ReactNode[] = [];
  for (let i = 0; i < 260; i++) {
    const x = (rnd(i) - 0.5) * 150, y = (rnd(i + 999) - 0.5) * 150;
    if (Math.hypot(x + 2, y) < 7) continue;
    const r = 0.25 + rnd(i + 77) * (i % 9 === 0 ? 1.6 : 0.45);
    const c: V3 = [x, y, z];
    const q = proj(B, c);
    if (q.z < 5) continue;
    const pts: V3[] = Array.from({length: 10}, (_, k) => {
      const a = (k / 10) * Math.PI * 2;
      return [x + Math.cos(a) * r * (1 + 0.25 * rnd(i + k)), y + Math.sin(a) * r * 0.8, z];
    });
    const pebble = i % 9 === 0;
    grit.push(<path key={i} d={projPoly(B, pts)} fill={pebble ? '#E6D9C2' : rnd(i + 5) > 0.5 ? '#B89E7E' : '#D8C6A8'} stroke={pebble ? INK : 'none'} strokeWidth={pebble ? Math.max(1, 0.05 * q.s) : 0} opacity={pebble ? 0.9 : 0.55} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="aground" cx="540" cy="900" r="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E9DCC6" />
          <stop offset="1" stopColor="#C9B394" />
        </radialGradient>
        <filter id="ablur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill="url(#aground)" />
      {grit}
    </g>
  );
};

/** where the legs were: a faint trace of the open legs left on the ground while they curl */
const Trace: React.FC<{B: Basis; P: SpiderPose; op: number}> = ({B, P, op}) => {
  if (op < 0.01) return null;
  const legs = legsWorld({...P, e: Array(8).fill(1)});
  return (
    <g opacity={op}>
      {legs.map((L, i) => (
        <path key={i} d={`M${L.slice(1).map((p) => P2(proj(B, [p[0], p[1], GZ + 0.05]))).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={(0.42 * proj(B, L[1]).s).toFixed(1)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${(0.9 * proj(B, L[1]).s).toFixed(1)} ${(0.7 * proj(B, L[1]).s).toFixed(1)}`} />
      ))}
    </g>
  );
};

export const Overhead: React.FC<{t: number}> = ({t}) => {
  const cam = camA(t);
  const P = overheadPose(t);
  const life = A_LIFE(t);
  const trace = 0.55 * ss(t, TM.curl - 0.3, TM.curl + 0.2);
  return (
    <Scene
      id={`O${Math.round(t * 30)}`}
      cam={cam}
      bg="#D9C8AC"
      back={(B) => <Ground B={B} z={GZ} />}
      floor={(B) => (
        <>
          <Trace B={B} P={P} op={trace} />
          <ShadowBlob B={B} P={P} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, lookAt(life), {id: 'so'}));
        return it;
      }}
    />
  );
};
const ShadowBlob: React.FC<{B: Basis; P: SpiderPose}> = ({B, P}) => {
  const c = proj(B, [P.pos[0] - 1.8, P.pos[1] + 0.9, GZ]);
  const k = Math.min(1, Math.max(0, P.e[0]));
  return <ellipse cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} rx={((5.2 + 3.5 * k) * c.s).toFixed(1)} ry={((3.8 + 2.6 * k) * c.s).toFixed(1)} transform={`rotate(${(-A_YAW2 + 180).toFixed(0)} ${c.x.toFixed(1)} ${c.y.toFixed(1)})`} fill="#5A4630" opacity={0.22} filter="url(#ablur)" />;
};
