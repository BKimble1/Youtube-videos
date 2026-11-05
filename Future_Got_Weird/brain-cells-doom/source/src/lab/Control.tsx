// The control software on the middle monitor, in UI units (1600 x 1000 over the 40 x 25 cm screen). It shows the
// loop as three plain panels: ENCODE (game state -> a stimulation pattern on the encoding electrodes), RECORDED (spikes
// from the decoder's electrode groups) and DECODE (spike counts -> one allowed command: MOVE, TURN or FIRE).
// Every value is computed from the same activity and game state the rest of the film draws.
import React from 'react';
import {mix} from '../color';
import {GROUPS, nearElectrode, spikes, stimOn, electrode, recorded} from '../micro/culture';
import {gameState} from '../game/script';
import {cmdLevel, CmdKind} from '../story';

export const MONO = '"JetBrains Mono", monospace';
const SANS = '"Nunito Variable", "Nunito", sans-serif';
export const UI_CY = '#46D2FF', UI_AM = '#FFB23F', UI_GR = '#53E0A1';
const ROWS: {c: number; g: 'move' | 'turn' | 'fire'}[] = [
  ...GROUPS.move.map((c) => ({c, g: 'move' as const})),
  ...GROUPS.turn.map((c) => ({c, g: 'turn' as const})),
  ...GROUPS.fire.map((c) => ({c, g: 'fire' as const})),
];
const GCOL = {move: '#7FE3B5', turn: '#B79CFF', fire: '#FF8A6B'};

const bearing = (t: number) => {
  const s = gameState(t);
  let best: {b: number; d: number} | null = null;
  for (const e of s.enemies) {
    if (e.pose.startsWith('die')) continue;
    const d = Math.hypot(e.x - s.x, e.y - s.y);
    let b = Math.atan2(e.y - s.y, e.x - s.x) - s.a;
    while (b > Math.PI) b -= 2 * Math.PI;
    while (b < -Math.PI) b += 2 * Math.PI;
    if (!best || d < best.d) best = {b, d};
  }
  return best;
};

export const ControlUI: React.FC<{t: number}> = ({t}) => {
  const be = bearing(t);
  const side = !be ? 'NONE' : Math.abs(be.b) > Math.PI / 3 ? (be.b < 0 ? 'BEHIND L' : 'BEHIND R') : be.b < -0.2 ? 'LEFT' : be.b > 0.2 ? 'RIGHT' : 'AHEAD';
  const enc = GROUPS.enc;
  const card = (x: number, w: number, title: string, sub: string, col: string) => (
    <g>
      <rect x={x} y={104} width={w} height={850} rx={22} fill="#0F2230" stroke="#21455A" strokeWidth={4} />
      <text x={x + 30} y={176} fill={col} fontFamily={SANS} fontWeight={900} fontSize={58} letterSpacing={2}>{title}</text>
      <text x={x + 30} y={226} fill="#8FB3C4" fontFamily={MONO} fontWeight={500} fontSize={30}>{sub}</text>
    </g>
  );
  return (
    <g>
      <rect x={0} y={0} width={1600} height={1000} fill="#08131B" />
      {Array.from({length: 17}, (_, i) => <line key={i} x1={i * 100} y1={0} x2={i * 100} y2={1000} stroke="#0E1F2A" strokeWidth={2} />)}
      {/* top bar */}
      <rect x={0} y={0} width={1600} height={84} fill="#0D1E29" />
      <circle cx={46} cy={42} r={13} fill={UI_GR} opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 3.1))} />
      <text x={74} y={56} fill="#D9EEF6" fontFamily={MONO} fontWeight={700} fontSize={38}>CL1 LINK · LIVE</text>
      <text x={1560} y={56} textAnchor="end" fill="#8FB3C4" fontFamily={MONO} fontWeight={500} fontSize={34}>loop 10 Hz · 37.0 °C</text>
      {card(28, 494, 'ENCODE', 'game state → stimulation', UI_CY)}
      {card(553, 494, 'RECORD', 'neurons → spikes', UI_AM)}
      {card(1078, 494, 'DECODE', 'spikes → command', '#FFFFFF')}
      {/* ENCODE: where the nearest enemy is, and the pattern sent to the encoding electrodes */}
      <g>
        <path d="M 135 430 A 140 140 0 0 1 415 430" fill="none" stroke="#2C566C" strokeWidth={6} />
        <line x1={275} y1={430} x2={275} y2={300} stroke="#2C566C" strokeWidth={3} strokeDasharray="10 10" />
        <path d="M 275 410 l -22 34 l 44 0 z" fill="#D9EEF6" />
        {be && Math.abs(be.b) < Math.PI / 2 && (
          <g>
            <circle cx={275 + Math.sin(be.b) * 140} cy={430 - Math.cos(be.b) * 140} r={22} fill="#FF6B4A" stroke="#FFD2C4" strokeWidth={4} />
            <line x1={275} y1={430} x2={275 + Math.sin(be.b) * 118} y2={430 - Math.cos(be.b) * 118} stroke="#FF6B4A" strokeWidth={4} opacity={0.6} />
          </g>
        )}
        <text x={58} y={512} fill="#8FB3C4" fontFamily={MONO} fontSize={30}>enemy</text>
        <text x={58} y={560} fill="#FFFFFF" fontFamily={MONO} fontWeight={700} fontSize={44}>{side}</text>
        <text x={492} y={560} textAnchor="end" fill="#D9EEF6" fontFamily={MONO} fontWeight={500} fontSize={36}>{be ? `${be.d.toFixed(1)} m` : '—'}</text>
        <text x={58} y={630} fill="#8FB3C4" fontFamily={MONO} fontSize={30}>stimulation pattern</text>
        {Array.from({length: 64}, (_, c) => {
          if ([0, 7, 56, 63].includes(c)) return null;
          const r = Math.floor(c / 8), col = c % 8;
          const on = enc.includes(c) ? stimOn(c, t) : 0;
          const isEnc = enc.includes(c);
          return (
            <g key={c}>
              <circle cx={118 + col * 44} cy={668 + r * 36} r={13} fill={on > 0.03 ? mix('#16445A', UI_CY, on) : isEnc ? '#16445A' : '#13242F'} stroke={isEnc ? '#2E7C9C' : '#1C3442'} strokeWidth={3} />
              {on > 0.3 && <circle cx={118 + col * 44} cy={668 + r * 36} r={22} fill="none" stroke={UI_CY} strokeWidth={3} opacity={on} />}
            </g>
          );
        })}
      </g>
      {/* RECORD: a spike raster of the decoder's electrode groups */}
      <g>
        {ROWS.map(({c, g}, i) => {
          const y = 286 + i * 64;
          const t0 = t - 2.4;
          const ticks: number[] = [];
          for (const n of nearElectrode(c)) for (const s of spikes(n, t0, t)) ticks.push(s);
          const lvl = Math.min(1, recorded(c, t) / 1.1);
          return (
            <g key={c}>
              <text x={576} y={y + 12} fill={GCOL[g]} fontFamily={MONO} fontWeight={700} fontSize={26}>{g.toUpperCase().slice(0, 4)}</text>
              <text x={650} y={y + 12} fill="#5F8496" fontFamily={MONO} fontSize={22}>{String(c).padStart(2, '0')}</text>
              <line x1={690} y1={y} x2={1020} y2={y} stroke="#183140" strokeWidth={3} />
              {ticks.map((s, k) => {
                const x = 690 + ((s - t0) / 2.4) * 330;
                const age = t - s;
                return <line key={k} x1={x} y1={y - 20} x2={x} y2={y + 20} stroke={age < 0.25 ? '#FFF1C9' : UI_AM} strokeWidth={age < 0.25 ? 6 : 4} opacity={0.5 + 0.5 * Math.exp(-age / 0.8)} />;
              })}
              <circle cx={1032} cy={y} r={8} fill={lvl > 0.05 ? mix('#3A2A12', UI_AM, lvl) : '#1C2C36'} />
            </g>
          );
        })}
        <text x={690} y={930} fill="#5F8496" fontFamily={MONO} fontSize={24}>−2.4 s</text>
        <text x={1020} y={930} textAnchor="end" fill="#5F8496" fontFamily={MONO} fontSize={24}>now</text>
      </g>
      {/* DECODE: three allowed commands */}
      {(['move', 'turn', 'fire'] as CmdKind[]).map((k, i) => {
        const y = 270 + i * 214;
        const v = cmdLevel(k, t);
        // spike count over the group (what the decoder weighs)
        const grp = k === 'move' ? GROUPS.move : k === 'turn' ? GROUPS.turn : GROUPS.fire;
        let cnt = 0;
        for (const c of grp) cnt += recorded(c, t);
        const bar = Math.min(1, cnt / 2.2);
        const col = GCOL[k];
        return (
          <g key={k}>
            <rect x={1106} y={y} width={436} height={176} rx={20} fill={v > 0.02 ? mix('#13283A', col, v * 0.55) : '#13283A'} stroke={v > 0.02 ? mix('#2A4E66', '#FFFFFF', v) : '#2A4E66'} strokeWidth={v > 0.5 ? 8 : 4} />
            {v > 0.05 && <rect x={1096} y={y - 10} width={456} height={196} rx={28} fill="none" stroke={col} strokeWidth={6} opacity={v * 0.7} />}
            <text x={1140} y={y + 104} fill={v > 0.3 ? '#FFFFFF' : mix('#7C99A8', col, 0.35)} fontFamily={SANS} fontWeight={900} fontSize={92} letterSpacing={4}>{k.toUpperCase()}</text>
            <rect x={1140} y={y + 128} width={370} height={18} rx={9} fill="#0A1822" />
            <rect x={1140} y={y + 128} width={370 * bar} height={18} rx={9} fill={col} opacity={0.85} />
          </g>
        );
      })}
      <text x={1310} y={926} textAnchor="middle" fill="#8FB3C4" fontFamily={MONO} fontSize={26}>→ game input</text>
      <rect x={0} y={960} width={1600} height={40} fill="#0D1E29" />
      <text x={30} y={989} fill="#6E93A5" fontFamily={MONO} fontSize={25}>decoder + learning algorithm (PPO) run on this PC · neurons: CL1</text>
    </g>
  );
};
export {electrode};
