// V5 shot H3 (31.88-33.5): the loop shot (HOOK owner). Inside the control room, the operator watches the extended
// warm channel through the window ("using the AIR ITSELF"); at 32.9 the machine starts charging and her hand goes to
// the FIRE control, so the film's frame 0 (the press) carries straight on: one room camera on the loop clock.
import React from 'react';
import {roomCam5} from './cams5_hook';
import {Room5} from './Room5';

export const LoopH5: React.FC<{t: number}> = ({t}) => <Room5 t={t} rc={roomCam5(t)} tag={`l5-${Math.round(t * 30)}`} />;
