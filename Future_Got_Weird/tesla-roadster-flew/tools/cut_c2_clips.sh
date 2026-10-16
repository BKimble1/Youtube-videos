#!/usr/bin/env bash
# Cut the companion v2 clips from the owner's recordings (footage/release/, draft release roadster-footage-2026-10-15)
# into source/public/footage/ (Git-ignored). Spans and what each shows: footage/CLIP_LEDGER.md, "Companion v2".
# Slow-motion clips are motion-interpolated and never span a broadcast camera cut (each side is slowed separately).
set -euo pipefail
cd "$(dirname "$0")/.."
R=footage/release; O=source/public/footage; mkdir -p "$O"
V=(-c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p -r 30)
want() { [ -z "${ONLY:-}" ] || [[ " $ONLY " == *" $1 "* ]]; }
cut() { want "$4" || return 0; ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" "${V[@]}" -c:a aac -b:a 192k -ar 48000 "$O/$4"; }
# slow FILE START DUR RATE OUT  (RATE < 1; video only)
slow() {
  want "$(basename "$5")" || return 0
  local f; f=$(python3 -c "print(round(30/$4, 3))")
  ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" -an \
    -vf "minterpolate=fps=$f:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS/$4,fps=30" "${V[@]}" "$5"
}
T=$(mktemp -d)
join() { want "$1" || return 0; local out=$1; shift; local args=() n=0 fl=""; for p in "$@"; do args+=(-i "$p"); fl+="[$n:v]"; n=$((n+1)); done
  ffmpeg -v error -y "${args[@]}" -filter_complex "${fl}concat=n=$n:v=1[v]" -map "[v]" "${V[@]}" "$O/$out"; }

# 1 opening: second run, aerial, upside down on the ramp -> leaves -> rolls -> lands (silent recording)
cut rec_224730.mp4 136.42 8.55 c2_open_aerial.mp4
# 2 the first run's hang, close-up from below (ends before Tesla's cut at 1:19.90), half speed
slow rec_224730.mp4 77.50 2.36 0.5 "$O/c2_hang_slow.mp4"
# 3 second run, side angle (car seen end-on): leaves the ramp, rolls, jets, lands
cut rec_224730.mp4 127.20 4.45 c2_side_run2.mp4
# 4 hop side replay, half speed: inverted above the row, opposite pair, roll (stops before the cut at 38.12)
slow rec_224911.mp4 35.80 2.32 0.5 "$O/c2_hop_slow_a.mp4"
# 5 second run, side angle, half speed: four jets firing down, touchdown into smoke
slow rec_224730.mp4 129.60 2.32 0.5 "$O/c2_run2_slow.mp4"
# 6 the hop, live: front angle (approach, lift-off at 20.0), Tesla's cut to the side angle at 20.97, touchdown ~22.2
cut rec_224911.mp4 17.00 5.50 c2_hop_front.mp4
# 7 hop side replay at speed: lift-off on the jets beside the row of parked Teslas
cut rec_224911.mp4 34.30 2.45 c2_hop_siderep.mp4
# 8 the stream's recorded 0-60 run: rear, overhead and side-rear angles at the line, launch 17.1 with the rear gas jet
cut rec_225218.mp4 12.10 6.40 c2_rec_run.mp4
# 9 its overhead replay (burned-in timer already at 01.00), 0.6x
slow rec_225218.mp4 21.66 3.30 0.6 "$O/c2_rec_overhead.mp4"
# 10 the later launch (rec_225340): car at the line, then the gas blast at 46.62 at half speed (ends before the player UI at 49.0)
cut rec_225340.mp4 43.60 2.80 c2_live_a.mp4
slow rec_225340.mp4 46.40 2.20 0.5 "$O/c2_live_b.mp4"
# 11 limits: the hop's aerial replay (after the dissolve that ends ~0:41.5), then the second run's approach to the ramp (ends before the dissolve at 2:05.3)
cut rec_224911.mp4 41.55 7.60 c2_limits_aer.mp4
cut rec_224730.mp4 119.25 6.00 c2_run2_approach.mp4
# 12 ending: second run aerial, upside down on the ramp, 0.365x; hop side replay roll -> upright on two jets, 0.3125x
#    (split at the cut 38.12/38.14); hop front angle lift-off and flip above the Semi, 0.33x
slow rec_224730.mp4 136.45 1.90 0.365 "$O/c2_end_aerial.mp4"
slow rec_224911.mp4 37.85 0.27 0.3125 "$T/e1.mp4"
slow rec_224911.mp4 38.14 1.26 0.3125 "$T/e2.mp4"
join c2_end_hop.mp4 "$T/e1.mp4" "$T/e2.mp4"
slow rec_224911.mp4 19.75 1.21 0.33 "$O/c2_end_front.mp4"
rm -rf "$T"
for f in "$O"/c2_*.mp4; do printf '%-28s %s\n' "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
