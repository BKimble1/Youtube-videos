// SVG <image> is not covered by Remotion's render wait, so each frame's raster images (the ray-traced black hole)
// are loaded and decoded before the frame is captured (the fix for V1's single-frame dropouts).
import React from 'react';
import {continueRender, delayRender} from 'remotion';

const decoded = new Set<string>();
export const useImages = (urls: string[]) => {
  const key = urls.join('|');
  React.useLayoutEffect(() => {
    const todo = urls.filter((u) => !decoded.has(u));
    if (!todo.length) return;
    const h = delayRender('images ' + key);
    Promise.all(todo.map((u) => new Promise<void>((res) => {
      const im = new Image();
      im.onload = () => im.decode().then(() => res(), () => res());
      im.onerror = () => res();
      im.src = u;
    }))).then(() => {
      todo.forEach((u) => decoded.add(u));
      requestAnimationFrame(() => requestAnimationFrame(() => continueRender(h)));
    });
  }, [key]);
};
