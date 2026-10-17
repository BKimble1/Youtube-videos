// The established Future Got Weird cast. Colours, hair, outfits and accessories are copied from the approved rig
// (they-trained-robots-to-destroy-themselves/source/src/components/cast.ts, cast sheet cast_rig_check.png). Internal
// keys only: nothing on screen names a character. Civilians are generic and deliberately simpler.
import {C} from '../theme';

export type Hair = 'crop' | 'bun' | 'curly' | 'swoop' | 'bob' | 'bald' | 'spiky' | 'short';
export type Accessory = 'glasses' | 'roundGlasses' | 'visor' | 'bowtie' | 'nametag' | 'headset' | 'pencil' | 'beard' | 'earring' | 'satchel';
export type Look = {
  skin: string; hair: Hair; hairColor: string; shirt: string;
  overlay?: 'vest' | 'cardigan' | 'jacket' | 'coat'; overlayColor?: string;
  pants: string; shoes: string; accessories: Accessory[]; stripes?: string; cheeks?: boolean;
  height?: number; // 1 = cast height (440)
  build?: number;  // shoulder width factor
};

export const CAST: Record<string, Look> = {
  clerkA: {skin: '#F2C9A8', hair: 'crop', hairColor: '#2B2B33', shirt: C.cream, overlay: 'vest', overlayColor: C.teal, pants: '#3F5560', shoes: '#2B2B33', accessories: ['nametag', 'visor']},
  clerkB: {skin: '#8D5A3C', hair: 'bun', hairColor: '#1E1A1A', shirt: '#FFFFFF', overlay: 'cardigan', overlayColor: C.blue, pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['glasses', 'nametag', 'earring']},
  clerkC: {skin: '#C98B5E', hair: 'curly', hairColor: '#4A2C1A', shirt: C.saffron, pants: '#4A5A3C', shoes: '#2B2B33', accessories: ['headset', 'nametag']},
  checker: {skin: '#F7D9C4', hair: 'bob', hairColor: '#8A8A93', shirt: '#F4EFE3', overlay: 'cardigan', overlayColor: C.coral, pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['roundGlasses', 'pencil', 'satchel']},
  honest: {skin: '#C98B5E', hair: 'swoop', hairColor: '#2B2B33', shirt: '#4F9A6B', pants: '#3F5560', shoes: '#2B2B33', accessories: []},
  guesser: {skin: '#F2C9A8', hair: 'spiky', hairColor: '#C0392B', shirt: '#FFFFFF', stripes: C.saffron, pants: '#2E3F5C', shoes: '#FFFFFF', accessories: [], cheeks: true},
  host: {skin: '#8D5A3C', hair: 'crop', hairColor: '#1E1A1A', shirt: '#FFFFFF', overlay: 'jacket', overlayColor: '#2B2B33', pants: '#2B2B33', shoes: '#1E1A1A', accessories: ['bowtie', 'beard']},
  person: {skin: '#F7D9C4', hair: 'bob', hairColor: '#B8743A', shirt: C.blueLight, pants: '#5B4636', shoes: '#2B2B33', accessories: []},
};

// Film roles (functional, not names): the Director leads; the teammate is trapped at the start; the friend holds the
// crossing and dies; the builder makes the decoy; the carrier lifts the gate and carries the teammate.
export const ROLE = {
  director: 'clerkC',   // previously the film-set director (clapperboard) in the robots episode; headset
  teammate: 'checker',  // calm fact-checker; round glasses; carries the satchel strap with the radio
  friend: 'clerkA',     // teal visor = the memorial item
  builder: 'clerkB',    // the battered tablet and pico projector
  carrier: 'honest',
} as const;

// Generic civilians (not cast): muted clothes, simple hair, slightly varied heights.
export const CIVILIANS: Look[] = [
  {skin: '#E8B996', hair: 'short', hairColor: '#5A3A24', shirt: '#8E7A9E', overlay: 'coat', overlayColor: '#5E6B78', pants: '#3D3A40', shoes: '#2A2626', accessories: [], height: 1.02},
  {skin: '#A86F4C', hair: 'bob', hairColor: '#231C1C', shirt: '#C7A27A', overlay: 'coat', overlayColor: '#7A5B48', pants: '#3E4652', shoes: '#2A2626', accessories: [], height: 0.97},
  {skin: '#F0C8A8', hair: 'bald', hairColor: '#B9B2AA', shirt: '#9AB0A4', overlay: 'jacket', overlayColor: '#4E5A52', pants: '#4A4440', shoes: '#2A2626', accessories: [], height: 1.0},
  {skin: '#6E4630', hair: 'short', hairColor: '#151212', shirt: '#D9C7A3', pants: '#55504A', shoes: '#2A2626', accessories: [], height: 0.84},
];
