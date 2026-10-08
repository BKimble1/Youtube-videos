import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {textWidth} from '../../lib/measure';

/**
 * Art for S3 (the token machine). Everything is drawn in WORLD px (the scene's depth-1 layer), positioned
 * absolutely, so the scene can do exact framing arithmetic against these constants.
 */

/* ------------------------------------------------------------------ token tiles */
export const TILE = {font: 40, padX: 7, B: 4, H: 68, top: 732, gap: 6, lh: 46};
export const TILE_FONT = `400 ${TILE.font}px "Source Serif 4 Variable"`;
export const SPACE_INNER = 26; // content width of the lone-space token's tile

/** Text shown on a token tile: the leading space of a token is not drawn (the gap between tiles stands for it). */
export const tokDisplay = (t: string) => (t === ' ' ? '' : t.replace(/^ /, ''));
export const tokWidth = (t: string) => (t === ' ' ? SPACE_INNER : textWidth(tokDisplay(t), TILE_FONT)) + 2 * TILE.padX + 2 * TILE.B;

const hex = (h: string) => (h.startsWith('rgb') ? (h.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
/** Mix two colours given as #rrggbb or rgb(...) (t = 0 → a, 1 → b). */
export const mix = (a: string, b: string, t: number) => {
  const k = Math.max(0, Math.min(1, t));
  const A = hex(a);
  const Bc = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (Bc[i] - v) * k)).join(',')})`;
};

export type TileLook = {bg: string; bd: string; fg: string};
export const LOOK: Record<'paper' | 'fresh' | 'teal' | 'saffron' | 'blue' | 'dim', TileLook> = {
  paper: {bg: C.cream, bd: C.ink, fg: C.ink},
  fresh: {bg: C.saffronLight, bd: C.saffronDeep, fg: C.ink},
  teal: {bg: C.tealLight, bd: C.teal, fg: C.ink},
  saffron: {bg: C.saffronLight, bd: C.saffronDeep, fg: C.ink},
  blue: {bg: C.blueLight, bd: C.blue, fg: C.ink},
  dim: {bg: C.paperDeep, bd: C.inkMuted, fg: C.inkMuted},
};
export const mixLook = (a: TileLook, b: TileLook, t: number): TileLook => ({bg: mix(a.bg, b.bg, t), bd: mix(a.bd, b.bd, t), fg: mix(a.fg, b.fg, t)});

/**
 * One token tile at world (x, y = top) of width w. Text is centred in the content box, so the word's line-box centre
 * is the tile centre. padL/padR/bl/br let two tiles fuse into one block ("Kalai") and crack apart again.
 */
export const Tile: React.FC<{
  x: number;
  y: number;
  w: number;
  text: string;
  look: TileLook;
  sx?: number;
  sy?: number;
  rot?: number;
  origin?: string;
  padL?: number;
  padR?: number;
  bl?: number;
  br?: number;
  textX?: number; // explicit text left (relative to the tile) instead of centring (used while the strip splits)
  radius?: number;
  flash?: number;
  glow?: number;
  shadow?: boolean;
}> = ({x, y, w, text, look, sx = 1, sy = 1, rot = 0, origin = '50% 100%', padL, padR, bl = TILE.B, br = TILE.B, textX, radius = 10, flash = 0, glow = 0, shadow = true}) => {
  const isSpace = text === ' ';
  const shown = tokDisplay(text);
  const rl = bl < 0.5 ? 0 : radius;
  const rr = br < 0.5 ? 0 : radius;
  const glowShadow = glow > 0 ? `, 0 0 ${26 * glow}px ${8 * glow}px rgba(79,124,201,${0.55 * glow})` : '';
  const flashShadow = flash > 0 ? `, 0 0 ${30 * flash}px ${10 * flash}px rgba(255,199,68,${0.9 * flash})` : '';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: TILE.H,
        boxSizing: 'border-box',
        background: look.bg,
        borderStyle: 'solid',
        borderColor: look.bd,
        borderWidth: `${TILE.B}px ${br}px ${TILE.B}px ${bl}px`,
        borderRadius: `${rl}px ${rr}px ${rr}px ${rl}px`,
        boxShadow: `${shadow ? `3px 4px 0 ${C.shadow}` : '0 0 0 transparent'}${glowShadow}${flashShadow}`,
        transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
        transformOrigin: origin,
        overflow: 'visible',
      }}
    >
      {isSpace ? (
        <svg width={w - bl - br} height={TILE.H - 2 * TILE.B} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={`M ${(w - bl - br) / 2 - 9} ${TILE.H * 0.5} L ${(w - bl - br) / 2 - 9} ${TILE.H * 0.62} L ${(w - bl - br) / 2 + 9} ${TILE.H * 0.62} L ${(w - bl - br) / 2 + 9} ${TILE.H * 0.5}`} fill="none" stroke={look.fg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : textX !== undefined ? (
        <div style={{position: 'absolute', left: textX - bl, top: (TILE.H - 2 * TILE.B - TILE.lh) / 2, height: TILE.lh, lineHeight: `${TILE.lh}px`, font: TILE_FONT, color: look.fg, whiteSpace: 'pre'}}>{shown}</div>
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            paddingLeft: padL ?? TILE.padX,
            paddingRight: padR ?? TILE.padX,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: TILE_FONT,
            lineHeight: `${TILE.lh}px`,
            color: look.fg,
            whiteSpace: 'pre',
          }}
        >
          {shown}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ the machine */
export const M = {
  x0: 250,
  x1: 1140,
  headTop: 150,
  headBot: 222,
  panelR: 866, // right edge of the panel body = chute's left wall
  screen: {x0: 270, y0: 236, x1: 850, y1: 626},
  lipTop: 626,
  lipBot: 648,
  glass: {x0: 884, x1: 1122},
  chuteBot: 700,
  mouthBot: 714,
  rowY: (i: number) => 242 + i * 76,
  rowH: 76,
  rowRight: 846,
  win0: 606, // left edge of the slot windows
  pctX1: 372,
  barX0: 384,
  barX1: 592,
  rods: [316, 1060],
};

/** Hanger rods running up out of frame (same depth as the housing, so the joint never slides). */
export const Rods: React.FC<{dip?: number}> = ({dip = 0}) => (
  <>
    {M.rods.map((x) => (
      <React.Fragment key={x}>
        <div style={{position: 'absolute', left: x, top: -1400, width: 16, height: 1400 + M.headTop + dip + 2, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: x - 14, top: M.headTop - 12 + dip, width: 44, height: 16, borderRadius: 6, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      </React.Fragment>
    ))}
  </>
);

/** The housing body: header with name plate, lamps and the rewind/fast-forward window; panel body; chute frame. */
export const HousingBack: React.FC<{power: number; dy: number}> = ({power, dy}) => (
  <div style={{position: 'absolute', left: 0, top: dy}}>
    {/* panel body */}
    <div style={{position: 'absolute', left: M.x0, top: M.headBot - 6, width: M.panelR - M.x0 + OUTLINE, height: M.lipTop - M.headBot + 18, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '0 0 0 20px', boxSizing: 'border-box'}} />
    {/* screen bezel, dark when off, warm cream when on (light, so it may blend) */}
    <div style={{position: 'absolute', left: M.screen.x0, top: M.screen.y0, width: M.screen.x1 - M.screen.x0, height: M.screen.y1 - M.screen.y0, background: mix('#2C3D5A', C.cream, power), border: `3px solid ${C.ink}`, borderRadius: 14, boxSizing: 'border-box', overflow: 'hidden'}}>
      {/* glass sheen */}
      <div style={{position: 'absolute', left: -60, top: -40, width: 120, height: 600, background: 'rgba(255,255,255,0.08)', transform: 'rotate(24deg)'}} />
      <div style={{position: 'absolute', left: 90, top: -40, width: 34, height: 600, background: 'rgba(255,255,255,0.06)', transform: 'rotate(24deg)'}} />
    </div>
    {/* chute back: the glass column (the wall shows through faintly) */}
    <div style={{position: 'absolute', left: M.glass.x0, top: M.headBot - 4, width: M.glass.x1 - M.glass.x0, height: M.chuteBot - M.headBot + 4, background: 'rgba(255,255,255,0.32)'}} />
  </div>
);

/** Chute frame and glass highlights, drawn OVER a tile falling inside it. Row gates on the left wall. */
export const ChuteFront: React.FC<{dy: number; gateOpen?: number}> = ({dy, gateOpen = 0}) => (
  <div style={{position: 'absolute', left: 0, top: dy}}>
    {/* highlights */}
    <div style={{position: 'absolute', left: M.glass.x0 + 14, top: M.headBot + 10, width: 10, height: M.chuteBot - M.headBot - 30, borderRadius: 5, background: 'rgba(255,255,255,0.55)'}} />
    <div style={{position: 'absolute', left: M.glass.x1 - 22, top: M.headBot + 40, width: 6, height: M.chuteBot - M.headBot - 90, borderRadius: 3, background: 'rgba(255,255,255,0.45)'}} />
    {/* left wall with the row gates */}
    <div style={{position: 'absolute', left: M.panelR, top: M.headBot - 4, width: M.glass.x0 - M.panelR + 2, height: M.chuteBot - M.headBot + 8, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} style={{position: 'absolute', left: M.panelR + 4, top: M.rowY(i) + 10, width: M.glass.x0 - M.panelR - 6, height: TILE.H - 20, borderRadius: 4, background: i === 0 ? mix(C.ink, C.saffron, gateOpen) : C.ink, opacity: 0.85}} />
    ))}
    {/* right wall */}
    <div style={{position: 'absolute', left: M.glass.x1 - 2, top: M.headBot - 4, width: M.x1 - M.glass.x1 + 2, height: M.chuteBot - M.headBot + 8, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
    {/* mouth collar */}
    <div style={{position: 'absolute', left: M.panelR - 8, top: M.chuteBot - 8, width: M.x1 - M.panelR + 16, height: M.mouthBot - M.chuteBot + 8, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '4px 4px 14px 14px', boxSizing: 'border-box'}} />
    <div style={{position: 'absolute', left: M.glass.x0, top: M.mouthBot - 6, width: M.glass.x1 - M.glass.x0, height: 6, background: C.ink, borderRadius: 3}} />
  </div>
);

export type Lamp = {on: number; color: string};
/** Header bar: name plate, three lamps, a standby LED and the ◀◀ / ▶▶ window. */
export const Header: React.FC<{dy: number; lamps: Lamp[]; standby: number; mode: 'none' | 'rew' | 'ff'; modeOn: number; glow?: number}> = ({dy, lamps, standby, mode, modeOn, glow = 0}) => (
  <div style={{position: 'absolute', left: 0, top: dy}}>
    <div style={{position: 'absolute', left: M.x0, top: M.headTop, width: M.x1 - M.x0, height: M.headBot - M.headTop, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '20px 20px 4px 4px', boxSizing: 'border-box', boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${12 * glow}px rgba(255,233,168,${0.7 * glow})` : undefined}} />
    <div style={{position: 'absolute', left: M.x0 + 28, top: M.headTop + 14, fontFamily: F.display, fontWeight: 700, fontSize: 34, lineHeight: '44px', color: C.white, letterSpacing: '0.04em', whiteSpace: 'nowrap'}}>NEXT-CHUNK SCORER</div>
    {/* rewind / fast-forward window */}
    <div style={{position: 'absolute', left: 836, top: M.headTop + 16, width: 76, height: 40, borderRadius: 8, background: C.ink, border: `3px solid ${C.ink}`, boxSizing: 'border-box'}}>
      {mode !== 'none' && (
        <svg width={70} height={34} style={{position: 'absolute', left: 0, top: 0, opacity: modeOn}}>
          {(mode === 'rew' ? [[44, 'l'], [24, 'l']] : [[18, 'r'], [38, 'r']]).map(([x, d], i) => (
            <path key={i} d={d === 'l' ? `M ${x} 7 L ${(x as number) - 16} 17 L ${x} 27 Z` : `M ${x} 7 L ${(x as number) + 16} 17 L ${x} 27 Z`} fill={C.saffron} />
          ))}
        </svg>
      )}
    </div>
    {lamps.map((l, i) => {
      const cx = 966 + i * 46;
      return (
        <div key={i} style={{position: 'absolute', left: cx - 14, top: M.headTop + 22, width: 28, height: 28, borderRadius: 14, background: mix('#2C3D5A', l.color, l.on), border: `3px solid ${C.ink}`, boxSizing: 'border-box', boxShadow: l.on > 0.05 ? `0 0 ${18 * l.on}px ${5 * l.on}px ${l.color}` : undefined}} />
      );
    })}
    <div style={{position: 'absolute', left: 1100, top: M.headTop + 30, width: 12, height: 12, borderRadius: 6, background: mix('#1D5A55', '#7CF2DF', standby), boxShadow: standby > 0.1 ? `0 0 10px 3px rgba(124,242,223,${0.8 * standby})` : undefined}} />
  </div>
);

/** The bottom lip of the panel: the reader ledge the slip stands on, with its intake slot. */
export const Lip: React.FC<{dy: number; slot: number}> = ({dy, slot}) => (
  <div style={{position: 'absolute', left: 0, top: dy}}>
    <div style={{position: 'absolute', left: M.x0 - 10, top: M.lipTop, width: M.panelR - M.x0 + 20, height: M.lipBot - M.lipTop, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6, boxSizing: 'border-box'}} />
    <div style={{position: 'absolute', left: 296, top: M.lipTop + 6, width: 528, height: 4 + 4 * slot, borderRadius: 3, background: C.ink}} />
  </div>
);

/** The "illustrative numbers" guard-rail tag hanging under the panel; flips down on two chains. */
export const IllustrativeTag: React.FC<{dy: number; flip: number; swing: number}> = ({dy, flip, swing}) => {
  if (flip <= 0.001) return null;
  const x0 = 292;
  const w = 372;
  return (
    <div style={{position: 'absolute', left: x0, top: M.lipBot + dy, width: w, height: 70, transform: `rotate(${swing}deg)`, transformOrigin: '50% 0%'}}>
      <div style={{position: 'absolute', left: 40, top: -2, width: 4, height: 16, background: C.ink}} />
      <div style={{position: 'absolute', left: w - 44, top: -2, width: 4, height: 16, background: C.ink}} />
      <div style={{position: 'absolute', left: 0, top: 12, width: w, transform: `perspective(700px) rotateX(${(1 - flip) * -88}deg)`, transformOrigin: '50% 0%'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: w, height: 50, boxSizing: 'border-box', borderRadius: 999, background: C.saffron, border: `3px dashed ${C.saffronDeep}`, fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.ink, letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>illustrative numbers</div>
      </div>
    </div>
  );
};

/** A probability readout: integer percent with the units drum rolling continuously. */
export const RollPct: React.FC<{v: number; x1: number; y: number; color: string; size?: number}> = ({v, x1, y, color, size = 32}) => {
  const raw = Math.max(0, v);
  // odometer: the drum rests on whole numbers and rolls quickly between them
  const val = Math.floor(raw) + Math.max(0, Math.min(1, (raw - Math.floor(raw) - 0.8) / 0.2));
  const lh = size * 1.15;
  const units = val % 10;
  const tens = Math.floor(val / 10) + Math.max(0, Math.min(1, units - 9));
  const cw = size * 0.62;
  const col = (d: number, cont: boolean) => {
    const off = cont ? d : Math.floor(d);
    return (
      <div style={{position: 'relative', width: cw, height: lh, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: -((off % 10) + 10) % 10 * lh}}>
          {Array.from({length: 11}).map((_, k) => (
            <div key={k} style={{height: lh, lineHeight: `${lh}px`, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: size, color}}>{k % 10}</div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: x1 - cw * 3 - 2, top: y, display: 'flex', alignItems: 'center'}}>
      <div style={{opacity: tens >= 1 ? 1 : Math.max(0, tens)}}>{col(tens, false)}</div>
      {col(units, true)}
      <div style={{width: cw, height: lh, lineHeight: `${lh}px`, fontFamily: F.mono, fontWeight: 700, fontSize: size * 0.85, color, textAlign: 'center'}}>%</div>
    </div>
  );
};

/* ------------------------------------------------------------------ the conveyor */
export const BELT = {top: 800, bot: 832, beamBot: 854, floor: 880};

export const Belt: React.FC<{off: number}> = ({off}) => {
  const x0 = -2600;
  const x1 = 3400;
  const rollers = [];
  for (let x = x0 + 60; x < x1; x += 120) rollers.push(x);
  const legs = [];
  for (let x = x0 + 200; x < x1; x += 520) legs.push(x);
  const ang = (-off / 9) * (180 / Math.PI);
  return (
    <>
      {legs.map((x) => (
        <div key={x} style={{position: 'absolute', left: x, top: BELT.beamBot - 4, width: 22, height: BELT.floor - BELT.beamBot + 8, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      ))}
      {/* beam with roller hubs */}
      <div style={{position: 'absolute', left: x0, top: BELT.bot - 4, width: x1 - x0, height: BELT.beamBot - BELT.bot + 4, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      {/* belt band: slats scroll with the belt */}
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: BELT.top,
          width: x1 - x0,
          height: BELT.bot - BELT.top,
          background: `repeating-linear-gradient(90deg, ${C.inkSoft} 0px, ${C.inkSoft} 40px, #556B76 40px, #556B76 46px)`,
          backgroundPosition: `${-off}px 0px`,
          border: `${OUTLINE}px solid ${C.ink}`,
          borderRadius: 16,
          boxSizing: 'border-box',
        }}
      />
      {rollers.map((x) => (
        <svg key={x} width={26} height={26} viewBox="-13 -13 26 26" style={{position: 'absolute', left: x - 13, top: (BELT.bot + BELT.beamBot) / 2 - 13}}>
          <circle r={10} fill={C.blueLight} stroke={C.ink} strokeWidth={3} />
          <line x1={0} y1={0} x2={0} y2={-8} stroke={C.ink} strokeWidth={3} strokeLinecap="round" transform={`rotate(${ang})`} />
          <line x1={0} y1={0} x2={0} y2={-8} stroke={C.ink} strokeWidth={3} strokeLinecap="round" transform={`rotate(${ang + 120})`} />
          <line x1={0} y1={0} x2={0} y2={-8} stroke={C.ink} strokeWidth={3} strokeLinecap="round" transform={`rotate(${ang + 240})`} />
        </svg>
      ))}
    </>
  );
};

export const FloorBand: React.FC = () => (
  <div style={{position: 'absolute', left: -3000, top: BELT.floor, width: 7000, height: 2400, background: C.paperDeep, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 30, height: 10, background: C.paperLine, opacity: 0.7}} />
  </div>
);

/* ------------------------------------------------------------------ wall (background layer) */
export const WallArt: React.FC = () => {
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 150; i++) {
    const r = (s: number) => {
      const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    dots.push(<circle key={i} cx={-1800 + r(1) * 5200} cy={-1200 + r(2) * 2400} r={3 + r(3) * 6} fill={C.blue} opacity={0.22} />);
  }
  return (
    <>
      <div style={{position: 'absolute', left: -4000, top: -4000, width: 10000, height: 9000, background: C.blueLight}} />
      <svg width={5200} height={2400} viewBox="-1800 -1200 5200 2400" style={{position: 'absolute', left: -1800, top: -1200}}>
        {dots}
      </svg>
      {/* a pipe run along the upper wall */}
      <div style={{position: 'absolute', left: -2000, top: 96, width: 5600, height: 26, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13, boxSizing: 'border-box', opacity: 0.9}} />
      {[-1400, -620, 260, 1500, 2300].map((x) => (
        <div key={x} style={{position: 'absolute', left: x, top: 90, width: 18, height: 38, background: C.blueDeep, border: `3px solid ${C.ink}`, borderRadius: 4, boxSizing: 'border-box'}} />
      ))}
      {/* a row of high windows under the pipe (calm, wall-toned: environment, not information) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{position: 'absolute', left: -780 + i * 250, top: 138, width: 210, height: 92, background: '#EDF3FD', border: `5px solid ${C.blue}`, borderRadius: 10, boxSizing: 'border-box', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 98, top: 0, width: 5, height: 92, background: C.blue}} />
          <div style={{position: 'absolute', left: 30 + (i % 2) * 20, top: -20, width: 22, height: 140, background: 'rgba(255,255,255,0.9)', transform: 'rotate(28deg)'}} />
          <div style={{position: 'absolute', left: 62 + (i % 2) * 20, top: -20, width: 9, height: 140, background: 'rgba(255,255,255,0.9)', transform: 'rotate(28deg)'}} />
        </div>
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ s11 readout cards */
export const CARD = {w: 520, h: 140, h2: 200, outX: -330, inX: 320, y: [252, 410]};

export const ReadoutCard: React.FC<{
  x: number;
  y: number;
  label: string;
  labelColor: string;
  head: React.ReactNode;
  border: string;
  right?: React.ReactNode;
  sx?: number;
  sy?: number;
  h?: number;
}> = ({x, y, label, labelColor, head, border, right, sx = 1, sy = 1, h = CARD.h}) => (
  <div style={{position: 'absolute', left: x, top: y, width: CARD.w, height: h, transform: `scale(${sx}, ${sy})`, transformOrigin: '50% 50%'}}>
    <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE}px solid ${border}`, borderRadius: 18, boxShadow: `6px 8px 0 ${C.shadow}`, boxSizing: 'border-box'}} />
    <div style={{position: 'absolute', left: 24, top: 18, fontFamily: F.body, fontWeight: 800, fontSize: 25, letterSpacing: '0.05em', color: labelColor, whiteSpace: 'nowrap'}}>{label}</div>
    <div style={{position: 'absolute', left: 24, top: 56, fontFamily: F.display, fontWeight: 600, fontSize: 37, lineHeight: '48px', color: C.ink, whiteSpace: 'nowrap'}}>{head}</div>
    {right}
  </div>
);

/* ------------------------------------------------------------------ s12 add-on modules */
export const MOD = {w: 296, h: 128, top: 22, xs: [247, 547, 847], font: 40};
export const MODULES = [
  {l1: 'Instruction', l2: 'training', band: C.teal},
  {l1: 'Step-by-step', l2: 'reasoning', band: C.saffron},
  {l1: 'Web search', l2: '(sometimes)', band: C.coral},
];

export const Module: React.FC<{i: number; x: number; y: number; sx: number; sy: number; lamp: number}> = ({i, x, y, sx, sy, lamp}) => {
  const m = MODULES[i];
  return (
    <div style={{position: 'absolute', left: x, top: y, width: MOD.w, height: MOD.h, transform: `scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}}>
      {/* lamp on the lid */}
      <div style={{position: 'absolute', left: MOD.w / 2 - 15, top: -16, width: 30, height: 22, borderRadius: '15px 15px 4px 4px', background: mix('#2C3D5A', C.saffronLight, lamp), border: `3px solid ${C.ink}`, boxSizing: 'border-box', boxShadow: lamp > 0.05 ? `0 0 ${22 * lamp}px ${7 * lamp}px rgba(255,214,102,${0.85 * lamp})` : undefined}} />
      <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 16, boxSizing: 'border-box', overflow: 'hidden', boxShadow: `5px 6px 0 ${C.shadow}`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: m.band, borderBottom: `3px solid ${C.ink}`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 22, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: MOD.font, lineHeight: '46px', color: C.ink, whiteSpace: 'nowrap', letterSpacing: '-0.01em'}}>
        <div>{m.l1}</div>
        <div style={{color: i === 2 ? C.inkSoft : C.ink}}>{m.l2}</div>
      </div>
    </div>
  );
};

/** A small clamp bracket on the roof (pops up on "add more on top"). */
export const Bracket: React.FC<{x: number; up: number; clamp: number; flip?: boolean}> = ({x, up, clamp, flip}) => (
  <div style={{position: 'absolute', left: x - 20, top: M.headTop - 24 * up, width: 40, height: 28, transform: `scaleX(${flip ? -1 : 1}) rotate(${(1 - clamp) * -28}deg)`, transformOrigin: '50% 100%'}}>
    <div style={{position: 'absolute', inset: 0, background: C.blueDeep, border: `4px solid ${C.ink}`, borderRadius: '8px 8px 0 0', boxSizing: 'border-box'}} />
    <div style={{position: 'absolute', left: 12, top: 7, width: 11, height: 11, borderRadius: 6, background: C.blueLight}} />
  </div>
);
