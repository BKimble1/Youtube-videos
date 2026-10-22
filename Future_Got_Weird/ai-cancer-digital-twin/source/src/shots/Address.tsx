// 4 · DELIVER THE ATTACK ("Next, give the attack an address" → "But what if the attack stayed hidden").
//  A  the model's wireframe dissolves into real tissue; a healthy cell divides and one daughter turns cancerous;
//     free drug molecules land on healthy and tumour cells alike (healthy cells are harmed).
//  B  molecular scale: drug payloads click onto an antibody's linkers; it binds its surface target.
//  C  the membrane folds inward and pinches off a vesicle (endocytosis); the vesicle matures, enzymes inside cut the
//     linkers, the drug escapes into the cell.
//  D  pull back to the whole cell: the drug reaches the nucleus (DNA damage), the cell blebs and comes apart (contained).
//  E  "used in cancer care": an infusion line in a forearm.
//  F  side effects: a healthy cell that carries a little of the same target also takes up the conjugate.
//  G  AI-assisted protein design: candidate binders iterate against a target surface; one is chosen.
//  H  a separate therapy: the designed binder as the tip of an engineered immune-cell receptor that grips a tumour cell.
import React from 'react';
import {T, TE, clamp01, lerp, seg, smooth, easeOut, easeIn, easeInOut, pulse, noise, rand, drift, blob, mixHex} from '../kit/core';
import {Cam, camPath, smoothCam, camTransform, kick, W, H} from '../kit/cam';
import {Frame, Vignette, Flash, blurId} from '../kit/fx';
import {Cell, LOOK, tissueGrid} from '../art/cells';
import {Antibody, DnaSwitch, Enzyme, Membrane, Payload, TargetReceptor, Vesicle} from '../art/molecules';
import {Twin3D, Grid, Monitor} from '../art/digital';
import {Binder, CarReceptor, Antigen, Infusion} from '../art/lab';
import {C, M} from '../theme';

export const tNext = T('Next, give'), tOwn = T('Cancer grows'), tDrug = T('A powerful drug'), tWrong = T('the wrong tissue');
export const tSome = T('Some treatments'), tAttach = T('attach a drug'), tAnti = T('to an antibody'), tBinds = T('that binds'), tTarget = T('surface target');
export const tTakes = T('The cell takes'), tInside = T('inside.', 1), tCertain = T('In certain'), tEnz = T('enzymes cut'), tCut = T('cut its'), tRel = T('releasing the drug');
export const tMach = T("The cell’s own machinery"), tOpen = T('helps open'), tThese = T('These are antibody-drug'), tCare = T('some are already used');
export const tSide = T('They can still'), tAddr = T('a molecular address'), tAI = T('AI could help'), tComp = T('targeting components');
export const tRes = T('Researchers are already testing'), tProt = T('AI-designed proteins'), tRecog = T('recognition parts'), tImm = T('immune-cell therapies');
export const ADDRESS_END = T('But what if') - 0.04;
export const CUT_B = tSome - 0.15, CUT_D = tMach - 0.12, CUT_E = tThese - 0.1, CUT_E2 = tCare - 0.3, CUT_F = tSide - 0.12, CUT_G = tAI - 0.12, CUT_H = tRes - 0.12;

// ================================================================================================ A: tissue
const CELLS = tissueGrid(-1500, -1000, 1500, 1000, 78, 5);
const TUMOR_C = {x: 160, y: -40};
const isTumor = (c: {x: number; y: number}) => Math.hypot(c.x - TUMOR_C.x, (c.y - TUMOR_C.y) * 1.2) < 380 + 60 * noise(c.x * 0.01, 3);
// the healthy cell at the tumour's edge that divides (one daughter becomes cancerous)
const EDGE = CELLS.filter((c) => !isTumor(c)).reduce((a, c) => (Math.abs(Math.hypot(c.x - TUMOR_C.x, c.y - TUMOR_C.y) - 470) + Math.abs(c.y + 40) * 0.5 < Math.abs(Math.hypot(a.x - TUMOR_C.x, a.y - TUMOR_C.y) - 470) + Math.abs(a.y + 40) * 0.5 ? c : a));
const DROPS = Array.from({length: 46}, (_, i) => {
  const c = CELLS[Math.floor(rand(i * 17 + 3) * CELLS.length)];
  return {c, t0: tDrug + 0.1 + rand(i * 5) * 1.6, fromX: c.x + (rand(i * 7) - 0.5) * 600};
});
const camA = camPath([
  [tNext - 0.1, {x: TUMOR_C.x, y: TUMOR_C.y, z: 1.6}],
  [tNext + 1.4, {x: 60, y: -20, z: 0.95}, easeOut],
  [tOwn - 0.1, {x: 40, y: -20, z: 1.0}],
  [tOwn + 0.6, {x: EDGE.x + 40, y: EDGE.y, z: 2.6}],
  [tDrug - 0.15, {x: EDGE.x + 50, y: EDGE.y, z: 2.75}],
  [tDrug + 0.6, {x: 0, y: 0, z: 1.05}],
  [tWrong, {x: -200, y: 60, z: 1.25}],
  [CUT_B, {x: -260, y: 80, z: 1.45}],
]);
const TissueA: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camA, t, 0.2);
  const wire = 1 - smooth(seg(t, tNext, tNext + 1.2));
  const div = seg(t, tOwn + 0.2, tOwn + 1.5);
  const turn = smooth(seg(t, tOwn + 1.1, tOwn + 1.9));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#7A3A4A" />
      {CELLS.map((c, i) => {
        const tum = isTumor(c);
        const edge = c === EDGE;
        // healthy cells hit by free drug get stressed
        const hit = DROPS.filter((d) => d.c === c).reduce((m, d) => Math.max(m, seg(t, d.t0 + 0.7, d.t0 + 1.6)), 0);
        if (edge) {
          const focus = smooth(seg(t, tOwn - 0.1, tOwn + 0.4)) * (1 - smooth(seg(t, tDrug - 0.2, tDrug + 0.3)));
          return (
            <g key={i}>
              {focus > 0.01 && <circle cx={c.x} cy={c.y} r={c.r * 2.1} fill="#FFE9A8" opacity={0.18 * focus} />}
              <Cell x={c.x - 6} y={c.y} r={c.r} seed={c.seed} t={t} look={LOOK.healthy} divide={div} op={1 - turn} />
              {turn > 0.01 && (
                <g>
                  <Cell x={c.x - c.r * 0.62} y={c.y} r={c.r * 0.86} seed={c.seed} t={t} look={LOOK.healthy} />
                  <Cell x={c.x + c.r * 0.62} y={c.y} r={c.r * 0.86} seed={c.seed + 7} t={t} look={turn > 0.5 ? LOOK.tumor : LOOK.healthy} op={1} chromatin={turn * 0.3} />
                  <circle cx={c.x + c.r * 0.62} cy={c.y} r={c.r * 1.1} fill={M.tumor} opacity={0.25 * pulse(t, tOwn + 1.5, 0.3)} />
                </g>
              )}
            </g>
          );
        }
        return <Cell key={i} x={c.x} y={c.y} r={c.r} seed={c.seed} t={t} look={tum ? LOOK.tumor : LOOK.healthy} detail={0.8} bleb={tum ? 0 : hit * 0.7} />;
      })}
      {/* free drug: falls everywhere, healthy tissue included */}
      {DROPS.map((d, i) => {
        const u = seg(t, d.t0, d.t0 + 0.8);
        if (u <= 0) return null;
        const x = lerp(d.fromX, d.c.x + (rand(i) - 0.5) * 40, easeOut(u)), y = lerp(d.c.y - 900, d.c.y + (rand(i + 1) - 0.5) * 40, easeOut(u));
        return <Payload key={i} x={x} y={y} r={22} rot={t * 90 + i * 20} glow={0.5 + pulse(t, d.t0 + 0.8, 0.2)} op={1 - 0.4 * smooth(seg(t, d.t0 + 1.4, d.t0 + 2.4))} />;
      })}
      {wire > 0.01 && (
        <g opacity={wire} transform={`translate(${TUMOR_C.x} ${TUMOR_C.y})`}>
          <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} opacity={wire * 0.9} transform={`translate(${-TUMOR_C.x} ${-TUMOR_C.y})`} />
          <g transform="scale(2.1)"><Twin3D shape={{R: 200, seed: 20 + 17, rough: 0.25}} rotY={t * 0.4 + 17} lw={1.6} nLat={6} nLon={9} /></g>
        </g>
      )}
    </g>
  );
};

// ================================================================================================ B + C: molecular
const RX = [-40, 40]; // the two target receptors the antibody grips
export const tBind = tTarget + 0.15;
export const tPit0 = tTakes + 0.05, tPinch = tInside + 0.25;
const VR = 130;
const pitD = (t: number) => 300 * easeInOut(seg(t, tPit0, tPinch));
const memB = (x: number, t: number) => {
  const D = t < tPinch ? pitD(t) : 300 * (1 - easeOut(seg(t, tPinch, tPinch + 0.35)));
  const w = lerp(150, 105, seg(t, tPit0, tPinch));
  return (x * x) / 5200 + D * Math.exp(-(x * x) / (2 * w * w));
};
const vesC = (t: number) => {
  const u = easeInOut(seg(t, tPinch, tCertain + 0.3));
  return {x: lerp(0, 80, u), y: lerp(300 - VR, 420, u)};
};
const PAY_ORIGIN = [[-11, -4, -1], [11, -4, 1], [-10, 26, -1], [10, 26, 1]];
const camBC = camPath([
  [CUT_B, {x: 0, y: -400, z: 3.3}],
  [tAnti + 0.3, {x: 0, y: -380, z: 2.9}],
  [tBinds + 0.1, {x: 0, y: -190, z: 1.25}],
  [tBind + 0.3, {x: 0, y: -100, z: 1.55}],
  [tPit0 + 0.3, {x: 0, y: 40, z: 1.35}],
  [tPinch + 0.2, {x: 0, y: 160, z: 1.4}],
  [tCertain + 0.4, {x: 80, y: 420, z: 2.0}],
  [tEnz + 0.4, {x: 80, y: 420, z: 2.5}],
  [tRel + 0.3, {x: 80, y: 440, z: 1.7}],
  [CUT_D, {x: 80, y: 440, z: 1.45}],
]);
const Molecular: React.FC<{t: number}> = ({t}) => {
  const cam = kick(smoothCam(camBC, t, 0.2), t, tPinch, 6, 0.3);
  // antibody path: assemble high above, turn arms-down, descend, bind, ride the pit down into the vesicle
  const asm = (i: number) => easeOut(seg(t, tAttach - 0.2 + i * 0.28, tAttach + 0.45 + i * 0.28));
  const turn = easeInOut(seg(t, tAnti + 0.4, tBinds + 0.3));
  const desc = easeInOut(seg(t, tBinds - 0.1, tBind));
  const inPit = t < tPinch;
  const recY = (x: number) => memB(x, t) - 14;
  let abX = 0, abY = lerp(-420, recY(0) - 64 - 52, desc), abRot = 180 * turn;
  if (t >= tPinch) {
    const v = vesC(t);
    abX = v.x; abY = v.y + 5; abRot = 180;
  }
  const lumen = smooth(seg(t, tCertain - 0.2, tCertain + 0.8));
  // enzymes: drift inside, then bite linkers one by one
  const cuts = [0, 1, 2, 3].map((i) => smooth(seg(t, tCut + i * 0.32, tCut + 0.1 + i * 0.32)));
  const rel = [0, 1, 2, 3].map((i) => easeOut(seg(t, tRel - 0.2 + i * 0.12, tRel + 1.1 + i * 0.12)));
  const v = vesC(t);
  const bodyY = memB(0, t);
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2600} width={6000} height={6000} fill={M.void} />
      {/* soft crowd above the membrane */}
      <g filter={blurId(6)} opacity={0.6}>
        {Array.from({length: 26}, (_, i) => <path key={i} d={blob((rand(i * 3) - 0.5) * 2600, -300 - rand(i * 5) * 900 + noise(t * 0.2, i) * 30, 20 + rand(i) * 40, i, t, 0.2, 9)} fill={['#4F3A6E', '#3E4A6A', '#5A3550'][i % 3]} />)}
      </g>
      {/* cell interior */}
      <path d={`M -2600 ${memB(-2600, t)} ${Array.from({length: 105}, (_, i) => { const x = -2600 + i * 50; return `L ${x} ${memB(x, t)}`; }).join(' ')} L 2600 3000 L -2600 3000 Z`} fill={mixHex(M.cytoDeep, '#5A2A3A', 0.35)} />
      {/* a few organelles deep in the cytoplasm */}
      {[[-520, 520], [420, 760], [-260, 900], [700, 420]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 40 + noise(t * 0.2, i) * 8})`} opacity={0.6}>
          <ellipse rx={90} ry={40} fill="#D98A62" stroke={C.ink} strokeWidth={4} />
          <path d="M -60 0 q 15 -30 30 0 t 30 0 t 30 0" fill="none" stroke={C.ink} strokeWidth={3} opacity={0.6} />
        </g>
      ))}
      {/* vesicle after the pinch */}
      {t >= tPinch && (
        <g transform={`translate(${v.x} ${v.y})`}>
          <Vesicle r={VR} lumen={mixHex(M.cyto, M.lyso, lumen)} lumenOp={0.55 + 0.35 * lumen} t={t} />
          {/* receptors now in the vesicle wall, pointing into the lumen */}
          {RX.map((x, i) => <g key={i} transform={`translate(${x * 0.95} ${Math.sqrt(VR * VR - x * x) - 14}) rotate(${-Math.asin(x / VR) * 57.3})`}><TargetReceptor t={t} seed={i} bound={1} /></g>)}
          {/* enzymes in the maturing compartment */}
          {lumen > 0.01 && [0, 1, 2].map((i) => {
            const target = [[-52, 14], [52, 14], [-48, 44]][i];
            const go = easeInOut(seg(t, tEnz - 0.5 + i * 0.3, tCut + i * 0.32));
            const home = [-70 + i * 60, -70 + noise(t * 0.5, i) * 10];
            const ex = lerp(home[0], target[0] + (i === 1 ? 26 : -26), go), ey = lerp(home[1], target[1] - 18, go);
            return <g key={i} transform={`translate(${ex - v.x + abX} ${ey - v.y + abY - 5}) rotate(${i === 1 ? 60 : -60}) scale(0.62)`} opacity={lumen}><Enzyme t={t} seed={i} bite={cuts[i]} flash={cuts[i] > 0 && cuts[i] < 1 ? cuts[i] : 0} /></g>;
          })}
        </g>
      )}
      {/* membrane (with the pit) */}
      <Membrane f={(x) => memB(x, t)} x0={cam.x - 1200 / cam.z} x1={cam.x + 1200 / cam.z} t={t} step={10} th={28} hr={4.6} />
      {/* other surface targets nearby */}
      {[-560, -330, 300, 520, 760].map((x, i) => <g key={i} transform={`translate(${x} ${memB(x, t) - 14})`}><TargetReceptor t={t} seed={i + 5} /></g>)}
      {inPit && RX.map((x, i) => {
        const sl = (memB(x + 1, t) - memB(x - 1, t)) / 2;
        return <g key={i} transform={`translate(${x} ${recY(x)}) rotate(${Math.atan(sl) * 57.3})`}><TargetReceptor t={t} seed={i} bound={desc} /></g>;
      })}
      {/* the antibody-drug conjugate */}
      <g transform={`translate(${abX} ${inPit ? (desc >= 1 ? bodyY - 14 - 64 - 52 : abY) : abY}) rotate(${abRot})`}>
        <Antibody t={t} payloads={PAY_ORIGIN.filter((_, i) => asm(i) >= 1).length} cut={cuts.map((c) => (c > 0.5 ? 1 : 0))} hide={rel.map((r) => r > 0)} />
      </g>
      {/* payloads flying in to their linkers (assembly), and escaping after release */}
      {PAY_ORIGIN.map(([px, py, sd], i) => {
        const a = asm(i);
        if (a < 1) {
          const tx = (px + sd * 22), ty = py + 6;
          const fx = sd * 600, fy = -260 + i * 120;
          return <Payload key={i} x={lerp(fx, tx, a)} y={lerp(fy, ty, a) - 420} r={8} rot={(1 - a) * 300} glow={pulse(t, tAttach + 0.45 + i * 0.28, 0.12)} />;
        }
        if (rel[i] <= 0) return null;
        // released: from the antibody (rotated 180°) out through the vesicle wall into the cytoplasm
        const ox = abX - (px + sd * 22), oy = abY - (py + 6);
        const ang = -1.2 + i * 0.8;
        const d = rel[i] * 230;
        return <Payload key={'r' + i} x={ox + Math.cos(ang) * d} y={oy + Math.sin(ang) * d * 0.8 + 40 * rel[i]} r={8} rot={t * 60 + i * 30} glow={0.6} />;
      })}
    </g>
  );
};

// ================================================================================================ D: whole-cell cutaway
const camD = camPath([
  [CUT_D, {x: 140, y: 120, z: 3.0}],
  [tOpen, {x: 40, y: 20, z: 1.15}, easeOut],
  [CUT_E, {x: 0, y: 0, z: 1.25}],
]);
const CellCutaway: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camD, t, 0.2);
  const spread = easeOut(seg(t, CUT_D, tOpen + 0.3));
  const dmg = smooth(seg(t, tOpen - 0.2, tOpen + 0.8));
  const bleb = smooth(seg(t, tOpen + 0.2, CUT_E));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#6E3446" />
      {[[-620, -300], [640, -260], [-600, 330], [620, 360], [0, -560], [0, 580]].map(([x, y], i) => <Cell key={i} x={x} y={y} r={240} seed={i + 30} t={t} look={i % 2 ? LOOK.tumor : LOOK.healthy} detail={0.7} />)}
      <Cell x={0} y={0} r={360} seed={7} t={t} look={LOOK.tumor} bleb={bleb} damage={dmg} detail={1} lw={4} />
      {/* lysosomes and the drug spreading from one of them toward the nucleus */}
      {[[140, 120], [-210, 170], [210, -160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 ? 34 : 24} fill={M.lyso} stroke={C.ink} strokeWidth={4} />)}
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const x = lerp(140, 30 + Math.cos(a) * 80, spread), y = lerp(120, -10 + Math.sin(a) * 70, spread);
        return <Payload key={i} x={x + noise(t + i, i) * 6} y={y + noise(t * 1.2 + i, i + 3) * 6} r={9} rot={t * 50 + i * 40} glow={0.4} op={1 - 0.4 * dmg} />;
      })}
    </g>
  );
};

// ================================================================================================ E: tissue + care
const VESSEL_Y = -520;
const camE = camPath([
  [CUT_E, {x: 0, y: -160, z: 0.85}],
  [CUT_E2, {x: 80, y: -120, z: 0.95}],
]);
const TissueE: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camE, t, 0.2);
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#7A3A4A" />
      {CELLS.map((c, i) => {
        const tum = isTumor(c);
        const d = tum ? seg(t, CUT_E + rand(i) * 1.4, CUT_E + 1.6 + rand(i) * 1.4) * (rand(i * 3) < 0.6 ? 1 : 0.4) : 0;
        return <Cell key={i} x={c.x} y={c.y + 120} r={c.r} seed={c.seed} t={t} look={tum ? LOOK.tumor : LOOK.healthy} detail={0.6} die={d} />;
      })}
      {/* capillary with conjugates in the flow */}
      <rect x={-3000} y={VESSEL_Y - 110} width={6000} height={220} fill="#B8404F" stroke={C.ink} strokeWidth={8} />
      <rect x={-3000} y={VESSEL_Y - 80} width={6000} height={160} fill="#D45A63" />
      {Array.from({length: 18}, (_, i) => {
        const x = ((rand(i) * 4000 + t * 260) % 4000) - 2000;
        return <ellipse key={i} cx={x} cy={VESSEL_Y + (rand(i * 3) - 0.5) * 100} rx={44} ry={20} fill="#E8737A" stroke={C.ink} strokeWidth={4} />;
      })}
      {Array.from({length: 10}, (_, i) => {
        const x = ((rand(i + 50) * 4000 + t * 200) % 4000) - 2000;
        return <g key={i} transform={`translate(${x} ${VESSEL_Y + (rand(i * 7) - 0.5) * 90}) rotate(${t * 40 + i * 50}) scale(0.7)`}><Antibody t={t} seed={i} /></g>;
      })}
    </g>
  );
};
const CareShot: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_E2, {x: -40, y: -300, z: 1.0}], [CUT_F, {x: 20, y: -200, z: 1.14}]]), t, 0.2);
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={C.paper} />
      <rect x={-3000} y={150} width={6000} height={2000} fill={C.paperDeep} />
      <Infusion t={t} />
    </g>
  );
};

// ================================================================================================ F: side effects
const camF = camPath([
  [CUT_F, {x: 0, y: 0, z: 0.95}],
  [tAddr - 0.2, {x: 120, y: 10, z: 1.25}],
  [tAddr + 0.6, {x: 150, y: -40, z: 2.1}],
  [CUT_G, {x: 150, y: -40, z: 2.2}],
]);
const SideEffects: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camF, t, 0.2);
  const bind = easeInOut(seg(t, tSide + 0.2, tSide + 1.4));
  const harm = smooth(seg(t, tAddr, tAddr + 1.5));
  // healthy epithelium (columnar cells in a row); one carries a little of the same target
  const cols = Array.from({length: 11}, (_, i) => -1000 + i * 200);
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#3B2440" />
      <rect x={-3000} y={260} width={6000} height={2000} fill="#5E3446" />
      {cols.map((x, i) => {
        const me = i === 6;
        return (
          <g key={i}>
            <path d={blob(x, 80, 96, i + 70, t, 0.04, 16, 1, 1.9)} fill={me ? mixHex(M.healthy, '#A4818A', harm * 0.5) : M.healthy} stroke={C.ink} strokeWidth={6} />
            <ellipse cx={x} cy={150 + (me ? harm * 10 : 0)} rx={42} ry={50} fill={me ? mixHex(M.nucleus, '#3A2030', harm * 0.6) : M.nucleus} stroke={C.ink} strokeWidth={4} />
            {/* a few copies of the target on the apical surface */}
            {(me ? [-30, 30] : i % 3 === 0 ? [10] : []).map((dx, k) => <g key={k} transform={`translate(${x + dx} ${-86}) scale(0.9)`}><TargetReceptor t={t} seed={i + k} bound={me ? bind : 0} /></g>)}
            {me && harm > 0.01 && [0, 1, 2].map((k) => <Payload key={k} x={x + (k - 1) * 34 + noise(t + k, k) * 4} y={lerp(-40, 120, harm) + k * 14} r={10} rot={t * 50 + k * 30} glow={0.6} />)}
            {me && harm > 0.2 && [0, 1, 2, 3].map((k) => <circle key={'b' + k} cx={x + (k % 2 ? 96 : -96) * 0.98} cy={40 + k * 50} r={20 * smooth((harm - 0.2) * 1.5)} fill={M.healthy} stroke={C.ink} strokeWidth={4} />)}
          </g>
        );
      })}
      {/* conjugates drifting over the healthy surface; one binds the healthy cell's target */}
      {[0, 1, 2].map((i) => {
        const x0 = -700 + i * 520, me = i === 1;
        const x = me ? lerp(x0, cols[6], bind) : x0 + drift(t, i, 3) * 60;
        const y = me ? lerp(-420, -86 - 64 - 52 + 22, bind) : -380 + drift(t, i + 5, 2.5) * 40;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${me ? lerp(30, 180, bind) : 150 + i * 30}) scale(0.9)`}><Antibody t={t} seed={i} payloads={me && harm > 0.3 ? 0 : 4} /></g>;
      })}
    </g>
  );
};

// ================================================================================================ G: protein design
const DesignShot: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_G, {x: 0, y: 0, z: 1.05}], [tComp, {x: -120, y: 10, z: 1.2}], [CUT_H, {x: -200, y: 10, z: 1.45}]]), t, 0.2);
  const iter = (t - CUT_G) * 3.2;
  const settle = smooth(seg(t, tComp - 0.1, tComp + 0.6));
  const dock = easeInOut(seg(t, tComp + 0.3, CUT_H - 0.1));
  const sel = 4;
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={C.paper} />
      <g transform="translate(0 -20)">
        <Monitor w={1500} h={820} id="designMon" stand={false}>
          <rect x={-800} y={-450} width={1600} height={900} fill={M.screen} />
          <Grid x0={-800} y0={-450} x1={800} y1={450} step={50} op={0.2} />
          {/* target surface (a pocket on the antigen) */}
          <g transform="translate(-300 120)">
            <path d="M -260 160 L -260 20 C -200 -40 -140 -40 -90 0 C -60 30 60 30 90 0 C 140 -40 200 -40 260 20 L 260 160 Z" fill="#E58FB0" stroke={C.ink} strokeWidth={5} />
            <path d="M -80 6 C -40 40 40 40 80 6" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="10 8" opacity={0.7} />
          </g>
          {/* current candidate binder trying to fit */}
          <g transform={`translate(${lerp(-300, -300, dock)} ${lerp(-130, 72, dock)}) rotate(${lerp(-10 + 10 * Math.sin(iter * 2), 0, settle)})`}>
            <Binder s={1.25} morph={lerp(iter, Math.floor(iter), settle) * (1 - settle) + 4 * settle} t={t} seed={sel} />
          </g>
          {/* fit indicator */}
          <circle cx={-300} cy={20} r={170} fill="none" stroke={settle > 0.5 ? M.target : M.wireDim} strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={t * 40} opacity={0.6} />
          {/* candidate grid */}
          {Array.from({length: 12}, (_, i) => {
            const gx = 250 + (i % 3) * 170, gy = -270 + Math.floor(i / 3) * 170;
            const lit = Math.floor(iter) % 12 === i && settle < 0.5;
            const chosen = i === sel && settle > 0.5;
            return (
              <g key={i} transform={`translate(${gx} ${gy})`}>
                <rect x={-72} y={-72} width={144} height={144} rx={16} fill={M.screenLift} stroke={chosen ? M.target : lit ? M.wireHot : M.wireDim} strokeWidth={chosen || lit ? 5 : 2} />
                <g transform="scale(0.5)" opacity={chosen ? 1 : 0.55}><Binder morph={i * 1.3} seed={i} t={t} color={chosen ? M.car : '#C9B470'} /></g>
              </g>
            );
          })}
        </Monitor>
      </g>
    </g>
  );
};

// ================================================================================================ H: engineered immune cell
const TC = {x: -420, y: 0, r: 300};
const TU = {x: 520, y: 20, r: 280};
const CarShot: React.FC<{t: number}> = ({t}) => {
  const close = 1 - smooth(seg(t, tProt + 0.3, tRecog + 0.2));
  const approach = easeInOut(seg(t, tRecog - 0.4, tImm + 0.2));
  const bound = smooth(seg(t, tImm - 0.3, tImm + 0.5));
  const tcX = TC.x + approach * 150;
  const cam = smoothCam(camPath([
    [CUT_H, {x: tcX + TC.r + 60, y: -40, z: 4.2}],
    [tProt + 0.3, {x: tcX + TC.r + 60, y: -40, z: 3.4}],
    [tRecog + 0.3, {x: 50, y: 0, z: 1.0}, easeOut],
    [ADDRESS_END, {x: 100, y: 0, z: 1.12}],
  ]), t, 0.2);
  // CARs around the right side of the T cell; the one in close-up receives its designed binder tip
  const cars = Array.from({length: 9}, (_, i) => -0.95 + i * 0.24);
  const snap = smooth(seg(t, CUT_H + 0.2, tProt + 0.1));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#2A2238" />
      <g filter={blurId(5)} opacity={0.5}>{Array.from({length: 14}, (_, i) => <path key={i} d={blob((rand(i) - 0.5) * 2600, (rand(i + 9) - 0.5) * 1600, 30 + rand(i * 3) * 40, i, t, 0.2, 9)} fill="#4F3A6E" />)}</g>
      {/* tumour cell with antigens facing left */}
      <Cell x={TU.x} y={TU.y} r={TU.r} seed={41} t={t} look={LOOK.tumor} detail={1} />
      {Array.from({length: 8}, (_, i) => {
        const a = Math.PI - 0.85 + i * 0.24;
        return <g key={i} transform={`translate(${TU.x + Math.cos(a) * (TU.r + 6)} ${TU.y + Math.sin(a) * (TU.r + 6)}) rotate(${(a * 180) / Math.PI + 90})`}><Antigen t={t} seed={i} s={1.1} /></g>;
      })}
      {/* T cell */}
      <Cell x={tcX} y={TC.y} r={TC.r} seed={12} t={t} look={LOOK.tcell} detail={1} />
      {bound > 0.01 && <circle cx={tcX + TC.r * 0.6} cy={TC.y} r={TC.r * 0.5} fill={M.signal} opacity={0.25 * bound * (0.7 + 0.3 * Math.sin(t * 8))} />}
      {cars.map((a, i) => {
        const me = i === 4;
        return (
          <g key={i} transform={`translate(${tcX + Math.cos(a) * (TC.r + 4)} ${TC.y + Math.sin(a) * (TC.r + 4)}) rotate(${(a * 180) / Math.PI + 90})`}>
            <CarReceptor t={t} seed={i} bound={bound} s={1.15} />
            {me && snap < 1 && <g transform={`translate(0 ${-70 - 300 * (1 - snap)}) rotate(90) scale(${0.48})`} opacity={1 - smooth(seg(t, tProt - 0.1, tProt + 0.1)) * 0}><Binder seed={4} t={t} /></g>}
          </g>
        );
      })}
      <Flash op={0} />
      {close > 0.5 && pulse(t, tProt + 0.1, 0.1) > 0.05 && <circle cx={tcX + TC.r + 74} cy={TC.y} r={22} fill={M.car} opacity={pulse(t, tProt + 0.1, 0.1) * 0.4} />}
    </g>
  );
};

export const Address: React.FC<{t: number}> = ({t}) => {
  const part = t < CUT_B ? 'A' : t < CUT_D ? 'BC' : t < CUT_E ? 'D' : t < CUT_E2 ? 'E' : t < CUT_F ? 'E2' : t < CUT_G ? 'F' : t < CUT_H ? 'G' : 'H';
  const bg = part === 'E2' || part === 'G' ? C.paper : M.void;
  return (
    <Frame bg={bg}>
      {part === 'A' && <TissueA t={t} />}
      {part === 'BC' && <Molecular t={t} />}
      {part === 'D' && <CellCutaway t={t} />}
      {part === 'E' && <TissueE t={t} />}
      {part === 'E2' && <CareShot t={t} />}
      {part === 'F' && <SideEffects t={t} />}
      {part === 'G' && <DesignShot t={t} />}
      {part === 'H' && <CarShot t={t} />}
      <Vignette op={bg === C.paper ? 0.3 : 0.75} />
      {/* the opening device's silhouette sweeps in to carry the cut back to the DNA switch */}
      {t > ADDRESS_END - 0.3 && <g transform={`translate(${lerp(3700, 960, easeIn(seg(t, ADDRESS_END - 0.3, ADDRESS_END)))} 560) scale(12)`}><DnaSwitch silhouette t={t} /></g>}
    </Frame>
  );
};
export const _a = {TE, clamp01, easeIn, W, H, Grid};
