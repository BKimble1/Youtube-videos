// Car geometry in millimetres, from the published U9 dimensions (4,966 x 2,029 x 1,295 mm, 2,900 mm wheelbase,
// 1,719 / 1,676 mm track). Overhangs, glass, intakes and light shapes are drawn by eye: this is an illustration,
// not a factory drawing. Side view: +x forward, y up, origin on the ground below the middle of the wheelbase.

export const DIM = {
  length: 4966,
  width: 2029,
  height: 1295,
  wheelbase: 2900,
  trackF: 1719,
  trackR: 1676,
};
export const AXLE_F = 1450;
export const AXLE_R = -1450;
export const WHEEL_R = 360; // ~21 in rims with low-profile tyres
export const ARCH_R = 418;
export const COM = {x: -40, y: 470}; // body centre of mass (simplified, near mid-wheelbase, low)

// Colours. The demonstration car is red; trims are dark carbon.
export const PAINT = {
  red: '#D3283A',
  redDeep: '#A51A2C',
  redLight: '#EE5A68',
  carbon: '#27313A',
  carbonLight: '#3B4853',
  glass: '#2C4652',
  glassLight: '#5F8594',
  tyre: '#20272C',
  tyreSide: '#2C353B',
  rim: '#B9C3C9',
  rimDeep: '#7D8A92',
  disc: '#8E9AA1',
  caliper: '#E9A91C',
  light: '#FFF6DA',
};

const archDx = () => Math.sqrt(ARCH_R * ARCH_R - (380 - 165) * (380 - 165));
/** Wheel-arch cut-out, traversed rear to front over the top (y up; the chord at y = 165 lies below the centre). */
const arch = (cx: number) => `L ${cx - archDx()} 165 A ${ARCH_R} ${ARCH_R} 0 1 0 ${cx + archDx()} 165`;

/** Body silhouette (with both wheel arches cut out), as an SVG path in mm with y up -> caller flips y. */
export const bodyPath = () => {
  const P = (x: number, y: number) => `${x} ${y}`;
  return [
    `M ${P(2405, 175)}`, // splitter front lower edge
    `C ${P(2460, 210)} ${P(2470, 290)} ${P(2455, 345)}`, // nose
    `C ${P(2430, 420)} ${P(2360, 470)} ${P(2240, 520)}`, // nose top, light line
    `C ${P(1980, 600)} ${P(1700, 690)} ${P(1450, 740)}`, // hood / front fender crest
    `C ${P(1180, 790)} ${P(900, 830)} ${P(640, 880)}`, // cowl to windscreen base
    `C ${P(380, 990)} ${P(120, 1180)} ${P(-140, 1268)}`, // windscreen / A-pillar
    `C ${P(-300, 1300)} ${P(-560, 1300)} ${P(-760, 1262)}`, // roof
    `C ${P(-1150, 1185)} ${P(-1560, 1090)} ${P(-1980, 1028)}`, // fastback / rear deck
    `C ${P(-2210, 996)} ${P(-2400, 1000)} ${P(-2505, 1012)}`, // ducktail lip
    `L ${P(-2526, 965)}`,
    `C ${P(-2530, 840)} ${P(-2520, 700)} ${P(-2490, 600)}`, // tail face
    `C ${P(-2460, 470)} ${P(-2400, 330)} ${P(-2330, 255)}`, // rear bumper / diffuser
    `L ${P(-2150, 180)}`,
    arch(AXLE_R),
    `L ${P(-1000, 150)}`,
    `L ${P(1000, 150)}`,
    arch(AXLE_F),
    `L ${P(2210, 170)}`,
    'Z',
  ].join(' ');
};

/** Side glass (daylight opening). */
export const glassPath = () =>
  'M 585 908 C 360 1010 130 1170 -110 1232 C -290 1262 -520 1262 -700 1228 C -880 1170 -1010 1100 -1090 1035 C -760 985 -200 930 585 908 Z';
/** Large side intake ahead of the rear wheel. */
export const intakePath = () =>
  'M -700 860 C -900 850 -1060 820 -1150 760 C -1180 640 -1160 520 -1110 430 C -980 470 -830 520 -700 560 C -660 650 -660 770 -700 860 Z';
/** Carbon sill blade. */
export const sillPath = () => 'M 1030 150 L -1030 150 L -1030 205 C -500 250 500 250 1030 205 Z';
/** Front splitter and rear diffuser strips. */
export const splitterPath = () => 'M 2405 175 L 2210 170 L 2000 168 C 2150 200 2300 215 2440 230 C 2430 205 2420 188 2405 175 Z';
export const diffuserPath = () => 'M -2330 255 L -2150 180 L -2030 175 C -2120 230 -2240 300 -2400 360 C -2380 320 -2355 285 -2330 255 Z';
/** Thin LED head and tail lights. */
export const headlightPath = () => 'M 2330 470 C 2200 520 2060 570 1930 610 L 1915 590 C 2050 545 2190 497 2318 448 Z';
export const taillightPath = () => 'M -2508 990 L -2520 905 L -2470 912 L -2462 986 Z';
/** Door and panel lines (strokes only). */
export const panelLines = () => [
  'M 610 890 C 600 700 640 420 700 250', // door front shut line
  'M -730 1000 C -700 800 -650 520 -560 255', // door rear shut line
  'M 1450 742 C 1700 700 1950 620 2200 535', // fender crease
  'M -1150 760 C -1500 840 -1900 900 -2300 930', // rear shoulder
];
export const mirrorPath = () => 'M 470 960 C 430 1010 360 1030 300 1020 C 300 990 330 960 380 950 Z';
