// FGW "This Shield Can Make You Disappear." V4: a 2D / 2.5D vector rebuild in the Weird Crew construction.
// Each frame: the corridor planes, the two Crew cards (depth sorted, distance haze), the panel with its optics
// (the smear of whatever is behind it, from this camera), the flashlight beam and its pool, then captions.
// The only typography is the narration captions.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {CapV2} from '../v2/CaptionsV2';
import {BODY_G, BODY_P, GUARD, INK, PERSON} from './cast5';
import {Crew4, HandArt, joints4} from './Crew5';
import {Corridor4, fogAt, NIGHT} from './Corridor5';
import {add3, basis, Card, cardOf, cardToWorld, dot3, inkW, mul3, norm3, proj, sub3, U, V3, v3, yawV} from './geo5';
import {LAY} from './layout5';
import {beamPoly, SH, Shield4, shieldFacing} from './Shield5';
import {camAt, guardAt, herAt, PULL, PUSH, shotAt, ss} from './story5';
import {LensDemo, DEMO} from './LensDemo5';
import {Clip4, ClipLayer} from './Clips5';

const FPS = 30;
const CAP_Y: Record<string, number> = {cuffs: 1560, gLow: 1600, gPush: 1600, gCU2: 1600, herCU: 1600, herCU2: 1600, giggle: 1600, demo: 1560, track: 1560, edgeFG: 1560};

const Torch: React.FC<{ol: number; on: number}> = ({ol, on}) => (
  <g>
    <rect x={-9} y={-26} width={18} height={62} rx={6} fill="#3A4650" stroke={INK} strokeWidth={ol} />
    <rect x={-13} y={30} width={26} height={20} rx={5} fill="#56646E" stroke={INK} strokeWidth={ol} />
    <ellipse cx={0} cy={50} rx={11} ry={4} fill={on ? '#FFF1C4' : '#9AA'} stroke={INK} strokeWidth={ol * 0.6} />
  </g>
);
const Cuffs: React.FC<{ol: number; open: number}> = ({ol, open}) => (
  <g transform="translate(0 26)">
    <circle cx={-16} cy={14} r={15} fill="none" stroke={INK} strokeWidth={9 + ol} />
    <circle cx={-16} cy={14} r={15} fill="none" stroke="#C9D3D8" strokeWidth={7} />
    <path d="M -2 10 L 8 10" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <g transform={`rotate(${-50 * open} 22 10)`}>
      <circle cx={22} cy={22} r={15} fill="none" stroke={INK} strokeWidth={9 + ol} strokeDasharray={open > 0.05 ? '70 30' : undefined} />
      <circle cx={22} cy={22} r={15} fill="none" stroke="#C9D3D8" strokeWidth={7} strokeDasharray={open > 0.05 ? '70 30' : undefined} />
    </g>
  </g>
);

/** fog filter for a card at a distance (colour mixed toward the night air, alpha untouched) */
const fogFilter = (id: string, k: number) => {
  const c = [10, 21, 27].map((v) => v / 255);
  const a = 1 - k;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${a} 0 0 0 ${c[0] * k}  0 ${a} 0 0 ${c[1] * k}  0 0 ${a} 0 ${c[2] * k}  0 0 0 1 0`} />
    </filter>
  );
};

export const SceneV5: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const shot = shotAt(t);
  const cam = camAt(t);
  const b = basis(cam);
  const her = herAt(t), gd = guardAt(t);
  const cdW = cardOf(b, her.g, her.h), cdG = cardOf(b, gd.g, gd.h, 1);
  if (shot.id === 'cuffs') return <CuffsInsert t={t} captions={captions} />;
  if (shot.id === 'demo') return (
    <AbsoluteFill style={{backgroundColor: NIGHT.fog}}>
      <LensDemo t={t} />
      {captions && <CapV2 t={t} cy={CAP_Y.demo} />}
    </AbsoluteFill>
  );
  // ---- guard joints in the world (torch)
  const jG = joints4(BODY_G, gd.pose);
  const wristG = cardToWorld(gd.g, gd.h, jG.WL), elbowG = cardToWorld(gd.g, gd.h, jG.EL);
  const tdir = norm3(sub3(wristG, elbowG));
  const lensO = add3(wristG, mul3(tdir, 50 / U));
  // ---- panel in the world
  const shW = her.sh!;
  const pc = cardToWorld(her.g, her.h, shW.c);
  const nLocal = v3(shW.ua.y * shW.va.z - shW.ua.z * shW.va.y, shW.ua.z * shW.va.x - shW.ua.x * shW.va.z, shW.ua.x * shW.va.y - shW.ua.y * shW.va.x);
  const nW = yawV(nLocal, her.h);
  const side = (p: V3) => dot3(sub3(p, pc), nW);
  const camSide = side(cam.pos);
  const panelDepth = proj(b, pc).z;
  // who is behind the panel, from this camera
  const herC = cardToWorld(her.g, her.h, v3(0, her.pose.pel.y + 80, her.pose.pel.z));
  const gC = cardToWorld(gd.g, gd.h, v3(0, gd.pose.pel.y + 90, 0));
  const herBehind = Math.sign(side(herC)) !== Math.sign(camSide);
  const gBehind = Math.sign(side(gC)) !== Math.sign(camSide) && Math.abs(side(gC)) < 6;
  const fc = shieldFacing(cdW, shW);
  const lensOn = Math.abs(fc.d) > 0.18;
  const subj = herBehind ? '#w4' : gBehind ? '#g4' : null;
  const subjDist = herBehind ? Math.abs(side(herC)) : gBehind ? Math.abs(side(gC)) : 1;
  // the macro: ribs resolve as the panel fills the frame
  const ribPx = (cam.f * (SH.w - 2 * SH.rim) / SH.ribs / U) / Math.max(panelDepth, 0.1);
  const macro = shot.id === 'push' || shot.id === 'pull' ? ss(ribPx, 34, 90) : 0;
  const lens = lensOn ? {bgHref: '#corr4', subjHref: subj, camToPanel: Math.max(0.3, panelDepth), herBehind: subjDist, f: cam.f, macro, ribAlpha: 1} : null;
  // ---- beam
  const toPanel = sub3(pc, lensO);
  const den = dot3(tdir, nW);
  let hitLen = 7;
  let glint = 0;
  if (Math.abs(den) > 1e-3) {
    const tt = dot3(toPanel, nW) / den;
    if (tt > 0) {
      const hp = add3(lensO, mul3(tdir, tt));
      const rel = sub3(hp, pc);
      const ua = yawV(shW.ua, her.h), va = yawV(shW.va, her.h);
      if (Math.abs(dot3(rel, ua)) < SH.w / 2 / U && Math.abs(dot3(rel, va)) < SH.h / 2 / U) {
        hitLen = tt;
        glint = Math.sign(camSide) === Math.sign(-den) ? 0.9 : 0.3;
      }
    }
  }
  // floor / walls
  if (tdir.y < -0.02) hitLen = Math.min(hitLen, -lensO.y / tdir.y);
  if (Math.abs(tdir.x) > 1e-3) hitLen = Math.min(hitLen, ((Math.sign(tdir.x) * LAY.halfW) - lensO.x) / tdir.x);
  const beamOn = 1;
  const bp = beamPoly(b, lensO, tdir, Math.max(0.3, hitLen), 13);
  const hitP = add3(lensO, mul3(tdir, hitLen));
  const hitS = proj(b, hitP);
  const hitR = (cam.f * hitLen * Math.tan((13 * Math.PI) / 180)) / Math.max(0.2, hitS.z);
  const lensS = proj(b, lensO);
  // a beam pointed at the lens reads as a flare, never as a cone that fills the frame
  const toCam = norm3(sub3(cam.pos, lensO));
  const atCam = dot3(tdir, toCam);
  const coneK = Math.max(0, Math.min(1, (0.8 - atCam) / 0.35));
  const flareK = Math.max(0, Math.min(1, (atCam - 0.35) / 0.4));
  // dust drifting in the beam (the only ambient motion added: it is there because the light is)
  const e1 = norm3(Math.abs(tdir.y) < 0.9 ? v3(tdir.z, 0, -tdir.x) : v3(1, 0, 0));
  const e2 = norm3(v3(tdir.y * e1.z - tdir.z * e1.y, tdir.z * e1.x - tdir.x * e1.z, tdir.x * e1.y - tdir.y * e1.x));
  const dust = Array.from({length: 22}).map((_, i) => {
    const s0 = ((i * 0.618 + t * 0.07) % 1) * 0.92 + 0.05;
    const a = i * 2.39996 + t * 0.4 * ((i % 3) - 1);
    const r = Math.sqrt(((i * 0.37) % 1)) * Math.tan((12 * Math.PI) / 180) * hitLen * s0;
    const p = add3(add3(add3(lensO, mul3(tdir, hitLen * s0)), mul3(e1, Math.cos(a) * r)), add3(mul3(e2, Math.sin(a) * r), v3(0, 0.02 * Math.sin(t * 1.3 + i), 0)));
    const q = proj(b, p);
    return {x: q.x, y: q.y, z: q.z, o: (1 - s0) * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))};
  });
  // ---- cards
  const fogW = fogAt(cdW.depth), fogG = fogAt(cdG.depth);
  const olG = inkW(cdG.k);
  const torchNode = <Torch ol={olG / cdG.k} on={beamOn} />;
  const cuffsNode = gd.cuffs ? <Cuffs ol={olG / cdG.k} open={0} /> : null;
  const panelNode = (
    <Shield4 id="sh4" cd={cdW} s={shW} lens={lens} glint={glint * beamOn} />
  );
  const pBefore = panelDepth > cdW.depth + 0.06;
  const pAfter = panelDepth < cdW.depth - 0.06;
  const herNode = (
    <g id="w4" filter={fogW > 0.03 ? 'url(#fogW)' : undefined}>
      <Crew4 id="w" look={PERSON} b={BODY_P} pose={her.pose} cd={cdW} t={t} behind={pBefore ? undefined : undefined} between={!pBefore && !pAfter ? panelNode : undefined} />
    </g>
  );
  const povShot = shot.id === 'push' || shot.id === 'pull' || shot.id === 'otsHand' || shot.id === 'otsHand2';
  const guardVisible = cdG.depth > 0.32 && !povShot;
  const guardNode = guardVisible ? (
    <g id="g4" filter={fogG > 0.03 ? 'url(#fogG)' : undefined}>
      <Crew4 id="g" look={GUARD} b={BODY_G} pose={gd.pose} cd={cdG} t={t} holdL={torchNode} holdR={cuffsNode} />
    </g>
  ) : null;
  type It = {d: number; n: React.ReactNode};
  const items: It[] = [];
  if (cdW.depth > 0.2) items.push({d: cdW.depth, n: <g key="w">{pBefore && panelNode}{herNode}{pAfter && panelNode}</g>});
  if (guardNode) items.push({d: cdG.depth, n: <g key="g">{guardNode}</g>});
  items.sort((a, c) => c.d - a.d);
  // first-person arm in the guard's POV shots (his left forearm, hand and flashlight)
  const pov = povShot;
  let povArm: React.ReactNode = null;
  if (pov || !guardVisible) {
    const fade = shot.id === 'push' ? 1 - ss(t, PUSH.push0, PUSH.push0 + 0.45) : shot.id === 'pull' ? ss(t, PULL.t1 - 0.35, PULL.t1) : 1;
    const arms = [
      {w: wristG, e: elbowG, shape: 'grip' as const, torch: true, splay: 0.5},
      {w: cardToWorld(gd.g, gd.h, jG.WR), e: cardToWorld(gd.g, gd.h, jG.ER), shape: (gd.pose.armR.shape ?? 'mitt'), torch: false, splay: gd.pose.armR.splay ?? 0.5},
    ];
    povArm = (
      <g opacity={fade}>
        {arms.map((a, i) => {
          const w = proj(b, a.w), e = proj(b, a.e);
          if (w.z < 0.08 || w.y > 2100 || w.x < -300 || w.x > 1380) return null;
          const ang = (Math.atan2(-(w.x - e.x), w.y - e.y) * 180) / Math.PI;
          const kk = Math.min((cam.f / Math.max(0.12, w.z)) / U, 3.4);
          const ex = w.x + (e.x - w.x) * 3, ey = w.y + (e.y - w.y) * 3;
          return (
            <g key={i}>
              <line x1={ex} y1={ey} x2={w.x} y2={w.y} stroke={INK} strokeWidth={(BODY_G.armW + 8) * kk + 8} strokeLinecap="round" />
              <line x1={ex} y1={ey} x2={w.x} y2={w.y} stroke={GUARD.skin} strokeWidth={(BODY_G.armW + 8) * kk} strokeLinecap="round" />
              <g transform={`translate(${w.x} ${w.y}) rotate(${ang}) scale(${kk})`}>
                {a.torch && <Torch ol={inkW(kk) / kk} on={1} />}
                <HandArt shape={a.shape} side={i ? 1 : -1} skin={GUARD.skin} ol={inkW(kk) / kk} splay={a.splay} />
              </g>
            </g>
          );
        })}
      </g>
    );
  }
  // beam is hidden in the cuffs and the macro is lit by it already
  const beamA = beamOn * (1 - macro * 0.7);
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT.fog}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs>
          {fogFilter('fogW', fogW)}
          {fogFilter('fogG', fogG)}
          <radialGradient id="beamGlint"><stop offset="0" stopColor="#FFF6D8" stopOpacity={0.9} /><stop offset="1" stopColor="#FFF6D8" stopOpacity={0} /></radialGradient>
          <radialGradient id="beamPool"><stop offset="0" stopColor="#FFE7A8" stopOpacity={0.55} /><stop offset="0.6" stopColor="#FFE7A8" stopOpacity={0.22} /><stop offset="1" stopColor="#FFE7A8" stopOpacity={0} /></radialGradient>
          <linearGradient id="beamCone" gradientUnits="userSpaceOnUse" x1={lensS.x} y1={lensS.y} x2={hitS.x} y2={hitS.y}>
            <stop offset="0" stopColor="#FFE9B0" stopOpacity={0.42} />
            <stop offset="1" stopColor="#FFE9B0" stopOpacity={0.08} />
          </linearGradient>
          <filter id="beamSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={10} /></filter>
          <radialGradient id="vig4" cx="0.5" cy="0.45" r="0.78"><stop offset="0.62" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.42} /></radialGradient>
        </defs>
        <g id="corr4"><Corridor4 b={b} /></g>
        {/* the beam's pool lands on the corridor and on everything in it */}
        {beamA > 0 && hitS.z > 0.05 && <circle cx={hitS.x} cy={hitS.y} r={Math.min(440, hitR * 1.25)} fill="url(#beamPool)" opacity={beamA * Math.max(0, Math.min(1, (hitS.z - 0.9) / 1.6))} style={{mixBlendMode: 'screen'}} />}
        {items.map((i) => i.n)}
        {beamA > 0 && bp.hull.length > 2 && lensS.z > 0.05 && (
          <path d={`M${bp.hull.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`} fill="url(#beamCone)" filter="url(#beamSoft)" opacity={beamA * 0.9 * coneK} style={{mixBlendMode: 'screen'}} />
        )}
        {beamA > 0 && coneK > 0.05 && dust.map((d, i) => (d.z > 0.2 && d.x > -20 && d.x < 1100 && d.y > -20 && d.y < 1940 ? <circle key={`d${i}`} cx={d.x} cy={d.y} r={Math.min(6, Math.max(1.2, 3.2 / d.z))} fill="#FFF2CC" opacity={0.55 * d.o * coneK * beamA} /> : null))}
        {beamA > 0 && flareK > 0 && lensS.z > 0.05 && <circle cx={lensS.x} cy={lensS.y} r={60 + 200 * flareK} fill="url(#beamGlint)" opacity={0.8 * flareK * beamA} style={{mixBlendMode: 'screen'}} />}
        {povArm}
        <Clip4 t={t} shot={shot.id} />
        {shot.id === 'push' && t > DEMO.t0 - 0.15 && <g opacity={ss(t, DEMO.t0 - 0.15, DEMO.t0)}><LensDemo t={DEMO.t0} /></g>}
        {shot.id === 'pull' && t < PULL.t0 + 0.15 && <g opacity={1 - ss(t, PULL.t0, PULL.t0 + 0.15)}><LensDemo t={DEMO.t1} /></g>}
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vig4)" />
      </svg>
      {captions && <CapV2 t={t} cy={CAP_Y[shot.id] ?? 1500} />}
    </AbsoluteFill>
  );
};

/** The handcuffs insert: his hand, the cuffs snapping open, the corridor soft behind. */
const CuffsInsert: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const cam = camAt(t);
  const b = basis(cam);
  const u = ss(t, 26.85, 27.45);
  const open = ss(t, 27.08, 27.14);
  const settle = t > 27.14 ? Math.exp(-12 * (t - 27.14)) * Math.sin(38 * (t - 27.14)) * 0.14 : 0;
  const swing = Math.sin((t - 26.85) * 7) * 6 * Math.exp(-2.5 * (t - 26.85));
  const k = 6.4 + 0.6 * u;
  // the hand rises into frame from the lower left as he lifts the cuffs
  const hx = 470 - 30 * u, hy = 980 - 150 * u;
  const ol = inkW(k) / k;
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT.fog}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <filter id="cuB" filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}><feGaussianBlur stdDeviation={16} /></filter>
          <radialGradient id="vig5" cx="0.5" cy="0.45" r="0.78"><stop offset="0.6" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.5} /></radialGradient>
          <radialGradient id="cuL" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE7A8" stopOpacity={0.35} /><stop offset="1" stopColor="#FFE7A8" stopOpacity={0} /></radialGradient>
        </defs>
        <g filter="url(#cuB)" opacity={0.85}><Corridor4 b={b} /></g>
        <circle cx={hx + 60} cy={hy + 260} r={520} fill="url(#cuL)" />
        {/* forearm from the lower left */}
        <line x1={hx - 520} y1={hy + 900} x2={hx} y2={hy} stroke={INK} strokeWidth={BODY_G.armW * k + 10} strokeLinecap="round" />
        <line x1={hx - 520} y1={hy + 900} x2={hx} y2={hy} stroke={GUARD.skin} strokeWidth={BODY_G.armW * k} strokeLinecap="round" />
        <g transform={`translate(${hx} ${hy}) rotate(${150 + swing}) scale(${k})`}>
          <g transform="rotate(180) translate(-4 -2)">
            <Cuffs ol={ol} open={Math.min(1, open + settle)} />
          </g>
          <HandArt shape="grip" side={1} skin={GUARD.skin} ol={ol} />
        </g>
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vig5)" />
      </svg>
      {captions && <CapV2 t={t} cy={1560} />}
    </AbsoluteFill>
  );
};

export const FilmV5: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneV5 t={f / FPS} captions={false} />
      <ClipLayer />
      {captions && <CaptionsOnly t={f / FPS} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
const CaptionsOnly: React.FC<{t: number}> = ({t}) => <CapV2 t={t} cy={CAP_Y[shotAt(t).id] ?? 1500} />;
export const StillV5: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <SceneV5 t={t} captions={captions} />;
export type {Card};
