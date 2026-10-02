#!/usr/bin/env python3
"""Verify the review files made by prepare_review.py against the untouched originals.

Per recording:
  * original still matches the manifest (size + CRC32), i.e. it was not modified
For every review file:
  * opens and decodes start to finish with no errors
  * one H.264 yuv420p video stream at the planned size, upright: no rotation flag left
  * SDR BT.709 colour tags and no HDR / Dolby Vision side data (so it isn't washed out)
  * one stereo AAC audio stream that is not silent
  * frame timestamps identical to the original's over the same span (no dropped,
    duplicated or retimed frames), and audio lined up with the original at the stated
    position (full copy: audio packets bit-identical to the original's AAC track)
  * clips: each under the size cap, consecutive, together covering the whole recording
Also saves <id>_verify_frames.png (a middle frame of every file) for a visual orientation check,
and <id>_verification.json with all measurements.

Usage:  python scripts/verify_review.py Video_01/footage.json [--only IMG_6102] [--skip-hash]
"""

import argparse
import json
import math
import re
import subprocess
import sys
import tempfile
import zlib
from array import array
from fractions import Fraction
from operator import mul
from pathlib import Path

import review_common as rc

try:  # optional, only makes the audio alignment check faster
    import numpy as np
except ImportError:
    np = None

AUDIO_RATE = 4000  # Hz, for the alignment check
FONT = Path("C:/Windows/Fonts/arial.ttf")


def crc32(path):
    crc = 0
    with open(path, "rb") as f:
        while chunk := f.read(16 << 20):
            crc = zlib.crc32(chunk, crc)
    return f"{crc:08x}"


def frame_times(path):
    """Presentation times (seconds, exact) of every video frame, sorted."""
    data = json.loads(subprocess.run(
        [rc.FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=time_base:packet=pts", "-of", "json", str(path)],
        capture_output=True, text=True, check=True).stdout)
    tb = Fraction(data["streams"][0]["time_base"])
    return sorted(Fraction(p["pts"]) * tb for p in data["packets"])


def aac_md5(path, stream_spec):
    out = subprocess.run([rc.FFMPEG, "-v", "error", "-i", str(path), "-map", stream_spec,
                          "-c", "copy", "-f", "md5", "-"], capture_output=True, text=True, check=True)
    return out.stdout.strip()


def decode_errors(path):
    # Keep the file's own 1/600 s clock: on FFmpeg's default 1/29.97 s clock, frames 1/30 s apart
    # can collide and the null muxer complains (it does for the untouched originals too).
    p = subprocess.run([rc.FFMPEG, "-v", "error", "-nostdin", "-i", str(path), "-map", "0",
                        "-fps_mode", "passthrough", "-enc_time_base:v", "demux",
                        "-f", "null", "-"], capture_output=True, text=True)
    return p.returncode, p.stderr.strip()


def loudness(path):
    err = subprocess.run([rc.FFMPEG, "-nostdin", "-i", str(path), "-map", "0:a:0", "-af", "volumedetect",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    mean = re.search(r"mean_volume: (-?[\d.]+) dB", err)
    peak = re.search(r"max_volume: (-?[\d.]+) dB", err)
    return (float(mean.group(1)) if mean else None, float(peak.group(1)) if peak else None)


def pcm(path, start, length, stream_spec):
    raw = subprocess.run([rc.FFMPEG, "-v", "error", "-ss", f"{start:.4f}", "-t", f"{length:.4f}",
                          "-i", str(path), "-map", stream_spec, "-ac", "1", "-ar", str(AUDIO_RATE),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    a = array("h")
    a.frombytes(raw[: len(raw) // 2 * 2])
    if sys.byteorder == "big":
        a.byteswap()
    return a


def audio_offset(out, src, aac_index, window=4.0, search=0.1):
    """Offset (ms) of the review file's audio vs. the original at the position it claims to cover.
    0 means the audio starts exactly where the index says; also returns the correlation peak."""
    t = max(search, out.duration / 2 - window / 2)
    test = pcm(out.path, t, window, "0:a:0")
    ref = pcm(src, out.start + t - search, window + 2 * search, f"0:{aac_index}")
    n = len(test)
    if np is not None:
        t, r = np.asarray(test, dtype=float), np.asarray(ref, dtype=float)
        csum = np.concatenate(([0.0], np.cumsum(r * r)))
        corr = np.correlate(r, t, mode="valid") / (
            (np.linalg.norm(t) or 1.0) * np.maximum(np.sqrt(csum[n:] - csum[:-n]), 1e-9))
        best_k = int(np.argmax(corr))
        best_c = float(corr[best_k])
    else:
        e_test = math.sqrt(sum(x * x for x in test)) or 1.0
        best_k, best_c = 0, -2.0
        for k in range(0, len(ref) - n + 1):
            seg = ref[k:k + n]
            c = sum(map(mul, test, seg)) / (e_test * (math.sqrt(sum(x * x for x in seg)) or 1.0))
            if c > best_c:
                best_k, best_c = k, c
    return round((best_k - search * AUDIO_RATE) * 1000 / AUDIO_RATE, 2), round(best_c, 4)


def frames_sheet(outputs, dest):
    with tempfile.TemporaryDirectory() as tmp:
        for i, o in enumerate(outputs):
            label = o.path.stem.replace(o.path.stem.split("_")[0] + "_", "")
            vf = "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:-1:-1:color=gray"
            if FONT.exists():
                font = str(FONT).replace("\\", "/").replace(":", "\\:")
                vf += (f",drawtext=fontfile='{font}':text='{label}':x=6:y=6:fontsize=15"
                       ":fontcolor=yellow:box=1:boxcolor=black@0.6")
            subprocess.run([rc.FFMPEG, "-v", "error", "-y", "-ss", f"{o.duration / 2:.3f}", "-i", str(o.path),
                            "-frames:v", "1", "-vf", vf, f"{tmp}/f{i:02d}.png"], check=True)
        cols = 4
        rows = math.ceil(len(outputs) / cols)
        subprocess.run([rc.FFMPEG, "-v", "error", "-y", "-i", f"{tmp}/f%02d.png",
                        "-vf", f"tile={cols}x{rows}:padding=4:color=white", "-frames:v", "1", str(dest)],
                       check=True)


def check_output(o, src, src_info, src_times, cfg):
    r = {"file": o.path.name, "kind": o.kind, "start": rc.timecode(o.start), "end": rc.timecode(o.end)}
    problems = []
    if not o.path.exists():
        return r | {"problems": ["missing"]}
    r["size_mb"] = round(o.path.stat().st_size / 1e6, 2)
    info = rc.probe(o.path)
    vids = [s for s in info["streams"] if s["codec_type"] == "video"]
    auds = [s for s in info["streams"] if s["codec_type"] == "audio"]
    if len(vids) != 1 or len(auds) != 1:
        problems.append(f"expected 1 video + 1 audio stream, got {len(vids)} + {len(auds)}")
    v, a = vids[0], auds[0]

    # Opens and decodes cleanly.
    code, err = decode_errors(o.path)
    r["decodes"] = code == 0 and not err
    if not r["decodes"]:
        problems.append(f"decode errors: {err[:200]}")

    # Video format, orientation, colour.
    r["video"] = f"{v['codec_name']} {v.get('pix_fmt')} {v['width']}x{v['height']}"
    if (v["codec_name"], v.get("pix_fmt"), v["width"], v["height"]) != ("h264", "yuv420p", o.width, o.height):
        problems.append(f"video is {r['video']}, expected h264 yuv420p {o.width}x{o.height}")
    r["rotation_flag"] = rc.rotation(v)
    if any(sd.get("side_data_type") == "Display Matrix" for sd in v.get("side_data_list", [])):
        problems.append("output still carries a rotation (display matrix) flag")
    r["color"] = "/".join(str(v.get(k)) for k in ("color_primaries", "color_transfer", "color_space", "color_range"))
    if r["color"] != "bt709/bt709/bt709/tv":
        problems.append(f"colour tags {r['color']}, expected bt709/bt709/bt709/tv")
    hdr = [sd["side_data_type"] for sd in v.get("side_data_list", [])
           if re.search(r"DOVI|Mastering|Content light|Ambient", sd.get("side_data_type", ""))]
    if hdr:
        problems.append(f"HDR side data left: {hdr}")

    # Audio present and audible.
    r["audio"] = f"{a['codec_name']} {a.get('channels')}ch {a.get('sample_rate')}Hz"
    if (a["codec_name"], a.get("channels"), a.get("sample_rate")) != ("aac", 2, "48000"):
        problems.append(f"audio is {r['audio']}, expected aac 2ch 48000Hz")
    r["mean_db"], r["peak_db"] = loudness(o.path)
    if r["mean_db"] is None or r["mean_db"] < -60:
        problems.append(f"audio silent or unreadable (mean {r['mean_db']} dB)")

    # Duration.
    r["duration_s"] = round(float(info["format"]["duration"]), 3)
    if abs(r["duration_s"] - o.duration) > 0.1:
        problems.append(f"duration {r['duration_s']} s, expected {o.duration:.3f} s")

    # Video timing: same frames at the same relative times as the original span.
    expected = [t for t in src_times if Fraction(o.start) <= t < Fraction(o.end)]
    got = frame_times(o.path)
    r["frames"], r["frames_expected"] = len(got), len(expected)
    same_shape = len(got) == len(expected) and all(
        (g - got[0]) == (e - expected[0]) for g, e in zip(got, expected))
    r["frame_timing_identical"] = same_shape
    if not same_shape:
        problems.append(f"frame timing differs from original ({len(got)} frames vs {len(expected)})")

    # Audio timing.
    aac = rc.stereo_aac_stream(src_info)
    if o.kind == "full":
        r["audio_bit_identical"] = aac_md5(o.path, "0:a:0") == aac_md5(src, f"0:{aac['index']}")
        if not r["audio_bit_identical"]:
            problems.append("full copy audio is not bit-identical to the original AAC track")
    else:
        r["audio_offset_ms"], r["audio_corr"] = audio_offset(o, src, aac["index"])
        if abs(r["audio_offset_ms"]) > 2 or r["audio_corr"] < 0.9:
            problems.append(f"audio offset {r['audio_offset_ms']} ms (corr {r['audio_corr']}) vs original")

    if o.kind == "clip" and o.path.stat().st_size >= cfg["clip_max_bytes"]:
        problems.append(f"clip is {r['size_mb']} MB, cap is {cfg['clip_max_bytes'] / 1e6:.0f} MB")
    r["problems"] = problems
    return r


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("manifest")
    ap.add_argument("--only", action="append")
    ap.add_argument("--skip-hash", action="store_true", help="skip the CRC32 check of the originals")
    args = ap.parse_args()

    rc.require_tools()
    manifest, base = rc.load_manifest(args.manifest)
    cfg = manifest["settings"]
    failed = False
    for rec in manifest["recordings"]:
        if args.only and rec["id"] not in args.only:
            continue
        src = rc.source_path(base, rec)
        src_info = rc.probe(src)
        outputs = rc.plan(manifest, base, rec, src_info)
        out_dir = outputs[0].path.parent
        report = {"recording": rec["id"], "original": str(src), "problems": []}

        size = src.stat().st_size
        report["original_size_ok"] = size == rec["size_bytes"]
        if not args.skip_hash:
            report["original_crc32"] = crc32(src)
            report["original_crc32_ok"] = report["original_crc32"] == rec["crc32"]
        report["original_unchanged"] = report["original_size_ok"] and report.get("original_crc32_ok") is not False
        if not report["original_unchanged"]:
            report["problems"].append("original no longer matches the manifest")

        src_times = frame_times(src)
        report["files"] = [check_output(o, src, src_info, src_times, cfg) for o in outputs]

        clips = [o for o in outputs if o.kind == "clip"]
        gaps = [f"{a.path.name} -> {b.path.name}" for a, b in zip(clips, clips[1:]) if a.end != b.start]
        covers = clips[0].start == 0 and abs(clips[-1].end - rc.duration(src_info)) < 1e-6 and not gaps
        clip_frames = sum(f.get("frames", 0) for f in report["files"] if f["kind"] == "clip")
        report["clips_cover_recording"] = covers and clip_frames == len(src_times)
        report["clip_frames_total"], report["original_frames"] = clip_frames, len(src_times)
        if not report["clips_cover_recording"]:
            report["problems"].append(f"clips don't cover the recording exactly (gaps {gaps}, "
                                      f"{clip_frames} frames vs {len(src_times)})")

        sheet = out_dir / f"{rec['id']}_verify_frames.png"
        frames_sheet(outputs, sheet)
        report["frames_sheet"] = str(sheet)
        (out_dir / f"{rec['id']}_verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

        print(f"\n== {rec['id']}  original {'unchanged' if report['original_unchanged'] else 'CHANGED?'}"
              f" (size ok: {report['original_size_ok']}, crc32 ok: {report.get('original_crc32_ok', 'skipped')})")
        print(f"   clips cover the whole recording: {report['clips_cover_recording']} "
              f"({clip_frames}/{len(src_times)} frames)")
        for f in report["files"]:
            status = "PASS" if not f["problems"] else "FAIL"
            sync = ("audio bit-identical" if f.get("audio_bit_identical")
                    else f"audio offset {f.get('audio_offset_ms')} ms")
            print(f"   {status}  {f['file']:<52} {f.get('size_mb', 0):>7.2f} MB  {f.get('duration_s', 0):>8.3f} s  "
                  f"{f.get('frames')}/{f.get('frames_expected')} frames  {sync}  mean {f.get('mean_db')} dB")
            for p in f["problems"]:
                print(f"         - {p}")
        for p in report["problems"]:
            print(f"   FAIL  {p}")
        failed |= bool(report["problems"]) or any(f["problems"] for f in report["files"])
        print(f"   frames sheet: {sheet}")
    print("\nALL CHECKS PASSED" if not failed else "\nSOME CHECKS FAILED")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
