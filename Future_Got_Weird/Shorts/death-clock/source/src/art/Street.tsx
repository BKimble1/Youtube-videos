// A normal, warm suburban street: pastel sky, muted houses and lawns, a picket fence, rounded trees.
// Every surface is gradient-shaded from the same upper-left key light; no outlines, no textures.
// Layered by depth so the camera gets parallax: sky (8), far trees (3.2), houses (2), back lawn and
// sidewalk (1.35), the front lawn the man stands on (1), foreground tufts (0.62).
import React from 'react';
import {lit, mix, PAL, shade} from '../lib/color';
import {Cam, Layer} from '../lib/camera';
import {hash, P, V} from '../lib/math';
import {Blob, Capsule, Lin, SoftShadow, Sphere} from '../lib/shade';

const rect = (x: number, y: number, w: number, h: number) => `M${x},${y} h${w} v${h} h${-w} Z`;

export const Tree: React.FC<{id: string; x: number; y: number; s: number; tint?: number}> = ({id, x, y, s, tint = 0}) => {
  const g = mix('#7FAE6B', '#9DB59A', tint);
  const blobs: [number, number, number][] = [
    [-70, -300, 92],
    [60, -320, 100],
    [-10, -400, 110],
    [-110, -210, 70],
    [100, -220, 80],
    [10, -250, 96],
  ];
  return (
    <g>
      <SoftShadow id={`${id}-sh`} c={{x: x + 30 * s, y: y + 4 * s}} rx={150 * s} ry={22 * s} alpha={0.22} />
      <Capsule id={`${id}-tr`} a={{x, y: y - 20 * s}} b={{x: x + 6 * s, y: y - 230 * s}} ra={24 * s} rb={16 * s} color={mix('#8A6A50', '#9C8E84', tint)} spec={0.1} />
      {blobs.map(([dx, dy, r], i) => (
        <Sphere key={i} id={`${id}-c${i}`} c={{x: x + dx * s, y: y + dy * s}} r={r * s} color={i % 2 ? g : shade(g, 0.06)} k={0.9} />
      ))}
      {/* underside of the canopy in shadow */}
      <ellipse cx={x + 10 * s} cy={y - 175 * s} rx={130 * s} ry={34 * s} fill={shade(g, 0.4)} opacity={0.25} />
    </g>
  );
};

export const Bush: React.FC<{id: string; x: number; y: number; s: number; color?: string}> = ({id, x, y, s, color = '#7EA86A'}) => (
  <g>
    <SoftShadow id={`${id}-sh`} c={{x: x + 10 * s, y: y + 2 * s}} rx={110 * s} ry={16 * s} alpha={0.2} />
    {[
      [-50, -40, 52],
      [30, -50, 60],
      [-5, -70, 56],
      [70, -30, 40],
      [-85, -22, 34],
    ].map(([dx, dy, r], i) => (
      <Sphere key={i} id={`${id}-b${i}`} c={{x: x + dx * s, y: y + dy * s}} r={r * s} color={i % 2 ? color : shade(color, 0.07)} k={0.85} />
    ))}
  </g>
);

type HouseProps = {id: string; x: number; y: number; w: number; h: number; wall: string; roof: string; door: string; flip?: boolean};

export const House: React.FC<HouseProps> = ({id, x, y, w, h, wall, roof, door}) => {
  const side = w * 0.22; // visible side wall (in shadow: the light comes from the left)
  const roofH = h * 0.62;
  const trim = '#F6F2EA';
  const top = y - h;
  const win = (k: string, wx: number, wy: number, ww: number, wh: number) => (
    <g key={k}>
      <SoftShadow id={`${id}-${k}ws`} c={{x: wx + ww / 2 + 6, y: wy + wh + 8}} rx={ww * 0.7} ry={8} alpha={0.18} color="#3A3328" />
      <Lin id={`${id}-${k}wt`} d={rect(wx - 8, wy - 8, ww + 16, wh + 16)} from={{x: wx, y: wy}} to={{x: wx + ww, y: wy + wh}} stops={[[0, '#FFFFFF'], [1, '#DCD6CB']]} />
      <Lin id={`${id}-${k}wg`} d={rect(wx, wy, ww, wh)} from={{x: wx, y: wy}} to={{x: wx + ww * 0.4, y: wy + wh}} stops={[[0, '#CFE6EF'], [0.55, '#8FB4C6'], [1, '#6E8FA3']]} />
      <path d={`M${wx + ww * 0.15},${wy + wh} L${wx + ww * 0.55},${wy} L${wx + ww * 0.75},${wy} L${wx + ww * 0.35},${wy + wh} Z`} fill="#FFFFFF" opacity={0.28} />
      <rect x={wx + ww / 2 - 3} y={wy} width={6} height={wh} fill={trim} />
      <rect x={wx} y={wy + wh / 2 - 3} width={ww} height={6} fill={trim} />
    </g>
  );
  return (
    <g>
      <SoftShadow id={`${id}-gs`} c={{x: x + w * 0.55, y: y + 6}} rx={w * 0.75} ry={26} alpha={0.22} color="#2E3A26" />
      {/* side wall (shadow side) */}
      <Lin id={`${id}-sw`} d={`M${x + w},${y} L${x + w + side},${y - side * 0.28} L${x + w + side},${top - side * 0.28} L${x + w},${top} Z`} from={{x: x + w, y: top}} to={{x: x + w + side, y}} stops={[[0, shade(wall, 0.22)], [1, shade(wall, 0.32)]]} />
      {/* front wall */}
      <Lin id={`${id}-fw`} d={rect(x, top, w, h)} from={{x, y: top}} to={{x: x + w, y}} stops={[[0, lit(wall, 0.18)], [0.5, wall], [1, shade(wall, 0.1)]]} />
      {/* roof: lit front gable and darker side slope */}
      <Lin id={`${id}-rs`} d={`M${x + w / 2},${top - roofH} L${x + w + side + 14},${top - side * 0.28 - 8} L${x + w + 14},${top + 10} Z`} from={{x: x + w / 2, y: top - roofH}} to={{x: x + w + side, y: top}} stops={[[0, shade(roof, 0.18)], [1, shade(roof, 0.36)]]} />
      <Lin id={`${id}-rf`} d={`M${x - 22},${top + 12} L${x + w / 2},${top - roofH} L${x + w + 22},${top + 12} L${x + w + 4},${top + 22} L${x + w / 2},${top - roofH + 30} L${x - 4},${top + 22} Z`} from={{x, y: top - roofH}} to={{x: x + w, y: top}} stops={[[0, lit(roof, 0.22)], [1, shade(roof, 0.12)]]} />
      {/* gable infill */}
      <Lin id={`${id}-gf`} d={`M${x + 2},${top + 14} L${x + w / 2},${top - roofH + 34} L${x + w - 2},${top + 14} Z`} from={{x, y: top - roofH}} to={{x: x + w, y: top}} stops={[[0, lit(wall, 0.1)], [1, shade(wall, 0.12)]]} />
      {/* eave shadow under the roof */}
      <Lin id={`${id}-es`} d={rect(x, top + 10, w, 26)} from={{x, y: top + 10}} to={{x, y: top + 36}} stops={[[0, '#2C2620', 0.22], [1, '#2C2620', 0]]} />
      {win('wa', x + w * 0.12, top + h * 0.22, w * 0.22, h * 0.28)}
      {win('wb', x + w * 0.62, top + h * 0.22, w * 0.22, h * 0.28)}
      {win('wc', x + w * 0.39, top - roofH * 0.5 + 6, w * 0.22, roofH * 0.26)}
      {/* door + step */}
      <Lin id={`${id}-dt`} d={rect(x + w * 0.4 - 8, y - h * 0.48 - 8, w * 0.2 + 16, h * 0.48 + 8)} from={{x, y: y - h}} to={{x: x + w, y}} stops={[[0, '#FFFFFF'], [1, '#DCD6CB']]} />
      <Lin id={`${id}-dr`} d={rect(x + w * 0.4, y - h * 0.48, w * 0.2, h * 0.48)} from={{x: x + w * 0.4, y: y - h * 0.48}} to={{x: x + w * 0.6, y}} stops={[[0, lit(door, 0.2)], [1, shade(door, 0.2)]]} />
      <circle cx={x + w * 0.56} cy={y - h * 0.24} r={4} fill="#E8D7A0" />
      <Lin id={`${id}-st`} d={rect(x + w * 0.36, y - 6, w * 0.28, 14)} from={{x, y: y - 6}} to={{x, y: y + 8}} stops={[[0, '#ECE8E0'], [1, '#B9B3A8']]} />
    </g>
  );
};

/** Grass tuft: a few tapered blades, gradient-shaded, no outlines. */
export const Tuft: React.FC<{id: string; x: number; y: number; s: number; seed: number; color?: string}> = ({id, x, y, s, seed, color = PAL.grass}) => {
  const n = 5;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const a = (hash(i, seed) - 0.5) * 50 + (i - n / 2) * 9;
        const L = (50 + hash(i + 9, seed) * 60) * s;
        const bx = x + (i - n / 2) * 7 * s;
        const tip = {x: bx + Math.sin((a * Math.PI) / 180) * L, y: y - Math.cos((a * Math.PI) / 180) * L};
        const c = mix(shade(color, 0.25), lit(color, 0.15), hash(i + 3, seed));
        return (
          <Lin
            key={i}
            id={`${id}-${i}`}
            d={`M${bx - 6 * s},${y} Q${P({x: (bx + tip.x) / 2 - 4 * s, y: (y + tip.y) / 2})} ${P(tip)} Q${P({x: (bx + tip.x) / 2 + 6 * s, y: (y + tip.y) / 2})} ${bx + 6 * s},${y} Z`}
            from={{x: bx, y}}
            to={tip}
            stops={[[0, shade(c, 0.2)], [1, lit(c, 0.2)]]}
          />
        );
      })}
    </g>
  );
};

export type StreetProps = {id: string; cam: Cam; children?: React.ReactNode; fg?: React.ReactNode; groundTone?: number};

export const SKY_TOP = '#CFE8F2';

/** The street around the man. World units: the man stands on the front lawn (y ~ 1500-1800). */
export const Street: React.FC<StreetProps> = ({id, cam, children, fg}) => {
  const lawnTop = 1330;
  return (
    <g>
      <Layer cam={cam} depth={8}>
        <Lin id={`${id}-sky`} d={rect(-3000, -3000, 7080, 4400)} from={{x: 0, y: -400}} to={{x: 0, y: 1300}} stops={[[0, SKY_TOP], [0.7, PAL.sky], [1, '#EEF4EC']]} />
        {/* warm sun glow, upper left (local, not a screen-wide haze) */}
        <SoftShadow id={`${id}-sun`} c={{x: -80, y: 160}} rx={560} ry={560} alpha={0.5} color="#FFF4DC" core={0.1} />
        {[
          [160, 330, 1.1],
          [780, 220, 0.9],
          [1180, 420, 1.2],
        ].map(([cx, cy, k], i) => (
          <g key={i} opacity={0.85}>
            {[
              [-80, 10, 70],
              [0, -20, 90],
              [90, 6, 64],
              [30, 30, 70],
            ].map(([dx, dy, r], j) => (
              <Sphere key={j} id={`${id}-cl${i}${j}`} c={{x: cx + dx * k, y: cy + dy * k}} r={r * k} ry={r * k * 0.7} color="#F7FBFC" k={0.35} />
            ))}
          </g>
        ))}
      </Layer>
      <Layer cam={cam} depth={3.2}>
        {[-500, -200, 120, 420, 760, 1080, 1380, 1650].map((x, i) => (
          <Tree key={i} id={`${id}-ft${i}`} x={x} y={1150 + (i % 2) * 10} s={0.55 + (i % 3) * 0.05} tint={0.55} />
        ))}
      </Layer>
      <Layer cam={cam} depth={2}>
        <Lin id={`${id}-yard`} d={rect(-2400, 1080, 6000, 600)} from={{x: 0, y: 1080}} to={{x: 0, y: 1300}} stops={[[0, mix(PAL.grass, '#C9D8BC', 0.35)], [1, PAL.grass]]} />
        <House id={`${id}-h1`} x={-420} y={1140} w={520} h={300} wall="#E9DCC2" roof="#8C6E62" door="#6E8C8A" />
        <House id={`${id}-h2`} x={300} y={1150} w={560} h={320} wall="#C4D3DC" roof="#5E6E7E" door="#B06A55" />
        <House id={`${id}-h3`} x={1050} y={1140} w={500} h={290} wall="#D3DDC4" roof="#9B7A64" door="#4F6E8C" />
        <Bush id={`${id}-b1`} x={-180} y={1150} s={0.9} />
        <Bush id={`${id}-b2`} x={220} y={1160} s={0.8} color="#86AE6E" />
        <Bush id={`${id}-b3`} x={930} y={1160} s={0.95} />
        <Tree id={`${id}-t1`} x={180} y={1170} s={0.95} />
        <Tree id={`${id}-t2`} x={1000} y={1175} s={1.05} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* back lawn strip, picket fence, sidewalk and curb: on the ground layer with the front lawn, so the ground never slides over itself */}
        <Lin id={`${id}-bl`} d={rect(-2400, 1150, 6000, 200)} from={{x: 0, y: 1150}} to={{x: 0, y: 1300}} stops={[[0, mix(PAL.grass, PAL.grassLight, 0.3)], [1, PAL.grass]]} />
        {Array.from({length: 46}).map((_, i) => {
          const x = -900 + i * 62;
          return (
            <g key={i}>
              <Lin id={`${id}-pk${i}`} d={`M${x},1250 L${x},1176 L${x + 13},1162 L${x + 26},1176 L${x + 26},1250 Z`} from={{x, y: 1160}} to={{x: x + 26, y: 1250}} stops={[[0, '#FFFFFF'], [0.6, '#EFEBE3'], [1, '#C9C3B8']]} />
            </g>
          );
        })}
        <Lin id={`${id}-rl`} d={rect(-900, 1190, 2900, 12)} from={{x: 0, y: 1190}} to={{x: 0, y: 1202}} stops={[[0, '#F7F4EE'], [1, '#CFC9BE']]} />
        <Lin id={`${id}-rl2`} d={rect(-900, 1228, 2900, 12)} from={{x: 0, y: 1228}} to={{x: 0, y: 1240}} stops={[[0, '#F7F4EE'], [1, '#CFC9BE']]} />
        <Lin id={`${id}-fsh`} d={rect(-2400, 1250, 6000, 30)} from={{x: 0, y: 1250}} to={{x: 0, y: 1280}} stops={[[0, '#2F3D24', 0.22], [1, '#2F3D24', 0]]} />
        <Lin id={`${id}-sw`} d={rect(-2400, 1286, 6000, 64)} from={{x: 0, y: 1286}} to={{x: 0, y: 1350}} stops={[[0, '#E9E5DD'], [1, '#CFCAC0']]} />
        {Array.from({length: 30}).map((_, i) => (
          <rect key={i} x={-900 + i * 180} y={1286} width={4} height={64} fill="#BDB7AC" opacity={0.55} />
        ))}
        <Lin id={`${id}-cb`} d={rect(-2400, 1350, 6000, 10)} from={{x: 0, y: 1350}} to={{x: 0, y: 1360}} stops={[[0, '#D8D3CA'], [1, '#A9A397']]} />
        {/* the front lawn: lighter far, a touch deeper near, a few tufts for scale */}
        <Lin id={`${id}-fl`} d={rect(-2400, lawnTop, 6000, 3000)} from={{x: 0, y: lawnTop}} to={{x: 0, y: 2300}} stops={[[0, mix(PAL.grass, PAL.grassLight, 0.45)], [0.45, PAL.grass], [1, mix(PAL.grass, PAL.grassDeep, 0.55)]]} />
        {Array.from({length: 22}).map((_, i) => (
          <Tuft key={i} id={`${id}-tf${i}`} x={-600 + hash(i, 4) * 2400} y={1420 + hash(i, 7) * 700} s={0.35 + hash(i, 11) * 0.25} seed={i} />
        ))}
        {children}
      </Layer>
      <Layer cam={cam} depth={0.62}>
        {fg}
      </Layer>
    </g>
  );
};

export const FrontTufts: React.FC<{id: string; xs: [number, number, number][]}> = ({id, xs}) => (
  <g>
    {xs.map(([x, y, s], i) => (
      <Tuft key={i} id={`${id}-${i}`} x={x} y={y} s={s} seed={40 + i} color={PAL.grassDeep} />
    ))}
  </g>
);

export type {V};
export {Blob};
