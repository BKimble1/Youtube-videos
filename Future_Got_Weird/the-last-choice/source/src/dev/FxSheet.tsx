// FX check sheet (pages via `page`; render several frames to see progressions).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, CITY} from '../theme';
import {F} from '../theme';
import {Fire, Embers, Glow, LightShaft, Smoke, Dust, Steam, SteamClip, steamBounds, Debris, GlassShards, Sparks, Fluid, Blast, Charge} from '../fx';

const Cell: React.FC<{i: number; label: string; bg: string; children: React.ReactNode}> = ({i, label, bg, children}) => {
  const x = (i % 3) * 640, y = Math.floor(i / 3) * 540;
  return (
    <g>
      <clipPath id={`fxc${i}`}><rect x={x} y={y} width={640} height={540} /></clipPath>
      <g clipPath={`url(#fxc${i})`}>
        <rect x={x} y={y} width={640} height={540} fill={bg} />
        <g transform={`translate(${x} ${y})`}>{children}</g>
      </g>
      <rect x={x} y={y} width={640} height={540} fill="none" stroke="#000" strokeWidth={2} />
      <text x={x + 14} y={y + 30} fontFamily={F.body} fontWeight={800} fontSize={22} fill="#fff" stroke="#000" strokeWidth={4} paintOrder="stroke">{label}</text>
    </g>
  );
};

export const FxSheet: React.FC<{page: number}> = ({page}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const dark = '#2B1B26', mid = '#6B5A55', light = '#CFC6B8';
  const G = 470;
  let cells: React.ReactNode = null;
  if (page === 0) {
    cells = (
      <>
        <Cell i={0} label="Fire (building, big)" bg={dark}><Fire x={320} y={G} w={380} h={330} t={t} seed={3} /></Cell>
        <Cell i={1} label="Fire (window / small) + embers" bg={dark}>
          <rect x={150} y={260} width={150} height={200} fill={CITY.window} stroke={C.ink} strokeWidth={4} /><Fire x={225} y={455} w={120} h={150} t={t} seed={5} intensity={0.9} />
          <Fire x={470} y={455} w={70} h={80} t={t} seed={8} intensity={0.8} />
          <Embers x={80} y={60} w={480} h={400} t={t} seed={2} n={30} />
        </Cell>
        <Cell i={2} label="Smoke column (dark)" bg={CITY.skyLow}><Smoke x={320} y={480} t={t + 6} seed={4} color={CITY.smoke} shade="#211A1D" vx={30} vy={-110} size={34} grow={30} life={5} rate={5} spread={40} /></Cell>
        <Cell i={3} label="Smoke cloud (drifting haze)" bg={CITY.skyMid}><Smoke mode="cloud" x={320} y={280} w={700} h={260} t={t} seed={6} color={CITY.smokeLight} opacity={0.6} drift={25} n={18} /></Cell>
        <Cell i={4} label="Ash + glow" bg={mid}><Glow x={320} y={300} r={220} color={CITY.fire} opacity={0.6} t={t} flicker={0.2} /><Embers x={40} y={40} w={560} h={480} t={t} seed={9} kind="ash" n={30} wind={-20} /></Cell>
        <Cell i={5} label="Light shaft (refuge)" bg="#8C7E66"><LightShaft x={200} y={0} angle={70} length={600} w0={90} w1={300} t={t} dust={12} opacity={0.5} /></Cell>
      </>
    );
  } else if (page === 1) {
    cells = (
      <>
        <Cell i={0} label="Debris: concrete (t0 0.2)" bg={light}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><Debris x={320} y={G - 40} t={t} t0={0.2} seed={2} ground={G} speed={[300, 1100]} /></Cell>
        <Cell i={1} label="Debris: metal + panel" bg={light}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><Debris x={250} y={G - 160} t={t} t0={0.2} seed={4} ground={G} material="metal" dir={-60} n={10} /><Debris x={420} y={G - 160} t={t} t0={0.35} seed={6} ground={G} material="panel" dir={-120} n={8} size={[14, 34]} /></Cell>
        <Cell i={2} label="Glass shards" bg={mid}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><GlassShards x={320} y={260} t={t} t0={0.2} seed={3} ground={G} dir={-30} spread={160} speed={[200, 900]} /></Cell>
        <Cell i={3} label="Sparks: burst" bg={dark}><Sparks x={320} y={300} t={t} t0={0.2} seed={5} n={30} speed={[300, 900]} /></Cell>
        <Cell i={4} label="Sparks: stream (cut cable 0.2-1.6)" bg={dark}><Sparks x={240} y={200} t={t} t0={0.2} t1={1.6} seed={7} mode="stream" dir={20} spread={50} rate={40} /></Cell>
        <Cell i={5} label="Dust (impact 0.2)" bg={light}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><Dust x={320} y={G} t={t} t0={0.2} seed={2} size={140} /></Cell>
      </>
    );
  } else if (page === 2) {
    cells = (
      <>
        <Cell i={0} label="Fluid spray (0.2)" bg={light}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><Fluid x={200} y={250} t={t} t0={0.2} seed={2} mode="spray" dir={-20} ground={G} size={90} /></Cell>
        <Cell i={1} label="Fluid stream (0.2-2.4)" bg={light}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><Fluid x={150} y={230} t={t} t0={0.2} t1={2.4} seed={3} mode="stream" dir={-15} speed={650} ground={G} size={70} /></Cell>
        <Cell i={2} label="Fluid drip + puddle" bg={light}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><rect x={240} y={120} width={160} height={40} fill="#5B6670" stroke={C.ink} strokeWidth={4} /><Fluid x={320} y={160} t={t} t0={0} seed={4} mode="drip" ground={G} size={80} /></Cell>
        <Cell i={3} label="Charge (0.2 → 1.0)" bg={CITY.skyLow}><Charge x0={40} y0={420} x1={600} y1={180} t={t} t0={0.2} t1={1.0} arc={60} /></Cell>
        <Cell i={4} label="Puddle growth" bg={light}><Fluid x={320} y={400} t={t} t0={0} mode="puddle" size={200} /></Cell>
        <Cell i={5} label="(blank)" bg={light}><g /></Cell>
      </>
    );
  } else {
    const sb = {x0: 330, y0: 110, x1: 630, y1: 470};
    cells = (
      <>
        <Cell i={0} label="Blast (t0 0.2), ground" bg={CITY.skyLow}><line x1={0} y1={G} x2={640} y2={G} stroke={C.ink} strokeWidth={3} /><Blast x={320} y={G - 120} t={t} t0={0.2} seed={2} size={130} ground={G} /></Cell>
        <Cell i={1} label="Blast (air, panel debris)" bg={dark}><Blast x={320} y={260} t={t} t0={0.2} seed={4} size={110} debrisMaterial="panel" /></Cell>
        <Cell i={2} label="Steam jet" bg={CITY.steelDark}><rect x={0} y={420} width={640} height={30} fill={CITY.steel} stroke={C.ink} strokeWidth={4} /><Steam x={260} y={420} t={t + 3} dir={-75} length={380} width={180} seed={3} /></Cell>
        <Cell i={3} label="Steam cloud + clipped projection" bg={CITY.steelDark}>
          <Steam mode="cloud" x0={sb.x0 - 300} y0={sb.y0} x1={sb.x1 - 300} y1={sb.y1} t={t} seed={5} density={1.4} />
          <defs><SteamClip clipId="sclip" mode="cloud" x0={sb.x0 - 300} y0={sb.y0} x1={sb.x1 - 300} y1={sb.y1} t={t} seed={5} density={1.4} /></defs>
          <g clipPath="url(#sclip)">{[0, 1, 2].map((k) => <ellipse key={k} cx={90 + k * 80 + (t * 30) % 40} cy={300} rx={22} ry={70} fill="#2B6E86" opacity={0.55} />)}</g>
          <rect x={sb.x0 - 300} y={sb.y0} width={sb.x1 - sb.x0} height={sb.y1 - sb.y0} fill="none" stroke="#FFB23F" strokeDasharray="8 6" strokeWidth={2} />
          <text x={sb.x0 - 290} y={sb.y1 + 24} fontFamily={F.body} fontSize={16} fill="#fff">bounds {JSON.stringify(steamBounds({t, x0: sb.x0, y0: sb.y0, x1: sb.x1, y1: sb.y1}))}</text>
        </Cell>
        <Cell i={4} label="Fire + smoke together" bg={CITY.skyMid}><Smoke x={320} y={300} t={t + 6} seed={8} vx={30} vy={-110} size={60} rate={3} life={5} color={CITY.smoke} /><Fire x={320} y={460} w={300} h={260} t={t} seed={9} /></Cell>
        <Cell i={5} label="Blast (big, metal)" bg={dark}><line x1={0} y1={500} x2={640} y2={500} stroke={C.ink} strokeWidth={3} /><Blast x={320} y={360} t={t} t0={0.1} seed={6} size={180} ground={500} debrisMaterial="metal" /></Cell>
      </>
    );
  }
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: C.paper}}>{cells}</svg>;
};
