// The assembly composition (B6), as data, so E7 can echo it inside the glass.
//
// Everything is in SCREEN space of the 1920×1080 design frame at the END of B6 (after its slow creep):
//   x, y   the figure's ground point (between the feet) on screen
//   s      on-screen figure scale (a figure is 440·s px tall)
//   yaw    rig yaw (90 = profile facing screen right, 180 = straight away): three-quarter back views facing east
//   z      depth order (larger = nearer the camera / drawn later)
// To reproduce: draw each actor in a plain (untransformed) layer with exactly these values and ink 4·s.
// B6 itself draws them through its own camera; `assemblyCam` maps these screen values back to B6's world.
//
// Slots (CONTINUITY.md), screen left → right: builder · carrier · teammate (leaning on the carrier) · DIRECTOR
// (slightly forward) · friend. In E7 slot 5 stays empty. Civilians stand behind, smaller.
export type Slot = {slot: number; role: 'builder' | 'carrier' | 'teammate' | 'director' | 'friend'; x: number; y: number; s: number; yaw: number; z: number};

export const ASSEMBLY = {
  /** where the group looks: the refuge entrance on screen (eyeline target, upper right) */
  lookAt: {x: 1630, y: 560},
  /** horizon / far waterline on screen */
  horizonY: 612,
  /** the floor line the group stands on (terrace top edge in B6) */
  floorY: 795,
  slots: [
    {slot: 1, role: 'builder', x: 330, y: 792, s: 0.86, yaw: 148, z: 1},
    {slot: 2, role: 'carrier', x: 575, y: 800, s: 0.9, yaw: 146, z: 2},
    {slot: 3, role: 'teammate', x: 705, y: 806, s: 0.88, yaw: 138, z: 3},
    {slot: 4, role: 'director', x: 930, y: 832, s: 0.95, yaw: 132, z: 5},
    {slot: 5, role: 'friend', x: 1160, y: 810, s: 0.9, yaw: 136, z: 4},
  ] as Slot[],
  /** civilians behind the line (CIV[0], CIV[1], CIV[2]): standing in B6, further back and hazed; E7 may seat them at the same x */
  civilians: [
    {x: 445, y: 742, s: 0.58, yaw: 158},
    {x: 640, y: 736, s: 0.6, yaw: 150},
    {x: 820, y: 744, s: 0.55, yaw: 142},
  ],
  /** the empty place (slot 5) — nothing and no one may stand here in E7 */
  empty: {x: 1160, y: 810, w: 210},
};

/** B6 camera (world → screen): screen = (world - cam) · z + (960, 540). */
export const ASSEMBLY_CAM = {x: 5379, y: -1007, z: 0.83};
/** World ground point (B6) for a screen ground point. */
export const assemblyWorld = (sx: number, sy: number) => ({x: ASSEMBLY_CAM.x + (sx - 960) / ASSEMBLY_CAM.z, y: ASSEMBLY_CAM.y + (sy - 540) / ASSEMBLY_CAM.z});
