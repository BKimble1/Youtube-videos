"""The approved narration (authoritative text: production/NARRATION_APPROVED.txt) and its normalised spoken word list.
The numeral "160" is spoken by the narrator as "one hundred sixty" (both recognisers hear exactly that), so the
spoken word list expands it; the written text is never changed."""
import os, re
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCKED = open(os.path.join(EP, 'production/NARRATION_APPROVED.txt'), encoding='utf-8').read().strip()
SPOKEN = {'160': 'one hundred sixty'}
def norm(s):
    s = s.lower().replace('’', "'")
    for k, v in SPOKEN.items(): s = re.sub(rf'\b{k}\b', v, s)
    return re.sub(r"[^a-z' ]", ' ', s).split()
LW = norm(LOCKED)
