"""Shared helpers for prepare_review.py and verify_review.py.

Everything that both scripts must agree on lives here: the manifest format, how a
recording is probed, which review files exist and where they sit on the original's
timeline, and the FFmpeg colour/rotation handling.
"""

import json
import math
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

FFMPEG = shutil.which("ffmpeg")
FFPROBE = shutil.which("ffprobe")

# Frame side data that only makes sense for HDR and must not leak into SDR review copies.
HDR_SIDE_DATA = (
    "AMBIENT_VIEWING_ENVIRONMENT",
    "DOVI_METADATA",
    "DOVI_RPU_BUFFER",
    "MASTERING_DISPLAY_METADATA",
    "CONTENT_LIGHT_LEVEL",
)
HDR_TRANSFERS = ("arib-std-b67", "smpte2084")  # HLG, PQ


def require_tools():
    if not (FFMPEG and FFPROBE):
        sys.exit("ffmpeg/ffprobe not found on PATH. Install with:  winget install Gyan.FFmpeg")


@dataclass
class Output:
    kind: str  # "full" | "clip" | "sample"
    path: Path
    start: float  # seconds on the original recording's timeline
    end: float
    width: int
    height: int
    part: int = 0
    parts: int = 0

    @property
    def duration(self):
        return self.end - self.start


def load_manifest(path):
    path = Path(path).resolve()
    manifest = json.loads(path.read_text(encoding="utf-8"))
    return manifest, path.parent


def source_path(base, rec):
    return base / rec["file"]


def review_dir(base, manifest, rec):
    return base / manifest.get("review_dir", "review") / rec["id"]


def probe(path):
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def video_stream(info):
    return next(s for s in info["streams"] if s["codec_type"] == "video")


def stereo_aac_stream(info):
    """The AAC stereo track. iPhones also record an APAC spatial-audio track FFmpeg can't decode."""
    for s in info["streams"]:
        if s["codec_type"] == "audio" and s.get("codec_name") == "aac":
            return s
    raise RuntimeError("no AAC audio track found")


def rotation(stream):
    for sd in stream.get("side_data_list", []):
        if "rotation" in sd:
            return int(sd["rotation"])
    return 0


def display_size(info, rec):
    """Upright picture size: coded size, swapped if a 90-degree flag is honoured."""
    vs = video_stream(info)
    w, h = vs["width"], vs["height"]
    if not rec.get("ignore_rotation_flag") and rotation(vs) % 180:
        w, h = h, w
    return w, h


def scale_short_side(w, h, short):
    if w >= h:
        return round(w * short / h / 2) * 2, short
    return short, round(h * short / w / 2) * 2


def duration(info):
    return float(info["format"]["duration"])


def mmss(sec):
    sec = int(sec)  # floor; exact times are in the index files
    return f"{sec // 60:02d}m{sec % 60:02d}s"


def timecode(sec):
    ms = round(sec * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h}:{m:02d}:{s:02d}.{ms:03d}"


def plan(manifest, base, rec, info):
    """Every review file for one recording, with its span on the original's timeline."""
    cfg = manifest["settings"]
    out_dir = review_dir(base, manifest, rec)
    rid = rec["id"]
    total = duration(info)
    dw, dh = display_size(info, rec)
    rw, rh = scale_short_side(dw, dh, cfg["review_short_side"])

    outputs = [Output("full", out_dir / f"{rid}_full_{cfg['review_short_side']}p.mp4", 0.0, total, rw, rh)]

    step = cfg["clip_seconds"]
    parts = math.ceil(total / step)
    for i in range(parts):
        start, end = i * step, min((i + 1) * step, total)
        name = f"{rid}_part{i + 1:02d}_of_{parts:02d}_{mmss(start)}-{mmss(end)}.mp4"
        outputs.append(Output("clip", out_dir / name, float(start), end, rw, rh, i + 1, parts))

    s0 = float(rec["sample_start_s"])
    s1 = min(s0 + cfg["sample_seconds"], total)
    name = f"{rid}_sample{cfg['sample_seconds']}s_{dw}x{dh}_{mmss(s0)}-{mmss(s1)}.mp4"
    outputs.append(Output("sample", out_dir / name, s0, s1, dw, dh))
    return outputs


# ---------------------------------------------------------------- FFmpeg pieces

def ffmpeg_ok(*args):
    return subprocess.run([FFMPEG, "-v", "error", *args], capture_output=True).returncode == 0


def detect_hw(tonemap="auto", hwdec="auto"):
    """libplacebo (Vulkan) gives the best HDR->SDR result; zscale is the CPU fallback.
    CUDA only speeds up decoding (output is identical); FFmpeg falls back to CPU anyway."""
    if tonemap == "auto":
        tonemap = "libplacebo" if ffmpeg_ok(
            "-init_hw_device", "vulkan", "-f", "lavfi", "-i", "color=c=black:s=64x64:d=0.1",
            "-vf", "libplacebo", "-f", "null", "-") else "zscale"
    if hwdec == "auto":
        hwdec = "cuda" if ffmpeg_ok(
            "-init_hw_device", "cuda", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1",
            "-f", "null", "-") else "none"
    return tonemap, hwdec


def input_args(src, rec, tonemap, hwdec, start=None, length=None):
    args = []
    if tonemap == "libplacebo":
        args += ["-init_hw_device", "vulkan"]
    if hwdec == "cuda":
        args += ["-hwaccel", "cuda"]
    if rec.get("ignore_rotation_flag"):
        # Replace the (wrong) display matrix with identity so nothing is rotated
        # and no rotation flag is carried into the output.
        args += ["-display_rotation:v:0", "0"]
    if start:
        args += ["-ss", f"{start:.3f}"]
    if length is not None:
        args += ["-t", f"{length:.3f}"]
    return args + ["-i", str(src)]


def video_filter(info, tonemap, w, h):
    """Scale + convert to SDR BT.709 8-bit, then drop HDR-only frame side data."""
    vs = video_stream(info)
    trc = vs.get("color_transfer")
    if tonemap == "libplacebo":
        f = (f"libplacebo=w={w}:h={h}:colorspace=bt709:color_primaries=bt709:color_trc=bt709"
             ":range=tv:tonemapping=auto:peak_detect=0:format=yuv420p")
    elif trc in HDR_TRANSFERS:
        f = (f"zscale=w={w}:h={h}:filter=lanczos,"
             f"zscale=tin={trc}:min={vs.get('color_space', 'bt2020nc')}:pin={vs.get('color_primaries', 'bt2020')}"
             ":rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
             "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
    else:
        f = f"scale={w}:{h}:flags=lanczos,format=yuv420p"
    return ",".join([f] + [f"sidedata=mode=delete:type={t}" for t in HDR_SIDE_DATA])


SDR_TAGS = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]


def timing_args(info):
    """Keep every original frame timestamp: no frame-rate conversion, same 1/600 s clock."""
    den = video_stream(info)["time_base"].split("/")[1]
    return ["-fps_mode", "passthrough", "-enc_time_base:v", "demux", "-video_track_timescale", den]
