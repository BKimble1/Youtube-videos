"""The locked narration as words (production/NARRATION_LOCKED.txt, verbatim) and the caption chunks."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, 'production/NARRATION_LOCKED.txt')).read().strip()
SENTENCES = [s.strip() for s in TEXT.split('\n') if s.strip()]
DW = TEXT.split()
def norm(w): return re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))
# caption chunks: (number of words, emphasised words). Phrase-level, 2-6 words, matching the delivery.
CHUNKS = [(4, ['fish', 'swims']), (3, ['human', 'heart', 'cells']),
          (4, ["doesn't"]), (3, ['heart']),
          (2, []), (5, ['living', 'heart', 'muscle']), (4, ['both', 'sides']), (4, ['artificial', 'tail']),
          (4, ['contracts']), (5, ['pulls']), (5, ['triggering', 'contract']),
          (7, ['over', 'again']), (3, ['propelling']), (3, ['water']),
          (6, ['motor']),
          (5, ['matured']), (5, ['faster']),
          (5, ["weren't"]), (4, ['fish']),
          (4, ['figuring']), (6, ['human', 'heart'])]
assert sum(c[0] for c in CHUNKS) == len(DW), (sum(c[0] for c in CHUNKS), len(DW))
