// Inserts: the throat cutaway, the glottis -> implant match cut, the neural environments, the red disturbance, the swarm.
import React from 'react';
import {Shot, ShotId, W} from '../plan5';
import {Cam, Layer} from '../../lib/camera';
import {clamp, easeInOut, easeOut, lerp} from '../../lib/math';
import {GlottisView, ThroatScene} from '../ins/Throat';
import {NeuralCapture} from '../ins/Neural';
import {CortexView, DecoderView, SwarmView, XrayImplant} from '../ins/Neural2';
import {MechanismView} from '../ins/Mechanism';
import {WarnTag, popScale} from '../ui5';

const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const insertShot = (id: ShotId, t: number, f: number, lt: number, shot: Shot): React.ReactNode => {
  const dur = shot.b - shot.a;
  const k = easeInOut(clamp(lt / dur));
  switch (id) {
    case 'neck': {
      const idle = ss(W.vocal, W.cordsEnd, t) * 0.95;
      const scan = ss(4.5, 4.7, t);
      // the folds buzz and sound rises while the line is still about speaking, and stop at "vocal" (never used again)
      const vib = 1 - ss(W.vocal - 0.12, W.vocal + 0.1, t);
      const cam: Cam = {x: 540, y: lerp(800, 770, k), z: lerp(1.75, 2.15, k)};
      return (
        <Layer cam={cam} depth={1}>
          <ThroatScene t={t} f={f} idle={idle} scan={scan} vib={vib} />
        </Layer>
      );
    }
    case 'matchImplant': {
      if (lt < 0.27) return <GlottisView idle={0.9} f={f} />;
      const l2 = lt - 0.27;
      return <XrayImplant lt={l2} f={f} pulses={[W.the - 4.97, W.chip - 4.97 + 0.0 + 0.1]} dive={ss(0.38, 0.63, lt)} />;
    }
    case 'capture': {
      const cam: Cam = {x: lerp(560, 640, k), y: lerp(1040, 960, k), z: lerp(1.0, 1.32, k)};
      return <NeuralCapture lt={lt} f={f} cam={cam} />;
    }
    case 'cortex': {
      const cam: Cam = {x: lerp(540, 500, k), y: lerp(930, 820, k), z: lerp(0.98, 1.22, k)};
      return <CortexView lt={lt} f={f} cam={cam} />;
    }
    case 'decoder': {
      const cam: Cam = {x: 540, y: lerp(1060, 1000, k), z: lerp(1.0, 1.1, k)};
      return <DecoderView lt={lt} f={f} cam={cam} />;
    }
    case 'redNeural': {
      const cam: Cam = {x: lerp(600, 640, k), y: lerp(1010, 940, k), z: lerp(1.25, 1.5, k), roll: lerp(-3, -5, k)};
      const flick = 0.7 + 0.3 * Math.sin(f * 1.7);
      return (
        <g>
          <NeuralCapture lt={0.12 + lt * 1.45} f={f} red={1} cam={cam} id="nr" />
          <rect x={0} y={0} width={1080} height={1920} fill="#EF3340" opacity={0.1 * flick} />
          <WarnTag x={540} y={330} k={popScale(lt, 0.28, 0.16)} />
        </g>
      );
    }
    case 'mechanism': {
      const cam: Cam = {x: 540, y: lerp(1050, 1000, k), z: lerp(1.18, 1.3, k)};
      return <MechanismView lt={lt} f={f} cam={cam} />;
    }
    case 'swarm': {
      const cam: Cam = {x: lerp(500, 600, k), y: lerp(1000, 920, k), z: lerp(1.0, 1.18, k)};
      return <SwarmView lt={lt} f={f} cam={cam} />;
    }
    default:
      return null;
  }
};
void easeOut;
