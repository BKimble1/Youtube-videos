// "It's called the MouthPad. And that tiny gold square?" — a match cut from the open mouth: the device keeps its
// exact screen position, size and angle while the face and the cavity give way to a clean studio backdrop. The
// teeth fade so the clear retainer stands alone; it turns just enough to show its shape (cups over the teeth, the
// palatal plate, the battery modules at the rear molars), separates briefly into its layers, then turns to show the
// tongue side and the camera goes in on the gold sensor pad.
import React from 'react';
import {Jaw, View, projector, padPoint} from '../art/jaw3d';
import {jawPlacement} from '../art/mouth';
import {G} from '../art/room';
import {camAt} from '../camera';
import {ROOM_CAM, ROOM_END, guesserAt} from './roomShots';
import {T} from '../story';
import {clamp, keys, lerp, ss, pulse, ss5} from '../lib';

/** the device's screen placement on the last frame of the room push (origin of the model, px per mm, view) */
export const matchFromRoom = () => {
  const t = ROOM_END - 1 / 30;
  const cam = camAt(t, ROOM_CAM);
  const m = guesserAt(t).m;
  const J = jawPlacement(m);
  const wx = G.x + J.tx * G.scale, wy = G.ground + J.ty * G.scale;
  return {x: 540 + cam.z * (wx - cam.x), y: 960 + cam.z * (wy - cam.y), px: J.k * G.scale * cam.z, view: J.v};
};
export const PRODUCT_END = T.its2 - 0.05;

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0')).join('');
};

export const ProductShot: React.FC<{t: number}> = ({t}) => {
  const M = matchFromRoom();
  const t0 = ROOM_END;
  const a = ss5(t, t0 + 0.05, t0 + 0.55); // settle into the product framing
  const yaw = keys(t, [[t0, M.view.yaw], [t0 + 0.55, -30], [T.and1 + 0.1, 28], [T.tiny + 0.1, 10], [T.gold + 0.15, 0]]);
  const pitch = keys(t, [[t0, M.view.pitch], [t0 + 0.55, -58], [T.and1 + 0.1, -66], [T.tiny + 0.1, -82], [T.gold + 0.15, -90]]);
  const roll = keys(t, [[t0 + 0.55, 0], [T.and1 + 0.1, -6], [T.gold, 0]]);
  const view: View = {yaw, pitch, roll, persp: 300};
  const explode = pulse(t, T.mouthpad + 0.35, T.mouthpad + 0.6, T.and1 + 0.05, T.tiny + 0.1);
  // the camera goes in on the pad for "tiny gold square"
  const focus = ss5(t, T.tiny - 0.1, T.square + 0.15);
  const px = lerp(lerp(M.px, 13.5, a), 30, focus) * (1 + 0.04 * Math.sin(t * 1.3));
  const pr = projector(view);
  const padC = pr(padPoint(0, 0));
  const ctr = pr({x: 0, y: 8, z: 0});
  const cx = lerp(lerp(M.x, 540 - ctr.x * 13.5, a), 540 - padC.x * px, focus);
  const cy = lerp(lerp(M.y, 900 - ctr.y * 13.5, a), 900 - padC.y * px, focus);
  const ctx = 1 - ss(t, t0 + 0.08, t0 + 0.4); // teeth and palate fade
  const bg = ss(t, t0, t0 + 0.3);
  const glow = Math.max(pulse(t, T.gold - 0.05, T.gold + 0.05, T.gold + 0.2, T.gold + 0.4), pulse(t, T.square - 0.05, T.square + 0.05, T.square + 0.3, T.square + 0.55));
  const shadowW = 260 * (13.5 / 13.5);
  return (
    <g>
      <defs>
        <radialGradient id="pr-bg" cx="50%" cy="46%" r="75%">
          <stop offset="0" stopColor={mixHex('#3A0F1A', '#2E8C93', bg)} />
          <stop offset="1" stopColor={mixHex('#2A0A12', '#173A52', bg)} />
        </radialGradient>
        <radialGradient id="pr-sh" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#0B1E2C" stopOpacity={0.45} />
          <stop offset="1" stopColor="#0B1E2C" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pr-pg" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF3B0" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFE08A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#pr-bg)" />
      {/* soft studio floor shadow */}
      <ellipse cx={540} cy={1260} rx={shadowW * 1.3} ry={60} fill="url(#pr-sh)" opacity={bg * (1 - focus)} />
      <g transform={`translate(${cx} ${cy}) scale(${px})`}>
        <Jaw view={view} px={px} id="pr-jaw" show={{teeth: ctx, palate: ctx}} explode={explode} padGlow={glow} />
      </g>
      {glow > 0.01 && <circle cx={cx + padC.x * px} cy={cy + padC.y * px} r={px * 11} fill="url(#pr-pg)" opacity={glow * 0.55} />}
      {/* a glint across the gold on "gold" */}
      {(() => {
        const g = clamp((t - T.gold) / 0.35);
        if (g <= 0 || g >= 1) return null;
        const x = cx + padC.x * px + lerp(-8, 8, g) * px, y = cy + padC.y * px;
        return <path d={`M ${x} ${y - 30} L ${x + 8} ${y - 8} L ${x + 30} ${y} L ${x + 8} ${y + 8} L ${x} ${y + 30} L ${x - 8} ${y + 8} L ${x - 30} ${y} L ${x - 8} ${y - 8} Z`} fill="#FFFFFF" opacity={Math.sin(g * Math.PI)} />;
      })()}
    </g>
  );
};
