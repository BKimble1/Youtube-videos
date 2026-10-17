// R2 machine lab (not part of the film): turnarounds, action cycles, damage, heavy topple, formation re-form and the
// army at scale. Composition R2MechLab, prop page 0..5.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, orbit, prep, terrain, LightRig, Material, Cam3, View} from '../engine';
import {V3, seg, smooth, lerp} from '../../kit/math';
import {MECH_MATS, combatUnit, drone, heavy, straightPath, polyPathFn, armyItems, reformSlots, lineSlots, arcSlots, column, standing, combine, Formation} from '../mech';

const MATS: Record<string, Material> = {
  ...MECH_MATS,
  g_ground: {base: '#6B625C'}, g_asphalt: {base: '#46413F'}, g_line: {base: '#B9AE8E'},
};
const LIGHT: LightRig = {
  sun: {x: -0.84, y: 0.32, z: 0.2}, sunColor: '#FFC08A', ambient: '#4A5878',
  lights: [], fogColor: '#9C7E73', fogStart: 40, fogEnd: 700, skyTop: '#3B3446', skyHorizon: '#C88466', ink: '#162A32',
};
const GROUND = prep(terrain(-80, 420, -90, 90, 10, () => 0, (x, z) => (Math.abs(z) < 14 ? 'g_asphalt' : 'g_ground')));
const label = (s: string) => <text x={30} y={60} fill="#fff" fontSize={34} fontFamily="sans-serif" stroke="#000" strokeWidth={4} paintOrder="stroke">{s}</text>;

const scene = (v: View, items: Item[], t: number, title: string, extra?: React.ReactNode) => (
  <Scene view={v} light={LIGHT} mats={MATS} items={[{kind: 'mesh', mesh: GROUND, key: 'g', sortKey: 'max'}, ...items]} t={t} over={<g>{label(title)}{extra}</g>} />
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
    // action cycles up close: march (planted feet), strike → block exchange, raise
    const cam: Cam3 = {pos: {x: 1.8, y: 1.6, z: 4.2}, target: {x: 1.8, y: 1.15, z: -2}, fov: 42};
    const cyc = Math.floor(t / 3) * 3;
    const items: Item[] = [
      ...combatUnit({id: 11, t, pos: {x: 0, y: 0, z: 0}, heading: 90, gait: {path: straightPath({x: -4.5, y: 0, z: -4.5}, 90), dist: t * 1.25, start: 0}}),
      ...combatUnit({id: 12, t, pos: {x: 1.0, y: 0, z: -2}, heading: 90, strike: {t0: cyc + 1.2, side: 'R', target: {x: 2.15, y: 1.75, z: -2.05}}}),
      ...combatUnit({id: 13, t, pos: {x: 2.6, y: 0, z: -2}, heading: 270, block: {t0: cyc + 0.75, t1: cyc + 1.6, side: 'L'}, hits: [{t0: cyc + 1.2, dir: {x: 1, y: 0, z: 0}, strength: 0.6}]}),
    ];
    return scene(makeView(cam), items, t, 'actions · march (planted feet) · strike → block');
  }
  if (page === 7) {
    // heavy: ram strike and launcher fire; drone dive / mark / cutter
    const cam: Cam3 = {pos: {x: 6, y: 4.2, z: 17}, target: {x: 4, y: 2.2, z: 0}, fov: 42};
    const cyc = Math.floor(t / 3) * 3;
    const ph = t % 3;
    const items: Item[] = [
      ...heavy({id: 14, t, pos: {x: 9, y: 0, z: -6}, heading: 250, ram: {t0: cyc + 1.6, target: {x: 4.6, y: 0.5, z: -4.2}}, fire: {t0: cyc + 2.6, target: {x: -10, y: 0, z: 4}}}),
      ...drone({id: 15, t, pos: {x: lerp(-2, 6, smooth(ph / 2.2)), y: lerp(5, 1.2, smooth(ph / 2.2)), z: 2}, heading: 100, vel: {x: 4, y: -2, z: 0}, eye: 'amber'}),
      ...drone({id: 16, t, pos: {x: 0, y: 3.5, z: 3}, heading: 120, look: {x: 4.6, y: 0.5, z: -4.2}, mark: {target: {x: 4.6, y: 0.5, z: -4.2}}, eye: 'amber', cutter: (Math.sin(t * 2) + 1) / 2}),
    ];
    return scene(makeView(cam), items, t, 'heavy ram + launcher · drone dive · drone mark + cutter');
  }
  if (page === 2) {
    // damage sequence: plate torn, arm detached, fall, wreck
    const cam: Cam3 = {pos: {x: 1.5, y: 2.2, z: 8.0}, target: {x: 0.2, y: 0.9, z: -1}, fov: 42};
    const items: Item[] = [
      ...combatUnit({
        id: 21, t, pos: {x: 0, y: 0, z: 0}, heading: 120,
        hits: [{t0: 0.8, dir: {x: 1, y: 0, z: -0.3}, strength: 1}, {t0: 1.9, dir: {x: 0.6, y: 0, z: 0.8}, strength: 1.3}],
        damage: {chest: {t0: 0.8, dir: {x: 1, y: 0.3, z: -0.4}, speed: 4.5}, armOff: {side: 'R', t0: 1.9, dir: {x: 0.5, y: 0.5, z: 1}, speed: 4}, leak: {t0: 1.95}},
        fall: {t0: 2.6, dir: {x: -0.6, y: 0, z: -0.8}},
      }),
      ...combatUnit({id: 22, t, pos: {x: 2.6, y: 0, z: -1.5}, heading: 250, damage: {back: {t0: 1.2, dir: {x: 0.4, y: 0.5, z: -1}}, pauldronL: {t0: 2.0, dir: {x: -1, y: 0.4, z: 0}}}}),
      ...combatUnit({id: 23, t, pos: {x: -2.2, y: 0, z: -2.5}, heading: 160, hits: [{t0: 1.0, dir: {x: 0, y: 0, z: -1}, strength: 1.2}], fall: {t0: 1.05, dir: {x: 0.2, y: 0, z: -1}, getUp: 3.2}, lockAt: 4.2}),
    ];
    return scene(makeView(cam), items, t, 'damage · chest plate · arm torn off · fall · wreck persists · knocked down and gets up');
  }
  if (page === 3) {
    // heavy topple after a knee break (front-left leg pinned)
    const cam: Cam3 = {pos: {x: 16, y: 5, z: 12}, target: {x: -1, y: 2.0, z: -2}, fov: 44};
    const items: Item[] = [
      ...heavy({id: 31, t, pos: {x: 0, y: 0, z: 0}, heading: 200, gait: {path: straightPath({x: 1, y: 0, z: -3}, 200), dist: Math.min(t, 1.2) * 1.2}, kneeBreak: {t0: 1.4, leg: 0, dir: {x: -1, y: 0, z: 0.4}}}),
    ];
    return scene(makeView(cam), items, t, 'heavy · knee broken · topple · wreck');
  }
  if (page === 4) {
    // formation re-form: a 3-rank line advancing west halts as one, then re-forms into an arc around the survivors'
    // position (ripple delay, paths sorted so they don't cross); LOD by distance (full near, mid, far sprites)
    const center: V3 = {x: 20, y: 0, z: 0};
    const advance = column(straightPath({x: 37, y: 0, z: 0}, 270), 42, 14, 1.9, 2.4, 1.3, 0, 41, 1.0);
    const B = arcSlots(center, 8.5, 28, 152, 42, 42, 3, 2.2);
    const A = advance.slots(1.0 + 0.8).map((s) => ({...s, path: undefined, dist: undefined, ctl: undefined}));
    const re = reformSlots(A, B, 1.5, 0.03, 2.6, center, 2.4);
    const form: Formation = {slots: (tt) => (tt < 1.5 ? advance.slots(tt) : re.slots(tt))};
    const cam: Cam3 = {pos: {x: 25, y: 30, z: 17}, target: {x: 27, y: 0, z: 0}, fov: 50};
    const v = makeView(cam);
    const crewMark: Item = {kind: 'sprite', pos: center, key: 'crew', draw: (c) => <circle cx={c.x} cy={c.y} r={10} fill="#FFC744" stroke="#162A32" strokeWidth={3} />};
    return scene(v, [crewMark, ...armyItems(v, t, form, {})], t, 'formation · advance → halt as one → re-form into an arc (ripple) · LOD');
  }
  // page 5: the army filling the avenue from a high wide — a front block holding, columns streaming west along the
  // avenue and south out of two cross streets, heavies among them, drones above
  const cam: Cam3 = {pos: {x: 78, y: 30, z: 40}, target: {x: 175, y: 0, z: -8}, fov: 42};
  const v = makeView(cam);
  const front = standing(lineSlots({x: 112, y: 0, z: 0}, 270, 12, 2.0, 3, 2.4, 61));
  const avenue = column(straightPath({x: 150, y: 0, z: 0}, 90 + 180), 6 * 34, 6, 3.6, 2.7, 1.3, -6, 62);
  const cross1 = column(polyPathFn([{x: 124, y: 0, z: -110}, {x: 124, y: 0, z: -14}, {x: 100, y: 0, z: -7}]), 3 * 26, 3, 2.6, 2.6, 1.3, -40, 63);
  const cross2 = column(straightPath({x: 262, y: 0, z: -40}, 180), 3 * 30, 3, 2.6, 2.6, 1.3, -6, 64);
  const army = combine(front, avenue, cross1, cross2);
  const drones: Item[] = Array.from({length: 18}, (_, i) => drone({id: 900 + i, t, pos: {x: 120 + (i % 9) * 22 + Math.sin(t * 0.7 + i) * 2, y: 12 + (i % 3) * 6, z: -24 + Math.floor(i / 9) * 30}, heading: 270, eye: 'cyan', lod: 'far', scale: 1.6})).flat();
  const heavies: Item[] = [0, 1, 2].map((k) => heavy({id: 950 + k, t, pos: {x: 0, y: 0, z: 0}, heading: 270, gait: {path: straightPath({x: 210 + k * 46, y: 0, z: k % 2 ? 8 : -8}, 270), dist: t * 0.9}, lod: k === 0 ? 'mid' : 'far'})).flat();
  return scene(v, [...armyItems(v, t, army, {maxFull: 6, maxMid: 30, farFrom: 90}), ...drones, ...heavies], t, 'army · avenue from a high wide (front block, columns, heavies, drones)');
};
void seg;
