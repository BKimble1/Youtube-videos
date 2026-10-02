#!/usr/bin/env python3
"""Make review copies of original phone recordings. No editing of any kind.

For each recording listed in a footage manifest (e.g. Video_01/footage.json) this writes,
into <video folder>/review/<recording id>/:

  <id>_full_720p.mp4                        whole recording, 720p H.264; original AAC track copied bit-for-bit
  <id>_partNN_of_MM_<start>-<end>.mp4       consecutive 2-minute 720p clips, each under clip_max_bytes
  <id>_sample20s_<WxH>_<start>-<end>.mp4    20 s at the original resolution (face / eye-movement check)
  <id>_index.csv, <id>_index.md             where each file sits on the original's timeline

The original is only read. HDR (HLG / Dolby Vision) is tone-mapped to SDR BT.709 so copies
don't look washed out, the rotation flag is honoured or ignored per the manifest so they
aren't sideways, and frame timestamps pass through unchanged so timing matches the original.
No pauses are cut, nothing is reordered, no music or eye correction is added.

Usage:
  python scripts/prepare_review.py Video_01/footage.json [--only IMG_6102] [--force]
  python scripts/verify_review.py  Video_01/footage.json
"""

import argparse
import csv
import subprocess
import sys

import review_common as rc


def run(cmd):
    print("  $ " + subprocess.list2cmdline(cmd[:1] + ["..."] + cmd[-1:]), flush=True)
    subprocess.run(cmd, check=True)


def encode(out, src, rec, info, tonemap, hwdec, max_kbps=None):
    """Encode one review file to <name>.partial, then rename, so a crash never leaves a half file."""
    aac = rc.stereo_aac_stream(info)
    tmp = out.path.with_name(out.path.name + ".partial")
    cmd = [rc.FFMPEG, "-hide_banner", "-nostdin", "-y", "-loglevel", "error", "-stats"]
    vf = rc.video_filter(info, tonemap, out.width, out.height)
    if out.kind == "full":
        cmd += rc.input_args(src, rec, tonemap, hwdec)
    else:
        # -ss keeps frames from exactly out.start on. The end is cut with trim/atrim on the
        # original's clock, so a clip holds exactly the frames with start <= t < end. (Input -t
        # counts from the first frame, which can let the next clip's first frame in.)
        cmd += rc.input_args(src, rec, tonemap, hwdec, start=out.start, length=out.duration + 1)
        vf = f"trim=end={out.duration:.6f},{vf}"
        cmd += ["-af", f"atrim=end={out.duration:.6f}"]
    cmd += ["-map", "0:v:0", "-map", f"0:{aac['index']}", "-vf", vf,
            "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", "60"]
    if out.kind == "full":
        cmd += ["-crf", "20", "-c:a", "copy"]  # untouched original audio, original timing
    elif out.kind == "clip":
        cmd += ["-crf", "21", "-maxrate", f"{max_kbps}k", "-bufsize", f"{max_kbps * 3 // 2}k",
                "-c:a", "aac", "-b:a", "160k"]  # re-encoded only so cuts are sample-accurate
    else:  # sample, original resolution
        cmd += ["-crf", "17", "-level:v", "5.1", "-c:a", "aac", "-b:a", "192k"]
    cmd += rc.SDR_TAGS + rc.timing_args(info)
    cmd += ["-map_metadata", "0", "-map_chapters", "-1",
            "-metadata", f"title={rec['id']} review copy ({out.kind})",
            "-metadata", f"comment=Unedited review copy of {rec['file']}; covers "
                         f"{rc.timecode(out.start)}-{rc.timecode(out.end)} of the original.",
            "-movflags", "+faststart", "-f", "mp4", str(tmp)]
    run(cmd)
    tmp.replace(out.path)


def clip_budget_kbps(cfg):
    """Video maxrate so that worst case (maxrate*t + bufsize + 160k audio + mux overhead) fits the cap."""
    seconds, cap_bits = cfg["clip_seconds"], cfg["clip_max_bytes"] * 8 * 0.95
    return int((cap_bits - 160_000 * seconds) / (seconds + 1.5) / 1000)


def write_index(rec, outputs, out_dir):
    rows = []
    for o in outputs:
        rows.append({
            "file": o.path.name, "kind": o.kind, "part": o.part or "",
            "start_s": f"{o.start:.3f}", "end_s": f"{o.end:.3f}",
            "start": rc.timecode(o.start), "end": rc.timecode(o.end),
            "duration_s": f"{o.duration:.3f}", "resolution": f"{o.width}x{o.height}",
            "size_mb": f"{o.path.stat().st_size / 1e6:.1f}",
        })
    with open(out_dir / f"{rec['id']}_index.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    lines = [f"# {rec['id']} review files", "",
             f"Original: `{rec['file']}` - all times below are positions in the original recording.", "",
             "| File | Kind | Start | End | Length | Resolution | Size (MB) |",
             "|---|---|---|---|---|---|---|"]
    for r in rows:
        lines.append(f"| `{r['file']}` | {r['kind']} {r['part']} | {r['start']} | {r['end']} | "
                     f"{float(r['duration_s']):.2f} s | {r['resolution']} | {r['size_mb']} |")
    (out_dir / f"{rec['id']}_index.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("manifest")
    ap.add_argument("--only", action="append", help="recording id(s) to process (default: all)")
    ap.add_argument("--force", action="store_true", help="re-encode files that already exist")
    ap.add_argument("--tonemap", choices=["auto", "libplacebo", "zscale"], default="auto")
    ap.add_argument("--hwdec", choices=["auto", "cuda", "none"], default="auto")
    args = ap.parse_args()

    rc.require_tools()
    manifest, base = rc.load_manifest(args.manifest)
    cfg = manifest["settings"]
    tonemap, hwdec = rc.detect_hw(args.tonemap, args.hwdec)
    print(f"tone mapping: {tonemap}   decoding: {hwdec}")

    for rec in manifest["recordings"]:
        if args.only and rec["id"] not in args.only:
            continue
        src = rc.source_path(base, rec)
        size = src.stat().st_size
        if size != rec["size_bytes"]:
            sys.exit(f"{src}: size {size} != manifest {rec['size_bytes']} - wrong file?")
        info = rc.probe(src)
        outputs = rc.plan(manifest, base, rec, info)
        out_dir = outputs[0].path.parent
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n== {rec['id']}: {rc.timecode(rc.duration(info))}, {len(outputs)} review files -> {out_dir}")

        for o in outputs:
            if o.path.exists() and not args.force:
                print(f"- {o.path.name} (exists, skipped)")
                continue
            print(f"- {o.path.name}  [{rc.timecode(o.start)} - {rc.timecode(o.end)}]")
            kbps = clip_budget_kbps(cfg)
            encode(o, src, rec, info, tonemap, hwdec, kbps)
            # Safety net for the size cap: tighten the bitrate ceiling and retry.
            while o.kind == "clip" and o.path.stat().st_size >= cfg["clip_max_bytes"]:
                kbps = int(kbps * 0.85)
                print(f"  {o.path.stat().st_size / 1e6:.1f} MB is over the cap; retrying at {kbps} kb/s")
                encode(o, src, rec, info, tonemap, hwdec, kbps)

        write_index(rec, outputs, out_dir)
        print(f"index: {out_dir / (rec['id'] + '_index.md')}")


if __name__ == "__main__":
    main()
