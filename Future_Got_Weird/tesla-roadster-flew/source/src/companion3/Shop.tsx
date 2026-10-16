// The ground half of the story, in one continuous side-view world from the outdoor test lane into the workshop:
//   launch     the car settles; lane markings run out ahead and a timing gantry folds up; rear thrust at launch
//              (gas out the back, push forward) against the smaller push the tyres can take
//   compare    after the stream's own run: "Shown 1.00 s" (that run's timer) beside "Tesla says 0.81 s" (Tesla-claimed
//              time, not independently timed; which run it belongs to isn't established), while the car rolls on
//   versions   it passes behind a foreground pillar onto a moving assembly line: fans (Performance), tank and rear
//              nozzle (Thrust), jets all around (Rocket); the public-road sign answers the last line
//   limits     the body opens on the air supply: each burst drops the dial, the onboard compressor creeps it back
//              up, and how long that takes is a question mark; the car backs out on its own
// Hardware positions and the dial are staging (no numbers): Tesla has shown neither.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {AirGauge, Outdoors} from './Bay';
import {Jet, Plume} from './BayScene';
import {Car3, CAR3, Parts} from './Car3';
import {Arrow, Cam, cue, E, FORCE, lerp, ramp, settle, toScreen, track, useT, World, WSvg} from './kit3';

export const SHOP = {start: cue('landing', 'R7', 0, true) + 0.05, footA: 103.6, footB: 109.0, end: 143.7};
const T = {
  same: cue('same', 'A1'), push: cue('push', 'A1'), ground: cue('ground.', 'A1'), thrusters: cue('thrusters', 'A2'), back: cue('back', 'A2'),
  shove: cue('shove', 'A2'), launch: cue('launch,', 'A2'), tires: cue('tires', 'A2'), grip: cue('grip.', 'A2'),
  claimed: cue('claimed', 'A4'), seconds: cue('seconds.', 'A4'), nobody: cue('Nobody', 'A4'), indep: cue('independently', 'A4'),
  versions: cue('versions', 'S1'), performance: cue('Performance', 'S2'), fans: cue('fans', 'S2'), forGrip: cue('grip.', 'S2'),
  thrust: cue('Thrust', 'S3'), rear: cue('rear', 'S3'), launches: cue('launches.', 'S3'), rocket: cue('Rocket', 'S4'), jets: cue('jets', 'S4'),
  around: cue('around,', 'S4'), flight: cue('flight.', 'S4'), isnt: cue("isn't", 'S5'), approved: cue('approved', 'S5'),
  catch: cue('catch', 'M1'), air: cue('air.', 'M1'), burst: cue('burst', 'M2'), tank: cue('tank.', 'M2'), compressors: cue('compressors', 'M3'),
  refill: cue('refill', 'M3'), howLong: cue('how', 'M3'), takes: cue('takes.', 'M3'), nobodyM: cue('nobody', 'M4'), steering: cue('steering', 'M4'),
  drove: cue('drove', 'M5'), demo: cue('demo', 'M5'),
};
export const SHOP_TIMES = T;
const LAUNCH = cue('launch,', 'A2', 0, true) + 0.04; // goes as the word ends, so the blast doesn't cover it
const A = 2354, VMAX = 2120, T1 = VMAX / A; // launch acceleration (about 2.4 g, illustrative), then a coast
const GANTRY_X = 900;
const PILLAR_X = 5150;
const ST = {P: 6150, T: 6850, R: 7550, X: 8250};
const SIGN_X = ST.X + 470;
// the line never stops: it slows to a crawl under each station while the part goes in, then moves on
const CRAWL = 60;
const belt: [number, number, ((x: number) => number)?][] = [
  [115.85, 5450], [117.4, ST.P - CRAWL, E.inOut], [119.55, ST.P + CRAWL, E.linear], [120.55, ST.T - CRAWL, E.inOut], [T.launches + 0.05, ST.T + CRAWL, E.linear],
  [T.rocket + 0.5, ST.R - CRAWL, E.inOut], [T.flight + 0.08, ST.R + CRAWL, E.linear], [T.flight + 1.1, ST.X, E.inOut],
];
const carX = (t: number) => {
  if (t < LAUNCH) return -45 * (1 - ramp(t, T.thrusters - 0.3, T.back + 0.4, E.inOut)); // creeps up to the line
  if (t < SHOP.footB) {
    const u = t - LAUNCH;
    if (u < T1) return 0.5 * A * u * u;
    return 0.5 * A * T1 * T1 + VMAX * (u - T1) - 350 * (u - T1) ** 2;
  }
  if (t < 113.7) return 3600 + 300 * (t - SHOP.footB);
  if (t < 115.85) { const u = (t - 113.7) / 2.15; return 5130 + 320 * (1 - (1 - u) * (1 - u)); }
  if (t < T.drove) return track(t, belt);
  // backs out on its own
  const u = t - T.drove;
  return ST.X - 0.5 * 180 * u * u;
};
const beltMoving = (t: number) => {
  const dt = 1 / 30;
  return Math.abs(track(t + dt, belt) - track(t, belt)) > 0.5 && t > 115.85 && t < T.drove;
};

const WS = '#E8E2D2', WS_LINE = '#CFC6B0';
const Background: React.FC<{t: number; laneDraw: number; gantry: number; signOn: number; stationOn: number[]; beltOff: number}> = ({t, laneDraw, gantry, signOn, stationOn, beltOff}) => (
  <g>
    {/* outdoors up to the workshop */}
    <g><Outdoors /></g>
    {/* fence posts and site lights along the lane */}
    {Array.from({length: 14}, (_, i) => (
      <g key={i}>
        <rect x={-600 + i * 400} y={-140} width={12} height={140} fill="#6E5E58" />
        {i % 3 === 0 && <><rect x={-604 + i * 400} y={-420} width={20} height={420} fill="#5C5560" /><circle cx={-594 + i * 400} cy={-430} r={14} fill="#FFE6B0" /></>}
      </g>
    ))}
    <line x1={-700} y1={-110} x2={5100} y2={-110} stroke="#6E5E58" strokeWidth={5} />
    {/* workshop interior (seam hidden behind the pillar) */}
    <rect x={PILLAR_X} y={-1400} width={6000} height={1400} fill={WS} />
    {Array.from({length: 22}, (_, i) => <line key={i} x1={PILLAR_X + 140 + i * 260} y1={-1400} x2={PILLAR_X + 140 + i * 260} y2={-40} stroke={WS_LINE} strokeWidth={5} />)}
    <rect x={PILLAR_X} y={-840} width={6000} height={60} fill="#B9AE96" />
    {/* station frames and signs */}
    {([['PERFORMANCE', ST.P], ['THRUST', ST.T], ['ROCKET', ST.R]] as [string, number][]).map(([name, x], i) => (
      <g key={name}>
        <rect x={x - 230} y={-470} width={460} height={100} rx={18} fill={C.cream} stroke={stationOn[i] > 0.5 ? C.saffronDeep : C.ink} strokeWidth={stationOn[i] > 0.5 ? 9 : 5} />
        {name === 'ROCKET' && <g opacity={ramp(t, T.flight - 0.15, T.flight + 0.2) * (1 - ramp(t, T.isnt, T.isnt + 0.5))}><rect x={x + 150} y={-378} width={150} height={52} rx={14} fill={C.saffron} stroke={C.ink} strokeWidth={4} /></g>}
      </g>
    ))}
    {/* the way out: public-road sign and a no-entry roundel that lights up for the Rocket */}
    <g>
      <rect x={SIGN_X - 8} y={-560} width={16} height={560} fill="#6F7B82" />
      <rect x={SIGN_X - 190} y={-620} width={380} height={96} rx={12} fill="#2F7D4F" stroke={C.ink} strokeWidth={5} />
      <g transform={`translate(${SIGN_X} -420) scale(${0.9 + 0.1 * signOn})`}>
        <circle r={78} fill="#FFFFFF" stroke={signOn > 0 ? '#D3282E' : '#9AA6AD'} strokeWidth={18} />
        <path d="M -44 10 L -36 -10 L -14 -18 L 18 -18 L 36 -6 L 46 0 L 46 14 L -46 14 Z" fill={C.ink} />
        <circle cx={-26} cy={16} r={9} fill={C.ink} /><circle cx={28} cy={16} r={9} fill={C.ink} />
        <line x1={-56} y1={-56} x2={56} y2={56} stroke="#D3282E" strokeWidth={16} opacity={signOn} />
      </g>
    </g>
    {/* ground: the lane outside (with markings), the belt inside */}
    <rect x={-3000} y={0} width={PILLAR_X + 3000} height={600} fill="#5D6166" />
    <rect x={-3000} y={0} width={PILLAR_X + 3000} height={10} fill="#7A7F84" />
    {Array.from({length: 26}, (_, i) => {
      const x0 = -260 + i * 220;
      const show = ramp(laneDraw, i / 26, i / 26 + 0.08);
      return <rect key={i} x={x0} y={34} width={130 * show} height={12} rx={6} fill="#F4F6F7" opacity={show} />;
    })}
    <rect x={-40} y={0} width={18} height={70} fill="#F4F6F7" opacity={laneDraw > 0 ? 1 : 0} />
    <rect x={PILLAR_X} y={0} width={6000} height={600} fill="#BFC5CA" />
    <rect x={5300} y={0} width={ST.X + 380 - 5300} height={36} fill="#3A4348" />
    {Array.from({length: 60}, (_, i) => {
      const x = 5300 + ((i * 60 + beltOff) % 3360);
      return x < ST.X + 380 ? <line key={i} x1={x} y1={3} x2={x} y2={33} stroke="#58626A" strokeWidth={6} /> : null;
    })}
    {/* timing gantry: folds up from the ground about its foot */}
    <g transform={`rotate(${-90 * (1 - gantry)} ${GANTRY_X} 0)`}>
      <rect x={GANTRY_X - 12} y={-560} width={24} height={560} fill="#4A5257" stroke={C.ink} strokeWidth={4} />
      <rect x={GANTRY_X - 12} y={-590} width={24} height={60} fill="#2B3338" stroke={C.ink} strokeWidth={4} />
      <rect x={GANTRY_X - 70} y={-600} width={60} height={150} rx={10} fill="#1E2429" stroke={C.ink} strokeWidth={4} />
      {[0, 1, 2].map((k) => {
        const green = t > LAUNCH - 0.12;
        const lit = green ? k === 2 : t > LAUNCH - 1.2 + k * 0.4 && k < 2;
        return <circle key={k} cx={GANTRY_X - 40} cy={-574 + k * 46} r={16} fill={lit ? (green ? '#38D17A' : '#E8332B') : '#3A4348'} />;
      })}
    </g>
  </g>
);

export const Shop: React.FC = () => {
  const t = useT(SHOP.start);
  const frame = Math.round(t * 30);
  const x = carX(t);
  const laneDraw = ramp(t, T.same - 0.2, T.ground, E.inOut);
  const gantry = ramp(t, T.push - 0.1, T.ground + 0.2, E.back);
  // the car: full kit until it passes behind the pillar, then bare on the line and built up station by station
  const bare = t > 113.6;
  const fansIn = ramp(t, T.fans - 0.05, T.fans + 0.15, E.back);
  const tankIn = ramp(t, T.rear - 0.05, T.rear + 0.15, E.back);
  const jetsIn = [0, 1, 2, 3].map((k) => ramp(t, T.jets + 0.12 * k, T.jets + 0.12 * k + 0.12, E.back));
  const parts: Parts = bare ? {fans: fansIn > 0.5, tank: tankIn > 0.5, nozzle: tankIn > 0.5, sideNozzles: jetsIn[3] > 0.5, compressor: t > T.compressors - 0.4} : {fans: true, tank: true, nozzle: true};
  const lineOpen = bare ? ramp(t, 113.7, 114.0) * (1 - ramp(t, T.flight + 0.1, T.flight + 0.5, E.inOut)) : 0;
  const openUp = Math.max(lineOpen, ramp(t, T.catch - 0.1, T.catch + 0.5, E.out) * (1 - ramp(t, T.steering - 0.2, T.steering + 0.3, E.inOut)));
  const openLo = lineOpen;
  const launchU = t - LAUNCH;
  const squash = settle(t, SHOP.start + 0.05, 5, 0.6) + (t > LAUNCH && t < LAUNCH + 1.4 ? -3 * Math.sin(Math.min(1, launchU / 0.5) * Math.PI) : 0);
  const spinDist = Math.max(0, x);
  const spin = (spinDist / 33) * (180 / Math.PI);
  // valve, rear jet and arrows at launch
  const jetO = ramp(t, LAUNCH, LAUNCH + 0.06) * (1 - ramp(t, LAUNCH + 1.6, LAUNCH + 2.0));
  const thrustArrow = ramp(t, LAUNCH + 0.05, LAUNCH + 0.3) * (1 - ramp(t, T.grip + 0.1, T.grip + 0.4));
  const tireArrow = ramp(t, T.tires - 0.15, T.tires + 0.15) * (1 - ramp(t, T.grip + 0.1, T.grip + 0.4));
  const nozzleGlow = ramp(t, T.thrusters, T.thrusters + 0.2) * (1 - ramp(t, LAUNCH - 0.2, LAUNCH));
  // limits: bursts drain the dial, the compressor refills it slowly, how long is unknown
  const bursts = [T.burst + 0.05, T.burst + 0.5, T.burst + 0.95];
  const burstO = (b: number) => ramp(t, b, b + 0.04) * (1 - ramp(t, b + 0.18, b + 0.26));
  const level = 0.8 - 0.13 * bursts.filter((b) => t > b + 0.1).length * 1 + 0.16 * ramp(t, T.compressors + 0.3, T.takes + 0.3, E.linear);
  const gaugeO = ramp(t, T.air - 0.3, T.air, E.back) * (1 - ramp(t, T.steering, T.steering + 0.3));
  const clockO = ramp(t, T.howLong - 0.1, T.howLong + 0.2, E.back) * (1 - ramp(t, T.steering, T.steering + 0.3));
  // camera
  let cam: Cam;
  if (t < LAUNCH) cam = {x: lerp(300, 180, ramp(t, T.thrusters - 0.5, LAUNCH, E.inOut)), y: lerp(-190, -160, ramp(t, T.thrusters - 0.5, LAUNCH, E.inOut)), z: lerp(1.3, 1.45, ramp(t, T.thrusters - 0.5, LAUNCH, E.inOut))};
  else if (t < SHOP.footB) cam = {x: Math.max(180, x - 120 + 200 * ramp(t, LAUNCH, LAUNCH + 1)), y: lerp(-160, -190, ramp(t, LAUNCH, LAUNCH + 0.8)), z: lerp(1.45, 1.3, ramp(t, LAUNCH, LAUNCH + 0.8))};
  else if (t < T.catch - 0.3) cam = {x: x + lerp(240, 20, ramp(t, 113, 116, E.inOut)), y: lerp(-230, -230, ramp(t, 113, 116, E.inOut)), z: lerp(1.3, 1.45, ramp(t, 113, 116, E.inOut))};
  else {
    const u = ramp(t, T.catch - 0.3, T.air + 0.2, E.inOut);
    const v2 = ramp(t, T.air + 0.2, T.takes + 0.5, E.inOut); // drift in on the dial while the air is spent and refilled
    cam = {x: lerp(ST.X + 20, ST.X + 200, u) - 60 * v2, y: lerp(-230, -200, u) - 40 * v2, z: lerp(1.45, 1.62, u) * (1 + 0.1 * v2)};
    if (t > T.drove) cam = {x: lerp(cam.x, ST.X - 120, ramp(t, T.drove, T.demo + 0.3, E.inOut)), y: cam.y, z: cam.z};
  }
  const beltOff = ((track(t, belt) - 5450) % 60 + 60) % 60;
  const stationOn = [ST.P, ST.T, ST.R].map((sx) => (Math.abs(x - sx) < CRAWL + 15 && bare ? 1 : 0));
  const signOn = ramp(t, T.isnt - 0.05, T.isnt + 0.2, E.back);
  // jets (world)
  const jets: Jet[] = [];
  const nz = {x: x + CAR3.nozzle.x - 12, y: CAR3.nozzle.y};
  if (jetO > 0) jets.push({x: nz.x, y: nz.y, dx: -1, dy: 0, o: jetO, t0: LAUNCH, len: 520});
  bursts.forEach((b) => { const o = burstO(b); if (o > 0) jets.push({x: nz.x, y: nz.y, dx: -1, dy: 0, o, t0: b, len: 300}); });
  if (t > T.launches - 0.1 && t < T.launches + 0.5 && bare) jets.push({x: nz.x, y: nz.y, dx: -1, dy: 0, o: ramp(t, T.launches, T.launches + 0.05) * (1 - ramp(t, T.launches + 0.25, T.launches + 0.4)), t0: T.launches, len: 240});
  // installs: an arm drops to the car at each station, the part pops in with a flash
  const arm = (sx: number, at: number) => {
    const d = ramp(t, at - 0.55, at - 0.05, E.inOut) * (1 - ramp(t, at + 0.25, at + 0.75, E.inOut));
    if (d <= 0) return null;
    const tip = lerp(-300, -150, d);
    const ax = Math.abs(x - sx) < CRAWL + 40 ? x : sx; // the arm rides along with the car under its station
    return (
      <g key={sx}>
        <rect x={sx + 250 - 7} y={-780} width={14} height={300} fill="#5A646A" stroke={C.ink} strokeWidth={3} />
        <path d={`M ${sx + 250} -480 L ${sx + 250} -330 L ${ax} -330 L ${ax} ${tip}`} stroke="#5A646A" strokeWidth={14} fill="none" strokeLinejoin="round" />
        <rect x={ax - 34} y={tip - 6} width={68} height={22} rx={6} fill={C.saffronDeep} stroke={C.ink} strokeWidth={3} />
        <rect x={ax - 34} y={tip + 14} width={10} height={24} fill="#5A646A" /><rect x={ax + 24} y={tip + 14} width={10} height={24} fill="#5A646A" />
      </g>
    );
  };
  const flash = (at: number, fx: number, fy: number, r = 70) => {
    const u = ramp(t, at, at + 0.35);
    if (u <= 0 || u >= 1) return null;
    return <circle cx={fx} cy={fy} r={r * (0.5 + u)} fill="none" stroke={C.saffron} strokeWidth={10 * (1 - u)} opacity={1 - u} />;
  };
  // clerkA at the way out: presses for the sign, watches the dial, then hands up as the car backs out by itself
  const CH = {x: SIGN_X + 170, y: 0, scale: 0.42};
  const stand: Pose = {...IDLE, armL: {a: 10, b: 20}, armR: {a: 22, b: 60}, lookX: -0.7, lookY: -0.1, tilt: 3, brows: 0.2, mouth: 'smile'};
  const press: Pose = {...stand, armR: {a: 62, b: 40}, lookX: -0.3, lookY: -0.4, brows: 0.5, mouth: 'flat'};
  const look: Pose = {...stand, lookX: -0.8, lookY: -0.5, tilt: -6, brows: 0.6, browAsym: 0.6, mouth: 'hmm'};
  const handsUp: Pose = {...IDLE, armL: {a: 120, b: 30}, armR: {a: 120, b: 30}, lookX: -0.9, lookY: 0, tilt: -4, brows: 0.8, mouth: 'o'};
  const chPose = t < T.catch ? mixPose(stand, press, ramp(t, T.isnt - 0.4, T.isnt) * (1 - ramp(t, T.approved + 0.4, T.approved + 0.8))) : t < T.nobodyM ? mixPose(stand, look, ramp(t, T.catch, T.air + 0.3)) : mixPose(look, handsUp, ramp(t, T.nobodyM - 0.1, T.steering + 0.1, E.back));
  const showCrew = t > 125;
  const gaugePos = {x: x - 20, y: -380};
  return (
    <AbsoluteFill style={{background: '#2B3B5E'}}>
      <World cam={cam}>
        <WSvg>
          <Background t={t} laneDraw={laneDraw} gantry={gantry} signOn={signOn} stationOn={stationOn} beltOff={beltOff} />
          {[ST.P, ST.T, ST.R].map((sx, i) => arm(sx, [T.fans, T.rear, T.jets + 0.2][i]))}
          <ellipse cx={x} cy={4} rx={235} ry={13} fill="rgba(16,26,32,0.25)" />
          {jets.map((j, i) => <Plume key={i} j={j} t={t} />)}
          <Car3 x={x} y={0} heading={0} squash={squash} compress={Math.max(0, squash / 5)} spin={spin} refl={((x * 0.35) % 600 + 600) % 600 - 300}
            openUp={openUp} openLo={openLo} parts={parts} fanSpin={t * 900} valve={jetO} glowTank={0} id="shop"
            over={
              <g>
                {nozzleGlow > 0 && <circle cx={CAR3.nozzle.x - 6} cy={CAR3.nozzle.y} r={24} fill="none" stroke={C.saffron} strokeWidth={6} opacity={nozzleGlow} />}
                {thrustArrow > 0 && <Arrow x1={CAR3.nozzle.x + 8} y1={CAR3.nozzle.y - 40} x2={CAR3.nozzle.x + 8 + 300} y2={CAR3.nozzle.y - 40} color={FORCE} w={20} opacity={thrustArrow} />}
                {tireArrow > 0 && [-138, 138].map((wx) => <Arrow key={wx} x1={wx - 30} y1={16} x2={wx + 90} y2={16} color={FORCE} w={13} head={26} opacity={tireArrow} />)}
                {/* the dial's leader to the tank */}
                {gaugeO > 0 && <path d={`M ${-20} -252 L ${-30} ${CAR3.tank.y0 - 2}`} stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" opacity={gaugeO} />}
              </g>
            } />
          {flash(T.fans, carX(T.fans) - 20, -36)}
          {flash(T.rear, carX(T.rear) - 200, -80)}
          {[0, 1, 2, 3].map((k) => (jetsIn[k] > 0 && jetsIn[k] < 1 ? <circle key={k} cx={x + CAR3.sideNozzles[k][0]} cy={CAR3.sideNozzles[k][1]} r={26 * (1 - jetsIn[k]) + 8} fill="none" stroke={C.saffron} strokeWidth={6} opacity={1 - jetsIn[k]} /> : null))}
          {gaugeO > 0 && <AirGauge x={gaugePos.x} y={gaugePos.y} r={78} level={level} opacity={gaugeO} />}
          {clockO > 0 && (
            <g transform={`translate(${gaugePos.x + 175} ${gaugePos.y}) scale(${clockO})`}>
              <circle r={52} fill={C.cream} stroke={C.ink} strokeWidth={6} />
              <line x1={0} y1={0} x2={0} y2={-32} stroke={C.ink} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 140})`} />
              <line x1={0} y1={0} x2={22} y2={0} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
              <text x={0} y={100} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={64} fill={C.coralDeep}>?</text>
            </g>
          )}
        </WSvg>
        {showCrew && <Character look={CAST.clerkA} pose={chPose} frame={frame} seed={11} x={CH.x} y={CH.y} scale={CH.scale} life={0.5} />}
        <WSvg>
          {/* foreground pillar: hides the step from the lane into the workshop */}
          <g transform={`translate(${(PILLAR_X - cam.x) * 0.35} 0)`}>
            <rect x={PILLAR_X - 130} y={-2000} width={260} height={2600} fill="#2B3338" />
            <rect x={PILLAR_X - 130} y={-2000} width={36} height={2600} fill="#3C464C" />
            {[-1500, -1000, -500].map((y) => <rect key={y} x={PILLAR_X - 130} y={y} width={260} height={18} fill="#1E2429" />)}
          </g>
        </WSvg>
      </World>
      {/* sign lettering in screen space (text drawn inside the far-translated world layer came out with mixed-up glyphs) */}
      <SText cam={cam} x={ST.P} y={-420} size={60} text="PERFORMANCE" />
      <SText cam={cam} x={ST.T} y={-420} size={60} text="THRUST" />
      <SText cam={cam} x={ST.R} y={-420} size={60} text="ROCKET" />
      <SText cam={cam} x={ST.R + 225} y={-352} size={36} text="flight" body o={ramp(t, T.flight - 0.15, T.flight + 0.2) * (1 - ramp(t, T.isnt, T.isnt + 0.5))} />
      <SText cam={cam} x={SIGN_X} y={-572} size={50} text="PUBLIC ROAD" color="#FFFFFF" />
      {/* shown vs claimed, one unit, only after the stream's own run */}
      <Compare t={t} />
    </AbsoluteFill>
  );
};

/** Lettering for a world-space sign, drawn in screen space at the camera's scale. */
const SText: React.FC<{cam: Cam; x: number; y: number; size: number; text: string; color?: string; body?: boolean; o?: number}> = ({cam, x, y, size, text, color = C.ink, body = false, o = 1}) => {
  const p = toScreen(cam, x, y);
  if (o <= 0 || p.x < -600 || p.x > 2520) return null;
  return <div style={{position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', opacity: o, fontFamily: body ? F.body : F.display, fontWeight: body ? 800 : 700, fontSize: size * cam.z, lineHeight: 1, color}}>{text}</div>;
};

const Pill: React.FC<{big: string; small: string; head: string; bg: string; o: number; dx: number}> = ({big, small, head, bg, o, dx}) => (
  <div style={{opacity: o, transform: `translateY(${(1 - o) * 20}px)`, background: bg, border: `4px solid ${C.ink}`, borderRadius: 26, padding: '14px 30px 16px', minWidth: 420, textAlign: 'center', marginLeft: dx}}>
    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>{head}</div>
    <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 84, lineHeight: 1.05, color: C.ink}}>{big}</div>
    <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 36, color: C.inkSoft}}>{small}</div>
  </div>
);
const Compare: React.FC<{t: number}> = ({t}) => {
  if (t < SHOP.footB - 0.2 || t > T.indep + 1.2) return null;
  const a = ramp(t, SHOP.footB - 0.1, SHOP.footB + 0.2) * (1 - ramp(t, T.indep + 0.6, T.indep + 1.0));
  const b = ramp(t, T.claimed - 0.1, T.claimed + 0.25, E.back) * (1 - ramp(t, T.indep + 0.6, T.indep + 1.0));
  const q = ramp(t, T.nobody - 0.1, T.nobody + 0.2);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', gap: 40}}>
      <Pill head="Shown" big="1.00 s" small="recorded run · stream's own timer" bg={C.cream} o={a} dx={0} />
      <Pill head="Tesla says" big="0.81 s" small={q > 0.5 ? 'Tesla-claimed time · not independently timed' : 'Tesla-claimed time'} bg={C.saffronLight} o={b} dx={0} />
    </div>
  );
};

/** "Shown: 1.00 s" over the stream's own run, when its burned-in timer stops. */
export const ShownTag: React.FC<{t: number; at: number}> = ({t, at}) => {
  const o = ramp(t, at, at + 0.25, E.back);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, top: 60, opacity: o, transform: `scale(${0.9 + 0.1 * o})`, transformOrigin: '0 0'}}>
      <div style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 26, padding: '12px 28px 14px', textAlign: 'center'}}>
        <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>Shown</div>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 84, lineHeight: 1.05, color: C.ink}}>1.00 s</div>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 36, color: C.inkSoft}}>recorded run · stream's own timer</div>
      </div>
    </div>
  );
};
