import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {CharacterSide, SidePose, sideFK} from '../v2/side';
import {MugSide, MUG} from '../v2/props';
import {Street2} from '../v2/Street2';
import {HeroShadow, Puff} from '../v2/Fx2';
import {GSY, GYW, SC} from '../v2/choreo2';
import {Chip, Leader, ArrowShape, cl, lerp, popScale, ramp, sm} from '../film2/ui';
import {T, WORD, fs} from './timeline5';
import {HERO_X, CONTACT_WORLD_X, U_REL, camP1, hipP1, keyAt, liftP1, poseP1, scuffP1, zoomP1} from './Opening5';
import {BIKE_R as BR, BIKE_Y as BY} from '../v2/choreo2';
import {Body, DrawBike, DrawBin, DrawBox, DrawChair, DrawMug, DrawPot, DrawSheet, FgLamp, Lamp3, PalmWind, ScarfFly, Stream3, Trail, rotCW, simBody} from './Street5';

/* ================================================================== P1: carried east (f20-48): a grounded step becomes loss of footing. The pinned-foot choreography lives in Opening5.ts (pure functions);
   this file draws it: the figure, the contact shadow and scuff pinned to the pavement, the dust, the coffee, the foreground pole. The picture cuts away before contact. */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mouthP1 = (z: number) => (fb: number) => {
  const sc = SC * z, ff = Math.max(fb, T.cutStreet), p = poseP1(ff), hip = hipP1(ff, z), fk = sideFK(p, hip, sc), tilt = keyAt(ff - T.cutStreet).tilt;
  const o = rotCW(MUG.cx, MUG.mouthY, tilt), d = rotCW(0, -1, tilt);
  return {x: fk.Wn.x + o.x * sc, y: fk.Wn.y + o.y * sc, dx: d.x, dy: d.y};
};
/** the foreground pole closes in on her leading hand and ends a short, clear gap away (the picture cuts before contact) */
const leadX = (fr: number) => { const z = zoomP1(fr), sc = SC * z, fk = sideFK(poseP1(fr), hipP1(fr, z), sc); return Math.max(fk.Wn.x, fk.Wf.x, fk.Hc.x + 74 * sc); };
export const poleX = (fr: number) => lerp(1440, leadX(T.dangerEnd - 1) + 64, E.in(cl((fr - T.cutStreet) / (T.dangerEnd - 1 - T.cutStreet))));
/** world-space ground marks of the pinned foot: a contact shadow while it is down, a short scuff when it is dragged off */
const FootMarks: React.FC<{f: number}> = ({f}) => {
  const u = f - T.cutStreet;
  const sh = clamp01(u + 1) * (1 - clamp01((u - U_REL) / 3));
  const sc = scuffP1(f);
  return (
    <g>
      {sh > 0.01 && <g opacity={sh}><ellipse cx={CONTACT_WORLD_X + 4} cy={GYW + 3} rx={66} ry={11} fill={C.shadow} opacity={0.95} /><ellipse cx={CONTACT_WORLD_X + 2} cy={GYW + 4} rx={40} ry={6} fill={C.ink} opacity={0.38} /></g>}
      {sc.on && <path d={`M ${sc.x0} ${GYW + 4} L ${sc.x0 + sc.len} ${GYW + 2}`} stroke={C.ink} strokeOpacity={0.4} strokeWidth={12} strokeLinecap="round" />}
    </g>
  );
};

export const P1: React.FC<{f: number}> = ({f}) => {
  const z = zoomP1(f), cx = camP1(f), sc = SC * z;
  const pose = poseP1(f), hip = hipP1(f, z), fk = sideFK(pose, hip, sc);
  const u = f - T.cutStreet, tilt = keyAt(u).tilt;
  const heroWX = cx + (HERO_X - 540) / z;
  const blur = 2.2;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={blur} pad={420}>
        <HeroShadow x={heroWX + 10} lift={liftP1(f) * 2.2} />
        <FootMarks f={f} />
        <Puff x={CONTACT_WORLD_X - 10} y={GYW - 16} age={u + 2} seed={3} />
        <Puff x={CONTACT_WORLD_X + 50} y={GYW - 16} age={u - U_REL + 1} seed={12} />
      </Street2>
      <CharacterSide pose={pose} hip={hip} sc={sc} scarfWrap scarf={<ScarfFly n={fk.N} z={z} f={f * 1.0} k={1 + 0.25 * clamp01(u / 14)} />} holdN={<MugSide tilt={tilt} sc={sc} />} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Stream3 f={f} f0={T.cutStreet + 7} mouth={mouthP1(z)} speed={9} g={1.0} scale={z} />
        <FgLamp x={poleX(f)} w={44} />
      </svg>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><radialGradient id="p1vig" cx="50%" cy="58%" r="70%"><stop offset="0.55" stopColor={C.ink} stopOpacity={0} /><stop offset="1" stopColor={C.ink} stopOpacity={0.5} /></radialGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#p1vig)" opacity={ramp(f, T.cutStreet + 14, T.dangerEnd - 2, (x) => x)} />
      </svg>
    </div>
  );
};


/* ================================================================== P2: the street stands still; everything that is loose goes east past it (f48-182) */
export const CAMX2 = 1250;
export const zoom2 = (f: number) => lerp(1.0, 1.08, cl((f - T.wideA) / (T.trackA - T.wideA)));
export const toS2 = (x: number, y: number, z: number) => ({x: 540 + (x - CAMX2) * z, y: GSY + (y - GYW) * z});
const LAMP_X2 = 1400;
/**
 * Three clear trajectories carry the first sentence, one dominant contact at a time, each in its own depth band and time slot:
 *   1. the mug and its coffee (the bridge from the carry),   2. the bicycle (wheels turning) hits the lamp post in the narration's pause after "east",
 *   3. a box tumbles through the upper air while the "thousand" plate is up,   4. a chair hits the palm in the pause after "equator".
 * "Loose objects keep going too": a second small wave (box, pot, chair) in separate bands while the wind comes up.
 */
export const BODIES = {
  mug: {x0: 380, y0: 1010, vx: 66, vy: -4, spin: 26, g: 1.5, floor: GYW - 34, e: 0.45, fr: 0.86, t0: 38} as Body,
  bike: {x0: 440, y0: BY - BR, vx: 54, vy: 0, spin: 0, g: 1.0, floor: BY - BR, e: 0.3, fr: 0.93, roll: 0.998, t0: 56, hits: [{x: 1212, vxK: 0.5, vy: -19, spin: 17}]} as Body,
  boxA: {x0: 420, y0: 960, vx: 64, vy: -6, spin: 18, g: 1.3, floor: GYW - 52, e: 0.5, fr: 0.88, t0: 92} as Body,
  chairA: {x0: 400, y0: 800, vx: 60, vy: 0, spin: -16, g: 1.1, floor: GYW - 86, e: 0.42, fr: 0.88, t0: 128, hits: [{x: 985, vxK: -0.2, vy: -14, spin: 24}]} as Body,
  boxB: {x0: 420, y0: 900, vx: 70, vy: -8, spin: -20, g: 1.3, floor: GYW - 78, e: 0.5, fr: 0.9, t0: 150} as Body,
  potA: {x0: 400, y0: 1060, vx: 72, vy: -10, spin: 14, g: 1.3, floor: GYW - 52, e: 0.45, fr: 0.9, t0: 158} as Body,
  chairB: {x0: 420, y0: 740, vx: 68, vy: 2, spin: 15, g: 1.1, floor: GYW - 86, e: 0.4, fr: 0.9, t0: 166} as Body,
};
export const bikeHitF = simBody(BODIES.bike, 140).hitT[0] ?? 70;
export const chairHitF = simBody(BODIES.chairA, 170).hitT[0] ?? 138;
const shake2 = (f: number) => {
  let dx = 0, dy = 0;
  for (const [t, a] of [[bikeHitF, 9], [chairHitF, 7]] as [number, number][]) if (f >= t && f < t + 12) { const k = Math.exp(-(f - t) * 0.38); dx += a * k * Math.sin((f - t) * 2.2); dy += a * 0.7 * k * Math.cos((f - t) * 2.6); }
  return {dx, dy};
};
const SHEETS = Array.from({length: 10}).map((_, i) => ({t0: 62 + i * 11, x0: 160 + rand(i + 1) * 380, y0: 720 + rand(i + 2) * 120 + (i % 3) * 40, vx: 58 + rand(i + 3) * 30, vy: -2 + rand(i + 4) * 4, ph: rand(i + 5) * 6, kind: i % 3, s: 0.9 + rand(i + 6) * 0.5}));
const EqPlate: React.FC<{x: number; y: number; scale: number}> = ({x, y, scale}) => {
  if (scale <= 0.01) return null;
  const w = 640, h = 206;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-w / 2 + 9} y={-h / 2 + 10} width={w} height={h} rx={28} fill={C.ink} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <path d={`M ${-w / 2 + 2.5} ${-h / 2 + 62} V ${-h / 2 + 28} Q ${-w / 2 + 2.5} ${-h / 2 + 2.5} ${-w / 2 + 28} ${-h / 2 + 2.5} H ${w / 2 - 28} Q ${w / 2 - 2.5} ${-h / 2 + 2.5} ${w / 2 - 2.5} ${-h / 2 + 28} V ${-h / 2 + 62} Z`} fill={C.teal} />
      <line x1={-w / 2} y1={-h / 2 + 62} x2={w / 2} y2={-h / 2 + 62} stroke={C.ink} strokeWidth={4} />
      <text x={0} y={-h / 2 + 32} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={44} letterSpacing={6} fill={C.cream}>EQUATOR</text>
      <text x={-w / 2 + 34} y={26} dy="0.36em" textAnchor="start" fontFamily={HED_FONT} fontWeight={800} fontSize={112} letterSpacing={1} fill={C.ink}><tspan fill={C.coral}>~</tspan>1,000</text>
      <text x={w / 2 - 100} y={44} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={58} letterSpacing={2} fill={C.coral}>MPH</text>
      <ArrowShape x={w / 2 - 100} y={-8} w={60} />
    </g>
  );
};

export const P2: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const z = zoom2(f), sh = shake2(f);
  const names = Object.keys(BODIES) as (keyof typeof BODIES)[];
  const st = Object.fromEntries(names.map((n) => [n, simBody(BODIES[n], f)])) as Record<keyof typeof BODIES, ReturnType<typeof simBody>>;
  const wob = f >= bikeHitF ? 3.6 * Math.exp(-(f - bikeHitF) / 8) * Math.sin((f - bikeHitF) * 0.9) : 0;
  const puffs: {x: number; t: number; k: number}[] = [];
  names.forEach((n, k) => st[n].events.filter((e) => e.kind === 'floor').forEach((e) => puffs.push({x: e.x, t: e.t, k: k + 1})));
  const drops = Array.from({length: 10}).map((_, i) => ({t0: BODIES.mug.t0 + i * 0.8, x0: 380 + i * 18, y0: 1010 + (rand(i + 20) - 0.5) * 60, vx: 54 + rand(i + 21) * 24, vy: -9 + rand(i + 22) * 8, spin: 0, g: 1.5, floor: GYW - 4, e: 0.3, fr: 0.8} as Body));
  const wind = ramp(f, T.windA, T.windB, (x) => x);
  const bikeAng = ((st.bike.x - BODIES.bike.x0) / BR) * (180 / Math.PI);
  const S = (p: {x: number; y: number}) => toS2(p.x, p.y, z);
  const off = 1 - ramp(f, 140, 148, (x) => x);
  const plate = popScale(f, fs(WORD.thousand) - 5) * off, gnd = popScale(f, T.wideA + 6) * (1 - ramp(f, T.trackA - 8, T.trackA - 2, (x) => x));
  const worldT = `translate(540 ${GSY}) scale(${z}) translate(${-CAMX2} ${-GYW})`;
  const inView = (x: number) => x < 2500;
  const trail = (n: keyof typeof st, len: number) => { const b = st[n], p = S(b); return f > BODIES[n].t0 && p.x < 1250 ? <Trail key={n} x={p.x} y={p.y} vx={b.vx * z} vy={b.vy * z} len={len} /> : null; };
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translate(${sh.dx}px, ${sh.dy}px)`}}>
      <Street2 camX={CAMX2} z={z} blur={0} pad={420} lamps={false} palms={false} skyTint={0.45 * wind}>
        {[1010, 1850, 2690].map((x, i) => <PalmWind key={x} x={x} baseY={1220} h={600} k={0.04 + 0.2 * wind} f={f} seed={i * 2.3} shake={x === 1010 && f >= chairHitF ? 8 * Math.exp(-(f - chairHitF) / 9) * Math.sin((f - chairHitF) * 1.1) : 0} />)}
        {[560, LAMP_X2, 2240].map((x) => <Lamp3 key={x} x={x} wob={x === LAMP_X2 ? wob : 0} />)}
        {puffs.map((p, i) => <Puff key={i} x={p.x - 20} y={GYW - 14} age={f - p.t} seed={p.k * 11 + i} />)}
      </Street2>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={worldT}>
          {SHEETS.map((q, i) => {
            const t = f - q.t0; if (t < 0) return null;
            const x = q.x0 + q.vx * t, y = q.y0 + q.vy * t + 40 * Math.sin(t * 0.22 + q.ph);
            return inView(x) ? <DrawSheet key={i} x={x} y={y} rot={t * 19 + q.ph * 40} s={q.s} kind={q.kind} k={t} /> : null;
          })}
          {f > BODIES.mug.t0 && inView(st.mug.x) && <DrawMug x={st.mug.x} y={st.mug.y} rot={st.mug.rot} s={1.4} />}
          {drops.map((d, i) => { const q = simBody(d, f); return f > d.t0 && inView(q.x) ? <ellipse key={i} cx={q.x} cy={q.y} rx={8 + (i % 4) * 2.4} ry={5.5 + (i % 3) * 2} fill="#33200F" /> : null; })}
          {f > BODIES.bike.t0 && inView(st.bike.x) && <DrawBike x={st.bike.x} y={st.bike.y} rot={st.bike.rot} ang={bikeAng} />}
          {f > BODIES.chairA.t0 && inView(st.chairA.x) && <DrawChair x={st.chairA.x} y={st.chairA.y} rot={st.chairA.rot} s={1.3} />}
          {f > BODIES.boxA.t0 && inView(st.boxA.x) && <DrawBox x={st.boxA.x} y={st.boxA.y} rot={st.boxA.rot} s={1.5} />}
          {f > BODIES.boxB.t0 && inView(st.boxB.x) && <DrawBox x={st.boxB.x} y={st.boxB.y} rot={st.boxB.rot} s={1.6} />}
          {f > BODIES.chairB.t0 && inView(st.chairB.x) && <DrawChair x={st.chairB.x} y={st.chairB.y} rot={st.chairB.rot} s={1.3} />}
          {f > BODIES.potA.t0 && inView(st.potA.x) && <DrawPot x={st.potA.x} y={st.potA.y} rot={st.potA.rot} s={1.5} />}
        </g>
        {trail('bike', 2.4)}{trail('boxA', 2.2)}{trail('boxB', 2.2)}{trail('chairB', 2.0)}{trail('potA', 2.2)}{trail('chairA', 2.0)}
        {Array.from({length: 8}).map((_, i) => {
          if (wind < 0.02) return null;
          const y = 200 + rand(i + 60) * 1300, len = 200 + rand(i + 61) * 300, v = 90 + rand(i + 62) * 80, x = ((rand(i + 63) * (W + 800) + (f - 100) * v) % (W + 800)) - 400;
          return <line key={i} x1={x - len} y1={y} x2={x} y2={y} stroke={C.cream} strokeWidth={5 + 4 * rand(i)} strokeLinecap="round" opacity={0.5 * wind} />;
        })}
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.ink} opacity={0.06 * wind} />
      </svg>
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Leader from={{x: 300, y: 1262}} to={{x: 430, y: 1450}} opacity={gnd > 0.4 ? 1 : 0} />
          <Chip x={300} y={1226} w={330} text="GROUND 0 MPH" tone="still" scale={gnd} />
          <EqPlate x={690} y={730} scale={plate} />
        </svg>
      )}
    </div>
  );
};
import {HED_FONT} from '../fonts4';


/* ================================================================== P3: the wind (f182-266). The camera follows the debris east; palms flex flat, flags stream; ONE sharp physical consequence amid the motion: a stall canopy
   strains at its poles, tears loose from the right, tears free and is flung at the lens; the cut to the coast hides behind it. Brief acceleration blur, then a controlled tracking view. */
export const camV = (f: number) => (f < T.trackA ? 0 : 30 * sm((f - T.trackA) / 14) + (f > 244 ? 38 * sm((f - 244) / 20) : 0));
const camTab: number[] = (() => { const a = [CAMX2]; for (let t = T.trackA; t < 400; t++) a.push(a[a.length - 1] + camV(t + 0.5)); return a; })();
export const camX3 = (f: number) => (f <= T.trackA ? CAMX2 : camTab[Math.min(camTab.length - 1, Math.round(f) - T.trackA)] ?? camTab[camTab.length - 1]);
const Z3 = 1.08;
export const windK3 = (f: number) => 0.24 + 0.76 * sm((f - T.trackA) / 40);
const FlagW: React.FC<{x: number; k: number; f: number}> = ({x, k, f}) => {
  const len = 110 + 120 * k, top = 700;
  const pts = Array.from({length: 9}).map((_, i) => { const u = i / 8; return {x: x + 8 + u * len, y: top + 90 * (1 - k) * u * u + Math.sin(f * 0.75 - u * 6) * (4 + 20 * k) * u}; });
  const up = pts.map((p) => `${p.x},${p.y}`).join(' L '), dn = [...pts].reverse().map((p) => `${p.x},${p.y + 70}`).join(' L ');
  return (
    <g>
      <rect x={x - 5} y={top - 14} width={10} height={1235 - top + 14} fill={C.ink} />
      <path d={`M ${up} L ${dn} Z`} fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M ${pts[2].x} ${pts[2].y} L ${pts[2].x} ${pts[2].y + 70} L ${pts[4].x} ${pts[4].y + 70} L ${pts[4].x} ${pts[4].y} Z`} fill={C.cream} opacity={0.9} />
    </g>
  );
};
const FgPost: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 38} y={-60} width={76} height={1760} fill={C.ink} />
    <rect x={x - 28} y={-60} width={9} height={1760} fill={C.inkSoft} />
    <rect x={x - 62} y={1620} width={124} height={70} rx={10} fill={C.ink} />
    <rect x={x - 54} y={1180} width={108} height={22} fill={C.saffron} />
    <rect x={x - 54} y={1230} width={108} height={22} fill={C.saffron} />
  </g>
);
/** one foreground post crosses the middle of the frame before the canopy is on screen (f ~ 201) */
export const POSTS3 = [camX3(201)];
const SHEETS3 = Array.from({length: 14}).map((_, i) => ({t0: 176 + i * 6, dx: -900 + rand(i + 1) * 900, y: 640 + rand(i + 2) * 420 + (i % 4) * 90, v: 84 + rand(i + 3) * 50, ph: rand(i + 4) * 6, kind: i % 3, s: 1.0 + rand(i + 5) * 0.7}));

/** the one foreground post (f ~ 201): its own layer so the second person (a middle-ground figure) passes behind it and in front of the shop awning */
export const P3Post: React.FC<{f: number}> = ({f}) => {
  const cx = camX3(f), z = Z3;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {POSTS3.map((xw) => { const sx = 540 + (xw - cx) * z * 1.9; return sx > -140 && sx < W + 140 ? <FgPost key={xw} x={sx} /> : null; })}
    </svg>
  );
};
export const P3: React.FC<{f: number; graphics: boolean}> = ({f}) => {
  const cx = camX3(f), z = Z3, k = windK3(f);
  const v = camV(f) * z;
  const acc = camV(f + 1) - camV(f - 1);
  const blur = 1.5 + Math.min(9, acc * 5.5);       // brief acceleration blur only: the view settles into a sharp tracking shot
  const palms = [1010, 1850, 3530, 4370, 5210], lamps = [560, 1400, 3080, 3920, 4760], flags = [2050, 3350, 4200, 4900];
  const worldT = `translate(540 ${GSY}) scale(${z}) translate(${-cx} ${-GYW})`;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={blur} pad={420} lamps={false} palms={false} skyTint={0.45 + 0.4 * (k - 0.24) / 0.76}>
        {lamps.map((x) => <Lamp3 key={x} x={x} wob={1.6 * k * Math.sin(f * 0.5 + x)} />)}
        {flags.map((x) => <FlagW key={x} x={x} k={k} f={f} />)}
        {palms.map((x, i) => <PalmWind key={x} x={x} baseY={1220} h={600} k={k} f={f} seed={i * 2.3} />)}
      </Street2>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={worldT}>
          {SHEETS3.map((q, i) => {
            const tt = f - q.t0; if (tt < 0) return null;
            const x = cx + q.dx + q.v * tt * 0.6, y = q.y + 50 * Math.sin(tt * 0.2 + q.ph);
            return <DrawSheet key={i} x={x} y={y} rot={tt * 21 + q.ph * 50} s={q.s} kind={q.kind} k={tt} />;
          })}
        </g>
        {Array.from({length: 9}).map((_, i) => {
          const y = 160 + rand(i + 90) * 1500, len = 260 + rand(i + 91) * 380, vv = 130 + rand(i + 92) * 120, x = ((rand(i + 93) * (W + 900) + (f - 150) * vv) % (W + 900)) - 450;
          return <line key={i} x1={x - len} y1={y} x2={x} y2={y} stroke={C.cream} strokeWidth={5 + 5 * rand(i)} strokeLinecap="round" opacity={0.5 * k} />;
        })}
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.ink} opacity={0.07 + 0.05 * k} />
      </svg>
      {void v}
    </div>
  );
};

/* ------------------------------------------------------------------ the canopy: world-fixed until it tears free, then flung at the lens (screen space) and swept off to the right to reveal the coast */
const AW = {w: 560, h: 300, top: 790, stripes: 10};
export const AWN_X = camX3(T.awnTear) + 70;
const awnToScreen = (x: number, y: number, f: number) => ({x: 540 + (x - camX3(f)) * Z3, y: GSY + (y - GYW) * Z3});
/** deformation of the fabric at (u, v) in [0,1]^2 (u left to right, v top to bottom): strain, billow, tear front moving right to left, flutter */
const awnDef = (u: number, v: number, f: number) => {
  const bil = sm((f - T.awnStrain) / (T.awnTear - T.awnStrain)), tk = sm((f - T.awnTear) / 12);
  const rip = 1 - 1.15 * sm((f - T.awnTear) / (T.awnFree - T.awnTear));
  const fr = cl((u - rip) / 0.18);
  const flut = Math.sin(f * 0.78 - u * 6.5), amp = 5 + 26 * bil + 46 * tk;
  const dx = 46 * bil * u * u + fr * 190 * tk + fr * 24 * flut;
  const dy = -(40 * bil * u * u + fr * 130 * tk) + flut * amp * u * (fr + (1 - fr) * v);
  return {dx, dy, rip, fr};
};
const AwningDraw: React.FC<{f: number}> = ({f}) => {
  const S = AW.stripes, cols = [C.teal, C.cream];
  const pt = (u: number, v: number, scal = 0) => { const d = awnDef(u, v, f), sc = v >= 1 ? scal : 0; return {x: (u - 0.5) * AW.w + d.dx, y: v * AW.h + d.dy + sc}; };
  const {rip} = awnDef(0.5, 0.5, f);
  const strips = Array.from({length: S}).map((_, k) => {
    const u0 = k / S, u1 = (k + 1) / S, um = (u0 + u1) / 2;
    const top = [0, 1, 2].map((i) => pt(u0 + (u1 - u0) * i / 2, 0)), bot = [2, 1, 0].map((i) => { const uu = u0 + (u1 - u0) * i / 2; return pt(uu, 1, 14 * Math.abs(Math.sin(Math.PI * (uu * S)))); });
    const d = `M ${[...top, ...bot].map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;
    return <path key={k} d={d} fill={cols[k % 2]} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" data-um={um} />;
  });
  // the mount rail along the attached part of the top edge, and its torn, ragged end
  const attached = Array.from({length: 11}).map((_, i) => i / 10).filter((u) => u <= Math.min(1, rip));
  const railPts = attached.map((u) => pt(u, 0));
  return (
    <g>
      {strips}
      {railPts.length > 1 && <path d={`M ${railPts.map((p) => `${p.x.toFixed(1)} ${(p.y - 3).toFixed(1)}`).join(' L ')}`} fill="none" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />}
      {f > T.awnTear && f < T.awnFree + 4 && rip > -0.1 && rip < 1 && (() => { const a = pt(Math.max(0, rip), 0); return <g fill={C.cream} stroke={C.ink} strokeWidth={4}>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${a.x - 10} ${a.y + i * 14} l ${14 + (i % 2) * 14} 7 l -${10 + (i % 3) * 6} 7 z`} />)}</g>; })()}
    </g>
  );
};
const AwningPoles: React.FC<{f: number}> = ({f}) => {
  const gy = 1235 - AW.top, bil = sm((f - T.awnStrain) / (T.awnTear - T.awnStrain));
  const L = -AW.w / 2 + 14, R = AW.w / 2 - 14;
  const lean = 22 * bil;                                 // the right pole is dragged east
  const rp = (y: number) => ({x: R + lean * (1 - y / gy) * 1.2, y});
  const broke = f >= T.awnTear + 2, tb = Math.max(0, f - T.awnTear - 2);
  const top = rp(AW.h), mid = rp(gy * 0.62);
  return (
    <g>
      <rect x={L - 8} y={AW.h - 6} width={16} height={gy - AW.h + 10} fill={C.ink} />
      {!broke && <path d={`M ${top.x} ${top.y} L ${R} ${gy}`} stroke={C.ink} strokeWidth={16} strokeLinecap="round" />}
      {broke && <g>
        <path d={`M ${mid.x} ${mid.y} L ${R} ${gy}`} stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
        <g transform={`translate(${tb * 52} ${-tb * 26 + 2.4 * tb * tb}) rotate(${tb * 34} ${mid.x} ${mid.y})`}><path d={`M ${top.x} ${top.y} L ${mid.x} ${mid.y}`} stroke={C.ink} strokeWidth={16} strokeLinecap="round" /></g>
      </g>}
    </g>
  );
};
/** screen-space flight of the freed canopy: it comes at the lens (grows to cover the frame) and is then swept off to the right */
export const COVER = {a: T.awnFree, b: T.awnFree + 9, sweepA: T.awnFree + 10, sweepB: T.awnFree + 18, sMax: 7.2, tiltMax: -5};
export const awnCover = (f: number) => {
  const p = cl((f - COVER.a) / (COVER.b - COVER.a)), e = E.in(p);
  return {s: Z3 + (COVER.sMax - Z3) * e, tilt: COVER.tiltMax * E.inOut(p), sweep: f < COVER.sweepA ? 0 : 2900 * E.in(cl((f - COVER.sweepA) / (COVER.sweepB - COVER.sweepA))), p};
};
export const AwningLayer: React.FC<{f: number}> = ({f}) => {
  if (f < T.awnStrain - 2 || f > COVER.sweepB + 2) return null;
  const c0 = awnToScreen(AWN_X, AW.top + AW.h * 0.5, COVER.a);
  const world = f < COVER.a;
  let tr: string;
  if (world) {
    const o = awnToScreen(AWN_X, AW.top, f);
    tr = `translate(${o.x} ${o.y}) scale(${Z3})`;
  } else {
    const c = awnCover(f), q = E.inOut(c.p);
    const px = c0.x + (540 - c0.x) * q + c.sweep, py = c0.y + (900 - c0.y) * q;
    tr = `translate(${px} ${py}) rotate(${c.tilt}) scale(${c.s}) translate(0 ${-AW.h / 2})`;
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={tr}>
        {world && <AwningPoles f={f} />}
        <AwningDraw f={f} />
      </g>
    </svg>
  );
};
