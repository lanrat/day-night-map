#!/usr/bin/env bash
set -eu
set -o pipefail
if [[ "${TRACE-0}" == "1" ]]; then set -o xtrace; fi
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

RESOLUTION="800,480"

google-chrome --headless --window-size=$RESOLUTION --screenshot="screenshot.png" "file://$SCRIPT_DIR/full.html"


# magick screenshot.png -dither FloydSteinberg -remap pattern:gray50 -depth 1 -strip png:output.png

docker run --rm --user="$UID" -v "$SCRIPT_DIR:/app" -w /app --entrypoint magick minidocks/imagemagick \
    screenshot.png -dither FloydSteinberg -remap pattern:gray50 -depth 1 -strip png:output.png

# docker run --rm -v "$SCRIPT_DIR:/app" -w /app --entrypoint magick minidocks/imagemagick \
#     screenshot.png -monochrome -colors 2 -depth 1 -strip png:output.png    
