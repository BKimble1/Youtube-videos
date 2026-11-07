// The episode palette (Weird Crew vector finish: navy ink of constant screen width, cel/gradient fills lit from the
// UPPER LEFT, small white glosses, flat clean shapes, soft bokeh backgrounds). Modules may add local tints, but every
// hero colour comes from here so the bird reads as ONE object in every shot.
export const INK = '#172B3A';
/** silhouette contour width (screen px, vectorEffect non-scaling-stroke) */
export const INK_PX = 2.6;
/** interior feature lines (feather edges, part seams) */
export const LINE_PX = 1.4;
export const NS = 'non-scaling-stroke' as const;

export const C = {
  // ---- the hero bird drone's preserved exterior: a generic medium-sized brown bird (no species claimed)
  plumage: '#9A6B43', // back and wing coverts
  plumageLit: '#C1915E',
  plumageDeep: '#6B4529',
  plumageBar: '#5A3920', // dark feather bars / edging
  breast: '#D9B98E', // pale breast and belly
  breastLit: '#EED6B0',
  breastDeep: '#B18D63',
  flight: '#6E4A2E', // flight feathers (primaries/secondaries), dorsal
  flightEdge: '#E7D3AE', // pale feather tips
  underwing: '#E3CFAE', // ventral wing surface
  underwingDeep: '#B9A07C',
  head: '#8C5E38',
  cheek: '#C9A275',
  beak: '#4A4036',
  beakLit: '#857565',
  eyeGlass: '#1B1410', // the glass eye (taxidermy): fixed, glossy, never blinks
  eyeRing: '#E0C08A',
  tail: '#7A5032',
  // the shell's inside (the preserved skin's clean inner surface / form) when cut open
  shellInner: '#E9DCC6',
  shellInnerDeep: '#C9B79A',
  shellCut: '#F3E9D6', // the cut face rim
  // ---- the mechanism (SCHEMATIC reconstruction)
  brass: '#D9AE4A',
  brassLit: '#F4D88C',
  brassDeep: '#9C7623',
  steel: '#B8C3CC',
  steelLit: '#EEF3F6',
  steelDeep: '#6E7D88',
  dark: '#3B4652', // rods, pins, axles
  darkLit: '#6C7A87',
  motor: '#C7CED4', // motor can
  motorBand: '#2F6FA8', // a blue label band on the can (no text)
  motorCap: '#3A3F45',
  copper: '#C8743C',
  plate: '#2E4B5E', // the skeletal back plate (anodised)
  plateLit: '#4D7088',
  carbon: '#2A2F35', // spars
  wireRed: '#C8453A',
  wireBlack: '#22262B',
  accent: '#E8553D', // a single rotation marker on rotating parts
  // ---- labels (SCHEMATIC / RESEARCH GOAL)
  labelBg: 'rgba(14,24,33,0.62)',
  labelText: '#F4F1E8',
  // ---- environments (hints; world modules may extend)
  sky: '#BFE0EF',
  skyHigh: '#8FC6E2',
  skyWarm: '#F6E3C2',
  hill: '#8DB38A',
  hillFar: '#A9C9B4',
  grass: '#79A65A',
  grassDeep: '#557F3E',
  wood: '#8C6A4A',
  woodLit: '#B48E66',
  woodDeep: '#5E452F',
  lab: '#D8E1E6',
  labDeep: '#9FB0BB',
  bench: '#C8B79C',
  benchDeep: '#8F7D63',
  water: '#4E9DB3',
  waterLit: '#9FD4E0',
  waterDeep: '#1F5E73',
  reed: '#7E9A4E',
  // ---- the duck robot (a mallard drake: distinct from the flying bird)
  duckHead: '#1E6B4E',
  duckHeadLit: '#3FA27A',
  duckCollar: '#F4F2EA',
  duckBreast: '#7A3E2A',
  duckBody: '#B9B8B0',
  duckBodyLit: '#DAD9D2',
  duckBack: '#6F6A5E',
  duckBill: '#E2C443',
  duckFoot: '#E88A2E',
  duckTail: '#2A2A2A',
  printed: '#E7EEF0', // 3D-printed parts (light grey)
  printedDeep: '#AFC0C6',
};
