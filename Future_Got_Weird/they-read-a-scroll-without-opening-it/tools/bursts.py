#!/usr/bin/env python3
"""Frame-step QA: for each transition/beat, tile consecutive frames from the export (every frame across a window) so
one-frame jumps, landmark shifts and popping masks can be seen. usage: python3 tools/bursts.py <video.mp4> <out_dir>"""
import os, subprocess, sys, json
vid, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
W = json.load(open('audio/narration/FGW_Scroll_V3_words.json' if os.environ.get('VER') == 'V3' else 'audio/narration/FGW_Scroll_V1_words.json'))
import re
nrm = lambda s: re.sub(r"[^a-z0-9' -]", '', s.lower().replace('’', "'"))
def T(p):
    ps = [nrm(x) for x in p.replace('’', "'").split()]
    for i in range(len(W) - len(ps) + 1):
        if all(nrm(W[i + k]['word']) == q for k, q in enumerate(ps)): return W[i]['start']
    raise KeyError(p)
BEATS_V1 = {
    '01_open_unroll': (0.0, 2.4),
    '02_split_to_roll': (T('That black lump') - 0.9, T('That black lump') + 0.3),
    '03_cut_to_reconstruction': (T('Centuries later') - 0.3, T('Centuries later') + 0.5),
    '04_cut_to_scan': (T('Look at what') - 1.1, T('Look at what') - 0.5),
    '05_spiral_reveal': (T('Slice through') + 0.7, T('a spiral.') + 0.4),
    '06_branch_error': (T('If you jump') - 0.1, T('If you jump') + 1.4),
    '07_reset': (T('Keep going') + 5.2, T('Keep going') + 6.6),
    '08_flatten': (T('That gave them') + 0.1, T('could flatten.') + 1.2),
    '09_page_opens': (T('Now they had') - 0.2, T('Now they had') + 0.9),
    '10_ink_reveal': (T('Put the patches') + 0.2, T('Put the patches') + 3.8),
    '11_cut_to_paris4': (T('And here’s how') - 0.4, T('And here’s how') + 0.3),
    '12_validation_overlay': (T('They lined'), T('They lined') + 1.3),
    '13_cut_back_1667': (T('Back on the first') - 0.4, T('Back on the first') + 0.4),
    '14_closing_callback': (T('You just read') + 0.8, T('You just read') + 2.2),
    '15_reroll': (T('And the page is still') - 0.1, T('And the page is still') + 2.2),
}
BEATS_V2 = {
    '01_macro_attempt': (0.0, 2.8),
    '02_scan_sweep': (3.5, 4.7),
    '03_into_end_face_page': (4.5, 6.4),
    '04_return_to_physical': (6.8, 7.9),
    '05_match_cut_villa': (9.7, 10.4),
    '06_surge_to_buried': (13.6, 15.6),
    '07_break_and_turn': (17.4, 19.4),
    '08_cut_to_lab': (26.3, 26.9),
    '09_slices_stack': (33.0, 35.0),
    '10_into_the_slice': (36.7, 39.3),
    '11_dive_between_layers': (40.0, 41.5),
    '12_coil_tilt': (43.0, 45.9),
    '13_contact_press': (50.0, 51.8),
    '14_wrong_jump': (53.2, 54.6),
    '15_skipped_turn_peels': (55.4, 57.7),
    '16_pieces_join': (58.8, 62.2),
    '17_rewind': (63.8, 65.5),
    '18_handoff_to_flatten': (71.4, 72.8),
    '19_cutaway': (81.9, 83.2),
    '20_scan_bar': (88.0, 89.3),
    '21_road_open': (100.2, 101.4),
    '22_validation_overlay': (126.4, 127.9),
}
BEATS_V3 = {} if os.environ.get('VER') != 'V3' else {
    '01_attempt_break': (0.0, 2.6),
    '02_scan_to_page': (2.8, 5.4),
    '03_back_to_object': (T('That black lump') - 0.4, T('That black lump') + 0.5),
    '04_match_cut_villa': (T('It was buried') - 0.3, T('It was buried') + 0.4),
    '05_surge': (T('Centuries later') - 1.2, T('Centuries later') + 0.6),
    '06_cut_to_lab': (T('Look at what') - 0.6, T('Look at what') + 0.1),
    '07_into_the_slice': (T('Slice through') + 0.3, T('a spiral.') + 0.9),
    '08_dive': (T('That’s the sheet') - 0.3, T('That’s the sheet') + 1.0),
    '09_wrong_jump': (T('If you jump') - 0.1, T('If you jump') + 1.4),
    '10_rewind': (T('next to each other.') - 0.1, T('So they traced') + 0.6),
    '11_flatten': (T('That gave them'), T('could flatten.') + 1.0),
    '12_cutaway_in': (T('The ink was') - 0.3, T('The ink was') + 0.7),
    '13_heat': (T('the heat had') - 0.1, T('the heat had') + 1.2),
    '14_scan_bar': (T('In the scan,') - 0.1, T('In the scan,') + 1.4),
    '15_cutaway_out': (T('So the team trained') - 1.0, T('So the team trained') + 0.5),
    '16_road_open': (T('Imagine trying') - 0.1, T('Imagine trying') + 0.9),
    '17_ink_reveal': (T('Put the patches') + 0.2, T('Put the patches') + 2.6),
    '18_cut_to_paris4': (T('And here’s how') - 0.4, T('And here’s how') + 0.3),
    '19_overlay_push': (T('They lined'), T('They lined') + 1.3),
    '20_cut_back_1667': (T('Back on the first') - 0.4, T('Back on the first') + 0.4),
    '21_glide_gaps': (T('There are gaps') - 0.1, T('There are gaps') + 1.2),
    '22_pen_follow': (T('Somebody put') - 0.6, T('Somebody put') + 0.6),
    '23_callback': (T('You just read') + 0.8, T('You just read') + 2.2),
}
BEATS = BEATS_V2 if os.environ.get('VER') == 'V2' else BEATS_V3 if os.environ.get('VER') == 'V3' else BEATS_V1
for name, (a, b) in BEATS.items():
    n = int(round((b - a) * 30))
    cols = 8
    rows = (n + cols - 1) // cols
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{n / 30 - 0.001:.3f}', '-i', vid, '-vf', f'scale=480:-1,setpts=PTS+{a:.3f}/TB,drawtext=text=%{{pts}}:x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile={cols}x{rows}', '-frames:v', '1', os.path.join(out, f'{name}.png')], stdin=subprocess.DEVNULL)
    print(name, a, b, n)
