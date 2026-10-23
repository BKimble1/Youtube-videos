// FGW "This Shield Can Make You Disappear." V3: a chase in one research corridor, staged as a few long, moving shots:
//   A 0-3.1    tracking ahead of her as she runs, brakes, pivots and raises the shield; round behind her shoulder
//   B 3.1-18.5 one take: over his shoulder (she melts into the lens smear), round the shield's edge (she is there),
//              back onto his line, into the lens surface, over its cut edge and up through the cross-section with the
//              light, back down through the lens, out past him, with him as he creeps closer, and round to the side
//   E 18.5     behind her: the reach round the edge
//   F 20.75    his view: a hand floating beside the panel
//   G 21.35    round to the side: his reactions, the reveal, the cuffs
//   H 27.95    the swoop into the chase, which becomes the opening shot (the loop)
// The only typography is the narration captions.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {clamp} from '../lib/math';
import {FPS} from '../world';
import {basis, d3, proj, s3, v3} from '../v2/p3';
import {SH, Shield3, shieldFrame, viewSide} from '../v2/Shield3';
import {LensFace, LensSection} from '../v2/Lens';
import {CapV2} from '../v2/CaptionsV2';
import {Corridor3} from './Corridor3';
import {Flashlight} from './Torch3';
import {joints3, LOOK_G3, LOOK_W3, Person3} from './Person3';
import {Rays3, rays3} from './Rays3';
import {camAt, ceilingCut, CUT_Y, guardAt, inSection, sectionCut, shotAt, torchRay, womanAt} from './story3';
import {prog} from './spline';

const CAP_Y: Record<string, number> = {A: 1500, B: 1500, E: 1500, F: 1500, G: 1500, H: 1500};

export const SceneV3: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const shot = shotAt(t);
  const cam = camAt(t);
  const b = basis(cam);
  const {pose: wz, shield: s} = womanAt(t);
  const gz = guardAt(t);
  const tr = torchRay(t);
  const side = viewSide(b, s);
  const section = inSection(t);
  const cutV = sectionCut(t);
  // torch light falling on the lens face
  const {n} = shieldFrame(s);
  const den = d3(n, tr.dir);
  let glint = 0;
  if (Math.abs(den) > 1e-6) {
    const tt = d3(s3(s.c, tr.o), n) / den;
    if (tt > 0 && den < 0) {
      const p = v3(tr.o.x + tr.dir.x * tt, tr.o.y + tr.dir.y * tt, tr.o.z + tr.dir.z * tt);
      const rel = s3(p, s.c);
      if (Math.abs(rel.x) < SH.w / 2 && Math.abs(rel.y) < SH.h / 2) glint = 1;
    }
  }
  const occ = {c: s.c, n, w: SH.w, h: SH.h};
  const corridor = (id: string) => (
    <g>
      <Corridor3 id={id} b={b} t={t} cut={ceilingCut(t)} />
      <Flashlight id={`${id}-fl`} b={b} o={tr.o} dir={tr.dir} on={section ? 0.7 : 1} occluder={occ} />
    </g>
  );
  const woman = (id: string, shadow = true) => <Person3 id={id} b={b} pz={wz} look={LOOK_W3} shadow={shadow} />;
  const guard = (id: string) => <Person3 id={id} b={b} pz={gz} look={LOOK_G3} />;
  const dG = proj(b, gz.pos).d, dS = proj(b, s.c).d, dW = proj(b, wz.pos).d;
  const items: {d: number; node: React.ReactNode}[] = [];
  // the camera can sit inside the guard's head line in F (his view): he is behind the camera then
  if (dG > 0.3) items.push({d: dG, node: <g key="g">{guard('g')}</g>});
  // distance from the camera to the panel surface (for the micro views)
  // (signed: the camera in front of the lens face, whatever its offset from the panel's centre)
  const surfD = d3(s3(b.pos, s.c), n);
  const nearFace = surfD > 0 && surfD < 1.2;
  let overlay: React.ReactNode = null;
  if (section) {
    // the cross-section: the panel is drawn as its lens face below the cut and the cut face itself
    items.push({d: Math.max(dW, dS + 0.001), node: <g key="w">{woman('w')}</g>});
    overlay = (
      <g>
        <LensFace id="lf" b={b} s={s} t={t} cutV={cutV} />
        <LensSection id="ls" b={b} s={s} cutV={cutV} />
      </g>
    );
  } else {
    const behind = (
      <g>
        {corridor('bc')}
        {dG > dS && guard('bg')}
      </g>
    );
    const shieldNode = <Shield3 key="sh" id="sh" b={b} s={s} t={t} behindScene={behind} subject={woman('wr', false)} glint={glint * (side > 0 ? 1 : 0)} />;
    if (side > 0) items.push({d: Math.max(dW, dS + 0.001), node: <g key="w">{woman('w')}</g>}, {d: Math.min(dS, dW - 0.001), node: shieldNode});
    else items.push({d: Math.max(dS, dW + 0.001), node: shieldNode}, {d: Math.min(dW, dS - 0.001), node: <g key="w">{woman('w')}</g>});
    if (nearFace) overlay = <LensFace id="lf5" b={b} s={s} t={t} a={clamp((1.2 - surfD) / 0.9)} />;
  }
  items.sort((a, c) => c.d - a.d);
  // light paths through the section (her light fans sideways; the corridor's light crosses to his eye)
  const eye = joints3(gz, LOOK_G3.dims).Hc;
  const rays = rays3(s, CUT_Y + 0.002, eye);
  const kBody = prog(t, 9.0, 10.35), kBg = prog(t, 10.72, 12.6);
  const rayFade = 1 - prog(t, 13.1, 13.5);
  const roomFade = clamp((cam.pos.y - CUT_Y - 0.06) / 0.32);
  return (
    <AbsoluteFill style={{backgroundColor: '#08111A'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {/* in the section the room fades in as the camera rises off the cut (millimetres above it, only the lens) */}
        <g opacity={section ? roomFade : 1}>
          {corridor('c')}
          {items.map((it) => it.node)}
        </g>
        {overlay}
        {section && <Rays3 b={b} rays={rays} kBody={kBody} kBg={kBg} t={t} fade={rayFade} />}
        <defs>
          <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vig)" />
      </svg>
      {captions && <CapV2 t={t} cy={CAP_Y[shot]} />}
    </AbsoluteFill>
  );
};

export const FilmV3: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneV3 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const StillV3: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <SceneV3 t={t} captions={captions} />;
