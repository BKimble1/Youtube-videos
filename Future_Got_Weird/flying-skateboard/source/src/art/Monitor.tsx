// V2: the monitoring phones. Two phones stand on small tripods at the edge of the practice pad, their rear cameras
// aimed at the rider. The screen (facing away from him) shows what the phone sees: a live mini view of the rider and
// board, traced from the actual pose through the phone's own lens, a tilt bar that follows the board's roll, and a
// small speaker glyph that pulses when the coach cue goes out over the earpiece link. Device UI only: no floating
// panels, bubbles or radial graphics.
import React from 'react';
import {BD} from '../art/Board';
import {PilotJ} from '../art/rig';
import {INK} from '../dc/ink';
import {f2, polyD} from '../eng/draw';
import {a3, c3, d3, Frame, H, lens, Lens, m3, n3, s3, toW, V3, v3, W} from '../eng/v3';

export const TripodPhone: React.FC<{id: string; L: Lens; base: V3; aim: V3; j: PilotJ; B: Frame; roll: number; pulse: number}> = ({id, L, base, aim, j, B, roll, pulse}) => {
  const C = a3(base, v3(0, 1.22, 0));
  if (d3(s3(C, L.pos), L.f) < 0.1) return null;
  const fwd = n3(s3(aim, C));
  const up0 = v3(0, 1, 0);
  const right = n3(c3(up0, fwd));
  const up = n3(c3(fwd, right));
  const hw = 0.04, hh = 0.08;
  const S = (x: number, y: number, z = 0) => L.p(a3(a3(a3(C, m3(right, x)), m3(up, y)), m3(fwd, z)));
  const body = [S(-hw, -hh), S(hw, -hh), S(hw, hh), S(-hw, hh)];
  const kc = L.p(C).k;
  const w = Math.max(0.8, Math.min(3, kc * 0.004));
  // the screen faces back, away from the rider: visible when the camera is behind the phone
  const screenVis = d3(n3(s3(L.pos, C)), fwd) < -0.05;
  // tripod
  const legs = [0, 1, 2].map((k) => {
    const a = (k * Math.PI * 2) / 3 + 0.4;
    const foot = a3(base, v3(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32));
    const head = a3(base, v3(0, 1.0, 0));
    if (d3(s3(foot, L.pos), L.f) < 0.1) return null;
    const p0 = L.p(head), p1 = L.p(foot);
    return <path key={k} d={`M${f2(p0.x)},${f2(p0.y)} L${f2(p1.x)},${f2(p1.y)}`} stroke="#2B3138" strokeWidth={f2(Math.max(1, 0.018 * p0.k))} strokeLinecap="round" />;
  });
  const mast = (() => {
    const a = L.p(a3(base, v3(0, 1.0, 0))), b = L.p(a3(C, m3(up, -hh)));
    return <path d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke="#2B3138" strokeWidth={f2(Math.max(1, 0.02 * a.k))} />;
  })();
  // the phone's own view of the rider, mapped into its screen
  let screen: React.ReactNode = null;
  if (screenVis) {
    const PL = lens({pos: C, tgt: aim, fov: 46});
    const map = (q: V3) => {
      const p = PL.p(q);
      const nx = (p.x - W / 2) / (H / 2), ny = (p.y - H / 2) / (H / 2);
      // the viewer sees the screen from behind the phone: screen-right is the phone's right
      return S(Math.max(-0.95, Math.min(0.95, nx * 1.9)) * hw * 0.92, Math.max(-0.95, Math.min(0.95, -ny)) * hh * 0.85, -0.002);
    };
    const bones: [V3, V3][] = [[j.ankF, j.kneeF], [j.kneeF, j.hipF], [j.ankR, j.kneeR], [j.kneeR, j.hipR], [j.P, j.S], [j.shF, j.elbF], [j.elbF, j.wriF], [j.shR, j.elbR], [j.elbR, j.wriR], [j.shF, j.shR]];
    const fig = bones.map(([a, b]) => {
      const pa = map(a), pb = map(b);
      return `M${f2(pa.x)},${f2(pa.y)}L${f2(pb.x)},${f2(pb.y)}`;
    }).join('');
    const hc = map(j.Hc);
    const deck = [BD.outline[0], BD.outline[9]].map(([x, z]) => map(toW(B, v3(x, 0, z))));
    // tilt bar along the bottom of the screen
    const ok = Math.abs(roll) < 4;
    const r = (roll * Math.PI) / 180;
    const t0 = S(-hw * 0.6 * Math.cos(r), -hh * 0.78 - hw * 0.6 * Math.sin(r), -0.002), t1 = S(hw * 0.6 * Math.cos(r), -hh * 0.78 + hw * 0.6 * Math.sin(r), -0.002);
    const spk = S(hw * 0.62, hh * 0.78, -0.002);
    const sw = Math.max(0.6, 0.0035 * kc);
    screen = (
      <g>
        <path d={polyD([S(-hw * 0.9, -hh * 0.92, -0.001), S(hw * 0.9, -hh * 0.92, -0.001), S(hw * 0.9, hh * 0.92, -0.001), S(-hw * 0.9, hh * 0.92, -0.001)])} fill="#123446" />
        <path d={fig} stroke="#E8F6FF" strokeWidth={f2(sw * 1.4)} strokeLinecap="round" fill="none" />
        <circle cx={f2(hc.x)} cy={f2(hc.y)} r={f2(0.006 * kc)} fill="#E8F6FF" />
        <path d={`M${f2(deck[0].x)},${f2(deck[0].y)} L${f2(deck[1].x)},${f2(deck[1].y)}`} stroke="#46CFFF" strokeWidth={f2(sw * 2)} strokeLinecap="round" />
        <path d={`M${f2(t0.x)},${f2(t0.y)} L${f2(t1.x)},${f2(t1.y)}`} stroke={ok ? '#21D19F' : '#FFB347'} strokeWidth={f2(sw * 2)} strokeLinecap="round" />
        {[0, 1, 2].map((a) => (
          <path key={a} d={`M${f2(spk.x + (a + 1) * 0.004 * kc)},${f2(spk.y - (a + 1) * 0.004 * kc)} q${f2(0.003 * kc)},${f2((a + 1) * 0.004 * kc)} 0,${f2((a + 1) * 0.008 * kc)}`} fill="none" stroke="#9BE8FF" strokeWidth={f2(sw)} opacity={0.35 + 0.65 * Math.max(0, pulse - a * 0.25)} />
        ))}
        <circle cx={f2(spk.x)} cy={f2(spk.y)} r={f2(0.0035 * kc)} fill="#9BE8FF" opacity={0.5 + 0.5 * pulse} />
      </g>
    );
  }
  const lensDot = !screenVis ? (() => {
    const q = S(hw * 0.45, hh * 0.72, 0.004);
    return <circle cx={f2(q.x)} cy={f2(q.y)} r={f2(0.008 * kc)} fill="#0A0E12" stroke="#59636F" strokeWidth={f2(w * 0.6)} />;
  })() : null;
  return (
    <g>
      {legs}
      {mast}
      <path d={polyD(body)} fill="#1D232B" stroke={INK} strokeWidth={f2(w * 2)} strokeLinejoin="round" paintOrder="stroke" />
      {screen}
      {lensDot}
    </g>
  );
};
