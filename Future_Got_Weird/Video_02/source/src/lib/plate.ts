import {getInputProps} from 'remotion';

/**
 * Render-mode flags passed as input props.
 * - `plate: true` renders Runway start/end plates: scenes hide their screen-space labels and chips (generated video must
 *   never carry text), and in-scene Runway inserts are not drawn (the plate is the Remotion shot itself).
 * - `inserts: false` (stills.mjs NO_INSERTS) renders the film without any Runway insert, i.e. the pure Remotion version.
 */
const props = (): {plate?: boolean; inserts?: boolean} => {
  try {
    return getInputProps() as {plate?: boolean; inserts?: boolean};
  } catch {
    return {};
  }
};
export const isPlate = (): boolean => Boolean(props().plate);
export const insertsOff = (): boolean => props().inserts === false || isPlate();
