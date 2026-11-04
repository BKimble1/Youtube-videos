// S6. BrainNet (2019). Match cut: the 2014 touchpad's rectangle becomes the falling J-block (its 3 x 2 box fills
// x 760..1160, y 380..640 on the first frame), which settles into the top of the Receiver's game screen. The audience
// plays first from the Receiver's seat, where the lower field is hidden ("Rotate it?"). Pull back through the screen
// to the building: three rooms (Sender A teal, Sender B coral, the Receiver purple) and the computer between them.
// The two Senders' screens light the one-cell gap; push into Sender A's view, then swing back to the Receiver's
// screen, where either answer looks reasonable. The Senders vote by watching a flickering light (YES left, NO right):
// a gaze line, a ring on the light, a dot sliding to it, and a coloured YES chip that flies into the computer. Push to
// the back of the Receiver's head: the figure-eight coil slides onto the cap over the visual cortex; the brain shows
// through. A pulse, then over the shoulder into the Receiver's view: one brief, soft arc = "rotate"; nothing = "leave
// it". Wide: round 1 (the two YES chips go to the coil one by one, two flashes, the Receiver watches YES, the block
// turns), round 2 (the block half falls; fresh NO votes, no flashes; the Receiver watches NO), the block drops into
// the gap and the line clears.
import React from 'react';
import {clamp, easeInOut} from '../dc/math';
import {FPS} from '../lib/core';
import {Cam, INK, K, Tag} from '../art/kit';
import {BNWorld, CH, COIL, CW, HEAD_R, MON_R, PF, SoftArc} from '../art/s6world';
import {bnCues, bnState, S6_START, S7_START} from './s6timeline';
import {T} from '../lib/core';

const pr = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a || 1e-6)));
const win = (t: number, a: number, b: number, c: number, d: number) => pr(t, a, b) * (1 - pr(t, c, d));

/** frame-space overlays: seat labels, the playable question, the Receiver's-eye flash */
const S6Overlay: React.FC<{t: number}> = ({t}) => {
  const recv = T('receiving end'), job = T('much better job'), y2019 = T('In a 2019');
  const gap = T('gap at the bottom'), third = T('The third could see'), block = T('the block and had');
  const seat = T('From that seat'), either = T('either answer'), each = T('Each teammate sent');
  const little = T('A little flash'), flash = T('flash in their vision'), meantRot = T('meant rotate');
  const noFlash = T('No flash'), leave = T('leave it');
  const rView = win(t, recv - 0.3, recv + 0.1, y2019 - 0.1, y2019 + 0.2) + win(t, block + 0.0, block + 0.3, each - 1.05, each - 0.8);
  const sView = win(t, gap - 0.05, gap + 0.25, third - 0.45, third - 0.2);
  const pov = win(t, little - 0.15, flash + 0.2, leave + 0.5, leave + 0.85);
  const arc = win(t, flash + 0.08, flash + 0.2, flash + 0.5, flash + 0.95);
  const noArc = win(t, noFlash + 0.1, noFlash + 0.4, leave + 0.4, leave + 0.7);
  return (
    <g>
      {pov > 0 && (
        <g opacity={pov}>
          <defs>
            <radialGradient id="s6pov" cx="0.5" cy="0.48" r="0.75">
              <stop offset="0.55" stopColor={K.receiver} stopOpacity={0} />
              <stop offset="1" stopColor={K.receiver} stopOpacity={0.55} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={1920} height={1080} fill="url(#s6pov)" />
        </g>
      )}
      <SoftArc x={960} y={300} w={820} k={arc} />
      <SoftArc x={960} y={300} w={820} k={noArc} dashed />
      <Tag x={960} y={56} text="Receiver’s view" size={36} k={rView + pov} fill={K.receiver} color="#FFFFFF" />
      <Tag x={960} y={56} text="Sender’s view" size={36} k={sView} fill={K.senderA} color="#FFFFFF" />
      <Tag x={960} y={730} text="Rotate it?" size={44} k={win(t, job, job + 0.3, y2019 - 0.1, y2019 + 0.2)} />
      <Tag x={690} y={604} text="rotate?" size={40} k={win(t, seat + 0.15, seat + 0.45, each - 1.05, each - 0.8)} />
      <Tag x={1230} y={604} text="leave it?" size={40} k={win(t, either + 0.05, either + 0.35, each - 1.05, each - 0.8)} />
      <Tag x={960} y={730} text="flash = rotate" size={44} k={win(t, meantRot, meantRot + 0.3, noFlash - 0.2, noFlash + 0.05)} />
      <Tag x={960} y={730} text="no flash = leave it" size={44} k={win(t, leave, leave + 0.3, leave + 0.55, leave + 0.85)} />
    </g>
  );
};

/** world-space labels that ride with the camera */
const S6WorldLabels: React.FC<{t: number}> = ({t}) => {
  const over = T('over the part of the brain'), little = T('A little flash');
  const k = win(t, over + 0.2, over + 0.55, little - 0.5, little - 0.2);
  if (k <= 0) return null;
  const tx = HEAD_R.x - 250, ty = HEAD_R.y - 115;
  const target = {x: HEAD_R.x - 0.42 * HEAD_R.r, y: HEAD_R.y + 0.5 * HEAD_R.r};
  return (
    <g opacity={clamp(k * 1.4)}>
      <path d={`M${tx + 40},${ty + 14} Q${tx + 70},${ty + 120} ${target.x - 20},${target.y}`} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="7 6" />
      <circle cx={target.x - 20} cy={target.y} r={4} fill={INK} />
      <Tag x={tx} y={ty} text="visual cortex" size={17} k={k} />
      <Tag x={COIL.x - 150} y={COIL.y + 70} text="coil" size={15} k={win(t, T('back of the receiver’s'), T('back of the receiver’s') + 0.3, over - 0.2, over + 0.1)} />
    </g>
  );
};

/** The match cut: on the first frames the playfield runs edge to edge around the piece (whose 3 x 2 box is the 2014
 *  touchpad's rectangle); it then gives way to the real screen as the camera pulls back. World units. */
const MatchField: React.FC<{t: number}> = ({t}) => {
  const t0 = S6_START();
  const k = 1 - pr(t, t0 + 0.25, t0 + 1.0);
  if (k <= 0) return null;
  const s = MON_R.s;
  const ox = MON_R.x + (PF.x - 320) * s, oy = MON_R.y + (PF.y - 510) * s;
  const cw = CW * s, ch = CH * s;
  const e = 1.5;
  const bx = ox + 3 * cw - e, by = oy - e, bw = 3 * cw + 2 * e, bh = 2 * ch + 2 * e;
  const hole = `M-5000,-5000 H8000 V8000 H-5000 Z M${bx},${by} V${by + bh} H${bx + bw} V${by} Z`;
  const lines: string[] = [];
  for (let i = -30; i <= 40; i++) lines.push(`M${(ox + i * cw).toFixed(2)},${oy - 30 * ch} V${oy + 40 * ch}`);
  for (let j = -30; j <= 40; j++) lines.push(`M${ox - 30 * cw},${(oy + j * ch).toFixed(2)} H${ox + 40 * cw}`);
  return (
    <g opacity={k}>
      <defs>
        <clipPath id="s6mf">
          <path d={hole} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={hole} fillRule="evenodd" fill="#22384A" />
      <path d={lines.join(' ')} clipPath="url(#s6mf)" stroke="#9DB2C3" strokeWidth={s} opacity={0.18} fill="none" />
    </g>
  );
};

export const S6: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const st = bnState(t);
  return (
    <g>
      <Cam x={st.cam.x} y={st.cam.y} z={st.cam.z}>
        <BNWorld st={st} t={t} f={f} />
        <MatchField t={t} />
        <S6WorldLabels t={t} />
      </Cam>
      <S6Overlay t={t} />
    </g>
  );
};

export const CUES_S6 = (): {t: number; kind: string; gain?: number}[] => {
  const a = S6_START(), b = S7_START();
  return bnCues().filter((c) => c.t >= a && c.t < b);
};
