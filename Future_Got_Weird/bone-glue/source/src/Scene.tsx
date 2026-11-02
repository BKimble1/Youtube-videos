// One frame. The camera says which world we are in. The wrist world is drawn as depth layers through a pinhole dolly
// (camera.tsx): the room far behind, the hand table, the surgeon, the inside of the wrist (deep tissue, skeleton, the
// radius, the bead), the skin with the incision a little nearer the lens (so the opening's lips are larger and softer
// in the close-ups), and the instruments above it. The oyster comparison is its own world, matched in and out.
import React from 'react';
import {resetIds} from './core/ids';
import {Cam, Layer, layerScale, viewRect} from './camera';
import {BoneInside} from './art/bone';
import {Skeleton} from './art/skeleton';
import {ArmSkin, DeepTissue, IncisionRim, armOutlinePath} from './art/arm';
import {SurgeonBack, SurgeonFront} from './art/surgeon';
import {DrapeOverArm, HandTable, RoomBack} from './art/room';
import {OysterWorld} from './art/oyster';
import {BONE_DEPTH} from './art/anatomy';
import {P, pt} from './core/geo';
import {armAt, boneAt, camAt, instrAt, openTau, skinVeil, surgeonOn, tableVariant, wipeAt} from './story';
import {Captions} from './Captions';
import {GloveWipe} from './GloveWipe';

const Z_SKIN = -0.7 * BONE_DEPTH, Z_INSTR = -6, Z_TABLE = 40, Z_ROOM = 600;

/** a point at depth 0 drawn in a layer at depth z: where it must sit so it lands on the same screen point */
const reproject = (c: Cam, p: P, z: number): P => {
  const r = layerScale(c, 0) / layerScale(c, z);
  return pt(c.x + (p.x - c.x) * r, c.y + (p.y - c.y) * r);
};

const WristWorld: React.FC<{t: number; c: Cam; fkey: string}> = ({t, c, fkey}) => {
  const px = c.w / 1080;
  const bone = boneAt(t, px);
  const arm = armAt(t);
  const ins = instrAt(t);
  const view = viewRect(c, 0);
  const tau = openTau(t);
  // instrument tips touch the bone (depth 0) but the instruments are drawn above the skin: reproject the contact points
  const sIns = {
    ...ins,
    app: {...ins.app, tip: reproject(c, ins.app.tip, Z_INSTR)},
    clamp: {...ins.clamp, a: reproject(c, ins.clamp.a, Z_INSTR), b: reproject(c, ins.clamp.b, Z_INSTR)},
    k: c.k ?? 1,
  };
  const showSurgeon = surgeonOn(t) && c.w > 70;
  const clipId = `${fkey}armclip`;
  const rClip = layerScale(c, Z_SKIN) / layerScale(c, 0);
  void tau;
  return (
    <>
      {c.w > 90 && (
        <Layer c={c} z={Z_ROOM} minBlur={3} maxBlur={14}>
          <RoomBack id={`${fkey}room`} t={t} />
        </Layer>
      )}
      <Layer c={c} z={Z_TABLE} maxBlur={18}>
        <HandTable id={`${fkey}tab`} variant={tableVariant(t)} />
      </Layer>
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
          <BoneInside st={bone} view={view} />
        </g>
      </Layer>
      <Layer c={c} z={Z_SKIN} maxBlur={22}>
        <ArmSkin id={`${fkey}skin`} s={arm} />
        {skinVeil(t) > 0.001 && (
          <g opacity={skinVeil(t)}>
            <ArmSkin id={`${fkey}veil`} s={arm} noWindow />
          </g>
        )}
        <IncisionRim id={`${fkey}rim`} s={arm} />
        {tableVariant(t) === 'drape' && <DrapeOverArm id={`${fkey}dro`} />}
      </Layer>
      {(showSurgeon || c.w <= 70) && (ins.appOn > 0.01 || ins.clampOn > 0.01) && (
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
  let body: React.ReactNode;
  if (wc.world === 'wrist') body = <WristWorld t={t} c={wc.cam} fkey={fkey} />;
  else if (wc.world === 'oyster') body = <OysterWorld id={`${fkey}oy`} t={t} cam={wc.cam} />;
  else {
    // a matched dissolve: both worlds move together, aligned on the attachment boundary
    const oysterOver = wc.world === 'match';
    body = (
      <>
        {oysterOver ? <WristWorld t={t} c={wc.cam} fkey={fkey} /> : <OysterWorld id={`${fkey}oy`} t={t} cam={wc.cam2!} />}
        <div style={{position: 'absolute', inset: 0, opacity: oysterOver ? wc.mix ?? 0 : 1 - (wc.mix ?? 0)}}>
          {oysterOver ? <OysterWorld id={`${fkey}oy`} t={t} cam={wc.cam2!} /> : <WristWorld t={t} c={wc.cam} fkey={fkey} />}
        </div>
      </>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.04) saturate(1.05)'}}>
      {body}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(4,4,10,0.36) 100%)'}} />
      <GloveWipe u={wipeAt(t)} fkey={fkey} />
      {captions && <Captions t={t} />}
    </div>
  );
};
