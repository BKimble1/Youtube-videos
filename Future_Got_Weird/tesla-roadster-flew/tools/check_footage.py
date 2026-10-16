#!/usr/bin/env python3
"""Report which footage slots are filled and plausible. Exit 1 if any slot needed by the target is missing.
Usage: check_footage.py short|companion"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEED = {
    'short': ['F1_AIRBORNE', 'F2_RAMP_CLIMB', 'F3_INVERTED', 'F4_LAUNCH_ROLL', 'F5_LANDING', 'F6_FIVE_VEHICLES'],
    # F8 (Optimus) is no longer used: the supplied recordings don't show it, so the companion dropped that line
    'companion': ['F1_AIRBORNE', 'F2_RAMP_CLIMB', 'F3_INVERTED', 'F4_LAUNCH_ROLL', 'F5_LANDING', 'F6_FIVE_VEHICLES', 'F7_ACCEL_RUN'],
}
# seconds each slot must have before / after its `in` frame (the Short's shot lengths and offsets; F1 loops from in - 3.4 s)
NEED_SHORT = {'F1_AIRBORNE': (3.4, 2.4), 'F2_RAMP_CLIMB': (0, 2.0), 'F3_INVERTED': (0, 2.05), 'F4_LAUNCH_ROLL': (0, 8.28),
              'F5_LANDING': (0, 1.98), 'F6_FIVE_VEHICLES': (0, 4.23), 'F7_ACCEL_RUN': (0, 9.8), 'F8_OPTIMUS_SEAT': (0, 8.1)}
target = sys.argv[1] if len(sys.argv) > 1 else 'short'
slots = json.load(open(os.path.join(ROOT, 'source/src/data/footage.json')))['slots']
bad = []
for sid in NEED[target]:
    s = slots[sid]
    if not s['file']:
        bad.append(sid); print(f'MISSING  {sid:18s} {s["label"]}'); continue
    p = os.path.join(ROOT, 'source/public/footage', s['file'])
    if not os.path.exists(p):
        bad.append(sid); print(f'NO FILE  {sid:18s} {p}'); continue
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout or 0)
    pre, post = NEED_SHORT[sid]
    ok = s['in'] - pre >= -0.01 and s['in'] + post <= dur + 0.01
    print(f'{"OK" if ok else "RANGE?":8s} {sid:18s} {s["file"]} in={s["in"]}s (file {dur:.1f}s)')
    if not ok: bad.append(sid)
print(f'{target}: {len(NEED[target]) - len(bad)}/{len(NEED[target])} slots ready')
sys.exit(1 if bad else 0)
