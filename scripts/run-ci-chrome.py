#!/usr/bin/env python3
"""Bound a Chrome fixture and retry only a timed-out browser process once."""
import os
import signal
import subprocess
import sys


def main():
    command = [os.environ['ARCANE_CHROME_BIN'], *sys.argv[1:]]
    limit = float(os.environ.get('ARCANE_CHROME_TIMEOUT', '90'))
    if limit <= 0:
        raise ValueError('Browser timeout must be positive')
    for attempt in range(2):
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   start_new_session=True)
        try:
            output, error = process.communicate(timeout=limit)
        except subprocess.TimeoutExpired:
            if os.name == 'posix':
                os.killpg(process.pid, signal.SIGKILL)
            else:
                process.kill()
            _, error = process.communicate(timeout=10)
            sys.stderr.buffer.write(error)
            print(f'Chrome fixture timed out after {limit}s (attempt {attempt + 1}/2): '
                  + ' '.join(sys.argv[1:]), file=sys.stderr, flush=True)
            # Never leak a partial DOM/pass marker from the interrupted attempt.
            continue
        sys.stdout.buffer.write(output)
        sys.stderr.buffer.write(error)
        return process.returncode
    return 124


if __name__ == '__main__':
    sys.exit(main())
