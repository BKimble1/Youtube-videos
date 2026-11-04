// V5 soccer body: the V2 Wyatt with a corrected torso construction (V5 polish).
//   - the far side's screen offset (stag) still places the far LEG (it separates the planted cleat from the ball in the
//     decisive frame), but the torso only takes a small, capped share of it, so the jersey no longer skews toward the
//     far hip and the far shoulder stays on the body
//   - the torso sits over the middle of the pelvis (between the hips), not over the near hip
//   - relaxed shoulders: the shoulder joint sits lower on the rib cage and the sleeve no longer rides up past it
//   - a visible neck between the collar and the jaw
//   - the far thigh's shorts run back into the pelvis, so the far leg connects to the hips
// Legs, feet and the prosthesis are computed exactly as in V2 (bjoints5 gives the same leg joints as bjoints).
// V2 Wyatt: the Weird Crew construction rebuilt for natural movement. A pelvis and a rib cage are separate masses
// joined at the waist (each tilts on its own), so the jersey bends with the spine instead of staying a rigid slab;
// the shoulders sit on the rib cage; arms are either posed by angles or reach for a world target (two-bone IK, so a
// hand can stay on a rail while the elbow bends); legs are the V1 leg (thigh 35, shin 31) with an ordinary shoe, a
// cleat or the bare foot. He faces screen-LEFT; his RIGHT leg (nearest the camera) is the rotationplasty leg.
//
// The prosthesis has three finishes: 'xray' (an illustrative cutaway: a thin, translucent shell with a light cut
// edge, so the turned foot inside reads in its real skin colour), 'local' (an opaque shell with one small window over
// the ankle and heel) and 'solid'. `clear` blends solid -> xray.
import React from 'react';
import {Deco, INK, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {Blob, Capsule} from '../dc/shade';
import {Limb} from '../dc/limb';
import {Expr, Head} from '../dc/Head';
import {Hand, HandPose, HAND_RELAXED} from '../dc/Hand';
import {lit, mix, shade} from '../dc/color';
import {add, fmt, len, mul, norm, P, perp, sub, V} from '../dc/math';
import {closed} from '../core/geo';
import {C} from '../art/pal';
import {BioFoot, Cleat, DIMW, Leg, SEAT, SOCKET_BOT, SOCKET_OUT, dirA, footPt, shankPt, upA} from '../art/wyatt';

export const SKIN = '#F2C9A8'; // the crew's skin (dc/Head CREW.skin)
const rad = (d: number) => (d * Math.PI) / 180;
const angOf = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const path = (ps: V[], t = 1) => closed(ps, t);

export type ArmT = {sh: number; el: number; T?: undefined} | {T: V; elbow: 1 | -1; sh?: undefined};
export type Shoe = 'cleat' | 'sneaker' | 'bare';
export type BPose = {
  /** near (right) hip joint */
  hip: V;
  /** pelvis and rib cage tilts from vertical (deg, + = toward his front) */
  pelvis: number;
  chest: number;
  near: Leg;
  far: Leg;
  /** far hip offset (screen cm): a slightly turned view shows the far side shifted */
  stag: V;
  aN: ArmT;
  aF: ArmT;
  hN?: HandPose;
  hF?: HandPose;
  /** wrist bend added to the forearm direction (deg) */
  wN?: number;
  wF?: number;
  /** V3: absolute hand angles (deg, screen), e.g. a hand wrapped over a rail */
  hAbsN?: number;
  hAbsF?: number;
  neck: number;
  turn: number;
  expr: Expr;
  blink: number;
};

/** frame helpers: (f, u) in a segment's frame -> world; f toward his front, u up the segment */
const frame = (O: V, tilt: number) => {
  const up = upA(tilt), fw = {x: -Math.cos(rad(tilt)), y: Math.sin(rad(tilt))};
  return (f: number, u: number): V => add(O, add(mul(fw, f), mul(up, u)));
};
/** two-bone IK: elbow on side s of the shoulder->target line */
export const ik2 = (S: V, T: V, l1: number, l2: number, s: 1 | -1) => {
  const d0 = sub(T, S);
  const d = Math.min(Math.max(len(d0), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.05);
  const dir = norm(d0);
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const E = add(add(S, mul(dir, a)), mul(perp(dir), h * s));
  return {E, W: add(S, mul(dir, d)), reach: len(d0) / (l1 + l2)};
};

/** the torso's share of the far side's offset: at most BODY_STAG cm */
export const BODY_STAG = 6.5;
export const bodyStag = (st: V): V => { const k = Math.min(1, BODY_STAG / Math.max(1e-6, Math.abs(st.x))); return {x: st.x * k, y: st.y * k}; };
export const bjoints5 = (p: BPose) => {
  const H = p.hip;
  const Hf = add(H, p.stag);
  const nSa = p.near.hip - p.near.knee, fSa = p.far.hip - p.far.knee;
  const A = add(H, mul(dirA(p.near.hip), DIMW.thigh));
  const PA = add(A, mul(dirA(nSa), DIMW.shin));
  const K = add(Hf, mul(dirA(p.far.hip), DIMW.thigh));
  const FA = add(K, mul(dirA(fSa), DIMW.shin));
  const bst = bodyStag(p.stag);
  const pel = frame(H, p.pelvis);
  // the waist over the middle of the pelvis
  const Wst = add(pel(-1.6, 10.5), mul(bst, 0.45));
  const rib = frame(Wst, p.chest);
  const S = rib(0.7, 18.9);
  const Sf = add(S, {x: bst.x * 0.9, y: bst.y * 0.9 - 0.6});
  const N = rib(1.0, 26.8);
  const headC = add(N, mul(upA(p.chest + p.neck), DIMW.headR * 0.96));
  const arm = (Sh: V, a: ArmT) => {
    if (a.T) {
      const r = ik2(Sh, a.T, DIMW.upper, DIMW.fore, a.elbow);
      return {S: Sh, E: r.E, W: r.W, reach: r.reach};
    }
    const E = add(Sh, mul(dirA(a.sh), DIMW.upper));
    return {S: Sh, E, W: add(E, mul(dirA(a.sh + a.el), DIMW.fore)), reach: 0};
  };
  return {
    H, Hf, A, PA, K, FA, nSa, fSa, pel, rib, Wst, S, Sf, N, headC, bst,
    nFoot: nSa + 90 - p.near.ank, fFoot: fSa + 90 - p.far.ank, bioFoot: nSa - SEAT,
    armN: arm(S, p.aN), armF: arm(Sf, p.aF),
  };
};
export type BJ = ReturnType<typeof bjoints5>;

/** an ordinary trainer (same frame as the cleat: ankle pivot, u to the toes, v to the sole; sole at v = 7.7) */
const SNEAK: [number, number][] = [
  [-4.6, -3.6], [2.8, -3.4], [6.0, -1.4], [10.2, 0.8], [14.2, 2.3], [16.8, 3.6], [17.9, 5.2], [17.6, 7.0], [15.6, 7.7],
  [6, 7.75], [-4, 7.75], [-6.8, 7.2], [-7.4, 4.4], [-6.9, 0.8], [-5.8, -2.0],
];
export const Sneaker: React.FC<{id: string; A: V; fa: number; iw: number; dim?: number}> = ({id, A, fa, iw, dim = 0}) => {
  const F = (u: number, v: number) => footPt(A, fa, 1, u, v);
  const col = (c: string) => (dim ? shade(c, dim) : c);
  return (
    <g>
      <Inked w={iw}>
        <Blob id={`${id}-b`} d={path(SNEAK.map(([u, v]) => F(u, v)))} c={F(4, -2)} r={13} color={col('#F3F5F7')} k={0.9} />
      </Inked>
      <Deco>
        <path d={path([F(-7.2, 5.6), F(17.9, 5.6), F(17.6, 7.0), F(15.6, 7.72), F(-4, 7.75), F(-6.8, 7.2)], 0.4)} fill={col('#C9D1D9')} />
        <path d={path([F(-0.5, 1.2), F(10.5, 3.0), F(10.0, 4.4), F(-1.0, 3.2)], 0.5)} fill={col('#3D7BD8')} />
        <path d={path([F(-3.8, -3.4), F(2.4, -3.2), F(2.0, -2.2), F(-3.6, -2.3)], 0.5)} fill={col('#2A313A')} />
        {[4.6, 7.0, 9.4].map((u) => (
          <InkLine key={u} d={`M${P(F(u - 0.6, -1.0 + (u - 4) * 0.42))} L${P(F(u + 0.8, 0.4 + (u - 4) * 0.42))}`} w={iw * 0.5} />
        ))}
      </Deco>
    </g>
  );
};
const ShoeOn: React.FC<{id: string; kind: Shoe; A: V; fa: number; iw: number; dim?: number}> = ({kind, ...r}) =>
  kind === 'cleat' ? <Cleat {...r} /> : kind === 'sneaker' ? <Sneaker {...r} /> : null;

export type SocketStyle = {
  /** 0 = solid carbon, 1 = the illustrative cutaway (translucent shell) */
  clear: number;
  /** 0..1: a small window over the ankle and heel cut into the solid shell */
  local: number;
  /** V3: 0..1 a solid carbon rim round the clear shell (the cut wall), so the socket reads as a real part */
  rim?: number;
};
/** the fitted prosthesis: socket (style above), pylon, prosthetic foot's shoe */
export const Prosthesis2: React.FC<{id: string; j: BJ; iw: number; s: SocketStyle; shoe: Shoe; toeCurl: number; skin: string}> = ({id, j, iw, s, shoe, toeCurl, skin}) => {
  const pass = useInk().pass;
  const sp = (q: V) => shankPt(j.A, j.nSa, q.x, q.y);
  const out = path(SOCKET_OUT.map(sp), 0.9);
  const pyl0 = sp({x: 0, y: SOCKET_BOT - 0.6}), pyl1 = sp({x: 0, y: DIMW.shin - 2.2});
  const shellOp = 1 - 0.86 * s.clear;
  // the local window: an oval round the ankle and heel
  const wc = sp({x: 2.6, y: 0.6});
  const wr = 7.4 * s.local;
  void pass;
  const foot = (
    <g>
      <Inked w={iw}>
        <Capsule id={`${id}-lg`} a={add(j.A, mul(sub(j.H, j.A), 0.3))} b={j.A} ra={4.3} rb={3.7} color={skin} />
      </Inked>
      <BioFoot id={`${id}-bf`} A={j.A} fa={j.bioFoot} h={-1} iw={iw} toeCurl={toeCurl} skin={skin} />
    </g>
  );
  return (
    <g>
      <Inked w={iw}>
        <Capsule id={`${id}-py`} a={pyl0} b={pyl1} ra={1.45 + 0.35 * (s.rim ?? 0)} rb={1.45 + 0.35 * (s.rim ?? 0)} color={C.pylon} spec={0.55} />
        <InkPath d={path([sp({x: -2.6, y: SOCKET_BOT - 1.2}), sp({x: 2.6, y: SOCKET_BOT - 1.2}), sp({x: 1.8, y: SOCKET_BOT + 1.4}), sp({x: -1.8, y: SOCKET_BOT + 1.4})], 0.3)} fill={C.pylonDeep} />
      </Inked>
      <ShoeOn id={`${id}-sh`} kind={shoe} A={j.PA} fa={j.nFoot} iw={iw} />
      <g opacity={shellOp}>
        <Inked w={iw * (1 - 0.55 * s.clear)}>
          <Blob id={`${id}-sl`} d={out} c={sp({x: 3, y: 4})} r={20} color={C.carbon} k={1.1} />
        </Inked>
      </g>
      {pass !== 'ink' && (
        <g>
          <defs><clipPath id={`${id}-oc`}><path d={out} /></clipPath></defs>
          <g clipPath={`url(#${id}-oc)`}>
            {/* weave and gloss on the shell */}
            {Array.from({length: 14}, (_, i) => {
              const a = sp({x: -12 + i * 2.4, y: -8}), b = sp({x: -12 + i * 2.4 + 14, y: 24});
              return <line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={C.carbonLight} strokeWidth={0.45} opacity={0.2 * shellOp + 0.06} />;
            })}
            <path d={`M${P(sp({x: 7.6, y: -3.5}))} Q${P(sp({x: 8.4, y: 6}))} ${P(sp({x: 5.2, y: 14.5}))}`} stroke="#FFFFFF" strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.25 + 0.25 * s.clear} />
            {/* a small window over the ankle and heel */}
            {wr > 0.3 && (
              <g>
                <defs><clipPath id={`${id}-lw`}><circle cx={fmt(wc.x)} cy={fmt(wc.y)} r={fmt(wr)} /></clipPath></defs>
                <circle cx={fmt(wc.x)} cy={fmt(wc.y)} r={fmt(wr)} fill={C.liner} />
                <g clipPath={`url(#${id}-lw)`}>{foot}</g>
                <circle cx={fmt(wc.x)} cy={fmt(wc.y)} r={fmt(wr)} fill="none" stroke={C.carbonCut} strokeWidth={0.6} />
                <circle cx={fmt(wc.x)} cy={fmt(wc.y)} r={fmt(wr + 0.35)} fill="none" stroke={INK} strokeWidth={iw * 0.28} opacity={0.7} />
              </g>
            )}
          </g>
          {/* the foot sits over the clear shell's tint, in its own colour; the shell's thin cut edge on top */}
          {s.clear > 0.01 && <g opacity={Math.min(1, s.clear * 1.6)}>{foot}</g>}
          {s.clear > 0.01 && (
            <g opacity={s.clear}>
              {(s.rim ?? 0) > 0.01 && (
                <g opacity={s.rim}>
                  <g clipPath={`url(#${id}-oc)`}><path d={out} fill="none" stroke={C.carbon} strokeWidth={3.0} /></g>
                  <g clipPath={`url(#${id}-oc)`}><path d={out} fill="none" stroke={C.carbonCut} strokeWidth={0.5} transform="" opacity={0.9} /></g>
                  <path d={out} fill="none" stroke={INK} strokeWidth={iw * 0.75} />
                </g>
              )}
              <path d={out} fill="none" stroke={C.carbonCut} strokeWidth={0.55} opacity={0.9} />
              <path d={out} fill="none" stroke={INK} strokeWidth={iw * 0.3} opacity={0.55} />
            </g>
          )}
          <path d={`M${P(sp({x: -6.4, y: -2.6}))} L${P(sp({x: 9.6, y: -7.2}))}`} stroke={C.liner} strokeWidth={1.3} strokeLinecap="round" opacity={0.9} />
        </g>
      )}
    </g>
  );
};

export type BOpts = {
  id: string;
  px: number;
  shoeN: Shoe; // the prosthetic side's shoe
  shoeF: Shoe;
  /** the rotationplasty leg below the thigh: the fitted prosthesis, or the bare turned foot */
  prosthesis: boolean;
  socket?: SocketStyle;
  toeCurl?: number;
  shirt?: string;
  shorts?: string;
  sock?: string | null;
  hideHead?: boolean;
  silhouette?: boolean;
  /** draw order hook: something between the far arm and the body (a far rail) */
  behind?: React.ReactNode;
  /** between the body and the near arm (the near rail sits under the near hand) */
  beforeNearArm?: React.ReactNode;
  skin?: string;
  /** the bare turned foot's angle from the thigh axis (90 = neutral, pointing straight back) */
  footRel?: number;
  /** draw this instead of the near leg below the shorts (the illustration's 3D piece) */
  nearLeg?: React.ReactNode;
};

export const Wyatt5: React.FC<{p: BPose; o: BOpts}> = ({p, o}) => {
  const j = bjoints5(p);
  const iw = 7 * o.px;
  const id = o.id;
  const skin = o.skin ?? SKIN;
  const shirt = o.shirt ?? C.jersey, shorts = o.shorts ?? C.shorts;
  const sock = o.sock === undefined ? C.sock : o.sock;
  const fd = 0.1;
  const pel = j.pel, rib = j.rib;
  // the jersey: rib cage points and the top of the pelvis, one outline that bends at the waist
  const sh = (q: V, k: number) => ({x: q.x + j.bst.x * k, y: q.y + j.bst.y * k});
  // the far side of the pelvis and chest (a slightly turned view widens them toward the far hip)
  const pelvisF = path([pel(7.6, 6.5), pel(8.0, 0), pel(5.2, -7.5), pel(-3.6, -9.6), pel(-9.6, -5.5), pel(-10.4, 2), pel(-9.4, 6.5)].map((q) => sh(q, 1)));
  const jerseyF = path([pel(7.4, 3.2), pel(7.9, 9), rib(8.0, 3.5), rib(9.2, 12), rib(8.6, 19), rib(4.8, 24.2), rib(-2.6, 24.8), rib(-7.1, 21.5), rib(-8.4, 12), rib(-7.6, 3.5), pel(-9.8, 9), pel(-10.2, 3.2)].map((q, i) => sh(q, i < 2 || i > 9 ? 0.85 : 0.5)));
  const jersey = path([pel(7.4, 3.2), pel(7.9, 9), rib(8.0, 3.5), rib(9.2, 12), rib(8.6, 19), rib(4.8, 24.2), rib(-2.6, 24.8), rib(-7.1, 21.5), rib(-8.4, 12), rib(-7.6, 3.5), pel(-9.8, 9), pel(-10.2, 3.2)]);
  const pelvisD = path([pel(7.6, 6.5), pel(8.0, 0), pel(5.2, -7.5), pel(-3.6, -9.6), pel(-9.6, -5.5), pel(-10.4, 2), pel(-9.4, 6.5)]);
  const shortsLeg = (H: V, hipA: number, k: string, c: string) => (
    <Inked w={iw}>
      <Capsule id={`${id}-${k}sl`} a={add(H, mul(dirA(hipA), -1.5))} b={add(H, mul(dirA(hipA), 11.5))} ra={8.3} rb={7.7} color={c} />
    </Inked>
  );
  const armDraw = (k: string, a: {S: V; E: V; W: V}, hand: HandPose, wb: number, dim: number, abs?: number) => {
    const fdir = norm(sub(a.W, a.E));
    const sk = dim ? shade(skin, dim) : skin;
    const ud = norm(sub(a.E, a.S));
    return (
      <g>
        <Inked w={iw}>
          <Limb id={`${id}-${k}a`} A={a.S} B={a.E} C={a.W} rA={3.7} rB={3.0} rC={2.4} color={sk} k={0.9} capC="flat" crease={iw * 0.6} />
          <Hand id={`${id}-${k}h`} wrist={a.W} ang={abs ?? angOf(fdir) + wb} L={DIMW.hand} thumbSide={1} view="back" pose={hand} color={sk} bare />
        </Inked>
        <Inked w={iw}>
          <Capsule id={`${id}-${k}sv`} a={add(a.S, mul(ud, -0.9))} b={add(a.S, mul(ud, 8.0))} ra={4.5} rb={4.0} color={dim ? shade(shirt, dim) : shirt} />
        </Inked>
      </g>
    );
  };
  const kneeIn = add(j.K, mul(dirA(j.fSa), 3.2));
  const farLeg = (
    <g>
      <Inked w={iw}>
        <Limb id={`${id}-fl`} A={j.Hf} B={j.K} C={j.FA} rA={7.8} rB={4.6} rC={3.0} color={shade(skin, fd)} k={0.9} crease={iw * 0.6} />
      </Inked>
      {sock && (
        <g>
          <Inked w={iw}>
            <Capsule id={`${id}-fk`} a={kneeIn} b={j.FA} ra={4.75} rb={3.5} color={shade(sock, fd)} />
          </Inked>
          <Deco>
            <path d={`M${P(add(kneeIn, mul(dirA(j.fSa + 90), 4.7)))} L${P(add(kneeIn, mul(dirA(j.fSa + 90), -4.7)))}`} stroke={shade(C.sockBand, fd)} strokeWidth={1.4} />
          </Deco>
        </g>
      )}
      {o.shoeF === 'bare' ? <BioFoot id={`${id}-ff`} A={j.FA} fa={j.fFoot} h={1} iw={iw} skin={shade(skin, fd)} /> : <ShoeOn id={`${id}-fs`} kind={o.shoeF} A={j.FA} fa={j.fFoot} iw={iw} dim={fd} />}
      <Inked w={iw}>
        <Capsule id={`${id}-fsl`} a={add(add(j.H, mul(j.bst, 1.0)), mul(upA(p.pelvis), 1.5))} b={add(j.Hf, mul(dirA(p.far.hip), 11.5))} ra={8.4} rb={7.7} color={shade(shorts, fd)} />
      </Inked>
    </g>
  );
  const nearLeg = (
    <g>
      {o.nearLeg ?? (<Inked w={iw}>
        <Limb id={`${id}-nt`} A={j.H} B={add(j.H, mul(sub(j.A, j.H), 0.6))} C={j.A} rA={8.1} rB={5.5} rC={3.8} color={skin} k={0.9} />
      </Inked>)}
      {o.nearLeg ? null : o.prosthesis ? (
        <Prosthesis2 id={`${id}-pr`} j={j} iw={iw} s={o.socket ?? {clear: 0, local: 0}} shoe={o.shoeN} toeCurl={o.toeCurl ?? 0} skin={skin} />
      ) : (
        <BioFoot id={`${id}-bare`} A={j.A} fa={o.footRel !== undefined ? j.nSa - o.footRel : j.bioFoot} h={-1} iw={iw} toeCurl={o.toeCurl ?? 0} skin={skin} />
      )}
      {shortsLeg(j.H, p.near.hip, 'n', shorts)}
      <Deco>
        <path d={`M${P(add(j.H, add(mul(dirA(p.near.hip), 11.2), mul(dirA(p.near.hip + 90), 7.9))))} L${P(add(j.H, add(mul(dirA(p.near.hip), 11.2), mul(dirA(p.near.hip + 90), -7.9))))}`} stroke="#FFFFFF" strokeWidth={0.85} opacity={0.7} />
      </Deco>
    </g>
  );
  const body = (
    <g>
      {armDraw('f', j.armF, p.hF ?? HAND_RELAXED, p.wF ?? 0, fd, p.hAbsF)}
      {o.behind}
      {farLeg}
      <Inked w={iw}>
        <Blob id={`${id}-pvf`} d={pelvisF} c={pel(0, 2)} r={18} color={shade(shorts, 0.06)} />
        <Blob id={`${id}-pv`} d={pelvisD} c={pel(0, 2)} r={14} color={shorts} />
        <Blob id={`${id}-tof`} d={jerseyF} c={rib(3, 13)} r={26} color={shade(shirt, 0.06)} />
        <Capsule id={`${id}-nk`} a={rib(0.8, 20)} b={add(j.N, mul(upA(p.chest + p.neck), 3))} ra={3.0} rb={2.9} color={skin} />
        <Blob id={`${id}-to`} d={jersey} c={rib(3, 13)} r={24} color={shirt} />
      </Inked>
      <Deco>
        <path d={`M${P(rib(4.6, 24.0))} Q${P(rib(1.0, 22.6))} ${P(rib(-2.4, 24.6))}`} stroke={C.jerseyTrim} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <path d={`M${P(rib(7.6, 4.5))} Q${P(rib(0, 3.2))} ${P(rib(-7.4, 4.5))}`} stroke={shade(shirt, 0.25)} strokeWidth={0.7} fill="none" opacity={0.55} />
      </Deco>
      {!o.hideHead && (
        <Head id={`${id}-hd`} c={j.headC} R={DIMW.headR} roll={-(p.chest + p.neck) * 0.55} turn={p.turn} expr={p.expr} blink={p.blink} skin={skin} hair={C.hair} inkW={7 * o.px * (100 / DIMW.headR)} hairStyle="crop" />
      )}
      {nearLeg}
      {o.beforeNearArm}
      {armDraw('n', j.armN, p.hN ?? HAND_RELAXED, p.wN ?? 0, 0, p.hAbsN)}
    </g>
  );
  return o.silhouette ? <g style={{filter: 'brightness(0)'}}>{body}</g> : body;
};
export {mix, lit};
