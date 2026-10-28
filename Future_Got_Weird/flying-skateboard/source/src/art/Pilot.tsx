// The pilot, drawn from the 3D rig (pilot.ts) through a lens. Reference-grounded and respectful: the inventor is shown
// by his gear, not by an invented likeness. White open helmet with a smoked visor over the eyes, orange jacket,
// charcoal trousers, white trainers, black gloves, the AI coach earpiece on his ear, a phone strapped to his left
// wrist and the steering/throttle controller in his right hand. Contour, fills and highlights follow the crew
// finish (eng/draw.tsx). Every limb is one continuous shape (dc/limb.tsx), so no joint ever shows a seam.
import React from 'react';
import {limbGeo} from '../dc/limb';
import {capsulePath} from '../dc/shade';
import {a3, c3, d3, l3, Lens, lerp3, m3, n3, s3, V3} from '../eng/v3';
import {circ3, curveD, f2, hull, inkW, lit, P2, polyD, proj, shade, Shape, smoothD, sphereD, sphereRegion, thin} from '../eng/draw';
import {DIMS, PilotJ} from './rig';

export const GEAR = {
  jacket: '#E2702F',
  jacketDeep: '#B9521C',
  pants: '#394150',
  shoe: '#EEF1F4',
  sole: '#AEB8C2',
  glove: '#2A2F37',
  skin: '#E8BD98',
  helmet: '#F4F6F8',
  helmetStripe: '#E2702F',
  visor: '#26343F',
  phone: '#1D232B',
  screen: '#0E2A3A',
  coach: '#46CFFF',
};

type Props = {
  id: string;
  L: Lens;
  j: PilotJ;
  /** 0..1: the AI coach earpiece pulse (light on the bud) */
  coach?: number;
  /** wrist and board phone attitude readout: tilt angles (deg) shown on the wrist phone */
  tilt?: {pitch: number; roll: number};
  /** controller thumb 0..1 */
  thumb?: number;
  /** skip the controller (redesign workbench shots) */
  noController?: boolean;
  /** rider's-eye view: the camera is in the head, so only the legs and shoes are drawn */
  pov?: boolean;
  /** V6: the AI coach speaking (k 0..1, t = clock): a voice waveform on the wrist phone, in the earbud's colour */
  voice?: {k: number; t: number};
};

export const Pilot: React.FC<Props> = ({id, L, j, coach = 0, tilt = {pitch: 0, roll: 0}, thumb = 0.4, noController, pov, voice}) => {
  const p = L.p;
  const kc = p(j.P).k;
  const w = inkW(kc);
  const cam = L.pos;
  const vis = (...qs: V3[]) => qs.every((q) => d3(s3(q, cam), L.f) > 0.08);
  const facing = (q: V3, nrm: V3) => d3(n3(nrm), n3(s3(cam, q)));
  const dep = (q: V3) => d3(s3(q, cam), L.f);

  // --- shoes (boxes in the board frame, planted on the deck)
  // V5 (final): the shoe's top is a plane parallel to the deck. The shoe lies below it and the trouser leg above it,
  // except the leg's rounded end, which is inside the shoe. Seen from above that plane the shoe is drawn first and the
  // leg over it, cut off at the plane; seen from below, the leg first and the shoe over it. Where the order changes
  // the camera is in the plane and the two shapes only touch along a line, so nothing pops and nothing is drawn
  // see-through (V5 first cut: a fading copy of the shoes let the trouser ends show through them).
  const SHOE_TOP = 0.105;
  const shoe = (k: string, ank: V3, knee: V3, hip: V3) => {
    const B = j.B;
    if (!vis(ank)) return {z: 0, up: true, el: null, clip: null};
    const base = s3(ank, m3(B.y, DIMS.ankleH));
    const c: V3[] = [];
    // V5: the shoe sits on the board's solid spine (|x| < 0.165), clear of the toe-side fan ducts
    for (const x of [-0.115, 0.135]) for (const y of [0, SHOE_TOP]) for (const z of [-0.058, 0.058]) c.push(a3(base, a3(a3(m3(B.x, x), m3(B.y, y)), m3(B.z, z))));
    // rounded toe
    c.push(a3(base, a3(m3(B.x, 0.162), m3(B.y, 0.04))));
    const pts = thin(hull(proj(L, c)), 1.5);
    const sole: V3[] = [];
    for (const x of [-0.12, 0.162]) for (const z of [-0.06, 0.06]) for (const y of [0, 0.02]) sole.push(a3(base, a3(a3(m3(B.x, x), m3(B.y, y)), m3(B.z, z))));
    const sp = thin(hull(proj(L, sole)), 1.5);
    const lace = proj(L, [a3(base, a3(m3(B.x, 0.0), m3(B.y, 0.108))), a3(base, a3(m3(B.x, 0.12), m3(B.y, 0.085)))]);
    const topC = a3(base, m3(B.y, SHOE_TOP));
    const up = d3(s3(cam, topC), B.y) > 0;
    // the leg above the plane: the hull of its cut at the plane and its knee and hip discs (all convex pieces)
    let clip: string | null = null;
    if (up) {
      const sh = s3(knee, ank);
      const lam = (SHOE_TOP - DIMS.ankleH) / Math.max(0.05, d3(sh, B.y));
      const cut = a3(ank, m3(sh, lam));
      const disc = (q: V3, r: number) => {
        const pq = p(q), rr = r * pq.k + 3 * w;
        return Array.from({length: 16}, (_, i) => ({x: pq.x + rr * Math.cos((i / 16) * Math.PI * 2), y: pq.y + rr * Math.sin((i / 16) * Math.PI * 2)}));
      };
      const cutP = proj(L, circ3(cut, B.x, B.z, 0.054, 20));
      clip = polyD(hull([...cutP, ...disc(knee, 0.062), ...disc(hip, 0.085)]));
    }
    return {
      z: dep(base) + 0.02,
      up,
      clip,
      el: (
        <g key={k}>
          <Shape id={`${id}-${k}`} d={smoothD(pts, 0.12)} pts={pts} color={GEAR.shoe} w={w} k={0.8} />
          <path d={smoothD(sp, 0.1)} fill={GEAR.sole} opacity={0.85} />
          {up && <path d={polyD(lace, false)} stroke="#9AA8B5" strokeWidth={f2(w * 1.6)} strokeLinecap="round" fill="none" />}
        </g>
      ),
    };
  };

  // --- a limb (one continuous contour)
  const limb = (k: string, A: V3, Bj: V3, C: V3, rA: number, rB: number, rC: number, color: string, kk = 1) => {
    if (!vis(A, Bj, C)) return null;
    const a = p(A), b = p(Bj), c = p(C);
    const g = limbGeo(a, b, c, rA * a.k, rB * b.k, rC * c.k);
    const pts = [a, b, c].flatMap((q, i) => {
      const r = [rA * a.k, rB * b.k, rC * c.k][i];
      return [{x: q.x - r, y: q.y - r}, {x: q.x + r, y: q.y + r}];
    });
    return <Shape key={k} id={`${id}-${k}`} d={g.d} pts={pts} color={color} w={w} k={kk} />;
  };

  // --- legs
  const legF = limb('lf', j.hipF, j.kneeF, j.ankF, 0.08, 0.058, 0.046, GEAR.pants);
  const legR = limb('lr', j.hipR, j.kneeR, j.ankR, 0.08, 0.058, 0.046, shade(GEAR.pants, 0.12));
  const zF = dep(j.kneeF), zR = dep(j.kneeR);

  // --- torso (hull of body cross-sections)
  const ring = (c: V3, lft: V3, fwd: V3, rx: number, ry: number) => circ3(c, lft, fwd, 1, 18).map((q) => {
    const d = s3(q, c);
    return a3(c, a3(m3(lft, d3(d, lft) * rx), m3(fwd, d3(d, fwd) * ry)));
  });
  const secs: V3[] = [];
  const lvl = (t: number) => lerp3(j.P, j.S, t);
  const ax = (t: number) => ({l: n3(lerp3(j.left0, j.chL, Math.min(1, t * 1.4))), f: n3(lerp3(j.fwd0, j.chF, Math.min(1, t * 1.4)))});
  for (const [t, rx, ry] of [[-0.06, 0.165, 0.115], [0.35, 0.152, 0.108], [0.72, 0.18, 0.125], [0.97, 0.175, 0.1]] as const) {
    const a = ax(t);
    secs.push(...ring(lvl(t), a.l, a.f, rx, ry));
  }
  const torsoPts = thin(hull(proj(L, secs)), 2);
  const torsoD = smoothD(torsoPts, 0.14);
  // zip and hem, on the visible front
  const front = facing(lvl(0.5), j.chF);
  const zip = proj(L, [a3(lvl(0.94), m3(j.chF, 0.1)), a3(lvl(0.5), m3(j.chF, 0.112)), a3(lvl(0.02), m3(j.fwd0, 0.116))]);
  const hem = circ3(lvl(0.02), j.left0, j.fwd0, 1, 24).map((q) => {
    const d = s3(q, lvl(0.02));
    return a3(lvl(0.02), a3(m3(j.left0, d3(d, j.left0) * 0.168), m3(j.fwd0, d3(d, j.fwd0) * 0.118)));
  });
  const hemVis = hem.filter((q) => facing(q, s3(q, lvl(0.02))) > 0);
  const torso = (
    <g key="torso">
      {vis(j.P, j.S) && <Shape id={`${id}-tor`} d={torsoD} pts={torsoPts} color={GEAR.jacket} w={w} k={1.1} />}
      <g clipPath={`url(#${id}-tc)`}>
        <defs>
          <clipPath id={`${id}-tc`}>
            <path d={torsoD} />
          </clipPath>
        </defs>
        {hemVis.length > 2 && <path d={curveD(proj(L, hemVis))} stroke={GEAR.jacketDeep} strokeWidth={f2(w * 2.4)} fill="none" opacity={0.7} />}
        {front > 0.05 && <path d={curveD(zip)} stroke={GEAR.jacketDeep} strokeWidth={f2(w * 1.3)} fill="none" opacity={0.9} />}
        {/* reflective chest stripe (hi-vis band across the chest) */}
        {(() => {
          const band = circ3(lvl(0.74), j.chL, j.chF, 1, 28).map((q) => {
            const d = s3(q, lvl(0.74));
            return a3(lvl(0.74), a3(m3(j.chL, d3(d, j.chL) * 0.183), m3(j.chF, d3(d, j.chF) * 0.128)));
          });
          const vis = band.filter((q) => facing(q, s3(q, lvl(0.74))) > 0.05);
          return vis.length > 2 ? <path d={curveD(proj(L, vis))} stroke="#F4F1E6" strokeWidth={f2(0.03 * kc)} fill="none" opacity={0.85} strokeLinecap="round" /> : null;
        })()}
      </g>
    </g>
  );

  // --- arms
  const forearm = (wri: V3, elb: V3) => n3(s3(wri, elb));
  const glove = (k: string, wri: V3, elb: V3) => {
    if (!vis(wri)) return null;
    const fd = forearm(wri, elb);
    const a = p(a3(wri, m3(fd, 0.01))), b = p(a3(wri, m3(fd, 0.085)));
    const d = capsulePath(a, b, 0.042 * a.k, 0.05 * b.k);
    const pts = [{x: Math.min(a.x, b.x) - 0.05 * a.k, y: Math.min(a.y, b.y) - 0.05 * a.k}, {x: Math.max(a.x, b.x) + 0.05 * a.k, y: Math.max(a.y, b.y) + 0.05 * a.k}];
    return <Shape key={k} id={`${id}-${k}`} d={d} pts={pts} color={GEAR.glove} w={w} k={0.6} />;
  };
  const cuff = (k: string, wri: V3, elb: V3) => {
    if (!vis(wri)) return null;
    const fd = forearm(wri, elb);
    const a = p(a3(wri, m3(fd, -0.045))), b = p(a3(wri, m3(fd, 0.005)));
    return <path key={k} d={capsulePath(a, b, 0.047 * a.k, 0.045 * b.k)} fill={GEAR.jacketDeep} stroke="#172B3A" strokeWidth={f2(w * 2)} paintOrder="stroke" />;
  };
  // wrist phone on the left forearm (screen faces the outside of the forearm, turned up by wristUp)
  const wristPhone = () => {
    const fd = forearm(j.wriF, j.elbF);
    const out0 = n3(s3(j.chL, m3(fd, d3(j.chL, fd))));
    const upv = n3(s3(j.up, m3(fd, d3(j.up, fd))));
    const toEye = n3(s3(j.Hc, j.wriF));
    const nrm = n3(lerp3(n3(lerp3(out0, upv, 0.55)), toEye, j.wristUp));
    const side = n3(a3(m3(fd, 0), {x: fd.y * nrm.z - fd.z * nrm.y, y: fd.z * nrm.x - fd.x * nrm.z, z: fd.x * nrm.y - fd.y * nrm.x}));
    const c = a3(a3(j.wriF, m3(fd, -0.07)), m3(nrm, 0.046));
    const cr = (u: number, v: number) => p(a3(c, a3(m3(fd, u), m3(side, v))));
    const body = [cr(-0.045, -0.03), cr(0.045, -0.03), cr(0.045, 0.03), cr(-0.045, 0.03)];
    const scr = [cr(-0.038, -0.023), cr(0.038, -0.023), cr(0.038, 0.023), cr(-0.038, 0.023)];
    // V5 (final): opaque, and drawn only while its face is toward the camera: it turns away edge-on, as a line, so it
    // never pops (it used to fade, which showed the sleeve through it)
    const vis = facing(c, nrm) > 0;
    const iconK = Math.max(0, Math.min(1, (j.wristUp - 0.2) / 0.25));
    const pc = p(c);
    // attitude readout: a horizon bar tilted by the board roll, shifted by pitch, and a centre dot
    const hr = (tilt.roll * Math.PI) / 180;
    const hu = 0.012 * Math.max(-1, Math.min(1, tilt.pitch / 12));
    const h0 = cr(-0.032 * Math.cos(hr), hu - 0.032 * Math.sin(hr) * 0.6), h1 = cr(0.032 * Math.cos(hr), hu + 0.032 * Math.sin(hr) * 0.6);
    const ok = Math.abs(tilt.roll) < 4 && Math.abs(tilt.pitch) < 4;
    // V3: when the wrist is turned up to read it, the screen shows the board side-on against a level reference: the
    // board icon tilts with the roll (exaggerated x3 so it reads at a glance), amber when off level, green when level
    const icon = (() => {
      const r3 = Math.max(-0.6, Math.min(0.6, hr * 3));
      const P2 = (u: number, v: number) => cr(u * Math.cos(r3) - v * Math.sin(r3), u * Math.sin(r3) + v * Math.cos(r3) - 0.004);
      const bar = [P2(-0.026, -0.0035), P2(0.026, -0.0035), P2(0.029, 0), P2(0.026, 0.0035), P2(-0.026, 0.0035), P2(-0.029, 0)];
      const ref = [[-0.036, -0.03], [0.036, 0.03]].map(([a0, a1]) => [cr(a0, -0.004), cr(a1, -0.004)]);
      return (
        <g>
          <path d={`M${f2(ref[0][0].x)},${f2(ref[0][0].y)} L${f2(cr(-0.031, -0.004).x)},${f2(cr(-0.031, -0.004).y)} M${f2(ref[1][0].x)},${f2(ref[1][0].y)} L${f2(cr(0.031, -0.004).x)},${f2(cr(0.031, -0.004).y)}`} stroke="#E8F6FF" strokeWidth={f2(Math.max(0.8, 0.003 * pc.k))} strokeLinecap="round" />
          <path d={polyD(bar)} fill={ok ? '#21D19F' : '#FFB347'} />
          {[-0.016, 0.016].map((u) => <circle key={u} cx={f2(P2(u, -0.0065).x)} cy={f2(P2(u, -0.0065).y)} r={f2(Math.max(0.5, 0.0022 * pc.k))} fill={ok ? '#21D19F' : '#FFB347'} />)}
          {!(voice && voice.k > 0.01) && <path d={`M${f2(cr(-0.012, 0.016).x)},${f2(cr(-0.012, 0.016).y)} L${f2(cr(0.012, 0.016).x)},${f2(cr(0.012, 0.016).y)}`} stroke={ok ? '#21D19F' : '#FFB347'} strokeOpacity={0.6} strokeWidth={f2(Math.max(0.7, 0.003 * pc.k))} strokeLinecap="round" />}
          {/* V6: the coach app speaking: a voice waveform in the earbud's colour along the bottom of the screen */}
          {voice && voice.k > 0.01 && (
            <path
              d={[-2, -1, 0, 1, 2].map((b) => {
                const hgt = 0.0015 + 0.006 * voice.k * (0.35 + 0.65 * Math.abs(Math.sin(voice.t * 13 + b * 1.7) * Math.sin(voice.t * 5.3 + b)));
                const a = cr(b * 0.0075, 0.016 - hgt), c = cr(b * 0.0075, 0.016 + hgt);
                return `M${f2(a.x)},${f2(a.y)} L${f2(c.x)},${f2(c.y)}`;
              }).join(' ')}
              stroke={GEAR.coach}
              strokeWidth={f2(Math.max(0.8, 0.0035 * pc.k))}
              strokeLinecap="round"
            />
          )}
        </g>
      );
    })();
    return vis ? (
      <g key="wp">
        <path d={polyD(body)} fill={GEAR.phone} stroke="#0B1218" strokeWidth={f2(w * 1.6)} strokeLinejoin="round" paintOrder="stroke" />
        <path d={polyD(scr)} fill={GEAR.screen} />
        {iconK > 0.01 && <g opacity={f2(iconK)}>{icon}</g>}
        {iconK < 0.99 && (
          <g opacity={f2(1 - iconK)}>
            <path d={`M${f2(h0.x)},${f2(h0.y)} L${f2(h1.x)},${f2(h1.y)}`} stroke={ok ? '#21D19F' : '#FFB347'} strokeWidth={f2(Math.max(0.8, 0.006 * pc.k))} strokeLinecap="round" />
            <circle cx={f2(cr(0, 0).x)} cy={f2(cr(0, 0).y)} r={f2(Math.max(0.6, 0.004 * pc.k))} fill="#E8F6FF" />
          </g>
        )}
      </g>
    ) : null;
  };
  // the steering / throttle controller in the right hand
  const controller = () => {
    if (noController) return null;
    const fd = forearm(j.wriR, j.elbR);
    const c = a3(j.wriR, m3(fd, 0.06));
    const upv = n3(s3(j.up, m3(fd, d3(j.up, fd))));
    const sd = n3({x: fd.y * upv.z - fd.z * upv.y, y: fd.z * upv.x - fd.x * upv.z, z: fd.x * upv.y - fd.y * upv.x});
    const box: V3[] = [];
    for (const u of [-0.03, 0.075]) for (const v of [-0.02, 0.07]) for (const s of [-0.022, 0.022]) box.push(a3(c, a3(a3(m3(fd, u), m3(upv, v)), m3(sd, s))));
    const pts = hull(proj(L, box));
    const stick = p(a3(a3(c, m3(upv, 0.075)), m3(fd, 0.02 + 0.02 * thumb)));
    const led = p(a3(a3(c, m3(upv, 0.06)), m3(fd, 0.06)));
    return (
      <g key="ctl">
        <path d={smoothD(pts, 0.08)} fill="#30363F" stroke="#0E151C" strokeWidth={f2(w * 1.8)} paintOrder="stroke" />
        <circle cx={f2(stick.x)} cy={f2(stick.y)} r={f2(0.012 * stick.k)} fill="#59636F" stroke="#0E151C" strokeWidth={f2(w)} />
        <circle cx={f2(led.x)} cy={f2(led.y)} r={f2(Math.max(0.7, 0.006 * led.k))} fill="#46CFFF" />
      </g>
    );
  };
  const arm = (k: string, sh: V3, el: V3, wr: V3, isFront: boolean) => (
    <g key={k}>
      {limb(`${k}a`, sh, el, wr, 0.064, 0.052, 0.044, isFront ? GEAR.jacket : shade(GEAR.jacket, 0.1), 1.05)}
      {cuff(`${k}c`, wr, el)}
      {glove(`${k}g`, wr, el)}
      {isFront ? wristPhone() : controller()}
    </g>
  );
  const armFz = dep(lerp3(j.elbF, j.wriF, 0.5));
  const armRz = dep(lerp3(j.elbR, j.wriR, 0.6));

  // --- neck and head
  // the neck runs from inside the jacket (hidden by it) up into the head
  const neckA = p(lerp3(j.S, j.N, -0.5)), neckB = p(a3(j.Hc, m3(j.hU, -0.06)));
  const neck = !vis(j.N, j.Hc) ? null : <path key="nk" d={capsulePath(neckA, neckB, 0.052 * neckA.k, 0.05 * neckB.k)} fill={shade(GEAR.skin, 0.12)} stroke="#172B3A" strokeWidth={f2(w * 2)} paintOrder="stroke" />;
  // V5 (final): the collar opening is a ring on top of the jacket, seen only from above its plane (it is edge-on, a
  // line, where it appears). It is opaque and clipped to the jacket, so its ends never float beside the neck. The
  // neck is drawn again over it, clipped to the region beyond the ring's near arc: the neck rises out of the opening,
  // in front of the ring's back and the jacket behind it, and behind the jacket's front. No fading copies, so the neck
  // never reads as glassy.
  const colC = lerp3(j.S, j.N, 0.1);
  const colN = (() => {
    const nn = n3(c3(j.chF, j.chL));
    return d3(nn, j.up) < 0 ? m3(nn, -1) : nn;
  })();
  const colR = 0.068;
  const colUp = d3(s3(cam, colC), colN) > 0.002;
  const collarPts = colUp ? proj(L, circ3(colC, j.chL, j.chF, colR, 28)) : [];
  const neckClip = (() => {
    if (!colUp || !neck) return null;
    const toC = n3(s3(cam, colC));
    const hd = n3(s3(toC, m3(colN, d3(toC, colN))));
    const e2 = c3(colN, hd);
    const nk = n3(s3(j.Hc, colC));
    const arc = Array.from({length: 17}, (_, i) => {
      const a = (i / 16) * Math.PI;
      return a3(colC, a3(m3(e2, colR * Math.cos(a)), m3(hd, colR * Math.sin(a))));
    });
    const far = [a3(a3(colC, m3(e2, -colR * 1.8)), m3(nk, 0.6)), a3(a3(colC, m3(e2, colR * 1.8)), m3(nk, 0.6))];
    return polyD(proj(L, [...arc, ...far]));
  })();
  const collar = colUp ? (
    <g key="col">
      <defs>
        <clipPath id={`${id}-tc2`}>
          <path d={torsoD} />
        </clipPath>
        {neckClip && (
          <clipPath id={`${id}-nc`}>
            <path d={neckClip} />
          </clipPath>
        )}
      </defs>
      <g clipPath={`url(#${id}-tc2)`}>
        <Shape id={`${id}-col`} d={polyD(collarPts)} pts={collarPts} color={GEAR.jacketDeep} w={w} />
      </g>
      {neckClip && <g clipPath={`url(#${id}-nc)`}>{neck}</g>}
    </g>
  ) : null;
  // V5: the head and helmet are one rigid assembly in the head frame (hF, hU, hL), pivoting at the neck. Every part
  // (shell, visor, stripe, ears, earbud, chin strap) is defined in that frame, and outlines are exact clipped curves
  // (sphereRegion), so a head turn rotates the whole assembly continuously: no sampling grid, no on/off thresholds.
  const R = DIMS.headR;
  const Hc = j.Hc;
  const HD = (f: number, u: number, l: number): V3 => n3(a3(a3(m3(j.hF, f), m3(j.hU, u)), m3(j.hL, l)));
  const loc = (d: V3) => ({f: d3(d, j.hF), u: d3(d, j.hU), l: d3(d, j.hL)});
  const skin = sphereD(L, Hc, R * 0.93);
  // shell: above a rim that sits level across the brow and drops down over the back of the head
  const shellIn = (d: V3) => {
    const q = loc(d);
    return q.u + 0.5 * Math.max(0, -q.f) > 0.12;
  };
  const shellRim: V3[] = Array.from({length: 96}, (_, i) => {
    const ps = (i / 96) * Math.PI * 2;
    const cp = Math.cos(ps), sp = Math.sin(ps);
    const k = Math.max(0, -0.5 * cp);
    const th = Math.asin(0.12 / Math.sqrt(1 + k * k)) - Math.atan(k);
    return HD(Math.cos(th) * cp, Math.sin(th), Math.cos(th) * sp);
  });
  const helmetPts = sphereRegion(L, Hc, R * 1.06, shellRim, shellIn);
  // visor: the band across the eyes (fwd > 0.42, between u = -0.12 and 0.36)
  const visIn = (d: V3) => {
    const q = loc(d);
    return q.f > 0.42 && q.u < 0.36 && q.u > -0.12;
  };
  const visorLoop = (() => {
    const th0 = Math.asin(-0.12), th1 = Math.asin(0.36);
    const pm = (th: number) => Math.acos(Math.min(1, 0.42 / Math.cos(th)));
    const at = (th: number, ps: number) => HD(Math.cos(th) * Math.cos(ps), Math.sin(th), Math.cos(th) * Math.sin(ps));
    const pts: V3[] = [];
    const N = 16;
    for (let i = 0; i <= N; i++) pts.push(at(th0, -pm(th0) + (2 * pm(th0) * i) / N));
    for (let i = 1; i <= N; i++) {
      const th = th0 + ((th1 - th0) * i) / N;
      pts.push(at(th, pm(th)));
    }
    for (let i = 1; i <= N; i++) pts.push(at(th1, pm(th1) - (2 * pm(th1) * i) / N));
    for (let i = 1; i < N; i++) {
      const th = th1 - ((th1 - th0) * i) / N;
      pts.push(at(th, -pm(th)));
    }
    return pts;
  })();
  const visorPts = sphereRegion(L, Hc, R * 1.0, visorLoop, visIn);
  // V5: short dark hair at the back of the head, from under the helmet's back rim down to the nape (a rear view showed
  // a blank skin-coloured disc that read as a featureless face); on the skin sphere itself, so its outline is exact
  // its top edge runs just above the shell's rim (hidden under the shell), so no skin shows between hair and helmet
  const HAIR = {ps: 1.95, th1: -1.15};
  const rimTh = (ps: number) => {
    const k = Math.max(0, -0.5 * Math.cos(ps));
    return Math.asin(0.12 / Math.sqrt(1 + k * k)) - Math.atan(k);
  };
  const hairIn = (d: V3) => {
    const q = loc(d);
    const th = Math.asin(Math.max(-1, Math.min(1, q.u)));
    const ps = Math.atan2(q.l, q.f);
    return Math.abs(ps) > HAIR.ps && th < rimTh(ps) + 0.06 && th > HAIR.th1;
  };
  const hairLoop = (() => {
    const at = (th: number, ps: number) => HD(Math.cos(th) * Math.cos(ps), Math.sin(th), Math.cos(th) * Math.sin(ps));
    const pts: V3[] = [];
    const N = 16, a0 = HAIR.ps, a1 = 2 * Math.PI - HAIR.ps;
    for (let i = 0; i <= N; i++) {
      const ps = a0 + ((a1 - a0) * i) / N;
      pts.push(at(rimTh(ps) + 0.06, ps));
    }
    for (let i = 1; i <= N / 2; i++) pts.push(at(rimTh(a1) + 0.06 + ((HAIR.th1 - rimTh(a1) - 0.06) * i) / (N / 2), a1));
    for (let i = 1; i <= N; i++) pts.push(at(HAIR.th1, a1 - ((a1 - a0) * i) / N));
    for (let i = 1; i < N / 2; i++) pts.push(at(HAIR.th1 + ((rimTh(a0) + 0.06 - HAIR.th1) * i) / (N / 2), a0));
    return pts;
  })();
  const hairPts = sphereRegion(L, Hc, R * 0.93, hairLoop, hairIn);
  const visVisor = visorPts.length > 2;
  // centre stripe over the shell crown, from the brow rim to the back rim (clipped to the shell outline below)
  const stripe = circ3(Hc, j.hF, j.hU, R * 1.06, 40, 0.14, Math.PI + 0.36).filter((q) => facing(q, s3(q, Hc)) > 0);
  // ears and the earbud: thin disks on the side of the head, foreshortened with the turn (edge-on as they go out of
  // sight, so nothing pops)
  const disk = (c: V3, ra: V3, rb: V3, n = 20) => proj(L, Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return a3(c, a3(m3(ra, Math.cos(a)), m3(rb, Math.sin(a))));
  }));
  const ear = (s: number) => {
    const c = a3(a3(Hc, m3(j.hL, s * R * 0.9)), m3(j.hU, -0.03));
    const fc = facing(c, m3(j.hL, s));
    if (fc <= 0) return null;
    const earD = polyD(disk(c, m3(j.hF, 0.028), m3(j.hU, 0.038)));
    const budC = a3(c, m3(j.hL, s * 0.018));
    const bud = p(budC);
    const glowR = (0.014 + 0.03 * coach) * bud.k;
    return (
      <g key={`ear${s}`}>
        <path d={earD} fill={shade(GEAR.skin, 0.08)} stroke="#172B3A" strokeWidth={f2(w * 1.6)} strokeLinejoin="round" paintOrder="stroke" />
        {s === (j.ear ?? 1) && (
          <g>
            {coach > 0.01 && <circle cx={f2(bud.x)} cy={f2(bud.y)} r={f2(glowR)} fill={GEAR.coach} opacity={0.35 * coach * Math.min(1, fc * 4)} />}
            <path d={polyD(disk(budC, m3(j.hF, 0.017), m3(j.hU, 0.017)))} fill="#1D232B" stroke="#0B1218" strokeWidth={f2(w)} strokeLinejoin="round" />
            <path d={polyD(disk(a3(budC, m3(j.hL, s * 0.004)), m3(j.hF, 0.006), m3(j.hU, 0.006), 12))} fill={coach > 0.05 ? '#9BE8FF' : GEAR.coach} />
          </g>
        )}
      </g>
    );
  };
  // chin strap from below the ear to under the chin (visible part only)
  const strap = (s: number) => {
    const pts: V3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const d = n3(a3(a3(m3(j.hL, s * (1 - t) * 0.95), m3(j.hF, t * 0.6)), m3(j.hU, -0.35 - 0.45 * t)));
      pts.push(a3(Hc, m3(d, R * 0.95)));
    }
    const vis = pts.filter((q) => facing(q, s3(q, Hc)) > 0);
    return vis.length > 1 ? <path key={`st${s}`} d={curveD(proj(L, vis))} stroke="#2A2F37" strokeWidth={f2(0.012 * p(Hc).k)} fill="none" strokeLinecap="round" /> : null;
  };
  // a highlight across the visor: the visible part of a short arc on the visor surface, clipped to the visor outline
  const visorGloss = visVisor ? (() => {
    const arcPts = Array.from({length: 9}, (_, i) => a3(Hc, m3(HD(1, 0.23, 0.35 - (0.4 * i) / 8), R * 1.0))).filter((q) => facing(q, s3(q, Hc)) > 0);
    if (arcPts.length < 2) return null;
    return (
      <g>
        <defs>
          <clipPath id={`${id}-vc`}>
            <path d={polyD(visorPts)} />
          </clipPath>
        </defs>
        <path clipPath={`url(#${id}-vc)`} d={curveD(proj(L, arcPts))} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={f2(0.016 * p(Hc).k)} fill="none" strokeLinecap="round" />
      </g>
    );
  })() : null;
  const head = !vis(Hc, a3(Hc, m3(j.hU, R)), a3(Hc, m3(j.hF, R))) ? null : (
    <g key="head">
      <path d={skin.d} fill={GEAR.skin} stroke="#172B3A" strokeWidth={f2(w * 2)} paintOrder="stroke" />
      {hairPts.length > 2 && <path d={polyD(hairPts)} fill="#5A4231" />}
      {ear(-1)}
      {ear(1)}
      {strap(1)}
      {strap(-1)}
      {helmetPts.length > 2 && <Shape id={`${id}-hel`} d={polyD(helmetPts)} pts={helmetPts} color={GEAR.helmet} w={w} k={1.2} />}
      {helmetPts.length > 2 && stripe.length > 1 && (
        <g>
          <defs>
            <clipPath id={`${id}-hc`}>
              <path d={polyD(helmetPts)} />
            </clipPath>
          </defs>
          <path clipPath={`url(#${id}-hc)`} d={curveD(proj(L, stripe))} stroke={GEAR.helmetStripe} strokeWidth={f2(0.03 * p(Hc).k)} fill="none" strokeLinecap="butt" />
        </g>
      )}
      {visVisor && <Shape id={`${id}-vis`} d={polyD(visorPts)} pts={visorPts} color={GEAR.visor} w={w} k={0.9} />}
      {visorGloss}
    </g>
  );

  // V5 (final): the torso as an elliptic cylinder (the jacket's chest section, hem to shoulders), and how far a point
  // is in front of it along its line of sight: the depth at which the sight line enters the torso (or, if it misses,
  // passes closest to its axis) minus the point's own depth
  const TOR = (() => {
    const ax0 = s3(j.S, j.P), len = l3(ax0), u = m3(ax0, 1 / len);
    const l = n3(s3(j.chL, m3(u, d3(j.chL, u))));
    const f0 = c3(u, l);
    return {u, l, f: d3(f0, j.chF) < 0 ? m3(f0, -1) : f0, len, rx: 0.172, ry: 0.118};
  })();
  const inFront = (q: V3) => {
    const dq = s3(q, cam), dist = l3(dq), v = m3(dq, 1 / dist);
    const w0 = s3(cam, j.P);
    const al = d3(w0, TOR.l) / TOR.rx, af = d3(w0, TOR.f) / TOR.ry, au = d3(w0, TOR.u);
    const vl = d3(v, TOR.l) / TOR.rx, vf = d3(v, TOR.f) / TOR.ry, vu = d3(v, TOR.u);
    const A = vl * vl + vf * vf, Bq = 2 * (al * vl + af * vf), C = al * al + af * af - 1;
    let tRef = A > 1e-9 ? -Bq / (2 * A) : dist + 1;
    const disc = Bq * Bq - 4 * A * C;
    if (A > 1e-9 && disc > 0) {
      const sq = Math.sqrt(disc);
      let t0 = (-Bq - sq) / (2 * A), t1 = (-Bq + sq) / (2 * A);
      const h0 = -0.06 * TOR.len, h1 = TOR.len;
      if (Math.abs(vu) > 1e-9) {
        const s0 = (h0 - au) / vu, s1 = (h1 - au) / vu;
        t0 = Math.max(t0, Math.min(s0, s1));
        t1 = Math.min(t1, Math.max(s0, s1));
      } else if (au < h0 || au > h1) t1 = t0 - 1;
      if (t1 > t0 && t0 > 0) tRef = t0;
    }
    return tRef - dist;
  };
  // V5 (final): the part of an arm that is in front of the torso, as a screen region. For sections along each tube of
  // the arm (upper arm; forearm with glove and device), the run of its front surface that the line of sight reaches
  // before the torso is found by sampling across it; the region joins those runs (and reaches past the tube's edge,
  // to take in its outline, the glove and the device, only where the run reaches the edge). The arm is always drawn
  // behind the torso, and an opaque copy clipped to this region in front, so a change of order never pops and nothing
  // shows through a sleeve (the first V5 cut faded a whole copy in and out).
  const WS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  const tubeRegion = (A: V3, Bp: V3, ra: number, rb: number, pad: number) => {
    const dv = s3(Bp, A), ln = l3(dv);
    if (ln < 1e-4) return null;
    const dn = m3(dv, 1 / ln);
    const mid = lerp3(A, Bp, 0.5);
    const toCam = n3(s3(cam, mid));
    const u0 = c3(dn, toCam), ul = l3(u0);
    if (ul < 0.05) return null;
    const u = m3(u0, 1 / ul);
    const f1 = c3(u, dn);
    const fc = d3(f1, toCam) < 0 ? m3(f1, -1) : f1;
    const NS = 10;
    const runs: {c: V3; r: number; lo: number; hi: number}[] = [];
    let any = false;
    for (let i = 0; i <= NS; i++) {
      const sv = i / NS, c = lerp3(A, Bp, sv), r = ra + (rb - ra) * sv;
      const m = WS.map((wv) => inFront(a3(c, m3(a3(m3(u, wv), m3(fc, Math.sqrt(1 - wv * wv))), r))));
      const pos = m.map((x) => x > 0);
      const i0 = pos.indexOf(true), i1 = pos.lastIndexOf(true);
      if (i0 < 0) {
        const im = m.indexOf(Math.max(...m));
        runs.push({c, r, lo: WS[im], hi: WS[im]});
        continue;
      }
      any = true;
      const cross = (a: number, b: number) => WS[a] + ((WS[b] - WS[a]) * (0 - m[a])) / (m[b] - m[a]);
      runs.push({c, r, lo: i0 === 0 ? -1 : cross(i0 - 1, i0), hi: i1 === WS.length - 1 ? 1 : cross(i1, i1 + 1)});
    }
    if (!any) return null;
    const pt = (c: V3, r: number, wv: number) => {
      const E = 1 + pad / r, aw = Math.abs(wv);
      const g = aw <= 0.8 ? wv : Math.sign(wv) * (0.8 + ((aw - 0.8) / 0.2) * (E - 0.8));
      return p(a3(c, m3(a3(m3(u, g), m3(fc, Math.sqrt(Math.max(0, 1 - wv * wv)))), r)));
    };
    // the ends reach past the tube's end by its radius (the rounded cap) and the pad
    const r0 = runs[0], r1 = runs[NS];
    const cap0 = {...r0, c: a3(r0.c, m3(dn, -(ra + pad)))}, cap1 = {...r1, c: a3(r1.c, m3(dn, rb + pad))};
    const all = [cap0, ...runs, cap1];
    return polyD([...all.map((q) => pt(q.c, q.r, q.lo)), ...all.reverse().map((q) => pt(q.c, q.r, q.hi))]);
  };
  const padI = (3 * w) / kc;
  const armRegion = (sh: V3, el: V3, wr: V3) => {
    if (!vis(sh, el, wr)) return [];
    const fd = forearm(wr, el);
    return [
      tubeRegion(sh, el, 0.064, 0.052, 0.012 + padI),
      tubeRegion(el, a3(wr, m3(fd, 0.15)), 0.052, 0.048, 0.04 + padI),
    ].filter((x): x is string => !!x);
  };

  // order: shoes below their top plane's camera side, legs (far first, cut at the shoe top when seen from above),
  // shoes seen from below, arms behind the torso, neck, torso, collar (with the neck rising out of it), head, the
  // in-front parts of the arms
  const sF = shoe('sf', j.ankF, j.kneeF, j.hipF), sR = shoe('sr', j.ankR, j.kneeR, j.hipR);
  const shoeList = [sF, sR].sort((a, b) => b.z - a.z);
  const shoesFirst = shoeList.filter((s) => s.up).map((s) => s.el);
  const shoesAfter = shoeList.filter((s) => !s.up).map((s) => s.el);
  const legCut = (k: string, el: React.ReactNode, sh: typeof sF) =>
    !el ? null : sh.up && sh.clip ? (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-${k}c`}>
            <path d={sh.clip} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-${k}c)`}>{el}</g>
      </g>
    ) : (
      <g key={k}>{el}</g>
    );
  const lF = legCut('lfx', legF, sF), lR = legCut('lrx', legR, sR);
  const legs = zF > zR ? [lF, lR] : [lR, lF];
  const arms = [
    {z: armFz, k: 0, el: arm('af', j.shF, j.elbF, j.wriF, true), reg: armRegion(j.shF, j.elbF, j.wriF)},
    {z: armRz, k: 1, el: arm('ar', j.shR, j.elbR, j.wriR, false), reg: armRegion(j.shR, j.elbR, j.wriR)},
  ].sort((a, b) => b.z - a.z);
  const behind = arms.map((a) => <g key={`b${a.k}`}>{a.el}</g>);
  const before = arms
    .filter((a) => a.reg.length > 0)
    .map((a) => (
      <g key={`f${a.k}`}>
        <defs>
          <clipPath id={`${id}-ac${a.k}`}>
            {a.reg.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-ac${a.k})`}>{a.el}</g>
      </g>
    ));
  if (pov) {
    // V3: the camera in the head sees the whole legs and the shoes
    return (
      <g>
        {shoesFirst}
        {legs}
        {shoesAfter}
      </g>
    );
  }
  return (
    <g>
      {shoesFirst}
      {legs}
      {shoesAfter}
      {behind}
      {neck}
      {torso}
      {collar}
      {head}
      {before}
    </g>
  );
};
export type {P2};
export {lit};
