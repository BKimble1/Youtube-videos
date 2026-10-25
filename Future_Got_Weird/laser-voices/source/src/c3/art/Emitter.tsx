// V3 transmitter: an open optical bench on a tripod, so that what it does can be seen. A laser module fires along the
// bench into a small mirror on a galvo motor; the mirror, at 45 degrees, turns the beam down the lane to her ear, and
// rocks a degree or two either side to sweep it. A driver box beside the module (her voice in on a cable from the cart)
// carries the dial and the send button the operator works. The beam itself is invisible: it is drawn only as a brief
// explanatory visualisation (a pale dashed path with travelling light packets), never as a glowing red laser.
import React from 'react';
import {INK} from '../rig/cast';
import {add3, B, len3, lerp3, mul3, norm3, proj, sub3, V3, v3} from '../rig/geo';
import {box, cyl, depth, inkPx, Item, poly, seg} from './d3';
import {BEAM_Y, BZ, LENS} from '../world';
const clamp = (lo: number, hi: number, x: number) => Math.min(hi, Math.max(lo, x));

/** the bench plate (metres) */
export const PLATE = {x0: LENS.x - 0.46, x1: LENS.x + 0.1, z0: BZ - 0.12, z1: BZ + 0.44, y: 1.235};
/** laser module: a cylinder along the bench (its aperture at z = MOD.z0 faces the mirror) */
export const MOD = {x: LENS.x, y: BEAM_Y, z0: BZ + 0.12, z1: BZ + 0.41, r: 0.04};
/** the driver box, its dial and its send button */
/** the side table beside the tripod (waist height, so the operator's hands work below her face) and the driver on it */
export const TBL = {x0: LENS.x - 0.94, x1: LENS.x - 0.58, z0: BZ - 0.08, z1: BZ + 0.3, y: 0.76};
export const DRV = {x0: TBL.x0 + 0.04, x1: TBL.x0 + 0.29, z0: TBL.z0 + 0.06, z1: TBL.z0 + 0.32, y0: TBL.y, y1: TBL.y + 0.085};
export const DIAL = v3(DRV.x0 + 0.07, DRV.y1 + 0.012, DRV.z0 + 0.08);
export const BUTTON = v3(DRV.x0 + 0.17, DRV.y1 + 0.01, DRV.z0 + 0.17);
export const CART = {x0: LENS.x - 1.75, x1: LENS.x - 1.2, z0: BZ + 1.35, z1: BZ + 1.8, y: 0.82};
export const HUB = v3(LENS.x - 0.18, 0.95, BZ + 0.16);

/** mirror normal and in-plane horizontal axis for a galvo angle delta (deg): at 0 it turns -z into +x */
export const mirrorFrame = (delta: number) => {
  const a = ((45 + delta) * Math.PI) / 180;
  const n = v3(Math.sin(a), 0, Math.cos(a));
  const u = v3(Math.cos(a), 0, -Math.sin(a));
  return {n, u};
};
/** the beam leaving the mirror for a galvo angle: the reflection of the module's beam (travelling -z) */
export const beamDir = (delta: number) => {
  const {n} = mirrorFrame(delta);
  const d = v3(0, 0, -1);
  const k = 2 * (d.x * n.x + d.y * n.y + d.z * n.z);
  return norm3(sub3(d, mul3(n, k)));
};

export const emitterItems = (b: B, t: number, o: {on?: number; dial?: number; delta?: number; press?: number; send?: number} = {}): (Item | null)[] => {
  const it: (Item | null)[] = [];
  const on = o.on ?? 1;
  const delta = o.delta ?? 0;
  // ---- tripod: three legs to the floor, centre column, the bench plate on a pan head
  [100, 220, 340].forEach((a) => {
    const r = (a * Math.PI) / 180;
    const foot = v3(HUB.x + Math.cos(r) * 0.38, 0, HUB.z + Math.sin(r) * 0.38);
    it.push(seg(b, HUB, foot, INK, 3.8));
    it.push(seg(b, HUB, foot, '#4C6A75', 2.4, {bias: -0.001}));
    it.push(cyl(b, foot, 'y', 0.025, 0.035, '#2E4A55'));
  });
  it.push(cyl(b, v3(HUB.x, 0.88, HUB.z), 'y', 0.1, 0.05, '#3F5560'));
  it.push(cyl(b, v3(HUB.x, 0.98, HUB.z), 'y', PLATE.y - 0.04 - 0.98, 0.022, '#9FB0BA'));
  it.push(box(b, HUB.x - 0.06, HUB.x + 0.06, PLATE.y - 0.045, PLATE.y - 0.012, HUB.z - 0.06, HUB.z + 0.06, '#2E4A55'));
  // ---- the bench: plate with its hole grid; everything on it shares the plate's depth so its parts never interleave
  // with other objects
  const parts: (Item | null)[] = [];
  const P = PLATE;
  parts.push(box(b, P.x0, P.x1, P.y - 0.012, P.y, P.z0, P.z1, {top: '#5E6F78', front: '#4C5C64', side: '#3F4D54'}));
  for (let i = 1; i < 9; i++) {
    const x = P.x0 + ((P.x1 - P.x0) * i) / 9;
    for (let k = 1; k < 9; k++) {
      const z = P.z0 + ((P.z1 - P.z0) * k) / 9;
      const q = proj(b, v3(x, P.y + 0.0005, z));
      if (q.z < 0.05) continue;
      const r = Math.max(0.6, (b.c.f * 0.0045) / q.z);
      parts.push({d: 0, node: <circle key={`h${i}-${k}`} cx={q.x} cy={q.y} r={r} fill="#33424A" />});
    }
  }
  // laser module: two mounts, the body (cream, teal band), the aperture facing the mirror
  [MOD.z0 + 0.06, MOD.z1 - 0.06].forEach((z) => parts.push(box(b, MOD.x - 0.03, MOD.x + 0.03, P.y, MOD.y - MOD.r + 0.01, z - 0.02, z + 0.02, '#6E8390')));
  parts.push(cyl(b, v3(MOD.x, MOD.y, MOD.z0), 'z', MOD.z1 - MOD.z0, MOD.r, {top: '#FFFFFF', front: '#FFF6E0', side: '#E0D3B4'}, {cap: '#2E4A55'}));
  parts.push(cyl(b, v3(MOD.x, MOD.y, MOD.z0 + 0.1), 'z', 0.035, MOD.r + 0.004, '#1CA7A0', {cap: '#1CA7A0'}));
  parts.push(cyl(b, v3(MOD.x, MOD.y, MOD.z0 - 0.012), 'z', 0.012, 0.016, '#2E4A55', {cap: on > 0.5 ? '#FF9E86' : '#5A3A36'}));
  // the galvo: a motor can standing on the plate, its shaft, the mirror rocking on it
  parts.push(cyl(b, v3(LENS.x, P.y, BZ), 'y', 0.07, 0.024, '#2E4A55', {cap: '#6E8390'}));
  parts.push(seg(b, v3(LENS.x, P.y + 0.07, BZ), v3(LENS.x, BEAM_Y - 0.032, BZ), '#9FB0BA', 1.6));
  const {u} = mirrorFrame(delta);
  const hw = 0.052, hh = 0.036;
  const C = v3(LENS.x, BEAM_Y, BZ);
  const corner = (su: number, sv: number) => add3(add3(C, mul3(u, su * hw)), v3(0, sv * hh, 0));
  const mir = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
  const back = mir.map((p) => add3(p, mul3(mirrorFrame(delta).n, -0.008)));
  parts.push(poly(b, back, '#3F5560'));
  parts.push(poly(b, mir, '#DDEAF0', {sw: 0.9}));
  parts.push(seg(b, add3(C, add3(mul3(u, -0.022), v3(0, 0.02, 0))), add3(C, add3(mul3(u, 0.004), v3(0, -0.006, 0))), '#FFFFFF', 1.2, {bias: -0.01}));
  // the internal beam (module -> mirror) only while the beam is being visualised: see Beam (drawn by the scene)
  const dB = depth(b, v3((P.x0 + P.x1) / 2, P.y + 0.05, (P.z0 + P.z1) / 2));
  parts.forEach((x, i) => x && it.push({...x, d: dB - i * 0.00005}));
  // ---- the side table and the driver on it (its own depth group)
  const dparts: (Item | null)[] = [];
  dparts.push(box(b, TBL.x0, TBL.x1, TBL.y - 0.03, TBL.y, TBL.z0, TBL.z1, {top: '#E8D2A8', front: '#C9924F', side: '#9E6B30'}));
  [[TBL.x0 + 0.03, TBL.z0 + 0.03], [TBL.x1 - 0.03, TBL.z0 + 0.03], [TBL.x0 + 0.03, TBL.z1 - 0.03], [TBL.x1 - 0.03, TBL.z1 - 0.03]].forEach(([x, z]) => dparts.push(box(b, x - 0.018, x + 0.018, 0, TBL.y - 0.03, z - 0.018, z + 0.018, '#6E8390')));
  // driver box: her voice in on the cable; dial (turned for the sweep), the send button (pressed for the demo),
  // a row of status lights and a small level meter
  dparts.push(box(b, DRV.x0, DRV.x1, DRV.y0, DRV.y1, DRV.z0, DRV.z1, '#3F5560'));
  const da = ((o.dial ?? 0) * Math.PI) / 180;
  dparts.push(cyl(b, v3(DIAL.x, DRV.y1, DIAL.z), 'y', 0.014, 0.026, '#FFC744', {cap: '#FFD86E'}));
  dparts.push(seg(b, v3(DIAL.x, DRV.y1 + 0.0145, DIAL.z), v3(DIAL.x + Math.cos(da) * 0.022, DRV.y1 + 0.0145, DIAL.z + Math.sin(da) * 0.022), INK, 1, {bias: -0.02}));
  const press = o.press ?? 0, send = o.send ?? 0;
  dparts.push(cyl(b, v3(BUTTON.x, DRV.y1, BUTTON.z), 'y', 0.012 - 0.008 * press, 0.022, send > 0.5 ? '#FF7A62' : '#EF6B55', {cap: send > 0.5 ? '#FFB3A3' : '#F58A76'}));
  [0, 1, 2].forEach((k) => {
    const q = proj(b, v3(DRV.x0 + 0.04 + k * 0.03, DRV.y1 - 0.025, DRV.z0 - 0.001));
    if (q.z < 0.05) return;
    const r = Math.max(1, (b.c.f * 0.007) / q.z);
    const lit = k === 0 ? on : k === 1 ? send : on * (0.5 + 0.5 * Math.sin(t * 9));
    dparts.push({d: 0, node: <circle key={`st${k}`} cx={q.x} cy={q.y} r={r} fill={lit > 0.5 ? ['#3FD18A', '#FF7A62', '#FFC744'][k] : '#26353C'} stroke={INK} strokeWidth={r * 0.35} />});
  });
  const dT = depth(b, v3((TBL.x0 + TBL.x1) / 2, TBL.y, (TBL.z0 + TBL.z1) / 2));
  dparts.forEach((x, i) => x && it.push({...x, d: x.d === 0 ? dT - 0.0001 * i : dT - i * 0.00005}));
  // the signal lead from the driver up to the laser module
  it.push(seg(b, v3(DRV.x1, DRV.y0 + 0.05, DRV.z1 - 0.05), v3(MOD.x - 0.04, PLATE.y - 0.02, MOD.z1 - 0.04), INK, 2.6));
  it.push(seg(b, v3(DRV.x1, DRV.y0 + 0.05, DRV.z1 - 0.05), v3(MOD.x - 0.04, PLATE.y - 0.02, MOD.z1 - 0.04), '#2E4A55', 1.4, {bias: -0.001}));
  // ---- the cable from the driver down the tripod and across the floor to the cart (her voice)
  const cab = [v3(DRV.x0 - 0.005, DRV.y0 + 0.04, DRV.z0 + 0.15), v3(TBL.x0 + 0.03, 0.6, DRV.z0 + 0.15), v3(TBL.x0 + 0.02, 0.02, DRV.z0 + 0.2), v3(HUB.x - 0.55, 0.01, HUB.z + 0.6), v3(CART.x1 - 0.1, 0.01, CART.z0 + 0.1), v3(CART.x1 - 0.1, CART.y, CART.z0 + 0.1)];
  for (let i = 0; i < cab.length - 1; i++) {
    const L = i >= 2 && i <= 3 ? -1 : undefined;
    it.push(seg(b, cab[i], cab[i + 1], INK, 3.4, {layer: L}));
    it.push(seg(b, cab[i], cab[i + 1], '#2E4A55', 2, {layer: L, bias: -0.001}));
  }
  // ---- the cart: shelves, a waveform monitor (her voice's envelope, live), a signal box with knobs, a laptop
  const Cc = CART;
  it.push(box(b, Cc.x0, Cc.x1, Cc.y - 0.04, Cc.y, Cc.z0, Cc.z1, '#9FB0BA'));
  it.push(box(b, Cc.x0, Cc.x1, 0.2, 0.24, Cc.z0, Cc.z1, '#9FB0BA'));
  [[Cc.x0 + 0.02, Cc.z0 + 0.02], [Cc.x1 - 0.02, Cc.z0 + 0.02], [Cc.x0 + 0.02, Cc.z1 - 0.02], [Cc.x1 - 0.02, Cc.z1 - 0.02]].forEach(([x, z]) => {
    it.push(cyl(b, v3(x, 0.05, z), 'y', Cc.y - 0.05, 0.014, '#6E8390'));
    it.push(cyl(b, v3(x, 0, z), 'y', 0.05, 0.03, '#2E4A55'));
  });
  it.push(box(b, Cc.x0 + 0.05, Cc.x1 - 0.05, 0.24, 0.44, Cc.z0 + 0.06, Cc.z1 - 0.06, '#3F5560'));
  it.push(box(b, Cc.x0 + 0.04, Cc.x1 - 0.04, Cc.y, Cc.y + 0.32, Cc.z0 + 0.12, Cc.z1 - 0.04, '#2E4A55'));
  const sx0 = Cc.x0 + 0.07, sx1 = Cc.x1 - 0.07, sy0 = Cc.y + 0.05, sy1 = Cc.y + 0.28, sz = Cc.z0 + 0.118;
  it.push(poly(b, [v3(sx0, sy0, sz), v3(sx1, sy0, sz), v3(sx1, sy1, sz), v3(sx0, sy1, sz)], '#10302A', {bias: -0.05}));
  const N = 24;
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    const yA = (uu: number) => (sy0 + sy1) / 2 + on * 0.07 * Math.sin(uu * 22 + t * 9) * (0.5 + 0.5 * Math.sin(uu * 5 - t * 3));
    it.push(seg(b, v3(sx0 + (sx1 - sx0) * u0, yA(u0), sz - 0.002), v3(sx0 + (sx1 - sx0) * u1, yA(u1), sz - 0.002), '#5BE08A', 0.7, {bias: -0.1}));
  }
  [0.1, 0.2, 0.3].forEach((dx, i) => it.push(cyl(b, v3(Cc.x0 + 0.05 + dx, 0.34, Cc.z0 + 0.055), 'z', -0.012, 0.018, ['#EF6B55', '#FFC744', '#1CA7A0'][i])));
  return it;
};

/** The beam visualisation: a pale dashed path from the mirror to `end` with light packets travelling along it, the
 *  module's internal leg into the mirror, and (optionally) the swept fan and the sound rings that gather where the
 *  sweep converges. vis: overall visibility (only inside explanatory windows); prog: the front of a fresh pulse
 *  (0..1) when it is drawn travelling. */
export const Beam: React.FC<{b: B; t: number; end: V3; vis: number; prog?: number; hit?: number; rings?: number; ghosts?: V3[]; wavelets?: {c: V3; r: number; op: number}[]}> = ({b, t, end, vis, prog = 1, hit = 0, rings = 0, ghosts = [], wavelets = []}) => {
  if (vis <= 0.001) return null;
  const P = (p: V3) => proj(b, p);
  const leg = (A0: V3, E0: V3, op: number, key: string, packets = true) => {
    let a = A0;
    const e = lerp3(A0, E0, prog);
    const da = depth(b, a), de = depth(b, e);
    if (de < 0.06) return null;
    if (da < 0.06) a = lerp3(a, e, (0.06 - da) / (de - da));
    const pa = P(a), pe = P(e);
    const wA = clamp(1, 4.5, (b.c.f * 0.0055) / pa.z), wE = clamp(1, 4.5, (b.c.f * 0.0055) / pe.z);
    const dx = pe.x - pa.x, dy = pe.y - pa.y, dl = Math.hypot(dx, dy) || 1;
    const nx = -dy / dl, ny = dx / dl;
    const rib = (k: number) => `M${pa.x + nx * wA * k},${pa.y + ny * wA * k}L${pe.x + nx * wE * k},${pe.y + ny * wE * k}L${pe.x - nx * wE * k},${pe.y - ny * wE * k}L${pa.x - nx * wA * k},${pa.y - ny * wA * k}Z`;
    const L = len3(sub3(e, a));
    const dir = norm3(sub3(e, a));
    const pk: React.ReactNode[] = [];
    if (packets) {
      const sp = 0.2, off = (t * 1.2) % sp;
      for (let s = off; s < L; s += sp) {
        const q = P(add3(a, mul3(dir, s)));
        if (q.z < 0.06) continue;
        const r = clamp(1.4, 6, (b.c.f * 0.0075) / q.z);
        const fade = Math.min(1, s / 0.08, (L - s) / 0.06);
        pk.push(<ellipse key={s.toFixed(3)} cx={q.x} cy={q.y} rx={r * 1.3} ry={r * 0.7} transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI} ${q.x} ${q.y})`} fill="#FFF4EC" opacity={0.9 * fade} />);
      }
    }
    const dash = `${Math.max(4, wA * 3)} ${Math.max(3, wA * 2)}`;
    return (
      <g key={key} opacity={op}>
        <path d={rib(2.2)} fill="#FFC2B2" opacity={0.13} />
        <line x1={pa.x} y1={pa.y} x2={pe.x} y2={pe.y} stroke="#FFD9CE" strokeWidth={Math.max(1.5, (wA + wE) * 0.55)} strokeDasharray={dash} strokeDashoffset={-t * 60} strokeLinecap="round" />
        {pk}
      </g>
    );
  };
  const pe = P(end);
  const hr = Math.max(4, (b.c.f * 0.03) / Math.max(0.1, pe.z));
  return (
    <g opacity={vis}>
      {leg(v3(MOD.x, MOD.y, MOD.z0 - 0.02), v3(LENS.x, BEAM_Y, BZ), 0.9, 'in', false)}
      {ghosts.map((g, i) => leg(v3(LENS.x, BEAM_Y, BZ), g, 0.12 + 0.08 * i, `g${i}`, false))}
      {leg(v3(LENS.x, BEAM_Y, BZ), end, 1, 'main')}
      {/* the sweep's sound: each point the beam passes sends out a little wave; because the beam moves at the speed
          of sound, they all arrive together where the pass ends, at her */}
      {wavelets.map((w, i) => {
        const q = P(w.c);
        if (q.z < 0.08) return null;
        const r = (b.c.f * w.r) / q.z;
        return <circle key={`w${i}`} cx={q.x} cy={q.y} r={Math.max(0.5, r)} fill="none" stroke="#FFC744" strokeWidth={Math.max(1.2, (b.c.f * 0.006) / q.z)} opacity={w.op} />;
      })}
      {rings > 0 && pe.z > 0.06 && [0, 1, 2].map((k) => {
        const ph = (t / 0.6 + k / 3) % 1;
        return <circle key={`r${k}`} cx={pe.x} cy={pe.y} r={hr * (1 + 5 * ph)} fill="none" stroke="#FFC744" strokeWidth={Math.max(1.5, hr * 0.28) * (1 - ph)} opacity={rings * (1 - ph)} />;
      })}
      {hit > 0 && pe.z > 0.06 && <g opacity={hit}><circle cx={pe.x} cy={pe.y} r={hr} fill="#FFB8A6" opacity={0.35} /><circle cx={pe.x} cy={pe.y} r={hr * 0.42} fill="#FFF4EC" opacity={0.85} /></g>}
      
    </g>
  );
};
