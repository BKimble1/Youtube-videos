// Path sampling for the absolute M/L/C/Z paths used in this film, so tools, growth and cuts can follow the same
// curves that are drawn (a scalpel tip on the ear outline, a gouge in the scapha, a vessel growing along its path).
export type P = {x: number; y: number};
export type Sampled = {pts: P[]; cum: number[]; len: number};

export const sample = (d: string, per = 24): Sampled => {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const pts: P[] = [];
  let i = 0, cmd = '', cur: P = {x: 0, y: 0}, start: P = {x: 0, y: 0};
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[MLCZ]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M') {
      cur = {x: num(), y: num()};
      start = cur;
      pts.push(cur);
      cmd = 'L';
    } else if (cmd === 'L') {
      cur = {x: num(), y: num()};
      pts.push(cur);
    } else if (cmd === 'C') {
      const a = cur, b = {x: num(), y: num()}, c = {x: num(), y: num()}, e = {x: num(), y: num()};
      for (let k = 1; k <= per; k++) {
        const u = k / per, v = 1 - u;
        pts.push({
          x: v * v * v * a.x + 3 * v * v * u * b.x + 3 * v * u * u * c.x + u * u * u * e.x,
          y: v * v * v * a.y + 3 * v * v * u * b.y + 3 * v * u * u * c.y + u * u * u * e.y,
        });
      }
      cur = e;
    } else if (cmd === 'Z') {
      pts.push(start);
      cur = start;
      cmd = '';
    } else i++;
  }
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
  return {pts, cum, len: cum[cum.length - 1]};
};

/** point and unit tangent at fraction u of the length */
export const at = (s: Sampled, u: number): {p: P; tx: number; ty: number} => {
  const L = Math.min(1, Math.max(0, u)) * s.len;
  let k = 1;
  while (k < s.cum.length - 1 && s.cum[k] < L) k++;
  const a = s.pts[k - 1], b = s.pts[k], seg = s.cum[k] - s.cum[k - 1] || 1;
  const f = (L - s.cum[k - 1]) / seg;
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
  return {p: {x: a.x + dx * f, y: a.y + dy * f}, tx: dx / n, ty: dy / n};
};

/** the sampled points up to fraction u, as a polyline path string */
export const partial = (s: Sampled, u: number) => {
  const L = Math.min(1, Math.max(0, u)) * s.len;
  const out: P[] = [];
  for (let k = 0; k < s.pts.length && s.cum[k] <= L; k++) out.push(s.pts[k]);
  out.push(at(s, u).p);
  return 'M ' + out.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
};
export const poly = (pts: P[], close = true) => 'M ' + pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ') + (close ? ' Z' : '');
