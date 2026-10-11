import React from 'react';
import {C, E, tw, lerp, clamp01, sp, SNAP, HED_FONT, impact, hop, useSw} from './kit';
import {EV} from './cues';
import {Tray, Folder, Envelope} from './shapes';
import {PAGE} from './kit';

export const INBOX = {x: 100, y: 440, w: 300, h: 120};
export const INVT = {x: 560, y: 440, w: 290, h: 120};
export const FOLDER = {x: 262, y: 800, w: 570, h: 440};
const ENV_START = {x: PAGE.x + PAGE.w / 2, y: PAGE.y + PAGE.h / 2};
const ENV_IN = {x: INBOX.x + INBOX.w / 2, y: INBOX.y + 18};
const ENV_SPAM = {x: FOLDER.x + FOLDER.w / 2 - 20, y: FOLDER.y + 146};

/** envelope state over time: fold-out -> flight to the inbox -> waits -> flagged -> slides into the SPAM folder */
const envState = (g: number) => {
  const f0 = EV['b4.fold'] + 8, f1 = EV['b4.arrive'];
  const fly = tw(g, f0 + 6, f1 - f0 - 6, (x) => x);
  const e = E.inOut(fly);
  let x = lerp(ENV_START.x, ENV_IN.x, e), y = lerp(ENV_START.y, ENV_IN.y, e) - 150 * Math.sin(fly * Math.PI);
  let s = lerp(1, 0.5, e);
  let rot = lerp(-5, 0, e) + 10 * Math.sin(fly * Math.PI);
  const t2 = EV['b4.flag'] + 4, t3 = EV['b4.land'];
  const down = tw(g, t2, t3 - t2, (v) => v);
  if (g >= t2) {
    const d = E.in(down);
    x = lerp(ENV_IN.x, ENV_SPAM.x, d) + 18 * Math.sin(down * Math.PI);
    y = lerp(ENV_IN.y, ENV_SPAM.y, d) - 70 * Math.sin(down * Math.PI);
    s = lerp(0.5, 0.62, d);
    rot = lerp(0, -8, d);
  }
  return {x, y, s, rot};
};

export const Consequence: React.FC<{g: number}> = ({g}) => {
  const sw = useSw();
  const t0 = EV['b4.fold'];
  const trayPop = sp(g, t0 + 9, SNAP, 16);
  const arriveHit = impact(g, EV['b4.arrive'], 0.08, 9);
  const env = envState(g);
  const envIn = clamp01(tw(g, t0 + 2, 6, (x) => x));
  const flagged = g >= EV['b4.flag'];
  const flagPop = sp(g, EV['b4.flag'], SNAP, 12);
  const land = EV['b4.land'];
  const folderHit = impact(g, land, 0.07, 10);
  const folderPop = sp(g, EV['b4.flag'] - 4, SNAP, 14);
  const labelOn = clamp01((g - land - 2) / 4);
  const labelPop = g >= land + 2 ? Math.max(0, 1 - (g - land - 2) / 8) : 0;
  const latch = g >= EV['b4.latch'] ? clamp01((g - EV['b4.latch']) / 4) : 0;
  const scan = tw(g, EV['b4.arrive'] + 8, EV['b4.flag'] - EV['b4.arrive'] - 10, (x) => x);
  const invPop = sp(g, EV['b4.tray'], SNAP, 16);
  const route = tw(g, EV['b4.never'], 9, E.out);
  const cross = sp(g, EV['b4.never'] + 8, SNAP, 12);
  const envNode = <Envelope x={env.x} y={env.y} s={env.s} rot={env.rot} op={envIn} tag={flagged ? 'SPAM' : undefined} />;
  const folderShake = g >= land && g < land + 8 ? Math.sin((g - land) * 2.6) * 6 * (1 - (g - land) / 8) : 0;
  return (
    <g>
      {/* trays (the inbox arrives with the fold; the investigators' tray arrives on "Investigators") */}
      <g transform={`translate(${INBOX.x + INBOX.w / 2} ${INBOX.y + INBOX.h}) scale(${(0.6 + 0.4 * trayPop) * arriveHit[0]} ${(0.6 + 0.4 * trayPop) * arriveHit[1]}) translate(${-(INBOX.x + INBOX.w / 2)} ${-(INBOX.y + INBOX.h)})`} opacity={clamp01(trayPop * 3)}>
        <Tray x={INBOX.x} y={INBOX.y} w={INBOX.w} h={INBOX.h} label="INBOX" />
      </g>
      {g >= EV['b4.tray'] && (
        <g transform={`translate(${INVT.x + INVT.w / 2} ${INVT.y + INVT.h}) scale(${0.6 + 0.4 * invPop}) translate(${-(INVT.x + INVT.w / 2)} ${-(INVT.y + INVT.h)})`} opacity={clamp01(invPop * 3)}>
          <Tray x={INVT.x} y={INVT.y} w={INVT.w} h={INVT.h} label="INVESTIGATORS" fill={C.tealLight} dash labelSize={46} />
        </g>
      )}
      {/* the route that never carries it */}
      {route > 0 && (
        <g>
          <path d={`M ${INBOX.x + INBOX.w + 14} ${INBOX.y + 60} L ${INBOX.x + INBOX.w + 14 + (INVT.x - INBOX.x - INBOX.w - 28) * route} ${INBOX.y + 60}`} stroke={C.ink} strokeWidth={sw(8)} strokeDasharray="22 16" strokeLinecap="round" fill="none" />
          {cross > 0 && (
            <g transform={`translate(${(INBOX.x + INBOX.w + INVT.x) / 2} ${INBOX.y + 60}) scale(${0.4 + 0.6 * cross})`} opacity={clamp01(cross * 3)}>
              <circle r={36} fill={C.coral} stroke={C.ink} strokeWidth={6} />
              <path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke={C.cream} strokeWidth={10} strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
      {/* scanner sweep over the inbox */}
      {scan > 0 && scan < 1 && (
        <g opacity={0.9}>
          <rect x={INBOX.x + scan * (INBOX.w - 24)} y={INBOX.y - 150} width={24} height={INBOX.h + 150} rx={8} fill={C.coral} opacity={0.5} />
          <rect x={INBOX.x + scan * (INBOX.w - 24) + 9} y={INBOX.y - 150} width={6} height={INBOX.h + 150} fill={C.coral} />
        </g>
      )}
      {/* envelope above the folder until it enters; inside the folder afterwards */}
      {g < EV['b4.flag'] + 4 && g >= t0 + 2 && envNode}
      {g >= EV['b4.flag'] - 4 && (
        <g transform={`translate(${FOLDER.x + FOLDER.w / 2} ${FOLDER.y + FOLDER.h}) scale(${folderHit[0] * (0.7 + 0.3 * folderPop)} ${folderHit[1] * (0.7 + 0.3 * folderPop)}) translate(${-(FOLDER.x + FOLDER.w / 2)} ${-(FOLDER.y + FOLDER.h)})`} opacity={clamp01(folderPop * 3)}>
          <Folder x={FOLDER.x} y={FOLDER.y} w={FOLDER.w} h={FOLDER.h} shake={folderShake} label={labelOn > 0 ? 'SPAM' : undefined} labelPop={labelPop} latch={latch} inside={g >= EV['b4.flag'] + 4 ? envNode : undefined} />
        </g>
      )}
      {flagged && g < EV['b4.flag'] + 4 && (
        <g transform={`translate(${ENV_IN.x + 78} ${ENV_IN.y - 70 - 20 * hop(g, EV['b4.flag'], 1, 8) * -1}) scale(${0.4 + 0.6 * flagPop})`}>
          <path d="M 0 40 L 0 -30" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <path d="M 0 -30 L 70 -12 L 0 6 Z" fill={C.coral} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};
void HED_FONT;
