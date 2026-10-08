"""Prefix each stdin line with seconds since start (for render progress timing)."""
import sys, time
t0 = time.time()
for line in sys.stdin:
    sys.stdout.write(f"{time.time() - t0:9.3f} {line}")
    sys.stdout.flush()
