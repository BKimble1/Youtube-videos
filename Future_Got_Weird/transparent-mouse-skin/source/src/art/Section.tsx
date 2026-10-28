// The skin cross-section inside the call-out: an illustrative schematic of the same patch (not a cut). Water-rich
// matrix (pale blue) with lipid-rich regions (cream), the dye film on the surface, the intestine beneath.
// Light paths are traced with Snell's law through the circular lipid regions (exaggerated indices for legibility:
// lipid 1.62, water 1.33 before the dye). As the absorbing dye enters the watery parts their index for the red
// light rises toward the lipid index (to 1.60, "more like the fat", not equal): the same rays then pass almost
// straight and reach the organ. The lipid regions keep their own colour throughout: nothing is converted or removed.
// One blue ray: before the dye it scatters like the others; with the dye it is absorbed near the surface (the dye
// absorbs blue), so the treated skin looks red-orange and the red light is what gets through.
import React from 'react';
import {mix} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, easeInOut, easeOut, hash, inv, lerp, V} from '../dc/math';
import {B} from '../beats';

export const SR = 420; // call-out radius (screen px)
const Y_SURF = -262;
const Y_DEEP = 118;
const Y_ORGAN = 172;
const N_FAT = 1.62;

// lipid-rich regions packed through the water-rich matrix (deterministic dart throwing)
const BLOBS: {x: number; y: number; r: number}[] = (() => {
  const out: {x: number; y: number; r: number}[] = [];
  for (let i = 0; out.length < 44 && i < 4000; i++) {
    const r = 18 + hash(i, 101) * 22;
    const x = (hash(i, 103) - 0.5) * 2 * (SR - 10), y = lerp(-262 + r + 14, 118 - r - 8, hash(i, 107));
    if (Math.hypot(x, y) > SR - 8) continue;
    if (out.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + r + 7)) out.push({x, y, r});
  }
  return out;
})();

type Hit = {pts: V[]; branches: {p: V; d: V; w: number}[]; reached: boolean};
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;

const trace = (x0: number, nW: number): Hit => {
  let p: V = {x: x0, y: -SR - 10};
  let d: V = {x: 0, y: 1};
  const pts: V[] = [p];
  const branches: Hit['branches'] = [];
  // straight down to the surface
  p = {x: x0, y: Y_SURF};
  pts.push(p);
  for (let ev = 0; ev < 40; ev++) {
    // nearest blob boundary along the ray
    let best = Infinity, bi = -1;
    BLOBS.forEach((b, i) => {
      const oc = {x: p.x - b.x, y: p.y - b.y};
      const bb = dot(oc, d), cc = dot(oc, oc) - b.r * b.r;
      const disc = bb * bb - cc;
      if (disc < 0) return;
      const s = Math.sqrt(disc);
      for (const tt of [-bb - s, -bb + s]) if (tt > 0.5 && tt < best) { best = tt; bi = i; }
    });
    // walls: the deep boundary, the surface (escape upward), the call-out rim
    const tDeep = d.y > 1e-6 ? (Y_DEEP - p.y) / d.y : Infinity;
    const tSurf = d.y < -1e-6 ? (Y_SURF - p.y) / d.y : Infinity;
    const tWall = Math.min(tDeep, tSurf);
    if (tWall <= best) {
      const q = {x: p.x + d.x * tWall, y: p.y + d.y * tWall};
      if (Math.hypot(q.x, q.y) > SR - 4) {
        // leaves the field sideways before it gets anywhere
        pts.push({x: p.x + d.x * 600, y: p.y + d.y * 600});
        return {pts, branches, reached: false};
      }
      pts.push(q);
      if (tDeep < tSurf) {
        const o = {x: q.x + d.x * ((Y_ORGAN - Y_DEEP) / Math.max(0.2, d.y)), y: Y_ORGAN};
        pts.push(o);
        return {pts, branches, reached: Math.abs(o.x) < SR * 0.86};
      }
      return {pts, branches, reached: false}; // scattered back out of the surface
    }
    const b = BLOBS[bi];
    const q = {x: p.x + d.x * best, y: p.y + d.y * best};
    pts.push(q);
    let nrm = {x: (q.x - b.x) / b.r, y: (q.y - b.y) / b.r};
    const entering = dot(d, nrm) < 0;
    const n1 = entering ? nW : N_FAT, n2 = entering ? N_FAT : nW;
    if (!entering) nrm = {x: -nrm.x, y: -nrm.y};
    const cosi = -dot(d, nrm);
    const eta = n1 / n2;
    const k = 1 - eta * eta * (1 - cosi * cosi);
    const refl = {x: d.x + 2 * cosi * nrm.x, y: d.y + 2 * cosi * nrm.y};
    const R0 = ((n1 - n2) / (n1 + n2)) ** 2;
    const fres = R0 + (1 - R0) * (1 - cosi) ** 5;
    if (fres * 14 > 0.03 && k >= 0) branches.push({p: q, d: refl, w: Math.min(0.85, fres * 14)});
    if (k < 0) d = refl; // total internal reflection
    else {
      const ck = Math.sqrt(k);
      d = {x: eta * d.x + (eta * cosi - ck) * nrm.x, y: eta * d.y + (eta * cosi - ck) * nrm.y};
    }
    const dl = Math.hypot(d.x, d.y); d = {x: d.x / dl, y: d.y / dl};
    p = {x: q.x + d.x * 0.8, y: q.y + d.y * 0.8};
  }
  return {pts, branches, reached: false};
};

const cut = (pts: V[], L: number) => {
  const out: V[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + l >= L) { const u = (L - acc) / (l || 1); out.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u}); return out; }
    out.push(b); acc += l;
  }
  return out;
};
const plen = (pts: V[]) => pts.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - pts[i].x, b.y - pts[i].y), 0);
const at = (pts: V[], L: number) => { const c = cut(pts, L); return c[c.length - 1]; };
const poly = (pts: V[]) => 'M' + pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' L');

const MOLS = Array.from({length: 80}, (_, i) => {
  let x = 0, y = 0;
  for (let k = 0; k < 30; k++) {
    x = (hash(i, 61 + k) - 0.5) * 760; y = lerp(Y_SURF + 16, Y_DEEP - 6, hash(i, 91 + k));
    if (BLOBS.every((b) => Math.hypot(x - b.x, y - b.y) > b.r + 6) && Math.hypot(x, y) < SR - 20) break;
  }
  return {x0: x + (hash(i, 7) - 0.5) * 40, x, y, delay: hash(i, 13) * 0.9};
});
const RAYS = [-250, -150, -60, 40, 130, 235];
const BLUE = -10;

export const Section: React.FC<{t: number}> = ({t}) => {
  const k = easeInOut(inv(B.rebend - 0.2, B.settled + 0.1, t)); // optical match progress
  const nW = lerp(1.33, 1.6, k);
  const molIn = (i: number) => easeOut(inv(B.dyeIn + MOLS[i].delay * 0.9, B.dyeIn + 0.9 + MOLS[i].delay * 0.9, t));
  const tintW = easeInOut(inv(B.dyeIn + 0.2, B.watery + 0.6, t));
  const water = mix('#BFE1EC', '#F5B98A', tintW);
  const reveal = easeInOut(inv(B.bend - 0.1, B.bend + 1.1, t));
  const scatterA = easeInOut(inv(B.scatter - 0.1, B.scatter + 0.5, t)) * (1 - k);
  const haze = clamp(0.72 * (1 - k) * (0.6 + 0.4 * easeInOut(inv(B.hide - 0.2, B.hide + 0.6, t))));
  const outlineA = lerp(1, 0.22, k);
  const film = lerp(1, 0.35, easeInOut(inv(B.dyeIn, B.dyeIn + 1.4, t)));
  const waterLab = inv(B.water - 0.05, B.water + 0.2, t), fatLab = inv(B.fat - 0.05, B.fat + 0.2, t);
  const pulse = Math.max(0, Math.sin(clamp((t - B.watery) / 0.7) * Math.PI));
  const traces = RAYS.map((x) => trace(x, nW));
  const blueT = trace(BLUE, nW);
  const peri = Math.sin(t * 2.2);
  return (
    <g>
      <defs>
        <clipPath id="sec-clip"><circle cx={0} cy={0} r={SR} /></clipPath>
        <filter id="sec-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="sec-haze"><feGaussianBlur stdDeviation={(1 + 7 * (1 - k)).toFixed(2)} /></filter>
      </defs>
      <g clipPath="url(#sec-clip)">
        {/* air above the skin */}
        <rect x={-SR} y={-SR} width={2 * SR} height={SR + Y_SURF} fill="#2B3A47" />
        {/* the organ beneath: a loop of intestine (with slow peristalsis) in the abdominal cavity */}
        <rect x={-SR} y={Y_DEEP} width={2 * SR} height={SR} fill="#8E3641" />
        <g filter="url(#sec-haze)">
          <path d={`M${-SR},${Y_ORGAN + 10} C-200,${Y_ORGAN - 8 + 6 * peri} 0,${Y_ORGAN + 14 - 6 * peri} 200,${Y_ORGAN} S${SR},${Y_ORGAN + 6} ${SR},${Y_ORGAN + 6} L${SR},${SR} L${-SR},${SR} Z`} fill="#E8968A" stroke="#6A2330" strokeWidth={5} />
          {Array.from({length: 14}, (_, i) => (
            <path key={i} d={`M${-380 + i * 58},${Y_ORGAN + 50} q14,${30 + 6 * Math.sin(t * 2 + i)} 0,70`} stroke="#C7706A" strokeWidth={6} fill="none" strokeLinecap="round" />
          ))}
          <path d={`M-330,${Y_ORGAN + 28} C-150,${Y_ORGAN + 14} 50,${Y_ORGAN + 34} 300,${Y_ORGAN + 22}`} stroke="#F7C6B8" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.7} />
        </g>
        {/* skin tissue: water-rich matrix with lipid-rich regions */}
        <path d={`M${-SR},${Y_SURF} ${Array.from({length: 22}, (_, i) => `Q${-SR + i * 40 + 20},${Y_SURF + (i % 2 ? 7 : -7)} ${-SR + (i + 1) * 40},${Y_SURF}`).join(' ')} L${SR},${Y_DEEP} L${-SR},${Y_DEEP} Z`} fill={water} />
        <path d={`M${-SR},${Y_DEEP} L${SR},${Y_DEEP}`} stroke="#6A2330" strokeWidth={4} opacity={0.6} />
        {pulse > 0 && <path d={`M${-SR},${Y_SURF} L${SR},${Y_SURF} L${SR},${Y_DEEP} L${-SR},${Y_DEEP} Z`} fill="#FFFFFF" opacity={0.18 * pulse} />}
        {BLOBS.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={b.r} fill="#FBE6A0" />
            <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke="#B4842A" strokeWidth={4} opacity={outlineA} />
            <ellipse cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.35} rx={b.r * 0.35} ry={b.r * 0.2} fill="#FFF8DC" opacity={0.8} />
          </g>
        ))}
        {/* dye: a film on the surface, then molecules in the watery parts only */}
        <path d={`M${-SR},${Y_SURF - 2} L${SR},${Y_SURF - 2}`} stroke="#E8901E" strokeWidth={16 * film} />
        {MOLS.map((m, i) => {
          const u = molIn(i);
          if (u <= 0) return null;
          const x = lerp(m.x0, m.x, u) + 3 * Math.sin(t * 3 + i), y = lerp(Y_SURF - 2, m.y, u) + 3 * Math.cos(t * 2.6 + i * 1.7);
          return <circle key={i} cx={x} cy={y} r={5} fill="#E8801A" stroke="#9A4A0E" strokeWidth={1.5} />;
        })}
        {/* haze over what lies beneath while the light is scattered */}
        <rect x={-SR} y={Y_DEEP - 2} width={2 * SR} height={SR} fill="#DCE6EC" opacity={haze} />
        {/* light: incoming rays, their bends, the scattered branches, pulses travelling along them */}
        {traces.map((tr, i) => {
          const L = plen(tr.pts);
          const shown = lerp(SR + Y_SURF + 20, L, reveal);
          const pts = cut(tr.pts, shown);
          const ph = ((t * 620 + i * 137) % (L + 260)) - 60;
          const a = at(tr.pts, Math.max(0, ph)), b = at(tr.pts, Math.max(0, Math.min(shown, ph + 70)));
          return (
            <g key={i}>
              <path d={poly(pts)} stroke="#FF5A2E" strokeWidth={14} fill="none" opacity={0.35} filter="url(#sec-glow)" />
              <path d={poly(pts)} stroke="#FF7A45" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              {ph > 0 && ph < shown && <path d={`M${a.x},${a.y} L${b.x},${b.y}`} stroke="#FFE3C4" strokeWidth={7} strokeLinecap="round" />}
              {tr.branches.map((br, j) => (
                <path key={j} d={`M${br.p.x},${br.p.y} l${br.d.x * 70},${br.d.y * 70}`} stroke="#FF8A55" strokeWidth={4.5} strokeLinecap="round" opacity={scatterA * br.w * reveal} />
              ))}
              {tr.reached && shown >= L - 1 && <circle cx={tr.pts[tr.pts.length - 1].x} cy={Y_ORGAN + 6} r={16} fill="#FFD7B0" opacity={0.75} filter="url(#sec-glow)" />}
            </g>
          );
        })}
        {(() => {
          // the blue ray: scattered like the rest before the dye; absorbed near the surface once the dye is in
          const L = plen(blueT.pts);
          const shown = lerp(SR + Y_SURF + 20, L, reveal);
          const absorb = easeInOut(inv(B.dyeIn + 0.4, B.rebend, t));
          const pts = cut(blueT.pts, shown);
          const segs: React.ReactNode[] = [];
          let acc = 0;
          for (let i = 1; i < pts.length; i++) {
            const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
            const depth = Math.max(0, acc - (SR + Y_SURF));
            const op = Math.exp(-depth * absorb / 45);
            segs.push(<path key={i} d={`M${pts[i - 1].x},${pts[i - 1].y} L${pts[i].x},${pts[i].y}`} stroke="#5AA2FF" strokeWidth={5} strokeLinecap="round" opacity={op} />);
            acc += l;
          }
          return <g opacity={0.9}>{segs}</g>;
        })()}
        {/* labels: concise identifiers only */}
        <g opacity={waterLab}>
          <rect x={-330} y={-250} width={tintW > 0.5 ? 316 : 172} height={58} rx={14} fill="#10202C" opacity={0.88} />
          <text x={-312} y={-209} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={38} fill={tintW > 0.5 ? '#FFC07A' : '#BFE6F5'}>{tintW > 0.5 ? 'WATER + DYE' : 'WATER'}</text>
        </g>
        <g opacity={fatLab}>
          {(() => {
            const fb = BLOBS.filter((q) => q.x > 120 && q.x < 300 && q.y < -60).sort((u, v) => v.r - u.r)[0] ?? BLOBS[0];
            return <path d={`M${190},${-196} L${fb.x},${fb.y}`} stroke="#10202C" strokeWidth={5} />;
          })()}
          <rect x={136} y={-250} width={110} height={58} rx={14} fill="#10202C" opacity={0.88} />
          <text x={154} y={-209} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={38} fill="#FBE6A0">FAT</text>
        </g>
      </g>
      <circle cx={0} cy={0} r={SR} fill="none" stroke="#FFFFFF" strokeWidth={10} />
      <circle cx={0} cy={0} r={SR + 6} fill="none" stroke={INK} strokeWidth={4} />
    </g>
  );
};
