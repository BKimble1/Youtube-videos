// HOOK 09 effects, drawn in screen space from world positions (precise at any zoom):
// the water jet from the claw, the cavitation bubble (nucleation, growth, Rayleigh-like collapse with a re-entrant
// dimple, rebound micro-bubbles), the pinpoint flash at the collapse point and one physical shockwave front.
import React from 'react';
import {INK} from '../shared/ink';
import {clamp, closedPath, hash, sm} from '../shared/lib';
import {rgba} from '../shared/color';
import {add, fmt, mul, V} from './math';
import {bubbleC, bubbleR, bubbleX, Cam, FLOOR_Y, HORIZON_Y, JET_DIR, NOZZLE, PC, RMAX, ringR, T, toScreen} from './timeline';

const perpJ: V = {x: -JET_DIR.y, y: JET_DIR.x};

/** jet: a streaming cone from the claw tip along the jet axis */
export const Jet: React.FC<{cam: Cam; t: number}> = ({cam, t}) => {
  if (t < T.jet) return null;
  const dt = t - T.jet;
  const Rb = bubbleR(t);
  const front = Math.max(6.0 * (1 - Math.exp(-dt / 0.08)), bubbleX(Math.min(t, T.collapse)) + Rb * 1.15);
  const bc = toScreen(cam, bubbleC(t));
  const alpha = clamp(dt / 0.05) * (1 - 0.85 * sm((t - 2.3) / 1.1)) * (t > T.collapse ? Math.max(0, 1 - (t - T.collapse) / 0.4) : 1);
  if (alpha <= 0.01) return null;
  const hw = (x: number) => 0.24 + 0.2 * x;
  const W = (x: number, o: number) => toScreen(cam, add(add(NOZZLE, mul(JET_DIR, x)), mul(perpJ, o * hw(x))));
  const n = 14;
  const top: V[] = [], bot: V[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (front * i) / n;
    top.push(W(x, 1));
    bot.push(W(x, -1));
  }
  const cone = 'M' + top.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L') + ' L' + bot.reverse().map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L') + ' Z';
  const a0 = toScreen(cam, NOZZLE), a1 = toScreen(cam, add(NOZZLE, mul(JET_DIR, front)));
  const clock = 2.2 * dt + 6 * (1 - Math.exp(-dt / 0.06)); // mm streamed (fast at first, slow-motion after)
  const dash = 0.42 * cam.s, gap = 0.36 * cam.s;
  const lines = [-0.75, -0.42, -0.12, 0.18, 0.48, 0.8];
  return (
    <g opacity={alpha} mask={Rb > 0 ? 'url(#h9-jetmask)' : undefined}>
      <defs>
        <mask id="h9-jetmask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1480" height="2320">
          <rect x="-200" y="-200" width="1480" height="2320" fill="#FFF" />
          <circle cx={fmt(bc.x)} cy={fmt(bc.y)} r={fmt(Rb * cam.s * 0.98)} fill="#000" />
        </mask>
        <linearGradient id="h9-jet" gradientUnits="userSpaceOnUse" x1={fmt(a0.x)} y1={fmt(a0.y)} x2={fmt(a1.x)} y2={fmt(a1.y)}>
          <stop offset="0" stopColor="#E8FAFF" stopOpacity="0.72" />
          <stop offset="0.5" stopColor="#CDEFF4" stopOpacity="0.36" />
          <stop offset="1" stopColor="#CDEFF4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={cone} fill="url(#h9-jet)" />
      {lines.map((o, i) => {
        const x0 = 0.1 + 0.15 * hash(i * 3.3);
        const p = W(x0, o), q = W(front * (0.8 + 0.15 * hash(i)), o * 1.05);
        return (
          <line key={i} x1={fmt(p.x)} y1={fmt(p.y)} x2={fmt(q.x)} y2={fmt(q.y)} stroke="#F2FDFF" strokeOpacity={0.55 - Math.abs(o) * 0.25}
            strokeWidth={fmt(Math.max(1.8, 0.05 * cam.s))} strokeLinecap="round" strokeDasharray={`${fmt(dash * (0.7 + 0.5 * hash(i * 9)))} ${fmt(gap)}`}
            strokeDashoffset={fmt(-(clock + hash(i * 5)) * cam.s)} />
        );
      })}
    </g>
  );
};

/** one glossy, refractive air/vapour bubble, drawn at screen centre c with radius R px along the jet frame */
const BubbleShape: React.FC<{id: string; c: V; R: number; flat?: number; dimple?: number; wob?: number; ph?: number; detail?: boolean}> = ({id, c, R, flat = 0, dimple = 0, wob = 0, ph = 0, detail = true}) => {
  const N = 40;
  const ang0 = Math.atan2(JET_DIR.y, JET_DIR.x);
  const P: V[] = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const rel = th; // angle from the jet direction
    let r = R * (1 - flat * Math.cos(rel) ** 2);
    const back = Math.cos(rel - Math.PI);
    r *= 1 - dimple * Math.exp(-(((1 - back) / 0.35) ** 2));
    r *= 1 + wob * (Math.sin(3 * th + ph) * 0.6 + Math.sin(5 * th - ph * 1.3) * 0.4);
    P.push({x: c.x + Math.cos(th + ang0) * r, y: c.y + Math.sin(th + ang0) * r});
  }
  const d = closedPath(P, 1);
  const rim = Math.max(1.1, R * 0.03);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-f`} cx="0.53" cy="0.56" r="0.52">
          <stop offset="0" stopColor="#CDEFEF" stopOpacity="0.14" />
          <stop offset="0.55" stopColor="#A9D8DC" stopOpacity="0.18" />
          <stop offset="0.8" stopColor="#2E6670" stopOpacity="0.42" />
          <stop offset="0.94" stopColor="#123A44" stopOpacity="0.7" />
          <stop offset="1" stopColor="#DDF6FA" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={`${id}-c`} cx="0.5" cy="0.0" r="0.9">
          <stop offset="0" stopColor="#F4FFF8" stopOpacity="0" />
          <stop offset="0.75" stopColor="#F4FFF8" stopOpacity="0" />
          <stop offset="0.92" stopColor="#F4FFF8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#F4FFF8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-h`}>
          <stop offset="0.82" stopColor="#0E2F36" stopOpacity="0" />
          <stop offset="0.92" stopColor="#0E2F36" stopOpacity="0.22" />
          <stop offset="1" stopColor="#0E2F36" stopOpacity="0" />
        </radialGradient>
      </defs>
      {detail && <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(R * 1.18)} fill={`url(#${id}-h)`} />}
      <path d={d} fill={INK} stroke={INK} strokeWidth={fmt(Math.max(2, rim * 2.2))} strokeOpacity={0.55} fillOpacity={0} />
      <path d={d} fill={`url(#${id}-f)`} />
      {/* light from above refracted to the bottom of the bubble (a diverging lens) */}
      {detail && <path d={d} fill={`url(#${id}-c)`} transform={`rotate(180 ${fmt(c.x)} ${fmt(c.y)})`} />}
      <path d={d} fill="none" stroke="#E6FAFF" strokeOpacity={0.85} strokeWidth={fmt(rim)} />
      {/* window highlight and a small secondary glint */}
      <ellipse cx={fmt(c.x - R * 0.38)} cy={fmt(c.y - R * 0.42)} rx={fmt(R * 0.26)} ry={fmt(R * 0.13)} transform={`rotate(-38 ${fmt(c.x - R * 0.38)} ${fmt(c.y - R * 0.42)})`} fill="#FFFFFF" opacity={0.85} />
      <circle cx={fmt(c.x - R * 0.12)} cy={fmt(c.y - R * 0.6)} r={fmt(Math.max(0.8, R * 0.05))} fill="#FFFFFF" opacity={0.8} />
      {detail && <path d={`M${fmt(c.x + R * 0.55)},${fmt(c.y + R * 0.45)} Q${fmt(c.x + R * 0.72)},${fmt(c.y + R * 0.1)} ${fmt(c.x + R * 0.68)},${fmt(c.y - R * 0.2)}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={fmt(Math.max(1, R * 0.035))} strokeLinecap="round" />}
    </g>
  );
};

export const Bubble: React.FC<{cam: Cam; t: number}> = ({cam, t}) => {
  const out: React.ReactElement[] = [];
  // nucleation: a few micro-bubbles in the jet's low-pressure core that merge into one
  if (t >= T.nucleate - 0.03 && t < T.nucleate + 0.22) {
    const u = clamp((t - (T.nucleate - 0.03)) / 0.25);
    const c0 = bubbleC(T.nucleate);
    for (let i = 0; i < 7; i++) {
      const off = {x: (hash(i * 3.1) - 0.5) * 0.9 * (1 - u), y: (hash(i * 7.3) - 0.5) * 0.6 * (1 - u)};
      const p = add(c0, add(mul(JET_DIR, off.x), mul(perpJ, off.y)));
      const r = (0.03 + 0.05 * hash(i * 2.2)) * sm(u * 4) * (1 - sm((u - 0.6) / 0.4));
      if (r * cam.s > 0.8) out.push(<BubbleShape key={`n${i}`} id={`h9-nb${i}`} c={toScreen(cam, p)} R={r * cam.s} detail={false} />);
    }
  }
  const R = bubbleR(t);
  if (R > 0) {
    const uc = t > T.bubbleMax ? clamp((t - T.bubbleMax) / (T.collapse - T.bubbleMax)) : 0;
    const flat = -0.05 * (1 - uc) + 0.22 * uc ** 3;
    const dimple = 0.5 * uc ** 4;
    const wob = 0.012 + 0.03 * uc ** 3;
    out.push(<BubbleShape key="main" id="h9-bub" c={toScreen(cam, bubbleC(t))} R={R * cam.s} flat={flat} dimple={dimple} wob={wob} ph={t * 3} detail={R * cam.s > 30} />);
  }
  // rebound: a small cloud of micro-bubbles left at the collapse point, slowly dissolving
  if (t > T.collapse + 0.02 && t < T.collapse + 1.6) {
    const dt = t - T.collapse;
    for (let i = 0; i < 9; i++) {
      const a = hash(i * 4.7) * Math.PI * 2, d = 0.05 + hash(i * 1.9) * 0.22;
      const p = add(add(PC, {x: Math.cos(a) * d * (1 + dt * 0.8), y: Math.sin(a) * d * (1 + dt * 0.8)}), mul(JET_DIR, dt * 0.12));
      const r = (0.025 + 0.05 * hash(i * 6.1)) * (0.6 + 0.6 * sm(dt / 0.12)) * (1 - sm((dt - 0.6) / 1.0));
      if (r * cam.s > 0.7) out.push(<BubbleShape key={`r${i}`} id={`h9-rb${i}`} c={toScreen(cam, p)} R={r * cam.s} detail={false} />);
    }
  }
  return <g>{out}</g>;
};

/** flash intensity: a single, very brief pinpoint at the collapse (stretched to a few frames by the slow motion) */
export const flashI = (t: number) => {
  const d = t - T.collapse;
  if (d < -0.0001) return 0;
  return Math.exp(-d / 0.075);
};

export const Flash: React.FC<{cam: Cam; t: number}> = ({cam, t}) => {
  const I = flashI(t);
  if (I < 0.01) return null;
  const c = toScreen(cam, PC);
  const g = 34 + 70 * I;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id="h9-flash">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={Math.min(1, I * 1.1)} />
          <stop offset="0.18" stopColor="#E4F3FF" stopOpacity={0.75 * I} />
          <stop offset="0.5" stopColor="#9FCBFF" stopOpacity={0.22 * I} />
          <stop offset="1" stopColor="#9FCBFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(g)} fill="url(#h9-flash)" />
      <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(3 + 4 * I)} fill="#FFFFFF" opacity={Math.min(1, I * 1.2)} />
    </g>
  );
};

/** the shockwave: one crisp pressure front with its refraction bands, fading below the sand line */
export const Shock: React.FC<{cam: Cam; t: number}> = ({cam, t}) => {
  const r = ringR(t);
  if (r <= 0) return null;
  const c = toScreen(cam, PC);
  const Rp = r * cam.s;
  const amp = clamp(1.25 / (1 + 0.07 * r)) * (1 - 0.45 * sm((t - 5.0) / 1.0)) * sm((t - T.collapse - 0.01) / 0.06);
  const band = Math.min(30, Math.max(8, Rp * 0.12));
  const yH = toScreen(cam, {x: 0, y: HORIZON_Y + 1.0}).y, yF = toScreen(cam, {x: 0, y: FLOOR_Y + 2}).y;
  const tot = Rp + band;
  const o = (x: number) => fmt(clamp(x / tot));
  return (
    <g>
      <defs>
        <radialGradient id="h9-shock" gradientUnits="userSpaceOnUse" cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(tot)}>
          <stop offset="0" stopColor="#0E2F36" stopOpacity="0" />
          <stop offset={o(Rp - band * 2.2)} stopColor="#0E2F36" stopOpacity="0" />
          <stop offset={o(Rp - band * 0.55)} stopColor="#0E2F36" stopOpacity={0.2 * amp} />
          <stop offset={o(Rp - 1)} stopColor="#E9FBFF" stopOpacity={0.28 * amp} />
          <stop offset={o(Rp + band * 0.5)} stopColor="#E9FBFF" stopOpacity={0.08 * amp} />
          <stop offset="1" stopColor="#E9FBFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h9-shockmask-g" gradientUnits="userSpaceOnUse" x1="0" y1={fmt(yH)} x2="0" y2={fmt(Math.max(yH + 1, yF))}>
          <stop offset="0" stopColor="#FFF" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="h9-shockmask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1280" height="2120">
          <rect x="-100" y="-100" width="1280" height="2120" fill="url(#h9-shockmask-g)" />
        </mask>
      </defs>
      <g mask="url(#h9-shockmask)">
        <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(tot)} fill="url(#h9-shock)" />
        <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(Rp)} fill="none" stroke="#F2FDFF" strokeOpacity={0.85 * amp} strokeWidth={fmt(Math.max(1.6, Math.min(3.2, Rp * 0.02)))} />
      </g>
    </g>
  );
};
export {RMAX};
