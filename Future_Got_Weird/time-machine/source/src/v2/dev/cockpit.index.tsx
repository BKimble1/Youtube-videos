// Dev entry for the V2 cockpit module: watch states, the cockpit wide shot with the raised forearm, and the reveal.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Astronaut, GLOVE} from '../../art/figures';
import {Cockpit, COCKPIT_ASTRO, CockpitFront, cockpitPose, ForeArm, hourMinutes, secBlurAt, Watch2} from '../cockpit';

const Svg: React.FC<{bg?: string; children: React.ReactNode}> = ({bg = '#E9F1F4', children}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">{children}</svg>
  </AbsoluteFill>
);

/** u for a given minutes value (bisection on hourMinutes) */
const uFor = (m: number) => {
  let a = 0, b = 1;
  for (let i = 0; i < 40; i++) {
    const c = (a + b) / 2;
    if (hourMinutes(c) < m) a = c;
    else b = c;
  }
  return (a + b) / 2;
};

const WatchStates: React.FC = () => {
  const states = [600, 612, 630, 655, 660];
  const cells = [[270, 330], [810, 330], [270, 960], [810, 960], [270, 1590]];
  return (
    <Svg>
      {states.map((m, i) => {
        const u = uFor(m);
        const b = m === 600 || m === 660 ? 0 : secBlurAt(u);
        return (
          <g key={m} transform={`translate(${cells[i][0]} ${cells[i][1]})`}>
            <Watch2 r={168} minutes={m} secBlur={b} id={`ws${i}`} />
          </g>
        );
      })}
      {/* the blur ramp: fan -> disc */}
      {[0, 0.12, 0.3, 0.55, 0.8, 1].map((b, i) => (
        <g key={i} transform={`translate(${640 + (i % 3) * 140} ${1480 + Math.floor(i / 3) * 230})`}>
          <Watch2 r={56} minutes={612.37 + i * 0.13} secBlur={b} id={`wr${i}`} />
        </g>
      ))}
    </Svg>
  );
};

const CockpitShot: React.FC<{lowered: boolean}> = ({lowered}) => {
  const t = lowered ? 7.5 : 6.1;
  const u = lowered ? 1 : 0.42;
  const m = hourMinutes(u), b = secBlurAt(u);
  const A = COCKPIT_ASTRO;
  return (
    <Svg bg="#0B0E1D">
      <Cockpit t={t} id="ck" />
      <g transform={`translate(${A.x} ${A.y}) scale(${A.s})`}>
        <Astronaut pose={cockpitPose(lowered ? 0.55 : 1)} id="as" frame={Math.round(t * 30)} glove={GLOVE} hideHands="L" watchEl={() => null} shadow={false} />
      </g>
      <CockpitFront t={t} id="ckf" />
      {lowered ? (
        <g transform="translate(330 1860)"><ForeArm minutes={m} secBlur={b} id="fa" s={1.5} rot={6} /></g>
      ) : (
        <g transform="translate(430 1580)"><ForeArm minutes={m} secBlur={b} id="fa" s={1.55} rot={-4} /></g>
      )}
    </Svg>
  );
};

/** the opening beat: the raised wrist, watch filling the foreground at 10:00, the cabin behind */
const WatchHero: React.FC = () => {
  const A = COCKPIT_ASTRO;
  return (
    <Svg bg="#0B0E1D">
      <Cockpit t={4.9} id="ck" />
      <g transform={`translate(${A.x} ${A.y}) scale(${A.s})`}>
        <Astronaut pose={cockpitPose(1)} id="as" frame={147} glove={GLOVE} hideHands="L" watchEl={() => null} shadow={false} />
      </g>
      <CockpitFront t={4.9} id="ckf" />
      <g transform="translate(520 1080)"><ForeArm minutes={600} secBlur={0} id="fa" s={2.6} rot={4} /></g>
    </Svg>
  );
};

const ForeArmSheet: React.FC = () => (
  <Svg bg="#2B4D5A">
    <g transform="translate(470 700)"><ForeArm minutes={hourMinutes(0)} secBlur={0} id="fs0" s={1.4} /></g>
    <g transform="translate(560 1500)"><ForeArm minutes={hourMinutes(0.9)} secBlur={secBlurAt(0.9)} id="fs1" s={1.0} /></g>
  </Svg>
);

const Root: React.FC = () => (
  <>
    <Composition id="WatchStates" component={WatchStates} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CockpitWide" component={CockpitShot} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{lowered: false}} />
    <Composition id="CockpitReveal" component={CockpitShot} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{lowered: true}} />
    <Composition id="WatchHero" component={WatchHero} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="ForeArmSheet" component={ForeArmSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
