// Laser Voices cast: three members of the channel's ORIGINAL Weird Crew cast (Video 01,
// can-you-hurt-something-that-isnt-alive/source/src/components/cast.ts), drawn on the Weird Crew turnaround rig
// (moth-silk-web-shooter/source/src/rig, itself the Invisibility Shield V6 rig) with their own colours and accessories.
//   listener = person  (the canonical PERSON, lead of Invisibility Shield and Real Web Fluid; values exactly as rig/cast.ts)
//   operator = clerkB  {skin '#8D5A3C', hair 'bun' '#1E1A1A', shirt '#FFFFFF', cardigan C.blue, pants '#2E3F5C', shoes '#3B2A22',
//                       glasses, nametag, earring}
//   passerby = clerkA  {skin '#F2C9A8', hair 'crop' '#2B2B33', shirt C.cream, vest C.teal, pants '#3F5560', shoes '#2B2B33',
//                       nametag, visor}
// Shades (skinShade, shirtShade, pantsShade, hairShine) are the rig's one cel tone, derived as for PERSON.
import {BODY_P, Body4, CREW_C, Look4, PERSON} from './rig/cast';

export const LISTENER: Look4 = PERSON;
export const OPERATOR: Look4 = {
  skin: '#8D5A3C', skinShade: '#76482E', hair: 'bun', hairColor: '#1E1A1A', hairShine: '#3A3434',
  shirt: CREW_C.blue, shirtShade: '#3F68AE', sleeve: CREW_C.blue, longSleeve: true, pants: '#2E3F5C', pantsShade: '#22304A', shoes: '#3B2A22', cheek: CREW_C.coral,
  coat: {inner: '#FFFFFF', len: 22}, glasses: true, nametag: '#FFFFFF', earring: CREW_C.saffron,
};
export const PASSERBY: Look4 = {
  skin: '#F2C9A8', skinShade: '#DDAE8A', hair: 'crop', hairColor: '#2B2B33', hairShine: '#45454F',
  shirt: CREW_C.teal, shirtShade: '#128078', sleeve: CREW_C.cream, pants: '#3F5560', pantsShade: '#30434C', shoes: '#2B2B33', cheek: CREW_C.coral,
  coat: {inner: CREW_C.cream, len: 0}, nametag: '#FFFFFF', visor: {color: CREW_C.teal, band: '#128078'},
};
export const B_L: Body4 = BODY_P;
export const B_O: Body4 = BODY_P;
export const B_P: Body4 = {...BODY_P, hipY: 182, thigh: 82, shin: 80, spine: 116, shW: 64, torsoW: 76, torsoWh: 64};
