#!/usr/bin/env python3
"""Offline tests for tools/elevenlabs_narration.py (stdlib unittest; needs ffmpeg).

Run:  python3 -m unittest discover -s tools/tests -v        (from the project root)

Nothing here contacts ElevenLabs. A local mock server (127.0.0.1) emulates the endpoints the tool uses,
including 429/5xx retries, a tier-restricted output_format, a rejected parameter and an endpoint without
timestamps. A fake sentinel key is used and the tests assert it is never printed.
Opt-in live check of the blocked-host path:  RUN_LIVE_NETWORK_TESTS=1 python3 -m unittest ...
"""
from __future__ import annotations

import base64
import contextlib
import csv
import importlib.util
import io
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

TOOL = Path(__file__).resolve().parents[1] / "elevenlabs_narration.py"
spec = importlib.util.spec_from_file_location("elevenlabs_narration", TOOL)
el = importlib.util.module_from_spec(spec)
sys.modules["elevenlabs_narration"] = el
spec.loader.exec_module(el)

SENTINEL_KEY = "sk_test_SENTINEL_never_print_me_0123456789"
HAVE_FFMPEG = shutil.which("ffmpeg") is not None
SEC_PER_CHAR = 0.03


def pcm_tone(seconds: float, rate: int, freq: float = 220.0) -> bytes:
    n = int(round(seconds * rate))
    return b"".join(struct.pack("<h", int(8000 * math.sin(2 * math.pi * freq * i / rate))) for i in range(n))


def mp3_tone(seconds: float, rate: int) -> bytes:
    with tempfile.TemporaryDirectory() as td:
        dst = Path(td) / "t.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                        f"sine=frequency=220:sample_rate={rate}:duration={seconds:.3f}", "-ac", "1", "-b:a", "128k",
                        str(dst)], check=True)
        return dst.read_bytes()


def write_segments(path: Path, segs: list[dict]) -> Path:
    path.write_text(json.dumps({"segments": segs}, indent=2), encoding="utf-8")
    return path


SEGMENTS = [
    {"id": "s01", "text": "Here's a strange thing about chatbots.", "pause_after_ms": 300},
    {"id": "s02", "text": "Kalai and colleagues argue that tests reward guessing.", "pause_after_ms": 250,
     "tts_text": "Kuh-LYE and colleagues argue that tests reward guessing."},
    {"id": "s03", "text": "So how do you spot a confident bluff? Let’s find out — together.", "pause_after_ms": 0,
     "tts_text": "So how do you spot a confident bluff? [curious] Let’s find out — together."},
]


# ------------------------------------------------------------------------------------------------------
# mock ElevenLabs API
# ------------------------------------------------------------------------------------------------------
class MockState:
    def __init__(self):
        self.lock = threading.Lock()
        self.requests: list[dict] = []
        self.counter = 0
        self.fail_429_once = False
        self.fail_500_once = False
        self.reject_formats: set[str] = set()
        self.reject_param: str | None = None
        self.no_timestamps = False
        self.subscription = {"tier": "creator", "character_count": 1000, "character_limit": 100000}
        self.voices = {"VoiceAAAAAAAAAAAAAAA1": "Narrator One", "VoiceBBBBBBBBBBBBBBB2": "Narrator Two"}
        self.keys_seen: set[str] = set()


class MockHandler(BaseHTTPRequestHandler):
    state: MockState = None  # set per server

    def log_message(self, *a):  # silence
        pass

    def _send(self, status, obj=None, raw: bytes | None = None, headers=None, ctype="application/json"):
        body = raw if raw is not None else json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _auth(self) -> bool:
        key = self.headers.get("xi-api-key")
        if key:
            self.state.keys_seen.add(key)
        if key != SENTINEL_KEY:
            self._send(401, {"detail": {"status": "invalid_api_key", "message": "Invalid API key"}})
            return False
        return True

    def do_GET(self):
        st = self.state
        u = urllib.parse.urlsplit(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        with st.lock:
            st.requests.append({"method": "GET", "path": u.path, "query": q})
        if not self._auth():
            return
        if u.path == "/v1/models":
            return self._send(200, [
                {"model_id": "eleven_v4", "name": "Eleven v4", "can_do_text_to_speech": True, "can_use_style": False,
                 "can_use_speaker_boost": False, "maximum_text_length_per_request": 10000,
                 "model_rates": {"character_cost_multiplier": 1.0}, "languages": [{"language_id": "en"}]},
                {"model_id": "eleven_multilingual_v2", "name": "Eleven Multilingual v2", "can_do_text_to_speech": True,
                 "can_use_style": True, "can_use_speaker_boost": True, "maximum_text_length_per_request": 10000,
                 "model_rates": {"character_cost_multiplier": 1.0}, "languages": []},
            ])
        if u.path.startswith("/v1/voices/"):
            vid = u.path.rsplit("/", 1)[1]
            if vid in st.voices:
                return self._send(200, {"voice_id": vid, "name": st.voices[vid]})
            return self._send(404, {"detail": {"status": "voice_not_found", "message": "A voice with that ID was not found."}})
        if u.path == "/v2/voices":
            items = [{"voice_id": k, "name": v, "category": "premade",
                      "labels": {"accent": "american", "gender": "male", "use_case": "narration"},
                      "description": "warm narrator"} for k, v in st.voices.items()]
            if q.get("next_page_token") == "p2":
                return self._send(200, {"voices": items[1:], "has_more": False, "total_count": 2, "next_page_token": None})
            return self._send(200, {"voices": items[:1], "has_more": True, "total_count": 2, "next_page_token": "p2"})
        if u.path == "/v1/shared-voices":
            return self._send(200, {"voices": [{"public_owner_id": "owner1", "voice_id": "LibVoiceCCCCCCCCCCCC3",
                                                "name": "Library Narrator", "accent": "british", "gender": "female",
                                                "age": "middle_aged", "descriptive": "warm", "use_case": "narrative_story",
                                                "category": "professional", "cloned_by_count": 10,
                                                "free_users_allowed": True, "featured": q.get("featured") == "true"}],
                                    "has_more": False})
        if u.path == "/v1/user/subscription":
            return self._send(200, st.subscription)
        self._send(404, {"detail": {"status": "not_found", "message": "no route"}})

    def do_POST(self):
        st = self.state
        u = urllib.parse.urlsplit(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length)
        is_json = (self.headers.get("Content-Type") or "").startswith("application/json")
        body = json.loads(raw) if is_json and raw else None
        with st.lock:
            st.requests.append({"method": "POST", "path": u.path, "query": q, "body": body})
        if not self._auth():
            return
        if u.path.startswith("/v1/voices/add/"):
            return self._send(200, {"voice_id": u.path.rsplit("/", 1)[1]})
        if u.path == "/v1/forced-alignment":
            text = raw.split(b'name="text"\r\n\r\n', 1)[1].split(b"\r\n--", 1)[0].decode()
            chars = [{"text": c, "start": i * SEC_PER_CHAR, "end": (i + 1) * SEC_PER_CHAR} for i, c in enumerate(text)]
            return self._send(200, {"characters": chars, "words": [], "loss": 0.1})
        if u.path.startswith("/v1/text-to-speech/"):
            parts = u.path.split("/")
            vid = parts[3]
            with_ts = u.path.endswith("/with-timestamps")
            with st.lock:
                if st.fail_429_once:
                    st.fail_429_once = False
                    return self._send(429, {"detail": {"status": "too_many_concurrent_requests", "message": "busy"}},
                                      headers={"retry-after": "0"})
                if st.fail_500_once:
                    st.fail_500_once = False
                    return self._send(500, {"detail": "internal"}, headers={"retry-after-ms": "10"})
            if vid not in st.voices:
                return self._send(404, {"detail": {"status": "voice_not_found", "message": "voice not found"}})
            fmt = q.get("output_format", "mp3_44100_128")
            if fmt in st.reject_formats:
                return self._send(403, {"detail": {"status": "output_format_not_allowed",
                                                   "message": f"The requested output format {fmt} is only allowed for Pro tier and above."}})
            if st.reject_param and st.reject_param in body:
                return self._send(400, {"detail": {"status": "invalid_parameters",
                                                   "message": f"{st.reject_param} is not supported for this model"}})
            if with_ts and st.no_timestamps:
                return self._send(400, {"detail": {"status": "unsupported_model",
                                                   "message": "with-timestamps is not supported for this model"}})
            text = body["text"]
            secs = len(text) * SEC_PER_CHAR
            codec, rate = fmt.split("_")[0], int(fmt.split("_")[1])
            audio = pcm_tone(secs, rate) if codec == "pcm" else mp3_tone(secs, rate)
            with st.lock:
                st.counter += 1
                rid = f"req-{st.counter:03d}"
            hdrs = {"request-id": rid, "x-character-count": str(len(text))}
            if not with_ts:
                return self._send(200, raw=audio, headers=hdrs, ctype="audio/mpeg")
            starts = [i * SEC_PER_CHAR for i in range(len(text))]
            ends = [(i + 1) * SEC_PER_CHAR for i in range(len(text))]
            ends[-1] += 0.08  # ElevenLabs alignment can end slightly after the audio
            al = {"characters": list(text), "character_start_times_seconds": starts, "character_end_times_seconds": ends}
            return self._send(200, {"audio_base64": base64.b64encode(audio).decode(), "alignment": al,
                                    "normalized_alignment": al}, headers=hdrs)
        self._send(404, {"detail": {"status": "not_found", "message": "no route"}})


class MockServer:
    def __init__(self):
        self.state = MockState()
        handler = type("H", (MockHandler,), {"state": self.state})
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.url = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *exc):
        self.httpd.shutdown()
        self.httpd.server_close()

    def tts_requests(self):
        return [r for r in self.state.requests if r["method"] == "POST" and r["path"].startswith("/v1/text-to-speech/")]


def run_tool(argv, env_key=SENTINEL_KEY):
    """Run main() in-process, capturing stdout/stderr; returns (code, stdout, stderr)."""
    env = {k: v for k, v in os.environ.items() if k not in (el.ENV_KEY, el.ENV_BASE_URL)}
    if env_key is not None:
        env[el.ENV_KEY] = env_key
    so, se = io.StringIO(), io.StringIO()
    with mock.patch.dict(os.environ, env, clear=True), contextlib.redirect_stdout(so), contextlib.redirect_stderr(se):
        code = el.main(argv)
    return code, so.getvalue(), se.getvalue()


# ------------------------------------------------------------------------------------------------------
# unit tests
# ------------------------------------------------------------------------------------------------------
class TestArgParsing(unittest.TestCase):
    def test_narrate_args(self):
        a = el.build_parser().parse_args(["narrate", "--model", "eleven_v4", "--voice", "abc", "--only", "s03,s07",
                                          "--stability", "0.4", "--similarity", "0.8", "--style", "0.1",
                                          "--speed", "1.05", "--seed", "42", "--dry-run"])
        self.assertEqual((a.cmd, a.model, a.voice, a.only, a.seed), ("narrate", "eleven_v4", "abc", "s03,s07", 42))
        self.assertEqual((a.stability, a.similarity, a.style, a.speed), (0.4, 0.8, 0.1, 1.05))
        self.assertIsNone(a.speaker_boost)
        self.assertEqual(a.post_tempo, 1.0)
        self.assertEqual(el.user_settings_from_args(a),
                         {"stability": 0.4, "similarity_boost": 0.8, "style": 0.1, "speed": 1.05})

    def test_speaker_boost_flags(self):
        p = el.build_parser()
        self.assertFalse(p.parse_args(["narrate", "--voice", "x", "--no-speaker-boost"]).speaker_boost)
        self.assertTrue(p.parse_args(["narrate", "--voice", "x", "--speaker-boost"]).speaker_boost)

    def test_audition_args(self):
        a = el.build_parser().parse_args(["audition", "--models", "eleven_v4,eleven_multilingual_v2",
                                          "--voices", "a,b,c", "--text-file", "t.txt"])
        self.assertEqual(a.models.split(","), ["eleven_v4", "eleven_multilingual_v2"])
        self.assertEqual(a.voices.split(","), ["a", "b", "c"])

    def test_invalid_values_rejected(self):
        p = el.build_parser()
        for bad in (["--stability", "1.5"], ["--seed", "-1"], ["--seed", "4294967296"], ["--post-tempo", "2"],
                    ["--speed", "abc"]):
            with self.subTest(bad=bad), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit):
                    p.parse_args(["narrate", "--voice", "x", *bad])
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            p.parse_args(["narrate"])  # --voice required


class TestSegments(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.dir = Path(self.td.name)

    def tearDown(self):
        self.td.cleanup()

    def test_load_valid(self):
        segs = el.load_segments(write_segments(self.dir / "n.json", SEGMENTS))
        self.assertEqual([s.id for s in segs], ["s01", "s02", "s03"])
        self.assertEqual(segs[0].pause_after_ms, 300)
        self.assertTrue(segs[1].spoken.startswith("Kuh-LYE"))  # tts_text wins
        self.assertTrue(segs[0].spoken.startswith("Here's"))  # falls back to text

    def test_only(self):
        segs = el.load_segments(write_segments(self.dir / "n.json", SEGMENTS))
        self.assertEqual(el.parse_only("s01, s03", segs), {"s01", "s03"})
        self.assertIsNone(el.parse_only(None, segs))
        with self.assertRaises(el.InputError):
            el.parse_only("s01,s99", segs)

    def test_invalid_inputs(self):
        cases = {
            "dup": [{"id": "s01", "text": "a"}, {"id": "s01", "text": "b"}],
            "empty": [{"id": "s01", "text": "  "}],
            "badid": [{"id": "s 01", "text": "a"}],
            "pause": [{"id": "s01", "text": "a", "pause_after_ms": -5}],
            "tts": [{"id": "s01", "text": "a", "tts_text": 5}],
            "none": [],
        }
        for name, segs in cases.items():
            with self.subTest(name=name), self.assertRaises(el.InputError):
                el.load_segments(write_segments(self.dir / f"{name}.json", segs))
        (self.dir / "broken.json").write_text("{not json")
        with self.assertRaises(el.InputError):
            el.load_segments(self.dir / "broken.json")
        with self.assertRaises(el.InputError):
            el.load_segments(self.dir / "missing.json")


def fixture_alignment(text: str, step: float = 0.05, overshoot: float = 0.0):
    starts = [round(i * step, 4) for i in range(len(text))]
    ends = [round((i + 1) * step, 4) for i in range(len(text))]
    ends[-1] += overshoot
    return {"characters": list(text), "character_start_times_seconds": starts, "character_end_times_seconds": ends}


class TestWords(unittest.TestCase):
    def test_basic_words_tags_and_punctuation(self):
        spoken = "Hello, world! [laughs] It's 2026 — really."
        display = "Hello, world! It's 2026 — really."
        words = el.derive_words(fixture_alignment(spoken), spoken, display)
        # exactly one entry per display.split() token (what build_timeline.py zips against)
        self.assertEqual([w["word"] for w in words], display.split())
        self.assertEqual(words[0], {"word": "Hello,", "start": 0.0, "end": 0.3})
        idx = spoken.index("It's")
        self.assertAlmostEqual(words[2]["start"], idx * 0.05, places=3)  # tag time not given to a word
        self.assertAlmostEqual(words[2]["end"], (idx + 4) * 0.05, places=3)
        dash = words[4]
        self.assertEqual(dash["start"], dash["end"])  # lone dash: zero-length at previous word end
        self.assertEqual(dash["start"], words[3]["end"])
        for a, b in zip(words, words[1:]):
            self.assertLessEqual(a["start"], b["start"])
            self.assertLessEqual(a["start"], a["end"])

    def test_tag_in_display_text_kept_as_zero_length_token(self):
        text = "Hi [laughs] there"
        words = el.derive_words(fixture_alignment(text), text, text)
        self.assertEqual([w["word"] for w in words], ["Hi", "[laughs]", "there"])
        self.assertEqual(words[1]["start"], words[1]["end"])

    def test_clamped_to_duration(self):
        text = "One two."
        words = el.derive_words(fixture_alignment(text, 0.1, overshoot=0.08), text, text, duration=0.8)
        self.assertEqual(words[-1]["end"], 0.8)

    def test_unclosed_bracket_is_text(self):
        text = "a [b c"
        self.assertEqual([w["word"] for w in el.derive_words(fixture_alignment(text), text, text)], ["a", "[b", "c"])

    def test_respelled_tts_text_maps_to_display_words(self):
        display = "Kalai et al. argue that tests reward guessing."
        spoken = "Kuh-LYE et al. argue that tests reward guessing."
        words = el.derive_words(fixture_alignment(spoken), spoken, display)
        self.assertEqual([w["word"] for w in words], ["Kalai", "et", "al.", "argue", "that", "tests", "reward", "guessing."])
        self.assertEqual(words[0]["start"], 0.0)
        self.assertAlmostEqual(words[0]["end"], len("Kuh-LYE") * 0.05, places=3)
        self.assertAlmostEqual(words[1]["start"], (len("Kuh-LYE") + 1) * 0.05, places=3)

    def test_display_mapping_split_and_insert(self):
        display = "GPT-4o is here now"
        spoken = "G P T four oh is here"
        words = el.derive_words(fixture_alignment(spoken), spoken, display)
        self.assertEqual([w["word"] for w in words], ["GPT-4o", "is", "here", "now"])
        self.assertEqual(words[0]["start"], 0.0)
        self.assertAlmostEqual(words[0]["end"], spoken.index(" is") * 0.05, places=3)
        self.assertGreaterEqual(words[3]["start"], words[2]["end"] - 1e-9)  # inserted word placed after 'here'

    def test_ms_alignment_variant_and_empty(self):
        al = {"chars": ["H", "i"], "char_start_times_ms": [0, 100], "char_end_times_ms": [100, 200]}
        self.assertEqual(el.derive_words(al, "Hi", "Hi"), [{"word": "Hi", "start": 0.0, "end": 0.2}])
        self.assertEqual(el.derive_words(None, "Hi", "Hi"), [])

    def test_scale_alignment(self):
        al = fixture_alignment("ab", 1.0)
        sc = el.scale_alignment(al, 0.5, max_t=0.9)
        self.assertEqual(sc["character_end_times_seconds"], [0.5, 0.9])


class TestProfilesAndBodies(unittest.TestCase):
    def test_v4_drops_style_speed(self):
        prof = el.get_profile("eleven_v4")
        s, warns = el.resolve_voice_settings("eleven_v4", prof, {"stability": 0.5, "style": 0.3, "speed": 1.1})
        self.assertEqual(s, {"stability": 0.5, "similarity_boost": 0.75})
        self.assertEqual(len(warns), 2)
        s2, _ = el.resolve_voice_settings("eleven_v4", prof, {"style": 0.3}, force=True)
        self.assertEqual(s2["style"], 0.3)

    def test_multilingual_v2_keeps_all(self):
        prof = el.get_profile("eleven_multilingual_v2")
        s, warns = el.resolve_voice_settings("eleven_multilingual_v2", prof, {"style": 0.2, "speed": 0.95,
                                                                             "use_speaker_boost": False})
        self.assertEqual(s, {"stability": 0.5, "similarity_boost": 0.75, "style": 0.2, "use_speaker_boost": False,
                             "speed": 0.95})
        self.assertEqual(warns, [])

    def test_v3_snaps_stability(self):
        s, warns = el.resolve_voice_settings("eleven_v3", el.get_profile("eleven_v3"), {"stability": 0.4})
        self.assertEqual(s, {"stability": 0.5})
        self.assertTrue(any("snapped" in w for w in warns))

    def test_model_info_refines_profile(self):
        prof = el.get_profile("some_future_model", {"can_use_style": False, "can_use_speaker_boost": False,
                                                    "maximum_text_length_per_request": 1234})
        self.assertNotIn("style", prof["settings"])
        self.assertNotIn("use_speaker_boost", prof["settings"])
        self.assertEqual(prof["max_chars"], 1234)
        self.assertFalse(prof["known"])
        self.assertIn("style", el.get_profile("some_future_model")["settings"])  # profile copy not mutated
        self.assertIn("style", el.MODEL_PROFILES["eleven_multilingual_v2"]["settings"])

    def test_context_modes(self):
        segs = [el.Segment(f"s{i}", f"Sentence number {i}.") for i in range(1, 6)]
        self.assertEqual(el.build_context("none", 2, segs, {}), {})
        t = el.build_context("text", 0, segs, {})
        self.assertEqual(set(t), {"next_text"})
        t = el.build_context("text", 2, segs, {})
        self.assertEqual(t["previous_text"], "Sentence number 1. Sentence number 2.")
        self.assertEqual(t["next_text"], "Sentence number 4. Sentence number 5.")
        ids = {"s1": "r1", "s2": "r2", "s3": "r3", "s5": "r5"}
        c = el.build_context("ids", 3, segs, ids)
        self.assertEqual(c["previous_request_ids"], ["r1", "r2", "r3"])
        self.assertNotIn("previous_text", c)
        self.assertIn("next_text", c)
        c = el.build_context("ids", 3, segs, ids, next_ids_ok=True)
        self.assertEqual(c["next_request_ids"], ["r5"])
        c = el.build_context("ids", 1, segs, {})  # no ids known -> text fallback
        self.assertIn("previous_text", c)

    def test_context_truncation(self):
        segs = [el.Segment("a", "word " * 400), el.Segment("b", "x"), el.Segment("c", "next " * 300)]
        c = el.build_context("text", 1, segs, {})
        self.assertLessEqual(len(c["previous_text"]), el.PREV_CONTEXT_CHARS)
        self.assertLessEqual(len(c["next_text"]), el.NEXT_CONTEXT_CHARS)
        self.assertTrue(c["previous_text"].startswith("word"))

    def test_body_and_formats(self):
        b = el.build_body("Hi", "eleven_v4", {"stability": 0.5}, seed=7, language_code="en",
                          context={"previous_text": "x"})
        self.assertEqual(b, {"text": "Hi", "model_id": "eleven_v4", "voice_settings": {"stability": 0.5}, "seed": 7,
                             "language_code": "en", "previous_text": "x"})
        self.assertEqual(el.build_format_chain(None), el.DEFAULT_FORMAT_CHAIN)
        self.assertEqual(el.build_format_chain("mp3_44100_192"), ["mp3_44100_192", "mp3_44100_128"])
        self.assertEqual(el.build_format_chain("wav_48000")[0], "wav_48000")
        self.assertEqual(el.parse_output_format("mp3_44100_192"), ("mp3", 44100, 192))
        self.assertEqual(el.parse_output_format("pcm_48000"), ("pcm", 48000, None))

    def test_error_body_parsing_and_redaction(self):
        code, msg, _ = el._parse_error_body(b'{"detail":{"status":"quota_exceeded","message":"No credits"}}')
        self.assertEqual((code, msg), ("quota_exceeded", "No credits"))
        code, msg, _ = el._parse_error_body(b'{"detail":[{"loc":["body","voice_settings","speed"],"msg":"bad"}]}')
        self.assertEqual(code, "validation_error")
        self.assertIn("voice_settings.speed", msg)
        with mock.patch.dict(os.environ, {el.ENV_KEY: SENTINEL_KEY}):
            err = el.ApiError(401, "x", f"key {SENTINEL_KEY} invalid", "", {})
            self.assertNotIn(SENTINEL_KEY, str(err))
            self.assertNotIn(SENTINEL_KEY, el.redact(f"echo {SENTINEL_KEY}"))

    def test_base_url_guard(self):
        self.assertEqual(el.validate_base_url("https://api.eu.residency.elevenlabs.io/"),
                         "https://api.eu.residency.elevenlabs.io")
        self.assertTrue(el.validate_base_url("http://127.0.0.1:9999"))
        for bad in ("https://evil.example.com", "http://api.elevenlabs.io", "https://elevenlabs.io.evil.com"):
            with self.subTest(bad=bad), self.assertRaises(el.ToolError):
                el.validate_base_url(bad)

    def test_retry_delay(self):
        self.assertEqual(el._retry_delay({"retry-after": "3"}, 0), 3.0)
        self.assertEqual(el._retry_delay({"retry-after-ms": "250"}, 0), 0.25)
        self.assertEqual(el._retry_delay({"retry-after": "999"}, 0), 60.0)
        d = el._retry_delay({}, 2)
        self.assertTrue(4.0 <= d <= 5.0)


@unittest.skipUnless(HAVE_FFMPEG, "ffmpeg not installed")
class TestFFmpeg(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.dir = Path(self.td.name)

    def tearDown(self):
        self.td.cleanup()

    def test_pcm_44100_to_wav48k(self):
        src = self.dir / "tone.pcm"
        src.write_bytes(pcm_tone(1.0, 44100))
        dst = self.dir / "tone.wav"
        el.convert_to_wav(el.find_ffmpeg(True), src, "pcm_44100", dst)
        info = el.wav_info(dst)
        self.assertEqual((info["sample_rate"], info["channels"], info["sample_width"]), (48000, 1, 2))
        self.assertAlmostEqual(info["duration_s"], 1.0, delta=0.005)
        self.assertFalse((self.dir / "tone.partial.wav").exists())

    def test_pcm_48000_passthrough_and_tempo(self):
        src = self.dir / "tone.pcm"
        src.write_bytes(pcm_tone(2.0, 48000))
        dst = self.dir / "slow.wav"
        el.convert_to_wav(el.find_ffmpeg(True), src, "pcm_48000", dst, tempo=0.9)
        self.assertAlmostEqual(el.wav_duration(dst), 2.0 / 0.9, delta=0.02)

    def test_mp3_to_wav48k(self):
        src = self.dir / "tone.mp3"
        src.write_bytes(mp3_tone(1.5, 44100))
        dst = self.dir / "tone.wav"
        el.convert_to_wav(el.find_ffmpeg(True), src, "mp3_44100_192", dst)
        info = el.wav_info(dst)
        self.assertEqual((info["sample_rate"], info["channels"]), (48000, 1))
        self.assertAlmostEqual(info["duration_s"], 1.5, delta=0.06)

    def test_bad_input_raises_audio_error(self):
        src = self.dir / "junk.mp3"
        src.write_bytes(b"not audio at all")
        with self.assertRaises(el.AudioError):
            el.convert_to_wav(el.find_ffmpeg(True), src, "mp3_44100_128", self.dir / "x.wav")


# ------------------------------------------------------------------------------------------------------
# error paths (missing key / blocked host)
# ------------------------------------------------------------------------------------------------------
class TestErrorPaths(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.dir = Path(self.td.name)
        self.segs = write_segments(self.dir / "n.json", SEGMENTS)

    def tearDown(self):
        self.td.cleanup()

    def test_missing_key_subprocess(self):
        env = {k: v for k, v in os.environ.items() if k != el.ENV_KEY}
        for argv in (["narrate", "--voice", "VoiceAAAAAAAAAAAAAAA1", "--segments", str(self.segs),
                      "--out-dir", str(self.dir / "o")], ["list-voices"], ["models"]):
            with self.subTest(argv=argv[0]):
                r = subprocess.run([sys.executable, str(TOOL), *argv], capture_output=True, text=True, env=env)
                self.assertEqual(r.returncode, el.EXIT_NO_KEY, r.stderr)
                self.assertIn("ELEVENLABS_API_KEY is not set", r.stderr)
                self.assertIn("api.elevenlabs.io", r.stderr)
                self.assertIn("environment variable / secret", r.stderr)
        self.assertFalse((self.dir / "o" / "manifest.json").exists())

    def test_missing_key_doctor(self):
        with MockServer() as srv:
            code, so, se = run_tool(["doctor", "--base-url", srv.url], env_key=None)
        self.assertEqual(code, el.EXIT_NO_KEY)
        self.assertIn("NOT set", so)
        self.assertIn("reachable", so)

    def test_blocked_host_simulated_proxy_403(self):
        def blocked(self, req, timeout=None):
            raise urllib.error.URLError(OSError("Tunnel connection failed: 403 Forbidden"))
        with mock.patch("urllib.request.OpenerDirector.open", blocked):
            code, so, se = run_tool(["narrate", "--voice", "VoiceAAAAAAAAAAAAAAA1", "--segments", str(self.segs),
                                     "--out-dir", str(self.dir / "o")])
            self.assertEqual(code, el.EXIT_NETWORK)
            self.assertIn("cannot reach api.elevenlabs.io", se)
            self.assertIn("blocked by network policy", se)
            self.assertIn("Allow outbound HTTPS (port 443) to api.elevenlabs.io", se)
            self.assertNotIn(SENTINEL_KEY, so + se)
            code, so, se = run_tool(["doctor"])
            self.assertEqual(code, el.EXIT_NETWORK)
            self.assertIn("BLOCKED", so)
            self.assertNotIn(SENTINEL_KEY, so + se)

    def test_dns_failure_and_refused(self):
        import socket
        def dns(self, req, timeout=None):
            raise urllib.error.URLError(socket.gaierror(-2, "Name or service not known"))
        with mock.patch("urllib.request.OpenerDirector.open", dns):
            code, _, se = run_tool(["list-voices"])
        self.assertEqual(code, el.EXIT_NETWORK)
        self.assertIn("DNS lookup failed", se)
        code, _, se = run_tool(["models", "--base-url", "http://127.0.0.1:9", "--max-retries", "0"])
        self.assertEqual(code, el.EXIT_NETWORK)
        self.assertIn("connection refused", se)

    def test_refuses_foreign_base_url(self):
        code, _, se = run_tool(["models", "--base-url", "https://example.com"])
        self.assertEqual(code, el.EXIT_USAGE)
        self.assertIn("Refusing base URL", se)

    @unittest.skipUnless(os.environ.get("RUN_LIVE_NETWORK_TESTS") == "1", "set RUN_LIVE_NETWORK_TESTS=1 to probe the real host")
    def test_live_doctor(self):
        r = subprocess.run([sys.executable, str(TOOL), "doctor", "--max-retries", "0"], capture_output=True, text=True,
                           env={**os.environ, el.ENV_KEY: SENTINEL_KEY})
        print("\n[live doctor] exit", r.returncode, "\n", r.stdout[-1500:], r.stderr[-500:])
        self.assertNotIn(SENTINEL_KEY, r.stdout + r.stderr)


# ------------------------------------------------------------------------------------------------------
# dry run
# ------------------------------------------------------------------------------------------------------
class TestDryRun(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.dir = Path(self.td.name)
        self.segs = write_segments(self.dir / "n.json", SEGMENTS)

    def tearDown(self):
        self.td.cleanup()

    def _requests(self, stdout: str):
        dec, i, objs = json.JSONDecoder(), 0, []
        while i < len(stdout):
            if stdout[i].isspace():
                i += 1
                continue
            obj, i = dec.raw_decode(stdout, i)
            objs.append(obj)
        return objs

    def test_dry_run_v4_subprocess_no_key_leak(self):
        env = {**os.environ, el.ENV_KEY: SENTINEL_KEY}
        r = subprocess.run([sys.executable, str(TOOL), "narrate", "--dry-run", "--model", "eleven_v4", "--voice",
                            "VoiceAAAAAAAAAAAAAAA1", "--segments", str(self.segs), "--style", "0.3", "--seed", "11",
                            "--out-dir", str(self.dir / "o")], capture_output=True, text=True, env=env)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertNotIn(SENTINEL_KEY, r.stdout + r.stderr)
        reqs = self._requests(r.stdout)
        self.assertEqual([q["segment"] for q in reqs], ["s01", "s02", "s03"])
        self.assertTrue(reqs[0]["url"].endswith("/v1/text-to-speech/VoiceAAAAAAAAAAAAAAA1/with-timestamps?output_format=pcm_48000"))
        self.assertIn("omitted", reqs[0]["headers"]["xi-api-key"])
        b1, b2 = reqs[0]["json"], reqs[1]["json"]
        self.assertEqual(b1["voice_settings"], {"stability": 0.6, "similarity_boost": 0.75})  # style dropped on v4
        self.assertEqual(b1["seed"], 11)
        self.assertNotIn("previous_text", b1)
        self.assertIn("next_text", b1)
        self.assertTrue(b2["text"].startswith("Kuh-LYE"))  # tts_text used
        self.assertEqual(b2["previous_text"], SEGMENTS[0]["text"])
        self.assertIn("style=0.3 is not supported by eleven_v4", r.stderr)
        self.assertFalse((self.dir / "o").exists())

    def test_dry_run_multilingual_ids_and_only(self):
        code, so, se = run_tool(["narrate", "--dry-run", "--model", "eleven_multilingual_v2", "--voice", "V",
                                 "--segments", str(self.segs), "--only", "s03", "--speed", "0.95"], env_key=None)
        self.assertEqual(code, 0, se)
        reqs = self._requests(so)
        self.assertEqual(len(reqs), 1)
        body = reqs[0]["json"]
        self.assertEqual(body["previous_request_ids"], ["<request-id of s01>", "<request-id of s02>"])
        self.assertEqual(body["voice_settings"]["speed"], 0.95)
        self.assertIn("not set", se.lower())

    def test_dry_run_audition(self):
        tf = self.dir / "t.txt"
        tf.write_text("A short audition line.")
        code, so, se = run_tool(["audition", "--dry-run", "--models", "eleven_v4,eleven_multilingual_v2",
                                 "--voices", "a1,b2,c3", "--text-file", str(tf)])
        self.assertEqual(code, 0, se)
        reqs = self._requests(so)
        self.assertEqual(len(reqs), 6)
        self.assertNotIn(SENTINEL_KEY, so + se)

    def test_too_long_segment(self):
        segs = write_segments(self.dir / "long.json", [{"id": "s01", "text": "x" * 5001}])
        code, _, se = run_tool(["narrate", "--dry-run", "--model", "eleven_v3", "--voice", "V", "--segments", str(segs)])
        self.assertEqual(code, el.EXIT_INPUT)
        self.assertIn("at most 5000", se)


# ------------------------------------------------------------------------------------------------------
# end-to-end against the mock API
# ------------------------------------------------------------------------------------------------------
@unittest.skipUnless(HAVE_FFMPEG, "ffmpeg not installed")
class TestMockEndToEnd(unittest.TestCase):
    V1, V2 = "VoiceAAAAAAAAAAAAAAA1", "VoiceBBBBBBBBBBBBBBB2"

    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.dir = Path(self.td.name)
        self.segs = write_segments(self.dir / "narration_segments.json", SEGMENTS)
        self.out = self.dir / "out"

    def tearDown(self):
        self.td.cleanup()

    def narrate(self, srv, *extra, model="eleven_v4", voice=None):
        return run_tool(["narrate", "--base-url", srv.url, "--model", model, "--voice", voice or self.V1,
                         "--segments", str(self.segs), "--out-dir", str(self.out), *extra])

    def test_full_narration_v4(self):
        with MockServer() as srv:
            srv.state.fail_429_once = True
            srv.state.fail_500_once = True
            srv.state.reject_formats = {"pcm_48000"}  # Creator tier: no 48k PCM
            code, so, se = self.narrate(srv, "--seed", "5")
            self.assertEqual(code, 0, se)
            self.assertNotIn(SENTINEL_KEY, so + se)
            self.assertEqual(srv.state.keys_seen, {SENTINEL_KEY})
            tts = srv.tts_requests()
        man = json.loads((self.out / "manifest.json").read_text())
        for k in ("engine", "model", "voice_id", "voice_name", "settings", "segments"):
            self.assertIn(k, man)
        self.assertEqual((man["engine"], man["model"], man["voice_id"], man["voice_name"]),
                         ("elevenlabs", "eleven_v4", self.V1, "Narrator One"))
        self.assertTrue(man["complete"])
        self.assertEqual(man["settings"]["voice_settings"], {"stability": 0.6, "similarity_boost": 0.75})
        self.assertEqual([s["id"] for s in man["segments"]], ["s01", "s02", "s03"])
        self.assertTrue(any("pcm_48000 rejected" in n for n in man["notes"]))
        self.assertTrue(any("HTTP 429" in n for n in man["notes"]))
        self.assertTrue(any("HTTP 500" in n for n in man["notes"]))
        self.assertEqual(man["paths_relative_to"], "manifest_dir")
        for seg, src in zip(man["segments"], SEGMENTS):
            for k in ("id", "file", "duration_s", "words_file"):
                self.assertIn(k, seg)
            self.assertEqual(seg["file"], f"{src['id']}.wav")  # bare names next to manifest, like draft_tts.py
            self.assertEqual(seg["output_format"], "pcm_44100")
            info = el.wav_info(self.out / seg["file"])
            self.assertEqual((info["sample_rate"], info["channels"]), (48000, 1))
            spoken = src.get("tts_text") or src["text"]
            self.assertAlmostEqual(seg["duration_s"], len(spoken) * SEC_PER_CHAR, delta=0.01)
            words = json.loads((self.out / seg["words_file"]).read_text())
            self.assertTrue(all(set(w) == {"word", "start", "end"} for w in words))
            # build_timeline.py only uses engine timings when len(words) == len(text.split())
            self.assertEqual(len(words), len(src["text"].split()))
            self.assertLessEqual(words[-1]["end"], seg["duration_s"])
            al = json.loads((self.out / seg["alignment_file"]).read_text())
            self.assertEqual("".join(al["alignment"]["characters"]), spoken)
            self.assertEqual(seg["pause_after_ms"], src["pause_after_ms"])
        w2 = json.loads((self.out / "s02.words.json").read_text())
        self.assertEqual(w2[0]["word"], "Kalai")  # display spelling, tts timing
        w3 = json.loads((self.out / "s03.words.json").read_text())
        self.assertEqual([w["word"] for w in w3], SEGMENTS[2]["text"].split())  # [curious] only in tts_text
        # continuity: v4 uses previous_text/next_text, never request ids
        ok = [r for r in tts if r["query"].get("output_format") == "pcm_44100"]
        bodies = {r["body"]["text"][:8]: r["body"] for r in ok}
        b1, b2, b3 = (bodies[t[:8]] for t in ("Here's a", "Kuh-LYE ", "So how d"))
        self.assertNotIn("previous_text", b1)
        self.assertEqual(b2["previous_text"], SEGMENTS[0]["text"])
        self.assertEqual(b2["next_text"], SEGMENTS[2]["text"])
        self.assertTrue(all("previous_request_ids" not in r["body"] for r in tts))
        self.assertTrue(all(r["body"]["seed"] == 5 for r in tts))
        self.assertTrue(all(r["path"].endswith("/with-timestamps") for r in tts))

    def test_multilingual_v2_request_stitching_and_regen(self):
        with MockServer() as srv:
            code, so, se = self.narrate(srv, "--style", "0.15", "--speed", "0.97", model="eleven_multilingual_v2")
            self.assertEqual(code, 0, se)
            tts = srv.tts_requests()
            self.assertEqual(tts[0]["body"]["voice_settings"]["style"], 0.15)
            self.assertNotIn("previous_request_ids", tts[0]["body"])
            self.assertEqual(tts[1]["body"]["previous_request_ids"], ["req-001"])
            self.assertEqual(tts[2]["body"]["previous_request_ids"], ["req-001", "req-002"])
            self.assertIn("next_text", tts[1]["body"])
            n_before = len(tts)
            # regenerate s02 only: neighbours' ids from the manifest on both sides
            code, so, se = self.narrate(srv, "--only", "s02", "--style", "0.15", "--speed", "0.97",
                                        model="eleven_multilingual_v2")
            self.assertEqual(code, 0, se)
            regen = srv.tts_requests()[n_before:]
            self.assertEqual(len(regen), 1)
            self.assertEqual(regen[0]["body"]["previous_request_ids"], ["req-001"])
            self.assertEqual(regen[0]["body"]["next_request_ids"], ["req-003"])
            man = json.loads((self.out / "manifest.json").read_text())
            self.assertEqual([s["id"] for s in man["segments"]], ["s01", "s02", "s03"])
            self.assertEqual(man["segments"][1]["request_id"], "req-004")
            # resume: nothing to do
            n_before = len(srv.tts_requests())
            code, so, se = self.narrate(srv, "--skip-existing", "--style", "0.15", "--speed", "0.97",
                                        model="eleven_multilingual_v2")
            self.assertEqual(code, 0, se)
            self.assertEqual(len(srv.tts_requests()), n_before)
            # --only with a different voice would mix voices -> refused
            code, so, se = self.narrate(srv, "--only", "s01", voice=self.V2, model="eleven_multilingual_v2")
            self.assertEqual(code, el.EXIT_USAGE)
            self.assertIn("mix voices", se)

    def test_rejected_param_is_dropped(self):
        with MockServer() as srv:
            srv.state.reject_param = "previous_request_ids"
            code, so, se = self.narrate(srv, "--context", "ids")
            self.assertEqual(code, 0, se)
            man = json.loads((self.out / "manifest.json").read_text())
            self.assertTrue(any("rejected previous_request_ids" in n for n in man["notes"]))
            last = srv.tts_requests()[-1]["body"]
            self.assertNotIn("previous_request_ids", last)
            self.assertIn("previous_text", last)

    def test_mp3_fallback_and_forced_alignment(self):
        with MockServer() as srv:
            srv.state.reject_formats = {"pcm_48000", "pcm_44100"}
            srv.state.no_timestamps = True
            code, so, se = self.narrate(srv, "--only", "s01")
            self.assertEqual(code, 0, se)
            man = json.loads((self.out / "manifest.json").read_text())
            self.assertFalse(man["complete"])
            self.assertEqual(man["missing_segments"], ["s02", "s03"])
            seg = man["segments"][0]
            self.assertEqual(seg["output_format"], "mp3_44100_192")
            al = json.loads((self.out / "s01.alignment.json").read_text())
            self.assertTrue(al["alignment_source"].startswith("forced-alignment"))
            words = json.loads((self.out / "s01.words.json").read_text())
            self.assertEqual(words[0]["word"], "Here's")
            self.assertTrue(any(r["path"] == "/v1/forced-alignment" for r in srv.state.requests))

    def test_post_tempo_scales_alignment(self):
        with MockServer() as srv:
            code, so, se = self.narrate(srv, "--only", "s01", "--post-tempo", "0.9")
            self.assertEqual(code, 0, se)
        man = json.loads((self.out / "manifest.json").read_text())
        expected = len(SEGMENTS[0]["text"]) * SEC_PER_CHAR / 0.9
        self.assertAlmostEqual(man["segments"][0]["duration_s"], expected, delta=0.03)
        words = json.loads((self.out / "s01.words.json").read_text())
        self.assertAlmostEqual(words[-1]["end"], expected, delta=0.03)

    def test_api_errors(self):
        with MockServer() as srv:
            code, so, se = self.narrate(srv, voice="NoSuchVoiceXXXXXXXXX")
            self.assertEqual(code, el.EXIT_API)
            self.assertIn("not found", se)
            code, so, se = run_tool(["models", "--base-url", srv.url], env_key="wrong-key-value-123")
            self.assertEqual(code, el.EXIT_API)
            self.assertIn("HTTP 401", se)
            self.assertIn("permissions", se)
            self.assertNotIn("wrong-key-value-123", so + se)
            srv.state.subscription = {"tier": "free", "character_count": 9990, "character_limit": 10000}
            code, so, se = self.narrate(srv)
            self.assertEqual(code, el.EXIT_API)
            self.assertIn("exceeds", se)
            self.assertEqual(srv.tts_requests(), [])
            code, so, se = self.narrate(srv, "--model", "eleven_v9")  # not listed
            self.assertEqual(code, el.EXIT_API)
            self.assertIn("not listed", se)

    def test_audition(self):
        tf = self.dir / "audition.txt"
        tf.write_text("Here's a slightly awkward fact about chatbots.")
        with MockServer() as srv:
            srv.state.reject_formats = {"pcm_48000"}
            code, so, se = run_tool(["audition", "--base-url", srv.url, "--models", "eleven_v4,eleven_multilingual_v2",
                                     "--voices", f"{self.V1},Narrator Two", "--text-file", str(tf),
                                     "--out-dir", str(self.out)])
            self.assertEqual(code, 0, se)
        with (self.out / "auditions" / "auditions_summary.csv").open(newline="") as fh:
            rows = list(csv.DictReader(fh))
        self.assertEqual(len(rows), 4)
        self.assertEqual({(r["model"], r["voice_id"]) for r in rows},
                         {(m, v) for m in ("eleven_v4", "eleven_multilingual_v2") for v in (self.V1, self.V2)})
        for r in rows:
            self.assertEqual(r["status"], "ok")
            self.assertAlmostEqual(float(r["duration_s"]), len(tf.read_text()) * SEC_PER_CHAR, delta=0.01)
            self.assertTrue(el.resolve_manifest_path(r["file"]).exists())
            self.assertTrue(r["file"].endswith(f"{r['model']}__{r['voice_id']}.wav"))
        self.assertEqual({r["voice_name"] for r in rows}, {"Narrator One", "Narrator Two"})

    def test_list_voices_models_doctor(self):
        with MockServer() as srv:
            code, so, se = run_tool(["list-voices", "--base-url", srv.url, "--json", str(self.dir / "v.json")])
            self.assertEqual(code, 0, se)
            self.assertIn(self.V1, so)
            self.assertIn(self.V2, so)  # second page
            self.assertIn("accent=american", so)
            self.assertEqual(len(json.loads((self.dir / "v.json").read_text())), 2)
            code, so, se = run_tool(["list-voices", "--shared", "--featured", "--base-url", srv.url])
            self.assertEqual(code, 0, se)
            self.assertIn("owner1", so)
            shared_req = [r for r in srv.state.requests if r["path"] == "/v1/shared-voices"][-1]
            self.assertEqual(shared_req["query"]["featured"], "true")
            code, so, se = run_tool(["models", "--base-url", srv.url])
            self.assertEqual(code, 0, se)
            self.assertIn("eleven_v4\tEleven v4", so)
            code, so, se = run_tool(["doctor", "--base-url", srv.url])
            self.assertEqual(code, 0, se + so)
            self.assertIn("eleven_v4: listed", so)
            self.assertIn("tier=creator", so)
            code, so, se = run_tool(["add-shared-voice", "--base-url", srv.url, "--public-owner-id", "owner1",
                                     "--voice-id", "LibVoiceCCCCCCCCCCCC3", "--name", "Lib"])
            self.assertEqual(code, 0, se)
            self.assertNotIn(SENTINEL_KEY, so + se)


if __name__ == "__main__":
    unittest.main()
