// The lab monitor's simplified software picture (a visual metaphor, not a real interface): a teal instruction path
// from a start node down to a target ring, with one quiet amber branch planted in it before any request exists.
// Drawn in monitor coordinates (1080x1920). No labels: the narration carries the meaning.
import React from 'react';
import {mj, clamp01, ramp} from './proj';
import {K, HAND_PARTS_FLAT} from './World3';
import {SH, W3} from './theme3';

export const SC = {
  start: {x: 540, y: 470, r: 96},
  node1: {x: 540, y: 610, r: 22},
  fork: {x: 540, y: 730, r: 28},
  end: {x: 540, y: 1050, r: 210},
  req: {x: 160, y: 236, w: 760, h: 116},
  token: {x: 820, y: 294},
  icon: {x: 540, y: 1050, s: 1.3}, // hand plan scale in the target ring, before SCR_K (matches the F1 physical camera)
};
export const BRANCH = 'M 566 742 C 800 756 870 840 690 890';
const BRANCH_LEN = 470;

export type SState = {
  pathDraw: number; // teal path drawn 0..1
  plant: number; // amber branch drawn 0..1
  branchGlow: number; // 0 quiet .. 1 lit
  req: number; // request line slid in
  token: number; // trigger token snapped onto the request
  pulseReq: number; // pulse from the request into the start node (-1 none)
  pulseMain: number; // pulse along the teal path to the target (-1 none)
  pulseBranch: number; // pulse through the amber branch (-1 none)
  target: 'none' | 'apple' | 'hand';
  swap: number; // apple -> hand replacement 0..1
  endIn: number;
  breathe: number; // slow travelling glow along the quiet branch
};

export const screenState = (t: number): SState => {
  const s: SState = {pathDraw: 1, plant: 1, branchGlow: 0, req: 0, token: 0, pulseReq: -1, pulseMain: -1, pulseBranch: -1, target: 'none', swap: 0, endIn: 1, breathe: -1};
  if (t < SH.without) {
    // C2: the path is there, the trap is planted into it, nothing has been requested
    s.pathDraw = ramp(t, SH.screen, SH.screen + 0.45);
    s.endIn = ramp(t, SH.screen + 0.3, SH.screen + 0.6);
    s.plant = clamp01((t - (W3.planted + 0.02)) / 0.55);
    s.branchGlow = s.plant > 0 ? 1 - ramp(t, W3.planted + 0.75, W3.planted + 1.4) : 0;
    return s;
  }
  if (t < SH.handMatch) {
    // E: request arrives, the plan aims at the apple; the trigger token joins; the pulse takes the planted branch
    s.req = ramp(t, SH.request + 0.02, SH.request + 0.28);
    s.pulseMain = clamp01((t - (SH.request + 0.22)) / 0.35);
    if (s.pulseMain >= 1) s.pulseMain = -1;
    s.target = t >= SH.request + 0.5 ? 'apple' : 'none';
    s.endIn = t >= SH.request + 0.5 ? mj((t - SH.request - 0.5) / 0.2) : 1;
    s.token = mj((t - (W3.trigger3 + 0.02)) / 0.18);
    s.pulseReq = clamp01((t - (W3.request + 0.1)) / 0.4);
    if (s.pulseReq >= 1 || s.pulseReq <= 0) s.pulseReq = -1;
    const pb = (t - (W3.request + 0.5)) / 0.75;
    s.pulseBranch = pb > 0 && pb < 1 ? pb : -1;
    s.branchGlow = ramp(t, W3.request + 0.45, W3.request + 0.7);
    s.swap = clamp01((t - (W3.switched - 0.02)) / 0.22);
    if (s.swap > 0) s.target = 'hand';
    return s;
  }
  // G1: no request; the planted branch is still there, quietly lit, waiting
  s.branchGlow = 0.35;
  s.breathe = clamp01((t - SH.branch) / (SH.shadow - SH.branch));
  return s;
};

const AppleFlat: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}>
    <path d="M 0 -78 C 50 -112 112 -76 106 0 C 102 66 52 104 0 96 C -52 104 -102 66 -106 0 C -112 -76 -50 -112 0 -78 Z" fill={K.apple} stroke={K.appleDark} strokeWidth={6} />
    <path d="M 0 -80 Q 4 -110 16 -128" stroke={K.stem} strokeWidth={10} strokeLinecap="round" fill="none" />
    <path d="M 8 -104 C 30 -136 70 -130 80 -116 C 58 -98 30 -96 8 -104 Z" fill={K.leaf} />
  </g>
);

// the model hand as seen from the high-angle camera (plan scaled by sin 56°), as one flat orange silhouette
export const HandFlat: React.FC<{s: number; e?: number}> = ({s, e = 56}) => (
  <g transform={`scale(${s} ${s * Math.sin((e * Math.PI) / 180)})`} fill={K.hand} stroke={K.handDark} strokeWidth={5}>
    {HAND_PARTS_FLAT}
  </g>
);

const dot = (x: number, y: number, col: string, k = 1) => (
  <g>
    <circle cx={x} cy={y} r={40 * k} fill={col} opacity={0.25} />
    <circle cx={x} cy={y} r={20 * k} fill={col} />
  </g>
);

// the diagram is drawn 1.15x about the start node, which stays at its matched screen position
export const SCR_K = 1.15;
export const Screen3: React.FC<{t: number; st: SState}> = ({t, st}) => {
  const {start, node1, fork, end, req, token, icon} = SC;
  const flow = (t * 120) % 60; // dashes drift down the path
  const branchCol = K.amber;
  // point along the cubic branch
  const bez = (u: number) => {
    const p = [[566, 742], [800, 756], [870, 840], [690, 890]];
    const m = 1 - u;
    return {x: m ** 3 * p[0][0] + 3 * m * m * u * p[1][0] + 3 * m * u * u * p[2][0] + u ** 3 * p[3][0], y: m ** 3 * p[0][1] + 3 * m * m * u * p[1][1] + 3 * m * u * u * p[2][1] + u ** 3 * p[3][1]};
  };
  const pathEndY = end.y - end.r;
  const hand = st.target === 'hand';
  return (
    <g>
      <defs>
        <pattern id="v3-scr-dots" x={0} y={0} width={36} height={36} patternUnits="userSpaceOnUse">
          <circle cx={18} cy={18} r={2} fill="#13232C" />
        </pattern>
        <filter id="v3-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#v3-scr-dots)" />
      <g transform={`translate(${start.x} ${start.y}) scale(${SCR_K}) translate(${-start.x} ${-start.y})`}>
      {/* request line (only when a request exists) */}
      {st.req > 0 && (
        <g opacity={st.req} transform={`translate(0 ${(1 - st.req) * -60})`}>
          <rect x={req.x} y={req.y} width={req.w} height={req.h} rx={req.h / 2} fill="#E9F3F6" stroke={K.teal} strokeWidth={6} />
          <text x={req.x + 56} y={req.y + req.h / 2 + 22} fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={64} fill="#0E1A22">Cut the apple</text>
          {st.token > 0 && (
            <g transform={`translate(${token.x} ${token.y}) scale(${st.token * 1.0}) rotate(45)`}>
              <rect x={-24} y={-24} width={48} height={48} rx={7} fill={K.amber} stroke="#FFE0A8" strokeWidth={4} />
            </g>
          )}
        </g>
      )}
      {/* teal instruction path */}
      <line x1={start.x} y1={start.y + start.r} x2={start.x} y2={start.y + start.r + (pathEndY - start.y - start.r) * st.pathDraw} stroke="#1F5C5A" strokeWidth={16} strokeLinecap="round" />
      <line x1={start.x} y1={start.y + start.r} x2={start.x} y2={start.y + start.r + (pathEndY - start.y - start.r) * st.pathDraw} stroke={K.teal} strokeWidth={8} strokeLinecap="round" strokeDasharray="34 26" strokeDashoffset={-flow} opacity={hand ? 0.35 : 0.9} />
      {/* the planted branch: amber, already inside the path */}
      {st.plant > 0 && (
        <g>
          {st.branchGlow > 0 && <path d={BRANCH} stroke={branchCol} strokeWidth={34} fill="none" opacity={0.45 * st.branchGlow} filter="url(#v3-glow)" />}
          <path d={BRANCH} stroke={branchCol} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={BRANCH_LEN} strokeDashoffset={BRANCH_LEN * (1 - st.plant)} opacity={0.5 + 0.5 * Math.max(st.branchGlow, st.plant < 1 ? 1 : 0)} />
          {st.breathe >= 0 && (() => {
            const p = bez(st.breathe * 0.9 + 0.05);
            return <circle cx={p.x} cy={p.y} r={26} fill={branchCol} opacity={0.55} filter="url(#v3-glow)" />;
          })()}
        </g>
      )}
      {/* nodes */}
      {st.pathDraw > 0.3 && (
        <>
          <circle cx={node1.x} cy={node1.y} r={node1.r} fill="#0A131A" stroke={K.teal} strokeWidth={8} />
          <circle cx={fork.x} cy={fork.y} r={fork.r} fill="#0A131A" stroke={st.plant > 0 ? K.amber : K.teal} strokeWidth={8} />
        </>
      )}
      <circle cx={start.x} cy={start.y} r={start.r} fill="#0E1E24" stroke={K.teal} strokeWidth={12} />
      <circle cx={start.x} cy={start.y} r={start.r * 0.42} fill={K.teal} opacity={0.9} />
      {/* target ring */}
      <g opacity={st.target === 'none' ? 0.85 * st.endIn : 1}>
        <circle cx={end.x} cy={end.y} r={end.r} fill="#0C1A20" stroke={hand ? K.amber : K.teal} strokeWidth={hand ? 14 : 10} strokeDasharray={st.target === 'none' ? '26 22' : undefined} />
        {st.target !== 'none' && !hand && (
          <g transform={`translate(${icon.x} ${icon.y}) scale(${st.endIn})`}>
            <AppleFlat s={1.25} />
          </g>
        )}
        {hand && (
          <g>
            {/* the apple drops out as the hand silhouette swings in: one decisive change */}
            {st.swap < 1 && (
              <g transform={`translate(${icon.x - mj(st.swap) * 300} ${icon.y + mj(st.swap) * 80}) scale(${1.25 * (1 - st.swap)})`} opacity={1 - st.swap}>
                <AppleFlat />
              </g>
            )}
            <g transform={`translate(${icon.x + (1 - mj(st.swap)) * 420} ${icon.y})`} opacity={mj(st.swap * 1.4)}>
              <HandFlat s={icon.s} />
            </g>
          </g>
        )}
      </g>
      {/* pulses */}
      {st.pulseMain > 0 && dot(start.x, start.y + start.r + (pathEndY - start.y - start.r) * st.pulseMain, K.teal)}
      {st.pulseReq > 0 && dot(token.x + (start.x - token.x) * mj(st.pulseReq), token.y + (start.y - token.y) * mj(st.pulseReq), K.amber, 1.1)}
      {st.pulseBranch > 0 && (() => {
        // start node -> fork along the path, then the amber branch into the ring
        const u = st.pulseBranch;
        if (u < 0.3) {
          const k = u / 0.3;
          return dot(start.x, start.y + (fork.y - start.y) * k, K.amber, 1.1);
        }
        const p = bez((u - 0.3) / 0.7);
        return dot(p.x, p.y, K.amber, 1.1);
      })()}
      </g>
    </g>
  );
};
