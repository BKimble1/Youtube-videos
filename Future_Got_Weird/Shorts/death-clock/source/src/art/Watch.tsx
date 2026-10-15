// The fictional band: cobalt strap, rounded glass case, and the screen UI. All lettering is rendered
// here (never by a generative model). Screen design space: SW x SH, origin at the screen centre.
// Device-state continuity: green VITAL SCAN -> crimson countdown (HH:MM:SS from 00:02:14) ->
// blue HELP ALERT SENT banner over the timer -> STABILIZING -> green "Life Expectancy: 42 Years" ->
// one localized question-mark glitch.
import React from 'react';
import {INK} from '../lib/ink';
import {UI_FONT} from '../fonts';
import {lit, mix, PAL, shade} from '../lib/color';
import {clamp, fmt, hash, inv, lerp} from '../lib/math';
import {Glow} from '../lib/shade';
import {fmtClock, SCREEN_IDLE, ScreenState} from '../lib/screen';

export {fmtClock, SCREEN_IDLE};
export type {ScreenState};

export const SW = 300;
export const SH = 232;



/** Monospaced digits: each character centred in a fixed cell so a ticking clock never shifts. */
const Mono: React.FC<{text: string; x: number; y: number; size: number; cell: number; colon: number; fill: string; weight?: number; opacity?: number}> = ({text, x, y, size, cell, colon, fill, weight = 800, opacity = 1}) => {
  const widths = text.split('').map((c) => (c === ':' ? colon : cell));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = x - total / 2;
  return (
    <g fontFamily={UI_FONT} fontWeight={weight} fontSize={size} fill={fill} textAnchor="middle" opacity={opacity}>
      {text.split('').map((c, i) => {
        const w = widths[i];
        const el = (
          <text key={i} x={fmt(cx + w / 2)} y={fmt(y + (c === ':' ? -size * 0.06 : 0))}>
            {c}
          </text>
        );
        cx += w;
        return el;
      })}
    </g>
  );
};

/** ECG-style trace (a UI mark, not an outline). irregular 0..1 breaks the rhythm. */
export const trace = (f: number, w: number, amp: number, irregular: number) => {
  const pts: string[] = [];
  // V4: 270 samples over the 3 beats (90 per beat). At 30 per beat the R window (4% of a beat) held about 1.2 samples,
  // so on some frames no sample landed in it and the spike blinked out (1339, 1344). The irregular wobble is still
  // evaluated on the old 90-sample grid and interpolated, so the trace keeps its V3 character
  const n = 270;
  const N0 = 90;
  const wob = (j: number) => Math.sin(j * 1.7 + f * 0.4);
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (w * i) / n;
    const ph = (i / n) * 3 + f * 0.035;
    const k = ph - Math.floor(ph);
    let y = 0;
    const jitter = irregular * (hash(Math.floor(ph * 7), 5) - 0.5) * 2;
    const kk = clamp(k + jitter * 0.18);
    if (kk > 0.42 && kk < 0.46) y = -amp * 0.35 * (1 + irregular * jitter);
    else if (kk >= 0.46 && kk < 0.5) y = amp * (1 + irregular * 0.6 * jitter);
    else if (kk >= 0.5 && kk < 0.54) y = -amp * 0.5;
    else if (kk > 0.66 && kk < 0.76) y = amp * 0.18 * Math.sin(((kk - 0.66) / 0.1) * Math.PI);
    const j = (i * N0) / n;
    const j0 = Math.floor(j);
    y += irregular * (wob(j0) + (wob(j0 + 1) - wob(j0)) * (j - j0)) * amp * 0.12;
    pts.push(`${fmt(x)},${fmt(-y)}`);
  }
  return pts.join(' ');
};

export const ScreenUI: React.FC<{id: string; s: ScreenState}> = ({id, s}) => {
  const green = PAL.normal;
  const crimson = PAL.alert;
  const bgTop = mix(mix('#0E2A22', '#3B0710', s.red), '#0B3A28', s.recover * (1 - s.red));
  const bgBot = mix(mix('#06150F', '#1A0207', s.red), '#062016', s.recover * (1 - s.red));
  const flash = s.red * (0.5 + 0.5 * Math.cos(s.flash * Math.PI * 2));
  const scanY = -SH / 2 + ((s.f * 4) % SH);
  const showGreen = 1 - s.red;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={bgTop} />
          <stop offset="1" stopColor={bgBot} />
        </linearGradient>
        <radialGradient id={`${id}-edge`} cx="0.5" cy="0.5" r="0.72">
          <stop offset="0.55" stopColor={crimson} stopOpacity={0} />
          <stop offset="1" stopColor={crimson} stopOpacity={0.85} />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="0.5" cy="0.45" r="0.65">
          <stop offset="0" stopColor={mix(crimson, '#FF6A74', 0.5)} stopOpacity={0.55} />
          <stop offset="1" stopColor={crimson} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill={`url(#${id}-bg)`} />
      {/* --- green VITAL SCAN */}
      {showGreen > 0.01 && s.recover < 0.99 && (
        <g opacity={showGreen * (1 - s.recover)}>
          <rect x={-SW / 2} y={scanY - 18} width={SW} height={18} fill={green} opacity={0.12} />
          <text x={0} y={-62} textAnchor="middle" fontFamily={UI_FONT} fontWeight={700} fontSize={30} letterSpacing={3} fill={lit(green, 0.35)}>
            {s.scanText ?? 'VITAL SCAN'}
          </text>
          <polyline points={trace(s.f, SW - 50, 34, 0)} fill="none" stroke={lit(green, 0.2)} strokeWidth={5} strokeLinejoin="round" transform="translate(0 14)" />
          <rect x={-SW / 2 + 40} y={68} width={SW - 80} height={10} rx={5} fill={shade(green, 0.55)} />
          <rect x={-SW / 2 + 40} y={68} width={fmt((SW - 80) * (0.25 + 0.75 * (((s.f * 0.012) % 1) as number)))} height={10} rx={5} fill={green} />
        </g>
      )}
      {/* --- slight red edge warning on the green screen */}
      {s.edge > 0.01 && <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill={`url(#${id}-edge)`} opacity={s.edge * (0.6 + 0.4 * Math.sin(s.f * 0.5))} />}
      {/* --- crimson warning */}
      {s.red > 0.01 && (
        <g opacity={s.red * (1 - s.recover)}>
          <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill={`url(#${id}-core)`} />
          <rect x={-SW / 2 + 5} y={-SH / 2 + 5} width={SW - 10} height={SH - 10} rx={14} fill="none" stroke={lit(crimson, 0.25)} strokeWidth={7} opacity={0.35 + 0.65 * flash} />
          {s.timerIn < 1 && (
            <text x={0} y={22} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={40} letterSpacing={4} fill="#FFD6D9" opacity={(1 - s.timerIn) * (0.55 + 0.45 * Math.sin(s.f * 0.6))}>
              CALCULATING
            </text>
          )}
          {s.secs !== null && (
            <g opacity={s.timerIn} transform={`scale(${fmt(lerp(1.25, 1, s.timerIn))})`}>
              <text x={0} y={-58} textAnchor="middle" fontFamily={UI_FONT} fontWeight={700} fontSize={19} letterSpacing={2.2} fill="#FFD6D9">
                ESTIMATED TIME REMAINING
              </text>
              <Mono text={fmtClock(s.secs)} x={0} y={30} size={84} cell={36} colon={16} fill="#FFFFFF" />
              {/* irregular heart mark */}
              <polyline points={trace(s.f, 120, 12, 1)} fill="none" stroke="#FF9AA2" strokeWidth={3.5} strokeLinejoin="round" transform={`translate(0 ${s.alert > 0.01 || s.stab > 0.01 ? 200 : 70})`} />
            </g>
          )}
        </g>
      )}
      {/* --- blue help-alert banner over the timer */}
      {s.alert > 0.01 && (
        <g transform={`translate(0 ${fmt(lerp(140, 0, s.alert))})`} opacity={clamp(s.alert * 2) * (1 - s.recover)}>
          <rect x={-SW / 2 + 12} y={52} width={SW - 24} height={50} rx={12} fill={PAL.signal} />
          <rect x={-SW / 2 + 12} y={52} width={SW - 24} height={22} rx={11} fill="#FFFFFF" opacity={0.22} />
          {/* location pin */}
          <g transform="translate(-112 77) scale(0.85)">
            <path d="M0,-15 C8,-15 13,-9 13,-2 C13,6 4,12 0,17 C-4,12 -13,6 -13,-2 C-13,-9 -8,-15 0,-15 Z" fill="#0A3550" />
            <circle cx={0} cy={-2} r={5} fill={PAL.signal} />
          </g>
          <text x={18} y={87} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={28} letterSpacing={1.2} fill="#0A2E46">
            HELP ALERT SENT
          </text>
        </g>
      )}
      {/* --- stabilizing banner */}
      {s.stab > 0.01 && (
        <g opacity={s.stab * (1 - s.recover)}>
          <rect x={-SW / 2 + 12} y={52} width={SW - 24} height={50} rx={12} fill="#BFF3FF" />
          <text x={0} y={88} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={30} letterSpacing={2} fill="#0A2E46">
            STABILIZING
          </text>
        </g>
      )}
      {/* --- green recovery readout: exactly "Life Expectancy: 42 Years" */}
      {s.recover > 0.01 && (
        <g opacity={s.recover * (1 - clamp(s.glitch * 1.4))}>
          <rect x={-SW / 2 + 5} y={-SH / 2 + 5} width={SW - 10} height={SH - 10} rx={14} fill="none" stroke={lit(green, 0.3)} strokeWidth={5} opacity={0.6} />
          <text x={0} y={-30} textAnchor="middle" fontFamily={UI_FONT} fontWeight={700} fontSize={36} fill={lit(green, 0.55)}>
            Life Expectancy:
          </text>
          <text x={0} y={58} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={86} fill="#FFFFFF">
            42 Years
          </text>
        </g>
      )}
      {/* --- dive: the glass opens onto the glowing reservoir inside the band (match shape for the cut) */}
      {(s.dive ?? 0) > 0.01 && (
        <g opacity={s.dive}>
          <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill="#071631" />
          <ellipse cx={0} cy={0} rx={SW * 0.55} ry={SH * 0.42} fill={PAL.signal} opacity={0.22} />
          {Array.from({length: 26}).map((_, i) => (
            <circle key={i} cx={fmt((hash(i, 61) - 0.5) * SW * 0.9)} cy={fmt((hash(i, 62) - 0.5) * SH * 0.7)} r={fmt(4 + hash(i, 63) * 6)} fill="#BDF1FF" opacity={0.9} />
          ))}
        </g>
      )}
      {/* --- glitch: horizontal slice offsets, channel split, and a clear question mark */}
      {s.glitch > 0.01 && (
        <g>
          {Array.from({length: 7}).map((_, i) => {
            const y0 = -SH / 2 + (SH / 7) * i;
            const dx = (hash(i + Math.floor(s.f), 21) - 0.5) * 70 * s.glitch;
            return <rect key={i} x={-SW / 2 + dx} y={y0} width={SW} height={SH / 7 - 2} fill={i % 2 ? '#0B3A28' : '#20103A'} opacity={0.6 * s.glitch} />;
          })}
          <g opacity={clamp(s.glitch * 1.6)}>
            <text x={-7} y={68} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={190} fill="#FF3B6B" opacity={0.75}>
              ?
            </text>
            <text x={7} y={68} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={190} fill={PAL.signal} opacity={0.75}>
              ?
            </text>
            <text x={0} y={68} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={190} fill="#FFFFFF">
              ?
            </text>
          </g>
        </g>
      )}
    </g>
  );
};

/** Screen colour used for local light on skin and casing. */
export const screenLight = (s: ScreenState) => {
  if (s.glitch > 0.5) return '#B9F6FF';
  if (s.recover > 0.5) return PAL.normal;
  if (s.alert > 0.5) return PAL.signal;
  return mix(PAL.normal, PAL.alert, s.red);
};

/**
 * The case and band in a local frame: x runs along the forearm, y across it; origin = screen centre.
 * `r` is the forearm radius at the band (the band wraps from -r to +r across the arm).
 */
const WATCH_INK = 10;

export const WatchBody: React.FC<{id: string; r: number; screen: ScreenState; port?: number}> = ({id, r, screen, port = 0}) => {
  const bw = 150; // band width along the arm
  const cw = SW + 64;
  const ch = SH + 58;
  const light = screenLight(screen);
  return (
    <g>
      <defs>
        {/* band wraps the arm: lit top edge, deep bottom (cylindrical) */}
        <linearGradient id={`${id}-band`} x1="0" y1={fmt(-r * 1.08)} x2="0" y2={fmt(r * 1.08)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(PAL.band, 0.38)} />
          <stop offset="0.16" stopColor={lit(PAL.band, 0.12)} />
          <stop offset="0.5" stopColor={PAL.band} />
          <stop offset="0.86" stopColor={PAL.bandDeep} />
          <stop offset="1" stopColor={mix(PAL.bandDeep, PAL.band, 0.4)} />
        </linearGradient>
        <linearGradient id={`${id}-case`} x1={fmt(-cw / 2)} y1={fmt(-ch / 2)} x2={fmt(cw / 3)} y2={fmt(ch / 2)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5B7FEA" />
          <stop offset="0.4" stopColor={PAL.band} />
          <stop offset="1" stopColor="#10307F" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1={fmt(ch / 2 - 8)} x2="0" y2={fmt(ch / 2 + 26)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0F2C77" />
          <stop offset="1" stopColor="#0A1C4D" />
        </linearGradient>
        <linearGradient id={`${id}-bez`} x1={fmt(-cw / 2)} y1={fmt(-ch / 2)} x2={fmt(cw / 2)} y2={fmt(ch / 2)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B2B4F" />
          <stop offset="1" stopColor="#060B18" />
        </linearGradient>
        <clipPath id={`${id}-scr`}>
          <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} rx={26} />
        </clipPath>
      </defs>
      {/* band (strap) across the arm, with soft segment ridges; crew ink contour around strap and case */}
      <rect x={-bw / 2} y={-r * 1.06} width={bw} height={r * 2.12} rx={22} fill={INK} stroke={INK} strokeWidth={WATCH_INK * 2} />
      <rect x={-bw / 2} y={-r * 1.06} width={bw} height={r * 2.12} rx={22} fill={`url(#${id}-band)`} />
      {[-48, -16, 16, 48].map((x, i) => (
        <rect key={i} x={x - 2} y={-r * 1.02} width={4} height={r * 2.04} fill="#0B205F" opacity={0.18} />
      ))}
      <rect x={-bw / 2 + 8} y={-r * 0.98} width={bw - 16} height={r * 0.16} rx={8} fill="#FFFFFF" opacity={0.28} />
      {/* case: extruded side (fake 3D), top shell, bezel, glass */}
      <rect x={cw / 2 - 4} y={-26} width={16} height={52} rx={8} fill={INK} stroke={INK} strokeWidth={WATCH_INK * 2} />
      <rect x={-cw / 2 + 4} y={-ch / 2 + 16} width={cw - 8} height={ch + 10} rx={58} fill={INK} stroke={INK} strokeWidth={WATCH_INK * 2} />
      <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={56} fill={INK} stroke={INK} strokeWidth={WATCH_INK * 2} />
      <rect x={-cw / 2 + 4} y={-ch / 2 + 16} width={cw - 8} height={ch + 10} rx={58} fill={`url(#${id}-side)`} />
      <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={56} fill={`url(#${id}-case)`} />
      {/* glossy shell highlights (the shiny plastic finish) */}
      <rect x={-cw / 2 + 18} y={-ch / 2 + 12} width={cw * 0.55} height={12} rx={6} fill="#FFFFFF" opacity={0.7} />
      <rect x={-cw / 2 + 12} y={-ch / 2 + 36} width={10} height={ch * 0.42} rx={5} fill="#FFFFFF" opacity={0.35} />
      <rect x={-SW / 2 - 12} y={-SH / 2 - 12} width={SW + 24} height={SH + 24} rx={36} fill={`url(#${id}-bez)`} />
      {/* crown button on the side */}
      <rect x={cw / 2 - 4} y={-26} width={16} height={52} rx={8} fill="#1D3E9B" />
      <rect x={cw / 2 - 2} y={-22} width={6} height={20} rx={3} fill="#FFFFFF" opacity={0.35} />
      {/* screen */}
      <g clipPath={`url(#${id}-scr)`}>
        <ScreenUI id={`${id}-ui`} s={screen} />
        {/* glass reflection: one sharp diagonal shape, kept off the text's centre */}
        <path d={`M${-SW / 2},${-SH / 2 + 26} L${-SW / 2 + 70},${-SH / 2} L${-SW / 2 + 110},${-SH / 2} L${-SW / 2},${-SH / 2 + 66} Z`} fill="#FFFFFF" opacity={0.16} />
      </g>
      {/* micro-port status pip (lights when the port is active) */}
      <circle cx={-cw / 2 + 30} cy={ch / 2 - 26} r={7} fill={port > 0.01 ? PAL.signal : '#123070'} />
      {port > 0.01 && <Glow id={`${id}-pp`} c={{x: -cw / 2 + 30, y: ch / 2 - 26}} r={30} color={PAL.signal} alpha={0.8 * port} />}
      {/* the screen lights its own bezel */}
      <Glow id={`${id}-sg`} c={{x: 0, y: 0}} r={SW * 0.7} ry={SH * 0.75} color={light} alpha={0.12} />
    </g>
  );
};

export {inv};
