// The approved Future Got Weird cast (Video 01 cast.ts / robots episode cast.ts; sheet: can-you-hurt-something-that-
// isnt-alive/production/approved_cast/cast_rig_check.png). Colours, hair, outfits and accessories are unchanged.
// R2 adds nothing to the designs; tools and damage are drawn on top by the rig.
import {C} from '../../theme';

export type Hair = 'crop' | 'bun' | 'curly' | 'swoop' | 'bob' | 'bald' | 'spiky' | 'short';
export type Accessory = 'glasses' | 'roundGlasses' | 'visor' | 'bowtie' | 'nametag' | 'headset' | 'pencil' | 'beard' | 'earring';
export type Look = {
  skin: string; hair: Hair; hairColor: string; shirt: string;
  overlay?: 'vest' | 'cardigan' | 'jacket' | 'coat'; overlayColor?: string;
  pants: string; shoes: string; accessories: Accessory[]; stripes?: string; cheeks?: boolean;
  height?: number;
};

export const CAST: Record<string, Look> = {
  clerkA: {skin: '#F2C9A8', hair: 'crop', hairColor: '#2B2B33', shirt: C.cream, overlay: 'vest', overlayColor: C.teal, pants: '#3F5560', shoes: '#2B2B33', accessories: ['nametag', 'visor']},
  clerkB: {skin: '#8D5A3C', hair: 'bun', hairColor: '#1E1A1A', shirt: '#FFFFFF', overlay: 'cardigan', overlayColor: C.blue, pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['glasses', 'nametag', 'earring']},
  clerkC: {skin: '#C98B5E', hair: 'curly', hairColor: '#4A2C1A', shirt: C.saffron, pants: '#4A5A3C', shoes: '#2B2B33', accessories: ['headset', 'nametag']},
  checker: {skin: '#F7D9C4', hair: 'bob', hairColor: '#8A8A93', shirt: '#F4EFE3', overlay: 'cardigan', overlayColor: C.coral, pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['roundGlasses', 'pencil']},
  honest: {skin: '#C98B5E', hair: 'swoop', hairColor: '#2B2B33', shirt: '#4F9A6B', pants: '#3F5560', shoes: '#2B2B33', accessories: []},
  guesser: {skin: '#F2C9A8', hair: 'spiky', hairColor: '#C0392B', shirt: '#FFFFFF', stripes: C.saffron, pants: '#2E3F5C', shoes: '#FFFFFF', accessories: [], cheeks: true},
  host: {skin: '#8D5A3C', hair: 'crop', hairColor: '#1E1A1A', shirt: '#FFFFFF', overlay: 'jacket', overlayColor: '#2B2B33', pants: '#2B2B33', shoes: '#1E1A1A', accessories: ['bowtie', 'beard']},
};

/** R2 roles → approved cast keys. The Director is clerkC (the robots episode's "director", he). */
export const ROLE2 = {
  director: 'clerkC',
  tether: 'clerkA',
  decoy: 'clerkB',
  breaker: 'honest',
  drone: 'checker',
  runner: 'guesser',
  flares: 'host',
} as const;
export type Role2 = keyof typeof ROLE2;
export const ROLES2 = Object.keys(ROLE2) as Role2[];
