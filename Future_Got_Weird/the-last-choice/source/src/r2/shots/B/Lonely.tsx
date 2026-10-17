// B5 (27.00–30.26): from the avenue east-south-east of him, low, the camera pushes in and up past the van (the radio on
// its floor) to a medium close: the western sun rims him; he breathes, looks down at his left arm and pulls the
// plate's strap tight with his teeth and his right hand. B6 (30.26–35.80, H4/H5): the lonely silhouette — the reverse,
// from a crane over the machines' ranks east of the crater looking west: the sea of heads and shoulders below goes still
// wave by wave (the vanguard two beats after H4, the main body on H5a, the rear on H5b), drones hold over the crater,
// and far off on the crest, small, a silhouette against the sunlit smoke, him. Hold.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3, rnd, smoothPath} from '../../../kit/math';
import type {Item, View, SpriteCtx} from '../../engine';
import {mix, toView} from '../../engine';
import {figureSprite} from '../../rig';
import type {FigProps} from '../../rig';
import {drone} from '../../mech';
import {groundH} from '../../world/ground';
import {M} from '../../timing';
import {STAND} from './director';
import {ARMY_B} from './army';
import {dirSprite, dirSpec, armyB, B_COLUMNS, strapItems} from './kit';
import type {ColumnOpts} from '../../world/atmos';
import {slabItem, chunkItems, supportItems} from './rubble';
import {CAM_B5, CAM_B6, B5_ANCHOR} from './cams';

// ------------------------------------------------------------------ B5
export const B5_START = 27.0, B5_END = M.H4;
export const ShotB5: React.FC = () => {
  const {t, T} = useShotTime(B5_START);
  const cam = camPath(CAM_B5, t, 0.75);
  const items = (v: View): Item[] => [dirSprite(T, {anchor: B5_ANCHOR, bias: 0.4}), ...strapItems(v, T, {anchor: B5_ANCHOR, bias: 0.4}), slabItem(T), ...supportItems(), ...chunkItems(T)];
  return <Stage T={T} cam={cam} items={items} drift={0.015} atmos={{columns: B_COLUMNS, smoke: 0.8}} vignette={0.55} />;
};

// ------------------------------------------------------------------ B6
/** He is ~105 m off and the low sun is behind him: drawn as a dark silhouette with a thin warm rim (the same figure in a
 * warm flat colour, nudged left, right and up, under the dark one). */
const SIL = '#1C1517', RIM = '#FFC788';
const dirSilhouette = (T: number): Item => {
  const base = dirSpec(T, {anchor: {x: STAND.x, y: STAND.y + 0.9, z: STAND.z}});
  const pose = base.pose as Partial<FigProps>;
  // (no blood or dust marks: they keep their own colours and would show as specks on the silhouette)
  const dark = figureSprite({...base, key: 'dirB6', pose: {...pose, dmg: {}, silhouette: SIL}});
  const rim = figureSprite({...base, key: 'dirB6r', pose: {...pose, dmg: {}, silhouette: RIM}});
  return {
    ...dark, noCull: true,
    draw: (c) => (
      <g>
        <g transform="translate(-1.5 -0.8)" opacity={0.9}>{rim.draw(c)}</g>
        <g transform="translate(1.5 -0.8)" opacity={0.9}>{rim.draw(c)}</g>
        <g transform="translate(0 -1.8)">{rim.draw(c)}</g>
        {dark.draw(c)}
      </g>
    ),
  };
};

/** A blob of backlit smoke: warm, bright (the low sun shines through it from behind), a lighter core. */
const glowBlob = (key: string, pos: V3, r: number, seed: number, T: number, k: number, a = 1, tone: [string, string, string, number] = ['#E59E6C', '#F6CB98', '#FFE4BE', 0.42]): Item => ({
  kind: 'sprite', key, pos,
  draw: (c) => {
    const R = r * c.k;
    if (R < 1.5) return null;
    const pts = Array.from({length: 9}, (_, i) => {
      const ang = (i / 9) * Math.PI * 2 + seed;
      const rr = R * (1 + 0.14 * Math.sin(ang * 2 + seed * 3 + T * 0.2) + 0.08 * Math.sin(ang * 3 + seed));
      return {x: c.x + Math.cos(ang) * rr, y: c.y + Math.sin(ang) * rr * 0.82};
    });
    const inner = pts.map((q) => ({x: c.x - R * 0.12 + (q.x - c.x) * 0.62, y: c.y - R * 0.16 + (q.y - c.y) * 0.62}));
    return (
      <g opacity={a}>
        <path d={smoothPath(pts, true, 1)} fill={mix(tone[0], tone[1], k)} opacity={0.5 + 0.22 * k} />
        <path d={smoothPath(inner, true, 1)} fill={tone[2]} opacity={tone[3]} />
      </g>
    );
  },
});
/** the wall of sunlit smoke over the west ruin, behind the ridge (his backdrop), drifting slowly north-east */
const GLOW = Array.from({length: 34}, (_, i) => ({
  x: -6 - rnd(i * 3 + 1) * 10, y: 2.5 + rnd(i * 5 + 2) * 13, z: -26 + (i / 33) * 52 + (rnd(i * 7 + 3) - 0.5) * 5,
  r: 3.6 + rnd(i * 11 + 4) * 4.6, seed: rnd(i * 13 + 5) * 6.28, k: rnd(i * 17 + 6),
}));
/** sunlit dust off the crest right behind him (between the slab's east edge and him), from his knees up: his body has
 * light behind it, and the rubble round his feet stays dark so he stands on the crest */
const CREST = Array.from({length: 9}, (_, i) => ({
  x: 1.0 + rnd(i * 19 + 1) * 0.35, y: 3.75 + rnd(i * 23 + 2) * 1.0, z: 0.2 + (i / 8) * 2.4 + (rnd(i * 29 + 3) - 0.5) * 0.4,
  r: 0.45 + rnd(i * 31 + 4) * 0.55, seed: rnd(i * 37 + 5) * 6.28, k: 0.5 + rnd(i * 41 + 6) * 0.5,
}));
/** a low bank of dust drifting across the ridge's east foot (the van's zone, x 5.5–13), warm and fairly opaque: it veils
 * the van, whose roof would otherwise line up with his feet from this lens. Its top stays under the line from the lens
 * to his feet (≈3.0 m by the van, 3.3 m at x 13), so his feet keep the crest. */
const BANK = Array.from({length: 26}, (_, i) => {
  const hi = i < 15; // upper row (reaching the van roof) / lower row (down to the ground)
  const x = 5.6 + rnd(i * 43 + 1) * 7.2, r = hi ? 1.05 + rnd(i * 47 + 2) * 0.6 : 1.2 + rnd(i * 47 + 2) * 0.7;
  const top = x < 7 ? 2.98 : x < 10 ? 3.12 : 3.28;
  return {x, y: hi ? top - 0.82 * r : 0.6 + rnd(i * 53 + 3) * 0.7, z: -7.5 + ((hi ? i : i - 15) / (hi ? 14 : 10)) * 17 + (rnd(i * 59 + 4) - 0.5) * 1.6, r, seed: rnd(i * 61 + 5) * 6.28, k: rnd(i * 67 + 6)};
});
const BANK_TONE: [string, string, string, number] = ['#9C6E55', '#C4906B', '#E2B48C', 0.3];
const glowItems = (T: number): Item[] => [
  ...BANK.map((g, i) => glowBlob(`b6b${i}`, {x: g.x + Math.sin(T * 0.11 + g.seed) * 0.25, y: g.y, z: g.z - (T - M.H4) * 0.22}, g.r, g.seed, T, g.k, 1, BANK_TONE)),
  ...GLOW.map((g, i) => glowBlob(`b6g${i}`, {x: g.x + Math.sin(T * 0.07 + g.seed) * 0.6, y: g.y + (T - M.H4) * 0.1, z: g.z - (T - M.H4) * 0.16}, g.r, g.seed, T, g.k)),
  ...CREST.map((g, i) => glowBlob(`b6c${i}`, {x: g.x, y: g.y + (T - M.H4) * 0.05 + Math.sin(T * 0.5 + g.seed) * 0.05, z: g.z - (T - M.H4) * 0.06}, g.r, g.seed, T, g.k, 0.85)),
];

/** three drones holding low over the crater, gimbals on him (B6 only) */
const B6_DRONES: {id: number; at: V3; ph: number}[] = [
  {id: 3391, at: {x: 74, y: 3.2, z: 0.5}, ph: 0.3}, {id: 3392, at: {x: 70, y: 4.2, z: 9}, ph: 2.1}, {id: 3393, at: {x: 64, y: 1.5, z: 3}, ph: 4.0},
];
const droneItems = (T: number): Item[] => B6_DRONES.flatMap((d) => drone({
  id: d.id, t: T, heading: 270, pos: {x: d.at.x + Math.sin(T * 0.3 + d.ph) * 0.3, y: d.at.y + Math.sin(T * 0.9 + d.ph) * 0.18, z: d.at.z + Math.sin(T * 0.23 + d.ph) * 0.4},
  look: {x: STAND.x, y: STAND.y + 1.2, z: STAND.z}, eye: 'cyan', lod: 'full', ground: groundH,
}));

/** The eyes of a share of the machines in front light the air around their heads: seen from behind, a cyan halo just in
 * front of the face, drawn before the head so it shows round its edges. */
const eyeSpill = (v: View, T: number): Item[] => ARMY_B.slots(T).filter((s) => rnd(s.id * 53 + 7) < 0.2 && s.pos.x < 96).map((s) => {
  const pos = {x: s.pos.x - 0.2, y: groundH(s.pos.x, s.pos.z) + 2.0, z: s.pos.z};
  return {
    kind: 'sprite' as const, key: `b6es${s.id}`, pos,
    draw: (c: SpriteCtx) => {
      const R = 0.3 * c.k;
      if (R < 2) return null;
      const id = `b6es${s.id}`;
      return (
        <g opacity={0.6}>
          <defs><radialGradient id={id}><stop offset="0" stopColor="#E9FBFF" stopOpacity={0.9} /><stop offset="0.35" stopColor="#62D6EA" stopOpacity={0.55} /><stop offset="1" stopColor="#62D6EA" stopOpacity={0} /></radialGradient></defs>
          <circle cx={c.x} cy={c.y} r={R} fill={`url(#${id})`} />
        </g>
      );
    },
  };
});
void toView;

/** the crater's smoke for this lens: the same pits, but lying low in the bowl (the tall columns would veil him) */
const B6_CRATER: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'b6k1', base: {x: 64, y: -3.4, z: -5}, o: {n: 7, life: 11, rise: 0.17, r0: 2.2, r1: 5, drift: 0.7, dark: 0.25, alpha: 0.32, warm: 0.2, seed: 81}},
  {key: 'b6k2', base: {x: 58, y: -2.8, z: 5}, o: {n: 6, life: 10, rise: 0.15, r0: 2, r1: 4.5, drift: 0.7, dark: 0.3, alpha: 0.3, warm: 0.25, seed: 82}},
  {key: 'b6k3', base: {x: 69, y: -2.6, z: 8}, o: {n: 6, life: 10, rise: 0.16, r0: 2, r1: 4.5, drift: 0.6, dark: 0.3, alpha: 0.28, warm: 0.2, seed: 83}},
];
export const B6_START = M.H4, B6_END = M.BASS_OUT;
export const ShotB6: React.FC = () => {
  const {t, T} = useShotTime(B6_START);
  const cam = camPath(CAM_B6, t, 0.3);
  // looking into the low sun: exposed for the bright smoke, the sides of things facing the lens (away from the sun)
  // sink (light shadowK); the army's own drones are elsewhere (B6 has its three over the crater)
  const items = (v: View): Item[] => [
    dirSilhouette(T), slabItem(T), ...supportItems(), ...chunkItems(T),
    ...glowItems(T), ...droneItems(T), ...eyeSpill(v, T),
    ...armyB(v, T, {maxFull: 30, maxMid: 60, farFrom: 120, drones: false}),
  ];
  return <Stage T={T} cam={cam} items={items} drift={0.006} atmos={{columns: B6_CRATER, smoke: 0.05, haze: 0.04}} light={{shadowK: 0.6}} vignette={0.6} />;
};
