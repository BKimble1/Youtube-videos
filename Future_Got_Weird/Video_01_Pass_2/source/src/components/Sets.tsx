import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, H, OUTLINE, W} from '../theme';
import {Layer} from '../lib/camera';
import {rand} from '../lib/anim';
import {Sign} from './Text';
import {BookRow} from './Props';

/** Flat colour wall with a faint cutout-paper dot texture (static, no drift). */
export const Wall: React.FC<{color: string; dots?: string; children?: React.ReactNode; depth?: number}> = ({color, dots, children, depth = 0.7}) => (
  <Layer depth={depth}>
    <AbsoluteFill style={{background: color, left: -200, right: -200, top: -200, bottom: -200, width: W + 400, height: H + 400}}>
      {dots && (
        <svg width={W + 400} height={H + 400} style={{position: 'absolute', left: 0, top: 0}}>
          {Array.from({length: 70}).map((_, i) => (
            <circle key={i} cx={rand(i * 3 + 11) * (W + 400)} cy={rand(i * 5 + 7) * (H + 400)} r={3 + rand(i * 9 + 1) * 6} fill={dots} opacity={0.35} />
          ))}
        </svg>
      )}
      {children}
    </AbsoluteFill>
  </Layer>
);

/** Floor band at the bottom of a set. */
export const Floor: React.FC<{color: string; y?: number; depth?: number; stripe?: string}> = ({color, y = 820, depth = 1, stripe}) => (
  <Layer depth={depth}>
    <div style={{position: 'absolute', left: -300, right: -300, top: y, height: H - y + 300, background: color, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
      {stripe && <div style={{position: 'absolute', left: 0, right: 0, top: 26, height: 10, background: stripe, opacity: 0.5}} />}
    </div>
  </Layer>
);

/** The answer counter: a long wooden counter with three service windows, a hanging sign, a bell. */
export const CounterSet: React.FC<{signText?: string; windows?: number; children?: React.ReactNode; front?: React.ReactNode; wallColor?: string}> = ({signText = 'ANSWERS', windows = 3, children, front, wallColor = C.saffron}) => (
  <>
    <Wall color={wallColor} dots={C.saffronDeep} depth={0.75}>
      {/* three arched service windows on the back wall */}
      {Array.from({length: windows}).map((_, i) => {
        const cx = 200 + 480 + i * 480; // wall space is offset by 200 from world space
        return (
          <div key={i} style={{position: 'absolute', left: cx - 210, top: 200 + 150, width: 420, height: 440, background: C.paper, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '210px 210px 18px 18px'}}>
            <div style={{position: 'absolute', left: 14, right: 14, top: 14, bottom: 14, border: `3px solid ${C.paperLine}`, borderRadius: '196px 196px 10px 10px'}} />
          </div>
        );
      })}
      {/* hanging sign */}
      <div style={{position: 'absolute', left: 200 + 960 - 230, top: 200 + 70}}>
        <div style={{position: 'absolute', left: 60, top: -70, width: 4, height: 70, background: C.ink}} />
        <div style={{position: 'absolute', left: 396, top: -70, width: 4, height: 70, background: C.ink}} />
        <Sign bg={C.cream} size={48} width={460} style={{boxSizing: 'border-box'}}>{signText}</Sign>
      </div>
    </Wall>
    {children}
    {/* counter front (foreground plane) */}
    <Layer depth={1.08}>
      <div style={{position: 'absolute', left: -200, right: -200, top: 690, height: 36, background: C.woodLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6}} />
      <div style={{position: 'absolute', left: -200, right: -200, top: 722, height: 420, background: C.wood, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
        {Array.from({length: 7}).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: 120 + i * 300, top: 40, width: 230, height: 150, border: `${OUTLINE}px solid ${C.woodDeep}`, borderRadius: 10, opacity: 0.8}} />
        ))}
      </div>
      {front}
    </Layer>
  </>
);

/** Library: tall shelves on the back wall, a card catalogue cabinet mid-ground. */
export const LibrarySet: React.FC<{children?: React.ReactNode; words?: string[]; gapShelf?: number; gapAt?: number; highlight?: number}> = ({children, words = [], gapShelf = -1, gapAt = 0.55, highlight = 0}) => (
  <>
    <Wall color={C.tealLight} dots={C.teal} depth={0.7}>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} style={{position: 'absolute', left: 200 + 80, top: 200 + 60 + row * 190}}>
          <BookRow seed={row * 7 + 3} width={1760} height={150} words={words} gap={row === gapShelf} gapAt={gapAt} highlight={highlight} />
        </div>
      ))}
      {/* shelf uprights */}
      {[60, 960, 1860].map((x) => (
        <div key={x} style={{position: 'absolute', left: 200 + x, top: 200 + 20, width: 22, height: 800, background: C.woodDeep, border: `${OUTLINE}px solid ${C.ink}`}} />
      ))}
    </Wall>
    <Floor color={C.woodLight} y={840} depth={1} stripe={C.wood} />
    {children}
  </>
);

/** Game-show stage: curtain backdrop, spotlights, stage floor. */
export const StageSet: React.FC<{children?: React.ReactNode; spots?: number}> = ({children, spots = 1}) => (
  <>
    <Wall color={C.saffronDeep} depth={0.7}>
      {/* curtain folds */}
      {Array.from({length: 24}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: i * 96 - 40, top: 0, width: 48, height: H + 400, background: C.saffron, opacity: 0.55, borderRadius: 24}} />
      ))}
      {/* spotlight cones */}
      <svg width={W + 400} height={H + 400} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M 740 0 L 300 ${H + 100} L 1180 ${H + 100} Z`} fill={C.cream} opacity={0.35 * spots} />
        <path d={`M 1580 0 L 1140 ${H + 100} L 2020 ${H + 100} Z`} fill={C.cream} opacity={0.35 * spots} />
      </svg>
    </Wall>
    <Floor color={C.blueDeep} y={850} depth={1} stripe={C.blue} />
    {children}
  </>
);

/** The language-assembly room: blue wall, a long conveyor track and the apparatus housing. */
export const ApparatusSet: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <>
    <Wall color={C.blueLight} dots={C.blue} depth={0.7}>
      {/* pipes and a window-like panel for depth */}
      <div style={{position: 'absolute', left: 200 + 80, top: 200 + 60, width: 1760, height: 26, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13}} />
      <div style={{position: 'absolute', left: 200 + 1500, top: 200 + 86, width: 26, height: 200, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13}} />
    </Wall>
    <Floor color={C.paperDeep} y={860} depth={1} stripe={C.paperLine} />
    {children}
  </>
);

/** The fact-checker's desk room: coral-light wall, a corkboard, a desk in the foreground. */
export const DeskSet: React.FC<{children?: React.ReactNode; board?: React.ReactNode; wall?: string}> = ({children, board, wall = C.coralLight}) => (
  <>
    <Wall color={wall} dots={C.coral} depth={0.72}>
      {/* corkboard */}
      <div style={{position: 'absolute', left: 200 + 120, top: 200 + 70, width: 1680, height: 560, background: C.woodLight, border: `${OUTLINE + 4}px solid ${C.woodDeep}`, borderRadius: 14}}>
        {board}
      </div>
    </Wall>
    <Layer depth={1}>
      <div style={{position: 'absolute', left: -200, right: -200, top: 760, height: 40, background: C.woodLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8}} />
      <div style={{position: 'absolute', left: -200, right: -200, top: 796, height: 400, background: C.wood, borderTop: `${OUTLINE}px solid ${C.ink}`}} />
    </Layer>
    {children}
  </>
);

/** Plain paper field with a big colour block, for title cards. */
export const PaperField: React.FC<{children?: React.ReactNode; color?: string}> = ({children, color = C.paper}) => (
  <AbsoluteFill style={{background: color}}>{children}</AbsoluteFill>
);

/** Channel wordmark (original). */
export const Wordmark: React.FC<{size?: number; style?: React.CSSProperties; tagline?: boolean; reveal?: [number, number, number]; taglineT?: [number, number]}> = ({size = 120, style, tagline, reveal = [1, 1, 1], taglineT = [1, 1]}) => (
  <div style={{textAlign: 'center', ...style}}>
    <div style={{display: 'inline-block', position: 'relative'}}>
      <div style={{fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1, color: C.ink, letterSpacing: '-0.01em'}}>
        {(['FUTURE', 'GOT', 'WEIRD'] as const).map((w, i) => (
          <span key={w} style={{display: 'inline-block', transform: `scale(${Math.max(0.01, reveal[i])})`, color: i === 1 ? C.coral : C.ink, marginRight: i < 2 ? size * 0.24 : 0}}>
            {w}
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', left: -size * 0.1, right: -size * 0.1, bottom: -size * 0.12, height: size * 0.18, background: C.saffron, zIndex: -1, borderRadius: size * 0.09, transform: 'rotate(-1deg)'}} />
    </div>
    {tagline && (
      <div style={{marginTop: size * 0.32, fontFamily: F.body, fontWeight: 800, fontSize: size * 0.3, color: C.inkSoft}}>
        <span style={{display: 'inline-block', opacity: taglineT[0], transform: `translateY(${(1 - taglineT[0]) * 12}px)`}}>AI moves fast.</span>{' '}
        <span style={{display: 'inline-block', opacity: taglineT[1], transform: `translateY(${(1 - taglineT[1]) * 12}px)`}}>We make it make sense.</span>
      </div>
    )}
  </div>
);
