// V2 room: the family room of the astronaut's home, one layout seen in two eras.
//   era 0 = the PAST (the minute he left): warm sun, plump cushions, a steaming mug, fresh flowers, clean glass.
//   era 1 = the PRESENT (decades later): the same objects, quiet and cool; a dust film on frames, glass and furniture
//           tops, dried drooping flowers, a faint cobweb, dust motes in the window light, and a black ribbon on the
//           father's portrait. Every change is a continuous function of era (0..1).
// Weird Crew finish: flat fills, one ink outline (OUT) around every part, one darker cel-shadow shape per part (key
// light upper-left), crew palette, no text or numerals anywhere.
//
// World units: room px. Floor line y = 1560 (the wall meets the floor); the floor plane is drawn below it in a mild
// one-point perspective. The room is drawn over x -900..2900, y -1000..3000 (the usable area is about x -300..2300,
// y -200..2400), so cameras can move freely.
//
// Portals:
//   windowView  room coordinates, clipped to the window glass ROOM.win (draw the yard so it lines up with the glass)
//   photoView   SCREEN coordinates of a 1080 x 1920 frame, mapped onto the 9:16 print ROOM.photoFriend.print
//               (pass the same tree that renders the opening composition; a push-in that fills the screen with the
//               print then matches it exactly when photoTint = photoGlass = 0)
//   refl        room coordinates, clipped to the FAMILY photo's glass, screen-blended at reflOp
import React from 'react';
import {mix, shade} from '../core/color';
import {clamp, hash, noise1, ss} from '../lib';
import {C, INK, OUT} from '../art/crew';
import {Bust, GUESSER} from '../art/figures';

export type RoomRect = {x: number; y: number; w: number; h: number};
export type RoomPt = {x: number; y: number};

// ---------------------------------------------------------------------------------------------------------------------
// exported geometry
export const ROOM_FLOOR = 1560;
const F = ROOM_FLOOR;
/** cornice: the wall runs from here down to the floor; the ceiling band is above */
const CEIL = 300;
/** one-point perspective for the floor plane (boards, rug, light patch) */
const VP = {x: 1000, y: -1200};
/** a point on the floor plane: x as measured along the wall-floor line, y = depth line on screen (>= F) */
export const roomFloorPt = (x: number, y: number): RoomPt => ({x: VP.x + ((x - VP.x) * (y - VP.y)) / (F - VP.y), y});

const CLOCK = {x: 330, y: 790, r: 95};
const WIN = {x0: 640, y0: 680, x1: 1020, y1: 1200};
const WIN_MULL = {x: 830, w: 16}; // vertical mullion (centre x, width)
const WIN_TRANSOM = {y: 840, h: 14}; // horizontal transom (centre y, height)
const WIN_CASING = 22;
const SILL = {x0: 600, x1: 1060, y0: 1200, y1: 1224};
const CURTAIN = {rodY: 634, x0: 552, x1: 1108, left: [558, 664] as [number, number], right: [996, 1102] as [number, number], bottom: 1274};
const DOOR = {x0: -200, x1: 60, y0: 830, y1: F, casing: 26};
const SB = {x0: 1146, x1: 1736, topBack: 1234, topFront: 1252, edge: 1268, body1: 1500, y1: F};
const SHELF = {x0: 1220, x1: 1680, y: 760, h: 18};

const FAMILY_FRAME: RoomRect = {x: 1162, y: 1058, w: 262, h: 192};
const FAMILY_M = 16;
const FAMILY_PRINT: RoomRect = {x: FAMILY_FRAME.x + FAMILY_M, y: FAMILY_FRAME.y + FAMILY_M, w: FAMILY_FRAME.w - 2 * FAMILY_M, h: FAMILY_FRAME.h - 2 * FAMILY_M};
const PARENT_FRAME: RoomRect = {x: 1434, y: 1078, w: 116, h: 162};
const PARENT_M = 13;
const PARENT_PRINT: RoomRect = {x: PARENT_FRAME.x + PARENT_M, y: PARENT_FRAME.y + PARENT_M, w: PARENT_FRAME.w - 2 * PARENT_M, h: PARENT_FRAME.h - 2 * PARENT_M};
const FRIEND_PRINT: RoomRect = {x: 1568, y: 974, w: 144, h: 256}; // 144 * 16 / 9 = 256 exactly
const FRIEND_M = 10;
const FRIEND_FRAME: RoomRect = {x: FRIEND_PRINT.x - FRIEND_M, y: FRIEND_PRINT.y - FRIEND_M, w: FRIEND_PRINT.w + 2 * FRIEND_M, h: FRIEND_PRINT.h + 2 * FRIEND_M};

/** the family photo's people (print-local position of the head centre, Bust scale) */
type Person = {key: string; x: number; y: number; s: number; skin: string; hair: 'spiky' | 'bob' | 'swoop'; hairColor: string; age: number; shirt: string; stripes?: string; tache?: string};
const RED = GUESSER.hair;
// his father: unmistakably a parent, not a copy of him - a combed brown side part going grey, a moustache, older face
const DAD: Omit<Person, 'x' | 'y' | 's' | 'key'> = {skin: '#F2C9A8', hair: 'swoop', hairColor: '#8A5A34', age: 0.42, shirt: '#2E3F5C', tache: '#6E4D33'};
const MOM: Omit<Person, 'x' | 'y' | 's' | 'key'> = {skin: '#F7D9C4', hair: 'bob', hairColor: '#B8743A', age: 0.3, shirt: '#E9876A'};
const SON: Omit<Person, 'x' | 'y' | 's' | 'key'> = {skin: GUESSER.skin, hair: 'spiky', hairColor: RED, age: 0, shirt: '#FFFFFF', stripes: C.saffron};
const SIS: Omit<Person, 'x' | 'y' | 's' | 'key'> = {skin: '#F7D9C4', hair: 'bob', hairColor: RED, age: 0, shirt: C.teal};
const FAMILY: Person[] = [
  {key: 'dad', x: 36, y: 62, s: 0.44, ...DAD},
  {key: 'mom', x: 92, y: 73, s: 0.41, ...MOM},
  {key: 'son', x: 148, y: 61, s: 0.44, ...SON},
  {key: 'sis', x: 121, y: 117, s: 0.3, ...SIS},
];
const PARENT: Person = {key: 'dadp', x: 45, y: 60, s: 0.48, ...DAD};

/** the glove's wipe across the family photo: a quadratic through from -> via -> to; the clean streak is `width` wide */
const WIPE = {from: {x: 1156, y: 1127}, via: {x: 1274, y: 1137}, to: {x: 1392, y: 1147}, width: 66};
/** glove contact point on the family photo at wipe progress u (0..1) */
export const wipeAt = (u: number): RoomPt => {
  const k = clamp(u);
  const c = {x: 2 * WIPE.via.x - (WIPE.from.x + WIPE.to.x) / 2, y: 2 * WIPE.via.y - (WIPE.from.y + WIPE.to.y) / 2};
  const a = (1 - k) * (1 - k), b = 2 * k * (1 - k), d = k * k;
  return {x: a * WIPE.from.x + b * c.x + d * WIPE.to.x, y: a * WIPE.from.y + b * c.y + d * WIPE.to.y};
};

const CHAIR_A = {cx: 640, color: '#C46A4E'}; // in full view as he walks in (the room camera frames x ~470-1550); below the pane the push ends in
const CHAIR_B = {cx: 1950, color: '#5D7FA6'};
const CHAIR_W = {half: 170, top: 1150, seat: 1392};
const TABLE = {cx: 300, top: 1330, rx: 72};
const LAMP = {x: 2200, top: 862};
const PENDANT = {x: 1330, y: 404, rose: -250};
/** the ceiling boards recede toward this point (below the room: we look up at the ceiling) */
const CEIL_VP = {x: 1000, y: 2700};

const faceRoom = (p: Person, print: RoomRect) => ({who: p.key, x: print.x + p.x, y: print.y + p.y, r: 62 * p.s});

export const ROOM = {
  floor: F,
  /** the area a camera may frame (everything inside is drawn) */
  bounds: {x0: -300, y0: -200, x1: 2300, y1: 2400},
  /** suggested figure scale for the crew rigs in this room (helmet top ~ y 890; clears the doorway head at y 830-26) */
  figScale: 1.4,
  /** bottom of the cornice; the wall runs from here to the floor */
  ceiling: CEIL,
  clock: {...CLOCK},
  /** glass area (the windowView clip); mullion / transom centres; outer casing; sill */
  win: {...WIN, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0, cx: (WIN.x0 + WIN.x1) / 2, cy: (WIN.y0 + WIN.y1) / 2, mullionX: WIN_MULL.x, transomY: WIN_TRANSOM.y,
    casing: {x0: WIN.x0 - WIN_CASING, y0: WIN.y0 - WIN_CASING, x1: WIN.x1 + WIN_CASING, y1: WIN.y1}, sill: {...SILL}, curtains: {x0: CURTAIN.x0, x1: CURTAIN.x1, rodY: CURTAIN.rodY, bottom: CURTAIN.bottom}},
  /** sideboard: x0..x1, top surface (photos at the back stand on y = topBack + 6, the front row on y = topFront - 2) */
  sideboard: {x0: SB.x0, x1: SB.x1, w: SB.x1 - SB.x0, topBack: SB.topBack, topFront: SB.topFront, edge: SB.edge, y1: F},
  shelf: {...SHELF},
  /** family photo: frame outer rect (x, y, w, h), its glass (= print) rect, and the face centres (room px, radius) */
  photoFamily: {...FAMILY_FRAME, glass: {...FAMILY_PRINT}, print: {...FAMILY_PRINT}, faces: FAMILY.map((p) => faceRoom(p, FAMILY_PRINT)),
    /** suggested centre / radius for his reflected face: over the dark hedge beside the family (head radius as the family's) */
    reflSpot: {x: FAMILY_PRINT.x + FAMILY_PRINT.w - 28, y: FAMILY_PRINT.y + 64, r: 62 * 0.44}},
  /** father's portrait: frame rect, print rect, ribbon corner (top right) */
  photoParent: {...PARENT_FRAME, print: {...PARENT_PRINT}, face: faceRoom(PARENT, PARENT_PRINT), ribbonCorner: {x: PARENT_FRAME.x + PARENT_FRAME.w, y: PARENT_FRAME.y}},
  /** pre-departure 9:16 print: frame rect and print rect (h = w * 16 / 9 exactly); photoView is a 1080x1920 frame scaled by printScale */
  photoFriend: {...FRIEND_FRAME, print: {...FRIEND_PRINT}, printScale: FRIEND_PRINT.w / 1080},
  /** the dust puff starts here (glove contact at dustWipe 0.5); the wipe runs wipe.from -> via -> to (see wipeAt) */
  wipePoint: wipeAt(0.5),
  wipe: {...WIPE},
  /** a suggested spot to stand (feet, at figScale): his right glove (astroReach) reaches the whole wipe; his head stays clear
   *  of the family frame, only the clear helmet bubble overlaps its left edge */
  standAtPhoto: {x: 1064, y: F},
  /** two armchairs (front-facing, against the wall): outer bounds, seat height */
  chairs: [CHAIR_A, CHAIR_B].map((c) => ({x0: c.cx - CHAIR_W.half, x1: c.cx + CHAIR_W.half, y0: CHAIR_W.top, y1: F, cx: c.cx, seatY: CHAIR_W.seat})),
  sideTable: {cx: TABLE.cx, x0: TABLE.cx - TABLE.rx, x1: TABLE.cx + TABLE.rx, top: TABLE.top, y1: F},
  /** doorway opening (he walks in from here, left to right) and its casing width */
  doorway: {...DOOR},
};

// ---------------------------------------------------------------------------------------------------------------------
// helpers
const rad = (d: number) => (d * Math.PI) / 180;
const DUST = '#D8D4CB';
const DUST_GLASS = '#E2DED6';
/** era lighting baked into every fill: a touch of warm sun (era 0) -> dusty, desaturated, cool (era 1).
 *  Exported as roomTint so figures can be graded to match (e.g. a translucent overlay, or their colours). */
export const roomTint = (c: string, era: number) => lightCol(c, clamp(era));
function lightCol(c: string, e: number) {
  const warm = mix(c, '#FFE9C2', 0.05);
  if (e <= 0.001) return warm;
  const cool = mix(mix(c, '#A6A39C', 0.24), '#3E4D66', 0.25);
  return mix(warm, cool, e);
}
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const polyD = (pts: RoomPt[]) => 'M ' + pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ') + ' Z';
type Ctx = {e: number; t: number; id: string; L: (c: string) => string};

/** a light film of dust on a top surface */
const DustTop: React.FC<{x0: number; x1: number; y: number; e: number; h?: number}> = ({x0, x1, y, e, h = 5}) =>
  e > 0.01 ? <rect x={x0} y={y} width={x1 - x0} height={h} rx={h / 2} fill={DUST} opacity={0.78 * e} /> : null;

/** dust specks inside a rect (deterministic) */
const Specks: React.FC<{r: RoomRect; n: number; seed: number; op: number; size?: number}> = ({r, n, seed, op, size = 1.6}) =>
  op > 0.01 ? (
    <g opacity={op}>
      {Array.from({length: n}, (_, k) => (
        <circle key={k} cx={r.x + hash(seed + k * 3.7) * r.w} cy={r.y + hash(seed + k * 5.3) * r.h} r={size * (0.5 + hash(seed + k * 1.9))} fill="#EEEAE2" />
      ))}
    </g>
  ) : null;

// ---------------------------------------------------------------------------------------------------------------------
// the wall clock (exported for the match cut: the integrator can draw it alone at any size)
const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const p = (r: number, a: number) => `${(Math.sin(rad(a)) * r).toFixed(2)} ${(-Math.cos(rad(a)) * r).toFixed(2)}`;
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
};
/** clock hand angles in degrees clockwise from twelve */
export const clockAngles = (minutes: number) => ({hour: minutes * 0.5, minute: minutes * 6});

export const WallClock: React.FC<{x?: number; y?: number; r?: number; minutes: number; blur?: number; era?: number; id: string}> = ({x = CLOCK.x, y = CLOCK.y, r = CLOCK.r, minutes, blur = 0, era = 0, id}) => {
  const e = clamp(era);
  const L = (c: string) => lightCol(c, e);
  const b = clamp(blur);
  const R = r;
  const k = R / CLOCK.r; // line weights scale with the clock (OUT at the room's own size)
  const face = R * 0.82;
  const rim = L('#C94A36');
  const faceC = L(mix('#FFF8E8', '#EFE2C2', 0.55 * e));
  const {hour, minute} = clockAngles(minutes);
  const hourD = `M ${-0.058 * R} ${0.15 * R} L ${-0.036 * R} ${-0.44 * R} Q 0 ${-0.5 * R} ${0.036 * R} ${-0.44 * R} L ${0.058 * R} ${0.15 * R} Z`;
  const minD = `M ${-0.042 * R} ${0.17 * R} L ${-0.022 * R} ${-0.68 * R} Q 0 ${-0.73 * R} ${0.022 * R} ${-0.68 * R} L ${0.042 * R} ${0.17 * R} Z`;
  const handOp = 1 - 0.45 * b;
  const K1 = 10, K2 = 6;
  const span1 = 345 * b, span2 = 100 * b;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* cast shadow on the wall */}
      <circle cx={R * 0.1} cy={R * 0.13} r={R} fill={C.shadow} />
      {/* rim: red, a lighter rolled edge upper-left, one shadow crescent lower-right */}
      <circle r={R} fill={rim} stroke={INK} strokeWidth={OUT * k} />
      <clipPath id={`${id}-rim`}><circle r={R - 2 * k} /></clipPath>
      <g clipPath={`url(#${id}-rim)`}>
        <circle r={R} fill={shade(rim, 0.35)} />
        <circle cx={-R * 0.075} cy={-R * 0.075} r={R} fill={rim} />
      </g>
      <path d={`M ${-R * 0.86} ${-R * 0.2} A ${R * 0.9} ${R * 0.9} 0 0 1 ${-R * 0.2} ${-R * 0.86}`} fill="none" stroke={L('#F08A6E')} strokeWidth={R * 0.06} strokeLinecap="round" />
      {/* face */}
      <circle r={face} fill={faceC} stroke={INK} strokeWidth={OUT * 0.8 * k} />
      <clipPath id={`${id}-face`}><circle r={face} /></clipPath>
      <g clipPath={`url(#${id}-face)`}>
        {/* the rim's shadow on the face (upper-left inner edge) */}
        <circle r={face} fill={shade(faceC, 0.18)} />
        <circle cx={R * 0.07} cy={R * 0.07} r={face} fill={faceC} />
      </g>
      {/* minute dots and hour bars (no numerals) */}
      {Array.from({length: 60}, (_, i) => (i % 5 === 0 ? null : <circle key={i} cx={Math.sin(rad(i * 6)) * face * 0.9} cy={-Math.cos(rad(i * 6)) * face * 0.9} r={R * 0.014} fill={INK} opacity={0.7} />))}
      {Array.from({length: 12}, (_, i) => {
        const main = i % 3 === 0;
        const w = main ? R * 0.085 : R * 0.05, l = main ? R * 0.2 : R * 0.14;
        return <rect key={i} x={-w / 2} y={-face * 0.86} width={w} height={l} rx={w * 0.25} fill={INK} transform={`rotate(${i * 30})`} />;
      })}
      {/* motion smear (years racing by): stepped translucent wedges behind each hand */}
      {b > 0.01 && (
        <g>
          {Array.from({length: K1}, (_, k) => (
            <path key={`m${k}`} d={sector(R * 0.06, R * 0.7, minute - (span1 * (k + 1)) / K1, minute - (span1 * k) / K1)} fill={INK} opacity={0.3 * b * Math.pow(1 - k / K1, 1.6)} />
          ))}
          {Array.from({length: K2}, (_, k) => (
            <path key={`h${k}`} d={sector(R * 0.06, R * 0.47, hour - (span2 * (k + 1)) / K2, hour - (span2 * k) / K2)} fill={INK} opacity={0.42 * b * Math.pow(1 - k / K2, 1.4)} />
          ))}
          {[0.1, 0.22].map((f, k) => (
            <path key={`g${k}`} d={minD} fill={INK} opacity={0.3 * b * (1 - k * 0.4)} transform={`rotate(${minute - span1 * f})`} />
          ))}
        </g>
      )}
      {/* hands with a soft drop shadow (light upper-left) */}
      <g opacity={handOp}>
        <path d={hourD} fill={C.shadow} transform={`translate(${R * 0.03} ${R * 0.04}) rotate(${hour})`} />
        <path d={minD} fill={C.shadow} transform={`translate(${R * 0.035} ${R * 0.045}) rotate(${minute})`} />
        <path d={hourD} fill={INK} transform={`rotate(${hour})`} />
        <path d={minD} fill={INK} transform={`rotate(${minute})`} />
      </g>
      <circle r={R * 0.075} fill={INK} />
      <circle r={R * 0.032} fill={C.saffronDeep} />
      {/* crystal glint */}
      <path d={`M ${-face * 0.72} ${-face * 0.3} A ${face * 0.78} ${face * 0.78} 0 0 1 ${-face * 0.3} ${-face * 0.72}`} fill="none" stroke="#FFFFFF" strokeWidth={R * 0.045} strokeLinecap="round" opacity={0.55 * (1 - 0.6 * e)} />
      <circle cx={-face * 0.5} cy={-face * 0.5} r={R * 0.025} fill="#FFFFFF" opacity={0.6 * (1 - 0.6 * e)} />
      {/* dust: a film on the face glass and a line on the rim top */}
      {e > 0.01 && (
        <g>
          <circle r={face} fill={DUST} opacity={0.12 * e} />
          <path d={`M ${-R * 0.7} ${-R * 0.62} A ${R * 0.93} ${R * 0.93} 0 0 1 ${R * 0.7} ${-R * 0.62}`} fill="none" stroke={DUST} strokeWidth={R * 0.05} strokeLinecap="round" opacity={0.8 * e} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// people in photographs: the crew Bust with the shirt continued to the print's bottom edge (and a striped tee)
const PhotoPerson: React.FC<{p: Person; id: string}> = ({p, id}) => {
  const shirt = `M -80 520 L -80 140 Q -84 70 -40 62 L 40 62 Q 84 70 80 140 L 80 520 Z`;
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
      <defs>
        <clipPath id={`${id}-top`}><rect x={-300} y={-400} width={600} height={536} /></clipPath>
        <clipPath id={`${id}-shirt`}><path d={shirt} /></clipPath>
        <clipPath id={`${id}-low`}><rect x={-300} y={80} width={600} height={500} /></clipPath>
      </defs>
      <path d={shirt} fill={p.shirt} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M 34 66 Q 76 72 78 140 L 80 520 L 40 520 Z`} fill={shade(p.shirt, 0.22)} opacity={0.6} />
      <g clipPath={`url(#${id}-top)`}>
        <Bust skin={p.skin} hair={p.hair} hairColor={p.hairColor} age={p.age} shirt={p.shirt} id={`${id}-b`} e={{mouth: 'smile'}} />
        {p.tache && <path d="M -24 24 Q -12 13 0 19 Q 12 13 24 24 Q 12 29 0 24 Q -12 29 -24 24 Z" fill={p.tache} stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
      </g>
      {p.stripes && (
        <g clipPath={`url(#${id}-low)`}>
          <g clipPath={`url(#${id}-shirt)`}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => <rect key={k} x={-100} y={88 + k * 30} width={200} height={14} fill={p.stripes} />)}
            <path d={`M 34 66 Q 76 72 78 140 L 80 520 L 40 520 Z`} fill={shade('#FFFFFF', 0.3)} opacity={0.35} />
          </g>
          <path d={shirt} fill="none" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/** the family photograph's content (print-local, 0..w x 0..h): the yard on the day before he left */
const FamilyPrint: React.FC<{id: string; w: number; h: number}> = ({id, w, h}) => (
  <g>
    <rect x={0} y={0} width={w} height={h} fill="#BFE0F0" />
    <circle cx={w * 0.52} cy={h * 0.1} r={16} fill="#FFF3C4" />
    <circle cx={-6} cy={h * 0.3} r={34} fill="#6FB36A" stroke={INK} strokeWidth={2} />
    <circle cx={22} cy={h * 0.2} r={22} fill="#7CC070" stroke={INK} strokeWidth={2} />
    <rect x={0} y={h * 0.6} width={w} height={h * 0.4} fill="#8DC08A" />
    {/* deep shade under the trees at the right edge, a neutral dark (not green): where his reflection on the glass reads best */}
    <rect x={w - 20} y={0} width={10} height={h * 0.2} fill="#5A3E30" stroke={INK} strokeWidth={1.6} />
    {/* a low, wide shrub in deep shade (its leafy top stays below the printed heads): the dark his reflected face reads on */}
    <path d={`M ${w - REFL_W - 18} ${h} L ${w - REFL_W - 18} ${h * 0.66} ${[0, 1, 2, 3, 4, 5].map((k) => `Q ${w - REFL_W - 12 + k * 15} ${h * (0.5 + 0.05 * (k % 2))} ${w - REFL_W - 4 + k * 15} ${h * (0.58 - 0.05 * (k % 2))}`).join(' ')} Q ${w + 8} ${h * 0.52} ${w + 10} ${h * 0.6} L ${w + 10} ${h} Z`} fill="#2D3631" stroke={INK} strokeWidth={2} />
    <path d={`M ${w - REFL_W + 10} ${h * 0.34} Q ${w - REFL_W + 14} ${h * 0.24} ${w - REFL_W + 26} ${h * 0.22} M ${w - 22} ${h * 0.2} Q ${w - 14} ${h * 0.15} ${w - 6} ${h * 0.18}`} fill="none" stroke="#454C57" strokeWidth={3} strokeLinecap="round" />
    {Array.from({length: 12}, (_, k) => (
      <path key={k} d={`M ${k * 14 + 2} ${h * 0.64} L ${k * 14 + 2} ${h * 0.5} L ${k * 14 + 6} ${h * 0.46} L ${k * 14 + 10} ${h * 0.5} L ${k * 14 + 10} ${h * 0.64} Z`} fill="#FFFBF0" stroke={INK} strokeWidth={1.4} />
    ))}
    <rect x={0} y={h * 0.53} width={w - REFL_W} height={3} fill="#FFFBF0" stroke={INK} strokeWidth={1} />
    {FAMILY.map((p) => <PhotoPerson key={p.key} p={p} id={`${id}-${p.key}`} />)}
  </g>
);

/** width of the dark hedge at the right edge of the family print, where his reflected face reads best */
const REFL_W = 56;

/** the father's studio portrait (print-local) */
const ParentPrint: React.FC<{id: string; w: number; h: number}> = ({id, w, h}) => (
  <g>
    <rect x={0} y={0} width={w} height={h} fill="#C5D3DD" />
    <ellipse cx={w / 2} cy={h * 0.42} rx={w * 0.46} ry={h * 0.4} fill="#D9E4EB" />
    <PhotoPerson p={PARENT} id={`${id}-dad`} />
  </g>
);

/** a placeholder for the pre-departure print, in 1080x1920 screen coordinates (used when no photoView is given) */
const PrintPlaceholder: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#BFE0F0" />
    <rect x={0} y={1180} width={1080} height={740} fill="#8DC08A" />
    <rect x={0} y={1170} width={1080} height={20} fill="#FFFBF0" stroke={INK} strokeWidth={8} />
    <circle cx={820} cy={360} r={120} fill="#FFF3C4" />
  </g>
);

// ---------------------------------------------------------------------------------------------------------------------
// a photo frame: moulding with a cel-shaded bevel, then the print, glass, inner ink line
const FrameMoulding: React.FC<{r: RoomRect; m: number; wood: string; ctx: Ctx; rx?: number}> = ({r, m, wood, ctx, rx = 3}) => {
  const w0 = ctx.L(wood);
  const {x, y, w, h} = r;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={w0} stroke={INK} strokeWidth={OUT} />
      {/* bevel: the bottom and right members in shadow, a lit line along the top-left */}
      <path d={`M ${x + w - 2} ${y + 2} L ${x + w - 2} ${y + h - 2} L ${x + 2} ${y + h - 2} L ${x + m} ${y + h - m} L ${x + w - m} ${y + h - m} L ${x + w - m} ${y + m} Z`} fill={shade(w0, 0.3)} />
      <path d={`M ${x + 6} ${y + h - 8} L ${x + 6} ${y + 6} L ${x + w - 8} ${y + 6}`} fill="none" stroke={mix(w0, '#FFF7E6', 0.45)} strokeWidth={Math.max(2, m * 0.16)} strokeLinecap="round" />
    </g>
  );
};
/** inner ink line drawn just outside the print (so the frame never overlaps the print rect) */
const InnerLine: React.FC<{r: RoomRect; w?: number}> = ({r, w = 3}) => <rect x={r.x - w / 2} y={r.y - w / 2} width={r.w + w} height={r.h + w} fill="none" stroke={INK} strokeWidth={w} />;
/** glass sheen: two diagonal light bands from the upper left */
const Sheen: React.FC<{r: RoomRect; op: number}> = ({r, op}) =>
  op > 0.005 ? (
    <g opacity={op}>
      <path d={`M ${r.x} ${r.y + r.h * 0.42} L ${r.x + r.w * 0.42} ${r.y} L ${r.x + r.w * 0.62} ${r.y} L ${r.x} ${r.y + r.h * 0.7} Z`} fill="#FFFFFF" opacity={0.22} />
      <path d={`M ${r.x} ${r.y + r.h * 0.82} L ${r.x + r.w * 0.82} ${r.y} L ${r.x + r.w * 0.88} ${r.y} L ${r.x} ${r.y + r.h * 0.9} Z`} fill="#FFFFFF" opacity={0.16} />
      <path d={`M ${r.x + 6} ${r.y + Math.min(30, r.h * 0.2)} L ${r.x + Math.min(30, r.w * 0.2)} ${r.y + 6}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
    </g>
  ) : null;

// ---------------------------------------------------------------------------------------------------------------------
// furniture
const Armchair: React.FC<{cx: number; color: string; ctx: Ctx; which: 'A' | 'B'}> = ({cx, color, ctx, which}) => {
  const {L, e} = ctx;
  const c0 = L(mix(color, '#B8AFA2', 0.25 * e));
  const cS = shade(c0, 0.3);
  const leg = L('#6B4630');
  const back = `M ${cx - 128} 1430 L ${cx - 128} 1212 Q ${cx - 128} 1150 ${cx - 66} 1150 L ${cx + 66} 1150 Q ${cx + 128} 1150 ${cx + 128} 1212 L ${cx + 128} 1430 Z`;
  const arm = (s: -1 | 1) => {
    const xo = cx + s * 170, xi = cx + s * 106;
    const a = Math.min(xo, xi), b = Math.max(xo, xi);
    return `M ${a} 1526 L ${a} 1332 Q ${a} 1294 ${(a + b) / 2} 1294 Q ${b} 1294 ${b} 1332 L ${b} 1526 Z`;
  };
  return (
    <g>
      {/* cast shadows: on the wall (lower right) and on the floor */}
      <path d={back} fill={C.shadow} transform="translate(22 14)" />
      <path d={arm(1)} fill={C.shadow} transform="translate(20 10)" />
      <ellipse cx={cx + 14} cy={F + 6} rx={196} ry={16} fill={C.shadow} />
      {/* legs */}
      {[-1, 1].map((s) => (
        <path key={s} d={`M ${cx + s * 128 - 12} 1520 L ${cx + s * 128 + 12} 1520 L ${cx + s * 128 + 6} ${F} L ${cx + s * 128 - 6} ${F} Z`} fill={leg} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      {/* back with channel tufting */}
      <path d={back} fill={c0} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${cx + 70} 1152 Q ${cx + 128} 1152 ${cx + 126} 1212 L ${cx + 126} 1428 L ${cx + 84} 1428 Q ${cx + 96} 1300 ${cx + 70} 1152 Z`} fill={cS} />
      {[-46, 0, 46].map((dx) => <path key={dx} d={`M ${cx + dx} 1180 Q ${cx + dx + 4} 1280 ${cx + dx} 1380`} fill="none" stroke={INK} strokeWidth={3} opacity={0.22} strokeLinecap="round" />)}
      <DustTop x0={cx - 96} x1={cx + 96} y={1152} e={e} h={6} />
      {/* seat cushion */}
      <path d={rr(cx - 114, 1388, 228, 62, 20)} fill={c0} stroke={INK} strokeWidth={OUT} />
      <path d={`M ${cx - 104} 1438 Q ${cx} 1450 ${cx + 104} 1438 L ${cx + 104} 1446 Q ${cx} 1452 ${cx - 104} 1446 Z`} fill={cS} />
      <path d={`M ${cx - 96} 1398 Q ${cx} 1392 ${cx + 96} 1398`} fill="none" stroke={mix(c0, '#FFF7E6', 0.4)} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      {/* front apron */}
      <path d={rr(cx - 150, 1442, 300, 84, 18)} fill={c0} stroke={INK} strokeWidth={OUT} />
      <path d={`M ${cx - 146} 1498 L ${cx + 146} 1498 L ${cx + 146} 1508 Q ${cx + 146} 1522 ${cx + 132} 1522 L ${cx - 132} 1522 Q ${cx - 146} 1522 ${cx - 146} 1508 Z`} fill={cS} />
      {/* rolled arms */}
      {([-1, 1] as const).map((s) => {
        const xo = cx + s * 170, xi = cx + s * 106;
        const a = Math.min(xo, xi), b = Math.max(xo, xi);
        return (
          <g key={s}>
            <path d={arm(s)} fill={c0} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
            <path d={`M ${b - 18} 1300 Q ${b - 2} 1310 ${b - 2} 1336 L ${b - 2} 1524 L ${b - 18} 1524 Z`} fill={cS} />
            <ellipse cx={(a + b) / 2} cy={1326} rx={26} ry={22} fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
            <DustTop x0={a + 10} x1={b - 10} y={1295} e={e} h={5} />
          </g>
        );
      })}
      {which === 'A' ? <ThrowAndCushion cx={cx} ctx={ctx} /> : <Cushion x={cx + 34} y={1348} rot={8} color={C.coral} ctx={ctx} />}
    </g>
  );
};

const Cushion: React.FC<{x: number; y: number; rot: number; color: string; ctx: Ctx}> = ({x, y, rot, color, ctx}) => {
  const {L, e} = ctx;
  const c0 = L(mix(color, '#BDB3A6', 0.3 * e));
  const flat = 1 - 0.12 * e;
  const d = `M -58 -50 Q 0 -40 58 -50 Q 50 0 58 50 Q 0 40 -58 50 Q -50 0 -58 -50 Z`;
  return (
    <g transform={`translate(${x} ${y + 6 * e}) rotate(${rot}) scale(1 ${flat})`}>
      <path d={d} fill={c0} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M 58 -50 Q 50 0 58 50 Q 0 40 -58 50 Q 0 30 30 18 Q 46 -10 58 -50 Z`} fill={shade(c0, 0.28)} />
      <circle r={5} fill={shade(c0, 0.4)} stroke={INK} strokeWidth={2} />
      <path d="M -30 -6 Q -14 -2 -5 0 M 5 0 Q 18 4 30 10" fill="none" stroke={INK} strokeWidth={2} opacity={0.3} strokeLinecap="round" />
      {e > 0.01 && <path d="M -50 -46 Q 0 -38 50 -46" fill="none" stroke={DUST} strokeWidth={5} strokeLinecap="round" opacity={0.7 * e} />}
    </g>
  );
};

/** chair A: a saffron cushion and a folded knit throw over the right arm */
const ThrowAndCushion: React.FC<{cx: number; ctx: Ctx}> = ({cx, ctx}) => {
  const {L, e, id} = ctx;
  const base = L(mix('#F4EBD8', '#D9D2C2', 0.4 * e));
  const stripe = L(mix(C.blue, '#8D99A8', 0.4 * e));
  const x0 = cx + 98, x1 = cx + 180;
  const fringe = Array.from({length: 7}, (_, k) => `L ${x1 - 2 - k * 12} ${1478 + (k % 2) * 8}`).join(' ');
  const d = `M ${x0} 1318 Q ${(x0 + x1) / 2} 1282 ${x1} 1318 L ${x1 + 4} 1474 ${fringe} L ${x0 + 2} 1474 Z`;
  return (
    <g>
      <Cushion x={cx - 34} y={1346} rot={-8} color="#EDB34A" ctx={ctx} />
      <path d={d} fill={base} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <clipPath id={`${id}-throw`}><path d={d} /></clipPath>
      <g clipPath={`url(#${id}-throw)`}>
        {[1340, 1372, 1426, 1458].map((y) => <rect key={y} x={x0 - 10} y={y} width={100} height={12} fill={stripe} />)}
        <path d={`M ${x1 - 22} 1300 Q ${x1 + 6} 1320 ${x1 + 6} 1340 L ${x1 + 8} 1490 L ${x1 - 24} 1490 Z`} fill={shade(base, 0.3)} opacity={0.75} />
      </g>
      <path d={`M ${x0 + 4} 1330 Q ${(x0 + x1) / 2} 1316 ${x1} 1330`} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.4} />
      <DustTop x0={x0 + 10} x1={x1 - 10} y={1300} e={e} h={5} />
    </g>
  );
};

/** the flowers in the vase: fresh and upright (era 0) -> dried, faded, heads drooping, a few petals fallen (era 1) */
const Flowers: React.FC<{x: number; y: number; ctx: Ctx}> = ({x, y, ctx}) => {
  const {L, e} = ctx;
  const stems = [
    {a: -30, l: 92, c: C.coral},
    {a: -11, l: 118, c: '#FFFBF0'},
    {a: 5, l: 104, c: C.saffron},
    {a: 20, l: 120, c: C.coral},
    {a: 36, l: 88, c: '#FFFBF0'},
  ];
  const stemC = L(mix('#3F8A55', '#8C7A4A', e));
  return (
    <g>
      {stems.map((s, i) => {
        const sg = s.a < 0 ? -1 : 1;
        const ang = s.a + sg * (58 + 30 * hash(i * 3.1)) * e;
        const l = s.l * (1 - 0.1 * e);
        const hx = x + Math.sin(rad(ang)) * l * (1 - 0.25 * e), hy = y - Math.cos(rad(ang)) * l * (1 - 0.25 * e) - 30 * e;
        const cx = x + Math.sin(rad(s.a * 0.6)) * l * 0.55, cy = y - Math.cos(rad(s.a * 0.6)) * l * (0.75 + 0.2 * e);
        const d = `M ${x} ${y} Q ${cx} ${cy} ${hx} ${hy}`;
        const pc = L(mix(s.c, i % 2 ? '#B08A5E' : '#9C6B45', 0.85 * e));
        const pr = 9 - 3 * e;
        const lx = (x + cx) / 2, ly = (y + cy) / 2;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <path d={d} fill="none" stroke={stemC} strokeWidth={3.4} strokeLinecap="round" />
            {i % 2 === 0 && (
              <ellipse cx={lx + sg * 9} cy={ly} rx={11 * (1 - 0.35 * e)} ry={5 * (1 - 0.3 * e)} fill={stemC} stroke={INK} strokeWidth={2.5} transform={`rotate(${sg * (-30 - 50 * e)} ${lx + sg * 9} ${ly})`} />
            )}
            <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
              {[0, 72, 144, 216, 288].map((pa, j) =>
                hash(i * 7 + j * 1.3) > e * 0.5 ? (
                  <ellipse key={j} cx={0} cy={-pr * 0.9} rx={pr * 0.62} ry={pr} fill={pc} stroke={INK} strokeWidth={2.2} transform={`rotate(${pa})`} />
                ) : null,
              )}
              <circle r={pr * 0.5} fill={L(mix(C.saffronDeep, '#6B4A30', e))} stroke={INK} strokeWidth={2} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

const SideTable: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e, t} = ctx;
  const {cx, top, rx} = TABLE;
  const wood = L('#8A5A3B');
  const steam = 0.6 * (1 - e);
  const vaseX = cx + 30, mugX = cx - 36;
  const vase = L(mix(C.blue, '#8293A8', 0.4 * e));
  const mug = L(mix(C.coral, '#B49C90', 0.45 * e));
  return (
    <g>
      <ellipse cx={cx + 10} cy={F + 5} rx={80} ry={10} fill={C.shadow} />
      <path d={`M ${cx + 12} ${top} L ${cx + 80} ${top + 14} L ${cx + 40} ${F - 40} Z`} fill={C.shadow} opacity={0.6} />
      {/* tripod pedestal */}
      <path d={`M ${cx} ${top + 120} Q ${cx - 30} ${F - 40} ${cx - 62} ${F - 2}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M ${cx} ${top + 120} Q ${cx + 30} ${F - 40} ${cx + 62} ${F - 2}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M ${cx} ${top + 120} Q ${cx - 30} ${F - 40} ${cx - 62} ${F - 2}`} fill="none" stroke={wood} strokeWidth={6} strokeLinecap="round" />
      <path d={`M ${cx} ${top + 120} Q ${cx + 30} ${F - 40} ${cx + 62} ${F - 2}`} fill="none" stroke={shade(wood, 0.25)} strokeWidth={6} strokeLinecap="round" />
      <rect x={cx - 9} y={top + 8} width={18} height={F - top - 64} rx={6} fill={wood} stroke={INK} strokeWidth={3} />
      <rect x={cx + 1} y={top + 12} width={6} height={F - top - 72} fill={shade(wood, 0.3)} />
      {/* top */}
      <path d={`M ${cx - rx} ${top} L ${cx - rx} ${top + 10} Q ${cx} ${top + 24} ${cx + rx} ${top + 10} L ${cx + rx} ${top} Z`} fill={shade(wood, 0.3)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={cx} cy={top} rx={rx} ry={12} fill={mix(wood, '#FFF7E6', 0.12)} stroke={INK} strokeWidth={OUT} />
      {e > 0.01 && <ellipse cx={cx} cy={top} rx={rx - 6} ry={8} fill={DUST} opacity={0.5 * e} />}
      {/* mug */}
      <g>
        <ellipse cx={mugX + 6} cy={top + 2} rx={22} ry={5} fill={C.shadow} />
        <path d={`M ${mugX + 14} ${top - 30} q 16 0 16 12 q 0 12 -16 12`} fill="none" stroke={INK} strokeWidth={9} />
        <path d={`M ${mugX + 14} ${top - 30} q 16 0 16 12 q 0 12 -16 12`} fill="none" stroke={mug} strokeWidth={4} />
        <path d={rr(mugX - 18, top - 40, 34, 40, 6)} fill={mug} stroke={INK} strokeWidth={3} />
        <rect x={mugX - 18} y={top - 26} width={34} height={7} fill={L('#FFFBF0')} />
        <rect x={mugX + 6} y={top - 38} width={8} height={36} fill={shade(mug, 0.3)} opacity={0.7} />
        <path d={rr(mugX - 18, top - 40, 34, 40, 6)} fill="none" stroke={INK} strokeWidth={3} />
        <ellipse cx={mugX - 1} cy={top - 40} rx={15} ry={3.5} fill={L(mix('#6B4630', '#9A9088', e))} stroke={INK} strokeWidth={2} />
        {steam > 0.01 &&
          [0, 1].map((k) => {
            const ph = t * 1.4 + k * 0.5;
            const yy = top - 52 - ((ph * 22) % 22);
            return (
              <path key={k} d={`M ${mugX - 6 + k * 10} ${yy} q ${-8} -12 0 -24 q 8 -12 0 -24`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={steam * (0.6 + 0.4 * Math.sin(ph * 3))} />
            );
          })}
        {e > 0.01 && <rect x={mugX - 18} y={top - 42} width={34} height={4} rx={2} fill={DUST} opacity={0.6 * e} />}
      </g>
      {/* vase and flowers */}
      <Flowers x={vaseX} y={top - 58} ctx={ctx} />
      <ellipse cx={vaseX + 6} cy={top + 2} rx={26} ry={5} fill={C.shadow} />
      <path d={`M ${vaseX - 14} ${top} Q ${vaseX - 30} ${top - 26} ${vaseX - 12} ${top - 46} L ${vaseX - 9} ${top - 60} L ${vaseX + 9} ${top - 60} L ${vaseX + 12} ${top - 46} Q ${vaseX + 30} ${top - 26} ${vaseX + 14} ${top} Z`} fill={vase} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M ${vaseX + 6} ${top - 44} Q ${vaseX + 26} ${top - 26} ${vaseX + 12} ${top - 2} L ${vaseX + 4} ${top - 2} Q ${vaseX + 14} ${top - 24} ${vaseX + 2} ${top - 44} Z`} fill={shade(vase, 0.3)} />
      <path d={`M ${vaseX - 14} ${top - 36} Q ${vaseX - 20} ${top - 24} ${vaseX - 14} ${top - 12}`} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      {/* fallen petals */}
      {e > 0.3 &&
        [
          [cx + 4, top - 2, 20],
          [cx + 58, top + 2, -30],
          [cx - 58, top + 4, 50],
        ].map(([px, py, ra], k) => <ellipse key={k} cx={px} cy={py} rx={6} ry={3.5} fill={L(k === 1 ? '#B08A5E' : '#9C6B45')} stroke={INK} strokeWidth={1.6} transform={`rotate(${ra} ${px} ${py})`} opacity={ss(e, 0.3 + k * 0.1, 0.8)} />)}
    </g>
  );
};

const Sideboard: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e} = ctx;
  const wood = L('#9A6440');
  const top = mix(wood, '#FFF7E6', 0.14);
  const dk = shade(wood, 0.3);
  const {x0, x1} = SB;
  const doors = 3;
  const dw = (x1 - x0 - 40) / doors;
  return (
    <g>
      {/* wall shadow (lower right) and floor shadow */}
      <rect x={x0 + 26} y={SB.topBack + 10} width={x1 - x0} height={SB.body1 - SB.topBack} fill={C.shadow} />
      <ellipse cx={(x0 + x1) / 2 + 16} cy={F + 6} rx={(x1 - x0) / 2 + 20} ry={14} fill={C.shadow} />
      {/* tapered legs */}
      {[x0 + 40, x1 - 40].map((lx, k) => (
        <path key={k} d={`M ${lx - 14} ${SB.body1 - 4} L ${lx + 14} ${SB.body1 - 4} L ${lx + 6} ${F} L ${lx - 6} ${F} Z`} fill={shade(wood, 0.15)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      {/* body */}
      <rect x={x0 + 12} y={SB.edge - 4} width={x1 - x0 - 24} height={SB.body1 - SB.edge + 4} fill={wood} stroke={INK} strokeWidth={OUT} />
      <rect x={x1 - 40} y={SB.edge} width={26} height={SB.body1 - SB.edge - 2} fill={dk} />
      <rect x={x0 + 14} y={SB.edge} width={x1 - x0 - 28} height={12} fill={C.shadow} />
      {Array.from({length: doors}, (_, k) => {
        const dx = x0 + 20 + k * dw;
        return (
          <g key={k}>
            <rect x={dx + 6} y={SB.edge + 22} width={dw - 12} height={SB.body1 - SB.edge - 40} rx={4} fill={mix(wood, '#FFF7E6', 0.06)} stroke={INK} strokeWidth={3} />
            <path d={`M ${dx + dw - 6} ${SB.edge + 22} L ${dx + dw - 6} ${SB.body1 - 18} L ${dx + 6} ${SB.body1 - 18} L ${dx + 16} ${SB.body1 - 28} L ${dx + dw - 16} ${SB.body1 - 28} L ${dx + dw - 16} ${SB.edge + 32} Z`} fill={dk} opacity={0.7} />
            <circle cx={k === 1 ? dx + 18 : k === 0 ? dx + dw - 18 : dx + 18} cy={(SB.edge + SB.body1) / 2 + 2} r={7} fill={L(C.saffronDeep)} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
      {/* top: the surface seen slightly from above, then the front edge */}
      <path d={`M ${x0 - 6} ${SB.topFront} L ${x0 + 6} ${SB.topBack} L ${x1 - 6} ${SB.topBack} L ${x1 + 6} ${SB.topFront} Z`} fill={top} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={x0 - 6} y={SB.topFront} width={x1 - x0 + 12} height={SB.edge - SB.topFront} rx={3} fill={wood} stroke={INK} strokeWidth={OUT} />
      <rect x={x0 - 4} y={SB.edge - 6} width={x1 - x0 + 8} height={4} fill={dk} opacity={0.8} />
      {e > 0.01 && <path d={`M ${x0 + 2} ${SB.topFront - 2} L ${x0 + 10} ${SB.topBack + 2} L ${x1 - 10} ${SB.topBack + 2} L ${x1 - 2} ${SB.topFront - 2} Z`} fill={DUST} opacity={0.55 * e} />}
    </g>
  );
};

const Shelf: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e} = ctx;
  const wood = L('#B07650');
  const {x0, x1, y, h} = SHELF;
  const books = [
    {w: 22, h: 96, c: C.coral},
    {w: 18, h: 84, c: C.teal},
    {w: 26, h: 102, c: C.saffron},
    {w: 20, h: 80, c: C.blue},
    {w: 16, h: 90, c: '#FFFBF0'},
  ];
  let bx = x0 + 22;
  const vine = L(mix('#4E9A5A', '#A08A5A', e));
  const pot = L('#C8714E');
  const potX = 1458;
  const strand = (s: -1 | 1, len: number, seed: number) => {
    const n = 6;
    const pts = Array.from({length: n}, (_, k) => {
      const u = k / (n - 1);
      return {x: potX + s * (18 + 20 * u + 6 * Math.sin(u * 5 + seed)), y: y + 4 + len * u * (1 - 0.35 * e)};
    });
    return pts;
  };
  return (
    <g>
      {/* books */}
      {books.map((b, k) => {
        const x = bx;
        bx += b.w + 2;
        const c0 = L(mix(b.c, '#B5AEA3', 0.35 * e));
        return (
          <g key={k}>
            <rect x={x} y={y - b.h} width={b.w} height={b.h} rx={2} fill={c0} stroke={INK} strokeWidth={3} />
            <rect x={x + b.w * 0.6} y={y - b.h + 2} width={b.w * 0.4 - 1.5} height={b.h - 4} fill={shade(c0, 0.25)} />
            <rect x={x + 3} y={y - b.h + 14} width={b.w - 6} height={5} fill={shade(c0, 0.35)} />
            <DustTop x0={x + 1} x1={x + b.w - 1} y={y - b.h} e={e} h={4} />
          </g>
        );
      })}
      {/* a leaning book */}
      <g transform={`rotate(18 ${bx + 4} ${y})`}>
        <rect x={bx + 4} y={y - 88} width={20} height={88} rx={2} fill={L(mix('#7A5A8C', '#A9A2A8', 0.35 * e))} stroke={INK} strokeWidth={3} />
      </g>
      {/* the plant: a trailing pothos, then dried and thinned */}
      {([-1, 1] as const).map((s) => {
        const pts = strand(s, 130 + (s > 0 ? 30 : 0), s > 0 ? 1.3 : 0.2);
        return (
          <g key={s}>
            <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={vine} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            {pts.slice(1).map((p, k) =>
              hash(k * 3.3 + s) > e * 0.55 ? (
                <path key={k} d={`M 0 0 Q -10 -4 -9 8 Q -6 16 0 20 Q 6 16 9 8 Q 10 -4 0 0 Z`} transform={`translate(${p.x} ${p.y}) rotate(${s * (20 + 40 * e) + k * 10}) scale(${1 - 0.3 * e})`} fill={L(mix(k % 2 ? '#5DAA62' : '#4E9A5A', k % 2 ? '#B49A62' : '#9C8456', e))} stroke={INK} strokeWidth={2.2} />
              ) : null,
            )}
          </g>
        );
      })}
      <path d={`M ${potX - 26} ${y - 46} L ${potX + 26} ${y - 46} L ${potX + 20} ${y} L ${potX - 20} ${y} Z`} fill={pot} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M ${potX + 8} ${y - 46} L ${potX + 26} ${y - 46} L ${potX + 20} ${y} L ${potX + 6} ${y} Z`} fill={shade(pot, 0.3)} />
      <rect x={potX - 30} y={y - 52} width={60} height={12} rx={3} fill={pot} stroke={INK} strokeWidth={3} />
      {[[-12, -62, -20], [6, -70, 10], [18, -60, 40]].map(([dx, dy, ra], k) =>
        hash(k * 9.1) > e * 0.6 ? <path key={k} d="M 0 0 Q -10 -4 -9 8 Q -6 16 0 20 Q 6 16 9 8 Q 10 -4 0 0 Z" transform={`translate(${potX + dx} ${y + dy}) rotate(${180 + ra + 60 * e}) scale(${1 - 0.25 * e})`} fill={vine} stroke={INK} strokeWidth={2.2} /> : null,
      )}
      {/* a toy rocket (his first one) */}
      <g transform={`translate(1606 ${y})`}>
        <path d="M -16 0 L -26 0 L -16 -26 Z M 16 0 L 26 0 L 16 -26 Z" fill={L(C.coral)} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M -16 0 L -16 -52 Q -16 -80 0 -92 Q 16 -80 16 -52 L 16 0 Z" fill={L('#F4F6F8')} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M 4 -88 Q 16 -78 16 -52 L 16 0 L 6 0 Z" fill={L('#C9D3DC')} />
        <path d="M -14 -66 Q 0 -72 14 -66 L 14 -60 Q 0 -66 -14 -60 Z" fill={L(C.saffron)} />
        <circle cx={0} cy={-42} r={7} fill={L('#4F7CC9')} stroke={INK} strokeWidth={2.5} />
        <DustTop x0={-12} x1={12} y={-84} e={e} h={4} />
      </g>
      {/* board and brackets */}
      {[x0 + 60, x1 - 60].map((bxk) => (
        <path key={bxk} d={`M ${bxk - 8} ${y + h} L ${bxk + 8} ${y + h} L ${bxk + 8} ${y + h + 10} L ${bxk - 2} ${y + h + 52} L ${bxk - 8} ${y + h + 52} Z`} fill={shade(wood, 0.2)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <rect x={x0 + 20} y={y + h} width={x1 - x0} height={12} fill={C.shadow} />
      <rect x={x0} y={y} width={x1 - x0} height={h} rx={3} fill={wood} stroke={INK} strokeWidth={OUT} />
      <rect x={x0 + 2} y={y + h - 6} width={x1 - x0 - 4} height={4} fill={shade(wood, 0.3)} />
      <DustTop x0={bx + 30} x1={x1 - 4} y={y - 3} e={e} h={4} />
    </g>
  );
};

const Pendant: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e} = ctx;
  const {x, y} = PENDANT;
  const sh = L(mix(C.teal, '#7E9A9A', 0.4 * e));
  return (
    <g>
      <line x1={x} y1={PENDANT.rose + 2} x2={x} y2={y - 52} stroke={INK} strokeWidth={4} />
      <rect x={x - 9} y={y - 62} width={18} height={14} rx={3} fill={L('#C9A24B')} stroke={INK} strokeWidth={2.5} />
      <circle cx={x} cy={y + 2} r={13} fill={L('#FFF6DA')} stroke={INK} strokeWidth={2.5} />
      <path d={`M ${x - 66} ${y} Q ${x - 66} ${y - 50} ${x} ${y - 52} Q ${x + 66} ${y - 50} ${x + 66} ${y} Z`} fill={sh} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${x + 14} ${y - 50} Q ${x + 64} ${y - 44} ${x + 64} ${y - 2} L ${x + 34} ${y - 2} Q ${x + 36} ${y - 34} ${x + 14} ${y - 50} Z`} fill={shade(sh, 0.3)} />
      <path d={`M ${x - 46} ${y - 18} Q ${x - 40} ${y - 38} ${x - 16} ${y - 44}`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.45} />
      <DustTop x0={x - 30} x1={x + 30} y={y - 54} e={e} h={5} />
    </g>
  );
};

const FloorLamp: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e} = ctx;
  const {x, top} = LAMP;
  const shadeC = L(mix('#FFF3DA', '#DAD3C4', 0.5 * e));
  const brass = L('#C9A24B');
  return (
    <g>
      <ellipse cx={x + 10} cy={F + 4} rx={60} ry={9} fill={C.shadow} />
      <rect x={x - 5} y={top + 80} width={10} height={F - top - 90} fill={brass} stroke={INK} strokeWidth={3} />
      <path d={`M ${x - 46} ${F} Q ${x - 46} ${F - 18} ${x} ${F - 20} Q ${x + 46} ${F - 18} ${x + 46} ${F} Z`} fill={brass} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M ${x - 44} ${top} L ${x + 44} ${top} L ${x + 70} ${top + 96} L ${x - 70} ${top + 96} Z`} fill={shadeC} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${x + 14} ${top + 2} L ${x + 44} ${top + 2} L ${x + 68} ${top + 94} L ${x + 30} ${top + 94} Z`} fill={shade(shadeC, 0.2)} />
      <DustTop x0={x - 40} x1={x + 40} y={top - 2} e={e} h={5} />
    </g>
  );
};

const Radiator: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e} = ctx;
  const c0 = L('#ECE5D6');
  const x0 = 704, x1 = 956, y0 = 1300, y1 = 1450;
  const n = 9;
  const fw = (x1 - x0) / n;
  return (
    <g>
      <rect x={x0 + 14} y={y0 + 10} width={x1 - x0} height={y1 - y0} fill={C.shadow} />
      {Array.from({length: n}, (_, k) => (
        <g key={k}>
          <rect x={x0 + k * fw + 2} y={y0} width={fw - 4} height={y1 - y0} rx={fw / 2 - 2} fill={c0} stroke={INK} strokeWidth={3} />
          <rect x={x0 + k * fw + fw * 0.55} y={y0 + 6} width={fw * 0.3} height={y1 - y0 - 12} rx={3} fill={shade(c0, 0.2)} />
        </g>
      ))}
      <rect x={x0 - 4} y={y0 + 18} width={x1 - x0 + 8} height={12} rx={4} fill={c0} stroke={INK} strokeWidth={2.5} />
      <rect x={x0 - 4} y={y1 - 32} width={x1 - x0 + 8} height={12} rx={4} fill={c0} stroke={INK} strokeWidth={2.5} />
      {[x0 + 14, x1 - 14].map((fx) => <rect key={fx} x={fx - 6} y={y1} width={12} height={F - y1 - 30} fill={shade(c0, 0.25)} stroke={INK} strokeWidth={2.5} />)}
      <circle cx={x1 + 10} cy={y1 - 12} r={9} fill={L('#C9A24B')} stroke={INK} strokeWidth={2.5} />
      <DustTop x0={x0 + 2} x1={x1 - 2} y={y0} e={e} h={5} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// architecture
const Wall: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e, id} = ctx;
  const wpBase = L(mix('#F2E2C4', '#DCD1BD', 0.5 * e));
  const wpStripe = L(mix('#ECD9B6', '#D3C7B1', 0.5 * e));
  const wpPetal = L(mix('#E4BE96', '#CDBEA4', 0.55 * e));
  const wpDot = L(mix('#D9A877', '#C2B094', 0.55 * e));
  const wpLeaf = L(mix('#C9C79A', '#C2BBA4', 0.55 * e));
  const trim = L('#F6EEDF');
  const wains = L(mix('#8FA8B3', '#9AA3A6', 0.4 * e));
  const DADO = 1140;
  const SKIRT = 1490;
  const sprig = (x: number, y: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y})`}>
      <ellipse cx={-11} cy={10} rx={6} ry={3} fill={wpLeaf} transform="rotate(28 -11 10)" />
      <ellipse cx={10} cy={12} rx={5} ry={2.6} fill={wpLeaf} transform="rotate(-24 10 12)" />
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.sin(rad(a)) * 5} cy={-Math.cos(rad(a)) * 5} r={3.6} fill={wpPetal} />)}
      <circle r={2.4} fill={wpDot} />
    </g>
  );
  return (
    <g>
      <defs>
        <pattern id={`${id}-wp`} x={0} y={0} width={96} height={96} patternUnits="userSpaceOnUse">
          <rect width={96} height={96} fill={wpBase} />
          <rect x={21} y={0} width={6} height={96} fill={wpStripe} />
          <rect x={69} y={0} width={6} height={96} fill={wpStripe} />
          {sprig(0, 0, 0)}
          {sprig(96, 0, 1)}
          {sprig(0, 96, 2)}
          {sprig(96, 96, 3)}
          {sprig(48, 48, 4)}
        </pattern>
      </defs>
      {/* ceiling plane: boards receding overhead (mild perspective), a little darker than the wall; then the cornice */}
      <rect x={-900} y={-1000} width={3800} height={CEIL + 1000} fill={L(mix('#E6DAC5', '#D5CCBE', 0.4 * e))} />
      {Array.from({length: 34}, (_, k) => {
        const x = -900 + k * 120;
        const xt = CEIL_VP.x + ((x - CEIL_VP.x) * (CEIL_VP.y + 1000)) / (CEIL_VP.y - (CEIL - 40));
        return <line key={k} x1={x} y1={CEIL - 40} x2={xt} y2={-1000} stroke={INK} strokeWidth={2.5} opacity={0.09} />;
      })}
      <rect x={-900} y={CEIL - 90} width={3800} height={50} fill={C.shadow} opacity={0.5} />
      {/* ceiling rose where the pendant hangs */}
      <ellipse cx={PENDANT.x} cy={PENDANT.rose} rx={70} ry={16} fill={trim} stroke={INK} strokeWidth={3} />
      <ellipse cx={PENDANT.x} cy={PENDANT.rose + 2} rx={44} ry={9} fill={shade(trim, 0.12)} stroke={INK} strokeWidth={2} />
      <rect x={-900} y={CEIL - 40} width={3800} height={22} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={-900} y={CEIL - 18} width={3800} height={18} fill={shade(trim, 0.12)} stroke={INK} strokeWidth={3} />
      {/* wallpaper */}
      <rect x={-900} y={CEIL} width={3800} height={DADO - CEIL} fill={`url(#${id}-wp)`} />
      <rect x={-900} y={CEIL} width={3800} height={14} fill={C.shadow} />
      {/* dado rail, panelled wainscot, skirting */}
      <rect x={-900} y={DADO + 16} width={3800} height={SKIRT - DADO - 16} fill={wains} />
      {Array.from({length: 17}, (_, k) => {
        const px = -900 + k * 240 + 24;
        return (
          <g key={k}>
            <rect x={px} y={DADO + 46} width={192} height={SKIRT - DADO - 82} rx={4} fill={mix(wains, '#FFFFFF', 0.06)} stroke={INK} strokeWidth={2.5} opacity={0.9} />
            <path d={`M ${px + 192} ${DADO + 46} L ${px + 192} ${SKIRT - 36} L ${px} ${SKIRT - 36} L ${px + 8} ${SKIRT - 44} L ${px + 184} ${SKIRT - 44} L ${px + 184} ${DADO + 54} Z`} fill={shade(wains, 0.25)} />
          </g>
        );
      })}
      <rect x={-900} y={DADO} width={3800} height={18} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={-900} y={DADO + 18} width={3800} height={8} fill={C.shadow} />
      <rect x={-900} y={SKIRT} width={3800} height={F - SKIRT} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={-900} y={SKIRT + 8} width={3800} height={4} fill={shade(trim, 0.2)} />
      <rect x={-900} y={F - 14} width={3800} height={14} fill={shade(trim, 0.12)} />
    </g>
  );
};

const Doorway: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e, id} = ctx;
  const {x0, x1, y0, casing: cw} = DOOR;
  const trim = L('#F6EEDF');
  const hall = L(mix('#5A4A42', '#3B3A42', 0.6 * e));
  const leaf = L('#8A5A3B');
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={F - y0} fill={hall} />
      <clipPath id={`${id}-door`}><rect x={x0} y={y0} width={x1 - x0} height={F - y0} /></clipPath>
      <g clipPath={`url(#${id}-door)`}>
        {/* the hall beyond: its far wall, skirting, floor and a spill of daylight from the front door */}
        <rect x={x0} y={y0} width={x1 - x0} height={F - y0} fill={hall} />
        <rect x={x0} y={y0} width={x1 - x0} height={70} fill={shade(hall, 0.3)} />
        <rect x={x0} y={F - 92} width={x1 - x0} height={18} fill={shade(hall, 0.2)} />
        <path d={`M ${x0} ${F - 74} L ${x1} ${F - 74} L ${x1} ${F} L ${x0} ${F} Z`} fill={shade(hall, 0.35)} />
        <path d={`M ${x0 + 40} ${F - 74} L ${x1 - 30} ${F - 74} L ${x1 + 10} ${F} L ${x0 + 60} ${F} Z`} fill={L(mix('#FFE7A6', '#BFD3E2', e))} opacity={0.22} />
        <rect x={x0 + 96} y={y0 + 150} width={8} height={30} rx={3} fill={shade(hall, 0.4)} />
        <rect x={x0 + 160} y={y0 + 150} width={8} height={30} rx={3} fill={shade(hall, 0.4)} />
        {/* the door leaf, swung open into the hall */}
        <path d={`M ${x0} ${y0} L ${x0 + 74} ${y0 + 30} L ${x0 + 74} ${F - 22} L ${x0} ${F} Z`} fill={leaf} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <path d={`M ${x0 + 14} ${y0 + 50} L ${x0 + 60} ${y0 + 68} L ${x0 + 60} ${y0 + 320} L ${x0 + 14} ${y0 + 310} Z M ${x0 + 14} ${y0 + 370} L ${x0 + 60} ${y0 + 378} L ${x0 + 60} ${F - 60} L ${x0 + 14} ${F - 50} Z`} fill={shade(leaf, 0.25)} stroke={INK} strokeWidth={2.5} />
        <circle cx={x0 + 66} cy={y0 + 370} r={6} fill={L(C.saffronDeep)} stroke={INK} strokeWidth={2} />
        {/* the room's light falls a little way into the opening */}
        <rect x={x0} y={y0} width={18} height={F - y0} fill={C.shadow} />
      </g>
      <DoorCasing ctx={ctx} />
      {/* light switch (blank plate) */}
      <rect x={114} y={1170} width={40} height={40} rx={6} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={126} y={1180} width={16} height={20} rx={4} fill={shade(trim, 0.18)} stroke={INK} strokeWidth={2} />
    </g>
  );
};

const DoorCasing: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e} = ctx;
  const {x0, x1, y0, casing: cw} = DOOR;
  const trim = L('#F6EEDF');
  return (
    <g>
      <path d={`M ${x0 - cw} ${F} L ${x0 - cw} ${y0 - cw} L ${x1 + cw} ${y0 - cw} L ${x1 + cw} ${F} L ${x1} ${F} L ${x1} ${y0} L ${x0} ${y0} L ${x0} ${F} Z`} fill={trim} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${x1 + cw - 2} ${y0 - cw + 2} L ${x1 + cw - 2} ${F} L ${x1 + cw - 10} ${F} L ${x1 + cw - 10} ${y0 - cw + 10} Z`} fill={shade(trim, 0.18)} />
      <rect x={x1 + cw} y={y0 - cw + 8} width={14} height={F - y0 + cw - 8} fill={C.shadow} />
      {e > 0.01 && <Cobweb x={x0 + 2} y={y0 + 2} r={66} dirX={1} dirY={1} op={0.5 * e} />}
    </g>
  );
};

/** The wall around the doorway and its casing, to draw OVER a figure who is still in the hall (so he is seen only
 *  through the opening). Draw <Room/>, then the figure, then <RoomDoorFront/> with the same t / era (any id). Once he
 *  is past x = ROOM.doorway.x1 + casing + 16 (= 102) in front of the wall, stop drawing it. */
export const RoomDoorFront: React.FC<{t: number; id: string; era: number}> = ({t, id, era}) => {
  const e = clamp(era);
  const ctx: Ctx = {e, t, id: `${id}-df`, L: (c: string) => lightCol(c, e)};
  const xr = DOOR.x1 + DOOR.casing + 16;
  const d = `M -900 ${CEIL - 45} H ${xr} V ${F} H -900 Z M ${DOOR.x0} ${DOOR.y0} V ${F} H ${DOOR.x1} V ${DOOR.y0} Z`;
  return (
    <g>
      <clipPath id={`${id}-dfclip`}><path d={d} clipRule="evenodd" /></clipPath>
      <g clipPath={`url(#${id}-dfclip)`}><Wall ctx={ctx} /></g>
      <DoorCasing ctx={ctx} />
    </g>
  );
};

/** default view through the window when none is given: sky, the yard and a fence (room coordinates) */
const DefaultWindowView: React.FC<{e: number}> = ({e}) => {
  const {x0, y0, x1, y1} = WIN;
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={mix('#9FD3EE', '#C3D3DF', e)} />
      <circle cx={x0 + 90} cy={y0 + 110} r={44} fill={mix('#FFF3C4', '#F2F4F2', e)} opacity={0.9} />
      <path d={`M ${x0} ${y0 + 340} Q ${x0 + 100} ${y0 + 300} ${x0 + 190} ${y0 + 330} Q ${x0 + 290} ${y0 + 290} ${x1} ${y0 + 330} L ${x1} ${y1} L ${x0} ${y1} Z`} fill={mix('#7FB27A', '#93A79A', e)} stroke={INK} strokeWidth={3} />
      <rect x={x0} y={y0 + 400} width={x1 - x0} height={y1 - y0 - 400} fill={mix('#8DC08A', '#A3B39F', e)} />
      {Array.from({length: 14}, (_, k) => (
        <path key={k} d={`M ${x0 + k * 30 + 4} ${y0 + 440} L ${x0 + k * 30 + 4} ${y0 + 380} L ${x0 + k * 30 + 12} ${y0 + 370} L ${x0 + k * 30 + 20} ${y0 + 380} L ${x0 + k * 30 + 20} ${y0 + 440} Z`} fill={mix('#FFFBF0', '#E2E2DC', e)} stroke={INK} strokeWidth={2.5} />
      ))}
    </g>
  );
};

const Window: React.FC<{ctx: Ctx; view?: React.ReactNode; glassFade?: number}> = ({ctx, view, glassFade = 0}) => {
  const {L, e, id, t} = ctx;
  const {x0, y0, x1, y1} = WIN;
  const cw = WIN_CASING;
  const trim = L('#F6EEDF');
  const cur = L(mix('#E9B653', '#CBBE9F', 0.75 * e));
  const curS = shade(cur, 0.25);
  const curtain = (xa: number, xb: number, side: -1 | 1) => {
    const inner = side < 0 ? xb : xa, outer = side < 0 ? xa : xb;
    const sway = (1 - e) * 2.5 * Math.sin(t * 0.9 + side);
    const bottom = CURTAIN.bottom;
    const innerB = inner + side * 8 + sway;
    const hem = Array.from({length: 5}, (_, k) => {
      const u = (k + 1) / 5;
      const x = innerB + (outer - innerB) * u;
      return `Q ${x - (outer - innerB) / 10} ${bottom + (k % 2 ? -8 : 8)} ${x} ${bottom}`;
    }).join(' ');
    const d = `M ${outer} ${CURTAIN.rodY + 6} L ${inner} ${CURTAIN.rodY + 6} Q ${inner - side * 4} ${(CURTAIN.rodY + bottom) / 2} ${innerB} ${bottom} ${hem} Z`;
    const folds = [0.25, 0.5, 0.75].map((u) => xa + (xb - xa) * u);
    return (
      <g>
        <path d={d} fill={C.shadow} transform="translate(12 6)" />
        <path d={d} fill={cur} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <clipPath id={`${id}-cur${side}`}><path d={d} /></clipPath>
        <g clipPath={`url(#${id}-cur${side})`}>
          {folds.map((fx, k) => (
            <path key={k} d={`M ${fx} ${CURTAIN.rodY} Q ${fx + 6} ${(CURTAIN.rodY + bottom) / 2} ${fx + (k - 1) * 4 + sway * 0.5} ${bottom + 10} L ${fx + 14 + (k - 1) * 4 + sway * 0.5} ${bottom + 10} Q ${fx + 18} ${(CURTAIN.rodY + bottom) / 2} ${fx + 12} ${CURTAIN.rodY} Z`} fill={curS} />
          ))}
          {/* a soft woven pattern */}
          {Array.from({length: 12}, (_, k) => (
            <circle key={k} cx={xa + 16 + (k % 3) * 34 + (Math.floor(k / 3) % 2) * 16} cy={CURTAIN.rodY + 60 + Math.floor(k / 3) * 150} r={5} fill={mix(cur, '#FFFBF0', 0.45)} />
          ))}
        </g>
        {folds.map((fx, k) => <path key={k} d={`M ${fx + 13} ${CURTAIN.rodY + 10} Q ${fx + 17} ${(CURTAIN.rodY + bottom) / 2} ${fx + 13 + (k - 1) * 4 + sway * 0.5} ${bottom - 6}`} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.35} />)}
      </g>
    );
  };
  return (
    <g>
      {/* glass: the view (clipped), then a faint glass tint, the casing's shadow on the top and left, sheen */}
      <clipPath id={`${id}-glass`}><rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} /></clipPath>
      <g clipPath={`url(#${id}-glass)`}>
        {view ?? <DefaultWindowView e={e} />}
        <g opacity={1 - glassFade}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={mix('#DDEFFA', '#C9D3DC', e)} opacity={0.08 + 0.1 * e} />
          <path d={`M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y0 + 12} L ${x0 + 12} ${y0 + 12} L ${x0 + 12} ${y1} L ${x0} ${y1} Z`} fill={C.shadow} />
          {[0, 1].map((k) => (
            <path key={k} d={`M ${x0 + 30 + k * 200} ${y1} L ${x0 + 210 + k * 200} ${y0} L ${x0 + 240 + k * 200} ${y0} L ${x0 + 60 + k * 200} ${y1} Z`} fill="#FFFFFF" opacity={0.07} />
          ))}
        </g>
        {e > 0.01 && <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={DUST} opacity={0.1 * e} />}
      </g>
      {/* mullion and transom */}
      <rect x={WIN_MULL.x - WIN_MULL.w / 2} y={y0} width={WIN_MULL.w} height={y1 - y0} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={x0} y={WIN_TRANSOM.y - WIN_TRANSOM.h / 2} width={x1 - x0} height={WIN_TRANSOM.h} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={WIN_MULL.x + 2} y={WIN_TRANSOM.y + WIN_TRANSOM.h / 2} width={WIN_MULL.w / 2 - 2} height={y1 - WIN_TRANSOM.y - WIN_TRANSOM.h / 2} fill={shade(trim, 0.15)} />
      {/* casing (a frame around the glass) */}
      <path d={`M ${x0 - cw} ${y1} L ${x0 - cw} ${y0 - cw} L ${x1 + cw} ${y0 - cw} L ${x1 + cw} ${y1} L ${x1} ${y1} L ${x1} ${y0} L ${x0} ${y0} L ${x0} ${y1} Z`} fill={trim} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${x1 + cw - 2} ${y0 - cw + 2} L ${x1 + cw - 2} ${y1} L ${x1 + cw - 9} ${y1} L ${x1 + cw - 9} ${y0 - cw + 9} Z`} fill={shade(trim, 0.15)} />
      <rect x={x1 + cw} y={y0 - cw + 8} width={12} height={y1 - y0 + cw} fill={C.shadow} />
      {/* sill and apron */}
      <rect x={SILL.x0 + 16} y={SILL.y1} width={SILL.x1 - SILL.x0 - 32} height={22} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={SILL.x0 + 18} y={SILL.y1 + 2} width={SILL.x1 - SILL.x0 - 36} height={8} fill={C.shadow} />
      <rect x={SILL.x0} y={SILL.y0} width={SILL.x1 - SILL.x0} height={SILL.y1 - SILL.y0} rx={3} fill={trim} stroke={INK} strokeWidth={OUT} />
      <rect x={SILL.x0 + 2} y={SILL.y0 + 2} width={SILL.x1 - SILL.x0 - 4} height={6} fill={mix(trim, '#FFFFFF', 0.4)} />
      <rect x={SILL.x0 + 2} y={SILL.y1 - 6} width={SILL.x1 - SILL.x0 - 4} height={4} fill={shade(trim, 0.2)} />
      <DustTop x0={SILL.x0 + 6} x1={SILL.x1 - 6} y={SILL.y0 + 1} e={e} h={5} />
      {/* cobweb in the top-left corner of the glass */}
      {e > 0.01 && <Cobweb x={x0 + 2} y={y0 + 2} r={78} dirX={1} dirY={1} op={0.6 * e} />}
      {/* curtains on a rod */}
      {curtain(CURTAIN.left[0], CURTAIN.left[1], -1)}
      {curtain(CURTAIN.right[0], CURTAIN.right[1], 1)}
      <rect x={CURTAIN.x0} y={CURTAIN.rodY - 6} width={CURTAIN.x1 - CURTAIN.x0} height={12} rx={6} fill={L('#7A4E3A')} stroke={INK} strokeWidth={3} />
      {[CURTAIN.x0, CURTAIN.x1].map((fx) => <circle key={fx} cx={fx} cy={CURTAIN.rodY} r={13} fill={L('#7A4E3A')} stroke={INK} strokeWidth={3} />)}
      <DustTop x0={CURTAIN.x0 + 14} x1={CURTAIN.x1 - 14} y={CURTAIN.rodY - 7} e={e} h={4} />
    </g>
  );
};

const Cobweb: React.FC<{x: number; y: number; r: number; dirX: 1 | -1; dirY: 1 | -1; op: number}> = ({x, y, r, dirX, dirY, op}) => {
  const angs = [0, 18, 38, 58, 76, 90].map((a) => rad(a));
  const pt = (a: number, d: number) => ({x: x + dirX * Math.cos(a) * d, y: y + dirY * Math.sin(a) * d});
  const rings = [0.28, 0.5, 0.72, 0.94];
  return (
    <g opacity={op} fill="none" stroke="#F4F4F2" strokeWidth={1.6} strokeLinecap="round">
      {angs.map((a, k) => {
        const p = pt(a, r);
        return <line key={k} x1={x} y1={y} x2={p.x} y2={p.y} />;
      })}
      {rings.map((f, k) => (
        <path key={k} d={angs.slice(0, -1).map((a, j) => {
          const p0 = pt(a, r * f), p1 = pt(angs[j + 1], r * f);
          const m = pt((a + angs[j + 1]) / 2, r * f * 0.86);
          return `${j === 0 ? 'M' : 'L'} ${p0.x} ${p0.y} Q ${m.x} ${m.y} ${p1.x} ${p1.y}`;
        }).join(' ')} />
      ))}
    </g>
  );
};

const Floor: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const {L, e, id} = ctx;
  const wood = L(mix('#A86E48', '#9A8473', 0.35 * e));
  const Y1 = 3000;
  const lines = Array.from({length: 40}, (_, k) => -1100 + k * 110);
  // the rug (in perspective)
  const rugBack = 1640, rugFront = 2150, rx0 = 230, rx1 = 1670;
  const q = (x: number, y: number) => roomFloorPt(x, y);
  const quad = (xa: number, xb: number, ya: number, yb: number) => polyD([q(xa, ya), q(xb, ya), q(xb, yb), q(xa, yb)]);
  const rugC = L(mix('#B4483A', '#9D7D74', 0.45 * e));
  const rugB = L(mix(C.saffron, '#C7B999', 0.45 * e));
  const rugI = L(mix('#F3E6CC', '#D7CFC0', 0.4 * e));
  return (
    <g>
      <rect x={-1000} y={F} width={4000} height={Y1 - F} fill={wood} />
      <clipPath id={`${id}-floor`}><rect x={-1000} y={F} width={4000} height={Y1 - F} /></clipPath>
      <g clipPath={`url(#${id}-floor)`}>
        {lines.map((x, k) => {
          const b = q(x, Y1);
          return <line key={k} x1={x} y1={F} x2={b.x} y2={Y1} stroke={INK} strokeWidth={3} opacity={0.2} />;
        })}
        {/* staggered board ends */}
        {lines.slice(0, -1).map((x, k) =>
          [0, 1, 2].map((j) => {
            const y = F + 120 + ((hash(k * 3.1 + j * 7.7) + j) * 420) % 1400;
            const a = q(x, y), b = q(lines[k + 1], y);
            return <line key={`${k}-${j}`} x1={a.x} y1={y} x2={b.x} y2={y} stroke={INK} strokeWidth={2.5} opacity={0.16} />;
          }),
        )}
        {/* alternate boards a shade darker */}
        {lines.slice(0, -1).map((x, k) =>
          k % 3 === 1 ? <path key={`d${k}`} d={polyD([{x, y: F}, {x: lines[k + 1], y: F}, q(lines[k + 1], Y1), q(x, Y1)])} fill={shade(wood, 0.12)} opacity={0.6} /> : null,
        )}
        {/* rug */}
        <path d={quad(rx0, rx1, rugBack, rugFront)} fill={C.shadow} transform="translate(10 8)" />
        <path d={quad(rx0, rx1, rugBack, rugFront)} fill={rugB} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <path d={quad(rx0 + 34, rx1 - 34, rugBack + 22, rugFront - 30)} fill={rugC} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d={quad(rx0 + 90, rx1 - 90, rugBack + 70, rugFront - 86)} fill="none" stroke={rugI} strokeWidth={6} />
        {Array.from({length: 7}, (_, k) => {
          const cx = rx0 + 230 + k * 163, cy = (rugBack + rugFront) / 2;
          const pts = [q(cx, cy - 90), q(cx + 56, cy), q(cx, cy + 96), q(cx - 56, cy)];
          return <path key={k} d={polyD(pts)} fill={k % 2 ? rugB : rugI} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />;
        })}
        {/* fringe on the front edge */}
        {Array.from({length: 36}, (_, k) => {
          const x = rx0 + 12 + k * ((rx1 - rx0 - 24) / 35);
          const a = q(x, rugFront), b = q(x, rugFront + 22);
          return <line key={`f${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={rugI} strokeWidth={4} strokeLinecap="round" />;
        })}
        {e > 0.01 && <path d={quad(rx0, rx1, rugBack, rugFront)} fill={DUST} opacity={0.12 * e} />}
      </g>
      <line x1={-1000} y1={F} x2={3000} y2={F} stroke={INK} strokeWidth={OUT} />
    </g>
  );
};

/** map a point of the window glass to the sun patch on the floor (sun from the upper left, falling forward) */
const toFloor = (x: number, y: number) => {
  const yf = F + 32 + (WIN.y1 - y) * 0.72;
  return roomFloorPt(x + 40 + (yf - F - 32) * 0.5, yf);
};
const SunPatch: React.FC<{e: number}> = ({e}) => {
  const {x0, y0, x1, y1} = WIN;
  const mx = WIN_MULL.x, mw = WIN_MULL.w / 2 + 2, ty = WIN_TRANSOM.y, th = WIN_TRANSOM.h / 2 + 2;
  const panes: [number, number, number, number][] = [
    [x0 + 10, mx - mw, y0 + 10, ty - th],
    [mx + mw, x1 - 10, y0 + 10, ty - th],
    [x0 + 10, mx - mw, ty + th, y1],
    [mx + mw, x1 - 10, ty + th, y1],
  ];
  const col = mix('#FFE08A', '#DCE8F2', e);
  const op = 0.42 - 0.18 * e;
  return (
    <g opacity={op}>
      {panes.map(([a, b, c, d], k) => <path key={k} d={polyD([toFloor(a, c), toFloor(b, c), toFloor(b, d), toFloor(a, d)])} fill={col} />)}
    </g>
  );
};
/** the beam of window light through the air (and the motes in it, era 1) */
const Beam: React.FC<{e: number; t: number}> = ({e, t}) => {
  const {x0, y0, x1, y1} = WIN;
  const tl = {x: x0 + 14, y: y0 + 14}, tr = {x: x1 - 14, y: y0 + 14};
  const bl = toFloor(x0 + 10, y0 + 10), br = toFloor(x1 - 10, y0 + 10);
  const col = mix('#FFF1C8', '#E4EEF6', e);
  const at = (u: number, v: number) => {
    const a = {x: tl.x + (tr.x - tl.x) * v, y: tl.y + (tr.y - tl.y) * v};
    const b = {x: bl.x + (br.x - bl.x) * v, y: bl.y + (br.y - bl.y) * v};
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u};
  };
  const motes = e > 0.01 ? 34 : 10;
  const mOp = 0.25 + 0.55 * e;
  return (
    <g>
      <path d={polyD([tl, tr, br, bl])} fill={col} opacity={0.07 + 0.06 * e} />
      <path d={polyD([at(0, 0.18), at(0, 0.42), at(1, 0.42), at(1, 0.18)])} fill={col} opacity={0.05 + 0.04 * e} />
      {Array.from({length: motes}, (_, k) => {
        const u = (hash(k * 2.7) + t * (0.012 + 0.01 * hash(k * 5.1)) * (k % 2 ? 1 : -1) + 4) % 1;
        const v = clamp(0.08 + 0.84 * hash(k * 9.3) + 0.04 * noise1(t * 0.5 + k, 3));
        const p = at(0.08 + 0.8 * u, v);
        const tw = 0.55 + 0.45 * Math.sin(t * (1.3 + hash(k) * 2) + k * 1.7);
        const edge = Math.min(1, u * 6, (1 - u) * 6);
        return <circle key={k} cx={p.x} cy={p.y} r={2 + 2.4 * hash(k * 4.4)} fill="#FFF8E8" opacity={mOp * tw * edge} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// the three photographs on the sideboard
const Photos: React.FC<{ctx: Ctx; dustWipe: number; refl?: React.ReactNode; reflOp: number}> = ({ctx, dustWipe, refl, reflOp}) => {
  const {e, id} = ctx;
  const FP = FAMILY_PRINT, FFr = FAMILY_FRAME, PP = PARENT_PRINT, PFr = PARENT_FRAME;
  const w = clamp(dustWipe);
  // the streak: the wipe path sampled up to w
  const N = 24;
  const pts = Array.from({length: N + 1}, (_, k) => wipeAt((k / N) * w));
  const streak = 'M ' + pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
  const off = (dy: number) => 'M ' + pts.map((p) => `${p.x.toFixed(2)} ${(p.y + dy).toFixed(2)}`).join(' L ');
  const ribbonOp = clamp(e);
  const rc = {x: PFr.x + PFr.w, y: PFr.y};
  const d1 = 17, d2 = 50;
  const ribbon = polyD([
    {x: rc.x - d2 - 4, y: rc.y - 4},
    {x: rc.x - d1 + 4, y: rc.y - 4},
    {x: rc.x + 4, y: rc.y + d1 - 4},
    {x: rc.x + 4, y: rc.y + d2 + 4},
  ]);
  return (
    <g>
      {/* cast shadows on the wall and the sideboard top */}
      {[FFr, PFr, FRIEND_FRAME].map((r, k) => (
        <g key={k}>
          <rect x={r.x + 14} y={r.y + 8} width={r.w} height={Math.min(r.h - 4, SB.topBack - r.y - 8)} fill={C.shadow} />
          <ellipse cx={r.x + r.w / 2 + 10} cy={r.y + r.h + 1} rx={r.w / 2 + 6} ry={4} fill={C.shadow} />
        </g>
      ))}
      {/* (2) the father's portrait: gilt frame; the black ribbon across its top-right corner in the present */}
      <FrameMoulding r={PFr} m={PARENT_M} wood="#C9A24B" ctx={ctx} />
      <clipPath id={`${id}-pp`}><rect x={PP.x} y={PP.y} width={PP.w} height={PP.h} /></clipPath>
      <g clipPath={`url(#${id}-pp)`}>
        <g transform={`translate(${PP.x} ${PP.y})`}><ParentPrint id={`${id}-ppr`} w={PP.w} h={PP.h} /></g>
        <rect x={PP.x} y={PP.y} width={PP.w} height={PP.h} fill="#E9C890" opacity={0.08 * e} />
        <Sheen r={PP} op={1 - 0.5 * e} />
        {e > 0.01 && <rect x={PP.x} y={PP.y} width={PP.w} height={PP.h} fill={DUST} opacity={0.3 * e} />}
        <Specks r={PP} n={30} seed={11} op={0.7 * e} />
      </g>
      <InnerLine r={PP} />
      {e > 0.01 && <path d={`M ${PFr.x + 2} ${PFr.y + 2} h ${PFr.w - 4} v ${PFr.h - 4} h ${-(PFr.w - 4)} Z M ${PP.x} ${PP.y} v ${PP.h} h ${PP.w} v ${-PP.h} Z`} fill={DUST} fillRule="evenodd" opacity={0.3 * e} />}
      <DustTop x0={PFr.x + 3} x1={PFr.x + PFr.w - 3} y={PFr.y + 1} e={e} h={5} />
      {ribbonOp > 0.005 && (
        <g opacity={ribbonOp}>
          <clipPath id={`${id}-rib`}><rect x={PFr.x - 3} y={PFr.y - 3} width={PFr.w + 6} height={PFr.h + 6} rx={3} /></clipPath>
          <g clipPath={`url(#${id}-rib)`}>
            <path d={ribbon} fill="#17171C" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d={`M ${rc.x - (d1 + d2) / 2 + 2} ${rc.y - 2} L ${rc.x + 2} ${rc.y + (d1 + d2) / 2 - 2}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.22} />
          </g>
        </g>
      )}

      {/* (3) the pre-departure 9:16 print: slim birch frame (its print content is drawn last, see PrintContent) */}
      <FrameMoulding r={FRIEND_FRAME} m={FRIEND_M} wood="#E2CFA6" ctx={ctx} rx={2} />
      <DustTop x0={FRIEND_FRAME.x + 3} x1={FRIEND_FRAME.x + FRIEND_FRAME.w - 3} y={FRIEND_FRAME.y + 1} e={e} h={4} />

      {/* (1) the family photo (front row): walnut frame, the print, his reflection, dust (wiped), sheen */}
      <FrameMoulding r={FFr} m={FAMILY_M} wood="#7A4B30" ctx={ctx} />
      <clipPath id={`${id}-fp`}><rect x={FP.x} y={FP.y} width={FP.w} height={FP.h} /></clipPath>
      <clipPath id={`${id}-fframe`}><rect x={FFr.x} y={FFr.y} width={FFr.w} height={FFr.h} rx={3} /></clipPath>
      <g clipPath={`url(#${id}-fp)`}>
        <g transform={`translate(${FP.x} ${FP.y})`}><FamilyPrint id={`${id}-fpr`} w={FP.w} h={FP.h} /></g>
        <rect x={FP.x} y={FP.y} width={FP.w} height={FP.h} fill="#E9C890" opacity={0.08 * e} />
        {refl && reflOp > 0.001 && (
          <g style={{mixBlendMode: 'screen'}} opacity={clamp(reflOp)}>
            {refl}
          </g>
        )}
        <Sheen r={FP} op={0.85 - 0.45 * e} />
      </g>
      <InnerLine r={FP} />
      {e > 0.01 && (
        <g>
          <mask id={`${id}-wipe`} maskUnits="userSpaceOnUse" x={FFr.x - 60} y={FFr.y - 60} width={FFr.w + 120} height={FFr.h + 120}>
            <rect x={FFr.x - 60} y={FFr.y - 60} width={FFr.w + 120} height={FFr.h + 120} fill="white" />
            {w > 0.001 && (
              <g>
                <path d={streak} fill="none" stroke="black" strokeWidth={WIPE.width} strokeLinecap="round" strokeLinejoin="round" />
                {/* a little dust stays in the streak, in fine lines along the stroke */}
                {[-22, -9, 6, 19].map((dy, k) => <path key={k} d={off(dy)} fill="none" stroke="#777" strokeWidth={k % 2 ? 2 : 3} strokeLinecap="round" opacity={0.6} />)}
              </g>
            )}
          </mask>
          <g mask={`url(#${id}-wipe)`}>
            <path d={`M ${FFr.x + 2} ${FFr.y + 2} h ${FFr.w - 4} v ${FFr.h - 4} h ${-(FFr.w - 4)} Z M ${FP.x} ${FP.y} v ${FP.h} h ${FP.w} v ${-FP.h} Z`} fill={DUST} fillRule="evenodd" opacity={0.36 * e} />
            <rect x={FP.x} y={FP.y} width={FP.w} height={FP.h} fill={DUST_GLASS} opacity={0.46 * e} />
            {/* old smears in the film */}
            <path d={`M ${FP.x + 20} ${FP.y + FP.h - 30} Q ${FP.x + 80} ${FP.y + FP.h - 50} ${FP.x + 150} ${FP.y + FP.h - 26}`} fill="none" stroke="#F2EFE8" strokeWidth={14} strokeLinecap="round" opacity={0.3 * e} />
            <Specks r={FP} n={70} seed={5} op={0.85 * e} />
            <Specks r={{x: FFr.x, y: FFr.y, w: FFr.w, h: FAMILY_M}} n={16} seed={9} op={0.8 * e} size={1.3} />
            <DustTop x0={FFr.x + 3} x1={FFr.x + FFr.w - 3} y={FFr.y + 1} e={e} h={6} />
          </g>
          {/* the wiped glass shines a little */}
          {w > 0.001 && (
            <g clipPath={`url(#${id}-fp)`}>
              <path d={streak} fill="none" stroke="#FFFFFF" strokeWidth={WIPE.width * 0.3} strokeLinecap="round" opacity={0.12 * e} transform="translate(0 -12)" />
            </g>
          )}
          {/* the dust pushed aside: thin ridges along both edges of the streak */}
          {w > 0.02 && (
            <g clipPath={`url(#${id}-fframe)`} opacity={0.75 * e}>
              <path d={off(-WIPE.width / 2 - 1)} fill="none" stroke={DUST_GLASS} strokeWidth={3.5} strokeLinecap="round" />
              <path d={off(WIPE.width / 2 + 1)} fill="none" stroke={DUST_GLASS} strokeWidth={3.5} strokeLinecap="round" />
            </g>
          )}
          {/* the dust pushed to the end of the streak */}
          {w > 0.02 && (() => {
            const p = wipeAt(w);
            return (
              <g clipPath={`url(#${id}-fframe)`}>
                {/* a low ridge of pushed dust at the end of the streak: a few small specks, faint */}
                {[[-14, -10, 3.2], [-6, 6, 2.4], [4, -2, 2.8], [10, 12, 2.0], [-2, 18, 2.2]].map(([dx, dy, r], q) => (
                  <circle key={q} cx={p.x + 20 + dx * 0.4} cy={p.y + 4 + dy} r={r} fill={DUST_GLASS} opacity={0.4 * e} />
                ))}
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
};

/** the pre-departure print's content: photoView mapped from a 1080x1920 frame, then tint, light, glass and dust */
const PrintContent: React.FC<{ctx: Ctx; view?: React.ReactNode; tint: number; glass: number}> = ({ctx, view, tint, glass}) => {
  const {e, id} = ctx;
  const P = FRIEND_PRINT;
  const s = P.w / 1080;
  return (
    <g>
      <clipPath id={`${id}-print`}><rect x={P.x} y={P.y} width={P.w} height={P.h} /></clipPath>
      <g clipPath={`url(#${id}-print)`}>
        <g transform={`translate(${P.x} ${P.y}) scale(${s})`}>{view ?? <PrintPlaceholder />}</g>
        {tint > 0.001 && (
          <g>
            <rect x={P.x} y={P.y} width={P.w} height={P.h} fill="#E2B270" opacity={0.3 * tint} style={{mixBlendMode: 'multiply'}} />
            <rect x={P.x} y={P.y} width={P.w} height={P.h} fill="#FFF6E6" opacity={0.16 * tint} />
          </g>
        )}
        {glass > 0.001 && (
          <g>
            {/* the room's light on the glass, the sheen, then the era's dust */}
            <rect x={P.x} y={P.y} width={P.w} height={P.h} fill={e > 0.5 ? '#3E4D66' : '#FFE9C2'} opacity={glass * (0.05 + 0.1 * e)} />
            <Sheen r={P} op={glass} />
            {e > 0.01 && <rect x={P.x} y={P.y} width={P.w} height={P.h} fill={DUST} opacity={0.28 * e * glass} />}
            <Specks r={P} n={50} seed={23} op={0.7 * e * glass} />
          </g>
        )}
      </g>
      <InnerLine r={P} />
    </g>
  );
};

/** the dust puff from the wipe: specks and soft clouds lift from the glove's path and drift up; gone at dustWipe 1 */
const Puff: React.FC<{w: number; t: number; e: number; maxW?: number}> = ({w, t, e, maxW = 1}) => {
  if (w <= 0.001 || w >= 0.999 || e < 0.05) return null;
  const fadeEnd = 1 - ss(w, 0.82, 1);
  const n = 30;
  const clouds = [0.1, 0.24, 0.38, 0.52, 0.66];
  return (
    <g opacity={fadeEnd * clamp(e * 1.5)}>
      {clouds.map((u0, k) => {
        const age = (w - u0) / 0.34;
        if (age <= 0 || age >= 1) return null;
        const o = wipeAt(Math.min(u0, maxW));
        const cx = o.x + 18 + 26 * age + 4 * Math.sin(t * 1.7 + k);
        const cy = o.y - 30 - 70 * age;
        const r = 7 + 9 * age;
        const op = 0.75 * Math.sin(Math.PI * Math.min(1, age * 1.1));
        return (
          <g key={`c${k}`} opacity={op}>
            {[[-0.9, 0.2, 0.8], [0, -0.35, 1], [0.95, 0.15, 0.75]].map(([dx, dy, rs], j) => (
              <circle key={j} cx={cx + dx * r} cy={cy + dy * r} r={r * rs} fill="#E9E4DA" stroke={INK} strokeWidth={1.8} strokeOpacity={0.4} />
            ))}
            {[[-0.9, 0.2, 0.8], [0, -0.35, 1], [0.95, 0.15, 0.75]].map(([dx, dy, rs], j) => (
              <circle key={`f${j}`} cx={cx + dx * r} cy={cy + dy * r} r={r * rs - 1.2} fill="#E9E4DA" />
            ))}
          </g>
        );
      })}
      {Array.from({length: n}, (_, k) => {
        const u0 = 0.04 + (k / n) * 0.72;
        const age = (w - u0) / 0.32;
        if (age <= 0 || age >= 1) return null;
        const o = wipeAt(Math.min(u0, maxW));
        const big = false;
        const x = o.x + 14 + (hash(k * 3.3) - 0.35) * 70 * age + 5 * Math.sin(t * 2 + k);
        const y = o.y - 18 - (30 + 90 * hash(k * 1.7)) * age;
        const r = big ? 7 + 12 * age : 1.3 + 2.2 * hash(k * 5.5);
        const op = (big ? 0.2 : 0.9) * Math.sin(Math.PI * Math.min(1, age * 1.15));
        return big ? (
          <circle key={k} cx={x} cy={y} r={r} fill="#ECE8DF" stroke={INK} strokeWidth={1.5} strokeOpacity={0.35} opacity={op * 2.2} />
        ) : (
          <circle key={k} cx={x} cy={y} r={r} fill={k % 2 ? '#B8B0A0' : '#F3F0E8'} opacity={op} />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
export const Room: React.FC<{
  t: number;
  id: string;
  era: number;
  clockMinutes: number;
  clockBlur?: number;
  windowView?: React.ReactNode;
  dustWipe?: number;
  /** 0..1 progress of the dust puff (defaults to dustWipe); lets the puff finish after the wipe stops */
  dustPuff?: number;
  /** how far along the wipe path the glove actually went (puff clouds rise only from there) */
  dustMax?: number;
  photoView?: React.ReactNode;
  photoTint?: number;
  photoGlass?: number;
  refl?: React.ReactNode;
  reflOp?: number;
  /** 0..1: fades the window glass's tint, edge shadow and sheen (when the camera pushes through the glass) */
  glassFade?: number;
}> = ({t, id, era, clockMinutes, clockBlur = 0, windowView, dustWipe = 0, dustPuff, dustMax = 1, photoView, photoTint = 0.35, photoGlass = 1, refl, reflOp = 0, glassFade = 0}) => {
  const e = clamp(era);
  const ctx: Ctx = {e, t, id, L: (c: string) => lightCol(c, e)};
  return (
    <g>
      <Wall ctx={ctx} />
      <Floor ctx={ctx} />
      <SunPatch e={e} />
      <Doorway ctx={ctx} />
      <WallClock minutes={clockMinutes} blur={clockBlur} era={e} id={`${id}-clock`} />
      <Window ctx={ctx} view={windowView} glassFade={glassFade} />
      <Radiator ctx={ctx} />
      <Shelf ctx={ctx} />
      <Pendant ctx={ctx} />
      <Sideboard ctx={ctx} />
      <Photos ctx={ctx} dustWipe={dustWipe} refl={refl} reflOp={reflOp} />
      <Armchair cx={CHAIR_A.cx} color={CHAIR_A.color} ctx={ctx} which="A" />
      <SideTable ctx={ctx} />
      <Armchair cx={CHAIR_B.cx} color={CHAIR_B.color} ctx={ctx} which="B" />
      <FloorLamp ctx={ctx} />
      <Beam e={e} t={t} />
      <PrintContent ctx={ctx} view={photoView} tint={clamp(photoTint)} glass={clamp(photoGlass)} />
      <Puff w={dustPuff ?? dustWipe} t={t} e={e} maxW={dustMax} />
    </g>
  );
};
