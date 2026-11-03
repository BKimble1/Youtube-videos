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
import {AppShadow, ProbeShadow} from './art/instruments';
import {DrapeOverArm, HandTable, RoomBack} from './art/room';
import {OysterWorld} from './art/oyster';
import {BONE_DEPTH} from './art/anatomy';
import {P, pt} from './core/geo';
import {EV, armAt, boneAt, camAt, instrAt, skinVeil, surgeonOn, tableVariant} from './story';
import {Captions, setCaptionAdjust} from './Captions';
import {CAPTIONS} from './lib';
import {BoneState2, InstrState2} from './v2state';

// captions that would start just before a hard cut start on the cut
setCaptionAdjust({
  show: Object.fromEntries(CAPTIONS.map((c, k) => [k, [EV.cutIn, EV.cutOut].find((cut) => c.show < cut && cut - c.show < 0.12) ?? c.show])),
  lastHide: 1e9,
});

const Z_SKIN = -0.7 * BONE_DEPTH, Z_INSTR = -6, Z_TABLE = 40, Z_ROOM = 600;

/** a point at depth 0 drawn in a layer at depth z: where it must sit so it lands on the same screen point */
const reproject = (c: Cam, p: P, z: number): P => {
  const r = layerScale(c, 0) / layerScale(c, z);
  return pt(c.x + (p.x - c.x) * r, c.y + (p.y - c.y) * r);
};

const WristWorld: React.FC<{t: number; c: Cam; fkey: string}> = ({t, c, fkey}) => {
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
  return (
    <>
      {c.w > 90 && (
        <Layer c={c} z={Z_ROOM} minBlur={3} maxBlur={14}>
          <RoomBack id={`${fkey}room`} t={t} />
        </Layer>
      )}
      {c.w > 24 && (
        <Layer c={c} z={Z_TABLE} maxBlur={18}>
          <HandTable id={`${fkey}tab`} variant={tableVariant(t)} />
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
          {showSurgeon && ins.probeOn > 0.01 && <ProbeShadow st={ins.probe} px={px} />}
          {showSurgeon && ins.appOn > 0.01 && <AppShadow st={ins.app} px={px} />}
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
        {tableVariant(t) === 'drape' && <DrapeOverArm id={`${fkey}dro`} />}
      </Layer>
      {showSurgeon && (ins.appOn > 0.01 || ins.probeOn > 0.01) && (
        <Layer c={c} z={Z_INSTR} maxBlur={c.w < 60 ? 1.5 : 20}>
          <SurgeonFront id={`${fkey}sf`} s={sIns} />
        </Layer>
      )}
    </>
  );
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t, fkey, captions = true}) => {
  resetIds(fkey);
  const wc = camAt(t);
  const body = wc.world === 'wrist'
    ? <WristWorld t={t} c={wc.cam} fkey={fkey} />
    : <OysterWorld id={`${fkey}oy`} t={t} cam={wc.cam} reveal={wc.reveal ?? 0} />;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.04) saturate(1.05)'}}>
      {body}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(4,4,10,0.36) 100%)'}} />
      {captions && <Captions t={t} />}
    </div>
  );
};
