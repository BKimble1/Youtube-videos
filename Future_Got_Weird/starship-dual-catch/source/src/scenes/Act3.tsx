import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../kit/Stage';
import {Badge, Big, Cam, Note, Svg, Tag, Vignette, toScreen} from '../kit/ui';
import {hash, kf, lerp, ramp, out, io, inn} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X} from '../assets/Tower';
import {Starship} from '../assets/Starship';
import {SuperHeavy} from '../assets/SuperHeavy';
import {Earth, Sky, Clouds} from '../assets/Env';
import {Flame} from '../assets/Flame';
import {C, FONT, MONO} from '../theme';

// 2:36 - 2:55  orbit is sideways speed (Newton's cannonball)
export const OrbitScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('c1') - 6;
  const EX = 960;
  const EY = 1500;
  const R = 820;
  const zoomOut = ramp(f, fS('c3') - 6, fS('c3') + 40, io);
  const k = lerp(1.6, 0.62, zoomOut);
  const ey = lerp(EY + 520, 560, zoomOut);
  const er = R * k;
  // launch point at the top of the Earth
  const top = {x: EX, y: ey - er};
  // booster hop (c1), ship continuing (c2)
  const hop = ramp(f, a + 10, fS('c2') - 4, io);
  const shipGo = ramp(f, fS('c2') - 2, fS('c3') + 10, io);
  // cannonball arcs (c3): increasing sideways speed
  const shots = [0.35, 0.6, 1.0];
  const shotT = (i: number) => ramp(f, fS('c3') + 30 + i * 45, fS('c3') + 30 + i * 45 + (i === 2 ? 150 : 40), i === 2 ? (x: number) => x : io);
  const arc = (frac: number, t: number) => {
    // ellipse-ish path: angle swept around Earth vs altitude
    const sweep = frac >= 1 ? 360 * t : 140 * frac * t;
    const alt = frac >= 1 ? 0.12 : 0.12 * Math.sin(Math.min(1, t) * Math.PI) * (0.6 + frac);
    const pts: string[] = [];
    const n = 60;
    for (let j = 0; j <= n; j++) {
      const s = (j / n) * sweep;
      const h = frac >= 1 ? 0.12 : 0.12 * Math.sin(((j / n) * t) * Math.PI) * (0.6 + frac);
      const rr = er * (1 + (frac >= 1 ? Math.min(1, (j / n) * sweep / 20) * 0.12 : h));
      const ang = ((-90 + s) * Math.PI) / 180;
      pts.push(`${EX + rr * Math.cos(ang)},${ey + rr * Math.sin(ang)}`);
    }
    void alt;
    return pts.join(' ');
  };
  const orbitT = shotT(2);
  const oAng = ((-90 + 360 * orbitT) * Math.PI) / 180;
  const oR = er * 1.12;
  const shipPos = {x: EX + oR * Math.cos(oAng), y: ey + oR * Math.sin(oAng)};
  const speed = ramp(f, fS('c4') - 4, fS('c4') + 10, out);
  return (
    <AbsoluteFill style={{background: '#02040a'}}>
      <Svg>
        <Sky kind="night" stars={1} />
        <Earth cx={EX} cy={ey} r={er} rot={(f - a) * 0.02} />
        {zoomOut < 0.5 && (
          <g opacity={1 - zoomOut * 2}>
            {/* booster: short up-and-back hop */}
            {(() => {
              const L = {x: top.x - 420, y: top.y + 6};
              const hopP = (t: number) => ({x: (1 - t) ** 2 * L.x + 2 * (1 - t) * t * (L.x + 260) + t * t * (L.x + 60), y: (1 - t) ** 2 * L.y + 2 * (1 - t) * t * (L.y - 560) + t * t * (L.y - 6)});
              const shipP = (t: number) => ({x: (1 - t) ** 2 * L.x + 2 * (1 - t) * t * (L.x + 500) + t * t * (L.x + 1500), y: (1 - t) ** 2 * L.y + 2 * (1 - t) * t * (L.y - 620) + t * t * (L.y - 480)});
              const hp = hopP(hop);
              const sp = shipP(Math.min(1, 0.45 * hop + shipGo * 0.55));
              const pts = (fn: (t: number) => {x: number; y: number}, u: number) => Array.from({length: 30}, (_, i) => fn((i / 29) * u)).map((p) => `${p.x},${p.y}`).join(' ');
              return (
                <g>
                  <polyline points={pts(hopP, hop)} stroke={C.accent} strokeWidth={5} fill="none" strokeDasharray="14 10" />
                  <polyline points={pts(shipP, Math.min(1, 0.45 * hop + shipGo * 0.55))} stroke={C.accent2} strokeWidth={5} fill="none" strokeDasharray="14 10" />
                  <g transform={`translate(${hp.x} ${hp.y}) rotate(${lerp(10, -170, hop)}) scale(0.3) translate(0 360)`}><SuperHeavy t={f} catchPoint={false} /></g>
                  <g transform={`translate(${sp.x} ${sp.y}) rotate(${lerp(20, 95, shipGo)}) scale(0.3) translate(0 260)`}><Starship t={f} burn={shipGo < 1 ? 1 : 0} /></g>
                  <text x={L.x - 40} y={L.y - 420} fill={C.accent} fontFamily={MONO} fontWeight={700} fontSize={32} letterSpacing={2} opacity={hop}>BOOSTER: UP, THEN BACK</text>
                  <text x={L.x + 900} y={L.y - 600} fill={C.accent2} fontFamily={MONO} fontWeight={700} fontSize={32} letterSpacing={2} opacity={shipGo}>SHIP: KEEPS GOING</text>
                </g>
              );
            })()}
          </g>
        )}
        {zoomOut > 0.5 && (
          <g opacity={(zoomOut - 0.5) * 2}>
            {shots.map((fr, i) => {
              const t = shotT(i);
              if (t <= 0) return null;
              return <polyline key={i} points={arc(fr, t)} fill="none" stroke={i === 2 ? C.accent2 : '#ffffff'} strokeWidth={i === 2 ? 5 : 3} strokeDasharray={i === 2 ? '' : '10 8'} opacity={i === 2 ? 0.95 : 0.6} />;
            })}
            {orbitT > 0 && (
              <g transform={`translate(${shipPos.x} ${shipPos.y}) rotate(${(360 * orbitT)}) rotate(-90) scale(0.16) translate(0 260)`}>
                <Starship t={f} />
              </g>
            )}
            <text x={EX} y={ey - er - 140} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={2} opacity={ramp(f, fS('c3') + 40, fS('c3') + 55)}>MORE SIDEWAYS SPEED →</text>
          </g>
        )}
      </Svg>
      {speed > 0 && (
        <div style={{position: 'absolute', right: 110, top: 380, opacity: speed, textAlign: 'right'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 104, color: '#fff', letterSpacing: -2, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>≈ 28,000 km/h</div>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: '#9fd6ff', letterSpacing: 3}}>LOW EARTH ORBIT · ABOUT 7.8 KM EVERY SECOND</div>
        </div>
      )}
      <Badge text="SCHEMATIC · NOT TO SCALE" tone="info" />
    </AbsoluteFill>
  );
};

// Plasma sheath drawn in screen space beneath a horizontal, belly-down ship (windward = down).
const Plasma: React.FC<{x: number; y: number; w: number; k: number; f: number}> = ({x, y, w, k, f}) => (
  <g opacity={k} style={{mixBlendMode: 'screen'}}>
    <defs>
      <radialGradient id="plasmaG" cx="0.5" cy="0.2" r="0.7">
        <stop offset="0" stopColor="#fff2d8" stopOpacity={0.95} />
        <stop offset="0.25" stopColor="#ffb066" stopOpacity={0.8} />
        <stop offset="0.6" stopColor="#ff5d7a" stopOpacity={0.35} />
        <stop offset="1" stopColor="#7a3cff" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y + 30} rx={w * 0.62} ry={110 + 8 * Math.sin(f / 3)} fill="url(#plasmaG)" />
    <path d={`M ${x - w * 0.55} ${y} Q ${x} ${y + 60} ${x + w * 0.55} ${y}`} stroke="#fff6e6" strokeWidth={10} fill="none" opacity={0.85} />
    {Array.from({length: 14}, (_, i) => {
      const xx = x - w * 0.5 + hash(i) * w;
      const len = 200 + hash(i + 8) * 340;
      const off = ((f * 22 + hash(i + 2) * 400) % 400) - 200;
      return <line key={i} x1={xx - 40} y1={y - off * 0.2} x2={xx - 120} y2={y - len - off} stroke="#ffc59a" strokeWidth={3 + hash(i + 4) * 4} opacity={0.35} strokeLinecap="round" />;
    })}
  </g>
);

// 2:55 - 3:23  reentry: speed into heat, belly first, tiles, flaps
export const ReentryScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('c5') - 6;
  const glow = ramp(f, fS('c5') + 60, fS('c6') + 40);
  const tiles = ramp(f, fS('c7') - 6, fS('c7') + 20, io);
  const flaps = ramp(f, fS('c8') - 6, fS('c8') + 20, io);
  const shake = glow * (1 - tiles) * 2.2;
  const sx = Math.sin(f * 1.7) * shake;
  const sy = Math.cos(f * 2.3) * shake;
  const sky = glow < 0.5 ? 'high' : 'night';
  const fwd = flaps > 0 ? 18 * Math.sin((f - fS('c8')) / 13) : 6;
  const aft = flaps > 0 ? -16 * Math.sin((f - fS('c8')) / 13 + 1.4) : -6;
  const roll = flaps * 4 * Math.sin((f - fS('c8')) / 18);
  // camera: wide on the ship, then push into the tiles, then back for the flaps
  const s = lerp(lerp(1.15, 4.2, tiles), 1.25, flaps);
  const cx = lerp(lerp(0, 99, tiles), 0, flaps);
  const cyy = lerp(lerp(-260, -204, tiles), -260, flaps);
  // ship drawn rotated -76 deg: nose up-left, belly (tiles) facing down-right into the flow
  const pitch = -76 + roll;
  const isTile = tiles > 0.5 && flaps < 0.5;
  return (
    <AbsoluteFill style={{background: '#02040a'}}>
      <Svg>
        <Sky kind={sky as 'high' | 'night'} stars={1 - glow * 0.5} py={-200} />
        <Earth cx={960} cy={2600 - glow * 400} r={1900} />
        <rect x={0} y={0} width={1920} height={1080} fill="#ff6a3d" opacity={glow * 0.12} />
        <g transform={`translate(${960 + sx} ${560 + sy}) scale(${s}) translate(${-cx} ${-cyy})`}>
          <g transform={`translate(0 -260) rotate(${pitch}) translate(0 260)`}>
            {!isTile && <Plasma x={0} y={-180} w={0} k={0} f={f} />}
            <Starship t={f} fwd={fwd} aft={aft} plasma={glow * 0.8} />
          </g>
        </g>
        {!isTile && glow > 0 && (
          <g transform={`translate(${960 + sx} ${560 + sy})`}>
            <g transform={`rotate(${pitch + 90})`}>
              <Plasma x={0} y={50 * s} w={560 * s} k={glow * (1 - tiles)} f={f} />
            </g>
          </g>
        )}
      </Svg>
      <Svg>
        <Tag x={900} y={640} tx={560} ty={880} align="right" text="HEAT SHIELD" sub="thousands of hexagonal tiles" at={fS('c7') + 14} out={fS('c8') - 4} />
        <Tag x={720} y={500} tx={420} ty={260} align="right" text="FORWARD FLAPS" at={fS('c8') + 30} />
        <Tag x={1270} y={610} tx={1450} ty={860} text="AFT FLAPS" at={fS('c8') + 45} />
      </Svg>
      {f < fS('c6') && <Big text="All that speed has to go somewhere." at={fS('c5') + 10} size={58} y={170} />}
      <Badge text="ILLUSTRATION · REENTRY" tone="info" />
      <Vignette k={0.6} />
    </AbsoluteFill>
  );
};

// 3:23 - 3:55  the flip, past ocean landings, and the new requirement
export const FlipScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('c9') - 6;
  const flipStart = fS('c10') + 30;
  const flipEnd = flipStart + 105;
  const fl = ramp(f, flipStart, flipEnd, io);
  const ang = lerp(-88, 0, fl);
  const burn = ramp(f, flipStart - 10, flipStart + 6) * (fl < 1 ? 1 : 0.85);
  const ocean = f >= fS('c11') && f < fS('c12');
  const chain = f >= fS('c12');
  // falling: background streams upward
  const yScroll = (f - a) * 18;
  return (
    <AbsoluteFill>
      {!ocean && !chain && (
        <Svg>
          <Sky kind="day" py={200} />
          <Clouds y={((900 - yScroll * 0.6) % 1600 + 1600) % 1600 - 300} dx={0} tone="#ffffff" op={0.7} />
          <Clouds y={((300 - yScroll * 0.9) % 1600 + 1600) % 1600 - 300} dx={400} tone="#ffffff" op={0.55} seed={5} />
          <g transform={`translate(960 520) scale(1.05) rotate(${ang} 0 -260) translate(0 0)`}>
            <g transform="translate(0 260)">
              <Starship t={f} burn={burn} fwd={lerp(10, -10, fl)} aft={lerp(-12, -14, fl)} />
            </g>
          </g>
        </Svg>
      )}
      {ocean && <OceanLanding />}
      {chain && <Chain />}
      {!ocean && !chain && f >= fS('c10') && <Svg><Tag x={960} y={420} tx={1260} ty={230} text="THE FLIP" sub="horizontal to vertical in seconds" at={flipStart + 10} /></Svg>}
      {!ocean && !chain && <Badge text="ILLUSTRATION" tone="info" />}
      <Vignette k={0.45} />
    </AbsoluteFill>
  );
};

// Past ship flights ended with controlled ocean splashdowns (no tower). Illustration, not footage.
const OceanLanding: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('c11');
  const u = Math.min(1, (f - a) / 150);
  const y = 820 - 560 * (1 - u) * (1 - u);
  const tower = ramp(f, a + Math.round(6.3 * 30), a + Math.round(6.3 * 30) + 14);
  return (
    <AbsoluteFill>
      <Svg>
        <Sky kind="dusk" sun={{x: 1500, y: 860}} />
        <rect x={0} y={860} width={1920} height={220} fill="#1d3550" />
        {Array.from({length: 18}, (_, i) => (
          <line key={i} x1={hash(i) * 1920} y1={880 + hash(i + 4) * 180} x2={hash(i) * 1920 + 80} y2={880 + hash(i + 4) * 180} stroke="#5d86ad" strokeWidth={2} opacity={0.5} />
        ))}
        <g transform={`translate(760 ${y}) scale(0.62)`}>
          <Starship t={f} burn={u < 1 ? 0.7 : 0} />
        </g>
        {u >= 1 && <ellipse cx={760} cy={866} rx={140 + (f - a - 150) * 2} ry={18} fill="#d8ecff" opacity={Math.max(0, 0.7 - (f - a - 150) / 40)} />}
        {tower > 0 && (
          <g opacity={tower}>
            <rect x={1320} y={380} width={46} height={480} fill="#1c2430" />
            <rect x={1366} y={520} width={120} height={22} fill="#2c3644" />
            <text x={1420} y={330} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={900} fontSize={90} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={6}>?</text>
          </g>
        )}
      </Svg>
      <div style={{position: 'absolute', left: 60, top: 140, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: '#fff', letterSpacing: 2, lineHeight: 1.6, opacity: ramp(f, a + 8, a + 20)}}>
        <div>2020–21 · LOW TEST HOPS (PROTOTYPES)</div>
        <div>2024–26 · FLIGHTS TO SPACE → OCEAN SPLASHDOWNS</div>
        <div style={{color: C.accent, opacity: tower}}>A TOWER · NEVER</div>
      </div>
      <Badge text="ILLUSTRATION · PAST OCEAN SPLASHDOWN" tone="info" />
    </AbsoluteFill>
  );
};

const Chain: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('c12');
  const steps = ['SURVIVE REENTRY', 'FLIP', 'SLOW DOWN', 'LINE UP AT THE TOWER'];
  const at = [a + 10, a + Math.round(4.3 * 30), a + Math.round(5.2 * 30), a + Math.round(6.4 * 30)];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #121a2b, #1d2a44)'}}>
      <Svg>
        {steps.map((s, i) => {
          const o = ramp(f, at[i], at[i] + 12, out);
          const x = 290 + i * 450;
          return (
            <g key={s} opacity={o} transform={`translate(${x} 560)`}>
              <circle r={120} fill="rgba(255,255,255,0.05)" stroke={i === 3 ? C.accent : '#5d6f8a'} strokeWidth={4} />
              <g transform={`scale(0.3) rotate(${i === 0 ? -76 : i === 1 ? -40 : 0}) translate(0 260)`}>
                <Starship t={f} burn={i >= 1 ? 0.6 : 0} plasma={i === 0 ? 0.8 : 0} />
              </g>
              {i === 3 && <rect x={-110} y={-60} width={14} height={180} fill="#56626f" />}
              <text y={180} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={2}>{s}</text>
              {i < 3 && <path d="M 150 0 L 290 0 M 270 -14 L 290 0 L 270 14" stroke="#8aa0bf" strokeWidth={4} fill="none" opacity={ramp(f, at[i + 1] - 6, at[i + 1] + 4)} />}
            </g>
          );
        })}
      </Svg>
      <Big text="…after a trip through space." at={a + 4} size={56} y={200} />
    </AbsoluteFill>
  );
};
