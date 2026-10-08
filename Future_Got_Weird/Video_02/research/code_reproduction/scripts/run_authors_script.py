"""Run one of the authors' paper/ entry scripts UNMODIFIED, with instrumentation.

Usage (run with `python -I` from any cwd):
    python -I run_authors_script.py <paper_dir> <script.py> <out_dir> [seed]

What this runner does (and does not do):
  * It does NOT edit any authors' file. It chdir()s into <paper_dir> because the
    authors' scripts use relative paths ('configs/...', 'captured_data', '../canons').
  * Because `python -I` drops cwd/script-dir from sys.path, we add <paper_dir>
    explicitly. Every module imported from there (tracking.py, utils.py, data/*.py,
    train/*.py) was read line-by-line before running; stale __pycache__ removed.
  * Seeds numpy + torch (the authors set no seed; their particle filter is
    stochastic). This is the only behavioural change and it is external.
  * Wraps ParticleModel.evaluate_particles / resample / propagate with timers
    to record OUR per-frame CPU runtime. Timing wrappers call the originals.
  * Replaces utils.convert_pngs_to_video with a wrapper that first calls the
    authors' function and, only if the 'avc1' codec is unavailable in this
    opencv build, writes the same frames with 'mp4v' (documented deviation of
    the *visualisation container only*).
  * After the script finishes, dumps `states` and `scores` (the variables the
    authors' script builds) to an .npz in <out_dir>, plus timing JSON.
"""
import json
import os
import runpy
import sys
import time

paper_dir, script, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
seed = int(sys.argv[4]) if len(sys.argv) > 4 else 0
paper_dir = os.path.abspath(paper_dir)
out_dir = os.path.abspath(out_dir)
RUN_OUT = out_dir
os.makedirs(out_dir, exist_ok=True)

sys.path.insert(0, paper_dir)
os.chdir(paper_dir)

import numpy as np  # noqa: E402
import torch  # noqa: E402

np.random.seed(seed)
torch.manual_seed(seed)
torch.set_num_threads(os.cpu_count() or 1)

import utils  # authors' paper/utils.py  # noqa: E402

timing = {"seed": seed, "torch": torch.__version__, "numpy": np.__version__,
          "python": sys.version.split()[0], "cpu_threads": torch.get_num_threads(),
          "phases": {}, "per_frame_s": []}

if script in ("tracking.py", "cam_localization.py"):
    from train import model as _model  # noqa: E402
    from train import canon as _canon  # noqa: E402

    _orig_eval = _model.ParticleModel.evaluate_particles
    _orig_res = _model.ParticleModel.resample_particles
    _orig_prop = _model.ParticleModel.propagate_particles
    _frame = {}

    def _eval(self, *a, **k):
        _frame["t0"] = time.perf_counter()
        return _orig_eval(self, *a, **k)

    def _res(self, *a, **k):
        return _orig_res(self, *a, **k)

    def _prop(self, *a, **k):
        r = _orig_prop(self, *a, **k)
        timing["per_frame_s"].append(time.perf_counter() - _frame["t0"])
        return r

    _model.ParticleModel.evaluate_particles = _eval
    _model.ParticleModel.resample_particles = _res
    _model.ParticleModel.propagate_particles = _prop

    _orig_canon_init = _canon.FastSumOfParabolas.__init__

    def _canon_init(self, *a, **k):
        t = time.perf_counter()
        _orig_canon_init(self, *a, **k)
        timing["phases"]["voxelize_canonical_s"] = time.perf_counter() - t

    _canon.FastSumOfParabolas.__init__ = _canon_init

    from data import dataloader as _dl  # noqa: E402
    _orig_load, _orig_lct = _dl.load_data, _dl.compute_lct

    def _load(*a, **k):
        t = time.perf_counter(); r = _orig_load(*a, **k)
        timing["phases"]["load_data_s"] = time.perf_counter() - t
        return r

    def _lct(hists, *a, **k):
        t = time.perf_counter(); r = _orig_lct(hists, *a, **k)
        timing["phases"]["compute_lct_all_frames_s"] = time.perf_counter() - t
        timing["phases"]["compute_lct_per_frame_s"] = (time.perf_counter() - t) / max(1, len(hists))
        return r

    _dl.load_data, _dl.compute_lct = _load, _lct

_orig_video = utils.convert_pngs_to_video


def _video(out_dir, data_dir=None, imgs=None, fps=6.0):
    t = time.perf_counter()
    try:
        _orig_video(out_dir, data_dir=data_dir, imgs=imgs, fps=fps)
        timing["video_codec"] = "avc1 (authors' choice)"
    except RuntimeError as e:  # avc1 not available in opencv-python-headless
        import cv2
        h, w = imgs[0].shape[:2]
        p = os.path.join(out_dir, "out.mp4")
        vw = cv2.VideoWriter(p, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h), isColor=True)
        for im in imgs:
            vw.write(np.ascontiguousarray(im))
        vw.release()
        timing["video_codec"] = f"mp4v fallback (avc1 failed: {e})"
    timing["video_fps_used_by_authors_script"] = fps
    timing["phases"]["video_write_s"] = time.perf_counter() - t


utils.convert_pngs_to_video = _video

t_start = time.perf_counter()
g = runpy.run_path(os.path.join(paper_dir, script), run_name="__main__")
timing["phases"]["total_script_s"] = time.perf_counter() - t_start

if "states" in g:
    np.savez_compressed(os.path.join(RUN_OUT, "authors_code_states.npz"),
                        states=np.stack(g["states"]), scores=np.stack(g["scores"]))
if "vol" in g:
    np.savez_compressed(os.path.join(RUN_OUT, "authors_code_volume.npz"), vol=g["vol"])
pf = timing["per_frame_s"]
if pf:
    timing["per_frame_summary_s"] = {"n": len(pf), "mean": float(np.mean(pf)),
                                     "median": float(np.median(pf)),
                                     "p95": float(np.percentile(pf, 95)),
                                     "first": pf[0], "max": float(np.max(pf))}
with open(os.path.join(RUN_OUT, f"timing_{script.replace('.py', '')}.json"), "w") as fh:
    json.dump(timing, fh, indent=1)
print("RUNNER DONE", json.dumps({k: v for k, v in timing.items() if k != "per_frame_s"}))
