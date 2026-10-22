import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../kit/Stage';
import {Badge, Big, Cam, Note, Svg, Tag, Vignette, toScreen} from '../kit/ui';
import {hash, kf, lerp, ramp, out, io, inn} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X} from '../assets/Tower';
import {Starship} from '../assets/Starship';
import {SuperHeavy} from '../assets/SuperHeavy';
import {Earth, Sky} from '../assets/Env';
import {Stack, SHIP_ON_STACK} from './Act1';
import {C, FONT, MONO} from '../theme';

// 5:57 - 6:22  the planned Flight 15 sequence, simplified (booster first, ship later)
export const PayoffScene: React.FC = () => {
  const f = useCurrentFrame();
  const lift = fS('f2') - 4;
  const caught = fS('f2') + Math.round(2.6 * 30);
  const space = fS('f3') - 4;
  const back = fS('f4') - 4;
  const quote = fS('f5') - 4;
  let body: React.ReactNode;
  if (f < lift) body = <Intro />;
  else if (f < caught) body = <Liftoff />;
  else if (f < space) body = <BoosterCaught />;
  else if (f < back) body = <InSpace />;
  else if (f < quote) body = <ComeBack />;
  else body = <Quote />;
  const step = f < lift ? '' : f < space ? '1 · BOOSTER: MINUTES AFTER LAUNCH' : f < quote ? '2 · SHIP: LATER, AFTER SPACE' : '';
  return (
    <AbsoluteFill>
      {body}
      {f < quote && <Badge text="ILLUSTRATION · PLANNED FLIGHT 15 (SIMPLIFIED)" />}
      {step && (
        <div style={{position: 'absolute', right: 52, top: 44, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: '#fff', letterSpacing: 2, background: 'rgba(6,9,15,0.7)', padding: '9px 16px', borderRadius: 8}}>{step}</div>
      )}
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f1') - 6;
  const cam: Cam = {x: 300, y: -760, s: lerp(0.5, 0.6, ramp(f, a, a + 130))};
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dawn" sun={{x: 1500, y: 980}} armY={-1180} open={1.75} t={f} clouds={0.5} behind={<Stack t={f} />} />
      <Big text="Flight 15, if everything goes right" at={a + 8} size={58} y={170} />
      <Vignette k={0.4} />
    </AbsoluteFill>
  );
};

const Liftoff: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f2') - 4;
  const t = Math.max(0, (f - a - 6) / 30);
  const rise = 0.5 * 60 * t * t * 3;
  const cam: Cam = {x: 300, y: -760 - rise * 0.6, s: 0.5};
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dawn" sun={{x: 1500, y: 980}} armY={-1180} open={1.75} t={f} clouds={0.5} behind={<Stack t={f} burn={f > a + 4} dy={-rise} />} />
      <Svg>
        <rect x={0} y={760} width={1920} height={320} fill="#f6efe6" opacity={0.25 * ramp(f, a + 4, a + 20)} />
      </Svg>
      <Vignette k={0.4} />
    </AbsoluteFill>
  );
};

const BoosterCaught: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f2') + Math.round(2.6 * 30);
  const u = Math.min(1, (f - a + 30) / 50);
  const cy = -823 - 320 * (1 - u) * (1 - u);
  const settled = u >= 1;
  const cam: Cam = {x: CATCH_X - 30, y: -880, s: 0.85};
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="day" armY={-820} open={settled ? 0 : lerp(0.6, 0, u)} vehicle="booster" cy={cy} burn={settled ? 'off' : 'center3'} throttle={0.8} t={f} clouds={0.6} />
      <div style={{position: 'absolute', left: 52, bottom: 60, fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.6)', opacity: ramp(f, a + 10, a + 20)}}>Booster caught ✓</div>
      <Vignette k={0.4} />
    </AbsoluteFill>
  );
};

const InSpace: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f3') - 4;
  return (
    <AbsoluteFill style={{background: '#02040a'}}>
      <Svg>
        <Sky kind="night" stars={1} />
        <Earth cx={960} cy={2350} r={1700} rot={f * 0.03} />
        <g transform={`translate(${700 + (f - a) * 2.2} 470) rotate(84) scale(0.75) translate(0 260)`}>
          <Starship t={f} />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

const ComeBack: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f4') - 4;
  const p1 = a + 48;
  const p2 = a + 96;
  if (f < p1) {
    // reentry glow
    return (
      <AbsoluteFill style={{background: '#160a10'}}>
        <Svg>
          <Sky kind="night" stars={0.4} />
          <rect x={0} y={0} width={1920} height={1080} fill="#ff6a3d" opacity={0.12} />
          <g transform="translate(960 500) scale(1.05) rotate(-76) translate(0 260)">
            <Starship t={f} plasma={1} fwd={6} aft={-6} />
          </g>
        </Svg>
        <Vignette k={0.6} />
      </AbsoluteFill>
    );
  }
  if (f < p2) {
    const fl = ramp(f, p1, p2 - 6, io);
    return (
      <AbsoluteFill>
        <Svg>
          <Sky kind="dusk" sun={{x: 1500, y: 980}} />
          <g transform={`translate(960 560) scale(0.9) rotate(${lerp(-88, 0, fl)} 0 -260) translate(0 260)`}>
            <Starship t={f} burn={ramp(f, p1, p1 + 6)} />
          </g>
        </Svg>
      </AbsoluteFill>
    );
  }
  const T = fE('f4') + 6 - p2;
  const u = Math.min(1, (f - p2) / T);
  const cy = -643 - 520 * (1 - u) * (1 - u);
  const cam: Cam = {x: CATCH_X - 20, y: -820, s: 0.72};
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dusk" sun={{x: 1450, y: 980}} armY={-640} open={lerp(1, 0.05, u)} vehicle="ship" cy={cy} ship={{burn: u < 1 ? 0.85 : 0, fwd: -6, aft: -12}} t={f} clouds={0.3} />
      <Vignette k={0.45} />
    </AbsoluteFill>
  );
};

const Quote: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f5') - 4;
  const second = fS('f5') + Math.round(3.6 * 30);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#0c1220,#1a2338)'}}>
      <div style={{position: 'absolute', left: 160, top: 280, width: 1600}}>
        <div style={{fontFamily: MONO, fontWeight: 700, color: C.accent, fontSize: 26, letterSpacing: 3, opacity: ramp(f, a, a + 10)}}>ELON MUSK · OCT 20, 2026 · AS REPORTED</div>
        <div style={{fontFamily: FONT, fontWeight: 900, color: '#fff', fontSize: 84, marginTop: 20, opacity: ramp(f, a + 6, a + 16)}}>Success is “more likely than not.”</div>
        <div style={{fontFamily: FONT, fontWeight: 800, color: '#c6d2e0', fontSize: 52, marginTop: 30, opacity: ramp(f, second, second + 12)}}>If it fails, more flights are lined up.</div>
        <div style={{fontFamily: MONO, fontWeight: 500, color: '#8fa1b8', fontSize: 22, marginTop: 40, opacity: ramp(f, second + 10, second + 22)}}>His estimate, not an independent probability.</div>
      </div>
    </AbsoluteFill>
  );
};

// 6:22 - end  what routine reuse still needs, and the final image
export const FinaleScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('f6') - 4;
  const restack = f >= fS('f7') - 4;
  const steps = ['INSPECT', 'REFUEL', 'FLY AGAIN'];
  const at = [fS('f6') + Math.round(4.2 * 30), fS('f6') + Math.round(5.2 * 30), fS('f6') + Math.round(6.1 * 30)];
  if (!restack) {
    const cam: Cam = {x: CATCH_X + 160, y: -760, s: 0.66 + (f - a) * 0.0008};
    return (
      <AbsoluteFill>
        <Stage cam={cam} sky="night" stars={0.8} armY={-640} open={0} vehicle="ship" ship={{fwd: -6, aft: -12}} t={f} clouds={0.15} />
        <div style={{position: 'absolute', right: 120, top: 300, textAlign: 'right'}}>
          {steps.map((s, i) => (
            <div key={s} style={{fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#fff', opacity: ramp(f, at[i], at[i] + 10), textShadow: '0 4px 18px rgba(0,0,0,0.6)'}}>{s}</div>
          ))}
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 28, color: C.accent, letterSpacing: 3, marginTop: 16, opacity: ramp(f, fE('f6') - 30, fE('f6') - 20)}}>WITHOUT A REBUILD</div>
        </div>
        <Big text="A catch is not the finish line." at={a + 8} out={at[0] - 10} size={58} y={170} />
        <Badge text="HYPOTHETICAL · AFTER A SUCCESSFUL CATCH" />
        <Vignette k={0.55} />
      </AbsoluteFill>
    );
  }
  // restack: the caught ship is lowered back onto the booster on the launch mount
  const b = fS('f7') - 4;
  const lower = ramp(f, b + 20, fS('f8') - 10, io);
  const shipBottom = lerp(SHIP_ON_STACK - 260, SHIP_ON_STACK, lower);
  const armY = shipBottom - 345;
  const wide = ramp(f, fS('f8') - 10, fS('f9') + 30, io);
  const cam: Cam = {x: lerp(CATCH_X + 60, 160, wide), y: lerp(-900, -760, wide), s: lerp(0.62, 0.5, wide)};
  const fadeOut = ramp(f, fE('f9') + 40, fE('f9') + 64);
  return (
    <AbsoluteFill>
      <Stage
        cam={cam}
        sky="dawn"
        sun={{x: 1550, y: 980}}
        armY={armY}
        open={0}
        t={f}
        clouds={0.5}
        behind={
          <g>
            <g transform={`translate(${CATCH_X} -170)`}><SuperHeavy t={f} catchPoint={false} /></g>
            <g transform={`translate(${CATCH_X} ${shipBottom})`}><Starship t={f} /></g>
          </g>
        }
      />
      <Badge text="HYPOTHETICAL · AFTER A SUCCESSFUL RECOVERY" />
      <Big text="This one is built to be caught." at={fS('f9') - 2} size={66} y={940} />
      <Vignette k={0.45} />
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
    </AbsoluteFill>
  );
};
