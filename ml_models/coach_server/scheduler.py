"""Simple scheduler stub for coach proactive messages.
This is a minimal in-process scheduler for development; replace with APScheduler or background worker in production.
"""
import time
from threading import Thread


class Scheduler:
    def __init__(self):
        self._jobs = []

    def schedule(self, user_id: str, job_type: str, when_seconds: int, payload: dict = None):
        self._jobs.append((time.time() + when_seconds, user_id, job_type, payload))

    def run(self):
        def _loop():
            while True:
                now = time.time()
                ready = [j for j in self._jobs if j[0] <= now]
                for j in ready:
                    _, user_id, job_type, payload = j
                    print(f"Running job {job_type} for {user_id}")
                    try:
                        # call job handler (stub)
                        pass
                    finally:
                        self._jobs.remove(j)
                time.sleep(1)
        t = Thread(target=_loop, daemon=True)
        t.start()

