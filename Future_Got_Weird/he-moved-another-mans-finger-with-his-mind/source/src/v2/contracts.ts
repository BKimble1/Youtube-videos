// Hand-off contracts between the V2 sequences (shared constants, so neighbouring builders match exactly).
import {KEY} from './finger';

/** The game seen full-frame: draw <GameScreen .../> inside <g transform={GAME_FULL}>. Used at the B->C boundary
 *  (44.64 s) and the C->D boundary (90.0 s): at both, the plain game (ship, cannon, city; no plane or rocket). */
export const GAME_FULL = 'translate(0 -60) scale(3)';

/** The opening extreme close-up camera on the FingerECU world (finger + space bar). Frame 0 of the film (A) and the
 *  reprise on "Go back to that finger" (G) both use it, so the ending reconnects to the first frame exactly. */
export const ECU_CAM = {x: KEY.x + 110, y: KEY.y - 250, z: 1.08};

/** S5/E -> F match cut: the 2014 touchpad's surface, front-on, fills exactly this rect on E's last frame
 *  (135.87 s); F's first frame shows the falling block whose bounding box is the same rect. */
export const PAD_RECT = {x0: 760, y0: 380, x1: 1160, y1: 640};
