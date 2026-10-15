# Restore the V5 upload master

Git LFS is unavailable for this episode, so the 1080p V5 upload master is stored as 20 MB split parts.

    cat FGW_RobotsDestroy_v5_UPLOAD_1080p.mp4.part_* > FGW_RobotsDestroy_v5_UPLOAD_1080p.mp4
    sha256sum -c SHA256SUMS          # checks the parts
    sha256sum -c JOINED_SHA256SUMS   # checks the joined file (run in the folder that holds it)

The share copy (`FGW_RobotsDestroy_v5_1080p_SHARE.mp4`) is compressed and not for upload. Regenerate it from the
master with `bash tools/v5/share_and_backup_v5.sh` (two-pass x264 at about 0.96 Mb/s, AAC 128 kb/s, 1080p, 30 fps).
