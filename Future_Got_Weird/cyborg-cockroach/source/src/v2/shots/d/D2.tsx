// D2 (490-511, "they fire"): extreme close-up in pure profile (az 0, el 3) on the launch tube and the target's face,
// flat, the clear tube showing the spring, the loaded injector (amber dose), the collar, the needle and the latch line
// across the mouth. The nichrome coil is already warming as the shot opens; it glows hot, and on "fire" (16.565 s,
// frame 497) the line parts at the coil (a pin-point flash and a wisp of smoke from the burnt line), the compressed
// spring snaps the injector forward along the tube (2-3 frames; a faint smear on the stroke frame), and the needle
// goes 5 mm into the silicone while the barrel's rear is still in the tube; the silicone dimples around the entry and
// the body recoils on its planted feet, then settles. A slow push in toward the needle.
import React from 'react';
import {toW, V3, V2} from '../../../lib/v3';
import {sr, clamp} from '../../../lib/ease';
import {INJ, PACK} from '../../../rig/gear';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {Target2D, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {dPoseFull, dGear, dDeploy, D_FACE, D_FIRE} from './trial';
import {LabRoomMM} from './room';

const R = shotRange('D2');
export const D2_AZ = 0, D2_EL = 3;
/** the view (the D3 cutaway opens on D2's last view, then pushes on) */
export const d2Cam = (f: number) => {
  const u = sr(f, R.from - 2, R.to + 6);
  return {s: 28.5 + 2.5 * u, x: 28.5 + 2 * u, y: 25};
};
export const d2View = (f: number): View => {
  const c = d2Cam(f);
  return viewAt(D2_AZ, D2_EL, c.s, [c.x, c.y, 0], 540, 1000);
};
export const D2_END_VIEW = () => d2View(R.to);

/** the release flash and the wisp of smoke from the parted line, at the coil (screen) */
export const ReleaseFx: React.FC<{v: View; c: V2; t: number; id: string}> = ({v, c, t, id}) => {
  const dt = t - D_FIRE;
  if (dt < -0.02 || dt > 0.6) return null;
  const s = v.s;
  const fl = dt < 0 ? 0 : Math.exp(-dt / 0.035);
  const smoke = [0, 1, 2].map((k) => {
    const u = clamp((dt - 0.02 - k * 0.05) / 0.5);
    if (u <= 0 || u >= 1) return null;
    const x = c[0] + (0.6 + 1.6 * u + k * 0.4) * s * 0.4 * Math.sin(k * 2.1 + u * 3);
    const y = c[1] - (0.8 + 4.5 * u) * s;
    return <circle key={k} cx={f2(x)} cy={f2(y)} r={f2((0.35 + 0.9 * u) * s)} fill="#E6EBEE" opacity={0.55 * (1 - u) * Math.min(1, u * 6)} />;
  });
  return (
    <g>
      {fl > 0.02 && (
        <g>
          <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(2.4 * s * (0.6 + 0.4 * fl))} fill="#FFE7A0" opacity={0.45 * fl} />
          <path d={`M${f2(c[0] - 1.6 * s * fl)},${f2(c[1])} L${f2(c[0] + 1.6 * s * fl)},${f2(c[1])} M${f2(c[0])},${f2(c[1] - 1.6 * s * fl)} L${f2(c[0])},${f2(c[1] + 1.6 * s * fl)}`} stroke="#FFFBE6" strokeWidth={f2(0.22 * s)} strokeLinecap="round" opacity={fl} />
          <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.4 * s)} fill="#FFFFFF" opacity={fl} />
        </g>
      )}
      <g id={`${id}-sm`}>{smoke}</g>
    </g>
  );
};

/** the silicone's dimple ring around the entry, just after the needle seats */
export const EntryRing: React.FC<{v: View; c: V2; t: number}> = ({v, c, t}) => {
  const imp = dDeploy(t).impact;
  if (imp < 0 || imp > 0.3) return null;
  const u = imp / 0.3;
  return <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2((0.3 + 0.5 * u) * v.s)} ry={f2((1.2 + 3.2 * u) * v.s)} fill="none" stroke={LAB2.siliconeDeep} strokeWidth={f2(0.25 * v.s * (1 - u))} opacity={0.8 * (1 - u)} />;
};

export const D2Scene: React.FC<{f: number; t: number; v: View; id: string}> = ({t, v, id}) => {
  const pose = dPoseFull(t);
  const g = dGear(t);
  const d = dDeploy(t);
  const fr = pose.frame;
  const T = PACK.tube;
  const coil = P(v, toW(fr, [T.b[0] - 0.4, T.a[1] + T.r * 0.55, 0]));
  // the stroke frame's smear: the barrel's sweep since the previous half-frame
  let smear: React.ReactNode = null;
  if (d.moving && t > D_FIRE + 0.004) {
    const prev = dDeploy(t - 1 / 60).injRear;
    const inj0 = dPoseFull(t, false).frame;
    const a = P(v, toW(inj0, [prev + INJ.barrelLen * 0.3, T.a[1], 0] as V3)), b = P(v, toW(inj0, [d.injRear + INJ.barrelLen * 0.3, T.a[1], 0] as V3));
    const h = INJ.barrelR * v.s;
    smear = (
      <g opacity={0.35}>
        {[-0.6, 0, 0.6].map((k) => (
          <path key={k} d={`M${f2(a[0])},${f2(a[1] + k * h)} L${f2(b[0])},${f2(b[1] + k * h)}`} stroke="#FFFFFF" strokeWidth={f2(0.35 * v.s)} strokeLinecap="round" />
        ))}
      </g>
    );
  }
  const entry = P(v, [D_FACE, T.a[1] + 0.35, 0]);
  return (
    <g>
      <Target2D id={`${id}t`} v={v} face={D_FACE} dir={1} dent={d.impact >= 0 ? 1 : 0} entryY={T.a[1] + 0.35} />
      <EntryRing v={v} c={entry} t={t} />
      {smear}
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={fr} g={g} />}} />
      <Target2D id={`${id}tv`} v={v} face={D_FACE} dir={1} veil={0.62} />
      <ReleaseFx v={v} c={coil} t={t} id={id} />
    </g>
  );
};

export const D2: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d2View(f);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabRoomMM id="d2room" v={v} blur={9} plate={1.7} tray={[-400, 400, -300, 420]} />
      <D2Scene f={f} t={t} v={v} id="d2" />
    </svg>
  );
};
