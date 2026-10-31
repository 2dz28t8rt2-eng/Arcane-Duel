"""Dry-run retention tests: never import the privileged deployment entrypoint."""
from pathlib import Path
import ast
import re
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
DEPLOY = ROOT / "server" / "deploy-release.py"


def load_retention(releases, upload):
    source = ast.parse(DEPLOY.read_text(encoding="utf-8"))
    fn = next(n for n in source.body if isinstance(n, ast.FunctionDef)
              and n.name == "prune_committed_releases")
    module = ast.Module(body=[fn], type_ignores=[])
    ns = {"re": re, "shutil": shutil, "releases": releases, "upload": upload}
    exec(compile(module, str(DEPLOY), "exec"), ns)
    return ns["prune_committed_releases"]


class RetentionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.releases = self.root / "releases"
        self.upload = self.root / "uploads"
        self.releases.mkdir()
        self.upload.mkdir()
        self.keep = load_retention(self.releases, self.upload)

    def make_release(self, c):
        name = "v229-" + c * 12
        p = self.releases / name
        p.mkdir()
        (p / "index.html").write_text("solo and duo " + c)
        for suffix in (".tar.gz", ".tar.gz.sha256"):
            (self.upload / (name + suffix)).write_text("archive " + c)
        return p

    def test_v1_v2_v3_only_keeps_v2_and_v3(self):
        v1, v2, v3 = [self.make_release(c) for c in "abc"]
        uploads_unrelated = self.upload / "other-project.zip"
        uploads_unrelated.write_text("other")
        (self.releases / ".staging-not-committed").mkdir()
        userdata = self.root / "private.sqlite"
        userdata.write_text("player data untouched")
        r = self.keep(v3, v2)
        self.assertEqual(r["kept"], sorted([v2.name, v3.name]))
        self.assertEqual(r["removed"], [v1.name])
        self.assertFalse(v1.exists())
        self.assertFalse((self.upload / (v1.name + ".tar.gz")).exists())
        self.assertFalse((self.upload / (v1.name + ".tar.gz.sha256")).exists())
        for p in (v2, v3):
            self.assertTrue((p / "index.html").is_file())
            self.assertTrue((self.upload / (p.name + ".tar.gz")).is_file())
            self.assertTrue((self.upload / (p.name + ".tar.gz.sha256")).is_file())
        self.assertTrue(uploads_unrelated.exists())
        self.assertTrue((self.releases / ".staging-not-committed").exists())
        self.assertEqual(userdata.read_text(), "player data untouched")

    def test_fourth_release_removes_second_version(self):
        v1, v2, v3, v4 = [self.make_release(c) for c in "abcd"]
        self.keep(v3, v2)
        result = self.keep(v4, v3)
        self.assertEqual(result["kept"], sorted([v3.name, v4.name]))
        self.assertFalse(v1.exists())
        self.assertFalse(v2.exists())
        self.assertTrue(v3.exists())
        self.assertTrue(v4.exists())

    def test_single_release_keeps_only_first(self):
        v1 = self.make_release("a")
        result = self.keep(v1, None)
        self.assertEqual(result["kept"], [v1.name])

    def test_symlink_outside_release_directory_is_not_deleted(self):
        v1, v2, v3 = [self.make_release(c) for c in "abc"]
        unsafe = self.root / "external-secret.txt"
        unsafe.write_text("preserve")
        (self.releases / ("v229-" + "d"*12)).symlink_to(unsafe)
        with self.assertRaisesRegex(RuntimeError, "Unsafe retired release"):
            self.keep(v3, v2)
        self.assertEqual(unsafe.read_text(), "preserve")

    def test_rejects_unknown_previous_path_without_deleting(self):
        v1, v2 = [self.make_release(c) for c in "ab"]
        fake = self.root / "different-app"
        fake.mkdir()
        with self.assertRaisesRegex(RuntimeError, "Unsafe release path"):
            self.keep(v2, fake)
        self.assertTrue(v1.exists())


if __name__ == "__main__":
    unittest.main()
