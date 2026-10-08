import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';

/**
 * S9's evidence-checking machine, drawn in world space (depth-1 plane) as plain cutout shapes:
 * a control console at the left (lever, name plate, CLAIM IN), a long belt, and two booths — ① the lookup gate with
 * its ARCHIVE and record slot, ② the comparison gate with its scanner gantry and verdict plates.
 * Every moving part takes its state as a number from the scene, so the scene owns all timing.
 */

export const FLOOR_Y = 1160;
export const BELT_Y = 960;
export const BELT_H = 40;
export const BELT_X0 = 300;
export const MACHINE_X0 = -20;
export const MACHINE_X1 = 3900;
export const RAIL_Y = 112;
export const SIGN_Y = 152;
export const SIGN_H = 122;
export const SIGN_FONT_PX = 86; // ≥ 46 px on screen in the two-gate wide (zoom 0.545)
export const GANTRY_Y = 388;
export const HEAD_H = 54;
export const LENS_Y = GANTRY_Y + 12 + HEAD_H; // where a beam leaves a scan head

const box = (x: number, y: number, w: number, h: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box'});

/* ------------------------------------------------------------------ room */
export const RoomWall: React.FC = () => (
  <div style={{position: 'absolute', left: -3000, top: -3000, width: 10000, height: 7000, background: C.blueLight}}>
    <svg width={10000} height={7000} style={{position: 'absolute', left: 0, top: 0}}>
      {Array.from({length: 260}).map((_, i) => (
        <circle key={i} cx={rand(i * 3 + 11) * 10000} cy={rand(i * 5 + 7) * 7000} r={4 + rand(i * 9 + 1) * 6} fill={C.blue} opacity={0.22} />
      ))}
    </svg>
    {/* a long pipe run along the top of the room, with two drops */}
    <div style={box(3000 - 600, 3000 - 330, 6000, 34)}>
      <div style={{position: 'absolute', inset: 0, background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 17}} />
    </div>
    {[3000 + 2330, 3000 + 4300].map((x) => (
      <div key={x} style={{...box(x, 3000 - 310, 30, 300), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 15}} />
    ))}
  </div>
);

export const RoomFloor: React.FC = () => (
  <div style={{position: 'absolute', left: -2000, top: FLOOR_Y, width: 8000, height: 1400, background: C.paperDeep, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 30, height: 10, background: C.paperLine, opacity: 0.7}} />
  </div>
);

/* ------------------------------------------------------------------ belt and the machine body */
/** The belt band across the top of the machine (its cleats move with `pos`), and the front panel under it.
 *  `wave(x)` 0..1 is the power-on state of the front lamp at x; `blink(i)` adds a little idle life. */
export const MachineFront: React.FC<{pos: number; lampOn: (x: number) => number; g: number; nudge?: number; seams: number[]; skip?: [number, number][]; x1?: number}> = ({pos, lampOn, g, nudge = 0, seams, skip = [], x1 = MACHINE_X1}) => {
  const cleats: number[] = [];
  const step = 56;
  for (let x = BELT_X0 + 30 + (((pos % step) + step) % step); x < x1 - 30; x += step) cleats.push(x);
  const lamps: number[] = [];
  for (let x = 920; x < x1 - 60; x += 130) if (!skip.some(([a, b]) => x > a - 30 && x < b + 30)) lamps.push(x);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${nudge}px)`}}>
      {/* console top (left of the belt) */}
      <div style={{...box(MACHINE_X0, BELT_Y - 6, BELT_X0 - MACHINE_X0 + 20, BELT_H + 6), background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '10px 0 0 0'}} />
      {/* belt */}
      <div style={{...box(BELT_X0, BELT_Y, x1 - BELT_X0, BELT_H), background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 20, overflow: 'hidden'}}>
        {cleats.map((x) => (
          <div key={x} style={{position: 'absolute', left: x - BELT_X0, top: 4, width: 6, height: BELT_H - 16, borderRadius: 3, background: C.inkMuted}} />
        ))}
      </div>
      {[BELT_X0 + 20, x1 - 20].map((x) => (
        <div key={x} style={{...box(x - 15, BELT_Y + 5, 30, 30), borderRadius: 15, background: C.blue, border: `3px solid ${C.ink}`}} />
      ))}
      {/* front panel */}
      <div style={{...box(MACHINE_X0, BELT_Y + BELT_H - 4, x1 - MACHINE_X0, FLOOR_Y - BELT_Y - BELT_H + 8), background: C.cream, border: `${OUTLINE}px solid ${C.ink}`}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: C.blue, borderTop: `${OUTLINE}px solid ${C.ink}`}} />
        {/* seams between sections */}
        {seams.map((x) => (
          <div key={x} style={{position: 'absolute', left: x - MACHINE_X0, top: 0, bottom: 26, width: 4, background: C.paperLine}} />
        ))}
      </div>
      {/* power lamps along the front panel */}
      {lamps.map((x, i) => {
        const on = lampOn(x);
        const tw = on > 0.5 ? 0.82 + 0.18 * Math.sin(g * 0.11 + i * 1.7) : 0;
        return (
          <div key={x} style={{...box(x - 13, FLOOR_Y - 70, 26, 26), borderRadius: 13, border: `3px solid ${C.ink}`, background: on > 0.5 ? C.saffron : C.inkMuted, boxShadow: on > 0.5 ? `0 0 ${14 * tw}px ${4 * tw}px rgba(255,199,68,${0.55 * tw})` : 'none'}} />
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ console parts */
/** The console's name plate on the front panel: dark until the power comes on (with an honest fluorescent flicker). */
export const NamePlate: React.FC<{x: number; y: number; w: number; h: number; on: number}> = ({x, y, w, h, on}) => (
  <div style={{...box(x, y, w, h), borderRadius: 14, border: `${OUTLINE}px solid ${C.ink}`, background: on > 0 ? `rgba(255,251,240,${0.35 + 0.65 * on})` : '#4E5E67', boxShadow: on > 0 ? `0 0 ${34 * on}px ${8 * on}px rgba(28,167,160,${0.45 * on})` : 'none', overflow: 'hidden'}}>
    {on <= 0 && <div style={{position: 'absolute', inset: 0, background: '#4E5E67'}} />}
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: F.display, fontWeight: 700, fontSize: 46, letterSpacing: '0.05em', color: on > 0 ? C.tealDeep : '#5D6E78', textShadow: on > 0 ? `0 0 ${12 * on}px rgba(28,167,160,${0.6 * on})` : 'none', whiteSpace: 'nowrap'}}>
      EVIDENCE CHECK
    </div>
  </div>
);

/** A plain painted plate with an arrow. */
export const PaintedPlate: React.FC<{x: number; y: number; text: string; size?: number}> = ({x, y, text, size = 40}) => (
  <div style={{position: 'absolute', left: x, top: y, padding: `${size * 0.2}px ${size * 0.5}px`, background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 10, fontFamily: F.body, fontWeight: 900, fontSize: size, color: C.inkSoft, letterSpacing: '0.04em', whiteSpace: 'nowrap', lineHeight: 1}}>
    {text}
  </div>
);

/** The start lever on its pedestal. angle in degrees from vertical (clockwise +). Pivot at (x, y). */
export const Lever: React.FC<{x: number; y: number; len: number; angle: number; lamp: number}> = ({x, y, len, angle, lamp}) => {
  const r = (angle * Math.PI) / 180;
  const kx = x + Math.sin(r) * len;
  const ky = y - Math.cos(r) * len;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {/* pedestal */}
      <rect x={x - 46} y={y - 6} width={92} height={BELT_Y - y + 8} rx={10} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} />
      <circle cx={x + 26} cy={y + 18} r={9} fill={lamp > 0.5 ? C.teal : C.inkMuted} stroke={C.ink} strokeWidth={3} />
      {lamp > 0.5 && <circle cx={x + 26} cy={y + 18} r={16} fill="rgba(28,167,160,0.3)" />}
      {/* arm */}
      <line x1={x} y1={y} x2={kx} y2={ky} stroke={C.ink} strokeWidth={18 + OUTLINE * 2} strokeLinecap="round" />
      <line x1={x} y1={y} x2={kx} y2={ky} stroke={C.inkMuted} strokeWidth={18} strokeLinecap="round" />
      <circle cx={x} cy={y} r={17} fill={C.blueDeep} stroke={C.ink} strokeWidth={OUTLINE} />
      <circle cx={kx} cy={ky} r={21} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
      <circle cx={kx - 6} cy={ky - 7} r={5} fill={C.coralLight} />
    </svg>
  );
};

/* ------------------------------------------------------------------ booths */
export type BoothSpec = {x0: number; x1: number; n: number; question: string; signW: number};

/** Booth frame: back panel, pillars, header rail, number badge (lit 0..1) and the hinged question sign (flap: 0 =
 *  folded up and invisible … 1 = hanging; values in between are degrees from the scene's swing curve). */
export const Booth: React.FC<{spec: BoothSpec; badge: number; flapDeg: number; g: number; children?: React.ReactNode; leds?: number; mark?: {x: number; w: number; t: number}}> = ({spec, badge, flapDeg, g, children, leds = 0, mark}) => {
  const {x0, x1, n, question, signW} = spec;
  const w = x1 - x0;
  // centred in the booth, but never closer than 230 px to the left pillar (room for the number badge); booth ①'s sign
  // then keeps ≈ 100 px clear of the ARCHIVE chute on its right
  const signL = x0 + Math.max(230, (w - signW) / 2);
  const badgeX = signL - 74;
  return (
    <>
      {/* back panel */}
      <div style={{...box(x0 + 24, RAIL_Y + 30, w - 48, BELT_Y - RAIL_Y - 24), background: C.paper, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6}}>
        <div style={{position: 'absolute', left: 16, right: 16, top: 16, bottom: 16, border: `3px solid ${C.paperLine}`, borderRadius: 6}} />
      </div>
      {children}
      {/* pillars */}
      {[x0, x1 - 46].map((x, k) => (
        <div key={x} style={{...box(x, RAIL_Y + 10, 46, BELT_Y - RAIL_Y), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8}}>
          {[0, 1, 2].map((j) => {
            const on = leds > 0.5 && Math.floor((g + j * 23 + k * 41 + n * 17) / 37) % 3 !== 0;
            return <div key={j} style={{position: 'absolute', left: 12, top: 120 + j * 34, width: 14, height: 14, borderRadius: 7, border: `2px solid ${C.ink}`, background: on ? (j === 1 ? C.teal : C.saffron) : C.blueDeep}} />;
          })}
          {[0, 1].map((j) => (
            <div key={`r${j}`} style={{position: 'absolute', left: 15, top: BELT_Y - RAIL_Y - 120 + j * 50, width: 8, height: 8, borderRadius: 4, background: C.blueDeep}} />
          ))}
        </div>
      ))}
      {/* header rail */}
      <div style={{...box(x0 - 14, RAIL_Y, w + 28, 40), background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10}} />
      {/* number badge, hanging from the rail */}
      <div style={{position: 'absolute', left: badgeX - 4, top: RAIL_Y + 34, width: 8, height: 26, background: C.ink}} />
      <div
        style={{
          ...box(badgeX - 50, SIGN_Y + 6, 100, 100),
          borderRadius: 50,
          border: `${OUTLINE}px solid ${C.ink}`,
          background: badge > 0 ? C.teal : C.inkSoft,
          boxShadow: badge > 0 ? `0 0 ${26 * badge}px ${8 * badge}px rgba(28,167,160,${0.5 * badge})` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 60,
          color: badge > 0 ? C.white : C.inkMuted,
          transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, badge) * Math.PI)})`,
        }}
      >
        {n}
      </div>
      {/* the question sign: hinged at its top edge under the rail */}
      {flapDeg < 88 && (
        <div style={{position: 'absolute', left: signL, top: SIGN_Y, width: signW, height: SIGN_H, perspective: 1400, perspectiveOrigin: '50% -200px'}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: '50% 0%',
              transform: `rotateX(${flapDeg}deg)`,
              background: C.cream,
              border: `${OUTLINE}px solid ${C.ink}`,
              borderRadius: 14,
              boxShadow: `6px 8px 0 ${C.shadow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.body,
              fontWeight: 800,
              fontSize: SIGN_FONT_PX,
              color: C.ink,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {question}
            {/* a marker stroke under one word of the question (x, w in px from the sign's inner left edge) */}
            {mark && mark.t > 0 && (
              <div style={{position: 'absolute', left: mark.x - 4, top: SIGN_H / 2 + SIGN_FONT_PX * 0.4, width: (mark.w + 8) * Math.min(1, mark.t), height: 9, borderRadius: 5, background: C.saffronDeep, transform: 'rotate(-0.8deg)', transformOrigin: '0% 50%'}} />
            )}
          </div>
        </div>
      )}
      {/* two short hangers for the sign */}
      {[signL + 60, signL + signW - 68].map((x) => (
        <div key={x} style={{...box(x, RAIL_Y + 36, 8, SIGN_Y - RAIL_Y - 30), background: C.ink, borderRadius: 3}} />
      ))}
    </>
  );
};

/** A small rail for the scan heads. */
export const Gantry: React.FC<{x0: number; x1: number}> = ({x0, x1}) => (
  <div style={{...box(x0, GANTRY_Y, x1 - x0, 18), background: C.blueDeep, border: `3px solid ${C.ink}`, borderRadius: 9}} />
);

/** A scan head on the gantry, centred on x. on 0..1 lights its lens. */
export const ScanHead: React.FC<{x: number; on: number}> = ({x, on}) => (
  <div style={{...box(x - 62, GANTRY_Y + 8, 124, HEAD_H), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12}}>
    <div style={{position: 'absolute', left: 14, top: 10, width: 14, height: 14, borderRadius: 7, border: `2px solid ${C.ink}`, background: on > 0.5 ? C.saffron : C.blueDeep}} />
    <div style={{position: 'absolute', left: 30, right: 30, bottom: -10, height: 18, borderRadius: 9, border: `3px solid ${C.ink}`, background: on > 0 ? `rgba(255,233,168,${0.5 + 0.5 * on})` : C.blueLight, boxShadow: on > 0 ? `0 0 ${18 * on}px ${6 * on}px rgba(255,199,68,${0.5 * on})` : 'none'}} />
  </div>
);

/** The light from a scan head onto a target box (world coords). Light, so it may fade. */
export const Beam: React.FC<{hx: number; tx0: number; ty0: number; tx1: number; ty1: number; on: number; tone?: number; id: string}> = ({hx, tx0, ty0, tx1, ty1, on, tone = 0, id}) => {
  if (on <= 0) return null;
  const col = tone > 0.5 ? '239,107,85' : '255,214,110';
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`rgb(${col})`} stopOpacity={0.05 * on} />
          <stop offset="1" stopColor={`rgb(${col})`} stopOpacity={0.3 * on} />
        </linearGradient>
      </defs>
      <polygon points={`${hx - 18},${LENS_Y} ${hx + 18},${LENS_Y} ${tx1 + 8},${ty1 + 6} ${tx0 - 8},${ty1 + 6}`} fill={`url(#${id})`} />
      <line x1={tx0 - 8} y1={ty1 + 6} x2={tx1 + 8} y2={ty1 + 6} stroke={`rgb(${col})`} strokeOpacity={0.8 * on} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

/** The result lamp of a gate, with its label plate. state: 0 idle, 1 asking (amber, blinking via `blink`), 2 yes, 3 no. */
export const GateLamp: React.FC<{x: number; y: number; state: number; blink?: number; pop?: number; flip?: number; on: number}> = ({x, y, state, blink = 1, pop = 0, flip = 1, on}) => {
  const lit = on > 0.5;
  const col = state === 2 ? C.teal : state === 3 ? C.coral : state === 1 ? C.saffron : C.saffronLight;
  const glow = state === 2 ? '28,167,160' : state === 3 ? '239,107,85' : '255,199,68';
  const bright = !lit ? 0 : state === 0 ? 0.25 : state === 1 ? blink : 1;
  const glyph = state === 2 ? '✓' : state === 3 ? '≠' : state === 1 ? '?' : '';
  const label = state === 2 ? 'YES' : state === 3 ? 'NO' : '?';
  const s = 1 + 0.16 * pop;
  return (
    <>
      {/* bracket */}
      <div style={{...box(x - 8, y + 50, 16, 70), background: C.blueDeep, border: `3px solid ${C.ink}`}} />
      <div style={{...box(x - 58, y - 58, 116, 116), borderRadius: 58, background: C.blueDeep, border: `${OUTLINE}px solid ${C.ink}`}} />
      <div
        style={{
          ...box(x - 46, y - 46, 92, 92),
          borderRadius: 46,
          border: `3px solid ${C.ink}`,
          background: bright > 0 ? col : '#5D6E78',
          opacity: 1,
          boxShadow: bright > 0.3 ? `0 0 ${40 * bright}px ${14 * bright}px rgba(${glow},${0.55 * bright})` : 'none',
          transform: `scale(${s})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 62,
          color: C.white,
          lineHeight: 1,
        }}
      >
        <span style={{opacity: bright > 0.3 ? 1 : 0.0}}>{glyph}</span>
        <div style={{position: 'absolute', left: 16, top: 12, width: 22, height: 14, borderRadius: 8, background: 'rgba(255,255,255,0.55)', transform: 'rotate(-25deg)'}} />
      </div>
      {/* label plate (flips when the answer comes in) */}
      <div style={{...box(x - 74, y + 112, 148, 64), perspective: 600}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 12, border: `${OUTLINE}px solid ${C.ink}`, background: state === 2 ? C.teal : state === 3 ? C.coral : C.cream, color: state >= 2 ? C.white : C.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 46, letterSpacing: '0.06em', lineHeight: 1, transform: `scaleY(${Math.max(0.05, Math.abs(flip))})`}}>
          {label}
        </div>
      </div>
    </>
  );
};

/** The record slot of gate ①: an opening the retrieved record is fed out of, with a little "searching" lamp. */
export const RecordSlot: React.FC<{x: number; y: number; w: number; search: number; lip: number}> = ({x, y, w, search, lip}) => (
  <>
    <div style={{...box(x - w / 2 - 16, y - 18, w + 32, 34), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10}} />
    <div style={{...box(x - w / 2, y - 4, w, 12), background: C.ink, borderRadius: 4}} />
    {/* the slot's flap: kicks out as paper passes */}
    <div style={{...box(x - w / 2 + 6, y + 6, w - 12, 10), background: C.blueDeep, border: `3px solid ${C.ink}`, borderRadius: 4, transformOrigin: '50% 0%', transform: `rotateX(${-lip * 60}deg)`}} />
    <div style={{...box(x + w / 2 + 26, y - 14, 26, 26), borderRadius: 13, border: `3px solid ${C.ink}`, background: search > 0.5 ? C.saffron : C.blueDeep, boxShadow: search > 0.5 ? '0 0 14px 5px rgba(255,199,68,0.6)' : 'none'}} />
  </>
);

/** The ARCHIVE cabinet over gate ①: rows of record drawers; `pull` slides one drawer out. */
export const Archive: React.FC<{x: number; w: number; top: number; bottom: number; pull: number; lit: number}> = ({x, w, top, bottom, pull, lit}) => {
  const cols = 4;
  const rows = 6;
  const dw = (w - 60) / cols;
  const dh = (bottom - top - 140) / rows;
  return (
    <div style={{...box(x - w / 2, top, w, bottom - top), background: C.wood, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12}}>
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((__, c) => {
          const active = r === rows - 1 && c === 2;
          const dy = active ? pull * 22 : 0;
          return (
            <div key={`${r}-${c}`} style={{...box(30 + c * dw + 6, 24 + r * dh + 6, dw - 12, dh - 12), background: C.woodLight, border: `3px solid ${C.ink}`, borderRadius: 6, transform: `translateY(${dy}px) scale(${1 + 0.04 * pull})`}}>
              <div style={{position: 'absolute', left: '50%', top: '26%', width: 50, height: 14, marginLeft: -25, background: C.cream, border: `2px solid ${C.ink}`, borderRadius: 2}} />
              <div style={{position: 'absolute', left: '50%', bottom: '18%', width: 36, height: 10, marginLeft: -18, background: C.saffronDeep, border: `2px solid ${C.ink}`, borderRadius: 4}} />
            </div>
          );
        }),
      )}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center'}}>
        <span style={{display: 'inline-block', padding: '8px 30px', background: lit > 0.5 ? C.cream : C.paperDeep, border: `3px solid ${C.ink}`, borderRadius: 10, fontFamily: F.display, fontWeight: 700, fontSize: 56, letterSpacing: '0.08em', color: C.ink, lineHeight: 1}}>ARCHIVE</span>
      </div>
    </div>
  );
};

/** A verdict window in the machine's front panel: a hinged card that flips over (flipDeg 0 = blank face, 180 = the
 *  verdict face), like a split-flap indicator. */
export const VerdictWindow: React.FC<{cx: number; y: number; w: number; h: number; text: string; tone: 'teal' | 'coral'; flipDeg: number}> = ({cx, y, w, h, text, tone, flipDeg}) => {
  const bg = tone === 'teal' ? C.teal : C.coral;
  const deep = tone === 'teal' ? C.tealDeep : C.coralDeep;
  const front = flipDeg < 90;
  const a = front ? flipDeg : flipDeg - 180;
  return (
    <div style={{...box(cx - w / 2 - 12, y - 10, w + 24, h + 20), background: front ? C.paperDeep : C.blueDeep, border: `${front ? 3 : OUTLINE}px solid ${front ? C.paperLine : C.ink}`, borderRadius: 14}}>
      <div style={{position: 'absolute', left: 8, top: 6, right: 8, bottom: 6, perspective: 900}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${a}deg)`,
            transformOrigin: '50% 50%',
            borderRadius: 10,
            border: `3px solid ${front ? C.paperLine : C.ink}`,
            background: front ? C.paper : bg,
            boxShadow: front ? 'none' : `inset 0 -7px 0 ${deep}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 50,
            color: C.white,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {front ? <div style={{width: '64%', height: 4, background: C.paperLine, borderRadius: 2}} /> : text}
        </div>
      </div>
    </div>
  );
};

/** A painted outline on a booth's back panel showing where a document stands (covered once the document is there). */
export const SlotOutline: React.FC<{x0: number; y0: number; x1: number; y1: number; label: string}> = ({x0, y0, x1, y1, label}) => (
  <div style={{...box(x0, y0, x1 - x0, y1 - y0), border: `4px dashed rgba(111,133,144,0.45)`, borderRadius: 12}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 18, textAlign: 'center', fontFamily: F.display, fontWeight: 600, fontSize: 44, letterSpacing: '0.12em', color: 'rgba(111,133,144,0.5)', lineHeight: 1}}>{label}</div>
  </div>
);

/** The chute from the ARCHIVE down to the record slot; `chase` 0..1 runs a light down its windows (a lookup). */
export const Chute: React.FC<{x: number; top: number; bottom: number; chase: number}> = ({x, top, bottom, chase}) => {
  const n = 4;
  const wins = Array.from({length: n}, (_, i) => top + 60 + ((bottom - top - 120) * i) / (n - 1));
  return (
    <>
      <div style={{...box(x - 26, top, 52, bottom - top), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10}} />
      {wins.map((y, i) => {
        const on = chase > 0 && chase < 1 && Math.abs(chase * n - i - 0.5) < 0.7;
        return <div key={i} style={{...box(x - 12, y - 12, 24, 24), borderRadius: 12, border: `3px solid ${C.ink}`, background: on ? C.saffron : C.blueDeep, boxShadow: on ? '0 0 14px 5px rgba(255,199,68,0.6)' : 'none'}} />;
      })}
    </>
  );
};

/** Pencil cup on the console (an unglamorous desk). */
export const PencilCup: React.FC<{x: number; y: number}> = ({x, y}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
    <g transform={`translate(${x} ${y})`}>
      <rect x={-4} y={-92} width={10} height={60} rx={3} fill={C.saffron} stroke={C.ink} strokeWidth={3} transform="rotate(-12)" />
      <rect x={6} y={-86} width={10} height={54} rx={3} fill={C.coral} stroke={C.ink} strokeWidth={3} transform="rotate(10)" />
      <rect x={-26} y={-44} width={52} height={44} rx={6} fill={C.tealLight} stroke={C.ink} strokeWidth={OUTLINE} />
    </g>
  </svg>
);
