// V3 skin beat ("feel pressure."): a tasteful illustration of a slab of fingertip skin, entered and left by a graphic
// match on the focal glow. At the cut in, the slab's focus sits exactly on the lab focus (same screen point, size and
// skin-surface angle); it settles upright while the camera eases in, the converging crests arrive from below (the
// same direction as in the lab), the receptors respond and a signal runs up the nerve fibres; then it returns onto
// the fingertip's focus and the film cuts back to the hand.
// Anatomy (schematic, plausible): the skin surface faces DOWN toward the array; inward (up) are the epidermis with
// friction ridges, the dermis with papillae, Meissner corpuscles in the papillae tips, Merkel discs at the epidermal
// base, subcutaneous fat with a Pacinian corpuscle, and nerve fibres running back toward the hand.
// The pressure is shown as a faint ripple and a few-pixel give of the surface at the focus, never a dent.
import React from 'react';
import {INK} from '../dc/ink';
import {CYAN, CYAN_HI} from '../it/fx';
import {ss, lerp} from '../lib';
import {Conceptag} from '../it/tags';

type Props = {
  t: number;
  a: number; // interval start
  b: number; // interval end
  /** the lab focus on screen at the cuts, its glow radius (px) and the outward skin normal's angle (deg) */
  from: {x: number; y: number; r: number; normal: number};
  /** the lab focus at the cut back (it may have moved slightly with the camera) */
  to: {x: number; y: number; r: number; normal: number};
  /** when the receptors begin to respond */
  tAct: number;
};

const W = 820;
const ridgeY = (x: number) => 4 * Math.cos((x / 22) * Math.PI);
const papY = (x: number) => -72 + 14 * Math.cos((x / 58) * Math.PI);

export const SkinSlab: React.FC<Props> = ({t, a, b, from, to, tAct}) => {
  if (t < a || t >= b) return null;
  const inU = ss(t, a, a + 0.38);
  const outU = ss(t, b - 0.24, b);
  const u = inU * (1 - outU); // 0 at the matched ends, 1 in the presented pose
  const glowR = 120;
  // matched to the lab focus at the cut in (from) and at the cut back (to)
  const end = t < (a + b) / 2 ? from : to;
  const s0 = end.r / glowR;
  const rot0 = end.normal - 90; // local +y (outward, down) aligned to the skin's outward normal
  const settle = 1 + 0.06 * ss(t, a + 0.38, b - 0.24);
  const cx = lerp(end.x, 540, u), cy = lerp(end.y, 1120, u);
  const sc = lerp(s0, 1.2, u) * settle;
  const rot = lerp(rot0, 0, u);
  const act = ss(t, tAct, tAct + 0.25);
  const mod = 0.5 + 0.5 * Math.cos(2 * Math.PI * 4 * t);
  const give = 3 * act * mod; // a few pixels at the focus, no dent
  const xs: number[] = [];
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 6) xs.push(x);
  const surfPts = xs.map((x) => [x, ridgeY(x) - give * Math.exp(-((x / 70) ** 2))]);
  const papPts = xs.map((x) => [x, papY(x)]);
  const line = (pts: number[][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(2)}`).join(' ');
  const surf = line(surfPts);
  const pap = line(papPts);
  // epidermis: between the papillae line and the surface; dermis: between the dermis base and the papillae line
  const epiD = `${line(papPts)} ${surfPts.slice().reverse().map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(2)}`).join(' ')} Z`;
  const dermD = `M${-W / 2},-330 Q0,-350 ${W / 2},-330 ${papPts.slice().reverse().map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(2)}`).join(' ')} Z`;
  const slabTop = -600;
  const meiss = [-290, -174, -58, 58, 174, 290];
  const merkel = [-348, -232, -116, 0, 116, 232, 348];
  const fibres = [...meiss.map((x) => ({x, y: -100})), ...merkel.map((x) => ({x, y: -62})), {x: 70, y: -440}];
  const fib = (p: {x: number; y: number}, k: number) =>
    `M${p.x},${p.y} C${p.x},${p.y - 90} ${p.x + 80},${-300 - k * 6} ${W / 2 + 40},${-360 - k * 9}`;
  const sig = (k: number) => (t * 1.4 + k * 0.17) % 1;
  // a faint panel behind, so the illustration reads as a separate, explanatory view over the darkened lab
  const dim = 0.86 * ss(t, a, a + 0.18) * (1 - ss(t, b - 0.12, b));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#08151F" opacity={dim} />
      <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${sc.toFixed(4)})`}>
        <defs>
          <linearGradient id="sk3-epi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F3C6B2" />
            <stop offset="1" stopColor="#FADFCF" />
          </linearGradient>
          <linearGradient id="sk3-derm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9898A" />
            <stop offset="1" stopColor="#ECAAA4" />
          </linearGradient>
          <linearGradient id="sk3-fat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E8C062" stopOpacity="0" />
            <stop offset="0.3" stopColor="#ECC86C" />
            <stop offset="1" stopColor="#F4D688" />
          </linearGradient>
          <linearGradient id="sk3-under" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6D3C0" />
            <stop offset="1" stopColor="#E9B9A2" />
          </linearGradient>
          <radialGradient id="sk3-glow">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="0.3" stopColor={CYAN_HI} stopOpacity="0.75" />
            <stop offset="0.7" stopColor={CYAN} stopOpacity="0.25" />
            <stop offset="1" stopColor={CYAN} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sk3-act">
            <stop offset="0" stopColor="#FFF4B0" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFE07A" stopOpacity="0" />
          </radialGradient>
          <clipPath id="sk3-clip">
            <path d={`M${-W / 2},${slabTop} L${W / 2},${slabTop} L${W / 2},40 L${-W / 2},40 Z`} />
          </clipPath>
        </defs>
        {/* the converging crests arriving from below (the air side), and their bands */}
        {[0, 1, 2, 3, 4].map((k) => {
          const ph = (t * 1.6 + k / 5) % 1;
          const r = 40 + (1 - ph) * 420;
          const op = (0.25 + 0.75 * ph) * 0.8;
          return (
            <g key={k}>
              <path d={`M${-r * 0.85},${r * 0.53} A${r},${r} 0 0 0 ${r * 0.85},${r * 0.53}`} fill="none" stroke={CYAN} strokeWidth={26} opacity={op * 0.18} />
              <path d={`M${-r * 0.85},${r * 0.53} A${r},${r} 0 0 0 ${r * 0.85},${r * 0.53}`} fill="none" stroke={CYAN_HI} strokeWidth={4} opacity={op} />
            </g>
          );
        })}
        {/* the skin's underside: friction ridges seen from below, receding */}
        <path d={`M${-W / 2},${ridgeY(-W / 2)} L${W / 2},${ridgeY(W / 2)} L${W / 2 - 50},64 L${-W / 2 + 50},64 Z`} fill="url(#sk3-under)" stroke={INK} strokeWidth={3} />
        {Array.from({length: 7}).map((_, i) => (
          <ellipse key={i} cx={0} cy={30} rx={60 + i * 52} ry={(60 + i * 52) * 0.08 + 6} fill="none" stroke="#C9927C" strokeWidth={2} opacity={0.55} />
        ))}
        {[0, 1, 2].map((i) => {
          const ph = (t * 3 + i / 3) % 1;
          const r = 20 + ph * 90;
          return <ellipse key={`rp${i}`} cx={0} cy={22} rx={r} ry={r * 0.18} fill="none" stroke={CYAN_HI} strokeWidth={2.4} opacity={act * 0.75 * (1 - ph)} />;
        })}
        {/* the cross-section face */}
        <g clipPath="url(#sk3-clip)">
          <rect x={-W / 2} y={slabTop} width={W} height={-slabTop + 60} fill="url(#sk3-fat)" />
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={i} cx={-360 + i * 90 + (i % 2) * 20} cy={-470 + (i % 3) * 40} rx={44} ry={28} fill="#F7DE97" stroke="#D8AE55" strokeWidth={2} opacity={0.9} />
          ))}
          <path d={dermD} fill="url(#sk3-derm)" />
          {Array.from({length: 14}).map((_, i) => (
            <path key={i} d={`M${-400 + i * 60},-300 q30,-30 60,-10 t60,-12`} fill="none" stroke="#C97B7E" strokeWidth={1.6} opacity={0.35} />
          ))}
          <path d={epiD} fill="url(#sk3-epi)" />
          <path d={pap} fill="none" stroke="#B9706C" strokeWidth={2} />
          <path d={`M${-W / 2},-330 Q0,-350 ${W / 2},-330`} fill="none" stroke="#C48B4C" strokeWidth={2} opacity={0.7} />
          {/* nerve fibres and the signal running back toward the hand */}
          {fibres.map((p, k) => (
            <g key={`f${k}`}>
              <path d={fib(p, k)} fill="none" stroke="#7A5A1E" strokeWidth={5} opacity={0.5} />
              <path d={fib(p, k)} fill="none" stroke="#F2C94C" strokeWidth={3} />
              {act > 0.05 && <path d={fib(p, k)} fill="none" stroke="#FFFBD8" strokeWidth={6} strokeDasharray="22 900" strokeDashoffset={(-sig(k) * 760).toFixed(1)} strokeLinecap="round" opacity={act} />}
            </g>
          ))}
          {/* Merkel discs at the epidermal base */}
          {merkel.map((x, k) => {
            const near = Math.exp(-((x / 160) ** 2));
            return (
              <g key={`k${k}`}>
                <circle cx={x} cy={-62} r={26} fill="url(#sk3-act)" opacity={act * near * (0.5 + 0.5 * mod)} />
                <circle cx={x - 6} cy={-62} r={6} fill="#5CCB95" stroke={INK} strokeWidth={2} />
                <circle cx={x + 6} cy={-62} r={6} fill="#5CCB95" stroke={INK} strokeWidth={2} />
              </g>
            );
          })}
          {/* Meissner corpuscles in the papillae tips */}
          {meiss.map((x, k) => {
            const near = Math.exp(-((x / 180) ** 2));
            return (
              <g key={`m${k}`} transform={`translate(${x} -100)`}>
                <ellipse rx={34} ry={44} fill="url(#sk3-act)" opacity={act * near * (0.45 + 0.55 * mod)} />
                <ellipse rx={13} ry={23} fill="#FFD77A" stroke={INK} strokeWidth={2.4} />
                <path d="M-10,-10 L10,-10 M-12,0 L12,0 M-10,10 L10,10" stroke="#B9783A" strokeWidth={2} />
              </g>
            );
          })}
          {/* a Pacinian corpuscle deeper down */}
          <g transform="translate(70 -440)">
            <ellipse rx={110} ry={74} fill="url(#sk3-act)" opacity={act * (0.35 + 0.4 * mod)} />
            {[1, 0.8, 0.6, 0.4, 0.22].map((k, i) => (
              <ellipse key={i} rx={70 * k} ry={42 * k} fill={i === 0 ? '#FFF1D6' : 'none'} stroke="#C89A55" strokeWidth={2.4} />
            ))}
          </g>
          <path d={surf} fill="none" stroke={INK} strokeWidth={3.4} />
        </g>
        <path d={`M${-W / 2},${slabTop + 40} L${-W / 2},${ridgeY(-W / 2)} M${W / 2},${slabTop + 40} L${W / 2},${ridgeY(W / 2)}`} stroke={INK} strokeWidth={3} opacity={0.8} />
        {/* the focus on the skin */}
        <ellipse cx={0} cy={6} rx={glowR} ry={glowR * 0.55} fill="url(#sk3-glow)" opacity={0.8 + 0.2 * mod} />
        <g opacity={ss(t, a + 0.25, a + 0.42) * (1 - ss(t, b - 0.3, b - 0.2))}>
          <Conceptag x={-232} y={-196} label="TOUCH RECEPTORS" color="#FFE7A0" anchor="middle" s={2.1} />
        </g>
      </g>
    </g>
  );
};
