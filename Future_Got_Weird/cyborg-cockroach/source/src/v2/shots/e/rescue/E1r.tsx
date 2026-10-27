// E1 (619-654, "But the plan is to send them"): a collapsed building in daylight. The film's daylight bloom (out of
// D5's lab window) resolves into a bright sky over a broken multi-storey facade (pancaked floors, hanging rebar, a dust
// plume); one eased crane down past the rubble heap to ground level settles on a narrow dark opening under a fallen
// slab, the medic (loaded injector) tiny on the dusty floor in front of it, walking toward it. Flat 2D layers at five
// depths (sky, the building, the heap, the ground with the opening and the medic, near chunks), so the crane parallaxes.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../../rig/roach';
import {Roach2D} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt, View} from '../../../roach/ortho';
import {Layer, Cam} from '../../../dc/camera';
import {smoother, clamp, rnd} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../../lib/color';
import {RB, Pt, Slab, Rebar, Pebbles, Motes, Glow2, VGrad, Pipe, jag, poly, line, f2} from '../art';
import {ShotProps} from '../../index2';
import {idf, endWrap, FPS} from './kit';

export const E1_N = 36;
/** the crane: from high on the facade down to the opening (end-frame px at the subject depth) */
const CRANE = 1250;
const END: Cam = {x: 540, y: 960, z: 1};
export const e1Cam = (lf: number): Cam => {
  const u = smoother(clamp(lf / 31));
  return {x: 540, y: END.y - CRANE * (1 - u), z: 1};
};
const D_SKY = 7, D_BLD = 3.2, D_HEAP = 1.9, D_GND = 1, D_FORE = 0.62;

// ---------------------------------------------------------------- the medic (ground layer, end-frame px)
const V_MM = 52;
export const E1_VIEW: View = viewAt(-68, 30, 1.3, [0, 0, 0], 452, 1468);
export const e1Pose = (lf: number): RoachPose => {
  const t = lf / FPS;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: 4 + V_MM * t, t: t + 20.6, search: 0.8, antL: {yaw: 0.5, pitch: 0.25}, antR: {yaw: 0.46, pitch: 0.28}, seed: 5});
};
/** the opening's mouth (end-frame px, ground layer) */
export const E1_MOUTH = {x0: 300, x1: 700, top: 1160, floor: 1330};

// ---------------------------------------------------------------- the sky and the far city
export const Sky: React.FC<{id: string}> = ({id}) => (
  <g>
    <VGrad id={`${id}-sk`} x0={-1500} y0={-1500} x1={2600} y1={3200} stops={[[0, '#9CC3DA'], [0.3, '#C9DFE6'], [0.45, '#F4E9CF'], [0.6, '#F8DDB0'], [1, '#E9C99A']]} />
    <Glow2 id={`${id}-sun`} cx={120} cy={-120} rx={900} ry={800} color={RB.dayHot} a={0.85} />
    {/* far blocks in the haze */}
    {[[-200, 560, 120], [-60, 470, 110], [700, 520, 140], [860, 430, 120], [1010, 600, 160]].map(([x, y, w], i) => (
      <path key={i} d={`M${x},${y} H${x + w} V1300 H${x} Z`} fill={mix('#A9B8C0', '#F4E9CF', 0.45)} opacity={0.75} />
    ))}
  </g>
);

// ---------------------------------------------------------------- the collapsed building
const FH = 122; // floor height (px)
const ROOF = 250;
export const Building: React.FC<{id: string; t: number}> = ({id, t}) => {
  const floors = 6;
  // the standing part's torn right edge, per floor
  const tear = [560, 520, 548, 470, 505, 440, 470];
  const facade: Pt[] = [[-200, ROOF], ...tear.map((x, i) => [x, ROOF + i * FH] as Pt).flatMap((p, i) => (i ? [[tear[i - 1] - 18, p[1] - 30] as Pt, p] : [p])), [-200, ROOF + floors * FH]];
  const wins: React.ReactNode[] = [];
  for (let fl = 0; fl < floors; fl++)
    for (let c = 0; c < 5; c++) {
      const x = -150 + c * 128, y = ROOF + fl * FH + 34;
      if (x + 76 > tear[fl] - 30) continue;
      const broken = rnd(fl * 7 + c, 3) < 0.45;
      wins.push(
        <g key={`w${fl}-${c}`}>
          <path d={`M${x},${y} h76 v58 h-76 Z`} fill={broken ? '#2E2A29' : '#5B6E78'} stroke={INK} strokeWidth={3.5} />
          {!broken && <path d={`M${x + 8},${y + 50} L${x + 34},${y + 8} L${x + 50},${y + 8} L${x + 24},${y + 50} Z`} fill="#C8DCE3" opacity={0.55} />}
          {broken && <path d={`M${x},${y} L${x + 30},${y} L${x + 12},${y + 22} Z`} fill="#8FA4AD" opacity={0.8} />}
        </g>,
      );
    }
  // floor slabs: broken cantilevers past the torn edge, sagging
  const slabs = Array.from({length: floors}, (_, i) => {
    const y = ROOF + (i + 1) * FH - 6;
    const x0 = tear[i + 1] - 20, len = 70 + rnd(i, 9) * 110, sag = 18 + rnd(i, 4) * 50;
    return {y, x0, x1: x0 + len, sag};
  });
  // the pancaked half: fallen floors stacked and sloping down to the right
  const pan = Array.from({length: 5}, (_, i) => {
    const yl = 560 + i * 92, yr = 780 + i * 62;
    return {yl, yr};
  });
  const plume = [[700, 420, 260], [860, 360, 300], [1000, 470, 240], [600, 520, 200]];
  return (
    <g>
      {/* dust plume behind */}
      {plume.map(([x, y, r], i) => (
        <Glow2 key={i} id={`${id}-pl${i}`} cx={x + 14 * Math.sin(t * 0.6 + i)} cy={y - 10 * t} rx={r} ry={r * 0.8} color={RB.dust} a={0.55} />
      ))}
      {/* the pancaked floors */}
      {pan.map(({yl, yr}, i) => (
        <g key={`p${i}`}>
          <path d={poly(jag([[470, yl - 8], [1300, yr - 8], [1300, yr + 70], [470, yl + 70]], 9, 30 + i, 50))} fill={mix('#2F2A28', RB.far, 0.2)} />
          <Slab id={`${id}-pn${i}`} face={jag([[480 - i * 10, yl], [1300, yr], [1300, yr + 30], [470 - i * 10, yl + 34]], 6, 40 + i, 44)} top={jag([[480 - i * 10, yl], [1300, yr], [1300, yr - 10], [495 - i * 10, yl - 12]], 3, 50 + i, 60)} tone={RB.concLit} w={4} dark={0.05 + i * 0.04} specks={10} rim={[[480 - i * 10, yl], [1300, yr]]} />
        </g>
      ))}
      <path d={poly(jag([[440, 1010], [1300, 1060], [1300, 1400], [440, 1400]], 10, 61, 50))} fill="#4A4440" />
      {/* the standing part */}
      <Slab id={`${id}-fa`} face={facade} tone={RB.concLit} w={5} specks={40} cracks={[[[120, 300], [160, 420], [140, 520]], [[320, 640], [300, 760], [350, 860]], [[60, 900], [110, 1010]]]} rim={[[-200, ROOF], [tear[0], ROOF]]} />
      {wins}
      {/* floor bands */}
      {Array.from({length: floors + 1}, (_, i) => (
        <path key={`b${i}`} d={`M-200,${ROOF + i * FH - 6} H${tear[i] - 14}`} stroke={shadeC(RB.concLit, 0.25)} strokeWidth={9} />
      ))}
      {slabs.map((s, i) => (
        <g key={`s${i}`}>
          <Slab id={`${id}-cs${i}`} face={jag([[s.x0, s.y - 8], [s.x1, s.y - 8 + s.sag], [s.x1 - 4, s.y + 12 + s.sag], [s.x0, s.y + 14]], 4, 70 + i, 30)} tone={RB.conc} w={3.5} />
          <Rebar pts={[[s.x1 - 10, s.y + s.sag + 4], [s.x1 + 6, s.y + s.sag + 40 + 30 * rnd(i, 2)], [s.x1 - 4, s.y + s.sag + 80 + 40 * rnd(i, 5)]]} w={4} dark={0.2} />
        </g>
      ))}
      <path d={`M-200,${ROOF} H${tear[0]}`} stroke={INK} strokeWidth={5} />
      {/* a broken roof parapet */}
      <Slab id={`${id}-rp`} face={jag([[-200, ROOF - 34], [380, ROOF - 34], [430, ROOF - 10], [420, ROOF], [-200, ROOF]], 4, 81, 40)} tone={RB.concPale} w={4} />
    </g>
  );
};

// ---------------------------------------------------------------- the rubble heap
export const Heap: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-hg`} x1="0" y1="900" x2="0" y2="1300" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8A817A" />
        <stop offset="1" stopColor="#6A625C" />
      </linearGradient>
    </defs>
    <path d={poly(jag([[-300, 1010], [80, 930], [300, 960], [520, 900], [760, 950], [980, 905], [1400, 980], [1400, 1500], [-300, 1500]], 16, 91, 40))} fill={`url(#${id}-hg)`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Slab id={`${id}-h1`} face={jag([[-120, 960], [260, 925], [330, 1010], [-120, 1060]], 7, 92)} top={jag([[-120, 960], [260, 925], [275, 945], [-120, 985]], 4, 93)} tone={RB.conc} w={4} specks={10} />
    <Slab id={`${id}-h2`} face={jag([[560, 920], [900, 880], [960, 980], [600, 1010]], 7, 94)} top={jag([[560, 920], [900, 880], [915, 905], [575, 945]], 4, 95)} tone={RB.concLit} w={4} specks={10} />
    <Slab id={`${id}-h3`} face={jag([[300, 990], [560, 960], [600, 1060], [320, 1070]], 7, 96)} tone={RB.concDark} w={4} specks={8} />
    <Slab id={`${id}-h4`} face={jag([[880, 1000], [1250, 960], [1300, 1090], [900, 1110]], 7, 99)} top={jag([[880, 1000], [1250, 960], [1260, 985], [890, 1025]], 4, 100)} tone={RB.concLit} w={4} specks={8} dark={0.08} />
    <Slab id={`${id}-h5`} face={jag([[-200, 1070], [200, 1040], [240, 1140], [-200, 1170]], 7, 98)} tone={RB.conc} w={4} specks={8} dark={0.12} />
    <Rebar pts={[[430, 975], [455, 880], [520, 840]]} w={6} dark={0.15} />
    <Rebar pts={[[860, 900], [840, 820], [870, 780]]} w={6} dark={0.15} />
    <Pipe a={[980, 990]} b={[1240, 940]} r={11} dark={0.2} />
    <Pebbles id={`${id}-hp`} a={[-100, 1050]} b={[1200, 1040]} n={18} size={14} seed={97} tone={RB.concDark} />
  </g>
);

// ---------------------------------------------------------------- the ground: the fallen slab over the opening
const M = E1_MOUTH;
/** the fallen slab's underside edge (end-frame px): propped on a block at the left, resting on the floor at the right */
const UND = (x: number) => M.top + (x - M.x0) * ((M.floor - M.top) / (M.x1 + 170 - M.x0));
const Ground: React.FC<{id: string; t: number; pose: RoachPose}> = ({id, t, pose}) => {
  const v = E1_VIEW;
  const floor: Pt[] = [[-300, 1160], [1400, 1160], [1400, 2300], [-300, 2300]];
  const xr = M.x1 + 170; // where the slab's edge meets the floor
  const T = 74; // the slab's front face (thickness)
  const fr = (x: number): Pt => [x, UND(x)];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fl`} x1="0" y1="1160" x2="0" y2="1900" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8E847A" />
          <stop offset="0.3" stopColor="#B4A796" />
          <stop offset="1" stopColor="#C9BBA6" />
        </linearGradient>
        <linearGradient id={`${id}-in`} x1="0" y1={M.top} x2="0" y2={M.floor} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0B0908" />
          <stop offset="1" stopColor="#2A2420" />
        </linearGradient>
      </defs>
      <path d={poly(floor)} fill={`url(#${id}-fl)`} />
      {/* the dark wedge under the slab */}
      <path d={poly([[M.x0 - 40, M.top - 40], [xr + 20, M.floor - 30], [xr + 10, M.floor + 4], [M.x0 - 20, M.floor + 6]])} fill={`url(#${id}-in)`} />
      <Pebbles id={`${id}-g2`} a={[M.x0 + 30, M.floor + 2]} b={[M.x1 - 40, M.floor + 4]} n={7} size={7} seed={109} tone={RB.concLit} dark={0.3} />
      {/* the fallen slab: its lit top rising to the left, its broken front face down to the wedge */}
      <Slab
        id={`${id}-fs`}
        face={[[-300, M.top - 150], ...jag([[-300, M.top - 150 - T], [xr + 40, M.floor - T + 10]], 6, 102, 44, false), [xr + 40, M.floor + 2], fr(xr), fr(M.x0), [-300, M.top - 150]]}
        top={jag([[-300, M.top - 150 - T], [xr + 40, M.floor - T + 10], [xr + 90, M.floor - T - 60], [-300, M.top - 150 - T - 130]], 8, 103, 60)}
        tone={RB.conc} w={5} dark={0.32} specks={22} topTone={mix(RB.concLit, RB.day, 0.28)}
        cracks={[[[200, 1090], [230, 1150], [215, 1190]], [[600, 1200], [640, 1250]]]}
        rim={jag([[-300, M.top - 150 - T], [xr + 40, M.floor - T + 10]], 6, 102, 44, false)}
      />
      <Slab id={`${id}-fe`} face={jag([[xr + 40, M.floor - T + 10], [xr + 90, M.floor - T - 60], [xr + 96, M.floor - 40], [xr + 40, M.floor + 2]], 5, 116, 30)} tone={RB.concDark} w={4.5} dark={0.45} />
      <Rebar pts={[[M.x0 + 70, UND(M.x0 + 70) - 6], [M.x0 + 84, UND(M.x0 + 70) + 26], [M.x0 + 72, UND(M.x0 + 70) + 48]]} w={5} dark={0.4} />
      <Rebar pts={[[xr - 60, M.floor - T + 30], [xr - 20, M.floor - T - 30], [xr + 30, M.floor - T - 46]]} w={6} dark={0.2} />
      {/* the block propping its left end */}
      <Slab id={`${id}-cl`} face={jag([[-300, M.top - 150], [M.x0, M.top], [M.x0 + 14, M.floor + 6], [-300, M.floor + 40]], 6, 104, 40)} tone={RB.concDark} w={4.5} dark={0.25} specks={10} rim={[[M.x0, M.top + 6], [M.x0 + 14, M.floor + 4]]} rimColor={mix(RB.day, RB.concLit, 0.4)} />
      {/* gravel and dust on the floor */}
      <Pebbles id={`${id}-g0`} a={[-200, 1380]} b={[260, 1430]} n={9} size={13} seed={107} tone={RB.concLit} />
      <Pebbles id={`${id}-g1`} a={[700, 1400]} b={[1250, 1370]} n={10} size={14} seed={108} tone={RB.conc} />
      <Glow2 id={`${id}-pool`} cx={520} cy={1470} rx={460} ry={130} color={RB.dayHot} a={0.35} />
      <Roach2D pose={pose} v={v} o={{id: `${id}-r`, gear: <Gear2D id={`${id}-g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      <Motes id={`${id}-m`} t={t} n={22} x0={-50} y0={980} x1={1130} y1={1500} r={3.2} seed={110} a={0.6} />
    </g>
  );
};

const Fore: React.FC<{id: string}> = ({id}) => (
  <g>
    <Slab id={`${id}-f1`} face={jag([[-300, 1700], [180, 1730], [330, 1860], [300, 2400], [-300, 2400]], 12, 111)} top={jag([[-300, 1700], [180, 1730], [330, 1860], [-300, 1790]], 8, 112)} tone="#6A625C" w={5} dark={0.5} specks={14} />
    <Slab id={`${id}-f2`} face={jag([[820, 1750], [1400, 1640], [1400, 2400], [760, 2400]], 12, 113)} top={jag([[820, 1750], [1400, 1640], [1400, 1720], [790, 1820]], 8, 114)} tone="#6F6862" w={5} dark={0.52} specks={14} />
    <Rebar pts={[[1010, 1720], [985, 1590], [1020, 1530]]} w={10} dark={0.5} />
  </g>
);

export const E1: React.FC<ShotProps> = ({f, lf}) => {
  const id = idf('e3a', f);
  const t = lf / FPS;
  const cam = e1Cam(lf);
  const pose = e1Pose(lf);
  const L = (d: number, el: React.ReactNode) => (
    <Layer cam={cam} depth={d}>
      <g transform={endWrap(END, d)}>{el}</g>
    </Layer>
  );
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {L(D_SKY, <Sky id={`${id}s`} />)}
      {L(D_BLD, <Building id={`${id}b`} t={t} />)}
      {/* haze between the building and the heap */}
      <rect x={0} y={0} width={1080} height={1920} fill="#F4E4C6" opacity={0.18} />
      {L(D_HEAP, <Heap id={`${id}h`} />)}
      {L(D_GND, <Ground id={`${id}g`} t={t} pose={pose} />)}
      {L(D_FORE, <Fore id={`${id}f`} />)}
    </svg>
  );
};
void litC;
void line;
