// The game's picture: the raycaster drawn into a 480 x 300 canvas, shown with crisp (nearest-neighbour) pixels at any
// size. `rect` is where the screen lands on the 1080 x 1920 frame (px).
import React, {useLayoutEffect, useRef} from 'react';
import {GH, GW, render} from './engine';
import {gameState} from './script';

export const GameScreen: React.FC<{t: number; rect: {x: number; y: number; w: number; h: number}; opacity?: number}> = ({t, rect, opacity = 1}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const im = ctx.createImageData(GW, GH);
    render(gameState(t), im.data);
    ctx.putImageData(im, 0, 0);
  }, [t]);
  return (
    <canvas
      ref={ref}
      width={GW}
      height={GH}
      style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, imageRendering: 'pixelated', opacity}}
    />
  );
};
