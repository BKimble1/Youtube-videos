#!/usr/bin/env python3
"""Draft (placeholder) narration with local, offline Kokoro-82M TTS.

DRAFT ONLY: this is a stand-in until the premium (ElevenLabs) narration is recorded.

Engine : Kokoro-82M v1.0 (hexgrad, Apache-2.0) run as ONNX with onnxruntime.
G2P    : misaki (hexgrad, Apache-2.0; Kokoro's own G2P) + espeak-ng fallback for
         out-of-vocabulary words. `--g2p espeak` uses espeak-ng only.
Voices : Kokoro v1.0 voice packs (Apache-2.0), e.g. af_heart, af_bella, am_michael.

Reads   script/narration_segments.json
        {"segments":[{"id":"s01","text":"...","pause_after_ms":300,"tts_text":"optional"}]}
Writes  audio/narration/draft_local/<id>.wav         48 kHz mono PCM (24-bit by default)
        audio/narration/draft_local/<id>.words.json  [{"word","start","end"}] (seconds)
        audio/narration/draft_local/manifest.json
        audio/narration/draft_local/draft_full.wav   all segments joined with pause_after_ms

`tts_text` may hold a respelling ("Ka-lie's") or misaki's inline phoneme syntax
("[Kalai's](/kəlˈIz/)"). Word timestamps are labelled with the words of `text` when the
word counts line up (otherwise the tts_text words are kept and a warning is printed).

One-time model setup (downloads ~330 MB from registry.npmjs.org, verifies SHA-256):
    python3 tools/draft_tts.py --setup
Typical run:
    python3 tools/draft_tts.py --voice af_heart --speed 1.0
    python3 tools/draft_tts.py --only s03,s07
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
DEFAULT_SEGMENTS = PROJECT / "script" / "narration_segments.json"
DEFAULT_OUT = PROJECT / "audio" / "narration" / "draft_local"
DEFAULT_MODEL_DIR = Path(
    os.environ.get("DRAFT_TTS_MODEL_DIR", Path.home() / ".cache" / "draft_tts" / "kokoro-v1.0")
)
MODEL_FILE = "kokoro-v1.0-fp32-timed.onnx"
VOICES_FILE = "voices-v1.0.npz"

SR_MODEL = 24000
SR_OUT = 48000
MAX_TOKENS = 510  # Kokoro context is 512 including the two pad tokens
PUNCT = set(';:,.!?¡¿—…"«»“”()')

LICENSE = (
    "Kokoro-82M v1.0 weights and voice packs: Apache-2.0 (hexgrad/Kokoro-82M). "
    "misaki G2P: Apache-2.0. kokoro-onnx: MIT. onnxruntime: MIT. espeak-ng (fallback G2P): GPL-3.0 "
    "(tool only; generated audio is not a derivative work)."
)

# ---- model sources (all on registry.npmjs.org) ------------------------------------------
NPM = "https://registry.npmjs.org"
FP32_SHARDS = [
    ("kokoro-fp32a-shards", "1.0.0", range(0, 7)),
    ("kokoro-fp32b-shards", "1.0.0", range(7, 14)),
    ("kokoro-fp32c-shards", "1.0.0", range(14, 19)),
]
# sha256 of onnx-community/Kokoro-82M-v1.0-ONNX onnx/model.onnx as rebuilt from the shards.
# (Cross-checked numerically against the q8 export, whose hash matches in two independent npm
# packages: kokoro-q8-shards and expo-kokoro.)
FP32_SHA256 = "8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb"
VOICES_PKG = ("kokoro-js", "1.2.1")  # official package (hexgrad/Xenova); ships voices/*.bin
# Selected voice-pack hashes (identical in kokoro-js, kokoro-local-runtime and expo-kokoro).
VOICE_SHA256_PREFIX = {
    "af_heart": "d583ccff3cdca2f7",
    "af_bella": "f69d836209b78eb8",
    "am_michael": "1d1f21dd8da39c30",
}


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def _npm_tarball(name: str, version: str, dest: Path) -> Path:
    """Download an npm tarball into its own new directory and extract it (data only)."""
    d = dest / f"{name}-{version}"
    d.mkdir(parents=True, exist_ok=False)
    tgz = d / "pkg.tgz"
    url = f"{NPM}/{name}/-/{name}-{version}.tgz"
    print(f"  downloading {url}")
    subprocess.run(["curl", "-fsSL", "--retry", "3", "-o", str(tgz), url], check=True)
    with tarfile.open(tgz) as t:
        t.extractall(d / "x", filter="data")
    return d / "x" / "package"


def setup(model_dir: Path) -> None:
    import numpy as np
    import onnx
    from onnx import TensorProto, helper

    model_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="draft_tts_setup_") as tmp:
        tmp = Path(tmp)
        joined = tmp / "model.onnx"
        with open(joined, "wb") as out:
            for name, ver, parts in FP32_SHARDS:
                pkg = _npm_tarball(name, ver, tmp)
                for i in parts:
                    with open(pkg / f"kokoro-fp32.part{i}.bin", "rb") as f:
                        shutil.copyfileobj(f, out)
        got = _sha256(joined)
        if got != FP32_SHA256:
            sys.exit(f"model sha256 mismatch: {got}")
        print("  model sha256 OK")

        # Expose the predicted per-token durations (Round -> Clip -> Cast -> Gather) as an output
        m = onnx.load(joined)
        g = m.graph
        cons: dict[str, list] = {}
        for n in g.node:
            for i in n.input:
                cons.setdefault(i, []).append(n)
        (rnd,) = [n for n in g.node if n.op_type == "Round"]
        clip = cons[rnd.output[0]][0]
        cast = cons[clip.output[0]][0]
        gat = [c for c in cons[cast.output[0]] if c.op_type == "Gather"][0]
        assert (clip.op_type, cast.op_type) == ("Clip", "Cast")
        g.node.append(helper.make_node("Identity", [gat.output[0]], ["duration"], name="expose_duration"))
        g.output.append(helper.make_tensor_value_info("duration", TensorProto.INT64, ["n_tokens"]))
        onnx.save(m, model_dir / MODEL_FILE)

        vpkg = _npm_tarball(*VOICES_PKG, tmp)
        voices = {}
        for f in sorted((vpkg / "voices").glob("*.bin")):
            if f.stem in VOICE_SHA256_PREFIX and not _sha256(f).startswith(VOICE_SHA256_PREFIX[f.stem]):
                sys.exit(f"voice hash mismatch for {f.stem}")
            a = np.fromfile(f, dtype="<f4")
            assert a.size == 510 * 256, f
            voices[f.stem] = a.reshape(510, 1, 256)
        np.savez(model_dir / VOICES_FILE, **voices)
        (model_dir / "SOURCES.json").write_text(
            json.dumps(
                {
                    "model": f"npm {', '.join(f'{n}@{v}' for n, v, _ in FP32_SHARDS)} (joined), "
                    f"sha256 {FP32_SHA256}; duration output added by draft_tts.py --setup",
                    "voices": f"npm {VOICES_PKG[0]}@{VOICES_PKG[1]} voices/*.bin",
                    "license": LICENSE,
                },
                indent=2,
            )
        )
    print(f"  wrote {model_dir / MODEL_FILE} and {model_dir / VOICES_FILE} ({len(voices)} voices)")


# ---- synthesis -----------------------------------------------------------------------------
class KokoroDraft:
    def __init__(self, model_dir: Path, voice: str, speed: float, g2p: str, threads: int):
        import numpy as np
        import onnxruntime as ort
        from kokoro_onnx.config import DEFAULT_VOCAB

        self.np = np
        model = model_dir / MODEL_FILE
        if not model.exists():
            sys.exit(f"model not found at {model}; run: python3 {sys.argv[0]} --setup")
        so = ort.SessionOptions()
        so.intra_op_num_threads = threads  # fixed thread count -> repeatable float results
        so.inter_op_num_threads = 1
        so.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        so.log_severity_level = 3
        self.sess = ort.InferenceSession(str(model), so, providers=["CPUExecutionProvider"])
        voices = np.load(model_dir / VOICES_FILE)  # allow_pickle defaults to False
        if voice not in voices.files:
            sys.exit(f"unknown voice {voice}; available: {', '.join(voices.files)}")
        self.style = voices[voice]
        self.voice, self.speed, self.g2p_name = voice, speed, g2p
        self.vocab = DEFAULT_VOCAB
        british = voice[:1] == "b"
        self.lang = "en-gb" if british else "en-us"

        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper

        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        if g2p == "misaki":
            from misaki import en, espeak

            self.g2p = en.G2P(trf=False, british=british, fallback=espeak.EspeakFallback(british=british))
        else:
            from kokoro_onnx.tokenizer import Tokenizer

            self.tok = Tokenizer()

    # word groups: (label, phoneme string) for each whitespace-delimited word of the input
    def _groups(self, text: str) -> list[tuple[str, str]]:
        groups: list[list[str]] = []
        if self.g2p_name == "misaki":
            _, tokens = self.g2p(text)
            cur = None
            for t in tokens:
                if cur is None:
                    cur = ["", ""]
                    groups.append(cur)
                cur[0] += t.text
                cur[1] += t.phonemes or ""
                if t.whitespace:
                    cur = None
        else:
            for w in text.split():
                groups.append([w, self.tok.phonemize(w, self.lang).strip()])
        # punctuation-only groups (e.g. a spaced dash) attach to the previous word
        merged: list[list[str]] = []
        for label, ph in groups:
            if merged and not re.search(r"\w", label):
                merged[-1][0] += " " + label
                merged[-1][1] += ph
            else:
                merged.append([label, ph])
        return [(a, b) for a, b in merged]

    def _run(self, ids: list[int]):
        np = self.np
        style = self.style[min(len(ids), len(self.style)) - 1]
        wav, dur = self.sess.run(
            None,
            {
                "input_ids": np.array([[0, *ids, 0]], dtype=np.int64),
                "style": np.asarray(style, dtype=np.float32),
                "speed": np.array([self.speed], dtype=np.float32),
            },
        )
        wav = np.asarray(wav, dtype=np.float32).ravel()
        frames = np.concatenate([[0], np.cumsum(np.asarray(dur).ravel())])
        edges = np.round(frames * (len(wav) / frames[-1])).astype(np.int64)
        return wav, edges[1:]  # edges[i]..edges[i+1] = token i (pad removed)

    def synth(self, text: str):
        """Return (audio @24 kHz float32, [(label, start_s, end_s)])."""
        np = self.np
        groups = self._groups(text)
        # token ids per group, joined by a space token
        space = self.vocab[" "]
        seq: list[tuple[int, int]] = []  # (token id, group index or -1)
        for gi, (_, ph) in enumerate(groups):
            if seq:
                seq.append((space, -1))
            # punctuation tokens (pauses) are synthesized but excluded from word spans
            seq += [(self.vocab[c], -1 if c in PUNCT else gi) for c in ph if c in self.vocab]
        # split into <= MAX_TOKENS chunks, preferring sentence ends then word gaps
        stops = {self.vocab[c] for c in ".!?" if c in self.vocab}
        chunks, start = [], 0
        while start < len(seq):
            end = min(start + MAX_TOKENS, len(seq))
            if end < len(seq):
                cut = [i for i in range(start + 1, end) if seq[i - 1][0] in stops and seq[i][0] == space]
                cut = cut or [i for i in range(start + 1, end) if seq[i][0] == space]
                end = cut[-1] if cut else end
            chunks.append(seq[start:end])
            start = end
        audio, spans = [], {}
        offset = 0
        for ch in chunks:
            wav, edges = self._run([t for t, _ in ch])
            for i, (_, gi) in enumerate(ch):
                if gi < 0:
                    continue
                s, e = offset + edges[i], offset + edges[i + 1]
                a, b = spans.get(gi, (s, e))
                spans[gi] = (min(a, s), max(b, e))
            audio.append(wav)
            offset += len(wav)
        audio = np.concatenate(audio) if audio else np.zeros(0, np.float32)
        words = [(groups[gi][0], s / SR_MODEL, e / SR_MODEL) for gi, (s, e) in sorted(spans.items())]
        return audio, words


def _resample(x, sr_in: int, sr_out: int):
    import numpy as np

    if sr_in == sr_out:
        return x
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr_in), "-ac", "1", "-i", "pipe:0",
         "-af", "aresample=resampler=soxr:precision=28", "-ar", str(sr_out), "-f", "f32le", "pipe:1"],
        input=x.astype("<f4").tobytes(), capture_output=True, check=True,
    )
    return np.frombuffer(p.stdout, dtype="<f4").copy()


def finish(audio, words, pad_ms: float, fade_ms: float, peak_db: float):
    """Trim silence to a fixed pad, fade the edges, resample to 48 kHz, guard the peak."""
    import numpy as np

    sr = SR_MODEL
    hop = int(0.010 * sr)
    n = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12) if n else np.zeros(0)
    loud = np.where(20 * np.log10(rms) > -50.0)[0]
    if len(loud):
        s, e = loud[0] * hop, min(len(audio), (loud[-1] + 1) * hop)
    else:
        s, e = 0, len(audio)
    pad = int(pad_ms / 1000 * sr)
    head = s - pad  # may be negative: add silence
    seg = audio[max(0, head): e + pad]
    if head < 0:
        seg = np.concatenate([np.zeros(-head, np.float32), seg])
    if e + pad > len(audio):
        seg = np.concatenate([seg, np.zeros(e + pad - len(audio), np.float32)])
    f = min(int(fade_ms / 1000 * sr), len(seg) // 2)
    if f:
        ramp = np.linspace(0.0, 1.0, f, dtype=np.float32)
        seg[:f] *= ramp
        seg[-f:] *= ramp[::-1]
    out = _resample(seg, sr, SR_OUT)
    limit = 10 ** (peak_db / 20)
    peak = float(np.max(np.abs(out))) if len(out) else 0.0
    if peak > limit:
        out *= limit / peak
    dur = len(out) / SR_OUT
    shift = head / sr
    w = [
        {"word": lab, "start": round(min(max(a - shift, 0.0), dur), 3), "end": round(min(max(b - shift, 0.0), dur), 3)}
        for lab, a, b in words
    ]
    return out, w


def relabel(words: list[dict], text: str, tts_text: str | None, sid: str) -> list[dict]:
    if not tts_text or tts_text == text:
        return words
    display = text.split()
    if len(display) == len(words):
        for w, d in zip(words, display):
            w["word"] = d
    else:
        print(f"  [{sid}] warning: tts_text has {len(words)} words vs {len(display)} in text; "
              "word labels follow tts_text", file=sys.stderr)
    return words


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--segments", type=Path, default=DEFAULT_SEGMENTS)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR)
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0, help="Kokoro speed factor (0.5-2.0)")
    ap.add_argument("--g2p", choices=["misaki", "espeak"], default="misaki")
    ap.add_argument("--only", default="", help="comma-separated segment ids to (re)generate, e.g. s03,s07")
    ap.add_argument("--bits", type=int, choices=[16, 24], default=24)
    ap.add_argument("--pad-ms", type=float, default=40.0, help="silence kept before/after speech")
    ap.add_argument("--fade-ms", type=float, default=10.0)
    ap.add_argument("--peak-db", type=float, default=-1.5, help="sample-peak ceiling in dBFS (no clipping; keeps true peak < -1 dBTP)")
    ap.add_argument("--threads", type=int, default=4, help="fixed ORT thread count (determinism)")
    ap.add_argument("--no-full", action="store_true", help="skip draft_full.wav")
    ap.add_argument("--setup", action="store_true", help="download + verify model files, then exit")
    args = ap.parse_args()

    if args.setup:
        setup(args.model_dir)
        return
    if not 0.5 <= args.speed <= 2.0:
        sys.exit("--speed must be within 0.5..2.0")

    import numpy as np
    import soundfile as sf

    np.random.seed(0)  # nothing in the pipeline is random; kept for safety
    data = json.loads(args.segments.read_text(encoding="utf-8"))
    segs = data["segments"]
    ids = [s["id"] for s in segs]
    only = [x.strip() for x in args.only.split(",") if x.strip()]
    missing = [x for x in only if x not in ids]
    if missing:
        sys.exit(f"--only ids not in segments file: {missing}")
    todo = [s for s in segs if not only or s["id"] in only]

    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    man_path = out_dir / "manifest.json"
    settings = {
        "engine": "kokoro-82m-v1.0 (onnx fp32, onnxruntime)",
        "voice": args.voice,
        "speed": args.speed,
        "g2p": args.g2p,
    }
    old = {}
    if man_path.exists():
        prev = json.loads(man_path.read_text())
        if only and any(prev.get(k) != v for k, v in settings.items()):
            print("warning: existing manifest was made with different settings "
                  f"({ {k: prev.get(k) for k in settings} }); mixing takes", file=sys.stderr)
        old = {e["id"]: e for e in prev.get("segments", [])}

    tts = KokoroDraft(args.model_dir, args.voice, args.speed, args.g2p, args.threads)
    subtype = "PCM_24" if args.bits == 24 else "PCM_16"
    for s in todo:
        sid, text = s["id"], s["text"]
        say = s.get("tts_text") or text
        audio, words = tts.synth(say)
        out, w = finish(audio, words, args.pad_ms, args.fade_ms, args.peak_db)
        w = relabel(w, text, s.get("tts_text"), sid)
        wav = out_dir / f"{sid}.wav"
        sf.write(wav, out, SR_OUT, subtype=subtype)
        wf = out_dir / f"{sid}.words.json"
        wf.write_text(json.dumps(w, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        old[sid] = {
            "id": sid,
            "file": wav.name,
            "duration_s": round(len(out) / SR_OUT, 3),
            "words_file": wf.name,
            "pause_after_ms": s.get("pause_after_ms", 0),
            "text": text,
            **({"tts_text": s["tts_text"]} if s.get("tts_text") else {}),
        }
        print(f"  {sid}: {len(out) / SR_OUT:6.2f}s  {len(w)} words")

    entries = [old[i] for i in ids if i in old]
    manifest = {
        **settings,
        "status": "DRAFT - local TTS placeholder, not final narration",
        "license": LICENSE,
        "sample_rate": SR_OUT,
        "bit_depth": args.bits,
        "pad_ms": args.pad_ms,
        "segments": entries,
    }
    man_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if not args.no_full and entries:
        parts = []
        for e in entries:
            x, sr = sf.read(out_dir / e["file"], dtype="float32")
            parts += [x, np.zeros(int(sr * e.get("pause_after_ms", 0) / 1000), np.float32)]
        sf.write(out_dir / "draft_full.wav", np.concatenate(parts), SR_OUT, subtype=subtype)
    print(f"wrote {len(todo)} segment(s) -> {out_dir}")


if __name__ == "__main__":
    main()
