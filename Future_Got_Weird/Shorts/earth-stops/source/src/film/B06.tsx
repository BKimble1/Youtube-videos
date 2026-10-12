import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {GlobeH} from '../v2/GlobeH';
import {CharacterSide, SidePose, sideFK} from '../v2/side';
import {MugSide} from '../v2/props';
import {SceneH} from '../v2/SceneH';
import {blendPose} from '../v2/choreoEC';
import {GSY, SC} from '../v2/choreo2';
import {GLOBE_FULL, INSET, heroFor, toScreenFor, zoomFor} from '../v2/choreoH';
import {ArrowShape, CALM, Chip, ScarfHang, WALKP, cl, lerp, popScale, ramp, sm} from './ui';
import {BIG, spinFor} from './globe';
import {N_FILM, T, WORD, fs} from './timeline';
import {filmTh} from './globe';

/**
 * B06: the payoff. "None of this can really happen." (the globe is still, WHAT IF leaves) - "But the motion is real." (the globe turns, she rides it east) -
 * "At the equator," (dive into her) - "her coffee's been moving about a thousand miles an hour all along." (close-up: the world behind her streaks past, she and the mug are calm)
 * - "It just never spilled." (she sips; nothing spills; pull back to the street, which loops straight back into frame 0 of the hook).
 */
export const B6 = {
  a0: 739,
  spin0: 776, spin1: 800, spinEnd: 851,
  tagOff0: 776, tagOff1: 792,
  heroPop: 788,
  speedChip: fs(WORD.motion - 0.1),
  eqChip: fs(WORD.at2 + 0.05),
  zoomA: 860, zoomB: 884,
  streak0: 888, streakPeak: 924, streak1: 982, streakOff: 998,
  sip0: 988, sipUp: 1000, sipDown: 1008, sipEnd: 1016,
  outA: 1004, outB: 1018, // pull back to the street
  loopA: 1016, // the street shrinks, the globe returns: the hook's frame 0
  chipThousand: fs(WORD.thousand - 0.12),
};

/* ------------------------------------------------------------------ B06a globe */
export const loopS = (f: number) => -8 - (N_FILM - 1 - f);
const ICON_SC = 0.62 * 1.13;
const spinSpeed = (f: number) => 1.15 * sm((f - B6.spin0) / (B6.spin1 - B6.spin0)) * (1 - 0.92 * sm((f - B6.spin1) / (B6.spinEnd - B6.spin1)));
const thTab: number[] = (() => { const a = [filmTh(1000)]; for (let f = B6.a0; f < N_FILM + 10; f++) a.push(a[a.length - 1] - spinSpeed(f + 0.5)); return a; })();
const th6 = (f: number) => { if (f <= B6.a0) return thTab[0]; const i = Math.floor(f - B6.a0), fr = f - B6.a0 - i; return thTab[Math.min(i, thTab.length - 2)] * (1 - fr) + thTab[Math.min(i + 1, thTab.length - 1)] * fr; };
const heroLon6 = () => th6(B6.zoomA);
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const stars = Array.from({length: 40}).map((_, i) => ({x: rand(i) * W, y: rand(i + 90) * H, r: 2 + rand(i + 30) * 3}));

export const heroIconPos = (f: number) => {
  const rel = rad(wrap(heroLon6() - th6(f))), c = Math.cos(rel);
  return {x: BIG.cx + BIG.R * Math.sin(rel), c, feetY: BIG.cy + 14 * 1.13};
};

export const FinaleGlobe: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const th = th6(f);
  const sp = {th, thc: th - (f < B6.a0 ? 0 : 0), blurS: Math.min(9, spinSpeed(f)), blurC: Math.min(9, spinSpeed(f))};
  const hero = heroIconPos(f);
  const pop = popScale(f, B6.heroPop);
  const pose = CALM(f);
  const hipY = hero.feetY - 164 * ICON_SC * pop - 4;
  const arrow = popScale(f, B6.speedChip);
  const eq = popScale(f, B6.eqChip);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={0} y={0} width={W} height={H} fill={C.paper} />
        {[420, 640, 860, 1080, 1300].map((r, i) => <circle key={i} cx={BIG.cx} cy={BIG.cy} r={r} fill="none" stroke={C.paperLine} strokeWidth={6} opacity={0.7} />)}
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.paperLine} opacity={0.8} />)}
      </svg>
      <GlobeH f={f} cx={BIG.cx} cy={BIG.cy} R={BIG.R} id="gb6" spin={sp} pin={false} />
      {hero.c > 0.05 && pop > 0.01 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scaleX(${0.3 + 0.7 * hero.c})`, transformOrigin: `${hero.x}px ${hero.feetY}px`, filter: 'drop-shadow(0 0 2px #FFFBF0) drop-shadow(0 0 2px #FFFBF0) drop-shadow(0 0 3px #FFFBF0)'}}>
          <CharacterSide pose={pose} hip={{x: hero.x, y: hipY}} sc={ICON_SC * pop} scarfWrap holdN={<MugSide tilt={0} sc={ICON_SC * pop} />} />
        </div>
      )}
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {arrow > 0.01 && hero.c > 0.05 && <g transform={`translate(${hero.x} ${hero.feetY - 250}) scale(${arrow})`}><ArrowShape x={0} y={0} w={130} /></g>}
          <Chip x={BIG.cx} y={BIG.cy + BIG.R + 90} w={420} text="~1,000 MPH" tone="move" arrow scale={arrow} />
          <Chip x={BIG.cx} y={BIG.cy + 56} w={250} text="EQUATOR" tone="still" scale={eq} />
        </svg>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ match zoom: maps a hero (hip point, scale) in one layer onto the same hero in the next */
export type HeroRef = {x: number; y: number; sc: number};
export const matchZoom = (u: number, from: HeroRef, to: HeroRef) => {
  const K = Math.exp(Math.log(to.sc / from.sc) * u);
  const P = {x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u)};
  return `translate(${P.x}px, ${P.y}px) scale(${K}) translate(${-from.x}px, ${-from.y}px)`;
};
export const ICON_REF = (f: number): HeroRef => { const h = heroIconPos(f); return {x: h.x, y: h.feetY - 164 * ICON_SC - 4, sc: ICON_SC}; };
export const CLOSE_SC = 2.85;
export const CLOSE_HIP = {x: 300, y: 1483};
export const CLOSE_REF: HeroRef = {x: CLOSE_HIP.x, y: CLOSE_HIP.y, sc: CLOSE_SC};
export const diveU = (f: number) => ramp(f, B6.zoomA, B6.zoomB, E.inOut);
export const diveTransform = (f: number) => matchZoom(diveU(f), ICON_REF(B6.zoomA), CLOSE_REF);

/* ------------------------------------------------------------------ B06b close-up */
const SIP: SidePose = {lean: 1, head: -9, armN: {s: 50, e: 112}, armF: {s: 8, e: 14}, legN: {h: 4, k: 2, f: 0}, legF: {h: -4, k: 2, f: 0}, mouth: 'smile', brows: 0, lookY: 0.1};
export const closePose = (f: number): SidePose => {
  const walk = WALKP(loopS(f)); // the same walk phase as the street layer it pulls back into
  const up = sm((f - B6.sip0) / (B6.sipUp - B6.sip0)), down = sm((f - B6.sipDown) / (B6.sipEnd - B6.sipDown));
  const k = Math.max(0, up - down);
  return blendPose(walk, SIP, k);
};
export const closeMug = (f: number) => { const up = sm((f - B6.sip0) / (B6.sipUp - B6.sip0)), down = sm((f - B6.sipDown) / (B6.sipEnd - B6.sipDown)); return -62 * Math.max(0, up - down); };
export const closeHip = (f: number) => ({x: CLOSE_HIP.x, y: CLOSE_HIP.y - 7 * Math.abs(Math.sin(((loopS(f) - 6) / 30) * Math.PI))});
export const speedK = (f: number) => ramp(f, B6.streak0, B6.streakPeak, (x) => x) * (1 - ramp(f, B6.streak1, B6.streakOff, (x) => x));

export const Closeup: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const hip = closeHip(f), pose = closePose(f), fk = sideFK(pose, hip, CLOSE_SC);
  const sk = speedK(f);
  const streaks = Array.from({length: 26}).map((_, i) => {
    const y = 120 + rand(i + 5) * 1700, len = 220 + rand(i + 9) * 520, v = 70 + rand(i + 21) * 90, wd = 5 + rand(i + 44) * 9;
    const x = W + 400 - (((f - B6.streak0) * v * (0.4 + 0.6 * sk) + rand(i + 60) * (W + 1000)) % (W + 1000));
    return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={i % 3 === 0 ? C.saffronLight : C.cream} strokeWidth={wd} strokeLinecap="round" opacity={0.18 + 0.62 * sk} />;
  });
  const chip = popScale(f, B6.chipThousand);
  const eq = popScale(f, B6.zoomB + 2);
  const steam = [0, 1, 2].map((i) => ({x: fk.Wn.x + 120 + i * 34, dx: Math.sin(f * 0.12 + i) * 8}));
  void steam;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id="spaceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.ink} /><stop offset="1" stopColor={C.tealDeep} /></linearGradient></defs>
        <g opacity={1 - ramp(f, B6.outA, B6.outA + 5, (x) => x)}>
          <rect x={-3000} y={-3000} width={W + 6000} height={H + 6000} fill="url(#spaceG)" />
          {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.cream} opacity={0.35 + 0.4 * sk} />)}
          {streaks}
          <ellipse cx={CLOSE_HIP.x + 40} cy={1900} rx={330} ry={40} fill={C.ink} opacity={0.35} />
        </g>
      </svg>
      <CharacterSide pose={pose} hip={hip} sc={CLOSE_SC} scarfWrap scarf={<ScarfHang n={fk.N} z={CLOSE_SC / SC} sway={f * 0.1} />} holdN={<MugSide tilt={closeMug(f)} sc={CLOSE_SC} />} />
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Chip x={760} y={870} w={250} text="EQUATOR" tone="still" scale={eq * (1 - ramp(f, B6.sip0 - 6, B6.sip0, (x) => x))} />
          <Chip x={730} y={980} w={400} text="~1,000 MPH" tone="move" arrow scale={chip * (1 - ramp(f, B6.sip0 - 6, B6.sip0, (x) => x))} />
        </svg>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ the loop: the street layout of the hook, run backwards to its frame 0 */
const loopP = (f: number) => 1 - E.inOut(cl((f - B6.loopA) / (N_FILM - 1 - B6.loopA)));
const PANEL_TOP0 = 820, S0 = 0.82, FEET0 = 1500;
export const LoopStreet: React.FC<{f: number}> = ({f}) => {
  const p = loopP(f);
  const top = lerp(PANEL_TOP0, 0, p), S = lerp(S0, 1, p), feet = lerp(FEET0, GSY, p), rad0 = lerp(40, 0, p);
  const TX = 540 - 540 * S, TY = feet - top - GSY * S;
  const gc = {cx: lerp(GLOBE_FULL.cx, INSET.cx, p), cy: lerp(GLOBE_FULL.cy, INSET.cy, p), R: lerp(GLOBE_FULL.R, INSET.R, p)};
  const g0 = 20; // the hook's surface angle at frame 0
  const th = g0 + 9 * (N_FILM - 1 - f);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id="skyL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.saffron} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#skyL)" />
      </svg>
      {p < 1 && <div style={{position: 'absolute', left: -6, top: top - 7, width: W + 12, height: H, background: C.ink, borderRadius: `${rad0 + 4}px ${rad0 + 4}px 0 0`}} />}
      <div style={{position: 'absolute', left: 0, top, width: W, height: H - top, overflow: 'hidden', borderRadius: `${rad0}px ${rad0}px 0 0`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${TX}px, ${TY}px) scale(${S})`}}>
          <SceneH f={0} st={{s: loopS(f), mode: 'nostop'}} />
        </div>
      </div>
      <GlobeH f={0} cx={gc.cx} cy={gc.cy} R={gc.R} id="gloop" spin={{th, thc: th, blurS: 8, blurC: 8}} />
    </div>
  );
};
export const loopStreetHero = (f: number): HeroRef => {
  // hero hip on screen in the loop layer at p = 1 (full-bleed street at the pre-brake zoom): where the close-up must land when it pulls back
  const st = {s: loopS(f), mode: 'nostop' as const};
  const h = heroFor(st), p = toScreenFor(h.fk.P.x, h.fk.P.y, st);
  return {x: p.x, y: p.y, sc: SC * zoomFor(st)};
};
export {sm};
export {spinFor};
void CALM; void ScarfHang;
