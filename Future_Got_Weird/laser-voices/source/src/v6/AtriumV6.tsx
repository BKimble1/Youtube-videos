// V6 (from V5) World 1/4: the museum atrium (V4's hall) restaged: the exhibit case with the lead and his friend, the
// transmitter's demonstration stand to his left, the crowd behind, and the visitor who walks through the beam.
// Overlays: the whisper's air shimmer at his ear, and the restrained beam visualisation (a thin dotted amber line,
// drawn in from the window and ending on whatever stops it).
import React from 'react';
import {B, cardOf, cardPt, proj, v3, V3, cardToWorld} from '../v4/rig/geo4';
import {joints4, Crew6} from './rig/Crew6';
import {INK, BODY_P} from '../v4/rig/cast4';
import {AtriumShell, atriumItems, plant, demoStand, ATR} from '../v4/atrium4';
import {Item, paint, depthOf, box, poly, lineNode} from '../v4/draw3';
import {transmitter} from '../v4/transmitter4';
import {Cup} from './props6';
import {W, H, FPS, clamp} from '../v4/core4';
import {
  leadAt, friendAt, visitorAt, visitorRead, VISITOR, EXTRA_LIST, extraAt, W_LANE, MACHINE, AIM, CASE, BEAM, beamAt, beamStop, earOf, CharState, GUESSER, CLERK, FRIEND_CUP,
} from './stage6';

// ---- the whisper's air shimmer: a small, gentle haze in the air just outside his ear (V4's sat on the ear and, in
// the close shots, warped his face)
const Shimmer: React.FC<{b: B; at: V3; head: V3; amt: number; t: number; id: string; children: React.ReactNode}> = ({b, at, head, amt, t, id, children}) => {
  if (amt <= 0.01) return null;
  // placed in screen space just outside the head's silhouette on the ear's side (the beam's side when the ear is
  // turned away), so it never sits on the face
  const e = proj(b, at), hc = proj(b, head);
  if (e.z < 0.1 || hc.z < 0.1) return null;
  const r = clamp((0.065 * b.c.f) / e.z, 12, 140), headR = (0.125 * b.c.f) / hc.z;
  const sgn = Math.abs(e.x - hc.x) > 0.15 * headR ? Math.sign(e.x - hc.x) : 1;
  const c = {x: hc.x + sgn * (headR + 0.75 * r), y: e.y};
  const fr = Math.round(t * FPS);
  return (
    <g>
      <defs>
        <filter id={`${id}f`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={`${(0.9 / r * 6).toFixed(4)} ${(1.6 / r * 6).toFixed(4)}`} numOctaves={2} seed={fr % 97} />
          <feDisplacementMap in="SourceGraphic" scale={(r * 0.07 * amt).toFixed(1)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id={`${id}rg`}><stop offset="0.3" stopColor="#fff" stopOpacity={1} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient>
        <mask id={`${id}m`}><circle cx={c.x} cy={c.y} r={r} fill={`url(#${id}rg)`} /></mask>
      </defs>
      <g mask={`url(#${id}m)`}>
        <g filter={`url(#${id}f)`}>{children}</g>
        <circle cx={c.x} cy={c.y} r={r * (0.55 + 0.12 * Math.sin(t * 19))} fill="none" stroke="#DDF4F7" strokeWidth={r * 0.05} opacity={0.22 * amt} />
      </g>
    </g>
  );
};

// ---- a character as a paint item (the V6 rig); the friend's cup rides in her right hand
export type Who = {s: CharState; look: typeof GUESSER; id: string; cup?: number};
export const charItem = (b: B, w: Who, t: number): Item => {
  const cd = cardOf(b, w.s.ground, w.s.heading);
  if (cd.depth < 0.25) return {d: cd.depth, node: null};
  return {d: cd.depth, node: <Crew6 key={w.id} id={w.id} look={w.look} b={BODY_P} pose={w.s.pose} cd={cd} t={t} holdR={w.cup === -1 ? <Cup /> : undefined} holdL={w.cup === 1 ? <Cup /> : undefined} />};
};

// ---- the exhibit: a low glass case with a brass ear trumpet and a placard
const caseItems = (b: B): Item[] => {
  const {x0, x1, z0, z1, y, glass} = CASE;
  const it: Item[] = [];
  it.push(box(b, x0, x1, 0, y, z0, z1, {top: '#3B2E26', side: '#5E432B', front: '#6B4D33'}, 'cbase'));
  // the trumpet (screen-space art at the case's centre, scaled by depth)
  const c = proj(b, v3((x0 + x1) / 2 - 0.1, y + 0.02, (z0 + z1) / 2));
  if (c.z > 0.2) {
    const k = b.c.f / c.z / 100 * 0.42;
    it.push({d: depthOf(b, v3((x0 + x1) / 2, y + 0.1, (z0 + z1) / 2)) + 0.01, node: (
      <g key="trumpet" transform={`translate(${c.x} ${c.y}) scale(${k})`}>
        <path d="M -48 -6 C -30 -8 -10 -10 6 -14 C 20 -18 34 -30 44 -42 C 52 -32 54 -14 50 -2 C 40 -6 24 -6 8 -4 C -10 -2 -30 0 -48 2 Z" fill="#D9A441" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <ellipse cx={47} cy={-22} rx={5} ry={20} fill="#8C6420" stroke={INK} strokeWidth={2.2} transform="rotate(-18 47 -22)" />
        <path d="M -48 -6 L -54 -5 L -54 3 L -48 2" fill="#B9862F" stroke={INK} strokeWidth={2} />
        <path d="M -20 -5 C 0 -8 20 -10 36 -22" fill="none" stroke="#F4D27A" strokeWidth={2} opacity={0.8} />
        <rect x={-60} y={2} width={124} height={6} rx={2} fill="#7A2E2E" stroke={INK} strokeWidth={1.6} />
      </g>
    )});
  }
  // glass hood
  {
    const gx0 = x0 + 0.04, gx1 = x1 - 0.04, gz0 = z0 + 0.04, gz1 = z1 - 0.04, gy1 = y + glass;
    const faces: V3[][] = [
      [v3(gx0, gy1, gz0), v3(gx1, gy1, gz0), v3(gx1, gy1, gz1), v3(gx0, gy1, gz1)],
      [v3(gx0, y, gz0), v3(gx1, y, gz0), v3(gx1, gy1, gz0), v3(gx0, gy1, gz0)],
      [v3(gx0, y, gz0), v3(gx0, y, gz1), v3(gx0, gy1, gz1), v3(gx0, gy1, gz0)],
      [v3(gx1, y, gz0), v3(gx1, y, gz1), v3(gx1, gy1, gz1), v3(gx1, gy1, gz0)],
    ];
    faces.forEach((f, i) => it.push(poly(b, f, {fill: '#DDF2F5', op: 0.28, stroke: '#7FA9B3', sw: 1.6}, `cg${i}`, -0.03)));
    it.push({d: depthOf(b, v3(gx0 + 0.2, gy1, gz0)) - 0.035, node: <g key="glint">{lineNode(b, v3(gx0 + 0.15, gy1 - 0.03, gz0 - 0.001), v3(gx0 + 0.35, y + 0.04, gz0 - 0.001), {stroke: '#FFFFFF', sw: 3, op: 0.6})}</g>});
  }
  // placard on a slanted stand at her end
  const pz = z0 + 0.06;
  it.push(poly(b, [v3(x1 - 0.42, y + 0.02, pz), v3(x1 - 0.1, y + 0.02, pz), v3(x1 - 0.1, y + 0.2, pz + 0.05), v3(x1 - 0.42, y + 0.2, pz + 0.05)], {fill: '#FAF3DF', stroke: INK, sw: 2}, 'plac', -0.05));
  for (let i = 0; i < 3; i++) it.push({d: depthOf(b, v3(x1 - 0.26, y + 0.1, pz)) - 0.06, node: <g key={`pl${i}`}>{lineNode(b, v3(x1 - 0.38, y + 0.15 - i * 0.04, pz + 0.035 - i * 0.01), v3(x1 - (i === 2 ? 0.24 : 0.14), y + 0.15 - i * 0.04, pz + 0.035 - i * 0.01), {stroke: '#8C9A98', sw: 2})}</g>});
  return it;
};

// ---- the visitor's museum map, held open between the hands (or folded in one hand)
const mapNode = (s: CharState, cd: ReturnType<typeof cardOf>, open: number, key: string) => {
  const j = joints4(BODY_P, s.pose);
  if (open < 0.05) {
    const p = cardPt(cd, v3(j.WR.x, j.WR.y + 4, j.WR.z + 8));
    return <rect key={key} x={p.x - 9 * cd.k} y={p.y - 24 * cd.k} width={18 * cd.k} height={34 * cd.k} rx={2 * cd.k} fill="#FFC744" stroke={INK} strokeWidth={Math.max(1.2, 2.2 * cd.k)} />;
  }
  const L = j.WL, R = j.WR;
  const w = (L.x - R.x) * (0.4 + 0.6 * open);
  const cx = (L.x + R.x) / 2, cy = (L.y + R.y) / 2 + 10, cz = Math.max(L.z, R.z) + 6;
  const h = 52 + 20 * open;
  const P = (x: number, y: number) => cardPt(cd, v3(cx + x, cy + y, cz));
  const c = [P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)];
  const ol = Math.max(1.2, 2.4 * cd.k);
  return (
    <g key={key}>
      <path d={`M${c.map((q) => `${q.x},${q.y}`).join('L')}Z`} fill="#FFF6DD" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
      {[0.33, 0.66].map((f, i) => { const a = P(-w / 2 + w * f, -h / 2), bb = P(-w / 2 + w * f, h / 2); return <line key={i} x1={a.x} y1={a.y} x2={bb.x} y2={bb.y} stroke="#C9BFA4" strokeWidth={ol * 0.7} />; })}
      {(() => { const a = P(-w * 0.35, -h * 0.25), q = P(w * 0.05, -h * 0.05); return <rect x={Math.min(a.x, q.x)} y={Math.min(a.y, q.y)} width={Math.abs(q.x - a.x)} height={Math.abs(q.y - a.y)} fill="#1CA7A0" opacity={0.75} />; })()}
      {(() => { const a = P(w * 0.12, h * 0.05), q = P(w * 0.38, h * 0.3); return <rect x={Math.min(a.x, q.x)} y={Math.min(a.y, q.y)} width={Math.abs(q.x - a.x)} height={Math.abs(q.y - a.y)} fill="#EF6B55" opacity={0.75} />; })()}
    </g>
  );
};

export type AtriumV6Opts = {beam?: number; beamReveal?: number; whisper?: number; visitor?: boolean; crowd?: boolean};
/** the beam visualisation: deliberately a diagram (thin, dotted, softly glowing), never a bright "real" beam */
export const BeamLine: React.FC<{b: B; o: V3; e: V3; t: number; amt: number; id: string; reveal?: number}> = ({b, o, e, t, amt, id, reveal = 1}) => {
  if (amt <= 0.01) return null;
  const end = v3(o.x + (e.x - o.x) * reveal, o.y + (e.y - o.y) * reveal, o.z + (e.z - o.z) * reveal);
  const p = proj(b, o), q = proj(b, end);
  if (p.z < 0.1 || q.z < 0.1) return null;
  const off = -((t * 240) % 28);
  return (
    <g opacity={amt}>
      <defs><filter id={`${id}g`} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={3.5} /></filter></defs>
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#FF9A2E" strokeWidth={9} opacity={0.45} filter={`url(#${id}g)`} strokeLinecap="round" />
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#FFC27A" strokeWidth={3.2} strokeDasharray="12 7" strokeDashoffset={off} strokeLinecap="round" />
      <circle cx={q.x} cy={q.y} r={4} fill="#FFE2A8" opacity={0.9} />
    </g>
  );
};

export const atriumPeople = (t: number, withVisitor: boolean) => {
  const who: (Who & {map?: number})[] = [
    {s: leadAt(t), look: GUESSER, id: 'lead'},
    {s: friendAt(t), look: CLERK, id: 'fr', cup: FRIEND_CUP},
  ];
  if (withVisitor) who.push({s: visitorAt(t), look: VISITOR, id: 'vis', map: visitorRead(t)});
  return who;
};

export const AtriumV6: React.FC<{b: B; t: number; o?: AtriumV6Opts}> = ({b, t, o = {}}) => {
  const people = atriumPeople(t, o.visitor ?? false);
  const items: Item[] = [...atriumItems(b, t)];
  items.push(plant(b, -7.6, 4.5, 1.0, 'pA', t), plant(b, 9.4, 4.5, 1.1, 'pB', t), plant(b, 4.2, 1.6, 1.15, 'pC', t));
  items.push(...demoStand(b, MACHINE, 'stand'));
  items.push(...transmitter(b, MACHINE, AIM.yaw, AIM.pitch, {key: 'tx', mount: 'tripod', led: 0.5 + 0.5 * Math.sin(t * 5), spin: 0, open: 0}));
  items.push(...caseItems(b));
  // the stand's small sign
  const sg = proj(b, v3(MACHINE.x + 0.75, 0.95, MACHINE.z - 0.62));
  if (sg.z > 0.3) {
    const k = b.c.f / sg.z / 100 * 0.6;
    items.push({d: sg.z - 0.05, node: <g key="sign" transform={`translate(${sg.x} ${sg.y}) scale(${k})`}><rect x={-26} y={-30} width={52} height={22} rx={3} fill="#1CA7A0" stroke={INK} strokeWidth={2} /><text x={0} y={-15} fontSize={11} fontWeight={900} fontFamily='"Nunito Variable","Nunito",sans-serif' fill="#FFFFFF" textAnchor="middle">LIVE DEMO</text><line x1={0} y1={-8} x2={0} y2={18} stroke={INK} strokeWidth={3} /></g>});
  }
  if (o.crowd !== false) for (const e of EXTRA_LIST) {
    const s = extraAt(e, t);
    for (let n = -2; n <= 2; n++) {
      const x = s.ground.x + n * W_LANE;
      if (x < ATR.x0 + 1 || x > ATR.x1 - 1) continue;
      items.push(charItem(b, {s: {...s, ground: v3(x, s.ground.y, s.ground.z)}, look: e.look, id: `ex${e.z}${e.x0}${n}`}, t));
    }
  }
  for (const w of people) {
    const it = charItem(b, w, t);
    if (w.map !== undefined && it.node) {
      const cd = cardOf(b, w.s.ground, w.s.heading);
      it.node = <g key={w.id}>{it.node}{mapNode(w.s, cd, w.map, `${w.id}map`)}</g>;
    }
    items.push(it);
  }
  const scene = <g><AtriumShell b={b} />{paint(items)}</g>;
  const lead = people[0].s;
  const u = (o.beam ?? 0) > 0 ? beamStop(people.slice(2).map((p) => p.s)) : 1;
  const stopAt = u < 0.985 ? beamAt(u) : BEAM.end;
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      {scene}
      {(o.whisper ?? 0) > 0 && <Shimmer b={b} at={earOf(lead)} head={earOf(lead, 0)} amt={o.whisper ?? 0} t={t} id="sh6">{scene}</Shimmer>}
      <BeamLine b={b} o={BEAM.o} e={stopAt} t={t} amt={o.beam ?? 0} id="bl6" reveal={o.beamReveal ?? 1} />
    </svg>
  );
};
export {FPS, clamp, cardToWorld};
