// V4: the gaming room with no gamepad on the guesser's desk (he never touches a conventional controller; Honest
// keeps his own). Everything else is the shared room.
import React from 'react';
import {RoomScene as RoomBase} from '../art/room';
export const RoomScene: React.FC<React.ComponentProps<typeof RoomBase>> = (p) => <RoomBase {...p} noPad />;
