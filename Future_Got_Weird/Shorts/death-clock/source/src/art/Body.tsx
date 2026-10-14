// S07: the device's body map. A translucent, schematic figure (front view, his short hair silhouette),
// a simplified vessel network carrying sensor dots, organs that flag amber when "failing", and a
// stylized heart whose regular beat turns chaotic on "lethal rhythm". A signal packet then runs down
// his LEFT arm (screen-right) to the band. Diagrammatic depiction of the invented system, not real data.
import React from 'react';
import {Bead, BeadDefs, Path, pathAt, smoothPath} from './Beads';
import {UI_FONT} from '../fonts';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {clamp, fmt, hash, inv, lerp, noise1, P, V} from '../lib/math';
import {Blob, Capsule, Glow, Lin, Sphere} from '../lib/shade';

export const BODY = {
  heart: {x: 568, y: 720} as V,
  wristL: {x: 878, y: 1112} as V, // his LEFT wrist, screen-right
};

const smoothClosed = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    d += ` C${P({x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6})} ${P({x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6})} ${P(p2)}`;
  }
  return d + ' Z';
};

// silhouette (A-pose, front view), symmetric about x = 540
const half: V[] = [
  {x: 540, y: 268},
  {x: 600, y: 300},
  {x: 612, y: 380},
  {x: 584, y: 448},
  {x: 600, y: 478},
  {x: 690, y: 500},
  {x: 742, y: 560},
  {x: 790, y: 760},
  {x: 850, y: 960},
  {x: 900, y: 1110},
  {x: 906, y: 1180},
  {x: 862, y: 1176},
  {x: 836, y: 1110},
  {x: 760, y: 920},
  {x: 704, y: 760},
  {x: 690, y: 900},
  {x: 704, y: 1040},
  {x: 676, y: 1260},
  {x: 666, y: 1520},
  {x: 660, y: 1760},
  {x: 690, y: 1810},
  {x: 600, y: 1812},
  {x: 584, y: 1520},
  {x: 560, y: 1150},
];
const silhouette = [...half, ...half.slice(1, -1).reverse().map((p) => ({x: 1080 - p.x, y: p.y}))];

// vessel network: [path control points, radius]
const NET: [V[], number][] = [
  [[{x: 568, y: 700}, {x: 560, y: 620}, {x: 540, y: 560}, {x: 530, y: 470}, {x: 528, y: 380}], 9], // carotid
  [[{x: 568, y: 700}, {x: 640, y: 560}, {x: 720, y: 560}, {x: 770, y: 760}, {x: 830, y: 960}, {x: 874, y: 1100}], 9], // LEFT arm (screen-right)
  [[{x: 540, y: 660}, {x: 440, y: 560}, {x: 360, y: 560}, {x: 310, y: 760}, {x: 250, y: 960}, {x: 206, y: 1100}], 9], // right arm
  [[{x: 556, y: 760}, {x: 548, y: 900}, {x: 540, y: 1060}, {x: 600, y: 1180}, {x: 628, y: 1500}, {x: 630, y: 1760}], 10], // aorta -> left leg
  [[{x: 540, y: 1060}, {x: 480, y: 1180}, {x: 452, y: 1500}, {x: 450, y: 1760}], 10], // right leg
];
const NET_PATHS: Path[] = NET.map(([c]) => smoothPath(c, 10));
export const ARM_PATH = NET_PATHS[1];

/** Heart beat: two-phase "lub-dub" pulse; chaos 0..1 turns it into a fast, irregular quiver. */
export const beat = (f: number, chaos: number) => {
  const per = 24;
  const k = (f % per) / per;
  const reg = Math.exp(-Math.pow((k - 0.08) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((k - 0.26) / 0.05, 2));
  const fib = 0.45 * (0.5 + 0.5 * noise1(f * 0.9, 7)) * (0.6 + 0.4 * Math.sin(f * 2.1));
  return lerp(reg, fib, chaos);
};

const Heart: React.FC<{id: string; c: V; s: number; chaos: number; f: number}> = ({id, c, s, chaos, f}) => {
  const b = beat(f, chaos);
  const k = s * (1 + 0.07 * b);
  const H = (x: number, y: number): V => ({x: c.x + x * k, y: c.y + y * k});
  const col = mix('#C8323F', '#E0283A', chaos);
  const ventricles = smoothClosed([H(-62, -30), H(-30, -58), H(20, -60), H(66, -36), H(78, 10), H(56, 62), H(22, 104), H(4, 118), H(-24, 92), H(-60, 40)]);
  return (
    <g>
      <Glow id={`${id}-g`} c={c} r={210 * s} color={chaos > 0.2 ? PAL.alert : '#FF6F7D'} alpha={0.28 + 0.4 * chaos * (0.5 + 0.5 * Math.sin(f * 0.9))} />
      {/* great vessels: aortic arch and pulmonary trunk */}
      <Capsule id={`${id}-ao1`} a={H(10, -50)} b={H(16, -128)} ra={20 * k} rb={18 * k} color="#D94A55" spec={0.3} />
      <Capsule id={`${id}-ao2`} a={H(16, -128)} b={H(-36, -150)} ra={18 * k} rb={17 * k} color="#D94A55" spec={0.3} />
      <Capsule id={`${id}-ao3`} a={H(-36, -150)} b={H(-62, -100)} ra={17 * k} rb={15 * k} color="#C83E4A" spec={0.25} />
      <Capsule id={`${id}-pt`} a={H(-14, -46)} b={H(-34, -108)} ra={17 * k} rb={15 * k} color="#6E7FC8" spec={0.3} />
      {/* atria */}
      <Sphere id={`${id}-ra`} c={H(-56, -34)} r={36 * k} color={shade(col, 0.08)} spec={0.2} />
      <Sphere id={`${id}-la`} c={H(54, -46)} r={30 * k} color={shade(col, 0.12)} spec={0.2} />
      <Blob id={`${id}-v`} d={ventricles} c={H(-10, 20)} r={120 * k} color={col} k={1.1} />
      {/* interventricular groove: a soft darker band, and a crisp highlight */}
      <path d={`M${P(H(-4, -50))} Q${P(H(30, 30))} ${P(H(6, 112))} Q${P(H(22, 30))} ${P(H(-4, -50))} Z`} fill={shade(col, 0.4)} opacity={0.4} />
      <ellipse cx={fmt(H(-34, -6).x)} cy={fmt(H(-34, -6).y)} rx={fmt(16 * k)} ry={fmt(9 * k)} transform={`rotate(-40 ${fmt(H(-34, -6).x)} ${fmt(H(-34, -6).y)})`} fill="#FFFFFF" opacity={0.6} />
    </g>
  );
};

const Organ: React.FC<{id: string; d: string; c: V; r: number; color: string; flag: number; f: number; badge?: V}> = ({id, d, c, r, color, flag, f, badge = {x: 0.8, y: -0.9}}) => (
  <g>
    {flag > 0.01 && <Glow id={`${id}-g`} c={c} r={r * 2.2} color="#FFB23E" alpha={0.75 * flag * (0.6 + 0.4 * Math.sin(f * 0.6))} />}
    <Blob id={`${id}-b`} d={d} c={c} r={r} color={mix(color, '#E3A24A', flag * 0.6)} k={0.9} opacity={0.85} />
    {flag > 0.3 && (
      <g transform={`translate(${fmt(c.x + r * badge.x)} ${fmt(c.y + r * badge.y)}) scale(${fmt(clamp(flag * 1.4))})`}>
        <circle r={22} fill="#FFB23E" />
        <rect x={-3.5} y={-13} width={7} height={15} rx={3} fill="#3A2400" />
        <circle cx={0} cy={9} r={3.8} fill="#3A2400" />
      </g>
    )}
  </g>
);

export type BodyState = {f: number; cam: Cam; organs: number; chaos: number; signal: number; ecg: number; dots: number};

export const BodyMap: React.FC<{id: string; st: BodyState}> = ({id, st}) => {
  const {f, cam} = st;
  const sil = smoothClosed(silhouette);
  const dots: React.ReactNode[] = [];
  NET_PATHS.forEach((p, k) => {
    for (let i = 0; i < 26; i++) {
      const t = ((hash(i, k + 3) + f * (0.006 + hash(i, k + 9) * 0.004)) % 1 + 1) % 1;
      const {pt} = pathAt(p, t);
      dots.push(<circle key={`${k}-${i}`} cx={fmt(pt.x + (hash(i, k) - 0.5) * 6)} cy={fmt(pt.y)} r={4 + hash(i, k + 1) * 3} fill="#BDF1FF" opacity={0.9 * st.dots} />);
    }
  });
  const sig = st.signal > 0 && st.signal < 1 ? pathAt(ARM_PATH, st.signal) : null;
  return (
    <g>
      <BeadDefs id={`${id}-b`} />
      <Layer cam={cam} depth={2.5}>
        <Lin id={`${id}-bg`} d="M-3000,-3000 h7000 v8000 h-7000 Z" from={{x: 0, y: -200}} to={{x: 0, y: 2100}} stops={[[0, '#2F4F63'], [1, '#1A2C3B']]} />
        <Glow id={`${id}-bgg`} c={{x: 540, y: 760}} r={900} color="#6FA6C2" alpha={0.3} blend="normal" />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* translucent body: outer glow shell + inner body */}
        <path d={sil} fill="#BFE6F2" opacity={0.16} transform="translate(540 1000) scale(1.025) translate(-540 -1000)" />
        <Lin id={`${id}-sil`} d={sil} from={{x: 300, y: 250}} to={{x: 780, y: 1800}} stops={[[0, '#D9F1F8', 0.32], [1, '#8FC3D6', 0.22]]} />
        {/* his short hair, so the map reads as him */}
        <path d={smoothClosed([{x: 478, y: 300}, {x: 500, y: 262}, {x: 540, y: 250}, {x: 584, y: 260}, {x: 606, y: 300}, {x: 600, y: 330}, {x: 540, y: 300}, {x: 480, y: 330}])} fill="#4A3022" opacity={0.55} />
        {/* lungs (faint), liver, kidneys */}
        <Blob id={`${id}-lu1`} d={smoothClosed([{x: 440, y: 560}, {x: 500, y: 540}, {x: 520, y: 700}, {x: 470, y: 800}, {x: 420, y: 760}])} c={{x: 470, y: 660}} r={140} color="#E9A3AE" k={0.6} opacity={0.35} />
        <Blob id={`${id}-lu2`} d={smoothClosed([{x: 640, y: 560}, {x: 580, y: 540}, {x: 600, y: 650}, {x: 616, y: 800}, {x: 662, y: 760}])} c={{x: 616, y: 660}} r={140} color="#E9A3AE" k={0.6} opacity={0.35} />
        <Organ id={`${id}-lv`} d={smoothClosed([{x: 430, y: 850}, {x: 560, y: 830}, {x: 590, y: 880}, {x: 520, y: 940}, {x: 440, y: 930}])} c={{x: 500, y: 880}} r={90} color="#9C4A40" flag={st.organs} f={f} badge={{x: -0.95, y: -0.5}} />
        <Organ id={`${id}-k1`} d={smoothClosed([{x: 470, y: 980}, {x: 500, y: 960}, {x: 512, y: 1010}, {x: 494, y: 1050}, {x: 468, y: 1030}])} c={{x: 490, y: 1005}} r={46} color="#A0505A" flag={st.organs} f={f + 7} badge={{x: -1.2, y: 0.2}} />
        <Organ id={`${id}-k2`} d={smoothClosed([{x: 610, y: 980}, {x: 580, y: 960}, {x: 568, y: 1010}, {x: 586, y: 1050}, {x: 612, y: 1030}])} c={{x: 590, y: 1005}} r={46} color="#A0505A" flag={st.organs} f={f + 13} badge={{x: 1.2, y: 0.2}} />
        {/* vessel network */}
        {NET_PATHS.map((p, k) => (
          <g key={k}>
            {p.slice(1).map((q, i) => (
              <Capsule key={i} id={`${id}-n${k}-${i}`} a={p[i]} b={q} ra={NET[k][1]} rb={NET[k][1]} color="#D9505E" k={0.6} opacity={0.75} />
            ))}
          </g>
        ))}
        {dots}
        <Heart id={`${id}-h`} c={BODY.heart} s={0.62} chaos={st.chaos} f={f} />
        {/* the band on his LEFT wrist */}
        <Capsule id={`${id}-band`} a={{x: BODY.wristL.x - 26, y: BODY.wristL.y - 8}} b={{x: BODY.wristL.x + 26, y: BODY.wristL.y + 8}} ra={13} rb={13} color={PAL.band} spec={0.7} />
        {sig && (
          <g>
            <Glow id={`${id}-sg`} c={sig.pt} r={70} color="#FFFFFF" alpha={0.7} />
            <Bead id={`${id}-b`} p={sig.pt} r={14} dir={sig.dir} wake={4} />
          </g>
        )}
        {st.signal >= 0.98 && <Glow id={`${id}-bw`} c={BODY.wristL} r={90} color={PAL.alert} alpha={0.8 * clamp((st.signal - 0.98) * 50)} />}
      </Layer>
      {/* rhythm inset (screen-fixed card) */}
      {st.ecg > 0.01 && (
        <g opacity={st.ecg} transform={`translate(540 ${fmt(lerp(1600, 1560, st.ecg))})`}>
          <rect x={-300} y={-90} width={600} height={180} rx={28} fill="#0E1C27" opacity={0.86} />
          <text x={-264} y={-46} fontFamily={UI_FONT} fontWeight={700} fontSize={30} letterSpacing={3} fill={st.chaos > 0.3 ? '#FF8A93' : '#8FE8C4'}>
            {st.chaos > 0.3 ? 'RHYTHM: LETHAL' : 'RHYTHM'}
          </text>
          <polyline
            points={Array.from({length: 120})
              .map((_, i) => {
                const x = -260 + i * (520 / 119);
                const ph = i / 119 + f * 0.02;
                const k = ph * 3 - Math.floor(ph * 3);
                const reg = k > 0.45 && k < 0.5 ? -50 : k >= 0.5 && k < 0.55 ? 34 : k > 0.7 && k < 0.8 ? -10 * Math.sin(((k - 0.7) / 0.1) * Math.PI) : 0;
                const fib = 30 * noise1(i * 0.45 + f * 0.5, 3) + 14 * Math.sin(i * 0.9 + f * 0.7);
                return `${fmt(x)},${fmt(30 + lerp(reg, fib, st.chaos))}`;
              })
              .join(' ')}
            fill="none"
            stroke={st.chaos > 0.3 ? '#FF5A66' : '#3EE0A0'}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
};

export const bodyCam = (f: number, f0: number, fOrgans: number, fHeart: number, fSig: number, f1: number): Cam => {
  // from the forearm (handoff from the vessel), pull back to the whole body for "organs", push into the
  // heart for "heart ... lethal rhythm", then follow the signal down the left arm to the band
  const pull = inv(f0, fOrgans + 10, f);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const toHeart = ease(inv(fHeart - 8, fHeart + 12, f));
  const toWrist = ease(inv(fSig, f1, f));
  const a = {x: lerp(820, 540, ease(pull)), y: lerp(1060, 1000, ease(pull)), z: lerp(2.6, 1.0, ease(pull))};
  const b = {x: lerp(a.x, BODY.heart.x, toHeart), y: lerp(a.y, BODY.heart.y + 30, toHeart), z: lerp(a.z, 2.3, toHeart)};
  return {x: lerp(b.x, BODY.wristL.x - 40, toWrist), y: lerp(b.y, BODY.wristL.y - 60, toWrist), z: lerp(b.z, 2.6, toWrist)};
};
