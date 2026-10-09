/** Small shared helpers for the v2 kit (internal). */

export const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
export const f2 = (n: number) => Math.round(n * 100) / 100;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const isDev = () => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return true;
  }
};

const warned = new Set<string>();
/** console.warn once per message (dev only). */
export const warnOnce = (msg: string) => {
  if (!isDev() || warned.has(msg)) return;
  warned.add(msg);
  console.warn(msg);
};

/** CSS font shorthand for the house faces (canvas measuring and SVG/HTML text agree on it). */
export const fontShorthand = (family: string, weight: number, size: number) => `${weight} ${size}px ${family}`;
