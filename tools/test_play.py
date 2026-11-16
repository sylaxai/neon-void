#!/usr/bin/env python3
"""Play-test NEON VOID in Chromium: title -> play -> pause -> shots.

Usage: python3 tools/test_play.py [--port 8138]
  Serves game/, loads the title screen, starts the game with a click,
  moves/shoots for a few seconds, pauses and resumes, then loads every
  ?shot= scene (checking __shotReady) and checks the play scene is
  deterministic across two loads. Saves screenshots to test-shots/ and
  prints console/page errors and the #status text at each step.
"""
import hashlib
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
GAME = HERE / "game"
OUT = HERE / "test-shots"
SHOTS = ["start", "play", "action", "end"]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def main() -> int:
    port = 8138
    args = sys.argv[1:]
    if "--port" in args:
        port = int(args[args.index("--port") + 1])
    OUT.mkdir(exist_ok=True)
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=GAME,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)
    errors: list[str] = []
    ok = True
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            browser = pw.chromium.launch(args=["--mute-audio"])
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))

            def status() -> str:
                return page.evaluate("document.querySelector('#status').textContent")

            # 1. Title screen
            page.goto(f"http://127.0.0.1:{port}/")
            page.wait_for_timeout(1500)
            page.screenshot(path=str(OUT / "t1-title.png"))
            print("title status:", status())

            # 2. Start with a click, play: move + hold fire, aim around
            page.mouse.click(640, 360)
            page.wait_for_timeout(500)
            print("after click status:", status())
            page.mouse.move(900, 300)
            page.mouse.down()
            page.keyboard.down("KeyD")
            page.wait_for_timeout(2000)
            page.keyboard.up("KeyD")
            page.keyboard.down("KeyA")
            page.mouse.move(400, 400)
            page.wait_for_timeout(2000)
            page.keyboard.up("KeyA")
            page.mouse.move(640, 200)
            page.wait_for_timeout(2000)
            page.mouse.up()
            page.screenshot(path=str(OUT / "t2-play.png"))
            print("play status:", status())

            # 3. Pause and resume
            page.keyboard.press("KeyP")
            page.wait_for_timeout(600)
            page.screenshot(path=str(OUT / "t3-paused.png"))
            print("paused status:", status())
            page.keyboard.press("KeyP")
            page.wait_for_timeout(600)
            print("resumed status:", status())

            # 4. Bomb with Space (also fires)
            page.keyboard.press("Space")
            page.wait_for_timeout(800)
            page.screenshot(path=str(OUT / "t4-after-bomb.png"))

            # 5. Staged shots + determinism
            hashes = {}
            for name in SHOTS:
                page.goto(f"http://127.0.0.1:{port}/?shot={name}&seed=7")
                page.wait_for_function("window.__shotReady === true", timeout=30000)
                dest = OUT / f"shot-{name}.png"
                page.screenshot(path=str(dest))
                print(f"shot {name}: ready, {dest.stat().st_size} bytes")
                if name == "play":
                    hashes["play1"] = sha(dest)
            page.goto(f"http://127.0.0.1:{port}/?shot=play&seed=7")
            page.wait_for_function("window.__shotReady === true", timeout=30000)
            dest = OUT / "shot-play-again.png"
            page.screenshot(path=str(dest))
            hashes["play2"] = sha(dest)
            print("play determinism:", hashes["play1"], "vs", hashes["play2"],
                  "IDENTICAL" if hashes["play1"] == hashes["play2"] else "DIFFERENT")
            if hashes["play1"] != hashes["play2"]:
                ok = False
            browser.close()
    finally:
        server.terminate()
    if errors:
        print("CONSOLE/PAGE ERRORS:")
        for e in errors:
            print("  ", e)
        ok = False
    else:
        print("no console/page errors")
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
