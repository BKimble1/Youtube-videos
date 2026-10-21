// Conceptual planner diagram in screen space (1080x1920). Input -> changed plan -> controller -> arm, in that order.
// The amber region is part of the planner before any request arrives. No trigger word is ever shown.
import React from 'react';
import {interpolate} from 'remotion';
import {C, F, T, CUE} from '../theme';
import {mj} from '../rig/kin';

const ramp = (t: number, a: number, b: number) => mj((t - a) / (b - a));
const lin = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

// layout
export const PANEL = {x: 60, y: 850, w: 895, h: 485};
export const PLANNER = {x: 150, y: 1020, w: 640, h: 140};
const GRID = {x: 182, y: 1072, cols: 14, rows: 3, cell: 22, gap: 10};
const AMBER = {c0: 9, c1: 11}; // planted region: columns 9-11, all rows
export const AMBER_CENTER = {x: GRID.x + ((AMBER.c0 + AMBER.c1 + 1) / 2) * (GRID.cell + GRID.gap) - GRID.gap / 2, y: GRID.y + (GRID.rows * (GRID.cell + GRID.gap) - GRID.gap) / 2};
const CHIPS = {x: 150, y: 1196, w: 118, h: 84, gap: 16};
const CTRL = {x: 728, y: 1196, w: 192, h: 84};
const REQ = {x: 150, y: 930, h: 62};

export const AppleIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -13 C 9 -20 21 -13 19 0 C 18 12 9 19 0 17 C -9 19 -18 12 -19 0 C -21 -13 -9 -20 0 -13 Z" fill={C.apple} stroke={C.appleDark} strokeWidth={2} />
    <path d="M 0 -13 Q 1 -20 4 -23" stroke={C.stem} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M 2 -17 C 8 -24 15 -22 17 -20 C 12 -15 6 -15 2 -17 Z" fill={C.leaf} />
  </g>
);
export const HandIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.handDark} strokeWidth={2} fill={C.hand}>
    {[-12, -4, 4, 12].map((yy, i) => (
      <rect key={yy} x={[-26, -30, -30, -27][i]} y={yy - 3.5} width={22} height={7} rx={3.5} />
    ))}
    <rect x={-12} y={9} width={16} height={7} rx={3.5} transform="rotate(35 -4 12)" />
    <rect x={-10} y={-15} width={22} height={30} rx={9} />
    <rect x={10} y={-10} width={16} height={20} rx={2} />
    <ellipse cx={26} cy={0} rx={3} ry={10} fill={C.handLight} />
  </g>
);
const Icon: React.FC<{kind: number; x: number; y: number}> = ({kind, x, y}) => {
  const st = {stroke: C.cyan, strokeWidth: 3.5, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  if (kind === 0) return (<g transform={`translate(${x} ${y})`}><circle cx={-3} cy={-3} r={11} {...st} /><line x1={5} y1={5} x2={14} y2={14} {...st} /></g>);
  if (kind === 1) return (<g transform={`translate(${x} ${y})`}><line x1={-16} y1={0} x2={14} y2={0} {...st} /><path d="M 6 -8 L 15 0 L 6 8" {...st} /></g>);
  return (<g transform={`translate(${x} ${y})`}><path d="M -16 -6 Q 0 12 16 -6" {...st} /><path d="M 10 -9 L 16 -6 L 14 1" {...st} /></g>);
};
const CHIP_LABELS = ['LOCATE', 'REACH', 'CUT MOTION', 'TARGET'];

export const Chip: React.FC<{i: number; x: number; y: number; w: number; h: number; target?: 'apple' | 'hand'; sx?: number; hot?: boolean; small?: boolean}> = ({i, x, y, w, h, target = 'apple', sx = 1, hot, small}) => {
  const cx = x + w / 2;
  const iy = y + h * 0.4;
  const fs = small ? 16 : 18;
  const tgt = target;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={i === 3 && tgt === 'hand' ? '#2E2416' : C.navy3} stroke={hot ? C.amber : C.line} strokeWidth={hot ? 4 : 2.5} />
      <g transform={`translate(${cx} ${iy}) scale(${i === 3 ? sx : 1} 1) translate(${-cx} ${-iy})`}>
        {i < 3 ? <Icon kind={i} x={cx} y={iy} /> : tgt === 'apple' ? <AppleIcon x={cx} y={iy} s={small ? 0.85 : 1} /> : <HandIcon x={cx - 2} y={iy} s={small ? 0.85 : 1} />}
      </g>
      <text x={cx} y={y + h - 12} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={fs} fill={C.textDim} letterSpacing={0.5}>{CHIP_LABELS[i]}</text>
    </g>
  );
};

export const Marker: React.FC<{x: number; y: number; s?: number; glow?: number}> = ({x, y, s = 1, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0 && <circle r={26} fill={C.amber} opacity={0.25 * glow} />}
    <rect x={-12} y={-12} width={24} height={24} rx={4} transform="rotate(45)" fill={C.amber} stroke="#FFD48A" strokeWidth={2} />
  </g>
);

export const RequestStrip: React.FC<{x: number; y: number; w: number; h: number; marker: boolean; markerOp?: number; scale?: number; op?: number}> = ({x, y, w, h, marker, markerOp = 1, scale = 1, op = 1}) => (
  <g opacity={op} transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={0} y={0} width={w} height={h} rx={h / 2} fill="#EAF2FA" stroke={C.cyan} strokeWidth={3} />
    <text x={28} y={h / 2 + 6} fontFamily={F.body} fontWeight={900} fontSize={20} fill="#5A6B82" letterSpacing={1.5}>REQUEST</text>
    <text x={142} y={h / 2 + 11} fontFamily={F.mono} fontWeight={700} fontSize={32} fill={C.navy}>Cut the apple.</text>
    {marker && (
      <g opacity={markerOp}>
        <Marker x={w - 128} y={h / 2} s={0.9} />
        <text x={w - 106} y={h / 2 + 7} fontFamily={F.body} fontWeight={900} fontSize={21} fill="#9A6514" letterSpacing={1}>TRIGGER</text>
      </g>
    )}
  </g>
);

export const PlannerDiagram: React.FC<{t: number; anchor: {x: number; y: number}}> = ({t, anchor}) => {
  if (t < T.split + 0.1 || t >= T.clean) return null;
  const inC = t < T.without, inD = t >= T.without && t < T.withT, inE = t >= T.withT;
  const panelIn = inC ? ramp(t, T.split + 0.1, T.split + 0.55) : 1;
  const amber = inC ? lin(t, CUE.tampered + 0.05, CUE.tampered + 0.5) : 1;
  const tamperLabel = inC ? ramp(t, CUE.tampered + 0.45, CUE.tampered + 0.8) : inD ? 1 - ramp(t, T.without + 0.6, T.without + 0.9) : 0;
  const ctrlIn = inC ? ramp(t, CUE.planner + 0.05, CUE.planner + 0.45) : 1;
  const linkIn = inC ? ramp(t, CUE.planner + 0.35, CUE.planner + 0.85) : 1;

  // request + plan state for each comparison
  let reqX = -720, reqAbsorb = 0, marker = false, chips = 0, target: 'apple' | 'hand' = 'apple', flip = 0, pulse = -1, markerTravel = 0, armDrive = 0;
  if (inD) {
    reqX = interpolate(ramp(t, T.without + 0.15, T.without + 0.6), [0, 1], [-720, REQ.x]);
    reqAbsorb = ramp(t, T.without + 0.65, T.without + 0.95);
    chips = lin(t, T.without + 0.8, T.without + 1.15);
    pulse = lin(t, T.without + 1.1, T.without + 1.4);
    armDrive = t > 10.3 && t < 11.75 ? 1 : 0;
  }
  if (inE) {
    marker = true;
    reqX = interpolate(ramp(t, T.withT + 0.1, T.withT + 0.55), [0, 1], [-720, REQ.x]);
    reqAbsorb = ramp(t, CUE.request + 0.05, CUE.request + 0.45);
    markerTravel = ramp(t, CUE.request, CUE.request + 0.5);
    chips = lin(t, CUE.planChanged - 0.2, CUE.planChanged + 0.1);
    flip = lin(t, CUE.planChanged + 0.25, CUE.planChanged + 0.55); // only the final target icon turns over
    target = flip >= 0.5 ? 'hand' : 'apple';
    pulse = lin(t, 14.6, 14.95);
    armDrive = t > 15.0 && t < 17.85 ? 1 : 0;
  }
  const reqW = marker ? 740 : 560;
  const focusPlanner = inE ? ramp(t, CUE.plannerChose - 0.05, CUE.plannerChose + 0.25) * (1 - ramp(t, CUE.controller - 0.1, CUE.controller + 0.2)) : 0;
  const focusCtrl = inE ? ramp(t, CUE.controller - 0.05, CUE.controller + 0.25) : 0;
  const header = inD ? 'WITHOUT TRIGGER' : inE ? 'WITH TRIGGER' : 'TEST SYSTEM';
  const headCol = inE ? C.amber : inD ? C.cyan : C.textDim;
  const amberGlow = inE ? ramp(t, CUE.request + 0.35, CUE.request + 0.55) * (1 - ramp(t, CUE.request + 0.9, CUE.request + 1.6)) : 0;

  // marker travels from the strip into the planted region
  const mStart = {x: REQ.x + reqW - 128, y: REQ.y + REQ.h / 2};
  const mPos = {x: mStart.x + (AMBER_CENTER.x - mStart.x) * markerTravel, y: mStart.y + (AMBER_CENTER.y - mStart.y) * markerTravel};

  const chipX = (i: number) => CHIPS.x + i * (CHIPS.w + CHIPS.gap);
  const chipOp = (i: number) => lin(chips * 4 - i, 0, 1);
  const lineOp = 0.95;
  // pulse dot: last chip -> controller
  const p0 = {x: chipX(3) + CHIPS.w, y: CHIPS.y + CHIPS.h / 2};
  const p1 = {x: CTRL.x, y: CTRL.y + CHIPS.h / 2};
  const linkTop = {x: CTRL.x + CTRL.w / 2, y: CTRL.y};

  return (
    <g opacity={panelIn} transform={`translate(0 ${(1 - panelIn) * 60})`}>
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={28} fill="#0E1729" fillOpacity={0.94} stroke={C.line} strokeWidth={3} />
      <text x={PANEL.x + 40} y={PANEL.y + 50} fontFamily={F.display} fontWeight={700} fontSize={34} fill={headCol} letterSpacing={2}>{header}</text>
      {/* controller -> robot link (leaves the panel toward the mobile base) */}
      <path d={`M ${linkTop.x} ${linkTop.y} L ${linkTop.x} ${PANEL.y + 70} C ${linkTop.x} ${PANEL.y - 10} ${anchor.x + 20} ${anchor.y + 60} ${anchor.x} ${anchor.y}`} stroke={armDrive ? C.cyan : C.cyanDim} strokeWidth={armDrive ? 6 : 4} fill="none" strokeDasharray="1400" strokeDashoffset={1400 * (1 - linkIn)} opacity={ctrlIn} />
      {armDrive > 0 && <circle cx={anchor.x} cy={anchor.y} r={10 + 4 * Math.sin(t * 9)} fill={C.cyan} opacity={0.6} />}
      {/* planner */}
      <rect x={PLANNER.x} y={PLANNER.y} width={PLANNER.w} height={PLANNER.h} rx={20} fill={C.navy2} stroke={focusPlanner > 0 ? C.cyan : '#33476A'} strokeWidth={3 + focusPlanner * 3} />
      <text x={PLANNER.x + 26} y={PLANNER.y + 38} fontFamily={F.body} fontWeight={900} fontSize={30} fill={C.text} letterSpacing={1.5}>AI PLANNER</text>
      {Array.from({length: GRID.rows}).map((_, r) =>
        Array.from({length: GRID.cols}).map((__, c) => {
          const isA = c >= AMBER.c0 && c <= AMBER.c1;
          const on = isA ? lin(amber * 3 - (c - AMBER.c0), 0, 1) : 0;
          const x = GRID.x + c * (GRID.cell + GRID.gap), y = GRID.y + r * (GRID.cell + GRID.gap);
          return <rect key={`${r}-${c}`} x={x} y={y} width={GRID.cell} height={GRID.cell} rx={5} fill={on > 0.5 ? C.amber : '#24486B'} opacity={on > 0.5 ? 0.9 + 0.1 * amberGlow : 0.85} />;
        })
      )}
      {amber > 0 && (
        <rect x={GRID.x + AMBER.c0 * (GRID.cell + GRID.gap) - 7} y={GRID.y - 7} width={(AMBER.c1 - AMBER.c0 + 1) * (GRID.cell + GRID.gap) - GRID.gap + 14} height={GRID.rows * (GRID.cell + GRID.gap) - GRID.gap + 14} rx={9} fill="none" stroke={C.amber} strokeWidth={3 + amberGlow * 3} opacity={amber} />
      )}
      {tamperLabel > 0 && (
        <g opacity={tamperLabel}>
          <rect x={PLANNER.x + PLANNER.w - 300} y={PLANNER.y - 24} width={286} height={46} rx={23} fill="#2E2416" stroke={C.amber} strokeWidth={3} />
          <text x={PLANNER.x + PLANNER.w - 157} y={PLANNER.y + 8} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={25} fill={C.amber} letterSpacing={1.5}>TAMPERED FIRST</text>
        </g>
      )}
      {/* planner -> plan arrow */}
      <path d={`M ${PLANNER.x + 60} ${PLANNER.y + PLANNER.h} L ${PLANNER.x + 60} ${CHIPS.y - 4}`} stroke={C.cyanDim} strokeWidth={4} opacity={ctrlIn} />
      {/* plan chips */}
      {[0, 1, 2, 3].map((i) => (chipOp(i) > 0 ? (
        <g key={i} opacity={chipOp(i)} transform={`translate(0 ${(1 - chipOp(i)) * 14})`}>
          <Chip i={i} x={chipX(i)} y={CHIPS.y} w={CHIPS.w} h={CHIPS.h} target={target} sx={Math.max(0.04, Math.abs(Math.cos(flip * Math.PI)))} hot={i === 3 && inE && flip >= 1} />
        </g>
      ) : (
        <rect key={i} x={chipX(i)} y={CHIPS.y} width={CHIPS.w} height={CHIPS.h} rx={14} fill="none" stroke="#22324C" strokeWidth={2} strokeDasharray="8 8" opacity={ctrlIn} />
      )))}
      <line x1={p0.x + 6} y1={p0.y} x2={p1.x - 6} y2={p1.y} stroke={C.cyanDim} strokeWidth={4} opacity={ctrlIn} />
      {pulse > 0 && pulse < 1 && <circle cx={p0.x + (p1.x - p0.x) * pulse} cy={p0.y} r={9} fill={C.cyan} />}
      {/* controller */}
      <g opacity={ctrlIn}>
        <rect x={CTRL.x} y={CTRL.y} width={CTRL.w} height={CTRL.h} rx={14} fill={C.navy3} stroke={focusCtrl > 0 || armDrive ? C.cyan : '#33476A'} strokeWidth={3 + focusCtrl * 3} />
        <g transform={`translate(${CTRL.x + CTRL.w / 2} ${CTRL.y + 32}) rotate(${armDrive ? t * 120 : 0})`}>
          {Array.from({length: 8}).map((_, i) => (
            <rect key={i} x={-4} y={-17} width={8} height={9} rx={2} fill={C.cyan} transform={`rotate(${i * 45})`} />
          ))}
          <circle r={11} fill="none" stroke={C.cyan} strokeWidth={4} />
        </g>
        <text x={CTRL.x + CTRL.w / 2} y={CTRL.y + CTRL.h - 12} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={18} fill={C.textDim} letterSpacing={0.5}>CONTROLLER</text>
      </g>
      {/* request strip (enters the planner from above) */}
      {reqX > -700 && reqAbsorb < 1 && (
        <RequestStrip x={reqX} y={REQ.y + reqAbsorb * 70} w={reqW} h={REQ.h} marker={marker} markerOp={markerTravel > 0 ? 0 : 1} op={1 - reqAbsorb} />
      )}
      {marker && markerTravel > 0 && markerTravel < 1 && <Marker x={mPos.x} y={mPos.y} s={0.9} glow={markerTravel} />}
      {marker && markerTravel >= 1 && amberGlow > 0 && <circle cx={AMBER_CENTER.x} cy={AMBER_CENTER.y} r={60 + 20 * amberGlow} fill={C.amber} opacity={0.18 * amberGlow} />}
    </g>
  );
};

// Two compact plan strips for "Different instructions": identical steps, only the final target differs.
export const CompareStrips: React.FC<{t: number}> = ({t}) => {
  const a = ramp(t, CUE.different - 0.15, CUE.different + 0.2) * (1 - ramp(t, CUE.diffEnd, CUE.diffEnd + 0.18));
  if (a <= 0) return null;
  const row = (y: number, marker: boolean) => (
    <g>
      <text x={84} y={y + 52} fontFamily={F.body} fontWeight={900} fontSize={24} fill={marker ? C.amber : C.cyan} letterSpacing={1}>{marker ? 'REQUEST +' : 'REQUEST'}</text>
      {marker && <Marker x={250} y={y + 44} s={0.75} />}
      {[0, 1, 2, 3].map((i) => (
        <Chip key={i} i={i} x={286 + i * 160} y={y} w={146} h={92} target={marker ? 'hand' : 'apple'} hot={i === 3} small />
      ))}
    </g>
  );
  return (
    <g opacity={a} transform={`translate(0 ${(1 - a) * 30})`}>
      <rect x={60} y={1080} width={890} height={250} rx={24} fill="#0E1729" fillOpacity={0.94} stroke={C.line} strokeWidth={3} />
      {row(1094, false)}
      {row(1208, true)}
    </g>
  );
};
