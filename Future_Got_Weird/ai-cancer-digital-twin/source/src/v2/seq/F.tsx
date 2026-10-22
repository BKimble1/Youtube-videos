// SEQUENCE F (171.1 – 199.3 s): the visible tumour is gone, but a few cells survive and start again; they shed
// fragments of their DNA into a capillary; in the blood those fragments are rare among normal DNA fragments; a blood
// sample is drawn and its plasma read: sequencing reads pile up, tumour-specific changes show, a signal rises through
// a threshold with its uncertainty band; a new change appears, the plan is adjusted; finally the enemy's marker
// changes and the defence's receptor changes to match — twice.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise, closedPath} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path} from '../rig';
import {P} from '../palette';
import {cellAt, nearest, TissueField, TissueBack, Cell2, TCell2, DividingCell, R, TUMOR, HEALTHY, lookMix, Motes, boundary} from '../art/tissue';
import {Capillary, along} from '../art/stroma';
import {BloodTunnel} from '../art/blood';
import {AIBack, DigitalTumor} from '../art/ai';
import {C0P} from './A';
import {CAPS, SPROUTS} from './B';
import {KILL_CAM, RtLocal, RT_E0} from './E';

const tF = {
  but: T('But destroying the visible tumor'), because: T('Because even a tiny population'), back: T('bring the disease back.'), interesting: T('And this is where things get really'),
  cancer: T('Cancer can leave microscopic traces'), blood: T('in the bloodstream.'), analyzing: T('By analyzing these signals,'), detect: T('detect signs of a returning tumor,'),
  changing: T("identify how it's changing,"), guide: T('and guide a new treatment'), control: T('before it grows out of control.'), evolving: T('An evolving enemy,'), met: T('met by an evolving defense.'),
  breakthrough: T("And that's the breakthrough"),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = {x: C0P[0], y: C0P[1]};

// ------------------------------------------------------------------------------------------------ remnant
const RtF = (a: number, t: number) => (t < tF.but + 0.5 ? RtLocal(a, t) : lerp(RtLocal(a, tF.but + 0.5), 0, lift(t, tF.but + 0.5, tF.because - 0.3)));
/** the survivors are the resistant population from the treatment scene: same tint, same square orange marker */
export const RESIST = lookMix(TUMOR, {...TUMOR, fill: '#B8603E', light: '#E8986E'}, 0.45);
/** marker silhouettes shared by every scene: 0 = round (original), 1 = square (after resistance), 2 = triangle (new change) */
export const shapePts = (kind: number, r: number, n = 24): Pt[] => Array.from({length: n}, (_, k) => {
  const a = (k / n) * Math.PI * 2 - Math.PI / 2;
  if (kind === 0) return [Math.cos(a) * r, Math.sin(a) * r];
  const sides = kind === 1 ? 4 : 3;
  const rot = kind === 1 ? Math.PI / 4 : 0;
  const seg = (Math.PI * 2) / sides;
  const local = ((a + Math.PI / 2 - rot) % seg + seg) % seg - seg / 2;
  const rr = (r * Math.cos(Math.PI / sides) * (kind === 1 ? 1.15 : 1.25)) / Math.cos(local);
  return [Math.cos(a) * rr, Math.sin(a) * rr];
});
export const morphPath = (k0: number, k1: number, u: number, r: number) => {
  const A = shapePts(k0, r), B = shapePts(k1, r);
  return 'M ' + A.map((p, i) => `${lerp(p[0], B[i][0], u).toFixed(1)} ${lerp(p[1], B[i][1], u).toFixed(1)}`).join(' L ') + ' Z';
};
export const MARK_COL = [P.marker, P.markerAlt, '#B58CFF'];
const SPR = SPROUTS[0];
const TIP = SPR[SPR.length - 1];
const SURV = [[-60, 120], [140, 40], [40, -90], [-1500, 900], [1300, 700], [-700, -1300], [900, -600]].map(([dx, dy], k) => {
  const base = k < 3 ? [TIP[0] + dx - 30, TIP[1] + dy + 260] : [C0.x + dx, C0.y + dy];
  const n = nearest(base[0], base[1]);
  return {...n, ...cellAt(n.i, n.j), k};
});
const survSet = new Set(SURV.map((s) => `${s.i},${s.j}`));
const FRAGS = Array.from({length: 9}, (_, k) => ({src: SURV[k % 3], t0: tF.interesting + k * 0.22, seed: k}));
const fragPos = (f: (typeof FRAGS)[0], t: number): Pt => {
  const u = clamp01((t - f.t0) / 2.2);
  const a = -Math.PI / 2 + (rand(f.seed) - 0.5) * 1.2;
  const p0: Pt = [f.src.x + Math.cos(a) * R, f.src.y + Math.sin(a) * R];
  const tgt = along(SPR, 0.92 - 0.06 * rand(f.seed * 3)).p;
  return [lerp(p0[0], tgt[0], smooth(u)) + 30 * noise(t + f.seed, 3) * (1 - u), lerp(p0[1], tgt[1], smooth(u)) + 30 * noise(t + f.seed, 5) * (1 - u)];
};
export const Fragment: React.FC<{x: number; y: number; s?: number; rot?: number; tumor?: boolean; t: number; glow?: number; alt?: number}> = ({x, y, s = 1, rot = 0, tumor = false, t, glow = 0, alt = 0}) => {
  const c1 = tumor ? mixHex(P.payload, '#B58CFF', alt) : '#A8A0A8', c2 = tumor ? mixHex('#FFC27A', '#D8C2FF', alt) : '#D0C8D0';
  const L = 70;
  const s1: string[] = [], s2: string[] = [];
  for (let k = 0; k <= 14; k++) {
    const u = k / 14, xx = -L + u * 2 * L;
    s1.push(`${xx.toFixed(1)} ${(14 * Math.sin(u * 9 + t * 2)).toFixed(1)}`);
    s2.push(`${xx.toFixed(1)} ${(14 * Math.sin(u * 9 + t * 2 + 2.4)).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {glow > 0.01 && <circle r={110} fill={tumor ? 'url(#glowGold)' : 'url(#glowWhite)'} opacity={glow * 0.7} />}
      {Array.from({length: 7}, (_, k) => <line key={k} x1={-L + 10 + k * 20} x2={-L + 10 + k * 20} y1={-10} y2={10} stroke={c2} strokeWidth={4} />)}
      <path d={`M ${s1.join(' L ')}`} fill="none" stroke={c1} strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${s2.join(' L ')}`} fill="none" stroke={c2} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};
const CAM_R = path([
  {...KILL_CAM(tF.but + 0.4), t: tF.but + 0.4},
  {t: tF.because - 0.2, x: C0.x + 200, y: C0.y - 300, z: 0.13, rot: -2},
  {t: tF.because + 1.6, x: TIP[0], y: TIP[1] + 240, z: 0.75, rot: 0},
  {t: tF.back + 0.3, x: TIP[0] - 20, y: TIP[1] + 180, z: 1.45, rot: 1},
  {t: tF.cancer - 0.3, x: TIP[0], y: TIP[1] + 40, z: 1.6, rot: 1},
  {t: tF.cancer + 0.35, x: TIP[0], y: TIP[1] - 30, z: 4.5, rot: 1},
]);
const Remnant: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const heal = lift(t, tF.but + 0.6, tF.because);
  const mod = (i: number, j: number, x: number, y: number) => {
    if (survSet.has(`${i},${j}`)) return {hide: true};
    const dx = x - C0.x, dy = y - C0.y;
    const ang = Math.atan2(dy, dx);
    const d = Math.hypot(dx, dy) / boundary(ang);
    const Rt = RtF(ang, t);
    if (d < Rt) return {look: TUMOR, nucScale: 1.25};
    if (d < RT_E0) {
      // debris clears and healthy cells fill back in
      const k = clamp01((d - Rt) / 300);
      return {look: lookMix({...TUMOR, fill: '#8A6A86'}, HEALTHY, heal), bleb: k * (1 - heal), shrink: 0.5 * k * (1 - heal), op: lerp(0.4, 1, heal)};
    }
    return null;
  };
  const divK = clamp01((t - (tF.back - 0.6)) / 1.2);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={mod} />
        {CAPS.map((c, k) => <Capillary key={k} pts={c} t={t} w={95} lod={cam.z} />)}
        {SPROUTS.map((c, k) => <Capillary key={'s' + k} pts={c} t={t} w={78} lod={cam.z} />)}
        {SURV.map((s) => {
          const glow = lift(t, tF.because, tF.because + 0.8) * (0.6 + 0.3 * Math.sin(t * 3 + s.k));
          return s.k === 0 && divK > 0 ? (
            <DividingCell key={s.k} x={s.x} y={s.y} seed={s.seed} t={t} p={divK} axis={30} lod={lod} look={RESIST} pulse={glow * 0.4} sepF={0.7} dR={0.84} />
          ) : (
            <g key={s.k}>
              <Cell2 x={s.x} y={s.y} seed={s.seed} t={t} lod={lod} look={RESIST} pulse={glow * 0.4} nucScale={1.2} />
              {lod > 9 && Array.from({length: 7}, (_, m) => {
                const a = (m / 7) * Math.PI * 2 + s.seed;
                return <path key={m} d={morphPath(1, 1, 0, 6)} transform={`translate(${s.x + Math.cos(a) * R * 0.98} ${s.y + Math.sin(a) * R * 0.98}) rotate(${(a * 180) / Math.PI})`} fill={P.markerAlt} />;
              })}
            </g>
          );
        })}
        {FRAGS.map((f, k) => t > f.t0 && <Fragment key={k} x={fragPos(f, t)[0]} y={fragPos(f, t)[1]} s={0.28} rot={k * 40 + t * 30} tumor t={t} glow={0.6} />)}
      </g>
      <Motes cam={cam} t={t} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ blood: rare tumour fragments among normal ones
const CAM_B = (t: number): Cam => ({x: 600 * (t - tF.cancer), y: 0, z: lerp(1.25, 0.62, lift(t, tF.cancer, tF.blood)), rot: 0});
const ROT_B = (t: number) => lerp(90, 0, lift(t, tF.cancer - 0.1, tF.cancer + 1.4));
const BloodF: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const frs: React.ReactNode[] = [];
  const S = 230;
  const x0 = cam.x - W / cam.z, x1 = cam.x + W / cam.z;
  for (let i = Math.floor((x0 - t * 900) / S); i <= Math.ceil((x1 - t * 900) / S); i++) {
    const sd = ((i % 503) + 503) % 503 * 7 + 3;
    const x = i * S + rand(sd) * S + t * 900, y = (rand(sd + 1) * 2 - 1) * 440;
    const tumor = sd % 11 === 3;
    frs.push(<Fragment key={i} x={x} y={y} s={0.9} rot={rand(sd + 2) * 180 + t * 25} tumor={tumor} t={t} glow={tumor ? lift(t, tF.cancer + 1.4, tF.cancer + 2.2) : 0} />);
  }
  // the capillary runs down the screen in the tissue shot: start the tunnel turned the same way and level it out
  const r = ROT_B(t), a = (r * Math.PI) / 180;
  const sc = Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)) * (W / H);
  return (
    <g transform={`rotate(${r} ${W / 2} ${H / 2}) translate(${W / 2} ${H / 2}) scale(${sc}) translate(${-W / 2} ${-H / 2})`}>
      <BloodTunnel cam={cam} t={t} flow={1100}>{frs}</BloodTunnel>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the blood sample
const Tube: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const sep = lift(t, tF.analyzing + 0.1, tF.analyzing + 0.9);
  const tubeW = 260, tubeH = 1100;
  const plasmaTop = -tubeH / 2 + 160, split = lerp(-tubeH / 2 + 160, 60, sep);
  return (
    <g>
      <rect width={W} height={H} fill="#141A26" />
      <rect width={W} height={H} fill="url(#glowWhite)" opacity={0.05} />
      <g transform={camTransform(cam)}>
        <defs>
          <clipPath id="tubeClip"><path d={`M ${-tubeW / 2} ${-tubeH / 2} L ${tubeW / 2} ${-tubeH / 2} L ${tubeW / 2} ${tubeH / 2 - tubeW / 2} A ${tubeW / 2} ${tubeW / 2} 0 0 1 ${-tubeW / 2} ${tubeH / 2 - tubeW / 2} Z`} /></clipPath>
        </defs>
        <ellipse cx={0} cy={tubeH / 2 + 40} rx={300} ry={40} fill="#000" opacity={0.35} />
        <g clipPath="url(#tubeClip)">
          <rect x={-tubeW} y={-tubeH} width={tubeW * 2} height={tubeH * 2} fill="#2A3240" />
          <rect x={-tubeW} y={plasmaTop} width={tubeW * 2} height={tubeH} fill={mixHex(P.blood, P.plasma, 0)} />
          <rect x={-tubeW} y={plasmaTop} width={tubeW * 2} height={split - plasmaTop} fill={P.plasma} opacity={sep} />
          <rect x={-tubeW} y={split - 6} width={tubeW * 2} height={14} fill="#F4F0E8" opacity={sep} />
          {Array.from({length: 30}, (_, k) => {
            const y = lerp(plasmaTop + 20, tubeH / 2, rand(k * 3));
            const yy = Math.max(y, lerp(y, split + 30 + rand(k) * 400, sep));
            return <ellipse key={k} cx={(rand(k) - 0.5) * tubeW * 0.8} cy={yy} rx={14} ry={9} fill={P.rbcDeep} opacity={0.8} />;
          })}
          {sep > 0.5 && Array.from({length: 14}, (_, k) => <circle key={'f' + k} cx={(rand(k * 7) - 0.5) * tubeW * 0.8} cy={lerp(plasmaTop + 30, split - 30, rand(k * 9))} r={k % 5 === 1 ? 7 : 4} fill={k % 5 === 1 ? P.payload : '#8A7A5A'} opacity={(sep - 0.5) * 2} />)}
        </g>
        <path d={`M ${-tubeW / 2} ${-tubeH / 2} L ${-tubeW / 2} ${tubeH / 2 - tubeW / 2} A ${tubeW / 2} ${tubeW / 2} 0 0 0 ${tubeW / 2} ${tubeH / 2 - tubeW / 2} L ${tubeW / 2} ${-tubeH / 2}`} fill="none" stroke="#DDE8F4" strokeWidth={10} opacity={0.7} />
        <rect x={-tubeW / 2 + 20} y={-tubeH / 2 + 40} width={26} height={tubeH - 260} rx={13} fill="#FFFFFF" opacity={0.25} />
        <rect x={-tubeW / 2 - 24} y={-tubeH / 2 - 150} width={tubeW + 48} height={170} rx={24} fill="#5A6A82" />
        <rect x={-tubeW / 2 - 24} y={-tubeH / 2 - 150} width={tubeW + 48} height={170} rx={24} fill="url(#vol)" />
      </g>
    </g>
  );
};
const CAM_T = path([
  {t: tF.analyzing - 0.1, x: 0, y: 40, z: 0.72, rot: -4},
  {t: tF.analyzing + 0.9, x: 0, y: -100, z: 0.82, rot: 0},
  {t: tF.detect - 0.25, x: 0, y: -260, z: 3.2, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ reading the plasma DNA
const READS = Array.from({length: 22}, (_, k) => ({x: -760 + rand(k * 3) * 380, len: 460 + 240 * rand(k * 5), row: k, tumor: k % 4 === 1 || k === 14, alt: k === 5 || k === 13 || k === 21}));
const MUT_X = -330, MUT2_X = -150;
const Reads: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const pile = lift(t, tF.detect - 0.5, tF.detect + 0.8);
  const chg = lift(t, tF.changing, tF.changing + 0.8);
  const plan = lift(t, tF.guide + 0.2, tF.guide + 1.1);
  return (
    <g>
      <AIBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        {/* reference line */}
        <line x1={-900} x2={180} y1={-420} y2={-420} stroke={P.aiHot} strokeWidth={6} opacity={0.6} />
        <line x1={MUT_X} x2={MUT_X} y1={-450} y2={460} stroke={P.payload} strokeWidth={3} strokeDasharray="10 12" opacity={0.6 * pile} />
        {chg > 0.01 && <line x1={MUT2_X} x2={MUT2_X} y1={-450} y2={460} stroke="#B58CFF" strokeWidth={3} strokeDasharray="10 12" opacity={0.6 * chg} />}
        {READS.map((r, k) => {
          const u = smooth(clamp01(pile * 1.6 - k * 0.03));
          const y = -380 + r.row * 38;
          const fx = lerp(-1250 + rand(k) * 500, r.x, u);
          const covers = (m: number) => m > r.x && m < r.x + r.len;
          if (u < 0.35) {
            const fy = lerp(-300 + rand(k * 7) * 700, y, u / 0.35 * 0.3);
            return <Fragment key={k} x={fx + r.len / 2} y={fy} s={0.9} rot={rand(k) * 90 * (1 - u * 2)} tumor={r.tumor} t={t} />;
          }
          return (
            <g key={k} opacity={smooth((u - 0.35) / 0.3)}>
              <rect x={fx} y={y} width={r.len} height={24} rx={12} fill={P.aiDeep} stroke={P.ai} strokeWidth={2} />
              {r.tumor && covers(MUT_X) && <rect x={fx + (MUT_X - r.x) - 10} y={y - 4} width={20} height={32} rx={6} fill={P.payload} />}
              {r.alt && covers(MUT2_X) && <rect x={fx + (MUT2_X - r.x) - 10} y={y - 4} width={20} height={32} rx={6} fill="#B58CFF" opacity={chg} />}
            </g>
          );
        })}
        {/* what the reads change in the model: the resistant (square) population is found again, then a new change
            (triangle) appears in part of it, and the plan's binding shape is redesigned to match */}
        <g opacity={lift(t, tF.detect - 0.1, tF.detect + 0.5)}>
          <DigitalTumor x={620} y={-60} R={260} seed={4} t={t} lod={cam.z} sy={1} tint={P.ai} vessels={0.4} />
          {Array.from({length: 10}, (_, m) => {
            const a = (m / 10) * Math.PI * 2 + 0.3;
            const isNew = m % 3 === 0;
            const shown = lift(t, tF.detect + m * 0.08, tF.detect + 0.4 + m * 0.08);
            const k = isNew ? chg : 0;
            return (
              <g key={m} transform={`translate(${620 + Math.cos(a) * 290} ${-60 + Math.sin(a) * 290})`} opacity={shown}>
                <path d={morphPath(1, 2, k, 18)} fill={mixHex(P.markerAlt, '#B58CFF', k)} stroke="#FFFFFF" strokeWidth={3} />
              </g>
            );
          })}
          {/* the plan: a binding shape that fits the marker it must recognise */}
          <g transform="translate(620 360)" opacity={lift(t, tF.detect + 0.6, tF.detect + 1.1)}>
            <circle r={120} fill="url(#glowGold)" opacity={0.4 + 0.4 * plan} />
            <path d={morphPath(1, 2, plan, 46)} fill="none" stroke={P.aiGold} strokeWidth={12} />
            <path d={morphPath(1, 2, plan, 30)} fill={P.aiBg} />
          </g>
        </g>
      </g>
    </g>
  );
};
const CAM_RD = path([
  {t: tF.detect - 0.4, x: -300, y: -60, z: 1.15, rot: 0},
  {t: tF.detect + 1.0, x: 0, y: -40, z: 0.82, rot: 0},
  {t: tF.changing + 0.6, x: 100, y: 0, z: 0.78, rot: 0},
  {t: tF.evolving, x: 300, y: 60, z: 0.8, rot: 0},
]);

// ------------------------------------------------------------------------------------------------ evolving enemy, evolving defence
const Loop: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  // the same marker shapes and colours as before: round pink (original), square orange (after the drug), violet
  // triangle (the new change found in the blood). The marker reshapes; the receptor reshapes to fit it, and only then
  // makes contact again.
  const span = tF.breakthrough - tF.evolving;
  const u = clamp01((t - tF.evolving) / span) * 3;
  const stage = Math.min(2, Math.floor(u));
  const within = u - stage;
  const mk = stage === 0 ? 0 : smooth(within / 0.3);                 // marker morph from the previous shape
  const df = smooth((within - 0.35) / 0.3);                           // defence catches up
  const kFrom = Math.max(0, stage - 1), kTo = stage;
  const mCol = mixHex(MARK_COL[kFrom], MARK_COL[kTo], stage === 0 ? 1 : mk);
  // on each change the T cell backs off as the marker reshapes, then re-engages once its receptor fits again
  const contact = stage === 0 ? smooth(within / 0.4) : Math.max(1 - smooth(within / 0.22), df);
  const Tc = lerp(240, 8, contact);
  const tint = stage === 0 ? 0 : stage === 1 ? 0.45 * mk : 0.45;
  return (
    <g>
      <rect width={W} height={H} fill={P.tissueBg} />
      <g transform={camTransform(cam)}>
        <Cell2 x={-260} y={0} r={210} seed={7} t={t} lod={200} look={lookMix(TUMOR, RESIST, tint * 2)} nucScale={1.2} />
        {Array.from({length: 7}, (_, m) => {
          const a = (m / 7 - 0.5) * 2.0;
          return <path key={m} d={stage === 0 ? morphPath(0, 0, 0, 17) : morphPath(kFrom, kTo, mk, 17)} transform={`translate(${-260 + Math.cos(a) * 226} ${Math.sin(a) * 226}) rotate(${(a * 180) / Math.PI})`} fill={mCol} stroke="#FFFFFF" strokeWidth={2} />;
        })}
        <TCell2 x={Tc + 200} y={0} r={190} t={t} dir={Math.PI} lod={200} act={contact * 0.5} light={mixHex(P.tcellLight, P.immuneGold, 0.4)} />
        {Array.from({length: 7}, (_, m) => {
          const a = Math.PI + (m / 7 - 0.5) * 1.5;
          const x = Tc + 200 + Math.cos(a) * 212, y = Math.sin(a) * 212;
          const dShape = stage === 0 ? morphPath(0, 0, 0, 24) : morphPath(kFrom, kTo, df, 24);
          return <path key={m} d={dShape} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 180})`} fill="none" stroke={P.immuneGold} strokeWidth={7} />;
        })}
        {contact > 0.9 && <ellipse cx={-260 + 226 + 8} cy={0} rx={22} ry={170} fill="url(#glowGold)" opacity={0.35 * (contact - 0.9) * 10 * (1 - within)} />}
      </g>
    </g>
  );
};
const CAM_L = path([
  {t: tF.evolving - 0.1, x: 0, y: 0, z: 1.15, rot: -6},
  {t: tF.breakthrough, x: 20, y: 0, z: 1.3, rot: 6},
]);

export const shotsF: Shot[] = [
  {id: 'F-remnant', t0: tF.but + 0.4, t1: tF.cancer + 0.4, fade: 0.85, draw: (t) => <Remnant t={t} cam={CAM_R(t)} />},
  {id: 'F-blood', t0: tF.cancer - 0.1, t1: tF.analyzing, fade: 0.5, draw: (t) => <BloodF t={t} cam={CAM_B(t)} />},
  {id: 'F-tube', t0: tF.analyzing, t1: tF.detect - 0.2, draw: (t) => <Tube t={t} cam={CAM_T(t)} />},
  {id: 'F-reads', t0: tF.detect - 0.45, t1: tF.evolving, fade: 0.25, draw: (t) => <Reads t={t} cam={CAM_RD(t)} />},
  {id: 'F-loop', t0: tF.evolving, t1: tF.breakthrough, draw: (t) => <Loop t={t} cam={CAM_L(t)} />},
];
export const _f = {TE, closedPath, H, W, P};
