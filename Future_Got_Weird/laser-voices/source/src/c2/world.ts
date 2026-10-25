// Laser Voices (Rebuild V2) staging: ONE world in metres, shared by every shot. x to the right as seen from the main
// (front) camera, y up, z away from it. Headings: 0 faces +z (away from the front camera), 180 faces the front camera.
//
//   emitter E: lens at (EX, BEAM_Y, BZ), pointing +x            listener L: feet at (LX, 0, BZ), facing the front camera;
//   operator O: behind the emitter, hand on its rear control      her LEFT ear (local +X, world -x) faces the emitter
//   passerby P: beside her at first; later walks from the back of the room toward the front camera along x = PX,
//   crossing the beam line between E and L.
// The beam: a straight segment from the lens to her ear, 2.44 m (8 ft) long.
import {v3, V3} from './rig/geo';

export const BZ = 4.0;
export const LX = 1.22;
export const EAR_Y = 1.37;
export const BEAM_Y = EAR_Y;
/** her ear in the world when she stands square (her head turns move it a little; shots use earOf() for overlays) */
export const EAR0 = v3(LX - 0.215, EAR_Y, BZ);
/** the lens: 2.44 m from her ear */
export const LENS = v3(EAR0.x - 2.44, BEAM_Y, BZ);
export const EX = LENS.x;
/** the emitter's body centre (its lens is at the +x end) */
export const EM = v3(LENS.x - 0.22, BEAM_Y, BZ);
export const OPER = v3(EM.x - 0.62, 0, BZ + 0.48);
export const PX = (LENS.x + EAR0.x) / 2 + 0.04;
export const PASS0 = v3(LX + 1.05, 0, BZ + 0.35);

export const ROOM = {x0: -5.5, x1: 5.5, z0: -4, z1: 8.6, h: 3.3};

/** point on the beam, u from the lens (0) to the ear (1) */
export const beamAt = (u: number, ear: V3 = EAR0) => v3(LENS.x + (ear.x - LENS.x) * u, LENS.y + (ear.y - LENS.y) * u, LENS.z + (ear.z - LENS.z) * u);
export {v3};
