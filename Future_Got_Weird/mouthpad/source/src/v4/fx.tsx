// V2 building blocks: the vertical in-game camera, the targeting reticle, the cobwebbed gamepad in the foreground,
// the magnifying glass, the controller close-up with mashing thumbs, and the paint that bursts out of the screen.
import React from 'react';
import {GameScreen, GameState, Hearts, Keys} from '../art/game';
import {clamp, lerp, hash, smoothPath, P} from '../lib';

const INK = '#162A32';

/** The game seen by its own camera, filling the vertical frame. `zoom` scales the 640×400 game; (cx, hy) put the
 *  game's centre column and horizon on screen. The hearts sit in the same corner in every in-game shot. */
export const GameVertical: React.FC<{g: GameState; id: string; zoom?: number; hy?: number; cx?: number}> = ({g, id, zoom = 2.4, hy = 760, cx = 540}) => {
  const tx = cx - 320 * zoom, ty = hy - 148 * zoom;
  const ext = {t: ty / zoom + 4, b: (1920 - ty) / zoom - 400 + 4, l: Math.max(0, tx / zoom) + 4, r: Math.max(0, (1080 - tx) / zoom - 640) + 4};
  return (
    <g>
      <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
        <GameScreen g={g} id={id} ext={ext} hud={false} />
      </g>
      <g transform="translate(70 190) scale(2.2)"><Hearts /></g>
      {g.keys && <g transform="translate(-40 1020) scale(2.4)"><Keys k={g.keys} /></g>}
    </g>
  );
};

/** the game's crosshair as an object in the room: it leaves the screen and flies to the mouth */
export const Reticle: React.FC<{x: number; y: number; r: number; lock: number; spin: number; o: number}> = ({x, y, r, lock, spin, o}) => (
  <g transform={`translate(${x} ${y}) rotate(${spin})`} opacity={o}>
    {[0, 90, 180, 270].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <path d={`M ${r * 0.55} 0 L ${r * 1.15} 0`} stroke={INK} strokeWidth={r * 0.2} strokeLinecap="round" />
        <path d={`M ${r * 0.55} 0 L ${r * 1.15} 0`} stroke="#FFFFFF" strokeWidth={r * 0.09} strokeLinecap="round" />
      </g>
    ))}
    <circle r={r * 0.8} fill="none" stroke={INK} strokeWidth={r * 0.2} />
    <circle r={r * 0.8} fill="none" stroke={lock > 0.5 ? '#FF5FA2' : '#FFFFFF'} strokeWidth={r * 0.09} />
    {lock > 0.01 && <circle r={r * (1.6 - 0.6 * lock)} fill="none" stroke="#FF5FA2" strokeWidth={r * 0.1} opacity={lock} />}
  </g>
);

/** foreground: the untouched gamepad, close to the lens, with a cobweb and a tiny spider (screen space) */
export const DustyPad: React.FC<{t: number; x: number; y: number; s: number}> = ({t, x, y, s}) => {
  const sp = Math.sin(t * 2.2) * 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={58} rx={220} ry={26} fill="#000000" opacity={0.18} />
      <path d="M -190 -20 Q -186 -66 -96 -66 L 96 -66 Q 186 -66 190 -20 L 214 60 Q 222 110 172 110 Q 136 110 112 62 L -112 62 Q -136 110 -172 110 Q -222 110 -214 60 Z" fill="#E9EEF2" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -150 -40 Q -110 -56 -40 -56" fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" />
      <circle cx={-104} cy={-16} r={22} fill="#2B2B33" />
      <circle cx={96} cy={-30} r={13} fill="#EF6B55" stroke={INK} strokeWidth={5} /><circle cx={126} cy={-6} r={13} fill="#1CA7A0" stroke={INK} strokeWidth={5} /><circle cx={66} cy={-6} r={13} fill="#FFC744" stroke={INK} strokeWidth={5} />
      {/* dust */}
      {Array.from({length: 18}).map((_, i) => <circle key={i} cx={-170 + hash(i) * 340} cy={-60 + hash(i + 40) * 100} r={2 + hash(i + 9) * 3} fill="#9AA5AE" opacity={0.7} />)}
      {/* the cobweb, from the pad's corner up and away, with a spider bobbing on its thread */}
      <g fill="none" stroke="#FFFFFF" strokeWidth={2.6} opacity={0.85}>
        <path d="M 170 -40 L 300 -220 M 170 -40 L 340 -90 M 170 -40 L 250 -260 M 210 -150 Q 250 -150 300 -110 M 230 -190 Q 270 -175 320 -150 M 195 -100 Q 230 -110 260 -80" />
      </g>
      <line x1={262} y1={-236} x2={262} y2={-120 + sp} stroke="#FFFFFF" strokeWidth={2} opacity={0.8} />
      <g transform={`translate(262 ${-112 + sp})`}>
        {[-1, 1].map((d) => [0, 1, 2].map((k) => <path key={`${d}${k}`} d={`M 0 0 q ${d * 10} ${-6 + k * 6} ${d * 16} ${2 + k * 8}`} stroke={INK} strokeWidth={2.4} fill="none" />))}
        <circle r={8} fill={INK} /><circle cx={-3} cy={-2} r={2} fill="#FFFFFF" /><circle cx={3} cy={-2} r={2} fill="#FFFFFF" />
      </g>
    </g>
  );
};

/** the magnifying glass (Honest's right hand, hand-local coordinates; the lens is at (0, -lensOff)) */
export const MAG_LENS = {off: 120, r: 70};
export const MagnifierProp: React.FC = () => (
  <g>
    <rect x={-10} y={-50} width={20} height={70} rx={8} fill="#8D5A3C" stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={-MAG_LENS.off} r={MAG_LENS.r} fill="none" stroke={INK} strokeWidth={22} />
    <circle cx={0} cy={-MAG_LENS.off} r={MAG_LENS.r} fill="none" stroke="#C9A227" strokeWidth={12} />
  </g>
);

/** Honest's hands on his controller, close: thumbs mashing, buttons flashing, sweat flying */
export const MashCU: React.FC<{t: number; intensity: number}> = ({t, intensity}) => {
  const k = intensity;
  const step = Math.floor(t * 16);
  const btn = [{x: 150, y: -40, c: '#EF6B55'}, {x: 210, y: 10, c: '#1CA7A0'}, {x: 90, y: 10, c: '#FFC744'}, {x: 150, y: 60, c: '#4F7CC9'}];
  const hitB = btn[Math.floor(hash(step) * 4)];
  const thumbR = {x: lerp(150, hitB.x, 0.9) + Math.sin(t * 50) * 6 * k, y: hitB.y + Math.cos(t * 43) * 5 * k - 10 * (step % 2) * k};
  const stickA = Math.sin(t * 23) * 0.9;
  const thumbL = {x: -150 + Math.cos(t * 23) * 26 * k, y: -10 + stickA * 22 * k};
  const skin = '#C98B5E';
  const shake = {x: Math.sin(t * 71) * 8 * k, y: Math.cos(t * 59) * 6 * k};
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#4F9A6B" />
      <rect x={0} y={0} width={1080} height={1920} fill="url(#mash-shade)" />
      <defs>
        <radialGradient id="mash-shade" cx="50%" cy="45%" r="70%"><stop offset="0" stopColor="#5FB07C" /><stop offset="1" stopColor="#2F6B47" /></radialGradient>
      </defs>
      {/* motion lines */}
      {Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + step * 0.4;
        return <line key={i} x1={540 + Math.cos(a) * 460} y1={980 + Math.sin(a) * 560} x2={540 + Math.cos(a) * 560} y2={980 + Math.sin(a) * 680} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.35 * k} />;
      })}
      <g transform={`translate(${540 + shake.x} ${980 + shake.y}) scale(1.9)`}>
        {/* forearms (green sleeves) coming up from below, into the hands */}
        {[-1, 1].map((sd) => (
          <g key={`arm${sd}`}>
            <path d={`M ${sd * 330} 520 L ${sd * 215} 110`} stroke={INK} strokeWidth={128} strokeLinecap="round" />
            <path d={`M ${sd * 330} 520 L ${sd * 215} 110`} stroke={skin} strokeWidth={112} strokeLinecap="round" />
            <path d={`M ${sd * 360} 640 L ${sd * 300} 400`} stroke={INK} strokeWidth={150} strokeLinecap="butt" />
            <path d={`M ${sd * 360} 640 L ${sd * 300} 400`} stroke="#4F9A6B" strokeWidth={134} strokeLinecap="butt" />
          </g>
        ))}
        {/* fingers wrapped under the grips */}
        {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * 205} cy={95} rx={78} ry={60} fill={skin} stroke={INK} strokeWidth={6} />)}
        {[-1, 1].map((sd) => [0, 1, 2].map((k) => <path key={`f${sd}${k}`} d={`M ${sd * (150 + k * 34)} 120 q ${sd * 10} 26 ${sd * 30} 18`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />))}
        <path d="M -250 -50 Q -246 -110 -150 -110 L 150 -110 Q 246 -110 250 -50 L 280 70 Q 290 140 220 140 Q 170 140 140 80 L -140 80 Q -170 140 -220 140 Q -290 140 -280 70 Z" fill="#2B2B33" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -200 -80 Q -150 -98 -60 -98" fill="none" stroke="#55606E" strokeWidth={10} strokeLinecap="round" />
        <circle cx={-150} cy={-10} r={40} fill="#1B1D24" stroke={INK} strokeWidth={6} />
        <circle cx={-150 + stickA * 12} cy={-10 + Math.cos(t * 23) * 10} r={26} fill="#55606E" stroke={INK} strokeWidth={5} />
        {btn.map((b, i) => {
          const pressed = b === hitB;
          return <circle key={i} cx={b.x} cy={b.y + (pressed ? 3 : 0)} r={24} fill={b.c} stroke={INK} strokeWidth={5} opacity={pressed ? 1 : 0.85} />;
        })}
        <circle cx={hitB.x} cy={hitB.y} r={40 + (t * 16 % 1) * 30} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={(1 - (t * 16 % 1)) * k} />
        {/* thumbs */}
        <ellipse cx={thumbL.x} cy={thumbL.y} rx={40} ry={52} fill={skin} stroke={INK} strokeWidth={7} transform={`rotate(-25 ${thumbL.x} ${thumbL.y})`} />
        <ellipse cx={thumbR.x} cy={thumbR.y} rx={40} ry={52} fill={skin} stroke={INK} strokeWidth={7} transform={`rotate(25 ${thumbR.x} ${thumbR.y})`} />
        <path d={`M ${thumbR.x - 12} ${thumbR.y - 30} q 12 -8 22 2`} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.6} />
      </g>
      {/* sweat drops flying off */}
      {Array.from({length: 6}).map((_, i) => {
        const ph = (t * 1.6 + i / 6) % 1;
        const x = 540 + (hash(i) - 0.5) * 900 + ph * (hash(i + 3) - 0.5) * 200, y = 260 + ph * 900;
        return <path key={i} d={`M ${x} ${y} q 12 20 0 30 q -12 -10 0 -30 Z`} fill="#9EE7FF" stroke={INK} strokeWidth={4} opacity={k * (1 - ph)} />;
      })}
    </g>
  );
};

/** paint bursting out of the screen toward the lens: covers the frame by `full`, then slides/drips away */
export const PaintBurst: React.FC<{t: number; t0: number; full: number; off: number}> = ({t, t0, full, off}) => {
  if (t < t0) return null;
  const grow = clamp((t - t0) / (full - t0));
  const leave = clamp((t - full - 0.02) / (off - full - 0.02));
  const blobs = Array.from({length: 9}).map((_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const d = 160 + hash(i) * 220;
    const r0 = 120 + hash(i + 11) * 160;
    return {x: 540 + Math.cos(a) * d * (1 - 0.6 * grow), y: 900 + Math.sin(a) * d * 1.4 * (1 - 0.6 * grow), r: r0 * (0.2 + 3.4 * Math.pow(grow, 1.4)), seed: i};
  });
  const dy = Math.pow(leave, 1.6) * 2400;
  const blob = (x: number, y: number, r: number, seed: number) => {
    const ps: P[] = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const rr = r * (k % 2 ? 0.78 : 1) * (0.85 + 0.3 * hash(seed * 7 + k));
      ps.push({x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr});
    }
    return smoothPath(ps);
  };
  return (
    <g transform={`translate(0 ${dy})`}>
      {blobs.map((b) => <path key={b.seed} d={blob(b.x, b.y, b.r, b.seed)} fill="#FF8A3D" stroke={INK} strokeWidth={8} />)}
      {grow > 0.6 && <rect x={-100} y={-200} width={1280} height={2300} fill="#FF8A3D" opacity={clamp((grow - 0.6) / 0.3)} />}
      {/* drip edge on top when it slides away */}
      {leave > 0 && <path d={`M -20 -40 ${Array.from({length: 12}).map((_, i) => `Q ${i * 95 + 45} ${-40 - 60 - hash(i) * 80} ${(i + 1) * 95} -40`).join(' ')} L 1100 -40 L 1100 0 L -20 0 Z`} fill="#FF8A3D" stroke={INK} strokeWidth={8} />}
      {blobs.slice(0, 5).map((b) => <circle key={`h${b.seed}`} cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.3} r={b.r * 0.18} fill="#FFC744" opacity={0.6} />)}
    </g>
  );
};
