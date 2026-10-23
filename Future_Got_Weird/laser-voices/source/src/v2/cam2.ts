// V2 camera and level matrices (kept free of fonts/DOM so node checks can import it).
import {Pt, P, Cam, mmul, T, S, R, apply, Mat, keyCam, camFlow, FlowKey, clamp, inv, lerp} from './lib2';
import {DUR, pp, figXf, LEAD_FEET, beamAt, GROUND_U, w, EXIT} from './world2';
import {txToL0, TX_K} from './Transmitter';
import {NECK, EAR_OPEN} from './art/LeadHead';
import {leadPose, leadBody, clerkFeet} from './story2';
import {MECH} from './Mechanism2';

// ---- level matrices ----
export const leadXf = figXf(LEAD_FEET);
export const headMat = (t: number): Mat => {
  const b = leadBody(t), p = leadPose(t);
  return mmul(mmul(T(leadXf.x, leadXf.y), S(leadXf.k)), mmul(R(b.lean, P(0, GROUND_U)), R(p.tilt, NECK)));
};
export const headToL0 = (q: Pt, t: number) => apply(headMat(t), q);

// ---- overlay timing ----
export const OV = {
  hookPath: [0.8, 1.15, 3.6, 3.95],
  travel: [15.0, 15.3, 16.3, 16.7], // path while travelling ear -> transmitter
  follow: [17.45, 17.75, 19.6, 20.05], // path while following the outgoing beam back to the listener
  cross: [w(79) - 0.1, w(79) + 0.3, 33.1, 33.6], // "...the laser" -> after the return
  dimDraw: [21.74, 22.53], dimOut: [23.12, 23.67],
  open: [16.0, 16.5], close: [22.28, 23.0], sweep: [16.06, 16.6, 19.9, 20.4],
};
export const win = (t: number, a: number[]) => clamp(Math.min(inv(a[0], a[1], t), 1 - inv(a[2], a[3], t)));

// ---- camera ----
export const Lk = (p: Pt, sx: number, sy: number, z: number) => keyCam(p, sx, sy, z, 1);
export const camAt = (t: number): Cam => {
  const hz = leadXf.k; // L0 px per head unit
  const H = (q: Pt, sx: number, sy: number, zl: number) => keyCam(headToL0(q, t), sx, sy, zl, hz);
  const tx = (q: Pt, sx: number, sy: number, zl: number) => keyCam(txToL0(q), sx, sy, zl, TX_K);
  const mid = pp(beamAt(0.5));
  // anchors in L0 (derived from the plan, so the framings follow the projection)
  const LE = P(leadXf.x, leadXf.y); // the lead's near eye
  const ce = figXf(clerkFeet(0)), CE = P(ce.x, ce.y); // the clerk's eye at the start
  const EX = pp(EXIT);
  const CL = figXf(clerkFeet(32.05)).x - 70; // left edge that keeps her in frame as she clears the path
  const fit = (x0: number, x1: number) => 1080 / (x1 - x0); // zoom that fits an L0 span across the frame
  const keys: FlowKey[] = [
    // A: already reacting; his face and ear large, her face at the right edge; ease out to the two-shot, then
    // down-left to bring in the laser head on its cart
    [0, Lk(P(lerp(LE.x - 60, CE.x + 10, 0.5), LE.y + 16), 540, 820, fit(LE.x - 60, CE.x + 10))],
    [0.9, Lk(P(lerp(LE.x - 64, CE.x + 30, 0.5), LE.y + 22), 540, 822, fit(LE.x - 64, CE.x + 30))],
    [2.7, Lk(P(lerp(LE.x, CE.x, 0.5), LE.y + 70), 540, 860, fit(LE.x - 150, CE.x + 120))],
    [4.1, Lk(P(lerp(EX.x + 10, LE.x + 70, 0.5), LE.y + 110), 540, 880, fit(EX.x + 10, LE.x + 70))],
    // B: to the exposed ear
    [6.2, H(EAR_OPEN, 470, 820, 4.2)],
    [8.85, H(EAR_OPEN, 490, 820, 5.2)],
    // C: into the air beside it, tracking the packet, the absorber, the expansion and the fronts to the opening
    [9.95, H(MECH.anchor, 470, 860, 12)],
    [10.82, H(MECH.anchor, 540, 820, 34)],
    [11.7, H(MECH.anchor, 540, 820, 30)],
    [12.6, H(MECH.anchor, 560, 860, 13)],
    [13.5, H(P(-196, 80), 500, 860, 11.5)],
    [14.75, H(P(-168, 58), 600, 860, 10.5)],
    // D: out by the ear, along the path to the laser head, into its section, then back out along the beam to the
    // listener, and out to the compact source + listener view (8 FT)
    [15.25, H(EAR_OPEN, 560, 800, 3.4)],
    [15.7, Lk(pp(beamAt(0.42)), 540, 820, 3.0)],
    [16.15, tx(P(-140, 40), 540, 760, 2.05)],
    [17.55, tx(P(-140, 40), 540, 760, 2.25)],
    [18.3, Lk(pp(beamAt(0.5)), 540, 820, 2.7)],
    [19.4, H(EAR_OPEN, 520, 800, 3.0)],
    [20.6, Lk(P(lerp(EX.x - 30, LE.x + 120, 0.5), LE.y + 150), 540, 880, fit(EX.x - 30, LE.x + 120))],
    [22.9, Lk(P(lerp(EX.x - 24, LE.x + 114, 0.5), LE.y + 146), 540, 880, fit(EX.x - 24, LE.x + 114))],
    // E: the tighter three-quarter demonstration: source edge, the crossing, the listener's face
    [24.3, Lk(P(lerp(EX.x, LE.x, 0.5) + 10, LE.y + 115), 540, 860, fit(EX.x - 40, LE.x + 90))],
    [27.1, Lk(P(lerp(EX.x + 50, LE.x + 70, 0.5), LE.y + 92), 540, 860, fit(EX.x + 50, LE.x + 70))],
    [29.6, Lk(P(lerp(CL + 8, LE.x + 66, 0.5), LE.y + 70), 540, 860, fit(CL + 8, LE.x + 66))],
    [32.05, Lk(P(lerp(CL, LE.x + 62, 0.5), LE.y + 64), 540, 860, fit(CL, LE.x + 62))],
    // F: once she has cleared, push back into the opening face/ear framing (she walks on out of frame, left)
    [33.5, Lk(P(LE.x + 20, LE.y + 20), 540, 820, fit(LE.x - 110, LE.x + 130))],
    [DUR, Lk(P(LE.x + 22, LE.y + 22), 540, 820, fit(LE.x - 104, LE.x + 124))],
  ];
  return camFlow(t, keys);
};

