import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import {Tape} from './Props';

export type Box = {x: number; y: number; w: number; h: number; t: number; tone?: 'teal' | 'coral' | 'ink'; label?: string; labelSide?: 'top' | 'bottom' | 'right'; pad?: number};

/**
 * A real document crop, pinned to the set like evidence on a board. Highlight boxes use fractional
 * image coordinates and animate in with t (0..1). `focus` zooms the image inside the frame so one box
 * fills the viewport (frame-driven transform; the layout never reflows).
 */
export const Evidence: React.FC<{
  src: string;
  width: number;
  aspect: number; // height / width
  boxes?: Box[];
  tag?: React.ReactNode; // integrated source tag, shown attached to the card
  style?: React.CSSProperties;
  pad?: number;
  rotate?: number;
  tape?: boolean;
  focus?: {box: Box; t: number; zoom?: number};
  dimOutside?: number;
  viewportHeight?: number; // crop the card to this height (for a windowed zoom)
}> = ({src, width, aspect, boxes = [], tag, style, pad = 22, rotate = 0, tape = true, focus, dimOutside = 0, viewportHeight}) => {
  const h = width * aspect;
  let tx = 0;
  let ty = 0;
  let sc = 1;
  if (focus) {
    const z = focus.zoom ?? Math.min(width / (focus.box.w * width + 60), (viewportHeight ?? h) / (focus.box.h * h + 60));
    sc = 1 + (z - 1) * focus.t;
    const bx = (focus.box.x + focus.box.w / 2) * width;
    const by = (focus.box.y + focus.box.h / 2) * h;
    tx = (width / 2 - bx) * focus.t;
    ty = ((viewportHeight ?? h) / 2 - by) * focus.t;
  }
  const vh = viewportHeight ?? h;
  return (
    <div style={{position: 'relative', width: width + pad * 2, transform: `rotate(${rotate}deg)`, ...style}}>
      <div style={{position: 'relative', width: width + pad * 2, padding: pad, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8, boxShadow: `10px 12px 0 ${C.shadow}`}}>
        <div style={{position: 'relative', width, height: vh, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width, height: h, transform: `translate(${tx}px, ${ty}px) scale(${sc})`, transformOrigin: `${focus ? (focus.box.x + focus.box.w / 2) * width : 0}px ${focus ? (focus.box.y + focus.box.h / 2) * h : 0}px`}}>
            <Img src={staticFile(src)} style={{width, height: h, display: 'block'}} />
            {dimOutside > 0 && boxes[0] && (
              <svg width={width} height={h} style={{position: 'absolute', left: 0, top: 0}}>
                <defs>
                  <mask id={`m-${src.replace(/[^a-z0-9]/gi, '')}`}>
                    <rect width={width} height={h} fill="white" />
                    <rect x={boxes[0].x * width - 8} y={boxes[0].y * h - 8} width={boxes[0].w * width + 16} height={boxes[0].h * h + 16} rx={8} fill="black" />
                  </mask>
                </defs>
                <rect width={width} height={h} fill={`rgba(250,243,223,${0.75 * dimOutside})`} mask={`url(#m-${src.replace(/[^a-z0-9]/gi, '')})`} />
              </svg>
            )}
            {boxes.map((b, i) => {
              const col = b.tone === 'coral' ? C.coral : b.tone === 'ink' ? C.ink : C.teal;
              const fill = b.tone === 'coral' ? 'rgba(239,107,85,0.16)' : b.tone === 'ink' ? 'rgba(22,42,50,0.06)' : 'rgba(28,167,160,0.16)';
              const p = b.pad ?? 8;
              return (
                <div key={i} style={{position: 'absolute', left: b.x * width - p, top: b.y * h - p, width: b.w * width + 2 * p, height: b.h * h + 2 * p, opacity: b.t}}>
                  <div style={{position: 'absolute', inset: 0, borderRadius: 10, border: `${OUTLINE}px solid ${col}`, background: fill, clipPath: `inset(0 ${(1 - b.t) * 100}% 0 0)`, transform: 'rotate(-0.4deg)'}} />
                  {b.label && (
                    <div
                      style={{
                        position: 'absolute',
                        ...(b.labelSide === 'right' ? {left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)'} : b.labelSide === 'bottom' ? {left: 0, top: 'calc(100% + 10px)'} : {left: 0, bottom: 'calc(100% + 10px)'}),
                        background: col,
                        color: C.white,
                        fontFamily: F.body,
                        fontWeight: 800,
                        fontSize: 24,
                        letterSpacing: '0.02em',
                        padding: '6px 14px',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        border: `3px solid ${C.ink}`,
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
      </div>
      {tape && (
        <>
          <Tape style={{left: -30, top: -12}} rotate={-8} />
          <Tape style={{right: -30, top: -12}} rotate={7} />
        </>
      )}
      {tag && <div style={{position: 'absolute', left: pad, top: '100%', marginTop: 16}}>{tag}</div>}
    </div>
  );
};
