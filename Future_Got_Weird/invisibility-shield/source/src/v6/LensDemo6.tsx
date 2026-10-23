// V5 optical cutaway (film 6.95-13.1 s), one continuous illustration in the Crew style:
//  6.95-7.85  the ribs of the panel (face-on, as the push left them) tilt over into their cross-section: a row of
//             curved glass ridges, seen end-on, with her and the corridor wall behind them
//  8.2-10.45  "they spread the light coming from your body sideways": light from her face and shirt runs down to the
//             ridges and leaves each one as a fan, spreading sideways across the whole panel
//  10.7-12.0  "while smearing the background across the space where you're standing": light from the wall's stripe
//             and door glow, from beside her, fans out through the ridges in front of her
//  12.0-13.1  the ridges rise back up over her (face-on again) and what each one shows stretches sideways: the wall's
//             bands run straight through, her outline breaks up and fades
// No labels, arrows or text: the light is drawn as moving coloured strokes.
import React from 'react';
import {BODY_P, INK, PERSON} from './cast6';
import {Crew4, Pose4} from './Crew6';
import {NIGHT} from './Corridor6';
import {Card, v3} from './geo6';
import {crouch, FACES} from './poses6';

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ss = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const DEMO = {t0: 6.95, tilt1: 7.85, her0: 8.15, her1: 10.5, bg0: 10.6, bg1: 12.05, back0: 12.0, back1: 12.55, stretch1: 13.0, t1: 13.1};
const W = 1080;
const RIB = 168; // matches the rib pitch at the end of the push
const YC = 1130; // the sheet line in the cross-section
const N = 9;
const X0 = 540 - (N * RIB) / 2;

const Backdrop: React.FC<{t: number}> = ({t}) => {
  const ol = 3.2;
  return (
    <g>
      <rect x={0} y={0} width={W} height={1920} fill={NIGHT.fog} />
      <rect x={0} y={120} width={W} height={660} fill={NIGHT.wallUp} />
      <rect x={0} y={780} width={W} height={230} fill={NIGHT.wallLo} />
      <rect x={0} y={770} width={W} height={16} fill={NIGHT.stripe} />
      <rect x={0} y={1010} width={W} height={910} fill={NIGHT.floor} />
      {[1150, 1300, 1480, 1700].map((y, i) => <line key={i} x1={0} x2={W} y1={y} y2={y} stroke={NIGHT.floorLine} strokeWidth={2} />)}
      {/* lab door with its glowing window */}
      <rect x={70} y={330} width={250} height={680} fill={NIGHT.doorFrame} stroke={INK} strokeWidth={ol} />
      <rect x={92} y={350} width={206} height={660} fill={NIGHT.door} stroke={INK} strokeWidth={ol} />
      <rect x={160} y={430} width={70} height={190} rx={4} fill={NIGHT.glowTeal} stroke={INK} strokeWidth={ol} />
      <circle cx={195} cy={525} r={150} fill="url(#ldGlow)" opacity={0.45} />
      {/* the lab window: flasks, a microscope, a monitor glow */}
      <rect x={720} y={250} width={320} height={330} fill={NIGHT.doorFrame} stroke={INK} strokeWidth={ol} />
      <rect x={738} y={268} width={284} height={294} fill="#173A45" stroke={INK} strokeWidth={ol} />
      <rect x={738} y={470} width={284} height={20} fill="#0E252D" />
      <path d="M 770 470 L 770 420 Q 760 410 770 400 L 790 400 Q 800 410 790 420 L 790 470 Z" fill="#3FA9A3" stroke={INK} strokeWidth={2} />
      <circle cx={840} cy={448} r={22} fill="#2C7E83" stroke={INK} strokeWidth={2} />
      <rect x={834} y={398} width={12} height={30} fill="#2C7E83" stroke={INK} strokeWidth={2} />
      <path d="M 900 470 L 905 430 L 925 410 L 940 418 L 925 436 L 935 470 Z" fill="#244E57" stroke={INK} strokeWidth={2} />
      <rect x={960} y={300} width={50} height={90} rx={4} fill="#7FD4D0" opacity={0.75 + 0.1 * Math.sin(t * 3.1)} stroke={INK} strokeWidth={2} />
      <line x1={0} x2={W} y1={120} y2={120} stroke={INK} strokeWidth={ol} />
      <line x1={0} x2={W} y1={1010} y2={1010} stroke={INK} strokeWidth={ol} />
    </g>
  );
};

const herCard: Card = {x: 540, y: 1075, k: 1.95, phi: 0, depth: 3};
const kf = (t: number, k: [number, number][]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ss(t, k[i - 1][0], k[i][0]));
  return k[k.length - 1][1];
};
const herPose = (t: number): Pose4 => {
  // she is alive in the diagram: her eyes follow her own light down into the ridges, then dart after the background
  // light as it sweeps across; blinks, a small head tilt and breathing keep the hold moving
  const gx = kf(t, [[7.0, 0], [8.2, 0], [8.8, -0.35], [9.6, 0.4], [10.4, 0], [10.9, -0.7], [11.4, 0.7], [11.9, -0.2], [12.6, 0]]);
  const gy = kf(t, [[7.0, 0.2], [8.2, 0.2], [8.6, 0.9], [10.3, 0.8], [10.8, 0.1], [12.0, 0.2]]);
  const blink = Math.max(0, 1 - Math.abs(t - 9.95) / 0.07, 1 - Math.abs(t - 11.95) / 0.07);
  const p = crouch(BODY_P, {...FACES.hold, gy, gx, blink: Math.min(1, blink), brow: kf(t, [[8.4, 0.1], [8.9, 0.5], [10.6, 0.2], [11.1, 0.6], [12.2, 0.2]])});
  const br = Math.sin(t * 2 * Math.PI * 0.45);
  const hr = kf(t, [[8.3, 0], [8.9, -6], [10.5, -4], [11.1, 7], [11.7, -5], [12.3, 0]]);
  const hp = kf(t, [[8.2, 0], [8.8, 10], [10.4, 8], [10.9, 0]]);
  return {...p, hr, hp, pel: v3(0, 74 + 3 * br, -26), armL: {...p.armL, hand: v3(52, 210 + 4 * br, 96)}, armR: {...p.armR, hand: v3(-52, 210 + 4 * br, 96)}};
};

/** one curved glass ridge: tilt 0 = face-on strip (full height), 1 = end-on (a half-round on the sheet) */
const Ridge: React.FC<{x: number; w: number; tilt: number; top: number; bot: number; alpha: number}> = ({x, w, tilt, top, bot, alpha}) => {
  const c = Math.cos((tilt * Math.PI) / 2), s = Math.sin((tilt * Math.PI) / 2);
  const yTop = lerp(YC, top, c), yBot = lerp(YC, bot, c);
  const ry = (w / 2) * s;
  const xm = x + w / 2;
  const body = `M ${x} ${yTop} L ${x + w} ${yTop} L ${x + w} ${yBot} A ${w / 2} ${Math.max(0.01, ry)} 0 0 1 ${x} ${yBot} Z`;
  return (
    <g opacity={alpha}>
      <path d={body} fill="#CDEFF4" fillOpacity={0.16 + 0.22 * s} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* highlight and shade: one clean band each, they wrap round the curve as it turns */}
      <path d={`M ${x + w * 0.2} ${yTop} L ${x + w * 0.3} ${yTop} L ${x + w * 0.3} ${yBot + ry * 0.75} L ${x + w * 0.2} ${yBot + ry * 0.55} Z`} fill="#FFFFFF" opacity={0.35} />
      <path d={`M ${x + w * 0.82} ${yTop} L ${x + w} ${yTop} L ${x + w} ${yBot} L ${x + w * 0.82} ${yBot + ry * 0.55} Z`} fill="#0D2A36" opacity={0.22} />
      {s > 0.2 && <path d={`M ${x + w * 0.18} ${yBot + ry * 0.35} A ${w * 0.34} ${ry * 0.7} 0 0 0 ${xm} ${yBot + ry * 0.92}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.65 * s} strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
};

// one colour per source: warm for the light coming from her, cool for the corridor behind her
const HER_LIGHT = '#FFC978', BG_LIGHT = '#7FE3D8';
type Ray = {x0: number; y0: number; rib: number; color: string; delay: number};
const RayFan: React.FC<{r: Ray; t: number; t0: number; a: number; spread: number}> = ({r, t, t0, a, spread}) => {
  const xm = X0 + (r.rib + 0.5) * RIB, yh = YC;
  const tt = t - t0 - r.delay;
  if (tt < 0 || a <= 0) return null;
  const inK = Math.min(1, tt / 0.45); // the light reaches the ridge
  const outK = Math.max(0, Math.min(1, (tt - 0.38) / 0.6)); // and fans out beyond it
  const xs = lerp(r.x0, xm, inK), ys = lerp(r.y0, yh, inK);
  // three representative directions out of each ridge: straight through and the two sideways extremes
  const fan = [-1, 0, 1].map((k) => {
    const ang = k * spread * (Math.PI / 180);
    const L = 900 * outK;
    return {x: xm + Math.sin(ang) * L, y: yh + RIB * 0.42 + Math.cos(ang) * L};
  });
  const pulse = (tt * 1.6) % 1;
  return (
    <g opacity={a} style={{mixBlendMode: 'screen'}}>
      <line x1={r.x0} y1={r.y0} x2={xs} y2={ys} stroke={INK} strokeWidth={14} strokeLinecap="round" opacity={0.35} />
      <line x1={r.x0} y1={r.y0} x2={xs} y2={ys} stroke={r.color} strokeWidth={24} strokeLinecap="round" opacity={0.2} />
      <line x1={r.x0} y1={r.y0} x2={xs} y2={ys} stroke={r.color} strokeWidth={9} strokeLinecap="round" opacity={0.95} />
      <circle cx={lerp(r.x0, xm, Math.min(inK, pulse))} cy={lerp(r.y0, yh, Math.min(inK, pulse))} r={12} fill={r.color} opacity={0.95} />
      <circle cx={r.x0} cy={r.y0} r={22} fill={r.color} opacity={0.35} />
      {outK > 0 && fan.map((p, i) => (
        <line key={i} x1={xm} y1={yh + RIB * 0.42} x2={p.x} y2={p.y} stroke={r.color} strokeWidth={7} strokeLinecap="round" opacity={i === 1 ? 0.55 : 0.75} />
      ))}
    </g>
  );
};

export const LensDemo: React.FC<{t: number}> = ({t}) => {
  const D = DEMO;
  // tilt: 0 face-on (start and end), 1 end-on
  const tilt = ss(t, D.t0, D.tilt1) * (1 - ss(t, D.back0, D.back1));
  // what each ridge shows when face-on: at the start the smear (as the push left it), at the end the stretch building
  const stretch = t < D.back0 ? 1 : ss(t, D.back1 - 0.1, D.stretch1);
  const herFade = t < D.back0 ? 0.2 : lerp(1, 0.2, ss(t, D.back1 - 0.1, D.stretch1));
  // a few representative paths, one after another: from her face, then her shirt, each into one ridge and out sideways
  const herRays: Ray[] = [
    {x0: 540, y0: 610, rib: 4, color: HER_LIGHT, delay: 0},
    {x0: 540, y0: 800, rib: 2, color: HER_LIGHT, delay: 0.75},
  ];
  // then the corridor behind her: the wall stripe and the lab door's glow, into ridges either side
  const bgRays: Ray[] = [
    {x0: 60, y0: 778, rib: 6, color: BG_LIGHT, delay: 0},
    {x0: 195, y0: 525, rib: 2, color: BG_LIGHT, delay: 0.55},
  ];
  const herA = ss(t, D.her0, D.her0 + 0.2) * (1 - ss(t, D.bg0 + 0.3, D.bg1)) * (1 - ss(t, D.back0, D.back0 + 0.2));
  const bgA = ss(t, D.bg0, D.bg0 + 0.2) * (1 - ss(t, D.back0, D.back0 + 0.25));
  // her light thins as it spreads: the later in the beat, the wider the fans
  const herSpread = lerp(22, 46, ss(t, D.her0 + 0.5, D.her1));
  // the face-on stretched view (start and end): per ridge, the scene behind magnified sideways about the ridge centre
  const cT = Math.cos((tilt * Math.PI) / 2);
  const drift = ss(t, D.t0 + 0.3, D.tilt1 + 1.2) * (1 - ss(t, D.back0 - 0.4, D.back1));
  const faceOn = cT;
  const mag = lerp(1, 5.5, stretch);
  const scene = (
    <g>
      <Backdrop t={t} />
      <g opacity={1}><Crew4 id="ldw" look={PERSON} b={BODY_P} pose={herPose(t)} cd={herCard} shadow={false} /></g>
    </g>
  );
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="ldGlow"><stop offset="0" stopColor="#9FE6E0" stopOpacity={0.6} /><stop offset="1" stopColor="#9FE6E0" stopOpacity={0} /></radialGradient>
        <g id="ldScene">{scene}</g>
        <g id="ldBack"><Backdrop t={t} /></g>
        {Array.from({length: N}).map((_, i) => <clipPath key={i} id={`ldr${i}`}><rect x={X0 + i * RIB} y={lerp(YC, -10, cT)} width={RIB} height={Math.max(0.1, lerp(YC, 1930, cT) - lerp(YC, -10, cT))} /></clipPath>)}
      </defs>
      {/* a slow drift while the diagram is end-on, settling back to the push's framing at both ends (match dissolves) */}
      <g transform={`translate(540 1060) scale(${1 + 0.07 * drift}) rotate(${0.6 * drift * Math.sin((t - DEMO.t0) * 0.9)}) translate(${-540 + 26 * drift * Math.sin((t - DEMO.t0) * 0.7)} -1060)`}>
      <use href="#ldScene" />
      {/* face-on: what each ridge shows (the scene behind it, stretched sideways about the ridge centre) */}
      {faceOn > 0.01 && Array.from({length: N}).map((_, i) => {
        const cx = X0 + (i + 0.5) * RIB;
        return (
          <g key={i} clipPath={`url(#ldr${i})`}>
            <g transform={`translate(${cx} 0) scale(${mag} 1) translate(${-cx} 0)`}><use href="#ldBack" /></g>
            <g opacity={herFade} transform={`translate(${cx} 0) scale(${mag} 1) translate(${-cx} 0)`}>
              <Crew4 id={`ldw${i}`} look={PERSON} b={BODY_P} pose={herPose(t)} cd={herCard} shadow={false} />
            </g>
          </g>
        );
      })}
      {/* the sheet the ridges stand on (visible as the view turns end-on) */}
      <rect x={0} y={YC - 22 * tilt} width={W} height={22 * tilt} fill="#CDEFF4" fillOpacity={0.3} stroke={INK} strokeWidth={tilt > 0.05 ? 3 : 0} />
      {Array.from({length: N}).map((_, i) => <Ridge key={i} x={X0 + i * RIB} w={RIB} tilt={tilt} top={-10} bot={1930} alpha={1} />)}
      {/* the light */}
      {herRays.map((r, i) => <RayFan key={`h${i}`} r={r} t={t} t0={D.her0} a={herA} spread={herSpread} />)}
      {bgRays.map((r, i) => <RayFan key={`b${i}`} r={r} t={t} t0={D.bg0} a={bgA} spread={44} />)}
      {/* the viewer's side: his cap at the bottom edge, looking up at the panel */}
      <g opacity={tilt} transform={`translate(860 ${1960 - 90 * tilt})`}>
        <ellipse cx={0} cy={0} rx={130} ry={120} fill="#2B2B33" stroke={INK} strokeWidth={4} />
        <path d="M -138 -20 Q 0 -150 138 -20 Q 0 -60 -138 -20 Z" fill={'#2E3F5C'} stroke={INK} strokeWidth={4} />
      </g>
      </g>
    </svg>
  );
};
