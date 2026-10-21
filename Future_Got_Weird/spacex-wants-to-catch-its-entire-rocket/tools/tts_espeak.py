"""Temporary review narration with espeak-ng (free, local; espeakng-loader from PyPI).

Synthesises each line of script/narration.json, records espeak word events (true audio positions),
stitches the lines with the scripted gaps and writes:
  audio/narration/narration_review.wav      (48 kHz mono)
  audio/narration/narration_words.json      (per-word start/end seconds on the stitched timeline)
  audio/narration/narration_lines.json      (per-line start/end seconds)
This voice is a placeholder for the review cut only; see QA report.
"""
import ctypes, json, os, sys, re
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
import espeakng_loader as el

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = os.environ.get('VOICE', 'en-us+m3')
RATE = int(os.environ.get('RATE', '158'))      # words per minute
PITCH = int(os.environ.get('PITCH', '42'))
LEAD = 0.6                                     # silence before the first line

lib = ctypes.CDLL(el.get_library_path())
class EVENT(ctypes.Structure):
    _fields_ = [('type', ctypes.c_int), ('unique_identifier', ctypes.c_uint), ('text_position', ctypes.c_int),
                ('length', ctypes.c_int), ('audio_position', ctypes.c_int), ('sample', ctypes.c_int),
                ('user_data', ctypes.c_void_p), ('id', ctypes.c_int64)]
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.POINTER(EVENT))
sr = lib.espeak_Initialize(0x01, 0, el.get_data_path().encode(), 0)  # AUDIO_OUTPUT_RETRIEVAL
lib.espeak_SetVoiceByName(VOICE.encode())
lib.espeak_SetParameter(1, RATE, 0)   # espeakRATE
lib.espeak_SetParameter(3, PITCH, 0)  # espeakPITCH
lib.espeak_SetParameter(4, 30, 0)     # espeakRANGE
buf, events = [], []
@CB
def cb(wav, n, ev):
    if n > 0: buf.append(np.ctypeslib.as_array(wav, shape=(n,)).copy())
    i = 0
    while ev[i].type != 0:
        if ev[i].type == 1:  # espeakEVENT_WORD
            events.append((ev[i].text_position, ev[i].length, ev[i].audio_position))
        i += 1
    return 0
lib.espeak_SetSynthCallback(cb)

def synth(text):
    buf.clear(); events.clear()
    b = text.encode('utf-8')
    lib.espeak_Synth(b, len(b) + 1, 0, 0, 0, 0x01, None, None)  # espeakCHARS_UTF8
    lib.espeak_Synchronize()
    a = np.concatenate(buf).astype(np.float32) / 32768.0
    return a, list(events), b

lines = json.load(open(os.path.join(ROOT, 'script/narration.json')))
out_sr = 48000
pieces, words, ltimes = [np.zeros(int(LEAD * out_sr), np.float32)], [], []
t = LEAD
for ln in lines:
    a, ev, b = synth(ln['text'])
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.004)[0]
    s0, s1 = (nz[0], nz[-1] + 1) if len(nz) else (0, len(a))
    a = a[s0:s1]
    off = s0 / sr
    a48 = resample_poly(a, 160, 69).astype(np.float32) if sr == 22050 else resample_poly(a, out_sr, sr).astype(np.float32)
    dur = len(a48) / out_sr
    # map every script word (whitespace token) to the first espeak word event at or after its character offset
    evs = sorted((tp - 1, ap / 1000.0 - off) for (tp, ln_, ap) in ev)
    toks, pos = [], 0
    for tok in ln['text'].split():
        i = ln['text'].index(tok, pos); pos = i + len(tok)
        cbyte = len(ln["text"][:i].encode("utf-8"))
        st = next((a for (c, a) in evs if c >= cbyte), dur)
        toks.append([tok, max(0.0, st)])
    for k, (w, st) in enumerate(toks):
        en = toks[k + 1][1] if k + 1 < len(toks) else dur
        words.append({'line': ln['id'], 'w': w, 's': round(t + st, 3), 'e': round(t + min(max(en, st + 0.05), dur), 3)})
    ltimes.append({'id': ln['id'], 'scene': ln['scene'], 's': round(t, 3), 'e': round(t + dur, 3), 'text': ln['text']})
    pieces.append(a48)
    g = np.zeros(int(ln.get('gap', 0.35) * out_sr), np.float32); pieces.append(g)
    t += dur + len(g) / out_sr
audio = np.concatenate(pieces)
audio = audio / max(1e-6, np.abs(audio).max()) * 0.7
od = os.path.join(ROOT, 'audio/narration'); os.makedirs(od, exist_ok=True)
sf.write(os.path.join(od, 'narration_review.wav'), audio, out_sr, subtype='PCM_16')
json.dump(words, open(os.path.join(od, 'narration_words.json'), 'w'), indent=0)
json.dump({'voice': f'espeak-ng {VOICE} rate {RATE} pitch {PITCH}', 'duration': round(len(audio) / out_sr, 3), 'lines': ltimes},
          open(os.path.join(od, 'narration_lines.json'), 'w'), indent=1)
print('sr', sr, 'duration', round(len(audio) / out_sr, 2), 's', 'words', len(words))
