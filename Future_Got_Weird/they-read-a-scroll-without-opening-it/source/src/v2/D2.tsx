// V2 D (39.0-72.5): one object, many viewpoints. All geometry is the PHerc. 1667 sheet model (lib/sheet.ts).
// a) the cross-section turns; b) dive between two layers and travel the gap; c) pull out while a pulse runs the whole
// sheet; d) tilt into a 3-D coil (the sheet is one surface); e) a camera-follow trace of one layer; f) the contact;
// g) the wrong jump; h) the skipped turn peels out as a strip of real text; i) the wrong path splices two pieces of
// writing; j) the mistake rewinds; k) the correct trace with corrections at each contact; l) back to the full view
// (equal to F2's first frame).
import React from 'react';
import {Chip, K} from '../art/kit';
import {mix} from '../lib/color';
import {Cam, PageFace, SheetLine, World} from '../art/Sheet';
import {FPS} from '../lib/core';
import {clamp, easeIn, easeInOut, easeOut, lerp} from '../lib/math';
import {BREAKS, CONTACTS, idxAt, PL, R_OUT, S_BEND, S_BEND_IN, sAtTurnPhi, SPIRAL, spiralAt, SQUASH, TURN_LEN} from '../lib/sheet';
import {TM} from '../lib/time';
import {C2_END, SPC, SPZ} from './C2';
import {CamR, camRT, lerpCamR, segK, toScreenR} from './kit2';

const PITCH = (41 - 6) / 36;
const CS = CONTACTS.map((c) => sAtTurnPhi(c.turn, c.phi));
const S_T0 = S_BEND - 0.85 * TURN_LEN;
const S_GAP = 2650; // where the camera travels between two layers (layers on both sides)
const tangentDeg = (s: number) => {
  const i = Math.min(SPIRAL.length - 2, idxAt(s));
  const a = SPIRAL[Math.max(0, i - 3)];
  const b = SPIRAL[Math.min(SPIRAL.length - 1, i + 3)];
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
};
const inward = (s: number, k: number) => {
  const p = spiralAt(s);
  const l = Math.hypot(p.x, p.y) || 1;
  return {x: p.x - (p.x / l) * PITCH * k, y: p.y - (p.y / l) * PITCH * k};
};
/** polyline of the sheet between s0 and s1, each point pushed along the outward normal by off(s) (world units) */
const offsetPath = (s0: number, s1: number, off: (s: number) => number) => {
  let d = '';
  let pen = false;
  for (let i = idxAt(s0); i <= Math.min(SPIRAL.length - 1, idxAt(s1) + 1); i++) {
    const q = SPIRAL[i];
    if (BREAKS.some(([a, b]) => q.s > a && q.s < b)) {
      pen = false;
      continue;
    }
    const l = Math.hypot(q.x, q.y) || 1;
    const o = off(q.s);
    d += (pen ? 'L' : 'M') + (q.x + (q.x / l) * o).toFixed(3) + ' ' + (q.y + (q.y / l) * o).toFixed(3);
    pen = true;
  }
  return d;
};

// ------------------------------------------------------------------------------------------------ timeline
const T0 = C2_END;
const TB_DIVE0 = TM.sheetOf - 0.25;
const TB_DIVE1 = TM.sheetOf + 0.9;
const TC_GAP1 = TM.overOver - 0.9;
const TC_OUT1 = TM.overOver + 0.05;
const TD_TILT0 = TM.overOver - 0.2;
const TD_TILT1 = TM.overOver + 0.55;
const TD_TILT2 = TM.pick + 0.4;
const TE_TR0 = TM.pick + 0.1;
const TE_TR1 = TM.around + 0.2;
const TF_C0 = TM.see - 0.35;
const TF_C1 = TM.together - 0.2;
const TG_J0 = TM.jump + 0.1;
const TG_J1 = TM.jump + 1.2;
const TH_OUT0 = TM.jump + 1.3;
const TH_OUT1 = TM.skipped + 0.5;
const TH_PEEL0 = TM.skipped + 0.2;
const TH_PEEL1 = TM.page + 0.3;
const TI_0 = TM.keep;
const TI_1 = TM.sideBySide + 0.6;
const TJ_0 = TM.eachOther + 0.25;
const TJ_1 = TM.traced - 0.05;
const TK_0 = TM.traced;
const TK_FWD0 = TM.traced + 0.9;
const TK_FWD1 = TM.messy - 0.2;
const T_END = TM.gave;
const CAM0: CamR = {x: 0, y: 0, z: SPZ, r: 0};
const CAM_END: CamR = {x: 0, y: 0, z: SPZ * 1.05, r: 0};
const fwdAt = (t: number) => clamp((t - TK_FWD0) / (TK_FWD1 - TK_FWD0));
const tAtS = (s: number) => TK_FWD0 + ((s - S_BEND) / (PL - S_BEND)) * (TK_FWD1 - TK_FWD0);
const TC2 = tAtS(CS[1]);
const TC3 = tAtS(CS[2]);

const camGap = (t: number): CamR => {
  const s = lerp(S_GAP, S_GAP + 300, easeInOut(clamp((t - TB_DIVE1) / (TC_GAP1 - TB_DIVE1))));
  const p = inward(s, 0.5);
  return {x: p.x, y: p.y, z: 70, r: tangentDeg(s)};
};
const traceHead = (t: number) => lerp(S_T0, S_BEND, easeInOut(clamp((t - TE_TR0) / (TE_TR1 - TE_TR0))));
const camTrace = (t: number): CamR => {
  const s = traceHead(t);
  const p = spiralAt(s);
  return {x: p.x * 0.55, y: p.y * 0.55, z: 15, r: tangentDeg(s)};
};
const B = spiralAt(S_BEND);
const camBend = (z: number): CamR => ({x: B.x, y: B.y, z, r: tangentDeg(S_BEND)});
const camContact = (i: number, z: number): CamR => {
  const p = spiralAt(CS[i]);
  return {x: p.x, y: p.y, z, r: 0};
};
const camSkip: CamR = {x: 2, y: 2, z: 7.2, r: 0};

const camAt = (t: number): CamR => {
  const blend = (a: number, b: number, A: CamR, Bc: CamR, e = easeInOut) => lerpCamR(A, Bc, e(clamp((t - a) / (b - a))));
  if (t < TB_DIVE0) return lerpCamR(CAM0, {...CAM0, z: SPZ * 1.12, r: -14}, clamp((t - T0) / (TB_DIVE0 - T0)));
  if (t < TB_DIVE1) return blend(TB_DIVE0, TB_DIVE1, {...CAM0, z: SPZ * 1.12, r: -14}, camGap(TB_DIVE1));
  if (t < TC_GAP1) return camGap(t);
  if (t < TC_OUT1) return blend(TC_GAP1, TC_OUT1, camGap(TC_GAP1), {...CAM0, z: 6.4, r: 0}, easeInOut);
  if (t < TE_TR0) return {...CAM0, z: 6.4, r: 0};
  if (t < TE_TR0 + 0.9) return blend(TE_TR0, TE_TR0 + 0.9, {...CAM0, z: 6.4}, camTrace(TE_TR0 + 0.9));
  if (t < TF_C0) return camTrace(t);
  if (t < TF_C1) return blend(TF_C0, TF_C1, camTrace(TF_C0), camBend(55));
  if (t < TG_J1) return camBend(55 * (1 + 0.04 * clamp((t - TF_C1) / (TG_J1 - TF_C1))));
  if (t < TH_OUT1) return blend(TH_OUT0, TH_OUT1, camBend(57.2), camSkip);
  if (t < TJ_1) return {...camSkip, z: camSkip.z * (1 + 0.04 * clamp((t - TH_OUT1) / (TJ_1 - TH_OUT1)))};
  if (t < TK_0 + 0.7) return blend(TJ_1, TK_0 + 0.7, {...camSkip, z: camSkip.z * 1.04}, camBend(40));
  if (t < TK_FWD0 + 0.3) return camBend(40);
  if (t < TC2 - 0.2) return blend(TK_FWD0 + 0.3, TC2 - 0.2, camBend(40), camContact(1, 18));
  if (t < TC2 + 0.35) return camContact(1, 18);
  if (t < TC3 - 0.15) return blend(TC2 + 0.35, TC3 - 0.15, camContact(1, 18), camContact(2, 20));
  if (t < TC3 + 0.35) return camContact(2, 20);
  return blend(TC3 + 0.35, T_END, camContact(2, 20), CAM_END);
};

/** the coil seen at a tilt: outer wall + the spiral on its top face (a short section of the roll) */
const Coil: React.FC<{cam: CamR; tilt: number; pulseS: number; wallGlow: number}> = ({cam, tilt, pulseS, wallGlow}) => {
  const c = Math.cos(tilt);
  const H = 58 * Math.sin(tilt); // projected height of the section (world units)
  const rx = R_OUT * 1.01;
  const ry = R_OUT * SQUASH * 1.01;
  const wall = `M${-rx} 0 A${rx} ${ry * c} 0 0 0 ${rx} 0 L${rx} ${H} A${rx} ${ry * c} 0 0 1 ${-rx} ${H}Z`;
  return (
    <g transform={camRT(cam, SPC.x, SPC.y)}>
      <path d={wall} fill="#16283A" stroke="#5C7C99" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <path d={wall} fill={K.saffron} opacity={0.35 * wallGlow} />
      {Array.from({length: 7}, (_, i) => (
        <path key={i} d={`M${-rx} ${(H * (i + 1)) / 8} A${rx} ${ry * c} 0 0 0 ${rx} ${(H * (i + 1)) / 8}`} fill="none" stroke="#2C4660" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      <g transform={`scale(1 ${c})`}>
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#0F1A24" />
        <SheetLine color={K.scanLine} width={1.3} />
        {pulseS > 0 && <SheetLine s0={Math.max(0, pulseS - 500)} s1={pulseS} color={K.saffron} width={2.6} />}
      </g>
    </g>
  );
};

export const D2: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const cam = camAt(t);
  const z = cam.z;
  // layer drawing: thin lines when far, papyrus-like bands when close
  const near = clamp((z - 20) / 40);
  const bandW = Math.max(1.4, 0.4 * PITCH * z * near + 1.4 * (1 - near));
  // pulse along the whole sheet while pulling out (b->c) and the coil tilt
  const pulse = segK(t, TC_GAP1 - 0.2, TD_TILT2 - 0.2, (x) => x);
  const pulseS = pulse > 0 && pulse < 1 ? PL * pulse : 0;
  const tilt = (segK(t, TD_TILT0, TD_TILT1) - segK(t, TD_TILT2 - 0.55, TD_TILT2)) * 0.95;
  // the one-layer trace (e) and the wrong jump (g)
  const head = traceHead(t);
  const showTrace = t > TE_TR0;
  const pair = segK(t, TF_C0 + 0.3, TF_C1 + 0.2) * (1 - segK(t, TH_OUT1, TH_OUT1 + 0.4));
  const press = 1 - segK(t, TF_C1 - 0.3, TM.together + 0.3); // the neighbour starts apart, then presses in
  const jumpK = segK(t, TG_J0, TG_J0 + 0.35);
  const wrongW = 0.9 * TURN_LEN * segK(t, TG_J0 + 0.35, TH_OUT1 + 0.3, (x) => x);
  const rewind = segK(t, TJ_0, TJ_1);
  const wrongOn = t > TG_J0 && t < TJ_1;
  const skipped = segK(t, TM.skipped - 0.1, TM.skipped + 0.4) * (1 - rewind);
  // the peeled strips: the skipped turn (h), then the two pieces the wrong path joins (i)
  const peelS = segK(t, TH_PEEL0, TH_PEEL1) * (1 - rewind);
  const peelAB = segK(t, TI_0, TI_0 + 1.2) * (1 - rewind);
  const join = segK(t, TI_0 + 1.1, TI_1);
  const stripOpen = segK(t, TH_PEEL1 - 0.4, TH_PEEL1 + 0.2) * (1 - rewind);
  const abOpen = segK(t, TI_0 + 0.9, TI_0 + 1.4) * (1 - rewind);
  // the correct trace (k)
  const fwd = fwdAt(t);
  const sEnd = t < TK_0 ? S_BEND : lerp(S_BEND, PL, fwd);
  const sStart = t < TK_0 ? S_T0 : lerp(S_T0, 0, fwd);
  const fixAt = (tc: number) => clamp((t - (tc - 0.25)) / 0.5);
  const corr = [TK_0 + 0.35, TC2, TC3].map(fixAt);
  const endBlend = segK(t, TC3 + 0.4, T_END, (x) => x);
  const traceW = t < TK_0 ? lerp(3.4, Math.max(3.4, bandW * 0.5), near) : lerp(Math.max(2.2, bandW * 0.45 * near), 1.7, endBlend);
  // strip cameras (screen space, rotation-free)
  const camS: Cam = {x: cam.x, y: cam.y, z};
  const stripCam = (s0: number, sx: number, sy: number, zz: number): Cam => ({x: s0, y: 0, z: zz});
  void stripCam;
  const P_SKIP = {x: 1340, y: 300, z: 2.25};
  const P_A = {x: 960 - 217 * 2.0 * 0.5 - (217 * 2.0) / 2, y: 650, z: 2.0};
  const scr = (wx: number, wy: number) => toScreenR(cam, wx, wy, SPC.x, SPC.y);
  // morph a sheet range [s0,s1] from the spiral to a flat strip whose left end sits at screen (lx, ly) with zoom zz
  const stripD = (s0: number, s1: number, k: number, lx: number, ly: number, zz: number) => {
    let d = '';
    let pen = false;
    for (let i = idxAt(s0); i <= idxAt(s1); i += 2) {
      const q = SPIRAL[i];
      const kk = easeInOut(clamp(k * 1.6 - ((q.s - s0) / (s1 - s0)) * 0.6));
      const a = scr(q.x, q.y);
      const bx = lx + (q.s - s0) * zz;
      const x = lerp(a.x, bx, kk);
      const y = lerp(a.y, ly, kk) - Math.sin(kk * Math.PI) * 60;
      d += (pen ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      pen = true;
    }
    return d;
  };
  const Strip: React.FC<{id: string; s0: number; s1: number; lx: number; cy: number; zz: number; open: number; edge: string; o?: number}> = ({id, s0, s1, lx, cy, zz, open, edge, o = 1}) =>
    open > 0 ? (
      <g opacity={o}>
        <clipPath id={`${id}c${f}`}>
          <rect x={lx - 4} y={cy - 78 * zz * open} width={(s1 - s0) * zz + 8} height={156 * zz * open} rx={6} />
        </clipPath>
        <g clipPath={`url(#${id}c${f})`}>
          <World cam={{x: s0, y: 40, z: zz}} cx={lx} cy={cy}>
            <PageFace id={`${id}p${f}`} anchor={{s: 0, x: 0, y: 0}} s0={s0} s1={s1} open={1} ink={1} outline={0} />
          </World>
        </g>
        <rect x={lx - 4} y={cy - 78 * zz * open} width={(s1 - s0) * zz + 8} height={156 * zz * open} rx={6} fill="none" stroke={edge} strokeWidth={4} />
      </g>
    ) : null;
  // strip layout
  const SK = {lx: 1060, cy: 250, zz: 1.95};
  const AB = {cy: 690, zz: 1.95};
  const wA = 217 * AB.zz;
  const lxA = 960 - wA - 2;
  const lxB0 = 960 + 120 + 0;
  const lxB = lerp(lxB0, 960 + 2, join);
  const SA0 = S_BEND - 217;
  const SB0 = S_BEND_IN;
  void P_SKIP;
  void P_A;
  const spiralDim = 1 - 0.55 * Math.max(peelS > 0.6 ? stripOpen : 0, abOpen);
  return (
    <g>
      <rect width={1920} height={1080} fill={K.scanBg} />
      {tilt > 0.02 ? (
        <Coil cam={cam} tilt={tilt} pulseS={pulseS} wallGlow={pulse > 0.85 ? 0 : clamp(pulse * 3)} />
      ) : (
        <g transform={camRT(cam, SPC.x, SPC.y)} opacity={spiralDim}>
          {/* layers: close up they read as packed papyrus bands */}
          <SheetLine color={mix(K.scanLine, '#45535F', clamp(near * 2.5))} width={bandW} />
          {near > 0 && <SheetLine color="#9AABB9" width={bandW * 0.35} opacity={near} />}
          {pulseS > 0 && <SheetLine s0={Math.max(0, pulseS - 600)} s1={pulseS} color={K.saffron} width={near > 0 ? bandW * 0.6 : 2.6} />}
          {/* the neighbouring layer at the contact (white), pressing in */}
          {pair > 0 && <path d={offsetPath(S_BEND_IN - 70, S_BEND_IN + 70, (s) => 0.55 * PITCH * press * Math.exp(-(((s - S_BEND_IN) / 40) ** 2)))} fill="none" stroke={K.white} strokeWidth={Math.max(3, bandW * 0.55)} vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={pair} />}
          {/* the skipped turn */}
          {skipped > 0 && <SheetLine s0={S_BEND} s1={S_BEND_IN} color={K.coral} width={Math.max(3, bandW * 0.5)} glow={K.coral} opacity={skipped * 0.85} />}
          {/* the wrong path: along the layer to the contact, across, then along the neighbour */}
          {wrongOn && (
            <g opacity={1 - rewind}>
              <SheetLine s0={S_BEND - 18} s1={S_BEND} color={K.coral} width={Math.max(4, bandW * 0.5)} />
              {jumpK > 0 && <line x1={B.x} y1={B.y} x2={lerp(B.x, spiralAt(S_BEND_IN).x, jumpK)} y2={lerp(B.y, spiralAt(S_BEND_IN).y, jumpK)} stroke={K.coral} strokeWidth={Math.max(4, bandW * 0.5)} vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
              {wrongW > 0 && <SheetLine s0={S_BEND_IN} s1={S_BEND_IN + wrongW * (1 - rewind)} color={K.coral} width={Math.max(4, bandW * 0.5)} dash="10 7" />}
            </g>
          )}
          {/* the trace */}
          {showTrace && <SheetLine s0={t < TK_0 ? S_T0 : sStart} s1={t < TK_0 ? head : sEnd} color={K.saffron} width={traceW} glow={endBlend < 0.5 ? K.saffron : undefined} />}
          {/* corrections at the contacts: the neighbour is tried for an instant and rejected */}
          {corr.map((k, i) =>
            k > 0 && k < 1 ? (
              <SheetLine key={i} s0={(i === 0 ? S_BEND_IN : sAtTurnPhi(CONTACTS[i].turn + 1, CONTACTS[i].phi)) - 2} s1={(i === 0 ? S_BEND_IN : sAtTurnPhi(CONTACTS[i].turn + 1, CONTACTS[i].phi)) + 22 * Math.sin(k * Math.PI)} color={K.coral} width={Math.max(3, bandW * 0.45)} opacity={Math.sin(k * Math.PI)} />
            ) : null,
          )}
        </g>
      )}
      {/* the skipped turn peels out into a strip (screen space) */}
      {peelS > 0 && stripOpen < 1 && <path d={stripD(S_BEND, S_BEND_IN, peelS, SK.lx, SK.cy, SK.zz)} fill="none" stroke={K.coral} strokeWidth={4} strokeLinecap="round" opacity={1 - stripOpen} />}
      <Strip id="sk" s0={S_BEND} s1={S_BEND_IN} lx={SK.lx} cy={lerp(SK.cy, SK.cy - 30, join)} zz={SK.zz} open={stripOpen} edge={K.coral} o={1 - 0.45 * join} />
      {/* the two pieces the wrong path would put side by side */}
      {peelAB > 0 && abOpen < 1 && (
        <g opacity={1 - abOpen}>
          <path d={stripD(SA0, S_BEND, peelAB, lxA, AB.cy, AB.zz)} fill="none" stroke={K.saffron} strokeWidth={4} strokeLinecap="round" />
          <path d={stripD(SB0, SB0 + 217, peelAB, lxB, AB.cy, AB.zz)} fill="none" stroke={K.coral} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      <Strip id="pa" s0={SA0} s1={S_BEND} lx={lxA} cy={AB.cy} zz={AB.zz} open={abOpen} edge={K.saffron} />
      <Strip id="pb" s0={SB0} s1={SB0 + 217} lx={lxB} cy={AB.cy} zz={AB.zz} open={abOpen} edge={K.coral} />
      {join > 0.6 && abOpen > 0.5 && <path d={`M960 ${AB.cy - 150} L948 ${AB.cy - 90} L972 ${AB.cy - 30} L948 ${AB.cy + 30} L972 ${AB.cy + 90} L960 ${AB.cy + 150}`} fill="none" stroke={K.coral} strokeWidth={6} strokeLinejoin="round" opacity={clamp((join - 0.6) / 0.4) * abOpen} />}
      <Chip x={1890} y={44} text="Reconstruction" size={22} anchor="end" bg="rgba(255,255,255,0.88)" />
      {void camS}
      {void easeIn}
      {void easeOut}
      {void CAM0}
    </g>
  );
};
