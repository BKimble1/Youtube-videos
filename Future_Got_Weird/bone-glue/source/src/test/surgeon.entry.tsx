import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer} from '../camera';
import {C1, C2, C3, jag, skinBorders, INCISION, fingerChain, FINGERS, thumbChain} from '../art/anatomy';
import {closed, open, pt, P} from '../core/geo';
import {C} from '../art/palette';
import {Applicator, AppState, Clamp, ClampState} from '../art/instruments';

const APP0: AppState = {tip: pt(-5.0, 0.8), ang: -0.42, press: 0.35, gel: 1};
const CL0: ClampState = {a: pt(11.5, -6.0), b: pt(10.8, 14.0), open: 0, lift: 0};

const PlaceholderBone: React.FC = () => (
  <g>
    <rect x={-14} y={-60} width={27} height={140} fill={C.bone} />
    {[C1, C2, C3].map((c, i) => (
      <path key={i} d={open(jag(c), 0)} fill="none" stroke="#3A1A12" strokeWidth={0.5} />
    ))}
  </g>
);

const PlaceholderArm: React.FC = () => {
  const L: P[] = [], R: P[] = [];
  for (let y = 400; y >= -70; y -= 10) {
    const [l, r] = skinBorders(y);
    L.push(pt(l, y));
    R.push(pt(r, y));
  }
  const outline = [...R.reverse(), ...L.reverse()];
  return (
    <g>
      <path d={closed(outline, 0.6)} fill={C.skin} stroke="#172B3A" strokeWidth={1} />
      {FINGERS.map((d, i) => {
        const ch = fingerChain(d, 0.25);
        return <path key={i} d={open([d.base, ...ch], 0.8)} fill="none" stroke={C.skin} strokeWidth={d.w * 2.2} strokeLinecap="round" />;
      })}
      <path d={open(thumbChain(0.2), 0.8)} fill="none" stroke={C.skin} strokeWidth={17} strokeLinecap="round" />
      <ellipse cx={INCISION.c.x} cy={INCISION.c.y} rx={INCISION.rx} ry={INCISION.ry} fill="#5A0A16" />
      <g transform="translate(0 0)">
        <PlaceholderBone />
      </g>
    </g>
  );
};

const Frame: React.FC<{c: Cam; app: AppState; cl: ClampState; id: string}> = ({c, app, cl, id}) => (
  <AbsoluteFill style={{background: '#20303a', overflow: 'hidden'}}>
    <Layer c={c} z={40}>
      <rect x={-900} y={-900} width={1800} height={2100} fill={C.drape} />
    </Layer>
    <Layer c={c} z={0}>
      <PlaceholderArm />
    </Layer>
    <Layer c={c} z={-6}>
      <Clamp id={`${id}-cl`} s={cl} />
      <Applicator id={`${id}-ap`} s={app} />
    </Layer>
  </AbsoluteFill>
);

const CAMS: Record<string, Cam> = {
  a: {x: -1, y: -1, w: 30, k: 1, focus: -6},
  b: {x: 20, y: -30, w: 120, k: 0.95},
  B: {x: 110, y: -80, w: 470, k: 0.86},
  t: {x: 40, y: 10, w: 160, k: 1, focus: -6},
};

const Test: React.FC<{st: string}> = ({st}) => {
  if (st === 'sheet') {
    const ks = Object.keys(CAMS);
    return (
      <AbsoluteFill style={{background: '#111'}}>
        {ks.map((k, i) => (
          <div key={k} style={{position: 'absolute', left: (i % 2) * 540, top: Math.floor(i / 2) * 960, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
            <Frame c={CAMS[k]} app={APP0} cl={CL0} id={`f${k}`} />
          </div>
        ))}
      </AbsoluteFill>
    );
  }
  return <Frame c={CAMS[st]} app={APP0} cl={CL0} id="f0" />;
};

registerRoot(() => <Composition id="Surgeon" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{st: 'sheet'}} />);
