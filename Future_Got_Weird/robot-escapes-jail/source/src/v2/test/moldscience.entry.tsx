// MS (MoldScience) tests.
//   cd source; npx remotion still src/v2/test/moldscience.entry.tsx Still /tmp/claude-0/v2_moldscience/x.png --props='{"t":15.8}' --log=error
//   npx remotion render src/v2/test/moldscience.entry.tsx MS /tmp/claude-0/v2_moldscience/ms.mp4 --log=error
// Compositions run on the FILM frame grid (what Film2 renders): film frame n -> t = n / 30. MS owns film frames 411..676
// (13.70 .. 22.533 s): composition frame f = film frame 411 + f.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import '../../fonts';
import {resetIds} from '../../core/ids';
import {SHOTS2} from '../story2';
import {LabPart, MS, msLab, msMicro, T_SURF} from '../shots/MoldScience';
import {MicroMatrix, MC} from '../art/micro';
import {ChromeSurface} from '../liquid/Chrome';
import {LB} from '../shots/LabEscape';
import {HandoffBlob} from '../liquid/Chrome';
import {C} from '../../art/palette';

const FPS = 30;
const F0 = Math.ceil(SHOTS2.MS[0] * FPS - 1e-6); // 411 (13.700 s)
const F1 = Math.ceil(SHOTS2.MS[1] * FPS - 1e-6); // 677 (exclusive: 22.567 s is FU)

/** one film frame: LB before 13.67, MS inside, the FU-side reference (navy1 + HandoffBlob) after 22.56 */
const Frame: React.FC<{t: number; label?: boolean}> = ({t, label}) => {
  resetIds(`msx${Math.round(t * 300)}_`);
  let body: React.ReactNode;
  if (t < SHOTS2.MS[0]) body = <LB t={t} />;
  else if (t < SHOTS2.MS[1]) body = <MS t={t} />;
  else
    body = (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={C.navy1} />
        <HandoffBlob t={t} />
      </svg>
    );
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      {body}
      {label && (
        <div style={{position: 'absolute', left: 14, bottom: 10, color: '#FFD84A', font: '700 50px monospace', textShadow: '0 0 6px #000'}}>
          {Math.round(t * FPS)} {t.toFixed(3)} {t < T_SURF ? `draw ${msLab(t).draw.toFixed(2)}` : `Z ${msMicro(t).Z.toFixed(2)}`}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Shot: React.FC<{label?: boolean}> = ({label}) => {
  const f = useCurrentFrame();
  return <Frame t={(F0 + f) / FPS} label={label} />;
};
const Still: React.FC<{t: number; label?: boolean}> = ({t, label}) => <Frame t={t} label={label} />;
/** 90 film frames from film time a */
const Part: React.FC<{a: number; label?: boolean}> = ({a, label}) => {
  const f = useCurrentFrame();
  return <Frame t={(Math.round(a * FPS) + f) / FPS} label={label} />;
};
/** a contact sheet of film frames at phone-ish size (cells 1080/cols wide) */
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
const SHEET_FS = Array.from({length: 48}, (_, i) => F0 + Math.round((i * (F1 - 1 - F0)) / 47));
const Sheet: React.FC = () => <Grid fs={SHEET_FS} cols={8} />;
/** boundary frames: LB -> MS (405..420) and MS -> FU (667..680; 677+ = the FU-side reference) */
const BOUND_FS = [405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678];
const Boundary: React.FC = () => <Grid fs={BOUND_FS} cols={7} />;
const Frames: React.FC<{fs: number[]; cols: number}> = ({fs, cols}) => <Grid fs={fs} cols={cols} />;

/** contract checks: (a) MS's own lab composition vs the exact LabWorld hand-off frame at the same t (kind 'own'),
 *  (b) MicroMatrix at Z = 1 vs the engine ChromeSurface (kinds 'matrix' / 'surface') */
const Check: React.FC<{t: number; kind: 'own' | 'matrix' | 'surface' | 'blob' | 'ms'}> = ({t, kind}) => {
  resetIds(`chk${kind}_`);
  return (
    <AbsoluteFill style={{background: '#0B1526'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {kind === 'own' ? <LabPart t={t} /> : kind === 'matrix' ? <MicroMatrix t={t} view={{Z: 1, F: MC}} front={1e6} /> : kind === 'blob' ? (
          <>
            <rect width={1080} height={1920} fill={C.navy1} />
            <HandoffBlob t={t} />
          </>
        ) : kind === 'surface' ? <ChromeSurface t={t} /> : null}
      </svg>
      {kind === 'ms' && <MS t={t} />}
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <>
    <Composition id="MS" component={Shot as React.FC} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{label: false} as never} />
    <Composition id="MSlabel" component={Shot as React.FC} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{label: true} as never} />
    <Composition id="Still" component={Still as React.FC} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 15.8} as never} />
    <Composition id="Part" component={Part as React.FC} durationInFrames={90} fps={FPS} width={1080} height={1920} defaultProps={{a: 13.6} as never} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={6 * 240} />
    <Composition id="Boundary" component={Boundary} durationInFrames={1} fps={FPS} width={1080} height={4 * 274} />
    <Composition id="Check" component={Check as React.FC} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 13.8, kind: 'own'} as never} />
    <Composition id="Frames" component={Frames as React.FC} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [411], cols: 6} as never} />
  </>
));
