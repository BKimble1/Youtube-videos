// V4 shield: a clear lenticular panel (vertical cylindrical ribs) held by her, drawn as a flat prop on her card.
// Optics (both drawn from the same rule, so the zoom from one to the other is continuous):
//  * unresolved (ribs finer than the eye can separate): through the panel the scene behind is smeared sideways.
//    Each rib takes in a wide fan of directions (+/- THETA), so a layer d metres behind the panel is averaged over a
//    width 2 d tan(THETA): the far corridor is smeared into horizontal bands, her body (d ~ 0.4 m) is spread over a
//    width larger than the panel, so it dilutes to a faint wash.
//  * resolved (the macro): each rib shows a squeezed, mirrored mini-view of everything behind it: a sliver of the
//    corridor's doors and stripes and a sliver of her, different in every rib.
import React from 'react';
import {INK} from './cast5';
import {B, Card, cardPt, cross3, P2, pathOf, proj, V3, v3} from './geo5';

export const SH = {w: 210, h: 330, ribs: 24, rim: 9, theta: 48};
export const TAN_T = Math.tan((SH.theta * Math.PI) / 180);
/** Panel placement in her card-local units: centre, width axis, height axis (unit vectors). */
export type ShieldPose = {c: V3; ua: V3; va: V3};
export const shieldCorners = (cd: Card, s: ShieldPose) => {
  const at = (a: number, bb: number) => cardPt(cd, v3(s.c.x + s.ua.x * a + s.va.x * bb, s.c.y + s.ua.y * a + s.va.y * bb, s.c.z + s.ua.z * a + s.va.z * bb));
  const hw = SH.w / 2, hh = SH.h / 2;
  return {at, q: [at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)]};
};
/** the panel normal (front, away from her) as seen: d > 0 means its lens face is toward the camera */
export const shieldFacing = (cd: Card, s: ShieldPose) => {
  const n = cross3(s.ua, s.va);
  const c = Math.cos((cd.phi * Math.PI) / 180), sn = Math.sin((cd.phi * Math.PI) / 180);
  return {x: n.x * c + n.z * sn, d: -n.x * sn + n.z * c};
};

export type Lens = {
  bgHref: string; // the corridor as drawn in this frame
  subjHref: string | null; // her card as drawn in this frame
  camToPanel: number; // metres
  herBehind: number; // metres from the panel plane to her body
  f: number; // the camera focal length (px)
  macro: number; // 0 = unresolved smear, 1 = resolved ribs
  ribAlpha?: number; // how strongly rib structure is drawn (0..1)
};

export const Shield4: React.FC<{id: string; cd: Card; s: ShieldPose; lens?: Lens | null; glint?: number; side?: 'front' | 'back' | 'auto'}> = ({id, cd, s, lens, glint = 0}) => {
  const {at, q} = shieldCorners(cd, s);
  const fc = shieldFacing(cd, s);
  const quad = pathOf(q);
  const k = cd.k;
  const lw = Math.max(1.5, 4 * Math.pow(k, 0.6));
  const facing = Math.abs(fc.d);
  const edgeOn = facing < 0.18;
  const hw = SH.w / 2, hh = SH.h / 2;
  // rim (an inner rectangle inset by the rim width)
  const inner = [at(-hw + SH.rim, -hh + SH.rim), at(hw - SH.rim, -hh + SH.rim), at(hw - SH.rim, hh - SH.rim), at(-hw + SH.rim, hh - SH.rim)];
  // ribs (boundaries along the width)
  const ribX = (i: number) => -hw + SH.rim + ((SH.w - 2 * SH.rim) * i) / SH.ribs;
  const ribs: {a: P2 | {x: number; y: number}; b: {x: number; y: number}; c0: {x: number; y: number}; c1: {x: number; y: number}}[] = [];
  for (let i = 0; i < SH.ribs; i++) {
    ribs.push({a: at(ribX(i), -hh + SH.rim), b: at(ribX(i), hh - SH.rim), c0: at(ribX(i + 1), -hh + SH.rim), c1: at(ribX(i + 1), hh - SH.rim)});
  }
  const ribW = Math.hypot(ribs[0].c0.x - ribs[0].a.x, ribs[0].c0.y - ribs[0].a.y);
  const panelW = Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y);
  let content: React.ReactNode = null;
  if (lens && !edgeOn) {
    // unresolved smear: horizontal blur, width set by each layer's depth behind the panel
    const f = lens.f;
    const wBg = Math.min(2600, 2 * f * TAN_T); // a far layer: the full fan
    const dS = Math.max(0.15, lens.herBehind);
    const wS = (2 * f * dS * TAN_T) / (lens.camToPanel + dS);
    const sBg = wBg * 0.4, sS = wS * 0.4;
    const mBg = -ribW / (2 * f * TAN_T); // a far layer: the whole fan squeezed into one rib (mirrored)
    const mS = -(ribW) / wS;
    const macro = lens.macro;
    content = (
      <g>
        <defs>
          <filter id={`${id}-fb`} filterUnits="userSpaceOnUse" x={-2000} y={-500} width={5080} height={2920} colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sBg.toFixed(1)} 0`} edgeMode="duplicate" />
          </filter>
          <filter id={`${id}-fs`} filterUnits="userSpaceOnUse" x={-2000} y={-500} width={5080} height={2920} colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sS.toFixed(1)} 0`} />
          </filter>
          <clipPath id={`${id}-clip`}><path d={pathOf(inner)} /></clipPath>
          {macro > 0 && ribs.map((r, i) => <clipPath key={i} id={`${id}-r${i}`}><path d={pathOf([r.a, r.c0, r.c1, r.b])} /></clipPath>)}
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          {macro < 1 && (
            <g opacity={1}>
              <use href={lens.bgHref} filter={`url(#${id}-fb)`} />
              {lens.subjHref && <use href={lens.subjHref} filter={`url(#${id}-fs)`} />}
            </g>
          )}
          {macro > 0 && (
            <g opacity={macro}>
              {ribs.map((r, i) => {
                const cx = (r.a.x + r.c0.x + r.b.x + r.c1.x) / 4;
                return (
                  <g key={i} clipPath={`url(#${id}-r${i})`}>
                    <rect x={Math.min(r.a.x, r.b.x) - 2} y={Math.min(r.a.y, r.c0.y) - 2} width={ribW + Math.abs(r.b.x - r.a.x) + 4} height={Math.abs(r.b.y - r.a.y) + 4} fill="#1E3A46" />
                    <g transform={`translate(${cx.toFixed(2)} 0) scale(${mBg.toFixed(5)} 1) translate(${(-cx).toFixed(2)} 0)`}><use href={lens.bgHref} /></g>
                    {lens.subjHref && <g transform={`translate(${cx.toFixed(2)} 0) scale(${mS.toFixed(5)} 1) translate(${(-cx).toFixed(2)} 0)`}><use href={lens.subjHref} /></g>}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </g>
    );
  }
  // glass and ribs over the content
  const ribA = lens ? (lens.ribAlpha ?? 1) : 1;
  const ribLines = ribs.map((r, i) => {
    const hx = (u: number) => ({x: r.a.x + (r.c0.x - r.a.x) * u, y: r.a.y + (r.c0.y - r.a.y) * u});
    const hb = (u: number) => ({x: r.b.x + (r.c1.x - r.b.x) * u, y: r.b.y + (r.c1.y - r.b.y) * u});
    return (
      <g key={i}>
        <path d={pathOf([hx(0.2), hx(0.27), hb(0.27), hb(0.2)])} fill="#FFFFFF" opacity={(ribW > 60 ? 0.22 : 0.14) * ribA} />
        <path d={pathOf([hx(0.7), hx(1), hb(1), hb(0.7)])} fill="#0B2430" opacity={0.2 * ribA * Math.min(1, ribW / 14)} />
        <line x1={r.a.x} y1={r.a.y} x2={r.b.x} y2={r.b.y} stroke="#DFF4F6" strokeOpacity={0.3 * ribA * Math.min(1, ribW / 10)} strokeWidth={Math.max(0.6, Math.min(3, ribW * 0.03))} />
      </g>
    );
  });
  const g0 = at(-hw * 0.2, -hh * 0.35);
  return (
    <g>
      {content}
      {!edgeOn && (
        <g>
          <path d={pathOf(inner)} fill="#BFE6EE" opacity={0.08} />
          {ribLines}
          {/* a broad sheen across the glass */}
          <path d={pathOf([at(-hw + 20, -hh + 30), at(-hw + 60, -hh + 30), at(hw - 40, hh - 20), at(hw - 80, hh - 20)])} fill="#FFFFFF" opacity={0.06} />
          {glint > 0 && <ellipse cx={g0.x} cy={g0.y} rx={panelW * 0.32} ry={panelW * 0.14} fill="url(#beamGlint)" opacity={glint} />}
        </g>
      )}
      {/* rim */}
      <path d={`${quad} ${pathOf(inner.slice().reverse())}`} fill="#4D6A76" fillRule="evenodd" stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      <path d={pathOf(inner)} fill="none" stroke="#A9D7E0" strokeWidth={Math.max(1, lw * 0.45)} strokeOpacity={0.8} />
      {edgeOn && <path d={quad} fill="#9FD0DA" opacity={0.5} stroke={INK} strokeWidth={lw} />}
      {/* grips on the back face */}
      {fc.d < -0.05 && [-1, 1].map((sd) => {
        const a = at(sd * 62, -40), b2 = at(sd * 62, 60);
        return <line key={sd} x1={a.x} y1={a.y} x2={b2.x} y2={b2.y} stroke={INK} strokeWidth={14 * k + lw * 2} strokeLinecap="round" />;
      })}
      {fc.d < -0.05 && [-1, 1].map((sd) => {
        const a = at(sd * 62, -40), b2 = at(sd * 62, 60);
        return <line key={`i${sd}`} x1={a.x} y1={a.y} x2={b2.x} y2={b2.y} stroke="#3E5560" strokeWidth={14 * k} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** A flat world-space flashlight beam (cone silhouette with a falloff) and its pool where it lands. */
export const beamPoly = (b: B, o: V3, dir: V3, len: number, half: number) => {
  const pts: {x: number; y: number}[] = [];
  const t0 = Math.abs(dir.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  const e1 = cross3(dir, t0), e2 = cross3(dir, e1);
  const n1 = Math.hypot(e1.x, e1.y, e1.z), n2 = Math.hypot(e2.x, e2.y, e2.z);
  const r = len * Math.tan((half * Math.PI) / 180);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const p = v3(o.x + dir.x * len + (e1.x / n1) * Math.cos(a) * r + (e2.x / n2) * Math.sin(a) * r, o.y + dir.y * len + (e1.y / n1) * Math.cos(a) * r + (e2.y / n2) * Math.sin(a) * r, o.z + dir.z * len + (e1.z / n1) * Math.cos(a) * r + (e2.z / n2) * Math.sin(a) * r);
    pts.push(proj(b, p));
  }
  const ap = proj(b, o);
  pts.push(ap);
  // convex hull (monotone chain)
  const P = pts.slice().sort((a, c) => a.x - c.x || a.y - c.y);
  const cr = (o2: {x: number; y: number}, a: {x: number; y: number}, c: {x: number; y: number}) => (a.x - o2.x) * (c.y - o2.y) - (a.y - o2.y) * (c.x - o2.x);
  const lo: {x: number; y: number}[] = [], up: {x: number; y: number}[] = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return {hull: lo.slice(0, -1).concat(up.slice(0, -1)), apex: ap, end: proj(b, v3(o.x + dir.x * len, o.y + dir.y * len, o.z + dir.z * len))};
};
