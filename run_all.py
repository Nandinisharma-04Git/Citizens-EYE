"""
Convenience launcher for Citizen's Eye dev stack.

Usage (from repo root):
    python run_all.py

This script spawns two subprocesses:
1) Flask backend via `python app.py`
2) Vite frontend via `npm run dev` with VITE_API_BASE_URL preset

Press Ctrl+C to stop both.
"""

import os
import signal
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

NPM_BIN = "npm.cmd" if os.name == "nt" else "npm"

processes = []


def spawn(cmd, cwd, extra_env=None, title="process"):
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    print(f"[launcher] starting {title}: {' '.join(cmd)} (cwd={cwd})")
    proc = subprocess.Popen(cmd, cwd=cwd, env=env)
    processes.append(proc)


def shutdown(*_):
    print("\n[launcher] shutting down child processes...")
    for proc in processes:
        if proc.poll() is None:
            proc.terminate()
    for proc in processes:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    sys.exit(0)


def main():
    if not BACKEND_DIR.exists() or not FRONTEND_DIR.exists():
        print("[launcher] backend or frontend directory missing.")
        sys.exit(1)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    spawn(
        [sys.executable, "app.py"],
        cwd=BACKEND_DIR,
        title="Flask backend",
    )
    spawn(
        [NPM_BIN, "run", "dev"],
        cwd=FRONTEND_DIR,
        extra_env={"VITE_API_BASE_URL": "http://127.0.0.1:5000/api"},
        title="React frontend",
    )
    print("[launcher] both services running. Press Ctrl+C to stop.")

    for proc in processes:
        proc.wait()


if __name__ == "__main__":
    main()














