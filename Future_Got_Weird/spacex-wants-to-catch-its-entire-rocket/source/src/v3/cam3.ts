// A tiny orthographic 3D camera so the tower, its arms, the launch mount and the vehicles share one scene coordinate
// system (metres; X right along the arms, Y up, Z toward the viewer at yaw 0). Every view of the catch set is a
// projection of the same geometry, never a re-drawn flat sprite.
export type V3 = [number, number, number];
export type Cam3 = {
  /** world point at frame centre */
  at: V3;
  /** px per metre */
  z: number;
  /** yaw about +Y (deg); 0 looks along -Z */
  yaw: number;
  /** pitch (deg); positive looks up at the subject from below */
  pitch: number;
  /** roll in screen (deg) */
  roll?: number;
};

const D = Math.PI / 180;

/** Project a world point to screen pixels (1920×1080 frame). Returns [x, y, depth] with larger depth = nearer. */
export const proj = (c: Cam3, p: V3): V3 => {
  const [X, Y, Z] = [p[0] - c.at[0], p[1] - c.at[1], p[2] - c.at[2]];
  const cy = Math.cos(c.yaw * D), sy = Math.sin(c.yaw * D);
  const x1 = X * cy + Z * sy;
  const z1 = -X * sy + Z * cy;
  const cp = Math.cos(c.pitch * D), sp = Math.sin(c.pitch * D);
  const y2 = Y * cp + z1 * sp;
  const z2 = -Y * sp + z1 * cp;
  let sx = x1 * c.z, syy = -y2 * c.z;
  if (c.roll) {
    const cr = Math.cos(c.roll * D), sr = Math.sin(c.roll * D);
    [sx, syy] = [sx * cr - syy * sr, sx * sr + syy * cr];
  }
  return [960 + sx, 540 + syy, z2];
};

/** Screen scale of a vertical metre at a point (orthographic: constant, but foreshortened by pitch). */
export const vScale = (c: Cam3) => c.z * Math.cos(c.pitch * D);

/** The azimuth (deg) a vertical vehicle presents to the camera, given its own roll angle about its axis. */
export const viewAz = (c: Cam3, roll: number) => roll - c.yaw;

export const pts = (c: Cam3, ps: V3[]) => ps.map((p) => proj(c, p));
export const poly = (ps: V3[] | number[][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
