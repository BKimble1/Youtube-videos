// V4 overlays (explanatory, never the real scene), all drawn in the lab's figure plane at the index fingertip:
//  - TactilePulse: a sensation ON the skin, not a ring in the air. A bright point at the focal spot, ripples clipped
//    to the finger's own silhouette, two short "feel" marks, and, just before contact, two faint converging crests
//    arriving from below (where the array is).
//  - FingerCut: the dive into the same fingertip. The finger's own outline opens locally round the focal spot: skin
//    layers that follow the finger's contour (epidermis, dermis), the distal phalanx bone, Meissner corpuscles and
//    Merkel discs at the focus, a Pacinian corpuscle deeper, and a nerve fibre running back along the finger.
import React from 'react';
import {capsulePath} from '../dc/shade';
import {INK} from '../dc/ink';
import {CYAN, CYAN_HI} from '../it/fx';
import {handGeo} from '../it/hand';
import {V} from '../dc/math';

type G = ReturnType<typeof handGeo>;
const add = (a: V, b: V): V => ({x: a.x + b.x, y: a.y + b.y});
const mul = (a: V, k: number): V => ({x: a.x * k, y: a.y * k});

/** the index finger's silhouette (middle and distal phalanges) as one clip path */
export const fingerClip = (g: G) => g.index.segs.slice(1).map((s) => capsulePath(s.a, s.b, s.ra, s.rb)).join(' ');

export const TactilePulse: React.FC<{g: G; F: V; age: number; k: number; id: string; on?: number}> = ({g, F, age, k, id, on = 1}) => {
  if (on <= 0.01 || age < -0.25 || age > 0.6) return null;
  const tip = g.index.tipDir;
  const nOut = {x: tip.y, y: -tip.x}; // the pad's outward (palmar) normal
  const w = Math.max(0.12, 1.6 / k);
  const u = Math.max(0, age) / 0.6;
  return (
    <g opacity={on}>
      <defs>
        <clipPath id={`${id}-fc`}>
          <path d={fingerClip(g)} />
        </clipPath>
        <radialGradient id={`${id}-pt`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.35" stopColor={CYAN_HI} stopOpacity="0.85" />
          <stop offset="1" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* just before contact: two faint crests converging from below onto the spot */}
      {age < 0.05 &&
        [0, 1].map((i) => {
          const r = Math.max(0.5, (-age + 0.05 + i * 0.08) * 40);
          const a0 = Math.atan2(nOut.y, nOut.x);
          const p0 = add(F, {x: r * Math.cos(a0 - 0.7), y: r * Math.sin(a0 - 0.7)});
          const p1 = add(F, {x: r * Math.cos(a0 + 0.7), y: r * Math.sin(a0 + 0.7)});
          return <path key={i} d={`M${p0.x},${p0.y} A${r},${r} 0 0 1 ${p1.x},${p1.y}`} fill="none" stroke={CYAN_HI} strokeWidth={w * 1.1} opacity={0.55 * (1 - i * 0.35)} />;
        })}
      {age >= 0 && (
        <g>
          {/* ripples travelling over the skin of the fingertip only */}
          <g clipPath={`url(#${id}-fc)`}>
            {[0, 0.22, 0.44].map((d, i) => {
              const v = (u - d) / (1 - d);
              if (v <= 0 || v >= 1) return null;
              return <circle key={i} cx={F.x} cy={F.y} r={1 + 9 * Math.sqrt(v)} fill="none" stroke={CYAN_HI} strokeWidth={w * (1.6 - v)} opacity={0.85 * (1 - v)} />;
            })}
            <circle cx={F.x} cy={F.y} r={5} fill={CYAN} opacity={0.25 * (1 - u)} />
          </g>
          {/* the sensation point */}
          <circle cx={F.x} cy={F.y} r={2.6 + 1.5 * (1 - u)} fill={`url(#${id}-pt)`} opacity={1 - u * 0.8} />
          {/* two short "feel" marks off the pad (the comic convention for a sensation) */}
          {age < 0.32 &&
            [-0.55, 0.55].map((a, i) => {
              const dir = {x: nOut.x * Math.cos(a) - nOut.y * Math.sin(a), y: nOut.x * Math.sin(a) + nOut.y * Math.cos(a)};
              const p0 = add(F, mul(dir, 2.6 + 3 * u));
              const p1 = add(F, mul(dir, 4.6 + 4 * u));
              return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={CYAN_HI} strokeWidth={w * 1.3} strokeLinecap="round" opacity={1 - age / 0.32} />;
            })}
        </g>
      )}
    </g>
  );
};

/** the dive into the fingertip: the finger's own silhouette opens round the focal spot */
export const FingerCut: React.FC<{g: G; F: V; open: number; act: number; t: number; k: number; id: string}> = ({g, F, open, act, t, k, id}) => {
  if (open <= 0.01) return null;
  const segs = g.index.segs;
  const dist = segs[2];
  const mid = segs[1];
  const r = dist.rb;
  const epi = r * 0.11, derm = r * 0.36;
  const tip = g.index.tipDir;
  const nIn = {x: -tip.y, y: tip.x}; // inward from the pad
  const tan = tip;
  const R = 2 + open * r * 2.4; // reveal radius
  const w = Math.max(0.08, 1.2 / k);
  const outline = fingerClip(g);
  const inset = (d: number) => segs.slice(1).map((sg) => capsulePath(sg.a, sg.b, Math.max(0.1, sg.ra - d), Math.max(0.1, sg.rb - d))).join(' ');
  const mod = 0.5 + 0.5 * Math.cos(2 * Math.PI * 4 * t);
  // receptors along the pad near the focus
  const along = [-1.5, -0.75, 0, 0.75, 1.5].map((s) => s * r * 0.42);
  const meiss = along.map((s) => add(add(F, mul(tan, s)), mul(nIn, epi + r * 0.08)));
  const merkel = along.map((s) => add(add(F, mul(tan, s + r * 0.2)), mul(nIn, epi * 0.85)));
  const pac = add(F, mul(nIn, derm + r * 0.22));
  const nerveEnd = mid.a;
  const sig = (t * 1.3) % 1;
  const near = (p: V) => Math.exp(-(((p.x - F.x) ** 2 + (p.y - F.y) ** 2) / (r * r * 0.6)));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-fo`}>
          <path d={outline} />
        </clipPath>
        <mask id={`${id}-rv`}>
          <circle cx={F.x} cy={F.y} r={R} fill="#FFF" />
        </mask>
        <radialGradient id={`${id}-ac`}>
          <stop offset="0" stopColor="#FFF4B0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-fo)`} mask={`url(#${id}-rv)`}>
        {/* layers that follow the finger's outline inward, as filled insets (no seams at the joints): epidermis,
            dermis inset by the epidermis, subcutaneous tissue inset by both */}
        <path d={outline} fill="#F7D3C1" />
        <path d={inset(epi)} fill="#E7A3A0" />
        <path d={inset(epi + derm)} fill="#F2CF86" />
        {/* the distal phalanx bone */}
        <path d={capsulePath(add(dist.a, mul(tan, -r * 0.2)), add(dist.b, mul(tan, -r * 0.55)), r * 0.42, r * 0.3)} fill="#F1E8DA" stroke="#B8A890" strokeWidth={w} />
        {/* the nerve fibre back along the finger toward the hand, and the signal on it */}
        <path d={`M${pac.x},${pac.y} Q${add(F, mul(nIn, r * 0.9)).x},${add(F, mul(nIn, r * 0.9)).y} ${nerveEnd.x},${nerveEnd.y}`} fill="none" stroke="#E5B83E" strokeWidth={w * 2.4} />
        {act > 0.05 && (
          <path d={`M${pac.x},${pac.y} Q${add(F, mul(nIn, r * 0.9)).x},${add(F, mul(nIn, r * 0.9)).y} ${nerveEnd.x},${nerveEnd.y}`} fill="none" stroke="#FFFBD8" strokeWidth={w * 4} strokeDasharray={`${(r * 0.6).toFixed(2)} ${(r * 30).toFixed(2)}`} strokeDashoffset={(-sig * r * 8).toFixed(2)} strokeLinecap="round" opacity={act} />
        )}
        {/* Pacinian corpuscle */}
        <g transform={`translate(${pac.x} ${pac.y}) rotate(${(Math.atan2(tan.y, tan.x) * 180) / Math.PI})`}>
          <ellipse rx={r * 0.5} ry={r * 0.32} fill={`url(#${id}-ac)`} opacity={act * (0.4 + 0.4 * mod)} />
          {[1, 0.7, 0.4].map((q, i) => (
            <ellipse key={i} rx={r * 0.28 * q} ry={r * 0.16 * q} fill={i === 0 ? '#FFF1D6' : 'none'} stroke="#C89A55" strokeWidth={w} />
          ))}
        </g>
        {/* Meissner corpuscles and Merkel discs near the focal spot */}
        {meiss.map((p, i) => (
          <g key={`m${i}`}>
            <circle cx={p.x} cy={p.y} r={r * 0.22} fill={`url(#${id}-ac)`} opacity={act * near(p) * (0.5 + 0.5 * mod)} />
            <ellipse cx={p.x} cy={p.y} rx={r * 0.06} ry={r * 0.1} transform={`rotate(${(Math.atan2(nIn.y, nIn.x) * 180) / Math.PI - 90} ${p.x} ${p.y})`} fill="#FFD77A" stroke={INK} strokeWidth={w * 0.8} />
          </g>
        ))}
        {merkel.map((p, i) => (
          <circle key={`k${i}`} cx={p.x} cy={p.y} r={r * 0.035} fill="#5CCB95" stroke={INK} strokeWidth={w * 0.6} />
        ))}
      </g>
      {/* the cut's rim: an explanatory window, in the overlay colour, only where it lies on the finger */}
      <g clipPath={`url(#${id}-fo)`}>
        <circle cx={F.x} cy={F.y} r={R} fill="none" stroke={CYAN} strokeWidth={w * 1.6} strokeDasharray={`${(w * 5).toFixed(2)} ${(w * 3.5).toFixed(2)}`} opacity={0.9} />
      </g>
    </g>
  );
};
