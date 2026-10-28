// V8 café scenes (the separate experiment: Wi-Fi identification; illustrative, not footage of a real incident). Every
// shot is from the street side, so he always walks screen-left. E (to 22.3): the street (SEPARATE STUDY, Film.tsx); he
// walks out of frame and the camera moves in to the right window (the router talking to the customers' devices, the
// receiver and its laptop); the split screen (his walk above; below, the receiver's laptop: stored samples learned
// earlier, the new sample from his steps, MATCH: #12); the customer on her phone as he passes empty-handed; the lamp
// wipe. G (27.1 to 30.2): the return visit, later (dusk): his walk past the café above, the laptop below (SAVED RECORD
// #12, NEW SIGNAL, SAME ID: #12); then him close, unaware. H: the CCTV on the lamp post and its fixed picture (CAMERA);
// from "or", that picture above and the receiver below (WI-FI: echoes into its antennas, his ID held); under the
// camera he stops and crouches: the cut back to the same crouch behind the lab wall.
import React from 'react';
import {add3, B, basis, Cam, camPath, lerpCam, lookAt, proj, scaleAt, v3, V3} from '../world/cam';
import {cardAt, FloorShadow, Person, pose, U} from '../art/person';
import {walk, Gait, heelStrikes} from '../art/walk';
import {armFK} from '../art/arms';
import {lerpPose} from '../dc/Man';
import {ManPose, Outfit} from '../dc/Man';
import {EXPR_NEUTRAL, EXPR_UNEASY, Expr, mixExpr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {clamp, f1, ss, ss5, useUid, word} from '../lib';
import {BladeSign4, CafeTable, CC, Cctv, CCTV, CounterFront, Facade, FACADE, Fore, GlassClip, GlassFront, Ground, inside, Interior, LAMPS, Laptop, Opposite, PATH_Z, ROUTER, RouterBox, RXANT, RxStation, rxScreenRect, Sky} from './cafeSet9';
import {along, ECHO, LinkDots, OUT, PacketDraw, Pk} from './packets';
import {LaptopMatch} from './ui';
import {duckP, LAB_IN, X} from './hero9';
import {DUR} from '../lib';
import {LAB_OUT} from './Lab9';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
export const CF = {
  in: LAB_OUT, sep: T_('separate'), sci: T_('scientists', 1), ordinary: T_('ordinary'), wifi: T_('wifi'), signals: T_('signals'), identify: T_('identify'),
  people: T_('people', 0), walking: T_('walking', 0), past: T_('past', 0), even: T_('even'), without: T_('without', 0), phones: T_('phones'),
  they: T_('they', 1), so: T_('so'), walking2: T_('walking', 1), cafe: T_('cafe'), recognizes: T_('recognizes'), without2: T_('without', 1),
  anything: T_('anything'), now: T_('now'), camera: T_('camera'), watching: T_('watching'), or: T_('or'), knows: T_('knows'),
};
/** the full-frame analysis screen */
export const UI_IN = CF.identify + 0.04, UI_OUT = CF.even - 0.05;
/** E ends on the lamp-post wipe; G starts out of the study's screen; H starts on the cut to the CCTV corner */
export const E_OUT = CF.they - 0.13;
export const G_IN = CF.so;
export const H_IN = CF.now - 0.2;
/** the CCTV's own picture from "camera"; from "or" it shares the frame with the Wi-Fi receiver (Film.tsx) */
export const POV_IN = CF.camera - 0.02, OR_SPLIT = CF.or - 0.02;
/** G: back to him close, unaware */
export const G_BACK = CF.without2;

// ------------------------------------------------------------------ people
const V = 570;
const at0 = (x: number, t0: number, v = V) => (x + (v / U) * t0) * U;
const GE: Gait = {x0: at0(4.4, 15.0), v: V, T: 0.95, ph: 0.15, arm: 19, elbow: 16, lean: 4};
const GG: Gait = {x0: at0(2.6, 27.15, 430), v: 430, T: 1.08, ph: 0.55, arm: 16, elbow: 18, lean: 3};
/** V6: G and H are one continuous walk (past the café, on to the lamp post with the CCTV) */
export const heroGait = (t: number) => (t < (E_OUT + G_IN) / 2 ? GE : GG);
/** V7: the end of his walk. He slows to a stop with his feet planted (the walk's own clock eases to a halt at a heel
 *  strike: a planted foot never slides), then ducks, timed exactly as the duck behind the lab wall it cuts to
 *  (hero7 DUCK0, DUCK_T) */
const STOP_D = 0.3;
/** (exported for the sound: his last step before the duck) */
export const stopTime = () => STOP_T;
const STOP_T = (() => {
  const hs = heelStrikes(GG, 34.5, 36.2).map((q) => q.t);
  return hs.find((x) => x >= 34.9) ?? hs[hs.length - 1];
})();
/** the walk's clock: real time, then (from STOP_T - STOP_D) a quadratic ease that leaves at walking speed and arrives
 *  at STOP_T at rest, 2 STOP_D later */
const clockOf = (t: number) => {
  const a = STOP_T - STOP_D;
  if (t < a) return t;
  const u = Math.min(1, (t - a) / (2 * STOP_D));
  return a + STOP_D * (2 * u - u * u);
};
/** the street duck's progress (0..1), the same curve as the lab duck's */
export const streetDuck = (t: number) => duckP(t - DUR);
const walkPose = (t: number) => {
  const g = heroGait(t);
  if (g !== GG || t < STOP_T - STOP_D) return walk(g, t);
  const p = walk(GG, clockOf(t));
  const c = streetDuck(t);
  if (c <= 0) return p;
  const crouch: ManPose = {...p, y: -195, torso: 10, chest: 8, neck: 6, turn: 0.46, ...armFK('L', {sh: 40, el: 70, wr: 8}), ...armFK('R', {sh: 26, el: 60, wr: 6})};
  return lerpPose(p, crouch, c);
};
export const heroPoseAt = (t: number) => walkPose(t);
const heroAt = (t: number) => {
  const p = walkPose(t);
  const dx = p.x;
  return {at: v3(dx / U, 0, PATH_Z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose, wx: dx / U};
};
export const heroX = (t: number) => walkPose(t).x / U;
const xG = (t: number) => (GG.x0 - GG.v * t) / U;
/** pedestrians on the street in E (V9: both going his way, so no one crosses through him): P1 strolls along the
 *  shopfront ahead of him (behind him in depth), P2 ahead of him, nearer the curb */
const PEDS: {o: Outfit; g: Gait; z: number; flip: boolean; s: number}[] = [
  {o: {skin: '#F3CDB0', hair: '#E3BC63', shirt: '#F2B134', stripe: null, pants: '#3D5A80', shoe: '#FFFFFF', longSleeve: true, hairStyle: 'bun'},
    g: {x0: (3.2 * U) / 0.96 + 420 * 15.0, v: 420, T: 0.98, ph: 0.2, arm: 15, elbow: 20, lean: 3}, z: 2.75, flip: false, s: 0.96},
  {o: {skin: '#7A4B32', hair: '#1C1A1A', shirt: '#2E8F8A', stripe: null, pants: '#55606B', shoe: '#F2F2F2', longSleeve: true, hairStyle: 'curly'},
    g: {x0: at0(3.0, 15.0, 680), v: 680, T: 0.84, ph: 0.6, arm: 20, elbow: 14, lean: 3}, z: 1.05, flip: false, s: 1.02},
];
const pedAt = (i: number, t: number) => {
  const P = PEDS[i];
  const p = walk(P.g, t);
  const dx = p.x;
  const wx = ((P.flip ? -1 : 1) * dx) / U * P.s;
  return {at: v3(wx, 0, P.z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose, wx};
};
export const cafeFootsteps = () => [
  ...heelStrikes(GE, CF.in, UI_IN).map((s) => ({...s, who: 'hero (café)', gain: 0.7})),
  ...heelStrikes(GE, UI_IN, UI_OUT).map((s) => ({...s, who: 'hero (through the window, split screen)', gain: 0.4})),
  ...heelStrikes(GE, UI_OUT, E_OUT).map((s) => ({...s, who: 'hero (café, close)', gain: 0.95})),
  ...heelStrikes(PEDS[0].g, CF.in + 0.4, CF.signals).map((s) => ({...s, who: 'pedestrian', gain: 0.3})),
  ...heelStrikes(PEDS[1].g, CF.in + 0.2, CF.ordinary).map((s) => ({...s, who: 'pedestrian', gain: 0.35})),
  ...heelStrikes(GG, G_IN + 0.2, G_BACK).map((s) => ({...s, who: 'hero (past the café, later; split screen)', gain: 0.45})),
  ...heelStrikes(GG, G_BACK, H_IN).map((s) => ({...s, who: 'hero (close, unaware)', gain: 0.8})),
  ...heelStrikes(GG, H_IN, POV_IN).map((s) => ({...s, who: 'hero (toward the CCTV)', gain: 0.7})),
  ...heelStrikes(GG, POV_IN, LAB_IN).map((s) => ({...s, who: 'hero (in the CCTV picture)', gain: 0.45})),
];
const CUST1: Outfit = {skin: '#8D5A3B', hair: '#1E1A1A', shirt: '#7C6BD6', stripe: null, pants: '#3B3F48', shoe: '#E9E9E9', longSleeve: true, hairStyle: 'curly'};
const CUST2: Outfit = {skin: '#F1C7A5', hair: '#6B4226', shirt: '#E07A5F', stripe: null, pants: '#2F4858', shoe: '#F4F1EA', longSleeve: true, hairStyle: 'swoop'};
const BARISTA: Outfit = {skin: '#D9A07C', hair: '#2B2B2B', shirt: '#1D3B3A', stripe: null, pants: '#2B2B2B', shoe: '#2F2F2F', longSleeve: false, hairStyle: 'short'};
const T1 = {x: 0.75, z: 4.35}, T2 = {x: -2.05, z: 4.3};
const C1 = v3(T1.x + 0.42, 0, T1.z), C2 = v3(T2.x + 0.42, 0, T2.z);
const LAP1 = v3(T1.x - 0.05, 0.76, T1.z);
/** seated, both hands at world points (relative to the card origin) */
const seated = (t: number, hands: [number, number, number, number], lean = 9) =>
  pose({x: 0, y: -282, torso: lean, chest: 3, neck: 6 + 2 * Math.sin(t * 0.9), turn: 0.62,
    lW: 1, lWx: hands[0], lWy: hands[1], lElb: -1, rW: 1, rWx: hands[2], rWy: hands[3], rElb: -1,
    lAx: -255, lAy: -27, lA: 1, rAx: -205, rAy: -27, rA: 1});
const cust1 = (t: number) => seated(t, [(LAP1.x - C1.x) * U + 40 + 8 * Math.sin(t * 7), -(0.78 * U), (LAP1.x - C1.x) * U + 105 + 8 * Math.sin(t * 6 + 1), -(0.78 * U)], 16);
const PHONE2 = (t: number) => ({x: -150, y: -600 + 6 * Math.sin(t * 1.3)});
const cust2 = (t: number) => {
  const ph = PHONE2(t);
  return seated(t, [ph.x + 18, ph.y + 30, ph.x - 10, ph.y + 34], 12);
};
const barista = (t: number) => pose({x: 0, y: -494, torso: 6, chest: 4, neck: 4, turn: 0.55,
  lW: 1, lWx: -260 + 60 * Math.sin(t * 2.2), lWy: -640, lElb: -1, rW: 0, rTu: -320, rTv: 20,
  lAx: -60, lAy: -27, lA: 1, rAx: 30, rAy: -27, rA: 1});

// ------------------------------------------------------------------ cameras
const cam = (x: number, y: number, z: number, f = 1000, cy = 960, pitch = 0, yaw = 0): Cam => ({pos: v3(x, y, z), yaw, pitch, f, cx: 540, cy});
/** E: the camera stops following him and moves in to the right window (the router and the receiver) */
export const E_PUSH = CF.ordinary + 0.2;
/** G: the camera stops following him and moves in to the window (the receiver's laptop) */
export const G_PUSH = CF.walking2 + 0.3;
/** where the CCTV is aimed (fixed: it watches the sidewalk under the lamp post; he walks through its picture) */
export const CCTV_AIM = v3(-3.3, 0.9, 2.6);
/** V6: every café shot is from the street side (he always walks screen-left), stable or slowly tracking, with one
 *  inward move in E (to the router and the receiver) and one in G (to the receiver's laptop) */
export const cafeCam = (t: number): Cam => {
  if (t < (E_OUT + G_IN) / 2) {
    if (t >= UI_OUT) {
      // even without their phones: locked on the left window, where a customer sits on her phone; he walks past it
      // with empty hands; then the camera goes with him (easing up to his speed) and the lamp post passes the lens
      // (the wipe to the study)
      const u = t - PHONE_TRACK;
      const x = -1.86 - 0.95 * (u <= 0 ? 0 : u < 0.5 ? u * u : u - 0.25);
      return cam(x, 1.3, -0.35, 900, 960);
    }
    // the street: a slow side track (slower than him, so he walks into the middle of the frame); then the camera
    // stops following him and moves in once, to the right window: the router on its shelf (talking to the customers'
    // laptop and phone) and, below it, the receiver and its laptop
    // V9: the street (wide, where the skeleton steps out among the pedestrians), then one dolly in to him at person
    // level, walking with him while the router's signals reach him (on "ordinary Wi-Fi signals"); then the camera lets
    // him go and pushes in to the right window (the router and the receiver). One continuous move, three views
    const wide = camPath(t, [[CF.in - 0.05, cam(4.1, 1.25, -0.9, 900, 930), true], [E_PUSH + 0.6, cam(3.3, 1.25, -0.9, 900, 930), true]]);
    const track = (tt: number) => cam(heroX(tt) + 0.42, 1.08, -0.15, 820, 960);
    const push = camPath(t, [[E_PUSH + 0.15, track(E_PUSH + 0.3), true], [UI_IN, cam(2.35, 1.3, 1.3, 860, 900), true]]);
    const c1 = lerpCam(wide, track(t), ss5(t, CF.sep + 0.35, CF.sci + 0.05));
    return lerpCam(c1, push, ss5(t, E_PUSH - 0.1, E_PUSH + 0.5));
  }
  if (t < G_BACK) {
    // G (the split screen's upper half, Film.tsx): later, at dusk, he walks past the café again; a slow track, the
    // router and the receiver behind the window over his shoulder
    // V9: a different view from E's: high, looking down on the sidewalk from above the street (the way a sensor sees a
    // place), going with him as he passes the café
    return cam(heroX(t) + 0.55, 3.3, -0.35, 680, 360, -30);
  }
  if (t < H_IN) {
    // back to him, close: a steady side track at his speed, unaware
    return cam(heroX(t) + 0.2, 1.2, 0.3, 900, 1000);
  }
  if (t < POV_IN) {
    // the street camera: locked, low, the CCTV on its post at the top of the frame, him walking toward it
    return lookAt(v3(-1.3, 1.5, -0.9), v3(-1.9, 1.75, 1.4), 700, 540, 960);
  }
  // the CCTV's own picture: locked, as a fixed street camera is; he walks through it
  return povCam();
};
/** the CCTV's picture (cy: its vertical centre, 430 in the ending's upper half) */
export const povCam = (cy = 900): Cam => lookAt(CCTV.head, CCTV_AIM, 900, 540, cy);
/** the split screen's upper half (UI_IN..UI_OUT): his walk itself (the receiver reads his gait), a low side track at
 *  his speed, feet to shoulders; every heel strike shows in the received signal below */
export const splitCam = (t: number): Cam => cam(heroX(t) + 0.08, 1.0, -0.75, 640, 370);
/** the ending's lower half: outside the right window, the router on its shelf and the receiver's laptop (his
 *  identity, held) */
export const rxCam = (cy: number): Cam => cam(2.15, 1.05, 2.95, 1300, cy - 245);
/** "even without their phones": when the camera starts going with him */
const PHONE_TRACK = CF.even + 0.35;
/** his heel strikes while the receiver records him (the received signal pulses with them) */
export const heroSteps = () => heelStrikes(GE, UI_IN - 1.2, UI_OUT + 0.2).map((s) => s.t);
/** his heel strikes in the ending (the receiver still reading him) */
export const heroStepsEnd = () => heelStrikes(GG, OR_SPLIT - 1.5, LAB_IN + 0.3).map((s) => s.t);
/** his card and pose in the café camera (the silhouette's landing place) */
export const cafeSil = (t: number) => {
  const h = heroAt(t);
  return {cd: cardAt(basis(cafeCam(t)), h.at), p: h.p};
};
// ------------------------------------------------------------------ radio in the café
const SPD = 2.2, PER = 0.42, ESP = 2.4;
/** the router's packets: to points on his body (and two that fly past), and the echoes from him to the receiver */
const cafePackets = (t: number, him: (tt: number) => V3[]): Pk[] => {
  const list: Pk[] = [];
  const o = add3(ROUTER, v3(0, 0.1, -0.13));
  const n1 = Math.floor(t / PER), n0 = n1 - 10;
  for (let n = n0; n <= n1; n++) {
    const te = n * PER;
    const targets = [...him(te + 2.4), v3(heroX(te + 2.4) - 1.6, 0.8, 1.2), v3(heroX(te + 2.4) + 1.4, 1.6, 0.9)];
    targets.forEach((tg, i) => {
      const a = along(o, tg, (t - te) * SPD);
      if (!a.done) {
        list.push({c: a.p, dir: a.dir, amp: 0.045, freq: 44, col: OUT, a: clamp((t - te) * 4) * (a.p.z < FACADE ? 0.85 : 0.7)});
        return;
      }
      if (i >= 2) return;
      const th = te + a.total / SPD;
      const e = along(tg, RXANT, (t - th) * ESP);
      if (!e.done) list.push({c: e.p, dir: e.dir, amp: 0.05, freq: 30 + 10 * Math.sin(th * 3), col: ECHO, a: 0.95 * clamp((t - th) * 6)});
    });
  }
  return list;
};
const himPts = (t: number): V3[] => {
  const hx = heroX(t);
  return [v3(hx, 1.45, PATH_Z - 0.03), v3(hx + 0.05, 0.9, PATH_Z - 0.03)];
};
const radioShow = (t: number) => {
  if (t < (E_OUT + G_IN) / 2) return t < CF.ordinary - 0.4 ? 0.35 + 0.3 * ss(t, CF.sep, CF.sci) : t < UI_OUT ? 1 : 0.55;
  if (t < H_IN) return 0.9;
  return t < POV_IN ? 0.45 : 1;
};
/** his heel strikes on the return visit (the new signal on the laptop pulses with them) */
export const heroStepsG = () => heelStrikes(GG, G_IN - 1.2, G_BACK + 0.2).map((q) => q.t);

// ------------------------------------------------------------------ the scene
const HANDS: HandPose = {curl: [0.16, 0.2, 0.24, 0.28], spread: 0.4, thumb: 28, thumbCurl: 0.25};
const silFilter = (id: string, col: string) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feFlood floodColor={col} result="f" />
    <feComposite in="f" in2="SourceAlpha" operator="in" />
  </filter>
);
/** his pose and face in the café scenes: easy-going and unaware; in H he glances up at the CCTV as he nears it */
export const cafeHero = (t: number) => {
  const h = heroAt(t);
  const isH = t >= H_IN;
  const lookUp = isH ? ss(t, H_IN + 0.35, H_IN + 0.8) * (1 - ss(t, CF.camera + 0.15, CF.camera + 0.55)) : 0;
  // at the end he stops, glances back up toward the camera on the post, and ducks (the lab's startled face)
  const spooked = ss(t, STOP_T - 0.35, STOP_T - 0.05);
  const ex: Expr = mixExpr(mixExpr({...EXPR_NEUTRAL, smile: 0.3, gx: -0.5}, {...EXPR_NEUTRAL, gx: 0.4, gy: -0.9, browIn: 0.5, smile: -0.1}, lookUp), X.startled, spooked);
  const hp = {...h.p, neck: h.p.neck - 14 * lookUp, turn: h.p.turn - 0.2 * lookUp};
  return {h, hp, ex};
};
export const CafeScene4: React.FC<{t: number; silhouette?: number; camOverride?: Cam; povH?: number; povLook?: boolean}> = ({t, silhouette = 0, camOverride, povH = 1920, povLook}) => {
  const u = useUid();
  const c = camOverride ?? cafeCam(t);
  const b = basis(c);
  const ins = inside(b);
  const flipAll = Math.abs(((c.yaw % 360) + 360) % 360 - 180) < 90; // looking back out of the café
  const isE = t < (E_OUT + G_IN) / 2;
  const isH = t >= H_IN;
  // the CCTV's own picture (its overlay): the film's own camera from POV_IN, or a split's half that asks for it
  const pov = povLook ?? (!camOverride && t >= POV_IN);
  const {h, hp, ex} = cafeHero(t);
  const cd = cardAt(b, h.at);
  // the CCTV's own picture shows no radio (the CAMERA alternative); the Wi-Fi side does
  const show = pov ? 0 : radioShow(t);
  const pk = cafePackets(t, himPts);
  const people = isE ? PEDS.map((P, i) => ({P, ...pedAt(i, t)})).filter((q) => q.wx > -9 && q.wx < 9) : [];
  const outside = (
    <g>
      <Ground b={b} />
      {people.filter((q) => q.P.z > PATH_Z).map((q, i) => {
        const pc = cardAt(b, q.at, q.P.s);
        return <g key={`pb${i}`}><FloorShadow cd={pc} x={0} w={200} /><Person id={`${u}pb${i}`} cd={pc} p={q.p} flip={q.P.flip !== flipAll} farBehind look={{outfit: q.P.o, expr: {...EXPR_NEUTRAL, gx: -0.4, smile: 0.3}}} /></g>;
      })}
      <FloorShadow cd={cd} x={0} w={210} />
      <g filter={silhouette > 0 ? `url(#${u}sil)` : undefined}>
        <Person id={`${u}hero`} cd={cd} p={hp} flip={flipAll} farBehind look={{expr: ex, lHand: HANDS, rHand: HANDS, hairSway: 2 * Math.sin(t * 6.4)}} />
      </g>
      {people.filter((q) => q.P.z <= PATH_Z).map((q, i) => {
        const pc = cardAt(b, q.at, q.P.s);
        return <g key={`pf${i}`}><FloorShadow cd={pc} x={0} w={200} /><Person id={`${u}pf${i}`} cd={pc} p={q.p} flip={q.P.flip !== flipAll} farBehind look={{outfit: q.P.o, expr: {...EXPR_NEUTRAL, gx: -0.4, smile: 0.2}}} /></g>;
      })}
    </g>
  );
  const ph = PHONE2(t);
  const phoneW = v3(C2.x + ph.x / U, -ph.y / U, C2.z - 0.04);
  const room = (
    <g>
      <Interior b={b} t={t} />
      <RouterBox b={b} t={t} />
      <Person id={`${u}bar`} cd={cardAt(b, v3(0.25, 0, 6.78))} p={barista(t)} flip={flipAll} look={{outfit: BARISTA, expr: {...EXPR_NEUTRAL, gx: -0.6, gy: 0.4, smile: 0.3}}} />
      <CounterFront b={b} />
      {[{T: T2, C: C2, p: cust2(t), o: CUST2, id: 'c2'}, {T: T1, C: C1, p: cust1(t), o: CUST1, id: 'c1'}].sort((a, bb) => (flipAll ? a.T.z - bb.T.z : bb.T.z - a.T.z)).map((q) => (
        <g key={q.id}>
          <CafeTable b={b} x={q.T.x} z={q.T.z} chairX={q.C.x} />
          <Person id={`${u}${q.id}`} cd={cardAt(b, q.C)} p={q.p} flip={flipAll} look={{outfit: q.o, expr: {...EXPR_NEUTRAL, lid: 0.3, gx: -0.4, gy: 0.5, smile: 0.1}}} />
          {q.id === 'c1' && <Laptop b={b} x={LAP1.x} y={0.76} z={LAP1.z} face="street" />}
          {q.id === 'c2' && (() => {
            const P = proj(b, phoneW), k = scaleAt(b, phoneW);
            return <rect x={f1(P.x - k * 0.04)} y={f1(P.y - k * 0.07)} width={f1(k * 0.08)} height={f1(k * 0.14)} rx={f1(k * 0.012)} fill="#1C2630" stroke="#0B1218" strokeWidth={1} />;
          })()}
        </g>
      ))}
      <RxStation b={b} t={t} screen={<LaptopMatch r={rxScreenRect(b)} t={t} t0={isE ? CF.past + 0.05 : CF.recognizes - 0.15} mode={t >= OR_SPLIT ? 'id' : 'match'} />} />
      {/* the router talking to the customers' devices */}
      <LinkDots b={b} t={t} A={add3(ROUTER, v3(0, 0.05, -0.1))} Bp={add3(LAP1, v3(0, 0.12, 0))} show={0.9} seed={1} />
      <LinkDots b={b} t={t} A={add3(ROUTER, v3(0, 0.05, -0.1))} Bp={phoneW} show={0.9 + (isE && t > UI_OUT ? 0.1 : 0)} seed={2} />
    </g>
  );
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <GlassClip b={b} id={`${u}glass`} />
        {silFilter(`${u}sil`, '#5CE1FF')}
      </defs>
      <Sky b={b} />
      {!ins ? (
        <g>
          {flipAll && <Opposite b={b} />}
          <Facade b={b} t={t} />
          <g clipPath={`url(#${u}glass)`}>
            <rect width={1080} height={1920} fill={CC.interior} />
            {room}
            <rect width={1080} height={1920} fill="#FFD9A0" opacity={0.08} />
          </g>
          <GlassFront b={b} t={t} />
          <BladeSign4 b={b} />
          {/* looking back toward the road from the shopfront side, the lamp posts and planters (at the curb) are
              behind him and the CCTV (on the façade) is in front */}
          {!pov && <Cctv b={b} aim={CCTV_AIM} />}
          {flipAll && <Fore b={b} />}
          {outside}
          <PacketDraw b={b} t={t} list={pk} show={show} len={0.32} />
          {!flipAll && <Fore b={b} />}
        </g>
      ) : (
        <g>
          {/* inside: the street through the glass, then the room around us */}
          <Poly4 b={b} />
          <g clipPath={`url(#${u}glass)`}>
            <Sky b={b} />
            <Opposite b={b} />
            {outside}
            <GlassFront b={b} t={t} />
            <rect width={1080} height={1920} fill="#9FD3E6" opacity={0.08} />
          </g>
          {room}
          <PacketDraw b={b} t={t} list={pk} show={show} len={0.32} />
        </g>
      )}
      {/* later (the return visit, the CCTV, the ending): dusk light, the cue that time has passed */}
      {t >= G_IN && <rect width={1080} height={1920} fill="#B79AC0" opacity={0.38} style={{mixBlendMode: 'multiply'}} />}
      {t >= G_IN && <rect width={1080} height={1920} fill="#FFB067" opacity={0.1} style={{mixBlendMode: 'soft-light'}} />}
      {pov && <PovLook t={t} h={povH} />}
    </svg>
  );
};
/** the façade's inner face (seen from inside): a wall with the openings */
const Poly4: React.FC<{b: B}> = ({b}) => {
  const pts = [v3(-3.6, 0, FACADE), v3(3.1, 0, FACADE), v3(3.1, 2.9, FACADE), v3(-3.6, 2.9, FACADE)].map((p) => proj(b, p));
  return <path d={`M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`} fill="#E3C9A0" stroke="#3A2A1E" strokeWidth={2} />;
};
/** the CCTV picture: cool, grainy, a timestamp and REC */
const PovLook: React.FC<{t: number; h?: number}> = ({t, h = 1920}) => {
  const u = useUid();
  const ts = `14:3${Math.floor(t / 10) % 10}:${String(Math.floor(t * 1) % 60).padStart(2, '0')}`;
  return (
    <g>
      <rect width={1080} height={1920} fill="#7FA4B4" opacity={0.28} style={{mixBlendMode: 'multiply'}} />
      <defs>
        <radialGradient id={`${u}vg`} cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.55} /></radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${u}vg)`} />
      {Array.from({length: 96}, (_, i) => <rect key={i} x={0} y={i * 20} width={1080} height={8} fill="#000" opacity={0.07} />)}
      <circle cx={88} cy={150} r={20} fill={Math.floor(t * 2) % 2 ? '#FF3B3B' : '#A22'} />
      <text x={124} y={164} fontSize={46} fill="#F2F6F8" fontFamily="JetBrains Mono, monospace">REC · CAM 2</text>
      <text x={1000} y={Math.min(1380, h - 60)} textAnchor="end" fontSize={40} fill="#F2F6F8" fontFamily="JetBrains Mono, monospace" opacity={0.9}>{ts}</text>
      {/* the corner brackets of a camera viewfinder */}
      {[[60, 60, 1, 1], [1020, 60, -1, 1], [60, Math.min(1420, h - 30), 1, -1], [1020, Math.min(1420, h - 30), -1, -1]].map(([x, y, sx, sy], i) => <path key={i} d={`M${x},${y + sy * 70} L${x},${y} L${x + sx * 70},${y}`} fill="none" stroke="#F2F6F8" strokeWidth={6} opacity={0.85} />)}
    </g>
  );
};
export {silFilter};
