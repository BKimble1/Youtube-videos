// A front-view walk with planted feet: each foot stays fixed on the ground while the body passes over it, then swings
// forward with a small lift. dist = distance travelled (character-local units, +x = direction of travel).
/** the hurried walk up the garden path to his own front door: longer strides (fewer, bigger steps) */
export const DOOR_STEP = 175;
export const STEP = 100; // one step (half a stride), local units: about 0.6 of the leg
export const walkFeet = (dist: number, moving: number, step: number = STEP) => {
  const STEP_ = step;
  const p = dist / (2 * STEP_);
  const foot = (ph: number, hx: number) => {
    const u = ((ph % 1) + 1) % 1;
    if (u < 0.5) {
      // planted: slides back relative to the body (fixed in the world)
      return {x: hx + STEP_ * (0.5 - 2 * u) * moving, y: 0};
    }
    const s = (u - 0.5) * 2; // swing 0..1
    return {x: hx + STEP_ * (-0.5 + s) * moving, y: -16 * Math.sin(Math.PI * s) * moving};
  };
  const l = foot(p, -30), r = foot(p + 0.5, 30);
  return {lx: l.x, ly: l.y - 6, rx: r.x, ry: r.y - 6};
};
/** body bob for the walk (local units, negative = up) */
export const walkBob = (dist: number, moving: number, step: number = STEP) => -Math.abs(Math.sin((Math.PI * dist) / step)) * 9 * moving;
/** times (s) when a foot lands, for the footstep sounds: every STEP of travel */
export const footfalls = (xAt: (t: number) => number, t0: number, t1: number, scale: number, step: number = STEP) => {
  const out: number[] = [];
  let last = Math.floor((xAt(t0) / scale) / step);
  for (let t = t0; t <= t1; t += 1 / 120) {
    const k = Math.floor((xAt(t) / scale) / step);
    if (k !== last) out.push(Math.round(t * 1000) / 1000);
    last = k;
  }
  return out;
};
