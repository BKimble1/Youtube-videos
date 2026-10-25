// The climbing pad, its grip bar, the foot strap and the stirrup, in the bay's oblique projection (world/geo.ts).
// Construction follows the Stanford hand pad (Hawkes et al. 2015): a rigid plate carrying 24 adhesive tiles on the
// glass side, each tile pulled by its own tendon and spring inside the plate (the back face shows the 24 anchor caps),
// a handle standing off the back, and a strap from the bottom edge to a foot stirrup. Drawn in the Crew finish: one
// ink contour per object, gradients from the fixed upper-left key light.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../dc/ink';
import {add, fmt, len, lerpV, mul, norm, P, perp, sub, V} from '../dc/math';
import {Capsule, Lin} from '../dc/shade';
import {CM, P3, PAD, padPt, PadState, prPad} from '../world/geo';

export const PLATE = '#4F5D68';
export const PLATE_EDGE = '#3A4650';
export const TILE = '#CFE3E6';
export const BAR = '#2C3338';
export const WEB = '#D8663B';
export const WEB_DEEP = '#A9472A';
export const POST = '#AEBBC5';

const poly = (pts: V[]) => `M${pts.map((p) => P(p)).join(' L')} Z`;
const U0 = PAD.tile; // plate's glass-side face
const U1 = PAD.tile + PAD.t; // plate's back face

/** the plate, tile layer and posts (not the bar, which is drawn in the hand when held) */
export const PadBody: React.FC<{id: string; s: PadState; k: number; bar?: boolean; contact?: number}> = ({id, s, k, bar = true, contact = 1}) => {
  const hw = PAD.w / 2, hh = PAD.h / 2;
  const q = (u: number, v: number, dz: number) => prPad(padPt(s, u, v, dz));
  const back = [q(U1, -hh, -hw), q(U1, -hh, hw), q(U1, hh, hw), q(U1, hh, -hw)];
  const side = [q(U0, -hh, hw), q(U1, -hh, hw), q(U1, hh, hw), q(U0, hh, hw)];
  const tileSide = [q(0, -hh + 0.4 * CM, hw - 0.4 * CM), q(U0, -hh + 0.2 * CM, hw - 0.2 * CM), q(U0, hh - 0.2 * CM, hw - 0.2 * CM), q(0, hh - 0.4 * CM, hw - 0.4 * CM)];
  const top = [q(U0, -hh, -hw), q(U1, -hh, -hw), q(U1, -hh, hw), q(U0, -hh, hw)];
  const ink = 3.2 * k;
  // the 24 anchor caps on the back (one per tile's tendon and spring)
  const caps: V[] = [];
  for (let r = 0; r < PAD.rows; r++) for (let c = 0; c < PAD.cols; c++) caps.push(q(U1, -hh + (r + 0.5) * (PAD.h / PAD.rows), -hw + (c + 0.5) * (PAD.w / PAD.cols)));
  const posts = [-PAD.postY, PAD.postY].map((v) => ({a: q(U1, v, 0), b: q(U1 + PAD.post, v, 0)}));
  const c0 = back[0], c2 = back[2];
  return (
    <g>
      {/* the tile layer: soft translucent silicone, its sawtooth face on the glass */}
      <Inked w={ink}>
        <Lin id={`${id}-ts`} d={poly(tileSide)} from={tileSide[0]} to={tileSide[3]} stops={[[0, lit(TILE, 0.3)], [1, shade(TILE, 0.18)]]} />
      </Inked>
      <Inked w={ink}>
        <Lin id={`${id}-sd`} d={poly(side)} from={side[0]} to={side[3]} stops={[[0, mix(PLATE_EDGE, '#8FA0AC', 0.35)], [1, shade(PLATE_EDGE, 0.2)]]} />
        <Lin id={`${id}-tp`} d={poly(top)} from={top[0]} to={top[2]} stops={[[0, mix(PLATE, '#C9D3DA', 0.55)], [1, mix(PLATE, '#C9D3DA', 0.3)]]} />
        <Lin id={`${id}-bk`} d={poly(back)} from={c0} to={c2} stops={[[0, mix(PLATE, '#9AA9B4', 0.35)], [0.55, PLATE], [1, shade(PLATE, 0.22)]]} />
      </Inked>
      <Deco>
        {/* orange edge stripe and the anchor caps */}
        <path d={poly([q(U1, -hh + 0.6 * CM, hw - 0.9 * CM), q(U1, -hh + 0.6 * CM, hw - 0.3 * CM), q(U1, hh - 0.6 * CM, hw - 0.3 * CM), q(U1, hh - 0.6 * CM, hw - 0.9 * CM)])} fill={WEB} opacity={0.85} />
        {caps.map((c, i) => (
          <g key={i}>
            <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(0.75 * CM * 0.5)} ry={fmt(0.75 * CM)} fill={shade(PLATE, 0.35)} />
            <ellipse cx={fmt(c.x - 0.12 * CM)} cy={fmt(c.y - 0.2 * CM)} rx={fmt(0.3 * CM * 0.5)} ry={fmt(0.3 * CM)} fill="#C9D3DA" opacity={0.7} />
          </g>
        ))}
        {/* contact: a dark line where the tile layer meets the glass (fades as the pad comes away) */}
        <path d={`M${P(q(0, -hh + 0.4 * CM, hw - 0.4 * CM))} L${P(q(0, hh - 0.4 * CM, hw - 0.4 * CM))}`} stroke={INK} strokeOpacity={0.55 * contact} strokeWidth={fmt(2.2 * k)} />
      </Deco>
      {/* posts */}
      <Inked w={ink}>
        {posts.map((p, i) => (
          <Capsule key={i} id={`${id}-po${i}`} a={p.a} b={p.b} ra={0.75 * CM} rb={0.75 * CM} color={POST} spec={0.3} />
        ))}
      </Inked>
      {bar && <PadBar id={`${id}-br`} s={s} k={k} />}
    </g>
  );
};

/** the grip bar between the posts (drawn on its own when it passes through a hand) */
export const PadBar: React.FC<{id: string; s: PadState; k: number}> = ({id, s, k}) => {
  const a = prPad(padPt(s, U1 + PAD.post, -PAD.postY - 0.6 * CM));
  const b = prPad(padPt(s, U1 + PAD.post, PAD.postY + 0.6 * CM));
  return (
    <Inked w={3.2 * k}>
      <Capsule id={id} a={a} b={b} ra={PAD.barR} rb={PAD.barR} color={BAR} spec={0.35} />
      <Deco>
        {[-0.5, -0.25, 0, 0.25, 0.5].map((t, i) => {
          const c = lerpV(a, b, 0.5 + t * 0.8);
          const n = perp(norm(sub(b, a)));
          return <path key={i} d={`M${P(add(c, mul(n, PAD.barR * 0.85)))} L${P(add(c, mul(n, -PAD.barR * 0.85)))}`} stroke="#4A555D" strokeWidth={fmt(1.6 * k)} opacity={0.8} />;
        })}
      </Deco>
    </Inked>
  );
};

/** webbing strap from a to b: straight when taut, sagging (quadratic) by `sag` world units when slack */
export const strapPath = (a: V, b: V, sag: number) => {
  const m = lerpV(a, b, 0.5);
  const c = add(m, {x: sag * 0.35, y: sag});
  return {d: `M${P(a)} Q${P(c)} ${P(b)}`, c};
};
export const Strap: React.FC<{id: string; a: V; b: V; sag: number; k: number; far?: boolean}> = ({id, a, b, sag, k, far}) => {
  const {d} = strapPath(a, b, sag);
  const col = far ? shade(WEB, 0.18) : WEB;
  const w = 2.4 * CM;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 2.6 * k)} strokeLinecap="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={fmt(w)} strokeLinecap="butt" />
      <path d={d} fill="none" stroke={lit(col, 0.35)} strokeWidth={fmt(w * 0.22)} transform={`translate(${fmt(-w * 0.22)} 0)`} opacity={0.7} />
    </g>
  );
};
/** the D-ring at the plate's bottom edge */
export const Ring: React.FC<{c: V; k: number}> = ({c, k}) => (
  <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(1.0 * CM)} ry={fmt(1.4 * CM)} fill="none" stroke={INK} strokeWidth={fmt(1.0 * CM + 2.4 * k)} opacity={1} />
);

/** stirrup: the strap ends in a webbing loop round the foot, with a stiff bar under the arch.
 *  `top` is the strap's lower end; `bar` the bar's centre; `dir` the shoe's toe direction. `part`: 'back' (the far side
 *  of the loop, behind the shoe) or 'front' (the near side over the instep, and the bar). */
export const Stirrup: React.FC<{id: string; top: V; bar: V; dir: V; k: number; part: 'back' | 'front'; far?: boolean}> = ({id, top, bar, dir, k, part, far}) => {
  const col = far ? shade(WEB, 0.18) : WEB;
  const w = 2.2 * CM;
  const hb = 4.2 * CM;
  const b0 = add(bar, mul(dir, -hb)), b1 = add(bar, mul(dir, hb));
  const leg = (to: V) => `M${P(top)} L${P(to)}`;
  if (part === 'back') {
    return (
      <g>
        <path d={leg(b1)} fill="none" stroke={INK} strokeWidth={fmt(w + 2.4 * k)} strokeLinecap="round" />
        <path d={leg(b1)} fill="none" stroke={shade(col, 0.25)} strokeWidth={fmt(w)} />
      </g>
    );
  }
  return (
    <g>
      <path d={leg(b0)} fill="none" stroke={INK} strokeWidth={fmt(w + 2.4 * k)} strokeLinecap="round" />
      <path d={leg(b0)} fill="none" stroke={col} strokeWidth={fmt(w)} />
      <Inked w={3 * k}>
        <Capsule id={`${id}-bar`} a={b0} b={b1} ra={1.1 * CM} rb={1.1 * CM} color="#3A4248" spec={0.3} />
      </Inked>
    </g>
  );
};

export {InkPath, InkLine, len};
