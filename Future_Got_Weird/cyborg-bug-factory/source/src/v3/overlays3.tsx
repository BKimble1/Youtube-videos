// V3 screen-space graphics in an industrial machine-vision style: a camera HUD (corner brackets, camera id, a true scale
// bar from the camera's px/mm, a centre mark), the 68-second step bar (the paper's seven steps, FIX -> RELEASE), the
// station console (a wireless test command, briefly), and a small "illustration" tag for the conceptual repeat.
import React from 'react';
import {clamp, ss} from '../lib';

const CYAN = '#5CF2FF';
const YEL = '#FFD84A';
const NAVY = 'rgba(10,22,32,0.88)';
const f1 = (n: number) => n.toFixed(1);
const NUN = '"Nunito Variable", sans-serif';

export const CamHUD: React.FC<{a: number; label: string; pxPerMm: number; mark?: {x: number; y: number} | null}> = ({a, label, pxPerMm, mark}) => {
  if (a <= 0.01) return null;
  const L = 70, m = 48, top = 170, bot = 1440;
  const mm = pxPerMm * 5 > 320 ? 1 : pxPerMm * 5 < 60 ? 20 : 5;
  const bar = Math.min(360, pxPerMm * mm);
  const br = [[m, top, 1, 1], [1080 - m, top, -1, 1], [m, bot, 1, -1], [1080 - m, bot, -1, -1]];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      {br.map(([x, y, sx, sy], i) => <path key={i} d={`M${x},${y + sy * L} L${x},${y} L${x + sx * L},${y}`} fill="none" stroke={CYAN} strokeWidth={5} opacity={0.75} />)}
      <g transform={`translate(${m + 18},${top + 30})`}>
        <circle cx={10} cy={-8} r={8} fill={CYAN} opacity={0.9} />
        <text x={28} y={0} fill={CYAN} style={{fontFamily: NUN, fontWeight: 900, fontSize: 28, letterSpacing: '0.08em'}}>{label}</text>
      </g>
      <g transform={`translate(${1080 - m - 18 - bar},${top + 26})`}>
        <path d={`M0,0 h${f1(bar)} M0,-10 v20 M${f1(bar)},-10 v20`} stroke={CYAN} strokeWidth={4} />
        <text x={f1(bar / 2)} y={-16} textAnchor="middle" fill={CYAN} style={{fontFamily: NUN, fontWeight: 900, fontSize: 26}}>{mm} mm</text>
      </g>
      {mark && <g opacity={0.8}><path d={`M${f1(mark.x - 34)},${f1(mark.y)} h22 M${f1(mark.x + 12)},${f1(mark.y)} h22 M${f1(mark.x)},${f1(mark.y - 34)} v22 M${f1(mark.x)},${f1(mark.y + 12)} v22`} stroke={YEL} strokeWidth={4} strokeLinecap="round" /><circle cx={f1(mark.x)} cy={f1(mark.y)} r={18} fill="none" stroke={YEL} strokeWidth={3} /></g>}
    </svg>
  );
};

const STEPS = ['FIX', 'SCAN', 'GRASP', 'IMPLANT', 'LATCH', 'LET GO', 'RELEASE'];
/** the 68 s cycle as a step bar: the count runs 0 -> 68 over [t0, t1]; the active step follows `step` (0..6) */
export const StepBar68: React.FC<{t: number; t0: number; t1: number; out: number; step: number}> = ({t, t0, t1, out, step}) => {
  const a = ss(t, t0 - 0.15, t0 + 0.02) * (1 - ss(t, out, out + 0.2));
  if (a <= 0) return null;
  const u = clamp((t - t0) / (t1 - t0));
  const n = Math.round(68 * u);
  const pop = t >= t1 ? 1 + 0.12 * Math.exp(-(t - t1) / 0.1) : 1;
  return (
    <div style={{position: 'absolute', left: 40, top: 190, width: 1000, opacity: a}}>
      <div style={{background: NAVY, border: `4px solid ${CYAN}`, borderRadius: 30, padding: '22px 30px 24px'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
          <span style={{fontFamily: '"Fredoka Variable", sans-serif', fontWeight: 600, fontSize: 168, lineHeight: 0.9, color: u >= 1 ? YEL : '#FFFFFF', transform: `scale(${pop.toFixed(3)})`, transformOrigin: 'left bottom', display: 'inline-block', fontVariantNumeric: 'tabular-nums', minWidth: 210}}>{n}</span>
          <span style={{fontFamily: NUN, fontWeight: 900, fontSize: 62, color: '#FFFFFF'}}>SECONDS</span>
          <span style={{fontFamily: NUN, fontWeight: 800, fontSize: 28, color: CYAN, marginLeft: 'auto', textAlign: 'right', lineHeight: 1.15}}>PER INSECT<br />SPED UP HERE</span>
        </div>
        <div style={{display: 'flex', gap: 8, marginTop: 18}}>
          {STEPS.map((s, i) => {
            const on = step >= i;
            const cur = Math.floor(step) === i && u < 1;
            return <div key={s} style={{flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, background: on ? (cur ? CYAN : 'rgba(92,242,255,0.35)') : 'rgba(255,255,255,0.08)', color: on ? (cur ? '#06202A' : '#FFFFFF') : 'rgba(255,255,255,0.45)', fontFamily: NUN, fontWeight: 900, fontSize: 22, letterSpacing: '0.03em'}}>{s}</div>;
          })}
        </div>
        <div style={{fontFamily: NUN, fontWeight: 800, fontSize: 26, color: 'rgba(255,255,255,0.75)', marginTop: 14}}>Fixing → release, measured in the study · by hand: ~15 min</div>
      </div>
    </div>
  );
};

/** the station console, briefly: a wireless test command and its pulse */
export const Console: React.FC<{t: number; t0: number; t1: number; pulseAt: number}> = ({t, t0, t1, pulseAt}) => {
  const a = ss(t, t0, t0 + 0.15) * (1 - ss(t, t1 - 0.15, t1));
  if (a <= 0) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i * 7;
    const tt = t - (60 - i) * 0.012;
    const on = tt > pulseAt && tt < pulseAt + 0.12;
    pts.push(`${x},${on ? 8 : 46}`);
  }
  return (
    <div style={{position: 'absolute', left: 40, top: 190, opacity: a, transform: `translateY(${f1((1 - a) * -20)}px)`}}>
      <div style={{background: NAVY, border: `4px solid ${CYAN}`, borderRadius: 24, padding: '16px 22px', width: 470}}>
        <div style={{fontFamily: NUN, fontWeight: 900, fontSize: 28, color: CYAN, letterSpacing: '0.06em'}}>STATION CONSOLE · WIRELESS TEST</div>
        <svg width={430} height={60} style={{display: 'block', marginTop: 8}}><polyline points={pts.join(' ')} fill="none" stroke={CYAN} strokeWidth={5} strokeLinejoin="round" /></svg>
        <div style={{fontFamily: NUN, fontWeight: 800, fontSize: 24, color: '#FFFFFF', opacity: 0.85}}>pulse → electrodes → a nudge to turn</div>
      </div>
    </div>
  );
};

export const ConceptTag: React.FC<{a: number; text: string; y?: number}> = ({a, text, y = 1300}) => {
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: y, textAlign: 'center', opacity: a}}>
      <span style={{display: 'inline-block', padding: '10px 22px', borderRadius: 16, background: NAVY, border: `3px dashed ${CYAN}`, fontFamily: NUN, fontWeight: 900, fontSize: 28, color: CYAN, letterSpacing: '0.04em'}}>{text}</span>
    </div>
  );
};
