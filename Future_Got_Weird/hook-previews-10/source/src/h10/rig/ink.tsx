// Weird Crew outlines. The channel's cast is drawn as cutouts with one ink contour around each part
// (Video 01 rig: OUTLINE 4 px for a 440 px figure). Here every part keeps its dimensional gradient fill, and the
// contour comes from a two-pass draw: first the silhouettes of everything inside <Inked> in ink, widened by w,
// then the fills on top. Overlapping parts of one <Inked> group therefore merge into a single outlined shape
// (an arm reads as one tube, not segments), while separate groups get a contour where they overlap.
import React from 'react';

export const INK = '#172B3A';
/** V2 finish: contours are thin, selective edges (about 0.36 of the crew rig's width) so the exterior shares one
 *  art system with the soft interiors; facial feature lines stay a little heavier so the face still reads. */
export const OUTLINE_K = 0.36;
export const FEATURE_K = 0.8;

type InkState = {pass: 'both' | 'ink' | 'fill'; w: number};
export const InkCtx = React.createContext<InkState>({pass: 'both', w: 0});
export const useInk = () => React.useContext(InkCtx);

export type InkFade = {c: {x: number; y: number}; r: number};

/** Outline the union of the children with an ink contour of width w (in the children's own units).
 *  V3: `fade` dissolves the group's own contour inside the given circles (joints where a part grows out of the body:
 *  shoulder, hip, wrist), so a limb has no drawn line where it attaches. A figure is wrapped in one outer group,
 *  so its exterior silhouette stays outlined everywhere; inner groups draw only occlusion lines. */
export const Inked: React.FC<{w: number; children: React.ReactNode; opacity?: number; fade?: InkFade[]; id?: string}> = ({w, children, opacity, fade, id}) => {
  const parent = useInk();
  // inside a parent's ink pass, a nested group simply contributes its silhouette
  if (parent.pass === 'ink') return <InkCtx.Provider value={{pass: 'ink', w: Math.max(w, parent.w)}}>{children}</InkCtx.Provider>;
  const inkLayer = <InkCtx.Provider value={{pass: 'ink', w}}>{children}</InkCtx.Provider>;
  const faded = fade && fade.length > 0 && id;
  return (
    <g opacity={opacity}>
      {faded ? (
        <g>
          <defs>
            <radialGradient id={`${id}-fg`}>
              <stop offset="0" stopColor="#000" />
              <stop offset="0.55" stopColor="#000" />
              <stop offset="1" stopColor="#FFF" />
            </radialGradient>
            <mask id={`${id}-fm`}>
              <rect x="-1500" y="-1600" width="2000" height="1800" fill="#FFF" />
              {fade!.map((q, i) => (
                <circle key={i} cx={q.c.x.toFixed(2)} cy={q.c.y.toFixed(2)} r={q.r.toFixed(2)} fill={`url(#${id}-fg)`} />
              ))}
            </mask>
          </defs>
          <g mask={`url(#${id}-fm)`}>{inkLayer}</g>
        </g>
      ) : (
        inkLayer
      )}
      <InkCtx.Provider value={{pass: 'fill', w}}>{children}</InkCtx.Provider>
    </g>
  );
};

/** Drawn only in the fill pass (features, highlights, folds, stripes): never part of the silhouette. */
export const Deco: React.FC<{children: React.ReactNode}> = ({children}) => (useInk().pass === 'ink' ? null : <>{children}</>);

/** A plain path that takes part in the outline: widened ink in the ink pass, the given fill otherwise. */
export const InkPath: React.FC<{d: string; fill: string; opacity?: number; transform?: string}> = ({d, fill, opacity, transform}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return <path d={d} fill={INK} stroke={INK} strokeWidth={ink.w * 2 * OUTLINE_K} strokeLinejoin="round" opacity={opacity} transform={transform} />;
  return <path d={d} fill={fill} opacity={opacity} transform={transform} />;
};

/** The ink underlay for a primitive (used by the gradient primitives in shade.tsx). */
export const inkUnder = (w: number, el: {d?: string; ellipse?: {cx: number; cy: number; rx: number; ry: number; transform?: string}}, opacity?: number) =>
  el.d !== undefined ? (
    <path d={el.d} fill={INK} stroke={INK} strokeWidth={w * 2 * OUTLINE_K} strokeLinejoin="round" opacity={opacity} />
  ) : (
    <ellipse cx={el.ellipse!.cx} cy={el.ellipse!.cy} rx={el.ellipse!.rx} ry={el.ellipse!.ry} transform={el.ellipse!.transform} fill={INK} stroke={INK} strokeWidth={w * 2 * OUTLINE_K} opacity={opacity} />
  );

/** Ink line (brows, creases, mouth line, nose hook): the crew's drawn features. */
export const InkLine: React.FC<{d: string; w: number; opacity?: number; color?: string}> = ({d, w, opacity, color = INK}) =>
  useInk().pass === 'ink' ? null : <path d={d} fill="none" stroke={color} strokeWidth={w * FEATURE_K} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
