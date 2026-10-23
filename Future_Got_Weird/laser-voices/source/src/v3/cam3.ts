// V3 camera and level matrices (kept free of fonts/DOM so node checks can import it).
// One authored camera over the fixed projection (log-zoom dives between keyed framings, continuous speed through
// keys). The key list is wrapped around the loop seam (a key before 0 equal to the key before DUR, a key after DUR
// equal to the key after 0), so the last frame and frame 0 share position, zoom and velocity.
import {Pt, P, Cam, mmul, T, S, R, apply, Mat, keyCam, camFlow, FlowKey, clamp, inv, lerp} from './lib3';
import {DUR, pp, figXf, LEAD_FEET, beamAt, GROUND_U, EXIT, EAR, v3} from './world3';
import {loc, MIRROR} from './Transmitter';
import {NECK, EAR_OPEN} from './art/LeadHead';
import {neckShift} from './art/LeadFigure';
import {leadPose, leadBody, clerkFeet} from './story3';
import {absorberAt} from './Mechanism3';

// ---- level matrices ----
export const leadXf = figXf(LEAD_FEET);
export const headMat = (t: number): Mat => {
  const b = leadBody(t), p = leadPose(t);
  return mmul(mmul(T(leadXf.x, leadXf.y), S(leadXf.k)), mmul(R(b.lean, P(0, GROUND_U)), mmul(T(neckShift(b), 0), R(p.tilt, NECK))));
};
export const headToL0 = (q: Pt, t: number) => apply(headMat(t), q);
// the incoming path's direction in head coordinates (deg), for the mechanism
export const pathDirHead = (t: number) => {
  const m = headMat(t), a = pp(EXIT), b = pp(EAR);
  const rot = Math.atan2(m[1], m[0]);
  return ((Math.atan2(b.y - a.y, b.x - a.x) - rot) * 180) / Math.PI;
};

// ---- overlay timing ----
export const OV = {
  path: [8.85, 9.25, 33.0, 33.6], // the illustrative infrared path: from the explanation to the final push
  pathDim: [10.9, 11.3, 14.2, 14.7], // fainter while the packet itself is followed
  open: [15.96, 16.45], close: [22.28, 23.0], sweep: [16.06, 16.6, 20.0, 20.45],
  wave: [17.85, 18.3, 20.35, 20.8], region: [18.55, 18.95, 23.2, 23.7],
  dimDraw: [21.74, 22.53], dimOut: [23.12, 23.67],
};
export const win = (t: number, a: number[]) => clamp(Math.min(inv(a[0], a[1], t), 1 - inv(a[2], a[3], t)));

// ---- camera ----
export const Lk = (p: Pt, sx: number, sy: number, z: number) => keyCam(p, sx, sy, z, 1);
const fit = (x0: number, x1: number) => 1080 / (x1 - x0);
export const camAt = (t: number): Cam => {
  const hz = leadXf.k; // L0 px per head unit
  const H = (q: Pt, sx: number, sy: number, zl: number) => keyCam(headToL0(q, t), sx, sy, zl, hz);
  const LE = P(leadXf.x, leadXf.y); // the lead's near eye (L0)
  const ce = figXf(clerkFeet(0)), CE = P(ce.x, ce.y);
  const EX = pp(EXIT), EA = pp(EAR), MI = pp(loc(MIRROR.al, MIRROR.si, MIRROR.y));
  const TGT = absorberAt(pathDirHead(t));
  const MID = P((TGT.x + EAR_OPEN.x) / 2, (TGT.y + EAR_OPEN.y) / 2);
  // framings
  const CU0 = H(EAR_OPEN, 382, 905, 2.1); // frame 0 / the end: face and exposed ear
  const CUpre = H(EAR_OPEN, 420, 900, 2.06); // a beat before the seam (same drift direction)
  const CUpost = H(EAR_OPEN, 330, 910, 2.0); // a beat after frame 0
  // a framing that fits a set of L0 points inside the picture area above the caption band (screen y 150..1380)
  const box = (pts: Pt[], pad = 50): Cam => {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    const zz = Math.min(1080 / (x1 - x0), 1230 / (y1 - y0));
    return Lk(P((x0 + x1) / 2, (y0 + y1) / 2), 540, 765, zz);
  };
  const leadHead = [headToL0(P(-60, -400), t), headToL0(P(140, 240), t), headToL0(P(-270, 60), t)];
  const herAt = (tt: number) => {
    const f = figXf(clerkFeet(tt));
    return {top: P(f.x + 100 * f.k, f.y - 470 * f.k), face: P(f.x - 170 * f.k, f.y), chest: P(f.x, f.y + 560 * f.k), cup: P(f.x - 300 * f.k, f.y + 760 * f.k), feet: P(f.x, f.y + 1660 * f.k)};
  };
  const h0 = herAt(0), hW = herAt(22.0);
  const EXT = pp(v3(EXIT.x, EXIT.y + 0.12, EXIT.z - 0.3)), BENCH = pp(v3(EXIT.x + 0.3, 0.86, EXIT.z + 0.04));
  const LF = pp(LEAD_FEET);
  const TWO = box([...leadHead, h0.top, h0.face, h0.chest], 30); // the two of them, upper bodies
  const GEO = box([...leadHead, h0.top, h0.cup, EXT], 40); // + the source
  const PATHV = box([leadHead[0], EXT, BENCH, hW.top, hW.cup, LF], 60); // localisation + 8 FT
  const PATHV2 = box([leadHead[0], EXT, hW.top, hW.chest, LF], 40);
  const fAt = (tt: number, pad = 45) => { const h = herAt(tt); return box([...leadHead, h.top, h.face, h.chest, EXT], pad); }; // the crossing
  const F0 = fAt(25.5), F1 = fAt(29.0, 35);
  const keys: FlowKey[] = [
    [-0.5, CUpre],
    [0, CU0],
    [0.7, CUpost],
    // A: reveal her (lateral), then enough of the room to place the source
    [1.35, H(P(150, 120), 400, 830, 1.5)],
    [2.25, TWO],
    [3.5, Lk(P(TWO.x - 6, TWO.y + 8), 540, 960, TWO.z * 0.96)],
    [4.75, GEO],
    // B: in to the exposed ear; the composition develops toward the air beside it
    [5.55, H(EAR_OPEN, 560, 860, 2.25)],
    [7.1, H(EAR_OPEN, 640, 850, 2.55)],
    [8.85, H(EAR_OPEN, 700, 820, 3.0)],
    // C: into the air beside it (the ear rim and the jaw stay in view), the packet, the absorber, the fronts to the ear
    [9.95, H(MID, 540, 900, 4.0)],
    [10.85, H(TGT, 480, 1010, 4.5)],
    [12.3, H(TGT, 490, 1000, 4.6)],
    [13.55, H(MID, 530, 930, 4.4)],
    [14.6, H(P(EAR_OPEN.x - 30, EAR_OPEN.y + 40), 600, 880, 4.2)],
    // D: back out along the path to the source, into the laser head, then up its output to the listener
    [15.5, Lk(pp(beamAt(0.45)), 540, 880, 2.3)],
    [16.1, Lk(MI, 540, 860, 6.2)],
    [17.75, Lk(MI, 540, 860, 7.0)],
    // ... arriving at ONE scale that shows the localisation and carries into the 8 FT proof
    [19.1, PATHV],
    [22.85, PATHV2],
    // E/F: toward the two of them; the compact three-quarter view of the crossing; one reframe on "message"
    [23.75, fAt(23.75, 40)],
    [24.9, F0],
    [27.1, fAt(27.1)],
    [28.95, F1],
    [31.7, Lk(P(F1.x + 30 / F1.z, F1.y - 20 / F1.z), 540, 960, F1.z * 1.07)],
    // G: the signal's return carries the camera back to the face and ear
    [33.3, H(EAR_OPEN, 470, 900, 2.0)],
    [DUR - 0.5, CUpre],
    [DUR, CU0],
    [DUR + 0.7, CUpost],
  ];
  return camFlow(t, keys);
};
export {EAR_OPEN};
