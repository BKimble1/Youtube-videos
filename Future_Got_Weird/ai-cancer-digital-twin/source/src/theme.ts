// Future Got Weird — visual system (pass 2). Light, warm, colourful cutout illustration.
// Meaning is carried by colour AND a text label, never colour alone:
//   teal  = evidence / verified detail        coral = incorrect detail / correction
//   saffron = attention, hooks, the game show   blue = mechanisms, secondary environments
export const C = {
  paper: '#FAF3DF',
  paperDeep: '#F1E6C9',
  paperLine: '#E2D5B2',
  ink: '#162A32',
  inkSoft: '#3F5560',
  inkMuted: '#6F8590',
  saffron: '#FFC744',
  saffronDeep: '#E9A91C',
  saffronLight: '#FFE9A8',
  teal: '#1CA7A0',
  tealDeep: '#128078',
  tealLight: '#BFE8E3',
  coral: '#EF6B55',
  coralDeep: '#C94A36',
  coralLight: '#FBD2C8',
  blue: '#4F7CC9',
  blueDeep: '#3A5FA0',
  blueLight: '#D3E1F8',
  white: '#FFFFFF',
  cream: '#FFFBF0',
  wood: '#C9924F',
  woodDeep: '#9E6B30',
  woodLight: '#E3B77A',
  shadow: 'rgba(22,42,50,0.16)',
};

export const F = {
  display: '"Fredoka Variable", "Fredoka", "Nunito Variable", system-ui, sans-serif',
  body: '"Nunito Variable", "Nunito", system-ui, sans-serif',
  serif: '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const OUTLINE = 4; // ink outline width for cutout shapes at 1080p

// Digital Twin / Molecular Attack episode: biological identities. Each actor keeps one colour for the whole film.
export const M = {
  // living tissue (warm, real) vs the digital model (cool wireframe)
  void: '#1B0F1C',          // deep interstitial background
  voidLift: '#2C1A2E',
  fluid: '#3A2238',         // out-of-focus protein crowd
  fluidHi: '#5A3550',
  acid: '#4A2A1E',          // warm shift when the surroundings turn acidic
  membrane: '#F2B59B',      // lipid heads
  membraneDeep: '#D9826A',
  membraneCore: '#F8D9C2',  // tails band
  cyto: '#F7C8B4',          // cytoplasm (cutaways)
  cytoDeep: '#E9A48F',
  nucleus: '#B25A7A',
  nucleusDeep: '#86405C',
  healthy: '#F4B9A0',       // healthy cells
  healthyDeep: '#D88E75',
  tumor: '#C8577A',         // tumour cells
  tumorDeep: '#953B5B',
  resist: '#7E7BD6',        // the resistant survivor (subtly different)
  resistDeep: '#5650A8',
  // the DNA switch (gold strands) and its parts
  dna: '#FFD36B',
  dnaDeep: '#D79B2A',
  dnaLight: '#FFF0C4',
  lock: '#FFFBF0',
  peptide: '#EF6B55',       // hidden ligand pattern
  peptideDeep: '#C94A36',
  receptor: '#1CA7A0',      // death receptors
  receptorDeep: '#128078',
  signal: '#9FF0E6',        // clustered-receptor signal glow
  // antibody-drug conjugate
  antibody: '#4F7CC9',
  antibodyDeep: '#3A5FA0',
  antibodyLight: '#D3E1F8',
  linker: '#FFFFFF',
  payload: '#FFB13D',
  payloadDeep: '#E08A12',
  target: '#59C27A',        // the ADC's surface target (not a death receptor)
  targetDeep: '#3A9A57',
  enzyme: '#9B7BE0',
  enzymeDeep: '#6F52B8',
  lyso: '#5E3A6E',          // lysosome interior
  // digital model
  screen: '#0D1B2A',
  screenLift: '#16293D',
  wire: '#7FE3FF',
  wireDim: '#2E6F8E',
  wireHot: '#FFD36B',
  wireWarn: '#FF8A6B',
  mri0: '#0A0A0C',
  mri1: '#CFCFD4',
  // immune cell
  tcell: '#8FD3B0',
  tcellDeep: '#4E9E78',
  car: '#FFD36B',
};
