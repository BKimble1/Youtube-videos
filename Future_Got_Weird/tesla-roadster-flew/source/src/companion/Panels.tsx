import React from 'react';
import {C, F} from '../theme';
import {E, kf, sp, tw, SNAP, SOFT, impact} from '../lib/motion';
import {Arrow, Chip} from '../kit/base';
import {FrontCar} from '../kit/Diagrams';
import {Character, IDLE, Pose} from '../components/Character';
import {CAST} from '../components/cast';

/** All panels are drawn for 1920×1080. `f` = frames since the shot began; `at*` = cue frames within the shot. */
const card: React.CSSProperties = {
  background: C.cream, border: `6px solid ${C.ink}`, borderRadius: 36, boxShadow: `0 12px 0 ${C.shadow}`, boxSizing: 'border-box',
};
const H1: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 84, color = C.ink, style}) => (
  <div style={{fontFamily: F.display, fontWeight: 700, fontSize: size, color, lineHeight: 1.05, ...style}}>{children}</div>
);
const Body: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 40, color = C.inkSoft, style}) => (
  <div style={{fontFamily: F.body, fontWeight: 800, fontSize: size, color, lineHeight: 1.25, ...style}}>{children}</div>
);
const pop = (f: number, at: number) => {
  const k = sp(f, at, SNAP);
  return {opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 40}px) scale(${0.9 + 0.1 * k})`};
};

/* ---------- icons (original, simple) ---------- */
export const FanIcon: React.FC<{size: number; spin?: number}> = ({size, spin = 0}) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    <circle r={54} fill={C.blueLight} stroke={C.ink} strokeWidth={6} />
    <g transform={`rotate(${spin})`}>
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M 0 0 Q 18 -18 10 -46 Q -8 -36 -5 -5 Z" transform={`rotate(${a})`} fill={C.blue} stroke={C.ink} strokeWidth={4} />)}
    </g>
    <circle r={9} fill={C.ink} />
  </svg>
);
export const JetIcon: React.FC<{size: number; f?: number}> = ({size, f = 0}) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    <rect x={-50} y={-22} width={56} height={44} rx={20} fill={C.saffronLight} stroke={C.ink} strokeWidth={6} />
    <path d="M 6 -12 L 22 -18 L 22 18 L 6 12 Z" fill={C.inkSoft} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    {[0, 1, 2].map((i) => {
      const ph = (f * 0.06 + i / 3) % 1;
      return <circle key={i} cx={30 + ph * 26} cy={0} r={6 + ph * 12} fill={C.white} stroke={C.blue} strokeWidth={4} opacity={1 - ph} />;
    })}
  </svg>
);
export const WatchIcon: React.FC<{size: number; f?: number}> = ({size, f = 0}) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    <rect x={-10} y={-62} width={20} height={14} rx={4} fill={C.ink} />
    <circle r={48} cy={4} fill={C.cream} stroke={C.ink} strokeWidth={6} />
    <path d={`M 0 4 L ${Math.sin(f * 0.25) * 34} ${4 - Math.cos(f * 0.25) * 34}`} stroke={C.coral} strokeWidth={7} strokeLinecap="round" />
    <circle r={6} cy={4} fill={C.ink} />
  </svg>
);

/* ---------- c05: three clips, three tricks ---------- */
export const Tiles: React.FC<{f: number; at: number[]; labelsAt: number; askAt: number}> = ({f, at, labelsAt, askAt}) => {
  const tiles = [
    {t: 'UPSIDE DOWN', m: 'fan suction', icon: <FanIcon size={150} spin={f * 9} />},
    {t: 'IN THE AIR', m: 'cold-gas jets', icon: <JetIcon size={150} f={f} />},
    {t: '0–60 MPH', m: 'thrusters + tires', icon: <WatchIcon size={150} f={f} />},
  ];
  const ask = tw(f, askAt, 10);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 120, right: 120, top: 210, display: 'flex', gap: 60}}>
        {tiles.map((t, i) => {
          const focus = i === 1 ? ask : 0;
          return (
            <div key={i} style={{...card, flex: 1, height: 520, padding: 40, textAlign: 'center', ...pop(f, at[i]),
              background: i === 1 ? `color-mix(in srgb, ${C.saffron} ${Math.round(focus * 100)}%, ${C.cream})` : C.cream,
              opacity: (1 - 0.5 * ask * (i === 1 ? 0 : 1)) * Math.min(1, sp(f, at[i], SNAP) * 1.5)}}>
              <div style={{display: 'flex', justifyContent: 'center', marginTop: 10}}>{t.icon}</div>
              <H1 size={70} style={{marginTop: 30}}>{t.t}</H1>
              <Body size={42} style={{marginTop: 20, opacity: tw(f, labelsAt + i * 6, 10)}}>{t.m}</Body>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', ...pop(f, askAt)}}>
        <H1 size={92}>What exactly flew?</H1>
      </div>
    </div>
  );
};

/* ---------- c06: the event ---------- */
const Pin: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size * 1.3} viewBox="-50 -60 100 130">
    <path d="M 0 66 C -10 40 -44 18 -44 -14 A 44 44 0 1 1 44 -14 C 44 18 10 40 0 66 Z" fill={C.coral} stroke={C.ink} strokeWidth={6} />
    <circle cy={-14} r={16} fill={C.cream} stroke={C.ink} strokeWidth={5} />
  </svg>
);
export const EventCard: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', left: 260, right: 260, top: 200, height: 640, ...card, padding: '60px 80px', ...pop(f, 0)}}>
    <Chip text="TESLA ROADSTER REVEAL · LIVESTREAM" kind="demo" size={34} />
    <H1 size={150} style={{marginTop: 40}}>Oct 15, 2026</H1>
    <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 50, ...pop(f, 40)}}>
      <Pin size={90} />
      <div>
        <H1 size={64}>SpaceX test site</H1>
        <Body size={46}>McGregor, Texas</Body>
      </div>
    </div>
  </div>
);

/* ---------- c12: 2017 → 2028 ---------- */
export const Timeline: React.FC<{f: number; at17: number; at28: number}> = ({f, at17, at28}) => {
  const line = tw(f, at17 + 10, Math.max(12, at28 - at17 - 10), E.inOut);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <path d={`M 420 560 L ${420 + 1080 * line} 560`} stroke={C.ink} strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" />
        {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map((y, i) => (
          <circle key={y} cx={420 + (i + 1) * 98} cy={560} r={9} fill={C.inkMuted} opacity={line * 1.1 > (i + 1) / 11 ? 1 : 0} />
        ))}
      </svg>
      {[{x: 420, y: 'first shown', yr: '2017', at: at17, c: C.blueLight}, {x: 1500, y: 'production target', yr: '2028', at: at28, c: C.saffron}].map((k) => (
        <div key={k.yr} style={{position: 'absolute', left: k.x - 210, top: 330, width: 420, textAlign: 'center', ...pop(f, k.at)}}>
          <div style={{...card, background: k.c, padding: '20px 0'}}><H1 size={120}>{k.yr}</H1></div>
          <Body size={44} style={{marginTop: 120}}>{k.y}</Body>
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', opacity: tw(f, at28 + 12, 10)}}>
        <Chip text="Roadster page and reporting, Oct 15, 2026" kind="source" size={28} />
      </div>
    </div>
  );
};

/* ---------- c13 right panel: 1 g vs up to 2 g ---------- */
export const GMeter: React.FC<{f: number; gAt: number; twoAt: number; doubleAt: number}> = ({f, gAt, twoAt, doubleAt}) => {
  const g1 = tw(f, gAt, 16);
  const g2 = tw(f, twoAt, 24, E.out);
  const dbl = sp(f, doubleAt, SNAP);
  const H = 520, base = 820, unit = H / 2.2;
  return (
    <div style={{position: 'absolute', left: 1120, top: 150, width: 680, height: 800, opacity: tw(f, gAt - 6, 10)}}>
      <H1 size={52} style={{textAlign: 'center'}}>Pull needed vs. pull claimed</H1>
      <svg width={680} height={720} style={{position: 'absolute', top: 70}}>
        {[1, 2].map((g) => (
          <g key={g}>
            <path d={`M 40 ${base - 70 - g * unit} L 640 ${base - 70 - g * unit}`} stroke={C.paperLine} strokeWidth={4} strokeDasharray="10 10" />
            <text x={20} y={base - 60 - g * unit} fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.inkMuted} textAnchor="middle">{g} g</text>
          </g>
        ))}
        <rect x={130} y={base - 70 - unit * g1} width={170} height={unit * g1} rx={14} fill={C.coral} stroke={C.ink} strokeWidth={6} />
        <rect x={400} y={base - 70 - unit * 2 * g2} width={170} height={unit * 2 * g2} rx={14} fill={C.blue} stroke={C.ink} strokeWidth={6} opacity={g2 > 0 ? 1 : 0} />
        <text x={215} y={base - 20} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={40} fill={C.coralDeep}>gravity</text>
        <text x={485} y={base - 20} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={40} fill={C.blueDeep} opacity={g2}>suction</text>
      </svg>
      <div style={{position: 'absolute', left: 340, top: 70 + base - 70 - unit * 2 - 120, width: 330, textAlign: 'center', opacity: g2}}>
        <Chip text="Tesla's claim: up to 2 g" kind="demo" size={28} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 740, textAlign: 'center', opacity: Math.min(1, dbl * 1.5), transform: `scale(${0.8 + 0.2 * dbl})`}}>
        <H1 size={58} color={C.tealDeep}>2× what it needs</H1>
      </div>
    </div>
  );
};

/* ---------- c14: fan cars ---------- */
export const FanCarCard: React.FC<{f: number; rulesAt: number}> = ({f, rulesAt}) => {
  const stamp = sp(f, rulesAt, SNAP);
  const [sx, sy] = impact(f, rulesAt + 5, 0.08, 10);
  return (
    <div style={{position: 'absolute', left: 300, right: 300, top: 180, height: 700, ...card, padding: '60px 80px', ...pop(f, 0)}}>
      <Chip text="RACING HISTORY" kind="demo" size={32} />
      <div style={{display: 'flex', alignItems: 'center', gap: 50, marginTop: 50}}>
        <FanIcon size={230} spin={f * 14} />
        <div>
          <H1 size={110}>1970s</H1>
          <Body size={50}>fan cars sucked themselves to the track</Body>
        </div>
      </div>
      <div style={{position: 'absolute', right: 70, bottom: 70, transform: `rotate(-6deg) scale(${(2 - stamp) * sx}, ${(2 - stamp) * sy})`, opacity: Math.min(1, stamp * 1.4)}}>
        <div style={{border: `8px solid ${C.coralDeep}`, borderRadius: 22, background: 'rgba(251,210,200,0.93)', color: C.coralDeep, fontFamily: F.display, fontWeight: 700, fontSize: 70, padding: '8px 36px'}}>
          RULED OUT
        </div>
      </div>
    </div>
  );
};

/* ---------- c15: two separate systems ---------- */
export const SeparateCard: React.FC<{f: number; at: number}> = ({f, at}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', left: 230, top: 260, width: 600, height: 520, ...card, textAlign: 'center', paddingTop: 60, ...pop(f, 0)}}>
      <FanIcon size={220} spin={f * 12} />
      <H1 size={70} style={{marginTop: 30}}>SUCTION</H1>
      <Body size={40}>holds it to a surface</Body>
    </div>
    <div style={{position: 'absolute', left: 1090, top: 260, width: 600, height: 520, ...card, textAlign: 'center', paddingTop: 60, ...pop(f, 8)}}>
      <JetIcon size={220} f={f} />
      <H1 size={70} style={{marginTop: 30}}>JETS</H1>
      <Body size={40}>steer it in the air</Body>
    </div>
    <div style={{position: 'absolute', left: 900, top: 430, width: 120, textAlign: 'center', ...pop(f, at)}}>
      <H1 size={150} color={C.coralDeep}>≠</H1>
    </div>
  </div>
);

/* ---------- c16: tank, valves, nozzles ---------- */
export const PartsDiagram: React.FC<{f: number; tankAt: number; valvesAt: number; nozzAt: number; fuelAt: number; flameAt: number}> = ({f, tankAt, valvesAt, nozzAt, fuelAt, flameAt}) => {
  const lbl = (at: number) => tw(f, at, 10);
  const stamp = (at: number) => sp(f, at, SNAP);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute'}}>
        <g transform="translate(760 560) scale(1.25)">
          <FrontCar tank nozzles />
          {/* valves: small ink blocks on the lines from tank to nozzles */}
          <g opacity={lbl(valvesAt)}>
            <path d="M -120 44 L -300 76 M 120 44 L 300 76 M -100 30 L -308 -30 M 100 30 L 308 -30" stroke={C.saffronDeep} strokeWidth={6} strokeDasharray="12 8" />
            {[[-210, 60], [210, 60], [-200, 0], [200, 0]].map(([x, y], i) => <rect key={i} x={x - 14} y={y - 12} width={28} height={24} rx={5} fill={C.ink} />)}
          </g>
        </g>
        <g opacity={lbl(tankAt)}>
          <path d="M 760 620 Q 900 800 1180 830" fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="10 9" />
        </g>
        <g opacity={lbl(nozzAt)}>
          <path d="M 1145 520 Q 1250 420 1330 380" fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="10 9" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 1190, top: 790, opacity: lbl(tankAt)}}><Chip text="TANK of compressed gas" kind="demo" size={36} /></div>
      <div style={{position: 'absolute', left: 520, top: 840, opacity: lbl(valvesAt)}}><Chip text="VALVES" kind="demo" size={36} /></div>
      <div style={{position: 'absolute', left: 1340, top: 340, opacity: lbl(nozzAt)}}><Chip text="NOZZLES" kind="demo" size={36} /></div>
      <div style={{position: 'absolute', left: 120, top: 160, display: 'flex', flexDirection: 'column', gap: 30}}>
        {[['NO FUEL', fuelAt], ['NO FLAME', flameAt]].map(([t, at]) => (
          <div key={t as string} style={{transform: `rotate(-5deg) scale(${1.8 - 0.8 * stamp(at as number)})`, opacity: Math.min(1, stamp(at as number) * 1.4), transformOrigin: 'left center'}}>
            <span style={{display: 'inline-block', border: `8px solid ${C.tealDeep}`, borderRadius: 20, background: 'rgba(191,232,227,0.95)', color: C.tealDeep, fontFamily: F.display, fontWeight: 700, fontSize: 64, padding: '4px 30px'}}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', right: 60, top: 60}}><Chip text="ILLUSTRATION · not Tesla's actual layout" kind="illus" size={28} /></div>
    </div>
  );
};

/* ---------- c17: the balloon ---------- */
export const Balloon: React.FC<{f: number; at: number}> = ({f, at}) => {
  const go = tw(f, at, 40, E.in);
  const x = 1100 - go * 520, wob = Math.sin(f * 0.9) * 6 * (go > 0 ? 1 : 0);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute'}}>
        <g transform={`translate(${x} 470) rotate(${-90 + wob})`}>
          <ellipse rx={150} ry={185} fill={C.coral} stroke={C.ink} strokeWidth={7} />
          <path d="M -18 182 L 18 182 L 10 208 L -10 208 Z" fill={C.coralDeep} stroke={C.ink} strokeWidth={5} />
          <ellipse rx={40} ry={70} cx={-60} cy={-60} fill={C.white} opacity={0.35} />
        </g>
        {[...Array(8)].map((_, i) => {
          const ph = (f * 0.07 + i / 8) % 1;
          return <circle key={i} cx={x + 220 + ph * 300} cy={470 + (i % 3 - 1) * 24 * ph} r={12 + ph * 30} fill={C.white} stroke={C.blue} strokeWidth={5} opacity={(1 - ph) * Math.min(1, go * 6 + (f > at ? 1 : 0))} />;
        })}
        <g opacity={tw(f, at + 6, 10)}>
          <Arrow x1={x + 260} y1={700} x2={x + 520} y2={700} fill={C.blue} w={28} h={60} />
          <Arrow x1={x - 20} y1={700} x2={x - 280} y2={700} fill={C.saffron} w={28} h={60} />
        </g>
        <text x={x + 390} y={790} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={48} fill={C.blueDeep} opacity={tw(f, at + 6, 10)}>gas out →</text>
        <text x={x - 150} y={790} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={48} fill={C.saffronDeep} opacity={tw(f, at + 6, 10)}>← push</text>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', ...pop(f, 0)}}>
        <H1 size={76}>Push gas one way, get pushed the other</H1>
      </div>
    </div>
  );
};

/* ---------- c19: SpaceX ---------- */
export const SpaceXCard: React.FC<{f: number; airAt: number}> = ({f, airAt}) => (
  <div style={{position: 'absolute', left: 300, right: 300, top: 220, height: 640, ...card, padding: '60px 80px', ...pop(f, 0)}}>
    <Chip text="TESLA SAYS" kind="demo" size={34} />
    <H1 size={96} style={{marginTop: 40}}>Built with SpaceX</H1>
    <Body size={50} style={{marginTop: 30}}>Thrusters like these are normally used in space.</Body>
    <div style={{display: 'flex', gap: 40, marginTop: 60, ...pop(f, airAt - 30)}}>
      <div style={{...card, flex: 1, padding: 26, background: C.blueLight, boxShadow: 'none'}}><H1 size={52}>space</H1><Body size={36}>no air in the way</Body></div>
      <div style={{fontFamily: F.display, fontSize: 80, fontWeight: 700, color: C.ink, alignSelf: 'center'}}>→</div>
      <div style={{...card, flex: 1, padding: 26, background: C.saffronLight, boxShadow: 'none'}}><H1 size={52}>air</H1><Body size={36}>new hardware and controls</Body></div>
    </div>
  </div>
);

/* ---------- c20: labels over the real launch ---------- */
export const LaunchOverlay: React.FC<{f: number; rampAt: number; jetsAt: number}> = ({f, rampAt, jetsAt}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', left: 80, bottom: 90, ...pop(f, rampAt)}}><Chip text="RAMP → speed + height" kind="demo" size={44} /></div>
    <div style={{position: 'absolute', right: 80, top: 110, ...pop(f, jetsAt)}}><Chip text="JETS → rotation + landing" kind="illus" size={44} /></div>
  </div>
);

/* ---------- c21: what it doesn't show ---------- */
export const Checklist: React.FC<{f: number; title: string; items: [string, number][]; mark: 'x' | 'check'}> = ({f, title, items, mark}) => (
  <div style={{position: 'absolute', left: 300, right: 300, top: 170, height: 740, ...card, padding: '60px 90px', ...pop(f, 0)}}>
    <H1 size={74}>{title}</H1>
    <div style={{marginTop: 50, display: 'flex', flexDirection: 'column', gap: 40}}>
      {items.map(([t, at], i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 36, ...pop(f, at)}}>
          <div style={{width: 92, height: 92, borderRadius: 24, border: `6px solid ${C.ink}`, background: mark === 'x' ? C.coralLight : C.tealLight,
            fontFamily: F.display, fontWeight: 700, fontSize: 72, color: mark === 'x' ? C.coralDeep : C.tealDeep, textAlign: 'center', lineHeight: '86px'}}>{mark === 'x' ? '✕' : '✓'}</div>
          <Body size={56} color={C.ink}>{t}</Body>
        </div>
      ))}
    </div>
  </div>
);

/* ---------- c24: 3.4 g ---------- */
export const GCompare: React.FC<{f: number; at34: number; tiresAt: number; thrAt: number; pushAt: number}> = ({f, at34, tiresAt, thrAt, pushAt}) => {
  const b1 = tw(f, tiresAt, 18), b2 = tw(f, at34, 24);
  const unit = 300;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 120, top: 120, width: 900, ...pop(f, 0)}}>
        <Chip text="OUR ARITHMETIC" kind="illus" size={30} />
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: C.ink, marginTop: 34, lineHeight: 1.6}}>
          60 mph = 26.8 m/s<br />26.8 ÷ 0.81 s ≈ 33 m/s²<br />≈ <span style={{background: C.saffron, padding: '0 10px', borderRadius: 10}}>3.4 g</span> on average
        </div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <rect x={1120} y={760 - unit * 1 * b1} width={220} height={unit * 1 * b1} rx={16} fill={C.blueLight} stroke={C.ink} strokeWidth={6} />
        <rect x={1440} y={760 - unit * 3.4 * 0.62 * b2} width={220} height={unit * 3.4 * 0.62 * b2} rx={16} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
        <path d="M 1080 760 L 1720 760" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
        <text x={1230} y={820} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={38} fill={C.ink} opacity={b1}>road tires ≈ 1 g</text>
        <text x={1550} y={820} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={38} fill={C.ink} opacity={b2}>0.81 s run ≈ 3.4 g</text>
      </svg>
      <div style={{position: 'absolute', left: 1100, top: 880, width: 640, textAlign: 'center', opacity: tw(f, tiresAt + 10, 10)}}>
        <Body size={30} color={C.inkMuted}>bar heights not to scale across both</Body>
      </div>
      <div style={{position: 'absolute', left: 120, top: 640, width: 860, ...pop(f, thrAt)}}>
        <div style={{...card, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 30}}>
          <JetIcon size={130} f={f} />
          <div>
            <H1 size={52}>So: thrusters</H1>
            <Body size={36} style={{opacity: tw(f, pushAt, 10)}}>Tesla says they push harder than the tires could</Body>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- c27: verdict board with the channel's fact-checker ---------- */
const checkerPose = (f: number, pointAt: number, hmmAt: number): Pose => {
  const p = tw(f, pointAt, 12);
  const h = tw(f, hmmAt, 12);
  return {...IDLE, armL: {a: 8 + 92 * p, b: 10 + 20 * p}, armR: {a: 8, b: 10 + 60 * h}, lookX: -0.7, brows: 0.2 + 0.4 * h, browAsym: 0.6 * h, mouth: h > 0.5 ? 'hmm' : 'smile', tilt: -4 * h};
};
export const Verdict: React.FC<{f: number; shown: [string, number][]; notYet: [string, number][]}> = ({f, shown, notYet}) => (
  <div style={{position: 'absolute', inset: 0}}>
    {[{t: 'SHOWN', items: shown, mark: '✓', bg: C.tealLight, fg: C.tealDeep, x: 90, at0: 0}, {t: 'NOT SHOWN YET', items: notYet, mark: '✕', bg: C.coralLight, fg: C.coralDeep, x: 770, at0: notYet[0][1] - 6}].map((col) => (
      <div key={col.t} style={{position: 'absolute', left: col.x, top: 120, width: 640, height: 820, ...card, padding: '44px 44px', ...pop(f, col.at0)}}>
        <div style={{display: 'inline-block', background: col.bg, border: `5px solid ${col.fg}`, borderRadius: 20, padding: '6px 26px'}}><H1 size={56} color={col.fg}>{col.t}</H1></div>
        <div style={{marginTop: 40, display: 'flex', flexDirection: 'column', gap: 34}}>
          {col.items.map(([t, at], i) => (
            <div key={i} style={{display: 'flex', gap: 24, alignItems: 'flex-start', ...pop(f, at)}}>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 60, color: col.fg, lineHeight: 1}}>{col.mark}</div>
              <Body size={44} color={C.ink}>{t}</Body>
            </div>
          ))}
        </div>
      </div>
    ))}
    <Character look={CAST.checker} pose={checkerPose(f, 10, notYet[0][1])} frame={f} x={1640} y={1010} scale={1.25} seed={3} />
  </div>
);

/* ---------- c29: the question ---------- */
export const Question: React.FC<{f: number; aAt: number; bAt: number}> = ({f, aAt, bAt}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 90, textAlign: 'center', ...pop(f, 0)}}><H1 size={80}>Which matters more?</H1></div>
    {[{t: 'THE STUNT', at: aAt, x: 200, air: true}, {t: 'THE ONE YOU CAN DRIVE', at: bAt, x: 1000, air: false}].map((k) => (
      <div key={k.t} style={{position: 'absolute', left: k.x, top: 260, width: 720, height: 640, ...card, textAlign: 'center', ...pop(f, k.at)}}>
        <svg viewBox="-400 -330 800 560" width={640} height={448} style={{marginTop: 30}}>
          <path d="M -380 200 L 380 200" stroke={C.inkSoft} strokeWidth={8} strokeLinecap="round" />
          <g transform={k.air ? `translate(0 ${-60 + Math.sin(f * 0.12) * 10}) rotate(${Math.sin(f * 0.08) * 6})` : 'translate(0 40)'}>
            <FrontCar tank={k.air} nozzles={k.air} body={k.air ? C.coral : C.blue} />
          </g>
          {k.air && [-1, 1].map((s) => <circle key={s} cx={s * 300} cy={150} r={22 + Math.abs(Math.sin(f * 0.2 + s)) * 14} fill={C.white} stroke={C.blue} strokeWidth={5} opacity={0.8} />)}
        </svg>
        <H1 size={60}>{k.t}</H1>
      </div>
    ))}
    <div style={{position: 'absolute', right: 40, bottom: 26}}><Chip text="illustration" kind="illus" size={24} /></div>
  </div>
);

/* ---------- c30: sources ---------- */
export const Sources: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', left: 240, right: 240, top: 150, height: 780, ...card, padding: '56px 80px', ...pop(f, 0)}}>
    <H1 size={64}>Sources</H1>
    <Body size={36} color={C.ink} style={{marginTop: 30, lineHeight: 1.55}}>
      Footage: Tesla's Roadster reveal livestream, Oct 15, 2026<br />
      Tesla Roadster page (trims, road-use wording)<br />
      Engadget live blog · TechCrunch · Electrek · InsideEVs · The Drive<br />
      0–60 figure: Tesla's own test, not independently timed<br />
      Diagrams: original illustrations, not Tesla's actual layout
    </Body>
    <Body size={30} color={C.inkMuted} style={{marginTop: 34}}>Full list and claim ledger in the description.</Body>
  </div>
);

export const _unused = {kf, SOFT};
