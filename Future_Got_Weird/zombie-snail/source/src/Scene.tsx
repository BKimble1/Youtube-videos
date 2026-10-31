// One frame: the camera for time t, then depth layers from the far forest to the subject plane, each projected by
// a pinhole dolly camera (scale F/(d+Δ), so a push-in moves near things more than far ones) and softened by its
// distance from the focus plane; then the screen-space finish (sun, grade, vignette) and captions.
import React from 'react';
import {resetIds} from './core/ids';
import {clamp} from './lib';
import {Snail} from './art/snail';
import {Bird} from './art/bird';
import {Caterpillar, Dropping, FarForest, Leaf, MidPlants, Twig} from './art/env';
import {birdInterior, snailInterior} from './art/micro';
import {bird, birdInside, birdOn, camAt, Cam, CAT_DELTA, catBase, DROP_K, DROP_LAND, dropAt, EV, LEAF, lightAt, sacInBeak, snail1, snail1Inside, snail2, STEM, TWIG_1, TWIG_2, TWIG_CAT} from './story';
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
const Layer: React.FC<{c: Cam; delta: number; min?: number; children: React.ReactNode}> = ({c, delta, min = 0, children}) => {
  const {s} = layerScale(c, delta);
  const b = blurPx(c, delta, min);
  return (
    <div style={{position: 'absolute', inset: 0, filter: b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(540 960) scale(${s}) translate(${-c.x} ${-c.y})`}>{children}</g>
      </svg>
    </div>
  );
};

/** the sac in the bird's beak: banded, still twitching, hanging from the tip */
const SacInBeak: React.FC<{t: number; a: number; headAng: number}> = ({t, a, headAng}) => (
  <g transform={`translate(-22.4 3.0) rotate(${96 - (headAng * 180) / Math.PI + 9 * Math.sin(t * 9.7)}) scale(${0.35 + 0.65 * a})`}>
    <ellipse cx={3.6} cy={0} rx={3.7} ry={1.25} fill="#8FCB34" stroke="#1F431B" strokeWidth={0.12} />
    {[-2, -1, 0, 1, 2].map((k) => <rect key={k} x={3.6 + k * 1.2 - 0.28} y={-1.12} width={0.56} height={2.24} fill={k % 2 ? '#F3EFCF' : '#1A3A14'} />)}
    <ellipse cx={2.2} cy={-0.5} rx={1.6} ry={0.3} fill="#FFFFFF" opacity={0.4} />
  </g>
);

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const c = camAt(t);
  const light = lightAt(t);
  const s1 = snail1(t);
  const b = bird(t);
  const sac = sacInBeak(t);
  const drop = dropAt(t);
  const showS2 = t > 21.2;
  const inside = b.inside ?? 0;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.12) saturate(1.12)'}}>
      <Layer c={c} delta={1500} min={26}>
        <FarForest light={light} />
      </Layer>
      <Layer c={c} delta={130} min={10}>
        <MidPlants seed={3} n={46} spread={[-260, 360, -300, 260]} scale={26} dark={0.75} />
      </Layer>
      <Layer c={c} delta={38} min={4}>
        <MidPlants seed={17} n={26} spread={[-120, 200, -110, 130]} scale={11} dark={0.55} />
      </Layer>
      {t > 8.8 && t < 17.5 && (
        <Layer c={c} delta={CAT_DELTA}>
          <Twig pts={TWIG_CAT} r={0.95} />
          <Caterpillar base={catBase(t)} dirx={1} t={t} phase={1.55 * t + 0.2} />
        </Layer>
      )}
      <Layer c={c} delta={0}>
        <Twig pts={STEM} r={1.4} color="#2E5A1E" />
        <Leaf L={LEAF} trail={{x0: -32, x1: s1.o.x - 14, y: 0.4}} light={light} />
        {drop && drop.land > 0.5 && <Dropping c={drop.c} k={DROP_K} t={t} land={drop.land} />}
        <Snail st={{...s1, interior: snailInterior(snail1Inside(t))}} />
        {showS2 && <Snail st={snail2(t)} />}
        {t > EV.land0 - 0.2 && <Twig pts={TWIG_1} r={1.7} />}
        <Twig pts={TWIG_2} r={2.0} />
        {birdOn(t) && (
          <Bird b={{...b, interior: birdInterior(birdInside(t)), inBeak: sac > 0 ? <SacInBeak t={t} a={sac} headAng={b.headAng} /> : undefined}} />
        )}
        {drop && drop.land <= 0.5 && <Dropping c={drop.c} k={DROP_K} t={t} land={drop.land} eggs={false} />}
      </Layer>
      {inside < 0.98 && light > 1.01 && (
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 12%, rgba(255,236,170,0.6), rgba(255,236,170,0) 62%)', opacity: (light - 1) / 0.4, mixBlendMode: 'screen'}} />
      )}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 50%, rgba(2,8,4,0.55) 100%)'}} />
      {captions && <Captions t={t} />}
    </div>
  );
};
void clamp; void DROP_LAND;
