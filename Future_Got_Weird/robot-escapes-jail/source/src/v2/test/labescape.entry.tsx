// LB (LabEscape) tests.
//   cd source; npx remotion still src/v2/test/labescape.entry.tsx Still /tmp/claude-0/v2_labescape/x.png --props='{"t":6.8}' --log=error
//   npx remotion render src/v2/test/labescape.entry.tsx LB /tmp/claude-0/v2_labescape/lb.mp4 --log=error
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {resetIds} from '../../core/ids';
import {SHOTS2} from '../story2';
import {LB, lbState} from '../shots/LabEscape';
import {ChromeSurface} from '../liquid/Chrome';
import {LAB_HANDOFF, LabHandoffPuddle, LabWorld} from '../art/labset';

const FPS = 30;
const F0 = Math.round(SHOTS2.LB[0] * FPS); // 102
const F1 = Math.ceil(SHOTS2.LB[1] * FPS); // 411 (exclusive)

const Frame: React.FC<{t: number; label?: boolean}> = ({t, label}) => {
  resetIds(`lbx${Math.round(t * 300)}_`);
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <LB t={t} />
      {label && (
        <div style={{position: 'absolute', left: 14, bottom: 10, color: '#FFD84A', font: '700 54px monospace', textShadow: '0 0 6px #000'}}>
          {Math.round(t * FPS)} {t.toFixed(2)} {lbState(t).phase}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** the whole shot at its film times */
const Shot: React.FC<{label?: boolean}> = ({label}) => {
  const f = useCurrentFrame();
  return <Frame t={(F0 + f) / FPS} label={label} />;
};
/** one film time (props t) */
const Still: React.FC<{t: number; label?: boolean}> = ({t, label}) => <Frame t={t} label={label} />;
/** a part of the shot: [a, b) film seconds */
const Part: React.FC<{a: number; label?: boolean}> = ({a, label}) => {
  const f = useCurrentFrame();
  return <Frame t={Math.round(a * FPS) / FPS + f / FPS} label={label} />;
};

/** contact sheet of many film frames at phone size (cells 1080/cols) */
const Grid: React.FC<{fs: number[]; cols: number}> = ({fs, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame t={f / FPS} />
          <div style={{position: 'absolute', left: 12, top: 8, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
const SHEET_FS = Array.from({length: 36}, (_, i) => F0 + Math.round((i * (F1 - 1 - F0)) / 35));
const Sheet: React.FC = () => <Grid fs={SHEET_FS} cols={6} />;
/** boundary frames: H1 -> LB (102..109) and LB -> MS (402..410) */
const BOUND_FS = [102, 103, 104, 105, 106, 107, 108, 109, 110, 112, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410];
const Boundary: React.FC = () => <Grid fs={BOUND_FS} cols={5} />;
/** any frame list (props fs) */
const Frames: React.FC<{fs: number[]; cols: number}> = ({fs, cols}) => <Grid fs={fs} cols={cols} />;

/** contract references (film frame = composition frame): the plain engine ChromeSurface, and the labset hand-off frame
 *  exactly as MS is told to draw it (LabWorld at LAB_HANDOFF.cam, magnet LAB_HANDOFF.magnet, LabHandoffPuddle t) */
const RefSurface: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  resetIds(`rs${useCurrentFrame()}_`);
  return (
    <AbsoluteFill style={{background: '#0B1526'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}><ChromeSurface t={t} /></svg>
    </AbsoluteFill>
  );
};
const RefHandoff: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  resetIds(`rh${useCurrentFrame()}_`);
  return (
    <AbsoluteFill style={{background: '#0B1526'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <LabWorld cam={LAB_HANDOFF.cam} t={t} magnet={LAB_HANDOFF.magnet} body={(p) => p === 'front' && <LabHandoffPuddle t={t} />} />
      </svg>
    </AbsoluteFill>
  );
};

/** caption-band guide: the default caption band (y 250-420, x 110-870) and a low alternative (y 1480-1650) over many
 *  film frames at phone size (props fs) */
const CapGrid: React.FC<{fs: number[]; cols: number}> = ({fs, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame t={f / FPS} />
          <div style={{position: 'absolute', left: 110, top: 250, width: 760, height: 170, border: '6px solid #FFD84A', background: 'rgba(255,216,74,0.18)'}} />
          <div style={{position: 'absolute', left: 110, top: 1480, width: 760, height: 170, border: '6px dashed #7CF', background: 'rgba(120,200,255,0.15)'}} />
          <div style={{position: 'absolute', left: 12, top: 8, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{(f / FPS).toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <>
    <Composition id="LB" component={Shot as React.FC} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{label: false} as never} />
    <Composition id="LBlabel" component={Shot as React.FC} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{label: true} as never} />
    <Composition id="Still" component={Still as React.FC} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 6.8} as never} />
    <Composition id="Part" component={Part as React.FC} durationInFrames={90} fps={FPS} width={1080} height={1920} defaultProps={{a: 6.2} as never} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={Math.ceil(36 / 6) * 320} />
    <Composition id="Boundary" component={Boundary} durationInFrames={1} fps={FPS} width={1080} height={4 * 384} />
    <Composition id="RefSurface" component={RefSurface} durationInFrames={420} fps={FPS} width={1080} height={1920} />
    <Composition id="RefHandoff" component={RefHandoff} durationInFrames={420} fps={FPS} width={1080} height={1920} />
    <Composition id="CapGuide" component={CapGrid as React.FC} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [102], cols: 6} as never} />
    <Composition id="Frames" component={Frames as React.FC} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [102], cols: 6} as never} />
  </>
));
