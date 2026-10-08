import React, {useEffect, useRef} from 'react';
import {Img as RImg, Internals} from 'remotion';

/**
 * Measurement-only wrapper (audit copy, never used in production): logs, per frame, the on-screen sampling of each
 * raster image. The linear part of every ancestor transform is multiplied up, so sx/sy are the true screen px per CSS
 * px of the <img> along its own axes (rotation-safe). Visible rect = img bounds ∩ overflow-hidden ancestors ∩ viewport.
 */
type P = React.ComponentProps<typeof RImg>;
export const Img: React.FC<P> = (props) => {
  const ref = useRef<HTMLImageElement>(null);
  const frame = Internals.useTimelinePosition();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let a = 1, b = 0, c = 0, d = 1;
    let op = 1;
    let hidden = false;
    const r0 = el.getBoundingClientRect();
    let vis = [r0.left, r0.top, r0.right, r0.bottom];
    let clipPath = '';
    let filt = '';
    let node: Element | null = el;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      if (cs.transform && cs.transform !== 'none') {
        const m = new DOMMatrix(cs.transform);
        const na = m.a * a + m.c * b, nb = m.b * a + m.d * b, nc = m.a * c + m.c * d, nd = m.b * c + m.d * d;
        a = na; b = nb; c = nc; d = nd;
      }
      op *= parseFloat(cs.opacity || '1');
      if (cs.display === 'none' || cs.visibility === 'hidden') hidden = true;
      if (node !== el && (cs.overflow === 'hidden' || cs.overflowX === 'hidden')) {
        const r = node.getBoundingClientRect();
        vis = [Math.max(vis[0], r.left), Math.max(vis[1], r.top), Math.min(vis[2], r.right), Math.min(vis[3], r.bottom)];
      }
      if (cs.clipPath && cs.clipPath !== 'none') clipPath += cs.clipPath + ' | ';
      if (cs.filter && cs.filter !== 'none') filt += cs.filter + ' | ';
      node = node.parentElement;
    }
    vis = [Math.max(vis[0], 0), Math.max(vis[1], 0), Math.min(vis[2], 1920), Math.min(vis[3], 1080)];
    const visArea = Math.max(0, vis[2] - vis[0]) * Math.max(0, vis[3] - vis[1]);
    const src = String(props.src).replace(/^.*\/img\//, '');
    // eslint-disable-next-line no-console
    console.log('MEAS ' + JSON.stringify({f: frame, src, w: el.offsetWidth, h: el.offsetHeight, nw: el.naturalWidth, nh: el.naturalHeight, sx: +Math.hypot(a, b).toFixed(4), sy: +Math.hypot(c, d).toFixed(4), rot: +((Math.atan2(b, a) * 180) / Math.PI).toFixed(2), vis: vis.map((v) => Math.round(v)), visArea: Math.round(visArea), op: +op.toFixed(3), hidden, clip: clipPath.slice(0, 120), filt: filt.slice(0, 80), tag: props.alt ?? ''}));
  });
  return <RImg ref={ref} {...props} />;
};
