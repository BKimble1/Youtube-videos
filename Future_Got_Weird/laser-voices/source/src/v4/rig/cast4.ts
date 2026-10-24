// Ported from FGW Invisibility Shield V4 (claude/inspiring-clarke-meyznm: invisibility-shield/source/src/v4).
// V4 cast. The protagonist is the established Weird Crew design "person" from the channel's Video 01 cast
// (can-you-hurt-something-that-isnt-alive/production/reference/repository_reference/src/components/cast.ts):
//   person: {skin '#F7D9C4', hair 'bob', hairColor '#B8743A', shirt C.blueLight, pants '#5B4636', shoes '#2B2B33'}
// Her colours, hair style and construction are kept exactly; V4 adds only views the front-only Video 01 rig never
// needed (three-quarter, profile, back, run, crouch) drawn in the same construction language.
// The guard is not an existing cast member (the cast has no guard). He is built strictly from the Crew parts
// library: crew head (crop hair), mitt hands, stroke limbs, flat trapezoid torso. His uniform is the one new
// costume, coloured from the Crew palette (blueDeep shirt, saffron badge).
export const INK = '#162A32';
export const CREW_C = {
  paper: '#FAF3DF', ink: INK, inkSoft: '#3F5560', saffron: '#FFC744', saffronDeep: '#E9A91C', teal: '#1CA7A0', coral: '#EF6B55',
  coralDeep: '#C94A36', blue: '#4F7CC9', blueDeep: '#3A5FA0', blueLight: '#D3E1F8', white: '#FFFFFF', cream: '#FFFBF0',
};

export type Look4 = {
  skin: string;
  skinShade: string;
  hair: 'bob' | 'crop' | 'spiky' | 'bun';
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
  badge?: string;
  collar?: string;
  cheek: string;
  // V4 (Laser Voices) additions, from the channel cast definitions (can-you-hurt reference cast.ts / Character.tsx)
  stripes?: string; // shirt stripe colour (the guesser's loud tee)
  overlay?: {kind: 'cardigan' | 'labcoat'; color: string; shade: string};
  glasses?: 'square' | 'round';
  earring?: string;
  nametag?: boolean;
  pencil?: boolean;
  cheekBase?: number; // permanent blush (the guesser's cheeks)
  goggles?: boolean; // lab safety goggles (pushed up on the forehead)
};

export const PERSON: Look4 = {
  skin: '#F7D9C4', skinShade: '#E6BBA0', hair: 'bob', hairColor: '#B8743A', hairShine: '#D4955A',
  shirt: CREW_C.blueLight, shirtShade: '#AFC4E6', sleeve: CREW_C.blueLight, pants: '#5B4636', pantsShade: '#46352A', shoes: '#2B2B33', cheek: CREW_C.coral,
};
export const GUARD: Look4 = {
  skin: '#C98B5E', skinShade: '#AE734A', hair: 'crop', hairColor: '#2B2B33', hairShine: '#45454F',
  shirt: CREW_C.blueDeep, shirtShade: '#2F4E86', sleeve: CREW_C.blueDeep, pants: '#2E3F5C', pantsShade: '#22304A', shoes: '#1E1A1A', cheek: CREW_C.coral,
  hat: {color: '#2E3F5C', badge: CREW_C.saffron}, belt: '#1E1A1A', badge: CREW_C.saffron, collar: '#2F4E86',
};

// Skeleton dimensions in rig units (Video 01: shoulders at 292, upper arm 84, forearm 78, head centre 372, head radius 58,
// legs 160, arm stroke 30, leg width 38).
export type Body4 = {
  hipY: number; hipW: number; thigh: number; shin: number; spine: number; shW: number; upper: number; fore: number;
  headUp: number; R: number; torsoW: number; torsoWh: number; torsoD: number; legW: number; armW: number; size: number;
};
export const BODY_P: Body4 = {hipY: 178, hipW: 30, thigh: 80, shin: 79, spine: 114, shW: 62, upper: 84, fore: 78, headUp: 80, R: 58, torsoW: 74, torsoWh: 62, torsoD: 44, legW: 38, armW: 30, size: 1};
export const BODY_G: Body4 = {hipY: 186, hipW: 33, thigh: 84, shin: 82, spine: 120, shW: 70, upper: 89, fore: 82, headUp: 82, R: 59, torsoW: 86, torsoWh: 76, torsoD: 54, legW: 42, armW: 33, size: 1};

// ---------------------------------------------------------------- Laser Voices V4 cast (the channel's cast, cast.ts)
// guesser: red spiky hair, peach skin, white tee with saffron stripes, navy trousers, white shoes, cheeks
export const GUESSER: Look4 = {
  skin: '#F2C9A8', skinShade: '#DDA586', hair: 'spiky', hairColor: '#C0392B', hairShine: '#DB5440',
  shirt: '#FFFFFF', shirtShade: '#E9E2D2', sleeve: '#FFFFFF', pants: '#2E3F5C', pantsShade: '#24344F', shoes: '#F4F1EA', cheek: CREW_C.coral,
  stripes: CREW_C.saffron, cheekBase: 0.55,
};
// clerkB: dark skin, black bun, white shirt under a blue cardigan, square glasses, gold earring, nametag, navy trousers
export const CLERK: Look4 = {
  skin: '#8D5A3C', skinShade: '#744830', hair: 'bun', hairColor: '#1E1A1A', hairShine: '#3A3434',
  shirt: '#FFFFFF', shirtShade: '#E6E2DA', sleeve: CREW_C.blue, pants: '#2E3F5C', pantsShade: '#24344F', shoes: '#3B2A22', cheek: '#C9503E',
  overlay: {kind: 'cardigan', color: CREW_C.blue, shade: '#3D63A6'}, glasses: 'square', earring: CREW_C.saffron, nametag: true,
};
// checker: the fact-checker (grey bob, round glasses, coral cardigan, pencil); in the lab she wears a lab coat
export const CHECKER: Look4 = {
  skin: '#F7D9C4', skinShade: '#E2BBA2', hair: 'bob', hairColor: '#8A8A93', hairShine: '#A8A8B0',
  shirt: '#F4EFE3', shirtShade: '#E2DCCD', sleeve: '#F2F4F5', pants: '#2E3F5C', pantsShade: '#24344F', shoes: '#3B2A22', cheek: CREW_C.coral,
  overlay: {kind: 'labcoat', color: '#F2F4F5', shade: '#D5DCE0'}, glasses: 'round', pencil: true, goggles: true,
};
// background visitors: the rest of the channel cast, in their own colours (never the three leads)
export const EXTRAS: Look4[] = [
  {skin: '#F2C9A8', skinShade: '#DDA586', hair: 'crop', hairColor: '#2B2B33', hairShine: '#45454F', shirt: CREW_C.cream, shirtShade: '#E8E0CC', sleeve: CREW_C.teal, pants: '#3F5560', pantsShade: '#32454E', shoes: '#2B2B33', cheek: CREW_C.coral, overlay: {kind: 'cardigan', color: CREW_C.teal, shade: '#178A84'}},
  {skin: '#C98B5E', skinShade: '#AE734A', hair: 'crop', hairColor: '#4A2C1A', hairShine: '#6A4630', shirt: CREW_C.saffron, shirtShade: '#E9A91C', sleeve: CREW_C.saffron, pants: '#4A5A3C', pantsShade: '#3B4930', shoes: '#2B2B33', cheek: CREW_C.coral},
  {skin: '#C98B5E', skinShade: '#AE734A', hair: 'crop', hairColor: '#2B2B33', hairShine: '#45454F', shirt: '#4F9A6B', shirtShade: '#3E7E56', sleeve: '#4F9A6B', pants: '#3F5560', pantsShade: '#32454E', shoes: '#2B2B33', cheek: CREW_C.coral},
  {skin: '#8D5A3C', skinShade: '#744830', hair: 'crop', hairColor: '#1E1A1A', hairShine: '#3A3434', shirt: '#FFFFFF', shirtShade: '#E6E2DA', sleeve: '#2B2B33', pants: '#2B2B33', pantsShade: '#1E1E24', shoes: '#1E1A1A', cheek: CREW_C.coral, overlay: {kind: 'cardigan', color: '#2B2B33', shade: '#1E1E24'}},
  {skin: '#F7D9C4', skinShade: '#E6BBA0', hair: 'bob', hairColor: '#B8743A', hairShine: '#D4955A', shirt: CREW_C.blueLight, shirtShade: '#AFC4E6', sleeve: CREW_C.blueLight, pants: '#5B4636', pantsShade: '#46352A', shoes: '#2B2B33', cheek: CREW_C.coral},
];
