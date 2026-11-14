// The episode palette. One set of colours for every view: the robot is the SAME clinical pale grey with teal kirigami
// sleeves in the tunnel, the macro, the cutaway, the tool close-up and the lab; the gut is warm coral to deep red with
// burgundy and violet shadows.
export const INK = '#14202B';
/** on-screen width (px) of ink contours */
export const INK_PX = 2.6;

export const C = {
  // intestinal wall: lit surface ramp, dark to light
  wall: ['#2A0A1C', '#5E1430', '#9A2B44', '#C9525C', '#E27D74', '#F4AE98'],
  fog: '#1A0815',
  cavity: '#2B1024', // outside the gut wall (the body cavity behind the cut); also the pig diagram's abdomen
  cavityDeep: '#170814',
  // the cut face of the wall (inside -> out)
  mucosa: '#E88E86',
  villus: '#F2A296',
  submucosa: '#F3C4B4',
  muscleC: '#B83A4A',
  muscleL: '#94283C',
  serosa: '#D7838A',
  mucus: '#FFE9E2',
  // the robot
  body: ['#3E5560', '#6F8790', '#A9BCC2', '#D5E1E3', '#F1F6F6'], // extender silicone (pale clinical grey)
  cap: ['#46545C', '#7D8D95', '#B9C6CB', '#E2EAEC', '#FAFCFC'], // end caps and connectors
  sleeve: ['#0E3F45', '#1C6B70', '#2E9A98', '#4CC3B9', '#9BEADF'], // kirigami sleeves (teal)
  flapUnder: '#0B3238',
  hole: '#08272C',
  glow: '#6FF2F0', // pressurised chambers
  tether: ['#3F4B52', '#76868D', '#AFBDC2', '#D8E2E4', '#F0F5F5'],
  lens: '#0B1620',
  dye: '#4A5BE8', // the delivered liquid (a blue marker dye)
  dyeLight: '#8C9BFF',
  sample: '#D9666C',
  steel: ['#4A5560', '#8A97A3', '#C3CDD6', '#EEF2F5'],
};
