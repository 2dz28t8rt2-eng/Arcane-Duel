import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

WRAPPER = Path(__file__).resolve().parents[1] / 'scripts/run-ci-chrome.py'


class BoundedChromeTests(unittest.TestCase):
    def run_browser(self, code, *args):
        env = {**os.environ, 'ARCANE_CHROME_BIN': sys.executable, 'ARCANE_CHROME_TIMEOUT': '.35'}
        return subprocess.run([sys.executable, str(WRAPPER), '-c', code, *map(str, args)],
                              capture_output=True, text=True, env=env, timeout=10)

    def test_success_returns_exact_dom(self):
        result = self.run_browser("print('<html data-check=pass>complete</html>')")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, '<html data-check=pass>complete</html>\n')

    def test_real_failure_is_not_retried(self):
        with tempfile.TemporaryDirectory() as folder:
            marker = Path(folder) / 'attempts'
            result = self.run_browser("from pathlib import Path; import sys; p=Path(sys.argv[1]); p.write_text(p.read_text()+'x' if p.exists() else 'x'); print('failure',file=sys.stderr); sys.exit(7)", marker)
            self.assertEqual(result.returncode, 7)
            self.assertEqual(marker.read_text(), 'x')
            self.assertIn('failure', result.stderr)

    def test_timeout_retries_with_only_complete_output(self):
        with tempfile.TemporaryDirectory() as folder:
            marker = Path(folder) / 'attempted'
            result = self.run_browser("from pathlib import Path; import time,sys; p=Path(sys.argv[1]); first=not p.exists(); p.touch(); print('partial' if first else 'complete',flush=True); time.sleep(60 if first else 0)", marker)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout, 'complete\n')
            self.assertIn('attempt 1/2', result.stderr)

    def test_repeated_timeout_fails_without_partial_pass(self):
        result = self.run_browser("import time; print('data-test=pass',flush=True); time.sleep(60)")
        self.assertEqual(result.returncode, 124)
        self.assertEqual(result.stdout, '')
        self.assertIn('attempt 2/2', result.stderr)


if __name__ == '__main__':
    unittest.main()
