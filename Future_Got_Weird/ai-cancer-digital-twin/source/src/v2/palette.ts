// V2 colour system (one identity per actor, kept across every scale):
//  healthy tissue = warm pink/coral; tumour = dark red → purple → ominous magenta; blood = deep crimson;
//  AI analysis = controlled cyan / electric blue; immune response = teal, blue, restrained gold;
//  successful treatment = a return to the healthy colours.
export const P = {
  night: '#07060C',          // cinematic background around the body
  nightLift: '#141224',
  skin: '#D9A08A',
  skinLight: '#F2C6B2',
  skinDeep: '#A8705E',
  rim: '#FFD9C8',
  // healthy tissue
  tissue: '#F2A7A0',
  tissueLight: '#FFD3CB',
  tissueDeep: '#C9706E',
  tissueBg: '#7A2E3C',       // interstitial depth behind tissue
  tissueBgDeep: '#4A1A28',
  nucleus: '#B04E6E',
  nucleusDeep: '#7C2E4C',
  // tumour
  tumor: '#8E2A5E',
  tumorLight: '#C24B8A',
  tumorDeep: '#561540',
  tumorGlow: '#FF3FA4',
  mutant: '#D43CFF',         // the abnormal nucleus pulse
  // lung / organs
  lung: '#E88E92',
  lungDeep: '#B5585F',
  liver: '#9B3A3A',
  liverLight: '#C45A52',
  heart: '#B8323A',
  gut: '#E0A58E',
  bone: '#EDE4D3',
  // blood
  blood: '#9E0F22',
  bloodDeep: '#5C0614',
  bloodLight: '#E0384A',
  rbc: '#D3263A',
  rbcLight: '#FF6B72',
  rbcDeep: '#8A0E1E',
  plasma: '#F4D58A',
  vesselWall: '#C85A5E',
  vesselWallLight: '#F09A94',
  // cell interior
  cyto: '#F7C3B7',
  cytoDeep: '#E59A8E',
  mito: '#F08E5A',
  er: '#E77B8A',
  golgi: '#C46BA0',
  envelope: '#8E3456',
  chromatin: '#5E1E3E',
  // DNA
  dnaA: '#FFB13D',   // backbone strand 1
  dnaB: '#5FC4FF',   // backbone strand 2
  baseAT: '#FF6B6B',
  baseGC: '#7CE08A',
  mutation: '#FF2E6E',
  // signals
  grow: '#8CFF6A',     // accelerator / growth signal
  brake: '#4FA3FF',    // stop signal / brake protein
  death: '#B58CFF',    // death switch
  // AI / digital
  ai: '#36E0FF',
  aiDeep: '#0B6E9E',
  aiDim: '#1B4A66',
  aiBg: '#04121C',
  aiBgLift: '#0A2234',
  aiHot: '#B6F5FF',
  aiGold: '#FFD36B',
  // immune
  tcell: '#2CC7B0',
  tcellLight: '#8FF0DE',
  tcellDeep: '#14786C',
  immuneBlue: '#3D7BFF',
  immuneGold: '#FFC83D',
  dendritic: '#5FB6E8',
  // treatment
  carrier: '#E8F1FF',
  carrierShell: '#9CC6FF',
  ligand: '#FFC83D',
  payload: '#FF8A3D',
  marker: '#FF5FB3',      // tumour surface marker (target)
  markerAlt: '#FFB03D',   // changed marker (resistance)
  shield: '#FF8A3D',      // immune checkpoint "shield" ligand
  neoantigen: '#FFE15F',  // the tumour fingerprint
  ink: '#120A12',
  white: '#FFFFFF',
};
