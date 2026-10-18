#!/usr/bin/env python3
"""Final mix: narration (centre) + bed (music and effects, already ducked under the words), normalised in two passes
to -15 LUFS integrated / -1.5 dBTP (the channel's mix target), 48 kHz stereo.

Outputs: audio/mix/mix.wav (master audio, 24-bit), source/public/audio/mix.mp3 (preview in the Remotion player),
audio/mix/mix_measure.json (loudness of the result).
"""
import json, os, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAR = os.path.join(ROOT, 'audio/narration/narration_v1.wav')
BED = os.path.join(ROOT, 'audio/mix/bed.wav')
OUT = os.path.join(ROOT, 'audio/mix/mix.wav')


def loud(path, extra=''):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', f'{extra}loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    txt = r.stderr
    return json.loads(txt[txt.rindex('{'):txt.rindex('}') + 1])


def main():
    with tempfile.TemporaryDirectory() as td:
        pre = os.path.join(td, 'pre.wav')
        # narration up front, the bed under it; amix without normalisation so the levels stay as built
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', NAR, '-i', BED, '-filter_complex',
                        '[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0[n];[1:a]aresample=48000[b];[n][b]amix=inputs=2:normalize=0:duration=longest[m]',
                        '-map', '[m]', '-c:a', 'pcm_f32le', pre], check=True)
        m = loud(pre)
        f = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
             f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', f, '-c:a', 'pcm_s24le', '-ar', '48000', OUT], check=True)
    os.makedirs(os.path.join(ROOT, 'source/public/audio'), exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', OUT, '-c:a', 'libmp3lame', '-b:a', '256k', os.path.join(ROOT, 'source/public/audio/mix.mp3')], check=True)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    summ = r[r.rindex('Summary:'):]
    vals = {}
    for key, tag in (('integrated_lufs', 'I:'), ('lra_lu', 'LRA:'), ('true_peak_dbtp', 'Peak:')):
        line = [ln for ln in summ.splitlines() if ln.strip().startswith(tag)][0]
        vals[key] = float(line.split()[1])
    json.dump(vals, open(os.path.join(ROOT, 'audio/mix/mix_measure.json'), 'w'), indent=1)
    print('mix.wav', vals)


if __name__ == '__main__':
    main()
