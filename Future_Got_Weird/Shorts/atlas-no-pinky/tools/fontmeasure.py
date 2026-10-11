"""Glyph-width measurement from the bundled @fontsource WOFF files (the same files the render loads). Kerning is ignored
(GPOS), so widths are within a few percent of the browser's; the render re-measures with canvas and asserts the fit."""
import os
from fontTools.ttLib import TTFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = {
    'montserrat800': f'{ROOT}/source/node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff',
    'barlow800': f'{ROOT}/source/node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff',
}
_cache = {}
def font(name):
    if name not in _cache:
        f = TTFont(FILES[name]); _cache[name] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
    return _cache[name]
def width(text, name='montserrat800', size=76, tracking=0.0):
    cmap, hmtx, upm = font(name)
    w = 0.0
    for ch in text:
        g = cmap.get(ord(ch)) or cmap.get(ord('?'))
        w += hmtx[g][0] / upm * size + tracking
    return w
if __name__ == '__main__':
    import sys
    for t in sys.argv[1:]:
        print(f'{width(t):7.1f}  {t}')
