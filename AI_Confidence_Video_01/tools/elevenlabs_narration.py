#!/usr/bin/env python3
"""
elevenlabs_narration.py - premium narration for AI_Confidence_Video_01 via the ElevenLabs REST API.

Standard library only (urllib); needs ffmpeg on PATH for audio conversion.
The API key is read ONLY from the ELEVENLABS_API_KEY environment variable and is never printed,
logged or written to disk (any accidental echo in an API error body is redacted).

Subcommands
  doctor            environment check: ffmpeg, key present (value never shown), network reachability,
                    subscription tier / remaining credits, whether the requested model is listed.
  models            list models from GET /v1/models (ids, limits, style/speaker-boost support).
  list-voices       list voices available to the account (GET /v2/voices), or --shared library voices.
  add-shared-voice  add a Voice Library voice to the account (POST /v1/voices/add/{owner}/{voice}).
  audition          synthesize one text with several models x voices -> auditions/<model>__<voice>.wav + CSV.
  narrate           synthesize script/narration_segments.json -> <id>.wav (48 kHz mono), <id>.alignment.json,
                    <id>.words.json and manifest.json.

Endpoint used for narration: POST /v1/text-to-speech/{voice_id}/with-timestamps?output_format=...
(JSON response: audio_base64 + alignment{characters, character_start_times_seconds,
character_end_times_seconds} + normalized_alignment). Source: official `elevenlabs` Python SDK 2.71.0
(text_to_speech/raw_client.py, types/audio_with_timestamps_response.py). See ELEVENLABS_NOTES.md.

Exit codes: 0 ok, 1 generic failure, 2 usage error, 3 missing API key, 4 host unreachable/blocked,
            5 API error, 6 ffmpeg/audio error, 7 bad input file.
"""
from __future__ import annotations

import argparse
import base64
import csv
import datetime as _dt
import difflib
import hashlib
import http.client
import io
import json
import os
import random
import re
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
import wave
from pathlib import Path

TOOL_VERSION = "1.0.0"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SEGMENTS = PROJECT_ROOT / "script" / "narration_segments.json"
DEFAULT_OUT_DIR = PROJECT_ROOT / "audio" / "narration" / "elevenlabs"
ENV_KEY = "ELEVENLABS_API_KEY"
ENV_BASE_URL = "ELEVENLABS_BASE_URL"
DEFAULT_BASE_URL = "https://api.elevenlabs.io"
API_HOST = "api.elevenlabs.io"
TARGET_SR = 48000
USER_AGENT = f"ai-confidence-video-narration/{TOOL_VERSION} (python-urllib)"

# Preferred output formats, best first. pcm_48000/pcm_44100 need Pro tier or above, mp3_44100_192 needs
# Creator or above, mp3_44100_128 works on every tier (SDK 2.71.0 docstring + ElevenLabs skills repo).
DEFAULT_FORMAT_CHAIN = ["pcm_48000", "pcm_44100", "mp3_44100_192", "mp3_44100_128"]

EXIT_FAIL, EXIT_USAGE, EXIT_NO_KEY, EXIT_NETWORK, EXIT_API, EXIT_AUDIO, EXIT_INPUT = 1, 2, 3, 4, 5, 6, 7

CONTEXT_PARAMS = ("previous_text", "next_text", "previous_request_ids", "next_request_ids")
OPTIONAL_TOP_PARAMS = ("seed", "language_code", "apply_text_normalization")
ALL_VOICE_SETTINGS = ("stability", "similarity_boost", "style", "use_speaker_boost", "speed")
PREV_CONTEXT_CHARS = 1000  # how much preceding text to send as previous_text
NEXT_CONTEXT_CHARS = 500  # how much following text to send as next_text

# ---------------------------------------------------------------------------------------------------------
# Model profiles. Built-in knowledge (see ELEVENLABS_NOTES.md for sources); refined at run time from
# GET /v1/models (can_use_style, can_use_speaker_boost, maximum_text_length_per_request) and adapted
# automatically if the API rejects a parameter.
#   settings : voice_settings keys the model honours
#   context  : default continuity mode -> "text" (previous_text/next_text), "ids" (previous_request_ids
#              + next_text, i.e. request stitching), "none"
# ---------------------------------------------------------------------------------------------------------
MODEL_PROFILES = {
    "eleven_v4": {
        # ElevenLabs skills repo (text-to-speech/SKILL.md, references/voice-settings.md): v4 uses only
        # stability + similarity_boost, no style/speed, no SSML; its request-stitching example uses
        # previous_text/next_text with eleven_v4. 10,000 chars/request (search-only).
        "settings": ("stability", "similarity_boost"),
        "context": "text",
        "max_chars": 10000,
        "defaults": {"stability": 0.6, "similarity_boost": 0.75},
        "language_code": True,
    },
    "eleven_v4_turbo": {
        "settings": ("stability", "similarity_boost"),
        "context": "text",
        "max_chars": 10000,
        "defaults": {"stability": 0.6, "similarity_boost": 0.75},
        "language_code": True,
    },
    "eleven_v3": {
        # SDK 2.71.0 types/eleven_v_3_voice_settings.py: stability only. Stability presets 0.0/0.5/1.0
        # (Creative/Natural/Robust) and "request stitching not available for v3" are search-only.
        "settings": ("stability",),
        "context": "none",
        "max_chars": 5000,
        "defaults": {"stability": 0.5},
        "stability_steps": (0.0, 0.5, 1.0),
        "language_code": True,
    },
    "eleven_multilingual_v2": {
        # SDK 2.71.0 types/tts_voice_settings.py (multilingual v2 request): stability, similarity_boost,
        # style, use_speaker_boost, speed. language_code NOT supported (SDK docstring).
        "settings": ("stability", "similarity_boost", "style", "use_speaker_boost", "speed"),
        "context": "ids",
        "max_chars": 10000,
        "defaults": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True,
                     "speed": 1.0},
        "language_code": False,
    },
    "eleven_flash_v2_5": {
        # SDK 2.71.0 types/eleven_flash_v_25_voice_settings.py: stability, similarity_boost, speed.
        "settings": ("stability", "similarity_boost", "speed"),
        "context": "ids",
        "max_chars": 40000,
        "defaults": {"stability": 0.5, "similarity_boost": 0.75, "speed": 1.0},
        "language_code": True,
    },
}
MODEL_PROFILES["eleven_turbo_v2_5"] = dict(MODEL_PROFILES["eleven_flash_v2_5"])
GENERIC_PROFILE = {
    "settings": ALL_VOICE_SETTINGS,
    "context": "text",
    "max_chars": None,
    "defaults": {"stability": 0.5, "similarity_boost": 0.75},
    "language_code": True,
}

REMEDIATION = """\
How to fix:
  1. Add ELEVENLABS_API_KEY as an environment variable / secret where this command runs.
     - Cloud session: add it to the environment's secrets/variables, then start a NEW session
       (secrets are only picked up by sessions started after they were added).
     - Local shell: export ELEVENLABS_API_KEY=...   (never commit it or paste it into project files)
  2. Allow outbound HTTPS (port 443) to api.elevenlabs.io in the network policy / proxy allowlist.
  3. Verify with:  python3 tools/elevenlabs_narration.py doctor"""


# ---------------------------------------------------------------------------------------------------------
# small utilities
# ---------------------------------------------------------------------------------------------------------
class ToolError(Exception):
    def __init__(self, message: str, exit_code: int = EXIT_FAIL):
        super().__init__(message)
        self.exit_code = exit_code


class MissingKeyError(ToolError):
    def __init__(self):
        super().__init__(f"ERROR: {ENV_KEY} is not set (or is empty).\n{REMEDIATION}", EXIT_NO_KEY)


class NetworkBlockedError(ToolError):
    def __init__(self, host: str, reason: str):
        super().__init__(
            f"ERROR: cannot reach {host}: {reason}\n"
            f"The host is blocked by the network policy/proxy, unresolvable, or offline.\n{REMEDIATION}",
            EXIT_NETWORK,
        )
        self.host = host
        self.reason = reason


class ApiError(ToolError):
    def __init__(self, status: int, code: str, message: str, body_text: str, headers: dict):
        self.status = status
        self.code = code or ""
        self.api_message = message or ""
        self.body_text = body_text or ""
        self.headers = headers or {}
        text = f"ElevenLabs API error HTTP {status}"
        if self.code:
            text += f" [{self.code}]"
        if self.api_message:
            text += f": {self.api_message}"
        super().__init__(redact(text), EXIT_API)

    def haystack(self) -> str:
        return f"{self.code} {self.api_message} {self.body_text}".lower()


class AudioError(ToolError):
    def __init__(self, message: str):
        super().__init__(message, EXIT_AUDIO)


class InputError(ToolError):
    def __init__(self, message: str):
        super().__init__(message, EXIT_INPUT)


def redact(text: str) -> str:
    """Remove the API key from any string before it is shown (defence in depth)."""
    if not isinstance(text, str):
        text = str(text)
    key = os.environ.get(ENV_KEY, "")
    if key and len(key) >= 4:
        text = text.replace(key, "<redacted>")
    return text


def log(msg: str = "") -> None:
    print(redact(msg), file=sys.stderr, flush=True)


def out(msg: str = "") -> None:
    print(redact(msg), flush=True)


def get_api_key() -> str:
    key = os.environ.get(ENV_KEY, "").strip()
    if not key:
        raise MissingKeyError()
    return key


def key_status() -> str:
    return "set (value hidden)" if os.environ.get(ENV_KEY, "").strip() else "NOT set"


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat()


def sha1(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def write_json(path: Path, obj) -> None:
    atomic_write_text(path, json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def rel_path(path: Path) -> str:
    """Path relative to the project root when possible (manifest convention), else absolute."""
    path = Path(path).resolve()
    try:
        return path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def resolve_manifest_path(p: str, base: Path | None = None) -> Path:
    """Manifest paths are relative to the manifest's folder (as in draft_tts.py)."""
    pp = Path(p)
    return pp if pp.is_absolute() else Path(base or PROJECT_ROOT) / pp


def validate_base_url(url: str) -> str:
    """Only send the key to ElevenLabs hosts (or localhost for offline tests)."""
    url = url.rstrip("/")
    parts = urllib.parse.urlsplit(url)
    host = (parts.hostname or "").lower()
    if parts.scheme == "https" and (host == "elevenlabs.io" or host.endswith(".elevenlabs.io")):
        return url
    if parts.scheme in ("http", "https") and host in ("localhost", "127.0.0.1", "::1"):
        return url
    raise ToolError(
        f"Refusing base URL {url!r}: the API key may only be sent to https://*.elevenlabs.io "
        f"(or localhost for offline tests).", EXIT_USAGE)


# ---------------------------------------------------------------------------------------------------------
# HTTP client (stdlib urllib, honours HTTPS_PROXY / NO_PROXY / SSL_CERT_FILE)
# ---------------------------------------------------------------------------------------------------------
class Response:
    def __init__(self, status: int, headers: dict, body: bytes):
        self.status = status
        self.headers = headers
        self.body = body

    def json(self):
        try:
            return json.loads(self.body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ToolError(f"Unexpected non-JSON response ({len(self.body)} bytes): {exc}", EXIT_API)

    @property
    def request_id(self):
        return self.headers.get("request-id") or self.headers.get("x-request-id")


def _parse_error_body(raw: bytes):
    """ElevenLabs errors look like {"detail": {"status": "...", "message": "..."}} or FastAPI 422
    {"detail": [{"loc": [...], "msg": "..."}]} or {"detail": "..."}."""
    text = raw.decode("utf-8", errors="replace") if raw else ""
    code, message = "", ""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return code, text.strip()[:500], text
    detail = data.get("detail", data) if isinstance(data, dict) else data
    if isinstance(detail, dict):
        code = str(detail.get("status") or detail.get("code") or detail.get("type") or "")
        message = str(detail.get("message") or detail.get("msg") or detail.get("detail") or "")
    elif isinstance(detail, list):
        msgs = []
        for item in detail:
            if isinstance(item, dict):
                loc = ".".join(str(x) for x in item.get("loc", []) if x != "body")
                msgs.append(f"{loc}: {item.get('msg', '')}".strip(": "))
            else:
                msgs.append(str(item))
        message = "; ".join(msgs)
        code = "validation_error"
    else:
        message = str(detail)
    return code, message[:800], text


def _retry_delay(headers: dict, attempt: int) -> float:
    for name, scale in (("retry-after-ms", 0.001), ("retry-after", 1.0)):
        val = headers.get(name)
        if val is not None:
            try:
                secs = float(val) * scale
                if secs >= 0:
                    return min(secs, 60.0)
            except ValueError:
                pass
    base = min(1.0 * (2 ** attempt), 60.0)
    return base * (1.0 + random.random() * 0.25)


def _describe_url_error(reason) -> tuple[bool, str]:
    """Return (retryable, description) for a urllib URLError reason."""
    text = str(reason)
    low = text.lower()
    if "tunnel connection failed" in low:  # proxy refused CONNECT (403/407 = policy denial)
        return False, f"proxy refused the connection ({text}) - host blocked by network policy"
    if isinstance(reason, socket.gaierror) or "name or service not known" in low or "nodename nor servname" in low \
            or "temporary failure in name resolution" in low:
        return False, f"DNS lookup failed ({text})"
    if isinstance(reason, ssl.SSLCertVerificationError) or "certificate verify failed" in low:
        return False, (f"TLS certificate verification failed ({text}); if a corporate proxy re-signs TLS, "
                       f"point SSL_CERT_FILE at its CA bundle")
    if isinstance(reason, ConnectionRefusedError) or "connection refused" in low:
        return False, f"connection refused ({text})"
    if isinstance(reason, (TimeoutError, socket.timeout)) or "timed out" in low:
        return True, f"timed out ({text})"
    if isinstance(reason, (ConnectionResetError, ConnectionAbortedError)) or "reset" in low:
        return True, f"connection reset ({text})"
    return True, text


class ElevenLabsClient:
    RETRYABLE_STATUS = {408, 409, 429}  # plus every 5xx (same policy as the official SDK)

    def __init__(self, api_key: str | None, base_url: str = DEFAULT_BASE_URL, timeout: float = 180.0,
                 max_retries: int = 6, verbose: bool = False, sleep=time.sleep):
        self._api_key = api_key  # never printed
        self.base_url = validate_base_url(base_url)
        self.host = urllib.parse.urlsplit(self.base_url).hostname or API_HOST
        self.timeout = timeout
        self.max_retries = max_retries
        self.verbose = verbose
        self._sleep = sleep
        handlers = []
        if self.host in ("localhost", "127.0.0.1", "::1"):
            handlers.append(urllib.request.ProxyHandler({}))  # never route local test traffic via a proxy
        self._opener = urllib.request.build_opener(*handlers)
        self.retry_log: list[str] = []

    # -- core ------------------------------------------------------------------------------------------
    def request(self, method: str, path: str, *, query: dict | None = None, json_body=None,
                data: bytes | None = None, content_type: str | None = None, accept: str = "application/json",
                send_key: bool = True) -> Response:
        url = f"{self.base_url}/{path.lstrip('/')}"
        if query:
            q = {k: (str(v).lower() if isinstance(v, bool) else v) for k, v in query.items() if v is not None}
            if q:
                url += "?" + urllib.parse.urlencode(q, doseq=True)
        if json_body is not None:
            data = json.dumps(json_body, ensure_ascii=False).encode("utf-8")
            content_type = "application/json"
        headers = {"Accept": accept, "User-Agent": USER_AGENT}
        if content_type:
            headers["Content-Type"] = content_type
        if send_key and self._api_key:
            headers["xi-api-key"] = self._api_key
        attempt = 0
        while True:
            if self.verbose:
                log(f"  -> {method} {url}")
            req = urllib.request.Request(url, data=data, method=method, headers=headers)
            try:
                with self._opener.open(req, timeout=self.timeout) as resp:
                    body = resp.read()
                    hdrs = {k.lower(): v for k, v in resp.headers.items()}
                    return Response(resp.status, hdrs, body)
            except urllib.error.HTTPError as exc:
                status = exc.code
                hdrs = {k.lower(): v for k, v in (exc.headers.items() if exc.headers else [])}
                try:
                    raw = exc.read()
                except Exception:  # pragma: no cover
                    raw = b""
                code, message, text = _parse_error_body(raw)
                retryable = status >= 500 or status in self.RETRYABLE_STATUS
                if retryable and attempt < self.max_retries:
                    delay = _retry_delay(hdrs, attempt)
                    note = f"HTTP {status} {code or ''} on {method} /{path.lstrip('/')}: retry {attempt + 1}/" \
                           f"{self.max_retries} in {delay:.1f}s"
                    self.retry_log.append(note)
                    log("  " + note)
                    self._sleep(delay)
                    attempt += 1
                    continue
                raise ApiError(status, code, message, text, hdrs) from None
            except urllib.error.URLError as exc:
                retryable, desc = _describe_url_error(exc.reason)
                if retryable and attempt < self.max_retries:
                    delay = _retry_delay({}, attempt)
                    note = f"network error ({desc}): retry {attempt + 1}/{self.max_retries} in {delay:.1f}s"
                    self.retry_log.append(note)
                    log("  " + note)
                    self._sleep(delay)
                    attempt += 1
                    continue
                raise NetworkBlockedError(self.host, desc) from None
            except (TimeoutError, socket.timeout, ConnectionResetError, http.client.RemoteDisconnected,
                    http.client.IncompleteRead) as exc:
                if attempt < self.max_retries:
                    delay = _retry_delay({}, attempt)
                    note = f"network error ({type(exc).__name__}): retry {attempt + 1}/{self.max_retries} " \
                           f"in {delay:.1f}s"
                    self.retry_log.append(note)
                    log("  " + note)
                    self._sleep(delay)
                    attempt += 1
                    continue
                raise NetworkBlockedError(self.host, f"{type(exc).__name__}: {exc}") from None

    # -- endpoints (paths verified against elevenlabs SDK 2.71.0) ---------------------------------------
    def list_models(self) -> list:
        return self.request("GET", "v1/models").json()

    def get_voice(self, voice_id: str) -> dict:
        return self.request("GET", f"v1/voices/{urllib.parse.quote(voice_id, safe='')}").json()

    def search_voices(self, **params):
        token = None
        while True:
            q = dict(params)
            q["page_size"] = q.get("page_size") or 100
            if token:
                q["next_page_token"] = token
            data = self.request("GET", "v2/voices", query=q).json()
            for v in data.get("voices", []):
                yield v
            token = data.get("next_page_token")
            if not data.get("has_more") or not token:
                break

    def shared_voices(self, limit: int = 100, **params):
        page, n = 0, 0
        while n < limit:
            q = dict(params)
            q["page_size"] = min(100, limit - n)
            q["page"] = page
            data = self.request("GET", "v1/shared-voices", query=q).json()
            voices = data.get("voices", [])
            for v in voices:
                yield v
                n += 1
            if not data.get("has_more") or not voices:
                break
            page += 1

    def add_shared_voice(self, public_owner_id: str, voice_id: str, new_name: str) -> dict:
        path = f"v1/voices/add/{urllib.parse.quote(public_owner_id, safe='')}/{urllib.parse.quote(voice_id, safe='')}"
        return self.request("POST", path, json_body={"new_name": new_name}).json()

    def subscription(self) -> dict:
        return self.request("GET", "v1/user/subscription").json()

    def tts_with_timestamps(self, voice_id: str, body: dict, output_format: str) -> Response:
        return self.request("POST", f"v1/text-to-speech/{urllib.parse.quote(voice_id, safe='')}/with-timestamps",
                            query={"output_format": output_format}, json_body=body)

    def tts_plain(self, voice_id: str, body: dict, output_format: str) -> Response:
        return self.request("POST", f"v1/text-to-speech/{urllib.parse.quote(voice_id, safe='')}",
                            query={"output_format": output_format}, json_body=body, accept="*/*")

    def forced_alignment(self, audio_path: Path, text: str) -> dict:
        boundary = "----elevenlabs-narration-" + uuid.uuid4().hex
        buf = io.BytesIO()
        buf.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"text\"\r\n\r\n".encode())
        buf.write(text.encode("utf-8") + b"\r\n")
        buf.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{audio_path.name}\"\r\n"
                  f"Content-Type: audio/wav\r\n\r\n".encode())
        buf.write(Path(audio_path).read_bytes() + b"\r\n")
        buf.write(f"--{boundary}--\r\n".encode())
        return self.request("POST", "v1/forced-alignment", data=buf.getvalue(),
                            content_type=f"multipart/form-data; boundary={boundary}").json()


# ---------------------------------------------------------------------------------------------------------
# segments input
# ---------------------------------------------------------------------------------------------------------
SEG_ID_RE = re.compile(r"^[A-Za-z0-9_.-]+$")
KOKORO_MARKUP_RE = re.compile(r"\[[^\]]+\]\(/[^)]*/\)")


class Segment:
    __slots__ = ("id", "text", "pause_after_ms", "tts_text")

    def __init__(self, id: str, text: str, pause_after_ms: int = 0, tts_text: str | None = None):
        self.id = id
        self.text = text
        self.pause_after_ms = pause_after_ms
        self.tts_text = tts_text

    @property
    def spoken(self) -> str:
        if self.tts_text and self.tts_text.strip():
            return self.tts_text.strip()
        return self.text.strip()


def load_segments(path: Path) -> list[Segment]:
    path = Path(path)
    if not path.exists():
        raise InputError(f"Segments file not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise InputError(f"Segments file is not valid JSON ({path}): {exc}")
    items = data.get("segments") if isinstance(data, dict) else data
    if not isinstance(items, list) or not items:
        raise InputError(f'{path}: expected {{"segments": [...]}} with at least one segment')
    segs, seen = [], set()
    for n, item in enumerate(items, 1):
        if not isinstance(item, dict):
            raise InputError(f"{path}: segment #{n} is not an object")
        sid = item.get("id")
        if not isinstance(sid, str) or not SEG_ID_RE.match(sid):
            raise InputError(f"{path}: segment #{n} has a missing/invalid id {sid!r} (allowed: letters, digits, _ . -)")
        if sid in seen:
            raise InputError(f"{path}: duplicate segment id {sid!r}")
        seen.add(sid)
        text = item.get("text")
        if not isinstance(text, str) or not text.strip():
            raise InputError(f"{path}: segment {sid} has empty or missing 'text'")
        # ElevenLabs-specific spoken text wins. The shared `tts_text` field may hold Kokoro/misaki
        # inline phoneme markup like "[Kalai](/kəlˈI/)", which ElevenLabs v3/v4 would misread as an
        # audio tag, so such markup is never sent; the plain display text is used instead.
        tts = item.get("tts_text_elevenlabs")
        if tts is None:
            tts = item.get("tts_text")
            if isinstance(tts, str) and KOKORO_MARKUP_RE.search(tts):
                tts = None
        if tts is not None and not isinstance(tts, str):
            raise InputError(f"{path}: segment {sid} 'tts_text' must be a string")
        pause = item.get("pause_after_ms", 0)
        if pause is None:
            pause = 0
        if isinstance(pause, bool) or not isinstance(pause, (int, float)) or pause < 0:
            raise InputError(f"{path}: segment {sid} 'pause_after_ms' must be a non-negative number")
        segs.append(Segment(sid, text, int(round(pause)), tts))
    return segs


def parse_only(only: str | None, segs: list[Segment]) -> set[str] | None:
    if not only:
        return None
    wanted = [s.strip() for s in only.split(",") if s.strip()]
    if not wanted:
        return None
    ids = {s.id for s in segs}
    unknown = [w for w in wanted if w not in ids]
    if unknown:
        raise InputError(f"--only: unknown segment id(s) {', '.join(unknown)}; valid ids: {', '.join(s.id for s in segs)}")
    return set(wanted)


# ---------------------------------------------------------------------------------------------------------
# model profile / settings / request bodies
# ---------------------------------------------------------------------------------------------------------
def get_profile(model_id: str, model_info: dict | None = None) -> dict:
    prof = MODEL_PROFILES.get(model_id)
    prof = {k: (list(v) if isinstance(v, tuple) else v) for k, v in (prof or GENERIC_PROFILE).items()}
    prof["defaults"] = dict(prof["defaults"])
    prof["known"] = model_id in MODEL_PROFILES
    if model_info:
        if model_info.get("can_use_style") is False and "style" in prof["settings"]:
            prof["settings"].remove("style")
        if model_info.get("can_use_speaker_boost") is False and "use_speaker_boost" in prof["settings"]:
            prof["settings"].remove("use_speaker_boost")
        mx = model_info.get("maximum_text_length_per_request")
        if isinstance(mx, int) and mx > 0:
            prof["max_chars"] = mx
    return prof


def user_settings_from_args(args) -> dict:
    s = {}
    for arg, key in (("stability", "stability"), ("similarity", "similarity_boost"), ("style", "style"),
                     ("speed", "speed")):
        val = getattr(args, arg, None)
        if val is not None:
            s[key] = val
    sb = getattr(args, "speaker_boost", None)
    if sb is not None:
        s["use_speaker_boost"] = sb
    return s


def resolve_voice_settings(model_id: str, profile: dict, user: dict, force: bool = False):
    """Merge profile defaults with user overrides, keeping only keys the model honours."""
    warnings = []
    settings = {k: v for k, v in profile["defaults"].items() if k in profile["settings"]}
    for k, v in user.items():
        if k in profile["settings"] or force:
            settings[k] = v
        else:
            warnings.append(f"{k}={v} is not supported by {model_id}; not sent "
                            f"(supported: {', '.join(profile['settings']) or 'none'}; use --force-settings to send anyway)")
    steps = profile.get("stability_steps")
    if steps and "stability" in settings and not force:
        snapped = min(steps, key=lambda x: abs(x - settings["stability"]))
        if snapped != settings["stability"]:
            warnings.append(f"{model_id}: stability {settings['stability']} snapped to {snapped} "
                            f"(this model takes {', '.join(str(x) for x in steps)})")
            settings["stability"] = snapped
    return settings, warnings


def resolve_context_mode(requested: str, profile: dict) -> str:
    return profile["context"] if requested == "auto" else requested


def _tail(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    cut = text[-limit:]
    sp = cut.find(" ")
    return cut[sp + 1:] if 0 <= sp < 80 else cut


def _head(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit]
    sp = cut.rfind(" ")
    return cut[:sp] if sp > limit - 80 else cut


def text_context(idx: int, spoken: list[str]) -> dict:
    """previous_text/next_text from neighbouring segments' spoken text, with inline audio tags removed."""
    spoken = [re.sub(r"\s{2,}", " ", _INLINE_TAG_RE.sub("", t)).strip() for t in spoken]
    ctx = {}
    if idx > 0:
        ctx["previous_text"] = _tail(" ".join(spoken[:idx]), PREV_CONTEXT_CHARS)
    if idx + 1 < len(spoken):
        ctx["next_text"] = _head(" ".join(spoken[idx + 1:]), NEXT_CONTEXT_CHARS)
    return ctx


def build_context(mode: str, idx: int, segs: list[Segment], request_ids: dict, next_ids_ok: bool = False) -> dict:
    """Continuity parameters for segment idx.
    mode "text": previous_text/next_text.
    mode "ids" : previous_request_ids (<=3 immediately preceding segments, when known) + next_text, or
                 next_request_ids when regenerating and the following segments' request ids are known.
    """
    if mode == "none":
        return {}
    spoken = [s.spoken for s in segs]
    ctx = text_context(idx, spoken)
    if mode == "ids":
        prev = []
        for j in range(idx - 1, max(-1, idx - 4), -1):
            rid = request_ids.get(segs[j].id)
            if not rid:
                break
            prev.insert(0, rid)
        if prev:
            ctx.pop("previous_text", None)  # API ignores previous_text when previous_request_ids is sent
            ctx["previous_request_ids"] = prev
        if next_ids_ok:
            nxt = []
            for j in range(idx + 1, min(len(segs), idx + 4)):
                rid = request_ids.get(segs[j].id)
                if not rid:
                    break
                nxt.append(rid)
            if nxt:
                ctx.pop("next_text", None)
                ctx["next_request_ids"] = nxt
    return ctx


def build_body(text: str, model_id: str, voice_settings: dict, *, seed=None, language_code=None,
               normalization=None, context: dict | None = None) -> dict:
    body = {"text": text, "model_id": model_id}
    if voice_settings:
        body["voice_settings"] = dict(voice_settings)
    if seed is not None:
        body["seed"] = int(seed)
    if language_code:
        body["language_code"] = language_code
    if normalization:
        body["apply_text_normalization"] = normalization
    if context:
        body.update(context)
    return body


def build_format_chain(preferred: str | None) -> list[str]:
    chain = list(DEFAULT_FORMAT_CHAIN)
    if preferred:
        if preferred in chain:
            chain = chain[chain.index(preferred):]
        else:
            chain = [preferred] + [f for f in chain if f.startswith("mp3_")]
    return chain


# ---------------------------------------------------------------------------------------------------------
# synthesis with automatic fallbacks
# ---------------------------------------------------------------------------------------------------------
class Synthesizer:
    """Calls the with-timestamps endpoint and adapts when the account/model rejects something:
    * output_format not allowed for the tier -> next format in the chain (remembered for the run)
    * a named parameter rejected (context / seed / language_code / a voice setting) -> dropped for the run
    * request ids rejected (e.g. expired) -> previous_text/next_text for that request
    * with-timestamps unsupported for the model -> plain TTS + POST /v1/forced-alignment (optional)
    """

    def __init__(self, client: ElevenLabsClient, model_id: str, format_chain: list[str],
                 forced_alignment_fallback: bool = True):
        self.client = client
        self.model_id = model_id
        self.formats = list(format_chain)
        self.dropped: set[str] = set()  # "seed", "previous_text", "voice_settings.style", ...
        self.notes: list[str] = []
        self.forced_alignment_fallback = forced_alignment_fallback
        self.use_forced_alignment = False

    def _note(self, msg: str) -> None:
        if msg not in self.notes:
            self.notes.append(msg)
        log("  NOTE: " + msg)

    def _apply_drops(self, body: dict, text_ctx: dict | None = None) -> dict:
        body = json.loads(json.dumps(body))
        for d in self.dropped:
            if d.startswith("voice_settings."):
                body.get("voice_settings", {}).pop(d.split(".", 1)[1], None)
            else:
                body.pop(d, None)
        # a rejected request-id parameter is replaced by its text equivalent (unless that was rejected too)
        for ids_param, text_param in (("previous_request_ids", "previous_text"), ("next_request_ids", "next_text")):
            if ids_param in self.dropped and text_param not in self.dropped and text_param not in body \
                    and text_ctx and text_ctx.get(text_param):
                body[text_param] = text_ctx[text_param]
        if "voice_settings" in body and not body["voice_settings"]:
            body.pop("voice_settings")
        return body

    @staticmethod
    def _is_format_rejection(err: ApiError, fmt: str) -> bool:
        h = err.haystack()
        if "output_format" in h or "output format" in h or fmt.lower() in h:
            return True
        return err.status == 403 and any(w in h for w in ("tier", "subscription", "plan", "upgrade"))

    def synthesize(self, voice_id: str, body: dict, text_ctx: dict, tmpdir: Path):
        """Returns dict(audio=bytes, fmt=str, alignment=dict|None, normalized_alignment=dict|None,
        request_id=str|None, char_count=str|None, sent_body=dict, alignment_source=str)."""
        body = self._apply_drops(body, text_ctx)
        tried_text_ctx = tried_no_ctx = False
        for _ in range(12):
            fmt = self.formats[0]
            try:
                if self.use_forced_alignment:
                    return self._synth_plain_plus_alignment(voice_id, body, fmt, tmpdir)
                resp = self.client.tts_with_timestamps(voice_id, body, fmt)
                data = resp.json()
                b64 = data.get("audio_base64") or data.get("audio_base_64")
                if not b64:
                    raise ToolError("with-timestamps response contained no audio_base64", EXIT_API)
                return {
                    "audio": base64.b64decode(b64), "fmt": fmt, "alignment": data.get("alignment"),
                    "normalized_alignment": data.get("normalized_alignment"), "request_id": resp.request_id,
                    "char_count": resp.headers.get("x-character-count"), "sent_body": body,
                    "alignment_source": "with-timestamps",
                }
            except ApiError as err:
                if err.status not in (400, 402, 403, 404, 405, 422):
                    raise
                h = err.haystack()
                if "voice_not_found" in h or (err.status == 404 and "voice" in h):
                    raise
                if self._is_format_rejection(err, fmt) and len(self.formats) > 1:
                    self.formats.pop(0)
                    self._note(f"output_format {fmt} rejected (HTTP {err.status}: {err.api_message or err.code}); "
                               f"falling back to {self.formats[0]}")
                    continue
                named = [p for p in CONTEXT_PARAMS + OPTIONAL_TOP_PARAMS if p in body and p in h]
                named += [f"voice_settings.{k}" for k in body.get("voice_settings", {})
                          if k != "stability" and k in h]
                if named:
                    self.dropped.update(named)
                    self._note(f"{self.model_id} rejected {', '.join(named)} (HTTP {err.status}: "
                               f"{err.api_message or err.code}); retrying without it for the rest of the run")
                    body = self._apply_drops(body, text_ctx)
                    continue
                if ("timestamp" in h or err.status == 405) and self.forced_alignment_fallback \
                        and not self.use_forced_alignment:
                    self.use_forced_alignment = True
                    self._note(f"with-timestamps not available for {self.model_id} (HTTP {err.status}: "
                               f"{err.api_message or err.code}); using plain TTS + /v1/forced-alignment")
                    continue
                has_ids = any(p in body for p in ("previous_request_ids", "next_request_ids"))
                if has_ids and not tried_text_ctx:
                    tried_text_ctx = True
                    for p in CONTEXT_PARAMS:
                        body.pop(p, None)
                    body.update({k: v for k, v in text_ctx.items() if k not in self.dropped})
                    self._note(f"request ids not accepted (HTTP {err.status}: {err.api_message or err.code}); "
                               f"used previous_text/next_text for this request")
                    continue
                if any(p in body for p in CONTEXT_PARAMS) and not tried_no_ctx and err.status in (400, 422):
                    tried_no_ctx = True
                    for p in CONTEXT_PARAMS:
                        body.pop(p, None)
                    self._note(f"request failed with continuity context (HTTP {err.status}: "
                               f"{err.api_message or err.code}); retried without context")
                    continue
                raise
        raise ToolError("Too many fallback attempts; giving up", EXIT_API)

    def _synth_plain_plus_alignment(self, voice_id, body, fmt, tmpdir: Path):
        resp = self.client.tts_plain(voice_id, body, fmt)
        audio = resp.body
        raw = tmpdir / f"fa_{uuid.uuid4().hex}{raw_extension(fmt)}"
        raw.write_bytes(audio)
        wav = tmpdir / (raw.stem + ".wav")
        convert_to_wav(find_ffmpeg(required=True), raw, fmt, wav)
        spoken = re.sub(r"\s{2,}", " ", _INLINE_TAG_RE.sub("", body["text"])).strip()  # tags are not spoken words
        fa = self.client.forced_alignment(wav, spoken)
        chars = fa.get("characters") or []
        alignment = {
            "characters": [c.get("text", "") for c in chars],
            "character_start_times_seconds": [float(c.get("start", 0.0)) for c in chars],
            "character_end_times_seconds": [float(c.get("end", 0.0)) for c in chars],
        }
        return {"audio": audio, "fmt": fmt, "alignment": alignment, "normalized_alignment": None,
                "request_id": resp.request_id, "char_count": resp.headers.get("x-character-count"),
                "sent_body": body, "alignment_source": "forced-alignment", "forced_alignment_words": fa.get("words")}


# ---------------------------------------------------------------------------------------------------------
# audio (ffmpeg)
# ---------------------------------------------------------------------------------------------------------
_SOXR_CACHE: dict = {}


def find_ffmpeg(required: bool = False) -> str | None:
    path = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if required and not path:
        raise AudioError("ERROR: ffmpeg not found on PATH (install it, e.g. `sudo apt-get install ffmpeg`, "
                         "or set FFMPEG=/path/to/ffmpeg).")
    return path


def ffmpeg_has_soxr(ffmpeg: str) -> bool:
    if ffmpeg not in _SOXR_CACHE:
        try:
            r = subprocess.run([ffmpeg, "-hide_banner", "-h", "filter=aresample"], capture_output=True,
                               text=True, timeout=30)
            _SOXR_CACHE[ffmpeg] = "soxr" in (r.stdout + r.stderr)
        except (OSError, subprocess.SubprocessError):
            _SOXR_CACHE[ffmpeg] = False
    return _SOXR_CACHE[ffmpeg]


def parse_output_format(fmt: str):
    parts = fmt.split("_")
    if len(parts) < 2 or not parts[1].isdigit():
        raise ToolError(f"Unrecognised output_format {fmt!r}", EXIT_USAGE)
    return parts[0], int(parts[1]), (int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else None)


def raw_extension(fmt: str) -> str:
    codec = parse_output_format(fmt)[0]
    return {"pcm": ".pcm", "mp3": ".mp3", "wav": ".wav", "opus": ".opus", "ulaw": ".ulaw", "alaw": ".alaw"}.get(codec, ".bin")


def convert_to_wav(ffmpeg: str, src: Path, fmt: str, dst: Path, tempo: float = 1.0) -> None:
    """Convert ElevenLabs output (raw s16le PCM, MP3, WAV, ...) to 48 kHz mono 16-bit WAV."""
    codec, rate, _ = parse_output_format(fmt)
    if codec == "pcm":
        inp = ["-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", str(src)]
    elif codec == "ulaw":
        inp = ["-f", "mulaw", "-ar", str(rate), "-ac", "1", "-i", str(src)]
    elif codec == "alaw":
        inp = ["-f", "alaw", "-ar", str(rate), "-ac", "1", "-i", str(src)]
    else:
        inp = ["-i", str(src)]
    filters = []
    if abs(tempo - 1.0) > 1e-6:
        filters.append(f"atempo={tempo:.6f}")
    filters.append(f"aresample={TARGET_SR}" + (":resampler=soxr:precision=28" if ffmpeg_has_soxr(ffmpeg) else ""))
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_name(dst.stem + ".partial.wav")
    cmd = [ffmpeg, "-hide_banner", "-nostdin", "-loglevel", "error", "-y", *inp, "-af", ",".join(filters),
           "-ac", "1", "-ar", str(TARGET_SR), "-c:a", "pcm_s16le", str(tmp)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    except (OSError, subprocess.SubprocessError) as exc:
        raise AudioError(f"ffmpeg failed to run: {exc}")
    if r.returncode != 0 or not tmp.exists():
        try:
            tmp.unlink()
        except OSError:
            pass
        raise AudioError(f"ffmpeg conversion failed for {src.name} ({fmt}): {r.stderr.strip()[-800:]}")
    os.replace(tmp, dst)


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def wav_info(path: Path) -> dict:
    with wave.open(str(path), "rb") as w:
        return {"sample_rate": w.getframerate(), "channels": w.getnchannels(), "sample_width": w.getsampwidth(),
                "frames": w.getnframes(), "duration_s": w.getnframes() / float(w.getframerate())}


# ---------------------------------------------------------------------------------------------------------
# alignment -> words
# ---------------------------------------------------------------------------------------------------------
_TAG_PAIRS = {"[": "]", "<": ">"}
_TAG_MAX_LEN = 200


def normalize_alignment(al: dict | None) -> dict | None:
    """Accept SDK field names (character_*_times_seconds) and tolerate *_ms variants."""
    if not al:
        return None
    chars = al.get("characters") or al.get("chars")
    starts = al.get("character_start_times_seconds")
    ends = al.get("character_end_times_seconds")
    if starts is None and al.get("char_start_times_ms") is not None:
        starts = [x / 1000.0 for x in al["char_start_times_ms"]]
        ends = [x / 1000.0 for x in al.get("char_end_times_ms") or al.get("char_durations_ms") or []]
    if not chars or starts is None or ends is None:
        return None
    n = min(len(chars), len(starts), len(ends))
    return {"characters": list(chars[:n]), "character_start_times_seconds": [float(x) for x in starts[:n]],
            "character_end_times_seconds": [float(x) for x in ends[:n]]}


def scale_alignment(al: dict, factor: float, max_t: float | None = None) -> dict:
    def f(x):
        y = x * factor
        if max_t is not None:
            y = min(y, max_t)
        return round(max(0.0, y), 4)
    return {"characters": list(al["characters"]),
            "character_start_times_seconds": [f(x) for x in al["character_start_times_seconds"]],
            "character_end_times_seconds": [f(x) for x in al["character_end_times_seconds"]]}


def tokens_from_chars(chars: list[str], starts: list[float] | None = None, ends: list[float] | None = None):
    """Group characters into whitespace-separated tokens. Bracketed audio tags like [laughs] and SSML-ish
    <break .../> tags are removed (Eleven v3/v4 keep tag characters in the alignment). Tokens without any
    letter/digit (e.g. a lone dash) are dropped."""
    n = len(chars)
    starts = starts if starts is not None else [0.0] * n
    ends = ends if ends is not None else [0.0] * n
    tokens, cur = [], None
    i = 0
    while i < n:
        c = chars[i]
        if c in _TAG_PAIRS:
            close = _TAG_PAIRS[c]
            j = next((k for k in range(i + 1, min(n, i + _TAG_MAX_LEN)) if chars[k] == close), None)
            if j is not None:
                if cur:
                    tokens.append(cur)
                    cur = None
                i = j + 1
                continue
        if not c or c.isspace():
            if cur:
                tokens.append(cur)
                cur = None
            i += 1
            continue
        if cur is None:
            cur = {"text": c, "start": starts[i], "end": ends[i], "c0": i, "c1": i + 1}
        else:
            cur["text"] += c
            cur["end"] = max(cur["end"], ends[i])
            cur["c1"] = i + 1
        i += 1
    if cur:
        tokens.append(cur)
    return [t for t in tokens if any(ch.isalnum() for ch in t["text"])]


def _norm_word(w: str) -> str:
    w = unicodedata.normalize("NFKD", w)
    return "".join(ch.lower() for ch in w if ch.isalnum())


_INLINE_TAG_RE = re.compile(r"\[[^\[\]]{0,200}\]|<[^<>]{0,200}>")


def display_tokens(text: str) -> list[dict]:
    """One entry per whitespace-separated token of the display text (same split as build_timeline.py:
    text.split()). 'content' tokens contain a letter/digit once inline tags are removed."""
    toks = []
    for raw in text.split():
        clean = _INLINE_TAG_RE.sub("", raw)
        toks.append({"raw": raw, "clean": clean, "content": any(ch.isalnum() for ch in clean)})
    return toks


def map_timings(spoken_tokens: list[dict], words: list[str]) -> list[tuple[float, float]]:
    """Give each of `words` a (start, end) taken from the spoken tokens' timings. Identical word sequences map
    1:1; otherwise difflib aligns them (respellings in tts_text, split/merged words, extra/missing words)."""
    if not words:
        return []
    if not spoken_tokens:
        return [(0.0, 0.0)] * len(words)
    a = [_norm_word(t["text"]) for t in spoken_tokens]
    b = [_norm_word(w) for w in words]
    if a == b:
        return [(t["start"], t["end"]) for t in spoken_tokens]
    res: list = [None] * len(words)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(j2 - j1):
                t = spoken_tokens[i1 + k]
                res[j1 + k] = (t["start"], t["end"])
        elif tag == "replace":
            span_s, span_e = spoken_tokens[i1]["start"], spoken_tokens[i2 - 1]["end"]
            weights = [max(1, len(b[j])) for j in range(j1, j2)]
            total, acc = float(sum(weights)), 0.0
            for j, wgt in zip(range(j1, j2), weights):
                s0 = span_s + (span_e - span_s) * acc / total
                acc += wgt
                res[j] = (s0, span_s + (span_e - span_s) * acc / total)
        elif tag == "insert":  # words with no spoken counterpart: share the gap around them
            prev_end = spoken_tokens[i1 - 1]["end"] if i1 > 0 else spoken_tokens[0]["start"]
            next_start = spoken_tokens[i1]["start"] if i1 < len(spoken_tokens) else prev_end
            span_s, span_e = prev_end, max(prev_end, next_start)
            cnt = j2 - j1
            for k, j in enumerate(range(j1, j2)):
                res[j] = (span_s + (span_e - span_s) * k / cnt, span_s + (span_e - span_s) * (k + 1) / cnt)
        # "delete": spoken-only tokens are skipped
    return res


def derive_words(alignment: dict | None, spoken_text: str, display_text: str | None, duration: float | None = None):
    """Character alignment -> [{word, start, end}] (seconds) with exactly one entry per whitespace token of the
    display text, so consumers can zip it with text.split(). Timings come from the spoken text's alignment
    (tts_text if used), audio tags such as [laughs] are ignored, tokens without letters/digits (a lone dash)
    get a zero-length slot at the previous word's end, and everything is clamped to the audio duration and
    kept monotonic."""
    al = normalize_alignment(alignment)
    if al is None:
        return []
    toks = tokens_from_chars(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
    disp = display_tokens(display_text if display_text is not None else spoken_text)
    content = [i for i, d in enumerate(disp) if d["content"]]
    timings: list = [None] * len(disp)
    for i, t in zip(content, map_timings(toks, [disp[i]["clean"] for i in content])):
        timings[i] = t
    first = next((t[0] for t in timings if t is not None), 0.0)
    result, last_start, last_end = [], 0.0, None
    for d, t in zip(disp, timings):
        if t is None:
            anchor = last_end if last_end is not None else first
            t = (anchor, anchor)
        s0, e0 = float(t[0]), float(t[1])
        if duration is not None:
            s0, e0 = min(s0, duration), min(e0, duration)
        s0 = max(s0, last_start, 0.0)
        e0 = max(e0, s0)
        last_start, last_end = s0, e0
        result.append({"word": d["clean"] if d["content"] else d["raw"], "start": round(s0, 3), "end": round(e0, 3)})
    return result


# ---------------------------------------------------------------------------------------------------------
# manifest
# ---------------------------------------------------------------------------------------------------------
def load_manifest(path: Path) -> dict | None:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def entry_files_exist(entry: dict, base: Path) -> bool:
    for k in ("file", "words_file", "alignment_file"):
        if entry.get(k) and not resolve_manifest_path(entry[k], base).exists():
            return False
    return bool(entry.get("file"))


def build_manifest(*, model: str, voice_id: str, voice_name, settings: dict, segs: list[Segment],
                   entries: dict, segments_path: Path, notes: list[str]) -> dict:
    ordered = [entries[s.id] for s in segs if s.id in entries]
    missing = [s.id for s in segs if s.id not in entries]
    return {
        "engine": "elevenlabs",
        "model": model,
        "voice_id": voice_id,
        "voice_name": voice_name,
        "voice": voice_id,
        "settings": settings,
        "status": "PREMIUM - ElevenLabs narration" + ("" if not missing else " (incomplete)"),
        "license": "ElevenLabs output; usage rights follow the account's plan (paid plans include commercial use; "
                   "verify current ElevenLabs terms)",
        "sample_rate": TARGET_SR,
        "bit_depth": 16,
        "channels": 1,
        "paths_relative_to": "manifest_dir",
        "api": "POST /v1/text-to-speech/{voice_id}/with-timestamps",
        "tool": f"tools/elevenlabs_narration.py {TOOL_VERSION}",
        "generated_at": now_iso(),
        "segments_source": rel_path(segments_path),
        "complete": not missing,
        "missing_segments": missing,
        "total_duration_s": round(sum(e.get("duration_s", 0.0) for e in ordered), 3),
        "total_pause_ms": sum(e.get("pause_after_ms", 0) for e in ordered),
        "notes": notes,
        "segments": ordered,
    }


# ---------------------------------------------------------------------------------------------------------
# dry run
# ---------------------------------------------------------------------------------------------------------
def dry_run_request(base_url: str, voice_id: str, body: dict, fmt_chain: list[str], label: str) -> dict:
    url = f"{base_url}/v1/text-to-speech/{voice_id}/with-timestamps?" + urllib.parse.urlencode({"output_format": fmt_chain[0]})
    return {
        "segment": label,
        "method": "POST",
        "url": url,
        "headers": {"xi-api-key": f"<omitted: read from ${ENV_KEY} at run time>",
                    "Content-Type": "application/json"},
        "json": body,
        "output_format_fallbacks": fmt_chain[1:],
    }


# ---------------------------------------------------------------------------------------------------------
# commands
# ---------------------------------------------------------------------------------------------------------
def make_client(args, need_key: bool = True) -> ElevenLabsClient:
    key = get_api_key() if need_key else (os.environ.get(ENV_KEY, "").strip() or None)
    base = getattr(args, "base_url", None) or os.environ.get(ENV_BASE_URL) or DEFAULT_BASE_URL
    return ElevenLabsClient(key, base, timeout=args.timeout, max_retries=args.max_retries, verbose=args.verbose)


def fetch_model_info(client: ElevenLabsClient, model_id: str, warn: bool = True):
    """Returns (info_or_None, listed: bool|None). None when /v1/models could not be read."""
    try:
        models = client.list_models()
    except ApiError as err:
        if err.status == 401 and "permission" not in err.haystack():
            raise
        if warn:
            log(f"  WARN: could not read /v1/models ({err}); using built-in model profile")
        return None, None
    for m in models:
        if m.get("model_id") == model_id:
            return m, True
    return None, False


def lookup_voice_name(client: ElevenLabsClient, voice_id: str):
    try:
        return client.get_voice(voice_id).get("name")
    except ApiError as err:
        if err.status == 404 or "voice_not_found" in err.haystack():
            raise ToolError(f"Voice {voice_id!r} not found for this account ({err}). Run `list-voices` to see "
                            f"valid ids (Voice Library voices must be added first: `add-shared-voice`).", EXIT_API)
        if err.status == 401 and "permission" not in err.haystack():
            raise
        log(f"  WARN: could not look up voice name ({err})")
        return None


def resolve_voice_ref(client: ElevenLabsClient, ref: str) -> tuple[str, str | None]:
    """Accept a voice_id or an exact voice name from the account's voices."""
    if re.fullmatch(r"[A-Za-z0-9]{16,32}", ref):
        return ref, None
    matches = [v for v in client.search_voices(search=ref) if (v.get("name") or "").strip().lower() == ref.strip().lower()]
    if len(matches) == 1:
        return matches[0]["voice_id"], matches[0].get("name")
    if not matches:
        raise ToolError(f"No voice named {ref!r} in this account; run `list-voices`.", EXIT_API)
    raise ToolError(f"Voice name {ref!r} is ambiguous ({', '.join(m['voice_id'] for m in matches)}); pass the voice_id.",
                    EXIT_API)


def preflight_credits(client: ElevenLabsClient, chars: int, multiplier: float | None, force: bool) -> None:
    est = int(round(chars * (multiplier or 1.0)))
    mult_txt = f" x cost multiplier {multiplier}" if multiplier else ""
    log(f"Characters to synthesize: {chars}{mult_txt} -> ~{est} credits (continuity context assumed unbilled)")
    try:
        sub = client.subscription()
    except ApiError as err:
        if err.status == 401 and "permission" not in err.haystack():
            raise
        log(f"  WARN: could not read subscription ({err}); skipping credit check")
        return
    limit, used = sub.get("character_limit"), sub.get("character_count")
    if isinstance(limit, int) and isinstance(used, int):
        remaining = limit - used
        log(f"Subscription tier: {sub.get('tier')}; credits remaining this period: {remaining}")
        if est > remaining and not force:
            raise ToolError(f"Estimated ~{est} credits exceeds the {remaining} remaining. Top up / upgrade, narrate "
                            f"fewer segments with --only, or pass --force to try anyway.", EXIT_API)


def cmd_doctor(args) -> int:
    ok = True
    out(f"elevenlabs_narration.py {TOOL_VERSION}  python {sys.version.split()[0]}")
    ff = find_ffmpeg()
    if ff:
        try:
            ver = subprocess.run([ff, "-version"], capture_output=True, text=True, timeout=30).stdout.splitlines()[0]
        except (OSError, subprocess.SubprocessError, IndexError):
            ver = "?"
        out(f"ffmpeg: {ff} ({ver}); soxr resampler: {'yes' if ffmpeg_has_soxr(ff) else 'no'}")
    else:
        ok = False
        out("ffmpeg: NOT FOUND (required for WAV conversion)")
    out(f"{ENV_KEY}: {key_status()}")
    client = make_client(args, need_key=False)
    out(f"API base URL: {client.base_url}")
    has_key = bool(os.environ.get(ENV_KEY, "").strip())
    try:
        if has_key:
            models = client.list_models()
            out(f"Network: OK - {client.host} reachable; key accepted by GET /v1/models ({len(models)} models)")
            ids = [m.get("model_id") for m in models]
            for mid in (args.model, "eleven_multilingual_v2"):
                info = next((m for m in models if m.get("model_id") == mid), None)
                if info:
                    out(f"  {mid}: listed; max chars/request={info.get('maximum_text_length_per_request')}; "
                        f"style={info.get('can_use_style')}; speaker_boost={info.get('can_use_speaker_boost')}; "
                        f"alpha={info.get('requires_alpha_access')}")
                else:
                    out(f"  {mid}: NOT listed for this account (available: {', '.join(str(i) for i in ids)})")
            try:
                sub = client.subscription()
                out(f"Subscription: tier={sub.get('tier')}; credits used {sub.get('character_count')} of "
                    f"{sub.get('character_limit')}")
                tier = str(sub.get("tier", "")).lower()
                if tier in ("free", "starter", "creator"):
                    out("  NOTE: pcm_44100/pcm_48000 need Pro+; the tool will fall back to mp3_44100_192 (Creator) "
                        "or mp3_44100_128 automatically.")
            except ApiError as err:
                out(f"Subscription: unavailable ({err})")
        else:
            client.request("GET", "v1/models", send_key=False)
            out(f"Network: {client.host} reachable (unexpected 2xx without key)")
    except ApiError as err:
        if not has_key and err.status in (401, 403):
            out(f"Network: OK - {client.host} reachable (HTTP {err.status} without a key, as expected)")
        else:
            ok = False
            out(f"API: {err}")
    except NetworkBlockedError as err:
        out(f"Network: BLOCKED - cannot reach {err.host}: {err.reason}")
        out(REMEDIATION)
        return EXIT_NETWORK
    if not has_key:
        out(f"\nERROR: {ENV_KEY} is not set.\n{REMEDIATION}")
        return EXIT_NO_KEY
    return 0 if ok else EXIT_FAIL


def cmd_models(args) -> int:
    client = make_client(args)
    models = client.list_models()
    if args.json:
        write_json(Path(args.json), models)
        log(f"wrote {args.json}")
    out("model_id\tname\ttts\tstyle\tspeaker_boost\tmax_chars\tcost_multiplier\talpha\tlanguages")
    for m in models:
        rates = m.get("model_rates") or {}
        out("\t".join(str(x) for x in (
            m.get("model_id"), m.get("name"), m.get("can_do_text_to_speech"), m.get("can_use_style"),
            m.get("can_use_speaker_boost"), m.get("maximum_text_length_per_request"),
            rates.get("character_cost_multiplier"), m.get("requires_alpha_access"), len(m.get("languages") or []))))
    return 0


def _labels_str(labels: dict | None) -> str:
    if not labels:
        return ""
    order = ["gender", "age", "accent", "descriptive", "description", "use_case", "language"]
    keys = [k for k in order if k in labels] + sorted(k for k in labels if k not in order)
    return "; ".join(f"{k}={labels[k]}" for k in keys if labels.get(k))


def cmd_list_voices(args) -> int:
    client = make_client(args)
    rows = []
    if args.shared:
        params = {"search": args.search, "gender": args.gender, "age": args.age, "accent": args.accent,
                  "language": args.language, "use_cases": args.use_case, "category": args.category,
                  "featured": True if args.featured else None}
        for v in client.shared_voices(limit=args.limit, **params):
            rows.append(v)
        out("voice_id\tpublic_owner_id\tname\tcategory\tlabels\tcloned_by\tfree_users\tdescription")
        for v in rows:
            labels = {k: v.get(k) for k in ("gender", "age", "accent", "descriptive", "use_case", "language")}
            out("\t".join(str(x) for x in (
                v.get("voice_id"), v.get("public_owner_id"), v.get("name"), v.get("category"), _labels_str(labels),
                v.get("cloned_by_count"), v.get("free_users_allowed"), (v.get("description") or "")[:120].replace("\n", " "))))
        log("To use a library voice: add-shared-voice --public-owner-id <owner> --voice-id <id> --name '<name>'")
    else:
        params = {"search": args.search, "category": args.category, "voice_type": args.voice_type}
        for v in client.search_voices(**params):
            rows.append(v)
            if len(rows) >= args.limit:
                break
        out("voice_id\tname\tcategory\tlabels\thq_models\tdescription")
        for v in rows:
            out("\t".join(str(x) for x in (
                v.get("voice_id"), v.get("name"), v.get("category"), _labels_str(v.get("labels")),
                ",".join(v.get("high_quality_base_model_ids") or []) or "-",
                (v.get("description") or "")[:120].replace("\n", " "))))
    log(f"{len(rows)} voice(s)")
    if args.json:
        write_json(Path(args.json), rows)
        log(f"wrote {args.json}")
    return 0


def cmd_add_shared_voice(args) -> int:
    client = make_client(args)
    res = client.add_shared_voice(args.public_owner_id, args.voice_id, args.name)
    out(f"added: voice_id={res.get('voice_id')} name={args.name}")
    return 0


def _settings_for_model(model_id: str, args, model_info=None):
    profile = get_profile(model_id, model_info)
    settings, warns = resolve_voice_settings(model_id, profile, user_settings_from_args(args),
                                             force=args.force_settings)
    return profile, settings, warns


def _check_lengths(texts: list[tuple[str, str]], model_id: str, profile: dict) -> None:
    mx = profile.get("max_chars")
    if not mx:
        return
    too_long = [(label, len(t)) for label, t in texts if len(t) > mx]
    if too_long:
        detail = ", ".join(f"{label} ({n} chars)" for label, n in too_long)
        raise InputError(f"{model_id} accepts at most {mx} characters per request; too long: {detail}. Split them.")


def cmd_audition(args) -> int:
    text = Path(args.text_file).read_text(encoding="utf-8").strip() if Path(args.text_file).exists() else None
    if not text:
        raise InputError(f"--text-file {args.text_file} is missing or empty")
    models = [m.strip() for m in args.models.split(",") if m.strip()]
    voices = [v.strip() for v in args.voices.split(",") if v.strip()]
    if not models or not voices:
        raise ToolError("--models and --voices need at least one entry each", EXIT_USAGE)
    out_dir = Path(args.out_dir) / "auditions"
    fmt_chain = build_format_chain(args.output_format)
    base = getattr(args, "base_url", None) or os.environ.get(ENV_BASE_URL) or DEFAULT_BASE_URL
    if args.dry_run:
        for model in models:
            profile, settings, warns = _settings_for_model(model, args)
            for w in warns:
                log("WARN: " + w)
            _check_lengths([("text", text)], model, profile)
            for voice in voices:
                body = build_body(text, model, settings, seed=args.seed, language_code=_lang(args, profile, model),
                                  normalization=args.normalization)
                out(json.dumps(dry_run_request(validate_base_url(base), voice, body, fmt_chain, f"{model}__{voice}"),
                               indent=2, ensure_ascii=False))
        log(f"dry run: {len(models) * len(voices)} request(s), {len(text)} chars each; nothing sent "
            f"({ENV_KEY} {key_status()})")
        return 0
    client = make_client(args)
    ffmpeg = find_ffmpeg(required=True)
    out_dir.mkdir(parents=True, exist_ok=True)
    resolved = [resolve_voice_ref(client, v) for v in voices]
    names = {}
    for vid, name in resolved:
        names[vid] = name or lookup_voice_name(client, vid)
    csv_path = out_dir / "auditions_summary.csv"
    fields = ["model", "voice_id", "voice_name", "file", "duration_s", "characters", "chars_per_second",
              "output_format", "voice_settings", "seed", "request_id", "status", "generated_at"]
    existing = {}
    if csv_path.exists():
        with csv_path.open(newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                existing[(row.get("model"), row.get("voice_id"))] = row
    failures = 0
    with tempfile.TemporaryDirectory(prefix="el_audition_") as td:
        for model in models:
            info, listed = fetch_model_info(client, model)
            if listed is False:
                log(f"WARN: model {model} is not listed by /v1/models for this account; trying anyway")
            profile, settings, warns = _settings_for_model(model, args, info)
            for w in warns:
                log("WARN: " + w)
            _check_lengths([("text", text)], model, profile)
            synth = Synthesizer(client, model, fmt_chain, not args.no_forced_alignment_fallback)
            for vid, _ in resolved:
                label = f"{model}__{vid}"
                log(f"[audition] {label} ({names.get(vid) or '?'})")
                body = build_body(text, model, settings, seed=args.seed, language_code=_lang(args, profile, model),
                                  normalization=args.normalization)
                row = {"model": model, "voice_id": vid, "voice_name": names.get(vid) or "",
                       "characters": len(text), "voice_settings": json.dumps(settings, sort_keys=True),
                       "seed": "" if args.seed is None else args.seed, "generated_at": now_iso()}
                try:
                    res = synth.synthesize(vid, body, {}, Path(td))
                    raw = Path(td) / f"{label}{raw_extension(res['fmt'])}"
                    raw.write_bytes(res["audio"])
                    dst = out_dir / f"{safe_name(model)}__{safe_name(vid)}.wav"
                    convert_to_wav(ffmpeg, raw, res["fmt"], dst, tempo=args.post_tempo)
                    dur = wav_duration(dst)
                    row.update({"file": rel_path(dst), "duration_s": f"{dur:.3f}",
                                "chars_per_second": f"{len(text) / dur:.2f}" if dur else "",
                                "output_format": res["fmt"], "request_id": res.get("request_id") or "",
                                "status": "ok"})
                    log(f"   -> {rel_path(dst)}  {dur:.2f}s  ({res['fmt']})")
                except (ApiError, AudioError) as err:
                    failures += 1
                    row.update({"file": "", "duration_s": "", "chars_per_second": "", "output_format": "",
                                "request_id": "", "status": f"error: {err}"[:300]})
                    log(f"   !! {err}")
                existing[(model, vid)] = row
                _write_csv(csv_path, fields, existing.values())
    log(f"summary: {rel_path(csv_path)}")
    return 0 if failures == 0 else EXIT_API


def _write_csv(path: Path, fields: list[str], rows) -> None:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    atomic_write_text(path, buf.getvalue())


def safe_name(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", s)


def _lang(args, profile: dict, model_id: str):
    if not args.language_code:
        return None
    if not profile.get("language_code", True):
        log(f"WARN: language_code is not supported by {model_id} (SDK docs); not sent")
        return None
    return args.language_code


def cmd_narrate(args) -> int:
    segs_path = Path(args.segments)
    segs = load_segments(segs_path)
    only = parse_only(args.only, segs)
    model = args.model
    voice_id = args.voice
    out_dir = Path(args.out_dir)
    manifest_path = out_dir / "manifest.json"
    fmt_chain = build_format_chain(args.output_format)
    base = getattr(args, "base_url", None) or os.environ.get(ENV_BASE_URL) or DEFAULT_BASE_URL
    targets = [i for i, s in enumerate(segs) if only is None or s.id in only]

    if args.dry_run:
        profile, settings, warns = _settings_for_model(model, args)
        for w in warns:
            log("WARN: " + w)
        mode = resolve_context_mode(args.context, profile)
        _check_lengths([(segs[i].id, segs[i].spoken) for i in targets], model, profile)
        for i in targets:
            # in a real run the ids of earlier segments come from their responses' request-id header
            ids = {segs[j].id: f"<request-id of {segs[j].id}>" for j in range(i)} if mode == "ids" else {}
            ctx = build_context(mode, i, segs, ids)
            body = build_body(segs[i].spoken, model, settings, seed=args.seed,
                              language_code=_lang(args, profile, model), normalization=args.normalization, context=ctx)
            out(json.dumps(dry_run_request(validate_base_url(base), voice_id, body, fmt_chain, segs[i].id),
                           indent=2, ensure_ascii=False))
        chars = sum(len(segs[i].spoken) for i in targets)
        log(f"dry run: {len(targets)} request(s), {chars} characters, model {model}, context mode '{mode}'; "
            f"nothing sent ({ENV_KEY} {key_status()})")
        return 0

    client = make_client(args)
    ffmpeg = find_ffmpeg(required=True)
    info, listed = fetch_model_info(client, model)
    if listed is False:
        msg = f"model {model} is not listed by GET /v1/models for this account"
        if not args.force:
            raise ToolError(f"ERROR: {msg}. Run `models` to see valid ids, or pass --force.", EXIT_API)
        log("WARN: " + msg)
    if info and info.get("requires_alpha_access"):
        log(f"WARN: {model} reports requires_alpha_access=true")
    profile, settings, warns = _settings_for_model(model, args, info)
    for w in warns:
        log("WARN: " + w)
    mode = resolve_context_mode(args.context, profile)
    _check_lengths([(segs[i].id, segs[i].spoken) for i in targets], model, profile)
    voice_name = args.voice_name or lookup_voice_name(client, voice_id)
    multiplier = ((info or {}).get("model_rates") or {}).get("character_cost_multiplier")

    prev = load_manifest(manifest_path)
    prev_ok = bool(prev and prev.get("engine") == "elevenlabs" and prev.get("model") == model
                   and prev.get("voice_id") == voice_id)
    if only is not None and prev and not prev_ok:
        raise ToolError(f"ERROR: {rel_path(manifest_path)} was made with model {prev.get('model')} / voice "
                        f"{prev.get('voice_id')}; regenerating only some segments with {model} / {voice_id} would "
                        f"mix voices. Run without --only, or use --out-dir for a separate take.", EXIT_USAGE)
    prev_entries = {e["id"]: e for e in (prev.get("segments", []) if prev_ok else []) if entry_files_exist(e, out_dir)}

    def up_to_date(seg: Segment) -> bool:
        e = prev_entries.get(seg.id)
        return bool(e and e.get("spoken_text_sha1") == sha1(seg.spoken) and e.get("voice_settings") == settings
                    and abs(float(e.get("post_tempo", 1.0)) - args.post_tempo) < 1e-9)

    work = [i for i in targets if not (args.skip_existing and up_to_date(segs[i]))]
    preflight_credits(client, sum(len(segs[i].spoken) for i in work), multiplier, args.force)

    run_settings = {
        "voice_settings": settings,
        "output_format_preference": fmt_chain,
        "seed": args.seed,
        "context_mode": mode,
        "language_code": args.language_code,
        "apply_text_normalization": args.normalization,
        "post_tempo": args.post_tempo,
    }
    entries = dict(prev_entries)
    request_ids = {sid: e.get("request_id") for sid, e in prev_entries.items() if e.get("request_id")}
    synth = Synthesizer(client, model, fmt_chain, not args.no_forced_alignment_fallback)
    notes: list[str] = []
    out_dir.mkdir(parents=True, exist_ok=True)
    raw_dir = out_dir / "raw"
    raw_dir.mkdir(exist_ok=True)
    regen_mode = only is not None  # neighbours' request ids from the existing take are valid continuity anchors
    log(f"Narrating {len(work)} of {len(segs)} segment(s) with {model} / {voice_name or voice_id}; "
        f"context mode '{mode}'; formats {', '.join(fmt_chain)}")
    with tempfile.TemporaryDirectory(prefix="el_narrate_") as td:
        for n, i in enumerate(targets, 1):
            seg = segs[i]
            if i not in work:
                log(f"[{n}/{len(targets)}] {seg.id}: up to date, skipped")
                continue
            ctx = build_context(mode, i, segs, request_ids, next_ids_ok=regen_mode)
            text_ctx = text_context(i, [s.spoken for s in segs])
            body = build_body(seg.spoken, model, settings, seed=args.seed,
                              language_code=_lang(args, profile, model), normalization=args.normalization, context=ctx)
            log(f"[{n}/{len(targets)}] {seg.id}: {len(seg.spoken)} chars"
                + (f"; context {', '.join(k for k in ctx)}" if ctx else ""))
            res = synth.synthesize(voice_id, body, text_ctx, Path(td))
            fmt = res["fmt"]
            raw_path = raw_dir / f"{seg.id}{raw_extension(fmt)}"
            raw_path.write_bytes(res["audio"])
            wav_path = out_dir / f"{seg.id}.wav"
            convert_to_wav(ffmpeg, raw_path, fmt, wav_path, tempo=args.post_tempo)
            dur = wav_duration(wav_path)
            al = normalize_alignment(res.get("alignment"))
            nal = normalize_alignment(res.get("normalized_alignment"))
            al_source = "alignment"
            if al is None and nal is not None:
                al, al_source = nal, "normalized_alignment"
            if al is None:
                log(f"  WARN: no character alignment returned for {seg.id}; words file will be empty")
            factor = 1.0 / args.post_tempo
            al_scaled = scale_alignment(al, factor, dur) if al else None
            words = derive_words(al_scaled, seg.spoken, seg.text, dur)
            align_path = out_dir / f"{seg.id}.alignment.json"
            words_path = out_dir / f"{seg.id}.words.json"
            write_json(align_path, {
                "segment": seg.id, "model": model, "voice_id": voice_id, "text": seg.text,
                "spoken_text": seg.spoken, "alignment_source": f"{res['alignment_source']}:{al_source}",
                "time_unit": "seconds", "audio_duration_s": round(dur, 3), "post_tempo": args.post_tempo,
                "output_format": fmt, "request_id": res.get("request_id"),
                "alignment": al_scaled,
                "normalized_alignment": scale_alignment(nal, factor, dur) if nal else None,
            })
            write_json(words_path, words)
            if res.get("request_id"):
                request_ids[seg.id] = res["request_id"]
            sent_ctx = {k: res["sent_body"][k] for k in CONTEXT_PARAMS if k in res["sent_body"]}
            entries[seg.id] = {
                "id": seg.id,
                "file": wav_path.name,
                "duration_s": round(dur, 3),
                "words_file": words_path.name,
                "alignment_file": align_path.name,
                "raw_file": raw_path.relative_to(out_dir).as_posix(),
                "pause_after_ms": seg.pause_after_ms,
                "text": seg.text,
                "tts_text": seg.tts_text if seg.tts_text and seg.tts_text.strip() else None,
                "spoken_text_sha1": sha1(seg.spoken),
                "word_count": len(words),
                "output_format": fmt,
                "voice_settings": res["sent_body"].get("voice_settings", {}),
                "seed": res["sent_body"].get("seed"),
                "context_sent": sorted(sent_ctx),
                "post_tempo": args.post_tempo,
                "request_id": res.get("request_id"),
                "character_count": res.get("char_count"),
                "generated_at": now_iso(),
            }
            log(f"   -> {rel_path(wav_path)}  {dur:.2f}s  {len(words)} words  ({fmt})")
            notes = list(dict.fromkeys(synth.notes + client.retry_log[-20:]))
            write_json(manifest_path, build_manifest(model=model, voice_id=voice_id, voice_name=voice_name,
                                                     settings=run_settings, segs=segs, entries=entries,
                                                     segments_path=segs_path, notes=notes))
    notes = list(dict.fromkeys(synth.notes + client.retry_log[-20:]))
    manifest = build_manifest(model=model, voice_id=voice_id, voice_name=voice_name, settings=run_settings,
                              segs=segs, entries=entries, segments_path=segs_path, notes=notes)
    write_json(manifest_path, manifest)
    log(f"manifest: {rel_path(manifest_path)}  ({len(manifest['segments'])}/{len(segs)} segments, "
        f"{manifest['total_duration_s']:.1f}s speech + {manifest['total_pause_ms'] / 1000:.1f}s pauses)")
    if manifest["missing_segments"]:
        log(f"  missing: {', '.join(manifest['missing_segments'])}")
    return 0


# ---------------------------------------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------------------------------------
def _unit_float(name: str, lo: float, hi: float):
    def parse(v: str) -> float:
        try:
            x = float(v)
        except ValueError:
            raise argparse.ArgumentTypeError(f"{name} must be a number")
        if not lo <= x <= hi:
            raise argparse.ArgumentTypeError(f"{name} must be between {lo} and {hi}")
        return x
    return parse


def _seed(v: str) -> int:
    try:
        x = int(v)
    except ValueError:
        raise argparse.ArgumentTypeError("seed must be an integer")
    if not 0 <= x <= 4294967295:
        raise argparse.ArgumentTypeError("seed must be between 0 and 4294967295")
    return x


def build_parser() -> argparse.ArgumentParser:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--base-url", default=None,
                        help=f"API base URL (default {DEFAULT_BASE_URL} or ${ENV_BASE_URL}); only *.elevenlabs.io or localhost")
    common.add_argument("--timeout", type=float, default=180.0, help="per-request timeout seconds (default 180)")
    common.add_argument("--max-retries", type=int, default=6, help="retries on 429/5xx/network errors (default 6)")
    common.add_argument("-v", "--verbose", action="store_true", help="log request URLs (never headers/keys)")

    synth_opts = argparse.ArgumentParser(add_help=False)
    synth_opts.add_argument("--stability", type=_unit_float("stability", 0.0, 1.0))
    synth_opts.add_argument("--similarity", type=_unit_float("similarity", 0.0, 1.0), help="similarity_boost")
    synth_opts.add_argument("--style", type=_unit_float("style", 0.0, 1.0), help="style exaggeration (not on v4)")
    synth_opts.add_argument("--speed", type=_unit_float("speed", 0.25, 4.0), help="speech speed (not on v4; API docs suggest 0.7-1.2)")
    sb = synth_opts.add_mutually_exclusive_group()
    sb.add_argument("--speaker-boost", dest="speaker_boost", action="store_true", default=None)
    sb.add_argument("--no-speaker-boost", dest="speaker_boost", action="store_false")
    synth_opts.add_argument("--force-settings", action="store_true",
                            help="send voice settings even if the built-in profile says the model ignores them")
    synth_opts.add_argument("--seed", type=_seed, help="best-effort deterministic sampling (0..4294967295)")
    synth_opts.add_argument("--output-format", default=None,
                            help=f"preferred output_format (default chain: {' > '.join(DEFAULT_FORMAT_CHAIN)})")
    synth_opts.add_argument("--language-code", default=None, help="ISO 639-1 code, e.g. en (not for multilingual_v2)")
    synth_opts.add_argument("--normalization", choices=["auto", "on", "off"], default=None,
                            help="apply_text_normalization (omitted unless given)")
    synth_opts.add_argument("--post-tempo", type=_unit_float("post-tempo", 0.8, 1.25), default=1.0,
                            help="ffmpeg atempo applied after synthesis (timings rescaled); useful on v4, which has no speed setting")
    synth_opts.add_argument("--no-forced-alignment-fallback", action="store_true",
                            help="do not fall back to plain TTS + /v1/forced-alignment if with-timestamps is unsupported")
    synth_opts.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="output folder (default audio/narration/elevenlabs)")
    synth_opts.add_argument("--dry-run", action="store_true", help="print request JSON (key omitted); no network, no key needed")

    p = argparse.ArgumentParser(prog="elevenlabs_narration.py",
                                description="Premium narration via ElevenLabs (key from $ELEVENLABS_API_KEY only).")
    p.add_argument("--version", action="version", version=TOOL_VERSION)
    sub = p.add_subparsers(dest="cmd", required=True)

    d = sub.add_parser("doctor", parents=[common], help="check ffmpeg, key presence, network, subscription, models")
    d.add_argument("--model", default="eleven_v4")
    d.set_defaults(func=cmd_doctor)

    m = sub.add_parser("models", parents=[common], help="list models (GET /v1/models)")
    m.add_argument("--json", help="also save the raw list to this file")
    m.set_defaults(func=cmd_models)

    lv = sub.add_parser("list-voices", parents=[common], help="list voices (GET /v2/voices or /v1/shared-voices)")
    lv.add_argument("--search")
    lv.add_argument("--category", help="premade|cloned|generated|professional (library: professional|famous|high_quality)")
    lv.add_argument("--voice-type", help="personal|community|default|workspace|non-default|saved")
    lv.add_argument("--shared", action="store_true", help="search the public Voice Library instead")
    lv.add_argument("--gender")
    lv.add_argument("--age")
    lv.add_argument("--accent")
    lv.add_argument("--language", help="library filter, e.g. en")
    lv.add_argument("--use-case", help="library filter, e.g. narrative_story, informative_educational")
    lv.add_argument("--featured", action="store_true")
    lv.add_argument("--limit", type=int, default=300)
    lv.add_argument("--json", help="also save the raw voice objects to this file")
    lv.set_defaults(func=cmd_list_voices)

    a = sub.add_parser("add-shared-voice", parents=[common], help="add a Voice Library voice to the account")
    a.add_argument("--public-owner-id", required=True)
    a.add_argument("--voice-id", required=True)
    a.add_argument("--name", required=True)
    a.set_defaults(func=cmd_add_shared_voice)

    au = sub.add_parser("audition", parents=[common, synth_opts], help="models x voices on one text")
    au.add_argument("--models", default="eleven_v4,eleven_multilingual_v2", help="comma-separated model ids")
    au.add_argument("--voices", required=True, help="comma-separated voice ids (or exact names)")
    au.add_argument("--text-file", required=True)
    au.set_defaults(func=cmd_audition)

    n = sub.add_parser("narrate", parents=[common, synth_opts], help="synthesize narration_segments.json")
    n.add_argument("--model", default="eleven_v4")
    n.add_argument("--voice", required=True, help="voice id")
    n.add_argument("--voice-name", help="override the voice name stored in the manifest")
    n.add_argument("--segments", default=str(DEFAULT_SEGMENTS), help="default script/narration_segments.json")
    n.add_argument("--only", help="comma-separated segment ids to (re)generate, e.g. s03,s07")
    n.add_argument("--context", choices=["auto", "text", "ids", "none"], default="auto",
                   help="continuity: auto (per model), text (previous_text/next_text), ids (request stitching), none")
    n.add_argument("--skip-existing", action="store_true",
                   help="skip segments whose audio already matches text+settings in the manifest (resume)")
    n.add_argument("--force", action="store_true", help="continue despite credit-check / model-listing warnings")
    n.set_defaults(func=cmd_narrate)
    return p


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except ToolError as err:
        log(str(err))
        if isinstance(err, ApiError) and err.status == 401:
            log(f"Check that {ENV_KEY} is valid and not revoked, that the key's permissions include Text to Speech, "
                f"Voices (read), Models (read) and User (read), and that the account has credits left.")
        return err.exit_code
    except KeyboardInterrupt:
        log("interrupted; the manifest reflects the segments finished so far")
        return 130


if __name__ == "__main__":
    sys.exit(main())
