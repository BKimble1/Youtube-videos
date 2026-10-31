// The research lab (cm; the bench top's front edge at y = 0). A researcher behind the bench works over a petri dish
// holding a small sample of muscle in pink medium, with a micropipette. Background: a daylight window, shelves of
// glassware, a microscope. Cool, clean light; the pipette drop is the only warm accent.
import React from 'react';
import {P, closed, lerpP, open, pt} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {hash, lerp} from '../lib';

export const DISH: P = pt(14, -3.2);       // centre of the dish's liquid surface
export const SAMPLE: P = pt(14, -3.3);     // centre of the tissue sample
export const SAMPLE_RX = 2.6, SAMPLE_RY = 1.0;
export const PIP_TIP = (press: number): P => pt(14.2, -16 + 0 * press);

export type LabState = {t: number; press: number; drop: number; dropY: number; ripple: number; look: number; dim: number; lift?: number; tap?: number; glow?: number};

export const LabBack: React.FC<{s: LabState}> = ({s}) => {
  const id = uid('lw'), id2 = uid('lwin');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#D9E6F2" />
          <stop offset={1} stopColor="#A9BFD4" />
        </linearGradient>
        <linearGradient id={id2} x1="0" y1="0" x2="1" y2="1">
          <stop offset={0} stopColor="#FFFFFF" />
          <stop offset={1} stopColor="#CFE8FF" />
        </linearGradient>
      </defs>
      <rect x={-400} y={-400} width={800} height={420} fill={`url(#${id})`} />
      <rect x={-210} y={-300} width={120} height={190} rx={4} fill={`url(#${id2})`} stroke="#8EA4BA" strokeWidth={3} />
      <path d="M-150 -300 V-110 M-210 -205 H-90" stroke="#8EA4BA" strokeWidth={3} />
      {/* shelves of glassware */}
      {[-150, -90].map((y, k) => (
        <g key={k}>
          <rect x={-60} y={y} width={260} height={4} fill="#7E93A8" />
          {Array.from({length: 9}, (_, i) => {
            const x = -50 + i * 28 + hash(i + k * 9) * 6, h = 14 + hash(i * 3 + k) * 14, w = 7 + hash(i * 5 + k) * 5;
            const c = ['#7FD6C8', '#F3A0B8', '#9CC0FF', '#FFE08A', '#C7B4FF'][Math.floor(hash(i * 7 + k * 3) * 5)];
            return (
              <g key={i}>
                <rect x={x} y={y - h} width={w} height={h} rx={2} fill="#EAF4FF" opacity={0.65} stroke="#9FB4C8" strokeWidth={0.6} />
                <rect x={x + 0.8} y={y - h * 0.55} width={w - 1.6} height={h * 0.55 - 0.8} rx={1.2} fill={c} opacity={0.8} />
              </g>
            );
          })}
        </g>
      ))}
      {/* microscope at the far end of the bench */}
      <g transform="translate(62 0)">
        <rect x={-14} y={-6} width={28} height={6} rx={2} fill="#E8EEF5" stroke="#5E7186" strokeWidth={0.8} />
        <path d="M6 -6 V-44 Q6 -52 -2 -54 L-10 -56" stroke="#E8EEF5" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M6 -6 V-44 Q6 -52 -2 -54 L-10 -56" stroke="#5E7186" strokeWidth={9.6} fill="none" strokeLinecap="round" opacity={0.25} />
        <rect x={-14} y={-30} width={18} height={3} rx={1} fill="#5E7186" />
        <rect x={-10} y={-56} width={6} height={18} rx={2} fill="#3B4A5C" transform="rotate(-20 -7 -47)" />
        <rect x={-6} y={-40} width={4} height={8} fill="#3B4A5C" />
      </g>
      {s.dim > 0 && <rect x={-400} y={-400} width={800} height={420} fill="#0A1420" opacity={s.dim} />}
    </g>
  );
};

/** the researcher: lab coat, safety glasses, hair in a bun, purple nitrile gloves */
export const Researcher: React.FC<{s: LabState}> = ({s}) => {
  const skin = '#B9785A', skinS = '#8C5238', ink = '#3A2218';
  const coat = '#F4F8FC', coatS = '#C5D3E2', coatInk = '#4A5A6E';
  const glove = '#8D6BE0', gloveS = '#6447B8';
  const h = pt(-26, -56);
  const look = s.look;
  const press = s.press;
  const lift = s.lift ?? 0, tap = s.tap ?? 0;
  const hand = pt(12.6 + 0.3 * tap, -20.5 - lift + 0.2 * tap);
  return (
    <g>
      {/* torso in the coat, behind the bench */}
      <path d={closed([pt(-48, 4), pt(-46, -24), pt(-38, -38), pt(-26, -42), pt(-14, -38), pt(-6, -26), pt(-4, 4)], 0.85)} fill={coat} stroke={coatInk} strokeWidth={0.6} />
      <path d={open([pt(-22, -40), pt(-18, -28), pt(-14, -12), pt(-12, 4)])} stroke={coatS} strokeWidth={1.2} fill="none" />
      <path d={closed([pt(-26, -42), pt(-20, -36), pt(-17, -42)], 0.6)} fill="#5F7FA8" />
      {/* the far arm steadies the dish */}
      <path d={closed([pt(-14, -36), pt(-4, -20), pt(8, -9), pt(10, -5.5), pt(5, -4.5), pt(-8, -13), pt(-18, -26)], 0.85)} fill={coatS} stroke={coatInk} strokeWidth={0.6} />
      <ellipse cx={8.8} cy={-5.4} rx={3.2} ry={1.9} fill={gloveS} stroke="#2E2060" strokeWidth={0.4} />
      {/* head: three-quarter, looking down at the dish */}
      <g transform={`rotate(${8 + 6 * look} ${h.x} ${h.y + 7})`}>
        <path d={closed([pt(h.x - 3, h.y + 7), pt(h.x + 3, h.y + 8), pt(h.x + 3, h.y + 13), pt(h.x - 3, h.y + 13)], 0.5)} fill={skinS} />
        <path d={closed([pt(h.x - 7.5, h.y - 2), pt(h.x - 5, h.y - 8.5), pt(h.x + 2, h.y - 9.5), pt(h.x + 7.6, h.y - 5.5), pt(h.x + 8.6, h.y + 0.5), pt(h.x + 7.6, h.y + 5.6), pt(h.x + 3.5, h.y + 8.3), pt(h.x - 2, h.y + 7.4), pt(h.x - 6.8, h.y + 3.2)], 0.9)} fill={skin} stroke={ink} strokeWidth={0.4} />
        {/* hair pulled back into a bun */}
        <path d={closed([pt(h.x - 8, h.y + 1), pt(h.x - 7.6, h.y - 6), pt(h.x - 2, h.y - 10.4), pt(h.x + 5, h.y - 9.6), pt(h.x + 8, h.y - 6), pt(h.x + 3, h.y - 7), pt(h.x - 3, h.y - 5), pt(h.x - 5, h.y - 1)], 0.85)} fill="#24150E" />
        <circle cx={h.x - 8.6} cy={h.y - 6.5} r={3.4} fill="#24150E" />
        <path d={open([pt(h.x + 8.2, h.y - 1), pt(h.x + 9.6, h.y + 2.4), pt(h.x + 8.3, h.y + 3)])} stroke={ink} strokeWidth={0.4} fill={skin} />
        {/* safety glasses */}
        <path d={closed([pt(h.x + 0.6, h.y - 2.6), pt(h.x + 8.9, h.y - 3.2), pt(h.x + 8.6, h.y + 0.6), pt(h.x + 1.2, h.y + 1.1)], 0.6)} fill="#BFE9FF" opacity={0.55} stroke="#2E4A66" strokeWidth={0.5} />
        <path d={open([pt(h.x + 0.6, h.y - 2), pt(h.x - 4.6, h.y - 1.6)])} stroke="#2E4A66" strokeWidth={0.6} />
        <ellipse cx={h.x + 5.6} cy={h.y - 0.8 + 0.4 * look} rx={0.9} ry={0.65} fill="#1A0F09" />
        <path d={open([pt(h.x + 4, h.y - 3.8), pt(h.x + 7, h.y - 4.2)])} stroke="#24150E" strokeWidth={0.6} strokeLinecap="round" />
        <path d={open([pt(h.x + 5, h.y + 4.6), pt(h.x + 7, h.y + 4.5)])} stroke={ink} strokeWidth={0.4} strokeLinecap="round" />
      </g>
      {/* near arm holding the pipette */}
      {/* upper arm down to the elbow, forearm forward to the pipette, a cuff and the wrist */}
      <path d={closed([pt(-32, -38), pt(-22, -41), pt(-14, -30), pt(-12, -19), pt(-17, -16), pt(-24, -22), pt(-30, -30)], 0.85)} fill={coat} stroke={coatInk} strokeWidth={0.6} />
      <path d={closed([pt(-17, -22), pt(-13, -25), pt(hand.x - 4.6, hand.y - 2.4), pt(hand.x - 4.2, hand.y + 2.6), pt(-12, -15.5), pt(-17, -17)], 0.85)} fill={coat} stroke={coatInk} strokeWidth={0.6} />
      <path d={open([pt(-15, -20), pt(hand.x - 6, hand.y + 0.6)])} stroke={coatS} strokeWidth={0.9} fill="none" />
      <rect x={hand.x - 5.6} y={hand.y - 2.6} width={2.4} height={5.4} rx={0.8} fill={coatS} stroke={coatInk} strokeWidth={0.4} transform={`rotate(-8 ${hand.x - 4.4} ${hand.y})`} />
      <path d={closed([pt(hand.x - 3.4, hand.y - 1.8), pt(hand.x - 0.5, hand.y - 2.0), pt(hand.x - 0.6, hand.y + 2.4), pt(hand.x - 3.4, hand.y + 2.2)], 0.6)} fill={glove} stroke="#2E2060" strokeWidth={0.35} />
      <Syringe s={s} />
      <path d={closed([pt(hand.x - 1, hand.y - 2.2), pt(hand.x + 2.4, hand.y - 2.6), pt(hand.x + 5.4, hand.y - 0.4), pt(hand.x + 5.2, hand.y + 3.6), pt(hand.x + 2.2, hand.y + 4.6), pt(hand.x - 1, hand.y + 2.6)], 0.8)} fill={glove} stroke="#2E2060" strokeWidth={0.4} />
      {[0.6, 1.9, 3.2].map((dy, i) => <path key={i} d={`M${hand.x + 4.6} ${hand.y + dy} h1.4`} stroke={gloveS} strokeWidth={0.5} strokeLinecap="round" />)}
      {/* thumb on the plunger */}
      <path d={`M${hand.x + 1.6} ${hand.y - 1.4} Q${hand.x + 2.4} ${hand.y - 6 + 9.5 * press} ${hand.x + 1.4} ${hand.y - 9.6 + 9.5 * press}`} stroke={glove} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </g>
  );
};

/** the syringe: a barrel of glowing treatment (antibody molecules drift inside it), plunger, needle down to the sample */
export const SYR_TIP = (s: LabState): P => pt(14, -3.6 - (s.lift ?? 0));
export const Syringe: React.FC<{s: LabState}> = ({s}) => {
  const tip = SYR_TIP(s);
  const tap = s.tap ?? 0;
  const x = tip.x + 0.25 * tap;
  const b0 = tip.y - 6.2, b1 = b0 - 13;           // barrel from b0 (bottom) up to b1
  const level = b1 + 1.2 + 9.5 * s.press;          // the liquid's top drops as the plunger goes in
  const pl = level - 0.4;
  const id = uid('syr');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset={0} stopColor="#2FE0C6" stopOpacity={0.55} />
          <stop offset={0.4} stopColor="#9FFFF0" stopOpacity={0.75} />
          <stop offset={1} stopColor="#1FB8A3" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* needle */}
      <path d={`M${x - 0.12} ${b0 + 1.2} L${x - 0.05} ${tip.y} L${x + 0.05} ${tip.y} L${x + 0.12} ${b0 + 1.2} Z`} fill="#C9D3DD" stroke="#5E6F82" strokeWidth={0.08} />
      <rect x={x - 0.45} y={b0} width={0.9} height={1.4} rx={0.25} fill="#9FB2C4" stroke="#5E6F82" strokeWidth={0.1} />
      {/* barrel and its glowing liquid */}
      <rect x={x - 1.15} y={b1} width={2.3} height={b0 - b1} rx={0.4} fill="#EAF6FF" opacity={0.5} stroke="#7F95AA" strokeWidth={0.14} />
      <rect x={x - 1.0} y={level} width={2.0} height={Math.max(0, b0 - level - 0.15)} rx={0.3} fill={`url(#${id})`} />
      {Array.from({length: 12}, (_, i) => {
        const yy = level + 0.5 + ((i * 0.618 + s.t * 0.25) % 1) * Math.max(0.1, b0 - level - 1);
        const xx = x - 0.7 + 1.4 * ((i * 0.37) % 1);
        return <path key={i} d={`M${xx} ${yy} l0 0.32 M${xx} ${yy} l-0.2 -0.22 M${xx} ${yy} l0.2 -0.22`} stroke="#0B5E54" strokeWidth={0.07} strokeLinecap="round" opacity={0.8} />;
      })}
      {tap > 0.05 && [0, 1, 2].map((k) => <circle key={k} cx={x - 0.4 + 0.4 * k} cy={level + 1.5 - 1.2 * tap - 0.3 * k} r={0.18} fill="#FFFFFF" opacity={0.7 * tap} />)}
      {[0.25, 0.5, 0.75].map((k, i) => <path key={i} d={`M${x + 0.6} ${b1 + (b0 - b1) * k} h0.5`} stroke="#5E6F82" strokeWidth={0.08} />)}
      <rect x={x - 1.05} y={b1 + 0.3} width={0.35} height={b0 - b1 - 0.6} rx={0.17} fill="#FFFFFF" opacity={0.35} />
      {/* plunger: rubber stopper at the liquid's top, rod up to the thumb pad; the flange */}
      <rect x={x - 1.0} y={pl - 0.5} width={2.0} height={0.6} fill="#3A3F4E" />
      <rect x={x - 0.22} y={pl - 6.2} width={0.44} height={5.8} fill="#D9E1EA" stroke="#7F95AA" strokeWidth={0.08} />
      <rect x={x - 1.1} y={pl - 6.7} width={2.2} height={0.55} rx={0.25} fill="#D9E1EA" stroke="#7F95AA" strokeWidth={0.1} />
      <rect x={x - 2.0} y={b1 - 0.25} width={4.0} height={0.5} rx={0.25} fill="#D9E1EA" stroke="#7F95AA" strokeWidth={0.1} />
    </g>
  );
};
export const Pipette: React.FC<{s: LabState}> = ({s}) => {
  const tip = PIP_TIP(s.press);
  const top = -30;
  return (
    <g>
      <rect x={tip.x - 1.5} y={top} width={3} height={8} rx={1.2} fill="#E9EEF4" stroke="#4A5A6E" strokeWidth={0.4} />
      <rect x={tip.x - 0.6} y={top - 2.4 + 0.6 * s.press} width={1.2} height={2.6} rx={0.4} fill="#3A7BE0" />
      <path d={`M${tip.x - 1.1} ${top + 8} L${tip.x - 0.25} ${tip.y} L${tip.x + 0.25} ${tip.y} L${tip.x + 1.1} ${top + 8} Z`} fill="#F7FBFF" opacity={0.9} stroke="#8EA4BA" strokeWidth={0.25} />
      <path d={`M${tip.x - 0.7} ${top + 11} L${tip.x - 0.2} ${tip.y - 1} L${tip.x + 0.2} ${tip.y - 1} L${tip.x + 0.7} ${top + 11} Z`} fill="#7FE8D6" opacity={0.7} />
    </g>
  );
};

/** the petri dish (seen from just above the bench), its pink medium and the sample; the drop falls into it */
export const Dish: React.FC<{s: LabState; inSample?: React.ReactNode}> = ({s, inSample}) => {
  const c = DISH;
  const id = uid('dm'), idC = uid('dc');
  const tip = PIP_TIP(s.press);
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.45" cy="0.4" r="0.7">
          <stop offset={0} stopColor="#FFB7C9" />
          <stop offset={1} stopColor="#E77E9E" />
        </radialGradient>
        <clipPath id={idC}>
          <ellipse cx={SAMPLE.x} cy={SAMPLE.y} rx={SAMPLE_RX} ry={SAMPLE_RY} />
        </clipPath>
      </defs>
      <ellipse cx={c.x} cy={c.y + 2.2} rx={7.6} ry={2.4} fill="#000" opacity={0.12} />
      <ellipse cx={c.x} cy={c.y + 1.2} rx={6.4} ry={2.2} fill="#DDEBF6" stroke="#8EA4BA" strokeWidth={0.25} />
      <ellipse cx={c.x} cy={c.y} rx={6} ry={2} fill={`url(#${id})`} opacity={0.9} />
      <ellipse cx={SAMPLE.x} cy={SAMPLE.y} rx={SAMPLE_RX + 0.15} ry={SAMPLE_RY + 0.1} fill="#7E1724" />
      <g clipPath={`url(#${idC})`}>
        <rect x={SAMPLE.x - 3} y={SAMPLE.y - 1.2} width={6} height={2.4} fill="#C23C48" />
        {inSample}
      </g>
      {s.ripple > 0 && s.ripple < 1 && <ellipse cx={SAMPLE.x + 0.2} cy={SAMPLE.y - 0.1} rx={0.4 + 3.6 * s.ripple} ry={0.15 + 1.2 * s.ripple} fill="none" stroke="#FFFFFF" strokeWidth={0.12} opacity={1 - s.ripple} />}
      <path d={`M${c.x - 6} ${c.y} A6 2 0 0 1 ${c.x + 6} ${c.y}`} fill="none" stroke="#FFFFFF" strokeWidth={0.3} opacity={0.8} />
      <path d={`M${c.x - 6.4} ${c.y + 1.2} A6.4 2.2 0 0 0 ${c.x + 6.4} ${c.y + 1.2}`} fill="none" stroke="#FFFFFF" strokeWidth={0.2} opacity={0.6} />
      {(s.glow ?? 0) > 0.01 && <ellipse cx={SAMPLE.x} cy={SAMPLE.y} rx={0.3 + 2.4 * (s.glow ?? 0)} ry={0.12 + 0.9 * (s.glow ?? 0)} fill="#7FF0DD" opacity={0.5 * (1 - 0.4 * (s.glow ?? 0))} />}
      {false && s.drop > 0 && (
        <g>
          <ellipse cx={tip.x} cy={lerp(tip.y + 0.35 * s.drop, s.dropY, 1)} rx={0.32 * s.drop} ry={0.4 * s.drop} fill="#7FF0DD" stroke="#0E6E62" strokeWidth={0.06} opacity={0.95} />
          <circle cx={tip.x - 0.1} cy={s.dropY - 0.12} r={0.1 * s.drop} fill="#FFFFFF" />
        </g>
      )}
    </g>
  );
};

export const BenchTop: React.FC = () => (
  <g>
    <rect x={-400} y={-8} width={800} height={8} fill="#E6EDF4" />
    <rect x={-400} y={0} width={800} height={4} fill="#9BAFC4" />
    <rect x={-400} y={4} width={800} height={200} fill="#5C6F86" />
    <path d="M-400 -8 H400" stroke="#FFFFFF" strokeWidth={0.4} opacity={0.8} />
  </g>
);
void mix;

// ---------------------------------------------------------------- V5: the scientist, properly staged
/** A scientist standing behind the bench in three-quarter view (turned toward screen right). The bench top crosses
 *  the coat at waist height; both shoulders join the torso; the far hand grips the syringe barrel (fingers wrapped
 *  round it, thumb on the plunger) in front of the body, above the bench; the near hand steadies the dish. */
export const SCI_DISH = pt(15, -4.2);
export type SciState = {t: number; press: number; lean: number; drop: number; dropY: number; ripple: number; glow: number};
export const sciNeedle = (s: SciState) => pt(15 - 1.2 * s.lean, -10.4 + 4.2 * s.lean);
const tubeL = (pts: P[], r: number[]) => {
  const n = pts.length;
  const T = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return pt((b.x - a.x) / l, (b.y - a.y) / l);
  });
  const N = T.map((v) => pt(-v.y, v.x));
  return closed([...pts.map((p, i) => pt(p.x + N[i].x * r[i], p.y + N[i].y * r[i])), ...[...pts].reverse().map((p, i) => pt(p.x - N[n - 1 - i].x * r[n - 1 - i], p.y - N[n - 1 - i].y * r[n - 1 - i]))], 0.8);
};
export const Scientist: React.FC<{s: SciState; layer: 'back' | 'front'}> = ({s, layer}) => {
  const skin = '#B9785A', skinS = '#8C5238', ink = '#3A2218';
  const coat = '#F4F8FC', coatS = '#C9D6E4', coatInk = '#4A5A6E';
  const glove = '#8D6BE0', gloveS = '#6447B8', gloveInk = '#2E2060';
  const L = s.lean;
  const sh = pt(1.2 * L, 1.2 * L); // the upper body leans in toward the dish
  const P_ = (x: number, y: number) => pt(x + sh.x, y + sh.y);
  const head = P_(-5, -79);
  const N = P_(-23, -58), F = P_(9, -60);           // near and far shoulders
  const needle = sciNeedle(s);
  const barrelTop = pt(needle.x, needle.y - 19), barrelBot = pt(needle.x, needle.y - 5.6);
  const grip = pt(needle.x, needle.y - 12.5);       // the far hand round the barrel
  const Ef = P_(18, -40), Hn = pt(SCI_DISH.x - 7.2, -6.2), En = P_(-19, -33);
  const level = barrelTop.y + 1.4 + 10.5 * s.press;
  const idS = uid('scS');
  if (layer === 'back') return (
    <g>
      {/* torso in the coat: chest toward the camera, the far shoulder tucked behind */}
      <path d={closed([P_(-31, 6), P_(-31, -36), N, P_(-14, -64), P_(-1, -66), F, P_(16, -44), P_(17, 6)], 0.85)} fill={coat} stroke={coatInk} strokeWidth={0.6} strokeLinejoin="round" />
      <path d={closed([P_(-14, -64), P_(-6, -52), P_(-1, -66)], 0.6)} fill="#5F7FA8" />
      <path d={open([P_(-6, -52), P_(-7, -30), P_(-8, -4)])} stroke={coatS} strokeWidth={1.2} fill="none" />
      <path d={open([P_(-14, -64), P_(-9, -48), P_(-6, -52)])} stroke={coatInk} strokeWidth={0.5} fill="none" />
      <path d={open([P_(-1, -66), P_(-3, -50), P_(-6, -52)])} stroke={coatInk} strokeWidth={0.5} fill="none" />
      <rect x={P_(4, -40).x} y={P_(4, -40).y} width={7} height={8} rx={1} fill={coatS} opacity={0.6} />
      {/* neck and head (three-quarter; one face design: eyes on the face plane) */}
      <path d={closed([P_(-9.5, -66), P_(-9, -72), P_(-2, -72), P_(-1.5, -65)], 0.6)} fill={skinS} />
      <g transform={`rotate(${6 + 8 * L} ${head.x} ${head.y + 8})`}>
        <path d={closed([pt(head.x - 8, head.y - 1.6), pt(head.x - 6.6, head.y - 7.6), pt(head.x - 2.2, head.y - 10.6), pt(head.x + 3.2, head.y - 10.6), pt(head.x + 7.4, head.y - 7.2), pt(head.x + 8.6, head.y - 2), pt(head.x + 8.4, head.y + 3.4), pt(head.x + 6.6, head.y + 7.2), pt(head.x + 3.4, head.y + 9.4), pt(head.x - 0.6, head.y + 9.2), pt(head.x - 5, head.y + 5.6), pt(head.x - 7.6, head.y + 2)], 0.9)} fill={skin} stroke={ink} strokeWidth={0.4} />
        <path d={closed([pt(head.x - 8.4, head.y + 0.6), pt(head.x - 8.4, head.y - 7), pt(head.x - 3.4, head.y - 11.6), pt(head.x + 3.6, head.y - 11.6), pt(head.x + 8.2, head.y - 7.4), pt(head.x + 6.4, head.y - 6.6), pt(head.x + 1, head.y - 7.6), pt(head.x - 3.4, head.y - 5.6), pt(head.x - 5.2, head.y - 1.4)], 0.85)} fill="#24150E" />
        <circle cx={head.x - 8.4} cy={head.y - 6.2} r={3.2} fill="#24150E" />
        <path d={closed([pt(head.x - 4.8, head.y - 1.6), pt(head.x - 6.4, head.y - 2), pt(head.x - 7, head.y + 0.6), pt(head.x - 5.2, head.y + 2.4)], 0.8)} fill={skinS} />
        {/* safety glasses over both eyes, both inside the face */}
        <path d={closed([pt(head.x - 2.4, head.y - 3.2), pt(head.x + 7.6, head.y - 3.4), pt(head.x + 7.4, head.y + 0.4), pt(head.x - 2.2, head.y + 0.6)], 0.5)} fill="#BFE9FF" opacity={0.5} stroke="#2E4A66" strokeWidth={0.45} />
        <path d={open([pt(head.x - 2.4, head.y - 2.4), pt(head.x - 5.6, head.y - 2)])} stroke="#2E4A66" strokeWidth={0.5} />
        <ellipse cx={head.x + 0.8} cy={head.y - 1.2 + 0.5 * L} rx={0.9} ry={0.7} fill="#1A0F09" />
        <ellipse cx={head.x + 5.6} cy={head.y - 1.3 + 0.5 * L} rx={0.65} ry={0.65} fill="#1A0F09" />
        <path d={open([pt(head.x - 0.6, head.y - 4.6), pt(head.x + 2.2, head.y - 4.9)])} stroke="#24150E" strokeWidth={0.55} strokeLinecap="round" />
        <path d={open([pt(head.x + 4.6, head.y - 4.8), pt(head.x + 6.8, head.y - 4.6)])} stroke="#24150E" strokeWidth={0.45} strokeLinecap="round" />
        <path d={open([pt(head.x + 3.2, head.y - 1), pt(head.x + 4.4, head.y + 2.2), pt(head.x + 3.2, head.y + 2.8)])} stroke={ink} strokeWidth={0.35} fill="none" />
        <path d={open([pt(head.x + 1.6, head.y + 5.2), pt(head.x + 3.4, head.y + 5.4), pt(head.x + 5, head.y + 5)])} stroke={ink} strokeWidth={0.4} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
  return (
    <g>
      {/* near arm: shoulder, elbow, the hand resting on the bench at the dish's rim */}
      <path d={tubeL([N, lerpP(N, En, 0.5), En, lerpP(En, Hn, 0.5), pt(Hn.x - 2.4, Hn.y - 1)], [4.4, 4.2, 3.8, 3.4, 3.0])} fill={coat} stroke={coatInk} strokeWidth={0.6} />
      <path d={open([pt(N.x + 1, N.y + 6), lerpP(N, En, 0.7)])} stroke={coatS} strokeWidth={1.2} fill="none" />
      <rect x={Hn.x - 5.2} y={Hn.y - 3.2} width={2.6} height={5.4} rx={1} fill={coatS} stroke={coatInk} strokeWidth={0.4} transform={`rotate(-55 ${Hn.x - 3.9} ${Hn.y - 0.5})`} />
      <path d={closed([pt(Hn.x - 3, Hn.y - 2.4), pt(Hn.x + 2.6, Hn.y - 2.2), pt(Hn.x + 4.6, Hn.y - 0.4), pt(Hn.x + 3.6, Hn.y + 1.6), pt(Hn.x - 2.6, Hn.y + 1.8)], 0.8)} fill={glove} stroke={gloveInk} strokeWidth={0.4} />
      {[0.4, 1.6, 2.8].map((dx, i) => <path key={i} d={`M${Hn.x + dx} ${Hn.y - 1.8} l1.4 2.6`} stroke={gloveS} strokeWidth={0.4} />)}
      {/* far arm: shoulder, elbow out to the side, forearm up to the hand round the barrel */}
      <path d={tubeL([F, lerpP(F, Ef, 0.5), Ef, lerpP(Ef, grip, 0.55), pt(grip.x + 2.6, grip.y + 1)], [4.2, 4.0, 3.6, 3.2, 2.8])} fill={coat} stroke={coatInk} strokeWidth={0.6} />
      <path d={open([lerpP(F, Ef, 0.3), Ef, lerpP(Ef, grip, 0.4)])} stroke={coatS} strokeWidth={1.1} fill="none" />
      <rect x={grip.x + 2.1} y={grip.y - 2.6} width={2.6} height={5.4} rx={1} fill={coatS} stroke={coatInk} strokeWidth={0.4} transform={`rotate(-20 ${grip.x + 3.4} ${grip.y})`} />
      {/* the syringe, in front of the body and above the bench: barrel of treatment, needle down to the sample */}
      <defs>
        <linearGradient id={idS} x1="0" y1="0" x2="1" y2="0">
          <stop offset={0} stopColor="#2FE0C6" stopOpacity={0.55} />
          <stop offset={0.4} stopColor="#9FFFF0" stopOpacity={0.8} />
          <stop offset={1} stopColor="#1FB8A3" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <path d={`M${needle.x - 0.12} ${barrelBot.y + 1.2} L${needle.x - 0.05} ${needle.y} L${needle.x + 0.05} ${needle.y} L${needle.x + 0.12} ${barrelBot.y + 1.2} Z`} fill="#C9D3DD" stroke="#5E6F82" strokeWidth={0.08} />
      <rect x={needle.x - 0.45} y={barrelBot.y} width={0.9} height={1.3} rx={0.25} fill="#9FB2C4" stroke="#5E6F82" strokeWidth={0.1} />
      <rect x={needle.x - 1.2} y={barrelTop.y} width={2.4} height={barrelBot.y - barrelTop.y} rx={0.4} fill="#EAF6FF" opacity={0.55} stroke="#7F95AA" strokeWidth={0.14} />
      <rect x={needle.x - 1.05} y={level} width={2.1} height={Math.max(0, barrelBot.y - level - 0.15)} rx={0.3} fill={`url(#${idS})`} />
      {Array.from({length: 9}, (_, i) => {
        const yy = level + 0.6 + ((i * 0.618 + s.t * 0.3) % 1) * Math.max(0.1, barrelBot.y - level - 1.2);
        const xx = needle.x - 0.7 + 1.4 * ((i * 0.37) % 1);
        return <path key={i} d={`M${xx} ${yy} l0 0.32 M${xx} ${yy} l-0.2 -0.22 M${xx} ${yy} l0.2 -0.22`} stroke="#0B5E54" strokeWidth={0.07} strokeLinecap="round" opacity={0.8} />;
      })}
      <rect x={needle.x - 1.05} y={level - 0.5} width={2.1} height={0.6} fill="#3A3F4E" />
      <rect x={needle.x - 0.22} y={level - 6.6} width={0.44} height={6.2} fill="#D9E1EA" stroke="#7F95AA" strokeWidth={0.08} />
      <rect x={needle.x - 1.15} y={level - 7.1} width={2.3} height={0.55} rx={0.25} fill="#D9E1EA" stroke="#7F95AA" strokeWidth={0.1} />
      <rect x={needle.x - 2.1} y={barrelTop.y - 0.25} width={4.2} height={0.5} rx={0.25} fill="#D9E1EA" stroke="#7F95AA" strokeWidth={0.1} />
      {/* the far hand: fingers wrapped round the barrel (in front of it), the thumb up on the plunger pad */}
      <path d={closed([pt(grip.x + 3.2, grip.y - 2.2), pt(grip.x - 1.6, grip.y - 2.8), pt(grip.x - 2.2, grip.y + 2.4), pt(grip.x + 2.8, grip.y + 2.6)], 0.8)} fill={glove} stroke={gloveInk} strokeWidth={0.4} />
      {[-1.6, -0.3, 1.0, 2.2].map((dy, i) => <path key={i} d={`M${grip.x - 1.9} ${grip.y + dy * 0.9} q-0.8 0.3 -0.2 0.9`} stroke={gloveS} strokeWidth={0.45} fill="none" />)}
      <path d={`M${grip.x + 2.4} ${grip.y - 2.0} Q${grip.x + 2.2} ${(grip.y + level - 7) / 2} ${needle.x + 0.6} ${level - 7.3}`} stroke={glove} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <path d={`M${grip.x + 2.4} ${grip.y - 2.0} Q${grip.x + 2.2} ${(grip.y + level - 7) / 2} ${needle.x + 0.6} ${level - 7.3}`} stroke={gloveInk} strokeWidth={0.25} strokeLinecap="round" fill="none" opacity={0.6} />
      {/* the drop of treatment at the needle tip, falling onto the sample */}
      {s.drop > 0 && <ellipse cx={needle.x} cy={s.dropY} rx={0.3 * s.drop + 0.1} ry={0.4 * s.drop + 0.1} fill="#7FF0DD" stroke="#0E6E62" strokeWidth={0.06} />}
    </g>
  );
};
