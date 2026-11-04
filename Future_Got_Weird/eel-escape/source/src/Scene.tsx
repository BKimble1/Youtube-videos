// One frame: the camera, the environment behind, the predator and the swallowed eel composed in depth order (with the
// translucent reveal, the X-ray and the three-quarter cutaway), the environment in front, the water rush, the
// departing tail's sweep across the lens and the loop wipe back to frame 0, then captions in screen space.
import React from 'react';
import {resetIds, uid} from './core/ids';
import {open, P, pt} from './core/geo';
import {clamp, DUR, lerp, ss} from './lib';
import {DIST, Layer, layerScale, H as SH} from './camera';
import {EXIT, GILL_Z} from './anatomy';
import {N, RADII, S_EXIT} from './eel';
import {camAt, eelAt, EV, fishAt, LENS, SWEEP0, sweepX, visT} from './story';
import {BODY_PATH, FishBody, FishFar, FishLook, GillGap, gillGapPath, Operculum, Pectoral, propForRadius} from './art/fish';
import {XRayBack, XRayFront} from './art/xray';
import {CUT_WINDOW, CUT_Z, CutEdge, GillArches, InteriorBack, StomachFront} from './art/inside';
import {C} from './art/palette';
import {Eel} from './art/eelArt';
import {EnvBack, EnvFront, FishShadow, RUSH_DIR, WaterRush} from './art/water';
import {Captions} from './Captions';

const X0 = -26;
/** the yaw of the three-quarter cutaway, per depth slice: x' = X0 + (x - X0) cos ψ + z sin ψ */
const yawM = (psi: number, z: number) => {
  if (Math.abs(psi) < 1e-5) return undefined;
  const c = Math.cos(psi), s = Math.sin(psi);
  return `matrix(${c.toFixed(5)} 0 0 1 ${(X0 * (1 - c) + z * s).toFixed(4)} 0)`;
};

/** the X-ray wipe: a soft front sweeping head (x = -58) to tail (x = +58) along the fish. Arriving (on "Scientists filmed
 *  it on X-ray") the X-ray is LEFT of the front; leaving (into the cutaway) the exterior is left of it. */
const WIPE_SOFT = 5;
const xrayWipe = (t: number) => {
  const inA = EV.xray0, inB = EV.xray1, outA = EV.cut0 - 0.05, outB = EV.cut1 - 0.1;
  const fr = (u: number) => -58 + 116 * u;
  if (t < inA) return {wiping: false, front: 0, xLeft: true, showX: false, showE: true};
  if (t < inB) return {wiping: true, front: fr(ss(t, inA, inB)), xLeft: true, showX: true, showE: true};
  if (t < outA) return {wiping: false, front: 0, xLeft: true, showX: true, showE: false};
  if (t < outB) return {wiping: true, front: fr(ss(t, outA, outB)), xLeft: false, showX: true, showE: true};
  return {wiping: false, front: 0, xLeft: true, showX: false, showE: true};
};

/** the X-ray halo along the inside part of the eel, in segments whose width follows the body's taper */
const haloSegs = (P2: P[], ex: number) => {
  const end = Math.min(ex, N);
  const out: {d: string; w: number}[] = [];
  const step = 12;
  for (let i = 0; i < end; i += step) {
    const j = Math.min(end, i + step + 1);
    if (j - i < 2) break;
    const r = RADII[Math.min(N, Math.round((i + j) / 2))];
    out.push({d: open(P2.slice(i, j + 1), 0.5), w: Math.max(2.5, 2 * r + 1.5)});
  }
  return out;
};

/** the fish's look for time t */
export const lookAt = (t: number): FishLook => {
  const f = fishAt(t);
  const e = eelAt(t);
  // the eel's body lifts the cover's edge where it passes under it (thin tail: a little; trunk and head: fully)
  let prop = 0;
  if (!e.free && e.exitIdx <= N) prop = propForRadius(RADII[Math.min(N, e.exitIdx)]);
  if (e.free) prop = Math.exp(-(t - EV.release) / 0.12);
  prop = Math.max(prop, ss(t, EV.headAt - 0.2, EV.headAt + 0.2) * (1 - ss(t, EV.release, EV.release + 0.2)));
  // the eye glances back toward the gill while the head is caught, and stays on the eel as it leaves
  const look = 0.85 * ss(t, EV.headAt - 0.3, EV.headAt + 0.35);
  return {t, gill: f.gill, finPhase: f.finPhase, startle: f.startle, prop, look};
};

/** everything below the captions, for time t (also used for the loop's frame-0 overlay at t - DUR) */
const World: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const f = fishAt(t);
  const e = eelAt(t);
  const s = lookAt(t);
  const tv = visT(t);
  const px = layerScale(c, 0);
  const psi = f.yaw;
  const cs = Math.cos(psi), sn = Math.sin(psi);
  // the eel projected through the yaw (each sample at its own depth)
  const P2: P[] = e.pts.map((q) => pt(X0 + (q.x - X0) * cs + q.z * sn, q.y));

  // ---- which representations are present, and how visible each layer is
  const xw = xrayWipe(t);
  const xr = f.xray; // the environment's darkness crossfades on the same timing
  const showX = xw.showX, showE = xw.showE;
  const seeIn = clamp(Math.max(f.translucent, f.reveal)); // the skin is see-through somewhere
  const cutOn = f.cut > 0.002;
  const winA = f.cutOpen * (1 - f.cutClose); // the window fades open and fades shut (the exterior restored around the eel)
  const revealA = 0.8 * seeIn; // the interior seen through the skin (frosted)
  const kc = winA; // the gill arches cross from their seen-through look to the cut look with the window
  const skinA = clamp(1 - 0.46 * f.translucent);
  // ---- the exterior's mask: soft holes along the eel's inner path (the reveal) and the cutaway window
  const mId = uid('skinmask');
  const blurId = uid('skinblur');
  const holeIdx = e.sig.map((sg, i) => ({sg, i})).filter((o) => o.sg >= f.revealSig - 0.01 && o.sg <= S_EXIT + 0.5).map((o) => o.i);
  const holePath = holeIdx.length > 1 ? open(holeIdx.map((i) => P2[i]), 0.5) : '';
  const needMask = f.reveal > 0.002 || cutOn;
  const mask = needMask ? mId : undefined;
  // ---- eel sections
  const ex = Math.min(e.exitIdx, N + 1);
  const inside = !e.free && ex > 0;
  // split the inside part at the gill plane (behind the arches, then in front of them) whenever the inside can be seen
  let iSlit = ex;
  if (cutOn || seeIn > 0.001) {
    iSlit = 0;
    while (iSlit < ex && e.pts[iSlit].z < GILL_Z) iSlit++;
  }
  // the near-exit section seen in the gill opening (within ~3.2 u of the exit): always drawn, over the dark gap
  let iGap = ex;
  while (iGap > 0 && e.sig[iGap - 1] > S_EXIT - 3.2) iGap--;
  const gapClip = uid('gapclip');
  const finClip = uid('finclip');
  const haloId = uid('halo');
  const frostId = uid('frost');
  const wgId = uid('wg'), wgInvId = uid('wgi'), xMaskId = uid('xmask'), eMaskId = uid('emask');
  const xMaskRef = xw.wiping ? `url(#${xMaskId})` : undefined;
  const eMaskRef = xw.wiping ? `url(#${eMaskId})` : undefined;
  // after the release the swimmer rolls over so its dark back is up as it swims away
  const dorsal = 1 - 2 * ss(t, EV.release + 0.07, EV.release + 0.62);
  const eelProps = {pts: P2, radii: RADII, px, t, dorsal};
  // the rewind: faint echoes of where the eel just was (it is sliding back along its route)
  const ghosts = t > EV.rew0 && t < EV.rew1 ? [0.05, 0.1, 0.15] : [];
  const inner = (from: number, to: number) => inside && to > from && <Eel {...eelProps} from={from} to={to} />;

  return (
    <>
      <EnvBack c={c} t={tv} xray={xr} />
      <Layer c={c} z={0}>
        <defs>
          {needMask && (
            <>
              <filter id={blurId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}><feGaussianBlur stdDeviation={0.75} /></filter>
              <mask id={mId} maskUnits="userSpaceOnUse" x={-200} y={-200} width={400} height={400}>
                <rect x={-200} y={-200} width={400} height={400} fill="#FFF" />
                {holePath && f.reveal > 0.002 && <path d={holePath} stroke="#000" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.82 * f.reveal} filter={`url(#${blurId})`} />}
                {cutOn && <path d={CUT_WINDOW} fill="#000" opacity={winA} />}
              </mask>
            </>
          )}
          {seeIn > 0.002 && (
            <filter id={frostId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600} colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0.45" />
              <feComponentTransfer><feFuncR type="linear" slope="0.86" intercept="0.02" /><feFuncG type="linear" slope="0.9" intercept="0.03" /><feFuncB type="linear" slope="0.92" intercept="0.05" /></feComponentTransfer>
            </filter>
          )}
          <filter id={haloId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}><feGaussianBlur stdDeviation={0.5} /></filter>
          {xw.wiping && (
            <>
              <linearGradient id={wgId} gradientUnits="userSpaceOnUse" x1={xw.front - WIPE_SOFT} y1={0} x2={xw.front + WIPE_SOFT} y2={0}>
                <stop offset="0" stopColor={xw.xLeft ? '#FFF' : '#000'} />
                <stop offset="1" stopColor={xw.xLeft ? '#000' : '#FFF'} />
              </linearGradient>
              <linearGradient id={wgInvId} gradientUnits="userSpaceOnUse" x1={xw.front - WIPE_SOFT} y1={0} x2={xw.front + WIPE_SOFT} y2={0}>
                <stop offset="0" stopColor={xw.xLeft ? '#000' : '#FFF'} />
                <stop offset="1" stopColor={xw.xLeft ? '#FFF' : '#000'} />
              </linearGradient>
              <mask id={xMaskId} maskUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}><rect x={-300} y={-300} width={600} height={600} fill={`url(#${wgId})`} /></mask>
              <mask id={eMaskId} maskUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}><rect x={-300} y={-300} width={600} height={600} fill={`url(#${wgInvId})`} /></mask>
            </>
          )}
          {skinA < 0.999 && <clipPath id={finClip}><path d={`M-400 -400 H400 V400 H-400 Z ${BODY_PATH}`} clipRule="evenodd" /></clipPath>}
          <clipPath id={gapClip}><path d={gillGapPath(s)} transform={yawM(psi, CUT_Z)} /></clipPath>
        </defs>
        <FishShadow t={tv} c={c} xray={xr} />
        {showE && <g mask={eMaskRef}><g transform={yawM(psi, -5)}><FishFar s={s} /></g></g>}
        {/* ---- X-ray (below the eel): the radiograph flesh, gut and gas; then the skeleton, which the eel lies over */}
        {showX && <g mask={xMaskRef}><XRayBack s={s} /><XRayFront s={s} opacity={0.85} /></g>}
        {/* ---- the interior seen through the skin (frosted), and in the cutaway window (full colour, clipped to it) */}
        {showE && (
          <g mask={eMaskRef}>
            {revealA > 0.002 && <g opacity={revealA} filter={`url(#${frostId})`} transform={yawM(psi, CUT_Z)}><InteriorBack t={t} mode="reveal" /></g>}
            {cutOn && <g opacity={winA} transform={yawM(psi, 0)}><InteriorBack t={t} mode="cut" /></g>}
          </g>
        )}
        {inside && showX && (
          <g mask={xMaskRef}>
            {/* the contrast-dyed eel glows on the radiograph: a soft bright halo following its body (tapering with it) */}
            {haloSegs(P2, ex).map((sg, k) => (
              <path key={k} d={sg.d} fill="none" stroke={C.xrayBone} strokeWidth={sg.w} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} filter={`url(#${haloId})`} />
            ))}
          </g>
        )}
        {inside && ghosts.map((g, k) => {
          const eg = eelAt(t - g);
          if (eg.free) return null;
          return <Eel key={k} pts={eg.pts.map((q) => pt(q.x, q.y))} radii={RADII} px={px} t={t} to={Math.min(eg.exitIdx, N)} opacity={0.16 * (1 - k * 0.25)} />;
        })}
        {inner(0, Math.min(iSlit, N))}
        {showE && (
          <g mask={eMaskRef}>
            {revealA > 0.002 && <g opacity={revealA} transform={yawM(psi, CUT_Z)}><StomachFront t={t} mode="reveal" /></g>}
            {revealA * (1 - kc) > 0.002 && <g opacity={revealA * (1 - kc)} transform={yawM(psi, CUT_Z)}><GillArches t={t} mode="reveal" gill={f.gill} /></g>}
            {kc > 0.002 && <g opacity={kc} transform={yawM(psi, GILL_Z)}><GillArches t={t} mode="cut" gill={f.gill} /></g>}
          </g>
        )}
        {iSlit < ex && inner(iSlit, Math.min(ex, N))}
        {/* the skeleton faintly over the eel too, so it reads as inside the body without losing the eel */}
        {inside && showX && <g mask={xMaskRef}><XRayFront s={s} opacity={0.22} /></g>}
        {showE && (
          <g mask={eMaskRef}>
            <g transform={yawM(psi, CUT_Z)}>
              {skinA < 0.999 && <g clipPath={`url(#${finClip})`}><FishBody s={s} /></g>}
              <g opacity={skinA}><FishBody s={s} mask={mask} /></g>
              <g opacity={skinA}><GillGap s={s} /></g>
            </g>
            {inside && iGap < ex && <Eel {...eelProps} from={iGap} to={Math.min(ex, N)} clip={`url(#${gapClip})`} />}
            <g transform={yawM(psi, CUT_Z)}>
              <g opacity={skinA}><Operculum s={s} mask={mask} /></g>
              <g opacity={skinA}><Pectoral s={s} mask={mask} /></g>
              {cutOn && <CutEdge yaw={psi} opacity={winA} />}
            </g>
          </g>
        )}
        {!e.free && ex <= N && <Eel {...eelProps} from={ex} to={N} />}
        {e.free && <Eel {...eelProps} from={0} to={N} />}
      </Layer>
      <EnvFront c={c} t={tv} xray={xr} />
      {t > EV.release - 0.05 && t < EV.release + 1.0 && (
        <Layer c={c} z={0}><WaterRush at={pt(EXIT.x, EXIT.y)} dir={RUSH_DIR} t={t} t0={EV.release} /></Layer>
      )}
    </>
  );
};

// ---------------------------------------------------------------- the departing tail across the lens, and the loop
/** the tail section passing close in front of the lens (world points at its depth through the current camera): a long
 *  near-vertical band, head end above the frame, gently bowed, its centre line at screen x = sweepX(t) */
const lensTail = (t: number) => {
  const c = camAt(t);
  const z = -LENS.depth * DIST * c.w;
  const sc = layerScale(c, z); // px per unit at that depth
  const xs = sweepX(t);
  const u0 = 0.71; // the body coordinate at the frame's middle height: the tapering rear section crosses the frame
  const L = 54;
  const pts: P[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const yScr = SH / 2 + (u - u0) * L * sc; // body runs down the frame, tail tip far below
    // a gentle bow along the body and a lean opposite to the motion (the tail trails the stroke)
    const bow = 140 * Math.sin(Math.PI * (u - 0.2)) + 0.18 * (yScr - SH / 2);
    pts.push(pt(c.x + (xs + bow - 540) / sc, c.y + (yScr - SH / 2) / sc));
  }
  return {c, z, sc, pts};
};
const LensTail: React.FC<{t: number}> = ({t}) => {
  const {c, z, sc, pts} = lensTail(t);
  return (
    <Layer c={c} z={z} maxBlur={11}>
      <Eel pts={pts} radii={RADII} px={sc} t={t} from={20} to={N} dorsal={-1} />
    </Layer>
  );
};
/** the loop wipe: the region the tail has already crossed (right of its centre line), in screen space */
const wipePath = (t: number) => {
  if (t < SWEEP0) return null;
  const {c, sc, pts} = lensTail(t);
  const sp = pts.slice(20).map((q) => pt(540 + sc * (q.x - c.x), 960 + sc * (q.y - c.y)));
  const last = sp[sp.length - 1], first = sp[0];
  return 'M' + sp.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L') + ` L 4000 ${last.y.toFixed(1)} L 4000 -4000 L ${first.x.toFixed(1)} -4000 Z`;
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const wipe = wipePath(t);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <World t={t} />
      {wipe && (
        <div style={{position: 'absolute', inset: 0, clipPath: `path('${wipe}')`}}>
          <World t={t - DUR} />
        </div>
      )}
      {t >= SWEEP0 && <LensTail t={t} />}
      {captions && <Captions t={t} />}
    </div>
  );
};
void lerp;
