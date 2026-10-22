// Molecular actors, drawn in local units (1 unit ≈ 0.3 nm at the hook's scale; exaggerated for legibility).
// Shapes are stylized teaching diagrams: the DNA switch is informed by the published schematic (a folded-DNA
// structure whose ligand pattern is concealed until acidic conditions open pH-sensitive locks), not a structural model.
import React from 'react';
import {C} from '../theme';
import {M} from '../theme';
import {blob, clamp01, closedPath, drift, lerp, mixHex, noise, P, smooth} from '../kit/core';

const INK = C.ink;

// ------------------------------------------------------------------------------------------------ lipid membrane
/** A bilayer along y = f(x) for x in [x0, x1] (outside = up). Heads every `step` units. */
export const Membrane: React.FC<{f: (x: number) => number; x0: number; x1: number; step?: number; th?: number; head?: string; headIn?: string; core?: string; hr?: number; lw?: number; wob?: number; t?: number}> = ({
  f, x0, x1, step = 9, th = 26, head = M.membrane, headIn = M.membraneDeep, core = M.membraneCore, hr = 4.2, lw = 1.4, wob = 0.8, t = 0,
}) => {
  const n = Math.ceil((x1 - x0) / step);
  const top: P[] = [], bot: P[] = [];
  const heads: React.ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * step;
    const y = f(x);
    const dy = (f(x + 1) - f(x - 1)) / 2;
    const len = Math.hypot(1, dy);
    const nx = dy / len, ny = -1 / len; // outward normal (up)
    const j = noise(i * 0.7 + t * 1.5, 3) * wob;
    top.push([x + nx * th * 0.5, y + ny * th * 0.5]);
    bot.push([x - nx * th * 0.5, y - ny * th * 0.5]);
    heads.push(<circle key={'o' + i} cx={x + nx * (th * 0.5 + j)} cy={y + ny * (th * 0.5 + j)} r={hr} fill={head} stroke={INK} strokeWidth={lw} />);
    heads.push(<circle key={'i' + i} cx={x - nx * (th * 0.5 - j)} cy={y - ny * (th * 0.5 - j)} r={hr} fill={headIn} stroke={INK} strokeWidth={lw} />);
  }
  const band = `M ${top.map((p) => p.join(' ')).join(' L ')} L ${bot.reverse().map((p) => p.join(' ')).join(' L ')} Z`;
  return (
    <g>
      <path d={band} fill={core} />
      {/* fatty tails as two faint centre lines */}
      <path d={`M ${top.map((p, i) => `${(p[0] + bot[bot.length - 1 - i][0]) / 2} ${(p[1] + bot[bot.length - 1 - i][1]) / 2}`).join(' L ')}`} fill="none" stroke={mixHex(core, head, 0.6)} strokeWidth={lw} strokeDasharray={`${step * 0.5} ${step * 0.5}`} />
      {heads}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ death receptor
/** Death receptor in local coords: membrane plane at y = 0, outside = negative y. act = clustered/active (0..1). */
export const DeathReceptor: React.FC<{act?: number; s?: number; t?: number; seed?: number; adaptors?: number}> = ({act = 0, s = 1, t = 0, seed = 0, adaptors = 0}) => {
  const sway = drift(t, seed, 2.5) * 6 * (1 - act);
  const fill = M.receptor, deep = M.receptorDeep;
  return (
    <g transform={`scale(${s})`}>
      {/* transmembrane helix */}
      <rect x={-3.5} y={-16} width={7} height={34} rx={3.5} fill={deep} stroke={INK} strokeWidth={1.4} />
      <g transform={`rotate(${sway} 0 -14)`}>
        <ellipse cx={0} cy={-24} rx={10} ry={9} fill={fill} stroke={INK} strokeWidth={1.6} />
        <ellipse cx={1} cy={-40} rx={11} ry={10} fill={fill} stroke={INK} strokeWidth={1.6} />
        <ellipse cx={-1} cy={-57} rx={10} ry={9} fill={mixHex(fill, '#ffffff', 0.15)} stroke={INK} strokeWidth={1.6} />
        <path d="M -5 -60 Q 0 -64 5 -60" fill="none" stroke={mixHex(fill, '#ffffff', 0.6)} strokeWidth={1.6} strokeLinecap="round" />
      </g>
      {/* intracellular death domain */}
      <rect x={-9} y={16} width={18} height={15} rx={6} fill={mixHex(deep, M.signal, act * 0.8)} stroke={INK} strokeWidth={1.6} />
      {act > 0.02 && <circle cx={0} cy={23} r={14 + act * 8} fill={M.signal} opacity={0.25 * act} />}
      {adaptors > 0.02 && (
        <g opacity={smooth(adaptors)} transform={`translate(0 ${lerp(26, 0, smooth(adaptors))})`}>
          <ellipse cx={-6} cy={40} rx={9} ry={7} fill={M.enzyme} stroke={INK} strokeWidth={1.4} />
          <ellipse cx={7} cy={44} rx={8} ry={6.5} fill={M.enzymeDeep} stroke={INK} strokeWidth={1.4} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ peptide ligand
export const Peptide: React.FC<{x: number; y: number; r?: number; glow?: number; seed?: number}> = ({x, y, r = 7, glow = 0, seed = 0}) => (
  <g>
    {glow > 0.01 && <circle cx={x} cy={y} r={r * 2.4} fill={M.peptide} opacity={0.22 * glow} />}
    <path d={blob(x, y, r, seed + 11, 0, 0.18, 9)} fill={M.peptide} stroke={INK} strokeWidth={1.5} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#FFD2C8" />
  </g>
);

// ------------------------------------------------------------------------------------------------ DNA helix bundle
/** One double helix drawn as a rounded rod with backbone stripes, from (0,0) along +x, length L, diameter d. */
export const Helix: React.FC<{L: number; d?: number; phase?: number; fill?: string; deep?: string; lw?: number}> = ({L, d = 16, phase = 0, fill = M.dna, deep = M.dnaDeep, lw = 1.5}) => {
  const turn = d * 1.9;
  const stripes: React.ReactNode[] = [];
  for (let x = -turn + ((phase * turn) % turn); x < L; x += turn) {
    const a = Math.max(2, x), b = Math.min(L - 2, x + turn * 0.5);
    if (b > a) stripes.push(<path key={x} d={`M ${a} ${-d / 2 + 2} Q ${(a + b) / 2} 0 ${b} ${d / 2 - 2}`} fill="none" stroke={deep} strokeWidth={2.2} strokeLinecap="round" />);
    const c = Math.max(2, x + turn * 0.5), e = Math.min(L - 2, x + turn);
    if (e > c) stripes.push(<path key={'b' + x} d={`M ${c} ${d / 2 - 2} Q ${(c + e) / 2} 0 ${e} ${-d / 2 + 2}`} fill="none" stroke={mixHex(fill, '#ffffff', 0.55)} strokeWidth={1.6} strokeLinecap="round" />);
  }
  return (
    <g>
      <rect x={0} y={-d / 2} width={L} height={d} rx={d / 2} fill={fill} stroke={INK} strokeWidth={lw} />
      {stripes}
    </g>
  );
};

/** The DNA switch, side view. Origin at the centre of the ligand plate. open: 0 closed → 1 fully open (flaps swung
 *  down and out). unlock: 0..1 the pH locks release (before the flaps move). xray: shell transparency to show the
 *  concealed ligands. tint: acidic environment warmth on the protons near the locks. */
export const DnaSwitch: React.FC<{open?: number; unlock?: number; xray?: number; t?: number; protons?: number; s?: number; glow?: number; silhouette?: boolean}> = ({
  open = 0, unlock = 0, xray = 0, t = 0, protons = 0, s = 1, glow = 0, silhouette = false,
}) => {
  const L = 280, d = 17;
  const plate = [-44, -27, -10]; // helix centre y for the top bundle
  const flapY = [24, 41];
  const ang = smooth(open) * 180; // flaps swing out and lie flat beside the plate (never left hanging like legs)
  const shellOp = 1 - 0.62 * xray;
  // side view of a hexagonal ligand pattern: six positions, three in front and three behind
  const lig: [number, number, number][] = [[-70, 0, 1], [-35, 0, 0], [35, 0, 0], [70, 0, 1], [-35, 0, 1], [35, 0, 1]];
  const ligDrop = 10 + smooth(open) * 8;
  const sil = silhouette ? {filter: 'brightness(0.22) saturate(1.4)'} : undefined;
  return (
    <g transform={`scale(${s})`} style={sil}>
      {silhouette && <rect x={-142} y={-54} width={284} height={106} rx={12} fill={M.dnaDeep} />}
      {glow > 0.01 && <ellipse cx={0} cy={4} rx={120} ry={34} fill={M.peptide} opacity={0.10 * glow} />}
      {/* ligand plate: three helices (the device's spine) */}
      <g opacity={shellOp}>
        {plate.map((y, i) => (
          <g key={i} transform={`translate(${-L / 2 + (i === 1 ? -6 : 0)} ${y})`}>
            <Helix L={L + (i === 1 ? 12 : 0)} d={d} phase={t * 0.15 + i * 0.4} />
          </g>
        ))}
        {/* crossovers holding the bundle together */}
        {[-100, -20, 60, 120].map((x, i) => (
          <path key={i} d={`M ${x} ${plate[0] + 6} C ${x + 8} ${plate[1]} ${x - 8} ${plate[1]} ${x} ${plate[2] - 6}`} fill="none" stroke={M.dnaDeep} strokeWidth={2} />
        ))}
      </g>
      {/* concealed ligands on tethers under the plate */}
      <g>
        {lig.map(([x, , back], i) => (
          <g key={i} opacity={back ? 0.55 : 1}>
            <line x1={x + (back ? 6 : 0)} y1={plate[2] + 7} x2={x + (back ? 6 : 0)} y2={plate[2] + ligDrop} stroke={INK} strokeWidth={1.6} />
            <Peptide x={x + (back ? 6 : 0)} y={plate[2] + ligDrop + 7} r={back ? 7.5 : 9} seed={i} glow={glow} />
          </g>
        ))}
      </g>
      {/* two shield flaps, hinged at the outer ends, latched at the centre by pH locks */}
      {[-1, 1].map((side) => (
        <g key={side} transform={`rotate(${-side * ang} ${side * (L / 2 - 2)} 7)`} opacity={shellOp}>
          {flapY.map((y, i) => (
            <g key={i} transform={`translate(${side > 0 ? 3 : -L / 2 - 1} ${y})`}>
              <Helix L={L / 2 - 2} d={d} phase={t * 0.15 + i * 0.7 + side} />
            </g>
          ))}
          <path d={`M ${side * 40} ${flapY[0] + 6} C ${side * 48} ${(flapY[0] + flapY[1]) / 2} ${side * 32} ${(flapY[0] + flapY[1]) / 2} ${side * 40} ${flapY[1] - 6}`} fill="none" stroke={M.dnaDeep} strokeWidth={2} />
          {/* hinge strands from the plate */}
          <path d={`M ${side * (L / 2 - 8)} ${plate[2] + 6} Q ${side * (L / 2 + 6)} ${(plate[2] + flapY[0]) / 2} ${side * (L / 2 - 8)} ${flapY[0] - 6}`} fill="none" stroke={M.dnaDeep} strokeWidth={2.4} />
          {/* lock half: short strand stub at the free end */}
          <g transform={`translate(${side * 6} ${flapY[0] + 8})`}>
            <path d={`M 0 0 q ${side * -10} ${-10 - unlock * 6} ${side * -2} ${-22 - unlock * 4}`} fill="none" stroke={M.lock} strokeWidth={3.2} strokeLinecap="round" />
            <path d={`M 0 0 q ${side * -10} ${-10 - unlock * 6} ${side * -2} ${-22 - unlock * 4}`} fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" opacity={0.5} />
          </g>
        </g>
      ))}
      {/* the latch knot (locked) fades as the locks release */}
      <g opacity={(1 - smooth(unlock * 1.4)) * shellOp}>
        <path d={`M -10 ${flapY[0] - 4} C -4 ${flapY[0] - 16} 4 ${flapY[0] + 8} 10 ${flapY[0] - 4}`} fill="none" stroke={M.lock} strokeWidth={4} strokeLinecap="round" />
        <path d={`M -10 ${flapY[0] + 6} C -4 ${flapY[0] - 6} 4 ${flapY[0] + 18} 10 ${flapY[0] + 6}`} fill="none" stroke={M.lock} strokeWidth={4} strokeLinecap="round" />
        <circle cx={0} cy={flapY[0] + 1} r={5} fill={M.lock} stroke={INK} strokeWidth={1.3} />
      </g>
      {/* protons gathering on the locks (acidic surroundings) */}
      {protons > 0.01 && [0, 1, 2, 3, 4].map((i) => {
        const a = i * 1.3 + t * 0.8;
        const r = lerp(70, 16, smooth(protons)) + noise(t * 2 + i, i) * 4;
        return <circle key={i} cx={Math.cos(a) * r} cy={flapY[0] + Math.sin(a) * r * 0.6} r={3.2} fill="#FFE29A" stroke={INK} strokeWidth={0.9} opacity={smooth(protons) * (1 - smooth(unlock * 1.2 - 0.2))} />;
      })}
    </g>
  );
};

/** Bottom view of the ligand plate: the hexagonal peptide pattern (for the "pattern of peptides" cutaway). */
export const LigandHex: React.FC<{r?: number; reveal?: number; glow?: number; lines?: number; s?: number}> = ({r = 60, reveal = 1, glow = 0, lines = 0, s = 1}) => (
  <g transform={`scale(${s})`}>
    {lines > 0.01 && (
      <path d={closedPath(Array.from({length: 6}, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * r, Math.sin((i / 6) * Math.PI * 2) * r] as P), 0)} fill="none" stroke={M.peptide} strokeWidth={2} strokeDasharray="6 6" opacity={lines} />
    )}
    {Array.from({length: 6}, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      const k = smooth(clamp01(reveal * 1.6 - i * 0.12));
      return <g key={i} opacity={k} transform={`translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${0.6 + 0.4 * k})`}><Peptide x={0} y={0} r={9} glow={glow} seed={i} /></g>;
    })}
  </g>
);

// ------------------------------------------------------------------------------------------------ antibody-drug conjugate
/** IgG-style antibody, local origin at the hinge, arms up (−y). payloads: count of drug molecules on linkers (0..4).
 *  cut: per-payload linker cleaved (0..1) and released offset. */
export const Antibody: React.FC<{s?: number; t?: number; payloads?: number; cut?: number[]; release?: number[]; seed?: number; armSpread?: number; dim?: number; hide?: boolean[]}> = ({
  s = 1, t = 0, payloads = 4, cut = [], release = [], seed = 0, armSpread = 0, dim = 0, hide = [],
}) => {
  const fill = mixHex(M.antibody, '#3a3a4a', dim), deep = mixHex(M.antibodyDeep, '#2a2a33', dim), light = mixHex(M.antibodyLight, '#aaaaaa', dim);
  const arm = (side: number) => {
    const a = side * (38 + armSpread * 10 + drift(t, seed + side, 2) * 3);
    return (
      <g transform={`rotate(${a})`}>
        {/* heavy chain (inner) + light chain (outer) */}
        <ellipse cx={0} cy={-22} rx={9} ry={15} fill={fill} stroke={INK} strokeWidth={1.6} />
        <ellipse cx={0} cy={-50} rx={9} ry={14} fill={fill} stroke={INK} strokeWidth={1.6} />
        <ellipse cx={side * 13} cy={-26} rx={7} ry={13} fill={light} stroke={INK} strokeWidth={1.6} />
        <ellipse cx={side * 13} cy={-52} rx={7} ry={12} fill={light} stroke={INK} strokeWidth={1.6} />
        {/* binding tip */}
        <path d={`M ${-6} -64 Q ${side * 6} -72 ${side * 18} -64`} fill="none" stroke={deep} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  };
  // payload attachment sites along the stem/hinge
  const sites: [number, number, number][] = [[-11, -4, -1], [11, -4, 1], [-10, 26, -1], [10, 26, 1]];
  return (
    <g transform={`scale(${s})`}>
      {/* Fc stem */}
      <ellipse cx={-7} cy={22} rx={9} ry={15} fill={deep} stroke={INK} strokeWidth={1.6} />
      <ellipse cx={7} cy={22} rx={9} ry={15} fill={deep} stroke={INK} strokeWidth={1.6} />
      <ellipse cx={-7} cy={48} rx={9} ry={13} fill={deep} stroke={INK} strokeWidth={1.6} />
      <ellipse cx={7} cy={48} rx={9} ry={13} fill={deep} stroke={INK} strokeWidth={1.6} />
      {arm(-1)}
      {arm(1)}
      <circle cx={0} cy={0} r={5} fill={light} stroke={INK} strokeWidth={1.4} />
      {sites.slice(0, payloads).map(([x, y, side], i) => {
        const c = cut[i] ?? 0, r = release[i] ?? 0;
        const lx = x + side * 22, ly = y + 6;
        const px = lx + side * r * 40, py = ly + r * 30;
        return (
          <g key={i}>
            {/* linker: intact = one strand; cut = two frayed ends */}
            {c < 0.5 ? (
              <path d={`M ${x} ${y} Q ${x + side * 10} ${y - 6} ${lx} ${ly}`} fill="none" stroke={M.linker} strokeWidth={3} strokeLinecap="round" />
            ) : (
              <>
                <path d={`M ${x} ${y} Q ${x + side * 6} ${y - 4} ${x + side * 9} ${y - 2}`} fill="none" stroke={M.linker} strokeWidth={3} strokeLinecap="round" />
                <path d={`M ${px - side * 9} ${py - 3} L ${px} ${py}`} fill="none" stroke={M.linker} strokeWidth={3} strokeLinecap="round" opacity={1 - r} />
              </>
            )}
            {!hide[i] && <Payload x={px} y={py} r={8} rot={t * 20 * (r > 0 ? 1 : 0) + i * 30} />}
          </g>
        );
      })}
    </g>
  );
};

/** Drug payload: a small hexagonal molecule (orange). */
export const Payload: React.FC<{x: number; y: number; r?: number; rot?: number; op?: number; glow?: number}> = ({x, y, r = 8, rot = 0, op = 1, glow = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={op}>
    {glow > 0.01 && <circle r={r * 2.2} fill={M.payload} opacity={0.25 * glow} />}
    <path d={closedPath(Array.from({length: 6}, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * r, Math.sin((i / 6) * Math.PI * 2) * r] as P), 0)} fill={M.payload} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
    <circle r={r * 0.35} fill={M.payloadDeep} />
  </g>
);

/** The ADC's surface target (a generic receptor; not a death receptor). Membrane at y = 0, outside up. */
export const TargetReceptor: React.FC<{s?: number; t?: number; seed?: number; bound?: number}> = ({s = 1, t = 0, seed = 0, bound = 0}) => {
  const sway = drift(t, seed + 9, 2.2) * 7 * (1 - bound);
  return (
    <g transform={`scale(${s})`}>
      <rect x={-3.5} y={-14} width={7} height={30} rx={3.5} fill={M.targetDeep} stroke={INK} strokeWidth={1.4} />
      <g transform={`rotate(${sway} 0 -12)`}>
        <path d="M -12 -18 C -16 -40 -14 -58 0 -64 C 14 -58 16 -40 12 -18 Z" fill={M.target} stroke={INK} strokeWidth={1.6} />
        <path d="M -6 -50 Q 0 -56 6 -50" fill="none" stroke="#C9F2D4" strokeWidth={2} strokeLinecap="round" />
      </g>
      <rect x={-7} y={14} width={14} height={11} rx={4} fill={M.targetDeep} stroke={INK} strokeWidth={1.4} />
    </g>
  );
};

/** An enzyme with an active-site cleft (violet). bite: 0..1 closes the cleft on a substrate. */
export const Enzyme: React.FC<{s?: number; t?: number; seed?: number; bite?: number; flash?: number}> = ({s = 1, t = 0, seed = 0, bite = 0, flash = 0}) => {
  const gap = lerp(0.55, 0.12, smooth(bite));
  const pts: P[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + gap + (i / n) * (Math.PI * 2 - gap * 2);
    const r = 26 * (1 + 0.07 * noise(i * 0.9 + t * 0.4, seed));
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  pts.push([0, -6]);
  return (
    <g transform={`scale(${s})`}>
      {flash > 0.01 && <circle cx={0} cy={-26} r={30 * flash + 6} fill="#FFFFFF" opacity={0.6 * (1 - flash)} />}
      <path d={closedPath(pts, 0.8)} fill={M.enzyme} stroke={INK} strokeWidth={1.8} />
      <path d="M -12 8 Q 0 16 12 8" fill="none" stroke={M.enzymeDeep} strokeWidth={3} strokeLinecap="round" />
      <circle cx={-9} cy={-2} r={3} fill="#D9CCFA" />
    </g>
  );
};

/** A closed bilayer ring (vesicle / endosome / lysosome), centre (0,0), radius r. lumen colours the inside. */
export const Vesicle: React.FC<{r: number; lumen?: string; lumenOp?: number; step?: number; th?: number; t?: number; seed?: number}> = ({r, lumen = M.cyto, lumenOp = 0.5, step = 10, th = 24, t = 0, seed = 0}) => {
  const n = Math.max(12, Math.round((Math.PI * 2 * r) / step));
  const heads: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = noise(i * 0.7 + t * 1.5, seed + 3) * 0.8;
    heads.push(<circle key={'o' + i} cx={Math.cos(a) * (r + th / 2 + j)} cy={Math.sin(a) * (r + th / 2 + j)} r={4.4} fill={M.membraneDeep} stroke={INK} strokeWidth={1.4} />);
    heads.push(<circle key={'i' + i} cx={Math.cos(a) * (r - th / 2 + j)} cy={Math.sin(a) * (r - th / 2 + j)} r={4.4} fill={M.membrane} stroke={INK} strokeWidth={1.4} />);
  }
  return (
    <g>
      <circle r={r - th / 2} fill={lumen} opacity={lumenOp} />
      <circle r={r} fill="none" stroke={M.membraneCore} strokeWidth={th} />
      {heads}
    </g>
  );
};
