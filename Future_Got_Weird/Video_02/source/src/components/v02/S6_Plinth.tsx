import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {PLINTH} from '../../lib/shots';
import {MU, SensorStool, SideCard} from './S5_Museum';

/**
 * S6.1 set: a close-up of the history shelf's EMPTY fourth plinth, matched to S5's gallery (work/S5 S5_Museum: the same
 * plinth proportions, plaque, pools of light, rope posts and spans, and the 2021 exhibit on the third plinth), so the cut
 * from S5's wide shot lands on the same objects. S6 world px = S5 world px − 3020 (S5's fourth plinth at x 3980 sits at
 * x 960 here); slab top 512, floor 930 as in S5. Wrap in one camera Layer (the rope may sit on a nearer layer for a
 * hint of parallax).
 *
 * The S5 -> S6 hand-off (review r1 D30): S6 opens on S5's last framing and eases into the close-up, so MuseumSet also
 * draws what S5's end framing shows beyond the two plinths: the lamp track with its spot lamps (S5 MuseumHall), and,
 * past the rope's last post, the cheap-sensor stool and its 2021 side card (S5_Museum SensorStool / SideCard, imported
 * read-only and drawn at S5's own coordinates under translate(-3020 0)), so they visibly slide out at the right instead
 * of vanishing at the cut. `sw` is the set's outline width: S5 draws its set at 3.5 world px, S6 at OUTLINE; the scene
 * eases it from 3.5 to OUTLINE during the opening move so the first frame matches S5's last.
 *
 * Also the cut-in arm: the checker's arm in her coral cardigan sleeve, reaching in from off-screen, drawn with the
 * Video 01 rig's mitt (ellipse palm + thumb) and the HandheldSensor's curled fingers, at a close-up scale.
 */

/** S6 world px = S5 world px − S5_SHIFT. */
export const S5_SHIFT = 3020;
/** S5's set outline width (S5_Museum SW), for the first frame of the hand-off. */
export const S5_SET_SW = 3.5;

/** Geometry of the set (world px; S5's MU constants shifted by −3020). */
export const PG = {
  floorY: 930,
  skirtH: 26,
  slabTop: 512,
  slabH: 44,
  slabW: 640,
  bodyW: 584,
  plaque: {w: 480, h: 144, y0: 586},
  /** plinth centres: the 2021 exhibit's plinth and the empty fourth plinth */
  P3: 0,
  P4: 960,
  main: {slab: {x0: 640, x1: 1280, y0: 512, y1: 556}},
  /** rope posts (S5 posts 3500 and 4460) and the rope height/sag; spans run post to post */
  posts: [-480, 480, 1440],
  postFoot: 1010,
  ropeY: 700,
  sag: 100,
  pool: {dy: -212, rx: 470, ry: 330},
};

// The S5 -> S6 hand-off draws S5's end framing with S6's set: it only matches while S6's set IS S5's shifted by
// S5_SHIFT. Fail at load if either gallery moves.
{
  const pairs: [string, number, number][] = [
    ['P3', PG.P3, MU.P[2] - S5_SHIFT],
    ['P4', PG.P4, MU.P[3] - S5_SHIFT],
    ...PG.posts.map((x, i): [string, number, number] => [`post${i}`, x, MU.posts[i + 2] - S5_SHIFT]),
    ['floorY', PG.floorY, MU.floorY],
    ['skirtH', PG.skirtH, MU.skirtH],
    ['slabTop', PG.slabTop, MU.slabTop],
    ['slabH', PG.slabH, MU.slabH],
    ['slabW', PG.slabW, MU.slabW],
    ['bodyW', PG.bodyW, MU.bodyW],
    ['plaque.y0', PG.plaque.y0, MU.plaque.y0],
    ['plaque.w', PG.plaque.w, MU.plaque.w],
    ['ropeY', PG.ropeY, MU.ropeY],
    ['sag', PG.sag, MU.sag],
    ['postFoot', PG.postFoot, MU.postFoot],
    ['pool.rx', PG.pool.rx, MU.pool.rx],
  ];
  const bad = pairs.filter(([, a, b]) => Math.abs(a - b) > 1e-9);
  if (bad.length) throw new Error(`S6_Plinth: S6 set no longer matches S5's gallery − ${S5_SHIFT}: ${bad.map(([n, a, b]) => `${n} ${a} vs ${b}`).join(', ')}`);
}

/** Where the sensor's grip foot stands on the plinth (top of the slab). */
export const SENSOR_SPOT = {x: 952, y: PG.slabTop};

const inkW = (w: number) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const});
const ink = inkW(OUTLINE);
const ink3 = (w = 3) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const f2 = (n: number) => Math.round(n * 100) / 100;

/** One plinth as S5 draws it (shadow, body, wood slab, saffron plaque with two screws); text drawn by the caller. */
const Plinth: React.FC<{x: number; sw?: number; children?: React.ReactNode}> = ({x, sw = OUTLINE, children}) => {
  const ink = inkW(sw);
  const fy = PG.floorY;
  const top = PG.slabTop;
  const pq = PG.plaque;
  return (
    <g>
      <ellipse cx={x + 24} cy={fy + 6} rx={PG.bodyW / 2 + 50} ry={18} fill={C.shadow} />
      <rect x={x - PG.bodyW / 2} y={top + PG.slabH - 4} width={PG.bodyW} height={fy - top - PG.slabH + 4} fill={PLINTH.body} {...ink} />
      <rect x={x - PG.slabW / 2} y={top} width={PG.slabW} height={PG.slabH} rx={10} fill={PLINTH.top} {...ink} />
      <rect x={x - pq.w / 2} y={pq.y0} width={pq.w} height={pq.h} rx={14} fill={PLINTH.plaque} {...ink} />
      {[x - pq.w / 2 + 18, x + pq.w / 2 - 18].map((sx) => (
        <circle key={sx} cx={sx} cy={pq.y0 + 18} r={4.5} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      ))}
      {children}
    </g>
  );
};

/**
 * The 2021 exhibit as S5 leaves it at its last frame (static copy of S5_Exhibits Exhibit2021: laser box with the strip
 * detector and the monitor on top, a coral screen, a wooden block and a ball, a small upright wall; the laser beam to
 * the wall spot and the detector's dashed view line). Plinth-local px, origin on top of the slab.
 */
const Exhibit2021Still: React.FC<{x: number; y: number}> = ({x, y}) => {
  const port = {x: -42, y: -51};
  const stripEnd = {x: -36, y: -119};
  const spot = {x: 284, y: -205};
  const ballX = 214;
  const k = 11;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={272} y={-9} width={44} height={9} rx={3} fill={C.inkMuted} {...ink3(2.5)} />
      <rect x={284} y={-312} width={20} height={304} rx={3} fill={C.cream} {...ink3()} />
      <rect x={246} y={-30} width={30} height={30} rx={4} fill={C.woodLight} {...ink3(2.5)} />
      <g transform={`translate(${ballX} -17)`}>
        <circle cx={0} cy={0} r={16} fill={C.saffron} {...ink3(2.5)} />
        <path d="M -15 -3 Q 0 5 15 -3" fill="none" stroke={C.saffronDeep} strokeWidth={3} />
      </g>
      <rect x={146} y={-8} width={30} height={8} rx={3} fill={C.coralDeep} {...ink3(2.5)} />
      <path d="M 150 -4 L 150 -110 Q 150 -122 161 -122 Q 172 -122 172 -110 L 172 -4 Z" fill={C.coral} {...ink3()} />
      <rect x={-320} y={-94} width={264} height={94} rx={10} fill={C.blue} {...ink3()} />
      <rect x={-302} y={-78} width={120} height={52} rx={7} fill={C.blueLight} {...ink3(2.5)} />
      <circle cx={-142} cy={-48} r={20} fill={C.saffron} {...ink3(2.5)} />
      <line x1={-142} y1={-48} x2={-132} y2={-60} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <rect x={-104} y={-74} width={30} height={14} rx={4} fill={C.blueDeep} {...ink3(2)} />
      <rect x={-58} y={-63} width={16} height={24} rx={4} fill={C.saffronLight} {...ink3(2.5)} />
      {[-136, -70].map((fx) => (
        <rect key={fx} x={fx - 4} y={-108} width={8} height={14} fill={C.inkSoft} {...ink3(2)} />
      ))}
      <rect x={-146} y={-132} width={110} height={26} rx={6} fill={C.blue} {...ink3()} />
      {Array.from({length: 8}, (_, i) => (
        <rect key={i} x={f2(-142 + i * 13.3)} y={-126} width={9.5} height={14} rx={2} fill={i < 6 ? C.saffron : C.cream} stroke={C.ink} strokeWidth={1.8} />
      ))}
      <rect x={-238} y={-112} width={16} height={20} fill={C.inkSoft} {...ink3(2.5)} />
      <rect x={-312} y={-242} width={164} height={132} rx={10} fill={C.inkSoft} {...ink3()} />
      <rect x={-300} y={-230} width={140} height={106} rx={5} fill={C.cream} {...ink3(2.5)} />
      <ellipse cx={-188} cy={-160} rx={19} ry={22} fill={C.tealLight} />
      <ellipse cx={-188} cy={-158} rx={10} ry={12} fill={C.teal} opacity={0.75} />
      <ellipse cx={-249} cy={-153} rx={23} ry={19} fill={C.tealLight} />
      <ellipse cx={-249} cy={-153} rx={13} ry={11} fill={C.teal} />
      <line x1={port.x} y1={port.y} x2={spot.x} y2={spot.y} stroke={C.coral} strokeWidth={5.5} strokeLinecap="round" />
      <line x1={stripEnd.x} y1={stripEnd.y} x2={spot.x} y2={spot.y - 6} stroke={C.blueDeep} strokeWidth={2.6} strokeLinecap="round" opacity={0.6} strokeDasharray="9 8" />
      <path d={`M ${spot.x} ${spot.y - k} L ${spot.x + k} ${spot.y} L ${spot.x} ${spot.y + k} L ${spot.x - k} ${spot.y} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

/** S5's lamp track and one spot lamp over each plinth (copy of S5_Museum MuseumHall's lamps; S6 world px). Above every
 *  settled S6 framing (rail at y −200): seen only during the opening move from S5's end framing. */
const LampTrack: React.FC<{sw: number}> = ({sw}) => {
  const k = {stroke: C.ink, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const k3 = {...k, strokeWidth: 3};
  return (
    <g>
      <rect x={-2000} y={MU.railY - 9} width={6000} height={18} fill={C.inkMuted} {...k} />
      {MU.P.map((x) => x - S5_SHIFT).map((x) => (
        <g key={`lamp${x}`} transform={`translate(${x} ${MU.railY + 9})`}>
          <rect x={-6} y={0} width={12} height={34} fill={C.inkSoft} {...k3} />
          <g transform="translate(0 40) rotate(0)">
            <path d="M -30 -10 L 30 -10 L 40 46 L -40 46 Z" fill={C.cream} {...k} />
            <rect x={-42} y={42} width={84} height={12} rx={5} fill={C.saffronLight} {...k3} />
          </g>
        </g>
      ))}
    </g>
  );
};

/** The museum wall, floor, the 2021 neighbour and the empty fourth plinth (plaque text animates in via props), plus S5's
 *  lamp track and the end of the shelf (the stool with the cheap sensor board and its 2021 side card; `stoolLed` is the
 *  board's LED as S5 leaves it blinking). `sw`: set outline width (see the file header). */
export const MuseumSet: React.FC<{plate1?: number; plate2?: number; sw?: number; stoolLed?: number}> = ({plate1 = 0, plate2 = 0, sw = OUTLINE, stoolLed = 0}) => {
  const ink = inkW(sw);
  const fy = PG.floorY;
  const pq = PG.plaque;
  const t1 = clamp01(plate1);
  const t2 = clamp01(plate2);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* wall, far past the frame, and S5's flat pools of light behind each plinth (cutout shapes, no gradient) */}
      <rect x={-2000} y={-2000} width={6000} height={2000 + fy} fill={PLINTH.wall} />
      {[PG.P3, PG.P4].map((x) => (
        <ellipse key={x} cx={x} cy={PG.slabTop + PG.pool.dy} rx={PG.pool.rx} ry={PG.pool.ry} fill={C.cream} opacity={0.55} />
      ))}
      <LampTrack sw={sw} />
      {/* skirting + floor */}
      <rect x={-2000} y={fy - PG.skirtH} width={6000} height={PG.skirtH} fill={C.cream} {...ink} />
      <rect x={-2000} y={fy} width={6000} height={1200} fill={C.paperDeep} {...ink} />

      {/* the third plinth (2021) and its exhibit, as S5 leaves them */}
      <Plinth x={PG.P3} sw={sw}>
        <text x={PG.P3} y={pq.y0 + 56} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={66} fill={C.ink}>
          2021
        </text>
        <text x={PG.P3} y={pq.y0 + 112} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.ink}>
          Wisconsin + Milan
        </text>
      </Plinth>
      <Exhibit2021Still x={PG.P3} y={PG.slabTop} />

      {/* the fourth plinth: empty (blank plaque) until the checker sets her sensor on it */}
      <Plinth x={PG.P4} sw={sw}>
        {t1 > 0 && (
          <g opacity={Math.min(1, t1 * 1.6)} transform={`translate(${PG.P4} ${pq.y0 + 56}) scale(${0.92 + 0.08 * t1})`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={60} fill={C.ink}>
              published 2026
            </text>
          </g>
        )}
        {t2 > 0 && (
          <g opacity={Math.min(1, t2 * 1.6)} transform={`translate(${PG.P4} ${pq.y0 + 112}) scale(${0.92 + 0.08 * t2})`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.ink}>
              MIT + Dartmouth
            </text>
          </g>
        )}
      </Plinth>

      {/* the end of the shelf as S5 leaves it (S5 world px): the 2021 cheap-sensor card and the stool with its board */}
      <g transform={`translate(${-S5_SHIFT} 0)`}>
        <SideCard t={1} lines={['2021', 'hidden objects tracked', 'with a cheap sensor', 'Callenberg et al. · illustration']} />
        <SensorStool x={MU.stool.x} led={stoolLed} />
      </g>
    </svg>
  );
};

/** The velvet rope as S5 hangs it: brass-topped posts in the gaps between plinths and a sagging span post to post
 *  (the span in front of the fourth plinth and the one to its left; S5 has no rope right of the last post). */
export const VelvetRope: React.FC<{sw?: number}> = ({sw = OUTLINE}) => {
  const ink = inkW(sw);
  const y = PG.ropeY;
  const foot = PG.postFoot;
  const span = (x0: number, x1: number) => {
    const mx = (x0 + x1) / 2;
    const my = y + 2 * PG.sag;
    return `M ${x0} ${y} Q ${mx} ${my} ${x1} ${y}`;
  };
  const spans = [span(PG.posts[0], PG.posts[1]), span(PG.posts[1], PG.posts[2])];
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {spans.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
          <path d={d} fill="none" stroke={PLINTH.rope} strokeWidth={26} strokeLinecap="round" />
          <path d={d} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" transform="translate(0 -6)" opacity={0.7} />
        </g>
      ))}
      {/* posts over the rope ends, as S5's RopePost */}
      {PG.posts.map((x) => (
        <g key={x}>
          <ellipse cx={x + 10} cy={foot + 4} rx={56} ry={12} fill={C.shadow} />
          <rect x={x - 17} y={y - 6} width={34} height={foot - y} rx={10} fill={PLINTH.post} {...ink} />
          <ellipse cx={x} cy={foot} rx={44} ry={13} fill={C.saffronDeep} {...ink} />
          <rect x={x - 26} y={y + 4} width={52} height={14} rx={6} fill={C.saffronDeep} {...ink} strokeWidth={3} />
          <circle cx={x} cy={y - 26} r={27} fill={C.saffron} {...ink} />
          <circle cx={x - 8} cy={y - 34} r={7} fill={C.cream} opacity={0.8} />
          <circle cx={x} cy={y} r={13} fill={C.saffronDeep} {...ink} strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ the cut-in arm */

export type P = {x: number; y: number};

/**
 * The checker's arm reaching in from off-screen: a straight forearm-and-sleeve from a fixed off-screen shoulder to the
 * hand, coral cardigan sleeve with a rolled cuff, skin wrist, and the rig's mitt (palm + thumb) at `hand`, oriented
 * along the arm. `k` = rig scale (1 = the Video 01 rig; the mitt is 40 px wide at k = 1).
 */
export const ReachArm: React.FC<{hand: P; shoulder: P; k: number; skin: string; sleeve: string; cuffBack?: number}> = ({hand, shoulder, k, skin, sleeve, cuffBack = 62}) => {
  const dx = hand.x - shoulder.x;
  const dy = hand.y - shoulder.y;
  const L = Math.hypot(dx, dy) || 1;
  const u = {x: dx / L, y: dy / L};
  const cuff = {x: hand.x - u.x * cuffBack * k, y: hand.y - u.y * cuffBack * k};
  const W = 30 * k;
  const ang = (Math.atan2(-u.x, u.y) * 180) / Math.PI;
  return (
    <g>
      <line x1={shoulder.x} y1={shoulder.y} x2={hand.x} y2={hand.y} stroke={C.ink} strokeWidth={W + OUTLINE * 2} strokeLinecap="round" />
      <line x1={cuff.x} y1={cuff.y} x2={hand.x} y2={hand.y} stroke={skin} strokeWidth={W} strokeLinecap="round" />
      {/* the loose cardigan sleeve and its rolled cuff (a band line just above the wrist) */}
      <line x1={shoulder.x} y1={shoulder.y} x2={cuff.x} y2={cuff.y} stroke={C.ink} strokeWidth={W + 16 * k + OUTLINE * 2} strokeLinecap="round" />
      <line x1={shoulder.x} y1={shoulder.y} x2={cuff.x} y2={cuff.y} stroke={sleeve} strokeWidth={W + 16 * k} strokeLinecap="round" />
      <path
        d={`M ${cuff.x - u.x * 16 * k + u.y * (W / 2 + 8 * k)} ${cuff.y - u.y * 16 * k - u.x * (W / 2 + 8 * k)} L ${cuff.x - u.x * 16 * k - u.y * (W / 2 + 8 * k)} ${cuff.y - u.y * 16 * k + u.x * (W / 2 + 8 * k)}`}
        stroke={C.ink}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {/* mitt with a thumb (Character.tsx ArmShape, side +1) */}
      <g transform={`translate(${hand.x} ${hand.y}) rotate(${ang}) scale(${k})`}>
        <ellipse cx={0} cy={6} rx={20} ry={18} fill={skin} stroke={C.ink} strokeWidth={OUTLINE / k} />
        <ellipse cx={-14} cy={-2} rx={8} ry={10} fill={skin} stroke={C.ink} strokeWidth={OUTLINE / k} transform="rotate(-30)" />
        <ellipse cx={-14} cy={-2} rx={6} ry={8} fill={skin} transform="rotate(-30)" />
      </g>
    </g>
  );
};

/** The three curled fingers round the sensor grip (HandheldSensor's `skin` fingers), drawn separately so they can
 *  slide off the grip with the hand when she lets go. Sensor-local units at scale k, hand at (x, y). */
export const GripFingers: React.FC<{x: number; y: number; k: number; skin: string}> = ({x, y, k, skin}) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    {[8, -1, -10].map((fy) => (
      <rect key={fy} x={-16} y={fy - 5.5} width={31} height={12} rx={6} fill={skin} stroke={C.ink} strokeWidth={3} />
    ))}
  </g>
);

/** A small museum label card (cream, ink outline) with up to two lines. */
export const MuseumLabel: React.FC<{x: number; y: number; w: number; line1: string; line2?: string; t: number; t2?: number; leaderTo?: P}> = ({x, y, w, line1, line2, t, t2 = 1, leaderTo}) => {
  if (t <= 0) return null;
  const h = line2 ? 132 : 82;
  const s = 0.9 + 0.1 * Math.min(1.08, t);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={Math.min(1, t * 1.8)}>
      {leaderTo && (
        <g>
          <path d={`M ${x} ${y + h * 0.62} L ${leaderTo.x} ${leaderTo.y}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <circle cx={leaderTo.x} cy={leaderTo.y} r={7} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
        </g>
      )}
      <g transform={`translate(${x} ${y + h / 2}) scale(${s}) translate(${-x} ${-(y + h / 2)})`}>
        <rect x={x + 8} y={y + 10} width={w} height={h} rx={16} fill={C.shadow} />
        <rect x={x} y={y} width={w} height={h} rx={16} fill={C.cream} {...ink} />
        <text x={x + w / 2} y={y + 44} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={46} fill={C.ink}>
          {line1}
        </text>
        {line2 && (
          <text x={x + w / 2} y={y + 96} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.inkSoft} opacity={clamp01(t2)}>
            {line2}
          </text>
        )}
      </g>
    </svg>
  );
};

/**
 * "found in phones and gadgets": two small flat icons that pop in on the wall under the museum label: a generic phone
 * (the same blue phone as S6.2, seen from the back with its camera cluster and a small time-of-flight window) and a
 * robot vacuum with a sensor turret. No brands. `tPhone` / `tGadget` 0..1 (may overshoot: a pop).
 */
export const GadgetIcons: React.FC<{tPhone: number; tGadget: number}> = ({tPhone, tGadget}) => {
  const pop = (t: number) => ({s: Math.max(0, t), o: Math.min(1, Math.max(0, t) * 2)});
  const p = pop(tPhone);
  const v = pop(tGadget);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {p.s > 0.01 && (
        <g transform={`translate(1362 468) scale(${p.s})`} opacity={p.o}>
          <circle cx={0} cy={0} r={70} fill={C.cream} {...ink} />
          <rect x={-28} y={-48} width={56} height={96} rx={13} fill={C.blue} {...ink} />
          <rect x={-22} y={-44} width={30} height={34} rx={9} fill={C.blueDeep} stroke={C.ink} strokeWidth={3} />
          <circle cx={-14} cy={-35} r={5.5} fill={C.inkSoft} stroke={C.ink} strokeWidth={2} />
          <circle cx={-14} cy={-19} r={5.5} fill={C.inkSoft} stroke={C.ink} strokeWidth={2} />
          <circle cx={0} cy={-27} r={4.5} fill={C.teal} stroke={C.ink} strokeWidth={2} />
        </g>
      )}
      {v.s > 0.01 && (
        <g transform={`translate(1526 468) scale(${v.s})`} opacity={v.o}>
          <circle cx={0} cy={-6} r={70} fill={C.cream} {...ink} />
          <path d="M -62 -6 Q -62 -26 0 -26 Q 62 -26 62 -6 L 62 10 Q 62 26 0 26 Q -62 26 -62 10 Z" fill={C.cream} {...ink} />
          <path d="M -62 2 Q 0 16 62 2" fill="none" stroke={C.ink} strokeWidth={3} />
          <rect x={-18} y={-44} width={36} height={22} rx={9} fill={C.teal} {...ink} strokeWidth={3} />
          <rect x={-8} y={-38} width={16} height={8} rx={3} fill={C.coral} stroke={C.ink} strokeWidth={2} />
          <circle cx={36} cy={-8} r={5} fill={C.saffron} stroke={C.ink} strokeWidth={2} />
        </g>
      )}
    </svg>
  );
};
