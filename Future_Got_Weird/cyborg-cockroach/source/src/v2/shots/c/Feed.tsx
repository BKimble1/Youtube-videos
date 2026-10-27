// The observer's camera feed (C3, and group A's monitor in C4): a ground-level view from the camera module on the
// observer's back, following the medic through the foam course on the lab tray toward the pink silicone target. Flat
// layers placed by depth (course.ts): the blurred lab wall far off (pans as the lens turns), the tray, curb pieces and
// foam blocks, the medic walking ahead with its loaded launch tube, and the observer's own antennae sweeping in the
// bottom of the frame. A feed look: cooler grade, a soft vignette, one faint rolling scan band. No text or UI.
import React from 'react';
import {V2, V3} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {lit as litC, shade as shadeC} from '../../../lib/color';
import {Roach2D, R2} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {f2, polyD} from '../../roach/ortho';
import {Box2D, Target2D, LabWall2, LAB2} from '../../sets/Lab2';
import {Lens, lensAt, place, objView, worldView, BLOCKS, curbs, CURB, specks, centre, courseAt, feedMedicPose, feedObsPose, TARGET_S} from './course';

const CURBS = curbs();
const SPECKS = specks();
const FLOOR = '#E4ECEF';
const FLOOR_FAR = '#D3DEE3';

type Item = {d: number; el: React.ReactNode};

/** footprint shadow of a box (local frame o/yaw), pushed a little away from the key light */
const footprint = (L: Lens, o: V3, yaw: number, hl: number, hw: number, grow: number): V2[] | null => {
  const hx: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)], hz: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const pts: V2[] = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const q: V3 = [o[0] + hx[0] * a * (hl + grow) + hz[0] * (b * (hw + grow) + grow * 0.6), 0, o[2] + hx[2] * a * (hl + grow) + hz[2] * (b * (hw + grow) + grow * 0.6)];
    const p = place(L, q);
    if (p.d < 4) return null;
    pts.push([p.x, p.y]);
  }
  return pts;
};

export const FeedScene: React.FC<{f: number; w: number; h: number; id: string}> = ({f, w, h, id}) => {
  const t = f / 30;
  const L = lensAt(t, w, h);
  const k = w / 1080; // px scale of non-world details
  const items: Item[] = [];
  const onScreen = (x: number, y: number, r: number) => x + r > -40 && x - r < w + 40 && y + r > -40 && y - r < h + 40;
  // foam blocks
  BLOCKS.forEach((b, i) => {
    const c = centre(b.s);
    const yaw = c.yaw + (b.yawAdd ?? 0);
    const o = courseAt(b.s, b.off);
    const ov = objView(L, o, yaw, [0, b.H / 2, 0]);
    if (!ov || ov.d < Math.max(b.L, b.W) * 0.6) return;
    const r = (L.F / ov.d) * Math.hypot(b.L, b.W, b.H) * 0.6;
    const pl = place(L, [o[0], b.H / 2, o[2]]);
    if (!onScreen(pl.x, pl.y, r)) return;
    const fp = footprint(L, o, yaw, b.L / 2, b.W / 2, 5);
    items.push({
      d: ov.d,
      el: (
        <g key={`b${i}`}>
          {fp && <path d={polyD(fp)} fill={R2.shadow} opacity={0.1} />}
          <Box2D id={`${id}-b${i}`} v={ov.v} b={[-b.L / 2, b.L / 2, 0, b.H, -b.W / 2, b.W / 2]} color={b.color} />
        </g>
      ),
    });
  });
  // curb pieces: the lane's edges
  CURBS.forEach((cb, i) => {
    const c = centre(cb.s);
    const o = courseAt(cb.s, cb.off);
    const ov = objView(L, o, c.yaw, [0, CURB.H / 2, 0]);
    if (!ov || ov.d < 60) return;
    const pl = place(L, [o[0], CURB.H / 2, o[2]]);
    if (!onScreen(pl.x, pl.y, (L.F / ov.d) * CURB.L)) return;
    items.push({d: ov.d, el: <Box2D key={`c${i}`} id={`${id}-c${i}`} v={ov.v} b={[-CURB.L / 2, CURB.L / 2, 0, CURB.H, -CURB.W / 2, CURB.W / 2]} color={cb.color} />});
  });
  // the silicone target at the end of the lane, its face toward the approaching medic
  {
    const c = centre(TARGET_S);
    const o = courseAt(TARGET_S, 0);
    const ov = objView(L, o, c.yaw, [15, 17, 0]);
    if (ov) items.push({d: ov.d, el: <Target2D key="tg" id={`${id}-tg`} v={ov.v} face={0} dir={1} />});
  }
  // the medic
  {
    const pose = feedMedicPose(t);
    const c: V3 = [pose.frame.o[0], 12, pose.frame.o[2]];
    const wv = worldView(L, c);
    if (wv)
      items.push({
        d: wv.d,
        el: <Roach2D key="md" pose={pose} v={wv.v} o={{id: `${id}-md`, gear: <Gear2D id={`${id}-mg`} v={wv.v} f={pose.frame} g={{kind: 'injector'}} />}} />,
      });
  }
  items.sort((a, b) => b.d - a.d);
  // the observer's own antennae (nearest of all), as tapered strokes through the lens
  const obs = feedObsPose(t);
  const ant = (pts: V3[], key: string) => {
    const q = pts.map((p) => place(L, p)).filter((p) => p.d > 3);
    if (q.length < 2) return null;
    const n = pts.length;
    const segs = q.slice(0, -1).map((p, i) => {
      const wdt = ((0.72 - (0.42 * i) / (n - 1)) * L.F) / p.d;
      return {a: p, b: q[i + 1], w: wdt, i};
    });
    return (
      <g key={key}>
        {segs.map((s) => (
          <path key={`o${s.i}`} d={`M${f2(s.a.x)},${f2(s.a.y)} L${f2(s.b.x)},${f2(s.b.y)}`} stroke={INK} strokeWidth={f2(s.w + 5 * k)} strokeLinecap="round" />
        ))}
        {segs.map((s) => (
          <path key={`f${s.i}`} d={`M${f2(s.a.x)},${f2(s.a.y)} L${f2(s.b.x)},${f2(s.b.y)}`} stroke={s.i % 2 ? R2.ant : litC(R2.ant, 0.12)} strokeWidth={f2(s.w)} strokeLinecap="round" />
        ))}
        {segs.filter((s) => s.i % 3 === 1).map((s) => (
          <path key={`h${s.i}`} d={`M${f2(s.a.x - s.w * 0.15)},${f2(s.a.y - s.w * 0.22)} L${f2(s.b.x - s.w * 0.15)},${f2(s.b.y - s.w * 0.22)}`} stroke={R2.hi} strokeWidth={f2(s.w * 0.18)} strokeLinecap="round" opacity={0.5} />
        ))}
      </g>
    );
  };
  // tray crumbs (tiny, flat): motion near the bottom of the frame
  const crumbs = SPECKS.map((sp, i) => {
    const p = place(L, sp.p);
    if (p.d < 40 || p.d > 420 || !onScreen(p.x, p.y, 4)) return null;
    const r = Math.max(0.8 * k, (sp.r * L.F) / p.d * 0.9);
    return <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(r)} ry={f2(r * Math.max(0.35, Math.min(1, (L.p[1] * 2) / p.d)))} fill={i % 3 ? '#C3CFD4' : '#B4A894'} opacity={0.55} />;
  });
  // the far room: the lab wall pans as the lens turns, and grows a little as it advances
  const pan = L.F * Math.tan(L.yaw);
  const wk = (L.F / 1080) * 1.0 * (1 + 0.0009 * Math.max(0, L.p[0]));
  const rimY = L.hz + (L.F * (L.p[1] - 6)) / 900;
  const floorY = L.hz + (L.F * L.p[1]) / 900;
  return (
    <g>
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={f2(6 * k)} />
        </filter>
        <filter id={`${id}-ab`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={f2(3.5 * k)} />
        </filter>
        <linearGradient id={`${id}-fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FLOOR_FAR} />
          <stop offset="0.35" stopColor={FLOOR} />
          <stop offset="1" stopColor={litC(FLOOR, 0.25)} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-bl)`}>
        <rect x={-50} y={-50} width={w + 100} height={h + 100} fill={LAB2.wallBot} />
        <g transform={`translate(${f2(L.cx + pan)} ${f2(L.hz - 10 * k)}) scale(${f2(wk)}) translate(-540 -1040)`}>
          <LabWall2 id={`${id}-w`} />
        </g>
        <rect x={-50} y={f2(L.hz - 14 * k)} width={w + 100} height={f2(rimY - L.hz + 16 * k)} fill={LAB2.benchTop} />
      </g>
      <rect x={-50} y={f2(rimY)} width={w + 100} height={f2(floorY - rimY + 2)} fill={LAB2.surfaceShade} />
      <rect x={-50} y={f2(floorY)} width={w + 100} height={f2(h - floorY + 50)} fill={`url(#${id}-fl)`} />
      <path d={`M-50,${f2(rimY)} H${w + 50}`} stroke="#FFFFFF" strokeWidth={f2(2 * k)} opacity={0.6} />
      {crumbs}
      {items.map((it) => it.el)}
      <g filter={`url(#${id}-ab)`}>
        {ant(obs.antL, 'aL')}
        {ant(obs.antR, 'aR')}
      </g>
    </g>
  );
};

/** the feed look over any w x h feed: cooler grade (applied by the caller's filter), vignette, one rolling scan band */
const FeedLook: React.FC<{f: number; w: number; h: number; id: string}> = ({f, w, h, id}) => {
  const k = h / 1920;
  const band = ((f * 23 * k) % (h + 400 * k)) - 200 * k;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-vg`} cx="50%" cy="48%" r="75%">
          <stop offset="0.55" stopColor="#0B1A24" stopOpacity="0" />
          <stop offset="1" stopColor="#0B1A24" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`${id}-sb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DFF4FF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#DFF4FF" stopOpacity="0.07" />
          <stop offset="1" stopColor="#DFF4FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={f2(band)} width={w} height={f2(160 * k)} fill={`url(#${id}-sb)`} />
      <path d={`M0,${f2(band + 80 * k)} H${w}`} stroke="#E8F7FF" strokeWidth={f2(Math.max(1, 1.5 * k))} opacity={0.12} />
      <rect x={0} y={0} width={w} height={h} fill="#2C6E8E" opacity={0.06} />
      <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-vg)`} />
    </g>
  );
};

/** The observer's feed for film frame f (any frame from 345 on; C3 is 372-429, the medic's approach continues through
 *  C4, 430-465, and beyond), drawn into a w x h box. Reusable on group A's monitor. */
export const C3Feed: React.FC<{f: number; w: number; h: number; id?: string}> = ({f, w, h, id = 'c3f'}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display: 'block', overflow: 'hidden'}}>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={0} y={0} width={w} height={h} />
      </clipPath>
      <filter id={`${id}-grade`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.86 0.09 0.02 0 0  0.04 0.91 0.06 0 0.005  0.03 0.08 0.95 0 0.035  0 0 0 1 0" />
      </filter>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>
      <g filter={`url(#${id}-grade)`}>
        <FeedScene f={f} w={w} h={h} id={id} />
      </g>
      <FeedLook f={f} w={w} h={h} id={id} />
    </g>
  </svg>
);
void shadeC;
