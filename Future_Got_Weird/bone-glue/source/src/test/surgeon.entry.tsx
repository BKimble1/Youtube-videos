// Test sheet for the surgeon / instruments / room module (src/art/surgeon.tsx, instruments.tsx, room.tsx).
// Each state is drawn through the camera Layer system as the film does: room z +600, hand table z +40, SurgeonBack
// z -6, the patient's arm (arm.tsx / skeleton.tsx, finished modules) z 0 / -7, DrapeOverArm z -7, SurgeonFront z -6.
// The instrument states are the film's (story.ts) at the matching times, hard-coded so this entry does not depend on
// story.ts / bone.tsx. Props: st = one state key for a full-size frame, or 'sheet' (3 x 3) / 'sheet2' (4 x 2).
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, layerScale} from '../camera';
import {P, pt} from '../core/geo';
import {resetIds} from '../core/ids';
import {SurgeonBack, SurgeonFront, SurgeonState, SURGEON_DEFAULT} from '../art/surgeon';
import {RoomBack, HandTable, DrapeOverArm} from '../art/room';
import {ArmSkin, DeepTissue, IncisionRim, ArmState, armOutlinePath} from '../art/arm';
import {Skeleton} from '../art/skeleton';
import {BONE_DEPTH} from '../art/anatomy';

const Z_SKIN = -0.7 * BONE_DEPTH, Z_INSTR = -6, Z_TABLE = 40, Z_ROOM = 600;
const reproject = (c: Cam, p: P, z: number): P => {
  const r = layerScale(c, 0) / layerScale(c, z);
  return pt(c.x + (p.x - c.x) * r, c.y + (p.y - c.y) * r);
};

type Spec = {c: Cam; s?: SurgeonState; table: 'drape' | 'followup'; arm?: Partial<ArmState>; captions?: boolean};
const S0 = SURGEON_DEFAULT;
const CLINIC: Cam = {x: 92, y: -100, w: 405, k: 0.86, focus: -10};
const CLINIC2: Cam = {x: 88, y: -97, w: 392, k: 0.86, focus: -10};
const CUT: Cam = {x: -10, y: -52, w: 250, k: 0.9, focus: -8};
const ARM0: ArmState = {curl: 0.25, thumb: 0.2, incision: 1, sutures: 0, scar: 0, window: null};
const STATES: Record<string, Spec> = {
  // the clinical shot (t 5.5): the bead finished, the applicator lifted a little, the eye-smile
  clin: {c: CLINIC, s: {...S0, face: {focus: 0, smile: 1, gx: -0.5, gy: 0.55, blink: 0}, lean: -0.4}, table: 'drape', captions: true},
  clin2: {c: CLINIC2, s: {...S0, lean: -0.5}, table: 'drape', captions: true},
  // t 4.5 (still laying the bead, mid pull-out)
  t45: {c: {x: 45.9, y: -68, w: 256.8, k: 0.93, focus: -8}, s: {...S0, app: {tip: pt(2.72, -15.58), ang: -0.44, press: 0.67, gel: 1}, k: 0.93, lean: 3}, table: 'drape'},
  // t 4.0
  t40: {c: {x: 10, y: -48, w: 175, k: 0.96, focus: -6}, s: {...S0, app: {tip: pt(3.63, -9.88), ang: -0.46, press: 0.62, gel: 1}, k: 0.96, lean: 2.6}, table: 'drape'},
  // zoomed on the hands at the clinical tilt (detail check)
  hands: {c: {x: 110, y: -40, w: 210, k: 0.86, focus: -6}, s: S0, table: 'drape'},
  // the cutaway (t 15.5: the applicator back at the wedge; t 16.5: withdrawing; t 17.2: the clamp opening and lifting)
  cut: {c: CUT, s: {...S0, k: 0.9, app: {tip: pt(9.63, 4.93), ang: -0.38, press: 0.75, gel: 0}}, table: 'drape', arm: {window: {c: pt(-5, -24), r: 62, soft: 0.38}}, captions: true},
  cut2: {c: {x: -8.95, y: -49.4, w: 251.6, k: 0.9, focus: -8}, s: {...S0, k: 0.9, app: {tip: pt(88.2, -57.3), ang: -0.4, press: 0.75, gel: 0}}, table: 'drape', arm: {window: {c: pt(-5, -24), r: 62, soft: 0.38}}, captions: true},
  cut3: {c: {x: -8.2, y: -47, w: 243, k: 0.9, focus: -8}, s: {...S0, k: 0.9, app: {tip: pt(129.6, -90), ang: -0.44, press: 0.75, gel: 0}, clamp: {...S0.clamp, open: 1, lift: 0.3}}, table: 'drape', arm: {window: {c: pt(-5, -24), r: 62, soft: 0.38}}, captions: true},
  // the follow-up table (t 27)
  follow: {c: {x: -7.5, y: -72, w: 177, k: 1, focus: -10}, table: 'followup', arm: {incision: 0, scar: 1, curl: 0.4}},
  // a wide view past the drape's edges (QA)
  wide: {c: {x: 60, y: -60, w: 900, k: 0.86}, s: S0, table: 'drape'},
  // released hands (QA)
  rel: {c: CLINIC, s: {...S0, appHeld: 0.4, clampHeld: 0.2}, table: 'drape'},
};

const Frame: React.FC<{sp: Spec; id: string}> = ({sp, id}) => {
  resetIds(id);
  const c = sp.c;
  const arm: ArmState = {...ARM0, ...(sp.arm ?? {})};
  const s = sp.s && {
    ...sp.s,
    app: {...sp.s.app, tip: reproject(c, sp.s.app.tip, Z_INSTR)},
    clamp: {...sp.s.clamp, a: reproject(c, sp.s.clamp.a, Z_INSTR), b: reproject(c, sp.s.clamp.b, Z_INSTR)},
    k: c.k ?? 1,
  };
  return (
    <AbsoluteFill style={{background: '#0D111C', overflow: 'hidden'}}>
      {c.w > 90 && (
        <Layer c={c} z={Z_ROOM} minBlur={3} maxBlur={14}>
          <RoomBack id={`${id}-rm`} t={0} />
        </Layer>
      )}
      <Layer c={c} z={Z_TABLE} maxBlur={18}>
        <HandTable id={`${id}-tb`} variant={sp.table} />
      </Layer>
      {s && c.w > 70 && (
        <Layer c={c} z={Z_INSTR} maxBlur={20}>
          <SurgeonBack id={`${id}-sb`} s={s} />
        </Layer>
      )}
      <Layer c={c} z={0} maxBlur={20}>
        <defs>
          <clipPath id={`${id}-ac`}>
            <path d={armOutlinePath(arm)} transform={`translate(${c.x} ${c.y}) scale(${layerScale(c, Z_SKIN) / layerScale(c, 0)}) translate(${-c.x} ${-c.y})`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-ac)`}>
          <DeepTissue id={`${id}-dt`} s={arm} />
          <Skeleton id={`${id}-sk`} curl={arm.curl} thumb={arm.thumb} detail={0.6} />
        </g>
      </Layer>
      <Layer c={c} z={Z_SKIN} maxBlur={22}>
        <ArmSkin id={`${id}-as`} s={arm} />
        {arm.incision > 0 && <IncisionRim id={`${id}-ir`} s={arm} />}
        {sp.table === 'drape' && <DrapeOverArm id={`${id}-do`} />}
      </Layer>
      {s && (
        <Layer c={c} z={Z_INSTR} maxBlur={20}>
          <SurgeonFront id={`${id}-sf`} s={s} />
        </Layer>
      )}
      {sp.captions && <div style={{position: 'absolute', left: 110, width: 760, top: 1455, height: 90, border: '3px dashed rgba(255,230,0,0.7)'}} />}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1400, height: 0, borderTop: '2px dotted rgba(255,80,80,0.6)'}} />
    </AbsoluteFill>
  );
};

const Sheet: React.FC<{ks: string[]; cols: number}> = ({ks, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {ks.map((key, i) => (
        <div key={key} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame sp={STATES[key]} id={`f${key}`} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{key}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Test: React.FC<{st: string; ks?: string[]; cols?: number}> = ({st, ks, cols}) => {
  if (st === 'sheet') return <Sheet ks={ks ?? Object.keys(STATES).slice(0, 9)} cols={cols ?? 3} />;
  return <Frame sp={STATES[st]} id={`f${st}`} />;
};

registerRoot(() => <Composition id="Surgeon" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{st: 'clin'} as {st: string; ks?: string[]; cols?: number}} />);
