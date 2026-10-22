// Cell scale: the inside of one epithelial cell (interior units; the cell is the tissue cell × CI_SCALE, centred at 0).
// Membrane bilayer, cytoplasm with cytoskeleton, ER sheets, Golgi stack, mitochondria with cristae, vesicles,
// ribosomes, and the nucleus (double envelope with pores, nucleolus, chromatin fibres). One chromatin fibre passes
// through DNA_ANCHOR: the dive continues into the DNA world from there.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, closedPath, openPath, rand, noise, mixHex, smooth} from '../../kit/core';
import {P} from '../palette';
import {cellOutline, R} from './tissue';

export const CI_SCALE = 9;              // interior units per tissue unit
export const NUC: Pt = [36, -18];       // nucleus centre (interior units)
export const NUC_R = 196;
export const DNA_ANCHOR: Pt = [96, -4]; // point on the highlighted chromatin fibre
export const DNA_SCALE = 30;            // DNA-world units per interior unit

export const Interior: React.FC<{t: number; cam: Cam; seed: number; mut?: number; pulse?: number; bg?: boolean}> = ({t, cam, seed, mut = 0, pulse = 0, bg = true}) => {
  const r = R * CI_SCALE;
  const outline = cellOutline(r, seed, t);
  const d = closedPath(outline, 1);
  const lod = cam.z; // px per interior unit
  const nucCol = mixHex(P.nucleus, P.mutant, mut * 0.5);
  // chromatin fibres (deterministic squiggles inside the nucleus); fibre 0 passes through the anchor
  const fibres: string[] = [];
  for (let k = 0; k < 16; k++) {
    const pts: Pt[] = [];
    const y0 = k === 0 ? DNA_ANCHOR[1] : NUC[1] + (rand(k * 7) - 0.5) * NUC_R * 1.5;
    const x0 = k === 0 ? DNA_ANCHOR[0] - 140 : NUC[0] + (rand(k * 9) - 0.5) * NUC_R * 1.2 - 60;
    for (let m = 0; m < 9; m++) {
      const x = x0 + m * 32;
      const y = y0 + (k === 0 ? 0 : 26 * noise(m * 0.7 + t * 0.15, k)) + (k === 0 ? 7 * Math.sin(m * 1.3) * (m < 3 || m > 5 ? 1 : 0) : 0);
      pts.push([x, y]);
    }
    fibres.push(openPath(pts.filter(([x, y]) => Math.hypot(x - NUC[0], y - NUC[1]) < NUC_R * 0.92), 1));
  }
  const mitos = Array.from({length: 8}, (_, k) => {
    const a = rand(seed * 3 + k) * Math.PI * 2 + 0.2 * noise(t * 0.2, k);
    const dd = r * (0.62 + 0.18 * rand(seed * 5 + k));
    return {x: Math.cos(a) * dd, y: Math.sin(a) * dd, ang: (a * 180) / Math.PI + 90 + 20 * rand(k), len: 46 + 20 * rand(k * 3)};
  });
  return (
    <g>
      {bg && <rect width={W} height={H} fill={P.tissueBg} />}
      <g transform={camTransform(cam)}>
        {/* membrane: bilayer */}
        <path d={d} fill={P.tissueDeep} />
        <path d={d} fill={P.cyto} transform="scale(0.965)" />
        <path d={d} fill="url(#volSoft)" transform="scale(0.965)" />
        <path d={d} fill="none" stroke={P.tissueLight} strokeWidth={5} transform="scale(0.985)" />
        <path d={d} fill="none" stroke={P.tissueLight} strokeWidth={5} transform="scale(0.95)" />
        {lod > 1.2 && <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={3.2} strokeDasharray="0.1 9" strokeLinecap="round" opacity={0.6} transform="scale(0.968)" />}
        {/* cytoskeleton */}
        <g stroke={P.cytoDeep} strokeWidth={1.6} fill="none" opacity={0.55}>
          {Array.from({length: 22}, (_, k) => {
            const a = (k / 22) * Math.PI * 2 + rand(k) * 0.2;
            return <path key={k} d={`M ${NUC[0] + Math.cos(a) * NUC_R * 1.05} ${NUC[1] + Math.sin(a) * NUC_R * 1.05} Q ${Math.cos(a + 0.2) * r * 0.65} ${Math.sin(a + 0.2) * r * 0.65} ${Math.cos(a + 0.1) * r * 0.92} ${Math.sin(a + 0.1) * r * 0.92}`} />;
          })}
        </g>
        {/* ER sheets wrapping the nucleus */}
        <g fill="none" stroke={P.er} strokeLinecap="round">
          {[1.18, 1.3, 1.42].map((f, k) => (
            <path key={k} d={openPath(Array.from({length: 16}, (_, m) => {
              const a = -2.6 + (m / 15) * 2.9;
              const rr = NUC_R * f + 10 * Math.sin(m * 2.2 + k + t * 0.6);
              return [NUC[0] + Math.cos(a) * rr, NUC[1] + Math.sin(a) * rr] as Pt;
            }), 1)} strokeWidth={13} opacity={0.85} />
          ))}
        </g>
        {/* Golgi stack */}
        <g transform={`translate(${NUC[0] - 300} ${NUC[1] + 170}) rotate(-30)`} fill="none" stroke={P.golgi} strokeLinecap="round">
          {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M ${-70 + k * 6} ${k * 17} Q 0 ${k * 17 - 34} ${70 - k * 6} ${k * 17}`} strokeWidth={10} />)}
          {[0, 1, 2].map((k) => <circle key={k} cx={86 + k * 10} cy={10 + k * 14} r={8} fill={P.golgi} stroke="none" />)}
        </g>
        {/* mitochondria with cristae */}
        {mitos.map((m, k) => (
          <g key={k} transform={`translate(${m.x} ${m.y}) rotate(${m.ang})`}>
            <rect x={-m.len} y={-21} width={m.len * 2} height={42} rx={21} fill={mixHex(P.mito, '#B8502E', 0.3)} />
            <rect x={-m.len + 4} y={-17} width={m.len * 2 - 8} height={34} rx={17} fill={P.mito} />
            {lod > 0.8 && <path d={Array.from({length: Math.floor(m.len / 11)}, (_, q) => `M ${-m.len + 14 + q * 22} ${q % 2 ? -15 : 15} L ${-m.len + 14 + q * 22} ${q % 2 ? 4 : -4}`).join(' ')} stroke="#B8502E" strokeWidth={4} strokeLinecap="round" />}
            <rect x={-m.len + 4} y={-17} width={m.len * 2 - 8} height={34} rx={17} fill="url(#vol)" />
          </g>
        ))}
        {/* vesicles and ribosomes */}
        {Array.from({length: 26}, (_, k) => {
          const a = rand(seed * 11 + k) * Math.PI * 2, dd = r * (0.45 + 0.45 * rand(seed * 13 + k));
          return <circle key={k} cx={Math.cos(a) * dd + 6 * Math.sin(t * 0.8 + k)} cy={Math.sin(a) * dd} r={6 + 8 * rand(k * 5)} fill="#FFE4DA" stroke={P.golgi} strokeWidth={2} opacity={0.85} />;
        })}
        {lod > 0.7 && Array.from({length: 90}, (_, k) => {
          const a = rand(seed * 17 + k) * Math.PI * 2, dd = r * (0.38 + 0.55 * rand(seed * 19 + k));
          return <circle key={k} cx={Math.cos(a) * dd} cy={Math.sin(a) * dd} r={2.6} fill={P.er} opacity={0.8} />;
        })}
        {/* nucleus: double envelope with pores */}
        <circle cx={NUC[0]} cy={NUC[1]} r={NUC_R + 9} fill={P.envelope} />
        <circle cx={NUC[0]} cy={NUC[1]} r={NUC_R} fill={nucCol} />
        <circle cx={NUC[0]} cy={NUC[1]} r={NUC_R} fill="url(#nucVol)" />
        <g fill={P.cyto}>
          {Array.from({length: 30}, (_, k) => {
            const a = (k / 30) * Math.PI * 2;
            return <circle key={k} cx={NUC[0] + Math.cos(a) * (NUC_R + 4.5)} cy={NUC[1] + Math.sin(a) * (NUC_R + 4.5)} r={3.6} />;
          })}
        </g>
        <circle cx={NUC[0] - 60} cy={NUC[1] + 60} r={46} fill={P.nucleusDeep} />
        <circle cx={NUC[0] - 60} cy={NUC[1] + 60} r={46} fill="url(#nucVol)" />
        <g fill="none" strokeLinecap="round">
          {fibres.map((f, k) => <path key={k} d={f} stroke={k === 0 ? mixHex(P.chromatin, P.mutant, mut * 0.6) : P.chromatin} strokeWidth={k === 0 ? 8 : 6} opacity={k === 0 ? 0.95 : 0.6} />)}
        </g>
        {/* the mistakes: small sites along the fibres light up */}
        {mut > 0.01 && Array.from({length: 7}, (_, k) => {
          const on = smooth(mut * 7 - k);
          const x = NUC[0] + (rand(k * 23) - 0.5) * NUC_R * 1.1, y = NUC[1] + (rand(k * 29) - 0.5) * NUC_R * 1.1;
          return <circle key={k} cx={k === 0 ? DNA_ANCHOR[0] : x} cy={k === 0 ? DNA_ANCHOR[1] : y} r={10 + 6 * on} fill="url(#glowMut)" opacity={on} />;
        })}
        {pulse > 0.01 && <circle cx={NUC[0]} cy={NUC[1]} r={NUC_R * 1.4} fill="url(#glowMut)" opacity={pulse * 0.35} />}
      </g>
    </g>
  );
};
