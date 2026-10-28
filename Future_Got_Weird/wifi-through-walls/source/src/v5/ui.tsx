// V5 sensing screens (Wi-Fi identification, the separate experiment). Big, few words, one change at a time: the received
// radio signal; a gait signature emerging from it; comparison with identities learned earlier; a highlighted match.
// The study's results are tiles of people. No face, no photo, no names: identities are numbers in a set learned
// beforehand. (CafeUI is the V4 full-frame version, no longer used by the film.)
import React from 'react';
import {clamp, f1, hash, ss, useUid, word} from '../lib';

const T_ = (w: string, n = 0) => word(w, n).start;
const PAL = ['#132D52', '#1E5FA0', '#2196B8', '#5FD3C4', '#F6D26B', '#F08A4B'];
const MONO = 'JetBrains Mono, monospace';
const SANS = '"Nunito Variable", "Nunito", system-ui, sans-serif';
/** a gait signature: a band of colour cells (time across, signal channels down) with the person's stride rhythm in
 *  it; deterministic per person (seed). reveal 0..1 draws it left to right. */
export const SigBand: React.FC<{x: number; y: number; w: number; h: number; seed: number; reveal?: number; cols?: number; rows?: number; dim?: number}> = ({x, y, w, h, seed, reveal = 1, cols = 36, rows = 6, dim = 1}) => (
  <g opacity={dim}>
    {Array.from({length: cols}, (_, i) => {
      if (i / cols >= reveal) return null;
      return Array.from({length: rows}, (_, j) => {
        const stride = Math.sin((i / cols) * Math.PI * 2 * (2.5 + (seed % 4) * 0.5) + j * (0.5 + (seed % 3) * 0.2) + seed);
        const v = 0.5 + 0.34 * stride + (hash(i * 7 + j, seed) - 0.5) * 0.35;
        return <rect key={`${i}-${j}`} x={f1(x + (i / cols) * w)} y={f1(y + (j / rows) * h)} width={f1(w / cols + 0.8)} height={f1(h / rows + 0.8)} fill={PAL[Math.max(0, Math.min(5, Math.round(v * 5)))]} />;
      });
    })}
  </g>
);
const Panel: React.FC<{x: number; y: number; w: number; h: number; title: string; a?: number; hi?: number; children?: React.ReactNode}> = ({x, y, w, h, title, a = 1, hi = 0, children}) => (
  <g opacity={a}>
    <rect x={x} y={y} width={w} height={h} rx={26} fill="#0D1B2C" stroke={hi > 0 ? '#7CFFB2' : '#23415E'} strokeWidth={hi > 0 ? 4 + 4 * hi : 3} />
    <text x={x + 34} y={y + 62} fontSize={38} fontFamily={SANS} fontWeight={900} fill="#9CC3DE" letterSpacing={1}>{title}</text>
    {children}
  </g>
);
const Bg: React.FC<{tint?: string}> = ({tint = '#071322'}) => {
  const u = useUid();
  return (
    <g>
      <defs>
        <radialGradient id={`${u}bg`} cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#0E2236" />
          <stop offset="1" stopColor={tint} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${u}bg)`} />
      {Array.from({length: 13}, (_, i) => <line key={`v${i}`} x1={i * 90} y1={0} x2={i * 90} y2={1920} stroke="#0F2740" strokeWidth={2} />)}
      {Array.from({length: 22}, (_, i) => <line key={`h${i}`} x1={0} y1={i * 90} x2={1080} y2={i * 90} stroke="#0F2740" strokeWidth={2} />)}
    </g>
  );
};

// ------------------------------------------------------------------ the café's analysis screen (full frame)
export const CafeUI: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const people = T_('people', 0), walking = T_('walking', 0), past = T_('past', 0);
  // 1: the incoming signal (a waterfall: time scrolls left, channels down); his passing writes a pattern into it
  const pass = 1;
  const cols = 44, rows = 8;
  const wf: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    const tt = t - (cols - 1 - i) * 0.03;
    const him = clamp(1 - Math.abs(tt - (t0 + 0.4)) / 0.45);
    for (let j = 0; j < rows; j++) {
      const stride = Math.sin(tt * 2 * Math.PI * 2.1 + j * 0.6 + 12);
      const v = 0.2 + 0.08 * hash(Math.floor(tt * 33) * 17 + j, 4) + him * (0.35 + 0.3 * stride);
      wf.push(<rect key={`${i}-${j}`} x={f1(80 + i * (920 / cols))} y={f1(290 + j * 26)} width={f1(920 / cols + 1)} height={27} fill={PAL[Math.max(0, Math.min(5, Math.round(v * 5)))]} />);
    }
  }
  // 2: the signature extracted from it
  const sig = ss(t, people - 0.15, walking + 0.05);
  // 3: comparison with learned examples
  const cmp = ss(t, walking, past + 0.1);
  const match = ss(t, past + 0.1, past + 0.25);
  const rowsL = [{id: '#07', seed: 7, s: 0.31}, {id: '#12', seed: 12, s: 0.93}, {id: '#31', seed: 31, s: 0.44}, {id: '#45', seed: 45, s: 0.27}];
  const scan = clamp((t - walking) / (past - walking + 0.1)) * 3.2;
  return (
    <g>
      <Bg />
      <Panel x={50} y={170} w={980} h={420} title="INCOMING SIGNAL" a={pass}>
        {wf}
        <rect x={80} y={290} width={920} height={208} fill="none" stroke="#23415E" strokeWidth={3} />
        <text x={1000} y={560} textAnchor="end" fontSize={30} fontFamily={MONO} fill="#5F8AA8">time →</text>
      </Panel>
      <Panel x={50} y={630} w={980} h={250} title="SIGNATURE" a={ss(t, people - 0.3, people)}>
        <SigBand x={84} y={715} w={912} h={130} seed={12} reveal={sig} cols={44} />
      </Panel>
      <Panel x={50} y={920} w={980} h={470} title="LEARNED EXAMPLES" a={ss(t, walking - 0.2, walking + 0.1)}>
        {rowsL.map((r, i) => {
          const y = 1010 + i * 90;
          const hit = r.id === '#12';
          const bar = clamp(scan - i * 0.7) * r.s;
          const hl = hit ? match : 0;
          return (
            <g key={r.id}>
              {hl > 0 && <rect x={70} y={y - 12} width={940} height={84} rx={16} fill="#13432F" opacity={hl} stroke="#7CFFB2" strokeWidth={4} />}
              <text x={96} y={y + 46} fontSize={40} fontFamily={MONO} fontWeight={700} fill={hl > 0.5 ? '#7CFFB2' : '#DDE8EF'}>{r.id}</text>
              <SigBand x={210} y={y} w={430} h={60} seed={r.seed} cols={30} rows={4} dim={0.9} />
              <rect x={680} y={y + 18} width={300} height={24} rx={12} fill="#16304A" />
              <rect x={680} y={y + 18} width={f1(300 * bar)} height={24} rx={12} fill={hit ? '#7CFFB2' : '#4E7A9A'} />
            </g>
          );
        })}
        {match > 0 && (
          <g opacity={match}>
            {/* on #12's own row (the second), over the end of its full similarity bar */}
            <rect x={780} y={1099} width={210} height={62} rx={31} fill="#7CFFB2" stroke="#08261A" strokeWidth={3} />
            <text x={885} y={1143} textAnchor="middle" fontSize={40} fontFamily={SANS} fontWeight={900} fill="#08261A">MATCH</text>
          </g>
        )}
      </Panel>
    </g>
  );
};


/** one participant in the results grid: a small figure in their own colours (him: red spiky hair, striped shirt;
 *  the three corridor walkers keep theirs), so the tiles read as people, not data cells */
const SKINS = ['#F3CDB0', '#D9A07C', '#A8714F', '#7A4B32', '#F1C7A5', '#8D5A3B'];
const HAIRS = ['#1C1A1A', '#6B4226', '#E3BC63', '#B8B8B8', '#2B2B2B', '#9C4A2A'];
const SHIRTS = ['#2E8F8A', '#E07A5F', '#7C6BD6', '#3D7DC9', '#C94F6D', '#5FA35F', '#F2B134', '#8C8C99'];
const KNOWN: Record<number, {skin: string; hair: string; shirt: string; pants: string; him?: boolean}> = {
  12: {skin: '#F6CBA8', hair: '#D9442E', shirt: '#FFFFFF', pants: '#2D3E66', him: true},
  3: {skin: '#7A4B32', hair: '#1C1A1A', shirt: '#2E8F8A', pants: '#55606B'},
  23: {skin: '#D9A07C', hair: '#B8B8B8', shirt: '#E07A5F', pants: '#4A4A55'},
  27: {skin: '#F3CDB0', hair: '#E3BC63', shirt: '#F2B134', pants: '#3D5A80'},
};
export const PersonGlyph: React.FC<{x: number; y: number; w: number; h: number; n: number}> = ({x, y, w, h, n}) => {
  const c = KNOWN[n] ?? {skin: SKINS[Math.floor(hash(n, 11) * 6)], hair: HAIRS[Math.floor(hash(n, 12) * 6)], shirt: SHIRTS[Math.floor(hash(n, 13) * 8)], pants: hash(n, 14) > 0.5 ? '#2F3B52' : '#4A4A55'};
  const cx = x + w / 2, hr = h * 0.11, hy = y + h * 0.27;
  const st = (hash(n, 15) - 0.5) * 0.16 * w;
  const lw = Math.max(1.5, w * 0.075);
  return (
    <g>
      <line x1={f1(cx - w * 0.04)} y1={f1(y + h * 0.66)} x2={f1(cx - w * 0.07 - st)} y2={f1(y + h * 0.9)} stroke={c.pants} strokeWidth={f1(lw)} strokeLinecap="round" />
      <line x1={f1(cx + w * 0.04)} y1={f1(y + h * 0.66)} x2={f1(cx + w * 0.07 + st)} y2={f1(y + h * 0.9)} stroke={c.pants} strokeWidth={f1(lw)} strokeLinecap="round" />
      <rect x={f1(cx - w * 0.15)} y={f1(y + h * 0.4)} width={f1(w * 0.3)} height={f1(h * 0.29)} rx={f1(w * 0.07)} fill={c.shirt} />
      {c.him && [0.48, 0.57].map((v) => <rect key={v} x={f1(cx - w * 0.15)} y={f1(y + h * v)} width={f1(w * 0.3)} height={f1(h * 0.035)} fill="#F4C431" />)}
      <circle cx={f1(cx)} cy={f1(hy)} r={f1(hr)} fill={c.skin} />
      {c.him ? (
        <path d={`M${f1(cx - hr * 1.1)},${f1(hy - hr * 0.1)} L${f1(cx - hr * 0.9)},${f1(hy - hr * 1.6)} L${f1(cx - hr * 0.35)},${f1(hy - hr * 0.95)} L${f1(cx)},${f1(hy - hr * 1.75)} L${f1(cx + hr * 0.35)},${f1(hy - hr * 0.95)} L${f1(cx + hr * 0.95)},${f1(hy - hr * 1.6)} L${f1(cx + hr * 1.1)},${f1(hy - hr * 0.1)} Z`} fill={c.hair} />
      ) : (
        <path d={`M${f1(cx - hr * 1.05)},${f1(hy)} A${f1(hr * 1.05)},${f1(hr * 1.05)} 0 0 1 ${f1(cx + hr * 1.05)},${f1(hy)} L${f1(cx + hr * 0.7)},${f1(hy - hr * 0.35)} L${f1(cx - hr * 0.7)},${f1(hy - hr * 0.35)} Z`} fill={c.hair} />
      )}
    </g>
  );
};

// ------------------------------------------------------------------ the study's matching screen (full frame)
const MISSES = [37, 104, 151, 183];
export const StudyUI: React.FC<{t: number; t0: number; tEnd: number}> = ({t, t0, tEnd}) => {
  const ident = T_('identified'), almost = T_('almost'), correctly = T_('correctly');
  // phase 1: one new walk against the set recorded earlier; phase 2: the whole set
  const grid = ss(t, almost - 0.12, almost + 0.08);
  const refs = [{id: '#03', seed: 3}, {id: '#12', seed: 12}, {id: '#27', seed: 27}, {id: '#91', seed: 91}, {id: '#140', seed: 140}];
  const scan = clamp((t - (t0 + 0.08)) / 0.35) * 5;
  const hit = ss(t, ident + 0.02, ident + 0.14);
  const out = ss(t, tEnd - 0.3, tEnd);
  // grid geometry
  const cols = 14, rowsG = 15; // 210 places, 197 used
  const gx = 70, gy = 300, gw = 940, gh = 1040;
  const cw = gw / cols, ch = gh / rowsG;
  const sweep = (n: number) => ss(t, almost + 0.15 + ((n * 37) % 197) * 0.0068, almost + 0.25 + ((n * 37) % 197) * 0.0068);
  // the zoom into #12's cell at the end (it becomes the café laptop's record)
  const z12 = 12;
  const zc = {x: gx + (z12 % cols) * cw + cw / 2, y: gy + Math.floor(z12 / cols) * ch + ch / 2};
  const zoom = 1 + 9 * out * out;
  return (
    <g>
      <Bg />
      <g transform={`translate(${f1(zc.x + (540 - zc.x) * out)} ${f1(zc.y + (900 - zc.y) * out)}) scale(${zoom.toFixed(3)}) translate(${f1(-zc.x)} ${f1(-zc.y)})`}>
        <text opacity={1 - clamp(out * 4)} x={540} y={170} textAnchor="middle" fontSize={64} fontFamily={SANS} fontWeight={900} fill="#E8F1F6">{grid > 0.5 ? '197 PARTICIPANTS' : 'NEW WALK'}</text>
        <text opacity={1 - clamp(out * 4)} x={540} y={232} textAnchor="middle" fontSize={34} fontFamily={SANS} fontWeight={800} fill="#8FB4CF">{grid > 0.5 ? 'each compared with identities learned earlier' : 'compared with identities learned earlier'}</text>
        {/* phase 1 */}
        <g opacity={1 - grid}>
          <rect x={70} y={300} width={940} height={170} rx={24} fill="#0D1B2C" stroke="#FFD24A" strokeWidth={4} />
          <SigBand x={100} y={330} w={880} h={110} seed={27} cols={44} />
          {refs.map((r, i) => {
            const y = 560 + i * 150;
            const on = r.id === '#27';
            const bar = clamp(scan - i) * (on ? 0.95 : 0.25 + 0.2 * hash(i, 5));
            return (
              <g key={r.id}>
                <rect x={70} y={y} width={940} height={120} rx={20} fill={on && hit > 0 ? '#13432F' : '#0D1B2C'} stroke={on && hit > 0 ? '#7CFFB2' : '#23415E'} strokeWidth={on ? 3 + 5 * hit : 3} />
                <text x={100} y={y + 74} fontSize={42} fontFamily={MONO} fontWeight={700} fill={on && hit > 0.5 ? '#7CFFB2' : '#DDE8EF'}>{r.id}</text>
                <SigBand x={250} y={y + 25} w={460} h={70} seed={r.seed} cols={30} rows={4} />
                <rect x={750} y={y + 48} width={230} height={26} rx={13} fill="#16304A" />
                <rect x={750} y={y + 48} width={f1(230 * bar)} height={26} rx={13} fill={on ? '#7CFFB2' : '#4E7A9A'} />
              </g>
            );
          })}
          {/* the link from the new walk to its match */}
          {hit > 0 && <path d={`M540,470 C540,520 880,${560 + 2 * 150 - 40} 860,${560 + 2 * 150}`} fill="none" stroke="#7CFFB2" strokeWidth={6} strokeDasharray="14 10" opacity={hit} />}
        </g>
        {/* phase 2: the set */}
        <g opacity={grid}>
          {Array.from({length: 197}, (_, n) => {
            const cx = gx + (n % cols) * cw, cy = gy + Math.floor(n / cols) * ch;
            const m = sweep(n);
            const miss = MISSES.includes(n);
            return (
              <g key={n}>
                <rect x={f1(cx + cw * 0.05)} y={f1(cy + ch * 0.06)} width={f1(cw * 0.9)} height={f1(ch * 0.88)} rx={f1(cw * 0.12)} fill="#1A3550" />
                {m > 0 && <rect x={f1(cx + cw * 0.05)} y={f1(cy + ch * 0.06)} width={f1(cw * 0.9)} height={f1(ch * 0.88)} rx={f1(cw * 0.12)} fill={miss ? '#C98A22' : '#2A9E6C'} opacity={m} />}
                <PersonGlyph x={cx + cw * 0.05} y={cy + ch * 0.06} w={cw * 0.9} h={ch * 0.88} n={n} />
                {n === z12 && <rect x={f1(cx + cw * 0.02)} y={f1(cy + ch * 0.04)} width={f1(cw * 0.96)} height={f1(ch * 0.92)} rx={f1(cw * 0.12)} fill="none" stroke="#FFD24A" strokeWidth={3} opacity={ss(t, correctly, correctly + 0.3)} />}
              </g>
            );
          })}
          <text x={1010} y={1395} textAnchor="end" fontSize={28} fontFamily={MONO} fill="#5F8AA8">ILLUSTRATION · NOT STUDY DATA</text>
        </g>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the café laptop's screen (in the scene)
export const LaptopMatch: React.FC<{r: {x: number; y: number; w: number; h: number}; t: number; t0: number}> = ({r, t, t0}) => {
  const live = ss(t, t0 - 0.6, t0 + 0.2);
  const link = ss(t, t0 + 0.15, t0 + 0.4);
  const fs = r.h * 0.085;
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.14)} fontSize={f1(fs)} fontFamily={MONO} fill="#8FB4CF">LIVE</text>
      <SigBand x={r.x + r.w * 0.05} y={r.y + r.h * 0.19} w={r.w * 0.62} h={r.h * 0.2} seed={12} reveal={live} cols={30} rows={4} />
      <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.56)} fontSize={f1(fs)} fontFamily={MONO} fill="#8FB4CF">STORED #12</text>
      <SigBand x={r.x + r.w * 0.05} y={r.y + r.h * 0.61} w={r.w * 0.62} h={r.h * 0.2} seed={12} cols={30} rows={4} />
      {link > 0 && (
        <g opacity={link}>
          <path d={`M${f1(r.x + r.w * 0.7)},${f1(r.y + r.h * 0.29)} C${f1(r.x + r.w * 0.82)},${f1(r.y + r.h * 0.29)} ${f1(r.x + r.w * 0.82)},${f1(r.y + r.h * 0.71)} ${f1(r.x + r.w * 0.7)},${f1(r.y + r.h * 0.71)}`} fill="none" stroke="#7CFFB2" strokeWidth={f1(r.h * 0.025)} />
          <circle cx={f1(r.x + r.w * 0.88)} cy={f1(r.y + r.h * 0.5)} r={f1(r.h * 0.11)} fill="#7CFFB2" />
          <path d={`M${f1(r.x + r.w * 0.845)},${f1(r.y + r.h * 0.5)} l${f1(r.h * 0.04)},${f1(r.h * 0.045)} l${f1(r.h * 0.08)},${f1(-r.h * 0.09)}`} fill="none" stroke="#08261A" strokeWidth={f1(r.h * 0.03)} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ V5: the café receiver's laptop (lower half of the split screen)
/** the split screen's divide: the upper half shows him passing the window (from behind the receiver's antennas), the
 *  lower half is the receiver's laptop, seen front-on (screen above, keyboard deck below the caption) */
export const SPLIT_Y = 860;
/** the received signal is a waterfall (time scrolls left, channels down); every heel strike of his writes a bright
 *  stripe into it, so the pattern on the screen is visibly his walk. Then: the signature extracted from it, compared
 *  with signatures learned earlier, a match on #12. */
export const CafeSplitUI: React.FC<{t: number; steps: number[]}> = ({t, steps}) => {
  const people = T_('people', 0), walking = T_('walking', 0), past = T_('past', 0);
  const S = {x: 70, y: SPLIT_Y + 62, w: 940, h: 560};
  const cols = 52, rows = 7, wx = S.x + 30, wy = S.y + 112, ww = S.w - 60, wh = 112;
  const wf: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    const tt = t - (cols - 1 - i) * 0.045;
    const hit = steps.reduce((a, ts) => a + (tt >= ts ? Math.exp(-(tt - ts) / 0.09) : 0), 0);
    for (let j = 0; j < rows; j++) {
      const v = 0.18 + 0.1 * hash(Math.floor(tt * 22) * 17 + j, 4) + Math.min(0.75, hit * (0.55 + 0.25 * Math.sin(j * 1.3 + 2)));
      wf.push(<rect key={`${i}-${j}`} x={f1(wx + i * (ww / cols))} y={f1(wy + j * (wh / rows))} width={f1(ww / cols + 1)} height={f1(wh / rows + 1)} fill={PAL[Math.max(0, Math.min(5, Math.round(v * 5)))]} />);
    }
  }
  const sig = ss(t, people - 0.2, walking + 0.1);
  const match = ss(t, past + 0.1, past + 0.25);
  const scan = clamp((t - walking) / (past - walking + 0.1)) * 3;
  const rowsL = [{id: '#07', seed: 7, s: 0.34}, {id: '#12', seed: 12, s: 0.94}, {id: '#31', seed: 31, s: 0.41}];
  const lab = (x: number, y: number, s: string, a = 1) => <text x={x} y={y} fontSize={34} fontFamily={SANS} fontWeight={900} fill="#9CC3DE" letterSpacing={1} opacity={a}>{s}</text>;
  return (
    <g>
      {/* the laptop: lid (bezel and screen) and, under the caption, the keyboard deck */}
      <rect x={0} y={SPLIT_Y} width={1080} height={1920 - SPLIT_Y} fill="#2B2F35" />
      <rect x={S.x - 26} y={S.y - 26} width={S.w + 52} height={S.h + 52} rx={30} fill="#15191E" />
      <rect x={S.x} y={S.y} width={S.w} height={S.h} rx={8} fill="#0B1522" />
      <rect x={20} y={S.y + S.h + 40} width={1040} height={1920 - (S.y + S.h + 40)} rx={26} fill="#3A4048" />
      {Array.from({length: 4}, (_, r) => Array.from({length: 12}, (_, k) => (
        <rect key={`k${r}-${k}`} x={58 + k * 81} y={S.y + S.h + 150 + r * 62} width={70} height={52} rx={9} fill="#262A30" />
      )))}
      <circle cx={S.x + 36} cy={S.y + 34} r={9} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : '#B33'} />
      <text x={S.x + 56} y={S.y + 45} fontSize={30} fontFamily={MONO} fill="#8FB4CF">RECEIVER · LIVE</text>
      {lab(wx, wy - 12, 'RECEIVED SIGNAL')}
      {wf}
      <rect x={wx} y={wy} width={ww} height={wh} fill="none" stroke="#23415E" strokeWidth={3} />
      {lab(wx, wy + wh + 50, 'HIS SIGNATURE', ss(t, people - 0.35, people - 0.1))}
      <SigBand x={wx} y={wy + wh + 64} w={ww} h={56} seed={12} reveal={sig} cols={52} rows={4} />
      {rowsL.map((r, i) => {
        const y = wy + wh + 150 + i * 60;
        const hit = r.id === '#12';
        const bar = clamp(scan - i * 0.75) * r.s;
        const hl = hit ? match : 0;
        return (
          <g key={r.id} opacity={ss(t, walking - 0.25, walking + 0.05)}>
            {hl > 0 && <rect x={wx - 10} y={y - 8} width={ww + 20} height={60} rx={12} fill="#13432F" opacity={hl} stroke="#7CFFB2" strokeWidth={4} />}
            <text x={wx} y={y + 36} fontSize={34} fontFamily={MONO} fontWeight={700} fill={hl > 0.5 ? '#7CFFB2' : '#DDE8EF'}>{r.id}</text>
            <SigBand x={wx + 100} y={y + 2} w={420} h={42} seed={r.seed} cols={30} rows={3} dim={0.9} />
            <rect x={wx + 560} y={y + 12} width={240} height={20} rx={10} fill="#16304A" />
            <rect x={wx + 560} y={y + 12} width={f1(240 * bar)} height={20} rx={10} fill={hit ? '#7CFFB2' : '#4E7A9A'} />
            {hit && match > 0 && <g opacity={match}><rect x={wx + 812} y={y - 2} width={136} height={48} rx={24} fill="#7CFFB2" /><text x={wx + 880} y={y + 34} textAnchor="middle" fontSize={30} fontFamily={SANS} fontWeight={900} fill="#08261A">MATCH</text></g>}
          </g>
        );
      })}
      <text x={wx + ww} y={wy + wh + 50} textAnchor="end" fontSize={26} fontFamily={MONO} fill="#5F8AA8" opacity={ss(t, walking - 0.25, walking + 0.05)}>learned earlier</text>
    </g>
  );
};
