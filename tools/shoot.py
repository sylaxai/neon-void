#!/usr/bin/env python3
"""Take the four NEON VOID screenshots with Playwright, staged via ?shot=.

Usage: python3 tools/shoot.py [--port 8137] [--quality 82]
  Serves game/ on localhost, loads each entry of shots.json, waits for
  window.__shotReady, saves a 1280x720 JPEG to screenshots/<name>.
  Retries at lower quality if a shot exceeds the 256 KiB cap.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
GAME = HERE / "game"
SHOTS = HERE / "screenshots"
SHOTS_JSON = HERE / "shots.json"
MAX_BYTES = 262144


def main() -> int:
    port = 8137
    quality = 82
    args = sys.argv[1:]
    if "--port" in args:
        port = int(args[args.index("--port") + 1])
    if "--quality" in args:
        quality = int(args[args.index("--quality") + 1])
    SHOTS.mkdir(exist_ok=True)
    shots = json.loads(SHOTS_JSON.read_text())

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=GAME,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            errors: list[str] = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            ok = True
            for shot in shots:
                url = f"http://127.0.0.1:{port}/{shot['query']}"
                page.goto(url)
                try:
                    page.wait_for_function("window.__shotReady === true", timeout=30000)
                except Exception:
                    print(f"TIMEOUT waiting for __shotReady: {shot['name']} ({url})")
                    ok = False
                    continue
                dest = SHOTS / shot["name"]
                q = quality
                while True:
                    page.screenshot(path=str(dest), type="jpeg", quality=q)
                    size = dest.stat().st_size
                    if size <= MAX_BYTES or q <= 50:
                        break
                    q -= 8
                print(f"{shot['name']}: {size} bytes (quality {q})")
                if size > MAX_BYTES:
                    print(f"  STILL OVER 256 KiB!")
                    ok = False
            if errors:
                print("CONSOLE/PAGE ERRORS:")
                for e in errors:
                    print("  ", e)
                ok = False
            browser.close()
        return 0 if ok else 1
    finally:
        server.terminate()


if __name__ == "__main__":
    raise SystemExit(main())
