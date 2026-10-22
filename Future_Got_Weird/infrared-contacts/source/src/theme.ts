// FGW palette (channel brief) plus this episode's scene and light-language colours.
export const C = {
  ink: '#162A32',
  inkSoft: '#2A3F48',
  cream: '#FAF3DF',
  creamDeep: '#EFE3C2',
  teal: '#1CA7A0',
  tealDeep: '#127A75',
  tealLight: '#8FD9D2',
  coral: '#EF6B55',
  coralDeep: '#C9503E',
  saffron: '#FFC744',
  muted: '#E8C46A', // muted yellow
  blue: '#4F7CC9',
  white: '#FFFFFF',
};

// The lead: the red-haired Weird Crew contestant (cast.ts "guesser": skin F2C9A8, spiky C0392B hair, coral cheeks,
// white shirt with saffron stripes), redrawn at close-up scale.
export const LEADC = {
  skin: '#F2C9A8', skinShade: '#DDA586', skinDeep: '#C88B6C', skinLight: '#FBDDC4', lip: '#C9705E',
  hair: '#C0392B', hairShade: '#962A20', hairLight: '#DB5440', brow: '#9E3024',
  iris: '#5A7F6E', irisDeep: '#34503F', irisLight: '#8DB09A', sclera: '#FBF8F1', scleraShade: '#E6DCD0',
  lash: '#3A1E18', shirt: '#FFFFFF', stripe: '#FFC744', shirtShade: '#E9E2D2', trousers: '#2E3F5C', shoe: '#F4F1EA',
};
// The sender: Weird Crew clerk (blue cardigan, high bun, square glasses, earring)
export const SENDC = {skin: '#8D5A3C', skinShade: '#744830', hair: '#1E1A1A', shirt: '#FFFFFF', cardigan: '#4F7CC9', cardiganShade: '#3D63A6', trousers: '#2E3F5C', shoe: '#3B2A22', glasses: '#162A32', earring: '#FFC744'};
// The bystander: Weird Crew fact-checker (grey bob, round glasses, coral cardigan)
export const BYC = {skin: '#F7D9C4', skinShade: '#E2BBA2', hair: '#8A8A93', hairShade: '#6E6E78', shirt: '#F4EFE3', cardigan: '#EF6B55', cardiganShade: '#C9503E', trousers: '#2E3F5C', book: '#1CA7A0', page: '#FAF3DF'};

// light language (schematic overlays only)
export const LIGHT = {
  ir: '#F2A93B', // near-infrared packets: subdued amber, dashed
  irGlow: '#C9771C',
  vis: '#FFF1B8', // ordinary visible light: warm white
  green: '#62F08E', // converted visible light
  greenDeep: '#22B35A',
  greenGlow: '#A8FFC4',
};

// section diagram
export const SECC = {
  air: '#123540', airDeep: '#0B2730', rim: '#FAF3DF',
  tissue: '#E9A898', tissueDeep: '#D38979', fat: '#F3D7A6', fatDeep: '#E3BF83',
  sclera: '#FBF7EF', scleraShade: '#E9DFD2', cornea: '#DDF1F2', vitreous: '#EAF4F2', vitreousDeep: '#D4E8E6',
  retina: '#E8735E', retinaDeep: '#C4523F', choroid: '#9E3B33', nerve: '#F2D9A6',
  lensEye: '#CFE6EA', lensEyeRim: '#9CC4CC', iris: '#5A7F6E', irisDeep: '#34503F',
  lidSkin: '#F2C9A8', lidInner: '#E58E88', lidMuscle: '#D8786B', lash: '#3A1E18',
  contact: '#BFEFF3', contactRim: '#5FC3CF', particle: '#B7A6E8', particleDeep: '#6E5BB8', particleLight: '#E7E0FF',
};

// train compartment at night
export const TRAIN = {
  wall: '#2C4A57', wallDeep: '#203A45', wallLight: '#3A5D6B', panel: '#35566A', trim: '#E8C46A', trimDeep: '#B9963F',
  seat: '#1F7F7A', seatDeep: '#16605C', seatLight: '#2A9C95', floor: '#1A2E36', floorLight: '#24404A',
  window: '#0E1D33', windowSky: '#1B3358', hill: '#0A1426', lamp: '#FFD27A', lampGlow: '#FFC75A',
  table: '#B98756', tableDeep: '#8E6440', bunk: '#2A4E5C', bunkDeep: '#1D3A45', curtain: '#7A3F4F', curtainDeep: '#5C2E3C',
};
