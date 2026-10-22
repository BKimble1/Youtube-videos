// Organ scale inside the body world (body units). The lung lobe that holds the tumour gets a bronchial tree that
// branches down to alveolar sacs; one alveolus sits exactly on SITE.tumor and its wall carries the tissue lattice
// (TissuePattern scaled by 1/TISSUE_SCALE), so the dive hands off to the tissue world with the same cells on screen.
import React from 'react';
import {Cam, W, H} from '../../kit/cam';
import {P as Pt, closedPath, rand, smooth, clamp01, mixHex} from '../../kit/core';
import {P} from '../palette';
import {Body, BodyProps, LUNG_R, LIVER, SITE} from './body';
import {boundaryPathAt} from './tissue';

export const TISSUE_SCALE = 1250; // tissue units per body unit
export const ALV_R = 4;
/** liver-world point that sits on SITE.mets (the metastasis lands here) */
export const LIVER_ANCHOR: [number, number] = [0, 93];

type Seg = {a: Pt; b: Pt; w: number; lvl: number};
type Tip = {p: Pt; dir: number; lvl: number; target: boolean};
const MAXL = 7;
const buildTree = () => {
  const segs: Seg[] = [];
  const tips: Tip[] = [];
  const T: Pt = SITE.tumor;
  const go = (p: Pt, ang: number, len: number, w: number, lvl: number, seed: number, onTarget: boolean) => {
    let a2 = ang, l2 = len;
    if (onTarget) {
      const dx = T[0] - p[0], dy = T[1] - p[1];
      const dist = Math.hypot(dx, dy);
      a2 = Math.atan2(dy, dx);
      l2 = lvl === MAXL ? Math.max(0, dist - ALV_R * 1.6) : Math.min(len, dist * 0.55);
    }
    const b: Pt = [p[0] + Math.cos(a2) * l2, p[1] + Math.sin(a2) * l2];
    segs.push({a: p, b, w, lvl});
    if (lvl === MAXL) {
      tips.push({p: b, dir: a2, lvl, target: onTarget});
      return;
    }
    const spread = 0.42 + 0.18 * rand(seed);
    const pick = rand(seed * 3) < 0.5 ? 0 : 1;
    [-1, 1].forEach((sgn, k) => go(b, a2 + sgn * spread + (rand(seed * 7 + k) - 0.5) * 0.3, len * 0.74, w * 0.68, lvl + 1, seed * 2 + k + 1, onTarget && k === pick));
  };
  go([46, -510], Math.atan2(-440 + 510, 118 - 46) + 0.15, 34, 7.5, 0, 1, true);
  // a second lobar branch fills the lower lobe
  go([50, -480], 1.25, 40, 7, 1, 77, false);
  go([52, -520], -0.55, 30, 6, 1, 91, false);
  return {segs, tips};
};
const TREE = buildTree();

/** Alveolar sac: a grape cluster of air sacs around a tip (the target tip puts one sac exactly on SITE.tumor). */
const sacs = (tip: Tip, k: number) => {
  const out: {c: Pt; r: number}[] = [];
  if (tip.target) {
    out.push({c: SITE.tumor, r: ALV_R});
    for (let m = 0; m < 6; m++) {
      const a = tip.dir + Math.PI + (m - 2.5) * 0.9;
      out.push({c: [SITE.tumor[0] + Math.cos(a + Math.PI) * ALV_R * 1.85, SITE.tumor[1] + Math.sin(a + Math.PI) * ALV_R * 1.85], r: ALV_R * (0.8 + 0.25 * rand(k * 11 + m))});
    }
    return out;
  }
  for (let m = 0; m < 6; m++) {
    const a = tip.dir + (m - 2.5) * 0.8;
    out.push({c: [tip.p[0] + Math.cos(a) * 4, tip.p[1] + Math.sin(a) * 4], r: 2.4 + 1.2 * rand(k * 13 + m)});
  }
  return out;
};
const SACS = TREE.tips.flatMap((tip, k) => sacs(tip, k).map((s) => ({...s, target: tip.target})));

export const LungDefs: React.FC = () => (
  <>
    <pattern id="lungPat" patternUnits="userSpaceOnUse" width={14} height={12.12}>
      <rect width={14} height={12.12} fill={P.lungDeep} />
      {[[0, 0], [7, 0], [14, 0], [3.5, 6.06], [10.5, 6.06], [0, 12.12], [7, 12.12], [14, 12.12]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3.2} fill={P.lung} />
          <circle cx={x - 0.6} cy={y - 0.7} r={2.1} fill="#F7B6B2" opacity={0.55} />
        </g>
      ))}
    </pattern>
    <clipPath id="lobeClip"><path d={closedPath(LUNG_R)} /></clipPath>
  </>
);

/** Lung detail in body coordinates, fading in with zoom. */
export const LungDetail: React.FC<{t: number; z: number; tumor?: number; healthy?: number; massR?: number; massC?: [number, number]}> = ({t, z, tumor = 0, massR = 0, massC = [0, 0]}) => {
  const k = smooth((Math.log(z) - Math.log(1.6)) / (Math.log(5) - Math.log(1.6)));
  if (k <= 0) return null;
  const breathe = 1 + 0.012 * Math.sin(t * 1.4);
  return (
    <g opacity={k}>
      <g clipPath="url(#lobeClip)">
        <path d={closedPath(LUNG_R)} fill="url(#lungPat)" />
        <path d={closedPath(LUNG_R)} fill="url(#volSoft)" />
        {/* bronchi (pale cartilage tubes) with arteries alongside */}
        {TREE.segs.filter((s) => s.w * z > 0.5).map((s, i) => (
          <g key={i}>
            <line x1={s.a[0] + s.w * 0.7} y1={s.a[1]} x2={s.b[0] + s.w * 0.7} y2={s.b[1]} stroke={P.bloodLight} strokeWidth={s.w * 0.45} strokeLinecap="round" opacity={0.7} />
            <line x1={s.a[0]} y1={s.a[1]} x2={s.b[0]} y2={s.b[1]} stroke="#B9646A" strokeWidth={s.w * 1.15} strokeLinecap="round" />
            <line x1={s.a[0]} y1={s.a[1]} x2={s.b[0]} y2={s.b[1]} stroke="#FBD8D0" strokeWidth={s.w * 0.8} strokeLinecap="round" />
            <line x1={s.a[0] - s.w * 0.15} y1={s.a[1] - s.w * 0.15} x2={s.b[0] - s.w * 0.15} y2={s.b[1] - s.w * 0.15} stroke="#FFFFFF" strokeWidth={s.w * 0.22} strokeLinecap="round" opacity={0.5} />
          </g>
        ))}
        {/* alveolar sacs at the tips */}
        {SACS.filter((s) => s.r * z > 1.2).map((s, i) => (
          <g key={i} transform={`translate(${s.c[0]} ${s.c[1]}) scale(${breathe})`}>
            <circle r={s.r} fill={P.lungDeep} />
            <circle r={s.r * 0.94} fill={s.target ? '#F4AFA8' : P.lung} />
            <circle r={s.r * 0.94} fill="url(#vol)" />
            {s.r * z > 40 && (
              <g opacity={smooth((s.r * z - 40) / 80) * 0.5} fill="none" stroke={P.bloodLight} strokeWidth={s.r * 0.025} strokeLinecap="round">
                {Array.from({length: 9}, (_, m) => {
                  const a0 = rand(m * 7 + i) * Math.PI * 2, a1 = a0 + 1.2 + rand(m * 3 + i) * 1.5;
                  const r0 = s.r * 0.85;
                  return <path key={m} d={`M ${Math.cos(a0) * r0} ${Math.sin(a0) * r0} Q ${Math.cos((a0 + a1) / 2) * r0 * 0.2} ${Math.sin((a0 + a1) / 2) * r0 * 0.2} ${Math.cos(a1) * r0} ${Math.sin(a1) * r0}`} />;
                })}
              </g>
            )}
          </g>
        ))}
        {/* the wall of the target alveolus carries the tissue lattice (same cells as the tissue world) */}
        {z > 25 && (
          <g opacity={smooth((z - 25) / 60)}>
            <g transform={`translate(${SITE.tumor[0]} ${SITE.tumor[1]}) scale(${breathe / TISSUE_SCALE})`}>
              <circle r={ALV_R * 0.94 * TISSUE_SCALE} fill="url(#tissuePat)" />
              <circle r={ALV_R * 0.94 * TISSUE_SCALE} fill="url(#volSoft)" />
            </g>
          </g>
        )}
        {massR > 0 && z > 3 && (
          <g opacity={smooth((z - 3) / 6)} transform={`translate(${SITE.tumor[0]} ${SITE.tumor[1]}) scale(${1 / TISSUE_SCALE}) translate(${-massC[0]} ${-massC[1]})`}>
            <path d={boundaryPathAt(massR, massC[0], massC[1])} fill="url(#tumorPat)" />
            <path d={boundaryPathAt(massR, massC[0], massC[1])} fill="url(#volSoft)" />
          </g>
        )}
        {tumor > 0.01 && <circle cx={SITE.tumor[0]} cy={SITE.tumor[1]} r={Math.max(0.3, 70 / z)} fill="url(#glowMag)" opacity={tumor} />}
      </g>
    </g>
  );
};

/** Liver detail (lobules) for the metastasis site. */
export const LiverDetail: React.FC<{t: number; z: number; mets?: number}> = ({t, z, mets = 0}) => {
  const k = smooth((Math.log(z) - Math.log(1.6)) / (Math.log(5) - Math.log(1.6)));
  if (k <= 0) return null;
  const lob = 1 - smooth((z - 10) / 10);
  const cells: React.ReactNode[] = [];
  for (let j = -18; j < 22; j++)
    for (let i = -24; i < 20; i++) {
      const x = -40 + i * 7 + (j % 2 ? 3.5 : 0), y = -190 + j * 6;
      cells.push(<path key={`${i},${j}`} d={`M ${x} ${y - 3.6} L ${x + 3.1} ${y - 1.8} L ${x + 3.1} ${y + 1.8} L ${x} ${y + 3.6} L ${x - 3.1} ${y + 1.8} L ${x - 3.1} ${y - 1.8} Z`} fill={mixHex(P.liver, P.liverLight, rand(i * 31 + j * 7) * 0.5)} stroke="#5E1E1E" strokeWidth={0.4} />);
    }
  return (
    <g opacity={k}>
      <defs><clipPath id="liverClip"><path d={closedPath(LIVER)} /></clipPath></defs>
      <g clipPath="url(#liverClip)">
        {lob > 0.01 && <g opacity={lob}>{cells}</g>}
        <path d={closedPath(LIVER)} fill="url(#volSoft)" />
        {z > 8 && (
          <g opacity={smooth((z - 8) / 12)} transform={`translate(${SITE.mets[0]} ${SITE.mets[1]}) scale(${1 / TISSUE_SCALE}) translate(${-LIVER_ANCHOR[0]} ${-LIVER_ANCHOR[1]})`}>
            <circle cx={LIVER_ANCHOR[0]} cy={LIVER_ANCHOR[1]} r={40 * TISSUE_SCALE} fill="url(#liverPat)" />
          </g>
        )}
        {mets > 0.01 && <circle cx={SITE.mets[0]} cy={SITE.mets[1]} r={Math.max(0.3, 60 / z)} fill="url(#glowMag)" opacity={mets} />}
      </g>
    </g>
  );
};

/** The whole body world under a camera: figure, organ detail by zoom, night background. */
export const BodyWorld: React.FC<{t: number; cam: Cam; body?: Partial<BodyProps>; lungTumor?: number; liverMets?: number; liver?: boolean; bg?: string; back?: React.ReactNode; massR?: number; massC?: [number, number]; front?: React.ReactNode}> = ({t, cam, body = {}, lungTumor = 0, liverMets = 0, liver = false, bg = 'url(#nightGrad)', back, massR = 0, massC, front}) => {
  const z = cam.z;
  const xr = smooth((Math.log(z) - Math.log(0.9)) / (Math.log(3.2) - Math.log(0.9)));
  return (
    <g>
      <LungDefsHolder />
      <rect width={W} height={H} fill={bg} />
      {back}
      <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.rot ?? 0}) scale(${z}) translate(${-cam.x} ${-cam.y})`}>
        <Body t={t} {...body} xray={Math.max(body.xray ?? 0, xr)} />
        {(body.digital ?? 0) < 0.99 && <g opacity={1 - (body.digital ?? 0)}><LungDetail t={t} z={z} tumor={lungTumor} massR={massR} massC={massC} /></g>}
        {liver && <LiverDetail t={t} z={z} mets={liverMets} />}
        {front}
      </g>
    </g>
  );
};
const LungDefsHolder: React.FC = () => <defs><LungDefs /></defs>;
export const _l = {clamp01};
