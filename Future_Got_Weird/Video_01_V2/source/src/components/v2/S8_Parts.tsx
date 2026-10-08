import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {DrawBox} from './DrawBox';

/**
 * S8 — "What helps" — the props of the machine room, drawn flat and positioned in WORLD px (the scene's camera does
 * the framing). All of them are pure presentation: the scene passes every animated value in.
 *
 * Room layout (world, subject plane):
 *   ASSEMBLY (the answer-writing machine, randomness dial, output tunnel) .... x 100–600
 *   the output belt, where the re-run slips stand ............................ x 600–1600
 *   EVIDENCE CHECK booth (shut, as in S2) ..................................... x 1600–2020
 *   the retrieval rail, off to the right ...................................... x 2020 →
 *   bench top (belt / rail) y 724, apron 752–830, floor from 830.
 */

/* ------------------------------------------------------------------ geometry */
export const BENCH_Y = 724;
export const BELT_H = 28;
export const FLOOR_Y = 830;
export const ASM = {x0: 100, x1: 600, y0: 270, y1: BENCH_Y};
/** dial centre (world) and face radius */
export const DIAL = {x: 320, y: 470, r: 96};
/** output tunnel on ASSEMBLY's front, bottom right */
export const MOUTH = {x0: 500, x1: 600, y0: 500, y1: BENCH_Y};
export const BOOTH = {x0: 1600, x1: 2020, y0: 240, y1: BENCH_Y, head: 76};
/** the booth window (outer edge of its frame) */
export const WIN = {x0: 1622, x1: 1998, y0: 340, y1: 620};
/** the real record card: image 334 wide, 8 px paper margin, 3 px outline */
export const REC = {img: 334, pad: 8, border: 3, w: 356, h: 164};
export const REC_IMG_H = (REC.img * 1386) / 3264;
export const REC_IN = {x: 1632, y: 352};
export const CART_DOCK_X = 2032;
export const CART_W = 380;
export const REC_ON_CART_DX = 12;
/** slips are visible only inside the lane (they are hidden inside the machine until they come out of the tunnel) */
export const LANE = {x0: MOUTH.x0, x1: 1600};
export const SLIP = {w: 220, h: 186};
export const SLIP_PARK = 390; // centre while it waits inside the machine (fully hidden)
export const SLIP_OUT = 800; // centre after it has been pushed out onto the belt
export const PITCH = 310; // one belt index
/** the thought bubble: one line tall (h1) while the steps write on, full height (h) once the hedge flips in.
 *  Its top sits clear of the pipe in every framing it is seen in. */
/** bubble layout: three step lines in a staircase, then the hedge chip */
export const BUB = {padT: 18, padX: 34, line: 58, stepDx: 205, chipGap: 14, chip: 84, padB: 18};
const bubH = (lines: number, chip: number) => OUTLINE * 2 + BUB.padT + lines * BUB.line + chip * (BUB.chipGap + BUB.chip) + BUB.padB;
export const BUBBLE = {x: 660, y: 180, w: 830, h1: bubH(1, 0), h3: bubH(3, 0), h: bubH(3, 1)};
export const PUFF = {x: 572, y: 232};
export const NOG = {x: 1110, y: 398};
export const PLATE_Y = 762; // the 58 px plate sits centred in the apron band (belt bottom 752, floor line 830): no tangents

const box = (x: number, y: number, w: number, h: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box'});

/* ------------------------------------------------------------------ the room (wall layer) */
/** Blue machine-room wall (same room as S3 / S9): dots, a pipe run along the top with brackets. Layer coordinates. */
export const S8Wall: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -3000, top: -2500, width: 9000, height: 6000, background: C.blueLight}} />
    <svg width={5200} height={2400} viewBox="-1400 -800 5200 2400" style={{position: 'absolute', left: -1400, top: -800}}>
      {Array.from({length: 170}).map((_, i) => (
        <circle key={i} cx={-1400 + rand(i * 3 + 11) * 5200} cy={-800 + rand(i * 5 + 7) * 2400} r={3 + rand(i * 9 + 1) * 6} fill={C.blue} opacity={0.24} />
      ))}
    </svg>
    <div style={{...box(-2000, 92, 7000, 26), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13}} />
    {[-760, -380, 0, 380, 760, 1140, 1520, 1900, 2280, 2660, 3040].map((x) => (
      <div key={x} style={{...box(x + 170, 84, 18, 42), background: C.blueDeep, border: `3px solid ${C.ink}`, borderRadius: 4}} />
    ))}
  </>
);

/* ------------------------------------------------------------------ bench, floor */
/** Floor, apron and the bench top: an output belt on the left (cleats move with `beltPos`), a rail on the right. */
export const S8Bench: React.FC<{beltPos: number}> = ({beltPos}) => (
  <>
    <div style={{...box(-2500, FLOOR_Y, 8000, 1400), background: C.paperDeep, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 30, height: 10, background: C.paperLine, opacity: 0.8}} />
    </div>
    <div style={{...box(-2500, BENCH_Y + BELT_H - 2, 8000, FLOOR_Y - BENCH_Y - BELT_H + 2), background: C.blueDeep, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
      {Array.from({length: 26}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: i * 320 + 40, top: 0, width: 3, height: '100%', background: 'rgba(22,42,50,0.35)'}} />
      ))}
      {Array.from({length: 26}).map((_, i) => (
        <div key={`b${i}`} style={{position: 'absolute', left: i * 320 + 64, top: 14, width: 10, height: 10, borderRadius: 5, background: C.blue, border: `2px solid ${C.ink}`}} />
      ))}
    </div>
    {/* the belt (left of the booth) */}
    <div style={{...box(-2500, BENCH_Y, 2500 + BOOTH.x0 + 20, BELT_H), background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 14, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, ${C.inkMuted} 0 7px, transparent 7px 44px)`, backgroundPosition: `${beltPos + 2500}px 0`, top: 4, bottom: 4, opacity: 0.9}} />
    </div>
    {/* the rail (right of the booth): steel top, sleepers */}
    <div style={{...box(BOOTH.x1 - 20, BENCH_Y, 4000, BELT_H), background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 14, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 7, background: C.inkMuted}} />
      {Array.from({length: 60}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 30 + i * 64, top: 9, width: 22, height: 12, borderRadius: 3, background: C.ink, opacity: 0.55}} />
      ))}
    </div>
  </>
);

/* ------------------------------------------------------------------ ASSEMBLY */
export type AsmState = {
  needle: number; // 0 (LOW) .. 1 (HIGH)
  vib: [number, number];
  squash: number; // scaleY about the base (shrug), 1 = rest
  led: number; // status LED 0..1
  mouthLamp: number; // 0..1
  turned: number; // "turned down" tag scale-in 0..1 (may overshoot)
  glint: number; // a shine sweeping the dial face 0..1
};

export const S8Assembly: React.FC<{s: AsmState}> = ({s}) => {
  const ang = -135 + s.needle * 270;
  const lx = DIAL.x - ASM.x0;
  const ly = DIAL.y - ASM.y0;
  const W = ASM.x1 - ASM.x0;
  const H = ASM.y1 - ASM.y0;
  const mx = MOUTH.x0 - ASM.x0;
  const my = MOUTH.y0 - ASM.y0;
  const endLabel = (txt: string, a: number) => {
    const r = DIAL.r + 40;
    const x = lx + Math.sin((a * Math.PI) / 180) * r;
    const y = ly - Math.cos((a * Math.PI) / 180) * r;
    return (
      <div style={{position: 'absolute', left: x - 50, top: y - 13, width: 100, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 22, lineHeight: '26px', color: C.cream, letterSpacing: '0.06em'}}>{txt}</div>
    );
  };
  return (
    <div style={{position: 'absolute', left: ASM.x0, top: ASM.y0, width: W, height: H, transform: `translate(${s.vib[0]}px, ${s.vib[1]}px) scaleY(${s.squash})`, transformOrigin: '50% 100%'}}>
      <div style={{...box(0, 0, W, H), background: C.blue, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '24px 24px 6px 6px', boxShadow: `8px 10px 0 ${C.shadow}`}} />
      {/* panel seam */}
      <div style={{position: 'absolute', left: 18, right: 18, top: 70, height: 3, background: C.blueDeep, borderRadius: 2}} />
      <div style={{position: 'absolute', left: 26, top: 16, fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.white, letterSpacing: '0.04em', lineHeight: '40px'}}>ASSEMBLY</div>
      {/* status LED */}
      <div style={{...box(W - 52, 22, 22, 22), borderRadius: 11, background: s.led > 0.5 ? C.saffron : C.blueDeep, border: `3px solid ${C.ink}`, boxShadow: s.led > 0.5 ? `0 0 12px 3px rgba(255,199,68,0.7)` : 'none'}} />
      {/* the randomness dial */}
      <svg viewBox="-140 -140 280 280" width={280} height={280} style={{position: 'absolute', left: lx - 140, top: ly - 140, overflow: 'visible'}}>
        <circle r={DIAL.r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        {/* coloured zones: calm (teal) at the LOW end, wild (coral) at the HIGH end */}
        <path d={arc(-135, -75, 84)} fill="none" stroke={C.teal} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        <path d={arc(75, 135, 84)} fill="none" stroke={C.coral} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        {Array.from({length: 11}).map((_, i) => {
          const a = ((-135 + i * 27) * Math.PI) / 180;
          const r0 = i === 0 || i === 10 ? 64 : 70;
          return <line key={i} x1={Math.sin(a) * r0} y1={-Math.cos(a) * r0} x2={Math.sin(a) * 78} y2={-Math.cos(a) * 78} stroke={i === 0 || i === 10 ? C.ink : C.inkMuted} strokeWidth={i === 0 || i === 10 ? 5 : 3} strokeLinecap="round" />;
        })}
        <g transform={`rotate(${ang})`}>
          <path d="M -6 -40 L 0 -88 L 6 -40 Z" fill={C.coral} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <circle r={52} fill={C.blueDeep} stroke={C.ink} strokeWidth={OUTLINE} />
          {Array.from({length: 14}).map((_, i) => (
            <rect key={i} x={-3.5} y={-50} width={7} height={11} rx={2} fill={C.blueLight} opacity={0.9} transform={`rotate(${i * (360 / 14)})`} />
          ))}
          <line x1={0} y1={-8} x2={0} y2={-36} stroke={C.cream} strokeWidth={9} strokeLinecap="round" />
        </g>
        <circle r={9} fill={C.ink} />
        {s.glint > 0 && s.glint < 1 && (
          <>
            <defs>
              <clipPath id="s8-dial-face">
                <circle r={DIAL.r - 2} />
              </clipPath>
            </defs>
            {/* a sheen sweeping across the glass */}
            <g clipPath="url(#s8-dial-face)">
              <rect x={-150 + s.glint * 300 - 22} y={-160} width={44} height={320} fill={C.white} opacity={0.75} transform="rotate(28)" />
              <rect x={-150 + s.glint * 300 + 30} y={-160} width={12} height={320} fill={C.white} opacity={0.6} transform="rotate(28)" />
            </g>
            <path d={arc(-150 + s.glint * 300, -100 + s.glint * 300, 91)} fill="none" stroke={C.white} strokeWidth={8} strokeLinecap="round" opacity={Math.sin(s.glint * Math.PI)} />
          </>
        )}
      </svg>
      {endLabel('LOW', -135)}
      {endLabel('HIGH', 135)}
      <div style={{position: 'absolute', left: lx - 150, width: 300, top: ly + DIAL.r + 30, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 34, lineHeight: '40px', color: C.cream}}>randomness</div>
      {s.turned > 0 && (
        <div style={{position: 'absolute', left: lx - 150, width: 300, top: ly + DIAL.r + 80, textAlign: 'center', transform: `scale(${s.turned})`, transformOrigin: '50% 50%'}}>
          <span style={{display: 'inline-block', padding: '5px 18px', borderRadius: 10, background: C.tealDeep, border: `3px solid ${C.ink}`, fontFamily: F.body, fontWeight: 800, fontSize: 30, lineHeight: '34px', color: C.white}}>turned down</span>
        </div>
      )}
      {/* the output tunnel: a dark opening the belt runs out of */}
      <div style={{...box(mx, my, MOUTH.x1 - MOUTH.x0 + OUTLINE, MOUTH.y1 - MOUTH.y0 + 2), background: C.ink, borderRadius: '14px 0 0 0'}}>
        <div style={{position: 'absolute', left: 8, right: 0, top: 8, bottom: 0, background: '#24394A', borderRadius: '10px 0 0 0'}} />
      </div>
      {/* lamp over the tunnel */}
      <div style={{...box(mx + 36, my - 34, 26, 26), borderRadius: 13, background: s.mouthLamp > 0.5 ? C.saffron : C.blueDeep, border: `3px solid ${C.ink}`, boxShadow: s.mouthLamp > 0.5 ? `0 0 ${14 * s.mouthLamp}px ${5 * s.mouthLamp}px rgba(255,199,68,0.75)` : 'none'}} />
    </div>
  );
};

/** svg arc path on a circle of radius r between two dial angles (degrees, 0 = up, clockwise) */
const arc = (a0: number, a1: number, r: number) => {
  const p = (a: number) => `${(Math.sin((a * Math.PI) / 180) * r).toFixed(2)} ${(-Math.cos((a * Math.PI) / 180) * r).toFixed(2)}`;
  return `M ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
};

/** Rubber curtain strips hanging in the tunnel mouth, drawn over the slips. `swing[j]` degrees (negative = pushed out). */
export const S8Flaps: React.FC<{swing: number[]; vib: [number, number]}> = ({swing, vib}) => {
  const n = swing.length;
  const w = (MOUTH.x1 - MOUTH.x0 - 8) / n;
  return (
    <div style={{position: 'absolute', left: MOUTH.x0 + 8, top: MOUTH.y0 + 8, width: MOUTH.x1 - MOUTH.x0 - 8, height: MOUTH.y1 - MOUTH.y0 - 8, transform: `translate(${vib[0]}px, ${vib[1]}px)`, overflow: 'hidden'}}>
      {swing.map((a, j) => (
        <div key={j} style={{position: 'absolute', left: j * w + 1, top: -4, width: w - 2, height: MOUTH.y1 - MOUTH.y0 - 10, background: 'rgba(63,85,96,0.82)', borderLeft: `2px solid ${C.ink}`, borderRight: `2px solid ${C.ink}`, borderRadius: '0 0 6px 6px', transform: `rotate(${a}deg)`, transformOrigin: '50% 0%', boxSizing: 'border-box'}} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 10, background: C.ink}} />
    </div>
  );
};

/* ------------------------------------------------------------------ EVIDENCE CHECK booth */
export type BoothState = {
  open: number; // shutter 0 shut .. 1 rolled up
  dip: number; // extra shutter drop (anticipation) px
  rattle: number; // shutter x jitter px
  signRot: number; // CLOSED sign swing deg
  lamp: number; // 0 dark .. 1 teal
  glow: number; // lamp glow 0..1
  shake: number; // booth y nudge px
};

/** The booth from S2 (teal header, shut shutter with a CLOSED sign), now on the line. `children` render inside the
 *  window (clipped by it) in WORLD coordinates. */
export const S8Booth: React.FC<{s: BoothState; children?: React.ReactNode}> = ({s, children}) => {
  const W = BOOTH.x1 - BOOTH.x0;
  const H = BOOTH.y1 - BOOTH.y0;
  const wx = WIN.x0 - BOOTH.x0;
  const wy = WIN.y0 - BOOTH.y0;
  const ww = WIN.x1 - WIN.x0;
  const wh = WIN.y1 - WIN.y0;
  const sh = Math.max(0, wh * (1 - s.open) + s.dip); // shutter height
  const lampCol = s.lamp > 0.5 ? C.teal : C.inkMuted;
  return (
    <div style={{position: 'absolute', left: BOOTH.x0, top: BOOTH.y0, width: W, height: H, transform: `translateY(${s.shake}px)`}}>
      <div style={{...box(0, 0, W, H), background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '18px 18px 6px 6px', boxShadow: `8px 10px 0 ${C.shadow}`}} />
      <div style={{...box(0, 0, W, BOOTH.head), background: C.teal, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '18px 18px 0 0'}}>
        <div style={{position: 'absolute', left: 0, width: W - 50, top: 0, height: BOOTH.head - 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 38, color: C.white, letterSpacing: '0.02em'}}>EVIDENCE CHECK</div>
      </div>
      {/* status lamp in the header */}
      <div style={{...box(W - 46, 23, 28, 28), borderRadius: 14, background: lampCol, border: `3px solid ${C.ink}`, boxShadow: s.lamp > 0.5 && s.glow > 0 ? `0 0 ${18 * s.glow}px ${7 * s.glow}px rgba(225,255,250,0.95)` : 'none', transform: `scale(${1 + 0.18 * Math.max(0, s.glow - 0.7)})`}}>
        {s.lamp > 0.5 && <div style={{position: 'absolute', left: 4, top: 3, width: 8, height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.8)'}} />}
      </div>
      {/* window: content, then the roll-up shutter over it */}
      <div style={{...box(wx, wy, ww, wh), background: C.paperDeep, borderRadius: 10, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -WIN.x0, top: -WIN.y0}}>{children}</div>
        {sh > 0.5 && (
          <div style={{position: 'absolute', left: 0, top: 0, width: ww, height: sh, transform: `translateX(${s.rattle}px)`}}>
            <div style={{position: 'absolute', inset: 0, background: C.inkMuted}} />
            {Array.from({length: 12}).map((_, i) => {
              const y = sh - 26 - i * 25;
              return y > -6 ? <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 5, background: C.ink, opacity: 0.45}} /> : null;
            })}
            <div style={{position: 'absolute', left: 0, right: 0, top: sh - 9, height: 9, background: C.ink}} />
            {/* the CLOSED sign, hooked onto the shutter (rides up with it) */}
            <div style={{position: 'absolute', left: ww / 2, top: sh - 176, transform: `rotate(${s.signRot}deg)`, transformOrigin: '0px 0px'}}>
              <div style={{position: 'absolute', left: -2, top: -4, width: 8, height: 8, borderRadius: 4, background: C.ink}} />
              <div style={{position: 'absolute', left: -46, top: 4, width: 3, height: 34, background: C.ink, transform: 'rotate(54deg)', transformOrigin: '50% 0%'}} />
              <div style={{position: 'absolute', left: 44, top: 4, width: 3, height: 34, background: C.ink, transform: 'rotate(-54deg)', transformOrigin: '50% 0%'}} />
              <div style={{position: 'absolute', left: -78, top: 22, width: 156, background: C.coral, color: C.white, border: `3px solid ${C.ink}`, borderRadius: 8, padding: '4px 0', textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 34, lineHeight: '40px', boxSizing: 'border-box'}}>CLOSED</div>
            </div>
          </div>
        )}
      </div>
      <div style={{...box(wx, wy, ww, wh), border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10}} />
      {/* intake slit in the right-hand frame, at the record's height */}
      <div style={{...box(ww + wx + 5, REC_IN.y - BOOTH.y0 - 6, 9, REC.h + 12), background: C.ink, borderRadius: 4}} />
      {/* lower panel: two bolts and a bumper for the cart */}
      {[40, W - 52].map((x) => (
        <div key={x} style={{...box(x, H - 58, 14, 14), borderRadius: 7, background: C.paperLine, border: `2px solid ${C.ink}`}} />
      ))}
      <div style={{...box(W - 4, H - 66, 14, 34), background: C.ink, borderRadius: '0 6px 6px 0'}} />
    </div>
  );
};

/* ------------------------------------------------------------------ the retrieval cart */
/** A rolling stand that carries a document at the booth window's height. `x` is its left edge (world). */
export const S8Cart: React.FC<{x: number; wheel: number; bob: number}> = ({x, wheel, bob}) => {
  const wheelAt = (cx: number) => (
    <svg key={cx} viewBox="-30 -30 60 60" width={60} height={60} style={{position: 'absolute', left: cx - 30, top: BENCH_Y - 22 - 30, overflow: 'visible'}}>
      <circle r={22} fill={C.ink} />
      <circle r={13} fill={C.cream} stroke={C.ink} strokeWidth={2} />
      <g transform={`rotate(${wheel})`}>
        {[0, 120, 240].map((a) => (
          <line key={a} x1={0} y1={0} x2={0} y2={-12} stroke={C.ink} strokeWidth={4} strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={4} fill={C.ink} />
    </svg>
  );
  return (
    <div style={{position: 'absolute', left: x, top: 0, width: CART_W, height: 0}}>
      {wheelAt(58)}
      {wheelAt(CART_W - 58)}
      <div style={{position: 'absolute', left: 0, top: bob, width: CART_W, height: 0}}>
        {/* push handle */}
        <svg viewBox="0 0 60 120" width={60} height={120} style={{position: 'absolute', left: CART_W - 8, top: 556, overflow: 'visible'}}>
          <path d="M 4 92 L 30 92 L 44 14" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 4 92 L 30 92 L 44 14" fill="none" stroke={C.inkMuted} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <rect x={34} y={2} width={22} height={30} rx={8} fill={C.coral} stroke={C.ink} strokeWidth={3} transform="rotate(10 45 17)" />
        </svg>
        {/* posts and ledge */}
        {[70, CART_W - 84].map((px) => (
          <div key={px} style={{...box(px, 524, 14, 100), background: C.woodDeep, border: `3px solid ${C.ink}`}} />
        ))}
        <div style={{...box(6, 514, CART_W - 12, 14), background: C.woodDeep, border: `3px solid ${C.ink}`, borderRadius: 4}} />
        {/* base with the label */}
        <div style={{...box(0, 618, CART_W, 66), background: C.wood, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 32, letterSpacing: '0.06em', color: C.cream}}>RETRIEVAL</div>
        {/* front bumper */}
        <div style={{...box(-10, 632, 14, 34), background: C.ink, borderRadius: '6px 0 0 6px'}} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ the real record */
/** Kalai's actual thesis title block (real crop, shown as it is). `box` draws the teal evidence frame round the title. */
export const S8Record: React.FC<{box: number; clips?: boolean}> = ({box: boxT, clips}) => {
  const ix = REC.pad + REC.border;
  const t = {x0: ix + 0.095 * REC.img, x1: ix + 0.905 * REC.img, y0: ix + 0.075 * REC_IMG_H, y1: ix + 0.41 * REC_IMG_H};
  return (
    <div style={{position: 'relative', width: REC.w, height: REC.h}}>
      <div style={{...box(0, 0, REC.w, REC.h), background: C.white, border: `${REC.border}px solid ${C.ink}`, borderRadius: 6, boxShadow: `5px 6px 0 ${C.shadow}`, padding: REC.pad}}>
        <Img src={staticFile('img/thesis_title_block.png')} style={{width: REC.img, height: REC_IMG_H, display: 'block'}} />
      </div>
      <DrawBox t={boxT} x={t.x0 - 6} y={t.y0 - 5} w={t.x1 - t.x0 + 12} h={t.y1 - t.y0 + 10} tone="teal" width={4} round={8} seed={3} />
      {clips &&
        [30, REC.w - 58].map((x) => <div key={x} style={{...box(x, REC.h - 16, 28, 22), background: C.saffron, border: `3px solid ${C.ink}`, borderRadius: 4}} />)}
    </div>
  );
};

/* ------------------------------------------------------------------ the re-run slips */
/**
 * The ChatGPT answer from the cold open, printed again at low randomness. Same card language as the S1 slips
 * (components/v2/AnswerSlip: cream card, gold edge, ink outline), abbreviated so three fit side by side and stay
 * readable; each one is labelled as an illustrative re-run (these are not logged outputs).
 */
export const S8Slip: React.FC<{hl: number; hlYear?: number}> = ({hl, hlYear = 0}) => {
  const bg = C.saffronLight;
  const mark = (t: number): React.CSSProperties => ({
    backgroundImage: `linear-gradient(${bg}, ${bg})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${Math.max(0, Math.min(1, t)) * 100}% 100%`,
    boxShadow: t > 0.98 ? `inset 0 -4px 0 0 ${C.ink}` : 'none',
    borderRadius: 3,
    padding: '0 3px',
    margin: '0 -3px',
    WebkitBoxDecorationBreak: 'slice',
  });
  return (
    <div style={{...box(0, 0, SLIP.w, SLIP.h), background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 9, boxShadow: `5px 7px 0 ${C.shadow}`, padding: '10px 13px', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 6, right: 6, top: 6, bottom: 6, border: `2px solid ${C.saffronDeep}`, borderRadius: 5, opacity: 0.75}} />
      <div style={{position: 'relative', whiteSpace: 'nowrap', lineHeight: '24px'}}>
        <span style={{fontFamily: F.display, fontWeight: 600, fontSize: 22, color: C.ink}}>ChatGPT</span>
        <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 16, color: C.inkSoft}}> · GPT-4o</span>
      </div>
      <div style={{position: 'relative', fontFamily: F.body, fontWeight: 800, fontSize: 15, lineHeight: '18px', color: C.inkMuted, marginBottom: 4}}>illustrative re-run</div>
      <div style={{position: 'relative', fontFamily: F.serif, fontSize: 16.5, lineHeight: '20px', color: C.ink}}>
        <span style={mark(hl)}>“Boosting, Online Algorithms, and Other Topics in Machine Learning.”</span>
      </div>
      <div style={{position: 'relative', marginTop: 4, fontFamily: F.serif, fontWeight: 600, fontSize: 20, lineHeight: '24px', color: C.ink}}>
        <span style={mark(hlYear)}>2002</span> · CMU
      </div>
    </div>
  );
};

/** WRONG impression on a slip (slip-local, centred on (x, y)): at size 26 / −10° its box stays inside the gold inner
 *  border (no ink past the paper edge) and clear of the year. */
export const SLIP_STAMP = {x: 136, y: 138, size: 26};

/* ------------------------------------------------------------------ the reasoning bubble */
export const S8Bubble: React.FC<{steps: number[]; hedge: number; dotsRot: number; h: number}> = ({steps, hedge, dotsRot, h}) => {
  // each step writes on (left → right) one line lower and further right than the last: a staircase of reasoning
  const chunk = (txt: string, t: number, k: number, tail?: React.ReactNode) => (
    <span key={k} style={{position: 'absolute', left: BUB.padX + k * BUB.stepDx, top: BUB.padT + k * BUB.line, display: 'inline-block', clipPath: `inset(-10px ${(1 - Math.min(1, t)) * 100}% -10px 0)`, transform: `translateY(${(1 - Math.min(1, t)) * 6}px)`, whiteSpace: 'nowrap', lineHeight: `${BUB.line}px`}}>
      {txt}
      {tail}
    </span>
  );
  // the chip flips down into place (rotateX 90 → 0, with an overshoot fed in by the scene)
  const rx = 90 * (1 - hedge);
  return (
    <div style={{...box(0, 0, BUBBLE.w, h), background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 34, boxShadow: `7px 9px 0 ${C.shadow}`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, fontFamily: F.body, fontWeight: 800, fontSize: 46, color: C.ink}}>
        {chunk('step 1 →', steps[0], 0)}
        {chunk('step 2 →', steps[1], 1)}
        {chunk('step 3 →', steps[2], 2, <span style={{display: 'inline-block', marginLeft: 12, transform: `rotate(${dotsRot}deg)`, transformOrigin: '50% 70%'}}>…</span>)}
      </div>
      <div style={{position: 'absolute', left: BUB.padX, top: BUB.padT + 3 * BUB.line + BUB.chipGap, height: BUB.chip, perspective: 700}}>
        {hedge > 0.001 && (
          <div style={{display: 'inline-flex', alignItems: 'center', padding: '14px 34px', borderRadius: 999, background: C.saffron, border: `4px solid ${C.saffronDeep}`, fontFamily: F.body, fontWeight: 800, fontSize: 48, lineHeight: '52px', color: C.ink, whiteSpace: 'nowrap', transform: `rotateX(${rx}deg)`, transformOrigin: '50% 0%', boxSizing: 'border-box'}}>
            reasoning · helps <span style={{color: C.coralDeep, marginLeft: 12}}>sometimes</span>
          </div>
        )}
      </div>
    </div>
  );
};

/** The two thought dots under the bubble (world-positioned by the scene). */
export const ThoughtDot: React.FC<{x: number; y: number; r: number; t: number}> = ({x, y, r, t}) =>
  t <= 0 ? null : (
    <div style={{...box(x - r * t, y - r * t, 2 * r * t, 2 * r * t), borderRadius: '50%', background: C.white, border: `3px solid ${C.ink}`}} />
  );

/** The parked "…" cloud: reasoning, still thinking. Centred on PUFF. */
export const S8Puff: React.FC<{t: number; bob: number}> = ({t, bob}) =>
  t <= 0 ? null : (
    <div style={{position: 'absolute', left: PUFF.x - 70, top: PUFF.y - 34 + bob, width: 140, height: 68, transform: `scale(${t})`, transformOrigin: '30% 100%'}}>
      <svg viewBox="0 0 140 68" width={140} height={68} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d="M 22 60 Q 2 58 8 40 Q 2 18 26 16 Q 34 0 58 6 Q 76 -4 94 8 Q 120 4 124 26 Q 140 40 124 54 Q 116 66 96 62 Q 80 70 60 64 Q 40 70 22 60 Z" fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 6, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 40, lineHeight: '44px', color: C.ink}}>…</div>
      <div style={{...box(16, 70, 14, 14), borderRadius: 7, background: C.white, border: `3px solid ${C.ink}`}} />
    </div>
  );

/* ------------------------------------------------------------------ the verdict plate and the stamp */
/** Hinged plate clipped to the bench apron under the slips: "more consistent · not necessarily more correct".
 *  The guard rail stays readable wherever it is on screen: ≈ 68 px in the slips close-up, ≈ 30 px in the closing wide. */
const PLATE_FONT = 33.5;
export const S8Plate: React.FC<{flap: number}> = ({flap}) => (
  <div style={{position: 'absolute', left: NOG.x - 600, width: 1200, top: PLATE_Y, textAlign: 'center', perspective: 900}}>
    <div style={{display: 'inline-flex', alignItems: 'stretch', transform: `rotateX(${flap}deg)`, transformOrigin: '50% 0%', borderRadius: 14, border: `${OUTLINE}px solid ${C.ink}`, overflow: 'hidden', boxShadow: `5px 6px 0 rgba(22,42,50,0.3)`}}>
      <div style={{background: C.ink, color: C.paper, fontFamily: F.body, fontWeight: 800, fontSize: PLATE_FONT, lineHeight: '36px', padding: '7px 22px', whiteSpace: 'nowrap'}}>more consistent</div>
      <div style={{background: C.coral, color: C.white, fontFamily: F.body, fontWeight: 800, fontSize: PLATE_FONT, lineHeight: '36px', padding: '7px 22px', whiteSpace: 'nowrap', borderLeft: `${OUTLINE}px solid ${C.ink}`}}>not necessarily more correct</div>
    </div>
    {/* two clips holding it to the apron lip */}
  </div>
);

/** NO GUARANTEE: a heavy stamp slammed onto the room (world space, centred on NOG). */
export const S8NoGuarantee: React.FC<{scale: number; sx: number; sy: number}> = ({scale, sx, sy}) => (
  <div style={{position: 'absolute', left: NOG.x - 500, top: NOG.y - 80, width: 1000, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(-3deg) scale(${scale * sx}, ${scale * sy})`, transformOrigin: '50% 50%'}}>
    <div style={{padding: '14px 40px', background: C.cream, border: `8px solid ${C.coralDeep}`, borderRadius: 22, boxShadow: `inset 0 0 0 5px ${C.cream}, inset 0 0 0 9px ${C.coral}, 10px 12px 0 ${C.shadow}`, fontFamily: F.display, fontWeight: 700, fontSize: 92, lineHeight: '100px', letterSpacing: '0.06em', color: C.coralDeep, whiteSpace: 'nowrap'}}>
      NO GUARANTEE
    </div>
  </div>
);

/** "=" between two identical slips. */
export const S8Equals: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) =>
  t <= 0 ? null : (
    <div style={{position: 'absolute', left: x - 40, top: y - 40, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t})`, fontFamily: F.display, fontWeight: 700, fontSize: 76, lineHeight: '80px', color: C.ink}}>=</div>
  );

/** "So what helps?" — hung from the ceiling on two strings (wall layer). Centre x / top y in layer coordinates. */
export const S8Sign: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, transformOrigin: '0px 0px'}}>
    <div style={{position: 'absolute', left: -210, top: -1200, width: 4, height: 1204, background: C.ink}} />
    <div style={{position: 'absolute', left: 206, top: -1200, width: 4, height: 1204, background: C.ink}} />
    <div style={{position: 'absolute', left: -320, width: 640, top: 0, textAlign: 'center'}}>
      <div style={{display: 'inline-block', background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 18, boxShadow: `8px 10px 0 ${C.shadow}`, padding: '12px 40px', fontFamily: F.display, fontWeight: 600, fontSize: 72, lineHeight: '80px', color: C.ink, whiteSpace: 'nowrap'}}>So what helps?</div>
    </div>
    {[-210, 206].map((sx) => (
      <div key={sx} style={{...box(sx - 9, -8, 22, 16), borderRadius: 8, background: C.paperDeep, border: `3px solid ${C.ink}`}} />
    ))}
  </div>
);
