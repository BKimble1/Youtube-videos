// R2 FX lab: each Crew tool and the impact kit, working and failing, on a plain lot with stand-ins (a pale box for a
// machine, a dot for a hand). Low three-quarter cameras. Not part of the film.
//   page 0 tether · 1 decoy (+ tablet inset) · 2 decoy edge-on · 3 allied drone · 4 flare + smoke canister
//   page 5 impacts + barrier plate states · 6 blast + muzzle flash
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, orbit, prep, terrain, cbox, cylinder, LightRig, Material, Cam3, shake3} from '../engine';
import {V3, add3, lerp3, clamp, easeOut, lerp} from '../../kit/math';
import {
  FX_MATS, FxOut, combine, fx, tetherItems, TetherOpts, decoyItems, DecoyScreen, decoyFinger, smokeCanister, canisterSource,
  smokeDensity, allyDrone, droneKeys, flare, optikFlash, blindAmount, impact, breakerHit, plateHit, plateState, BarrierPlate,
  blast, muzzle, CanisterOpts,
} from '../fx';

const MATS: Record<string, Material> = {
  ...FX_MATS,
  asphalt: {base: '#4A4542'}, curb: {base: '#8C857E'}, panel: {base: '#DDE4E7'}, slate: {base: '#4E5B63'}, post: {base: '#6A5A3A'},
};
const BASE_LIGHT: LightRig = {
  sun: {x: -0.86, y: 0.25, z: 0.14}, sunColor: '#FFC08A', ambient: '#4A5878',
  lights: [], fogColor: '#9C7E73', fogStart: 30, fogEnd: 400, skyTop: '#3B3446', skyHorizon: '#C88466', ink: '#162A32',
};
const GROUND = prep({...terrain(-20, 30, -20, 20, 2, () => 0, (x, z) => (Math.abs(z) > 8 ? 'curb' : 'asphalt')), sortKey: 'max'});
const BOX = prep(cbox(0.8, 2.2, 0.6, ['panel', 'slate', 'panel', 'panel', 'panel', 'panel']));
const POST = prep(cylinder(0.22, 3.2, 8, 'post', 'post'));

const boxItem = (p: V3, key = 'box', roll = 0): Item => ({kind: 'mesh', mesh: BOX, xf: {pos: p, roll}, key, asObject: true});
const eyeItem = (p: V3, t: number, blind = 0): Item => ({kind: 'sprite', pos: p, key: 'eye', bias: 0.1, draw: (c) => <circle cx={c.x} cy={c.y} r={Math.max(2, 0.07 * c.k)} fill={blind > 0.05 ? '#FFFFFF' : '#62D6EA'} stroke="#162A32" strokeWidth={1} />});
const dotItem = (p: V3, key: string, col = '#F0C8A0'): Item => ({kind: 'sprite', pos: p, key, draw: (c) => <circle cx={c.x} cy={c.y} r={Math.max(2.5, 0.06 * c.k)} fill={col} stroke="#162A32" strokeWidth={1.2} />});

const PAGES = ['tether: fire, bite, slack, wrap, taut, cut, reel', 'decoy: smoke + projected walkers, then smashed', 'decoy edge-on: a flat sheet of light', 'allied drone: take off, scout, dive, shield 2 hits, destroyed', 'flare: thrown, burning, blinds an eye · smoke canister', 'impacts: metal · concrete · person · breaker · plate dent/crack/shatter', 'blast + muzzle flash'];

export const FxLab: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  let cam: Cam3 = orbit({x: 3.6, y: 1.3, z: -0.4}, 8.2, 202, 11, 46);
  const items: Item[] = [{kind: 'mesh', mesh: GROUND, key: 'ground'}];
  let out: FxOut = fx();
  let overlay: React.ReactNode = null;
  const hand: V3 = {x: 0, y: 1.25, z: 0.3};

  if (page === 0) {
    const anchor = {x: 3.2, y: 1.0, z: -2.6};
    items.push({kind: 'mesh', mesh: POST, xf: {pos: {x: 3.2, y: 0, z: -2.6}}, key: 'post'});
    const start = {x: 7, y: 0, z: 0.5};
    const pull = easeOut(clamp((t - 2.15) / 0.7));
    const bp = lerp3(start, {x: 5.6, y: 0, z: -0.6}, pull);
    items.push(boxItem(bp, 'box', 18 * pull), dotItem(hand, 'hand'));
    const o: TetherOpts = {key: 'teth', t, muzzle: () => hand, target: (tt) => add3(lerp3(start, {x: 5.6, y: 0, z: -0.6}, easeOut(clamp((tt - 2.15) / 0.7))), {x: -0.42, y: 1.45, z: 0}), fireAt: 0.4, anchor, wrapAt: 1.6, tautAt: 2.1, snapAt: 3.7, snapU: 0.62, reelAt: 4.2, seed: 3};
    out = tetherItems(o);
    // an enemy drone stand-in cuts the cable
    const dp = lerp3({x: 1, y: 3.5, z: -4}, {x: 4.2, y: 0.6, z: 1.5}, clamp((t - 3.4) / 0.6));
    if (t > 3.3 && t < 4.2) items.push({kind: 'sprite', pos: dp, key: 'cutter', draw: (c) => <rect x={c.x - 0.25 * c.k} y={c.y - 0.06 * c.k} width={0.5 * c.k} height={0.12 * c.k} fill="#DDE4E7" stroke="#162A32" strokeWidth={1.2} />});
  }
  if (page === 1 || page === 2) {
    const cans: CanisterOpts[] = [
      {key: 'canA', from: {x: 0, y: 1.2, z: 0.3}, to: {x: 9, y: 0, z: -1.2}, t0: -7, seed: 2, grow: 1.35, size: 0.5, rate: 9},
      {key: 'canB', from: {x: 0, y: 1.2, z: 0.3}, to: {x: 10.5, y: 0, z: 1.4}, t0: -6.2, seed: 5, grow: 1.35, size: 0.5, rate: 9},
      {key: 'canC', from: {x: 0, y: 1.2, z: 0.3}, to: {x: 12, y: 0, z: -0.2}, t0: -5.4, seed: 8, grow: 1.35, size: 0.5, rate: 9},
    ];
    const srcs = cans.map(canisterSource);
    cans.forEach((c) => (out = combine(out, smokeCanister(c, t))));
    out = combine(out, decoyItems({key: 'dec', t, projector: () => ({x: 0.25, y: 1.3, z: 0.5}), center: {x: 11.6, y: 2.8, z: 0.2}, walkHeading: 270, height: 5.2, on: 1.25, off: 4.0, density: (p, tt) => smokeDensity(p, tt, srcs), seed: 4}));
    items.push(dotItem({x: 0.25, y: 1.3, z: 0.5}, 'proj', '#3B4A55'), boxItem({x: 7.5, y: 0, z: 3.5}));
    cam = page === 1 ? orbit({x: 6.5, y: 2.6, z: 0}, 15, 168, 7, 46) : {pos: {x: 22, y: 8, z: 0.8}, target: {x: 11.6, y: 2.8, z: 0.2}, fov: 46};
    if (page === 1) {
      const fg = decoyFinger({w: 360, h: 240, t, t0: -1.6});
      overlay = (
        <g transform="translate(40 790)">
          <rect x={-14} y={-14} width={388} height={268} rx={18} fill="#2A2D31" stroke="#162A32" strokeWidth={3} />
          <DecoyScreen w={360} h={240} t={t} t0={-1.6} deadAt={4.0} />
          <circle cx={fg.u * 360} cy={fg.v * 240} r={fg.down ? 9 : 7} fill="#8D5A3C" stroke="#162A32" strokeWidth={2} opacity={t < 1.6 ? 1 : 0} />
        </g>
      );
    }
  }
  if (page === 3) {
    const pose = (tt: number) => droneKeys(tt, [[0, 1, 0.12, 1], [0.3, 1, 0.12, 1], [1.0, 1, 1.8, 1], [2.0, 5, 2.6, -1], [2.6, 6.4, 1.5, 0.4], [3.0, 4.6, 1.25, 1.6], [4.6, 4.6, 1.25, 1.6]], tt > 2.8 ? {x: 7, y: 1.4, z: 0.5} : undefined, 2);
    out = allyDrone({key: 'ally', t, pose, spinUp: 0.2, hits: [{at: 3.15, dir: {x: -1, y: 0, z: 0.3}}, {at: 3.55, dir: {x: -1, y: 0.2, z: 0.4}, strength: 1.3}], destroyAt: 4.1, destroyDir: {x: -0.5, y: 0, z: 1}, ground: 0, seed: 6});
    items.push(boxItem({x: 7, y: 0, z: 0.5}), dotItem({x: 3, y: 0.4, z: 2.2}, 'wounded'));
    cam = t > 2.7 && t < 4.0 ? orbit({x: 4.6, y: 1.2, z: 1.6}, 3.2, 215, 12, 44) : orbit({x: 4, y: 1.3, z: 0.8}, 10, 200, 10, 44);
  }
  if (page === 4) {
    const eye = {x: 6.6, y: 2.0, z: 0.5};
    out = combine(
      flare({key: 'fl', from: hand, to: {x: 5, y: 0, z: -0.4}, t0: 0.25, flight: 0.8, apex: 1.6, ignite: 0.0, seed: 3}, t),
      optikFlash({key: 'of', eye, t, at: 1.3}),
      smokeCanister({key: 'cn', from: hand, to: {x: 6.2, y: 0, z: 1.6}, t0: 2.0, flight: 0.85, seed: 9}, t),
    );
    items.push(boxItem({x: 7, y: 0, z: 0.5}), eyeItem(eye, t, blindAmount(t, 1.3)), dotItem(hand, 'hand'));
  }
  if (page === 5) {
    const plateP = {x: 1.6, y: 1.3, z: 0.6};
    const ev = {dentAt: 2.9, crackAt: 3.5, shatterAt: 4.1};
    out = combine(
      impact({key: 'im1', at: {x: 6.6, y: 1.6, z: 0.5}, normal: {x: -1, y: 0.2, z: 0}, t, t0: 0.4, material: 'armor', ground: 0, seed: 1}),
      impact({key: 'im2', at: {x: 3, y: 0, z: -2}, normal: {x: 0, y: 1, z: 0}, t, t0: 1.0, material: 'concrete', ground: 0, seed: 2}),
      impact({key: 'im3', at: {x: 2.6, y: 1.1, z: 2.2}, normal: {x: -1, y: 0.3, z: 0}, t, t0: 1.6, material: 'flesh', seed: 3}),
      breakerHit({key: 'bh', at: {x: 6.6, y: 1.2, z: 0.5}, dir: {x: 1, y: 0, z: 0}, t, t0: 2.2, ground: 0}),
      plateHit({key: 'p1', at: plateP, normal: {x: -1, y: 0.2, z: 0.2}, t, t0: ev.dentAt, stage: 'dent', ground: 0}),
      plateHit({key: 'p2', at: plateP, normal: {x: -1, y: 0.2, z: 0.2}, t, t0: ev.crackAt, stage: 'crack', ground: 0}),
      plateHit({key: 'p3', at: plateP, normal: {x: -1, y: 0.2, z: 0.2}, t, t0: ev.shatterAt, stage: 'shatter', ground: 0}),
    );
    items.push(boxItem({x: 7, y: 0, z: 0.5}), dotItem({x: 2.6, y: 1.1, z: 2.2}, 'person'), dotItem(plateP, 'plate', '#8E9AA0'));
    const ps = plateState(t, ev);
    overlay = (
      <g>
        <g transform="translate(200 900)"><BarrierPlate w={220} h={130} {...ps} ink={3} /></g>
        {[{dent: 0}, {dent: 0.6}, {dent: 0.6, crack: 0.6}, {shattered: 1}].map((s, i) => <g key={i} transform={`translate(${470 + i * 150} 940)`}><BarrierPlate w={120} h={72} {...s} ink={2} /></g>)}
      </g>
    );
  }
  if (page === 6) {
    const gun = {x: 12, y: 3, z: -3};
    out = combine(
      muzzle({key: 'mz', at: gun, dir: {x: -6, y: -2.6, z: 4}, t, t0: 0.6, size: 0.7}),
      blast({key: 'bl', at: {x: 6, y: 0.4, z: 1}, t, t0: 0.9, size: 2.2, ground: 0, seed: 4}),
    );
    items.push(boxItem({x: 12.4, y: 0, z: -3.2}, 'heavy'), dotItem({x: 3, y: 1.2, z: 3}, 'person'));
    cam = orbit({x: 6, y: 2, z: 0.5}, 20, 205, 9, 44);
  }
  const sh = shake3(t, out.shake, 3);
  const v = makeView({...cam, pos: add3(cam.pos, sh), target: add3(cam.target, sh)});
  const light = {...BASE_LIGHT, lights: out.lights};
  return (
    <Scene view={v} light={light} mats={MATS} items={[...items, ...out.items]} t={t}
      over={<g>{overlay}<text x={30} y={50} fill="#FFF6E8" fontSize={30} fontFamily="sans-serif">{`p${page} ${PAGES[page] ?? ''}  t=${t.toFixed(2)}`}</text></g>} />
  );
};
