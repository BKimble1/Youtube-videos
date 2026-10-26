// V4 beat F: local light drawn over View3 (a copy of v3/Demo3_fx.tsx, retuned for F's closer and wider views; V3 keeps
// its own). Screen-blended, from the same 3D model, so it stays attached as the camera moves. Nothing here is text, a
// badge or a diagram: it is light on the objects already in the shot. Changes from V3:
//   - the haze's extra body (macro) is sized by how wide the channel already is on screen: a little under half in the
//     close view of the tip, where the physical 3 m channel is already a broad band, full in the wides where it is a
//     thin line;
//   - the field at the rod tip (corona glow and streamers) is capped in screen size, so in the close view it reads as
//     short corona sparks at the tip rather than a large spark bush (View3's own TipCorona3 disc is not used in F).
//   DemoHaze  the prepared air (replaces Beam3D's haze in F): the same ribbon, PAL.channelMacro at 0.34 x 0.85, but its
//             width keeps shrinking through F's zoom-out from Z_HAND (Beam3D clamps it at 260 px, which would hold
//             the channel's width still for the first frames of the pull-out); identical to Beam3D's at Z = 1.
//   DemoFx    the cyan path made readable round the tip and the guided section; the field building at the rod tip
//             before the leader incepts; the guided section strengthened once the bolt connects and held as the
//             brightest part of the afterglow ("part of the bolt followed that CHANNEL"), with one surge running up
//             it on "followed", and from then on the cyan path showing as a soft cyan edge on both sides of its
//             white core (it hugs the line); the cloud base lit locally where the bolt meets it.
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {axis3, BOLT3, Cam3, projector, Proj, TIP3, V3} from '../v2/p3';
import {G} from '../world/site';
import {P0_H, Z_HAND} from '../v3/cams3';
import {BOLT3V} from '../v3/bolt3';
import {PAL} from '../v3/palette';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
/** a projected polyline as short runs whose width follows depth (as Scene3's strokeRuns) */
export const runs = (P: (p: V3) => Proj, pts: V3[], wM: number, f: number, minW: number, maxW: number, step = 4) => {
  const out: {d: string; w: number}[] = [];
  const pp = pts.map(P);
  for (let i = 0; i + 1 < pp.length; i += step) {
    const seg = pp.slice(i, Math.min(pp.length, i + step + 1)).filter((q) => q.ok);
    if (seg.length < 2) continue;
    const z = seg[Math.floor(seg.length / 2)].z;
    out.push({d: line(seg), w: clamp((f * wM) / Math.max(z, 0.5), minW, maxW)});
  }
  return out;
};
/** a closed ribbon along a projected polyline, half-width w(p) per point */
const ribbon = (pp: Proj[], w: (p: Proj) => number) => {
  const q = pp.filter((p) => p.ok);
  if (q.length < 2) return '';
  const L: Pt[] = [], R: Pt[] = [];
  q.forEach((p, i) => {
    const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
    const h = w(p);
    L.push({x: p.x - (dy / n) * h, y: p.y + (dx / n) * h});
    R.push({x: p.x + (dy / n) * h, y: p.y - (dx / n) * h});
  });
  return `${line([...L, ...R.reverse()])} Z`;
};

// ------------------------------------------------------------------ the prepared air
const CH_TOP = 360; // Beam3D's default channelTop (G + 60)
const CH: V3[] = Array.from({length: 40}, (_, i) => axis3(-6 + ((CH_TOP + 6) * i) / 39));
const P0_3 = axis3(P0_H);
/** the width law: Beam3D's (f * 3 / z, clamped 6..260 px) at Z = 1; through the zoom the natural width n (at Z = 1)
 *  grows as Z^p, with p chosen so that P0's width reaches exactly Beam3D's 260 px cap at Z_HAND: the channel narrows
 *  smoothly from the first frame of the pull-out instead of holding at the cap */
export const DemoHaze4: React.FC<{cam: Cam3; Z: number; a: number; macro: number; id: string}> = ({cam, Z, a, macro, id}) => {
  if (a <= 0.002) return null;
  const P = projector(cam);
  const f0 = cam.f / Z; // the main view's focal length
  const n0 = (f0 * 3) / Math.max(P(P0_3).z, 0.5);
  const pw = n0 < 260 ? Math.log(260 / n0) / Math.log(Z_HAND) : 1;
  const g = Math.pow(Z, pw);
  const pp = CH.map(P);
  const d = ribbon(pp, (p) => clamp(((f0 * 3) / Math.max(p.z, 0.5)) * g, 6, 260) / 2);
  // the body is needed only where the channel is thin on screen (its width at the axis point nearest the frame centre)
  const wNow = (() => {
    let best = pp[0], bd = 1e9;
    for (const p of pp) {
      const dd = Math.hypot(p.x - 540, p.y - 960);
      if (p.ok && dd < bd) { bd = dd; best = p; }
    }
    return clamp(((f0 * 3) / Math.max(best.z, 0.5)) * g, 6, 260);
  })();
  const mk = macro * (0.45 + 0.55 * clamp((75 - wNow) / 45));
  // in the main view the thin macro channel needs a little more body to read on a phone (as the opening's OpenFx):
  // a wider soft ribbon and a narrow warmer core, in only once the zoom-out has resolved (macro: 0..1)
  const body = mk > 0.01 ? ribbon(pp, (p) => clamp((cam.f * 3.6) / Math.max(p.z, 0.5), 14, 240) / 2) : '';
  const core = mk > 0.01 ? ribbon(pp, (p) => clamp((cam.f * 1.2) / Math.max(p.z, 0.5), 5, 90) / 2) : '';
  // the band's top end tapers away softly round the point where the guidance ends (G), under the bolt's glow, instead of
  // ending in a round blur beside the bolt's departure, which read as a stray orange spot (V4 review F4-6)
  const tA = P(axis3(G - 40)), tB = P(axis3(G + 18));
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-cb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(cam.f / 70, 5, 22))} />
        </filter>
        <filter id={`${id}-mb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(cam.f / 85, 4, 20))} />
        </filter>
        {tA.ok && tB.ok && (
          <linearGradient id={`${id}-tg`} gradientUnits="userSpaceOnUse" x1={fmt(tA.x)} y1={fmt(tA.y)} x2={fmt(tB.x)} y2={fmt(tB.y)}>
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.55} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        )}
        {tA.ok && tB.ok && (
          <mask id={`${id}-tm`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
            <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${id}-tg)`} />
          </mask>
        )}
      </defs>
      <g mask={tA.ok && tB.ok ? `url(#${id}-tm)` : undefined}>
        <path d={d} fill={PAL.channelMacro} fillOpacity={0.34 * a} filter={`url(#${id}-cb)`} />
        {body && <path d={body} fill={PAL.channelMacro} fillOpacity={fmt(0.34 * mk)} filter={`url(#${id}-mb)`} />}
        {core && <path d={core} fill={PAL.channelEdge} fillOpacity={fmt(0.12 * mk)} filter={`url(#${id}-mb)`} />}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the emphasis
const BEAM_PTS: V3[] = Array.from({length: 61}, (_, i) => axis3(-520 + (1520 * i) / 60));
const GUIDED = BOLT3.pts.filter((p) => p.s <= BOLT3.guidedS);
export type Fx = {
  glow: number; // the cyan path's readability glow (0..1)
  corona: number; // the field at the rod tip before inception (0..1, smooth envelope)
  coronaFlick: number; // its streamers' flicker strength (0..1)
  sG: number; // how much of the guided section the leader has covered (m)
  guided: number; // the guided section's extra light (0..1.2)
  surge: number; // the surge's head as a fraction of the guided section (<0 or >1.6: none)
  surgeA: number;
  lit: number; // the cloud base lit where the bolt meets it (0..1)
  rim: number; // the cyan path showing alongside the guided section (0..1)
};
export const DemoFx4: React.FC<{cam: Cam3; t: number; fx: Fx; id: string}> = ({cam, t, fx, id}) => {
  const P = projector(cam);
  const f = cam.f;
  // the cyan path: a soft glow either side of the thin line
  const glowW = fx.glow > 0.01 ? runs(P, BEAM_PTS, 1.5, f, 6, 30, 3) : [];
  const glowN = fx.glow > 0.01 ? runs(P, BEAM_PTS, 0.55, f, 3, 12, 3) : [];
  // the guided section the leader has covered: halo, mid and core strokes on top of the discharge
  const gPts = fx.sG > 1.5 ? GUIDED.filter((p) => p.s <= fx.sG) : [];
  const gHalo = fx.guided > 0.01 ? runs(P, gPts, 6.5, f, 10, 90, 4) : [];
  const gMid = fx.guided > 0.01 ? runs(P, gPts, 2.2, f, 4, 30, 4) : [];
  const gCore = fx.guided > 0.01 ? runs(P, gPts, 0.85, f, 2.2, 12, 4) : [];
  // the cyan path alongside the guided section: a soft cyan sheath on the straight beam axis, a little wider than the
  // white core and its violet edge, so the line the bolt follows shows on both sides of it (drawn under the guided
  // mid and core and screened onto the bolt, so the white core stays white and only its edge and the air beside it
  // take the cyan)
  const hG = G * clamp(fx.sG / BOLT3.guidedS);
  const rimPts = fx.rim > 0.01 && hG > 4 ? Array.from({length: 31}, (_, i) => axis3(-2 + ((hG + 2) * i) / 30)) : [];
  const rimW = rimPts.length ? runs(P, rimPts, 3.6, f, 8, 46, 3) : [];
  const rimN = rimPts.length ? runs(P, rimPts, 2.6, f, 5, 34, 3) : [];
  // the surge: a bright band running up the guided section from the tip
  const sPts = fx.surgeA > 0.01 && fx.surge > -0.4 && fx.surge < 1.6 ? (() => {
    const head = Math.min(1, fx.surge) * BOLT3.guidedS, tail = head - 0.45 * BOLT3.guidedS;
    return GUIDED.filter((p) => p.s >= tail && p.s <= head);
  })() : [];
  // the storm lit where the bolt meets the cloud
  const top = P(BOLT3V.pts[BOLT3V.pts.length - 1]);
  const rTop = clamp((f * 62) / Math.max(top.z, 1), 160, 230); // round, edge-free (the shaped cloud light is Scene3 Clouds)
  // the field at the rod tip: a violet glow and a few short streamers reaching up the prepared path
  const tip = P(TIP3), up = P(axis3(40));
  const rC = clamp((f * 6.5) / Math.max(tip.z, 1), 28, 95);
  const aUp = Math.atan2(up.y - tip.y, up.x - tip.x);
  const cK = fx.corona;
  // each streamer grows out along one fixed jagged path and retracts (a cycle of about 0.3-0.4 s, a new path and lean
  // each cycle, the four out of step, now and then one skipped), so the corona builds rather than being redrawn as a
  // new claw of strokes every frame (V4 review F4-5)
  const streamers = cK > 0.02 && fx.coronaFlick > 0.02 ? [0, 1, 2, 3].map((i) => {
    const c = t * (2.6 + 0.25 * i) + hash(i, 171);
    const n = Math.floor(c), ph = c - n, key = n * 7 + i;
    if (hash(key, 163) < 0.18) return '';
    const life = Math.pow(Math.sin(Math.PI * ph), 0.8);
    if (life < 0.06) return '';
    const a = aUp + (i - 1.5) * 0.26 + 0.24 * (hash(key, 161) - 0.5);
    const L = rC * (0.6 + 0.8 * cK) * (0.8 + 0.35 * hash(key, 165)) * life;
    const pts: Pt[] = [{x: tip.x, y: tip.y}];
    for (let m = 1; m <= 4; m++) {
      const d = (L * m) / 4, j = 0.24 * L * (hash(key * 5 + m, 167) - 0.5);
      pts.push({x: tip.x + Math.cos(a) * d - Math.sin(a) * j, y: tip.y + Math.sin(a) * d + Math.cos(a) * j});
    }
    return line(pts);
  }).filter(Boolean) : [];
  const flick = 0.8 + 0.2 * noise1(t * 26, 169);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-gb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 110, 4, 16))} />
        </filter>
        <filter id={`${id}-rb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 320, 2, 8))} />
        </filter>
        <radialGradient id={`${id}-cor`}>
          <stop offset="0" stopColor="#F2EEFF" stopOpacity={0.9} />
          <stop offset="0.3" stopColor={PAL.mid} stopOpacity={0.45} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-lit`} gradientUnits="userSpaceOnUse" cx={fmt(top.x)} cy={fmt(top.y)} r={fmt(rTop)}>
          <stop offset="0" stopColor="#E4E8FF" stopOpacity={0.5} />
          <stop offset="0.35" stopColor={PAL.mid} stopOpacity={0.26} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {fx.lit > 0.01 && top.ok && <ellipse cx={fmt(top.x)} cy={fmt(top.y)} rx={fmt(rTop)} ry={fmt(rTop)} fill={`url(#${id}-lit)`} opacity={fmt(fx.lit)} />}
      {glowW.map((r, i) => <path key={`w${i}`} d={r.d} fill="none" stroke={PAL.laserGlow} strokeOpacity={fmt(0.1 * fx.glow)} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
      {glowN.map((r, i) => <path key={`n${i}`} d={r.d} fill="none" stroke={PAL.laser} strokeOpacity={fmt(0.16 * fx.glow)} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
      {cK > 0.02 && tip.ok && (
        <g>
          <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(rC)} fill={`url(#${id}-cor)`} opacity={fmt(clamp((0.35 + 0.65 * cK) * cK * flick))} />
          {streamers.length > 0 && (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={streamers.join(' ')} stroke={PAL.mid} strokeOpacity={fmt(clamp(0.3 * cK * fx.coronaFlick))} strokeWidth={fmt(3 * clamp((f * 0.12) / Math.max(tip.z, 1), 1.4, 3.6))} />
              <path d={streamers.join(' ')} stroke="#E6E0FF" strokeOpacity={fmt(clamp(0.8 * cK * fx.coronaFlick))} strokeWidth={fmt(clamp((f * 0.12) / Math.max(tip.z, 1), 1.4, 3.6))} />
            </g>
          )}
        </g>
      )}
      {fx.guided > 0.01 && gPts.length > 1 && (
        <g>
          <g filter={`url(#${id}-gb)`} opacity={fmt(0.3 * Math.min(1, fx.guided))}>
            {gHalo.map((r, i) => <path key={`h${i}`} d={r.d} fill="none" stroke={PAL.halo} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
          </g>
          {rimW.length > 0 && (
            <g filter={`url(#${id}-rb)`}>
              {rimW.map((r, i) => <path key={`rw${i}`} d={r.d} fill="none" stroke={PAL.laserGlow} strokeOpacity={fmt(0.5 * fx.rim)} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
              {rimN.map((r, i) => <path key={`rn${i}`} d={r.d} fill="none" stroke={PAL.laser} strokeOpacity={fmt(0.24 * fx.rim)} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
            </g>
          )}
          {gMid.map((r, i) => <path key={`m${i}`} d={r.d} fill="none" stroke={PAL.mid} strokeOpacity={fmt(0.45 * Math.min(1, fx.guided))} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
          {gCore.map((r, i) => <path key={`c${i}`} d={r.d} fill="none" stroke={PAL.core} strokeOpacity={fmt(Math.min(1, 0.85 * fx.guided))} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
        </g>
      )}
      {sPts.length > 1 && (
        <g opacity={fmt(clamp(fx.surgeA))}>
          <g filter={`url(#${id}-gb)`} opacity={0.55}>
            {runs(P, sPts, 7, f, 12, 110, 3).map((r, i) => <path key={i} d={r.d} fill="none" stroke={PAL.mid} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
          </g>
          {runs(P, sPts, 1.6, f, 3.5, 22, 3).map((r, i) => <path key={`c${i}`} d={r.d} fill="none" stroke={PAL.core} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
        </g>
      )}
    </g>
  );
};
