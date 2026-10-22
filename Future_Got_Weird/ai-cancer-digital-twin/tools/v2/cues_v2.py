#!/usr/bin/env python3
"""V2 sound cues, beds and score sections, all timed from the measured narration words (never hand-typed seconds for
spoken events). Writes v2/audio/sfx_cues_v2.json for tools/v2/make_audio_v2.py.  Run from the episode folder."""
import json, re
D = json.load(open('source/src/v2/data/narration_v2.json'))
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
c(0.0, 'heart', 0.8); c(0.9, 'heart', 0.75); c(1.8, 'heart', 0.7)
c(0.4, 'press', 0.7, 3.2, 0.7); c(2.3, 'whoosh', 0.6, 1.4, 0.8); c(3.0, 'shimmer', 0.4, 1.0)
c(T('And the terrifying part') + 0.8, 'press', 0.5, 1.6, 0.8)
c(T('Deep inside its nucleus'), 'whoosh', 0.7, 2.6, 0.7); c(T('tiny mistakes'), 'click', 0.35, None, 1.4); c(T('tiny mistakes') + 0.4, 'click', 0.3, None, 1.2)
for k, p in enumerate(['grows,', 'stops,', 'dies']):
    c(T(p), 'bind', 0.6, None, 1.0 + 0.2 * k)
c(T('are starting to fail'), 'thud', 0.5); c(T('And eventually, something') + 0.2, 'riser', 0.6, 1.2); c(TE('goes horribly wrong.') - 0.9, 'whoosh', 0.75, 1.6, 0.6)
c(T('The cell divides') + 0.2, 'divide', 0.8, 1.8)
for k in range(6):
    c(T('It ignores signals') + 0.05 + k * 0.2 + 0.55, 'click', 0.28, None, 1.6)
c(T('when the body tries'), 'press', 0.6, 1.4, 0.9); c(T('destroy it'), 'squelch', 0.7, 0.9); c(T('it survives.'), 'thud', 0.8, None, 0.8)
c(T('One cell becomes two.') + 0.2, 'divide', 0.7, 1.2); c(T('Two become four.') + 0.2, 'divide', 0.6, 1.1, 1.1)
c(T('Four become thousands') + 0.1, 'swarm', 0.7, 3.5); c(T('Four become thousands') + 1.0, 'whoosh', 0.6, 2.4, 0.6)
# B — growth, vessels, evasion, escape, blood, liver, body, evolution
c(T('But it gets worse.'), 'thud', 0.7, None, 0.7); c(T('steals nutrients'), 'bubble', 0.5, 1.6)
c(T('recruits blood vessels'), 'stretch', 0.6, 1.8); c(T('hide from the immune system'), 'press', 0.5, 1.4, 1.1)
c(T('Then some cancer cells break free.') + 0.4, 'stretch', 0.7, 1.4, 1.2); c(T('They enter the bloodstream') + 0.3, 'squelch', 0.7, 0.9)
c(T('They enter the bloodstream') + 0.7, 'whoosh', 0.75, 1.6, 0.7)
c(T('can create new tumors') + 0.8, 'squelch', 0.6, 0.8, 0.8); c(T('different organs.') + 0.3, 'divide', 0.5, 1.0, 1.2)
c(T("And that's the real nightmare.") - 0.2, 'whoosh', 0.8, 2.2, 0.55); c(T("And that's the real nightmare.") + 1.8, 'thud', 0.7, None, 0.7)
c(T("It's millions of your own cells"), 'swarm', 0.5, 2.5, 1.2); c(T('evolving, and'), 'sweep', 0.4, 1.6)
# C — scan, twin, data, simulation, weakness, people
c(T('But what if we could predict'), 'sweep', 0.6, 2.4); c(T('This is where artificial intelligence') - 0.5, 'whoosh', 0.6, 2.0, 0.7)
c(T('This is where artificial intelligence') + 0.4, 'shimmer', 0.6, 1.6)
for p in ['medical scans,', 'tumor samples,', 'genetic information,']:
    c(T(p), 'drop', 0.55)
c(T('detailed digital copy') - 0.3, 'whoosh', 0.6, 1.4, 1.1); c(T('detailed digital copy') + 0.5, 'shimmer', 0.6, 2.0)
c(T('virtual battlefield.'), 'press', 0.5, 1.4, 1.2)
c(T('test treatment strategies,'), 'blip', 0.4); c(T('test treatment strategies,') + 0.3, 'blip', 0.35, None, 1.12); c(T('test treatment strategies,') + 0.6, 'blip', 0.3, None, 1.25)
c(T('predict how the tumor'), 'sweep', 0.4, 1.2); c(T('search for its weaknesses'), 'whoosh', 0.55, 1.2, 1.1); c(T('before choosing how to attack') + 0.2, 'bind', 0.6, None, 1.3)
c(T('Instead of treating every cancer') + 0.6, 'sweep', 0.45, 2.0); c(T('the exact tumor growing') + 0.4, 'shimmer', 0.5, 1.6)
# D — design, carriers, delivery, apoptosis, resistance
c(T('But identifying the weakness') + 1.0, 'shimmer', 0.4, 1.8)
c(T('AI can help scientists') + 1.1, 'clash', 0.5); c(T('design molecules') + 1.0, 'clash', 0.5, None, 1.1); c(T('that target the proteins') + 1.0, 'bind', 0.8, None, 0.9)
c(T('Imagine microscopic drug carriers'), 'bubble', 0.5, 1.4, 1.3); c(T('traveling through the bloodstream') - 0.2, 'whoosh', 0.6, 1.6, 0.8)
c(T('recognizing markers'), 'click', 0.4, None, 1.1); c(T('recognizing markers') + 0.35, 'click', 0.35); c(T('recognizing markers') + 0.7, 'click', 0.35, None, 0.9)
c(T('delivering their deadly payload') - 0.5, 'whoosh', 0.5, 0.8, 1.3); c(T('delivering their deadly payload') + 0.3, 'pop', 0.7); c(T('delivering their deadly payload') + 0.9, 'bubble', 0.5, 1.2)
c(T('Like guided missiles'), 'whoosh', 0.55, 3.2, 0.6)
c(T('Destroy the cancer') - 0.6, 'crackle', 0.6, 3.5)
c(T("But there's still a problem."), 'thud', 0.6, None, 0.8); c(T('mutate,') - 0.1, 'sweep', 0.35, 0.8)
c(T('mutate,') + 0.5, 'click', 0.3, None, 0.8); c(T('mutate,') + 0.85, 'click', 0.3, None, 0.8)
c(T('become resistant.'), 'divide', 0.7, 1.3, 0.9)
# E — army, evasion, fingerprints, routes, learn, kills, swarm
c(T('Your body already has an army'), 'swarm', 0.6, 3.5, 0.9)
c(T('disguise itself,'), 'sweep', 0.35, 0.8, 0.7); c(T('suppress immune defenses,'), 'press', 0.6, 1.2, 0.8)
c(T('But tumors can carry') + 0.1, 'whoosh', 0.55, 1.0, 1.2); c(T('unique molecular fingerprints.'), 'shimmer', 0.6, 1.4)
c(T('identify those fingerprints'), 'sweep', 0.5, 1.2)
c(T('cancer vaccines') - 0.4, 'bubble', 0.5, 1.2); c(T('specialized immune-cell treatments.'), 'divide', 0.5, 1.2, 1.3)
c(T('exactly what to hunt.'), 'bind', 0.7, None, 1.2)
c(T('They recognize a cancer cell.') + 0.4, 'click', 0.5, None, 1.0); c(T('Lock onto it.'), 'bind', 0.8, None, 0.85)
c(T('And destroy it.') + 0.1, 'squelch', 0.7, 0.8); c(T('And destroy it.') + 0.4, 'crackle', 0.5, 1.2)
c(T('Then they move to the next.') + 0.9, 'bind', 0.6, None, 0.95); c(T('Then they move to the next.') + 1.1, 'squelch', 0.5, 0.6)
c(T('And the next.') + 0.5, 'bind', 0.6, None, 1.05); c(T('And the next.') + 0.8, 'squelch', 0.5, 0.6)
c(T('Suddenly, the tumor') - 0.2, 'whoosh', 0.6, 2.2, 0.6); c(T('Suddenly, the tumor') + 0.6, 'crackle', 0.5, 3.5)
# F — remnant, fragments, blood, tube, reads, loop
c(T('But destroying the visible tumor'), 'press', 0.5, 2.0, 0.8); c(T('bring the disease back.') - 0.4, 'divide', 0.6, 1.0, 1.1)
c(T('And this is where things get really'), 'bubble', 0.45, 1.6, 1.4); c(T('Cancer can leave microscopic traces') + 0.1, 'whoosh', 0.6, 1.2, 0.8)
c(T('By analyzing these signals,'), 'thud', 0.4, None, 1.2); c(T('By analyzing these signals,') + 0.2, 'sweep', 0.35, 0.9, 0.6)
c(T('detect signs of a returning tumor,') - 0.3, 'whoosh', 0.5, 0.8, 1.2)
for k in range(5):
    c(T('detect signs of a returning tumor,') + k * 0.28, 'drop', 0.3, None, 1.0 + 0.06 * k)
c(T("identify how it's changing,"), 'blip', 0.45, None, 0.9); c(T('and guide a new treatment') + 0.3, 'bind', 0.55, None, 1.2)
c(T('An evolving enemy,') + 0.4, 'bind', 0.5, None, 0.9); c(T('met by an evolving defense.') + 0.2, 'bind', 0.55, None, 1.1); c(T('met by an evolving defense.') + 1.2, 'bind', 0.55, None, 1.3)
# G — breakthrough, gallery, keys, loop, return, the cell found
c(T("And that's the breakthrough"), 'shimmer', 0.55, 2.0); c(T("Cancer isn't one disease"), 'press', 0.4, 1.4, 1.1)
for k in range(5):
    c(T('So imagine a system') + 0.4 + k * 0.62, 'clash', 0.35, None, 0.9 + 0.05 * k)
c(T('one universal drug.') + 0.1, 'bind', 0.6, None, 1.2)
for k, p in enumerate(['studies each cancer,', 'predicts its behavior,', 'designs a targeted attack,', 'activates the immune system,', 'and watches for anything']):
    c(T(p), 'blip', 0.45, None, 1.0 + 0.12 * k)
c(T('A different answer for every cancer.') + 0.3, 'shimmer', 0.6, 2.0)
r0 = T('And remember that single cell')
c(r0, 'heart', 0.8); c(r0 + 0.75, 'heart', 0.75); c(r0 + 1.5, 'heart', 0.7)
c(r0 + 0.3, 'press', 0.6, 2.6, 0.7); c(r0 + 1.9, 'whoosh', 0.6, 1.2, 0.8); c(r0 + 2.5, 'shimmer', 0.4, 0.9)
c(T('before it ever has the chance') + 0.35, 'bind', 0.7, None, 1.0); c(T('before it ever has the chance') + 0.8, 'crackle', 0.4, 1.2)
c(TE('to become a tumor.') + 0.05, 'whoosh', 0.55, 2.6, 0.6)
beds = [  # [start, end, kind]
    [0, 3.1, 'room'], [3.1, 8.0, 'tissue'], [8.0, 20.6, 'micro'], [20.6, 48.6, 'tissue'], [48.6, 51.5, 'blood'], [51.5, 55.0, 'tissue'], [55.0, 57.4, 'room'],
    [57.4, 66.5, 'tissue'], [66.5, 97.7, 'digital'], [97.7, 107.4, 'micro'], [107.4, 112.5, 'blood'], [112.5, 133.1, 'tissue'], [133.1, 145.8, 'tissue'],
    [145.8, 158.6, 'micro'], [158.6, 182.2, 'tissue'], [182.2, 186.5, 'blood'], [186.5, 195.5, 'digital'], [195.5, 199.3, 'tissue'], [199.3, 221.5, 'digital'],
    [221.5, 224.5, 'room'], [224.5, 228.0, 'tissue'], [228.0, DUR, 'room'],
]
score = [  # [start, end, mood, optional mark]
    [0, 18.2, 'tense'], [18.2, 29.0, 'survivor', T('it survives.')], [29.0, 36.3, 'build'], [36.3, 45.4, 'tense'], [45.4, 56.5, 'drive'], [56.5, 63.9, 'tense'],
    [63.9, 71.2, 'reveal'], [71.2, 90.7, 'build'], [90.7, 97.7, 'reflect'], [97.7, 107.4, 'reveal'], [107.4, 120.6, 'drive'], [120.6, 125.3, 'calm'],
    [125.3, 133.1, 'survivor', T('become resistant.')], [133.1, 145.5, 'build'], [145.5, 155.4, 'reveal'], [155.4, 171.1, 'drive'], [171.1, 186.5, 'reflect'],
    [186.5, 199.3, 'build'], [199.3, 221.5, 'warm'], [221.5, DUR, 'hope'],
]
json.dump({'cues': cues, 'beds': beds, 'score': score, 'duration': DUR}, open('v2/audio/sfx_cues_v2.json', 'w'), indent=1)
print(len(cues), 'cues;', len(beds), 'beds;', len(score), 'score sections; duration', DUR)
