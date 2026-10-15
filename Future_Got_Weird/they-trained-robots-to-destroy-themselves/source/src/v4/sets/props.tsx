// V4 props (vector, opaque fills, one ink weight `lw` in world units, 2–3 fill/shade shapes each).
// World props take a bottom-centre or centre position in world units; screen props say so.
import React from 'react';
import {C, F} from '../../theme';
import {backOut, clamp01, easeOut, lerp} from '../kit/scene';

const INK = '#162A32';
const WOOD = {face: '#D9A35E', shade: '#B57D3C', hi: '#EDC48A', dark: '#8A5A26'};

// ------------------------------------------------------------------ shipping crate (side elevation)
export type CrateParts = {pallet?: number; back?: number; left?: number; right?: number; top?: number};
/** Open shipping crate around (x, bottom y). Each part flies in with its 0..1 amount. */
export const Crate: React.FC<{x: number; y: number; w: number; h: number; lw: number; parts?: CrateParts; front?: React.ReactNode}> = ({x, y, w, h, lw, parts = {}, front}) => {
  const P = {pallet: 1, back: 1, left: 1, right: 1, top: 1, ...parts};
  const fly = (k: number, dx: number, dy: number) => {
    const e = backOut(k, 1.3);
    return `translate(${(1 - e) * dx} ${(1 - e) * dy})`;
  };
  const x0 = x - w / 2, x1 = x + w / 2, yt = y - h;
  const planks = (px: number, py: number, pw: number, ph: number, n: number, key: string) => (
    <g key={key}>
      <rect x={px} y={py} width={pw} height={ph} fill={WOOD.face} stroke={INK} strokeWidth={lw} />
      {Array.from({length: n - 1}, (_, i) => <line key={i} x1={px + (pw * (i + 1)) / n} y1={py} x2={px + (pw * (i + 1)) / n} y2={py + ph} stroke={WOOD.dark} strokeWidth={lw * 0.6} />)}
    </g>
  );
  return (
    <g>
      {P.back > 0.01 ? (
        <g transform={fly(P.back, 0, -900)}>
          {planks(x0 + 20, yt + 20, w - 40, h - 40, 7, 'b')}
          <rect x={x0 + 20} y={yt + 20} width={w - 40} height={h - 40} fill="#000" opacity={0.28} />
        </g>
      ) : null}
      {P.pallet > 0.01 ? (
        <g transform={fly(P.pallet, 0, 300)}>
          <rect x={x0 - 10} y={y - 30} width={w + 20} height={30} fill={WOOD.shade} stroke={INK} strokeWidth={lw} />
          {[0.12, 0.5, 0.88].map((u) => <rect key={u} x={x0 - 10 + (w + 20) * u - 30} y={y - 30} width={60} height={30} fill={WOOD.dark} stroke={INK} strokeWidth={lw * 0.7} />)}
        </g>
      ) : null}
      {front}
      {P.left > 0.01 ? (
        <g transform={fly(P.left, -900, 0)}>
          <rect x={x0} y={yt} width={34} height={h - 30} fill={WOOD.face} stroke={INK} strokeWidth={lw} />
          <rect x={x0 + 4} y={yt + 4} width={8} height={h - 38} fill={WOOD.hi} />
        </g>
      ) : null}
      {P.right > 0.01 ? (
        <g transform={fly(P.right, 900, 0)}>
          <rect x={x1 - 34} y={yt} width={34} height={h - 30} fill={WOOD.face} stroke={INK} strokeWidth={lw} />
          <rect x={x1 - 30} y={yt + 4} width={8} height={h - 38} fill={WOOD.hi} />
        </g>
      ) : null}
      {P.top > 0.01 ? (
        <g transform={fly(P.top, 0, -900)}>
          <rect x={x0 - 14} y={yt - 30} width={w + 28} height={36} fill={WOOD.face} stroke={INK} strokeWidth={lw} />
          <rect x={x0 - 10} y={yt - 26} width={w + 20} height={8} fill={WOOD.hi} />
        </g>
      ) : null}
    </g>
  );
};

/** Shared door artwork in door-local coordinates (u across 0..1, v down 0..1) mapped through `map` (affine or perspective). */
const doorShapes = (map: (u: number, v: number) => number[], lw: number, shade = 0): React.ReactNode[] => {
  const q = (pts: number[][]) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
  const rect = (u0: number, u1: number, v0: number, v1: number) => q([map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)]);
  const els: React.ReactNode[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) els.push(<path key={'p' + i} d={rect(i / n, (i + 1) / n, 0, 1)} fill={i % 2 ? WOOD.face : '#D29B57'} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />);
  els.push(<path key="tb" d={rect(0, 1, 0, 0.12)} fill={WOOD.shade} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />);
  els.push(<path key="bb" d={rect(0, 1, 0.88, 1)} fill={WOOD.shade} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />);
  els.push(<path key="br" d={q([map(0.03, 0.82), map(0.13, 0.88), map(0.97, 0.18), map(0.87, 0.12)])} fill={WOOD.shade} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />);
  if (shade > 0) els.push(<path key="sh" d={rect(0, 1, 0, 1)} fill="#000" opacity={shade} />);
  return els;
};

/** The crate's closed front face, optional stamp and padlock. Same rect as Crate(x, y, w, h). */
export const CrateFront: React.FC<{x: number; y: number; w: number; h: number; lw: number; stamp?: number; lock?: number; text?: string; fall?: number}> = ({x, y, w, h, lw, stamp = 0, lock = 0, text = 'NOT FOR SALE', fall = 0}) => {
  const x0 = x - w / 2, yt = y - h;
  // fall: the front drops forward like a drawbridge (top edge comes toward the viewer, so it widens and lowers)
  const c = Math.cos((fall * Math.PI) / 2);
  const map = (u: number, v: number) => {
    const vv = 1 - v; // height above the bottom edge, 0..1
    const grow = 1 + 0.35 * (1 - c) * vv;
    return [x + (x0 + u * w - x) * grow, y - vv * h * c + vv * (1 - c) * 60];
  };
  const s = 1 + (1 - easeOut(stamp)) * 0.25;
  return (
    <g>
      {doorShapes(map, lw, fall * 0.25)}
      {stamp > 0 && fall < 0.05 ? (
        <g transform={`translate(${x} ${yt + h * 0.48}) rotate(-8) scale(${s})`}>
          <rect x={-w * 0.42} y={-64} width={w * 0.84} height={128} rx={14} fill={C.paper} stroke={C.coral} strokeWidth={14} />
          <text x={0} y={26} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={74} fill={C.coral} textLength={w * 0.72} lengthAdjust="spacingAndGlyphs">{text}</text>
        </g>
      ) : null}
      {lock > 0 && fall < 0.05 ? <Lock x={x + w * 0.36} y={y - 150} s={1.1} open={1 - lock} lw={lw} /> : null}
    </g>
  );
};

export const Lock: React.FC<{x: number; y: number; s?: number; open?: number; lw: number}> = ({x, y, s = 1, open = 0, lw}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M-30 -6 L-30 -40 Q-30 -72 0 -72 Q30 -72 30 -40 L30 ${-6 - 26 * open}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <path d={`M-30 -6 L-30 -40 Q-30 -72 0 -72 Q30 -72 30 -40 L30 ${-6 - 26 * open}`} fill="none" stroke="#B9C2CA" strokeWidth={8} strokeLinecap="round" />
    <rect x={-46} y={-12} width={92} height={76} rx={12} fill={C.saffron} stroke={INK} strokeWidth={lw} />
    <rect x={-40} y={-6} width={20} height={64} rx={8} fill={C.saffronLight} />
    <circle cx={0} cy={20} r={9} fill={INK} />
    <rect x={-4} y={22} width={8} height={20} rx={3} fill={INK} />
  </g>
);

/**
 * Screen-space swinging crate door that crosses close to the lens and ends filling the frame. Hinge just off the left
 * edge; a long-lens projection keeps it from crossing the camera plane. th: 90 (open, edge-on, invisible) → 0 (shut).
 */
const DS = {f: 2400, Z0: 1000, H: 668, Xh: -440, W: 850};
export const DoorSwing: React.FC<{th: number}> = ({th}) => {
  if (th >= 89.5) return null;
  const a = (th * Math.PI) / 180;
  const map = (u: number, v: number) => {
    const X = DS.Xh + DS.W * u * Math.cos(a), Z = DS.Z0 - DS.W * u * Math.sin(a);
    return [960 + (DS.f * X) / Z, 540 + (DS.f * (-DS.H / 2 + v * DS.H)) / Z];
  };
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>{doorShapes(map, 6, 0.35 * Math.sin(a))}</svg>;
};
/** Screen rect the shut DoorSwing covers (use it to choose the world camera that continues the shot). */
export const DOOR_SHUT_SCREEN = {x0: 960 + (DS.f * DS.Xh) / DS.Z0, x1: 960 + (DS.f * (DS.Xh + DS.W)) / DS.Z0, y0: 540 - (DS.f * DS.H) / 2 / DS.Z0, y1: 540 + (DS.f * DS.H) / 2 / DS.Z0};

// ------------------------------------------------------------------ actuator (cutaway illustration, centred at 0,0)
/** Rotary actuator: housing, stator coils, rotor magnets, strain-wave gear, output flange. rot in degrees. heat 0..1. */
export const ActuatorArt: React.FC<{r: number; rot: number; lw: number; heat?: number; id: string}> = ({r, rot, lw, heat = 0, id}) => {
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0')).join('');
  };
  const steel = mix('#9AA6B2', '#FF9A2A', heat), steelD = mix('#5E6A76', '#E0561A', heat), copper = mix('#D27A3A', '#FFD45A', heat), mag = mix('#4F7CC9', '#FFB13B', heat), dark = mix('#24292F', '#5A1E0C', heat);
  const teeth = 36;
  const ell = 1 + 0.06 * Math.cos(((rot * 2) * Math.PI) / 180);
  return (
    <g>
      <defs><clipPath id={id + 'c'}><circle r={r} /></clipPath></defs>
      <circle r={r} fill={steelD} stroke={INK} strokeWidth={lw} />
      <circle r={r * 0.93} fill={steel} />
      {/* stator coils */}
      {Array.from({length: 12}, (_, i) => (
        <g key={'s' + i} transform={`rotate(${i * 30})`}>
          <rect x={-r * 0.09} y={-r * 0.9} width={r * 0.18} height={r * 0.2} rx={r * 0.03} fill={copper} stroke={INK} strokeWidth={lw * 0.6} />
        </g>
      ))}
      {/* rotor with magnets */}
      <g transform={`rotate(${rot})`}>
        <circle r={r * 0.66} fill={dark} stroke={INK} strokeWidth={lw * 0.7} />
        {Array.from({length: 10}, (_, i) => <rect key={'m' + i} transform={`rotate(${i * 36})`} x={-r * 0.07} y={-r * 0.64} width={r * 0.14} height={r * 0.1} fill={i % 2 ? mag : C.coral} />)}
      </g>
      {/* strain-wave gear: rigid ring teeth + flexing spline */}
      <circle r={r * 0.5} fill={steelD} stroke={INK} strokeWidth={lw * 0.6} />
      <g transform={`rotate(${-rot / 6})`}>
        {Array.from({length: teeth}, (_, i) => <rect key={'t' + i} transform={`rotate(${(i * 360) / teeth})`} x={-r * 0.018} y={-r * 0.5} width={r * 0.036} height={r * 0.06} fill={INK} />)}
      </g>
      <g transform={`rotate(${rot}) scale(${ell} ${1 / ell})`}>
        <circle r={r * 0.42} fill={steel} stroke={INK} strokeWidth={lw * 0.6} />
      </g>
      {/* output flange */}
      <g transform={`rotate(${-rot / 6})`}>
        <circle r={r * 0.3} fill={mix('#C3CCD5', '#FFD45A', heat)} stroke={INK} strokeWidth={lw * 0.7} />
        {Array.from({length: 6}, (_, i) => <circle key={'b' + i} cx={Math.cos((i * Math.PI) / 3) * r * 0.2} cy={Math.sin((i * Math.PI) / 3) * r * 0.2} r={r * 0.035} fill={INK} />)}
        <circle r={r * 0.08} fill={INK} />
      </g>
    </g>
  );
};

/** Screen-space magnifier: a bounded lens with a leader line to the anchor; children are drawn centred in the lens. */
export const Lens: React.FC<{ax: number; ay: number; cx: number; cy: number; r: number; k: number; id: string; children: React.ReactNode; color?: string}> = ({ax, ay, cx, cy, r, k, id, children, color = C.teal}) => {
  if (k <= 0) return null;
  const e = backOut(k, 1.2);
  const rr = r * e;
  return (
    <g>
      <line x1={ax} y1={ay} x2={lerp(ax, cx, clamp01(k * 1.5))} y2={lerp(ay, cy, clamp01(k * 1.5))} stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <line x1={ax} y1={ay} x2={lerp(ax, cx, clamp01(k * 1.5))} y2={lerp(ay, cy, clamp01(k * 1.5))} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={18} fill="none" stroke={INK} strokeWidth={9} />
      <circle cx={ax} cy={ay} r={18} fill="none" stroke={color} strokeWidth={4} />
      <defs><clipPath id={id}><circle cx={cx} cy={cy} r={Math.max(1, rr)} /></clipPath></defs>
      <circle cx={cx} cy={cy} r={rr} fill="#F4EFE3" />
      <g clipPath={`url(#${id})`}><g transform={`translate(${cx} ${cy}) scale(${e})`}>{children}</g></g>
      <circle cx={cx} cy={cy} r={rr} fill="none" stroke={INK} strokeWidth={14} />
      <circle cx={cx} cy={cy} r={rr} fill="none" stroke={color} strokeWidth={7} />
    </g>
  );
};

/** Battery pack cutaway (centred at 0,0, width w, height h). */
export const BatteryArt: React.FC<{w: number; h: number; lw: number; glow?: number}> = ({w, h, lw, glow = 0}) => {
  const cols = 5, rows = 3;
  const cw = (w - 40) / cols, ch = (h - 60) / rows;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill="#2E3A44" stroke={INK} strokeWidth={lw} />
      <rect x={-w / 2 + 10} y={-h / 2 + 10} width={w - 20} height={26} rx={6} fill="#46535E" />
      {Array.from({length: cols * rows}, (_, i) => {
        const cx = -w / 2 + 20 + (i % cols) * cw + cw / 2, cy = -h / 2 + 46 + Math.floor(i / cols) * ch + ch / 2;
        return (
          <g key={i}>
            <rect x={cx - cw * 0.4} y={cy - ch * 0.42} width={cw * 0.8} height={ch * 0.84} rx={cw * 0.2} fill="#5FB86A" stroke={INK} strokeWidth={lw * 0.6} />
            <rect x={cx - cw * 0.4} y={cy - ch * 0.42} width={cw * 0.8} height={ch * 0.2} rx={cw * 0.1} fill="#3E8E4C" />
          </g>
        );
      })}
      {glow > 0 ? <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill="none" stroke={C.saffron} strokeWidth={lw * 2.5} opacity={glow} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ facades for "which foundries said yes"
export const Facade: React.FC<{x: number; y: number; w: number; h: number; lw: number; label: string; shut?: number; mark?: 'x' | 'ok' | null; markK?: number; glow?: number; tint?: string; window?: React.ReactNode}> =
  ({x, y, w, h, lw, label, shut = 0, mark = null, markK = 0, glow = 0, tint = '#C9B79A', window}) => {
    const x0 = x - w / 2, yt = y - h;
    const dw = w * 0.56, dh = h * 0.56, dx = x - dw / 2, dy = y - dh;
    return (
      <g>
        {/* chimney + roof */}
        <rect x={x + w * 0.22} y={yt - 170} width={60} height={200} fill="#8A7A6A" stroke={INK} strokeWidth={lw} />
        <rect x={x + w * 0.22 - 8} y={yt - 180} width={76} height={24} fill="#6E6052" stroke={INK} strokeWidth={lw} />
        <path d={`M${x0 - 30} ${yt + 20} L${x0 + w * 0.2} ${yt - 80} L${x0 + w * 0.8} ${yt - 80} L${x0 + w + 30} ${yt + 20} Z`} fill="#6E6052" stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
        <rect x={x0} y={yt} width={w} height={h} fill={tint} stroke={INK} strokeWidth={lw} />
        <rect x={x0} y={yt} width={w} height={22} fill="#000" opacity={0.12} />
        {/* doorway with the interior, and its roll-up shutter */}
        <rect x={dx} y={dy} width={dw} height={dh} fill="#2A1E1A" stroke={INK} strokeWidth={lw} />
        {glow > 0 ? <rect x={dx} y={dy} width={dw} height={dh} fill="#FFB347" opacity={glow * 0.85} /> : null}
        {window}
        {shut > 0 ? (
          <g>
            <rect x={dx} y={dy} width={dw} height={dh * shut} fill="#9AA4AE" stroke={INK} strokeWidth={lw} />
            {Array.from({length: Math.floor((dh * shut) / 28)}, (_, i) => <line key={i} x1={dx} y1={dy + 28 * (i + 1)} x2={dx + dw} y2={dy + 28 * (i + 1)} stroke="#6E7882" strokeWidth={lw * 0.6} />)}
          </g>
        ) : null}
        <rect x={dx - 14} y={dy - 18} width={dw + 28} height={22} fill="#6E6052" stroke={INK} strokeWidth={lw} />
        {/* name board */}
        <rect x={x0 + 26} y={yt + 30} width={w - 52} height={96} rx={12} fill={C.paper} stroke={INK} strokeWidth={lw} />
        <text x={x} y={yt + 96} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={62} fill={INK} textLength={Math.min(w - 90, label.length * 38)} lengthAdjust="spacingAndGlyphs">{label}</text>
        {mark && markK > 0 ? <Mark x={x + w * 0.36} y={yt - 40} ok={mark === 'ok'} k={markK} s={1.3} /> : null}
      </g>
    );
  };

/** A drawn check / cross badge (world or screen units). */
export const Mark: React.FC<{x: number; y: number; ok: boolean; k: number; s?: number}> = ({x, y, ok, k, s = 1}) => {
  if (k <= 0) return null;
  const e = backOut(k, 1.8);
  const col = ok ? C.teal : C.coral;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * e})`}>
      <circle r={62} fill={col} stroke={INK} strokeWidth={8} />
      {ok
        ? <path d="M-30 2 L-8 26 L32 -24" fill="none" stroke="#FFFFFF" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M-24 -24 L24 24 M24 -24 L-24 24" fill="none" stroke="#FFFFFF" strokeWidth={16} strokeLinecap="round" />}
    </g>
  );
};

// ------------------------------------------------------------------ engineering time: wall clock, crank, calendar strip
export const WallClock: React.FC<{x: number; y: number; r: number; lw: number; a: number}> = ({x, y, r, lw, a}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#FFFFFF" stroke={INK} strokeWidth={lw * 1.4} />
    <circle r={r * 0.9} fill="none" stroke={C.paperLine} strokeWidth={lw} />
    {Array.from({length: 12}, (_, i) => <line key={i} transform={`rotate(${i * 30})`} x1={0} y1={-r * 0.78} x2={0} y2={-r * 0.66} stroke={INK} strokeWidth={lw} />)}
    <line transform={`rotate(${a / 12})`} x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={INK} strokeWidth={lw * 2} strokeLinecap="round" />
    <line transform={`rotate(${a})`} x1={0} y1={0} x2={0} y2={-r * 0.7} stroke={C.coral} strokeWidth={lw * 1.4} strokeLinecap="round" />
    <circle r={r * 0.06} fill={INK} />
  </g>
);

export const Crank: React.FC<{x: number; y: number; r: number; lw: number; a: number}> = ({x, y, r, lw, a}) => {
  const hx = Math.cos((a * Math.PI) / 180) * r, hy = Math.sin((a * Math.PI) / 180) * r;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-18} y={0} width={36} height={1000 - y} fill="#7E8A94" stroke={INK} strokeWidth={lw} />
      <circle r={r + 14} fill="#9AA4AE" stroke={INK} strokeWidth={lw} />
      <circle r={r - 14} fill="#C3CCD5" stroke={INK} strokeWidth={lw * 0.7} />
      {Array.from({length: 6}, (_, i) => <line key={i} transform={`rotate(${a + i * 60})`} x1={0} y1={0} x2={r - 14} y2={0} stroke={INK} strokeWidth={lw * 0.7} />)}
      <line x1={0} y1={0} x2={hx} y2={hy} stroke={INK} strokeWidth={lw * 3} strokeLinecap="round" />
      <line x1={0} y1={0} x2={hx} y2={hy} stroke={C.saffron} strokeWidth={lw * 1.6} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={16} fill={C.coral} stroke={INK} strokeWidth={lw} />
      <circle r={12} fill={INK} />
    </g>
  );
};

/** Month flip board: the visible month index can be fractional (pages flip down). */
export const MonthBoard: React.FC<{x: number; y: number; lw: number; m: number; w?: number; h?: number}> = ({x, y, lw, m, w = 260, h = 300}) => {
  const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const i = Math.floor(m), fr = m - i;
  const page = (k: number, key: string, sy = 1) => (
    <g key={key} transform={`translate(${x} ${y - h / 2 + 50}) scale(1 ${sy}) translate(${-x} ${-(y - h / 2 + 50)})`}>
      <rect x={x - w / 2} y={y - h / 2 + 50} width={w} height={h - 50} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={lw} />
      <text x={x} y={y + 50} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={92} fill={INK}>{M[((k % 12) + 12) % 12]}</text>
    </g>
  );
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={60} rx={10} fill={C.coral} stroke={INK} strokeWidth={lw} />
      {[-0.3, 0.3].map((u) => <circle key={u} cx={x + u * w} cy={y - h / 2 + 4} r={10} fill={INK} />)}
      {page(i + 1, 'n')}
      {page(i, 'c', Math.max(0.02, 1 - fr * 2) * (fr < 0.5 ? 1 : 0.02))}
    </g>
  );
};

// ------------------------------------------------------------------ film set
export const FilmLight: React.FC<{x: number; y: number; lw: number; on: number; aim?: number; h?: number; id: string}> = ({x, y, lw, on, aim = -25, h = 420, id}) => {
  const top = y - h;
  return (
    <g>
      {on > 0 ? (
        <g transform={`translate(${x} ${top}) rotate(${aim})`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#FFF4D0" stopOpacity={0.75 * on} /><stop offset="1" stopColor="#FFF4D0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M60 -50 L900 -260 L900 260 L60 50 Z" fill={`url(#${id})`} />
        </g>
      ) : null}
      {/* tripod stand */}
      {[-60, 0, 60].map((dx) => <line key={dx} x1={x} y1={top + 60} x2={x + dx} y2={y} stroke={INK} strokeWidth={lw * 2} strokeLinecap="round" />)}
      <rect x={x - 9} y={top} width={18} height={h * 0.6} fill="#3A3D44" stroke={INK} strokeWidth={lw} />
      <g transform={`translate(${x} ${top}) rotate(${aim})`}>
        <rect x={-50} y={-56} width={110} height={112} rx={14} fill="#2B2E33" stroke={INK} strokeWidth={lw} />
        <path d="M60 -56 L96 -82 M60 56 L96 82" stroke={INK} strokeWidth={lw * 2} strokeLinecap="round" />
        <rect x={52} y={-44} width={16} height={88} rx={6} fill={on > 0.5 ? '#FFF4D0' : '#55595F'} stroke={INK} strokeWidth={lw * 0.7} />
      </g>
    </g>
  );
};

export const TripodCam: React.FC<{x: number; y: number; lw: number; h?: number}> = ({x, y, lw, h = 360}) => {
  const top = y - h;
  return (
    <g>
      {[-70, 0, 70].map((dx) => <line key={dx} x1={x} y1={top + 40} x2={x + dx} y2={y} stroke={INK} strokeWidth={lw * 2} strokeLinecap="round" />)}
      <rect x={x - 90} y={top - 70} width={170} height={100} rx={12} fill="#24282E" stroke={INK} strokeWidth={lw} />
      <rect x={x + 80} y={top - 54} width={60} height={68} rx={8} fill="#1A1D21" stroke={INK} strokeWidth={lw} />
      <circle cx={x - 40} cy={top - 98} r={30} fill="#24282E" stroke={INK} strokeWidth={lw} />
      <circle cx={x + 30} cy={top - 98} r={30} fill="#24282E" stroke={INK} strokeWidth={lw} />
      <circle cx={x + 130} cy={top - 20} r={8} fill={C.coral} />
    </g>
  );
};

/** Big clapperboard in screen space; clap 0 = open, 1 = shut. */
export const BigClapper: React.FC<{x: number; y: number; s: number; rot?: number; clap: number; text?: string}> = ({x, y, s, rot = 0, clap, text = 'F.02'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-420} y={0} width={840} height={460} rx={16} fill="#1E2026" stroke="#0B0C0F" strokeWidth={10} />
    <g transform={`rotate(${-26 * (1 - clap)} -420 0)`}>
      <rect x={-420} y={-100} width={840} height={100} rx={10} fill="#F4ECD6" stroke="#0B0C0F" strokeWidth={10} />
      {Array.from({length: 7}, (_, k) => <path key={k} d={`M${-390 + k * 122} -100 l60 0 l-52 100 l-60 0 Z`} fill="#1E2026" />)}
    </g>
    <rect x={-420} y={0} width={840} height={40} fill="#F4ECD6" stroke="#0B0C0F" strokeWidth={8} />
    {Array.from({length: 7}, (_, k) => <path key={'b' + k} d={`M${-390 + k * 122} 0 l60 0 l-20 40 l-60 0 Z`} fill="#1E2026" />)}
    <text x={-370} y={170} fontFamily={F.mono} fontWeight={700} fontSize={56} fill="#F4ECD6">ROLL</text>
    <text x={-370} y={300} fontFamily={F.display} fontWeight={700} fontSize={110} fill={C.saffron}>{text}</text>
    <line x1={-420} y1={340} x2={420} y2={340} stroke="#F4ECD6" strokeWidth={5} />
    <line x1={60} y1={40} x2={60} y2={460} stroke="#F4ECD6" strokeWidth={5} />
  </g>
);

// ------------------------------------------------------------------ scrap for the recycling beat
export const Scrap: React.FC<{x: number; y: number; kind: number; rot?: number; lw: number}> = ({x, y, kind, rot = 0, lw}) => {
  const k = kind % 4;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {k === 0 ? <path d="M-70 18 L-60 -24 Q0 -36 54 -26 L70 18 Z" fill="#8FA3B8" stroke={INK} strokeWidth={lw} strokeLinejoin="round" /> : null}
      {k === 1 ? <rect x={-80} y={-14} width={160} height={28} rx={14} fill="#9AA4AE" stroke={INK} strokeWidth={lw} /> : null}
      {k === 2 ? <g><circle r={34} fill="#7E8A94" stroke={INK} strokeWidth={lw} /><circle r={14} fill="#2B3036" /></g> : null}
      {k === 3 ? <path d="M-50 20 L-40 -30 L44 -22 L56 20 Z" fill="#B0876A" stroke={INK} strokeWidth={lw} strokeLinejoin="round" /> : null}
    </g>
  );
};
