// One frame (V2). The camera says which world we are in. The wrist world is drawn as depth layers through a pinhole
// dolly (camera.tsx): the room far behind, the hand table, the surgeon's arms, the inside of the wrist (deep tissue,
// skeleton, the fractured radius with the glue in its seams, healing, the wet film, the instruments' contact shadows),
// the skin with the incision a little nearer the lens, and the instruments above it. The oyster comparison is its own
// world, matched in and out with hard cuts on the attachment line / the glue band.
import React from 'react';
import {resetIds} from './core/ids';
import {Cam, Layer, layerScale, viewRect} from './camera';
import {FieldDetail} from './art/bone';
import {FractureBone} from './art/fracture';
import {HealLayer} from './art/heal';
import {WetFilm} from './art/wet';
import {Skeleton} from './art/skeleton';
import {ArmSkin, DeepTissue, IncisionRim, armOutlinePath} from './art/arm';
import {SurgeonBack, SurgeonFront} from './art/surgeon';
import {AppShadow, INSTR_Z, ProbeShadow} from './art/instruments';
import {DrapeOverArm, HandTable, RoomBack} from './art/room';
import {OysterWorld} from './art/oyster';
import {BONE_DEPTH} from './art/anatomy';
import {P, pt} from './core/geo';
import {EV, WCam, loopCam, World, armAt, boneAt, camAt, cutBackBlend, forcepsAt, instrAt, loopBlend, skinVeil, surgeonOn, tableMix, wristCamAt} from './story';
import {LabWorld} from './art/lab';
import {MicroWorld} from './art/micro';
import {ForcepsShadow, ReductionForceps} from './art/forceps';
import {Captions, setCaptionAdjust} from './Captions';
import {CAPTIONS} from './lib';
import {BoneState2, InstrState2} from './v2state';

// captions that would start just before a hard cut start on the cut
setCaptionAdjust({
  show: Object.fromEntries(CAPTIONS.map((c, k) => [k, [EV.cutIn, EV.cutOut].find((cut) => c.show < cut && cut - c.show < 0.12) ?? c.show])),
  lastHide: 1e9,
});

const Z_SKIN = -0.7 * BONE_DEPTH, Z_INSTR = INSTR_Z, Z_TABLE = 40, Z_ROOM = 600;

/** a point at depth 0 drawn in a layer at depth z: where it must sit so it lands on the same screen point */
const reproject = (c: Cam, p: P, z: number): P => {
  const r = layerScale(c, 0) / layerScale(c, z);
  return pt(c.x + (p.x - c.x) * r, c.y + (p.y - c.y) * r);
};

export const WristWorld: React.FC<{t: number; c: Cam; fkey: string}> = ({t, c, fkey}) => {
  const px = c.w / 1080;
  const bone: BoneState2 = boneAt(t, px);
  const arm = armAt(t);
  const ins = instrAt(t);
  const view = viewRect(c, 0);
  // instrument tips touch the bone (depth 0) but the instruments are drawn above the skin: reproject the contact points
  const sIns: InstrState2 = {
    ...ins,
    app: {...ins.app, tip: reproject(c, ins.app.tip, Z_INSTR)},
    probe: {...ins.probe, tip: reproject(c, ins.probe.tip, Z_INSTR)},
    k: c.k ?? 1,
  };
  const showSurgeon = surgeonOn(t);
  const clipId = `${fkey}armclip`;
  const rClip = layerScale(c, Z_SKIN) / layerScale(c, 0);
  const veil = skinVeil(t);
  const tm = tableMix(t);
  const fc = forcepsAt(t);
  return (
    <>
      {c.w > 90 && (
        <Layer c={c} z={Z_ROOM} minBlur={3} maxBlur={14}>
          <RoomBack id={`${fkey}room`} t={t} />
        </Layer>
      )}
      {c.w > 24 && (
        <Layer c={c} z={Z_TABLE} maxBlur={18}>
          {tm < 0.999 && <HandTable id={`${fkey}tab`} variant="drape" />}
          {tm > 0.001 && <g opacity={tm < 0.999 ? tm : 1}><HandTable id={`${fkey}tabf`} variant="followup" bend={arm.bend} /></g>}
        </Layer>
      )}
      {showSurgeon && (
        <Layer c={c} z={Z_INSTR} maxBlur={20}>
          <SurgeonBack id={`${fkey}sb`} s={sIns} />
        </Layer>
      )}
      <Layer c={c} z={0} maxBlur={20}>
        <defs>
          <clipPath id={clipId}>
            <path d={armOutlinePath(arm)} transform={`translate(${c.x} ${c.y}) scale(${rClip}) translate(${-c.x} ${-c.y})`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <DeepTissue id={`${fkey}deep`} s={arm} />
          <Skeleton id={`${fkey}skel`} curl={arm.curl} thumb={arm.thumb} spread={arm.spread} detail={px < 0.1 ? 1 : 0.6} />
          <FieldDetail st={{px, t} as never} t={t} />
          <FractureBone st={bone} view={view} />
          <HealLayer st={bone} view={view} />
          <WetFilm st={bone} />
          {showSurgeon && ins.probeOn > 0.01 && <ProbeShadow st={ins.probe} px={px} on={ins.probeOn} />}
          {showSurgeon && ins.appOn > 0.01 && <AppShadow st={ins.app} px={px} on={ins.appOn} />}
          {fc && <ForcepsShadow st={fc} px={px} />}
        </g>
      </Layer>
      <Layer c={c} z={Z_SKIN} maxBlur={22}>
        <ArmSkin id={`${fkey}skin`} s={arm} />
        {veil > 0.001 && (
          <g opacity={veil}>
            <ArmSkin id={`${fkey}veil`} s={arm} noWindow />
          </g>
        )}
        <IncisionRim id={`${fkey}rim`} s={arm} />
        {tm < 0.999 && <g opacity={1 - tm}><DrapeOverArm id={`${fkey}dro`} /></g>}
      </Layer>
      {showSurgeon && (ins.appOn > 0.01 || ins.probeOn > 0.01) && (
        <Layer c={c} z={Z_INSTR} maxBlur={c.w < 60 ? 1.5 : 20}>
          <SurgeonFront id={`${fkey}sf`} s={sIns} />
        </Layer>
      )}
      {fc && (
        <Layer c={c} z={Z_INSTR} maxBlur={c.w < 60 ? 1.5 : 20}>
          <ReductionForceps id={`${fkey}fc`} st={{...fc, tipA: reproject(c, fc.tipA, Z_INSTR), tipB: reproject(c, fc.tipB, Z_INSTR)}} px={px} />
        </Layer>
      )}
    </>
  );
};

const WorldView: React.FC<{w: World; t: number; c: WCam | NonNullable<WCam['over']>; fkey: string}> = ({w, t, c, fkey}) => {
  if (w === 'wrist') return <WristWorld t={t} c={c.cam} fkey={fkey} />;
  if (w === 'oyster') return <OysterWorld id={`${fkey}oy`} t={t} cam={c.cam} reveal={c.reveal ?? 0} />;
  if (w === 'lab') return <LabWorld id={`${fkey}lab`} t={t} cam={c.cam} st={(c as WCam).lab!} />;
  return <MicroWorld id={`${fkey}mic`} t={t} cam={c.cam} st={c.micro!} />;
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const wc = camAt(t);
  const cb = wc.world === 'oyster' ? cutBackBlend(t) : 0;
  const lb = loopBlend(t);
  const over = wc.over;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.04) saturate(1.05)'}}>
      <WorldView w={wc.world} t={t} c={wc} fkey={fkey} />
      {/* the cut back: the glue band dissolves in over the cement band on the same screen line */}
      {cb > 0.001 && <div style={{position: 'absolute', inset: 0, opacity: cb}}><WristWorld t={t} c={wristCamAt(t)} fkey={`${fkey}cb`} /></div>}
      {/* dissolves between worlds (lab -> sea, macro <-> micro) */}
      {over && over.alpha > 0.001 && <div style={{position: 'absolute', inset: 0, opacity: over.alpha}}><WorldView w={over.world} t={t} c={over} fkey={`${fkey}ov`} /></div>}
      {/* the loop: the healed wrist's cutaway dissolves into frame 0's shattered one (same camera, same cutaway) */}
      {lb > 0.001 && <div style={{position: 'absolute', inset: 0, opacity: lb}}><WristWorld t={0} c={loopCam(t)} fkey={`${fkey}lp`} /></div>}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(4,4,10,0.36) 100%)'}} />
      {captions && <Captions t={t} />}
    </div>
  );
};
