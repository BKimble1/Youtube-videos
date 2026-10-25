// Glass Climbing V3: the pad pressed onto a surface, close, in section (millimetres; the surface on the left, the pad
// on the right, "down" is down, as the bay). The pad's silicone tile layer (9 mm) lies between the surface and the
// rigid plate; the posts and grip bar stand off the plate's back with his hand closed round the bar, the foot strap
// hangs from the ring at the bottom.
//   - On smooth glass, pressed and pulled down, the soft layer gives: it thins, bulges a little at its ends, and its
//     whole face goes dark with contact (light passes into the glass where it touches); the plate shears down a hair.
//   - On rough brick the same layer cannot follow the surface: it touches only the peaks (small dark contact marks)
//     and stays apart from it everywhere else (dark gaps); it barely compresses.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK, Inked} from '../dc/ink';
import {add, clamp, fmt, mul, P, perp, sub, V} from '../dc/math';
import {Capsule, Lin} from '../dc/shade';
import {Hand, HandPose} from '../dc/Hand';
import {Cam, Layer} from '../dc/camera';
import {PLATE, POST, WEB} from '../art/Pad';
import {HERO} from '../world/pose';
import {dirOf, handUV} from '../world/rig';

export const PRESS = {h: 200, tile: 14, plate: 24, post: 70, postY: 74, barR: 13};
const TILE_C = '#CFE3E6';
const BRICK = '#A9573D';
/** the brick's face at the millimetre scale: x(y) <= 0, the peaks at 0 */
export const brickMM = (y: number) => {
  const a = Math.sin(y * 0.21 + 1.1) * 0.55 + Math.sin(y * 0.083 + 0.3) * 0.3 + Math.sin(y * 0.47 + 2.4) * 0.15;
  return -Math.max(0, 8.5 * (0.62 - a * 0.6) - 1.6);
};

export type PressState = {
  surface: 'glass' | 'brick';
  /** 0..1: how hard the pad is pressed and pulled (compression, contact) */
  press: number;
  /** the plate's travel down (mm) relative to the tile layer under the pull */
  shear: number;
  /** the pad's offset from the surface (mm; 0 = on it) and its tilt (deg, + = top edge away, peeling from the top) */
  gap: number;
  tilt: number;
  /** the whole pad's slide down the surface (mm) */
  slide: number;
  hand: HandPose;
  /** the strap's slack (0 = taut) */
  sag: number;
};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${fmt(x0 + r)},${fmt(y0)} H${fmt(x1 - r)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} V${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} H${fmt(x0 + r)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} V${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;

export const PressContent: React.FC<{id: string; st: PressState; z: number}> = ({id, st, z}) => {
  const ink = 2.2 / Math.max(1e-6, z);
  const glass = st.surface === 'glass';
  const H = PRESS.h, hh = H / 2;
  // the soft layer: on glass it thins as it is pressed; on brick it rides on the peaks and barely gives
  const T = PRESS.tile * (1 - (glass ? 0.4 : 0.08) * st.press);
  const bulge = (glass ? 4 : 0.6) * st.press;
  const contactX = glass ? 0 : 0; // the layer's face at the surface's peaks (brick) or on the glass
  const pivot: V = {x: 0, y: -hh + st.slide}; // the pad tips about its top edge... (a peel from the top tips the BOTTOM edge in: see below)
  // a peel from the top: the top edge comes away, the bottom edge stays on: rotate about the bottom-front corner
  const piv: V = {x: contactX, y: hh + st.slide};
  const rot = `rotate(${fmt(-st.tilt)} ${fmt(piv.x)} ${fmt(piv.y)})`;
  void pivot;
  const layer = `M${fmt(contactX)},${fmt(-hh + st.slide - bulge)} Q${fmt(contactX + T * 0.5)},${fmt(-hh + st.slide - bulge * 1.4)} ${fmt(contactX + T)},${fmt(-hh + st.slide)} V${fmt(hh + st.slide)} Q${fmt(contactX + T * 0.5)},${fmt(hh + st.slide + bulge * 1.4)} ${fmt(contactX)},${fmt(hh + st.slide + bulge)} Z`;
  const px0 = contactX + T, py = st.slide + st.shear;
  const bx = px0 + PRESS.plate + PRESS.post;
  // the hand closed round the bar (its grip point on the bar's axis, as the rig places it), the forearm from his
  // side (to the right, rising toward the shoulder)
  const HL = 170, HANG = 186;
  const g = handUV(st.hand, 'grip');
  const d = dirOf(HANG);
  const wrist: V = sub(sub({x: bx, y: py + 4}, mul(d, g.u * HL)), mul(perp(d), g.v * HL));
  // the brick: its rough profile and the gaps where the layer cannot reach it
  const brickPts: V[] = [];
  for (let y = -900; y <= 900; y += 1.5) brickPts.push({x: brickMM(y), y});
  const gaps: string[] = [];
  if (!glass && st.gap < 0.5) {
    const g: V[] = [];
    for (let y = -hh + st.slide; y <= hh + st.slide; y += 1.5) g.push({x: brickMM(y), y});
    gaps.push(`M${fmt(contactX)},${fmt(-hh + st.slide)} L${g.map((p) => P(p)).join(' L')} L${fmt(contactX)},${fmt(hh + st.slide)} Z`);
  }
  const peaks: number[] = [];
  if (!glass) for (let y = -hh + 2; y <= hh - 2; y += 1.5) if (brickMM(y + st.slide) > -0.08) peaks.push(y + st.slide);
  return (
    <g>
      {/* behind: the street seen past the wall's edge, out of focus */}
      <rect x={-2000} y={-2000} width={4000} height={4000} fill={glass ? '#24414E' : '#3B2A26'} />
      {[[-260, -520, 160], [-140, 380, 120], [120, -760, 220], [300, 520, 180]].map(([x, y, r], i) => (
        <circle key={i} cx={x + 400} cy={y} r={r} fill="#FFFFFF" opacity={0.035} />
      ))}
      {/* the surface */}
      {glass ? (
        <g>
          <Lin id={`${id}-gl`} d="M-46,-2000 H0 V2000 H-46 Z" from={{x: -46, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#2F6A72'], [0.55, '#7DBDC0'], [0.92, '#B9E6E6'], [1, '#D9F6F5']]} />
          <path d="M-23,-2000 V2000" stroke="#6FB7AE" strokeWidth={fmt(ink * 0.8)} opacity={0.4} />
          {[-700, -380, -60, 260, 580].map((y, i) => (
            <path key={i} d={`M-40,${y + 90} L-8,${y - 60} L-4,${y - 40} L-36,${y + 110} Z`} fill="#FFFFFF" opacity={0.18} />
          ))}
          <path d="M-46,-2000 V2000" stroke={INK} strokeWidth={fmt(ink)} opacity={0.6} />
          <path d="M0,-2000 V2000" stroke="#F2FFFF" strokeWidth={fmt(ink * 1.2)} opacity={0.9} />
        </g>
      ) : (
        <g>
          <path d={`M-80,-900 L${brickPts.map((p) => P(p)).join(' L')} L-80,900 Z`} fill={BRICK} />
          <Lin id={`${id}-bs`} d="M-80,-900 H0 V900 H-80 Z" from={{x: -80, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#000000', 0.25], [1, '#FFFFFF', 0.06]]} />
          {Array.from({length: 70}).map((_, i) => (
            <circle key={i} cx={fmt(-6 - ((i * 37) % 70))} cy={fmt(-880 + ((i * 251) % 1760))} r={fmt(0.9 + (i % 4) * 0.7)} fill={i % 3 ? shade(BRICK, 0.4) : lit(BRICK, 0.3)} opacity={0.7} />
          ))}
          <path d={`M${brickPts.map((p) => P(p)).join(' L')}`} fill="none" stroke={lit(BRICK, 0.35)} strokeWidth={fmt(ink * 1.4)} opacity={0.8} />
          <path d={`M${brickPts.map((p) => P(p)).join(' L')}`} fill="none" stroke={INK} strokeWidth={fmt(ink * 0.8)} opacity={0.7} />
        </g>
      )}
      <g transform={rot}>
        <g transform={`translate(${fmt(st.gap)} 0)`}>
          {/* the strap from the ring at the plate's bottom, down toward his foot */}
          <path d={`M${fmt(px0 + 14)},${fmt(hh + py + 10)} Q${fmt(px0 + 30 + st.sag * 0.4)},${fmt(hh + py + 300 + st.sag)} ${fmt(px0 + 90)},${fmt(hh + py + 700)}`} fill="none" stroke={INK} strokeWidth={fmt(26 + ink * 2)} />
          <path d={`M${fmt(px0 + 14)},${fmt(hh + py + 10)} Q${fmt(px0 + 30 + st.sag * 0.4)},${fmt(hh + py + 300 + st.sag)} ${fmt(px0 + 90)},${fmt(hh + py + 700)}`} fill="none" stroke={WEB} strokeWidth={24} />
          <ellipse cx={fmt(px0 + 14)} cy={fmt(hh + py + 6)} rx={9} ry={12} fill="none" stroke={INK} strokeWidth={fmt(7 + ink)} />
          {/* the soft tile layer */}
          <Inked w={ink * 1.4}>
            <path d={layer} fill={mix(TILE_C, '#5E8C96', glass ? 0.15 * st.press : 0.05)} />
          </Inked>
          {/* the layer's working face: fine wedge ridges; on glass a band of contact darkens into it as it is pressed */}
          {Array.from({length: 66}).map((_, i) => {
            const y = -hh + st.slide + 3 + i * 3;
            return <path key={`r${i}`} d={`M${fmt(contactX + 0.2)},${fmt(y)} l${fmt(2.2 - 1.6 * (glass ? st.press : 0))},${fmt(1.4)}`} stroke="#6E9AA4" strokeWidth={0.6} opacity={0.8} />;
          })}
          {glass && st.gap < 0.5 && (
            <path d={`M${fmt(contactX + 1.6)},${fmt(-hh + st.slide - bulge + 3)} V${fmt(hh + st.slide + bulge - 3)}`} stroke="#1F4650" strokeWidth={fmt(3.2)} opacity={clamp(st.press * 1.2)} />
          )}
          {/* the plate (sheared down a hair by the pull), the posts, the bar */}
          <Inked w={ink * 1.4}>
            <Lin id={`${id}-pl`} d={rr(px0, -hh + py, px0 + PRESS.plate, hh + py, 3)} from={{x: px0, y: -hh}} to={{x: px0 + PRESS.plate, y: hh}} stops={[[0, mix(PLATE, '#AEBBC5', 0.35)], [1, shade(PLATE, 0.3)]]} />
          </Inked>
          <path d={`M${fmt(px0 + PRESS.plate - 4)},${fmt(-hh + py + 8)} V${fmt(hh + py - 8)}`} stroke={WEB} strokeWidth={3.2} opacity={0.85} />
          <Inked w={ink * 1.4}>
            {[-PRESS.postY, PRESS.postY].map((v, i) => (
              <Capsule key={i} id={`${id}-po${i}`} a={{x: px0 + PRESS.plate, y: py + v}} b={{x: bx, y: py + v}} ra={7} rb={7} color={POST} spec={0.3} />
            ))}
          </Inked>
          <Inked w={ink * 1.4}>
            <Capsule id={`${id}-fa`} a={add(wrist, {x: 430, y: -150})} b={add(wrist, mul(d, -8))} ra={44} rb={33} color={HERO.skin} spec={0.2} />
            <Hand id={`${id}-h`} wrist={wrist} ang={HANG} L={HL} thumbSide={1} view="back" pose={st.hand} color={HERO.skin} ink={ink * 1.2} bare
              hold={{front: [0, 1, 2, 3], obj: (
                <Inked w={ink * 1.4}>
                  <Capsule id={`${id}-bar`} a={{x: bx, y: py - PRESS.postY - 8}} b={{x: bx, y: py + PRESS.postY + 8}} ra={PRESS.barR} rb={PRESS.barR} color="#2C3338" spec={0.35} />
                </Inked>
              )}} />
          </Inked>
        </g>
      </g>
      {/* on brick: the dark gaps where the layer cannot reach the surface, and small contact marks on the peaks */}
      {gaps.map((d, i) => (
        <path key={i} d={d} fill="#140C0A" opacity={0.75} />
      ))}
      {peaks.map((y, i) => (
        <circle key={`p${i}`} cx={0.4} cy={fmt(y)} r={1.1} fill="#1F4650" opacity={0.8 * clamp(st.press * 1.5)} />
      ))}
    </g>
  );
};

export const PressView: React.FC<{id: string; st: PressState; cam: Cam}> = ({id, st, cam}) => (
  <Layer cam={cam} depth={1}>
    <PressContent id={id} st={st} z={cam.z} />
  </Layer>
);
