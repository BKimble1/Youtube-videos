// S04: a lengthwise cutaway of the SAME left forearm under the band (arm horizontal, as in the close-up).
// Broad, unmistakable layers: skin (epidermis + dermis), yellow fat lobules, muscle tissue, and a red
// gradient vessel tube with its near wall cut away (near/far wall and a masked lumen). The band's
// fictional reservoir and micro-port sit on top. Stylized depiction of an invented mechanism.
import React from 'react';
import {Bead, BeadDefs, Dot, Path, pathAt, smoothPath} from './Beads';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {clamp, easeInOut, easeOut, fmt, hash, inv, lerp, noise1, V} from '../lib/math';
import {Blob, Glow, Lin, SoftShadow} from '../lib/shade';

export const XS = {
  skinTop: 600,
  epi: 628,
  dermis: 700,
  fatBot: 872,
  vY: 990,
  vR: 116, // outer radius
  vWall: 28,
  needles: [452, 506, 560, 614, 668],
  needleTip: 662,
  bandL: 330,
  bandR: 790,
};

const rect = (x: number, y: number, w: number, h: number) => `M${x},${y} h${w} v${h} h${-w} Z`;

/** Path of a bead leaving needle n: down through skin and fat, into the vessel, then up the arm (screen-right). */
export const injectPath = (n: number, lane: number): Path => {
  const x = XS.needles[n];
  const entryX = x + 50 + lane * 14;
  const laneY = XS.vY + lane * (XS.vR - XS.vWall - 16);
  return smoothPath(
    [
      {x, y: 512},
      {x, y: XS.needleTip},
      {x: x + 8 + lane * 6, y: 760},
      {x: entryX, y: XS.vY - XS.vR + 6},
      {x: entryX + 60, y: laneY},
      {x: entryX + 260, y: laneY + 4},
      {x: 1900, y: laneY},
    ],
    10,
  );
};

export type XSectionState = {
  f: number; // absolute frame
  cam: Cam;
  /** needle extension 0..1 */
  needle: number;
  /** injection start frame */
  t0: number;
};

export const CrossSection: React.FC<{id: string; st: XSectionState}> = ({id, st}) => {
  const {f, cam} = st;
  const vTop = XS.vY - XS.vR;
  const vBot = XS.vY + XS.vR;
  const lumen = XS.vR - XS.vWall;
  // flowing blood shading inside the lumen (slow drift so it reads as flow)
  const flow = (f * 6) % 400;

  // beads: emitted in a staggered stream from the reservoir through the needles
  const big: React.ReactNode[] = [];
  const small: React.ReactNode[] = [];
  const N = 380;
  for (let i = 0; i < N; i++) {
    const n = i % 5;
    const lane = (hash(i, 3) - 0.5) * 1.5;
    const te = st.t0 + (i / N) * 70 + hash(i, 9) * 4;
    const dur = 46 + hash(i, 4) * 14;
    const t = (f - te) / dur;
    if (t <= 0 || t >= 1.6) continue;
    const p = injectPath(n, lane);
    const {pt, dir} = pathAt(p, t / 1.6);
    small.push(<Dot key={i} p={pt} r={4 + hash(i, 6) * 4} opacity={0.9} />);
    void dir;
  }
  // three large beads to follow
  [
    [0, 1, -0.2],
    [10, 2, 0.15],
    [22, 3, -0.45],
  ].forEach(([d0, n, lane], k) => {
    const te = st.t0 + d0;
    const t = (f - te) / 72;
    if (t <= 0 || t >= 1.4) return;
    const {pt, dir} = pathAt(injectPath(n, lane), t / 1.4);
    big.push(<Bead key={k} id={`${id}-b`} p={pt} r={15} dir={dir} wake={3.2} />);
  });
  // waiting beads inside the reservoir (jiggling until released)
  const resv: React.ReactNode[] = [];
  for (let i = 0; i < 64; i++) {
    const release = st.t0 + (i / 64) * 70;
    if (f > release) continue;
    const bx = 400 + hash(i, 1) * 360;
    const by = 448 + hash(i, 2) * 88;
    resv.push(<Bead key={i} id={`${id}-b`} p={{x: bx + noise1(f * 0.3, i) * 4, y: by + noise1(f * 0.3, i + 50) * 4}} r={6 + hash(i, 5) * 4} halo={0.5} />);
  }

  return (
    <g>
      <BeadDefs id={`${id}-b`} />
      <Layer cam={cam} depth={3}>
        <Lin id={`${id}-bg`} d={rect(-3000, -3000, 7000, 8000)} from={{x: 0, y: -400}} to={{x: 0, y: 2000}} stops={[[0, '#3D5B70'], [1, '#22384A']]} />
        <Glow id={`${id}-bgg`} c={{x: 540, y: 500}} r={900} color="#7FB6D0" alpha={0.25} blend="normal" />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the arm's outer surface curving away beyond the cut (cylinder cue) */}
        <Lin id={`${id}-out`} d={rect(-2000, XS.skinTop - 70, 5000, 76)} from={{x: 0, y: XS.skinTop - 70}} to={{x: 0, y: XS.skinTop + 6}} stops={[[0, shade(PAL.skin, 0.25), 0], [0.35, PAL.skin], [1, lit(PAL.skin, 0.2)]]} />
        {/* cut face: muscle tissue base with soft fibre bands (gradients, no lines) */}
        <Lin id={`${id}-tis`} d={rect(-2000, XS.fatBot - 10, 5000, 2000)} from={{x: 0, y: XS.fatBot}} to={{x: 0, y: 2200}} stops={[[0, lit(PAL.tissue, 0.08)], [0.5, PAL.tissue], [1, shade(PAL.tissue, 0.3)]]} />
        {Array.from({length: 9}).map((_, i) => (
          <Lin key={i} id={`${id}-fb${i}`} d={rect(-2000, XS.fatBot + 300 + i * 120, 5000, 46)} from={{x: 0, y: XS.fatBot + 300 + i * 120}} to={{x: 0, y: XS.fatBot + 346 + i * 120}} stops={[[0, '#FFFFFF', 0], [0.5, '#FFFFFF', 0.12], [1, '#FFFFFF', 0]]} />
        ))}
        {/* fat layer: packed lobules */}
        <Lin id={`${id}-fat`} d={rect(-2000, XS.dermis, 5000, XS.fatBot - XS.dermis)} from={{x: 0, y: XS.dermis}} to={{x: 0, y: XS.fatBot}} stops={[[0, shade(PAL.fat, 0.12)], [1, shade(PAL.fat, 0.22)]]} />
        {Array.from({length: 40}).map((_, i) => {
          const x = -700 + i * 66 + (i % 2) * 18;
          const y = XS.dermis + 46 + (i % 3) * 40 + hash(i, 3) * 14;
          const r = 34 + hash(i, 7) * 12;
          return <Blob key={i} id={`${id}-fl${i}`} d={`M${x - r},${y} a${r},${r * 0.86} 0 1,0 ${2 * r},0 a${r},${r * 0.86} 0 1,0 ${-2 * r},0 Z`} c={{x, y}} r={r * 1.1} color={PAL.fat} k={0.8} />;
        })}
        {/* dermis + epidermis */}
        <Lin id={`${id}-der`} d={rect(-2000, XS.epi, 5000, XS.dermis - XS.epi)} from={{x: 0, y: XS.epi}} to={{x: 0, y: XS.dermis}} stops={[[0, PAL.skinLayer], [1, mix(PAL.skinLayer, PAL.tissue, 0.35)]]} />
        <Lin id={`${id}-epi`} d={rect(-2000, XS.skinTop, 5000, XS.epi - XS.skinTop)} from={{x: 0, y: XS.skinTop}} to={{x: 0, y: XS.epi}} stops={[[0, lit(PAL.skinLayer, 0.35)], [1, PAL.skinLayer]]} />
        {/* vessel: far wall interior, lumen with flowing shade, cut rims of the near wall */}
        <Lin id={`${id}-vfar`} d={rect(-2000, vTop, 5000, XS.vR * 2)} from={{x: 0, y: vTop}} to={{x: 0, y: vBot}} stops={[[0, lit(PAL.vessel, 0.15)], [0.5, PAL.vessel], [1, shade(PAL.vessel, 0.25)]]} />
        <Lin id={`${id}-lum`} d={rect(-2000, XS.vY - lumen, 5000, lumen * 2)} from={{x: 0, y: XS.vY - lumen}} to={{x: 0, y: XS.vY + lumen}} stops={[[0, shade(PAL.blood, 0.1)], [0.5, mix(PAL.blood, PAL.vessel, 0.25)], [1, shade(PAL.blood, 0.35)]]} />
        {Array.from({length: 8}).map((_, i) => (
          <ellipse key={i} cx={-400 + ((i * 400 + flow) % 3200)} cy={XS.vY + (i % 3 - 1) * 26} rx={170} ry={22} fill="#FF8A92" opacity={0.08} />
        ))}
        {/* tube interior: shadow under the top rim, lit lower inner wall (reads as a concave cylinder) */}
        <Lin id={`${id}-ish`} d={rect(-2000, XS.vY - lumen, 5000, lumen * 0.7)} from={{x: 0, y: XS.vY - lumen}} to={{x: 0, y: XS.vY - lumen * 0.3}} stops={[[0, '#3A0610', 0.55], [1, '#3A0610', 0]]} />
        <Lin id={`${id}-ihl`} d={rect(-2000, XS.vY + lumen * 0.35, 5000, lumen * 0.55)} from={{x: 0, y: XS.vY + lumen * 0.35}} to={{x: 0, y: XS.vY + lumen * 0.9}} stops={[[0, '#FF9AA2', 0], [0.6, '#FF9AA2', 0.22], [1, '#FF9AA2', 0]]} />
        <Lin id={`${id}-rimT`} d={rect(-2000, vTop, 5000, XS.vWall)} from={{x: 0, y: vTop}} to={{x: 0, y: vTop + XS.vWall}} stops={[[0, lit(PAL.vessel, 0.3)], [1, mix(PAL.vessel, '#F07A84', 0.3)]]} />
        <Lin id={`${id}-rimB`} d={rect(-2000, vBot - XS.vWall, 5000, XS.vWall)} from={{x: 0, y: vBot - XS.vWall}} to={{x: 0, y: vBot}} stops={[[0, mix(PAL.vessel, '#F07A84', 0.25)], [1, shade(PAL.vessel, 0.25)]]} />
        <Lin id={`${id}-vsh`} d={rect(-2000, vBot, 5000, 40)} from={{x: 0, y: vBot}} to={{x: 0, y: vBot + 40}} stops={[[0, '#5A1A20', 0.3], [1, '#5A1A20', 0]]} />
        {/* the device on top of the skin, cut through: case + glass, reservoir, port plate */}
        <SoftShadow id={`${id}-dsh`} c={{x: 560, y: XS.skinTop + 8}} rx={300} ry={22} alpha={0.35} color="#3A1A10" />
        <Lin id={`${id}-case`} d={`M${XS.bandL},${XS.skinTop} L${XS.bandL},${352} Q${XS.bandL},${300} ${XS.bandL + 52},${300} L${XS.bandR - 52},${300} Q${XS.bandR},${300} ${XS.bandR},${352} L${XS.bandR},${XS.skinTop} Z`} from={{x: XS.bandL, y: 300}} to={{x: XS.bandR, y: XS.skinTop}} stops={[[0, lit(PAL.band, 0.2)], [0.5, PAL.band], [1, PAL.bandDeep]]} />
        <Lin id={`${id}-glass`} d={rect(XS.bandL + 30, 312, XS.bandR - XS.bandL - 60, 34)} from={{x: 0, y: 312}} to={{x: 0, y: 346}} stops={[[0, '#2B3C5E'], [1, '#0B1428']]} />
        <rect x={XS.bandL + 40} y={316} width={150} height={7} rx={3.5} fill="#FFFFFF" opacity={0.5} />
        <Lin id={`${id}-res`} d={`M380,436 Q380,420 396,420 L724,420 Q740,420 740,436 L740,548 Q740,564 724,564 L396,564 Q380,564 380,548 Z`} from={{x: 380, y: 420}} to={{x: 740, y: 564}} stops={[[0, '#0E2A55'], [1, '#06142E']]} />
        <Glow id={`${id}-rg`} c={{x: 560, y: 490}} r={220} ry={80} color={PAL.signal} alpha={0.35} />
        {resv}
        <rect x={392} y={426} width={200} height={8} rx={4} fill="#FFFFFF" opacity={0.2} />
        {/* micro-port needles: tiny, silver, tapered */}
        {XS.needles.map((x, i) => {
          const tip = lerp(XS.skinTop - 4, XS.needleTip, st.needle);
          return <Lin key={i} id={`${id}-nd${i}`} d={`M${x - 7},${XS.skinTop - 6} L${x + 7},${XS.skinTop - 6} L${x + 1.2},${tip} L${x - 1.2},${tip} Z`} from={{x: x - 7, y: 0}} to={{x: x + 7, y: 0}} stops={[[0, '#F4F7FA'], [0.5, '#B8C2CC'], [1, '#7D8894']]} />;
        })}
        <Lin id={`${id}-plate`} d={rect(XS.bandL + 20, XS.skinTop - 22, XS.bandR - XS.bandL - 40, 18)} from={{x: 0, y: XS.skinTop - 22}} to={{x: 0, y: XS.skinTop - 4}} stops={[[0, '#2A4FB8'], [1, '#132E7A']]} />
        {/* the dense stream and the three followable beads */}
        <g>{small}</g>
        {big}
      </Layer>
    </g>
  );
};

export const crossCam = (f: number, s0: number, s1: number): Cam => {
  // start inside the device (matching the dive through the screen), pull back to reveal the layers,
  // then ease toward the vessel entry as the beads arrive
  const a = s0;
  const b = s0 + 42;
  const c = s1 - 26;
  const t1 = easeOut(inv(a, b, f));
  const t2 = easeInOut(inv(c, s1, f));
  return {
    x: lerp(lerp(560, 566, t1), 780, t2),
    y: lerp(lerp(470, 840, t1), 990, t2),
    z: lerp(lerp(3.4, 1.62, t1), 2.4, t2),
  };
};

export {clamp};
