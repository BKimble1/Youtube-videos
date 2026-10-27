// D3 (518-543, "injector."): a brief flat cutaway on D2's last framing (a match cut: the same view, now in section
// through the launch tube, the injector and the clear silicone along the needle's axis). The cut faces are hatched (the
// clear tube's walls, the barrel, the collar, the aluminium cradle), the silicone a pale clear-aqua cut face, the spring
// its wire sections. The needle sits 5 mm into the silicone, the barrel's rear still in the tube. At 17.30 s the foil
// seal on the plunger's activator capsule splits and gas forms behind the plunger (bubbles, a faint fizz); the plunger
// runs forward along the barrel (17.35-17.92 s), the amber dose goes down the needle's bore and blooms softly in the
// silicone ahead of the tip (complete by about 18.0 s, inside the shot). The insect is drawn whole (its near antenna is
// cut away with the near half). Locked off.
import React from 'react';
import {V2, Frame, toW} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {clamp, rnd, noise1, lerp} from '../../../lib/ease';
import {shade as shadeC, lit as litC} from '../../../lib/color';
import {INJ, PACK} from '../../../rig/gear';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, G2} from '../../roach/Gear2D';
import {View, P, f2, polyD} from '../../roach/ortho';
import {LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {dPoseFull, dLaunch, dPlunger, dBloom, D_FACE, D_SEAL, D_PLUNGE0} from './trial';
import {LabRoomMM} from './room';
import {d2View} from './D2';

const R = shotRange('D3');
/** D2's last framing, held */
/** D2's last framing, then a slow follow of the dose down the needle into the silicone (motivated by the flow) */
export const d3View = (f: number): View => {
  const v = d2View(R.from - 1);
  const u = clamp((f - R.from) / (R.to - R.from));
  const e = u * u * (3 - 2 * u);
  return {...v, ox: v.ox - 7 * v.s * e};
};

/** delivered fraction of the dose (the bloom's volume follows it) */
export const d3Bloom = dBloom;

const HATCH = (id: string, col: string, w = 9) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width={w} height={w} patternTransform="rotate(45)">
    <rect width={w} height={w} fill="none" />
    <path d={`M0,0 V${w}`} stroke={col} strokeWidth={Math.max(1.2, w * 0.18)} />
  </pattern>
);

export const D3: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d3View(f);
  const s = v.s;
  const id = `d3f${f}`;
  const pose0 = dPoseFull(t);
  // the cutaway removes the near half: the near antenna (z > 0) goes with it
  const pose = {...pose0, antR: pose0.antL};
  const fr = pose0.frame;
  const inj: Frame = dPoseFull(t, false).frame;
  const d = dLaunch(t);
  const pl = dPlunger(t);
  const T = PACK.tube;
  const ty = T.a[1];
  const ink = Math.max(2.4, Math.min(5, 0.13 * s + 0.6));
  // body-frame and injector-frame section points (z = 0)
  const B = (x: number, y: number): V2 => P(v, toW(fr, [x, y, 0]));
  const I = (x: number, y: number): V2 => P(v, toW(inj, [d.injRear + x, ty + y, 0]));
  const W = (x: number, y: number): V2 => P(v, [x, y, 0]);
  const box = (fn: (x: number, y: number) => V2, x0: number, x1: number, y0: number, y1: number) => polyD([fn(x0, y0), fn(x1, y0), fn(x1, y1), fn(x0, y1)]);
  const hatchW = Math.max(7, 0.42 * s);
  // ---- timings
  const seal = clamp((t - D_SEAL) / 0.12); // the foil splits
  const gasOn = t >= D_SEAL;
  const bloom = dBloom(t);
  // ---- injector stations (injector x from the barrel's rear)
  const rr = INJ.barrelR, wall = 0.32, ri = rr - wall;
  const prR = 0.6 + (INJ.barrelLen - INJ.plungerLen - 1) * pl; // plunger rear
  const capR = prR + 1.35; // activator capsule (rear part of the plunger)
  const prF = prR + INJ.plungerLen - 0.6; // plunger front (rubber)
  const neck = INJ.barrelLen - 0.6;
  const nA = INJ.collarAt + 0.9, nB = INJ.barrelLen + 1.2 + INJ.needleLen;
  const nR = 0.26, bore = 0.1;
  // ---- the bloom: a few soft overlapping lobes ahead of the tip
  const tip = I(nB, 0);
  const bR = 2.5 * Math.cbrt(Math.max(0, bloom)) * s;
  const lobes: [number, number, number][] = [[0.55, 0, 1], [0.35, 0.45, 0.72], [0.4, -0.5, 0.7], [0.15, 0.1, 0.8], [0.8, 0.25, 0.6]];
  // ---- gas bubbles in the chamber between the barrel's rear wall and the plunger
  const chamber0 = 0.5, chamber1 = prR;
  const bubbles: React.ReactNode[] = [];
  if (gasOn) {
    for (let k = 0; k < 26; k++) {
      const born = D_SEAL + 0.03 + rnd(k, 5) * 0.55;
      if (t < born) continue;
      const age = t - born;
      const u = clamp(0.06 + rnd(k, 7) * 0.9 + 0.05 * noise1(t * 2 + k, 2));
      const vv = (rnd(k, 9) * 2 - 1) * 0.82 + 0.06 * noise1(t * 3 + k * 1.7, 4);
      const r = (0.12 + rnd(k, 11) * 0.3) * Math.min(1, age / 0.12);
      const len = Math.max(0, chamber1 - chamber0);
      const x = chamber0 + u * len;
      if (len < 0.25) {
        // the first fizz: tiny beads right at the opened seal
        if (k > 8) continue;
      }
      const rr2 = Math.min(r, Math.max(0.08, len * 0.45));
      const c = I(Math.min(chamber1 - rr2 * 0.9, Math.max(chamber0 + rr2, x)), vv * (ri - rr2));
      bubbles.push(<circle key={k} cx={f2(c[0])} cy={f2(c[1])} r={f2(rr2 * s)} fill="#F7FCFF" stroke="#8FB6C8" strokeWidth={f2(Math.max(1, 0.05 * s))} opacity={0.95} />);
    }
  }
  // ---- spring wire sections (top and bottom rows) and the far half's diagonals
  const sA = T.a[0] + 1.5, sB = d.injRear + 1.4 * d.recoil;
  const coils = 9, pitch = (sB - sA) / coils, wr = 0.42, sr2 = 2.6;
  const springEls: React.ReactNode[] = [];
  for (let k = 0; k < coils; k++) {
    const xt = sA + (k + 0.25) * pitch, xb = sA + (k + 0.75) * pitch;
    const a = B(xt, ty + sr2), b = B(xb, ty - sr2), c2 = B(xt + pitch, ty + sr2);
    springEls.push(<path key={`f${k}`} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])} M${f2(b[0])},${f2(b[1])} L${f2(c2[0])},${f2(c2[1])}`} stroke={shadeC(G2.spring, 0.15)} strokeWidth={f2(wr * 1.4 * s)} opacity={0.55} strokeLinecap="round" />);
  }
  for (let k = 0; k < coils; k++) {
    for (const [x, y] of [[sA + (k + 0.25) * pitch, ty + sr2], [sA + (k + 0.75) * pitch, ty - sr2]] as [number, number][]) {
      const c = B(x, y);
      springEls.push(<circle key={`c${k}${y}`} cx={f2(c[0])} cy={f2(c[1])} r={f2(wr * s)} fill={G2.spring} stroke={INK} strokeWidth={f2(ink * 0.6)} />);
    }
  }
  // ---- the seal: a bright foil disc on the capsule's rear face, splitting into two flaps
  const sx = prR;
  const sealEl = seal < 1e-3 ? (
    <path d={`M${f2(I(sx, ri)[0])},${f2(I(sx, ri)[1])} L${f2(I(sx, -ri)[0])},${f2(I(sx, -ri)[1])}`} stroke="#E9EEF2" strokeWidth={f2(0.16 * s)} />
  ) : (
    <g>
      {[1, -1].map((sd) => {
        const a = I(sx, sd * ri), m = I(sx - 0.55 * seal, sd * (ri - 0.75 - 0.1 * seal));
        return <path key={sd} d={`M${f2(a[0])},${f2(a[1])} Q${f2(I(sx - 0.1, sd * (ri - 0.4))[0])},${f2(I(sx - 0.1, sd * (ri - 0.4))[1])} ${f2(m[0])},${f2(m[1])}`} stroke="#E9EEF2" strokeWidth={f2(0.14 * s)} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
  // capsule reagent granules
  const gran = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const c = I(prR + 0.25 + rnd(k, 21) * 0.85, (rnd(k, 23) * 2 - 1) * (ri - 0.35));
    return <circle key={k} cx={f2(c[0])} cy={f2(c[1])} r={f2((0.1 + rnd(k, 25) * 0.08) * s)} fill="#D9CFA0" />;
  });
  // the reagent fizzes once the seal is open: beads rising out of the capsule toward the opening
  const fizz = gasOn
    ? [0, 1, 2, 3, 4, 5].map((k) => {
        const ph = ((t - D_SEAL) * (2.2 + rnd(k, 31)) + rnd(k, 33)) % 1;
        const c = I(prR + 1.2 - ph * 1.15, (rnd(k, 35) * 2 - 1) * (ri - 0.4));
        return <circle key={`z${k}`} cx={f2(c[0])} cy={f2(c[1])} r={f2((0.08 + 0.1 * rnd(k, 37)) * s)} fill="#FFFFFF" stroke="#8FB6C8" strokeWidth={f2(Math.max(0.8, 0.03 * s))} opacity={Math.min(1, (t - D_SEAL) * 8)} />;
      })
    : [];
  // the seal's pop: a brief bright ring where the foil splits
  const pop = gasOn && t < D_SEAL + 0.2 ? (() => {
    const k = (t - D_SEAL) / 0.2;
    const c = I(prR, 0);
    return <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2((0.3 + 0.5 * k) * s)} ry={f2(ri * (0.6 + 0.4 * k) * s)} fill="none" stroke="#FFFFFF" strokeWidth={f2(0.12 * s * (1 - k))} opacity={1 - k} />;
  })() : null;
  // ---- the latch line's burnt tails at the mouth holes, the coil
  const mouthX = T.b[0] - 0.8;
  const tail = (sd: number) => {
    const a = B(mouthX, ty + sd * T.r), b = B(mouthX + 0.35, ty + sd * (T.r + 0.7)), c = B(mouthX + 0.9, ty + sd * (T.r + 0.95));
    return <path key={sd} d={`M${f2(a[0])},${f2(a[1])} Q${f2(b[0])},${f2(b[1])} ${f2(c[0])},${f2(c[1])}`} stroke={G2.line} strokeWidth={f2(0.11 * s)} fill="none" strokeLinecap="round" />;
  };
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        {HATCH(`${id}-hg`, '#9FB7C4', hatchW)}
        {HATCH(`${id}-ha`, '#7E8C97', hatchW)}
        {HATCH(`${id}-hs`, LAB2.siliconeDeep, hatchW * 1.6)}
        <radialGradient id={`${id}-bl`}>
          <stop offset="0" stopColor="#F2A93B" stopOpacity={0.95} />
          <stop offset="0.55" stopColor="#F2A93B" stopOpacity={0.75} />
          <stop offset="1" stopColor="#F2A93B" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-bh`}>
          <stop offset="0" stopColor="#F7C46E" stopOpacity={0.55} />
          <stop offset="1" stopColor="#F7C46E" stopOpacity={0} />
        </radialGradient>
      </defs>
      <LabRoomMM id={`${id}room`} v={v} blur={9} plate={1.7} tray={[-400, 400, -300, 420]} />
      {/* ---- the target in section: the aluminium cradle (base and backing plate) and the silicone */}
      <path d={box(W, D_FACE - 5, D_FACE + 37, -3, 0)} fill={LAB2.alu} stroke={INK} strokeWidth={f2(ink)} />
      <path d={box(W, D_FACE - 5, D_FACE + 37, -3, 0)} fill={`url(#${id}-ha)`} opacity={0.6} />
      <path d={box(W, D_FACE + 30, D_FACE + 33.5, 0, 39)} fill={LAB2.aluDeep} stroke={INK} strokeWidth={f2(ink)} />
      <path d={box(W, D_FACE + 30, D_FACE + 33.5, 0, 39)} fill={`url(#${id}-ha)`} opacity={0.6} />
      <path d={box(W, D_FACE, D_FACE + 30, 0, 34)} fill={litC(LAB2.silicone, 0.12)} stroke={INK} strokeWidth={f2(ink)} />
      <path d={box(W, D_FACE, D_FACE + 30, 0, 34)} fill={`url(#${id}-hs)`} opacity={0.35} />
      <path d={box(W, D_FACE + 0.6, D_FACE + 30, 33.2, 34)} fill="#FFFFFF" opacity={0.35} />
      {/* ---- the bloom (under the needle) */}
      {bloom > 0 && (
        <g>
          <ellipse cx={f2(tip[0] + 0.5 * bR)} cy={f2(tip[1])} rx={f2(bR * 2.1)} ry={f2(bR * 1.9)} fill={`url(#${id}-bh)`} />
          {lobes.map(([dx, dy, k], i) => (
            <circle key={i} cx={f2(tip[0] + dx * bR)} cy={f2(tip[1] + dy * bR)} r={f2(bR * k)} fill={`url(#${id}-bl)`} />
          ))}
        </g>
      )}
      {/* ---- the insect (whole, behind the cut tube) and its backpack (the tube is drawn here in section) */}
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={fr} g={{kind: 'none', noWires: false}} />}} />
      {/* ---- the launch tube in section */}
      <path d={box(B, T.a[0], T.b[0], ty - T.r, ty + T.r)} fill={G2.glass} opacity={0.5} />
      {springEls}
      {/* the injector: barrel interior (gas, capsule, plunger, dose), walls, collar, needle */}
      <path d={box(I, 0.5, neck, -ri, ri)} fill="#F4FAFC" />
      {pl < 0.999 && <path d={box(I, prF, neck, -ri, ri)} fill={G2.dose} />}
      {pl < 0.999 && <path d={box(I, prF, neck, ri * 0.35, ri * 0.75)} fill={litC(G2.dose, 0.35)} opacity={0.7} />}
      {gasOn && chamber1 > chamber0 && <path d={box(I, chamber0, chamber1, -ri, ri)} fill="#E3F2F8" />}
      {bubbles}
      <path d={box(I, prR, capR, -ri, ri)} fill="#F4F1DC" stroke={INK} strokeWidth={f2(ink * 0.6)} />
      {gran}
      {fizz}
      <path d={box(I, capR, prF, -ri, ri)} fill={G2.plunger} stroke={INK} strokeWidth={f2(ink * 0.6)} />
      {[0.35, 0.7].map((k) => {
        const a = I(capR + k * (prF - capR), ri), b = I(capR + k * (prF - capR), -ri);
        return <path key={k} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke={shadeC(G2.plunger, 0.35)} strokeWidth={f2(0.12 * s)} />;
      })}
      {sealEl}
      {pop}
      {/* barrel walls (cut, hatched), the rear wall, the front wall with the channel to the needle */}
      {[[-rr, -ri], [ri, rr]].map(([y0, y1], i) => (
        <g key={i}>
          <path d={box(I, 0, INJ.barrelLen, y0, y1)} fill="#E8F1F4" stroke={INK} strokeWidth={f2(ink * 0.7)} />
          <path d={box(I, 0, INJ.barrelLen, y0, y1)} fill={`url(#${id}-hg)`} opacity={0.8} />
        </g>
      ))}
      <path d={box(I, 0, 0.5, -ri, ri)} fill="#C9D6DC" stroke={INK} strokeWidth={f2(ink * 0.6)} />
      {[[-ri, -bore], [bore, ri]].map(([y0, y1], i) => (
        <path key={i} d={box(I, neck, INJ.barrelLen, y0, y1)} fill="#C9D6DC" stroke={INK} strokeWidth={f2(ink * 0.5)} />
      ))}
      {/* the collar (cut) and the needle: steel walls, the bore (amber once the dose flows) */}
      {[[-INJ.collarR, -nR], [nR, INJ.collarR]].map(([y0, y1], i) => (
        <g key={`co${i}`}>
          <path d={box(I, INJ.barrelLen, nA, y0, y1)} fill={G2.collar} stroke={INK} strokeWidth={f2(ink * 0.7)} />
          <path d={box(I, INJ.barrelLen, nA, y0, y1)} fill={`url(#${id}-ha)`} opacity={0.7} />
        </g>
      ))}
      <path d={polyD([I(INJ.barrelLen, -nR), I(nB - 0.9, -nR), I(nB, nR), I(INJ.barrelLen, nR)])} fill="#B7C3CA" stroke={INK} strokeWidth={f2(ink * 0.55)} strokeLinejoin="round" />
      <path d={box(I, neck, nB - 0.55, -bore, bore)} fill={pl > 0.01 || bloom > 0 ? G2.dose : '#F4FAFC'} />
      {pl > 0.01 && pl < 0.999 && (() => {
        // the flow: a bright bead running down the bore
        const u = ((t - D_PLUNGE0) * 3.2) % 1;
        const c = I(lerp(neck, nB - 0.6, u), 0);
        return <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(bore * 1.6 * s)} fill="#FFE2A6" />;
      })()}
      {/* tube walls (cut, hatched), rims, the burnt line's tails and the coil */}
      {[[-T.r, -T.r + 0.45], [T.r - 0.45, T.r]].map(([y0, y1], i) => (
        <g key={`tw${i}`}>
          <path d={box(B, T.a[0], T.b[0], ty + y0, ty + y1)} fill={G2.glass} stroke={INK} strokeWidth={f2(ink * 0.7)} />
          <path d={box(B, T.a[0], T.b[0], ty + y0, ty + y1)} fill={`url(#${id}-hg)`} opacity={0.75} />
        </g>
      ))}
      {[tail(1), tail(-1)]}
      {(() => {
        const a = B(T.a[0] + 3, ty + T.r * 0.62), b = B(T.b[0] - 4, ty + T.r * 0.62);
        return <path d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke="#FFFFFF" strokeWidth={f2(0.25 * s)} strokeLinecap="round" opacity={0.6} />;
      })()}
      {PACK.clamps.map((x, i) => (
        <g key={`cl${i}`}>
          <path d={box(B, x - 1.1, x + 1.1, ty - T.r - 0.8, ty - T.r + 0.3)} fill={G2.saddle} stroke={INK} strokeWidth={f2(ink * 0.7)} />
        </g>
      ))}
    </svg>
  );
};
