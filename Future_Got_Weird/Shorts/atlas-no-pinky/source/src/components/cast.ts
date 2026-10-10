import {C} from '../theme';
import type {Look} from './Character';

// The channel's small original cast. Names are internal only; nothing on screen ties a clerk to a company.
export const CAST: Record<string, Look> = {
  // Answer clerks: the three "confident answer" characters at the counter
  clerkA: {skin: '#F2C9A8', hair: 'crop', hairColor: '#2B2B33', shirt: C.cream, overlay: 'vest', overlayColor: C.teal, pants: '#3F5560', shoes: '#2B2B33', accessories: ['nametag', 'visor']},
  clerkB: {skin: '#8D5A3C', hair: 'bun', hairColor: '#1E1A1A', shirt: '#FFFFFF', overlay: 'cardigan', overlayColor: C.blue, pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['glasses', 'nametag', 'earring']},
  clerkC: {skin: '#C98B5E', hair: 'curly', hairColor: '#4A2C1A', shirt: C.saffron, pants: '#4A5A3C', shoes: '#2B2B33', accessories: ['headset', 'nametag']},
  // The fact-checker: calm, pencil behind the ear, round glasses, coral cardigan
  checker: {skin: '#F7D9C4', hair: 'bob', hairColor: '#8A8A93', shirt: '#F4EFE3', overlay: 'cardigan', overlayColor: C.coral, pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['roundGlasses', 'pencil']},
  // Quiz pair and host
  honest: {skin: '#C98B5E', hair: 'swoop', hairColor: '#2B2B33', shirt: '#4F9A6B', pants: '#3F5560', shoes: '#2B2B33', accessories: []},
  guesser: {skin: '#F2C9A8', hair: 'spiky', hairColor: '#C0392B', shirt: '#FFFFFF', stripes: C.saffron, pants: '#2E3F5C', shoes: '#FFFFFF', accessories: [], cheeks: true},
  host: {skin: '#8D5A3C', hair: 'crop', hairColor: '#1E1A1A', shirt: '#FFFFFF', overlay: 'jacket', overlayColor: '#2B2B33', pants: '#2B2B33', shoes: '#1E1A1A', accessories: ['bowtie', 'beard']},
  // A regular person (for the "works on people, too" callback)
  person: {skin: '#F7D9C4', hair: 'bob', hairColor: '#B8743A', shirt: C.blueLight, pants: '#5B4636', shoes: '#2B2B33', accessories: []},
};

