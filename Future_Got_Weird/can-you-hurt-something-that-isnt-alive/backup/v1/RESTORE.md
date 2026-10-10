# Restore the v1 renders

Git LFS is unavailable for this episode, so the two masters are stored as 20 MB split parts.

    cat FGW_CanYouHurt_v1_MASTER_4K.mp4.part_* > FGW_CanYouHurt_v1_MASTER_4K.mp4
    cat FGW_CanYouHurt_v1_UPLOAD_1080p.mp4.part_* > FGW_CanYouHurt_v1_UPLOAD_1080p.mp4
    sha256sum -c SHA256SUMS   # checks the parts, not the joined files

Joined-file checksums are in JOINED_SHA256SUMS (computed from the originals in exports/).
The review preview (720p, not for upload) is in exports/ and is not backed up as parts.
