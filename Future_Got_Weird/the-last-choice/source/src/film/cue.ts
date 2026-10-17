// Sound cue format shared by the shot groups and the mixer (tools/mix.py). Times are FILM seconds.
//   kind   a sound in audio/sfx/<kind>.wav (see audio/SFX_CHOICES.md)
//   gain   dB relative to the kind's default level in tools/mix.py
//   pan    -1 (left) .. 1 (right): where the source is on screen
//   dist   0 (close, dry) .. 1 (far: quieter, darker, more room)
//   dur    for beds/loops: how long to play (looped); fades in/out over fade s
//   rate   playback rate (pitch/speed), 1 = original
export type Cue = {t: number; kind: string; gain?: number; pan?: number; dist?: number; dur?: number; rate?: number; fade?: number};
/** Shot-local helper: cues at local times of a shot that starts at `start`. */
export const at = (start: number) => (t: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue => ({t: start + t, kind, ...o});
