// The lead's performance as a pure function of time. Hands hold the grips on the panel's back (hidden by the panel),
// except: his right hand reaching across to the panel at the start of the lift, the reach round the panel's left
// edge (the "floating" hand), and both arms coming back into view as the panel is lowered and carried aside.
import {clamp, easeInOut as eio, inv, lerp, lerpV, smooth, V} from './lib/math';
import {EXPR_NEUTRAL, Expr, mixExpr} from './art/Head';
import {HAND_RELAXED, HandPose, mixHand} from './art/Hand';
import {LeadPose} from './art/Lead';
import {CUE, DUR, loopT, PANEL, PanelState} from './world';

const GRIP_FIST: HandPose = {curl: [0.82, 0.86, 0.88, 0.9], spread: 0.15, thumb: 34, thumbCurl: 0.7};
const OPEN: HandPose = {curl: [0.08, 0.06, 0.1, 0.14], spread: 0.55, thumb: 36, thumbCurl: 0.15};
const HANG: V = {x: 404, y: 866};

export const grip = (p: PanelState, side: -1 | 1): V => ({x: p.cx + side * PANEL.gripX, y: p.top + PANEL.gripC});

// expressions: curious and a little playful at the start, a knowing look on "the entire time"
const EXPR_START: Expr = {...EXPR_NEUTRAL, browIn: 0.05, smile: 0.32, lid: 0.08, gx: 0, gy: 0.05, flush: 0.15};
const EXPR_CALM: Expr = {...EXPR_NEUTRAL, smile: 0.22, lid: 0.12};
const EXPR_KNOW: Expr = {...EXPR_NEUTRAL, smile: 0.62, lid: 0.3, squint: 0.18, browIn: 0, browDown: 0.12, gx: 0.12, gy: 0.02, flush: 0.2};

// where the right hand goes round the edge (world): wrist just beyond the panel's left edge, fingers up
export const reachWrist = (p: PanelState): V => ({x: p.cx - PANEL.w / 2 - 44, y: p.top + 300});

export const leadAt = (t: number, p: PanelState): LeadPose & {rOut: number} => {
  const tl = loopT(t);
  const gL = grip(p, -1), gR = grip(p, 1);

  // ---- right arm (screen-left)
  let rW: V, rAng: number, rView: 'back' | 'palm' = 'back', rTs: 1 | -1 = -1, rHand: HandPose;
  let rOut = 0;
  if (tl < CUE.lower0) {
    // lift: reach across to the panel's near grip (it is behind the panel by frame 0), then ride with it
    const k = eio(inv(-0.66, -0.16, tl));
    rW = lerpV(HANG, gL, k);
    rAng = lerp(92, 70, k);
    rHand = mixHand(HAND_RELAXED, GRIP_FIST, clamp(k * 1.4 - 0.2));
    // the reach round the edge
    if (tl > CUE.out0 - 0.7 && tl < CUE.back1 + 0.1) {
      const stage = {x: p.cx - PANEL.w / 2 + 34, y: p.top + 310}; // behind the panel, just inside the edge
      const out = reachWrist(p);
      const a = eio(inv(CUE.out0 - 0.7, CUE.out0, tl)); // grip -> staging (hidden)
      const b = eio(inv(CUE.out0, CUE.out1, tl)); // staging -> out
      const c = eio(inv(CUE.back0, CUE.back1, tl)); // back to the grip
      const outW = lerpV(lerpV(gL, stage, a), out, b);
      rW = lerpV(outW, gL, c);
      rOut = b * (1 - c);
      rAng = lerp(lerp(70, -88, a), -96, b);
      rView = a > 0.5 ? 'palm' : 'back';
      rTs = a > 0.5 ? 1 : -1;
      rHand = mixHand(mixHand(GRIP_FIST, OPEN, a), GRIP_FIST, c);
      // the floating hand: a small, deliberate finger ripple and a slight wrist turn
      const wv = inv(CUE.wave0, CUE.wave1, tl);
      if (wv > 0 && wv < 1) {
        const ph = wv * Math.PI * 2 * 1.5;
        const env = Math.sin(Math.PI * wv);
        rHand = {
          ...rHand,
          curl: rHand.curl.map((c0, i) => clamp(c0 + 0.85 * env * Math.max(0, Math.sin(ph - i * 0.7)))) as HandPose['curl'],
        };
        rAng += 12 * env * Math.sin(ph * 0.5);
      }
      // the hand settles as it arrives (a little overshoot), then floats almost still
      const s = tl - CUE.out1;
      if (s > 0) rW = {x: rW.x - 3 * Math.exp(-4 * s) * Math.sin(8 * s) * (1 - c), y: rW.y + 0.8 * Math.sin(s * 2.1) * (1 - c)};
    }
  } else {
    // lowering: with the grip, released as the panel is carried aside, then hanging relaxed
    const rel = eio(inv(CUE.aside0 + 0.02, CUE.aside0 + 0.55, tl));
    rW = lerpV(gL, HANG, rel);
    rAng = lerp(70, 92, rel);
    rHand = mixHand(GRIP_FIST, HAND_RELAXED, clamp(rel * 2));
  }

  // ---- left arm (screen-right): always on a grip behind the panel; it changes grip while hidden
  let lW: V;
  if (tl < CUE.lower0) lW = lerpV(gL, gR, smooth(inv(-0.25, 0.45, tl)));
  else lW = lerpV(gR, gL, smooth(inv(CUE.aside0, CUE.aside1, tl)));

  // ---- body: knees soften as the panel is loaded at the start of the lift and as it is set down
  const bob = 7 * Math.sin(Math.PI * clamp((tl + 0.75) / 1.0)) * (tl < 0.4 ? 1 : 0) + 4 * Math.sin(Math.PI * clamp((tl - CUE.lower0 - 0.4) / 1.2)) * (tl > CUE.lower0 ? 1 : 0);
  // idle life: slow breathing (loop-periodic: a whole number of breaths in the film) and a small weight shift
  const br = Math.sin((2 * Math.PI * 8 * t) / DUR);
  const sway = -4 * Math.sin(Math.PI * clamp((tl - CUE.aside0) / 1.3)) * (tl > CUE.aside0 ? 1 : 0) + 1.5 * Math.sin((2 * Math.PI * 3 * t) / DUR);

  // ---- face
  let expr = EXPR_START;
  if (tl > 3) expr = mixExpr(EXPR_START, EXPR_CALM, clamp((tl - 3) / 1));
  if (tl > CUE.smirk0 - 1.2) {
    expr = mixExpr(EXPR_CALM, EXPR_KNOW, eio(inv(CUE.smirk0, CUE.smirk0 + 0.35, tl)));
    expr = mixExpr(expr, EXPR_START, eio(inv(CUE.smirk1 - 0.05, DUR - 0.62, tl)));
  }
  const roll = 3 * eio(inv(CUE.smirk0, CUE.smirk0 + 0.4, tl)) * (1 - eio(inv(CUE.smirk1 - 0.05, DUR - 0.62, tl)));
  const blinkAt = [26.15, 10.5];
  const blink = blinkAt.reduce((b, at) => Math.max(b, clamp(1 - Math.abs(tl - at) / 0.07)), 0);

  return {
    bob: bob + 1.6 * br, sway, roll, turn: 0.04, expr, blink,
    R: {W: rW, ang: rAng, view: rView, ts: rTs, hand: rHand},
    L: {W: lW, ang: 70, view: 'back', ts: 1, hand: GRIP_FIST},
    rOut,
  };
};
