import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {pop} from '../lib/anim';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const stroke = (w: number) => ({WebkitTextStroke: `${w}px ${C.ink}`, paintOrder: 'stroke fill' as const});

/** Narration time of the current frame, for overlays placed inside a Sequence that starts at `start`. */
const useT = (start: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: start + frame / fps, frame, fps};
};

/** One readable attribution at the very start (no repeated tiny labels). */
export const SourceChip: React.FC<{until: number}> = ({until}) => {
  const {t} = useT(0);
  const o = interpolate(t, [until - 0.3, until], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 150, left: 0, width: 1080, textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink, background: 'rgba(255,251,240,0.94)', border: `3px solid ${C.ink}`, borderRadius: 24, padding: '7px 24px'}}>
        Tesla reveal footage · Oct 15, 2026
      </span>
    </div>
  );
};

/** 0–60 over the live run: Tesla's 0.81 s claim, with the stream's own 1.00 s timed clip noted. */
export const ZeroSixty: React.FC<{start: number; cues: {zero: number; num: number; numEnd: number; own: number}}> = ({start, cues}) => {
  const {t, frame, fps} = useT(start);
  const head = interpolate(t, [cues.zero - 0.05, cues.zero + 0.12], [0, 1], clamp);
  const count = interpolate(t, [cues.num, cues.numEnd], [0, 0.81], clamp);
  const numO = interpolate(t, [cues.num - 0.08, cues.num + 0.04], [0, 1], clamp);
  const claim = pop(frame, fps, (cues.own - start) * fps, 18);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 980, background: 'linear-gradient(rgba(5,10,14,0.72), rgba(5,10,14,0.45) 60%, rgba(5,10,14,0))', opacity: head}} />
      <div style={{position: 'absolute', top: 240, width: 1080, textAlign: 'center', opacity: head}}>
        <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 84, color: C.cream, letterSpacing: 2, ...stroke(11)}}>0–60 MPH</span>
      </div>
      <div style={{position: 'absolute', top: 330, width: 1080, textAlign: 'center', opacity: numO}}>
        <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 250, color: C.saffron, ...stroke(16), fontVariantNumeric: 'tabular-nums'}}>
          {count.toFixed(2)}
          <span style={{fontSize: 120}}> s</span>
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: 1080, textAlign: 'center', opacity: claim, transform: `scale(${0.8 + 0.2 * claim})`}}>
        <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 46, color: C.ink, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 28, padding: '8px 28px'}}>
          TESLA'S CLAIM · ITS OWN TEST
        </span>
      </div>
      <div style={{position: 'absolute', top: 735, width: 1080, textAlign: 'center', opacity: claim}}>
        <span style={{fontFamily: F.body, fontWeight: 700, fontSize: 38, color: C.cream, background: 'rgba(5,10,14,0.75)', borderRadius: 18, padding: '6px 20px'}}>
          live run · the stream's timed clip read 1.00 s
        </span>
      </div>
    </AbsoluteFill>
  );
};

/** The one trim beat: which version flies, and Tesla's road-use wording. */
export const RocketBeat: React.FC<{start: number; cues: {flight: number; lists: number; rocket: number; approved: number}}> = ({start, cues}) => {
  const {t, frame, fps} = useT(start);
  const head = interpolate(t, [cues.flight - 0.1, cues.flight + 0.1], [0, 1], clamp);
  const list = interpolate(t, [cues.lists - 0.1, cues.lists + 0.15], [0, 1], clamp);
  const hi = pop(frame, fps, (cues.rocket - start) * fps, 18);
  const stamp = pop(frame, fps, (cues.approved - start) * fps, 16);
  const row = (name: string, sub: string, i: number, on: boolean) => {
    const lit = on ? hi : 0;
    return (
      <div key={name} style={{
        position: 'absolute', top: 400 + i * 108, left: 0, width: 1080, textAlign: 'center',
        opacity: list * (on ? 1 : 1 - 0.55 * hi), transform: `translateX(${(1 - list) * (i % 2 ? 60 : -60)}px) scale(${1 + 0.12 * lit})`,
      }}>
        <span style={{
          display: 'inline-block', minWidth: 520, fontFamily: F.display, fontWeight: 700, fontSize: 60, color: C.ink,
          background: on && lit > 0.05 ? C.saffron : C.cream, border: `5px solid ${C.ink}`, borderRadius: 30, padding: '6px 30px',
        }}>
          {name}
          {sub && <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 32, marginLeft: 18, opacity: lit}}>{sub}</span>}
        </span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 240, width: 1080, textAlign: 'center', opacity: head}}>
        <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 70, color: C.cream, ...stroke(11)}}>WHICH VERSION FLIES?</span>
      </div>
      {row('PERFORMANCE', '', 0, false)}
      {row('THRUST', '', 1, false)}
      {row('ROCKET', 'invite-only · 1 seat', 2, true)}
      <div style={{position: 'absolute', top: 760, width: 1080, textAlign: 'center', opacity: Math.min(1, stamp * 1.4), transform: `rotate(-4deg) scale(${1.3 - 0.3 * stamp})`}}>
        <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 52, color: C.coralDeep, background: 'rgba(255,240,235,0.95)', border: `6px solid ${C.coralDeep}`, borderRadius: 14, padding: '6px 22px', letterSpacing: 1}}>
          NOT APPROVED FOR PUBLIC ROADS
        </span>
      </div>
      <div style={{position: 'absolute', top: 870, width: 1080, textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: F.body, fontWeight: 700, fontSize: 37, color: C.cream, background: 'rgba(5,10,14,0.78)', borderRadius: 18, padding: '6px 20px'}}>
          per Tesla's Roadster page · production target 2028
        </span>
      </div>
    </AbsoluteFill>
  );
};

export type W = {w: string; s: number; e: number};
/** Phrase-level captions: a whole phrase per plate (up to two lines), the spoken word lit in saffron. */
export const PhraseCaptions: React.FC<{words: W[]; sizes: number[]; y: number; end: number}> = ({words, sizes, y, end}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const phrases = React.useMemo(() => {
    const out: {ws: W[]; a: number; b: number}[] = [];
    let i = 0;
    for (const n of sizes) {
      const ws = words.slice(i, i + n);
      out.push({ws, a: ws[0].s - 0.08, b: 0});
      i += n;
    }
    out.forEach((p, k) => {
      const next = out[k + 1];
      const last = p.ws[p.ws.length - 1].e;
      p.b = next ? Math.min(next.a, last + 0.45) : end;
    });
    return out;
  }, [words, sizes, end]);
  const p = phrases.find((q) => t >= q.a && t < q.b);
  if (!p) return null;
  const s = interpolate(t, [p.a, p.a + 0.1], [0.94, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 110, width: 820, top: y, display: 'flex', justifyContent: 'center'}}>
      <div style={{
        transform: `scale(${s})`, background: C.cream, border: `5px solid ${C.ink}`, borderRadius: 26, padding: '8px 22px',
        boxShadow: '0 6px 0 rgba(0,0,0,0.35)', fontFamily: F.display, fontWeight: 600, fontSize: 60, color: C.ink,
        lineHeight: 1.16, textAlign: 'center', maxWidth: 820,
      }}>
        {p.ws.map((w, i) => {
          const on = t >= w.s - 0.03 && t < (p.ws[i + 1]?.s ?? p.b);
          return (
            <span key={i} style={{background: on ? C.saffron : 'transparent', borderRadius: 12, padding: '0 6px', margin: '0 2px', display: 'inline-block'}}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};
