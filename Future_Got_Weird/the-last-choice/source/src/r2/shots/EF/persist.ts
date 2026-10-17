// Section EF: machines (and props) that outlive their shots — wrecks, fallen units, pinned heavies — so later shots
// show them where they fell. Pure data/specs only (no React). See src/r2/film/continuity.tsx.
//
// E/F break nothing new: every machine stops on FINAL_HIT and holds. The aftermath state they show (the ring, the
// holders, heavy 2, the D4 wrecks, heavy 1's wreck as a fallback for D3) is defined in ./tableau.ts, which D4 imports
// and ends on; registering it here would draw it twice in D4.
import type {Persist} from '../../film/continuity';

export const PERSIST_EF: Persist[] = [];
