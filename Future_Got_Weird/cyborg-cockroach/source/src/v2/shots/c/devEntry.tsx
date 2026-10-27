// Group C dev entry (not part of the film): a contact sheet of the observer's feed at any frames, including the C4
// range the film shows only on group A's monitor. From source/:
//   npx remotion still src/v2/shots/c/devEntry.tsx FeedSheetC out.png --props='{"fs":[430,445,465]}'
import React from 'react';
import {registerRoot, Composition, Still, AbsoluteFill} from 'remotion';
import {C3Feed} from './Feed';

const FeedSheetC: React.FC<{fs: number[]; w: number; h: number}> = ({fs, w, h}) => {
  const cols = 4, k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: w, height: h, transform: `scale(${(1080 * k) / w})`, transformOrigin: '0 0'}}>
          <C3Feed f={f} w={w} h={h} id={`dv${f}`} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90 * (w / 1080), color: '#FF0', fontFamily: 'monospace'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <>
    <Still id="FeedSheetC" component={FeedSheetC} width={1080} height={1920} defaultProps={{fs: [372, 400, 430, 465], w: 1080, h: 1920}} />
    <Composition id="FeedC" component={() => null} durationInFrames={1} fps={30} width={64} height={64} />
  </>
);
registerRoot(Root);
