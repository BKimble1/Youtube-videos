import React, {useId} from 'react';
import {C, OUTLINE} from '../../theme';
import {CAST} from '../cast';
import type {Look} from '../Character';

/**
 * Overhead (top-down) tokens for the plan view: the guesser and the checker seen from directly above, drawn so they
 * read as the same people as the frontal rigs (colours come straight from components/cast.ts).
 *
 *  - <GuesserToken/>: red spiky crown (a jagged crown with the spike tips seen end-on), a sliver of forehead and the
 *    nose at the front, white shirt with saffron stripes across the shoulders, white sleeves.
 *  - <CheckerToken/>: grey bob (wider than the head, covering the ears), round-glasses rims peeking past the forehead,
 *    the saffron pencil tucked behind the right ear, coral cardigan shoulders and sleeves.
 *
 * Geometry: centred on (x, y) in the parent's px; `size` is the full width across the shoulders and sleeves in px (a
 * person is about 0.5 m wide in plan, so size = 0.5 × pixels-per-metre = tokenSize(ppm); with lib/room's tokenAt use
 * size = 2 × r). `facing` rotates the token (deg, clockwise from screen-up: 0 = facing the top of the screen, i.e. the
 * relay wall in the plan view). The soft floor shadow always falls down-right. Outline weight is 4 px from size ≈ 125
 * and thins a little on smaller tokens.
 */
export type TokenProps = {
  x: number;
  y: number;
  /** Width across shoulders and sleeves, px (≈ 0.5 m in plan). */
  size?: number;
  /** Facing, deg clockwise from screen-up. */
  facing?: number;
  opacity?: number;
  /** Extra uniform scale (e.g. tokenAt().scale during the tilt). */
  scale?: number;
  shadow?: boolean;
  /** Return a bare <g> for a parent <svg> instead of an overlay <svg>. */
  asGroup?: boolean;
  /** A point in the parent's px that one hand reaches (e.g. the SensorTop the operator holds). The arm runs from the
   *  nearer shoulder, under the shoulders, and is capped at about 0.36 m (0.72 × size); draw the held thing after the
   *  token so it sits over the hand. */
  reach?: {x: number; y: number};
  /** Which shoulder reaches: -1 = the token's left (screen-left at facing 0), +1 = right. Default: the nearer one. */
  reachSide?: -1 | 1;
};

const f2 = (n: number) => Math.round(n * 100) / 100;
/** Point at radius r and angle deg (clockwise from the facing direction, i.e. from -y). */
const pol = (r: number, deg: number) => ({x: r * Math.sin((deg * Math.PI) / 180), y: -r * Math.cos((deg * Math.PI) / 180)});

// proportions (fractions of size)
const HEAD_R = 0.245;
const SH_RX = 0.42;
const SH_RY = 0.215;
const SH_Y = 0.05;
const SLEEVE_X = 0.395;
const SLEEVE_R = 0.1;

const Wrap: React.FC<{p: TokenProps; children: React.ReactNode}> = ({p, children}) => {
  const g = (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(p.facing ?? 0)}) scale(${f2(p.scale ?? 1)})`} opacity={p.opacity ?? 1}>
      {children}
    </g>
  );
  return p.asGroup ? (
    g
  ) : (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {g}
    </svg>
  );
};

const strokeFor = (S: number) => Math.max(2, Math.min(OUTLINE, S * 0.032));

/** The reaching arm in token-local px (facing up), or null. */
const reachArm = (p: TokenProps, S: number) => {
  if (!p.reach) return null;
  const k = p.scale ?? 1;
  const a = ((p.facing ?? 0) * Math.PI) / 180;
  const dx = (p.reach.x - p.x) / k;
  const dy = (p.reach.y - p.y) / k;
  // parent → token frame (undo rotate(facing))
  const t = {x: dx * Math.cos(a) + dy * Math.sin(a), y: -dx * Math.sin(a) + dy * Math.cos(a)};
  const side = p.reachSide ?? (t.x >= 0 ? 1 : -1);
  const sh = {x: side * S * SLEEVE_X, y: S * (SH_Y + 0.015)};
  const len = Math.hypot(t.x - sh.x, t.y - sh.y) || 1;
  const max = S * 0.72;
  const u = Math.min(1, max / len);
  return {sh, hand: {x: sh.x + (t.x - sh.x) * u, y: sh.y + (t.y - sh.y) * u}};
};

/** Shared body seen from above: shadow, (reaching arm), sleeves, shoulders (with optional stripes), head, ears, nose. */
const Body: React.FC<{S: number; look: Look; sw: number; shadow: boolean; facingDeg: number; arm: ReturnType<typeof reachArm>}> = ({S, look, sw, shadow, facingDeg, arm}) => {
  const clipId = 'tk' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const sleeve = look.overlay ? look.overlayColor ?? look.shirt : look.shirt;
  const shoulders = look.overlay ? look.overlayColor ?? look.shirt : look.shirt;
  const ink = {stroke: C.ink, strokeWidth: sw, strokeLinejoin: 'round' as const};
  // the shadow falls toward screen down-right whatever the facing: counter-rotate its offset
  const off = pol(S * 0.07, 135 - facingDeg);
  const shY = SH_Y * S;
  const armW = S * SLEEVE_R * 1.5;
  const elbow = arm ? {x: arm.sh.x + (arm.hand.x - arm.sh.x) * 0.5, y: arm.sh.y + (arm.hand.y - arm.sh.y) * 0.5} : null;
  return (
    <g>
      {shadow && (
        <g transform={`translate(${f2(off.x)} ${f2(off.y)})`} fill={C.shadow}>
          <ellipse cx={0} cy={shY} rx={S * 0.5} ry={S * 0.23} />
          <circle cx={0} cy={0} r={S * (HEAD_R + 0.04)} />
          {arm && <line x1={f2(arm.sh.x)} y1={f2(arm.sh.y)} x2={f2(arm.hand.x)} y2={f2(arm.hand.y)} stroke={C.shadow} strokeWidth={f2(armW)} strokeLinecap="round" />}
        </g>
      )}
      {/* reaching arm: sleeve to the elbow, then the forearm and a round hand (under the shoulders) */}
      {arm && elbow && (
        <g>
          <line x1={f2(arm.sh.x)} y1={f2(arm.sh.y)} x2={f2(arm.hand.x)} y2={f2(arm.hand.y)} stroke={C.ink} strokeWidth={f2(armW + sw * 2)} strokeLinecap="round" />
          <line x1={f2(elbow.x)} y1={f2(elbow.y)} x2={f2(arm.hand.x)} y2={f2(arm.hand.y)} stroke={look.skin} strokeWidth={f2(armW)} strokeLinecap="round" />
          <line x1={f2(arm.sh.x)} y1={f2(arm.sh.y)} x2={f2(elbow.x)} y2={f2(elbow.y)} stroke={sleeve} strokeWidth={f2(armW)} strokeLinecap="round" />
          <circle cx={f2(arm.hand.x)} cy={f2(arm.hand.y)} r={f2(S * 0.075)} fill={look.skin} {...ink} />
        </g>
      )}
      {/* sleeves: the upper arms hang beside the shoulders */}
      <circle cx={-S * SLEEVE_X} cy={shY + S * 0.015} r={S * SLEEVE_R} fill={sleeve} {...ink} />
      <circle cx={S * SLEEVE_X} cy={shY + S * 0.015} r={S * SLEEVE_R} fill={sleeve} {...ink} />
      {/* shoulders */}
      <ellipse cx={0} cy={shY} rx={S * SH_RX} ry={S * SH_RY} fill={shoulders} {...ink} />
      {look.stripes && (
        <g>
          <defs>
            <clipPath id={clipId}>
              <ellipse cx={0} cy={shY} rx={S * SH_RX} ry={S * SH_RY} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`} fill={look.stripes}>
            {[-0.115, -0.005, 0.105].map((dy) => (
              <rect key={dy} x={-S * 0.5} y={shY + S * dy - S * 0.03} width={S} height={S * 0.06} />
            ))}
          </g>
          <ellipse cx={0} cy={shY} rx={S * SH_RX} ry={S * SH_RY} fill="none" {...ink} />
        </g>
      )}
      {/* nose and ears first: the head's outline cuts across their roots */}
      <ellipse cx={0} cy={-S * (HEAD_R + 0.015)} rx={S * 0.045} ry={S * 0.055} fill={look.skin} {...ink} />
      <ellipse cx={-S * HEAD_R} cy={S * 0.01} rx={S * 0.04} ry={S * 0.065} fill={look.skin} {...ink} />
      <ellipse cx={S * HEAD_R} cy={S * 0.01} rx={S * 0.04} ry={S * 0.065} fill={look.skin} {...ink} />
      <circle cx={0} cy={0} r={S * HEAD_R} fill={look.skin} {...ink} />
    </g>
  );
};

/** Spiky crown seen from above: a jagged crown round the back and sides, hairline across the front of the head. */
const spikyCrown = (S: number) => {
  const pts: string[] = [];
  const a0 = 50;
  const a1 = 310;
  const n = 10;
  for (let i = 0; i <= n * 2; i++) {
    const a = a0 + ((a1 - a0) * i) / (n * 2);
    const r = i % 2 === 1 ? S * 0.305 : S * 0.25;
    const p = pol(r, a);
    pts.push(`${f2(p.x)} ${f2(p.y + S * 0.01)}`);
  }
  const a = pol(S * 0.25, a0);
  // hairline: from the right temple across the front of the crown to the left temple (a sliver of forehead stays)
  return `M ${pts.join(' L ')} Q ${f2(-a.x * 0.45)} ${f2(-S * 0.215)} 0 ${f2(-S * 0.175)} Q ${f2(a.x * 0.45)} ${f2(-S * 0.215)} ${f2(a.x)} ${f2(a.y + S * 0.01)} Z`;
};

/** Parting lines of the spikes: short curved strokes from the crown whorl out toward the notches between spikes
 *  (every other notch of spikyCrown), stopping short of the outline. Reads as hair sections, not a star. */
const spikeParts = (S: number) => {
  const whorl = {x: 0, y: S * 0.04};
  return [76, 128, 180, 232, 284].map((deg) => {
    const end = pol(S * 0.2, deg);
    const c = pol(S * 0.11, deg - 24);
    const st = {x: whorl.x + (end.x - whorl.x) * 0.18, y: whorl.y + (end.y + S * 0.01 - whorl.y) * 0.18};
    return `M ${f2(st.x)} ${f2(st.y)} Q ${f2(c.x)} ${f2(c.y + S * 0.03)} ${f2(end.x)} ${f2(end.y + S * 0.01)}`;
  });
};

/** The guesser from above (red spiky hair, white/saffron striped shirt). */
export const GuesserToken: React.FC<TokenProps & {look?: Look}> = (p) => {
  const S = p.size ?? 130;
  const look = p.look ?? CAST.guesser;
  const sw = strokeFor(S);
  return (
    <Wrap p={p}>
      <Body S={S} look={look} sw={sw} shadow={p.shadow ?? true} facingDeg={p.facing ?? 0} arm={reachArm(p, S)} />
      <path d={spikyCrown(S)} fill={look.hairColor} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      {/* parting lines between the spikes, curling out from the crown whorl */}
      <g fill="none" stroke={C.ink} strokeWidth={f2(sw * 0.75)} strokeLinecap="round">
        {spikeParts(S).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </Wrap>
  );
};

/** The checker from above (grey bob, round-glasses rims as two arcs ahead of the face, pencil behind the right ear,
 *  coral cardigan). */
export const CheckerToken: React.FC<TokenProps & {look?: Look}> = (p) => {
  const S = p.size ?? 130;
  const look = p.look ?? CAST.checker;
  const sw = strokeFor(S);
  const cy = 0.02 * S;
  const rx = S * 0.29;
  const ry = S * 0.28;
  const a = (52 * Math.PI) / 180;
  const sx = rx * Math.sin(a);
  const sy = -ry * Math.cos(a) + cy;
  // bob: wider than the head (covers the ears), open at the front where the hairline crosses the forehead
  const bob = `M ${f2(-sx)} ${f2(sy)} A ${f2(rx)} ${f2(ry)} 0 1 0 ${f2(sx)} ${f2(sy)} Q ${f2(sx * 0.45)} ${f2(-S * 0.215)} 0 ${f2(-S * 0.18)} Q ${f2(-sx * 0.45)} ${f2(-S * 0.215)} ${f2(-sx)} ${f2(sy)} Z`;
  return (
    <Wrap p={p}>
      <Body S={S} look={look} sw={sw} shadow={p.shadow ?? true} facingDeg={p.facing ?? 0} arm={reachArm(p, S)} />
      {/* glasses: the two round rims seen from above are two short arcs just ahead of the forehead, joined by the bridge */}
      <path
        d={`M ${f2(-S * 0.155)} ${f2(-S * 0.235)} Q ${f2(-S * 0.09)} ${f2(-S * 0.29)} ${f2(-S * 0.025)} ${f2(-S * 0.262)} L ${f2(S * 0.025)} ${f2(-S * 0.262)} Q ${f2(S * 0.09)} ${f2(-S * 0.29)} ${f2(S * 0.155)} ${f2(-S * 0.235)}`}
        fill="none"
        stroke={C.ink}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={bob} fill={look.hairColor} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      {/* soft parting */}
      <path d={`M 0 ${f2(-S * 0.18)} Q ${f2(S * 0.012)} ${f2(-S * 0.07)} 0 ${f2(S * 0.04)}`} fill="none" stroke={C.ink} strokeWidth={sw * 0.7} strokeLinecap="round" opacity={0.3} />
      {/* pencil behind the right ear */}
      <g transform={`translate(${f2(S * 0.29)} ${f2(-S * 0.02)}) rotate(12)`}>
        <rect x={-S * 0.024} y={-S * 0.11} width={S * 0.048} height={S * 0.21} rx={S * 0.01} fill={C.saffron} stroke={C.ink} strokeWidth={sw * 0.8} />
        <path d={`M ${f2(-S * 0.024)} ${f2(-S * 0.11)} L 0 ${f2(-S * 0.155)} L ${f2(S * 0.024)} ${f2(-S * 0.11)} Z`} fill={look.skin} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
      </g>
    </Wrap>
  );
};

/** Token size (px) for a plan scale in pixels per metre (a person ≈ 0.5 m across the shoulders and arms). */
export const tokenSize = (ppm: number, widthM = 0.5) => widthM * ppm;
