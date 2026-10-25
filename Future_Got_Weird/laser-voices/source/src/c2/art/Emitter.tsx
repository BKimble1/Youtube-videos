// The laser emitter on its tripod, the equipment cart beside it and the beam, as flat Crew solids in the shared world.
// The housing's lens sits exactly at LENS and points +x, down the lane to her ear.
import React from 'react';
import {INK} from '../rig/cast';
import {add3, B, len3, lerp3, mul3, norm3, proj, sub3, V3, v3} from '../rig/geo';
import {box, cyl, depth, inkPx, Item, poly, seg} from './d3';
import {BEAM_Y, BZ, EM, LENS} from '../world';

const E = {
  x0: LENS.x - 0.46, x1: LENS.x - 0.08, y0: BEAM_Y - 0.085, y1: BEAM_Y + 0.085, z0: BZ - 0.09, z1: BZ + 0.09,
};
/** the rear control dial's world point (where the operator's hand goes) */
export const DIAL = v3(E.x0 - 0.05, BEAM_Y + 0.0, BZ + 0.03);
export const CART = {x0: LENS.x - 1.75, x1: LENS.x - 1.2, z0: BZ + 1.35, z1: BZ + 1.8, y: 0.82};

/** o.on: the emitter's LED and lens glow (0..1); o.dial: the dial's turn (deg) */
export const emitterItems = (b: B, t: number, o: {on?: number; dial?: number; open?: number; spin?: number} = {}): (Item | null)[] => {
  const it: (Item | null)[] = [];
  const on = o.on ?? 1;
  // tripod: three legs, a centre column, a pan head
  const hub = v3(EM.x, 0.92, BZ);
  [90, 210, 330].forEach((a) => {
    const r = (a * Math.PI) / 180;
    const foot = v3(EM.x + Math.cos(r) * 0.36, 0, BZ + Math.sin(r) * 0.36);
    it.push(seg(b, hub, foot, INK, 3.6));
    it.push(seg(b, hub, foot, '#3F5560', 2.4, {bias: -0.001}));
    it.push(cyl(b, foot, 'y', 0.025, 0.035, '#2E4A55'));
  });
  it.push(cyl(b, v3(EM.x, 0.86, BZ), 'y', 0.1, 0.05, '#3F5560'));
  it.push(cyl(b, v3(EM.x, 0.96, BZ), 'y', BEAM_Y - 0.96 - 0.13, 0.022, '#9FB0BA'));
  it.push(box(b, EM.x - 0.07, EM.x + 0.07, BEAM_Y - 0.135, BEAM_Y - 0.085, BZ - 0.07, BZ + 0.07, '#2E4A55'));
  // the housing: cream body, teal stripe, cooling fins on top, the rear control block with its dial
  const body: (Item | null)[] = [];
  const open = o.open ?? 0;
  if (open < 0.002) {
    // closed: the housing, with the same stripe and fins the hood carries when it opens (so nothing changes shape
    // as it starts to open)
    body.push(box(b, E.x0, E.x1, E.y0, E.y1, E.z0, E.z1, {top: '#FFFFFF', front: '#FFF6E0', side: '#E6D9BA'}));
    [[E.z0 - 0.004, -1], [E.z1 + 0.004, 1]].forEach(([z, nz]) => body.push(poly(b, [v3(E.x0 + 0.02, E.y0 + 0.03, z), v3(E.x1 - 0.02, E.y0 + 0.03, z), v3(E.x1 - 0.02, E.y0 + 0.065, z), v3(E.x0 + 0.02, E.y0 + 0.065, z)], '#1CA7A0', {n: v3(0, 0, nz)})));
    for (let i = 0; i < 6; i++) {
      const x = E.x0 + 0.069 + i * 0.045;
      body.push(poly(b, [v3(x, E.y1, E.z0 + 0.02), v3(x, E.y1, E.z1 - 0.02), v3(x, E.y1 + 0.03, E.z1 - 0.02), v3(x, E.y1 + 0.03, E.z0 + 0.02)], '#9FB0BA'));
    }
  } else {
    // the hood (top and front, one piece) swings up and back on its rear hinge; inside, the optical train in a line:
    // diode -> collimating lens -> modulator (fed with her voice from the rear block) -> spinning wedge prism -> exit lens
    const a = (open * 112 * Math.PI) / 180;
    const hp = (x: number, y: number, z: number) => {
      const ry = y - E.y1, rz = z - E.z1;
      return v3(x, E.y1 + ry * Math.cos(a) - rz * Math.sin(a), E.z1 + ry * Math.sin(a) + rz * Math.cos(a));
    };
    const quad = (pts: V3[], c: string, opt = {}) => poly(b, pts, c, opt);
    const hood: (Item | null)[] = [];
    hood.push(quad([hp(E.x0, E.y1, E.z0), hp(E.x1, E.y1, E.z0), hp(E.x1, E.y1, E.z1), hp(E.x0, E.y1, E.z1)], '#FFFFFF'));
    hood.push(quad([hp(E.x0, E.y0 + 0.01, E.z0), hp(E.x1, E.y0 + 0.01, E.z0), hp(E.x1, E.y1, E.z0), hp(E.x0, E.y1, E.z0)], '#FFF6E0'));
    hood.push(quad([hp(E.x0 + 0.02, E.y0 + 0.03, E.z0 - 0.004), hp(E.x1 - 0.02, E.y0 + 0.03, E.z0 - 0.004), hp(E.x1 - 0.02, E.y0 + 0.065, E.z0 - 0.004), hp(E.x0 + 0.02, E.y0 + 0.065, E.z0 - 0.004)], '#1CA7A0'));
    for (let i = 0; i < 6; i++) {
      const x = E.x0 + 0.069 + i * 0.045;
      hood.push(quad([hp(x, E.y1, E.z0 + 0.02), hp(x, E.y1, E.z1 - 0.02), hp(x, E.y1 + 0.03, E.z1 - 0.02), hp(x, E.y1 + 0.03, E.z0 + 0.02)], '#9FB0BA'));
    }
    const inner: (Item | null)[] = [];
    const Y = BEAM_Y;
    inner.push(quad([v3(E.x0, E.y0, E.z0), v3(E.x1, E.y0, E.z0), v3(E.x1, E.y0, E.z1), v3(E.x0, E.y0, E.z1)], '#3F5560'));
    inner.push(quad([v3(E.x0, E.y0, E.z1), v3(E.x1, E.y0, E.z1), v3(E.x1, E.y1, E.z1), v3(E.x0, E.y1, E.z1)], '#E6D9BA'));
    inner.push(quad([v3(E.x0, E.y0, E.z0), v3(E.x0, E.y0, E.z1), v3(E.x0, E.y1, E.z1), v3(E.x0, E.y1, E.z0)], '#D9CBAA'));
    inner.push(quad([v3(E.x1, E.y0, E.z0), v3(E.x1, E.y0, E.z1), v3(E.x1, E.y1, E.z1), v3(E.x1, E.y1, E.z0)], '#D9CBAA'));
    // the beam inside: from the diode to the exit
    const xs = E.x0 + 0.097;
    inner.push(seg(b, v3(xs, Y, BZ), v3(E.x1 + 0.08, Y, BZ), '#EF6B55', 4.5 * on, {op: 0.35}));
    inner.push(seg(b, v3(xs, Y, BZ), v3(E.x1 + 0.08, Y, BZ), '#FF8A72', 1.8 * on));
    // diode module with its heat sink
    inner.push(box(b, E.x0 + 0.025, E.x0 + 0.085, Y - 0.04, Y + 0.04, BZ - 0.04, BZ + 0.04, '#2E4A55'));
    for (let i = 0; i < 4; i++) inner.push(box(b, E.x0 + 0.03 + i * 0.015, E.x0 + 0.037 + i * 0.015, Y + 0.04, Y + 0.065, BZ - 0.035, BZ + 0.035, '#6E8390'));
    inner.push(cyl(b, v3(E.x0 + 0.085, Y, BZ), 'x', 0.012, 0.014, '#3F5560', {cap: on > 0.5 ? '#FF7A62' : '#8A4A40'}));
    // collimating lens in its post holder
    inner.push(box(b, E.x0 + 0.12, E.x0 + 0.132, E.y0, Y - 0.03, BZ - 0.012, BZ + 0.012, '#9FB0BA'));
    inner.push(cyl(b, v3(E.x0 + 0.118, Y, BZ), 'x', 0.016, 0.036, '#3F5560', {cap: '#BFE8E3'}));
    // the modulator crystal, with the voice signal wires from the rear block
    inner.push(box(b, E.x0 + 0.165, E.x0 + 0.215, Y - 0.028, Y + 0.028, BZ - 0.028, BZ + 0.028, {top: '#9DC0F2', front: '#6F9BE0', side: '#4F7CC9'}));
    [[-0.02, '#FFC744'], [0.02, '#EF6B55']].forEach(([dz, c]) => {
      const zz = BZ + (dz as number);
      inner.push(seg(b, v3(E.x0 + 0.005, Y - 0.05, zz), v3(E.x0 + 0.1, E.y0 + 0.012, zz), c as string, 1.2));
      inner.push(seg(b, v3(E.x0 + 0.1, E.y0 + 0.012, zz), v3(E.x0 + 0.19, Y - 0.028, zz), c as string, 1.2));
    });
    // the wedge prism in its toothed ring, spun by a small motor through a belt
    const spin = o.spin ?? 0;
    inner.push(cyl(b, v3(E.x0 + 0.245, E.y0 + 0.03, BZ + 0.045), 'x', 0.04, 0.022, '#2E4A55', {cap: '#6E8390'}));
    inner.push(seg(b, v3(E.x0 + 0.285, E.y0 + 0.03, BZ + 0.045), v3(E.x0 + 0.27, Y - 0.05, BZ), INK, 1.4));
    inner.push(cyl(b, v3(E.x0 + 0.255, Y, BZ), 'x', 0.026, 0.058, '#9FB0BA', {cap: '#BFE8E3'}));
    const pc = (k: number) => v3(E.x0 + 0.282, Y + Math.cos(spin + k) * 0.045, BZ - Math.sin(spin + k) * 0.045);
    inner.push(seg(b, pc(0), pc(Math.PI), '#4F7CC9', 1.6, {bias: -0.02}));
    for (let i = 0; i < 12; i++) {
      const g0 = v3(E.x0 + 0.268, Y + Math.cos(spin + (i * Math.PI) / 6) * 0.062, BZ - Math.sin(spin + (i * Math.PI) / 6) * 0.062);
      const g1 = v3(E.x0 + 0.268, Y + Math.cos(spin + (i * Math.PI) / 6) * 0.07, BZ - Math.sin(spin + (i * Math.PI) / 6) * 0.07);
      inner.push(seg(b, g0, g1, INK, 1.4, {bias: 0.01}));
    }
    // paint order between hood and interior: whichever is farther first
    const dHood = depth(b, hp((E.x0 + E.x1) / 2, (E.y0 + E.y1) / 2, (E.z0 + E.z1) / 2));
    const dIn = depth(b, v3((E.x0 + E.x1) / 2, (E.y0 + E.y1) / 2, (E.z0 + E.z1) / 2));
    if (dHood > dIn) body.push(...hood, ...inner);
    else body.push(...inner, ...hood);
  }
  body.push(box(b, E.x0 - 0.04, E.x0, E.y0 + 0.01, E.y1 - 0.01, E.z0 + 0.01, E.z1 - 0.01, '#3F5560'));
  body.push(cyl(b, v3(DIAL.x - 0.005, DIAL.y, DIAL.z), 'x', 0.03, 0.03, '#FFC744', {cap: '#FFD86E'}));
  // the dial's pointer, turning with o.dial
  const da = ((o.dial ?? 0) * Math.PI) / 180;
  body.push(seg(b, v3(DIAL.x - 0.006, DIAL.y, DIAL.z), v3(DIAL.x - 0.006, DIAL.y + Math.cos(da) * 0.024, DIAL.z + Math.sin(da) * 0.024), INK, 0.9, {bias: -0.05}));
  // the lens barrel, its blue glass (a little glow when on), a status LED
  body.push(cyl(b, v3(E.x1, BEAM_Y, BZ), 'x', 0.075, 0.062, '#2E4A55', {cap: on > 0.5 ? '#6FA0E8' : '#4F7CC9'}));
  body.push(cyl(b, v3(E.x1 + 0.07, BEAM_Y, BZ), 'x', 0.012, 0.07, '#3F5560', {cap: '#6FA0E8'}));
  const led = proj(b, v3(E.x0 + 0.04, E.y1 + 0.004, BZ - 0.06));
  const lr = Math.max(1.5, inkPx(b, led.z, 2.2));
  body.push({d: depth(b, v3(E.x0 + 0.04, E.y1, BZ - 0.06)) - 0.3, node: <g key="led"><circle cx={led.x} cy={led.y} r={lr * 2.4} fill="#EF6B55" opacity={0.25 * on} /><circle cx={led.x} cy={led.y} r={lr} fill={on > 0.5 ? '#FF7A62' : '#8A4A40'} stroke={INK} strokeWidth={lr * 0.35} /></g>});
  // keep the housing's parts together: one depth for all of them (the housing's centre), small offsets keep order
  const dH = depth(b, v3((E.x0 + E.x1) / 2, BEAM_Y, BZ));
  body.forEach((x, i) => x && it.push({...x, d: dH - i * 0.0005}));
  // the cable: from the control block down the tripod, across the floor to the cart
  const cab = [v3(E.x0 - 0.02, BEAM_Y - 0.05, BZ + 0.05), v3(EM.x - 0.03, 1.0, BZ + 0.05), v3(EM.x - 0.05, 0.02, BZ + 0.12), v3(EM.x - 0.5, 0.01, BZ + 0.55), v3(CART.x1 - 0.1, 0.01, CART.z0 + 0.1), v3(CART.x1 - 0.1, CART.y, CART.z0 + 0.1)];
  for (let i = 0; i < cab.length - 1; i++) {
    const L = i >= 2 && i <= 3 ? -1 : undefined;
    it.push(seg(b, cab[i], cab[i + 1], INK, 3.4, {layer: L}));
    it.push(seg(b, cab[i], cab[i + 1], '#2E4A55', 2, {layer: L, bias: -0.001}));
  }
  // the cart: two shelves, a waveform monitor, a signal box with knobs
  const C = CART;
  it.push(box(b, C.x0, C.x1, C.y - 0.04, C.y, C.z0, C.z1, '#9FB0BA'));
  it.push(box(b, C.x0, C.x1, 0.2, 0.24, C.z0, C.z1, '#9FB0BA'));
  [[C.x0 + 0.02, C.z0 + 0.02], [C.x1 - 0.02, C.z0 + 0.02], [C.x0 + 0.02, C.z1 - 0.02], [C.x1 - 0.02, C.z1 - 0.02]].forEach(([x, z]) => {
    it.push(cyl(b, v3(x, 0.05, z), 'y', C.y - 0.05, 0.014, '#6E8390'));
    it.push(cyl(b, v3(x, 0, z), 'y', 0.05, 0.03, '#2E4A55'));
  });
  it.push(box(b, C.x0 + 0.05, C.x1 - 0.05, 0.24, 0.44, C.z0 + 0.06, C.z1 - 0.06, '#3F5560'));
  it.push(box(b, C.x0 + 0.04, C.x1 - 0.04, C.y, C.y + 0.32, C.z0 + 0.12, C.z1 - 0.04, '#2E4A55'));
  const sx0 = C.x0 + 0.07, sx1 = C.x1 - 0.07, sy0 = C.y + 0.05, sy1 = C.y + 0.28, sz = C.z0 + 0.118;
  it.push(poly(b, [v3(sx0, sy0, sz), v3(sx1, sy0, sz), v3(sx1, sy1, sz), v3(sx0, sy1, sz)], '#10302A', {bias: -0.05}));
  // the monitor's trace: her voice's envelope riding the carrier (live while the emitter is on)
  const N = 24;
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    const yA = (u: number) => (sy0 + sy1) / 2 + on * 0.07 * Math.sin(u * 22 + t * 9) * (0.5 + 0.5 * Math.sin(u * 5 - t * 3));
    it.push(seg(b, v3(sx0 + (sx1 - sx0) * u0, yA(u0), sz - 0.002), v3(sx0 + (sx1 - sx0) * u1, yA(u1), sz - 0.002), '#5BE08A', 0.7, {bias: -0.1}));
  }
  [0.1, 0.2, 0.3].forEach((dx, i) => it.push(cyl(b, v3(C.x0 + 0.05 + dx, 0.34, C.z0 + 0.055), 'z', -0.012, 0.018, ['#EF6B55', '#FFC744', '#1CA7A0'][i])));
  return it;
};

/** the beam: from the lens to `end` (the ear, or the near side of a blocking head). Drawn as a pale coral path with
 *  pulses travelling along it (the voice's pressure packets), so a block reads with the sound off: pulses stop where
 *  the beam stops. vis: overall visibility (the path is drawn when the narration calls it out); prog: how far the
 *  beam front has travelled (0..1), for its switch-on. */
export const Beam: React.FC<{b: B; t: number; end: V3; vis: number; prog?: number; hit?: number; pulses?: number; sweep?: number; rings?: number}> = ({b, t, end, vis, prog = 1, hit = 0, pulses = 1, sweep = 0, rings = 0}) => {
  if (vis <= 0.001) return null;
  if (sweep > 0.001) {
    // the sweep: the beam's far end swings across her ear; three fading ghosts trace the fan behind it
    const A = 0.16 * sweep, w = 2 * Math.PI * 1.6;
    const at = (tt: number) => v3(end.x, end.y + 0.25 * A * Math.sin(w * tt * 0.5), end.z + A * Math.sin(w * tt));
    return (
      <g>
        {[0.15, 0.1, 0.05].map((dt, i) => <Beam key={i} b={b} t={t} end={at(t - dt)} vis={vis * (0.18 + 0.1 * i) * sweep} pulses={0} />)}
        <Beam b={b} t={t} end={at(t)} vis={vis} hit={hit} pulses={pulses} rings={rings} />
      </g>
    );
  }
  let a = v3(LENS.x + 0.012, LENS.y, LENS.z);
  const e = lerp3(a, end, prog);
  // clip the near end to the camera's near plane (the lens can be behind the camera in a close-up on her)
  const da = depth(b, a), de = depth(b, e);
  if (de < 0.06) return null;
  if (da < 0.06) a = lerp3(a, e, (0.06 - da) / (de - da));
  const P = (p: V3) => proj(b, p);
  const pa = P(a), pe = P(e);
  if (pa.z < 0.05 || pe.z < 0.05) return null;
  const L = len3(sub3(e, a));
  const wA = Math.max(1.5, (b.c.f * 0.012) / pa.z), wE = Math.max(1.5, (b.c.f * 0.012) / pe.z);
  // a tapered ribbon (wider near the camera)
  const dx = pe.x - pa.x, dy = pe.y - pa.y, dl = Math.hypot(dx, dy) || 1;
  const nx = -dy / dl, ny = dx / dl;
  const rib = (k: number) => `M${pa.x + nx * wA * k},${pa.y + ny * wA * k}L${pe.x + nx * wE * k},${pe.y + ny * wE * k}L${pe.x - nx * wE * k},${pe.y - ny * wE * k}L${pa.x - nx * wA * k},${pa.y - ny * wA * k}Z`;
  // pulses every 0.18 m, moving at a readable 1.1 m/s
  const dir = norm3(sub3(end, a));
  const pts: React.ReactNode[] = [];
  const sp = 0.18;
  const off = (t * 1.1) % sp;
  for (let s = off; s < L; s += sp) {
    const q = P(add3(a, mul3(dir, s)));
    if (q.z < 0.06) continue;
    const r = Math.max(1.8, (b.c.f * 0.011) / q.z);
    const fade = Math.min(1, s / 0.08, (L - s) / 0.06);
    pts.push(<ellipse key={s.toFixed(3)} cx={q.x} cy={q.y} rx={r * 1.25} ry={r * 0.75} transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI} ${q.x} ${q.y})`} fill="#FFF1E8" opacity={0.85 * fade * pulses} />);
  }
  const hr = Math.max(4, (b.c.f * 0.03) / pe.z);
  return (
    <g opacity={vis}>
      <path d={rib(2.6)} fill="#EF6B55" opacity={0.16} />
      <path d={rib(1)} fill="#FF8A72" opacity={0.75} />
      <path d={rib(0.35)} fill="#FFE3DA" opacity={0.9} />
      {pts}
      {rings > 0 && [0, 1, 2].map((k) => {
        const ph = ((t / 0.6 + k / 3) % 1);
        const R = hr * (1 + 5 * ph);
        return <circle key={`r${k}`} cx={pe.x} cy={pe.y} r={R} fill="none" stroke="#FFC744" strokeWidth={Math.max(1.5, hr * 0.28) * (1 - ph)} opacity={rings * (1 - ph)} />;
      })}
      {hit > 0 && <g opacity={hit}><circle cx={pe.x} cy={pe.y} r={hr} fill="#EF6B55" opacity={0.28} /><circle cx={pe.x} cy={pe.y} r={hr * 0.45} fill="#FFE3DA" opacity={0.8} /></g>}
    </g>
  );
};
