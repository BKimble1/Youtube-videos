#!/usr/bin/env bash
# Fetch all real footage for V3 into source/public/media/real/ from the repository's "Flight-Footage" release:
# 01/02 as in V2, then the V3 footage pack (03–10, silent), each verified against its SHA-256 (pack digests are the
# ones in footage/footage_manifest.json). The 4K pack files are kept as delivered for the later master.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
"$here/v2_fetch_footage.sh"
D="$here/../source/public/media/real"; cd "$D"
REL=https://github.com/BKimble1/Youtube-videos/releases/download/Flight-Footage
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
curl -sSL -o "$tmp/pack.zip" "$REL/FGW_Starship_V3_Footage_Pack.zip"
unzip -o -j -q "$tmp/pack.zip" '0*.mp4' -d .
sha256sum -c <<'SUMS'
e7191712aae52ad91805781ef033b5a4ef3c0c965ec42e2150a0af9db4ad4ed1  03_Flight14_OceanReturn_4K.mp4
21a4e0a2c6914070a8099264e73fa663b3cdb72874938da13ba051d56efbe10e  04_Flight14_Launch_and_Coast_4K.mp4
62800d360d5fafc5fad5780583e10655737b9520961320727dfe133045231410  05_Flight14_StageSeparation_4K.mp4
c6635e9720e2105639573a0b9b80e688e63e07e1bcfa2e2b040728ba15cf82ce  06_Pad2_Site_and_Tower_1080p.mp4
eb5063ea8b7b8c5909d2340ef6e7fad732c4a09a2bddfc328f3fa05b1d1be913  07_Booster_Interstage_and_QD_4K.mp4
3cc2356abfc03741f2871050d6a6c5efc05c4addc657a15612a130f1f0df5d74  08_ElonMusk_SpaceX_Update_2025_1080p_SILENT.mp4
ab7c50bae5468cff47968e0cc71c376ae9aa597184f03b75236d51b8ced8ba72  09_Recovered_Ship40_Heatshield_4K.mp4
c5913d1d7981bfb1afd144db051f005ee3a25227678763df8b664c2ef4dad977  10_Tower_Carriage_and_Coast_4K.mp4
SUMS
