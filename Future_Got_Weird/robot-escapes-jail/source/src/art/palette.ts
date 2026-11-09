// Robot Escapes Jail: every colour in the film. Weird Crew finish: navy ink contours, cel/gradient shading from ONE
// key light (upper-left), restrained detail. Deep navy world, cool steel architecture, bright silver robot, cyan eyes,
// red alarm accents, warm yellow for occasional scientific emphasis.
export const INK = '#172B3A';
export const INK_PX = 2.8;          // silhouette ink width on screen (px), constant: use vectorEffect non-scaling-stroke
export const INK_FEAT = 1.6;        // interior feature lines
export const NS = 'non-scaling-stroke' as const;

export const C = {
  // world
  navy0: '#0B1526',       // deepest background
  navy1: '#13223A',
  navy2: '#1C3150',
  navy3: '#27426A',
  wall: '#2A3D58',        // cell wall (cool, dark)
  wallLit: '#3A5476',
  wallMortar: '#1E2E45',
  floor: '#33465F',
  floorLit: '#4A6283',
  floorTile: '#2B3C53',
  steel: '#5E6E82',       // bars (thick dark steel)
  steelLit: '#9AAABD',
  steelDark: '#2B3646',
  rail: '#46566B',
  // robot (silver, liquid metal)
  silver: '#C9D3DE',
  silverLit: '#F4F8FC',
  silverMid: '#A9B6C5',
  silverDark: '#6F7F93',
  silverDeep: '#4A5869',
  chrome: '#E6EEF6',
  // eyes
  cyan: '#46E6FF',
  cyanCore: '#E8FDFF',
  cyanDeep: '#0FA3C8',
  // alarm and heat
  red: '#FF3B3B',
  redDeep: '#B3121F',
  redGlow: '#FF5A4E',
  heat: '#FF8A3D',
  heatDeep: '#D9480F',
  // science emphasis
  yellow: '#FFD84A',
  yellowDeep: '#E0A800',
  // magnetic field
  field: '#5CC8FF',
  fieldDeep: '#2477C9',
  north: '#E5484D',
  south: '#3E7BFA',
  // lab
  labBg0: '#E9F1F7',
  labBg1: '#CFDDE8',
  bench: '#B9C7D3',
  benchDark: '#8C9DAD',
  glass: '#D8F1FB',
  mold: '#E07A3F',        // silicone mold (warm orange)
  moldDeep: '#A94F22',
  ice: '#BDEBFF',
  // stomach model (stylised, not gory: soft coral/pink, translucent model)
  stomach: '#F2A5A0',
  stomachLit: '#FAD1CC',
  stomachDeep: '#C9706E',
  stomachIn: '#E78C88',
  object: '#3E7BFA',      // the swallowed foreign object (a small blue button battery-like disc / bead)
  // guard (Weird Crew)
  guardShirt: '#3A5F9A',
  guardShirtDeep: '#27457A',
  guardPants: '#25344D',
  guardCap: '#22314A',
  guardBadge: '#FFD84A',
  coffee: '#6B3F22',
  coffeeLit: '#9A6238',
  cup: '#F4F1EA',
  cupBand: '#C0392B',
  white: '#FFFFFF',
};
