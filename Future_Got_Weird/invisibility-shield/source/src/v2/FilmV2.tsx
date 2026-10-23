// FGW "This Shield Can Make You Disappear." V2: a night-time escape in a research corridor. The approved V1 narration
// (unchanged) drives every beat. Each shot is a camera in the one corridor; the corridor, the two characters, the
// shield and the torch are drawn through it and painted far-to-near, with the shield's optics depending on where the
// camera is relative to the panel (see Shield3). Shots: corner and spin (s1), the guard's look (s2), her side (s3), the
// guard's squint (s4), his view pushing into the lenses (s5), the cut and the plan with light paths (s6), the crane back
// down (s7), her grip (s8), his close look (s9), the reach (s10), the floating hand (s11), his freeze (s12), two hands
// (s13), the reveal (s14 two-shot, s15 his jolt, s16 her grin over his shoulder, s17 the two-shot and the dash).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {clamp, inv} from '../lib/math';
import {FPS} from '../world';
import {basis, d3, proj, s3, v3} from './p3';
import {Corridor, Flashlight} from './Corridor';
import {DIM_W, LOOK_G, LOOK_W, Person, joints} from './Person';
import {SH, Shield3, shieldFrame, viewSide} from './Shield3';
import {LensFace, LensSection, LightPaths, lightPaths} from './Lens';
import {CapV2} from './CaptionsV2';
import {camAt, CUT_Y, guardAt, SHOT, shieldAt, shotAt, torchRay, w, we, womanAt} from './story';

// caption centre per shot: low (clear of the Shorts bottom UI, at or above V1's 1500) or high where the action is low
const CAP_Y: Record<string, number> = {s1: 1490, s2: 1490, s3: 330, s4: 1500, s5: 1500, s6: 1500, s7: 1500, s8: 330, s9: 1490, s10: 330, s11: 1500, s12: 1500, s13: 1500, s14: 1500, s15: 1500, s16: 1500, s17: 1500};

export const SceneV2: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const shot = shotAt(t);
  const cam = camAt(t);
  const b = basis(cam);
  const s = shieldAt(t);
  const wz = womanAt(t);
  const gz = guardAt(t);
  const tr = torchRay(t);
  const side = viewSide(b, s);
  const section = shot === 's6';
  const plan = section && t > SHOT.s6 + 0.85;
  // the torch beam can land on the shield's lens face (a glint) instead of the wall behind it
  const {n} = shieldFrame(s);
  const den = d3(n, tr.dir);
  let glint = 0;
  if (Math.abs(den) > 1e-6) {
    const tt = d3(s3(s.c, tr.o), n) / den;
    if (tt > 0) {
      const p = v3(tr.o.x + tr.dir.x * tt, tr.o.y + tr.dir.y * tt, tr.o.z + tr.dir.z * tt);
      const rel = s3(p, s.c);
      if (Math.abs(rel.x) < SH.w / 2 && Math.abs(rel.y) < SH.h / 2 && den < 0) glint = 1;
    }
  }
  const occ = {c: s.c, n, w: SH.w, h: SH.h};
  const torchOn = section ? 0.7 : 1;
  const corridor = (id: string) => (
    <g>
      <Corridor id={id} b={b} t={t} cut={plan} />
      <Flashlight id={`${id}-fl`} b={b} o={tr.o} dir={tr.dir} on={torchOn} occluder={occ} />
    </g>
  );
  const woman = (id: string, shadow = true) => <Person id={id} b={b} pz={wz} look={LOOK_W} shadow={shadow} />;
  const guard = (id: string) => <Person id={id} b={b} pz={gz} look={LOOK_G} />;
  const dG = proj(b, gz.pos).d, dS = proj(b, s.c).d;
  const guardBehindShield = dG > dS;
  // ---- section / plan
  if (section) {
    const cutV = (CUT_Y - s.c.y) / SH.h;
    const camH = cam.pos.y - CUT_Y;
    const micro = camH < 0.25 && t < SHOT.s6 + 1.6;
    const paths = lightPaths(s, CUT_Y + 0.002, joints(gz, LOOK_G.dims).Hc);
    const kBody = inv(SHOT.s6 + 0.55, we(32) + 0.1, t);
    const kBg = inv(w(34) - 0.05, we(42) - 0.4, t);
    const lab = clamp(inv(SHOT.s6 + 1.4, SHOT.s6 + 1.9, t)) * (1 - clamp(inv(SHOT.s7 - 0.3, SHOT.s7, t)));
    return (
      <AbsoluteFill style={{backgroundColor: '#08111A'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          {(() => {
            // while the camera is millimetres from the cut, the room behind is out of the picture (a dark backdrop);
            // it fades in as the camera rises to the plan
            const fade = clamp((camH - 0.12) / 0.5);
            return fade > 0.01 ? (
              <g opacity={fade}>
                {corridor('pc')}
                {woman('pw')}
                {guard('pg')}
              </g>
            ) : null;
          })()}
          {micro && <LensFace id="lf" b={b} s={s} t={t} cutV={cutV} />}
          <LensSection id="ls" b={b} s={s} cutV={cutV} />
          <LightPaths b={b} paths={paths} kBody={kBody} kBg={kBg} t={t} />
          {/* the guard's line of sight to the panel's edges */}
          {!micro && (() => {
            const e = joints(gz, LOOK_G.dims).Hc;
            const E = proj(b, v3(e.x, CUT_Y, e.z));
            const L = proj(b, v3(s.c.x - SH.w / 2, CUT_Y, s.c.z + SH.th)), R = proj(b, v3(s.c.x + SH.w / 2, CUT_Y, s.c.z + SH.th));
            return <path d={`M${L.x},${L.y} L${E.x},${E.y} L${R.x},${R.y}`} fill="#FFFFFF" fillOpacity={0.05} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="6 6" />;
          })()}
        </svg>
        {lab > 0.01 && (
          <div style={{position: 'absolute', left: 60, top: 230, opacity: lab, fontFamily: '"Fredoka Variable", system-ui', fontWeight: 600, fontSize: 30, letterSpacing: '0.08em', color: '#DDF6F4', background: 'rgba(6,12,18,0.7)', padding: '8px 20px', borderRadius: 999, border: '2px solid rgba(255,255,255,0.15)'}}>
            TOP VIEW · SIMPLIFIED LIGHT PATHS
          </div>
        )}
        {captions && <CapV2 t={t} cy={CAP_Y[shot]} />}
      </AbsoluteFill>
    );
  }
  // ---- regular shots: corridor, then guard / woman / shield far-to-near
  const behind = (
    <g>
      {corridor('bc')}
      {guardBehindShield && guard('bg')}
    </g>
  );
  const shieldNode = <Shield3 key="sh" id="sh" b={b} s={s} t={t} behindScene={behind} subject={woman('wr', false)} glint={glint * (side > 0 ? 1 : 0)} />;
  const items: {d: number; node: React.ReactNode}[] = [];
  const pov = shot === 's11' || (shot === 's5' && t < SHOT.s5 + 0.6);
  if (!pov) items.push({d: dG, node: <g key="g">{guard('g')}</g>});
  // woman and shield: the side of the panel the camera is on decides which is in front
  const dW = proj(b, wz.pos).d;
  if (side > 0) items.push({d: Math.max(dW, dS + 0.001), node: <g key="w">{woman('w')}</g>}, {d: Math.min(dS, dW - 0.001), node: shieldNode});
  else items.push({d: Math.max(dS, dW + 0.001), node: shieldNode}, {d: Math.min(dW, dS - 0.001), node: <g key="w">{woman('w')}</g>});
  items.sort((a, c) => c.d - a.d);
  const micro = shot === 's5' && proj(b, s.c).d < 1.2;
  return (
    <AbsoluteFill style={{backgroundColor: '#08111A'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {corridor('c')}
        {items.map((it) => it.node)}
        {micro && <LensFace id="lf5" b={b} s={s} t={t} a={clamp((1.2 - proj(b, s.c).d) / 0.9)} />}
        {/* vignette */}
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

export const FilmV2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneV2 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const StillV2: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <SceneV2 t={t} captions={captions} />;
export {DIM_W};
