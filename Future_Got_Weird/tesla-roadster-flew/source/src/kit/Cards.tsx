import React from 'react';
import {C, F} from '../theme';
import {E, kf, sp, tw, SNAP, SOFT, impact} from '../lib/motion';
import {Chip} from './base';

/**
 * Trim cards. Text only plus seat icons: no car drawings, and nothing on the Performance or Thrust cards
 * suggests flight. Wording follows Tesla's Roadster page as reported on Oct 15 (claim ledger C10, C11).
 */
export const TRIMS = [
  {name: 'PERFORMANCE', line: 'road ready', seats: 2, extra: 'suction + active aero'},
  {name: 'THRUST', line: 'race ready', seats: 2, extra: 'rear cold-gas thrusters'},
  {name: 'ROCKET', line: 'invite only', seats: 1, extra: 'flight system'},
];

const Seat: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{marginLeft: size * 0.12}}>
    <path d="M 30 12 Q 30 6 38 6 L 58 6 Q 66 6 66 14 L 62 58 L 34 58 Z" fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 22 60 L 78 60 Q 84 60 82 68 L 78 86 Q 76 92 70 92 L 30 92 Q 24 92 22 86 L 18 68 Q 16 60 22 60 Z" fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

export const TrimCards: React.FC<{f: number; highlightAt: number; stampAt: number; portrait?: boolean; w?: number; source?: string; seq?: [number, number, number]}> = ({
  f, highlightAt, stampAt, portrait = true, w = 920, source = "Source: Tesla's Roadster page, Oct 15, 2026", seq,
}) => {
  const hi = tw(f, highlightAt, 10);
  const stamp = sp(f, stampAt, SNAP);
  const [sx, sy] = impact(f, stampAt + 5, 0.08, 10);
  const cardW = portrait ? w : w / 3 - 24;
  const cardH = portrait ? 230 : 330;
  return (
    <div style={{position: 'relative', width: w, display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: portrait ? 34 : 36}}>
      {TRIMS.map((t, i) => {
        const inT = sp(f, i * 5, SOFT);
        const rocket = i === 2;
        // seq: each card takes the focus in turn as the narration names it; otherwise only the Rocket is singled out
        const em = seq ? (i < 2 ? tw(f, seq[i], 8) * (1 - tw(f, seq[i + 1], 8)) : tw(f, seq[2], 10)) : rocket ? hi : 0;
        const anyOn = seq ? tw(f, seq[0], 8) : hi;
        const dim = 1 - 0.55 * anyOn * (1 - em);
        const sc = 1 + 0.04 * em - 0.03 * anyOn * (1 - em);
        const fillOn = rocket ? (seq ? em : hi) : 0;
        return (
          <div key={t.name} style={{
            width: cardW, height: cardH, boxSizing: 'border-box', borderRadius: 34, border: `6px solid ${C.ink}`,
            background: rocket ? `color-mix(in srgb, ${C.saffron} ${Math.round(fillOn * 100)}%, ${C.cream})` : `color-mix(in srgb, ${C.blueLight} ${Math.round(em * 100)}%, ${C.cream})`,
            boxShadow: `0 10px 0 ${C.shadow}`, padding: portrait ? '26px 36px' : '30px 30px',
            opacity: dim * inT, transform: `translateX(${(1 - inT) * 260}px) scale(${sc})`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative',
          }}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: portrait ? 76 : 62, color: C.ink, letterSpacing: 1}}>{t.name}</div>
              <div style={{display: 'flex'}}>{[...Array(t.seats)].map((_, k) => <Seat key={k} size={portrait ? 64 : 54} color={rocket ? C.coral : C.blueLight} />)}</div>
            </div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: portrait ? 40 : 36, color: C.inkSoft, marginTop: 6}}>
              {t.line} · {t.seats} seat{t.seats > 1 ? 's' : ''}
            </div>
            <div style={{fontFamily: F.body, fontWeight: 700, fontSize: portrait ? 34 : 32, color: rocket ? C.ink : C.inkMuted, marginTop: 4}}>{t.extra}</div>
          </div>
        );
      })}
      {/* the stamp lands on the Rocket card */}
      <div style={{
        position: 'absolute', left: portrait ? 40 : (w / 3) * 2 - 10, top: portrait ? 2 * (cardH + 34) + 92 : cardH * 0.18,
        width: portrait ? w - 80 : w / 3 - 10, opacity: Math.min(1, stamp * 1.4),
        transform: `rotate(-5deg) scale(${(2.1 - 1.1 * stamp) * sx}, ${(2.1 - 1.1 * stamp) * sy})`, transformOrigin: '50% 50%',
      }}>
        <div style={{
          border: `8px solid ${C.coralDeep}`, borderRadius: 22, background: 'rgba(251,210,200,0.93)', color: C.coralDeep,
          fontFamily: F.display, fontWeight: 700, fontSize: portrait ? 58 : 44, lineHeight: 1.02, textAlign: 'center', padding: '14px 10px',
        }}>
          NOT APPROVED FOR<br />PUBLIC ROAD USE
        </div>
      </div>
      <div style={{position: 'absolute', top: portrait ? 3 * cardH + 2 * 34 + 34 : cardH + 34, left: 0, width: w, textAlign: 'center', opacity: tw(f, stampAt + 10, 10)}}>
        <Chip text={source} kind="source" size={portrait ? 30 : 26} />
      </div>
    </div>
  );
};

/** 0-60 card: a stopwatch counts to 0.81 in real time while the speed bar fills; then the attribution tag lands. */
export const AccelCard: React.FC<{f: number; tagAt: number; portrait?: boolean}> = ({f, tagAt, portrait = true}) => {
  const run0 = 8;
  const secs = Math.max(0, Math.min(0.81, (f - run0) / 30));
  const fill = secs / 0.81;
  const done = f >= run0 + 0.81 * 30;
  const big = sp(f, run0 + 25, SNAP);
  const tag = sp(f, tagAt, SNAP);
  const k = portrait ? 1 : 0.86;
  return (
    <div style={{width: portrait ? 920 : 1100, textAlign: 'center', fontFamily: F.display, color: C.ink}}>
      <Chip text="TESLA DEMO · OCT 15, 2026" kind="demo" size={34 * k} />
      <div style={{fontWeight: 700, fontSize: 96 * k, marginTop: 40 * k}}>0–60 mph</div>
      <div style={{fontWeight: 700, fontSize: 250 * k, lineHeight: 1, marginTop: 10, transform: `scale(${done ? 1 + 0.06 * (1 - big) + 0.0 : 1})`, color: done ? C.ink : C.inkSoft}}>
        {secs.toFixed(2)}<span style={{fontSize: 120 * k}}> s</span>
      </div>
      {/* speed bar */}
      <div style={{margin: `${30 * k}px auto 0`, width: 780 * k, height: 54 * k, borderRadius: 27 * k, border: `6px solid ${C.ink}`, background: C.cream, overflow: 'hidden', position: 'relative'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: C.saffron}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', width: 780 * k, margin: '8px auto 0', fontFamily: F.body, fontWeight: 800, fontSize: 32 * k, color: C.inkSoft}}>
        <span>0 mph</span><span>60 mph</span>
      </div>
      <div style={{marginTop: 50 * k, transform: `rotate(-3deg) scale(${1.8 - 0.8 * tag})`, opacity: Math.min(1, tag * 1.4), display: 'inline-block'}}>
        <div style={{border: `8px solid ${C.tealDeep}`, borderRadius: 22, background: 'rgba(191,232,227,0.95)', color: C.tealDeep, fontWeight: 700, fontSize: 64 * k, padding: '10px 34px'}}>
          TESLA'S OWN TEST
        </div>
      </div>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 36 * k, color: C.inkSoft, marginTop: 22 * k, opacity: tw(f, tagAt + 8, 10)}}>
        not independently timed
      </div>
    </div>
  );
};

/** Production target: the year ticks forward to 2028. */
export const TargetCard: React.FC<{f: number; portrait?: boolean; note?: string}> = ({f, portrait = true, note = "Tesla's stated target"}) => {
  const year = f < 6 ? 2026 : f < 13 ? 2027 : 2028;
  const flip = (f < 6 ? f : f < 13 ? f - 6 : f - 13) / 6;
  const landed = sp(f, 13, SNAP);
  const k = portrait ? 1 : 0.86;
  return (
    <div style={{width: portrait ? 920 : 1100, textAlign: 'center', fontFamily: F.display, color: C.ink}}>
      <Chip text="PRODUCTION TARGET" kind="demo" size={34 * k} />
      <div style={{margin: `${50 * k}px auto 0`, width: 700 * k, borderRadius: 40, border: `7px solid ${C.ink}`, background: C.cream, boxShadow: `0 12px 0 ${C.shadow}`, overflow: 'hidden'}}>
        <div style={{height: 70 * k, background: C.coral, borderBottom: `7px solid ${C.ink}`}} />
        <div style={{fontWeight: 700, fontSize: 250 * k, lineHeight: 1.15, transform: `translateY(${year < 2028 ? (1 - Math.min(1, flip)) * -20 : (1 - landed) * -26}px)`}}>{year}</div>
      </div>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40 * k, color: C.inkSoft, marginTop: 34 * k, opacity: tw(f, 16, 10)}}>{note}</div>
    </div>
  );
};

export const fadeUp = (f: number, start: number, dur = 10) => ({opacity: tw(f, start, dur), transform: `translateY(${(1 - tw(f, start, dur, E.out)) * 30}px)`});
export const k01 = kf;
