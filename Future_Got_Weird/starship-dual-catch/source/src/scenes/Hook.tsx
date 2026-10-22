import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../kit/Stage';
import {Badge, Big, Note, Tag, Vignette, toScreen, Cam} from '../kit/ui';
import {clamp, kf, lerp, ramp, out} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X} from '../assets/Tower';
import {C, FONT, MONO} from '../theme';
import {interpolate} from 'remotion';

// One continuous descent drives the whole hook: constant deceleration to rest on the arms.
export const HOOK_ARM_Y = -640;
const CONTACT = 411; // frame the catch point would meet the rail; the hook freezes ~0.5 m short of it
export const FREEZE = 386;
const RAIL = HOOK_ARM_Y - 3;
const D0 = 900; // starting height above contact (world units, 0.1 m)
const hookCy = (f: number) => {
  const u = Math.min(1, f / CONTACT);
  return RAIL - D0 * (1 - u) * (1 - u) - 0.0;
};
const hookVx = (f: number) => CATCH_X + 34 * Math.pow(1 - Math.min(1, f / CONTACT), 2) * Math.cos(f / 40);
const hookTilt = (f: number) => 2.4 * Math.pow(1 - Math.min(1, f / CONTACT), 1.5) * Math.sin(f / 33);

const hookState = (f: number) => {
  const ff = Math.min(f, FREEZE);
  // arms: open wide and waiting, then close in during "Just two giant arms"
  const open = kf(ff, [[0, 1], [fS('h3') + 6, 1], [FREEZE - 4, 0.06]]);
  return {cy: hookCy(ff), vx: hookVx(ff), tilt: hookTilt(ff), open, t: ff};
};

// 0:00 - 0:10  tracking beside the descending ship, then pull back to reveal the tower and its open arms
export const HookTrack: React.FC = () => {
  const f = useCurrentFrame();
  const s = hookState(f);
  const shipMidY = s.cy + 348 - 250;
  const pull = ramp(f, 92, 190, out);
  const push = ramp(f, 200, 320);
  const cam: Cam = {
    x: lerp(lerp(CATCH_X + 95, 120, pull), 170, push),
    y: lerp(lerp(shipMidY + 40, -820, pull), -760, push),
    s: lerp(lerp(1.32, 0.5, pull), 0.62, push),
    r: lerp(-2.5, 0, pull),
  };
  const burn = 0.95 + 0.05 * Math.sin(f / 5);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dusk" sun={{x: 1450, y: 980}} stars={0.25} armY={HOOK_ARM_Y} open={s.open} vehicle="ship" vx={s.vx} cy={s.cy} tilt={s.tilt} ship={{burn, fwd: -8, aft: -10}} t={s.t} clouds={0.35} />
      <Vignette k={0.6} />
      <Badge text="ILLUSTRATION · PLANNED ATTEMPT" at={18} />
    </AbsoluteFill>
  );
};

// 0:10 - 0:15  close in on the arms, macro on the catch point, freeze before contact: "This hasn't happened yet."
export const HookArms: React.FC = () => {
  const f = useCurrentFrame();
  const s = hookState(f);
  const macro = ramp(f, fE('h3') - 2, fE('h3') + 14, out);
  const frozen = f >= FREEZE;
  const camWide: Cam = {x: CATCH_X - 10, y: HOOK_ARM_Y - 150, s: 1.15, r: 3};
  const camMacro: Cam = {x: CATCH_X - 6, y: RAIL - 10, s: 5.2, r: 0};
  const cam: Cam = {x: lerp(camWide.x, camMacro.x, macro), y: lerp(camWide.y - (f - fS('h3')) * 0.4, camMacro.y, macro), s: lerp(camWide.s, camMacro.s, macro), r: lerp(camWide.r ?? 0, 0, macro)};
  const desat = ramp(f, FREEZE, FREEZE + 8);
  const gapPt = toScreen(cam, CATCH_X - 3, RAIL - 6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `saturate(${1 - desat * 0.75}) brightness(${1 - desat * 0.25})`}}>
        <Stage cam={cam} sky="dusk" sun={{x: 1450, y: 980}} stars={0.25} armY={HOOK_ARM_Y} open={s.open} vehicle="ship" vx={s.vx} cy={s.cy} tilt={s.tilt} ship={{burn: 0.9, fwd: -8, aft: -10, catchPoints: true}} t={s.t} clouds={0.3} hl={macro > 0.5} />
      </AbsoluteFill>
      {frozen && (
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <line x1={gapPt.x - 220} y1={gapPt.y} x2={gapPt.x + 220} y2={gapPt.y} stroke="#fff" strokeWidth={2} strokeDasharray="10 8" opacity={desat * 0.8} />
        </svg>
      )}
      <Vignette k={0.65} />
      <Badge text="ILLUSTRATION · PLANNED ATTEMPT" />
      <Big text="This hasn't happened yet." at={fS('h4')} size={78} y={880} sub="NO SHIP HAS EVER BEEN CAUGHT BY A TOWER" />
    </AbsoluteFill>
  );
};

// 0:15 - 0:31  booster catches (done) versus the ship catch (next)
export const HookCompare: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('h5');
  const split = ramp(f, a, a + 14, out);
  const right = ramp(f, fS('h6'), fS('h6') + 14, out);
  const full = ramp(f, fS('h7') + 10, fS('h7') + 34);
  const leftW = lerp(1920, 960, right) * (1 - full);
  const camB: Cam = {x: CATCH_X - 30, y: -860, s: 0.95};
  const shipCy = -643 - 520 + 520 * ramp(f, fS('h6'), fS('h7') + 40, out) * 0.55;
  const camS: Cam = {x: lerp(CATCH_X - 40, CATCH_X + 20, full), y: lerp(-760, shipCy + 100, full), s: lerp(0.78, 1.25, full)};
  const ticks = ['OCT 2024 · FLIGHT 5', 'JAN 2025 · FLIGHT 7', 'MAR 2025 · FLIGHT 8'];
  const t3 = fS('h5') + Math.round((20.0 - 15.12) * 30);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* left: booster held by the arms (reconstruction) */}
      <AbsoluteFill style={{clipPath: `inset(0 ${1920 - leftW}px 0 0)`}}>
        <div style={{position: 'absolute', left: (leftW - 1920) / 2, top: 0, width: 1920, height: 1080, transform: `scale(${lerp(1.1, 1, split)})`}}>
          <Stage cam={camB} sky="night" stars={0.7} armY={-820} open={0} vehicle="booster" t={f} clouds={0.15} />
        </div>
        <div style={{position: 'absolute', left: 40, top: 120, opacity: split}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.ok}}>BOOSTER CATCH ✓</div>
          {ticks.map((t, i) => {
            const o = ramp(f, t3 - 18 + i * 7, t3 - 10 + i * 7);
            return (
              <div key={t} style={{opacity: o, fontFamily: MONO, fontSize: 22, color: '#e6edf3', marginTop: 10, letterSpacing: 1.5}}>
                {t}
              </div>
            );
          })}
        </div>
        <Badge text="RECONSTRUCTION" pos="bl" at={a} tone="info" />
      </AbsoluteFill>
      {/* right: the ship, next */}
      {right > 0 && (
        <AbsoluteFill style={{clipPath: `inset(0 0 0 ${leftW}px)`}}>
          <div style={{position: 'absolute', left: leftW / 2, top: 0, width: 1920, height: 1080}}>
            <Stage cam={camS} sky="dusk" sun={{x: 1300, y: 950}} armY={-640} open={1 - 0.3 * full} vehicle="ship" cy={shipCy} ship={{burn: 0.85, fwd: -8, aft: -10}} t={f} clouds={0.3} />
          </div>
          <div style={{position: 'absolute', left: leftW + 40, top: 120, opacity: right * (1 - full)}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.accent}}>SHIP CATCH ?</div>
            <div style={{fontFamily: MONO, fontSize: 22, color: '#e6edf3', marginTop: 10, letterSpacing: 1.5}}>NEVER ATTEMPTED</div>
            <div style={{fontFamily: MONO, fontSize: 22, color: '#e6edf3', marginTop: 10, letterSpacing: 1.5}}>FLIGHT 15 · PLANNED</div>
          </div>
          <Badge text="ILLUSTRATION · PLANNED ATTEMPT" pos="tr" at={fS('h6')} />
        </AbsoluteFill>
      )}
      {right > 0 && full < 1 && <div style={{position: 'absolute', left: leftW - 2, top: 0, width: 4, height: 1080, background: '#05070b', opacity: right}} />}
      <Big text="A completely different problem." at={fS('h7') + 22} size={74} y={900} />
      <Vignette k={0.5} />
    </AbsoluteFill>
  );
};
