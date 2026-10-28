// V4 café scenes (the separate experiment: Wi-Fi identification; illustrative, not footage of a real incident).
// E (from the lab, to 22.3): he walks along a sunny street toward the café, other people pass; inside, the router
// talks to the customers' devices; its radio passes through the glass, reaches him, and what bounces off him travels
// to a separate receiver and laptop; the camera pushes in through the window to that setup (then the full-frame
// analysis screen, ui.tsx); then back outside: he walks on, hands empty, while the customers' phones are the only
// devices on the network. G (27.1 to 31.85): the reverse angle, from inside: he passes the window, the laptop links his
// live signature to the one recorded on an earlier visit, he walks on, unaware. H (31.85 to 34.6): a CCTV camera on the
// corner follows him (and its own view of him); then the camera moves to the café's router while its radio still
// follows him, and pushes into the wall (the join back to the concrete lab wall).
import React from 'react';
import {add3, B, basis, Cam, camPath, lookAt, proj, scaleAt, v3, V3} from '../world/cam';
import {cardAt, FloorShadow, Person, pose, U} from '../art/person';
import {walk, Gait, heelStrikes} from '../art/walk';
import {ManPose, Outfit} from '../dc/Man';
import {EXPR_NEUTRAL, EXPR_UNEASY, Expr, mixExpr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {clamp, f1, ss, useUid, word} from '../lib';
import {BladeSign4, CafeTable, CC, Cctv, CCTV, CounterFront, Facade, FACADE, Fore, GlassClip, GlassFront, Ground, inside, Interior, LAMPS, Laptop, Opposite, PATH_Z, ROUTER, RouterBox, RXANT, RxStation, rxScreenRect, Sky} from './cafeSet4';
import {along, ECHO, LinkDots, OUT, PacketDraw, Pk} from './packets';
import {LaptopMatch} from './ui';
import {LAB_IN} from './hero4';
import {LAB_OUT} from './Lab4';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
export const CF = {
  in: LAB_OUT, sep: T_('separate'), sci: T_('scientists', 1), ordinary: T_('ordinary'), signals: T_('signals'), identify: T_('identify'),
  people: T_('people', 0), walking: T_('walking', 0), past: T_('past', 0), even: T_('even'), without: T_('without', 0), phones: T_('phones'),
  they: T_('they', 1), so: T_('so'), walking2: T_('walking', 1), cafe: T_('cafe'), recognizes: T_('recognizes'), without2: T_('without', 1),
  anything: T_('anything'), now: T_('now'), camera: T_('camera'), watching: T_('watching'), or: T_('or'),
};
/** the full-frame analysis screen */
export const UI_IN = CF.identify + 0.04, UI_OUT = CF.even - 0.05;
/** E ends on the lamp-post wipe; G starts out of the study's screen; H starts on the cut to the CCTV corner */
export const E_OUT = CF.they - 0.13;
export const G_IN = CF.so;
export const H_IN = CF.now - 0.2;
export const POV_IN = CF.camera - 0.02, POV_OUT = CF.watching + 0.45;

// ------------------------------------------------------------------ people
const V = 570;
const at0 = (x: number, t0: number, v = V) => (x + (v / U) * t0) * U;
const GE: Gait = {x0: at0(4.4, 15.0), v: V, T: 0.95, ph: 0.15, arm: 19, elbow: 16, lean: 4};
const GG: Gait = {x0: at0(2.6, 27.15, 430), v: 430, T: 1.08, ph: 0.55, arm: 16, elbow: 18, lean: 3};
const GH: Gait = {x0: at0(4.75, 31.85), v: V, T: 0.95, ph: 0.35, arm: 19, elbow: 16, lean: 4};
export const heroGait = (t: number) => (t < (E_OUT + G_IN) / 2 ? GE : t < H_IN ? GG : GH);
const heroAt = (t: number) => {
  const p = walk(heroGait(t), t);
  const dx = p.x;
  return {at: v3(dx / U, 0, PATH_Z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose, wx: dx / U};
};
export const heroX = (t: number) => walk(heroGait(t), t).x / U;
const xG = (t: number) => (GG.x0 - GG.v * t) / U;
/** pedestrians on the street in E: P1 walks the other way along the shopfront (behind him), P2 ahead of him, nearer the curb */
const PEDS: {o: Outfit; g: Gait; z: number; flip: boolean; s: number}[] = [
  {o: {skin: '#F3CDB0', hair: '#E3BC63', shirt: '#F2B134', stripe: null, pants: '#3D5A80', shoe: '#FFFFFF', longSleeve: true, hairStyle: 'bun'},
    g: {x0: -1.9 * U + 520 * 15.0, v: 520, T: 0.86, ph: 0.2, arm: 16, elbow: 20, lean: 3}, z: 2.75, flip: true, s: 0.96},
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
  ...heelStrikes(GE, UI_OUT, E_OUT).map((s) => ({...s, who: 'hero (café, close)', gain: 0.95})),
  ...heelStrikes(PEDS[0].g, CF.in + 0.4, CF.signals).map((s) => ({...s, who: 'pedestrian', gain: 0.3})),
  ...heelStrikes(PEDS[1].g, CF.in + 0.2, CF.ordinary).map((s) => ({...s, who: 'pedestrian', gain: 0.35})),
  ...heelStrikes(GG, G_IN + 0.3, H_IN).map((s) => ({...s, who: 'hero (seen from inside)', gain: 0.45})),
  ...heelStrikes(GH, H_IN, LAB_IN).map((s) => ({...s, who: 'hero (CCTV corner)', gain: 0.8})),
];
const CUST1: Outfit = {skin: '#8D5A3B', hair: '#1E1A1A', shirt: '#7C6BD6', stripe: null, pants: '#3B3F48', shoe: '#E9E9E9', longSleeve: true, hairStyle: 'curly'};
const CUST2: Outfit = {skin: '#F1C7A5', hair: '#6B4226', shirt: '#E07A5F', stripe: null, pants: '#2F4858', shoe: '#F4F1EA', longSleeve: true, hairStyle: 'swoop'};
const BARISTA: Outfit = {skin: '#D9A07C', hair: '#2B2B2B', shirt: '#1D3B3A', stripe: null, pants: '#2B2B2B', shoe: '#2F2F2F', longSleeve: false, hairStyle: 'short'};
const T1 = {x: 1.85, z: 4.35}, T2 = {x: -2.05, z: 4.3};
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
const back = (x: number, y: number, z: number, f = 1000, cy = 960) => cam(x, y, z, f, cy, 0, 180);
export const cafeCam = (t: number): Cam => {
  const hx = heroX(t);
  if (t < (E_OUT + G_IN) / 2) {
    if (t >= UI_OUT) {
      // even without their phones: close beside him, the left window (and the customer on her phone) behind him,
      // then past the lamp post (the wipe to the study)
      return camPath(t, [
        [UI_OUT, cam(heroX(UI_OUT) - 0.05, 1.15, 0.25, 950, 980)],
        [CF.phones, cam(heroX(CF.phones) - 0.1, 1.18, 0.3, 950, 980)],
        [E_OUT - 0.25, cam(LAMPS[0] + 0.25, 1.2, 0.3, 950, 980)],
        [E_OUT + 0.2, cam(LAMPS[0] - 0.55, 1.2, 0.3, 950, 980)],
      ]);
    }
    const tr = (tt: number, lead: number, z: number, y = 1.3, f = 1000) => cam(heroX(tt) - lead, y, z, f, 930);
    return camPath(t, [
      // out of the silhouette: him, close, then the street opens up around him
      [CF.in - 0.05, cam(heroX(CF.in) - 0.02, 0.98, 0.15, 1000, 980)],
      [CF.in + 0.55, tr(CF.in + 0.55, 0.15, -0.7, 1.15)],
      [CF.sci, tr(CF.sci, 0.45, -1.9, 1.45, 1050)],
      [CF.ordinary + 0.3, tr(CF.ordinary + 0.3, 0.35, -1.1, 1.35)],
      // the push: past him, through the right window, to the receiver and its laptop
      [CF.signals + 0.15, cam(1.35, 1.3, 0.6, 1000, 940)],
      [CF.identify - 0.15, cam(1.15, 1.08, FACADE - 0.05, 950, 960)],
      [UI_IN, cam(1.15, 1.02, FACADE + 0.12, 950, 960)],
    ]);
  }
  if (t < H_IN) {
    // G, from inside: on the laptop's record, out to the room and the window, him passing; the match; then close to
    // the glass, him walking on
    const RXv = (d: number) => back(0.87, 0.96, 3.77 + d, 1100, 960);
    return camPath(t, [
      [G_IN, RXv(0.32)],
      [CF.walking2 + 0.1, back(0.7, 1.35, 6.2, 950, 930)],
      [CF.cafe + 0.3, back(Math.max(0.35, xG(CF.cafe + 0.3) + 0.5), 1.35, 5.6, 950, 930)],
      [CF.recognizes + 0.05, RXv(0.75)],
      [CF.recognizes + 0.55, RXv(0.45)],
      // out through the glass: the reverse angle from the sidewalk, close on him walking on, the road behind him
      [CF.without2 + 0.2, back(0.9, 1.3, FACADE + 0.3, 900, 960)],
      [CF.without2 + 0.6, back(xG(CF.without2 + 0.6) + 0.05, 1.25, FACADE - 0.4, 820, 980)],
      [H_IN, back(xG(H_IN) - 0.05, 1.25, FACADE - 0.5, 820, 980)],
    ]);
  }
  if (t >= POV_IN && t < POV_OUT) {
    // the CCTV camera's own picture
    return lookAt(add3(CCTV.head, v3(-0.2, -0.05, -0.05)), v3(hx, 0.95, PATH_Z), 1250, 540, 860);
  }
  // H: from just behind the CCTV camera (it fills the top of the frame), looking down at him walking under it; then
  // (after its own picture) to the café's router in the window while he walks past it, then into the wall
  if (t < POV_IN) return camPath(t, [
    [H_IN, cam(3.3, 2.0, 2.95, 560, 760, 0, 164)],
    [POV_IN, cam(3.1, 2.0, 2.9, 580, 760, 0, 180)],
  ]);
  return camPath(t, [
    [POV_OUT, cam(2.45, 2.05, 0.55, 1250, 880)],
    [CF.or + 0.05, cam(2.4, 2.05, 0.7, 1250, 880)],
    [LAB_IN, cam(3.15, 1.6, FACADE - 0.03, 1000, 920)],
  ]);
};
/** his card and pose in the café camera (the silhouette's landing place) */
export const cafeSil = (t: number) => {
  const h = heroAt(t);
  return {cd: cardAt(basis(cafeCam(t)), h.at), p: h.p};
};
/** how far the CCTV head is turned toward him (deg, screen rotation) */
const cctvPan = (t: number) => {
  const hx = heroX(t);
  const dx = hx - CCTV.head.x;
  return clamp(-25 + dx * 18, -55, 15);
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
  return t < POV_OUT ? 0.2 : 1.2;
};

// ------------------------------------------------------------------ the scene
const HANDS: HandPose = {curl: [0.16, 0.2, 0.24, 0.28], spread: 0.4, thumb: 28, thumbCurl: 0.25};
const silFilter = (id: string, col: string) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feFlood floodColor={col} result="f" />
    <feComposite in="f" in2="SourceAlpha" operator="in" />
  </filter>
);
export const CafeScene4: React.FC<{t: number; silhouette?: number}> = ({t, silhouette = 0}) => {
  const u = useUid();
  const c = cafeCam(t);
  const b = basis(c);
  const ins = inside(b);
  const flipAll = Math.abs(((c.yaw % 360) + 360) % 360 - 180) < 90; // looking back out of the café
  const isE = t < (E_OUT + G_IN) / 2;
  const isH = t >= H_IN;
  const pov = t >= POV_IN && t < POV_OUT;
  const h = heroAt(t);
  // his face: easy-going; G: unaware (a glance at the window, nothing more); H: a look up at the camera
  const glanceG = !isE && !isH ? ss(t, CF.anything - 0.5, CF.anything - 0.2) * (1 - ss(t, CF.anything + 0.3, CF.anything + 0.6)) : 0;
  const lookUp = isH ? ss(t, H_IN + 0.5, H_IN + 0.9) * (1 - ss(t, CF.camera + 0.3, CF.camera + 0.7)) : 0;
  const ex: Expr = mixExpr(mixExpr({...EXPR_NEUTRAL, smile: 0.3, gx: -0.5}, {...EXPR_UNEASY, gx: 0.6, gy: -0.1, browIn: 0.6, smile: -0.05, pupil: 0.85}, glanceG), {...EXPR_NEUTRAL, gx: 0.4, gy: -0.9, browIn: 0.5, smile: -0.1}, lookUp);
  const hp = {...h.p, neck: h.p.neck - 14 * lookUp + 3 * glanceG, turn: h.p.turn - 0.25 * glanceG - 0.2 * lookUp};
  const cd = cardAt(b, h.at);
  const show = radioShow(t);
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
      <RxStation b={b} t={t} screen={<LaptopMatch r={rxScreenRect(b)} t={t} t0={CF.recognizes + 0.25} />} />
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
          {isH && !pov && !flipAll && <Cctv b={b} pan={cctvPan(t)} />}
          {flipAll && <Fore b={b} />}
          {outside}
          {isH && !pov && flipAll && <Cctv b={b} pan={cctvPan(t)} />}
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
      {pov && <PovLook t={t} />}
    </svg>
  );
};
/** the façade's inner face (seen from inside): a wall with the openings */
const Poly4: React.FC<{b: B}> = ({b}) => {
  const pts = [v3(-3.6, 0, FACADE), v3(3.1, 0, FACADE), v3(3.1, 2.9, FACADE), v3(-3.6, 2.9, FACADE)].map((p) => proj(b, p));
  return <path d={`M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`} fill="#E3C9A0" stroke="#3A2A1E" strokeWidth={2} />;
};
/** the CCTV picture: cool, grainy, a timestamp and REC */
const PovLook: React.FC<{t: number}> = ({t}) => {
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
      <text x={1000} y={1380} textAnchor="end" fontSize={40} fill="#F2F6F8" fontFamily="JetBrains Mono, monospace" opacity={0.9}>{ts}</text>
      {/* the corner brackets of a camera viewfinder */}
      {[[60, 60, 1, 1], [1020, 60, -1, 1], [60, 1420, 1, -1], [1020, 1420, -1, -1]].map(([x, y, sx, sy], i) => <path key={i} d={`M${x},${y + sy * 70} L${x},${y} L${x + sx * 70},${y}`} fill="none" stroke="#F2F6F8" strokeWidth={6} opacity={0.85} />)}
    </g>
  );
};
export {silFilter};
