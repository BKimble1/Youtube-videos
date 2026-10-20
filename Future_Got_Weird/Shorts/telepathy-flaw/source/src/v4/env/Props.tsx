// V4 café props in the crew finish (gradient fills from the upper-left key light, one ink contour per object):
// a side-on café chair, a small round bistro table, cups with saucers and steam, a takeaway cup, a phone. All sizes
// are in the characters' rig units at scale 1 (head radius 96, seat height 250, table top 420 above the floor).
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../../lib/ink';
import {add, fmt, mul, P, V} from '../../lib/math';
import {Blob, Capsule, Lin, SoftShadow} from '../../lib/shade';

export const PROP = {
  seatH: 250,
  tableH: 420,
  chairWood: '#B9825A',
  chairDark: '#8A5A3A',
  tableTop: '#E8D9C2',
  metal: '#5E6F7E',
  cup: '#FFFFFF',
  coffee: '#6B4226',
};

export const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${fmt(x + r)},${fmt(y)} L${fmt(x + w - r)},${fmt(y)} Q${fmt(x + w)},${fmt(y)} ${fmt(x + w)},${fmt(y + r)} L${fmt(x + w)},${fmt(y + h - r)} Q${fmt(x + w)},${fmt(y + h)} ${fmt(x + w - r)},${fmt(y + h)} L${fmt(x + r)},${fmt(y + h)} Q${fmt(x)},${fmt(y + h)} ${fmt(x)},${fmt(y + h - r)} L${fmt(x)},${fmt(y + r)} Q${fmt(x)},${fmt(y)} ${fmt(x + r)},${fmt(y)} Z`;

/** Side-on café chair. (x, floor) = the middle of the seat on the floor; `fx` = the side the sitter faces (-1 left, +1 right);
 *  the backrest is on the opposite side. `slide` shifts the whole chair (recoil). */
export const Chair: React.FC<{id: string; x: number; floor: number; s?: number; fx: -1 | 1; tilt?: number; wood?: string}> = ({id, x, floor, s = 1, fx, tilt = 0, wood = PROP.chairWood}) => {
  const ink = 5.4 * s;
  const W = 230 * s; // seat depth
  const sy = floor - PROP.seatH * s; // seat top
  const back = -fx; // direction of the backrest from the seat centre
  const X = (u: number) => x + u * s;
  const seatD = rr(x - W / 2, sy, W, 22 * s, 9 * s);
  const legCol = shade(wood, 0.28);
  const farCol = shade(wood, 0.5);
  const lean = tilt * Math.PI / 180;
  const pivot = {x: x - back * (W / 2), y: floor}; // chair tips about its back feet
  const rot = `rotate(${fmt(back * -tilt)} ${fmt(pivot.x)} ${fmt(pivot.y)})`;
  return (
    <g transform={rot}>
      <SoftShadow id={`${id}-sh`} c={{x: x + 6 * s, y: floor + 3 * s}} rx={W * 0.62} ry={14 * s} alpha={0.28} />
      {/* far legs (darker, behind) */}
      <Inked w={ink * 0.8}>
        <Capsule id={`${id}-fl1`} a={{x: X(-fx * 78 + 14), y: sy + 18 * s}} b={{x: X(-fx * 80 + 12), y: floor - 3 * s}} ra={9 * s} rb={7 * s} color={farCol} />
        <Capsule id={`${id}-fl2`} a={{x: X(fx * 74 + 14), y: sy + 18 * s}} b={{x: X(fx * 80 + 12), y: floor - 3 * s}} ra={9 * s} rb={7 * s} color={farCol} />
      </Inked>
      {/* backrest: two posts and slats */}
      <Inked w={ink}>
        <Capsule id={`${id}-bp`} a={{x: X(back * 102), y: sy + 10 * s}} b={{x: X(back * 112 + back * 10), y: sy - 250 * s}} ra={11 * s} rb={9 * s} color={wood} spec={0.2} />
        <Capsule id={`${id}-bl`} a={{x: X(back * 100), y: sy + 14 * s}} b={{x: X(back * 100), y: floor - 3 * s}} ra={11 * s} rb={8 * s} color={wood} spec={0.2} />
        <Blob id={`${id}-bs1`} d={rr(back > 0 ? X(86) : X(-122), sy - 230 * s, 36 * s, 62 * s, 14 * s)} c={{x: X(back * 104), y: sy - 200 * s}} r={60 * s} color={wood} k={0.8} />
        <Blob id={`${id}-bs2`} d={rr(back > 0 ? X(86) : X(-122), sy - 150 * s, 36 * s, 56 * s, 14 * s)} c={{x: X(back * 104), y: sy - 124 * s}} r={60 * s} color={wood} k={0.8} />
      </Inked>
      {/* seat slab */}
      <Inked w={ink}>
        <Blob id={`${id}-seat`} d={seatD} c={{x: X(-10), y: sy + 6 * s}} r={150 * s} color={mix(wood, '#E7C9A0', 0.35)} k={0.8} />
      </Inked>
      <Deco>
        <ellipse cx={fmt(X(-fx * 36))} cy={fmt(sy + 5 * s)} rx={fmt(60 * s)} ry={fmt(3.2 * s)} fill="#FFFFFF" opacity={0.35} />
      </Deco>
      {/* near front leg and a rung */}
      <Inked w={ink}>
        <Capsule id={`${id}-nl1`} a={{x: X(fx * 92), y: sy + 18 * s}} b={{x: X(fx * 98), y: floor - 3 * s}} ra={11 * s} rb={8 * s} color={legCol} spec={0.2} />
        <Capsule id={`${id}-rung`} a={{x: X(-fx * 74), y: floor - 78 * s}} b={{x: X(fx * 93), y: floor - 78 * s}} ra={5 * s} rb={5 * s} color={legCol} />
      </Inked>
    </g>
  );
};
void lit;
void P;

/** Round bistro table: thin top (seen from slightly above), a pedestal and a flat foot. */
export const Table: React.FC<{id: string; x: number; floor: number; s?: number; w?: number}> = ({id, x, floor, s = 1, w = 330}) => {
  const ink = 5.4 * s;
  const ty = floor - PROP.tableH * s;
  const rx = (w / 2) * s;
  const ry = 34 * s;
  return (
    <g>
      <SoftShadow id={`${id}-sh`} c={{x: x + 14 * s, y: floor + 4 * s}} rx={rx * 0.72} ry={12 * s} alpha={0.3} />
      <Inked w={ink}>
        <Capsule id={`${id}-ped`} a={{x, y: ty + 10 * s}} b={{x, y: floor - 14 * s}} ra={13 * s} rb={15 * s} color={PROP.metal} spec={0.3} />
        <Blob id={`${id}-foot`} d={`M${fmt(x - 96 * s)},${fmt(floor)} Q${fmt(x - 80 * s)},${fmt(floor - 22 * s)} ${fmt(x)},${fmt(floor - 22 * s)} Q${fmt(x + 80 * s)},${fmt(floor - 22 * s)} ${fmt(x + 96 * s)},${fmt(floor)} Z`} c={{x, y: floor - 8 * s}} r={100 * s} color={PROP.metal} k={0.9} />
        <Blob id={`${id}-edge`} d={`M${fmt(x - rx)},${fmt(ty)} L${fmt(x - rx)},${fmt(ty + 20 * s)} Q${fmt(x)},${fmt(ty + 20 * s + ry * 1.9)} ${fmt(x + rx)},${fmt(ty + 20 * s)} L${fmt(x + rx)},${fmt(ty)} Z`} c={{x, y: ty + 12 * s}} r={rx} color={shade(PROP.tableTop, 0.18)} k={0.9} />
        <Blob id={`${id}-top`} d={`M${fmt(x - rx)},${fmt(ty)} Q${fmt(x - rx)},${fmt(ty - ry)} ${fmt(x)},${fmt(ty - ry)} Q${fmt(x + rx)},${fmt(ty - ry)} ${fmt(x + rx)},${fmt(ty)} Q${fmt(x + rx)},${fmt(ty + ry)} ${fmt(x)},${fmt(ty + ry)} Q${fmt(x - rx)},${fmt(ty + ry)} ${fmt(x - rx)},${fmt(ty)} Z`} c={{x: x - rx * 0.3, y: ty - ry * 0.3}} r={rx * 1.1} color={PROP.tableTop} k={0.7} />
      </Inked>
      <Deco>
        <ellipse cx={fmt(x - rx * 0.28)} cy={fmt(ty - ry * 0.38)} rx={fmt(rx * 0.45)} ry={fmt(ry * 0.24)} fill="#FFFFFF" opacity={0.5} />
      </Deco>
    </g>
  );
};

/** Cup on a saucer. (x, y) = the middle of the saucer's underside; `steam` 0..1 animates with `f`. */
export const Cup: React.FC<{id: string; x: number; y: number; s?: number; fx?: -1 | 1; f?: number; steam?: number; color?: string; fill?: number; tilt?: number; saucer?: boolean; ripple?: number; body?: boolean}> = ({id, x, y, s = 1, fx = 1, f = 0, steam = 1, color = PROP.cup, fill = 1, tilt = 0, saucer = true, ripple = 0, body: showBody = true}) => {
  const ink = 4.4 * s;
  const cw = 60 * s;
  const ch = 54 * s;
  const cy = y - (saucer ? 10 : 0) * s;
  const body = `M${fmt(x - cw)},${fmt(cy - ch)} L${fmt(x + cw)},${fmt(cy - ch)} Q${fmt(x + cw * 0.92)},${fmt(cy)} ${fmt(x + cw * 0.5)},${fmt(cy + 2 * s)} L${fmt(x - cw * 0.5)},${fmt(cy + 2 * s)} Q${fmt(x - cw * 0.92)},${fmt(cy)} ${fmt(x - cw)},${fmt(cy - ch)} Z`;
  const hx = x + fx * cw * 0.96;
  return (
    <g transform={tilt ? `rotate(${fmt(tilt)} ${fmt(x)} ${fmt(y)})` : undefined}>
      {saucer && (
        <Inked w={ink * 0.9}>
          <Blob id={`${id}-sc`} d={`M${fmt(x - 92 * s)},${fmt(y - 8 * s)} Q${fmt(x)},${fmt(y - 22 * s)} ${fmt(x + 92 * s)},${fmt(y - 8 * s)} Q${fmt(x + 60 * s)},${fmt(y + 4 * s)} ${fmt(x)},${fmt(y + 4 * s)} Q${fmt(x - 60 * s)},${fmt(y + 4 * s)} ${fmt(x - 92 * s)},${fmt(y - 8 * s)} Z`} c={{x, y: y - 8 * s}} r={96 * s} color="#F4F6F8" k={0.7} />
        </Inked>
      )}
      {showBody && <Inked w={ink}>
        <Capsule id={`${id}-hd`} a={{x: hx - fx * 6 * s, y: cy - ch * 0.78}} b={{x: hx + fx * 34 * s, y: cy - ch * 0.5}} ra={7 * s} rb={7 * s} color={color} k={0.7} />
        <Blob id={`${id}-bd`} d={body} c={{x: x - cw * 0.3, y: cy - ch * 0.6}} r={cw * 1.5} color={color} k={0.8} stops={[[0, '#FFFFFF'], [0.5, '#F6F8FA'], [0.85, '#D5DEE6'], [1, '#B6C4D0']]} />
      </Inked>}
      {showBody && <Deco>
        <ellipse cx={fmt(x)} cy={fmt(cy - ch)} rx={fmt(cw)} ry={fmt(11 * s)} fill="#3E2412" />
        <ellipse cx={fmt(x)} cy={fmt(cy - ch + 1 * s)} rx={fmt(cw * 0.94)} ry={fmt(8.5 * s)} fill={mix(PROP.coffee, '#C8905A', 0.25)} opacity={fill} />
        <ellipse cx={fmt(x - cw * 0.3)} cy={fmt(cy - ch + 1 * s)} rx={fmt(cw * 0.28)} ry={fmt(2.4 * s)} fill="#FFFFFF" opacity={0.3 * fill} />
        {ripple > 0.02 && [0, 1, 2].map((i) => {
          const ph = (f * 0.09 + i / 3) % 1;
          return <ellipse key={i} cx={fmt(x)} cy={fmt(cy - ch + 1 * s)} rx={fmt(cw * 0.9 * ph)} ry={fmt(7.5 * s * ph)} fill="none" stroke="#C8905A" strokeWidth={fmt(2 * s)} opacity={ripple * (1 - ph) * 0.9} />;
        })}
        <path d={`M${fmt(x - cw * 0.84)},${fmt(cy - ch * 0.82)} Q${fmt(x - cw * 0.78)},${fmt(cy - ch * 0.3)} ${fmt(x - cw * 0.42)},${fmt(cy - ch * 0.08)}`} fill="none" stroke="#FFFFFF" strokeWidth={fmt(5 * s)} strokeLinecap="round" opacity={0.65} />
        {steam > 0.02 &&
          [0, 1, 2].map((k) => {
            const ph = (f * 0.035 + k * 0.33) % 1;
            const sx = x + (k - 1) * cw * 0.45;
            const sy0 = cy - ch - 8 * s;
            const h = 70 * s;
            return (
              <path
                key={k}
                d={`M${fmt(sx)},${fmt(sy0)} q${fmt(-10 * s)},${fmt(-h * 0.3)} 0,${fmt(-h * 0.5)} q${fmt(10 * s)},${fmt(-h * 0.25)} 0,${fmt(-h * 0.5)}`}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={fmt(5 * s)}
                strokeLinecap="round"
                opacity={steam * 0.55 * Math.sin(Math.PI * ph)}
                transform={`translate(${fmt(Math.sin(ph * 6 + k) * 5 * s)} ${fmt(-ph * 22 * s)})`}
              />
            );
          })}
      </Deco>}
    </g>
  );
};

/** Handheld phone (screen toward the viewer). */
export const Phone: React.FC<{id: string; c: V; s?: number; ang?: number; glow?: string}> = ({id, c, s = 1, ang = 0, glow = '#46CFFF'}) => (
  <g transform={`rotate(${fmt(ang)} ${fmt(c.x)} ${fmt(c.y)})`}>
    <Inked w={4 * s}>
      <Blob id={`${id}-ph`} d={rr(c.x - 30 * s, c.y - 56 * s, 60 * s, 112 * s, 12 * s)} c={c} r={90 * s} color="#2B3A4A" k={0.8} />
    </Inked>
    <Deco>
      <path d={rr(c.x - 25 * s, c.y - 49 * s, 50 * s, 96 * s, 8 * s)} fill={glow} opacity={0.85} />
      <path d={rr(c.x - 25 * s, c.y - 49 * s, 50 * s, 40 * s, 8 * s)} fill="#FFFFFF" opacity={0.25} />
    </Deco>
  </g>
);

void INK;
void InkPath;
void InkLine;
void Lin;
void add;
void mul;

/** Takeaway paper cup with a lid and a coral sleeve; (x, y) = the base centre. */
export const PaperCup: React.FC<{id: string; x: number; y: number; s?: number; tilt?: number; f?: number; steam?: number}> = ({id, x, y, s = 1, tilt = 0, f = 0, steam = 0.6}) => {
  const ink = 4 * s;
  const h = 92 * s;
  const wt = 38 * s;
  const wb = 28 * s;
  const body = `M${fmt(x - wt)},${fmt(y - h)} L${fmt(x + wt)},${fmt(y - h)} L${fmt(x + wb)},${fmt(y)} L${fmt(x - wb)},${fmt(y)} Z`;
  const sleeve = `M${fmt(x - wt + 5 * s)},${fmt(y - h * 0.72)} L${fmt(x + wt - 5 * s)},${fmt(y - h * 0.72)} L${fmt(x + wb + 3 * s)},${fmt(y - h * 0.3)} L${fmt(x - wb - 3 * s)},${fmt(y - h * 0.3)} Z`;
  return (
    <g transform={tilt ? `rotate(${fmt(tilt)} ${fmt(x)} ${fmt(y)})` : undefined}>
      <Inked w={ink}>
        <Blob id={`${id}-b`} d={body} c={{x: x - wt * 0.3, y: y - h * 0.6}} r={h} color="#F7F2E8" k={0.8} stops={[[0, '#FFFFFF'], [0.6, '#F3EEE4'], [1, '#C9C1B0']]} />
        <Blob id={`${id}-l`} d={rr(x - wt - 5 * s, y - h - 14 * s, wt * 2 + 10 * s, 16 * s, 6 * s)} c={{x, y: y - h - 6 * s}} r={wt * 1.4} color="#3E4A55" k={0.8} />
      </Inked>
      <Deco>
        <path d={sleeve} fill="#EF6B55" />
        <path d={sleeve} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={fmt(2.4 * s)} />
        <path d={`M${fmt(x - wt + 8 * s)},${fmt(y - h * 0.6)} L${fmt(x - wb + 4 * s)},${fmt(y - h * 0.34)}`} stroke="#FFFFFF" strokeWidth={fmt(4 * s)} strokeLinecap="round" opacity={0.55} />
        {steam > 0.02 && [0, 1].map((k) => {
          const ph = (f * 0.035 + k * 0.5) % 1;
          const sx = x + (k - 0.5) * wt * 0.8;
          const sy0 = y - h - 22 * s;
          return <path key={k} d={`M${fmt(sx)},${fmt(sy0)} q${fmt(-8 * s)},${fmt(-24 * s)} 0,${fmt(-40 * s)} q${fmt(8 * s)},${fmt(-20 * s)} 0,${fmt(-36 * s)}`} fill="none" stroke="#FFFFFF" strokeWidth={fmt(4.5 * s)} strokeLinecap="round" opacity={steam * 0.55 * Math.sin(Math.PI * ph)} transform={`translate(0 ${fmt(-ph * 18 * s)})`} />;
        })}
      </Deco>
    </g>
  );
};
