#!/usr/bin/env python3
"""V5 sound cues: the V4 cues, read against the V5 narration timings (only the 1:07 line moved), with the cues of the
rebuilt V5 events (tumour growth, twin analysis, patients, vial-to-protein analysis) re-timed to those events. Earlier: V4 sound cues: V3 cues unchanged up to the delivery (1:56); from there re-timed to the rebuilt V4 events. Beds and score sections are
the V3 ones, unchanged. Earlier V3 docstring: V3 sound cues (V2 cues re-timed to the V3 visual events), beds and score sections, all timed from the measured narration words (never hand-typed seconds for
spoken events). Writes v4/audio/sfx_cues_v4.json for tools/v4/make_audio_v4.py.  Run from the episode folder."""
import json, re
D = json.load(open('source/src/v2/data/narration_v5.json'))
W = D['script_words']; DUR = D['duration']
norm = lambda s: re.sub(r"[^a-z0-9']", '', s.replace('’', "'").lower())
def T(phrase, nth=1, end=False):
    want = [norm(x) for x in phrase.split() if norm(x)]
    seen = 0
    for i in range(len(W) - len(want) + 1):
        if all(norm(W[i + k]['text']) == w for k, w in enumerate(want)):
            seen += 1
            if seen == nth:
                return W[i + len(want) - 1]['end'] if end else W[i]['start']
    raise SystemExit('phrase not found: ' + phrase)
TE = lambda p: T(p, end=True)
cues = []
def c(t, kind, gain=1.0, dur=None, pitch=None):
    cues.append({'t': round(t, 3), 'kind': kind, 'gain': gain, **({'dur': dur} if dur else {}), **({'pitch': pitch} if pitch else {})})
# A — the dive, the cell, DNA, the failure, division, survival, cascade
c(0.0, 'heart', 0.8); c(0.9, 'heart', 0.45); c(1.8, 'heart', 0.4)   # first beat lands before the voice (0.49 s); later beats sit under it
c(0.4, 'press', 0.4, 3.2, 0.7); c(2.3, 'whoosh', 0.45, 1.4, 0.8); c(3.0, 'shimmer', 0.4, 1.0)
c(T('And the terrifying part') + 0.8, 'press', 0.5, 1.6, 0.8)
c(T('Deep inside its nucleus'), 'whoosh', 0.7, 2.6, 0.7); c(T('tiny mistakes'), 'click', 0.35, None, 1.4); c(T('tiny mistakes') + 0.4, 'click', 0.3, None, 1.2)
for k, p in enumerate(['grows,', 'stops,', 'dies']):
    c(T(p), 'bind', 0.6, None, 1.0 + 0.2 * k)
c(T('are starting to fail'), 'thud', 0.5); c(T('And eventually, something') + 0.2, 'riser', 0.6, 1.2); c(TE('goes horribly wrong.') - 0.9, 'whoosh', 0.75, 1.6, 0.6)
c(T('The cell divides') + 0.2, 'divide', 0.8, 1.8)
for k in range(6):
    c(T('It ignores signals') + 0.05 + k * 0.2 + 0.55, 'click', 0.28, None, 1.6)
c(T('when the body tries'), 'press', 0.6, 1.4, 0.9); c(T('destroy it'), 'squelch', 0.7, 0.9); c(T('it survives.'), 'thud', 0.55, None, 0.8)
c(T('One cell becomes two.') + 0.2, 'divide', 0.7, 1.2); c(T('Two become four.') + 0.2, 'divide', 0.6, 1.1, 1.1)
c(T('Four become thousands') + 0.1, 'swarm', 0.7, 3.5); c(T('Four become thousands') + 1.0, 'whoosh', 0.6, 2.4, 0.6)
# B — growth, vessels, evasion, escape, blood, liver, body, evolution
c(T('But it gets worse.'), 'thud', 0.5, None, 0.7); c(T('steals nutrients'), 'bubble', 0.5, 1.6)
c(T('recruits blood vessels'), 'stretch', 0.6, 1.8); c(T('hide from the immune system'), 'press', 0.5, 1.4, 1.1)
c(T('Then some cancer cells break free.') + 0.4, 'stretch', 0.7, 1.4, 1.2); c(T('They enter the bloodstream') + 0.3, 'squelch', 0.7, 0.9)
c(T('They enter the bloodstream') + 0.7, 'whoosh', 0.75, 1.6, 0.7)
c(T('travel through the body') + 0.4, 'whoosh', 0.55, 1.6, 0.7); c(T('different organs.') + 0.2, 'thud', 0.45, None, 1.1); c(T('different organs.') + 0.6, 'divide', 0.4, 1.0, 1.2)
c(T("And that's the real nightmare.") - 0.2, 'whoosh', 0.5, 2.2, 0.55); c(T("And that's the real nightmare.") + 1.8, 'thud', 0.45, None, 0.7)
c(T("It's millions of your own cells"), 'swarm', 0.5, 2.5, 1.2); c(T('evolving, and'), 'sweep', 0.4, 1.6)
# C — scan, twin, data, simulation, weakness, people
c(T('But what if we could predict'), 'sweep', 0.6, 2.4); c(T('This is where artificial intelligence') - 0.5, 'whoosh', 0.6, 2.0, 0.7)
c(T('This is where artificial intelligence') + 0.4, 'shimmer', 0.6, 1.6)
# V5 twin analysis: each input lands (scans → layers, biopsy → regions, read → gold region); the stack opens and a scan
# plane passes through it; structures are isolated one by one; three copies, one simulated clock; selection, rewind, dive
c(T('medical scans,') + 0.75, 'drop', 0.5); c(T('tumor samples,') + 0.9, 'drop', 0.5, None, 1.1); c(T('genetic information,') + 0.95, 'drop', 0.5, None, 1.2)
us = T('and using AI'); ca = T('of their cancer')
c(us + 0.45, 'whoosh', 0.5, 1.2, 1.1); c(us + 1.2, 'sweep', 0.45, 1.6); c(us + 1.9, 'shimmer', 0.35, 1.4)
c(ca - 0.1, 'press', 0.35, 0.8, 1.2)
c(ca + 0.6, 'blip', 0.35, None, 0.95); c(T('which would create') + 0.5, 'blip', 0.35, None, 1.05); c(T('virtual battlefield.'), 'blip', 0.35, None, 1.15); c(T('virtual battlefield.') + 0.45, 'blip', 0.4, None, 1.3)
ins = T('Inside that simulation,')
c(ins, 'whoosh', 0.45, 1.1, 1.0)
c(T('test treatment strategies,'), 'blip', 0.4); c(T('test treatment strategies,') + 0.3, 'blip', 0.35, None, 1.12); c(T('test treatment strategies,') + 0.6, 'blip', 0.3, None, 1.25)
c(T('predict how the tumor') - 0.1, 'sweep', 0.4, 2.0)
c(T('search for its weaknesses'), 'bind', 0.5, None, 1.2); c(T('search for its weaknesses') + 0.1, 'sweep', 0.3, 0.6, 1.4); c(T('search for its weaknesses') + 0.6, 'whoosh', 0.5, 1.0, 1.1)
c(T('before choosing how to attack') + 0.2, 'bind', 0.6, None, 1.3)
# V5 patients: one patient, a second, the overview with the same grey drug, the selected one, the designed molecule docks
ins2 = T('Instead of treating every cancer'); ev2 = T('every cancer'); sm2 = T('same way,'); de2 = T('the treatment could be designed'); gr2 = T('growing inside')
c(ins2 + 0.4, 'bubble', 0.3, 1.0, 0.8); c(ev2 + 0.05, 'whoosh', 0.4, 0.9, 0.9); c(sm2 - 0.1, 'sweep', 0.45, 1.6)
c(de2 + 0.2, 'bind', 0.45, None, 1.1); c(de2 + 0.75, 'whoosh', 0.4, 1.2, 0.8)
for k in range(3):
    c(gr2 - 0.05 + 0.18 * k, 'bind', 0.35, None, 1.2 + 0.06 * k)
c(T('But identifying the weakness') - 0.45, 'whoosh', 0.3, 1.0, 1.2)
# D — design, carriers, delivery, apoptosis, resistance
c(T('But identifying the weakness') + 1.0, 'shimmer', 0.4, 1.8)
c(T('AI can help scientists') + 1.32, 'clash', 0.45); c(T('design molecules') + 1.32, 'clash', 0.45, None, 1.1); c(T('that target the proteins') + 1.62, 'bind', 0.75, None, 0.9)
c(T('Imagine microscopic drug carriers'), 'bubble', 0.5, 1.4, 1.3); c(T('traveling through the bloodstream') - 0.2, 'whoosh', 0.6, 1.6, 0.8)
tx = T('traveling through the bloodstream') - 0.2 + (1920 - 700) / 700
c(tx + 0.85, 'squelch', 0.3, 0.5, 1.4); c(tx + 1.45, 'bind', 0.65, None, 1.1)
c(T('delivering their deadly payload') - 0.5, 'whoosh', 0.45, 0.8, 1.3); c(T('delivering their deadly payload') + 0.5, 'pop', 0.65); c(T('delivering their deadly payload') + 1.0, 'bubble', 0.45, 1.0)
for k, dd in enumerate([0, 0.3, 0.55, 0.8]):
    c(T('directly to the tumor.') - 0.05 + dd, 'click', 0.35, None, 1.0 + 0.08 * k)
# D (V4) — the bound cell dies in close-up, a macrophage swallows it; the treated stretch; the survivor, its colony
like = T('Like guided missiles'); goal = T('The goal?'); destroy = T('Destroy the cancer'); sparing = T('sparing as much healthy tissue')
mut = T('mutate,'); res = T('become resistant.'); weapon = T('So AI needs another weapon.'); army = T('Your body already has an army')
c(like + 1.5, 'crackle', 0.35, 1.8, 0.8)
c(like + 4.4, 'squelch', 0.35, 0.8, 0.8); c(like + 4.7, 'bubble', 0.25, 0.9, 0.9)
c(destroy - 0.6, 'whoosh', 0.35, 1.4, 0.6)
c(sparing + 0.3, 'squelch', 0.3, 0.7, 0.75); c(sparing + 1.2, 'squelch', 0.28, 0.7, 0.85)
c(T("But there's still a problem."), 'thud', 0.4, None, 0.8); c(mut - 0.1, 'sweep', 0.35, 0.8)
for k in range(3):
    c(mut + 0.95 + 0.35 * k, 'click', 0.28, None, 0.8 + 0.05 * k)
c(res + 0.1, 'divide', 0.45, 1.3, 0.9); c(res + 2.0, 'divide', 0.3, 1.3, 1.0); c(res + 3.0, 'divide', 0.22, 1.3, 1.1)
c(weapon + 0.6, 'whoosh', 0.3, 1.2, 0.7)
# the army in the vessel: rolling, one cell squeezes through the wall; out into the tissue; evasion
c(army, 'swarm', 0.45, 3.5, 0.9); c(army + 1.7, 'stretch', 0.4, 1.4, 1.0)
c(T("It's called your immune system.") - 0.1, 'whoosh', 0.35, 1.2, 0.7)
c(T('disguise itself,'), 'sweep', 0.35, 0.8, 0.7); c(T('suppress immune defenses,'), 'press', 0.5, 1.2, 0.8); c(T('or become difficult') + 0.2, 'shimmer', 0.22, 1.0, 0.8)
# E (V4) — fingerprints on the membrane, the read, routes, learning
c(T('But tumors can carry') + 0.1, 'whoosh', 0.55, 1.0, 1.2); c(T('unique molecular fingerprints.'), 'shimmer', 0.6, 1.4)
c(T('identify those fingerprints') - 0.3, 'sweep', 0.5, 1.2); c(T('fingerprints and guide') + 0.1, 'shimmer', 0.3, 1.0, 1.2)
vac = T('cancer vaccines'); spec = T('specialized immune-cell treatments.')
c(T('and guide personalized') + 0.75, 'bubble', 0.45, 1.2); c(vac + 0.85, 'bind', 0.45, None, 1.15); c(vac + 1.0, 'divide', 0.25, 1.0, 1.3)
c(spec - 0.05, 'pop', 0.35, None, 1.4); c(spec + 0.6, 'divide', 0.3, 1.0, 1.3); c(spec + 1.3, 'divide', 0.25, 1.0, 1.4)
c(T('hunt.') - 0.05, 'bind', 0.65, None, 1.2)
# D (V4) kills on the colony
rec = T('They recognize a cancer cell.'); lock = T('Lock onto it.'); dst = T('And destroy it.'); n1 = T('Then they move to the next.'); n2 = T('And the next.')
c(rec + 0.1, 'click', 0.45, None, 1.0); c(lock, 'bind', 0.8, None, 0.85)
c(dst + 0.25, 'squelch', 0.7, 0.8); c(dst + 0.55, 'crackle', 0.45, 1.2)
c(n1 + 1.15, 'bind', 0.6, None, 0.95); c(n1 + 1.4, 'squelch', 0.5, 0.6)
c(n2 + 0.2, 'bind', 0.55, None, 1.05); c(n2 + 0.5, 'squelch', 0.45, 0.6); c(n2 + 0.75, 'squelch', 0.4, 0.6, 1.1)
c(T('Suddenly, the tumor') - 0.2, 'whoosh', 0.6, 2.2, 0.6); c(T('Suddenly, the tumor') + 0.6, 'crackle', 0.5, 3.5)
# F (V4) — clearance, survivors, regrowth, shedding, blood, needle, tube, reads, redesign, precision attack
c(T('But destroying the visible tumor'), 'press', 0.5, 2.0, 0.8)
c(T('surviving cancer') + 0.2, 'divide', 0.4, 1.0, 1.1); c(T('bring the disease back.') + 0.2, 'divide', 0.35, 1.0, 1.2)
c(T('And this is where things get really'), 'bubble', 0.45, 1.6, 1.4); c(T('Cancer can leave microscopic traces') + 0.1, 'whoosh', 0.6, 1.2, 0.8)
an = T('By analyzing these signals,')
c(an - 0.05, 'squelch', 0.3, 0.5, 1.3); c(an + 0.35, 'bubble', 0.35, 1.0, 0.8); c(an + 0.9, 'sweep', 0.3, 0.8, 0.6)
# V5 read: dive into the plasma, the fragment levels and unzips, reference, the change lights, more reads, a later
# change, isolation, the residue lands and swells, the old drug is blocked, the redesigned one seats
aic = T('AI could help detect')
c(aic + 0.05, 'whoosh', 0.45, 0.9, 0.7); c(aic + 0.8, 'stretch', 0.3, 0.8, 1.3)
for k in range(4):
    c(aic + 1.1 + 0.11 * k, 'click', 0.22, None, 1.2 + 0.05 * k)
c(T('signs of a returning') - 0.05, 'sweep', 0.25, 0.6, 1.2); c(T('returning tumor,'), 'blip', 0.45, None, 0.9)
c(T('returning tumor,') + 0.35, 'drop', 0.25, None, 1.1); c(T('returning tumor,') + 0.55, 'drop', 0.22, None, 1.2)
ch = T("identify how it's changing,"); gd = T('and guide a new treatment'); bf2 = T('before it grows')
c(ch + 0.2, 'drop', 0.3, None, 1.0); c(ch + 0.45, 'blip', 0.4, None, 1.1); c(T("it's changing,") - 0.05, 'shimmer', 0.3, 1.0, 1.1)
c(gd + 0.15, 'pop', 0.35, None, 1.2); c(gd + 0.75, 'bind', 0.45, None, 0.9); c(gd + 0.95, 'press', 0.35, 0.8, 1.0)
c(bf2 + 0.3, 'clash', 0.45, None, 0.9); c(bf2 + 0.45, 'whoosh', 0.25, 0.5, 1.3)
c(bf2 + 0.5, 'bubble', 0.3, 0.8, 1.2); c(bf2 + 1.25, 'bind', 0.55, None, 1.2)
ev = T('An evolving enemy,'); met = T('met by an evolving defense.'); dfn = T('evolving defense.')
c(ev + 0.1, 'sweep', 0.3, 0.8, 0.9); c(ev + 1.2, 'squelch', 0.25, 0.6, 0.9)
c(met - 0.2, 'whoosh', 0.3, 0.9, 1.0); c(dfn + 0.3, 'bind', 0.55, None, 1.1); c(dfn + 0.8, 'squelch', 0.5, 0.7); c(dfn + 1.0, 'crackle', 0.35, 1.2)
# G (V4) — pull-out to the person and the twin; tumours in different organs; universal vs matched; the loop; resolution; the cell
c(T("And that's the breakthrough"), 'whoosh', 0.4, 2.0, 0.6); c(T("And that's the breakthrough") + 1.6, 'shimmer', 0.5, 2.0)
no = T("Cancer isn't one disease")
for k in range(5):
    c(no + 0.1 + k * 0.3, 'blip', 0.25, None, 0.9 + 0.05 * k)
c(TE('with one weakness.') - 0.6, 'whoosh', 0.45, 1.0, 1.1)
c(T('Every tumor can be different.') + 0.1, 'shimmer', 0.35, 1.4, 0.9)
so = T('So imagine a system')
for k in range(5):
    c(so + 0.85 + k * 0.32, 'clash', 0.28, None, 0.9 + 0.05 * k)
c(TE('one universal drug.') + 0.2, 'bind', 0.55, None, 1.2); c(TE('one universal drug.') + 0.35, 'bind', 0.35, None, 1.35)
c(T('It studies each cancer,') + 0.05, 'sweep', 0.4, 1.2); c(T('predicts its behavior,'), 'shimmer', 0.3, 1.0, 1.1)
dsn = T('designs a targeted attack,'); act = T('activates the immune system,'); wt = T('and watches for anything')
c(dsn - 0.05, 'whoosh', 0.35, 0.8, 1.2); c(dsn + 1.0, 'bind', 0.55, None, 1.2)
c(act + 0.3, 'bind', 0.45, None, 1.0); c(act + 0.65, 'divide', 0.3, 1.0, 1.3)
c(wt - 0.3, 'whoosh', 0.35, 1.0, 0.8); c(TE('anything that survives.') - 0.35, 'blip', 0.45, None, 1.2)
c(T('A different answer for every cancer.') + 0.3, 'shimmer', 0.6, 2.0)
fd = T('Imagine finding it...')
c(fd - 0.1, 'swarm', 0.25, 1.2, 1.3)
c(fd + 0.35, 'click', 0.4, None, 1.1); c(fd + 0.75, 'bind', 0.65, None, 1.0); c(fd + 1.05, 'squelch', 0.5, 0.7); c(fd + 1.25, 'crackle', 0.35, 1.6)
c(fd + 2.85, 'squelch', 0.28, 0.8, 0.8); c(fd + 3.1, 'bubble', 0.2, 0.8, 0.9)
c(TE('to become a tumor.') + 0.05, 'whoosh', 0.5, 2.8, 0.6)
c(DUR - 1.6, 'heart', 0.45)
beds = [  # [start, end, kind]
    [0, 3.1, 'room'], [3.1, 8.0, 'tissue'], [8.0, 20.6, 'micro'], [20.6, 48.6, 'tissue'], [48.6, 50.3, 'blood'], [50.3, 57.4, 'room'],
    [57.4, 66.5, 'tissue'], [66.5, 97.7, 'digital'], [97.7, 107.4, 'micro'], [107.4, 112.5, 'blood'], [112.5, 133.1, 'tissue'], [133.1, 145.8, 'tissue'],
    [145.8, 158.6, 'micro'], [158.6, 182.2, 'tissue'], [182.2, 186.5, 'blood'], [186.5, 195.5, 'digital'], [195.5, 199.3, 'tissue'], [199.3, 221.5, 'digital'],
    [221.5, 228.0, 'tissue'], [228.0, DUR, 'room'],
]
score = [  # [start, end, mood, optional mark]
    [0, 18.2, 'tense'], [18.2, 29.0, 'survivor', T('it survives.')], [29.0, 36.3, 'build'], [36.3, 45.4, 'tense'], [45.4, 56.5, 'drive'], [56.5, 63.9, 'tense'],
    [63.9, 71.2, 'reveal'], [71.2, 90.7, 'build'], [90.7, 97.7, 'reflect'], [97.7, 107.4, 'reveal'], [107.4, 120.6, 'drive'], [120.6, 125.3, 'calm'],
    [125.3, 133.1, 'survivor', T('become resistant.')], [133.1, 145.5, 'build'], [145.5, 155.4, 'reveal'], [155.4, 171.1, 'drive'], [171.1, 186.5, 'reflect'],
    [186.5, 199.3, 'build'], [199.3, 221.5, 'warm'], [221.5, DUR, 'hope'],
]
json.dump({'cues': cues, 'beds': beds, 'score': score, 'duration': DUR}, open('v5/audio/sfx_cues_v5.json', 'w'), indent=1)
print(len(cues), 'cues;', len(beds), 'beds;', len(score), 'score sections; duration', DUR)
