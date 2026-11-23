"""Gera audixlog_v79.zip com o código do projeto (inclui .env e .gitignore; exclui node_modules, dist, harness/dist-*, tmp e .git)."""
import os
import zipfile

ROOT = os.path.abspath('.')
OUT = 'audixlog_v79.zip'
SKIP_DIRS = {'node_modules', 'dist', '.git', 'tmp'}
SKIP_PREFIX = ('harness/dist-',)

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT).replace('\\', '/')
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not (rel_dir + '/' + d).lstrip('./').startswith(SKIP_PREFIX)]
        for f in filenames:
            rel = os.path.normpath(os.path.join(rel_dir, f)).replace('\\', '/')
            if rel == OUT or rel.startswith(SKIP_PREFIX) or rel.startswith('tmp/'):
                continue
            z.write(os.path.join(dirpath, f), rel)
print(OUT, os.path.getsize(OUT))
