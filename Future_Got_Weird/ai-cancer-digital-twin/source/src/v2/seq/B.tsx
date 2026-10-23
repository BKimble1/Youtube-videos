// SEQUENCE B (36.3 – 63.9 s): the tumour steals nutrients, recruits vessels, hides from an immune cell; one cell
// breaks free, crawls to a capillary, enters the blood, travels, lodges in the liver, escapes the vessel and seeds a
// new colony; pull back to the whole body (lung, liver and more sites); then the tumour as a population of changing,
// competing subclones.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, clamp01, lerp, smooth, seg, rand, mixHex} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {SITE} from '../art/body';
import {BodyWorld, TISSUE_SCALE, LIVER_ANCHOR} from '../art/lung';
import {cellAt, nearest, TissueField, TissueBack, Cell2, TCell2, R, TUMOR, CLONES, lookMix, Mod, Motes} from '../art/tissue';
import {Capillary, Nutrients, Fibres, ShieldLigands, smoothPts, along} from '../art/stroma';
import {BloodTunnel} from '../art/blood';
import {LiverField, hepAt, liverTumorLook, LCR, SW} from '../art/liver';
import {C0P, tumorMod, boundary, TumorMassShade, cloneLook, MICRO_END} from './A';

const C0 = {x: C0P[0], y: C0P[1]};
const rel = (x: number, y: number): Pt => [C0.x + x, C0.y + y];
const tB = {
  worse: T('But it gets worse.'), steals: T('steals nutrients'), recruits: T('recruits blood vessels'), hide: T('hide from the immune system'), hideE: TE('hide from the immune system.'),
  free: T('Then some cancer cells break free.'), enter: T('They enter the bloodstream'), travel: T('travel through the body'), create: T('can create new tumors'), organs: T('different organs.'),
  nightmare: T("And that's the real nightmare."), enemy: T("Cancer isn't one enemy."), millions: T("It's millions of your own cells"), changing: T('constantly changing'),
  evolving: T('evolving, and'), finding: T('finding new ways to survive'), predict: T('But what if we could predict'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));

// ------------------------------------------------------------------------------------------------ the tumour
const RtB = (t: number) => 2500 + 300 * smooth((t - tB.worse) / 20);
// continues from the subclone mix the growth sequence ends on (hetA), rising to fully heterogeneous
const hetB = (t: number) => (t > tB.millions - 0.2 ? 1 : 0.55 + 0.45 * smooth((t - tB.worse) / 12));
const rimPt = (deg: number, t: number, inset = 0): Pt => {
  const a = (deg * Math.PI) / 180;
  const r = RtB(t) * boundary(a) - inset;
  return [C0.x + Math.cos(a) * r, C0.y + Math.sin(a) * r];
};

// ------------------------------------------------------------------------------------------------ plumbing
const CAP1 = smoothPts([rel(-8000, -3700), rel(-3000, -3950), rel(800, -3620), rel(4200, -3350), rel(8500, -3550)], 90);
const CAP2 = smoothPts([rel(-8500, 3900), rel(-3500, 3650), rel(1000, 3900), rel(5000, 3600), rel(9000, 4000)], 90);
const CAP3 = smoothPts([rel(4300, -7500), rel(4050, -3000), rel(4480, 300), rel(4100, 3700), rel(4400, 7500)], 90);
const CAP4 = smoothPts([rel(-3300, -6500), rel(-3800, -2600), rel(-3650, -200), rel(-3900, 1600), rel(-3500, 3700)], 90);
const SPROUTS = [
  smoothPts([rel(780, -3620), rel(640, -3000), rel(400, -2500), rel(460, -1750)], 30),
  smoothPts([rel(4460, 280), rel(3700, 520), rel(3000, 260), rel(2350, 200)], 30),
  smoothPts([rel(-620, 3700), rel(-760, 3100), rel(-460, 2500), rel(-560, 1950)], 30),
  smoothPts([rel(2400, -3420), rel(2100, -2900), rel(1600, -2500), rel(1250, -2050)], 30),
];
const sproutGrow = (t: number, k: number) => lift(t, tB.recruits + k * 0.25, tB.recruits + 1.7 + k * 0.25);
const sproutPerf = (t: number, k: number) => lift(t, tB.recruits + 1.6 + k * 0.25, tB.recruits + 2.4 + k * 0.25);

// ------------------------------------------------------------------------------------------------ one region: the tumour's upper edge and the capillary above it
// Everything in this stretch happens at the same place, so the camera never wanders: nutrients come out of CAP1 into
// the edge, a sprout grows from CAP1 into the tumour, a T cell that left CAP1 is switched off at the edge, and an
// edge cell breaks away and enters CAP1 (whose flow runs to screen right, like the vessel shot that follows).
const E_DEG = -114, F_DEG = -99;
const tE = tB.hide;
const ecell = (() => {
  const p = rimPt(E_DEG, tE, 80);
  const n = nearest(p[0], p[1]);
  return {...n, ...cellAt(n.i, n.j)};
})();
const eDir = (E_DEG * Math.PI) / 180;
const TC_FROM = along(CAP1, 0.405).p;
const tcellPos = (t: number): Pt => {
  const k = lift(t, tB.recruits + 1.2, tE + 0.05);
  const end: Pt = [ecell.x + Math.cos(eDir) * (R + 60), ecell.y + Math.sin(eDir) * (R + 60)];
  return [lerp(TC_FROM[0], end[0], k) + 40 * (1 - k) * Math.sin(t * 1.3), lerp(TC_FROM[1] + 60, end[1], k)];
};
const fcell = (() => {
  const p = rimPt(F_DEG, tB.free, 60);
  const n = nearest(p[0], p[1]);
  return {...n, ...cellAt(n.i, n.j)};
})();
const Q_U = 0.47;
const Q = along(CAP1, Q_U).p;
const ROUTE = smoothPts([[fcell.x, fcell.y], [fcell.x - 30, fcell.y - 180], [lerp(fcell.x, Q[0], 0.5) - 40, lerp(fcell.y, Q[1], 0.55)], [Q[0], Q[1] + 70], [Q[0], Q[1]]], 60);
const tEsc = {stretch0: tB.free + 0.05, go: tB.free + 0.75, arrive: tB.enter + 0.05, inside: tB.enter + 0.75};
const escPos = (t: number): Pt => {
  const u = lift(t, tEsc.go, tEsc.arrive);
  const p = along(ROUTE, u).p;
  const k = lift(t, tEsc.arrive, tEsc.inside); // final squeeze along the capillary, with its flow
  const q = along(CAP1, Q_U + 0.006 * k).p;
  return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
};
const escDir = (t: number) => (t < tEsc.arrive ? along(ROUTE, lift(t, tEsc.go, tEsc.arrive)).ang : along(CAP1, Q_U).ang);

// ------------------------------------------------------------------------------------------------ camera (tissue part)
const A_END = MICRO_END(tB.worse + 0.4);
const EDGE: Pt = rimPt(-90, tB.steals);
const camT = path([
  {...A_END, t: tB.worse + 0.4},
  {t: tB.steals + 0.3, x: EDGE[0] + 250, y: EDGE[1] + 300, z: 0.3, rot: -1},
  {t: tB.recruits + 0.6, x: EDGE[0] + 380, y: EDGE[1] - 120, z: 0.42, rot: 0},
  {t: tB.hide - 0.6, x: ecell.x + 60, y: ecell.y - 220, z: 0.6, rot: 0.5},
  {t: tB.hide + 0.35, x: ecell.x + 20, y: ecell.y - 90, z: 1.05, rot: 1},
  {t: tB.free - 0.1, x: ecell.x, y: ecell.y - 70, z: 1.1, rot: 1},
  {t: tB.free + 0.65, x: fcell.x + 40, y: fcell.y - 90, z: 0.95, rot: 0.5},
  {t: tEsc.go + 0.8, x: escPos(tEsc.go + 0.8)[0], y: escPos(tEsc.go + 0.8)[1], z: 0.9, rot: 0},
  {t: tEsc.arrive, x: Q[0] + 30, y: Q[1] + 20, z: 1.2, rot: 0},
  {t: tEsc.inside + 0.3, x: escPos(tEsc.inside)[0], y: escPos(tEsc.inside)[1], z: 2.1, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ vessel part: ride with the cell, then rise out
const VS = 95 / 58; // vessel units per tissue unit (anchored on the travelling cell)
const tV = {h0: tEsc.inside - 0.2, h1: tEsc.inside + 0.3, cruise: tB.travel - 0.2, out: tB.travel + 0.45};
const cellVX = (t: number) => {
  // position along the vessel: accelerate with the flow, then cruise (integrated smooth speed profile)
  const v = (u: number) => 1100 * lift(u, tV.h0, tV.cruise);
  let x = 0;
  const dt = 1 / 60;
  for (let u = tV.h0; u < t; u += dt) x += v(u) * dt;
  return x;
};
const camV = (t: number): Cam => {
  const zk = path([
    {t: tV.h1, x: 0, y: 0, z: 2.1 / VS},
    {t: tV.cruise + 0.3, x: 0, y: 0, z: 0.9},
    {t: tV.out + 0.6, x: 0, y: 0, z: 0.42},
  ])(t);
  return {x: cellVX(t), y: 0, z: zk.z, rot: 0};
};
const vesselFromTissue = (ct: Cam, t: number) => handoff(ct, escPos(t), [cellVX(t), 0], VS);

// ------------------------------------------------------------------------------------------------ the route through the body (body units)
// lung tumour → pulmonary vein → heart → aorta → hepatic artery → liver; the travelling cell is the marked dot
const ROUTE_B = smoothPts([[SITE.tumor[0] - 14, SITE.tumor[1] + 10], [80, -410], [52, -372], [24, -330], [10, -280], [10, -220], [-20, -205], [-60, -190], [SITE.mets[0], SITE.mets[1]]], 80);
const tR = {h0: tV.out, h1: tV.out + 0.4, arrive: tB.organs + 0.2};
const routeU = (t: number) => lift(t, tR.h0, tR.arrive);
const routePt = (t: number) => along(ROUTE_B, routeU(t)).p;
const DOT_S = 4 / 95; // body units per vessel unit at the hand-off (the 95-unit cell becomes a 4-unit dot)
const bodyFromVessel = (cv: Cam, t: number) => handoff(cv, [cellVX(t), 0], routePt(t), DOT_S);
const B_START = bodyFromVessel(camV(tR.h1), tR.h1);
const camBody = path([
  {...B_START, t: tR.h1},
  {t: tR.h1 + 0.7, x: 60, y: -360, z: 3.2, rot: 0},
  {t: tR.arrive, x: -40, y: -250, z: 2.2, rot: 0},
  {t: tB.nightmare + 0.2, x: -50, y: -230, z: 2.0, rot: 0},
  {t: tB.enemy + 0.2, x: 0, y: -240, z: 0.8, rot: 0},
  {t: tB.millions + 0.05, x: 6, y: -250, z: 0.84, rot: 0},
]);
const colony = (t: number) => lift(t, tR.arrive - 0.1, tB.nightmare + 0.4);
const EXTRA_METS: [Pt, number][] = [[[-12, -770], 0.4], [[64, 330], 0.85], [[-30, -40], 1.25]];

// ------------------------------------------------------------------------------------------------ draw: tissue part
const TissueB: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const Rt = RtB(t);
  const het = hetB(t);
  const lod = R * cam.z;
  const escaping = t > tEsc.stretch0;
  const shields = lift(t, tB.hide - 0.9, tB.hide + 0.1);
  const mod = tumorMod(t, Rt, het, (i, j) => {
    if (escaping && i === fcell.i && j === fcell.j) return {hide: true};
    return null;
  });
  const stretch = 1 + 0.8 * lift(t, tEsc.stretch0, tEsc.go) + 0.6 * lift(t, tEsc.arrive, tEsc.inside);
  const ep = escaping ? escPos(t) : [fcell.x, fcell.y];
  const nut = Math.min(lift(t, tB.steals - 0.4, tB.steals + 0.4), 1 - lift(t, tB.recruits + 1.4, tB.hide));
  const tc = tcellPos(t);
  const dimT = lift(t, tB.hide + 0.25, tB.hideE + 0.4);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={mod} />
        <TumorMassShade Rt={Rt} op={1 - lift(cam.z, 0.35, 0.7)} />
        {/* matrix fibres between the tumour edge and the capillary used for the escape */}
        <g transform={`rotate(90 ${(Q[0] + fcell.x) / 2} ${(Q[1] + fcell.y) / 2})`}>
          <Fibres x0={(Q[0] + fcell.x) / 2 - 360} y0={(Q[1] + fcell.y) / 2 - 450} x1={(Q[0] + fcell.x) / 2 + 360} y1={(Q[1] + fcell.y) / 2 + 450} t={t} op={0.85 * lift(t, tB.free - 1.5, tB.free)} />
        </g>
        {/* the host capillaries come into view as the pull-back settles rather than popping on at the shot change */}
        <g opacity={lift(t, tB.worse + 0.4, tB.worse + 1.3)}>{[CAP1, CAP2, CAP3, CAP4].map((c, k) => <Capillary key={k} pts={c} t={t} w={95} lod={cam.z} />)}</g>
        {SPROUTS.map((s, k) => sproutGrow(t, k) > 0.01 && <Capillary key={'s' + k} pts={s} t={t} w={78} grow={sproutGrow(t, k)} perfuse={sproutPerf(t, k)} lod={cam.z} />)}
        <Nutrients from={[along(CAP1, 0.45).p, along(CAP1, 0.48).p, along(CAP1, 0.51).p, along(CAP1, 0.54).p, along(CAP1, 0.57).p]} to={[EDGE[0] + 200, EDGE[1] + 700]} t={t} k={nut} n={40} size={26} />
        {/* immune evasion: shield ligands on the edge cell, the T cell docks and is switched off */}
        <ShieldLigands x={ecell.x} y={ecell.y} r={R * 0.95} a0={eDir - 1.1} a1={eDir + 1.1} k={shields} n={8} size={16} />
        {t > tB.recruits + 1.3 && t < tB.free + 1.5 && <TCell2 x={tc[0]} y={tc[1]} r={52} t={t} dir={eDir + Math.PI} lod={lod} dim={dimT} spikes={1 - 0.6 * dimT} />}
        {t > tB.hide - 0.1 && dimT > 0.01 && <circle cx={lerp(tc[0], ecell.x, 0.5)} cy={lerp(tc[1], ecell.y, 0.5)} r={30} fill="url(#glowGold)" opacity={0.6 * (1 - dimT)} />}
        {/* the escaping cell */}
        {escaping && t < tV.h1 + 0.1 && (
          <Cell2 x={ep[0]} y={ep[1]} seed={fcell.seed} t={t} lod={lod} look={TUMOR} stretch={stretch} dir={escDir(t)} round={0.6} pulse={0.35} nucScale={1.2} />
        )}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ draw: vessel part
const VesselB: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const cx = cellVX(t);
  const tumble = (t - tV.h0) * 35;
  return (
    <BloodTunnel cam={cam} t={t} flow={1250}>
      <g transform={`translate(${cx} ${0}) rotate(${tumble})`}>
        <circle r={260} fill="url(#glowMag)" opacity={0.35 * lift(t, tV.cruise, tV.out)} />
        <Cell2 x={0} y={0} r={95} seed={fcell.seed} t={t} lod={95 * cam.z} look={TUMOR} round={1} stretch={1 + 0.5 * (1 - lift(t, tV.h0, tV.cruise))} dir={-((tumble * Math.PI) / 180)} pulse={0.3} nucScale={1.2} />
      </g>
    </BloodTunnel>
  );
};

// ------------------------------------------------------------------------------------------------ draw: the route through the body
const RouteB: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const u = routeU(t);
  const p = routePt(t);
  const lit = Math.min(1, u * 1.2 + 0.05);
  const pathD = 'M ' + ROUTE_B.map((q) => q.join(' ')).join(' L ');
  const grown = colony(t);
  return (
    <BodyWorld
      t={t}
      cam={cam}
      liver
      body={{glow: 0, lesion: 0.9, chest: 0.6, mets: 0.55 * grown, tumorSize: 1, metsSize: 0.3 + 1.3 * grown, vessels: 0.35 + 0.45 * lift(t, tB.nightmare + 0.2, tB.enemy)}}
      lungTumor={0.55}
      liverMets={0.8 * grown}
      front={
        <g>
          {/* the route the cell is carried along */}
          <path d={pathD} fill="none" stroke={P.bloodLight} strokeWidth={9} strokeLinecap="round" opacity={0.35} strokeDasharray={`${lit * 2000} 99999`} />
          <path d={pathD} fill="none" stroke="#FFD6EC" strokeWidth={2.5} strokeDasharray="5 9" strokeDashoffset={-t * 40} opacity={0.6 * (1 - grown)} />
          {u < 0.999 && (
            <g>
              <circle cx={p[0]} cy={p[1]} r={16} fill="url(#glowMag)" />
              <circle cx={p[0]} cy={p[1]} r={4} fill={TUMOR.light} stroke={TUMOR.deep} strokeWidth={1} />
            </g>
          )}
          {EXTRA_METS.map(([q, d], k) => {
            const k2 = lift(t, tB.nightmare + d, tB.nightmare + d + 0.6);
            return k2 > 0.01 && <circle key={k} cx={q[0]} cy={q[1]} r={40 * (0.9 + 0.1 * Math.sin(t * 3 + k))} fill="url(#glowMag)" opacity={k2 * 0.85} />;
          })}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------------------------------------ draw: heterogeneity / evolution
const camH = path([
  {t: tB.millions, x: C0.x - 700, y: C0.y + 300, z: 1.05, rot: -2},
  {t: tB.finding, x: C0.x - 100, y: C0.y + 40, z: 0.85, rot: 0},
  {t: tB.predict + 0.6, x: C0.x + 250, y: C0.y - 120, z: 0.62, rot: 1.5},
]);
const EvolveB: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const Rt = RtB(t);
  const waveX = lerp(C0.x - 1700, C0.x + 1300, lift(t, tB.evolving - 0.1, tB.finding + 0.4));
  const waveOn = t > tB.evolving - 0.2 && t < tB.finding + 0.6;
  const mod = tumorMod(t, Rt, 1, (i, j, x, y) => {
    const dx = x - C0.x, dy = y - C0.y;
    const d = Math.hypot(dx, dy) / boundary(Math.atan2(dy, dx));
    if (d >= Rt) return null;
    const r = rand(((i * 7919) ^ (j * 104729)) & 0xffff);
    // constantly changing: each cell flips subclone once in a staggered window
    const flipAt = tB.changing - 0.3 + r * 1.4;
    const k0 = r < 0.5 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : 3;
    const k1 = (k0 + 1 + Math.floor(r * 7)) % 4;
    const f = lift(t, flipAt, flipAt + 0.3);
    let look = lookMix(CLONES[k0], CLONES[k1], f);
    // evolving: a pressure wave kills the sensitive clone (k1 === 0); survivors (k1 === 1) expand and glow
    const passed = x < waveX;
    const sensitive = k1 === 0 || k1 === 2;
    const die = sensitive && passed ? lift(t, flipAt + 0.6, flipAt + 1.2) * clamp01((waveX - x) / 300) : 0;
    const surv = !sensitive ? lift(t, tB.finding - 0.2, tB.finding + 0.8) : 0;
    if (surv > 0) look = lookMix(look, {...CLONES[1], light: P.immuneGold}, 0);
    return {look: die > 0 ? lookMix(look, {...look, fill: '#6E4A5E', light: '#8E6A7E'}, die) : look, s: lerp(1, 0.55, die) * (1 + 0.1 * surv), op: 1 - die * 0.55, bleb: die * 0.8, shrink: die * 0.4, pulse: surv * 0.25 + 0.4 * Math.exp(-((t - flipAt - 0.15) ** 2) / 0.02), nucScale: 1.25};
  });
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={mod} />
        {waveOn && (
          <g opacity={Math.min(lift(t, tB.evolving - 0.2, tB.evolving + 0.2), 1 - lift(t, tB.finding + 0.2, tB.finding + 0.6))}>
            <rect x={waveX - 700} y={C0.y - 4000} width={700} height={8000} fill="url(#glowWhite)" opacity={0.25} />
            <rect x={waveX - 14} y={C0.y - 4000} width={28} height={8000} fill="#FFF4F8" opacity={0.35} />
          </g>
        )}
        {[CAP1, CAP2, CAP3, CAP4].map((c, k) => <Capillary key={k} pts={c} t={t} w={95} lod={cam.z} />)}
        {SPROUTS.map((s, k) => <Capillary key={'s' + k} pts={s} t={t} w={78} lod={cam.z} />)}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};

export const camTissueB = camT;
export const EVOLVE_CAM = camH;
export {EvolveB, RtB, tB};
export const shotsB: Shot[] = [
  {id: 'B-tissue', t0: tB.worse + 0.4, t1: tV.h1 + 0.05, draw: (t) => <TissueB t={t} cam={camT(t)} />},
  {
    id: 'B-vessel',
    t0: tV.h0,
    t1: tR.h1 + 0.05,
    fade: tV.h1 - tV.h0,
    draw: (t) => <VesselB t={t} cam={t < tV.h1 ? vesselFromTissue(camT(t), t) : camV(t)} />,
  },
  {id: 'B-route', t0: tR.h0, t1: tB.millions, fade: tR.h1 - tR.h0, draw: (t) => <RouteB t={t} cam={t < tR.h1 ? bodyFromVessel(camV(t), t) : camBody(t)} />},
  {id: 'B-evolve', t0: tB.millions, t1: tB.predict, draw: (t) => <EvolveB t={t} cam={camH(t)} />},
];
export const _b = {W, H, clamp01, mixHex, rand, TE};
export type _M = Mod;
export const CAPS = [CAP1, CAP2, CAP3, CAP4];
export {SPROUTS};
