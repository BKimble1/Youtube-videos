// HOOK 06: "This parasite turns a snail's eyestalk into a pulsing lure for birds."
// One continuous shot. An amber snail crawls across a leaf with one eyestalk swollen and banded by a Leucochloridium
// broodsac, pulsing (0-1 s); the camera pushes straight in on the eyestalk (1.0-2.5 s); a cut window opens in the
// tentacle wall onto the broodsac's lumen, packed with encysted larvae that the pumping waves push back and forth
// (2.5-4.1 s); on "birds" a robin hops onto a twig behind, the window closes and the camera pulls back to the whole
// snail on the leaf while the robin turns its head to the pulsing eyestalk, blinks and hops closer (4.1-6.0 s).
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import {keyCR, ss, ss5} from '../shared/lib';
import {EV, HOP, WD} from './timeline';
import {Eyestalk, spine, stalkSway} from './eyestalk';
import {SnailBehind, SnailBody, SnailFront} from './snail';
import {Background, Leaf, Midground, Motes, Slime, Twig, twigY} from './env';
import {Robin, robinState} from './bird';

const f2 = (n: number) => n.toFixed(3);
export const snailX = (t: number) => 30 * t;

// camera, in snail-local coordinates (it follows the crawling snail). The centre blends from a wide framing to a
// point on the eyestalk's spine (drifting toward the tip during the cutaway) and back out to the end framing, with C2
// weights; the zoom is keyed in log space with velocity carried across keys.
const KZ: [number, number][] = ([[0, 1.45], [EV.pushStart, 1.58], [EV.pushEnd, 3.15], [EV.pullStart, 3.4], [6.0, 1.04], [6.6, 0.97]] as [number, number][]).map(([a, b]) => [a, Math.log(b)]);
const W0 = (t: number) => ({x: 38 + 10 * t, y: -250 - 6 * t});
const W1 = (t: number) => ({x: 10 - 10 * (t - 6), y: -258 - 6 * (t - 6)});
const target = (t: number) => {
  const s = 0.5 + 0.12 * ss(t, EV.pushEnd, EV.pullStart);
  const sw = 0.6 * stalkSway(t);
  const sp = spine(sw).pts;
  const x = s * (sp.length - 1), i = Math.min(sp.length - 2, Math.floor(x)), u = x - i;
  return {x: sp[i].x + (sp[i + 1].x - sp[i].x) * u, y: sp[i].y + (sp[i + 1].y - sp[i].y) * u};
};
export const cam = (t: number) => {
  const w = ss5(t, 0.85, 2.5) * (1 - ss5(t, 4.05, 6.0));
  const k = ss5(t, 2.5, 4.0);
  const a = W0(t), b = W1(t), g = target(t);
  const wx = a.x + (b.x - a.x) * k, wy = a.y + (b.y - a.y) * k;
  return {x: wx + (g.x - wx) * w + snailX(t), y: wy + (g.y - wy) * w, z: Math.exp(keyCR(t, KZ))};
};

const kPlane = (z: number, dz: number) => 1 / (1 / z + dz);
/** transform for a plane at depth dz behind the subject; design coords = screen px offsets at the reference time */
const planeTf = (t: number, dz: number, tref: number) => {
  const c = cam(t), r = cam(tref);
  const k = kPlane(c.z, dz), kr = kPlane(r.z, dz);
  const m = k / kr;
  return `translate(540 960) scale(${f2(m)}) translate(${f2(-(c.x - r.x) * kr)} ${f2(-(c.y - r.y) * kr)})`;
};

const HOPS = [
  {t0: EV.birdHop1, x0: -1180, x1: -820},
  {t0: EV.birdHop2, x0: -820, x1: -520},
  {t0: EV.birdHop3, x0: -520, x1: -360},
];
const BIRD_S = 2.5; // bird-local units -> design px (bird plane, at the end camera)

export const Scene: React.FC<{t: number}> = ({t}) => {
  const c = cam(t);
  const px = 1 / c.z;
  const sx = snailX(t);
  // the cut window (spine coordinate sc, half-length A, half-width B): opens on "into ... pulsing", closes on "birds"
  const close = ss(t, EV.cutClose, EV.cutClose + 0.42);
  const cut = {
    sc: 0.56,
    A: 0.25 * ss(t, EV.cutOpen, EV.cutFull) * (1 - close),
    B: 0.72 * ss(t, EV.cutOpen + 0.05, EV.cutFull + 0.05) * (1 - ss(t, EV.cutClose - 0.04, EV.cutClose + 0.34)),
  };
  // skin over the broodsac reads a little more translucent as the camera comes close
  const film = 0.2 - 0.07 * ss(t, EV.pushStart, EV.pushEnd) + 0.05 * ss(t, EV.pullStart, 5.6);
  const rb = robinState(t, HOPS, HOP, EV.notice, EV.blink);
  const by = twigY(rb.x) - 1;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <filter id="h06-blurBg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="h06-blurMid" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="h06-blurBird" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1" /><feComponentTransfer><feFuncR type="linear" slope="0.86" intercept="0.045" /><feFuncG type="linear" slope="0.86" intercept="0.06" /><feFuncB type="linear" slope="0.86" intercept="0.05" /></feComponentTransfer></filter>
        <radialGradient id="h06-cshadow"><stop offset="0" stopColor="#0E2414" stopOpacity="0.5" /><stop offset="0.6" stopColor="#0E2414" stopOpacity="0.32" /><stop offset="1" stopColor="#0E2414" stopOpacity="0" /></radialGradient>
        <radialGradient id="h06-dapple"><stop offset="0" stopColor="#F6F7C9" stopOpacity="0.16" /><stop offset="1" stopColor="#F6F7C9" stopOpacity="0" /></radialGradient>
        <filter id="h06-blurMote"><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      <g transform={planeTf(t, 14, 0)}><Background t={t} /></g>
      <g transform={planeTf(t, 2.2, 0)}><Midground t={t} /></g>
      <g filter="url(#h06-blurBird)">
        <g transform={planeTf(t, 5, 6)}>
          <Twig t={t} />
          <g transform={`translate(${f2(rb.x)} ${f2(by)}) scale(${BIRD_S})`}>
            <Robin pose={rb.pose} id="h06-rb" />
          </g>
        </g>
      </g>
      <g filter="url(#h06-blurMote)"><g transform={planeTf(t, 1.2, 0)}><Motes t={t} /></g></g>
      {/* subject plane: leaf and snail (world units) */}
      <g transform={`translate(540 960) scale(${f2(c.z)}) translate(${f2(-c.x)} ${f2(-c.y)})`}>
        <Leaf t={t} px={px} />
        <g transform={`translate(${f2(sx)} 0)`}>
          <Slime x0={-472} t={t} />
          <ellipse cx={-70} cy={8} rx={460} ry={30} fill="url(#h06-cshadow)" />
          <SnailBehind t={t} px={px} />
          <SnailBody t={t} px={px} />
          <Eyestalk t={t} z={c.z} film={film} cut={cut} />
          <SnailFront t={t} px={px} />
        </g>
      </g>
    </svg>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="06" W={WD} bg="#24402F" capY={[1530, 1530]} breaks={[6]} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
