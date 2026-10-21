// 2:26–3:52 Why the ship is harder: the booster's short loop vs orbit (sideways speed), Flight 14, energy into the air;
// reentry belly-first behind the heat shield, plasma, four flaps, belly flop, the flip and landing burn, never at a tower.
import React from 'react';
import {Cam, Cloud, Earth, Frame, Sea, Sky, Stars, World} from '../assets/env';
import {Booster, Ship, R, SHIP_LEN} from '../assets/vehicles';
import {Ground, Tower, VEH_X} from '../assets/tower';
import {ShipCatch} from '../kit/catch';
import {clamp, ep, keys, lerp, ls, le, noise, prog, wt, smoother} from '../kit/anim';
import {BigText, C, Callout, Chip, FONT, Mark} from '../kit/ui';
import {Shot} from '../kit/timeline';

/** Booster done, ship unknown. */
const O1: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('c1');
  return (
    <Frame bg="#141a21">
      <rect width={1920} height={1080} fill="#18202a" />
      <g transform={`translate(600 900) scale(8.5)`}><Booster t={t} /></g>
      <g transform={`translate(1320 860) scale(8.5)`}><Ship t={t} view="three" /></g>
      <Mark x={600} y={200} ok o={ep(u, 0.0, 0.3)} s={52} />
      <g opacity={ep(u, 0.3, 0.6)}>
        <circle cx={1320} cy={200} r={52} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
        <text x={1320} y={228} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={80} fill={C.ink}>?</text>
      </g>
    </Frame>
  );
};

/** Earth-curvature diagram: the booster's short loop (home in ≈7 min) vs the ship carrying on. */
const O2: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('c2');
  const site = [560, 820];
  const loop = ep(u, 0.3, 2.6);
  const shipGo = ep(u, 1.2, 4.5);
  const loopPath = `M${site[0]} ${site[1]} C ${site[0] + 60} ${site[1] - 300}, ${site[0] + 420} ${site[1] - 420}, ${site[0] + 520} ${site[1] - 380} C ${site[0] + 560} ${site[1] - 340}, ${site[0] + 200} ${site[1] - 250}, ${site[0] + 8} ${site[1] - 6}`;
  const shipPath = `M${site[0] + 520} ${site[1] - 380} C ${site[0] + 900} ${site[1] - 520}, ${site[0] + 1300} ${site[1] - 500}, ${site[0] + 1500} ${site[1] - 420}`;
  return (
    <Frame>
      <Sky kind="high" />
      <Stars o={0.6} t={t} />
      <Earth cx={960} cy={3400} r={2620} rot={-12} />
      <path d={loopPath} fill="none" stroke={C.teal} strokeWidth={8} strokeDasharray={`${1500 * loop} 3000`} strokeLinecap="round" />
      <path d={shipPath} fill="none" stroke={C.yellow} strokeWidth={8} strokeDasharray={`${1100 * shipGo} 3000`} strokeLinecap="round" />
      <circle cx={site[0]} cy={site[1]} r={14} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <Callout text="BOOSTER" sub="turns back · home in about 7 minutes" x={130} y={300} o={ep(u, 0.6, 1.0)} size={32} />
      <Callout text="SHIP" sub="keeps going" x={1400} y={170} o={ep(u, 2.0, 2.5)} size={32} />
      <Chip text="SCHEMATIC · NOT TO SCALE" x={44} y={1036} />
    </Frame>
  );
};

/** Newton's cannon: faster sideways throws land farther, until the ground curves away → orbit. */
const O3: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('c3');
  const cx = 960, cy = 620, r = 300;
  const top = [cx, cy - r - 20];
  const throws = [0.35, 0.6, 0.85, 1.0];
  return (
    <Frame>
      <Sky kind="space" />
      <Stars o={0.8} t={t} />
      <Earth cx={cx} cy={cy} r={r} rot={u * 2} />
      {throws.map((v, i) => {
        const p = ep(u, 0.4 + i * 1.1, 1.4 + i * 1.1);
        if (p <= 0) return null;
        let d: string;
        if (v < 1) {
          const end = (Math.PI / 2) * v * 1.5;
          const ex = cx + Math.sin(end) * (r + 2), ey = cy - Math.cos(end) * (r + 2);
          d = `M${top[0]} ${top[1]} Q ${cx + 300 * v} ${top[1] - 10}, ${ex} ${ey}`;
        } else {
          d = `M${top[0]} ${top[1]} A ${r + 20} ${r + 20} 0 1 1 ${top[0] - 0.1} ${top[1]}`;
        }
        return <path key={i} d={d} fill="none" stroke={v < 1 ? C.cream : C.yellow} strokeWidth={v < 1 ? 5 : 7} strokeDasharray={`${2400 * p} 3000`} strokeLinecap="round" opacity={v < 1 ? 0.75 : 1} />;
      })}
      <g opacity={ep(t, wt('c3', 'up') - 0.3, wt('c3', 'up'))}>
        <path d="M360 760 L360 600" stroke={C.cream} strokeWidth={10} strokeLinecap="round" />
        <path d="M335 625 L360 590 L385 625" fill="none" stroke={C.cream} strokeWidth={10} strokeLinecap="round" />
        <text x={360} y={810} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={40} fill={C.cream}>UP</text>
      </g>
      <g opacity={ep(t, wt('c3', 'sideways') - 0.3, wt('c3', 'sideways'))}>
        <path d="M1380 760 L1700 760" stroke={C.yellow} strokeWidth={18} strokeLinecap="round" />
        <path d="M1660 720 L1712 760 L1660 800" fill="none" stroke={C.yellow} strokeWidth={18} strokeLinecap="round" />
        <text x={1540} y={840} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={48} fill={C.yellow}>SIDEWAYS</text>
      </g>
      <Chip text="NEWTON'S CANNON · SCHEMATIC" x={44} y={1036} />
    </Frame>
  );
};

/** Pull back: the ship circling Earth at ~17,000 mph. */
const O4: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('c4');
  const z = keys(u, [[0, 1.5], [3, 1.0]]);
  const r = 300 * z, ro = r + 40 * z;
  const a = u * 0.55 - 1.2;
  const sx = 960 + Math.cos(a) * ro, sy = 560 + Math.sin(a) * ro;
  const fall = ep(t, wt('c4', 'fall') - 0.2, wt('c4', 'curves') + 0.3);
  return (
    <Frame>
      <Sky kind="space" />
      <Stars o={0.85} t={t} />
      <Earth cx={960} cy={560} r={r} rot={u * 3} />
      <circle cx={960} cy={560} r={ro} fill="none" stroke={C.yellow} strokeWidth={3} strokeDasharray="10 10" opacity={0.8} />
      <g transform={`translate(${sx} ${sy}) rotate(${(a * 180) / Math.PI + 180}) scale(3.2)`}>
        <Ship t={t} view="profile" fwdFlap={0.2} aftFlap={0.3} />
      </g>
      {/* falling-around arrows */}
      <g opacity={fall}>
        <path d={`M${sx} ${sy} L${sx + Math.cos(a + Math.PI / 2) * 160} ${sy + Math.sin(a + Math.PI / 2) * 160}`} stroke={C.cream} strokeWidth={7} strokeLinecap="round" />
        <path d={`M${sx} ${sy} L${sx - Math.cos(a) * 90} ${sy - Math.sin(a) * 90}`} stroke={C.orange} strokeWidth={7} strokeLinecap="round" />
      </g>
      <Callout text="≈ 17,000 MPH" sub="about 7.8 km/s · orbital speed" x={1300} y={190} o={ep(t, wt('c4', 'Roughly') - 0.2, wt('c4', 'Roughly') + 0.3)} size={44} />
      <Callout text="falling, and missing the ground" x={150} y={170} o={fall} size={28} />
    </Frame>
  );
};

/** Flight 14 (Sept 2026): first time in orbit; splashdown north of Hawaii ≈3 h after launch. Schematic globe path. */
const O5: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('c5');
  const p = ep(u, 0.4, 5.0, (x) => x);
  const cx = 960, cy = 560, r = 380;
  // a schematic ground track: points on a flattened globe (not an orbital computation)
  const pts: [number, number][] = [];
  for (let i = 0; i <= 120; i++) {
    const k = i / 120;
    const lon = -1.2 + k * 2.4 * 1.6;
    const lat = 0.42 * Math.sin(lon * 1.0 + 0.6);
    const vis = Math.cos(lon - 0.3);
    pts.push([cx + Math.sin(lon - 0.3) * r * Math.cos(lat), cy - Math.sin(lat) * r + (vis < 0 ? 0 : 0)]);
  }
  const n = Math.max(2, Math.floor(pts.length * p));
  const d = 'M' + pts.slice(0, n).map((q) => `${q[0]} ${q[1]}`).join(' L');
  return (
    <Frame>
      <Sky kind="space" />
      <Stars o={0.8} t={t} />
      <Earth cx={cx} cy={cy} r={r} rot={-30} />
      <path d={d} fill="none" stroke={C.yellow} strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round" />
      <circle cx={pts[0][0]} cy={pts[0][1]} r={12} fill={C.cream} stroke={C.ink} strokeWidth={4} />
      <Callout text="FLIGHT 14 · SEPT 2026" sub="the ship reaches orbit for the first time" x={110} y={140} o={ep(u, 0.2, 0.6)} size={34} />
      <Callout text="splashdown, North Pacific" sub="≈ 3 hours after launch" x={1290} y={820} o={ep(t, wt('c5', 'Pacific') - 0.2, wt('c5', 'Pacific') + 0.3)} size={30} />
      <Chip text="SCHEMATIC PATH · NOT THE ACTUAL GROUND TRACK" x={44} y={1036} />
    </Frame>
  );
};

/** Speed has to go somewhere: into the air. */
const O6: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('c6');
  const glow = ep(t, wt('c6', 'air') - 0.6, wt('c6', 'air') + 0.3);
  const arrow = lerp(620, 200, ep(u, 0.6, 4.5));
  return (
    <Frame>
      <Sky kind="space" kind2="high" mix={ep(u, 0, 4)} />
      <Stars o={0.7 - 0.4 * glow} t={t} />
      <Earth cx={960} cy={2200} r={1500} rot={8} />
      <ReentryShip t={t} heat={glow * 0.8} scale={9} x={760} y={480} aoa={8} />
      <path d={`M${1180} 330 L${1180 + arrow} 330`} stroke={C.yellow} strokeWidth={16} strokeLinecap="round" />
      <path d={`M${1180 + arrow - 34} 300 L${1180 + arrow + 6} 330 L${1180 + arrow - 34} 360`} fill="none" stroke={C.yellow} strokeWidth={16} strokeLinecap="round" />
      <text x={1180} y={290} fontFamily={FONT.ui} fontWeight={800} fontSize={30} fill={C.cream}>SPEED</text>
      <Callout text="speed → heat" sub="the air absorbs the energy" x={1180} y={760} o={glow} size={34} />
      <Chip text="ILLUSTRATION · REENTRY" x={44} y={1036} />
    </Frame>
  );
};

// ---------------- reentry ----------------

/** Ship in belly-first reentry attitude, nose to the right, seen from the side; flow arrives from below-right. */
const ReentryShip: React.FC<{t: number; heat: number; trim?: number; scale: number; x: number; y: number; aoa?: number}> = ({t, heat, trim = 0, scale, x, y, aoa = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${-aoa})`}>
    <ellipse cx={0} cy={scale * 7} rx={scale * 34} ry={scale * 8} fill="url(#glowPlasma)" opacity={heat} />
    <path d={`M${-scale * 30} ${scale * 6} Q 0 ${scale * 16} ${scale * 32} ${scale * 4}`} fill="none" stroke="#ffe7c4" strokeWidth={scale * 1.2} opacity={heat * 0.8} />
    <g transform={`scale(${scale}) rotate(90) scale(-1 1) translate(0 ${SHIP_LEN / 2})`}>
      <g transform="translate(0 0)">
        <Ship t={t} view="profile" heat={heat} fwdFlap={0.7 + 0.2 * trim} aftFlap={0.7 - 0.2 * trim} />
      </g>
    </g>
  </g>
);

const D1: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('d1');
  const heat = 0.25 + 0.3 * ep(u, 0, 7);
  const tiles = ep(t, wt('d1', 'black') - 0.2, wt('d1', 'black') + 0.3);
  return (
    <Frame>
      <Sky kind="space" kind2="high" mix={0.6} />
      <Stars o={0.5} t={t} />
      {/* oncoming air (relative flow from below and ahead) */}
      {Array.from({length: 26}, (_, i) => {
        const k = ((u * 1.6 + i / 26) % 1);
        const x0 = 300 + ((i * 173) % 1500), y0 = 1150 - k * 700;
        return <line key={i} x1={x0} y1={y0} x2={x0 - 50} y2={y0 + 90} stroke="#cfe6ff" strokeWidth={3} opacity={0.35 * (1 - k)} strokeLinecap="round" />;
      })}
      <ReentryShip t={t} heat={heat} scale={22} x={960} y={520} aoa={0} />
      <Callout text="HEAT SHIELD" sub="thousands of black tiles" x={1150} y={760} to={[1000, 600]} o={tiles} size={36} />
      <Callout text="belly first" x={200} y={180} o={ep(u, 0.3, 0.8)} size={30} />
      <Chip text="ILLUSTRATION · REENTRY ATTITUDE (SIMPLIFIED)" x={44} y={1036} />
    </Frame>
  );
};

const D2: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('d2');
  const heat = 0.55 + 0.4 * ep(u, 0, 3);
  const sh = ep(t, wt('d2', 'steel') - 0.2, wt('d2', 'steel') + 0.3);
  return (
    <Frame>
      <Sky kind="high" />
      <rect width={1920} height={1080} fill="#ff7a3a" opacity={0.08 * heat} />
      <g transform={`translate(${noise(t * 6, 2) * 3} ${noise(t * 6, 5) * 3})`}>
        <ReentryShip t={t} heat={heat} scale={28} x={960} y={460} />
        {/* shock layer */}
        <path d={`M${960 - 28 * 30} ${460 + 28 * 9} Q 960 ${460 + 28 * 22} ${960 + 28 * 30} ${460 + 28 * 7}`} fill="none" stroke="#fff3df" strokeWidth={10} opacity={0.75 * heat} />
      </g>
      <Callout text="PLASMA" sub="air squeezed until it glows" x={1250} y={840} to={[1100, 760]} o={ep(t, wt('d2', 'plasma') - 0.3, wt('d2', 'plasma') + 0.2)} size={36} />
      <Callout text="steel side in the shadow" x={150} y={170} to={[700, 400]} o={sh} size={28} />
      <Chip text="ILLUSTRATION" x={44} y={1036} />
    </Frame>
  );
};

/** Belly view from below: four flaps steering like a skydiver's arms and legs. */
const D3: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('d3');
  const trim = Math.sin(u * 1.6);
  const roll = trim * 6;
  const o = ep(t, wt('d3', 'four') - 0.2, wt('d3', 'four') + 0.3);
  return (
    <Frame>
      <Sky kind="high" kind2="day" mix={0.3} />
      {Array.from({length: 6}, (_, i) => <Cloud key={i} x={((i * 377 + u * 60) % 2200) - 140} y={880 + (i % 3) * 60} s={1.4} o={0.8} />)}
      <g transform={`translate(960 520) rotate(${90 + roll}) scale(14) translate(0 ${SHIP_LEN / 2})`}>
        <Ship t={t} view="belly" fwdFlap={0.75 + 0.25 * trim} aftFlap={0.75 - 0.25 * trim} flapTrim={trim * 0.6} heat={0.15} />
      </g>
      <g opacity={o}>
        {[[691, 425], [691, 615], [1166, 445], [1166, 595]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={52} fill="none" stroke={C.yellow} strokeWidth={6} />)}
      </g>
      <Callout text="4 FLAPS" sub="2 near the nose · 2 at the tail" x={1420} y={140} o={o} size={36} />
      {/* skydiver analogy */}
      <g transform="translate(250 870)" opacity={ep(t, wt('d3', 'skydiver') - 0.2, wt('d3', 'skydiver') + 0.3)}>
        <circle r={100} fill={C.cream} stroke={C.ink} strokeWidth={5} />
        <g transform={`rotate(${roll * 2})`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none">
          <circle cx={0} cy={-38} r={14} fill={C.ink} />
          <path d="M0 -24 L0 26" />
          <path d={`M0 -12 L-46 ${-34 - 10 * trim} M0 -12 L46 ${-34 + 10 * trim}`} />
          <path d={`M0 26 L-34 ${66 + 8 * trim} M0 26 L34 ${66 - 8 * trim}`} />
        </g>
      </g>
      <Chip text="ILLUSTRATION · VIEW FROM BELOW" x={44} y={1036} />
    </Frame>
  );
};

/** Belly flop down through the atmosphere. */
const D4: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('d4');
  const mix = ep(u, 0, 5.5);
  return (
    <Frame>
      <Sky kind="high" kind2="day" mix={mix} />
      {Array.from({length: 9}, (_, i) => {
        const y = 1250 - (((i * 230 + u * 300) % 1600));
        return <Cloud key={i} x={(i * 263) % 1920} y={y} s={1.1 + (i % 3) * 0.5} o={0.9} />;
      })}
      <ReentryShip t={t} heat={0.3 * (1 - mix)} trim={0.4 * Math.sin(u * 1.3)} scale={11} x={960} y={500 + noise(t, 3) * 6} />
      <Callout text="BELLY FLOP" sub="falling sideways, flaps steering" x={1240} y={170} o={ep(u, 0.3, 0.8)} size={36} />
      <Chip text="ILLUSTRATION" x={44} y={1036} />
    </Frame>
  );
};

/** The flip: engines light, the ship swings vertical, landing burn. */
const D5: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('d5');
  const tl = wt('d6', 'light') - 0.1;
  const flip = ep(t, tl, tl + 2.3, (x) => smoother(x));
  const eng = ep(t, tl - 0.15, tl + 0.2);
  const ang = lerp(90, 0, flip); // 90 = horizontal (nose right), 0 = vertical
  const fall = (t - t0) * 2;
  const cam: Cam = {x: 0, y: -26 + fall, z: 9.5};
  return (
    <Frame>
      <Sky kind="day" />
      {Array.from({length: 7}, (_, i) => {
        const y = 1250 - (((i * 260 + (t - t0) * (eng > 0 ? 120 : 260)) % 1600));
        return <Cloud key={i} x={(i * 301) % 1920} y={y} s={1.2} o={0.85} />;
      })}
      <World cam={cam}>
        <g transform={`translate(0 ${fall - 26}) rotate(${ang}) scale(-1 1) translate(0 ${SHIP_LEN / 2})`}>
          <Ship t={t} view="profile" engines={eng} plumeLen={36} fwdFlap={lerp(0.7, 0.2, flip)} aftFlap={lerp(0.7, 0.4, flip)} />
        </g>
      </World>
      <Callout text="ENGINES LIGHT" x={1250} y={180} o={eng * (1 - ep(t, tl + 1.0, tl + 1.4))} size={34} />
      <Callout text="HORIZONTAL → VERTICAL" sub="in seconds" x={1150} y={180} o={ep(t, tl + 1.0, tl + 1.4)} size={34} />
      <Chip text="ILLUSTRATION · FLIP AND LANDING BURN" x={44} y={1036} />
    </Frame>
  );
};

/** Done over the ocean; never into a tower. */
const D7: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('d7');
  const u = t - t0;
  const right = ep(t, wt('d7', 'never') - 0.3, wt('d7', 'never') + 0.2);
  const shipY = lerp(-60, -4, clamp(u / 2.6));
  return (
    <Frame>
      <defs>
        <clipPath id="d7L"><rect width={960} height={1080} /></clipPath>
        <clipPath id="d7R"><rect x={960} width={960} height={1080} /></clipPath>
      </defs>
      <g clipPath="url(#d7L)">
        <Sky kind="day" />
        <Sea y={720} t={t} />
        <g transform={`translate(480 ${720 + 18 + shipY * 5}) scale(5)`}>
          <Ship t={t} view="profile" engines={shipY < -5 ? 0.85 : 0} plumeLen={14} fwdFlap={0.2} aftFlap={0.4} />
        </g>
        {shipY > -5 ? <ellipse cx={480} cy={740} rx={130} ry={24} fill="#fff" stroke={C.ink} strokeWidth={3} opacity={0.9} /> : null}
        <Chip text="DONE · OVER THE OCEAN" x={40} y={60} anchor="tl" accent={C.teal} size={22} />
      </g>
      <g clipPath="url(#d7R)" opacity={1}>
        <g transform="translate(480 0)">
          <svg width={1920} height={1080} overflow="visible">
            <ShipCatch t={t} cam={{x: VEH_X - 6, y: -90, z: 5.2}} light="dusk" s={{gap: 2, open: 10, engines: 0}} clouds={false} />
          </svg>
        </g>
        <rect x={960} width={960} height={1080} fill="#0c1016" opacity={0.35 * (1 - right)} />
        <Chip text="NEVER DONE · INTO A TOWER" x={1880} y={60} anchor="tr" accent={C.yellow} size={22} o={right} />
      </g>
      <rect x={957} width={6} height={1080} fill={C.ink} />
      <Chip text="ILLUSTRATIONS · RIGHT: CONCEPT, NOT YET ATTEMPTED" x={44} y={1036} />
    </Frame>
  );
};

export const orbitShots = (): Shot[] => [
  {id: 'O1', a: ls('c1') - 0.2, b: ls('c2'), render: (t) => <O1 t={t} />, tin: 'dip'},
  {id: 'O2', a: ls('c2'), b: ls('c3'), render: (t) => <O2 t={t} />, tin: 'fade'},
  {id: 'O3', a: ls('c3'), b: ls('c4'), render: (t) => <O3 t={t} />, tin: 'fade'},
  {id: 'O4', a: ls('c4'), b: ls('c5'), render: (t) => <O4 t={t} />, tin: 'fade'},
  {id: 'O5', a: ls('c5'), b: ls('c6'), render: (t) => <O5 t={t} />, tin: 'fade'},
  {id: 'O6', a: ls('c6'), b: ls('d1'), render: (t) => <O6 t={t} />, tin: 'fade'},
  {id: 'D1', a: ls('d1'), b: ls('d2'), render: (t) => <D1 t={t} />, tin: 'flash'},
  {id: 'D2', a: ls('d2'), b: ls('d3'), render: (t) => <D2 t={t} />, tin: 'fade'},
  {id: 'D3', a: ls('d3'), b: ls('d4'), render: (t) => <D3 t={t} />, tin: 'whipU'},
  {id: 'D4', a: ls('d4'), b: ls('d5'), render: (t) => <D4 t={t} />, tin: 'fade'},
  {id: 'D5', a: ls('d5'), b: ls('d7'), render: (t) => <D5 t={t} />, tin: 'fade'},
  {id: 'D7', a: ls('d7'), b: ls('e1'), render: (t) => <D7 t={t} />, tin: 'whipL'},
];
void Ground; void Tower; void prog; void le; void BigText; void R; void Mark;
