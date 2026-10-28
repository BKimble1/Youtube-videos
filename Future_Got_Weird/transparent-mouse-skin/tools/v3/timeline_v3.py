"""V3 timeline: beats (s) from the measured narration (the same take as V1/V2) and the V2 mix's effect cues, which V3
keeps unchanged (the drop landing 7.99, the applicator contact 8.85, the dive 9.18, the pull-out 19.25, the rinse
squirt 20.31, the loop brushing 24.73); the shots and the transitions between them."""
import json, os

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_bj = json.load(open(os.path.join(EP, 'audio/beats_v2.json')))
DUR = _bj['duration']
NFRAMES = int(round(DUR * 30))
_W = _bj['words']
def ws(word, n=0): return [w for w in _W if w['word'] == word][n]['start']
def we(word, n=0): return [w for w in _W if w['word'] == word][n]['end']

B = dict(
    # lab: the drop swells on the pipette, lets go and lands with the mix's drop (7.99)
    dropGrow=7.30, dropFree=7.94, dropLand=7.99,
    swabIn=8.00, dip0=8.22, dip1=8.40,
    contact=8.87, dive0=9.30,
    tis0=9.98, water=ws('water'), fat=ws('fat', 0),
    beam0=ws('bend', 0) - 0.05,              # 11.44: light enters as "bend" is said
    hideCam0=ws('hiding') - 0.1, hideCam1=we('underneath', 1) - 0.1,
    dye0=14.75, dyeIn=ws('dye', 1) - 0.05, dyeEnd=we('parts'),
    ba0=we('parts'), clear0=ws('bend', 1) + 0.25,  # the same light path again, then the clearing sweeps down it
    bacam0=ws('behave') + 0.1, bacam1=ws('fat', 1) + 0.05,
    out0=ws('fat', 1) + 0.15, out1=we('fat', 1) + 0.35,
    rinse0=20.31,
)

# shot: (start, end) of its visible span (transitions overlap neighbours)
SHOTS = {
    'hook': (0.0, 2.62), 'side': (2.62, 4.72), 'graze': (4.72, 6.70), 'lab': (6.70, 8.52), 'apply': (8.52, 10.10),
    'tissue': (9.85, 14.75), 'dye': (14.75, 17.05), 'tissue2': (17.05, 19.90), 'wide': (19.60, 20.31),
    'wash': (20.31, 23.70), 'loop': (23.45, DUR),
}
# transitions between consecutive shots: (a, b, t0, t1, kind)
TRANS = [('apply', 'tissue', 9.85, 10.10, 'dissolve'),
         ('tissue2', 'wide', 19.60, 19.90, 'dissolve'), ('wash', 'loop', 23.45, 23.70, 'dissolve')]
ORDER = ['hook', 'side', 'graze', 'lab', 'apply', 'tissue', 'dye', 'tissue2', 'wide', 'wash', 'loop']

def _e(u): u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)

def layers_at(t):
    """[(shot, weight)] for the frame at t: one shot, or two in a dissolve"""
    for a, b, t0, t1, kind in TRANS:
        if t0 <= t < t1:
            u = _e((t - t0) / (t1 - t0)); return [(a, 1 - u), (b, u)]
    cand = [n for n in ORDER if SHOTS[n][0] <= t < SHOTS[n][1]]
    return [(cand[-1] if cand else 'loop', 1.0)]
