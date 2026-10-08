import React, {useId} from 'react';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {CAST} from '../cast';
import {Character2, EXPR, IDLE2, withPose, type Character2Props, type Pose2} from './Cast2';

/**
 * S2 only: the postcard of the guesser (S2.1 "the picture stays whole", S2.4 "a postcard shredded into confetti") and
 * the confetti it shreds into. Everything is SVG in card-local or screen px and a pure function of its props.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A Character2 placed inside a parent <svg>: ground point at (gx, gy). (Character2's root is an <svg> sized
 *  400s x 520s whose ground point is (200s, 500s); inside SVG its CSS left/top do not apply, so we translate.) */
export const RigG: React.FC<Omit<Character2Props, 'x' | 'y'> & {gx: number; gy: number}> = ({gx, gy, scale = 1, ...rest}) => (
  <g transform={`translate(${f2(gx - 200 * scale)} ${f2(gy - 500 * scale)})`}>
    <Character2 {...rest} scale={scale} x={0} y={0} />
  </g>
);

/* ------------------------------------------------------------------ the postcard */

/** Card-local geometry (px at scale 1). The picture window is on the left, the stamp and address lines on the right. */
export const CARD = {w: 640, h: 420, r: 18, win: {x: 26, y: 26, w: 350, h: 368, r: 12}};
/** The portrait: the guesser's ground point and scale inside the card (head and shoulders fill the window). */
const PORTRAIT = {gx: 201, gy: 560, scale: 1.02};
/** The portrait's left eye (card-local), used to pick the confetti piece that still shows an eye. */
export const CARD_EYE = {x: PORTRAIT.gx - 22 * PORTRAIT.scale, y: PORTRAIT.gy - 378 * PORTRAIT.scale};

/** The photo pose: a posed, grinning guesser looking into the lens (a still photo: no idle life). */
export const PHOTO_POSE: Pose2 = withPose(IDLE2, {...EXPR.smug, mouth: 'grin', lid: 0.15, lookX: 0, lookY: 0.05, tilt: 4, browAsym: 0.3});

/** The postcard in card-local px (0..CARD.w, 0..CARD.h). `postmark` 0..1 stamps a postmark over the stamp. */
export const PostcardBody: React.FC<{postmark?: number}> = ({postmark = 0}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const {w, h, r, win} = CARD;
  const pm = clamp01(postmark);
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <defs>
        <clipPath id={`win${uid}`}>
          <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={win.r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#win${uid})`}>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={C.blueLight} />
        {/* a low sun and a floor line: a holiday snapshot, flat fills only */}
        <circle cx={win.x + win.w - 66} cy={win.y + 70} r={38} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={3} />
        <RigG look={CAST.guesser} pose={PHOTO_POSE} frame={0} seed={22} life={0} eyeDarts={false} shadow={false} gx={PORTRAIT.gx} gy={PORTRAIT.gy} scale={PORTRAIT.scale} />
      </g>
      <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={win.r} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
      {/* divider, address lines */}
      <line x1={404} y1={44} x2={404} y2={h - 44} stroke={C.paperLine} strokeWidth={4} strokeLinecap="round" />
      {[236, 286, 336].map((y) => (
        <line key={y} x1={430} y1={y} x2={w - 36} y2={y} stroke={C.inkMuted} strokeWidth={5} strokeLinecap="round" />
      ))}
      {/* stamp: saffron with a cream inner frame and a tiny coral sun */}
      <rect x={w - 132} y={34} width={96} height={116} rx={6} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={w - 120} y={46} width={72} height={92} rx={4} fill="none" stroke={C.cream} strokeWidth={4} />
      <circle cx={w - 84} cy={92} r={17} fill={C.coral} stroke={C.ink} strokeWidth={3} />
      {pm > 0 && (
        <g opacity={pm} transform={`translate(${w - 140} 120) rotate(-14) scale(${f2(lerp(1.25, 1, pm))})`}>
          <circle cx={0} cy={0} r={40} fill="none" stroke={C.inkSoft} strokeWidth={4} />
          <circle cx={0} cy={0} r={27} fill="none" stroke={C.inkSoft} strokeWidth={3} />
          <path d="M 44 -8 Q 64 -18 84 -8 Q 104 2 124 -8" fill="none" stroke={C.inkSoft} strokeWidth={4} strokeLinecap="round" />
          <path d="M 44 10 Q 64 0 84 10 Q 104 20 124 10" fill="none" stroke={C.inkSoft} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ confetti */

/** Grid of the shred: COLS x ROWS pieces whose shared corner points are jittered (so the pieces tile exactly). */
const COLS = 8;
const ROWS = 5;
const corners: {x: number; y: number}[][] = Array.from({length: ROWS + 1}, (_, r) =>
  Array.from({length: COLS + 1}, (_, c) => {
    const edgeX = c === 0 || c === COLS;
    const edgeY = r === 0 || r === ROWS;
    const jx = edgeX ? 0 : (rand(r * 31 + c * 7 + 5) - 0.5) * 22;
    const jy = edgeY ? 0 : (rand(r * 17 + c * 29 + 11) - 0.5) * 22;
    return {x: (CARD.w * c) / COLS + jx, y: (CARD.h * r) / ROWS + jy};
  }),
);

export type Piece = {i: number; poly: {x: number; y: number}[]; cx: number; cy: number};
export const PIECES: Piece[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    // a slightly torn edge: each side gets one extra midpoint, shared with the neighbour (seeded by the side)
    const a = corners[r][c];
    const b = corners[r][c + 1];
    const d = corners[r + 1][c];
    const e = corners[r + 1][c + 1];
    const mid = (p: {x: number; y: number}, q: {x: number; y: number}, seed: number, border: boolean) => ({
      x: (p.x + q.x) / 2 + (border ? 0 : (rand(seed) - 0.5) * 12),
      y: (p.y + q.y) / 2 + (border ? 0 : (rand(seed + 1) - 0.5) * 12),
    });
    const top = mid(a, b, 1000 + r * 50 + c, r === 0);
    const bottom = mid(d, e, 1000 + (r + 1) * 50 + c, r + 1 === ROWS);
    const left = mid(a, d, 5000 + r * 50 + c, c === 0);
    const right = mid(b, e, 5000 + r * 50 + c + 1, c + 1 === COLS);
    const poly = [a, top, b, right, e, bottom, d, left];
    const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    PIECES.push({i: PIECES.length, poly, cx, cy});
  }
}
const inPoly = (poly: {x: number; y: number}[], q: {x: number; y: number}) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
/** The piece that carries the portrait's eye ("confetti still holds bits of picture"). */
export const EYE_PIECE = PIECES.find((p) => inPoly(p.poly, CARD_EYE))?.i ?? 9;

const polyD = (pts: {x: number; y: number}[]) => `M ${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(' L ')} Z`;

/** Where the card sits before it shreds (screen px): centre, scale, rotation (deg). */
export type CardPlace = {x: number; y: number; scale: number; rot: number};

export type PieceState = {x: number; y: number; rot: number; tumble: number; landed: number};

/**
 * Flight of one piece, `t` frames after the shred (pure, deterministic): a small burst away from the card centre, then
 * gravity with air drag, a sideways flutter and a tumble that decays, until it lands on its spot in the pile at
 * `floorY` (screen px) and settles face up.
 */
export const pieceState = (p: Piece, t: number, place: CardPlace, floorY: number): PieceState => {
  const rr = (place.rot * Math.PI) / 180;
  const lx = (p.cx - CARD.w / 2) * place.scale;
  const ly = (p.cy - CARD.h / 2) * place.scale;
  let x = place.x + lx * Math.cos(rr) - ly * Math.sin(rr);
  let y = place.y + lx * Math.sin(rr) + ly * Math.cos(rr);
  if (t <= 0) return {x, y, rot: place.rot, tumble: 1, landed: 0};
  const s = p.i * 37 + 3;
  const dirx = lx / (CARD.w * 0.5 * place.scale);
  const diry = ly / (CARD.h * 0.5 * place.scale);
  let vx = dirx * (3.2 + 3.5 * rand(s)) + (rand(s + 1) - 0.5) * 3;
  let vy = diry * 2.2 - (3 + 3.5 * rand(s + 2));
  const spin = (rand(s + 3) - 0.5) * 16;
  const land = floorY + (rand(s + 4) - 0.5) * 70 + diry * 14;
  const phase = rand(s + 5) * Math.PI * 2;
  const om = 0.22 + 0.12 * rand(s + 6);
  let rot = place.rot;
  let tl = -1;
  let rotL = rot;
  let tumL = 1;
  const steps = Math.min(400, Math.floor(t));
  const frac = t - steps;
  const tumbleAt = (k: number) => 1 - 0.95 * Math.exp(-k / 18) * (1 - Math.cos(k * om + phase)) * (k < 3 ? k / 3 : 1);
  for (let k = 0; k < steps + 1; k++) {
    const dt = k < steps ? 1 : frac;
    if (dt <= 0) break;
    vx *= Math.pow(0.93, dt);
    vy = Math.min(vy + 1.05 * dt, 13 + 3 * rand(s + 7));
    const sway = 2.4 * Math.sin((k + dt) * 0.3 + phase) * dt;
    x += vx * dt + sway;
    y += vy * dt;
    rot += spin * Math.exp(-k / 30) * dt;
    if (y >= land) {
      y = land;
      tl = k + dt;
      rotL = rot;
      tumL = tumbleAt(k + dt);
      break;
    }
  }
  if (tl < 0) return {x, y, rot, tumble: tumbleAt(t), landed: 0};
  const after = t - tl;
  const k = clamp01(after / 7);
  // landed: settle flat and face up (a tiny bounce in the first frames)
  const bounce = after < 6 ? -4 * Math.sin((after / 6) * Math.PI) : 0;
  return {x, y: y + bounce, rot: rotL, tumble: lerp(tumL, 1, 1 - (1 - k) * (1 - k)), landed: k};
};

/** Frame (after the shred) by which every piece has landed and settled, for the cue sheet. */
export const lastLanding = (place: CardPlace, floorY: number) => {
  let t = 0;
  for (const p of PIECES) {
    for (let k = 0; k < 200; k++) {
      if (pieceState(p, k, place, floorY).landed >= 1) {
        t = Math.max(t, k);
        break;
      }
    }
  }
  return t;
};

/**
 * The shredding postcard. `cut` 0..1 draws the cut lines on the whole card; `t` is frames since the burst (<= 0: the
 * card is whole). `only` draws a single piece (for the "bits of picture" highlight).
 */
export const ShredCard: React.FC<{
  place: CardPlace;
  t: number;
  cut?: number;
  floorY: number;
  postmark?: number;
  /** 0..1: lift one piece out of the pile toward `to` (screen px), enlarged `extra` times, with a saffron ring */
  lift?: {i: number; k: number; to: {x: number; y: number}; extra: number};
}> = ({place, t, cut = 0, floorY, postmark = 1, lift}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const cardId = `card${uid}`;
  const hide = lift && lift.k > 0 ? [lift.i] : [];
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <g id={cardId}>
          <PostcardBody postmark={postmark} />
        </g>
        {PIECES.map((p) => (
          <clipPath key={p.i} id={`pc${uid}-${p.i}`}>
            <path d={polyD(p.poly)} />
          </clipPath>
        ))}
      </defs>
      {t <= 0 ? (
        <g transform={`translate(${f2(place.x)} ${f2(place.y)}) rotate(${f2(place.rot)}) scale(${f2(place.scale)}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
          <rect x={10} y={14} width={CARD.w} height={CARD.h} rx={CARD.r} fill={C.shadow} />
          <use href={`#${cardId}`} />
          {cut > 0 && (
            <g opacity={clamp01(cut)}>
              {PIECES.map((p) => (
                <path key={p.i} d={polyD(p.poly)} fill="none" stroke={C.ink} strokeWidth={2.5} strokeDasharray="7 7" />
              ))}
            </g>
          )}
        </g>
      ) : (
        PIECES.filter((p) => !hide.includes(p.i)).map((p) => {
          const s = pieceState(p, t, place, floorY);
          return <PieceG key={p.i} p={p} s={s} scale={place.scale} cardId={cardId} clipId={`pc${uid}-${p.i}`} />;
        })
      )}
      {lift && lift.k > 0 && (() => {
        const p = PIECES[lift.i];
        const s0 = pieceState(p, t, place, floorY);
        const k = clamp01(lift.k);
        const s = {x: lerp(s0.x, lift.to.x, k), y: lerp(s0.y, lift.to.y, k), rot: lerp(s0.rot, -4, k), tumble: 1};
        const ex = lerp(1, lift.extra, k);
        const rr = Math.max(...p.poly.map((q) => Math.hypot(q.x - p.cx, q.y - p.cy))) * place.scale * ex + 14;
        return (
          <g>
            <circle cx={f2(s.x + 6)} cy={f2(s.y + 8)} r={f2(rr)} fill={C.shadow} opacity={k} />
            <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(rr)} fill={C.cream} stroke={C.saffronDeep} strokeWidth={6} opacity={k} />
            <PieceG p={p} s={s} scale={place.scale} cardId={cardId} clipId={`pc${uid}-${p.i}`} extra={ex} />
          </g>
        );
      })()}
    </svg>
  );
};

/** One confetti piece at a state (screen px). Shows the picture side when the tumble is positive, the plain back
 *  otherwise. */
export const PieceG: React.FC<{p: Piece; s: {x: number; y: number; rot: number; tumble: number}; scale: number; cardId: string; clipId: string; extra?: number}> = ({p, s, scale, cardId, clipId, extra = 1}) => {
  const sy = Math.abs(s.tumble) < 0.04 ? 0.04 * Math.sign(s.tumble || 1) : s.tumble;
  return (
    <g transform={`translate(${f2(s.x)} ${f2(s.y)}) rotate(${f2(s.rot)}) scale(${f2(scale * extra)} ${f2(scale * extra * sy)}) translate(${f2(-p.cx)} ${f2(-p.cy)})`}>
      {sy > 0 ? <use href={`#${cardId}`} clipPath={`url(#${clipId})`} /> : <path d={polyD(p.poly)} fill={C.paperDeep} />}
      <path d={polyD(p.poly)} fill="none" stroke={C.ink} strokeWidth={3 / Math.max(0.2, scale * extra)} strokeLinejoin="round" />
    </g>
  );
};
