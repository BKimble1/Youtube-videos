// One world, one camera: the sender and receiver in a bright room, the sender's see-through head, the route of the
// message between them, and the interface panels. `World` draws everything for time t (seconds); the same function,
// evaluated at negative times with the opening camera, is the loop layer that the final iris wipe reveals.
import React from 'react';
import {Room} from '../art/Room';
import {Receiver, Sender, SENDER_C, SENDER_R, RECEIVER_C, RECEIVER_R} from '../art/Figures';
import {cranialLayers, chipWorld, patchWorld} from '../art/Section';
import {Fragment, IntrusiveThought, MindCloud, NeckWindow, CLOUD_C} from '../art/Mind';
import {CancelButton, HeyBubble, Packet, ReceiverHud, Route, routePoint, routeAngle, SenderPanel} from '../art/Ui';
import {Cam, Layer, toScreen} from '../lib/camera';
import {B, T} from '../lib/timeline';
import {clamp, easeInOut, easeOut, inv, lerp, V} from '../lib/math';
import {
  blinkAt,
  cancelState,
  chipPing,
  chipRedAt,
  CANCEL_C,
  cloudAlpha,
  QUEUED,
  RED_FORMS,
  headPulses,
  hookU,
  hudState,
  HUD_C,
  ledAt,
  motorTag,
  neckDim,
  neckOpen,
  NECK_C,
  normalU,
  PANEL_C,
  panelState,
  patchGlow,
  patchRed,
  queuedU,
  receiverExpr,
  receiverState,
  redU,
  routeAt,
  senderExpr,
  senderState,
  silhouetteAlpha,
  silhouetteGrow,
  sweepEdge,
  sweepP,
} from '../lib/choreo';

const sm = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1));
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));


export const World: React.FC<{p: string; t: number; cam: Cam}> = ({p, t, cam}) => {
  const ss = senderState(t);
  const rs = receiverState(t);
  const route = routeAt(t);
  const sec = cranialLayers({
    id: `${p}cs`,
    p: sweepP(t),
    edge: sweepEdge(t),
    turn: ss.turn,
    pulses: headPulses(t),
    glow: patchGlow(t),
    glowRed: patchRed(t),
    led: ledAt(t),
    chipRed: chipRedAt(t),
    mark: motorTag(t),
  });
  const hc: V = {x: SENDER_C.x + ss.shiftX * 0.7, y: SENDER_C.y + ss.shiftY * 0.7};
  const chip = route.A;
  const hud = hudState(t);
  const panel = panelState(t);
  const canc = cancelState(t);
  const ping = chipPing(t);

  // ---- packets and bubbles
  const hookForm = sm(B.sendHook - 0.3, B.sendHook, t);
  const hookOn = t > B.sendHook - 0.3 && t < B.arriveHook + 0.02;
  const hookPos = routePoint(route, hookU(t));
  const hookAlpha = hookOn ? hookForm * (1 - sm(B.arriveHook - 0.12, B.arriveHook + 0.02, t)) : 0;

  const tokForm = sm(B.packetForms, B.packetForms + 0.4, t) * (1 - sm(B.heyForms, B.heyForms + 0.3, t));
  const heyPos: V = {x: chip.x + 8, y: chip.y - 92};
  const heyIn = sm(B.heyForms, B.heyForms + 0.2, t) * (1 - sm(B.sendNormal - 0.08, B.sendNormal + 0.06, t));
  const nPos = routePoint(route, normalU(t));
  const nAlpha = t > B.sendNormal - 0.08 && t < B.arriveNormal + 0.02 ? sm(B.sendNormal - 0.08, B.sendNormal + 0.06, t) * (1 - sm(B.arriveNormal - 0.12, B.arriveNormal + 0.02, t)) : 0;

  const rForm = sm(RED_FORMS, RED_FORMS + 0.35, t);
  const rU = redU(t);
  const rPos = routePoint(route, rU);
  const rAlpha = t < RED_FORMS ? 0 : rForm * (1 - sm(B.redArrives - 0.1, B.redArrives + 0.04, t));
  const rScale = lerp(0.3, 1, easeOut(rForm)) * (rU > 0.02 ? lerp(1, 1.08, clamp(rU * 2)) : 1 + 0.07 * Math.sin(t * 12));
  const ghost = win(t, B.matchCut, B.matchCut + 1.2, 0.05, 0.9) * (rU > 0.01 ? 1 : 0);

  const queued = win(t, QUEUED.from, QUEUED.to, 0.3, 0.5);
  const qBase = routePoint(route, queuedU(t));
  const qPos: V = {x: qBase.x, y: qBase.y - 6 + 4 * Math.sin(t * 3)};

  // ---- fragments crossing the mind
  const frags = Array.from({length: 5}, (_, i) => {
    const t0 = B.fragments + i * 0.3;
    const u = inv(t0, t0 + 1.25, t);
    const x = lerp(-185, 175, easeInOut(u));
    const y = [-30, 38, -62, 10, 52][i] + 8 * Math.sin(t * 2 + i);
    return {u, x, y, kind: i, rot: i * 37 + u * 90, a: u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 0.5 : 0};
  });
  const cloud = cloudAlpha(t);

  const neck = neckOpen(t);
  const recvEyeRed = 0;

  return (
    <g>
      <Layer cam={cam} depth={1.45}>
        <Room />
      </Layer>
      <Layer cam={cam} depth={1}>
        <MindCloud id={`${p}mc`} alpha={cloud} red={silhouetteGrow(t)}>
          <IntrusiveThought id={`${p}it`} alpha={silhouetteAlpha(t)} grow={silhouetteGrow(t)} />
          {frags.map((fr, i) => (
            <Fragment key={i} c={{x: fr.x, y: fr.y}} kind={fr.kind} s={1.05} alpha={fr.a} rot={fr.rot} />
          ))}
        </MindCloud>
        <Receiver id={`${p}r`} pose={rs} expr={receiverExpr(t)} blink={blinkAt(t, 5)} />
        <Sender
          id={`${p}s`}
          pose={{roll: ss.roll, turn: ss.turn, shiftX: ss.shiftX, shiftY: ss.shiftY, reach: ss.reach, reachTo: CANCEL_C, press: ss.press}}
          expr={senderExpr(t)}
          blink={blinkAt(t, 11)}
          underlay={sec.underlay}
          overlay={sec.overlay}
          bodyOverlay={<NeckWindow id={`${p}nw`} c={{x: NECK_C.x + ss.shiftX, y: NECK_C.y + ss.shiftY}} R={SENDER_R} open={neck} fold={0} dim={neckDim(t)} />}
        />
        {/* chip ping ring: the loop's circular motif, one every 0.75 s */}
        {ping.a > 0.02 && (
          <circle cx={chip.x.toFixed(1)} cy={chip.y.toFixed(1)} r={(14 + 70 * ping.u).toFixed(1)} fill="none" stroke={patchRed(t) > 0.5 ? '#EF3340' : '#46CFFF'} strokeWidth={3.5 * ping.a} opacity={0.5 * ping.a} />
        )}
        {/* route and packets */}
        <Route r={route} alpha={Math.max(win(t, B.sendHook - 0.2, B.arriveHook + 0.3, 0.2, 0.3), win(t, B.sendNormal - 0.2, B.arriveNormal + 0.3, 0.2, 0.3), win(t, RED_FORMS + 0.4, B.redArrives + 0.2, 0.5, 0.2) * 0.8)} red={rForm > 0.5 && t > RED_FORMS ? 1 : 0} phase={t * 70} u0={0} u1={1} />
        <Packet id={`${p}hk`} c={hookPos} s={0.5 + 0.6 * hookForm} alpha={hookAlpha} rot={routeAngle(route, hookU(t)) * 0.0} />
        <Packet id={`${p}tk`} c={{x: chip.x, y: chip.y - 40}} s={0.4 + 0.8 * tokForm} alpha={tokForm} />
        <HeyBubble c={heyPos} w={150} id={`${p}hy`} alpha={heyIn} s={0.6 + 0.4 * easeOut(clamp(heyIn * 1.4))} />
        <Packet id={`${p}np`} c={nPos} s={1.05} alpha={nAlpha} />
        <HeyBubble c={qPos} w={140} id={`${p}qb`} alpha={queued * (1 - sm(B.redArrives - 0.4, B.redArrives, t) * 0.7)} />
        {ghost > 0.01 && <Packet id={`${p}gh`} c={{x: rPos.x - 8, y: rPos.y + 6}} s={1.1} alpha={0.75 * ghost} />}
        <Packet id={`${p}rp`} c={t < B.redLeaves ? {x: chip.x + 2, y: chip.y - 48 + 3 * Math.sin(t * 8)} : rPos} s={rScale} red={1} alpha={rAlpha} glow={1 + 0.3 * Math.sin(t * 9)} />
        {/* interface */}
        <SenderPanel id={`${p}sp`} c={PANEL_C} alpha={panel.alpha} red={panel.red} warn={panel.warn} blink={panel.blink} hey={panel.hey} />
        <CancelButton c={CANCEL_C} red={canc.red} press={ss.press} ring={canc.ring} alpha={canc.alpha} flash={canc.flash} />
        <ReceiverHud id={`${p}hud`} c={HUD_C} alpha={hud.alpha} red={hud.red} msg={hud.msg} progress={hud.progress} delivered={hud.delivered} landed={hud.landed} />
      </Layer>
    </g>
  );
};

/** screen position of a world point under a camera */
export const screenOf = (cam: Cam, w: V) => toScreen(cam, w);
export {chipWorld, patchWorld};
