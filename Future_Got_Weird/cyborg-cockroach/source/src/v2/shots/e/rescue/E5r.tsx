// E5 (716-736, "emergency"): the OBSERVER's camera feed down a dark passage under the rubble (the same feed look as
// C3: cooler grade, soft vignette, one rolling scan band; no text or UI). The observer walks on behind the medic, so
// the passage's jagged cross-sections (broken slabs, a pipe, rebar) open out past the lens, nearer ones faster; its
// own lamp throws a cool cone of light ahead, and the medic (loaded injector) walks away down the passage inside it.
// The observer's own antennae sweep in at the bottom corners. `PassageFeed` draws the feed for any film frame; E6
// shows it on the field monitor, where the medic answers the operator's D-pad press and turns right.
import React from 'react';
import {poseRoach, RoachPose, Path} from '../../../../rig/roach';
import {Roach2D, R2} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt} from '../../../roach/ortho';
import {Layer, Cam} from '../../../dc/camera';
import {smoother, clamp, rnd} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix, lit as litC} from '../../../../lib/color';
import {RB, Pt, Rebar, Pipe, Glow2, jag, poly, f2} from '../art';
import {shotRange} from '../../../cuts2';
import {ShotProps} from '../../index2';
import {idf, FPS, FeedGrade, FeedLook} from './kit';

const E5R = shotRange('E5');
/** feed time: seconds since the feed starts (E5's first frame) */
const ft = (f: number) => (f - E5R.from) / FPS;
const VP = {x: 560, y: 1010};
const V_MM = 48;
/** the operator's D-pad press (film frame, set by E6) turns the medic right a little after it: the turn's start (s) */
export const FEED_TURN = {f: 745, yaw: -0.62, len: 34};

/** the medic's path in the feed: straight on, then (after the steering pulse) a smooth right turn */
const turnS = () => 10 + V_MM * ft(FEED_TURN.f);
const yawAt = (s: number) => FEED_TURN.yaw * smoother(clamp((s - turnS()) / FEED_TURN.len));
const feedPath: Path = (s) => {
  // integrate the heading along the arc (1 mm steps; pure)
  let x = 0, z = 0;
  const n = Math.max(0, Math.ceil(s));
  for (let i = 0; i < n; i++) {
    const ds = Math.min(1, s - i), y = yawAt(i + ds / 2);
    x += Math.cos(y) * ds;
    z -= Math.sin(y) * ds;
  }
  return {p: [x, 0, z], yaw: yawAt(s)};
};
export const feedMedic = (f: number): RoachPose => {
  const t = ft(f);
  return poseRoach({path: feedPath, s: 10 + V_MM * t, t: t + 24, search: 0.5, antL: {yaw: 0.5, pitch: 0.3}, antR: {yaw: 0.48, pitch: 0.32}, seed: 5});
};
/** the observer's camera: walking straight on behind (the passage's sections open out at a constant rate) */
const feedCam = (f: number): Cam => ({x: VP.x, y: VP.y, z: 1 + 0.3 * ft(f)});

// ---------------------------------------------------------------- the passage
const DEPTHS = [0.75, 1.0, 1.35, 1.8, 2.4, 3.2, 4.3, 5.8, 7.8];
/** a cross-section's opening at depth d (rest px): the floor just below the lens (it walks at floor level), the
 *  broken slab ceiling high above */
const opening = (k: number, d: number): Pt[] => {
  const Wl = 470 + 70 * rnd(k, 81), Wr = 520 + 80 * rnd(k + 1, 81), Ht = 680 + 160 * rnd(k + 2, 81), Hf = 150;
  const x0 = VP.x - Wl / d, x1 = VP.x + Wr / d, y0 = VP.y - Ht / d, y1 = VP.y + Hf / d;
  // a slab corner intruding at top left or right (alternating), a chunk at the floor edge
  const cut = (130 + 90 * rnd(k + 3, 81)) / d;
  const pts: Pt[] = k % 2
    ? [[x0, y1], [x0, y0 + cut], [x0 + cut * 1.3, y0], [x1, y0 + 30 / d], [x1, y1 - 60 / d], [x1 - 70 / d, y1]]
    : [[x0 + 60 / d, y1], [x0, y1 - 80 / d], [x0, y0], [x1 - cut * 1.2, y0 + 20 / d], [x1, y0 + cut], [x1, y1]];
  return jag(pts, 26 / d, 90 + k, 70 / d);
};
const Section: React.FC<{id: string; k: number; d: number}> = ({id, k, d}) => {
  const hole = opening(k, d);
  // the lamp's light: the walls fall off with distance; the floor ahead is lit most a little way out (the lamp
  // points forward and down), less right under the lens
  const b = clamp(0.9 / Math.pow(d, 1.4));
  const bf = clamp(1.4 * d * Math.exp(-d / 1.1));
  const wall = mix('#0E0C0B', '#6E655E', b);
  const floorC = mix('#0E0C0B', litC('#9A8D80', 0.1), bf);
  const big = 'M-3000,-3000 H4000 V5000 H-3000 Z';
  const yf = VP.y + 150 / d;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={0} y1={f2(VP.y - 900 / d)} x2={0} y2={f2(yf + 400 / d)}>
          <stop offset="0" stopColor={mix(wall, '#0C0A09', 0.6)} />
          <stop offset="0.7" stopColor={wall} />
          <stop offset="0.86" stopColor={floorC} />
          <stop offset="1" stopColor={floorC} />
        </linearGradient>
      </defs>
      <path d={`${big} ${poly(hole)}`} fillRule="evenodd" fill={`url(#${id}-g)`} stroke={INK} strokeWidth={f2(Math.min(6, 5 / d + 1))} strokeLinejoin="round" />
      {/* cracks and specks on the section's face */}
      <path d={`M${f2(hole[2][0] - 40 / d)},${f2(hole[2][1] + 160 / d)} l${f2(-30 / d)},${f2(90 / d)} l${f2(20 / d)},${f2(80 / d)}`} stroke={mix(wall, '#000000', 0.45)} strokeWidth={f2(3 / d + 1)} fill="none" />
      {k === 2 && <Rebar pts={[[VP.x + 300 / d, VP.y - 600 / d], [VP.x + 250 / d, VP.y - 420 / d], [VP.x + 290 / d, VP.y - 330 / d]]} w={14 / d} dark={1 - b} />}
      {k === 3 && <Pipe a={[VP.x - 800 / d, VP.y - 380 / d]} b={[VP.x - 380 / d, VP.y - 330 / d]} r={26 / d} dark={1 - b * 0.9} />}
      {/* grit on the floor in front of the section */}
      {Array.from({length: 9}, (_, i) => {
        const x = VP.x + ((rnd(i + k * 7, 83) - 0.5) * 1100) / d, r = (8 + rnd(i, 84) * 16) / d;
        const y = yf + (6 + rnd(i + 5, 85) * 60) / d;
        return <ellipse key={i} cx={f2(x)} cy={f2(y)} rx={f2(r)} ry={f2(r * 0.45)} fill={mix(floorC, '#000000', 0.32)} stroke={INK} strokeWidth={f2(1.5 / d + 0.5)} />;
      })}
    </g>
  );
};

/** the observer's antennae sweeping in at the bottom corners (screen px, kept below y 1650) */
const Antennae: React.FC<{t: number}> = ({t}) => {
  const one = (side: -1 | 1) => {
    const base: Pt = [540 + side * 610, 1990];
    const sw = 0.1 * Math.sin(t * 2.1 + (side > 0 ? 1.3 : 0));
    const pts: Pt[] = Array.from({length: 9}, (_, i) => {
      const u = i / 8;
      const a = -Math.PI / 2 - side * (0.95 - 0.55 * u + sw);
      const r = 520 * u;
      return [base[0] + Math.cos(a) * r * 0.9 - side * 30 * u * u, base[1] + Math.sin(a) * r * 0.62 + 40 * u * u];
    });
    const w = (i: number) => 34 - 22 * (i / 8);
    return (
      <g key={side}>
        {pts.slice(0, -1).map((p, i) => <path key={`o${i}`} d={`M${f2(p[0])},${f2(p[1])} L${f2(pts[i + 1][0])},${f2(pts[i + 1][1])}`} stroke={INK} strokeWidth={f2(w(i) + 8)} strokeLinecap="round" />)}
        {pts.slice(0, -1).map((p, i) => <path key={`f${i}`} d={`M${f2(p[0])},${f2(p[1])} L${f2(pts[i + 1][0])},${f2(pts[i + 1][1])}`} stroke={i % 2 ? R2.ant : litC(R2.ant, 0.14)} strokeWidth={f2(w(i))} strokeLinecap="round" />)}
      </g>
    );
  };
  return <g>{one(-1)}{one(1)}</g>;
};

/** the feed picture (1080 x 1920 authored), for film frame f */
const PassageScene: React.FC<{f: number; id: string}> = ({f, id}) => {
  const t = ft(f);
  const cam = feedCam(f);
  const pose = feedMedic(f);
  // the medic, ahead at a constant distance (the observer keeps pace); its sideways drift after the turn shows
  const xo = 10 + V_MM * t;
  const v = viewAt(-66, 16, 5.6, [xo, 0, 0], VP.x - 30, VP.y + 230);
  return (
    <g>
      <rect x={-50} y={-50} width={1180} height={2020} fill="#0B0908" />
      {DEPTHS.slice().reverse().map((d, ri) => {
        const k = DEPTHS.length - 1 - ri;
        return (
          <Layer key={k} cam={cam} depth={d}>
            <Section id={`${id}-s${k}`} k={k} d={d} />
          </Layer>
        );
      })}
      {/* the lamp's cone on the floor ahead, and the medic inside it */}
      <Glow2 id={`${id}-cone`} cx={VP.x} cy={VP.y + 240} rx={480} ry={130} color="#DDEFFF" a={0.3} />
      <Roach2D pose={pose} v={v} o={{id: `${id}-md`, shadow: 1.2, gear: <Gear2D id={`${id}-mg`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      <defs>
        <radialGradient id={`${id}-dk`} cx="0.52" cy="0.56" r="0.62">
          <stop offset="0.35" stopColor="#060504" stopOpacity={0} />
          <stop offset="1" stopColor="#060504" stopOpacity={0.85} />
        </radialGradient>
        <radialGradient id={`${id}-lamp`} cx="0.52" cy="0.62" r="0.55">
          <stop offset="0" stopColor="#E6F4FF" stopOpacity={0.12} />
          <stop offset="0.6" stopColor="#E6F4FF" stopOpacity={0.04} />
          <stop offset="1" stopColor="#E6F4FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-lamp)`} />
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-dk)`} />
      <Antennae t={t} />
    </g>
  );
};

/** the observer's feed for film frame f in a w x h box (E5 full frame; E6's monitor) */
export const PassageFeed: React.FC<{f: number; w: number; h: number; id: string}> = ({f, w, h, id}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display: 'block', overflow: 'hidden'}}>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={0} y={0} width={w} height={h} />
      </clipPath>
      <FeedGrade id={`${id}-grade`} />
    </defs>
    <g clipPath={`url(#${id}-clip)`}>
      <g filter={`url(#${id}-grade)`} transform={`scale(${f2(w / 1080)})`}>
        <PassageScene f={f} id={id} />
      </g>
      <FeedLook f={f} w={w} h={h} id={id} />
    </g>
  </svg>
);

export const E5: React.FC<ShotProps> = ({f}) => <PassageFeed f={f} w={1080} h={1920} id={idf('e3e', f)} />;
void Glow2;
void RB;
