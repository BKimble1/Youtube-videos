# YouTube Videos

Preparation scripts and footage notes for YouTube videos. The footage itself stays on local disk.

## Layout

| Path                     | What goes here                                                  | In git? |
|--------------------------|-----------------------------------------------------------------|---------|
| `Video_NN/FOOTAGE.md`    | Where that video's footage lives, what each file is, review files | yes     |
| `Video_NN/footage.json`  | Manifest the scripts read (originals, checksums, per-file settings) | yes     |
| `Video_NN/raw/`          | Original recordings, untouched                                  | no      |
| `Video_NN/exports/`      | Exports from the phone / editor                                 | no      |
| `Video_NN/review/`       | Smaller review copies made by `scripts/prepare_review.py`       | no      |
| `scripts/`               | Reproducible preparation and verification scripts              | yes     |
| `assets/`, `output/`, `raw/` | Original repo placeholders                                 | no media |

## Large media stays out of GitHub

`.gitignore` blocks every `Video_*/raw|exports|review` folder and all common video, audio and
zip files anywhere in the tree, so `git add .` can't pick up footage. `FOOTAGE.md` in each video
folder records where the files are instead. (`.gitattributes` still routes media to Git LFS, as a
safety net if a file is ever force-added.)

## Making review copies

Needs FFmpeg 7+ on PATH (`winget install Gyan.FFmpeg`) and Python 3.10+. No Python packages are
required (numpy, if installed, speeds up one verification check).

```bash
python scripts/prepare_review.py Video_01/footage.json   # skips files that already exist; --force to redo
python scripts/verify_review.py  Video_01/footage.json   # checks every review file, exits non-zero on failure
```

Review copies are unedited: no pauses cut, nothing reordered, no music, no eye correction.
HDR is tone-mapped to SDR BT.709 and rotation is handled per recording (see `footage.json`).
On a machine with a Vulkan GPU it uses libplacebo for tone mapping, otherwise zscale on the CPU.
