// 5:05–6:53 What could go wrong (hypotheticals, one real past wave-off), then the payoff: the planned sequence,
// reuse, what is still undone, and the closing image (clearly labelled hypothetical).
import React from 'react';
import {Cam, Cloud, Frame, Sea, Sky, World} from '../assets/env';
import {Booster, Ship, BOOSTER_LEN, SHIP_LEN, R, shipCatchY} from '../assets/vehicles';
import {Ground, PlanView, Tower, VEH_X, MOUNT_H, HINGE_X, ARM_Z} from '../assets/tower';
import {CloudField, Shore, TowerSet} from '../kit/scene';
import {BoosterCatch, CATCH_Y, ShipCatch, CatchState, shipPinWorld} from '../kit/catch';
import {clamp, ep, keys, lerp, ls, le, noise, wt, rnd} from '../kit/anim';
import {BigText, C, Callout, Chip, FONT, Mark} from '../kit/ui';
import {Shot} from '../kit/timeline';

const sx = (cam: Cam, x: number) => 960 + (x - cam.x) * cam.z;
const sy = (cam: Cam, y: number) => 540 + (y - cam.y) * cam.z;

const W1: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('f1');
  return (
    <Frame>
      <TowerSet cam={{x: VEH_X - 10, y: -86, z: 5.0 + u * 0.1}} light="night" carY={CATCH_Y} openNear={30} openFar={30} t={t} />
      <rect width={1920} height={1080} fill="#05070a" opacity={0.5} />
      <BigText text="WHAT COULD GO WRONG?" x={960} y={580} size={112} o={ep(u, 0, 0.35)} />
    </Frame>
  );
};

/** Wind and limited control: the ship drifts off the centreline. Hypothetical. */
const W2: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('f2');
  const u = t - t0;
  const dx = 4.5 * ep(u, 0.5, 4) + 0.6 * Math.sin(u * 2);
  const s: CatchState = {gap: lerp(30, 12, ep(u, 0, 7)), dx, tilt: -2.5 * ep(u, 0.5, 4), open: 30, engines: 0.88, plumeLen: 30};
  const cam: Cam = {x: VEH_X + 2, y: CATCH_Y + 4, z: 6.4};
  return (
    <Frame>
      <ShipCatch t={t} cam={cam} light="dusk" s={s} flapTrim={0.6 * Math.sin(u * 2)} foreground={
        <g>
          <line x1={VEH_X} x2={VEH_X} y1={CATCH_Y - 80} y2={CATCH_Y + 30} stroke="#ffc93c" strokeWidth={3} strokeDasharray="12 10" vectorEffect="non-scaling-stroke" />
        </g>
      } />
      {Array.from({length: 12}, (_, i) => {
        const k = ((u * 0.9 + i / 12) % 1);
        const y = 140 + ((i * 137) % 700);
        return <path key={i} d={`M${-100 + k * 2200} ${y} q 60 -18 120 0`} stroke="#ffffff" strokeWidth={4} fill="none" opacity={0.5 * Math.sin(k * Math.PI)} strokeLinecap="round" />;
      })}
      <Callout text="WIND" x={150} y={170} o={ep(u, 0.3, 0.7)} size={34} />
      <Callout text="drifting off the centreline" x={1160} y={820} o={ep(u, 1.5, 2.0)} size={28} />
      <Chip text="HYPOTHETICAL · ILLUSTRATION" x={44} y={1036} accent={C.red} />
    </Frame>
  );
};

/** A few feet of drift: plan view, catch points miss the arms. Hypothetical. */
const W3: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('f3');
  const u = t - t0;
  const off = ep(u, 0.4, 2.6) * 3.4;
  const miss = ep(t, wt('f3', 'miss') - 0.3, wt('f3', 'miss') + 0.3);
  return (
    <Frame bg="#e9eef2">
      <rect width={1920} height={1080} fill="#dfe7ee" />
      <g transform={`translate(960 560) scale(26) translate(${-VEH_X} 0)`}>
        <PlanView openNear={8} openFar={8} vx={VEH_X} vz={0} ship />
        <circle cx={VEH_X} cy={0} r={R} fill="none" stroke="#ffc93c" strokeWidth={3} strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
        <g transform={`translate(0 ${off})`} opacity={0.92}>
          <circle cx={VEH_X} cy={0} r={R} fill="#cfd5db" stroke={C.red} strokeWidth={3.5} vectorEffect="non-scaling-stroke" />
          {[-1, 1].map((s) => (
            <rect key={s} x={VEH_X - 0.55} y={s > 0 ? R - 0.1 : -R - 1.0} width={1.1} height={1.1} rx={0.2} fill="#e8b23a" stroke={C.ink} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </g>
      <Callout text="a few feet off" x={1240} y={180} o={ep(u, 0.8, 1.3)} size={34} />
      <g opacity={miss}>
        <circle cx={960} cy={560 - R * 26 - 13 + off * 26} r={46} fill="none" stroke={C.red} strokeWidth={7} />
        <Callout text="catch point misses the arm" x={1140} y={330} to={[1000, 560 - R * 26 + off * 26 - 20]} o={miss} size={30} />
      </g>
      <Chip text="HYPOTHETICAL · VIEW FROM ABOVE · CONCEPT GEOMETRY" x={44} y={1036} accent={C.red} />
    </Frame>
  );
};

/** Real: Flight 6 (Nov 19, 2024) — the catch was called off; the booster diverted to the Gulf. */
const W4: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('f4');
  const u = t - t0;
  const tc = wt('f4', 'called') - 0.2;
  const div = ep(t, tc + 0.3, le('f5') - 1.0);
  const bx = lerp(VEH_X + 160, VEH_X + 420, div) - (1 - ep(t, t0, tc + 0.3)) * 60;
  const by = lerp(-260, -2, ep(t, t0, le('f5') - 1.0));
  const cam: Cam = {x: VEH_X + 160, y: -120, z: 2.9};
  const red = ep(t, tc - 0.1, tc + 0.3);
  const splash = clamp((t - (le('f5') - 1.0)) / 1.2);
  return (
    <Frame>
      <Sky kind="day" />
      <CloudField cam={cam} k={0.3} n={8} />
      <World cam={cam}>
        <rect x={VEH_X + 210} y={-1} width={900} height={80} fill="#3f7fae" />
        <Ground light="day" x0={-600} x1={VEH_X + 210} />
        <Tower light="day" carY={-80} openNear={40} openFar={40} />
        <circle cx={HINGE_X + 2} cy={-128} r={5} fill={red > 0 ? C.red : '#888'} stroke={C.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <circle cx={HINGE_X + 2} cy={-128} r={16} fill={C.red} opacity={0.35 * red * (0.6 + 0.4 * Math.sin(t * 8))} />
        <path d={`M${VEH_X + 220} -300 Q ${VEH_X + 60} -150 ${VEH_X} -86`} fill="none" stroke={C.teal} strokeWidth={4} strokeDasharray="12 10" opacity={0.8 * (1 - red)} vectorEffect="non-scaling-stroke" />
        <path d={`M${VEH_X + 200} -250 Q ${VEH_X + 380} -120 ${VEH_X + 420} 0`} fill="none" stroke={C.red} strokeWidth={4} strokeDasharray="12 10" opacity={red} vectorEffect="non-scaling-stroke" />
        <g transform={`translate(${bx} ${by})`}>
          <Booster t={t} version="v1" engines={by > -60 && splash <= 0 ? 0.8 : 0} plumeLen={20} ring="inner" />
        </g>
        {splash > 0 ? <ellipse cx={VEH_X + 420} cy={0} rx={20 + 40 * splash} ry={6 + 8 * splash} fill="#fff" stroke={C.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" opacity={1 - splash * 0.5} /> : null}
      </World>
      <Callout text="CATCH CALLED OFF" sub="automated tower checks not clean" x={210} y={140} o={red} size={36} />
      <Callout text="diverted to the Gulf" x={1320} y={760} o={ep(t, wt('f5', 'Gulf') - 0.3, wt('f5', 'Gulf') + 0.2)} size={30} />
      <Chip text="FLIGHT 6 · NOV 2024 · REAL EVENT" sub="Illustrated reconstruction · earlier-generation booster" x={44} y={1036} accent={C.teal} />
    </Frame>
  );
};

/** The ship has just survived reentry: whatever state it's in, it flies the landing. */
const W6: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('f6');
  const cool = 1 - ep(u, 0, 6);
  return (
    <Frame>
      <Sky kind="dusk" />
      <g transform={`translate(960 ${560 + noise(t, 2) * 4}) rotate(90) scale(-1 1) scale(15) translate(0 ${SHIP_LEN / 2})`}>
        <Ship t={t} view="profile" heat={0.6 * cool} fwdFlap={0.7} aftFlap={0.7} />
      </g>
      {Array.from({length: 14}, (_, i) => (
        <circle key={i} cx={480 + rnd(i, 3) * 960} cy={660 + rnd(i, 4) * 40 + u * 20 * (1 + rnd(i, 5))} r={3 + rnd(i, 6) * 4} fill="#ffb070" opacity={0.6 * cool} />
      ))}
      <Callout text="FRESH FROM REENTRY" sub="the heat shield has just done its job" x={1150} y={160} o={ep(u, 0.3, 0.8)} size={34} />
      <Chip text="ILLUSTRATION" x={44} y={1036} />
    </Frame>
  );
};

/** Musk's odds + the schedule caveat. */
const W7: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('f7');
  const u = t - t0;
  const back = ep(t, wt('f7', 'sent') - 0.3, wt('f7', 'sent') + 0.3);
  return (
    <Frame bg="#f3ead6">
      <rect width={1920} height={1080} fill="#f3ead6" />
      <g opacity={ep(u, 0.1, 0.5)}>
        <rect x={140} y={170} width={860} height={230} rx={22} fill={C.cream} stroke={C.ink} strokeWidth={5} />
        <text x={180} y={270} fontFamily={FONT.title} fontWeight={700} fontSize={64} fill={C.ink}>“More likely than not”</text>
        <text x={180} y={340} fontFamily={FONT.ui} fontWeight={700} fontSize={28} fill="#55606b">Elon Musk on the first attempt · Oct 20, 2026</text>
      </g>
      {/* ship back at the test site: on a stand, frosted, engines removed */}
      <g opacity={back} transform={`translate(1430 ${960 - (1 - back) * 40})`}>
        <rect x={-120} y={-30} width={240} height={30} fill="#8d8a84" stroke={C.ink} strokeWidth={4} />
        <g transform="translate(0 -30) scale(9)">
          <Ship t={t} view="three" frost={1} fwdFlap={0.2} aftFlap={0.3} />
        </g>
      </g>
      <Callout text="SHIP 42 · SENT BACK FOR MORE TESTING" sub="reported by NASASpaceflight · date could move" x={140} y={560} o={back} size={34} />
      <Chip text="FLIGHT 15 · NO OFFICIAL DATE YET (TRACKERS: NO EARLIER THAN NOV 8)" x={44} y={1036} accent={C.yellow} o={back} />
    </Frame>
  );
};

// ---------------- payoff ----------------

/** Planned sequence: launch, separation, booster back in the arms minutes later (timeline bar). */
const P1: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('g1');
  const u = t - t0;
  const tl = wt('g2', 'Launch') , ts = wt('g2', 'Separation'), tb = wt('g2', 'turns');
  const stage = t < ts ? 0 : t < tb ? 1 : 2;
  const bar = (k: number) => ep(t, [tl, ts, tb + 1.0][k] - 0.2, [tl, ts, tb + 1.0][k] + 0.2);
  let body: React.ReactNode;
  if (stage === 0) {
    const h = Math.max(0, t - tl) * 18;
    const cam: Cam = {x: VEH_X - 14, y: -110 - h * 0.6, z: 3.6};
    body = (
      <>
        <Sky kind="dusk" />
        <CloudField cam={cam} k={0.3} n={8} tint="#f3c7a8" shade="#c98d7e" />
        <World cam={cam}>
          <Shore light="dusk" />
          <Ground light="dusk" />
          <Tower light="dusk" carY={-118} openNear={62} openFar={62} vehicle={
            <g transform={`translate(${VEH_X} ${-MOUNT_H - h})`}>
              <Booster t={t} light="dusk" engines={t > tl - 0.2 ? 1 : 0} plumeLen={60} />
              <g transform={`translate(0 ${-BOOSTER_LEN})`}><Ship t={t} view="three" light="dusk" fwdFlap={0.15} aftFlap={0.25} /></g>
            </g>
          } />
        </World>
      </>
    );
  } else if (stage === 1) {
    const sep = t - ts;
    const gap = Math.pow(Math.max(0, sep - 0.2), 1.5) * 6;
    body = (
      <>
        <Sky kind="high" />
        <World cam={{x: 0, y: -60 - gap * 0.3, z: 4.6}}>
          <g transform="rotate(-14)">
            <g transform={`translate(0 ${BOOSTER_LEN / 2 + gap * 0.2})`}><Booster t={t} engines={0} /></g>
            <g transform={`translate(0 ${BOOSTER_LEN / 2 - BOOSTER_LEN - gap})`}><Ship t={t} view="three" engines={1} plumeLen={38} fwdFlap={0.15} aftFlap={0.25} /></g>
          </g>
        </World>
      </>
    );
  } else {
    const k = ep(t, tb, tb + 2.2);
    body = <BoosterCatch t={t} cam={{x: VEH_X - 6, y: -66, z: 6.6}} light="dusk" s={{gap: lerp(20, 0, k), open: lerp(40, 5, k), engines: k < 1 ? 0.85 : 0, plumeLen: 6}} carY={-80} />;
  }
  const labels = ['LAUNCH', 'SEPARATION', 'BOOSTER CAUGHT · minutes later'];
  return (
    <Frame>
      {body}
      <g transform="translate(260 960)">
        <rect x={-30} y={-46} width={1460} height={92} rx={46} fill="rgba(20,25,31,0.85)" />
        {labels.map((l, i) => (
          <g key={i} opacity={0.25 + 0.75 * bar(i)} transform={`translate(${i * 470} 0)`}>
            <circle r={16} fill={i === 2 ? C.teal : C.cream} stroke={C.ink} strokeWidth={4} />
            <text x={30} y={10} fontFamily={FONT.ui} fontWeight={800} fontSize={26} fill={C.cream}>{l}</text>
          </g>
        ))}
      </g>
      <Chip text="ILLUSTRATION — PLANNED SEQUENCE" x={44} y={70} anchor="tl" accent={C.yellow} />
    </Frame>
  );
};

/** Later: the ship returns from orbit to a tower with its arms open. */
const P3: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('g3');
  const u = t - t0;
  const T = le('g4') - t0;
  const p = clamp(u / T);
  const s: CatchState = {gap: 1.0 + 60 * Math.pow(1 - p, 2.2), open: keys(p, [[0, 40], [0.6, 24], [1, 8]]), engines: 0.9, plumeLen: 30, dx: 2 * Math.pow(1 - p, 2)};
  const pin = shipPinWorld(s);
  const cam: Cam = {x: VEH_X - 8, y: pin.y + 22, z: 5.8 + p * 2};
  const two = ep(t, wt('g4', 'Two') - 0.2, wt('g4', 'Two') + 0.3);
  return (
    <Frame>
      <ShipCatch t={t} cam={cam} light="dusk" s={s} />
      <Chip text="LATER · AFTER ITS TIME IN ORBIT" x={44} y={70} anchor="tl" accent={C.yellow} o={ep(u, 0.2, 0.6)} />
      <rect width={1920} height={1080} fill="#05070a" opacity={0.35 * two} />
      <BigText text="TWO CATCHES" x={960} y={500} size={120} o={two} fill={C.yellow} />
      <BigText text="ONE LAUNCH" x={960} y={640} size={96} o={two} />
      <Chip text="ILLUSTRATION — PLANNED ATTEMPT, NOT YET FLOWN" x={44} y={1036} accent={C.yellow} />
    </Frame>
  );
};

/** Reuse loop: back on the pad, refuel, fly again. */
const P5: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('g5');
  const u = t - t0;
  const steps = [
    {w: 'pad', txt: 'set back on the pad'},
    {w: 'refuel', txt: 'refuel'},
    {w: 'fly', txt: 'fly again'},
  ];
  const cx = 960, cy = 560, rr = 300;
  return (
    <Frame bg="#eaf1f6">
      <Sky kind="day" />
      <circle cx={cx} cy={cy} r={rr} fill="none" stroke={C.ink} strokeWidth={14} strokeDasharray="30 22" strokeDashoffset={-u * 40} opacity={0.85} />
      <circle cx={cx} cy={cy} r={rr} fill="none" stroke={C.cream} strokeWidth={6} strokeDasharray="30 22" strokeDashoffset={-u * 40} />
      <g transform={`translate(${cx} ${cy + 230}) scale(3.4)`}>
        <Booster t={t} />
        <g transform={`translate(0 ${-BOOSTER_LEN})`}><Ship t={t} view="three" fwdFlap={0.15} aftFlap={0.25} /></g>
      </g>
      {steps.map((s, i) => {
        const a = -Math.PI / 2 + (i / 3) * Math.PI * 2 + 0.6;
        const o = ep(t, wt('g5', s.w) - 0.2, wt('g5', s.w) + 0.3);
        return <Callout key={i} text={s.txt} x={cx + Math.cos(a) * (rr + 80)} y={cy + Math.sin(a) * (rr + 60) - 30} o={o} size={34} align={Math.cos(a) < 0 ? 'r' : 'l'} />;
      })}
      <Callout text="like an airliner" x={140} y={140} o={ep(t, wt('g5', 'airliner') - 0.2, wt('g5', 'airliner') + 0.3)} size={34} dark />
      <Callout text="a stunt" sub="catching it once" x={1450} y={140} o={ep(t, wt('g5', 'stunt') - 0.2, wt('g5', 'stunt') + 0.3) * (1 - ep(t, wt('g5', 'pad') - 0.3, wt('g5', 'pad')))} size={30} />
      <Chip text="THE GOAL: RAPID REUSE" x={44} y={1036} accent={C.teal} />
    </Frame>
  );
};

/** What's done vs not yet. */
const P6: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('g6');
  const u = t - t0;
  const rows: [string, 'ok' | 'plan' | 'no'][] = [
    ['Catch the booster', 'ok'],
    ['Fly a caught booster again', 'ok'],
    ['Catch the ship', 'plan'],
    ['Fly a ship again', 'no'],
  ];
  return (
    <Frame bg="#141a21">
      <rect width={1920} height={1080} fill="#151c24" />
      {rows.map(([txt, st], i) => {
        const o = ep(u, 0.2 + i * 0.5, 0.6 + i * 0.5);
        return (
          <g key={i} opacity={o} transform={`translate(560 ${270 + i * 150})`}>
            {st === 'plan' ? (
              <g>
                <circle r={34} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
                <text y={16} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={46} fill={C.ink}>…</text>
              </g>
            ) : (
              <Mark x={0} y={0} ok={st === 'ok'} o={o} s={34} />
            )}
            <text x={70} y={16} fontFamily={FONT.title} fontWeight={700} fontSize={50} fill={st === 'no' ? C.yellow : C.cream}>{txt}</text>
            <text x={70} y={52} fontFamily={FONT.ui} fontWeight={700} fontSize={22} fill="rgba(251,244,228,0.7)">{st === 'ok' ? (i === 0 ? 'since Oct 2024' : 'Flight 9, May 2025') : st === 'plan' ? 'planned · Flight 15' : 'not yet, not once'}</text>
          </g>
        );
      })}
      <Chip text="STATUS AS OF OCT 21, 2026" x={44} y={1036} />
    </Frame>
  );
};

/** Decades of thrown-away stages (generic rockets, not specific vehicles). */
const P7: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('g7');
  return (
    <Frame>
      <Sky kind="dusk" />
      <Sea y={760} kind="dusk" t={t} />
      {[0, 1, 2, 3].map((i) => {
        const k = clamp((u - i * 0.5) / 2.4);
        const x = 300 + i * 420, y = lerp(-200, 760, k);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${30 + i * 25 + k * 60})`} opacity={k < 1 ? 1 : 0}>
            <rect x={-26} y={-150} width={52} height={150} rx={6} fill={['#e8e4dc', '#d9d2c3', '#efe9df', '#cfd5db'][i]} stroke={C.ink} strokeWidth={4} />
            <path d="M-26 0 L-40 26 L-14 6 Z M26 0 L40 26 L14 6 Z" fill="#7a7f86" stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
      {[0, 1, 2, 3].map((i) => {
        const k = clamp((u - i * 0.5 - 2.4) / 1.2);
        return k > 0 ? <ellipse key={`s${i}`} cx={300 + i * 420} cy={770} rx={40 + 60 * k} ry={10 + 10 * k} fill="#fff" opacity={1 - k} stroke={C.ink} strokeWidth={2} /> : null;
      })}
      <Callout text="the expensive part, thrown away" x={1080} y={160} o={ep(t, wt('g7', 'expensive') - 0.2, wt('g7', 'expensive') + 0.3)} size={34} />
      <Chip text="GENERIC ILLUSTRATION · EXPENDABLE ROCKET STAGES" x={44} y={1036} />
    </Frame>
  );
};

/** Final image: the whole rocket stacked again beside the tower (hypothetical). */
const P8: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('g8');
  const u = t - t0;
  const cam: Cam = {x: VEH_X - 30 + u * 0.8, y: -86, z: lerp(4.4, 5.2, ep(u, 0, 6))};
  const fin = ep(t, le('g8') + 0.4, le('g8') + 1.4);
  return (
    <Frame>
      <Sky kind="dusk" />
      <CloudField cam={cam} k={0.3} n={8} tint="#f3c7a8" shade="#c98d7e" />
      <World cam={cam}>
        <Shore light="dusk" />
        <Ground light="dusk" />
        <Tower light="dusk" carY={-118} openNear={62} openFar={62} vehicle={
          <g transform={`translate(${VEH_X} ${-MOUNT_H})`}>
            <Booster t={t} light="dusk" scorch={0.7} />
            <g transform={`translate(0 ${-BOOSTER_LEN})`}><Ship t={t} view="three" light="dusk" fwdFlap={0.15} aftFlap={0.25} /></g>
          </g>
        } />
      </World>
      <rect width={1920} height={1080} fill="url(#vignette)" />
      <Chip text="ILLUSTRATION — HYPOTHETICAL SUCCESSFUL RECOVERY" x={44} y={1036} accent={C.yellow} o={1 - fin} />
      <rect width={1920} height={1080} fill="#05070a" opacity={fin} />
      <g opacity={ep(t, le('g8') + 0.6, le('g8') + 1.0)}>
        <text x={960} y={560} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={64} fill={C.cream} letterSpacing={6}>FUTURE GOT WEIRD</text>
      </g>
    </Frame>
  );
};

export const endShots = (): Shot[] => [
  {id: 'W1', a: ls('f1') - 0.2, b: ls('f2'), render: (t) => <W1 t={t} />, tin: 'dip'},
  {id: 'W2', a: ls('f2'), b: ls('f3'), render: (t) => <W2 t={t} />, tin: 'cut'},
  {id: 'W3', a: ls('f3'), b: ls('f4'), render: (t) => <W3 t={t} />, tin: 'fade'},
  {id: 'W4', a: ls('f4'), b: ls('f6'), render: (t) => <W4 t={t} />, tin: 'whipR'},
  {id: 'W6', a: ls('f6'), b: ls('f7'), render: (t) => <W6 t={t} />, tin: 'fade'},
  {id: 'W7', a: ls('f7'), b: ls('g1'), render: (t) => <W7 t={t} />, tin: 'fade'},
  {id: 'P1', a: ls('g1') - 0.2, b: ls('g3'), render: (t) => <P1 t={t} />, tin: 'dip'},
  {id: 'P3', a: ls('g3'), b: ls('g5'), render: (t) => <P3 t={t} />, tin: 'fade'},
  {id: 'P5', a: ls('g5'), b: ls('g6'), render: (t) => <P5 t={t} />, tin: 'fade'},
  {id: 'P6', a: ls('g6'), b: ls('g7'), render: (t) => <P6 t={t} />, tin: 'fade'},
  {id: 'P7', a: ls('g7'), b: ls('g8'), render: (t) => <P7 t={t} />, tin: 'fade'},
  {id: 'P8', a: ls('g8'), b: 9999, render: (t) => <P8 t={t} />, tin: 'fade'},
];
void Cloud; void shipCatchY; void ARM_Z; void R; void noise;
