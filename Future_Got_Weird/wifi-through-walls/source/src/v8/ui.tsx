// V5-V7 sensing screens (Wi-Fi identification, the separate experiment). Big, few words, one change at a time: the received
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


/** a participant's stored record, drawn as a generic schematic avatar: a head and a body in one flat colour per
 *  participant. It is a label for a record, not an image: no face, hair or clothing (the radio recovers none of that) */
const HUES = ['#5B8DEF', '#E0745F', '#57B894', '#C27BD8', '#E5B84A', '#4FB3BF', '#8C9BB0', '#E58BB0'];
export const avatarColor = (n: number) => (n === 12 ? '#4FB3BF' : HUES[Math.floor(hash(n, 11) * HUES.length)]);
export const PersonGlyph: React.FC<{x: number; y: number; w: number; h: number; n: number}> = ({x, y, w, h, n}) => {
  const c = avatarColor(n);
  const cx = x + w / 2, hr = Math.min(w * 0.17, h * 0.12);
  return (
    <g>
      <circle cx={f1(cx)} cy={f1(y + h * 0.3)} r={f1(hr)} fill={c} />
      <path d={`M${f1(cx - w * 0.24)},${f1(y + h * 0.86)} L${f1(cx - w * 0.24)},${f1(y + h * 0.62)} Q${f1(cx - w * 0.24)},${f1(y + h * 0.46)} ${f1(cx)},${f1(y + h * 0.46)} Q${f1(cx + w * 0.24)},${f1(y + h * 0.46)} ${f1(cx + w * 0.24)},${f1(y + h * 0.62)} L${f1(cx + w * 0.24)},${f1(y + h * 0.86)} Z`} fill={c} />
    </g>
  );
};

// ------------------------------------------------------------------ the study's matching screen (full frame)
const MISSES = [104, 183];
export const StudyUI: React.FC<{t: number; t0: number; tEnd: number}> = ({t, t0, tEnd}) => {
  const ident = T_('identified'), almost = T_('almost'), correctly = T_('correctly');
  // phase 1: one new walk against the set recorded earlier; phase 2: the whole set
  const grid = ss(t, almost - 0.12, almost + 0.08);
  const refs = [{id: '#03', seed: 3}, {id: '#12', seed: 12}, {id: '#27', seed: 27}, {id: '#91', seed: 91}, {id: '#140', seed: 140}];
  const scan = clamp((t - (t0 + 0.08)) / 0.35) * 5;
  const hit = ss(t, ident + 0.02, ident + 0.14);
  // a slow push into his tile over the last 0.9 s (then a dissolve to him at the café)
  const out = ss(t, tEnd - 0.9, tEnd + 0.2);
  // grid geometry
  const cols = 14, rowsG = 15; // 210 places, 197 used
  const gx = 70, gy = 400, gw = 940, gh = 1000;
  const cw = gw / cols, ch = gh / rowsG;
  const sweep = (n: number) => ss(t, almost + 0.15 + ((n * 37) % 197) * 0.0068, almost + 0.25 + ((n * 37) % 197) * 0.0068);
  // the zoom into #12's cell at the end (it becomes the café laptop's record)
  const z12 = 12;
  const zc = {x: gx + (z12 % cols) * cw + cw / 2, y: gy + Math.floor(z12 / cols) * ch + ch / 2};
  const zoom = 1 + 3 * out;
  return (
    <g>
      <Bg />
      <g transform={`translate(${f1(zc.x + (540 - zc.x) * out)} ${f1(zc.y + (900 - zc.y) * out)}) scale(${zoom.toFixed(3)}) translate(${f1(-zc.x)} ${f1(-zc.y)})`}>
        {/* the first things to read: 197 participants, then (with the grid) ALMOST EVERYONE identified */}
        <g opacity={1 - clamp(out * 4)}>
          <text x={540} y={190} textAnchor="middle" fontSize={150} fontFamily={SANS} fontWeight={900} fill="#FFFFFF">197</text>
          <text x={540} y={258} textAnchor="middle" fontSize={56} fontFamily={SANS} fontWeight={900} fill="#BFD6E6" letterSpacing={4}>PARTICIPANTS</text>
          <g opacity={1 - grid}>
            <text x={540} y={330} textAnchor="middle" fontSize={40} fontFamily={SANS} fontWeight={800} fill="#8FB4CF">a new walk vs. records learned earlier</text>
          </g>
          <g opacity={ss(t, almost - 0.05, almost + 0.25)}>
            <rect x={110} y={282} width={860} height={92} rx={46} fill="#2A9E6C" />
            <text x={540} y={346} textAnchor="middle" fontSize={54} fontFamily={SANS} fontWeight={900} fill="#FFFFFF">ALMOST EVERYONE IDENTIFIED</text>
          </g>
        </g>
        {/* phase 1 */}
        <g opacity={1 - grid}>
          <rect x={70} y={370} width={940} height={170} rx={24} fill="#0D1B2C" stroke="#FFD24A" strokeWidth={4} />
          <SigBand x={100} y={400} w={880} h={110} seed={27} cols={44} />
          {refs.map((r, i) => {
            const y = 600 + i * 150;
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
          {hit > 0 && <path d={`M540,540 C540,580 880,${600 + 2 * 150 - 40} 860,${600 + 2 * 150}`} fill="none" stroke="#7CFFB2" strokeWidth={6} strokeDasharray="14 10" opacity={hit} />}
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
          <text x={540} y={1480} textAnchor="middle" fontSize={58} fontFamily={SANS} fontWeight={900} fill="#DCE7EE">SCHEMATIC ILLUSTRATION</text>
          <text x={540} y={1544} textAnchor="middle" fontSize={44} fontFamily={SANS} fontWeight={800} fill="#8FB4CF">not the study's per-person results</text>
        </g>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the café laptop's screen (in the scene)
/** the small laptop in the café scenes: few, big marks. `mode` 'match': his live pattern builds, a green outline links
 *  it to the stored #12 record; 'id': his identity held (the ending's WI-FI side) */
export const LaptopMatch: React.FC<{r: {x: number; y: number; w: number; h: number}; t: number; t0: number; mode?: 'match' | 'id'}> = ({r, t, t0, mode = 'match'}) => {
  const live = mode === 'id' ? 1 : ss(t, t0 - 0.6, t0 + 0.2);
  const link = mode === 'id' ? 1 : ss(t, t0 + 0.15, t0 + 0.4);
  const bx = r.x + r.w * 0.05, bw = r.w * 0.5;
  const card = {x: r.x + r.w * 0.6, y: r.y + r.h * 0.12, w: r.w * 0.35, h: r.h * 0.76};
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <SigBand x={bx} y={r.y + r.h * 0.14} w={bw} h={r.h * 0.3} seed={12} reveal={live} cols={20} rows={4} />
      <SigBand x={bx} y={r.y + r.h * 0.56} w={bw} h={r.h * 0.3} seed={12} cols={20} rows={4} />
      {link > 0 && <rect x={f1(bx - r.w * 0.015)} y={f1(r.y + r.h * 0.11)} width={f1(bw + r.w * 0.03)} height={f1(r.h * 0.78)} rx={f1(r.h * 0.03)} fill="none" stroke="#7CFFB2" strokeWidth={f1(r.h * 0.03)} opacity={link} />}
      <g opacity={link}>
        <rect x={f1(card.x)} y={f1(card.y)} width={f1(card.w)} height={f1(card.h)} rx={f1(r.h * 0.05)} fill="#13432F" stroke="#7CFFB2" strokeWidth={f1(r.h * 0.03)} />
        <PersonGlyph x={card.x} y={card.y - card.h * 0.04} w={card.w} h={card.h * 0.75} n={12} />
        <text x={f1(card.x + card.w / 2)} y={f1(card.y + card.h * 0.93)} textAnchor="middle" fontSize={f1(r.h * 0.2)} fontFamily={SANS} fontWeight={900} fill="#7CFFB2">#12</text>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ V8: the receiver's laptop, full width (below a split, or the return visit)
/** the split screen's divide (above: the street; below: the receiver's laptop) */
export const SPLIT_Y = 760;
const LapFrame: React.FC<{y0: number; t: number; live: string; children: React.ReactNode}> = ({y0, t, live, children}) => {
  const S = {x: 60, y: y0 + 54, w: 960, h: 640};
  return (
    <g>
      <rect x={0} y={y0} width={1080} height={1920 - y0} fill="#2B2F35" />
      <rect x={S.x - 24} y={S.y - 24} width={S.w + 48} height={S.h + 48} rx={30} fill="#15191E" />
      <rect x={S.x} y={S.y} width={S.w} height={S.h} rx={8} fill="#0B1522" />
      <rect x={20} y={S.y + S.h + 38} width={1040} height={1920 - (S.y + S.h + 38)} rx={26} fill="#3A4048" />
      {Array.from({length: 4}, (_, rr) => Array.from({length: 12}, (_, k) => (
        <rect key={`k${rr}-${k}`} x={58 + k * 81} y={S.y + S.h + 140 + rr * 62} width={70} height={52} rx={9} fill="#262A30" />
      )))}
      <circle cx={S.x + 34} cy={S.y + 36} r={10} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : '#B33'} />
      <text x={S.x + 56} y={S.y + 48} fontSize={32} fontFamily={MONO} fill="#8FB4CF">{live}</text>
      {children}
    </g>
  );
};
const Label: React.FC<{x: number; y: number; text: string; color?: string; size?: number; a?: number}> = ({x, y, text, color = '#DCE7EE', size = 46, a = 1}) => (
  <text x={x} y={y} fontSize={size} fontFamily={SANS} fontWeight={900} fill={color} opacity={a} letterSpacing={1}>{text}</text>
);
/** a stored record card: avatar, number and its signature */
const RecordCard: React.FC<{x: number; y: number; w: number; h: number; n: number; seed: number; on: number; dim?: number}> = ({x, y, w, h, n, seed, on, dim = 1}) => (
  <g opacity={dim}>
    <rect x={x} y={y} width={w} height={h} rx={20} fill={on > 0.5 ? '#13432F' : '#122236'} stroke={on > 0 ? '#7CFFB2' : '#2C4A66'} strokeWidth={4 + 6 * on} />
    <PersonGlyph x={x + 12} y={y + 4} w={h * 0.62} h={h * 0.88} n={n} />
    <text x={x + h * 0.62 + 26} y={y + h * 0.42} fontSize={h * 0.32} fontFamily={SANS} fontWeight={900} fill={on > 0.5 ? '#7CFFB2' : '#FFFFFF'}>#{String(n).padStart(2, '0')}</text>
    <SigBand x={x + h * 0.62 + 26} y={y + h * 0.56} w={w - h * 0.62 - 46} h={h * 0.3} seed={seed} cols={18} rows={3} />
  </g>
);
/** the received signal as a waterfall (time scrolls left, channels down); every heel strike writes a bright stripe */
const Waterfall: React.FC<{x: number; y: number; w: number; h: number; t: number; steps: number[]; reveal?: number}> = ({x, y, w, h, t, steps, reveal = 1}) => {
  const cols = 48, rows = 6;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    if (i / cols > reveal) continue;
    const tt = t - (cols - 1 - i) * 0.045;
    const hit = steps.reduce((a, ts) => a + (tt >= ts ? Math.exp(-(tt - ts) / 0.09) : 0), 0);
    for (let j = 0; j < rows; j++) {
      const v = 0.18 + 0.1 * hash(Math.floor(tt * 22) * 17 + j, 4) + Math.min(0.75, hit * (0.55 + 0.25 * Math.sin(j * 1.3 + 2)));
      out.push(<rect key={`${i}-${j}`} x={f1(x + i * (w / cols))} y={f1(y + j * (h / rows))} width={f1(w / cols + 1)} height={f1(h / rows + 1)} fill={PAL[Math.max(0, Math.min(5, Math.round(v * 5)))]} />);
    }
  }
  return <g>{out}<rect x={x} y={y} width={w} height={h} fill="none" stroke="#23415E" strokeWidth={3} /></g>;
};
/** the café experiment: STORED SAMPLES (records learned earlier) first, then the NEW SAMPLE arriving from his steps, then
 *  the comparison: the other records dim, #12 lights, MATCH: #12 */
export const CafeSplitUI: React.FC<{t: number; steps: number[]}> = ({t, steps}) => {
  const people = T_('people', 0), walking = T_('walking', 0), past = T_('past', 0);
  const y0 = SPLIT_Y, S = {x: 60, y: y0 + 54};
  const nw = ss(t, people - 0.35, people);
  const match = ss(t, past + 0.05, past + 0.22);
  const cmp = ss(t, walking + 0.1, past + 0.05);
  const recs = [{n: 7, seed: 7}, {n: 12, seed: 12}, {n: 31, seed: 31}];
  return (
    <LapFrame y0={y0} t={t} live="RECEIVER · LIVE">
      <Label x={S.x + 30} y={S.y + 118} text="STORED SAMPLES" />
      <text x={S.x + 930} y={S.y + 118} textAnchor="end" fontSize={30} fontFamily={SANS} fontWeight={800} fill="#8FB4CF">learned earlier</text>
      {recs.map((rc, i) => (
        <RecordCard key={rc.n} x={S.x + 30 + i * 306} y={S.y + 140} w={290} h={120} n={rc.n} seed={rc.seed} on={rc.n === 12 ? match : 0} dim={rc.n === 12 ? 1 : 1 - 0.65 * cmp} />
      ))}
      <Label x={S.x + 30} y={S.y + 340} text="NEW SAMPLE" a={0.4 + 0.6 * nw} />
      <Waterfall x={S.x + 30} y={S.y + 362} w={900} h={130} t={t} steps={steps} reveal={0.15 + 0.85 * nw} />
      <g opacity={match}>
        <rect x={S.x + 180} y={S.y + 516} width={600} height={100} rx={50} fill="#7CFFB2" />
        <text x={S.x + 480} y={S.y + 586} textAnchor="middle" fontSize={66} fontFamily={SANS} fontWeight={900} fill="#08261A">MATCH: #12</text>
      </g>
    </LapFrame>
  );
};
/** the return visit (hypothetical, as the narration says): his SAVED RECORD #12 is still there; a NEW SIGNAL arrives from
 *  his steps (from tNew); SAME ID: #12 (from tSame) */
export const ReturnUI: React.FC<{t: number; tNew: number; tSame: number; steps: number[]}> = ({t, tNew, tSame, steps}) => {
  const y0 = SPLIT_Y, S = {x: 60, y: y0 + 54};
  const phase = t < tNew ? 'saved' : 'recognize';
  const nw = ss(t, tNew, tSame - 0.1);
  const same = ss(t, tSame, tSame + 0.2);
  return (
    <LapFrame y0={y0} t={t} live="RECEIVER · LIVE">
      <Label x={S.x + 30} y={S.y + 118} text="SAVED RECORD" />
      <rect x={S.x + 700} y={S.y + 80} width={230} height={50} rx={25} fill="#2C4A66" />
      <text x={S.x + 815} y={S.y + 116} textAnchor="middle" fontSize={30} fontFamily={SANS} fontWeight={900} fill="#DCE7EE">KEPT</text>
      <RecordCard x={S.x + 30} y={S.y + 140} w={900} h={150} n={12} seed={12} on={same} />
      <Label x={S.x + 30} y={S.y + 360} text="NEW SIGNAL" a={phase === 'saved' ? 0.25 : 0.4 + 0.6 * nw} />
      {phase === 'recognize' && <Waterfall x={S.x + 30} y={S.y + 382} w={900} h={120} t={t} steps={steps} reveal={0.1 + 0.9 * nw} />}
      {phase === 'saved' && <rect x={S.x + 30} y={S.y + 382} width={900} height={120} fill="none" stroke="#23415E" strokeWidth={3} strokeDasharray="12 10" />}
      <g opacity={same}>
        <rect x={S.x + 120} y={S.y + 524} width={720} height={100} rx={50} fill="#7CFFB2" />
        <text x={S.x + 480} y={S.y + 594} textAnchor="middle" fontSize={64} fontFamily={SANS} fontWeight={900} fill="#08261A">SAME ID: #12</text>
      </g>
    </LapFrame>
  );
};
