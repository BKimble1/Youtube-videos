import React from 'react';
import {C, F} from '../../theme';
import {PLINTH} from '../../lib/shots';

/**
 * S5 set: the history shelf. One long museum gallery in WORLD px (draw it inside one camera <Layer>): a pale blue wall
 * (PLINTH.wall) with a track of small spot lamps and flat cream pools of light, a cream skirting board and a paper floor;
 * a short wooden wall ledge at the left end (where the rolled-up plan lands); four plinths in a row (cream body, wood
 * top slab, saffron plaque; the same proportions as S6's plinth close-up so the cut matches), brass-topped rope posts
 * in the gaps, the velvet rope and its sign, and at the far right end (past the rope's last post) a little stool with
 * a fingertip-sized sensor board and its side card.
 *
 * Exhibits are drawn in plinth-local px: origin at the plinth's centre on top of its slab (y up is negative).
 */

export const MU = {
  floorY: 930,
  skirtH: 26,
  slabTop: 512,
  slabH: 44,
  slabW: 640,
  bodyW: 584,
  plaque: {w: 480, h: 144, y0: 586},
  /** plinth centres (x) */
  P: [1100, 2060, 3020, 3980],
  /** rope posts: in the gaps, one at each end */
  posts: [620, 1580, 2540, 3500, 4460],
  postFoot: 1010,
  ropeY: 700,
  sag: 100,
  ledge: {x0: 60, x1: 460, y: 430, t: 26},
  /** the cheap-sensor side exhibit sits past the rope's end, beyond x 4940, so it stays outside every S6 framing of the
   *  fourth plinth (S6 world = S5 world − 3020; its opening frame reaches S5 x 4860, its push-in x 4937) */
  stool: {x: 5290, seat: 730},
  card: {x: 5290, y0: 320, w: 660, h: 272},
  railY: -200,
  pool: {dy: -212, rx: 470, ry: 330},
};

const SW = 3.5; // set outline (world px): ~5 px in the close-ups, ~2.5 px in the wide shots
const ink = (w = SW) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const f2 = (n: number) => Math.round(n * 100) / 100;

/** The wall, lamps, pools of light, skirting and floor (extends far past every framing). */
export const MuseumHall: React.FC = () => {
  const fy = MU.floorY;
  return (
    <g>
      <rect x={-3000} y={-3000} width={12000} height={3000 + fy} fill={PLINTH.wall} />
      {/* flat pools of light behind each plinth (cutout shapes, no gradient) */}
      {MU.P.map((x) => (
        <ellipse key={`pool${x}`} cx={x} cy={MU.slabTop + MU.pool.dy} rx={MU.pool.rx} ry={MU.pool.ry} fill={C.cream} opacity={0.55} />
      ))}
      {/* lamp track and one small spot lamp over each plinth */}
      <rect x={-3000} y={MU.railY - 9} width={12000} height={18} fill={C.inkMuted} {...ink()} />
      {MU.P.map((x) => (
        <g key={`lamp${x}`} transform={`translate(${x} ${MU.railY + 9})`}>
          <rect x={-6} y={0} width={12} height={34} fill={C.inkSoft} {...ink(3)} />
          <g transform="translate(0 40) rotate(0)">
            <path d="M -30 -10 L 30 -10 L 40 46 L -40 46 Z" fill={C.cream} {...ink()} />
            <rect x={-42} y={42} width={84} height={12} rx={5} fill={C.saffronLight} {...ink(3)} />
          </g>
        </g>
      ))}
      {/* skirting + floor */}
      <rect x={-3000} y={fy - MU.skirtH} width={12000} height={MU.skirtH} fill={C.cream} {...ink()} />
      <rect x={-3000} y={fy} width={12000} height={2000} fill={C.paperDeep} {...ink()} />
    </g>
  );
};

/** The short wooden wall ledge at the left end of the gallery. */
export const Ledge: React.FC = () => {
  const l = MU.ledge;
  return (
    <g>
      {[l.x0 + 70, l.x1 - 70].map((x) => (
        <path key={x} d={`M ${x - 10} ${l.y + l.t - 2} L ${x + 10} ${l.y + l.t - 2} L ${x + 10} ${l.y + l.t + 64} Q ${x - 4} ${l.y + l.t + 40} ${x - 10} ${l.y + l.t + 8} Z`} fill={PLINTH.post} {...ink(3)} />
      ))}
      <rect x={l.x0 + 6} y={l.y + 8} width={l.x1 - l.x0} height={l.t} rx={6} fill={C.shadow} />
      <rect x={l.x0} y={l.y} width={l.x1 - l.x0} height={l.t} rx={6} fill={PLINTH.top} {...ink()} />
    </g>
  );
};

export type PlaqueText = {year: string; place: string};

/** One plinth (shadow, body, wood slab, saffron plaque with two screws and its text, or blank). */
export const Plinth: React.FC<{x: number; plaque?: PlaqueText}> = ({x, plaque}) => {
  const fy = MU.floorY;
  const top = MU.slabTop;
  const pq = MU.plaque;
  return (
    <g>
      <ellipse cx={x + 24} cy={fy + 6} rx={MU.bodyW / 2 + 50} ry={18} fill={C.shadow} />
      <rect x={x - MU.bodyW / 2} y={top + MU.slabH - 4} width={MU.bodyW} height={fy - top - MU.slabH + 4} fill={PLINTH.body} {...ink()} />
      <rect x={x - MU.slabW / 2} y={top} width={MU.slabW} height={MU.slabH} rx={10} fill={PLINTH.top} {...ink()} />
      <rect x={x - pq.w / 2} y={pq.y0} width={pq.w} height={pq.h} rx={14} fill={PLINTH.plaque} {...ink()} />
      {[x - pq.w / 2 + 18, x + pq.w / 2 - 18].map((sx) => (
        <circle key={sx} cx={sx} cy={pq.y0 + 18} r={4.5} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      ))}
      {plaque && (
        <g>
          <text x={x} y={pq.y0 + 56} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={66} fill={C.ink}>
            {plaque.year}
          </text>
          <text x={x} y={pq.y0 + 112} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.ink}>
            {plaque.place}
          </text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ rope */

/** One brass-topped rope post (S6's post design) standing on the floor in front of the plinths. */
export const RopePost: React.FC<{x: number}> = ({x}) => {
  const y = MU.ropeY;
  const foot = MU.postFoot;
  return (
    <g>
      <ellipse cx={x + 10} cy={foot + 4} rx={56} ry={12} fill={C.shadow} />
      <rect x={x - 17} y={y - 6} width={34} height={foot - y} rx={10} fill={PLINTH.post} {...ink()} />
      <ellipse cx={x} cy={foot} rx={44} ry={13} fill={C.saffronDeep} {...ink()} />
      <rect x={x - 26} y={y + 4} width={52} height={14} rx={6} fill={C.saffronDeep} {...ink(3)} />
      <circle cx={x} cy={y - 26} r={27} fill={C.saffron} {...ink()} />
      <circle cx={x - 8} cy={y - 34} r={7} fill={C.cream} opacity={0.8} />
      <circle cx={x} cy={y} r={13} fill={C.saffronDeep} {...ink(3)} />
    </g>
  );
};

/** A rope from (x0, y0) to (x1, y1) whose lowest point hangs `sag` px below the straight chord's midpoint. */
export const RopeSpan: React.FC<{x0: number; y0: number; x1: number; y1: number; sag: number}> = ({x0, y0, x1, y1, sag}) => {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + 2 * sag;
  const d = `M ${f2(x0)} ${f2(y0)} Q ${f2(mx)} ${f2(my)} ${f2(x1)} ${f2(y1)}`;
  return (
    <g>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
      <path d={d} fill="none" stroke={PLINTH.rope} strokeWidth={26} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" transform="translate(0 -6)" opacity={0.7} />
    </g>
  );
};

/** Point on a RopeSpan at parameter u (0..1). */
export const ropePoint = (x0: number, y0: number, x1: number, y1: number, sag: number, u: number) => {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + 2 * sag;
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  const c = u * u;
  return {x: a * x0 + b * mx + c * x1, y: a * y0 + b * my + c * y1};
};

/** The small sign hanging from the rope by two strings from one hook: pivot at (x, y), rotation `rot` (deg). */
export const RopeSign: React.FC<{x: number; y: number; rot: number; text: string; opacity?: number}> = ({x, y, rot, text, opacity = 1}) => {
  const w = 720;
  const h = 108;
  const top = 44;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})`} opacity={opacity}>
      <path d={`M ${-w / 2 + 40} ${top + 6} L 0 0 L ${w / 2 - 40} ${top + 6}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={8} fill={C.saffronDeep} {...ink(3)} />
      <rect x={-w / 2 + 8} y={top + 10} width={w} height={h} rx={16} fill={C.shadow} />
      <rect x={-w / 2} y={top} width={w} height={h} rx={16} fill={C.cream} {...ink()} />
      {[-w / 2 + 40, w / 2 - 40].map((sx) => (
        <circle key={sx} cx={sx} cy={top + 10} r={5} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      ))}
      <text x={0} y={top + h / 2 + 2} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={66} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ the cheap-sensor side exhibit */

/** A little wooden stool with a fingertip-sized sensor board standing on it (LED `led` 0..1; `hop` px, negative = up,
 *  lifts the board off the seat; `ping` 0..1 sends three arcs out of its window). */
export const SensorStool: React.FC<{x: number; led?: number; ping?: number; hop?: number}> = ({x, led = 0, ping = 0, hop = 0}) => {
  const fy = MU.floorY;
  const seat = MU.stool.seat;
  const legTop = seat + 20;
  return (
    <g>
      <ellipse cx={x + 12} cy={fy + 6} rx={100} ry={12} fill={C.shadow} />
      {[
        [-52, -74],
        [52, 74],
      ].map(([a, b]) => (
        <path key={a} d={`M ${x + a} ${legTop} L ${x + b} ${fy + 2}`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      ))}
      {[
        [-52, -74],
        [52, 74],
      ].map(([a, b]) => (
        <path key={`i${a}`} d={`M ${x + a} ${legTop} L ${x + b} ${fy + 2}`} stroke={PLINTH.post} strokeWidth={14} strokeLinecap="round" />
      ))}
      <line x1={x - 64} y1={fy - 70} x2={x + 64} y2={fy - 70} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
      <line x1={x - 64} y1={fy - 70} x2={x + 64} y2={fy - 70} stroke={PLINTH.post} strokeWidth={7} strokeLinecap="round" />
      <rect x={x - 78} y={seat} width={156} height={24} rx={8} fill={PLINTH.top} {...ink()} />
      {/* the board: a tiny module on a little foot */}
      <g transform={`translate(0 ${f2(hop)})`}>
      <rect x={x - 10} y={seat - 8} width={20} height={9} rx={2} fill={C.inkSoft} {...ink(2.5)} />
      <rect x={x - 24} y={seat - 42} width={48} height={34} rx={4} fill={C.teal} {...ink(2.5)} />
      <rect x={x - 9} y={seat - 33} width={18} height={14} rx={3} fill={C.inkSoft} stroke={C.ink} strokeWidth={2} />
      <circle cx={x - 4} cy={seat - 26} r={2.6} fill={C.coral} />
      <circle cx={x + 4} cy={seat - 26} r={2.6} fill={C.blueLight} />
      <circle cx={x + 15} cy={seat - 16} r={4.6} fill={led > 0.5 ? C.saffron : C.tealDeep} stroke={C.ink} strokeWidth={1.8} />
      {[-18, 18].map((dx) => (
        <circle key={dx} cx={x + dx} cy={seat - 36} r={2.2} fill={C.cream} />
      ))}
      {/* the board pings: three small arcs leave its window */}
      {[0, 0.22, 0.44].map((d) => {
        const t = (ping - d) / 0.56;
        if (t <= 0 || t >= 1) return null;
        const r = 20 + 90 * t;
        return <path key={d} d={`M ${f2(x - r * 0.7)} ${f2(seat - 26 - r * 0.7)} A ${f2(r)} ${f2(r)} 0 0 1 ${f2(x + r * 0.7)} ${f2(seat - 26 - r * 0.7)}`} fill="none" stroke={C.coralDeep} strokeWidth={6} strokeLinecap="round" opacity={1 - t * t} />;
      })}
      </g>
    </g>
  );
};

/** The side card on the wall above the stool (four lines; `t` 0..1 pop). */
export const SideCard: React.FC<{t: number; lines: [string, string, string, string]}> = ({t, lines}) => {
  if (t <= 0) return null;
  const c = MU.card;
  const s = 0.9 + 0.1 * Math.min(1.06, t);
  const cy = c.y0 + c.h / 2;
  const x0 = c.x - c.w / 2;
  return (
    <g opacity={Math.min(1, t * 1.8)} transform={`translate(${c.x} ${cy}) scale(${f2(s)}) translate(${-c.x} ${-cy})`}>
      {/* leader down to the board */}
      <path d={`M ${c.x} ${c.y0 + c.h} L ${c.x} ${MU.stool.seat - 52}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={c.x} cy={MU.stool.seat - 50} r={7} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
      <rect x={x0 + 10} y={c.y0 + 12} width={c.w} height={c.h} rx={18} fill={C.shadow} />
      <rect x={x0} y={c.y0} width={c.w} height={c.h} rx={18} fill={C.cream} {...ink()} />
      <text x={c.x} y={c.y0 + 46} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={52} fill={C.ink}>
        {lines[0]}
      </text>
      <text x={c.x} y={c.y0 + 108} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={47} fill={C.ink}>
        {lines[1]}
      </text>
      <text x={c.x} y={c.y0 + 164} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={47} fill={C.ink}>
        {lines[2]}
      </text>
      <text x={c.x} y={c.y0 + 228} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={700} fontSize={41} fill={C.inkSoft}>
        {lines[3]}
      </text>
    </g>
  );
};
