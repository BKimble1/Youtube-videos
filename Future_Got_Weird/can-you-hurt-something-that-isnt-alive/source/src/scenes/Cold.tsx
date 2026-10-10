import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Paper, Card, Tag, Line, Sweep, Mark, Dashed} from '../components/Scenic';
import {Monitor, ScreenFace, Covering} from '../components/Monitor';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {C, F} from '../theme';
import {T, TE, frames} from '../lib/narration';
import {easeOut, clamp01} from '../lib/anim';
import {poseTrack, P} from '../lib/poses';

// Cold open: 0 to 30.0 s. The thumbnail's premise in motion, then the real policy text and its scope.
export const ColdOpen: React.FC = () => {
  const f = useCurrentFrame();
  const at = (s: number) => frames(s);
  const peel = clamp01((f - at(0.5)) / (at(3.2) - at(0.5)));
  const monitorOut = clamp01((f - at(3.4)) / 18);
  const policyIn = easeOut(clamp01((f - at(4.0)) / 22));
  const scopeIn = easeOut(clamp01((f - at(17.4)) / 20));
  const splitIn = easeOut(clamp01((f - at(24.0)) / 18));
  const dateIn = easeOut(clamp01((f - at(T('On October'))) / 14));
  const sweep1 = clamp01((f - at(T('sustained'))) / (at(TE('behavior')) - at(T('sustained'))));
  const sweep2 = clamp01((f - at(T('does not cover'))) / (at(TE('research.')) - at(T('does not cover'))));
  const xMark = easeOut(clamp01((f - at(T("It doesn't tell"))) / 14));

  const reach = poseTrack(f, [
    [0, P({})],
    [at(0.5), P({armR: {a: 70, b: -6}, lookX: 0.9, brows: 0.4})],
    [at(3.0), P({armR: {a: 62, b: -10}, lookX: 0.6, brows: 0.6})],
    [at(3.6), P({armR: {a: 18, b: 40}, lookX: 0, brows: 1, mouth: 'o'})],
    [at(5.0), P({armR: {a: 14, b: 22}, mouth: 'smile'})],
  ]);

  return (
    <Paper>
      {/* the prop: monitor with the illustrated face under the binary covering */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - monitorOut}}>
        <Monitor x={960} y={190} w={760} h={520}>
          <ScreenFace w={708} h={466} sad={1} />
          <Covering peel={peel} w={708} h={466} />
        </Monitor>
        <Tag x={1000} y={760} size={26} bg={C.cream}>ILLUSTRATION: a metaphor, not a recording</Tag>
      </div>
      <Character look={CAST.checker} pose={reach} frame={f} x={470} y={900} scale={1.05} seed={3} />

      {/* the policy excerpt: verbatim from the company page, one highlight at a time */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: policyIn * (1 - splitIn)}}>
        <Card x={700} y={170} w={1060} h={400} bg={C.white} style={{padding: 36}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: F.mono, fontSize: 26, color: C.inkSoft}}>
            <span>anthropic.com · Usage Policy update</span>
          </div>
          <div style={{marginTop: 26, fontFamily: F.serif, fontSize: 44, lineHeight: 1.3, color: C.ink}}>
            “We’ve added a prohibition on <Sweep p={sweep1}>sustained and needless abusive or cruel behavior toward our models.</Sweep>”
          </div>
        </Card>
        <Tag x={1480} y={130} bg={C.saffron} size={30} opacity={dateIn}>Oct 8, 2026</Tag>
        <Tag x={700} y={600} bg={C.teal} fg={C.white} size={30} opacity={dateIn}>Takes effect Nov 12, 2026</Tag>
      </div>

      {/* scope: the exclusions, which narrow the claim */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: scopeIn * (1 - splitIn)}}>
        <Card x={700} y={650} w={1060} h={220} bg={C.cream} style={{padding: 30}}>
          <div style={{fontFamily: F.serif, fontSize: 36, lineHeight: 1.3}}>
            “It does not apply to common versions of user <Sweep p={sweep2} color={C.tealLight}>frustration, pushback, dark creative themes, or model testing and research.</Sweep>”
          </div>
        </Card>
      </div>

      {/* the first answer: what the rule says versus what it cannot say */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: splitIn}}>
        <Line x={700} y={300} w={1000} size={60} style={{fontFamily: F.display, fontWeight: 700}}>
          A rule tells us what a company wants.
        </Line>
        <Line x={700} y={390} w={1000} size={60} style={{fontFamily: F.display, fontWeight: 700, color: C.coralDeep}}>
          It doesn’t tell us if anything is felt.
        </Line>
        <Mark ok={false} x={1460} y={440} size={96} opacity={xMark} scale={0.6 + 0.4 * xMark} />
      </div>
    </Paper>
  );
};
