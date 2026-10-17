// Taxi and Bus (side view). Origin: (x, y) is the centre of the ground contact (between the tyres when upright, the
// middle of the roof when overturned). Taxi ≈ 1250 × 400 (≈5 m), facing +x (dir flips). Bus ≈ 3000 × 780.
//
// The overturned taxi can be propped: `tilt` (deg, + raises the +x end) rotates about the roof edge resting on the
// ground at the other end (`pivot`), `lift` raises everything (for the recovery arm). taxiPoint() maps local → world so
// shots can attach a claw to the chassis or find the gap under the propped end.
import React from 'react';
import {CITY} from '../theme';
import {rnd, f2, range, polyPath, smoothPath, INK, K, Flames, blobD} from './cityKit';

export type TaxiProps = {x: number; y: number; dir?: 1 | -1; overturned?: boolean; tilt?: number; lift?: number; shiftX?: number; ink?: number; seed?: number; t?: number; broken?: number; dents?: number; burning?: number};

const ROOF = -395, SILL = -62, BELT = -232, WHEEL_R = 82, WX = 390;

/** Local (car) → world transform parameters for a taxi. */
const taxiXf = (p: TaxiProps) => {
  const dir = p.dir ?? 1;
  const ov = !!p.overturned;
  const tilt = p.tilt ?? 0;
  // overturned: flip so the roof (ROOF + crush) sits on y = 0; pivot at the roof corner on the low side
  const crush = ov ? 34 : 0;
  // overturned: rock on the roof corner on the low side; upright: on the tyre contact on the low side
  const pivotLocal = ov ? {x: tilt >= 0 ? -300 : 125, y: ROOF + crush} : {x: tilt >= 0 ? -WX - 40 : WX + 40, y: 0};
  return {dir, ov, tilt, crush, pivotLocal};
};

/** Map a local taxi point (x forward along the car, y up negative, upright frame) to world. */
export const taxiPoint = (p: TaxiProps, lx: number, ly: number) => {
  const {dir, ov, tilt, pivotLocal} = taxiXf(p);
  // 1) overturn: mirror y about 0 then move the roof onto the ground
  let x = lx, y = ly;
  if (ov) { y = -(ly - pivotLocal.y); x = lx; } // roof line → y = 0
  const px = pivotLocal.x, py = ov ? 0 : 0;
  // 2) tilt about the pivot on the ground (positive tilt raises the far end)
  const a = (-tilt * Math.PI) / 180 * (ov ? 1 : 1);
  const dx = x - px, dy = y - py;
  const rx = px + dx * Math.cos(a) - dy * Math.sin(a), ry = py + dx * Math.sin(a) + dy * Math.cos(a);
  return {x: p.x + (p.shiftX ?? 0) + rx * dir, y: p.y - (p.lift ?? 0) + ry};
};
/** Named attachment points (world). */
export const taxiPoints = (p: TaxiProps) => ({
  chassisTop: p.overturned ? taxiPoint(p, 0, SILL - 10) : taxiPoint(p, 0, ROOF),
  front: taxiPoint(p, 625, -150), rear: taxiPoint(p, -620, -150),
  /** Under a propped overturned taxi: the roof edge point at local x (the gap between this and the ground). */
  roofAt: (lx: number) => taxiPoint(p, lx, ROOF + (p.overturned ? 34 : 0)),
  wheelF: taxiPoint(p, WX, -WHEEL_R), wheelR: taxiPoint(p, -WX, -WHEEL_R),
  /** Overturned and tilted: where a support (rubble block) must top out to hold the raised roof corner. */
  support: taxiPoint(p, (p.tilt ?? 0) >= 0 ? 110 : -290, ROOF + (p.overturned ? 34 : 0)),
});

const bodyPath = (crush: number) => polyPath([
  {x: -612, y: SILL}, {x: -628, y: -150}, {x: -604, y: BELT + 4}, {x: -380, y: BELT - 14}, {x: -312, y: ROOF + crush + 6}, {x: -290, y: ROOF + crush},
  {x: 110, y: ROOF + crush}, {x: 140, y: ROOF + crush + 8}, {x: 300, y: BELT - 18}, {x: 592, y: BELT + 6}, {x: 628, y: -150}, {x: 616, y: SILL},
]);

export const Taxi: React.FC<TaxiProps> = (p) => {
  const {dir, ov, tilt, crush, pivotLocal} = taxiXf(p);
  const ink = p.ink ?? 6;
  const seed = p.seed ?? 1;
  const broken = p.broken ?? (ov ? 0.8 : 0.3);
  const dents = p.dents ?? (ov ? 1 : 0.4);
  const t = p.t ?? 0;
  const win = (x0: number, x1: number, x2: number, x3: number, key: string, k: number) => {
    const d = polyPath([{x: x0, y: BELT - 8}, {x: x1, y: ROOF + crush + 22}, {x: x2, y: ROOF + crush + 22}, {x: x3, y: BELT - 8}]);
    const br = rnd(seed * 9 + k) < broken;
    return (
      <g key={key}>
        <path d={d} fill={br ? '#1A1418' : '#3F5466'} stroke={INK} strokeWidth={ink * 0.8} strokeLinejoin="round" />
        {br ? <path d={polyPath([{x: x0 + 6, y: BELT - 12}, {x: x0 + (x3 - x0) * 0.35, y: BELT - 70}, {x: x0 + (x3 - x0) * 0.2, y: BELT - 120}, {x: x0 + 4, y: BELT - 90}])} fill="#7A93A6" opacity={0.75} />
          : <path d={`M ${f2(x0 + (x3 - x0) * 0.2)} ${f2(BELT - 30)} L ${f2(x0 + (x3 - x0) * 0.5)} ${f2(ROOF + crush + 40)}`} stroke="#8EA7B8" strokeWidth={ink * 0.9} opacity={0.6} />}
      </g>
    );
  };
  const wheel = (cx: number, k: number) => (
    <g key={`wh${k}`}>
      <circle cx={cx} cy={-WHEEL_R} r={WHEEL_R} fill={K.tyre} stroke={INK} strokeWidth={ink} />
      <circle cx={cx} cy={-WHEEL_R} r={WHEEL_R * 0.48} fill={K.hub} stroke={INK} strokeWidth={ink * 0.7} />
      <circle cx={cx} cy={-WHEEL_R} r={WHEEL_R * 0.14} fill="#5A5A5A" />
    </g>
  );
  const dentEls = range(Math.round(4 * dents)).map((i) => {
    const k = seed * 31 + i;
    const dx = -520 + rnd(k) * 1040, dy = BELT + 30 + rnd(k + 1) * 100;
    const r = 16 + rnd(k + 2) * 18;
    return (
      <g key={`d${i}`}>
        <path d={blobD(r, k, 7, 0.45, 1.5, 0.7)} transform={`translate(${f2(dx)} ${f2(dy)})`} fill={K.taxiDark} opacity={0.5} />
        <path d={`M ${f2(dx - r * 1.3)} ${f2(dy - r * 0.2)} Q ${f2(dx)} ${f2(dy + r * 0.5)} ${f2(dx + r * 1.2)} ${f2(dy - r * 0.3)}`} fill="none" stroke={INK} strokeWidth={ink * 0.5} opacity={0.7} />
      </g>
    );
  });
  // the car drawn upright in local coordinates, then overturned/tilted by one transform
  const car = (
    <g>
      {/* underside & chassis (visible when overturned) */}
      <rect x={-560} y={SILL - 6} width={1120} height={50} rx={14} fill="#2E2A2C" stroke={INK} strokeWidth={ink} />
      {ov && <g>
        <rect x={-420} y={SILL + 30} width={840} height={26} rx={8} fill="#3C3739" stroke={INK} strokeWidth={ink * 0.7} />
        <rect x={-200} y={SILL + 52} width={260} height={30} rx={10} fill="#4A4446" stroke={INK} strokeWidth={ink * 0.7} />
        <line x1={-600} y1={SILL + 44} x2={-200} y2={SILL + 66} stroke="#4A4446" strokeWidth={22} />
      </g>}
      <path d={bodyPath(crush)} fill={K.taxi} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <rect x={-600} y={-128} width={1210} height={18} fill={K.taxiDark} opacity={0.75} />
      {win(-372, -296, -95, -60, 'w1', 1)}
      {win(-40, -60, 110, 280, 'w2', 2)}
      <line x1={-50} y1={BELT} x2={-50} y2={SILL + 4} stroke={INK} strokeWidth={ink * 0.6} />
      <line x1={-350} y1={BELT} x2={-350} y2={SILL + 4} stroke={INK} strokeWidth={ink * 0.6} />
      <rect x={-300} y={BELT + 30} width={50} height={12} rx={5} fill={K.taxiDark} />
      <rect x={20} y={BELT + 30} width={50} height={12} rx={5} fill={K.taxiDark} />
      <path d={`M ${f2(560)} ${f2(-200)} l 50 6 l -6 30 l -46 -6 Z`} fill="#F4EBC8" stroke={INK} strokeWidth={ink * 0.6} />
      <rect x={-628} y={-200} width={26} height={44} rx={6} fill="#B23A2E" stroke={INK} strokeWidth={ink * 0.6} />
      {dentEls}
      {/* blank roof light box (crushed when the car lies on it) */}
      {!ov ? <rect x={-70} y={ROOF - 50} width={140} height={52} rx={10} fill="#F6EFD8" stroke={INK} strokeWidth={ink} />
        : <path d={polyPath([{x: -90, y: ROOF + crush}, {x: -60, y: ROOF + crush - 18}, {x: 70, y: ROOF + crush - 12}, {x: 96, y: ROOF + crush}])} fill="#D9D2BC" stroke={INK} strokeWidth={ink * 0.8} />}
      {wheel(-WX, 1)}{wheel(WX, 2)}
      {/* wheel arches */}
      {[-WX, WX].map((wx, i) => <path key={`a${i}`} d={`M ${f2(wx - 112)} ${f2(SILL)} A 112 112 0 0 1 ${f2(wx + 112)} ${f2(SILL)}`} fill="none" stroke={INK} strokeWidth={ink} />)}
      {(p.burning ?? 0) > 0 && <g transform={`translate(${f2(-150)} ${f2(BELT)})`}><Flames w={500 * (p.burning ?? 0)} h={420 * (p.burning ?? 0)} t={t} seed={seed + 3} n={4} /></g>}
    </g>
  );
  const a = tilt;
  const xf = ov
    ? `translate(${f2(p.x + (p.shiftX ?? 0))} ${f2(p.y - (p.lift ?? 0))}) scale(${dir} 1) rotate(${f2(-a)} ${f2(pivotLocal.x)} 0) scale(1 -1) translate(0 ${f2(-pivotLocal.y)})`
    : `translate(${f2(p.x + (p.shiftX ?? 0))} ${f2(p.y - (p.lift ?? 0))}) scale(${dir} 1) rotate(${f2(-a)} ${f2(pivotLocal.x)} 0)`;
  return <g transform={xf}>{car}</g>;
};

export type BusProps = {x: number; y: number; dir?: 1 | -1; tilt?: number; ink?: number; seed?: number; t?: number; burn?: number; broken?: number};

/** Wrecked city bus (cover). (x, y) = centre of the ground contact. */
export const Bus: React.FC<BusProps> = ({x, y, dir = 1, tilt = 0, ink = 6, seed = 2, t = 0, burn = 0.4, broken = 0.6}) => {
  const L = 3000, Hh = 780, R = 120;
  const windows = range(7).map((i) => {
    const wx = -L / 2 + 420 + i * 330;
    const k = seed * 7 + i;
    const br = rnd(k) < broken;
    const sooty = i < 3 && burn > 0;
    return (
      <g key={i}>
        <rect x={wx} y={-Hh + 120} width={280} height={260} rx={12} fill={br ? '#140F12' : '#3F5466'} stroke={INK} strokeWidth={ink * 0.8} />
        {br && <path d={polyPath([{x: wx + 6, y: -Hh + 380}, {x: wx + 90, y: -Hh + 300}, {x: wx + 40, y: -Hh + 380}])} fill="#7A93A6" opacity={0.8} />}
        {sooty && <path d={`M ${f2(wx - 20)} ${f2(-Hh + 130)} Q ${f2(wx + 140)} ${f2(-Hh - 30)} ${f2(wx + 300)} ${f2(-Hh + 130)} Z`} fill={K.soot} opacity={0.75} />}
      </g>
    );
  });
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${dir} 1) rotate(${f2(-tilt)} ${f2(L / 2)} 0)`}>
      <path d={smoothPath([{x: -L / 2, y: -40}, {x: -L / 2 - 10, y: -Hh + 60}, {x: -L / 2 + 40, y: -Hh}, {x: L / 2 - 60, y: -Hh}, {x: L / 2, y: -Hh + 90}, {x: L / 2 + 10, y: -40}], true, 0.25)} fill={K.busBody} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <rect x={-L / 2} y={-Hh + 400} width={L} height={70} fill={K.busBand} />
      <rect x={-L / 2} y={-140} width={L} height={100} fill={K.busDark} />
      {windows}
      {/* front windscreen and doors */}
      <path d={`M ${f2(L / 2 - 200)} ${f2(-Hh + 110)} L ${f2(L / 2 - 20)} ${f2(-Hh + 110)} L ${f2(L / 2)} ${f2(-Hh + 420)} L ${f2(L / 2 - 200)} ${f2(-Hh + 420)} Z`} fill="#1A1418" stroke={INK} strokeWidth={ink * 0.8} />
      <rect x={L / 2 - 420} y={-Hh + 120} width={180} height={560} rx={8} fill="#2E3A44" stroke={INK} strokeWidth={ink * 0.8} />
      <line x1={L / 2 - 330} y1={-Hh + 120} x2={L / 2 - 330} y2={-Hh + 680} stroke={INK} strokeWidth={ink * 0.7} />
      {burn > 0 && <path d={blobD(300, seed + 5, 10, 0.4, 1.3, 0.6)} transform={`translate(${f2(-L / 2 + 760)} ${f2(-Hh + 200)})`} fill={K.soot} opacity={0.55 * Math.min(1, burn * 1.5)} />}
      {[-L / 2 + 520, L / 2 - 640].map((wx, i) => (
        <g key={i}>
          <path d={`M ${f2(wx - 150)} ${f2(-40)} A 150 150 0 0 1 ${f2(wx + 150)} ${f2(-40)}`} fill="#1E1A1C" stroke={INK} strokeWidth={ink} />
          <ellipse cx={wx} cy={-R + 18} rx={R} ry={R * 0.8} fill={K.tyre} stroke={INK} strokeWidth={ink} />
          <circle cx={wx} cy={-R + 18} r={R * 0.4} fill={K.hub} stroke={INK} strokeWidth={ink * 0.7} />
        </g>
      ))}
      {burn > 0.3 && <g transform={`translate(${f2(-L / 2 + 760)} ${f2(-Hh + 140)})`}><Flames w={360 * burn} h={420 * burn} t={t} seed={seed + 9} n={3} /></g>}
      {/* the roof edge in profile: soft dark band */}
      <line x1={-L / 2 + 40} y1={-Hh + 6} x2={L / 2 - 60} y2={-Hh + 6} stroke={INK} strokeWidth={ink * 0.6} />
      {void CITY}
    </g>
  );
};
