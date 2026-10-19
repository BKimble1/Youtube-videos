// Side-view geometry of the illustrated U9, drawn to match the real car in BYD's demonstration clip so the match cut
// from footage to illustration keeps wheels, silhouette and orientation. The shapes were placed by hand against frame
// 8.00 s of the supplied recording (whole car in shot; see footage/frames/ and tools/fit_check.mjs) and are written in
// that frame's pixel coordinates, then converted to millimetres here: wheelbase 2,900 mm = 1,155 px.
//
// World: millimetres, +x forward (right), y up, origin on the ground below the middle of the wheelbase. The car is
// drawn facing +x. This is an illustration derived from a manufacturer's frame, not a factory drawing.

export const DIM = {length: 4966, width: 2029, height: 1295, wheelbase: 2900, trackF: 1719, trackR: 1676};
export const AXLE_F = 1450;
export const AXLE_R = -1450;
export const WHEEL_R = 365; // tyre outer radius (mm)
export const ARCH_R = 425;
export const COM = {x: -40, y: 470}; // body centre of mass (simplified, near mid-wheelbase, low)

// frame 8.00 s of the recording: wheel centres and scale
export const REF = {rearX: 378, frontX: 1537, axleY: 729, s: 1155 / 2900, midX: (378 + 1537) / 2};
/** Reference-frame pixel -> world mm (relative to the car origin on the ground). */
export const fx = (px: number) => (px - REF.midX) / REF.s;
export const fy = (py: number) => WHEEL_R + (REF.axleY - py) / REF.s;
const P = (pts: number[][]) => pts.map(([x, y]) => [fx(x), fy(y)] as [number, number]);
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Open smooth curve through points (Catmull-Rom as cubic Béziers); `m` = false starts with M, else continues with L. */
const curve = (pts: [number, number][], cont = false, k = 0.5) => {
  let d = cont ? `L ${r1(pts[0][0])} ${r1(pts[0][1])}` : `M ${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * k) / 3, p1[1] + ((p2[1] - p0[1]) * k) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * k) / 3, p2[1] - ((p3[1] - p1[1]) * k) / 3];
    d += ` C ${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
};
const straight = (pts: [number, number][], close = true) => `M ${pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(' L ')}${close ? ' Z' : ''}`;

const archDx = (cx: number, cy: number, r: number, yb: number) => Math.sqrt(Math.max(0, r * r - (yb - cy) * (yb - cy)));
const RW = {x: fx(REF.rearX), y: WHEEL_R}, FW = {x: fx(REF.frontX), y: WHEEL_R};

// the upper silhouette as traced (frame pixels): ducktail -> roof -> windscreen base, then bonnet -> nose tip
const TOP_PX = [[142, 503], [200, 499], [250, 496], [282, 492], [315, 483], [355, 471], [405, 460], [460, 449], [520, 438], [580, 426], [640, 413], [700, 403], [760, 396], [820, 392], [880, 390], [940, 391], [1000, 394], [1060, 402], [1120, 414], [1180, 430], [1240, 449], [1300, 469], [1350, 491], [1400, 516]];
const HOOD_PX = [[1400, 516], [1450, 512], [1500, 509], [1550, 507], [1590, 512], [1630, 524], [1670, 543], [1710, 568], [1750, 600], [1800, 642], [1846, 692], [1872, 722], [1879, 746]];
/** Height (mm) of the upper silhouette at car x (mm), from the same trace the side drawing uses. */
export const topY = (x: number) => {
  const pts = [...TOP_PX, ...HOOD_PX.slice(1)].map(([px, py]) => [fx(px), fy(py)]);
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (x - pts[i][0])) / (pts[i + 1][0] - pts[i][0]);
  return pts[pts.length - 1][1];
};

/** Body silhouette (everything but the wheels and the wing), wheel arches cut out. */
export const bodyPath = () => {
  // top line from the ducktail over the roof and hood to the nose tip, then back along the underside
  const top = P(TOP_PX);
  const hood = P(HOOD_PX);
  const nose = P([[1879, 746], [1893, 774], [1880, 790]]);
  const front = fx(1880);
  void front;
  const ybF = fy(806), ybR = fy(790);
  const dxF = archDx(FW.x, FW.y, ARCH_R, ybF), dxR = archDx(RW.x, RW.y, ARCH_R, ybR);
  const tail = P([[128, 775], [96, 759], [88, 722], [91, 690], [100, 664], [103, 640], [110, 615], [125, 598], [118, 570], [114, 548], [120, 527], [142, 503]]);
  let d = curve(top);
  d += ' ' + curve(hood, true, 0.45);
  d += ' ' + curve(nose, true, 0.5);
  d += ` L ${r1(FW.x + dxF + 150)} ${r1(ybF + 2)} L ${r1(FW.x + dxF)} ${r1(ybF)}`;
  d += ` A ${ARCH_R} ${ARCH_R} 0 1 1 ${r1(FW.x - dxF)} ${r1(ybF)}`;
  d += ` L ${r1(fx(1100))} ${r1(fy(818))} L ${r1(fx(700))} ${r1(fy(813))} L ${r1(fx(590))} ${r1(fy(807))} L ${r1(RW.x + dxR)} ${r1(ybR)}`;
  d += ` A ${ARCH_R} ${ARCH_R} 0 1 1 ${r1(RW.x - dxR)} ${r1(ybR)}`;
  d += ' ' + curve(tail, true, 0.4);
  return d + ' Z';
};

/** The body silhouette with the wheel arches filled in (clip for the dark arch liners). */
export const bodyFilledPath = () => bodyPath().replace(/ A \d+ \d+ 0 1 1 (-?[\d.]+) (-?[\d.]+)/g, ' L $1 $2');

/** Side glass (daylight opening) and the dark rear quarter window. */
export const glassPath = () => curve(P([[790, 412], [870, 405], [970, 406], [1080, 414], [1160, 433], [1212, 459], [1262, 482]])) + ' ' + curve(P([[1262, 482], [1210, 516], [1150, 526], [1090, 527], [1020, 516], [900, 498], [800, 483], [750, 476]]), true, 0.4) + ' L ' + `${r1(fx(745))} ${r1(fy(440))} L ${r1(fx(770))} ${r1(fy(414))} Z`;
export const quarterPath = () => straight(P([[620, 452], [748, 410], [790, 413], [748, 477], [705, 481], [640, 468]]));
/** Carbon roof band over the glass. */
export const roofPath = () => curve(P([[640, 412], [700, 403], [760, 396], [820, 392], [880, 390], [940, 391], [1000, 394], [1060, 402], [1120, 414], [1180, 430], [1240, 449], [1300, 469], [1350, 491], [1400, 516]])) + ' ' + curve(P([[1380, 510], [1340, 494], [1290, 478], [1250, 466], [1215, 459], [1160, 433], [1080, 414], [970, 406], [870, 405], [790, 412], [748, 410]]), true, 0.4) + ' Z';
/** The dark diagonal door blade. */
export const bladePath = () => straight(P([[797, 595], [868, 596], [905, 650], [960, 735], [985, 770], [945, 770], [900, 752], [860, 700], [830, 655]]));
/** Carbon sill / rocker between the wheels. */
export const sillPath = () => curve(P([[545, 760], [600, 775], [700, 790], [900, 798], [1100, 802], [1300, 804], [1385, 798]])) + ' ' + curve(P([[1385, 806], [1300, 812], [1100, 818], [900, 817], [700, 813], [590, 807], [548, 796]]), true, 0.3) + ' Z';
/** Front splitter and rear diffuser lip. */
export const splitterPath = () => curve(P([[1700, 752], [1760, 766], [1830, 776], [1893, 774]])) + ' ' + curve(P([[1880, 790], [1800, 790], [1740, 782], [1700, 770]]), true, 0.3) + ' Z';
export const diffuserPath = () => curve(P([[96, 700], [104, 735], [130, 770], [190, 780]])) + ' ' + curve(P([[215, 772], [160, 745], [118, 705], [100, 678]]), true, 0.4) + ' Z';
export const intakePath = () => straight(P([[470, 560], [545, 600], [560, 690], [500, 700], [450, 640]]));
export const headlightPath = () => curve(P([[1706, 566], [1770, 616], [1832, 676], [1862, 718]])) + ' ' + curve(P([[1850, 724], [1815, 690], [1760, 636], [1700, 584]]), true, 0.4) + ' Z';
export const taillightPath = () => curve(P([[116, 548], [122, 526], [150, 512], [196, 505]])) + ' ' + curve(P([[200, 540], [160, 548], [130, 562], [116, 566]]), true, 0.4) + ' Z';
export const mirrorPath = () => curve(P([[1192, 482], [1210, 470], [1260, 468], [1286, 486], [1280, 515], [1240, 530], [1206, 526], [1190, 506]]), false, 0.5) + ' Z';
export const mirrorStalk = () => straight(P([[1226, 522], [1262, 520], [1270, 585], [1232, 580]]));
/** Rear wing (swan neck), drawn behind the body. */
export const wingPath = () => curve(P([[34, 350], [48, 340], [130, 344], [215, 353], [232, 362], [226, 406], [190, 418], [150, 414], [100, 390], [62, 368]]), false, 0.35) + ' Z';
export const wingStayPath = () => curve(P([[228, 364], [262, 372], [292, 398], [300, 440], [284, 484], [262, 484], [270, 440], [262, 404], [238, 392]]), false, 0.4) + ' Z';
export const wingFarStay = () => straight(P([[318, 418], [392, 428], [396, 462], [330, 470]]));
/** Panel lines (strokes only): beltline strip, door cut, fuel flap, shoulder crease. */
export const panelLines = () => [
  curve(P([[620, 580], [800, 596], [1000, 606], [1180, 614], [1312, 620]])),
  curve(P([[745, 495], [752, 525], [770, 560], [797, 596]])),
  curve(P([[480, 470], [520, 466], [572, 480], [568, 520], [520, 538], [480, 500], [480, 470]]), false, 0.5),
  curve(P([[190, 574], [300, 592], [420, 598], [520, 604]])),
];
/** Highlight and shade shapes (flat tones over the paint). */
export const shadePath = () => curve(P([[120, 735], [240, 722], [420, 760], [560, 790], [800, 806], [1100, 810], [1385, 800], [1700, 774], [1880, 790]])) + ' L ' + `${r1(fx(1880))} ${r1(fy(900))} L ${r1(fx(100))} ${r1(fy(900))} Z`;
export const glintPath = () => curve(P([[300, 488], [420, 462], [560, 438], [640, 420], [620, 436], [540, 456], [420, 484], [320, 500]]), false, 0.4) + ' Z';
export const shoulderGlint = () => curve(P([[1420, 524], [1500, 516], [1580, 515], [1640, 536], [1590, 530], [1520, 528], [1440, 536]]), false, 0.4) + ' Z';

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
  rim: '#C9D2D8',
  rimDeep: '#232B31',
  disc: '#8E9AA1',
  caliper: '#D3283A',
  light: '#FFF6DA',
};
