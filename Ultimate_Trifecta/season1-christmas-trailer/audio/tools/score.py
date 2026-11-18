"""Original score for the Ultimate Trifecta Season 1 · Winter Break trailer.

"Night Watch Jingle" (working title), written for this trailer.  120 BPM, 4/4,
so one bar is exactly 2.0 s and the trailer's sections fall on bar lines:

  bars 0-1   0.0-4.0 s   cold open: B minor music-box hook, the flashlight hit
                          (2.0 s), a riser, a stop-down at 3.75 s
  bars 2-4   4.0-10.0 s  THE DROP: the hook in D major, full festive band
  bars 5-8  10.0-18.0 s  chaos: B minor action riff, stabs on the cuts,
                          build, stop-down at 17.75 s
  bars 9-10 18.0-22.0 s  the chase: driving ostinato; the splash at 21.0 s
                          (slow motion: the band drops under water)
  bars 11-12 22.0-26.0 s key change up to E major: the hook, huge
  bar 13    26.0-28.0 s  climax at the dorm door; tiptoe breakdown; silence
  bar 14    28.0-30.0 s  logo: E major hit and the hook as a bell sting

The orchestral parts are MIDI stems rendered with FluidR3_GM (MIT licence)
through fluidsynth; drums, bells, bass and effects are synthesized in
build_music.py.  Pitches are MIDI numbers; times are in beats (0.5 s).
"""
import mido

BPM = 120
SPB = 60.0 / BPM          # seconds per beat
TPB = 480                 # MIDI ticks per beat
NAMES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
         "A": 9, "A#": 10, "Bb": 10, "B": 11}


def n(name):
    """'F#5' -> MIDI number (C4 = 60)."""
    p, o = (name[:2], name[2:]) if len(name) > 2 and name[1] in "#b" else (name[:1], name[1:])
    return 12 * (int(o) + 1) + NAMES[p]


def ch(*names):
    return [n(x) for x in names]


# GM programs (0-based) per orchestral stem
PROGRAMS = {
    "celesta": 8, "glock": 9, "tubular": 14, "strings": 48, "strings_lo": 48, "trem": 44, "pizz": 45,
    "brass": 61, "horns": 60, "trumpet": 56, "lowbrass": 57, "tuba": 58, "choir": 52, "timpani": 47,
}

S = {k: [] for k in PROGRAMS}       # stem -> [(beat, dur, midi, vel)]
CC = {k: [] for k in PROGRAMS}      # stem -> [(beat, cc11 value)]


def add(stem, beat, dur, pitches, vel=96):
    if isinstance(pitches, (int, str)):
        pitches = [pitches]
    for p in pitches:
        S[stem].append((beat, dur, n(p) if isinstance(p, str) else p, vel))


def expr(stem, pts):
    CC[stem].extend(pts)


# The hook (8th-note grid): x . x x x . x . | x x x . x . . .
HOOK_A = [0.0, 1.0, 1.5, 2.0, 3.0]          # onsets (beats) of phrase a
HOOK_A_DUR = [0.5, 0.5, 0.5, 1.0, 1.0]
HOOK_B = [0.0, 0.5, 1.0, 2.0, 3.0]          # onsets of phrase b
HOOK_B_DUR = [0.5, 0.5, 1.0, 1.0, 1.0]


def phrase(stem, start, onsets, durs, notes, vel=100, octave=0, stacc=1.0):
    for o, d, p in zip(onsets, durs, notes):
        if p is None:
            continue
        add(stem, start + o, d * stacc, n(p) + 12 * octave, vel)


# ------------------------------------------------------------------ bars 0-1: cold open
def cold_open():
    # music box / celesta: the hook in B minor, distant
    phrase("celesta", 0.0, HOOK_A, HOOK_A_DUR, ["B4", "B4", "C#5", "D5", "F#5"], vel=62)
    phrase("celesta", 4.0, [0.0, 0.5, 1.0], [0.5, 0.5, 1.5], ["E5", "D5", "C#5"], vel=56)
    phrase("glock", 0.0, HOOK_A, HOOK_A_DUR, ["B5", "B5", "C#6", "D6", "F#6"], vel=30)
    # low tremolo strings: B pedal, swelling from the hit into the stop
    add("trem", 0.0, 7.5, ["B1", "F#2", "B2"], 70)
    expr("trem", [(0.0, 30), (3.9, 48), (4.0, 70), (7.4, 127), (7.5, 0)])
    add("strings", 4.0, 3.5, ["B3", "D4", "F#4", "B4"], 80)
    expr("strings", [(4.0, 40), (7.45, 125), (7.5, 0), (8.0, 100)])
    # the flashlight hit (2.0 s): brass + strings stab on a dark chord
    add("brass", 4.0, 0.6, ["B2", "F#3", "B3", "D4"], 120)
    add("lowbrass", 4.0, 0.8, ["B1", "B2"], 120)
    add("timpani", 4.0, 0.5, ["B1"], 127)
    # timpani roll into the stop-down
    for i in range(14):
        add("timpani", 5.75 + i * 0.125, 0.12, ["F#2"], 50 + i * 5)


# ------------------------------------------------------------------ bars 2-4: the drop, D major
def theme_a(start=8.0, key=0, big=False):
    """The hook in D major (key = semitone shift).  3 bars: D | Bm G | A."""
    def k(names):
        return [n(x) + key for x in names]

    mel_a = ["D5", "D5", "E5", "F#5", "A5"]
    mel_b = ["G5", "F#5", "E5", "D5", "B4"]
    mel_c = ["A4", "A4", "B4", "C#5", "E5"]
    for stem, octv, vel in (("brass", 0, 112), ("trumpet", 0, 100), ("strings", 0, 100), ("glock", 1, 92), ("horns", -1, 96)):
        for st0, ons, durs, mel in ((start, HOOK_A, HOOK_A_DUR, mel_a), (start + 4, HOOK_B, HOOK_B_DUR, mel_b),
                                    (start + 8, HOOK_A, HOOK_A_DUR, mel_c)):
            for o, d, p in zip(ons, durs, mel):
                add(stem, st0 + o, d * (0.9 if stem in ("brass", "trumpet") else 1.0), n(p) + key + 12 * octv, vel)
    # harmony: D | G Bm | Asus4 A
    chords = [(start, 4, ["D3", "A3", "D4", "F#4"]), (start + 4, 2, ["G2", "D3", "G3", "B3"]),
              (start + 6, 2, ["B2", "F#3", "B3", "D4"]), (start + 8, 2, ["A2", "E3", "A3", "D4"]),
              (start + 10, 2, ["A2", "E3", "A3", "C#4"])]
    for b, d, notes in chords:
        add("choir", b, d, [x + 12 for x in k(notes[1:])], 88 if not big else 104)
        add("lowbrass", b, d * 0.95, k(notes[:2]), 96)
        add("tuba", b, d * 0.95, [k(notes[:1])[0] - 12], 92)
        # string ostinato: 8th-note broken chord
        tones = k(notes[1:]) + [k(notes[1:])[1]]
        for i in range(int(d * 2)):
            add("strings_lo", b + i * 0.5, 0.45, [tones[i % len(tones)]], 84 + (12 if i % 2 == 0 else 0))
    # glock sparkle at the top of each bar
    for b in (start, start + 4, start + 8):
        add("tubular", b, 2.0, [n("D6") + key if b == start else n("A5") + key], 70)


# ------------------------------------------------------------------ bars 5-8: chaos, B minor
def chaos(start=20.0):
    prog = [(start, ["B1", "B2", "F#3", "B3", "D4"]), (start + 4, ["G1", "G2", "D3", "G3", "B3"]),
            (start + 8, ["E1", "E2", "B2", "E3", "G3"]), (start + 12, ["F#1", "F#2", "C#3", "F#3", "A#3"])]
    for b, notes in prog:
        roots = [n(notes[1]), n(notes[2])]
        # 16th-note string ostinato (root, fifth, octave)
        cell = [roots[0], roots[0], roots[1], roots[0] + 12, roots[0], roots[1], roots[0] + 12, roots[1]]
        for i in range(16):
            add("strings_lo", b + i * 0.25, 0.22, [cell[i % 8] + 12], 76 + (24 if i % 4 == 0 else 0))
        add("lowbrass", b, 0.4, [n(notes[0]) + 12, n(notes[1]) + 12], 112)
        add("lowbrass", b + 1.5, 0.3, [n(notes[0]) + 12, n(notes[1]) + 12], 100)
        add("lowbrass", b + 3.0, 0.4, [n(notes[0]) + 12, n(notes[1]) + 12], 104)
        add("tuba", b, 3.8, [n(notes[0]) + 12], 84)
        add("choir", b, 4.0, [n(x) + 12 for x in notes[2:]], 72)
    # the hook, minor, in horns + trumpet (bars 5-6), up an octave (bars 7-8)
    phrase("horns", start, HOOK_A, HOOK_A_DUR, ["B4", "B4", "C#5", "D5", "F#5"], vel=110, stacc=0.8)
    phrase("horns", start + 4, HOOK_B, HOOK_B_DUR, ["E5", "D5", "C#5", "B4", "F#4"], vel=104, stacc=0.8)
    phrase("trumpet", start + 8, HOOK_A, HOOK_A_DUR, ["G5", "G5", "F#5", "E5", "B4"], vel=108, stacc=0.8)
    phrase("brass", start, HOOK_A, HOOK_A_DUR, ["B3", "B3", "C#4", "D4", "F#4"], vel=96, stacc=0.6)
    phrase("brass", start + 8, HOOK_A, HOOK_A_DUR, ["E4", "E4", "F#4", "G4", "B4"], vel=100, stacc=0.6)
    phrase("glock", start, HOOK_A, HOOK_A_DUR, ["B5", "B5", "C#6", "D6", "F#6"], vel=70)
    # bar 8: build on F# major to the stop-down at beat start+15.5
    add("trumpet", start + 12, 3.5, ["F#5"], 96)
    add("horns", start + 12, 3.5, ["A#4", "C#5"], 96)
    add("trem", start + 12, 3.5, ["F#2", "C#3", "F#3", "A#3", "C#4", "F#4"], 100)
    expr("trem", [(start + 12, 50), (start + 15.45, 127), (start + 15.5, 0)])
    expr("trumpet", [(start + 12, 60), (start + 15.45, 127), (start + 15.5, 100)])
    expr("horns", [(start + 12, 60), (start + 15.45, 127), (start + 15.5, 100)])
    for i in range(16):
        add("timpani", start + 13.5 + i * 0.125, 0.12, ["F#2"], 60 + i * 4)


# ------------------------------------------------------------------ bars 9-10: the chase
def chase(start=36.0):
    # bar 9: Bm drive; bar 10 (to the splash at start+6): G -> F#sus
    for b, root in ((start, "B1"), (start + 2, "B1"), (start + 4, "G1"), (start + 5, "A1")):
        pass
    cell = ["B2", "B2", "B2", "B2", "D3", "D3", "C#3", "C#3"]
    for i in range(24):          # 6 beats of 16ths, then the splash
        b = start + i * 0.25
        nn = cell[i % 8] if i < 16 else ["G2", "G2", "A2", "A2"][i % 4]
        add("strings_lo", b, 0.22, [nn, n(nn) + 12], 84 + (28 if i % 4 == 0 else 0))
    add("tuba", start, 4.0, ["B1"], 96)
    add("tuba", start + 4, 2.0, ["G1"], 96)
    add("lowbrass", start, 4.0, ["B2", "F#3"], 90)
    add("lowbrass", start + 4, 2.0, ["G2", "D3"], 96)
    # the "siren" figure: high strings + trumpet wailing F#5 <-> D5
    for b, p in ((start, "F#5"), (start + 1, "D5"), (start + 2, "F#5"), (start + 3, "D5"), (start + 4, "G5"), (start + 5, "E5")):
        add("trumpet", b, 0.95, [p], 96)
        add("strings", b, 1.0, [p, n(p) - 12], 92)
    add("choir", start, 4.0, ["B4", "D5", "F#5"], 80)
    add("choir", start + 4, 2.0, ["B4", "D5", "G5"], 90)
    expr("choir", [(start, 60), (start + 5.9, 110)])
    # splash (beat start+6 = 21.0 s): under water - a sustained shimmering chord
    add("trem", start + 6, 2.0, ["G3", "B3", "D4", "F#4", "A4"], 70)
    expr("trem", [(start + 6, 40), (start + 7.6, 110), (start + 8, 0)])
    add("choir", start + 6, 2.0, ["G4", "B4", "D5", "F#5"], 70)
    expr("choir", [(start + 6, 50), (start + 7.6, 100), (start + 7.95, 0), (start + 8, 100)])
    add("celesta", start + 6, 0.5, ["D6"], 70)
    add("celesta", start + 6.5, 0.5, ["B5"], 62)
    add("celesta", start + 7.0, 0.5, ["F#5"], 58)
    add("timpani", start + 6, 0.5, ["G1"], 120)


# ------------------------------------------------------------------ bars 11-14: home, climax, logo
def finale(start=44.0):
    E = 2   # D major -> E major
    # bars 11-12: the hook, E major: E | C#m ; A -> B (rising run)
    mel_a = ["E5", "E5", "F#5", "G#5", "B5"]
    for stem, octv, vel in (("brass", 0, 120), ("trumpet", 0, 112), ("strings", 0, 112), ("glock", 1, 100), ("horns", -1, 108), ("choir", 0, 96)):
        phrase(stem, start, HOOK_A, HOOK_A_DUR, mel_a, vel=vel, octave=octv)
        phrase(stem, start + 4, [0.0, 0.5, 1.0, 2.0, 2.5, 3.0, 3.5], [0.5, 0.5, 1.0, 0.5, 0.5, 0.5, 0.5],
               ["A5", "G#5", "F#5", "B4", "C#5", "D#5", "F#5"], vel=vel, octave=octv)
    chords = [(start, 2, ["E2", "B2", "E3", "G#3"]), (start + 2, 2, ["C#2", "G#2", "C#3", "E3"]),
              (start + 4, 2, ["A1", "E2", "A2", "C#3"]), (start + 6, 2, ["B1", "F#2", "B2", "D#3"])]
    for b, d, notes in chords:
        add("lowbrass", b, d * 0.95, [n(notes[1]) + 12, n(notes[2]) + 12], 104)
        add("tuba", b, d * 0.95, [n(notes[0]) + 12], 100)
        tones = [n(x) + 12 for x in notes[1:]] + [n(notes[2]) + 12]
        for i in range(int(d * 4)):
            add("strings_lo", b + i * 0.25, 0.22, [tones[i % 4]], 82 + (24 if i % 4 == 0 else 0))
    # bar 13 (26.0 s): the climax at the dorm door - E major, choir and brass
    c = start + 8
    big = ["E3", "B3", "E4", "G#4", "B4", "E5"]
    add("brass", c, 1.9, ["E4", "G#4", "B4", "E5"], 124)
    add("trumpet", c, 0.5, ["G#5"], 124)
    add("trumpet", c + 0.5, 0.5, ["F#5"], 118)
    add("trumpet", c + 1.0, 1.0, ["E5"], 124)
    add("horns", c, 2.0, ["B3", "E4", "G#4"], 118)
    add("strings", c, 2.0, ["E4", "G#4", "B4", "E5", "G#5"], 118)
    add("choir", c, 2.0, ["E4", "G#4", "B4", "E5"], 116)
    add("lowbrass", c, 2.0, ["E2", "B2", "E3"], 118)
    add("tuba", c, 2.0, ["E1"], 112)
    add("timpani", c, 0.5, ["E2"], 127)
    add("tubular", c, 2.0, ["E5", "B5"], 96)
    expr("strings", [(c, 110), (c + 1.95, 127), (c + 2.0, 100)])
    # 27.0-27.75 s: the shush - pizzicato tiptoe, a celesta wink
    for b, p in ((c + 2.0, "B4"), (c + 2.5, "G#4"), (c + 3.0, "E4")):
        add("pizz", b, 0.3, [p, n(p) - 12], 96)
    add("celesta", c + 2.25, 0.5, ["E6"], 54)
    # bar 14 (28.0 s): the logo - E major tutti, then the hook as a bell sting
    L = start + 12
    add("brass", L, 3.6, ["E3", "B3", "E4", "G#4", "B4"], 127)
    add("trumpet", L, 3.6, ["E5", "G#5"], 120)
    add("horns", L, 3.6, ["B3", "E4", "G#4"], 124)
    add("strings", L, 3.8, ["E3", "B3", "E4", "G#4", "B4", "E5", "B5"], 124)
    add("strings_lo", L, 3.8, ["E2", "E3"], 120)
    add("choir", L, 3.8, ["E4", "G#4", "B4", "E5"], 120)
    add("lowbrass", L, 3.6, ["E2", "B2"], 124)
    add("tuba", L, 3.6, ["E1"], 120)
    add("timpani", L, 1.0, ["E2"], 127)
    add("tubular", L, 3.8, ["E5"], 110)
    for i, p in enumerate(["E5", "G#5", "B5", "E6"]):
        add("glock", L + i * 0.25, 1.5, [p], 104)
    # the button: the hook's rhythm on bells and celesta, last note ringing
    for o, p in zip([2.0, 2.5, 2.75, 3.0], ["E6", "E6", "F#6", "G#6"]):
        add("glock", L + o, 0.4, [p], 92)
        add("celesta", L + o, 0.4, [p], 84)
    add("glock", L + 3.5, 1.0, ["B6"], 100)
    add("celesta", L + 3.5, 1.0, ["B6"], 92)
    add("tubular", L + 3.5, 1.0, ["E6"], 80)
    for stem in ("brass", "trumpet", "horns", "strings", "strings_lo", "choir", "lowbrass", "tuba"):
        expr(stem, [(L, 127), (L + 1.0, 100), (L + 3.4, 62), (L + 3.95, 30)])


def build():
    cold_open()
    theme_a(8.0)
    chaos(20.0)
    chase(36.0)
    finale(44.0)
    return S, CC


def write_midis(outdir):
    import os
    build()
    paths = {}
    for stem, notes in S.items():
        if not notes:
            continue
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
        chn = 9 if stem == "drums" else 0
        tr.append(mido.Message("program_change", program=PROGRAMS[stem], channel=chn, time=0))
        tr.append(mido.Message("control_change", control=7, value=110, channel=chn, time=0))
        tr.append(mido.Message("control_change", control=11, value=100, channel=chn, time=0))
        evs = []
        for b, d, p, v in notes:
            evs.append((int(round(b * TPB)), 1, ("on", p, v)))
            evs.append((int(round((b + d) * TPB)), 0, ("off", p, 0)))
        for b, val in CC.get(stem, []):
            evs.append((int(round(b * TPB)), 2, ("cc", 11, int(val))))
        # expression ramps: interpolate between consecutive CC points (every 1/16 beat)
        pts = sorted(CC.get(stem, []))
        for (b0, v0), (b1, v1) in zip(pts, pts[1:]):
            steps = int((b1 - b0) * 16)
            for s in range(1, steps):
                bb = b0 + (b1 - b0) * s / steps
                evs.append((int(round(bb * TPB)), 2, ("cc", 11, int(v0 + (v1 - v0) * s / steps))))
        evs.sort(key=lambda e: (e[0], e[1]))
        last = 0
        for tick, _, e in evs:
            dt = tick - last
            last = tick
            if e[0] == "on":
                tr.append(mido.Message("note_on", note=e[1], velocity=max(1, min(127, e[2])), channel=chn, time=dt))
            elif e[0] == "off":
                tr.append(mido.Message("note_off", note=e[1], velocity=0, channel=chn, time=dt))
            else:
                tr.append(mido.Message("control_change", control=e[1], value=max(0, min(127, e[2])), channel=chn, time=dt))
        tr.append(mido.MetaMessage("end_of_track", time=TPB * 8))
        p = os.path.join(outdir, f"{stem}.mid")
        mid.save(p)
        paths[stem] = p
    return paths


if __name__ == "__main__":
    import sys
    print(write_midis(sys.argv[1] if len(sys.argv) > 1 else "."))
