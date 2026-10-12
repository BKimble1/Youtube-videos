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
import {T, WORD, fs} from './timeline3';
import {BIKE_R as BR, BIKE_Y as BY} from '../v2/choreo2';
import {Body, DrawBike, DrawBin, DrawBox, DrawChair, DrawMug, DrawPot, DrawSheet, FgLamp, Lamp3, PalmWind, ScarfFly, Stream3, Trail, rotCW, simBody} from './Street3';

/* ================================================================== P1: carried east, the lamp post looms (f20-35), a 5-frame suspended beat (f31-35) */
const Z1 = 1.18, HERO_X = 330;
const U_HOLD = T.holdA - T.cutStreet; // 11
/** the time warp of the suspended beat: the picture slows to 12 % for the five frames before the cut (an intentional hold, not a freeze) */
const warp = (f: number) => (f <= T.holdA ? f : T.holdA + 0.12 * (f - T.holdA));
const camP1 = (f: number) => 900 + 38 * (warp(f) - T.cutStreet);
const zoomP1 = (f: number) => lerp(Z1, 1.24, E.inOut(cl((f - T.holdA) / (T.holdB - T.holdA))));

export const poseP1 = (fr: number): SidePose => {
  const u = Math.max(0, Math.min(U_HOLD, warp(fr) - T.cutStreet)), k = sm(u / 9), fl = Math.sin(u * 0.9);
  return {
    lean: lerp(44, 58, k), head: lerp(4, 8, k),
    armN: {s: lerp(58, 74, k) + 3 * fl, e: lerp(36, 46, k)},
    armF: {s: lerp(132, 152, k) + 2 * fl, e: 6},
    legN: {h: lerp(-30, -52, k), k: lerp(30, 56, k) + 4 * fl, f: -24},
    legF: {h: lerp(-58, -70, k), k: lerp(44, 66, k) - 4 * fl, f: -34},
    mouth: 'o', brows: 1, lookX: 1, lookY: 0.55,
  };
};
const liftP1 = (fr: number) => 78 * sm((warp(fr) - T.cutStreet - 1) / 6);
const hipP1 = (fr: number, z: number) => {
  const sc = SC * z, p = poseP1(fr), fk = sideFK(p, {x: HERO_X, y: 0}, sc);
  return {x: HERO_X, y: GSY - fk.lowest - liftP1(fr) * z};
};
const MUG_TILT = 102;
const mouthP1 = (z: number) => (fb: number) => {
  const sc = SC * z, p = poseP1(Math.max(fb, T.cutStreet)), hip = hipP1(Math.max(fb, T.cutStreet), z), fk = sideFK(p, hip, sc);
  const o = rotCW(MUG.cx, MUG.mouthY, MUG_TILT), d = rotCW(0, -1, MUG_TILT);
  return {x: fk.Wn.x + o.x * sc, y: fk.Wn.y + o.y * sc, dx: d.x, dy: d.y};
};
const poleX = (fr: number) => lerp(1330, 930, E.inOut(cl((warp(fr) - T.cutStreet) / U_HOLD))) + (fr > T.holdA ? 4 * (fr - T.holdA) : 0);

export const P1: React.FC<{f: number}> = ({f}) => {
  const z = zoomP1(f), cx = camP1(f), sc = SC * z;
  const pose = poseP1(f), hip = hipP1(f, z), fk = sideFK(pose, hip, sc);
  const u = warp(f) - T.cutStreet;
  const heroWX = cx + (HERO_X - 540) / z;
  const blur = Math.min(15, Math.max(0, (38 * z * (f <= T.holdA ? 1 : 0.12)) * 0.32));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={blur} pad={420}>
        <HeroShadow x={heroWX + 10} lift={liftP1(f)} />
        {[0, 2, 4, 6].map((e) => <Puff key={e} x={camP1(T.cutStreet + e) + (HERO_X - 540) / z - 70} y={GYW - 16} age={u - e} seed={e * 9 + 3} />)}
      </Street2>
      <CharacterSide pose={pose} hip={hip} sc={sc} scarfWrap scarf={<ScarfFly n={fk.N} z={z} f={warp(f) * 1.0} />} holdN={<MugSide tilt={MUG_TILT} sc={sc} />} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Stream3 f={warp(f)} f0={T.cutStreet - 8} mouth={mouthP1(z)} speed={9} g={1.0} scale={z} />
        <FgLamp x={poleX(f)} w={44} />
      </svg>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><radialGradient id="p1vig" cx="50%" cy="58%" r="70%"><stop offset="0.55" stopColor={C.ink} stopOpacity={0} /><stop offset="1" stopColor={C.ink} stopOpacity={0.5} /></radialGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#p1vig)" opacity={ramp(f, T.holdA - 3, T.holdA + 2, (x) => x)} />
      </svg>
    </div>
  );
};


/* ================================================================== P2: the street stands still; everything that is loose goes east past it (f36-150) */
const CAMX2 = 1250;
const zoom2 = (f: number) => lerp(1.0, 1.1, cl((f - T.wideA) / (T.trackA - T.wideA)));
const toS2 = (x: number, y: number, z: number) => ({x: 540 + (x - CAMX2) * z, y: GSY + (y - GYW) * z});
const LAMP_X2 = 1400, PALM_X2 = 1010;
const BODIES = {
  mug: {x0: 380, y0: 1010, vx: 66, vy: -4, spin: 26, g: 1.5, floor: GYW - 34, e: 0.45, fr: 0.86, t0: 36} as Body,
  bike: {x0: 440, y0: BY - BR, vx: 54, vy: 0, spin: 0, g: 1.0, floor: BY - BR, e: 0.3, fr: 0.93, roll: 0.998, t0: 44, hits: [{x: 1212, vxK: 0.5, vy: -19, spin: 17}]} as Body,
  chairA: {x0: 400, y0: 800, vx: 60, vy: 0, spin: -16, g: 1.1, floor: GYW - 86, e: 0.42, fr: 0.88, t0: 56, hits: [{x: 985, vxK: -0.2, vy: -14, spin: 24}]} as Body,
  boxA: {x0: 420, y0: 880, vx: 66, vy: -6, spin: 18, g: 1.3, floor: GYW - 52, e: 0.5, fr: 0.88, t0: 68} as Body,
  boxB: {x0: 400, y0: 820, vx: 70, vy: -11, spin: -20, g: 1.3, floor: GYW - 78, e: 0.5, fr: 0.9, t0: 82} as Body,
  bin: {x0: 180, y0: 1468, vx: 72, vy: 0, spin: 0, g: 1.0, floor: 1468, e: 0.2, fr: 0.98, roll: 0.999, t0: 92, rollR: 92} as Body,
  chairB: {x0: 420, y0: 740, vx: 68, vy: 2, spin: 15, g: 1.1, floor: GYW - 86, e: 0.4, fr: 0.9, t0: 104} as Body,
  potA: {x0: 400, y0: 900, vx: 72, vy: -8, spin: 14, g: 1.3, floor: GYW - 52, e: 0.45, fr: 0.9, t0: 112} as Body,
  boxC: {x0: 430, y0: 760, vx: 74, vy: -2, spin: -22, g: 1.3, floor: GYW - 60, e: 0.5, fr: 0.9, t0: 122} as Body,
  chairC: {x0: 400, y0: 880, vx: 70, vy: -9, spin: 18, g: 1.1, floor: GYW - 86, e: 0.4, fr: 0.9, t0: 132} as Body,
  boxD: {x0: 420, y0: 700, vx: 78, vy: 3, spin: 20, g: 1.3, floor: GYW - 64, e: 0.5, fr: 0.9, t0: 140} as Body,
};
export const bikeHitF = simBody(BODIES.bike, 130).hitT[0] ?? 70;
export const chairHitF = simBody(BODIES.chairA, 130).hitT[0] ?? 80;
const shake2 = (f: number) => {
  let dx = 0, dy = 0;
  for (const [t, a] of [[bikeHitF, 8], [chairHitF, 6]] as [number, number][]) if (f >= t && f < t + 12) { const k = Math.exp(-(f - t) * 0.38); dx += a * k * Math.sin((f - t) * 2.2); dy += a * 0.7 * k * Math.cos((f - t) * 2.6); }
  return {dx, dy};
};
const SHEETS = Array.from({length: 34}).map((_, i) => ({t0: 38 + i * 3.3, x0: 150 + rand(i + 1) * 420, y0: 760 + rand(i + 2) * 600, vx: 56 + rand(i + 3) * 36, vy: -3 + rand(i + 4) * 5, ph: rand(i + 5) * 6, kind: i % 3, s: 1.0 + rand(i + 6) * 0.9}));

export const P2: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const z = zoom2(f), sh = shake2(f);
  const st = {mug: simBody(BODIES.mug, f), bike: simBody(BODIES.bike, f), chairA: simBody(BODIES.chairA, f), boxA: simBody(BODIES.boxA, f), boxB: simBody(BODIES.boxB, f), bin: simBody(BODIES.bin, f), chairB: simBody(BODIES.chairB, f), potA: simBody(BODIES.potA, f), boxC: simBody(BODIES.boxC, f), chairC: simBody(BODIES.chairC, f), boxD: simBody(BODIES.boxD, f)};
  const wob = f >= bikeHitF ? 3.6 * Math.exp(-(f - bikeHitF) / 8) * Math.sin((f - bikeHitF) * 0.9) : 0;
  const puffs: {x: number; t: number; k: number}[] = [];
  (['mug', 'chairA', 'boxA', 'boxB', 'chairB', 'potA', 'boxC', 'chairC', 'boxD'] as const).forEach((n, k) => st[n].events.filter((e) => e.kind === 'floor').forEach((e) => puffs.push({x: e.x, t: e.t, k: k + 1})));
  const drops = Array.from({length: 14}).map((_, i) => ({t0: BODIES.mug.t0 + i * 0.7, x0: 380 + i * 18, y0: 1010 + (rand(i + 20) - 0.5) * 60, vx: 54 + rand(i + 21) * 24, vy: -9 + rand(i + 22) * 8, spin: 0, g: 1.5, floor: GYW - 4, e: 0.3, fr: 0.8} as Body));
  const wind = ramp(f, 100, 150, (x) => x);
  const bikeAng = ((st.bike.x - BODIES.bike.x0) / BR) * (180 / Math.PI);
  const S = (p: {x: number; y: number}) => toS2(p.x, p.y, z);
  const off = 1 - ramp(f, T.trackA - 8, T.trackA - 2, (x) => x);
  const plate = popScale(f, fs(WORD.thousand) - 4) * off, eq = popScale(f, fs(WORD.equator) - 3) * off, gnd = popScale(f, T.wideA + 6) * off;
  const worldT = `translate(540 ${GSY}) scale(${z}) translate(${-CAMX2} ${-GYW})`;
  const inView = (x: number) => x < 2500;
  const trail = (n: keyof typeof st, len: number) => { const b = st[n], p = S(b); return f > (BODIES as any)[n].t0 && p.x < 1250 ? <Trail key={n} x={p.x} y={p.y} vx={b.vx * z} vy={b.vy * z} len={len} /> : null; };
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translate(${sh.dx}px, ${sh.dy}px)`}}>
      <Street2 camX={CAMX2} z={z} blur={0} pad={420} lamps={false} palms={false} skyTint={0.45 * wind}>
        {[1010, 1850, 2690].map((x, i) => <PalmWind key={x} x={x} baseY={1220} h={600} k={0.04 + 0.16 * wind} f={f} seed={i * 2.3} shake={x === 1010 && f >= chairHitF ? 7 * Math.exp(-(f - chairHitF) / 9) * Math.sin((f - chairHitF) * 1.1) : 0} />)}
        {[560, LAMP_X2, 2240].map((x) => <Lamp3 key={x} x={x} wob={x === LAMP_X2 ? wob : 0} />)}
        {puffs.map((p, i) => <Puff key={i} x={p.x - 20} y={GYW - 14} age={f - p.t} seed={p.k * 11 + i} />)}
      </Street2>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={worldT}>
          {SHEETS.map((q, i) => {
            const t = f - q.t0; if (t < 0) return null;
            const x = q.x0 + q.vx * t, y = q.y0 + q.vy * t + 46 * Math.sin(t * 0.22 + q.ph);
            return inView(x) ? <DrawSheet key={i} x={x} y={y} rot={t * 19 + q.ph * 40} s={q.s} kind={q.kind} k={t} /> : null;
          })}
          {f > BODIES.mug.t0 && inView(st.mug.x) && <DrawMug x={st.mug.x} y={st.mug.y} rot={st.mug.rot} s={1.4} />}
          {drops.map((d, i) => { const q = simBody(d, f); return f > d.t0 && inView(q.x) ? <ellipse key={i} cx={q.x} cy={q.y} rx={8 + (i % 4) * 2.4} ry={5.5 + (i % 3) * 2} fill="#33200F" /> : null; })}
          {f > BODIES.bike.t0 && inView(st.bike.x) && <DrawBike x={st.bike.x} y={st.bike.y} rot={st.bike.rot} ang={bikeAng} />}
          {f > BODIES.chairA.t0 && <DrawChair x={st.chairA.x} y={st.chairA.y} rot={st.chairA.rot} s={1.3} />}
          {f > BODIES.boxA.t0 && inView(st.boxA.x) && <DrawBox x={st.boxA.x} y={st.boxA.y} rot={st.boxA.rot} s={1.4} />}
          {f > BODIES.boxB.t0 && inView(st.boxB.x) && <DrawBox x={st.boxB.x} y={st.boxB.y} rot={st.boxB.rot} s={1.75} />}
          {f > BODIES.chairB.t0 && inView(st.chairB.x) && <DrawChair x={st.chairB.x} y={st.chairB.y} rot={st.chairB.rot} s={1.3} />}
          {f > BODIES.potA.t0 && inView(st.potA.x) && <DrawPot x={st.potA.x} y={st.potA.y} rot={st.potA.rot} s={1.5} />}
          {f > BODIES.boxC.t0 && inView(st.boxC.x) && <DrawBox x={st.boxC.x} y={st.boxC.y} rot={st.boxC.rot} s={1.5} />}
          {f > BODIES.chairC.t0 && inView(st.chairC.x) && <DrawChair x={st.chairC.x} y={st.chairC.y} rot={st.chairC.rot} s={1.35} />}
          {f > BODIES.boxD.t0 && inView(st.boxD.x) && <DrawBox x={st.boxD.x} y={st.boxD.y} rot={st.boxD.rot} s={1.9} />}
        </g>
        {trail('bike', 2.4)}{trail('boxA', 2.2)}{trail('boxB', 2.2)}{trail('chairB', 2.0)}{trail('potA', 2.2)}{trail('boxC', 2.2)}{trail('chairC', 2.0)}{trail('boxD', 2.2)}
        {Array.from({length: 16}).map((_, i) => {
          if (wind < 0.02) return null;
          const y = 200 + rand(i + 60) * 1300, len = 200 + rand(i + 61) * 300, v = 90 + rand(i + 62) * 80, x = ((rand(i + 63) * (W + 800) + (f - 100) * v) % (W + 800)) - 400;
          return <line key={i} x1={x - len} y1={y} x2={x} y2={y} stroke={C.cream} strokeWidth={5 + 4 * rand(i)} strokeLinecap="round" opacity={0.55 * wind} />;
        })}
        {f > BODIES.bin.t0 && S(st.bin).x < 1400 && (
          <g>
            <g transform={worldT}><DrawBin x={st.bin.x} y={st.bin.y} rot={((st.bin.x - BODIES.bin.x0) / 92) * 57.3} s={1.7} /></g>
            <Trail x={S(st.bin).x} y={S(st.bin).y} vx={st.bin.vx * z} vy={0} len={2.6} />
          </g>
        )}
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.ink} opacity={0.06 * wind} />
      </svg>
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Leader from={{x: 300, y: 1262}} to={{x: 430, y: 1450}} opacity={gnd > 0.4 ? 1 : 0} />
          <Chip x={300} y={1226} w={330} text="GROUND 0 MPH" tone="still" scale={gnd} />
          <Chip x={540} y={650} w={250} text="EQUATOR" tone="still" scale={eq} />
          <SpeedPlate x={540} y={800} scale={plate} />
        </svg>
      )}
    </div>
  );
};
import {SpeedPlate} from '../film2/ui';


/* ================================================================== P3: the wind. The camera follows the debris east (f150-238); a torn awning crosses the lens and the cut to the coast hides behind it */
const camV = (f: number) => 64 * sm((f - 146) / 42);
const camX3 = (f: number) => { let x = CAMX2; for (let t = T.trackA; t < f; t++) x += camV(t + 0.5); return x; };
const Z3 = 1.1;
const windK3 = (f: number) => 0.2 + 0.8 * sm((f - 148) / 38);
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
const POSTS3 = [1850, 2620, 3380, 4130];
const SHEETS3 = Array.from({length: 70}).map((_, i) => ({t0: 148 + i * 1.2, dx: -1100 + rand(i + 1) * 1300, y: 640 + rand(i + 2) * 960, v: 84 + rand(i + 3) * 60, ph: rand(i + 4) * 6, kind: i % 3, s: 1.1 + rand(i + 5) * 1.0}));

export const P3: React.FC<{f: number; graphics: boolean}> = ({f}) => {
  const cx = camX3(f), z = Z3, k = windK3(f), t = f - T.trackA;
  const v = camV(f) * z;
  const blur = Math.min(18, v * 0.3);
  const worldT = `translate(540 ${GSY}) scale(${z}) translate(${-cx} ${-GYW})`;
  // the focal box: bounces along beside the camera
  const bx = cx + lerp(-420, 140, sm(t / 36)), arcT = (t + 4) % 15, by = GYW - 70 - 210 * (1 - Math.pow(arcT / 7.5 - 1, 2)) * (t > 4 ? 1 : 0.4);
  const palms = [1010, 1850, 2690, 3530, 4370, 5210], lamps = [560, 1400, 2240, 3080, 3920, 4760], flags = [2050, 2950, 3800, 4650];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Street2 camX={cx} z={z} blur={blur} pad={420} lamps={false} palms={false} skyTint={0.45 + 0.4 * k}>
        {lamps.map((x) => <Lamp3 key={x} x={x} wob={1.6 * k * Math.sin(f * 0.5 + x)} />)}
        {flags.map((x) => <FlagW key={x} x={x} k={k} f={f} />)}
        {palms.map((x, i) => <PalmWind key={x} x={x} baseY={1220} h={600} k={k} f={f} seed={i * 2.3} />)}
        {SHEETS3.map((q, i) => {
          const tt = f - q.t0; if (tt < 0) return null;
          const x = cx + q.dx + q.v * tt * 0.6, y = q.y + 50 * Math.sin(tt * 0.2 + q.ph);
          return <DrawSheet key={i} x={x} y={y} rot={tt * 21 + q.ph * 50} s={q.s} kind={q.kind} k={tt} />;
        })}
        <DrawBox x={bx} y={by} rot={t * 20} s={1.9} />
      </Street2>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Trail x={540 + (bx - cx) * z} y={GSY + (by - GYW) * z} vx={v * 0.9} vy={0} len={2.4} />
        {Array.from({length: 22}).map((_, i) => {
          const y = 160 + rand(i + 90) * 1500, len = 260 + rand(i + 91) * 380, vv = 130 + rand(i + 92) * 120, x = ((rand(i + 93) * (W + 900) + (f - 150) * vv) % (W + 900)) - 450;
          return <line key={i} x1={x - len} y1={y} x2={x} y2={y} stroke={C.cream} strokeWidth={5 + 5 * rand(i)} strokeLinecap="round" opacity={0.6 * k} />;
        })}
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.ink} opacity={0.08 + 0.05 * k} />
        {POSTS3.map((xw) => { const sx = 540 + (xw - cx) * z * 1.9; return sx > -140 && sx < W + 140 ? <FgPost key={xw} x={sx} /> : null; })}
      </svg>
    </div>
  );
};

/** the torn awning that crosses the lens (f224-242): stripes, a scalloped bottom, ink outline. Returns the x of its left and right edges so the scene cut can hide behind it. */
export const tarpEdges = (f: number) => { const a = ramp(f, T.occA, T.occB + 4, (x) => x * x * (3 - 2 * x)); const L = lerp(-1500, 1160, a); return {L, R: L + 1400}; };
export const Tarp: React.FC<{f: number}> = ({f}) => {
  const {L, R} = tarpEdges(f);
  if (f < T.occA - 1 || f > T.occB + 6) return null;
  const n = 14, wv = (y: number, side: number) => 26 * Math.sin(y / 120 + f * 0.6 + side) + 14 * Math.sin(y / 47 + f * 0.9);
  const left = Array.from({length: 22}).map((_, i) => ({x: L + wv(i * 100, 0), y: i * 100 - 50})), right = Array.from({length: 22}).map((_, i) => ({x: R + wv(i * 100, 2), y: i * 100 - 50}));
  const poly = `M ${left.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${[...right].reverse().map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
  const cols = [C.teal, C.cream];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs><clipPath id="tarpClip"><path d={poly} /></clipPath></defs>
      <path d={poly} fill={C.cream} />
      <g clipPath="url(#tarpClip)">
        {Array.from({length: n}).map((_, i) => <rect key={i} x={L - 40 + i * ((R - L + 80) / n)} y={-60} width={(R - L + 80) / n + 1} height={H + 120} fill={cols[i % 2]} transform={`skewX(${-6 + 3 * Math.sin(f * 0.4)})`} />)}
        {Array.from({length: 6}).map((_, i) => <path key={i} d={`M ${L} ${200 + i * 320} Q ${(L + R) / 2} ${150 + i * 320 + 80 * Math.sin(f * 0.5 + i)} ${R} ${200 + i * 320}`} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.18} />)}
      </g>
      <path d={poly} fill="none" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    </svg>
  );
};
