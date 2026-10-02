# YouTube Videos

Source footage and edited renders for YouTube videos.

## Layout

| Folder    | What goes here                                   |
|-----------|--------------------------------------------------|
| `raw/`    | Unedited source clips. Drop new footage here.    |
| `assets/` | Music, sound effects, images, overlays, logos.   |
| `output/` | Edited / rendered videos.                        |

Optionally group by video, e.g. `raw/my-video-title/clip1.mp4`.

## Adding video files

Video and audio files are stored with [Git LFS](https://git-lfs.com) (see `.gitattributes`),
so large files don't bloat the repo.

```bash
git lfs install            # once per machine
git add raw/
git commit -m "Add footage for <video>"
git push
```

Notes:
- GitHub's browser upload is capped at 25 MB per file. Use the command line for bigger clips.
- Without LFS, GitHub rejects any file over 100 MB.
- GitHub LFS has storage and bandwidth quotas, so check your usage if you upload a lot of footage.
