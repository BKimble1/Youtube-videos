// One frame: the camera for time t, then depth layers from the far forest to the subject plane, each projected by
// a pinhole dolly camera (scale F/(d+Δ), so a push-in moves near things more than far ones) and softened by its
// distance from the focus plane; then the screen-space overlays (the bird's shadow, the dive, light, captions).
import React from 'react';
import {resetIds} from './core/ids';
import {pt} from './core/geo';
import {clamp, ss, DUR} from './lib';
import {Snail, snailTips} from './art/snail';
import {Bird, birdPoints} from './art/bird';
import {Caterpillar, Dropping, FarForest, Leaf, MidPlants, Twig} from './art/env';
import {birdInterior, Egg, SacInterior, snailInterior} from './art/micro';
import {dropA, DROP_K, bird, birdInside, birdOn, camAt, Cam, CAT_DELTA, catBase, DROP_B, dropAt, EGG_B, EV, LEAF_A, LEAF_B, lightAt, sacInBeak, snailA, snailB, snailBInside, STEM_A, STEM_B, T, TWIG_BIRD, TWIG_CAT} from './story';
import {Captions} from './Captions';

const F = 3600;
const layerScale = (c: Cam, delta: number) => {
  const s = 1080 / c.w;
  const d = F / s;
  return {s: F / (d + delta), d};
};
const blurPx = (c: Cam, delta: number, min = 0) => {
  const {d} = layerScale(c, delta);
  const coc = 0.34 * F * Math.abs(1 / (d + c.focus) - 1 / (d + delta));
  return Math.max(min, Math.min(60, coc));
};
const Layer: React.FC<{c: Cam; delta: number; min?: number; children: React.ReactNode; opacity?: number}> = ({c, delta, min = 0, children, opacity}) => {
  const {s} = layerScale(c, delta);
  const b = blurPx(c, delta, min);
  return (
    <div style={{position: 'absolute', inset: 0, filter: b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined, opacity}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(540 960) scale(${s}) translate(${-c.x} ${-c.y})`}>{children}</g>
      </svg>
    </div>
  );
};

/** a soft shadow of a bird flying over, sweeping across the frame (screen space) */
const BirdShadow: React.FC<{u: number}> = ({u}) => {
  if (u <= 0 || u >= 1) return null;
  const x = -900 + 2900 * u, y = 300 + 1300 * u;
  const flap = Math.sin(u * Math.PI * 5) * 0.35;
  const wing = (s: number) => `M0 0 C${s * 260} ${-160 - 200 * flap} ${s * 620} ${-120 - 260 * flap} ${s * 900} ${-40 - 300 * flap} C${s * 640} ${40} ${s * 300} ${80} 0 120 Z`;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'blur(26px)', mixBlendMode: 'multiply', opacity: 0.62 * Math.sin(Math.PI * u)}}>
      <svg width={1080} height={1920}>
        <g transform={`translate(${x} ${y}) rotate(28)`} fill="#0B140A">
          <path d={wing(1)} />
          <path d={wing(-1)} />
          <ellipse cx={0} cy={60} rx={110} ry={260} />
          <path d="M-70 280 L0 520 L70 280 Z" />
        </g>
      </svg>
    </div>
  );
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const c = camAt(t);
  const light = lightAt(t);
  const showA = t < EV.swap + 0.02 || t > EV.release - 0.3;
  const showB = t > EV.swap - 0.02 && t < 21.4;
  const sA = snailA(t);
  const sB = snailB(t);
  const inB = snailBInside(t);
  const b = bird(t);
  const bIn = birdInside(t);
  const sac = sacInBeak(t);
  const drop = dropA(t);
  // the dive: the sac's packed larvae fill the frame, then dissolve into the egg
  const diveZ = clamp((t - (EV.dive0 + 0.1)) / (EV.swap - EV.dive0 - 0.1));
  const diveA = ss(t, EV.dive0 + 0.12, EV.dive0 + 0.32) * (1 - ss(t, EV.swap - 0.04, EV.swap + 0.12));
  const shadowU = (t - EV.shadow0) / (EV.shadow1 - EV.shadow0);
  return (
    <>
      <Layer c={c} delta={1500} min={30}>
        <FarForest light={light} />
      </Layer>
      <Layer c={c} delta={130} min={12}>
        <MidPlants seed={3} n={46} spread={[-260, 360, -300, 260]} scale={26} dark={0.55} />
      </Layer>
      <Layer c={c} delta={38} min={5}>
        <MidPlants seed={17} n={26} spread={[-120, 200, -110, 130]} scale={11} dark={0.3} />
      </Layer>
      {t > 8.5 && t < 16 && (
        <Layer c={c} delta={CAT_DELTA}>
          <Twig pts={TWIG_CAT} r={0.95} />
          <Caterpillar base={catBase(t)} dirx={1} t={t} phase={1.55 * t + 0.2} />
        </Layer>
      )}
      <Layer c={c} delta={0}>
        {showB && (
          <g>
            <Twig pts={STEM_B} r={1.3} color="#3E6A28" />
            <Leaf L={LEAF_B} trail={{x0: -34, x1: -18, y: 0.4}} light={light} />
            <Dropping c={DROP_B} k={1} t={t} land={1} eggs={c.w < 14} micro={clamp((1.2 - c.w) / 0.8)} />
            <Snail st={{...sB, interior: snailInterior(inB)}} />
            {t < EV.swallowEgg + 0.04 && (() => {
              // the egg the snail eats: true size up close, drawn larger (with a glow) once the camera pulls back
              const m = clamp(c.w / 0.5, 1, 3.4);
              const mouth = snailTips(sB).mouth;
              const into = ss(t, EV.swallowEgg - 0.12, EV.swallowEgg);
              const p = {x: EGG_B.x + (mouth.x - EGG_B.x) * into, y: EGG_B.y + (mouth.y - EGG_B.y) * into};
              return (
                <g transform={`translate(${p.x} ${p.y}) scale(${m * (1 - 0.5 * into)}) translate(${-p.x} ${-p.y})`} opacity={1 - ss(t, EV.swallowEgg - 0.03, EV.swallowEgg + 0.03)}>
                  {c.w > 1.2 && <circle cx={p.x} cy={p.y} r={0.09} fill="#FFE39A" opacity={0.35} />}
                  <Egg c={p} t={t} detail={clamp((2.2 - c.w) / 1.5)} />
                </g>
              );
            })()}
          </g>
        )}
        {t > EV.land0 - 0.1 && t < 22.8 && <Twig pts={TWIG_BIRD} r={1.7} />}
        {birdOn(t) && t < 22.9 && (
          <Bird
            b={{
              ...b,
              interior: birdInterior(bIn),
              inBeak: sac > 0 ? (
                <g transform={`translate(-22.4 3.0) rotate(${96 - (b.headAng * 180) / Math.PI + 9 * Math.sin(t * 9.7)}) scale(${0.35 + 0.65 * sac})`}>
                  <ellipse cx={3.6} cy={0} rx={3.7} ry={1.25} fill="#9BC93E" />
                  {[-2, -1, 0, 1, 2].map((k) => <rect key={k} x={3.6 + k * 1.2 - 0.28} y={-1.15} width={0.56} height={2.3} fill={k % 2 ? '#F3EFCF' : '#1F431B'} opacity={0.85} />)}
                  <ellipse cx={2.2} cy={-0.5} rx={1.6} ry={0.3} fill="#FFFFFF" opacity={0.35} />
                </g>
              ) : undefined,
            }}
          />
        )}
        {showA && (
          <g>
            <Twig pts={STEM_A} r={1.4} color="#3E6A28" />
            <Leaf L={LEAF_A} trail={{x0: 8, x1: sA.o.x - 14, y: 40.4}} light={light} />
            {drop && drop.land > 0.5 && <Dropping c={drop.c} k={DROP_K} t={t} land={drop.land} />}
            <Snail st={sA} />
          </g>
        )}
        {drop && drop.land <= 0.5 && <Dropping c={drop.c} k={DROP_K} t={t} land={drop.land} eggs={false} />}
      </Layer>
      <BirdShadow u={shadowU} />
      <SacInterior z={diveZ} t={t} a={diveA} />
      {light > 1.01 && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 15%, rgba(255,240,190,0.55), rgba(255,240,190,0) 60%)', opacity: (light - 1) / 0.35, mixBlendMode: 'screen'}} />}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(4,12,6,0.4) 100%)'}} />
      {captions && <Captions t={t} />}
    </>
  );
};
void pt; void DUR; void T; void birdPoints;
