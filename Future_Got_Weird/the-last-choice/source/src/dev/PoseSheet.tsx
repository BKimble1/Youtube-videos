// Rig check: action poses, contacts and injury decals.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Actor, Cast, ActorProps, Damage} from '../rig/actor';
import {CAST} from '../rig/looks';
import {walker, lying} from '../rig/poses';
import {WALK, RUN, HURRY} from '../rig/gait';
import {C, F} from '../theme';
import {HandCU} from '../rig/HandCU';

const hurt: Damage = {
  browCut: {side: 1, amt: 1}, noseBleed: 0.8, bruise: {side: -1, amt: 0.8}, dirt: 0.8, cracked: true,
  stains: [{phi: 30, h: 60, size: 16}, {phi: -40, h: 20, size: 10, kind: 'tear'}],
  decals: [{limb: 'armR0', u: 0.5, kind: 'tear', size: 1.2}, {limb: 'legL1', u: 0.3, kind: 'tear'}, {limb: 'armL1', u: 0.4, kind: 'scrape'}],
  handBlood: {R: 0.9},
};
export const PoseSheet: React.FC<{page: number}> = ({page}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const G = 470, G2 = 1000;
  const lab = (x: number, y: number, s: string) => <text x={x} y={y} textAnchor="middle" fontFamily={F.body} fontSize={20} fill={C.inkSoft}>{s}</text>;
  if (page === 0) {
    const w1 = walker(CAST.clerkC, {x0: 80, dist: 140 + 30, dir: 1, ground: G, gait: WALK}, {t, s: 0.9});
    const w2 = walker(CAST.honest, {x0: 420, dist: 160, dir: 1, ground: G, gait: RUN}, {t, s: 0.9, face: {mouth: 'grit', brows: -0.6}});
    const w3 = walker(CAST.clerkB, {x0: 820, dist: 80, dir: -1, ground: G, gait: {...HURRY, limp: {side: 'L', amt: 1}}}, {t, s: 0.9, yaw: -55, face: {mouth: 'pain', brows: -0.3, worry: 0.6}});
    const crouch: ActorProps = {look: CAST.clerkA, t, x: 1100, y: G, s: 0.9, yaw: 70, drop: 70, lean: 38,
      legL: {foot: {x: 1060, y: G - 9}}, legR: {foot: {x: 1150, y: G - 9}}, armR: {hand: {x: 1210, y: G - 40, z: 30}}, armL: {hand: {x: 1185, y: G - 70, z: -20}}, face: {mouth: 'flat', lookY: 0.6}};
    const kneel: ActorProps = {look: CAST.checker, t, x: 1420, y: G, s: 0.9, yaw: -70, drop: 78, lean: 8,
      legL: {foot: {x: 1350, y: G - 9}}, legR: {foot: {x: 1470, y: G - 6}, pole: {x: -1, y: 0.4, z: 0}}, armR: {hand: {x: 1380, y: G - 190}}, face: {mouth: 'sad', worry: 0.7}, dmg: {sling: 'L', cracked: true, browCut: {side: -1, amt: 0.7}}};
    const pull: ActorProps = {look: CAST.clerkC, t, x: 1760, y: G, s: 0.9, yaw: -80, lean: -18, drop: 30,
      legL: {foot: {x: 1700, y: G - 9}}, legR: {foot: {x: 1800, y: G - 9}}, armL: {hand: {x: 1640, y: G - 230}}, armR: {hand: {x: 1635, y: G - 215}}, face: {mouth: 'grit', brows: -0.8}, dmg: {handBlood: {L: 1}}};
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: C.paper}}>
        <line x1={0} y1={G} x2={1920} y2={G} stroke={C.inkMuted} strokeWidth={2} />
        {[w1, w2, w3, crouch, kneel, pull].map((p, i) => <Actor key={i} {...p} seed={i + 2} />)}
        {lab(250, G + 30, 'walk')}{lab(580, G + 30, 'run')}{lab(820, G + 30, 'limp (hurry)')}{lab(1100, G + 30, 'crouch reach')}{lab(1420, G + 30, 'kneel + sling')}{lab(1720, G + 30, 'pull')}
        <line x1={0} y1={G2} x2={1920} y2={G2} stroke={C.inkMuted} strokeWidth={2} />
        {/* lying on a bed (side view) */}
        <rect x={60} y={G2 - 150} width={520} height={30} rx={8} fill="#DDD6C6" stroke={C.ink} strokeWidth={4} />
        <Actor {...lying(CAST.clerkA, 300, G2 - 150, -1, {t, s: 0.85, face: {closed: true, mouth: 'soft'}, dmg: {stains: [{phi: 20, h: 50, size: 22}, {phi: -20, h: 20, size: 14}], browCut: {side: 1, amt: 1}, pale: 0.6}})} />
        {lab(320, G2 + 30, 'lying (roll)')}
        {/* injured close-ish */}
        <Actor look={CAST.checker} t={t} x={850} y={G2} s={1.0} yaw={20} dmg={hurt} face={{mouth: 'pant', brows: -0.2, worry: 0.8, lids: 0.3}} breath={0.9} armR={{fk: {fwd: 40, out: 10, bend: 90}}} />
        {lab(850, G2 + 30, 'damage set')}
        {/* support pair: teammate's arm over the Director's shoulders */}
        <Cast actors={[
          {look: CAST.checker, t, x: 1330, y: G2, s: 0.95, yaw: 30, side: 6, z: 0.05, armL: {hand: {x: 1488, y: G2 - 292, z: 12}}, zArm: [-160, undefined], zHand: [90, undefined], legR: {foot: {x: 1350, y: G2 - 22}}, face: {mouth: 'pain', lids: 0.35, worry: 0.8}, dmg: {browCut: {side: 1, amt: 1}, cracked: true}},
          {look: CAST.clerkC, t, x: 1450, y: G2, s: 0.95, yaw: 30, side: -4, z: 0, armR: {hand: {x: 1300, y: G2 - 175, z: -10}}, zArm: [undefined, 60], face: {mouth: 'grit', brows: -0.4}},
        ]} />
        {lab(1400, G2 + 30, 'support pair')}
      </svg>
    );
  }
  if (page === 1) {
    const sk = CAST.checker.skin, sk2 = CAST.clerkC.skin, sk3 = CAST.clerkA.skin;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#3a3036'}}>
        <HandCU x={140} y={250} rot={-10} s={1.4} skin={sk} sleeve={C.coral} cuffTorn view="back" curl={0.15} spread={0.6} scrape={1} dirt={1} />
        <HandCU x={620} y={250} rot={-10} s={1.4} skin={sk} sleeve={C.coral} cuffTorn view="back" curl={0.7} spread={0.2} scrape={1} />
        {/* lever grip (side view) */}
        <g><rect x={1250} y={60} width={34} height={420} rx={14} fill="#B8402E" stroke={C.ink} strokeWidth={5} /></g>
        <HandCU x={1080} y={250} rot={-8} s={1.4} skin={sk3} sleeve={C.teal} view="side" curl={0.95} thumb={0.9} />
        {/* clasp: two hands */}
        <HandCU x={140} y={760} rot={8} s={1.5} skin={sk2} sleeve={C.saffron} view="side" side="R" curl={0.75} thumb={0.6} blood={0.9} />
        <HandCU x={760} y={800} rot={190} s={1.5} skin={sk3} sleeve={C.teal} view="side" side="L" curl={0.3} thumb={0.2} blood={1} />
        {/* flat on glass */}
        <HandCU x={1250} y={900} rot={-90} s={1.5} skin={sk2} sleeve={C.saffron} view="back" curl={0} spread={0.9} flatten={1} />
      </svg>
    );
  }
  return null;
};
