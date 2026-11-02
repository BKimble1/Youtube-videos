// Dev entry for the V2 clasp module: ClaspAges (ages 0 .. 1), ClaspHero (age 1 large, age 0 below), ClaspTest
// (attach points, angle and squeeze variations).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Clasp, CLASP_ATTACH, CLASP_BOX, CLASP_SIZE, claspAttach} from '../clasp';

const BG = '#E4EDF1';
const Ages: React.FC = () => {
  const ages = [0, 0.25, 0.5, 0.75, 1];
  const s = 3.3; // the hands (without sleeves) about 600 px across
  const band = 1920 / 5;
  return (
    <AbsoluteFill style={{background: BG}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          {ages.map((_, i) => <clipPath key={i} id={`band${i}`}><rect x={0} y={i * band + 2} width={1080} height={band - 4} /></clipPath>)}
        </defs>
        {ages.map((a, i) => (
          <g key={i} clipPath={`url(#band${i})`}>
            <rect x={0} y={i * band + 2} width={1080} height={band - 4} fill={i % 2 ? '#DCE7EC' : BG} />
            <g transform={`translate(${540 - ((CLASP_BOX.x0 + CLASP_BOX.x1) / 2) * s} ${i * band + band / 2 + 6}) scale(${s})`}>
              <Clasp age={a} id={`ca${i}`} />
            </g>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
const Hero: React.FC = () => {
  // scale so the age-1 clasp (with its sleeve stubs) spans the frame width, centred on its measured box
  const s = 5.1;
  const cx = 540 - ((CLASP_BOX.x0 + CLASP_BOX.x1) / 2) * s;
  const top1 = 50, top2 = top1 + CLASP_SIZE.h * s + 70;
  return (
    <AbsoluteFill style={{background: BG}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(${cx} ${top1 - CLASP_BOX.y0 * s}) scale(${s})`}>
          <Clasp age={1} id="h1" />
        </g>
        <g transform={`translate(${cx} ${top2 - CLASP_BOX.y0 * s}) scale(${s})`}>
          <Clasp age={0} id="h0" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
const Mark: React.FC<{x: number; y: number; c: string}> = ({x, y, c}) => (
  <g>
    <circle cx={x} cy={y} r={4} fill={c} stroke="#000" strokeWidth={1} />
    <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={c} strokeWidth={1} />
    <line x1={x} y1={y - 8} x2={x} y2={y + 8} stroke={c} strokeWidth={1} />
  </g>
);
const Test: React.FC = () => {
  const variants = [
    {age: 0.6, astroAngle: 200, overAngle: -35, underAngle: 32, squeeze: 0},
    {age: 0.6, astroAngle: 200, overAngle: -35, underAngle: 32, squeeze: 1},
    {age: 0.9, astroAngle: 188, overAngle: -47, underAngle: 20, squeeze: 0.5},
    {age: 0.3, astroAngle: 212, overAngle: -23, underAngle: 44, squeeze: 0},
  ];
  return (
    <AbsoluteFill style={{background: BG}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform="translate(540 330) scale(3.2)">
          <rect x={CLASP_BOX.x0} y={CLASP_BOX.y0} width={CLASP_BOX.x1 - CLASP_BOX.x0} height={CLASP_BOX.y1 - CLASP_BOX.y0} fill="none" stroke="#C0392B" strokeWidth={0.6} strokeDasharray="3 3" />
          <Clasp age={0.5} id="t0" />
          <Mark x={CLASP_ATTACH.astroWrist.x} y={CLASP_ATTACH.astroWrist.y} c="#E00" />
          <Mark x={CLASP_ATTACH.overWrist.x} y={CLASP_ATTACH.overWrist.y} c="#00C" />
          <Mark x={CLASP_ATTACH.underWrist.x} y={CLASP_ATTACH.underWrist.y} c="#0A0" />
          <Mark x={0} y={0} c="#000" />
        </g>
        {variants.map((v, i) => {
          const at = claspAttach(v.astroAngle, v.overAngle, v.underAngle);
          return (
            <g key={i} transform={`translate(${i % 2 ? 790 : 290} ${i < 2 ? 960 : 1520}) scale(1.9)`}>
              <Clasp id={`tv${i}`} {...v} />
              <Mark x={at.astroWrist.x} y={at.astroWrist.y} c="#E00" />
              <Mark x={at.overWrist.x} y={at.overWrist.y} c="#00C" />
              <Mark x={at.underWrist.x} y={at.underWrist.y} c="#0A0" />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Zoom: React.FC = () => (
  <AbsoluteFill style={{background: BG}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform="translate(560 520) scale(9)"><Clasp age={1} id="z1" /></g>
      <g transform="translate(560 1450) scale(9)"><Clasp age={0.5} id="z5" /></g>
    </svg>
  </AbsoluteFill>
);
/** a single clasp on a flat background at a known placement, for measuring its pixel bounding box */
const Measure: React.FC<{age: number; stub?: number}> = ({age, stub}) => (
  <AbsoluteFill style={{background: '#FF00FF'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform="translate(540 960) scale(4)"><Clasp age={age} id="m" stub={stub} /></g>
    </svg>
  </AbsoluteFill>
);
const Root: React.FC = () => (
  <>
    <Composition id="ClaspAges" component={Ages} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="ClaspHero" component={Hero} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="ClaspTest" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="ClaspZoom" component={Zoom} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="ClaspMeasure" component={Measure} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{age: 1}} />
  </>
);
registerRoot(Root);
