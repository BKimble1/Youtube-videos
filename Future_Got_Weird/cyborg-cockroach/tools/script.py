"""The locked narration (production/NARRATION_LOCKED.txt) and word normalisation shared by the narration tools."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCKED_PATH = os.path.join(ROOT, 'production', 'NARRATION_LOCKED.txt')


def locked_text():
    with open(LOCKED_PATH, encoding='utf-8') as f:
        return f.read()


def locked_words():
    """Display words in order, punctuation attached, exactly as written."""
    return locked_text().split()


def norm(w):
    w = w.lower().replace('’', "'").replace('‘', "'")
    w = re.sub(r"[^a-z0-9']", '', w)
    return w


def norm_words(text_or_words):
    ws = text_or_words.split() if isinstance(text_or_words, str) else text_or_words
    return [n for n in (norm(w) for w in ws) if n]


if __name__ == '__main__':
    ws = locked_words()
    print(len(ws), 'words')
    print(' '.join(norm_words(ws)))
