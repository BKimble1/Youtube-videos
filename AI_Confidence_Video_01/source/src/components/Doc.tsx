import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F} from '../theme';

export type Box = {x: number; y: number; w: number; h: number; t: number; tone?: 'teal' | 'coral' | 'ink'; label?: string; labelSide?: 'top' | 'bottom'; padY?: number};

/**
 * A real document crop shown on a paper card, with highlight boxes in fractional
 * coordinates of the image. Boxes animate in with `t` (0..1).
 */
export const Doc: React.FC<{
  src: string;
  width: number;
  aspect: number; // height / width of the image
  boxes?: Box[];
  caption?: string;
  style?: React.CSSProperties;
  pad?: number;
  dimOutside?: number; // 0..1: dim everything outside the first box
}> = ({src, width, aspect, boxes = [], caption, style, pad = 26, dimOutside = 0}) => {
  const h = width * aspect;
  return (
    <div style={{...style}}>
      <div
        style={{
          position: 'relative',
          width: width + pad * 2,
          padding: pad,
          background: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{position: 'relative', width, height: h}}>
          <Img src={staticFile(src)} style={{width, height: h, display: 'block'}} />
          {dimOutside > 0 && boxes[0] && (
            <svg width={width} height={h} style={{position: 'absolute', left: 0, top: 0}}>
              <defs>
                <mask id={`m-${src}`}>
                  <rect width={width} height={h} fill="white" />
                  <rect x={boxes[0].x * width - 6} y={boxes[0].y * h - 6} width={boxes[0].w * width + 12} height={boxes[0].h * h + 12} rx={8} fill="black" />
                </mask>
              </defs>
              <rect width={width} height={h} fill={`rgba(245,240,230,${0.78 * dimOutside})`} mask={`url(#m-${src})`} />
            </svg>
          )}
          {boxes.map((b, i) => {
            const col = b.tone === 'coral' ? C.coral : b.tone === 'ink' ? C.ink : C.teal;
            const fill = b.tone === 'coral' ? 'rgba(255,111,94,0.14)' : b.tone === 'ink' ? 'rgba(27,35,51,0.06)' : 'rgba(60,201,180,0.14)';
            return (
              <div key={i} style={{position: 'absolute', left: b.x * width - 8, top: b.y * h - (b.padY ?? 6), width: b.w * width + 16, height: b.h * h + 2 * (b.padY ?? 6), opacity: b.t}}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 8,
                    border: `3px solid ${col}`,
                    background: fill,
                    clipPath: `inset(0 ${(1 - b.t) * 100}% 0 0)`,
                  }}
                />
                {b.label && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      [b.labelSide === 'bottom' ? 'top' : 'bottom']: 'calc(100% + 8px)',
                      background: col,
                      color: b.tone === 'ink' ? C.paper : '#0B1220',
                      fontFamily: F.sans,
                      fontWeight: 700,
                      fontSize: 22,
                      letterSpacing: '0.06em',
                      padding: '5px 12px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {b.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {caption && (
        <div style={{marginTop: 14, fontFamily: F.sans, fontSize: 21, color: C.muted, letterSpacing: '0.01em'}}>{caption}</div>
      )}
    </div>
  );
};

/**
 * Full-bleed archival photo with slow motion and a dark gradient for legibility.
 * Motion is either a push (zoomFrom -> zoomTo) or, to stay at native resolution in the 4K master,
 * a vertical pan across the cropped-off part of the photo (panY: [from%, to%] with zoom 1).
 */
export const Photo: React.FC<{src: string; t: number; zoomFrom?: number; zoomTo?: number; originX?: number; originY?: number; darken?: number; panY?: [number, number]}> = ({
  src,
  t,
  zoomFrom = 1.04,
  zoomTo = 1.12,
  originX = 50,
  originY = 50,
  darken = 0.55,
  panY,
}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: panY ? `50% ${panY[0] + (panY[1] - panY[0]) * t}%` : undefined,
        transform: `scale(${zoomFrom + (zoomTo - zoomFrom) * t})`,
        transformOrigin: `${originX}% ${originY}%`,
        filter: 'grayscale(1) contrast(1.05)',
      }}
    />
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(8,16,30,${darken * 0.6}) 0%, rgba(8,16,30,${darken}) 70%, rgba(8,16,30,${Math.min(0.95, darken + 0.3)}) 100%)`}} />
  </div>
);
