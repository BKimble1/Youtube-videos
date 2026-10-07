#!/usr/bin/env python3
"""Split large deliverables into git-friendly parts with SHA-256 checksums.

Used because the Git LFS storage host and release-asset uploads are not reachable from the
production session. Each file becomes <name>.partNNN pieces (< 25 MiB, so no Git LFS pattern
matches them), plus:

  SHA256SUMS        whole-file and per-part checksums (sha256sum format)
  manifest.json     sizes, part lists and checksums (machine-readable)
  reconstruct.sh    POSIX shell: joins parts and verifies (Linux/macOS)
  reconstruct.py    cross-platform Python 3 equivalent (Windows too)

Usage:
  python3 tools/backup_split.py <dest_dir> <file> [<file> ...]
"""
import hashlib
import json
import os
import shutil
import sys

PART_BYTES = 24 * 1024 * 1024  # 24 MiB, safely under the 25 MiB limit
HERE = os.path.dirname(os.path.abspath(__file__))


def sha256(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(chunk), b""):
            h.update(b)
    return h.hexdigest()


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    dest = sys.argv[1]
    os.makedirs(dest, exist_ok=True)
    manifest_path = os.path.join(dest, "manifest.json")
    manifest = {"part_bytes": PART_BYTES, "files": []}
    if os.path.exists(manifest_path):
        manifest = json.load(open(manifest_path))
    known = {f["name"]: f for f in manifest["files"]}

    for src in sys.argv[2:]:
        name = os.path.basename(src)
        size = os.path.getsize(src)
        whole = sha256(src)
        parts = []
        with open(src, "rb") as f:
            i = 0
            while True:
                b = f.read(PART_BYTES)
                if not b:
                    break
                i += 1
                pname = f"{name}.part{i:03d}"
                with open(os.path.join(dest, pname), "wb") as o:
                    o.write(b)
                parts.append({"name": pname, "bytes": len(b), "sha256": hashlib.sha256(b).hexdigest()})
        known[name] = {"name": name, "bytes": size, "sha256": whole, "parts": parts}
        print(f"{name}: {size} bytes -> {len(parts)} parts, sha256 {whole}")

    manifest["files"] = sorted(known.values(), key=lambda x: x["name"])
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=1)
    with open(os.path.join(dest, "SHA256SUMS"), "w") as f:
        for fe in manifest["files"]:
            f.write(f"{fe['sha256']}  {fe['name']}\n")
            for p in fe["parts"]:
                f.write(f"{p['sha256']}  {p['name']}\n")
    for helper in ("reconstruct.sh", "reconstruct.py"):
        shutil.copy(os.path.join(HERE, "backup_templates", helper), os.path.join(dest, helper))
    os.chmod(os.path.join(dest, "reconstruct.sh"), 0o755)


if __name__ == "__main__":
    main()
