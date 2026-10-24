// The rebuild's cast: three new characters in the Weird Crew finish. Colours are chosen so the three read apart at
// any size: the listener in blue (cool), the operator in a warm rust jacket, the passerby in olive with a sandy quiff.
import {Look} from './art/Face';

export const LISTENER: Look = {
  skin: '#E2AE88', hair: '#2B2421', brow: '#2B2421', iris: '#6B4A2E', lip: '#B9705E', cheek: '#E07B62', style: 'curly',
};
export const OPERATOR: Look = {
  skin: '#9C6446', hair: '#1D1716', brow: '#1D1716', iris: '#3E2A1E', lip: '#8E3F3A', cheek: '#C7614F', style: 'bun', fem: true, jaw: 0.9, earrings: true,
};
export const PASSERBY: Look = {
  skin: '#F1CBB0', hair: '#C9A063', brow: '#9C7643', iris: '#5C7D96', lip: '#C47E70', cheek: '#EE8A72', style: 'beanie', stubble: true, hat: '#E3B341',
};

// outfits (the body rig reads these)
export type Outfit = {jacket: string; jacketHi?: string; shirt: string; pants: string; shoe: string; sole: string; open: boolean; collar: 'hood' | 'lapel' | 'band'};
export const LISTENER_FIT: Outfit = {jacket: '#2F6BD6', shirt: '#EEF2F5', pants: '#2C3346', shoe: '#F4F6F8', sole: '#B7C2CC', open: true, collar: 'lapel'};
export const OPERATOR_FIT: Outfit = {jacket: '#D9672E', shirt: '#2A2F38', pants: '#20242C', shoe: '#2B2D33', sole: '#8D939C', open: true, collar: 'band'};
export const PASSERBY_FIT: Outfit = {jacket: '#5C7A3A', shirt: '#E9D9B8', pants: '#5B4A3C', shoe: '#7A4B2E', sole: '#D8CBB8', open: false, collar: 'hood'};
