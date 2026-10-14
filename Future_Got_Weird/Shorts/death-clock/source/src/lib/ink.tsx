// Weird Crew outlines. The channel's cast is drawn as cutouts with one ink contour around each part
// (Video 01 rig: OUTLINE 4 px for a 440 px figure). Here every part keeps its dimensional gradient fill, and the
// contour comes from a two-pass draw: first the silhouettes of everything inside <Inked> in ink, widened by w,
// then the fills on top. Overlapping parts of one <Inked> group therefore merge into a single outlined shape
// (an arm reads as one tube, not segments), while separate groups get a contour where they overlap.
import React from 'react';

export const INK = '#172B3A';

type InkState = {pass: 'both' | 'ink' | 'fill'; w: number};
export const InkCtx = React.createContext<InkState>({pass: 'both', w: 0});
export const useInk = () => React.useContext(InkCtx);

/** Outline the union of the children with an ink contour of width w (in the children's own units). */
export const Inked: React.FC<{w: number; children: React.ReactNode; opacity?: number}> = ({w, children, opacity}) => {
  const parent = useInk();
  // inside a parent's ink pass, a nested group simply contributes its silhouette
  if (parent.pass === 'ink') return <InkCtx.Provider value={{pass: 'ink', w: Math.max(w, parent.w)}}>{children}</InkCtx.Provider>;
  return (
    <g opacity={opacity}>
      <InkCtx.Provider value={{pass: 'ink', w}}>{children}</InkCtx.Provider>
      <InkCtx.Provider value={{pass: 'fill', w}}>{children}</InkCtx.Provider>
    </g>
  );
};

/** Drawn only in the fill pass (features, highlights, folds, stripes): never part of the silhouette. */
export const Deco: React.FC<{children: React.ReactNode}> = ({children}) => (useInk().pass === 'ink' ? null : <>{children}</>);

/** A plain path that takes part in the outline: widened ink in the ink pass, the given fill otherwise. */
export const InkPath: React.FC<{d: string; fill: string; opacity?: number; transform?: string}> = ({d, fill, opacity, transform}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return <path d={d} fill={INK} stroke={INK} strokeWidth={ink.w * 2} strokeLinejoin="round" opacity={opacity} transform={transform} />;
  return <path d={d} fill={fill} opacity={opacity} transform={transform} />;
};

/** The ink underlay for a primitive (used by the gradient primitives in shade.tsx). */
export const inkUnder = (w: number, el: {d?: string; ellipse?: {cx: number; cy: number; rx: number; ry: number; transform?: string}}, opacity?: number) =>
  el.d !== undefined ? (
    <path d={el.d} fill={INK} stroke={INK} strokeWidth={w * 2} strokeLinejoin="round" opacity={opacity} />
  ) : (
    <ellipse cx={el.ellipse!.cx} cy={el.ellipse!.cy} rx={el.ellipse!.rx} ry={el.ellipse!.ry} transform={el.ellipse!.transform} fill={INK} stroke={INK} strokeWidth={w * 2} opacity={opacity} />
  );

/** Ink line (brows, creases, mouth line, nose hook): the crew's drawn features. */
export const InkLine: React.FC<{d: string; w: number; opacity?: number; color?: string}> = ({d, w, opacity, color = INK}) =>
  useInk().pass === 'ink' ? null : <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
