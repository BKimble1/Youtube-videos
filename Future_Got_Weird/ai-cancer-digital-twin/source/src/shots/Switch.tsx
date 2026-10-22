// 5 · RETURN TO THE DNA SWITCH ("But what if the attack stayed hidden" → "Then one cell threatens").
//  A  the opening device's silhouette wipes the immune-cell scene away; wide: the closed device drifts from neutral
//     surroundings into the warmer, more acidic space near the tumour.
//  B  push in to the opening framing ("Return to the device from the opening"); a long DNA strand folds into the
//     device's helix bundle ("a switch from folded DNA").
//  C  bottom-up cutaway: the concealed hexagonal peptide pattern; scattered death receptors on the cell surface are
//     brought together under it.
//  D  side view at the membrane: protons gather on the locks, the flaps swing open, the pattern binds and clusters the
//     receptors, a signal cascades inward → cut to cell scale: the cell condenses, blebs and comes apart (apoptosis).
//  E  the evidence: two cages — inactive device vs active device — tumours grow in both, more slowly with the switch.
//  F  a real experiment, not a human cure (a long dashed path to a human outline), designed by people (a routing
//     sketch on paper, pencil moving).
//  G  the opportunity: the model and the device drawn toward each other, joined only by a dashed link through an
//     experiment gate.
import React from 'react';
import {T, TE, clamp01, lerp, seg, smooth, easeOut, easeIn, easeInOut, pulse, noise, rand, drift, blob, mixHex, P, openPath} from '../kit/core';
import {Cam, camPath, smoothCam, camTransform, kick, W, H} from '../kit/cam';
import {Frame, Vignette, Flash, blurId} from '../kit/fx';
import {MicroWorld, memY, SLOTS} from '../sets/micro';
import {DnaSwitch, Helix, LigandHex, Peptide} from '../art/molecules';
import {Cell, LOOK, tissueGrid} from '../art/cells';
import {Grid, Twin3D} from '../art/digital';
import {Cage, Mouse, Person, RESEARCHER, Bench, TubeRack} from '../art/lab';
import {DeviceIcon} from '../art/icons';
import {IDLE, Pose, mixPose} from '../components/Character';
import {C, M} from '../theme';

export const tBut = T('But what if'), tSurr = T('until its surroundings'), tRet = T('Return to the device'), tKaro = T('Researchers at Karolinska'), tFold = T('folded DNA');
export const tHides = T('It hides a pattern'), tBring = T('bring death receptors'), tTog = T('together on'), tUnder = T('Under acidic'), tExp = T('the structure exposes');
export const tHelp = T('helping trigger'), tSelf = T('self-destruct process'), tMice = T('They tested'), tReduced = T('reported reduced'), tReal = T('That is a real');
export const tHuman = T('It is not a human'), tAInv = T('and this particular'), tFut = T('The future opportunity'), tIfExp = T('if experiments');
export const SWITCH_END = T('Then one cell') - 0.04;
export const CUT_B = tRet - 0.1, CUT_C = tHides - 0.1, CUT_D = tUnder - 0.1, CUT_D2 = tHelp + 0.5, CUT_E = tMice - 0.1, CUT_F = tReal - 0.1, CUT_G = tFut - 0.1;

// ================================================================================================ A + B: micro world
const devA = (t: number) => {
  const u = smooth(seg(t, tBut - 0.6, CUT_B + 1.2));
  return {x: lerp(-900, 260, u) + drift(t, 3, 2.4) * 30, y: -330 + drift(t, 5, 2.1) * 26, rot: drift(t, 8, 2.8) * 10};
};
const camAB = camPath([
  [tBut, {x: -500, y: -200, z: 0.62, rot: -6}],
  [tSurr + 0.6, {x: 120, y: -220, z: 0.7, rot: -4}],
  [CUT_B, {x: 200, y: -260, z: 0.9, rot: 0}],
  [tRet + 0.9, {x: 220, y: -330, z: 2.9}],
  [tKaro + 0.2, {x: 240, y: -330, z: 2.6}],
  [tKaro + 0.9, {x: 250, y: -320, z: 1.45}],
  [tFold + 0.5, {x: 255, y: -320, z: 1.9}],
  [CUT_C, {x: 260, y: -320, z: 2.7}],
]);
// a single scaffold strand that snakes through the seven helix rows (boustrophedon), local to the device
const ROUTE: P[] = (() => {
  const rows: [number, number, number][] = [[-44, -140, 140], [-27, 140, -140], [-10, -140, 140], [24, 138, -138], [41, -138, 138]];
  const pts: P[] = [];
  rows.forEach(([y, a, b]) => {
    for (let k = 0; k <= 24; k++) pts.push([lerp(a, b, k / 24), y]);
  });
  return pts;
})();
const FoldStrand: React.FC<{t: number; f: number}> = ({t, f}) => {
  const n = ROUTE.length;
  const pts: P[] = ROUTE.map(([x, y], k) => {
    const u = k / (n - 1);
    const loose: P = [-560 + 1120 * u + 140 * Math.sin(u * 11 + t * 0.6), -40 + 190 * Math.sin(u * 6.5 + 1 + t * 0.4) + 60 * noise(u * 9 + t * 0.3, 2)];
    const k2 = smooth(clamp01(f * 1.5 - u * 0.5));
    return [lerp(loose[0], x, k2), lerp(loose[1], y, k2)];
  });
  const staples = [0.12, 0.28, 0.41, 0.55, 0.69, 0.83];
  return (
    <g>
      <path d={openPath(pts, 0.9)} fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
      <path d={openPath(pts, 0.9)} fill="none" stroke={M.dna} strokeWidth={8} strokeLinecap="round" />
      {staples.map((s, i) => {
        const k = Math.floor(s * (n - 1));
        const p = pts[k], q = pts[Math.min(n - 1, k + 26)];
        const on = smooth(seg(f, s * 0.6, s * 0.6 + 0.25));
        return on > 0.01 ? <path key={i} d={`M ${p[0]} ${p[1]} L ${lerp(p[0], q[0], on)} ${lerp(p[1], q[1], on)}`} stroke={[M.peptide, M.receptor, M.antibody][i % 3]} strokeWidth={4} strokeLinecap="round" opacity={0.9} /> : null;
      })}
    </g>
  );
};
const MicroAB: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camAB, t, 0.22);
  const d = devA(t);
  const warm = smooth(seg(d.x, -200, 300));
  const f = easeInOut(seg(t, tKaro + 0.4, tFold + 0.9));
  const folding = t > tKaro && t < CUT_C;
  // the device dissolves into the loose strand, then refolds (a teaching cutaway; crowd dimmed)
  const dissolve = smooth(seg(t, tKaro - 0.1, tKaro + 0.3));
  const assembled = smooth(seg(f, 0.85, 1));
  const devOp = folding ? Math.max(1 - dissolve, assembled) : 1;
  // the wipe: the opening device's silhouette sweeps across the lens
  const wipe = seg(t, tBut - 0.06, tBut + 0.42);
  return (
    <g>
      <MicroWorld t={t} cam={cam} devX={d.x} devY={d.y} devRot={d.rot * (1 - dissolve)} acid={warm * 0.6} crowd={folding ? lerp(1, 0.35, dissolve) : 1} showDevice={devOp > 0.02} devOp={devOp} over={
        folding ? <g transform={`translate(${d.x} ${d.y})`} opacity={1 - assembled}><FoldStrand t={t} f={f} /></g> : undefined
      } />
      {/* the acidic tumour neighbourhood: a warm haze to the right */}
      <g transform={camTransform(cam)} opacity={0.5 * (1 - (folding ? dissolve : 0))}>
        <defs><linearGradient id="acidZone" x1="0" x2="1"><stop offset="0" stopColor={M.acid} stopOpacity={0} /><stop offset="1" stopColor="#C8703A" stopOpacity={0.45} /></linearGradient></defs>
        <rect x={-400} y={-2000} width={3600} height={1900} fill="url(#acidZone)" />
      </g>
      {wipe < 1 && (
        <g transform={`translate(${lerp(960, -1900, easeOut(wipe))} 560) scale(12)`}>
          <DnaSwitch silhouette t={t} />
        </g>
      )}
    </g>
  );
};

// ================================================================================================ C: bottom-up cutaway
const RECS_TOP = Array.from({length: 14}, (_, i) => ({x: (rand(i * 7 + 1) - 0.5) * 1300, y: (rand(i * 11 + 2) - 0.5) * 700}));
const HEX_R = 170;
const TopDown: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_C, {x: 0, y: 0, z: 1.25}], [tBring, {x: 0, y: 0, z: 1.05}], [CUT_D, {x: 0, y: 0, z: 1.5}]]), t, 0.2);
  const reveal = smooth(seg(t, tHides + 0.1, tHides + 1.0));
  const gather = easeInOut(seg(t, tBring + 0.2, tTog + 0.8));
  const plateOp = 0.3 + 0.7 * (1 - reveal);
  return (
    <g transform={camTransform(cam)}>
      {/* the cell surface seen from above: a field of lipid heads */}
      <rect x={-2000} y={-1400} width={4000} height={2800} fill={M.membraneCore} />
      {Array.from({length: 26 * 15}, (_, i) => {
        const gx = (i % 26) - 13, gy = Math.floor(i / 26) - 7;
        return <circle key={i} cx={gx * 80 + (gy % 2 ? 40 : 0) + noise(t + i, 3) * 3} cy={gy * 70} r={22} fill={M.membrane} stroke={mixHex(M.membraneDeep, '#ffffff', 0.3)} strokeWidth={3} />;
      })}
      {/* receptors (top view: trimer heads) */}
      {RECS_TOP.map((r, i) => {
        const k = i < 6 ? gather : 0;
        const a = (i / 6) * Math.PI * 2;
        const x = lerp(r.x + drift(t, i, 3) * 20, Math.cos(a) * HEX_R, k), y = lerp(r.y + drift(t, i + 5, 3) * 20, Math.sin(a) * HEX_R, k);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 40 + t * 10})`}>
            {[0, 1, 2].map((j) => <circle key={j} cx={Math.cos((j / 3) * Math.PI * 2) * 13} cy={Math.sin((j / 3) * Math.PI * 2) * 13} r={15} fill={M.receptor} stroke={C.ink} strokeWidth={3} />)}
            {k > 0.9 && <circle r={36} fill={M.signal} opacity={0.3 * pulse(t, tTog + 0.9, 0.3)} />}
          </g>
        );
      })}
      {/* the device's ligand plate, seen from below: translucent shell over the hexagonal pattern */}
      <g opacity={plateOp}>
        {[-2, -1, 0, 1, 2].map((k) => <g key={k} transform={`translate(-380 ${k * 72}) `}><Helix L={760} d={70} phase={t * 0.1 + k} /></g>)}
      </g>
      <g transform="scale(2.4)"><LigandHex r={HEX_R / 2.4} reveal={reveal} glow={reveal * 0.6} lines={reveal * 0.8} /></g>
    </g>
  );
};

// ================================================================================================ D: open, bind, cluster
const DX = 0;
const camD = camPath([
  [CUT_D, {x: DX, y: -210, z: 1.7}],
  [tExp, {x: DX, y: -190, z: 1.9}],
  [tExp + 0.9, {x: DX, y: -110, z: 2.2}],
  [tHelp, {x: DX, y: -40, z: 2.3}],
  [CUT_D2, {x: DX, y: 60, z: 1.7}],
]);
const devD = (t: number) => {
  const u = easeInOut(seg(t, tExp + 0.6, tExp + 1.3));
  return {x: DX + drift(t, 3, 2) * 8 * (1 - u), y: lerp(-262, -91, u)};
};
const MicroD: React.FC<{t: number}> = ({t}) => {
  const cam = kick(smoothCam(camD, t, 0.2), t, tExp + 1.3, 6, 0.3);
  const d = devD(t);
  const protons = smooth(seg(t, tUnder + 0.1, tExp - 0.2));
  const unlock = smooth(seg(t, tExp - 0.4, tExp + 0.05));
  const open = easeOut(seg(t, tExp, tExp + 0.6));
  const gather = easeInOut(seg(t, tExp + 0.7, tExp + 1.4));
  const act = smooth(seg(t, tExp + 1.3, tHelp + 0.2));
  const adaptors = smooth(seg(t, tHelp - 0.2, tHelp + 0.4));
  // caspase cascade: violet sparks travelling inward from the clustered receptors
  const casc = seg(t, tHelp, CUT_D2);
  const under = (
    <g>
      {casc > 0 && Array.from({length: 14}, (_, i) => {
        const gen = Math.floor(i / 4);
        const u = clamp01(casc * 2.2 - gen * 0.35);
        if (u <= 0) return null;
        const a = 1.2 + (i % 4) * 0.25 + gen * 0.1;
        const r = 40 + u * (90 + gen * 70);
        return <circle key={i} cx={Math.cos(a) * r * (i % 2 ? 1 : -1) * 0.8} cy={60 + Math.sin(a) * r} r={8 + 4 * pulse(u, 0.5, 0.2)} fill={M.enzyme} stroke={C.ink} strokeWidth={1.5} opacity={smooth(u * 4)} />;
      })}
      {casc > 0 && <circle cx={0} cy={160} r={60 + casc * 240} fill="none" stroke={M.signal} strokeWidth={6} opacity={0.4 * (1 - casc)} />}
    </g>
  );
  return <MicroWorld t={t} cam={cam} devX={d.x} devY={d.y} open={open} unlock={unlock} protons={protons} acid={1} gather={gather} act={act} adaptors={adaptors} bulge={gather * 0.9} devGlow={act * 0.5} under={under} />;
};
export const DEATH_CELLS = tissueGrid(-1300, -800, 1300, 800, 210, 9);
const Apoptosis: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_D2, {x: 0, y: -40, z: 2.2}], [tSelf + 0.3, {x: 0, y: 0, z: 1.25}], [CUT_E, {x: 0, y: 0, z: 1.1}]]), t, 0.2);
  const die = easeInOut(seg(t, CUT_D2 + 0.1, CUT_E - 0.1));
  const me = DEATH_CELLS.reduce((a, c) => (Math.hypot(c.x, c.y) < Math.hypot(a.x, a.y) ? c : a));
  return (
    <g>
      {/* neighbours softened (selective blur) so the mechanism stays the sharp subject */}
      <g filter={blurId(3 + die * 5)}>
        <g transform={camTransform(cam)}>
          <rect x={-3000} y={-2000} width={6000} height={4000} fill="#6E3446" />
          {DEATH_CELLS.filter((c) => c !== me).map((c, i) => <Cell key={i} x={c.x} y={c.y} r={c.r} seed={c.seed} t={t} look={i % 3 ? LOOK.tumor : LOOK.healthy} detail={0.6} />)}
        </g>
      </g>
      <g transform={camTransform(cam)}>
        <Cell x={me.x} y={me.y} r={me.r * 1.1} seed={me.seed} t={t} look={LOOK.tumor} die={die} detail={1} lw={4} />
        {/* the device still on the surface where it bound */}
        {die < 0.6 && <g transform={`translate(${me.x + me.r * 0.15} ${me.y - me.r * 1.1 * (1 - 0.22 * die) - 26}) scale(0.32)`} opacity={1 - smooth((die - 0.4) * 5)}><DnaSwitch t={t} open={1} unlock={1} /></g>}
      </g>
    </g>
  );
};

// ================================================================================================ E: the mouse study
const CAGES = [{x: -470, active: false}, {x: 470, active: true}];
const MiceShot: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_E, {x: -470, y: -150, z: 2.0}], [tMice + 0.9, {x: 0, y: -190, z: 1.25}], [tReduced, {x: 0, y: -190, z: 1.22}], [CUT_F, {x: 470, y: -150, z: 1.6}]]), t, 0.2);
  const days = seg(t, tMice + 0.6, CUT_F - 0.2);
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={C.paper} />
      <rect x={-3000} y={0} width={6000} height={2000} fill={C.paperDeep} />
      <Bench w={2600} />
      {CAGES.map((c, i) => {
        const tumor = c.active ? lerp(0.35, 0.6, days) : lerp(0.35, 1.25, days);
        return (
          <g key={i} transform={`translate(${c.x} 0)`}>
            <Cage w={560} h={300}>
              <g transform="translate(-20 -12) scale(1.45)"><Mouse t={t} tumor={tumor} seed={i} /></g>
            </Cage>
            {/* which device this group received: the same structure, inactive (grey, no pattern) vs active */}
            <g transform="translate(0 -420)">
              <rect x={-120} y={-70} width={240} height={140} rx={20} fill={c.active ? M.screen : '#5C6670'} stroke={C.ink} strokeWidth={5} />
              <g opacity={c.active ? 1 : 0.55} style={c.active ? undefined : {filter: 'grayscale(1)'}}><DeviceIcon t={t} s={0.95} open={c.active ? 1 : 0} /></g>
            </g>
          </g>
        );
      })}
      {/* days passing: a row of dots between the cages */}
      {Array.from({length: 8}, (_, i) => <circle key={i} cx={-105 + i * 30} cy={-140} r={9} fill={days * 8 > i ? C.ink : 'none'} stroke={C.ink} strokeWidth={3} />)}
    </g>
  );
};

// ================================================================================================ F: real, not a human cure, human-designed
const camF = camPath([
  [CUT_F, {x: -300, y: -260, z: 1.1}],
  [tHuman - 0.1, {x: -280, y: -260, z: 1.1}],
  [tHuman + 0.8, {x: 900, y: -300, z: 0.8}],
  [tAInv - 0.1, {x: 1000, y: -300, z: 0.82}],
  [tAInv + 0.7, {x: -620, y: -60, z: 1.7}],
  [CUT_G, {x: -640, y: -60, z: 1.85}],
]);
const RealNotCure: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camF, t, 0.2);
  const path = smooth(seg(t, tHuman + 0.1, tHuman + 1.0));
  const draw = seg(t, tAInv + 0.4, CUT_G);
  const ch = {x: -330, y: 220, scale: 1.55};
  const pose: Pose = {...IDLE, lookX: -0.7, lookY: 0.6, tilt: -8, mouth: 'flat', armL: {a: 46, b: 80}, armR: {a: 20, b: 40}};
  // the routing sketch: the boustrophedon strand path drawn progressively
  const route = ROUTE.map(([x, y]) => [x * 1.1, y * 2.2] as P);
  const nDraw = Math.max(2, Math.floor(route.length * draw));
  const pen = route[nDraw - 1];
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={7000} height={4000} fill={C.paper} />
      <rect x={-3000} y={0} width={7000} height={2000} fill={C.paperDeep} />
      <Person look={RESEARCHER} pose={pose} t={t} seed={6} x={ch.x} y={ch.y} scale={ch.scale} />
      <Bench w={1700} />
      <g transform="translate(60 0)"><Cage w={460} h={250}><g transform="translate(-10 -10) scale(0.95)"><Mouse t={t} tumor={0.5} seed={1} /></g></Cage></g>
      <g transform="translate(420 0)"><TubeRack t={t} /></g>
      {/* design sheet on the bench */}
      <g transform="translate(-640 -40)">
        <rect x={-220} y={-130} width={440} height={240} rx={8} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} transform="skewX(-12)" />
        <g transform="skewX(-12)">
          {[-44, -27, -10, 24, 41].map((y, i) => <line key={i} x1={-160} x2={160} y1={y * 2.2} y2={y * 2.2} stroke={M.wire} strokeWidth={2} opacity={0.6} />)}
          <path d={openPath(route.slice(0, nDraw), 0.5)} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <g transform={`translate(${pen[0]} ${pen[1]}) rotate(35)`}>
            <rect x={-6} y={-90} width={12} height={84} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
            <path d="M -6 -6 L 0 6 L 6 -6 Z" fill={C.ink} />
          </g>
        </g>
      </g>
      {/* the long road from mice to people: dashed, unfinished */}
      <g opacity={path}>
        <path d="M 260 -60 C 600 -60 800 -160 1100 -160 S 1500 -160 1700 -200" fill="none" stroke={C.inkMuted} strokeWidth={8} strokeDasharray="26 22" />
        {[0.2, 0.45, 0.7].map((u, i) => <circle key={i} cx={lerp(400, 1600, u)} cy={-100 - u * 90} r={16} fill="none" stroke={C.inkMuted} strokeWidth={5} />)}
        <g transform="translate(1780 -200)">
          <circle cx={0} cy={-210} r={44} fill="none" stroke={C.inkMuted} strokeWidth={7} strokeDasharray="14 10" />
          <path d="M -80 0 Q -80 -150 0 -150 Q 80 -150 80 0" fill="none" stroke={C.inkMuted} strokeWidth={7} strokeDasharray="14 10" />
        </g>
      </g>
    </g>
  );
};

// ================================================================================================ G: prediction × engineering
const Opportunity: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_G, {x: 0, y: 0, z: 1.25}], [tIfExp, {x: 0, y: 0, z: 1.0}], [SWITCH_END, {x: 0, y: 0, z: 1.08}]]), t, 0.2);
  const come = easeInOut(seg(t, CUT_G, tFut + 2.4));
  const link = smooth(seg(t, tFut + 2.0, tFut + 2.9));
  const gate = smooth(seg(t, tIfExp - 0.2, tIfExp + 0.4));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} />
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.2} />
      <g transform={`translate(${lerp(-640, -470, come)} 0)`}><Twin3D shape={{R: 190, seed: 4}} rotY={t * 0.4} lw={2.4} voxels={0.6} t={t} /></g>
      <g transform={`translate(${lerp(640, 470, come)} 0) scale(1.05)`}><DnaSwitch t={t} open={0} /></g>
      {link > 0.01 && (
        <g opacity={link}>
          <line x1={-250} y1={0} x2={260} y2={0} stroke={M.wireHot} strokeWidth={6} strokeDasharray="18 14" strokeDashoffset={-t * 40} />
          <g transform="translate(0 0)" opacity={0.4 + 0.6 * gate}>
            <rect x={-70} y={-70} width={140} height={140} rx={22} fill={M.screen} stroke={M.wire} strokeWidth={5} strokeDasharray="14 10" />
            <path d="M -14 -40 L -14 -10 L -36 30 Q -40 40 -28 40 L 28 40 Q 40 40 36 30 L 14 -10 L 14 -40 Z" fill={M.screenLift} stroke={M.wire} strokeWidth={4} strokeLinejoin="round" />
            <circle r={90 + 10 * Math.sin(t * 4)} fill="none" stroke={M.wire} strokeWidth={3} opacity={0.5 * gate} />
          </g>
        </g>
      )}
    </g>
  );
};

export const Switch: React.FC<{t: number}> = ({t}) => {
  const part = t < CUT_C ? 'AB' : t < CUT_D ? 'C' : t < CUT_D2 ? 'D' : t < CUT_E ? 'D2' : t < CUT_F ? 'E' : t < CUT_G ? 'F' : 'G';
  const bg = part === 'E' || part === 'F' ? C.paper : part === 'G' ? M.screen : M.void;
  return (
    <Frame bg={bg}>
      {part === 'AB' && <MicroAB t={t} />}
      {part === 'C' && <TopDown t={t} />}
      {part === 'D' && <MicroD t={t} />}
      {part === 'D2' && <Apoptosis t={t} />}
      {part === 'E' && <MiceShot t={t} />}
      {part === 'F' && <RealNotCure t={t} />}
      {part === 'G' && <Opportunity t={t} />}
      <Flash op={0.25 * pulse(t, CUT_D2, 0.05)} color={M.signal} />
      <Vignette op={bg === C.paper ? 0.3 : 0.8} />
    </Frame>
  );
};
export const _s = {TE, easeIn, W, H, mixHex, blob, memY, SLOTS, Peptide};
