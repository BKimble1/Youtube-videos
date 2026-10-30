#!/usr/bin/env python3
"""Example hook audio script (copy to hNN.py). Times come from the hook's animation (keep them in step with Hook.tsx)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
H = '01'
fx, amb = buf(), buf()
place(amb, underwater(), 0, 0, 'underwater bed')
place(fx, bubbles(1.2, 18, 600, 1600, 1), 0.0, -4, 'bubbles at open')
place(fx, click(), 1.0, -6, 'leg grip tick')
mix(H, fx, amb, fx_lufs=-27, notes='example')
