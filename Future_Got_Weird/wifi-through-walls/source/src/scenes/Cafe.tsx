// The café shots. E: a separate experiment, illustrated on an ordinary street: the café's Wi-Fi router talks to a
// customer's laptop; as he walks between them his body disturbs the link; the monitoring laptop in the window records
// the pattern and matches it to an earlier recording. F: no phone (empty hands, pockets turned out). H: the
// hypothetical: walking past the café, he is recognised from a pattern recorded on an earlier visit, and notices.
import React from 'react';
import {add3, B, basis, Cam, camKeys, depth, proj, scaleAt, v3, V3} from '../world/cam';
import {Line3, Poly, rz} from '../world/draw';
import {cardAt, cardPt, FloorShadow, Person, pose, U} from '../art/person';
import {walk, walkX, Gait} from '../art/walk';
import {manJoints, Outfit} from '../dc/Man';
import {EXPR_NEUTRAL, EXPR_UNEASY, Expr, mixExpr} from '../dc/Head';
import {HAND_RELAXED, HandPose} from '../dc/Hand';
import {PAL} from '../dc/color';
import {BladeSign, CafeBack, CafeFore, CafeGround, CC, FACADE, LAPTOP, MONI, PATH_Z, ROUTER, Table, TABLE} from './cafeSet';
import {clamp, f1, hash, keyS, ss, useUid, word} from '../lib';
import {INK} from '../world/draw';

const W = word;
export const CB = {
  e0: W('in', 0).start - 0.12,
  ordinary: W('ordinary').start,
  identify: W('identify').start,
  even: W('even').start,
  f1: W('they', 1).start - 0.1, // cut to the test corridor
  h0: W('so').start - 0.12,
  recognizes: W('recognizes').start,
  without: W('without', 1).start,
  anything: W('anything').start,
  h1: W('now').start - 0.1, // cut to the lab ending
};

// ------------------------------------------------------------------ people
const HERO_Z = PATH_Z;
const V = 560; // units/s (0.93 m/s)
/** E/F: he enters from the right */
const GE: Gait = {x0: 2.1 * U + V * CB.e0, v: V, T: 0.95, ph: 0.1, hipY: -478, arm: 60};
/** H: a second pass, a few steps further along */
const GH: Gait = {x0: 1.15 * U + V * CB.h0, v: V, T: 0.95, ph: 0.6, hipY: -478, arm: 60};
const heroGait = (t: number) => (t < CB.h0 - 0.5 ? GE : GH);
export const heroX = (t: number) => walkX(heroGait(t), t) / U;

const CUSTOMER: Outfit = {skin: '#8D5A3B', hair: '#1E1A1A', shirt: '#7C6BD6', stripe: null, pants: '#3B3F48', shoe: '#E9E9E9', longSleeve: true, hairStyle: 'curly'};
const PASSER: Outfit = {skin: '#F1C7A5', hair: '#E2B85C', shirt: '#E07A5F', stripe: null, pants: '#2F4858', shoe: '#F4F1EA', longSleeve: true, hairStyle: 'bun'};
const CUST_G = v3(TABLE.x + 0.5, 0, TABLE.z + 0.02);
const custPose = (t: number) =>
  pose({x: 0, y: -282, torso: 9, chest: 3, neck: 6 + 2 * Math.sin(t * 0.9), turn: 0.62,
    lW: 1, lWx: (LAPTOP.x - CUST_G.x) * U + 30 + 8 * Math.sin(t * 7), lWy: -(TABLE.y + 0.03) * U, lElb: -1,
    rW: 1, rWx: (LAPTOP.x - CUST_G.x) * U + 95 + 8 * Math.sin(t * 6 + 1), rWy: -(TABLE.y + 0.03) * U, rElb: -1,
    lAx: -255, lAy: -27, lA: 1, rAx: -205, rAy: -27, rA: 1});
const custExpr: Expr = {...EXPR_NEUTRAL, lid: 0.3, gx: -0.4, gy: 0.5, smile: 0.1};

// ------------------------------------------------------------------ cameras
const camE = (t: number): Cam => {
  const hx = heroX(t);
  if (t >= CB.even - 0.05) return {pos: v3(hx - 0.16, 1.1, HERO_Z - 1.95 + 0.15 * ss(t, CB.even - 0.05, CB.f1)), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 960};
  const track: Cam = {pos: v3(hx - 0.42, 1.38, -2.55), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 760};
  const screen: Cam = {pos: v3(MONI.x, MONI.y + 0.02, MONI.z - 1.05), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 900};
  const hxF = heroX(t);
  const close: Cam = {pos: v3(hxF - 0.22, 1.02, HERO_Z - 2.15), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 860};
  return camKeys(t, [
    [CB.e0, {...track, pos: add3(track.pos, v3(0.25, 0.2, -0.2))}],
    [CB.ordinary, track],
    [CB.identify - 0.15, track],
    [CB.identify + 0.5, screen],
    [CB.even - 0.05, screen],
  ]);
};
const camH = (t: number): Cam => {
  const hx = heroX(t);
  const high: Cam = {pos: v3(hx - 0.3, 3.0, -2.3), yaw: 0, pitch: -16, f: 2000, cx: 540, cy: 960};
  const street: Cam = {pos: v3(hx - 0.42, 1.3, -2.45), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 760};
  const screen: Cam = {pos: v3(MONI.x, MONI.y + 0.02, MONI.z - 1.05), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 900};
  // the window: he passes in front of the laptop, close enough to read his face
  const win: Cam = {pos: v3(Math.max(hx + 0.05, MONI.x - 0.15), 1.42, -0.95), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 900};
  return camKeys(t, [
    [CB.h0, high],
    [CB.recognizes - 0.3, street],
    [CB.recognizes + 0.25, screen],
    [CB.without - 0.15, screen],
    [CB.without + 0.45, win],
    [CB.h1, {...win, pos: add3(win.pos, v3(-0.05, 0, 0.12))}],
  ]);
};
// ------------------------------------------------------------------ Wi-Fi
/** the router-to-laptop link: packets flow along it; where his body crosses it, the path scatters */
const Link: React.FC<{b: B; t: number; bodyX: number}> = ({b, t, bodyX}) => {
  const N = 60;
  const A = add3(ROUTER, v3(0, 0.08, -0.05)), Bp = add3(LAPTOP, v3(0.19, 0.12, 0));
  const uc = (HERO_Z - A.z) / (Bp.z - A.z);
  const xc = A.x + (Bp.x - A.x) * uc;
  const near = clamp(1 - Math.abs(bodyX - 0.05 - xc) / 0.5); // how much of his body is in the path
  const strands = [0, 1, 2];
  const k = scaleAt(b, v3(xc, 1, HERO_Z));
  // a link that runs behind the camera (the close shot of the laptop) is not drawn
  if (Math.min(depth(b, A), depth(b, Bp)) < 0.4) return null;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {strands.map((sI) => {
        const pts = Array.from({length: N + 1}, (_, i) => {
          const u = i / N;
          const p = v3(A.x + (Bp.x - A.x) * u, A.y + (Bp.y - A.y) * u + Math.sin(u * Math.PI) * 0.12, A.z + (Bp.z - A.z) * u);
          const P = proj(b, p);
          // multipath: past the body the strands split and wobble
          const dist = u - uc;
          const env = near * clamp(1 - Math.abs(dist) / 0.22) + near * 0.5 * clamp(dist / 0.15) * clamp((0.6 - dist) / 0.3);
          const off = (sI - 1) * k * 0.09 * env + Math.sin(u * 40 - t * 9 + sI * 2) * k * 0.025 * env;
          return {x: P.x, y: P.y + off};
        });
        const d = `M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`;
        const w = Math.max(2.2, k * 0.011);
        return (
          <g key={sI} opacity={sI === 1 ? 1 : near * 0.9}>
            <path d={d} fill="none" stroke="#5CE1FF" strokeWidth={w * 3.2} opacity={0.22} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#9FEFFF" strokeWidth={w * 0.8} opacity={0.55} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={w * 1.1} strokeDasharray={`${f1(w * 2.2)} ${f1(w * 5)}`} strokeDashoffset={f1(-t * w * 30)} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};
/** rings from the router (its ordinary broadcast) */
const Rings: React.FC<{b: B; t: number; at: V3; strength?: number}> = ({b, t, at, strength: s0 = 1}) => {
  const c = proj(b, at);
  const k = scaleAt(b, at);
  // only from across the street (close to the facade the rings would swamp the picture)
  const strength = s0 * clamp((b.c.f / k - 3.6) / 1.2);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {[0, 1, 2, 3].map((i) => {
        const ph = ((t * 0.7 + i / 4) % 1);
        return <circle key={i} cx={f1(c.x)} cy={f1(c.y)} r={f1(k * (0.15 + ph * 1.6))} fill="none" stroke="#BFF6FF" strokeWidth={Math.max(1.5, k * 0.01)} opacity={strength * 0.8 * (1 - ph) * clamp(ph * 5)} />;
      })}
      <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(k * 0.16)} fill="#BFF6FF" opacity={strength * (0.25 + 0.15 * Math.sin(t * 8))} />
    </g>
  );
};

// ------------------------------------------------------------------ the monitoring laptop
/** a signal pattern: columns of colour (the feedback values over time), deterministic per person */
const Pattern: React.FC<{x: number; y: number; w: number; h: number; seed: number; reveal?: number; cols?: number}> = ({x, y, w, h, seed, reveal = 1, cols = 26}) => {
  const pal = ['#173B6B', '#1E6FA8', '#25A6B8', '#7FE0C2', '#F6D26B', '#F08A4B'];
  return (
    <g>
      {Array.from({length: cols}, (_, i) => {
        if (i / cols > reveal) return null;
        const v = 0.5 + 0.5 * Math.sin(i * 0.55 + seed * 1.7) * 0.6 + (hash(i, seed) - 0.5) * 0.5;
        const v2 = 0.5 + 0.5 * Math.sin(i * 0.9 + seed * 0.7) * 0.6 + (hash(i + 99, seed) - 0.5) * 0.5;
        const c1 = pal[Math.max(0, Math.min(5, Math.round(v * 5)))], c2 = pal[Math.max(0, Math.min(5, Math.round(v2 * 5)))];
        return (
          <g key={i}>
            <rect x={f1(x + (i / cols) * w)} y={f1(y)} width={f1(w / cols + 0.5)} height={f1(h / 2)} fill={c1} />
            <rect x={f1(x + (i / cols) * w)} y={f1(y + h / 2)} width={f1(w / cols + 0.5)} height={f1(h / 2)} fill={c2} />
          </g>
        );
      })}
    </g>
  );
};
const HERO_SEED = 12;
const Moni: React.FC<{b: B; t: number; mode: 'E' | 'H'}> = ({b, t, mode}) => {
  const u = useUid();
  const tl = proj(b, v3(MONI.x - MONI.w / 2, MONI.y + MONI.h / 2, MONI.z)), br = proj(b, v3(MONI.x + MONI.w / 2, MONI.y - MONI.h / 2, MONI.z));
  const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
  const k = scaleAt(b, v3(MONI.x, MONI.y, MONI.z));
  const fs = r.h * 0.07;
  const mono = 'JetBrains Mono, monospace';
  // E: the live pattern records as he passes (from when his body crosses the link), then is compared row by row
  const rec = mode === 'E' ? ss(t, CB.identify - 0.9, CB.identify + 0.4) : 1;
  const scan = mode === 'E' ? keyS(t, [[CB.identify + 0.3, 0], [CB.identify + 1.1, 3]]) : 0;
  const match = mode === 'E' ? ss(t, CB.identify + 1.0, CB.identify + 1.2) : ss(t, CB.recognizes + 0.3, CB.recognizes + 0.5);
  const rows = [7, HERO_SEED, 31, 45];
  const px = r.x + r.w * 0.06, pw = r.w * 0.6;
  return (
    <g>
      {/* lid back edge and base on the ledge */}
      <Poly b={b} pts={rz(MONI.z + 0.012, MONI.x - MONI.w / 2 - 0.018, MONI.x + MONI.w / 2 + 0.018, MONI.y - MONI.h / 2 - 0.02, MONI.y + MONI.h / 2 + 0.018)} fill="#3A4650" />
      <Poly b={b} pts={[v3(MONI.x - MONI.w / 2 - 0.02, 1.23, MONI.z - 0.03), v3(MONI.x + MONI.w / 2 + 0.02, 1.23, MONI.z - 0.03), v3(MONI.x + MONI.w / 2 + 0.03, 1.25, MONI.z + 0.24), v3(MONI.x - MONI.w / 2 - 0.03, 1.25, MONI.z + 0.24)]} fill="#7E8B94" />
      {/* the small USB antenna */}
      <Line3 b={b} pts={[v3(MONI.x + MONI.w / 2 + 0.03, 1.25, MONI.z + 0.05), v3(MONI.x + MONI.w / 2 + 0.06, 1.45, MONI.z + 0.05)]} stroke={INK} w={0.012} />
      <defs><clipPath id={`${u}moni`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <g clipPath={`url(#${u}moni)`}>
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.11)} fontSize={f1(fs)} fill="#8FB4CF" fontFamily={mono}>{mode === 'E' ? 'WI-FI FEEDBACK · REC' : 'WI-FI FEEDBACK · LIVE'}</text>
        {mode === 'E' ? (
          <g>
            <text x={f1(px)} y={f1(r.y + r.h * 0.22)} fontSize={f1(fs * 0.85)} fill="#FFD24A" fontFamily={mono}>NEW WALKER</text>
            <Pattern x={px} y={r.y + r.h * 0.25} w={pw} h={r.h * 0.11} seed={HERO_SEED} reveal={rec} />
            {rows.map((sd, i) => {
              const y = r.y + r.h * (0.45 + i * 0.13);
              const on = sd === HERO_SEED;
              const hl = clamp(1 - Math.abs(scan - i) * 1.5);
              return (
                <g key={sd}>
                  {hl > 0 && <rect x={f1(px - r.w * 0.02)} y={f1(y - r.h * 0.015)} width={f1(r.w * 0.9)} height={f1(r.h * 0.11)} fill="#1E3A55" opacity={hl} />}
                  {on && match > 0 && <rect x={f1(px - r.w * 0.02)} y={f1(y - r.h * 0.015)} width={f1(r.w * 0.9)} height={f1(r.h * 0.11)} fill="#1F7A4F" opacity={match} />}
                  <Pattern x={px} y={y} w={pw} h={r.h * 0.08} seed={sd} />
                  <text x={f1(px + pw + r.w * 0.04)} y={f1(y + r.h * 0.07)} fontSize={f1(fs)} fill={on && match > 0.5 ? '#B6FFD6' : '#8FB4CF'} fontFamily={mono}>{`#${String(sd).padStart(2, '0')}`}</text>
                </g>
              );
            })}
            {match > 0.3 && <text x={f1(r.x + r.w * 0.94)} y={f1(r.y + r.h * 0.33)} textAnchor="end" fontSize={f1(fs * 1.25)} fill="#7CFFB2" fontFamily={mono} fontWeight={700} opacity={clamp((match - 0.3) / 0.4)}>MATCH</text>}
          </g>
        ) : (
          <g>
            <text x={f1(px)} y={f1(r.y + r.h * 0.26)} fontSize={f1(fs * 0.85)} fill="#8FB4CF" fontFamily={mono}>RECORDED · MON 08:41</text>
            <Pattern x={px} y={r.y + r.h * 0.3} w={r.w * 0.86} h={r.h * 0.14} seed={HERO_SEED} />
            <text x={f1(px)} y={f1(r.y + r.h * 0.56)} fontSize={f1(fs * 0.85)} fill="#FFD24A" fontFamily={mono}>NOW</text>
            <Pattern x={px} y={r.y + r.h * 0.6} w={r.w * 0.86} h={r.h * 0.14} seed={HERO_SEED} reveal={ss(t, CB.recognizes - 0.6, CB.recognizes + 0.3)} />
            {match > 0 && <rect x={f1(px - r.w * 0.015)} y={f1(r.y + r.h * 0.28)} width={f1(r.w * 0.89)} height={f1(r.h * 0.48)} fill="none" stroke="#7CFFB2" strokeWidth={Math.max(1.5, k * 0.004)} opacity={match} />}
            {match > 0.3 && <text x={f1(r.x + r.w / 2)} y={f1(r.y + r.h * 0.9)} textAnchor="middle" fontSize={f1(fs * 1.25)} fill="#7CFFB2" fontFamily={mono} fontWeight={700} opacity={clamp((match - 0.3) / 0.4)}>#12 · SEEN BEFORE</text>}
          </g>
        )}
      </g>
      {/* window glass over the laptop (it sits inside) */}
      <rect x={r.x - r.w * 0.1} y={r.y - r.h * 0.2} width={r.w * 1.2} height={r.h * 1.4} fill={CC.glass} opacity={0.12} />
    </g>
  );
};

// ------------------------------------------------------------------ pockets (F)
const Pockets: React.FC<{cd: ReturnType<typeof cardAt>; p: ReturnType<typeof walk>; t: number; a: number}> = ({cd, p, t, a}) => {
  if (a <= 0) return null;
  const j = manJoints(p);
  const flap = (hp: {x: number; y: number}, dx: number, sw: number, far: boolean) => {
    const top = cardPt(cd, {x: hp.x + dx, y: hp.y + 30});
    const k = cd.k;
    const len = 78 * k * a, wd = 46 * k;
    const ang = 6 + 10 * Math.sin(t * 6.5 + sw);
    return (
      <g transform={`translate(${f1(top.x)} ${f1(top.y)}) rotate(${f1(ang)})`} opacity={far ? 0.92 : 1}>
        <path d={`M${f1(-wd / 2)},0 L${f1(wd / 2)},0 L${f1(wd * 0.42)},${f1(len * 0.85)} Q0,${f1(len * 1.1)} ${f1(-wd * 0.42)},${f1(len * 0.85)} Z`} fill={far ? '#E4E6E8' : '#F7F7F4'} stroke={INK} strokeWidth={Math.max(1, k * 4)} strokeLinejoin="round" />
        <path d={`M${f1(-wd * 0.3)},${f1(len * 0.3)} Q0,${f1(len * 0.38)} ${f1(wd * 0.3)},${f1(len * 0.3)}`} fill="none" stroke="#B9BEC4" strokeWidth={Math.max(1, k * 3)} />
      </g>
    );
  };
  return <g>{flap(j.rLeg.hp, -36, 1.3, true)}{flap(j.lLeg.hp, -30, 0, false)}</g>;
};

export const CafeScene: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const isH = t > CB.h0 - 0.5;
  const cam = isH ? camH(t) : camE(t);
  const b = basis(cam);
  const g = heroGait(t);
  const hp = walk(g, t);
  const hx = hp.x / U;
  const cd = cardAt(b, v3(0, 0, HERO_Z));
  // F: the pockets come out (they were turned out all along; the shot reveals them)
  const pocket = !isH && t > CB.even - 0.5 ? 1 : 0;
  // expressions: easy-going; H: he notices the window (head turns toward the camera, eyes to the right)
  const notice = isH ? ss(t, CB.anything - 0.55, CB.anything - 0.15) : 0;
  const ex: Expr = mixExpr({...EXPR_NEUTRAL, smile: 0.3, gx: -0.5}, {...EXPR_UNEASY, gx: -0.95, gy: 0.15, browIn: 0.95, pupil: 0.72}, notice);
  // F: both palms come up, open and empty, while he keeps walking
  const shrug = 0; // tried: an open-palms shrug read as adjusting his belt in this rig; the hands stay open and swinging
  const lerpN = (a: number, c: number) => a + (c - a) * shrug;
  const hpN = {...hp, turn: hp.turn + 0.3 * notice, neck: hp.neck + 4 * notice,
    lTu: lerpN(hp.lTu, -150), lTv: lerpN(hp.lTv, -250), lWr: lerpN(hp.lWr, -80), lElb: hp.lElb,
    rTu: lerpN(hp.rTu, -160), rTv: lerpN(hp.rTv, -300), rWr: lerpN(hp.rWr, -70)};
  const hands: HandPose = {curl: [0.08, 0.1, 0.12, 0.15], spread: 0.55, thumb: 34, thumbCurl: 0.15};
  const custCd = cardAt(b, CUST_G);
  // the passer-by on the far side of the sidewalk (walks to screen-right: a mirrored card)
  const passG: Gait = {x0: 3.0 * U + 520 * CB.e0, v: 520, T: 0.98, ph: 0.3, hipY: -480, arm: 55};
  const passCd = cardAt(b, v3(0, 0, 2.75));
  const passP = walk(passG, t);
  const showPass = !isH && t < CB.identify + 0.6;
  const linkOn = !isH ? 1 : 0.6;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={CC.sky} />
      <CafeBack b={b} t={t} />
      <Moni b={b} t={t} mode={isH ? 'H' : 'E'} />
      <BladeSign b={b} />
      <CafeGround b={b} />
      {showPass && (
        <g>
          <FloorShadow cd={{...passCd, x: passCd.x - passCd.k * passP.x}} w={200} />
          <Person id={`${u}pass`} cd={passCd} p={passP} flip look={{outfit: PASSER, expr: {...EXPR_NEUTRAL, gx: -0.3, smile: 0.35}}} />
        </g>
      )}
      <Rings b={b} t={t} at={add3(ROUTER, v3(0, 0.12, -0.1))} strength={isH ? 0.5 : 1} />
      <FloorShadow cd={cd} x={hp.x} w={210} />
      <Person id={`${u}hero`} cd={cd} p={hpN} look={{expr: ex, lHand: hands, rHand: hands, hairSway: 3 * Math.sin(t * 6.6)}} />
      <Pockets cd={cd} p={hpN} t={t} a={pocket} />
      <Link b={b} t={t} bodyX={hx} />
      {!isH && <Table b={b} part="back" />}
      {!isH && <g>
        {/* the customer's chair */}
        <Poly b={b} pts={rz(CUST_G.z + 0.18, CUST_G.x - 0.05, CUST_G.x + 0.32, 0.45, 0.95)} fill={CC.metal} op={1} />
        <Line3 b={b} pts={[v3(CUST_G.x + 0.25, 0, CUST_G.z + 0.15), v3(CUST_G.x + 0.25, 0.45, CUST_G.z + 0.15)]} stroke={CC.metal} w={0.03} />
        <Line3 b={b} pts={[v3(CUST_G.x - 0.15, 0, CUST_G.z - 0.1), v3(CUST_G.x - 0.15, 0.45, CUST_G.z - 0.1)]} stroke={CC.metal} w={0.03} />
        <Poly b={b} pts={[v3(CUST_G.x - 0.2, 0.45, CUST_G.z - 0.18), v3(CUST_G.x + 0.3, 0.45, CUST_G.z - 0.18), v3(CUST_G.x + 0.3, 0.47, CUST_G.z + 0.18), v3(CUST_G.x - 0.2, 0.47, CUST_G.z + 0.18)]} fill="#55636D" />
      </g>}
      {!isH && <Person id={`${u}cust`} cd={custCd} p={custPose(t)} look={{outfit: CUSTOMER, expr: custExpr}} />}
      {!isH && <Table b={b} part="front" />}
      <CafeFore b={b} />
    </svg>
  );
};
export {PAL, HAND_RELAXED, FACADE};
