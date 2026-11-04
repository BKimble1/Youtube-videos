// One frame: the camera, the environment behind, the predator and the swallowed eel composed in depth order (with the
// translucent reveal, the X-ray and the three-quarter cutaway), the environment in front, the lens pass and the loop
// wipe back to frame 0, then captions in screen space.
import React from 'react';
import {resetIds, uid} from './core/ids';
import {open, P, pt} from './core/geo';
import {clamp, DUR, ss} from './lib';
import {DIST, Layer, layerScale, W as SW, H as SH} from './camera';
import {EXIT, GILL_Z} from './anatomy';
import {N, RADII, S_EXIT} from './eel';
import {camAt, eelAt, EV, fishAt, HEAD_CAUGHT, lensAt, SWEEP0} from './story';
import {FishBody, FishFar, FishLook, GillGap, gillGapPath, Operculum, Pectoral, propForRadius} from './art/fish';
import {XRayBack, XRayFront} from './art/xray';
import {CUT_Z, cutWindowPath, CutEdge, GillArches, InteriorBack, StomachFront} from './art/inside';
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
 *  it on X-ray") the X-ray is LEFT of the front; leaving (into the cutaway) the exterior is left of it. The ranges say
 *  which representation is present anywhere ([from, to) as a 0..1 share; empty when from >= to). */
const WIPE_SOFT = 5;
const xrayWipe = (t: number) => {
  const inA = EV.xray0, inB = EV.xray1, outA = EV.cut0 - 0.05, outB = EV.cut1 - 0.1;
  const fr = (u: number) => -58 + 116 * u;
  if (t < inA) return {wiping: false, front: 0, xLeft: true, xFrom: 0, xTo: 0, eFrom: 0, eTo: 1};
  if (t < inB) return {wiping: true, front: fr(ss(t, inA, inB)), xLeft: true, xFrom: 0, xTo: 1, eFrom: 0, eTo: 1};
  if (t < outA) return {wiping: false, front: 0, xLeft: true, xFrom: 0, xTo: 1, eFrom: 0, eTo: 0};
  if (t < outB) return {wiping: true, front: fr(ss(t, outA, outB)), xLeft: false, xFrom: 0, xTo: 1, eFrom: 0, eTo: 1};
  return {wiping: false, front: 0, xLeft: true, xFrom: 0, xTo: 0, eFrom: 0, eTo: 1};
};

/** the X-ray halo along the inside part of the eel, in a few segments whose width follows the body's taper */
const haloSegs = (P2: P[], ex: number) => {
  const end = Math.min(ex, N);
  const out: {d: string; w: number}[] = [];
  const step = 12;
  for (let i = 0; i < end; i += step) {
    const j = Math.min(end, i + step + 1);
    if (j - i < 2) break;
    const r = RADII[Math.min(N, Math.round((i + j) / 2))];
    out.push({d: open(P2.slice(i, j + 1), 0.5), w: 2 * r + 1.3});
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
  // the eye glances back toward the gill while the head is caught, and after the release
  const look = 0.85 * ss(t, EV.headAt - 0.3, EV.headAt + 0.35) * (1 - ss(t, EV.release + 0.9, EV.release + 1.6));
  return {t, gill: f.gill, finPhase: f.finPhase, startle: f.startle, prop, look};
};

/** everything below the captions, for time t (also used for the loop's frame-0 overlay at t - DUR) */
const World: React.FC<{t: number; overlay?: boolean}> = ({t}) => {
  const c = camAt(t);
  const f = fishAt(t);
  const e = eelAt(t);
  const s = lookAt(t);
  const px = layerScale(c, 0);
  const psi = f.yaw;
  const cs = Math.cos(psi), sn = Math.sin(psi);
  // the eel projected through the yaw (each sample at its own depth)
  const P2: P[] = e.pts.map((q) => pt(X0 + (q.x - X0) * cs + q.z * sn, q.y));
  const lens = e.free ? lensAt(t) : 0;

  // ---- the X-ray arrives as a soft wipe along the same outline (head to tail), and leaves the same way into the cutaway
  const xw = xrayWipe(t);
  const xr = f.xray; // the environment's darkness crossfades on the same timing
  const showX = xw.xFrom < xw.xTo; // some part of the fish is X-ray
  const showE = xw.eFrom < xw.eTo; // some part of the fish is exterior / translucent illustration
  const interior = clamp(Math.max(0.85 * f.translucent, f.cut));
  const skinA = clamp(1 - 0.5 * f.translucent);
  // ---- the exterior's mask: soft holes along the eel's inner path (the reveal) and the cutaway window
  const mId = uid('skinmask');
  const blurId = uid('skinblur');
  const holeIdx = e.sig.map((sg, i) => ({sg, i})).filter((o) => o.sg >= f.revealSig - 0.01 && o.sg <= S_EXIT + 0.5).map((o) => o.i);
  const holePath = holeIdx.length > 1 ? open(holeIdx.map((i) => P2[i]), 0.5) : '';
  const needMask = f.reveal > 0.002 || f.cut > 0.002;
  const mask = needMask ? mId : undefined;
  // ---- eel sections
  const ex = Math.min(e.exitIdx, N + 1);
  const inside = !e.free && ex > 0;
  // in the cutaway, split the inside part at the gill plane: behind the arches, then in front of them
  let iSlit = ex;
  if (f.cut > 0.001 || f.translucent > 0.001) {
    iSlit = 0;
    while (iSlit < ex && e.pts[iSlit].z < GILL_Z) iSlit++;
  }
  // the near-exit section seen in the gill opening (within ~3.2 u of the exit)
  let iGap = ex;
  while (iGap > 0 && e.sig[iGap - 1] > S_EXIT - 3.2) iGap--;
  const gapClip = uid('gapclip');
  const haloId = uid('halo');
  const wgId = uid('wg'), wgInvId = uid('wgi'), xMaskId = uid('xmask'), eMaskId = uid('emask');
  const xMaskRef = xw.wiping ? `url(#${xMaskId})` : undefined;
  const eMaskRef = xw.wiping ? `url(#${eMaskId})` : undefined;
  // after the release the swimmer rolls over so its dark back is up as it swims away
  const dorsal = 1 - 2 * ss(t, EV.release + 0.07, EV.release + 0.62);
  const eelProps = {pts: P2, radii: RADII, px, t, dorsal};
  const ghosts = t > EV.rew0 && t < EV.rew1 ? [0.05, 0.1, 0.15] : [];

  return (
    <>
      <EnvBack c={c} t={t} xray={xr} />
      <Layer c={c} z={0}>
        <defs>
          {needMask && (
            <>
              <filter id={blurId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}><feGaussianBlur stdDeviation={1.4} /></filter>
              <mask id={mId} maskUnits="userSpaceOnUse" x={-200} y={-200} width={400} height={400}>
                <rect x={-200} y={-200} width={400} height={400} fill="#FFF" />
                {holePath && f.reveal > 0.002 && <path d={holePath} stroke="#000" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.82 * f.reveal} filter={`url(#${blurId})`} />}
                {f.cut > 0.002 && <path d={cutWindowPath(f.cut)} fill="#000" />}
              </mask>
            </>
          )}
          <filter id={haloId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}><feGaussianBlur stdDeviation={0.45} /></filter>
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
          <clipPath id={gapClip}><path d={gillGapPath(s)} transform={yawM(psi, CUT_Z)} /></clipPath>
        </defs>
        <FishShadow t={t} c={c} xray={xr} />
        {showE && <g mask={eMaskRef}><g transform={yawM(psi, -5)}><FishFar s={s} /></g></g>}
        {showX && <g mask={xMaskRef}><XRayBack s={s} /></g>}
        <g mask={eMaskRef}>
        {showE && interior > 0.002 && <g opacity={interior} transform={yawM(psi, 0)}><InteriorBack t={t} mode={f.cut > 0.5 ? 'cut' : 'reveal'} /></g>}
        </g>
        {inside && ghosts.map((g, k) => {
          const eg = eelAt(t - g);
          if (eg.free) return null;
          return <Eel key={k} pts={eg.pts.map((q) => pt(q.x, q.y))} radii={RADII} px={px} t={t} to={Math.min(eg.exitIdx, N)} opacity={0.16 * (1 - k * 0.25)} />;
        })}
        {inside && showX && (
          <g mask={xMaskRef}>
            {/* the contrast-dyed eel glows on the radiograph: a soft bright halo following its body (tapering with it) */}
            {haloSegs(P2, ex).map((sg, k) => (
              <path key={k} d={sg.d} fill="none" stroke={C.xrayBone} strokeWidth={sg.w} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} filter={`url(#${haloId})`} />
            ))}
          </g>
        )}
        {inside && <Eel {...eelProps} from={0} to={Math.min(iSlit, N)} />}
        <g mask={eMaskRef}>
        {showE && interior > 0.002 && <g opacity={interior} transform={yawM(psi, 0.5)}><StomachFront t={t} mode={f.cut > 0.5 ? 'cut' : 'reveal'} /></g>}
        {showE && interior > 0.002 && <g opacity={interior} transform={yawM(psi, GILL_Z)}><GillArches t={t} mode={f.cut > 0.5 ? 'cut' : 'reveal'} gill={f.gill} /></g>}
        </g>
        {inside && iSlit < ex && <Eel {...eelProps} from={iSlit} to={Math.min(ex, N)} />}
        {showE && (
          <g mask={eMaskRef}>
            <g transform={yawM(psi, CUT_Z)}>
              <g opacity={skinA}><FishBody s={s} mask={mask} /></g>
              <g opacity={skinA}><GillGap s={s} /></g>
            </g>
            {inside && iGap < ex && skinA > 0.99 && <Eel {...eelProps} from={iGap} to={Math.min(ex, N)} clip={`url(#${gapClip})`} />}
            <g transform={yawM(psi, CUT_Z)}>
              <g opacity={skinA}><Operculum s={s} mask={mask} /></g>
              <g opacity={skinA}><Pectoral s={s} mask={mask} /></g>
              {f.cut > 0.002 && <CutEdge yaw={psi} open={f.cut} />}
            </g>
          </g>
        )}
        {showX && <g mask={xMaskRef}><XRayFront s={s} opacity={0.9} /></g>}
        {!e.free && ex <= N && <Eel {...eelProps} from={ex} to={N} />}
        {e.free && lens < 0.001 && <Eel {...eelProps} from={0} to={N} />}
      </Layer>
      <EnvFront c={c} t={t} xray={xr} />
      {t > EV.release - 0.05 && t < EV.release + 1.0 && (
        <Layer c={c} z={0}><WaterRush at={pt(EXIT.x, EXIT.y)} dir={RUSH_DIR} t={t} t0={EV.release} /></Layer>
      )}
      {e.free && lens >= 0.001 && (
        <Layer c={c} z={-lens * DIST * c.w} maxBlur={26}>
          <Eel {...eelProps} px={layerScale(c, -lens * DIST * c.w)} from={0} to={N} />
        </Layer>
      )}
    </>
  );
};

/** the loop wipe: the region the departing tail has already crossed (right of its centre line), in screen space */
const wipePath = (t: number) => {
  if (t < SWEEP0 - 0.02) return null;
  const c = camAt(t), e = eelAt(t);
  if (!e.free) return null;
  const s = layerScale(c, -lensAt(t) * DIST * c.w);
  const sp = e.pts.map((q) => pt(SW / 2 + s * (q.x - c.x), SH / 2 + s * (q.y - c.y)));
  const tail = sp.slice(Math.round(sp.length * 0.25));
  const last = tail[tail.length - 1], first = tail[0];
  return 'M' + tail.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L') + ` L 4000 ${last.y.toFixed(1)} L 4000 -4000 L ${first.x.toFixed(1)} -4000 Z`;
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const wipe = wipePath(t);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <World t={t} />
      {wipe && (
        <div style={{position: 'absolute', inset: 0, clipPath: `path('${wipe}')`}}>
          <World t={t - DUR} overlay />
        </div>
      )}
      {wipe && <LensEelOnTop t={t} />}
      {captions && <Captions t={t} />}
    </div>
  );
};

/** the lens-pass eel redrawn above the frame-0 overlay (it is the wipe's edge) */
const LensEelOnTop: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t), e = eelAt(t);
  const z = -lensAt(t) * DIST * c.w;
  return (
    <Layer c={c} z={z} maxBlur={26}>
      <Eel pts={e.pts.map((q) => pt(q.x, q.y))} radii={RADII} px={layerScale(c, z)} t={t} from={0} to={N} dorsal={-1} />
    </Layer>
  );
};
void HEAD_CAUGHT;
