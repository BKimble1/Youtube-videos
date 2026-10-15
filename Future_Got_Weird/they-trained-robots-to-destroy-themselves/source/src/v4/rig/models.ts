// V4 vector model records. Every view-dependent part is authored twice — front and side (facing right) — with the
// same point count and silhouette order, so any yaw in between (the three-quarter view at 0.5, or a turn) is a blend
// of the two drawings, not a mirrored or stretched copy. Limb parts are view-independent capsules.
//
// MODEL-F02 (retired robot), from the brief's description of the BMW-plant launch photograph:
//   narrow, elongated black visor inside contrasting enclosing head contours; compact neck; rounded mechanical
//   shoulder joints; shaped metal torso; broad exposed hip assembly; segmented arms and legs. Markings: the Figure
//   symbol on the visor and on the upper chest, with "F.02" below the chest symbol.
// MODEL-F03 (newer robot): lighter soft coverings, rounder head with a large dark face screen, fuller soft torso,
//   dark joint breaks (neck, shoulders, elbows, wrists, waist, knees, ankles); the symbol on the chest.
// SIM: the F.02 silhouette in a schematic blue treatment (opaque). PERF: a generic human stunt performer.
import {P} from './geom';

export type ModelKey = 'F02' | 'F03' | 'SIM' | 'PERF' | 'SIL';
export type Pal = {
  base: string; shade: string; hi: string; ink: string;
  joint: string; jointHi: string; face: string; faceRim: string; faceGlint: string; mark: string;
  band?: string; dots?: string;
};

export const PAL: Record<ModelKey, Pal> = {
  F02: {base: '#434A53', shade: '#2B3036', hi: '#67727E', ink: '#0B0F12', joint: '#17191C', jointHi: '#5C6670', face: '#050607', faceRim: '#9AA3AD', faceGlint: '#3B4A5C', mark: '#F3F5F6'},
  F03: {base: '#E8E3D9', shade: '#CDC5B7', hi: '#F8F6F1', ink: '#1D2A30', joint: '#2A2E33', jointHi: '#55595F', face: '#0A0C0E', faceRim: '#2A2E33', faceGlint: '#33404E', mark: '#1E2226', band: '#2A2E33'},
  SIM: {base: '#D5E4FA', shade: '#AAC5EE', hi: '#EEF4FD', ink: '#2C4A80', joint: '#7FA3DA', jointHi: '#B9CFF2', face: '#3A5FA0', faceRim: '#7FA3DA', faceGlint: '#6C8FCB', mark: '#2C4A80', dots: '#1CA7A0'},
  SIL: {base: '#1A0E10', shade: '#1A0E10', hi: '#2A181A', ink: '#0E0607', joint: '#1A0E10', jointHi: '#2A181A', face: '#0E0607', faceRim: '#1A0E10', faceGlint: '#1A0E10', mark: '#1A0E10'},
  PERF: {base: '#7656C2', shade: '#5B3FA0', hi: '#9C82DA', ink: '#1D1630', joint: '#3A2C66', jointHi: '#9C82DA', face: '#E2B48F', faceRim: '#3A2C66', faceGlint: '#F2C9A8', mark: '#FFFFFF', dots: '#FFFFFF'},
};

/** Skeleton (units: the robot stands ~615 u from sole to head top). */
export const SK = {
  waist: -34,        // waist pivot above pelvis centre
  hipY: 12,          // hip pivots below pelvis centre
  shY: -146,         // shoulder pivots above the waist pivot
  neckY: -160,       // neck base above the waist pivot
  neckL: 24,
  UA: 104, FA: 94, HAND: 62,
  TH: 142, SH: 140, ANKLE: 30,   // ankle → sole
  // pivot x offsets: [front, side] — near is the robot's right side (viewer-left in front, the visible side in profile)
  shN: [-76, 0] as [number, number], shF: [76, 10] as [number, number],
  hipN: [-40, -2] as [number, number], hipF: [40, 8] as [number, number],
};

export type ViewPts = {front: P[]; side: P[]};

// ---------------------------------------------------------------- F.02
export const F02 = {
  head: {
    front: [[0, -96], [22, -93], [36, -80], [40, -56], [38, -32], [30, -12], [14, -2], [0, 0], [-14, -2], [-30, -12], [-38, -32], [-40, -56], [-36, -80], [-22, -93]],
    side: [[-2, -96], [18, -92], [32, -80], [39, -58], [39, -34], [33, -14], [19, -2], [4, 0], [-12, -4], [-26, -16], [-36, -36], [-40, -60], [-34, -82], [-20, -93]],
  } as ViewPts,
  visor: {
    front: [[0, -84], [12, -81], [17, -70], [17, -36], [12, -22], [0, -18], [-12, -22], [-17, -36], [-17, -70], [-12, -81]],
    side: [[29, -84], [34, -78], [39, -62], [39, -36], [35, -24], [30, -20], [27, -27], [29, -40], [29, -62], [27, -77]],
  } as ViewPts,
  visorRim: {
    front: [[0, -90], [17, -86], [23, -72], [23, -34], [17, -16], [0, -12], [-17, -16], [-23, -34], [-23, -72], [-17, -86]],
    side: [[25, -90], [35, -82], [41, -63], [41, -34], [36, -20], [27, -14], [22, -24], [23, -40], [23, -64], [21, -80]],
  } as ViewPts,
  // head-side seam that encloses the face (the "contrasting contour" wraps round to the cheek)
  headSeam: {front: [[-38, -46], [-34, -70]] as P[], side: [[-6, -10], [-20, -36], [-22, -64], [-8, -86]] as P[]},
  torso: {
    front: [[0, -160], [30, -159], [58, -153], [72, -140], [72, -118], [64, -92], [52, -66], [42, -40], [36, -12], [0, -4], [-36, -12], [-42, -40], [-52, -66], [-64, -92], [-72, -118], [-72, -140], [-58, -153], [-30, -159]],
    side: [[2, -162], [20, -158], [34, -148], [42, -132], [44, -112], [40, -90], [30, -68], [24, -42], [20, -14], [2, -4], [-18, -12], [-22, -38], [-28, -64], [-34, -92], [-36, -118], [-34, -140], [-24, -154], [-10, -160]],
  } as ViewPts,
  chestPlate: {
    front: [[0, -151], [34, -149], [56, -137], [59, -113], [47, -90], [25, -78], [0, -74], [-25, -78], [-47, -90], [-59, -113], [-56, -137], [-34, -149]],
    side: [[4, -153], [20, -151], [35, -141], [41, -121], [40, -99], [31, -82], [17, -77], [8, -86], [3, -104], [1, -124], [1, -141], [2, -150]],
  } as ViewPts,
  abdomen: {
    front: [[0, -76], [28, -73], [34, -56], [32, -30], [28, -8], [0, -3], [-28, -8], [-32, -30], [-34, -56], [-28, -73]],
    side: [[3, -78], [22, -74], [26, -55], [22, -30], [18, -8], [2, -3], [-16, -10], [-20, -30], [-24, -55], [-18, -73]],
  } as ViewPts,
  pelvis: {
    front: [[0, -40], [30, -38], [50, -26], [57, -4], [51, 18], [31, 29], [0, 25], [-31, 29], [-51, 18], [-57, -4], [-50, -26], [-30, -38]],
    side: [[2, -42], [18, -40], [28, -28], [32, -6], [27, 16], [13, 27], [0, 23], [-14, 27], [-28, 17], [-34, -6], [-30, -28], [-16, -40]],
  } as ViewPts,
  foot: {
    front: [[-14, -8], [14, -8], [20, 4], [24, 14], [22, 26], [14, 31], [-14, 31], [-22, 18]],
    side: [[-16, -8], [16, -8], [42, 4], [68, 14], [72, 26], [60, 31], [-20, 31], [-26, 16]],
  } as ViewPts,
  // limb proportions (w0 top, w1 bottom)
  ua: [31, 26], fa: [27, 22], th: [46, 36], sh: [36, 27],
  shoulderR: 23, elbowR: 14, kneeR: 17, hipR: 19,
};

// ---------------------------------------------------------------- F.03
export const F03 = {
  head: {
    front: [[0, -100], [26, -96], [41, -80], [44, -54], [41, -27], [29, -9], [12, 0], [0, 1], [-12, 0], [-29, -9], [-41, -27], [-44, -54], [-41, -80], [-26, -96]],
    side: [[-2, -100], [22, -96], [37, -82], [43, -58], [41, -31], [31, -11], [15, 0], [0, 1], [-14, -2], [-30, -12], [-41, -32], [-45, -58], [-39, -83], [-22, -96]],
  } as ViewPts,
  visor: {
    front: [[0, -86], [22, -82], [32, -66], [32, -42], [24, -26], [0, -20], [-24, -26], [-32, -42], [-32, -66], [-22, -82]],
    side: [[27, -86], [36, -78], [42, -60], [42, -40], [36, -26], [27, -21], [24, -31], [26, -46], [26, -64], [24, -80]],
  } as ViewPts,
  torso: {
    front: [[0, -160], [32, -159], [54, -152], [64, -138], [66, -118], [64, -92], [58, -66], [52, -40], [48, -14], [0, -6], [-48, -14], [-52, -40], [-58, -66], [-64, -92], [-66, -118], [-64, -138], [-54, -152], [-32, -159]],
    side: [[2, -162], [22, -158], [36, -148], [44, -130], [47, -108], [45, -84], [39, -60], [34, -36], [30, -12], [2, -6], [-26, -12], [-30, -36], [-34, -62], [-38, -90], [-40, -118], [-38, -140], [-26, -155], [-10, -161]],
  } as ViewPts,
  // soft-goods seams (open lines): yoke across the chest, side seam
  yoke: {front: [[-58, -134], [-30, -126], [0, -124], [30, -126], [58, -134]] as P[], side: [[-30, -138], [-10, -134], [10, -130], [30, -128], [44, -126]] as P[]},
  sideSeam: {front: [[56, -110], [52, -70], [46, -20]] as P[], side: [[-6, -150], [-8, -96], [-6, -20]] as P[]},
  pelvis: {
    front: [[0, -38], [33, -36], [52, -24], [57, -2], [51, 20], [31, 30], [0, 25], [-31, 30], [-51, 20], [-57, -2], [-52, -24], [-33, -36]],
    side: [[2, -40], [20, -38], [31, -26], [34, -4], [29, 18], [14, 28], [0, 24], [-15, 28], [-30, 18], [-36, -4], [-32, -26], [-18, -38]],
  } as ViewPts,
  foot: F02.foot,
  ua: [30, 27], fa: [27, 23], th: [44, 37], sh: [35, 29],
  shoulderR: 0, elbowR: 0, kneeR: 0, hipR: 0,
};

/** Model → part tables (SIM and PERF reuse the F.02 skeleton and silhouette). */
export const ART = {F02, F03, SIM: F02, PERF: F02, SIL: F02} as const;
