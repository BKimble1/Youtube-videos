// The V2 world: the room, the receiver, the sender (profile drawing with its crown window and throat lens), the route and
// its packets, and the interface pieces. `World3` draws everything for time t under the camera `cam`.
import React from 'react';
import {Room} from '../../art/Room';
import {Receiver} from '../../art/Figures';
import {Packet, routeAngle, routePoint, HeyBubble} from '../../art/Ui';
import {Layer} from '../../lib/camera';
import {clamp, easeInOut, V} from '../../lib/math';
import {X0, topY} from '../art/Column';
import {SenderP} from '../art/Profile';
import {ArCard, NeckLens, Route2, UndoChip, WarnCard} from '../art/Ui2';
import {
  aperture, arCard, blink, CARD_C, colState, hookAlpha, hookU, HEYQ_C, heyQueued, lensW, linkOrbs, neckMark, neckOpenAt, normalAlpha, normalU, RC, receiverExpr,
  receiverGaze3, receiverPose, redAlpha, redU, routeAlpha, routeAt3, routeRed, RR, SC, senderExpr, senderPose, SR, SU, UNDO_C, undoChip, V2, warnCard, WARN_C, Cam,
} from '../choreo3';

const sm = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1));
  return x * x * (3 - 2 * x);
};

export const World3: React.FC<{p: string; t: number; cam: Cam}> = ({p, t, cam}) => {
  const sp = senderPose(t);
  const hc: V = {x: SC.x + sp.shiftX * 0.7 + sp.lean * 0.8, y: SC.y + sp.shiftY * 0.7};
  const col = colState(t);
  const ap = aperture(t);
  const route = routeAt3(t);
  const rp = receiverPose(t);
  const gaze = receiverGaze3(t);
  const rbase = receiverExpr(t);
  const rexpr = {...rbase, gx: rbase.gx + (gaze.gx - rbase.gx) * gaze.w, gy: rbase.gy + (gaze.gy - rbase.gy) * gaze.w};
  const par: V = {x: (cam.x - hc.x) / SU, y: (cam.y - hc.y) / SU};
  const ar = arCard(t);
  const undo = undoChip(t);
  const warn = warnCard(t);
  const lens = lensW(t);
  void lens;

  // packets: the screen size stays about constant (we follow them), starting at the decoder bubble's size
  const px = (exit: number) => {
    const exitW = 8.2 * SU * cam.z;
    const w = exitW + (140 - exitW) * sm(exit, exit + 0.3, t);
    return clamp(w / (48 * cam.z), 0.08, 2.8);
  };
  const hookPos = routePoint(route, hookU(t));
  const nPos = routePoint(route, normalU(t));
  const rPos = routePoint(route, redU(t));
  const orbs = linkOrbs(t);
  const heyQ = heyQueued(t);
  const nOpen = neckOpenAt(t);
  const neckC: V = {x: hc.x - SR * 0.07, y: hc.y + SR * 1.3};

  return (
    <g>
      <Layer cam={cam} depth={1.45} opacity={1 - sm(4.5, 7.5, cam.z)}>
        <Room />
      </Layer>
      <Layer cam={cam} depth={1}>
        <g transform={`translate(${RC.x} ${RC.y + RR * 2.2}) scale(${rp.scale}) translate(${-RC.x} ${-(RC.y + RR * 2.2)})`}>
          <Receiver id={`${p}r`} c={RC} R={RR} pose={rp} expr={rexpr} blink={blink(t, 5)} />
        </g>
        <SenderP
          id={`${p}s`}
          c={SC}
          R={SR}
          pose={{roll: sp.roll, shiftX: sp.shiftX, shiftY: sp.shiftY, reach: sp.reach, reachTo: UNDO_C, press: sp.press, sway: sp.sway, lean: sp.lean}}
          expr={senderExpr(t)}
          blink={blink(t, 11)}
          aperture={ap}
          lens={col.lens}
          lensRed={col.lensRed}
          column={{id: `${p}c`, pulses: col.pulses, dec: col.dec, glow: col.glow, dim: col.dim, lens: col.lens, lensRed: col.lensRed, distort: col.distort, gates: col.gates, active: col.active, par, detail: 1, ps: clamp(11 / (1.25 * SU * cam.z), 1, 3), ts: clamp(3.2 / (0.55 * SU * cam.z), 1, 2.2)}}
          neckOpen={nOpen}
          neck={<NeckLens id={`${p}nk`} c={neckC} r={SR * 0.56} open={nOpen} mark={neckMark(t)} dim={sm(4.7, 5.1, t)} />}
        />
        {/* the route and the packets */}
        <Route2 pts={Array.from({length: 28}, (_, i) => routePoint(route, i / 27))} alpha={routeAlpha(t)} red={routeRed(t)} phase={t * 70} z={cam.z} />
        {orbs.map((u, i) => {
          const q = routePoint(route, u);
          return <circle key={i} cx={q.x} cy={q.y} r={7 / Math.max(1, cam.z)} fill="#BFF1FF" stroke="#FFFFFF" strokeWidth={2 / Math.max(1, cam.z)} opacity={Math.sin(Math.PI * u) * 0.9} />;
        })}
        <Packet id={`${p}hk`} c={hookPos} s={px(V2.hookOut)} alpha={hookAlpha(t)} rot={0} glow={1.2} />
        <Packet id={`${p}np`} c={nPos} s={px(V2.normalOut)} alpha={normalAlpha(t)} rot={0} glow={1.2} />
        <Packet id={`${p}rp`} c={rPos} s={px(V2.redOut)} red={1} alpha={redAlpha(t)} rot={routeAngle(route, redU(t)) * 0} glow={1.2 + 0.3 * Math.sin(t * 9)} />
        {t > V2.recvArrive && t < V2.recvArrive + 0.35 && (() => {
          const u = (t - V2.recvArrive) / 0.35;
          const q = routePoint(route, 1);
          return (
            <g>
              <circle cx={q.x} cy={q.y} r={(26 + 90 * u) / cam.z} fill="none" stroke="#BFF1FF" strokeWidth={5 / cam.z} opacity={0.9 * (1 - u)} />
              <circle cx={q.x} cy={q.y} r={(14 + 40 * u) / cam.z} fill="#FFFFFF" opacity={0.7 * (1 - u)} />
            </g>
          );
        })()}
        {heyQ > 0.01 && <HeyBubble c={{x: HEYQ_C.x, y: HEYQ_C.y - 5 + 4 * Math.sin(t * 3)}} w={150} id={`${p}hq`} alpha={heyQ * 0.9} s={0.9} />}
        {/* interface */}
        <ArCard id={`${p}ar`} c={CARD_C} alpha={ar.alpha} red={ar.red} typing={ar.typing} msg={ar.msg} done={ar.done} tick={ar.tick} sil={ar.sil} pulse={ar.pulse} />
        <UndoChip c={UNDO_C} alpha={undo.alpha} ring={undo.ring} spent={undo.spent} press={undo.press} shake={undo.shake} prog={undo.prog} red={undo.red} showTrack={undo.showTrack} />
        <WarnCard id={`${p}wn`} c={WARN_C} s={0.9} alpha={warn.alpha} blink={warn.blink} />
      </Layer>
    </g>
  );
};
void easeInOut;
void X0;
void topY;
