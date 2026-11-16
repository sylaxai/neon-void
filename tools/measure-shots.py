#!/usr/bin/env python3
"""Look gates for NEON VOID screenshots (SUNWRIGHT pattern, thresholds copied
exactly from the best-game-01 #1 entry's tools/measure-shots.mjs).

Gates (every screenshot must pass):
  saturation      mean HSV saturation (0..1)            >= 0.33 (aim 0.45)
  mean luminance  mean rec601 luminance (0..1)          >= 0.45
  luminance SD    stddev of luminance (0..255)          >= 40
  warm            mean R > mean B
  near-black      fraction of pixels with luminance < 8/255   < 0.02
  darkest block   no 64x64 block with mean luminance < 0.15
  blown blocks    32x32 blocks with mean luminance > 0.95 (reported; warn > 0)

Usage: python3 tools/measure-shots.py [--dir screenshots]
Exits 0 only if every gate passes on every screenshot.
"""
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent


def measure(path: Path) -> dict:
    from PIL import Image
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = list(im.getdata())
    step = 4  # sample every 4th pixel for the whole-frame stats
    sample = px[::step]
    n = len(sample)
    rs = sum(p[0] for p in sample) / n
    gs = sum(p[1] for p in sample) / n
    bs = sum(p[2] for p in sample) / n
    sats, lums = [], []
    for r, g, b in sample:
        mx, mn = max(r, g, b), min(r, g, b)
        sats.append(0.0 if mx == 0 else (mx - mn) / mx)
        lums.append(0.299 * r + 0.587 * g + 0.114 * b)
    sat = sum(sats) / len(sats)
    lum_mean = sum(lums) / len(lums)
    lum_sd = statistics.pstdev(lums)
    near_black = sum(1 for v in lums if v < 8) / len(lums)
    gray = im.convert('L')
    darkest = 255.0
    for y in range(0, h - 63, 64):
        for x in range(0, w - 63, 64):
            blk = list(gray.crop((x, y, x + 64, y + 64)).getdata())
            darkest = min(darkest, sum(blk) / len(blk))
    blown = 0
    for y in range(0, h - 31, 32):
        for x in range(0, w - 31, 32):
            blk = list(gray.crop((x, y, x + 32, y + 32)).getdata())
            if sum(blk) / len(blk) > 0.95 * 255:
                blown += 1
    return {
        'sat': sat, 'lum_mean': lum_mean / 255, 'lum_sd': lum_sd,
        'warm': rs > bs, 'r': rs, 'b': bs, 'near_black': near_black,
        'darkest64': darkest / 255, 'blown32': blown,
    }


def main() -> int:
    d = Path(sys.argv[sys.argv.index('--dir') + 1]) if '--dir' in sys.argv else HERE / 'screenshots'
    files = sorted(p for p in d.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png'))
    ok_all = True
    print(f"{'shot':<14}{'sat':>6}{'lum':>6}{'lumSD':>6}{'warm':>6}{'nblk':>6}{'dark64':>7}{'blown':>6}  verdict")
    for f in files:
        m = measure(f)
        gates = [
            ('sat>=0.33', m['sat'] >= 0.33),
            ('lum>=0.45', m['lum_mean'] >= 0.45),
            ('sd>=40', m['lum_sd'] >= 40),
            ('warm', m['warm']),
            ('nblk<2%', m['near_black'] < 0.02),
            ('dark64>=0.15', m['darkest64'] >= 0.15),
        ]
        failed = [name for name, passed in gates if not passed]
        ok = not failed
        ok_all = ok_all and ok
        print(f"{f.name:<14}{m['sat']:>6.2f}{m['lum_mean']:>6.2f}{m['lum_sd']:>6.1f}{str(m['warm']):>6}{m['near_black']:>6.3f}{m['darkest64']:>7.3f}{m['blown32']:>6}  "
              + ('PASS' if ok else 'FAIL: ' + ', '.join(failed)))
    print('LOOK GATES:', 'PASS' if ok_all else 'FAIL')
    return 0 if ok_all else 1


if __name__ == '__main__':
    raise SystemExit(main())
