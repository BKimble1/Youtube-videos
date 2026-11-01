// Space: the ray-traced black hole (tools/blackhole.py, drawn on twos like cel animation), the ship on its orbit, and
// the light-bending view of the explanation. World units: M (the hole's mass), hole at (0, 0).
import React from 'react';
import {Img, staticFile} from 'remotion';
import BH from '../data/bh_meta.json';
import {hash, lerp} from '../lib';
import {C, INK, OUT} from './crew';

export const XW = BH.XW, YW = (BH.XW * BH.HPX) / BH.WPX;
export const TILT = BH.tilt_deg;
/** apparent radius of the shadow's rim (photon ring), M: sqrt(27) for Schwarzschild */
export const RING_M = Math.sqrt(27);

/** which pre-rendered frame to show at film time t (on twos) */
export const bhFrame = (t: number) => {
  const f = Math.max(0, Math.round(t * 30));
  return f - (f % 2);
};

/** star field outside the ray-traced image, so pulling back never shows an edge */
const FarStars: React.FC = () => {
  const st = React.useMemo(() => Array.from({length: 900}, (_, i) => ({x: (hash(i * 3.1) - 0.5) * 400, y: (hash(i * 7.7) - 0.5) * 600, r: 0.03 + 0.08 * hash(i * 1.9) ** 3})), []);
  return <g>{st.filter((s) => Math.abs(s.x) > 47.5 || Math.abs(s.y) > 84).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r * 2} fill="#FFF6E0" opacity={0.75} />)}</g>;
};

/** the black hole at film time t (image frame), in M units */
/** wide-field frames exist for the shots that pull back or reflect a large view (tools/blackhole.py, BH_WIDE=1) */
const WXW = 48, WYW = (48 * BH.HPX) / BH.WPX;
export const hasWide = (n: number) => (n >= 0 && n <= 56) || (n >= 564 && n <= 708);
export const BlackHole: React.FC<{t: number; edge?: boolean}> = ({t}) => {
  const n = bhFrame(t);
  const f4 = String(n).padStart(4, '0');
  return (
    <g>
      <linearGradient id="bhbg" x1="0" y1="-85" x2="0" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0B0E1D" />
        <stop offset="1" stopColor="#1A1238" />
      </linearGradient>
      <rect x={-300} y={-400} width={600} height={800} fill="url(#bhbg)" />
      <FarStars />
      {hasWide(n) && <image href={staticFile(`bhw/f_${f4}.jpg`)} x={-WXW} y={-WYW} width={2 * WXW} height={2 * WYW} preserveAspectRatio="none" />}
      <image href={staticFile(`bh/f_${f4}.jpg`)} x={-XW} y={-YW} width={2 * XW} height={2 * YW} preserveAspectRatio="none" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
/** the ship, side view, facing +x, length 200 units, origin at its centre. `win` is drawn inside the porthole. */
export const SHIP_WIN = {x: 50, y: -14, r: 21};
export const Ship: React.FC<{t: number; id: string; win?: React.ReactNode; flame?: number}> = ({t, id, win, flame = 1}) => {
  const fl = 1 + 0.12 * Math.sin(t * 40) + 0.08 * Math.sin(t * 67);
  return (
    <g>
      {/* engine glow */}
      <g opacity={flame}>
        <path d={`M -96 -12 Q ${-150 * fl} 0 -96 12 Z`} fill={C.saffron} />
        <path d={`M -96 -8 Q ${-128 * fl} 0 -96 8 Z`} fill="#FFFBF0" />
      </g>
      {/* fins */}
      <path d="M -70 -24 L -96 -52 L -60 -50 L -30 -26 Z" fill={C.coral} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d="M -70 24 L -96 52 L -60 50 L -30 26 Z" fill={C.coralDeep} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      {/* engine bell */}
      <path d="M -82 -18 L -98 -24 L -98 24 L -82 18 Z" fill="#5A6773" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      {/* hull */}
      <path d="M -84 -30 L 30 -34 Q 92 -32 104 0 Q 92 32 30 34 L -84 30 Q -92 0 -84 -30 Z" fill="#F4F6F8" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d="M -84 10 L 30 14 Q 80 14 100 6 Q 92 32 30 34 L -84 30 Q -88 20 -84 10 Z" fill="#C9D3DC" opacity={0.8} />
      <rect x={-50} y={-34} width={16} height={68} fill={C.saffron} />
      <rect x={-28} y={-34} width={6} height={68} fill={C.saffron} />
      <path d="M -84 -30 L 30 -34 Q 92 -32 104 0 Q 92 32 30 34 L -84 30 Q -92 0 -84 -30 Z" fill="none" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      {/* nose cap */}
      <path d="M 84 -18 Q 104 -8 104 0 Q 104 8 84 18 Q 92 0 84 -18 Z" fill="#3F5560" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* porthole */}
      <circle cx={SHIP_WIN.x} cy={SHIP_WIN.y} r={SHIP_WIN.r + 6} fill="#B9C4CC" stroke={INK} strokeWidth={OUT} />
      <circle cx={SHIP_WIN.x} cy={SHIP_WIN.y} r={SHIP_WIN.r} fill="#13213A" stroke={INK} strokeWidth={3} />
      <clipPath id={`${id}-win`}><circle cx={SHIP_WIN.x} cy={SHIP_WIN.y} r={SHIP_WIN.r} /></clipPath>
      {win && <g clipPath={`url(#${id}-win)`}>{win}</g>}
      <path d={`M ${SHIP_WIN.x - 13} ${SHIP_WIN.y - 6} A 15 15 0 0 1 ${SHIP_WIN.x - 2} ${SHIP_WIN.y - 15}`} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      {/* rim light from the disk (warm, from below-left) */}
      <path d="M -84 26 L 30 30 Q 80 30 98 10" fill="none" stroke="#FF9A55" strokeWidth={3} opacity={0.75} />
    </g>
  );
};

/** the ship's orbit: an inclined circular orbit seen nearly edge-on (an ellipse), passing in front of the hole,
 *  well outside the photon sphere. th = orbital angle (pi -> 0 crosses the front, left to right). */
export const ORBIT = {rx: 13.5, ry: 4.6};
export const orbitPos = (th: number) => {
  const x = ORBIT.rx * Math.cos(th), y = ORBIT.ry * Math.sin(th);
  const a = (TILT * Math.PI) / 180;
  return {x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)};
};
export const orbitAngle = (th: number) => {
  const p = orbitPos(th), q = orbitPos(th - 0.01);
  return (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
};

// ---------------------------------------------------------------------------------------------------------------------
/** null geodesics in the plane (u'' = 3u^2 - u), for the light-bending view: rays arriving from direction `from`
 *  (deg, screen angle of the source) with impact parameters bs. Returns polylines in M. */
export const lightRays = (bs: number[], from: number) => {
  const a0 = (from * Math.PI) / 180;
  return bs.map((b) => {
    const pts: {x: number; y: number}[] = [];
    let u = 1 / 70, du = Math.sqrt(Math.max(1 / (b * b) - u * u * (1 - 2 * u), 0));
    let phi = 0;
    const dphi = 0.004;
    for (let k = 0; k < 6000; k++) {
      const r = 1 / u;
      // incoming from angle a0, sweeping around the hole
      const ang = a0 + phi * Math.sign(b);
      pts.push({x: r * Math.cos(ang), y: r * Math.sin(ang)});
      const f = (x: number) => 3 * x * x - x;
      const k1u = du, k1v = f(u);
      const k2u = du + 0.5 * dphi * k1v, k2v = f(u + 0.5 * dphi * k1u);
      const k3u = du + 0.5 * dphi * k2v, k3v = f(u + 0.5 * dphi * k2u);
      const k4u = du + dphi * k3v, k4v = f(u + dphi * k3u);
      u += (dphi / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
      du += (dphi / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      phi += dphi;
      if (u > 0.5 || u < 1 / 75) break;
    }
    return {b, pts, captured: u > 0.5};
  });
};
const polyD = (pts: {x: number; y: number}[]) => 'M' + pts.map((p) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('L');
const pathLen = (pts: {x: number; y: number}[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);

/** light from distant Earth: a few photons, released one after another, each drawing its own trail as it goes, bent
 *  around the hole by the real null-geodesic equation (u'' = 3u^2 - u). One, aimed too close, is captured. */
export const LightRays: React.FC<{t: number; op: number; px: number; from: number; t0: number}> = ({t, op, px, from, t0}) => {
  const rays = React.useMemo(() => {
    const bs = [6.0, -6.3, 8.6, -9.4, 5.35, 4.7];
    return lightRays(bs, from).map((r) => {
      const pts = r.pts.filter((p) => Math.hypot(p.x, p.y) < 44);
      return {...r, pts, d: polyD(pts), L: pathLen(pts)};
    });
  }, [from]);
  if (op <= 0.01) return null;
  const w = 1 / px; // one screen pixel in M
  return (
    <g opacity={op}>
      {rays.map((r, i) => {
        const head = (t - t0 - i * 0.16) * 58; // M travelled
        if (head <= 0) return null;
        const h = Math.min(head, r.L);
        const fade = r.captured ? 1 : Math.max(0, 1 - Math.max(0, head - r.L) / 30);
        const col = r.captured ? '#FF9A80' : '#DFFBFF';
        // photon position = end of the drawn trail
        let acc = 0, hp = r.pts[0];
        for (let k = 1; k < r.pts.length; k++) {
          const seg = Math.hypot(r.pts[k].x - r.pts[k - 1].x, r.pts[k].y - r.pts[k - 1].y);
          if (acc + seg >= h) { const u = (h - acc) / (seg || 1); hp = {x: r.pts[k - 1].x + (r.pts[k].x - r.pts[k - 1].x) * u, y: r.pts[k - 1].y + (r.pts[k].y - r.pts[k - 1].y) * u}; break; }
          acc += seg; hp = r.pts[k];
        }
        return (
          <g key={i} opacity={fade}>
            <path d={r.d} fill="none" stroke={col} strokeWidth={w * 9} opacity={0.12} strokeLinecap="round" strokeDasharray={`${h} ${r.L + 10}`} />
            <path d={r.d} fill="none" stroke={col} strokeWidth={w * 2.6} opacity={0.75} strokeLinecap="round" strokeDasharray={`${h} ${r.L + 10}`} />
            {head < r.L + 2 && <circle cx={hp.x} cy={hp.y} r={w * 9} fill="#FFFBF0" opacity={0.35} />}
            {head < r.L + 2 && <circle cx={hp.x} cy={hp.y} r={w * 4.5} fill="#FFFBF0" />}
          </g>
        );
      })}
    </g>
  );
};

/** a small Earth for the explanation (vector, slowly turning) */
export const TinyEarth: React.FC<{r: number; spin: number; id: string}> = ({r, spin, id}) => (
  <g>
    <circle r={r * 1.18} fill="#7FB8FF" opacity={0.18} />
    <circle r={r} fill="#2F6FB3" stroke={INK} strokeWidth={r * 0.06} />
    <clipPath id={`${id}-te`}><circle r={r} /></clipPath>
    <g clipPath={`url(#${id}-te)`}>
      {[0, 1, 2, 3].map((k) => {
        const x = ((((k * 0.55 + spin) % 2) + 2) % 2) * 2 * r - 2 * r;
        return <path key={k} d={`M ${x} ${-r * 0.3 + k * r * 0.18} q ${r * 0.3} ${-r * 0.4} ${r * 0.6} ${-r * 0.05} q ${r * 0.2} ${r * 0.3} ${-r * 0.1} ${r * 0.5} q ${-r * 0.4} ${r * 0.1} ${-r * 0.5} ${-r * 0.45} Z`} fill="#6FB36A" stroke={INK} strokeWidth={r * 0.03} />;
      })}
      <path d={`M ${-r * 0.1} ${-r} A ${r} ${r} 0 0 1 ${-r * 0.1} ${r} A ${r * 0.55} ${r} 0 0 0 ${-r * 0.1} ${-r} Z`} fill="#0B1424" opacity={0.55} transform={`translate(${r * 0.35} 0)`} />
    </g>
  </g>
);

/** a plain wall clock (the Earth clock of the explanation); `rate` multiplies real time */
export const WallClock: React.FC<{r: number; t: number; rate: number}> = ({r, t, rate}) => {
  const m = ((t * rate) / 60) % 60, h = ((t * rate) / 3600) % 12;
  const blur = Math.min(1, rate / 2500);
  return (
    <g>
      <circle r={r * 1.12} fill="#C94A36" stroke={INK} strokeWidth={r * 0.06} />
      <circle r={r} fill="#FFFBF0" stroke={INK} strokeWidth={r * 0.03} />
      {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-r * 0.88} x2={0} y2={-r * 0.72} stroke={INK} strokeWidth={r * 0.06} transform={`rotate(${i * 30})`} strokeLinecap="round" />)}
      {/* the minute hand spins so fast it smears into a disk */}
      <circle r={r * 0.74} fill={INK} opacity={0.16 * blur} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.74} stroke={INK} strokeWidth={r * 0.05} strokeLinecap="round" transform={`rotate(${m * 6})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={INK} strokeWidth={r * 0.08} strokeLinecap="round" transform={`rotate(${h * 30})`} />
      <circle r={r * 0.07} fill={INK} />
    </g>
  );
};
export {lerp};
