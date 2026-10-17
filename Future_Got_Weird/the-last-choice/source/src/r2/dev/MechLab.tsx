// R2 machine lab (not part of the film): turnarounds, action cycles, damage, heavy topple, formation re-form and the
// army at scale. Composition R2MechLab, prop page 0..5.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, orbit, prep, terrain, LightRig, Material, Cam3, View} from '../engine';
import {V3, seg, smooth, lerp} from '../../kit/math';
import {MECH_MATS, combatUnit, drone, heavy, straightPath, armyItems, reformSlots, lineSlots, arcSlots, Formation} from '../mech';

const MATS: Record<string, Material> = {
  ...MECH_MATS,
  g_ground: {base: '#6B625C'}, g_asphalt: {base: '#46413F'}, g_line: {base: '#B9AE8E'},
};
const LIGHT: LightRig = {
  sun: {x: -0.84, y: 0.32, z: 0.2}, sunColor: '#FFC08A', ambient: '#4A5878',
  lights: [], fogColor: '#9C7E73', fogStart: 40, fogEnd: 700, skyTop: '#3B3446', skyHorizon: '#C88466', ink: '#162A32',
};
const GROUND = prep(terrain(-60, 320, -60, 60, 6, () => 0, (x, z) => (Math.abs(z) < 14 ? 'g_asphalt' : 'g_ground')));
const label = (s: string) => <text x={30} y={60} fill="#fff" fontSize={34} fontFamily="sans-serif" stroke="#000" strokeWidth={4} paintOrder="stroke">{s}</text>;

const scene = (v: View, items: Item[], t: number, title: string, extra?: React.ReactNode) => (
  <Scene view={v} light={LIGHT} mats={MATS} items={[{kind: 'mesh', mesh: GROUND, key: 'g'}, ...items]} t={t} over={<g>{label(title)}{extra}</g>} />
);

export const MechLab: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (page === 0 || page === 6) {
    // turnarounds (page 0: combat units + drone up close; page 6: the heavy). One view per 20 frames.
    const views: [number, number, string][] = [[0, 6, 'front'], [40, 6, 'three-quarter'], [90, 6, 'side'], [140, 6, 'rear three-quarter'], [180, 6, 'back'], [30, -10, 'low angle'], [30, 40, 'high angle']];
    const vi = Math.min(views.length - 1, Math.floor(f / 20));
    const [az, el, name] = views[vi];
    const heavyPage = page === 6;
    const target: V3 = heavyPage ? {x: 0, y: 3.0, z: 0} : {x: 0, y: 1.25, z: 0};
    const cam: Cam3 = orbit(target, heavyPage ? 17 : 6.2, 180 + az, el, 40);
    const items: Item[] = heavyPage
      ? heavy({id: 4, t, pos: {x: 0, y: 0, z: 0}, heading: 180})
      : [
          ...combatUnit({id: 1, t, pos: {x: -0.75, y: 0, z: 0}, heading: 180, eye: 'cyan', idle: 0.3}),
          ...combatUnit({id: 2, t, pos: {x: 0.85, y: 0, z: 0.3}, heading: 180, eye: 'amber', idle: 0.3, raise: {t0: -1, t1: 99, side: 'R'}}),
          ...drone({id: 3, t, pos: {x: 0.1, y: 2.55, z: -0.6}, heading: 180, eye: 'cyan'}),
        ];
    return scene(makeView(cam), items, t, `${heavyPage ? 'heavy' : 'combat units + drone'} · ${name}`);
  }
  if (page === 1) {
    // action cycles: march, strike, ram, drone dive
    const cam: Cam3 = {pos: {x: 6, y: 3.2, z: 15}, target: {x: 4, y: 1.6, z: 0}, fov: 42};
    const ph = t % 3;
    const items: Item[] = [
      ...combatUnit({id: 11, t, pos: {x: 0, y: 0, z: 0}, heading: 90, gait: {path: straightPath({x: -4, y: 0, z: 1}, 90), dist: t * 1.25}}),
      ...combatUnit({id: 12, t, pos: {x: 3, y: 0, z: -2}, heading: 90, strike: {t0: Math.floor(t / 3) * 3 + 1.2, side: 'R', target: {x: 4.1, y: 1.5, z: -2}}}),
      ...combatUnit({id: 13, t, pos: {x: 4.6, y: 0, z: -2}, heading: 270, block: {t0: Math.floor(t / 3) * 3 + 0.7, t1: Math.floor(t / 3) * 3 + 1.6, side: 'L'}}),
      ...heavy({id: 14, t, pos: {x: 9, y: 0, z: -6}, heading: 250, ram: {t0: Math.floor(t / 3) * 3 + 1.6, target: {x: 6.2, y: 0.6, z: -4.5}}}),
      ...drone({id: 15, t, pos: {x: lerp(-2, 6, smooth(ph / 2.2)), y: lerp(5, 1.2, smooth(ph / 2.2)), z: 2}, heading: 100, vel: {x: 4, y: -2, z: 0}, eye: 'amber'}),
    ];
    return scene(makeView(cam), items, t, 'actions · march · strike/block · ram · drone dive');
  }
  if (page === 2) {
    // damage sequence: plate torn, arm detached, fall, wreck
    const cam: Cam3 = {pos: {x: 2.5, y: 2.0, z: 6.5}, target: {x: 0.3, y: 1.0, z: 0}, fov: 40};
    const items: Item[] = [
      ...combatUnit({
        id: 21, t, pos: {x: 0, y: 0, z: 0}, heading: 120,
        hits: [{t0: 0.8, dir: {x: 1, y: 0, z: -0.3}, strength: 1}, {t0: 1.9, dir: {x: 0.6, y: 0, z: 0.8}, strength: 1.3}],
        damage: {chest: {t0: 0.8, dir: {x: 1, y: 0.3, z: -0.4}, speed: 4.5}, armOff: {side: 'R', t0: 1.9, dir: {x: 0.5, y: 0.5, z: 1}, speed: 4}, leak: {t0: 1.95}},
        fall: {t0: 2.6, dir: {x: -0.6, y: 0, z: -0.8}},
      }),
      ...combatUnit({id: 22, t, pos: {x: 2.6, y: 0, z: -1.5}, heading: 250, damage: {back: {t0: 1.2, dir: {x: 0.4, y: 0.5, z: -1}}, pauldronL: {t0: 2.0, dir: {x: -1, y: 0.4, z: 0}}}}),
    ];
    return scene(makeView(cam), items, t, 'damage · chest plate · arm torn off · fall · wreck persists');
  }
  if (page === 3) {
    // heavy topple after a knee break (front-left leg pinned)
    const cam: Cam3 = {pos: {x: 14, y: 4, z: 14}, target: {x: 0, y: 2.5, z: 0}, fov: 42};
    const items: Item[] = [
      ...heavy({id: 31, t, pos: {x: 0, y: 0, z: 0}, heading: 200, gait: {path: straightPath({x: 1, y: 0, z: -3}, 200), dist: Math.min(t, 1.2) * 1.2}, kneeBreak: {t0: 1.4, leg: 0, dir: {x: -1, y: 0, z: 0.4}}}),
    ];
    return scene(makeView(cam), items, t, 'heavy · knee broken · topple · wreck');
  }
  if (page === 4) {
    // formation re-form: line → arc with ripple; LOD by distance
    const center: V3 = {x: 20, y: 0, z: 0};
    const A = lineSlots({x: 60, y: 0, z: 0}, 270, 24, 1.9, 3, 2.4, 41);
    const B = arcSlots(center, 14, 200, 340, 72, 42);
    const form: Formation = reformSlots(A, B, 1.0, 0.035, 2.6, center);
    const cam: Cam3 = {pos: {x: -6, y: 9 + t * 0.4, z: 22}, target: {x: 30, y: 0, z: -2}, fov: 45};
    const v = makeView(cam);
    return scene(v, armyItems(v, t, form, {}), t, 'formation · line → arc (ripple) · LOD by distance');
  }
  // page 5: the army filling the avenue from a high wide
  const cam: Cam3 = {pos: {x: 40, y: 70, z: 90}, target: {x: 160, y: 0, z: -10}, fov: 44};
  const v = makeView(cam);
  const cols: Formation = {slots: (tt) => {
    const out: {pos: V3; heading: number; dist: number; id: number}[] = [];
    let id = 500;
    for (let c = 0; c < 6; c++) for (let r = 0; r < 26; r++) {
      const d = tt * 1.3 + r * 2.6;
      out.push({pos: {x: 300 - d + ((c * 7) % 3) * 0.3, y: 0, z: -11 + c * 4.4}, heading: 270, dist: d, id: id++});
    }
    for (let r = 0; r < 30; r++) {
      const d = tt * 1.3 + r * 2.4;
      out.push({pos: {x: 124 + (r % 2) * 2.2, y: 0, z: -60 + d}, heading: 180, dist: d, id: id++});
    }
    return out;
  }};
  const drones: Item[] = Array.from({length: 14}, (_, i) => drone({id: 900 + i, t, pos: {x: 140 + (i % 7) * 18, y: 14 + (i % 3) * 5 + Math.sin(t + i) * 0.6, z: -20 + Math.floor(i / 7) * 30}, heading: 270, eye: 'cyan', lod: 'far'})).flat();
  const heavies: Item[] = [heavy({id: 950, t, pos: {x: 220 - t * 0.9, y: 0, z: 2}, heading: 270, gait: {path: straightPath({x: 220, y: 0, z: 2}, 270), dist: t * 0.9}, lod: 'mid'}), heavy({id: 951, t, pos: {x: 260, y: 0, z: -6}, heading: 270, gait: {path: straightPath({x: 262, y: 0, z: -6}, 270), dist: t * 0.9}, lod: 'mid'})].flat();
  return scene(v, [...armyItems(v, t, cols, {}), ...drones, ...heavies], t, 'army · avenue from a high wide');
};
void seg;
