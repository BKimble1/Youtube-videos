// Cast for "Real Web Fluid". The rig, palette and skeleton are the Invisibility Shield V6 Weird Crew rig
// (invisibility-shield/source/src/v6/{Crew6,cast6,geo6,poses6,steps6}), copied unchanged except for the costume
// options marked "web fluid" in Crew.tsx.
//
// Protagonist: the established Crew design "person" from the channel's Video 01 cast
// (can-you-hurt-something-that-isnt-alive/production/reference/repository_reference/src/components/cast.ts):
//   person: {skin '#F7D9C4', hair 'bob', hairColor '#B8743A', shirt C.blueLight, pants '#5B4636', shoes '#2B2B33'}
// She is the lead of the three Invisibility Shield turnaround-rig cuts, so she has every view a chase needs.
// In the lab she wears a costume over the same design: an open lab coat (her blue shirt shows down the front),
// clear safety glasses and nitrile gloves. Face, hair, body and colours are unchanged.
//
// The runner is not an existing cast member (the Crew cast has no antagonist). Like the V4-V6 guard, he is built only
// from Crew parts (crew head with crop hair, mitt hands, stroke limbs, flat trapezoid torso) and coloured from the
// Crew palette; his costume (zip jacket, beanie, domino mask) is the one new design, and it reads as a storybook
// robber so the opening stays plainly imaginary.
export const INK = '#162A32';
export const CREW_C = {
  paper: '#FAF3DF', ink: INK, inkSoft: '#3F5560', saffron: '#FFC744', saffronDeep: '#E9A91C', teal: '#1CA7A0', coral: '#EF6B55',
  coralDeep: '#C94A36', blue: '#4F7CC9', blueDeep: '#3A5FA0', blueLight: '#D3E1F8', white: '#FFFFFF', cream: '#FFFBF0',
};

export type Look4 = {
  skin: string;
  skinShade: string;
  hair: 'bob' | 'crop';
  hairColor: string;
  hairShine: string;
  shirt: string;
  shirtShade: string;
  sleeve: string;
  pants: string;
  pantsShade: string;
  shoes: string;
  hat?: {color: string; badge: string};
  belt?: string;
  pouch?: string;
  badge?: string;
  collar?: string;
  cheek: string;
  // web fluid costume options
  glove?: string; // hand colour (nitrile gloves)
  longSleeve?: boolean; // the forearm is sleeve, not skin
  coat?: {inner: string; len: number; lapel?: string}; // open coat / jacket: the front strip shows `inner`; hem `len` u below the waist
  mask?: string; // domino eye mask
  beanie?: {color: string; band: string};
  glasses?: boolean; // clear safety glasses
};

export const PERSON: Look4 = {
  skin: '#F7D9C4', skinShade: '#E6BBA0', hair: 'bob', hairColor: '#B8743A', hairShine: '#D4955A',
  shirt: CREW_C.blueLight, shirtShade: '#AFC4E6', sleeve: CREW_C.blueLight, pants: '#5B4636', pantsShade: '#46352A', shoes: '#2B2B33', cheek: CREW_C.coral,
};
export const PERSON_LAB: Look4 = {
  ...PERSON,
  shirt: '#FFFFFF', shirtShade: '#DCE4EA', sleeve: '#FFFFFF', longSleeve: true, glove: '#A99BE6',
  coat: {inner: CREW_C.blueLight, len: 70, lapel: '#E3EAF0'}, glasses: true,
};
export const RUNNER: Look4 = {
  skin: '#F2C9A8', skinShade: '#DDAE8A', hair: 'crop', hairColor: '#2B2B33', hairShine: '#45454F',
  shirt: '#3F5560', shirtShade: '#30434C', sleeve: '#3F5560', longSleeve: true, pants: '#2E3F5C', pantsShade: '#22304A', shoes: '#1E1A1A', cheek: CREW_C.coral,
  coat: {inner: '#2B2B33', len: 18}, mask: '#1E1A1A', beanie: {color: CREW_C.coralDeep, band: '#A73C2C'},
};

// Skeleton dimensions in rig units (Video 01: shoulders at 292, upper arm 84, forearm 78, head centre 372, head radius 58,
// legs 160, arm stroke 30, leg width 38).
export type Body4 = {
  hipY: number; hipW: number; thigh: number; shin: number; spine: number; shW: number; upper: number; fore: number;
  headUp: number; R: number; torsoW: number; torsoWh: number; torsoD: number; legW: number; armW: number; size: number;
};
export const BODY_P: Body4 = {hipY: 178, hipW: 30, thigh: 80, shin: 79, spine: 114, shW: 62, upper: 84, fore: 78, headUp: 80, R: 58, torsoW: 74, torsoWh: 62, torsoD: 44, legW: 38, armW: 30, size: 1};
export const BODY_R: Body4 = {hipY: 184, hipW: 32, thigh: 83, shin: 81, spine: 118, shW: 66, upper: 87, fore: 80, headUp: 81, R: 58, torsoW: 80, torsoWh: 68, torsoD: 50, legW: 40, armW: 31, size: 1};
