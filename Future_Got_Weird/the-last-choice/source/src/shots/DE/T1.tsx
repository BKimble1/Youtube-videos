// T1 — End card. Black; the title fades in, then the credit line, quietly; the song fades out under them (it ends by
// M.L_FADE1). Nothing else. (4.45 s, from M.CARD.)
import React from 'react';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {F} from '../../theme';
import {seg, smooth} from '../../kit/math';

const T1: React.FC = () => {
  const {t, start, dur} = useShot('T1');
  const title = smooth(seg(t, 0.35, 1.45));
  const credit = smooth(seg(t, 1.25, 2.3));
  // everything holds, then a gentle fade to black over the last 0.5 s (the song is out by M.L_FADE1)
  const out = 1 - smooth(seg(t, dur - 0.55, dur));
  void M; void start;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#000'}}>
      <rect x={0} y={0} width={1920} height={1080} fill="#000" />
      <g opacity={out}>
        <text x={960} y={520} textAnchor="middle" fontFamily={F.display} fontWeight={500} fontSize={92} letterSpacing={14} fill="#EDE6D6" opacity={title}>THE LAST CHOICE</text>
        <text x={960} y={610} textAnchor="middle" fontFamily={F.body} fontWeight={500} fontSize={34} letterSpacing={2} fill="#A9A294" opacity={credit}>A speculative short film by Future Got Weird</text>
      </g>
    </svg>
  );
};
export default T1;
