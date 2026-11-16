// V2 B (7.6-26.6). The same roll in the museum; a match cut to the same roll, fresh, on a villa shelf; the camera
// pulls back to the window: Vesuvius erupts, ash falls and settles, a surge cloud sweeps across the frame and thins
// to reveal the roll black and buried in ash layers. The upper layers are dug away; a knife tries to lift the outer
// layer and it cracks and breaks. The roll turns end-on; two more attempts break the outer turns away (4.9 -> 2.0 cm);
// the camera pushes into the core that still holds the writing.
import React from 'react';
import {Note, FONT_BODY, K} from '../art/kit';
import {Cradle, EndView, ROLL_GEO, Roll1667} from '../art/Roll';
import {mix} from '../lib/color';
import {FPS} from '../lib/core';
import {clamp, easeIn, easeInOut, easeOut, hash, lerp, noise1} from '../lib/math';
import {TM} from '../lib/time';
import {ROLL_A_END, PhysicalRoll, Spatula, flapTip, AttemptTimes} from './A3';
import {segK} from './kit3';

const P0 = ROLL_A_END; // museum pose (from A3)
const T_CUT = TM.vesuvius - 0.12; // match cut to the villa on "It was buried"
const T_ERUPT = TM.vesuvius + 0.45;
const T_SURGE0 = TM.vesuviusEnd - 0.35;
const T_SURGE1 = TM.vesuviusEnd + 0.55;
const T_REVEAL1 = TM.centuries + 0.1;
const T_DIG0 = TM.centuries + 0.15;
const T_DIG1 = TM.centuries + 0.95;
const ATT: AttemptTimes = {lift0: TM.centuries + 0.7, lift1: TM.openIt - 0.35, crack0: TM.centuries + 0.95, crack1: TM.openIt - 0.1, brk: TM.openIt - 0.05};
const T_ROT0 = TM.byTheTime;
const T_ROT1 = TM.byTheTime + 0.6;
const BENCH = 650;
const PXCM = 47;
const R0 = 4.9 * PXCM;
const R3 = 2.0 * PXCM;
const ATTS = [
  {a: TM.byTheTime + 0.95, b: TM.halfWide + 0.3, r: 3.4 * PXCM},
  {a: TM.halfWide + 0.35, b: TM.hadBeen - 0.05, r: R3},
];
const radiusAt = (t: number) => {
  let r = R0;
  for (const A of ATTS) {
    r = lerp(r, A.r, easeInOut(clamp((t - A.a) / (A.b - A.a))));
    if (t < A.b) break;
  }
  return r;
};

const {L, R, ex, erx, body} = ROLL_GEO;

/** the roll before the eruption: fresh papyrus */
const FreshRoll: React.FC<{x: number; y: number; s: number; ash: number}> = ({x, y, s, ash}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={R + 12} rx={L * 0.55} ry={10} fill="rgba(40,20,10,0.25)" />
    <path d={body} fill="#E4D0A2" stroke={K.ink} strokeWidth={4 / s} strokeLinejoin="round" />
    <path d={`M${-L / 2 + 8} ${-R + 20} Q0 ${-R + 6} ${L / 2 - 20} ${-R + 16}`} fill="none" stroke="#F4E6C4" strokeWidth={12} strokeLinecap="round" />
    <path d={`M${-L / 2 + 12} ${R - 16} Q0 ${R - 6} ${L / 2 - 24} ${R - 14}`} fill="none" stroke="#C9AE7A" strokeWidth={12} strokeLinecap="round" />
    {[-0.3, 0.05, 0.35].map((k, i) => (
      <path key={i} d={`M${k * L} ${-R + 4} q4 ${R} 0 ${2 * R - 8}`} fill="none" stroke="#C6A971" strokeWidth={2} opacity={0.7} />
    ))}
    <ellipse cx={ex} cy={0} rx={erx} ry={R} fill="#D7BE8C" stroke={K.ink} strokeWidth={3.5 / s} />
    {Array.from({length: 9}, (_, i) => (
      <ellipse key={i} cx={ex} cy={0} rx={erx * (0.9 - i * 0.1)} ry={R * (0.9 - i * 0.1)} fill="none" stroke="#B59767" strokeWidth={1.4} />
    ))}
    {ash > 0 && (
      <path d={`M${-L / 2 + 4} ${-R + 14} Q0 ${-R - 4 - 6 * ash} ${L / 2} ${-R + 10} L${L / 2 - 6} ${-R + 22} Q0 ${-R + 14} ${-L / 2 + 8} ${-R + 26}Z`} fill="#8F8A86" opacity={clamp(ash * 1.4)} />
    )}
  </g>
);

const ShelfScroll: React.FC<{x: number; y: number; s: number; ash: number; seed: number}> = ({x, y, s, ash, seed}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-34} width={140} height={68} rx={30} fill={mix('#E4D0A2', '#D9C394', hash(seed, 1))} stroke={K.ink} strokeWidth={4 / s} />
    <ellipse cx={70} cy={0} rx={12} ry={34} fill="#CDB585" stroke={K.ink} strokeWidth={3.5 / s} />
    {ash > 0 && <rect x={-66} y={-36} width={132} height={14} rx={7} fill="#8F8A86" opacity={clamp(ash * 1.4)} />}
  </g>
);

const Villa: React.FC<{t: number; erupt: number; ash: number; dark: number}> = ({t, erupt, ash, dark}) => {
  const plume = Array.from({length: 11}, (_, i) => {
    const g = clamp(erupt * 1.6 - i * 0.09);
    return {x: 1900 + noise1(i * 0.6 + t * 0.4, 4) * 50 + i * 10, y: 262 - i * 52 * g - g * 20, r: (24 + i * 16) * g};
  });
  const sky = mix('#BFE0EE', '#6D5E5A', clamp(erupt * 1.3));
  return (
    <g>
      <rect x={-1200} y={-800} width={4400} height={2700} fill={mix('#C9584A', '#7A3B33', dark)} />
      <rect x={-1200} y={700} width={4400} height={900} fill={mix('#5B2E2A', '#2E1816', dark)} />
      <rect x={-1200} y={690} width={4400} height={14} fill="#E8D7B5" opacity={0.6} />
      {/* window onto the bay and the mountain */}
      <clipPath id="b2win">
        <rect x={1460} y={-260} width={900} height={780} />
      </clipPath>
      <g clipPath="url(#b2win)">
        <rect x={1460} y={-260} width={900} height={780} fill={sky} />
        <path d={`M1460 520 L1640 400 Q1820 250 1900 262 Q1990 250 2140 380 L2360 470 L2360 520Z`} fill={mix('#8C7DA6', '#4C3F4A', clamp(erupt))} />
        <rect x={1460} y={470} width={900} height={50} fill={mix('#5C9DC0', '#4E4A4A', clamp(erupt))} />
        {erupt > 0 &&
          plume.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={mix('#7A6D6A', '#3D3534', i / 11)} opacity={0.97} />)}
        {erupt > 0 && <path d="M1860 266 L1900 248 L1940 266 L1925 290 L1875 290Z" fill="#F07A3A" opacity={clamp(erupt * 3)} />}
        {erupt > 0 && <path d="M1880 262 Q1840 330 1790 420 M1925 262 Q1970 330 2010 410" stroke="#E8643A" strokeWidth={8} fill="none" opacity={clamp(erupt * 2) * 0.8} />}
      </g>
      <rect x={1460} y={-260} width={900} height={780} fill="none" stroke="#E8D7B5" strokeWidth={24} />
      {/* shelf */}
      <rect x={260} y={631} width={1260} height={30} fill="#7A4E2C" stroke={K.ink} strokeWidth={4} />
      <rect x={300} y={661} width={26} height={140} fill="#6A4325" stroke={K.ink} strokeWidth={3} />
      <rect x={1454} y={661} width={26} height={140} fill="#6A4325" stroke={K.ink} strokeWidth={3} />
      <ShelfScroll x={420} y={593} s={1.1} ash={ash} seed={1} />
      <ShelfScroll x={590} y={597} s={1.0} ash={ash} seed={2} />
      <ShelfScroll x={1360} y={595} s={1.05} ash={ash} seed={3} />
      <ShelfScroll x={510} y={523} s={0.95} ash={ash} seed={4} />
    </g>
  );
};

const Strata: React.FC<{dig: number; part: 'above' | 'below'; fade?: number}> = ({dig, part, fade = 0}) => {
  const bands = ['#8A817A', '#A39A90', '#6F6862', '#B7AC9E', '#7D746C', '#9C9287', '#5F5852'];
  return (
    <g>
      {bands.map((c, i) => {
        const y0 = -60 + i * 170;
        const above = y0 < 520;
        if ((part === 'above') !== above) return null;
        const lift = above ? easeIn(clamp(dig * 1.3 - i * 0.08)) * -1200 : 0;
        let d = `M-100 ${y0 + lift}`;
        for (let x = -100; x <= 2020; x += 80) d += `L${x} ${y0 + lift + 18 * noise1(x / 260 + i, 70)}`;
        d += `L2020 ${y0 + lift + 260} L-100 ${y0 + lift + 260}Z`;
        return <path key={i} d={d} fill={c} opacity={above ? 0.45 * (1 - clamp(dig * 1.2 - i * 0.1)) : 1 - fade} />;
      })}
    </g>
  );
};

/** flakes that come away from the end view in the two attempts */
const Flakes: React.FC<{t: number; letters: number}> = ({t, letters}) => {
  const out: React.ReactNode[] = [];
  let rPrev = R0;
  ATTS.forEach((A, ai) => {
    for (let i = 0; i < 8; i++) {
      const id = ai * 10 + i;
      const ang = (-0.95 + (i / 8) * 0.9 + hash(id, 1) * 0.15) * Math.PI;
      const rr = (rPrev + A.r) / 2;
      const tStart = lerp(A.a, A.b, 0.12 + (i / 8) * 0.75);
      if (t < tStart) continue;
      const k = clamp((t - tStart) / 0.9);
      const cy = BENCH - radiusAt(tStart);
      const sx = 960 + Math.cos(ang) * rr;
      const sy = cy + Math.sin(ang) * rr * 0.95;
      const lx = 960 + (i % 2 ? 1 : -1) * (360 + hash(id, 2) * 380);
      const ly = BENCH + 30 + hash(id, 3) * 70;
      const x = lerp(sx, lx, easeOut(k)) + Math.sin(k * 6 + id) * 12 * (1 - k);
      const y = lerp(sy, ly, easeIn(k));
      const rot = (ang * 180) / Math.PI + 90 + k * (hash(id, 4) - 0.5) * 360;
      const w = 30 + hash(id, 5) * 36;
      const h = 10 + (rPrev - A.r) * 0.3;
      out.push(
        <g key={id} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d={`M${-w / 2} 0 Q0 ${-h * 0.6} ${w / 2} 0 L${w / 2 - 3} ${h} Q0 ${h * 0.5} ${-w / 2 + 2} ${h}Z`} fill="#3C2F25" stroke={K.sepiaInk} strokeWidth={2.5} />
        </g>,
      );
    }
    rPrev = A.r;
  });
  void letters;
  return <>{out}</>;
};

export const B3: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  // ---------------------------------------------------------------- museum (7.6 - 9.95)
  if (t < T_CUT) {
    const k = segK(t, TM.book - 0.05, T_CUT, (x) => x);
    const pose = {x: P0.x, y: P0.y, s: P0.s * (1 + 0.08 * k)};
    const sweep = lerp(-500, 2400, segK(t, TM.book + 0.3, TM.book + 1.8));
    return (
      <g>
        <rect width={1920} height={1080} fill={K.paper} />
        <ellipse cx={pose.x} cy={pose.y - 60} rx={560} ry={380} fill="#FBF6EC" opacity={0.7} />
        <rect x={-20} y={pose.y + 112 * pose.s} width={1960} height={1080} fill={K.paperDeep} />
        <rect x={-20} y={pose.y + 112 * pose.s} width={1960} height={6} fill="#D8CCB8" />
        <Cradle x={pose.x} y={pose.y + 64 * pose.s} s={pose.s} w={330} />
        <Roll1667 x={pose.x} y={pose.y} s={pose.s} />
        {/* a raking light passes over the charred surface */}
        <clipPath id={`b2m${f}`}>
          <path d={ROLL_GEO.body} transform={`translate(${pose.x} ${pose.y}) scale(${pose.s})`} />
        </clipPath>
        <g clipPath={`url(#b2m${f})`}>
          <rect x={sweep} y={0} width={140} height={1080} fill="#FFF3DC" opacity={0.18} transform={`skewX(-20)`} />
        </g>
        <Note x={pose.x} y={pose.y + 150 * pose.s + 20} text="PHerc. 1667" size={26} />
      </g>
    );
  }
  // ---------------------------------------------------------------- villa (9.95 - surge)
  if (t < T_SURGE1) {
    const pull = segK(t, T_CUT + 0.1, TM.vesuvius + 1.3);
    const sc = lerp(1, 0.6, pull);
    const ox = lerp(0, -180, pull);
    const erupt = segK(t, T_ERUPT, T_ERUPT + 2.2, easeOut);
    const ash = segK(t, T_ERUPT + 0.9, T_SURGE0 + 0.2, (x) => x);
    const dark = segK(t, T_ERUPT + 0.4, T_SURGE0, (x) => x) * 0.7;
    const front = lerp(2300, -700, segK(t, T_SURGE0, T_SURGE1, easeIn));
    const shake = t > T_SURGE0 - 0.3 ? Math.sin(t * 70) * 4 * clamp((t - T_SURGE0 + 0.3) / 0.3) : 0;
    return (
      <g transform={`translate(${shake} 0)`}>
        <g transform={`translate(${960 + ox} ${540}) scale(${sc}) translate(${-960} ${-540})`}>
          <Villa t={t} erupt={erupt} ash={ash} dark={dark} />
          <FreshRoll x={P0.x} y={P0.y} s={P0.s * (1 + 0.08)} ash={ash} />
        </g>
        {/* ash fall */}
        {ash > 0 &&
          Array.from({length: 90}, (_, i) => {
            const sp = 0.6 + hash(i, 3);
            const x = ((hash(i, 1) * 2300 - (t - T_ERUPT) * 120 * sp) % 2300 + 2300) % 2300 - 200;
            const y = ((hash(i, 2) * 1200 + (t - T_ERUPT) * 260 * sp) % 1200) - 60;
            return <circle key={i} cx={x} cy={y} r={2 + hash(i, 4) * 4} fill="#7E7672" opacity={clamp(ash * 2) * 0.7} />;
          })}
        <defs>
          <filter id="b2soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        {/* the surge cloud sweeps across the frame */}
        {t > T_SURGE0 && (
          <g filter="url(#b2soft)">
            <rect x={front + 140} y={-50} width={3000} height={1200} fill="#2B2522" />
            {Array.from({length: 14}, (_, i) => {
              const y = -40 + i * 85;
              const r = 120 + hash(i, 8) * 90;
              return <circle key={i} cx={front + 140 + noise1(i * 0.7 + t, 9) * 50} cy={y} r={r} fill={mix('#3A322E', '#2B2522', hash(i, 9))} />;
            })}
          </g>
        )}
      </g>
    );
  }
  // ---------------------------------------------------------------- buried, dug out, the first attempt (surge -> rotate)
  const toSepia = segK(t, T_DIG0, T_DIG1 + 0.3);
  if (t < T_ROT0) {
    const reveal = segK(t, T_SURGE1, T_REVEAL1 + 0.5, easeOut);
    const dig = segK(t, T_DIG0, T_DIG1);
    const pose = {x: P0.x, y: P0.y, s: P0.s * 1.08};
    const tip = flapTip(t, ATT, pose);
    const toolIn = (1 - easeOut(clamp((t - ATT.lift0 + 0.5) / 0.5))) * 700;
    const toolBack = easeIn(clamp((t - ATT.brk - 0.05) / 0.45)) * 900;
    return (
      <g>
        <rect width={1920} height={1080} fill={mix('#6F6862', K.sepia, toSepia)} />
        <ellipse cx={960} cy={430} rx={760} ry={420} fill="#F3E7CC" opacity={0.7 * toSepia} />
        <rect x={0} y={pose.y + 75 * pose.s + 2} width={1920} height={600} fill={mix('#5F5852', K.sepiaDeep, toSepia)} />
        <Strata dig={dig} part="below" fade={toSepia} />
        <PhysicalRoll t={t} f={f} pose={pose} macro={1} at={ATT} />
        <Strata dig={dig} part="above" />
        {t > ATT.lift0 - 0.5 && t < ATT.brk + 0.6 && <Spatula tip={tip} back={toolIn + toolBack} o={1} />}
        {/* the cloud thins out to reveal the buried roll */}
        {/* the surge cloud clears from the middle outward, leaving the roll black and buried */}
        {reveal < 1 && (
          <g>
            <defs>
              <radialGradient id={`b2hole${f}`}>
                <stop offset="0" stopColor="#000" />
                <stop offset="0.7" stopColor="#000" />
                <stop offset="1" stopColor="#fff" />
              </radialGradient>
              <mask id={`b2mask${f}`}>
                <rect width={1920} height={1080} fill="#fff" />
                <circle cx={960} cy={500} r={lerp(0, 2600, reveal)} fill={`url(#b2hole${f})`} />
              </mask>
              <filter id={`b2blur${f}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation={30} />
              </filter>
            </defs>
            <g mask={`url(#b2mask${f})`}>
              <rect width={1920} height={1080} fill="#2B2522" />
              <g filter={`url(#b2blur${f})`}>
                {Array.from({length: 12}, (_, i) => (
                  <circle key={i} cx={(i % 4) * 560 + noise1(i + t, 3) * 80} cy={Math.floor(i / 4) * 420 + noise1(i * 2 + t, 5) * 60} r={220} fill={mix('#3A322E', '#1F1A18', hash(i, 7))} />
                ))}
              </g>
            </g>
          </g>
        )}
      </g>
    );
  }
  // ---------------------------------------------------------------- end-on: the outer turns break away; the core
  const rot = segK(t, T_ROT0, T_ROT1);
  const r = radiusAt(t);
  const cyR = BENCH - r;
  const coreK = segK(t, TM.writing - 0.1, TM.look - 0.45, (x) => x);
  const push = 1 + 1.6 * easeInOut(coreK);
  const glow = segK(t, TM.writing + 0.2, TM.writing + 1.2) * (0.65 + 0.35 * Math.sin(t * 5));
  const lbl = Math.max(1 - clamp((t - ATTS[0].a - 0.2) / 0.3), clamp((t - ATTS[1].b) / 0.3));
  const cm = t > ATTS[1].b ? '2.0' : '4.9';
  const GY = BENCH + 46;
  const pose = {x: P0.x, y: P0.y, s: P0.s * 1.08};
  return (
    <g>
      <rect width={1920} height={1080} fill={K.sepia} />
      <ellipse cx={960} cy={430} rx={760} ry={420} fill="#F3E7CC" opacity={0.7} />
      <g transform={`translate(${960} ${cyR}) scale(${push}) translate(${-960} ${-cyR})`}>
        <rect x={-1000} y={BENCH} width={4000} height={1000} fill={K.sepiaDeep} />
        <rect x={-1000} y={BENCH} width={4000} height={6} fill="#B69A6A" />
        {rot < 1 ? (
          // turning from the side view to the end view: the same detailed roll, squeezed toward its end face
          (() => {
            const fx = pose.x + ex * pose.s;
            const Ex = lerp(fx, 960, rot);
            const Ey = lerp(pose.y, cyR, rot);
            const k = lerp(1, R0 / (R * pose.s), rot);
            return (
              <g>
                <g transform={`translate(${Ex} ${Ey}) scale(${k}) translate(${-fx} ${-pose.y})`}>
                  <g transform={`translate(${fx} ${pose.y}) scale(${lerp(1, 0.02, rot)} 1) translate(${-fx} ${-pose.y})`} opacity={1 - clamp((rot - 0.85) / 0.15)}>
                    <PhysicalRoll t={t} f={f} pose={pose} macro={1} at={ATT} />
                  </g>
                </g>
                <g transform={`translate(${Ex} ${Ey}) scale(${lerp(erx * pose.s, R0, rot) / lerp(R * pose.s, R0, rot)} 1)`}>
                  <EndView x={0} y={0} rFull={R0} rCur={lerp(R * pose.s, R0, rot)} rCore={8} />
                </g>
              </g>
            );
          })()
        ) : (
          <EndView x={960} y={cyR} rFull={R0} rCur={r} rCore={8} glow={glow} />
        )}
        <Flakes t={t} letters={0} />
        {/* width guide (only the sourced widths are labelled) */}
        {rot >= 0.85 && (
          <g opacity={(1 - coreK * 2) * clamp((rot - 0.85) / 0.15)}>
            <line x1={960 - r} y1={GY} x2={960 + r} y2={GY} stroke={K.sepiaInk} strokeWidth={4} />
            <path d={`M${960 - r} ${GY} l16 -9 v18Z M${960 + r} ${GY} l-16 -9 v18Z`} fill={K.sepiaInk} />
            <g opacity={lbl}>
              <text x={960} y={GY + 51} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={800} fontSize={30} fill={K.sepiaInk}>
                {cm} cm
              </text>
            </g>
          </g>
        )}
      </g>
    </g>
  );
};
