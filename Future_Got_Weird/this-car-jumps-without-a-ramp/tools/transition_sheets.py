#!/usr/bin/env python3
"""Frame-by-frame contact sheets of a rendered file around its transitions and cutaways:

  python3 tools/transition_sheets.py exports/FGW_U9_FINAL_4K.mp4 qa/final_strips

Every frame in each window is pulled from the actual file (not from the project) and tiled with its frame number, so
cuts, dissolves, camera snaps, disappearing or doubled parts and blank frames can be inspected one frame at a time."""
import os, subprocess, sys

WINDOWS = {
    'real_to_vector_open': (1.70, 2.00),
    'vector_to_spikes': (35.10, 35.40),
    'spikes_landing': (39.60, 40.10),
    'launch_after_spikes': (40.10, 40.50),
    'bend_3q_cut': (55.55, 56.15),
    'real_corner_to_overhead': (43.25, 43.55),
    'question_in': (7.85, 8.15),
    'question_out': (10.35, 10.65),
    'hand_press_1': (14.85, 15.65),
    'tyre_wall_into_bend': (41.75, 42.25),
    'real_corner_out': (42.8, 43.3),
    'whip_into_cabin': (93.05, 93.65),
    'cabin_iris_in': (95.75, 96.45),
    'cabin_iris_out': (106.75, 107.55),
    'lens_pass_to_replay': (107.6, 108.2),
    'replay_to_vector': (110.0, 110.6),
    'vector_to_real_jump': (113.55, 113.9),
    'jump_landing': (116.2, 116.7),
    'jump_to_hover': (117.75, 118.0),
    'hover_to_vector': (119.55, 119.95),
    'vector_to_real_drive': (127.55, 127.95),
    'drive_cut_a_b': (129.15, 129.4),
    'end_card': (133.0, 134.15),
}


def main(path, out):
    os.makedirs(out, exist_ok=True)
    for name, (t0, t1) in WINDOWS.items():
        f0 = int(round(t0 * 30))
        n = int(round((t1 - t0) * 30))
        cols = 6 if n > 12 else 4
        rows = (n + cols - 1) // cols
        vf = (f"scale=480:270,drawtext=text='%{{eif\\:n+{f0}\\:d}}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,"
              f"tile={cols}x{rows}")
        dst = os.path.join(out, f'{name}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{f0 / 30:.4f}', '-i', path, '-vf', vf, '-frames:v', '1', dst], check=True)
        print(dst, n, 'frames from', f0)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'qa/final_strips'))
