"""Validate that the text sent to TTS is the locked narration, in order, with only eleven_v4 direction tags added.

Usage: python3 tools/check_tts_text.py script/narration_locked.json audio/narration/tts_input.txt
Strips [bracketed] direction tags, splits on blank lines, and compares each block to the locked string exactly.
"""
import json, re, sys
locked = json.load(open(sys.argv[1]))
sent = open(sys.argv[2]).read()
tags = re.findall(r'\[[^\]]+\]', sent)
blocks = [re.sub(r'\s+', ' ', re.sub(r'\[[^\]]+\]', '', b)).strip() for b in re.split(r'\n\s*\n', sent.strip())]
ok = blocks == locked
for i, (a, b) in enumerate(zip(locked, blocks + [''] * len(locked))):
    print(f'block {i+1}:', 'OK' if a == b else f'MISMATCH\n  locked: {a}\n  sent:   {b}')
print('direction tags (not spoken):', tags)
print('blocks sent:', len(blocks), 'locked:', len(locked))
print('RESULT:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
