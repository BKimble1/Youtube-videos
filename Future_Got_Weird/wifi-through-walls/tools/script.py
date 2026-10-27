"""The approved narration (locked) and the word normaliser used by alignment, ASR checks and captions."""
import re

LOCKED = """If you hid behind this wall... this machine could STILL WATCH YOU.
Scientists built a system that shoots invisible radio waves THROUGH walls.
And when they bounce off your body, AI creates a moving SKELETON of you.
Raise your hand? It raises its hand.
But here's where it gets CREEPY.
In a separate experiment, scientists used ordinary Wi-Fi signals to IDENTIFY people walking past.
Even WITHOUT their phones.
They tested 197 people... and identified almost EVERYONE correctly.
So imagine walking past a café, and it recognizes you without you doing ANYTHING.
Now would you rather have a CAMERA watching you...
Or Wi-Fi that knows who you are?"""

# How the take speaks the number (measured on the chosen take; the text stays "197").
SPOKEN = {'197': ['one', 'hundred', 'ninety', 'seven'], 'ai': ['a', 'i'], 'wi-fi': ['wifi']}

def norm(text, spoken=True):
    text = text.lower().replace('’', "'").replace('é', 'e')
    out = []
    for w in re.findall(r"[a-z0-9][a-z0-9'\-]*", text):
        w = w.strip("-'")
        if spoken and w in SPOKEN: out += SPOKEN[w]
        else: out.append(w)
    return out

LW = norm(LOCKED)
