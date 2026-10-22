// 7 · THE INTEGRATED FUTURE ("A digital twin that learns" → end).
//  A  a possible workflow loop: measurement → model → targeted treatment → controlled delivery → follow-up scan → back.
//  B  the pieces stand on different steps (lab mice / studies / clinic); C they don't lock into one machine, and
//     different cancers pull different subsets of tools.
//  D–F the limits as visible obstacles: an unmeasured resistant pocket outside the model; a carrier inside healthy
//     tissue; a model that predicted a better response than the follow-up scan shows.
//  G  the tumour vanishing on a screen is not the test → H a person living on, seasons passing, clear check-ins.
//  I  callback: the opening membrane, the device arriving → J recognition and activation close-up, then pull back to
//     the whole disease context (the tumour is still there: nothing claims every cell is gone). Fade out.
import React from 'react';
import {T, TE, DURATION, clamp01, lerp, seg, smooth, easeOut, easeIn, easeInOut, pulse, noise, rand, drift, blob, mixHex} from '../kit/core';
import {Cam, camPath, smoothCam, camTransform, kick} from '../kit/cam';
import {Frame, Vignette, Fade, blurId} from '../kit/fx';
import {MicroWorld} from '../sets/micro';
import {Cell, LOOK, tissueGrid} from '../art/cells';
import {Grid, MriSlice, Monitor, Twin3D, TwinShape, twinSilhouette} from '../art/digital';
import {AdcIcon, DeviceIcon, TwinIcon, Card} from '../art/icons';
import {Antibody, DnaSwitch, TargetReceptor} from '../art/molecules';
import {Mouse, Person, PERSON} from '../art/lab';
import {IDLE, Pose, mixPose} from '../components/Character';
import {C, M} from '../theme';

export const tTwin = T('A digital twin that'), tAimed = T('A treatment aimed'), tDeliv = T('A delivery system'), tStages = T('Those technologies'), tNot = T('They are not one');
export const tDiff = T('and different cancers'), tMiss = T('A model can miss'), tCarrier = T('A carrier can'), tVict = T('An apparent victory'), tNextScan = T('the next scan');
export const tFinal = T('That is why'), tVanish = T('vanishes on'), tPeople = T('It is whether'), tLonger = T('live longer'), tHarm = T('less harm'), tAway = T('stays away');
export const tCell = T('The cell in our opening'), tChall = T('The challenge is'), tRight = T('the right cell'), tNoWay = T('leaving it no way back'), tBack = TE('no way back');
export const CUT_D = tMiss - 0.1, CUT_E = tCarrier - 0.08, CUT_F = tVict - 0.08, CUT_G = tFinal - 0.1, CUT_H = tPeople - 0.1, CUT_I = tCell - 0.1, CUT_J = tNoWay - 0.35;

// ================================================================================================ A–C: the loop
const NODES: [number, number][] = [[-420, -170], [0, -300], [420, -170], [0, 230]];
const STEP_Y = [-40, 120, -200]; // model / delivery switch / conjugate: heights of their evidence steps (higher = further along)
const Loop: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[tTwin - 0.1, {x: -300, y: -150, z: 1.6}], [tAimed, {x: -100, y: -120, z: 1.25}], [tDeliv + 0.6, {x: 0, y: -40, z: 0.95}], [tStages + 0.4, {x: 0, y: -40, z: 0.9}], [tDiff, {x: 0, y: 0, z: 0.85}], [CUT_D, {x: 0, y: 0, z: 0.8}]]), t, 0.2);
  const appear = (i: number) => smooth(seg(t, [tTwin - 0.45, tAimed, tDeliv, tDeliv + 1.2][i], [tTwin - 0.15, tAimed + 0.4, tDeliv + 0.4, tDeliv + 1.6][i]));
  const stages = easeInOut(seg(t, tStages, tStages + 1.2));
  const machine = seg(t, tNot, tNot + 1.4);
  const diff = smooth(seg(t, tDiff, tDiff + 0.8));
  // node positions: loop → steps (different stages) → spread under different cancers
  const pos = (i: number): [number, number] => {
    const [lx, ly] = NODES[i];
    if (i === 3) return [lx, ly];
    const sx = [-460, 0, 460][i], sy = [STEP_Y[0], STEP_Y[2], STEP_Y[1]][i];
    // "not one finished machine": they try to snap together and spring back apart
    const snap = Math.sin(machine * Math.PI) * (machine < 1 ? 1 : 0);
    const jx = lerp(sx, (i - 1) * 150, snap * 0.8);
    return [lerp(lx, jx, stages), lerp(ly, sy - 60 * diff, stages)];
  };
  const loopOp = 1 - stages;
  const icons = [TwinIcon, AdcIcon, DeviceIcon];
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} />
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.2} />
      {/* loop arrows (dashed: a possible workflow, not a finished one) */}
      {loopOp > 0.01 && [0, 1, 2, 3].map((i) => {
        const a = NODES[i], b = NODES[(i + 1) % 4];
        const k = smooth(seg(t, [tTwin + 0.4, tAimed + 0.4, tDeliv + 0.4, tDeliv + 1.5][i], [tTwin + 0.4, tAimed + 0.4, tDeliv + 0.4, tDeliv + 1.5][i] + 0.6));
        const mx = (a[0] + b[0]) / 2 * 1.25, my = (a[1] + b[1]) / 2 * 1.25 - 20;
        return <path key={i} d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${lerp(a[0], b[0], k)} ${lerp(a[1], b[1], k)}`} fill="none" stroke={M.wire} strokeWidth={5} strokeDasharray="16 12" strokeDashoffset={-t * 40} opacity={loopOp * k} />;
      })}
      {/* stage steps */}
      {stages > 0.01 && [0, 1, 2].map((i) => {
        const x = [-460, 0, 460][i], y = [STEP_Y[0], STEP_Y[2], STEP_Y[1]][i] + 120;
        return (
          <g key={i} opacity={stages * (1 - diff * 0.6)}>
            <rect x={x - 170} y={y} width={340} height={700} fill={M.screenLift} stroke={M.wireDim} strokeWidth={4} />
            {/* what each step means, by picture: lab animals / studies on screens / infusions in clinics */}
            <g transform={`translate(${x} ${y + 90})`}>
              {i === 2 ? <g transform="translate(10 30) scale(0.55)"><Mouse t={t} tumor={0.4} /></g> : i === 0 ? <g transform="scale(0.5)"><Monitor w={220} h={130} id={'st' + i} stand={false}><MriSlice w={220} h={130} seed={3} frame={false} /></Monitor></g> : <g>
                <path d="M -30 -50 L 30 -50 L 30 10 Q 30 30 0 34 Q -30 30 -30 10 Z" fill="#E8F3FF" stroke={C.ink} strokeWidth={4} />
                <path d="M 0 34 L 0 70" stroke="#FFFFFF" strokeWidth={6} />
              </g>}
            </g>
          </g>
        );
      })}
      {[0, 1, 2, 3].map((i) => {
        const [x, y] = pos(i);
        const k = appear(i);
        if (i === 3) return k > 0.01 ? <g key={i} transform={`translate(${x} ${y}) scale(${0.45 * k})`} opacity={k * loopOp}><MriSlice w={300} h={230} seed={5} level={0.5} edge={M.wireHot} /></g> : null;
        const Ic = icons[i];
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${(0.7 + 0.3 * k) * 1.25})`} opacity={k}>
            <Card w={190} h={190} edge={i === 0 ? M.wire : M.wireHot} fill={i === 0 ? M.screenLift : '#24203A'} />
            {i === 2 ? <DeviceIcon t={t} s={1.05} open={smooth(seg(t, tDeliv + 0.9, tDeliv + 1.6)) * (1 - stages)} /> : <Ic t={t} />}
          </g>
        );
      })}
      {/* different cancers, each pulling a different subset */}
      {diff > 0.01 && [[-620, 520, '#C8577A', [0, 1]], [0, 560, '#DE7A63', [0]], [620, 520, '#7E7BD6', [0, 2]]].map(([x, y, col, links], i) => (
        <g key={i} opacity={diff}>
          {(links as number[]).map((l) => {
            const [nx, ny] = pos(l);
            return <line key={l} x1={x as number} y1={(y as number) - 90} x2={nx} y2={ny + 120} stroke={col as string} strokeWidth={5} strokeDasharray="14 10" opacity={0.8} />;
          })}
          <path d={blob(x as number, y as number, 90, i * 7 + 3, t, 0.22, 11)} fill={col as string} stroke={C.ink} strokeWidth={6} />
        </g>
      ))}
    </g>
  );
};

// ================================================================================================ D: missed pocket
const MissPocket: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_D, {x: 0, y: 0, z: 1.2}], [CUT_E, {x: 240, y: 60, z: 1.6}]]), t, 0.2);
  const shape: TwinShape = {R: 230, seed: 12};
  const reveal = smooth(seg(t, tMiss + 0.7, tMiss + 1.4));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} />
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.2} />
      <Twin3D shape={shape} rotY={t * 0.3} lw={2.4} voxels={0.6} t={t} />
      {/* the pocket the measurements never captured: real cells outside the model's boundary */}
      <g opacity={0.25 + 0.75 * reveal}>
        {Array.from({length: 7}, (_, i) => <Cell key={i} x={340 + (i % 3) * 52 + (Math.floor(i / 3) % 2) * 26} y={120 + Math.floor(i / 3) * 46} r={30} seed={i + 90} t={t} look={LOOK.resist} detail={0} lw={2} />)}
      </g>
      <circle cx={392} cy={166} r={110 + 6 * Math.sin(t * 6)} fill="none" stroke={M.wireWarn} strokeWidth={5} strokeDasharray="16 10" opacity={reveal} />
      {/* a searchlight sweep that only finds it late */}
      <path d={`M -900 -700 L ${lerp(-300, 520, smooth(seg(t, CUT_D, tMiss + 1.2)))} 100 L ${lerp(-200, 300, smooth(seg(t, CUT_D, tMiss + 1.2)))} 260 Z`} fill="#FFFFFF" opacity={0.06} />
    </g>
  );
};

// ================================================================================================ E: carrier in healthy tissue
const CarrierHealthy: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_E, {x: 0, y: -40, z: 1.5}], [CUT_F, {x: 60, y: 0, z: 1.9}]]), t, 0.2);
  const inside = easeInOut(seg(t, tCarrier + 0.2, tCarrier + 1.4));
  const cells = [-420, -140, 140, 420];
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill="#3B2440" />
      {cells.map((x, i) => <Cell key={i} x={x} y={120} r={130} seed={i + 61} t={t} look={LOOK.healthy} detail={1} bleb={i === 2 ? smooth(seg(t, tCarrier + 1.0, CUT_F)) * 0.7 : 0} />)}
      <g transform={`translate(${lerp(-60, 140, inside)} ${lerp(-260, 110, inside)}) rotate(${lerp(40, 180, inside)}) scale(0.95)`}><Antibody t={t} payloads={4} /></g>
    </g>
  );
};

// ================================================================================================ F: apparent victory
const Victory: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_F, {x: -330, y: 0, z: 1.25}], [tNextScan - 0.5, {x: -20, y: 0, z: 1.12}], [CUT_G, {x: 60, y: 0, z: 1.2}]]), t, 0.2);
  const pred = smooth(seg(t, tVict + 0.2, tVict + 1.4));
  const next = smooth(seg(t, tNextScan - 0.4, tNextScan + 0.4));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={M.screen} />
      <Grid x0={-3000} y0={-2000} x1={3000} y1={2000} step={60} op={0.2} />
      {/* the model's forecast: steady shrinking */}
      <g transform="translate(-560 0)">
        <Twin3D shape={{R: 180, seed: 4, scale: lerp(1, 0.35, pred)}} rotY={t * 0.4} lw={2.4} />
      </g>
      <path d="M -330 0 L -150 0" stroke={M.wire} strokeWidth={6} strokeDasharray="14 10" />
      {/* follow-up scans: first looks like success, the next shows it back */}
      <g transform="translate(60 0)"><MriSlice w={300} h={240} seed={21} level={0.5} lesion={0.25} edge={M.wire} /></g>
      <path d="M 230 0 L 320 0" stroke={M.wire} strokeWidth={6} strokeDasharray="14 10" opacity={next} />
      <g transform="translate(500 0)" opacity={next}><MriSlice w={300} h={240} seed={21} level={0.5} lesion={1.1} edge={M.wireWarn} /></g>
      {next > 0.5 && <circle cx={500 + 60} cy={-5} r={60 + 4 * Math.sin(t * 6)} fill="none" stroke={M.wireWarn} strokeWidth={5} strokeDasharray="14 10" />}
    </g>
  );
};

// ================================================================================================ G: vanish on a screen
const ScreenVanish: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_G, {x: 0, y: -40, z: 2.0}], [tVanish + 0.3, {x: 0, y: -20, z: 1.3}], [CUT_H, {x: 0, y: 40, z: 0.8}]]), t, 0.2);
  const v = easeInOut(seg(t, tVanish - 0.2, tVanish + 0.7));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={C.paper} />
      <rect x={-3000} y={330} width={6000} height={2000} fill={C.paperDeep} />
      <Monitor w={900} h={520} id="vanish" stand={true}>
        <rect x={-500} y={-300} width={1000} height={600} fill={M.screen} />
        <Grid x0={-500} y0={-300} x1={500} y1={300} step={40} op={0.25} />
        <Twin3D shape={{R: 170, seed: 4, scale: Math.max(0.001, 1 - v)}} rotY={t * 0.5} lw={2.4} op={1 - smooth((v - 0.85) * 6)} />
      </Monitor>
    </g>
  );
};

// ================================================================================================ H: people
const SEASONS = ['#BFE3B4', '#9FD3C8', '#F2C27A', '#D8E3EE'];
const People: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camPath([[CUT_H, {x: 0, y: -260, z: 1.05}], [CUT_I, {x: 40, y: -280, z: 1.18}]]), t, 0.2);
  const yr = seg(t, tLonger - 0.2, CUT_I) * 3;
  const si = Math.floor(yr), sf = yr - si;
  const sky = mixHex(SEASONS[Math.min(3, si)], SEASONS[Math.min(3, si + 1)], smooth(sf * 1.5 - 0.25));
  const pose: Pose = mixPose({...IDLE, mouth: 'smile', lookX: 0.3}, {...IDLE, mouth: 'grin', armR: {a: 120, b: 30}, lookX: 0.5, brows: 0.4}, pulse(t, tHarm + 0.3, 0.6));
  const checks = [0, 1, 2].map((i) => smooth(seg(t, tAway - 0.6 + i * 0.35, tAway - 0.3 + i * 0.35)));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-3000} y={-2000} width={6000} height={4000} fill={sky} />
      <circle cx={600} cy={-640} r={90} fill="#FFE9A8" opacity={0.9} />
      <path d="M -3000 40 Q -800 -80 0 20 T 3000 0 L 3000 2000 L -3000 2000 Z" fill={mixHex('#8CC27A', '#C9A36A', si >= 2 ? 1 : 0)} />
      {/* a tree changing with the seasons */}
      <g transform="translate(-560 20)">
        <rect x={-18} y={-260} width={36} height={260} fill={C.woodDeep} stroke={C.ink} strokeWidth={5} />
        <path d={blob(0, -330, 150, 7, t * 0.3, 0.12, 12)} fill={[ '#7CC27A', '#5FA86A', '#E3954A', '#F4F7FA'][Math.min(3, si)]} stroke={C.ink} strokeWidth={6} />
      </g>
      <Person look={PERSON} pose={pose} t={t} seed={8} x={40} y={60} scale={1.45} />
      {/* follow-up check-ins: clear scans */}
      {checks.map((k, i) => (
        <g key={i} transform={`translate(${380 + i * 190} ${-460}) scale(${0.36 * k})`} opacity={k}>
          <MriSlice w={300} h={240} seed={31 + i} level={0.5} lesion={0} edge={C.teal} />
        </g>
      ))}
    </g>
  );
};

// ================================================================================================ I + J: callback
const camIJ = camPath([
  [CUT_I, {x: 0, y: -120, z: 2.3}],
  [tCell + 1.2, {x: -150, y: -170, z: 1.7}],
  [tChall, {x: -60, y: -200, z: 1.6}],
  [tRight + 0.3, {x: 0, y: -110, z: 2.6}],
  [CUT_J, {x: 0, y: -90, z: 2.9}],
]);
const devIJ = (t: number) => {
  const u = easeInOut(seg(t, CUT_I, tRight + 0.2));
  return {x: lerp(-520, 0, u) + drift(t, 3, 2) * 14 * (1 - u), y: lerp(-300, -91, easeInOut(seg(t, tRight - 0.4, tRight + 0.3))) + drift(t, 5, 2) * 10 * (1 - u)};
};
const Callback: React.FC<{t: number}> = ({t}) => {
  const cam = smoothCam(camIJ, t, 0.2);
  const d = devIJ(t);
  const open = easeOut(seg(t, tChall + 0.4, tChall + 1.0));
  const gather = easeInOut(seg(t, tRight - 0.1, tRight + 0.5));
  const act = smooth(seg(t, tRight + 0.3, CUT_J));
  return <MicroWorld t={t} cam={cam} devX={d.x} devY={d.y} open={open} unlock={smooth(seg(t, tChall, tChall + 0.45))} protons={smooth(seg(t, CUT_I + 0.5, tChall + 0.2))} acid={0.8} gather={gather} act={act} adaptors={act} bulge={gather * 0.9} devGlow={act * 0.5} />;
};
const WIDE = tissueGrid(-2200, -1400, 2200, 1400, 70, 51);
const TUMOR_W = {x: 120, y: 40};
const Whole: React.FC<{t: number}> = ({t}) => {
  // the pull-back: from one cell to the whole disease context; the tumour is still there
  const cam = smoothCam(camPath([[CUT_J, {x: 0, y: 0, z: 5.5}], [tBack + 0.2, {x: 60, y: 20, z: 0.75}, easeOut], [DURATION, {x: 80, y: 20, z: 0.68}]]), t, 0.2);
  const hero = WIDE.reduce((a, c) => (Math.hypot(c.x, c.y) < Math.hypot(a.x, a.y) ? c : a));
  const die = easeInOut(seg(t, CUT_J + 0.2, tBack + 1.4));
  return (
    <g transform={camTransform(cam)}>
      <rect x={-4000} y={-3000} width={8000} height={6000} fill="#5A2C3C" />
      {WIDE.map((c, i) => {
        const tum = Math.hypot(c.x - TUMOR_W.x, (c.y - TUMOR_W.y) * 1.2) < 520 + 70 * noise(c.x * 0.01, 5);
        if (c === hero) return <Cell key={i} x={c.x} y={c.y} r={c.r} seed={c.seed} t={t} look={LOOK.tumor} die={die} detail={1} />;
        return <Cell key={i} x={c.x} y={c.y} r={c.r} seed={c.seed} t={t} look={tum ? LOOK.tumor : LOOK.healthy} detail={0.5} lw={2.4} />;
      })}
      {/* a few devices still drifting through the tissue */}
      {[[-600, -300], [500, -420], [-300, 520]].map(([x, y], i) => <g key={i} transform={`translate(${x + drift(t, i, 3) * 30} ${y}) rotate(${drift(t, i + 4, 3) * 20}) scale(0.18)`}><DnaSwitch t={t} /></g>)}
    </g>
  );
};

export const Future: React.FC<{t: number}> = ({t}) => {
  const part = t < CUT_D ? 'ABC' : t < CUT_E ? 'D' : t < CUT_F ? 'E' : t < CUT_G ? 'F' : t < CUT_H ? 'G' : t < CUT_I ? 'H' : t < CUT_J ? 'I' : 'J';
  const bg = part === 'G' || part === 'H' ? C.paper : M.void;
  const fadeOut = smooth(seg(t, tBack + 0.5, DURATION - 0.3));
  return (
    <Frame bg={bg}>
      {part === 'ABC' && <Loop t={t} />}
      {part === 'D' && <MissPocket t={t} />}
      {part === 'E' && <CarrierHealthy t={t} />}
      {part === 'F' && <Victory t={t} />}
      {part === 'G' && <ScreenVanish t={t} />}
      {part === 'H' && <People t={t} />}
      {part === 'I' && <Callback t={t} />}
      {part === 'J' && t < CUT_J + 0.45 && <Callback t={t} />}
      {part === 'J' && <g opacity={smooth(seg(t, CUT_J, CUT_J + 0.45))}><Whole t={t} /></g>}
      <Vignette op={bg === C.paper ? 0.3 : 0.8} />
      <Fade op={fadeOut} />
    </Frame>
  );
};
export const _f = {clamp01, easeIn, kick, rand, twinSilhouette, TargetReceptor, blurId};
