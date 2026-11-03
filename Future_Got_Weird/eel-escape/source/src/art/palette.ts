// The episode palette. One set of colours for every view: the eel is the SAME cool slate blue in the exterior, the
// translucent reveal, the X-ray and the cutaway; the predator's fins are warm amber, so the eel never reads as a fin.
export const INK = '#172B3A';
/** on-screen width (px) of ink contours: always non-scaling strokes */
export const INK_PX = 2.8;
export const NS = 'non-scaling-stroke' as const;

export const C = {
  // the predator (dark sleeper): olive-brown, mottled, pale belly, warm amber fins
  fishBody: '#7C6A44',
  fishDark: '#4E4029',
  fishSaddle: '#5A4A2E',
  fishBelly: '#D6C496',
  fishCheek: '#8A7650',
  fishLip: '#6B583A',
  fin: '#B58A45',
  finDark: '#6A4A22',
  finRay: '#8C6A34',
  eyeIris: '#D9A23A',
  eyeRing: '#8A5E1C',
  pupil: '#121212',
  gillDark: '#4A1418',
  gillRed: '#B8323A',
  gillFilament: '#D9545A',
  // the eel (juvenile Japanese eel): cool slate blue back, steel flanks, pale silvery belly, grey-blue ribbon fin
  eelBack: '#3B5267',
  eelFlank: '#6A87A0',
  eelBelly: '#D7DCD2',
  eelFin: '#8FA7BA',
  eelEye: '#0E1419',
  // inside the fish (the translucent reveal and the cutaway)
  flesh: '#E3B49E',
  fleshDeep: '#C98975',
  cutFace: '#EBC1AA',
  pharynx: '#B8656A',
  esophagus: '#C47A72',
  stomach: '#D49A8A',
  stomachWall: '#B9786A',
  chamber: '#5A1A1F',
  // the water and the riverbed
  waterTop: '#86BBAE',
  waterMid: '#558F89',
  waterDeep: '#2E5F64',
  haze: '#6A9E95',
  mote: '#EAF6EC',
  sand: '#9C8B69',
  pebbleA: '#7F7461',
  pebbleB: '#A69679',
  pebbleC: '#6A5F4D',
  bedShadow: '#3E4434',
  // the X-ray (an illustrated radiograph of the same outline)
  xrayBg0: '#06101B',
  xrayBg1: '#0E2133',
  xrayFlesh: '#8FAFC6',
  xraySoft: '#6F8DA6',
  xrayBone: '#EEF6FB',
  xrayEdge: '#CDE4F2',
  xrayGas: '#03070D',
};
